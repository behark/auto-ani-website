'use client';

import { ReactNode, useState } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  rootMargin?: string;
  threshold?: number;
  loadingType?: 'skeleton' | 'spinner' | 'custom';
  minHeight?: string | number;
  onVisible?: () => void;
  delay?: number;
}

export default function LazySection({
  children,
  fallback,
  className,
  rootMargin = '200px',
  threshold = 0.1,
  loadingType = 'skeleton',
  minHeight = '200px',
  onVisible,
  delay = 0
}: LazySectionProps) {
  const [shouldRender, setShouldRender] = useState(false);

  const { elementRef, isVisible } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true,
    onIntersect: () => {
      if (delay > 0) {
        setTimeout(() => {
          setShouldRender(true);
          onVisible?.();
        }, delay);
      } else {
        setShouldRender(true);
        onVisible?.();
      }
    }
  });

  const renderFallback = () => {
    if (fallback) {
      return fallback;
    }

    switch (loadingType) {
      case 'spinner':
        return (
          <div
            className="flex items-center justify-center"
            style={{ minHeight }}
          >
            <LoadingSpinner size="lg" text="Loading content..." />
          </div>
        );

      case 'skeleton':
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

      case 'custom':
      default:
        return (
          <div
            className="flex items-center justify-center bg-gray-50 rounded-lg"
            style={{ minHeight }}
          >
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">⏳</div>
              <div>Loading content...</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      ref={elementRef}
      className={cn('w-full', className)}
    >
      {isVisible && shouldRender ? children : renderFallback()}
    </div>
  );
}