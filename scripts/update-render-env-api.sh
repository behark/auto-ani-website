#!/bin/bash

# Render API configuration
API_KEY="rnd_mZhY4SDqikDRtklXJwscXPXFD3be"
SERVICE_ID="srv-d3hudq8gjchc73aq6ndg"
API_URL="https://api.render.com/v1/services/${SERVICE_ID}/env-vars"

echo "🔧 Updating environment variables on Render..."

# Function to update or create an environment variable
update_env_var() {
  local key=$1
  local value=$2

  echo "Setting ${key}..."

  # First, try to update existing
  curl -s -X PUT \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    "${API_URL}/${key}" \
    -d "{\"value\": \"${value}\"}" > /dev/null 2>&1

  # If doesn't exist, create new
  if [ $? -ne 0 ]; then
    curl -s -X POST \
      -H "Authorization: Bearer ${API_KEY}" \
      -H "Content-Type: application/json" \
      "${API_URL}" \
      -d "{\"key\": \"${key}\", \"value\": \"${value}\"}" > /dev/null 2>&1
  fi
}

# Core environment variables
update_env_var "NODE_ENV" "production"
update_env_var "DATABASE_PROVIDER" "postgresql"
update_env_var "DATABASE_URL" "postgresql://auto_ani_database_user:YJSYWhqW3bQXYfu0aX3qTPuCzVsEt29L@dpg-d3i0pn33fgac73a64kog-a.oregon-postgres.render.com/auto_ani_database"
update_env_var "DIRECT_DATABASE_URL" "postgresql://auto_ani_database_user:YJSYWhqW3bQXYfu0aX3qTPuCzVsEt29L@dpg-d3i0pn33fgac73a64kog-a.oregon-postgres.render.com/auto_ani_database"

# Authentication
update_env_var "NEXTAUTH_URL" "https://auto-ani-website.onrender.com"
update_env_var "NEXTAUTH_SECRET" "1Yz1tI/xgcab3HBr3OJz3FFQFDN2HHEBEPiekqiDcwAnXRJZDnLrE+5c8HIHedQk"
update_env_var "JWT_SECRET" "1Yz1tI/xgcab3HBr3OJz3FFQFDN2HHEBEPiekqiDcwAnXRJZDnLrE+5c8HIHedQk"

# Email (dummy for now)
update_env_var "RESEND_API_KEY" "re_dummy_key_for_build"
update_env_var "FROM_EMAIL" "contact@autosalonani.com"
update_env_var "ADMIN_EMAIL" "admin@autosalonani.com"

# Public URLs
update_env_var "NEXT_PUBLIC_SITE_URL" "https://auto-ani-website.onrender.com"
update_env_var "NEXT_PUBLIC_APP_URL" "https://auto-ani-website.onrender.com"
update_env_var "NEXT_PUBLIC_WHATSAPP_NUMBER" "38349204242"
update_env_var "NEXT_PUBLIC_WHATSAPP_MESSAGE" "Hello, I'm interested in your vehicles"

# Telemetry
update_env_var "NEXT_TELEMETRY_DISABLED" "1"

# Dummy services (replace with real values later)
update_env_var "GOOGLE_MAPS_API_KEY" "dummy_key_for_build"
update_env_var "STRIPE_SECRET_KEY" "sk_test_51DummyTestKeyForBuildPurposesOnly123456789abcdef"
update_env_var "STRIPE_PUBLISHABLE_KEY" "pk_test_51DummyTestKeyForBuildPurposesOnly123456789abcdef"
update_env_var "TWILIO_ACCOUNT_SID" "AC0123456789abcdef0123456789abcdef"
update_env_var "TWILIO_AUTH_TOKEN" "dummy_auth_token_1234567890abcdef"
update_env_var "TWILIO_PHONE_NUMBER" "+1234567890"

echo "✅ Environment variables updated!"
echo "🚀 Triggering new deployment..."

# Trigger a new deployment
curl -s -X POST \
  -H "Authorization: Bearer ${API_KEY}" \
  "https://api.render.com/v1/services/${SERVICE_ID}/deploys" | jq -r '.id'

echo "📦 Deployment triggered! Check status at: https://dashboard.render.com/web/${SERVICE_ID}"