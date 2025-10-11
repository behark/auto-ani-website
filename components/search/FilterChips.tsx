'use client';

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchURLParams } from '@/lib/urlParams';

interface FilterChip {
  key: string;
  label: string;
  value: string | number;
  onRemove: () => void;
}

interface FilterChipsProps {
  filters: Partial<SearchURLParams>;
  onRemoveFilter: (key: keyof SearchURLParams) => void;
  onClearAll: () => void;
  className?: string;
}

export default function FilterChips({
  filters,
  onRemoveFilter,
  onClearAll,
  className
}: FilterChipsProps) {
  const chips: FilterChip[] = [];

  // Build chips from active filters
  if (filters.make) {
    chips.push({
      key: 'make',
      label: 'Make',
      value: filters.make,
      onRemove: () => onRemoveFilter('make')
    });
  }

  if (filters.model) {
    chips.push({
      key: 'model',
      label: 'Model',
      value: filters.model,
      onRemove: () => onRemoveFilter('model')
    });
  }

  if (filters.bodyType) {
    chips.push({
      key: 'bodyType',
      label: 'Body',
      value: filters.bodyType,
      onRemove: () => onRemoveFilter('bodyType')
    });
  }

  if (filters.fuelType) {
    chips.push({
      key: 'fuelType',
      label: 'Fuel',
      value: filters.fuelType,
      onRemove: () => onRemoveFilter('fuelType')
    });
  }

  if (filters.transmission) {
    chips.push({
      key: 'transmission',
      label: 'Trans',
      value: filters.transmission,
      onRemove: () => onRemoveFilter('transmission')
    });
  }

  // Price range
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    const priceLabel =
      filters.priceMin !== undefined && filters.priceMax !== undefined
        ? `$${(filters.priceMin / 1000).toFixed(0)}k - $${(filters.priceMax / 1000).toFixed(0)}k`
        : filters.priceMin !== undefined
        ? `From $${(filters.priceMin / 1000).toFixed(0)}k`
        : `Up to $${(filters.priceMax! / 1000).toFixed(0)}k`;

    chips.push({
      key: 'price',
      label: 'Price',
      value: priceLabel,
      onRemove: () => {
        onRemoveFilter('priceMin');
        onRemoveFilter('priceMax');
      }
    });
  }

  // Year range
  if (filters.yearMin !== undefined || filters.yearMax !== undefined) {
    const yearLabel =
      filters.yearMin !== undefined && filters.yearMax !== undefined
        ? `${filters.yearMin} - ${filters.yearMax}`
        : filters.yearMin !== undefined
        ? `${filters.yearMin}+`
        : `Up to ${filters.yearMax}`;

    chips.push({
      key: 'year',
      label: 'Year',
      value: yearLabel,
      onRemove: () => {
        onRemoveFilter('yearMin');
        onRemoveFilter('yearMax');
      }
    });
  }

  // Mileage range
  if (filters.mileageMin !== undefined || filters.mileageMax !== undefined) {
    const formatMileage = (miles: number) => {
      if (miles >= 1000) {
        return `${(miles / 1000).toFixed(0)}k`;
      }
      return miles.toString();
    };

    const mileageLabel =
      filters.mileageMin !== undefined && filters.mileageMax !== undefined
        ? `${formatMileage(filters.mileageMin)} - ${formatMileage(filters.mileageMax)} mi`
        : filters.mileageMin !== undefined
        ? `${formatMileage(filters.mileageMin)}+ mi`
        : `Up to ${formatMileage(filters.mileageMax!)} mi`;

    chips.push({
      key: 'mileage',
      label: 'Mileage',
      value: mileageLabel,
      onRemove: () => {
        onRemoveFilter('mileageMin');
        onRemoveFilter('mileageMax');
      }
    });
  }

  // Features
  if (filters.features) {
    const featuresList = filters.features.split(',');
    featuresList.forEach((feature, index) => {
      chips.push({
        key: `feature-${index}`,
        label: 'Feature',
        value: feature,
        onRemove: () => {
          const newFeatures = featuresList.filter((_, i) => i !== index);
          if (newFeatures.length === 0) {
            onRemoveFilter('features');
          } else {
            // Update features with remaining ones
            const updatedFilters = { ...filters, features: newFeatures.join(',') };
            Object.entries(updatedFilters).forEach(([key, value]) => {
              if (key === 'features') {
                // Handle features update differently
                // This would need to be handled by parent component
              }
            });
          }
        }
      });
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600 mr-2">Active filters:</span>

      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="secondary"
          className="pl-3 pr-1 py-1.5 bg-orange-50 border-orange-200 text-gray-700 hover:bg-orange-100"
        >
          <span className="text-xs font-medium mr-1">{chip.label}:</span>
          <span className="text-xs">{chip.value}</span>
          <button
            onClick={chip.onRemove}
            className="ml-2 p-0.5 hover:bg-orange-200 rounded-full transition-colors"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {chips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs text-gray-600 hover:text-[var(--primary-orange)]"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}