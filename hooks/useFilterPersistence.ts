'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';

interface FilterState {
  search: string;
  make: string[];
  fuelType: string[];
  transmission: string[];
  bodyType: string[];
  priceRange: [number, number];
  yearRange: [number, number];
  mileageMax: number;
  featuresRequired: string[];
  showFeaturedOnly: boolean;
  sortBy: 'price_asc' | 'price_desc' | 'year_desc' | 'mileage_asc' | 'featured';
}

export function useFilterPersistence(
  filters: FilterState,
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>,
  dataRanges: { minPrice: number; maxPrice: number; minYear: number; maxYear: number }
) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load filters from URL on mount
  useEffect(() => {
    const urlFilters: Partial<FilterState> = {};

    // Parse URL parameters
    const searchParam = searchParams.get('search');
    const makeParam = searchParams.get('make');
    const fuelParam = searchParams.get('fuel');
    const transmissionParam = searchParams.get('transmission');
    const bodyParam = searchParams.get('body');
    const featuresParam = searchParams.get('features');
    const featuredParam = searchParams.get('featured');
    const sortParam = searchParams.get('sort');

    if (searchParam) urlFilters.search = searchParam;
    if (makeParam) urlFilters.make = makeParam.split(',');
    if (fuelParam) urlFilters.fuelType = fuelParam.split(',');
    if (transmissionParam) urlFilters.transmission = transmissionParam.split(',');
    if (bodyParam) urlFilters.bodyType = bodyParam.split(',');
    if (featuresParam) urlFilters.featuresRequired = featuresParam.split(',');
    if (featuredParam) urlFilters.showFeaturedOnly = featuredParam === 'true';
    if (sortParam) urlFilters.sortBy = sortParam as FilterState['sortBy'];

    // Parse ranges
    if (searchParams.get('priceMin') || searchParams.get('priceMax')) {
      const priceMin = parseInt(searchParams.get('priceMin') || dataRanges.minPrice.toString());
      const priceMax = parseInt(searchParams.get('priceMax') || dataRanges.maxPrice.toString());
      urlFilters.priceRange = [priceMin, priceMax];
    }

    if (searchParams.get('yearMin') || searchParams.get('yearMax')) {
      const yearMin = parseInt(searchParams.get('yearMin') || dataRanges.minYear.toString());
      const yearMax = parseInt(searchParams.get('yearMax') || dataRanges.maxYear.toString());
      urlFilters.yearRange = [yearMin, yearMax];
    }

    const mileageMaxParam = searchParams.get('mileageMax');
    if (mileageMaxParam) {
      urlFilters.mileageMax = parseInt(mileageMaxParam);
    }

    // Update filters if URL has parameters
    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }));
    }
  }, [searchParams, setFilters, dataRanges]);

  // Update URL when filters change
  const updateUrl = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams();

    // Only add non-default values to keep URL clean
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.make.length > 0) params.set('make', newFilters.make.join(','));
    if (newFilters.fuelType.length > 0) params.set('fuel', newFilters.fuelType.join(','));
    if (newFilters.transmission.length > 0) params.set('transmission', newFilters.transmission.join(','));
    if (newFilters.bodyType.length > 0) params.set('body', newFilters.bodyType.join(','));
    if (newFilters.featuresRequired.length > 0) params.set('features', newFilters.featuresRequired.join(','));
    if (newFilters.showFeaturedOnly) params.set('featured', 'true');
    if (newFilters.sortBy !== 'featured') params.set('sort', newFilters.sortBy);

    // Price range (only if not default)
    if (newFilters.priceRange[0] !== dataRanges.minPrice) {
      params.set('priceMin', newFilters.priceRange[0].toString());
    }
    if (newFilters.priceRange[1] !== dataRanges.maxPrice) {
      params.set('priceMax', newFilters.priceRange[1].toString());
    }

    // Year range (only if not default)
    if (newFilters.yearRange[0] !== dataRanges.minYear) {
      params.set('yearMin', newFilters.yearRange[0].toString());
    }
    if (newFilters.yearRange[1] !== dataRanges.maxYear) {
      params.set('yearMax', newFilters.yearRange[1].toString());
    }

    // Mileage (only if not default)
    if (newFilters.mileageMax !== 300000) {
      params.set('mileageMax', newFilters.mileageMax.toString());
    }

    // Update URL without page refresh
    const newUrl = params.toString() ? `?${params.toString()}` : '/vehicles';
    router.replace(newUrl, { scroll: false });
  }, [router, dataRanges]);

  return { updateUrl };
}

export default useFilterPersistence;