import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Vehicle } from '@/lib/types';

interface ViewedVehicle {
  vehicle: Vehicle;
  viewedAt: Date;
  viewCount: number;
  timeSpent: number; // seconds
  source?: 'search' | 'direct' | 'comparison' | 'favorites' | 'external';
}

interface RecentlyViewedState {
  // Viewed vehicles list (FIFO, max 20)
  viewedVehicles: ViewedVehicle[];
  maxVehicles: number;

  // Analytics
  totalViews: number;
  averageTimeSpent: number;
  mostViewedMakes: { make: string; count: number }[];

  // Session tracking
  currentViewing?: {
    vehicleId: string;
    startTime: Date;
  };

  // Actions
  addViewedVehicle: (vehicle: Vehicle, source?: ViewedVehicle['source']) => void;
  removeViewedVehicle: (vehicleId: string) => void;
  clearViewedVehicles: () => void;

  // Session tracking
  startViewing: (vehicleId: string) => void;
  endViewing: () => void;

  // Utilities
  getViewedVehicle: (vehicleId: string) => ViewedVehicle | undefined;
  isRecentlyViewed: (vehicleId: string) => boolean;
  getViewCount: (vehicleId: string) => number;
  getMostViewed: (limit?: number) => ViewedVehicle[];
  updateAnalytics: () => void;
}

const initialState = {
  viewedVehicles: [],
  maxVehicles: 20,
  totalViews: 0,
  averageTimeSpent: 0,
  mostViewedMakes: [],
  currentViewing: undefined
};

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        addViewedVehicle: (vehicle, source = 'direct') => set((state) => {
          const existingIndex = state.viewedVehicles.findIndex(
            v => v.vehicle.id === vehicle.id
          );

          let newViewedVehicles: ViewedVehicle[];

          if (existingIndex !== -1) {
            // Vehicle already viewed, update it and move to front
            const existing = state.viewedVehicles[existingIndex];
            const updated: ViewedVehicle = {
              ...existing,
              viewedAt: new Date(),
              viewCount: existing.viewCount + 1,
              source
            };

            newViewedVehicles = [
              updated,
              ...state.viewedVehicles.filter((_, i) => i !== existingIndex)
            ];
          } else {
            // New vehicle view
            const newView: ViewedVehicle = {
              vehicle,
              viewedAt: new Date(),
              viewCount: 1,
              timeSpent: 0,
              source
            };

            newViewedVehicles = [
              newView,
              ...state.viewedVehicles
            ].slice(0, state.maxVehicles);
          }

          return {
            viewedVehicles: newViewedVehicles,
            totalViews: state.totalViews + 1
          };
        }),

        removeViewedVehicle: (vehicleId) => set((state) => ({
          viewedVehicles: state.viewedVehicles.filter(
            v => v.vehicle.id !== vehicleId
          )
        })),

        clearViewedVehicles: () => set({
          viewedVehicles: [],
          totalViews: 0,
          averageTimeSpent: 0,
          mostViewedMakes: []
        }),

        startViewing: (vehicleId) => set({
          currentViewing: {
            vehicleId,
            startTime: new Date()
          }
        }),

        endViewing: () => set((state) => {
          if (!state.currentViewing) return state;

          const timeSpent = Math.floor(
            (Date.now() - state.currentViewing.startTime.getTime()) / 1000
          );

          const updatedVehicles = state.viewedVehicles.map(v => {
            if (v.vehicle.id === state.currentViewing!.vehicleId) {
              return {
                ...v,
                timeSpent: v.timeSpent + timeSpent
              };
            }
            return v;
          });

          // Calculate new average time spent
          const totalTimeSpent = updatedVehicles.reduce(
            (sum, v) => sum + v.timeSpent,
            0
          );
          const averageTimeSpent = updatedVehicles.length > 0
            ? totalTimeSpent / updatedVehicles.length
            : 0;

          return {
            viewedVehicles: updatedVehicles,
            currentViewing: undefined,
            averageTimeSpent
          };
        }),

        getViewedVehicle: (vehicleId) => {
          const state = get();
          return state.viewedVehicles.find(v => v.vehicle.id === vehicleId);
        },

        isRecentlyViewed: (vehicleId) => {
          const state = get();
          return state.viewedVehicles.some(v => v.vehicle.id === vehicleId);
        },

        getViewCount: (vehicleId) => {
          const state = get();
          const viewed = state.viewedVehicles.find(v => v.vehicle.id === vehicleId);
          return viewed?.viewCount || 0;
        },

        getMostViewed: (limit = 5) => {
          const state = get();
          return [...state.viewedVehicles]
            .sort((a, b) => b.viewCount - a.viewCount)
            .slice(0, limit);
        },

        updateAnalytics: () => set((state) => {
          // Calculate most viewed makes
          const makeCount = new Map<string, number>();

          state.viewedVehicles.forEach(v => {
            const make = v.vehicle.make;
            makeCount.set(make, (makeCount.get(make) || 0) + v.viewCount);
          });

          const mostViewedMakes = Array.from(makeCount.entries())
            .map(([make, count]) => ({ make, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

          // Calculate average time spent
          const totalTimeSpent = state.viewedVehicles.reduce(
            (sum, v) => sum + v.timeSpent,
            0
          );
          const averageTimeSpent = state.viewedVehicles.length > 0
            ? totalTimeSpent / state.viewedVehicles.length
            : 0;

          return {
            mostViewedMakes,
            averageTimeSpent
          };
        })
      }),
      {
        name: 'recently-viewed',
        partialize: (state) => ({
          viewedVehicles: state.viewedVehicles,
          totalViews: state.totalViews
        })
      }
    ),
    {
      name: 'RecentlyViewedStore'
    }
  )
);