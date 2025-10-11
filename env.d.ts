/// <reference types="node" />

/**
 * Type definitions for environment variables
 *
 * IMPORTANT: This file provides TypeScript type hints only.
 * Actual runtime validation is done in lib/env.ts using Zod.
 *
 * To access environment variables in your code:
 * - Server-side: import { env } from '@/lib/env'
 * - Client-side: import { clientEnv } from '@/lib/env.client'
 */

declare namespace NodeJS {
  interface ProcessEnv {
    // Node Environment
    NODE_ENV: 'development' | 'production' | 'test';

    // Database
    DATABASE_URL: string;
    DIRECT_DATABASE_URL?: string;
    DATABASE_PROVIDER?: 'sqlite' | 'postgresql';
    DATABASE_POOL_SIZE?: string;
    DATABASE_CONNECT_TIMEOUT?: string;
    DATABASE_QUERY_TIMEOUT?: string;
    DATABASE_POOL_TIMEOUT?: string;
    DATABASE_IDLE_TIMEOUT?: string;
    DATABASE_STATEMENT_TIMEOUT?: string;
    DATABASE_HEALTH_CHECK_INTERVAL?: string;
    DATABASE_POOL_STATS?: string;
    DATABASE_DEBUG?: string;

    // Redis
    REDIS_URL?: string;
    REDIS_HOST?: string;
    REDIS_PORT?: string;
    REDIS_PASSWORD?: string;
    REDIS_TOKEN?: string;

    // Authentication
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
    JWT_SECRET: string;
    SESSION_SECRET?: string;
    ENCRYPTION_KEY?: string;

    // Admin Authentication
    ADMIN_EMAIL: string;
    ADMIN_PASSWORD_HASH?: string;
    ADMIN_API_KEY?: string;

    // Email Configuration (Resend)
    RESEND_API_KEY: string;
    FROM_EMAIL: string;

    // Email Alternative (SMTP)
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_USER?: string;
    SMTP_PASS?: string;
    EMAIL_FROM?: string;

    // SMS Configuration (Twilio)
    TWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
    TWILIO_PHONE_NUMBER?: string;
    SMS_RATE_LIMIT?: string;

    // Payment Gateway (Stripe)
    STRIPE_SECRET_KEY: string;
    STRIPE_PUBLISHABLE_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    PAYMENT_CURRENCY?: string;
    DEPOSIT_PERCENTAGE?: string;
    MIN_DEPOSIT_AMOUNT?: string;

    // Google Services
    GOOGLE_MAPS_API_KEY?: string;
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
    GOOGLE_ANALYTICS_ID?: string;
    NEXT_PUBLIC_GA_ID?: string;
    NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    DEALERSHIP_ADDRESS?: string;
    DEALERSHIP_LATITUDE?: string;
    DEALERSHIP_LONGITUDE?: string;

    // Social Media - Facebook/Instagram
    FACEBOOK_APP_ID?: string;
    FACEBOOK_APP_SECRET?: string;
    FACEBOOK_ACCESS_TOKEN?: string;
    FACEBOOK_PAGE_ACCESS_TOKEN?: string;
    FACEBOOK_PAGE_ID?: string;
    FACEBOOK_API_KEY?: string;
    INSTAGRAM_ACCOUNT_ID?: string;
    INSTAGRAM_ACCESS_TOKEN?: string;
    INSTAGRAM_API_KEY?: string;
    INSTAGRAM_CLIENT_ID?: string;
    INSTAGRAM_CLIENT_SECRET?: string;
    AUTO_POST_NEW_VEHICLES?: string;
    POST_SCHEDULE_HOUR?: string;

    // Social Media - Twitter/LinkedIn
    TWITTER_API_KEY?: string;
    TWITTER_API_SECRET?: string;
    TWITTER_BEARER_TOKEN?: string;
    LINKEDIN_CLIENT_ID?: string;
    LINKEDIN_CLIENT_SECRET?: string;

    // Analytics & Monitoring - Sentry
    SENTRY_DSN?: string;
    NEXT_PUBLIC_SENTRY_DSN?: string;
    SENTRY_ORG?: string;
    SENTRY_PROJECT?: string;
    SENTRY_AUTH_TOKEN?: string;
    NEXT_PUBLIC_SENTRY_RELEASE?: string;
    SENTRY_RELEASE?: string;
    NEXT_PUBLIC_SENTRY_DEV_MODE?: string;
    SENTRY_DEV_MODE?: string;

    // Analytics & Monitoring - PostHog
    NEXT_PUBLIC_POSTHOG_KEY?: string;
    NEXT_PUBLIC_POSTHOG_HOST?: string;
    POSTHOG_API_KEY?: string;
    POSTHOG_HOST?: string;

    // CDN & Storage - Cloudinary
    CLOUDINARY_URL?: string;
    CLOUDINARY_CLOUD_NAME?: string;
    CLOUDINARY_API_KEY?: string;
    CLOUDINARY_API_SECRET?: string;

    // CDN & Storage - AWS S3
    AWS_S3_BUCKET_NAME?: string;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    AWS_REGION?: string;
    S3_BUCKET?: string;
    BACKUP_BUCKET?: string;
    BACKUP_RETENTION_DAYS?: string;

    // WhatsApp
    NEXT_PUBLIC_WHATSAPP_NUMBER: string;
    NEXT_PUBLIC_WHATSAPP_MESSAGE?: string;

    // Site Configuration
    NEXT_PUBLIC_SITE_URL: string;
    NEXT_PUBLIC_APP_URL?: string;
    NEXT_PUBLIC_API_URL?: string;
    NEXT_PUBLIC_SITE_NAME?: string;
    NEXT_PUBLIC_SITE_DESCRIPTION?: string;
    CDN_URL?: string;

    // Feature Flags
    NEXT_PUBLIC_ENABLE_SW?: string;
    ENABLE_PERFORMANCE_MONITORING?: string;
    ENABLE_ANALYTICS?: string;
    ENABLE_MONITORING?: string;
    ENABLE_EMAIL_NOTIFICATIONS?: string;
    ENABLE_SMS_NOTIFICATIONS?: string;
    ENABLE_PUSH_NOTIFICATIONS?: string;

    // Progressive Web App
    PWA_SHORT_NAME?: string;
    PWA_NAME?: string;
    PWA_DESCRIPTION?: string;
    PWA_THEME_COLOR?: string;
    PWA_BACKGROUND_COLOR?: string;
    NEXT_PUBLIC_VAPID_PUBLIC_KEY?: string;
    VAPID_PRIVATE_KEY?: string;
    VAPID_SUBJECT?: string;

    // Security
    HEALTH_CHECK_API_KEY?: string;
    RATE_LIMIT_ENABLED?: string;
    RATE_LIMIT_WINDOW_MS?: string;
    RATE_LIMIT_MAX_REQUESTS?: string;
    RATE_LIMIT_WINDOW?: string;
    RATE_LIMIT_MAX?: string;

    // Webhook Configuration
    WEBHOOK_SECRET?: string;
    WEBHOOK_ENDPOINT?: string;
    WEBHOOK_RETRY_ATTEMPTS?: string;
    WEBHOOK_TIMEOUT_MS?: string;
    DISABLE_WEBHOOK_AFTER_FAILURES?: string;

    // Queue Management
    QUEUE_CONCURRENCY?: string;
    QUEUE_MAX_RETRIES?: string;

    // Marketing Campaign Limits
    MAX_EMAIL_BATCH_SIZE?: string;
    MAX_SMS_BATCH_SIZE?: string;
    EMAIL_RATE_LIMIT?: string;

    // A/B Testing
    AB_TEST_AUTO_CONCLUDE?: string;
    AB_TEST_MIN_CONFIDENCE?: string;
    AB_TEST_MIN_SAMPLE_SIZE?: string;

    // Analytics
    ANALYTICS_RETENTION_DAYS?: string;
    DAILY_AGGREGATION_ENABLED?: string;
    NEXT_PUBLIC_APP_VERSION?: string;

    // Lead Scoring Weights
    LEAD_SCORE_WEBSITE_VISIT?: string;
    LEAD_SCORE_VEHICLE_VIEW?: string;
    LEAD_SCORE_INQUIRY?: string;
    LEAD_SCORE_TEST_DRIVE?: string;
    LEAD_SCORE_EMAIL_OPEN?: string;
    LEAD_SCORE_EMAIL_CLICK?: string;

    // Performance Monitoring
    PERFORMANCE_THRESHOLD_FCP?: string;
    PERFORMANCE_THRESHOLD_LCP?: string;
    PERFORMANCE_THRESHOLD_FID?: string;
    PERFORMANCE_THRESHOLD_CLS?: string;
    MAX_BUNDLE_SIZE?: string;
    MAX_PAGE_SIZE?: string;

    // Vehicle APIs (Optional)
    VEHICLE_API_KEY?: string;
    VEHICLE_API_URL?: string;

    // Deployment Platforms
    RENDER_API_KEY?: string;
    RENDER_SERVICE_ID?: string;
    VERCEL_TOKEN?: string;
    VERCEL_PROJECT_ID?: string;
    VERCEL_ORG_ID?: string;
    RAILWAY_TOKEN?: string;
    RAILWAY_PROJECT_ID?: string;

    // Slack Notifications
    SLACK_WEBHOOK_URL?: string;
    SLACK_SECURITY_WEBHOOK?: string;

    // Logging
    LOG_LEVEL?: 'error' | 'warn' | 'info' | 'debug';

    // reCAPTCHA
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY?: string;
    RECAPTCHA_SECRET_KEY?: string;

    // Facebook Pixel
    NEXT_PUBLIC_FB_PIXEL_ID?: string;

    // Development & Build
    ANALYZE?: string;
    NEXT_TELEMETRY_DISABLED?: string;
    NEXT_RUNTIME?: 'nodejs' | 'edge';
  }
}

// Global window declarations
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    fbq: (...args: any[]) => void;
  }
}

// Ensure this file is treated as a module
export {};