# Environment Variable Usage Guide

This guide explains the proper patterns for using environment variables in the AUTO ANI website codebase.

**Last Updated:** 2025-10-07

---

## Table of Contents

1. [Overview](#overview)
2. [The Problem](#the-problem)
3. [The Solution](#the-solution)
4. [Usage Patterns](#usage-patterns)
5. [Migration Guide](#migration-guide)
6. [Environment Variables Reference](#environment-variables-reference)

---

## Overview

Environment variables are critical configuration values that should be:
- ✅ Validated at application startup
- ✅ Type-safe and documented
- ✅ Properly defaulted when optional
- ❌ Never accessed directly with `process.env.VARIABLE_NAME`

---

## The Problem

### ❌ Bad Pattern (Direct Access)

```typescript
// DON'T DO THIS
const apiKey = process.env.STRIPE_SECRET_KEY; // Could be undefined!
const url = process.env.DATABASE_URL;         // No validation
```

**Issues:**
- No validation - could be undefined
- No type safety
- Runtime errors in production
- No central place to see all required variables
- Security risks (placeholder values in production)

---

## The Solution

We use a centralized validation system in `lib/validateEnv.ts` that:

1. **Validates all variables at startup** - App won't start if required vars are missing
2. **Detects placeholder values** - Prevents "your_secret_here" in production
3. **Provides type safety** - TypeScript knows the types
4. **Documents all variables** - Single source of truth
5. **Shows integration status** - Know which services are enabled

---

## Usage Patterns

### ✅ Correct Pattern 1: Environment Validation

The validation runs automatically when the app starts:

```typescript
// lib/validateEnv.ts is imported in layout.tsx and runs on startup
import './lib/validateEnv'; // This validates everything
```

**What it checks:**
- All required variables exist
- Secrets meet minimum length requirements
- No placeholder values in production
- Proper formats (URLs, emails, API keys)

### ✅ Correct Pattern 2: In Server Components/API Routes

For server-side code (API routes, server components), you can safely access validated environment variables:

```typescript
// app/api/some-route/route.ts
export async function POST(request: Request) {
  // These are safe because validateEnv.ts already checked them
  const stripeKey = process.env.STRIPE_SECRET_KEY!; // Note the ! assertion
  const dbUrl = process.env.DATABASE_URL!;

  // Or with fallback for optional vars
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
}
```

**Note:** The `!` (non-null assertion) is safe here because `validateEnv.ts` already validated these exist.

### ✅ Correct Pattern 3: In Client Components

For client-side code, only use `NEXT_PUBLIC_*` variables:

```typescript
// components/SomeClientComponent.tsx
'use client';

export function SomeClientComponent() {
  // Only NEXT_PUBLIC_ variables are available in client components
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const analyticsId = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

  // Never access secret keys in client components!
  // This would be undefined:
  const secret = process.env.STRIPE_SECRET_KEY; // ❌ Won't work
}
```

### ✅ Correct Pattern 4: Optional Variables with Defaults

```typescript
// For optional configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const logLevel = process.env.LOG_LEVEL || 'info';
const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED === 'true';
```

### ✅ Correct Pattern 5: Integration Detection

Use the validation result to detect which integrations are enabled:

```typescript
import { validateEnvironmentVariables } from '@/lib/validateEnv';

const envStatus = validateEnvironmentVariables();

if (envStatus.integrations.enabled.includes('Stripe Payment Processing')) {
  // Stripe is fully configured
  initializeStripeIntegration();
}
```

---

## Migration Guide

If you find code directly accessing `process.env`, update it:

### Before (❌ Wrong):
```typescript
async function sendEmail(to: string) {
  const apiKey = process.env.RESEND_API_KEY; // Could be undefined
  // ...
}
```

### After (✅ Correct):
```typescript
async function sendEmail(to: string) {
  const apiKey = process.env.RESEND_API_KEY!; // Safe - validated at startup

  // OR with error handling
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Email service not configured');
  }
  // ...
}
```

### For Client-Side Code:

### Before (❌ Wrong):
```typescript
'use client';

function MyComponent() {
  const secret = process.env.API_SECRET; // Won't work, not public
}
```

### After (✅ Correct):
```typescript
'use client';

function MyComponent() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL; // Works, is public
}
```

---

## Environment Variables Reference

### Required Variables

These MUST be set for the app to start:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | NextAuth.js secret (min 32 chars) | Generate with `openssl rand -base64 32` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |

### Recommended Variables

These should be set but app will run without them:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXTAUTH_URL` | Application URL | Auto-detected in dev |
| `NEXT_PUBLIC_APP_URL` | Public application URL | Required for production |
| `NEXT_PUBLIC_SITE_URL` | Site URL for canonical links | Same as APP_URL |

### Integration Variables

#### Stripe Payment Processing
```bash
STRIPE_SECRET_KEY=sk_test_...        # or sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_test_...   # or pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Twilio SMS
```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+383XXXXXXXX    # E.164 format
```

#### Email (Resend)
```bash
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@autosalonani.com
ADMIN_EMAIL=info@autosalonani.com
```

#### Redis Cache
```bash
REDIS_URL=redis://localhost:6379
# Or for production:
REDIS_URL=redis://:password@host:6379
```

#### Google Maps
```bash
GOOGLE_MAPS_API_KEY=AIza...
```

#### Social Media
```bash
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
FACEBOOK_ACCESS_TOKEN=...
FACEBOOK_PAGE_ID=...
INSTAGRAM_ACCOUNT_ID=...
```

#### Optional Configuration
```bash
LOG_LEVEL=debug                    # error | warn | info | debug
RATE_LIMIT_ENABLED=true            # Enable rate limiting
NODE_ENV=production                # development | production | test
```

---

## Validation Output

When the app starts, you'll see validation results:

```
========================================
🔍 Environment Validation Results
========================================

✅ All required environment variables are set

⚠️  Warnings:
  ⚠️  REDIS_URL: Redis not configured - using in-memory fallback

📊 Integrations Status:

✅ Enabled:
  ✓ Email (Resend)
  ✓ Twilio SMS

❌ Disabled:
  ✗ Stripe Payment Processing
  ✗ Redis Cache & Rate Limiting
  ✗ Google Maps
  ✗ Facebook
  ✗ Instagram

========================================
```

---

## Security Best Practices

### ✅ DO:
- Store secrets in `.env.local` (gitignored)
- Use strong, randomly generated secrets
- Rotate secrets regularly
- Use different values for dev/staging/prod
- Validate all variables at startup

### ❌ DON'T:
- Commit `.env` files to git
- Use placeholder values in production
- Share secrets in code or Slack
- Use the same secret across environments
- Access `process.env` directly without validation

---

## Troubleshooting

### "Environment validation failed"

**Cause:** Required variable is missing or invalid

**Solution:**
1. Check the error message for which variable failed
2. Add it to your `.env.local` file
3. Ensure it meets the format requirements
4. Restart the development server

### "Using Stripe test key in production environment"

**Cause:** You have `sk_test_` key in production

**Solution:**
1. Get your live Stripe keys from Stripe dashboard
2. Update `STRIPE_SECRET_KEY` to use `sk_live_...`
3. Update `STRIPE_PUBLISHABLE_KEY` to use `pk_live_...`

### "Redis not configured - using in-memory fallback"

**Cause:** `REDIS_URL` is not set

**Impact:**
- Rate limiting will be per-instance only
- Cache will be lost on restart
- Not suitable for production

**Solution:**
1. Set up Redis server (local or cloud)
2. Add `REDIS_URL` to environment variables

---

## Testing Environment Variables

### Development
```bash
# .env.local
DATABASE_URL="postgresql://localhost:5432/autoani_dev"
NEXTAUTH_SECRET="dev_secret_min_32_characters_long_abc123"
RESEND_API_KEY="re_dev_..."
```

### Production
```bash
# Set in hosting platform (Vercel, Render, etc.)
DATABASE_URL="postgresql://prod_host:5432/autoani_prod"
NEXTAUTH_SECRET="<generate new with openssl rand -base64 32>"
RESEND_API_KEY="re_live_..."
```

---

## Adding New Environment Variables

When adding a new environment variable:

1. **Add to validation** in `lib/validateEnv.ts`:
   ```typescript
   const newServiceVars = ['NEW_API_KEY', 'NEW_API_SECRET'];
   ```

2. **Add validation logic**:
   ```typescript
   if (isIntegrationConfigured(newServiceVars)) {
     enabledIntegrations.push('New Service');

     // Add format validation if needed
     if (!process.env.NEW_API_KEY?.startsWith('nsk_')) {
       errors.push({
         variable: 'NEW_API_KEY',
         type: 'invalid_format',
         message: 'NEW_API_KEY must start with nsk_'
       });
     }
   }
   ```

3. **Document here** in this file

4. **Update `.env.example`**:
   ```bash
   # New Service Integration
   NEW_API_KEY=nsk_...
   NEW_API_SECRET=...
   ```

---

## Resources

- [Next.js Environment Variables Docs](https://nextjs.org/docs/basic-features/environment-variables)
- [12-Factor App Config](https://12factor.net/config)
- [OWASP Secret Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

## Questions?

If you're unsure about environment variable usage:
1. Check this guide
2. Look at existing patterns in `lib/validateEnv.ts`
3. Review similar implementations in the codebase
4. When in doubt, validate and document!
