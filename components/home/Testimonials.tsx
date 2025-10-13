'use client';

import { Star } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Arben Gashi',
      location: 'Pristina',
      rating: 5,
      text: 'Shërbim i shkëlqyer dhe vetura cilësore. Gjeta pikërisht atë që po kërkoja!'
    },
    {
      name: 'Leonora Zeka',
      location: 'Mitrovica',
      rating: 5,
      text: 'Ekip profesional dhe çmime të drejta. E rekomandoj fort AUTO ANI për këdo që kërkon automjet.'
    },
    {
      name: 'Driton Krasniqi',
      location: 'Peja',
      rating: 5,
      text: 'Përvojë e shkëlqyer nga fillimi në fund. Opsionet e financimit e bënë shumë të lehtë.'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Çfarë Thonë <span className="text-[var(--primary-orange)]">Klientët</span> Tanë
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Mos na besoni vetëm ne - dëgjoni nga klientët tanë të kënaqur
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
              <div className="text-gray-600">Vlerësimi Mesatar</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[var(--primary-orange)]">500+</div>
              <div className="text-gray-600">Vlerësime Google</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[var(--primary-orange)]">98%</div>
              <div className="text-gray-600">Kënaqësia e Klientëve</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}