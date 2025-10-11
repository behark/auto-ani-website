/**
 * Database Health Check API Endpoint
 *
 * Provides comprehensive database health and performance metrics
 * Useful for monitoring, load balancers, and alerting systems
 */

import { NextResponse } from 'next/server';
import { checkDatabaseConnection, prisma } from '@/lib/database';
import { logger } from '@/lib/logger';

// Type definitions for connection pool
interface PoolStats {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  maxConnections: number;
  waitingClients: number;
  utilizationPercent: number;
  isHealthy: boolean;
}


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  database: {
    connected: boolean;
    provider: string;
    latency?: number;
    error?: string;
  };
  connectionPool?: PoolStats;
  checks: {
    name: string;
    status: 'pass' | 'fail';
    message?: string;
    duration?: number;
  }[];
}

/**
 * GET /api/health/db
 *
 * Returns detailed database health status
 */
export async function GET() {
  const startTime = Date.now();
  const checks: HealthCheckResponse['checks'] = [];

  try {
    // 1. Basic database connection check
    const dbCheckStart = Date.now();
    const dbHealth = await checkDatabaseConnection();
    const dbCheckDuration = Date.now() - dbCheckStart;

    checks.push({
      name: 'database_connection',
      status: dbHealth.connected ? 'pass' : 'fail',
      message: dbHealth.error || 'Database connected successfully',
      duration: dbCheckDuration
    });

    // 2. Connection pool health check (if available)
    let poolStats: PoolStats | null = null;
    if (dbHealth.provider === 'postgresql') {
      try {
        const poolCheckStart = Date.now();
        // Dynamically import connection pool module
        const { getConnectionPool } = await import('@/lib/db/connection-pool');
        const pool = getConnectionPool();
        const stats = await pool.getPoolStats();
        const poolHealth = pool.getHealthStatus();
        const poolCheckDuration = Date.now() - poolCheckStart;

        const utilizationPercent = Math.round((stats.activeConnections / stats.maxConnections) * 100);

        poolStats = {
          ...stats,
          utilizationPercent: utilizationPercent,
          isHealthy: poolHealth.isHealthy
        };

        checks.push({
          name: 'connection_pool',
          status: poolHealth.isHealthy && utilizationPercent < 90 ? 'pass' : 'fail',
          message: `Pool utilization: ${utilizationPercent}%`,
          duration: poolCheckDuration
        });

        // Add pool stats to response
        poolStats.utilizationPercent = utilizationPercent;
        poolStats.isHealthy = poolHealth.isHealthy;
      } catch (error) {
        checks.push({
          name: 'connection_pool',
          status: 'fail',
          message: error instanceof Error ? error.message : 'Connection pool check failed'
        });
      }
    }

    // 3. Query performance check
    const queryCheckStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      const queryCheckDuration = Date.now() - queryCheckStart;

      checks.push({
        name: 'query_performance',
        status: queryCheckDuration < 100 ? 'pass' : 'fail',
        message: `Query executed in ${queryCheckDuration}ms`,
        duration: queryCheckDuration
      });
    } catch (error) {
      checks.push({
        name: 'query_performance',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Query performance check failed'
      });
    }

    // Determine overall health status
    const failedChecks = checks.filter(c => c.status === 'fail').length;
    let status: 'healthy' | 'degraded' | 'unhealthy';

    if (failedChecks === 0) {
      status = 'healthy';
    } else if (!dbHealth.connected) {
      status = 'unhealthy';
    } else {
      status = 'degraded';
    }

    const response: HealthCheckResponse = {
      status,
      timestamp: new Date().toISOString(),
      database: {
        connected: dbHealth.connected,
        provider: dbHealth.provider,
        latency: dbHealth.latency,
        error: dbHealth.error
      },
      checks
    };

    // Add connection pool stats if available
    if (poolStats) {
      response.connectionPool = poolStats;
    }

    // Log health check results
    logger.info('Database health check completed', {
      status,
      duration: Date.now() - startTime,
      failedChecks
    });

    // Return appropriate HTTP status code
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    logger.error('Database health check failed', {}, error instanceof Error ? error : undefined);

    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        provider: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      checks: [{
        name: 'health_check',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Health check failed'
      }]
    };

    return NextResponse.json(errorResponse, { status: 503 });
  }
}

/**
 * HEAD /api/health/db
 *
 * Quick health check for load balancers (no response body)
 */
export async function HEAD() {
  try {
    const dbHealth = await checkDatabaseConnection();

    if (dbHealth.connected) {
      return new NextResponse(null, { status: 200 });
    } else {
      return new NextResponse(null, { status: 503 });
    }
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}