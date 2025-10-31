# 🚀 Deploy AUTO ANI to Render - Quick Guide

## Environment Variables for Render Dashboard

Copy these **4 environment variables** into your Render service:

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-app-name.onrender.com
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS=--max-old-space-size=512
```

**Optional (if you have contact form email):**
```bash
CONTACT_EMAIL=contact@autosalonani.com
```

---

## Build Settings for Render Dashboard

**Build Command:**
```bash
npm ci && npm run build
```

**Start Command:**
```bash
npm start
```

**Region:** Frankfurt (closest to Kosovo)

**Plan:** Starter (512MB RAM)

**Node Version:** 20.x (auto-detected)

---

## Quick Deployment Steps

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Render Service**:
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select branch: `main`

3. **Configure Service**:
   - Name: `auto-ani-website`
   - Region: `Frankfurt`
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`

4. **Add Environment Variables** (see above)

5. **Deploy!** - Click "Create Web Service"

---

## After First Deployment

Update `NEXT_PUBLIC_SITE_URL` with your actual Render URL:
- Go to: Environment → Edit `NEXT_PUBLIC_SITE_URL`
- Change to: `https://your-actual-app-name.onrender.com`
- Save and redeploy

---

## ✅ What's Included

- ✅ 13 vehicles with complete data
- ✅ 178 images (156MB) stored locally
- ✅ No external dependencies or databases
- ✅ Fast static generation
- ✅ Production-ready

---

## 📊 Expected Performance

- **First deployment**: ~5-7 minutes
- **RAM usage**: 50-100MB (well within 512MB plan)
- **Build time**: ~2-3 minutes
- **Cold start**: ~2-3 seconds
- **Subsequent deployments**: ~3-5 minutes

---

## 🔍 Verify Deployment

After deployment:
- ✅ Homepage loads: `https://your-app.onrender.com`
- ✅ Vehicles page: `https://your-app.onrender.com/vehicles`
- ✅ Sample vehicle: `https://your-app.onrender.com/vehicles/bmw-x4-30d-xdrive-m-sport-2022`
- ✅ Images load correctly

---

## 💰 Cost

**Render Starter Plan:**
- Free tier available (with limitations)
- Paid: $7/month (512MB RAM)
- More than sufficient for this website

**No other costs:**
- ❌ No database costs
- ❌ No CMS costs
- ❌ No CDN costs
- ✅ Everything included in one price
