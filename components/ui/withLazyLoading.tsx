'use client';

import { ComponentType, forwardRef, ForwardedRef } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface LazyLoadingOptions {
  rootMargin?: string;
  threshold?: number;
  fallback?: 'skeleton' | 'spinner' | 'custom';
  customFallback?: React.ComponentType;
  minHeight?: string | number;
  delay?: number;
  triggerOnce?: boolean;
}

export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  options: LazyLoadingOptions = {}
) {
  const {
    rootMargin = '100px',
    threshold = 0.1,
    fallback = 'skeleton',
    customFallback: CustomFallback,
    minHeight = '200px',
    delay = 0,
    triggerOnce = true
  } = options;

  const LazyComponent = forwardRef<any, P>((props, ref) => {
    const { elementRef, isVisible } = useIntersectionObserver({
      threshold,
      rootMargin,
      triggerOnce,
      onIntersect: () => {
        if (delay > 0) {
          setTimeout(() => {
            // Component will render after delay
          }, delay);
        }
      }
    });

    const renderFallback = () => {
      if (CustomFallback) {
        return <CustomFallback />;
      }

      switch (fallback) {
        case 'spinner':
          return (
            <div
              className="flex items-center justify-center"
              style={{ minHeight }}
            >
              <LoadingSpinner size="lg" text="Loading..." />
            </div>
          );

        case 'skeleton':
        default:
          return (
            <div className="space-y-4" style={{ minHeight }}>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          );
      }
    };

    return (
      <div ref={elementRef}>
        {isVisible ? <Component {...(props as P)} /> : renderFallback()}
      </div>
    );
  });

  LazyComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;

  return LazyComponent;
}

// Helper function for creating lazy components with default options
export function createLazyComponent<P extends object>(
  Component: ComponentType<P>,
  options?: LazyLoadingOptions
) {
  return withLazyLoading(Component, {
    rootMargin: '200px',
    threshold: 0.1,
    fallback: 'skeleton',
    triggerOnce: true,
    ...options
  });
}