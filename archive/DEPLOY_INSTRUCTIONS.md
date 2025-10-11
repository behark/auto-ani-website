# AUTO ANI - Deployment Instructions

## Quick Deploy to New Netlify Site with Supabase

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add Supabase configuration"
git push origin main
```

### Step 2: Deploy to Netlify (Manual Method)

1. Go to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose "Deploy with GitHub"
4. Select your repository: `auto-ani-website`
5. Configure build settings:
   - Build command: `npm run build:production`
   - Publish directory: `.next`
   - Click "Show advanced" to add environment variables

### Step 3: Add Environment Variables in Netlify UI

Add these environment variables before deploying:

```
DATABASE_URL=postgresql://postgres.xojdcxswjxfhdqplrutz:Behar123.@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DATABASE_PROVIDER=postgresql
NODE_ENV=production
NODE_VERSION=18.20.5
NEXT_TELEMETRY_DISABLED=1
NEXT_USE_NETLIFY_EDGE=true
NEXT_PUBLIC_DEPLOYMENT_TYPE=production
NEXTAUTH_SECRET=1Yz1tI/xgcab3HBr3OJz3FFQFDN2HHEBEPiekqiDcwAnXRJZDnLrE+5c8HIHedQk
JWT_SECRET=BABEYF1wyzyGH02K6EYU5qrX1bccOfEvhBkezhfoX24=
ADMIN_API_KEY=BABEYF1wyzyGH02K6EYU5qrX1bccOfEvhBkezhfoX24=
SESSION_SECRET=BABEYF1wyzyGH02K6EYU5qrX1bccOfEvhBkezhfoX24=
NEXT_PUBLIC_WHATSAPP_NUMBER=38349204242
DEALERSHIP_ADDRESS=Gazmend Baliu, Mitrovicë, Kosovë 40000
DEALERSHIP_LATITUDE=42.8914
DEALERSHIP_LONGITUDE=20.8660
```

### Step 4: Deploy
Click "Deploy site" and wait for the build to complete.

### Step 5: Push Database Schema to Supabase

You need to push the schema to Supabase from your local machine:

1. Open Supabase SQL Editor: https://app.supabase.com/project/xojdcxswjxfhdqplrutz/sql
2. Copy the entire contents of `prisma/schema.sql` (if exists) or generate it:
   ```bash
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > schema.sql
   ```
3. Paste and run in Supabase SQL Editor

OR use Prisma locally:
```bash
# Set the database URL locally
export DATABASE_URL="postgresql://postgres:Behar123.@db.xojdcxswjxfhdqplrutz.supabase.co:5432/postgres"

# Push schema
npx prisma db push
```

### Step 6: Verify Deployment

After deployment, check these URLs:
- Site: `https://[your-site-name].netlify.app`
- Database Connection: `https://[your-site-name].netlify.app/api/debug/db-connection`
- Vehicles API: `https://[your-site-name].netlify.app/api/vehicles`

### Alternative: Using Netlify CLI

If you have Netlify CLI installed:

```bash
# Login to Netlify
netlify login

# Create new site and link
netlify init

# Set environment variables
netlify env:set DATABASE_URL "postgresql://postgres.xojdcxswjxfhdqplrutz:Behar123.@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
netlify env:set DATABASE_PROVIDER "postgresql"
# ... (add other variables)

# Deploy
netlify deploy --prod --build
```

## Troubleshooting

### Database Connection Issues
- Make sure you're using the Transaction Pooler URL (port 6543) for Netlify
- Check if Supabase project is active at: https://app.supabase.com/project/xojdcxswjxfhdqplrutz
- Verify the password is correct: `Behar123.`

### Build Failures
- Check Netlify build logs
- Ensure all environment variables are set
- Verify Node version is 18.20.5

### No Vehicles Showing
1. Check if tables exist in Supabase
2. Add sample data through Supabase Table Editor
3. Check API response at `/api/vehicles`