# Supabase Setup Guide for AUTO ANI

## Step 1: Create Supabase Account and Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up with GitHub or email
3. Create a new project with these settings:
   - **Project Name**: `auto-ani-db` (or your preference)
   - **Database Password**: Generate a strong password (SAVE THIS!)
   - **Region**: Choose closest to Kosovo (Frankfurt - Central EU recommended)
   - **Pricing Plan**: Free tier is sufficient

4. Wait for project to initialize (takes ~2 minutes)

## Step 2: Get Your Database Connection String

1. In Supabase Dashboard, go to **Settings** → **Database**
2. Find the **Connection String** section
3. Select **"Nodejs"** from the dropdown
4. Copy the connection string (it looks like this):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

5. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with the password you created in Step 1

## Step 3: Configure Netlify Environment Variables

1. Go to your Netlify Dashboard
2. Navigate to **Site Settings** → **Environment variables**
3. Add the following variables:

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
DATABASE_PROVIDER=postgresql
```

**Note**: We added `?pgbouncer=true&connection_limit=1` for better serverless performance

## Step 4: Run Database Migration

After setting up Supabase, run these commands locally:

```bash
# 1. Create .env.local file with your Supabase URL
echo "DATABASE_URL=your_supabase_connection_string_here" > .env.local

# 2. Generate Prisma client
npx prisma generate

# 3. Push schema to Supabase
npx prisma db push

# 4. (Optional) Seed with sample data
npm run db:seed
```

## Step 5: Verify Connection

After deployment, visit these URLs to verify:
- `/api/debug/db-connection` - Check database connection
- `/api/health/db` - Database health check
- `/api/vehicles` - Should return vehicle data

## Supabase Dashboard URLs

Once your project is created, you'll have access to:
- **Dashboard**: `https://app.supabase.com/project/[PROJECT-REF]`
- **Table Editor**: View and edit data directly
- **SQL Editor**: Run queries
- **Database Settings**: Connection details

## Troubleshooting

### Connection Timeout
If you see connection timeouts, ensure:
1. Database password is correct
2. Connection string includes `?pgbouncer=true`
3. Supabase project is active (not paused)

### SSL Issues
Supabase handles SSL automatically. If you encounter SSL errors:
- Remove any `sslmode` parameters from connection string
- Use the connection string exactly as provided by Supabase

### Free Tier Limits
- 500MB database storage
- 2GB bandwidth/month
- 50MB file storage
- Unlimited API requests
- Project pauses after 7 days of inactivity (can be unpaused anytime)

## Next Steps

1. After database is connected, add initial vehicles through:
   - Admin panel at `/admin`
   - Direct database access in Supabase Table Editor
   - API endpoints

2. Consider enabling Row Level Security (RLS) for production
3. Set up database backups (Supabase does daily backups on free tier)

## Support

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Status Page: https://status.supabase.com