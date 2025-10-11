'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  GitCompare,
  X,
  Share2,
  Download,
  Eye,
  EyeOff,
  MoreHorizontal,
  Plus,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCompareStore } from '@/store/compareStore';
import { Vehicle } from '@/lib/types';

interface EnhancedComparePanelProps {
  children?: React.ReactNode;
}

export default function EnhancedComparePanel({ children }: EnhancedComparePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const compareStore = useCompareStore();

  const {
    vehicles,
    highlightDifferences,
    showOnlyDifferences,
    setHighlightDifferences,
    setShowOnlyDifferences,
    removeVehicle,
    clearComparison,
    getComparisonUrl,
    exportComparison
  } = compareStore;

  const activeVehicles = vehicles.filter(v => v !== null) as Vehicle[];
  const canAddMore = activeVehicles.length < 4;

  // Auto-open when vehicles are added
  useEffect(() => {
    if (activeVehicles.length > 0 && !isOpen) {
      setIsOpen(true);
    }
  }, [activeVehicles.length, isOpen]);

  const handleShare = () => {
    const shareUrl = getComparisonUrl();
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Comparison link copied to clipboard!');
    } else {
      toast.error('No vehicles to share');
    }
  };

  const handleExport = () => {
    exportComparison();
    toast.success('Comparison exported successfully!');
  };

  const handleViewComparison = () => {
    if (activeVehicles.length >= 2) {
      const vehicleIds = activeVehicles.map(v => v.id).join(',');
      router.push(`/compare?vehicles=${vehicleIds}`);
      setIsOpen(false);
    } else {
      toast.error('Add at least 2 vehicles to compare');
    }
  };

  const compareFeatures = [
    { key: 'make', label: 'Make' },
    { key: 'model', label: 'Model' },
    { key: 'year', label: 'Year' },
    { key: 'price', label: 'Price' },
    { key: 'mileage', label: 'Mileage' },
    { key: 'fuelType', label: 'Fuel Type' },
    { key: 'transmission', label: 'Transmission' },
    { key: 'bodyType', label: 'Body Type' },
    { key: 'engineSize', label: 'Engine' },
    { key: 'drivetrain', label: 'Drivetrain' }
  ];

  const getVehicleValue = (vehicle: Vehicle, key: string): string => {
    switch (key) {
      case 'price':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0
        }).format(vehicle.price);
      case 'mileage':
        return `${new Intl.NumberFormat('en-US').format(vehicle.mileage)} mi`;
      default:
        return (vehicle as any)[key]?.toString() || '-';
    }
  };

  const getValueDifference = (values: string[], key: string): 'same' | 'different' => {
    const uniqueValues = new Set(values);
    return uniqueValues.size === 1 ? 'same' : 'different';
  };

  const filteredFeatures = showOnlyDifferences
    ? compareFeatures.filter(feature => {
        const values = activeVehicles.map(v => getVehicleValue(v, feature.key));
        return getValueDifference(values, feature.key) === 'different';
      })
    : compareFeatures;

  if (activeVehicles.length === 0) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {children || (
            <Button variant="outline" size="sm" disabled>
              <GitCompare className="h-4 w-4 mr-2" />
              Compare (0)
            </Button>
          )}
        </SheetTrigger>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="sm"
            className="relative"
          >
            <GitCompare className="h-4 w-4 mr-2" />
            Compare
            <Badge variant="secondary" className="ml-2">
              {activeVehicles.length}
            </Badge>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[90vw] sm:w-[600px] max-w-none">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Vehicle Comparison ({activeVehicles.length}/4)
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Comparison
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={clearComparison}
                    className="text-red-600"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Comparison Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="highlight-differences" className="text-sm">
                Highlight Differences
              </Label>
              <Switch
                id="highlight-differences"
                checked={highlightDifferences}
                onCheckedChange={setHighlightDifferences}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-only-differences" className="text-sm">
                Show Only Differences
              </Label>
              <Switch
                id="show-only-differences"
                checked={showOnlyDifferences}
                onCheckedChange={setShowOnlyDifferences}
              />
            </div>
          </div>

          <Separator />

          {/* Vehicle Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vehicles.map((vehicle, index) => (
              <div key={index} className="border rounded-lg p-3">
                {vehicle ? (
                  <div>
                    <div className="relative mb-3">
                      <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                        <Image
                          src={vehicle.images[0] || '/images/vehicle-placeholder.jpg'}
                          alt={`${vehicle.make} ${vehicle.model}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                      </div>
                      <button
                        onClick={() => removeVehicle(vehicle.id)}
                        className="absolute top-2 right-2 p-1 bg-white/90 hover:bg-white rounded-full shadow"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h4>
                    <p className="text-lg font-bold text-[var(--primary-orange)] mb-2">
                      {getVehicleValue(vehicle, 'price')}
                    </p>
                    <Link
                      href={`/vehicles/${vehicle.slug || vehicle.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View Details →
                    </Link>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                    <Plus className="h-8 w-8 mb-2" />
                    <p className="text-sm">Add Vehicle</p>
                    <p className="text-xs">Slot {index + 1}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Comparison Table */}
          {activeVehicles.length >= 2 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Quick Comparison</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredFeatures.map((feature) => {
                    const values = activeVehicles.map(v => getVehicleValue(v, feature.key));
                    const isDifferent = getValueDifference(values, feature.key) === 'different';

                    return (
                      <div
                        key={feature.key}
                        className={`grid grid-cols-${Math.min(activeVehicles.length + 1, 5)} gap-2 py-2 px-3 rounded text-sm ${
                          highlightDifferences && isDifferent
                            ? 'bg-yellow-50 border border-yellow-200'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-gray-700">
                          {feature.label}
                        </div>
                        {activeVehicles.map((vehicle, index) => (
                          <div
                            key={vehicle.id}
                            className={`text-center ${
                              highlightDifferences && isDifferent
                                ? 'font-medium text-yellow-800'
                                : ''
                            }`}
                          >
                            {getVehicleValue(vehicle, feature.key)}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {activeVehicles.length >= 2 && (
              <Button
                onClick={handleViewComparison}
                className="w-full bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Comparison
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {canAddMore && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/vehicles');
                }}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add More Vehicles ({4 - activeVehicles.length} slots remaining)
              </Button>
            )}
          </div>

          {activeVehicles.length < 2 && (
            <div className="text-center py-4 text-gray-500">
              <GitCompare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Add at least 2 vehicles to start comparing</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}