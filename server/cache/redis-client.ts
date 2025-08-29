import Redis from 'redis';

// Redis client configuration with fallback
let redisClient: any = null;

try {
  if (process.env.REDIS_URL) {
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.warn('Redis connection refused, falling back to memory cache');
          return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 3) { // Reduced retry attempts
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });
  } else {
    // Using memory cache (Redis not configured)
  }
} catch (error) {
  console.warn('🔄 Redis initialization failed, using memory cache:', error);
  redisClient = null;
}

// Cache interface for type safety
export interface CacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  flushPattern(pattern: string): Promise<void>;
}

// Redis-based cache implementation
export class RedisCacheManager implements CacheManager {
  private client: typeof redisClient;
  private defaultTTL = 3600; // 1 hour

  constructor() {
    this.client = redisClient;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    this.client.on('ready', () => {
      console.log('✅ Redis ready for operations');
    });
  }

  async connect(): Promise<void> {
    try {
      if (!this.client) {
        throw new Error('Redis client not initialized');
      }
      await this.client.connect();
    } catch (error) {
      console.warn('⚠️  Failed to connect to Redis:', error);
      // Fall back to in-memory cache
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = this.defaultTTL): Promise<void> {
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async flushPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error(`Cache flush pattern error for ${pattern}:`, error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }
}

// In-memory fallback cache
export class MemoryCacheManager implements CacheManager {
  private cache = new Map<string, { value: any; expires: number }>();
  private defaultTTL = 3600000; // 1 hour in milliseconds

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set<T>(key: string, value: T, ttl: number = this.defaultTTL): Promise<void> {
    const expires = Date.now() + (ttl * 1000);
    this.cache.set(key, { value, expires });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  async flushPattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton cache manager
export let cacheManager: CacheManager;

export async function initializeCache(): Promise<CacheManager> {
  try {
    if (redisClient && process.env.REDIS_URL) {
      const redisCache = new RedisCacheManager();
      await redisCache.connect();
      cacheManager = redisCache;
      console.log('✅ Using Redis cache');
      return redisCache;
    } else {
      throw new Error('Redis not available');
    }
  } catch (error) {
    // Falling back to memory cache
    cacheManager = new MemoryCacheManager();
    return cacheManager;
  }
}

// Cache key generators
export const CacheKeys = {
  aiResponse: (contentHash: string, model: string) => `ai:response:${model}:${contentHash}`,
  note: (id: number) => `note:${id}`,
  userProgress: (userId: string, sessionId: number) => `progress:${userId}:${sessionId}`,
  chatSession: (id: number) => `chat:session:${id}`,
  template: (id: string) => `template:${id}`,
  pdfGeneration: (noteId: number, options: string) => `pdf:${noteId}:${options}`,
} as const;