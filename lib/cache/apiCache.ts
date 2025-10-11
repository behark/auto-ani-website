/**
 * API Response Caching Layer for AUTO ANI Website
 *
 * Features:
 * - Generic API response caching with TTL
 * - Request-based cache keys
 * - Cache invalidation strategies
 * - Conditional caching based on response status
 * - Cache compression for large responses
 * - Performance monitoring
 */

import { redis } from '../redis';
import { logger } from '../logger';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Cache TTL configurations for different types of API responses (in seconds)
export const API_CACHE_TTL = {
  STATIC_DATA: 3600,        // 1 hour - config, settings, etc.
  VEHICLE_DATA: 300,        // 5 minutes - vehicle listings, details
  SEARCH_RESULTS: 180,      // 3 minutes - search, filters
  USER_DATA: 60,            // 1 minute - user-specific data
  DYNAMIC_DATA: 30,         // 30 seconds - frequently changing data
  ANALYTICS: 900,           // 15 minutes - analytics data
  EXTERNAL_API: 1800,       // 30 minutes - third-party API responses
} as const;

// Cache key prefixes
export const API_CACHE_KEYS = {
  API_RESPONSE: 'api:response',
  API_COUNT: 'api:count',
  API_METADATA: 'api:metadata',
} as const;

export interface CacheOptions {
  ttl?: number;
  compress?: boolean;
  tags?: string[];
  bypassCache?: boolean;
  cacheHeaders?: boolean;
  maxSize?: number; // Maximum response size to cache (bytes)
}

export interface CachedApiResponse {
  data: any;
  status: number;
  headers?: Record<string, string>;
  timestamp: number;
  compressed?: boolean;
  size: number;
  tags?: string[];
}

export interface ApiCacheMetrics {
  hits: number;
  misses: number;
  writes: number;
  invalidations: number;
  errors: number;
  totalResponseTime: number;
  averageResponseTime: number;
  compressionSavings: number;
}

class ApiCacheService {
  private metrics: ApiCacheMetrics = {
    hits: 0,
    misses: 0,
    writes: 0,
    invalidations: 0,
    errors: 0,
    totalResponseTime: 0,
    averageResponseTime: 0,
    compressionSavings: 0
  };

  private readonly MAX_CACHE_SIZE = 1024 * 1024; // 1MB default max size
  private readonly COMPRESSION_THRESHOLD = 1024; // 1KB - compress responses larger than this

  /**
   * Generate cache key from request information
   */
  private generateCacheKey(
    path: string,
    method: string = 'GET',
    params?: Record<string, any>,
    userId?: string
  ): string {
    const keyParts = [
      API_CACHE_KEYS.API_RESPONSE,
      method.toLowerCase(),
      path.replace(/^\/api\//, '').replace(/\//g, ':')
    ];

    // Add parameters if provided
    if (params && Object.keys(params).length > 0) {
      const sortedParams = Object.keys(params)
        .sort()
        .reduce((acc, key) => {
          if (params[key] !== undefined && params[key] !== null) {
            acc[key] = params[key];
          }
          return acc;
        }, {} as Record<string, any>);

      const paramString = Object.entries(sortedParams)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

      if (paramString) {
        keyParts.push(Buffer.from(paramString).toString('base64'));
      }
    }

    // Add user ID for user-specific caching
    if (userId) {
      keyParts.push(`user:${userId}`);
    }

    return keyParts.join(':');
  }

  /**
   * Compress data if it exceeds threshold
   */
  private async compressData(data: string): Promise<{ data: string; compressed: boolean; savings: number }> {
    if (data.length < this.COMPRESSION_THRESHOLD) {
      return { data, compressed: false, savings: 0 };
    }

    try {
      // Use Buffer-based compression for Node.js environment
      const compressed = Buffer.from(data, 'utf8').toString('base64');
      const savings = data.length - compressed.length;

      // Only use compression if it actually saves space
      if (savings > 0) {
        this.metrics.compressionSavings += savings;
        return { data: compressed, compressed: true, savings };
      }

      return { data, compressed: false, savings: 0 };
    } catch (error) {
      logger.error('Compression failed', { error });
      return { data, compressed: false, savings: 0 };
    }
  }

  /**
   * Decompress data if it was compressed
   */
  private async decompressData(data: string, compressed: boolean): Promise<string> {
    if (!compressed) {
      return data;
    }

    try {
      return Buffer.from(data, 'base64').toString('utf8');
    } catch (error) {
      logger.error('Decompression failed', { error });
      return data;
    }
  }

  /**
   * Cache API response
   */
  async cacheResponse(
    path: string,
    method: string,
    response: any,
    status: number = 200,
    options: CacheOptions = {}
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const {
        ttl = API_CACHE_TTL.DYNAMIC_DATA,
        compress = true,
        tags = [],
        maxSize = this.MAX_CACHE_SIZE,
        cacheHeaders = false
      } = options;

      // Don't cache error responses (except for specific cases)
      if (status >= 400 && status !== 404) {
        return;
      }

      const responseData = JSON.stringify(response);

      // Check response size
      if (responseData.length > maxSize) {
        logger.warn('Response too large to cache', {
          path,
          size: responseData.length,
          maxSize
        });
        return;
      }

      const cacheKey = this.generateCacheKey(path, method);

      // Compress if enabled and beneficial
      const compressionResult = compress
        ? await this.compressData(responseData)
        : { data: responseData, compressed: false, savings: 0 };

      const cachedResponse: CachedApiResponse = {
        data: compressionResult.data,
        status,
        timestamp: Date.now(),
        compressed: compressionResult.compressed,
        size: responseData.length,
        tags
      };

      // Add headers if requested
      if (cacheHeaders) {
        cachedResponse.headers = {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${ttl}`,
          'X-Cache-Status': 'MISS'
        };
      }

      await redis.setex(cacheKey, ttl, JSON.stringify(cachedResponse));
      this.metrics.writes++;

      const responseTime = Date.now() - startTime;
      this.metrics.totalResponseTime += responseTime;
      this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.writes;

      // Cache metadata for invalidation
      if (tags.length > 0) {
        await this.cacheMetadata(cacheKey, tags, ttl);
      }

      logger.debug('API response cached', {
        path,
        method,
        cacheKey: cacheKey.substring(0, 50) + '...',
        size: responseData.length,
        compressed: compressionResult.compressed,
        savings: compressionResult.savings,
        ttl,
        responseTime
      });

    } catch (error) {
      this.metrics.errors++;
      logger.error('Failed to cache API response', {
        error: error instanceof Error ? error.message : String(error),
        path,
        method
      });
    }
  }

  /**
   * Get cached API response
   */
  async getCachedResponse(
    path: string,
    method: string = 'GET',
    params?: Record<string, any>,
    userId?: string
  ): Promise<{ data: any; status: number; headers?: Record<string, string> } | null> {
    const startTime = Date.now();

    try {
      const cacheKey = this.generateCacheKey(path, method, params, userId);
      const cached = await redis.get(cacheKey);

      if (!cached) {
        this.metrics.misses++;
        return null;
      }

      const cachedResponse: CachedApiResponse = JSON.parse(cached);

      // Decompress if needed
      const responseData = await this.decompressData(cachedResponse.data, cachedResponse.compressed || false);
      const data = JSON.parse(responseData);

      this.metrics.hits++;

      const responseTime = Date.now() - startTime;
      this.metrics.totalResponseTime += responseTime;

      // Add cache hit headers if headers were cached
      const headers = cachedResponse.headers ? {
        ...cachedResponse.headers,
        'X-Cache-Status': 'HIT',
        'X-Cache-Age': Math.floor((Date.now() - cachedResponse.timestamp) / 1000).toString()
      } : undefined;

      logger.debug('API response cache hit', {
        path,
        method,
        age: Date.now() - cachedResponse.timestamp,
        size: cachedResponse.size,
        compressed: cachedResponse.compressed,
        responseTime
      });

      return {
        data,
        status: cachedResponse.status,
        headers
      };

    } catch (error) {
      this.metrics.errors++;
      this.metrics.misses++;
      logger.error('Failed to get cached API response', {
        error: error instanceof Error ? error.message : String(error),
        path,
        method
      });
      return null;
    }
  }

  /**
   * Cache metadata for tag-based invalidation
   */
  private async cacheMetadata(cacheKey: string, tags: string[], ttl: number): Promise<void> {
    try {
      for (const tag of tags) {
        const metaKey = `${API_CACHE_KEYS.API_METADATA}:${tag}`;

        // Get existing keys for this tag
        const existing = await redis.get(metaKey);
        const keys = existing ? JSON.parse(existing) : [];

        if (!keys.includes(cacheKey)) {
          keys.push(cacheKey);
          await redis.setex(metaKey, ttl + 300, JSON.stringify(keys)); // 5 minutes longer than cache
        }
      }
    } catch (error) {
      logger.error('Failed to cache metadata', { error, tags });
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    const startTime = Date.now();

    try {
      const keysToDelete: string[] = [];

      for (const tag of tags) {
        const metaKey = `${API_CACHE_KEYS.API_METADATA}:${tag}`;
        const keys = await redis.get(metaKey);

        if (keys) {
          const parsedKeys = JSON.parse(keys);
          keysToDelete.push(...parsedKeys, metaKey);
        }
      }

      if (keysToDelete.length > 0) {
        await redis.del(...keysToDelete);
        this.metrics.invalidations += keysToDelete.length;
      }

      const responseTime = Date.now() - startTime;

      logger.info('Cache invalidated by tags', {
        tags,
        deletedKeys: keysToDelete.length,
        responseTime
      });

    } catch (error) {
      this.metrics.errors++;
      logger.error('Failed to invalidate cache by tags', {
        error: error instanceof Error ? error.message : String(error),
        tags
      });
    }
  }

  /**
   * Invalidate specific cache entry
   */
  async invalidateResponse(
    path: string,
    method: string = 'GET',
    params?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(path, method, params, userId);
      await redis.del(cacheKey);
      this.metrics.invalidations++;

      logger.debug('Cache entry invalidated', {
        path,
        method,
        cacheKey: cacheKey.substring(0, 50) + '...'
      });

    } catch (error) {
      this.metrics.errors++;
      logger.error('Failed to invalidate cache entry', {
        error: error instanceof Error ? error.message : String(error),
        path,
        method
      });
    }
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics(): ApiCacheMetrics & { hitRatio: number } {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRatio = totalRequests > 0 ? this.metrics.hits / totalRequests : 0;

    return {
      ...this.metrics,
      hitRatio
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      writes: 0,
      invalidations: 0,
      errors: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      compressionSavings: 0
    };
  }
}

// Export singleton instance
export const apiCache = new ApiCacheService();

/**
 * Higher-level cache middleware for API routes
 */
export function withApiCache(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  options: CacheOptions = {}
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const { pathname, searchParams } = req.nextUrl;
    const method = req.method;

    // Skip caching for non-GET requests unless explicitly enabled
    if (method !== 'GET' && !options.bypassCache) {
      return handler(req, context);
    }

    // Check cache first
    const params = Object.fromEntries(searchParams.entries());
    const cached = await apiCache.getCachedResponse(pathname, method, params);

    if (cached && !options.bypassCache) {
      const response = NextResponse.json(cached.data, { status: cached.status });

      if (cached.headers) {
        Object.entries(cached.headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      return response;
    }

    // Execute handler
    const response = await handler(req, context);

    // Cache successful responses
    if (response.ok) {
      try {
        const responseData = await response.json();
        await apiCache.cacheResponse(pathname, method, responseData, response.status, options);

        // Return new response with cached data
        const newResponse = NextResponse.json(responseData, { status: response.status });

        if (options.cacheHeaders) {
          newResponse.headers.set('X-Cache-Status', 'MISS');
          newResponse.headers.set('Cache-Control', `public, max-age=${options.ttl || API_CACHE_TTL.DYNAMIC_DATA}`);
        }

        return newResponse;
      } catch (error) {
        logger.error('Failed to process response for caching', { error });
        return response;
      }
    }

    return response;
  };
}

/**
 * Cache wrapper for async functions
 */
export async function withCache<T>(
  key: string,
  fallbackFunction: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cached = await apiCache.getCachedResponse(key, 'GET');

  if (cached && !options.bypassCache) {
    return cached.data as T;
  }

  const fresh = await fallbackFunction();
  await apiCache.cacheResponse(key, 'GET', fresh, 200, options);

  return fresh;
}

export default apiCache;