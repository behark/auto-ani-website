"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useMemo } from "react";

import ComparisonFloatingButton from "./ComparisonFloatingButton";
import VehicleCardSimple from "./VehicleCardSimple";
import VehicleCardSkeleton from "./VehicleCardSkeleton";

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

// Helper function to normalize brand names
function normalizeBrand(brand: string | undefined): string {
  if (!brand) return "Unknown";

  const brandMap: { [key: string]: string } = {
    'bmw': 'BMW',
    'audi': 'Audi',
    'mercedes-benz': 'Mercedes-Benz',
    'volkswagen': 'Volkswagen',
    'skoda': 'Skoda',
    'seat': 'Seat',
    'toyota': 'Toyota',
    'honda': 'Honda',
    'ford': 'Ford',
    'peugeot': 'Peugeot',
    'renault': 'Renault',
    'fiat': 'Fiat',
    'opel': 'Opel',
  };

  const normalized = brandMap[brand.toLowerCase()];
  return normalized || brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
}

// Helper function to normalize fuel type
function normalizeFuelType(fuelType: string | null | undefined): 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid' {
  if (!fuelType) return "Diesel";

  const fuelMap: { [key: string]: 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid' } = {
    'petrol': 'Gasoline',
    'gasoline': 'Gasoline',
    'diesel': 'Diesel',
    'electric': 'Electric',
    'hybrid': 'Hybrid',
  };

  return fuelMap[fuelType.toLowerCase()] || "Diesel";
}

// Helper function to normalize transmission
function normalizeTransmission(transmission: string | null | undefined): 'Manual' | 'Automatic' | 'CVT' | 'DSG Automatic' {
  if (!transmission) return "Manual";

  const transMap: { [key: string]: 'Manual' | 'Automatic' | 'CVT' | 'DSG Automatic' } = {
    'manual': 'Manual',
    'automatic': 'Automatic',
    'semi-automatic': 'Automatic',
    'cvt': 'CVT',
    'dsg': 'DSG Automatic',
  };

  return transMap[transmission.toLowerCase()] || "Manual";
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
          make: normalizeBrand(v.brand),
          model: v.model || "Unknown",
          year: v.year || 2020,
          price: v.price || 0,
          mileage: v.mileage || 0,
          fuelType: normalizeFuelType(v.fuelType),
          transmission: normalizeTransmission(v.transmission),
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
          engineSize: v.engine || (v.specifications?.engineSize ? `${v.specifications.engineSize}L` : "2.0L"),
          drivetrain: "FWD",
          features: v.features || [],
          status: "Available",
          featured: v.featured || false,
          images: imageUrls,
          thumbnail: v.thumbnail,
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

  // Memoize the conversion of initial vehicles to prevent unnecessary recalculations
  const initialConvertedVehicles = useMemo(() => {
    if (initialVehicles && initialVehicles.length > 0) {
      logger.info(`Client initialized with ${initialVehicles.length} server vehicles`);
      return convertHardcodedVehiclesToVehicles(initialVehicles);
    }
    logger.info('Client initialized with no server vehicles, will fetch client-side');
    return [];
  }, [initialVehicles]);

  // Initialize with converted server vehicles if available, otherwise empty array
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>(initialConvertedVehicles);

  // Initialize filteredVehicles with allVehicles so vehicles show immediately
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>(initialConvertedVehicles);

  const [loading, setLoading] = useState(
    !initialVehicles || initialVehicles.length === 0
  );
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    // Only fetch if we don't have initial vehicles
    if (initialVehicles && initialVehicles.length > 0) {
      setLoading(false);
      return;
    }

    const fetchVehicles = async (attempt = 0) => {
      try {
        setError(null); // Clear previous errors
        const response = await fetch("/api/vehicles", {
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

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
          setRetryCount(0); // Reset retry count on success
        } else {
          logger.info('Client API returned no vehicles, using fallback');
          // Fallback to static vehicles
          setAllVehicles(VEHICLES);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("Failed to fetch vehicles", {
          error: errorMessage,
          attempt: attempt + 1,
          maxRetries: MAX_RETRIES,
        });

        // Retry logic with exponential backoff
        if (attempt < MAX_RETRIES) {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 5000); // Max 5 seconds
          logger.info(`Retrying fetch in ${backoffDelay}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);

          setTimeout(() => {
            setRetryCount(attempt + 1);
            fetchVehicles(attempt + 1);
          }, backoffDelay);
        } else {
          // Max retries reached, show error and use fallback
          setError(errorMessage);
          setAllVehicles(VEHICLES);
          logger.info('Max retries reached, using fallback vehicles');
        }
      } finally {
        // Only set loading to false after all retries are exhausted or success
        if (attempt >= MAX_RETRIES || error === null) {
          setLoading(false);
        }
      }
    };

    fetchVehicles();
  }, [initialVehicles, MAX_RETRIES]);

  // Memoize the filter callback to prevent unnecessary re-renders
  const handleFilter = useCallback((filtered: Vehicle[]) => {
    setFilteredVehicles(filtered);
  }, []);

  // Manual retry function
  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    setRetryCount(0);

    const fetchVehicles = async () => {
      try {
        const response = await fetch("/api/vehicles", {
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data.vehicles && data.data.vehicles.length > 0) {
          const convertedVehicles = convertHardcodedVehiclesToVehicles(data.data.vehicles);
          setAllVehicles(convertedVehicles);
        } else {
          setAllVehicles(VEHICLES);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
        setAllVehicles(VEHICLES);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

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
            onFilter={handleFilter}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" aria-label="Duke ngarkuar veturat..." role="status">
            {Array.from({ length: 6 }).map((_, index) => (
              <VehicleCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <div className="mt-6 max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-semibold mb-2">
                  Gabim në ngarkimin e të dhënave
                </p>
                <p className="text-sm text-red-600 mb-4">
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-[var(--primary-orange)] text-white rounded-md hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  aria-label="Provo përsëri të ngarkosh veturat"
                >
                  Provo Përsëri
                </button>
                {retryCount > 0 && (
                  <p className="text-xs text-gray-600 mt-3">
                    Përpjekje: {retryCount}/{MAX_RETRIES}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Comparison Button */}
      <ComparisonFloatingButton />
    </div>
  );
}
