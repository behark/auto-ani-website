# AUTO ANI API Integrations

## Overview
This directory contains production-ready API integrations for the AUTO ANI website. All integrations include proper error handling, retry logic, rate limiting, and caching mechanisms.

## Implemented Integrations

### 1. Stripe Payment Processing (`stripe.ts`)
- **Purpose**: Handle vehicle deposits, full payments, and refunds
- **Features**:
  - Payment Intent creation for direct card payments
  - Checkout Session for hosted payment pages
  - Webhook handling for payment events
  - Customer management with caching
  - Refund processing
  - Payment statistics and tracking

**Required Environment Variables**:
```env
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

### 2. Twilio SMS Service (`twilio.ts`)
- **Purpose**: Send SMS notifications for inquiries, appointments, and updates
- **Features**:
  - Single and bulk SMS sending
  - Template-based SMS with variable substitution
  - Rate limiting (20 SMS/minute default)
  - Status tracking and callbacks
  - Phone number formatting for Kosovo/Serbia
  - Appointment reminders and confirmations

**Required Environment Variables**:
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+383XXXXXXXX
SMS_RATE_LIMIT=20
```

### 3. Google Maps Integration (`google-maps.ts`)
- **Purpose**: Handle location services, directions, and delivery tracking
- **Features**:
  - Address geocoding and reverse geocoding
  - Distance matrix calculations
  - Turn-by-turn directions
  - Place search
  - Delivery tracking with real-time updates
  - Static map URL generation
  - Caching for frequent queries

**Required Environment Variables**:
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
DEALERSHIP_ADDRESS=Your Dealership Address, Pristina, Kosovo
DEALERSHIP_LATITUDE=42.6629
DEALERSHIP_LONGITUDE=21.1655
```

### 4. Resend Email Service (`resend.ts`)
- **Purpose**: Production email delivery with templates and tracking
- **Features**:
  - Single and bulk email sending
  - Template-based emails with personalization
  - HTML and plain text support
  - Attachments and metadata
  - Retry logic with exponential backoff
  - Delivery tracking and statistics
  - Contact form notifications
  - Vehicle inquiry alerts
  - Appointment confirmations

**Required Environment Variables**:
```env
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=contact@autosalonani.com
ADMIN_EMAIL=admin@autosalonani.com
```

### 5. Social Media Automation (`social-media.ts`)
- **Purpose**: Automate Facebook and Instagram posting for vehicles
- **Features**:
  - Facebook Page posting (text, single, and multiple images)
  - Instagram Business posting
  - Scheduled posting
  - Vehicle-specific post generation
  - Hashtag generation
  - Post performance metrics
  - Bulk vehicle posting

**Required Environment Variables**:
```env
FACEBOOK_ACCESS_TOKEN=your_long_lived_page_access_token
FACEBOOK_PAGE_ID=your_facebook_page_id
INSTAGRAM_ACCOUNT_ID=your_instagram_business_account_id
```

### 6. Vehicle Valuation Service (`vehicle-valuation.ts`)
- **Purpose**: Provide market value estimates for vehicles
- **Features**:
  - Market-based valuation using similar listings
  - Historical data analysis
  - Depreciation modeling
  - MSRP estimation
  - Condition and mileage adjustments
  - Price recommendations with dealer margins
  - Valuation history tracking
  - Multiple data source aggregation

**Note**: This service uses internal algorithms and database comparisons. No external API keys required.

### 7. Webhook System (`webhooks.ts`)
- **Purpose**: Real-time data synchronization with external systems
- **Features**:
  - Webhook registration and management
  - Event subscription system
  - HMAC signature verification (SHA256)
  - Retry logic with exponential backoff
  - Delivery tracking and statistics
  - Automatic webhook disabling after failures
  - Test webhook delivery
  - Comprehensive event types

**Required Environment Variables**:
```env
WEBHOOK_SECRET=your-webhook-secret-for-external-integrations
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_TIMEOUT_MS=5000
DISABLE_WEBHOOK_AFTER_FAILURES=10
```

## Common Features Across All Integrations

### Error Handling
- Custom error classes for different scenarios
- Graceful degradation on service unavailability
- Detailed error logging without exposing sensitive data
- User-friendly error messages

### Retry Logic
- Exponential backoff with configurable parameters
- Smart retry conditions based on error types
- Maximum retry limits to prevent infinite loops
- Network error and rate limit handling

### Caching
- In-memory caching for frequent queries
- TTL-based cache expiration
- Cache invalidation strategies
- Reduced API calls and improved performance

### Rate Limiting
- Client-side rate limiting to respect API quotas
- Queue systems for high-volume requests
- Batch processing for bulk operations
- Configurable rate limits per service

### Security
- Environment variable validation
- Secure credential management
- HMAC signature verification for webhooks
- Constant-time string comparison to prevent timing attacks
- Request signing where required

### Monitoring & Logging
- API call logging to database
- Success/failure tracking
- Response time monitoring
- Detailed error logs for debugging
- Statistics and analytics endpoints

## Setup Instructions

1. **Install Dependencies**:
```bash
npm install stripe twilio @googlemaps/google-maps-services-js resend
```

2. **Configure Environment Variables**:
Copy `.env.example` to `.env.local` and fill in all required API keys and configuration values.

3. **Database Setup**:
Ensure your Prisma schema includes the necessary models for:
- Payment tracking
- SMS notifications
- Email logs
- API logs
- Webhook deliveries
- Vehicle valuations
- Social media posts

4. **Test Integrations**:
Each service includes test methods to verify configuration:
```typescript
// Test Stripe
await StripeService.getPaymentIntentStatus('test_payment_id');

// Test Twilio
await TwilioService.getSMSStatus('test_message_sid');

// Test Google Maps
await GoogleMapsService.getDealershipLocation();

// Test Resend
await ResendEmailService.sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<p>Test content</p>'
});

// Test Social Media
await SocialMediaService.getPostMetrics('test_post_id');

// Test Webhooks
await WebhookService.testWebhook('webhook_id');
```

## Usage Examples

### Stripe Payment
```typescript
const paymentIntent = await StripeService.createPaymentIntent({
  vehicleId: 'vehicle_123',
  amount: 50000, // €500 in cents
  customerEmail: 'customer@example.com',
  paymentType: 'DEPOSIT'
});
```

### Send SMS
```typescript
await TwilioService.sendSMS({
  to: '+38349123456',
  message: 'Your appointment is confirmed for tomorrow at 10 AM'
});
```

### Get Directions
```typescript
const directions = await GoogleMapsService.getDirections({
  origin: 'Pristina, Kosovo',
  destination: 'Customer Address',
  mode: 'driving'
});
```

### Send Email
```typescript
await ResendEmailService.sendVehicleInquiryNotification({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+38349123456',
  inquiryType: 'Test Drive',
  vehicle: {
    make: 'BMW',
    model: 'X5',
    year: 2023,
    price: 45000,
    id: 'vehicle_123'
  }
});
```

### Post to Social Media
```typescript
await SocialMediaService.postVehicleToSocialMedia(
  'vehicle_123',
  'Check out this amazing BMW X5!'
);
```

## Troubleshooting

### Common Issues

1. **API Key Invalid**:
   - Verify environment variables are set correctly
   - Check if API keys are for the correct environment (test vs production)
   - Ensure API keys have necessary permissions

2. **Rate Limiting**:
   - Adjust rate limit configuration in environment variables
   - Implement queue systems for bulk operations
   - Use batch processing where available

3. **Network Errors**:
   - Check internet connectivity
   - Verify API endpoints are accessible
   - Review firewall/proxy settings

4. **Database Errors**:
   - Ensure Prisma migrations are up to date
   - Verify database connection string
   - Check database permissions

## Maintenance

- Regularly rotate API keys and secrets
- Monitor API usage and costs
- Review error logs for recurring issues
- Update dependencies for security patches
- Test webhook endpoints periodically
- Clean up old logs and delivery records

## Support

For issues or questions about these integrations, contact the development team or refer to the respective service documentation:
- [Stripe Documentation](https://stripe.com/docs)
- [Twilio Documentation](https://www.twilio.com/docs)
- [Google Maps Documentation](https://developers.google.com/maps/documentation)
- [Resend Documentation](https://resend.com/docs)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)