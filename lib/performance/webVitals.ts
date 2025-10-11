/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals and sends data to analytics
 */

import type { Metric } from 'web-vitals';

// Performance thresholds based on Google's recommendations
export const PERFORMANCE_THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FID: { good: 100, needsImprovement: 300 },
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
} as const;

export type WebVitalMetric = 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';

interface VitalScore {
  name: WebVitalMetric;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Calculate rating based on metric value
 */
function getRating(name: WebVitalMetric, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = PERFORMANCE_THRESHOLDS[name];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metrics to analytics endpoint
 */
async function sendToAnalytics(metric: VitalScore) {
  const body = JSON.stringify({
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    timestamp: Date.now(),
    url: window.location.pathname,
    userAgent: navigator.userAgent,
    connection: (navigator as any).connection?.effectiveType,
  });

  // Use sendBeacon for reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/vitals', body);
  } else {
    // Fallback to fetch
    fetch('/api/analytics/vitals', {
      body,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(console.error);
  }
}

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(metric: Metric) {
  const vitalScore: VitalScore = {
    name: metric.name as WebVitalMetric,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    rating: getRating(metric.name as WebVitalMetric, metric.value),
    delta: metric.delta,
    id: metric.id,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', vitalScore);
  }

  // Send to analytics
  sendToAnalytics(vitalScore);

  // Store in session storage for debugging
  try {
    const vitals = JSON.parse(sessionStorage.getItem('web-vitals') || '[]');
    vitals.push(vitalScore);
    sessionStorage.setItem('web-vitals', JSON.stringify(vitals));
  } catch (error) {
    console.error('Error storing vitals:', error);
  }
}

/**
 * Initialize Web Vitals monitoring
 */
export async function initWebVitals() {
  if (typeof window === 'undefined') return;

  try {
    const { getCLS, getFID, getFCP, getLCP, getTTFB, getINP } = await import('web-vitals');

    getCLS(reportWebVitals);
    getFID(reportWebVitals);
    getFCP(reportWebVitals);
    getLCP(reportWebVitals);
    getTTFB(reportWebVitals);
    getINP(reportWebVitals);
  } catch (error) {
    console.error('Error initializing Web Vitals:', error);
  }
}

/**
 * Get stored vitals from session
 */
export function getStoredVitals(): VitalScore[] {
  if (typeof window === 'undefined') return [];

  try {
    return JSON.parse(sessionStorage.getItem('web-vitals') || '[]');
  } catch {
    return [];
  }
}

/**
 * Calculate performance score (0-100) based on vitals
 */
export function calculatePerformanceScore(vitals: VitalScore[]): number {
  if (vitals.length === 0) return 0;

  const weights = {
    LCP: 0.25,
    FID: 0.25,
    CLS: 0.25,
    FCP: 0.10,
    TTFB: 0.10,
    INP: 0.05,
  };

  let totalScore = 0;
  let totalWeight = 0;

  vitals.forEach((vital) => {
    const weight = weights[vital.name] || 0;
    totalWeight += weight;

    let score = 0;
    if (vital.rating === 'good') score = 100;
    else if (vital.rating === 'needs-improvement') score = 50;
    else score = 0;

    totalScore += score * weight;
  });

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitoring() {
  if (typeof window === 'undefined') return { vitals: [], score: 0 };

  const vitals = getStoredVitals();
  const score = calculatePerformanceScore(vitals);

  return { vitals, score };
}