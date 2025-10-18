"use client";

import { Car, Eye, Zap, Tag, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { logger } from "@/lib/logger";
import { MOCK_FEATURED_VEHICLES } from "@/lib/mock-data/vehicles";
import { Vehicle, urlFor } from "@/lib/sanity";

export default function FeaturedVehicles() {
  const { t } = useLanguage();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ IMPROVEMENT 1: Configurable limit (easy to change)
  const VEHICLE_LIMIT = 6; // Change this to 3, 9, 12, or any number!

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setError(null);
        const response = await fetch(`/api/vehicles?featured=true&limit=${VEHICLE_LIMIT}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch vehicles: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data.vehicles && data.data.vehicles.length > 0) {
          setVehicles(data.data.vehicles);
        } else {
          // ✅ IMPROVEMENT 5: Better fallback handling
          logger.warn("No vehicles returned from API, using mock data");
          setVehicles(MOCK_FEATURED_VEHICLES.slice(0, VEHICLE_LIMIT));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("Failed to fetch vehicles", { error: errorMessage });
        setError(errorMessage);
        // Use mock data as fallback
        setVehicles(MOCK_FEATURED_VEHICLES.slice(0, VEHICLE_LIMIT));
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []); // No dependencies needed - fetch once on mount

  const formatPrice = (price: number) => {
    return `€${price.toLocaleString("de-DE")}`;
  };

  // ✅ IMPROVEMENT 3: Smart badge system based on vehicle properties
  const getVehicleBadge = (vehicle: Vehicle) => {
    const currentYear = new Date().getFullYear();
    
    // New vehicles (current year or last year)
    if (vehicle.year >= currentYear - 1) {
      return { text: "I RI", color: "bg-green-500", icon: <Zap className="w-3 h-3" /> };
    }
    
    // Low mileage (under 50,000 km)
    if (vehicle.mileage && vehicle.mileage < 50000) {
      return { text: "Km të Ulëta", color: "bg-blue-500", icon: <TrendingUp className="w-3 h-3" /> };
    }
    
    // Featured (default)
    return { text: "Të Zgjedhura", color: "bg-[var(--primary-orange)]", icon: <Tag className="w-3 h-3" /> };
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Veturat e{" "}
            <span className="text-[var(--primary-orange)]">Zgjedhura</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Shikoni përzgjedhjen tonë të veturave premium
          </p>
        </div>

        {/* ✅ IMPROVEMENT 5: Show error message if API failed but we have fallback data */}
        {error && vehicles.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-yellow-800 text-sm">
              ⚠️ Duke përdorur të dhënat e ruajtura. Lidhja me bazën e të dhënave është e kufizuar.
            </p>
          </div>
        )}

        {/* Vehicles Grid - ✅ IMPROVEMENT 2: Better responsive layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {loading ? (
            // ✅ IMPROVEMENT 1: Dynamic loading skeletons based on limit
            Array.from({ length: VEHICLE_LIMIT }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-gray-200 loading-shimmer"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 loading-shimmer mb-2"></div>
                  <div className="h-6 bg-gray-200 loading-shimmer mb-3"></div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="h-4 bg-gray-200 loading-shimmer"></div>
                    <div className="h-4 bg-gray-200 loading-shimmer"></div>
                    <div className="h-4 bg-gray-200 loading-shimmer"></div>
                    <div className="h-4 bg-gray-200 loading-shimmer"></div>
                  </div>
                  <div className="h-10 bg-gray-200 loading-shimmer"></div>
                </CardContent>
              </Card>
            ))
          ) : vehicles.length > 0 ? (
            vehicles.map((vehicle) => {
              const badge = getVehicleBadge(vehicle);
              
              return (
                <Card
                  key={vehicle._id}
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* ✅ IMPROVEMENT 6: Lazy loading images with priority for first 3 */}
                  <div className="relative h-48 bg-gray-200 group">
                    {vehicle.mainImage ? (
                      <Image
                        src={urlFor(vehicle.mainImage).url()}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading={vehicles.indexOf(vehicle) < 3 ? "eager" : "lazy"}
                        priority={vehicles.indexOf(vehicle) < 3}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-200 to-gray-300">
                        <Car className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* ✅ IMPROVEMENT 3: Smart badges instead of generic "Featured" */}
                    <div className="absolute top-4 left-4">
                      <Badge className={`${badge.color} text-white flex items-center gap-1`}>
                        {badge.icon}
                        {badge.text}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold line-clamp-1">
                        {vehicle.year} {vehicle.brand} {vehicle.model}
                      </h3>
                      <p className="text-2xl font-bold text-[var(--primary-orange)]">
                        {formatPrice(vehicle.price)}
                      </p>
                    </div>

                    {/* ✅ IMPROVED: Vehicle Details Grid with better layout */}
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-700">Viti:</span>
                        <span>{vehicle.year || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-700">Km:</span>
                        <span>
                          {vehicle.mileage
                            ? `${vehicle.mileage.toLocaleString()}`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-700">Karburanti:</span>
                        <span className="truncate">
                          {vehicle.specifications?.fuelType || vehicle.fuelType || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-700">Transmisioni:</span>
                        <span className="truncate">
                          {vehicle.specifications?.transmission || vehicle.transmission || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* ✅ IMPROVEMENT 4: Always visible button (no hover required for mobile) */}
                    <Link
                      href={`/vehicles/${vehicle.slug?.current || vehicle._id}`}
                    >
                      <Button className="w-full bg-[var(--primary-orange)] hover:bg-orange-600 text-white transition-all duration-300 hover:shadow-lg">
                        <Eye className="h-4 w-4 mr-2" />
                        {t('cta.viewDetails')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            // ✅ IMPROVEMENT 5: Better empty state with helpful message
            <div className="col-span-full text-center py-12">
              <div className="bg-white rounded-lg p-8 max-w-md mx-auto shadow-sm">
                <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Asnjë Veturë e Zgjedhur
                </h3>
                <p className="text-gray-500 mb-4">
                  Momentalisht nuk ka vetura të shënuara si "featured" në Sanity CMS.
                </p>
                <Link href="/vehicles">
                  <Button className="bg-[var(--primary-orange)] hover:bg-orange-600 text-white">
                    Shiko Të Gjitha Veturat
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* View All Button - Only show if we have vehicles */}
        {vehicles.length > 0 && (
          <div className="text-center">
            <Link href="/vehicles">
              <Button
                size="lg"
                className="bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Shiko Të Gjitha Veturat →
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
