/**
 * Simplified Enterprise Integration for AUTO ANI
 *
 * Provides essential enterprise features without complex dependencies:
 * - Basic caching with Redis
 * - Error handling with circuit breakers
 * - Security middleware
 * - Performance monitoring
 * - Request validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { redis } from './redis';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Configuration
const ENTERPRISE_CONFIG = {
  caching: {
    enabled: process.env.ENTERPRISE_CACHE_ENABLED !== 'false',
    defaultTTL: parseInt(process.env.ENTERPRISE_CACHE_TTL || '300'), // 5 minutes
  },

  security: {
    enabled: process.env.ENTERPRISE_SECURITY_ENABLED !== 'false',
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
    rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '100'),
  },

  monitoring: {
    enabled: process.env.ENTERPRISE_MONITORING_ENABLED !== 'false',
    logRequests: process.env.LOG_REQUESTS !== 'false',
  },

  resilience: {
    enabled: process.env.ENTERPRISE_RESILIENCE_ENABLED !== 'false',
    circuitBreakerThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5'),
    circuitBreakerTimeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '60000'), // 1 minute
  },
};

// Types
interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

interface SecurityContext {
  userId?: string;
  userRole?: string;
  permissions?: string[];
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

/**
 * Enterprise Cache Manager
 */
export class EnterpriseCacheManager {
  private static instance: EnterpriseCacheManager;

  static getInstance(): EnterpriseCacheManager {
    if (!EnterpriseCacheManager.instance) {
      EnterpriseCacheManager.instance = new EnterpriseCacheManager();
    }
    return EnterpriseCacheManager.instance;
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (!ENTERPRISE_CONFIG.caching.enabled) {
      return null;
    }

    try {
      const cached = await redis.get(`cache:${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.warn('Cache get failed', { key, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Set cache value
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    if (!ENTERPRISE_CONFIG.caching.enabled) {
      return;
    }

    try {
      const ttl = options.ttl || ENTERPRISE_CONFIG.caching.defaultTTL;
      await redis.setex(`cache:${key}`, ttl, JSON.stringify(value));

      // Store tags for invalidation
      if (options.tags) {
        for (const tag of options.tags) {
          await redis.sadd(`cache_tag:${tag}`, key);
          await redis.expire(`cache_tag:${tag}`, ttl);
        }
      }
    } catch (error) {
      logger.warn('Cache set failed', { key, error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Invalidate by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    if (!ENTERPRISE_CONFIG.caching.enabled) {
      return;
    }

    try {
      for (const tag of tags) {
        const keys = await redis.smembers(`cache_tag:${tag}`);
        if (keys.length > 0) {
          const cacheKeys = keys.map(key => `cache:${key}`);
          await redis.del(...cacheKeys);
          await redis.del(`cache_tag:${tag}`);
        }
      }
    } catch (error) {
      logger.warn('Cache invalidation failed', { tags, error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!ENTERPRISE_CONFIG.caching.enabled) {
      return;
    }

    try {
      const keys = await redis.keys('cache:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }

      const tagKeys = await redis.keys('cache_tag:*');
      if (tagKeys.length > 0) {
        await redis.del(...tagKeys);
      }
    } catch (error) {
      logger.warn('Cache clear failed', { error: error instanceof Error ? error.message : String(error) });
    }
  }
}

/**
 * Enterprise Security Manager
 */
export class EnterpriseSecurityManager {
  private static instance: EnterpriseSecurityManager;
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

  static getInstance(): EnterpriseSecurityManager {
    if (!EnterpriseSecurityManager.instance) {
      EnterpriseSecurityManager.instance = new EnterpriseSecurityManager();
    }
    return EnterpriseSecurityManager.instance;
  }

  /**
   * Authenticate JWT token
   */
  async authenticateToken(token: string): Promise<SecurityContext | null> {
    if (!ENTERPRISE_CONFIG.security.enabled) {
      return { userId: 'anonymous', userRole: 'user', permissions: [] };
    }

    try {
      const decoded = jwt.verify(token, ENTERPRISE_CONFIG.security.jwtSecret) as any;
      return {
        userId: decoded.userId,
        userRole: decoded.role || 'user',
        permissions: decoded.permissions || [],
      };
    } catch (error) {
      logger.warn('Token authentication failed', { error: error instanceof Error ? error.message : 'Unknown' });
      return null;
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: { userId: string; role: string; permissions: string[] }): string {
    return jwt.sign(payload, ENTERPRISE_CONFIG.security.jwtSecret, { expiresIn: '24h' });
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Check rate limit
   */
  checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
    if (!ENTERPRISE_CONFIG.security.rateLimitEnabled) {
      return { allowed: true, remaining: ENTERPRISE_CONFIG.security.maxRequestsPerMinute };
    }

    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = ENTERPRISE_CONFIG.security.maxRequestsPerMinute;

    let rateLimitData = this.rateLimitStore.get(clientId);

    if (!rateLimitData || now > rateLimitData.resetTime) {
      rateLimitData = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.rateLimitStore.set(clientId, rateLimitData);
      return { allowed: true, remaining: maxRequests - 1 };
    }

    rateLimitData.count++;
    const allowed = rateLimitData.count <= maxRequests;
    const remaining = Math.max(0, maxRequests - rateLimitData.count);

    return { allowed, remaining };
  }

  /**
   * Validate request
   */
  validateRequest(request: NextRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    const contentLength = parseInt(request.headers.get('content-length') || '0');
    if (contentLength > 10 * 1024 * 1024) { // 10MB limit
      errors.push('Request too large');
    }

    // Check for suspicious patterns in URL
    const url = request.url;
    const suspiciousPatterns = [
      /\.\.\//g, // Path traversal
      /<script/gi, // XSS
      /union.*select/gi, // SQL injection
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        errors.push('Suspicious request pattern detected');
        break;
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Add security headers
   */
  addSecurityHeaders(response: NextResponse): void {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Content-Security-Policy', "default-src 'self'");
  }
}

/**
 * Enterprise Resilience Manager
 */
export class EnterpriseResilienceManager {
  private static instance: EnterpriseResilienceManager;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();

  static getInstance(): EnterpriseResilienceManager {
    if (!EnterpriseResilienceManager.instance) {
      EnterpriseResilienceManager.instance = new EnterpriseResilienceManager();
    }
    return EnterpriseResilienceManager.instance;
  }

  /**
   * Execute with circuit breaker
   */
  async executeWithCircuitBreaker<T>(
    key: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (!ENTERPRISE_CONFIG.resilience.enabled) {
      return operation();
    }

    const breaker = this.getCircuitBreaker(key);

    // Check if circuit breaker is open
    if (breaker.state === 'open') {
      const now = Date.now();
      if (now - breaker.lastFailureTime < ENTERPRISE_CONFIG.resilience.circuitBreakerTimeout) {
        if (fallback) {
          logger.warn('Circuit breaker open, using fallback', { key });
          return fallback();
        }
        throw new Error(`Circuit breaker open for: ${key}`);
      }
      breaker.state = 'half-open';
    }

    try {
      const result = await operation();
      this.recordSuccess(key);
      return result;
    } catch (error) {
      this.recordFailure(key);
      if (fallback) {
        logger.warn('Operation failed, using fallback', { key });
        return fallback();
      }
      throw error;
    }
  }

  /**
   * Execute with retry
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < maxRetries) {
          logger.warn('Operation failed, retrying', { attempt, maxRetries });
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
      }
    }

    throw lastError!;
  }

  private getCircuitBreaker(key: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, {
        failures: 0,
        lastFailureTime: 0,
        state: 'closed',
      });
    }
    return this.circuitBreakers.get(key)!;
  }

  private recordSuccess(key: string): void {
    const breaker = this.getCircuitBreaker(key);
    breaker.failures = 0;
    breaker.state = 'closed';
  }

  private recordFailure(key: string): void {
    const breaker = this.getCircuitBreaker(key);
    breaker.failures++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failures >= ENTERPRISE_CONFIG.resilience.circuitBreakerThreshold) {
      breaker.state = 'open';
      logger.warn('Circuit breaker opened', { key, failures: breaker.failures });
    }
  }
}

/**
 * Enterprise Monitoring Manager
 */
export class EnterpriseMonitoringManager {
  private static instance: EnterpriseMonitoringManager;
  private metrics: Map<string, number> = new Map();

  static getInstance(): EnterpriseMonitoringManager {
    if (!EnterpriseMonitoringManager.instance) {
      EnterpriseMonitoringManager.instance = new EnterpriseMonitoringManager();
    }
    return EnterpriseMonitoringManager.instance;
  }

  /**
   * Record metric
   */
  recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    if (!ENTERPRISE_CONFIG.monitoring.enabled) {
      return;
    }

    const key = `${name}:${JSON.stringify(tags)}`;
    this.metrics.set(key, value);

    // Log significant metrics
    if (name.includes('error') || name.includes('failure')) {
      logger.warn('Error metric recorded', { name, value, tags });
    }
  }

  /**
   * Get metrics
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Monitor request
   */
  monitorRequest(request: NextRequest, response: NextResponse, duration: number): void {
    if (!ENTERPRISE_CONFIG.monitoring.logRequests) {
      return;
    }

    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const method = request.method;
    const url = new URL(request.url).pathname;
    const status = response.status;

    logger.info('Request monitored', {
      method,
      url,
      status,
      duration,
      clientIP,
      userAgent: userAgent.substring(0, 100), // Truncate for security
    });

    this.recordMetric('http_requests_total', 1, { method, status: status.toString() });
    this.recordMetric('http_request_duration_ms', duration, { method });
  }
}

/**
 * Enterprise Middleware Factory
 */
export function createEnterpriseMiddleware(options: {
  requireAuth?: boolean;
  requiredPermissions?: string[];
  enableCaching?: boolean;
  enableRateLimit?: boolean;
} = {}) {
  const cache = EnterpriseCacheManager.getInstance();
  const security = EnterpriseSecurityManager.getInstance();
  const resilience = EnterpriseResilienceManager.getInstance();
  const monitoring = EnterpriseMonitoringManager.getInstance();

  return async (request: NextRequest, next: Function): Promise<NextResponse> => {
    const startTime = Date.now();
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

    try {
      // Rate limiting
      if (options.enableRateLimit !== false) {
        const rateLimitResult = security.checkRateLimit(clientIP);
        if (!rateLimitResult.allowed) {
          return new NextResponse('Rate limit exceeded', {
            status: 429,
            headers: {
              'Retry-After': '60',
              'X-RateLimit-Remaining': '0',
            },
          });
        }
      }

      // Request validation
      const validation = security.validateRequest(request);
      if (!validation.valid) {
        return new NextResponse('Bad request', { status: 400 });
      }

      // Authentication
      let securityContext: SecurityContext | null = null;
      if (options.requireAuth) {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new NextResponse('Unauthorized', { status: 401 });
        }

        const token = authHeader.substring(7);
        securityContext = await security.authenticateToken(token);
        if (!securityContext) {
          return new NextResponse('Unauthorized', { status: 401 });
        }

        // Check permissions
        if (options.requiredPermissions && options.requiredPermissions.length > 0) {
          const hasPermission = options.requiredPermissions.every(permission =>
            securityContext!.permissions?.includes(permission) ||
            securityContext!.userRole === 'admin'
          );

          if (!hasPermission) {
            return new NextResponse('Forbidden', { status: 403 });
          }
        }
      }

      // Execute with resilience
      const response = await resilience.executeWithCircuitBreaker(
        'api_request',
        async () => next(request),
        async () => new NextResponse('Service temporarily unavailable', { status: 503 })
      );

      // Add security headers
      security.addSecurityHeaders(response);

      // Monitor request
      const duration = Date.now() - startTime;
      monitoring.monitorRequest(request, response, duration);

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      monitoring.recordMetric('http_errors_total', 1, {
        client_ip: clientIP,
        error_type: error instanceof Error ? error.name : 'unknown'
      });

      logger.error('Enterprise middleware error', {
        duration,
        clientIP,
        url: request.url,
      }, error instanceof Error ? error : undefined);

      return new NextResponse('Internal server error', { status: 500 });
    }
  };
}

/**
 * Enterprise utility functions
 */
export const enterpriseUtils = {
  cache: EnterpriseCacheManager.getInstance(),
  security: EnterpriseSecurityManager.getInstance(),
  resilience: EnterpriseResilienceManager.getInstance(),
  monitoring: EnterpriseMonitoringManager.getInstance(),

  /**
   * Generate cache key
   */
  generateCacheKey(base: string, params: Record<string, any> = {}): string {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');

    return crypto
      .createHash('md5')
      .update(`${base}|${paramString}`)
      .digest('hex')
      .substring(0, 16);
  },

  /**
   * Create cached API handler
   */
  createCachedHandler<T>(
    handler: (request: NextRequest) => Promise<T>,
    cacheOptions: CacheOptions = {}
  ) {
    return async (request: NextRequest): Promise<T> => {
      const cacheKey = this.generateCacheKey(request.url, {
        method: request.method,
        query: new URL(request.url).search,
      });

      // Try cache first
      const cached = await this.cache.get<T>(cacheKey);
      if (cached) {
        return cached;
      }

      // Execute handler
      const result = await handler(request);

      // Cache result
      await this.cache.set(cacheKey, result, cacheOptions);

      return result;
    };
  },
};

// Export configuration
export { ENTERPRISE_CONFIG };