import FavoriteButton from '@/components/favorites/FavoriteButton';
import LazyImage from '@/components/ui/LazyImage';
import FallbackImage from '@/components/ui/FallbackImage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Vehicle } from '@/lib/types';
import { Calendar, Car, ChevronLeft, ChevronRight, Eye, Fuel, Heart, Navigation, Settings } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';

interface VehicleCardProps {
  vehicle: Vehicle;
  viewMode?: 'grid' | 'list';
  index?: number; // Position in grid for priority loading
  onView?: () => void;
  onCompare?: () => void;
  className?: string;
}

export default function VehicleCard({
  vehicle,
  viewMode = 'grid',
  index = 0,
  onView,
  onCompare,
  className
}: VehicleCardProps) {
  const { t } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);

  // Eager load first 6 images (first 2 rows in grid view)
  const shouldLoadEagerly = index < 6;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-US').format(mileage);
  };

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % vehicle.images.length);
  }, [vehicle.images.length]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + vehicle.images.length) % vehicle.images.length);
  }, [vehicle.images.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX - touchEndX;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold) {
      e.preventDefault();
      e.stopPropagation();

      if (deltaX > 0) {
        // Swipe left - next image
        setCurrentImageIndex((prev) => (prev + 1) % vehicle.images.length);
      } else {
        // Swipe right - previous image
        setCurrentImageIndex((prev) => (prev - 1 + vehicle.images.length) % vehicle.images.length);
      }
    }
  }, [touchStartX, vehicle.images.length]);

  if (viewMode === 'list') {
    return (
      <Card className={`overflow-hidden shadow-card-hover ${className || ''}`}>
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="md:w-1/3 h-64 md:h-auto relative bg-gray-200 group">
            <FallbackImage
              src={vehicle.images[currentImageIndex]}
              alt={`${vehicle.make} ${vehicle.model}`}
              fill
              fallbackSrc="/images/placeholder-vehicle.svg"
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={shouldLoadEagerly}
            />

            {/* Touch gesture area */}
            <div
              className="absolute inset-0"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            />

            {/* Navigation buttons for multiple images */}
            {vehicle.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                {/* Image indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  {currentImageIndex + 1}/{vehicle.images.length}
                </div>
              </>
            )}

            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {vehicle.status === 'I Disponueshëm' && (
                <Badge className="bg-green-500 text-white">{t('common.available')}</Badge>
              )}
              {vehicle.featured && (
                <Badge className="bg-[var(--primary-orange)] text-white">{t('common.featured')}</Badge>
              )}
            </div>
            <div className="absolute top-4 right-4">
              <FavoriteButton vehicle={vehicle} variant="floating" size="sm" />
            </div>
          </div>

          {/* Content */}
          <CardContent className="flex-1 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-semibold mb-1">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                <p className="text-3xl font-bold text-[var(--primary-orange)]">
                  {formatPrice(vehicle.price)}
                </p>
              </div>
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* Specifications */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Navigation className="h-4 w-4" />
                <span>{formatMileage(vehicle.mileage)} mi</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Fuel className="h-4 w-4" />
                <span>{vehicle.fuelType}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Settings className="h-4 w-4" />
                <span>{vehicle.transmission}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Car className="h-4 w-4" />
                <span>{vehicle.bodyType}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-4">{vehicle.description}</p>

            {/* Features */}
            <div className="flex flex-wrap gap-2 mb-4">
              {vehicle.features.slice(0, 4).map((feature, index) => (
                <Badge key={index} variant="secondary">
                  {feature}
                </Badge>
              ))}
              {vehicle.features.length > 4 && (
                <Badge variant="outline">+{vehicle.features.length - 4} more</Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link href={`/vehicles/${vehicle.slug || vehicle.id}`} className="flex-1">
                <Button className="w-full bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]">
                  View Details
                </Button>
              </Link>
              <Button variant="outline">Compare</Button>
              <Button variant="outline">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // Grid View
  return (
    <Card className={`overflow-hidden shadow-card-hover group ${className || ''}`}>
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden bg-gray-200">
        <LazyImage
          src={vehicle.images[currentImageIndex]}
          alt={`${vehicle.make} ${vehicle.model}`}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          fallbackType="vehicle"
          containerSize="medium"
          eager={shouldLoadEagerly}
          priority={shouldLoadEagerly}
        />

        {/* Touch gesture area */}
        <div
          className="absolute inset-0 z-10"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />

        {/* Navigation buttons for multiple images */}
        {vehicle.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {/* Image indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-xs z-20">
              {currentImageIndex + 1}/{vehicle.images.length}
            </div>
          </>
        )}

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="bg-white/90">
              <Eye className="h-4 w-4 mr-1" /> Quick View
            </Button>
            <Button size="sm" variant="ghost" className="bg-white/20 text-white hover:bg-white/30">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
          {vehicle.status === 'I Disponueshëm' && (
            <Badge className="bg-green-500 text-white">{t('common.available')}</Badge>
          )}
          {vehicle.featured && (
            <Badge className="bg-[var(--primary-orange)] text-white">{t('common.featured')}</Badge>
          )}
        </div>

        {/* Favorite Button */}
        <div className="absolute top-4 right-4 z-20">
          <FavoriteButton vehicle={vehicle} variant="floating" size="sm" />
        </div>

        {/* Swipe hint for mobile */}
        {vehicle.images.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-xs bg-black/30 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 md:hidden">
            Swipe for more photos
          </div>
        )}
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

        {/* Specifications */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{vehicle.year}</span>
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            <span>{formatMileage(vehicle.mileage)} mi</span>
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            <span>{vehicle.fuelType}</span>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>{vehicle.transmission}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link href={`/vehicles/${vehicle.slug || vehicle.id}`} className="flex-1">
            <Button className="w-full bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]">
              View Details
            </Button>
          </Link>
          <Button variant="outline">Compare</Button>
        </div>
      </CardContent>
    </Card>
  );
}