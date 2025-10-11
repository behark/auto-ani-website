'use client';

import { useState } from 'react';
import Image from 'next/image';

interface VehicleImageWithFallbackProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallbackSrc?: string;
}

export default function VehicleImageWithFallback({
  src,
  alt,
  fill = false,
  className = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw',
  priority = false,
  fallbackSrc = '/images/placeholder-vehicle.svg'
}: VehicleImageWithFallbackProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError && imageSrc !== fallbackSrc) {
      setHasError(true);
      setImageSrc(fallbackSrc);
    }
  };

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={handleError}
    />
  );
}