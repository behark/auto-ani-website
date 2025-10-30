'use client';

import { Calculator, Euro, Calendar, Percent } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FinancingCalculator() {
  const { t: _t } = useLanguage();

  const [vehiclePrice, setVehiclePrice] = useState(25000);
  const [downPayment, setDownPayment] = useState(2500);
  const [loanTerm, setLoanTerm] = useState(48);
  const [interestRate, setInterestRate] = useState(0);

  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);

  // Calculate loan details
  useEffect(() => {
    const principal = vehiclePrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm;

    let monthly = 0;

    if (interestRate === 0) {
      // Simple calculation for 0% interest
      monthly = principal / numPayments;
    } else {
      // Standard loan calculation formula
      monthly = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    const total = monthly * numPayments;
    const interest = total - principal;

    setMonthlyPayment(monthly);
    setTotalPayment(total + downPayment);
    setTotalInterest(interest);
  }, [vehiclePrice, downPayment, loanTerm, interestRate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const downPaymentPercentage = ((downPayment / vehiclePrice) * 100).toFixed(0);

  return (
    <div className="space-y-6">
      {/* Vehicle Price */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Euro className="w-4 h-4" />
          Çmimi i Veturës: {formatCurrency(vehiclePrice)}
        </Label>
        <Slider
          value={[vehiclePrice]}
          onValueChange={([value]) => setVehiclePrice(value)}
          min={5000}
          max={100000}
          step={1000}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>€5,000</span>
          <span>€100,000</span>
        </div>
      </div>

      {/* Down Payment */}
      <div className="space-y-2">
        <Label className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Percent className="w-4 h-4" />
            Participimi: {formatCurrency(downPayment)}
          </span>
          <span className="text-sm text-gray-500">({downPaymentPercentage}%)</span>
        </Label>
        <Slider
          value={[downPayment]}
          onValueChange={([value]) => setDownPayment(value)}
          min={vehiclePrice * 0.1}
          max={vehiclePrice * 0.5}
          step={100}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>10%</span>
          <span>50%</span>
        </div>
      </div>

      {/* Loan Term */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Periudha e Kredisë: {loanTerm} muaj
        </Label>
        <Slider
          value={[loanTerm]}
          onValueChange={([value]) => setLoanTerm(value)}
          min={12}
          max={84}
          step={6}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>12 muaj</span>
          <span>84 muaj</span>
        </div>
      </div>

      {/* Interest Rate */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Percent className="w-4 h-4" />
          Norma e Interesit: {interestRate}%
        </Label>
        <Slider
          value={[interestRate]}
          onValueChange={([value]) => setInterestRate(value)}
          min={0}
          max={15}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>0%</span>
          <span>15%</span>
        </div>
      </div>

      {/* Results */}
      <Card className="bg-gradient-to-br from-[var(--primary-orange)] to-orange-600 text-white">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <div className="text-sm opacity-90">Kësti Mujor</div>
              <div className="text-3xl font-bold">{formatCurrency(monthlyPayment)}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
              <div>
                <div className="text-sm opacity-90">Kredia Totale</div>
                <div className="text-xl font-semibold">
                  {formatCurrency(vehiclePrice - downPayment)}
                </div>
              </div>
              <div>
                <div className="text-sm opacity-90">Interesi Total</div>
                <div className="text-xl font-semibold">
                  {formatCurrency(totalInterest)}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/20">
              <div className="text-sm opacity-90">Pagesa Totale</div>
              <div className="text-xl font-semibold">{formatCurrency(totalPayment)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          className="w-full bg-[var(--primary-orange)] hover:bg-orange-600"
          size="lg"
        >
          <Calculator className="w-5 h-5 mr-2" />
          Apliko për Këtë Ofertë
        </Button>

        <Button
          variant="outline"
          className="w-full"
          size="lg"
        >
          Ruaj Kalkulimin
        </Button>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 text-center">
        * Kalkulimi është indikativ. Kushtet finale varen nga vlerësimi i bankës dhe profili juaj kreditor.
      </p>
    </div>
  );
}