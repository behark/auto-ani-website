'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useComparison } from '@/contexts/ComparisonContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface VehicleComparisonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VehicleComparison({ open, onOpenChange }: VehicleComparisonProps) {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const { t: _t } = useLanguage();

  if (comparisonList.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return `${new Intl.NumberFormat('en-US').format(mileage)  } km`;
  };

  const ComparisonRow = ({
    label,
    getValue
  }: {
    label: string;
    getValue: (vehicle: { _id: string; make?: string; model?: string; year?: number; price?: number; mileage?: number; fuelType?: string; transmission?: string; bodyType?: string; color?: string; engineSize?: string }) => React.ReactNode;
  }) => (
    <div className="border-b">
      <div className="py-3 px-4 bg-gray-50 dark:bg-gray-800 font-medium">
        {label}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 divide-x">
        {comparisonList.map((vehicle, index) => (
          <div
            key={vehicle._id}
            className={`py-3 px-4 ${
              index === 0 ? '' : index === 1 ? 'md:text-center' : 'md:text-right'
            }`}
          >
            {getValue(vehicle)}
          </div>
        ))}
        {Array.from({ length: 3 - comparisonList.length }).map((_, index) => (
          <div key={`empty-${index}`} className="py-3 px-4 text-center text-gray-400">
            -
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] md:h-[80vh]">
        <SheetHeader>
          <SheetTitle>Vehicle Comparison</SheetTitle>
          <SheetDescription>
            Compare up to 3 vehicles side by side
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-80px)] mt-4">
          <div className="space-y-6">
            {/* Vehicle Images and Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparisonList.map((vehicle) => (
                <div key={vehicle._id} className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10"
                    onClick={() => removeFromComparison(vehicle._id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <div className="aspect-[16/9] relative rounded-lg overflow-hidden bg-gray-100">
                    {vehicle.mainImage ? (
                      <Image
                        src={vehicle.mainImage}
                        alt={vehicle.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <h3 className="font-semibold text-lg">{vehicle.title}</h3>
                    <p className="text-2xl font-bold text-[var(--primary-orange)]">
                      {formatPrice(vehicle.price)}
                    </p>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Link href={`/vehicles/${vehicle.slug.current}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: 3 - comparisonList.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center text-gray-400"
                >
                  <div className="text-center">
                    <p>Empty Slot</p>
                    <p className="text-sm mt-1">Add more vehicles to compare</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="border rounded-lg overflow-hidden">
              <ComparisonRow
                label="Brand"
                getValue={(v) => v.brand}
              />
              <ComparisonRow
                label="Model"
                getValue={(v) => v.model}
              />
              <ComparisonRow
                label="Year"
                getValue={(v) => v.year}
              />
              <ComparisonRow
                label="Mileage"
                getValue={(v) => formatMileage(v.mileage)}
              />
              <ComparisonRow
                label="Fuel Type"
                getValue={(v) => (
                  <Badge variant="secondary">{v.fuelType}</Badge>
                )}
              />
              <ComparisonRow
                label="Transmission"
                getValue={(v) => (
                  <Badge variant="outline">{v.transmission}</Badge>
                )}
              />
              <ComparisonRow
                label="Engine"
                getValue={(v) => v.engine || 'N/A'}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="destructive"
                onClick={clearComparison}
                size="sm"
              >
                Clear All
              </Button>

              <div className="text-sm text-gray-600">
                Comparing {comparisonList.length} of 3 vehicles
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}