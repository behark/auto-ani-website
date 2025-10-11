import { z } from 'zod'

/**
 * Client-side Environment Variables Validation
 *
 * IMPORTANT: Only NEXT_PUBLIC_* variables are available in the browser
 * This file validates environment variables used in client-side code
 */

const clientEnvSchema = z.object({
  // Site Configuration
  NEXT_PUBLIC_SITE_URL: z.string().url('NEXT_PUBLIC_SITE_URL must be a valid URL'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_NAME: z.string().optional(),
  NEXT_PUBLIC_SITE_DESCRIPTION: z.string().optional(),

  // WhatsApp
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().min(1, 'NEXT_PUBLIC_WHATSAPP_NUMBER is required'),
  NEXT_PUBLIC_WHATSAPP_MESSAGE: z.string().optional(),

  // Feature Flags
  NEXT_PUBLIC_ENABLE_SW: z.string().optional(),

  // Analytics & Monitoring
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_FB_PIXEL_ID: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_RELEASE: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DEV_MODE: z.string().optional(),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),

  // Google Maps
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),

  // reCAPTCHA
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string().optional(),

  // PWA
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
})

// Extract only NEXT_PUBLIC_* variables from process.env
const clientEnvValues = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  NEXT_PUBLIC_SITE_DESCRIPTION: process.env.NEXT_PUBLIC_SITE_DESCRIPTION,
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  NEXT_PUBLIC_WHATSAPP_MESSAGE: process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE,
  NEXT_PUBLIC_ENABLE_SW: process.env.NEXT_PUBLIC_ENABLE_SW,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NEXT_PUBLIC_FB_PIXEL_ID: process.env.NEXT_PUBLIC_FB_PIXEL_ID,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_SENTRY_RELEASE: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  NEXT_PUBLIC_SENTRY_DEV_MODE: process.env.NEXT_PUBLIC_SENTRY_DEV_MODE,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
}

const parsed = clientEnvSchema.safeParse(clientEnvValues)

if (!parsed.success) {
  console.error('❌ Invalid client environment variables:')
  console.error(JSON.stringify(parsed.error.format(), null, 2))

  // In production, we should fail gracefully but log the error
  if (process.env.NODE_ENV === 'production') {
    console.error('Some features may not work correctly due to missing environment variables')
  } else {
    throw new Error('Invalid client environment variables')
  }
}

export const clientEnv = parsed.success ? parsed.data : {} as z.infer<typeof clientEnvSchema>

// Type-safe client environment access
export type ClientEnv = z.infer<typeof clientEnvSchema>

// Helper functions for client-side feature detection
export const hasGoogleAnalytics = Boolean(clientEnv.NEXT_PUBLIC_GA_ID || clientEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID)
export const hasFacebookPixel = Boolean(clientEnv.NEXT_PUBLIC_FB_PIXEL_ID)
export const hasPostHog = Boolean(clientEnv.NEXT_PUBLIC_POSTHOG_KEY && clientEnv.NEXT_PUBLIC_POSTHOG_HOST)
export const hasSentry = Boolean(clientEnv.NEXT_PUBLIC_SENTRY_DSN)
export const hasGoogleMaps = Boolean(clientEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
export const hasRecaptcha = Boolean(clientEnv.NEXT_PUBLIC_RECAPTCHA_SITE_KEY)
export const hasServiceWorker = clientEnv.NEXT_PUBLIC_ENABLE_SW === 'true'

// Get client feature status
export const getClientFeatures = () => ({
  googleAnalytics: hasGoogleAnalytics,
  facebookPixel: hasFacebookPixel,
  postHog: hasPostHog,
  sentry: hasSentry,
  googleMaps: hasGoogleMaps,
  recaptcha: hasRecaptcha,
  serviceWorker: hasServiceWorker,
})

// Log client environment status in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  console.log('\n🌐 Client Environment Configuration')
  console.log('=====================================')
  const features = getClientFeatures()
  console.log('📦 Client Features:')
  Object.entries(features).forEach(([name, enabled]) => {
    console.log(`  ${enabled ? '✅' : '❌'} ${name}`)
  })
  console.log('=====================================\n')
}
