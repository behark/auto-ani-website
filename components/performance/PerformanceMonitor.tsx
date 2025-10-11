'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default function PerformanceMonitor() {
  useEffect(() => {
    const observers: PerformanceObserver[] = [];

    // Monitor Core Web Vitals
    if (typeof window !== 'undefined') {
      // Use PerformanceObserver instead of web-vitals package
      if ('PerformanceObserver' in window) {
        try {
          // Monitor LCP
          const lcpObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              sendToAnalytics({
                name: 'LCP',
                value: entry.startTime,
                metric_type: 'timing'
              });
            }
          });
          lcpObserver.observe({entryTypes: ['largest-contentful-paint']});
          observers.push(lcpObserver);

          // Monitor FID
          const fidObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              const eventEntry = entry as PerformanceEventTiming;
              sendToAnalytics({
                name: 'FID',
                value: (eventEntry.processingStart || 0) - entry.startTime,
                metric_type: 'timing'
              });
            }
          });
          fidObserver.observe({entryTypes: ['first-input']});
          observers.push(fidObserver);
        } catch (error) {
          console.warn('Failed to initialize performance observers:', error);
        }
      }
    }

    // Monitor page load performance
    let navigationObserver: PerformanceObserver | null = null;
    try {
      navigationObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            sendToAnalytics({
              name: 'page_load_time',
              value: navEntry.loadEventEnd - navEntry.loadEventStart,
              metric_type: 'timing'
            });
          }
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      observers.push(navigationObserver);
    } catch (error) {
      console.warn('Failed to initialize navigation observer:', error);
    }

    // Cleanup function
    return () => {
      observers.forEach(observer => {
        try {
          observer.disconnect();
        } catch (error) {
          console.warn('Error disconnecting performance observer:', error);
        }
      });
    };
  }, []);

  return null;
}

function sendToAnalytics(metric: any) {
  // Send to Google Analytics if available
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      non_interaction: true,
    });
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.info(`${metric.name}: ${metric.value}`);
  }
}