'use client';

import { useState } from 'react';

export default function FleetCalculator() {
  const [numVehicles, setNumVehicles] = useState(10);
  const [avgPrice, setAvgPrice] = useState(20000);
  const [financePeriod, setFinancePeriod] = useState(5);

  const totalValue = numVehicles * avgPrice;
  const discountPercent = numVehicles >= 30 ? 15 : numVehicles >= 15 ? 10 : 5;
  const discountAmount = totalValue * (discountPercent / 100);
  const finalPrice = totalValue - discountAmount;
  const monthlyPayment = (finalPrice / (financePeriod * 12)).toFixed(0);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">Kalkulator i Flotës</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Numri i Makinave: {numVehicles}</label>
          <input type="range" min="1" max="50" step="1" value={numVehicles} onChange={(e) => setNumVehicles(Number(e.target.value))} className="w-full" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Çmimi Mesatar: €{avgPrice.toLocaleString()}</label>
          <input type="range" min="5000" max="50000" step="1000" value={avgPrice} onChange={(e) => setAvgPrice(Number(e.target.value))} className="w-full" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Periudha e Financimit: {financePeriod} vite</label>
          <input type="range" min="1" max="7" step="1" value={financePeriod} onChange={(e) => setFinancePeriod(Number(e.target.value))} className="w-full" />
        </div>

        <div className="space-y-3 bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between">
            <span>Vlera Totale:</span>
            <span className="font-bold">€{totalValue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Zbritje në Sasi ({discountPercent}%):</span>
            <span className="font-bold">-€{discountAmount.toLocaleString()}</span>
          </div>
          <div className="border-t pt-3 flex justify-between text-lg font-bold">
            <span>Çmimi Final:</span>
            <span className="text-blue-600">€{finalPrice.toLocaleString()}</span>
          </div>
          <div className="bg-blue-100 border border-blue-300 rounded p-3 mt-3">
            <div className="text-sm text-gray-600">Pagesa Mujore</div>
            <div className="text-3xl font-bold text-blue-600">€{monthlyPayment}</div>
          </div>
        </div>

        <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
          Kontakto për Ofertë
        </button>
      </div>
    </div>
  );
}
