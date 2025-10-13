'use client';

import {
  Car,
  ArrowLeft,
  Calendar,
  Gauge,
  Fuel,
  Settings,
  Phone,
  MessageCircle,
  Star,
  Shield,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


interface VehicleDetail {
  _id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  specifications: {
    fuelType: string;
    transmission?: string;
    engine?: string;
    color?: string;
    doors?: number;
  };
  features: string[];
  description: string;
  condition: string;
  slug: { current: string };
  featured: boolean;
}

export default function VehicleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simplified logic to avoid compilation issues
    const mockVehicles: Record<string, VehicleDetail> = {
      'bmw-x5-2021': {
        _id: '1',
        brand: 'BMW',
        model: 'X5',
        year: 2021,
        price: 42500,
        mileage: 35000,
        specifications: {
          fuelType: 'Benzinë',
          transmission: 'Automatik',
          engine: '3.0L Turbo',
          color: 'E Zezë',
          doors: 5
        },
        features: [
          'Sistem Navigimi',
          'Ulëse të Ngrohta',
          'Drita LED',
          'Sistem Parkimi',
          'Kamera Prapa',
          'Bluetooth',
          'Klima Automatike',
          'Rrota Aliazhi'
        ],
        description: 'BMW X5 në gjendje të shkëlqyer. Vetura ka qenë e mirëmbajtur rregullisht dhe ka histori të plotë shërbimi. Ideal për familje të mëdha që kërkojnë luksozë dhe performancë.',
        condition: 'E Shkëlqyer',
        slug: { current: 'bmw-x5-2021' },
        featured: true
      },
      'mercedes-c-class-2020': {
        _id: '2',
        brand: 'Mercedes-Benz',
        model: 'C-Class',
        year: 2020,
        price: 38900,
        mileage: 28000,
        specifications: {
          fuelType: 'Dizell',
          transmission: 'Automatik',
          engine: '2.0L CDI',
          color: 'E Bardhë',
          doors: 4
        },
        features: [
          'Sistem Navigimi',
          'Ulëse të Ngrohta',
          'Drita Xenon',
          'Sistem Parkimi',
          'Kamera Prapa',
          'Bluetooth',
          'Klima Automatike',
          'Rrota Aliazhi'
        ],
        description: 'Mercedes-Benz C-Class me dizajn elegant dhe teknologji të avancuar. Vetura është në gjendje të shkëlqyer dhe oferir komfort maksimal.',
        condition: 'Shumë e Mirë',
        slug: { current: 'mercedes-c-class-2020' },
        featured: true
      },
      'audi-a4-2022': {
        _id: '3',
        brand: 'Audi',
        model: 'A4',
        year: 2022,
        price: 35700,
        mileage: 18000,
        specifications: {
          fuelType: 'Benzinë',
          transmission: 'Automatik',
          engine: '2.0L TFSI',
          color: 'E Hirtë',
          doors: 4
        },
        features: [
          'Audi Virtual Cockpit',
          'MMI Navigation',
          'Ulëse të Ngrohta',
          'Drita LED',
          'Sistem Parkimi',
          'Kamera Prapa',
          'Bluetooth',
          'Android Auto/Apple CarPlay'
        ],
        description: 'Audi A4 model i ri me teknologji të fundit. Vetura është pothuajse e re dhe ka përdorim minimal.',
        condition: 'Si e Re',
        slug: { current: 'audi-a4-2022' },
        featured: true
      },
      'vw-golf-2021': {
        _id: '4',
        brand: 'Volkswagen',
        model: 'Golf',
        year: 2021,
        price: 23500,
        mileage: 25000,
        specifications: {
          fuelType: 'Benzinë',
          transmission: 'Manual',
          engine: '1.5L TSI',
          color: 'E Kuqe',
          doors: 5
        },
        features: [
          'Sistem Infotainment',
          'Klima Automatike',
          'Drita LED',
          'Bluetooth',
          'USB/AUX',
          'Rrota Aliazhi',
          'Sistem Sigurimi'
        ],
        description: 'Volkswagen Golf i ri me cilësi të lartë dhe efikasitet të shkëlqyer të karburantit. Perfekt për përdorim urban.',
        condition: 'E Shkëlqyer',
        slug: { current: 'vw-golf-2021' },
        featured: true
      },
      'toyota-rav4-2022': {
        _id: '5',
        brand: 'Toyota',
        model: 'RAV4',
        year: 2022,
        price: 31200,
        mileage: 15000,
        specifications: {
          fuelType: 'Hibrid',
          transmission: 'CVT Automatik',
          engine: '2.5L Hibrid',
          color: 'E Hirtë',
          doors: 5
        },
        features: [
          'Toyota Safety Sense',
          'Sistem Hibrid',
          'AWD',
          'Sistem Navigimi',
          'Kamera Prapa',
          'Wireless Charging',
          'JBL Audio System',
          'Sunroof'
        ],
        description: 'Toyota RAV4 Hibrid me teknologji të avancuar dhe efikasitet të shkëlqyer të karburantit. SUV ideal për çdo përdorim.',
        condition: 'Si e Re',
        slug: { current: 'toyota-rav4-2022' },
        featured: true
      },
      'bmw-320d-2020': {
        _id: '6',
        brand: 'BMW',
        model: '320d',
        year: 2020,
        price: 29800,
        mileage: 42000,
        specifications: {
          fuelType: 'Dizell',
          transmission: 'Automatik',
          engine: '2.0L TwinPower Turbo',
          color: 'E Zezë',
          doors: 4
        },
        features: [
          'BMW iDrive',
          'Sistem Navigimi',
          'Ulëse të Ngrohta',
          'Drita LED',
          'Sistem Parkimi',
          'Bluetooth',
          'Klima Automatike',
          'Sport Mode'
        ],
        description: 'BMW 320d me performancë të shkëlqyer dhe konsum të ulët. Ideal për ata që kërkojnë sportivitet dhe efikasitet.',
        condition: 'E Mirë',
        slug: { current: 'bmw-320d-2020' },
        featured: true
      }
    };

    const foundVehicle = mockVehicles[slug];
    if (foundVehicle) {
      setVehicle(foundVehicle);
    }
    setLoading(false);
  }, [slug]);

  const formatPrice = (price: number) => {
    return `€${price.toLocaleString('de-DE')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vetura Nuk U Gjet</h1>
        <p className="text-gray-600 mb-4">Vetura që kërkoni nuk ekziston ose është hequr.</p>
        <Link href="/vehicles">
          <Button>Kthehu tek Veturat</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/vehicles">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kthehu tek Veturat
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vehicle Image */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <div className="relative h-96 bg-gray-200 rounded-t-lg flex items-center justify-center">
              <Car className="w-32 h-32 text-gray-400" />
              {vehicle.featured && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-orange-500 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    E Zgjedhur
                  </Badge>
                </div>
              )}
              <div className="absolute top-4 right-4">
                <Badge className="bg-green-500 text-white">
                  <Shield className="w-3 h-3 mr-1" />
                  {vehicle.condition}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Vehicle Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Detajet e Veturës</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Viti</p>
                    <p className="font-semibold">{vehicle.year}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Gauge className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Kilometrazhi</p>
                    <p className="font-semibold">{vehicle.mileage.toLocaleString()} km</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Fuel className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Karburanti</p>
                    <p className="font-semibold">{vehicle.specifications.fuelType}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Transmetuesi</p>
                    <p className="font-semibold">{vehicle.specifications.transmission}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Përshkrimi</h3>
                <p className="text-gray-700">{vehicle.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Veçoritë</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {vehicle.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {vehicle.year} {vehicle.brand} {vehicle.model}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {formatPrice(vehicle.price)}
                </div>
                <p className="text-gray-600">Çmimi Final</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngjyra:</span>
                  <span className="font-medium">{vehicle.specifications.color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dyer:</span>
                  <span className="font-medium">{vehicle.specifications.doors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Motori:</span>
                  <span className="font-medium">{vehicle.specifications.engine}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  <Phone className="h-4 w-4 mr-2" />
                  Telefono Tani
                </Button>
                <Button variant="outline" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Financing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financimi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-blue-600">€387/muaj</div>
                <p className="text-sm text-gray-600">Prej (60 muaj, 10% paradhënie)</p>
              </div>
              <Button variant="outline" className="w-full">
                Përllogari Financimin
              </Button>
            </CardContent>
          </Card>

          {/* Trade-in Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shkëmbimi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-xl font-bold text-green-600">+€1,000</div>
                <p className="text-sm text-gray-600">Bonus Shkëmbimi</p>
              </div>
              <Button variant="outline" className="w-full">
                Vlerëso Veturën Time
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}