#!/bin/bash

echo "🚀 AUTO ANI - Quick Deploy Fix"
echo "=============================="

# Step 1: Clean and prepare
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf node_modules/.cache

# Step 2: Generate Prisma client
echo "📦 Generating Prisma client..."
npm run db:generate

# Step 3: Build with memory optimization
echo "🔨 Building with optimizations..."
export NODE_OPTIONS="--max-old-space-size=6144"
npm run build

# Step 4: Deploy to existing Netlify site
echo "🌐 Deploying..."
npx netlify deploy --prod --dir=.next

echo "✅ Done! Check your Netlify dashboard for the deployment status."