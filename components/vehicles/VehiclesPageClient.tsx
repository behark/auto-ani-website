'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VehicleCardSimple from './VehicleCardSimple';
import AdvancedVehicleFilters from './AdvancedVehicleFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  LayoutGrid,
  List,
  TrendingUp,
  Star,
  Award,
  Filter,
  Eye,
  Heart,
  Share2,
  Search,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Zap,
  Shield,
  Banknote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Vehicle } from '@/lib/types';
import { logger } from '@/lib/logger';

interface VehiclesPageClientProps {
  initialVehicles: Vehicle[];
}

export default function VehiclesPageClient({ initialVehicles }: VehiclesPageClientProps) {
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>(initialVehicles);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>(initialVehicles);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [favoriteVehicles, setFavoriteVehicles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(initialVehicles.length === 0);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  // Load vehicles from API if not provided - FIXED: Prevent infinite loop
  useEffect(() => {
    if (initialVehicles.length === 0 && allVehicles.length === 0 && !hasAttemptedFetch) {
      setHasAttemptedFetch(true);
      fetchVehicles();
    }
  }, [initialVehicles.length, allVehicles.length, hasAttemptedFetch]);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('auto-ani-favorites');
    if (saved) {
      try {
        setFavoriteVehicles(JSON.parse(saved));
      } catch (error) {
        logger.error('Error loading favorites from localStorage', {}, error as Error);
      }
    }
  }, []);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/vehicles?limit=50', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const vehicles = data.vehicles || [];

      logger.debug('Client-side vehicle fetch completed', {
        count: vehicles.length,
        sample: vehicles.slice(0, 2).map((v: Vehicle) => `${v.make} ${v.model}`)
      });

      setAllVehicles(vehicles);
      setFilteredVehicles(vehicles);

      if (vehicles.length === 0) {
        logger.warn('No vehicles returned from API');
      }
    } catch (error) {
      logger.error('Error fetching vehicles from client-side', {}, error as Error);
      setIsLoading(false);
      // Don't set loading to false in finally if there was an error - let user retry
    } finally {
      if (allVehicles.length > 0) {
        setIsLoading(false);
      }
    }
  };

  const toggleFavorite = (vehicleId: string) => {
    const newFavorites = favoriteVehicles.includes(vehicleId)
      ? favoriteVehicles.filter(id => id !== vehicleId)
      : [...favoriteVehicles, vehicleId];

    setFavoriteVehicles(newFavorites);
    localStorage.setItem('auto-ani-favorites', JSON.stringify(newFavorites));
  };

  // Calculate statistics
  const stats = {
    totalVehicles: allVehicles.length,
    averagePrice: allVehicles.length > 0 ? Math.round(allVehicles.reduce((sum, v) => sum + v.price, 0) / allVehicles.length) : 0,
    averageYear: allVehicles.length > 0 ? Math.round(allVehicles.reduce((sum, v) => sum + v.year, 0) / allVehicles.length) : 0,
    uniqueMakes: new Set(allVehicles.map(v => v.make)).size,
    premiumCount: allVehicles.filter(v => ['BMW', 'Mercedes', 'Audi'].includes(v.make)).length
  };

  const formatPrice = (price: number) => `€${price.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">

        {/* Page Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Të Gjitha <span className="text-[var(--primary-orange)]">Veturat</span>
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Shfleto koleksionin tonë të veturave premium me filtrat e avancuara
            </p>

            {/* Key Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--primary-orange)]">{stats.totalVehicles}</div>
                  <div className="text-sm text-gray-600">Vetura Total</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--primary-orange)]">{stats.uniqueMakes}</div>
                  <div className="text-sm text-gray-600">Marka</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--primary-orange)]">{stats.premiumCount}</div>
                  <div className="text-sm text-gray-600">Premium</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--primary-orange)]">{stats.averageYear}</div>
                  <div className="text-sm text-gray-600">Vit Mesatar</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--primary-orange)]">{formatPrice(stats.averagePrice)}</div>
                  <div className="text-sm text-gray-600">Çmim Mesatar</div>
                </CardContent>
              </Card>
            </div>

            {/* Value Propositions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Banknote className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-orange-800">Financim 0%</h3>
                      <p className="text-sm text-orange-600">Kushte të favorshme financimi</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800">Garanci e Zgjeruar</h3>
                      <p className="text-sm text-green-600">Mbrojtje e plotë për veturën</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Zap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-800">Test Drive Falas</h3>
                      <p className="text-sm text-blue-600">Provo përpara se të blesh</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Filters Sidebar */}
          <div className={cn(
            "lg:col-span-1",
            !showFilters && "hidden lg:block"
          )}>
            <div className="sticky top-4">
              <AdvancedVehicleFilters
                vehicles={allVehicles}
                onFilteredVehicles={setFilteredVehicles}
              />
            </div>
          </div>

          {/* Vehicles Grid */}
          <div className="lg:col-span-3">

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrat
                </Button>

                <div className="text-sm text-gray-600">
                  <strong>{filteredVehicles.length}</strong> nga {allVehicles.length} vetura
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Duke ngarkuar veturat...</p>
              </div>
            )}

            {/* No Results Message */}
            {!isLoading && filteredVehicles.length === 0 && allVehicles.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <Card>
                  <CardContent className="p-8">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Nuk ka vetura të disponueshme</h3>
                    <p className="text-gray-600 mb-4">
                      Inventari është bosh ose ka probleme në ngarkimin e të dhënave.
                    </p>
                    <Button onClick={() => fetchVehicles()}>
                      Rifresko Inventarin
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Filtered No Results */}
            {!isLoading && filteredVehicles.length === 0 && allVehicles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <Card>
                  <CardContent className="p-8">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Nuk u gjetën vetura</h3>
                    <p className="text-gray-600 mb-4">
                      Provo të ndryshosh filtrat për të parë më shumë vetura.
                    </p>
                    <Button onClick={() => setFilteredVehicles(allVehicles)}>
                      Shiko të gjitha veturat
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Vehicles Display */}
            {filteredVehicles.length > 0 && (
              <motion.div layout className="space-y-6">

                {/* Grid View */}
                {viewMode === 'grid' && (
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      layout
                      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    >
                      {filteredVehicles.map((vehicle, index) => (
                        <motion.div
                          key={vehicle.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.05
                          }}
                        >
                          <VehicleCardSimple
                            vehicle={vehicle}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <AnimatePresence mode="popLayout">
                    <motion.div layout className="space-y-4">
                      {filteredVehicles.map((vehicle, index) => (
                        <motion.div
                          key={vehicle.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.03
                          }}
                        >
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex flex-col sm:flex-row gap-4">

                                {/* Vehicle Image */}
                                <div className="w-full sm:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                  {vehicle.images && vehicle.images.length > 0 ? (
                                    <img
                                      src={typeof vehicle.images === 'string'
                                        ? JSON.parse(vehicle.images)[0]
                                        : vehicle.images[0]
                                      }
                                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      <Eye className="h-8 w-8" />
                                    </div>
                                  )}
                                </div>

                                {/* Vehicle Info */}
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h3 className="text-xl font-semibold">
                                        {vehicle.year} {vehicle.make} {vehicle.model}
                                      </h3>
                                      <p className="text-gray-600">
                                        {vehicle.bodyType} • {vehicle.fuelType} • {vehicle.transmission}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-[var(--primary-orange)]">
                                        {formatPrice(vehicle.price)}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {vehicle.mileage.toLocaleString()} km
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span>🏁 {vehicle.year}</span>
                                    <span>⛽ {vehicle.fuelType}</span>
                                    <span>🔧 {vehicle.transmission}</span>
                                    {vehicle.color && <span>🎨 {vehicle.color}</span>}
                                  </div>

                                  <div className="flex items-center justify-between pt-2">
                                    <div className="flex gap-2">
                                      <Badge variant="secondary">Garanci</Badge>
                                      <Badge variant="secondary">Test Drive</Badge>
                                      <Badge variant="secondary">Financim 0%</Badge>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleFavorite(vehicle.id.toString())}
                                      >
                                        <Heart className={cn(
                                          "h-4 w-4",
                                          favoriteVehicles.includes(vehicle.id.toString())
                                            ? "fill-red-500 text-red-500"
                                            : "text-gray-400"
                                        )} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                      >
                                        <Share2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]"
                                      >
                                        Shiko Detajet
                                        <ArrowRight className="h-4 w-4 ml-1" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}

              </motion.div>
            )}

            {/* Load More / Pagination could go here */}
            {filteredVehicles.length > 0 && (
              <div className="mt-12 text-center">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2">Nuk e gjete veturën që kërkon?</h3>
                    <p className="text-gray-600 mb-4">
                      Na kontakto dhe ne do të të ndihmojmë të gjesh veturën e përsosur për ty.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button className="bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]">
                        <Phone className="h-4 w-4 mr-2" />
                        +383 49 204 242
                      </Button>
                      <Button variant="outline">
                        <Mail className="h-4 w-4 mr-2" />
                        info@autosalonani.com
                      </Button>
                      <Button variant="outline">
                        <MapPin className="h-4 w-4 mr-2" />
                        Vizito Showroom
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}