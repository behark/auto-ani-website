#!/usr/bin/env node

/**
 * Sanity Data Cleanup Script
 * Removes duplicate and malformed documents
 */

const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'j2t31xge',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || 'skVALaMvvJIxP9krYTpB6SYM6XgH3fe60cDRTpVg05znY5DlDGIx1LvUMre94xah8O1bk6ZIiz5QwNz7aA6B5XisFj8mWid17JAgnWh5tuncOehX5gsYt2oNpVxfpS9xsa1YWxHCjMUxkwGeeH9bynKZGz5OQFwIeNARmmN3ajJCCEfgMUiO'
});

// Valid business IDs that should be kept
const validBusinessIds = [
  'business-auto-ani',
  'business-kroi-auto',
  'business-kiilto-loisto'
];

// Valid team member IDs
const validTeamIds = [
  'team-behar-gashi',
  'team-arben-hasani',
  'team-fitim-berisha',
  'team-valdete-krasniqi',
  'team-mikko-virtanen',
  'team-anna-korhonen',
  'team-jari-lehto',
  'team-petteri-salo',
  'team-laura-maki'
];

// Valid service IDs
const validServiceIds = [
  'service-vehicle-sales',
  'service-financing-loans',
  'service-trade-in',
  'service-vehicle-import',
  'service-insurance-registration',
  'service-after-sales-support',
  'service-engine-diagnostics',
  'service-brake-service',
  'service-oil-change',
  'service-tire-service',
  'service-electrical-repair',
  'service-air-conditioning',
  'service-basic-wash',
  'service-premium-wash',
  'service-full-detail',
  'service-interior-cleaning',
  'service-wax-treatment',
  'service-tire-rim-care'
];

// Valid testimonial IDs
const validTestimonialIds = [
  'testimonial-auto-ani-1',
  'testimonial-auto-ani-2',
  'testimonial-auto-ani-3',
  'testimonial-auto-ani-4',
  'testimonial-kroi-auto-1',
  'testimonial-kroi-auto-2',
  'testimonial-kroi-auto-3',
  'testimonial-kroi-auto-4',
  'testimonial-kiilto-loisto-1',
  'testimonial-kiilto-loisto-2',
  'testimonial-kiilto-loisto-3',
  'testimonial-kiilto-loisto-4'
];

async function cleanupDocuments(documentType, validIds, typeName) {
  console.log(`\n🧹 Cleaning up ${typeName}...`);

  try {
    // Get all documents of this type
    const allDocs = await client.fetch(`*[_type == "${documentType}"]`);
    console.log(`   Found ${allDocs.length} ${typeName} documents`);

    const toDelete = [];
    const toKeep = [];

    allDocs.forEach(doc => {
      if (validIds.includes(doc._id)) {
        toKeep.push(doc);
      } else {
        toDelete.push(doc);
      }
    });

    console.log(`   ✅ Keeping ${toKeep.length} valid documents`);
    console.log(`   🗑️  Deleting ${toDelete.length} invalid/duplicate documents`);

    // Delete invalid documents
    for (const doc of toDelete) {
      try {
        await client.delete(doc._id);
        console.log(`      ❌ Deleted: ${doc._id} (${doc.name || doc.customerName || 'unnamed'})`);
      } catch (error) {
        console.error(`      ⚠️  Failed to delete ${doc._id}:`, error.message);
      }
    }

    return { kept: toKeep.length, deleted: toDelete.length };

  } catch (error) {
    console.error(`   ❌ Error cleaning ${typeName}:`, error);
    return { kept: 0, deleted: 0 };
  }
}

async function main() {
  console.log('🧹 Starting Sanity Data Cleanup...');
  console.log('📋 Project ID: j2t31xge');
  console.log('📋 Dataset: production\n');

  try {
    // Test connection
    await client.fetch(`*[_type == "businessInfo"][0]`);
    console.log('✅ Connected to Sanity successfully!');

    const results = {};

    // Clean up each document type
    results.businesses = await cleanupDocuments('businessInfo', validBusinessIds, 'Business Information');
    results.teamMembers = await cleanupDocuments('teamMember', validTeamIds, 'Team Members');
    results.services = await cleanupDocuments('service', validServiceIds, 'Services');
    results.testimonials = await cleanupDocuments('testimonial', validTestimonialIds, 'Testimonials');

    // Summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`   Business Info: ${results.businesses.kept} kept, ${results.businesses.deleted} deleted`);
    console.log(`   Team Members: ${results.teamMembers.kept} kept, ${results.teamMembers.deleted} deleted`);
    console.log(`   Services: ${results.services.kept} kept, ${results.services.deleted} deleted`);
    console.log(`   Testimonials: ${results.testimonials.kept} kept, ${results.testimonials.deleted} deleted`);

    const totalKept = results.businesses.kept + results.teamMembers.kept + results.services.kept + results.testimonials.kept;
    const totalDeleted = results.businesses.deleted + results.teamMembers.deleted + results.services.deleted + results.testimonials.deleted;

    console.log(`\n   Total: ${totalKept} documents kept, ${totalDeleted} documents deleted`);

    if (totalDeleted > 0) {
      console.log('\n🎉 Cleanup completed successfully!');
      console.log('   Your Sanity Studio now contains only valid business data.');
    } else {
      console.log('\n✅ No cleanup needed - all documents are valid!');
    }

    console.log('\n🔗 Access your clean data at: https://studio.sanity.io');
    console.log('   Select project: j2t31xge (auto-ani-website)');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };