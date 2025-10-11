'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  SlidersHorizontal,
  X,
  Car,
  Fuel,
  Settings2,
  DollarSign,
  Calendar,
  Gauge,
  Palette,
  Users,
  Package
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import MileageRangeFilter from './MileageRangeFilter';
import FilterChips from './FilterChips';
import { SearchURLParams, countActiveFilters } from '@/lib/urlParams';

interface AdvancedSearchPanelProps {
  filters: Partial<SearchURLParams>;
  onFiltersChange: (filters: Partial<SearchURLParams>) => void;
  onClearAll: () => void;
  facets?: {
    makes: Array<{ value: string; count: number }>;
    bodyTypes: Array<{ value: string; count: number }>;
    fuelTypes: Array<{ value: string; count: number }>;
    transmissions: Array<{ value: string; count: number }>;
    priceRange: { min: number; max: number; avg: number };
    yearRange: { min: number; max: number };
    mileageRange: { min: number; max: number; avg: number };
  };
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isMobile?: boolean;
}

const popularFeatures = [
  'Navigation System',
  'Backup Camera',
  'Leather Seats',
  'Sunroof',
  'Apple CarPlay',
  'Android Auto',
  'Bluetooth',
  'Heated Seats',
  'All-Wheel Drive',
  'Parking Sensors',
  'Adaptive Cruise Control',
  'Lane Keeping Assist'
];

const colors = [
  'Black', 'White', 'Silver', 'Gray', 'Blue',
  'Red', 'Green', 'Brown', 'Beige', 'Gold'
];

export default function AdvancedSearchPanel({
  filters,
  onFiltersChange,
  onClearAll,
  facets,
  isOpen = false,
  onOpenChange,
  isMobile = false
}: AdvancedSearchPanelProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const activeFilterCount = countActiveFilters(filters);

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...localFilters };
    if (value === undefined || value === '') {
      delete newFilters[key as keyof SearchURLParams];
    } else {
      (newFilters as any)[key] = value;
    }
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onOpenChange?.(false);
  };

  const handleClearAll = () => {
    setLocalFilters({});
    onClearAll();
    onOpenChange?.(false);
  };

  const removeFilter = (key: keyof SearchURLParams) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const content = (
    <div className="h-full flex flex-col">
      {/* Active filters */}
      {activeFilterCount > 0 && (
        <div className="px-4 py-3 bg-orange-50 border-b">
          <FilterChips
            filters={localFilters}
            onRemoveFilter={removeFilter}
            onClearAll={handleClearAll}
          />
        </div>
      )}

      {/* Filter sections */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Accordion type="multiple" defaultValue={['basic', 'price']}>
            {/* Basic Filters */}
            <AccordionItem value="basic">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  <span>Basic Information</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {/* Make */}
                <div>
                  <Label>Make</Label>
                  <Select
                    value={localFilters.make || ''}
                    onValueChange={(value) => updateFilter('make', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Makes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Makes</SelectItem>
                      {facets?.makes.map((make) => (
                        <SelectItem key={make.value} value={make.value}>
                          {make.value} ({make.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Model */}
                <div>
                  <Label>Model</Label>
                  <input
                    type="text"
                    value={localFilters.model || ''}
                    onChange={(e) => updateFilter('model', e.target.value || undefined)}
                    placeholder="Enter model"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                {/* Body Type */}
                <div>
                  <Label>Body Type</Label>
                  <Select
                    value={localFilters.bodyType || ''}
                    onValueChange={(value) => updateFilter('bodyType', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      {facets?.bodyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.value} ({type.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Price & Year */}
            <AccordionItem value="price">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Price & Year</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {/* Price Range */}
                <div>
                  <Label>Price Range</Label>
                  <div className="mt-2 space-y-3">
                    <Slider
                      value={[
                        localFilters.priceMin || facets?.priceRange.min || 0,
                        localFilters.priceMax || facets?.priceRange.max || 100000
                      ]}
                      onValueChange={([min, max]) => {
                        updateFilter('priceMin', min);
                        updateFilter('priceMax', max);
                      }}
                      min={facets?.priceRange.min || 0}
                      max={facets?.priceRange.max || 100000}
                      step={1000}
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>${(localFilters.priceMin || facets?.priceRange.min || 0).toLocaleString()}</span>
                      <span>${(localFilters.priceMax || facets?.priceRange.max || 100000).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Year Range */}
                <div>
                  <Label>Year</Label>
                  <div className="mt-2 space-y-3">
                    <Slider
                      value={[
                        localFilters.yearMin || facets?.yearRange.min || 2000,
                        localFilters.yearMax || facets?.yearRange.max || new Date().getFullYear()
                      ]}
                      onValueChange={([min, max]) => {
                        updateFilter('yearMin', min);
                        updateFilter('yearMax', max);
                      }}
                      min={facets?.yearRange.min || 2000}
                      max={facets?.yearRange.max || new Date().getFullYear()}
                      step={1}
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{localFilters.yearMin || facets?.yearRange.min || 2000}</span>
                      <span>{localFilters.yearMax || facets?.yearRange.max || new Date().getFullYear()}</span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Mileage */}
            <AccordionItem value="mileage">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  <span>Mileage</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <MileageRangeFilter
                  min={facets?.mileageRange.min || 0}
                  max={facets?.mileageRange.max || 200000}
                  currentMin={localFilters.mileageMin}
                  currentMax={localFilters.mileageMax}
                  onChange={(min, max) => {
                    updateFilter('mileageMin', min);
                    updateFilter('mileageMax', max);
                  }}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Mechanical */}
            <AccordionItem value="mechanical">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  <span>Mechanical</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {/* Fuel Type */}
                <div>
                  <Label>Fuel Type</Label>
                  <Select
                    value={localFilters.fuelType || ''}
                    onValueChange={(value) => updateFilter('fuelType', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Fuel Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Fuel Types</SelectItem>
                      {facets?.fuelTypes.map((fuel) => (
                        <SelectItem key={fuel.value} value={fuel.value}>
                          {fuel.value} ({fuel.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Transmission */}
                <div>
                  <Label>Transmission</Label>
                  <Select
                    value={localFilters.transmission || ''}
                    onValueChange={(value) => updateFilter('transmission', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Transmissions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Transmissions</SelectItem>
                      {facets?.transmissions.map((trans) => (
                        <SelectItem key={trans.value} value={trans.value}>
                          {trans.value} ({trans.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Features */}
            <AccordionItem value="features">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>Features</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {popularFeatures.map((feature) => {
                    const selectedFeatures = localFilters.features?.split(',') || [];
                    const isChecked = selectedFeatures.includes(feature);

                    return (
                      <div key={feature} className="flex items-center space-x-2">
                        <Checkbox
                          id={feature}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            let newFeatures = [...selectedFeatures];
                            if (checked) {
                              newFeatures.push(feature);
                            } else {
                              newFeatures = newFeatures.filter(f => f !== feature);
                            }
                            updateFilter('features', newFeatures.length > 0 ? newFeatures.join(',') : undefined);
                          }}
                        />
                        <Label
                          htmlFor={feature}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {feature}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>

      {/* Footer with actions */}
      <div className="border-t p-4 space-y-2">
        <Button
          onClick={applyFilters}
          className="w-full bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]"
        >
          Apply Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleClearAll}
          className="w-full"
        >
          Clear All
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button variant="outline">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[90vw] sm:w-[400px] p-0">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle>Advanced Filters</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return <div className="h-full">{content}</div>;
}