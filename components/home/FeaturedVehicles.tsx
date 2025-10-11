'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Eye, Fuel, Settings, Calendar, Navigation } from 'lucide-react';
import { Vehicle } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import VehicleImageWithFallback from '@/components/vehicles/VehicleImageWithFallback';

export default function FeaturedVehicles() {
  const languageContext = useLanguage();
  const t = languageContext?.t || ((key: string) => key);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vehicles?limit=6');
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      const data = await response.json();
      // Ensure data and vehicles are properly structured
      if (data && data.vehicles && Array.isArray(data.vehicles)) {
        setVehicles(data.vehicles);
      } else if (Array.isArray(data)) {
        setVehicles(data);
      } else {
        logger.error('[FeaturedVehicles] Unexpected data format', { data });
        setVehicles([]);
      }
      setError(null);
    } catch (err) {
      logger.error('Error fetching vehicles:', {}, err as Error);
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-US').format(mileage);
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              {t('common.featured')} <span className="text-[var(--primary-orange)]">{t('vehicles.vehicles')}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-red-500">{error}</p>
            <Button onClick={fetchVehicles} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const featuredVehicles = vehicles.filter(v => v.featured).slice(0, 6);
  const displayVehicles = featuredVehicles.length > 0 ? featuredVehicles : vehicles.slice(0, 6);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            {t('common.featured')} <span className="text-[var(--primary-orange)]">{t('vehicles.vehicles')}</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('hero.description')}
          </p>
        </div>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {displayVehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              className="overflow-hidden shadow-card-hover cursor-pointer"
              onMouseEnter={() => setHoveredCard(vehicle.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Image Container */}
              <div className="relative h-64 overflow-hidden bg-gray-200">
                <VehicleImageWithFallback
                  src={typeof vehicle.images === 'string' ? JSON.parse(vehicle.images)[0] : vehicle.images?.[0] || '/images/placeholder-vehicle.svg'}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  className={`object-cover transition-transform duration-300 ${
                    hoveredCard === vehicle.id ? 'scale-110' : ''
                  }`}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  fallbackSrc="/images/placeholder-vehicle.svg"
                />
                {/* Overlay Actions */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 transition-opacity duration-300 ${
                    hoveredCard === vehicle.id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div className="flex gap-2">
                    <Link href={`/vehicles/${(vehicle as any).slug || vehicle.id}`}>
                      <Button size="sm" variant="secondary" className="bg-white/90">
                        <Eye className="h-4 w-4 mr-1" /> {t('vehicles.viewDetails')}
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" className="bg-white/20 text-white hover:bg-white/30">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {(vehicle.status === 'Available' || vehicle.status === 'I Disponueshëm') && (
                    <Badge className="bg-green-500 text-white">{t('common.available')}</Badge>
                  )}
                  {vehicle.featured && (
                    <Badge className="bg-[var(--primary-orange)] text-white">{t('common.featured')}</Badge>
                  )}
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-4">
                {/* Title and Price */}
                <div className="mb-3">
                  <h3 className="text-xl font-semibold mb-1">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <p className="text-2xl font-bold text-[var(--primary-orange)]">
                    {formatPrice(vehicle.price)}
                  </p>
                </div>

                {/* Vehicle Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{vehicle.year}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    <span>{formatMileage(vehicle.mileage)} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Fuel className="h-3 w-3" />
                    <span>{vehicle.fuelType}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    <span>{vehicle.transmission}</span>
                  </div>
                </div>

                {/* Action Button */}
                <Link href={`/vehicles/${(vehicle as any).slug || vehicle.id}`}>
                  <Button className="w-full bg-[var(--primary-orange)] hover:bg-orange-600 text-white">
                    {t('vehicles.viewDetails')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link href="/vehicles">
            <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white">
              {t('vehicles.viewAll')} →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}