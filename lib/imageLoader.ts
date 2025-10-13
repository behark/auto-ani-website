export interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Custom image loader for handling local images consistently
 * Works in both development and production environments
 */
export function imageLoader({ src, width, quality = 75 }: ImageLoaderProps): string {
  // For external images, return as-is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  // Ensure the path starts with / for absolute references
  const normalizedSrc = src.startsWith('/') ? src : `/${src}`;

  // Return the normalized path - works for both dev and production
  return normalizedSrc;
}

export function generateSrcSet(src: string, sizes: number[] = [640, 750, 828, 1080, 1200, 1920]): string {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  return sizes
    .map((size) => `${imageLoader({ src, width: size })} ${size}w`)
    .join(', ');
}

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage));
}

export class ImageCache {
  private cache = new Map<string, Promise<void>>();

  preload(src: string): Promise<void> {
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    const promise = preloadImage(src);
    this.cache.set(src, promise);
    return promise;
  }

  isLoaded(src: string): boolean {
    const promise = this.cache.get(src);
    return promise !== undefined;
  }

  clear(): void {
    this.cache.clear();
  }

  remove(src: string): void {
    this.cache.delete(src);
  }
}

export const globalImageCache = new ImageCache();

/**
 * Generates a blur data URL for placeholder images
 */
export const generateBlurDataURL = (width: number = 40, height: number = 40): string => {
  // Check if Buffer is available (server-side only)
  if (typeof Buffer === 'undefined') {
    // Fallback for client-side - simple data URL
    return `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E`;
  }

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#gradient)"/>
    </svg>
  `;

  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
};

/**
 * Gets optimized image sizes for responsive loading
 */
export const getResponsiveSizes = (containerSize?: 'small' | 'medium' | 'large'): string => {
  switch (containerSize) {
    case 'small':
      return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw';
    case 'medium':
      return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
    case 'large':
      return '(max-width: 768px) 100vw, (max-width: 1024px) 75vw, 50vw';
    default:
      return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
  }
};

/**
 * Default fallback image paths
 */
export const FALLBACK_IMAGES = {
  vehicle: '/images/placeholder-vehicle.svg',
  showroom: '/images/placeholder-showroom.svg',
  team: '/images/placeholder-vehicle.svg', // Use same as vehicle for now
  logo: '/images/logo.png'
} as const;

/**
 * Helper function to get fallback image with type safety
 */
export const getFallbackImage = (type: keyof typeof FALLBACK_IMAGES): string => {
  return FALLBACK_IMAGES[type];
};

/**
 * Validates if an image path has a valid format
 */
export const validateImagePath = (imagePath: string): boolean => {
  if (!imagePath || imagePath.length === 0) return false;

  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
  const hasValidExtension = validExtensions.some(ext =>
    imagePath.toLowerCase().endsWith(ext)
  );

  return hasValidExtension;
};

/**
 * Checks if an image path exists (client-side check only)
 * For actual file existence, use server-side validation
 */
export const checkImageExists = async (imagePath: string): Promise<boolean> => {
  if (!validateImagePath(imagePath)) return false;

  // Skip external URLs - assume they exist
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return true;
  }

  try {
    const response = await fetch(imagePath, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Get the best available image path with fallback chain
 * Tries: original -> fallback -> default placeholder
 */
export const getImageWithFallback = (
  imagePath: string | undefined | null,
  fallbackType: keyof typeof FALLBACK_IMAGES = 'vehicle'
): string => {
  // If no path provided, return fallback immediately
  if (!imagePath || !validateImagePath(imagePath)) {
    return getFallbackImage(fallbackType);
  }

  return imagePath;
};

/**
 * Preloads multiple images with fallback support
 */
export const preloadImagesWithFallback = async (
  imagePaths: string[],
  fallbackType: keyof typeof FALLBACK_IMAGES = 'vehicle'
): Promise<string[]> => {
  const validPaths: string[] = [];

  for (const path of imagePaths) {
    try {
      await preloadImage(path);
      validPaths.push(path);
    } catch {
      // If image fails to load, add fallback
      validPaths.push(getFallbackImage(fallbackType));
    }
  }

  return validPaths;
};