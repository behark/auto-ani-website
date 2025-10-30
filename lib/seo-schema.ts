/**
 * SEO Schema Generation for AUTO ANI
 * Generates structured data (JSON-LD) for better search engine visibility
 */

interface Vehicle {
  brand: string;
  model: string;
  year: number;
  price: number;
  originalPrice?: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  category?: string;
  color?: string;
  engine?: string;
  status: string;
  condition?: string;
  features?: string[];
  specifications?: {
    doors?: number;
    seats?: number;
    engineSize?: number;
    power?: number;
    fuelConsumption?: number;
  };
  mainImage?: {
    asset: {
      url: string;
    };
    alt?: string;
  };
  gallery?: Array<{
    asset: {
      url: string;
    };
    alt?: string;
  }>;
  description?: string;
  slug: {
    current: string;
  };
  dateAdded?: string;
}

interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  facebook?: string;
}

export function generateVehicleSchema(vehicle: Vehicle, businessInfo: BusinessInfo) {
  const baseUrl = 'https://autosalonani.com';
  const vehicleUrl = `${baseUrl}/vehicles/${vehicle.slug.current}`;

  // Main Vehicle Schema
  const vehicleSchema: any = {
    "@context": "https://schema.org/",
    "@type": "Vehicle",
    "@id": vehicleUrl,
    "name": `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
    "brand": {
      "@type": "Brand",
      "name": vehicle.brand
    },
    "model": vehicle.model,
    "vehicleModelDate": vehicle.year.toString(),
    "productionDate": vehicle.year.toString(),
    "description": vehicle.description || `${vehicle.brand} ${vehicle.model} ${vehicle.year} - Premium vehicle available at AUTO ANI, Kosovo's trusted car dealership since 2015.`,
    "url": vehicleUrl,
    "image": vehicle.mainImage?.asset?.url ? [
      vehicle.mainImage.asset.url,
      ...(vehicle.gallery?.slice(0, 4).map(img => img.asset.url) || [])
    ] : [],
    "offers": {
      "@type": "Offer",
      "@id": `${vehicleUrl}#offer`,
      "price": vehicle.price.toString(),
      "priceCurrency": "EUR",
      "availability": vehicle.status === 'available'
        ? "https://schema.org/InStock"
        : vehicle.status === 'sold'
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/PreOrder",
      "itemCondition": vehicle.condition === 'new'
        ? "https://schema.org/NewCondition"
        : "https://schema.org/UsedCondition",
      "seller": {
        "@type": "AutoDealer",
        "@id": `${baseUrl}#dealer`,
        "name": businessInfo.name,
        "url": baseUrl,
        "telephone": businessInfo.phone,
        "email": businessInfo.email,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": businessInfo.address,
          "addressLocality": "Mitrovicë",
          "addressCountry": "XK",
          "postalCode": "40000"
        }
      },
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    }
  };

  // Add optional properties
  if (vehicle.mileage) {
    vehicleSchema["mileageFromOdometer"] = {
      "@type": "QuantitativeValue",
      "value": vehicle.mileage,
      "unitCode": "KMT"
    };
  }

  if (vehicle.fuelType) {
    vehicleSchema["fuelType"] = vehicle.fuelType;
  }

  if (vehicle.color) {
    vehicleSchema["color"] = vehicle.color;
  }

  if (vehicle.category) {
    vehicleSchema["bodyType"] = vehicle.category;
  }

  if (vehicle.specifications?.doors) {
    vehicleSchema["numberOfDoors"] = vehicle.specifications.doors;
  }

  if (vehicle.specifications?.power) {
    vehicleSchema["vehicleEngine"] = {
      "@type": "EngineSpecification",
      "enginePower": {
        "@type": "QuantitativeValue",
        "value": vehicle.specifications.power,
        "unitCode": "BHP"
      }
    };
  }

  if (vehicle.specifications?.fuelConsumption) {
    vehicleSchema["fuelConsumption"] = {
      "@type": "QuantitativeValue",
      "value": vehicle.specifications.fuelConsumption,
      "unitCode": "L1"
    };
  }

  // Add original price if discounted
  if (vehicle.originalPrice && vehicle.originalPrice > vehicle.price) {
    vehicleSchema.offers["priceSpecification"] = {
      "@type": "UnitPriceSpecification",
      "price": vehicle.price,
      "priceCurrency": "EUR",
      "referencePrice": {
        "@type": "UnitPriceSpecification",
        "price": vehicle.originalPrice,
        "priceCurrency": "EUR"
      }
    };
  }

  return vehicleSchema;
}

export function generateAutoDealerSchema(businessInfo: BusinessInfo) {
  const baseUrl = 'https://autosalonani.com';

  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${baseUrl}#dealer`,
    "name": businessInfo.name,
    "alternateName": "AUTO ANI",
    "description": "Premium car dealership in Mitrovicë, Kosovo. Over 2500 satisfied customers since 2015. New and used vehicles with 0% financing available.",
    "url": baseUrl,
    "telephone": businessInfo.phone,
    "email": businessInfo.email,
    "foundingDate": "2015",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": businessInfo.address,
      "addressLocality": "Mitrovicë",
      "addressRegion": "Kosovo",
      "addressCountry": "XK",
      "postalCode": "40000"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "42.8914",
      "longitude": "20.8664"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday"
        ],
        "opens": "08:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "09:00",
        "closes": "16:00"
      }
    ],
    "sameAs": [
      businessInfo.facebook,
      `${baseUrl}`
    ].filter(Boolean),
    "areaServed": [
      {
        "@type": "City",
        "name": "Mitrovicë"
      },
      {
        "@type": "Country",
        "name": "Kosovo"
      }
    ],
    "currenciesAccepted": "EUR",
    "paymentAccepted": ["Cash", "Credit Card", "Bank Transfer", "Financing"],
    "priceRange": "€€€",
    "brand": [
      "BMW",
      "Mercedes-Benz",
      "Audi",
      "Volkswagen",
      "Toyota",
      "Honda",
      "Ford"
    ]
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

export function generateWebSiteSchema(businessInfo: BusinessInfo) {
  const baseUrl = 'https://autosalonani.com';

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}#website`,
    "url": baseUrl,
    "name": businessInfo.name,
    "description": "Premium car dealership in Kosovo - New and used vehicles with financing options",
    "publisher": {
      "@id": `${baseUrl}#dealer`
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/vehicles?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": ["sq", "sr", "en"]
  };
}

export function generateProductCollectionSchema(vehicles: Vehicle[], businessInfo: BusinessInfo) {
  const baseUrl = 'https://autosalonani.com';

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${baseUrl}/vehicles#collection`,
    "name": "Vehicle Inventory - AUTO ANI",
    "description": "Browse our complete inventory of premium vehicles in Kosovo",
    "url": `${baseUrl}/vehicles`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": vehicles.length,
      "itemListElement": vehicles.slice(0, 10).map((vehicle, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Vehicle",
          "@id": `${baseUrl}/vehicles/${vehicle.slug.current}`,
          "name": `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
          "url": `${baseUrl}/vehicles/${vehicle.slug.current}`,
          "image": vehicle.mainImage?.asset?.url,
          "offers": {
            "@type": "Offer",
            "price": vehicle.price.toString(),
            "priceCurrency": "EUR",
            "availability": vehicle.status === 'available' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          }
        }
      }))
    }
  };
}

// Utility function to generate all schemas for a page
export function generatePageSchemas(type: 'vehicle' | 'homepage' | 'vehicles' | 'about' | 'deals' | 'financing' | 'reviews', data?: any) {
  const businessInfo = {
    name: "AUTO ANI",
    address: "Gazmend Baliu, Mitrovicë, Kosovo 40000",
    phone: "+383 49 204 242",
    email: "aniautosallon@gmail.com",
    website: "https://autosalonani.com",
    facebook: "https://www.facebook.com/autosallonani"
  };

  const schemas = [];

  // Always include website and dealer schemas
  schemas.push(generateWebSiteSchema(businessInfo));
  schemas.push(generateAutoDealerSchema(businessInfo));

  switch (type) {
    case 'vehicle':
      if (data?.vehicle) {
        schemas.push(generateVehicleSchema(data.vehicle, businessInfo));
      }
      if (data?.breadcrumbs) {
        schemas.push(generateBreadcrumbSchema(data.breadcrumbs));
      }
      break;

    case 'vehicles':
      if (data?.vehicles) {
        schemas.push(generateProductCollectionSchema(data.vehicles, businessInfo));
      }
      break;

    case 'homepage':
      if (data?.featuredVehicles) {
        schemas.push(generateProductCollectionSchema(data.featuredVehicles, businessInfo));
      }
      break;

    case 'deals':
      // For deals page, just use the organization and auto dealer schemas
      break;

    case 'financing':
      // For financing page, just use the organization and auto dealer schemas
      break;

    case 'reviews':
      // For reviews page, just use the organization and auto dealer schemas
      break;
  }

  return schemas;
}