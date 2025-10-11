import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { VehicleFilters } from '@/lib/types';

export interface InventoryAlert {
  id: string;
  userId?: string;
  email: string;
  name: string;
  filters: VehicleFilters & {
    mileageMin?: number;
    mileageMax?: number;
    keywords?: string;
  };
  frequency: 'instant' | 'daily' | 'weekly';
  isActive: boolean;
  createdAt: Date;
  lastNotifiedAt?: Date;
  matchCount: number;
}

interface AlertState {
  // Alerts list
  alerts: InventoryAlert[];
  maxAlerts: number;

  // UI state
  isCreatingAlert: boolean;
  isManagingAlerts: boolean;
  selectedAlert?: InventoryAlert;

  // Actions
  addAlert: (alert: Omit<InventoryAlert, 'id' | 'createdAt' | 'matchCount'>) => void;
  updateAlert: (id: string, updates: Partial<InventoryAlert>) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  clearAlerts: () => void;

  // UI actions
  setCreatingAlert: (creating: boolean) => void;
  setManagingAlerts: (managing: boolean) => void;
  selectAlert: (alert?: InventoryAlert) => void;

  // Utilities
  canCreateMore: () => boolean;
  getActiveAlerts: () => InventoryAlert[];
  getAlertById: (id: string) => InventoryAlert | undefined;
  updateLastNotified: (id: string) => void;
  incrementMatchCount: (id: string) => void;
}

const initialState = {
  alerts: [],
  maxAlerts: 10,
  isCreatingAlert: false,
  isManagingAlerts: false,
  selectedAlert: undefined
};

export const useAlertStore = create<AlertState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        addAlert: (alertData) => set((state) => {
          if (state.alerts.length >= state.maxAlerts) {
            console.warn(`Maximum number of alerts (${state.maxAlerts}) reached`);
            return state;
          }

          const newAlert: InventoryAlert = {
            ...alertData,
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            matchCount: 0
          };

          return {
            alerts: [...state.alerts, newAlert]
          };
        }),

        updateAlert: (id, updates) => set((state) => ({
          alerts: state.alerts.map(alert =>
            alert.id === id
              ? { ...alert, ...updates }
              : alert
          )
        })),

        removeAlert: (id) => set((state) => ({
          alerts: state.alerts.filter(alert => alert.id !== id),
          selectedAlert: state.selectedAlert?.id === id ? undefined : state.selectedAlert
        })),

        toggleAlert: (id) => set((state) => ({
          alerts: state.alerts.map(alert =>
            alert.id === id
              ? { ...alert, isActive: !alert.isActive }
              : alert
          )
        })),

        clearAlerts: () => set({
          alerts: [],
          selectedAlert: undefined
        }),

        setCreatingAlert: (isCreatingAlert) => set({ isCreatingAlert }),

        setManagingAlerts: (isManagingAlerts) => set({ isManagingAlerts }),

        selectAlert: (selectedAlert) => set({ selectedAlert }),

        canCreateMore: () => {
          const state = get();
          return state.alerts.length < state.maxAlerts;
        },

        getActiveAlerts: () => {
          const state = get();
          return state.alerts.filter(alert => alert.isActive);
        },

        getAlertById: (id) => {
          const state = get();
          return state.alerts.find(alert => alert.id === id);
        },

        updateLastNotified: (id) => set((state) => ({
          alerts: state.alerts.map(alert =>
            alert.id === id
              ? { ...alert, lastNotifiedAt: new Date() }
              : alert
          )
        })),

        incrementMatchCount: (id) => set((state) => ({
          alerts: state.alerts.map(alert =>
            alert.id === id
              ? { ...alert, matchCount: alert.matchCount + 1 }
              : alert
          )
        }))
      }),
      {
        name: 'inventory-alerts',
        partialize: (state) => ({
          alerts: state.alerts
        })
      }
    ),
    {
      name: 'AlertStore'
    }
  )
);