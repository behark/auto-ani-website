/**
 * Performance Monitoring Utilities
 * Helps identify performance bottlenecks during development
 */

import { logger } from './logger';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  renderCount: number;
  lastRenderTimestamp: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private enabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Track component render performance
   */
  trackRender(componentName: string, startTime: number) {
    if (!this.enabled) return;

    const renderTime = performance.now() - startTime;
    const existing = this.metrics.get(componentName);

    if (existing) {
      existing.renderCount++;
      existing.renderTime += renderTime;
      existing.lastRenderTimestamp = Date.now();
    } else {
      this.metrics.set(componentName, {
        componentName,
        renderTime,
        renderCount: 1,
        lastRenderTimestamp: Date.now(),
      });
    }

    // Warn if component is rendering too slowly
    if (renderTime > 50) {
      logger.warn(`Slow render detected: ${componentName}`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        threshold: '50ms',
      });
    }

    // Warn if component is re-rendering excessively
    if (existing && existing.renderCount > 10) {
      const timeSinceFirstRender = Date.now() - (existing.lastRenderTimestamp - (existing.renderTime));
      if (timeSinceFirstRender < 5000) {
        logger.warn(`Excessive re-renders detected: ${componentName}`, {
          renderCount: existing.renderCount,
          withinTime: `${(timeSinceFirstRender / 1000).toFixed(1)}s`,
        });
      }
    }
  }

  /**
   * Get performance report for a component
   */
  getMetrics(componentName?: string): PerformanceMetrics | PerformanceMetrics[] | null {
    if (!this.enabled) return null;

    if (componentName) {
      return this.metrics.get(componentName) || null;
    }

    return Array.from(this.metrics.values());
  }

  /**
   * Get slowest components
   */
  getSlowestComponents(limit: number = 10): PerformanceMetrics[] {
    if (!this.enabled) return [];

    return Array.from(this.metrics.values())
      .sort((a, b) => b.renderTime - a.renderTime)
      .slice(0, limit);
  }

  /**
   * Get most frequently re-rendering components
   */
  getMostRerenderedComponents(limit: number = 10): PerformanceMetrics[] {
    if (!this.enabled) return [];

    return Array.from(this.metrics.values())
      .sort((a, b) => b.renderCount - a.renderCount)
      .slice(0, limit);
  }

  /**
   * Log performance summary
   */
  logSummary() {
    if (!this.enabled) return;

    logger.info('=== Performance Summary ===');

    const slowest = this.getSlowestComponents(5);
    if (slowest.length > 0) {
      logger.info('Slowest Components:');
      slowest.forEach((metric, index) => {
        logger.info(`${index + 1}. ${metric.componentName}: ${metric.renderTime.toFixed(2)}ms (${metric.renderCount} renders)`);
      });
    }

    const mostRerendered = this.getMostRerenderedComponents(5);
    if (mostRerendered.length > 0) {
      logger.info('Most Re-rendered Components:');
      mostRerendered.forEach((metric, index) => {
        logger.info(`${index + 1}. ${metric.componentName}: ${metric.renderCount} renders (avg ${(metric.renderTime / metric.renderCount).toFixed(2)}ms)`);
      });
    }
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
  }

  /**
   * Reset metrics for a specific component
   */
  reset(componentName: string) {
    this.metrics.delete(componentName);
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Global access for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__performanceMonitor = performanceMonitor;
}

/**
 * Utility to track render start time
 * Use this at the beginning of a component's render function
 */
export function trackRenderStart(componentName: string): number {
  if (process.env.NODE_ENV !== 'development') return 0;
  return performance.now();
}

/**
 * Utility to track render end time
 * Use this at the end of a component's render function or in useEffect
 */
export function trackRenderEnd(componentName: string, startTime: number) {
  if (process.env.NODE_ENV !== 'development') return;
  performanceMonitor.trackRender(componentName, startTime);
}
