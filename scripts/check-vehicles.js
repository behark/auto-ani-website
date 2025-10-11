#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function checkVehicles() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking vehicles in database...');

    const count = await prisma.vehicle.count();
    console.log(`📊 Total vehicles: ${count}`);

    if (count > 0) {
      const vehicles = await prisma.vehicle.findMany({
        take: 5,
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          status: true
        }
      });

      console.log('🚗 Sample vehicles:');
      vehicles.forEach(v => {
        console.log(`  - ${v.make} ${v.model} (${v.year}) - ${v.status}`);
      });
    } else {
      console.log('❌ No vehicles found in database');
    }

  } catch (error) {
    console.error('❌ Error checking vehicles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVehicles();