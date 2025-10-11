#!/bin/bash

# Set all environment variables for the new Netlify site

echo "Setting environment variables for auto-ani-supabase..."

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
netlify env:set NEXT_PUBLIC_SITE_URL "https://auto-ani-supabase.netlify.app"
netlify env:set NEXT_PUBLIC_API_URL "/api"

# Security keys
netlify env:set NEXTAUTH_URL "https://auto-ani-supabase.netlify.app"
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

# Stripe test keys
netlify env:set STRIPE_SECRET_KEY "sk_test_51DummyTestKeyForBuildPurposesOnly123456789abcdef"
netlify env:set STRIPE_PUBLISHABLE_KEY "pk_test_51DummyTestKeyForBuildPurposesOnly123456789abcdef"
netlify env:set PAYMENT_CURRENCY "EUR"

# Performance settings
netlify env:set LOG_LEVEL "info"
netlify env:set CACHE_TTL "3600"
netlify env:set STATIC_CACHE_TTL "31536000"

echo "✅ All environment variables have been set!"