import { Car, Eye, Zap, Tag, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Vehicle, urlFor } from "@/lib/sanity";
import { getServerTranslation } from "@/lib/server-translations";

interface FeaturedVehiclesServerProps {
  vehiclesPromise: Promise<Vehicle[]>;
}

export default async function FeaturedVehiclesServer({
  vehiclesPromise
}: FeaturedVehiclesServerProps) {
  const vehicles = await vehiclesPromise;
  const t = getServerTranslation();

  // Helper functions
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getVehicleBadge = (vehicle: Vehicle) => {
    if (vehicle.category === "new") {
      return { text: "New", variant: "default" as const, icon: <Zap className="h-3 w-3" /> };
    }
    if (vehicle.featured) {
      return { text: "Featured", variant: "secondary" as const, icon: <TrendingUp className="h-3 w-3" /> };
    }
    if (vehicle.price && vehicle.price < 15000) {
      return { text: "Great Value", variant: "outline" as const, icon: <Tag className="h-3 w-3" /> };
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
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Car className="h-8 w-8 text-primary mr-2" />
            <h2 className="text-4xl font-bold tracking-tight">{t('featured.title')}</h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('featured.subtitle')}
          </p>
        </div>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => {
            const badge = getVehicleBadge(vehicle);
            const vehicleSlug = vehicle.slug?.current || vehicle._id;
            const imageUrl = vehicle.mainImage
              ? typeof vehicle.mainImage === 'string'
                ? vehicle.mainImage
                : urlFor(vehicle.mainImage).url()
              : '/images/placeholder-vehicle.jpg';

            return (
              <Card
                key={vehicle._id}
                className="group overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
              >
                <Link href={`/vehicles/${vehicleSlug}`} className="block">
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <Image
                      src={imageUrl}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority={vehicles.indexOf(vehicle) < 3} // Priority for first 3 images
                    />
                    {badge && (
                      <div className="absolute top-4 left-4">
                        <Badge variant={badge.variant} className="flex items-center gap-1">
                          {badge.icon}
                          <span>{badge.text}</span>
                        </Badge>
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-4">
                      <p className="text-2xl font-bold text-white">
                        {formatPrice(vehicle.price || 0)}
                      </p>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {vehicle.brand} {vehicle.model}
                    </h3>

                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span>{vehicle.year}</span>
                      {vehicle.mileage && (
                        <span>{vehicle.mileage.toLocaleString()} km</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="text-xs">
                        {vehicle.transmission || 'Automatic'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {vehicle.fuelType || 'Petrol'}
                      </Badge>
                      {vehicle.engine && (
                        <Badge variant="outline" className="text-xs">
                          {vehicle.engine}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <Button variant="link" className="p-0 h-auto font-semibold">
                        {t('cta.viewDetails')}
                        <Eye className="ml-2 h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {vehicle.category === "new" ? t('cta.brandNew') : t('cta.qualityAssured')}
                      </span>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <Link href="/vehicles">
            <Button size="lg" className="font-semibold">
              {t('cta.viewAllVehicles')}
              <Car className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}