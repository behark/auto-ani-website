import { Car, Eye, Zap, Tag, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HardcodedVehicle } from "@/data/vehicles";
import { getStaticTranslation } from "@/lib/server-translations";
import { formatPrice, formatMileage, capitalize } from "@/lib/utils";

interface FeaturedVehiclesServerProps {
  vehicles: HardcodedVehicle[];
}

export default function FeaturedVehiclesServer({
  vehicles
}: FeaturedVehiclesServerProps) {
  const t = getStaticTranslation('sq'); // Use static translation for ISR

  const getVehicleBadge = (vehicle: HardcodedVehicle) => {
    if (vehicle.condition === "new") {
      return { text: "I Ri", className: "bg-blue-500 text-white", icon: <Zap className="h-3 w-3" /> };
    }
    if (vehicle.featured) {
      return { text: "I Veçantë", className: "bg-orange-500 text-white", icon: <TrendingUp className="h-3 w-3" /> };
    }
    if (vehicle.price && vehicle.price < 15000) {
      return { text: "Vlerë e Mirë", className: "bg-green-500 text-white", icon: <Tag className="h-3 w-3" /> };
    }
    return null;
  };

  if (vehicles.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500">{t('featured.noVehicles')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-orange-100 p-3 rounded-full mr-3">
              <Car className="h-8 w-8 text-orange-500" />
            </div>
            <h2 className="text-5xl font-bold tracking-tight text-gray-900">{t('featured.title')}</h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('featured.subtitle')}
          </p>
        </div>

        {/* Vehicles Grid - Enhanced Premium Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicles.map((vehicle) => {
            const badge = getVehicleBadge(vehicle);
            const vehicleSlug = vehicle.slug?.current || vehicle._id;
            const imageUrl = vehicle.mainImage || '/images/placeholder-vehicle.jpg';

            return (
              <Card
                key={vehicle._id}
                className="group overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer border-0 shadow-lg"
              >
                <Link href={`/vehicles/${vehicleSlug}`} className="block">
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    <Image
                      src={imageUrl}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority={vehicles.indexOf(vehicle) < 6} // Priority for all visible images
                      loading="eager"
                      fetchPriority={vehicles.indexOf(vehicle) < 3 ? "high" : "auto"}
                      quality={90} // Higher quality for crisp images
                    />
                    {badge && (
                      <div className="absolute top-4 left-4">
                        <Badge className={`flex items-center gap-1 ${badge.className}`}>
                          {badge.icon}
                          <span>{badge.text}</span>
                        </Badge>
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                      <p className="text-3xl font-bold text-orange-500 drop-shadow-lg">
                        {formatPrice(vehicle.price || 0)}
                      </p>
                    </div>
                  </div>

                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-orange-500 transition-colors text-gray-900">
                      {capitalize(vehicle.brand)} {vehicle.model}
                    </h3>

                    <div className="flex items-center justify-between text-sm text-gray-600 mb-6 pb-4 border-b border-gray-200">
                      <span className="font-semibold">{vehicle.year}</span>
                      {vehicle.mileage && (
                        <span className="font-semibold">{formatMileage(vehicle.mileage)}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      <Badge variant="outline" className="text-xs font-medium px-3 py-1 border-gray-300">
                        {capitalize(vehicle.transmission || 'Automatic')}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-medium px-3 py-1 border-gray-300">
                        {capitalize(vehicle.fuelType || 'Petrol')}
                      </Badge>
                      {vehicle.engine && (
                        <Badge variant="outline" className="text-xs font-medium px-3 py-1 border-gray-300">
                          {vehicle.engine}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <Button variant="link" className="p-0 h-auto font-bold text-orange-500 hover:text-orange-600 group-hover:gap-2 transition-all">
                        {t('cta.viewDetails')}
                        <Eye className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      <span className="text-xs text-gray-600 font-medium">
                        {vehicle.condition === "new" ? t('cta.brandNew') : t('cta.qualityAssured')}
                      </span>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Link href="/vehicles">
            <Button size="lg" className="font-bold text-lg px-8 py-6 bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105">
              {t('cta.viewAllVehicles')}
              <Car className="ml-3 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}