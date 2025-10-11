/**
 * Telemetry and Tracing Module for AUTO ANI
 *
 * Provides distributed tracing, span management, and business metrics collection
 * for monitoring application performance and business KPIs.
 */

import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';

// Types and interfaces
export interface Span {
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, string | number | boolean>;
  events: Array<{ name: string; time: number; attributes?: Record<string, any> }>;
  status: 'ok' | 'error' | 'timeout';
  duration?: number;
  setAttributes(attributes: Record<string, string | number | boolean>): void;
}

export interface BusinessMetricsData {
  revenue: number;
  orders: number;
  customers: number;
  conversionRate: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  timestamp: number;
}

// BusinessMetrics class for compatibility with existing code
export class BusinessMetrics {
  static cacheHitRate = {
    record(value: number, labels?: Record<string, string>): void {
      // In a real implementation, this would record to a metrics system
      logger.debug('Recording cache hit rate metric', { value, labels });
    }
  };

  static responseTime = {
    record(value: number, labels?: Record<string, string>): void {
      logger.debug('Recording response time metric', { value, labels });
    }
  };

  static requestCount = {
    record(value: number, labels?: Record<string, string>): void {
      logger.debug('Recording request count metric', { value, labels });
    }
  };

  static errorRate = {
    record(value: number, labels?: Record<string, string>): void {
      logger.debug('Recording error rate metric', { value, labels });
    }
  };
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  flags: number;
}

export interface TelemetryConfig {
  enabled: boolean;
  samplingRate: number;
  maxSpanEvents: number;
  maxSpanAttributes: number;
  exportTimeout: number;
  batchTimeout: number;
}

// Default configuration
const DEFAULT_CONFIG: TelemetryConfig = {
  enabled: process.env.TELEMETRY_ENABLED === 'true',
  samplingRate: parseFloat(process.env.TELEMETRY_SAMPLING_RATE || '0.1'),
  maxSpanEvents: parseInt(process.env.TELEMETRY_MAX_SPAN_EVENTS || '128'),
  maxSpanAttributes: parseInt(process.env.TELEMETRY_MAX_SPAN_ATTRIBUTES || '128'),
  exportTimeout: parseInt(process.env.TELEMETRY_EXPORT_TIMEOUT || '30000'),
  batchTimeout: parseInt(process.env.TELEMETRY_BATCH_TIMEOUT || '5000'),
};

/**
 * TraceManager - Main class for managing distributed tracing
 */
export class TraceManager extends EventEmitter {
  private static instance: TraceManager;
  private spans: Map<string, Span> = new Map();
  private activeSpans: Map<string, Span> = new Map();
  private config: TelemetryConfig;
  private isStarted = false;

  constructor(config: Partial<TelemetryConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<TelemetryConfig>): TraceManager {
    if (!TraceManager.instance) {
      TraceManager.instance = new TraceManager(config);
    }
    return TraceManager.instance;
  }

  /**
   * Start the trace manager
   */
  start(): void {
    if (this.isStarted) return;

    this.isStarted = true;
    logger.info('TraceManager started', {
      config: this.config,
      enabled: this.config.enabled
    });

    if (this.config.enabled) {
      this.setupExportTimer();
    }
  }

  /**
   * Stop the trace manager
   */
  stop(): void {
    if (!this.isStarted) return;

    this.isStarted = false;
    this.exportPendingSpans();
    this.spans.clear();
    this.activeSpans.clear();

    logger.info('TraceManager stopped');
  }

  /**
   * Execute a function within a traced span
   */
  static async executeWithSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, string | number | boolean>
  ): Promise<T> {
    const instance = TraceManager.getInstance();
    return instance.executeWithSpan(name, fn, attributes);
  }

  /**
   * Execute a function within a traced span (instance method)
   */
  async executeWithSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes: Record<string, string | number | boolean> = {}
  ): Promise<T> {
    if (!this.config.enabled) {
      // Create a minimal span for the function signature
      const mockSpan: Span = {
        name,
        startTime: Date.now(),
        attributes: {},
        events: [],
        status: 'ok',
        setAttributes: () => {} // No-op for disabled tracing
      };
      return fn(mockSpan);
    }

    const span = this.createSpan(name, attributes);

    try {
      const result = await fn(span);
      this.finishSpan(span.name, 'ok');
      return result;
    } catch (error) {
      this.addSpanEvent(span.name, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      this.finishSpan(span.name, 'error');
      throw error;
    }
  }

  /**
   * Create a new span
   */
  createSpan(name: string, attributes: Record<string, string | number | boolean> = {}): Span {
    const span: Span = {
      name,
      startTime: Date.now(),
      attributes: { ...attributes },
      events: [],
      status: 'ok',
      setAttributes: (newAttributes: Record<string, string | number | boolean>) => {
        Object.assign(span.attributes, newAttributes);
      }
    };

    this.spans.set(name, span);
    this.activeSpans.set(name, span);

    logger.debug('Span created', { name, attributes });
    return span;
  }

  /**
   * Add an event to a span
   */
  addSpanEvent(
    spanName: string,
    eventName: string,
    attributes?: Record<string, any>
  ): void {
    const span = this.activeSpans.get(spanName);
    if (!span) return;

    if (span.events.length >= this.config.maxSpanEvents) {
      span.events.shift(); // Remove oldest event
    }

    span.events.push({
      name: eventName,
      time: Date.now(),
      attributes
    });
  }

  /**
   * Add attributes to a span
   */
  addSpanAttributes(
    spanName: string,
    attributes: Record<string, string | number | boolean>
  ): void {
    const span = this.activeSpans.get(spanName);
    if (!span) return;

    const currentAttrCount = Object.keys(span.attributes).length;
    const newAttrCount = Object.keys(attributes).length;

    if (currentAttrCount + newAttrCount > this.config.maxSpanAttributes) {
      logger.warn('Span attribute limit exceeded', {
        spanName,
        current: currentAttrCount,
        adding: newAttrCount,
        limit: this.config.maxSpanAttributes
      });
    }

    Object.assign(span.attributes, attributes);
  }

  /**
   * Finish a span
   */
  finishSpan(spanName: string, status: 'ok' | 'error' | 'timeout' = 'ok'): void {
    const span = this.activeSpans.get(spanName);
    if (!span) return;

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    this.activeSpans.delete(spanName);

    logger.debug('Span finished', {
      name: spanName,
      duration: span.duration,
      status
    });

    // Emit span finished event
    this.emit('span_finished', span);
  }

  /**
   * Get span by name
   */
  getSpan(spanName: string): Span | undefined {
    return this.spans.get(spanName);
  }

  /**
   * Get all completed spans
   */
  getCompletedSpans(): Span[] {
    return Array.from(this.spans.values()).filter(span => span.endTime);
  }

  /**
   * Get all active spans
   */
  getActiveSpans(): Span[] {
    return Array.from(this.activeSpans.values());
  }

  /**
   * Clear all spans
   */
  clearSpans(): void {
    this.spans.clear();
    this.activeSpans.clear();
    logger.debug('All spans cleared');
  }

  /**
   * Export spans to external system
   */
  private async exportPendingSpans(): Promise<void> {
    const completedSpans = this.getCompletedSpans();
    if (completedSpans.length === 0) return;

    try {
      // In a real implementation, this would export to an observability platform
      // like Jaeger, Zipkin, or OpenTelemetry Collector
      logger.info('Exporting spans', { count: completedSpans.length });

      // Emit export event for external handlers
      this.emit('spans_exported', completedSpans);

      // Clear exported spans
      completedSpans.forEach(span => this.spans.delete(span.name));

    } catch (error) {
      logger.error('Failed to export spans', {
        error: error instanceof Error ? error.message : String(error),
        spanCount: completedSpans.length
      });
    }
  }

  /**
   * Setup timer for periodic span export
   */
  private setupExportTimer(): void {
    setInterval(() => {
      this.exportPendingSpans();
    }, this.config.batchTimeout);
  }

  /**
   * Get telemetry metrics
   */
  getMetrics(): {
    activeSpans: number;
    completedSpans: number;
    totalSpans: number;
    averageSpanDuration: number;
  } {
    const completedSpans = this.getCompletedSpans();
    const avgDuration = completedSpans.length > 0
      ? completedSpans.reduce((sum, span) => sum + (span.duration || 0), 0) / completedSpans.length
      : 0;

    return {
      activeSpans: this.activeSpans.size,
      completedSpans: completedSpans.length,
      totalSpans: this.spans.size,
      averageSpanDuration: avgDuration
    };
  }
}

// Create and export singleton instance
export const traceManager = TraceManager.getInstance();

// Auto-start if enabled
if (DEFAULT_CONFIG.enabled) {
  traceManager.start();
}

// Export static methods for convenience
export { TraceManager as default };