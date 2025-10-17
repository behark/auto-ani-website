/**
 * SEAT Tarraco Xcellence 4Drive Upload Script
 */

const { uploadVehicle } = require('./upload-vehicle.js');
const fs = require('fs');
const path = require('path');

// SEAT Tarraco Xcellence Data
const seatTarracoData = {
  brand: 'Seat',
  model: 'Tarraco Xcellence 4Drive',
  year: 2019,
  price: 21999,
  mileage: 215000,
  fuelType: 'petrol',
  transmission: 'automatic',
  category: 'suv',
  color: 'Pearl White',
  engine: '2.0L TSI DSG',
  status: 'available',
  condition: 'used_excellent',
  featured: true, // Family SUV with premium features!
  description: 'SEAT Tarraco Xcellence 4Drive 2019 në gjendje të shkëlqyer. SUV familjar 7-vendësh me AWD. Digital cockpit, panoramë, Park Assist, Lane Assist. Rrip i ndërruar dhe shërbim i kryer.',
  features: [
    'abs',
    'airbags',
    'esc',
    'traction_control',
    'blind_spot',
    'lane_departure',
    'parking_sensors',
    'backup_camera',
    'panoramic_roof',
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
    monthlyPayment: 295,
    loanTerm: 84,
    interestRate: 4.0,
    tradeInAccepted: true
  },
  imagePaths: []
};

async function main() {
  const folderPath = '/home/behar/Desktop/New Folder (5)';

  try {
    console.log('🚀 Starting SEAT Tarraco Xcellence upload to Sanity...\n');

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
    console.log(`📸 Found ${tarracoImages.length} SEAT Tarraco images to upload`);

    seatTarracoData.imagePaths = tarracoImages;
    const result = await uploadVehicle(seatTarracoData);

    console.log('\n🎉 SUCCESS! SEAT Tarraco uploaded to Sanity CMS!');
    console.log(`🔗 Vehicle ID: ${result._id}`);
    console.log(`🌐 Check your website: http://localhost:3456/vehicles/${result.slug.current}`);

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
  }
}

main();