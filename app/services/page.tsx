'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Car, Calculator, Wrench, Shield, CheckCircle, Clock, Users, Award, RefreshCw, Truck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const iconMap: { [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>> } = {
  car: Car,
  calculator: Calculator,
  wrench: Wrench,
  shield: Shield,
  'refresh-cw': RefreshCw,
  truck: Truck
};

export default function ServicesPage() {
  const { t } = useLanguage();

  const servicesData = [
    {
      id: '1',
      title: t('services.sales'),
      description: t('services.salesDesc'),
      icon: 'car',
      features: [
        t('services.qualityCertified'),
        t('services.competitivePricing'),
        t('services.fullServiceHistory'),
        t('services.extendedWarranty')
      ]
    },
    {
      id: '2',
      title: t('services.financing'),
      description: t('services.financingDesc'),
      icon: 'calculator',
      features: [
        t('promotions.financing'),
        t('services.quickApproval'),
        t('services.flexibleTerms'),
        t('services.bestRates')
      ]
    },
    {
      id: '3',
      title: t('services.tradeIn'),
      description: t('services.tradeInDesc'),
      icon: 'refresh-cw',
      features: [
        t('services.fairValuation'),
        t('promotions.tradeInBonus'),
        t('services.instantEval'),
        t('services.quickProcessing')
      ]
    },
    {
      id: '4',
      title: t('services.import'),
      description: t('services.importDesc'),
      icon: 'truck',
      features: [
        t('services.euSourcing'),
        t('services.docHandling'),
        t('services.transportArranged'),
        t('services.bestRates')
      ]
    },
    {
      id: '5',
      title: t('services.insurance'),
      description: t('services.insuranceDesc'),
      icon: 'shield',
      features: [
        t('services.insurancePartners'),
        t('services.registrationHelp'),
        t('services.bestRates'),
        t('services.quickApproval')
      ]
    },
    {
      id: '6',
      title: t('services.afterSales'),
      description: t('services.afterSalesDesc'),
      icon: 'wrench',
      features: [
        t('services.extendedWarranty'),
        t('services.maintenancePack'),
        t('services.genuineParts'),
        t('services.qualityCertified')
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {t('services.title')}
          </h1>
          <p className="text-gray-700 max-w-2xl mx-auto font-medium">
            {t('services.subtitle')}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {servicesData.map((service) => {
            const Icon = iconMap[service.icon];
            return (
              <Card key={service.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[var(--primary-orange)] to-[var(--accent-yellow)] text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl">{service.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-700 mb-6 font-medium">{service.description}</p>
                  <div className="space-y-3">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-800 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/contact">
                    <Button className="mt-6 w-full bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]">
                      {t('cta.learnMore')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Why Our Services */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            {t('whyChooseUs.title')} <span className="text-[var(--primary-orange)]">{t('services.title')}</span>
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-[var(--primary-orange)]" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-900">{t('services.qualityCertified')}</h3>
              <p className="text-sm text-gray-700 font-medium">{t('services.qualityCertifiedDesc') || 'Our team consists of certified professionals with years of experience'}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-[var(--primary-orange)]" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-900">{t('whyChooseUs.quickProcessing')}</h3>
              <p className="text-sm text-gray-700 font-medium">{t('whyChooseUs.quickProcessingDesc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-[var(--primary-orange)]" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-900">{t('services.extendedWarranty')}</h3>
              <p className="text-sm text-gray-700 font-medium">{t('services.afterSalesDesc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-[var(--primary-orange)]" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-900">{t('footer.satisfiedCustomers')}</h3>
              <p className="text-sm text-gray-700 font-medium">{t('whyChooseUs.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-primary rounded-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">{t('whyChooseUs.readyToFind')}</h3>
          <p className="mb-6 text-white/90">
            {t('whyChooseUs.contactPersonalized')}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" variant="secondary" className="bg-white text-[var(--primary-orange)] hover:bg-gray-100">
                {t('cta.contactUs')}
              </Button>
            </Link>
            <Link href="/vehicles">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[var(--primary-orange)]">
                {t('cta.viewInventory')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}