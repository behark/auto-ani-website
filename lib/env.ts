import { z } from 'zod'

// Define the schema for all environment variables
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  DIRECT_DATABASE_URL: z.string().optional(),
  DATABASE_PROVIDER: z.enum(['sqlite', 'postgresql']).default('sqlite'),
  DATABASE_POOL_SIZE: z.string().default('20'),
  DATABASE_CONNECT_TIMEOUT: z.string().default('5000'),
  DATABASE_QUERY_TIMEOUT: z.string().default('10000'),
  DATABASE_POOL_TIMEOUT: z.string().default('10000'),
  DATABASE_IDLE_TIMEOUT: z.string().default('60000'),
  DATABASE_STATEMENT_TIMEOUT: z.string().default('30000'),
  DATABASE_HEALTH_CHECK_INTERVAL: z.string().default('30000'),
  DATABASE_POOL_STATS: z.string().default('false'),
  DATABASE_DEBUG: z.string().default('false'),

  // Authentication
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  SESSION_SECRET: z.string().min(32).optional(),
  ENCRYPTION_KEY: z.string().length(32, 'ENCRYPTION_KEY must be exactly 32 characters').optional(),

  // Email (Resend) - Optional in development
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().default('noreply@autosalonani.com'),
  ADMIN_EMAIL: z.string().email().default('admin@autosalonani.com'),

  // Admin Authentication
  ADMIN_PASSWORD_HASH: z.string().optional(),

  // Stripe - Optional in development
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional().refine(
    (val) => !val || val.startsWith('whsec_'),
    { message: 'STRIPE_WEBHOOK_SECRET must start with whsec_ if provided' }
  ),
  PAYMENT_CURRENCY: z.string().default('EUR'),
  DEPOSIT_PERCENTAGE: z.string().default('10'),
  MIN_DEPOSIT_AMOUNT: z.string().default('500'),

  // Twilio (Optional)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  SMS_RATE_LIMIT: z.string().default('20'),

  // Redis (Optional)
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TOKEN: z.string().optional(),

  // Monitoring (Optional)
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_RELEASE: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DEV_MODE: z.string().optional(),
  SENTRY_DEV_MODE: z.string().optional(),

  // PostHog Analytics
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().optional(),

  // Google Services (Optional)
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  DEALERSHIP_ADDRESS: z.string().optional(),
  DEALERSHIP_LATITUDE: z.string().optional(),
  DEALERSHIP_LONGITUDE: z.string().optional(),

  // Cloudinary (Optional)
  CLOUDINARY_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // AWS S3 (Optional)
  AWS_S3_BUCKET_NAME: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  BACKUP_BUCKET: z.string().optional(),
  BACKUP_RETENTION_DAYS: z.string().default('30'),

  // Facebook/Instagram (Optional)
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  FACEBOOK_ACCESS_TOKEN: z.string().optional(),
  FACEBOOK_PAGE_ACCESS_TOKEN: z.string().optional(),
  FACEBOOK_PAGE_ID: z.string().optional(),
  FACEBOOK_API_KEY: z.string().optional(),
  INSTAGRAM_ACCOUNT_ID: z.string().optional(),
  INSTAGRAM_ACCESS_TOKEN: z.string().optional(),
  INSTAGRAM_API_KEY: z.string().optional(),
  INSTAGRAM_CLIENT_ID: z.string().optional(),
  INSTAGRAM_CLIENT_SECRET: z.string().optional(),
  AUTO_POST_NEW_VEHICLES: z.string().default('false'),
  POST_SCHEDULE_HOUR: z.string().default('9'),

  // Twitter/LinkedIn
  TWITTER_API_KEY: z.string().optional(),
  TWITTER_API_SECRET: z.string().optional(),
  TWITTER_BEARER_TOKEN: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),

  // WhatsApp
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().min(1, 'WhatsApp number is required'),
  NEXT_PUBLIC_WHATSAPP_MESSAGE: z.string().optional(),

  // Site Configuration
  NEXT_PUBLIC_SITE_URL: z.string().url('NEXT_PUBLIC_SITE_URL must be a valid URL'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_NAME: z.string().optional(),
  NEXT_PUBLIC_SITE_DESCRIPTION: z.string().optional(),
  CDN_URL: z.string().url().optional(),

  // Feature Flags
  NEXT_PUBLIC_ENABLE_SW: z.string().optional(),
  ENABLE_PERFORMANCE_MONITORING: z.string().optional(),
  ENABLE_ANALYTICS: z.string().optional(),
  ENABLE_MONITORING: z.string().optional(),
  ENABLE_EMAIL_NOTIFICATIONS: z.string().optional(),
  ENABLE_SMS_NOTIFICATIONS: z.string().optional(),
  ENABLE_PUSH_NOTIFICATIONS: z.string().optional(),

  // Progressive Web App
  PWA_SHORT_NAME: z.string().default('AUTO ANI'),
  PWA_NAME: z.string().default('AUTO ANI - Auto Salon'),
  PWA_DESCRIPTION: z.string().default("Kosovo's Premier Auto Dealership"),
  PWA_THEME_COLOR: z.string().default('#FF6B35'),
  PWA_BACKGROUND_COLOR: z.string().default('#FFFFFF'),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().email().optional(),

  // Admin & Security
  ADMIN_API_KEY: z.string().min(32).optional(),
  HEALTH_CHECK_API_KEY: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  WEBHOOK_ENDPOINT: z.string().url().optional(),
  WEBHOOK_RETRY_ATTEMPTS: z.string().default('3'),
  WEBHOOK_TIMEOUT_MS: z.string().default('5000'),
  DISABLE_WEBHOOK_AFTER_FAILURES: z.string().default('10'),

  // Rate Limiting
  RATE_LIMIT_ENABLED: z.string().default('true'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  RATE_LIMIT_WINDOW: z.string().optional(),
  RATE_LIMIT_MAX: z.string().optional(),

  // Queue Management
  QUEUE_CONCURRENCY: z.string().default('10'),
  QUEUE_MAX_RETRIES: z.string().default('3'),

  // Marketing Campaign Limits
  MAX_EMAIL_BATCH_SIZE: z.string().default('1000'),
  MAX_SMS_BATCH_SIZE: z.string().default('100'),
  EMAIL_RATE_LIMIT: z.string().default('100'),

  // A/B Testing
  AB_TEST_AUTO_CONCLUDE: z.string().default('true'),
  AB_TEST_MIN_CONFIDENCE: z.string().default('95'),
  AB_TEST_MIN_SAMPLE_SIZE: z.string().default('100'),

  // Analytics
  ANALYTICS_RETENTION_DAYS: z.string().default('365'),
  DAILY_AGGREGATION_ENABLED: z.string().default('true'),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),

  // Lead Scoring Weights
  LEAD_SCORE_WEBSITE_VISIT: z.string().default('5'),
  LEAD_SCORE_VEHICLE_VIEW: z.string().default('10'),
  LEAD_SCORE_INQUIRY: z.string().default('25'),
  LEAD_SCORE_TEST_DRIVE: z.string().default('40'),
  LEAD_SCORE_EMAIL_OPEN: z.string().default('3'),
  LEAD_SCORE_EMAIL_CLICK: z.string().default('8'),

  // Performance Monitoring
  PERFORMANCE_THRESHOLD_FCP: z.string().default('1800'),
  PERFORMANCE_THRESHOLD_LCP: z.string().default('2500'),
  PERFORMANCE_THRESHOLD_FID: z.string().default('100'),
  PERFORMANCE_THRESHOLD_CLS: z.string().default('0.1'),
  MAX_BUNDLE_SIZE: z.string().default('500000'),
  MAX_PAGE_SIZE: z.string().default('200000'),

  // Email Alternative (SMTP)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Vehicle APIs (Optional)
  VEHICLE_API_KEY: z.string().optional(),
  VEHICLE_API_URL: z.string().url().optional(),

  // Deployment Platforms
  RENDER_API_KEY: z.string().optional(),
  RENDER_SERVICE_ID: z.string().optional(),
  VERCEL_TOKEN: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().optional(),
  VERCEL_ORG_ID: z.string().optional(),
  RAILWAY_TOKEN: z.string().optional(),
  RAILWAY_PROJECT_ID: z.string().optional(),

  // Slack Notifications
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  SLACK_SECURITY_WEBHOOK: z.string().url().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Development
  ANALYZE: z.string().optional(),
  NEXT_TELEMETRY_DISABLED: z.string().optional(),

  // reCAPTCHA
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string().optional(),
  RECAPTCHA_SECRET_KEY: z.string().optional(),

  // Facebook Pixel
  NEXT_PUBLIC_FB_PIXEL_ID: z.string().optional(),
})

// Custom refinements for additional validation
const refinedSchema = envSchema.superRefine((data, ctx) => {
  // Ensure Stripe keys have correct prefixes if provided
  if (data.STRIPE_SECRET_KEY && !data.STRIPE_SECRET_KEY.startsWith('sk_')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'STRIPE_SECRET_KEY must start with sk_test_ or sk_live_',
      path: ['STRIPE_SECRET_KEY'],
    })
  }

  if (data.STRIPE_PUBLISHABLE_KEY && !data.STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'STRIPE_PUBLISHABLE_KEY must start with pk_test_ or pk_live_',
      path: ['STRIPE_PUBLISHABLE_KEY'],
    })
  }

  if (data.STRIPE_WEBHOOK_SECRET && !data.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'STRIPE_WEBHOOK_SECRET must start with whsec_',
      path: ['STRIPE_WEBHOOK_SECRET'],
    })
  }

  // Ensure Resend API key has correct format if not in development
  if (data.NODE_ENV === 'production' && data.RESEND_API_KEY && !data.RESEND_API_KEY.startsWith('re_')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'RESEND_API_KEY must start with re_ in production',
      path: ['RESEND_API_KEY'],
    })
  }

  // Warn if using SQLite in production
  if (data.NODE_ENV === 'production' && data.DATABASE_URL.startsWith('file:')) {
    console.warn('WARNING: Using SQLite in production is not recommended. Consider PostgreSQL.')
  }

  // Ensure direct database URL is set if using pooling
  if (data.DATABASE_URL.includes('pgbouncer') && !data.DIRECT_DATABASE_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'DIRECT_DATABASE_URL is required when using connection pooling (pgbouncer)',
      path: ['DIRECT_DATABASE_URL'],
    })
  }

  // Warn if test Stripe keys are used in production
  if (data.NODE_ENV === 'production' && data.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
    console.warn('WARNING: Using Stripe test keys in production environment!')
  }
})

// Parse and validate environment variables
const parsed = refinedSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error('Error details:', JSON.stringify(parsed.error.format(), null, 2))
  console.error('Environment context:', {
    NODE_ENV: process.env.NODE_ENV,
    hasDatabase: !!process.env.DATABASE_URL,
    hasAuth: !!process.env.NEXTAUTH_SECRET
  })

  // During build or startup, log but don't throw to avoid blocking
  const isBuildTime = process.env.npm_lifecycle_event === 'build'
  const isStartTime = process.env.npm_lifecycle_event === 'start'
  const isProduction = process.env.NODE_ENV === 'production'

  if (isBuildTime || (isStartTime && isProduction)) {
    console.warn('⚠️ Continuing despite environment validation errors...')
    console.warn('Note: Some features may not work correctly with invalid environment variables')
  } else {
    throw new Error('Invalid environment variables')
  }
}

// Export validated environment variables or fallback to process.env
export const env = parsed.success ? parsed.data : (process.env as any)

// Type-safe environment access
export type Env = z.infer<typeof envSchema>

// Helper to check if we're in production
export const isProduction = env.NODE_ENV === 'production'
export const isDevelopment = env.NODE_ENV === 'development'
export const isTest = env.NODE_ENV === 'test'

// Helper to check optional integrations
export const hasRedis = Boolean(env.REDIS_URL || (env.REDIS_HOST && env.REDIS_PORT))
export const hasSentry = Boolean(env.SENTRY_DSN)
export const hasCloudinary = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET)
export const hasTwilio = Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER)
export const hasGoogleMaps = Boolean(env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || env.GOOGLE_MAPS_API_KEY)
export const hasStripe = Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PUBLISHABLE_KEY)
export const hasFacebook = Boolean(env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET)
export const hasInstagram = Boolean(env.INSTAGRAM_ACCOUNT_ID && hasFacebook)
export const hasPostHog = Boolean(env.NEXT_PUBLIC_POSTHOG_KEY && env.NEXT_PUBLIC_POSTHOG_HOST)
export const hasAWS = Boolean(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_REGION)
export const hasGoogleAnalytics = Boolean(env.NEXT_PUBLIC_GA_ID || env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
export const hasEmail = Boolean(env.RESEND_API_KEY || (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS))

// Helper to check if email service is properly configured
export const isEmailServiceConfigured = () => {
  if (env.RESEND_API_KEY && env.RESEND_API_KEY !== 'dev-mode' && !env.RESEND_API_KEY.startsWith('test-')) {
    return true
  }
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    return true
  }
  return false
}

// Helper to check if SMS service is properly configured
export const isSMSServiceConfigured = () => {
  return hasTwilio && !env.TWILIO_ACCOUNT_SID?.startsWith('AC0123')
}

// Helper to check if payment service is properly configured
export const isPaymentServiceConfigured = () => {
  return hasStripe && !env.STRIPE_SECRET_KEY?.includes('dummy')
}

// Helper to get integration status
export const getIntegrationStatus = () => ({
  redis: hasRedis,
  sentry: hasSentry,
  cloudinary: hasCloudinary,
  twilio: hasTwilio,
  googleMaps: hasGoogleMaps,
  stripe: hasStripe,
  facebook: hasFacebook,
  instagram: hasInstagram,
  postHog: hasPostHog,
  aws: hasAWS,
  googleAnalytics: hasGoogleAnalytics,
  email: isEmailServiceConfigured(),
  sms: isSMSServiceConfigured(),
  payments: isPaymentServiceConfigured(),
})

// Log environment status in development
if (isDevelopment) {
  const status = getIntegrationStatus()
  console.log('\n🔐 Environment Configuration Status')
  console.log('=====================================')
  console.log(`Environment: ${env.NODE_ENV}`)
  console.log(`Database: ${env.DATABASE_PROVIDER}`)
  console.log('\n📦 Integrations:')
  Object.entries(status).forEach(([name, enabled]) => {
    console.log(`  ${enabled ? '✅' : '❌'} ${name}`)
  })
  console.log('=====================================\n')
}
