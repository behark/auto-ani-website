# PostgreSQL Database Setup Guide for AUTO ANI Website

## Database Provider Comparison

### Neon (RECOMMENDED)
**Pros:**
- **Free Tier:** 0.5 GB storage, 3 GB compute hours/month
- **Serverless:** Auto-scaling and auto-suspend
- **Branching:** Database branching for development
- **Connection Pooling:** Built-in PgBouncer
- **Performance:** Excellent query performance
- **Location:** Multiple regions including EU (Frankfurt)
- **SSL:** Required by default (secure)

**Cons:**
- Compute hours limit on free tier
- Storage limit of 0.5 GB

### Supabase
**Pros:**
- **Free Tier:** 500 MB storage, unlimited API requests
- **Features:** Built-in Auth, Storage, Realtime
- **Dashboard:** Excellent database GUI
- **Connection Pooling:** Built-in Supavisor

**Cons:**
- Project pauses after 1 week of inactivity (free tier)
- Limited to 2 free projects
- Smaller storage on free tier

## Step-by-Step Setup Instructions

### Option 1: Neon (Recommended)

1. **Create Account:**
   - Go to https://neon.tech
   - Sign up with GitHub or email
   - Verify your email

2. **Create Database:**
   ```
   - Click "Create Database"
   - Project name: "auto-ani-production"
   - Database name: "auto_ani_db"
   - Region: "Europe (Frankfurt)" or closest to Kosovo
   - Branch name: "main"
   - Click "Create Project"
   ```

3. **Get Connection String:**
   - Go to Dashboard > Connection Details
   - Copy the connection string (it will look like):
   ```
   postgresql://username:password@ep-xxx-xxx-123456.eu-central-1.aws.neon.tech/auto_ani_db?sslmode=require
   ```

4. **Enable Connection Pooling:**
   - Go to Settings > Connection Pooling
   - Enable "Connection pooling"
   - Copy the pooled connection string:
   ```
   postgresql://username:password@ep-xxx-xxx-123456-pooler.eu-central-1.aws.neon.tech/auto_ani_db?sslmode=require
   ```

### Option 2: Supabase (Alternative)

1. **Create Account:**
   - Go to https://supabase.com
   - Sign up with GitHub or email
   - Verify your email

2. **Create Project:**
   ```
   - Click "New Project"
   - Organization: Select or create one
   - Name: "auto-ani-production"
   - Database Password: Generate strong password (SAVE THIS!)
   - Region: "Europe (Frankfurt)" or closest
   - Click "Create new project"
   ```

3. **Get Connection String:**
   - Go to Settings > Database
   - Connection string > URI
   - Copy the connection string

4. **Enable Connection Pooling:**
   - Go to Settings > Database
   - Connection Pooling > Enabled
   - Mode: Transaction
   - Copy pooled connection string

## Connection String Formats

### Neon Format:
```bash
# Direct connection (for migrations)
DIRECT_DATABASE_URL="postgresql://[username]:[password]@[endpoint].neon.tech/auto_ani_db?sslmode=require"

# Pooled connection (for application)
DATABASE_URL="postgresql://[username]:[password]@[endpoint]-pooler.neon.tech/auto_ani_db?sslmode=require"
```

### Supabase Format:
```bash
# Direct connection (for migrations)
DIRECT_DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Pooled connection (for application)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## Environment Configuration

1. **Create .env.local file:**
```bash
cp .env.example .env.local
```

2. **Update database configuration in .env.local:**
```bash
# Database Provider
DATABASE_PROVIDER="postgresql"

# For Neon:
DATABASE_URL="postgresql://username:password@ep-xxx-xxx-pooler.eu-central-1.aws.neon.tech/auto_ani_db?sslmode=require"
DIRECT_DATABASE_URL="postgresql://username:password@ep-xxx-xxx.eu-central-1.aws.neon.tech/auto_ani_db?sslmode=require"

# For Supabase:
# DATABASE_URL="postgresql://postgres.xxx:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
# DIRECT_DATABASE_URL="postgresql://postgres.xxx:password@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
```

## Database Migration Commands

1. **Generate Prisma Client:**
```bash
npm run db:generate
```

2. **Push schema to database (initial setup):**
```bash
npm run db:push
```

3. **Run migrations (production):**
```bash
npm run db:migrate
```

4. **Seed initial data:**
```bash
npm run db:seed
```

## Testing the Connection

Run the test script:
```bash
node scripts/test-db-connection.js
```

Expected output:
```
✅ Database connection successful!
Database: PostgreSQL
Version: 15.x
Tables found: X
Connection pooling: Enabled
SSL: Enabled
```

## Production Deployment Checklist

- [ ] Database created on Neon/Supabase
- [ ] Connection pooling enabled
- [ ] SSL/TLS enabled (required)
- [ ] Connection string added to .env.local
- [ ] Connection test passed
- [ ] Prisma client generated
- [ ] Database schema pushed
- [ ] Initial data seeded
- [ ] Backup strategy configured
- [ ] Monitoring enabled

## Security Best Practices

1. **Never commit .env files to Git**
2. **Use connection pooling for production**
3. **Enable SSL/TLS (already required by Neon)**
4. **Rotate database passwords regularly**
5. **Use different credentials for dev/staging/production**
6. **Enable query logging for debugging**
7. **Set up automated backups**
8. **Monitor query performance**

## Troubleshooting

### Connection Timeout
- Check if IP is whitelisted (if applicable)
- Verify connection string format
- Ensure SSL mode is set correctly

### SSL Error
- Add `?sslmode=require` to connection string
- For local development, use `?sslmode=disable`

### Permission Denied
- Check database user permissions
- Verify database name is correct
- Ensure user has CREATE privileges

### Pool Exhausted
- Increase pool size in connection settings
- Check for connection leaks in application
- Use connection pooling URL

## Monitoring & Maintenance

### Neon Dashboard
- Monitor compute usage
- Check storage usage
- View query performance
- Set up alerts

### Database Metrics to Monitor
- Connection count
- Query response time
- Storage usage
- Cache hit ratio
- Slow queries

## Cost Optimization

### Free Tier Limits
- **Neon:** 0.5 GB storage, 3 GB compute hours
- **Supabase:** 500 MB storage, unlimited requests

### When to Upgrade
- Storage approaching 80% of limit
- Compute hours consistently exceeded
- Need for production SLA
- Multiple environments required

## Support Resources

- **Neon Documentation:** https://neon.tech/docs
- **Supabase Documentation:** https://supabase.com/docs
- **Prisma Documentation:** https://www.prisma.io/docs
- **Discord Support:** Join provider's Discord community