/**
 * Comprehensive Environment Variable Validation
 * Validates ALL required and optional environment variables for production-readiness
 *
 * SECURITY CHECKS:
 * - Ensures all critical secrets are set and meet minimum length requirements
 * - Detects test/placeholder values in production
 * - Validates API key formats
 * - Warns about insecure configurations
 */

// Required environment variables (must be set)
const requiredEnvVars = [
  'NEXTAUTH_SECRET',
  'DATABASE_URL',
] as const;

// Optional but recommended environment variables
const recommendedEnvVars = [
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SITE_URL',
] as const;

// API Integration environment variables
const apiIntegrationVars = {
  stripe: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'],
  twilio: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
  googleMaps: ['GOOGLE_MAPS_API_KEY'],
  facebook: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET', 'FACEBOOK_ACCESS_TOKEN', 'FACEBOOK_PAGE_ID'],
  instagram: ['INSTAGRAM_ACCOUNT_ID'],
  email: ['RESEND_API_KEY', 'FROM_EMAIL', 'ADMIN_EMAIL'],
  redis: ['REDIS_URL'],
} as const;

interface ValidationError {
  variable: string;
  type: 'missing' | 'invalid_format' | 'too_short';
  message: string;
}

interface ValidationWarning {
  variable: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  integrations: {
    enabled: string[];
    disabled: string[];
  };
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate API key format (Stripe)
 */
function isValidStripeKey(key: string, type: 'secret' | 'publishable'): boolean {
  if (type === 'secret') {
    return key.startsWith('sk_test_') || key.startsWith('sk_live_');
  }
  return key.startsWith('pk_test_') || key.startsWith('pk_live_');
}

/**
 * Validate phone number format (E.164)
 */
function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Check if an integration is configured
 */
function isIntegrationConfigured(vars: readonly string[]): boolean {
  return vars.every(varName => !!process.env[varName]);
}

/**
 * Detect placeholder/insecure values in production
 */
function hasPlaceholderValue(value: string): boolean {
  const placeholderPatterns = [
    /your[_-]?/i,
    /generate[_-]?with/i,
    /placeholder/i,
    /example/i,
    /test[_-]?value/i,
    /change[_-]?me/i,
    /replace[_-]?me/i,
    /xxx+/i,
    /todo/i,
  ];

  return placeholderPatterns.some(pattern => pattern.test(value));
}

/**
 * Validate environment variables
 */
export function validateEnvironmentVariables(): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const enabledIntegrations: string[] = [];
  const disabledIntegrations: string[] = [];

  // Validate required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      errors.push({
        variable: varName,
        type: 'missing',
        message: `Required environment variable ${varName} is not set`
      });
    } else {
      const value = process.env[varName]!;

      // Check for placeholder values in production
      if (process.env.NODE_ENV === 'production' && hasPlaceholderValue(value)) {
        errors.push({
          variable: varName,
          type: 'invalid_format',
          message: `${varName} contains placeholder value in production. Use a real secret!`
        });
      }

      // Additional validation for specific variables
      if (varName === 'NEXTAUTH_SECRET') {
        if (value.length < 32) {
          errors.push({
            variable: varName,
            type: 'too_short',
            message: 'NEXTAUTH_SECRET must be at least 32 characters long. Generate with: openssl rand -base64 32'
          });
        }

        // Check for weak/common secrets
        if (['secret', 'password', '123456'].some(weak => value.toLowerCase().includes(weak))) {
          errors.push({
            variable: varName,
            type: 'invalid_format',
            message: 'NEXTAUTH_SECRET is too weak. Use: openssl rand -base64 32'
          });
        }
      }

      if (varName === 'DATABASE_URL' && value.startsWith('file:') && process.env.NODE_ENV === 'production') {
        warnings.push({
          variable: varName,
          message: 'Using SQLite (file:) database in production is not recommended. Consider PostgreSQL.'
        });
      }
    }
  }

  // Validate recommended variables
  for (const varName of recommendedEnvVars) {
    if (!process.env[varName]) {
      warnings.push({
        variable: varName,
        message: `Recommended variable ${varName} is not set`
      });
    } else if (varName.includes('URL') && !isValidUrl(process.env[varName]!)) {
      warnings.push({
        variable: varName,
        message: `${varName} appears to be invalid URL format`
      });
    }
  }

  // Validate Stripe integration
  if (isIntegrationConfigured(apiIntegrationVars.stripe)) {
    enabledIntegrations.push('Stripe Payment Processing');

    const secretKey = process.env.STRIPE_SECRET_KEY!;
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY!;

    if (!isValidStripeKey(secretKey, 'secret')) {
      errors.push({
        variable: 'STRIPE_SECRET_KEY',
        type: 'invalid_format',
        message: 'STRIPE_SECRET_KEY must start with sk_test_ or sk_live_'
      });
    }

    if (!isValidStripeKey(publishableKey, 'publishable')) {
      errors.push({
        variable: 'STRIPE_PUBLISHABLE_KEY',
        type: 'invalid_format',
        message: 'STRIPE_PUBLISHABLE_KEY must start with pk_test_ or pk_live_'
      });
    }

    if (secretKey.startsWith('sk_test_') && process.env.NODE_ENV === 'production') {
      warnings.push({
        variable: 'STRIPE_SECRET_KEY',
        message: 'Using Stripe test key in production environment'
      });
    }
  } else {
    disabledIntegrations.push('Stripe Payment Processing');
  }

  // Validate Twilio integration
  if (isIntegrationConfigured(apiIntegrationVars.twilio)) {
    enabledIntegrations.push('Twilio SMS');

    const phoneNumber = process.env.TWILIO_PHONE_NUMBER!;
    if (!isValidPhoneNumber(phoneNumber)) {
      errors.push({
        variable: 'TWILIO_PHONE_NUMBER',
        type: 'invalid_format',
        message: 'TWILIO_PHONE_NUMBER must be in E.164 format (e.g., +383XXXXXXXX)'
      });
    }
  } else {
    disabledIntegrations.push('Twilio SMS');
  }

  // Validate Google Maps integration
  if (isIntegrationConfigured(apiIntegrationVars.googleMaps)) {
    enabledIntegrations.push('Google Maps');
  } else {
    disabledIntegrations.push('Google Maps');
  }

  // Validate Facebook integration
  if (isIntegrationConfigured(apiIntegrationVars.facebook)) {
    enabledIntegrations.push('Facebook');
  } else {
    disabledIntegrations.push('Facebook');
  }

  // Validate Instagram integration
  if (isIntegrationConfigured(apiIntegrationVars.instagram) && isIntegrationConfigured(apiIntegrationVars.facebook)) {
    enabledIntegrations.push('Instagram');
  } else if (isIntegrationConfigured(apiIntegrationVars.instagram)) {
    warnings.push({
      variable: 'INSTAGRAM_ACCOUNT_ID',
      message: 'Instagram configured but Facebook integration is incomplete'
    });
  } else {
    disabledIntegrations.push('Instagram');
  }

  // Validate Email integration
  if (isIntegrationConfigured(apiIntegrationVars.email)) {
    enabledIntegrations.push('Email (Resend)');

    const fromEmail = process.env.FROM_EMAIL!;
    const adminEmail = process.env.ADMIN_EMAIL!;

    if (!isValidEmail(fromEmail)) {
      errors.push({
        variable: 'FROM_EMAIL',
        type: 'invalid_format',
        message: 'FROM_EMAIL must be a valid email address'
      });
    }

    if (!isValidEmail(adminEmail)) {
      errors.push({
        variable: 'ADMIN_EMAIL',
        type: 'invalid_format',
        message: 'ADMIN_EMAIL must be a valid email address'
      });
    }
  } else {
    disabledIntegrations.push('Email (Resend)');
    warnings.push({
      variable: 'RESEND_API_KEY',
      message: 'Email service not configured - contact forms will not work'
    });
  }

  // Validate Redis integration
  if (isIntegrationConfigured(apiIntegrationVars.redis)) {
    enabledIntegrations.push('Redis Cache & Rate Limiting');
  } else {
    disabledIntegrations.push('Redis Cache & Rate Limiting');
    warnings.push({
      variable: 'REDIS_URL',
      message: 'Redis not configured - using in-memory fallback (not suitable for production)'
    });
  }

  // Validate JWT secret
  if (!process.env.JWT_SECRET) {
    warnings.push({
      variable: 'JWT_SECRET',
      message: 'JWT_SECRET not set - authentication may not work properly'
    });
  } else if (process.env.JWT_SECRET.length < 32) {
    warnings.push({
      variable: 'JWT_SECRET',
      message: 'JWT_SECRET should be at least 32 characters long'
    });
  }

  // Validate rate limiting configuration
  if (process.env.RATE_LIMIT_ENABLED === 'true' && !process.env.REDIS_URL) {
    warnings.push({
      variable: 'RATE_LIMIT_ENABLED',
      message: 'Rate limiting enabled but Redis not configured - rate limiting will be per-instance only'
    });
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    integrations: {
      enabled: enabledIntegrations,
      disabled: disabledIntegrations
    }
  };
}

/**
 * Print validation results
 */
function printValidationResults(result: ValidationResult): void {
  console.info('\n========================================');
  console.info('🔍 Environment Validation Results');
  console.info('========================================\n');

  if (result.valid) {
    console.info('✅ All required environment variables are set\n');
  } else {
    console.info('❌ Environment validation failed\n');
    console.info('Errors:');
    result.errors.forEach(error => {
      console.info(`  ❌ ${error.variable}: ${error.message}`);
    });
    console.info('');
  }

  if (result.warnings.length > 0) {
    console.info('⚠️  Warnings:');
    result.warnings.forEach(warning => {
      console.info(`  ⚠️  ${warning.variable}: ${warning.message}`);
    });
    console.info('');
  }

  console.info('📊 Integrations Status:');
  console.info('\n✅ Enabled:');
  if (result.integrations.enabled.length > 0) {
    result.integrations.enabled.forEach(integration => {
      console.info(`  ✓ ${integration}`);
    });
  } else {
    console.info('  (none)');
  }

  console.info('\n❌ Disabled:');
  if (result.integrations.disabled.length > 0) {
    result.integrations.disabled.forEach(integration => {
      console.info(`  ✗ ${integration}`);
    });
  } else {
    console.info('  (none)');
  }

  console.info('\n========================================\n');
}

/**
 * Run validation and throw on errors (production)
 */
function validateOrThrow(): void {
  const result = validateEnvironmentVariables();
  printValidationResults(result);

  if (!result.valid) {
    throw new Error(
      `Environment validation failed:\n${result.errors.map(e => `  - ${e.variable}: ${e.message}`).join('\n')}\n\n` +
      'Please check your .env file or environment configuration.'
    );
  }

  // In production, also fail on critical warnings
  if (process.env.NODE_ENV === 'production') {
    const criticalWarnings = result.warnings.filter(w =>
      w.variable === 'REDIS_URL' ||
      w.variable.includes('STRIPE') ||
      w.variable.includes('DATABASE_URL')
    );

    if (criticalWarnings.length > 0) {
      console.error('\n⚠️  Critical warnings detected in production:');
      criticalWarnings.forEach(w => {
        console.error(`  ⚠️  ${w.variable}: ${w.message}`);
      });
      console.error('\nProceeding anyway, but these should be addressed.\n');
    }
  }
}

// Run validation when module is imported
if (process.env.NODE_ENV !== 'test') {
  validateOrThrow();
}

export { validateOrThrow, printValidationResults };
export type { ValidationResult, ValidationError, ValidationWarning };