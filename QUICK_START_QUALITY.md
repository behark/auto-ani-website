# Quick Start - Code Quality Guide

**Fast reference for developers working on AUTO ANI website**

---

## 🚀 TL;DR - What Changed

1. ✅ **Use logger, not console** - `import { logger } from '@/lib/logger'`
2. ✅ **Service Worker is optional** - Set `NEXT_PUBLIC_ENABLE_SW=true` to enable
3. ✅ **Environment vars are validated** - App won't start if required vars missing
4. ✅ **Technical debt is tracked** - See TECHNICAL_DEBT.md

---

## 📝 Quick Commands

### Logging
```typescript
// ❌ Don't use console
console.log('Debug message');
console.error('Error occurred', error);

// ✅ Use logger instead
import { logger } from '@/lib/logger';
logger.debug('Debug message');
logger.error('Error occurred', {}, error as Error);
```

### Service Worker
```bash
# Disable (default)
NEXT_PUBLIC_ENABLE_SW=false

# Enable PWA features
NEXT_PUBLIC_ENABLE_SW=true
```

### Environment Variables
```typescript
// ✅ Server-side (API routes, server components)
const apiKey = process.env.STRIPE_SECRET_KEY!; // Safe - validated at startup

// ✅ Client-side (components with 'use client')
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

// ❌ Never in client components
const secret = process.env.API_SECRET; // Won't work!
```

---

## 📚 Documentation Files

| File | Purpose | When to Use |
|------|---------|-------------|
| [CODE_QUALITY_SUMMARY.md](CODE_QUALITY_SUMMARY.md) | Overview of all improvements | Start here for big picture |
| [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md) | Known issues and TODOs | Planning features, bug fixes |
| [ENV_USAGE_GUIDE.md](ENV_USAGE_GUIDE.md) | Environment variable patterns | Setting up env vars |
| [SERVICE_WORKER_README.md](SERVICE_WORKER_README.md) | PWA and offline features | Enabling/debugging PWA |

---

## 🔧 Common Tasks

### Adding a New Environment Variable

1. **Add to validation** (`lib/validateEnv.ts`):
   ```typescript
   if (!process.env.NEW_API_KEY) {
     errors.push({
       variable: 'NEW_API_KEY',
       type: 'missing',
       message: 'NEW_API_KEY is required'
     });
   }
   ```

2. **Update .env.example**:
   ```bash
   # New Service API
   NEW_API_KEY="your_api_key_here"
   ```

3. **Document in ENV_USAGE_GUIDE.md**

### Logging an Error

```typescript
import { logger } from '@/lib/logger';

try {
  // Your code
} catch (error) {
  logger.error('Failed to process request', {
    userId: user.id,
    action: 'submit_form'
  }, error as Error);

  // Or use specialized methods
  logger.apiError('API call failed', error as Error, {
    method: 'POST',
    url: '/api/vehicles',
    statusCode: 500
  });
}
```

### Enabling Service Worker

1. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_ENABLE_SW=true
   ```

2. Restart dev server

3. Test in production mode:
   ```bash
   npm run build
   npm run start
   ```

### Checking Technical Debt

```bash
# View all known issues
cat TECHNICAL_DEBT.md

# Or open in editor
code TECHNICAL_DEBT.md
```

---

## ⚠️ Important Rules

### Never
- ❌ Use `console.log` in production code (lib/, components/, app/)
- ❌ Commit .env or .env.local files
- ❌ Access `process.env` without validation in new code
- ❌ Add TODOs without documenting in TECHNICAL_DEBT.md

### Always
- ✅ Import logger: `import { logger } from '@/lib/logger'`
- ✅ Add new env vars to `lib/validateEnv.ts`
- ✅ Test with Service Worker both enabled and disabled
- ✅ Document technical debt in TECHNICAL_DEBT.md

---

## 🐛 Debugging

### Logger not working?
```typescript
// Check NODE_ENV
console.log(process.env.NODE_ENV); // Should be 'development' or 'production'

// Check log level
console.log(process.env.LOG_LEVEL); // 'debug' shows all logs
```

### Service Worker issues?
```bash
# 1. Disable it
NEXT_PUBLIC_ENABLE_SW=false

# 2. Clear browser cache
# DevTools → Application → Storage → Clear site data

# 3. Unregister SW
# DevTools → Application → Service Workers → Unregister

# 4. Hard refresh
# Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Environment variable undefined?
```bash
# 1. Check .env.local exists
ls -la .env.local

# 2. Restart dev server
npm run dev

# 3. Check validation output in terminal
# Should show which vars are missing
```

---

## 🧪 Testing Checklist

Before committing:
- [ ] No `console.log/error/warn` in production code
- [ ] Logger imported where needed
- [ ] New env vars added to validation
- [ ] Technical debt documented if adding TODOs
- [ ] Service Worker tested (if changed)
- [ ] Build succeeds: `npm run build`

---

## 🚨 Emergency Procedures

### Service Worker Breaking Site

```bash
# Quick disable
echo 'NEXT_PUBLIC_ENABLE_SW=false' >> .env.local

# Force unregister (add to component temporarily)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => regs.forEach(reg => reg.unregister()));
}
```

### Environment Validation Blocking Startup

```bash
# Check what's missing
npm run dev
# Read error messages carefully

# Quick fix for dev
cp .env.example .env.local
# Then update required values
```

---

## 📞 Getting Help

1. **Check docs first:**
   - CODE_QUALITY_SUMMARY.md - Overview
   - TECHNICAL_DEBT.md - Known issues
   - ENV_USAGE_GUIDE.md - Env vars
   - SERVICE_WORKER_README.md - PWA

2. **Search codebase:**
   ```bash
   # Find similar patterns
   grep -r "logger.error" lib/
   grep -r "process.env.NEXT_PUBLIC" components/
   ```

3. **Review existing code:**
   - See logger usage in `components/home/FeaturedVehicles.tsx`
   - See env validation in `lib/validateEnv.ts`
   - See SW setup in `components/pwa/ServiceWorkerRegister.tsx`

---

## 🎯 Priority Order

When working on code quality:

1. **Critical** - Fix breaking issues
2. **High** - Logger, env vars, security
3. **Medium** - Technical debt items
4. **Low** - Nice to have features

---

## 📊 Key Metrics

- **131 files** cleaned of console statements
- **25+ TODOs** resolved or documented
- **4 new docs** created
- **1 critical bug** fixed (Service Worker)

---

**Last Updated:** October 7, 2025
**Next Review:** Before next release

---

## Quick Links

- [Full Summary](CODE_QUALITY_SUMMARY.md)
- [Technical Debt](TECHNICAL_DEBT.md)
- [Environment Guide](ENV_USAGE_GUIDE.md)
- [Service Worker](SERVICE_WORKER_README.md)
