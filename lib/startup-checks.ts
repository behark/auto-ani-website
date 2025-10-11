import { env, hasRedis, hasSentry, hasCloudinary, hasTwilio, hasGoogleMaps, hasStripe, getIntegrationStatus, isEmailServiceConfigured, isSMSServiceConfigured, isPaymentServiceConfigured } from './env'
import { logger } from './logger'

/**
 * Startup Checks for AUTO ANI Website
 *
 * Validates critical environment variables and service availability
 * Runs before the application starts to ensure all dependencies are ready
 */

interface StartupCheckResult {
  success: boolean
  errors: string[]
  warnings: string[]
  integrations: {
    enabled: string[]
    disabled: string[]
  }
}

export async function runStartupChecks(): Promise<StartupCheckResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const enabledIntegrations: string[] = []
  const disabledIntegrations: string[] = []

  logger.info('🚀 Running startup checks...')

  // Check critical environment variables
  const criticalVars = {
    'Database URL': env.DATABASE_URL,
    'NextAuth Secret': env.NEXTAUTH_SECRET,
    'NextAuth URL': env.NEXTAUTH_URL,
    'JWT Secret': env.JWT_SECRET,
    'Email API Key': env.RESEND_API_KEY,
    'From Email': env.FROM_EMAIL,
    'Admin Email': env.ADMIN_EMAIL,
    'Stripe Secret Key': env.STRIPE_SECRET_KEY,
    'WhatsApp Number': env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    'Site URL': env.NEXT_PUBLIC_SITE_URL,
  }

  logger.info('🔍 Checking critical environment variables...')
  for (const [name, value] of Object.entries(criticalVars)) {
    if (!value || value === '') {
      errors.push(`Missing critical environment variable: ${name}`)
      logger.error(`❌ Missing: ${name}`)
    } else {
      logger.info(`✅ ${name}: Set`)
    }
  }

  // Check for placeholder values in production
  if (env.NODE_ENV === 'production') {
    logger.info('🔒 Checking for placeholder values in production...')

    const placeholderPatterns = [
      /your[_-]?/i,
      /generate[_-]?with/i,
      /placeholder/i,
      /example/i,
      /test[_-]?value/i,
      /change[_-]?me/i,
      /replace[_-]?me/i,
      /xxx+/i,
      /dummy/i,
      /dev-mode/i,
    ]

    const checkForPlaceholder = (key: string, value: string | undefined) => {
      if (!value) return
      for (const pattern of placeholderPatterns) {
        if (pattern.test(value)) {
          errors.push(`${key} contains placeholder value in production: ${value.substring(0, 20)}...`)
          logger.error(`❌ Placeholder detected in ${key}`)
          return
        }
      }
    }

    checkForPlaceholder('NEXTAUTH_SECRET', env.NEXTAUTH_SECRET)
    checkForPlaceholder('JWT_SECRET', env.JWT_SECRET)
    checkForPlaceholder('RESEND_API_KEY', env.RESEND_API_KEY)
    checkForPlaceholder('STRIPE_SECRET_KEY', env.STRIPE_SECRET_KEY)
  }

  // Check secret lengths
  logger.info('📏 Checking secret lengths...')
  if (env.NEXTAUTH_SECRET.length < 32) {
    errors.push('NEXTAUTH_SECRET must be at least 32 characters')
    logger.error('❌ NEXTAUTH_SECRET too short')
  } else {
    logger.info('✅ NEXTAUTH_SECRET: Valid length')
  }

  if (env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters')
    logger.error('❌ JWT_SECRET too short')
  } else {
    logger.info('✅ JWT_SECRET: Valid length')
  }

  if (env.ENCRYPTION_KEY && env.ENCRYPTION_KEY.length !== 32) {
    warnings.push('ENCRYPTION_KEY should be exactly 32 characters')
    logger.warn('⚠️  ENCRYPTION_KEY invalid length')
  }

  // Check database configuration
  logger.info('🗄️  Checking database configuration...')
  if (env.NODE_ENV === 'production' && env.DATABASE_URL.startsWith('file:')) {
    warnings.push('Using SQLite in production is not recommended. Consider PostgreSQL.')
    logger.warn('⚠️  SQLite in production')
  }

  if (env.DATABASE_URL.includes('pgbouncer') && !env.DIRECT_DATABASE_URL) {
    errors.push('DIRECT_DATABASE_URL required when using connection pooling')
    logger.error('❌ Missing DIRECT_DATABASE_URL for pooling')
  }

  // Test database connection
  try {
    logger.info('🔌 Testing database connection...')
    const { prisma } = await import('./prisma')
    await prisma.$queryRaw`SELECT 1`
    logger.info('✅ Database connection successful')
  } catch (error) {
    errors.push('Database connection failed')
    logger.error('❌ Database connection failed', {}, error as Error)
  }

  // Check integrations
  logger.info('📦 Checking optional integrations...')
  const integrations = getIntegrationStatus()

  // Redis
  if (hasRedis) {
    enabledIntegrations.push('Redis Cache & Queue')
    logger.info('✅ Redis: Enabled')

    // Test Redis connection if possible
    try {
      const redisModule = await import('./redis')
      const redis = redisModule.redis || redisModule.default
      if (redis) {
        await redis.ping()
        logger.info('✅ Redis connection successful')
      }
    } catch (error) {
      warnings.push('Redis configured but connection failed')
      logger.warn('⚠️  Redis connection failed', { error: (error as Error).message })
    }
  } else {
    disabledIntegrations.push('Redis Cache & Queue')
    logger.info('❌ Redis: Disabled (using in-memory fallback)')
    if (env.NODE_ENV === 'production') {
      warnings.push('Redis not configured - rate limiting and caching will be per-instance only')
    }
  }

  // Email Service
  if (isEmailServiceConfigured()) {
    enabledIntegrations.push('Email Service')
    logger.info('✅ Email: Enabled')
  } else {
    disabledIntegrations.push('Email Service')
    logger.info('❌ Email: Disabled')
    warnings.push('Email service not properly configured - contact forms will not work')
  }

  // Stripe Payments
  if (isPaymentServiceConfigured()) {
    enabledIntegrations.push('Stripe Payments')
    logger.info('✅ Stripe: Enabled')

    // Warn if using test keys in production
    if (env.NODE_ENV === 'production' && env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
      warnings.push('Using Stripe test keys in production!')
      logger.warn('⚠️  Stripe test keys in production')
    }
  } else {
    disabledIntegrations.push('Stripe Payments')
    logger.info('❌ Stripe: Disabled')
  }

  // Twilio SMS
  if (isSMSServiceConfigured()) {
    enabledIntegrations.push('Twilio SMS')
    logger.info('✅ Twilio: Enabled')
  } else {
    disabledIntegrations.push('Twilio SMS')
    logger.info('❌ Twilio: Disabled')
  }

  // Google Maps
  if (hasGoogleMaps) {
    enabledIntegrations.push('Google Maps')
    logger.info('✅ Google Maps: Enabled')
  } else {
    disabledIntegrations.push('Google Maps')
    logger.info('❌ Google Maps: Disabled')
  }

  // Sentry Monitoring
  if (hasSentry) {
    enabledIntegrations.push('Sentry Error Tracking')
    logger.info('✅ Sentry: Enabled')
  } else {
    disabledIntegrations.push('Sentry Error Tracking')
    logger.info('❌ Sentry: Disabled')
  }

  // Cloudinary
  if (hasCloudinary) {
    enabledIntegrations.push('Cloudinary Image Storage')
    logger.info('✅ Cloudinary: Enabled')
  } else {
    disabledIntegrations.push('Cloudinary Image Storage')
    logger.info('❌ Cloudinary: Disabled')
  }

  // Google Analytics
  if (integrations.googleAnalytics) {
    enabledIntegrations.push('Google Analytics')
    logger.info('✅ Google Analytics: Enabled')
  } else {
    disabledIntegrations.push('Google Analytics')
    logger.info('❌ Google Analytics: Disabled')
  }

  // Facebook/Instagram
  if (integrations.facebook) {
    enabledIntegrations.push('Facebook Integration')
    logger.info('✅ Facebook: Enabled')
  } else {
    disabledIntegrations.push('Facebook Integration')
    logger.info('❌ Facebook: Disabled')
  }

  if (integrations.instagram) {
    enabledIntegrations.push('Instagram Integration')
    logger.info('✅ Instagram: Enabled')
  } else {
    disabledIntegrations.push('Instagram Integration')
    logger.info('❌ Instagram: Disabled')
  }

  // PostHog
  if (integrations.postHog) {
    enabledIntegrations.push('PostHog Analytics')
    logger.info('✅ PostHog: Enabled')
  } else {
    disabledIntegrations.push('PostHog Analytics')
    logger.info('❌ PostHog: Disabled')
  }

  // AWS
  if (integrations.aws) {
    enabledIntegrations.push('AWS S3 Storage')
    logger.info('✅ AWS: Enabled')
  } else {
    disabledIntegrations.push('AWS S3 Storage')
    logger.info('❌ AWS: Disabled')
  }

  // Print summary
  logger.info('\n========================================')
  logger.info('📊 Startup Checks Summary')
  logger.info('========================================')

  if (errors.length === 0) {
    logger.info('✅ All critical checks passed')
  } else {
    logger.error(`❌ ${errors.length} critical error(s) found:`)
    errors.forEach((error) => logger.error(`  • ${error}`))
  }

  if (warnings.length > 0) {
    logger.warn(`\n⚠️  ${warnings.length} warning(s):`)
    warnings.forEach((warning) => logger.warn(`  • ${warning}`))
  }

  logger.info('\n📦 Enabled Integrations:')
  if (enabledIntegrations.length > 0) {
    enabledIntegrations.forEach((integration) => logger.info(`  ✅ ${integration}`))
  } else {
    logger.info('  (none)')
  }

  logger.info('\n❌ Disabled Integrations:')
  if (disabledIntegrations.length > 0) {
    disabledIntegrations.forEach((integration) => logger.info(`  ❌ ${integration}`))
  } else {
    logger.info('  (none)')
  }

  logger.info('========================================\n')

  const success = errors.length === 0

  if (!success) {
    logger.error('❌ Startup checks failed. Please fix the errors above.')
    if (env.NODE_ENV === 'production') {
      throw new Error('Startup checks failed in production. Cannot start application.')
    }
  } else {
    logger.info('✅ All startup checks passed. Application ready to start.')
  }

  return {
    success,
    errors,
    warnings,
    integrations: {
      enabled: enabledIntegrations,
      disabled: disabledIntegrations,
    },
  }
}

/**
 * Quick health check for monitoring endpoints
 */
export async function quickHealthCheck(): Promise<{
  healthy: boolean
  database: boolean
  redis: boolean
  timestamp: string
}> {
  let databaseHealthy = false
  let redisHealthy = false

  // Check database
  try {
    const { prisma } = await import('./prisma')
    await prisma.$queryRaw`SELECT 1`
    databaseHealthy = true
  } catch (error) {
    logger.error('Database health check failed', {}, error as Error)
  }

  // Check Redis if configured
  if (hasRedis) {
    try {
      const redisModule = await import('./redis')
      const redis = redisModule.redis || redisModule.default
      if (redis) {
        await redis.ping()
        redisHealthy = true
      }
    } catch (error) {
      logger.error('Redis health check failed', {}, error as Error)
    }
  } else {
    // If Redis is not configured, don't fail health check
    redisHealthy = true
  }

  const healthy = databaseHealthy && redisHealthy

  return {
    healthy,
    database: databaseHealthy,
    redis: redisHealthy,
    timestamp: new Date().toISOString(),
  }
}
