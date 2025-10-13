# 🎯 Quick Deployment Checklist

## ✅ What's Ready

- ✅ **Code**: All fixes applied, builds successfully
- ✅ **Content**: 57 documents in Sanity (15 vehicles, 18 services, etc.)
- ✅ **Configuration**: render.yaml configured
- ✅ **Repository**: Connected to GitHub (behark/auto-ani-website)
- ✅ **Scripts**: Deployment scripts ready

## 🚨 CRITICAL: Before Deploying

### 1. Revoke Exposed Sanity Token (MUST DO FIRST!)

```
Visit: https://www.sanity.io/manage/personal/project/j2t31xge
→ API → Tokens
→ Delete token starting with: skJ1mO2e... or skVALaMv...
→ Create NEW token with Editor permissions
→ Save the new token (you'll need it for Render)
```

## 🚀 Deploy to Render (3 Options)

### Option A: Automatic Script (Recommended)

```bash
# This will commit changes and push to GitHub
./deploy-to-render.sh
```

### Option B: Manual Git Push

```bash
# Commit all changes
git add .
git commit -m "Production deployment"
git push origin main
```

### Option C: Direct to Render

1. Go to <https://dashboard.render.com/select-repo>
2. Select: behark/auto-ani-website
3. Follow configuration in RENDER_DEPLOYMENT_GUIDE.md

## 📋 Render Configuration (Copy-Paste Ready)

### Basic Settings

- **Name**: auto-ani-website
- **Region**: Frankfurt (or closest to you)
- **Branch**: main
- **Runtime**: Node

### Build Command

```bash
npm ci && NODE_OPTIONS='--max-old-space-size=1024' npm run build
```

### Start Command

```bash
npm start
```

### Environment Variables (19 total)

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://auto-ani-website.onrender.com
NEXT_PUBLIC_SANITY_PROJECT_ID=j2t31xge
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
SANITY_API_TOKEN=YOUR_NEW_TOKEN_HERE
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS=--max-old-space-size=512
UV_THREADPOOL_SIZE=2
CONTACT_EMAIL=contact@autosalonani.com
```

**⚠️ Replace `YOUR_NEW_TOKEN_HERE` with your actual new token!**

## ⏱️ Timeline

- **Git Push**: 10 seconds
- **Render Build**: 3-5 minutes
- **Total Time**: ~5 minutes to live site

## ✅ Post-Deployment Tests

Once deployed, test these URLs (replace with your actual URL):

```bash
# Homepage
https://auto-ani-website.onrender.com/

# Health Check (should show "sanity": "connected")
https://auto-ani-website.onrender.com/api/health

# Vehicles API (should return 15 vehicles)
https://auto-ani-website.onrender.com/api/vehicles

# Vehicles Page
https://auto-ani-website.onrender.com/vehicles
```

## 📊 What You Get

- **Live Website**: Fully functional automotive dealership site
- **15 Vehicles**: Already in Sanity, ready to display
- **18 Services**: Service catalog ready
- **9 Team Members**: Team page populated
- **12 Testimonials**: Customer reviews
- **Auto-Deploy**: Push to GitHub = automatic deployment
- **SSL/HTTPS**: Automatic and free
- **CDN**: Global content delivery

## 💰 Cost

- **Render Starter**: $7/month (always-on, no sleep)
- **Render Free**: $0/month (sleeps after 15 min)
- **Sanity CMS**: $0/month (free tier)

**Total**: $0-7/month

## 🆘 Need Help?

### Common Issues

**Build fails with memory error**:

- Use Starter plan or increase NODE_OPTIONS memory

**Sanity connection fails**:

- Double-check your new API token
- Verify token has Editor/Viewer permissions

**Site is slow**:

- Free tier sleeps - upgrade to Starter for always-on

### Documentation

- Full Guide: `RENDER_DEPLOYMENT_GUIDE.md`
- Sanity Guide: `SANITY_GUIDE.md`
- Security: `SECURITY_NOTICE.md`

## 🎉 Ready to Deploy

Your website is production-ready. Just:

1. ⚠️ Revoke old Sanity token
2. 🚀 Run `./deploy-to-render.sh`
3. 🌐 Configure on Render
4. ✅ Test your live site!

---

**Questions?** Check `RENDER_DEPLOYMENT_GUIDE.md` for detailed instructions.
