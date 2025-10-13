'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface FallbackImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
  fallbackSrc?: string;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * Image component with automatic fallback support
 * Falls back to placeholder when image fails to load
 */
export default function FallbackImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder-vehicle.svg',
  onLoad,
  ...props
}: FallbackImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError && imgSrc !== fallbackSrc) {
      setHasError(true);
      setImgSrc(fallbackSrc);
      console.warn(`Failed to load image: ${src}, using fallback`);
    }
  };

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(false);
    if (onLoad) {
      onLoad(event);
    }
  };

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={handleError}
      onLoad={handleLoad}
      unoptimized={hasError} // Disable optimization for fallback images
    />
  );
}