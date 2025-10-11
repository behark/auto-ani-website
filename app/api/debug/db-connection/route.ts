import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/database';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Log environment information
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_PROVIDER: process.env.DATABASE_PROVIDER || 'not set',
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
      DATABASE_URL_PREVIEW: process.env.DATABASE_URL
        ? `${process.env.DATABASE_URL.substring(0, 30)}...`
        : 'not set',
      HAS_SSL: process.env.DATABASE_URL?.includes('sslmode=') || false,
      DEPLOYMENT_TYPE: process.env.NEXT_PUBLIC_DEPLOYMENT_TYPE || 'unknown',
    };

    logger.info('Database connection debug attempt', envInfo);

    // Attempt to connect to the database
    const startTime = Date.now();
    const result = await checkDatabaseConnection();
    const duration = Date.now() - startTime;

    // Prepare response
    const response: {
      success: boolean;
      timestamp: string;
      environment: typeof envInfo;
      connection: typeof result & { duration: string };
      troubleshooting?: {
        hints: string[];
      };
    } = {
      success: result.connected,
      timestamp: new Date().toISOString(),
      environment: envInfo,
      connection: {
        ...result,
        duration: `${duration}ms`,
      },
    };

    if (!result.connected) {
      logger.error('Database connection failed in debug endpoint', {
        error: result.error,
        ...envInfo,
      });

      // Add troubleshooting hints
      response.troubleshooting = {
        hints: [
          'Ensure DATABASE_URL is set in Netlify environment variables',
          'DATABASE_URL should include ?sslmode=require for Neon',
          'Check if Neon database is active (not hibernating)',
          'Verify database credentials are correct',
          'Example format: postgresql://USER:PASS@HOST:5432/DB?sslmode=require',
        ],
      };
    }

    return NextResponse.json(response, {
      status: result.connected ? 200 : 503,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error in database debug endpoint', {}, error instanceof Error ? error : undefined);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_PROVIDER: process.env.DATABASE_PROVIDER || 'not set',
        },
      },
      { status: 500 }
    );
  }
}