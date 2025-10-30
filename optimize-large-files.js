const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeFile(file) {
  const size = fs.statSync(file).size;
  
  if (size > 200000) { // >200KB
    const output = file.replace('.webp', '-temp.webp');
    await sharp(file)
      .resize(1200, null, { withoutEnlargement: true })
      .webp({ quality: 70 }) // Lower quality
      .toFile(output);
    
    fs.unlinkSync(file);
    fs.renameSync(output, file);
    console.log(`✓ ${path.basename(file)} ${(size/1024).toFixed(0)}KB → ${(fs.statSync(file).size/1024).toFixed(0)}KB`);
  }
}

async function processDir(dir) {
  const files = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
  for (const file of files) {
    if (file.isFile() && file.name.endsWith('.webp')) {
      await optimizeFile(path.join(file.path, file.name));
    }
  }
}

processDir('./public/images').catch(console.error);
