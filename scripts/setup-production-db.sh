#!/bin/bash

# Production Database Setup Script for AUTO ANI
# ==============================================

echo "🚀 AUTO ANI Production Database Setup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production file not found!${NC}"
    echo "Please create .env.production with your database credentials"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.production | xargs)

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
npx prisma generate

echo -e "${YELLOW}📊 Running database migrations...${NC}"
npx prisma migrate deploy

echo -e "${YELLOW}🌱 Seeding database with initial data...${NC}"
npx tsx prisma/seed.ts

echo -e "${GREEN}✅ Production database setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env.production with your actual database credentials"
echo "2. Set up your production database (Neon, Supabase, or PostgreSQL)"
echo "3. Run this script again to apply migrations and seed data"
echo "4. Deploy to your hosting platform (Netlify, Vercel, etc.)"