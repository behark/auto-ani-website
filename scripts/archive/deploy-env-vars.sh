#!/bin/bash

# Set essential environment variables for Netlify deployment
echo "Setting environment variables for production deployment..."

# Database (placeholder for now)
netlify env:set DATABASE_URL "postgresql://placeholder:placeholder@placeholder.com/placeholder?sslmode=require"
netlify env:set DATABASE_PROVIDER "postgresql"

# Authentication
netlify env:set NEXTAUTH_URL "https://auto-ani-kosovo-dealership.netlify.app"
netlify env:set NEXTAUTH_SECRET "+kHyKLkx9oEZIJCqw6LWvMew7ZNirvTNEHHxVoh0aPI="
netlify env:set JWT_SECRET "cwIj20K7cIS89F9kfsRnCqMJqO/8JSUBvJINWeZLVSM="

# Core Settings
netlify env:set NEXT_PUBLIC_SITE_URL "https://auto-ani-kosovo-dealership.netlify.app"
netlify env:set NODE_ENV "production"

# Email (placeholder)
netlify env:set RESEND_API_KEY "re_placeholder"
netlify env:set FROM_EMAIL "contact@autosalonani.com"
netlify env:set ADMIN_EMAIL "admin@autosalonani.com"

# WhatsApp
netlify env:set NEXT_PUBLIC_WHATSAPP_NUMBER "38349204242"
netlify env:set NEXT_PUBLIC_WHATSAPP_MESSAGE "Hello, I'm interested in your vehicles"

# Dealership Location
netlify env:set DEALERSHIP_ADDRESS "Gazmend Baliu, Mitrovicë, Kosovë 40000"
netlify env:set DEALERSHIP_LATITUDE "42.8914"
netlify env:set DEALERSHIP_LONGITUDE "20.8660"

# Security
netlify env:set ADMIN_API_KEY "$(openssl rand -base64 32)"
netlify env:set SESSION_SECRET "$(openssl rand -base64 32)"
netlify env:set ENCRYPTION_KEY "$(openssl rand -base64 32 | head -c 32)"
netlify env:set WEBHOOK_SECRET "$(openssl rand -hex 16)"

# Rate Limiting
netlify env:set RATE_LIMIT_ENABLED "true"
netlify env:set RATE_LIMIT_WINDOW_MS "900000"
netlify env:set RATE_LIMIT_MAX_REQUESTS "100"

# Performance
netlify env:set CACHE_TTL "3600"
netlify env:set STATIC_CACHE_TTL "31536000"
netlify env:set ENABLE_PERFORMANCE_MONITORING "true"

# Application
netlify env:set NEXT_PUBLIC_APP_VERSION "1.0.0"
netlify env:set LOG_LEVEL "info"

echo "Environment variables set successfully!"
