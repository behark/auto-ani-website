'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search, Car } from 'lucide-react';
import Link from 'next/link';
import { VEHICLE_MAKES, FUEL_TYPES, BODY_TYPES } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useLanguage();

  const heroImages = [
    {
      url: '/images/showroom.jpg',
      titleKey: 'hero.welcome',
      subtitleKey: 'hero.tagline'
    },
    {
      url: '/images/hero-bg.jpg',
      titleKey: 'hero.financing',
      subtitleKey: 'hero.financingSubtitle'
    },
    {
      url: '/images/showroom.jpg',
      titleKey: 'hero.excellence',
      subtitleKey: 'hero.excellenceSubtitle'
    }
  ];

  // Move useEffect before any conditional logic to follow Rules of Hooks
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  // Null check for translation function - after all hooks
  if (!t) {
    console.error('[HeroSection] Translation function not available');
    return null;
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  return (
    <section className="relative h-[80vh] min-h-[600px] overflow-hidden">
      {/* Image Slider */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: image?.url ? `url(${image.url})` : 'none' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in">
            {t(heroImages[currentSlide].titleKey)}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 animate-slide-in-left">
            {t(heroImages[currentSlide].subtitleKey)}
          </p>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 animate-slide-in-right">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t('vehicles.filters')} />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_MAKES.map((make) => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.featured')} />
                </SelectTrigger>
                <SelectContent>
                  {BODY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t('vehicles.price')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-25000">&lt; €25,000</SelectItem>
                  <SelectItem value="25000-50000">€25,000 - €50,000</SelectItem>
                  <SelectItem value="50000-75000">€50,000 - €75,000</SelectItem>
                  <SelectItem value="75000+">&gt; €75,000</SelectItem>
                </SelectContent>
              </Select>

              <Link href="/vehicles" className="block">
                <Button className="w-full bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)] text-white">
                  <Search className="mr-2 h-4 w-4" /> {t('hero.searchPlaceholder')}
                </Button>
              </Link>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <Link href="/vehicles" className="flex items-center gap-2 hover:text-[var(--primary-orange)]">
                <Car className="h-4 w-4" />
                <span>{t('hero.advancedSearch')}</span>
              </Link>
              <span>BMW, Mercedes, Audi, VW, Toyota</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slider Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur p-3 rounded-full hover:bg-white/30 transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur p-3 rounded-full hover:bg-white/30 transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? 'bg-[var(--primary-orange)] w-8' : 'bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}