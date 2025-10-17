/**
 * SEAT Leon FR Upload Script
 */

const { uploadVehicle } = require('./upload-vehicle.js');
const fs = require('fs');
const path = require('path');

// SEAT Leon FR Data
const seatLeonData = {
  brand: 'Seat',
  model: 'Leon FR DSG',
  year: 2018, // Estimated based on FR model
  price: 9900,
  mileage: 190000,
  fuelType: 'petrol',
  transmission: 'automatic',
  category: 'hatchback',
  color: 'Midnight Black',
  engine: '1.4L TSI DSG',
  status: 'available',
  condition: 'used_good',
  featured: true, // AMAZING value for money!
  description: 'SEAT Leon FR DSG 2018 me performancë sportive. Pa doganë, import evropian. Motor 1.4 TSI me 184 PS, DSG automatik. Panoramë, LED, paketë FR sportive.',
  features: [
    'abs',
    'airbags',
    'esc',
    'ac',
    'climate_control',
    'heated_seats',
    'panoramic_roof',
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
    'alloy_wheels'
  ],
  specifications: {
    doors: 5,
    seats: 5,
    engineSize: 1.4,
    power: 184,
    torque: 250,
    acceleration: 7.2,
    topSpeed: 220,
    fuelConsumption: 6.2,
    co2Emissions: 142,
  },
  financing: {
    available: true,
    downPayment: 10,
    monthlyPayment: 135,
    loanTerm: 84,
    interestRate: 4.8,
    tradeInAccepted: true
  },
  imagePaths: [] // Will be populated below
};

async function main() {
  const folderPath = '/home/behar/Desktop/New Folder (5)';

  try {
    console.log('🚀 Starting SEAT Leon FR upload to Sanity...\n');

    // Get newest images (should be SEAT Leon)
    const files = fs.readdirSync(folderPath);
    const stats = files
      .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/))
      .map(file => ({
        name: file,
        path: path.join(folderPath, file),
        mtime: fs.statSync(path.join(folderPath, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);

    // Take the newest images (should be SEAT Leon)
    const seatImages = stats.slice(0, 8).map(item => item.path);

    console.log(`📸 Found ${seatImages.length} SEAT Leon images to upload`);
    console.log('📋 Latest images:', stats.slice(0, 5).map(s => s.name));

    if (seatImages.length === 0) {
      throw new Error('No SEAT Leon images found!');
    }

    // Add image paths to vehicle data
    seatLeonData.imagePaths = seatImages;

    // Upload vehicle
    const result = await uploadVehicle(seatLeonData);

    console.log('\n🎉 SUCCESS! SEAT Leon FR uploaded to Sanity CMS!');
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