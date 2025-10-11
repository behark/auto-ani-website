#!/bin/bash

echo "🔧 AUTO ANI - Fix and Deploy Script"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Clean up build artifacts
echo -e "${YELLOW}🧹 Cleaning build artifacts...${NC}"
rm -rf .next
rm -rf node_modules/.cache
rm -f tsconfig.tsbuildinfo

# Step 2: Generate Prisma client
echo -e "${YELLOW}📦 Generating Prisma client...${NC}"
npm run db:generate

# Step 3: Fix any immediate build issues
echo -e "${YELLOW}🔨 Attempting to build project...${NC}"

# Try to build with timeout
timeout 300s npm run build || {
    echo -e "${RED}❌ Build failed or timed out${NC}"
    echo "Checking for specific issues..."

    # Check for common issues
    if [ ! -f "node_modules/@prisma/client/index.js" ]; then
        echo "❌ Prisma client not generated properly"
        npm run db:generate
    fi

    echo "Trying build again with optimizations..."
    NODE_OPTIONS="--max-old-space-size=4096" npm run build
}

# Step 4: Deploy if build successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful! Deploying...${NC}"

    # Simple deployment command
    npx netlify deploy --prod --dir=.next

    echo -e "${GREEN}🎉 Deployment complete!${NC}"
else
    echo -e "${RED}❌ Build failed. Please check the errors above.${NC}"
    exit 1
fi