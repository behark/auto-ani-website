'use client';

import { Car, Calculator, CheckCircle, Euro, Clock, Shield } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TradeInPage() {
  const { t } = useLanguage();

  const tradeInSteps = [
    {
      step: 1,
      title: t('trade.steps.step1.title'),
      description: t('trade.steps.step1.description'),
      icon: Car
    },
    {
      step: 2,
      title: t('trade.steps.step2.title'),
      description: t('trade.steps.step2.description'),
      icon: Calculator
    },
    {
      step: 3,
      title: t('trade.steps.step3.title'),
      description: t('trade.steps.step3.description'),
      icon: Euro
    }
  ];

  const tradeInBenefits = [
    t('trade.benefits.fairValue'),
    t('trade.benefits.bonusPromo'),
    t('trade.benefits.instantEval'),
    t('trade.benefits.noHaggling'),
    t('trade.benefits.proInspection'),
    t('trade.benefits.docsHandled'),
    t('trade.benefits.instantCredit'),
    t('trade.benefits.taxBenefits')
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 pt-20">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {t('trade.title')}
          </h1>
          <p className="text-gray-700 max-w-2xl mx-auto font-medium">
            {t('trade.subtitle')}
          </p>
        </div>

        {/* Special Promotion */}
        <div className="bg-gradient-to-r from-[var(--primary-orange)] to-[var(--accent-yellow)] rounded-lg p-8 text-white text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t('trade.specialPromotion')}</h2>
          <p className="text-xl mb-4">{t('promotions.tradeInBonus')}</p>
          <p className="text-white/90">
            {t('trade.limitedOffer')}
          </p>
        </div>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">{t('trade.howItWorks')}</h2>
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
              <h2 className="text-3xl font-bold mb-6">{t('trade.benefitsTitle')}</h2>
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
                <CardTitle className="text-center">{t('trade.quickAssessment')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="h-8 w-8 text-[var(--primary-orange)] mx-auto mb-2" />
                    <div className="font-semibold">{t('trade.fastProcess')}</div>
                    <div className="text-sm text-gray-600">{t('trade.fifteenMinutes')}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Shield className="h-8 w-8 text-[var(--primary-orange)] mx-auto mb-2" />
                    <div className="font-semibold">{t('trade.fairAssessment')}</div>
                    <div className="text-sm text-gray-600">{t('trade.marketBased')}</div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    {t('trade.scheduleText')}
                  </p>
                  <Link href="/contact">
                    <Button className="w-full bg-[var(--primary-orange)] hover:bg-orange-600">
                      {t('trade.scheduleAssessment')}
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
            <CardTitle className="text-center">{t('trade.whatWeAccept')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <h4 className="font-semibold mb-2">{t('trade.premiumBrands')}</h4>
                <p className="text-sm text-gray-600">{t('trade.premiumBrandsList')}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t('trade.popularBrands')}</h4>
                <p className="text-sm text-gray-600">{t('trade.popularBrandsList')}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t('trade.ageRange')}</h4>
                <p className="text-sm text-gray-600">{t('trade.ageRangeText')}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t('trade.condition')}</h4>
                <p className="text-sm text-gray-600">{t('trade.conditionText')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-4">{t('trade.readyToTrade')}</h3>
          <p className="text-gray-600 mb-6">
            {t('trade.startWithFree')}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-[var(--primary-orange)] hover:bg-orange-600">
                {t('trade.scheduleAssessment')}
              </Button>
            </Link>
            <Link href="/vehicles">
              <Button size="lg" variant="outline">
                {t('trade.viewInventory')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}