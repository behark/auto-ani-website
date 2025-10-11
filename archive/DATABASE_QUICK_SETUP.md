# Quick Database Setup for AUTO ANI Website

## 🚀 Quick Start (5 minutes)

### Step 1: Create Free Database on Neon

1. Go to [neon.tech](https://neon.tech) and sign up
2. Click "Create Database" with these settings:
   - Project name: `auto-ani-production`
   - Database name: `auto_ani_db`
   - Region: `Europe (Frankfurt)`
3. Copy the connection strings from Dashboard

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local and update these lines:
DATABASE_PROVIDER="postgresql"
DATABASE_URL="[Your pooled connection string from Neon]"
DIRECT_DATABASE_URL="[Your direct connection string from Neon]"
```

### Step 3: Test & Deploy

```bash
# 1. Test connection
npm run db:test

# 2. Run migrations
npm run db:migrate:prod

# 3. Seed initial data (optional)
npm run db:seed

# 4. Check database health
npm run db:health
```

## 📋 Database Management Commands

| Command | Description |
|---------|------------|
| `npm run db:test` | Test database connection |
| `npm run db:migrate:prod` | Run production migrations |
| `npm run db:seed` | Seed initial data |
| `npm run db:health` | Check database health |
| `npm run db:backup` | Create database backup |
| `npm run db:studio` | Open Prisma Studio GUI |

## 🔗 Connection String Formats

### Neon (Recommended)
```bash
# Pooled connection (for application)
DATABASE_URL="postgresql://username:password@ep-xxx-xxx-pooler.eu-central-1.aws.neon.tech/auto_ani_db?sslmode=require"

# Direct connection (for migrations)
DIRECT_DATABASE_URL="postgresql://username:password@ep-xxx-xxx.eu-central-1.aws.neon.tech/auto_ani_db?sslmode=require"
```

### Supabase (Alternative)
```bash
# Pooled connection (for application)
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (for migrations)
DIRECT_DATABASE_URL="postgresql://postgres.xxx:password@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
```

## ✅ Production Checklist

- [ ] Database created on Neon/Supabase
- [ ] Connection strings in `.env.local`
- [ ] `npm run db:test` passes
- [ ] `npm run db:migrate:prod` completed
- [ ] `npm run db:seed` run (if needed)
- [ ] `npm run db:health` shows all green
- [ ] Backup strategy configured
- [ ] Monitoring alerts set up

## 🛠️ Troubleshooting

### Connection Failed
```bash
# Check connection string format
npm run db:test

# Verify SSL is enabled (required for cloud databases)
# Add ?sslmode=require to connection string
```

### Migration Failed
```bash
# Use direct connection URL for migrations
# Check DIRECT_DATABASE_URL is set correctly

# Reset and retry
npx prisma db push --force-reset  # CAUTION: Deletes all data!
npm run db:migrate:prod
```

### Performance Issues
```bash
# Run health check
npm run db:health

# Check for recommendations
# Common solutions:
# - Enable connection pooling
# - Add missing indexes
# - Clean up unused indexes
# - Run VACUUM on large tables
```

## 📊 Monitoring

### Daily Tasks
- Check database size: `npm run db:health`
- Monitor slow queries in provider dashboard
- Review connection pool usage

### Weekly Tasks
- Create backup: `npm run db:backup`
- Clean old backups: `npm run db:backup:clean`
- Review performance metrics

## 🔐 Security Notes

1. **Never commit `.env.local` to Git**
2. **Use connection pooling in production**
3. **SSL/TLS is required (automatically enabled)**
4. **Rotate passwords regularly**
5. **Use different credentials per environment**

## 📞 Support

- **Neon Docs**: [neon.tech/docs](https://neon.tech/docs)
- **Prisma Docs**: [prisma.io/docs](https://www.prisma.io/docs)
- **Discord Support**: Join provider's Discord community

## 🎯 Next Steps After Database Setup

1. Deploy application to hosting provider
2. Set environment variables in hosting dashboard
3. Run production build: `npm run build:production`
4. Configure monitoring and alerts
5. Set up automated backups