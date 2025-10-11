'use client';

import { useState, forwardRef } from 'react';
import Image from 'next/image';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { imageLoader, generateBlurDataURL, getFallbackImage, validateImagePath, getResponsiveSizes } from '@/lib/imageLoader';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  rootMargin?: string;
  threshold?: number;
  containerSize?: 'small' | 'medium' | 'large';
  fallbackType?: 'vehicle' | 'showroom' | 'team' | 'logo';
  eager?: boolean; // Force immediate loading without intersection observer
}

const LazyImage = forwardRef<HTMLDivElement, LazyImageProps>(({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
  sizes,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  fallbackSrc,
  rootMargin = '100px',
  threshold = 0.1,
  containerSize = 'medium',
  fallbackType = 'vehicle',
  eager = false,
  ...props
}, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  const { elementRef, isVisible } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true
  });

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = (error?: any) => {
    // Debug logging (commented out for production)
    // console.warn(`LazyImage failed to load: ${currentSrc}`, error);

    if (fallbackSrc && currentSrc !== fallbackSrc && !fallbackUsed) {
      // Try user-provided fallback first
      // console.log(`Trying user fallback: ${fallbackSrc}`);
      setCurrentSrc(fallbackSrc);
      setFallbackUsed(true);
      setHasError(false);
    } else if (!fallbackUsed) {
      // Try default fallback based on type
      const defaultFallback = getFallbackImage(fallbackType);
      if (currentSrc !== defaultFallback) {
        // console.log(`Trying default fallback: ${defaultFallback}`);
        setCurrentSrc(defaultFallback);
        setFallbackUsed(true);
        setHasError(false);
      } else {
        setHasError(true);
      }
    } else {
      setHasError(true);
    }
    onError?.();
  };

  // For priority images, eager loading, or when intersection observer is not supported
  const shouldLoadImmediately = priority || eager || (typeof window !== 'undefined' && !window.IntersectionObserver);

  // Validate the image path
  const isValidImage = validateImagePath(currentSrc);

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || getResponsiveSizes(containerSize);

  // Generate blur data URL if not provided and using blur placeholder
  const placeholderDataURL = blurDataURL || (placeholder === 'blur' ? generateBlurDataURL() : undefined);

  return (
    <div
      ref={(element) => {
        if (ref) {
          if (typeof ref === 'function') {
            ref(element);
          } else {
            ref.current = element;
          }
        }
        elementRef.current = element;
      }}
      className={cn('relative overflow-hidden', className)}
      style={fill ? undefined : { width, height }}
    >
      {(shouldLoadImmediately || isVisible) && !hasError && isValidImage ? (
        <>
          {!isLoaded && (
            <Skeleton
              className={cn(
                'absolute inset-0 bg-gray-200',
                fill ? 'w-full h-full' : ''
              )}
              style={fill ? undefined : { width, height }}
            />
          )}
          <Image
            src={currentSrc}
            alt={alt}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            fill={fill}
            sizes={responsiveSizes}
            quality={quality}
            placeholder={placeholder}
            blurDataURL={placeholderDataURL}
            priority={priority}
            loader={process.env.NODE_ENV === 'production' ? imageLoader : undefined}
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              fill ? 'object-cover' : ''
            )}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        </>
      ) : hasError || !isValidImage ? (
        <div
          className={cn(
            'flex items-center justify-center bg-gray-100 text-gray-400 text-sm',
            fill ? 'absolute inset-0' : ''
          )}
          style={fill ? undefined : { width, height }}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🚗</div>
            <div>Image unavailable</div>
          </div>
        </div>
      ) : (
        <Skeleton
          className={cn(
            'bg-gray-200',
            fill ? 'absolute inset-0' : ''
          )}
          style={fill ? undefined : { width, height }}
        />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;