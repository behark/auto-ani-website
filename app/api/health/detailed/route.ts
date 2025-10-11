/**
 * Detailed System Health Check Endpoint
 *
 * Provides comprehensive system health metrics including:
 * - Database connectivity and performance
 * - Redis/cache status
 * - API integrations status
 * - System resources
 * - Application metrics
 *
 * SECURITY: This endpoint should be protected in production
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/database';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const startTime = Date.now();

interface DetailedHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  nodeVersion: string;
  services: {
    database: {
      status: 'up' | 'down' | 'degraded';
      connected: boolean;
      latency: number;
      provider: string;
      checks: {
        connectivity: boolean;
        queryPerformance: boolean;
      };
    };
    cache: {
      status: 'up' | 'down' | 'degraded';
      mode: 'redis' | 'memory';
      connected: boolean;
      latency: number;
      checks: {
        connectivity: boolean;
        readWrite: boolean;
        performance: boolean;
      };
    };
    api: {
      status: 'up';
      latency: number;
    };
  };
  integrations: {
    stripe: boolean;
    twilio: boolean;
    email: boolean;
    googleMaps: boolean;
    facebook: boolean;
    instagram: boolean;
    sentry: boolean;
  };
  system: {
    memory: {
      total: number;
      used: number;
      free: number;
      percentage: number;
    };
    process: {
      uptime: number;
      pid: number;
      memoryUsage: NodeJS.MemoryUsage;
    };
  };
  metrics?: {
    requestCount?: number;
    errorRate?: number;
    averageResponseTime?: number;
  };
}

/**
 * Check if integration is configured
 */
function checkIntegration(vars: string[]): boolean {
  return vars.every(varName => !!process.env[varName]);
}

/**
 * GET /api/health/detailed
 *
 * Returns comprehensive system health status with detailed metrics
 *
 * SECURITY: Consider adding authentication for production
 */
export async function GET(request: NextRequest) {
  const requestStart = Date.now();

  // Optional: Require API key for detailed health check in production
  if (process.env.NODE_ENV === 'production') {
    const apiKey = request.headers.get('X-Health-Check-Key');
    if (process.env.HEALTH_CHECK_API_KEY && apiKey !== process.env.HEALTH_CHECK_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  try {
    // Check database health
    const dbStartTime = Date.now();
    const dbHealth = await checkDatabaseConnection();
    const dbLatency = Date.now() - dbStartTime;

    // Check Redis/cache health
    const cacheStartTime = Date.now();
    const cacheHealth = await redis.healthCheck();
    const cacheLatency = Date.now() - cacheStartTime;

    // Test cache read/write
    let cacheReadWrite = false;
    try {
      const testKey = `health-check-${Date.now()}`;
      await redis.set(testKey, 'test', 5);
      const value = await redis.get(testKey);
      cacheReadWrite = value === 'test';
      await redis.delete(testKey);
    } catch (error) {
      logger.debug('Cache read/write test failed', { error: error instanceof Error ? error.message : 'Unknown' });
    }

    // Calculate API response time
    const apiLatency = Date.now() - requestStart;

    // Check integrations
    const integrations = {
      stripe: checkIntegration(['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY']),
      twilio: checkIntegration(['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN']),
      email: checkIntegration(['RESEND_API_KEY', 'FROM_EMAIL']),
      googleMaps: checkIntegration(['GOOGLE_MAPS_API_KEY']),
      facebook: checkIntegration(['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET']),
      instagram: checkIntegration(['INSTAGRAM_ACCOUNT_ID']),
      sentry: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    };

    // Get system metrics
    const memUsage = process.memoryUsage();
    const systemMemory = {
      total: memUsage.heapTotal,
      used: memUsage.heapUsed,
      free: memUsage.heapTotal - memUsage.heapUsed,
      percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
    };

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (!dbHealth.connected) {
      overallStatus = 'unhealthy';
    } else if (
      !cacheHealth.healthy ||
      cacheHealth.mode === 'memory' ||
      dbLatency > 1000 ||
      cacheLatency > 500
    ) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const response: DetailedHealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: process.env.npm_package_version || process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      services: {
        database: {
          status: dbHealth.connected ? (dbLatency > 1000 ? 'degraded' : 'up') : 'down',
          connected: dbHealth.connected,
          latency: dbLatency,
          provider: dbHealth.provider || 'unknown',
          checks: {
            connectivity: dbHealth.connected,
            queryPerformance: dbLatency < 1000,
          },
        },
        cache: {
          status: cacheHealth.healthy ? (cacheLatency > 500 ? 'degraded' : 'up') : 'down',
          mode: cacheHealth.mode,
          connected: cacheHealth.healthy,
          latency: cacheLatency,
          checks: {
            connectivity: cacheHealth.healthy,
            readWrite: cacheReadWrite,
            performance: cacheLatency < 500,
          },
        },
        api: {
          status: 'up',
          latency: apiLatency,
        },
      },
      integrations,
      system: {
        memory: systemMemory,
        process: {
          uptime: Math.floor(process.uptime()),
          pid: process.pid,
          memoryUsage: memUsage,
        },
      },
    };

    // Log detailed health check
    logger.debug('Detailed health check', {
      status: overallStatus,
      dbLatency,
      cacheLatency,
      apiLatency,
      integrations,
    });

    // Return appropriate status code
    const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    logger.error('Detailed health check failed', {}, error instanceof Error ? error : undefined);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 503 }
    );
  }
}