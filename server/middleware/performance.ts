import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Express, Request, Response, NextFunction } from 'express';

// Compression middleware with optimal settings
export function setupCompression(app: Express) {
  app.use(compression({
    filter: (req, res) => {
      // Don't compress responses that are already compressed or small
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Good balance between compression and CPU usage
    threshold: 1024, // Only compress files larger than 1KB
    chunkSize: 16 * 1024, // 16KB chunks
  }));
}

// Security middleware
export function setupSecurity(app: Express) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: process.env.NODE_ENV === 'development' 
          ? ["'self'", "'unsafe-eval'", "'unsafe-inline'"] // Vite needs inline scripts in dev
          : ["'self'", "'unsafe-eval'"], // More restrictive in production
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:", "https:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for better compatibility
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
  }));
}

// Rate limiting middleware
export function setupRateLimiting(app: Express) {
  // General API rate limiting
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window per IP
    message: {
      error: 'Too many requests',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false, // Disable validation to prevent trust proxy warnings
    handler: (req, res) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: '15 minutes'
      });
    }
  });

  // Strict rate limiting for AI processing endpoints
  const aiProcessingLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 AI requests per minute
    message: {
      error: 'AI processing rate limit exceeded',
      retryAfter: '1 minute'
    },
    skipSuccessfulRequests: false,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false, // Disable validation to prevent trust proxy warnings
  });

  // File upload rate limiting
  const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    message: {
      error: 'Upload rate limit exceeded',
      retryAfter: '1 minute'
    },
    validate: false // Disable validation to prevent trust proxy warnings
  });

  // Apply rate limiters
  app.use('/api', generalLimiter);
  app.use(['/api/process', '/api/upload'], aiProcessingLimiter);
  app.use('/api/upload', uploadLimiter);
}

// Response time tracking middleware
export function setupResponseTimeTracking(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // Log slow requests
      if (duration > 1000) {
        console.warn(`⚠️  Slow request: ${req.method} ${req.path} took ${duration}ms`);
      }
      
      // Only set header if response hasn't been sent
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${duration}ms`);
      }
    });
    
    next();
  });
}

// Memory usage monitoring
export function setupMemoryMonitoring() {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memGB = {
      rss: Math.round(memUsage.rss / 1024 / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 / 1024 * 100) / 100,
      external: Math.round(memUsage.external / 1024 / 1024 / 1024 * 100) / 100,
    };
    
    // Warn if memory usage is high
    if (memGB.heapUsed > 1) { // More than 1GB
      console.warn(`⚠️  High memory usage: ${JSON.stringify(memGB)}`);
    }
  }, 30000); // Check every 30 seconds
}

// Health check middleware
export function setupHealthCheck(app: Express) {
  app.get('/api/health', (req: Request, res: Response) => {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    };
    
    res.status(200).json(healthCheck);
  });

  // Detailed health check for monitoring systems
  app.get('/api/health/detailed', (req: Request, res: Response) => {
    const detailed = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy', // TODO: Add actual DB health check
        cache: 'healthy',    // TODO: Add actual cache health check
        ai: 'healthy'        // TODO: Add actual AI service health check
      },
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.env.npm_package_version || '1.0.0'
      }
    };
    
    res.status(200).json(detailed);
  });
}

// Request logging middleware
export function setupRequestLogging(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // Log API requests
      if (req.path.startsWith('/api')) {
        console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      }
    });
    
    next();
  });
}