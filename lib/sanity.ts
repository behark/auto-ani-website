import { createClient, type SanityClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

// Lazy-load client to avoid build-time issues with Next.js 15
let cachedClient: SanityClient | null = null;

function getClient(): SanityClient {
  if (!cachedClient) {
    cachedClient = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "j2t31xge",
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
      useCdn: true,
      apiVersion: "2024-01-01",
    });
  }
  return cachedClient;
}

// Export client getter for compatibility
export const client = getClient();

const builder = imageUrlBuilder(getClient());

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// ✅ Optimized image URL helpers with CDN transformations
export const imageOptimizations = {
  // Thumbnail for vehicle cards (300x200, webp, quality 80)
  thumbnail: (source: SanityImageSource) =>
    builder.image(source)
      .width(300)
      .height(200)
      .fit('crop')
      .format('webp')
      .quality(80)
      .url(),

  // Card image for vehicle listings (600x400, webp, quality 85)
  card: (source: SanityImageSource) =>
    builder.image(source)
      .width(600)
      .height(400)
      .fit('crop')
      .format('webp')
      .quality(85)
      .url(),

  // Hero/featured images (1200x800, webp, quality 90)
  hero: (source: SanityImageSource) =>
    builder.image(source)
      .width(1200)
      .height(800)
      .fit('crop')
      .format('webp')
      .quality(90)
      .url(),

  // Gallery images for detail pages (800x600, webp, quality 85)
  gallery: (source: SanityImageSource) =>
    builder.image(source)
      .width(800)
      .height(600)
      .fit('crop')
      .format('webp')
      .quality(85)
      .url(),

  // Full size for lightbox (1600x1200, webp, quality 90)
  fullSize: (source: SanityImageSource) =>
    builder.image(source)
      .width(1600)
      .height(1200)
      .fit('max')
      .format('webp')
      .quality(90)
      .url(),

  // Low Quality Image Placeholder (50x33, webp, quality 20)
  lqip: (source: SanityImageSource) =>
    builder.image(source)
      .width(50)
      .height(33)
      .blur(10)
      .format('webp')
      .quality(20)
      .url(),
}

// Comprehensive GROQ queries for all automotive data
export const queries = {
  // Business Info
  businessInfo: `*[_type == "businessInfo"][0]{
    _id,
    name,
    description,
    yearEstablished,
    address,
    phone,
    email,
    hours,
    certifications,
    languages,
    social
  }`,

  // Team Members
  teamMembers: `*[_type == "teamMember"] | order(order asc){
    _id,
    name,
    role,
    email,
    phone,
    experience,
    languages,
    specialties,
    image,
    bio
  }`,

  // Services
  services: `*[_type == "service"] | order(order asc){
    _id,
    name,
    description,
    price,
    duration,
    features,
    category,
    image,
    businessTypes,
    bookingRequired
  }`,

  // Vehicles (existing - legacy)
  allVehicles: `*[_type == "vehicle"] | order(_createdAt desc){
    _id,
    brand,
    model,
    year,
    price,
    mileage,
    fuelType,
    transmission,
    category,
    color,
    engine,
    drivetrain,
    features,
    gallery,
    mainImage,
    description,
    featured,
    slug
  }`,

  featuredVehicles: `*[_type == "vehicle" && featured == true] | order(_createdAt desc)[0...6]{
    _id,
    brand,
    model,
    year,
    price,
    mileage,
    fuelType,
    transmission,
    mainImage,
    description,
    slug
  }`,

  // OPTIMIZED: For listing page (thumbnails only)
  allVehiclesOptimized: `*[_type == "vehicle"] | order(_createdAt desc){
    _id,
    brand,
    model,
    year,
    price,
    mileage,
    fuelType,
    transmission,
    category,
    color,
    featured,
    slug,
    "mainImage": mainImage.asset->{
      url,
      "metadata": metadata {
        lqip,
        dimensions
      }
    }
  }`,

  // OPTIMIZED: For detail page (with limited images)
  vehicleBySlugOptimized: `*[_type == "vehicle" && slug.current == $slug][0]{
    _id,
    title,
    brand,
    model,
    year,
    price,
    mileage,
    fuelType,
    transmission,
    category,
    description,
    color,
    engine,
    drivetrain,
    features,
    slug,
    "mainImage": mainImage.asset->url,
    "gallery": gallery[0...6].asset->url
  }`,

  // Testimonials
  testimonials: `*[_type == "testimonial"] | order(_createdAt desc){
    _id,
    customerName,
    rating,
    review,
    vehiclePurchased,
    _createdAt
  }`,
};

// Legacy vehicle queries for backward compatibility
export const VEHICLE_QUERIES = {
  all: queries.allVehicles,
  bySlug: `*[_type == "vehicle" && slug.current == $slug][0]`,
  featured: queries.featuredVehicles,
  byCategory: `*[_type == "vehicle" && category == $category] | order(_createdAt desc)`,
};

// Comprehensive TypeScript interfaces
export interface BusinessInfo {
  _id: string;
  name: string;
  description: string;
  yearEstablished: number;
  address: {
    street: string;
    city: string;
    country: string;
    zipCode: string;
    website?: string;
  };
  phone: string;
  email: string;
  hours: {
    [key: string]: { open: string; close: string } | { closed: boolean };
  };
  certifications: string[];
  languages: string[];
  social: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface TeamMember {
  _id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  experience?: number;
  languages: string[];
  specialties: string[];
  image?: any;
  bio?: string;
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration?: number;
  features: string[];
  category: string;
  image?: any;
  businessTypes: string[];
  bookingRequired?: boolean;
}

// Legacy Vehicle interface (for backward compatibility with old queries)
export interface Vehicle {
  _id: string;
  _type: "vehicle";
  title: string;
  slug: { current: string };
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  category: "new" | "used" | "certified";
  featured?: boolean;
  description?: string;
  // Direct properties for easier access
  fuelType?: string;
  transmission?: string;
  color?: string;
  engine?: string;
  drivetrain?: string;
  features?: string[];
  // Image properties (object references)
  mainImage?: {
    asset: {
      _ref: string;
      _type: "reference";
    };
    alt?: string;
  };
  gallery?: Array<{
    asset: {
      _ref: string;
      _type: "reference";
    };
    alt?: string;
  }>;
  // Legacy nested specifications for backward compatibility
  specifications?: {
    engine?: string;
    transmission?: string;
    fuelType?: string;
    drivetrain?: string;
    color?: string;
  };
  images?: Array<{
    asset: {
      _ref: string;
      _type: "reference";
    };
    alt?: string;
  }>;
  _createdAt: string;
  _updatedAt: string;
}

// ✅ NEW: Optimized Vehicle interface for detail pages
// Use this when fetching with optimized queries that return URL strings
export interface VehicleDetail {
  _id: string;
  title?: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  originalPrice?: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  category?: string;
  description?: string;
  color?: string;
  engine?: string;
  status?: string;
  condition?: string;
  featured?: boolean;
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
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  slug: { current: string };
  dateAdded?: string;
  lastUpdated?: string;
  mainImage?: {
    asset: {
      url: string;
      metadata?: {
        dimensions?: any;
        lqip?: string;
      };
    };
    alt?: string;
  };
  gallery?: Array<{
    asset: {
      url: string;
      metadata?: {
        dimensions?: any;
      };
    };
    alt?: string;
    caption?: string;
  }>;
}

export interface Testimonial {
  _id: string;
  customerName: string;
  rating: number;
  review: string;
  vehiclePurchased?: string;
  _createdAt: string;
}
