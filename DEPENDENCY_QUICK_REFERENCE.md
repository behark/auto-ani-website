# Dependency Quick Reference

## What Was Done (2025-10-07)

### ✅ Completed Actions

1. **Added 8 Missing Dependencies:**
   - dotenv, sharp, web-vitals, @stripe/stripe-js, @sentry/nextjs, googleapis, @google-analytics/data, glob

2. **Updated 13+ Packages (Patch/Minor):**
   - @supabase/supabase-js, @upstash/redis, react-hook-form, redis, resend, twilio, zod, typescript, eslint, and more

3. **Removed 7 Unused Dependencies:**
   - @types/dompurify, next-pwa, react-window, @types/react-window, workbox-webpack-plugin, critters, tw-animate-css

4. **Created Documentation:**
   - DEPENDENCY_UPGRADE_PLAN.md - Major version migration guide
   - DEPENDENCY_UPDATE_SUMMARY.md - Complete update report
   - This quick reference

---

## ⚠️ Major Updates Pending (DO NOT AUTO-UPDATE)

| Package | Current | Latest | Priority | Risk |
|---------|---------|--------|----------|------|
| **React** | 18.3.1 | 19.2.0 | High | HIGH |
| **Tailwind CSS** | 3.4.18 | 4.1.14 | Low | VERY HIGH |
| **Stripe** | 18.5.0 | 19.1.0 | Medium | MEDIUM |
| **Nodemailer** | 6.10.1 | 7.0.7 | Medium | MEDIUM |
| **@react-three/drei** | 9.122.0 | 10.7.6 | Low | MEDIUM |
| **@react-three/fiber** | 8.18.0 | 9.3.0 | Low | MEDIUM |
| **bcryptjs** | 2.4.3 | 3.0.2 | High | HIGH |

See `DEPENDENCY_UPGRADE_PLAN.md` for migration steps.

---

## 🔒 Security Status

- **10 vulnerabilities** (7 low, 2 moderate, 1 high)
- **All in netlify-cli** (dev dependency)
- **Production impact:** NONE
- **Action:** Monitor for updates, consider alternative deployment

---

## 🚀 Next Steps

### 1. CRITICAL - Upgrade Node.js
```bash
# Current: Node 18.20.8
# Required: Node >=20.0.0

# Using nvm
nvm install 20
nvm use 20
```

### 2. Test Installation
```bash
npm install
npm run type-check
npm run build
```

### 3. Configure New Dependencies

#### Sentry (.env):
```
NEXT_PUBLIC_SENTRY_DSN=your_dsn
SENTRY_AUTH_TOKEN=your_token
```

#### Google APIs (.env):
```
GOOGLE_APPLICATION_CREDENTIALS=path/to/creds.json
GOOGLE_ANALYTICS_PROPERTY_ID=your_id
```

### 4. Test Critical Features
- [ ] Payment processing (Stripe)
- [ ] Email sending (nodemailer)
- [ ] Image optimization (sharp)
- [ ] 3D vehicle viewer
- [ ] Authentication

---

## 📚 Documentation Files

- **DEPENDENCY_UPGRADE_PLAN.md** - Detailed migration guide for major versions
- **DEPENDENCY_UPDATE_SUMMARY.md** - Complete report of all changes
- **package.json** - Updated dependencies
- **next.config.ts** - Configuration (may need Sentry setup)

---

## 🔄 Useful Commands

```bash
# Check outdated
npm outdated

# Security audit
npm audit

# Type check
npm run type-check

# Build test
npm run test:build

# List dependencies
npm list --depth=0

# Update single package
npm update <package-name>
```

---

## 📊 Stats

- **Packages added:** 8
- **Packages updated:** 13+
- **Packages removed:** 7 (256 with transitive deps)
- **Node modules:** 2,573 → 2,317 packages
- **Total dependencies:** 94 → 88

---

**Last Updated:** 2025-10-07
