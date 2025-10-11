/**
 * PostgreSQL Connection Pooling Configuration
 *
 * This module provides optimized database connection management for production environments.
 * Supports connection pooling via PgBouncer and direct connection pooling.
 *
 * Connection Strategy:
 * - Use DATABASE_URL with pooling for serverless/edge functions (via PgBouncer or Supabase Pooler)
 * - Use DIRECT_URL for migrations and long-running operations
 * - Implements connection retry logic and health monitoring
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';

// Connection pool configuration
const POOL_CONFIG = {
  // Maximum number of connections in the pool
  connectionLimit: parseInt(process.env.DATABASE_POOL_SIZE || '20'),

  // Connection timeout in milliseconds
  connectionTimeout: parseInt(process.env.DATABASE_CONNECT_TIMEOUT || '5000'),

  // Query timeout in milliseconds
  queryTimeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || '10000'),

  // Pool timeout - how long to wait for a free connection
  poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10000'),

  // Idle timeout - close idle connections after this time
  idleInTransactionSessionTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '60000'),

  // Statement timeout - max query execution time
  statementTimeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '30000'),
};

// Prisma Client logging configuration based on environment
const getLogLevel = () => {
  if (process.env.NODE_ENV === 'production') {
    return ['error', 'warn'] as const;
  }
  if (process.env.DATABASE_DEBUG === 'true') {
    return ['query', 'error', 'warn', 'info'] as const;
  }
  return ['error', 'warn'] as const;
};

// Prisma Client options for production
const getPrismaOptions = () => {
  const options: any = {
    log: getLogLevel(),
    errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
  };

  // Add datasource configuration
  options.datasources = {
    db: {
      url: process.env.DATABASE_URL,
    },
  };

  return options;
};

// Global singleton to prevent multiple instances
declare global {
  var __prisma: PrismaClient | undefined;
  var __prismaConnected: boolean;
}

// Create Prisma Client instance with connection pooling
function createPrismaClient(): PrismaClient {
  const prisma = new PrismaClient(getPrismaOptions());

  // Add query performance monitoring in development
  if (process.env.NODE_ENV !== 'production') {
    prisma.$on('query' as never, (e: any) => {
      if (e.duration > 1000) {
        logger.warn('Slow query detected', {
          query: e.query,
          duration: `${e.duration}ms`,
          params: e.params,
        });
      }
    });
  }

  return prisma;
}

// Get or create Prisma Client instance
function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    // In production, always create a new client
    return createPrismaClient();
  } else {
    // In development, reuse the client to avoid connection exhaustion
    if (!globalThis.__prisma) {
      globalThis.__prisma = createPrismaClient();
      globalThis.__prismaConnected = false;
    }
    return globalThis.__prisma;
  }
}

export const prisma = getPrismaClient();

/**
 * Connection Management
 */

export class ConnectionPool {
  private static instance: ConnectionPool;
  private healthCheckInterval?: NodeJS.Timeout;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isHealthy = true;

  private constructor() {
    this.setupEventHandlers();
    this.startHealthCheck();
  }

  static getInstance(): ConnectionPool {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new ConnectionPool();
    }
    return ConnectionPool.instance;
  }

  /**
   * Setup connection event handlers
   */
  private setupEventHandlers(): void {
    // Handle process termination
    process.on('beforeExit', async () => {
      await this.disconnect();
    });

    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Check database connection health
   */
  async checkHealth(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1 as health_check`;
      this.isHealthy = true;
      this.reconnectAttempts = 0;
      return true;
    } catch (error) {
      this.isHealthy = false;
      logger.error('Database health check failed', {}, error instanceof Error ? error : undefined);

      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        logger.info('Attempting database reconnection', {
          attempt: this.reconnectAttempts,
          maxAttempts: this.maxReconnectAttempts,
        });
        await this.reconnect();
      }

      return false;
    }
  }

  /**
   * Get connection pool statistics
   */
  async getPoolStats(): Promise<{
    activeConnections: number;
    idleConnections: number;
    totalConnections: number;
    maxConnections: number;
    waitingClients: number;
  }> {
    try {
      // Query PostgreSQL stats
      const stats: any = await prisma.$queryRaw`
        SELECT
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
          (SELECT count(*) FROM pg_stat_activity) as total_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE wait_event_type = 'Client') as waiting_clients
      `;

      return {
        activeConnections: Number(stats[0]?.active_connections || 0),
        idleConnections: Number(stats[0]?.idle_connections || 0),
        totalConnections: Number(stats[0]?.total_connections || 0),
        maxConnections: Number(stats[0]?.max_connections || 100),
        waitingClients: Number(stats[0]?.waiting_clients || 0),
      };
    } catch (error) {
      logger.error('Failed to get pool stats', {}, error instanceof Error ? error : undefined);
      return {
        activeConnections: 0,
        idleConnections: 0,
        totalConnections: 0,
        maxConnections: POOL_CONFIG.connectionLimit,
        waitingClients: 0,
      };
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    const interval = parseInt(process.env.DATABASE_HEALTH_CHECK_INTERVAL || '30000');

    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();

      if (process.env.DATABASE_POOL_STATS === 'true') {
        const stats = await this.getPoolStats();
        logger.debug('Database pool stats', stats);
      }
    }, interval);
  }

  /**
   * Stop health checks
   */
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Reconnect to database
   */
  async reconnect(): Promise<void> {
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      logger.info('Database reconnected successfully');
    } catch (error) {
      logger.error('Database reconnection failed', {}, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Gracefully disconnect from database
   */
  async disconnect(): Promise<void> {
    try {
      this.stopHealthCheck();
      await prisma.$disconnect();
      logger.info('Database disconnected gracefully');
    } catch (error) {
      logger.error('Error during database disconnect', {}, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): {
    isHealthy: boolean;
    reconnectAttempts: number;
    config: typeof POOL_CONFIG;
  } {
    return {
      isHealthy: this.isHealthy,
      reconnectAttempts: this.reconnectAttempts,
      config: POOL_CONFIG,
    };
  }
}

/**
 * Initialize connection pool
 */
export function initializeConnectionPool(): ConnectionPool {
  return ConnectionPool.getInstance();
}

/**
 * Get connection pool instance
 */
export function getConnectionPool(): ConnectionPool {
  return ConnectionPool.getInstance();
}

/**
 * Utility to execute queries with retry logic
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        logger.warn('Query failed, retrying...', {
          attempt,
          maxRetries,
          error: lastError.message,
        });
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

/**
 * Export connection pool configuration for reference
 */
export { POOL_CONFIG };

/**
 * Default export
 */
export default prisma;