'use client';

import { Check, Star, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const financingPlans = [
  {
    name: 'Plani Bazik',
    description: 'Për blerës individual',
    features: [
      'Deri në 60 muaj',
      'Participim 20%',
      'Interes nga 3.9%',
      'Aprovim 48 orë',
      'Dokumentacion standard',
    ],
    recommended: false,
  },
  {
    name: 'Plani Premium',
    description: 'Oferta jonë më popullore',
    features: [
      'Deri në 84 muaj',
      'Participim 10%',
      'Interes 0% (kushte të veçanta)',
      'Aprovim 24 orë',
      'Asistencë personale',
      'Sigurimi i përfshirë',
    ],
    recommended: true,
  },
  {
    name: 'Plani Biznes',
    description: 'Për kompani dhe biznese',
    features: [
      'Deri në 72 muaj',
      'Participim 15%',
      'Interes nga 2.9%',
      'Aprovim express',
      'Benefite tatimore',
      'Leasing operacional',
    ],
    recommended: false,
  },
];

export default function FinancingOptions() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Planet e Financimit</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Zgjidhni planin që përshtatet më mirë me nevojat tuaja
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {financingPlans.map((plan, index) => (
          <Card
            key={index}
            className={`relative ${
              plan.recommended
                ? 'border-[var(--primary-orange)] shadow-xl scale-105'
                : 'border-gray-200'
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-[var(--primary-orange)] text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Më i Kërkuari
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.recommended
                    ? 'bg-[var(--primary-orange)] hover:bg-orange-600'
                    : ''
                }`}
                variant={plan.recommended ? 'default' : 'outline'}
              >
                {plan.recommended && <Zap className="w-4 h-4 mr-2" />}
                Zgjedh Planin
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
        <div className="flex items-start gap-4">
          <div className="bg-blue-500 text-white rounded-full p-2">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Ofertë Speciale për Dhjetor!</h3>
            <p className="text-gray-700">
              Për të gjitha veturat e reja: 0% interes për 12 muajt e para!
              Oferta vlen deri më 31 Dhjetor 2024. Aplikoni tani për të përfituar
              nga kjo ofertë ekskluzive.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}