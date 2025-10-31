const fs = require('fs');
const path = require('path');

// Map of vehicle slugs to their optimized folder names
const SLUG_TO_FOLDER = {
  'audi-q5-business-sport-(finnish)-2020': 'audi-q5-2020',
  'audi-a4-s-line-quattro-2015': 'audi-a4-s-line-2015',
  'bmw-318-m-sport-(f30)-2017': 'bmw-318-m-sport-(f30)-2017',
  'bmw-520d-xdrive-sport-line-2019': 'bmw-520d-xdrive-sport-line-2019',
  'bmw-x4-30d-xdrive-m-sport-2022': 'bmw-x4-30d-xdrive-m-sport-2022',
  'mercedes-benz-c220-bluetec-2015': 'mercedes-benz-c220-bluetec-2015',
  'volkswagen-golf-7-gtd-2017': 'golf-7-gtd-2017',
  'peugeot-3008-premium-2018': 'peugeot-3008-premium-2018',
  'seat-leon-fr-dsg-2018': 'seat-leon-fr-dsg-2018',
  'seat-tarraco-xcellence-4drive-2019': 'seat-tarraco-xcellence-4drive-2019',
  'skoda-octavia-style-crystal-lights-2022': 'skoda-octavia-style-crystal-lights-2022',
  'skoda-superb-style-business-line-2018': 'skoda-superb-style-business-line-2018',
  'skoda-superb-style-business-matrix-2020': 'skoda-superb-style-business-matrix-2020',
  'volkswagen-passat-b8-2016': 'vw-passat-b8-2016',
  'skoda-superb-l&k-business-2020': 'skoda-superb-2020',
  'skoda-superb-laurin-&-klement-2018': 'skoda-superb-2018',
};

const vehiclesPath = path.join(__dirname, '../data/vehicles.ts');
let content = fs.readFileSync(vehiclesPath, 'utf8');

console.log('🔍 Fixing image paths...\n');

// Fix each vehicle's images
Object.entries(SLUG_TO_FOLDER).forEach(([slug, folder]) => {
  console.log(`Processing: ${slug} → ${folder}`);

  // Escape special regex characters in slug
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedSlug = escapeRegex(slug);

  // Fix main image - use 1-original.webp since there's no "main" image
  const oldMainPattern = `"/images/vehicles/${escapedSlug}-main\\.jpg"`;
  const newMainPath = `"/images/optimized/vehicles/${folder}/1-original.webp"`;
  const mainRegex = new RegExp(oldMainPattern, 'g');
  const mainMatches = content.match(mainRegex);
  if (mainMatches) {
    console.log(`  ✓ Fixed main image: ${mainMatches.length} occurrence(s)`);
    content = content.replace(mainRegex, newMainPath);
  }

  // Fix gallery images
  let galleryCount = 0;
  for (let i = 1; i <= 25; i++) {
    const oldGalleryPattern = `"/images/vehicles/${escapedSlug}-${i}\\.jpg"`;
    const newGalleryPath = `"/images/optimized/vehicles/${folder}/${i}-original.webp"`;
    const galleryRegex = new RegExp(oldGalleryPattern, 'g');
    const matches = content.match(galleryRegex);
    if (matches) {
      galleryCount += matches.length;
      content = content.replace(galleryRegex, newGalleryPath);
    }
  }
  if (galleryCount > 0) {
    console.log(`  ✓ Fixed gallery images: ${galleryCount} occurrence(s)`);
  }
  console.log('');
});

fs.writeFileSync(vehiclesPath, content, 'utf8');

console.log('✅ All image paths fixed!');
console.log('📁 Main images: /images/optimized/vehicles/[folder]/1-original.webp');
console.log('📁 Gallery images: /images/optimized/vehicles/[folder]/[N]-original.webp');
