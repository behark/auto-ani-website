import { NextResponse } from 'next/server';

// API endpoint to seed database from Render
export async function POST() {
  try {
    console.log('🌱 Starting database seeding from API...');

    const { Pool } = require('pg');

    const vehicles = [
      {
        id: 'clm1234567890abcdef1',
        make: 'BMW',
        model: 'X5',
        year: 2022,
        price: 45000,
        mileage: 25000,
        fuelType: 'PETROL',
        transmission: 'AUTOMATIC',
        bodyType: 'SUV',
        status: 'AVAILABLE',
        featured: true,
        description: 'BMW X5 në gjendje të shkëlqyer, me të gjitha opsionet e nevojshme për udhëtime komfortable.',
        images: '["https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"]',
        location: 'Prishtinë',
        doors: 5,
        seats: 7,
        drivetrain: 'AWD',
        engineSize: 3.0,
        color: 'Blu',
        condition: 'EXCELLENT'
      },
      {
        id: 'clm1234567890abcdef2',
        make: 'Mercedes',
        model: 'C-Class',
        year: 2021,
        price: 38000,
        mileage: 35000,
        fuelType: 'DIESEL',
        transmission: 'AUTOMATIC',
        bodyType: 'SEDAN',
        status: 'AVAILABLE',
        featured: true,
        description: 'Mercedes C-Class premium me teknologji të avancuar dhe komfort të lartë.',
        images: '["https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"]',
        location: 'Prishtinë',
        doors: 4,
        seats: 5,
        drivetrain: 'RWD',
        engineSize: 2.0,
        color: 'E zezë',
        condition: 'VERY_GOOD'
      },
      {
        id: 'clm1234567890abcdef3',
        make: 'Audi',
        model: 'A4',
        year: 2020,
        price: 32000,
        mileage: 45000,
        fuelType: 'PETROL',
        transmission: 'AUTOMATIC',
        bodyType: 'SEDAN',
        status: 'AVAILABLE',
        featured: false,
        description: 'Audi A4 elegante dhe sportive, ideale për qytet dhe udhëtime të gjata.',
        images: '["https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"]',
        location: 'Prishtinë',
        doors: 4,
        seats: 5,
        drivetrain: 'FWD',
        engineSize: 2.0,
        color: 'E bardhë',
        condition: 'GOOD'
      },
      {
        id: 'clm1234567890abcdef4',
        make: 'Volkswagen',
        model: 'Golf',
        year: 2023,
        price: 28000,
        mileage: 15000,
        fuelType: 'PETROL',
        transmission: 'MANUAL',
        bodyType: 'HATCHBACK',
        status: 'AVAILABLE',
        featured: true,
        description: 'Volkswagen Golf i ri me teknologji moderne dhe konsum të ulët karburanti.',
        images: '["https://images.unsplash.com/photo-1609521263047-f8f205293f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"]',
        location: 'Mitrovicë',
        doors: 5,
        seats: 5,
        drivetrain: 'FWD',
        engineSize: 1.5,
        color: 'Gri',
        condition: 'EXCELLENT'
      },
      {
        id: 'clm1234567890abcdef5',
        make: 'Toyota',
        model: 'RAV4',
        year: 2022,
        price: 35000,
        mileage: 20000,
        fuelType: 'HYBRID',
        transmission: 'AUTOMATIC',
        bodyType: 'SUV',
        status: 'AVAILABLE',
        featured: false,
        description: 'Toyota RAV4 Hybrid, ekonomike dhe miqësore me mjedisin.',
        images: '["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"]',
        location: 'Prishtinë',
        doors: 5,
        seats: 5,
        drivetrain: 'AWD',
        engineSize: 2.5,
        color: 'E kuqe',
        condition: 'VERY_GOOD'
      }
    ];

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const client = await pool.connect();

    // Check current vehicle count
    const countResult = await client.query('SELECT COUNT(*) as count FROM vehicles');
    const currentCount = parseInt(countResult.rows[0].count);
    console.log(`📊 Current vehicles in database: ${currentCount}`);

    let seedingPerformed = false;

    if (currentCount === 0) {
      console.log('🚗 Adding vehicles to database...');
      seedingPerformed = true;

      for (const vehicle of vehicles) {
        const insertQuery = `
          INSERT INTO vehicles (
            id, make, model, year, price, mileage, "fuelType", transmission, "bodyType",
            status, featured, description, images, location, doors, seats, drivetrain,
            "engineSize", color, condition, "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW()
          ) ON CONFLICT (id) DO NOTHING
        `;

        const values = [
          vehicle.id, vehicle.make, vehicle.model, vehicle.year, vehicle.price,
          vehicle.mileage, vehicle.fuelType, vehicle.transmission, vehicle.bodyType,
          vehicle.status, vehicle.featured, vehicle.description, vehicle.images,
          vehicle.location, vehicle.doors, vehicle.seats, vehicle.drivetrain,
          vehicle.engineSize, vehicle.color, vehicle.condition
        ];

        await client.query(insertQuery, values);
        console.log(`✅ Added: ${vehicle.make} ${vehicle.model}`);
      }
    }

    // Final count
    const finalCountResult = await client.query('SELECT COUNT(*) as count FROM vehicles');
    const finalCount = parseInt(finalCountResult.rows[0].count);

    client.release();
    await pool.end();

    return NextResponse.json({
      success: true,
      message: seedingPerformed ? 'Database seeded successfully!' : 'Database already has vehicles',
      vehiclesCount: finalCount,
      seedingPerformed,
      environment: process.env.NODE_ENV
    });

  } catch (error) {
    console.error('❌ Seeding failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to seed database'
    }, { status: 500 });
  }
}