import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Vehicle, VehicleFilters } from '@/lib/types';

export interface SearchState {
  // Search query
  query: string;

  // Active filters
  filters: VehicleFilters & {
    mileageMin?: number;
    mileageMax?: number;
    drivetrain?: string;
    color?: string;
    features?: string[];
    doors?: number;
    seats?: number;
  };

  // Sort options
  sortBy: 'relevance' | 'price-low' | 'price-high' | 'year-new' | 'year-old' |
          'mileage-low' | 'mileage-high' | 'featured' | 'recent';

  // Results
  results: Vehicle[];
  totalResults: number;
  isLoading: boolean;
  hasMore: boolean;

  // Pagination
  page: number;
  pageSize: number;
  cursor?: string;

  // Search metadata
  suggestions: string[];
  searchHistory: string[];
  popularSearches: string[];
  facets: {
    makes: Array<{ value: string; count: number }>;
    bodyTypes: Array<{ value: string; count: number }>;
    fuelTypes: Array<{ value: string; count: number }>;
    priceRanges: Array<{ min: number; max: number; count: number }>;
  };

  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchState['filters']>) => void;
  updateFilter: (key: string, value: any) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  setSortBy: (sortBy: SearchState['sortBy']) => void;

  // Results management
  setResults: (results: Vehicle[], append?: boolean) => void;
  setTotalResults: (total: number) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;

  // Pagination
  nextPage: () => void;
  previousPage: () => void;
  setPage: (page: number) => void;
  setCursor: (cursor?: string) => void;

  // Search helpers
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  setSuggestions: (suggestions: string[]) => void;
  setPopularSearches: (searches: string[]) => void;
  setFacets: (facets: SearchState['facets']) => void;

  // Reset
  resetSearch: () => void;
}

const initialState = {
  query: '',
  filters: {},
  sortBy: 'relevance' as const,
  results: [],
  totalResults: 0,
  isLoading: false,
  hasMore: false,
  page: 1,
  pageSize: 12,
  cursor: undefined,
  suggestions: [],
  searchHistory: [],
  popularSearches: [],
  facets: {
    makes: [],
    bodyTypes: [],
    fuelTypes: [],
    priceRanges: []
  }
};

export const useSearchStore = create<SearchState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setQuery: (query) => set({ query }),

        setFilters: (filters) => set((state) => ({
          filters: { ...state.filters, ...filters }
        })),

        updateFilter: (key, value) => set((state) => ({
          filters: { ...state.filters, [key]: value }
        })),

        removeFilter: (key) => set((state) => {
          const newFilters = { ...state.filters };
          delete newFilters[key as keyof typeof newFilters];
          return { filters: newFilters };
        }),

        clearFilters: () => set({ filters: {}, page: 1 }),

        setSortBy: (sortBy) => set({ sortBy, page: 1 }),

        setResults: (results, append = false) => set((state) => ({
          results: append ? [...state.results, ...results] : results
        })),

        setTotalResults: (totalResults) => set({ totalResults }),

        setLoading: (isLoading) => set({ isLoading }),

        setHasMore: (hasMore) => set({ hasMore }),

        nextPage: () => set((state) => ({ page: state.page + 1 })),

        previousPage: () => set((state) => ({
          page: Math.max(1, state.page - 1)
        })),

        setPage: (page) => set({ page }),

        setCursor: (cursor) => set({ cursor }),

        addToHistory: (query) => set((state) => {
          if (!query.trim()) return state;

          const newHistory = [
            query,
            ...state.searchHistory.filter(q => q !== query)
          ].slice(0, 20); // Keep last 20 searches

          return { searchHistory: newHistory };
        }),

        clearHistory: () => set({ searchHistory: [] }),

        setSuggestions: (suggestions) => set({ suggestions }),

        setPopularSearches: (popularSearches) => set({ popularSearches }),

        setFacets: (facets) => set({ facets }),

        resetSearch: () => set({
          ...initialState,
          searchHistory: [], // Preserve search history
        })
      }),
      {
        name: 'vehicle-search',
        partialize: (state) => ({
          searchHistory: state.searchHistory,
          filters: state.filters,
          sortBy: state.sortBy,
          pageSize: state.pageSize
        })
      }
    ),
    {
      name: 'SearchStore'
    }
  )
);