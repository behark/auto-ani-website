# Render Environment Variables

Copy these environment variables to your Render dashboard:

## 🔑 Required Variables

### Database Configuration
```
DATABASE_URL=postgresql://your-neon-connection-string
DATABASE_PROVIDER=postgresql
```

### Authentication
```
NEXTAUTH_URL=https://auto-ani-website.onrender.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
JWT_SECRET=generate-with-openssl-rand-base64-32
```

### Email Service
```
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=contact@autosalonani.com
ADMIN_EMAIL=admin@autosalonani.com
```

### Site Configuration
```
NEXT_PUBLIC_SITE_URL=https://auto-ani-website.onrender.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## 📱 Optional Variables

### Analytics (if using)
```
NEXT_PUBLIC_GA_ID=your-google-analytics-id
NEXT_PUBLIC_FB_PIXEL_ID=your-facebook-pixel-id
```

### Maps (if using)
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### WhatsApp
```
NEXT_PUBLIC_WHATSAPP_NUMBER=38349204242
```

### Redis (if using)
```
REDIS_URL=your-redis-connection-string
```

## 🔐 How to Generate Secrets

Run these commands locally to generate secure secrets:

```bash
# For NEXTAUTH_SECRET and JWT_SECRET
openssl rand -base64 32

# For other secrets
openssl rand -hex 32
```

## 📋 Setting Variables in Render

1. Go to your service dashboard
2. Click "Environment" tab
3. Click "Add Environment Variable"
4. Add each variable one by one
5. Deploy after adding all variables

## ⚠️ Important Notes

- Set `NEXTAUTH_URL` to your actual Render service URL
- Use your real database connection string from Neon/Supabase
- Don't commit these values to Git - they're secrets!
- You can update these later without redeploying

## 🔄 After Deployment

Once deployed, update these URLs in your services:
- Database whitelist (if applicable)
- Email service allowed domains
- OAuth callback URLs
- Analytics domain verification