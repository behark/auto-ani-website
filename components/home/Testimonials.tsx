'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Testimonials() {
  const { t } = useLanguage();

  const testimonials = [
    {
      id: 1,
      customer: "Arben M.",
      rating: 5,
      date: "2024-01-10",
      comment: "Shërbim i shkëlqyer! Ekip profesional dhe zgjedhje e madhe e automjeteve. E rekomandoj fuqishëm!",
      vehicle: "BMW X5"
    },
    {
      id: 2,
      customer: "Valentina K.",
      rating: 5,
      date: "2024-01-05",
      comment: "Përvoja më e mirë e blerjes së automjetit. Çmime transparente dhe staf i dobishm.",
      vehicle: "Mercedes E-Class"
    },
    {
      id: 3,
      customer: "Fatos B.",
      rating: 5,
      date: "2023-12-20",
      comment: "Bleva BMW-në time këtu. Gjendje e shkëlqyer dhe çmim i drejtë. Do të kthehem përsëri!",
      vehicle: "BMW 3 Series"
    }
  ];
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('testimonials.title')} <span className="text-[var(--primary-orange)]">{t('testimonials.customersTitle')}</span>
          </h2>
          <p className="text-gray-700 max-w-2xl mx-auto font-medium">
            {t('testimonials.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="relative overflow-hidden">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-[var(--primary-orange)]/20 absolute top-4 right-4" />
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[var(--primary-orange)] text-[var(--primary-orange)]" />
                  ))}
                </div>
                <p className="text-gray-800 mb-4 italic font-medium">&ldquo;{testimonial.comment}&rdquo;</p>
                <div className="border-t pt-4">
                  <p className="font-semibold text-gray-900">{testimonial.customer}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-700 font-medium">{t('testimonials.purchased')}: {testimonial.vehicle}</p>
                    <p className="text-xs text-gray-600 font-semibold">{testimonial.date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-lg shadow-md">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-[var(--primary-orange)] text-[var(--primary-orange)]" />
              ))}
            </div>
            <span className="font-bold text-2xl">4.8</span>
            <span className="text-gray-700 font-medium">{t('testimonials.from')} 156 {t('testimonials.googleReviews')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}