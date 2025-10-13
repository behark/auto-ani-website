import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function VehicleCardSkeleton() {
  return (
    <Card className="overflow-hidden shadow-card-hover">
      {/* Image Skeleton */}
      <Skeleton className="h-64 w-full" />

      {/* Content */}
      <CardContent className="p-4">
        {/* Title and Price */}
        <div className="mb-3">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-8 w-1/2" />
        </div>

        {/* Specifications */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-14" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-18" />
          </div>
        </div>

        {/* Description */}
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}