'use client';

import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car } from 'lucide-react';

interface MileageRangeFilterProps {
  min?: number;
  max?: number;
  currentMin?: number;
  currentMax?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
  className?: string;
}

export default function MileageRangeFilter({
  min = 0,
  max = 200000,
  currentMin,
  currentMax,
  onChange,
  className
}: MileageRangeFilterProps) {
  const [localMin, setLocalMin] = useState(currentMin ?? min);
  const [localMax, setLocalMax] = useState(currentMax ?? max);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setLocalMin(currentMin ?? min);
    setLocalMax(currentMax ?? max);
  }, [currentMin, currentMax, min, max]);

  const handleSliderChange = (values: number[]) => {
    setLocalMin(values[0]);
    setLocalMax(values[1]);
    setIsEditing(true);
  };

  const handleSliderCommit = () => {
    if (isEditing) {
      onChange(
        localMin === min ? undefined : localMin,
        localMax === max ? undefined : localMax
      );
      setIsEditing(false);
    }
  };

  const handleInputChange = (type: 'min' | 'max', value: string) => {
    const numValue = parseInt(value.replace(/\D/g, ''));

    if (isNaN(numValue)) {
      if (type === 'min') {
        setLocalMin(min);
        onChange(undefined, localMax === max ? undefined : localMax);
      } else {
        setLocalMax(max);
        onChange(localMin === min ? undefined : localMin, undefined);
      }
      return;
    }

    if (type === 'min') {
      const clampedValue = Math.min(Math.max(numValue, min), localMax - 1000);
      setLocalMin(clampedValue);
      onChange(
        clampedValue === min ? undefined : clampedValue,
        localMax === max ? undefined : localMax
      );
    } else {
      const clampedValue = Math.max(Math.min(numValue, max), localMin + 1000);
      setLocalMax(clampedValue);
      onChange(
        localMin === min ? undefined : localMin,
        clampedValue === max ? undefined : clampedValue
      );
    }
  };

  const formatMileage = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getPresetRanges = () => [
    { label: 'Under 50k', min: 0, max: 50000 },
    { label: '50k - 100k', min: 50000, max: 100000 },
    { label: '100k - 150k', min: 100000, max: 150000 },
    { label: 'Over 150k', min: 150000, max: max }
  ];

  const isPresetActive = (preset: { min: number; max: number }) => {
    return localMin === preset.min && localMax === preset.max;
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-gray-500" />
          <Label className="text-sm font-medium">Mileage Range</Label>
        </div>

        {/* Preset ranges */}
        <div className="flex flex-wrap gap-2">
          {getPresetRanges().map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setLocalMin(preset.min);
                setLocalMax(preset.max);
                onChange(
                  preset.min === min ? undefined : preset.min,
                  preset.max === max ? undefined : preset.max
                );
              }}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                isPresetActive(preset)
                  ? 'bg-[var(--primary-orange)] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Range slider */}
        <div className="px-1">
          <Slider
            value={[localMin, localMax]}
            onValueChange={handleSliderChange}
            onValueCommit={handleSliderCommit}
            min={min}
            max={max}
            step={5000}
            className="w-full"
          />
        </div>

        {/* Min/Max inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="mileage-min" className="text-xs text-gray-600">
              Min Miles
            </Label>
            <div className="relative">
              <Input
                id="mileage-min"
                type="text"
                value={formatMileage(localMin)}
                onChange={(e) => handleInputChange('min', e.target.value)}
                onBlur={() => {
                  if (localMin < min) setLocalMin(min);
                  if (localMin > localMax - 1000) setLocalMin(localMax - 1000);
                }}
                className="pr-8 text-sm"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                mi
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="mileage-max" className="text-xs text-gray-600">
              Max Miles
            </Label>
            <div className="relative">
              <Input
                id="mileage-max"
                type="text"
                value={formatMileage(localMax)}
                onChange={(e) => handleInputChange('max', e.target.value)}
                onBlur={() => {
                  if (localMax > max) setLocalMax(max);
                  if (localMax < localMin + 1000) setLocalMax(localMin + 1000);
                }}
                className="pr-8 text-sm"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                mi
              </span>
            </div>
          </div>
        </div>

        {/* Current range display */}
        <div className="text-center text-sm text-gray-600 font-medium">
          {formatMileage(localMin)} - {formatMileage(localMax)} miles
        </div>
      </div>
    </div>
  );
}