#!/bin/bash

# Apply all memory optimization fixes to Auto ANI Website
# Created: 2025-10-11

# Function to display message with colors
function display_message() {
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m' # No Color
    
    echo -e "${YELLOW}[AUTO-ANI MEMORY OPTIMIZER]${NC} ${GREEN}$1${NC}"
}

display_message "Starting memory optimization process..."

# Step 1: Ensure we have the latest changes
display_message "Applying configuration changes..."

# Apply modifications to render.yaml
if [ -f "render.yaml" ]; then
    display_message "Updating render.yaml with optimized build command..."
    cat > render.yaml << 'EOL'
services:
  - type: web
    name: auto-ani-website
    env: node
    plan: starter  # $25/month for reliable performance
    region: frankfurt  # Closest to Kosovo
    branch: main
    repo: https://github.com/behark/auto-ani-website
    buildCommand: bash scripts/render-deploy.sh
    startCommand: npm start
    healthCheckPath: /api/health

    # Environment variables (to be set via CLI/dashboard)
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_PROVIDER
        value: postgresql
      - key: NEXT_TELEMETRY_DISABLED
        value: "1"

    # Render-specific optimizations
    autoDeploy: true
    numInstances: 1
EOL
    display_message "✅ render.yaml updated successfully"
else
    display_message "❌ render.yaml not found. Make sure you're in the project root directory."
    exit 1
fi

# Step 2: Create all required scripts
display_message "Creating optimized build scripts..."

# Create scripts directory if it doesn't exist
mkdir -p scripts

# Create render-deploy.sh
display_message "Creating render-deploy.sh..."
cat > scripts/render-deploy.sh << 'EOL'
#!/bin/bash

# Render Deployment Script for Auto ANI Website
# Created: 2025-10-11
# This script is used by Render.com to build the project

set -e # Exit immediately if a command fails

echo "🚀 Starting Auto ANI Website deployment on Render..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
NODE_OPTIONS="--max-old-space-size=3072" npm ci --no-audit --no-fund

# Step 2: Fix Prisma OpenSSL compatibility
echo "🔒 Fixing Prisma OpenSSL compatibility..."
bash scripts/fix-prisma-openssl.sh

# Step 3: Generate Prisma client
echo "🔄 Generating Prisma client..."
NODE_OPTIONS="--max-old-space-size=3072" npx prisma generate

# Step 4: Build with extreme memory optimizations
echo "🏗️ Building Next.js application..."
NEXT_TELEMETRY_DISABLED=1 \
NODE_OPTIONS="--max-old-space-size=3072" \
next build --no-lint

echo "✅ Deployment build completed successfully!"
EOL
chmod +x scripts/render-deploy.sh

# Create fix-prisma-openssl.sh
display_message "Creating fix-prisma-openssl.sh..."
cat > scripts/fix-prisma-openssl.sh << 'EOL'
#!/bin/bash

# Script to fix Prisma OpenSSL compatibility issues in production
# Created: 2025-10-11

echo "🔒 Fixing Prisma OpenSSL compatibility issues..."

# Store current directory
CURRENT_DIR=$(pwd)

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
cd $TEMP_DIR

# Create a minimal package.json
cat > package.json << EOF
{
  "name": "prisma-fix",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@prisma/client": "latest",
    "prisma": "latest"
  }
}
EOF

# Install latest Prisma
echo "📦 Installing latest Prisma version with OpenSSL 3.x support..."
npm install --no-fund --no-audit

# Copy the new libraries over the old ones in the project
echo "🔄 Replacing outdated OpenSSL libraries..."
if [ -d "$CURRENT_DIR/node_modules/.prisma/client" ]; then
  find . -name "*.so.node" | xargs -I{} cp -v {} "$CURRENT_DIR/node_modules/.prisma/client/"
fi

if [ -d "$CURRENT_DIR/node_modules/prisma" ]; then
  find . -name "*.so.node" | xargs -I{} cp -v {} "$CURRENT_DIR/node_modules/prisma/"
fi

# Clean up
cd $CURRENT_DIR
rm -rf $TEMP_DIR

echo "✅ Prisma OpenSSL compatibility fix complete!"
EOL
chmod +x scripts/fix-prisma-openssl.sh

# Create extreme-build.sh
display_message "Creating extreme-build.sh..."
cat > scripts/extreme-build.sh << 'EOL'
#!/bin/bash

# Ultra Optimized Build Script for Render Deployment
# Created: 2025-10-11
# This script aggressively reduces memory usage during build

echo "🧠 Applying extreme memory optimization settings for deployment..."

# Set high memory limit
export NODE_OPTIONS="--max-old-space-size=3072"

# 1. Clean up any existing build artifacts
echo "🧹 Cleaning up previous build artifacts..."
rm -rf .next || true
rm -rf node_modules/.cache || true

# 2. Generate Prisma client with optimized settings
echo "📊 Generating Prisma client with optimized settings..."
NODE_OPTIONS="--max-old-space-size=3072" npx prisma generate

# 3. Build with all optimizations enabled
echo "🏗️ Running Next.js build with extreme optimizations..."
NEXT_TELEMETRY_DISABLED=1 \
NODE_OPTIONS="--max-old-space-size=3072" \
next build --no-lint

# Check build exit status
BUILD_STATUS=$?
if [ $BUILD_STATUS -ne 0 ]; then
  echo "❌ Build failed with exit code $BUILD_STATUS"
  exit $BUILD_STATUS
else
  echo "✅ Build completed successfully with extreme memory optimizations"
fi
EOL
chmod +x scripts/extreme-build.sh

# Step 3: Update package.json scripts
display_message "Updating package.json build scripts..."
node -e "
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Update build scripts
packageJson.scripts['build:production'] = \"NODE_OPTIONS='--max-old-space-size=3072' npx prisma generate && NODE_OPTIONS='--max-old-space-size=3072' next build --no-lint\";

// Add new scripts if they don't exist
if (!packageJson.scripts['build:extreme']) {
  packageJson.scripts['build:extreme'] = 'bash scripts/extreme-build.sh';
}

if (!packageJson.scripts['prisma:fix-openssl']) {
  packageJson.scripts['prisma:fix-openssl'] = 'bash scripts/fix-prisma-openssl.sh';
}

fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
"

display_message "✅ Memory optimization complete! Your project is now configured for optimal deployment on Render."
display_message "To test the optimized build locally, run: npm run build:extreme"