#!/bin/bash

# Script to check and optimize memory settings for build
# Created: 2025-10-11

# Default memory settings if not already set
if [ -z "$NEXT_MEMORY_LIMIT" ]; then
  export NEXT_MEMORY_LIMIT=3072
fi

# Set optimized Node options
export NODE_OPTIONS="--max-old-space-size=$NEXT_MEMORY_LIMIT"

echo "🧠 Memory optimization settings applied:"
echo "- NODE_OPTIONS: $NODE_OPTIONS"

# Check available memory
FREE_MEMORY=$(free -m | awk '/^Mem:/{print $2}')
echo "- System memory: ${FREE_MEMORY}MB"

# Run build with optimized settings
echo "🔨 Starting build with optimized memory settings..."
npm run build:production

# Check build exit status
BUILD_STATUS=$?
if [ $BUILD_STATUS -ne 0 ]; then
  echo "❌ Build failed with exit code $BUILD_STATUS"
  exit $BUILD_STATUS
else
  echo "✅ Build completed successfully with optimized memory settings"
fi