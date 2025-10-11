/*
  Warnings:

  - You are about to drop the column `appointmentDate` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `appointmentType` on the `appointments` table. All the data in the column will be lost.
  - Added the required column `scheduledDate` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduledTime` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "reminderMethod" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "confirmationSent" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_appointments" ("confirmationSent", "createdAt", "customerEmail", "customerName", "customerPhone", "duration", "id", "location", "notes", "reminderSent", "status", "updatedAt", "vehicleId") SELECT "confirmationSent", "createdAt", "customerEmail", "customerName", "customerPhone", "duration", "id", "location", "notes", "reminderSent", "status", "updatedAt", "vehicleId" FROM "appointments";
DROP TABLE "appointments";
ALTER TABLE "new_appointments" RENAME TO "appointments";
CREATE INDEX "appointments_vehicleId_status_idx" ON "appointments"("vehicleId", "status");
CREATE INDEX "appointments_scheduledDate_status_idx" ON "appointments"("scheduledDate", "status");
CREATE INDEX "appointments_customerEmail_idx" ON "appointments"("customerEmail");
CREATE INDEX "appointments_scheduledDate_scheduledTime_idx" ON "appointments"("scheduledDate", "scheduledTime");
CREATE TABLE "new_payment_intents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "clientSecret" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payment_intents_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_payment_intents" ("amount", "clientSecret", "createdAt", "currency", "id", "metadata", "provider", "providerId", "status", "updatedAt", "vehicleId") SELECT "amount", "clientSecret", "createdAt", "currency", "id", "metadata", "provider", "providerId", "status", "updatedAt", "vehicleId" FROM "payment_intents";
DROP TABLE "payment_intents";
ALTER TABLE "new_payment_intents" RENAME TO "payment_intents";
CREATE UNIQUE INDEX "payment_intents_providerId_key" ON "payment_intents"("providerId");
CREATE INDEX "payment_intents_vehicleId_idx" ON "payment_intents"("vehicleId");
CREATE INDEX "payment_intents_status_idx" ON "payment_intents"("status");
CREATE TABLE "new_payments" (
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payments_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_payments" ("amount", "completedAt", "createdAt", "currency", "customerEmail", "customerId", "customerName", "customerPhone", "description", "failureReason", "id", "metadata", "paymentMethod", "paymentType", "paypalOrderId", "refundAmount", "refundReason", "refundedAt", "status", "stripePaymentId", "stripeSessionId", "updatedAt", "vehicleId") SELECT "amount", "completedAt", "createdAt", "currency", "customerEmail", "customerId", "customerName", "customerPhone", "description", "failureReason", "id", "metadata", "paymentMethod", "paymentType", "paypalOrderId", "refundAmount", "refundReason", "refundedAt", "status", "stripePaymentId", "stripeSessionId", "updatedAt", "vehicleId" FROM "payments";
DROP TABLE "payments";
ALTER TABLE "new_payments" RENAME TO "payments";
CREATE UNIQUE INDEX "payments_stripePaymentId_key" ON "payments"("stripePaymentId");
CREATE UNIQUE INDEX "payments_stripeSessionId_key" ON "payments"("stripeSessionId");
CREATE UNIQUE INDEX "payments_paypalOrderId_key" ON "payments"("paypalOrderId");
CREATE INDEX "payments_vehicleId_status_idx" ON "payments"("vehicleId", "status");
CREATE INDEX "payments_customerEmail_status_idx" ON "payments"("customerEmail", "status");
CREATE INDEX "payments_status_createdAt_idx" ON "payments"("status", "createdAt");
CREATE INDEX "payments_paymentMethod_status_idx" ON "payments"("paymentMethod", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
