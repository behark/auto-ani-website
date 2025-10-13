'use client';

import { useState, useEffect } from 'react';
import { Vehicle } from '@/lib/types';
import { VEHICLES } from '@/lib/constants';
import VehicleCardSimple from './VehicleCardSimple';
import { useLanguage } from '@/contexts/LanguageContext';

interface VehiclesPageClientProps {
  initialVehicles: Vehicle[];
}

export default function VehiclesPageClient({ initialVehicles }: VehiclesPageClientProps) {
  const { t } = useLanguage();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('/api/vehicles');
        const data = await response.json();

        if (data.success && data.data.vehicles && data.data.vehicles.length > 0) {
          // Convert Sanity vehicles to Vehicle format
          const convertedVehicles: Vehicle[] = data.data.vehicles.map((v: any) => ({
            id: v._id,
            make: v.brand || 'Unknown',
            model: v.model || 'Unknown',
            year: v.year || 2020,
            price: v.price || 0,
            mileage: v.mileage || 0,
            fuelType: v.specifications?.fuelType || 'Unknown',
            transmission: v.specifications?.transmission || 'Unknown',
            category: v.category || 'sedan',
            status: 'Available',
            featured: v.featured || false,
            images: v.images?.map((img: any) => img.asset?.url).filter(Boolean) || [],
            slug: v.slug?.current || v._id,
            description: v.description || ''
          }));
          setVehicles(convertedVehicles);
        } else {
          // Fallback to static vehicles
          setVehicles(VEHICLES);
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
        // Fallback to static vehicles
        setVehicles(VEHICLES);
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
            {vehicles.map((vehicle) => (
              <VehicleCardSimple key={vehicle.id || vehicle.slug} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">{t('vehicles.noResults')}</p>
          </div>
        )}
      </div>
    </div>
  );
}