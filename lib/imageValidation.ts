import { access, constants } from 'fs/promises';
import { join } from 'path';

/**
 * Server-side image validation utilities
 * Use these only in Server Components or API routes
 */

const PUBLIC_DIR = join(process.cwd(), 'public');

/**
 * Checks if an image file exists on the filesystem
 * @param imagePath - Path relative to /public (e.g., "/images/vehicles/audi-q5-2020/1.jpg")
 * @returns Promise<boolean> - true if file exists and is accessible
 */
export async function imageExists(imagePath: string): Promise<boolean> {
  try {
    // Remove leading slash and resolve to public directory
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const fullPath = join(PUBLIC_DIR, cleanPath);

    // Check if file exists and is readable
    await access(fullPath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates an array of image paths and returns valid ones with fallback
 * @param imagePaths - Array of image paths to validate
 * @param fallbackPath - Fallback path if image doesn't exist
 * @returns Promise<string[]> - Array of valid image paths (or fallbacks)
 */
export async function validateImagePaths(
  imagePaths: string[],
  fallbackPath: string = '/images/placeholder-vehicle.svg'
): Promise<string[]> {
  const validatedPaths = await Promise.all(
    imagePaths.map(async (path) => {
      const exists = await imageExists(path);
      return exists ? path : fallbackPath;
    })
  );

  return validatedPaths;
}

/**
 * Gets the first valid image from an array of paths
 * @param imagePaths - Array of image paths to check
 * @param fallbackPath - Fallback path if no images exist
 * @returns Promise<string> - First valid image path or fallback
 */
export async function getFirstValidImage(
  imagePaths: string[],
  fallbackPath: string = '/images/placeholder-vehicle.svg'
): Promise<string> {
  for (const path of imagePaths) {
    const exists = await imageExists(path);
    if (exists) return path;
  }
  return fallbackPath;
}

/**
 * Validates vehicle images and provides detailed report
 * @param vehicleId - ID of the vehicle
 * @param imagePaths - Array of image paths
 * @returns Promise with validation results
 */
export async function validateVehicleImages(
  vehicleId: string,
  imagePaths: string[]
): Promise<{
  valid: string[];
  invalid: string[];
  hasAllImages: boolean;
  missingCount: number;
}> {
  const results = await Promise.all(
    imagePaths.map(async (path) => ({
      path,
      exists: await imageExists(path),
    }))
  );

  const valid = results.filter(r => r.exists).map(r => r.path);
  const invalid = results.filter(r => !r.exists).map(r => r.path);

  return {
    valid,
    invalid,
    hasAllImages: invalid.length === 0,
    missingCount: invalid.length,
  };
}

/**
 * Get optimized image path if it exists, otherwise return original
 * @param originalPath - Original image path
 * @param size - Optimized size variant (e.g., "640w", "1280w")
 * @param format - Image format (e.g., "webp", "jpg")
 * @returns Promise<string> - Optimized path if exists, otherwise original
 */
export async function getOptimizedImagePath(
  originalPath: string,
  size: string = '1280w',
  format: string = 'webp'
): Promise<string> {
  // Extract the base path and filename
  // Example: /images/vehicles/audi-q5-2020/1.jpg -> /images/vehicles/optimized/audi-q5-2020/1-1280w.webp

  const pathParts = originalPath.split('/');
  const filename = pathParts.pop()?.split('.')[0]; // Get filename without extension
  const vehicleFolder = pathParts[pathParts.length - 1];

  if (!filename || !vehicleFolder) return originalPath;

  const optimizedPath = `/images/vehicles/optimized/${vehicleFolder}/${filename}-${size}.${format}`;
  const exists = await imageExists(optimizedPath);

  return exists ? optimizedPath : originalPath;
}

/**
 * Batch validate and optimize image paths
 * @param imagePaths - Array of original image paths
 * @param preferredSize - Preferred optimized size
 * @param preferredFormat - Preferred image format
 * @returns Promise<string[]> - Array of best available image paths
 */
export async function getBestImagePaths(
  imagePaths: string[],
  preferredSize: string = '1280w',
  preferredFormat: string = 'webp'
): Promise<string[]> {
  return Promise.all(
    imagePaths.map(path => getOptimizedImagePath(path, preferredSize, preferredFormat))
  );
}