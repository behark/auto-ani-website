# AUTO ANI - Render Migration Guide

## 🎯 Why Migrate to Render?

**Problem**: Vehicles don't load on Netlify due to serverless function database connection issues.
**Solution**: Render's persistent containers solve database connectivity problems.

## 📋 Pre-Migration Checklist

### Current Status Check
- [ ] Confirm vehicles not loading on Netlify
- [ ] Verify database connection from local environment
- [ ] Export current environment variables from Netlify
- [ ] Backup current deployment settings

### Database Preparation
- [ ] Ensure Neon/Supabase database is accessible from external sources
- [ ] Test connection string with pooling enabled
- [ ] Verify SSL configuration
- [ ] Run database health check

## 🚀 Render Deployment Steps

### 1. Create Render Account
```bash
# Visit: https://render.com
# Sign up with GitHub account
# Connect your GitHub repository
```

### 2. Configure Web Service
```yaml
# Render will auto-detect Next.js, but verify:
Build Command: npm run build:production
Start Command: npm start
Environment: Node
```

### 3. Environment Variables
Set these in Render dashboard:
```env
# Database
DATABASE_URL=postgresql://your-neon-connection-string
DATABASE_PROVIDER=postgresql

# Authentication
NEXTAUTH_URL=https://your-app.onrender.com
NEXTAUTH_SECRET=[generate new]
JWT_SECRET=[generate new]

# Email
RESEND_API_KEY=your-resend-key
FROM_EMAIL=contact@autosalonani.com
ADMIN_EMAIL=admin@autosalonani.com

# Site
NEXT_PUBLIC_SITE_URL=https://your-app.onrender.com
```

### 4. Build Configuration
Create `render.yaml` (optional):
```yaml
services:
  - type: web
    name: auto-ani-website
    env: node
    plan: starter
    buildCommand: npm run build:production
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_PROVIDER
        value: postgresql
```

## ⚙️ Code Optimizations for Render

### 1. Update Database Configuration
```typescript
// lib/database.ts - Optimize for persistent connections
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Better for Render's persistent containers
  log: ['error', 'warn'],
  errorFormat: 'pretty',
});
```

### 2. Add Health Check Endpoint
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected'
    }, { status: 500 });
  }
}
```

### 3. Optimize Vehicle Loading
```typescript
// Ensure proper error handling and logging
export default async function VehiclesPage() {
  try {
    console.log('Loading vehicles...'); // Render shows logs
    const result = await VehicleRepository.findMany({ limit: 50 });
    console.log(`Loaded ${result.vehicles?.length || 0} vehicles`);

    return <VehiclesPageClient initialVehicles={result.vehicles || []} />;
  } catch (error) {
    console.error('Vehicle loading failed:', error);
    // Better error handling for debugging
    return <ErrorComponent error={error} />;
  }
}
```

## 🔧 Migration Process

### Step 1: Deploy to Render
1. Connect GitHub repository to Render
2. Configure environment variables
3. Deploy and monitor build logs
4. Test vehicle loading

### Step 2: Test Functionality
```bash
# Test these URLs on Render deployment:
- https://your-app.onrender.com/vehicles
- https://your-app.onrender.com/api/vehicles
- https://your-app.onrender.com/api/health
```

### Step 3: Custom Domain
1. Add custom domain in Render dashboard
2. Update DNS settings
3. Configure SSL (automatic)
4. Update NEXTAUTH_URL

### Step 4: Switch Traffic
1. Verify all functionality works
2. Update DNS to point to Render
3. Monitor for 24 hours
4. Decommission Netlify site

## 📊 Expected Improvements

### Performance Gains
- ✅ Vehicles load consistently
- ✅ Faster page transitions (no cold starts)
- ✅ Better database connection stability
- ✅ Improved SEO (reliable SSR)

### Cost Comparison
- **Netlify**: Free but broken vehicles = $0 value
- **Render**: $25/month but working site = ROI positive

## 🚨 Troubleshooting

### Common Issues
1. **Build fails**: Check Node version and dependencies
2. **Database timeout**: Verify connection string and SSL
3. **Environment variables**: Ensure all required vars are set
4. **Domain issues**: Check DNS propagation

### Debug Commands
```bash
# Check logs in Render dashboard
# Test database connection
curl https://your-app.onrender.com/api/health

# Test vehicles API
curl https://your-app.onrender.com/api/vehicles
```

## 📞 Migration Support

If you encounter issues:
1. Check Render logs dashboard
2. Verify environment variables
3. Test database connectivity
4. Review this guide step-by-step

---

**Next Step**: Let's start the migration process to get your vehicles loading!