/**
 * Database Query Performance Monitoring for AUTO ANI
 *
 * Features:
 * - Automatic query duration tracking
 * - Slow query detection and logging
 * - Query pattern analysis
 * - Performance metrics export
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';

export interface QueryMetric {
  model?: string;
  action: string;
  duration: number;
  timestamp: Date;
  args?: unknown;
}

export interface QueryPerformanceStats {
  totalQueries: number;
  averageDuration: number;
  slowQueries: number;
  slowQueryThreshold: number;
  queries: {
    [key: string]: {
      count: number;
      totalDuration: number;
      averageDuration: number;
      maxDuration: number;
    };
  };
}

class QueryPerformanceMonitor {
  private metrics: QueryMetric[] = [];
  private slowQueryThreshold = 100; // ms
  private maxMetricsToStore = 1000;
  private stats: QueryPerformanceStats = {
    totalQueries: 0,
    averageDuration: 0,
    slowQueries: 0,
    slowQueryThreshold: this.slowQueryThreshold,
    queries: {}
  };

  /**
   * Instrument Prisma client with performance monitoring
   */
  instrumentPrisma(prisma: PrismaClient): void {
    (prisma as any).$use(async (params: any, next: any) => {
      const start = Date.now();

      try {
        const result = await next(params);
        const duration = Date.now() - start;

        // Record metric
        this.recordMetric({
          model: params.model,
          action: params.action,
          duration,
          timestamp: new Date(),
          args: this.sanitizeArgs(params.args)
        });

        // Log slow queries
        if (duration > this.slowQueryThreshold) {
          logger.warn('Slow query detected', {
            model: params.model,
            action: params.action,
            duration: `${duration}ms`,
            threshold: `${this.slowQueryThreshold}ms`,
            args: this.sanitizeArgs(params.args)
          });
        }

        return result;
      } catch (error) {
        const duration = Date.now() - start;

        logger.error('Query failed', {
          model: params.model,
          action: params.action,
          duration: `${duration}ms`,
          error
        });

        throw error;
      }
    });

    logger.info('Prisma performance monitoring enabled', {
      slowQueryThreshold: this.slowQueryThreshold
    });
  }

  /**
   * Record query metric
   */
  private recordMetric(metric: QueryMetric): void {
    // Add to metrics array
    this.metrics.push(metric);

    // Limit array size
    if (this.metrics.length > this.maxMetricsToStore) {
      this.metrics.shift();
    }

    // Update statistics
    this.updateStats(metric);

    // Track slow queries
    if (metric.duration > this.slowQueryThreshold) {
      this.stats.slowQueries++;
    }
  }

  /**
   * Update performance statistics
   */
  private updateStats(metric: QueryMetric): void {
    this.stats.totalQueries++;

    const queryKey = `${metric.model || 'unknown'}.${metric.action}`;

    if (!this.stats.queries[queryKey]) {
      this.stats.queries[queryKey] = {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        maxDuration: 0
      };
    }

    const queryStats = this.stats.queries[queryKey];
    queryStats.count++;
    queryStats.totalDuration += metric.duration;
    queryStats.averageDuration = queryStats.totalDuration / queryStats.count;
    queryStats.maxDuration = Math.max(queryStats.maxDuration, metric.duration);

    // Update overall average
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    this.stats.averageDuration = totalDuration / this.metrics.length;
  }

  /**
   * Sanitize query arguments (remove sensitive data)
   */
  private sanitizeArgs(args: unknown): unknown {
    if (!args) return undefined;

    const sanitized = { ...args };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

    const removeSensitive = (obj: unknown): unknown => {
      if (typeof obj !== 'object' || obj === null) return obj;

      const cleaned = Array.isArray(obj) ? [] : {};

      for (const key in obj as Record<string, unknown>) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          (cleaned as Record<string, unknown>)[key] = '[REDACTED]';
        } else if (typeof (obj as Record<string, unknown>)[key] === 'object') {
          (cleaned as Record<string, unknown>)[key] = removeSensitive((obj as Record<string, unknown>)[key]);
        } else {
          (cleaned as Record<string, unknown>)[key] = (obj as Record<string, unknown>)[key];
        }
      }

      return cleaned;
    };

    return removeSensitive(sanitized);
  }

  /**
   * Get current performance statistics
   */
  getStats(): QueryPerformanceStats {
    return { ...this.stats, queries: { ...this.stats.queries } };
  }

  /**
   * Get slow queries
   */
  getSlowQueries(limit = 10): QueryMetric[] {
    return this.metrics
      .filter(m => m.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get recent queries
   */
  getRecentQueries(limit = 10): QueryMetric[] {
    return this.metrics.slice(-limit).reverse();
  }

  /**
   * Get queries by model
   */
  getQueriesByModel(model: string): QueryMetric[] {
    return this.metrics.filter(m => m.model === model);
  }

  /**
   * Get average duration by model and action
   */
  getAverageDuration(model: string, action: string): number {
    const queryKey = `${model}.${action}`;
    return this.stats.queries[queryKey]?.averageDuration || 0;
  }

  /**
   * Set slow query threshold
   */
  setSlowQueryThreshold(threshold: number): void {
    this.slowQueryThreshold = threshold;
    this.stats.slowQueryThreshold = threshold;
    logger.info('Slow query threshold updated', { threshold });
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = [];
    this.stats = {
      totalQueries: 0,
      averageDuration: 0,
      slowQueries: 0,
      slowQueryThreshold: this.slowQueryThreshold,
      queries: {}
    };
    logger.info('Query performance metrics reset');
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): {
    stats: QueryPerformanceStats;
    recentQueries: QueryMetric[];
    slowQueries: QueryMetric[];
  } {
    return {
      stats: this.getStats(),
      recentQueries: this.getRecentQueries(20),
      slowQueries: this.getSlowQueries(20)
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const stats = this.getStats();
    const slowQueries = this.getSlowQueries(5);

    let report = '=== Database Query Performance Report ===\n\n';
    report += `Total Queries: ${stats.totalQueries}\n`;
    report += `Average Duration: ${stats.averageDuration.toFixed(2)}ms\n`;
    report += `Slow Queries: ${stats.slowQueries} (>${stats.slowQueryThreshold}ms)\n`;
    report += `Slow Query Rate: ${((stats.slowQueries / stats.totalQueries) * 100).toFixed(2)}%\n\n`;

    report += '=== Query Breakdown ===\n';
    Object.entries(stats.queries)
      .sort((a, b) => b[1].averageDuration - a[1].averageDuration)
      .slice(0, 10)
      .forEach(([query, data]) => {
        report += `\n${query}:\n`;
        report += `  Count: ${data.count}\n`;
        report += `  Avg Duration: ${data.averageDuration.toFixed(2)}ms\n`;
        report += `  Max Duration: ${data.maxDuration.toFixed(2)}ms\n`;
      });

    if (slowQueries.length > 0) {
      report += '\n\n=== Slowest Queries ===\n';
      slowQueries.forEach((query, index) => {
        report += `\n${index + 1}. ${query.model || 'unknown'}.${query.action}\n`;
        report += `   Duration: ${query.duration}ms\n`;
        report += `   Timestamp: ${query.timestamp.toISOString()}\n`;
      });
    }

    return report;
  }
}

// Export singleton instance
export const queryPerformanceMonitor = new QueryPerformanceMonitor();

/**
 * Helper function to instrument Prisma client
 */
export function enableQueryMonitoring(prisma: PrismaClient, slowQueryThreshold?: number): void {
  if (slowQueryThreshold) {
    queryPerformanceMonitor.setSlowQueryThreshold(slowQueryThreshold);
  }
  queryPerformanceMonitor.instrumentPrisma(prisma);
}

/**
 * Middleware for API routes to expose performance metrics
 */
export function createPerformanceMetricsHandler() {
  return () => {
    const metrics = queryPerformanceMonitor.exportMetrics();

    return Response.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  };
}