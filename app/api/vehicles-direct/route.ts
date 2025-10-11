import { NextRequest, NextResponse } from 'next/server';

// Direct PostgreSQL vehicles API that bypasses Prisma
export async function GET(request: NextRequest) {
  try {
    const { Pool } = require('pg');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const client = await pool.connect();

    // Get vehicles directly from PostgreSQL
    const query = `
      SELECT
        id,
        make,
        model,
        year,
        price,
        mileage,
        "fuelType",
        transmission,
        "bodyType",
        status,
        featured,
        description,
        images,
        location,
        "createdAt",
        "updatedAt"
      FROM vehicles
      WHERE status = 'AVAILABLE'
      ORDER BY featured DESC, "createdAt" DESC
      LIMIT 50
    `;

    const result = await client.query(query);
    const vehicles = result.rows;

    // Get total count
    const countResult = await client.query('SELECT COUNT(*) as total FROM vehicles WHERE status = \'AVAILABLE\'');
    const totalVehicles = parseInt(countResult.rows[0].total);

    client.release();
    await pool.end();

    console.log(`✅ Found ${vehicles.length} vehicles via direct PostgreSQL`);

    return NextResponse.json({
      success: true,
      vehicles,
      pagination: {
        total: totalVehicles,
        count: vehicles.length,
        page: 1,
        totalPages: Math.ceil(totalVehicles / 50)
      },
      meta: {
        message: 'Vehicles loaded via direct PostgreSQL (bypassing Prisma)',
        method: 'direct-postgresql'
      }
    });

  } catch (error) {
    console.error('Direct vehicles API failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      vehicles: [],
      pagination: {
        total: 0,
        count: 0,
        page: 1,
        totalPages: 0
      }
    }, { status: 500 });
  }
}