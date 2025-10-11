/**
 * Memory Monitoring and Leak Detection System for AUTO ANI
 *
 * Provides comprehensive memory monitoring with:
 * - Real-time memory usage tracking
 * - Memory leak detection and alerting
 * - Component-level memory profiling
 * - Automated cleanup recommendations
 * - Memory usage reporting and analytics
 */

import { logger } from '@/lib/logger';
import { EventEmitter } from 'events';

// Memory monitoring configuration
const MEMORY_CONFIG = {
  monitoring: {
    interval: parseInt(process.env.MEMORY_MONITOR_INTERVAL || '30000'), // 30 seconds
    leakThreshold: parseInt(process.env.MEMORY_LEAK_THRESHOLD || '100'), // 100MB growth
    criticalThreshold: parseInt(process.env.MEMORY_CRITICAL_THRESHOLD || '1024'), // 1GB
    maxHistoryPoints: parseInt(process.env.MEMORY_HISTORY_POINTS || '288'), // 24 hours at 5min intervals
  },
  alerts: {
    enabled: process.env.MEMORY_ALERTS_ENABLED === 'true',
    webhookUrl: process.env.MEMORY_ALERT_WEBHOOK_URL,
    cooldownPeriod: parseInt(process.env.MEMORY_ALERT_COOLDOWN || '300000'), // 5 minutes
  },
  profiling: {
    enabled: process.env.MEMORY_PROFILING_ENABLED === 'true',
    gcForced: process.env.FORCE_GC_ENABLED === 'true',
    heapSnapshotPath: process.env.HEAP_SNAPSHOT_PATH || './memory-snapshots',
  },
};

// Memory monitoring types
export interface MemorySnapshot {
  timestamp: number;
  rss: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

export interface MemoryLeak {
  component: string;
  type: 'heap' | 'rss' | 'external' | 'observers' | 'timers';
  severity: 'warning' | 'critical';
  growthRate: number; // MB per minute
  duration: number; // milliseconds
  firstDetected: number;
  lastUpdate: number;
  suggestions: string[];
}

export interface MemoryReport {
  summary: {
    current: MemorySnapshot;
    peak: MemorySnapshot;
    trend: 'increasing' | 'decreasing' | 'stable';
    efficiency: number; // percentage
  };
  leaks: MemoryLeak[];
  recommendations: string[];
  componentBreakdown: Record<string, number>;
}

/**
 * Memory Monitoring System
 */
export class MemoryMonitor extends EventEmitter {
  private static instance: MemoryMonitor;
  private isMonitoring = false;
  private monitoringTimer?: NodeJS.Timeout;
  private memoryHistory: MemorySnapshot[] = [];
  private detectedLeaks: Map<string, MemoryLeak> = new Map();
  private lastAlertTime: Map<string, number> = new Map();
  private componentMetrics: Map<string, { size: number; instances: number }> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  /**
   * Start memory monitoring
   */
  start(): void {
    if (this.isMonitoring) {
      logger.warn('Memory monitoring already started');
      return;
    }

    this.isMonitoring = true;
    this.monitoringTimer = setInterval(() => {
      this.collectMemoryMetrics();
    }, MEMORY_CONFIG.monitoring.interval);

    // Initial memory snapshot
    this.collectMemoryMetrics();

    logger.info('Memory monitoring started', {
      interval: MEMORY_CONFIG.monitoring.interval,
      leakThreshold: MEMORY_CONFIG.monitoring.leakThreshold,
    });
  }

  /**
   * Stop memory monitoring
   */
  stop(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }

    this.isMonitoring = false;
    this.memoryHistory = [];
    this.detectedLeaks.clear();
    this.lastAlertTime.clear();
    this.componentMetrics.clear();

    logger.info('Memory monitoring stopped and data cleared');
  }

  /**
   * Collect current memory metrics
   */
  private collectMemoryMetrics(): void {
    try {
      const memUsage = process.memoryUsage();
      const snapshot: MemorySnapshot = {
        timestamp: Date.now(),
        rss: Math.round(memUsage.rss / 1024 / 1024), // Convert to MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        arrayBuffers: Math.round((memUsage as any).arrayBuffers / 1024 / 1024 || 0),
      };

      this.memoryHistory.push(snapshot);

      // Keep history within limits
      if (this.memoryHistory.length > MEMORY_CONFIG.monitoring.maxHistoryPoints) {
        this.memoryHistory.shift();
      }

      // Metrics reporting disabled (metrics collector removed for memory optimization)

      // Detect memory leaks
      this.detectMemoryLeaks(snapshot);

      // Check for critical memory usage
      this.checkCriticalMemory(snapshot);

      // Emit memory update event
      this.emit('memory_update', snapshot);

    } catch (error) {
      logger.error('Error collecting memory metrics', {}, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Detect memory leaks based on growth patterns
   */
  private detectMemoryLeaks(current: MemorySnapshot): void {
    if (this.memoryHistory.length < 10) {
      return; // Need sufficient history for leak detection
    }

    const tenMinutesAgo = current.timestamp - (10 * 60 * 1000);
    const recentHistory = this.memoryHistory.filter(snap => snap.timestamp > tenMinutesAgo);

    if (recentHistory.length < 5) {
      return;
    }

    // Check heap memory growth
    const heapGrowth = this.calculateGrowthRate(recentHistory.map(s => s.heapUsed));
    if (heapGrowth > 5) { // 5MB per minute growth
      this.recordLeak('heap', heapGrowth, current.timestamp);
    }

    // Check RSS memory growth
    const rssGrowth = this.calculateGrowthRate(recentHistory.map(s => s.rss));
    if (rssGrowth > 10) { // 10MB per minute growth
      this.recordLeak('rss', rssGrowth, current.timestamp);
    }

    // Check external memory growth
    const externalGrowth = this.calculateGrowthRate(recentHistory.map(s => s.external));
    if (externalGrowth > 2) { // 2MB per minute growth
      this.recordLeak('external', externalGrowth, current.timestamp);
    }
  }

  /**
   * Calculate growth rate in MB per minute
   */
  private calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;

    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const growth = lastValue - firstValue;
    const timespan = (values.length - 1) * (MEMORY_CONFIG.monitoring.interval / 60000); // minutes

    return timespan > 0 ? growth / timespan : 0;
  }

  /**
   * Record a detected memory leak
   */
  private recordLeak(type: MemoryLeak['type'], growthRate: number, timestamp: number): void {
    const leakId = `${type}_leak`;
    const existing = this.detectedLeaks.get(leakId);

    if (existing) {
      existing.growthRate = growthRate;
      existing.lastUpdate = timestamp;
      existing.duration = timestamp - existing.firstDetected;
    } else {
      const leak: MemoryLeak = {
        component: 'system',
        type,
        severity: growthRate > 20 ? 'critical' : 'warning',
        growthRate,
        duration: 0,
        firstDetected: timestamp,
        lastUpdate: timestamp,
        suggestions: this.generateLeakSuggestions(type),
      };

      this.detectedLeaks.set(leakId, leak);
      this.emit('memory_leak_detected', leak);

      logger.warn('Memory leak detected', {
        type,
        growthRate: `${growthRate.toFixed(2)} MB/min`,
        severity: leak.severity,
      });

      this.sendAlert(leak);
    }
  }

  /**
   * Generate suggestions for fixing memory leaks
   */
  private generateLeakSuggestions(type: MemoryLeak['type']): string[] {
    const suggestions: Record<MemoryLeak['type'], string[]> = {
      heap: [
        'Check for unclosed event listeners in React components',
        'Verify useEffect cleanup functions are properly implemented',
        'Look for circular references in object structures',
        'Review large data structures and consider pagination',
        'Check for memory-intensive libraries without cleanup',
      ],
      rss: [
        'Review buffer usage and ensure proper disposal',
        'Check for file handles that are not being closed',
        'Investigate child processes that may not be terminating',
        'Review image processing and ensure proper cleanup',
      ],
      external: [
        'Check native modules for proper resource cleanup',
        'Review database connection pooling configuration',
        'Investigate WebAssembly modules for memory management',
        'Check for large external library allocations',
      ],
      observers: [
        'Ensure PerformanceObserver instances are disconnected',
        'Check MutationObserver and IntersectionObserver cleanup',
        'Review WebRTC connections for proper closure',
        'Verify WebSocket connections are being closed',
      ],
      timers: [
        'Check for setInterval/setTimeout without clearInterval/clearTimeout',
        'Review React component timers for cleanup in useEffect',
        'Investigate background processes that may be accumulating',
        'Check for animation frames that are not being cancelled',
      ],
    };

    return suggestions[type] || ['Review memory usage patterns and implement proper cleanup'];
  }

  /**
   * Check for critical memory usage
   */
  private checkCriticalMemory(snapshot: MemorySnapshot): void {
    const criticalThreshold = MEMORY_CONFIG.monitoring.criticalThreshold;

    if (snapshot.heapUsed > criticalThreshold || snapshot.rss > criticalThreshold) {
      const alert = {
        type: 'critical_memory',
        heapUsed: snapshot.heapUsed,
        rss: snapshot.rss,
        threshold: criticalThreshold,
        timestamp: snapshot.timestamp,
      };

      this.emit('critical_memory', alert);

      logger.error('Critical memory usage detected', {
        heapUsed: `${snapshot.heapUsed}MB`,
        rss: `${snapshot.rss}MB`,
        threshold: `${criticalThreshold}MB`,
      });

      this.sendAlert(alert);
    }
  }

  /**
   * Send alert notification
   */
  private sendAlert(alert: any): void {
    if (!MEMORY_CONFIG.alerts.enabled) {
      return;
    }

    const alertId = alert.type || 'memory_alert';
    const now = Date.now();
    const lastAlert = this.lastAlertTime.get(alertId) || 0;

    // Check cooldown period
    if (now - lastAlert < MEMORY_CONFIG.alerts.cooldownPeriod) {
      return;
    }

    this.lastAlertTime.set(alertId, now);

    // In a real implementation, you would send this to your alerting system
    logger.warn('Memory alert triggered', { alert });
  }

  /**
   * Register component memory usage
   */
  registerComponent(name: string, size: number, instances: number = 1): void {
    this.componentMetrics.set(name, { size, instances });
  }

  /**
   * Unregister component
   */
  unregisterComponent(name: string): void {
    this.componentMetrics.delete(name);
  }

  /**
   * Force garbage collection (if enabled)
   */
  forceGarbageCollection(): boolean {
    if (!MEMORY_CONFIG.profiling.gcForced) {
      return false;
    }

    try {
      if (global.gc) {
        global.gc();
        logger.debug('Forced garbage collection completed');
        return true;
      } else {
        logger.warn('Garbage collection not available (run with --expose-gc)');
        return false;
      }
    } catch (error) {
      logger.error('Error forcing garbage collection', {}, error instanceof Error ? error : undefined);
      return false;
    }
  }

  /**
   * Generate memory report
   */
  generateReport(): MemoryReport {
    const current = this.memoryHistory[this.memoryHistory.length - 1] || {
      timestamp: Date.now(),
      rss: 0,
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0,
    };

    const peak = this.memoryHistory.reduce((max, snap) =>
      snap.heapUsed > max.heapUsed ? snap : max, current);

    const trend = this.calculateMemoryTrend();
    const efficiency = this.calculateMemoryEfficiency();

    const componentBreakdown: Record<string, number> = {};
    for (const [name, metrics] of this.componentMetrics.entries()) {
      componentBreakdown[name] = metrics.size * metrics.instances;
    }

    const recommendations = this.generateRecommendations();

    return {
      summary: {
        current,
        peak,
        trend,
        efficiency,
      },
      leaks: Array.from(this.detectedLeaks.values()),
      recommendations,
      componentBreakdown,
    };
  }

  /**
   * Calculate memory trend
   */
  private calculateMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.memoryHistory.length < 10) {
      return 'stable';
    }

    const recent = this.memoryHistory.slice(-10);
    const growthRate = this.calculateGrowthRate(recent.map(s => s.heapUsed));

    if (growthRate > 1) return 'increasing';
    if (growthRate < -1) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate memory efficiency
   */
  private calculateMemoryEfficiency(): number {
    if (this.memoryHistory.length === 0) return 100;

    const current = this.memoryHistory[this.memoryHistory.length - 1];
    const efficiency = (current.heapUsed / current.heapTotal) * 100;
    return Math.round(efficiency);
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const current = this.memoryHistory[this.memoryHistory.length - 1];

    if (!current) return recommendations;

    if (current.heapUsed > 500) {
      recommendations.push('Consider implementing lazy loading for large components');
    }

    if (current.external > 100) {
      recommendations.push('Review external library usage and optimize imports');
    }

    if (this.detectedLeaks.size > 0) {
      recommendations.push('Address detected memory leaks before they impact performance');
    }

    const efficiency = this.calculateMemoryEfficiency();
    if (efficiency < 50) {
      recommendations.push('Memory fragmentation detected - consider restarting the application');
    }

    return recommendations;
  }

  /**
   * Get current memory statistics
   */
  getStatistics(): {
    isMonitoring: boolean;
    historyPoints: number;
    detectedLeaks: number;
    componentCount: number;
    currentMemory?: MemorySnapshot;
  } {
    return {
      isMonitoring: this.isMonitoring,
      historyPoints: this.memoryHistory.length,
      detectedLeaks: this.detectedLeaks.size,
      componentCount: this.componentMetrics.size,
      currentMemory: this.memoryHistory[this.memoryHistory.length - 1],
    };
  }
}

// Export singleton instance
export const memoryMonitor = MemoryMonitor.getInstance();

// Export configuration for reference
export { MEMORY_CONFIG };