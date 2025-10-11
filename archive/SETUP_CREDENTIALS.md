# AUTO ANI Website - API Credentials Setup Guide

## Generated Secure Credentials

The following secure credentials have been generated for your deployment:

```env
NEXTAUTH_SECRET="5vUmFqDiGCfhn8Ay63NtidjmmWyI21KtUxMcLsm+KaQ="
JWT_SECRET="279NhNODUJtCnRj/KbN/ysXeD2EX8qGQB0sbtDYqvkI="
SESSION_SECRET="TCloNVWjvJnaWxvxSrk+oi5x9CW2wZ0mgACOHE1mClU="
ENCRYPTION_KEY="sLNHXeoqIvO7HKS7pzG5Mq2PH/Theb+hnoIkRjdX1t4="
WEBHOOK_SECRET="f8aa13c34db8e6e470f328dff34ba3d046cac27b0c45c466"
ADMIN_API_KEY="admin_0007dd301387a0f3e10ac50f70407a6a2562f116b4dce2d9"
```

**IMPORTANT SECURITY NOTES:**
- These credentials have been saved to `.env.netlify`
- Keep these secrets secure and never commit them to version control
- Rotate these secrets every 90 days for maximum security
- Use different secrets for development and production environments

## 1. Email Service Setup (Resend)

Resend is a modern email API service that's easy to set up and use.

### Step 1: Create Resend Account
1. Go to https://resend.com
2. Click "Sign Up" and create an account
3. Verify your email address

### Step 2: Get Your API Key
1. Log in to your Resend dashboard
2. Navigate to "API Keys" in the sidebar
3. Click "Create API Key"
4. Give your key a name (e.g., "AUTO ANI Production")
5. Copy the generated API key (starts with `re_`)
6. Add it to your environment variables:
   ```
   RESEND_API_KEY="re_YOUR_API_KEY_HERE"
   ```

### Step 3: Verify Your Domain (Production)
1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain: `autosalonani.com`
4. Add the provided DNS records to your domain:
   - SPF record (TXT)
   - DKIM records (CNAME)
   - Return-Path (CNAME)
5. Click "Verify Domain" after DNS propagation (usually 1-24 hours)

### Step 4: Configure Sender Email
1. Update your environment variables:
   ```
   FROM_EMAIL="contact@autosalonani.com"
   ADMIN_EMAIL="admin@autosalonani.com"
   ```

### Resend Free Tier Limits:
- 3,000 emails/month
- 100 emails/day
- No credit card required

## 2. Database Setup (PostgreSQL)

For production on Netlify, you need a cloud-hosted PostgreSQL database.

### Recommended Providers:

#### Option A: Supabase (Recommended - Free Tier Available)
1. Go to https://supabase.com
2. Create a new project
3. Get your connection strings from Settings > Database
4. Use the pooler connection string for `DATABASE_URL`
5. Use the direct connection for `DIRECT_DATABASE_URL`

#### Option B: Neon (Free Tier Available)
1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string
4. Add `?sslmode=require` to the connection string

#### Option C: Railway
1. Go to https://railway.app
2. Create a new PostgreSQL service
3. Copy the connection string from the service settings

### Database Migration:
```bash
# After setting up your database URL, run:
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

## 3. Netlify Deployment Setup

### Step 1: Environment Variables in Netlify
1. Log in to Netlify Dashboard
2. Go to Site Settings > Environment Variables
3. Add all variables from `.env.netlify` file
4. Set `NODE_VERSION` to `18` or higher

### Step 2: Build Settings
1. Go to Site Settings > Build & Deploy
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variable: `NETLIFY_NEXT_PLUGIN_SKIP=true`

### Step 3: Deploy
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to production
netlify deploy --prod
```

## 4. Optional Services Setup

### Google Maps API
1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Enable APIs: Maps JavaScript API, Geocoding API
4. Create API key and restrict to your domain
5. Add to environment: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Google reCAPTCHA
1. Go to https://www.google.com/recaptcha/admin
2. Register a new site
3. Choose reCAPTCHA v2 or v3
4. Add domain: `autosalonani.com`
5. Copy Site Key and Secret Key
6. Add to environment:
   ```
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your_site_key"
   RECAPTCHA_SECRET_KEY="your_secret_key"
   ```

### Redis (for caching/queues)
Use Upstash for serverless Redis:
1. Go to https://upstash.com
2. Create a Redis database
3. Copy the REST URL
4. Add to environment: `REDIS_URL`

## 5. Testing Your Configuration

### Test Email Service:
```bash
# Run this command to test email sending
npm run test:email
```

### Test Database Connection:
```bash
# Test database connection
npx prisma db pull
```

### Health Check:
After deployment, visit:
- https://your-site.netlify.app/api/health
- https://your-site.netlify.app/api/health/detailed?key=YOUR_ADMIN_API_KEY

## 6. Security Checklist

- [ ] All secrets are stored in environment variables
- [ ] No secrets are committed to Git
- [ ] Domain is verified in Resend
- [ ] Database uses SSL connection
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Admin API key is set and secure
- [ ] Regular secret rotation schedule is in place

## 7. Support & Troubleshooting

### Common Issues:

**Email not sending:**
- Check Resend API key is correct
- Verify domain in Resend dashboard
- Check email rate limits

**Database connection failed:**
- Verify DATABASE_URL format
- Check SSL requirements
- Ensure database is accessible from Netlify

**Authentication issues:**
- Verify NEXTAUTH_URL matches your domain
- Check NEXTAUTH_SECRET is set correctly
- Clear browser cookies and try again

### Getting Help:
- Resend Documentation: https://resend.com/docs
- Netlify Support: https://answers.netlify.com
- Project Issues: Create an issue in the repository

## Next Steps

1. Set up Resend account and get API key
2. Configure cloud PostgreSQL database
3. Add all environment variables to Netlify
4. Deploy your application
5. Test all integrations
6. Set up monitoring and alerts

Remember to keep all credentials secure and never share them publicly!