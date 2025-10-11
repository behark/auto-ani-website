/**
 * Application Health Check Endpoint
 *
 * Provides overall application health status including:
 * - Database connectivity
 * - Redis/cache status
 * - API responsiveness
 * - System uptime
 */

import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/database';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const startTime = Date.now();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: {
      status: 'up' | 'down' | 'degraded';
      latency?: number;
      provider?: string;
    };
    cache: {
      status: 'up' | 'down';
      mode: 'redis' | 'memory';
    };
    api: {
      status: 'up';
      latency: number;
    };
  };
}

/**
 * GET /api/health
 *
 * Returns overall application health status
 */
export async function GET() {
  const requestStart = Date.now();

  try {
    // Check database health
    const dbHealth = await checkDatabaseConnection();

    // Check Redis/cache health
    const cacheHealth = await redis.healthCheck();

    // Calculate API response time
    const apiLatency = Date.now() - requestStart;

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (!dbHealth.connected) {
      overallStatus = 'unhealthy';
    } else if (!cacheHealth.healthy) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const response: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbHealth.connected ? 'up' : 'down',
          latency: dbHealth.latency,
          provider: dbHealth.provider
        },
        cache: {
          status: cacheHealth.healthy ? 'up' : 'down',
          mode: cacheHealth.mode
        },
        api: {
          status: 'up',
          latency: apiLatency
        }
      }
    };

    // Log health check
    if (overallStatus !== 'healthy') {
      logger.warn('Health check detected issues', {
        status: overallStatus,
        database: dbHealth.connected,
        cache: cacheHealth.healthy
      });
    }

    // Return appropriate status code
    const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (_error) {
    logger.error('Health check failed', {}, _error instanceof Error ? _error : undefined);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: _error instanceof Error ? _error.message : 'Health check failed'
      },
      { status: 503 }
    );
  }
}

/**
 * HEAD /api/health
 *
 * Quick health check for load balancers (no response body)
 */
export async function HEAD() {
  try {
    const dbHealth = await checkDatabaseConnection();

    if (dbHealth.connected) {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
    } else {
      return new NextResponse(null, { status: 503 });
    }
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}