'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Car, Users, Award, MapPin } from 'lucide-react';

export default function HeroSection() {
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
            Auto Salon Premium - 9+ Vite Përsosmërie
          </p>
          <p className="text-lg mb-12 text-gray-400 max-w-2xl mx-auto">
            Mbi 2500 vetura të shitura që nga 2015. Makina të përdorura me cilësi premium me financim 0% në dispozicion.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/vehicles">
              <Button size="lg" className="bg-[var(--primary-orange)] hover:bg-orange-600 text-white px-8 py-3">
                <Car className="w-5 h-5 mr-2" />
                Shiko Inventarin
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black px-8 py-3">
                Na Kontaktoni
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
              <div className="text-gray-400">Klientë të Kënaqur</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-[var(--primary-orange)]" />
              </div>
              <div className="text-3xl font-bold text-white">9+</div>
              <div className="text-gray-400">Vite Përvojë</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-[var(--primary-orange)]" />
              </div>
              <div className="text-3xl font-bold text-white">Mitrovica</div>
              <div className="text-gray-400">Lokacioni Kosovë</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
