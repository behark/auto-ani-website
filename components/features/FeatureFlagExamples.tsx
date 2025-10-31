'use client';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';

/**
 * Example 1: Seasonal Promotion Banner
 * Shows a banner only when the feature flag is enabled
 */
export function SeasonalPromotionBanner() {
  const isEnabled = useFeatureFlag('seasonal-promotion-banner');

  if (!isEnabled) return null;

  return (
    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-4 text-center">
      <p className="text-sm md:text-base font-semibold">
        🎉 Ofertë Speciale Dimërore! 20% Zbritje në të gjitha veturat premium!
        <button className="ml-3 underline hover:no-underline">Shiko Tani</button>
      </p>
    </div>
  );
}

/**
 * Example 2: Financing Calculator
 * Shows a financing calculator when enabled
 */
export function FinancingCalculator({ price }: { price: number }) {
  const isEnabled = useFeatureFlag('financing-calculator');

  if (!isEnabled) {
    return (
      <div className="text-sm text-gray-500">
        Kontaktoni për opcione financimi
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="font-semibold mb-3">Llogarit Financimin</h3>
      <div className="space-y-2">
        <div>
          <label className="text-sm text-gray-600">Pagesa Fillestare</label>
          <input type="range" className="w-full" min="0" max={price} />
        </div>
        <div>
          <label className="text-sm text-gray-600">Kohëzgjatja (muaj)</label>
          <select className="w-full border rounded p-2">
            <option>12 muaj</option>
            <option>24 muaj</option>
            <option>36 muaj</option>
            <option>48 muaj</option>
          </select>
        </div>
        <div className="pt-2 border-t">
          <p className="text-sm text-gray-600">Pagesa Mujore:</p>
          <p className="text-2xl font-bold text-green-600">€450/muaj</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 3: Live Chat Widget
 * Shows live chat when enabled
 */
export function LiveChatButton() {
  const isEnabled = useFeatureFlag('live-chat');

  if (!isEnabled) return null;

  return (
    <button
      className="fixed bottom-24 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all z-40"
      aria-label="Live Chat"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
    </button>
  );
}

/**
 * Example 4: Advanced Search Filters
 * Shows advanced filters when enabled, basic filters otherwise
 */
export function VehicleSearchFilters() {
  const showAdvanced = useFeatureFlag('advanced-search-filters');

  return (
    <div className="space-y-4">
      {/* Basic Filters - Always shown */}
      <div>
        <label className="block text-sm font-medium mb-2">Prodhuesi</label>
        <select className="w-full border rounded-lg p-2">
          <option>Të gjitha</option>
          <option>BMW</option>
          <option>Mercedes-Benz</option>
          <option>Audi</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Çmimi</label>
        <input type="range" className="w-full" />
      </div>

      {/* Advanced Filters - Only shown when flag is enabled */}
      {showAdvanced && (
        <>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3 text-sm text-gray-600">
              Filtrat e Avancuar
            </h4>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ngjyra</label>
            <select className="w-full border rounded-lg p-2">
              <option>Të gjitha</option>
              <option>E bardhë</option>
              <option>E zezë</option>
              <option>Gri</option>
              <option>E kaltër</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Madhësia e Motorit
            </label>
            <select className="w-full border rounded-lg p-2">
              <option>Të gjitha</option>
              <option>Deri në 1.5L</option>
              <option>1.5L - 2.0L</option>
              <option>2.0L - 3.0L</option>
              <option>Mbi 3.0L</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Veçoritë</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">Kamera e Pasme</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">Navigacion</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">Ndezje Pa Çelës</span>
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Example 5: New Vehicle Card Design
 * Shows new card design when enabled
 */
export function VehicleCard({ vehicle }: { vehicle: any }) {
  const useNewDesign = useFeatureFlag('new-vehicle-card-design');

  if (useNewDesign) {
    // New modern card design
    return (
      <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={vehicle.image}
            alt={vehicle.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
          <h3 className="text-2xl font-bold mb-1">{vehicle.name}</h3>
          <p className="text-lg mb-3">€{vehicle.price.toLocaleString()}</p>
          <div className="flex gap-2">
            <button className="flex-1 bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
              Detajet
            </button>
            <button className="px-4 py-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition">
              ♥
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Old card design (current)
  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
      <img src={vehicle.image} alt={vehicle.name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="font-bold text-lg">{vehicle.name}</h3>
        <p className="text-gray-600">€{vehicle.price.toLocaleString()}</p>
        <button className="mt-3 w-full bg-black text-white py-2 rounded hover:bg-gray-800">
          Shiko Detajet
        </button>
      </div>
    </div>
  );
}
