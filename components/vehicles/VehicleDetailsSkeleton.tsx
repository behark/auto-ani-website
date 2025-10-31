'use client';

import { Card, CardContent } from '@/components/ui/card';

export default function VehicleDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Image Gallery Skeleton */}
            <div className="space-y-4 animate-pulse" role="status" aria-label="Duke ngarkuar galerinë e fotove">
              <div className="relative h-96 lg:h-[500px] rounded-lg overflow-hidden bg-gray-300" style={{ aspectRatio: '4/3' }} />
              {/* Thumbnails */}
              <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded overflow-hidden bg-gray-300"
                  />
                ))}
              </div>
            </div>

            {/* Vehicle Details Skeleton */}
            <div className="space-y-6 animate-pulse">
              {/* Title and Price */}
              <div className="space-y-3">
                <div className="h-8 w-3/4 bg-gray-300 rounded" />
                <div className="h-10 w-1/2 bg-gray-400 rounded" />
              </div>

              {/* Badges */}
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-gray-300 rounded" />
                <div className="h-6 w-24 bg-gray-300 rounded" />
              </div>

              {/* Base Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-4 w-16 bg-gray-300 rounded" />
                    <div className="h-5 w-24 bg-gray-400 rounded" />
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <div className="h-12 bg-gray-300 rounded-lg" />
                <div className="h-12 bg-gray-300 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Tabs Section Skeleton */}
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Tab buttons */}
                <div className="flex gap-4 border-b">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-10 w-32 bg-gray-300 rounded-t" />
                  ))}
                </div>

                {/* Tab content */}
                <div className="space-y-4">
                  <div className="h-6 w-1/3 bg-gray-300 rounded" />
                  <div className="h-4 w-full bg-gray-300 rounded" />
                  <div className="h-4 w-5/6 bg-gray-300 rounded" />
                  <div className="h-4 w-4/6 bg-gray-300 rounded" />
                </div>

                {/* Grid Items */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="h-12 bg-gray-300 rounded" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Duke ngarkuar detajet e veturës...
      </span>
    </div>
  );
}
