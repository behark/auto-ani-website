const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const QUALITY = 75;
const MAX_WIDTH = 1200;

async function optimizeImage(inputPath, outputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  
  if (ext === '.jpg' || ext === '.jpeg') {
    await sharp(inputPath)
      .resize(MAX_WIDTH, null, { withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(outputPath.replace(/\.(jpg|jpeg)$/i, '.webp'));
    
    console.log(`✓ ${path.basename(inputPath)} → ${path.basename(outputPath).replace(/\.(jpg|jpeg)$/i, '.webp')}`);
  }
}

async function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      await processDirectory(fullPath);
    } else if (file.match(/\.(jpg|jpeg)$/i) && !file.includes('-optimized')) {
      const outputPath = fullPath.replace(/\.(jpg|jpeg)$/i, '-optimized.webp');
      await optimizeImage(fullPath, outputPath);
    }
  }
}

processDirectory('./public/images/vehicles/optimized').catch(console.error);
