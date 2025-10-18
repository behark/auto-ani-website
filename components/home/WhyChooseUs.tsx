'use client';

import { Users, Award, Clock, Shield } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export default function WhyChooseUs() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Users,
      title: t('whyUs.customers'),
      description: t('whyUs.customersDesc')
    },
    {
      icon: Award,
      title: t('whyUs.experience'),
      description: t('whyUs.experienceDesc')
    },
    {
      icon: Clock,
      title: t('whyUs.quickProcessing'),
      description: t('whyUs.quickProcessingDesc')
    },
    {
      icon: Shield,
      title: t('whyUs.quality'),
      description: t('whyUs.qualityDesc')
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            {t('whyUs.title')} <span className="text-[var(--primary-orange)]">AUTO ANI</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('whyUs.subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow bg-white">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-[var(--primary-orange)]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}