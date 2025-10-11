import { NextResponse } from 'next/server';

// Test without Prisma - just basic connection
export async function GET() {
  try {
    console.log('=== SIMPLE TEST ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('Platform:', process.platform);
    console.log('Node version:', process.version);

    // Try a simple database connection using pg directly
    const { Pool } = require('pg');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');

    client.release();
    await pool.end();

    return NextResponse.json({
      status: 'success',
      message: 'Direct PostgreSQL connection successful',
      data: result.rows[0],
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        nodeVersion: process.version,
        hasDbUrl: !!process.env.DATABASE_URL
      }
    });
  } catch (error) {
    console.error('Simple test failed:', error);

    return NextResponse.json({
      status: 'error',
      message: 'Direct PostgreSQL connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        nodeVersion: process.version,
        hasDbUrl: !!process.env.DATABASE_URL
      }
    }, { status: 500 });
  }
}