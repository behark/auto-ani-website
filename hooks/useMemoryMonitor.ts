/**
 * React Hook for Component-Level Memory Monitoring
 *
 * Provides memory tracking for React components with:
 * - Component lifecycle memory tracking
 * - Automatic cleanup detection
 * - Memory leak warnings
 * - Performance impact monitoring
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { memoryMonitor, MemorySnapshot } from '@/lib/monitoring/memory-monitor';
import { logger } from '@/lib/logger';

interface UseMemoryMonitorOptions {
  componentName?: string;
  trackRenders?: boolean;
  warnThreshold?: number; // MB
  enabled?: boolean;
}

interface MemoryStats {
  initialMemory: MemorySnapshot | null;
  currentMemory: MemorySnapshot | null;
  memoryDelta: number;
  renderCount: number;
  avgMemoryPerRender: number;
  isLeaking: boolean;
}

/**
 * Hook for monitoring memory usage in React components
 */
export function useMemoryMonitor(options: UseMemoryMonitorOptions = {}): MemoryStats {
  const {
    componentName = 'UnknownComponent',
    trackRenders = true,
    warnThreshold = 10, // 10MB warning threshold
    enabled = process.env.NODE_ENV === 'development',
  } = options;

  const [memoryStats, setMemoryStats] = useState<MemoryStats>({
    initialMemory: null,
    currentMemory: null,
    memoryDelta: 0,
    renderCount: 0,
    avgMemoryPerRender: 0,
    isLeaking: false,
  });

  const initialMemoryRef = useRef<MemorySnapshot | null>(null);
  const renderCountRef = useRef(0);
  const componentMountedRef = useRef(false);
  const memoryHistoryRef = useRef<MemorySnapshot[]>([]);

  /**
   * Get current memory snapshot
   */
  const getCurrentMemory = useCallback((): MemorySnapshot | null => {
    if (typeof window !== 'undefined' || !enabled) {
      return null;
    }

    try {
      const memUsage = process.memoryUsage();
      return {
        timestamp: Date.now(),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        arrayBuffers: Math.round((memUsage as any).arrayBuffers / 1024 / 1024 || 0),
      };
    } catch (error) {
      logger.debug('Error getting memory usage in component', { componentName });
      return null;
    }
  }, [enabled, componentName]);

  /**
   * Check for memory leaks
   */
  const checkForMemoryLeaks = useCallback((current: MemorySnapshot): boolean => {
    if (!initialMemoryRef.current || memoryHistoryRef.current.length < 5) {
      return false;
    }

    const memoryGrowth = current.heapUsed - initialMemoryRef.current.heapUsed;
    const renderCount = renderCountRef.current;

    // Check if memory growth is excessive relative to renders
    if (renderCount > 0) {
      const memoryPerRender = memoryGrowth / renderCount;
      if (memoryPerRender > 1) { // More than 1MB per render
        logger.warn('Potential memory leak detected in component', {
          componentName,
          memoryGrowth: `${memoryGrowth}MB`,
          renderCount,
          memoryPerRender: `${memoryPerRender.toFixed(2)}MB`,
        });
        return true;
      }
    }

    // Check for overall memory threshold breach
    if (memoryGrowth > warnThreshold) {
      logger.warn('Component memory usage exceeded threshold', {
        componentName,
        memoryGrowth: `${memoryGrowth}MB`,
        threshold: `${warnThreshold}MB`,
      });
      return true;
    }

    return false;
  }, [componentName, warnThreshold]);

  /**
   * Update memory statistics
   */
  const updateMemoryStats = useCallback(() => {
    if (!enabled) return;

    const currentMemory = getCurrentMemory();
    if (!currentMemory) return;

    memoryHistoryRef.current.push(currentMemory);

    // Keep only last 10 snapshots to prevent memory leaks in the hook itself
    if (memoryHistoryRef.current.length > 10) {
      memoryHistoryRef.current.shift();
    }

    const initialMemory = initialMemoryRef.current;
    const memoryDelta = initialMemory ? currentMemory.heapUsed - initialMemory.heapUsed : 0;
    const renderCount = renderCountRef.current;
    const avgMemoryPerRender = renderCount > 0 ? memoryDelta / renderCount : 0;
    const isLeaking = checkForMemoryLeaks(currentMemory);

    setMemoryStats({
      initialMemory,
      currentMemory,
      memoryDelta,
      renderCount,
      avgMemoryPerRender,
      isLeaking,
    });
  }, [enabled, getCurrentMemory, checkForMemoryLeaks]);

  // Track component mount/unmount
  useEffect(() => {
    if (!enabled) return;

    componentMountedRef.current = true;

    // Capture initial memory on mount
    const initialMemory = getCurrentMemory();
    if (initialMemory) {
      initialMemoryRef.current = initialMemory;
      memoryHistoryRef.current = [initialMemory];

      // Register component with memory monitor
      memoryMonitor.registerComponent(componentName, initialMemory.heapUsed, 1);

      logger.debug('Component memory tracking started', {
        componentName,
        initialMemory: `${initialMemory.heapUsed}MB`,
      });
    }

    return () => {
      componentMountedRef.current = false;

      // Unregister component
      memoryMonitor.unregisterComponent(componentName);

      // Log final memory usage
      const finalMemory = getCurrentMemory();
      if (initialMemoryRef.current && finalMemory) {
        const memoryDelta = finalMemory.heapUsed - initialMemoryRef.current.heapUsed;

        logger.debug('Component memory tracking ended', {
          componentName,
          initialMemory: `${initialMemoryRef.current.heapUsed}MB`,
          finalMemory: `${finalMemory.heapUsed}MB`,
          memoryDelta: `${memoryDelta}MB`,
          renderCount: renderCountRef.current,
        });

        // Warn if component left a significant memory footprint
        if (memoryDelta > 5) {
          logger.warn('Component may have caused memory leak', {
            componentName,
            memoryDelta: `${memoryDelta}MB`,
            suggestion: 'Check for uncleaned event listeners, intervals, or large state objects',
          });
        }
      }
    };
  }, [enabled, componentName, getCurrentMemory]);

  // Track renders
  useEffect(() => {
    if (!enabled || !trackRenders) return;

    renderCountRef.current += 1;
    updateMemoryStats();
  });

  // Periodic memory check
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      if (componentMountedRef.current) {
        updateMemoryStats();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [enabled, updateMemoryStats]);

  return memoryStats;
}

/**
 * Hook for monitoring specific operations that might cause memory leaks
 */
export function useMemoryProfiler(operationName: string, enabled: boolean = true) {
  const [profiling, setProfiling] = useState(false);
  const startMemoryRef = useRef<MemorySnapshot | null>(null);

  const startProfiling = useCallback(() => {
    if (!enabled || typeof window !== 'undefined') return;

    try {
      const memUsage = process.memoryUsage();
      startMemoryRef.current = {
        timestamp: Date.now(),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        arrayBuffers: Math.round((memUsage as any).arrayBuffers / 1024 / 1024 || 0),
      };

      setProfiling(true);

      logger.debug('Memory profiling started', {
        operation: operationName,
        startMemory: `${startMemoryRef.current.heapUsed}MB`,
      });
    } catch (error) {
      logger.debug('Error starting memory profiling', { operation: operationName });
    }
  }, [enabled, operationName]);

  const stopProfiling = useCallback(() => {
    if (!enabled || !profiling || !startMemoryRef.current) return null;

    try {
      const memUsage = process.memoryUsage();
      const endMemory: MemorySnapshot = {
        timestamp: Date.now(),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        arrayBuffers: Math.round((memUsage as any).arrayBuffers / 1024 / 1024 || 0),
      };

      const memoryDelta = endMemory.heapUsed - startMemoryRef.current.heapUsed;
      const duration = endMemory.timestamp - startMemoryRef.current.timestamp;

      setProfiling(false);
      startMemoryRef.current = null;

      const result = {
        operation: operationName,
        startMemory: startMemoryRef.current,
        endMemory,
        memoryDelta,
        duration,
      };

      logger.debug('Memory profiling completed', {
        operation: operationName,
        memoryDelta: `${memoryDelta}MB`,
        duration: `${duration}ms`,
      });

      // Warn if operation used significant memory
      if (memoryDelta > 2) {
        logger.warn('Operation used significant memory', {
          operation: operationName,
          memoryDelta: `${memoryDelta}MB`,
          suggestion: 'Consider optimizing this operation or implementing cleanup',
        });
      }

      return result;
    } catch (error) {
      logger.debug('Error stopping memory profiling', { operation: operationName });
      setProfiling(false);
      return null;
    }
  }, [enabled, profiling, operationName]);

  return {
    profiling,
    startProfiling,
    stopProfiling,
  };
}

/**
 * Hook for detecting useEffect cleanup issues
 */
export function useEffectMemoryCheck(
  effect: React.EffectCallback,
  deps?: React.DependencyList,
  effectName: string = 'anonymous'
): void {
  const mounted = useRef(false);
  const cleanupWarned = useRef(false);

  useEffect(() => {
    mounted.current = true;

    logger.debug('Effect started', { effectName });

    const cleanup = effect();

    return () => {
      mounted.current = false;

      if (typeof cleanup === 'function') {
        try {
          cleanup();
          logger.debug('Effect cleanup completed', { effectName });
        } catch (error) {
          logger.error('Effect cleanup failed', { effectName }, error as Error);
        }
      } else if (cleanup !== undefined && !cleanupWarned.current) {
        logger.warn('Effect did not return cleanup function', {
          effectName,
          suggestion: 'Ensure useEffect returns a cleanup function to prevent memory leaks',
        });
        cleanupWarned.current = true;
      }
    };
  }, deps);
}

export default useMemoryMonitor;