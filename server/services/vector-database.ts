/**
 * Vector Database Service for Semantic Search and RAG
 * Implements vector storage and similarity search capabilities
 */

import { DocumentChunk } from './document-processor';
import { cacheManager, CacheKeys } from '../cache/redis-client';
import crypto from 'crypto';

export interface VectorSearchResult {
  chunk: DocumentChunk;
  similarity: number;
  relevanceScore: number;
}

export interface SemanticSearchOptions {
  topK: number;
  minSimilarity: number;
  includeMetadata: boolean;
  rerank: boolean;
}

export interface VectorCollection {
  id: string;
  name: string;
  chunks: Map<string, DocumentChunk>;
  createdAt: Date;
  lastUpdated: Date;
  totalChunks: number;
}

/**
 * In-memory vector database implementation
 * For production, replace with Qdrant, Weaviate, or similar
 */
export class VectorDatabaseService {
  private collections: Map<string, VectorCollection> = new Map();
  private readonly maxCollections = 100; // Prevent memory overflow

  /**
   * Create or get a vector collection
   */
  async createCollection(name: string): Promise<string> {
    const collectionId = crypto.createHash('sha256').update(name).digest('hex').substring(0, 16);
    
    if (!this.collections.has(collectionId)) {
      // Clean up old collections if at limit
      if (this.collections.size >= this.maxCollections) {
        await this.cleanupOldCollections();
      }

      this.collections.set(collectionId, {
        id: collectionId,
        name,
        chunks: new Map(),
        createdAt: new Date(),
        lastUpdated: new Date(),
        totalChunks: 0
      });

      console.log(`✅ Created vector collection: ${name} (${collectionId})`);
    }

    return collectionId;
  }

  /**
   * Add chunks to a vector collection
   */
  async addChunks(collectionId: string, chunks: DocumentChunk[]): Promise<void> {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    console.log(`🔄 Adding ${chunks.length} chunks to collection ${collection.name}...`);

    for (const chunk of chunks) {
      collection.chunks.set(chunk.id, chunk);
    }

    collection.totalChunks = collection.chunks.size;
    collection.lastUpdated = new Date();

    // Cache collection for persistence
    const cacheKey = CacheKeys.aiResponse(collectionId, 'vector-collection');
    try {
      await cacheManager.set(cacheKey, {
        id: collection.id,
        name: collection.name,
        chunks: Array.from(collection.chunks.values()),
        createdAt: collection.createdAt,
        lastUpdated: collection.lastUpdated,
        totalChunks: collection.totalChunks
      }, 86400 * 7); // 7 days
    } catch (error) {
      console.warn('Failed to cache vector collection:', error);
    }

    console.log(`✅ Added chunks to collection. Total: ${collection.totalChunks}`);
  }

  /**
   * Semantic search using cosine similarity
   */
  async semanticSearch(
    collectionId: string,
    queryEmbedding: number[],
    options: SemanticSearchOptions = {
      topK: 5,
      minSimilarity: 0.3,
      includeMetadata: true,
      rerank: true
    }
  ): Promise<VectorSearchResult[]> {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    if (collection.chunks.size === 0) {
      return [];
    }

    console.log(`🔍 Performing semantic search in collection ${collection.name}...`);

    // Calculate similarities for all chunks
    const results: VectorSearchResult[] = [];
    
    for (const chunk of collection.chunks.values()) {
      if (chunk.embedding.length === 0) {
        continue; // Skip chunks without embeddings
      }

      const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      
      if (similarity >= options.minSimilarity) {
        results.push({
          chunk,
          similarity,
          relevanceScore: this.calculateRelevanceScore(chunk, similarity)
        });
      }
    }

    // Sort by similarity (descending)
    results.sort((a, b) => b.similarity - a.similarity);

    // Apply reranking if requested
    let finalResults = results;
    if (options.rerank) {
      finalResults = this.rerankResults(results);
    }

    // Return top K results
    const topResults = finalResults.slice(0, options.topK);
    
    console.log(`✅ Found ${topResults.length} relevant chunks (similarity > ${options.minSimilarity})`);
    return topResults;
  }

  /**
   * Retrieve relevant context for RAG
   */
  async retrieveContext(
    collectionId: string,
    query: string,
    queryEmbedding: number[],
    maxTokens: number = 2000
  ): Promise<{
    context: string;
    sources: VectorSearchResult[];
    totalTokens: number;
  }> {
    const searchResults = await this.semanticSearch(collectionId, queryEmbedding, {
      topK: 10,
      minSimilarity: 0.2,
      includeMetadata: true,
      rerank: true
    });

    if (searchResults.length === 0) {
      return {
        context: '',
        sources: [],
        totalTokens: 0
      };
    }

    // Build context respecting token limit
    let context = '';
    let totalTokens = 0;
    const sources: VectorSearchResult[] = [];

    for (const result of searchResults) {
      const chunkTokens = this.estimateTokens(result.chunk.content);
      
      if (totalTokens + chunkTokens <= maxTokens) {
        context += result.chunk.content + '\n\n';
        totalTokens += chunkTokens;
        sources.push(result);
      } else {
        break;
      }
    }

    console.log(`✅ Retrieved context: ${sources.length} chunks, ${totalTokens} tokens`);

    return {
      context: context.trim(),
      sources,
      totalTokens
    };
  }

  /**
   * Find similar chunks for content expansion
   */
  async findSimilarChunks(
    collectionId: string,
    referenceChunk: DocumentChunk,
    topK: number = 3
  ): Promise<VectorSearchResult[]> {
    if (referenceChunk.embedding.length === 0) {
      return [];
    }

    return await this.semanticSearch(collectionId, referenceChunk.embedding, {
      topK: topK + 1, // +1 to account for the reference chunk itself
      minSimilarity: 0.4,
      includeMetadata: true,
      rerank: false
    }).then(results => 
      // Filter out the reference chunk itself
      results.filter(result => result.chunk.id !== referenceChunk.id)
    );
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(collectionId: string): Promise<{
    totalChunks: number;
    avgChunkSize: number;
    embeddingDimension: number;
    lastUpdated: Date;
  } | null> {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      return null;
    }

    const chunks = Array.from(collection.chunks.values());
    const avgChunkSize = chunks.length > 0 
      ? chunks.reduce((sum, chunk) => sum + chunk.metadata.charCount, 0) / chunks.length 
      : 0;

    const embeddingDimension = chunks.length > 0 && chunks[0].embedding.length > 0 
      ? chunks[0].embedding.length 
      : 0;

    return {
      totalChunks: collection.totalChunks,
      avgChunkSize: Math.round(avgChunkSize),
      embeddingDimension,
      lastUpdated: collection.lastUpdated
    };
  }

  /**
   * Delete a collection
   */
  async deleteCollection(collectionId: string): Promise<boolean> {
    const deleted = this.collections.delete(collectionId);
    
    if (deleted) {
      // Remove from cache
      const cacheKey = CacheKeys.aiResponse(collectionId, 'vector-collection');
      try {
        await cacheManager.del(cacheKey);
      } catch (error) {
        console.warn('Failed to remove collection from cache:', error);
      }
      
      console.log(`✅ Deleted collection: ${collectionId}`);
    }
    
    return deleted;
  }

  /**
   * List all collections
   */
  listCollections(): Array<{ id: string; name: string; totalChunks: number; lastUpdated: Date }> {
    return Array.from(this.collections.values()).map(collection => ({
      id: collection.id,
      name: collection.name,
      totalChunks: collection.totalChunks,
      lastUpdated: collection.lastUpdated
    }));
  }

  /**
   * Restore collection from cache
   */
  async restoreCollection(collectionId: string): Promise<boolean> {
    if (this.collections.has(collectionId)) {
      return true; // Already loaded
    }

    const cacheKey = CacheKeys.aiResponse(collectionId, 'vector-collection');
    try {
      const cached = await cacheManager.get<{
        id: string;
        name: string;
        chunks: DocumentChunk[];
        createdAt: string;
        lastUpdated: string;
        totalChunks: number;
      }>(cacheKey);

      if (cached) {
        const chunkMap = new Map<string, DocumentChunk>();
        cached.chunks.forEach(chunk => chunkMap.set(chunk.id, chunk));

        this.collections.set(collectionId, {
          id: cached.id,
          name: cached.name,
          chunks: chunkMap,
          createdAt: new Date(cached.createdAt),
          lastUpdated: new Date(cached.lastUpdated),
          totalChunks: cached.totalChunks
        });

        console.log(`✅ Restored collection from cache: ${cached.name}`);
        return true;
      }
    } catch (error) {
      console.warn('Failed to restore collection from cache:', error);
    }

    return false;
  }

  /**
   * Utility methods
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private calculateRelevanceScore(chunk: DocumentChunk, similarity: number): number {
    // Combine similarity with chunk significance
    const significanceWeight = 0.3;
    const similarityWeight = 0.7;

    return (similarity * similarityWeight) + (chunk.metadata.significance * significanceWeight);
  }

  private rerankResults(results: VectorSearchResult[]): VectorSearchResult[] {
    // Simple reranking based on relevance score
    return results
      .map(result => ({
        ...result,
        relevanceScore: this.calculateRelevanceScore(result.chunk, result.similarity)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private async cleanupOldCollections(): Promise<void> {
    console.log('🧹 Cleaning up old vector collections...');
    
    const collections = Array.from(this.collections.values())
      .sort((a, b) => a.lastUpdated.getTime() - b.lastUpdated.getTime());
    
    // Remove oldest 20% of collections
    const toRemove = collections.slice(0, Math.floor(collections.length * 0.2));
    
    for (const collection of toRemove) {
      await this.deleteCollection(collection.id);
    }
    
    console.log(`✅ Cleaned up ${toRemove.length} old collections`);
  }
}

// Singleton instance
export const vectorDatabase = new VectorDatabaseService();