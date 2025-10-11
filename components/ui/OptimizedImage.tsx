'use client';

import Image from 'next/image';
import { useState, useEffect, memo } from 'react';
import {
  generateOptimizedImageSet,
  OptimizedImageConfigs,
  ImageOptimizationMetrics,
  type ImageOptimizationOptions,
  type OptimizedImageSet
} from '@/lib/imageOptimization';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  className?: string;
  containerClassName?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  aspectRatio?: string;
  variant?: keyof typeof OptimizedImageConfigs;
  optimization?: ImageOptimizationOptions;
  enableAvif?: boolean;
  enableWebp?: boolean;
  showPlaceholder?: boolean;
}

const BLUR_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  sizes,
  priority = false,
  quality = 85,
  className = '',
  containerClassName = '',
  placeholder = 'blur',
  blurDataURL = BLUR_DATA_URL,
  onLoad,
  onError,
  fallbackSrc = '/images/placeholder-vehicle.svg',
  aspectRatio = '16/9',
  variant,
  optimization = {},
  enableAvif = true,
  enableWebp = true,
  showPlaceholder = true
}: OptimizedImageProps) {
  const [imageSet, setImageSet] = useState<OptimizedImageSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadStartTime] = useState(Date.now());

  // Generate optimized image set
  useEffect(() => {
    const startTime = Date.now();

    try {
      const config = variant ? OptimizedImageConfigs[variant] : {};
      const finalOptions = {
        width: width || 800,
        height: height,
        quality,
        enableAvif,
        enableWebp,
        generatePlaceholder: showPlaceholder,
        ...config,
        ...optimization
      };

      const optimizedSet = generateOptimizedImageSet(src, finalOptions);
      setImageSet(optimizedSet);
      setHasError(false);

      const duration = Date.now() - startTime;
      ImageOptimizationMetrics.recordTransformation(
        finalOptions.format || 'auto',
        duration
      );
    } catch (error) {
      console.error('Failed to generate optimized image set:', error);
      setHasError(true);
    }
  }, [src, variant, optimization, width, height, quality, enableAvif, enableWebp, showPlaceholder]);

  const handleLoad = () => {
    const loadTime = Date.now() - loadStartTime;
    setIsLoading(false);
    onLoad?.();

    // Track performance metrics
    if (typeof window !== 'undefined' && 'performance' in window) {
      console.debug('Image loaded', {
        src,
        loadTime,
        variant,
        hasPlaceholder: showPlaceholder
      });
    }
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
    console.warn('Image failed to load:', src);
  };

  // Fallback for errors or missing image set
  if (hasError || !imageSet) {
    const fallback = fallbackSrc || '/images/placeholder-vehicle.svg';
    return (
      <div className={cn('relative overflow-hidden', containerClassName)} style={{ aspectRatio }}>
        <Image
          src={fallback}
          alt={alt}
          width={width || 800}
          height={height || 600}
          fill={fill}
          sizes={sizes}
          quality={quality}
          priority={priority}
          className={cn(
            'transition-opacity duration-300 object-cover',
            hasError && 'opacity-75 filter grayscale',
            className
          )}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    );
  }

  // Enhanced responsive rendering with AVIF/WebP support
  return (
    <div className={cn('relative overflow-hidden', containerClassName)} style={fill ? { aspectRatio } : undefined}>
      {/* Placeholder for progressive loading */}
      {showPlaceholder && imageSet.placeholder && !isLoading && (
        <Image
          src={imageSet.placeholder}
          alt=""
          width={imageSet.width}
          height={imageSet.height}
          fill={fill}
          className="absolute inset-0 z-0 scale-110 filter blur-sm transition-opacity duration-300"
          priority
          aria-hidden="true"
        />
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* Main optimized image with multiple formats */}
      <picture>
        {/* AVIF source for best compression */}
        {imageSet.avifSrcSet && enableAvif && (
          <source
            srcSet={imageSet.avifSrcSet}
            sizes={sizes || imageSet.sizes}
            type="image/avif"
          />
        )}

        {/* WebP source for good compression and wide support */}
        {imageSet.webpSrcSet && enableWebp && (
          <source
            srcSet={imageSet.webpSrcSet}
            sizes={sizes || imageSet.sizes}
            type="image/webp"
          />
        )}

        {/* Fallback JPEG source */}
        <Image
          src={imageSet.src}
          alt={alt}
          width={fill ? undefined : (width || imageSet.width)}
          height={fill ? undefined : (height || imageSet.height)}
          fill={fill}
          sizes={sizes || imageSet.sizes}
          quality={quality}
          priority={priority}
          className={cn(
            'relative z-10 transition-all duration-300 object-cover',
            !isLoading && 'opacity-100',
            isLoading && 'opacity-0',
            showPlaceholder && !isLoading && 'scale-105',
            className
          )}
          placeholder={placeholder}
          blurDataURL={blurDataURL || imageSet.placeholder}
          onLoad={handleLoad}
          onError={handleError}
        />
      </picture>
    </div>
  );
});

/**
 * Specialized component for vehicle images
 */
export const VehicleImage = memo(function VehicleImage({
  variant = 'card',
  ...props
}: Omit<OptimizedImageProps, 'variant'> & {
  variant?: 'hero' | 'card' | 'gallery' | 'thumbnail'
}) {
  const variantMap = {
    hero: 'vehicleHero',
    card: 'vehicleCard',
    gallery: 'vehicleGallery',
    thumbnail: 'vehicleThumbnail'
  } as const;

  return (
    <OptimizedImage
      variant={variantMap[variant]}
      {...props}
    />
  );
});

/**
 * Component for blog featured images
 */
export const BlogImage = memo(function BlogImage(props: Omit<OptimizedImageProps, 'variant'>) {
  return (
    <OptimizedImage
      variant="blogFeatured"
      {...props}
    />
  );
});

/**
 * Component for user avatars
 */
export const AvatarImage = memo(function AvatarImage({
  size = 'md',
  className,
  ...props
}: Omit<OptimizedImageProps, 'variant'> & {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <OptimizedImage
      variant="avatar"
      className={cn(
        'rounded-full object-cover',
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});

export default OptimizedImage;

// Preload critical images with enhanced optimization
export const preloadImage = (src: string, variant?: keyof typeof OptimizedImageConfigs) => {
  if (typeof window === 'undefined') return;

  try {
    const config = variant ? OptimizedImageConfigs[variant] : {};
    const imageSet = generateOptimizedImageSet(src, config);

    // Preload AVIF if supported
    if (imageSet.avifSrcSet) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = imageSet.src.replace(/\.(webp|jpg)$/i, '.avif');
      link.type = 'image/avif';
      if (imageSet.sizes) {
        link.setAttribute('imagesizes', imageSet.sizes);
      }
      document.head.appendChild(link);
    }

    // Preload WebP
    if (imageSet.webpSrcSet) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = imageSet.src.replace(/\.(jpg|jpeg)$/i, '.webp');
      link.type = 'image/webp';
      if (imageSet.sizes) {
        link.setAttribute('imagesizes', imageSet.sizes);
      }
      document.head.appendChild(link);
    }

    // Preload fallback
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = imageSet.src;
    document.head.appendChild(link);
  } catch (error) {
    console.error('Failed to preload image:', error);

    // Fallback to simple preload
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  }
};

/**
 * Hook for preloading images
 */
export const useImagePreload = (src: string, variant?: keyof typeof OptimizedImageConfigs) => {
  useEffect(() => {
    preloadImage(src, variant);
  }, [src, variant]);
};

/**
 * Performance monitoring hook
 */
export const useImageMetrics = () => {
  const [metrics, setMetrics] = useState(ImageOptimizationMetrics.getMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(ImageOptimizationMetrics.getMetrics());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return metrics;
};

// Backward compatibility exports - now powered by new optimization system
export const generateSrcSet = (src: string, sizes: number[] = [320, 640, 768, 1024, 1280, 1920], format: 'webp' | 'jpg' = 'webp') => {
  try {
    const imageSet = generateOptimizedImageSet(src, { enableAvif: format === 'webp', enableWebp: format === 'webp' });
    return format === 'webp' ? imageSet.webpSrcSet : imageSet.srcSet;
  } catch {
    // Fallback to simple query parameters
    return sizes
      .map((size) => {
        const url = src.includes('?')
          ? `${src}&w=${size}&q=85`
          : `${src}?w=${size}&q=85`;
        return `${url} ${size}w`;
      })
      .join(', ');
  }
};

export const getOptimizedSrc = (originalSrc: string, format: 'webp' | 'jpg' = 'webp') => {
  try {
    const imageSet = generateOptimizedImageSet(originalSrc, { enableAvif: format === 'webp', enableWebp: format === 'webp' });
    return imageSet.src;
  } catch {
    return originalSrc;
  }
};