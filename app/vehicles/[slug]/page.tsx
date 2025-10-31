import { Phone, MessageCircle, Car, Gauge, Fuel, Settings2, Zap, Shield, Award } from "lucide-react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import EnhancedImageGallery from "@/components/gallery/EnhancedImageGallery";
import StructuredData from "@/components/seo/StructuredData";
import { Badge } from "@/components/ui/badge";
import WhatsAppQuickActions from "@/components/whatsapp/WhatsAppQuickActions";
import { generatePageSchemas } from "@/lib/seo-schema";
import { formatPrice, formatMileage, capitalize } from "@/lib/utils";
import { vehicleHelpers, HardcodedVehicle } from "@/data/vehicles";

interface PageProps {
  params: { slug: string };
}

// Shared data fetching function to avoid duplicate queries
async function getVehicleData(slug: string): Promise<HardcodedVehicle | undefined> {
  return vehicleHelpers.getBySlug(slug);
}

export default async function VehicleDetailPage({ params }: PageProps) {
  // Get vehicle from hardcoded data
  const vehicle = await getVehicleData(params.slug);

  if (!vehicle) {
    notFound();
  }

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '38349204242';
  const whatsappMessage = `Hi, I'm interested in ${vehicle.brand} ${vehicle.model} - ${formatPrice(vehicle.price)}`;
  const _whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

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
        {/* Mobile-optimized layout with max-width for very large screens */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-10 xl:gap-12">
            {/* Gallery Section - Left Column (Sticky) */}
            <div className="md:sticky md:top-24 md:self-start" role="region" aria-label={`Galeria e fotografive për ${vehicle.brand} ${vehicle.model} ${vehicle.year}`}>
              {(vehicle.gallery && vehicle.gallery.length > 0) || vehicle.mainImage ? (
                <EnhancedImageGallery
                  images={
                    (vehicle.gallery && vehicle.gallery.length > 0
                      ? vehicle.gallery.map((img: string) => ({
                          asset: {
                            url: img,
                            thumbnail: img,
                            mobile: img
                          },
                          alt: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
                        }))
                      : vehicle.mainImage
                        ? [{
                            asset: {
                              url: vehicle.mainImage,
                              thumbnail: vehicle.mainImage
                            },
                            alt: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
                          }]
                        : []
                    )
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

            {/* Vehicle Details - scrollable content */}
            <div className="space-y-6">
              {/* Status and Featured Badges */}
              <div className="flex items-center gap-2" role="group" aria-label="Statusi dhe kategoria e veturës">
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
                    <Award className="w-3 h-3 mr-1" aria-hidden="true" />
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

              <h1 className="text-3xl font-bold">
                {capitalize(vehicle.brand)} {vehicle.model}
              </h1>

              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-orange-500">
                  {formatPrice(vehicle.price || 0)}
                </div>
                {vehicle.originalPrice && vehicle.originalPrice > vehicle.price && (
                  <div className="flex flex-col">
                    <div className="text-xl text-gray-500 line-through">
                      {formatPrice(vehicle.originalPrice)}
                    </div>
                    <div className="text-sm font-medium text-red-600">
                      Kurseni {formatPrice(vehicle.originalPrice - vehicle.price)}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4" role="list" aria-label="Informacione bazë të veturës">
                {vehicle.year && (
                  <div role="listitem">
                    <p className="text-gray-600">Viti</p>
                    <p className="font-semibold">{vehicle.year}</p>
                  </div>
                )}
                {vehicle.mileage && (
                  <div role="listitem">
                    <p className="text-gray-600">Kilometrazhi</p>
                    <p className="font-semibold">
                      {formatMileage(vehicle.mileage)}
                    </p>
                  </div>
                )}
                {vehicle.fuelType && (
                  <div role="listitem">
                    <p className="text-gray-600">Karburanti</p>
                    <p className="font-semibold">{capitalize(vehicle.fuelType)}</p>
                  </div>
                )}
                {vehicle.transmission && (
                  <div role="listitem">
                    <p className="text-gray-600">Transmisioni</p>
                    <p className="font-semibold">{capitalize(vehicle.transmission)}</p>
                  </div>
                )}
                {vehicle.color && (
                  <div role="listitem">
                    <p className="text-gray-600">Ngjyra</p>
                    <p className="font-semibold">{vehicle.color}</p>
                  </div>
                )}
                {vehicle.engine && (
                  <div role="listitem">
                    <p className="text-gray-600">Motori</p>
                    <p className="font-semibold">{vehicle.engine}</p>
                  </div>
                )}
              </div>

              {vehicle.description && (
                <div>
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Car className="w-5 h-5" aria-hidden="true" />
                    Përshkrimi
                  </h2>
                  <p className="text-gray-700">{vehicle.description}</p>
                </div>
              )}

              {/* Technical Specifications */}
              {vehicle.specifications && (
                <div>
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Settings2 className="w-5 h-5" aria-hidden="true" />
                    Specifikimet Teknike
                  </h2>
                  <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg" role="list" aria-label="Specifikimet teknike të veturës">
                    {vehicle.specifications.power && (
                      <div className="flex items-center justify-between" role="listitem">
                        <span className="flex items-center gap-1">
                          <Zap className="w-4 h-4 text-orange-500" aria-hidden="true" />
                          Fuqia:
                        </span>
                        <span className="font-semibold">{vehicle.specifications.power} HP</span>
                      </div>
                    )}
                    {vehicle.specifications.torque && (
                      <div className="flex items-center justify-between" role="listitem">
                        <span className="flex items-center gap-1">
                          <Gauge className="w-4 h-4 text-blue-500" aria-hidden="true" />
                          Tork:
                        </span>
                        <span className="font-semibold">{vehicle.specifications.torque} Nm</span>
                      </div>
                    )}
                    {vehicle.specifications.acceleration && (
                      <div className="flex items-center justify-between" role="listitem">
                        <span>0-100 km/h:</span>
                        <span className="font-semibold">{vehicle.specifications.acceleration}s</span>
                      </div>
                    )}
                    {vehicle.specifications.topSpeed && (
                      <div className="flex items-center justify-between" role="listitem">
                        <span>Shpejtësia Max:</span>
                        <span className="font-semibold">{vehicle.specifications.topSpeed} km/h</span>
                      </div>
                    )}
                    {vehicle.specifications.fuelConsumption && (
                      <div className="flex items-center justify-between" role="listitem">
                        <span className="flex items-center gap-1">
                          <Fuel className="w-4 h-4 text-green-500" aria-hidden="true" />
                          Konsum:
                        </span>
                        <span className="font-semibold">{vehicle.specifications.fuelConsumption} L/100km</span>
                      </div>
                    )}
                    {vehicle.specifications.co2Emissions && (
                      <div className="flex items-center justify-between" role="listitem">
                        <span>CO2 Emisions:</span>
                        <span className="font-semibold">{vehicle.specifications.co2Emissions} g/km</span>
                      </div>
                    )}
                    {vehicle.specifications.doors && (
                      <div className="flex items-center justify-between" role="listitem">
                        <span>Dyert:</span>
                        <span className="font-semibold">{vehicle.specifications.doors}</span>
                      </div>
                    )}
                    {vehicle.specifications.seats && (
                      <div className="flex items-center justify-between" role="listitem">
                        <span>Ulëset:</span>
                        <span className="font-semibold">{vehicle.specifications.seats}</span>
                      </div>
                    )}
                    {vehicle.specifications.trunkCapacity && (
                      <div className="flex items-center justify-between" role="listitem">
                        <span>Bagazhi:</span>
                        <span className="font-semibold">{vehicle.specifications.trunkCapacity} L</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Financing Information */}
              {vehicle.financing?.available && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    💳 Financim i Disponueshëm
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {vehicle.financing.monthlyPayment && (
                      <div>
                        <span className="text-gray-600">Pagesë Mujore:</span>
                        <div className="text-lg font-bold text-blue-600">
                          {formatPrice(vehicle.financing.monthlyPayment)}/muaj
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
                      href={`tel:${process.env.NEXT_PUBLIC_PHONE_NUMBER || '+38349204242'}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition"
                      aria-label={`Telefono në ${process.env.NEXT_PUBLIC_PHONE_NUMBER || '+383 49 204 242'} për këtë veturë`}
                    >
                      <Phone className="w-4 h-4" aria-hidden="true" />
                      Telefono
                    </a>
                    <a
                      href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'aniautosallon@gmail.com'}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                      aria-label={`Dërgo email në ${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'aniautosallon@gmail.com'} për këtë veturë`}
                    >
                      <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      Email
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Karakteristikat & Pajisjet - FULL WIDTH Section Below Gallery */}
          {vehicle.features && vehicle.features.length > 0 && (
            <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-8 border border-green-100">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-gray-900">
                <div className="bg-green-500 p-3 rounded-xl">
                  <Shield className="w-7 h-7 text-white" aria-hidden="true" />
                </div>
                Karakteristikat & Pajisjet
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" role="list" aria-label="Karakteristikat dhe pajisjet e veturës">
                {vehicle.features.map((feature, index) => {
                  // Map feature codes to display names
                  const featureNames: Record<string, string> = {
                    'abs': 'ABS Brakes',
                    'airbags': 'Airbags',
                    'esc': 'Electronic Stability Control',
                    'traction_control': 'Traction Control',
                    'blind_spot': 'Blind Spot Monitoring',
                    'lane_departure': 'Lane Departure Warning',
                    'parking_sensors': 'Parking Sensors',
                    'backup_camera': 'Backup Camera',
                    'camera_360': '360° Camera',
                    'ac': 'Air Conditioning',
                    'climate_control': 'Climate Control',
                    'heated_seats': 'Heated Seats',
                    'cooled_seats': 'Cooled Seats',
                    'electric_seats': 'Electric Seats',
                    'memory_seats': 'Memory Seats',
                    'leather_seats': 'Leather Seats',
                    'sunroof': 'Sunroof',
                    'panoramic_roof': 'Panoramic Roof',
                    'gps': 'GPS Navigation',
                    'bluetooth': 'Bluetooth',
                    'usb': 'USB Ports',
                    'wireless_charging': 'Wireless Charging',
                    'carplay': 'Apple CarPlay',
                    'android_auto': 'Android Auto',
                    'premium_sound': 'Premium Sound System',
                    'touchscreen': 'Touchscreen Display',
                    'alloy_wheels': 'Alloy Wheels',
                    'led_headlights': 'LED Headlights',
                    'fog_lights': 'Fog Lights',
                    'electric_windows': 'Electric Windows',
                    'electric_mirrors': 'Electric Mirrors',
                    'keyless_entry': 'Keyless Entry',
                    'push_start': 'Push Button Start',
                    'sport_mode': 'Sport Mode',
                    'cruise_control': 'Cruise Control',
                    'adaptive_cruise': 'Adaptive Cruise Control',
                    'awd': 'All-Wheel Drive',
                    '4wd': '4WD'
                  };
                  const displayName = featureNames[feature] || feature;

                  return (
                    <div key={index} className="flex items-center text-base p-4 bg-white rounded-xl shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 border border-green-100" role="listitem">
                      <span className="text-green-500 mr-3 flex-shrink-0 text-2xl font-bold" aria-hidden="true">✓</span>
                      <span className="font-semibold text-gray-800">{displayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Similar Vehicles Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Vetura të Ngjashme</h2>
              <p className="text-gray-600">Shiko edhe këto vetura që mund t'ju interesojnë</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicleHelpers.getAll()
              .filter(v =>
                v._id !== vehicle._id && // Exclude current vehicle
                (v.brand === vehicle.brand || // Same brand
                Math.abs((v.price || 0) - (vehicle.price || 0)) < 5000) // Similar price (+/- €5000)
              )
              .slice(0, 3) // Show max 3 vehicles
              .map((similarVehicle) => {
                const vehicleSlug = similarVehicle.slug?.current || similarVehicle._id;
                const imageUrl = similarVehicle.mainImage || '/images/placeholder-vehicle.jpg';

                return (
                  <a
                    key={similarVehicle._id}
                    href={`/vehicles/${vehicleSlug}`}
                    className="group block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={imageUrl}
                        alt={`${similarVehicle.brand} ${similarVehicle.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {similarVehicle.featured && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                            ⭐ I Veçantë
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                        <p className="text-2xl font-bold text-orange-500">
                          {formatPrice(similarVehicle.price || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-orange-500 transition-colors">
                        {capitalize(similarVehicle.brand)} {similarVehicle.model}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <span>{similarVehicle.year}</span>
                        {similarVehicle.mileage && (
                          <span>{formatMileage(similarVehicle.mileage)}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {capitalize(similarVehicle.transmission || 'Automatic')}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {capitalize(similarVehicle.fuelType || 'Petrol')}
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Get vehicle from hardcoded data
  const vehicle = await getVehicleData(params.slug);

  if (!vehicle) {
    return {
      title: 'Vehicle Not Found - AUTO ANI',
      description: 'The requested vehicle was not found.'
    };
  }

  // Use custom SEO fields if available, otherwise generate
  const title = vehicle.seo?.metaTitle ||
    `${vehicle.brand} ${vehicle.model} ${vehicle.year} - ${formatPrice(vehicle.price || 0)} | AUTO ANI`;

  const description = vehicle.seo?.metaDescription ||
    vehicle.description ||
    `${vehicle.brand} ${vehicle.model} ${vehicle.year} for sale at AUTO ANI, Kosovo's premier car dealership. Price: ${formatPrice(vehicle.price || 0)}. Contact us for more details.`;

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
    // Get all vehicles from hardcoded data
    const vehicles = vehicleHelpers.getAll();

    return vehicles.map((vehicle) => ({
      slug: vehicle.slug.current,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

// No revalidation needed with hardcoded data
// Remove ISR since we're using static data