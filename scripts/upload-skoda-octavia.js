/**
 * Skoda Octavia Style 2022 Crystal Lights Upload Script
 */

const { uploadVehicle } = require('./upload-vehicle.js');
const fs = require('fs');
const path = require('path');

// Skoda Octavia Style 2022 Data
const skodaOctaviaData = {
  brand: 'Skoda',
  model: 'Octavia Style Crystal Lights',
  year: 2022,
  price: 21400,
  mileage: 220000,
  fuelType: 'petrol',
  transmission: 'automatic',
  category: 'hatchback',
  color: 'Brilliant Silver Metallic',
  engine: '1.5L TSI DSG',
  status: 'available',
  condition: 'used_excellent',
  featured: true, // 2022 with Crystal tech!
  description: 'Skoda Octavia Style 2022 me teknologji Crystal Lights në gjendje të përsosur. Shërbim në Skoda, ulëse me kujtesë dhe ngrohje, timon me ngrohje, Lane/Side Assist, 360° kamera.',
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
    'alloy_wheels'
  ],
  specifications: {
    doors: 5,
    seats: 5,
    engineSize: 1.5,
    power: 150,
    torque: 250,
    acceleration: 8.5,
    topSpeed: 220,
    fuelConsumption: 5.8,
    co2Emissions: 132,
    trunkCapacity: 590
  },
  financing: {
    available: true,
    downPayment: 20,
    monthlyPayment: 290,
    loanTerm: 84,
    interestRate: 3.9,
    tradeInAccepted: true
  },
  imagePaths: []
};

async function main() {
  const folderPath = '/home/behar/Desktop/New Folder (5)';

  try {
    console.log('🚀 Starting Skoda Octavia Style 2022 upload to Sanity...\n');

    const files = fs.readdirSync(folderPath);
    const stats = files
      .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/))
      .map(file => ({
        name: file,
        path: path.join(folderPath, file),
        mtime: fs.statSync(path.join(folderPath, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);

    const octaviaImages = stats.slice(0, 8).map(item => item.path);
    console.log(`📸 Found ${octaviaImages.length} Skoda Octavia images to upload`);

    skodaOctaviaData.imagePaths = octaviaImages;
    const result = await uploadVehicle(skodaOctaviaData);

    console.log('\n🎉 SUCCESS! Skoda Octavia uploaded to Sanity CMS!');
    console.log(`🔗 Vehicle ID: ${result._id}`);
    console.log(`🌐 Check your website: http://localhost:3456/vehicles/${result.slug.current}`);

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
  }
}

main();