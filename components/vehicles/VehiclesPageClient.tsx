'use client';

import { useState, useEffect } from 'react';
import { Vehicle } from '@/lib/types';
import { VEHICLES } from '@/lib/constants';
import VehicleCardSimple from './VehicleCardSimple';
import { useLanguage } from '@/contexts/LanguageContext';

interface VehiclesPageClientProps {
  initialVehicles: any[]; // Raw Sanity vehicles from server
}

function convertSanityVehiclesToVehicles(sanityVehicles: any[]): Vehicle[] {
  return sanityVehicles.map((v: any, index: number) => {
    try {
      return {
        id: v._id,
        make: v.brand || 'Unknown',
        model: v.model || 'Unknown',
        year: v.year || 2020,
        price: v.price || 0,
        mileage: v.mileage || 0,
        fuelType: v.specifications?.fuelType || 'Diesel',
        transmission: v.specifications?.transmission || 'Manual',
        bodyType: (v.category === 'sedan' ? 'Sedan' :
                  v.category === 'suv' ? 'SUV' :
                  v.category === 'hatchback' ? 'Hatchback' :
                  v.category === 'coupe' ? 'Coupe' :
                  v.category === 'wagon' ? 'Van' : 'Sedan') as 'Sedan' | 'SUV' | 'Truck' | 'Coupe' | 'Hatchback' | 'Van',
        color: 'Unknown',
        engineSize: v.specifications?.engineSize || '2.0L',
        drivetrain: 'FWD',
        features: v.specifications?.features || [],
        status: 'Available',
        featured: v.featured || false,
        images: v.images?.map((img: any) => img.asset?.url).filter(Boolean) || [],
        slug: v.slug?.current || v._id,
        description: v.description || ''
      };
    } catch (conversionError) {
      console.error(`❌ Error converting vehicle ${index}:`, conversionError);
      return null;
    }
  }).filter(v => v !== null) as Vehicle[];
}

export default function VehiclesPageClient({ initialVehicles }: VehiclesPageClientProps) {
  const { t } = useLanguage();

  // Initialize with converted server vehicles if available, otherwise empty array
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    if (initialVehicles && initialVehicles.length > 0) {
      return convertSanityVehiclesToVehicles(initialVehicles);
    }
    return [];
  });

  const [loading, setLoading] = useState(!initialVehicles || initialVehicles.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if we don't have initial vehicles
    if (initialVehicles && initialVehicles.length > 0) {
      setLoading(false);
      return;
    }

    const fetchVehicles = async () => {
      try {
        const response = await fetch('/api/vehicles');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data.vehicles && data.data.vehicles.length > 0) {
          const convertedVehicles = convertSanityVehiclesToVehicles(data.data.vehicles);
          setVehicles(convertedVehicles);
        } else {
          // Fallback to static vehicles
          setVehicles(VEHICLES);
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setVehicles(VEHICLES);
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
          <h1 className="text-4xl font-bold mb-4">
            {t('vehicles.title')}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('vehicles.subtitle')}
          </p>
        </div>

        {/* Vehicle Stats */}
        <div className="mb-8">
          <p className="text-gray-600">
            {t('vehicles.showing')} {vehicles.length} {t('vehicles.of')} {vehicles.length} {t('vehicles.vehicles')}
          </p>
        </div>

        {/* Vehicles Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        ) : vehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle, index) => (
              <div key={vehicle.id || vehicle.slug || index}>
                <VehicleCardSimple vehicle={vehicle} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">{t('vehicles.noResults')}</p>
            {error && (
              <p className="text-sm text-red-500 mt-2">Error: {error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}