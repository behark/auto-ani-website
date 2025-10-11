'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Vehicle } from '@/lib/types';
import { Calendar, Eye, Fuel, Heart, Navigation, Settings } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface VehicleCardProps {
  vehicle: Vehicle;
}

export default function VehicleCardSimple({ vehicle }: VehicleCardProps) {
  const [hoveredCard, setHoveredCard] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-US').format(mileage);
  };

  const vehicleSlug = vehicle.slug || vehicle.id;

  return (
    <Card
      className="overflow-hidden shadow-card-hover cursor-pointer group"
      onMouseEnter={() => setHoveredCard(true)}
      onMouseLeave={() => setHoveredCard(false)}
    >
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden bg-gray-200">
        <img
          src={vehicle.images?.[0] || '/images/placeholder-vehicle.svg'}
          alt={`${vehicle.make} ${vehicle.model}`}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            hoveredCard ? 'scale-110' : ''
          }`}
          loading="lazy"
        />

        {/* Overlay Actions */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 transition-opacity duration-300 ${
            hoveredCard ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex gap-2">
            <Link href={`/vehicles/${vehicleSlug}`}>
              <Button size="sm" variant="secondary" className="bg-white/90">
                <Eye className="h-4 w-4 mr-1" /> Shiko Detajet
              </Button>
            </Link>
            <Button size="sm" variant="ghost" className="bg-white/20 text-white hover:bg-white/30">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {vehicle.status === 'Available' && (
            <Badge className="bg-green-500 text-white">I Disponueshëm</Badge>
          )}
          {vehicle.featured && (
            <Badge className="bg-[var(--primary-orange)] text-white">Të Zgjedhura</Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        {/* Title and Price */}
        <div className="mb-3">
          <h3 className="text-xl font-semibold mb-1">
            {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-2xl font-bold text-[var(--primary-orange)]">
            {formatPrice(vehicle.price)}
          </p>
        </div>

        {/* Vehicle Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{vehicle.year}</span>
          </div>
          <div className="flex items-center gap-1">
            <Navigation className="h-3 w-3" />
            <span>{formatMileage(vehicle.mileage)} km</span>
          </div>
          <div className="flex items-center gap-1">
            <Fuel className="h-3 w-3" />
            <span>{vehicle.fuelType}</span>
          </div>
          <div className="flex items-center gap-1">
            <Settings className="h-3 w-3" />
            <span>{vehicle.transmission}</span>
          </div>
        </div>

        {/* Action Button */}
        <Link href={`/vehicles/${vehicleSlug}`}>
          <Button className="w-full bg-[var(--primary-orange)] hover:bg-orange-600 text-white">
            Shiko Detajet
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}