const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Vehicles that still need optimization
const vehiclesToOptimize = [
  'bmw-318-m-sport-(f30)-2017',
  'bmw-520d-xdrive-sport-line-2019',
  'bmw-x4-30d-xdrive-m-sport-2022',
  'mercedes-benz-c220-bluetec-2015',
  'seat-leon-fr-dsg-2018',
  'seat-tarraco-xcellence-4drive-2019',
  'skoda-octavia-style-crystal-lights-2022',
  'skoda-superb-style-business-line-2018',
  'skoda-superb-style-business-matrix-2020'
];

const inputDir = './public/images/vehicles';
const outputDir = './public/images/optimized/vehicles';

// Sizes for responsive images
const sizes = [
  { width: 640, suffix: '640w' },
  { width: 1280, suffix: '1280w' }
];

async function optimizeImage(inputPath, outputPath, width) {
  try {
    await sharp(inputPath)
      .resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({
        quality: 85,
        effort: 6
      })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    return stats.size;
  } catch (error) {
    console.error(`❌ Error optimizing ${inputPath}:`, error.message);
    return 0;
  }
}

async function processVehicle(vehicleSlug) {
  console.log(`\n🚗 Processing: ${vehicleSlug}`);

  // Get all JPG files for this vehicle
  const files = fs.readdirSync(inputDir)
    .filter(file => file.startsWith(vehicleSlug) && file.endsWith('.jpg'));

  if (files.length === 0) {
    console.log(`⚠️  No images found for ${vehicleSlug}`);
    return;
  }

  // Create output directory for this vehicle
  const vehicleOutputDir = path.join(outputDir, vehicleSlug);
  if (!fs.existsSync(vehicleOutputDir)) {
    fs.mkdirSync(vehicleOutputDir, { recursive: true });
  }

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let processedCount = 0;

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const baseName = path.basename(file, '.jpg');
    const imageNumber = baseName.split('-').pop();

    // Get original size
    const originalStats = fs.statSync(inputPath);
    totalOriginalSize += originalStats.size;

    // Create original WebP
    const originalOutput = path.join(vehicleOutputDir, `${imageNumber}-original.webp`);
    const originalSize = await optimizeImage(inputPath, originalOutput, null);
    totalOptimizedSize += originalSize;

    // Create responsive sizes
    for (const size of sizes) {
      const resizedOutput = path.join(vehicleOutputDir, `${imageNumber}-${size.suffix}.webp`);
      const resizedSize = await optimizeImage(inputPath, resizedOutput, size.width);
      totalOptimizedSize += resizedSize;
    }

    processedCount++;
    process.stdout.write(`  ✓ ${processedCount}/${files.length} images processed\r`);
  }

  console.log(`\n  ✅ Completed: ${processedCount} images`);
  console.log(`  📦 Original: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  📦 Optimized: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  💾 Saved: ${(((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100).toFixed(1)}%`);
}

async function main() {
  console.log('🎨 Vehicle Image Optimizer\n');
  console.log(`📂 Input: ${inputDir}`);
  console.log(`📂 Output: ${outputDir}\n`);
  console.log(`🚗 Vehicles to optimize: ${vehiclesToOptimize.length}\n`);

  const startTime = Date.now();

  for (const vehicle of vehiclesToOptimize) {
    await processVehicle(vehicle);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✨ All done! Completed in ${elapsed}s\n`);
  console.log('💡 Next steps:');
  console.log('   1. Review the optimized images in public/images/optimized/vehicles/');
  console.log('   2. Update your code to use the optimized images');
  console.log('   3. Delete the original JPG files from public/images/vehicles/');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
