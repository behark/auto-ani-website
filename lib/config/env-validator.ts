/**
 * Environment Variable Validator and Configuration
 * Provides validation and fallbacks for missing environment variables
 */

interface EnvConfig {
  // Database
  DATABASE_URL: string;
  DIRECT_DATABASE_URL: string;

  // Authentication
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;

  // Email
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
  ADMIN_EMAIL: string;

  // SMS
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;

  // Payments
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;

  // Optional
  GOOGLE_MAPS_API_KEY?: string;
  SENTRY_DSN?: string;
  NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;
}

class EnvironmentValidator {
  private warnings: string[] = [];
  private errors: string[] = [];
  private config: Partial<EnvConfig> = {};

  constructor() {
    this.validateAndLoad();
  }

  private validateAndLoad() {
    // Required variables with fallbacks for development
    this.config.DATABASE_URL = this.getEnvVar('DATABASE_URL',
      'file:./prisma/dev.db',
      process.env.NODE_ENV === 'production');

    this.config.DIRECT_DATABASE_URL = this.getEnvVar('DIRECT_DATABASE_URL',
      this.config.DATABASE_URL!);

    this.config.NEXTAUTH_URL = this.getEnvVar('NEXTAUTH_URL',
      process.env.NODE_ENV === 'production' ? 'https://autosalonani.com' : 'http://localhost:3000');

    this.config.NEXTAUTH_SECRET = this.getEnvVar('NEXTAUTH_SECRET',
      'dev-secret-change-in-production',
      process.env.NODE_ENV === 'production');

    // Email configuration with fallbacks
    this.config.RESEND_API_KEY = this.getEnvVar('RESEND_API_KEY', 'dev-mode');
    this.config.FROM_EMAIL = this.getEnvVar('FROM_EMAIL', 'noreply@autosalonani.com');
    this.config.ADMIN_EMAIL = this.getEnvVar('ADMIN_EMAIL', 'aniautosallon@gmail.com');

    // SMS configuration with detection
    this.config.TWILIO_ACCOUNT_SID = this.getEnvVar('TWILIO_ACCOUNT_SID', '');
    this.config.TWILIO_AUTH_TOKEN = this.getEnvVar('TWILIO_AUTH_TOKEN', '');
    this.config.TWILIO_PHONE_NUMBER = this.getEnvVar('TWILIO_PHONE_NUMBER', '+38349204242');

    // Payments with detection
    this.config.STRIPE_SECRET_KEY = this.getEnvVar('STRIPE_SECRET_KEY', '');
    this.config.STRIPE_PUBLISHABLE_KEY = this.getEnvVar('STRIPE_PUBLISHABLE_KEY', '');

    // Optional services
    this.config.GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    this.config.SENTRY_DSN = process.env.SENTRY_DSN;
    this.config.NEXT_PUBLIC_GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  }

  private getEnvVar(key: string, fallback: string = '', required: boolean = false): string {
    const value = process.env[key];

    if (!value || value.startsWith('dummy') || value.startsWith('test-') || value === 'your_' + key.toLowerCase()) {
      if (required && process.env.NODE_ENV === 'production') {
        this.errors.push(`Missing required environment variable: ${key}`);
        return fallback;
      }

      if (process.env.NODE_ENV === 'production') {
        this.warnings.push(`Using fallback for ${key}. Some features may be disabled.`);
      }

      return fallback;
    }

    return value;
  }

  public validate(): { valid: boolean; warnings: string[]; errors: string[] } {
    return {
      valid: this.errors.length === 0,
      warnings: this.warnings,
      errors: this.errors
    };
  }

  public getConfig(): Partial<EnvConfig> {
    return this.config;
  }

  // Feature availability checks
  public hasEmailService(): boolean {
    return !!(this.config.RESEND_API_KEY &&
              this.config.RESEND_API_KEY !== 'dev-mode' &&
              !this.config.RESEND_API_KEY.startsWith('test-'));
  }

  public hasSMSService(): boolean {
    return !!(this.config.TWILIO_ACCOUNT_SID &&
              this.config.TWILIO_AUTH_TOKEN &&
              !this.config.TWILIO_ACCOUNT_SID.startsWith('AC0123'));
  }

  public hasPaymentService(): boolean {
    return !!(this.config.STRIPE_SECRET_KEY &&
              this.config.STRIPE_PUBLISHABLE_KEY &&
              !this.config.STRIPE_SECRET_KEY.includes('dummy'));
  }

  public hasMapsService(): boolean {
    return !!(this.config.GOOGLE_MAPS_API_KEY &&
              !this.config.GOOGLE_MAPS_API_KEY.includes('dummy'));
  }

  public hasAnalytics(): boolean {
    return !!(this.config.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
              this.config.SENTRY_DSN);
  }

  // Get service status for dashboard/monitoring
  public getServiceStatus() {
    return {
      database: true, // Always true if app is running
      email: this.hasEmailService(),
      sms: this.hasSMSService(),
      payments: this.hasPaymentService(),
      maps: this.hasMapsService(),
      analytics: this.hasAnalytics(),
    };
  }

  // Log validation results
  public logStatus() {
    const validation = this.validate();
    const status = this.getServiceStatus();

    console.log('\n📋 Environment Configuration Status');
    console.log('=====================================');

    if (validation.valid) {
      console.log('✅ Configuration is valid');
    } else {
      console.log('❌ Configuration has errors:');
      validation.errors.forEach(e => console.log(`  - ${e}`));
    }

    if (validation.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      validation.warnings.forEach(w => console.log(`  - ${w}`));
    }

    console.log('\n🔌 Service Availability:');
    Object.entries(status).forEach(([service, available]) => {
      const icon = available ? '✅' : '❌';
      const status = available ? 'Active' : 'Disabled';
      console.log(`  ${icon} ${service.charAt(0).toUpperCase() + service.slice(1)}: ${status}`);
    });

    console.log('=====================================\n');
  }
}

// Create singleton instance
const envValidator = new EnvironmentValidator();

// Log status in development
if (process.env.NODE_ENV === 'development') {
  envValidator.logStatus();
}

export default envValidator;
export const envConfig = envValidator.getConfig();
export const serviceStatus = envValidator.getServiceStatus();