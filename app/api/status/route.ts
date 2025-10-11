import { NextResponse } from 'next/server';
import envValidator from '@/lib/config/env-validator';
import { prisma } from '@/lib/database';

/**
 * Service Status API Endpoint
 * Shows which services are configured and operational
 */
export async function GET() {
  try {
    // Check database connection
    let dbStatus = false;
    let dbLatency = 0;

    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
      dbStatus = true;
    } catch (error) {
      console.error('Database check failed:', error);
    }

    const validation = envValidator.validate();
    const services = envValidator.getServiceStatus();

    return NextResponse.json({
      status: validation.valid ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      services: {
        ...services,
        database: {
          operational: dbStatus,
          latency: `${dbLatency}ms`
        }
      },
      warnings: validation.warnings.length,
      errors: validation.errors.length,
      details: process.env.NODE_ENV === 'development' ? {
        warnings: validation.warnings,
        errors: validation.errors
      } : undefined,
      message: validation.valid
        ? 'All critical services operational'
        : 'Some services may be unavailable. Check configuration.'
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to check service status',
        error: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : String(error))
          : 'Internal server error'
      },
      { status: 500 }
    );
  }
}