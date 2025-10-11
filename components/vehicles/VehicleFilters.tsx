'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';
import { VEHICLE_MAKES, FUEL_TYPES, TRANSMISSION_TYPES, BODY_TYPES } from '@/lib/constants';
import { VehicleFilters as VehicleFiltersType } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface VehicleFiltersProps {
  onFilterChange: (filters: VehicleFiltersType) => void;
}

export default function VehicleFilters({ onFilterChange }: VehicleFiltersProps) {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<VehicleFiltersType>({});
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [yearRange, setYearRange] = useState([2015, 2024]);

  const handleFilterChange = (key: keyof VehicleFiltersType, value: string | number | undefined) => {
    // Convert "all" to undefined to clear the filter
    const filterValue = value === "all" ? undefined : value;
    const newFilters = { ...filters, [key]: filterValue };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceChange = (value: number[]) => {
    setPriceRange(value);
    handleFilterChange('priceMin', value[0]);
    handleFilterChange('priceMax', value[1]);
  };

  const handleYearChange = (value: number[]) => {
    setYearRange(value);
    handleFilterChange('yearMin', value[0]);
    handleFilterChange('yearMax', value[1]);
  };

  const resetFilters = () => {
    setFilters({});
    setPriceRange([0, 100000]);
    setYearRange([2015, 2024]);
    onFilterChange({});
  };

  const activeFiltersCount = Object.keys(filters).filter(key => filters[key as keyof VehicleFiltersType]).length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">{t('vehicles.filters')}</h3>
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{activeFiltersCount} active</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-gray-600 hover:text-[var(--primary-orange)]"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Make */}
        <div>
          <label className="text-sm font-medium mb-2 block">Make</label>
          <Select
            value={filters.make || 'all'}
            onValueChange={(value) => handleFilterChange('make', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Makes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Makes</SelectItem>
              {VEHICLE_MAKES.map((make) => (
                <SelectItem key={make} value={make}>
                  {make}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Price Range */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Price Range: ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
          </label>
          <Slider
            value={priceRange}
            onValueChange={handlePriceChange}
            min={0}
            max={100000}
            step={5000}
            className="mt-3"
          />
        </div>

        <Separator />

        {/* Year Range */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Year: {yearRange[0]} - {yearRange[1]}
          </label>
          <Slider
            value={yearRange}
            onValueChange={handleYearChange}
            min={2010}
            max={2024}
            step={1}
            className="mt-3"
          />
        </div>

        <Separator />

        {/* Body Type */}
        <div>
          <label className="text-sm font-medium mb-2 block">Body Type</label>
          <Select
            value={filters.bodyType || 'all'}
            onValueChange={(value) => handleFilterChange('bodyType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {BODY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Fuel Type */}
        <div>
          <label className="text-sm font-medium mb-2 block">Fuel Type</label>
          <Select
            value={filters.fuelType || 'all'}
            onValueChange={(value) => handleFilterChange('fuelType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Fuel Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fuel Types</SelectItem>
              {FUEL_TYPES.map((fuel) => (
                <SelectItem key={fuel} value={fuel}>
                  {fuel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Transmission */}
        <div>
          <label className="text-sm font-medium mb-2 block">Transmission</label>
          <Select
            value={filters.transmission || 'all'}
            onValueChange={(value) => handleFilterChange('transmission', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Transmissions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transmissions</SelectItem>
              {TRANSMISSION_TYPES.map((trans) => (
                <SelectItem key={trans} value={trans}>
                  {trans}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}