import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle, NeonDatabase } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;
// Only disable SSL in local development, not in production
if (process.env.NODE_ENV === 'development' && !process.env.REPL_ID) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Enhanced connection pool configuration
interface ConnectionPoolConfig {
  connectionString: string;
  max: number;
  min: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

class DatabaseConnectionManager {
  private pool: Pool;
  private database: NeonDatabase<typeof schema>;
  private isInitialized = false;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
    }

    const config: ConnectionPoolConfig = {
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum connections
      min: parseInt(process.env.DB_POOL_MIN || '2'),  // Minimum connections
      idleTimeoutMillis: 30000, // 30 seconds
      connectionTimeoutMillis: 5000, // 5 seconds
    };

    this.pool = new Pool({
      connectionString: config.connectionString,
      max: config.max,
      min: config.min,
      idleTimeoutMillis: config.idleTimeoutMillis,
      connectionTimeoutMillis: config.connectionTimeoutMillis,
    });

    this.database = drizzle({ 
      client: this.pool, 
      schema,
      logger: process.env.NODE_ENV === 'development'
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.pool.on('error', (err) => {
      console.error('💾 Database pool error:', err);
      this.handlePoolError(err);
    });

    this.pool.on('connect', () => {
      if (!this.isInitialized) {
        console.log('✅ Database connected successfully');
        this.isInitialized = true;
      }
    });
  }

  private handlePoolError(error: Error) {
    // Implement error recovery strategies
    if (error.message.includes('connection')) {
      console.warn('🔄 Attempting to reconnect to database...');
      // Could implement exponential backoff retry here
    }
  }

  public getDatabase(): NeonDatabase<typeof schema> {
    return this.database;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      // Simple query to check database connectivity
      await this.database.execute('SELECT 1');
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }

  public getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  public async gracefulShutdown(): Promise<void> {
    try {
      await this.pool.end();
      console.log('✅ Database connections closed gracefully');
    } catch (error) {
      console.error('❌ Error during database shutdown:', error);
    }
  }
}

// Singleton instance
export const dbManager = new DatabaseConnectionManager();
export const db = dbManager.getDatabase();

// Health check function
export const checkDatabaseHealth = () => dbManager.healthCheck();

// Pool statistics
export const getDatabaseStats = () => dbManager.getPoolStats();

// Graceful shutdown
export const shutdownDatabase = () => dbManager.gracefulShutdown();