#!/bin/bash

# AUTO ANI - Create New Netlify Site and Deploy
echo "🚀 Creating new AUTO ANI production site on Netlify..."

# Generate unique site name
TIMESTAMP=$(date +%s)
SITE_NAME="auto-ani-prod-${TIMESTAMP}"

echo "📦 Site name: ${SITE_NAME}"

# Build the project first
echo "🔨 Building project..."
npm run db:generate:dev
npm run build

# Deploy directly to a new site
echo "🌐 Deploying to new Netlify site..."
npx netlify deploy --prod --dir=.next --site --name="${SITE_NAME}" --message="Initial deployment of AUTO ANI website"

echo "✅ Deployment complete!"
echo "📌 Your site should be available at: https://${SITE_NAME}.netlify.app"
echo ""
echo "📝 Next steps:"
echo "1. Go to https://app.netlify.com to see your new site"
echo "2. Add environment variables in the Netlify dashboard"
echo "3. Set up a PostgreSQL database (Neon or Supabase)"
echo "4. Update the DATABASE_URL environment variable"