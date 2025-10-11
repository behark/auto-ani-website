# 🐙 GitHub Repository Setup Instructions

## 🎯 Step 1: Create GitHub Repository

### Option A: Using GitHub CLI (Recommended)
If you have GitHub CLI installed:

```bash
# Login to GitHub CLI (if not already logged in)
gh auth login

# Create repository directly from command line
gh repo create auto-ani-website --public --description "🚗 AUTO ANI - Kosovo's Premier Car Dealership Website. Modern Next.js application with vehicle inventory management, lead generation, and production-ready deployment." --homepage "https://autosalonani.com"

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/auto-ani-website.git
git branch -M main
git push -u origin main
```

### Option B: Using GitHub Web Interface (Manual)

1. **Go to GitHub**: [github.com](https://github.com)
2. **Click "New Repository"** (+ icon in top right)
3. **Configure Repository**:
   - **Repository name**: `auto-ani-website`
   - **Description**: `🚗 AUTO ANI - Kosovo's Premier Car Dealership Website`
   - **Visibility**: Public (or Private if preferred)
   - **Don't initialize** with README, .gitignore, or license (we already have these)
4. **Click "Create repository"**

5. **Copy the repository URL** (should be like):
   ```
   https://github.com/YOUR_USERNAME/auto-ani-website.git
   ```

6. **Run these commands in your terminal**:
   ```bash
   # Add GitHub as remote origin
   git remote add origin https://github.com/YOUR_USERNAME/auto-ani-website.git

   # Rename main branch
   git branch -M main

   # Push code to GitHub
   git push -u origin main
   ```

---

## 🎯 Step 2: Verify Repository

After pushing, your repository should contain:

- ✅ **Source code**: All Next.js application files
- ✅ **Configuration files**: package.json, next.config.ts, etc.
- ✅ **Deployment guides**: RENDER_DEPLOYMENT_GUIDE.md
- ✅ **Environment template**: render-production.env
- ✅ **Documentation**: README.md and all guides

---

## 🎯 Step 3: Connect to Render

Once your repository is on GitHub:

1. **Go to Render Dashboard**: [dashboard.render.com](https://dashboard.render.com)
2. **Create New Web Service**
3. **Connect GitHub**: Select your `auto-ani-website` repository
4. **Configure Settings**:
   - **Name**: `auto-ani-website`
   - **Environment**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: `20.x` (automatic from engines field)

5. **Add Environment Variables**: Copy all variables from `render-production.env`

---

## 🚀 Your Repository URL

After creation, your repository will be available at:
```
https://github.com/YOUR_USERNAME/auto-ani-website
```

## 📋 Next Steps

1. ✅ **Create GitHub repository** (follow instructions above)
2. ✅ **Push code to GitHub** (git push -u origin main)
3. ✅ **Connect to Render** (use repository for deployment)
4. ✅ **Configure environment variables** (from render-production.env)
5. ✅ **Deploy and test** (your production website!)

**🎉 Your AUTO ANI website will be ready for production deployment!**