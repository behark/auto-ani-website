'use client';

import { Card, CardContent } from '@/components/ui/card';

export default function VehicleCardSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="relative h-64 bg-gray-300" style={{ aspectRatio: '4/3' }}>
        {/* Badge Skeletons */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="h-6 w-24 bg-gray-400 rounded"></div>
        </div>
        {/* Comparison Button Skeleton */}
        <div className="absolute top-4 right-4">
          <div className="h-10 w-10 bg-gray-400 rounded-md"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <CardContent className="p-4">
        {/* Title and Price Skeleton */}
        <div className="mb-3">
          <div className="h-6 w-3/4 bg-gray-300 rounded mb-2"></div>
          <div className="h-8 w-1/2 bg-gray-400 rounded"></div>
        </div>

        {/* Vehicle Info Grid Skeleton */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="h-4 w-20 bg-gray-300 rounded"></div>
          <div className="h-4 w-24 bg-gray-300 rounded"></div>
          <div className="h-4 w-20 bg-gray-300 rounded"></div>
          <div className="h-4 w-20 bg-gray-300 rounded"></div>
        </div>

        {/* Action Button Skeleton */}
        <div className="h-10 w-full bg-gray-300 rounded-md"></div>
      </CardContent>
    </Card>
  );
}
