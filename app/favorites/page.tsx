'use client';

import { useState } from 'react';
import { Heart, Download, Upload, Trash2, Share, Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import VehicleCard from '@/components/vehicles/VehicleCard';
import { useFavorites } from '@/contexts/FavoritesContext';

export default function FavoritesPage() {
  const {
    favorites,
    favoritesCount,
    clearFavorites,
    exportFavorites,
    importFavorites
  } = useFavorites();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recent');
  const [showAlert, setShowAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Sort favorites
  const sortedFavorites = [...favorites].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'year-new':
        return b.year - a.year;
      case 'year-old':
        return a.year - b.year;
      case 'alphabetical':
        return `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`);
      case 'recent':
      default:
        return 0; // Keep original order (most recent first)
    }
  });

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            const vehiclesToImport = data.favorites || data;
            importFavorites(vehiclesToImport);
            setShowAlert({
              type: 'success',
              message: `Successfully imported favorites`
            });
          } catch {
            setShowAlert({
              type: 'error',
              message: 'Invalid file format'
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleShare = async () => {
    if (navigator.share && favorites.length > 0) {
      try {
        await navigator.share({
          title: 'My Favorite Vehicles - AUTO ANI',
          text: `Check out my ${favoritesCount} favorite vehicles from AUTO ANI`,
          url: window.location.href
        });
      } catch {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href);
        setShowAlert({
          type: 'success',
          message: 'Page URL copied to clipboard'
        });
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      setShowAlert({
        type: 'success',
        message: 'Page URL copied to clipboard'
      });
    }
  };

  const handleClearAll = () => {
    if (confirm(`Are you sure you want to remove all ${favoritesCount} vehicles from your favorites?`)) {
      clearFavorites();
      setShowAlert({
        type: 'success',
        message: 'All favorites cleared'
      });
    }
  };

  if (favoritesCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="p-12">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-gray-700 mb-4">
                  No Favorites Yet
                </h1>
                <p className="text-gray-600 mb-8 text-lg">
                  Start exploring our vehicle collection and save your favorites by clicking the heart icon on any vehicle.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => window.history.back()}
                    variant="outline"
                    size="lg"
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/vehicles'}
                    size="lg"
                    className="bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]"
                  >
                    Browse Vehicles
                  </Button>
                </div>

                <div className="mt-8 p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Import Existing Favorites</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Have a favorites list from before? Import it here.
                  </p>
                  <Button onClick={handleImport} variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Favorites
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Heart className="h-8 w-8 text-[var(--primary-orange)]" />
                My Favorites
              </h1>
              <p className="text-gray-600">
                {favoritesCount} {favoritesCount === 1 ? 'vehicle' : 'vehicles'} saved
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleShare} variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button onClick={exportFavorites} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleImport} variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button onClick={handleClearAll} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </div>

        {/* Alert */}
        {showAlert && (
          <Alert className={`mb-6 ${showAlert.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <AlertDescription className={showAlert.type === 'error' ? 'text-red-700' : 'text-green-700'}>
              {showAlert.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Showing {favoritesCount} {favoritesCount === 1 ? 'vehicle' : 'vehicles'}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recently Added</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="year-new">Year: Newest First</SelectItem>
                    <SelectItem value="year-old">Year: Oldest First</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex gap-1 border rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('grid')}
                    className={viewMode === 'grid' ? 'bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]' : ''}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]' : ''}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicles Grid/List */}
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
            : 'space-y-6'
        }>
          {sortedFavorites.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} viewMode={viewMode} />
          ))}
        </div>

        {/* Footer Info */}
        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 text-sm">
              Your favorites are automatically saved in your browser. Export them to keep a backup or share with others.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}