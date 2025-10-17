/**
 * Replace Vehicle Images Script
 * Removes images from specific vehicle and adds new ones with correct order
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
  token: process.env.SANITY_API_TOKEN,
});

async function uploadImage(imagePath, altText) {
  try {
    console.log(`📤 Uploading: ${path.basename(imagePath)}`);

    const imageAsset = await client.assets.upload('image', fs.createReadStream(imagePath), {
      filename: path.basename(imagePath),
    });

    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: imageAsset._id,
      },
      alt: altText,
    };
  } catch (error) {
    console.error(`❌ Failed to upload ${path.basename(imagePath)}:`, error.message);
    return null;
  }
}

async function replaceVehicleImages(vehicleQuery, newImagesFolderPath) {
  try {
    console.log('🔄 Starting vehicle image replacement...\n');

    // Find the vehicle
    const vehicle = await client.fetch(`
      *[_type == "vehicle" && ${vehicleQuery}][0]{
        _id,
        brand,
        model,
        year,
        mainImage,
        gallery[]
      }
    `);

    if (!vehicle) {
      throw new Error('Vehicle not found!');
    }

    const vehicleName = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
    console.log(`🚗 Found vehicle: ${vehicleName}`);
    console.log(`📸 Current images: main + ${vehicle.gallery?.length || 0} gallery\n`);

    // Get all new image files from folder 6 (sorted by timestamp - oldest first)
    const files = fs.readdirSync(newImagesFolderPath);
    const newImageFiles = files
      .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/))
      .map(file => {
        const fullPath = path.join(newImagesFolderPath, file);
        const stats = fs.statSync(fullPath);
        return {
          name: file,
          path: fullPath,
          mtime: stats.mtime
        };
      })
      .sort((a, b) => a.mtime - b.mtime); // OLDEST FIRST for correct display order

    console.log(`📸 Found ${newImageFiles.length} new images to upload (sorted oldest first)\n`);

    if (newImageFiles.length === 0) {
      throw new Error('No images found in the specified folder!');
    }

    // Upload all new images
    console.log('📤 Uploading new images...');
    const uploadedImages = [];

    for (let i = 0; i < newImageFiles.length; i++) {
      const imageFile = newImageFiles[i];
      const imageRef = await uploadImage(
        imageFile.path,
        `${vehicleName} - Image ${i + 1}`
      );

      if (imageRef) {
        uploadedImages.push(imageRef);
      }
    }

    console.log(`✅ Uploaded ${uploadedImages.length} new images\n`);

    // Set first image as main, rest as gallery
    const newMainImage = uploadedImages[0];
    const newGallery = uploadedImages.slice(1);

    console.log('🔄 Updating vehicle with new images...');
    console.log(`  📸 New main image: ${path.basename(newImageFiles[0].name)}`);
    console.log(`  🖼️ New gallery: ${newGallery.length} images`);

    // Update vehicle with new images (REPLACES old images completely)
    const result = await client
      .patch(vehicle._id)
      .set({
        mainImage: newMainImage,
        gallery: newGallery,
        lastUpdated: new Date().toISOString()
      })
      .commit();

    console.log('\n🎉 SUCCESS! Vehicle images replaced!');
    console.log(`🔗 Vehicle ID: ${result._id}`);
    console.log(`🌐 Check result: http://localhost:3456/vehicles/${vehicleName.toLowerCase().replace(/\s+/g, '-')}`);
    console.log('✨ Images are now in correct chronological order!');

    return result;

  } catch (error) {
    console.error('❌ Image replacement failed:', error.message);
    throw error;
  }
}

// BMW X4 replacement (example usage)
async function replaceBMWX4Images() {
  const folderPath = '/home/behar/Desktop/New Folder (6)';

  if (!fs.existsSync(folderPath)) {
    console.log('❌ Folder 6 not found. Please create it and add BMW X4 images.');
    return;
  }

  try {
    await replaceVehicleImages(
      'brand == "BMW" && model match "*520d*"',
      folderPath
    );
  } catch (error) {
    console.error('BMW X4 replacement failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  replaceBMWX4Images();
}

module.exports = { replaceVehicleImages };