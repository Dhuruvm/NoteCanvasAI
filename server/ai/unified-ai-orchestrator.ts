import { GoogleGenAI } from "@google/genai";
import { HfInference } from '@huggingface/inference';
import type { ProcessedNote, AISettings } from "@shared/schema";
import { cacheManager, CacheKeys } from "../cache/redis-client";
import crypto from 'crypto';

// AI Model Types
interface AIModel {
  id: string;
  name: string;
  provider: 'gemini' | 'huggingface' | 'openai' | 'anthropic';
  capabilities: AICapability[];
  cost: number; // Cost per 1K tokens
  speed: number; // Requests per minute
  quality: number; // Quality score 1-10
}

interface AICapability {
  type: 'text-generation' | 'text-analysis' | 'layout-analysis' | 'summarization' | 'question-generation';
  proficiency: number; // 1-10 scale
}

// Unified AI Response Interface
interface AIResponse<T = any> {
  data: T;
  model: string;
  tokens: number;
  processingTime: number;
  cached: boolean;
  confidence: number;
}

// AI Processing Context
interface ProcessingContext {
  contentType: 'text' | 'pdf' | 'markdown';
  contentLength: number;
  priority: 'low' | 'medium' | 'high';
  userTier: 'free' | 'pro' | 'enterprise';
  maxCost: number;
  timeoutMs: number;
}

// Advanced AI Orchestrator Class
export class UnifiedAIOrchestrator {
  private gemini: GoogleGenAI;
  private huggingface: HfInference;
  private models: Map<string, AIModel> = new Map();

  constructor() {
    // Initialize AI clients with error handling
    this.gemini = new GoogleGenAI({ 
      apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
    });
    
    this.huggingface = new HfInference(process.env.HUGGINGFACE_API_KEY || "");
    
    this.initializeModels();
  }

  private initializeModels() {
    // Gemini Models
    this.models.set('gemini-2.5-flash', {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'gemini',
      capabilities: [
        { type: 'text-generation', proficiency: 9 },
        { type: 'text-analysis', proficiency: 8 },
        { type: 'summarization', proficiency: 9 }
      ],
      cost: 0.075, // Per 1K tokens
      speed: 60,   // RPM
      quality: 9
    });

    this.models.set('gemini-2.5-pro', {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'gemini',
      capabilities: [
        { type: 'text-generation', proficiency: 10 },
        { type: 'text-analysis', proficiency: 9 },
        { type: 'summarization', proficiency: 10 }
      ],
      cost: 1.25,  // Per 1K tokens
      speed: 30,   // RPM
      quality: 10
    });

    // HuggingFace Models
    this.models.set('mixtral-8x7b', {
      id: 'mixtral-8x7b',
      name: 'Mixtral 8x7B Instruct',
      provider: 'huggingface',
      capabilities: [
        { type: 'text-generation', proficiency: 8 },
        { type: 'text-analysis', proficiency: 7 }
      ],
      cost: 0.27,  // Per 1K tokens
      speed: 20,   // RPM
      quality: 8
    });

    this.models.set('layoutlmv3', {
      id: 'layoutlmv3',
      name: 'LayoutLMv3',
      provider: 'huggingface',
      capabilities: [
        { type: 'layout-analysis', proficiency: 9 }
      ],
      cost: 0.15,
      speed: 30,
      quality: 8
    });
  }

  // Intelligent Model Selection
  private selectOptimalModel(
    task: AICapability['type'], 
    context: ProcessingContext
  ): AIModel | null {
    const candidates = Array.from(this.models.values())
      .filter(model => {
        // Check if model has the required capability
        const capability = model.capabilities.find(cap => cap.type === task);
        if (!capability || capability.proficiency < 6) return false;

        // Check cost constraints
        if (model.cost > context.maxCost) return false;

        // Check API key availability
        if (model.provider === 'gemini' && !this.hasGeminiKey()) return false;
        if (model.provider === 'huggingface' && !this.hasHuggingFaceKey()) return false;

        return true;
      })
      .sort((a, b) => {
        // Prioritize based on user tier and context
        if (context.userTier === 'enterprise') {
          return b.quality - a.quality; // Highest quality first
        } else if (context.priority === 'high') {
          return b.speed - a.speed; // Fastest first
        } else {
          return a.cost - b.cost; // Cheapest first
        }
      });

    return candidates[0] || null;
  }

  // Multi-Model Processing Pipeline
  async processWithMultipleModels(
    content: string,
    settings: AISettings,
    context: ProcessingContext
  ): Promise<AIResponse<ProcessedNote>> {
    const contentHash = this.generateContentHash(content + JSON.stringify(settings));
    const cacheKey = CacheKeys.aiResponse(contentHash, 'multi-model');

    // Check cache first
    try {
      const cached = await cacheManager.get<ProcessedNote>(cacheKey);
      if (cached) {
        console.log('✅ Retrieved from cache:', cacheKey);
        return {
          data: cached,
          model: 'cached',
          tokens: 0,
          processingTime: 0,
          cached: true,
          confidence: 0.95
        };
      }
    } catch (error) {
      console.warn('Cache retrieval failed:', error);
    }

    const startTime = Date.now();
    
    try {
      // Step 1: Primary processing with best available model
      const primaryModel = this.selectOptimalModel('summarization', context);
      if (!primaryModel) {
        throw new Error('No suitable AI model available');
      }

      console.log(`🤖 Using primary model: ${primaryModel.name}`);
      const primaryResult = await this.processWithModel(content, settings, primaryModel);

      // Step 2: Enhancement with secondary models (parallel processing)
      const enhancementPromises = this.getEnhancementTasks(content, primaryResult, context);
      const enhancements = await Promise.allSettled(enhancementPromises);

      // Step 3: Merge results intelligently
      const finalResult = this.mergeAIResults(primaryResult, enhancements);

      // Cache the result
      try {
        await cacheManager.set(cacheKey, finalResult, 7200); // 2 hours
      } catch (error) {
        console.warn('Cache storage failed:', error);
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Multi-model processing completed in ${processingTime}ms`);

      return {
        data: finalResult,
        model: primaryModel.id,
        tokens: this.estimateTokens(content),
        processingTime,
        cached: false,
        confidence: this.calculateConfidence(finalResult)
      };

    } catch (error) {
      console.error('Multi-model processing failed:', error);
      
      // Fallback to simple processing
      return this.fallbackProcessing(content, settings, context);
    }
  }

  // Process with specific model
  private async processWithModel(
    content: string,
    settings: AISettings,
    model: AIModel
  ): Promise<ProcessedNote> {
    switch (model.provider) {
      case 'gemini':
        return this.processWithGemini(content, settings, model.id);
      case 'huggingface':
        return this.processWithHuggingFace(content, settings, model.id);
      default:
        throw new Error(`Unsupported model provider: ${model.provider}`);
    }
  }

  // Gemini processing implementation
  private async processWithGemini(
    content: string,
    settings: AISettings,
    modelId: string
  ): Promise<ProcessedNote> {
    const systemPrompt = this.buildSystemPrompt(settings);
    const userPrompt = this.buildUserPrompt(content, settings);

    const response = await this.gemini.models.generateContent({
      model: modelId,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: this.getResponseSchema()
      },
      contents: userPrompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini AI");
    }

    const parsedData = JSON.parse(rawJson);
    return this.standardizeResponse(parsedData, modelId);
  }

  // HuggingFace processing implementation
  private async processWithHuggingFace(
    content: string,
    settings: AISettings,
    modelId: string
  ): Promise<ProcessedNote> {
    const prompt = this.buildHuggingFacePrompt(content, settings);

    const response = await this.huggingface.textGeneration({
      model: modelId,
      inputs: prompt,
      parameters: {
        max_new_tokens: 2000,
        temperature: 0.7,
        return_full_text: false
      }
    });

    const generatedText = response.generated_text;
    return this.parseHuggingFaceResponse(generatedText, modelId);
  }

  // Enhancement task orchestration
  private getEnhancementTasks(
    content: string,
    primaryResult: ProcessedNote,
    context: ProcessingContext
  ): Promise<any>[] {
    const tasks: Promise<any>[] = [];

    // Layout analysis enhancement
    if (context.contentType === 'pdf') {
      const layoutModel = this.selectOptimalModel('layout-analysis', context);
      if (layoutModel) {
        tasks.push(this.enhanceWithLayoutAnalysis(content, layoutModel));
      }
    }

    // Question generation enhancement
    const questionModel = this.selectOptimalModel('question-generation', context);
    if (questionModel) {
      tasks.push(this.generateStudyQuestions(content, questionModel));
    }

    return tasks;
  }

  // Result merging logic
  private mergeAIResults(primary: ProcessedNote, enhancements: PromiseSettledResult<any>[]): ProcessedNote {
    const result = { ...primary };

    enhancements.forEach((enhancement, index) => {
      if (enhancement.status === 'fulfilled') {
        // Merge enhancement results based on type
        if (enhancement.value.type === 'layout') {
          result.designLayout = enhancement.value.data;
        } else if (enhancement.value.type === 'questions') {
          result.studyQuestions = enhancement.value.data;
        }
      }
    });

    // Update metadata
    result.metadata = {
      ...result.metadata,
      enhancementCount: enhancements.filter(e => e.status === 'fulfilled').length,
      processingMethod: 'multi-model',
      aiModelsUsed: [
        ...result.metadata.aiModelsUsed,
        ...enhancements
          .filter(e => e.status === 'fulfilled')
          .map(e => e.value.model)
      ]
    };

    return result;
  }

  // Utility methods
  private generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  private hasGeminiKey(): boolean {
    return !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY);
  }

  private hasHuggingFaceKey(): boolean {
    return !!process.env.HUGGINGFACE_API_KEY;
  }

  private estimateTokens(content: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(content.length / 4);
  }

  private calculateConfidence(result: ProcessedNote): number {
    // Calculate confidence based on result completeness
    let confidence = 0.5;
    
    if (result.title) confidence += 0.1;
    if (result.keyConcepts?.length > 0) confidence += 0.15;
    if (result.summaryPoints?.length > 0) confidence += 0.15;
    if (result.processFlow?.length > 0) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  // Fallback processing when main pipeline fails
  private async fallbackProcessing(
    content: string,
    settings: AISettings,
    context: ProcessingContext
  ): Promise<AIResponse<ProcessedNote>> {
    console.warn('🔄 Using fallback processing');
    
    const fallbackResult: ProcessedNote = {
      title: content.substring(0, 50) + "...",
      keyConcepts: [{
        title: "Content Available",
        definition: "Your content has been processed with fallback methods. Enhanced AI processing requires API keys."
      }],
      summaryPoints: [{
        heading: "Original Content",
        points: [content.length > 500 ? content.substring(0, 500) + "..." : content]
      }],
      processFlow: [],
      metadata: {
        source: "Fallback processing",
        generatedAt: new Date().toISOString(),
        style: settings.summaryStyle || "academic",
        aiModelsUsed: ["fallback"]
      }
    };

    return {
      data: fallbackResult,
      model: 'fallback',
      tokens: 0,
      processingTime: 100,
      cached: false,
      confidence: 0.3
    };
  }

  // Helper methods for prompt building
  private buildSystemPrompt(settings: AISettings): string {
    return `You are an expert educational content analyzer and note generator specialized in creating structured study materials.

Your task is to transform content into well-organized study notes optimized for learning and retention.

Processing Parameters:
- Summary Style: ${settings.summaryStyle}
- Detail Level: ${settings.detailLevel}/5 (1=brief, 5=comprehensive)
- Include Examples: ${settings.includeExamples}
- Design Style: ${settings.designStyle || 'modern'}

Generate JSON response following the exact schema provided.`;
  }

  private buildUserPrompt(content: string, settings: AISettings): string {
    const maxLength = 8000; // Increased for better processing
    const trimmedContent = content.length > maxLength 
      ? content.substring(0, maxLength) + "..."
      : content;

    return `Analyze and structure the following content into comprehensive study notes:

${trimmedContent}

Requirements:
- Create a descriptive title (max 60 characters)
- Extract 3-7 key concepts with clear definitions
- Organize summary points into logical sections (2-4 sections)
- Include process flows for any procedures or sequences
- Optimize for ${settings.summaryStyle} learning style
- Target detail level: ${settings.detailLevel}/5`;
  }

  private buildHuggingFacePrompt(content: string, settings: AISettings): string {
    return `Transform this content into structured study notes in JSON format:

Content: ${content.substring(0, 2000)}

Output JSON with: title, keyConcepts (array), summaryPoints (array), metadata
Style: ${settings.summaryStyle}
Detail: ${settings.detailLevel}/5`;
  }

  private getResponseSchema() {
    return {
      type: "object",
      properties: {
        title: { type: "string" },
        keyConcepts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              definition: { type: "string" }
            },
            required: ["title", "definition"]
          }
        },
        summaryPoints: {
          type: "array",
          items: {
            type: "object",
            properties: {
              heading: { type: "string" },
              points: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["heading", "points"]
          }
        },
        processFlow: {
          type: "array",
          items: {
            type: "object",
            properties: {
              step: { type: "number" },
              title: { type: "string" },
              description: { type: "string" }
            },
            required: ["step", "title", "description"]
          }
        },
        metadata: {
          type: "object",
          properties: {
            source: { type: "string" },
            generatedAt: { type: "string" },
            style: { type: "string" }
          },
          required: ["source", "generatedAt", "style"]
        }
      },
      required: ["title", "keyConcepts", "summaryPoints", "metadata"]
    };
  }

  private standardizeResponse(data: any, modelId: string): ProcessedNote {
    return {
      ...data,
      metadata: {
        source: data.metadata?.source || "AI Processing",
        generatedAt: new Date().toISOString(),
        style: data.metadata?.style || "academic",
        aiModelsUsed: [modelId]
      }
    };
  }

  private parseHuggingFaceResponse(text: string, modelId: string): ProcessedNote {
    try {
      // Try to parse JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.standardizeResponse(parsed, modelId);
      }
    } catch (error) {
      console.warn('Failed to parse HuggingFace JSON response, using fallback');
    }

    // Fallback: create structured response from text
    return {
      title: "Generated Notes",
      keyConcepts: [
        {
          title: "AI Generated Content",
          definition: "Content processed by advanced language model"
        }
      ],
      summaryPoints: [
        {
          heading: "Main Content",
          points: [text.substring(0, 500)]
        }
      ],
      processFlow: [],
      metadata: {
        source: "HuggingFace AI",
        generatedAt: new Date().toISOString(),
        style: "academic",
        aiModelsUsed: [modelId]
      }
    };
  }

  // Enhancement methods
  private async enhanceWithLayoutAnalysis(content: string, model: AIModel): Promise<any> {
    // Implementation for layout analysis enhancement
    return {
      type: 'layout',
      model: model.id,
      data: {} // Placeholder for layout data
    };
  }

  private async generateStudyQuestions(content: string, model: AIModel): Promise<any> {
    // Implementation for study question generation
    return {
      type: 'questions',
      model: model.id,
      data: [] // Placeholder for questions
    };
  }
}

// Singleton instance
export const aiOrchestrator = new UnifiedAIOrchestrator();