declare module 'web-vitals' {
  export interface Metric {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    entries: PerformanceEntry[];
    id: string;
    navigationType: string;
  }

  export type ReportHandler = (metric: Metric) => void;

  export interface ReportOpts {
    reportAllChanges?: boolean;
  }

  // Core Web Vitals
  export function getCLS(onReport: ReportHandler, opts?: ReportOpts): void;
  export function getFID(onReport: ReportHandler, opts?: ReportOpts): void;
  export function getFCP(onReport: ReportHandler, opts?: ReportOpts): void;
  export function getLCP(onReport: ReportHandler, opts?: ReportOpts): void;
  export function getTTFB(onReport: ReportHandler, opts?: ReportOpts): void;

  // Additional metrics
  export function getINP(onReport: ReportHandler, opts?: ReportOpts): void;

  // Legacy metrics
  export function getFMP(onReport: ReportHandler, opts?: ReportOpts): void;
  export function getTTI(onReport: ReportHandler, opts?: ReportOpts): void;

  // Navigation types
  export const NavigationType: {
    navigate: string;
    reload: string;
    back_forward: string;
    prerender: string;
  };
}