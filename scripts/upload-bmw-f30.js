/**
 * BMW F30 318 M-Sport Upload Script
 */

const { uploadVehicle } = require('./upload-vehicle.js');
const fs = require('fs');
const path = require('path');

// BMW F30 318 M-Sport Data
const bmwF30Data = {
  brand: 'BMW',
  model: '318 M-Sport (F30)',
  year: 2017,
  price: 15400,
  mileage: 220000,
  fuelType: 'petrol',
  transmission: 'automatic',
  category: 'sedan',
  color: 'Storm Bay', // Common F30 color
  engine: '2.0L TwinPower Turbo',
  status: 'available',
  condition: 'used_good',
  featured: true, // Great value BMW!
  description: 'BMW 318 F30 M-Sport 2017 me paketë të plotë M-Sport. Pa doganë, import evropian. Motor 2.0 TwinPower Turbo, automatik. Shërbyer rregullisht në BMW.',
  features: [
    'abs',
    'airbags',
    'esc',
    'ac',
    'climate_control',
    'heated_seats',
    'leather_seats',
    'led_headlights',
    'bluetooth',
    'electric_windows',
    'keyless_entry',
    'push_start',
    'cruise_control',
    'sport_mode'
  ],
  specifications: {
    doors: 4,
    seats: 5,
    engineSize: 2.0,
    power: 150,
    torque: 220,
    acceleration: 8.9,
    topSpeed: 210,
    fuelConsumption: 6.4,
    co2Emissions: 149,
  },
  financing: {
    available: true,
    downPayment: 15,
    monthlyPayment: 210,
    loanTerm: 84,
    interestRate: 4.2,
    tradeInAccepted: true
  },
  imagePaths: [] // Will be populated below
};

async function main() {
  const folderPath = '/home/behar/Desktop/New Folder (5)';

  try {
    console.log('🚀 Starting BMW F30 318 M-Sport upload to Sanity...\n');

    // Get all image files (filter out the BMW X4 images we already used)
    const files = fs.readdirSync(folderPath);
    const newImageFiles = files
      .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/))
      .filter(file => file.includes('494')) // Only the new F30 images
      .map(file => path.join(folderPath, file));

    console.log(`📸 Found ${newImageFiles.length} F30 images to upload`);

    if (newImageFiles.length === 0) {
      throw new Error('No new F30 images found!');
    }

    // Add image paths to vehicle data
    bmwF30Data.imagePaths = newImageFiles;

    // Upload vehicle
    const result = await uploadVehicle(bmwF30Data);

    console.log('\n🎉 SUCCESS! BMW F30 uploaded to Sanity CMS!');
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