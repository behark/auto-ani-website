-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "fuelType" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "bodyType" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "engineSize" TEXT NOT NULL,
    "drivetrain" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "images" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "vin" TEXT,
    "doors" INTEGER,
    "seats" INTEGER,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "vehicleId" TEXT NOT NULL,
    "sessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "subject" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "clientIP" TEXT,
    "fingerprint" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vehicle_inquiries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT,
    "inquiryType" TEXT NOT NULL DEFAULT 'GENERAL',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "clientIP" TEXT,
    "fingerprint" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vehicle_inquiries_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" DATETIME,
    "lastLogin" DATETIME,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "accountLockedUntil" DATETIME,
    "lastFailedLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "newsletters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "clientIP" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "content_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "seoEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "generated_contents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT,
    "contentType" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "contentHtml" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "targetAudience" TEXT,
    "vehicleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "scheduledFor" DATETIME,
    "performance" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "generated_contents_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "content_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "featuredImage" TEXT,
    "author" TEXT NOT NULL DEFAULT 'AUTO ANI Team',
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "views" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "social_media_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT,
    "hashtags" TEXT,
    "vehicleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" DATETIME,
    "publishedAt" DATETIME,
    "externalId" TEXT,
    "performance" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "previewText" TEXT,
    "content" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "segmentCriteria" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" DATETIME,
    "sentAt" DATETIME,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "openRate" REAL,
    "clickRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "email_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" DATETIME,
    "openedAt" DATETIME,
    "clickedAt" DATETIME,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "email_messages_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "email_campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "newsletter_issues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "sections" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" DATETIME,
    "sentAt" DATETIME,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "openRate" REAL,
    "clickRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "content_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT,
    "platform" TEXT,
    "language" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "seo_keywords" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "searchVolume" INTEGER,
    "difficulty" INTEGER,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "content_performance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" REAL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT,
    "customerId" TEXT,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "paymentMethod" TEXT NOT NULL,
    "paymentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stripePaymentId" TEXT,
    "stripeSessionId" TEXT,
    "paypalOrderId" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "refundAmount" INTEGER,
    "refundReason" TEXT,
    "refundedAt" DATETIME,
    "completedAt" DATETIME,
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "payment_intents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "clientSecret" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sms_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'TWILIO',
    "providerId" TEXT,
    "vehicleId" TEXT,
    "inquiryId" TEXT,
    "appointmentId" TEXT,
    "errorMessage" TEXT,
    "sentAt" DATETIME,
    "deliveredAt" DATETIME,
    "cost" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vehicle_valuations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "condition" TEXT,
    "source" TEXT NOT NULL,
    "estimatedValue" INTEGER NOT NULL,
    "minValue" INTEGER,
    "maxValue" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "marketAnalysis" TEXT,
    "valuationData" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "lastTriggeredAt" DATETIME,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_deliveries_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhooks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "appointmentType" TEXT NOT NULL,
    "appointmentDate" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "confirmationSent" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "delivery_tracking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryLatitude" REAL,
    "deliveryLongitude" REAL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduledFor" DATETIME NOT NULL,
    "deliveredAt" DATETIME,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "currentLatitude" REAL,
    "currentLongitude" REAL,
    "trackingNotes" TEXT,
    "estimatedArrival" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "api_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "requestData" TEXT,
    "responseData" TEXT,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "duration" INTEGER,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "source" TEXT NOT NULL,
    "sourceDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "score" INTEGER NOT NULL DEFAULT 0,
    "temperature" TEXT NOT NULL DEFAULT 'COLD',
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "buyingIntent" TEXT,
    "budget" INTEGER,
    "timeframe" TEXT,
    "preferredVehicleType" TEXT,
    "financingNeeded" BOOLEAN NOT NULL DEFAULT false,
    "tradeInVehicle" BOOLEAN NOT NULL DEFAULT false,
    "lastContactedAt" DATETIME,
    "lastEngagedAt" DATETIME,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "assignedTo" TEXT,
    "assignedAt" DATETIME,
    "clientIP" TEXT,
    "fingerprint" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "scoreChange" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lead_campaign_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" DATETIME,
    "deliveredAt" DATETIME,
    "openedAt" DATETIME,
    "clickedAt" DATETIME,
    "bouncedAt" DATETIME,
    "unsubscribedAt" DATETIME,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "lead_campaign_subscriptions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "email_campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lead_campaign_subscriptions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerId" TEXT NOT NULL,
    "referredEmail" TEXT NOT NULL,
    "referredId" TEXT,
    "referralCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rewardType" TEXT,
    "rewardValue" INTEGER,
    "rewardIssued" BOOLEAN NOT NULL DEFAULT false,
    "rewardIssuedAt" DATETIME,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "lastClickedAt" DATETIME,
    "convertedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "referrals_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "leads" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ab_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "testType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "controlVariant" TEXT NOT NULL,
    "variantIds" TEXT NOT NULL,
    "trafficSplit" TEXT NOT NULL,
    "primaryGoal" TEXT NOT NULL,
    "conversionGoal" TEXT,
    "minSampleSize" INTEGER NOT NULL DEFAULT 100,
    "confidenceLevel" REAL NOT NULL DEFAULT 95,
    "winner" TEXT,
    "winnerConfidence" REAL,
    "conclusionNotes" TEXT,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ab_test_variants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ab_test_variants_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ab_tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lead_magnets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "magnetType" TEXT NOT NULL,
    "fileUrl" TEXT,
    "thumbnailUrl" TEXT,
    "requiresEmail" BOOLEAN NOT NULL DEFAULT true,
    "requiresPhone" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "lead_magnet_downloads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "magnetId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "leadId" TEXT,
    "clientIP" TEXT,
    "fingerprint" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_magnet_downloads_magnetId_fkey" FOREIGN KEY ("magnetId") REFERENCES "lead_magnets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conversion_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventName" TEXT NOT NULL,
    "eventValue" REAL,
    "leadId" TEXT,
    "visitorId" TEXT,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "content" TEXT,
    "term" TEXT,
    "pageUrl" TEXT,
    "referrer" TEXT,
    "clientIP" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "automation_workflows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workflowType" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "triggerConfig" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "actions" TEXT NOT NULL,
    "totalTriggered" INTEGER NOT NULL DEFAULT 0,
    "totalCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "workflow_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "nextActionAt" DATETIME,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflow_executions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "automation_workflows" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workflow_executions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "daily_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "visitors" INTEGER NOT NULL DEFAULT 0,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "newLeads" INTEGER NOT NULL DEFAULT 0,
    "qualifiedLeads" INTEGER NOT NULL DEFAULT 0,
    "hotLeads" INTEGER NOT NULL DEFAULT 0,
    "inquiries" INTEGER NOT NULL DEFAULT 0,
    "testDrives" INTEGER NOT NULL DEFAULT 0,
    "sales" INTEGER NOT NULL DEFAULT 0,
    "emailsSent" INTEGER NOT NULL DEFAULT 0,
    "emailsOpened" INTEGER NOT NULL DEFAULT 0,
    "emailsClicked" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_slug_key" ON "vehicles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "vehicles"("vin");

-- CreateIndex
CREATE INDEX "vehicles_make_model_year_status_idx" ON "vehicles"("make", "model", "year", "status");

-- CreateIndex
CREATE INDEX "vehicles_featured_status_idx" ON "vehicles"("featured", "status");

-- CreateIndex
CREATE INDEX "vehicles_price_status_idx" ON "vehicles"("price", "status");

-- CreateIndex
CREATE INDEX "vehicles_createdAt_idx" ON "vehicles"("createdAt");

-- CreateIndex
CREATE INDEX "vehicles_mileage_idx" ON "vehicles"("mileage");

-- CreateIndex
CREATE INDEX "vehicles_fuelType_idx" ON "vehicles"("fuelType");

-- CreateIndex
CREATE INDEX "vehicles_transmission_idx" ON "vehicles"("transmission");

-- CreateIndex
CREATE INDEX "vehicles_bodyType_idx" ON "vehicles"("bodyType");

-- CreateIndex
CREATE INDEX "vehicles_status_createdAt_idx" ON "vehicles"("status", "createdAt");

-- CreateIndex
CREATE INDEX "vehicles_make_status_idx" ON "vehicles"("make", "status");

-- CreateIndex
CREATE INDEX "vehicles_year_status_idx" ON "vehicles"("year", "status");

-- CreateIndex
CREATE INDEX "vehicles_price_mileage_status_idx" ON "vehicles"("price", "mileage", "status");

-- CreateIndex
CREATE INDEX "vehicles_slug_idx" ON "vehicles"("slug");

-- CreateIndex
CREATE INDEX "favorites_userId_vehicleId_idx" ON "favorites"("userId", "vehicleId");

-- CreateIndex
CREATE INDEX "favorites_sessionId_vehicleId_idx" ON "favorites"("sessionId", "vehicleId");

-- CreateIndex
CREATE INDEX "favorites_vehicleId_idx" ON "favorites"("vehicleId");

-- CreateIndex
CREATE INDEX "contacts_status_createdAt_idx" ON "contacts"("status", "createdAt");

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_createdAt_idx" ON "contacts"("createdAt");

-- CreateIndex
CREATE INDEX "vehicle_inquiries_vehicleId_status_idx" ON "vehicle_inquiries"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "vehicle_inquiries_status_createdAt_idx" ON "vehicle_inquiries"("status", "createdAt");

-- CreateIndex
CREATE INDEX "vehicle_inquiries_email_idx" ON "vehicle_inquiries"("email");

-- CreateIndex
CREATE INDEX "vehicle_inquiries_inquiryType_idx" ON "vehicle_inquiries"("inquiryType");

-- CreateIndex
CREATE INDEX "vehicle_inquiries_createdAt_idx" ON "vehicle_inquiries"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_accountLockedUntil_idx" ON "users"("accountLockedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "newsletters_email_key" ON "newsletters"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_key" ON "user_sessions"("token");

-- CreateIndex
CREATE INDEX "user_sessions_userId_expiresAt_idx" ON "user_sessions"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "user_sessions_token_expiresAt_idx" ON "user_sessions"("token", "expiresAt");

-- CreateIndex
CREATE INDEX "user_sessions_expiresAt_idx" ON "user_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "user_sessions_createdAt_idx" ON "user_sessions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "settings_category_idx" ON "settings"("category");

-- CreateIndex
CREATE INDEX "content_templates_type_language_isActive_idx" ON "content_templates"("type", "language", "isActive");

-- CreateIndex
CREATE INDEX "content_templates_isActive_priority_idx" ON "content_templates"("isActive", "priority");

-- CreateIndex
CREATE INDEX "generated_contents_contentType_language_status_idx" ON "generated_contents"("contentType", "language", "status");

-- CreateIndex
CREATE INDEX "generated_contents_vehicleId_status_idx" ON "generated_contents"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "generated_contents_status_scheduledFor_idx" ON "generated_contents"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "generated_contents_publishedAt_idx" ON "generated_contents"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_language_status_publishedAt_idx" ON "blog_posts"("language", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "blog_posts_category_status_idx" ON "blog_posts"("category", "status");

-- CreateIndex
CREATE INDEX "blog_posts_featured_status_idx" ON "blog_posts"("featured", "status");

-- CreateIndex
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "social_media_posts_platform_status_scheduledFor_idx" ON "social_media_posts"("platform", "status", "scheduledFor");

-- CreateIndex
CREATE INDEX "social_media_posts_vehicleId_status_idx" ON "social_media_posts"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "social_media_posts_language_status_idx" ON "social_media_posts"("language", "status");

-- CreateIndex
CREATE INDEX "email_campaigns_status_scheduledFor_idx" ON "email_campaigns"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "email_campaigns_language_status_idx" ON "email_campaigns"("language", "status");

-- CreateIndex
CREATE INDEX "email_messages_campaignId_status_idx" ON "email_messages"("campaignId", "status");

-- CreateIndex
CREATE INDEX "email_messages_recipientEmail_status_idx" ON "email_messages"("recipientEmail", "status");

-- CreateIndex
CREATE INDEX "email_messages_status_sentAt_idx" ON "email_messages"("status", "sentAt");

-- CreateIndex
CREATE INDEX "newsletter_issues_language_status_scheduledFor_idx" ON "newsletter_issues"("language", "status", "scheduledFor");

-- CreateIndex
CREATE INDEX "newsletter_issues_sentAt_idx" ON "newsletter_issues"("sentAt");

-- CreateIndex
CREATE INDEX "content_schedules_status_scheduledFor_idx" ON "content_schedules"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "content_schedules_contentType_status_idx" ON "content_schedules"("contentType", "status");

-- CreateIndex
CREATE INDEX "seo_keywords_language_category_isActive_idx" ON "seo_keywords"("language", "category", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "seo_keywords_keyword_language_key" ON "seo_keywords"("keyword", "language");

-- CreateIndex
CREATE INDEX "content_performance_contentType_contentId_date_idx" ON "content_performance"("contentType", "contentId", "date");

-- CreateIndex
CREATE INDEX "content_performance_date_idx" ON "content_performance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentId_key" ON "payments"("stripePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripeSessionId_key" ON "payments"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_paypalOrderId_key" ON "payments"("paypalOrderId");

-- CreateIndex
CREATE INDEX "payments_vehicleId_status_idx" ON "payments"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "payments_customerEmail_status_idx" ON "payments"("customerEmail", "status");

-- CreateIndex
CREATE INDEX "payments_status_createdAt_idx" ON "payments"("status", "createdAt");

-- CreateIndex
CREATE INDEX "payments_paymentMethod_status_idx" ON "payments"("paymentMethod", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_intents_providerId_key" ON "payment_intents"("providerId");

-- CreateIndex
CREATE INDEX "payment_intents_vehicleId_idx" ON "payment_intents"("vehicleId");

-- CreateIndex
CREATE INDEX "payment_intents_status_idx" ON "payment_intents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sms_notifications_providerId_key" ON "sms_notifications"("providerId");

-- CreateIndex
CREATE INDEX "sms_notifications_status_createdAt_idx" ON "sms_notifications"("status", "createdAt");

-- CreateIndex
CREATE INDEX "sms_notifications_phoneNumber_status_idx" ON "sms_notifications"("phoneNumber", "status");

-- CreateIndex
CREATE INDEX "sms_notifications_vehicleId_idx" ON "sms_notifications"("vehicleId");

-- CreateIndex
CREATE INDEX "notification_templates_type_event_language_idx" ON "notification_templates"("type", "event", "language");

-- CreateIndex
CREATE INDEX "notification_templates_isActive_idx" ON "notification_templates"("isActive");

-- CreateIndex
CREATE INDEX "vehicle_valuations_vehicleId_idx" ON "vehicle_valuations"("vehicleId");

-- CreateIndex
CREATE INDEX "vehicle_valuations_make_model_year_idx" ON "vehicle_valuations"("make", "model", "year");

-- CreateIndex
CREATE INDEX "vehicle_valuations_createdAt_idx" ON "vehicle_valuations"("createdAt");

-- CreateIndex
CREATE INDEX "webhooks_isActive_idx" ON "webhooks"("isActive");

-- CreateIndex
CREATE INDEX "webhook_deliveries_webhookId_status_idx" ON "webhook_deliveries"("webhookId", "status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_event_status_idx" ON "webhook_deliveries"("event", "status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_createdAt_idx" ON "webhook_deliveries"("createdAt");

-- CreateIndex
CREATE INDEX "appointments_vehicleId_status_idx" ON "appointments"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "appointments_appointmentDate_status_idx" ON "appointments"("appointmentDate", "status");

-- CreateIndex
CREATE INDEX "appointments_customerEmail_idx" ON "appointments"("customerEmail");

-- CreateIndex
CREATE INDEX "delivery_tracking_vehicleId_status_idx" ON "delivery_tracking"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "delivery_tracking_status_scheduledFor_idx" ON "delivery_tracking"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "api_logs_service_success_createdAt_idx" ON "api_logs"("service", "success", "createdAt");

-- CreateIndex
CREATE INDEX "api_logs_createdAt_idx" ON "api_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "leads_email_key" ON "leads"("email");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- CreateIndex
CREATE INDEX "leads_status_score_idx" ON "leads"("status", "score");

-- CreateIndex
CREATE INDEX "leads_temperature_score_idx" ON "leads"("temperature", "score");

-- CreateIndex
CREATE INDEX "leads_source_status_idx" ON "leads"("source", "status");

-- CreateIndex
CREATE INDEX "leads_assignedTo_status_idx" ON "leads"("assignedTo", "status");

-- CreateIndex
CREATE INDEX "leads_createdAt_idx" ON "leads"("createdAt");

-- CreateIndex
CREATE INDEX "leads_lastEngagedAt_idx" ON "leads"("lastEngagedAt");

-- CreateIndex
CREATE INDEX "lead_activities_leadId_createdAt_idx" ON "lead_activities"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_activities_activityType_createdAt_idx" ON "lead_activities"("activityType", "createdAt");

-- CreateIndex
CREATE INDEX "lead_campaign_subscriptions_campaignId_status_idx" ON "lead_campaign_subscriptions"("campaignId", "status");

-- CreateIndex
CREATE INDEX "lead_campaign_subscriptions_leadId_status_idx" ON "lead_campaign_subscriptions"("leadId", "status");

-- CreateIndex
CREATE INDEX "lead_campaign_subscriptions_status_sentAt_idx" ON "lead_campaign_subscriptions"("status", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "lead_campaign_subscriptions_campaignId_leadId_key" ON "lead_campaign_subscriptions"("campaignId", "leadId");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referralCode_key" ON "referrals"("referralCode");

-- CreateIndex
CREATE INDEX "referrals_referrerId_status_idx" ON "referrals"("referrerId", "status");

-- CreateIndex
CREATE INDEX "referrals_referredEmail_idx" ON "referrals"("referredEmail");

-- CreateIndex
CREATE INDEX "referrals_referralCode_idx" ON "referrals"("referralCode");

-- CreateIndex
CREATE INDEX "referrals_status_createdAt_idx" ON "referrals"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ab_tests_status_startedAt_idx" ON "ab_tests"("status", "startedAt");

-- CreateIndex
CREATE INDEX "ab_tests_testType_status_idx" ON "ab_tests"("testType", "status");

-- CreateIndex
CREATE INDEX "ab_test_variants_testId_idx" ON "ab_test_variants"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "ab_test_variants_testId_variantId_key" ON "ab_test_variants"("testId", "variantId");

-- CreateIndex
CREATE INDEX "lead_magnets_isActive_createdAt_idx" ON "lead_magnets"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "lead_magnets_magnetType_isActive_idx" ON "lead_magnets"("magnetType", "isActive");

-- CreateIndex
CREATE INDEX "lead_magnet_downloads_magnetId_createdAt_idx" ON "lead_magnet_downloads"("magnetId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_magnet_downloads_email_idx" ON "lead_magnet_downloads"("email");

-- CreateIndex
CREATE INDEX "lead_magnet_downloads_leadId_idx" ON "lead_magnet_downloads"("leadId");

-- CreateIndex
CREATE INDEX "conversion_events_eventName_createdAt_idx" ON "conversion_events"("eventName", "createdAt");

-- CreateIndex
CREATE INDEX "conversion_events_leadId_createdAt_idx" ON "conversion_events"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "conversion_events_visitorId_createdAt_idx" ON "conversion_events"("visitorId", "createdAt");

-- CreateIndex
CREATE INDEX "conversion_events_source_campaign_idx" ON "conversion_events"("source", "campaign");

-- CreateIndex
CREATE INDEX "automation_workflows_isActive_workflowType_idx" ON "automation_workflows"("isActive", "workflowType");

-- CreateIndex
CREATE INDEX "workflow_executions_workflowId_status_idx" ON "workflow_executions"("workflowId", "status");

-- CreateIndex
CREATE INDEX "workflow_executions_leadId_status_idx" ON "workflow_executions"("leadId", "status");

-- CreateIndex
CREATE INDEX "workflow_executions_nextActionAt_idx" ON "workflow_executions"("nextActionAt");

-- CreateIndex
CREATE UNIQUE INDEX "daily_analytics_date_key" ON "daily_analytics"("date");

-- CreateIndex
CREATE INDEX "daily_analytics_date_idx" ON "daily_analytics"("date");
