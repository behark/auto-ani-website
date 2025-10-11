#!/bin/bash

# Migration Script: Update files to use validated env
# This script helps identify files that need to be updated to use
# the new validated environment system

echo "========================================="
echo "Environment Validation Migration Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Count files that use process.env directly
echo "📊 Scanning for files using process.env..."
echo ""

# Find all TypeScript and TSX files that use process.env
FILES_WITH_PROCESS_ENV=$(grep -r "process\.env\." \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir="node_modules" \
  --exclude-dir=".next" \
  --exclude-dir="dist" \
  --exclude="env.ts" \
  --exclude="env.client.ts" \
  --exclude="env.d.ts" \
  --exclude="*.config.ts" \
  --exclude="instrumentation.ts" \
  . | wc -l)

echo "Found $FILES_WITH_PROCESS_ENV file(s) with process.env usage"
echo ""

# Show files by directory
echo "📁 Files by directory:"
echo ""

echo "lib/ directory:"
grep -l "process\.env\." lib/*.ts 2>/dev/null | while read file; do
  count=$(grep -c "process\.env\." "$file")
  if [ -f "$file" ]; then
    echo "  ${YELLOW}●${NC} $file ($count occurrence(s))"
  fi
done

echo ""
echo "app/api/ directory:"
grep -rl "process\.env\." app/api/ 2>/dev/null | while read file; do
  if [[ "$file" == *.ts ]]; then
    count=$(grep -c "process\.env\." "$file")
    echo "  ${YELLOW}●${NC} $file ($count occurrence(s))"
  fi
done

echo ""
echo "components/ directory:"
grep -rl "process\.env\." components/ 2>/dev/null | while read file; do
  if [[ "$file" == *.tsx ]] || [[ "$file" == *.ts ]]; then
    count=$(grep -c "process\.env\." "$file")
    echo "  ${YELLOW}●${NC} $file ($count occurrence(s))"
  fi
done

echo ""
echo "========================================="
echo "Migration Steps"
echo "========================================="
echo ""
echo "1. ${GREEN}✓${NC} Created lib/env.ts with Zod validation"
echo "2. ${GREEN}✓${NC} Created lib/env.client.ts for client-side"
echo "3. ${GREEN}✓${NC} Created lib/startup-checks.ts"
echo "4. ${GREEN}✓${NC} Created instrumentation.ts"
echo "5. ${GREEN}✓${NC} Updated env.d.ts with complete types"
echo "6. ${GREEN}✓${NC} Created ENV_SETUP_GUIDE.md"
echo ""
echo "Remaining tasks:"
echo "  ${YELLOW}●${NC} Update remaining lib/ files"
echo "  ${YELLOW}●${NC} Update app/api/ routes"
echo "  ${YELLOW}●${NC} Update components as needed"
echo "  ${YELLOW}●${NC} Test application startup"
echo ""

echo "========================================="
echo "Priority Files to Update"
echo "========================================="
echo ""

# List high-priority files
echo "High priority (core functionality):"
echo "  • lib/integrations/email.ts"
echo "  • lib/integrations/twilio.ts"
echo "  • lib/integrations/resend.ts"
echo "  • lib/social.ts"
echo "  • lib/rateLimiter.ts"
echo "  • lib/api-utils.ts"
echo ""

echo "Medium priority (features):"
echo "  • lib/integrations/google-maps.ts"
echo "  • lib/integrations/googleAnalytics.ts"
echo "  • lib/monitoring/sentry.ts"
echo "  • lib/queues/*.ts"
echo ""

echo "Low priority (scripts and utilities):"
echo "  • Scripts in scripts/ directory can continue using process.env"
echo "  • Config files (*.config.ts) can continue using process.env"
echo ""

echo "========================================="
echo "Migration Pattern"
echo "========================================="
echo ""
echo "Before:"
echo "  ${RED}const apiKey = process.env.STRIPE_SECRET_KEY!${NC}"
echo ""
echo "After (server-side):"
echo "  ${GREEN}import { env } from '@/lib/env'${NC}"
echo "  ${GREEN}const apiKey = env.STRIPE_SECRET_KEY${NC}"
echo ""
echo "After (client-side):"
echo "  ${GREEN}import { clientEnv } from '@/lib/env.client'${NC}"
echo "  ${GREEN}const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL${NC}"
echo ""

echo "========================================="
echo "Testing"
echo "========================================="
echo ""
echo "After migration, test by running:"
echo "  npm run dev"
echo ""
echo "The application will:"
echo "  1. Validate all environment variables at startup"
echo "  2. Show detailed errors if any required variables are missing"
echo "  3. Display integration status (enabled/disabled)"
echo "  4. Run database and Redis connection tests"
echo ""

echo "========================================="
echo "Need Help?"
echo "========================================="
echo ""
echo "See documentation:"
echo "  • ENV_SETUP_GUIDE.md - Complete setup guide"
echo "  • lib/env.ts - Server-side validation"
echo "  • lib/env.client.ts - Client-side validation"
echo "  • lib/startup-checks.ts - Startup validation logic"
echo ""
