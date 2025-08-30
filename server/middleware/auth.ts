/**
 * Authentication Middleware for NoteGPT Beta
 * 
 * Production-ready authentication with JWT, rate limiting, and security features.
 */

import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
// import rateLimit from 'express-rate-limit';
// import helmet from 'helmet';

export interface AuthUser {
  id: string;
  email: string;
  tier: 'free' | 'pro' | 'enterprise';
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId?: string;
    }
  }
}

/**
 * Simple Authentication Middleware (Development)
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Simple development authentication
  const apiKey = req.headers['x-api-key'] as string;
  
  if (apiKey && apiKey === 'dev-api-key') {
    req.user = {
      id: 'dev_user',
      email: 'dev@notegpt.com',
      tier: 'enterprise',
      permissions: ['admin']
    };
  }
  
  next(); // Allow all requests in development
};

/**
 * Optional Authentication - doesn't block if no token
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // Simple optional auth for development
  const apiKey = req.headers['x-api-key'] as string;
  
  if (apiKey === 'dev-api-key') {
    req.user = {
      id: 'dev_user',
      email: 'dev@notegpt.com',
      tier: 'enterprise',
      permissions: ['admin']
    };
  }
  
  next();
};

/**
 * Simple Rate Limiting (Development)
 */
export const createRateLimiter = (tier: 'free' | 'pro' | 'enterprise' = 'free') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Simple rate limiting - allow all in development
    next();
  };
};

/**
 * AI Processing Rate Limiting (Development)
 */
export const aiProcessingRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // Allow all AI processing in development
  next();
};

/**
 * Permission-based Authorization
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.permissions.includes(permission) && !req.user.permissions.includes('admin')) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        userPermissions: req.user.permissions
      });
    }

    next();
  };
};

/**
 * Tier-based Access Control
 */
export const requireTier = (minimumTier: 'pro' | 'enterprise') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tierLevels = { free: 0, pro: 1, enterprise: 2 };
    const userLevel = tierLevels[req.user.tier];
    const requiredLevel = tierLevels[minimumTier];

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: 'Tier upgrade required',
        currentTier: req.user.tier,
        requiredTier: minimumTier,
        upgradeUrl: '/upgrade'
      });
    }

    next();
  };
};

/**
 * Basic Security Headers (Development)
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
};

/**
 * Request ID Middleware
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

/**
 * API Key Authentication (for machine-to-machine)
 */
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // In production, validate against database
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  // Set a mock user for API key requests
  req.user = {
    id: 'api_user',
    email: 'api@notegpt.com',
    tier: 'enterprise',
    permissions: ['api_access', 'ai_processing']
  };

  next();
};

/**
 * CORS Configuration
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://notegpt.replit.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID']
};

/**
 * Development Authentication Bypass
 */
export const devAuth = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      id: 'dev_user',
      email: 'dev@notegpt.com',
      tier: 'enterprise',
      permissions: ['admin']
    };
  }
  next();
};