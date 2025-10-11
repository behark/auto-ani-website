/**
 * Enterprise API Response Optimization Engine for AUTO ANI
 *
 * Provides comprehensive API performance optimization with:
 * - Response compression (gzip, brotli, deflate)
 * - ETags and conditional requests
 * - Response streaming for large datasets
 * - Content delivery optimization
 * - API response caching with intelligent invalidation
 * - Request/response size optimization
 * - Bandwidth usage monitoring and optimization
 *
 * Integrates with Next.js API routes for seamless optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { cacheEngine } from './cache-engine';
import { TraceManager } from '@/lib/observability/telemetry';
import { metricsCollector } from '@/lib/observability/metrics-collector';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
import crypto from 'node:crypto';

const compressAsync = promisify(gzip);

// API optimization configuration
const API_OPTIMIZER_CONFIG = {
  compression: {
    enabled: process.env.API_COMPRESSION_ENABLED !== 'false',
    algorithms: ['br', 'gzip', 'deflate'] as const,
    threshold: parseInt(process.env.API_COMPRESSION_THRESHOLD || '1024'), // 1KB
    level: parseInt(process.env.API_COMPRESSION_LEVEL || '6'), // Balanced compression
    chunkSize: parseInt(process.env.API_COMPRESSION_CHUNK_SIZE || '8192'), // 8KB
  },

  caching: {
    enabled: process.env.API_CACHE_ENABLED !== 'false',
    defaultTTL: parseInt(process.env.API_CACHE_DEFAULT_TTL || '300'), // 5 minutes
    maxAge: parseInt(process.env.API_CACHE_MAX_AGE || '3600'), // 1 hour
    staleWhileRevalidate: parseInt(process.env.API_CACHE_SWR || '86400'), // 24 hours
    etagEnabled: process.env.API_ETAG_ENABLED !== 'false',
  },

  streaming: {
    enabled: process.env.API_STREAMING_ENABLED === 'true',
    threshold: parseInt(process.env.API_STREAMING_THRESHOLD || '10000'), // 10KB
    chunkSize: parseInt(process.env.API_STREAMING_CHUNK_SIZE || '8192'), // 8KB
  },

  optimization: {
    enabled: process.env.API_OPTIMIZATION_ENABLED !== 'false',
    removeNullValues: process.env.API_REMOVE_NULL_VALUES === 'true',
    minifyJson: process.env.API_MINIFY_JSON === 'true',
    fieldFiltering: process.env.API_FIELD_FILTERING_ENABLED === 'true',
    responseTransformation: process.env.API_RESPONSE_TRANSFORMATION_ENABLED === 'true',
  },

  monitoring: {
    enabled: process.env.API_MONITORING_ENABLED !== 'false',
    trackResponseSizes: process.env.API_TRACK_RESPONSE_SIZES !== 'false',
    trackCompressionRatio: process.env.API_TRACK_COMPRESSION_RATIO !== 'false',
    trackCacheHitRates: process.env.API_TRACK_CACHE_HIT_RATES !== 'false',
  },

  security: {
    corsEnabled: process.env.API_CORS_ENABLED !== 'false',
    rateLimitingEnabled: process.env.API_RATE_LIMITING_ENABLED === 'true',
    requestSizeLimit: parseInt(process.env.API_REQUEST_SIZE_LIMIT || '10485760'), // 10MB
    maxRequestsPerMinute: parseInt(process.env.API_MAX_REQUESTS_PER_MINUTE || '100'),
  },
};

// Response optimization types
export interface OptimizationOptions {
  compress?: boolean;
  cache?: boolean;
  stream?: boolean;
  etag?: boolean;
  fields?: string[];
  transform?: (data: any) => any;
  cacheKey?: string;
  cacheTTL?: number;
  cacheTags?: string[];
}

export interface OptimizationMetrics {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  processingTime: number;
  cacheHit: boolean;
  compressionAlgorithm?: string;
  etagMatch: boolean;
}

export interface APIPerformanceMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  compressed: boolean;
  compressionRatio?: number;
  cacheHit: boolean;
  timestamp: number;
  userAgent?: string;
  clientIP?: string;
}

/**
 * API Response Optimizer
 */
export class APIOptimizer {
  private static instance: APIOptimizer;
  private performanceMetrics: Map<string, APIPerformanceMetrics[]> = new Map();
  private responseCache: Map<string, { data: any; etag: string; timestamp: number }> = new Map();
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> = new Map();

  private constructor() {
    this.startMetricsCleanup();
  }

  static getInstance(): APIOptimizer {
    if (!APIOptimizer.instance) {
      APIOptimizer.instance = new APIOptimizer();
    }
    return APIOptimizer.instance;
  }

  /**
   * Optimize API response with comprehensive enhancements
   */
  async optimizeResponse(
    request: NextRequest,
    data: any,
    options: OptimizationOptions = {}
  ): Promise<NextResponse> {
    const startTime = Date.now();

    return TraceManager.executeWithSpan(
      'api.optimize_response',
      async (span) => {
        try {
          const endpoint = this.getEndpointFromRequest(request);
          const method = request.method || 'GET';

          span.setAttributes({
            'api.endpoint': endpoint,
            'api.method': method,
            'api.optimization.compress': options.compress ?? API_OPTIMIZER_CONFIG.compression.enabled,
            'api.optimization.cache': options.cache ?? API_OPTIMIZER_CONFIG.caching.enabled,
          });

          // Apply field filtering if requested
          let optimizedData = data;
          if (options.fields && API_OPTIMIZER_CONFIG.optimization.fieldFiltering) {
            optimizedData = this.filterFields(data, options.fields);
          }

          // Apply custom transformation
          if (options.transform && API_OPTIMIZER_CONFIG.optimization.responseTransformation) {
            optimizedData = options.transform(optimizedData);
          }

          // Optimize data structure
          if (API_OPTIMIZER_CONFIG.optimization.enabled) {
            optimizedData = this.optimizeDataStructure(optimizedData);
          }

          // Serialize data
          const serializedData = this.serializeData(optimizedData);
          const originalSize = Buffer.byteLength(serializedData, 'utf8');

          // Generate ETag
          const etag = this.generateETag(serializedData);

          // Check for conditional requests
          if (API_OPTIMIZER_CONFIG.caching.etagEnabled && options.etag !== false) {
            const ifNoneMatch = request.headers.get('if-none-match');
            if (ifNoneMatch === etag) {
              span.setAttributes({
                'api.etag_match': true,
                'api.status_code': 304,
              });

              return new NextResponse(null, {
                status: 304,
                headers: {
                  'ETag': etag,
                  'Cache-Control': `max-age=${API_OPTIMIZER_CONFIG.caching.maxAge}, stale-while-revalidate=${API_OPTIMIZER_CONFIG.caching.staleWhileRevalidate}`,
                },
              });
            }
          }

          // Check cache
          let fromCache = false;
          if (options.cache !== false && API_OPTIMIZER_CONFIG.caching.enabled) {
            const cacheKey = options.cacheKey || this.generateCacheKey(request, options);
            const cached = await cacheEngine.get(cacheKey);

            if (cached) {
              fromCache = true;
              optimizedData = cached;
              span.setAttributes({ 'api.cache_hit': true });
            } else {
              // Cache the response
              const ttl = options.cacheTTL || API_OPTIMIZER_CONFIG.caching.defaultTTL;
              await cacheEngine.set(cacheKey, optimizedData, {
                ttl,
                tags: options.cacheTags || [`endpoint:${endpoint}`],
              });
              span.setAttributes({ 'api.cache_hit': false });
            }
          }

          // Apply compression
          let finalData = serializedData;
          let compressionAlgorithm: string | undefined;
          let compressionRatio = 1;

          if (
            options.compress !== false &&
            API_OPTIMIZER_CONFIG.compression.enabled &&
            originalSize > API_OPTIMIZER_CONFIG.compression.threshold
          ) {
            const acceptEncoding = request.headers.get('accept-encoding') || '';
            compressionAlgorithm = this.selectCompressionAlgorithm(acceptEncoding);

            if (compressionAlgorithm) {
              try {
                const compressedResult = await this.compressData(serializedData, compressionAlgorithm);
                finalData = Buffer.isBuffer(compressedResult) ? compressedResult.toString('base64') : compressedResult;
                compressionRatio = originalSize / finalData.length;

                span.setAttributes({
                  'api.compression.algorithm': compressionAlgorithm,
                  'api.compression.ratio': compressionRatio,
                  'api.compression.original_size': originalSize,
                  'api.compression.compressed_size': finalData.length,
                });
              } catch (error) {
                logger.warn('Compression failed, using uncompressed response', {
                  endpoint,
                  error: error instanceof Error ? error.message : 'Unknown',
                });
                finalData = serializedData;
                compressionAlgorithm = undefined;
              }
            }
          }

          // Build response headers
          const headers = this.buildResponseHeaders({
            etag,
            compressionAlgorithm,
            originalSize,
            compressedSize: finalData.length,
            cacheable: options.cache !== false,
          });

          // Record performance metrics
          const processingTime = Date.now() - startTime;
          this.recordPerformanceMetrics({
            endpoint,
            method,
            statusCode: 200,
            responseTime: processingTime,
            requestSize: parseInt(request.headers.get('content-length') || '0'),
            responseSize: finalData.length,
            compressed: !!compressionAlgorithm,
            compressionRatio,
            cacheHit: fromCache,
            timestamp: startTime,
            userAgent: request.headers.get('user-agent') || undefined,
            clientIP: request.headers.get('x-forwarded-for') || undefined,
          });

          // Update monitoring metrics
          if (API_OPTIMIZER_CONFIG.monitoring.enabled) {
            metricsCollector.recordTechnicalMetric('apiResponseTime', processingTime / 1000, {
              endpoint,
              method,
              cached: fromCache.toString(),
            });

            if (API_OPTIMIZER_CONFIG.monitoring.trackResponseSizes) {
              metricsCollector.recordTechnicalMetric('apiResponseSize', finalData.length, {
                endpoint,
                compressed: (!!compressionAlgorithm).toString(),
              });
            }

            if (API_OPTIMIZER_CONFIG.monitoring.trackCompressionRatio && compressionAlgorithm) {
              metricsCollector.recordTechnicalMetric('apiCompressionRatio', compressionRatio, {
                algorithm: compressionAlgorithm,
              });
            }
          }

          span.setAttributes({
            'api.processing_time_ms': processingTime,
            'api.response_size': finalData.length,
            'api.status_code': 200,
          });

          // Create response
          return new NextResponse(finalData, {
            status: 200,
            headers,
          });

        } catch (error) {
          const processingTime = Date.now() - startTime;

          span.setAttributes({
            'api.error': true,
            'api.processing_time_ms': processingTime,
          });

          logger.error('API optimization failed', {
            endpoint: this.getEndpointFromRequest(request),
            processingTime,
          }, error instanceof Error ? error : undefined);

          // Return unoptimized response on error
          return NextResponse.json(data, { status: 500 });
        }
      }
    );
  }

  /**
   * Create optimized streaming response
   */
  async createStreamingResponse(
    request: NextRequest,
    dataGenerator: AsyncGenerator<any>,
    options: OptimizationOptions = {}
  ): Promise<NextResponse> {
    if (!API_OPTIMIZER_CONFIG.streaming.enabled) {
      // Fallback to regular response
      const data = [];
      for await (const chunk of dataGenerator) {
        data.push(chunk);
      }
      return this.optimizeResponse(request, data, options);
    }

    return TraceManager.executeWithSpan(
      'api.create_streaming_response',
      async (span) => {
        const endpoint = this.getEndpointFromRequest(request);

        span.setAttributes({
          'api.endpoint': endpoint,
          'api.streaming': true,
        });

        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of dataGenerator) {
                const serializedChunk = JSON.stringify(chunk) + '\n';
                controller.enqueue(new TextEncoder().encode(serializedChunk));
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          },
        });

        const headers = this.buildStreamingHeaders();

        return new NextResponse(stream, {
          status: 200,
          headers,
        });
      }
    );
  }

  /**
   * Middleware for automatic API optimization
   */
  createOptimizationMiddleware(options: OptimizationOptions = {}) {
    return async (request: NextRequest, next: Function) => {
      const startTime = Date.now();

      try {
        // Rate limiting check
        if (API_OPTIMIZER_CONFIG.security.rateLimitingEnabled) {
          const rateLimitResult = this.checkRateLimit(request);
          if (!rateLimitResult.allowed) {
            return new NextResponse('Rate limit exceeded', {
              status: 429,
              headers: {
                'Retry-After': '60',
                'X-RateLimit-Limit': API_OPTIMIZER_CONFIG.security.maxRequestsPerMinute.toString(),
                'X-RateLimit-Remaining': '0',
              },
            });
          }
        }

        // Request size validation
        const contentLength = parseInt(request.headers.get('content-length') || '0');
        if (contentLength > API_OPTIMIZER_CONFIG.security.requestSizeLimit) {
          return new NextResponse('Request entity too large', { status: 413 });
        }

        // Execute the handler
        const response = await next(request);

        // Optimize response if it's JSON
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          return this.optimizeResponse(request, data, options);
        }

        return response;

      } catch (error) {
        const processingTime = Date.now() - startTime;

        logger.error('API middleware error', {
          endpoint: this.getEndpointFromRequest(request),
          processingTime,
        }, error instanceof Error ? error : undefined);

        return new NextResponse('Internal server error', { status: 500 });
      }
    };
  }

  /**
   * Filter response fields
   */
  private filterFields(data: any, fields: string[]): any {
    if (Array.isArray(data)) {
      return data.map(item => this.filterFields(item, fields));
    }

    if (typeof data === 'object' && data !== null) {
      const filtered: any = {};
      for (const field of fields) {
        if (field.includes('.')) {
          // Handle nested fields
          const [parent, ...nested] = field.split('.');
          if (data[parent] !== undefined) {
            filtered[parent] = this.filterFields(data[parent], [nested.join('.')]);
          }
        } else if (data[field] !== undefined) {
          filtered[field] = data[field];
        }
      }
      return filtered;
    }

    return data;
  }

  /**
   * Optimize data structure
   */
  private optimizeDataStructure(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.optimizeDataStructure(item));
    }

    if (typeof data === 'object' && data !== null) {
      const optimized: any = {};

      for (const [key, value] of Object.entries(data)) {
        // Remove null values if configured
        if (API_OPTIMIZER_CONFIG.optimization.removeNullValues && value === null) {
          continue;
        }

        // Remove undefined values
        if (value === undefined) {
          continue;
        }

        // Recursively optimize nested objects
        optimized[key] = this.optimizeDataStructure(value);
      }

      return optimized;
    }

    return data;
  }

  /**
   * Serialize data with optimization
   */
  private serializeData(data: any): string {
    if (API_OPTIMIZER_CONFIG.optimization.minifyJson) {
      return JSON.stringify(data);
    }
    return JSON.stringify(data, null, 0);
  }

  /**
   * Generate ETag for response
   */
  private generateETag(data: string): string {
    return `"${crypto.createHash('md5').update(data).digest('hex')}"`;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(request: NextRequest, options: OptimizationOptions): string {
    const url = new URL(request.url);
    const pathAndQuery = url.pathname + url.search;
    const method = request.method || 'GET';

    const keyData = {
      path: pathAndQuery,
      method,
      fields: options.fields?.sort(),
    };

    const hash = crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
    return `api:${hash}`;
  }

  /**
   * Select best compression algorithm
   */
  private selectCompressionAlgorithm(acceptEncoding: string): string | undefined {
    const algorithms = API_OPTIMIZER_CONFIG.compression.algorithms;

    for (const algorithm of algorithms) {
      if (acceptEncoding.includes(algorithm)) {
        return algorithm;
      }
    }

    return undefined;
  }

  /**
   * Compress data using specified algorithm
   */
  private async compressData(data: string, algorithm: string): Promise<string | Buffer> {
    const buffer = Buffer.from(data, 'utf8');

    switch (algorithm) {
      case 'gzip':
        const zlib = await import('node:zlib');
        return promisify(zlib.gzip)(buffer, {
          level: API_OPTIMIZER_CONFIG.compression.level,
          chunkSize: API_OPTIMIZER_CONFIG.compression.chunkSize,
        });

      case 'br':
        const zlibBr = await import('node:zlib');
        return promisify(zlibBr.brotliCompress)(buffer, {
          params: {
            [zlibBr.constants.BROTLI_PARAM_QUALITY]: API_OPTIMIZER_CONFIG.compression.level,
          },
        });

      case 'deflate':
        const zlibDef = await import('node:zlib');
        return promisify(zlibDef.deflate)(buffer, {
          level: API_OPTIMIZER_CONFIG.compression.level,
          chunkSize: API_OPTIMIZER_CONFIG.compression.chunkSize,
        });

      default:
        throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }
  }

  /**
   * Build response headers
   */
  private buildResponseHeaders(options: {
    etag: string;
    compressionAlgorithm?: string;
    originalSize: number;
    compressedSize: number;
    cacheable: boolean;
  }): Headers {
    const headers = new Headers();

    // Content type
    headers.set('Content-Type', 'application/json; charset=utf-8');

    // ETag
    if (API_OPTIMIZER_CONFIG.caching.etagEnabled) {
      headers.set('ETag', options.etag);
    }

    // Compression
    if (options.compressionAlgorithm) {
      headers.set('Content-Encoding', options.compressionAlgorithm);
      headers.set('Vary', 'Accept-Encoding');
    }

    // Content length
    headers.set('Content-Length', options.compressedSize.toString());

    // Cache control
    if (options.cacheable && API_OPTIMIZER_CONFIG.caching.enabled) {
      headers.set(
        'Cache-Control',
        `max-age=${API_OPTIMIZER_CONFIG.caching.maxAge}, stale-while-revalidate=${API_OPTIMIZER_CONFIG.caching.staleWhileRevalidate}`
      );
    } else {
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    // CORS headers
    if (API_OPTIMIZER_CONFIG.security.corsEnabled) {
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }

    // Performance headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');

    return headers;
  }

  /**
   * Build streaming response headers
   */
  private buildStreamingHeaders(): Headers {
    const headers = new Headers();

    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('Transfer-Encoding', 'chunked');
    headers.set('Cache-Control', 'no-cache');

    if (API_OPTIMIZER_CONFIG.security.corsEnabled) {
      headers.set('Access-Control-Allow-Origin', '*');
    }

    return headers;
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(request: NextRequest): { allowed: boolean; remaining: number } {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = API_OPTIMIZER_CONFIG.security.maxRequestsPerMinute;

    if (!this.rateLimitTracker.has(clientIP)) {
      this.rateLimitTracker.set(clientIP, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    const tracker = this.rateLimitTracker.get(clientIP)!;

    // Reset if window has passed
    if (now > tracker.resetTime) {
      tracker.count = 1;
      tracker.resetTime = now + windowMs;
      return { allowed: true, remaining: maxRequests - 1 };
    }

    // Check if limit exceeded
    if (tracker.count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    tracker.count++;
    return { allowed: true, remaining: maxRequests - tracker.count };
  }

  /**
   * Record performance metrics
   */
  private recordPerformanceMetrics(metrics: APIPerformanceMetrics): void {
    const { endpoint } = metrics;

    if (!this.performanceMetrics.has(endpoint)) {
      this.performanceMetrics.set(endpoint, []);
    }

    const endpointMetrics = this.performanceMetrics.get(endpoint)!;
    endpointMetrics.push(metrics);

    // Keep only recent metrics (last hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.performanceMetrics.set(
      endpoint,
      endpointMetrics.filter(m => m.timestamp > oneHourAgo)
    );
  }

  /**
   * Get endpoint from request
   */
  private getEndpointFromRequest(request: NextRequest): string {
    const url = new URL(request.url);
    return url.pathname;
  }

  /**
   * Start metrics cleanup
   */
  private startMetricsCleanup(): void {
    setInterval(() => {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);

      // Clean up performance metrics
      for (const [endpoint, metrics] of this.performanceMetrics.entries()) {
        const recentMetrics = metrics.filter(m => m.timestamp > oneHourAgo);
        if (recentMetrics.length === 0) {
          this.performanceMetrics.delete(endpoint);
        } else {
          this.performanceMetrics.set(endpoint, recentMetrics);
        }
      }

      // Clean up rate limit tracker
      const now = Date.now();
      for (const [clientIP, tracker] of this.rateLimitTracker.entries()) {
        if (now > tracker.resetTime) {
          this.rateLimitTracker.delete(clientIP);
        }
      }

    }, 300000); // Every 5 minutes
  }

  /**
   * Get performance statistics
   */
  getPerformanceStatistics(): {
    endpoints: number;
    totalRequests: number;
    averageResponseTime: number;
    averageCompressionRatio: number;
    cacheHitRate: number;
  } {
    let totalRequests = 0;
    let totalResponseTime = 0;
    let totalCompressionRatio = 0;
    let compressedRequests = 0;
    let cacheHits = 0;

    for (const metrics of this.performanceMetrics.values()) {
      for (const metric of metrics) {
        totalRequests++;
        totalResponseTime += metric.responseTime;

        if (metric.compressed && metric.compressionRatio) {
          totalCompressionRatio += metric.compressionRatio;
          compressedRequests++;
        }

        if (metric.cacheHit) {
          cacheHits++;
        }
      }
    }

    return {
      endpoints: this.performanceMetrics.size,
      totalRequests,
      averageResponseTime: totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0,
      averageCompressionRatio: compressedRequests > 0 ? totalCompressionRatio / compressedRequests : 1,
      cacheHitRate: totalRequests > 0 ? Math.round((cacheHits / totalRequests) * 100) : 0,
    };
  }
}

// Export singleton instance
export const apiOptimizer = APIOptimizer.getInstance();

// Export configuration for reference
export { API_OPTIMIZER_CONFIG };