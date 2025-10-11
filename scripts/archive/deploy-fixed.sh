#!/bin/bash

echo "🎯 AUTO ANI - Fixed Deployment Script"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set optimized environment
export NODE_OPTIONS="--max-old-space-size=4096"

echo -e "${BLUE}🔧 Environment optimized for build${NC}"

# Step 1: Clean previous builds
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
rm -rf .next
rm -rf node_modules/.cache
rm -f tsconfig.tsbuildinfo

# Step 2: Generate Prisma client
echo -e "${YELLOW}📦 Generating Prisma client...${NC}"
npm run db:generate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to generate Prisma client${NC}"
    exit 1
fi

# Step 3: Build the project
echo -e "${YELLOW}🔨 Building the project...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully!${NC}"

# Step 4: Deploy options
echo -e "${BLUE}📋 Deployment options:${NC}"
echo "1. Deploy to existing Netlify site: npx netlify deploy --prod --dir=.next"
echo "2. Create new Netlify site: npx netlify deploy --prod --dir=.next --site"
echo "3. Deploy to Vercel: npx vercel --prod"
echo ""

# Auto-deploy to existing site if netlify config exists
if [ -f ".netlify/state.json" ]; then
    echo -e "${GREEN}🚀 Deploying to existing Netlify site...${NC}"
    npx netlify deploy --prod --dir=.next

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}🎉 Deployment successful!${NC}"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  No existing Netlify site found.${NC}"
    echo "Run one of the commands above to deploy."
fi

echo -e "${GREEN}✅ Script completed!${NC}"