#!/usr/bin/env node

/**
 * Sanity Data Verification Script
 * Checks if all business data was properly created in Sanity
 */

const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'j2t31xge',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || 'skVALaMvvJIxP9krYTpB6SYM6XgH3fe60cDRTpVg05znY5DlDGIx1LvUMre94xah8O1bk6ZIiz5QwNz7aA6B5XisFj8mWid17JAgnWh5tuncOehX5gsYt2oNpVxfpS9xsa1YWxHCjMUxkwGeeH9bynKZGz5OQFwIeNARmmN3ajJCCEfgMUiO'
});

async function verifyData() {
  console.log('🔍 Verifying Sanity Data...\n');

  try {
    // Check Business Info
    const businesses = await client.fetch(`*[_type == "businessInfo"] | order(name asc)`);
    console.log(`📋 Business Information: ${businesses.length} documents`);
    businesses.forEach(business => {
      console.log(`   ✅ ${business.name} (${business.businessType})`);
    });

    // Check Team Members
    const teamMembers = await client.fetch(`*[_type == "teamMember"] | order(name asc)`);
    console.log(`\n👥 Team Members: ${teamMembers.length} documents`);

    const businessGroups = {};
    teamMembers.forEach(member => {
      const businessId = member.businessId || 'Unknown';
      if (!businessGroups[businessId]) businessGroups[businessId] = [];
      businessGroups[businessId].push(member);
    });

    Object.keys(businessGroups).forEach(businessId => {
      const businessName = businesses.find(b => b._id === businessId)?.name || businessId;
      console.log(`   📊 ${businessName}: ${businessGroups[businessId].length} members`);
      businessGroups[businessId].forEach(member => {
        console.log(`      • ${member.name} - ${member.role}`);
      });
    });

    // Check Services
    const services = await client.fetch(`*[_type == "service"] | order(name asc)`);
    console.log(`\n🔧 Services: ${services.length} documents`);

    const serviceGroups = {};
    services.forEach(service => {
      const businessId = service.businessId || 'Unknown';
      if (!serviceGroups[businessId]) serviceGroups[businessId] = [];
      serviceGroups[businessId].push(service);
    });

    Object.keys(serviceGroups).forEach(businessId => {
      const businessName = businesses.find(b => b._id === businessId)?.name || businessId;
      console.log(`   📊 ${businessName}: ${serviceGroups[businessId].length} services`);
      serviceGroups[businessId].forEach(service => {
        const price = service.price > 0 ? `€${service.price}` : 'Free';
        console.log(`      • ${service.name} - ${price}`);
      });
    });

    // Check Testimonials
    const testimonials = await client.fetch(`*[_type == "testimonial"] | order(customerName asc)`);
    console.log(`\n⭐ Testimonials: ${testimonials.length} documents`);

    const testimonialGroups = {};
    testimonials.forEach(testimonial => {
      const businessId = testimonial.businessId || 'Unknown';
      if (!testimonialGroups[businessId]) testimonialGroups[businessId] = [];
      testimonialGroups[businessId].push(testimonial);
    });

    Object.keys(testimonialGroups).forEach(businessId => {
      const businessName = businesses.find(b => b._id === businessId)?.name || businessId;
      console.log(`   📊 ${businessName}: ${testimonialGroups[businessId].length} reviews`);
      testimonialGroups[businessId].forEach(testimonial => {
        console.log(`      • ${testimonial.customerName} - ${testimonial.rating}/5 stars`);
      });
    });

    console.log(`\n📊 Total Documents: ${businesses.length + teamMembers.length + services.length + testimonials.length}`);
    console.log('\n✅ Data verification completed successfully!');
    console.log('\n🔗 Access your data at: https://studio.sanity.io');
    console.log('   Select project: j2t31xge (auto-ani-website)');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  verifyData();
}

module.exports = { verifyData };