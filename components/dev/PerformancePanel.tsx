'use client';

/**
 * Development-only Performance Monitoring Panel
 * Shows real-time performance metrics in development mode
 */

import { useEffect, useState } from 'react';
import { performanceMonitor } from '@/lib/performance-monitor';

export default function PerformancePanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    // Keyboard shortcut to toggle panel: Ctrl + Shift + P
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    // Update metrics every 2 seconds when visible
    let interval: NodeJS.Timeout;
    if (isVisible) {
      interval = setInterval(() => {
        const allMetrics = performanceMonitor.getMetrics();
        if (Array.isArray(allMetrics)) {
          setMetrics(allMetrics);
        }
      }, 2000);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (interval) clearInterval(interval);
    };
  }, [isVisible]);

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null;
  }

  const slowest = metrics
    .sort((a, b) => b.renderTime - a.renderTime)
    .slice(0, 5);

  const mostRerendered = metrics
    .sort((a, b) => b.renderCount - a.renderCount)
    .slice(0, 5);

  return (
    <div
      className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-2xl z-[9999] max-w-md max-h-96 overflow-auto"
      style={{ fontSize: '12px' }}
    >
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-700">
        <h3 className="font-bold text-sm">⚡ Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="text-xs text-gray-400 mb-3">
        Press <kbd className="bg-gray-800 px-1 rounded">Ctrl+Shift+P</kbd> to toggle
      </div>

      {/* Slowest Components */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-yellow-400">🐌 Slowest Components</h4>
        {slowest.length > 0 ? (
          <div className="space-y-1">
            {slowest.map((metric, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="truncate flex-1">{metric.componentName}</span>
                <span className="text-yellow-300 ml-2">
                  {metric.renderTime.toFixed(1)}ms
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-xs">No data yet</div>
        )}
      </div>

      {/* Most Re-rendered */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-orange-400">🔄 Most Re-renders</h4>
        {mostRerendered.length > 0 ? (
          <div className="space-y-1">
            {mostRerendered.map((metric, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="truncate flex-1">{metric.componentName}</span>
                <span className="text-orange-300 ml-2">
                  {metric.renderCount}x
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-xs">No data yet</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-700">
        <button
          onClick={() => {
            performanceMonitor.logSummary();
          }}
          className="flex-1 bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
        >
          Log Summary
        </button>
        <button
          onClick={() => {
            performanceMonitor.clear();
            setMetrics([]);
          }}
          className="flex-1 bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
        >
          Clear Data
        </button>
      </div>
    </div>
  );
}
