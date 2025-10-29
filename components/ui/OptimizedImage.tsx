'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  fallbackSrc?: string;
  showPlaceholder?: boolean;
}

/**
 * ✅ Unified Optimized Image Component
 *
 * Replaces:
 * - OptimizedVehicleImage
 * - VehicleImageWithFallback
 * - LazyImage
 * - ProgressiveImage
 *
 * Features:
 * - Automatic error fallback
 * - Loading placeholder
 * - Blur placeholder for smooth loading
 * - WebP support through Next.js
 * - Responsive sizing
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  quality = 85,
  fallbackSrc = '/images/placeholder-vehicle.svg',
  showPlaceholder = true,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError && imageSrc !== fallbackSrc) {
      setHasError(true);
      setImageSrc(fallbackSrc);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Low-quality placeholder for blur effect
  const blurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

  const imageProps = fill
    ? { fill: true, sizes }
    : { width: width || 800, height: height || 600 };

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''}`}>
      {/* Loading placeholder */}
      {showPlaceholder && isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}

      {/* Main image */}
      <Image
        src={imageSrc}
        alt={alt}
        {...imageProps}
        quality={quality}
        priority={priority}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        placeholder="blur"
        blurDataURL={blurDataURL}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
}
