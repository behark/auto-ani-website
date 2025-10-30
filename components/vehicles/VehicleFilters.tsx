'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, RotateCcw, Car, Euro } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vehicle } from '@/lib/types';

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

interface VehicleFiltersProps {
  vehicles: Vehicle[];
  onFilter: (filteredVehicles: Vehicle[]) => void;
  className?: string;
}

const FILTER_OPTIONS = {
  makes: ['BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Toyota', 'Honda', 'Ford', 'Peugeot', 'Renault', 'Fiat', 'Opel', 'Skoda', 'Seat', 'Hyundai', 'Kia', 'Mazda', 'Nissan'],
  fuelTypes: ['Diesel', 'Petrol', 'Hybrid', 'Electric', 'LPG', 'CNG'],
  transmissions: ['Manual', 'Automatic', 'Semi-Automatic', 'CVT'],
  bodyTypes: ['Sedan', 'Hatchback', 'SUV', 'Wagon', 'Coupe', 'Convertible', 'Van', 'Pickup', 'Crossover'],
  popularFeatures: ['Air Conditioning', 'ABS Brakes', 'Airbags', 'Bluetooth', 'GPS Navigation', 'Leather Seats', 'Alloy Wheels', 'Electric Windows', 'Keyless Entry', 'Cruise Control']
};

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_desc', label: 'Year: Newest First' },
  { value: 'mileage_asc', label: 'Mileage: Lowest First' }
];

export default function VehicleFilters({ vehicles, onFilter, className = '' }: VehicleFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    make: [],
    fuelType: [],
    transmission: [],
    bodyType: [],
    priceRange: [0, 100000],
    yearRange: [1990, new Date().getFullYear() + 1],
    mileageMax: 300000,
    featuresRequired: [],
    showFeaturedOnly: false,
    sortBy: 'featured'
  });

  // Calculate dynamic price and year ranges from actual data
  const dataRanges = useMemo(() => {
    if (vehicles.length === 0) return { minPrice: 0, maxPrice: 100000, minYear: 1990, maxYear: 2025 };

    const prices = vehicles.map(v => v.price).filter(Boolean);
    const years = vehicles.map(v => v.year).filter(Boolean);

    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      minYear: Math.min(...years),
      maxYear: Math.max(...years)
    };
  }, [vehicles]);

  // Initialize ranges based on data
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      priceRange: [dataRanges.minPrice, dataRanges.maxPrice],
      yearRange: [dataRanges.minYear, dataRanges.maxYear]
    }));
  }, [dataRanges]);

  // Filter and sort vehicles
  const filteredVehicles = useMemo(() => {
    const filtered = vehicles.filter(vehicle => {
      // Text search
      if (filters.search) {
        const searchText = `${vehicle.make} ${vehicle.model} ${vehicle.color}`.toLowerCase();
        if (!searchText.includes(filters.search.toLowerCase())) return false;
      }

      // Make filter
      if (filters.make.length > 0 && !filters.make.includes(vehicle.make)) return false;

      // Fuel type filter
      if (filters.fuelType.length > 0 && !filters.fuelType.includes(vehicle.fuelType)) return false;

      // Transmission filter
      if (filters.transmission.length > 0 && !filters.transmission.includes(vehicle.transmission)) return false;

      // Body type filter
      if (filters.bodyType.length > 0 && !filters.bodyType.includes(vehicle.bodyType)) return false;

      // Price range
      if (vehicle.price < filters.priceRange[0] || vehicle.price > filters.priceRange[1]) return false;

      // Year range
      if (vehicle.year < filters.yearRange[0] || vehicle.year > filters.yearRange[1]) return false;

      // Mileage
      if (vehicle.mileage > filters.mileageMax) return false;

      // Required features
      if (filters.featuresRequired.length > 0) {
        const hasAllFeatures = filters.featuresRequired.every(feature =>
          vehicle.features?.includes(feature)
        );
        if (!hasAllFeatures) return false;
      }

      // Featured only
      if (filters.showFeaturedOnly && !vehicle.featured) return false;

      return true;
    });

    // Sort results
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'year_desc': return b.year - a.year;
        case 'mileage_asc': return a.mileage - b.mileage;
        case 'featured': return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        default: return 0;
      }
    });

    return filtered;
  }, [vehicles, filters]);

  // Update parent when filtered vehicles change
  useEffect(() => {
    onFilter(filteredVehicles);
  }, [filteredVehicles, onFilter]);

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      search: '',
      make: [],
      fuelType: [],
      transmission: [],
      bodyType: [],
      priceRange: [dataRanges.minPrice, dataRanges.maxPrice],
      yearRange: [dataRanges.minYear, dataRanges.maxYear],
      mileageMax: 300000,
      featuresRequired: [],
      showFeaturedOnly: false,
      sortBy: 'featured'
    });
  };

  // Count active filters
  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.make.length +
    filters.fuelType.length +
    filters.transmission.length +
    filters.bodyType.length +
    (filters.priceRange[0] !== dataRanges.minPrice || filters.priceRange[1] !== dataRanges.maxPrice ? 1 : 0) +
    (filters.yearRange[0] !== dataRanges.minYear || filters.yearRange[1] !== dataRanges.maxYear ? 1 : 0) +
    (filters.mileageMax !== 300000 ? 1 : 0) +
    filters.featuresRequired.length +
    (filters.showFeaturedOnly ? 1 : 0);

  const toggleArrayFilter = (category: keyof Pick<FilterState, 'make' | 'fuelType' | 'transmission' | 'bodyType' | 'featuresRequired'>, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((item: string) => item !== value)
        : [...prev[category], value]
    }));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtrat {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-orange-600 hover:text-orange-800"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Pastro të gjitha
            </Button>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Car className="w-4 h-4" />
          {filteredVehicles.length} nga {vehicles.length} vetura
        </div>
      </div>

      {/* Quick Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Kërko BMW, Mercedes, Audi..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        {filters.search && (
          <button
            onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Filter Tags */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilters(prev => ({ ...prev, showFeaturedOnly: !prev.showFeaturedOnly }))}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filters.showFeaturedOnly
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ⭐ Të Veçanta
        </button>

        {['BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen'].map(make => (
          <button
            key={make}
            onClick={() => toggleArrayFilter('make', make)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filters.make.includes(make)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {make}
          </button>
        ))}

        {['Diesel', 'Petrol', 'Hybrid', 'Electric'].map(fuel => (
          <button
            key={fuel}
            onClick={() => toggleArrayFilter('fuelType', fuel)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filters.fuelType.includes(fuel)
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {fuel}
          </button>
        ))}
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Rendit sipas:</span>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  Filtrat e Avancuara
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Euro className="w-4 h-4 inline mr-1" />
                    Intervali i Çmimit: €{filters.priceRange[0].toLocaleString()} - €{filters.priceRange[1].toLocaleString()}
                  </label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="range"
                        min={dataRanges.minPrice}
                        max={dataRanges.maxPrice}
                        value={filters.priceRange[0]}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          priceRange: [parseInt(e.target.value), prev.priceRange[1]]
                        }))}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">Minimumi</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="range"
                        min={dataRanges.minPrice}
                        max={dataRanges.maxPrice}
                        value={filters.priceRange[1]}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          priceRange: [prev.priceRange[0], parseInt(e.target.value)]
                        }))}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">Maksimumi</span>
                    </div>
                  </div>
                </div>

                {/* Year Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vitet: {filters.yearRange[0]} - {filters.yearRange[1]}
                  </label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="range"
                        min={dataRanges.minYear}
                        max={dataRanges.maxYear}
                        value={filters.yearRange[0]}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          yearRange: [parseInt(e.target.value), prev.yearRange[1]]
                        }))}
                        className="w-full"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="range"
                        min={dataRanges.minYear}
                        max={dataRanges.maxYear}
                        value={filters.yearRange[1]}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          yearRange: [prev.yearRange[0], parseInt(e.target.value)]
                        }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Mileage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kilometrazhi maksimal: {filters.mileageMax.toLocaleString()} km
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={300000}
                    step={5000}
                    value={filters.mileageMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, mileageMax: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                {/* Make Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marka</label>
                  <div className="flex flex-wrap gap-2">
                    {FILTER_OPTIONS.makes.map(make => (
                      <button
                        key={make}
                        onClick={() => toggleArrayFilter('make', make)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          filters.make.includes(make)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {make}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fuel Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Karburanti</label>
                  <div className="flex flex-wrap gap-2">
                    {FILTER_OPTIONS.fuelTypes.map(fuel => (
                      <button
                        key={fuel}
                        onClick={() => toggleArrayFilter('fuelType', fuel)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          filters.fuelType.includes(fuel)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {fuel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transmission */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transmisioni</label>
                  <div className="flex flex-wrap gap-2">
                    {FILTER_OPTIONS.transmissions.map(trans => (
                      <button
                        key={trans}
                        onClick={() => toggleArrayFilter('transmission', trans)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          filters.transmission.includes(trans)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {trans}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipi i Veturës</label>
                  <div className="flex flex-wrap gap-2">
                    {FILTER_OPTIONS.bodyTypes.map(body => (
                      <button
                        key={body}
                        onClick={() => toggleArrayFilter('bodyType', body)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          filters.bodyType.includes(body)
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {body}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Karakteristikat e Kërkuara</label>
                  <div className="flex flex-wrap gap-2">
                    {FILTER_OPTIONS.popularFeatures.map(feature => (
                      <button
                        key={feature}
                        onClick={() => toggleArrayFilter('featuresRequired', feature)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          filters.featuresRequired.includes(feature)
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Kërkim: "{filters.search}"
              <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, search: '' }))} />
            </Badge>
          )}

          {filters.make.map(make => (
            <Badge key={make} variant="secondary" className="flex items-center gap-1">
              {make}
              <X className="w-3 h-3 cursor-pointer" onClick={() => toggleArrayFilter('make', make)} />
            </Badge>
          ))}

          {filters.fuelType.map(fuel => (
            <Badge key={fuel} variant="secondary" className="flex items-center gap-1">
              {fuel}
              <X className="w-3 h-3 cursor-pointer" onClick={() => toggleArrayFilter('fuelType', fuel)} />
            </Badge>
          ))}

          {filters.featuresRequired.map(feature => (
            <Badge key={feature} variant="secondary" className="flex items-center gap-1">
              {feature}
              <X className="w-3 h-3 cursor-pointer" onClick={() => toggleArrayFilter('featuresRequired', feature)} />
            </Badge>
          ))}

          {filters.showFeaturedOnly && (
            <Badge variant="secondary" className="flex items-center gap-1">
              ⭐ Të Veçanta
              <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, showFeaturedOnly: false }))} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}