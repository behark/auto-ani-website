#!/usr/bin/env node

/**
 * Vehicle Management Script
 *
 * Usage:
 *   node scripts/manage-vehicles.js add
 *   node scripts/manage-vehicles.js list
 *   node scripts/manage-vehicles.js edit veh_001
 *   node scripts/manage-vehicles.js delete veh_001
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const VEHICLES_FILE = path.join(__dirname, '..', 'data', 'vehicles.ts');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Load vehicles from file
function loadVehicles() {
  try {
    const content = fs.readFileSync(VEHICLES_FILE, 'utf8');
    // Extract VEHICLES_DATABASE array
    const match = content.match(/export const VEHICLES_DATABASE.*?=\s*(\[[\s\S]*?\]);/);
    if (match) {
      // Use eval carefully - only on our own controlled file
      return eval(match[1]);
    }
    return [];
  } catch (error) {
    console.error('Error loading vehicles:', error);
    return [];
  }
}

// Save vehicles to file
function saveVehicles(vehicles) {
  const imports = `// Hardcoded vehicle data - No external dependencies needed
// This replaces Sanity CMS with static data

export interface HardcodedVehicle {
  _id: string;
  slug: {
    current: string;
  };
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  originalPrice?: number;
  mileage?: number;
  fuelType?: 'diesel' | 'petrol' | 'hybrid' | 'electric' | 'lpg' | 'cng';
  transmission?: 'manual' | 'automatic' | 'semi-automatic' | 'cvt';
  category?: 'sedan' | 'hatchback' | 'suv' | 'wagon' | 'coupe' | 'convertible' | 'van' | 'pickup' | 'crossover';
  color?: string;
  engine?: string;
  drivetrain?: string;
  status?: 'available' | 'reserved' | 'sold' | 'coming_soon';
  condition?: 'new' | 'used_excellent' | 'used_good' | 'used_fair' | 'certified';
  featured?: boolean;
  description?: string;
  features?: string[];
  specifications?: {
    doors?: number;
    seats?: number;
    engineSize?: number;
    power?: number;
    torque?: number;
    acceleration?: number;
    topSpeed?: number;
    fuelConsumption?: number;
    co2Emissions?: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    wheelbase?: number;
    trunkCapacity?: number;
  };
  financing?: {
    available?: boolean;
    downPayment?: number;
    monthlyPayment?: number;
    loanTerm?: number;
    interestRate?: number;
    tradeInAccepted?: boolean;
  };
  mainImage?: string;
  gallery?: string[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  dateAdded?: string;
  lastUpdated?: string;
  _createdAt?: string;
  _updatedAt?: string;
}

// Hardcoded vehicle database - all vehicles stored here
export const VEHICLES_DATABASE: HardcodedVehicle[] = `;

  const helpers = `

// Helper functions for data access
export const vehicleHelpers = {
  // Get all vehicles
  getAll: () => VEHICLES_DATABASE,

  // Get all available vehicles (not sold)
  getAvailable: () =>
    VEHICLES_DATABASE.filter(v => v.status !== 'sold'),

  // Get featured vehicles
  getFeatured: (limit = 6) =>
    VEHICLES_DATABASE
      .filter(v => v.featured && v.status !== 'sold')
      .slice(0, limit),

  // Get by slug
  getBySlug: (slug: string) =>
    VEHICLES_DATABASE.find(v => v.slug.current === slug),

  // Get by ID
  getById: (id: string) =>
    VEHICLES_DATABASE.find(v => v._id === id),

  // Get by category
  getByCategory: (category: string) =>
    VEHICLES_DATABASE.filter(v => v.category === category),

  // Get by brand
  getByBrand: (brand: string) =>
    VEHICLES_DATABASE.filter(v => v.brand === brand),

  // Advanced filtering
  filter: (filters: {
    brand?: string;
    model?: string;
    minYear?: number;
    maxYear?: number;
    minPrice?: number;
    maxPrice?: number;
    fuelType?: string;
    transmission?: string;
    category?: string;
    minMileage?: number;
    maxMileage?: number;
    condition?: string;
    features?: string[];
  }) => {
    return VEHICLES_DATABASE.filter(vehicle => {
      // Brand filter
      if (filters.brand && vehicle.brand !== filters.brand) return false;

      // Model filter
      if (filters.model && !vehicle.model.toLowerCase().includes(filters.model.toLowerCase())) return false;

      // Year filters
      if (filters.minYear && vehicle.year < filters.minYear) return false;
      if (filters.maxYear && vehicle.year > filters.maxYear) return false;

      // Price filters
      if (filters.minPrice && vehicle.price < filters.minPrice) return false;
      if (filters.maxPrice && vehicle.price > filters.maxPrice) return false;

      // Fuel type filter
      if (filters.fuelType && vehicle.fuelType !== filters.fuelType) return false;

      // Transmission filter
      if (filters.transmission && vehicle.transmission !== filters.transmission) return false;

      // Category filter
      if (filters.category && vehicle.category !== filters.category) return false;

      // Mileage filters
      if (filters.minMileage && vehicle.mileage && vehicle.mileage < filters.minMileage) return false;
      if (filters.maxMileage && vehicle.mileage && vehicle.mileage > filters.maxMileage) return false;

      // Condition filter
      if (filters.condition && vehicle.condition !== filters.condition) return false;

      // Features filter (vehicle must have all specified features)
      if (filters.features && filters.features.length > 0) {
        const vehicleFeatures = vehicle.features || [];
        const hasAllFeatures = filters.features.every(f => vehicleFeatures.includes(f));
        if (!hasAllFeatures) return false;
      }

      return true;
    });
  },

  // Search vehicles
  search: (query: string) => {
    const lowerQuery = query.toLowerCase();
    return VEHICLES_DATABASE.filter(v =>
      v.brand.toLowerCase().includes(lowerQuery) ||
      v.model.toLowerCase().includes(lowerQuery) ||
      v.title.toLowerCase().includes(lowerQuery) ||
      v.description?.toLowerCase().includes(lowerQuery) ||
      v.engine?.toLowerCase().includes(lowerQuery)
    );
  },

  // Sort vehicles
  sort: (vehicles: HardcodedVehicle[], sortBy: 'price_asc' | 'price_desc' | 'year_desc' | 'mileage_asc' | 'date_desc') => {
    const sorted = [...vehicles];
    switch (sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price_desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'year_desc':
        return sorted.sort((a, b) => b.year - a.year);
      case 'mileage_asc':
        return sorted.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
      case 'date_desc':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.dateAdded || a._createdAt || '');
          const dateB = new Date(b.dateAdded || b._createdAt || '');
          return dateB.getTime() - dateA.getTime();
        });
      default:
        return sorted;
    }
  },

  // Get unique values for filters
  getFilterOptions: () => ({
    brands: [...new Set(VEHICLES_DATABASE.map(v => v.brand))].sort(),
    categories: [...new Set(VEHICLES_DATABASE.filter(v => v.category).map(v => v.category!))].sort(),
    fuelTypes: [...new Set(VEHICLES_DATABASE.filter(v => v.fuelType).map(v => v.fuelType!))].sort(),
    transmissions: [...new Set(VEHICLES_DATABASE.filter(v => v.transmission).map(v => v.transmission!))].sort(),
    conditions: [...new Set(VEHICLES_DATABASE.filter(v => v.condition).map(v => v.condition!))].sort(),
    colors: [...new Set(VEHICLES_DATABASE.filter(v => v.color).map(v => v.color!))].sort(),
    years: [...new Set(VEHICLES_DATABASE.map(v => v.year))].sort((a, b) => b - a),
    priceRange: {
      min: Math.min(...VEHICLES_DATABASE.map(v => v.price)),
      max: Math.max(...VEHICLES_DATABASE.map(v => v.price))
    },
    mileageRange: {
      min: Math.min(...VEHICLES_DATABASE.filter(v => v.mileage).map(v => v.mileage!)),
      max: Math.max(...VEHICLES_DATABASE.filter(v => v.mileage).map(v => v.mileage!))
    }
  }),

  // Get statistics
  getStats: () => ({
    total: VEHICLES_DATABASE.length,
    available: VEHICLES_DATABASE.filter(v => v.status === 'available').length,
    sold: VEHICLES_DATABASE.filter(v => v.status === 'sold').length,
    reserved: VEHICLES_DATABASE.filter(v => v.status === 'reserved').length,
    featured: VEHICLES_DATABASE.filter(v => v.featured).length,
    averagePrice: Math.round(VEHICLES_DATABASE.reduce((acc, v) => acc + v.price, 0) / VEHICLES_DATABASE.length),
    byBrand: VEHICLES_DATABASE.reduce((acc, v) => {
      acc[v.brand] = (acc[v.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  })
};`;

  const content = imports + JSON.stringify(vehicles, null, 2) + helpers;
  fs.writeFileSync(VEHICLES_FILE, content, 'utf8');
  console.log('✅ Vehicles saved successfully!');
}

// Generate unique ID
function generateId() {
  const vehicles = loadVehicles();
  const maxId = vehicles.reduce((max, v) => {
    const num = parseInt(v._id.replace('veh_', ''));
    return num > max ? num : max;
  }, 0);
  return `veh_${String(maxId + 1).padStart(3, '0')}`;
}

// Generate slug from brand, model, year
function generateSlug(brand, model, year) {
  return `${brand}-${model}-${year}`.toLowerCase().replace(/\s+/g, '-');
}

// Add new vehicle
async function addVehicle() {
  console.log('\n📝 Adding New Vehicle\n');

  const vehicle = {
    _id: generateId(),
    slug: { current: '' },
    title: '',
    brand: await question('Brand (e.g., bmw, mercedes, audi): '),
    model: await question('Model (e.g., X5, E-Class): '),
    year: parseInt(await question('Year: ')),
    price: parseInt(await question('Price (EUR): ')),
    mileage: parseInt(await question('Mileage (km, or press Enter to skip): ') || '0') || undefined,
    fuelType: await question('Fuel Type (diesel/petrol/hybrid/electric): '),
    transmission: await question('Transmission (manual/automatic): '),
    category: await question('Category (sedan/suv/hatchback/coupe): '),
    color: await question('Color: '),
    engine: await question('Engine (e.g., 2.0L TDI): '),
    status: 'available',
    condition: await question('Condition (new/used_excellent/used_good/certified): '),
    featured: (await question('Featured? (yes/no): ')).toLowerCase() === 'yes',
    description: await question('Description: '),
    dateAdded: new Date().toISOString(),
    _createdAt: new Date().toISOString()
  };

  vehicle.slug.current = generateSlug(vehicle.brand, vehicle.model, vehicle.year);
  vehicle.title = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;

  // Set main image path
  vehicle.mainImage = `/images/vehicles/${vehicle.slug.current}-main.jpg`;
  vehicle.gallery = [
    `/images/vehicles/${vehicle.slug.current}-1.jpg`,
    `/images/vehicles/${vehicle.slug.current}-2.jpg`
  ];

  const vehicles = loadVehicles();
  vehicles.push(vehicle);
  saveVehicles(vehicles);

  console.log(`\n✅ Vehicle added successfully!`);
  console.log(`ID: ${vehicle._id}`);
  console.log(`Slug: ${vehicle.slug.current}`);
  console.log(`\n📷 Remember to add images to:`);
  console.log(`  /public${vehicle.mainImage}`);
  vehicle.gallery.forEach(img => console.log(`  /public${img}`));
}

// List all vehicles
function listVehicles() {
  const vehicles = loadVehicles();
  console.log('\n📋 All Vehicles:\n');

  vehicles.forEach(v => {
    const status = v.status === 'available' ? '✅' :
                  v.status === 'sold' ? '❌' :
                  v.status === 'reserved' ? '⏳' : '❓';
    const featured = v.featured ? '⭐' : '';
    console.log(`${status} ${featured} [${v._id}] ${v.brand} ${v.model} ${v.year} - €${v.price.toLocaleString()}`);
  });

  console.log(`\nTotal: ${vehicles.length} vehicles`);
}

// Edit vehicle
async function editVehicle(id) {
  const vehicles = loadVehicles();
  const index = vehicles.findIndex(v => v._id === id);

  if (index === -1) {
    console.error(`❌ Vehicle with ID ${id} not found`);
    return;
  }

  const vehicle = vehicles[index];
  console.log(`\n✏️  Editing: ${vehicle.brand} ${vehicle.model} ${vehicle.year}`);
  console.log('(Press Enter to keep current value)\n');

  vehicle.price = parseInt(await question(`Price [${vehicle.price}]: `) || vehicle.price);
  vehicle.mileage = parseInt(await question(`Mileage [${vehicle.mileage}]: `) || vehicle.mileage);

  const newStatus = await question(`Status [${vehicle.status}] (available/reserved/sold): `);
  if (newStatus) vehicle.status = newStatus;

  const newFeatured = await question(`Featured [${vehicle.featured ? 'yes' : 'no'}] (yes/no): `);
  if (newFeatured) vehicle.featured = newFeatured.toLowerCase() === 'yes';

  const newDescription = await question(`Description [current]: `);
  if (newDescription) vehicle.description = newDescription;

  vehicle.lastUpdated = new Date().toISOString();
  vehicle._updatedAt = new Date().toISOString();

  vehicles[index] = vehicle;
  saveVehicles(vehicles);

  console.log('\n✅ Vehicle updated successfully!');
}

// Delete vehicle
async function deleteVehicle(id) {
  const vehicles = loadVehicles();
  const index = vehicles.findIndex(v => v._id === id);

  if (index === -1) {
    console.error(`❌ Vehicle with ID ${id} not found`);
    return;
  }

  const vehicle = vehicles[index];
  const confirm = await question(`\n⚠️  Delete ${vehicle.brand} ${vehicle.model} ${vehicle.year}? (yes/no): `);

  if (confirm.toLowerCase() === 'yes') {
    vehicles.splice(index, 1);
    saveVehicles(vehicles);
    console.log('\n✅ Vehicle deleted successfully!');
  } else {
    console.log('\n❌ Deletion cancelled');
  }
}

// Main function
async function main() {
  const command = process.argv[2];
  const id = process.argv[3];

  switch (command) {
    case 'add':
      await addVehicle();
      break;
    case 'list':
      listVehicles();
      break;
    case 'edit':
      if (!id) {
        console.error('❌ Please provide vehicle ID: node manage-vehicles.js edit veh_001');
        break;
      }
      await editVehicle(id);
      break;
    case 'delete':
      if (!id) {
        console.error('❌ Please provide vehicle ID: node manage-vehicles.js delete veh_001');
        break;
      }
      await deleteVehicle(id);
      break;
    default:
      console.log(`
🚗 Vehicle Management Script

Usage:
  node scripts/manage-vehicles.js add      - Add new vehicle
  node scripts/manage-vehicles.js list     - List all vehicles
  node scripts/manage-vehicles.js edit ID  - Edit vehicle
  node scripts/manage-vehicles.js delete ID - Delete vehicle

Examples:
  node scripts/manage-vehicles.js add
  node scripts/manage-vehicles.js edit veh_001
  node scripts/manage-vehicles.js delete veh_002
      `);
  }

  rl.close();
}

// Run the script
main().catch(console.error);