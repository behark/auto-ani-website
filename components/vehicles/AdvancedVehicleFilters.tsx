'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Settings,
  Car,
  Euro,
  Users,
  Palette,
  Shield,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Vehicle } from '@/lib/types';

interface FilterState {
  // Search
  searchQuery: string;

  // Basic filters
  make: string[];
  model: string[];
  year: { min: number; max: number };
  price: { min: number; max: number };
  mileage: { min: number; max: number };

  // Vehicle specifications
  bodyType: string[];
  fuelType: string[];
  transmission: string[];
  drivetrain: string[];
  engineSize: { min: number; max: number };
  power: { min: number; max: number };

  // Features & condition
  condition: string;
  color: string[];
  features: string[];

  // Business filters
  hasFinancing: boolean;
  hasWarranty: boolean;
  hasTestDrive: boolean;
  location: string[];

  // Sorting
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AdvancedVehicleFiltersProps {
  vehicles: Vehicle[];
  onFilteredVehicles: (filtered: Vehicle[]) => void;
  className?: string;
}

const INITIAL_FILTERS: FilterState = {
  searchQuery: '',
  make: [],
  model: [],
  year: { min: 2010, max: new Date().getFullYear() },
  price: { min: 0, max: 100000 },
  mileage: { min: 0, max: 200000 },
  bodyType: [],
  fuelType: [],
  transmission: [],
  drivetrain: [],
  engineSize: { min: 1.0, max: 6.0 },
  power: { min: 100, max: 500 },
  condition: '',
  color: [],
  features: [],
  hasFinancing: false,
  hasWarranty: false,
  hasTestDrive: false,
  location: [],
  sortBy: 'year',
  sortOrder: 'desc'
};

export default function AdvancedVehicleFilters({
  vehicles,
  onFilteredVehicles,
  className
}: AdvancedVehicleFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Extract unique values from vehicles for filter options
  const filterOptions = useMemo(() => {
    const makes = [...new Set(vehicles.map(v => v.make))].sort();
    const models = [...new Set(vehicles.map(v => v.model))].sort();
    const bodyTypes = [...new Set(vehicles.map(v => v.bodyType))].filter(Boolean).sort();
    const fuelTypes = [...new Set(vehicles.map(v => v.fuelType))].filter(Boolean).sort();
    const transmissions = [...new Set(vehicles.map(v => v.transmission))].filter(Boolean).sort();
    const colors = [...new Set(vehicles.map(v => v.color))].filter(Boolean).sort();
    const locations = ['Prishtinë', 'Mitrovicë']; // AUTO ANI locations

    // Extract features from vehicles (assuming features are stored as JSON strings)
    const allFeatures = vehicles.flatMap(v => {
      try {
        return typeof v.features === 'string' ? JSON.parse(v.features) : v.features || [];
      } catch {
        return [];
      }
    });
    const features = [...new Set(allFeatures)].sort();

    return {
      makes,
      models,
      bodyTypes,
      fuelTypes,
      transmissions,
      colors,
      locations,
      features: features.slice(0, 20) // Limit to most common features
    };
  }, [vehicles]);

  // Calculate price and year ranges from actual data
  const dataRanges = useMemo(() => {
    if (vehicles.length === 0) {
      return {
        minPrice: 0,
        maxPrice: 100000,
        minYear: 2010,
        maxYear: new Date().getFullYear(),
        minMileage: 0,
        maxMileage: 200000
      };
    }

    const prices = vehicles.map(v => v.price).filter(p => p > 0);
    const years = vehicles.map(v => v.year).filter(y => y > 0);
    const mileages = vehicles.map(v => v.mileage).filter(m => m >= 0);

    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      minYear: Math.min(...years),
      maxYear: Math.max(...years),
      minMileage: Math.min(...mileages),
      maxMileage: Math.max(...mileages)
    };
  }, [vehicles]);

  // Filter vehicles based on current filters
  const filteredVehicles = useMemo(() => {
    let filtered = [...vehicles];

    // Search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.make.toLowerCase().includes(query) ||
        v.model.toLowerCase().includes(query) ||
        v.year.toString().includes(query) ||
        (v.color && v.color.toLowerCase().includes(query)) ||
        (v.bodyType && v.bodyType.toLowerCase().includes(query))
      );
    }

    // Make filter
    if (filters.make.length > 0) {
      filtered = filtered.filter(v => filters.make.includes(v.make));
    }

    // Model filter
    if (filters.model.length > 0) {
      filtered = filtered.filter(v => filters.model.includes(v.model));
    }

    // Year range
    filtered = filtered.filter(v =>
      v.year >= filters.year.min && v.year <= filters.year.max
    );

    // Price range
    filtered = filtered.filter(v =>
      v.price >= filters.price.min && v.price <= filters.price.max
    );

    // Mileage range
    filtered = filtered.filter(v =>
      v.mileage >= filters.mileage.min && v.mileage <= filters.mileage.max
    );

    // Body type
    if (filters.bodyType.length > 0) {
      filtered = filtered.filter(v =>
        v.bodyType && filters.bodyType.includes(v.bodyType)
      );
    }

    // Fuel type
    if (filters.fuelType.length > 0) {
      filtered = filtered.filter(v =>
        v.fuelType && filters.fuelType.includes(v.fuelType)
      );
    }

    // Transmission
    if (filters.transmission.length > 0) {
      filtered = filtered.filter(v =>
        v.transmission && filters.transmission.includes(v.transmission)
      );
    }

    // Color
    if (filters.color.length > 0) {
      filtered = filtered.filter(v =>
        v.color && filters.color.includes(v.color)
      );
    }

    // Features
    if (filters.features.length > 0) {
      filtered = filtered.filter(v => {
        try {
          const vehicleFeatures = typeof v.features === 'string'
            ? JSON.parse(v.features)
            : v.features || [];
          return filters.features.some(f => vehicleFeatures.includes(f));
        } catch {
          return false;
        }
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'year':
          aValue = a.year;
          bValue = b.year;
          break;
        case 'mileage':
          aValue = a.mileage;
          bValue = b.mileage;
          break;
        case 'make':
          aValue = a.make;
          bValue = b.make;
          break;
        default:
          aValue = a.year;
          bValue = b.year;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [vehicles, filters]);

  // Count active filters
  useEffect(() => {
    let count = 0;

    if (filters.searchQuery.trim()) count++;
    if (filters.make.length > 0) count++;
    if (filters.model.length > 0) count++;
    if (filters.year.min !== dataRanges.minYear || filters.year.max !== dataRanges.maxYear) count++;
    if (filters.price.min !== dataRanges.minPrice || filters.price.max !== dataRanges.maxPrice) count++;
    if (filters.mileage.min !== dataRanges.minMileage || filters.mileage.max !== dataRanges.maxMileage) count++;
    if (filters.bodyType.length > 0) count++;
    if (filters.fuelType.length > 0) count++;
    if (filters.transmission.length > 0) count++;
    if (filters.color.length > 0) count++;
    if (filters.features.length > 0) count++;
    if (filters.hasFinancing) count++;
    if (filters.hasWarranty) count++;
    if (filters.hasTestDrive) count++;

    setActiveFiltersCount(count);
  }, [filters, dataRanges]);

  // Notify parent of filtered vehicles
  useEffect(() => {
    onFilteredVehicles(filteredVehicles);
  }, [filteredVehicles, onFilteredVehicles]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayFilterToggle = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: (prev[key] as string[]).includes(value)
        ? (prev[key] as string[]).filter(v => v !== value)
        : [...(prev[key] as string[]), value]
    }));
  };

  const resetFilters = () => {
    setFilters({
      ...INITIAL_FILTERS,
      year: { min: dataRanges.minYear, max: dataRanges.maxYear },
      price: { min: dataRanges.minPrice, max: dataRanges.maxPrice },
      mileage: { min: dataRanges.minMileage, max: dataRanges.maxMileage }
    });
  };

  const formatPrice = (price: number) => `€${price.toLocaleString()}`;
  const formatMileage = (mileage: number) => `${mileage.toLocaleString()} km`;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtrat
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          {showMobileFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Filter Panel */}
      <div className={cn(
        "lg:block",
        showMobileFilters ? "block" : "hidden"
      )}>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                Filtrat e Avancuara
              </CardTitle>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary">
                    {activeFiltersCount} filtër aktiv
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Pastro
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Search */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Kërko vetura
              </Label>
              <Input
                placeholder="Kërko sipas markës, modelit, vitit..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              />
            </div>

            <Separator />

            {/* Quick Filters Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="financing"
                  checked={filters.hasFinancing}
                  onCheckedChange={(checked) => handleFilterChange('hasFinancing', checked)}
                />
                <Label htmlFor="financing" className="text-sm">Financim 0%</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="warranty"
                  checked={filters.hasWarranty}
                  onCheckedChange={(checked) => handleFilterChange('hasWarranty', checked)}
                />
                <Label htmlFor="warranty" className="text-sm">Garanci</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="testdrive"
                  checked={filters.hasTestDrive}
                  onCheckedChange={(checked) => handleFilterChange('hasTestDrive', checked)}
                />
                <Label htmlFor="testdrive" className="text-sm">Test Drive</Label>
              </div>
            </div>

            <Separator />

            {/* Main Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Make */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Marka
                </Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {filterOptions.makes.map(make => (
                    <div key={make} className="flex items-center space-x-2">
                      <Checkbox
                        id={`make-${make}`}
                        checked={filters.make.includes(make)}
                        onCheckedChange={() => handleArrayFilterToggle('make', make)}
                      />
                      <Label htmlFor={`make-${make}`} className="text-sm">{make}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body Type */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Tipi i Trupit
                </Label>
                <div className="space-y-1">
                  {filterOptions.bodyTypes.map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`body-${type}`}
                        checked={filters.bodyType.includes(type)}
                        onCheckedChange={() => handleArrayFilterToggle('bodyType', type)}
                      />
                      <Label htmlFor={`body-${type}`} className="text-sm">{type}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fuel Type */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  Karburanti
                </Label>
                <div className="space-y-1">
                  {filterOptions.fuelTypes.map(fuel => (
                    <div key={fuel} className="flex items-center space-x-2">
                      <Checkbox
                        id={`fuel-${fuel}`}
                        checked={filters.fuelType.includes(fuel)}
                        onCheckedChange={() => handleArrayFilterToggle('fuelType', fuel)}
                      />
                      <Label htmlFor={`fuel-${fuel}`} className="text-sm">{fuel}</Label>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <Separator />

            {/* Range Filters */}
            <div className="space-y-6">

              {/* Price Range */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Çmimi: {formatPrice(filters.price.min)} - {formatPrice(filters.price.max)}
                </Label>
                <Slider
                  value={[filters.price.min, filters.price.max]}
                  onValueChange={([min, max]) => handleFilterChange('price', { min, max })}
                  min={dataRanges.minPrice}
                  max={dataRanges.maxPrice}
                  step={1000}
                  className="w-full"
                />
              </div>

              {/* Year Range */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Viti: {filters.year.min} - {filters.year.max}
                </Label>
                <Slider
                  value={[filters.year.min, filters.year.max]}
                  onValueChange={([min, max]) => handleFilterChange('year', { min, max })}
                  min={dataRanges.minYear}
                  max={dataRanges.maxYear}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Mileage Range */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Kilometrazhi: {formatMileage(filters.mileage.min)} - {formatMileage(filters.mileage.max)}
                </Label>
                <Slider
                  value={[filters.mileage.min, filters.mileage.max]}
                  onValueChange={([min, max]) => handleFilterChange('mileage', { min, max })}
                  min={dataRanges.minMileage}
                  max={dataRanges.maxMileage}
                  step={5000}
                  className="w-full"
                />
              </div>

            </div>

            <Separator />

            {/* Sorting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rendit sipas</Label>
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="year">Vitit</SelectItem>
                    <SelectItem value="price">Çmimit</SelectItem>
                    <SelectItem value="mileage">Kilometrave</SelectItem>
                    <SelectItem value="make">Markës</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Drejtimi</Label>
                <RadioGroup
                  value={filters.sortOrder}
                  onValueChange={(value: 'asc' | 'desc') => handleFilterChange('sortOrder', value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="desc" id="desc" />
                    <Label htmlFor="desc" className="text-sm">Lartë → Ulët</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="asc" id="asc" />
                    <Label htmlFor="asc" className="text-sm">Ulët → Lartë</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Results Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                <strong>{filteredVehicles.length}</strong> nga {vehicles.length} vetura
              </span>
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Filtrat aktiv:</span>
                  <Badge variant="outline" className="text-xs">
                    {activeFiltersCount}
                  </Badge>
                </div>
              )}
            </div>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-orange-600 hover:text-orange-700"
              >
                <X className="h-4 w-4 mr-1" />
                Hiq të gjitha filtrat
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}