/**
 * Retrieval-Augmented Generation (RAG) Service
 * Combines document processing, vector search, and AI generation
 */

import { documentProcessor, DocumentStructure } from './document-processor';
import { vectorDatabase, VectorSearchResult } from './vector-database';
import { aiOrchestrator } from '../ai/unified-ai-orchestrator';
import { cacheManager, CacheKeys } from '../cache/redis-client';
import { HfInference } from '@huggingface/inference';
import crypto from 'crypto';
import type { ProcessedNote, AISettings } from '@shared/schema';

export interface RAGContext {
  noteId: number;
  collectionId: string;
  originalContent: string;
  processedStructure?: DocumentStructure;
  lastUpdated: Date;
}

export interface RAGQueryResult {
  answer: string;
  sources: VectorSearchResult[];
  confidence: number;
  processingTime: number;
  usedContext: string;
  metadata: {
    totalChunks: number;
    relevantChunks: number;
    averageSimilarity: number;
    modelUsed: string;
  };
}

export interface EnhancedProcessingOptions {
  useRAG: boolean;
  maxContextTokens: number;
  similarityThreshold: number;
  rerank: boolean;
  includeOriginalContent: boolean;
  enhanceWithWebResearch: boolean;
}

export class RAGService {
  private hf: HfInference;
  private contexts: Map<number, RAGContext> = new Map();
  private embeddingModel = 'sentence-transformers/all-MiniLM-L6-v2';

  constructor() {
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY || "");
  }

  /**
   * Initialize RAG context for a document
   */
  async initializeDocumentContext(
    noteId: number,
    content: string,
    settings: AISettings = {
      summaryStyle: 'academic',
      detailLevel: 3,
      includeExamples: true,
      useMultipleModels: true,
      designStyle: 'modern'
    }
  ): Promise<RAGContext> {
    console.log(`🔄 Initializing RAG context for note ${noteId}...`);
    
    try {
      // Process document into chunks with embeddings
      const documentStructure = await documentProcessor.processDocument(content, {
        maxChunkSize: 800,
        overlapSize: 100,
        preserveSemanticBoundaries: true,
        generateEmbeddings: true,
        analysisLevel: 'advanced'
      });

      // Create vector collection
      const collectionId = await vectorDatabase.createCollection(`note_${noteId}`);
      
      // Add chunks to vector database
      await vectorDatabase.addChunks(collectionId, documentStructure.chunks);

      // Create RAG context
      const ragContext: RAGContext = {
        noteId,
        collectionId,
        originalContent: content,
        processedStructure: documentStructure,
        lastUpdated: new Date()
      };

      // Cache the context
      this.contexts.set(noteId, ragContext);
      await this.cacheRAGContext(ragContext);

      console.log(`✅ RAG context initialized: ${documentStructure.chunks.length} chunks indexed`);
      return ragContext;

    } catch (error) {
      console.error('RAG context initialization failed:', error);
      
      // Fallback context
      const fallbackContext: RAGContext = {
        noteId,
        collectionId: await vectorDatabase.createCollection(`note_${noteId}_fallback`),
        originalContent: content,
        lastUpdated: new Date()
      };
      
      this.contexts.set(noteId, fallbackContext);
      return fallbackContext;
    }
  }

  /**
   * Process content with RAG enhancement
   */
  async processContentWithRAG(
    content: string,
    settings: AISettings,
    options: EnhancedProcessingOptions = {
      useRAG: true,
      maxContextTokens: 2000,
      similarityThreshold: 0.3,
      rerank: true,
      includeOriginalContent: false,
      enhanceWithWebResearch: false
    }
  ): Promise<ProcessedNote> {
    console.log('🤖 Processing content with RAG enhancement...');
    
    try {
      let enhancedContent = content;
      let ragSources: VectorSearchResult[] = [];

      if (options.useRAG) {
        // Create temporary context for content analysis
        const tempNoteId = Date.now();
        const ragContext = await this.initializeDocumentContext(tempNoteId, content, settings);
        
        // Generate query embedding for self-retrieval
        const queryEmbedding = await this.generateQueryEmbedding(content.substring(0, 500));
        
        // Retrieve relevant context
        const contextResult = await vectorDatabase.retrieveContext(
          ragContext.collectionId,
          content.substring(0, 500),
          queryEmbedding,
          options.maxContextTokens
        );

        if (contextResult.sources.length > 0) {
          enhancedContent = this.combineContentWithContext(content, contextResult.context);
          ragSources = contextResult.sources;
          console.log(`✅ Enhanced content with ${contextResult.sources.length} relevant chunks`);
        }

        // Cleanup temporary context
        await vectorDatabase.deleteCollection(ragContext.collectionId);
        this.contexts.delete(tempNoteId);
      }

      // Process with AI orchestrator using enhanced content
      const result = await aiOrchestrator.processWithMultipleModels(
        enhancedContent,
        settings,
        {
          contentType: 'text',
          contentLength: enhancedContent.length,
          priority: 'medium',
          userTier: 'pro',
          maxCost: 1.0,
          timeoutMs: 30000
        }
      );

      // Add RAG metadata
      const enhancedResult = {
        ...result.data,
        metadata: {
          ...result.data.metadata,
          ragEnhanced: options.useRAG,
          ragSources: ragSources.length,
          averageSimilarity: ragSources.length > 0 
            ? ragSources.reduce((sum, source) => sum + source.similarity, 0) / ragSources.length 
            : 0
        }
      };

      return enhancedResult;

    } catch (error) {
      console.error('RAG-enhanced processing failed:', error);
      
      // Fallback to standard processing
      const result = await aiOrchestrator.processWithMultipleModels(
        content,
        settings,
        {
          contentType: 'text',
          contentLength: content.length,
          priority: 'medium',
          userTier: 'free',
          maxCost: 0.5,
          timeoutMs: 20000
        }
      );

      return result.data;
    }
  }

  /**
   * Answer questions using RAG
   */
  async answerQuestion(
    noteId: number,
    question: string,
    options: EnhancedProcessingOptions = {
      useRAG: true,
      maxContextTokens: 1500,
      similarityThreshold: 0.4,
      rerank: true,
      includeOriginalContent: true,
      enhanceWithWebResearch: false
    }
  ): Promise<RAGQueryResult> {
    console.log(`🔍 Answering question for note ${noteId} using RAG...`);
    const startTime = Date.now();

    try {
      // Get or restore RAG context
      let ragContext = this.contexts.get(noteId);
      if (!ragContext) {
        const restored = await this.restoreRAGContext(noteId);
        if (!restored) {
          throw new Error(`RAG context not found for note ${noteId}`);
        }
        ragContext = restored;
      }

      // Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(question);
      
      // Retrieve relevant context
      const contextResult = await vectorDatabase.retrieveContext(
        ragContext.collectionId,
        question,
        queryEmbedding,
        options.maxContextTokens
      );

      // Build enhanced prompt with context
      let contextualPrompt = question;
      if (contextResult.context) {
        contextualPrompt = `Context from the document:
${contextResult.context}

Question: ${question}

Please provide a comprehensive answer based on the context provided above. If the context doesn't contain enough information to fully answer the question, mention what additional information might be needed.`;
      }

      // Generate answer using AI orchestrator
      const response = await aiOrchestrator.processWithMultipleModels(
        contextualPrompt,
        {
          summaryStyle: 'academic',
          detailLevel: 4,
          includeExamples: true,
          useMultipleModels: true,
          designStyle: 'modern'
        },
        {
          contentType: 'text',
          contentLength: contextualPrompt.length,
          priority: 'high',
          userTier: 'pro',
          maxCost: 1.5,
          timeoutMs: 25000
        }
      );

      // Extract answer from the processed note
      const answer = this.extractAnswerFromProcessedNote(response.data, question);
      
      // Calculate confidence based on similarity and response quality
      const avgSimilarity = contextResult.sources.length > 0
        ? contextResult.sources.reduce((sum, source) => sum + source.similarity, 0) / contextResult.sources.length
        : 0;
      
      const confidence = Math.min(avgSimilarity + response.confidence, 1.0);

      const processingTime = Date.now() - startTime;

      console.log(`✅ Question answered in ${processingTime}ms with ${contextResult.sources.length} sources`);

      return {
        answer,
        sources: contextResult.sources,
        confidence,
        processingTime,
        usedContext: contextResult.context,
        metadata: {
          totalChunks: ragContext.processedStructure?.chunks.length || 0,
          relevantChunks: contextResult.sources.length,
          averageSimilarity: avgSimilarity,
          modelUsed: response.model
        }
      };

    } catch (error) {
      console.error('RAG question answering failed:', error);
      
      return {
        answer: "I'm sorry, but I encountered an error while processing your question. Please try rephrasing your question or check if the document is properly loaded.",
        sources: [],
        confidence: 0.1,
        processingTime: Date.now() - startTime,
        usedContext: '',
        metadata: {
          totalChunks: 0,
          relevantChunks: 0,
          averageSimilarity: 0,
          modelUsed: 'error-fallback'
        }
      };
    }
  }

  /**
   * Generate study questions based on document content
   */
  async generateStudyQuestions(
    noteId: number,
    count: number = 5,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<Array<{
    question: string;
    answer: string;
    difficulty: string;
    topic: string;
    sources: VectorSearchResult[];
  }>> {
    try {
      const ragContext = this.contexts.get(noteId);
      if (!ragContext) {
        throw new Error(`RAG context not found for note ${noteId}`);
      }

      // Get diverse chunks for question generation
      const stats = await vectorDatabase.getCollectionStats(ragContext.collectionId);
      if (!stats || stats.totalChunks === 0) {
        return [];
      }

      // Sample chunks from different parts of the document
      const sampleSize = Math.min(stats.totalChunks, count * 2);
      const chunks = ragContext.processedStructure?.chunks.slice(0, sampleSize) || [];
      
      const questions = [];

      for (let i = 0; i < Math.min(count, chunks.length); i++) {
        const chunk = chunks[i];
        
        // Generate question based on chunk content
        const questionPrompt = `Based on the following content, generate a ${difficulty} level study question that tests understanding:

${chunk.content}

Generate a clear, specific question that would help a student learn and remember this material.`;

        const response = await aiOrchestrator.processWithMultipleModels(
          questionPrompt,
          {
            summaryStyle: 'qna',
            detailLevel: 3,
            includeExamples: false,
            useMultipleModels: false,
            designStyle: 'academic'
          },
          {
            contentType: 'text',
            contentLength: questionPrompt.length,
            priority: 'medium',
            userTier: 'pro',
            maxCost: 0.5,
            timeoutMs: 15000
          }
        );

        // Extract question and answer from response
        const questionData = this.parseQuestionResponse(response.data);
        
        if (questionData.question && questionData.answer) {
          questions.push({
            ...questionData,
            difficulty,
            topic: this.extractTopic(chunk.content),
            sources: [{ chunk, similarity: 1.0, relevanceScore: 1.0 }]
          });
        }
      }

      console.log(`✅ Generated ${questions.length} study questions`);
      return questions;

    } catch (error) {
      console.error('Study question generation failed:', error);
      return [];
    }
  }

  /**
   * Get similar content for content expansion
   */
  async getSimilarContent(
    noteId: number,
    query: string,
    limit: number = 3
  ): Promise<VectorSearchResult[]> {
    try {
      const ragContext = this.contexts.get(noteId);
      if (!ragContext) {
        return [];
      }

      const queryEmbedding = await this.generateQueryEmbedding(query);
      
      return await vectorDatabase.semanticSearch(
        ragContext.collectionId,
        queryEmbedding,
        {
          topK: limit,
          minSimilarity: 0.3,
          includeMetadata: true,
          rerank: true
        }
      );

    } catch (error) {
      console.error('Similar content retrieval failed:', error);
      return [];
    }
  }

  /**
   * Utility methods
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    const cacheKey = CacheKeys.aiResponse(
      crypto.createHash('sha256').update(query).digest('hex').substring(0, 16),
      'query-embedding'
    );

    try {
      const cached = await cacheManager.get<number[]>(cacheKey);
      if (cached) return cached;
    } catch (error) {
      console.warn('Query embedding cache retrieval failed:', error);
    }

    try {
      const response = await this.hf.featureExtraction({
        model: this.embeddingModel,
        inputs: query.substring(0, 512)
      });

      let embedding: number[];
      if (Array.isArray(response)) {
        embedding = response as number[];
      } else if (Array.isArray(response[0])) {
        embedding = response[0] as number[];
      } else {
        throw new Error('Unexpected embedding format');
      }

      // Cache the result
      try {
        await cacheManager.set(cacheKey, embedding, 3600); // 1 hour
      } catch (error) {
        console.warn('Query embedding cache storage failed:', error);
      }

      return embedding;

    } catch (error) {
      console.warn('Query embedding generation failed:', error);
      return new Array(384).fill(0);
    }
  }

  private combineContentWithContext(originalContent: string, context: string): string {
    return `Original Content:
${originalContent}

Additional Context:
${context}

Please analyze the original content and use the additional context to provide enhanced insights and understanding.`;
  }

  private extractAnswerFromProcessedNote(processedNote: ProcessedNote, question: string): string {
    // Try to extract a relevant answer from the processed note
    if (processedNote.summaryPoints && processedNote.summaryPoints.length > 0) {
      const relevantPoints = processedNote.summaryPoints
        .flatMap(section => section.points)
        .join(' ');
      
      if (relevantPoints.length > 50) {
        return relevantPoints;
      }
    }

    if (processedNote.keyConcepts && processedNote.keyConcepts.length > 0) {
      const concepts = processedNote.keyConcepts
        .map(concept => `${concept.title}: ${concept.definition}`)
        .join(' ');
      
      return concepts;
    }

    return "Based on the available information, I can provide some insights, but a more specific answer would require additional context.";
  }

  private parseQuestionResponse(processedNote: ProcessedNote): { question: string; answer: string } {
    // Extract question and answer from processed note
    let question = '';
    let answer = '';

    if (processedNote.title) {
      question = processedNote.title.endsWith('?') 
        ? processedNote.title 
        : `What is ${processedNote.title}?`;
    }

    if (processedNote.summaryPoints && processedNote.summaryPoints.length > 0) {
      answer = processedNote.summaryPoints
        .flatMap(section => section.points)
        .join(' ');
    } else if (processedNote.keyConcepts && processedNote.keyConcepts.length > 0) {
      answer = processedNote.keyConcepts
        .map(concept => concept.definition)
        .join(' ');
    }

    return { question, answer: answer || "This concept requires further study." };
  }

  private extractTopic(content: string): string {
    const firstSentence = content.split('.')[0];
    const words = firstSentence.split(' ').slice(0, 5);
    return words.join(' ').replace(/[^\w\s]/g, '');
  }

  private async cacheRAGContext(context: RAGContext): Promise<void> {
    const cacheKey = CacheKeys.aiResponse(context.noteId.toString(), 'rag-context');
    try {
      await cacheManager.set(cacheKey, {
        noteId: context.noteId,
        collectionId: context.collectionId,
        lastUpdated: context.lastUpdated.toISOString()
      }, 86400 * 7); // 7 days
    } catch (error) {
      console.warn('RAG context caching failed:', error);
    }
  }

  private async restoreRAGContext(noteId: number): Promise<RAGContext | null> {
    const cacheKey = CacheKeys.aiResponse(noteId.toString(), 'rag-context');
    try {
      const cached = await cacheManager.get<{
        noteId: number;
        collectionId: string;
        lastUpdated: string;
      }>(cacheKey);

      if (cached) {
        // Try to restore vector collection
        const restored = await vectorDatabase.restoreCollection(cached.collectionId);
        if (restored) {
          const context: RAGContext = {
            noteId: cached.noteId,
            collectionId: cached.collectionId,
            originalContent: '', // Will be loaded separately if needed
            lastUpdated: new Date(cached.lastUpdated)
          };

          this.contexts.set(noteId, context);
          return context;
        }
      }
    } catch (error) {
      console.warn('RAG context restoration failed:', error);
    }

    return null;
  }
}

// Singleton instance
export const ragService = new RAGService();