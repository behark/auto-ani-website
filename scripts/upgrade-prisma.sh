#!/bin/bash

# Script to upgrade Prisma and fix OpenSSL compatibility issues
# Created: 2025-10-11

echo "📦 Upgrading Prisma to fix OpenSSL compatibility..."
npm install --save-dev prisma@latest
npm install @prisma/client@latest

echo "🔄 Generating Prisma client with new version..."
npx prisma generate

echo "✅ Upgrade complete. Prisma now uses OpenSSL 3.x compatible libraries."