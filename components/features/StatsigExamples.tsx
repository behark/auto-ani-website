/**
 * Statsig Feature Flag Examples
 *
 * This file shows how to use Statsig feature flags in your components.
 * Statsig provides more advanced features than basic flags:
 * - A/B testing with analytics
 * - Gradual rollouts (10% → 50% → 100%)
 * - User targeting (location, behavior, etc.)
 * - Real-time updates
 */

import {
  financingCalculatorEnabled,
  seasonalPromotionBanner,
  liveChatEnabled,
  heroBannerExperiment,
  pricingDisplayExperiment,
  newVehicleCardDesign,
} from '@/flags';

/**
 * Example 1: Simple Feature Gate
 * Shows a feature only when the flag is enabled
 */
export async function FinancingCalculatorSection({ price }: { price: number }) {
  const isEnabled = await financingCalculatorEnabled()();

  if (!isEnabled) {
    return (
      <div className="text-sm text-gray-500">
        Kontaktoni për opcione financimi
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h3 className="text-xl font-bold mb-4">Llogarit Financimin</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Pagesa Fillestare: €{Math.round(price * 0.2).toLocaleString()}
          </label>
          <input
            type="range"
            className="w-full"
            min="0"
            max={price}
            defaultValue={price * 0.2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Kohëzgjatja</label>
          <select className="w-full border rounded-lg p-2">
            <option>12 muaj</option>
            <option>24 muaj</option>
            <option>36 muaj</option>
            <option>48 muaj</option>
          </select>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600">Pagesa Mujore e Vlerësuar:</p>
          <p className="text-3xl font-bold text-green-600">€450/muaj</p>
          <p className="text-xs text-gray-500 mt-2">0% interesi për 24 muaj</p>
        </div>

        <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
          Aplikoni Për Financim
        </button>
      </div>
    </div>
  );
}

/**
 * Example 2: Seasonal Promotion with Gradual Rollout
 * Show banner to percentage of users (control rollout from Statsig)
 */
export async function SeasonalBanner() {
  const showBanner = await seasonalPromotionBanner()();

  if (!showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white py-4 px-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-bold text-lg">Ofertë Speciale Dimërore!</p>
            <p className="text-sm opacity-90">
              Deri në 20% zbritje në të gjitha veturat premium
            </p>
          </div>
        </div>
        <button className="bg-white text-red-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
          Shiko Ofertat
        </button>
      </div>
    </div>
  );
}

/**
 * Example 3: Live Chat Widget
 * Gradually roll out to 10%, then 50%, then 100% of users
 */
export async function LiveChatWidget() {
  const isEnabled = await liveChatEnabled()();

  if (!isEnabled) return null;

  return (
    <button
      className="fixed bottom-24 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all hover:scale-110 z-50"
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
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
    </button>
  );
}

/**
 * Example 4: A/B Test - Hero Banner Variants
 * Test 3 different hero designs and see which converts better
 */
export async function HeroBanner() {
  const experiment = await heroBannerExperiment()();

  // Default (control) variant
  const defaultVariant = {
    variant: 'control' as const,
    headline: 'Vetura Premium Që Nga 2015',
    ctaText: 'Shfleto Veturat',
    showVideo: false,
  };

  const config = experiment || defaultVariant;

  // Control variant (original)
  if (config.variant === 'control') {
    return (
      <section className="bg-black text-white py-20">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">{config.headline}</h1>
          <p className="text-xl mb-8 opacity-90">
            Mbi 2500 klientë të kënaqur në Kosovë
          </p>
          <button className="bg-white text-black px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition">
            {config.ctaText}
          </button>
        </div>
      </section>
    );
  }

  // Modern variant - with gradient and animation
  if (config.variant === 'modern') {
    return (
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-black text-white py-24">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                {config.headline}
              </h1>
              <p className="text-2xl mb-8 opacity-90">
                BMW • Mercedes • Audi • Më Shumë
              </p>
              <div className="flex gap-4">
                <button className="bg-blue-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-600 transition">
                  {config.ctaText}
                </button>
                <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-black transition">
                  Kontakto
                </button>
              </div>
            </div>
            {config.showVideo && (
              <div className="bg-white/10 rounded-lg aspect-video flex items-center justify-center">
                <p className="text-white/50">Video Showcase</p>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Minimal variant - clean and simple
  return (
    <section className="bg-white text-black py-16 border-b-4 border-black">
      <div className="container mx-auto text-center max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
          {config.headline}
        </h1>
        <p className="text-lg mb-8 text-gray-600">Cilësi • Besim • Përsosmëri</p>
        <button className="bg-black text-white px-12 py-4 rounded-none text-lg font-bold hover:bg-gray-900 transition uppercase tracking-wider">
          {config.ctaText}
        </button>
      </div>
    </section>
  );
}

/**
 * Example 5: A/B Test - Pricing Display Variants
 * Test different ways of showing pricing
 */
export async function VehiclePricing({ price, monthlyPrice }: { price: number; monthlyPrice?: number }) {
  const experiment = await pricingDisplayExperiment()();

  const defaultConfig = {
    variant: 'standard' as const,
    showFinancing: false,
    showComparison: false,
    highlightSavings: false,
  };

  const config = experiment || defaultConfig;

  // Standard - just show price
  if (config.variant === 'standard') {
    return (
      <div className="text-3xl font-bold">€{price.toLocaleString()}</div>
    );
  }

  // Monthly First - emphasize monthly payment
  if (config.variant === 'monthly_first' && monthlyPrice) {
    return (
      <div>
        <div className="text-4xl font-bold text-green-600">
          €{monthlyPrice}/muaj
        </div>
        <div className="text-sm text-gray-500 mt-1">
          ose €{price.toLocaleString()} plotësisht
        </div>
        <div className="text-xs text-blue-600 mt-1">0% interes, 36 muaj</div>
      </div>
    );
  }

  // Savings Highlight - show you're getting a deal
  if (config.variant === 'savings_highlight') {
    const originalPrice = Math.round(price * 1.15);
    const savings = originalPrice - price;

    return (
      <div>
        <div className="flex items-center gap-3">
          <div className="text-gray-400 line-through text-lg">
            €{originalPrice.toLocaleString()}
          </div>
          <div className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
            -€{savings.toLocaleString()}
          </div>
        </div>
        <div className="text-3xl font-bold text-green-600 mt-1">
          €{price.toLocaleString()}
        </div>
        <div className="text-sm text-green-600 font-semibold mt-1">
          Kurseni {Math.round((savings / originalPrice) * 100)}%!
        </div>
      </div>
    );
  }

  return <div className="text-3xl font-bold">€{price.toLocaleString()}</div>;
}

/**
 * Example 6: New Vehicle Card with A/B Test
 */
export async function VehicleCardWithTest({ vehicle }: { vehicle: any }) {
  const useNewDesign = await newVehicleCardDesign()();

  if (useNewDesign) {
    // New design with better imagery
    return (
      <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={vehicle.image}
            alt={vehicle.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-2xl font-bold mb-2">{vehicle.name}</h3>
          <p className="text-xl mb-4">€{vehicle.price.toLocaleString()}</p>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
            <button className="flex-1 bg-white text-black px-4 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
              Detajet
            </button>
            <button className="px-4 py-3 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition">
              ♥
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Original design
  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
      <img
        src={vehicle.image}
        alt={vehicle.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{vehicle.name}</h3>
        <p className="text-gray-600 mb-3">€{vehicle.price.toLocaleString()}</p>
        <button className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition">
          Shiko Detajet
        </button>
      </div>
    </div>
  );
}
