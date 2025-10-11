import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

// Cache configuration
const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
};

// Performance cache with multiple layers
export class PerformanceCache {
  private redis: Redis | null = null;
  private memoryCache: Map<string, { value: any; expires: number }> = new Map();
  private readonly maxMemoryItems = 1000;

  constructor() {
    this.initializeRedis();
    this.startMemoryCacheCleanup();
  }

  private initializeRedis() {
    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        this.redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
      }
    } catch (error) {
      logger.error('Failed to initialize Redis:', error as Record<string, unknown>);
    }
  }

  // Memory cache cleanup
  private startMemoryCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.memoryCache.entries()) {
        if (item.expires < now) {
          this.memoryCache.delete(key);
        }
      }

      // Enforce max size
      if (this.memoryCache.size > this.maxMemoryItems) {
        const entriesToDelete = this.memoryCache.size - this.maxMemoryItems;
        const keys = Array.from(this.memoryCache.keys());
        for (let i = 0; i < entriesToDelete; i++) {
          this.memoryCache.delete(keys[i]);
        }
      }
    }, 60000); // Clean every minute
  }

  // Get from cache with fallback layers
  async get<T>(key: string): Promise<T | null> {
    // Level 1: Memory cache
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && memoryItem.expires > Date.now()) {
      return memoryItem.value as T;
    }

    // Level 2: Redis cache
    if (this.redis) {
      try {
        const value = await this.redis.get(key);
        if (value) {
          // Populate memory cache
          this.memoryCache.set(key, {
            value,
            expires: Date.now() + CACHE_TTL.SHORT * 1000,
          });
          return value as T;
        }
      } catch (error) {
        logger.error('Redis get error:', error as Record<string, unknown>);
      }
    }

    return null;
  }

  // Set in cache with TTL
  async set(
    key: string,
    value: any,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<void> {
    // Set in memory cache
    this.memoryCache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });

    // Set in Redis
    if (this.redis) {
      try {
        await this.redis.setex(key, ttl, JSON.stringify(value));
      } catch (error) {
        logger.error('Redis set error:', error as Record<string, unknown>);
      }
    }
  }

  // Delete from cache
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);

    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        logger.error('Redis delete error:', error as Record<string, unknown>);
      }
    }
  }

  // Clear pattern-based cache
  async clearPattern(pattern: string): Promise<void> {
    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from Redis
    if (this.redis) {
      try {
        const keys = await this.redis.keys(`*${pattern}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        logger.error('Redis clear pattern error:', error as Record<string, unknown>);
      }
    }
  }

  // Batch get
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const results: (T | null)[] = [];

    // Try memory cache first
    const missingKeys: string[] = [];
    for (const key of keys) {
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem && memoryItem.expires > Date.now()) {
        results.push(memoryItem.value as T);
      } else {
        missingKeys.push(key);
        results.push(null);
      }
    }

    // Fetch missing from Redis
    if (this.redis && missingKeys.length > 0) {
      try {
        const redisValues = await this.redis.mget(...missingKeys);
        let missingIndex = 0;
        for (let i = 0; i < results.length; i++) {
          if (results[i] === null && missingIndex < redisValues.length) {
            const value = redisValues[missingIndex++];
            if (value) {
              results[i] = value as T;
              // Populate memory cache
              this.memoryCache.set(keys[i], {
                value,
                expires: Date.now() + CACHE_TTL.SHORT * 1000,
              });
            }
          }
        }
      } catch (error) {
        logger.error('Redis mget error:', error as Record<string, unknown>);
      }
    }

    return results;
  }

  // Cache with computation
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Compute value
    const value = await compute();

    // Cache the result
    await this.set(key, value, ttl);

    return value;
  }

  // Stale-while-revalidate pattern
  async getStaleWhileRevalidate<T>(
    key: string,
    compute: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM,
    staleTtl: number = CACHE_TTL.LONG
  ): Promise<T> {
    const staleKey = `stale:${key}`;

    // Try to get fresh value
    const fresh = await this.get<T>(key);
    if (fresh !== null) {
      return fresh;
    }

    // Try to get stale value
    const stale = await this.get<T>(staleKey);
    if (stale !== null) {
      // Return stale value and revalidate in background
      compute()
        .then(async (value) => {
          await this.set(key, value, ttl);
          await this.set(staleKey, value, staleTtl);
        })
        .catch((error) => {
          logger.error('Background revalidation error:', error);
        });
      return stale;
    }

    // Compute and cache
    const value = await compute();
    await this.set(key, value, ttl);
    await this.set(staleKey, value, staleTtl);

    return value;
  }
}

// Export singleton instance
export const performanceCache = new PerformanceCache();

// Cache key generators
export const cacheKeys = {
  vehicle: (id: string) => `vehicle:${id}`,
  vehicles: (params: any) => `vehicles:${JSON.stringify(params)}`,
  vehicleImages: (id: string) => `vehicle-images:${id}`,
  featuredVehicles: () => 'featured-vehicles',
  vehicleCount: () => 'vehicle-count',
  searchResults: (query: string) => `search:${query}`,
  userFavorites: (userId: string) => `favorites:${userId}`,
  appointments: (date: string) => `appointments:${date}`,
};

// Export cache TTL
export { CACHE_TTL };