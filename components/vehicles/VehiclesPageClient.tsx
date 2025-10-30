"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useLanguage } from "@/contexts/LanguageContext";
import { VEHICLES } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { urlFor } from "@/lib/sanity";
import { Vehicle } from "@/lib/types";
import VehicleCardSimple from "./VehicleCardSimple";
import ComparisonFloatingButton from "./ComparisonFloatingButton";

const VehicleFilters = dynamic(() => import("./VehicleFilters"), {
  ssr: false,
});
interface SanityVehicle {
  brand?: string;
  model?: string;
  year?: number;
  price?: number;
  mileage?: number;
  category?: string;
  // ✅ Direct fields from optimized API
  fuelType?: string;
  transmission?: string;
  color?: string;
  engine?: string;
  // Legacy nested specifications for backward compatibility
  specifications?: {
    fuelType?: string;
    transmission?: string;
    engineSize?: string;
    features?: string[];
  };
  featured?: boolean;
  mainImage?: any; // Can be string URL or Sanity image reference
  thumbnail?: string; // ✅ Optimized thumbnail URL
  images?: any[]; // Sanity image references
  gallery?: any[]; // Sanity image references
  slug?: { current?: string };
  description?: string;
}

interface VehiclesPageClientProps {
  initialVehicles: SanityVehicle[];
}

function convertSanityVehiclesToVehicles(
  sanityVehicles: SanityVehicle[]
): Vehicle[] {
  return sanityVehicles
    .map((v: SanityVehicle, index: number) => {
      try {
        // ✅ Handle the optimized API response with gallery images
        const imageUrls: string[] = [];

        // Add mainImage first
        if (typeof v.mainImage === 'string') {
          imageUrls.push(v.mainImage);
        } else if (v.mainImage) {
          try {
            imageUrls.push(urlFor(v.mainImage).url());
          } catch (e) {
            logger.debug('Failed to convert mainImage', { error: e });
          }
        }

        // Add all gallery images for preloading
        if (v.gallery && Array.isArray(v.gallery)) {
          v.gallery.forEach((img) => {
            // Gallery images are already URL strings from optimized API
            if (typeof img === 'string') {
              imageUrls.push(img);
            } else {
              // Or convert Sanity reference objects
              try {
                imageUrls.push(urlFor(img).url());
              } catch (e) {
                logger.debug('Failed to convert gallery image', { error: e });
              }
            }
          });
        }

        return {
          id: v._id,
          make: v.brand || "Unknown",
          model: v.model || "Unknown",
          year: v.year || 2020,
          price: v.price || 0,
          mileage: v.mileage || 0,
          // ✅ Use direct fields first, fallback to specifications for backward compatibility
          fuelType: v.fuelType || v.specifications?.fuelType || "Diesel",
          transmission: v.transmission || v.specifications?.transmission || "Manual",
          bodyType: (v.category === "sedan"
            ? "Sedan"
            : v.category === "suv"
              ? "SUV"
              : v.category === "hatchback"
                ? "Hatchback"
                : v.category === "coupe"
                  ? "Coupe"
                  : v.category === "wagon"
                    ? "Van"
                    : "Sedan") as
            | "Sedan"
            | "SUV"
            | "Truck"
            | "Coupe"
            | "Hatchback"
            | "Van",
          color: v.color || "Unknown",
          engineSize: v.engine || v.specifications?.engineSize || "2.0L",
          drivetrain: "FWD",
          features: v.specifications?.features || [],
          status: "Available",
          featured: v.featured || false,
          images: imageUrls,
          thumbnail: v.thumbnail, // ✅ Include optimized thumbnail
          slug: v.slug?.current || v._id,
          description: v.description || "",
        };
      } catch (conversionError) {
        logger.error("Error converting vehicle", {
          vehicleIndex: index,
          error:
            conversionError instanceof Error
              ? conversionError.message
              : "Unknown error",
        });
        return null;
      }
    })
    .filter((v) => v !== null) as Vehicle[];
}

export default function VehiclesPageClient({
  initialVehicles,
}: VehiclesPageClientProps) {
  const { t } = useLanguage();

  // Initialize with converted server vehicles if available, otherwise empty array
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>(() => {
    if (initialVehicles && initialVehicles.length > 0) {
      console.log(`Client initialized with ${initialVehicles.length} server vehicles`);
      return convertSanityVehiclesToVehicles(initialVehicles);
    }
    console.log('Client initialized with no server vehicles, will fetch client-side');
    return [];
  });

  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(
    !initialVehicles || initialVehicles.length === 0
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if we don't have initial vehicles
    if (initialVehicles && initialVehicles.length > 0) {
      setLoading(false);
      return;
    }

    const fetchVehicles = async () => {
      try {
        const response = await fetch("/api/vehicles");

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (
          data.success &&
          data.data.vehicles &&
          data.data.vehicles.length > 0
        ) {
          console.log(`Client fetched ${data.data.vehicles.length} vehicles from API`);
          const convertedVehicles = convertSanityVehiclesToVehicles(
            data.data.vehicles
          );
          console.log(`Client converted to ${convertedVehicles.length} display vehicles`);
          setAllVehicles(convertedVehicles);
        } else {
          console.log('Client API returned no vehicles, using fallback');
          // Fallback to static vehicles
          setAllVehicles(VEHICLES);
        }
      } catch (error) {
        logger.error("Failed to fetch vehicles", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        setError(error instanceof Error ? error.message : "Unknown error");
        setAllVehicles(VEHICLES);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [initialVehicles]);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t("vehicles.title")}</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t("vehicles.subtitle")}
          </p>
        </div>

        {/* Advanced Vehicle Filters */}
        <div className="mb-8">
          <VehicleFilters
            vehicles={allVehicles}
            onFilter={(filtered) => setFilteredVehicles(filtered)}
            className="mb-6"
          />
        </div>

        {/* Vehicle Stats */}
        <div className="mb-8">
          <p className="text-gray-600">
            {t("vehicles.showing")} {filteredVehicles.length} {t("vehicles.of")}{" "}
            {allVehicles.length} {t("vehicles.vehicles")}
          </p>
        </div>

        {/* Vehicles Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">{t("common.loading")}</p>
          </div>
        ) : filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle, index) => (
              <div key={vehicle.id || vehicle.slug || index}>
                <VehicleCardSimple vehicle={vehicle} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">{t("vehicles.noResults")}</p>
            {error && (
              <p className="text-sm text-red-500 mt-2">Error: {error}</p>
            )}
          </div>
        )}
      </div>

      {/* Floating Comparison Button */}
      <ComparisonFloatingButton />
    </div>
  );
}
