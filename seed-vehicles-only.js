#!/usr/bin/env node

/**
 * Simple Vehicle Seed Script
 * Adds only the vehicles to the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedVehicles() {
  console.log('🚗 Starting vehicle seed...');

  // Your 7 vehicles data
  const vehicles = [
    {
      id: 'audi-q5-2020',
      slug: 'audi-q5-business-sport-2020',
      make: 'Audi',
      model: 'Q5 Business Sport',
      year: 2020,
      price: 26500,
      mileage: 220000,
      fuelType: 'Diesel',
      transmission: 'Automatic',
      bodyType: 'SUV',
      color: 'Gray',
      engineSize: '2.0L',
      drivetrain: 'Quattro AWD',
      features: JSON.stringify([
        '163 PS Quattro 🇫🇮',
        'Distance Control',
        'Kamera',
        'Lane Assist',
        '3 Çelësa dhe Webasto',
        'Business Sport Paketë',
        'Importuar nga Finlanda'
      ]),
      images: JSON.stringify(Array.from({length: 15}, (_, i) => `/images/vehicles/audi-q5-2020/${i + 1}.jpg`)),
      description: 'Audi Q5 Business Sport 2020 nga Finlanda 🇫🇮. Motor 2.0L 163 PS Quattro, 220,000 km. Me Distance Control, kamera, Lane Assist, webasto dhe 3 çelësa. Import direkt nga Finlanda!',
      featured: true,
      status: 'AVAILABLE',
      doors: 5,
      seats: 5,
    },
    {
      id: 'skoda-superb-2020',
      slug: 'skoda-superb-style-business-line-2020',
      make: 'Skoda',
      model: 'Superb Style Business Line Facelift',
      year: 2020,
      price: 22500,
      mileage: 300000,
      fuelType: 'Diesel',
      transmission: 'DSG Automatic',
      bodyType: 'Sedan',
      color: 'White',
      engineSize: '2.0L',
      drivetrain: 'FWD',
      features: JSON.stringify([
        'Matrix LED Automatike',
        'Digital Cockpit',
        'Ulëse me Nxemje Para/Prapa',
        'Ulëse me Rrym dhe Memorie',
        'Timon me Nxemje',
        'Webasto dhe 3 Çelësa',
        'Sistem Canton',
        'LED Ambient 10 Ngjyra',
        'Line Assist',
        'Distance Control',
        'Drive Select',
        'Kamera 360°',
        'Start/Stop pa Çelës',
        'Navigacion i Madh',
        'Air Care'
      ]),
      images: JSON.stringify(Array.from({length: 17}, (_, i) => `/images/vehicles/skoda-superb-2020/${i + 1}.jpg`)),
      description: 'Skoda Superb Style Business Line Facelift 2020 me Matrix LED. Digital cockpit, 300,000 km (rrypi i ndërruar dhe servisi i kryer). Ulëse të ngrohta, webasto, sistem Canton, dhe teknologji premium. Gjendje perfekte!',
      featured: true,
      status: 'AVAILABLE',
      doors: 4,
      seats: 5,
    },
    {
      id: 'peugeot-3008-premium-2018',
      slug: 'peugeot-3008-premium-allure-2018',
      make: 'Peugeot',
      model: '3008 Premium Allure',
      year: 2018,
      price: 15900,
      mileage: 250000,
      fuelType: 'Diesel',
      transmission: 'Automatic',
      bodyType: 'SUV',
      color: 'Gray',
      engineSize: '1.5L',
      drivetrain: 'FWD',
      features: JSON.stringify([
        'Digital Cockpit',
        '131 PS Automatik',
        'Premium Allure Paketë',
        'Serviset në Peugeot',
        'Opsion pa Doganë',
        'Sistemet e Sigurisë',
        'Navigacion',
        'Klimë Automatike'
      ]),
      images: JSON.stringify(Array.from({length: 20}, (_, i) => `/images/vehicles/peugeot-3008-premium-2018/${i + 1}.jpg`)),
      description: 'Peugeot 3008 Premium Allure 2018 me Digital Cockpit. Motor 1.5L Diesel Automatik 131 PS. 250,000 km (serviset e kryer në Peugeot). Çmimi me doganë €15,900 - shitet edhe pa doganë.',
      featured: true,
      status: 'AVAILABLE',
      doors: 5,
      seats: 5,
    },
    {
      id: 'audi-a4-s-line-2015',
      slug: 'audi-a4-s-line-2015',
      make: 'Audi',
      model: 'A4 S-Line',
      year: 2015,
      price: 13500,
      mileage: 250000,
      fuelType: 'Diesel',
      transmission: 'Manual',
      bodyType: 'Sedan',
      color: 'Silver',
      engineSize: '2.0L',
      drivetrain: 'Quattro AWD',
      features: JSON.stringify([
        '190 PS Quattro',
        'Drive Select (Comfort/Auto/Dynamic)',
        'Ulëse Alcantara me Nxemje',
        'Klimë 2 Zonale Digjitale',
        'AdBlue',
        'Auto Hold',
        'Sensorë Parkimi 360°',
        'Sensorë Shiu',
        'Tempomat',
        'Histori në Audi'
      ]),
      images: JSON.stringify(Array.from({length: 10}, (_, i) => `/images/vehicles/audi-a4-s-line-2015/${i + 1}.jpg`)),
      description: 'Audi A4 S-Line 2015 pa doganë. 250,000 km me histori në Audi. Motor 2.0L 190 PS Quattro (motori i modelit të ri). Me Drive Select, ulëse Alcantara të ngrohta, dhe shumë pajisje premium.',
      featured: true,
      status: 'AVAILABLE',
      doors: 4,
      seats: 5,
    },
    {
      id: 'skoda-superb-2018',
      slug: 'skoda-superb-style-business-line-2018',
      make: 'Skoda',
      model: 'Superb Style Business Line',
      year: 2018,
      price: 16500,
      mileage: 270000,
      fuelType: 'Diesel',
      transmission: 'DSG Automatic',
      bodyType: 'Sedan',
      color: 'Dark Blue',
      engineSize: '2.0L',
      drivetrain: 'FWD',
      features: JSON.stringify([
        'Ulëse Alcantara me Nxemje',
        'Ulëse me Rrym dhe Memorie',
        'Timon me Nxemje',
        'Start/Stop pa Çelës',
        'Webasto dhe 3 Çelësa',
        'Drita LED Automatike',
        'Sistem Canton',
        'LED Ambient 10 Ngjyra',
        'Line Assist',
        'Distance Control',
        'Drive Select',
        'Air Care',
        'Ad-Blue',
        'Navigacion i Madh',
        'Kamera 360°'
      ]),
      images: JSON.stringify(Array.from({length: 16}, (_, i) => `/images/vehicles/skoda-superb-2018/${i + 1}.jpg`)),
      description: 'Skoda Superb Style Business Line 2.0 DSG 2018. 270,000 km (rrypi i ndërruar dhe servisi i kryer). Me ulëse Alcantara të ngrohta, webasto, sistem Canton, dhe shumë pajisje luksoze. €16,500 me doganë.',
      featured: true,
      status: 'AVAILABLE',
      doors: 4,
      seats: 5,
    },
    {
      id: 'vw-passat-b8-2016',
      slug: 'vw-passat-b8-comfortline-2016',
      make: 'Volkswagen',
      model: 'Passat B8 Comfortline',
      year: 2016,
      price: 14500,
      mileage: 277000,
      fuelType: 'Diesel',
      transmission: 'DSG Automatic',
      bodyType: 'Sedan',
      color: 'Silver',
      engineSize: '1.6L',
      drivetrain: 'FWD',
      features: JSON.stringify([
        'Drita LED',
        'Ulëse të Ngrohta',
        'Klimë 3 Zonale',
        'Auto Hold',
        'Sensorë Parkimi 360°',
        'Dy Çelësa'
      ]),
      images: JSON.stringify(Array.from({length: 11}, (_, i) => `/images/vehicles/vw-passat-b8-2016/${i + 1}.jpg`)),
      description: 'VW Passat B8 1.6 DSG Comfortline 2016. Mirë e mbajtur me 277,000 km. Me drita LED, ulëse të ngrohta, klimë 3 zonale, auto hold, dhe sensorë parkimi 360°. Vjen me dy çelësa.',
      featured: true,
      status: 'AVAILABLE',
      doors: 4,
      seats: 5,
    },
    {
      id: 'golf-7-gtd-2017',
      slug: 'golf-7-gtd-2017',
      make: 'Volkswagen',
      model: 'Golf 7 GTD',
      year: 2017,
      price: 14500,
      mileage: 255000,
      fuelType: 'Diesel',
      transmission: 'DSG Automatic',
      bodyType: 'Hatchback',
      color: 'Dark Blue',
      engineSize: '2.0L',
      drivetrain: 'FWD',
      features: JSON.stringify([
        'Çati Panoramike',
        'Kokpit Digjital',
        'Paketë GTD Sport',
        '184 PS',
        'DSG Automatic',
        'Regjistruar RKS'
      ]),
      images: JSON.stringify([
        '/images/vehicles/golf-7-gtd-2017/main.jpg',
        '/images/vehicles/golf-7-gtd-2017/exterior-1.jpg',
        '/images/vehicles/golf-7-gtd-2017/exterior-2.jpg',
        '/images/vehicles/golf-7-gtd-2017/494491524_1231033675695125_5388405499616188844_n.jpg',
        '/images/vehicles/golf-7-gtd-2017/494549248_1231033492361810_2392993390470559151_n.jpg',
        '/images/vehicles/golf-7-gtd-2017/494592892_1231033682361791_886262066240808834_n.jpg',
        '/images/vehicles/golf-7-gtd-2017/494644133_1231033472361812_1366801070742521977_n.jpg',
        '/images/vehicles/golf-7-gtd-2017/494677123_1231033605695132_1245187610388173630_n.jpg',
        '/images/vehicles/golf-7-gtd-2017/494677123_1231033672361792_152129336462304056_n.jpg',
        '/images/vehicles/golf-7-gtd-2017/494695341_1231033615695131_1460709588023922659_n.jpg',
        '/images/vehicles/golf-7-gtd-2017/494696259_1231033479028478_5762662971169886180_n.jpg',
        '/images/vehicles/golf-7-gtd-2017/494918548_1231033602361799_7437385501035796226_n.jpg',
        '/images/vehicles/golf-7-gtd-2017/495036780_1231033599028466_5227157746523055923_n.jpg',
        '/images/vehicles/golf-7-gtd-2017/495280042_1231033449028481_6543502342431951129_n.jpg'
      ]),
      description: 'Golf 7 Facelift GTD 2.0 DSG, regjistruar RKS. 184 PS, Nëntor 2017, 255,000 km. Me çati panoramike dhe kokpit digjital. Gjendje e shkëlqyer!',
      featured: false,
      status: 'AVAILABLE',
      doors: 5,
      seats: 5,
    }
  ];

  console.log(`📝 Adding ${vehicles.length} vehicles to database...`);

  for (const vehicle of vehicles) {
    try {
      const createdVehicle = await prisma.vehicle.upsert({
        where: { id: vehicle.id },
        update: vehicle,
        create: vehicle,
      });
      console.log(`✅ ${vehicle.make} ${vehicle.model} ${vehicle.year} - €${vehicle.price.toLocaleString()}`);
    } catch (error) {
      console.error(`❌ Failed to add ${vehicle.make} ${vehicle.model}:`, error.message);
    }
  }

  console.log('🎉 Vehicle seeding completed!');
}

async function main() {
  try {
    await seedVehicles();
  } catch (error) {
    console.error('❌ Error during vehicle seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();