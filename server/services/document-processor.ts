/**
 * Advanced Document Processing Pipeline
 * Implements chunking, embeddings, and semantic analysis as per the architecture document
 */

import { HfInference } from '@huggingface/inference';
import crypto from 'crypto';
import { cacheManager, CacheKeys } from '../cache/redis-client';

export interface DocumentChunk {
  id: string;
  content: string;
  embedding: number[];
  startIndex: number;
  endIndex: number;
  type: 'paragraph' | 'section' | 'heading' | 'table' | 'code' | 'quote';
  metadata: {
    pageNumber?: number;
    sectionTitle?: string;
    wordCount: number;
    charCount: number;
    significance: number; // 0-1 score
  };
}

export interface DocumentStructure {
  title: string;
  chunks: DocumentChunk[];
  outline: Array<{
    level: number;
    title: string;
    startChunk: number;
    endChunk: number;
  }>;
  totalTokens: number;
  processingTime: number;
}

export interface ChunkingOptions {
  maxChunkSize: number; // in tokens
  overlapSize: number; // in tokens
  preserveSemanticBoundaries: boolean;
  generateEmbeddings: boolean;
  analysisLevel: 'basic' | 'advanced';
}

export class AdvancedDocumentProcessor {
  private hf: HfInference;
  private embeddingModel = 'sentence-transformers/all-MiniLM-L6-v2';

  constructor() {
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY || "");
  }

  /**
   * Advanced content chunking with semantic boundary preservation
   */
  async processDocument(
    content: string, 
    options: ChunkingOptions = {
      maxChunkSize: 1000,
      overlapSize: 100,
      preserveSemanticBoundaries: true,
      generateEmbeddings: true,
      analysisLevel: 'advanced'
    }
  ): Promise<DocumentStructure> {
    console.log('🔄 Processing document with advanced chunking...');
    const startTime = Date.now();

    try {
      // Step 1: Content analysis and structure detection
      const structure = await this.analyzeDocumentStructure(content);
      
      // Step 2: Intelligent chunking with semantic boundaries
      const chunks = await this.performAdvancedChunking(content, options);
      
      // Step 3: Generate embeddings for each chunk
      let processedChunks = chunks;
      if (options.generateEmbeddings) {
        processedChunks = await this.generateChunkEmbeddings(chunks);
      }
      
      // Step 4: Calculate significance scores
      processedChunks = await this.calculateChunkSignificance(processedChunks, content);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Document processed: ${processedChunks.length} chunks in ${processingTime}ms`);

      return {
        title: structure.title,
        chunks: processedChunks,
        outline: structure.outline,
        totalTokens: this.estimateTokens(content),
        processingTime
      };

    } catch (error) {
      console.error('Document processing failed:', error);
      
      // Fallback to basic chunking
      return this.basicFallbackProcessing(content, options);
    }
  }

  /**
   * Analyze document structure for intelligent chunking
   */
  private async analyzeDocumentStructure(content: string): Promise<{
    title: string;
    outline: Array<{ level: number; title: string; startChunk: number; endChunk: number; }>;
  }> {
    // Extract document title (first significant line or heading)
    const lines = content.split('\n').filter(line => line.trim());
    const title = this.extractTitle(lines);

    // Detect headings and create outline
    const outline = this.extractOutline(content);

    return { title, outline };
  }

  /**
   * Advanced chunking algorithm with semantic boundary preservation
   */
  private async performAdvancedChunking(
    content: string, 
    options: ChunkingOptions
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    if (options.preserveSemanticBoundaries) {
      // Split by semantic boundaries (paragraphs, sections, etc.)
      const semanticSections = this.splitBySemanticBoundaries(content);
      
      for (let i = 0; i < semanticSections.length; i++) {
        const section = semanticSections[i];
        const sectionChunks = this.chunkSection(section, options, i);
        chunks.push(...sectionChunks);
      }
    } else {
      // Simple token-based chunking
      const simpleChunks = this.performTokenBasedChunking(content, options);
      chunks.push(...simpleChunks);
    }

    return chunks;
  }

  /**
   * Split content by semantic boundaries (paragraphs, headings, lists)
   */
  private splitBySemanticBoundaries(content: string): Array<{
    text: string;
    type: DocumentChunk['type'];
    startIndex: number;
    endIndex: number;
  }> {
    const sections: Array<{
      text: string;
      type: DocumentChunk['type'];
      startIndex: number;
      endIndex: number;
    }> = [];

    const lines = content.split('\n');
    let currentSection = '';
    let currentType: DocumentChunk['type'] = 'paragraph';
    let startIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        if (currentSection) {
          sections.push({
            text: currentSection.trim(),
            type: currentType,
            startIndex,
            endIndex: startIndex + currentSection.length
          });
          startIndex += currentSection.length + 1;
          currentSection = '';
        }
        continue;
      }

      // Detect content type
      const lineType = this.detectContentType(line);
      
      if (lineType !== currentType && currentSection) {
        // New content type, save current section
        sections.push({
          text: currentSection.trim(),
          type: currentType,
          startIndex,
          endIndex: startIndex + currentSection.length
        });
        startIndex += currentSection.length + 1;
        currentSection = line + '\n';
        currentType = lineType;
      } else {
        currentSection += line + '\n';
      }
    }

    // Add final section
    if (currentSection) {
      sections.push({
        text: currentSection.trim(),
        type: currentType,
        startIndex,
        endIndex: startIndex + currentSection.length
      });
    }

    return sections;
  }

  /**
   * Detect content type for intelligent chunking
   */
  private detectContentType(line: string): DocumentChunk['type'] {
    // Heading detection
    if (/^#{1,6}\s/.test(line) || 
        /^[A-Z][A-Za-z\s]+:?\s*$/.test(line) ||
        line.length < 50 && /[.!?]$/.test(line) === false) {
      return 'heading';
    }

    // List detection
    if (/^\s*[-*•]\s/.test(line) || /^\s*\d+\.\s/.test(line)) {
      return 'paragraph'; // Treat lists as paragraphs for now
    }

    // Code detection
    if (/```|`/.test(line) || /^[\s]*[{}();]/.test(line)) {
      return 'code';
    }

    // Quote detection
    if (/^>\s/.test(line) || /^"/.test(line)) {
      return 'quote';
    }

    // Table detection (simplified)
    if (/\|\s*.*\s*\|/.test(line)) {
      return 'table';
    }

    return 'paragraph';
  }

  /**
   * Chunk a semantic section into appropriately sized pieces
   */
  private chunkSection(
    section: { text: string; type: DocumentChunk['type']; startIndex: number; endIndex: number },
    options: ChunkingOptions,
    sectionIndex: number
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const maxTokens = options.maxChunkSize;
    const overlapTokens = options.overlapSize;
    
    const sectionTokens = this.estimateTokens(section.text);
    
    if (sectionTokens <= maxTokens) {
      // Section fits in one chunk
      chunks.push({
        id: crypto.randomUUID(),
        content: section.text,
        embedding: [], // Will be populated later
        startIndex: section.startIndex,
        endIndex: section.endIndex,
        type: section.type,
        metadata: {
          wordCount: section.text.split(/\s+/).length,
          charCount: section.text.length,
          significance: 0.5 // Will be calculated later
        }
      });
    } else {
      // Split section into multiple chunks with overlap
      const sentences = this.splitIntoSentences(section.text);
      let currentChunk = '';
      let chunkStartIndex = section.startIndex;
      let sentenceIndex = 0;

      while (sentenceIndex < sentences.length) {
        const sentence = sentences[sentenceIndex];
        const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
        
        if (this.estimateTokens(potentialChunk) > maxTokens && currentChunk) {
          // Current chunk is full, save it
          const chunkId = crypto.randomUUID();
          chunks.push({
            id: chunkId,
            content: currentChunk,
            embedding: [],
            startIndex: chunkStartIndex,
            endIndex: chunkStartIndex + currentChunk.length,
            type: section.type,
            metadata: {
              wordCount: currentChunk.split(/\s+/).length,
              charCount: currentChunk.length,
              significance: 0.5
            }
          });

          // Start new chunk with overlap
          const overlapSentences = this.getOverlapSentences(sentences, sentenceIndex, overlapTokens);
          currentChunk = overlapSentences.join(' ');
          chunkStartIndex += currentChunk.length;
        } else {
          currentChunk = potentialChunk;
          sentenceIndex++;
        }
      }

      // Add final chunk
      if (currentChunk) {
        chunks.push({
          id: crypto.randomUUID(),
          content: currentChunk,
          embedding: [],
          startIndex: chunkStartIndex,
          endIndex: chunkStartIndex + currentChunk.length,
          type: section.type,
          metadata: {
            wordCount: currentChunk.split(/\s+/).length,
            charCount: currentChunk.length,
            significance: 0.5
          }
        });
      }
    }

    return chunks;
  }

  /**
   * Generate embeddings for chunks using HuggingFace
   */
  private async generateChunkEmbeddings(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    console.log(`🔄 Generating embeddings for ${chunks.length} chunks...`);
    
    const batchSize = 10; // Process in batches to avoid rate limits
    const processedChunks: DocumentChunk[] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      try {
        const embeddings = await Promise.all(
          batch.map(async (chunk) => {
            const cacheKey = CacheKeys.aiResponse(
              crypto.createHash('sha256').update(chunk.content).digest('hex').substring(0, 16),
              'embedding'
            );
            
            // Check cache first
            try {
              const cached = await cacheManager.get<number[]>(cacheKey);
              if (cached) return cached;
            } catch (error) {
              console.warn('Cache retrieval failed for embedding:', error);
            }

            // Generate new embedding
            const embedding = await this.generateSingleEmbedding(chunk.content);
            
            // Cache the result
            try {
              await cacheManager.set(cacheKey, embedding, 86400); // 24 hours
            } catch (error) {
              console.warn('Cache storage failed for embedding:', error);
            }

            return embedding;
          })
        );

        // Update chunks with embeddings
        batch.forEach((chunk, index) => {
          processedChunks.push({
            ...chunk,
            embedding: embeddings[index]
          });
        });

        // Small delay between batches to respect rate limits
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.warn(`Embedding generation failed for batch ${i}-${i + batchSize}:`, error);
        
        // Add chunks without embeddings as fallback
        batch.forEach(chunk => {
          processedChunks.push({
            ...chunk,
            embedding: new Array(384).fill(0) // Default embedding size for MiniLM
          });
        });
      }
    }

    console.log(`✅ Generated embeddings for ${processedChunks.length} chunks`);
    return processedChunks;
  }

  /**
   * Generate single embedding using HuggingFace
   */
  private async generateSingleEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.hf.featureExtraction({
        model: this.embeddingModel,
        inputs: text.substring(0, 512) // Limit input size
      });

      // HuggingFace returns different formats, normalize to number array
      if (Array.isArray(response)) {
        return response as number[];
      } else if (Array.isArray(response[0])) {
        return response[0] as number[];
      } else {
        throw new Error('Unexpected embedding response format');
      }

    } catch (error) {
      console.warn('Single embedding generation failed:', error);
      return new Array(384).fill(0); // Default fallback
    }
  }

  /**
   * Calculate significance scores for chunks
   */
  private async calculateChunkSignificance(
    chunks: DocumentChunk[], 
    fullContent: string
  ): Promise<DocumentChunk[]> {
    return chunks.map(chunk => {
      let significance = 0.5; // Base significance
      
      // Boost significance for headings
      if (chunk.type === 'heading') significance += 0.3;
      
      // Boost significance for longer chunks (more content)
      const lengthRatio = chunk.metadata.charCount / (fullContent.length / chunks.length);
      significance += Math.min(lengthRatio * 0.2, 0.2);
      
      // Boost significance for chunks with important keywords
      const importantWords = ['key', 'important', 'main', 'primary', 'essential', 'critical', 'fundamental'];
      const hasImportantWords = importantWords.some(word => 
        chunk.content.toLowerCase().includes(word)
      );
      if (hasImportantWords) significance += 0.1;

      return {
        ...chunk,
        metadata: {
          ...chunk.metadata,
          significance: Math.min(significance, 1.0)
        }
      };
    });
  }

  /**
   * Utility methods
   */
  private extractTitle(lines: string[]): string {
    for (const line of lines.slice(0, 5)) { // Check first 5 lines
      if (line.length > 5 && line.length < 100) {
        return line.trim();
      }
    }
    return 'Untitled Document';
  }

  private extractOutline(content: string): Array<{ level: number; title: string; startChunk: number; endChunk: number; }> {
    const outline: Array<{ level: number; title: string; startChunk: number; endChunk: number; }> = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Markdown heading
      const markdownMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (markdownMatch) {
        outline.push({
          level: markdownMatch[1].length,
          title: markdownMatch[2],
          startChunk: 0, // Will be calculated later
          endChunk: 0
        });
        continue;
      }

      // Other heading patterns
      if (trimmed.length > 0 && trimmed.length < 80 && 
          /^[A-Z]/.test(trimmed) && 
          !/[.!?]$/.test(trimmed)) {
        outline.push({
          level: 1,
          title: trimmed,
          startChunk: 0,
          endChunk: 0
        });
      }
    }

    return outline;
  }

  private splitIntoSentences(text: string): string[] {
    return text.match(/[^.!?]*[.!?]+/g) || [text];
  }

  private getOverlapSentences(sentences: string[], currentIndex: number, maxTokens: number): string[] {
    const overlap: string[] = [];
    let tokenCount = 0;
    
    for (let i = Math.max(0, currentIndex - 3); i < currentIndex; i++) {
      const sentence = sentences[i];
      const sentenceTokens = this.estimateTokens(sentence);
      
      if (tokenCount + sentenceTokens <= maxTokens) {
        overlap.push(sentence);
        tokenCount += sentenceTokens;
      } else {
        break;
      }
    }
    
    return overlap;
  }

  private performTokenBasedChunking(content: string, options: ChunkingOptions): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const words = content.split(/\s+/);
    const tokensPerWord = 1.3; // Rough approximation
    const maxWords = Math.floor(options.maxChunkSize / tokensPerWord);
    const overlapWords = Math.floor(options.overlapSize / tokensPerWord);

    for (let i = 0; i < words.length; i += maxWords - overlapWords) {
      const chunkWords = words.slice(i, i + maxWords);
      const chunkText = chunkWords.join(' ');
      
      chunks.push({
        id: crypto.randomUUID(),
        content: chunkText,
        embedding: [],
        startIndex: i,
        endIndex: i + chunkWords.length,
        type: 'paragraph',
        metadata: {
          wordCount: chunkWords.length,
          charCount: chunkText.length,
          significance: 0.5
        }
      });
    }

    return chunks;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private basicFallbackProcessing(content: string, options: ChunkingOptions): DocumentStructure {
    console.warn('🔄 Using basic fallback document processing');
    
    const chunks = this.performTokenBasedChunking(content, options);
    
    return {
      title: 'Processed Document',
      chunks,
      outline: [],
      totalTokens: this.estimateTokens(content),
      processingTime: 100
    };
  }
}

// Singleton instance
export const documentProcessor = new AdvancedDocumentProcessor();