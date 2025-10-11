'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock, Zap, Database } from 'lucide-react';

interface PerformanceMetrics {
  renderTime: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  avgResponseTime: number;
  memoryUsage?: number;
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  showInDevelopment?: boolean;
}

export default function PerformanceMonitor({
  onMetricsUpdate,
  showInDevelopment = true
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    avgResponseTime: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development if specified
    if (showInDevelopment && process.env.NODE_ENV === 'development') {
      setIsVisible(true);
    }

    const startTime = performance.now();
    let requestCount = 0;
    let totalResponseTime = 0;

    // Monitor performance metrics
    const updateMetrics = () => {
      const currentTime = performance.now();
      const renderTime = currentTime - startTime;

      // Get memory usage if available
      let memoryUsage: number | undefined;
      if ('memory' in performance) {
        memoryUsage = (performance as any).memory?.usedJSHeapSize;
      }

      const newMetrics: PerformanceMetrics = {
        renderTime: Math.round(renderTime),
        totalRequests: requestCount,
        cacheHits: getCacheHits(),
        cacheMisses: getCacheMisses(),
        avgResponseTime: requestCount > 0 ? Math.round(totalResponseTime / requestCount) : 0,
        memoryUsage
      };

      setMetrics(newMetrics);
      onMetricsUpdate?.(newMetrics);
    };

    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const requestStart = performance.now();
      requestCount++;

      try {
        const response = await originalFetch(...args);
        const responseTime = performance.now() - requestStart;
        totalResponseTime += responseTime;

        return response;
      } catch (error) {
        const responseTime = performance.now() - requestStart;
        totalResponseTime += responseTime;
        throw error;
      }
    };

    // Update metrics every 2 seconds
    const interval = setInterval(updateMetrics, 2000);

    // Initial update
    updateMetrics();

    return () => {
      clearInterval(interval);
      window.fetch = originalFetch;
    };
  }, [onMetricsUpdate, showInDevelopment]);

  // Simple cache hit/miss tracking (would be more sophisticated in real implementation)
  const getCacheHits = (): number => {
    if (typeof window !== 'undefined') {
      return parseInt(sessionStorage.getItem('cache_hits') || '0');
    }
    return 0;
  };

  const getCacheMisses = (): number => {
    if (typeof window !== 'undefined') {
      return parseInt(sessionStorage.getItem('cache_misses') || '0');
    }
    return 0;
  };

  const getCacheHitRate = (): number => {
    const total = metrics.cacheHits + metrics.cacheMisses;
    return total > 0 ? Math.round((metrics.cacheHits / total) * 100) : 0;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPerformanceLevel = (renderTime: number): 'excellent' | 'good' | 'poor' => {
    if (renderTime < 100) return 'excellent';
    if (renderTime < 300) return 'good';
    return 'poor';
  };

  const performanceLevel = getPerformanceLevel(metrics.renderTime);
  const performanceColor = {
    excellent: 'bg-green-500',
    good: 'bg-yellow-500',
    poor: 'bg-red-500'
  };

  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-white/95 backdrop-blur-sm border shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Performance Monitor
          <Badge
            variant="secondary"
            className={`ml-auto text-white ${performanceColor[performanceLevel]}`}
          >
            {performanceLevel.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Render Performance */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Render Time
          </span>
          <span className="font-mono">{metrics.renderTime}ms</span>
        </div>

        {/* Network Performance */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Avg Response
          </span>
          <span className="font-mono">{metrics.avgResponseTime}ms</span>
        </div>

        {/* Request Count */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            Requests
          </span>
          <span className="font-mono">{metrics.totalRequests}</span>
        </div>

        {/* Cache Performance */}
        <div className="flex items-center justify-between">
          <span>Cache Hit Rate</span>
          <span className="font-mono">{getCacheHitRate()}%</span>
        </div>

        {/* Memory Usage */}
        {metrics.memoryUsage && (
          <div className="flex items-center justify-between">
            <span>Memory Usage</span>
            <span className="font-mono">{formatBytes(metrics.memoryUsage)}</span>
          </div>
        )}

        {/* Performance Tips */}
        {performanceLevel === 'poor' && (
          <div className="mt-2 p-2 bg-red-50 rounded text-red-800 text-xs">
            <strong>Performance Tips:</strong>
            <ul className="mt-1 list-disc list-inside">
              <li>Enable virtualization for large lists</li>
              <li>Use lazy loading for images</li>
              <li>Check for unnecessary re-renders</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook to track component render performance
export function useRenderPerformance(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} render time: ${renderTime.toFixed(2)}ms`);

        if (renderTime > 16) {
          console.warn(`[Performance] Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
      }
    };
  });
}

// Hook to track API call performance
export function useApiPerformance() {
  const trackRequest = (url: string, duration: number, cached: boolean = false) => {
    if (typeof window !== 'undefined') {
      // Update cache metrics
      if (cached) {
        const hits = parseInt(sessionStorage.getItem('cache_hits') || '0');
        sessionStorage.setItem('cache_hits', (hits + 1).toString());
      } else {
        const misses = parseInt(sessionStorage.getItem('cache_misses') || '0');
        sessionStorage.setItem('cache_misses', (misses + 1).toString());
      }

      // Log slow requests in development
      if (process.env.NODE_ENV === 'development' && duration > 1000) {
        console.warn(`[Performance] Slow API request: ${url} took ${duration.toFixed(2)}ms`);
      }
    }
  };

  return { trackRequest };
}