/**
 * Image Optimization Utilities
 * Provides utilities for optimizing images with Next.js Image component
 */

import type { ImageLoaderProps } from 'next/image';

// Image quality configurations for different use cases
export const IMAGE_QUALITY = {
  THUMBNAIL: 60,
  GALLERY: 75,
  HERO: 85,
  FULL: 90,
} as const;

// Image sizes for responsive images
export const IMAGE_SIZES = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
  '4xl': 2560,
} as const;

// Device size breakpoints
export const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];

// Responsive image sizes string for srcSet
export const generateSizes = (config: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
}): string => {
  const { mobile = '100vw', tablet = '50vw', desktop = '33vw' } = config;
  return `(max-width: 640px) ${mobile}, (max-width: 1024px) ${tablet}, ${desktop}`;
};

/**
 * Custom image loader for optimized CDN delivery
 */
export function customImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // If it's already a full URL, return as is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  // For local images, use Next.js default optimization
  const params = new URLSearchParams();
  params.set('url', src);
  params.set('w', width.toString());
  params.set('q', (quality || 75).toString());

  return `/_next/image?${params.toString()}`;
}

/**
 * Get optimized image URL for Cloudinary
 */
export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
    crop?: 'fill' | 'scale' | 'fit' | 'limit' | 'pad';
    gravity?: 'auto' | 'face' | 'center';
  } = {}
): string {
  const {
    width,
    height,
    quality = 75,
    format = 'auto',
    crop = 'fill',
    gravity = 'auto',
  } = options;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    console.warn('Cloudinary cloud name not configured');
    return publicId;
  }

  const transformations = [
    'f_auto', // Auto format
    `q_${quality}`, // Quality
    crop && `c_${crop}`, // Crop mode
    gravity && `g_${gravity}`, // Gravity for cropping
    width && `w_${width}`, // Width
    height && `h_${height}`, // Height
    format !== 'auto' && `f_${format}`, // Format override
  ]
    .filter(Boolean)
    .join(',');

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`;
}

/**
 * Generate blur placeholder for images
 */
export async function generateBlurDataUrl(): Promise<string> {
  // For production, you would generate actual blur data URLs
  // For now, return a simple placeholder
  return `data:image/svg+xml;base64,${btoa(
    `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#E5E7EB"/>
    </svg>`
  )}`;
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, priority: 'high' | 'low' = 'high'): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  if (priority === 'high') {
    link.setAttribute('fetchpriority', 'high');
  }
  document.head.appendChild(link);
}

/**
 * Lazy load images with Intersection Observer
 */
export function setupLazyLoading(
  selector: string = 'img[data-src]',
  options: IntersectionObserverInit = {}
): () => void {
  if (typeof window === 'undefined') return () => {};

  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.01,
    ...options,
  };

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;

        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  }, defaultOptions);

  const images = document.querySelectorAll(selector);
  images.forEach((img) => imageObserver.observe(img));

  // Cleanup function
  return () => {
    images.forEach((img) => imageObserver.unobserve(img));
  };
}

/**
 * Get optimal image dimensions for a container
 */
export function getOptimalImageSize(
  containerWidth: number,
  aspectRatio: number = 16 / 9,
  devicePixelRatio: number = window.devicePixelRatio || 1
): { width: number; height: number } {
  // Round up to nearest breakpoint
  const width = DEVICE_SIZES.find((size) => size >= containerWidth * devicePixelRatio) ||
                DEVICE_SIZES[DEVICE_SIZES.length - 1];

  return {
    width,
    height: Math.round(width / aspectRatio),
  };
}

/**
 * Convert image URL to WebP or AVIF format
 */
export function convertToModernFormat(
  url: string,
  format: 'webp' | 'avif' = 'webp'
): string {
  // If it's a Cloudinary URL, add format parameter
  if (url.includes('cloudinary.com')) {
    return url.replace(/\.(jpg|jpeg|png)/, `.${format}`);
  }

  // For other URLs, just return as is (Next.js Image will handle it)
  return url;
}

/**
 * Image optimization config for Next.js Image component
 */
export const imageConfig = {
  domains: [
    'localhost',
    'autosalonani.com',
    'res.cloudinary.com',
    'images.unsplash.com',
  ],
  deviceSizes: DEVICE_SIZES,
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  formats: ['image/avif', 'image/webp'],
  minimumCacheTTL: 60,
  dangerouslyAllowSVG: true,
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
} as const;

/**
 * Image component props generator for common patterns
 */
export function getImageProps(
  src: string,
  alt: string,
  type: 'thumbnail' | 'gallery' | 'hero' | 'full' = 'gallery'
) {
  const qualityMap = {
    thumbnail: IMAGE_QUALITY.THUMBNAIL,
    gallery: IMAGE_QUALITY.GALLERY,
    hero: IMAGE_QUALITY.HERO,
    full: IMAGE_QUALITY.FULL,
  };

  const sizesMap = {
    thumbnail: '(max-width: 640px) 50vw, 25vw',
    gallery: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    hero: '100vw',
    full: '100vw',
  };

  return {
    src,
    alt,
    quality: qualityMap[type],
    sizes: sizesMap[type],
    loading: type === 'hero' ? ('eager' as const) : ('lazy' as const),
    priority: type === 'hero',
  };
}

/**
 * Calculate image file size estimate
 */
export function estimateImageSize(
  width: number,
  height: number,
  format: 'jpg' | 'png' | 'webp' | 'avif',
  quality: number = 75
): number {
  // Rough estimates in bytes
  const bytesPerPixel = {
    jpg: 0.5,
    png: 3,
    webp: 0.3,
    avif: 0.2,
  };

  const pixels = width * height;
  const baseSize = pixels * bytesPerPixel[format];
  const qualityFactor = quality / 100;

  return Math.round(baseSize * qualityFactor);
}

/**
 * Image performance monitoring
 */
export function monitorImageLoading(): void {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry: PerformanceEntry) => {
      const resourceEntry = entry as PerformanceResourceTiming;
      if (resourceEntry.initiatorType === 'img') {
        console.log('Image loaded:', {
          name: entry.name,
          duration: entry.duration,
          transferSize: resourceEntry.transferSize,
          decodedBodySize: resourceEntry.decodedBodySize,
        });

        // Send to analytics if duration is too long
        if (entry.duration > 1000) {
          console.warn('Slow image load detected:', entry.name);
        }
      }
    });
  });

  observer.observe({ entryTypes: ['resource'] });
}