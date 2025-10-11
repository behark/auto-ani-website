'use client';

import { CheckCircle, Users, Award, Clock, ThumbsUp, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { imageLoader } from '@/lib/imageLoader';


export default function WhyChooseUs() {
  const { t } = useLanguage();

  const reasons = [
    {
      icon: Award,
      title: t('whyChooseUs.yearsExcellence'),
      description: t('whyChooseUs.yearsExcellenceDesc')
    },
    {
      icon: Users,
      title: t('whyChooseUs.vehiclesSold'),
      description: t('whyChooseUs.vehiclesSoldDesc')
    },
    {
      icon: CheckCircle,
      title: t('whyChooseUs.qualityCertified'),
      description: t('whyChooseUs.qualityCertifiedDesc')
    },
    {
      icon: Clock,
      title: t('whyChooseUs.quickProcessing'),
      description: t('whyChooseUs.quickProcessingDesc')
    },
    {
      icon: ThumbsUp,
      title: t('whyChooseUs.bestPrice'),
      description: t('whyChooseUs.bestPriceDesc')
    },
    {
      icon: Headphones,
      title: t('whyChooseUs.quickResponse'),
      description: t('whyChooseUs.quickResponseDesc')
    }
  ];

  const stats = [
    { number: '2500+', label: t('footer.vehiclesSold') },
    { number: '9+', label: t('whyChooseUs.yearsExperience') },
    { number: '4.8★', label: t('whyChooseUs.googleRating') },
    { number: '156', label: t('whyChooseUs.reviews') }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            {t('whyChooseUs.title')} <span className="text-[var(--primary-orange)]">AUTO ANI</span>
          </h2>
          <p className="text-gray-700 max-w-2xl mx-auto font-medium">
            {t('whyChooseUs.subtitle')}
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left Column - Image and Stats */}
          <div className="relative">
            <div className="aspect-video rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/images/auto-ani-showroom.jpg"
                alt="AUTO ANI Premium Showroom in Pristina"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loader={process.env.NODE_ENV === 'production' ? imageLoader : undefined}
              />
            </div>
            {/* Stats Overlay */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md">
              <div className="bg-white rounded-lg shadow-xl p-4">
                <div className="grid grid-cols-4 divide-x">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center px-2">
                      <div className="text-2xl font-bold text-[var(--primary-orange)]">{stat.number}</div>
                      <div className="text-xs text-gray-700 font-semibold">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Reasons */}
          <div className="lg:pl-8 mt-12 lg:mt-0">
            <div className="grid gap-6">
              {reasons.map((reason, index) => {
                const Icon = reason.icon;
                return (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center">
                        <Icon className="h-6 w-6 text-[var(--primary-orange)]" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 text-gray-900">{reason.title}</h3>
                      <p className="text-gray-700 text-sm font-medium">{reason.description}</p>
                    </div>
                  </div>
                );
              })}
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
            <Link href="/vehicles">
              <Button size="lg" variant="secondary" className="bg-white text-[var(--primary-orange)] hover:bg-gray-100">
                {t('whyChooseUs.browseInventory')}
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[var(--primary-orange)]">
                {t('cta.contactUs')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}