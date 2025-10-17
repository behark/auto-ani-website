/**
 * BMW 520d xDrive Sport Line Upload Script - FINAL VEHICLE!
 */

const { uploadVehicle } = require('./upload-vehicle.js');
const fs = require('fs');
const path = require('path');

// BMW 520d xDrive Data
const bmw520dData = {
  brand: 'BMW',
  model: '520d xDrive Sport Line',
  year: 2019,
  price: 14900,
  mileage: 188000,
  fuelType: 'diesel',
  transmission: 'automatic',
  category: 'sedan',
  color: 'Alpine White',
  engine: '2.0L TwinPower Turbo xDrive',
  status: 'available',
  condition: 'used_excellent',
  featured: true, // Executive BMW flagship!
  description: 'BMW 520d xDrive Sport Line 2019 executive sedan në gjendje të shkëlqyer. xDrive AWD, 190 PS TwinPower Turbo. Shërbim në BMW, Park Assist, Auto Brake, Intelligent Safety, Attention Assist.',
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
    'awd',
    'alloy_wheels'
  ],
  specifications: {
    doors: 4,
    seats: 5,
    engineSize: 2.0,
    power: 190,
    torque: 400,
    acceleration: 7.0,
    topSpeed: 240,
    fuelConsumption: 5.2,
    co2Emissions: 137,
  },
  financing: {
    available: true,
    downPayment: 15,
    monthlyPayment: 205,
    loanTerm: 84,
    interestRate: 4.2,
    tradeInAccepted: true
  },
  imagePaths: []
};

async function main() {
  const folderPath = '/home/behar/Desktop/New Folder (5)';

  try {
    console.log('🚀 Starting BMW 520d xDrive upload to Sanity - FINAL VEHICLE!\n');

    const files = fs.readdirSync(folderPath);
    const stats = files
      .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/))
      .map(file => ({
        name: file,
        path: path.join(folderPath, file),
        mtime: fs.statSync(path.join(folderPath, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);

    const bmwImages = stats.slice(0, 10).map(item => item.path);
    console.log(`📸 Found ${bmwImages.length} BMW 520d images to upload`);
    console.log('📋 Latest images:', stats.slice(0, 5).map(s => s.name));

    bmw520dData.imagePaths = bmwImages;
    const result = await uploadVehicle(bmw520dData);

    console.log('\n🎉🎉🎉 SUCCESS! BMW 520d uploaded to Sanity CMS! 🎉🎉🎉');
    console.log(`🔗 Vehicle ID: ${result._id}`);
    console.log(`🌐 Check your website: http://localhost:3456/vehicles/${result.slug.current}`);
    console.log('\n🏆 INVENTORY COMPLETE! 🏆');
    console.log('🌟 AUTO ANI now has a WORLD-CLASS vehicle showroom! 🌟');

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
  }
}

main();