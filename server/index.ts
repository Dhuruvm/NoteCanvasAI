import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeCache } from "./cache/redis-client";
import { initializeDefaultTemplates } from "./storage";
import { 
  setupCompression, 
  setupSecurity, 
  setupRateLimiting, 
  setupResponseTimeTracking,
  setupMemoryMonitoring,
  setupHealthCheck,
  setupRequestLogging
} from "./middleware/performance";
import { setupDeploymentMiddleware, setupGracefulShutdown } from "./middleware/deployment";
import { securityHeaders, requestId, devAuth } from "./middleware/auth";

const app = express();

// Configure Express to trust proxy headers (required for Replit environment)
app.set('trust proxy', true);

// Initialize performance optimizations
setupSecurity(app);
setupCompression(app);
setupRateLimiting(app);
setupResponseTimeTracking(app);
setupHealthCheck(app);
setupRequestLogging(app);

// Initialize NoteGPT Beta deployment middleware
setupDeploymentMiddleware(app);

// Add enhanced security and request tracking
app.use(securityHeaders);
app.use(requestId);
app.use(devAuth); // Development authentication bypass

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize cache system
  try {
    await initializeCache();
    console.log('✅ Cache system initialized');
  } catch (error) {
    console.warn('⚠️  Cache initialization failed:', error);
  }

  // Start memory monitoring
  setupMemoryMonitoring();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT environment variable (Render sets this automatically)
  // Default to 5000 for local development
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = '0.0.0.0'; // Always bind to 0.0.0.0 for deployment platforms
  
  server.listen(port, host, async () => {
    log(`serving on ${host}:${port}`);
    console.log(`✅ Server is running on http://${host}:${port}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Process PID: ${process.pid}`);
    console.log(`🚀 NoteGPT Beta AI Architecture: Ready`);
    console.log(`🔥 Features: Transformer-based processing, Multimodal support, GraphQL API`);
    
    // Initialize templates after server starts
    try {
      await initializeDefaultTemplates();
      console.log('✅ Default templates initialized');
    } catch (error) {
      console.warn('⚠️  Template initialization failed:', error);
    }

    // Setup graceful shutdown
    setupGracefulShutdown(server);
  });
})();
