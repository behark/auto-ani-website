/**
 * Audi Q5 Business Sport Finnish Import Upload Script
 */

const { uploadVehicle } = require('./upload-vehicle.js');
const fs = require('fs');
const path = require('path');

// Audi Q5 Business Sport Data
const audiQ5Data = {
  brand: 'Audi',
  model: 'Q5 Business Sport (Finnish)',
  year: 2020,
  price: 17999,
  mileage: 220000,
  fuelType: 'petrol',
  transmission: 'automatic',
  category: 'suv',
  color: 'Glacier White Metallic',
  engine: '2.0L TFSI Quattro',
  status: 'available',
  condition: 'used_excellent',
  featured: true, // Premium Finnish Q5!
  description: 'Audi Q5 Business Sport 2020 import finlandez në gjendje të shkëlqyer. Motor 2.0 TFSI me 163 PS, Quattro AWD. Distance Control, Lane Assist, kamera, 3 çelësa dhe Webasto.',
  features: [
    'abs',
    'airbags',
    'esc',
    'traction_control',
    'blind_spot',
    'lane_departure',
    'parking_sensors',
    'backup_camera',
    'ac',
    'climate_control',
    'heated_seats',
    'leather_seats',
    'memory_seats',
    'gps',
    'bluetooth',
    'usb',
    'wireless_charging',
    'android_auto',
    'carplay',
    'premium_sound',
    'led_headlights',
    'electric_windows',
    'electric_mirrors',
    'keyless_entry',
    'push_start',
    'sport_mode',
    'cruise_control',
    'adaptive_cruise',
    'awd',
    'alloy_wheels'
  ],
  specifications: {
    doors: 5,
    seats: 5,
    engineSize: 2.0,
    power: 163,
    torque: 320,
    acceleration: 8.6,
    topSpeed: 215,
    fuelConsumption: 6.8,
    co2Emissions: 154,
    trunkCapacity: 550
  },
  financing: {
    available: true,
    downPayment: 20,
    monthlyPayment: 245,
    loanTerm: 84,
    interestRate: 3.9,
    tradeInAccepted: true
  },
  imagePaths: []
};

async function main() {
  const folderPath = '/home/behar/Desktop/New Folder (5)';

  try {
    console.log('🚀 Starting Audi Q5 Finnish upload to Sanity...\n');

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
    console.log(`📸 Found ${audiImages.length} Audi Q5 images to upload`);

    audiQ5Data.imagePaths = audiImages;
    const result = await uploadVehicle(audiQ5Data);

    console.log('\n🎉 SUCCESS! Audi Q5 uploaded to Sanity CMS!');
    console.log(`🔗 Vehicle ID: ${result._id}`);
    console.log(`🌐 Check your website: http://localhost:3456/vehicles/${result.slug.current}`);

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
  }
}

main();