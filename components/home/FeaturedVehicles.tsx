'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Eye } from 'lucide-react';
import { Vehicle } from '@/lib/sanity';

export default function FeaturedVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('/api/vehicles?featured=true&limit=6');
        const data = await response.json();
        if (data.success && data.data.vehicles && data.data.vehicles.length > 0) {
          setVehicles(data.data.vehicles);
        } else {
          // Fallback to mock data when API doesn't return vehicles or returns empty array
          setVehicles(mockVehicles);
        }
      } catch (error) {
        console.error('Failed to fetch vehicles, using mock data:', error);
        // Use mock data when API fails
        setVehicles(mockVehicles);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  // Mock vehicles for demonstration until Sanity is connected
  const mockVehicles: Vehicle[] = [
    {
      _id: '1',
      _type: 'vehicle',
      title: 'BMW X5 xDrive30d',
      brand: 'BMW',
      model: 'X5',
      year: 2021,
      price: 42500,
      mileage: 35000,
      category: 'used',
      specifications: { fuelType: 'Benzinë' },
      slug: { current: 'bmw-x5-2021' },
      featured: true,
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      _id: '2',
      _type: 'vehicle',
      title: 'Mercedes-Benz C-Class AMG',
      brand: 'Mercedes-Benz',
      model: 'C-Class',
      year: 2020,
      price: 38900,
      mileage: 28000,
      category: 'used',
      specifications: { fuelType: 'Dizell' },
      slug: { current: 'mercedes-c-class-2020' },
      featured: true,
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      _id: '3',
      _type: 'vehicle',
      title: 'Audi A4 S Line',
      brand: 'Audi',
      model: 'A4',
      year: 2022,
      price: 35700,
      mileage: 18000,
      category: 'used',
      specifications: { fuelType: 'Benzinë' },
      slug: { current: 'audi-a4-2022' },
      featured: true,
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      _id: '4',
      _type: 'vehicle',
      title: 'Volkswagen Golf GTI',
      brand: 'Volkswagen',
      model: 'Golf',
      year: 2021,
      price: 23500,
      mileage: 25000,
      category: 'used',
      specifications: { fuelType: 'Benzinë' },
      slug: { current: 'vw-golf-2021' },
      featured: true,
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      _id: '5',
      _type: 'vehicle',
      title: 'Toyota RAV4 Hybrid',
      brand: 'Toyota',
      model: 'RAV4',
      year: 2022,
      price: 31200,
      mileage: 15000,
      category: 'used',
      specifications: { fuelType: 'Hibrid' },
      slug: { current: 'toyota-rav4-2022' },
      featured: true,
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      _id: '6',
      _type: 'vehicle',
      title: 'BMW 320d xDrive',
      brand: 'BMW',
      model: '320d',
      year: 2020,
      price: 29800,
      mileage: 42000,
      category: 'used',
      specifications: { fuelType: 'Dizell' },
      slug: { current: 'bmw-320d-2020' },
      featured: true,
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z'
    }
  ];

  const formatPrice = (price: number) => {
    return `€${price.toLocaleString('de-DE')}`;
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Veturat e <span className="text-[var(--primary-orange)]">Zgjedhura</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Shikoni përzgjedhjen tonë të veturave premium
          </p>
        </div>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-gray-200 loading-shimmer"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 loading-shimmer mb-2"></div>
                  <div className="h-6 bg-gray-200 loading-shimmer mb-3"></div>
                  <div className="flex justify-between mb-4">
                    <div className="h-4 w-20 bg-gray-200 loading-shimmer"></div>
                    <div className="h-4 w-16 bg-gray-200 loading-shimmer"></div>
                  </div>
                  <div className="h-10 bg-gray-200 loading-shimmer"></div>
                </CardContent>
              </Card>
            ))
          ) : vehicles.length > 0 ? (
            vehicles.map((vehicle) => (
              <Card key={vehicle._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gray-200 flex items-center justify-center">
                  <Car className="w-16 h-16 text-gray-400" />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-[var(--primary-orange)] text-white">Featured</Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold">
                      {vehicle.year} {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-2xl font-bold text-[var(--primary-orange)]">
                      {formatPrice(vehicle.price)}
                    </p>
                  </div>

                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <span>{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A'}</span>
                    <span>{vehicle.specifications?.fuelType || 'N/A'}</span>
                  </div>

                  <Link href={`/vehicles/${vehicle.slug.current}`}>
                    <Button className="w-full bg-[var(--primary-orange)] hover:bg-orange-600 text-white">
                      <Eye className="h-4 w-4 mr-2" />
                      Shiko Detajet
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Featured Vehicles</h3>
              <p className="text-gray-500">Please add some vehicles to your Sanity CMS.</p>
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link href="/vehicles">
            <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white">
              Shiko Të Gjitha Veturat →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}