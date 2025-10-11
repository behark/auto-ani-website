#!/bin/bash

# Ultra Optimized Build Script for Render Deployment
# Created: 2025-10-11
# This script aggressively reduces memory usage during build

echo "🧠 Applying extreme memory optimization settings for deployment..."

# Set high memory limit
export NODE_OPTIONS="--max-old-space-size=3072"

# 1. Clean up any existing build artifacts
echo "🧹 Cleaning up previous build artifacts..."
rm -rf .next || true
rm -rf node_modules/.cache || true

# 2. Generate Prisma client with optimized settings
echo "📊 Generating Prisma client with optimized settings..."
NODE_OPTIONS="--max-old-space-size=3072" npx prisma generate

# 3. Build with all optimizations enabled
echo "🏗️ Running Next.js build with extreme optimizations..."
NEXT_TELEMETRY_DISABLED=1 \
NODE_OPTIONS="--max-old-space-size=3072" \
next build --no-lint

# Check build exit status
BUILD_STATUS=$?
if [ $BUILD_STATUS -ne 0 ]; then
  echo "❌ Build failed with exit code $BUILD_STATUS"
  exit $BUILD_STATUS
else
  echo "✅ Build completed successfully with extreme memory optimizations"
fi
