/**
 * Skoda Superb 2020 Matrix Facelift Upload Script
 */

const { uploadVehicle } = require('./upload-vehicle.js');
const fs = require('fs');
const path = require('path');

// Skoda Superb 2020 Matrix Data
const skodaSuperbMatrixData = {
  brand: 'Skoda',
  model: 'Superb Style Business Matrix',
  year: 2020,
  price: 14499, // INCREDIBLE VALUE!
  mileage: 300, // Practically brand new!
  fuelType: 'diesel',
  transmission: 'automatic',
  category: 'sedan',
  color: 'Business Gray Metallic',
  engine: '2.0L TDI DSG Matrix',
  status: 'available',
  condition: 'used_excellent', // Like new!
  featured: true, // FLAGSHIP VEHICLE!
  description: 'Skoda Superb Style Business Matrix 2020 në gjendje të përsosur. Vetëm 300 km, rrip i ndërruar. Teknologji Matrix LED, kokpit digjital, Canton, LED ambient 10-ngjyra, Line Assist, Distance Control.',
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
    'cooled_seats',
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
    doors: 4,
    seats: 5,
    engineSize: 2.0,
    power: 190,
    torque: 400,
    acceleration: 7.8,
    topSpeed: 235,
    fuelConsumption: 4.5,
    co2Emissions: 118,
    trunkCapacity: 625
  },
  financing: {
    available: true,
    downPayment: 25,
    monthlyPayment: 200,
    loanTerm: 84,
    interestRate: 3.8,
    tradeInAccepted: true
  },
  imagePaths: []
};

async function main() {
  const folderPath = '/home/behar/Desktop/New Folder (5)';

  try {
    console.log('🚀 Starting Skoda Superb Matrix 2020 upload to Sanity...\n');

    const files = fs.readdirSync(folderPath);
    const stats = files
      .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/))
      .map(file => ({
        name: file,
        path: path.join(folderPath, file),
        mtime: fs.statSync(path.join(folderPath, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);

    const skodaImages = stats.slice(0, 10).map(item => item.path);
    console.log(`📸 Found ${skodaImages.length} Skoda Superb Matrix images to upload`);

    skodaSuperbMatrixData.imagePaths = skodaImages;
    const result = await uploadVehicle(skodaSuperbMatrixData);

    console.log('\n🎉 SUCCESS! Skoda Superb Matrix uploaded to Sanity CMS!');
    console.log(`🔗 Vehicle ID: ${result._id}`);
    console.log(`🌐 Check your website: http://localhost:3456/vehicles/${result.slug.current}`);

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
  }
}

main();