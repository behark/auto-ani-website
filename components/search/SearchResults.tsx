'use client';

import { Vehicle } from '@/lib/types';
import VehicleCard from '@/components/vehicles/VehicleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, SortAsc, Eye, Grid3x3, List } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SearchResultsProps {
  results: Vehicle[];
  query: string;
  resultCount: number;
  isLoading: boolean;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onShowFilters?: () => void;
  className?: string;
}

export default function SearchResults({
  results,
  query,
  resultCount,
  isLoading,
  viewMode,
  onViewModeChange,
  onShowFilters,
  className
}: SearchResultsProps) {
  const { t } = useLanguage();

  const highlightSearchTerm = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, index) => (
      <span
        key={index}
        className={
          part.toLowerCase() === searchQuery.toLowerCase()
            ? 'bg-yellow-200 font-medium'
            : ''
        }
      >
        {part}
      </span>
    ));
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-600">
            <Search className="h-6 w-6 animate-pulse" />
            <span className="text-lg">Searching vehicles...</span>
          </div>
        </div>
      </div>
    );
  }

  if (resultCount === 0) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No vehicles found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {query
                ? `No vehicles match your search for &quot;${query}&quot;. Try adjusting your search terms or filters.`
                : 'No vehicles match your current filters. Try adjusting your criteria.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {onShowFilters && (
                <Button variant="outline" onClick={onShowFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Adjust Filters
                </Button>
              )}
              <Button variant="outline" onClick={() => window.location.reload()}>
                <Search className="h-4 w-4 mr-2" />
                Clear Search
              </Button>
            </div>

            <div className="mt-8 text-left">
              <h4 className="font-medium text-gray-700 mb-3">Search suggestions:</h4>
              <div className="flex flex-wrap gap-2 justify-center">
                {['BMW', 'Mercedes', 'Audi', 'SUV', 'Sedan', 'Under €30,000'].map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="secondary"
                    className="cursor-pointer hover:bg-[var(--primary-orange)] hover:text-white"
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {query ? (
              <>
                Search results for{' '}
                <span className="text-[var(--primary-orange)]">&quot;{query}&quot;</span>
              </>
            ) : (
              'All Vehicles'
            )}
          </h2>
          <Badge variant="outline" className="text-sm">
            {resultCount} {resultCount === 1 ? 'vehicle' : 'vehicles'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {onShowFilters && (
            <Button variant="outline" size="sm" onClick={onShowFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          )}

          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => onViewModeChange('grid')}
              className={viewMode === 'grid' ? 'bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]' : ''}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => onViewModeChange('list')}
              className={viewMode === 'list' ? 'bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search Query Highlights */}
      {query && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-[var(--primary-orange)]" />
              <div>
                <p className="text-sm text-gray-700">
                  Showing results for <strong>&quot;{query}&quot;</strong>
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Results are sorted by relevance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Grid/List */}
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
          : 'space-y-6'
      }>
        {results.map((vehicle) => (
          <div key={vehicle.id} className="relative">
            <VehicleCard vehicle={vehicle} viewMode={viewMode} />

            {/* Search score indicator for development */}
            {process.env.NODE_ENV === 'development' && query && 'searchScore' in vehicle && (
              <div className="absolute top-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                Score: {(vehicle as any).searchScore}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More / Pagination could go here */}
      {results.length >= 9 && (
        <div className="text-center pt-6">
          <p className="text-gray-600 text-sm">
            Showing {results.length} of {resultCount} vehicles
          </p>
        </div>
      )}
    </div>
  );
}