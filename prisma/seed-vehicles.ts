import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create vehicles from existing data - ALL 7 VEHICLES
const seedVehicles = [
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
      features: [
        '163 PS Quattro 🇫🇮',
        'Distance Control',
        'Kamera',
        'Lane Assist',
        '3 Çelësa dhe Webasto',
        'Business Sport Paketë',
        'Importuar nga Finlanda'
      ],
      images: Array.from({length: 15}, (_, i) => `/images/vehicles/audi-q5-2020/${i + 1}.jpg`),
      description: 'Audi Q5 Business Sport 2020 nga Finlanda 🇫🇮. Motor 2.0L 163 PS Quattro, 220,000 km. Me Distance Control, kamera, Lane Assist, webasto dhe 3 çelësa. Import direkt nga Finlanda!',
      featured: true,
      status: 'AVAILABLE',
      doors: 5,
      seats: 5,
    },
    {
      id: 'skoda-superb-2020',
      slug: 'skoda-superb-style-business-line-facelift-2020',
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
      features: [
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
      ],
      images: Array.from({length: 19}, (_, i) => `/images/vehicles/skoda-superb-2020/${i + 1}.jpg`),
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
      features: [
        'Digital Cockpit',
        '131 PS Automatik',
        'Premium Allure Paketë',
        'Serviset në Peugeot',
        'Opsion pa Doganë',
        'Sistemet e Sigurisë',
        'Navigacion',
        'Klimë Automatike'
      ],
      images: Array.from({length: 20}, (_, i) => `/images/vehicles/peugeot-3008-premium-2018/${i + 1}.jpg`),
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
      features: [
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
      ],
      images: Array.from({length: 10}, (_, i) => `/images/vehicles/audi-a4-s-line-2015/${i + 1}.jpg`),
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
      features: [
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
      ],
      images: Array.from({length: 16}, (_, i) => `/images/vehicles/skoda-superb-2018/${i + 1}.jpg`),
      description: 'Skoda Superb Style Business Line 2.0 DSG 2018. 270,000 km (rrypi i ndërruar dhe servisi i kryer). Me ulëse Alcantara të ngrohta, webasto, sistem Canton, dhe shumë pajisje luksoze. €16,500 me doganë.',
      featured: true,
      status: 'AVAILABLE',
      doors: 4,
      seats: 5,
    },
    {
      id: 'vw-passat-b8-2016',
      slug: 'volkswagen-passat-b8-comfortline-2016',
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
      features: [
        'Drita LED',
        'Ulëse të Ngrohta',
        'Klimë 3 Zonale',
        'Auto Hold',
        'Sensorë Parkimi 360°',
        'Dy Çelësa'
      ],
      images: Array.from({length: 11}, (_, i) => `/images/vehicles/vw-passat-b8-2016/${i + 1}.jpg`),
      description: 'VW Passat B8 1.6 DSG Comfortline 2016. Mirë e mbajtur me 277,000 km. Me drita LED, ulëse të ngrohta, klimë 3 zonale, auto hold, dhe sensorë parkimi 360°. Vjen me dy çelësa.',
      featured: true,
      status: 'AVAILABLE',
      doors: 4,
      seats: 5,
    },
    {
      id: 'golf-7-gtd-2017',
      slug: 'volkswagen-golf-7-gtd-2017',
      make: 'Volkswagen',
      model: 'Golf 7 GTD',
      year: 2017,
      price: 18500,
      mileage: 255000,
      fuelType: 'Diesel',
      transmission: 'DSG Automatic',
      bodyType: 'Hatchback',
      color: 'Dark Blue',
      engineSize: '2.0L',
      drivetrain: 'FWD',
      features: [
        'Çati Panoramike',
        'Kokpit Digjital',
        'Paketë GTD Sport',
        '184 PS',
        'DSG Automatic',
        'Regjistruar RKS'
      ],
      images: Array.from({length: 14}, (_, i) => `/images/vehicles/golf-7-gtd-2017/${i + 1}.jpg`),
      description: 'Golf 7 Facelift GTD 2.0 DSG, regjistruar RKS. 184 PS, Nëntor 2017, 255,000 km. Me çati panoramike dhe kokpit digjital. Gjendje e shkëlqyer!',
      featured: true,
      status: 'AVAILABLE',
      doors: 5,
      seats: 5,
    }
  ];

// Export for use in other scripts
export const vehicles = seedVehicles;

async function main() {
  console.log('🌱 Seeding vehicles...');

  for (const vehicle of seedVehicles) {
    await prisma.vehicle.upsert({
      where: { id: vehicle.id },
      update: {
        ...vehicle,
        features: JSON.stringify(vehicle.features),
        images: JSON.stringify(vehicle.images),
      },
      create: {
        ...vehicle,
        features: JSON.stringify(vehicle.features),
        images: JSON.stringify(vehicle.images),
      },
    });
    console.log(`✅ Seeded vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.year})`);
  }

  console.log('🎉 Vehicle seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });