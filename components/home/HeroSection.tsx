'use client';

import { Car, Users, Award, MapPin } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            AUTO <span className="text-[var(--primary-orange)]">ANI</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300">
            {t('hero.tagline')}
          </p>
          <p className="text-lg mb-12 text-gray-400 max-w-2xl mx-auto">
            {t('hero.description')}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/vehicles">
              <Button size="lg" className="bg-[var(--primary-orange)] hover:bg-orange-600 text-white px-8 py-3">
                <Car className="w-5 h-5 mr-2" />
                {t('cta.viewInventory')}
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black px-8 py-3">
                {t('cta.contactUs')}
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-[var(--primary-orange)]" />
              </div>
              <div className="text-3xl font-bold text-white">2500+</div>
              <div className="text-gray-400">{t('stats.satisfiedCustomers')}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-[var(--primary-orange)]" />
              </div>
              <div className="text-3xl font-bold text-white">9+</div>
              <div className="text-gray-400">{t('stats.yearsExperience')}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-[var(--primary-orange)]" />
              </div>
              <div className="text-3xl font-bold text-white">{t('location.city')}</div>
              <div className="text-gray-400">{t('location.country')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
