import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Vehicle Image Verification Report ===\n');

  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      slug: true,
      make: true,
      model: true,
      year: true,
      images: true
    },
    orderBy: {
      make: 'asc'
    }
  });

  console.log(`Total vehicles in database: ${vehicles.length}\n`);

  let totalImages = 0;
  let existingImages = 0;
  let missingImages = 0;

  for (const vehicle of vehicles) {
    const imageArray = JSON.parse(vehicle.images);
    console.log(`\n${vehicle.make} ${vehicle.model} ${vehicle.year}`);
    console.log(`  Slug: ${vehicle.slug}`);
    console.log(`  Expected images: ${imageArray.length}`);

    let vehicleExistingImages = 0;
    let vehicleMissingImages = 0;

    for (const imagePath of imageArray) {
      totalImages++;
      const fullPath = path.join('/home/behar/auto-ani-website/public', imagePath);

      if (fs.existsSync(fullPath)) {
        vehicleExistingImages++;
        existingImages++;
      } else {
        vehicleMissingImages++;
        missingImages++;
        console.log(`  ✗ MISSING: ${imagePath}`);
      }
    }

    if (vehicleMissingImages === 0) {
      console.log(`  ✓ All ${vehicleExistingImages} images exist`);
      console.log(`  First: ${imageArray[0]}`);
      console.log(`  Last: ${imageArray[imageArray.length - 1]}`);
    } else {
      console.log(`  ⚠ ${vehicleExistingImages} exist, ${vehicleMissingImages} missing`);
    }
  }

  console.log('\n\n=== Summary ===');
  console.log(`Total vehicles: ${vehicles.length}`);
  console.log(`Total images: ${totalImages}`);
  console.log(`Existing images: ${existingImages} (${((existingImages / totalImages) * 100).toFixed(1)}%)`);
  console.log(`Missing images: ${missingImages} (${((missingImages / totalImages) * 100).toFixed(1)}%)`);

  if (missingImages === 0) {
    console.log('\n✓ All vehicle images are properly configured!');
  } else {
    console.log('\n⚠ Some images are missing. Please check the paths above.');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });