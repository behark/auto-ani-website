#!/usr/bin/env node

/**
 * Export data from Supabase and import to Render PostgreSQL
 */

const { Pool } = require('pg');

// Source database (Supabase)
const sourcePool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Target database (Render PostgreSQL)
const targetConnectionString = "postgresql://auto_ani_database_user:YJSYWhqW3bQXYfu0aX3qTPuCzVsEt29L@dpg-d3i0pn33fgac73a64kog-a.oregon-postgres.render.com/auto_ani_database";

const targetPool = new Pool({
  connectionString: targetConnectionString,
  ssl: { rejectUnauthorized: false }
});

async function migrateData() {
  try {
    console.log('🚀 Starting migration from Supabase to Render PostgreSQL...');

    // Export vehicles from Supabase
    console.log('📤 Exporting vehicles from Supabase...');
    const sourceClient = await sourcePool.connect();

    const vehiclesQuery = `
      SELECT
        id, slug, make, model, year, price, mileage, "fuelType", transmission,
        "bodyType", color, "engineSize", drivetrain, features, images,
        description, featured, status, vin, doors, seats, "createdAt", "updatedAt"
      FROM vehicles
      ORDER BY "createdAt"
    `;

    const vehiclesResult = await sourceClient.query(vehiclesQuery);
    const vehicles = vehiclesResult.rows;

    console.log(`✅ Exported ${vehicles.length} vehicles from Supabase`);
    sourceClient.release();

    if (vehicles.length === 0) {
      console.log('❌ No vehicles to migrate!');
      return;
    }

    // Setup Render database schema
    console.log('🏗️ Setting up Render database schema...');
    const targetClient = await targetPool.connect();

    // Create vehicles table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        price INTEGER NOT NULL,
        mileage INTEGER NOT NULL,
        "fuelType" TEXT NOT NULL,
        transmission TEXT NOT NULL,
        "bodyType" TEXT NOT NULL,
        color TEXT NOT NULL,
        "engineSize" TEXT NOT NULL,
        drivetrain TEXT NOT NULL,
        features TEXT NOT NULL,
        images TEXT NOT NULL,
        description TEXT NOT NULL,
        featured BOOLEAN DEFAULT false,
        status TEXT DEFAULT 'AVAILABLE',
        vin TEXT UNIQUE,
        doors INTEGER,
        seats INTEGER,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_vehicles_featured_status ON vehicles (featured, status);
      CREATE INDEX IF NOT EXISTS idx_vehicles_make_model_year ON vehicles (make, model, year, status);
    `;

    await targetClient.query(createTableQuery);
    console.log('✅ Database schema created');

    // Import vehicles to Render
    console.log('📥 Importing vehicles to Render...');

    for (const vehicle of vehicles) {
      const insertQuery = `
        INSERT INTO vehicles (
          id, slug, make, model, year, price, mileage, "fuelType", transmission, "bodyType",
          color, "engineSize", drivetrain, features, images, description, featured,
          status, vin, doors, seats, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        ) ON CONFLICT (id) DO NOTHING
      `;

      const values = [
        vehicle.id, vehicle.slug, vehicle.make, vehicle.model, vehicle.year,
        vehicle.price, vehicle.mileage, vehicle.fuelType, vehicle.transmission,
        vehicle.bodyType, vehicle.color, vehicle.engineSize, vehicle.drivetrain,
        vehicle.features, vehicle.images, vehicle.description, vehicle.featured,
        vehicle.status, vehicle.vin, vehicle.doors, vehicle.seats,
        vehicle.createdAt, vehicle.updatedAt
      ];

      await targetClient.query(insertQuery, values);
      console.log(`✅ Migrated: ${vehicle.make} ${vehicle.model} (${vehicle.year})`);
    }

    targetClient.release();

    // Verify migration
    const verifyClient = await targetPool.connect();
    const countResult = await verifyClient.query('SELECT COUNT(*) as count FROM vehicles');
    const finalCount = parseInt(countResult.rows[0].count);
    verifyClient.release();

    console.log(`🎉 Migration completed successfully!`);
    console.log(`📊 Total vehicles in Render database: ${finalCount}`);
    console.log(`🔗 New DATABASE_URL: ${targetConnectionString}`);

    console.log('\n✅ Next steps:');
    console.log('1. Update DATABASE_URL in Render dashboard');
    console.log('2. Redeploy your web service');
    console.log('3. Test that vehicles load properly with Prisma');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('✅ Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });