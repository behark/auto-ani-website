# Render Environment Variables Setup

## Project: AUTO ANI Website

Copy these environment variables to your Render.com service dashboard:

### Required Variables
```
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://auto-ani-website.onrender.com
NEXT_PUBLIC_SANITY_PROJECT_ID=j2t31xge
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=skVALaMvvJIxP9krYTpB6SYM6XgH3fe60cDRTpVg05znY5DlDGIx1LvUMre94xah8O1bk6ZIiz5QwNz7aA6B5XisFj8mWid17JAgnWh5tuncOehX5gsYt2oNpVxfpS9xsa1YWxHCjMUxkwGeeH9bynKZGz5OQFwIeNARmmN3ajJCCEfgMUiO
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS=--max-old-space-size=512
UV_THREADPOOL_SIZE=2
CONTACT_EMAIL=contact@autosalonani.com
```

### Optional Variables (for enhanced features)
```
RESEND_API_KEY=your_resend_api_key_if_using_resend_for_emails
```

### Setup Instructions
1. Login to Render.com dashboard
2. Navigate to your auto-ani-website service
3. Go to Environment tab
4. Add each variable individually using the key-value pairs above
5. For sensitive variables (like API keys), mark them as "Secret"
6. Click "Save Changes"
7. Service will automatically redeploy with new variables