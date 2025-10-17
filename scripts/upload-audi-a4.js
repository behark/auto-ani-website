/**
 * Audi A4 S-Line Quattro Upload Script
 */

const { uploadVehicle } = require('./upload-vehicle.js');
const fs = require('fs');
const path = require('path');

// Audi A4 S-Line Data
const audiA4Data = {
  brand: 'Audi',
  model: 'A4 S-Line Quattro',
  year: 2015,
  price: 11600,
  mileage: 250000,
  fuelType: 'diesel',
  transmission: 'automatic',
  category: 'sedan',
  color: 'Glacier White Metallic',
  engine: '2.0L TDI Quattro',
  status: 'available',
  condition: 'used_excellent',
  featured: true, // Quattro AWD is premium!
  description: 'Audi A4 S-Line Quattro 2015 me teknologji të avancuar. Pa doganë, import evropian. Motor 2.0 TDI me 190 PS, Quattro AWD. Histori shërbimi në Audi, Drive Select, ulëse Alcantara.',
  features: [
    'abs',
    'airbags',
    'esc',
    'traction_control',
    'parking_sensors',
    'ac',
    'climate_control',
    'heated_seats',
    'leather_seats',
    'gps',
    'bluetooth',
    'usb',
    'premium_sound',
    'led_headlights',
    'fog_lights',
    'electric_windows',
    'electric_mirrors',
    'keyless_entry',
    'push_start',
    'sport_mode',
    'cruise_control',
    'awd',
    'alloy_wheels'
  ],
  specifications: {
    doors: 4,
    seats: 5,
    engineSize: 2.0,
    power: 190,
    torque: 400,
    acceleration: 7.9,
    topSpeed: 235,
    fuelConsumption: 5.1,
    co2Emissions: 134,
  },
  financing: {
    available: true,
    downPayment: 15,
    monthlyPayment: 160,
    loanTerm: 84,
    interestRate: 4.6,
    tradeInAccepted: true
  },
  imagePaths: []
};

async function main() {
  const folderPath = '/home/behar/Desktop/New Folder (5)';

  try {
    console.log('🚀 Starting Audi A4 S-Line Quattro upload to Sanity...\n');

    // Get newest images
    const files = fs.readdirSync(folderPath);
    const stats = files
      .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/))
      .map(file => ({
        name: file,
        path: path.join(folderPath, file),
        mtime: fs.statSync(path.join(folderPath, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);

    const audiImages = stats.slice(0, 8).map(item => item.path);

    console.log(`📸 Found ${audiImages.length} Audi A4 images to upload`);

    audiA4Data.imagePaths = audiImages;
    const result = await uploadVehicle(audiA4Data);

    console.log('\n🎉 SUCCESS! Audi A4 uploaded to Sanity CMS!');
    console.log(`🔗 Vehicle ID: ${result._id}`);
    console.log(`🌐 Check your website: http://localhost:3456/vehicles/${result.slug.current}`);

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
  }
}

main();