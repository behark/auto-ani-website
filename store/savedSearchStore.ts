import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { VehicleFilters } from '@/lib/types';

export interface SavedSearch {
  id: string;
  name: string;
  query?: string;
  filters: VehicleFilters & {
    mileageMin?: number;
    mileageMax?: number;
  };
  sortBy?: string;
  createdAt: Date;
  lastUsedAt?: Date;
  useCount: number;
  notifyOnNew: boolean;
  tags?: string[];
}

interface SavedSearchState {
  // Saved searches list
  savedSearches: SavedSearch[];
  maxSavedSearches: number;

  // UI state
  isManaging: boolean;
  selectedSearch?: SavedSearch;
  quickAccessSearchIds: string[]; // IDs of searches pinned for quick access

  // Actions
  saveSearch: (search: Omit<SavedSearch, 'id' | 'createdAt' | 'useCount'>) => void;
  updateSearch: (id: string, updates: Partial<SavedSearch>) => void;
  removeSearch: (id: string) => void;
  renameSearch: (id: string, newName: string) => void;
  clearSavedSearches: () => void;

  // Usage tracking
  useSearch: (id: string) => void;
  toggleNotifications: (id: string) => void;

  // Quick access
  toggleQuickAccess: (id: string) => void;
  reorderQuickAccess: (searchIds: string[]) => void;

  // UI actions
  setManaging: (managing: boolean) => void;
  selectSearch: (search?: SavedSearch) => void;

  // Utilities
  canSaveMore: () => boolean;
  getSearchById: (id: string) => SavedSearch | undefined;
  getQuickAccessSearches: () => SavedSearch[];
  getMostUsedSearches: (limit?: number) => SavedSearch[];
  getRecentSearches: (limit?: number) => SavedSearch[];
  searchExists: (filters: VehicleFilters, query?: string) => boolean;
}

const initialState = {
  savedSearches: [],
  maxSavedSearches: 20,
  isManaging: false,
  selectedSearch: undefined,
  quickAccessSearchIds: []
};

export const useSavedSearchStore = create<SavedSearchState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        saveSearch: (searchData) => set((state) => {
          if (state.savedSearches.length >= state.maxSavedSearches) {
            console.warn(`Maximum saved searches (${state.maxSavedSearches}) reached`);
            return state;
          }

          const newSearch: SavedSearch = {
            ...searchData,
            id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            useCount: 0
          };

          return {
            savedSearches: [newSearch, ...state.savedSearches]
          };
        }),

        updateSearch: (id, updates) => set((state) => ({
          savedSearches: state.savedSearches.map(search =>
            search.id === id
              ? { ...search, ...updates }
              : search
          )
        })),

        removeSearch: (id) => set((state) => ({
          savedSearches: state.savedSearches.filter(search => search.id !== id),
          quickAccessSearchIds: state.quickAccessSearchIds.filter(sid => sid !== id),
          selectedSearch: state.selectedSearch?.id === id ? undefined : state.selectedSearch
        })),

        renameSearch: (id, newName) => set((state) => ({
          savedSearches: state.savedSearches.map(search =>
            search.id === id
              ? { ...search, name: newName }
              : search
          )
        })),

        clearSavedSearches: () => set({
          savedSearches: [],
          quickAccessSearchIds: [],
          selectedSearch: undefined
        }),

        useSearch: (id) => set((state) => ({
          savedSearches: state.savedSearches.map(search =>
            search.id === id
              ? {
                  ...search,
                  lastUsedAt: new Date(),
                  useCount: search.useCount + 1
                }
              : search
          )
        })),

        toggleNotifications: (id) => set((state) => ({
          savedSearches: state.savedSearches.map(search =>
            search.id === id
              ? { ...search, notifyOnNew: !search.notifyOnNew }
              : search
          )
        })),

        toggleQuickAccess: (id) => set((state) => {
          const isQuickAccess = state.quickAccessSearchIds.includes(id);

          if (isQuickAccess) {
            return {
              quickAccessSearchIds: state.quickAccessSearchIds.filter(sid => sid !== id)
            };
          } else {
            // Max 5 quick access searches
            const newQuickAccess = [...state.quickAccessSearchIds, id].slice(-5);
            return {
              quickAccessSearchIds: newQuickAccess
            };
          }
        }),

        reorderQuickAccess: (searchIds) => set({
          quickAccessSearchIds: searchIds
        }),

        setManaging: (isManaging) => set({ isManaging }),

        selectSearch: (selectedSearch) => set({ selectedSearch }),

        canSaveMore: () => {
          const state = get();
          return state.savedSearches.length < state.maxSavedSearches;
        },

        getSearchById: (id) => {
          const state = get();
          return state.savedSearches.find(search => search.id === id);
        },

        getQuickAccessSearches: () => {
          const state = get();
          return state.quickAccessSearchIds
            .map(id => state.savedSearches.find(s => s.id === id))
            .filter(Boolean) as SavedSearch[];
        },

        getMostUsedSearches: (limit = 5) => {
          const state = get();
          return [...state.savedSearches]
            .sort((a, b) => b.useCount - a.useCount)
            .slice(0, limit);
        },

        getRecentSearches: (limit = 5) => {
          const state = get();
          return [...state.savedSearches]
            .sort((a, b) => {
              const aTime = a.lastUsedAt?.getTime() || a.createdAt.getTime();
              const bTime = b.lastUsedAt?.getTime() || b.createdAt.getTime();
              return bTime - aTime;
            })
            .slice(0, limit);
        },

        searchExists: (filters, query) => {
          const state = get();
          return state.savedSearches.some(search => {
            const filtersMatch = JSON.stringify(search.filters) === JSON.stringify(filters);
            const queryMatch = search.query === query;
            return filtersMatch && queryMatch;
          });
        }
      }),
      {
        name: 'saved-searches',
        partialize: (state) => ({
          savedSearches: state.savedSearches,
          quickAccessSearchIds: state.quickAccessSearchIds
        })
      }
    ),
    {
      name: 'SavedSearchStore'
    }
  )
);