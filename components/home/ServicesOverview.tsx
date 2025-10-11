'use client';

import { Car, Calculator, Wrench, Shield, RefreshCw, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';


export default function ServicesOverview() {
  const { t } = useLanguage();

  const servicesData = [
    {
      id: '1',
      title: t('services.sales'),
      description: t('services.salesDesc'),
      icon: Car,
      features: [
        t('services.qualityCertified') || 'Cilësi e çertifikuar',
        t('services.competitivePricing') || 'Çmime konkurruese',
        t('services.fullServiceHistory') || 'Historiku i plotë i shërbimit'
      ]
    },
    {
      id: '2',
      title: t('services.financing'),
      description: t('services.financingDesc'),
      icon: Calculator,
      features: [
        t('promotions.financing'),
        t('services.quickApproval') || 'Aprovim i shpejtë',
        t('services.flexibleTerms') || 'Kushte fleksibile'
      ]
    },
    {
      id: '3',
      title: t('services.tradeIn'),
      description: t('services.tradeInDesc'),
      icon: RefreshCw,
      features: [
        t('services.fairValuation') || 'Vlerësim i drejtë',
        t('promotions.tradeInBonus'),
        t('services.instantEval') || 'Vlerësim i menjehërshem'
      ]
    },
    {
      id: '4',
      title: t('services.import'),
      description: t('services.importDesc'),
      icon: Truck,
      features: [
        t('services.euSourcing') || 'Burime nga BE',
        t('services.docHandling') || 'Përpunimi i dokumenteve',
        t('services.transportArranged') || 'Transporti i rregulluar'
      ]
    },
    {
      id: '5',
      title: t('services.insurance'),
      description: t('services.insuranceDesc'),
      icon: Shield,
      features: [
        t('services.insurancePartners') || 'Partnerë sigurimi',
        t('services.registrationHelp') || 'Ndihmë me regjistrimin',
        t('services.bestRates') || 'Normat më të mira'
      ]
    },
    {
      id: '6',
      title: t('services.afterSales'),
      description: t('services.afterSalesDesc'),
      icon: Wrench,
      features: [
        t('services.extendedWarranty') || 'Garanci e zgjatur',
        t('services.maintenancePack') || 'Paketa mirëmbajtjeje',
        t('services.genuineParts') || 'Pjesë origjinale'
      ]
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            {t('services.title')}
          </h2>
          <p className="text-foreground/80 max-w-2xl mx-auto">
            {t('services.subtitle')}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesData.slice(0, 6).map((service) => {
            const Icon = service.icon;
            return (
              <Card
                key={service.id}
                className="text-center shadow-card-hover group cursor-pointer bg-white border-gray-200 hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-6">
                  {/* Icon */}
                  <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-500 transition-colors">
                    <Icon className="h-10 w-10 text-orange-500 group-hover:text-white transition-colors" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold mb-3 text-foreground">{service.title}</h3>

                  {/* Description */}
                  <p className="text-foreground/90 mb-4 font-medium">{service.description}</p>

                  {/* Features */}
                  <ul className="text-sm text-foreground/85 space-y-1 mb-4 font-medium">
                    {service.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Learn More Link */}
                  <Link
                    href="/services"
                    className="text-orange-600 dark:text-orange-400 font-medium hover:underline inline-flex items-center gap-1 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                  >
                    {t('cta.learnMore')}
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}