import { summarizeContentWithGemini } from './gemini';
import { processWithMultipleModels } from './multi-model-ai';
import { chatAIService } from './chat-ai';
import { HTMLRenderer } from './html-renderer';
import { TemplatePDFGenerator } from './template-pdf-generator';
import { DocumentSchema, Document } from '@shared/template-schema';
import { extractTextFromPDF } from './pdf';

/**
 * Integrated NoteGPT Service - Combines all AI capabilities with template engine
 * Provides complete workflow from content input to document generation
 */
export class NoteGPTIntegrationService {
  private htmlRenderer: HTMLRenderer;
  private pdfGenerator: TemplatePDFGenerator;

  constructor() {
    this.htmlRenderer = new HTMLRenderer();
    this.pdfGenerator = new TemplatePDFGenerator();
  }

  /**
   * Complete content processing pipeline
   */
  async processContent(input: {
    content?: string;
    files?: Buffer[];
    settings: {
      summaryStyle: string;
      detailLevel: number;
      includeExamples: boolean;
      useMultipleModels: boolean;
      designStyle: string;
    };
  }) {
    try {
      // Stage 1: Extract text from files if provided
      let fullContent = input.content || '';
      if (input.files && input.files.length > 0) {
        for (const fileBuffer of input.files) {
          try {
            const extractedText = await extractTextFromPDF(fileBuffer);
            fullContent += '\n\n' + extractedText;
          } catch (error) {
            console.warn('Failed to extract text from file:', error);
          }
        }
      }

      if (!fullContent.trim()) {
        throw new Error('No content to process');
      }

      // Stage 2: AI Processing
      let aiResult;
      if (input.settings.useMultipleModels) {
        // Use multi-model AI processing for enhanced results
        aiResult = await processWithMultipleModels(fullContent, {
          summaryStyle: input.settings.summaryStyle,
          detailLevel: input.settings.detailLevel,
          includeExamples: input.settings.includeExamples,
          designStyle: input.settings.designStyle
        });
      } else {
        // Use single model (Gemini) processing
        aiResult = await summarizeContentWithGemini(fullContent, {
          summaryStyle: input.settings.summaryStyle,
          detailLevel: input.settings.detailLevel,
          includeExamples: input.settings.includeExamples
        });
      }

      // Stage 3: Structure into document format
      const structuredDocument = this.structureAIResponse(aiResult, input.settings);

      // Stage 4: Validate document structure
      const validatedDocument = DocumentSchema.parse(structuredDocument);

      return {
        success: true,
        originalContent: fullContent,
        aiResult,
        document: validatedDocument,
        metadata: {
          contentLength: fullContent.length,
          processingTime: Date.now(),
          aiModel: input.settings.useMultipleModels ? 'multi-model' : 'gemini',
          blockCount: validatedDocument.blocks.length
        }
      };
    } catch (error) {
      console.error('Content processing error:', error);
      throw new Error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate document in multiple formats
   */
  async generateDocument(document: Document, formats: string[] = ['html']) {
    const results: { [format: string]: string | Buffer } = {};

    try {
      for (const format of formats) {
        switch (format.toLowerCase()) {
          case 'html':
            results.html = this.htmlRenderer.render(document, {
              format: 'html',
              includeAnnotations: true,
              includeTOC: true
            });
            break;

          case 'pdf':
            try {
              results.pdf = await this.pdfGenerator.generatePDF(document, {
                format: 'pdf',
                includeAnnotations: true,
                includeTOC: true,
                pageNumbers: true
              });
            } catch (error) {
              console.warn('PDF generation failed, providing HTML instead:', error);
              results.pdf_fallback = this.htmlRenderer.render(document, { format: 'html' });
            }
            break;

          default:
            console.warn(`Unsupported format: ${format}`);
        }
      }

      return {
        success: true,
        formats: Object.keys(results),
        documents: results
      };
    } catch (error) {
      console.error('Document generation error:', error);
      throw new Error(`Document generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Chat with AI about generated content
   */
  async chatAboutContent(message: string, context: any, noteId?: string) {
    try {
      const chatContext = {
        previousContent: context,
        noteId,
        conversationHistory: []
      };

      const response = await chatAIService.processMessage(message, chatContext);

      return {
        success: true,
        response: response.response,
        suggestions: response.suggestions || [],
        metadata: {
          responseTime: Date.now(),
          confidence: response.confidence || 0.8
        }
      };
    } catch (error) {
      console.error('Chat processing error:', error);
      throw new Error(`Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert AI response to structured document format
   */
  private structureAIResponse(aiResult: any, settings: any): Document {
    const blocks: any[] = [];
    
    // Add title/summary
    if (aiResult.title || aiResult.summary) {
      blocks.push({
        id: 'title',
        type: 'heading',
        level: 1,
        text: aiResult.title || 'AI Generated Notes',
        importance: 0.95
      });

      if (aiResult.summary && aiResult.summary !== aiResult.title) {
        blocks.push({
          id: 'summary',
          type: 'paragraph',
          text: aiResult.summary,
          importance: 0.9,
          styleHints: { emphasis: 'italic' }
        });
      }
    }

    // Add key concepts
    if (aiResult.processedContent?.keyConcepts && Array.isArray(aiResult.processedContent.keyConcepts)) {
      blocks.push({
        id: 'concepts-heading',
        type: 'heading',
        level: 2,
        text: 'Key Concepts',
        importance: 0.8
      });

      aiResult.processedContent.keyConcepts.forEach((concept: any, index: number) => {
        const title = concept.title || concept.concept || `Concept ${index + 1}`;
        const definition = concept.definition || concept.description || 'No definition available';
        
        blocks.push({
          id: `concept-${index}`,
          type: 'paragraph',
          text: `**${title}**: ${definition}`,
          importance: 0.7,
          annotations: [{
            type: 'highlight',
            span: [0, title.length + 1],
            color: '#FFE082'
          }]
        });
      });
    }

    // Add summary points
    if (aiResult.processedContent?.summaryPoints && Array.isArray(aiResult.processedContent.summaryPoints)) {
      blocks.push({
        id: 'summary-heading',
        type: 'heading',
        level: 2,
        text: 'Summary Points',
        importance: 0.8
      });

      aiResult.processedContent.summaryPoints.forEach((section: any, sectionIndex: number) => {
        if (typeof section === 'object' && section.heading) {
          // Structured section with heading and points
          blocks.push({
            id: `section-${sectionIndex}`,
            type: 'heading',
            level: 3,
            text: section.heading,
            importance: 0.6
          });

          if (section.points && Array.isArray(section.points)) {
            blocks.push({
              id: `section-points-${sectionIndex}`,
              type: 'list',
              ordered: false,
              items: section.points.slice(0, 10), // Limit to 10 points
              importance: 0.5
            });
          }
        } else {
          // Simple point
          const pointText = typeof section === 'string' ? section : 
                           section.text || section.point || 'Summary point';
          blocks.push({
            id: `point-${sectionIndex}`,
            type: 'paragraph',
            text: `• ${pointText}`,
            importance: 0.5
          });
        }
      });
    }

    // Add original content if no structured content
    if (blocks.length <= 2 && aiResult.originalContent) {
      blocks.push({
        id: 'original-content',
        type: 'heading',
        level: 2,
        text: 'Content',
        importance: 0.6
      });

      // Split long content into paragraphs
      const paragraphs = aiResult.originalContent.split('\n\n').filter((p: string) => p.trim());
      paragraphs.slice(0, 20).forEach((paragraph: string, index: number) => {
        blocks.push({
          id: `content-${index}`,
          type: 'paragraph',
          text: paragraph.trim(),
          importance: 0.4
        });
      });
    }

    // Determine theme based on design style
    const themeMapping: { [key: string]: string } = {
      'academic': 'academic',
      'modern': 'modern-card', 
      'minimal': 'compact-notes',
      'colorful': 'presentation'
    };

    return {
      meta: {
        title: aiResult.title || 'AI Generated Notes',
        author: 'NoteGPT AI Assistant',
        date: new Date().toISOString().split('T')[0],
        tags: ['ai-generated', 'notes', settings.summaryStyle],
        language: 'en'
      },
      outline: blocks
        .filter(block => block.type === 'heading')
        .map((heading, index) => ({
          id: heading.id,
          level: heading.level,
          title: heading.text,
          weight: heading.importance
        })),
      blocks,
      styles: {
        theme: themeMapping[settings.designStyle] || 'modern-card',
        palette: this.getThemePalette(settings.designStyle),
        fontPair: {
          heading: 'Inter',
          body: 'Roboto'
        },
        spacing: settings.detailLevel > 3 ? 'relaxed' : 'normal',
        pageSize: 'A4'
      }
    };
  }

  /**
   * Get color palette based on design style
   */
  private getThemePalette(designStyle: string): string[] {
    const palettes: { [key: string]: string[] } = {
      'academic': ['#1a365d', '#2d3748', '#f7fafc'],
      'modern': ['#0B2140', '#19E7FF', '#F6F8FA'],
      'minimal': ['#2d3748', '#4a5568', '#f7fafc'],
      'colorful': ['#9f7aea', '#ed8936', '#f0fff4']
    };

    return palettes[designStyle] || palettes['modern'];
  }

  /**
   * Health check for all integrated services
   */
  async healthCheck() {
    const checks = {
      htmlRenderer: true,
      pdfGenerator: false,
      aiServices: true,
      templateEngine: true
    };

    try {
      checks.pdfGenerator = await this.pdfGenerator.healthCheck();
    } catch (error) {
      console.warn('PDF generator health check failed:', error);
    }

    return {
      status: Object.values(checks).every(Boolean) ? 'healthy' : 'partial',
      services: checks,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const noteGPTIntegration = new NoteGPTIntegrationService();