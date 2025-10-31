/**
 * Application-wide constants for AUTO ANI Website
 * Centralizes magic numbers and configuration values
 */

/**
 * Time constants (in milliseconds and seconds)
 */
export const TIME = {
  // Milliseconds
  ONE_SECOND_MS: 1000,
  ONE_MINUTE_MS: 60 * 1000,
  FIVE_MINUTES_MS: 5 * 60 * 1000,
  TEN_MINUTES_MS: 10 * 60 * 1000,
  ONE_HOUR_MS: 60 * 60 * 1000,
  ONE_DAY_MS: 24 * 60 * 60 * 1000,
  ONE_WEEK_MS: 7 * 24 * 60 * 60 * 1000,
  ONE_YEAR_MS: 365 * 24 * 60 * 60 * 1000,

  // Seconds
  ONE_MINUTE_SECONDS: 60,
  FIVE_MINUTES_SECONDS: 300,
  ONE_HOUR_SECONDS: 3600,
  ONE_DAY_SECONDS: 86400,
  ONE_WEEK_SECONDS: 604800,
  ONE_YEAR_SECONDS: 31536000,
} as const;

/**
 * API Rate Limiting
 */
export const RATE_LIMIT = {
  // Vehicles API
  VEHICLES_MAX_REQUESTS: 100,
  VEHICLES_WINDOW_MS: TIME.ONE_MINUTE_MS,

  // General API
  DEFAULT_MAX_REQUESTS: 60,
  DEFAULT_WINDOW_MS: TIME.ONE_MINUTE_MS,

  // Strict endpoints
  AUTH_MAX_REQUESTS: 5,
  AUTH_WINDOW_MS: TIME.FIVE_MINUTES_MS,
} as const;

/**
 * Cache durations
 */
export const CACHE = {
  // ISR (Incremental Static Regeneration)
  REVALIDATION_TIME: TIME.ONE_DAY_SECONDS, // 24 hours

  // API Cache Headers
  API_CACHE_SHORT: TIME.FIVE_MINUTES_SECONDS, // 5 minutes
  API_CACHE_MEDIUM: TIME.ONE_HOUR_SECONDS, // 1 hour
  API_CACHE_LONG: TIME.ONE_DAY_SECONDS, // 24 hours

  // Static assets
  STATIC_ASSETS_TTL: TIME.ONE_YEAR_SECONDS, // 1 year

  // Health check
  HEALTH_CHECK_TTL: 30, // 30 seconds
} as const;

/**
 * Timeouts
 */
export const TIMEOUT = {
  // API timeouts
  API_DEFAULT: 30000, // 30 seconds
  SANITY_FETCH: 60000, // 60 seconds
  HEALTH_CHECK: 5000, // 5 seconds

  // UI timeouts
  DEBOUNCE_SEARCH: 300, // 300ms for search input
  DEBOUNCE_FILTER: 200, // 200ms for filters
  TOAST_DURATION: 4000, // 4 seconds for notifications
} as const;

/**
 * Pagination
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 100,
  FEATURED_VEHICLES_LIMIT: 6,
  RECENT_VEHICLES_LIMIT: 8,
  RELATED_VEHICLES_LIMIT: 4,
} as const;

/**
 * Form validation
 */
export const VALIDATION = {
  // Text lengths
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_MESSAGE_LENGTH: 10,
  MAX_MESSAGE_LENGTH: 1000,
  MIN_SEARCH_LENGTH: 2,

  // Numeric ranges
  MIN_PRICE: 0,
  MAX_PRICE: 1000000,
  MIN_YEAR: 1990,
  MAX_YEAR: new Date().getFullYear() + 1,
  MIN_MILEAGE: 0,
  MAX_MILEAGE: 500000,

  // File uploads
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

/**
 * Sanity CMS
 */
export const SANITY = {
  API_VERSION: '2024-01-01',
  CDN_ENABLED: true,
  RETRIES: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
  },
  IMAGE_BLUR_AMOUNT: 10,
} as const;

/**
 * SEO Configuration
 */
export const SEO = {
  DEFAULT_TITLE_TEMPLATE: '%s | AUTO ANI',
  DEFAULT_DESCRIPTION_LENGTH: 160,
  DEFAULT_KEYWORDS_COUNT: 10,
  OG_IMAGE_WIDTH: 1200,
  OG_IMAGE_HEIGHT: 630,
} as const;

/**
 * UI Constants
 */
export const UI = {
  // Animation durations (in ms)
  ANIMATION_FAST: 200,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,

  // Z-index layers
  Z_INDEX: {
    DROPDOWN: 50,
    MODAL_BACKDROP: 100,
    MODAL: 101,
    NOTIFICATION: 200,
    TOOLTIP: 300,
    FLOATING_BUTTON: 400,
  },

  // Breakpoints (matching Tailwind)
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },
} as const;

/**
 * WhatsApp Configuration
 */
export const WHATSAPP = {
  DEFAULT_MESSAGE: 'Përshëndetje, jam i/e interesuar për një veturë nga AUTO ANI.',
  VEHICLE_MESSAGE_TEMPLATE: 'Përshëndetje, jam i/e interesuar për {brand} {model} {year}.',
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  GENERIC: 'Diçka shkoi keq. Ju lutem provoni përsëri.',
  NETWORK: 'Gabim në lidhje. Kontrolloni internetin tuaj.',
  NOT_FOUND: 'Nuk u gjet.',
  VALIDATION: 'Ju lutem kontrolloni të dhënat tuaja.',
  RATE_LIMIT: 'Shumë kërkesa. Ju lutem prisni pak.',
  SERVER: 'Gabim në server. Ju lutem provoni më vonë.',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  FORM_SUBMITTED: 'Forma u dërgua me sukses!',
  MESSAGE_SENT: 'Mesazhi u dërgua me sukses!',
  SAVED: 'Të dhënat u ruajtën me sukses!',
  COPIED: 'U kopjua në clipboard!',
} as const;

/**
 * Helper function to get revalidation time for pages
 */
export function getRevalidationTime(): number {
  return CACHE.REVALIDATION_TIME;
}

/**
 * Helper function to format cache control header
 */
export function getCacheControlHeader(
  maxAge: number = CACHE.API_CACHE_SHORT,
  staleWhileRevalidate: number = maxAge * 2
): string {
  return `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
}

/**
 * Helper function to check if a year is valid
 */
export function isValidVehicleYear(year: number): boolean {
  return year >= VALIDATION.MIN_YEAR && year <= VALIDATION.MAX_YEAR;
}

/**
 * Helper function to check if a price is valid
 */
export function isValidPrice(price: number): boolean {
  return price >= VALIDATION.MIN_PRICE && price <= VALIDATION.MAX_PRICE;
}

/**
 * Export all constants as default
 */
export default {
  TIME,
  RATE_LIMIT,
  CACHE,
  TIMEOUT,
  PAGINATION,
  VALIDATION,
  SANITY,
  SEO,
  UI,
  WHATSAPP,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};