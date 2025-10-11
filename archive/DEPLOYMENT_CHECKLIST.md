# AUTO ANI - Netlify Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Preparation
- [x] Fixed LanguageContext hook error in FeaturedVehicles.tsx
- [x] Removed `output: 'standalone'` from next.config.ts
- [x] Created netlify.toml configuration
- [x] Updated package.json with production scripts
- [x] Created dual schema support (SQLite dev, PostgreSQL prod)

### 📋 Files Created/Modified
- **netlify.toml** - Netlify configuration with build settings, plugins, headers
- **.env.production** - Production environment template
- **prisma/schema.prisma** - PostgreSQL schema for production
- **prisma/schema.dev.prisma** - SQLite schema for development
- **DEPLOYMENT.md** - Complete deployment guide

## Database Setup Required

### 1. Create PostgreSQL Database
Choose one provider:
- [ ] Neon (https://neon.tech) - Recommended
- [ ] Supabase (https://supabase.com)
- [ ] Railway (https://railway.app)
- [ ] Render (https://render.com)

### 2. Get Database Credentials
```
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

### 3. Run Database Migrations
```bash
# Set environment variables
export DATABASE_URL="your-postgresql-url"

# Push schema to database
npx prisma db push

# Seed database with initial data
npm run db:seed:production
```

## Netlify Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

### 2. Connect to Netlify
1. Go to https://app.netlify.com
2. Click "New site from Git"
3. Connect GitHub repository
4. Select main branch

### 3. Configure Environment Variables in Netlify

#### Required Variables (MUST SET)
```
DATABASE_URL=postgresql://...
DATABASE_PROVIDER=postgresql
NEXTAUTH_URL=https://[your-site].netlify.app
NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]
JWT_SECRET=[generate with: openssl rand -base64 32]
RESEND_API_KEY=re_...
FROM_EMAIL=contact@autosalonani.com
ADMIN_EMAIL=admin@autosalonani.com
NEXT_PUBLIC_SITE_URL=https://[your-site].netlify.app
```

#### Optional but Recommended
```
NEXT_PUBLIC_GA_ID=G-...
NEXT_PUBLIC_FB_PIXEL_ID=...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_WHATSAPP_NUMBER=38349204242
REDIS_URL=redis://... (for caching)
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

### 4. Deploy Site
- Click "Deploy site"
- Monitor build logs
- Verify deployment

## Post-Deployment Verification

### Functional Tests
- [ ] Homepage loads correctly
- [ ] Featured vehicles display
- [ ] Vehicle detail pages work
- [ ] Contact form submits
- [ ] Search functionality works
- [ ] Language switching works (SQ/SR/EN)
- [ ] Admin login works

### Performance Checks
- [ ] Lighthouse score > 90
- [ ] Images load quickly
- [ ] No console errors
- [ ] Mobile responsive

### Security Checks
- [ ] HTTPS enabled
- [ ] Environment variables secure
- [ ] Admin routes protected
- [ ] Input validation working

## Domain Configuration

### 1. Add Custom Domain
- Go to Domain settings in Netlify
- Add: autosalonani.com
- Add: www.autosalonani.com

### 2. DNS Configuration
Option A: Use Netlify DNS
```
ns1.netlify.com
ns2.netlify.com
ns3.netlify.com
```

Option B: Manual DNS
```
A Record: @ → 75.2.60.5
CNAME: www → [your-site].netlify.app
```

### 3. SSL Certificate
- Automatically provisioned by Netlify
- Force HTTPS in settings

## Monitoring Setup

### 1. Error Tracking (Sentry)
```
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_ORG=auto-ani
SENTRY_PROJECT=auto-ani-website
```

### 2. Analytics
```
NEXT_PUBLIC_GA_ID=G-...
NEXT_PUBLIC_FB_PIXEL_ID=...
```

### 3. Uptime Monitoring
- Use Netlify Analytics
- Or setup external monitoring (UptimeRobot, Pingdom)

## Maintenance Tasks

### Daily
- [ ] Check error logs
- [ ] Monitor form submissions
- [ ] Review vehicle inquiries

### Weekly
- [ ] Update vehicle inventory
- [ ] Review analytics
- [ ] Check performance metrics
- [ ] Backup database

### Monthly
- [ ] Security updates
- [ ] Dependency updates
- [ ] Performance optimization
- [ ] Content updates

## Support Information

### Technical Support
- **Documentation**: DEPLOYMENT.md
- **GitHub Issues**: Create issue in repository
- **Netlify Support**: https://www.netlify.com/support/

### Contact
- **Email**: admin@autosalonani.com
- **WhatsApp**: +38349204242

## Quick Reference

### Build Commands
```bash
npm run build:production    # Production build
npm run db:generate        # Generate Prisma client
npm run db:push           # Push schema to database
npm run db:seed          # Seed database
```

### Environment Files
- `.env.local` - Local development
- `.env.production` - Production template
- `.env` - Default values

### Key Files
- `netlify.toml` - Netlify configuration
- `prisma/schema.prisma` - Database schema
- `DEPLOYMENT.md` - Deployment guide
- `package.json` - Scripts and dependencies

---

**Status**: READY FOR DEPLOYMENT ✅
**Last Updated**: September 29, 2025
**Version**: 1.0.0