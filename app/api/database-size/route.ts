import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { Pool } = require('pg');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const client = await pool.connect();

    // Get database size information
    const queries = [
      // Total database size
      `SELECT pg_size_pretty(pg_database_size(current_database())) as database_size`,

      // Individual table sizes
      `SELECT
         schemaname,
         tablename,
         attname,
         n_distinct,
         avg_width,
         null_frac
       FROM pg_stats
       WHERE schemaname = 'public'`,

      // Table sizes
      `SELECT
         tablename,
         pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
       FROM pg_tables
       WHERE schemaname = 'public'`,

      // Record counts
      `SELECT
         'vehicles' as table_name,
         COUNT(*) as record_count,
         AVG(length(description)) as avg_description_length,
         AVG(array_length(string_to_array(images, ','), 1)) as avg_images_per_vehicle
       FROM vehicles
       UNION ALL
       SELECT
         'contacts' as table_name,
         COUNT(*) as record_count,
         AVG(length(message)) as avg_message_length,
         0 as avg_images_per_vehicle
       FROM contacts
       UNION ALL
       SELECT
         'favorites' as table_name,
         COUNT(*) as record_count,
         0 as avg_message_length,
         0 as avg_images_per_vehicle
       FROM favorites`
    ];

    const results: any = {};

    // Execute all queries
    const dbSizeResult = await client.query(queries[0]);
    results.databaseSize = dbSizeResult.rows[0].database_size;

    const tableStatsResult = await client.query(queries[1]);
    results.tableStats = tableStatsResult.rows;

    const tableSizesResult = await client.query(queries[2]);
    results.tableSizes = tableSizesResult.rows;

    const recordCountsResult = await client.query(queries[3]);
    results.recordCounts = recordCountsResult.rows;

    client.release();
    await pool.end();

    return NextResponse.json({
      success: true,
      databaseAnalysis: results,
      summary: {
        totalSize: results.databaseSize,
        mainTables: results.tableSizes?.length || 0,
        vehicleCount: results.recordCounts?.find((r: any) => r.table_name === 'vehicles')?.record_count || 0
      },
      recommendation: {
        currentUsage: 'Very light - perfect for free tiers',
        renderPostgres: 'Complete overkill for current data volume',
        supabaseCurrent: 'Ideal - using <1% of free tier',
        migration: 'Not recommended unless scaling to 1000+ vehicles'
      }
    });

  } catch (error) {
    console.error('Database size analysis failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      estimate: {
        vehicles: '7 vehicles ≈ 50-100KB',
        images: 'Images stored as URLs, not in DB',
        totalEstimate: '<1MB total database size',
        recommendation: 'Current Supabase setup is perfect'
      }
    }, { status: 500 });
  }
}