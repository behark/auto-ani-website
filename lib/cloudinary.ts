// Cloudinary integration for AUTO ANI Website
// Handles image uploads, transformations, and optimization

import { v2 as cloudinary } from 'cloudinary'
import { env } from './env'
import { logger } from './logger'
import { captureException } from './monitoring/sentry'

// Configure Cloudinary if credentials are available
const hasCloudinary = !!(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
)

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
  })

  logger.info('Cloudinary configured successfully')
} else {
  logger.warn('Cloudinary credentials not configured - image upload features disabled')
}

export interface UploadOptions {
  folder?: string
  public_id?: string
  transformation?: any
  eager?: any[]
  tags?: string[]
  context?: Record<string, string>
  resource_type?: 'image' | 'video' | 'raw' | 'auto'
  quality?: 'auto' | number
  format?: string
  width?: number
  height?: number
  crop?: string
}

export interface UploadResult {
  public_id: string
  secure_url: string
  url: string
  width: number
  height: number
  format: string
  resource_type: string
  created_at: string
  bytes: number
  version: number
  folder?: string
  eager?: Array<{
    secure_url: string
    url: string
    transformation: string
  }>
}

/**
 * Upload image to Cloudinary
 */
export async function uploadImage(
  file: File | Buffer | string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  if (!hasCloudinary) {
    throw new Error('Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET')
  }

  try {
    let uploadData: string | Buffer

    if (file instanceof File) {
      // Convert File to base64
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      uploadData = `data:${file.type};base64,${buffer.toString('base64')}`
    } else if (Buffer.isBuffer(file)) {
      // Convert Buffer to base64
      uploadData = `data:image/jpeg;base64,${file.toString('base64')}`
    } else {
      // Assume it's already a data URL or file path
      uploadData = file
    }

    const defaultOptions: UploadOptions = {
      folder: 'vehicles', // Default folder for vehicle images
      resource_type: 'auto',
      quality: 'auto',
      format: 'auto',
      transformation: {
        width: 1920,
        height: 1080,
        crop: 'limit',
        quality: 'auto',
        fetch_format: 'auto'
      },
      eager: [
        // Thumbnail for listings
        {
          width: 400,
          height: 300,
          crop: 'fill',
          quality: 80,
          format: 'webp'
        },
        // Medium size for gallery
        {
          width: 800,
          height: 600,
          crop: 'fill',
          quality: 85,
          format: 'webp'
        },
        // Large size for detailed view
        {
          width: 1200,
          height: 900,
          crop: 'limit',
          quality: 90,
          format: 'webp'
        }
      ]
    }

    const uploadOptions = { ...defaultOptions, ...options }

    const result = await cloudinary.uploader.upload(uploadData, uploadOptions)

    logger.info('Image uploaded to Cloudinary', {
      public_id: result.public_id,
      size: result.bytes,
      format: result.format,
      folder: result.folder
    })

    return result as UploadResult

  } catch (error) {
    logger.error('Failed to upload image to Cloudinary', {
      error: error instanceof Error ? error.message : String(error)
    })

    captureException(error as Error, {
      operation: 'cloudinary_upload',
      options: { ...options, file: '[REDACTED]' }
    })

    throw error
  }
}

/**
 * Upload multiple images to Cloudinary
 */
export async function uploadImages(
  files: (File | Buffer | string)[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const results = await Promise.allSettled(
    files.map(file => uploadImage(file, options))
  )

  const successful: UploadResult[] = []
  const failed: Array<{ index: number; error: any }> = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value)
    } else {
      failed.push({ index, error: result.reason })
      logger.error(`Failed to upload image ${index}`, {
        error: result.reason instanceof Error ? result.reason.message : String(result.reason)
      })
    }
  })

  if (failed.length > 0) {
    logger.warn(`${failed.length} out of ${files.length} images failed to upload`)
  }

  return successful
}

/**
 * Delete image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
  if (!hasCloudinary) {
    throw new Error('Cloudinary not configured')
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId)

    if (result.result === 'ok') {
      logger.info('Image deleted from Cloudinary', { public_id: publicId })
    } else {
      logger.warn('Image deletion may have failed', {
        public_id: publicId,
        result: result.result
      })
    }

  } catch (error) {
    logger.error('Failed to delete image from Cloudinary', {
      public_id: publicId,
      error: error instanceof Error ? error.message : String(error)
    })

    captureException(error as Error, {
      operation: 'cloudinary_delete',
      public_id: publicId
    })

    throw error
  }
}

/**
 * Delete multiple images from Cloudinary
 */
export async function deleteImages(publicIds: string[]): Promise<void> {
  if (!hasCloudinary) {
    throw new Error('Cloudinary not configured')
  }

  try {
    const result = await cloudinary.api.delete_resources(publicIds)

    logger.info('Bulk image deletion completed', {
      requested: publicIds.length,
      deleted: Object.keys(result.deleted || {}).length,
      not_found: Object.keys(result.not_found || {}).length
    })

  } catch (error) {
    logger.error('Failed to delete images from Cloudinary', {
      public_ids: publicIds,
      error: error instanceof Error ? error.message : String(error)
    })

    captureException(error as Error, {
      operation: 'cloudinary_bulk_delete',
      count: publicIds.length
    })

    throw error
  }
}

/**
 * Generate optimized image URL with transformations
 */
export function generateImageUrl(
  publicId: string,
  transformations: any = {}
): string {
  if (!hasCloudinary) {
    // Return a fallback URL or the original public_id if Cloudinary is not configured
    return publicId.startsWith('http') ? publicId : `/images/${publicId}`
  }

  const defaultTransformations: any = {
    quality: 'auto',
    fetch_format: 'auto'
  }

  return cloudinary.url(publicId, {
    ...defaultTransformations,
    ...transformations,
    secure: true
  })
}

/**
 * Pre-defined image transformations for common use cases
 */
export const ImageTransformations = {
  // Vehicle listing thumbnail
  vehicleThumbnail: {
    width: 400,
    height: 300,
    crop: 'fill',
    quality: 80,
    format: 'webp'
  },

  // Vehicle gallery image
  vehicleGallery: {
    width: 800,
    height: 600,
    crop: 'limit',
    quality: 85,
    format: 'webp'
  },

  // Vehicle hero image
  vehicleHero: {
    width: 1200,
    height: 600,
    crop: 'fill',
    quality: 90,
    format: 'webp'
  },

  // Profile/avatar image
  avatar: {
    width: 150,
    height: 150,
    crop: 'fill',
    quality: 80,
    format: 'webp',
    gravity: 'face'
  },

  // Blog post featured image
  blogFeatured: {
    width: 800,
    height: 400,
    crop: 'fill',
    quality: 85,
    format: 'webp'
  }
}

/**
 * Get Cloudinary configuration status
 */
export function getCloudinaryStatus(): {
  configured: boolean
  cloud_name?: string
} {
  return {
    configured: hasCloudinary,
    cloud_name: env.CLOUDINARY_CLOUD_NAME
  }
}

/**
 * Generate responsive image srcSet for different screen sizes
 */
export function generateResponsiveSrcSet(
  publicId: string,
  baseTransformation: any = {}
): string {
  if (!hasCloudinary) {
    return publicId
  }

  const sizes = [400, 600, 800, 1200, 1600]

  return sizes
    .map(width => {
      const url = generateImageUrl(publicId, {
        ...baseTransformation,
        width,
        crop: 'scale'
      })
      return `${url} ${width}w`
    })
    .join(', ')
}

export { cloudinary }
export default cloudinary