'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Search,
  Car,
  MapPin,
  Euro,
  Calendar,
  Fuel,
  Settings,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickSearchFilters {
  make: string;
  bodyType: string;
  fuelType: string;
  priceRange: [number, number];
  yearRange: [number, number];
  searchQuery: string;
}

interface QuickVehicleSearchProps {
  className?: string;
  onSearch?: (filters: QuickSearchFilters) => void;
  showAdvancedLink?: boolean;
  variant?: 'homepage' | 'compact' | 'full';
}

const INITIAL_FILTERS: QuickSearchFilters = {
  make: '',
  bodyType: '',
  fuelType: '',
  priceRange: [5000, 80000],
  yearRange: [2015, new Date().getFullYear()],
  searchQuery: ''
};

const POPULAR_MAKES = [
  'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Toyota', 'Opel', 'Ford', 'Peugeot'
];

const BODY_TYPES = [
  'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Estate', 'Convertible', 'Van', 'Pickup'
];

const FUEL_TYPES = [
  'Benzinë', 'Diesel', 'Hibrid', 'Elektrik', 'Gas', 'Bi-Fuel'
];

const POPULAR_SEARCHES = [
  { text: 'BMW X5 2020+', filters: { make: 'BMW', searchQuery: 'X5', yearRange: [2020, 2025] as [number, number] } },
  { text: 'Mercedes C-Class', filters: { make: 'Mercedes', searchQuery: 'C-Class' } },
  { text: 'Audi A4 Diesel', filters: { make: 'Audi', searchQuery: 'A4', fuelType: 'Diesel' } },
  { text: 'VW Golf Hibrid', filters: { make: 'Volkswagen', searchQuery: 'Golf', fuelType: 'Hibrid' } },
  { text: 'SUV nën €30,000', filters: { bodyType: 'SUV', priceRange: [5000, 30000] as [number, number] } },
  { text: 'Sedan Premium', filters: { bodyType: 'Sedan', priceRange: [25000, 80000] as [number, number] } }
];

export default function QuickVehicleSearch({
  className,
  onSearch,
  showAdvancedLink = true,
  variant = 'homepage'
}: QuickVehicleSearchProps) {
  const [filters, setFilters] = useState<QuickSearchFilters>(INITIAL_FILTERS);
  const [isExpanded, setIsExpanded] = useState(variant === 'full');
  const router = useRouter();

  const handleFilterChange = (key: keyof QuickSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(filters);
    } else {
      // Build search params and navigate to vehicles page
      const params = new URLSearchParams();

      if (filters.searchQuery) params.set('q', filters.searchQuery);
      if (filters.make) params.set('make', filters.make);
      if (filters.bodyType) params.set('bodyType', filters.bodyType);
      if (filters.fuelType) params.set('fuelType', filters.fuelType);
      if (filters.priceRange[0] !== 5000 || filters.priceRange[1] !== 80000) {
        params.set('priceMin', filters.priceRange[0].toString());
        params.set('priceMax', filters.priceRange[1].toString());
      }
      if (filters.yearRange[0] !== 2015 || filters.yearRange[1] !== new Date().getFullYear()) {
        params.set('yearMin', filters.yearRange[0].toString());
        params.set('yearMax', filters.yearRange[1].toString());
      }

      router.push(`/vehicles?${params.toString()}`);
    }
  };

  const handlePopularSearch = (popularFilters: Partial<QuickSearchFilters>) => {
    const newFilters = { ...INITIAL_FILTERS, ...popularFilters };
    setFilters(newFilters);
    if (onSearch) {
      onSearch(newFilters);
    } else {
      // Navigate immediately for popular searches
      setTimeout(() => {
        const params = new URLSearchParams();
        if (newFilters.searchQuery) params.set('q', newFilters.searchQuery);
        if (newFilters.make) params.set('make', newFilters.make);
        if (newFilters.bodyType) params.set('bodyType', newFilters.bodyType);
        if (newFilters.fuelType) params.set('fuelType', newFilters.fuelType);
        router.push(`/vehicles?${params.toString()}`);
      }, 100);
    }
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const hasActiveFilters = useMemo(() => {
    return filters.searchQuery ||
           filters.make ||
           filters.bodyType ||
           filters.fuelType ||
           filters.priceRange[0] !== 5000 ||
           filters.priceRange[1] !== 80000 ||
           filters.yearRange[0] !== 2015 ||
           filters.yearRange[1] !== new Date().getFullYear();
  }, [filters]);

  const formatPrice = (price: number) => `€${price.toLocaleString()}`;

  // Compact variant for small spaces
  if (variant === 'compact') {
    return (
      <Card className={cn("w-full max-w-md", className)}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-5 w-5 text-[var(--primary-orange)]" />
            <Label className="font-semibold">Kërko Vetura</Label>
          </div>

          <Input
            placeholder="BMW X5, Mercedes C-Class..."
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />

          <div className="grid grid-cols-2 gap-2">
            <Select value={filters.make} onValueChange={(value) => handleFilterChange('make', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Marka" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Të gjitha</SelectItem>
                {POPULAR_MAKES.map(make => (
                  <SelectItem key={make} value={make}>{make}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.bodyType} onValueChange={(value) => handleFilterChange('bodyType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Të gjithë</SelectItem>
                {BODY_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSearch}
            className="w-full bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]"
          >
            <Search className="h-4 w-4 mr-2" />
            Kërko
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Full homepage variant
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-[var(--primary-orange)]" />
            <h2 className="text-2xl font-bold">Gjej Veturën e Përsosur</h2>
          </div>
          <p className="text-gray-600">
            Kërko në koleksionin tonë të {variant === 'homepage' ? '50+' : ''} veturave premium
          </p>
        </div>

        {/* Quick Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Kërko sipas markës, modelit, vitit..."
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 h-12 text-lg"
          />
        </div>

        {/* Popular Searches */}
        {variant === 'homepage' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <Label className="text-sm text-gray-700">Kërkime të popullarizuara:</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((search, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-colors"
                  onClick={() => handlePopularSearch(search.filters)}
                >
                  {search.text}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-gray-800"
          >
            <Filter className="h-4 w-4 mr-2" />
            {isExpanded ? 'Filtrat bazë' : 'Filtrat e avancuara'}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="text-orange-600 hover:text-orange-700"
            >
              Pastro filtrat
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="space-y-6 border-t pt-6">

            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Marka
                </Label>
                <Select value={filters.make} onValueChange={(value) => handleFilterChange('make', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Përzgjidh markën" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Të gjitha markat</SelectItem>
                    {POPULAR_MAKES.map(make => (
                      <SelectItem key={make} value={make}>{make}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Tipi i Trupit
                </Label>
                <Select value={filters.bodyType} onValueChange={(value) => handleFilterChange('bodyType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Përzgjidh tipin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Të gjithë tipet</SelectItem>
                    {BODY_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  Karburanti
                </Label>
                <Select value={filters.fuelType} onValueChange={(value) => handleFilterChange('fuelType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Përzgjidh karburantin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Të gjithë tipet</SelectItem>
                    {FUEL_TYPES.map(fuel => (
                      <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Çmimi: {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
                </Label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => handleFilterChange('priceRange', value as [number, number])}
                  min={5000}
                  max={100000}
                  step={5000}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Viti: {filters.yearRange[0]} - {filters.yearRange[1]}
                </Label>
                <Slider
                  value={filters.yearRange}
                  onValueChange={(value) => handleFilterChange('yearRange', value as [number, number])}
                  min={2010}
                  max={new Date().getFullYear()}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

          </div>
        )}

        {/* Search Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSearch}
            className="flex-1 h-12 bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)] text-lg font-semibold"
          >
            <Search className="h-5 w-5 mr-2" />
            Kërko Vetura
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          {showAdvancedLink && (
            <Button
              variant="outline"
              onClick={() => router.push('/vehicles')}
              className="h-12 border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filtrat e Avancuara
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        {variant === 'homepage' && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--primary-orange)]">50+</div>
              <div className="text-sm text-gray-600">Vetura</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--primary-orange)]">8</div>
              <div className="text-sm text-gray-600">Marka</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--primary-orange)]">0%</div>
              <div className="text-sm text-gray-600">Kamat</div>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}