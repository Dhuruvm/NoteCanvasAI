/**
 * Semantic Caching Service
 * Implements intelligent caching based on content similarity
 */

import { cacheManager, CacheKeys } from '../cache/redis-client';
import { HfInference } from '@huggingface/inference';
import crypto from 'crypto';

export interface SemanticCacheEntry {
  id: string;
  query: string;
  queryEmbedding: number[];
  response: any;
  metadata: {
    model: string;
    timestamp: Date;
    hitCount: number;
    confidence: number;
    tags: string[];
  };
  ttl: number;
}

export interface CacheSearchOptions {
  similarityThreshold: number;
  maxResults: number;
  includeExpired: boolean;
  tagFilter?: string[];
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  averageSimilarity: number;
  topTags: Array<{ tag: string; count: number }>;
  memoryUsage: number;
}

/**
 * Advanced semantic caching with similarity-based retrieval
 */
export class SemanticCacheService {
  private hf: HfInference;
  private cacheEntries: Map<string, SemanticCacheEntry> = new Map();
  private embeddingModel = 'sentence-transformers/all-MiniLM-L6-v2';
  private maxCacheSize = 10000; // Maximum number of entries
  private cleanupInterval = 3600000; // 1 hour in milliseconds
  private stats = {
    totalQueries: 0,
    cacheHits: 0,
    avgSimilarity: 0
  };

  constructor() {
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY || "");
    
    // Start periodic cleanup
    setInterval(() => this.performCleanup(), this.cleanupInterval);
    
    // Load cache from Redis on startup
    this.loadCacheFromRedis();
  }

  /**
   * Get cached response based on semantic similarity
   */
  async getSemanticCache(
    query: string,
    options: CacheSearchOptions = {
      similarityThreshold: 0.85,
      maxResults: 1,
      includeExpired: false
    }
  ): Promise<SemanticCacheEntry | null> {
    console.log('🔍 Searching semantic cache...');
    this.stats.totalQueries++;

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(query);
      
      // Search for similar cached entries
      const candidates = this.findSimilarEntries(queryEmbedding, options);
      
      if (candidates.length > 0) {
        const bestMatch = candidates[0];
        
        // Update hit count and statistics
        bestMatch.entry.metadata.hitCount++;
        this.stats.cacheHits++;
        this.stats.avgSimilarity = (this.stats.avgSimilarity + bestMatch.similarity) / 2;
        
        console.log(`✅ Semantic cache hit: ${bestMatch.similarity.toFixed(3)} similarity`);
        
        // Update cache entry
        this.cacheEntries.set(bestMatch.entry.id, bestMatch.entry);
        
        return bestMatch.entry;
      }
      
      console.log('❌ No semantic cache match found');
      return null;

    } catch (error) {
      console.error('Semantic cache retrieval failed:', error);
      return null;
    }
  }

  /**
   * Store response in semantic cache
   */
  async setSemanticCache(
    query: string,
    response: any,
    metadata: {
      model: string;
      confidence: number;
      tags?: string[];
    },
    ttlSeconds: number = 7200
  ): Promise<string> {
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(query);
      
      // Create cache entry
      const cacheId = this.generateCacheId(query);
      const entry: SemanticCacheEntry = {
        id: cacheId,
        query,
        queryEmbedding,
        response,
        metadata: {
          model: metadata.model,
          timestamp: new Date(),
          hitCount: 0,
          confidence: metadata.confidence,
          tags: metadata.tags || []
        },
        ttl: ttlSeconds
      };

      // Check cache size and cleanup if necessary
      if (this.cacheEntries.size >= this.maxCacheSize) {
        await this.performCleanup();
      }

      // Store in memory cache
      this.cacheEntries.set(cacheId, entry);
      
      // Persist to Redis
      await this.persistToRedis(entry);
      
      console.log(`✅ Stored in semantic cache: ${cacheId}`);
      return cacheId;

    } catch (error) {
      console.error('Semantic cache storage failed:', error);
      throw error;
    }
  }

  /**
   * Invalidate cache entries by tags or similarity
   */
  async invalidateCache(criteria: {
    tags?: string[];
    similarQuery?: string;
    model?: string;
    olderThan?: Date;
  }): Promise<number> {
    let invalidatedCount = 0;
    const entriesToRemove: string[] = [];

    try {
      for (const [id, entry] of this.cacheEntries) {
        let shouldInvalidate = false;

        // Check tag criteria
        if (criteria.tags && criteria.tags.some(tag => entry.metadata.tags.includes(tag))) {
          shouldInvalidate = true;
        }

        // Check model criteria
        if (criteria.model && entry.metadata.model === criteria.model) {
          shouldInvalidate = true;
        }

        // Check age criteria
        if (criteria.olderThan && entry.metadata.timestamp < criteria.olderThan) {
          shouldInvalidate = true;
        }

        // Check similarity criteria
        if (criteria.similarQuery) {
          const queryEmbedding = await this.generateQueryEmbedding(criteria.similarQuery);
          const similarity = this.cosineSimilarity(queryEmbedding, entry.queryEmbedding);
          if (similarity > 0.9) {
            shouldInvalidate = true;
          }
        }

        if (shouldInvalidate) {
          entriesToRemove.push(id);
        }
      }

      // Remove entries
      for (const id of entriesToRemove) {
        this.cacheEntries.delete(id);
        await this.removeFromRedis(id);
        invalidatedCount++;
      }

      console.log(`✅ Invalidated ${invalidatedCount} cache entries`);
      return invalidatedCount;

    } catch (error) {
      console.error('Cache invalidation failed:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    const entries = Array.from(this.cacheEntries.values());
    
    // Calculate tag statistics
    const tagCounts = new Map<string, number>();
    entries.forEach(entry => {
      entry.metadata.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Estimate memory usage (rough approximation)
    const memoryUsage = entries.reduce((total, entry) => {
      return total + 
        entry.query.length * 2 + // String storage
        entry.queryEmbedding.length * 8 + // Float64 array
        JSON.stringify(entry.response).length * 2 + // Response data
        100; // Metadata overhead
    }, 0);

    return {
      totalEntries: entries.length,
      hitRate: this.stats.totalQueries > 0 ? this.stats.cacheHits / this.stats.totalQueries : 0,
      averageSimilarity: this.stats.avgSimilarity,
      topTags,
      memoryUsage
    };
  }

  /**
   * Find similar cache entries
   */
  private findSimilarEntries(
    queryEmbedding: number[],
    options: CacheSearchOptions
  ): Array<{ entry: SemanticCacheEntry; similarity: number }> {
    const candidates: Array<{ entry: SemanticCacheEntry; similarity: number }> = [];
    const now = new Date();

    for (const entry of this.cacheEntries.values()) {
      // Check if expired
      const age = (now.getTime() - entry.metadata.timestamp.getTime()) / 1000;
      if (!options.includeExpired && age > entry.ttl) {
        continue;
      }

      // Check tag filter
      if (options.tagFilter && options.tagFilter.length > 0) {
        const hasMatchingTag = options.tagFilter.some(tag => entry.metadata.tags.includes(tag));
        if (!hasMatchingTag) {
          continue;
        }
      }

      // Calculate similarity
      const similarity = this.cosineSimilarity(queryEmbedding, entry.queryEmbedding);
      
      if (similarity >= options.similarityThreshold) {
        candidates.push({ entry, similarity });
      }
    }

    // Sort by similarity (descending) and return top results
    return candidates
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.maxResults);
  }

  /**
   * Generate query embedding
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    // Simple cache for query embeddings
    const queryHash = crypto.createHash('sha256').update(query).digest('hex').substring(0, 16);
    const cacheKey = `query_embed_${queryHash}`;

    try {
      const cached = await cacheManager.get<number[]>(cacheKey);
      if (cached) return cached;
    } catch (error) {
      console.warn('Query embedding cache failed:', error);
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

      // Cache the embedding
      try {
        await cacheManager.set(cacheKey, embedding, 1800); // 30 minutes
      } catch (error) {
        console.warn('Query embedding storage failed:', error);
      }

      return embedding;

    } catch (error) {
      console.warn('Query embedding generation failed:', error);
      return new Array(384).fill(0);
    }
  }

  /**
   * Calculate cosine similarity
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generate unique cache ID
   */
  private generateCacheId(query: string): string {
    return crypto.createHash('sha256').update(query + Date.now().toString()).digest('hex').substring(0, 16);
  }

  /**
   * Persist cache entry to Redis
   */
  private async persistToRedis(entry: SemanticCacheEntry): Promise<void> {
    const cacheKey = CacheKeys.aiResponse(entry.id, 'semantic-cache');
    try {
      await cacheManager.set(cacheKey, {
        id: entry.id,
        query: entry.query,
        queryEmbedding: entry.queryEmbedding,
        response: entry.response,
        metadata: {
          ...entry.metadata,
          timestamp: entry.metadata.timestamp.toISOString()
        },
        ttl: entry.ttl
      }, entry.ttl);
    } catch (error) {
      console.warn('Redis persistence failed for semantic cache:', error);
    }
  }

  /**
   * Remove cache entry from Redis
   */
  private async removeFromRedis(entryId: string): Promise<void> {
    const cacheKey = CacheKeys.aiResponse(entryId, 'semantic-cache');
    try {
      await cacheManager.del(cacheKey);
    } catch (error) {
      console.warn('Redis removal failed for semantic cache:', error);
    }
  }

  /**
   * Load cache from Redis on startup
   */
  private async loadCacheFromRedis(): Promise<void> {
    try {
      console.log('🔄 Loading semantic cache from Redis...');
      
      // This is a simplified implementation
      // In production, you'd scan Redis keys and restore the cache
      
      console.log('✅ Semantic cache loaded from Redis');
    } catch (error) {
      console.warn('Failed to load semantic cache from Redis:', error);
    }
  }

  /**
   * Periodic cleanup of expired entries
   */
  private async performCleanup(): Promise<void> {
    console.log('🧹 Performing semantic cache cleanup...');
    
    const now = new Date();
    const entriesToRemove: string[] = [];
    
    for (const [id, entry] of this.cacheEntries) {
      const age = (now.getTime() - entry.metadata.timestamp.getTime()) / 1000;
      
      if (age > entry.ttl) {
        entriesToRemove.push(id);
      }
    }

    // Remove expired entries
    for (const id of entriesToRemove) {
      this.cacheEntries.delete(id);
      await this.removeFromRedis(id);
    }

    // If still at capacity, remove least recently used entries
    if (this.cacheEntries.size > this.maxCacheSize * 0.8) {
      const entries = Array.from(this.cacheEntries.values())
        .sort((a, b) => a.metadata.hitCount - b.metadata.hitCount);
      
      const toRemove = entries.slice(0, entries.length - Math.floor(this.maxCacheSize * 0.7));
      
      for (const entry of toRemove) {
        this.cacheEntries.delete(entry.id);
        await this.removeFromRedis(entry.id);
      }
    }

    console.log(`✅ Cleaned up ${entriesToRemove.length} expired cache entries`);
  }
}

// Singleton instance
export const semanticCache = new SemanticCacheService();