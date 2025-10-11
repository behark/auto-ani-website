#!/bin/bash

echo "🚀 AUTO ANI - Fresh Deployment (Bypassing Config Issues)"
echo "======================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Ensure we have a clean build
echo -e "${YELLOW}🔨 Ensuring clean build...${NC}"
export NODE_OPTIONS="--max-old-space-size=4096"

if [ ! -d ".next" ]; then
    echo "No build found, building now..."
    npm run db:generate
    npm run build
fi

# Step 2: Create a simple netlify config for deployment
echo -e "${YELLOW}📝 Creating simple deployment config...${NC}"
cat > .netlify-deploy.toml << EOF
[build]
  command = "echo 'Build already done'"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
EOF

# Step 3: Try deployment with simple config
echo -e "${YELLOW}🌐 Deploying with simple configuration...${NC}"
npx netlify deploy --prod --dir=.next --config=.netlify-deploy.toml

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    rm .netlify-deploy.toml
else
    echo -e "${RED}❌ Deployment failed. Trying alternative method...${NC}"

    # Alternative: Deploy without config file
    echo -e "${YELLOW}🔄 Trying deployment without config...${NC}"
    npx netlify deploy --prod --dir=.next

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Alternative deployment successful!${NC}"
    else
        echo -e "${RED}❌ Both methods failed. Manual intervention needed.${NC}"
        echo "Try manually: npx netlify sites:create, then npx netlify deploy --prod --dir=.next"
    fi

    rm .netlify-deploy.toml
fi

echo -e "${GREEN}✅ Script completed!${NC}"