const fs = require('fs');
const path = require('path');

// Complete mapping of ALL vehicle slugs to their optimized folders
const SLUG_TO_FOLDER = {
  'volkswagen-passat-b8-highline-2015': 'vw-passat-b8-2016',
  'volkswagen-golf-7-gtd-facelift-2017': 'golf-7-gtd-2017',
  'peugeot-3008-premium-2018': 'peugeot-3008-premium-2018',
  'seat-leon-fr-dsg-2018': 'seat-leon-fr-dsg-2018',
  'seat-tarraco-xcellence-4drive-2019': 'seat-tarraco-xcellence-4drive-2019',
  'skoda-octavia-style-crystal-lights-2022': 'skoda-octavia-style-crystal-lights-2022',
  'skoda-superb-style-business-line-2018': 'skoda-superb-style-business-line-2018',
  'skoda-superb-style-business-matrix-2020': 'skoda-superb-style-business-matrix-2020',
  'skoda-superb-l&k-business-2020': 'skoda-superb-2020',
  'skoda-superb-laurin-&-klement-2018': 'skoda-superb-2018',
};

const vehiclesPath = path.join(__dirname, '../data/vehicles.ts');
let content = fs.readFileSync(vehiclesPath, 'utf8');
let fixCount = 0;

console.log('🔧 Fixing ALL remaining vehicle image paths...\n');

Object.entries(SLUG_TO_FOLDER).forEach(([slug, folder]) => {
  const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Fix main image
  const mainPattern = new RegExp(`"/images/vehicles/${escapedSlug}-main\\.jpg"`, 'g');
  if (content.match(mainPattern)) {
    content = content.replace(mainPattern, `"/images/optimized/vehicles/${folder}/1-original.webp"`);
    console.log(`✅ Fixed: ${slug} → ${folder}`);
    fixCount++;
  }

  // Fix gallery images
  for (let i = 1; i <= 25; i++) {
    const galleryPattern = new RegExp(`"/images/vehicles/${escapedSlug}-${i}\\.jpg"`, 'g');
    content = content.replace(galleryPattern, `"/images/optimized/vehicles/${folder}/${i}-original.webp"`);
  }
});

fs.writeFileSync(vehiclesPath, content, 'utf8');

console.log(`\n✨ Fixed ${fixCount} vehicles!`);
console.log('🎯 All images now point to optimized WebP files');
