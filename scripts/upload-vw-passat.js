/**
 * VW Passat B8 Highline Upload Script
 */

const { uploadVehicle } = require('./upload-vehicle.js');
const fs = require('fs');
const path = require('path');

// VW Passat B8 Highline Data
const vwPassatData = {
  brand: 'Volkswagen',
  model: 'Passat B8 Highline',
  year: 2015,
  price: 13000,
  mileage: 270000,
  fuelType: 'petrol',
  transmission: 'automatic',
  category: 'sedan',
  color: 'Platinum Gray Metallic',
  engine: '2.0L DSG',
  status: 'available',
  condition: 'used_good',
  featured: true, // Amazing value for money!
  description: 'Volkswagen Passat B8 Highline 2015 me paketë të plotë premium. Pa doganë, import evropian. Teknologji e avancuar me Drive Select, Distance Control, Auto Parking. Ulëse Alcantara me ngrohje, klima 3-zonale.',
  features: [
    'abs',
    'airbags',
    'esc',
    'traction_control',
    'parking_sensors',
    'backup_camera',
    'ac',
    'climate_control',
    'heated_seats',
    'electric_seats',
    'gps',
    'bluetooth',
    'premium_sound',
    'led_headlights',
    'electric_windows',
    'electric_mirrors',
    'keyless_entry',
    'push_start',
    'sport_mode',
    'cruise_control',
    'adaptive_cruise'
  ],
  specifications: {
    doors: 4,
    seats: 5,
    engineSize: 2.0,
    power: 150,
    torque: 250,
    acceleration: 9.1,
    topSpeed: 210,
    fuelConsumption: 6.8,
    co2Emissions: 155,
  },
  financing: {
    available: true,
    downPayment: 15,
    monthlyPayment: 180,
    loanTerm: 84,
    interestRate: 4.5,
    tradeInAccepted: true
  },
  imagePaths: [] // Will be populated below
};

async function main() {
  const folderPath = '/home/behar/Desktop/New Folder (5)';

  try {
    console.log('🚀 Starting VW Passat B8 Highline upload to Sanity...\n');

    // Get all image files (filter for VW Passat images - the 493/494xxx series)
    const files = fs.readdirSync(folderPath);
    const passatImageFiles = files
      .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/))
      .filter(file => file.includes('493') || (file.includes('494') && parseInt(file.match(/494(\d+)/)?.[1] || '0') < 400)) // VW Passat images
      .map(file => path.join(folderPath, file));

    console.log(`📸 Found ${passatImageFiles.length} Passat images to upload`);

    if (passatImageFiles.length === 0) {
      throw new Error('No VW Passat images found!');
    }

    // Add image paths to vehicle data
    vwPassatData.imagePaths = passatImageFiles;

    // Upload vehicle
    const result = await uploadVehicle(vwPassatData);

    console.log('\n🎉 SUCCESS! VW Passat B8 uploaded to Sanity CMS!');
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