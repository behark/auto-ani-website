#!/bin/bash

# Render service ID
SERVICE_ID="srv-d3hudq8gjchc73aq6ndg"

echo "Setting environment variables for auto-ani-website on Render..."

# Core Configuration
render env set NODE_ENV=production --service $SERVICE_ID -o json
render env set DATABASE_PROVIDER=postgresql --service $SERVICE_ID -o json
render env set DATABASE_URL="postgresql://auto_ani_database_user:YJSYWhqW3bQXYfu0aX3qTPuCzVsEt29L@dpg-d3i0pn33fgac73a64kog-a.oregon-postgres.render.com/auto_ani_database" --service $SERVICE_ID -o json
render env set DIRECT_DATABASE_URL="postgresql://auto_ani_database_user:YJSYWhqW3bQXYfu0aX3qTPuCzVsEt29L@dpg-d3i0pn33fgac73a64kog-a.oregon-postgres.render.com/auto_ani_database" --service $SERVICE_ID -o json

# Authentication
render env set NEXTAUTH_URL="https://auto-ani-website.onrender.com" --service $SERVICE_ID -o json
render env set NEXTAUTH_SECRET="1Yz1tI/xgcab3HBr3OJz3FFQFDN2HHEBEPiekqiDcwAnXRJZDnLrE+5c8HIHedQk" --service $SERVICE_ID -o json
render env set JWT_SECRET="1Yz1tI/xgcab3HBr3OJz3FFQFDN2HHEBEPiekqiDcwAnXRJZDnLrE+5c8HIHedQk" --service $SERVICE_ID -o json

# Email Configuration (using dummy values for now - replace with real ones when ready)
render env set RESEND_API_KEY="re_dummy_key_replace_with_real" --service $SERVICE_ID -o json
render env set FROM_EMAIL="contact@autosalonani.com" --service $SERVICE_ID -o json
render env set ADMIN_EMAIL="admin@autosalonani.com" --service $SERVICE_ID -o json

# Public URLs
render env set NEXT_PUBLIC_SITE_URL="https://auto-ani-website.onrender.com" --service $SERVICE_ID -o json
render env set NEXT_PUBLIC_APP_URL="https://auto-ani-website.onrender.com" --service $SERVICE_ID -o json
render env set NEXT_PUBLIC_WHATSAPP_NUMBER="38349204242" --service $SERVICE_ID -o json
render env set NEXT_PUBLIC_WHATSAPP_MESSAGE="Hello, I'm interested in your vehicles" --service $SERVICE_ID -o json

# Telemetry
render env set NEXT_TELEMETRY_DISABLED="1" --service $SERVICE_ID -o json

# Optional services with dummy values (replace when you have real keys)
render env set GOOGLE_MAPS_API_KEY="dummy_key_for_build" --service $SERVICE_ID -o json
render env set STRIPE_SECRET_KEY="sk_test_51DummyTestKeyForBuildPurposesOnly123456789abcdef" --service $SERVICE_ID -o json
render env set STRIPE_PUBLISHABLE_KEY="pk_test_51DummyTestKeyForBuildPurposesOnly123456789abcdef" --service $SERVICE_ID -o json

# Twilio SMS (dummy values for build)
render env set TWILIO_ACCOUNT_SID="AC0123456789abcdef0123456789abcdef" --service $SERVICE_ID -o json
render env set TWILIO_AUTH_TOKEN="dummy_auth_token_1234567890abcdef" --service $SERVICE_ID -o json
render env set TWILIO_PHONE_NUMBER="+1234567890" --service $SERVICE_ID -o json

# Facebook/Instagram (dummy values for build)
render env set FACEBOOK_ACCESS_TOKEN="dummy_facebook_token" --service $SERVICE_ID -o json
render env set FACEBOOK_PAGE_ID="dummy_page_id" --service $SERVICE_ID -o json
render env set INSTAGRAM_ACCOUNT_ID="dummy_instagram_id" --service $SERVICE_ID -o json
render env set INSTAGRAM_ACCESS_TOKEN="dummy_instagram_token" --service $SERVICE_ID -o json

# Additional social media
render env set LINKEDIN_ACCESS_TOKEN="dummy_linkedin_token" --service $SERVICE_ID -o json
render env set TWITTER_API_KEY="dummy_twitter_key" --service $SERVICE_ID -o json
render env set TWITTER_API_SECRET="dummy_twitter_secret" --service $SERVICE_ID -o json
render env set TWITTER_ACCESS_TOKEN="dummy_twitter_access" --service $SERVICE_ID -o json
render env set TWITTER_ACCESS_SECRET="dummy_twitter_secret" --service $SERVICE_ID -o json

# SMTP Configuration
render env set EMAIL_SERVER="smtp://test:test@localhost:587" --service $SERVICE_ID -o json
render env set EMAIL_FROM="test@example.com" --service $SERVICE_ID -o json
render env set SMTP_HOST="smtp.gmail.com" --service $SERVICE_ID -o json
render env set SMTP_PORT="587" --service $SERVICE_ID -o json
render env set SMTP_USER="test@example.com" --service $SERVICE_ID -o json
render env set SMTP_PASS="test-password" --service $SERVICE_ID -o json

# Supabase Configuration (if using Supabase for storage)
render env set NEXT_PUBLIC_SUPABASE_URL="https://xojdcxswjxfhdqplrutz.supabase.co" --service $SERVICE_ID -o json
render env set NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvamRjeHN3anhmaGRxcGxydXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc4MDU2NzEsImV4cCI6MjA0MzM4MTY3MX0.mCQ3rg8T-wuXLnwGD8uoXBD1nXJOlLXtlKqaDNRKYm4" --service $SERVICE_ID -o json
render env set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvamRjeHN3anhmaGRxcGxydXR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzgwNTY3MSwiZXhwIjoyMDQzMzgxNjcxfQ.JWts5xELRHlTGWAR6FaDJVqhLlzZe6z6sgnZE_ixl2E" --service $SERVICE_ID -o json

echo "Environment variables set successfully!"
echo "Note: Remember to replace dummy values with real API keys when ready."