'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useSearchStore } from '@/store/searchStore';
import type { SearchState } from '@/store/searchStore';
import { useSavedSearchStore } from '@/store/savedSearchStore';
import VehicleCard from '@/components/vehicles/VehicleCard';
import VehicleSearchBox from '@/components/search/VehicleSearchBox';
import AdvancedSearchPanel from '@/components/search/AdvancedSearchPanel';
import FilterChips from '@/components/search/FilterChips';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Grid3x3,
  List,
  Save,
  Bell,
  Share2,
  ChevronUp,
  Search
} from 'lucide-react';
import {
  parseSearchParams,
  updateSearchURL,
  getShareableSearchURL,
  hasActiveFilters,
  clearFilters,
  mergeFilters,
  SearchURLParams
} from '@/lib/urlParams';
import { Vehicle } from '@/lib/types';

interface SearchResponse {
  vehicles: Vehicle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  facets?: {
    makes: Array<{ value: string; count: number }>;
    bodyTypes: Array<{ value: string; count: number }>;
    fuelTypes: Array<{ value: string; count: number }>;
    transmissions: Array<{ value: string; count: number }>;
    priceRange: { min: number; max: number; avg: number };
    yearRange: { min: number; max: number };
    mileageRange: { min: number; max: number; avg: number };
  };
  popularSearches?: string[];
  searchMetadata?: {
    query: string;
    appliedFilters: Record<string, unknown>;
    sortBy: string;
    responseTime: number;
  };
}

export default function EnhancedVehiclesPage() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px'
  });

  // Parse URL params
  const urlParams = parseSearchParams(searchParams || new URLSearchParams());

  // Zustand stores
  const searchStore = useSearchStore();
  const savedSearchStore = useSavedSearchStore();

  // Fetch search results with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery<SearchResponse>({
    queryKey: ['vehicleSearch', urlParams],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();

      // Add all search parameters
      if (urlParams.q) params.append('q', urlParams.q);
      if (urlParams.make) params.append('make', urlParams.make);
      if (urlParams.model) params.append('model', urlParams.model);
      if (urlParams.bodyType) params.append('bodyType', urlParams.bodyType);
      if (urlParams.fuelType) params.append('fuelType', urlParams.fuelType);
      if (urlParams.transmission) params.append('transmission', urlParams.transmission);
      if (urlParams.priceMin) params.append('priceMin', urlParams.priceMin.toString());
      if (urlParams.priceMax) params.append('priceMax', urlParams.priceMax.toString());
      if (urlParams.yearMin) params.append('yearMin', urlParams.yearMin.toString());
      if (urlParams.yearMax) params.append('yearMax', urlParams.yearMax.toString());
      if (urlParams.mileageMin) params.append('mileageMin', urlParams.mileageMin.toString());
      if (urlParams.mileageMax) params.append('mileageMax', urlParams.mileageMax.toString());
      if (urlParams.features) params.append('features', urlParams.features);
      if (urlParams.sortBy) params.append('sortBy', urlParams.sortBy);

      params.append('page', String(pageParam));
      params.append('limit', '12');
      params.append('includeFacets', 'true');
      params.append('includeAnalytics', 'true');

      // Add session/user tracking
      const sessionId = localStorage.getItem('sessionId') || generateSessionId();
      params.append('sessionId', sessionId);

      const response = await fetch(`/api/vehicles/search?${params}`);
      if (!response.ok) throw new Error('Search failed');

      return response.json();
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNext) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1
  });

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Track scroll position for "scroll to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update Zustand store with search results
  useEffect(() => {
    if (data?.pages?.[0]) {
      const firstPage = data.pages[0];
      searchStore.setQuery(urlParams.q || '');
      searchStore.setFilters({
        ...urlParams,
        features: urlParams.features ? urlParams.features.split(',') : undefined
      });
      searchStore.setSortBy((urlParams.sortBy as SearchState['sortBy']) || 'relevance');

      if (firstPage.facets) {
        // Transform facets to match searchStore format
        const storeFacets = {
          makes: firstPage.facets.makes || [],
          bodyTypes: firstPage.facets.bodyTypes || [],
          fuelTypes: firstPage.facets.fuelTypes || [],
          priceRanges: [] // searchStore expects priceRanges array, not priceRange object
        };
        searchStore.setFacets(storeFacets);
      }

      if (firstPage.popularSearches) {
        searchStore.setPopularSearches(firstPage.popularSearches);
      }
    }
  }, [data, urlParams, searchStore]);

  // Handlers
  const handleSearch = (query: string) => {
    searchStore.addToHistory(query);
    updateSearchURL({ q: query, page: 1 });
  };

  const handleFiltersChange = (newFilters: Partial<SearchURLParams>) => {
    const merged = mergeFilters(urlParams, newFilters);
    updateSearchURL(merged);
  };

  const handleSortChange = (sortBy: string) => {
    updateSearchURL({ sortBy, page: 1 });
  };

  const handleRemoveFilter = (key: keyof SearchURLParams) => {
    const newParams = { ...urlParams };
    delete newParams[key];
    updateSearchURL(newParams);
  };

  const handleClearFilters = () => {
    const cleared = clearFilters(urlParams);
    updateSearchURL(cleared);
  };

  const handleSaveSearch = async () => {
    if (!savedSearchStore.canSaveMore()) {
      toast.error('Maximum saved searches reached');
      return;
    }

    const searchName = prompt('Name this search:');
    if (!searchName) return;

    savedSearchStore.saveSearch({
      name: searchName,
      query: urlParams.q,
      filters: urlParams,
      sortBy: urlParams.sortBy,
      notifyOnNew: false
    });

    toast.success('Search saved successfully');
  };

  const handleCreateAlert = () => {
    // Open alert creation modal
    toast.success('Alert creation coming soon!');
  };

  const handleShare = () => {
    const shareUrl = getShareableSearchURL(urlParams);
    navigator.clipboard.writeText(shareUrl);
    toast.success('Search link copied to clipboard');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate session ID if needed
  const generateSessionId = () => {
    const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('sessionId', id);
    return id;
  };

  // Flatten pages for rendering
  const vehicles = data?.pages?.flatMap(page => page.vehicles) || [];
  const totalResults = data?.pages?.[0]?.pagination?.total || 0;
  const facets = data?.pages?.[0]?.facets;
  const responseTime = data?.pages?.[0]?.searchMetadata?.responseTime;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Box */}
            <div className="flex-1">
              <VehicleSearchBox
                query={urlParams.q || ''}
                suggestions={searchStore.suggestions}
                searchHistory={searchStore.searchHistory}
                isLoading={isLoading}
                onQueryChange={(q) => updateSearchURL({ q })}
                onSearch={handleSearch}
                onClearHistory={() => searchStore.clearHistory()}
                onShowFilters={() => setShowAdvancedFilters(true)}
                placeholder="Search by make, model, or keywords..."
              />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveSearch}
                className="hidden sm:flex"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateAlert}
                className="hidden sm:flex"
              >
                <Bell className="h-4 w-4 mr-1" />
                Alert
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters(urlParams) && (
            <div className="mt-3">
              <FilterChips
                filters={urlParams}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={handleClearFilters}
              />
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm sticky top-24">
              <AdvancedSearchPanel
                filters={urlParams}
                onFiltersChange={handleFiltersChange}
                onClearAll={handleClearFilters}
                facets={facets}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    {totalResults} Vehicles Found
                  </h2>
                  {responseTime && (
                    <p className="text-sm text-gray-500">
                      Results in {responseTime}ms
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Mobile Filter Button */}
                  <AdvancedSearchPanel
                    filters={urlParams}
                    onFiltersChange={handleFiltersChange}
                    onClearAll={handleClearFilters}
                    facets={facets}
                    isOpen={showAdvancedFilters}
                    onOpenChange={setShowAdvancedFilters}
                    isMobile
                  />

                  {/* Sort Dropdown */}
                  <Select
                    value={urlParams.sortBy || 'relevance'}
                    onValueChange={handleSortChange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="year-new">Year: Newest First</SelectItem>
                      <SelectItem value="year-old">Year: Oldest First</SelectItem>
                      <SelectItem value="mileage-low">Mileage: Low to High</SelectItem>
                      <SelectItem value="recent">Recently Added</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Mode Toggle */}
                  <div className="flex gap-1 border rounded-lg p-1">
                    <Button
                      size="sm"
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Grid/List */}
            {isLoading && !data ? (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
              }>
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-80" />
                ))}
              </div>
            ) : vehicles.length > 0 ? (
              <>
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
                }>
                  {vehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Load More Trigger */}
                {hasNextPage && (
                  <div
                    ref={loadMoreRef}
                    className="flex justify-center py-8"
                  >
                    {isFetchingNextPage ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary-orange)]" />
                        <span className="text-gray-600">Loading more vehicles...</span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => fetchNextPage()}
                      >
                        Load More
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No vehicles found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-[var(--primary-orange)] text-white rounded-full shadow-lg hover:bg-[var(--primary-dark)] transition-all"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}