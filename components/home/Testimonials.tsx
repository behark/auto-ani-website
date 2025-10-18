'use client';

import { Star } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Testimonials() {
  const { t } = useLanguage();

  const testimonials = [
    {
      name: 'Arben Gashi',
      location: 'Pristina',
      rating: 5,
      text: t('testimonials.review1')
    },
    {
      name: 'Leonora Zeka',
      location: 'Mitrovica',
      rating: 5,
      text: t('testimonials.review2')
    },
    {
      name: 'Driton Krasniqi',
      location: 'Peja',
      rating: 5,
      text: t('testimonials.review3')
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            {t('testimonials.title')} <span className="text-[var(--primary-orange)]">{t('testimonials.customers')}</span> {t('testimonials.our')}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-gray-700 mb-4 italic">
                  "{testimonial.text}"
                </p>

                {/* Customer Info */}
                <div className="border-t pt-4">
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.location}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-[var(--primary-orange)]">4.9/5</div>
              <div className="text-gray-600">{t('testimonials.avgRating')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[var(--primary-orange)]">500+</div>
              <div className="text-gray-600">{t('testimonials.googleReviews')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[var(--primary-orange)]">98%</div>
              <div className="text-gray-600">{t('testimonials.satisfaction')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}