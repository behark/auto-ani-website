#!/usr/bin/env node
import { access, constants } from 'fs/promises';
import { join } from 'path';

/**
 * Validate all vehicle images referenced in seed files
 * and report missing images
 */

const PUBLIC_DIR = join(process.cwd(), 'public');

async function imageExists(imagePath: string): Promise<boolean> {
  try {
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const fullPath = join(PUBLIC_DIR, cleanPath);
    await access(fullPath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function validateVehicleImages() {
  console.log('🔍 Validating vehicle images...\n');

  // Import vehicle data from seed files
  const seedVehiclesModule = await import('../prisma/seed-vehicles');
  const vehicles = seedVehiclesModule.vehicles || [];

  let totalImages = 0;
  let missingImages = 0;
  let validImages = 0;

  for (const vehicle of vehicles) {
    console.log(`\n📚 Checking ${vehicle.make} ${vehicle.model} (${vehicle.year}):`);

    for (const imagePath of vehicle.images) {
      totalImages++;
      const exists = await imageExists(imagePath);

      if (exists) {
        validImages++;
        console.log(`  ✅ ${imagePath}`);
      } else {
        missingImages++;
        console.log(`  ❌ ${imagePath} (MISSING)`);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Image Validation Summary:');
  console.log('='.repeat(50));
  console.log(`Total images:   ${totalImages}`);
  console.log(`Valid images:   ${validImages} (${Math.round(validImages/totalImages * 100)}%)`);
  console.log(`Missing images: ${missingImages} (${Math.round(missingImages/totalImages * 100)}%)`);
  console.log('='.repeat(50));

  // Check team images
  console.log('\n🧑‍💼 Checking team images:');
  const teamImages = [
    '/images/team/behar-gashi.jpg',
    '/images/team/arben-hasani.jpg',
    '/images/team/fitim-berisha.jpg',
    '/images/team/valdete-krasniqi.jpg'
  ];

  for (const imagePath of teamImages) {
    const exists = await imageExists(imagePath);
    if (exists) {
      console.log(`  ✅ ${imagePath}`);
    } else {
      console.log(`  ❌ ${imagePath} (MISSING)`);
    }
  }

  return missingImages === 0;
}

// Run validation if executed directly
if (require.main === module) {
  validateVehicleImages()
    .then(success => {
      if (success) {
        console.log('\n✨ All images are valid!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Some images are missing. Please fix the issues above.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Error validating images:', error);
      process.exit(1);
    });
}

export { validateVehicleImages, imageExists };