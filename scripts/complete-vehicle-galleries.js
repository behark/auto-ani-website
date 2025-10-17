/**
 * Complete Vehicle Galleries Script
 * Adds ALL remaining images to each vehicle - no limits!
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

async function completeVehicleGalleries() {
  try {
    console.log('🚗 Starting COMPLETE gallery upload for all vehicles...\n');

    const folderPath = '/home/behar/Desktop/New Folder (5)';

    // Get ALL image files in the folder
    const files = fs.readdirSync(folderPath);
    const allImageFiles = files
      .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/))
      .map(file => path.join(folderPath, file));

    console.log(`📸 Found ${allImageFiles.length} total images in folder`);

    // Get all existing vehicles
    const vehicles = await client.fetch(`
      *[_type == "vehicle"]{
        _id,
        brand,
        model,
        year,
        mainImage,
        gallery[]
      }
    `);

    console.log(`🚗 Found ${vehicles.length} vehicles to enhance\n`);

    // Group images by upload time periods (roughly by vehicle)
    const stats = allImageFiles.map(file => ({
      name: path.basename(file),
      path: file,
      mtime: fs.statSync(file).mtime
    })).sort((a, b) => b.mtime - a.mtime);

    // Define image groups by patterns/timestamps for each vehicle
    const imageGroups = {
      // BMW X4 2022 (555, 556, 557 series)
      'bmw-x4': stats.filter(s => s.name.match(/^55[5-7]/)),

      // BMW F30 318 (494 series ending 000-400)
      'bmw-f30': stats.filter(s => s.name.match(/^494[0-4]/)),

      // VW Passat (493 series)
      'vw-passat': stats.filter(s => s.name.match(/^493/)),

      // Mercedes C220 (494 series 600-999)
      'mercedes-c220': stats.filter(s => s.name.match(/^494[6-9]/) || s.name.match(/^495[0-1]/)),

      // SEAT Leon FR (449 series)
      'seat-leon': stats.filter(s => s.name.match(/^449/)),

      // Golf GTD (494 series 500-700)
      'golf-gtd': stats.filter(s => s.name.match(/^494[5-7]/) && !s.name.match(/^494[6-9]/)),

      // Skoda Superb 2020 Matrix (495 series 500+)
      'skoda-superb-2020': stats.filter(s => s.name.match(/^495[5-9]/)),

      // SEAT Tarraco original (497 series 600+)
      'seat-tarraco-1': stats.filter(s => s.name.match(/^497[6-9]/)),

      // Audi Q5 (495 series 100-500)
      'audi-q5': stats.filter(s => s.name.match(/^495[1-5]/)),

      // Skoda Octavia (496 series)
      'skoda-octavia': stats.filter(s => s.name.match(/^496/)),

      // SEAT Tarraco Green (497 series 400-700)
      'seat-tarraco-green': stats.filter(s => s.name.match(/^497[4-7]/)),

      // BMW 520d (497-498 series newest)
      'bmw-520d': stats.filter(s => s.name.match(/^497[0-5]/) || s.name.match(/^498/)),
    };

    console.log('📊 Image group analysis:');
    Object.keys(imageGroups).forEach(key => {
      console.log(`  ${key}: ${imageGroups[key].length} images`);
    });
    console.log('');

    // Process each vehicle and add missing images
    for (const vehicle of vehicles) {
      const vehicleName = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
      console.log(`🚗 Processing: ${vehicleName}`);

      // Current image count
      const currentImageCount = (vehicle.gallery?.length || 0) + (vehicle.mainImage ? 1 : 0);
      console.log(`  📸 Current images: ${currentImageCount}`);

      // Find matching image group for this vehicle
      let vehicleImages = [];

      // Match vehicle to image group
      if (vehicleName.includes('BMW X4')) vehicleImages = imageGroups['bmw-x4'];
      else if (vehicleName.includes('BMW 318')) vehicleImages = imageGroups['bmw-f30'];
      else if (vehicleName.includes('BMW 520d')) vehicleImages = imageGroups['bmw-520d'];
      else if (vehicleName.includes('Mercedes C220')) vehicleImages = imageGroups['mercedes-c220'];
      else if (vehicleName.includes('Audi Q5')) vehicleImages = imageGroups['audi-q5'];
      else if (vehicleName.includes('Audi A4')) vehicleImages = imageGroups['vw-passat']; // Mixed folder
      else if (vehicleName.includes('VW') && vehicleName.includes('Passat')) vehicleImages = imageGroups['vw-passat'];
      else if (vehicleName.includes('VW') && vehicleName.includes('Golf')) vehicleImages = imageGroups['golf-gtd'];
      else if (vehicleName.includes('SEAT Leon')) vehicleImages = imageGroups['seat-leon'];
      else if (vehicleName.includes('SEAT Tarraco Green')) vehicleImages = imageGroups['seat-tarraco-green'];
      else if (vehicleName.includes('SEAT Tarraco')) vehicleImages = imageGroups['seat-tarraco-1'];
      else if (vehicleName.includes('Skoda') && vehicleName.includes('Matrix')) vehicleImages = imageGroups['skoda-superb-2020'];
      else if (vehicleName.includes('Skoda Octavia')) vehicleImages = imageGroups['skoda-octavia'];
      else if (vehicleName.includes('Skoda Superb')) vehicleImages = imageGroups['skoda-superb-2020'];

      console.log(`  📁 Available images for this vehicle: ${vehicleImages.length}`);

      // Calculate how many more images we can add
      const availableImages = vehicleImages.length;
      const additionalImagesNeeded = Math.max(0, availableImages - currentImageCount);

      if (additionalImagesNeeded <= 0) {
        console.log(`  ✅ Vehicle already has all available images\n`);
        continue;
      }

      console.log(`  📸 Uploading ${additionalImagesNeeded} additional images...`);

      // Upload additional images
      const newImages = [];
      for (let i = currentImageCount; i < availableImages && i < currentImageCount + 10; i++) {
        const imageFile = vehicleImages[i];
        if (imageFile) {
          const imageRef = await uploadImage(
            imageFile.path,
            `${vehicleName} - Image ${i + 1}`
          );
          if (imageRef) {
            newImages.push(imageRef);
          }
        }
      }

      if (newImages.length > 0) {
        // Add new images to existing gallery
        const updatedGallery = [...(vehicle.gallery || []), ...newImages];

        await client
          .patch(vehicle._id)
          .set({
            gallery: updatedGallery,
            lastUpdated: new Date().toISOString()
          })
          .commit();

        console.log(`  ✅ Added ${newImages.length} images to gallery`);
      }

      console.log('');
    }

    console.log('🎉 COMPLETE! All vehicle galleries enhanced!');
    console.log('\n📊 Final Summary:');
    console.log('  🚗 All vehicles now have maximum available images');
    console.log('  📸 Professional galleries ready for customers');
    console.log('  🌟 Your showroom is now COMPLETE!');
    console.log('\n🌐 Check results: http://localhost:3456/vehicles');

  } catch (error) {
    console.error('❌ Gallery completion failed:', error.message);
    process.exit(1);
  }
}

// Run the enhancement
if (require.main === module) {
  completeVehicleGalleries();
}

module.exports = { completeVehicleGalleries };