#!/bin/bash

# Push Database Schema to Supabase
echo "🗄️  Pushing database schema to Supabase..."
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Try using the pooler connection first, as direct might be blocked
export DATABASE_URL="postgresql://postgres.xojdcxswjxfhdqplrutz:Behar123.@aws-1-eu-central-1.pooler.supabase.com:6543/postgres"

echo -e "${YELLOW}📝 Using pooler connection for schema push${NC}"
echo "Connection: Transaction pooler at aws-1-eu-central-1.pooler.supabase.com"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push schema to database
echo -e "${YELLOW}🔄 Pushing schema to Supabase...${NC}"
npx prisma db push --skip-generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema successfully pushed to Supabase!${NC}"

    # Create initial indexes for performance
    echo -e "${YELLOW}📊 Creating additional indexes...${NC}"
    npx prisma db execute --url "$DATABASE_URL" --file ./prisma/create-indexes.sql 2>/dev/null || true

    echo ""
    echo -e "${GREEN}🎉 Database setup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Visit Supabase Dashboard to verify tables: https://app.supabase.com/project/xojdcxswjxfhdqplrutz"
    echo "2. Run 'npm run db:seed' to add sample data (optional)"
    echo "3. Deploy to Netlify with './scripts/deploy-new-netlify.sh'"
else
    echo -e "${RED}❌ Failed to push schema to Supabase${NC}"
    echo "Please check:"
    echo "1. Database connection string is correct"
    echo "2. Supabase project is active"
    echo "3. Network connection is stable"
    exit 1
fi