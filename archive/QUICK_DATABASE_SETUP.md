# Quick Database Setup for AUTO ANI (5 minutes)

Your site is deploying to: **https://auto-ani-production-1759156972256.netlify.app**

## Option 1: Neon (Recommended - Fastest)

### 1. Create Account
Go to: https://neon.tech
Sign up with GitHub (instant)

### 2. Create Database
- Click "Create Database"
- Name: `auto_ani_db`
- Region: Europe (Frankfurt)
- Click "Create"

### 3. Get Connection String
Copy the connection string that appears:
```
postgresql://username:password@ep-xxx.eu-central-1.aws.neon.tech/auto_ani_db?sslmode=require
```

### 4. Update Netlify
```bash
npx netlify env:set DATABASE_URL "your-connection-string" --scope production
npx netlify env:set DATABASE_PROVIDER "postgresql" --scope production
```

### 5. Push Schema & Seed
```bash
export DATABASE_URL="your-connection-string"
npm run db:push
npm run db:seed
```

## Option 2: Supabase

### 1. Create Project
Go to: https://supabase.com
Create new project

### 2. Get Connection String
Settings → Database → Connection string

### 3. Update Netlify (same as above)

## Test Your Deployment

Once database is set up:
1. Trigger rebuild in Netlify
2. Visit your site
3. Check /vehicles page

## Admin Access
- URL: https://auto-ani-production-1759156972256.netlify.app/admin
- Email: admin@autosalonani.com
- Password: admin123

---
**Need help?** The deployment script output will show you the exact URLs and next steps.