import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// Circuit breaker state
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

class RedisService {
  private client: RedisClientType | null = null;
  private inMemoryStore: Map<string, { count: number; resetTime: number }> = new Map();
  private csrfTokenStore: Map<string, string> = new Map(); // Secure in-memory CSRF token storage
  private useRedis: boolean = false;
  private connecting: Promise<void> | null = null;
  private circuitBreaker: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    state: 'CLOSED'
  };
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 60 seconds
  private readonly CIRCUIT_BREAKER_RESET = 120000; // 2 minutes
  private cleanupTimer?: NodeJS.Timeout;
  private circuitBreakerResetTimer?: NodeJS.Timeout;
  private readonly MAX_MEMORY_STORE_SIZE = 10000; // Limit in-memory store size

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    if (this.connecting) {
      return this.connecting;
    }

    this.connecting = (async () => {
      try {
        const { env, hasRedis } = await import('./env');

        if (!hasRedis) {
          logger.info('Redis not configured, using in-memory storage', {
            mode: 'memory',
            note: 'This is suitable for development and single-instance deployments'
          });
          this.useRedis = false;
          return;
        }

        const redisUrl = env.REDIS_URL;
        const redisHost = env.REDIS_HOST;
        const redisPort = parseInt(env.REDIS_PORT || '6379');
        const redisPassword = env.REDIS_PASSWORD;

        // Create Redis client with enhanced configuration
        const clientConfig: Record<string, any> = {
          socket: {
            reconnectStrategy: (retries: number) => {
              if (retries > 20) {
                logger.warn('Redis: Max reconnection attempts reached, falling back to memory');
                this.useRedis = false;
                return false; // Stop reconnecting
              }
              const delay = Math.min(retries * 100, 3000);
              logger.debug(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
              return delay;
            },
            connectTimeout: 10000,
            keepAlive: 5000,
          },
          // Enhanced error handling
          lazyConnect: true,
        };

        if (redisUrl) {
          clientConfig.url = redisUrl;
        } else {
          clientConfig.socket = {
            ...clientConfig.socket,
            host: redisHost,
            port: redisPort,
          };
          if (redisPassword) {
            clientConfig.password = redisPassword;
          }
        }

        this.client = createClient(clientConfig);

        // Enhanced event handlers
        this.client.on('error', (err) => {
          // Don't log connection errors repeatedly
          if (!err.message.includes('ECONNREFUSED') || this.circuitBreaker.failures === 0) {
            logger.error('Redis client error', { error: err.message }, err);
          }
          this.handleCircuitBreakerFailure();
        });

        this.client.on('connect', () => {
          logger.info('Redis: Connected successfully');
          this.resetCircuitBreaker();
        });

        this.client.on('reconnecting', () => {
          logger.info('Redis: Reconnecting...');
        });

        this.client.on('ready', () => {
          logger.info('Redis: Ready to accept commands');
          this.useRedis = true;
          this.resetCircuitBreaker();
        });

        // Connect
        await this.client.connect();
        logger.info('Redis service initialized', {
          mode: 'redis',
          url: redisUrl ? 'using REDIS_URL' : `${redisHost}:${redisPort}`
        });
      } catch (error) {
        logger.warn('Failed to initialize Redis, using in-memory fallback', {
          error: error instanceof Error ? error.message : String(error)
        });
        this.useRedis = false;
        this.handleCircuitBreakerFailure();
      } finally {
        this.connecting = null;
      }
    })();

    return this.connecting;
  }

  private handleCircuitBreakerFailure() {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitBreaker.state = 'OPEN';
      logger.warn('Redis circuit breaker opened', {
        failures: this.circuitBreaker.failures
      });

      // Auto-reset after timeout - store timer for cleanup
      if (this.circuitBreakerResetTimer) {
        clearTimeout(this.circuitBreakerResetTimer);
      }
      this.circuitBreakerResetTimer = setTimeout(() => {
        this.circuitBreaker.state = 'HALF_OPEN';
        logger.info('Redis circuit breaker half-open, attempting reconnection');
        this.initializeRedis().catch(() => {
          // If reconnection fails, circuit stays open
          this.circuitBreaker.state = 'OPEN';
        });
        this.circuitBreakerResetTimer = undefined;
      }, this.CIRCUIT_BREAKER_TIMEOUT);
    }
  }

  private resetCircuitBreaker() {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'CLOSED';
    logger.info('Redis circuit breaker reset');
  }

  private isCircuitBreakerOpen(): boolean {
    return this.circuitBreaker.state === 'OPEN';
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  private async ensureConnection(): Promise<boolean> {
    if (this.isCircuitBreakerOpen()) {
      return false;
    }

    if (!this.useRedis || !this.client || !this.client.isOpen) {
      await this.initializeRedis();
    }

    return this.useRedis && this.client !== null && this.client.isOpen;
  }

  async checkRateLimit(
    key: string,
    config: RateLimitConfig = { maxAttempts: 5, windowMs: 15 * 60 * 1000 }
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const rateLimitKey = `ratelimit:${key}`;

    // Try Redis first
    if (await this.ensureConnection()) {
      try {
        const windowSeconds = Math.ceil(config.windowMs / 1000);
        const count = await this.client!.incr(rateLimitKey);

        if (count === 1) {
          await this.client!.expire(rateLimitKey, windowSeconds);
        }

        const ttl = await this.client!.ttl(rateLimitKey);
        const resetTime = now + (ttl * 1000);

        if (count > config.maxAttempts) {
          logger.securityEvent('Rate limit exceeded', {
            ip: key,
            userAgent: 'unknown',
            endpoint: 'rate-limit-check',
            attemptedAction: `Rate limit exceeded with ${count} attempts`
          });

          return {
            allowed: false,
            remaining: 0,
            resetTime
          };
        }

        return {
          allowed: true,
          remaining: config.maxAttempts - count,
          resetTime
        };
      } catch (error) {
        logger.error('Redis rate limit check failed, falling back to memory', { error }, error instanceof Error ? error : undefined);
        this.handleCircuitBreakerFailure();
        // Fall through to in-memory
      }
    }

    // Fallback to in-memory
    const attempt = this.inMemoryStore.get(rateLimitKey);

    if (!attempt || now > attempt.resetTime) {
      this.inMemoryStore.set(rateLimitKey, {
        count: 1,
        resetTime: now + config.windowMs
      });

      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetTime: now + config.windowMs
      };
    }

    if (attempt.count >= config.maxAttempts) {
      logger.securityEvent('Rate limit exceeded', {
        key,
        attempts: attempt.count,
        maxAttempts: config.maxAttempts
      } as any);

      return {
        allowed: false,
        remaining: 0,
        resetTime: attempt.resetTime
      };
    }

    attempt.count++;

    return {
      allowed: true,
      remaining: config.maxAttempts - attempt.count,
      resetTime: attempt.resetTime
    };
  }

  async storeCSRFToken(sessionId: string, token: string, expiryMs: number = 30 * 60 * 1000): Promise<void> {
    const key = `csrf:${sessionId}`;
    const expirySeconds = Math.ceil(expiryMs / 1000);

    if (await this.ensureConnection()) {
      try {
        await this.client!.setEx(key, expirySeconds, token);
        logger.debug('CSRF token stored in Redis', { sessionId: sessionId.substring(0, 8) + '***' });
        return;
      } catch (error) {
        logger.error('Failed to store CSRF token in Redis', { error }, error instanceof Error ? error : undefined);
        this.handleCircuitBreakerFailure();
      }
    }

    // Fallback to in-memory - using secure Map storage instead of global object
    this.csrfTokenStore.set(key, token);
    this.inMemoryStore.set(key, {
      count: 0,
      resetTime: Date.now() + expiryMs
    });

    logger.debug('CSRF token stored in memory', { sessionId: sessionId.substring(0, 8) + '***' });
  }

  async validateCSRFToken(sessionId: string, token: string): Promise<boolean> {
    const key = `csrf:${sessionId}`;

    if (await this.ensureConnection()) {
      try {
        const storedToken = await this.client!.get(key);

        if (!storedToken) {
          logger.securityEvent('CSRF token expired or not found', { sessionId: sessionId.substring(0, 8) + '***' } as any);
          return false;
        }

        const isValid = storedToken === token;

        if (!isValid) {
          logger.securityEvent('CSRF token mismatch', { sessionId: sessionId.substring(0, 8) + '***' } as any);
        }

        return isValid;
      } catch (error) {
        logger.error('Failed to validate CSRF token in Redis', { error }, error instanceof Error ? error : undefined);
        this.handleCircuitBreakerFailure();
      }
    }

    // Fallback to in-memory - using secure Map storage
    const stored = this.inMemoryStore.get(key);

    if (!stored || Date.now() > stored.resetTime) {
      logger.securityEvent('CSRF token expired or not found', { sessionId: sessionId.substring(0, 8) + '***' } as any);
      return false;
    }

    const storedToken = this.csrfTokenStore.get(key);
    if (!storedToken) {
      logger.securityEvent('CSRF token not found in secure storage', { sessionId: sessionId.substring(0, 8) + '***' } as any);
      return false;
    }

    // Use constant-time comparison to prevent timing attacks
    const isValid = this.constantTimeCompare(storedToken, token);

    if (!isValid) {
      logger.securityEvent('CSRF token mismatch', { sessionId: sessionId.substring(0, 8) + '***' } as any);
    }

    return isValid;
  }

  async deleteCSRFToken(sessionId: string): Promise<void> {
    const key = `csrf:${sessionId}`;

    if (await this.ensureConnection()) {
      try {
        await this.client!.del(key);
        return;
      } catch (error) {
        logger.error('Failed to delete CSRF token in Redis', { error }, error instanceof Error ? error : undefined);
        this.handleCircuitBreakerFailure();
      }
    }

    // Fallback to in-memory
    this.csrfTokenStore.delete(key);
    this.inMemoryStore.delete(key);
  }

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    if (await this.ensureConnection()) {
      try {
        if (expirySeconds) {
          await this.client!.setEx(key, expirySeconds, value);
        } else {
          await this.client!.set(key, value);
        }
        return;
      } catch (error) {
        logger.error('Failed to set value in Redis', { error }, error instanceof Error ? error : undefined);
        this.handleCircuitBreakerFailure();
      }
    }

    // Fallback to in-memory
    const expiryMs = expirySeconds ? expirySeconds * 1000 : 24 * 60 * 60 * 1000;
    this.inMemoryStore.set(key, {
      count: 0,
      resetTime: Date.now() + expiryMs
    });

    if (typeof window === 'undefined') {
      (global as Record<string, unknown>)[`redis_${key}`] = value;
    }
  }

  async get(key: string): Promise<string | null> {
    if (await this.ensureConnection()) {
      try {
        return await this.client!.get(key);
      } catch (error) {
        logger.error('Failed to get value from Redis', { error }, error instanceof Error ? error : undefined);
        this.handleCircuitBreakerFailure();
      }
    }

    // Fallback to in-memory
    const stored = this.inMemoryStore.get(key);

    if (!stored || Date.now() > stored.resetTime) {
      return null;
    }

    if (typeof window === 'undefined') {
      return (global as Record<string, unknown>)[`redis_${key}`] as string || null;
    }

    return null;
  }

  async delete(key: string): Promise<void> {
    if (await this.ensureConnection()) {
      try {
        await this.client!.del(key);
        return;
      } catch (error) {
        logger.error('Failed to delete key from Redis', { error }, error instanceof Error ? error : undefined);
        this.handleCircuitBreakerFailure();
      }
    }

    // Fallback to in-memory
    this.inMemoryStore.delete(key);

    if (typeof window === 'undefined') {
      delete (global as Record<string, unknown>)[`redis_${key}`];
    }
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Cleanup expired entries
    this.inMemoryStore.forEach((value, key) => {
      if (now > value.resetTime) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.inMemoryStore.delete(key);
      this.csrfTokenStore.delete(key);
    });

    // Prevent memory store from growing too large
    if (this.inMemoryStore.size > this.MAX_MEMORY_STORE_SIZE) {
      const entriesToRemove = this.inMemoryStore.size - this.MAX_MEMORY_STORE_SIZE;
      const keys = Array.from(this.inMemoryStore.keys());
      const keysToRemove = keys.slice(0, entriesToRemove);

      keysToRemove.forEach(key => {
        this.inMemoryStore.delete(key);
        this.csrfTokenStore.delete(key);
      });

      logger.debug('In-memory store size limit reached, removed oldest entries', {
        removed: entriesToRemove,
        currentSize: this.inMemoryStore.size
      });
    }

    if (expiredKeys.length > 0) {
      logger.debug('In-memory cache cleanup completed', {
        expiredKeys: expiredKeys.length,
        currentSize: this.inMemoryStore.size
      });
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; mode: 'redis' | 'memory'; circuitBreaker: string }> {
    const mode = this.useRedis ? 'redis' : 'memory';

    if (await this.ensureConnection()) {
      try {
        const ping = await this.client!.ping();
        return {
          healthy: ping === 'PONG',
          mode,
          circuitBreaker: this.circuitBreaker.state
        };
      } catch (error) {
        logger.error('Redis health check failed', { error }, error instanceof Error ? error : undefined);
        return {
          healthy: false,
          mode: 'memory',
          circuitBreaker: this.circuitBreaker.state
        };
      }
    }

    return {
      healthy: true,
      mode: 'memory',
      circuitBreaker: this.circuitBreaker.state
    };
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    if (await this.ensureConnection()) {
      try {
        await this.client!.setEx(key, seconds, value);
        return;
      } catch (error) {
        logger.error('Failed to setex in Redis', { error }, error instanceof Error ? error : undefined);
        this.handleCircuitBreakerFailure();
      }
    }

    // Fallback to in-memory
    this.inMemoryStore.set(key, {
      count: 0,
      resetTime: Date.now() + (seconds * 1000)
    });

    if (typeof window === 'undefined') {
      (global as Record<string, unknown>)[`redis_${key}`] = value;
    }
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (await this.ensureConnection()) {
      try {
        return await this.client!.sAdd(key, members);
      } catch (error) {
        logger.error('Failed to sadd in Redis', { error }, error instanceof Error ? error : undefined);
        this.handleCircuitBreakerFailure();
      }
    }

    // Fallback to in-memory (simplified set implementation)
    const setKey = `set_${key}`;
    const existing = (global as any)[setKey] || new Set();
    const initialSize = existing.size;
    members.forEach(member => existing.add(member));
    (global as any)[setKey] = existing;
    return existing.size - initialSize;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    if (await this.ensureConnection()) {
      try {
        return (await this.client!.expire(key, seconds)) === 1;
      } catch (error) {
        logger.error('Failed to expire in Redis', { error }, error instanceof Error ? error : undefined);
        this.handleCircuitBreakerFailure();
      }
    }

    // Fallback to in-memory
    const stored = this.inMemoryStore.get(key);
    if (stored) {
      stored.resetTime = Date.now() + (seconds * 1000);
      return true;
    }
    return false;
  }

  async smembers(key: string): Promise<string[]> {
    if (await this.ensureConnection()) {
      try {
        return await this.client!.sMembers(key);
      } catch (error) {
        logger.error('Failed to smembers in Redis', { error }, error instanceof Error ? error : undefined);
        this.handleCircuitBreakerFailure();
      }
    }

    // Fallback to in-memory
    const setKey = `set_${key}`;
    const existing = (global as any)[setKey] || new Set();
    return Array.from(existing);
  }

  async del(...keys: string[]): Promise<number> {
    if (await this.ensureConnection()) {
      try {
        return await this.client!.del(keys);
      } catch (error) {
        logger.error('Failed to del in Redis', { error }, error instanceof Error ? error : undefined);
        this.handleCircuitBreakerFailure();
      }
    }

    // Fallback to in-memory
    let deleted = 0;
    keys.forEach(key => {
      if (this.inMemoryStore.has(key)) {
        this.inMemoryStore.delete(key);
        deleted++;
      }
      if (typeof window === 'undefined') {
        if ((global as Record<string, unknown>)[`redis_${key}`]) {
          delete (global as Record<string, unknown>)[`redis_${key}`];
          deleted++;
        }
      }
    });
    return deleted;
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    if (await this.ensureConnection()) {
      try {
        return await this.client!.mGet(keys);
      } catch (error) {
        logger.error('Failed to mget in Redis', { error }, error instanceof Error ? error : undefined);
        this.handleCircuitBreakerFailure();
      }
    }

    // Fallback to in-memory
    return keys.map(key => {
      const stored = this.inMemoryStore.get(key);
      if (!stored || Date.now() > stored.resetTime) {
        return null;
      }
      if (typeof window === 'undefined') {
        return (global as Record<string, unknown>)[`redis_${key}`] as string || null;
      }
      return null;
    });
  }

  async pipeline(): Promise<any> {
    if (await this.ensureConnection()) {
      try {
        return this.client!.multi();
      } catch (error) {
        logger.error('Failed to create pipeline in Redis', { error }, error instanceof Error ? error : undefined);
        this.handleCircuitBreakerFailure();
      }
    }

    // Fallback - return a mock pipeline
    const mockPipeline = {
      set: () => mockPipeline,
      get: () => mockPipeline,
      del: () => mockPipeline,
      setex: () => mockPipeline,
      exec: async () => []
    };
    return mockPipeline;
  }

  async keys(pattern: string): Promise<string[]> {
    if (await this.ensureConnection()) {
      try {
        return await this.client!.keys(pattern);
      } catch (error) {
        logger.error('Failed to get keys in Redis', { error }, error instanceof Error ? error : undefined);
        this.handleCircuitBreakerFailure();
      }
    }

    // Fallback to in-memory
    const allKeys = Array.from(this.inMemoryStore.keys());
    if (pattern === '*') {
      return allKeys;
    }

    // Simple pattern matching for common cases
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }

  async incr(key: string): Promise<number> {
    if (await this.ensureConnection()) {
      try {
        return await this.client!.incr(key);
      } catch (error) {
        logger.error('Failed to incr in Redis', { error }, error instanceof Error ? error : undefined);
        this.handleCircuitBreakerFailure();
      }
    }

    // Fallback to in-memory
    const stored = this.inMemoryStore.get(key);
    if (stored) {
      const currentValue = parseInt((global as any)[`redis_${key}`] || '0');
      const newValue = currentValue + 1;
      (global as any)[`redis_${key}`] = newValue.toString();
      return newValue;
    } else {
      (global as any)[`redis_${key}`] = '1';
      this.inMemoryStore.set(key, { count: 0, resetTime: Date.now() + 24 * 60 * 60 * 1000 });
      return 1;
    }
  }

  async ping(): Promise<string> {
    if (await this.ensureConnection()) {
      try {
        return await this.client!.ping();
      } catch (error) {
        logger.error('Failed to ping Redis', { error }, error instanceof Error ? error : undefined);
        this.handleCircuitBreakerFailure();
      }
    }

    return 'PONG';
  }

  async disconnect(): Promise<void> {
    // Clear timers first
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    if (this.circuitBreakerResetTimer) {
      clearTimeout(this.circuitBreakerResetTimer);
      this.circuitBreakerResetTimer = undefined;
    }

    // Clear in-memory stores
    this.inMemoryStore.clear();
    this.csrfTokenStore.clear();

    // Disconnect Redis client
    if (this.client && this.client.isOpen) {
      try {
        await this.client.quit();
        logger.info('Redis client disconnected and memory cleared');
      } catch (error) {
        logger.error('Failed to disconnect Redis client', { error }, error instanceof Error ? error : undefined);
      }
    }
  }
}

export const redis = new RedisService();

// Only set up cleanup interval if not during build time
if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'production') {
  // Store the cleanup timer in the redis instance for proper cleanup
  (redis as any).cleanupTimer = setInterval(() => {
    redis.cleanup().catch(err =>
      logger.error('Redis cleanup failed', {}, err instanceof Error ? err : undefined)
    );
  }, 5 * 60 * 1000);
}

export default redis;