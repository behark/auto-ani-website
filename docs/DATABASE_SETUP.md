# Database Setup Guide

## Quick Setup

Choose your database provider:

### 🚀 Neon (Recommended)
- Free tier: 0.5 GB storage
- Serverless auto-scaling
- Built-in connection pooling

1. **Create account**: https://neon.tech
2. **Create database**: "auto-ani-production"
3. **Get connection string**:
   ```
   postgresql://username:password@ep-xxx.neon.tech/auto_ani_db?sslmode=require
   ```

### 🔥 Supabase (Alternative)
- Free tier: 500 MB storage
- Built-in dashboard
- Auth & storage included

1. **Create account**: https://supabase.com
2. **Create project**: "auto-ani-production"
3. **Get connection string** from Settings > Database

## Environment Setup

```bash
# Copy example file
cp .env.example .env.local

# Add your database URL
DATABASE_URL="postgresql://your-connection-string"
DATABASE_PROVIDER="postgresql"
```

## Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed

# Test connection
npm run db:test
```

## Troubleshooting

**Connection Error**: Check SSL mode and connection string format
**Permission Error**: Verify database user has CREATE privileges
**Pool Exhausted**: Use connection pooling URL from provider

For detailed setup instructions, see the original DATABASE_SETUP_GUIDE.md