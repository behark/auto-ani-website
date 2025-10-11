#!/bin/bash

# AUTO ANI - Netlify Deployment Script
# This script deploys the website to Netlify with all required environment variables

set -e  # Exit on error

echo "🚀 AUTO ANI - Netlify Deployment Script"
echo "======================================="

# Check if already logged in to Netlify
echo "📝 Checking Netlify authentication..."
if ! npx netlify status &>/dev/null; then
    echo "❌ Not logged in to Netlify"
    echo "Please run: npx netlify login"
    echo "Then run this script again"
    exit 1
fi

echo "✅ Authenticated with Netlify"

# Generate a unique site name
SITE_NAME="auto-ani-$(date +%s)"
echo "📦 Creating new site: $SITE_NAME"

# Create new site
npx netlify sites:create --name "$SITE_NAME" || {
    echo "❌ Failed to create site"
    echo "Trying with a different name..."
    SITE_NAME="auto-ani-website-$(date +%s)"
    npx netlify sites:create --name "$SITE_NAME"
}

echo "✅ Site created: $SITE_NAME"

# Set environment variables from .env.netlify
echo "🔐 Setting environment variables..."

# Read .env.netlify and set variables
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ ! "$key" =~ ^# ]] && [[ -n "$key" ]]; then
        # Remove quotes from value
        value="${value%\"}"
        value="${value#\"}"

        # Skip placeholder values
        if [[ ! "$value" =~ "YOUR_" ]] && [[ ! "$value" =~ "your_" ]] && [[ ! "$value" =~ "placeholder" ]]; then
            echo "  Setting: $key"
            npx netlify env:set "$key" "$value" --scope production 2>/dev/null || true
        fi
    fi
done < .env.netlify

# Set critical variables with generated values
echo "🔒 Setting critical environment variables..."

npx netlify env:set NEXTAUTH_URL "https://$SITE_NAME.netlify.app" --scope production
npx netlify env:set NEXT_PUBLIC_SITE_URL "https://$SITE_NAME.netlify.app" --scope production
npx netlify env:set NODE_ENV "production" --scope production
npx netlify env:set DATABASE_PROVIDER "postgresql" --scope production

# Use a demo database URL for now (SQLite in memory)
# Replace this with your actual PostgreSQL URL
npx netlify env:set DATABASE_URL "file:./prisma/dev.db" --scope production

echo "✅ Environment variables configured"

# Link the site to the current directory
echo "🔗 Linking site to current directory..."
npx netlify link --id "$(npx netlify api getSite --data "{\"name\":\"$SITE_NAME\"}" 2>/dev/null | grep -o '"id":"[^"]*' | cut -d'"' -f4)"

# Deploy the site
echo "🚀 Deploying to Netlify..."
echo "This may take 5-10 minutes..."

npx netlify deploy --prod --build || {
    echo "❌ Deployment failed"
    echo ""
    echo "Common issues:"
    echo "1. Missing database URL - Set up PostgreSQL first"
    echo "2. Build errors - Check the logs above"
    echo "3. Missing dependencies - Run npm install"
    echo ""
    echo "To retry deployment:"
    echo "npx netlify deploy --prod --build"
    exit 1
}

echo ""
echo "🎉 ============================================"
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "🎉 ============================================"
echo ""
echo "📌 Site URL: https://$SITE_NAME.netlify.app"
echo "📌 Admin URL: https://app.netlify.com/sites/$SITE_NAME"
echo ""
echo "📝 Next Steps:"
echo "1. Set up PostgreSQL database (Neon or Supabase)"
echo "2. Update DATABASE_URL in Netlify environment variables"
echo "3. Set up custom domain (optional)"
echo "4. Configure email service (Resend)"
echo ""
echo "To update environment variables:"
echo "npx netlify env:set DATABASE_URL 'your-postgresql-url' --scope production"
echo ""
echo "To redeploy after changes:"
echo "npx netlify deploy --prod --build"