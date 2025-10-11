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
