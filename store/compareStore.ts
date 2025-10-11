import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Vehicle } from '@/lib/types';

interface CompareState {
  // Vehicles being compared (max 4)
  vehicles: (Vehicle | null)[];
  maxVehicles: number;

  // UI state
  isModalOpen: boolean;
  highlightDifferences: boolean;
  showOnlyDifferences: boolean;

  // Comparison metadata
  comparisonId?: string;
  createdAt?: Date;
  lastModified?: Date;

  // Actions
  addVehicle: (vehicle: Vehicle) => void;
  removeVehicle: (vehicleId: string) => void;
  replaceVehicle: (index: number, vehicle: Vehicle | null) => void;
  clearComparison: () => void;

  // UI actions
  toggleModal: () => void;
  setHighlightDifferences: (highlight: boolean) => void;
  setShowOnlyDifferences: (show: boolean) => void;

  // Utilities
  canAddMore: () => boolean;
  isInComparison: (vehicleId: string) => boolean;
  getComparisonUrl: () => string;
  exportComparison: () => void;
}

const initialState = {
  vehicles: [null, null, null, null],
  maxVehicles: 4,
  isModalOpen: false,
  highlightDifferences: true,
  showOnlyDifferences: false,
  comparisonId: undefined,
  createdAt: undefined,
  lastModified: undefined
};

export const useCompareStore = create<CompareState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        addVehicle: (vehicle) => set((state) => {
          const emptyIndex = state.vehicles.findIndex(v => v === null);
          if (emptyIndex === -1) {
            // Replace the oldest vehicle if all slots are full
            const newVehicles = [...state.vehicles];
            newVehicles[0] = vehicle;
            return {
              vehicles: newVehicles,
              lastModified: new Date()
            };
          }

          const newVehicles = [...state.vehicles];
          newVehicles[emptyIndex] = vehicle;

          return {
            vehicles: newVehicles,
            lastModified: new Date(),
            createdAt: state.createdAt || new Date()
          };
        }),

        removeVehicle: (vehicleId) => set((state) => {
          const newVehicles = state.vehicles.map(v =>
            v?.id === vehicleId ? null : v
          );

          return {
            vehicles: newVehicles,
            lastModified: new Date()
          };
        }),

        replaceVehicle: (index, vehicle) => set((state) => {
          if (index < 0 || index >= state.maxVehicles) return state;

          const newVehicles = [...state.vehicles];
          newVehicles[index] = vehicle;

          return {
            vehicles: newVehicles,
            lastModified: new Date()
          };
        }),

        clearComparison: () => set({
          vehicles: [null, null, null, null],
          comparisonId: undefined,
          createdAt: undefined,
          lastModified: undefined
        }),

        toggleModal: () => set((state) => ({
          isModalOpen: !state.isModalOpen
        })),

        setHighlightDifferences: (highlightDifferences) => set({
          highlightDifferences
        }),

        setShowOnlyDifferences: (showOnlyDifferences) => set({
          showOnlyDifferences
        }),

        canAddMore: () => {
          const state = get();
          return state.vehicles.filter(v => v !== null).length < state.maxVehicles;
        },

        isInComparison: (vehicleId) => {
          const state = get();
          return state.vehicles.some(v => v?.id === vehicleId);
        },

        getComparisonUrl: () => {
          const state = get();
          const vehicleIds = state.vehicles
            .filter(v => v !== null)
            .map(v => v!.id)
            .join(',');

          if (!vehicleIds) return '';

          return `${window.location.origin}/compare?vehicles=${vehicleIds}`;
        },

        exportComparison: () => {
          const state = get();
          const activeVehicles = state.vehicles.filter(v => v !== null);

          if (activeVehicles.length === 0) {
            console.warn('No vehicles to export');
            return;
          }

          const comparisonData = {
            vehicles: activeVehicles,
            createdAt: state.createdAt,
            exportedAt: new Date(),
            url: state.getComparisonUrl()
          };

          // Create a blob and trigger download
          const blob = new Blob([JSON.stringify(comparisonData, null, 2)], {
            type: 'application/json'
          });

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `vehicle-comparison-${Date.now()}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }),
      {
        name: 'vehicle-compare',
        partialize: (state) => ({
          vehicles: state.vehicles,
          highlightDifferences: state.highlightDifferences,
          showOnlyDifferences: state.showOnlyDifferences
        })
      }
    ),
    {
      name: 'CompareStore'
    }
  )
);