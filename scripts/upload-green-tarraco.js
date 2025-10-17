/**
 * SEAT Tarraco Green Metallic Upload Script
 */

const { uploadVehicle } = require('./upload-vehicle.js');
const fs = require('fs');
const path = require('path');

// Green SEAT Tarraco Data
const greenTarracoData = {
  brand: 'Seat',
  model: 'Tarraco Xcellence 4Drive Green',
  year: 2019,
  price: 19900,
  mileage: 180000,
  fuelType: 'petrol',
  transmission: 'automatic',
  category: 'suv',
  color: 'Verde Metallic',
  engine: '2.0L TSI DSG',
  status: 'available',
  condition: 'used_excellent',
  featured: true,
  description: 'SEAT Tarraco Xcellence 4Drive 2019 në ngjyrë të gjelbërt metalike. SUV familjar 7-vendësh me AWD. Digital cockpit, Distance Control, Lane Assist, Park Assist, kamera, Webasto.',
  features: [
    'abs',
    'airbags',
    'esc',
    'traction_control',
    'lane_departure',
    'parking_sensors',
    'backup_camera',
    'ac',
    'climate_control',
    'heated_seats',
    'leather_seats',
    'gps',
    'bluetooth',
    'usb',
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
    seats: 7,
    engineSize: 2.0,
    power: 150,
    torque: 250,
    acceleration: 9.8,
    topSpeed: 200,
    fuelConsumption: 7.2,
    co2Emissions: 164,
    trunkCapacity: 700
  },
  financing: {
    available: true,
    downPayment: 20,
    monthlyPayment: 270,
    loanTerm: 84,
    interestRate: 4.0,
    tradeInAccepted: true
  },
  imagePaths: []
};

async function main() {
  const folderPath = '/home/behar/Desktop/New Folder (5)';

  try {
    console.log('🚀 Starting Green SEAT Tarraco upload to Sanity...\n');

    const files = fs.readdirSync(folderPath);
    const stats = files
      .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/))
      .map(file => ({
        name: file,
        path: path.join(folderPath, file),
        mtime: fs.statSync(path.join(folderPath, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);

    const tarracoImages = stats.slice(0, 8).map(item => item.path);
    console.log(`📸 Found ${tarracoImages.length} Green Tarraco images to upload`);

    greenTarracoData.imagePaths = tarracoImages;
    const result = await uploadVehicle(greenTarracoData);

    console.log('\n🎉 SUCCESS! Green Tarraco uploaded to Sanity CMS!');
    console.log(`🔗 Vehicle ID: ${result._id}`);
    console.log(`🌐 Check your website: http://localhost:3456/vehicles/${result.slug.current}`);

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
  }
}

main();