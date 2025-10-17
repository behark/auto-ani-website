/**
 * AUTO ANI Vehicle Upload Script
 * Automatically uploads vehicle data and images to Sanity CMS
 */

const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'j2t31xge',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, // Required for uploads
});

async function uploadImage(imagePath, altText) {
  try {
    console.log(`📤 Uploading image: ${path.basename(imagePath)}`);

    const imageAsset = await client.assets.upload('image', fs.createReadStream(imagePath), {
      filename: path.basename(imagePath),
    });

    console.log(`✅ Image uploaded: ${imageAsset._id}`);

    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: imageAsset._id,
      },
      alt: altText,
    };
  } catch (error) {
    console.error(`❌ Failed to upload ${imagePath}:`, error.message);
    return null;
  }
}

async function uploadVehicle(vehicleData) {
  try {
    console.log(`🚗 Creating vehicle: ${vehicleData.brand} ${vehicleData.model}`);

    // Upload main image first
    const mainImageRef = await uploadImage(vehicleData.imagePaths[0], `${vehicleData.brand} ${vehicleData.model} - Main Image`);

    if (!mainImageRef) {
      throw new Error('Failed to upload main image');
    }

    // Upload gallery images
    const galleryImages = [];
    for (let i = 1; i < vehicleData.imagePaths.length; i++) {
      const imageRef = await uploadImage(
        vehicleData.imagePaths[i],
        `${vehicleData.brand} ${vehicleData.model} - Image ${i + 1}`
      );
      if (imageRef) {
        galleryImages.push(imageRef);
      }
    }

    // Create vehicle document
    const vehicleDoc = {
      _type: 'vehicle',
      brand: vehicleData.brand,
      model: vehicleData.model,
      title: `${vehicleData.brand} ${vehicleData.model} ${vehicleData.year}`,
      year: vehicleData.year,
      price: vehicleData.price,
      originalPrice: vehicleData.originalPrice,
      mileage: vehicleData.mileage,
      fuelType: vehicleData.fuelType,
      transmission: vehicleData.transmission,
      category: vehicleData.category,
      color: vehicleData.color,
      engine: vehicleData.engine,
      status: vehicleData.status || 'available',
      condition: vehicleData.condition || 'used_excellent',
      featured: vehicleData.featured || false,
      mainImage: mainImageRef,
      gallery: galleryImages,
      description: vehicleData.description,
      features: vehicleData.features || [],
      specifications: vehicleData.specifications || {},
      financing: vehicleData.financing || {},
      seo: {
        metaTitle: `${vehicleData.brand} ${vehicleData.model} ${vehicleData.year} - €${vehicleData.price?.toLocaleString()} | AUTO ANI`,
        metaDescription: `${vehicleData.brand} ${vehicleData.model} ${vehicleData.year} në shitje në AUTO ANI. Çmimi: €${vehicleData.price?.toLocaleString()}. ${vehicleData.mileage?.toLocaleString()} km. Kontaktoni për më shumë detaje.`,
        keywords: [
          vehicleData.brand,
          vehicleData.model,
          vehicleData.year?.toString(),
          vehicleData.fuelType,
          'Kosovo',
          'Mitrovica',
          'AUTO ANI',
          'vetura',
          'makina'
        ]
      },
      slug: {
        _type: 'slug',
        current: `${vehicleData.brand.toLowerCase()}-${vehicleData.model.toLowerCase().replace(/\s+/g, '-')}-${vehicleData.year}`
      },
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    const result = await client.create(vehicleDoc);
    console.log(`🎉 Vehicle created successfully: ${result._id}`);

    return result;
  } catch (error) {
    console.error(`❌ Failed to create vehicle:`, error.message);
    throw error;
  }
}

// BMW X4 Data
const bmwX4Data = {
  brand: 'BMW',
  model: 'X4 30d xDrive M-Sport',
  year: 2022,
  price: 36999,
  mileage: 180000,
  fuelType: 'diesel',
  transmission: 'automatic',
  category: 'suv',
  color: 'Phytonic Blue Metallic',
  engine: '3.0L TDI',
  status: 'available',
  condition: 'used_excellent',
  featured: true, // This BMW deserves to be featured! ⭐
  description: 'BMW X4 30d xDrive M-Sport Facelift 2022 në gjendje të shkëlqyer. Import evropian, gatshëm për eksport. Ngjyrë Phytonic Blue Metallic, paketë M-Sport komplekte.',
  features: [
    'abs',
    'airbags',
    'esc',
    'ac',
    'climate_control',
    'heated_seats',
    'leather_seats',
    'gps',
    'bluetooth',
    'carplay',
    'premium_sound',
    'alloy_wheels',
    'led_headlights',
    'electric_windows',
    'keyless_entry',
    'push_start',
    'cruise_control',
    'awd'
  ],
  specifications: {
    doors: 5,
    seats: 5,
    engineSize: 3.0,
    power: 286,
    torque: 650,
    fuelConsumption: 6.8,
    co2Emissions: 179,
  },
  financing: {
    available: true,
    downPayment: 20,
    monthlyPayment: 485,
    loanTerm: 84,
    interestRate: 3.9,
    tradeInAccepted: true
  },
  imagePaths: [] // Will be populated below
};

// Get all image paths from the folder
async function main() {
  const folderPath = '/home/behar/Desktop/New Folder (5)';

  try {
    console.log('🚀 Starting BMW X4 upload to Sanity...\n');

    // Get all image files
    const files = fs.readdirSync(folderPath);
    const imageFiles = files
      .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/))
      .map(file => path.join(folderPath, file));

    console.log(`📸 Found ${imageFiles.length} images to upload`);

    if (imageFiles.length === 0) {
      throw new Error('No images found in the folder!');
    }

    // Add image paths to vehicle data
    bmwX4Data.imagePaths = imageFiles;

    // Upload vehicle
    const result = await uploadVehicle(bmwX4Data);

    console.log('\n🎉 SUCCESS! BMW X4 uploaded to Sanity CMS!');
    console.log(`🔗 Vehicle ID: ${result._id}`);
    console.log(`🌐 Check your website: http://localhost:3456/vehicles/${result.slug.current}`);
    console.log(`🎛️ Edit in Sanity: http://localhost:3333`);

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    process.exit(1);
  }
}

// Run the upload
if (require.main === module) {
  main();
}

module.exports = { uploadVehicle, uploadImage };