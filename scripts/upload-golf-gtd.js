/**
 * VW Golf 7 GTD Facelift Upload Script
 */

const { uploadVehicle } = require('./upload-vehicle.js');
const fs = require('fs');
const path = require('path');

// VW Golf 7 GTD Data
const golfGTDData = {
  brand: 'Volkswagen',
  model: 'Golf 7 GTD Facelift',
  year: 2017,
  price: 13800,
  mileage: 255000,
  fuelType: 'diesel',
  transmission: 'automatic',
  category: 'hatchback',
  color: 'Carbon Steel Gray Metallic',
  engine: '2.0L TDI DSG GTD',
  status: 'available',
  condition: 'used_good',
  featured: true, // GTD is always special!
  description: 'Volkswagen Golf 7 GTD Facelift 2017 sportiv dhe efikas. RKS të regjistruara, gati për përdorim. Motor 2.0 TDI me 184 PS, DSG automatik. Panoramë, kokpit digjital, paketë GTD sportive.',
  features: [
    'abs',
    'airbags',
    'esc',
    'traction_control',
    'parking_sensors',
    'ac',
    'climate_control',
    'heated_seats',
    'panoramic_roof',
    'gps',
    'bluetooth',
    'usb',
    'android_auto',
    'carplay',
    'premium_sound',
    'led_headlights',
    'fog_lights',
    'electric_windows',
    'electric_mirrors',
    'keyless_entry',
    'push_start',
    'sport_mode',
    'cruise_control',
    'alloy_wheels'
  ],
  specifications: {
    doors: 5,
    seats: 5,
    engineSize: 2.0,
    power: 184,
    torque: 380,
    acceleration: 7.4,
    topSpeed: 230,
    fuelConsumption: 4.9,
    co2Emissions: 127,
  },
  financing: {
    available: true,
    downPayment: 15,
    monthlyPayment: 190,
    loanTerm: 84,
    interestRate: 4.4,
    tradeInAccepted: true
  },
  imagePaths: [] // Will be populated below
};

async function main() {
  const folderPath = '/home/behar/Desktop/New Folder (5)';

  try {
    console.log('🚀 Starting VW Golf 7 GTD upload to Sanity...\n');

    // Get newest images (should be Golf GTD)
    const files = fs.readdirSync(folderPath);
    const stats = files
      .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/))
      .map(file => ({
        name: file,
        path: path.join(folderPath, file),
        mtime: fs.statSync(path.join(folderPath, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);

    // Take the newest images
    const golfImages = stats.slice(0, 8).map(item => item.path);

    console.log(`📸 Found ${golfImages.length} Golf GTD images to upload`);
    console.log('📋 Latest images:', stats.slice(0, 5).map(s => s.name));

    if (golfImages.length === 0) {
      throw new Error('No Golf GTD images found!');
    }

    // Add image paths to vehicle data
    golfGTDData.imagePaths = golfImages;

    // Upload vehicle
    const result = await uploadVehicle(golfGTDData);

    console.log('\n🎉 SUCCESS! VW Golf 7 GTD uploaded to Sanity CMS!');
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