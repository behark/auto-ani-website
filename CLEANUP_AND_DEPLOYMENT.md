# Cleanup and Deployment Guide

## 📊 Current Website Usage

### Build Sizes:
- **`.next` folder**: 198MB
- **`public` folder**: 156MB (includes 178 vehicle images)
- **`node_modules`**: 1.3GB (includes unused Sanity packages)
- **Production bundle**: ~133KB (First Load JS for homepage)

### Memory Usage:
- **Development**: ~200-300MB RAM
- **Production Build**: Uses 512MB max (configured in package.json)
- **Production Runtime**: ~50-100MB RAM (hardcoded approach)

---

## 🗑️ Files and Packages to Remove

### 1. Sanity Configuration Files (DELETE):
```bash
rm -f sanity.cli.ts
rm -f sanity.config.ts
rm -f lib/sanity.ts
rm -f lib/types/sanity.ts
```

### 2. Sanity Scripts (DELETE):
```bash
rm -f test-sanity-connection.js
rm -f verify-sanity-data.js
rm -f populate-sanity-data.js
rm -f cleanup-sanity-data.js
rm -f setup-sanity.sh
rm -f scripts/migrate-from-sanity.js
rm -f scripts/fetch-complete-data.js
rm -f scripts/download-sanity-images.js
```

### 3. Migration Artifacts (DELETE):
```bash
rm -f data/vehicles-complete.json
rm -f data/vehicles-backup.ts
rm -f data/vehicles-migrated.ts
rm -f data/vehicles-proper.ts
```

### 4. Documentation Files (OPTIONAL - DELETE if not needed):
```bash
rm -f SANITY_GUIDE.md
rm -f SANITY_STUDIO_GUIDE.md
rm -f SANITY_VS_HARDCODED_COMPARISON.md
rm -f SANITY_CDN_FIX.md
rm -f AUTO_ANI_VEHICLE_SYSTEM_OVERVIEW.md
rm -f AUTOMOTIVE_CMS_USER_GUIDE.md
rm -f MIGRATION_SUMMARY.md
rm -f FINAL_MIGRATION_REPORT.md
rm -f HARDCODED_VEHICLES_EXAMPLE.md
rm -f DOCUMENTATION_INDEX.md
rm -f VEHICLE_SYSTEM_QUICK_REFERENCE.md
rm -f SECURITY_NOTICE.md
rm -f WEB_VITALS_TEST_RESULTS.md
```

### 5. Lighthouse Reports (OPTIONAL - DELETE):
```bash
rm -rf lighthouse-report/
```

### 6. Update `/app/api/health/route.ts`:
**Current**: Still tries to connect to Sanity
**Action**: Delete this file or replace with simple health check:

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
  });
}
```

### 7. Update `/app/api/image-proxy/route.ts`:
**Action**: Delete this file (it was for Sanity CDN images)
```bash
rm -f app/api/image-proxy/route.ts
```

---

## 📦 Updated package.json

Remove these Sanity dependencies:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "NODE_OPTIONS='--max-old-space-size=512' NEXT_TELEMETRY_DISABLED=1 next build",
    "start": "next start --hostname 0.0.0.0 --port ${PORT:-3000}",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "lint:check": "eslint . --max-warnings 0",
    "type-check": "tsc --noEmit"
    // REMOVED: "sanity", "sanity:deploy", "sanity:build", "test:connection"
  },
  "dependencies": {
    // Keep all these:
    "@radix-ui/react-accordion": "^1.2.12",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    // ... all other @radix-ui packages ...

    // REMOVE these 3 lines:
    // "@sanity/client": "^7.12.0",
    // "@sanity/image-url": "^1.2.0",
    // "@sanity/vision": "^4.10.2",

    // Keep rest:
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.21",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.23.16",
    "lucide-react": "^0.544.0",
    "next": "^14.2.33",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-intersection-observer": "^9.16.0",

    // REMOVE this line:
    // "sanity": "^4.12.0",

    "sharp": "^0.34.4",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.3.1",
    "tailwindcss": "^3.4.10",
    "typescript": "^5",
    "web-vitals": "^4.2.4",
    "zod": "^4.1.10"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.3.1",
    "@playwright/test": "^1.56.1",

    // REMOVE this line:
    // "@sanity/cli": "^4.10.2",

    "@typescript-eslint/eslint-plugin": "^8.46.1",
    "@typescript-eslint/parser": "^8.46.1",
    "chrome-launcher": "^1.2.1",
    "eslint": "^9.36.0",
    "eslint-config-next": "^15.5.4",
    "lighthouse": "^12.8.2"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=9.0.0"
  }
}
```

**After editing package.json, run:**
```bash
npm install
```

This will remove ~150MB from node_modules!

---

## 🌐 Environment Variables for Render

### Required Environment Variables:

```bash
# 1. Node Environment
NODE_ENV=production

# 2. Site URL (replace with your actual Render URL)
NEXT_PUBLIC_SITE_URL=https://your-app-name.onrender.com

# 3. Performance Optimization
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS=--max-old-space-size=512

# 4. Optional: Contact Email (if contact form is used)
CONTACT_EMAIL=contact@autosalonani.com
```

### ❌ Variables to REMOVE:
```bash
# Delete these - no longer needed:
NEXT_PUBLIC_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET
SANITY_API_TOKEN
NEXT_PUBLIC_UNOPTIMIZED_IMAGES
```

---

## 🚀 Render Deployment Settings

### Method 1: Using Render Dashboard

**Blueprint (render.yaml):**
```yaml
services:
  - type: web
    name: auto-ani-website
    env: node
    plan: starter
    region: frankfurt
    branch: main

    buildCommand: |
      npm ci &&
      npm run build

    startCommand: npm start

    # No health check endpoint needed (we removed /api/health)
    # Or use simple health check if you keep the updated version

    envVars:
      - key: NODE_ENV
        value: production

      - key: NEXT_PUBLIC_SITE_URL
        value: https://your-app-name.onrender.com

      - key: NEXT_TELEMETRY_DISABLED
        value: "1"

      - key: NODE_OPTIONS
        value: "--max-old-space-size=512"

    autoDeploy: true

    headers:
      - path: "/_next/static/*"
        headers:
          - key: "Cache-Control"
            value: "public, max-age=31536000, immutable"

      - path: "/images/*"
        headers:
          - key: "Cache-Control"
            value: "public, max-age=604800"
```

### Method 2: Manual Configuration in Render Dashboard

1. **Create New Web Service**
   - Connect your GitHub repository
   - Select branch: `main`

2. **Build & Deploy Settings:**
   - **Name**: `auto-ani-website`
   - **Region**: Frankfurt (closest to Kosovo)
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     npm ci && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```

3. **Instance Type:**
   - **Plan**: Starter (512MB RAM is sufficient)
   - **Node Version**: 20.x (auto-detected from package.json)

4. **Environment Variables** (Add these in Render Dashboard):
   ```
   NODE_ENV = production
   NEXT_PUBLIC_SITE_URL = https://your-app-name.onrender.com
   NEXT_TELEMETRY_DISABLED = 1
   NODE_OPTIONS = --max-old-space-size=512
   CONTACT_EMAIL = contact@autosalonani.com
   ```

5. **Auto-Deploy**:
   - ✅ Enable auto-deploy from `main` branch

---

## 🧹 Cleanup Commands (All at Once)

Run this to clean everything up:

```bash
# 1. Remove Sanity files
rm -f sanity.cli.ts sanity.config.ts lib/sanity.ts lib/types/sanity.ts

# 2. Remove Sanity scripts
rm -f test-sanity-connection.js verify-sanity-data.js populate-sanity-data.js cleanup-sanity-data.js setup-sanity.sh
rm -f scripts/migrate-from-sanity.js scripts/fetch-complete-data.js scripts/download-sanity-images.js

# 3. Remove migration artifacts
rm -f data/vehicles-complete.json data/vehicles-backup.ts data/vehicles-migrated.ts data/vehicles-proper.ts

# 4. Remove documentation
rm -f SANITY_*.md AUTO_ANI_VEHICLE_SYSTEM_OVERVIEW.md AUTOMOTIVE_CMS_USER_GUIDE.md
rm -f MIGRATION_SUMMARY.md FINAL_MIGRATION_REPORT.md HARDCODED_VEHICLES_EXAMPLE.md
rm -f DOCUMENTATION_INDEX.md VEHICLE_SYSTEM_QUICK_REFERENCE.md SECURITY_NOTICE.md WEB_VITALS_TEST_RESULTS.md

# 5. Remove lighthouse reports
rm -rf lighthouse-report/

# 6. Remove image proxy API
rm -f app/api/image-proxy/route.ts

# 7. Clean build cache
rm -rf .next

# 8. Update .env.local - Remove Sanity variables
# Edit manually or run:
cat > .env.local << 'EOF'
# No environment variables needed for local development
# All data is hardcoded
EOF

# 9. Reinstall dependencies after updating package.json
npm install

# 10. Test build
npm run build
```

---

## ✅ Final Checklist Before Deployment

- [ ] All Sanity files removed
- [ ] package.json updated (remove 4 Sanity packages)
- [ ] `npm install` completed successfully
- [ ] `.env.local` cleaned (no SANITY variables)
- [ ] `npm run build` succeeds
- [ ] Updated `/app/api/health/route.ts` or removed it
- [ ] Removed `/app/api/image-proxy/route.ts`
- [ ] Created Render account
- [ ] Connected GitHub repository to Render
- [ ] Configured environment variables in Render
- [ ] First deployment successful
- [ ] Website loads correctly on Render URL
- [ ] All 13 vehicle pages work
- [ ] Images load correctly
- [ ] Contact form works (if applicable)

---

## 📈 Expected Results After Cleanup

### Before Cleanup:
- node_modules: **1.3GB**
- Dependencies: 30+ packages (including 4 Sanity packages)
- Runtime memory: 50-100MB + Sanity overhead

### After Cleanup:
- node_modules: **~1.15GB** (150MB reduction)
- Dependencies: 26 packages (no Sanity)
- Runtime memory: **50-100MB** (pure Next.js)
- Deployment time: **Faster** (less to install)
- Build time: **Faster** (no Sanity checks)

---

## 🔍 Verifying the Cleanup

After cleanup, verify nothing broke:

```bash
# 1. Check for Sanity imports
grep -r "from '@sanity" app/ components/ lib/ || echo "✅ No Sanity imports found"

# 2. Check for Sanity references
grep -r "sanity" app/ components/ lib/ --include="*.ts" --include="*.tsx" | grep -v "// " || echo "✅ No Sanity code found"

# 3. Build succeeds
npm run build && echo "✅ Build successful"

# 4. Check bundle size
du -sh .next && echo "✅ Build size checked"
```

---

## 📞 Support

If you encounter issues:
1. Check build logs in Render dashboard
2. Verify environment variables are set correctly
3. Ensure Node version is 20.x
4. Check that all images exist in `/public/images/vehicles/`

**Current Website Status:**
- ✅ 13 vehicles with complete data
- ✅ 178 images locally stored
- ✅ No external dependencies
- ✅ Ready for deployment
