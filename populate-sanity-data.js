#!/usr/bin/env node

/**
 * Comprehensive Sanity Data Population Script
 * Populates all three automotive businesses with complete data
 *
 * Project ID: j2t31xge
 * Dataset: production
 * Organization ID: ozLOzEUVp
 *
 * Businesses:
 * 1. AUTO ANI - Kosovo Dealership
 * 2. Kroi Auto Center - Finnish Service Center
 * 3. Kiilto & Loisto (Car Wash Clean) - Car Wash Service
 */

const { createClient } = require('@sanity/client');

// Initialize Sanity client
const client = createClient({
  projectId: 'j2t31xge',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || 'skVALaMvvJIxP9krYTpB6SYM6XgH3fe60cDRTpVg05znY5DlDGIx1LvUMre94xah8O1bk6ZIiz5QwNz7aA6B5XisFj8mWid17JAgnWh5tuncOehX5gsYt2oNpVxfpS9xsa1YWxHCjMUxkwGeeH9bynKZGz5OQFwIeNARmmN3ajJCCEfgMUiO'
});

// ============================================
// BUSINESS INFORMATION
// ============================================

const businessData = [
  {
    _id: 'business-auto-ani',
    _type: 'businessInfo',
    name: 'AUTO ANI',
    businessType: 'dealership',
    description: 'Premium automotive dealership in Kosovo specializing in quality used cars and exceptional customer service. We import vehicles directly from Finland and Germany, ensuring the highest quality standards.',
    yearEstablished: 2015,
    address: {
      street: 'Rruga Pejton, Zona Industriale',
      city: 'Pristina',
      country: 'Kosovo',
      zipCode: '10000',
      website: 'https://autoani.com'
    },
    phone: '+383 44 123 456',
    email: 'info@autoani.com',
    hours: {
      monday: { open: '08:00', close: '18:00' },
      tuesday: { open: '08:00', close: '18:00' },
      wednesday: { open: '08:00', close: '18:00' },
      thursday: { open: '08:00', close: '18:00' },
      friday: { open: '08:00', close: '18:00' },
      saturday: { open: '09:00', close: '16:00' },
      sunday: { closed: true }
    },
    certifications: [
      'Kosovo Chamber of Commerce Member',
      'EU Standards Certified',
      'Authorized Vehicle Importer',
      'ISO 9001:2015 Quality Management'
    ],
    languages: ['Albanian', 'Serbian', 'English', 'German'],
    social: {
      facebook: 'https://facebook.com/autoani.kosovo',
      instagram: 'https://instagram.com/autoani_kosovo',
      linkedin: 'https://linkedin.com/company/auto-ani'
    }
  },
  {
    _id: 'business-kroi-auto',
    _type: 'businessInfo',
    name: 'Kroi Auto Center',
    businessType: 'service-center',
    description: 'Professional automotive service center in Finland providing comprehensive car maintenance and repair services. We specialize in European vehicles with state-of-the-art diagnostic equipment.',
    yearEstablished: 2018,
    address: {
      street: 'Teollisuuskatu 15',
      city: 'Helsinki',
      country: 'Finland',
      zipCode: '00510',
      website: 'https://kroiauto.fi'
    },
    phone: '+358 9 1234 5678',
    email: 'info@kroiauto.fi',
    hours: {
      monday: { open: '07:30', close: '17:00' },
      tuesday: { open: '07:30', close: '17:00' },
      wednesday: { open: '07:30', close: '17:00' },
      thursday: { open: '07:30', close: '17:00' },
      friday: { open: '07:30', close: '16:00' },
      saturday: { open: '09:00', close: '14:00' },
      sunday: { closed: true }
    },
    certifications: [
      'Finnish Auto Service Association Member',
      'EU Certified Technicians',
      'Bosch Car Service Partner',
      'Environmental ISO 14001'
    ],
    languages: ['Finnish', 'English', 'Estonian', 'Swedish'],
    social: {
      facebook: 'https://facebook.com/kroiauto',
      instagram: 'https://instagram.com/kroi_auto_center'
    }
  },
  {
    _id: 'business-kiilto-loisto',
    _type: 'businessInfo',
    name: 'Kiilto & Loisto',
    businessType: 'car-wash',
    description: 'Premium car wash and detailing service providing professional automotive cleaning solutions. We use eco-friendly products and advanced cleaning techniques for the best results.',
    yearEstablished: 2020,
    address: {
      street: 'Autopesula Kiilto & Loisto, Teollisuustie 8',
      city: 'Espoo',
      country: 'Finland',
      zipCode: '02700',
      website: 'https://kiiltoloisto.fi'
    },
    phone: '+358 50 987 6543',
    email: 'info@kiiltoloisto.fi',
    hours: {
      monday: { open: '08:00', close: '20:00' },
      tuesday: { open: '08:00', close: '20:00' },
      wednesday: { open: '08:00', close: '20:00' },
      thursday: { open: '08:00', close: '20:00' },
      friday: { open: '08:00', close: '20:00' },
      saturday: { open: '09:00', close: '18:00' },
      sunday: { open: '10:00', close: '16:00' }
    },
    certifications: [
      'Eco-Friendly Certified',
      'Premium Detailing Specialist',
      'Finnish Car Wash Association Member',
      'Environmental Protection Certified'
    ],
    languages: ['Finnish', 'English'],
    social: {
      facebook: 'https://facebook.com/kiiltoloisto',
      instagram: 'https://instagram.com/kiilto_loisto_carwash'
    }
  }
];

// ============================================
// TEAM MEMBERS
// ============================================

const teamData = [
  // AUTO ANI Team
  {
    _id: 'team-behar-gashi',
    _type: 'teamMember',
    name: 'Behar Gashi',
    role: 'CEO & Founder',
    businessId: 'business-auto-ani',
    email: 'behar@autoani.com',
    phone: '+383 44 123 456',
    experience: 8,
    languages: ['Albanian', 'Serbian', 'English', 'German'],
    specialties: ['Vehicle Import', 'Business Development', 'Customer Relations', 'Quality Control'],
    bio: 'Founder and CEO of AUTO ANI with over 8 years of experience in the automotive industry. Specialized in importing quality vehicles from European markets.',
    order: 1
  },
  {
    _id: 'team-arben-hasani',
    _type: 'teamMember',
    name: 'Arben Hasani',
    role: 'Sales Director',
    businessId: 'business-auto-ani',
    email: 'arben@autoani.com',
    phone: '+383 44 234 567',
    experience: 6,
    languages: ['Albanian', 'Serbian', 'English'],
    specialties: ['Vehicle Sales', 'Customer Consultation', 'Market Analysis', 'Financing Solutions'],
    bio: 'Experienced sales professional with 6 years in automotive sales. Expert in matching customers with their perfect vehicle.',
    order: 2
  },
  {
    _id: 'team-fitim-berisha',
    _type: 'teamMember',
    name: 'Fitim Berisha',
    role: 'Service Manager',
    businessId: 'business-auto-ani',
    email: 'fitim@autoani.com',
    phone: '+383 44 345 678',
    experience: 5,
    languages: ['Albanian', 'Serbian', 'English'],
    specialties: ['After-Sales Service', 'Technical Support', 'Quality Assurance', 'Customer Support'],
    bio: 'Service manager ensuring all vehicles meet the highest quality standards before delivery to customers.',
    order: 3
  },
  {
    _id: 'team-valdete-krasniqi',
    _type: 'teamMember',
    name: 'Valdete Krasniqi',
    role: 'Finance Manager',
    businessId: 'business-auto-ani',
    email: 'valdete@autoani.com',
    phone: '+383 44 456 789',
    experience: 4,
    languages: ['Albanian', 'Serbian', 'English'],
    specialties: ['Financial Planning', 'Loan Processing', 'Insurance', 'Documentation'],
    bio: 'Finance expert helping customers secure the best financing options for their vehicle purchases.',
    order: 4
  },

  // Kroi Auto Center Team
  {
    _id: 'team-mikko-virtanen',
    _type: 'teamMember',
    name: 'Mikko Virtanen',
    role: 'Head Mechanic',
    businessId: 'business-kroi-auto',
    email: 'mikko@kroiauto.fi',
    phone: '+358 50 123 4567',
    experience: 12,
    languages: ['Finnish', 'English', 'Swedish'],
    specialties: ['Engine Diagnostics', 'European Vehicles', 'Electrical Systems', 'Performance Tuning'],
    bio: 'Master mechanic with 12 years of experience specializing in European vehicles and advanced diagnostics.',
    order: 1
  },
  {
    _id: 'team-anna-korhonen',
    _type: 'teamMember',
    name: 'Anna Korhonen',
    role: 'Service Advisor',
    businessId: 'business-kroi-auto',
    email: 'anna@kroiauto.fi',
    phone: '+358 50 234 5678',
    experience: 7,
    languages: ['Finnish', 'English', 'Estonian'],
    specialties: ['Customer Service', 'Service Planning', 'Parts Procurement', 'Quality Control'],
    bio: 'Dedicated service advisor ensuring excellent customer experience and transparent communication about all repairs.',
    order: 2
  },
  {
    _id: 'team-jari-lehto',
    _type: 'teamMember',
    name: 'Jari Lehto',
    role: 'Tire Specialist',
    businessId: 'business-kroi-auto',
    email: 'jari@kroiauto.fi',
    phone: '+358 50 345 6789',
    experience: 8,
    languages: ['Finnish', 'English'],
    specialties: ['Tire Installation', 'Wheel Alignment', 'Balancing', 'Seasonal Changes'],
    bio: 'Tire specialist with 8 years of experience in tire services, wheel alignment, and seasonal tire changes.',
    order: 3
  },

  // Kiilto & Loisto Team
  {
    _id: 'team-petteri-salo',
    _type: 'teamMember',
    name: 'Petteri Salo',
    role: 'Owner & Detailing Expert',
    businessId: 'business-kiilto-loisto',
    email: 'petteri@kiiltoloisto.fi',
    phone: '+358 50 987 6543',
    experience: 10,
    languages: ['Finnish', 'English'],
    specialties: ['Premium Detailing', 'Paint Correction', 'Ceramic Coating', 'Business Management'],
    bio: 'Owner and master detailer with 10 years of experience in professional car care and premium detailing services.',
    order: 1
  },
  {
    _id: 'team-laura-maki',
    _type: 'teamMember',
    name: 'Laura Mäki',
    role: 'Wash Specialist',
    businessId: 'business-kiilto-loisto',
    email: 'laura@kiiltoloisto.fi',
    phone: '+358 50 876 5432',
    experience: 4,
    languages: ['Finnish', 'English'],
    specialties: ['Interior Cleaning', 'Eco-Friendly Products', 'Customer Service', 'Quality Control'],
    bio: 'Specialist in interior cleaning and eco-friendly car wash services, ensuring the highest quality results.',
    order: 2
  }
];

// ============================================
// SERVICES
// ============================================

const servicesData = [
  // AUTO ANI Services (Dealership)
  {
    _id: 'service-vehicle-sales',
    _type: 'service',
    name: 'Vehicle Sales',
    description: 'Premium quality used vehicles imported from Finland and Germany. Each vehicle undergoes thorough inspection and comes with warranty.',
    price: 0, // Dealership services are usually free
    duration: 60,
    features: [
      'Quality European imports',
      'Pre-purchase inspection',
      'Vehicle history report',
      'Warranty included',
      'Professional consultation',
      'Test drive available'
    ],
    category: 'dealership',
    businessTypes: ['dealership'],
    businessId: 'business-auto-ani',
    bookingRequired: true,
    order: 1
  },
  {
    _id: 'service-financing-loans',
    _type: 'service',
    name: 'Financing & Loans',
    description: 'Flexible financing solutions to help you purchase your dream car. We work with multiple banks to find the best rates.',
    price: 0,
    duration: 45,
    features: [
      'Multiple bank partnerships',
      'Competitive interest rates',
      'Quick approval process',
      'Flexible payment terms',
      'Insurance options',
      'Professional guidance'
    ],
    category: 'dealership',
    businessTypes: ['dealership'],
    businessId: 'business-auto-ani',
    bookingRequired: true,
    order: 2
  },
  {
    _id: 'service-trade-in',
    _type: 'service',
    name: 'Trade-In Services',
    description: 'Trade your current vehicle for a new one. We offer fair market value assessments and easy trade-in processes.',
    price: 0,
    duration: 30,
    features: [
      'Fair market valuation',
      'Instant assessment',
      'Easy paperwork',
      'Trade-in credit',
      'Professional evaluation',
      'Quick process'
    ],
    category: 'dealership',
    businessTypes: ['dealership'],
    businessId: 'business-auto-ani',
    bookingRequired: false,
    order: 3
  },
  {
    _id: 'service-vehicle-import',
    _type: 'service',
    name: 'Vehicle Import',
    description: 'Custom vehicle import services from European markets. We handle all documentation and logistics.',
    price: 0,
    duration: 120,
    features: [
      'Direct import from Europe',
      'All documentation handled',
      'Quality guarantee',
      'Custom orders accepted',
      'Logistics management',
      'Legal compliance'
    ],
    category: 'dealership',
    businessTypes: ['dealership'],
    businessId: 'business-auto-ani',
    bookingRequired: true,
    order: 4
  },
  {
    _id: 'service-insurance-registration',
    _type: 'service',
    name: 'Insurance & Registration',
    description: 'Complete assistance with vehicle insurance and registration processes. We handle all the paperwork.',
    price: 0,
    duration: 45,
    features: [
      'Insurance consultation',
      'Registration assistance',
      'Document preparation',
      'Legal compliance',
      'Multiple insurance options',
      'Fast processing'
    ],
    category: 'dealership',
    businessTypes: ['dealership'],
    businessId: 'business-auto-ani',
    bookingRequired: false,
    order: 5
  },
  {
    _id: 'service-after-sales-support',
    _type: 'service',
    name: 'After-Sales Support',
    description: 'Comprehensive after-sales support including warranty claims, technical assistance, and maintenance guidance.',
    price: 0,
    duration: 30,
    features: [
      'Warranty support',
      'Technical assistance',
      'Maintenance guidance',
      'Parts sourcing',
      'Service recommendations',
      'Customer support'
    ],
    category: 'dealership',
    businessTypes: ['dealership'],
    businessId: 'business-auto-ani',
    bookingRequired: false,
    order: 6
  },

  // Kroi Auto Center Services (Service Center)
  {
    _id: 'service-engine-diagnostics',
    _type: 'service',
    name: 'Engine Diagnostics',
    description: 'Comprehensive engine diagnostics using state-of-the-art equipment. Identify and resolve engine issues quickly.',
    price: 89,
    duration: 60,
    features: [
      'Advanced diagnostic equipment',
      'Computer error code reading',
      'Performance analysis',
      'Engine health report',
      'Expert technicians',
      'Detailed explanation'
    ],
    category: 'maintenance',
    businessTypes: ['service-center'],
    businessId: 'business-kroi-auto',
    bookingRequired: true,
    order: 1
  },
  {
    _id: 'service-brake-service',
    _type: 'service',
    name: 'Brake Service',
    description: 'Complete brake system service including inspection, pad replacement, and brake fluid change.',
    price: 120,
    duration: 90,
    features: [
      'Brake pad replacement',
      'Brake fluid change',
      'Brake disc inspection',
      'Safety testing',
      'Quality parts used',
      'Performance guarantee'
    ],
    category: 'maintenance',
    businessTypes: ['service-center'],
    businessId: 'business-kroi-auto',
    bookingRequired: true,
    order: 2
  },
  {
    _id: 'service-oil-change',
    _type: 'service',
    name: 'Oil Change',
    description: 'Professional oil change service with premium oil and filter replacement. Quick and efficient service.',
    price: 45,
    duration: 30,
    features: [
      'Premium oil selection',
      'Oil filter replacement',
      'Multi-point inspection',
      'Fluid level check',
      'Quick service',
      'Environmental disposal'
    ],
    category: 'maintenance',
    businessTypes: ['service-center'],
    businessId: 'business-kroi-auto',
    bookingRequired: false,
    order: 3
  },
  {
    _id: 'service-tire-service',
    _type: 'service',
    name: 'Tire Service',
    description: 'Complete tire services including installation, balancing, alignment, and seasonal tire changes.',
    price: 60,
    duration: 45,
    features: [
      'Tire installation',
      'Wheel balancing',
      'Alignment check',
      'Pressure monitoring',
      'Seasonal changes',
      'Quality tire brands'
    ],
    category: 'maintenance',
    businessTypes: ['service-center'],
    businessId: 'business-kroi-auto',
    bookingRequired: true,
    order: 4
  },
  {
    _id: 'service-electrical-repair',
    _type: 'service',
    name: 'Electrical Repair',
    description: 'Expert electrical system diagnostics and repair. Solving complex electrical issues with modern equipment.',
    price: 95,
    duration: 75,
    features: [
      'Electrical diagnostics',
      'Wiring repair',
      'Component replacement',
      'System testing',
      'Expert technicians',
      'Modern equipment'
    ],
    category: 'maintenance',
    businessTypes: ['service-center'],
    businessId: 'business-kroi-auto',
    bookingRequired: true,
    order: 5
  },
  {
    _id: 'service-air-conditioning',
    _type: 'service',
    name: 'Air Conditioning Service',
    description: 'Complete A/C system service including gas refill, leak detection, and component repair.',
    price: 75,
    duration: 60,
    features: [
      'A/C gas refill',
      'Leak detection',
      'Component inspection',
      'Filter replacement',
      'Performance testing',
      'Cooling efficiency'
    ],
    category: 'maintenance',
    businessTypes: ['service-center'],
    businessId: 'business-kroi-auto',
    bookingRequired: true,
    order: 6
  },

  // Kiilto & Loisto Services (Car Wash)
  {
    _id: 'service-basic-wash',
    _type: 'service',
    name: 'Basic Wash',
    description: 'Essential car wash service including exterior wash, rinse, and dry. Perfect for regular maintenance.',
    price: 15,
    duration: 20,
    features: [
      'Exterior wash',
      'High-pressure rinse',
      'Professional drying',
      'Wheel cleaning',
      'Window cleaning',
      'Quick service'
    ],
    category: 'wash',
    businessTypes: ['car-wash'],
    businessId: 'business-kiilto-loisto',
    bookingRequired: false,
    order: 1
  },
  {
    _id: 'service-premium-wash',
    _type: 'service',
    name: 'Premium Wash',
    description: 'Comprehensive wash service with pre-wash, shampoo, wax application, and premium drying.',
    price: 25,
    duration: 35,
    features: [
      'Pre-wash treatment',
      'Premium shampoo',
      'Wax application',
      'Tire shine',
      'Interior vacuum',
      'Window treatment'
    ],
    category: 'premium',
    businessTypes: ['car-wash'],
    businessId: 'business-kiilto-loisto',
    bookingRequired: false,
    order: 2
  },
  {
    _id: 'service-full-detail',
    _type: 'service',
    name: 'Full Detail',
    description: 'Complete detailing service including exterior wash, interior cleaning, waxing, and protection.',
    price: 45,
    duration: 90,
    features: [
      'Complete exterior detail',
      'Interior deep cleaning',
      'Paint protection',
      'Leather conditioning',
      'Engine bay cleaning',
      'Long-lasting protection'
    ],
    category: 'premium',
    businessTypes: ['car-wash'],
    businessId: 'business-kiilto-loisto',
    bookingRequired: true,
    order: 3
  },
  {
    _id: 'service-interior-cleaning',
    _type: 'service',
    name: 'Interior Cleaning',
    description: 'Thorough interior cleaning service including vacuum, upholstery cleaning, and dashboard treatment.',
    price: 20,
    duration: 30,
    features: [
      'Deep vacuum cleaning',
      'Upholstery treatment',
      'Dashboard cleaning',
      'Carpet shampooing',
      'Odor elimination',
      'UV protection'
    ],
    category: 'additional',
    businessTypes: ['car-wash'],
    businessId: 'business-kiilto-loisto',
    bookingRequired: false,
    order: 4
  },
  {
    _id: 'service-wax-treatment',
    _type: 'service',
    name: 'Wax Treatment',
    description: 'Professional wax application for paint protection and enhanced shine. Long-lasting results.',
    price: 18,
    duration: 25,
    features: [
      'Premium wax application',
      'Paint protection',
      'Enhanced shine',
      'UV protection',
      'Water repellent',
      'Long-lasting results'
    ],
    category: 'additional',
    businessTypes: ['car-wash'],
    businessId: 'business-kiilto-loisto',
    bookingRequired: false,
    order: 5
  },
  {
    _id: 'service-tire-rim-care',
    _type: 'service',
    name: 'Tire & Rim Care',
    description: 'Specialized tire and rim cleaning service with protective coating and shine enhancement.',
    price: 12,
    duration: 15,
    features: [
      'Tire deep cleaning',
      'Rim polishing',
      'Protective coating',
      'Shine enhancement',
      'Brake dust removal',
      'Professional products'
    ],
    category: 'tire',
    businessTypes: ['car-wash'],
    businessId: 'business-kiilto-loisto',
    bookingRequired: false,
    order: 6
  }
];

// ============================================
// TESTIMONIALS
// ============================================

const testimonialsData = [
  // AUTO ANI Testimonials
  {
    _id: 'testimonial-auto-ani-1',
    _type: 'testimonial',
    customerName: 'Agron Kelmendi',
    rating: 5,
    review: 'Exceptional service from AUTO ANI! I purchased an Audi Q5 and the entire process was smooth and transparent. Behar and his team were very professional and helped me find exactly what I was looking for. The car came with complete documentation and warranty. Highly recommended!',
    vehiclePurchased: 'Audi Q5 Business Sport 2020',
    businessId: 'business-auto-ani',
    serviceType: 'Vehicle Purchase'
  },
  {
    _id: 'testimonial-auto-ani-2',
    _type: 'testimonial',
    customerName: 'Mimoza Berisha',
    rating: 5,
    review: 'Great experience buying my Skoda Superb from AUTO ANI. The financing process was quick and easy, and they helped me get a great deal. The car is in excellent condition and exactly as described. Thank you for the professional service!',
    vehiclePurchased: 'Skoda Superb Style Business Line 2020',
    businessId: 'business-auto-ani',
    serviceType: 'Vehicle Purchase & Financing'
  },
  {
    _id: 'testimonial-auto-ani-3',
    _type: 'testimonial',
    customerName: 'Driton Hoxha',
    rating: 4,
    review: 'Very satisfied with my purchase from AUTO ANI. The team was knowledgeable and honest about the vehicle condition. The import process was handled professionally and I received all necessary documents. Good after-sales support as well.',
    vehiclePurchased: 'Peugeot 3008 Premium Allure 2018',
    businessId: 'business-auto-ani',
    serviceType: 'Vehicle Import'
  },
  {
    _id: 'testimonial-auto-ani-4',
    _type: 'testimonial',
    customerName: 'Liridon Gashi',
    rating: 5,
    review: 'Outstanding service! I traded in my old car and purchased a Golf GTD. The trade-in value was fair and the whole process was completed in one day. The staff is very professional and customer-oriented. Will definitely recommend to friends!',
    vehiclePurchased: 'Volkswagen Golf 7 GTD 2017',
    businessId: 'business-auto-ani',
    serviceType: 'Trade-In & Purchase'
  },

  // Kroi Auto Center Testimonials
  {
    _id: 'testimonial-kroi-auto-1',
    _type: 'testimonial',
    customerName: 'Mikael Lindqvist',
    rating: 5,
    review: 'Excellent service at Kroi Auto Center! Mikko diagnosed my BMW engine problem quickly and fixed it at a reasonable price. The team is very professional and explains everything clearly. I trust them with all my car maintenance now.',
    vehiclePurchased: 'BMW 3 Series',
    businessId: 'business-kroi-auto',
    serviceType: 'Engine Diagnostics & Repair'
  },
  {
    _id: 'testimonial-kroi-auto-2',
    _type: 'testimonial',
    customerName: 'Anna Virtanen',
    rating: 5,
    review: 'Great experience with brake service at Kroi Auto Center. Anna was very helpful in explaining what needed to be done and the pricing was transparent. The work was completed quickly and the brakes feel much better. Highly recommend!',
    vehiclePurchased: 'Volvo XC60',
    businessId: 'business-kroi-auto',
    serviceType: 'Brake Service'
  },
  {
    _id: 'testimonial-kroi-auto-3',
    _type: 'testimonial',
    customerName: 'Jukka Korhonen',
    rating: 4,
    review: 'Professional tire service from Jari at Kroi Auto Center. Changed my winter tires efficiently and did a proper wheel alignment. Good quality service at fair prices. The shop is well-equipped and the staff knows what they are doing.',
    vehiclePurchased: 'Audi A4',
    businessId: 'business-kroi-auto',
    serviceType: 'Tire Service & Alignment'
  },
  {
    _id: 'testimonial-kroi-auto-4',
    _type: 'testimonial',
    customerName: 'Petra Salminen',
    rating: 5,
    review: 'Very satisfied with the electrical repair service. They fixed a complex wiring issue in my Mercedes that other shops couldn\'t solve. Professional diagnostics and quality work. Will definitely return for future service needs.',
    vehiclePurchased: 'Mercedes C-Class',
    businessId: 'business-kroi-auto',
    serviceType: 'Electrical Repair'
  },

  // Kiilto & Loisto Testimonials
  {
    _id: 'testimonial-kiilto-loisto-1',
    _type: 'testimonial',
    customerName: 'Matti Räsänen',
    rating: 5,
    review: 'Amazing detailing service at Kiilto & Loisto! Petteri did a full detail on my Tesla and it looks brand new again. The attention to detail is incredible and they use high-quality eco-friendly products. Worth every euro!',
    vehiclePurchased: 'Tesla Model 3',
    businessId: 'business-kiilto-loisto',
    serviceType: 'Full Detail Service'
  },
  {
    _id: 'testimonial-kiilto-loisto-2',
    _type: 'testimonial',
    customerName: 'Laura Hakkarainen',
    rating: 5,
    review: 'Excellent car wash service! Laura did an amazing job with the interior cleaning of my family car. The premium wash package is definitely worth it - my car has never been this clean. Fast and professional service.',
    vehiclePurchased: 'Toyota RAV4',
    businessId: 'business-kiilto-loisto',
    serviceType: 'Premium Wash & Interior Cleaning'
  },
  {
    _id: 'testimonial-kiilto-loisto-3',
    _type: 'testimonial',
    customerName: 'Samuli Virtala',
    rating: 4,
    review: 'Good value for money at Kiilto & Loisto. Regular customer for basic wash service and always satisfied with the results. The staff is friendly and the service is quick. Convenient location and good opening hours.',
    vehiclePurchased: 'Volkswagen Golf',
    businessId: 'business-kiilto-loisto',
    serviceType: 'Basic Wash'
  },
  {
    _id: 'testimonial-kiilto-loisto-4',
    _type: 'testimonial',
    customerName: 'Tiina Mäkelä',
    rating: 5,
    review: 'Outstanding wax treatment service! The paint protection really works and my car still looks amazing after months. Professional application and great customer service. They really care about quality and customer satisfaction.',
    vehiclePurchased: 'BMW X3',
    businessId: 'business-kiilto-loisto',
    serviceType: 'Wax Treatment & Paint Protection'
  }
];

// ============================================
// DATA POPULATION FUNCTIONS
// ============================================

async function createDocument(doc) {
  try {
    const result = await client.createOrReplace(doc);
    console.log(`✅ Created/Updated: ${doc._type} - ${doc.name || doc.customerName || doc._id}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to create ${doc._type} ${doc._id}:`, error.message);
    throw error;
  }
}

async function populateBusinessData() {
  console.log('\n🏢 Populating Business Information...');
  for (const business of businessData) {
    await createDocument(business);
  }
}

async function populateTeamData() {
  console.log('\n👥 Populating Team Members...');
  for (const member of teamData) {
    await createDocument(member);
  }
}

async function populateServicesData() {
  console.log('\n🔧 Populating Services...');
  for (const service of servicesData) {
    await createDocument(service);
  }
}

async function populateTestimonialsData() {
  console.log('\n⭐ Populating Testimonials...');
  for (const testimonial of testimonialsData) {
    await createDocument(testimonial);
  }
}

async function main() {
  console.log('🚀 Starting Sanity Data Population...');
  console.log('📋 Project ID: j2t31xge');
  console.log('📋 Dataset: production');
  console.log('📋 Businesses: AUTO ANI, Kroi Auto Center, Kiilto & Loisto\n');

  try {
    // Test connection
    const datasets = await client.datasets.list();
    console.log('✅ Connected to Sanity successfully!');

    // Populate all data
    await populateBusinessData();
    await populateTeamData();
    await populateServicesData();
    await populateTestimonialsData();

    console.log('\n🎉 Data population completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Business Info: ${businessData.length} documents`);
    console.log(`   • Team Members: ${teamData.length} documents`);
    console.log(`   • Services: ${servicesData.length} documents`);
    console.log(`   • Testimonials: ${testimonialsData.length} documents`);
    console.log(`   • Total: ${businessData.length + teamData.length + servicesData.length + testimonialsData.length} documents`);

    console.log('\n🔗 Next Steps:');
    console.log('1. Access Sanity Studio at: https://studio.sanity.io');
    console.log('2. Select project: j2t31xge (auto-ani-website)');
    console.log('3. Review and edit the populated data');
    console.log('4. Add images to team members and services');
    console.log('5. Verify data appears correctly on your websites');

  } catch (error) {
    console.error('\n❌ Error during data population:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  businessData,
  teamData,
  servicesData,
  testimonialsData,
  createDocument,
  main
};