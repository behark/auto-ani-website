# Technical Debt

This document tracks known technical debt items, TODOs, and future improvements for the AUTO ANI website.

**Last Updated:** 2025-10-07

---

## Critical Priority

### Service Worker Disabled
**Location:** `components/pwa/ServiceWorkerRegister.tsx`
**Status:** Temporarily Disabled
**Impact:** Offline functionality and PWA features not available

**Details:**
- Service Worker has been disabled to prevent page load issues on the vehicles page
- The SW event handling needs debugging, particularly the fetch event handlers
- Before re-enabling:
  1. Review and test all fetch event handlers in `public/sw.js`
  2. Ensure proper cache invalidation strategies
  3. Test vehicles page loading with SW enabled
  4. Implement proper error handling and fallbacks

**Files:**
- `/home/behar/auto-ani-website/components/pwa/ServiceWorkerRegister.tsx`
- `/home/behar/auto-ani-website/public/sw.js`

---

## High Priority

### Analytics Engine - Missing Calculations
**Location:** `lib/analytics/AnalyticsEngine.ts`
**Status:** Placeholder Values
**Impact:** Analytics dashboard shows incomplete/inaccurate metrics

**Missing Implementations:**
1. **Lead Metrics** (Line 461):
   - `conversionRate` by grade - Need to calculate actual conversion rates per lead grade

2. **Marketing Metrics** (Lines 519-538):
   - `totalSpend` - Calculate from campaign costs in database
   - `totalRevenue` - Track revenue attributed to campaigns
   - `roas` - Calculate Return on Ad Spend
   - `totalImpressions` - Integrate with ad platform APIs
   - `totalClicks` - Integrate with ad platform APIs
   - `averageCtr` - Calculate Click-Through Rate
   - `smsMetrics.optOutRate` - Track SMS opt-outs
   - `topPerformingCampaigns` - Rank campaigns by performance

3. **Website Metrics** (Line 599):
   - `topPages` - Get page names and calculate conversion rates per page

4. **Export Functionality** (Line 683):
   - Implement CSV export for analytics data
   - Include Excel export option

**Next Steps:**
1. Add campaign cost tracking to database schema
2. Implement revenue attribution model
3. Integrate with Google Analytics API for page metrics
4. Create CSV/Excel export utility functions

---

### Image Upload Integration
**Location:** Multiple form components
**Status:** Not Implemented
**Impact:** Photo uploads go directly to API without cloud storage

**Affected Components:**
- `app/testimonials/submit/page.tsx` (Line 66)
- `app/trade-in/page.tsx` (Line 132)

**Current Behavior:**
- Photos are sent as base64 in API requests
- No cloud storage integration (S3, Cloudinary, etc.)
- Images stored in database as JSON (not scalable)

**Recommended Solution:**
1. Integrate with Cloudinary or AWS S3
2. Upload images to cloud storage first
3. Store URLs in database instead of base64
4. Implement image optimization pipeline

---

### Queue System Not Implemented
**Location:** `lib/queues/`
**Status:** Stub Implementation
**Impact:** Background job processing not available

**Affected Files:**
- `lib/queues/workers/emailWorker.ts`
- `lib/queues/workers/smsWorker.ts`
- `lib/queues/workers/leadWorker.ts`
- `lib/queues/workers/socialWorker.ts`
- `lib/queues/marketingQueue.ts`
- `lib/queues/leadQueue.ts`

**Requirements:**
- Install Bull package: `npm install bull @types/bull`
- Install Redis: Required for Bull queue backend
- Configure Redis connection in production
- Remove stub implementations
- Implement actual queue workers

**Use Cases:**
- Email campaign batch processing
- SMS message queuing
- Lead assignment automation
- Social media posting scheduling

---

## Medium Priority

### Notification System Incomplete
**Location:** Various API routes
**Status:** TODO Comments
**Impact:** Users don't receive confirmation emails/SMS

**Missing Notifications:**
1. **Trade-In Submissions** (`app/api/trade-in/route.ts`, Lines 169-171):
   - Send notification to sales team
   - Send confirmation email to customer
   - Schedule follow-up tasks

2. **Contact Form** (`app/api/contact/route.ts`, Lines 204-207):
   - Send email notification to admin
   - Send auto-reply to customer
   - Integration with CRM system
   - WhatsApp Business API integration

3. **Testimonials** (`app/api/testimonials/route.ts`, Line 119):
   - Send notification to admin for approval

4. **Appointments** (`app/api/appointments/route.ts`, Line 409):
   - Send confirmation email/SMS based on reminder method
   - Send reminder notifications before appointment

**Recommended Implementation:**
1. Use the queue system for reliable delivery
2. Create email templates for each notification type
3. Implement SMS integration with Twilio
4. Add webhook for CRM integration
5. Set up WhatsApp Business API

---

### Environment Variable Direct Access
**Location:** Multiple files
**Status:** Non-validated access
**Impact:** Potential runtime errors, security risks

**Problem:**
- 30+ files access `process.env` directly without validation
- No type safety for environment variables
- Risk of undefined variables causing runtime errors

**Solution:**
- All files should import from `lib/validateEnv.ts`
- Create typed environment variable exports
- Validate at application startup
- See `ENV_USAGE_GUIDE.md` for patterns

---

### Booking Form - Time Slots Not Dynamic
**Location:** `app/services/book/page.tsx`
**Status:** TODO Comment (Line 62)
**Impact:** Users can't see actual availability

**Current State:**
- Static list of time slots
- No backend availability checking
- No conflict detection

**Required Implementation:**
1. Fetch available time slots from API based on selected date
2. Check against existing appointments
3. Account for business hours and holidays
4. Implement real-time availability updates

---

### Sitemap - Dynamic Vehicle Pages Missing
**Location:** `app/sitemap.ts`
**Status:** TODO Comment (Line 25)
**Impact:** SEO - vehicle pages not in sitemap

**Implementation Needed:**
1. Fetch all active vehicles from database
2. Generate sitemap entries with vehicle slugs
3. Include proper metadata (lastmod, priority)
4. Implement incremental sitemap for large inventories
5. Add sitemap index for scalability

---

## Low Priority

### Advanced Sales Dashboard Export
**Location:** `components/admin/analytics/AdvancedSalesDashboard.tsx`
**Status:** TODO Comment (Line 80)
**Impact:** Cannot export sales data

**Required Features:**
- Export to CSV
- Export to Excel
- Export to PDF
- Custom date range selection
- Filter export data

---

## Dependencies to Install

When queue functionality is needed, install:
```bash
npm install bull @types/bull redis
```

For cloud storage integration:
```bash
npm install cloudinary
# OR
npm install @aws-sdk/client-s3
```

For WhatsApp Business API:
```bash
npm install whatsapp-web.js
# OR use official WhatsApp Business API
```

---

## Completed Items

### Console Statements Cleanup
**Date:** 2025-10-07
**Status:** ✅ Completed
- Replaced console.log/warn/error/debug with proper logger in production code
- Kept console statements in scripts/ for CLI output
- Added logger imports where needed

### TODO Comments Cleanup
**Date:** 2025-10-07
**Status:** ✅ Completed
- Removed simple TODO comments
- Documented complex items in this file
- Updated queue worker comments

---

## Contributing

When adding new technical debt:
1. Add to appropriate priority section
2. Include location, status, and impact
3. Describe the issue and recommended solution
4. Link to relevant files
5. Update "Last Updated" date at top

When resolving technical debt:
1. Move item to "Completed Items" section
2. Add completion date
3. Document any relevant notes
4. Update related documentation
