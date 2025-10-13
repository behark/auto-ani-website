'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedVehicleImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
}

/**
 * Optimized Vehicle Image Component
 * Automatically uses WebP optimized versions when available
 * Falls back to original images if optimized versions don't exist
 */
export default function OptimizedVehicleImage({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  priority = false,
  fill = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85
}: OptimizedVehicleImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  // Generate optimized image path
  const getOptimizedSrc = (originalSrc: string): string => {
    // Check if it's a vehicle image
    if (!originalSrc.includes('/vehicles/')) {
      return originalSrc;
    }

    // Extract vehicle folder and filename
    const match = originalSrc.match(/\/vehicles\/([^\/]+)\/([^\/]+)$/);
    if (!match) return originalSrc;

    const [, vehicleFolder, filename] = match;
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

    // For optimized folder, use WebP format
    // Available sizes: 640w, 1280w, original
    const optimizedPath = `/images/optimized/vehicles/${vehicleFolder}/${nameWithoutExt}-1280w.webp`;

    return optimizedPath;
  };

  const optimizedSrc = getOptimizedSrc(imgSrc);

  const handleError = () => {
    // If optimized image fails, fallback to original
    if (optimizedSrc !== src && imgSrc !== src) {
      console.log(`Falling back to original image: ${src}`);
      setImgSrc(src);
    }
  };

  const imageProps = fill
    ? { fill: true, sizes }
    : { width, height };

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''} ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
      <Image
        src={imgSrc === src ? src : optimizedSrc}
        alt={alt}
        {...imageProps}
        quality={quality}
        priority={priority}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      />
    </div>
  );
}

// Export a memoized version for performance
export { OptimizedVehicleImage };