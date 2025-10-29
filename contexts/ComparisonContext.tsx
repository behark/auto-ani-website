'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';

interface Vehicle {
  _id: string;
  title: string;
  slug: { current: string };
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  engine: string;
  mainImage?: string;
}

interface ComparisonContextType {
  comparisonList: Vehicle[];
  addToComparison: (vehicle: Vehicle) => void;
  removeFromComparison: (vehicleId: string) => void;
  clearComparison: () => void;
  isInComparison: (vehicleId: string) => boolean;
  canAddMore: boolean;
}

const MAX_COMPARISON_ITEMS = 3;

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [comparisonList, setComparisonList] = useState<Vehicle[]>([]);

  const addToComparison = useCallback((vehicle: Vehicle) => {
    setComparisonList(prev => {
      if (prev.length >= MAX_COMPARISON_ITEMS) {
        toast.error(`Maximum ${MAX_COMPARISON_ITEMS} vehicles can be compared at once`);
        return prev;
      }

      if (prev.some(v => v._id === vehicle._id)) {
        toast.info('Vehicle already in comparison');
        return prev;
      }

      toast.success('Added to comparison');
      return [...prev, vehicle];
    });
  }, []);

  const removeFromComparison = useCallback((vehicleId: string) => {
    setComparisonList(prev => {
      const updated = prev.filter(v => v._id !== vehicleId);
      if (updated.length < prev.length) {
        toast.success('Removed from comparison');
      }
      return updated;
    });
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonList([]);
    toast.success('Comparison cleared');
  }, []);

  const isInComparison = useCallback((vehicleId: string) => {
    return comparisonList.some(v => v._id === vehicleId);
  }, [comparisonList]);

  const canAddMore = comparisonList.length < MAX_COMPARISON_ITEMS;

  return (
    <ComparisonContext.Provider
      value={{
        comparisonList,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isInComparison,
        canAddMore,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}