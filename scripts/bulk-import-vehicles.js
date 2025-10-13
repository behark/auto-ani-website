#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');

// Initialize Sanity client
const client = createClient({
  projectId: 'j2t31xge',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

const VEHICLES_FOLDER = '/home/behar/Desktop/vehicles';

// Vehicle data with specifications
const vehicleData = [
  {
    folder: "audi-q5-2020",
    title: "2020 Audi Q5",
    brand: "Audi",
    model: "Q5",
    year: 2020,
    price: 42000,
    mileage: 35000,
    category: "SUV",
    color: "Black",
    engine: "2.0 TFSI",
    fuelType: "Gasoline",
    transmission: "Automatic",
    featured: true,
    description: "Luxury SUV with premium features and excellent performance. Equipped with quattro all-wheel drive and advanced safety systems.",
    specifications: [
      "Engine: 2.0L TFSI Turbocharged",
      "Power: 252 HP",
      "Drivetrain: quattro AWD",
      "Safety: 5-star NCAP rating",
      "Features: Virtual Cockpit, MMI Navigation"
    ]
  },
  {
    folder: "golf-7-gtd-2017",
    title: "2017 Volkswagen Golf 7 GTD",
    brand: "Volkswagen",
    model: "Golf GTD",
    year: 2017,
    price: 22000,
    mileage: 68000,
    category: "Hatchback",
    color: "Dark Blue",
    engine: "2.0 TDI",
    fuelType: "Diesel",
    transmission: "Manual",
    featured: false,
    description: "Sporty diesel hatchback with excellent fuel economy and performance. GTD trim with sport suspension and styling.",
    specifications: [
      "Engine: 2.0L TDI",
      "Power: 184 HP",
      "Fuel Economy: 4.2L/100km",
      "Features: Sport Suspension",
      "Transmission: 6-speed Manual"
    ]
  },
  {
    folder: "peugeot-3008-premium-2018",
    title: "2018 Peugeot 3008 Premium",
    brand: "Peugeot",
    model: "3008 Premium",
    year: 2018,
    price: 28000,
    mileage: 45000,
    category: "SUV",
    color: "White",
    engine: "1.6 PureTech",
    fuelType: "Gasoline",
    transmission: "Automatic",
    featured: true,
    description: "Modern SUV with premium trim and advanced technology features. Award-winning design and i-Cockpit interface.",
    specifications: [
      "Engine: 1.6L PureTech Turbo",
      "Power: 165 HP",
      "Features: i-Cockpit 3D",
      "Safety: Active Safety Brake",
      "Trim: Premium with leather"
    ]
  },
  {
    folder: "skoda-superb-2018",
    title: "2018 Škoda Superb",
    brand: "Škoda",
    model: "Superb",
    year: 2018,
    price: 24000,
    mileage: 52000,
    category: "Sedan",
    color: "Silver",
    engine: "1.4 TSI",
    fuelType: "Gasoline",
    transmission: "Automatic",
    featured: false,
    description: "Spacious and comfortable sedan with excellent value for money. Premium interior space and advanced connectivity.",
    specifications: [
      "Engine: 1.4L TSI",
      "Power: 150 HP",
      "Space: 625L boot capacity",
      "Features: Infotainment system",
      "Comfort: 3-zone climate control"
    ]
  },
  {
    folder: "skoda-superb-2020",
    title: "2020 Škoda Superb",
    brand: "Škoda",
    model: "Superb",
    year: 2020,
    price: 32000,
    mileage: 25000,
    category: "Sedan",
    color: "Gray",
    engine: "2.0 TSI",
    fuelType: "Gasoline",
    transmission: "Automatic",
    featured: true,
    description: "Latest generation Superb with updated design and technology. Enhanced comfort and efficiency.",
    specifications: [
      "Engine: 2.0L TSI",
      "Power: 190 HP",
      "Technology: Virtual Cockpit",
      "Safety: Travel Assist",
      "Comfort: Massage seats"
    ]
  },
  {
    folder: "skoda-superb-2020-pro",
    title: "2020 Škoda Superb Pro",
    brand: "Škoda",
    model: "Superb Pro",
    year: 2020,
    price: 38000,
    mileage: 15000,
    category: "Sedan",
    color: "Black",
    engine: "2.0 TSI",
    fuelType: "Gasoline",
    transmission: "Automatic",
    featured: true,
    description: "Premium trim Superb with additional luxury features and equipment. Top-of-the-line comfort and technology.",
    specifications: [
      "Engine: 2.0L TSI",
      "Power: 190 HP",
      "Trim: L&K (Laurin & Klement)",
      "Features: Canton Sound System",
      "Luxury: Premium leather interior"
    ]
  },
  {
    folder: "vw-passat-b8-2016",
    title: "2016 Volkswagen Passat B8",
    brand: "Volkswagen",
    model: "Passat B8",
    year: 2016,
    price: 18000,
    mileage: 78000,
    category: "Sedan",
    color: "Blue",
    engine: "2.0 TDI",
    fuelType: "Diesel",
    transmission: "Automatic",
    featured: false,
    description: "Reliable and comfortable sedan from Volkswagen's B8 generation. Excellent build quality and fuel efficiency.",
    specifications: [
      "Engine: 2.0L TDI",
      "Power: 150 HP",
      "Fuel Economy: 4.5L/100km",
      "Features: Composition Media",
      "Safety: Front Assist"
    ]
  }
];

// Helper function to create slug
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Helper function to upload image to Sanity
async function uploadImage(imagePath, filename) {
  try {
    if (!fs.existsSync(imagePath)) {
      console.log(`⚠️  Image not found: ${imagePath}`);
      return null;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const asset = await client.assets.upload('image', imageBuffer, {
      filename: filename
    });

    console.log(`✅ Uploaded: ${filename}`);
    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id
      }
    };
  } catch (error) {
    console.error(`❌ Error uploading ${filename}:`, error.message);
    return null;
  }
}

// Main import function
async function importVehicles() {
  console.log('🚗 Starting bulk vehicle import...\n');

  for (const vehicle of vehicleData) {
    try {
      console.log(`📝 Processing: ${vehicle.title}`);

      // Get all images from vehicle folder
      const vehicleFolderPath = path.join(VEHICLES_FOLDER, vehicle.folder);

      if (!fs.existsSync(vehicleFolderPath)) {
        console.log(`⚠️  Folder not found: ${vehicleFolderPath}`);
        continue;
      }

      const imageFiles = fs.readdirSync(vehicleFolderPath)
        .filter(file => file.toLowerCase().endsWith('.jpg'))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || '0');
          const numB = parseInt(b.match(/\d+/)?.[0] || '0');
          return numA - numB;
        });

      console.log(`📸 Found ${imageFiles.length} images`);

      // Upload main image (first image)
      let mainImage = null;
      if (imageFiles.length > 0) {
        const mainImagePath = path.join(vehicleFolderPath, imageFiles[0]);
        mainImage = await uploadImage(mainImagePath, `${vehicle.folder}-main.jpg`);
      }

      // Upload gallery images (all images)
      const gallery = [];
      for (let i = 0; i < imageFiles.length && i < 15; i++) { // Limit to 15 images
        const imagePath = path.join(vehicleFolderPath, imageFiles[i]);
        const galleryImage = await uploadImage(imagePath, `${vehicle.folder}-${i + 1}.jpg`);
        if (galleryImage) {
          gallery.push(galleryImage);
        }
      }

      // Create vehicle document
      const vehicleDoc = {
        _type: 'vehicle',
        title: vehicle.title,
        slug: {
          _type: 'slug',
          current: createSlug(vehicle.title)
        },
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        price: vehicle.price,
        mileage: vehicle.mileage,
        category: vehicle.category,
        color: vehicle.color,
        engine: vehicle.engine,
        fuelType: vehicle.fuelType,
        transmission: vehicle.transmission,
        featured: vehicle.featured,
        description: vehicle.description,
        specifications: vehicle.specifications,
        mainImage: mainImage,
        gallery: gallery
      };

      // Create document in Sanity
      const result = await client.create(vehicleDoc);
      console.log(`✅ Created vehicle: ${vehicle.title} (ID: ${result._id})`);
      console.log('---');

    } catch (error) {
      console.error(`❌ Error importing ${vehicle.title}:`, error.message);
      console.log('---');
    }
  }

  console.log('🎉 Bulk import completed!');
  console.log('\n🔍 Verification:');
  console.log('- Check Sanity Studio: http://localhost:3333');
  console.log('- Check website: http://localhost:3000/vehicles');
  console.log('- Check API: http://localhost:3000/api/vehicles');
}

// Check environment and run
if (!process.env.SANITY_API_TOKEN) {
  console.error('❌ SANITY_API_TOKEN environment variable is required');
  process.exit(1);
}

importVehicles().catch(console.error);