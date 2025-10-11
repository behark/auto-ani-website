# AUTO ANI Website - Deployment Credentials & Setup

## 🔐 Generated Secure Credentials

All credentials have been generated using cryptographically secure methods and saved to `.env.netlify`.

### Core Security Credentials

```bash
# Authentication & Security - KEEP THESE SECRET!
NEXTAUTH_SECRET="5vUmFqDiGCfhn8Ay63NtidjmmWyI21KtUxMcLsm+KaQ="
JWT_SECRET="279NhNODUJtCnRj/KbN/ysXeD2EX8qGQB0sbtDYqvkI="
SESSION_SECRET="TCloNVWjvJnaWxvxSrk+oi5x9CW2wZ0mgACOHE1mClU="
ENCRYPTION_KEY="sLNHXeoqIvO7HKS7pzG5Mq2PH/Theb+hnoIkRjdX1t4="
WEBHOOK_SECRET="f8aa13c34db8e6e470f328dff34ba3d046cac27b0c45c466"
ADMIN_API_KEY="admin_0007dd301387a0f3e10ac50f70407a6a2562f116b4dce2d9"
```

## 📋 Quick Setup Checklist

- [x] ✅ Generated all secure secrets
- [x] ✅ Created `.env.netlify` with production configuration
- [x] ✅ Created setup documentation
- [ ] 📧 Set up Resend account and get API key
- [ ] 🗄️ Set up PostgreSQL database
- [ ] 🚀 Deploy to Netlify

## 🚀 Deployment Steps

### 1. Email Service (Resend) - REQUIRED

1. **Create Account:**
   - Go to https://resend.com
   - Sign up for free account (3,000 emails/month free)

2. **Get API Key:**
   - Dashboard → API Keys → Create API Key
   - Name: "AUTO ANI Production"
   - Copy the key (starts with `re_`)

3. **Update Configuration:**
   ```bash
   RESEND_API_KEY="re_YOUR_ACTUAL_KEY_HERE"
   ```

4. **Verify Domain (Optional for Production):**
   - Dashboard → Domains → Add Domain
   - Enter: `autosalonani.com`
   - Add DNS records as instructed
   - Wait for verification

### 2. Database Setup - REQUIRED

Choose one of these providers:

#### Option A: Supabase (Recommended)
```bash
# Free tier: 500MB storage, 2GB bandwidth
https://supabase.com
DATABASE_URL="postgresql://[user]:[password]@[host]:6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://[user]:[password]@[host]:5432/postgres"
```

#### Option B: Neon
```bash
# Free tier: 3GB storage
https://neon.tech
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
```

#### Option C: Railway
```bash
# $5/month for starter
https://railway.app
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/railway"
```

### 3. Netlify Deployment

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Initialize Site:**
   ```bash
   netlify init
   ```

4. **Set Environment Variables:**
   ```bash
   # Run the helper script to get formatted variables
   ./scripts/copy-env-to-clipboard.sh

   # Or set them via CLI
   netlify env:set NEXTAUTH_SECRET "5vUmFqDiGCfhn8Ay63NtidjmmWyI21KtUxMcLsm+KaQ="
   netlify env:set JWT_SECRET "279NhNODUJtCnRj/KbN/ysXeD2EX8qGQB0sbtDYqvkI="
   # ... continue for all variables
   ```

5. **Deploy:**
   ```bash
   npm run build
   netlify deploy --prod
   ```

## 🧪 Testing

### Test Email Service:
```bash
# Create .env.local with your actual Resend API key
cp .env.netlify .env.local

# Edit .env.local and add your Resend API key

# Run test
npx ts-node scripts/test-email.ts
```

### Test Database Connection:
```bash
# After setting DATABASE_URL
npx prisma db pull
npx prisma migrate deploy
npx prisma db seed
```

### Test Deployment:
```bash
# Check health endpoint
curl https://your-site.netlify.app/api/health

# Check detailed health (with API key)
curl https://your-site.netlify.app/api/health/detailed?key=admin_0007dd301387a0f3e10ac50f70407a6a2562f116b4dce2d9
```

## 📊 Service Limits & Pricing

### Resend (Email)
- **Free:** 3,000 emails/month, 100/day
- **Pro:** $20/month for 50,000 emails

### Supabase (Database)
- **Free:** 500MB storage, 2GB bandwidth
- **Pro:** $25/month for 8GB storage, 50GB bandwidth

### Netlify (Hosting)
- **Free:** 100GB bandwidth, 300 build minutes
- **Pro:** $19/month for 1TB bandwidth, 1000 build minutes

## 🔒 Security Best Practices

1. **Never commit `.env` files to Git**
2. **Rotate secrets every 90 days**
3. **Use different secrets for dev/staging/production**
4. **Enable 2FA on all service accounts**
5. **Monitor API usage and set alerts**
6. **Regular security audits**

## 📝 Files Created

1. **`.env.netlify`** - Production environment variables
2. **`SETUP_CREDENTIALS.md`** - This setup guide
3. **`scripts/copy-env-to-clipboard.sh`** - Helper script for copying env vars
4. **`scripts/test-email.ts`** - Email service test script

## 🆘 Troubleshooting

### Email Issues:
- Verify Resend API key is correct
- Check domain verification status
- Monitor rate limits (100 emails/day on free plan)

### Database Issues:
- Check connection string format
- Verify SSL requirements
- Ensure IP whitelisting if required

### Deployment Issues:
- Clear Netlify cache: `netlify deploy --clear`
- Check build logs in Netlify dashboard
- Verify all environment variables are set

## 📞 Support Contacts

- **Resend Support:** https://resend.com/support
- **Netlify Support:** https://answers.netlify.com
- **Supabase Support:** https://supabase.com/support

---

**Remember:** Keep all credentials secure and never share them publicly. This file should be kept private and not committed to version control.