import { Phone, MessageCircle, Car, Gauge, Fuel, Settings2, Zap, Shield, Award } from "lucide-react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import EnhancedImageGallery from "@/components/gallery/EnhancedImageGallery";
import StructuredData from "@/components/seo/StructuredData";
import { Badge } from "@/components/ui/badge";
import WhatsAppQuickActions from "@/components/whatsapp/WhatsAppQuickActions";
import { client, VehicleDetail } from "@/lib/sanity";
import { generatePageSchemas } from "@/lib/seo-schema";

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
      featured,
      features,
      specifications,
      financing,
      seo,
      slug,
      dateAdded,
      "mainImage": mainImage.asset->url,
      "gallery": gallery[].asset->url
    }`,
    { slug: params.slug }
  );

  if (!vehicle) {
    notFound();
  }

  const whatsappMessage = `Hi, I'm interested in ${vehicle.brand} ${vehicle.model} - €${vehicle.price.toLocaleString()}`;
  const _whatsappUrl = `https://wa.me/38349204242?text=${encodeURIComponent(whatsappMessage)}`;

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
      {/* Mobile-optimized layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Optimized Vehicle Image Gallery */}
        <div>
          {(vehicle.gallery && vehicle.gallery.length > 0) || vehicle.mainImage ? (
            <EnhancedImageGallery
              images={
                (vehicle.gallery && vehicle.gallery.length > 0
                  ? vehicle.gallery
                  : vehicle.mainImage
                    ? [vehicle.mainImage]
                    : []
                ).map((url: string) => ({
                  asset: { url },
                  alt: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
                }))
              }
              title={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
            />
          ) : (
            <div className="relative h-96 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="bg-white/80 backdrop-blur-sm rounded-full p-6 mb-4 mx-auto w-fit">
                  <Car className="w-16 h-16 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{vehicle.brand} {vehicle.model}</h3>
                <p className="text-sm">Fotografitë do të shtohen së shpejti</p>
                <div className="mt-4 text-xs text-gray-400">
                  AUTO ANI • Premium Vehicles
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle Details */}
        <div>
          {/* Status and Featured Badges */}
          <div className="flex items-center gap-2 mb-4">
            <Badge className={`${
              vehicle.status === 'available' ? 'bg-green-500' :
              vehicle.status === 'sold' ? 'bg-red-500' :
              vehicle.status === 'reserved' ? 'bg-yellow-500' : 'bg-gray-500'
            } text-white`}>
              {vehicle.status === 'available' ? '✅ Në Dispozicion' :
               vehicle.status === 'sold' ? '❌ E Shitur' :
               vehicle.status === 'reserved' ? '⏳ E Rezervuar' : '🔜 Së Shpejti'}
            </Badge>
            {vehicle.featured && (
              <Badge className="bg-orange-500 text-white">
                <Award className="w-3 h-3 mr-1" />
                ⭐ I Veçantë
              </Badge>
            )}
            {vehicle.condition && (
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                {vehicle.condition === 'new' ? 'I Ri' :
                 vehicle.condition === 'used_excellent' ? 'Gjendje e Shkëlqyer' :
                 vehicle.condition === 'used_good' ? 'Gjendje e Mirë' :
                 vehicle.condition === 'certified' ? 'Certifikuar' : vehicle.condition}
              </Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-4">
            {vehicle.brand} {vehicle.model}
          </h1>

          <div className="flex items-center gap-4 mb-6">
            <div className="text-4xl font-bold text-orange-500">
              €{vehicle.price?.toLocaleString('de-DE') || "0"}
            </div>
            {vehicle.originalPrice && vehicle.originalPrice > vehicle.price && (
              <div className="flex flex-col">
                <div className="text-xl text-gray-500 line-through">
                  €{vehicle.originalPrice.toLocaleString('de-DE')}
                </div>
                <div className="text-sm font-medium text-red-600">
                  Kurseni €{(vehicle.originalPrice - vehicle.price).toLocaleString('de-DE')}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {vehicle.year && (
              <div>
                <p className="text-gray-600">Viti</p>
                <p className="font-semibold">{vehicle.year}</p>
              </div>
            )}
            {vehicle.mileage && (
              <div>
                <p className="text-gray-600">Kilometrazhi</p>
                <p className="font-semibold">
                  {vehicle.mileage.toLocaleString('de-DE')} km
                </p>
              </div>
            )}
            {vehicle.fuelType && (
              <div>
                <p className="text-gray-600">Karburanti</p>
                <p className="font-semibold">{vehicle.fuelType}</p>
              </div>
            )}
            {vehicle.transmission && (
              <div>
                <p className="text-gray-600">Transmisioni</p>
                <p className="font-semibold">{vehicle.transmission}</p>
              </div>
            )}
            {vehicle.color && (
              <div>
                <p className="text-gray-600">Ngjyra</p>
                <p className="font-semibold">{vehicle.color}</p>
              </div>
            )}
            {vehicle.engine && (
              <div>
                <p className="text-gray-600">Motori</p>
                <p className="font-semibold">{vehicle.engine}</p>
              </div>
            )}
          </div>

          {vehicle.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Car className="w-5 h-5" />
                Përshkrimi
              </h2>
              <p className="text-gray-700">{vehicle.description}</p>
            </div>
          )}

          {/* Technical Specifications */}
          {vehicle.specifications && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Specifikimet Teknike
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                {vehicle.specifications.power && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-orange-500" />
                      Fuqia:
                    </span>
                    <span className="font-semibold">{vehicle.specifications.power} HP</span>
                  </div>
                )}
                {vehicle.specifications.torque && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-4 h-4 text-blue-500" />
                      Tork:
                    </span>
                    <span className="font-semibold">{vehicle.specifications.torque} Nm</span>
                  </div>
                )}
                {vehicle.specifications.acceleration && (
                  <div className="flex items-center justify-between">
                    <span>0-100 km/h:</span>
                    <span className="font-semibold">{vehicle.specifications.acceleration}s</span>
                  </div>
                )}
                {vehicle.specifications.topSpeed && (
                  <div className="flex items-center justify-between">
                    <span>Shpejtësia Max:</span>
                    <span className="font-semibold">{vehicle.specifications.topSpeed} km/h</span>
                  </div>
                )}
                {vehicle.specifications.fuelConsumption && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Fuel className="w-4 h-4 text-green-500" />
                      Konsum:
                    </span>
                    <span className="font-semibold">{vehicle.specifications.fuelConsumption} L/100km</span>
                  </div>
                )}
                {vehicle.specifications.co2Emissions && (
                  <div className="flex items-center justify-between">
                    <span>CO2 Emisions:</span>
                    <span className="font-semibold">{vehicle.specifications.co2Emissions} g/km</span>
                  </div>
                )}
                {vehicle.specifications.doors && (
                  <div className="flex items-center justify-between">
                    <span>Dyert:</span>
                    <span className="font-semibold">{vehicle.specifications.doors}</span>
                  </div>
                )}
                {vehicle.specifications.seats && (
                  <div className="flex items-center justify-between">
                    <span>Ulëset:</span>
                    <span className="font-semibold">{vehicle.specifications.seats}</span>
                  </div>
                )}
                {vehicle.specifications.trunkCapacity && (
                  <div className="flex items-center justify-between">
                    <span>Bagazhi:</span>
                    <span className="font-semibold">{vehicle.specifications.trunkCapacity} L</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Financing Information */}
          {vehicle.financing?.available && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 mb-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                💳 Financim i Disponueshëm
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {vehicle.financing.monthlyPayment && (
                  <div>
                    <span className="text-gray-600">Pagesë Mujore:</span>
                    <div className="text-lg font-bold text-blue-600">
                      €{vehicle.financing.monthlyPayment?.toLocaleString('de-DE')}/muaj
                    </div>
                  </div>
                )}
                {vehicle.financing.downPayment && (
                  <div>
                    <span className="text-gray-600">Paradhënie:</span>
                    <div className="text-lg font-bold text-green-600">
                      {vehicle.financing.downPayment}%
                    </div>
                  </div>
                )}
                {vehicle.financing.loanTerm && (
                  <div>
                    <span className="text-gray-600">Afati:</span>
                    <div className="font-medium">
                      {vehicle.financing.loanTerm} muaj
                    </div>
                  </div>
                )}
                {vehicle.financing.interestRate && (
                  <div>
                    <span className="text-gray-600">Norma Interest:</span>
                    <div className="font-medium">
                      {vehicle.financing.interestRate}%
                    </div>
                  </div>
                )}
              </div>
              {vehicle.financing.tradeInAccepted && (
                <div className="mt-3 p-2 bg-green-100 rounded text-sm text-green-800">
                  ✅ Shkëmbim veture të pranueshëm
                </div>
              )}
            </div>
          )}

          {vehicle.features && vehicle.features.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Karakteristikat & Pajisjet
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {vehicle.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm p-2 bg-green-50 rounded">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
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
      "mainImage": mainImage.asset->url + "?w=1200&h=630&fit=crop&fm=webp&q=90"
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

// Enable ISR - Revalidate every hour (vehicle data doesn't change frequently)
export const revalidate = 3600;
