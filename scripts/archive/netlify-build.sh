#!/bin/bash

echo "Starting Netlify build process..."

# Set memory limits
export NODE_OPTIONS="--max-old-space-size=4096"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build Next.js app with proper memory management
echo "Building Next.js app..."
npm run build

echo "Build complete!"

# Note: Database operations removed from build process
# These should be done separately after deployment