"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { Vehicle } from "@/lib/types";

// Lightweight favorite data - only essential info
interface FavoriteData {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mainImage?: string;
  addedAt: number;
}

interface OptimizedFavoritesContextType {
  favoriteIds: Set<string>;
  favoriteData: Map<string, FavoriteData>; // Lightweight cache
  addToFavorites: (vehicle: Vehicle) => void;
  removeFromFavorites: (vehicleId: string) => void;
  toggleFavorite: (vehicle: Vehicle) => void;
  isFavorite: (vehicleId: string) => boolean;
  clearFavorites: () => void;
  favoritesCount: number;
  getFavoriteData: (vehicleId: string) => FavoriteData | undefined;
  getAllFavorites: () => FavoriteData[];
  exportFavorites: () => void;
  importFavorites: (data: FavoriteData[]) => void;
}

const OptimizedFavoritesContext = createContext<OptimizedFavoritesContextType | undefined>(
  undefined
);

interface FavoritesProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "vehicleFavoritesOptimized";
const STORAGE_VERSION = "2.0";
const SAVE_DELAY = 1000; // Debounce localStorage saves

export function OptimizedFavoritesProvider({ children }: FavoritesProviderProps) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteData, setFavoriteData] = useState<Map<string, FavoriteData>>(new Map());
  const saveTimerRef = useRef<NodeJS.Timeout>();

  // Load favorites from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);

          if (parsedData.version === STORAGE_VERSION && Array.isArray(parsedData.favorites)) {
            const ids = new Set<string>();
            const dataMap = new Map<string, FavoriteData>();

            parsedData.favorites.forEach((fav: FavoriteData) => {
              if (fav?.id) {
                ids.add(fav.id);
                dataMap.set(fav.id, fav);
              }
            });

            setFavoriteIds(ids);
            setFavoriteData(dataMap);
          }
        }
      } catch (error) {
        console.warn("Failed to load favorites from localStorage:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Debounced save to localStorage
  const saveToLocalStorage = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      if (typeof window !== "undefined") {
        try {
          const favorites = Array.from(favoriteData.values());
          const dataToSave = {
            version: STORAGE_VERSION,
            favorites,
            timestamp: Date.now(),
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        } catch (error) {
          console.warn("Failed to save favorites to localStorage:", error);
        }
      }
    }, SAVE_DELAY);
  }, [favoriteData]);

  // Save whenever favoriteData changes (debounced)
  useEffect(() => {
    saveToLocalStorage();

    // Cleanup timer on unmount
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [saveToLocalStorage]);

  const addToFavorites = useCallback((vehicle: Vehicle) => {
    if (!favoriteIds.has(vehicle.id)) {
      // Extract only essential data
      const lightweightData: FavoriteData = {
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        price: vehicle.price,
        mainImage: vehicle.mainImage,
        addedAt: Date.now(),
      };

      setFavoriteIds(prev => new Set([...prev, vehicle.id]));
      setFavoriteData(prev => {
        const newMap = new Map(prev);
        newMap.set(vehicle.id, lightweightData);
        return newMap;
      });

      // Haptic feedback
      if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
        navigator.vibrate?.(50);
      }
    }
  }, [favoriteIds]);

  const removeFromFavorites = useCallback((vehicleId: string) => {
    if (favoriteIds.has(vehicleId)) {
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(vehicleId);
        return newSet;
      });

      setFavoriteData(prev => {
        const newMap = new Map(prev);
        newMap.delete(vehicleId);
        return newMap;
      });
    }
  }, [favoriteIds]);

  const toggleFavorite = useCallback((vehicle: Vehicle) => {
    if (favoriteIds.has(vehicle.id)) {
      removeFromFavorites(vehicle.id);
    } else {
      addToFavorites(vehicle);
    }
  }, [favoriteIds, addToFavorites, removeFromFavorites]);

  const isFavorite = useCallback((vehicleId: string): boolean => {
    return favoriteIds.has(vehicleId);
  }, [favoriteIds]);

  const clearFavorites = useCallback(() => {
    setFavoriteIds(new Set());
    setFavoriteData(new Map());

    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const getFavoriteData = useCallback((vehicleId: string): FavoriteData | undefined => {
    return favoriteData.get(vehicleId);
  }, [favoriteData]);

  const getAllFavorites = useCallback((): FavoriteData[] => {
    return Array.from(favoriteData.values()).sort((a, b) => b.addedAt - a.addedAt);
  }, [favoriteData]);

  const exportFavorites = useCallback(() => {
    const favorites = getAllFavorites();

    if (favorites.length === 0) {
      toast.error("No favorites to export");
      return;
    }

    const dataToExport = {
      version: STORAGE_VERSION,
      favorites,
      exportDate: new Date().toISOString(),
      metadata: {
        count: favorites.length,
        source: "AUTO ANI Website",
      },
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `auto-ani-favorites-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${favorites.length} favorites`);
  }, [getAllFavorites]);

  const importFavorites = useCallback((data: FavoriteData[]) => {
    try {
      const validData = data.filter(
        (v) => v && typeof v === "object" && typeof v.id === "string"
      );

      if (validData.length === 0) {
        throw new Error("No valid vehicles found in import data");
      }

      // Merge with existing favorites
      const newIds = new Set(favoriteIds);
      const newData = new Map(favoriteData);
      let imported = 0;

      validData.forEach((fav) => {
        if (!newIds.has(fav.id)) {
          newIds.add(fav.id);
          newData.set(fav.id, {
            ...fav,
            addedAt: fav.addedAt || Date.now(),
          });
          imported++;
        }
      });

      setFavoriteIds(newIds);
      setFavoriteData(newData);

      toast.success(`Imported ${imported} favorites`);
      return {
        success: true,
        imported,
        duplicates: validData.length - imported,
      };
    } catch (error) {
      console.error("Failed to import favorites:", error);
      toast.error("Failed to import favorites");
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, [favoriteIds, favoriteData]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<OptimizedFavoritesContextType>(() => ({
    favoriteIds,
    favoriteData,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    favoritesCount: favoriteIds.size,
    getFavoriteData,
    getAllFavorites,
    exportFavorites,
    importFavorites,
  }), [
    favoriteIds,
    favoriteData,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    getFavoriteData,
    getAllFavorites,
    exportFavorites,
    importFavorites,
  ]);

  return (
    <OptimizedFavoritesContext.Provider value={value}>
      {children}
    </OptimizedFavoritesContext.Provider>
  );
}

export function useOptimizedFavorites() {
  const context = useContext(OptimizedFavoritesContext);
  if (context === undefined) {
    throw new Error("useOptimizedFavorites must be used within a OptimizedFavoritesProvider");
  }
  return context;
}

// Migration utility to convert old favorites to new format
export function migrateFavorites(): boolean {
  try {
    const oldData = localStorage.getItem("vehicleFavorites");
    if (!oldData) return false;

    const parsed = JSON.parse(oldData);
    if (parsed.version !== "1.0" || !Array.isArray(parsed.favorites)) return false;

    const newFavorites: FavoriteData[] = parsed.favorites.map((vehicle: Vehicle) => ({
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      price: vehicle.price,
      mainImage: vehicle.mainImage,
      addedAt: parsed.timestamp || Date.now(),
    }));

    const newData = {
      version: STORAGE_VERSION,
      favorites: newFavorites,
      timestamp: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    localStorage.removeItem("vehicleFavorites"); // Remove old data

    console.log(`Migrated ${newFavorites.length} favorites to optimized format`);
    return true;
  } catch (error) {
    console.error("Failed to migrate favorites:", error);
    return false;
  }
}