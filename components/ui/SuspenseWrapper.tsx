'use client';

import { Suspense, ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';
import SectionSkeleton from './SectionSkeleton';

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  fallbackType?: 'spinner' | 'skeleton';
  skeletonType?: 'featured-vehicles' | 'services' | 'hero' | 'testimonials' | 'generic';
  loadingText?: string;
  className?: string;
}

export default function SuspenseWrapper({
  children,
  fallback,
  fallbackType = 'skeleton',
  skeletonType = 'generic',
  loadingText,
  className
}: SuspenseWrapperProps) {
  const getFallback = () => {
    if (fallback) {
      return fallback;
    }

    if (fallbackType === 'spinner') {
      return (
        <div className={`flex items-center justify-center py-16 ${className || ''}`}>
          <LoadingSpinner size="lg" text={loadingText} />
        </div>
      );
    }

    return <SectionSkeleton type={skeletonType} className={className} />;
  };

  return (
    <Suspense fallback={getFallback()}>
      {children}
    </Suspense>
  );
}