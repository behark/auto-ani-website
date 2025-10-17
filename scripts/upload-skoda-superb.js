/**
 * Skoda Superb Style Business Line Upload Script
 */

const { uploadVehicle } = require('./upload-vehicle.js');
const fs = require('fs');
const path = require('path');

// Skoda Superb Style Business Data
const skodaSuperbData = {
  brand: 'Skoda',
  model: 'Superb Style Business Line',
  year: 2018,
  price: 16500,
  mileage: 270, // Only 270km! Practically new!
  fuelType: 'diesel',
  transmission: 'automatic',
  category: 'sedan',
  color: 'Meteor Gray Metallic',
  engine: '2.0L TDI DSG',
  status: 'available',
  condition: 'used_excellent', // Practically new condition!
  featured: true, // This is PREMIUM!
  description: 'Skoda Superb Style Business Line 2018 në gjendje të përsosur. Vetëm 270 km, rrip i ndërruar dhe shërbim i kryer. Teknologji luksoze: Alcantara, Canton, LED ambient 10-ngjyra, Line Assist, Distance Control.',
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
    power: 150,
    torque: 340,
    acceleration: 8.4,
    topSpeed: 220,
    fuelConsumption: 4.7,
    co2Emissions: 123,
    trunkCapacity: 625
  },
  financing: {
    available: true,
    downPayment: 20,
    monthlyPayment: 225,
    loanTerm: 84,
    interestRate: 4.1,
    tradeInAccepted: true
  },
  imagePaths: [] // Will be populated below
};

async function main() {
  const folderPath = '/home/behar/Desktop/New Folder (5)';

  try {
    console.log('🚀 Starting Skoda Superb Style Business upload to Sanity...\n');

    // Get newest images (should be Skoda Superb)
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
    const skodaImages = stats.slice(0, 10).map(item => item.path);

    console.log(`📸 Found ${skodaImages.length} Skoda Superb images to upload`);
    console.log('📋 Latest images:', stats.slice(0, 5).map(s => s.name));

    if (skodaImages.length === 0) {
      throw new Error('No Skoda Superb images found!');
    }

    // Add image paths to vehicle data
    skodaSuperbData.imagePaths = skodaImages;

    // Upload vehicle
    const result = await uploadVehicle(skodaSuperbData);

    console.log('\n🎉 SUCCESS! Skoda Superb uploaded to Sanity CMS!');
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