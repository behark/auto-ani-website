#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const files = [
  '/home/behar/auto-ani-website/app/admin/page.tsx',
  '/home/behar/auto-ani-website/components/admin/AnalyticsDashboard.tsx',
  '/home/behar/auto-ani-website/components/admin/CustomerManager.tsx',
  '/home/behar/auto-ani-website/components/admin/EnhancedAnalyticsDashboard.tsx',
  '/home/behar/auto-ani-website/components/admin/InventoryManager.tsx',
  '/home/behar/auto-ani-website/components/admin/JobsDashboard.tsx',
  '/home/behar/auto-ani-website/components/admin/NotificationCenter.tsx',
  '/home/behar/auto-ani-website/components/admin/OrderManager.tsx',
  '/home/behar/auto-ani-website/components/admin/PricingEngine.tsx',
  '/home/behar/auto-ani-website/components/admin/PromotionManager.tsx',
  '/home/behar/auto-ani-website/components/admin/RealTimeNotifications.tsx',
  '/home/behar/auto-ani-website/components/admin/TranslationManager.tsx',
  '/home/behar/auto-ani-website/components/admin/analytics/AdvancedSalesDashboard.tsx',
  '/home/behar/auto-ani-website/components/admin/analytics/CustomerBehaviorDashboard.tsx',
  '/home/behar/auto-ani-website/components/admin/analytics/VehicleInventoryDashboard.tsx',
  '/home/behar/auto-ani-website/components/admin/analytics/MarketDashboard.tsx',
  '/home/behar/auto-ani-website/components/admin/analytics/PredictiveDashboard.tsx',
  '/home/behar/auto-ani-website/components/admin/analytics/TeamDashboard.tsx',
  '/home/behar/auto-ani-website/components/ecommerce/VehicleHistoryModal.tsx',
  '/home/behar/auto-ani-website/components/ecommerce/VehicleReservationModal.tsx',
  '/home/behar/auto-ani-website/components/ecommerce/AppointmentScheduler.tsx',
  '/home/behar/auto-ani-website/components/ecommerce/AppointmentScheduler.optimized.tsx',
  '/home/behar/auto-ani-website/components/ecommerce/VirtualShowroom.tsx',
  '/home/behar/auto-ani-website/components/forms/SecureContactForm.tsx',
  '/home/behar/auto-ani-website/components/forms/VehicleInquiryForm.tsx',
  '/home/behar/auto-ani-website/components/privacy/CookieConsent.tsx',
  '/home/behar/auto-ani-website/app/vehicles/page.tsx',
  '/home/behar/auto-ani-website/app/portal/page.tsx',
  '/home/behar/auto-ani-website/app/portal/auth/signup/page.tsx',
];

function fixLoggerCalls(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Pattern 1: logger.error('message', error)
    const pattern1 = /logger\.(error|warn|info|debug)\(([^,]+),\s*error\)/g;
    if (content.match(pattern1)) {
      content = content.replace(pattern1, (match, logLevel, message) => {
        return `logger.${logLevel}(${message}, { error: error instanceof Error ? error.message : String(error) })`;
      });
      modified = true;
    }

    // Pattern 2: logger.error('message:', error)
    const pattern2 = /logger\.(error|warn|info|debug)\(([^:]+:'),\s*error\)/g;
    if (content.match(pattern2)) {
      content = content.replace(pattern2, (match, logLevel, message) => {
        return `logger.${logLevel}(${message}, { error: error instanceof Error ? error.message : String(error) })`;
      });
      modified = true;
    }

    // Pattern 3: logger.error('message', err)
    const pattern3 = /logger\.(error|warn|info|debug)\(([^,]+),\s*err\)/g;
    if (content.match(pattern3)) {
      content = content.replace(pattern3, (match, logLevel, message) => {
        return `logger.${logLevel}(${message}, { error: err instanceof Error ? err.message : String(err) })`;
      });
      modified = true;
    }

    // Pattern 4: logger.error('message:', err)
    const pattern4 = /logger\.(error|warn|info|debug)\(([^:]+:'),\s*err\)/g;
    if (content.match(pattern4)) {
      content = content.replace(pattern4, (match, logLevel, message) => {
        return `logger.${logLevel}(${message}, { error: err instanceof Error ? err.message : String(err) })`;
      });
      modified = true;
    }

    // Pattern 5: logger.error('message', result.error) where result.error is a string
    const pattern5 = /logger\.(error|warn|info|debug)\(([^,]+),\s*result\.error\)/g;
    if (content.match(pattern5)) {
      content = content.replace(pattern5, (match, logLevel, message) => {
        return `logger.${logLevel}(${message}, { error: result.error })`;
      });
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed: ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Fixing logger error calls...\n');
let fixedCount = 0;

files.forEach(file => {
  if (fs.existsSync(file)) {
    if (fixLoggerCalls(file)) {
      fixedCount++;
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log(`\n✅ Complete! Fixed ${fixedCount} files.`);