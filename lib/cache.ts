// Enhanced caching utility for AUTO ANI Website
// Provides a simple interface for caching database queries and API responses

import { redis } from './redis'
import { logger } from './logger'

export interface CacheOptions {
  ttl?: number // Time to live in seconds (default: 300 = 5 minutes)
  prefix?: string // Key prefix (default: 'cache')
  tags?: string[] // Cache tags for invalidation
}

// Default cache options
const DEFAULT_OPTIONS: Required<CacheOptions> = {
  ttl: 300, // 5 minutes
  prefix: 'cache',
  tags: []
}

/**
 * Cached query wrapper - caches the result of a function
 * @param key - Cache key
 * @param fetcher - Function that returns the data to cache
 * @param options - Cache options
 */
export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const cacheKey = `${opts.prefix}:${key}`

  try {
    // Try to get cached result
    const cached = await redis.get(cacheKey)
    if (cached) {
      try {
        const parsedResult = JSON.parse(cached) as T
        logger.debug('Cache hit', { key: cacheKey })
        return parsedResult
      } catch (parseError) {
        logger.warn('Failed to parse cached data, removing invalid cache', {
          key: cacheKey,
          error: parseError instanceof Error ? parseError.message : String(parseError)
        })
        await redis.delete(cacheKey)
      }
    }
  } catch (error) {
    logger.error('Cache read failed', {
      key: cacheKey,
      error: error instanceof Error ? error.message : String(error)
    })
  }

  // Cache miss - fetch data
  logger.debug('Cache miss', { key: cacheKey })
  const data = await fetcher()

  // Store in cache
  try {
    await redis.setex(cacheKey, opts.ttl, JSON.stringify(data))

    // Store tags for invalidation
    if (opts.tags.length > 0) {
      await Promise.all(
        opts.tags.map(tag => redis.sadd(`tag:${tag}`, cacheKey))
      )
    }

    logger.debug('Data cached', { key: cacheKey, ttl: opts.ttl, tags: opts.tags })
  } catch (error) {
    logger.error('Cache write failed', {
      key: cacheKey,
      error: error instanceof Error ? error.message : String(error)
    })
  }

  return data
}

/**
 * Invalidate cache by key or pattern
 * @param keyOrPattern - Cache key or pattern (with *)
 */
export async function invalidateCache(keyOrPattern: string): Promise<void> {
  try {
    if (keyOrPattern.includes('*')) {
      // Pattern invalidation
      const keys = await redis.keys(keyOrPattern)
      if (keys.length > 0) {
        await redis.del(...keys)
        logger.info('Cache invalidated by pattern', { pattern: keyOrPattern, count: keys.length })
      }
    } else {
      // Single key invalidation
      await redis.delete(keyOrPattern)
      logger.debug('Cache invalidated', { key: keyOrPattern })
    }
  } catch (error) {
    logger.error('Cache invalidation failed', {
      keyOrPattern,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

/**
 * Invalidate cache by tag
 * @param tag - Cache tag
 */
export async function invalidateCacheByTag(tag: string): Promise<void> {
  try {
    const keys = await redis.smembers(`tag:${tag}`)
    if (keys.length > 0) {
      await redis.del(...keys)
      await redis.delete(`tag:${tag}`)
      logger.info('Cache invalidated by tag', { tag, count: keys.length })
    }
  } catch (error) {
    logger.error('Cache tag invalidation failed', {
      tag,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

/**
 * Pre-built cache functions for common queries
 */
export const CacheService = {
  /**
   * Cache vehicles list
   */
  vehicles: {
    all: (filters?: Record<string, any>) => {
      const filterKey = filters ? JSON.stringify(filters).replace(/[^a-zA-Z0-9]/g, '') : 'all'
      return `vehicles:list:${filterKey}`
    },
    byId: (id: string) => `vehicles:detail:${id}`,
    featured: () => 'vehicles:featured',
    count: (filters?: Record<string, any>) => {
      const filterKey = filters ? JSON.stringify(filters).replace(/[^a-zA-Z0-9]/g, '') : 'all'
      return `vehicles:count:${filterKey}`
    }
  },

  /**
   * Cache appointments
   */
  appointments: {
    byUser: (userId: string) => `appointments:user:${userId}`,
    upcoming: () => 'appointments:upcoming',
    today: () => 'appointments:today'
  },

  /**
   * Cache contacts and inquiries
   */
  contacts: {
    recent: () => 'contacts:recent',
    byStatus: (status: string) => `contacts:status:${status}`
  },

  /**
   * Cache analytics data
   */
  analytics: {
    dashboard: () => 'analytics:dashboard',
    vehicleViews: () => 'analytics:vehicle-views',
    monthlyStats: (year: number, month: number) => `analytics:monthly:${year}-${month}`,
    dailyStats: (date: string) => `analytics:daily:${date}`
  },

  /**
   * Cache testimonials
   */
  testimonials: {
    approved: () => 'testimonials:approved',
    byVehicle: (vehicleId: string) => `testimonials:vehicle:${vehicleId}`,
    recent: () => 'testimonials:recent'
  }
}

/**
 * Cache tags for easy invalidation
 */
export const CacheTags = {
  VEHICLES: 'vehicles',
  APPOINTMENTS: 'appointments',
  CONTACTS: 'contacts',
  TESTIMONIALS: 'testimonials',
  ANALYTICS: 'analytics',
  USER_DATA: 'user-data'
}

/**
 * Invalidate multiple cache patterns
 * @param patterns - Array of cache patterns to invalidate
 */
export async function invalidateMultiple(patterns: string[]): Promise<void> {
  await Promise.all(patterns.map(pattern => invalidateCache(pattern)))
}

/**
 * Warm up cache with fresh data
 * @param key - Cache key
 * @param fetcher - Function to fetch fresh data
 * @param options - Cache options
 */
export async function warmCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<void> {
  try {
    const data = await fetcher()
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const cacheKey = `${opts.prefix}:${key}`

    await redis.setex(cacheKey, opts.ttl, JSON.stringify(data))
    logger.info('Cache warmed', { key: cacheKey })
  } catch (error) {
    logger.error('Cache warm-up failed', {
      key,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  keys: number
  memoryMode: boolean
  healthCheck: any
}> {
  try {
    const [allKeys, healthCheck] = await Promise.all([
      redis.keys('*'),
      redis.healthCheck()
    ])

    return {
      keys: allKeys.length,
      memoryMode: healthCheck.mode === 'memory',
      healthCheck
    }
  } catch (error) {
    logger.error('Failed to get cache stats', {
      error: error instanceof Error ? error.message : String(error)
    })
    return {
      keys: 0,
      memoryMode: true,
      healthCheck: { healthy: false, mode: 'memory', circuitBreaker: 'UNKNOWN' }
    }
  }
}

// Export commonly used cache helpers
export { redis } from './redis'