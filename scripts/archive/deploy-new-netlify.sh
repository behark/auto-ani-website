#!/bin/bash

# AUTO ANI - Deploy to New Netlify Site Script
# This script creates a new Netlify site and deploys with Supabase configuration

echo "🚀 AUTO ANI - Deploying to New Netlify Site with Supabase"
echo "========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${RED}❌ Netlify CLI is not installed${NC}"
    echo "Installing Netlify CLI globally..."
    npm install -g netlify-cli
fi

# Site name (unique identifier)
SITE_NAME="auto-ani-new-$(date +%s)"
echo -e "${YELLOW}📝 Creating new site: ${SITE_NAME}${NC}"

# Initialize new Netlify site
echo "Creating new Netlify site..."
netlify init --manual

# Set up environment variables
echo -e "${GREEN}🔐 Setting up environment variables...${NC}"

# Database configuration
netlify env:set DATABASE_URL "postgresql://postgres.xojdcxswjxfhdqplrutz:Behar123.@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
netlify env:set DATABASE_PROVIDER "postgresql"
netlify env:set DIRECT_DATABASE_URL "postgresql://postgres:Behar123.@db.xojdcxswjxfhdqplrutz.supabase.co:5432/postgres"

# Node environment
netlify env:set NODE_ENV "production"
netlify env:set NODE_VERSION "18.20.5"
netlify env:set NEXT_TELEMETRY_DISABLED "1"
netlify env:set NEXT_USE_NETLIFY_EDGE "true"

# Application settings
netlify env:set NEXT_PUBLIC_DEPLOYMENT_TYPE "production"
netlify env:set NEXT_PUBLIC_SITE_URL "https://${SITE_NAME}.netlify.app"
netlify env:set NEXT_PUBLIC_API_URL "/api"

# Security keys (using existing from .env.production)
netlify env:set NEXTAUTH_URL "https://${SITE_NAME}.netlify.app"
netlify env:set NEXTAUTH_SECRET "1Yz1tI/xgcab3HBr3OJz3FFQFDN2HHEBEPiekqiDcwAnXRJZDnLrE+5c8HIHedQk"
netlify env:set JWT_SECRET "BABEYF1wyzyGH02K6EYU5qrX1bccOfEvhBkezhfoX24="
netlify env:set ADMIN_API_KEY "BABEYF1wyzyGH02K6EYU5qrX1bccOfEvhBkezhfoX24="
netlify env:set SESSION_SECRET "BABEYF1wyzyGH02K6EYU5qrX1bccOfEvhBkezhfoX24="
netlify env:set ENCRYPTION_KEY "BABEYF1wyzyGH02K6EYU5qrX1bccOfEvhBkezhfoX24="

# WhatsApp configuration
netlify env:set NEXT_PUBLIC_WHATSAPP_NUMBER "38349204242"
netlify env:set NEXT_PUBLIC_WHATSAPP_MESSAGE "Hello, I'm interested in your vehicles"

# Dealership location
netlify env:set DEALERSHIP_ADDRESS "Gazmend Baliu, Mitrovicë, Kosovë 40000"
netlify env:set DEALERSHIP_LATITUDE "42.8914"
netlify env:set DEALERSHIP_LONGITUDE "20.8660"

# Stripe test keys (for initial setup)
netlify env:set STRIPE_SECRET_KEY "sk_test_51DummyTestKeyForBuildPurposesOnly123456789abcdef"
netlify env:set STRIPE_PUBLISHABLE_KEY "pk_test_51DummyTestKeyForBuildPurposesOnly123456789abcdef"

# Performance settings
netlify env:set LOG_LEVEL "info"
netlify env:set CACHE_TTL "3600"
netlify env:set STATIC_CACHE_TTL "31536000"

echo -e "${GREEN}✅ Environment variables set${NC}"

# Deploy the site
echo -e "${YELLOW}🚀 Deploying to Netlify...${NC}"
netlify deploy --prod --build

# Get the site URL
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "🎉 Your new site is live!"
echo "================================="
echo "Site URL: https://${SITE_NAME}.netlify.app"
echo "Admin URL: https://app.netlify.com/sites/${SITE_NAME}"
echo ""
echo "📝 Next steps:"
echo "1. Visit the site to verify it's working"
echo "2. Check /api/debug/db-connection to verify database connection"
echo "3. Update the site name in Netlify settings if desired"
echo "4. Add custom domain if needed"
echo ""
echo "⚠️  Important: The database schema needs to be pushed to Supabase"
echo "Run: npm run db:push-prod"