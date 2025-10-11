import { Skeleton } from '@/components/ui/skeleton';
import VehicleCardSkeleton from './VehicleCardSkeleton';

interface SectionSkeletonProps {
  type: 'featured-vehicles' | 'services' | 'hero' | 'testimonials' | 'generic';
  className?: string;
}

export default function SectionSkeleton({ type, className }: SectionSkeletonProps) {
  switch (type) {
    case 'featured-vehicles':
      return (
        <section className={`py-16 bg-gray-50 ${className || ''}`}>
          <div className="container mx-auto px-4">
            {/* Section Header Skeleton */}
            <div className="text-center mb-12">
              <Skeleton className="h-10 w-64 mx-auto mb-4" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>

            {/* Vehicles Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <VehicleCardSkeleton key={index} />
              ))}
            </div>

            {/* View All Button Skeleton */}
            <div className="text-center">
              <Skeleton className="h-12 w-48 mx-auto" />
            </div>
          </div>
        </section>
      );

    case 'services':
      return (
        <section className={`py-16 bg-white ${className || ''}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Skeleton className="h-10 w-48 mx-auto mb-4" />
              <Skeleton className="h-6 w-80 mx-auto" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="text-center">
                  <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-6 w-32 mx-auto mb-3" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'hero':
      return (
        <section className={`relative h-screen flex items-center justify-center bg-gray-300 ${className || ''}`}>
          <div className="text-center text-white z-10">
            <Skeleton className="h-16 w-96 mx-auto mb-6 bg-white/20" />
            <Skeleton className="h-6 w-80 mx-auto mb-8 bg-white/20" />
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Skeleton className="h-12 w-40 bg-white/20" />
              <Skeleton className="h-12 w-40 bg-white/20" />
            </div>
          </div>
        </section>
      );

    case 'testimonials':
      return (
        <section className={`py-16 bg-gray-50 ${className || ''}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Skeleton className="h-10 w-56 mx-auto mb-4" />
              <Skeleton className="h-6 w-72 mx-auto" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center mb-4">
                    <Skeleton className="w-12 h-12 rounded-full mr-4" />
                    <div>
                      <Skeleton className="h-5 w-24 mb-1" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'generic':
    default:
      return (
        <section className={`py-16 ${className || ''}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <Skeleton className="h-8 w-48 mx-auto mb-4" />
              <Skeleton className="h-5 w-64 mx-auto" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </section>
      );
  }
}