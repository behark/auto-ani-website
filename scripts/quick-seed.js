#!/usr/bin/env node

/**
 * Quick Database Seed Script for Render
 * This script adds a few test vehicles to ensure the database has data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const testVehicles = [
  {
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
    description: 'BMW X5 në gjendje të shkëlqyer',
    images: ['/images/vehicles/bmw-x5.jpg'],
    location: 'Prishtinë'
  },
  {
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
    description: 'Mercedes C-Class premium',
    images: ['/images/vehicles/mercedes-c.jpg'],
    location: 'Prishtinë'
  },
  {
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
    description: 'Audi A4 elegante dhe sportive',
    images: ['/images/vehicles/audi-a4.jpg'],
    location: 'Prishtinë'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting quick database seed...');

    // Test connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');

    // Check if vehicles already exist
    const existingVehicles = await prisma.vehicle.count();
    console.log(`📊 Current vehicles in database: ${existingVehicles}`);

    if (existingVehicles > 0) {
      console.log('✅ Database already has vehicles, skipping seed');
      return;
    }

    // Add test vehicles
    console.log('🚗 Adding test vehicles...');

    for (const vehicle of testVehicles) {
      const created = await prisma.vehicle.create({
        data: vehicle
      });
      console.log(`✅ Created vehicle: ${created.make} ${created.model}`);
    }

    const finalCount = await prisma.vehicle.count();
    console.log(`🎉 Seed completed! Total vehicles: ${finalCount}`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Quick seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Quick seed failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };