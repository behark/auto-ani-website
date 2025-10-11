# Deployment Guide

## Quick Deploy to Netlify

### Prerequisites
- GitHub account
- Netlify account
- PostgreSQL database (Neon/Supabase)

### 1. Database Setup
Choose and set up your database (see [DATABASE_SETUP.md](./DATABASE_SETUP.md))

### 2. GitHub Setup
```bash
git add .
git commit -m "Deploy to Netlify"
git push origin main
```

### 3. Netlify Configuration
1. **Connect repo**: New site from Git → GitHub → Select repo
2. **Build settings**:
   - Build command: `npm run build:production`
   - Publish directory: `.next`
3. **Environment variables**:
   ```
   DATABASE_URL=postgresql://your-connection-string
   DATABASE_PROVIDER=postgresql
   NEXTAUTH_URL=https://your-site.netlify.app
   NEXTAUTH_SECRET=[openssl rand -base64 32]
   RESEND_API_KEY=your-resend-key
   ```

### 4. Custom Domain
1. Add domain in Netlify settings
2. Configure DNS with your provider
3. Enable HTTPS (automatic)

## Production Checklist
- [ ] Database connected and seeded
- [ ] All environment variables set
- [ ] Custom domain configured
- [ ] HTTPS enabled
- [ ] Contact forms working
- [ ] Admin panel accessible

## Maintenance
- **Weekly**: Check error logs, update inventory
- **Monthly**: Update dependencies, review security

For detailed instructions, see the original DEPLOYMENT.md