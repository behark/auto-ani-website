/**
 * Enhanced Image Optimization System for AUTO ANI Website
 *
 * Features:
 * - WebP/AVIF conversion pipeline
 * - Responsive image sizing (640px to 1920px)
 * - 1-year cache headers
 * - Next.js Image component optimization
 * - Auto-format detection and conversion
 * - Performance monitoring
 */

import { v2 as cloudinary } from 'cloudinary'
import { generateImageUrl, ImageTransformations } from './cloudinary'
import { logger } from './logger'
import { env } from './env'

// Responsive breakpoints for optimal loading
export const RESPONSIVE_BREAKPOINTS = [
  { name: 'mobile', width: 640, quality: 75 },
  { name: 'tablet', width: 768, quality: 80 },
  { name: 'laptop', width: 1024, quality: 85 },
  { name: 'desktop', width: 1200, quality: 90 },
  { name: 'widescreen', width: 1440, quality: 90 },
  { name: 'ultrawide', width: 1920, quality: 95 }
] as const

// Modern image formats in order of preference
export const IMAGE_FORMATS = ['avif', 'webp', 'jpg'] as const

export interface OptimizedImageSet {
  src: string
  srcSet: string
  sizes: string
  webpSrcSet?: string
  avifSrcSet?: string
  placeholder?: string
  width: number
  height: number
  aspectRatio: number
}

export interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
  crop?: 'fill' | 'fit' | 'scale' | 'limit' | 'mfit' | 'pad'
  gravity?: 'face' | 'center' | 'auto' | 'north' | 'south' | 'east' | 'west'
  blur?: number // For progressive loading placeholders
  aspectRatio?: string // e.g., '16:9', '4:3', '1:1'
  enableAvif?: boolean
  enableWebp?: boolean
  generatePlaceholder?: boolean
  cacheControl?: string
}

/**
 * Generate optimized image set with multiple formats and sizes
 */
export function generateOptimizedImageSet(
  publicId: string,
  options: ImageOptimizationOptions = {}
): OptimizedImageSet {
  const {
    width = 1200,
    height,
    quality = 85,
    format = 'auto',
    crop = 'limit',
    gravity = 'auto',
    aspectRatio,
    enableAvif = true,
    enableWebp = true,
    generatePlaceholder = true,
    cacheControl = 'public, max-age=31536000, immutable' // 1 year cache
  } = options

  // Calculate height based on aspect ratio if not provided
  let calculatedHeight = height
  if (!height && aspectRatio) {
    const [w, h] = aspectRatio.split(':').map(Number)
    calculatedHeight = Math.round((width * h) / w)
  }

  const baseTransformation = {
    width,
    height: calculatedHeight,
    crop,
    gravity,
    quality,
    fetch_format: format
  }

  // Generate responsive srcSet for different breakpoints
  const responsiveSizes = RESPONSIVE_BREAKPOINTS.filter(bp => bp.width <= width)

  const srcSet = responsiveSizes
    .map(breakpoint => {
      const url = generateImageUrl(publicId, {
        ...baseTransformation,
        width: breakpoint.width,
        quality: breakpoint.quality
      })
      return `${url} ${breakpoint.width}w`
    })
    .join(', ')

  // Generate WebP srcSet
  const webpSrcSet = enableWebp ? responsiveSizes
    .map(breakpoint => {
      const url = generateImageUrl(publicId, {
        ...baseTransformation,
        width: breakpoint.width,
        quality: breakpoint.quality,
        fetch_format: 'webp'
      })
      return `${url} ${breakpoint.width}w`
    })
    .join(', ') : undefined

  // Generate AVIF srcSet (best compression)
  const avifSrcSet = enableAvif ? responsiveSizes
    .map(breakpoint => {
      const url = generateImageUrl(publicId, {
        ...baseTransformation,
        width: breakpoint.width,
        quality: Math.max(breakpoint.quality - 10, 60), // AVIF can use lower quality
        fetch_format: 'avif'
      })
      return `${url} ${breakpoint.width}w`
    })
    .join(', ') : undefined

  // Generate low-quality placeholder for progressive loading
  const placeholder = generatePlaceholder ? generateImageUrl(publicId, {
    width: 40,
    height: calculatedHeight ? Math.round((40 * calculatedHeight) / width) : 30,
    quality: 30,
    fetch_format: 'webp',
    effect: 'blur:300'
  }) : undefined

  // Generate sizes attribute for responsive images
  const sizes = generateSizesAttribute(responsiveSizes)

  // Main image source
  const src = generateImageUrl(publicId, baseTransformation)

  const result: OptimizedImageSet = {
    src,
    srcSet,
    sizes,
    webpSrcSet,
    avifSrcSet,
    placeholder,
    width,
    height: calculatedHeight || width,
    aspectRatio: calculatedHeight ? width / calculatedHeight : 1
  }

  logger.debug('Generated optimized image set', {
    publicId,
    formats: {
      avif: !!avifSrcSet,
      webp: !!webpSrcSet,
      fallback: true
    },
    sizes: responsiveSizes.length,
    placeholder: !!placeholder
  })

  return result
}

/**
 * Generate sizes attribute for responsive images
 */
function generateSizesAttribute(breakpoints: typeof RESPONSIVE_BREAKPOINTS[number][]): string {
  const sizeQueries = breakpoints.map((bp, index) => {
    if (index === breakpoints.length - 1) {
      // Last breakpoint - no media query
      return `${bp.width}px`
    }

    const nextBp = breakpoints[index + 1]
    return `(max-width: ${nextBp.width}px) ${bp.width}px`
  })

  return sizeQueries.join(', ')
}

/**
 * Pre-defined optimized image configurations for common use cases
 */
export const OptimizedImageConfigs = {
  // Vehicle listing card
  vehicleCard: {
    width: 400,
    aspectRatio: '4:3',
    quality: 80,
    crop: 'fill' as const,
    enableAvif: true,
    enableWebp: true,
    generatePlaceholder: true
  },

  // Vehicle gallery thumbnail
  vehicleThumbnail: {
    width: 200,
    aspectRatio: '1:1',
    quality: 75,
    crop: 'fill' as const,
    enableAvif: true,
    enableWebp: true,
    generatePlaceholder: true
  },

  // Vehicle hero image
  vehicleHero: {
    width: 1920,
    aspectRatio: '16:9',
    quality: 90,
    crop: 'fill' as const,
    enableAvif: true,
    enableWebp: true,
    generatePlaceholder: true
  },

  // Vehicle detail gallery
  vehicleGallery: {
    width: 1200,
    aspectRatio: '4:3',
    quality: 85,
    crop: 'limit' as const,
    enableAvif: true,
    enableWebp: true,
    generatePlaceholder: true
  },

  // Blog featured image
  blogFeatured: {
    width: 800,
    aspectRatio: '16:9',
    quality: 85,
    crop: 'fill' as const,
    enableAvif: true,
    enableWebp: true,
    generatePlaceholder: true
  },

  // User avatar
  avatar: {
    width: 200,
    aspectRatio: '1:1',
    quality: 80,
    crop: 'fill' as const,
    gravity: 'face' as const,
    enableAvif: true,
    enableWebp: true,
    generatePlaceholder: false
  },

  // Open Graph image
  ogImage: {
    width: 1200,
    height: 630,
    quality: 90,
    crop: 'fill' as const,
    enableAvif: false, // OG images should be widely compatible
    enableWebp: false,
    generatePlaceholder: false
  }
} as const

/**
 * Generate multiple image variants for a vehicle
 */
export function generateVehicleImageSet(publicId: string) {
  return {
    hero: generateOptimizedImageSet(publicId, OptimizedImageConfigs.vehicleHero),
    card: generateOptimizedImageSet(publicId, OptimizedImageConfigs.vehicleCard),
    gallery: generateOptimizedImageSet(publicId, OptimizedImageConfigs.vehicleGallery),
    thumbnail: generateOptimizedImageSet(publicId, OptimizedImageConfigs.vehicleThumbnail),
    ogImage: generateOptimizedImageSet(publicId, OptimizedImageConfigs.ogImage)
  }
}

/**
 * Get optimal image format based on browser support
 */
export function getOptimalImageFormat(userAgent?: string): 'avif' | 'webp' | 'jpg' {
  if (!userAgent) return 'webp' // Default to WebP

  // Check for AVIF support (Chrome 85+, Firefox 93+)
  if (userAgent.includes('Chrome/') &&
      parseInt(userAgent.match(/Chrome\/(\d+)/)?.[1] || '0') >= 85) {
    return 'avif'
  }

  // Check for WebP support (most modern browsers)
  if (userAgent.includes('Chrome/') ||
      userAgent.includes('Firefox/') ||
      userAgent.includes('Edge/') ||
      userAgent.includes('Safari/')) {
    return 'webp'
  }

  // Fallback to JPEG
  return 'jpg'
}

/**
 * Image optimization middleware for Next.js API routes
 */
export function withImageOptimization<T extends { headers?: { [key: string]: string } }>(
  response: T,
  format: 'avif' | 'webp' | 'jpg' = 'webp'
): T {
  const cacheHeaders = {
    'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
    'Vary': 'Accept',
    'Content-Type': `image/${format}`,
  }

  return {
    ...response,
    headers: {
      ...response.headers,
      ...cacheHeaders
    }
  }
}

/**
 * Monitor image optimization performance
 */
export class ImageOptimizationMetrics {
  private static metrics = {
    transformations: 0,
    cacheMisses: 0,
    cacheHits: 0,
    formatConversions: { avif: 0, webp: 0, jpg: 0 },
    avgTransformationTime: 0
  }

  static recordTransformation(format: string, duration: number) {
    this.metrics.transformations++
    this.metrics.avgTransformationTime =
      (this.metrics.avgTransformationTime + duration) / 2

    if (format in this.metrics.formatConversions) {
      this.metrics.formatConversions[format as keyof typeof this.metrics.formatConversions]++
    }

    logger.debug('Image transformation recorded', {
      format,
      duration,
      totalTransformations: this.metrics.transformations
    })
  }

  static recordCacheHit() {
    this.metrics.cacheHits++
  }

  static recordCacheMiss() {
    this.metrics.cacheMisses++
  }

  static getMetrics() {
    return { ...this.metrics }
  }

  static getCacheHitRatio() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses
    return total > 0 ? this.metrics.cacheHits / total : 0
  }
}

/**
 * Preload critical images for better performance
 */
export function generatePreloadLinks(images: Array<{ src: string; format?: string; sizes?: string }>) {
  return images.map(({ src, format = 'webp', sizes }) => ({
    rel: 'preload',
    as: 'image',
    href: src,
    type: `image/${format}`,
    ...(sizes && { imagesizes: sizes })
  }))
}

/**
 * Generate structured data for images (SEO)
 */
export function generateImageStructuredData(
  imageSet: OptimizedImageSet,
  alt: string,
  caption?: string
) {
  return {
    '@type': 'ImageObject',
    url: imageSet.src,
    width: imageSet.width,
    height: imageSet.height,
    contentUrl: imageSet.src,
    ...(alt && { name: alt, alternateName: alt }),
    ...(caption && { caption, description: caption }),
    encodingFormat: 'image/webp',
    thumbnail: imageSet.placeholder ? {
      '@type': 'ImageObject',
      url: imageSet.placeholder
    } : undefined
  }
}

// Export utilities for backward compatibility
export {
  generateImageUrl,
  ImageTransformations
} from './cloudinary'