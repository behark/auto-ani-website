import queryString from 'query-string';
import { VehicleFilters } from '@/lib/types';

export interface SearchURLParams extends VehicleFilters {
  q?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  view?: 'grid' | 'list';
  compare?: string; // comma-separated vehicle IDs
  mileageMin?: number;
  mileageMax?: number;
  features?: string;
}

export const DEFAULT_SEARCH_PARAMS: SearchURLParams = {
  page: 1,
  limit: 12,
  sortBy: 'relevance',
  view: 'grid'
};

// Convert URL params to search filters
export function parseSearchParams(params: URLSearchParams | string): SearchURLParams {
  const parsed = typeof params === 'string'
    ? queryString.parse(params)
    : queryString.parse(params.toString());

  const result: SearchURLParams = {
    ...DEFAULT_SEARCH_PARAMS
  };

  // Text query
  if (parsed.q) result.q = String(parsed.q);

  // Filters
  if (parsed.make) result.make = String(parsed.make);
  if (parsed.model) result.model = String(parsed.model);
  if (parsed.bodyType) result.bodyType = String(parsed.bodyType);
  if (parsed.fuelType) result.fuelType = String(parsed.fuelType);
  if (parsed.transmission) result.transmission = String(parsed.transmission);

  // Numeric filters
  if (parsed.priceMin) result.priceMin = parseInt(String(parsed.priceMin));
  if (parsed.priceMax) result.priceMax = parseInt(String(parsed.priceMax));
  if (parsed.yearMin) result.yearMin = parseInt(String(parsed.yearMin));
  if (parsed.yearMax) result.yearMax = parseInt(String(parsed.yearMax));
  if (parsed.mileageMin) result.mileageMin = parseInt(String(parsed.mileageMin));
  if (parsed.mileageMax) result.mileageMax = parseInt(String(parsed.mileageMax));

  // Features (comma-separated)
  if (parsed.features) {
    result.features = String(parsed.features);
  }

  // Sorting and pagination
  if (parsed.sortBy) result.sortBy = String(parsed.sortBy);
  if (parsed.page) result.page = parseInt(String(parsed.page));
  if (parsed.limit) result.limit = parseInt(String(parsed.limit));

  // View mode
  if (parsed.view === 'list' || parsed.view === 'grid') {
    result.view = parsed.view;
  }

  // Comparison vehicles
  if (parsed.compare) result.compare = String(parsed.compare);

  return result;
}

// Convert search filters to URL params
export function buildSearchParams(params: Partial<SearchURLParams>): string {
  const cleanParams: Record<string, unknown> = {};

  // Only include non-default values
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    // Don't include default values
    if (key === 'page' && value === DEFAULT_SEARCH_PARAMS.page) return;
    if (key === 'limit' && value === DEFAULT_SEARCH_PARAMS.limit) return;
    if (key === 'sortBy' && value === DEFAULT_SEARCH_PARAMS.sortBy) return;
    if (key === 'view' && value === DEFAULT_SEARCH_PARAMS.view) return;

    cleanParams[key] = value;
  });

  return queryString.stringify(cleanParams, {
    skipNull: true,
    skipEmptyString: true,
    arrayFormat: 'comma'
  });
}

// Update URL without page reload
export function updateSearchURL(params: Partial<SearchURLParams>, replace = false) {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  const currentParams = parseSearchParams(url.searchParams);
  const newParams = { ...currentParams, ...params };

  // Remove undefined values
  Object.keys(newParams).forEach(key => {
    if (newParams[key as keyof SearchURLParams] === undefined) {
      delete newParams[key as keyof SearchURLParams];
    }
  });

  const queryStr = buildSearchParams(newParams);
  const newURL = queryStr ? `${url.pathname}?${queryStr}` : url.pathname;

  if (replace) {
    window.history.replaceState({}, '', newURL);
  } else {
    window.history.pushState({}, '', newURL);
  }

  // Dispatch custom event for URL change
  window.dispatchEvent(new CustomEvent('searchParamsChange', {
    detail: newParams
  }));
}

// Get shareable search URL
export function getShareableSearchURL(params: Partial<SearchURLParams>): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const queryStr = buildSearchParams(params);
  return queryStr ? `${origin}/vehicles?${queryStr}` : `${origin}/vehicles`;
}

// Parse vehicle comparison IDs from URL
export function parseCompareIds(compareParam?: string): string[] {
  if (!compareParam) return [];
  return compareParam.split(',').filter(Boolean);
}

// Build comparison URL parameter
export function buildCompareParam(vehicleIds: string[]): string {
  return vehicleIds.filter(Boolean).join(',');
}

// Check if filters are active
export function hasActiveFilters(params: SearchURLParams): boolean {
  const filterKeys: (keyof SearchURLParams)[] = [
    'make', 'model', 'bodyType', 'fuelType', 'transmission',
    'priceMin', 'priceMax', 'yearMin', 'yearMax',
    'mileageMin', 'mileageMax', 'features'
  ];

  return filterKeys.some(key => params[key] !== undefined);
}

// Count active filters
export function countActiveFilters(params: SearchURLParams): number {
  let count = 0;

  if (params.make) count++;
  if (params.model) count++;
  if (params.bodyType) count++;
  if (params.fuelType) count++;
  if (params.transmission) count++;
  if (params.priceMin !== undefined || params.priceMax !== undefined) count++;
  if (params.yearMin !== undefined || params.yearMax !== undefined) count++;
  if (params.mileageMin !== undefined || params.mileageMax !== undefined) count++;
  if (params.features) count++;

  return count;
}

// Clear all filters but keep search query
export function clearFilters(params: SearchURLParams): SearchURLParams {
  return {
    q: params.q,
    sortBy: params.sortBy,
    page: 1, // Reset to first page
    limit: params.limit,
    view: params.view
  };
}

// Merge filter changes
export function mergeFilters(
  current: SearchURLParams,
  updates: Partial<SearchURLParams>
): SearchURLParams {
  const merged = { ...current, ...updates };

  // Reset to page 1 when filters change
  if (updates.make !== undefined ||
      updates.model !== undefined ||
      updates.bodyType !== undefined ||
      updates.fuelType !== undefined ||
      updates.transmission !== undefined ||
      updates.priceMin !== undefined ||
      updates.priceMax !== undefined ||
      updates.yearMin !== undefined ||
      updates.yearMax !== undefined ||
      updates.mileageMin !== undefined ||
      updates.mileageMax !== undefined ||
      updates.features !== undefined) {
    merged.page = 1;
  }

  return merged;
}