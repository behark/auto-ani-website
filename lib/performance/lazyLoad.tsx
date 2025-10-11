/**
 * Lazy Loading Utilities
 * Provides HOCs and hooks for lazy loading components
 */

import { lazy, Suspense, ComponentType, ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';

/**
 * Loading fallback component
 */
export function LoadingFallback({
  height = '200px',
  message = 'Loading...'
}: {
  height?: string;
  message?: string;
}) {
  return (
    <div
      className="flex items-center justify-center bg-gray-100 rounded-lg"
      style={{ minHeight: height }}
    >
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}

/**
 * Error boundary fallback
 */
export function ErrorFallback({
  error,
  resetErrorBoundary
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <h3 className="text-lg font-semibold text-red-800">
        Something went wrong
      </h3>
      <p className="mt-2 text-sm text-red-600">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
}

/**
 * Lazy load component with custom fallback
 */
export function lazyLoadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFunc);

  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <LoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Lazy load component with intersection observer
 * Only loads when component is in viewport
 */
export function lazyLoadOnView<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: {
    fallback?: ReactNode;
    rootMargin?: string;
    threshold?: number;
  } = {}
) {
  const LazyComponent = lazy(importFunc);

  return function LazyLoadOnViewComponent(props: React.ComponentProps<T>) {
    const { ref, inView } = useInView({
      triggerOnce: true,
      rootMargin: options.rootMargin || '100px',
      threshold: options.threshold || 0.1,
    });

    return (
      <div ref={ref}>
        {inView ? (
          <Suspense fallback={options.fallback || <LoadingFallback />}>
            <LazyComponent {...props} />
          </Suspense>
        ) : (
          options.fallback || <LoadingFallback />
        )}
      </div>
    );
  };
}

/**
 * Hook for lazy loading data on view
 */
export function useLazyLoadData<T>(
  fetchFn: () => Promise<T>,
  options: {
    rootMargin?: string;
    threshold?: number;
  } = {}
) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: options.rootMargin || '100px',
    threshold: options.threshold || 0.1,
  });

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (inView && !data && !loading) {
      setLoading(true);
      fetchFn()
        .then(setData)
        .catch(setError)
        .finally(() => setLoading(false));
    }
  }, [inView, data, loading, fetchFn]);

  return { ref, data, loading, error, inView };
}

/**
 * Preload component for faster navigation
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): void {
  // Trigger the import to cache it
  importFunc().catch((error) => {
    console.error('Failed to preload component:', error);
  });
}

/**
 * Preload on hover for better UX
 */
export function usePreloadOnHover<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  const handleMouseEnter = () => {
    preloadComponent(importFunc);
  };

  return { onMouseEnter: handleMouseEnter };
}

/**
 * Batch lazy load multiple components
 */
export function lazyLoadBatch<T extends Record<string, ComponentType<any>>>(
  importMap: {
    [K in keyof T]: () => Promise<{ default: T[K] }>;
  }
): {
  [K in keyof T]: ReturnType<typeof lazyLoadComponent<T[K]>>;
} {
  const result = {} as any;

  Object.keys(importMap).forEach((key) => {
    result[key] = lazyLoadComponent(importMap[key]);
  });

  return result;
}

/**
 * Dynamic import with retry logic
 */
export async function dynamicImportWithRetry<T>(
  importFunc: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await importFunc();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return dynamicImportWithRetry(importFunc, retries - 1, delay * 2);
  }
}

/**
 * Lazy load with prefetching for better performance
 */
export function lazyLoadWithPrefetch<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: {
    prefetchDelay?: number;
    fallback?: ReactNode;
  } = {}
) {
  const { prefetchDelay = 2000, fallback } = options;

  // Prefetch after delay
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      preloadComponent(importFunc);
    }, prefetchDelay);
  }

  return lazyLoadComponent(importFunc, fallback);
}

/**
 * Code splitting by route
 */
export const routeComponents = {
  Home: () => lazyLoadComponent(() => import('@/app/page')),
  Vehicles: () => lazyLoadComponent(() => import('@/app/vehicles/page')),
  VehicleDetail: () => lazyLoadComponent(() => import('@/app/vehicles/[slug]/page')),
  Contact: () => lazyLoadComponent(() => import('@/app/contact/page')),
  About: () => lazyLoadComponent(() => import('@/app/about/page')),
  Financing: () => lazyLoadComponent(() => import('@/app/financing/page')),
};

// Add missing imports
import { useState, useEffect } from 'react';

/**
 * Skeleton loader component
 */
export function SkeletonLoader({
  count = 1,
  height = '20px',
  className = ''
}: {
  count?: number;
  height?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="mb-2 animate-pulse rounded bg-gray-200"
          style={{ height }}
        />
      ))}
    </div>
  );
}