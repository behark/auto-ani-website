/**
 * Enterprise Multi-Level Caching Engine for AUTO ANI
 *
 * Implements a sophisticated 3-tier caching strategy:
 * - L1 Cache: In-memory LRU cache for ultra-fast access
 * - L2 Cache: Redis cluster for distributed caching
 * - L3 Cache: CDN integration for static content
 *
 * Features:
 * - Intelligent cache invalidation with dependency graphs
 * - Cache warming and prefetching strategies
 * - Performance monitoring and analytics
 * - Automatic cache key generation and versioning
 * - Circuit breaker pattern for cache failures
 * - Cache compression and serialization optimization
 */

import { LRUCache } from 'lru-cache';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { TraceManager, BusinessMetrics } from '@/lib/observability/telemetry';
import { gzip, gunzip } from 'node:zlib';
import { promisify } from 'node:util';
import crypto from 'node:crypto';

const compressAsync = promisify(gzip);
const decompressAsync = promisify(gunzip);

// Cache configuration
const CACHE_CONFIG = {
  // L1 Cache (Memory)
  l1: {
    maxSize: parseInt(process.env.L1_CACHE_MAX_SIZE || '100'), // MB
    maxAge: parseInt(process.env.L1_CACHE_MAX_AGE || '300000'), // 5 minutes
    maxItems: parseInt(process.env.L1_CACHE_MAX_ITEMS || '1000'),
    updateAgeOnGet: true,
    allowStale: false,
  },

  // L2 Cache (Redis)
  l2: {
    defaultTTL: parseInt(process.env.L2_CACHE_DEFAULT_TTL || '3600'), // 1 hour
    maxTTL: parseInt(process.env.L2_CACHE_MAX_TTL || '86400'), // 24 hours
    compressionThreshold: parseInt(process.env.L2_CACHE_COMPRESSION_THRESHOLD || '1024'), // 1KB
    keyPrefix: process.env.L2_CACHE_KEY_PREFIX || 'auto-ani:',
    enableCompression: process.env.L2_CACHE_COMPRESSION !== 'false',
  },

  // L3 Cache (CDN)
  l3: {
    enabled: process.env.CDN_CACHE_ENABLED === 'true',
    provider: process.env.CDN_PROVIDER || 'cloudflare', // cloudflare, cloudfront, fastly
    defaultTTL: parseInt(process.env.CDN_CACHE_DEFAULT_TTL || '3600'),
    maxTTL: parseInt(process.env.CDN_CACHE_MAX_TTL || '2592000'), // 30 days
  },

  // Performance settings
  performance: {
    batchInvalidationSize: parseInt(process.env.CACHE_BATCH_INVALIDATION_SIZE || '100'),
    warmupConcurrency: parseInt(process.env.CACHE_WARMUP_CONCURRENCY || '5'),
    circuitBreakerThreshold: parseInt(process.env.CACHE_CIRCUIT_BREAKER_THRESHOLD || '5'),
    circuitBreakerTimeout: parseInt(process.env.CACHE_CIRCUIT_BREAKER_TIMEOUT || '30000'),
  },
};

// Cache types for type safety
export type CacheLevel = 'L1' | 'L2' | 'L3' | 'ALL';
export type CacheStrategy = 'cache-first' | 'cache-last' | 'cache-only' | 'network-only';

export interface CacheOptions {
  ttl?: number;
  level?: CacheLevel;
  strategy?: CacheStrategy;
  tags?: string[];
  compress?: boolean;
  warmup?: boolean;
  version?: string;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  hitRate: number;
  averageResponseTime: number;
  totalRequests: number;
}

export interface CacheEntry<T = any> {
  data: T;
  metadata: {
    version: string;
    tags: string[];
    createdAt: number;
    accessedAt: number;
    accessCount: number;
    size: number;
    compressed: boolean;
  };
}

/**
 * Circuit Breaker for cache operations
 */
class CacheCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = CACHE_CONFIG.performance.circuitBreakerThreshold,
    private timeout: number = CACHE_CONFIG.performance.circuitBreakerTimeout
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T | null> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        return null; // Circuit is open, fail fast
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  getState(): string {
    return this.state;
  }
}

/**
 * Cache Dependency Graph for intelligent invalidation
 */
class CacheDependencyGraph {
  private dependencies = new Map<string, Set<string>>();
  private reverseDependencies = new Map<string, Set<string>>();

  /**
   * Add dependency relationship
   */
  addDependency(key: string, dependsOn: string): void {
    if (!this.dependencies.has(key)) {
      this.dependencies.set(key, new Set());
    }
    this.dependencies.get(key)!.add(dependsOn);

    if (!this.reverseDependencies.has(dependsOn)) {
      this.reverseDependencies.set(dependsOn, new Set());
    }
    this.reverseDependencies.get(dependsOn)!.add(key);
  }

  /**
   * Get all keys that depend on the given key
   */
  getDependents(key: string): Set<string> {
    const dependents = new Set<string>();

    const traverse = (currentKey: string) => {
      const directDependents = this.reverseDependencies.get(currentKey) || new Set();
      for (const dependent of directDependents) {
        if (!dependents.has(dependent)) {
          dependents.add(dependent);
          traverse(dependent); // Recursive traversal
        }
      }
    };

    traverse(key);
    return dependents;
  }

  /**
   * Remove all dependencies for a key
   */
  removeDependencies(key: string): void {
    const deps = this.dependencies.get(key) || new Set();
    for (const dep of deps) {
      this.reverseDependencies.get(dep)?.delete(key);
    }
    this.dependencies.delete(key);
    this.reverseDependencies.delete(key);
  }
}

/**
 * Multi-Level Cache Engine
 */
export class CacheEngine {
  private static instance: CacheEngine;

  // Cache layers
  private l1Cache: LRUCache<string, CacheEntry> = new LRUCache<string, CacheEntry>({
    max: CACHE_CONFIG.l1.maxItems,
    maxSize: CACHE_CONFIG.l1.maxSize * 1024 * 1024, // Convert MB to bytes
    ttl: CACHE_CONFIG.l1.maxAge,
    updateAgeOnGet: CACHE_CONFIG.l1.updateAgeOnGet,
    allowStale: CACHE_CONFIG.l1.allowStale
  });
  private l2CircuitBreaker: CacheCircuitBreaker;
  private dependencyGraph: CacheDependencyGraph;

  // Metrics tracking
  private metrics: Map<CacheLevel, CacheMetrics> = new Map();

  // Cache warming queue
  private warmupQueue: Set<string> = new Set();
  private isWarmingUp = false;
  private metricsReportingTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;

  private constructor() {
    this.initializeL1Cache();
    this.l2CircuitBreaker = new CacheCircuitBreaker();
    this.dependencyGraph = new CacheDependencyGraph();
    this.initializeMetrics();
    this.startMetricsReporting();
  }

  static getInstance(): CacheEngine {
    if (!CacheEngine.instance) {
      CacheEngine.instance = new CacheEngine();
    }
    return CacheEngine.instance;
  }

  /**
   * Initialize L1 (memory) cache
   */
  private initializeL1Cache(): void {
    const maxSize = CACHE_CONFIG.l1.maxSize * 1024 * 1024; // Convert MB to bytes

    this.l1Cache = new LRUCache<string, CacheEntry>({
      max: CACHE_CONFIG.l1.maxItems,
      maxSize,
      ttl: CACHE_CONFIG.l1.maxAge,
      updateAgeOnGet: CACHE_CONFIG.l1.updateAgeOnGet,
      allowStale: CACHE_CONFIG.l1.allowStale,
      sizeCalculation: (entry: CacheEntry) => entry.metadata.size,
      dispose: (entry: CacheEntry, key: string) => {
        logger.debug('L1 cache entry disposed', { key, size: entry.metadata.size });
      },
    });
  }

  /**
   * Initialize metrics tracking
   */
  private initializeMetrics(): void {
    const levels: CacheLevel[] = ['L1', 'L2', 'L3'];
    for (const level of levels) {
      this.metrics.set(level, {
        hits: 0,
        misses: 0,
        errors: 0,
        hitRate: 0,
        averageResponseTime: 0,
        totalRequests: 0,
      });
    }
  }

  /**
   * Start metrics reporting to observability system
   */
  private startMetricsReporting(): void {
    this.metricsReportingTimer = setInterval(() => {
      try {
        for (const [level, metrics] of this.metrics.entries()) {
          BusinessMetrics.cacheHitRate.record(metrics.hitRate, { level });

          // Reset counters for next interval
          metrics.hits = 0;
          metrics.misses = 0;
          metrics.errors = 0;
          metrics.totalRequests = 0;
        }
      } catch (error) {
        logger.error('Error in cache metrics reporting', {}, error instanceof Error ? error : undefined);
      }
    }, 60000); // Report every minute

    // Start periodic cleanup of dependency graph and cache
    this.cleanupTimer = setInterval(() => {
      this.performMemoryCleanup();
    }, 300000); // Cleanup every 5 minutes
  }

  /**
   * Generate cache key with version and tags
   */
  private generateCacheKey(key: string, options: CacheOptions = {}): string {
    const version = options.version || 'v1';
    const tags = options.tags ? options.tags.sort().join(',') : '';
    const hash = crypto.createHash('md5').update(`${key}:${version}:${tags}`).digest('hex').substring(0, 8);

    return `${CACHE_CONFIG.l2.keyPrefix}${key}:${version}:${hash}`;
  }

  /**
   * Compress data if it exceeds threshold
   */
  private async compressData(data: any): Promise<{ data: Buffer | string; compressed: boolean }> {
    const serialized = JSON.stringify(data);

    if (serialized.length > CACHE_CONFIG.l2.compressionThreshold && CACHE_CONFIG.l2.enableCompression) {
      try {
        const compressed = await compressAsync(Buffer.from(serialized));
        return { data: compressed, compressed: true };
      } catch (error) {
        logger.warn('Failed to compress cache data', { error: error instanceof Error ? error.message : 'Unknown' });
      }
    }

    return { data: serialized, compressed: false };
  }

  /**
   * Decompress data if needed
   */
  private async decompressData(data: Buffer | string, compressed: boolean): Promise<any> {
    if (compressed && Buffer.isBuffer(data)) {
      try {
        const decompressed = await decompressAsync(data);
        return JSON.parse(decompressed.toString());
      } catch (error) {
        logger.warn('Failed to decompress cache data', { error: error instanceof Error ? error.message : 'Unknown' });
        throw error;
      }
    }

    return JSON.parse(data as string);
  }

  /**
   * Get from L1 cache
   */
  private async getFromL1<T>(key: string): Promise<T | null> {
    const startTime = Date.now();

    try {
      const entry = this.l1Cache.get(key);
      const responseTime = Date.now() - startTime;

      if (entry) {
        entry.metadata.accessedAt = Date.now();
        entry.metadata.accessCount++;
        this.updateMetrics('L1', true, responseTime);
        return entry.data as T;
      }

      this.updateMetrics('L1', false, responseTime);
      return null;
    } catch (error) {
      this.updateMetrics('L1', false, Date.now() - startTime, true);
      logger.error('L1 cache get error', { key }, error instanceof Error ? error : undefined);
      return null;
    }
  }

  /**
   * Set to L1 cache
   */
  private async setToL1<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        metadata: {
          version: options.version || 'v1',
          tags: options.tags || [],
          createdAt: Date.now(),
          accessedAt: Date.now(),
          accessCount: 1,
          size: JSON.stringify(data).length,
          compressed: false,
        },
      };

      this.l1Cache.set(key, entry, { ttl: options.ttl });

      // Add dependencies
      if (options.tags) {
        for (const tag of options.tags) {
          this.dependencyGraph.addDependency(key, tag);
        }
      }
    } catch (error) {
      logger.error('L1 cache set error', { key }, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Get from L2 cache (Redis)
   */
  private async getFromL2<T>(key: string): Promise<T | null> {
    const startTime = Date.now();

    return this.l2CircuitBreaker.execute(async () => {
      try {
        const cached = await redis.get(key);
        const responseTime = Date.now() - startTime;

        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          const data = await this.decompressData(entry.data, entry.metadata.compressed);

          // Update access metadata
          entry.metadata.accessedAt = Date.now();
          entry.metadata.accessCount++;

          this.updateMetrics('L2', true, responseTime);
          return data as T;
        }

        this.updateMetrics('L2', false, responseTime);
        return null;
      } catch (error) {
        this.updateMetrics('L2', false, Date.now() - startTime, true);
        logger.error('L2 cache get error', { key }, error instanceof Error ? error : undefined);
        throw error;
      }
    });
  }

  /**
   * Set to L2 cache (Redis)
   */
  private async setToL2<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    await this.l2CircuitBreaker.execute(async () => {
      try {
        const { data: processedData, compressed } = await this.compressData(data);

        const entry: CacheEntry = {
          data: processedData,
          metadata: {
            version: options.version || 'v1',
            tags: options.tags || [],
            createdAt: Date.now(),
            accessedAt: Date.now(),
            accessCount: 1,
            size: Buffer.isBuffer(processedData) ? processedData.length : processedData.length,
            compressed,
          },
        };

        const ttl = Math.min(options.ttl || CACHE_CONFIG.l2.defaultTTL, CACHE_CONFIG.l2.maxTTL);
        await redis.setex(key, ttl, JSON.stringify(entry));

        // Add dependencies
        if (options.tags) {
          for (const tag of options.tags) {
            this.dependencyGraph.addDependency(key, tag);
          }
        }
      } catch (error) {
        logger.error('L2 cache set error', { key }, error instanceof Error ? error : undefined);
        throw error;
      }
    });
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(level: CacheLevel, hit: boolean, responseTime: number, error: boolean = false): void {
    const metrics = this.metrics.get(level);
    if (!metrics) return;

    metrics.totalRequests++;

    if (error) {
      metrics.errors++;
    } else if (hit) {
      metrics.hits++;
    } else {
      metrics.misses++;
    }

    metrics.hitRate = metrics.totalRequests > 0 ? (metrics.hits / metrics.totalRequests) * 100 : 0;
    metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2;
  }

  /**
   * GET operation with multi-level fallback
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const cacheKey = this.generateCacheKey(key, options);

    return TraceManager.executeWithSpan(
      'cache.get',
      async (span) => {
        span.setAttributes({
          'cache.key': key,
          'cache.strategy': options.strategy || 'cache-first',
          'cache.level': options.level || 'ALL',
        });

        try {
          // L1 Cache check
          if (!options.level || options.level === 'L1' || options.level === 'ALL') {
            const l1Result = await this.getFromL1<T>(cacheKey);
            if (l1Result !== null) {
              span.setAttributes({ 'cache.hit_level': 'L1' });
              return l1Result;
            }
          }

          // L2 Cache check
          if (!options.level || options.level === 'L2' || options.level === 'ALL') {
            const l2Result = await this.getFromL2<T>(cacheKey);
            if (l2Result !== null) {
              // Backfill L1 cache
              await this.setToL1(cacheKey, l2Result, options);
              span.setAttributes({ 'cache.hit_level': 'L2' });
              return l2Result;
            }
          }

          span.setAttributes({ 'cache.hit_level': 'none' });
          return null;

        } catch (error) {
          span.setAttributes({ 'cache.error': true });
          logger.error('Cache get operation failed', { key, cacheKey }, error instanceof Error ? error : undefined);
          return null;
        }
      },
      { attributes: { 'cache.operation': 'get' } }
    );
  }

  /**
   * SET operation with multi-level storage
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.generateCacheKey(key, options);

    return TraceManager.executeWithSpan(
      'cache.set',
      async (span) => {
        span.setAttributes({
          'cache.key': key,
          'cache.ttl': options.ttl || CACHE_CONFIG.l2.defaultTTL,
          'cache.level': options.level || 'ALL',
        });

        try {
          const promises: Promise<void>[] = [];

          // Set to L1 cache
          if (!options.level || options.level === 'L1' || options.level === 'ALL') {
            promises.push(this.setToL1(cacheKey, data, options));
          }

          // Set to L2 cache
          if (!options.level || options.level === 'L2' || options.level === 'ALL') {
            promises.push(this.setToL2(cacheKey, data, options));
          }

          await Promise.allSettled(promises);

          // Add to warmup queue if specified
          if (options.warmup) {
            this.warmupQueue.add(cacheKey);
          }

        } catch (error) {
          span.setAttributes({ 'cache.error': true });
          logger.error('Cache set operation failed', { key, cacheKey }, error instanceof Error ? error : undefined);
          throw error;
        }
      },
      { attributes: { 'cache.operation': 'set' } }
    );
  }

  /**
   * Intelligent cache invalidation by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    return TraceManager.executeWithSpan(
      'cache.invalidate_by_tags',
      async (span) => {
        span.setAttributes({
          'cache.tags': tags.join(','),
          'cache.operation': 'invalidate_by_tags',
        });

        try {
          const keysToInvalidate = new Set<string>();

          // Find all dependent keys
          for (const tag of tags) {
            const dependents = this.dependencyGraph.getDependents(tag);
            for (const dependent of dependents) {
              keysToInvalidate.add(dependent);
            }
          }

          span.setAttributes({ 'cache.keys_to_invalidate': keysToInvalidate.size });

          // Batch invalidation for performance
          const keyArray = Array.from(keysToInvalidate);
          const batches: string[][] = [];

          for (let i = 0; i < keyArray.length; i += CACHE_CONFIG.performance.batchInvalidationSize) {
            batches.push(keyArray.slice(i, i + CACHE_CONFIG.performance.batchInvalidationSize));
          }

          // Invalidate in parallel batches
          await Promise.allSettled(
            batches.map(batch => this.invalidateBatch(batch))
          );

          logger.info('Cache invalidation completed', {
            tags,
            keysInvalidated: keysToInvalidate.size,
            batches: batches.length,
          });

        } catch (error) {
          span.setAttributes({ 'cache.error': true });
          logger.error('Cache invalidation failed', { tags }, error instanceof Error ? error : undefined);
          throw error;
        }
      }
    );
  }

  /**
   * Invalidate a batch of cache keys
   */
  private async invalidateBatch(keys: string[]): Promise<void> {
    const promises: Promise<any>[] = [];

    // L1 invalidation
    for (const key of keys) {
      this.l1Cache.delete(key);
      this.dependencyGraph.removeDependencies(key);
    }

    // L2 invalidation
    if (keys.length > 0) {
      promises.push(
        this.l2CircuitBreaker.execute(async () => {
          await redis.del(...keys);
        })
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Get cache statistics
   */
  getStatistics(): {
    levels: Map<CacheLevel, CacheMetrics>;
    l1: {
      size: number;
      maxSize: number;
      itemCount: number;
      maxItems: number;
    };
    circuitBreaker: {
      state: string;
    };
    warmupQueue: number;
  } {
    return {
      levels: new Map(this.metrics),
      l1: {
        size: this.l1Cache.calculatedSize || 0,
        maxSize: CACHE_CONFIG.l1.maxSize * 1024 * 1024,
        itemCount: this.l1Cache.size,
        maxItems: CACHE_CONFIG.l1.maxItems,
      },
      circuitBreaker: {
        state: this.l2CircuitBreaker.getState(),
      },
      warmupQueue: this.warmupQueue.size,
    };
  }

  /**
   * Cache warming functionality
   */
  async warmupCache(warmupFunction: (key: string) => Promise<any>): Promise<void> {
    if (this.isWarmingUp || this.warmupQueue.size === 0) {
      return;
    }

    this.isWarmingUp = true;

    try {
      const keys = Array.from(this.warmupQueue);
      this.warmupQueue.clear();

      logger.info('Starting cache warmup', { keysToWarm: keys.length });

      // Process warmup keys in batches with concurrency limit
      const concurrency = CACHE_CONFIG.performance.warmupConcurrency;
      const batches: string[][] = [];

      for (let i = 0; i < keys.length; i += concurrency) {
        batches.push(keys.slice(i, i + concurrency));
      }

      for (const batch of batches) {
        await Promise.allSettled(
          batch.map(async (key) => {
            try {
              await warmupFunction(key);
            } catch (error) {
              logger.warn('Cache warmup failed for key', { key, error: error instanceof Error ? error.message : String(error) });
            }
          })
        );
      }

      logger.info('Cache warmup completed', { keysWarmed: keys.length });

    } finally {
      this.isWarmingUp = false;
    }
  }

  /**
   * Perform memory cleanup to prevent leaks
   */
  private performMemoryCleanup(): void {
    try {
      // Clear L1 cache if it's getting too large
      const currentSize = this.l1Cache.calculatedSize || 0;
      const maxSize = CACHE_CONFIG.l1.maxSize * 1024 * 1024;

      if (currentSize > maxSize * 0.9) { // If over 90% capacity
        logger.debug('L1 cache approaching limit, performing cleanup', {
          currentSize,
          maxSize,
          itemCount: this.l1Cache.size
        });
        // Clear oldest 20% of items
        const itemsToRemove = Math.floor(this.l1Cache.size * 0.2);
        let removed = 0;
        for (const key of this.l1Cache.keys()) {
          if (removed >= itemsToRemove) break;
          this.l1Cache.delete(key);
          removed++;
        }
      }

      // Cleanup warmup queue if it gets too large
      if (this.warmupQueue.size > 1000) {
        logger.debug('Warmup queue too large, clearing', { size: this.warmupQueue.size });
        this.warmupQueue.clear();
      }

      logger.debug('Cache memory cleanup completed', {
        l1Size: this.l1Cache.size,
        warmupQueueSize: this.warmupQueue.size
      });
    } catch (error) {
      logger.error('Error during cache memory cleanup', {}, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Stop cache engine and cleanup resources
   */
  stop(): void {
    // Clear timers
    if (this.metricsReportingTimer) {
      clearInterval(this.metricsReportingTimer);
      this.metricsReportingTimer = undefined;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    // Clear all caches and data structures
    this.l1Cache.clear();
    this.warmupQueue.clear();
    this.metrics.clear();

    // Clear dependency graph
    (this.dependencyGraph as any).dependencies?.clear();
    (this.dependencyGraph as any).reverseDependencies?.clear();

    logger.info('Cache engine stopped and memory cleared');
  }
}

// Export singleton instance
export const cacheEngine = CacheEngine.getInstance();

// Export configuration for reference
export { CACHE_CONFIG };