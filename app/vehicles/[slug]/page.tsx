import Image from "next/image";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Phone, MessageCircle, Car } from "lucide-react";

import { client, VehicleDetail } from "@/lib/sanity";
import StructuredData from "@/components/seo/StructuredData";
import { generatePageSchemas } from "@/lib/seo-schema";
import WhatsAppQuickActions from "@/components/whatsapp/WhatsAppQuickActions";
import EnhancedImageGallery from "@/components/gallery/EnhancedImageGallery";

interface PageProps {
  params: { slug: string };
}

export default async function VehicleDetailPage({ params }: PageProps) {
  // Fetch vehicle by slug with comprehensive query including new fields
  const vehicle = await client.fetch<VehicleDetail>(
    `*[_type == "vehicle" && slug.current == $slug][0]{
      _id,
      title,
      brand,
      model,
      year,
      price,
      originalPrice,
      mileage,
      fuelType,
      transmission,
      category,
      description,
      color,
      engine,
      status,
      condition,
      features,
      specifications,
      financing,
      seo,
      slug,
      dateAdded,
      "mainImage": mainImage{
        "asset": asset->{
          url,
          "metadata": metadata{
            dimensions,
            lqip
          }
        },
        alt
      },
      "gallery": gallery[]{
        "asset": asset->{
          url,
          "metadata": metadata{
            dimensions
          }
        },
        alt,
        caption
      }
    }`,
    { slug: params.slug }
  );

  if (!vehicle) {
    notFound();
  }

  const whatsappMessage = `Hi, I'm interested in ${vehicle.brand} ${vehicle.model} - €${vehicle.price.toLocaleString()}`;
  const whatsappUrl = `https://wa.me/38349204242?text=${encodeURIComponent(whatsappMessage)}`;

  // Generate structured data schemas
  const breadcrumbs = [
    { name: "Home", url: "https://autosalonani.com" },
    { name: "Vehicles", url: "https://autosalonani.com/vehicles" },
    { name: `${vehicle.brand} ${vehicle.model}`, url: `https://autosalonani.com/vehicles/${vehicle.slug.current}` }
  ];

  const schemas = generatePageSchemas('vehicle', { vehicle, breadcrumbs });

  return (
    <>
      <StructuredData schemas={schemas} />
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enhanced Vehicle Image Gallery */}
        <div>
          {(vehicle.gallery && vehicle.gallery.length > 0) || vehicle.mainImage ? (
            <EnhancedImageGallery
              images={vehicle.gallery && vehicle.gallery.length > 0
                ? vehicle.gallery
                : vehicle.mainImage
                  ? [vehicle.mainImage]
                  : []
              }
              title={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
              autoPlay={false}
              showThumbnails={true}
              enableZoom={true}
              enableFullscreen={true}
              enableDownload={true}
              enableShare={true}
              className="w-full"
            />
          ) : (
            <div className="relative h-96 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Car className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No images available</p>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle Details */}
        <div>
          <h1 className="text-3xl font-bold mb-4">
            {vehicle.brand} {vehicle.model}
          </h1>

          <div className="text-4xl font-bold text-orange-500 mb-6">
            €{vehicle.price?.toLocaleString() || "0"}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {vehicle.year && (
              <div>
                <p className="text-gray-600">Year</p>
                <p className="font-semibold">{vehicle.year}</p>
              </div>
            )}
            {vehicle.mileage && (
              <div>
                <p className="text-gray-600">Mileage</p>
                <p className="font-semibold">
                  {vehicle.mileage.toLocaleString()} km
                </p>
              </div>
            )}
            {vehicle.fuelType && (
              <div>
                <p className="text-gray-600">Fuel Type</p>
                <p className="font-semibold">{vehicle.fuelType}</p>
              </div>
            )}
            {vehicle.transmission && (
              <div>
                <p className="text-gray-600">Transmission</p>
                <p className="font-semibold">{vehicle.transmission}</p>
              </div>
            )}
            {vehicle.color && (
              <div>
                <p className="text-gray-600">Color</p>
                <p className="font-semibold">{vehicle.color}</p>
              </div>
            )}
            {vehicle.engine && (
              <div>
                <p className="text-gray-600">Engine</p>
                <p className="font-semibold">{vehicle.engine}</p>
              </div>
            )}
          </div>

          {vehicle.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{vehicle.description}</p>
            </div>
          )}

          {vehicle.features && vehicle.features.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Features</h2>
              <ul className="grid grid-cols-2 gap-2">
                {vehicle.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Enhanced WhatsApp Contact Section */}
          <div className="bg-gradient-to-br from-orange-50 to-green-50 p-6 rounded-xl border border-orange-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              💬 Kontaktoni për këtë veturë
            </h2>
            <WhatsAppQuickActions
              vehicle={vehicle}
              layout="expanded"
              showSecondary={true}
              className="space-y-3"
            />

            {/* Alternative Contact Methods */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Ose kontaktoni drejtpërdrejt:</p>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="tel:+38349204242"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition"
                >
                  <Phone className="w-4 h-4" />
                  Telefono
                </a>
                <a
                  href="mailto:aniautosallon@gmail.com"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  Email
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const vehicle = await client.fetch<{
    brand: string;
    model: string;
    year: number;
    price: number;
    originalPrice?: number;
    description?: string;
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
      keywords?: string[];
    };
    mainImage: string;
  }>(
    `*[_type == "vehicle" && slug.current == $slug][0]{
      brand,
      model,
      year,
      price,
      originalPrice,
      description,
      seo,
      "mainImage": mainImage.asset->url
    }`,
    { slug: params.slug }
  );

  if (!vehicle) {
    return {
      title: 'Vehicle Not Found - AUTO ANI',
      description: 'The requested vehicle was not found.'
    };
  }

  // Use custom SEO fields if available, otherwise generate
  const title = vehicle.seo?.metaTitle ||
    `${vehicle.brand} ${vehicle.model} ${vehicle.year} - €${vehicle.price?.toLocaleString()} | AUTO ANI`;

  const description = vehicle.seo?.metaDescription ||
    vehicle.description ||
    `${vehicle.brand} ${vehicle.model} ${vehicle.year} for sale at AUTO ANI, Kosovo's premier car dealership. Price: €${vehicle.price?.toLocaleString()}. Contact us for more details.`;

  const keywords = vehicle.seo?.keywords || [
    vehicle.brand,
    vehicle.model,
    vehicle.year.toString(),
    'Kosovo',
    'Mitrovica',
    'car dealership',
    'AUTO ANI'
  ];

  return {
    title,
    description,
    keywords: keywords.join(', '),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://autosalonani.com/vehicles/${params.slug}`,
      images: vehicle.mainImage ? [
        {
          url: vehicle.mainImage,
          width: 1200,
          height: 630,
          alt: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
        }
      ] : [],
      siteName: 'AUTO ANI',
      locale: 'sq_XK',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: vehicle.mainImage ? [vehicle.mainImage] : [],
    },
    alternates: {
      canonical: `https://autosalonani.com/vehicles/${params.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// Generate static params for better performance
export async function generateStaticParams() {
  try {
    const vehicles = await client.fetch<Array<{ slug: { current: string } }>>(
      `*[_type == "vehicle" && defined(slug.current)]{ slug }`
    );

    return vehicles.map((vehicle) => ({
      slug: vehicle.slug.current,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

// Enable ISR
export const revalidate = 60;
