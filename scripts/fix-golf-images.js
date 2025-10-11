#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixGolfImages() {
  console.log('🔧 Fixing Golf 7 GTD images...');

  // Update Golf 7 GTD with correct image paths
  const golfImages = Array.from({length: 14}, (_, i) => `/images/vehicles/golf-7-gtd-2017/${i + 1}.jpg`);

  await prisma.vehicle.update({
    where: { id: 'golf-7-gtd-2017' },
    data: {
      images: JSON.stringify(golfImages)
    }
  });

  console.log('✅ Golf 7 GTD images fixed!');
  console.log('📸 Images:', golfImages);
}

async function main() {
  try {
    await fixGolfImages();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();