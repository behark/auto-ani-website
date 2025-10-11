# Security Recommendations for AUTO ANI Website

This document provides actionable security recommendations prioritized by risk level and implementation effort.

---

## CRITICAL PRIORITY (Implement Immediately)

### 1. Add Authentication to Admin API Endpoints

**Risk:** High - Unauthorized access to admin functionality
**Effort:** Low (30 minutes)

**Affected Files:**
- `/home/behar/auto-ani-website/app/api/admin/notifications/route.ts`
- All routes in `/app/api/admin/*`

**Implementation:**

```typescript
// Example: app/api/admin/notifications/route.ts
import { withAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return withAuth(request, async (request, user) => {
    // Your existing logic here
    // user object is guaranteed to be authenticated
  }, 'ADMIN'); // Require ADMIN role
}
```

**Testing:**
```bash
# Should return 401 Unauthorized
curl -X GET http://localhost:3000/api/admin/notifications

# Should work with valid session
curl -X GET http://localhost:3000/api/admin/notifications \
  -H "Cookie: next-auth.session-token=VALID_TOKEN"
```

---

### 2. Rotate All Production Secrets

**Risk:** High - Credentials may be compromised
**Effort:** Medium (1-2 hours)

**Secrets to Rotate:**

1. **NEXTAUTH_SECRET** (Critical)
   ```bash
   openssl rand -base64 32
   ```

2. **JWT_SECRET** (Critical)
   ```bash
   openssl rand -base64 32
   ```

3. **Database Credentials** (High Priority)
   - Change password in Render dashboard
   - Update DATABASE_URL and DIRECT_DATABASE_URL
   - Test connection before deploying

4. **Supabase Keys** (If Exposed)
   - Generate new service role key
   - Update SUPABASE_SERVICE_ROLE_KEY
   - Anon key can remain (public by design)

5. **Stripe Keys** (If Needed)
   - Rotate from Stripe Dashboard
   - Update webhook secrets

**Deployment Checklist:**
- [ ] Update secrets in production environment
- [ ] Test authentication flow
- [ ] Verify database connectivity
- [ ] Test Stripe integration
- [ ] Monitor error logs for 24 hours

---

### 3. Enable 2FA on Third-Party Services

**Risk:** High - Account takeover
**Effort:** Low (1 hour)

**Services Requiring 2FA:**

1. **Supabase**
   - Enable 2FA in account settings
   - Save backup codes securely

2. **Stripe**
   - Enable 2FA in security settings
   - Require 2FA for all team members

3. **Netlify**
   - Enable 2FA in user settings
   - Use authenticator app (not SMS)

4. **Twilio**
   - Enable Authy 2FA
   - Restrict API access by IP

5. **GitHub** (for code repository)
   - Enable 2FA with authenticator app
   - Require 2FA for organization

6. **Render.com** (hosting)
   - Enable 2FA in account settings

---

## HIGH PRIORITY (Implement This Week)

### 4. Upgrade Vulnerable Dependencies

**Risk:** Medium-High - Known vulnerabilities
**Effort:** Medium (2-4 hours including testing)

**Steps:**

1. **Resolve Stripe Dependency Conflict**
   ```bash
   npm install @stripe/stripe-js@7.9.0 @stripe/react-stripe-js@4.0.2
   ```

2. **Upgrade netlify-cli**
   ```bash
   npm install -D netlify-cli@latest
   ```

3. **Run Audit Fix**
   ```bash
   npm audit fix --legacy-peer-deps
   ```

4. **Verify Application Works**
   ```bash
   npm run build
   npm run dev
   # Test all critical features
   ```

**Testing Checklist:**
- [ ] Authentication works
- [ ] Vehicle pages load
- [ ] Contact form submits
- [ ] Admin panel accessible
- [ ] Stripe integration works
- [ ] Image optimization works

---

### 5. Implement Redis-Based Rate Limiting

**Risk:** Medium - Abuse of API endpoints
**Effort:** Medium (3-4 hours)

**Current Issue:**
Rate limiting uses in-memory Map, which resets on server restart and doesn't work across multiple instances.

**Implementation:**

**File:** `/home/behar/auto-ani-website/lib/rate-limit.ts` (create new)

```typescript
import { redis } from '@/lib/redis';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 60 }
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `rate-limit:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    const requestCount = await redis.zcard(key);

    if (requestCount >= config.maxRequests) {
      const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetAt = oldestRequest[1] ? Number(oldestRequest[1]) + config.windowMs : now + config.windowMs;

      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // Add current request
    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.expire(key, Math.ceil(config.windowMs / 1000));

    return {
      allowed: true,
      remaining: config.maxRequests - requestCount - 1,
      resetAt: now + config.windowMs,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request if Redis is down
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    };
  }
}

// Express-style middleware
export function createRateLimitMiddleware(config?: RateLimitConfig) {
  return async (request: Request): Promise<Response | null> => {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    const result = await checkRateLimit(ip, config);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(config?.maxRequests || 60),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
          },
        }
      );
    }

    return null; // Allow request to proceed
  };
}
```

**Usage in API Routes:**

```typescript
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  const rateLimit = await checkRateLimit(ip, {
    windowMs: 60000, // 1 minute
    maxRequests: 10,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  // Process request...
}
```

---

### 6. Add Request Fingerprinting for Bot Detection

**Risk:** Medium - Bot abuse
**Effort:** Medium (2-3 hours)

**Install Package:**
```bash
npm install @fingerprintjs/fingerprintjs
```

**Implementation:**

**File:** `/home/behar/auto-ani-website/lib/fingerprint.ts`

```typescript
import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<any> | null = null;

export async function getFingerprint(): Promise<string> {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }

  const fp = await fpPromise;
  const result = await fp.get();
  return result.visitorId;
}
```

**Client-side Usage:**

```typescript
import { getFingerprint } from '@/lib/fingerprint';

async function submitForm(data: FormData) {
  const fingerprint = await getFingerprint();

  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      fingerprint, // Add to request
    }),
  });
}
```

**Server-side Validation:**

```typescript
// Track suspicious patterns
const suspiciousFingerprints = new Set<string>();

async function checkFingerprint(fingerprint: string, ip: string) {
  // Check if fingerprint has multiple IPs (VPN/proxy detection)
  const ips = await redis.smembers(`fingerprint:${fingerprint}:ips`);

  if (ips.length > 5) {
    suspiciousFingerprints.add(fingerprint);
    return { suspicious: true, reason: 'Multiple IPs' };
  }

  // Track this IP for the fingerprint
  await redis.sadd(`fingerprint:${fingerprint}:ips`, ip);
  await redis.expire(`fingerprint:${fingerprint}:ips`, 86400); // 24 hours

  return { suspicious: false };
}
```

---

## MEDIUM PRIORITY (Implement This Month)

### 7. Implement GDPR Compliance Endpoints

**Risk:** Low-Medium - Legal compliance
**Effort:** High (1-2 days)

**Required Endpoints:**

**File:** `/home/behar/auto-ani-website/app/api/gdpr/export/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { z } from 'zod';

const exportRequestSchema = z.object({
  email: z.string().email(),
  verificationToken: z.string().min(32),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, verificationToken } = exportRequestSchema.parse(body);

    // Verify token (sent via email)
    const isValid = await verifyToken(email, verificationToken);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 401 }
      );
    }

    // Collect all user data
    const userData = {
      contacts: await prisma.contact.findMany({
        where: { email },
      }),
      vehicleInquiries: await prisma.vehicleInquiry.findMany({
        where: { email },
      }),
      appointments: await prisma.appointment.findMany({
        where: { customerEmail: email },
      }),
      // Add other data sources...
    };

    return NextResponse.json({
      success: true,
      data: userData,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}
```

**File:** `/home/behar/auto-ani-website/app/api/gdpr/delete-account/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    const { email, verificationToken } = await request.json();

    // Verify token
    const isValid = await verifyToken(email, verificationToken);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 401 }
      );
    }

    // Delete user data (or anonymize)
    await prisma.$transaction([
      prisma.contact.deleteMany({ where: { email } }),
      prisma.vehicleInquiry.deleteMany({ where: { email } }),
      prisma.appointment.deleteMany({ where: { customerEmail: email } }),
      // Add other data sources...
    ]);

    return NextResponse.json({
      success: true,
      message: 'All personal data has been deleted',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Deletion failed' },
      { status: 500 }
    );
  }
}
```

---

### 8. Add Multi-Factor Authentication (2FA)

**Risk:** Medium - Account security
**Effort:** High (2-3 days)

**Implementation:**

The Speakeasy library is already installed. Here's how to implement TOTP 2FA:

**File:** `/home/behar/auto-ani-website/lib/2fa.ts`

```typescript
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from './database';

export async function generateTOTPSecret(userId: string) {
  const secret = speakeasy.generateSecret({
    name: `AUTO ANI (${userId})`,
    issuer: 'AUTO ANI',
  });

  // Store secret in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      totpSecret: secret.base32,
      twoFactorEnabled: false, // Not enabled until verified
    },
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCode: qrCodeUrl,
  };
}

export async function verifyTOTPToken(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true },
  });

  if (!user?.totpSecret) {
    return false;
  }

  return speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 steps before/after
  });
}

export async function enableTwoFactor(userId: string, token: string): Promise<boolean> {
  const isValid = await verifyTOTPToken(userId, token);

  if (isValid) {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
  }

  return isValid;
}
```

**Update Auth Configuration:**

```typescript
// lib/auth.ts - add to authorize function
async authorize(credentials) {
  // ... existing password verification ...

  if (user.twoFactorEnabled) {
    if (!credentials.totpToken) {
      throw new Error('2FA_REQUIRED');
    }

    const isValidToken = await verifyTOTPToken(user.id, credentials.totpToken);
    if (!isValidToken) {
      throw new Error('Invalid 2FA token');
    }
  }

  // ... rest of logic ...
}
```

---

### 9. Implement Security Monitoring & Alerting

**Risk:** Medium - Incident detection
**Effort:** Medium (4-6 hours)

**Sentry Configuration:**

Sentry is already installed. Configure it properly:

**File:** `/home/behar/auto-ani-website/sentry.client.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,

  beforeSend(event, hint) {
    // Don't send events with sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }

    // Scrub sensitive headers
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }

    return event;
  },

  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Random network errors
    'NetworkError',
    'AbortError',
  ],
});
```

**Security Event Tracking:**

```typescript
import * as Sentry from '@sentry/nextjs';

export function trackSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  metadata?: Record<string, any>
) {
  Sentry.captureMessage(`Security Event: ${event}`, {
    level: severity === 'critical' ? 'error' :
           severity === 'high' ? 'warning' : 'info',
    tags: {
      type: 'security',
      severity,
    },
    extra: metadata,
  });

  // Also log locally
  console.warn(`[SECURITY] ${event}`, metadata);
}

// Usage examples:
trackSecurityEvent('Failed login attempt', 'medium', {
  email: 'user@example.com',
  ip: '192.168.1.1',
  attempts: 5,
});

trackSecurityEvent('Account locked', 'high', {
  userId: 'user-123',
  reason: 'too many failed attempts',
});
```

---

## LOW PRIORITY (Nice to Have)

### 10. Add Web Application Firewall (WAF)

**Risk:** Low - Additional defense layer
**Effort:** Low (if using Cloudflare)

**Cloudflare Setup:**
1. Sign up for Cloudflare
2. Add your domain
3. Update nameservers
4. Enable WAF in Security settings
5. Configure rules:
   - Block common attack patterns
   - Rate limit by IP
   - Challenge suspicious requests
   - Geo-blocking if needed

---

### 11. Implement Subresource Integrity (SRI)

**Risk:** Low - CDN compromise
**Effort:** Low (1 hour)

**For External Scripts:**

```typescript
// Add integrity hashes to external scripts
<script
  src="https://cdn.example.com/library.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossOrigin="anonymous"
/>
```

Generate hashes:
```bash
curl https://cdn.example.com/library.js | \
  openssl dgst -sha384 -binary | \
  openssl base64 -A
```

---

### 12. Implement Content Security Policy Reporting

**Risk:** Low - CSP violation detection
**Effort:** Low (2 hours)

**Add to next.config.ts:**

```typescript
headers: [
  {
    key: 'Content-Security-Policy-Report-Only',
    value: 'default-src \'self\'; report-uri /api/csp-report',
  },
]
```

**Create Report Endpoint:**

```typescript
// app/api/csp-report/route.ts
export async function POST(request: NextRequest) {
  const report = await request.json();

  // Log to monitoring service
  console.warn('CSP Violation:', report);

  // Send to Sentry
  Sentry.captureMessage('CSP Violation', {
    level: 'warning',
    extra: report,
  });

  return new Response('OK', { status: 200 });
}
```

---

## TESTING SECURITY IMPROVEMENTS

### Automated Security Testing

**Install OWASP ZAP:**
```bash
docker pull owasp/zap2docker-stable

# Run baseline scan
docker run -t owasp/zap2docker-stable \
  zap-baseline.py -t https://your-staging-url.com
```

**npm Security Audit:**
```bash
# Add to package.json scripts
"scripts": {
  "security:audit": "npm audit",
  "security:check": "npm audit --audit-level=moderate"
}
```

**Add to CI/CD:**
```yaml
# .github/workflows/security.yml
name: Security Checks
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run npm audit
        run: npm audit --audit-level=moderate
      - name: Run OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
```

---

## SECURITY MAINTENANCE SCHEDULE

### Daily
- Monitor error logs
- Review failed login attempts
- Check rate limit violations

### Weekly
- Review security events in Sentry
- Check for new CVEs affecting dependencies
- Review API usage patterns

### Monthly
- Run npm audit
- Update dependencies
- Review access logs for anomalies
- Test backup restoration

### Quarterly
- Rotate API keys and secrets
- Security training for team
- Review and update security policies
- Penetration testing

### Annually
- Professional security audit
- Update incident response plan
- Review compliance requirements
- Security architecture review

---

## INCIDENT RESPONSE PLAN

### When a Security Incident is Detected:

1. **Immediate Response (0-1 hour)**
   - Identify scope of incident
   - Disable affected accounts/systems
   - Notify security team
   - Begin collecting evidence

2. **Short-term Response (1-24 hours)**
   - Contain the incident
   - Assess damage
   - Apply emergency patches
   - Document timeline

3. **Recovery (24-72 hours)**
   - Restore services securely
   - Rotate compromised credentials
   - Monitor for re-infection
   - Communicate with stakeholders

4. **Post-Incident (1-2 weeks)**
   - Root cause analysis
   - Implement preventive measures
   - Update security policies
   - Team debrief

---

## SECURITY CONTACTS

- **Security Lead:** [To be assigned]
- **DevOps Lead:** [To be assigned]
- **Incident Response:** security@autosalonani.com
- **Bug Bounty:** bounty@autosalonani.com (if program exists)

---

## RESOURCES

### Security Tools
- OWASP ZAP: https://www.zaproxy.org/
- npm audit: https://docs.npmjs.com/cli/v8/commands/npm-audit
- Snyk: https://snyk.io/
- Dependabot: https://github.com/dependabot

### Learning Resources
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Next.js Security: https://nextjs.org/docs/advanced-features/security-headers
- Web Security Academy: https://portswigger.net/web-security

### Compliance
- GDPR: https://gdpr.eu/
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/

---

**Document Version:** 1.0
**Last Updated:** October 7, 2025
**Next Review:** January 7, 2026
