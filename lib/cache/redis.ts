/**
 * Redis Caching Utilities
 * Provides high-performance caching with Redis
 */

import { createClient } from 'redis';

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  VEHICLES_LIST: 300, // 5 minutes
  VEHICLE_DETAIL: 600, // 10 minutes
  STATS: 60, // 1 minute
  SETTINGS: 3600, // 1 hour
  USER_SESSION: 86400, // 24 hours
  API_RESPONSE: 180, // 3 minutes
  FEATURED_VEHICLES: 600, // 10 minutes
  BLOG_POSTS: 1800, // 30 minutes
} as const;

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Initialize Redis client
 */
export async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Max reconnection attempts reached');
            return new Error('Redis: Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis: Connected successfully');
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis: Reconnecting...');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Redis: Failed to initialize client:', error);
    return null;
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Get cached data
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const data = await client.get(key);
    if (!data) return null;

    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Redis: Error getting cache for key ${key}:`, error);
    return null;
  }
}

/**
 * Set cached data
 */
export async function setCached<T>(
  key: string,
  data: T,
  ttl: number = CACHE_TTL.API_RESPONSE
): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    await client.setEx(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Redis: Error setting cache for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete cached data
 */
export async function deleteCached(key: string | string[]): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    if (Array.isArray(key)) {
      await client.del(key);
    } else {
      await client.del(key);
    }
    return true;
  } catch (error) {
    console.error(`Redis: Error deleting cache for key ${key}:`, error);
    return false;
  }
}

/**
 * Invalidate cache by pattern
 */
export async function invalidatePattern(pattern: string): Promise<number> {
  try {
    const client = await getRedisClient();
    if (!client) return 0;

    const keys = await client.keys(pattern);
    if (keys.length === 0) return 0;

    await client.del(keys);
    return keys.length;
  } catch (error) {
    console.error(`Redis: Error invalidating pattern ${pattern}:`, error);
    return 0;
  }
}

/**
 * Check if key exists in cache
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    console.error(`Redis: Error checking existence for key ${key}:`, error);
    return false;
  }
}

/**
 * Get or set cache (cache-aside pattern)
 */
export async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL.API_RESPONSE
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Store in cache (fire and forget)
  setCached(key, data, ttl).catch((error) => {
    console.error(`Redis: Error caching data for key ${key}:`, error);
  });

  return data;
}

/**
 * Cache wrapper for API routes
 */
export function withCache<T extends any[], R>(
  keyGenerator: (...args: T) => string,
  ttl: number = CACHE_TTL.API_RESPONSE
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: T): Promise<R> {
      const cacheKey = keyGenerator(...args);

      // Try cache first
      const cached = await getCached<R>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Cache the result
      await setCached(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Increment a counter in Redis
 */
export async function incrementCounter(key: string, amount: number = 1): Promise<number> {
  try {
    const client = await getRedisClient();
    if (!client) return 0;

    return await client.incrBy(key, amount);
  } catch (error) {
    console.error(`Redis: Error incrementing counter for key ${key}:`, error);
    return 0;
  }
}

/**
 * Set cache with tags for easier invalidation
 */
export async function setCachedWithTags<T>(
  key: string,
  data: T,
  tags: string[],
  ttl: number = CACHE_TTL.API_RESPONSE
): Promise<boolean> {
  try {
    // Set the main cache
    await setCached(key, data, ttl);

    // Add to tag sets
    const client = await getRedisClient();
    if (!client) return false;

    for (const tag of tags) {
      await client.sAdd(`tag:${tag}`, key);
      await client.expire(`tag:${tag}`, ttl);
    }

    return true;
  } catch (error) {
    console.error(`Redis: Error setting cache with tags for key ${key}:`, error);
    return false;
  }
}

/**
 * Invalidate cache by tag
 */
export async function invalidateByTag(tag: string): Promise<number> {
  try {
    const client = await getRedisClient();
    if (!client) return 0;

    // Get all keys with this tag
    const keys = await client.sMembers(`tag:${tag}`);
    if (keys.length === 0) return 0;

    // Delete all keys
    await client.del(keys);

    // Delete the tag set
    await client.del(`tag:${tag}`);

    return keys.length;
  } catch (error) {
    console.error(`Redis: Error invalidating by tag ${tag}:`, error);
    return 0;
  }
}

/**
 * Health check for Redis
 */
export async function redisHealthCheck(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const ping = await client.ping();
    return ping === 'PONG';
  } catch (error) {
    console.error('Redis: Health check failed:', error);
    return false;
  }
}