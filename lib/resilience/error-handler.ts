/**
 * Enterprise Error Handling & Resilience Engine for AUTO ANI
 *
 * Provides comprehensive error handling with:
 * - Circuit breaker pattern for external services
 * - Retry mechanisms with exponential backoff
 * - Graceful degradation strategies
 * - Error correlation and tracking
 * - Automatic failover and recovery
 * - Performance impact monitoring
 * - Custom error classification and handling
 *
 * Implements enterprise-grade resilience patterns for production reliability
 */

import { logger } from '@/lib/logger';
import { TraceManager } from '@/lib/observability/telemetry';
import { metricsCollector } from '@/lib/observability/metrics-collector';
import { EventEmitter } from 'events';

// Error handling configuration
const ERROR_HANDLER_CONFIG = {
  circuitBreaker: {
    enabled: process.env.CIRCUIT_BREAKER_ENABLED !== 'false',
    failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5'),
    recoveryTimeout: parseInt(process.env.CIRCUIT_BREAKER_RECOVERY_TIMEOUT || '60000'), // 1 minute
    halfOpenMaxCalls: parseInt(process.env.CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS || '3'),
    monitoringWindow: parseInt(process.env.CIRCUIT_BREAKER_MONITORING_WINDOW || '60000'), // 1 minute
  },

  retry: {
    enabled: process.env.RETRY_ENABLED !== 'false',
    maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS || '3'),
    baseDelay: parseInt(process.env.RETRY_BASE_DELAY || '1000'), // 1 second
    maxDelay: parseInt(process.env.RETRY_MAX_DELAY || '30000'), // 30 seconds
    backoffMultiplier: parseFloat(process.env.RETRY_BACKOFF_MULTIPLIER || '2'),
    jitter: process.env.RETRY_JITTER_ENABLED !== 'false',
  },

  timeout: {
    enabled: process.env.TIMEOUT_ENABLED !== 'false',
    defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '30000'), // 30 seconds
    databaseTimeout: parseInt(process.env.DATABASE_TIMEOUT || '10000'), // 10 seconds
    externalApiTimeout: parseInt(process.env.EXTERNAL_API_TIMEOUT || '15000'), // 15 seconds
    fileOperationTimeout: parseInt(process.env.FILE_OPERATION_TIMEOUT || '5000'), // 5 seconds
  },

  degradation: {
    enabled: process.env.GRACEFUL_DEGRADATION_ENABLED !== 'false',
    fallbackCacheEnabled: process.env.FALLBACK_CACHE_ENABLED !== 'false',
    fallbackCacheTTL: parseInt(process.env.FALLBACK_CACHE_TTL || '3600'), // 1 hour
    readOnlyModeEnabled: process.env.READ_ONLY_MODE_ENABLED === 'true',
    maintenanceModeEnabled: process.env.MAINTENANCE_MODE_ENABLED === 'true',
  },

  monitoring: {
    enabled: process.env.ERROR_MONITORING_ENABLED !== 'false',
    errorAggregationWindow: parseInt(process.env.ERROR_AGGREGATION_WINDOW || '300000'), // 5 minutes
    errorRateThreshold: parseFloat(process.env.ERROR_RATE_THRESHOLD || '0.05'), // 5%
    criticalErrorThreshold: parseInt(process.env.CRITICAL_ERROR_THRESHOLD || '10'),
  },
};

// Error types and classification
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  NETWORK = 'network',
  INTERNAL = 'internal',
  TIMEOUT = 'timeout',
  CIRCUIT_BREAKER = 'circuit_breaker',
}

export interface ErrorContext {
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  operation?: string;
  service?: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
  timestamp: number;
}

export interface ErrorMetrics {
  category: ErrorCategory;
  severity: ErrorSeverity;
  count: number;
  lastOccurred: number;
  averageResponseTime?: number;
  impactedUsers?: number;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  successCount: number;
}

/**
 * Custom error classes for different scenarios
 */
export class AppError extends Error {
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly context: ErrorContext;
  public readonly retryable: boolean;

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    retryable: boolean = false,
    context: Partial<ErrorContext> = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.category = category;
    this.severity = severity;
    this.retryable = retryable;
    this.context = {
      timestamp: Date.now(),
      stackTrace: this.stack,
      ...context,
    };

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context: Partial<ErrorContext> = {}) {
    super(message, ErrorCategory.VALIDATION, ErrorSeverity.LOW, false, context);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, context: Partial<ErrorContext> = {}) {
    super(message, ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH, false, context);
    this.name = 'AuthenticationError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, context: Partial<ErrorContext> = {}) {
    super(message, ErrorCategory.EXTERNAL_SERVICE, ErrorSeverity.MEDIUM, true, context);
    this.name = 'ExternalServiceError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context: Partial<ErrorContext> = {}) {
    super(message, ErrorCategory.DATABASE, ErrorSeverity.HIGH, true, context);
    this.name = 'DatabaseError';
  }
}

export class TimeoutError extends AppError {
  constructor(message: string, operation: string, timeout: number, context: Partial<ErrorContext> = {}) {
    super(
      `Operation '${operation}' timed out after ${timeout}ms: ${message}`,
      ErrorCategory.TIMEOUT,
      ErrorSeverity.MEDIUM,
      true,
      { operation, ...context }
    );
    this.name = 'TimeoutError';
  }
}

export class CircuitBreakerError extends AppError {
  constructor(service: string, context: Partial<ErrorContext> = {}) {
    super(
      `Circuit breaker is open for service: ${service}`,
      ErrorCategory.CIRCUIT_BREAKER,
      ErrorSeverity.HIGH,
      false,
      { service, ...context }
    );
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker extends EventEmitter {
  private state: CircuitBreakerState;

  constructor(
    private serviceName: string,
    private options = ERROR_HANDLER_CONFIG.circuitBreaker
  ) {
    super();
    this.state = {
      state: 'closed',
      failures: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      successCount: 0,
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state.state === 'open') {
      if (Date.now() < this.state.nextAttemptTime) {
        throw new CircuitBreakerError(this.serviceName);
      }
      this.state.state = 'half-open';
      this.state.successCount = 0;
      this.emit('state_change', { service: this.serviceName, state: 'half-open' });
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
    if (this.state.state === 'half-open') {
      this.state.successCount++;
      if (this.state.successCount >= this.options.halfOpenMaxCalls) {
        this.state.state = 'closed';
        this.state.failures = 0;
        this.emit('state_change', { service: this.serviceName, state: 'closed' });
      }
    } else if (this.state.state === 'closed') {
      this.state.failures = 0;
    }
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    if (this.state.failures >= this.options.failureThreshold) {
      this.state.state = 'open';
      this.state.nextAttemptTime = Date.now() + this.options.recoveryTimeout;
      this.emit('state_change', { service: this.serviceName, state: 'open' });
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      state: 'closed',
      failures: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      successCount: 0,
    };
    this.emit('state_change', { service: this.serviceName, state: 'closed' });
  }
}

/**
 * Retry mechanism with exponential backoff
 */
class RetryManager {
  async execute<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number;
      baseDelay?: number;
      maxDelay?: number;
      backoffMultiplier?: number;
      retryCondition?: (error: any) => boolean;
      onRetry?: (attempt: number, error: any) => void;
    } = {}
  ): Promise<T> {
    const config = { ...ERROR_HANDLER_CONFIG.retry, ...options };
    let lastError: any;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (config.retryCondition && !config.retryCondition(error)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === config.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = config.jitter
          ? delay * (0.5 + Math.random() * 0.5)
          : delay;

        logger.warn('Operation failed, retrying', {
          attempt,
          maxAttempts: config.maxAttempts,
          delay: Math.round(jitteredDelay),
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        if (config.onRetry) {
          config.onRetry(attempt, error);
        }

        await this.sleep(jitteredDelay);
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Timeout manager for operations
 */
class TimeoutManager {
  async execute<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    operationName: string = 'operation'
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new TimeoutError('Operation timed out', operationName, timeoutMs));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }
}

/**
 * Main Error Handler and Resilience Engine
 */
export class ErrorHandler extends EventEmitter {
  private static instance: ErrorHandler;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryManager: RetryManager = new RetryManager();
  private timeoutManager: TimeoutManager = new TimeoutManager();
  private errorMetrics: Map<string, ErrorMetrics> = new Map();
  private fallbackCache: Map<string, { data: any; timestamp: number }> = new Map();

  private constructor() {
    super();
    this.startErrorMonitoring();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Execute operation with full resilience patterns
   */
  async executeWithResilience<T>(
    operation: () => Promise<T>,
    options: {
      serviceName?: string;
      timeoutMs?: number;
      retryOptions?: any;
      fallbackData?: T;
      fallbackCacheKey?: string;
      context?: Partial<ErrorContext>;
    } = {}
  ): Promise<T> {
    const {
      serviceName = 'default',
      timeoutMs = ERROR_HANDLER_CONFIG.timeout.defaultTimeout,
      retryOptions = {},
      fallbackData,
      fallbackCacheKey,
      context = {},
    } = options;

    return TraceManager.executeWithSpan(
      'resilience.execute_with_resilience',
      async (span) => {
        span.setAttributes({
          'resilience.service': serviceName,
          'resilience.timeout_ms': timeoutMs,
          'resilience.has_fallback': !!fallbackData || !!fallbackCacheKey,
        });

        try {
          // Get or create circuit breaker
          const circuitBreaker = this.getCircuitBreaker(serviceName);

          // Execute with circuit breaker, retry, and timeout
          const result = await circuitBreaker.execute(async () => {
            return this.retryManager.execute(async () => {
              return this.timeoutManager.execute(operation, timeoutMs, serviceName);
            }, {
              retryCondition: (error) => this.isRetryableError(error),
              onRetry: (attempt, error) => {
                this.recordError(error, context);
                span.setAttributes({ 'resilience.retry_attempt': attempt });
              },
              ...retryOptions,
            });
          });

          // Cache successful result for fallback
          if (fallbackCacheKey && ERROR_HANDLER_CONFIG.degradation.fallbackCacheEnabled) {
            this.storeFallbackData(fallbackCacheKey, result);
          }

          span.setAttributes({ 'resilience.success': true });
          return result;

        } catch (error) {
          this.recordError(error, context);
          span.setAttributes({ 'resilience.success': false });

          // Try fallback strategies
          const fallbackResult = await this.tryFallback(fallbackData, fallbackCacheKey);
          if (fallbackResult !== undefined) {
            span.setAttributes({ 'resilience.fallback_used': true });
            logger.warn('Using fallback data due to error', {
              serviceName,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            return fallbackResult;
          }

          // No fallback available, throw enhanced error
          throw this.enhanceError(error, context);
        }
      }
    );
  }

  /**
   * Execute with timeout only
   */
  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    operationName: string = 'operation',
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    try {
      return await this.timeoutManager.execute(operation, timeoutMs, operationName);
    } catch (error) {
      this.recordError(error, context);
      throw this.enhanceError(error, context);
    }
  }

  /**
   * Execute with retry only
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryOptions: any = {},
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    try {
      return await this.retryManager.execute(operation, {
        retryCondition: (error) => this.isRetryableError(error),
        onRetry: (attempt, error) => this.recordError(error, context),
        ...retryOptions,
      });
    } catch (error) {
      this.recordError(error, context);
      throw this.enhanceError(error, context);
    }
  }

  /**
   * Get or create circuit breaker for service
   */
  private getCircuitBreaker(serviceName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      const circuitBreaker = new CircuitBreaker(serviceName);

      // Listen for state changes
      circuitBreaker.on('state_change', (event) => {
        logger.info('Circuit breaker state changed', event);
        this.emit('circuit_breaker_state_change', event);
      });

      this.circuitBreakers.set(serviceName, circuitBreaker);
    }

    return this.circuitBreakers.get(serviceName)!;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof AppError) {
      return error.retryable;
    }

    // Network errors are usually retryable
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // HTTP 5xx errors are retryable
    if (error.response?.status >= 500) {
      return true;
    }

    // Rate limit errors might be retryable with backoff
    if (error.response?.status === 429) {
      return true;
    }

    return false;
  }

  /**
   * Try fallback strategies
   */
  private async tryFallback<T>(fallbackData?: T, fallbackCacheKey?: string): Promise<T | undefined> {
    // Try explicit fallback data first
    if (fallbackData !== undefined) {
      return fallbackData;
    }

    // Try cached fallback data
    if (fallbackCacheKey && ERROR_HANDLER_CONFIG.degradation.fallbackCacheEnabled) {
      const cached = this.fallbackCache.get(fallbackCacheKey);
      if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < ERROR_HANDLER_CONFIG.degradation.fallbackCacheTTL * 1000) {
          return cached.data;
        }
      }
    }

    return undefined;
  }

  /**
   * Store data for fallback use
   */
  private storeFallbackData(key: string, data: any): void {
    this.fallbackCache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      timestamp: Date.now(),
    });

    // Cleanup old entries
    const maxAge = ERROR_HANDLER_CONFIG.degradation.fallbackCacheTTL * 1000;
    const cutoff = Date.now() - maxAge;

    for (const [cacheKey, cached] of this.fallbackCache.entries()) {
      if (cached.timestamp < cutoff) {
        this.fallbackCache.delete(cacheKey);
      }
    }
  }

  /**
   * Record error metrics
   */
  private recordError(error: any, context: Partial<ErrorContext>): void {
    const category = this.classifyError(error);
    const severity = this.determineSeverity(error);
    const key = `${category}:${severity}`;

    if (!this.errorMetrics.has(key)) {
      this.errorMetrics.set(key, {
        category,
        severity,
        count: 0,
        lastOccurred: 0,
      });
    }

    const metrics = this.errorMetrics.get(key)!;
    metrics.count++;
    metrics.lastOccurred = Date.now();

    // Record to monitoring system
    metricsCollector.recordTechnicalMetric('errorCount', 1, {
      category,
      severity,
      service: context.service || 'unknown',
    });

    // Log error with context
    const logLevel = severity === ErrorSeverity.CRITICAL ? 'error' : 'warn';
    logger[logLevel]('Error recorded', {
      category,
      severity,
      message: error instanceof Error ? error.message : 'Unknown error',
      ...context,
    });
  }

  /**
   * Classify error into category
   */
  private classifyError(error: any): ErrorCategory {
    if (error instanceof AppError) {
      return error.category;
    }

    if (error instanceof TimeoutError) {
      return ErrorCategory.TIMEOUT;
    }

    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
      return ErrorCategory.NETWORK;
    }

    if (error.response?.status === 401) {
      return ErrorCategory.AUTHENTICATION;
    }

    if (error.response?.status === 403) {
      return ErrorCategory.AUTHORIZATION;
    }

    if (error.response?.status === 404) {
      return ErrorCategory.NOT_FOUND;
    }

    if (error.response?.status === 429) {
      return ErrorCategory.RATE_LIMIT;
    }

    if (error.response?.status >= 500) {
      return ErrorCategory.EXTERNAL_SERVICE;
    }

    return ErrorCategory.INTERNAL;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: any): ErrorSeverity {
    if (error instanceof AppError) {
      return error.severity;
    }

    if (error instanceof TimeoutError) {
      return ErrorSeverity.MEDIUM;
    }

    if (error.response?.status >= 500) {
      return ErrorSeverity.HIGH;
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      return ErrorSeverity.HIGH;
    }

    return ErrorSeverity.MEDIUM;
  }

  /**
   * Enhance error with additional context
   */
  private enhanceError(error: any, context: Partial<ErrorContext>): Error {
    if (error instanceof AppError) {
      // Add additional context to existing AppError
      Object.assign(error.context, context);
      return error;
    }

    // Wrap other errors in AppError
    const category = this.classifyError(error);
    const severity = this.determineSeverity(error);

    return new AppError(
      error.message || 'Unknown error occurred',
      category,
      severity,
      this.isRetryableError(error),
      context
    );
  }

  /**
   * Start error monitoring and alerting
   */
  private startErrorMonitoring(): void {
    setInterval(() => {
      this.analyzeErrorMetrics();
      this.cleanupOldMetrics();
    }, ERROR_HANDLER_CONFIG.monitoring.errorAggregationWindow);
  }

  /**
   * Analyze error metrics for alerting
   */
  private analyzeErrorMetrics(): void {
    const now = Date.now();
    const window = ERROR_HANDLER_CONFIG.monitoring.errorAggregationWindow;
    let totalErrors = 0;
    let criticalErrors = 0;

    for (const metrics of this.errorMetrics.values()) {
      if (now - metrics.lastOccurred < window) {
        totalErrors += metrics.count;
        if (metrics.severity === ErrorSeverity.CRITICAL) {
          criticalErrors += metrics.count;
        }
      }
    }

    // Check thresholds
    if (criticalErrors > ERROR_HANDLER_CONFIG.monitoring.criticalErrorThreshold) {
      this.emit('critical_error_threshold_exceeded', { criticalErrors, window });
      logger.error('Critical error threshold exceeded', { criticalErrors, window });
    }

    // Reset counters for next window
    for (const metrics of this.errorMetrics.values()) {
      metrics.count = 0;
    }
  }

  /**
   * Cleanup old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

    for (const [key, metrics] of this.errorMetrics.entries()) {
      if (metrics.lastOccurred < cutoff) {
        this.errorMetrics.delete(key);
      }
    }
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    circuitBreakers: Record<string, CircuitBreakerState>;
    fallbackCacheSize: number;
  } {
    const errorsByCategory: Record<ErrorCategory, number> = {} as any;
    const errorsBySeverity: Record<ErrorSeverity, number> = {} as any;
    let totalErrors = 0;

    for (const metrics of this.errorMetrics.values()) {
      totalErrors += metrics.count;
      errorsByCategory[metrics.category] = (errorsByCategory[metrics.category] || 0) + metrics.count;
      errorsBySeverity[metrics.severity] = (errorsBySeverity[metrics.severity] || 0) + metrics.count;
    }

    const circuitBreakers: Record<string, CircuitBreakerState> = {};
    for (const [name, breaker] of this.circuitBreakers.entries()) {
      circuitBreakers[name] = breaker.getState();
    }

    return {
      totalErrors,
      errorsByCategory,
      errorsBySeverity,
      circuitBreakers,
      fallbackCacheSize: this.fallbackCache.size,
    };
  }

  /**
   * Reset circuit breaker for service
   */
  resetCircuitBreaker(serviceName: string): void {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.reset();
      logger.info('Circuit breaker reset', { serviceName });
    }
  }

  /**
   * Enable/disable graceful degradation mode
   */
  setGracefulDegradationMode(enabled: boolean): void {
    ERROR_HANDLER_CONFIG.degradation.enabled = enabled;
    logger.info('Graceful degradation mode changed', { enabled });
    this.emit('degradation_mode_changed', { enabled });
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Export configuration for reference
export { ERROR_HANDLER_CONFIG };