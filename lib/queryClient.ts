import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Cache time: how long data stays in cache after being unused
      gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime in v4)

      // Retry failed requests
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors
        const errorWithStatus = error as { status?: number } | null | undefined;
        if (errorWithStatus?.status && errorWithStatus.status >= 400 && errorWithStatus.status < 500) {
          return false;
        }
        return failureCount < 3;
      },

      // Refetch on window focus (useful for real-time updates)
      refetchOnWindowFocus: false,

      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Global mutation settings
      retry: 1,
    },
  },
});

// Pre-configure some query keys for consistency
export const queryKeys = {
  vehicles: ['vehicles'] as const,
  vehicleSearch: (params: Record<string, unknown>) => ['vehicles', 'search', params] as const,
  vehicle: (id: string) => ['vehicles', id] as const,
  savedSearches: (sessionId: string) => ['savedSearches', sessionId] as const,
  recentlyViewed: (sessionId: string) => ['recentlyViewed', sessionId] as const,
  inventoryAlerts: (sessionId: string) => ['inventoryAlerts', sessionId] as const,
  comparisonSession: (sessionId: string) => ['comparison', sessionId] as const,
  searchAnalytics: ['searchAnalytics'] as const,
  facets: (filters: Record<string, unknown>) => ['facets', filters] as const,
} as const;