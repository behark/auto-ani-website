'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Car, Calculator, CheckCircle, Euro, Clock, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TradeInPage() {
  const { t } = useLanguage();

  const tradeInSteps = [
    {
      step: 1,
      title: 'Vlerësimi i Veturës',
      description: 'Sillni veturën tuaj për një vlerësim profesional',
      icon: Car
    },
    {
      step: 2,
      title: 'Vlerësimi i Çmimit',
      description: 'Merrni vlerësimin e drejtë të tregut menjëherë',
      icon: Calculator
    },
    {
      step: 3,
      title: 'Krediti i Shkëmbimit',
      description: 'Aplikoni kredin për blerjen e veturës tuaj të re',
      icon: Euro
    }
  ];

  const tradeInBenefits = [
    'Vlerësimi i drejtë i tregut',
    'Promocioni Bonus Shkëmbimi €1000',
    'Procesi i menjëhershëm i vlerësimit',
    'Nuk kërkohet pazarllëk',
    'Inspektimi profesional',
    'Të gjitha dokumentet trajtohen',
    'Krediti aplikohet menjëherë',
    'Përfitimet tatimore'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 pt-20">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {t('services.tradeIn')}
          </h1>
          <p className="text-gray-700 max-w-2xl mx-auto font-medium">
            Merrni vlerën e drejtë të tregut për veturën tuaj aktuale me shërbimin tonë profesional të shkëmbimit
          </p>
        </div>

        {/* Special Promotion */}
        <div className="bg-gradient-to-r from-[var(--primary-orange)] to-[var(--accent-yellow)] rounded-lg p-8 text-white text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Promocioni Special i Shkëmbimit</h2>
          <p className="text-xl mb-4">{t('promotions.tradeInBonus')}</p>
          <p className="text-white/90">
            Ofertë me kohë të kufizuar - Merrni bonus €1000 kur shkëmbeni veturën tuaj për një blerje të re
          </p>
        </div>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Si Funksionon Shkëmbimi</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {tradeInSteps.map((step) => {
              const Icon = step.icon;
              return (
                <Card key={step.step} className="text-center">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-[var(--primary-orange)]" />
                    </div>
                    <div className="w-8 h-8 bg-[var(--primary-orange)] rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Përfitimet e Shkëmbimit</h2>
              <div className="space-y-3">
                {tradeInBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-800 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Vlerësimi i Shpejtë i Shkëmbimit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="h-8 w-8 text-[var(--primary-orange)] mx-auto mb-2" />
                    <div className="font-semibold">Procesi i Shpejtë</div>
                    <div className="text-sm text-gray-600">Vlerësim 15 minutësh</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Shield className="h-8 w-8 text-[var(--primary-orange)] mx-auto mb-2" />
                    <div className="font-semibold">Vlerësim i Drejtë</div>
                    <div className="text-sm text-gray-600">Çmimi bazuar në treg</div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Na kontaktoni për të planifikuar vlerësimin e veturës tuaj
                  </p>
                  <Link href="/contact">
                    <Button className="w-full bg-[var(--primary-orange)] hover:bg-orange-600">
                      Planifikoni Vlerësimin
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* What We Accept */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-center">Cilat Vetura Pranojmë</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <h4 className="font-semibold mb-2">Markat Premium</h4>
                <p className="text-sm text-gray-600">BMW, Mercedes, Audi, Porsche</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Markat Popullore</h4>
                <p className="text-sm text-gray-600">VW, Toyota, Honda, Ford</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Diapazoni i Moshës</h4>
                <p className="text-sm text-gray-600">2010 ose më të reja të preferuara</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Gjendja</h4>
                <p className="text-sm text-gray-600">Gjendje e mirë deri e shkëlqyer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-4">Gati të Shkëmbeni Veturën Tuaj?</h3>
          <p className="text-gray-600 mb-6">
            Filloni me një vlerësim falas dhe shikoni sa vlen vetura juaj
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-[var(--primary-orange)] hover:bg-orange-600">
                Planifikoni Vlerësimin
              </Button>
            </Link>
            <Link href="/vehicles">
              <Button size="lg" variant="outline">
                Shikoni Inventarin Tonë
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}