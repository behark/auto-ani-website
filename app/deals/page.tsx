import { Timer, Tag, Percent, Gift, TrendingUp, Calendar } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import StructuredData from '@/components/seo/StructuredData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { client } from '@/lib/sanity';
import { generatePageSchemas } from '@/lib/seo-schema';

// Fully Static Generation - Pre-render at build time for maximum performance
// Deals and promotions update monthly, no need for ISR revalidation
// Redeploy after updating deals in CMS
export const dynamic = 'force-static';
export const revalidate = false; // Fully static (no revalidation)

export const metadata: Metadata = {
  title: "Ofertat dhe Promovime | AUTO ANI - Zbritje Speciale",
  description: "Ofertat më të mira të muajit në AUTO ANI. Zbritje deri në €2000, financim 0%, bonus shkëmbimi €1000. Shikoni ofertat e kufizuara në kohë.",
  keywords: "oferta makina, promovime vetura, zbritje auto, BLACK FRIDAY auto, oferta speciale, AUTO ANI deals",
  openGraph: {
    title: "Ofertat e Muajit | AUTO ANI",
    description: "Zbritje deri në €2000, financim 0%, bonus shkëmbimi. Oferta të kufizuara në kohë!",
    type: "website",
    url: "https://autosalonani.com/deals",
  },
};

// Mock data for deals - in production this would come from Sanity
const activeDeals = [
  {
    id: 1,
    type: 'flash',
    title: 'BLACK FRIDAY Special',
    description: 'Zbritje deri në €2000 për të gjitha veturat në stok',
    discount: '€2000',
    validUntil: '2024-12-01',
    urgency: 'high',
    featured: true,
    conditions: ['Vlen për veturat në stok', 'Pagesa cash ose financim', 'Nuk kombinohet me oferta tjera'],
  },
  {
    id: 2,
    type: 'financing',
    title: 'Financim 0% Interes',
    description: 'Pa interes për 24 muajt e para për të gjitha veturat e reja',
    discount: '0%',
    validUntil: '2024-12-31',
    urgency: 'medium',
    conditions: ['Participim minimal 20%', 'Vlen për kredi deri në €30,000', 'Aprovim i shpejtë'],
  },
  {
    id: 3,
    type: 'trade-in',
    title: 'Bonus Shkëmbimi €1000',
    description: 'Fitoni €1000 bonus mbi vlerësimin e veturës tuaj',
    discount: '€1000',
    validUntil: '2024-12-15',
    urgency: 'medium',
    conditions: ['Vetura juaj max 10 vjet', 'Vlerësim falas', 'Bonus menjëherë'],
  },
  {
    id: 4,
    type: 'bundle',
    title: 'Paketa Winter Ready',
    description: 'Goma dimri FALAS + Servisim për 2 vjet',
    discount: '€800',
    validUntil: '2024-12-20',
    urgency: 'low',
    conditions: ['Për veturat SUV', 'Goma premium brand', 'Servisim në qendrat partnere'],
  },
];

const upcomingDeals = [
  {
    title: 'Ofertat e Vitit të Ri',
    startDate: '2025-01-01',
    teaser: 'Surpriza të mëdha për fillimin e vitit 2025',
  },
  {
    title: 'Valentine\'s Special',
    startDate: '2025-02-10',
    teaser: 'Oferta romantike për çifte',
  },
];

// Get featured vehicles with deals
async function getFeaturedDealsVehicles() {
  try {
    const query = `*[_type == "vehicle" && featured == true] | order(_createdAt desc) [0...3] {
      _id,
      title,
      slug,
      brand,
      model,
      year,
      price,
      "mainImage": mainImage.asset->url,
      "originalPrice": price + 2000
    }`;

    const vehicles = await client.fetch(query, {}, {
      next: {
        revalidate: 60,
        tags: ['vehicles', 'deals'],
      }
    });

    return vehicles || [];
  } catch (error) {
    console.error('Error fetching deal vehicles:', error);
    return [];
  }
}

export default async function DealsPage() {
  const schemas = generatePageSchemas('deals');
  const dealVehicles = await getFeaturedDealsVehicles();

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  const getDealIcon = (type: string) => {
    switch (type) {
      case 'flash': return <Timer className="w-5 h-5" />;
      case 'financing': return <Percent className="w-5 h-5" />;
      case 'trade-in': return <TrendingUp className="w-5 h-5" />;
      case 'bundle': return <Gift className="w-5 h-5" />;
      default: return <Tag className="w-5 h-5" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <>
      <StructuredData schemas={schemas} />
      <div className="min-h-screen bg-gray-50 pt-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[var(--primary-orange)] to-orange-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4">Ofertat e Muajit</h1>
            <p className="text-xl mb-8 opacity-90">
              Zbritje ekskluzive dhe promovime të kufizuara në kohë
            </p>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold">€2000</div>
                <div className="text-sm opacity-75">Zbritje Maksimale</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">0%</div>
                <div className="text-sm opacity-75">Interes Minimal</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">24h</div>
                <div className="text-sm opacity-75">Aprovim Express</div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Active Deals */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Oferta Aktive</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeDeals.map((deal) => (
                <Card
                  key={deal.id}
                  className={`relative overflow-hidden ${
                    deal.featured ? 'border-2 border-[var(--primary-orange)] shadow-xl' : ''
                  }`}
                >
                  {deal.featured && (
                    <div className="absolute top-0 right-0 bg-[var(--primary-orange)] text-white px-3 py-1 text-sm font-semibold">
                      FEATURED
                    </div>
                  )}

                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`${getUrgencyColor(deal.urgency)} text-white rounded-full p-2`}>
                          {getDealIcon(deal.type)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{deal.title}</h3>
                          <p className="text-gray-600">{deal.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-[var(--primary-orange)]">
                          {deal.discount}
                        </div>
                        <Badge variant="secondary" className="mt-1">
                          <Timer className="w-3 h-3 mr-1" />
                          Deri: {new Date(deal.validUntil).toLocaleDateString('sq-AL')}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-semibold text-gray-700">Kushtet:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {deal.conditions.map((condition, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2">
                      <Link href="/vehicles" className="flex-1">
                        <Button className="w-full bg-[var(--primary-orange)] hover:bg-orange-600">
                          Shiko Veturat
                        </Button>
                      </Link>
                      <Link href="/contact" className="flex-1">
                        <Button variant="outline" className="w-full">
                          Kontaktoni
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Featured Vehicles with Deals */}
          {dealVehicles.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-6">Veturat në Ofertë</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dealVehicles.map((vehicle: { _id: string; slug: { current: string }; mainImage?: string; title: string; originalPrice: number; price: number }) => (
                  <Card key={vehicle._id} className="overflow-hidden group cursor-pointer">
                    <Link href={`/vehicles/${vehicle.slug.current}`}>
                      <div className="relative h-48 bg-gray-200">
                        {vehicle.mainImage && (
                          <Image
                            src={vehicle.mainImage}
                            alt={vehicle.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        <Badge className="absolute top-4 right-4 bg-red-500 text-white">
                          -€2000
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{vehicle.title}</h3>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-gray-500 line-through">
                            {formatPrice(vehicle.originalPrice)}
                          </span>
                          <span className="text-2xl font-bold text-[var(--primary-orange)]">
                            {formatPrice(vehicle.price)}
                          </span>
                        </div>
                        <Button className="w-full" variant="outline">
                          Shiko Detajet
                        </Button>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Countdown Timer for Main Deal */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-8 mb-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">BLACK FRIDAY - Oferta e Kufizuar!</h2>
              <p className="text-xl mb-6">Përfundon në:</p>
              <div className="flex justify-center gap-4">
                {['2', '18', '45', '32'].map((value, index) => (
                  <div key={index} className="bg-white/20 backdrop-blur rounded-lg p-4">
                    <div className="text-3xl font-bold">{value}</div>
                    <div className="text-xs uppercase">
                      {index === 0 ? 'Ditë' : index === 1 ? 'Orë' : index === 2 ? 'Min' : 'Sek'}
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/vehicles">
                <Button size="lg" className="mt-8 bg-white text-red-600 hover:bg-gray-100">
                  Shiko Ofertat Tani
                </Button>
              </Link>
            </div>
          </div>

          {/* Upcoming Deals */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-[var(--primary-orange)]" />
              Ofertat e Ardhshme
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingDeals.map((deal, index) => (
                <Card key={index} className="border-dashed border-2">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{deal.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{deal.teaser}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          Fillon: {new Date(deal.startDate).toLocaleDateString('sq-AL')}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Newsletter Signup */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Mos Humbisni Asnjë Ofertë!</h2>
              <p className="text-gray-700 mb-6">
                Regjistrohuni për të marrë njoftimet e para për ofertat ekskluzive
              </p>
              <div className="max-w-md mx-auto flex gap-2">
                <input
                  type="email"
                  placeholder="Email juaj"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-orange)]"
                />
                <Button className="bg-[var(--primary-orange)] hover:bg-orange-600">
                  Abonohu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}