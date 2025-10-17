/**
 * Mercedes C220 BlueTec Upload Script
 */

const { uploadVehicle } = require('./upload-vehicle.js');
const fs = require('fs');
const path = require('path');

// Mercedes C220 BlueTec Data
const mercedesC220Data = {
  brand: 'Mercedes-Benz',
  model: 'C220 BlueTec',
  year: 2015,
  price: 14000,
  mileage: 225000,
  fuelType: 'diesel',
  transmission: 'automatic',
  category: 'sedan',
  color: 'Obsidian Black Metallic',
  engine: '2.2L BlueTec Diesel',
  status: 'available',
  condition: 'used_excellent',
  featured: true, // Mercedes with incredible tech!
  description: 'Mercedes-Benz C220 BlueTec 2015 me teknologji të avancuar. Pa doganë, import evropian. Multi Beam LED, automatik 7-shpejtësi, 5 mënyra të ngasjes. Kamera 360°, auto-frenim, ulëse me ngrohje.',
  features: [
    'abs',
    'airbags',
    'esc',
    'traction_control',
    'blind_spot',
    'lane_departure',
    'parking_sensors',
    'backup_camera',
    'camera_360',
    'ac',
    'climate_control',
    'heated_seats',
    'memory_seats',
    'leather_seats',
    'gps',
    'bluetooth',
    'premium_sound',
    'led_headlights',
    'electric_windows',
    'electric_mirrors',
    'keyless_entry',
    'push_start',
    'sport_mode',
    'cruise_control',
    'adaptive_cruise'
  ],
  specifications: {
    doors: 4,
    seats: 5,
    engineSize: 2.2,
    power: 170,
    torque: 400,
    acceleration: 8.1,
    topSpeed: 230,
    fuelConsumption: 4.8,
    co2Emissions: 127,
  },
  financing: {
    available: true,
    downPayment: 20,
    monthlyPayment: 195,
    loanTerm: 84,
    interestRate: 4.3,
    tradeInAccepted: true
  },
  imagePaths: [] // Will be populated below
};

async function main() {
  const folderPath = '/home/behar/Desktop/New Folder (5)';

  try {
    console.log('🚀 Starting Mercedes C220 BlueTec upload to Sanity...\n');

    // Get all image files - look for Mercedes images (newest timestamps)
    const files = fs.readdirSync(folderPath);
    const stats = files
      .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/))
      .map(file => ({
        name: file,
        path: path.join(folderPath, file),
        mtime: fs.statSync(path.join(folderPath, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime); // Sort by newest first

    // Take the newest images (should be Mercedes)
    const mercedesImages = stats.slice(0, 10).map(item => item.path);

    console.log(`📸 Found ${mercedesImages.length} Mercedes images to upload`);
    console.log('📋 Latest images:', stats.slice(0, 5).map(s => s.name));

    if (mercedesImages.length === 0) {
      throw new Error('No Mercedes images found!');
    }

    // Add image paths to vehicle data
    mercedesC220Data.imagePaths = mercedesImages;

    // Upload vehicle
    const result = await uploadVehicle(mercedesC220Data);

    console.log('\n🎉 SUCCESS! Mercedes C220 uploaded to Sanity CMS!');
    console.log(`🔗 Vehicle ID: ${result._id}`);
    console.log(`🌐 Check your website: http://localhost:3456/vehicles/${result.slug.current}`);
    console.log(`🎛️ Edit in Sanity: http://localhost:3333`);

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    process.exit(1);
  }
}

// Run the upload
main();