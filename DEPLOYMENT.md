# AUTO ANI Website - Netlify Deployment Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Deployment Steps](#deployment-steps)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

## Prerequisites

Before deploying to Netlify, ensure you have:

1. **GitHub Account**: Code must be pushed to a GitHub repository
2. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
3. **PostgreSQL Database**: Choose one of:
   - [Neon](https://neon.tech) (Recommended - Free tier)
   - [Supabase](https://supabase.com) (Free tier)
   - [Railway](https://railway.app)
   - [Render](https://render.com)

## Database Setup

### Option 1: Neon (Recommended)

1. **Create Neon Account**
   ```
   Visit: https://neon.tech
   Sign up with GitHub
   ```

2. **Create Database**
   - Click "Create Database"
   - Choose region closest to your users (Europe)
   - Select "Free" tier
   - Note your connection string

3. **Configure Connection**
   ```
   DATABASE_URL="postgresql://username:password@host.neon.tech/database?sslmode=require"
   DATABASE_PROVIDER="postgresql"
   ```

### Option 2: Supabase

1. **Create Supabase Project**
   ```
   Visit: https://supabase.com
   Create new project
   Choose region (Europe)
   ```

2. **Get Connection String**
   - Go to Settings → Database
   - Copy "Connection string" (Transaction Mode)
   - Use the pooler connection for Netlify

### Database Migration

1. **Set Environment Variable**
   ```bash
   export DATABASE_URL="your-postgresql-connection-string"
   export DATABASE_PROVIDER="postgresql"
   ```

2. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

3. **Push Schema to Database**
   ```bash
   npm run db:push
   ```

4. **Seed Database**
   ```bash
   npm run db:seed:production
   ```

## Environment Configuration

### Required Environment Variables

Copy `.env.production` as reference and set these in Netlify:

#### Critical Variables (MUST SET)
```env
# Database
DATABASE_URL="postgresql://..."
DATABASE_PROVIDER="postgresql"

# Authentication
NEXTAUTH_URL="https://your-domain.netlify.app"
NEXTAUTH_SECRET="[generate with: openssl rand -base64 32]"
JWT_SECRET="[generate with: openssl rand -base64 32]"

# Email
RESEND_API_KEY="re_..."
FROM_EMAIL="contact@autosalonani.com"
ADMIN_EMAIL="admin@autosalonani.com"

# Site
NEXT_PUBLIC_SITE_URL="https://your-domain.netlify.app"
```

#### Optional but Recommended
```env
# Analytics
NEXT_PUBLIC_GA_ID="G-..."
NEXT_PUBLIC_FB_PIXEL_ID="..."

# Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="..."

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER="38349204242"

# Redis (for caching)
REDIS_URL="redis://..."
```

### Generating Secrets

Generate secure secrets using:
```bash
# For NEXTAUTH_SECRET, JWT_SECRET, SESSION_SECRET
openssl rand -base64 32

# For WEBHOOK_SECRET
openssl rand -hex 32
```

## Deployment Steps

### Step 1: Prepare Repository

1. **Initialize Git** (if not already)
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Netlify deployment"
   ```

2. **Create GitHub Repository**
   - Go to [github.com/new](https://github.com/new)
   - Name: `auto-ani-website`
   - Keep it private initially
   - Don't initialize with README

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/auto-ani-website.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Connect to Netlify

1. **Log into Netlify**
   - Visit [app.netlify.com](https://app.netlify.com)
   - Click "New site from Git"

2. **Connect GitHub**
   - Choose "GitHub"
   - Authorize Netlify
   - Select your repository

3. **Configure Build Settings**
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build:production`
   - **Publish directory**: `.next`
   - Click "Show advanced"

### Step 3: Set Environment Variables

1. **In Netlify Dashboard**
   - Go to Site Settings → Environment Variables
   - Click "Add a variable"

2. **Add Each Variable**
   - Add all variables from `.env.production`
   - Use actual production values
   - Mark sensitive ones as "Secret"

3. **Critical Variables to Set**:
   ```
   DATABASE_URL → Your PostgreSQL connection string
   DATABASE_PROVIDER → postgresql
   NEXTAUTH_URL → https://[your-site].netlify.app
   NEXTAUTH_SECRET → [generated secret]
   RESEND_API_KEY → Your Resend API key
   ```

### Step 4: Deploy

1. **Trigger Initial Deploy**
   - Click "Deploy site"
   - Monitor build logs
   - Wait for completion (5-10 minutes)

2. **Check Build Logs**
   - Look for any errors
   - Ensure Prisma generates successfully
   - Verify all pages build

3. **Common Build Issues**:
   - Missing environment variables
   - Database connection failures
   - TypeScript errors

## Post-Deployment

### Step 1: Verify Deployment

1. **Check Site**
   ```
   Visit: https://[your-site].netlify.app
   ```

2. **Test Key Features**:
   - [ ] Homepage loads
   - [ ] Vehicles display
   - [ ] Contact form works
   - [ ] Admin login works
   - [ ] Search functionality
   - [ ] Language switching

### Step 2: Custom Domain

1. **Add Domain in Netlify**
   - Go to Domain settings
   - Click "Add custom domain"
   - Enter: `autosalonani.com`

2. **Configure DNS**
   - Add Netlify's nameservers to your domain
   - Or use CNAME/A records
   - Wait for propagation (up to 48 hours)

3. **Enable HTTPS**
   - Netlify provides free SSL
   - Force HTTPS in settings

### Step 3: Performance Optimization

1. **Enable Netlify Features**:
   - Asset optimization
   - Pretty URLs
   - Prerendering
   - Branch deploys

2. **Monitor Performance**:
   - Check Lighthouse scores
   - Review Analytics
   - Monitor error tracking

## Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`

**Solution**:
1. Verify DATABASE_URL is correct
2. Check if IP needs whitelisting
3. Ensure SSL mode is set correctly

### Build Failures

**Error**: `Build failed`

**Common Fixes**:
1. Check environment variables
2. Verify Node version (should be 18+)
3. Clear cache and retry
4. Check Prisma schema syntax

### Missing Vehicles

**Issue**: No vehicles showing

**Solution**:
1. Run database seed:
   ```bash
   npm run db:seed:production
   ```
2. Verify DATABASE_URL in Netlify
3. Check API routes for errors

### Authentication Issues

**Error**: `NEXTAUTH_URL` mismatch

**Solution**:
1. Update NEXTAUTH_URL to match your domain
2. Clear browser cookies
3. Rebuild and redeploy

## Maintenance

### Regular Tasks

#### Weekly
- [ ] Check error logs
- [ ] Review performance metrics
- [ ] Update vehicle inventory
- [ ] Backup database

#### Monthly
- [ ] Update dependencies
- [ ] Review security alerts
- [ ] Optimize images
- [ ] Clean up old inquiries

### Database Backups

1. **Manual Backup**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```

2. **Automatic Backups**
   - Enable in your database provider
   - Set retention period (30 days)

### Updating Content

1. **Vehicle Updates**
   - Use admin panel
   - Or direct database updates
   - Run seed script for bulk updates

2. **Static Content**
   - Update in codebase
   - Commit and push
   - Auto-deploys via Netlify

### Monitoring

1. **Set Up Monitoring**:
   - Sentry for error tracking
   - Google Analytics for traffic
   - Uptime monitoring

2. **Review Metrics**:
   - Build times
   - Function usage
   - Bandwidth usage
   - Form submissions

## Security Checklist

- [ ] All secrets are in environment variables
- [ ] Database has strong password
- [ ] Admin accounts use strong passwords
- [ ] HTTPS is enforced
- [ ] Security headers are configured
- [ ] Rate limiting is enabled
- [ ] Input validation is implemented
- [ ] SQL injection protection (via Prisma)
- [ ] XSS protection enabled
- [ ] CORS properly configured

## Support Resources

- **Netlify Docs**: https://docs.netlify.com
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://prisma.io/docs
- **Issues**: Create issue in GitHub repository

## Quick Commands Reference

```bash
# Local development
npm run dev

# Build for production
npm run build:production

# Database commands
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:seed       # Seed database
npm run db:studio     # Open Prisma Studio

# Testing
npm run test:build    # Test production build locally

# Deployment
git push origin main  # Triggers auto-deploy
```

## Contact

For deployment assistance:
- **Email**: admin@autosalonani.com
- **WhatsApp**: +38349204242

---

Last Updated: September 2025
Version: 1.0.0