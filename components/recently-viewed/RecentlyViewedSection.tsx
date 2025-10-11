'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import VehicleCard from '@/components/vehicles/VehicleCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Eye,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore';
import { useCompareStore } from '@/store/compareStore';
import { Vehicle } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface RecentlyViewedVehicle {
  id: string;
  vehicleId: string;
  viewCount: number;
  timeSpent: number;
  source: string;
  firstViewedAt: string;
  lastViewedAt: string;
  vehicle: Vehicle & {
    _count: {
      inquiries: number;
      favorites: number;
    };
  };
}

interface RecentlyViewedSectionProps {
  className?: string;
  showTitle?: boolean;
  limit?: number;
  horizontal?: boolean;
}

export default function RecentlyViewedSection({
  className = '',
  showTitle = true,
  limit = 6,
  horizontal = true
}: RecentlyViewedSectionProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const recentlyViewedStore = useRecentlyViewedStore();
  const compareStore = useCompareStore();

  const sessionId = typeof window !== 'undefined'
    ? localStorage.getItem('sessionId') || ''
    : '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['recentlyViewed', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      const response = await fetch(`/api/recently-viewed?sessionId=${sessionId}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch recently viewed');

      return response.json();
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const removeViewMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      const response = await fetch(`/api/recently-viewed?sessionId=${sessionId}&vehicleId=${vehicleId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to remove vehicle');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentlyViewed'] });
      toast.success('Vehicle removed from recently viewed');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/recently-viewed?sessionId=${sessionId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to clear recently viewed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentlyViewed'] });
      recentlyViewedStore.clearViewedVehicles();
      toast.success('Recently viewed vehicles cleared');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleVehicleClick = (vehicle: Vehicle) => {
    // Track the view
    recentlyViewedStore.addViewedVehicle(vehicle, 'direct');
    router.push(`/vehicles/${vehicle.id}`);
  };

  const handleRemoveVehicle = (vehicleId: string) => {
    removeViewMutation.mutate(vehicleId);
    recentlyViewedStore.removeViewedVehicle(vehicleId);
  };

  const handleClearAll = () => {
    clearAllMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className={className}>
        {showTitle && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recently Viewed
            </h2>
          </div>
        )}
        <div className={horizontal ? 'flex gap-4 overflow-x-auto' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="min-w-[300px] h-80 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.recentlyViewed?.length) {
    return null;
  }

  const recentlyViewed: RecentlyViewedVehicle[] = data.recentlyViewed;
  const analytics = data.analytics;

  return (
    <div className={className}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recently Viewed
            </h2>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {analytics.uniqueVehicles}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {analytics.totalViews > 0 && (
              <div className="text-sm text-gray-600 flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {analytics.totalViews} total views
                </span>
                <span>
                  {Math.round(analytics.averageTimeSpent)}s avg
                </span>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={clearAllMutation.isPending}
              className="text-gray-600 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Analytics Summary */}
      {analytics.mostViewedMakes.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">Your browsing insights:</p>
          <div className="flex flex-wrap gap-2">
            {analytics.mostViewedMakes.slice(0, 3).map((make: { make: string; count: number }) => (
              <Badge key={make.make} variant="outline" className="text-blue-700 border-blue-300">
                {make.make} ({make.count} views)
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed Vehicles */}
      <div className={horizontal
        ? 'flex gap-4 overflow-x-auto pb-4'
        : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
      }>
        {recentlyViewed.map((item) => (
          <div
            key={item.id}
            className={`relative group ${horizontal ? 'min-w-[300px] flex-shrink-0' : ''}`}
          >
            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveVehicle(item.vehicleId);
              }}
              className="absolute top-2 right-2 z-10 p-1 bg-white/90 hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove from recently viewed"
            >
              <X className="h-4 w-4 text-gray-600 hover:text-red-600" />
            </button>

            {/* View metadata */}
            <div className="absolute top-2 left-2 z-10">
              <div className="flex gap-1">
                <Badge variant="secondary" className="text-xs bg-black/70 text-white border-0">
                  {item.viewCount}x viewed
                </Badge>
                {item.timeSpent > 30 && (
                  <Badge variant="secondary" className="text-xs bg-blue-600 text-white border-0">
                    {Math.round(item.timeSpent)}s
                  </Badge>
                )}
              </div>
            </div>

            <VehicleCard
              vehicle={item.vehicle}
              viewMode="grid"
              onView={() => handleVehicleClick(item.vehicle)}
              onCompare={() => compareStore.addVehicle(item.vehicle)}
              className="h-full"
            />

            {/* Last viewed time */}
            <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
              <span>
                Last viewed {formatDistanceToNow(new Date(item.lastViewedAt), { addSuffix: true })}
              </span>
              {item.source && (
                <Badge variant="outline" className="text-xs">
                  {item.source.toLowerCase()}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {recentlyViewed.length >= limit && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            onClick={() => router.push('/vehicles?tab=recent')}
            className="text-gray-600"
          >
            View All Recently Viewed
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}