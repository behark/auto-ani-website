import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

async function main() {
  console.log('=== STEP 1: Current Vehicles in Database ===\n');

  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      slug: true,
      images: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  vehicles.forEach((v: any, idx: number) => {
    console.log(`${idx + 1}. ${v.make} ${v.model} ${v.year}`);
    console.log(`   ID: ${v.id}`);
    console.log(`   Slug: ${v.slug}`);
    console.log(`   Current Images: ${v.images.substring(0, 100)}...`);
    console.log('');
  });

  console.log('\n=== STEP 2: Available Image Folders ===\n');
  const availableFolders = [
    'audi-q5-2020',
    'golf-7-gtd-2017',
    'peugeot-3008-premium-2018',
    'skoda-superb-2018',
    'skoda-superb-2020',
    'skoda-superb-2020-pro',
    'vw-passat-b8-2016'
  ];
  availableFolders.forEach(f => console.log(`  - ${f}`));

  console.log('\n=== STEP 3: Mapping Vehicles to Folders ===\n');

  // Create mapping based on make/model/year
  const mapping = [
    {
      folder: 'audi-q5-2020',
      make: 'Audi',
      model: 'Q5',
      year: 2020,
      imageCount: 15
    },
    {
      folder: 'golf-7-gtd-2017',
      make: 'Volkswagen',
      model: 'Golf 7 GTD',
      year: 2017,
      imageCount: 14
    },
    {
      folder: 'peugeot-3008-premium-2018',
      make: 'Peugeot',
      model: '3008 Premium',
      year: 2018,
      imageCount: 20
    },
    {
      folder: 'skoda-superb-2018',
      make: 'Škoda',
      model: 'Superb',
      year: 2018,
      imageCount: 16
    },
    {
      folder: 'skoda-superb-2020',
      make: 'Škoda',
      model: 'Superb',
      year: 2020,
      imageCount: 19
    },
    {
      folder: 'skoda-superb-2020-pro',
      make: 'Škoda',
      model: 'Superb Pro',
      year: 2020,
      imageCount: 2
    },
    {
      folder: 'vw-passat-b8-2016',
      make: 'Volkswagen',
      model: 'Passat B8',
      year: 2016,
      imageCount: 11
    }
  ];

  console.log('Proposed mapping:');
  mapping.forEach((m, idx) => {
    console.log(`${idx + 1}. ${m.make} ${m.model} ${m.year} -> ${m.folder}`);
  });

  console.log('\n=== STEP 4: Updating Database ===\n');

  // Delete existing vehicles
  const deleteResult = await prisma.vehicle.deleteMany({});
  console.log(`Deleted ${deleteResult.count} existing vehicles\n`);

  // Create new vehicles with correct slugs and image paths
  for (const item of mapping) {
    const images = [];
    for (let i = 1; i <= item.imageCount; i++) {
      images.push(`/images/vehicles/${item.folder}/${i}.jpg`);
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        id: createId(),
        slug: item.folder,
        make: item.make,
        model: item.model,
        year: item.year,
        price: Math.floor(Math.random() * 20000) + 10000, // Placeholder
        mileage: Math.floor(Math.random() * 100000) + 50000, // Placeholder
        fuelType: 'Diesel',
        transmission: 'Automatic',
        bodyType: 'SUV',
        color: 'Black',
        engineSize: '2.0L',
        drivetrain: 'AWD',
        features: JSON.stringify(['Leather Seats', 'Navigation', 'Parking Sensors']),
        images: JSON.stringify(images),
        description: `${item.make} ${item.model} ${item.year} - Excellent condition`,
        featured: false,
        status: 'AVAILABLE'
      }
    });

    console.log(`✓ Created: ${vehicle.make} ${vehicle.model} ${vehicle.year}`);
    console.log(`  Slug: ${vehicle.slug}`);
    console.log(`  Images: ${images.length} images from ${item.folder}`);
    console.log(`  First image: ${images[0]}`);
    console.log('');
  }

  console.log('\n=== STEP 5: Verification ===\n');

  const updatedVehicles = await prisma.vehicle.findMany({
    select: {
      make: true,
      model: true,
      year: true,
      slug: true,
      images: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  console.log('Updated vehicles:');
  updatedVehicles.forEach((v: any, idx: number) => {
    const imageArray = JSON.parse(v.images);
    console.log(`${idx + 1}. ${v.make} ${v.model} ${v.year}`);
    console.log(`   Slug: ${v.slug}`);
    console.log(`   Images: ${imageArray.length} total`);
    console.log(`   First: ${imageArray[0]}`);
    console.log(`   Last: ${imageArray[imageArray.length - 1]}`);
    console.log('');
  });

  console.log('✓ All vehicles updated successfully!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });