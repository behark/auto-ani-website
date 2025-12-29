'use client';

import { useState } from 'react';

export default function EnhancedFinancingCalculator() {
  const [price, setPrice] = useState(20000);
  const [downPayment, setDownPayment] = useState(2000);
  const [term, setTerm] = useState(60);
  const [includeInsurance, setIncludeInsurance] = useState(false);
  const [insurancePlan, setInsurancePlan] = useState('comprehensive');

  const downPaymentPercent = ((downPayment / price) * 100).toFixed(1);
  const loanAmount = price - downPayment;
  const monthlyRate = 0 / 100 / 12;
  const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1) || loanAmount / term;

  const insuranceCosts: Record<string, number> = { liability: 15, comprehensive: 35, premium: 55 };
  const totalMonthly = monthlyPayment + (includeInsurance ? insuranceCosts[insurancePlan] : 0);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">Kalkulator i Financimit</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Çmimi i Makinës: €{price.toLocaleString()}</label>
          <input type="range" min="5000" max="100000" step="1000" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Depozita: €{downPayment.toLocaleString()} ({downPaymentPercent}%)</label>
          <input type="range" min={price * 0.1} max={price * 0.5} step="100" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} className="w-full" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Periudha e Financimit: {term} muaj</label>
          <input type="range" min="12" max="84" step="12" value={term} onChange={(e) => setTerm(Number(e.target.value))} className="w-full" />
        </div>

        <div className="border-t pt-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={includeInsurance} onChange={(e) => setIncludeInsurance(e.target.checked)} className="w-5 h-5" />
            <span className="font-semibold">Shto Sigurimin</span>
          </label>

          {includeInsurance && (
            <select value={insurancePlan} onChange={(e) => setInsurancePlan(e.target.value)} className="w-full mt-3 p-2 border rounded-lg">
              <option value="liability">Liability (€15/muaj)</option>
              <option value="comprehensive">Comprehensive (€35/muaj)</option>
              <option value="premium">Premium (€55/muaj)</option>
            </select>
          )}
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
          <div className="text-sm text-gray-600 mb-2">Pagesa Mujore</div>
          <div className="text-4xl font-bold text-blue-600">€{totalMonthly.toFixed(0)}</div>
          {includeInsurance && <div className="text-sm text-gray-600 mt-2">Financim: €{monthlyPayment.toFixed(0)} + Sigurimi: €{insuranceCosts[insurancePlan]}</div>}
        </div>

        <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
          Kërkeso Financim
        </button>
      </div>
    </div>
  );
}
