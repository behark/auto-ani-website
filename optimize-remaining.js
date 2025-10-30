const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeWebP(file) {
  if (file.includes('-original.webp') && fs.statSync(file).size > 400000) {
    const output = file.replace('-original.webp', '-opt.webp');
    await sharp(file)
      .resize(1200, null, { withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(output);
    
    fs.unlinkSync(file); // Delete original
    fs.renameSync(output, file); // Rename optimized
    console.log(`✓ Optimized: ${path.basename(file)}`);
  }
}

async function processDir(dir) {
  const files = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
  for (const file of files) {
    if (file.isFile() && file.name.endsWith('.webp')) {
      await optimizeWebP(path.join(file.path, file.name));
    }
  }
}

processDir('./public/images/optimized').catch(console.error);
