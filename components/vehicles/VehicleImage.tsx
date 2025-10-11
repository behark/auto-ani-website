'use client';

import { useState } from 'react';
import LazyImage from '@/components/ui/LazyImage';
import { getImageWithFallback } from '@/lib/imageLoader';
import { cn } from '@/lib/utils';

interface VehicleImageProps {
  src: string | undefined | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  eager?: boolean;
  containerSize?: 'small' | 'medium' | 'large';
  showPlaceholderIcon?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Specialized component for vehicle images with robust fallback handling
 * Ensures images always display correctly with proper placeholder support
 */
export default function VehicleImage({
  src,
  alt,
  fill = true,
  width,
  height,
  className,
  sizes,
  priority = false,
  eager = false,
  containerSize = 'medium',
  showPlaceholderIcon = true,
  onLoad,
  onError,
}: VehicleImageProps) {
  const [imageError, setImageError] = useState(false);

  // Get validated image path with fallback
  const imageSrc = getImageWithFallback(src, 'vehicle');

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  const handleLoad = () => {
    setImageError(false);
    onLoad?.();
  };

  return (
    <div className={cn('relative overflow-hidden bg-gray-100', className)}>
      <LazyImage
        src={imageSrc}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        className={cn(
          'object-cover',
          imageError && 'opacity-50'
        )}
        sizes={sizes}
        priority={priority}
        eager={eager}
        containerSize={containerSize}
        fallbackSrc="/images/placeholder-vehicle.svg"
        fallbackType="vehicle"
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Show icon overlay for placeholder/error state */}
      {showPlaceholderIcon && imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg
              className="mx-auto h-16 w-16 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
              />
            </svg>
            <p className="text-sm">Vehicle Image</p>
          </div>
        </div>
      )}
    </div>
  );
}