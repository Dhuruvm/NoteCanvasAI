import { performance } from 'perf_hooks';

// Performance metrics collection
interface Metrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  ai: {
    totalProcessed: number;
    cacheHits: number;
    cacheMisses: number;
    averageProcessingTime: number;
    modelUsage: Record<string, number>;
  };
  database: {
    queries: number;
    slowQueries: number;
    errors: number;
    averageQueryTime: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

class MetricsCollector {
  private metrics: Metrics = {
    requests: {
      total: 0,
      successful: 0,
      failed: 0,
      averageResponseTime: 0
    },
    ai: {
      totalProcessed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageProcessingTime: 0,
      modelUsage: {}
    },
    database: {
      queries: 0,
      slowQueries: 0,
      errors: 0,
      averageQueryTime: 0
    },
    memory: {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      rss: 0
    }
  };

  private responseTimes: number[] = [];
  private aiProcessingTimes: number[] = [];
  private queryTimes: number[] = [];

  // Record request metrics
  recordRequest(success: boolean, responseTime: number) {
    this.metrics.requests.total++;
    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }
    
    this.responseTimes.push(responseTime);
    this.metrics.requests.averageResponseTime = this.calculateAverage(this.responseTimes);
  }

  // Record AI processing metrics
  recordAIProcessing(processingTime: number, model: string, cached: boolean) {
    this.metrics.ai.totalProcessed++;
    
    if (cached) {
      this.metrics.ai.cacheHits++;
    } else {
      this.metrics.ai.cacheMisses++;
      this.aiProcessingTimes.push(processingTime);
      this.metrics.ai.averageProcessingTime = this.calculateAverage(this.aiProcessingTimes);
    }

    // Track model usage
    this.metrics.ai.modelUsage[model] = (this.metrics.ai.modelUsage[model] || 0) + 1;
  }

  // Record database metrics
  recordDatabaseQuery(queryTime: number, isError: boolean = false) {
    this.metrics.database.queries++;
    
    if (isError) {
      this.metrics.database.errors++;
    } else {
      this.queryTimes.push(queryTime);
      this.metrics.database.averageQueryTime = this.calculateAverage(this.queryTimes);
      
      // Mark slow queries (>1 second)
      if (queryTime > 1000) {
        this.metrics.database.slowQueries++;
      }
    }
  }

  // Update memory metrics
  updateMemoryMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.memory = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024) // MB
    };
  }

  // Get current metrics
  getMetrics(): Metrics {
    this.updateMemoryMetrics();
    return { ...this.metrics };
  }

  // Get formatted metrics for dashboard
  getFormattedMetrics() {
    const metrics = this.getMetrics();
    
    return {
      overview: {
        totalRequests: metrics.requests.total,
        successRate: metrics.requests.total > 0 
          ? Math.round((metrics.requests.successful / metrics.requests.total) * 100) 
          : 0,
        averageResponseTime: Math.round(metrics.requests.averageResponseTime),
        aiCacheHitRate: metrics.ai.totalProcessed > 0
          ? Math.round((metrics.ai.cacheHits / metrics.ai.totalProcessed) * 100)
          : 0
      },
      ai: {
        totalProcessed: metrics.ai.totalProcessed,
        cacheHits: metrics.ai.cacheHits,
        cacheMisses: metrics.ai.cacheMisses,
        averageProcessingTime: Math.round(metrics.ai.averageProcessingTime),
        topModels: Object.entries(metrics.ai.modelUsage)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([model, count]) => ({ model, count }))
      },
      database: {
        totalQueries: metrics.database.queries,
        slowQueries: metrics.database.slowQueries,
        errorRate: metrics.database.queries > 0
          ? Math.round((metrics.database.errors / metrics.database.queries) * 100)
          : 0,
        averageQueryTime: Math.round(metrics.database.averageQueryTime)
      },
      memory: metrics.memory
    };
  }

  // Reset metrics (useful for testing or periodic resets)
  reset() {
    this.metrics = {
      requests: { total: 0, successful: 0, failed: 0, averageResponseTime: 0 },
      ai: { totalProcessed: 0, cacheHits: 0, cacheMisses: 0, averageProcessingTime: 0, modelUsage: {} },
      database: { queries: 0, slowQueries: 0, errors: 0, averageQueryTime: 0 },
      memory: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 }
    };
    this.responseTimes = [];
    this.aiProcessingTimes = [];
    this.queryTimes = [];
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    
    // Keep only recent values to avoid memory bloat
    const recentValues = values.slice(-100);
    const sum = recentValues.reduce((a, b) => a + b, 0);
    return sum / recentValues.length;
  }
}

// Singleton metrics collector
export const metricsCollector = new MetricsCollector();

// Performance timing wrapper
export function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  return fn().then(result => ({
    result,
    duration: performance.now() - start
  }));
}

// Middleware for automatic request metrics collection
export function metricsMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = performance.now();
    
    res.on('finish', () => {
      const duration = performance.now() - start;
      const success = res.statusCode < 400;
      metricsCollector.recordRequest(success, duration);
    });
    
    next();
  };
}