#!/bin/bash

# Render Deployment Script for Auto ANI Website
# Created: 2025-10-11
# This script is used by Render.com to build the project

set -e # Exit immediately if a command fails

echo "🚀 Starting Auto ANI Website deployment on Render..."

# Step 0: Setup production environment
echo "⚙️ Setting up production environment..."
# Environment variables are set via Render dashboard
echo "✅ Using Render environment variables"

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
NODE_OPTIONS="--max-old-space-size=3072" npm ci --no-audit --no-fund

# Step 2: Fix Prisma OpenSSL compatibility
echo "🔒 Fixing Prisma OpenSSL compatibility..."
bash scripts/fix-prisma-openssl.sh

# Step 3: Generate Prisma client
echo "🔄 Generating Prisma client..."
NODE_OPTIONS="--max-old-space-size=3072" npx prisma generate

# Step 4: Build with extreme memory optimizations
echo "🏗️ Building Next.js application..."
NEXT_TELEMETRY_DISABLED=1 \
NODE_OPTIONS="--max-old-space-size=3072" \
next build --no-lint

# Step 5: Initialize database (only if DATABASE_URL is set)
if [ ! -z "$DATABASE_URL" ]; then
  echo "🔄 Initializing database..."
  npx prisma db push --accept-data-loss || echo "⚠️  Database initialization failed or already done"
fi

echo "✅ Deployment build completed successfully!"
