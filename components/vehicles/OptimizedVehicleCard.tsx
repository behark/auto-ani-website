'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Vehicle } from '@/lib/types';
import { Calendar, Car, ChevronLeft, ChevronRight, Eye, Fuel, Heart, Navigation, Settings } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import React, { memo, useCallback, useMemo, useState } from 'react';

// Lazy load non-critical components
const FavoriteButton = dynamic(() => import('@/components/favorites/FavoriteButton'), {
  loading: () => <button className="w-8 h-8 rounded-full bg-white/20" />,
  ssr: false
});

interface VehicleCardProps {
  vehicle: Vehicle;
  viewMode?: 'grid' | 'list';
  index?: number;
  eager?: boolean;
}

// Memoized price formatter
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(price);
};

// Memoized mileage formatter
const formatMileage = (mileage: number) => {
  return new Intl.NumberFormat('en-US').format(mileage);
};

// Memoized image navigation component
const ImageNavigation = memo(({
  currentIndex,
  totalImages,
  onPrev,
  onNext
}: {
  currentIndex: number;
  totalImages: number;
  onPrev: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
}) => {
  if (totalImages <= 1) return null;

  return (
    <>
      <button
        onClick={onPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={onNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
        aria-label="Next image"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-xs z-20">
        {currentIndex + 1}/{totalImages}
      </div>
    </>
  );
});

ImageNavigation.displayName = 'ImageNavigation';

// Memoized specifications component
const VehicleSpecs = memo(({
  year,
  mileage,
  fuelType,
  transmission,
  bodyType,
  viewMode = 'grid'
}: {
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType?: string;
  viewMode?: 'grid' | 'list';
}) => {
  const formattedMileage = useMemo(() => formatMileage(mileage), [mileage]);

  if (viewMode === 'list') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Navigation className="h-4 w-4" />
          <span>{formattedMileage} mi</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Fuel className="h-4 w-4" />
          <span>{fuelType}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Settings className="h-4 w-4" />
          <span>{transmission}</span>
        </div>
        {bodyType && (
          <div className="flex items-center gap-2 text-gray-600">
            <Car className="h-4 w-4" />
            <span>{bodyType}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        <span>{year}</span>
      </div>
      <div className="flex items-center gap-2">
        <Navigation className="h-4 w-4" />
        <span>{formattedMileage} mi</span>
      </div>
      <div className="flex items-center gap-2">
        <Fuel className="h-4 w-4" />
        <span>{fuelType}</span>
      </div>
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4" />
        <span>{transmission}</span>
      </div>
    </div>
  );
});

VehicleSpecs.displayName = 'VehicleSpecs';

// Main component with React.memo
const OptimizedVehicleCard = memo(function OptimizedVehicleCard({
  vehicle,
  viewMode = 'grid',
  index = 0,
  eager = false
}: VehicleCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Determine loading priority - eager load first 4 cards
  const priority = eager || index < 4;
  const loading = priority ? 'eager' : 'lazy';

  // Memoize price formatting
  const formattedPrice = useMemo(() => formatPrice(vehicle.price), [vehicle.price]);

  // Memoize image URL
  const currentImage = useMemo(() => {
    if (imageError || !vehicle.images?.[currentImageIndex]) {
      return '/images/placeholder-vehicle.svg';
    }
    return vehicle.images[currentImageIndex];
  }, [currentImageIndex, vehicle.images, imageError]);

  // Navigation callbacks
  const handlePrevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + vehicle.images.length) % vehicle.images.length);
  }, [vehicle.images.length]);

  const handleNextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % vehicle.images.length);
  }, [vehicle.images.length]);

  // Touch handling for mobile swipe
  const [touchStartX, setTouchStartX] = useState(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX - touchEndX;

    if (Math.abs(deltaX) > 50) {
      e.preventDefault();
      if (deltaX > 0) {
        handleNextImage(e as any);
      } else {
        handlePrevImage(e as any);
      }
    }
  }, [touchStartX, handleNextImage, handlePrevImage]);

  // List view
  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 h-64 md:h-auto relative bg-gray-100 group">
            <Image
              src={currentImage}
              alt={`${vehicle.make} ${vehicle.model}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              loading={loading}
              priority={priority}
              onError={() => setImageError(true)}
              quality={85}
            />

            <div
              className="absolute inset-0"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            />

            <ImageNavigation
              currentIndex={currentImageIndex}
              totalImages={vehicle.images.length}
              onPrev={handlePrevImage}
              onNext={handleNextImage}
            />

            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {vehicle.featured && (
                <Badge className="bg-orange-500 text-white">Featured</Badge>
              )}
            </div>

            <div className="absolute top-4 right-4">
              <FavoriteButton vehicle={vehicle} variant="floating" size="sm" />
            </div>
          </div>

          <CardContent className="flex-1 p-6">
            <div className="mb-4">
              <h3 className="text-2xl font-semibold mb-1">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-3xl font-bold text-orange-500">
                {formattedPrice}
              </p>
            </div>

            <VehicleSpecs
              year={vehicle.year}
              mileage={vehicle.mileage}
              fuelType={vehicle.fuelType}
              transmission={vehicle.transmission}
              bodyType={vehicle.bodyType}
              viewMode="list"
            />

            {vehicle.description && (
              <p className="text-gray-600 mb-4 line-clamp-2">{vehicle.description}</p>
            )}

            <div className="flex gap-2">
              <Link href={`/vehicles/${vehicle.slug || vehicle.id}`} className="flex-1">
                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                  View Details
                </Button>
              </Link>
              <Button variant="outline">Compare</Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <div className="relative h-64 overflow-hidden bg-gray-100">
        <Image
          src={currentImage}
          alt={`${vehicle.make} ${vehicle.model}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading={loading}
          priority={priority}
          onError={() => setImageError(true)}
          quality={85}
        />

        <div
          className="absolute inset-0 z-10"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />

        <ImageNavigation
          currentIndex={currentImageIndex}
          totalImages={vehicle.images.length}
          onPrev={handlePrevImage}
          onNext={handleNextImage}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="bg-white/90">
              <Eye className="h-4 w-4 mr-1" /> Quick View
            </Button>
          </div>
        </div>

        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
          {vehicle.featured && (
            <Badge className="bg-orange-500 text-white">Featured</Badge>
          )}
        </div>

        <div className="absolute top-4 right-4 z-20">
          <FavoriteButton vehicle={vehicle} variant="floating" size="sm" />
        </div>
      </div>

      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="text-xl font-semibold mb-1">
            {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-2xl font-bold text-orange-500">
            {formattedPrice}
          </p>
        </div>

        <VehicleSpecs
          year={vehicle.year}
          mileage={vehicle.mileage}
          fuelType={vehicle.fuelType}
          transmission={vehicle.transmission}
        />

        <div className="flex gap-2">
          <Link href={`/vehicles/${vehicle.slug || vehicle.id}`} className="flex-1" prefetch={false}>
            <Button className="w-full bg-orange-500 hover:bg-orange-600">
              View Details
            </Button>
          </Link>
          <Button variant="outline">Compare</Button>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if these props change
  return (
    prevProps.vehicle.id === nextProps.vehicle.id &&
    prevProps.vehicle.price === nextProps.vehicle.price &&
    prevProps.vehicle.images?.[0] === nextProps.vehicle.images?.[0] &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.index === nextProps.index
  );
});

OptimizedVehicleCard.displayName = 'OptimizedVehicleCard';

export default OptimizedVehicleCard;