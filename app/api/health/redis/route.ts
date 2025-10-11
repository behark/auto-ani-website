/**
 * Redis/Cache Health Check Endpoint
 *
 * Provides detailed cache system connectivity and performance metrics
 * Used by monitoring systems and load balancers
 */

import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RedisHealthResponse {
  status: 'up' | 'down' | 'degraded';
  timestamp: string;
  cache: {
    mode: 'redis' | 'memory';
    connected: boolean;
    latency?: number;
    info?: {
      version?: string;
      uptime?: number;
      connectedClients?: number;
      usedMemory?: string;
    };
  };
  checks: {
    connectivity: boolean;
    readWrite: boolean;
    performance: boolean;
  };
  message?: string;
}

/**
 * GET /api/health/redis
 *
 * Returns detailed Redis/cache health status
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Check Redis health
    const healthCheck = await redis.healthCheck();
    const latency = Date.now() - startTime;

    // Test read/write operations
    let readWriteOk = false;
    try {
      const testKey = `health-check-${Date.now()}`;
      await redis.set(testKey, 'test', 5);
      const value = await redis.get(testKey);
      readWriteOk = value === 'test';
      await redis.delete(testKey);
    } catch (_error) {
      logger.warn('Redis read/write test failed', { error: _error instanceof Error ? _error.message : 'Unknown' });
    }

    // Determine status
    let status: 'up' | 'down' | 'degraded';
    if (healthCheck.mode === 'memory') {
      // Memory cache is a fallback - system is degraded
      status = 'degraded';
    } else if (!healthCheck.healthy) {
      status = 'down';
    } else if (latency > 500) {
      // Response time > 500ms is degraded
      status = 'degraded';
    } else {
      status = 'up';
    }

    const response: RedisHealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      cache: {
        mode: healthCheck.mode,
        connected: healthCheck.healthy,
        latency,
      },
      checks: {
        connectivity: healthCheck.healthy,
        readWrite: readWriteOk,
        performance: latency < 500,
      },
    };

    // Add message based on status
    if (healthCheck.mode === 'memory') {
      response.message = 'Redis unavailable - using in-memory cache (not suitable for production)';
    } else if (status === 'degraded') {
      response.message = 'Redis is responding slowly';
    } else if (status === 'down') {
      response.message = 'Redis connection failed';
    }

    // Log if there are issues
    if (status !== 'up') {
      logger.warn('Redis health check detected issues', {
        status,
        mode: healthCheck.mode,
        latency,
        connected: healthCheck.healthy,
      });
    }

    // Return appropriate status code
    // Degraded returns 200 with warning (system is functional)
    // Down returns 503 (system is not functional)
    const statusCode = status === 'down' ? 503 : 200;

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (_error) {
    logger.error('Redis health check failed', {}, _error instanceof Error ? _error : undefined);

    return NextResponse.json(
      {
        status: 'down',
        timestamp: new Date().toISOString(),
        cache: {
          mode: 'memory',
          connected: false,
          latency: Date.now() - startTime,
        },
        checks: {
          connectivity: false,
          readWrite: false,
          performance: false,
        },
        message: _error instanceof Error ? _error.message : 'Redis health check failed',
      } as RedisHealthResponse,
      { status: 503 }
    );
  }
}

/**
 * HEAD /api/health/redis
 *
 * Quick Redis health check for load balancers (no response body)
 */
export async function HEAD() {
  try {
    const healthCheck = await redis.healthCheck();

    if (healthCheck.healthy) {
      return new NextResponse(null, {
        status: 200,
        headers: { 'Cache-Control': 'no-cache' },
      });
    } else {
      return new NextResponse(null, { status: 503 });
    }
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}