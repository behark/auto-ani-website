/**
 * Advanced Query Caching Layer for AUTO ANI
 *
 * Features:
 * - Redis-backed caching with TTL
 * - Tag-based cache invalidation
 * - Stale-while-revalidate pattern
 * - Automatic cache warming
 * - Performance monitoring
 */

import { redis } from '../redis';
import { logger } from '../logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  staleWhileRevalidate?: number; // Serve stale while revalidating
  tags?: string[]; // Cache tags for invalidation
  namespace?: string; // Cache namespace for organization
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  invalidations: number;
  hitRate: number;
}

export class QueryCache {
  private defaultTTL = 300; // 5 minutes
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
    hitRate: 0
  };

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);

      if (!data) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      this.stats.hits++;
      this.updateHitRate();
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || this.defaultTTL;
      const namespace = options.namespace || 'default';
      const namespacedKey = `${namespace}:${key}`;

      await redis.setex(namespacedKey, ttl, JSON.stringify(value));
      this.stats.sets++;

      // Store cache tags for invalidation
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await redis.sadd(`tag:${tag}`, namespacedKey);
          await redis.expire(`tag:${tag}`, ttl);
        }
      }

      logger.debug('Cache set', { key: namespacedKey, ttl, tags: options.tags });
    } catch (error) {
      logger.error('Cache set error', { key, error });
    }
  }

  /**
   * Invalidate cache by key or tag
   */
  async invalidate(keyOrTag: string, namespace = 'default'): Promise<void> {
    try {
      // Check if it's a tag
      const tagKeys = await redis.smembers(`tag:${keyOrTag}`);

      if (tagKeys.length > 0) {
        // Invalidate all keys with this tag
        await Promise.all(tagKeys.map((key: string) => redis.del(key)));
        await redis.del(`tag:${keyOrTag}`);
        this.stats.invalidations += tagKeys.length;
        logger.info('Cache tag invalidated', { tag: keyOrTag, keysInvalidated: tagKeys.length });
      } else {
        // Invalidate single key
        const namespacedKey = `${namespace}:${keyOrTag}`;
        await redis.del(namespacedKey);
        this.stats.invalidations++;
        logger.info('Cache key invalidated', { key: namespacedKey });
      }
    } catch (error) {
      logger.error('Cache invalidate error', { keyOrTag, error });
    }
  }

  /**
   * Get or fetch with caching (stale-while-revalidate pattern)
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const namespace = options.namespace || 'default';
    const namespacedKey = `${namespace}:${key}`;

    try {
      // Try to get from cache
      const cached = await this.get<T>(namespacedKey);

      if (cached !== null) {
        // If stale-while-revalidate is enabled, refresh in background
        if (options.staleWhileRevalidate) {
          this.revalidateInBackground(namespacedKey, fetcher, options);
        }
        return cached;
      }

      // Cache miss - fetch fresh data
      const data = await fetcher();
      await this.set(namespacedKey, data, options);
      return data;
    } catch (error) {
      logger.error('Cache getOrFetch error', { key: namespacedKey, error });

      // Try to return stale data if available
      const stale = await this.get<T>(namespacedKey);
      if (stale !== null) {
        logger.warn('Returning stale data due to error', { key: namespacedKey });
        return stale;
      }

      // If no stale data, fetch anyway
      return await fetcher();
    }
  }

  /**
   * Revalidate cache entry in background
   */
  private async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<void> {
    try {
      // Don't await - run in background
      setImmediate(async () => {
        const data = await fetcher();
        await this.set(key, data, options);
        logger.debug('Cache revalidated in background', { key });
      });
    } catch (error) {
      logger.error('Background revalidation error', { key, error });
    }
  }

  /**
   * Warm cache with data
   */
  async warm<T>(key: string, fetcher: () => Promise<T>, options: CacheOptions = {}): Promise<void> {
    try {
      const data = await fetcher();
      await this.set(key, data, options);
      logger.info('Cache warmed', { key });
    } catch (error) {
      logger.error('Cache warm error', { key, error });
    }
  }

  /**
   * Get multiple values at once
   */
  async getMany<T>(keys: string[], namespace = 'default'): Promise<Map<string, T | null>> {
    const result = new Map<string, T | null>();

    try {
      const namespacedKeys = keys.map(k => `${namespace}:${k}`);
      const values = await redis.mget(...namespacedKeys);

      keys.forEach((key, index) => {
        const value = values[index];
        if (value) {
          result.set(key, JSON.parse(value) as T);
          this.stats.hits++;
        } else {
          result.set(key, null);
          this.stats.misses++;
        }
      });

      this.updateHitRate();
    } catch (error) {
      logger.error('Cache getMany error', { keys, error });
    }

    return result;
  }

  /**
   * Set multiple values at once
   */
  async setMany<T>(entries: Map<string, T>, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || this.defaultTTL;
      const namespace = options.namespace || 'default';

      const pipeline = await redis.pipeline();

      entries.forEach((value, key) => {
        const namespacedKey = `${namespace}:${key}`;
        pipeline.setex(namespacedKey, ttl, JSON.stringify(value));
      });

      await pipeline.exec();
      this.stats.sets += entries.size;

      logger.debug('Cache setMany', { count: entries.size, ttl });
    } catch (error) {
      logger.error('Cache setMany error', { error });
    }
  }

  /**
   * Clear entire cache namespace
   */
  async clearNamespace(namespace: string): Promise<void> {
    try {
      const pattern = `${namespace}:*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
        this.stats.invalidations += keys.length;
        logger.info('Cache namespace cleared', { namespace, keysCleared: keys.length });
      }
    } catch (error) {
      logger.error('Cache clearNamespace error', { namespace, error });
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0,
      hitRate: 0
    };
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Check if cache is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await redis.ping();
      return true;
    } catch (error) {
      logger.error('Cache health check failed', { error });
      return false;
    }
  }
}

// Export singleton instance
export const queryCache = new QueryCache();

// Cache namespaces
export const CacheNamespaces = {
  VEHICLES: 'vehicles',
  VEHICLE_SEARCH: 'vehicle_search',
  FEATURED: 'featured',
  ANALYTICS: 'analytics',
  USER: 'user',
  SESSION: 'session'
} as const;

// Common cache TTLs
export const CacheTTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 1800,       // 30 minutes
  VERY_LONG: 3600,  // 1 hour
  DAY: 86400        // 24 hours
} as const;