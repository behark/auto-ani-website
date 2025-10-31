/**
 * Feature Flags Configuration
 *
 * Define your feature flags here. These can be toggled from the Vercel Dashboard
 * without redeploying your application.
 */

export type FeatureFlags = {
  // UI/UX Feature Flags
  'new-vehicle-card-design': boolean;
  'advanced-search-filters': boolean;
  'vehicle-comparison-sidebar': boolean;
  'dark-mode': boolean;

  // Business Feature Flags
  'financing-calculator': boolean;
  'online-reservation': boolean;
  'trade-in-estimator': boolean;
  'live-chat': boolean;

  // Marketing & Analytics
  'seasonal-promotion-banner': boolean;
  'newsletter-popup': boolean;
  'referral-program': boolean;

  // Experimental Features
  'ai-vehicle-recommendations': boolean;
  'virtual-showroom-tour': boolean;
  '3d-vehicle-viewer': boolean;
};

// Default values when flags are not set
export const defaultFlags: FeatureFlags = {
  // UI/UX - Default OFF for new designs
  'new-vehicle-card-design': false,
  'advanced-search-filters': false,
  'vehicle-comparison-sidebar': true, // Already implemented, so ON
  'dark-mode': false,

  // Business - Default OFF until fully tested
  'financing-calculator': false,
  'online-reservation': false,
  'trade-in-estimator': false,
  'live-chat': false,

  // Marketing - Default OFF to avoid annoying users
  'seasonal-promotion-banner': false,
  'newsletter-popup': false,
  'referral-program': false,

  // Experimental - Default OFF
  'ai-vehicle-recommendations': false,
  'virtual-showroom-tour': false,
  '3d-vehicle-viewer': false,
};

/**
 * Flag descriptions for documentation
 */
export const flagDescriptions: Record<keyof FeatureFlags, string> = {
  'new-vehicle-card-design': 'New vehicle card layout with improved imagery and CTA buttons',
  'advanced-search-filters': 'Enhanced search with more filter options (engine size, color, features)',
  'vehicle-comparison-sidebar': 'Side-by-side vehicle comparison feature',
  'dark-mode': 'Dark mode theme toggle',

  'financing-calculator': 'Interactive financing calculator on vehicle detail pages',
  'online-reservation': 'Allow customers to reserve vehicles online with deposit',
  'trade-in-estimator': 'Instant trade-in value estimator for customer vehicles',
  'live-chat': 'Live chat widget for instant customer support',

  'seasonal-promotion-banner': 'Seasonal promotion banner on homepage',
  'newsletter-popup': 'Newsletter subscription popup modal',
  'referral-program': 'Customer referral rewards program',

  'ai-vehicle-recommendations': 'AI-powered vehicle recommendations based on preferences',
  'virtual-showroom-tour': '360° virtual tour of the showroom',
  '3d-vehicle-viewer': 'Interactive 3D vehicle viewer on detail pages',
};
