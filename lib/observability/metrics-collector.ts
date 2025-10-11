/**
 * Metrics Collection Engine for AUTO ANI
 *
 * Provides comprehensive business and technical metrics collection,
 * SLA monitoring, and real-time alerting capabilities.
 */

import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';

// Types and interfaces
export interface SLAViolation {
  id: string;
  metric: string;
  threshold: number;
  actual: number; // Changed from actualValue to actual
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  description: string;
  affectedService?: string;
  impact?: string;
  resolution?: string;
}

export interface BusinessMetric {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

export interface TechnicalMetric {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

export interface MetricsConfig {
  enabled: boolean;
  retentionPeriod: number;
  exportInterval: number;
  maxMetricsInMemory: number;
  sla: {
    errorRateThreshold: number;
    uptimeThreshold: number;
    availabilityThreshold: number;
  };
  slaThresholds: Record<string, {
    threshold: number;
    severity: SLAViolation['severity'];
    description: string;
  }>;
  alerting: {
    enabled: boolean;
    channels: string[];
    cooldownPeriod: number;
  };
}

// Default configuration
export const METRICS_CONFIG: MetricsConfig = {
  enabled: process.env.METRICS_ENABLED === 'true',
  retentionPeriod: parseInt(process.env.METRICS_RETENTION_PERIOD || '86400000'), // 24 hours
  exportInterval: parseInt(process.env.METRICS_EXPORT_INTERVAL || '60000'), // 1 minute
  maxMetricsInMemory: parseInt(process.env.METRICS_MAX_IN_MEMORY || '10000'),

  // SLA configuration for backward compatibility
  sla: {
    errorRateThreshold: 0.05, // 5%
    uptimeThreshold: 0.99, // 99%
    availabilityThreshold: 0.995, // 99.5%
  },

  slaThresholds: {
    // Response time SLAs
    'apiResponseTime': {
      threshold: 2.0, // 2 seconds
      severity: 'high',
      description: 'API response time exceeds 2 seconds'
    },
    'dbQueryDuration': {
      threshold: 1.0, // 1 second
      severity: 'medium',
      description: 'Database query duration exceeds 1 second'
    },
    'pageLoadTime': {
      threshold: 3.0, // 3 seconds
      severity: 'medium',
      description: 'Page load time exceeds 3 seconds'
    },

    // Error rate SLAs
    'errorRate': {
      threshold: 0.05, // 5%
      severity: 'high',
      description: 'Error rate exceeds 5%'
    },
    'dbErrorRate': {
      threshold: 0.01, // 1%
      severity: 'critical',
      description: 'Database error rate exceeds 1%'
    },

    // Business metric SLAs
    'conversionRate': {
      threshold: 0.02, // 2% minimum
      severity: 'low',
      description: 'Conversion rate below 2%'
    },
    'customerSatisfaction': {
      threshold: 4.0, // 4.0/5.0 minimum
      severity: 'medium',
      description: 'Customer satisfaction below 4.0'
    }
  },

  alerting: {
    enabled: process.env.METRICS_ALERTING_ENABLED === 'true',
    channels: ['email', 'slack'],
    cooldownPeriod: parseInt(process.env.METRICS_ALERT_COOLDOWN || '300000') // 5 minutes
  }
};

/**
 * MetricsCollector - Main class for collecting and managing metrics
 */
export class MetricsCollector extends EventEmitter {
  private static instance: MetricsCollector;
  private businessMetrics: Map<string, BusinessMetric[]> = new Map();
  private technicalMetrics: Map<string, TechnicalMetric[]> = new Map();
  private slaViolations: SLAViolation[] = [];
  private isStarted = false;
  private exportTimer?: NodeJS.Timeout;
  private alertCooldowns: Map<string, number> = new Map();

  constructor() {
    super();
    this.setMaxListeners(20); // Increase listener limit for monitoring
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * Start the metrics collector
   */
  start(): void {
    if (this.isStarted || !METRICS_CONFIG.enabled) return;

    this.isStarted = true;
    logger.info('MetricsCollector started', {
      config: METRICS_CONFIG,
      enabled: METRICS_CONFIG.enabled
    });

    this.setupExportTimer();
    this.setupCleanupTimer();
  }

  /**
   * Stop the metrics collector
   */
  stop(): void {
    if (!this.isStarted) return;

    this.isStarted = false;

    if (this.exportTimer) {
      clearInterval(this.exportTimer);
    }

    this.exportPendingMetrics();
    logger.info('MetricsCollector stopped');
  }

  /**
   * Record a business metric
   */
  recordBusinessMetric(
    name: string,
    value: number,
    labels?: Record<string, string>,
    type: BusinessMetric['type'] = 'gauge'
  ): void {
    if (!METRICS_CONFIG.enabled) return;

    const metric: BusinessMetric = {
      name,
      value,
      timestamp: Date.now(),
      labels,
      type
    };

    // Store metric
    if (!this.businessMetrics.has(name)) {
      this.businessMetrics.set(name, []);
    }

    const metrics = this.businessMetrics.get(name)!;
    metrics.push(metric);

    // Limit memory usage
    if (metrics.length > METRICS_CONFIG.maxMetricsInMemory) {
      metrics.shift();
    }

    // Check for SLA violations
    this.checkSLAViolation(name, value, 'business');

    // Emit event
    this.emit('metric_recorded', { name, value, labels, type: 'business' });

    logger.debug('Business metric recorded', { name, value, labels, type });
  }

  /**
   * Record a technical metric
   */
  recordTechnicalMetric(
    name: string,
    value: number,
    labels?: Record<string, string>,
    type: TechnicalMetric['type'] = 'gauge'
  ): void {
    if (!METRICS_CONFIG.enabled) return;

    const metric: TechnicalMetric = {
      name,
      value,
      timestamp: Date.now(),
      labels,
      type
    };

    // Store metric
    if (!this.technicalMetrics.has(name)) {
      this.technicalMetrics.set(name, []);
    }

    const metrics = this.technicalMetrics.get(name)!;
    metrics.push(metric);

    // Limit memory usage
    if (metrics.length > METRICS_CONFIG.maxMetricsInMemory) {
      metrics.shift();
    }

    // Check for SLA violations
    this.checkSLAViolation(name, value, 'technical');

    // Emit event
    this.emit('metric_recorded', { name, value, labels, type: 'technical' });

    logger.debug('Technical metric recorded', { name, value, labels, type });
  }

  /**
   * Check for SLA violations
   */
  private checkSLAViolation(
    metricName: string,
    value: number,
    category: 'business' | 'technical'
  ): void {
    const slaConfig = METRICS_CONFIG.slaThresholds[metricName];
    if (!slaConfig) return;

    const isViolation = value > slaConfig.threshold;
    if (!isViolation) return;

    // Check cooldown to prevent spam
    const cooldownKey = `${metricName}_${slaConfig.severity}`;
    const lastAlert = this.alertCooldowns.get(cooldownKey) || 0;
    const now = Date.now();

    if (now - lastAlert < METRICS_CONFIG.alerting.cooldownPeriod) {
      return; // Still in cooldown
    }

    const violation: SLAViolation = {
      id: `sla_${metricName}_${now}`,
      metric: metricName,
      threshold: slaConfig.threshold,
      actual: value, // Changed from actualValue to actual
      severity: slaConfig.severity,
      timestamp: now,
      description: slaConfig.description,
      affectedService: category === 'business' ? 'Business Operations' : 'Technical Infrastructure'
    };

    this.slaViolations.push(violation);
    this.alertCooldowns.set(cooldownKey, now);

    // Emit SLA violation event
    this.emit('sla_violation', violation);

    logger.warn('SLA violation detected', {
      metric: metricName,
      threshold: slaConfig.threshold,
      actualValue: value,
      severity: slaConfig.severity
    });
  }

  /**
   * Get business metrics by name
   */
  getBusinessMetrics(name: string, limit?: number): BusinessMetric[] {
    const metrics = this.businessMetrics.get(name) || [];
    return limit ? metrics.slice(-limit) : metrics;
  }

  /**
   * Get technical metrics by name
   */
  getTechnicalMetrics(name: string, limit?: number): TechnicalMetric[] {
    const metrics = this.technicalMetrics.get(name) || [];
    return limit ? metrics.slice(-limit) : metrics;
  }

  /**
   * Get all business metric names
   */
  getBusinessMetricNames(): string[] {
    return Array.from(this.businessMetrics.keys());
  }

  /**
   * Get all technical metric names
   */
  getTechnicalMetricNames(): string[] {
    return Array.from(this.technicalMetrics.keys());
  }

  /**
   * Get recent SLA violations
   */
  getSLAViolations(limit?: number): SLAViolation[] {
    return limit ? this.slaViolations.slice(-limit) : this.slaViolations;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.businessMetrics.clear();
    this.technicalMetrics.clear();
    this.slaViolations.length = 0;
    this.alertCooldowns.clear();
    logger.info('All metrics cleared');
  }

  /**
   * Get aggregated statistics
   */
  getMetricsStats(): {
    businessMetrics: { name: string; count: number; latest: number }[];
    technicalMetrics: { name: string; count: number; latest: number }[];
    slaViolations: number;
    memoryUsage: number;
  } {
    const businessStats = Array.from(this.businessMetrics.entries()).map(([name, metrics]) => ({
      name,
      count: metrics.length,
      latest: metrics[metrics.length - 1]?.value || 0
    }));

    const technicalStats = Array.from(this.technicalMetrics.entries()).map(([name, metrics]) => ({
      name,
      count: metrics.length,
      latest: metrics[metrics.length - 1]?.value || 0
    }));

    const totalMetrics = businessStats.reduce((sum, stat) => sum + stat.count, 0) +
                        technicalStats.reduce((sum, stat) => sum + stat.count, 0);

    return {
      businessMetrics: businessStats,
      technicalMetrics: technicalStats,
      slaViolations: this.slaViolations.length,
      memoryUsage: totalMetrics
    };
  }

  /**
   * Export metrics to external system
   */
  private async exportPendingMetrics(): Promise<void> {
    if (!METRICS_CONFIG.enabled) return;

    try {
      const stats = this.getMetricsStats();

      // In a real implementation, this would export to monitoring systems
      // like Prometheus, InfluxDB, or CloudWatch
      logger.info('Exporting metrics', {
        businessMetrics: stats.businessMetrics.length,
        technicalMetrics: stats.technicalMetrics.length,
        slaViolations: stats.slaViolations,
        memoryUsage: stats.memoryUsage
      });

      // Emit export event for external handlers
      this.emit('metrics_exported', {
        business: this.businessMetrics,
        technical: this.technicalMetrics,
        violations: this.slaViolations
      });

    } catch (error) {
      logger.error('Failed to export metrics', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Setup timer for periodic metric export
   */
  private setupExportTimer(): void {
    this.exportTimer = setInterval(() => {
      this.exportPendingMetrics();
    }, METRICS_CONFIG.exportInterval);
  }

  /**
   * Setup timer for metric cleanup
   */
  private setupCleanupTimer(): void {
    setInterval(() => {
      const cutoff = Date.now() - METRICS_CONFIG.retentionPeriod;

      // Clean old business metrics
      this.businessMetrics.forEach((metrics, name) => {
        const filtered = metrics.filter(metric => metric.timestamp > cutoff);
        this.businessMetrics.set(name, filtered);
      });

      // Clean old technical metrics
      this.technicalMetrics.forEach((metrics, name) => {
        const filtered = metrics.filter(metric => metric.timestamp > cutoff);
        this.technicalMetrics.set(name, filtered);
      });

      // Clean old SLA violations
      this.slaViolations = this.slaViolations.filter(violation => violation.timestamp > cutoff);

      // Clean old alert cooldowns
      this.alertCooldowns.forEach((timestamp, key) => {
        if (timestamp < cutoff) {
          this.alertCooldowns.delete(key);
        }
      });

    }, METRICS_CONFIG.exportInterval * 5); // Clean up every 5 export intervals
  }
}

// Create and export singleton instance
export const metricsCollector = MetricsCollector.getInstance();

// Auto-start if enabled
if (METRICS_CONFIG.enabled) {
  metricsCollector.start();
}

// Export for convenience
export { MetricsCollector as default };