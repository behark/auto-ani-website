'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Vehicle } from '@/lib/types';

interface FavoritesContextType {
  favorites: Vehicle[];
  favoriteIds: Set<string>;
  addToFavorites: (vehicle: Vehicle) => void;
  removeFromFavorites: (vehicleId: string) => void;
  toggleFavorite: (vehicle: Vehicle) => void;
  isFavorite: (vehicleId: string) => boolean;
  clearFavorites: () => void;
  favoritesCount: number;
  exportFavorites: () => void;
  importFavorites: (data: Vehicle[]) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'vehicleFavorites';
const STORAGE_VERSION = '1.0';

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<Vehicle[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Load favorites from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);

          // Check version compatibility
          if (parsedData.version === STORAGE_VERSION && Array.isArray(parsedData.favorites)) {
            const validFavorites = parsedData.favorites.filter((item: any) =>
              item && typeof item === 'object' && typeof item.id === 'string'
            );

            setFavorites(validFavorites);
            setFavoriteIds(new Set(validFavorites.map((v: Vehicle) => v.id)));
          }
        }
      } catch (error) {
        console.warn('Failed to load favorites from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const dataToSave = {
          version: STORAGE_VERSION,
          favorites,
          timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) {
        console.warn('Failed to save favorites to localStorage:', error);
      }
    }
  }, [favorites]);

  const addToFavorites = (vehicle: Vehicle) => {
    if (!favoriteIds.has(vehicle.id)) {
      const newFavorites = [...favorites, vehicle];
      setFavorites(newFavorites);
      setFavoriteIds(new Set([...favoriteIds, vehicle.id]));

      // Show success feedback
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate?.(50); // Subtle vibration feedback
      }
    }
  };

  const removeFromFavorites = (vehicleId: string) => {
    if (favoriteIds.has(vehicleId)) {
      const newFavorites = favorites.filter(v => v.id !== vehicleId);
      const newFavoriteIds = new Set(favoriteIds);
      newFavoriteIds.delete(vehicleId);

      setFavorites(newFavorites);
      setFavoriteIds(newFavoriteIds);
    }
  };

  const toggleFavorite = (vehicle: Vehicle) => {
    if (favoriteIds.has(vehicle.id)) {
      removeFromFavorites(vehicle.id);
    } else {
      addToFavorites(vehicle);
    }
  };

  const isFavorite = (vehicleId: string): boolean => {
    return favoriteIds.has(vehicleId);
  };

  const clearFavorites = () => {
    setFavorites([]);
    setFavoriteIds(new Set());

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const exportFavorites = () => {
    if (favorites.length === 0) {
      alert('No favorites to export');
      return;
    }

    const dataToExport = {
      version: STORAGE_VERSION,
      favorites,
      exportDate: new Date().toISOString(),
      metadata: {
        count: favorites.length,
        source: 'AUTO ANI Website'
      }
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auto-ani-favorites-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importFavorites = (data: Vehicle[]) => {
    try {
      const validVehicles = data.filter(v =>
        v && typeof v === 'object' && typeof v.id === 'string'
      );

      if (validVehicles.length === 0) {
        throw new Error('No valid vehicles found in import data');
      }

      // Merge with existing favorites, avoiding duplicates
      const existingIds = new Set(favorites.map(v => v.id));
      const newVehicles = validVehicles.filter(v => !existingIds.has(v.id));

      const mergedFavorites = [...favorites, ...newVehicles];
      setFavorites(mergedFavorites);
      setFavoriteIds(new Set(mergedFavorites.map(v => v.id)));

      return {
        success: true,
        imported: newVehicles.length,
        duplicates: validVehicles.length - newVehicles.length
      };
    } catch (error) {
      console.error('Failed to import favorites:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const value: FavoritesContextType = {
    favorites,
    favoriteIds,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    favoritesCount: favorites.length,
    exportFavorites,
    importFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}