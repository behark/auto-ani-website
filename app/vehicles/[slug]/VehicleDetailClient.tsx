'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import FinancingCalculator from '@/components/finance/FinancingCalculator';
import TouchGallery from '@/components/ui/TouchGallery';
import AppointmentScheduler from '@/components/ecommerce/AppointmentScheduler';
import {
  Calendar,
  Navigation,
  Fuel,
  Settings,
  Car,
  Users,
  Gauge,
  Phone,
  Mail,
  Share2,
  Heart,
  Printer,
  Shield,
  CheckCircle
} from 'lucide-react';
import VehicleImageWithFallback from '@/components/vehicles/VehicleImageWithFallback';
import toast from 'react-hot-toast';
// Import Vehicle type from Prisma client
import type { Vehicle as PrismaVehicle } from '@prisma/client';

// Extended Vehicle type to match our application needs
type Vehicle = PrismaVehicle & {
  // Additional runtime properties
  createdAt: Date | string;
  updatedAt: Date | string;
};

interface VehicleDetailClientProps {
  vehicle: Vehicle & {
    images: string | string[];
    features: string | string[];
  };
}

function formatPrice(price: number): string {
  return `€${price.toLocaleString('de-DE')}`;
}

export default function VehicleDetailClient({ vehicle }: VehicleDetailClientProps) {
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  // Parse JSON fields if they're strings
  const images = typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images;
  const features = typeof vehicle.features === 'string' ? JSON.parse(vehicle.features) : vehicle.features;

  const handleAppointmentSuccess = () => {
    toast.success('Your appointment has been scheduled successfully!');
    setIsAppointmentModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-400">
            <li>
              <Link href="/" className="hover:text-[var(--primary-orange)]">
                Ballina
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/vehicles" className="hover:text-[var(--primary-orange)]">
                Vetura
              </Link>
            </li>
            <li>/</li>
            <li className="text-white">
              {vehicle.make} {vehicle.model}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <Card className="bg-gray-900/50 border-gray-800 shadow-xl">
              <CardContent className="p-0">
                <div className="relative">
                  {vehicle.status !== 'AVAILABLE' && (
                    <div className="absolute top-4 left-4 z-10">
                      <Badge className="bg-red-600 text-white">
                        {vehicle.status === 'SOLD' ? 'SHITUR' : 'REZERVUAR'}
                      </Badge>
                    </div>
                  )}
                  {vehicle.featured && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-[var(--primary-orange)]">REKOMANDUAR</Badge>
                    </div>
                  )}
                  <TouchGallery images={images} alt={`${vehicle.make} ${vehicle.model}`} />
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Description */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-[var(--primary-orange)]">Përshkrimi</h2>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {vehicle.description}
                </p>
              </CardContent>
            </Card>

            {/* Features */}
            {features && features.length > 0 && (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-[var(--primary-orange)]">Veçoritë</h2>
                  <ul className="grid grid-cols-2 gap-3">
                    {features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center gap-2 text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Specifications */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-[var(--primary-orange)]">Specifikat</h2>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Viti: {vehicle.year}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    <span>Kilometrazha: {vehicle.mileage.toLocaleString()} km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4" />
                    <span>Karburant: {vehicle.fuelType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Transmisioni: {vehicle.transmission}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    <span>Motori: {vehicle.engineSize}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <span>Tipi: {vehicle.bodyType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Ulëse: {vehicle.seats || 5}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <span>Dyer: {vehicle.doors || 5}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <span>Tërheqje: {vehicle.drivetrain}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <span>Ngjyra: {vehicle.color}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Price and Actions */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card className="sticky top-24 bg-gradient-to-br from-gray-900 to-gray-950 border-[var(--primary-orange)]/20 shadow-xl">
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-2 text-white">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>
                <p className="text-3xl font-bold text-[var(--primary-orange)] mb-4">
                  {formatPrice(vehicle.price)}
                </p>

                <div className="space-y-3 mb-6">
                  <Button className="w-full bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]" size="lg">
                    <Phone className="mr-2 h-4 w-4" />
                    Kontakto Shitësin
                  </Button>
                  <Button variant="outline" className="w-full border-gray-700 text-white hover:bg-gray-800" size="lg">
                    <Mail className="mr-2 h-4 w-4" />
                    Dërgo Pyetje
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-gray-700 text-white hover:bg-gray-800"
                    size="lg"
                    onClick={() => setIsAppointmentModalOpen(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Planifiko Test Drive
                  </Button>
                </div>

                <Separator className="my-4 bg-gray-700" />

                <div className="flex justify-around">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <Heart className="h-4 w-4 mr-1" />
                    Ruaj
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <Share2 className="h-4 w-4 mr-1" />
                    Ndaj
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <Printer className="h-4 w-4 mr-1" />
                    Printo
                  </Button>
                </div>

                <Separator className="my-4 bg-gray-700" />

                {/* Warranty Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Certifikuar & Verifikuar</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Garanci e Mundshme</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Pranohet Trade-In</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dealer Info */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 text-white">AUTO ANI</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>Gazmend Baliu, Mitrovicë, Kosovë</p>
                  <p>Hënë-Premte: 09:00 - 19:00</p>
                  <p>E Shtunë: 09:00 - 17:00</p>
                  <div className="pt-3">
                    <Link href="/contact" className="text-[var(--primary-orange)] hover:underline">
                      Shiko Lokacionin →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financing Calculator */}
            <FinancingCalculator
              vehiclePrice={vehicle.price}
              vehicleMake={vehicle.make}
              vehicleModel={vehicle.model}
            />
          </div>
        </div>

        {/* Additional Info */}
        <Card className="bg-gray-900/50 border-gray-800 mt-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--primary-orange)]">Informata Shtesë</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300">
              <div>
                <h3 className="font-semibold text-white mb-2">Siguria</h3>
                <ul className="space-y-1">
                  <li>• ABS & ESP</li>
                  <li>• Airbag të shumtë</li>
                  <li>• Sistemi i frenimit emergjent</li>
                  <li>• Kamera e pasme</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Komoditeti</h3>
                <ul className="space-y-1">
                  <li>• Klimatizim automatik</li>
                  <li>• Ulëse me ngrohje</li>
                  <li>• Sistem navigimi</li>
                  <li>• Bluetooth & USB</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Performanca</h3>
                <ul className="space-y-1">
                  <li>• Konsum i ulët karburanti</li>
                  <li>• Motor efikas</li>
                  <li>• Transmision i shpejtë</li>
                  <li>• Kontroll stabiliteti</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Scheduler Modal */}
      <AppointmentScheduler
        vehicle={{
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          price: vehicle.price,
          mileage: vehicle.mileage,
          fuelType: vehicle.fuelType as any,
          transmission: vehicle.transmission as any,
          bodyType: vehicle.bodyType as any,
          color: vehicle.color,
          engineSize: vehicle.engineSize,
          drivetrain: vehicle.drivetrain as any,
          features: features,
          images: images,
          description: vehicle.description,
          status: vehicle.status as any,
          featured: vehicle.featured,
          vin: vehicle.vin || '',
          doors: vehicle.doors || 5,
          seats: vehicle.seats || 5,
        }}
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSuccess={handleAppointmentSuccess}
      />
    </div>
  );
}