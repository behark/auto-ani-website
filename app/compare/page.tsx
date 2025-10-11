'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { VEHICLES } from '@/lib/constants';
import { Vehicle } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ComparePage() {
  const { t } = useLanguage();
  const [selectedVehicles, setSelectedVehicles] = useState<(Vehicle | null)[]>([null, null, null]);

  const handleVehicleSelect = (index: number, vehicleId: string) => {
    const vehicle = VEHICLES.find(v => v.id === vehicleId) || null;
    const newSelection = [...selectedVehicles];
    newSelection[index] = vehicle;
    setSelectedVehicles(newSelection);
  };

  const removeVehicle = (index: number) => {
    const newSelection = [...selectedVehicles];
    newSelection[index] = null;
    setSelectedVehicles(newSelection);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-US').format(mileage);
  };

  const compareFeatures = [
    { key: 'Year', label: t('vehicles.year') },
    { key: 'Price', label: t('vehicles.price') },
    { key: 'Mileage', label: t('vehicles.mileage') },
    { key: 'Fuel Type', label: t('vehicles.fuel') },
    { key: 'Transmission', label: t('vehicles.transmission') },
    { key: 'Body Type', label: t('vehicles.bodyType') },
    { key: 'Engine', label: t('vehicles.engine') },
    { key: 'Drivetrain', label: t('vehicles.drivetrain') },
    { key: 'Doors', label: t('vehicles.doors') },
    { key: 'Seats', label: t('vehicles.seats') },
    { key: 'MPG City', label: `${t('vehicles.fuelEconomy')} ${t('vehicles.city')}` },
    { key: 'MPG Highway', label: `${t('vehicles.fuelEconomy')} ${t('vehicles.highway')}` }
  ];

  const getVehicleValue = (vehicle: Vehicle | null, feature: string) => {
    if (!vehicle) return '-';

    switch (feature) {
      case 'Year': return vehicle.year;
      case 'Price': return formatPrice(vehicle.price);
      case 'Mileage': return `${formatMileage(vehicle.mileage)} mi`;
      case 'Fuel Type': return vehicle.fuelType;
      case 'Transmission': return vehicle.transmission;
      case 'Body Type': return vehicle.bodyType;
      case 'Engine': return vehicle.engineSize;
      case 'Drivetrain': return vehicle.drivetrain;
      case 'Doors': return vehicle.doors || '-';
      case 'Seats': return vehicle.seats || '-';
      case 'MPG City': return vehicle.mpgCity || '-';
      case 'MPG Highway': return vehicle.mpgHighway || '-';
      default: return '-';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {t('compare.title')} <span className="text-[var(--primary-orange)]">{t('vehicles.vehicles')}</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('compare.subtitle')}
          </p>
        </div>

        {/* Vehicle Selection */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {selectedVehicles.map((vehicle, index) => (
            <Card key={index} className="relative">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{t('compare.vehicle')} {index + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                {vehicle ? (
                  <div>
                    <button
                      onClick={() => removeVehicle(index)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                      aria-label="Remove vehicle"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-4 relative">
                      <Image
                        src={vehicle.images[0]}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-2xl font-bold text-[var(--primary-orange)] mb-3">
                      {formatPrice(vehicle.price)}
                    </p>
                    <Link href={`/vehicles/${vehicle.slug || vehicle.id}`}>
                      <Button variant="outline" className="w-full">View Details</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="h-10 w-10 text-gray-400" />
                    </div>
                    <Select
                      onValueChange={(value) => handleVehicleSelect(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLES.filter(v =>
                          !selectedVehicles.some(selected => selected?.id === v.id)
                        ).map(v => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.year} {v.make} {v.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        {selectedVehicles.some(v => v !== null) && (
          <Card>
            <CardHeader>
              <CardTitle>{t('compare.specifications')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">{t('compare.features')}</th>
                      {selectedVehicles.map((vehicle, index) => (
                        vehicle && (
                          <th key={index} className="text-center py-3 px-4">
                            {vehicle.make} {vehicle.model}
                          </th>
                        )
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compareFeatures.map((feature, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="py-3 px-4 font-medium">{feature.label}</td>
                        {selectedVehicles.map((vehicle, vIndex) => (
                          vehicle && (
                            <td key={vIndex} className="text-center py-3 px-4">
                              {getVehicleValue(vehicle, feature.key)}
                            </td>
                          )
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Features Comparison */}
              <div className="mt-8">
                <h3 className="font-semibold text-lg mb-4">{t('compare.features')}</h3>
                <div className="space-y-2">
                  {selectedVehicles.some(v => v !== null) && (
                    <>
                      {Array.from(new Set(selectedVehicles.flatMap(v => v?.features || []))).map((feature, index) => (
                        <div key={index} className="flex items-center gap-4 py-2 border-b">
                          <span className="flex-1">{feature}</span>
                          {selectedVehicles.map((vehicle, vIndex) => (
                            vehicle && (
                              <div key={vIndex} className="flex-1 text-center">
                                {vehicle.features.includes(feature) ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                                )}
                              </div>
                            )
                          ))}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA Section */}
        {selectedVehicles.filter(v => v !== null).length > 0 && (
          <div className="mt-8 text-center">
            <Card className="bg-gradient-primary text-white">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Ready to Make a Decision?</h3>
                <p className="mb-6 text-white/90">
                  Our team is here to help you choose the perfect vehicle for your needs
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href="/contact">
                    <Button size="lg" variant="secondary" className="bg-white text-[var(--primary-orange)] hover:bg-gray-100">
                      Contact Us
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[var(--primary-orange)]">
                    Schedule Test Drive
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}