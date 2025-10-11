# 🚀 AUTO ANI - Render Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Required Services Setup (Before Render Deployment)

1. **📊 PostgreSQL Database** (Choose one):
   - ✅ **Render PostgreSQL** (Recommended for simplicity)
   - ✅ **Supabase** (Free tier available, great for startups)

2. **📧 Email Service** (Required):
   - ✅ **Resend** (Recommended - developer-friendly, reliable)

3. **📈 Error Tracking** (Highly Recommended):
   - ✅ **Sentry** (Free tier available, excellent error tracking)

4. **🖼️ Image Storage** (Required for vehicle photos):
   - ✅ **Cloudinary** (Recommended - automatic optimization)

---

## 🎯 Step 1: Generate Security Secrets

**⚠️ CRITICAL: Generate these secrets before deployment**

```bash
# Generate all required secrets
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "SESSION_SECRET=$(openssl rand -base64 32)"
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)"
echo "ADMIN_API_KEY=$(openssl rand -base64 32)"
echo "WEBHOOK_SECRET=$(openssl rand -hex 32)"
echo "HEALTH_CHECK_API_KEY=$(openssl rand -base64 32)"
```

**📝 Save these secrets securely - you'll need them for Render!**

---

## 🎯 Step 2: Set Up External Services

### 📊 Database Setup (Render PostgreSQL - Recommended)

1. **Go to Render Dashboard** → **New** → **PostgreSQL**
2. **Configure Database**:
   - Name: `auto-ani-database`
   - Database: `auto_ani_db`
   - User: `auto_ani_user`
   - Plan: Choose based on your needs (Start with Starter)

### 📧 Email Setup (Resend - Recommended)

1. **Sign up at [resend.com](https://resend.com)**
2. **Get API Key** from Dashboard
3. **Save Credentials**:
   ```
   RESEND_API_KEY=re_your_actual_api_key
   FROM_EMAIL=noreply@autosalonani.com
   ADMIN_EMAIL=admin@autosalonani.com
   ```

### 🖼️ Image Storage Setup (Cloudinary)

1. **Sign up at [cloudinary.com](https://cloudinary.com)**
2. **Get Credentials** from Dashboard
3. **Save Credentials**:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

---

## 🎯 Step 3: Deploy to Render

### 1. **Create Web Service**

1. **Go to Render Dashboard** → **New** → **Web Service**
2. **Connect GitHub Repository**:
   - Select your AUTO ANI repository
   - Branch: `main`

### 2. **Configure Build Settings**

```yaml
# Build Configuration
Name: auto-ani-website
Environment: Node
Region: Frankfurt (closest to Kosovo)
Branch: main
Build Command: npm ci && npm run build
Start Command: npm start
```

### 3. **Configure Environment Variables**

**📋 Copy-Paste All Variables from `render-production.env`**

Go to **Environment** tab and add these **CRITICAL** variables:

#### 🔐 Security Variables (REQUIRED)
```bash
NODE_ENV=production
NEXTAUTH_SECRET=your_generated_nextauth_secret
JWT_SECRET=your_generated_jwt_secret
SESSION_SECRET=your_generated_session_secret
ENCRYPTION_KEY=your_generated_encryption_key
ADMIN_API_KEY=your_generated_admin_api_key
WEBHOOK_SECRET=your_generated_webhook_secret
```

#### 🌐 Site Configuration (REQUIRED)
```bash
NEXT_PUBLIC_SITE_URL=https://your-render-app.onrender.com
NEXTAUTH_URL=https://your-render-app.onrender.com
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### 🗄️ Database Configuration (REQUIRED)
```bash
DATABASE_URL=your_postgresql_connection_string
DIRECT_DATABASE_URL=your_postgresql_connection_string
DATABASE_PROVIDER=postgresql
DATABASE_POOL_SIZE=10
```

#### 📧 Email Configuration (REQUIRED)
```bash
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=noreply@autosalonani.com
ADMIN_EMAIL=admin@autosalonani.com
```

#### 🖼️ Image Storage (REQUIRED)
```bash
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

#### 🔧 Observability (ENABLE FOR MONITORING)
```bash
TELEMETRY_ENABLED=true
METRICS_ENABLED=true
METRICS_ALERTING_ENABLED=true
DASHBOARD_ALERTS_ENABLED=true
LOG_LEVEL=info
```

---

## ✅ Final Deployment Checklist

### Before Going Live:

- [ ] **All environment variables are set** (from `render-production.env`)
- [ ] **Database is created and accessible**
- [ ] **Email service is configured**
- [ ] **Image storage is working** (Cloudinary integration)
- [ ] **Health endpoints respond** (`/api/health` returns 200)
- [ ] **SSL certificate is active** (HTTPS working)

### After Going Live:

- [ ] **Monitor error rates** (should be < 1%)
- [ ] **Check performance metrics**
- [ ] **Test all major features** (vehicle browsing, contact forms)
- [ ] **Set up monitoring alerts**

---

## 🎉 Congratulations!

Your AUTO ANI website is now ready for production on Render!

**🔗 Your website will be available at**: `https://your-render-app.onrender.com`

Remember to monitor performance and keep dependencies updated!

**Good luck with your Kosovo car dealership! 🚗✨**