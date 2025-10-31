"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import ComparisonFloatingButton from "./ComparisonFloatingButton";
import VehicleCardSimple from "./VehicleCardSimple";

import { useLanguage } from "@/contexts/LanguageContext";
import { VEHICLES } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { Vehicle } from "@/lib/types";
import { HardcodedVehicle } from "@/data/vehicles";

const VehicleFilters = dynamic(() => import("./VehicleFilters"), {
  ssr: false,
});

interface VehiclesPageClientProps {
  initialVehicles: HardcodedVehicle[];
}

function convertHardcodedVehiclesToVehicles(
  hardcodedVehicles: HardcodedVehicle[]
): Vehicle[] {
  return hardcodedVehicles
    .map((v: HardcodedVehicle, index: number) => {
      try {
        // Handle image URLs - they are now simple strings
        const imageUrls: string[] = [];

        // Add mainImage first
        if (v.mainImage) {
          imageUrls.push(v.mainImage);
        }

        // Add all gallery images
        if (v.gallery && Array.isArray(v.gallery)) {
          imageUrls.push(...v.gallery);
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
      logger.info(`Client initialized with ${initialVehicles.length} server vehicles`);
      return convertHardcodedVehiclesToVehicles(initialVehicles);
    }
    logger.info('Client initialized with no server vehicles, will fetch client-side');
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
          logger.info(`Client fetched ${data.data.vehicles.length} vehicles from API`);
          const convertedVehicles = convertHardcodedVehiclesToVehicles(
            data.data.vehicles
          );
          logger.info(`Client converted to ${convertedVehicles.length} display vehicles`);
          setAllVehicles(convertedVehicles);
        } else {
          logger.info('Client API returned no vehicles, using fallback');
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
