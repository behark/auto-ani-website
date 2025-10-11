/**
 * Optimized Vehicle Card Component
 *
 * Performance optimizations:
 * - React.memo for preventing unnecessary re-renders
 * - Lazy image loading with Intersection Observer
 * - WebP support with JPEG fallback
 * - Proper image sizing attributes
 * - Minimal re-renders through prop comparison
 */

'use client';

import { memo, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Vehicle } from '@prisma/client';

interface VehicleCardProps {
  vehicle: Vehicle;
  priority?: boolean; // For above-the-fold images
  onFavorite?: (id: string) => void;
}

/**
 * Vehicle Card Skeleton for loading states
 */
export const VehicleCardSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="h-48 w-full" />
    <CardContent className="p-4">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </CardContent>
    <CardFooter className="p-4 pt-0">
      <Skeleton className="h-10 w-full" />
    </CardFooter>
  </Card>
);

/**
 * Optimized Vehicle Card Component
 */
const VehicleCardComponent = ({ vehicle, priority = false, onFavorite }: VehicleCardProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '100px', // Start loading 100px before visible
    skip: priority // Skip lazy loading for priority images
  });

  const [imageError, setImageError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Determine image path (use optimized if available)
  const getImagePath = (imagePath: string | null): string => {
    if (!imagePath) return '/images/placeholder-vehicle.svg';

    // If already optimized path, use as-is
    if (imagePath.includes('/optimized/')) {
      return imagePath;
    }

    // Convert to optimized path
    // Example: /images/vehicles/golf-7-gtd-2017/1.jpg
    // Becomes: /images/vehicles/optimized/golf-7-gtd-2017/1-640w.jpg
    const parts = imagePath.split('/');
    const fileName = parts.pop();
    const baseName = fileName?.replace(/\.(jpg|jpeg|png)$/i, '');

    return `/images/vehicles/optimized/${parts.slice(3).join('/')}/${baseName}-640w.jpg`;
  };

  const getWebPPath = (imagePath: string): string => {
    return imagePath.replace(/\.jpg$/i, '.webp');
  };

  const imagePath = getImagePath(vehicle.images?.[0]);
  const webpPath = getWebPPath(imagePath);

  // Format price
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(vehicle.price);

  // Handle favorite toggle
  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    onFavorite?.(vehicle.id);
  };

  // Don't render until in view (unless priority)
  if (!priority && !inView) {
    return (
      <div ref={ref} className="min-h-[400px]">
        <VehicleCardSkeleton />
      </div>
    );
  }

  return (
    <Card ref={ref} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link href={`/vehicles/${vehicle.slug || vehicle.id}`} className="block">
        {/* Image Section with WebP support */}
        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
          {!imageError ? (
            <picture>
              <source srcSet={webpPath} type="image/webp" />
              <Image
                src={imagePath}
                alt={`${vehicle.make} ${vehicle.model}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover hover:scale-105 transition-transform duration-300"
                priority={priority}
                quality={80}
                onError={() => setImageError(true)}
                loading={priority ? 'eager' : 'lazy'}
              />
            </picture>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400">Image not available</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-2">
            {vehicle.featured && (
              <Badge variant="default" className="bg-blue-600">
                Featured
              </Badge>
            )}
            {vehicle.status === 'AVAILABLE' && (
              <Badge variant="secondary" className="bg-green-600">
                Available
              </Badge>
            )}
            {vehicle.status === 'SOLD' && (
              <Badge variant="destructive">
                Sold
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleFavorite}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            aria-label="Add to favorites"
          >
            <svg
              className={`w-5 h-5 ${isFavorite ? 'fill-red-500' : 'fill-none'} stroke-current`}
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* Content Section */}
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>

          <div className="text-2xl font-bold text-blue-600 mb-3">
            {formattedPrice}
          </div>

          {/* Vehicle Details */}
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{vehicle.mileage?.toLocaleString()} miles</span>
            </div>

            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{vehicle.fuelType}</span>
            </div>

            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>{vehicle.transmission}</span>
            </div>

            {vehicle.color && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span>{vehicle.color}</span>
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer Section */}
        <CardFooter className="p-4 pt-0">
          <Button variant="outline" className="w-full" asChild>
            <span>View Details</span>
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
};

/**
 * Memoized Vehicle Card with custom comparison
 */
export const VehicleCard = memo(VehicleCardComponent, (prevProps, nextProps) => {
  // Only re-render if vehicle data actually changed
  return (
    prevProps.vehicle.id === nextProps.vehicle.id &&
    prevProps.vehicle.status === nextProps.vehicle.status &&
    prevProps.vehicle.featured === nextProps.vehicle.featured &&
    prevProps.priority === nextProps.priority
  );
});

VehicleCard.displayName = 'VehicleCard';