import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate URL-friendly slug from text
 * @param text - Text to convert to slug
 * @returns URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Format price with Euro symbol and thousand separators
 * @param price - Price in euros
 * @returns Formatted price string (e.g., "€42,500")
 */
export function formatPrice(price: number | null | undefined): string {
  // Handle edge cases: null, undefined, NaN
  const safePrice = typeof price === 'number' && !isNaN(price) ? price : 0;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safePrice);

  // Replace EUR with € symbol
  return formatted.replace('EUR', '€');
}

/**
 * Format mileage with km suffix
 * @param mileage - Mileage in kilometers
 * @returns Formatted mileage string (e.g., "42,500 km")
 */
export function formatMileage(mileage: number): string {
  return `${mileage.toLocaleString('en-US')} km`;
}

/**
 * Capitalize first letter of each word
 * @param text - Text to capitalize
 * @returns Capitalized text (e.g., "automatic" -> "Automatic", "petrol" -> "Petrol")
 */
export function capitalize(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
