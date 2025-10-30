const sharp = require('sharp');
const fs = require('fs');

const images = [
  'public/images/hero-bg.jpg',
  'public/images/showroom.jpg',
  'public/images/customer_lounge.jpg',
  'public/images/service_center.jpg',
  'public/images/showroom_interior.jpg',
  'public/images/cover.jpg'
];

async function optimize() {
  for (const img of images) {
    if (fs.existsSync(img)) {
      await sharp(img)
        .resize(1920, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(img.replace('.jpg', '.webp'));
      console.log(`✓ ${img} → WebP`);
    }
  }
}

optimize().catch(console.error);
