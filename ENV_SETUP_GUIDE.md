# Environment Variables Setup Guide

## Overview

This guide explains how to configure environment variables for the AUTO ANI website. The application uses **Zod** for runtime validation to ensure all required variables are properly configured before the application starts.

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Generate required secrets:
   ```bash
   # Generate NEXTAUTH_SECRET (minimum 32 characters)
   openssl rand -base64 32

   # Generate JWT_SECRET (minimum 32 characters)
   openssl rand -base64 32

   # Generate ENCRYPTION_KEY (exactly 32 characters)
   openssl rand -base64 32 | head -c 32
   ```

3. Fill in the required variables in `.env.local`

4. Run the application:
   ```bash
   npm run dev
   ```

The application will validate all environment variables at startup and display errors if any required variables are missing or invalid.

## Required Variables

These variables **MUST** be set for the application to start:

### Database

```env
# SQLite (Development)
DATABASE_URL="file:/home/behar/auto-ani-website/prisma/dev.db"
DATABASE_PROVIDER="sqlite"

# PostgreSQL (Production)
DATABASE_URL="postgresql://user:password@host:5432/database"
DATABASE_PROVIDER="postgresql"
DIRECT_DATABASE_URL="postgresql://user:password@host:5432/database"  # Required for pooling
```

### Authentication

```env
NEXTAUTH_URL="http://localhost:3000"  # Your site URL
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"  # Minimum 32 characters
JWT_SECRET="<generate-with-openssl-rand-base64-32>"  # Minimum 32 characters
```

### Email Service

```env
RESEND_API_KEY="re_..."  # Must start with 're_'
FROM_EMAIL="contact@autosalonani.com"  # Valid email address
ADMIN_EMAIL="admin@autosalonani.com"  # Valid email address
```

### Payment Processing

```env
STRIPE_SECRET_KEY="sk_test_..."  # Must start with 'sk_test_' or 'sk_live_'
STRIPE_PUBLISHABLE_KEY="pk_test_..."  # Optional but recommended
STRIPE_WEBHOOK_SECRET="whsec_..."  # Optional, starts with 'whsec_'
```

### Site Configuration

```env
NEXT_PUBLIC_SITE_URL="https://autosalonani.com"  # Your public site URL
NEXT_PUBLIC_WHATSAPP_NUMBER="38349204242"  # WhatsApp contact number
```

## Optional Variables

These variables enable additional features but are not required:

### Redis Cache & Queue System

```env
# Option 1: Redis URL (Upstash, Railway, etc.)
REDIS_URL="redis://default:password@host:6379"

# Option 2: Redis connection details
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="your-password"
```

**Note:** Without Redis, the application uses in-memory storage, which is suitable for development but not recommended for production with multiple instances.

### SMS Notifications (Twilio)

```env
TWILIO_ACCOUNT_SID="AC..."  # Twilio Account SID
TWILIO_AUTH_TOKEN="..."  # Twilio Auth Token
TWILIO_PHONE_NUMBER="+383XXXXXXXX"  # Must be in E.164 format
```

### Google Maps Integration

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIza..."  # Google Maps API key
GOOGLE_MAPS_API_KEY="AIza..."  # Server-side Google Maps API key
```

### Error Tracking (Sentry)

```env
SENTRY_DSN="https://...@sentry.io/..."
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
SENTRY_ORG="your-org"
SENTRY_PROJECT="auto-ani-website"
SENTRY_AUTH_TOKEN="..."  # For source map uploads
```

### Analytics

```env
# Google Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# PostHog
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# Facebook Pixel
NEXT_PUBLIC_FB_PIXEL_ID="..."
```

### Image Storage (Cloudinary)

```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### Social Media Integration

```env
# Facebook
FACEBOOK_APP_ID="..."
FACEBOOK_APP_SECRET="..."
FACEBOOK_ACCESS_TOKEN="..."
FACEBOOK_PAGE_ID="..."

# Instagram (requires Facebook integration)
INSTAGRAM_ACCOUNT_ID="..."
```

## Environment Validation

The application uses Zod for runtime validation of environment variables. The validation happens in two places:

1. **Server-side validation** (`lib/env.ts`):
   - Validates all environment variables at application startup
   - Provides detailed error messages for missing or invalid variables
   - Exports type-safe environment object

2. **Client-side validation** (`lib/env.client.ts`):
   - Validates only `NEXT_PUBLIC_*` variables
   - Ensures client-side features are properly configured

### Accessing Environment Variables

**DON'T DO THIS:**
```typescript
// ❌ Direct access - no validation, no type safety
const apiKey = process.env.STRIPE_SECRET_KEY!
```

**DO THIS:**
```typescript
// ✅ Validated access with type safety
import { env } from '@/lib/env'
const apiKey = env.STRIPE_SECRET_KEY
```

**Client-side code:**
```typescript
// ✅ Client-side validated access
import { clientEnv } from '@/lib/env.client'
const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL
```

## Startup Checks

The application runs comprehensive startup checks before starting:

1. **Environment variable validation** - Ensures all required variables are set
2. **Database connection test** - Verifies database connectivity
3. **Redis connection test** (if configured) - Verifies Redis connectivity
4. **Integration status check** - Reports which integrations are enabled/disabled

View startup checks in `lib/startup-checks.ts`.

## Security Best Practices

### 1. Secret Generation

Always use cryptographically secure random values:

```bash
# NEXTAUTH_SECRET and JWT_SECRET (minimum 32 characters)
openssl rand -base64 32

# ENCRYPTION_KEY (exactly 32 characters)
openssl rand -base64 32 | head -c 32

# WEBHOOK_SECRET
openssl rand -hex 32

# ADMIN_API_KEY (minimum 32 characters)
openssl rand -base64 32
```

### 2. Secret Rotation

- Rotate secrets every 90 days in production
- Use different secrets for development and production
- Never commit secrets to version control
- Use `.env.local` for local development (automatically gitignored)

### 3. API Key Security

- Enable 2FA on all service provider accounts (Stripe, Twilio, etc.)
- Restrict API keys to specific domains/IP addresses when possible
- Use test keys in development, production keys only in production
- Monitor API usage for suspicious activity

### 4. Environment-Specific Configuration

**Development:**
```env
NODE_ENV="development"
DATABASE_URL="file:./prisma/dev.db"
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

**Production:**
```env
NODE_ENV="production"
DATABASE_URL="postgresql://..."
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_SITE_URL="https://autosalonani.com"
```

## Troubleshooting

### "Invalid environment variables" Error

The application validates environment variables at startup. If you see this error:

1. Check the console output for specific validation errors
2. Ensure all required variables are set
3. Verify variable formats (e.g., URLs must be valid URLs)
4. Check that secrets meet minimum length requirements

### "Database connection failed" Error

1. Verify `DATABASE_URL` is correct
2. Ensure database server is running
3. Check network connectivity
4. For PostgreSQL, verify SSL settings if required

### "Redis connection failed" Warning

Redis is optional. If you see this warning but don't need Redis:
- The application will use in-memory storage
- This is fine for development and single-instance deployments
- For production with multiple instances, configure Redis

### Features Not Working

Check the startup logs to see which integrations are enabled/disabled:

```
📦 Enabled Integrations:
  ✅ Database
  ✅ Email Service
  ✅ Stripe Payments

❌ Disabled Integrations:
  ❌ Redis Cache & Queue
  ❌ Twilio SMS
  ❌ Google Maps
```

Configure the missing integrations by setting their environment variables.

## Feature Flags

Control optional features with these variables:

```env
# Progressive Web App (Service Worker)
NEXT_PUBLIC_ENABLE_SW="false"  # Set to "true" to enable

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING="true"

# Analytics
ENABLE_ANALYTICS="true"

# Email Notifications
ENABLE_EMAIL_NOTIFICATIONS="true"

# SMS Notifications
ENABLE_SMS_NOTIFICATIONS="true"
```

## Integration Setup Guides

### Stripe Setup

1. Create account at [https://stripe.com](https://stripe.com)
2. Get API keys from Dashboard → Developers → API keys
3. Set up webhook endpoint:
   - URL: `https://yourdomain.com/api/payments/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### Resend Email Setup

1. Create account at [https://resend.com](https://resend.com)
2. Verify your domain
3. Create API key
4. Copy API key to `RESEND_API_KEY`
5. Set `FROM_EMAIL` to your verified domain email

### Twilio SMS Setup

1. Create account at [https://twilio.com](https://twilio.com)
2. Get Account SID and Auth Token from Console
3. Buy a phone number with SMS capabilities
4. Set up status callback URL: `https://yourdomain.com/api/sms/status-callback`
5. Configure variables:
   ```env
   TWILIO_ACCOUNT_SID="AC..."
   TWILIO_AUTH_TOKEN="..."
   TWILIO_PHONE_NUMBER="+383XXXXXXXX"
   ```

### Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable APIs:
   - Maps JavaScript API
   - Geocoding API
   - Distance Matrix API
   - Directions API
4. Create API key in Credentials section
5. Restrict API key to your domain for security
6. Copy to `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## Deployment

### Render

Set environment variables in the Render dashboard:
1. Go to your service → Environment
2. Add all required variables
3. Click "Save Changes"

### Vercel

```bash
# Add environment variables via CLI
vercel env add NEXTAUTH_SECRET production
vercel env add DATABASE_URL production
# ... etc
```

Or use the Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add variables for Production, Preview, and Development

### Railway

1. Go to your project → Variables
2. Add environment variables
3. Click "Deploy"

## Support

For questions or issues:
- Check the [.env.example](./.env.example) file for all available variables
- Review the validation code in [lib/env.ts](./lib/env.ts)
- Check startup checks in [lib/startup-checks.ts](./lib/startup-checks.ts)
- See [ENV_USAGE_GUIDE.md](./ENV_USAGE_GUIDE.md) for usage examples

## Migration from Old System

If you're migrating from direct `process.env` access:

1. Update imports:
   ```typescript
   // Before
   const apiKey = process.env.STRIPE_SECRET_KEY!

   // After
   import { env } from '@/lib/env'
   const apiKey = env.STRIPE_SECRET_KEY
   ```

2. Remove the `!` non-null assertion - validation ensures variables exist

3. For client-side code, use `clientEnv` from `lib/env.client.ts`

4. Run the application - it will show validation errors for any missing variables
