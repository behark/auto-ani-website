#!/bin/bash

# Script to format environment variables for easy copying to Netlify
# This outputs the variables in a format that can be easily pasted into Netlify's UI

echo "==============================================="
echo "AUTO ANI - Environment Variables for Netlify"
echo "==============================================="
echo ""
echo "Copy and paste these into Netlify Dashboard:"
echo "Site Settings > Environment Variables"
echo ""
echo "==============================================="
echo ""

cat << 'EOF'
# Core Authentication & Security
NEXTAUTH_URL=https://autosalonani.com
NEXTAUTH_SECRET=5vUmFqDiGCfhn8Ay63NtidjmmWyI21KtUxMcLsm+KaQ=
JWT_SECRET=279NhNODUJtCnRj/KbN/ysXeD2EX8qGQB0sbtDYqvkI=
SESSION_SECRET=TCloNVWjvJnaWxvxSrk+oi5x9CW2wZ0mgACOHE1mClU=
ENCRYPTION_KEY=sLNHXeoqIvO7HKS7pzG5Mq2PH/Theb+hnoIkRjdX1t4=
WEBHOOK_SECRET=f8aa13c34db8e6e470f328dff34ba3d046cac27b0c45c466
ADMIN_API_KEY=admin_0007dd301387a0f3e10ac50f70407a6a2562f116b4dce2d9

# Email Service (Resend) - REQUIRES SETUP
RESEND_API_KEY=[GET_FROM_RESEND_DASHBOARD]
FROM_EMAIL=contact@autosalonani.com
ADMIN_EMAIL=admin@autosalonani.com

# Database (REQUIRES SETUP)
DATABASE_PROVIDER=postgresql
DATABASE_URL=[YOUR_POSTGRES_CONNECTION_STRING]
DIRECT_DATABASE_URL=[YOUR_DIRECT_POSTGRES_CONNECTION_STRING]

# Public Configuration
NEXT_PUBLIC_SITE_URL=https://autosalonani.com
NEXT_PUBLIC_WHATSAPP_NUMBER=38349204242
NEXT_PUBLIC_WHATSAPP_MESSAGE=Hello, I'm interested in your vehicles

# Environment
NODE_ENV=production
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

echo ""
echo "==============================================="
echo ""
echo "NEXT STEPS:"
echo "1. Sign up at https://resend.com and get your API key"
echo "2. Set up a PostgreSQL database (Supabase, Neon, or Railway)"
echo "3. Replace [GET_FROM_RESEND_DASHBOARD] with your Resend API key"
echo "4. Replace database connection strings with your actual database URLs"
echo "5. Add all these variables to Netlify Dashboard"
echo ""
echo "==============================================="