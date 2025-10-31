/**
 * Centralized image optimization constants for AUTO ANI Website
 * Standardized quality settings for consistent performance and visual quality
 */

/**
 * Image quality settings (0-100)
 * These values balance file size with visual quality
 */
export const IMAGE_QUALITY = {
  // Low quality for placeholders and blur previews
  PLACEHOLDER: 20,

  // Standard quality for thumbnails and small images
  THUMBNAIL: 70,

  // Default quality for most images
  DEFAULT: 80,

  // High quality for hero images and detailed views
  HIGH: 85,

  // Maximum quality for full-size gallery views
  FULL: 90,
} as const;

/**
 * Image dimensions for different use cases
 */
export const IMAGE_DIMENSIONS = {
  // Placeholder dimensions
  PLACEHOLDER: { width: 50, height: 33 },

  // Thumbnail for vehicle cards
  THUMBNAIL: { width: 300, height: 200 },

  // Card images for listings
  CARD: { width: 600, height: 400 },

  // Gallery images
  GALLERY: { width: 800, height: 600 },

  // Hero/featured images
  HERO: { width: 1200, height: 800 },

  // Full size for lightbox
  FULL: { width: 1920, height: 1280 },
} as const;

/**
 * Supported image formats
 */
export const IMAGE_FORMATS = {
  WEBP: 'webp',
  AVIF: 'avif',
  JPEG: 'jpeg',
  PNG: 'png',
} as const;

/**
 * Default image format for optimization
 */
export const DEFAULT_IMAGE_FORMAT = IMAGE_FORMATS.WEBP;

/**
 * Image fit modes
 */
export const IMAGE_FIT = {
  CROP: 'crop',
  MAX: 'max',
  MIN: 'min',
  FILL: 'fill',
  SCALE: 'scale',
} as const;

/**
 * Build optimized Sanity CDN URL with standardized quality
 */
export function buildOptimizedImageUrl(
  baseUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    fit?: string;
  } = {}
): string {
  const {
    width = IMAGE_DIMENSIONS.CARD.width,
    height = IMAGE_DIMENSIONS.CARD.height,
    quality = IMAGE_QUALITY.DEFAULT,
    format = DEFAULT_IMAGE_FORMAT,
    fit = IMAGE_FIT.CROP,
  } = options;

  // If already has query params, append with &, otherwise use ?
  const separator = baseUrl.includes('?') ? '&' : '?';

  return `${baseUrl}${separator}w=${width}&h=${height}&fit=${fit}&fm=${format}&q=${quality}`;
}

/**
 * Get standardized image URL for specific use case
 */
export const getOptimizedImageUrl = {
  placeholder: (url: string) => buildOptimizedImageUrl(url, {
    width: IMAGE_DIMENSIONS.PLACEHOLDER.width,
    height: IMAGE_DIMENSIONS.PLACEHOLDER.height,
    quality: IMAGE_QUALITY.PLACEHOLDER,
  }),

  thumbnail: (url: string) => buildOptimizedImageUrl(url, {
    width: IMAGE_DIMENSIONS.THUMBNAIL.width,
    height: IMAGE_DIMENSIONS.THUMBNAIL.height,
    quality: IMAGE_QUALITY.THUMBNAIL,
  }),

  card: (url: string) => buildOptimizedImageUrl(url, {
    width: IMAGE_DIMENSIONS.CARD.width,
    height: IMAGE_DIMENSIONS.CARD.height,
    quality: IMAGE_QUALITY.DEFAULT,
  }),

  gallery: (url: string) => buildOptimizedImageUrl(url, {
    width: IMAGE_DIMENSIONS.GALLERY.width,
    height: IMAGE_DIMENSIONS.GALLERY.height,
    quality: IMAGE_QUALITY.DEFAULT,
  }),

  hero: (url: string) => buildOptimizedImageUrl(url, {
    width: IMAGE_DIMENSIONS.HERO.width,
    height: IMAGE_DIMENSIONS.HERO.height,
    quality: IMAGE_QUALITY.HIGH,
  }),

  full: (url: string) => buildOptimizedImageUrl(url, {
    width: IMAGE_DIMENSIONS.FULL.width,
    height: IMAGE_DIMENSIONS.FULL.height,
    quality: IMAGE_QUALITY.FULL,
  }),
};