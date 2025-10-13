'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  TrendingUp,
  CreditCard,
  Car,
  CheckCircle,
  Info,
  Euro,
  Calendar,
  Percent
} from 'lucide-react';

interface CalculationResult {
  monthlyPayment: number;
  totalInterest: number;
  totalAmount: number;
  affordabilityScore: 'excellent' | 'good' | 'fair' | 'challenging';
}

interface FinancingOptions {
  vehiclePrice: number;
  downPayment: number;
  tradeInValue: number;
  loanTerm: number;
  interestRate: number;
  monthlyIncome: number;
}

export default function FinancingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [financing, setFinancing] = useState<FinancingOptions>({
    vehiclePrice: 25000,
    downPayment: 5000,
    tradeInValue: 0,
    loanTerm: 60,
    interestRate: 4.5,
    monthlyIncome: 2500
  });
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Calculate financing details
  useEffect(() => {
    const calculateFinancing = () => {
      const principal = financing.vehiclePrice - financing.downPayment - financing.tradeInValue;
      const monthlyRate = financing.interestRate / 100 / 12;
      const numPayments = financing.loanTerm;

      if (principal <= 0 || monthlyRate <= 0 || numPayments <= 0) {
        setResult(null);
        return;
      }

      // Monthly payment calculation using loan formula
      const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                            (Math.pow(1 + monthlyRate, numPayments) - 1);

      const totalAmount = monthlyPayment * numPayments;
      const totalInterest = totalAmount - principal;

      // Affordability score based on debt-to-income ratio
      const debtToIncomeRatio = (monthlyPayment / financing.monthlyIncome) * 100;
      let affordabilityScore: 'excellent' | 'good' | 'fair' | 'challenging';

      if (debtToIncomeRatio <= 15) {
        affordabilityScore = 'excellent';
      } else if (debtToIncomeRatio <= 25) {
        affordabilityScore = 'good';
      } else if (debtToIncomeRatio <= 35) {
        affordabilityScore = 'fair';
      } else {
        affordabilityScore = 'challenging';
      }

      setResult({
        monthlyPayment,
        totalInterest,
        totalAmount,
        affordabilityScore
      });
    };

    calculateFinancing();
  }, [financing]);

  const affordabilityColors = {
    excellent: 'text-green-600 bg-green-50 border-green-200',
    good: 'text-blue-600 bg-blue-50 border-blue-200',
    fair: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    challenging: 'text-red-600 bg-red-50 border-red-200'
  };

  const affordabilityLabels = {
    excellent: 'E shkëlqyer',
    good: 'E mirë',
    fair: 'E pranueshme',
    challenging: 'E vështirë'
  };

  const loanTermOptions = [
    { value: 24, label: '24 muaj' },
    { value: 36, label: '36 muaj' },
    { value: 48, label: '48 muaj' },
    { value: 60, label: '60 muaj' },
    { value: 72, label: '72 muaj' },
    { value: 84, label: '84 muaj' }
  ];

  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Calculator className="h-6 w-6" />
        <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          Llogaritësi i Financimit
          <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="fixed left-6 bottom-6 top-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-40 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calculator className="h-6 w-6" />
            <h2 className="text-xl font-bold">Llogaritësi i Financimit</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white p-1 rounded"
          >
            ✕
          </button>
        </div>
        <p className="text-blue-100 text-sm mt-2">
          Zbuloni sa mund të paguani për automjetin tuaj të ëndërruar
        </p>
      </div>

      {/* Form */}
      <div className="p-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
        <div className="space-y-6">
          {/* Vehicle Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Car className="inline h-4 w-4 mr-1" />
              Çmimi i Automjetit
            </label>
            <div className="relative">
              <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={financing.vehiclePrice}
                onChange={(e) => setFinancing({...financing, vehiclePrice: Number(e.target.value)})}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="25,000"
              />
            </div>
          </div>

          {/* Down Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="inline h-4 w-4 mr-1" />
              Pagesa Paraprake
            </label>
            <div className="relative">
              <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={financing.downPayment}
                onChange={(e) => setFinancing({...financing, downPayment: Number(e.target.value)})}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="5,000"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {financing.vehiclePrice > 0 && `${((financing.downPayment / financing.vehiclePrice) * 100).toFixed(1)}% e çmimit`}
            </p>
          </div>

          {/* Trade-in Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TrendingUp className="inline h-4 w-4 mr-1" />
              Vlera e Shkëmbimit
            </label>
            <div className="relative">
              <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={financing.tradeInValue}
                onChange={(e) => setFinancing({...financing, tradeInValue: Number(e.target.value)})}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-blue-600 mt-1">
              + €1,000 Bonus Shkëmbimi (AUTO ANI)
            </p>
          </div>

          {/* Loan Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Kohëzgjatja e Kredisë
            </label>
            <select
              value={financing.loanTerm}
              onChange={(e) => setFinancing({...financing, loanTerm: Number(e.target.value)})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              {loanTermOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Interest Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Percent className="inline h-4 w-4 mr-1" />
              Shkalla e Interesit
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="number"
                step="0.1"
                value={financing.interestRate}
                onChange={(e) => setFinancing({...financing, interestRate: Number(e.target.value)})}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="4.5"
              />
            </div>
            <p className="text-xs text-green-600 mt-1">
              0% financim i disponueshëm për modele të zgjedhura
            </p>
          </div>

          {/* Monthly Income */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TrendingUp className="inline h-4 w-4 mr-1" />
              Të Ardhurat Mujore
            </label>
            <div className="relative">
              <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={financing.monthlyIncome}
                onChange={(e) => setFinancing({...financing, monthlyIncome: Number(e.target.value)})}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="2,500"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-gray-50 rounded-xl space-y-4"
          >
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              Rezultatet e Financimit
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">
                  €{result.monthlyPayment.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Pagesa Mujore</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-3 rounded-lg border text-center">
                  <div className="text-lg font-bold text-gray-900">
                    €{result.totalInterest.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-600">Interesi Total</div>
                </div>
                <div className="bg-white p-3 rounded-lg border text-center">
                  <div className="text-lg font-bold text-gray-900">
                    €{result.totalAmount.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-600">Shuma Totale</div>
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${affordabilityColors[result.affordabilityScore]}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Vlerësimi i Përballueshmërisë</span>
                  <span className="font-bold">{affordabilityLabels[result.affordabilityScore]}</span>
                </div>
                <div className="text-xs mt-1 opacity-80">
                  {((result.monthlyPayment / financing.monthlyIncome) * 100).toFixed(1)}% e të ardhurave tuaja
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Apliko për Financim
              </button>
              <button className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium">
                Kontakto Ekspertin
              </button>
            </div>

            <div className="flex items-start space-x-2 text-xs text-gray-600">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                Llogaritjet janë orientuese. Kushtet finale varen nga aprovimi i kredisë dhe institucioni financiar.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}