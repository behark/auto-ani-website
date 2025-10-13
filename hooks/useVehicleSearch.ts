'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Vehicle, VehicleFilters } from '@/lib/types';
import { VEHICLES } from '@/lib/constants';

interface SearchState {
  query: string;
  filters: VehicleFilters;
  sortBy: string;
  results: Vehicle[];
  isLoading: boolean;
  resultCount: number;
  suggestions: string[];
  searchHistory: string[];
}

interface UseVehicleSearchOptions {
  debounceMs?: number;
  enableHistory?: boolean;
  maxHistoryItems?: number;
  enableSuggestions?: boolean;
}

export function useVehicleSearch(options: UseVehicleSearchOptions = {}) {
  const {
    debounceMs = 300,
    enableHistory = true,
    maxHistoryItems = 10,
    enableSuggestions = true
  } = options;

  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    filters: {},
    sortBy: 'relevance',
    results: [],
    isLoading: false,
    resultCount: 0,
    suggestions: [],
    searchHistory: []
  });

  // Load search history from localStorage
  useEffect(() => {
    if (enableHistory && typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('vehicleSearchHistory');
      if (savedHistory) {
        try {
          const history = JSON.parse(savedHistory);
          setSearchState(prev => ({ ...prev, searchHistory: history }));
        } catch (error) {
          console.warn('Failed to parse search history:', error);
        }
      }
    }
  }, [enableHistory]);

  // Save search history to localStorage
  const saveSearchHistory = useCallback((history: string[]) => {
    if (enableHistory && typeof window !== 'undefined') {
      localStorage.setItem('vehicleSearchHistory', JSON.stringify(history));
    }
  }, [enableHistory]);

  // Generate search suggestions
  const generateSuggestions = useCallback((query: string): string[] => {
    if (!enableSuggestions || !query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    const suggestions = new Set<string>();

    // Search in vehicle makes, models, and features
    VEHICLES.forEach(vehicle => {
      const searchableFields = [
        vehicle.make,
        vehicle.model,
        `${vehicle.make} ${vehicle.model}`,
        vehicle.bodyType,
        vehicle.fuelType,
        vehicle.transmission,
        vehicle.color,
        ...vehicle.features
      ];

      searchableFields.forEach(field => {
        if (field.toLowerCase().includes(lowerQuery)) {
          // Add the full field as suggestion
          suggestions.add(field);

          // Add partial matches for longer fields
          if (field.toLowerCase().startsWith(lowerQuery)) {
            suggestions.add(field);
          }
        }
      });
    });

    return Array.from(suggestions).slice(0, 8);
  }, [enableSuggestions]);

  // Perform search with scoring for relevance
  const performSearch = useCallback((
    query: string,
    filters: VehicleFilters,
    sortBy: string
  ): Vehicle[] => {
    let results = [...VEHICLES];

    // Apply text search with scoring
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      const queryTerms = lowerQuery.split(' ').filter(term => term.length > 0);

      results = results.map(vehicle => {
        let score = 0;
        const searchText = `${vehicle.make} ${vehicle.model} ${vehicle.description} ${vehicle.features.join(' ')} ${vehicle.color} ${vehicle.bodyType} ${vehicle.fuelType}`.toLowerCase();

        queryTerms.forEach(term => {
          // Exact match in make/model gets highest score
          if (vehicle.make.toLowerCase().includes(term) || vehicle.model.toLowerCase().includes(term)) {
            score += 10;
          }
          // Match in description
          if (vehicle.description.toLowerCase().includes(term)) {
            score += 3;
          }
          // Match in features
          if (vehicle.features.some(feature => feature.toLowerCase().includes(term))) {
            score += 2;
          }
          // General text match
          if (searchText.includes(term)) {
            score += 1;
          }
        });

        return { ...vehicle, searchScore: score };
      }).filter(vehicle => vehicle.searchScore > 0);
    }

    // Apply filters
    if (filters.make) {
      results = results.filter(v => v.make === filters.make);
    }
    if (filters.bodyType) {
      results = results.filter(v => v.bodyType === filters.bodyType);
    }
    if (filters.fuelType) {
      results = results.filter(v => v.fuelType === filters.fuelType);
    }
    if (filters.transmission) {
      results = results.filter(v => v.transmission === filters.transmission);
    }
    if (filters.priceMin !== undefined) {
      results = results.filter(v => v.price >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      results = results.filter(v => v.price <= filters.priceMax!);
    }
    if (filters.yearMin !== undefined) {
      results = results.filter(v => v.year >= filters.yearMin!);
    }
    if (filters.yearMax !== undefined) {
      results = results.filter(v => v.year <= filters.yearMax!);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'year-new':
        results.sort((a, b) => b.year - a.year);
        break;
      case 'year-old':
        results.sort((a, b) => a.year - b.year);
        break;
      case 'mileage-low':
        results.sort((a, b) => a.mileage - b.mileage);
        break;
      case 'featured':
        results.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      case 'relevance':
      default:
        if (query.trim()) {
          // Sort by search score for text queries
          results.sort((a, b) => (b.searchScore || 0) - (a.searchScore || 0));
        } else {
          // Default to featured + facebook order for browsing
          results.sort((a, b) => {
            if (a.featured !== b.featured) {
              return b.featured ? 1 : -1;
            }
            const aOrder = 'facebook_order' in a ? (a as any).facebook_order : 999;
            const bOrder = 'facebook_order' in b ? (b as any).facebook_order : 999;
            return (aOrder || 999) - (bOrder || 999);
          });
        }
        break;
    }

    return results;
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchState(prev => ({
        ...prev,
        isLoading: true
      }));

      const results = performSearch(searchState.query, searchState.filters, searchState.sortBy);
      const suggestions = generateSuggestions(searchState.query);

      setSearchState(prev => ({
        ...prev,
        results,
        resultCount: results.length,
        suggestions,
        isLoading: false
      }));
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchState.query, searchState.filters, searchState.sortBy, debounceMs, performSearch, generateSuggestions]);

  // Actions
  const setQuery = useCallback((query: string) => {
    setSearchState(prev => ({ ...prev, query }));
  }, []);

  const setFilters = useCallback((filters: VehicleFilters) => {
    setSearchState(prev => ({ ...prev, filters }));
  }, []);

  const setSortBy = useCallback((sortBy: string) => {
    setSearchState(prev => ({ ...prev, sortBy }));
  }, []);

  const addToHistory = useCallback((query: string) => {
    if (!enableHistory || !query.trim()) return;

    setSearchState(prev => {
      const newHistory = [
        query,
        ...prev.searchHistory.filter(item => item !== query)
      ].slice(0, maxHistoryItems);

      saveSearchHistory(newHistory);

      return {
        ...prev,
        searchHistory: newHistory
      };
    });
  }, [enableHistory, maxHistoryItems, saveSearchHistory]);

  const clearHistory = useCallback(() => {
    setSearchState(prev => ({ ...prev, searchHistory: [] }));
    if (enableHistory && typeof window !== 'undefined') {
      localStorage.removeItem('vehicleSearchHistory');
    }
  }, [enableHistory]);

  const clearSearch = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      query: '',
      filters: {},
      suggestions: []
    }));
  }, []);

  return {
    query: searchState.query,
    filters: searchState.filters,
    sortBy: searchState.sortBy,
    results: searchState.results,
    isLoading: searchState.isLoading,
    resultCount: searchState.resultCount,
    suggestions: searchState.suggestions,
    searchHistory: searchState.searchHistory,
    setQuery,
    setFilters,
    setSortBy,
    addToHistory,
    clearHistory,
    clearSearch
  };
}