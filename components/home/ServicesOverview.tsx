'use client';

import { Car, Calculator, RefreshCw, Shield } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ServicesOverview() {
  const services = [
    {
      icon: Car,
      title: 'Shitja e Veturave',
      description: 'Vetura të përdorura me cilësi premium me histori të plotë shërbimi',
      features: ['Cilësi e Certifikuar', 'Çmime Konkurruese', 'Histori e Plotë Shërbimi']
    },
    {
      icon: Calculator,
      title: 'Zgjidhje Financimi',
      description: 'Opsione fleksibël financimi me norma konkurruese',
      features: ['Financim 0% i Disponueshëm', 'Miratim i Shpejtë', 'Kushte Fleksibël']
    },
    {
      icon: RefreshCw,
      title: 'Shërbimi i Shkëmbimit',
      description: 'Merrni vlerën më të mirë për veturën tuaj aktuale',
      features: ['Vlerësim i Drejtë', 'Bonus Shkëmbimi €1000', 'Vlerësim i Menjëhershëm']
    },
    {
      icon: Shield,
      title: 'Sigurimi & Regjistrimi',
      description: 'Ndihmë e plotë për sigurim dhe regjistrim',
      features: ['Partnerë Sigurimesh', 'Ndihmë Regjistrimi', 'Normat më të Mira']
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Shërbimet <span className="text-[var(--primary-orange)]">Tona</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Zgjidhje të plota automobilistike për të gjitha nevojat tuaja të veturave
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-[var(--primary-orange)]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    {service.features.map((feature, idx) => (
                      <li key={idx}>• {feature}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/services">
            <Button size="lg" className="bg-[var(--primary-orange)] hover:bg-orange-600 text-white">
              Mësoni Më Shumë Për Shërbimet Tona
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}