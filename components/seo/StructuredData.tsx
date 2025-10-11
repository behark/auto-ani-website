'use client';

import { COMPANY_INFO } from '@/lib/constants';

interface StructuredDataProps {
  type: 'organization' | 'vehicle' | 'website';
  data?: {
    year?: number;
    make?: string;
    model?: string;
    mileage?: number;
    fuelType?: string;
    transmission?: string;
    bodyType?: string;
    engineSize?: number;
    drivetrain?: string;
    doors?: number;
    seats?: number;
    price?: number;
    images?: string[];
    description?: string;
  };
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const getStructuredData = () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://autosalonani.com';

    switch (type) {
      case 'organization':
        return {
          "@context": "https://schema.org",
          "@type": "AutoDealer",
          "name": "AUTO ANI",
          "description": "Premium auto salon in Kosovo offering quality vehicles since 2015",
          "url": "https://autosalonani.com",
          "logo": "https://autosalonani.com/images/logo.svg",
          "image": "https://autosalonani.com/images/showroom.jpg",
          "telephone": COMPANY_INFO.phone,
          "email": COMPANY_INFO.email,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Gazmend Baliu",
            "addressLocality": "Mitrovicë",
            "addressCountry": "Kosovo",
            "postalCode": "40000"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": "42.8818",
            "longitude": "20.8659"
          },
          "openingHours": [
            "Mo-Fr 09:00-19:00",
            "Sa 09:00-17:00"
          ],
          "priceRange": "€5000-€50000",
          "currenciesAccepted": "EUR",
          "paymentAccepted": ["Cash", "Credit Card", "Bank Transfer", "Financing"],
          "areaServed": {
            "@type": "Country",
            "name": "Kosovo"
          },
          "sameAs": [
            COMPANY_INFO.social.facebook,
            COMPANY_INFO.social.instagram
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": COMPANY_INFO.stats.googleRating,
            "reviewCount": COMPANY_INFO.stats.googleReviews,
            "bestRating": "5",
            "worstRating": "1"
          }
        };

      case 'vehicle':
        if (!data) return null;
        return {
          "@context": "https://schema.org",
          "@type": "Vehicle",
          "name": `${data.year} ${data.make} ${data.model}`,
          "brand": {
            "@type": "Brand",
            "name": data.make
          },
          "model": data.model,
          "vehicleModelDate": data.year,
          "mileageFromOdometer": {
            "@type": "QuantitativeValue",
            "value": data.mileage,
            "unitCode": "KMT"
          },
          "fuelType": data.fuelType,
          "vehicleTransmission": data.transmission,
          "bodyType": data.bodyType,
          "vehicleEngine": {
            "@type": "EngineSpecification",
            "engineDisplacement": {
              "@type": "QuantitativeValue",
              "value": data.engineSize
            }
          },
          "driveWheelConfiguration": data.drivetrain,
          "numberOfDoors": data.doors,
          "seatingCapacity": data.seats,
          "vehicleCondition": "UsedVehicleCondition",
          "offers": {
            "@type": "Offer",
            "price": data.price,
            "priceCurrency": "EUR",
            "availability": "InStock",
            "seller": {
              "@type": "AutoDealer",
              "name": "AUTO ANI"
            }
          },
          "image": data.images,
          "description": data.description
        };

      case 'website':
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "AUTO ANI",
          "url": "https://autosalonani.com",
          "description": "Premium auto salon in Kosovo offering quality vehicles since 2015",
          "publisher": {
            "@type": "Organization",
            "name": "AUTO ANI",
            "logo": {
              "@type": "ImageObject",
              "url": "https://autosalonani.com/images/logo.svg"
            }
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://autosalonani.com/vehicles?search={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        };

      default:
        return null;
    }
  };

  const structuredData = getStructuredData();

  if (!structuredData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  );
}