# 🚀 Render Environment Variables - Complete Setup Guide

**For**: AUTO ANI Website Deployment on Render
**Date**: October 7, 2025

---

## 📋 Quick Setup Checklist

Copy these variables to your Render Dashboard → Environment tab:

---

## 🔴 REQUIRED - Must Set Before Deploy

### Database (Auto-filled by Render)
```bash
DATABASE_URL=<Render will auto-fill this when you add PostgreSQL>
DIRECT_DATABASE_URL=<Same as DATABASE_URL for Render PostgreSQL>
```

### Authentication & Security
```bash
NEXTAUTH_URL=https://your-app-name.onrender.com
NEXTAUTH_SECRET=<generate-new-one-below>
JWT_SECRET=<generate-new-one-below>
```

**Generate secrets locally, then paste**:
```bash
# Run this on your machine:
openssl rand -base64 32
```

### Email Service (Resend)
```bash
RESEND_API_KEY=<your-resend-api-key>
FROM_EMAIL=contact@autosalonani.com
ADMIN_EMAIL=admin@autosalonani.com
```

**Get Resend API Key**: https://resend.com/api-keys

### Payment Processing (Stripe)
```bash
STRIPE_SECRET_KEY=<your-stripe-secret-key>
```

**Get Stripe Keys**: https://dashboard.stripe.com/apikeys

⚠️ **Important**: Use `sk_live_...` for production, not `sk_test_...`

### Public URLs
```bash
NEXT_PUBLIC_SITE_URL=https://autosalonani.com
NEXT_PUBLIC_WHATSAPP_NUMBER=38349204242
NEXT_PUBLIC_WHATSAPP_MESSAGE=Hello, I'm interested in your vehicles
```

---

## 🟡 RECOMMENDED - Add for Full Features

### Stripe (Full Integration)
```bash
STRIPE_PUBLISHABLE_KEY=<pk_live_...>
STRIPE_WEBHOOK_SECRET=<whsec_...>
```

**Setup Webhook**:
1. Go to: https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-app.onrender.com/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret

### SMS Notifications (Twilio)
```bash
TWILIO_ACCOUNT_SID=<your-account-sid>
TWILIO_AUTH_TOKEN=<your-auth-token>
TWILIO_PHONE_NUMBER=+38349204242
```

**Get Twilio Credentials**: https://console.twilio.com

### Monitoring (Sentry - Free Tier)
```bash
SENTRY_DSN=<your-sentry-dsn>
NEXT_PUBLIC_SENTRY_DSN=<same-as-above>
```

**Setup Sentry**:
1. Sign up: https://sentry.io
2. Create project: "AUTO ANI Website"
3. Copy DSN from Project Settings

### Google Services
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-api-key>
NEXT_PUBLIC_GA_ID=<your-ga-id>
```

**Setup Google Maps**: https://console.cloud.google.com
**Setup Google Analytics**: https://analytics.google.com

---

## 🟢 OPTIONAL - Add When Needed

### Redis Cache (Upstash - Free Tier)
```bash
REDIS_URL=<your-upstash-redis-url>
REDIS_TOKEN=<your-upstash-token>
```

**Setup Upstash**:
1. Sign up: https://upstash.com
2. Create Redis database
3. Copy connection details

### Image Storage (Cloudinary - Free Tier)
```bash
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

**Setup Cloudinary**: https://cloudinary.com/console

### Social Media Integration
```bash
FACEBOOK_APP_ID=<your-app-id>
FACEBOOK_APP_SECRET=<your-app-secret>
FACEBOOK_ACCESS_TOKEN=<your-page-access-token>
FACEBOOK_PAGE_ID=<your-page-id>
```

**Setup Facebook**: https://developers.facebook.com

---

## 📝 Copy-Paste Template for Render

**Render Dashboard → Your Service → Environment**

Click "Add Environment Variable" and paste these:

### Required Variables (Minimum to Start)

```
DATABASE_URL=(auto-filled by Render PostgreSQL)
DIRECT_DATABASE_URL=(same as DATABASE_URL)
NEXTAUTH_URL=https://your-app-name.onrender.com
NEXTAUTH_SECRET=(generate with: openssl rand -base64 32)
JWT_SECRET=(generate with: openssl rand -base64 32)
RESEND_API_KEY=(get from resend.com)
FROM_EMAIL=contact@autosalonani.com
ADMIN_EMAIL=admin@autosalonani.com
STRIPE_SECRET_KEY=(get from stripe.com)
NEXT_PUBLIC_SITE_URL=https://autosalonani.com
NEXT_PUBLIC_WHATSAPP_NUMBER=38349204242
NEXT_PUBLIC_WHATSAPP_MESSAGE=Hello, I'm interested in your vehicles
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Use strong random secrets (min 32 characters)
- Use production API keys (`sk_live_`, `pk_live_`)
- Rotate secrets every 90 days
- Use different secrets than development
- Enable 2FA on all service accounts

### ❌ DON'T:
- Use test/dummy values in production
- Reuse secrets from development
- Share secrets in Slack/email
- Commit secrets to git
- Use short/weak secrets

---

## 🧪 Testing Your Variables

After setting variables in Render:

1. **Trigger Deploy**: Render auto-deploys on variable change
2. **Check Logs**: Watch for startup validation
3. **Expected Output**:
```
🚀 Running startup checks...
✅ Database URL: Set
✅ NextAuth Secret: Set (32+ chars)
✅ JWT Secret: Set (32+ chars)
✅ Email API Key: Set
✅ Stripe Secret Key: Set
✅ WhatsApp Number: Set

🔌 Testing database connection...
✅ Database connection successful

📦 Enabled Integrations:
  ✅ Email Service (Resend)
  ✅ Stripe Payments
  ✅ WhatsApp Contact

✅ All startup checks passed
```

4. **Bad Output** (means variables missing/invalid):
```
❌ Invalid environment variables:
{
  "NEXTAUTH_SECRET": {
    "_errors": ["NEXTAUTH_SECRET must be at least 32 characters"]
  }
}
```

---

## 🎯 Deployment Steps

### Step 1: Set Required Variables
Set all variables in **REQUIRED** section above

### Step 2: Add Database
1. Render Dashboard → New → PostgreSQL
2. Name: `auto-ani-database`
3. Connect to your web service
4. `DATABASE_URL` auto-fills

### Step 3: Deploy
1. Push code to GitHub (trigger auto-deploy)
2. OR click "Manual Deploy" in Render

### Step 4: Verify
```bash
# Check health endpoint
curl https://your-app.onrender.com/api/health

# Expected:
{"status":"ok","database":"connected","timestamp":"..."}
```

### Step 5: Run Migrations
Render auto-runs migrations via build command:
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

---

## 🆘 Troubleshooting

### Build Fails: "Invalid environment variables"
**Solution**: Check Render logs for specific missing variable, add it

### Database Connection Fails
**Solution**: Use internal `DATABASE_URL` from Render PostgreSQL, not external

### "NEXTAUTH_SECRET must be at least 32 characters"
**Solution**: Generate new secret:
```bash
openssl rand -base64 32
```

### Stripe Webhooks Not Working
**Solution**:
1. Set `STRIPE_WEBHOOK_SECRET`
2. Configure webhook in Stripe Dashboard pointing to your Render URL

### Memory Issues (OOM)
**Solution**: Already optimized! GC triggers at 400MB. If issues persist, upgrade to Standard plan ($25/mo)

---

## 💰 Cost Estimate

### Free Tier (First 90 Days)
```
Render Web Service: Free (with sleep after 15min)
Render PostgreSQL: Free (first 90 days)
Upstash Redis: Free tier (10k commands/day)
Sentry: Free tier (5k errors/month)
Cloudinary: Free tier (25GB bandwidth)
─────────────────────────────────
TOTAL: $0/month for 90 days
```

### After 90 Days (Recommended Production)
```
Render Web Service (Starter): $7/month
Render PostgreSQL (Starter): $7/month
Upstash Redis: Free tier
Sentry: Free tier
Cloudinary: Free tier
─────────────────────────────────
TOTAL: $14/month
```

### High Traffic (Optional Upgrade)
```
Render Standard: $25/month
PostgreSQL Standard: $20/month
Upstash Pro: $10/month
─────────────────────────────────
TOTAL: $55/month
```

---

## 📊 Environment Variable Summary

| Category | Required | Recommended | Optional | Total |
|----------|----------|-------------|----------|-------|
| Database | 2 | 0 | 0 | 2 |
| Auth | 3 | 0 | 1 | 4 |
| Email | 3 | 0 | 0 | 3 |
| Payments | 1 | 2 | 0 | 3 |
| Public | 3 | 0 | 0 | 3 |
| SMS | 0 | 3 | 0 | 3 |
| Monitoring | 0 | 2 | 0 | 2 |
| Google | 0 | 2 | 0 | 2 |
| Cache | 0 | 0 | 2 | 2 |
| Storage | 0 | 0 | 3 | 3 |
| Social | 0 | 0 | 4 | 4 |
| **TOTAL** | **12** | **9** | **10** | **31** |

---

## ✅ Final Checklist

Before going live:

- [ ] All 12 required variables set in Render
- [ ] Secrets are strong (32+ characters)
- [ ] Production API keys used (not test keys)
- [ ] Database connected and migrated
- [ ] Health endpoint responding
- [ ] Stripe webhook configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Monitoring (Sentry) enabled
- [ ] Backup strategy in place

---

## 🎉 You're Ready!

Once all required variables are set:

1. ✅ Render auto-deploys
2. ✅ Startup checks validate everything
3. ✅ Database migrations run
4. ✅ App goes live!

**Your AUTO ANI website will be live at**: `https://your-app-name.onrender.com`

---

## 📞 Need Help?

- **Render Docs**: https://render.com/docs/environment-variables
- **Full Deployment Guide**: See `RENDER_DEPLOYMENT_GUIDE.md`
- **Environment Setup**: See `ENV_SETUP_GUIDE.md`
- **Troubleshooting**: See `ENV_VALIDATION_FIX.md`

---

**Generated**: October 7, 2025
**Status**: ✅ Ready for Deployment
**Next Step**: Set these variables in Render Dashboard!
