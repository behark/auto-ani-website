/**
 * Statsig Feature Flags Configuration
 *
 * This file configures Statsig for advanced feature flagging and A/B testing.
 * Statsig provides more powerful features than basic Vercel flags:
 * - Advanced targeting rules
 * - A/B testing with statistical analysis
 * - Gradual rollouts with percentage splits
 * - User segmentation
 * - Real-time analytics
 */

import { statsigAdapter, type StatsigUser } from "@flags-sdk/statsig";
import { flag, dedupe } from "flags/next";
import type { Identify } from "flags";
import { cookies } from "next/headers";

/**
 * Identify function - Provides user context for feature flags
 *
 * This function determines the user's identity for flag evaluation.
 * Statsig uses this to:
 * - Target specific users
 * - Ensure consistent flag values for the same user
 * - Provide analytics on flag usage
 */
export const identify = dedupe((async () => {
  // Get user ID from cookies or generate one
  const cookieStore = await cookies();
  let userId = cookieStore.get('statsig_user_id')?.value;

  if (!userId) {
    // Generate a stable user ID (in production, you'd use actual user authentication)
    userId = `anon_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Return user object with additional properties for targeting
  // See: https://docs.statsig.com/concepts/user
  return {
    userID: userId,

    // Add custom properties for advanced targeting:
    // custom: {
    //   isReturningVisitor: true,
    //   vehicleInterest: 'BMW',
    //   location: 'Kosovo',
    //   language: 'sq',
    // }
  } satisfies StatsigUser;
}) satisfies Identify<StatsigUser>);

/**
 * Create a feature gate (boolean flag)
 *
 * Feature gates are simple on/off flags.
 * Use for: enabling/disabling features, gradual rollouts, kill switches
 */
export const createFeatureGate = (key: string) => flag<boolean, StatsigUser>({
  key,
  adapter: statsigAdapter.featureGate(
    (gate) => gate.value,
    { exposureLogging: true } // Log when users are exposed to this flag
  ),
  identify,
});

/**
 * Create a dynamic config (configuration object)
 *
 * Dynamic configs return JSON objects instead of just boolean.
 * Use for: A/B testing different configurations, feature parameters
 */
export const createDynamicConfig = <T = Record<string, any>>(key: string) => flag<T, StatsigUser>({
  key,
  adapter: statsigAdapter.dynamicConfig(
    (config) => config.value as T,
    { exposureLogging: true }
  ),
  identify,
});

/**
 * Create an experiment
 *
 * Experiments are A/B tests with multiple variants.
 * Use for: testing different versions, optimization, data-driven decisions
 */
export const createExperiment = <T = Record<string, any>>(key: string) => flag<T, StatsigUser>({
  key,
  adapter: statsigAdapter.experiment(
    (experiment) => experiment.value as T,
    { exposureLogging: true }
  ),
  identify,
});

// ========================================
// Pre-configured Feature Flags
// ========================================

/**
 * UI/UX Feature Gates
 */
export const newVehicleCardDesign = () => createFeatureGate("new_vehicle_card_design");
export const advancedSearchFilters = () => createFeatureGate("advanced_search_filters");
export const darkModeEnabled = () => createFeatureGate("dark_mode");
export const vehicleComparisonSidebar = () => createFeatureGate("vehicle_comparison_sidebar");

/**
 * Business Feature Gates
 */
export const financingCalculatorEnabled = () => createFeatureGate("financing_calculator");
export const onlineReservationEnabled = () => createFeatureGate("online_reservation");
export const tradeInEstimatorEnabled = () => createFeatureGate("trade_in_estimator");
export const liveChatEnabled = () => createFeatureGate("live_chat");

/**
 * Marketing Feature Gates
 */
export const seasonalPromotionBanner = () => createFeatureGate("seasonal_promotion_banner");
export const newsletterPopup = () => createFeatureGate("newsletter_popup");
export const referralProgram = () => createFeatureGate("referral_program");

/**
 * Experimental Feature Gates
 */
export const aiVehicleRecommendations = () => createFeatureGate("ai_vehicle_recommendations");
export const virtualShowroomTour = () => createFeatureGate("virtual_showroom_tour");
export const vehicle3DViewer = () => createFeatureGate("3d_vehicle_viewer");

// ========================================
// Example A/B Test Experiments
// ========================================

/**
 * Hero Banner Experiment
 * Test different hero banner designs to see which converts better
 */
type HeroBannerVariant = {
  variant: 'control' | 'modern' | 'minimal';
  headline: string;
  ctaText: string;
  showVideo: boolean;
};

export const heroBannerExperiment = () =>
  createExperiment<HeroBannerVariant>("hero_banner_test");

/**
 * Pricing Display Experiment
 * Test different ways of showing vehicle pricing
 */
type PricingDisplayVariant = {
  variant: 'standard' | 'monthly_first' | 'savings_highlight';
  showFinancing: boolean;
  showComparison: boolean;
  highlightSavings: boolean;
};

export const pricingDisplayExperiment = () =>
  createExperiment<PricingDisplayVariant>("pricing_display_test");

/**
 * Search Algorithm Config
 * Dynamic config for search parameters
 */
type SearchConfig = {
  resultsPerPage: number;
  enableFuzzySearch: boolean;
  enableAutoCorrect: boolean;
  boostFactors: {
    price: number;
    year: number;
    mileage: number;
  };
};

export const searchAlgorithmConfig = () =>
  createDynamicConfig<SearchConfig>("search_algorithm_config");
