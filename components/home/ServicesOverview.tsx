'use client';

import { Car, Calculator, RefreshCw, Shield } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ServicesOverview() {
  const { t } = useLanguage();

  const services = [
    {
      icon: Car,
      title: t('services.vehicleSales.title'),
      description: t('services.vehicleSales.desc'),
      features: [
        t('services.vehicleSales.feature1'),
        t('services.vehicleSales.feature2'),
        t('services.vehicleSales.feature3')
      ]
    },
    {
      icon: Calculator,
      title: t('services.financing.title'),
      description: t('services.financing.desc'),
      features: [
        t('services.financing.feature1'),
        t('services.financing.feature2'),
        t('services.financing.feature3')
      ]
    },
    {
      icon: RefreshCw,
      title: t('services.tradeIn.title'),
      description: t('services.tradeIn.desc'),
      features: [
        t('services.tradeIn.feature1'),
        t('services.tradeIn.feature2'),
        t('services.tradeIn.feature3')
      ]
    },
    {
      icon: Shield,
      title: t('services.insurance.title'),
      description: t('services.insurance.desc'),
      features: [
        t('services.insurance.feature1'),
        t('services.insurance.feature2'),
        t('services.insurance.feature3')
      ]
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            {t('services.title')} <span className="text-[var(--primary-orange)]">{t('services.our')}</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('services.subtitle')}
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
              {t('services.learnMore')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}