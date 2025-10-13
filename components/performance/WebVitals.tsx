"use client";

import { useEffect } from "react";
import { Metric } from "web-vitals";

export function reportWebVitals(metric: Metric) {
  // Only report in production
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  // Send to analytics service
  const body = JSON.stringify(metric);
  const url = "/api/analytics";

  // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, { body, method: "POST", keepalive: true });
  }
}

interface WebVitalsProps {
  debug?: boolean;
}

export default function WebVitals({ debug = false }: WebVitalsProps) {
  useEffect(() => {
    // Dynamic import to avoid loading in SSR
    import("web-vitals").then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      const reportMetric = (metric: Metric) => {
        if (debug) {
          console.info(`[Web Vitals] ${metric.name}:`, metric.value);
        }

        // Report to analytics
        reportWebVitals(metric);

        // Store in localStorage for debugging
        if (typeof window !== "undefined" && debug) {
          const metrics = JSON.parse(localStorage.getItem("webVitals") || "[]");
          metrics.push({
            ...metric,
            timestamp: Date.now(),
            url: window.location.href,
          });
          // Keep last 10
          if (metrics.length > 10) {
            metrics.shift();
          }
          localStorage.setItem("webVitalsMetrics", JSON.stringify(metrics));
        }
      };

      // Core Web Vitals
      onCLS(reportMetric);
      onINP(reportMetric); // INP replaced FID in web-vitals v4
      onFCP(reportMetric);
      onLCP(reportMetric);
      onTTFB(reportMetric);
    });
  }, [debug]);

  return null;
}

// Performance budget thresholds (based on Core Web Vitals)
export const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint (replaced FID)
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
};

// Helper to check if metric is within good threshold
export function isGoodMetric(name: string, value: number): boolean {
  const threshold =
    PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
  return threshold ? value <= threshold.good : true;
}

// Component to display performance metrics in dev mode
export function PerformanceMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const metrics: Metric[] = [];

      const logMetrics = () => {
        if (metrics.length > 0) {
          // Use console.info which is allowed
          console.info("🏃 Performance Metrics");
          metrics.forEach((metric) => {
            const isGood = isGoodMetric(metric.name, metric.value);
            const status = isGood ? "✅" : "⚠️";
            console.info(
              `${status} ${metric.name}: ${metric.value.toFixed(2)}${metric.name === "CLS" ? "" : "ms"}`
            );
          });
        }
      };

      import("web-vitals").then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
        const collectMetric = (metric: Metric) => {
          metrics.push(metric);
          if (metrics.length === 5) {
            // When all core metrics are collected
            setTimeout(logMetrics, 1000);
          }
        };

        onCLS(collectMetric);
        onINP(collectMetric); // INP replaced FID in web-vitals v4
        onFCP(collectMetric);
        onLCP(collectMetric);
        onTTFB(collectMetric);
      });
    }
  }, []);

  return null;
}
