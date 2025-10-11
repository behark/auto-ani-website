import { NextResponse } from 'next/server';

// Database schema diagnostic endpoint
export async function GET() {
  try {
    const { Pool } = require('pg');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const client = await pool.connect();

    // Get table schema
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'vehicles'
      ORDER BY ordinal_position;
    `;

    const schemaResult = await client.query(schemaQuery);
    const schema = schemaResult.rows;

    // Get vehicle count
    const countResult = await client.query('SELECT COUNT(*) as count FROM vehicles');
    const count = parseInt(countResult.rows[0].count);

    // Get sample vehicle (first one)
    let sampleVehicle = null;
    let error = null;

    try {
      const sampleResult = await client.query('SELECT * FROM vehicles LIMIT 1');
      sampleVehicle = sampleResult.rows[0];
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : String(e);
    }

    // Try simplified query
    let simplifiedVehicle = null;
    try {
      const simplifiedResult = await client.query('SELECT id, make, model, year FROM vehicles LIMIT 1');
      simplifiedVehicle = simplifiedResult.rows[0];
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : String(e);
    }

    client.release();
    await pool.end();

    return NextResponse.json({
      success: true,
      vehicleCount: count,
      schema,
      sampleVehicle,
      simplifiedVehicle,
      error,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Schema debug failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}