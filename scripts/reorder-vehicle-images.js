/**
 * AUTO ANI Vehicle Image Reorder Script
 * Reverses image order for all vehicles - makes latest uploaded images first
 */

const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '.env.local' });

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'j2t31xge',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
});

async function reorderVehicleImages() {
  try {
    console.log('🔄 Starting vehicle image reorder process...\n');

    // Fetch all vehicles with their images
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

    console.log(`📋 Found ${vehicles.length} vehicles to process\n`);

    for (const vehicle of vehicles) {
      const vehicleName = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
      console.log(`🚗 Processing: ${vehicleName}`);

      // Skip if no gallery or only one image
      if (!vehicle.gallery || vehicle.gallery.length <= 1) {
        console.log(`  ⏭️  No gallery or single image - skipping`);
        continue;
      }

      console.log(`  📸 Current gallery has ${vehicle.gallery.length} images`);

      // Reverse the gallery array (latest uploaded will become first)
      const reorderedGallery = [...vehicle.gallery].reverse();

      // Set the first image (originally last) as the new main image
      const newMainImage = reorderedGallery[0];

      // Remove the new main image from gallery to avoid duplication
      const newGallery = reorderedGallery.slice(1);

      console.log(`  🔄 Reordering: ${vehicle.gallery.length} → main + ${newGallery.length} gallery`);

      // Update the vehicle document
      const result = await client
        .patch(vehicle._id)
        .set({
          mainImage: newMainImage,
          gallery: newGallery,
          lastUpdated: new Date().toISOString()
        })
        .commit();

      console.log(`  ✅ Updated successfully\n`);
    }

    console.log('🎉 All vehicle images reordered successfully!');
    console.log('\n🔍 Summary:');
    console.log(`  📊 Processed: ${vehicles.length} vehicles`);
    console.log(`  🔄 Reordered: Images now show latest photos first`);
    console.log(`  🌟 Your vehicles now have the best images as main photos!`);
    console.log('\n🌐 Check results at: http://localhost:3456/vehicles');

  } catch (error) {
    console.error('❌ Reorder failed:', error.message);
    process.exit(1);
  }
}

// Run the reorder
if (require.main === module) {
  reorderVehicleImages();
}

module.exports = { reorderVehicleImages };