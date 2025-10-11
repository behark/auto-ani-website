#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files where console.log should be replaced
const filesToFix = [
  '/home/behar/auto-ani-website/components/forms/VehicleInquiryForm.tsx',
  '/home/behar/auto-ani-website/components/forms/SecureContactForm.tsx',
  '/home/behar/auto-ani-website/components/privacy/CookieConsent.tsx',
  '/home/behar/auto-ani-website/components/ecommerce/VirtualShowroom.tsx',
  '/home/behar/auto-ani-website/components/admin/TranslationManager.tsx',
  '/home/behar/auto-ani-website/components/admin/RealTimeNotifications.tsx',
  '/home/behar/auto-ani-website/components/admin/PromotionManager.tsx',
  '/home/behar/auto-ani-website/components/admin/PricingEngine.tsx',
  '/home/behar/auto-ani-website/components/admin/OrderManager.tsx',
  '/home/behar/auto-ani-website/components/admin/NotificationCenter.tsx',
  '/home/behar/auto-ani-website/components/admin/JobsDashboard.tsx',
  '/home/behar/auto-ani-website/components/admin/InventoryManager.tsx',
  '/home/behar/auto-ani-website/components/admin/EnhancedAnalyticsDashboard.tsx',
  '/home/behar/auto-ani-website/components/admin/CustomerManager.tsx',
  '/home/behar/auto-ani-website/components/admin/AnalyticsDashboard.tsx',
  '/home/behar/auto-ani-website/app/portal/page.tsx',
  '/home/behar/auto-ani-website/app/portal/auth/signup/page.tsx',
  '/home/behar/auto-ani-website/app/api/appointments/route.ts',
  '/home/behar/auto-ani-website/components/ecommerce/AppointmentScheduler.tsx',
  '/home/behar/auto-ani-website/components/ecommerce/AppointmentScheduler.optimized.tsx',
  '/home/behar/auto-ani-website/app/vehicles/page.tsx',
  '/home/behar/auto-ani-website/components/ecommerce/VehicleReservationModal.tsx',
  '/home/behar/auto-ani-website/components/ecommerce/VehicleHistoryModal.tsx',
  '/home/behar/auto-ani-website/components/admin/analytics/TeamDashboard.tsx',
  '/home/behar/auto-ani-website/components/admin/analytics/PredictiveDashboard.tsx',
  '/home/behar/auto-ani-website/components/admin/analytics/MarketDashboard.tsx',
  '/home/behar/auto-ani-website/components/home/FeaturedVehicles.tsx',
  '/home/behar/auto-ani-website/app/admin/page.tsx',
  '/home/behar/auto-ani-website/components/admin/analytics/CustomerBehaviorDashboard.tsx',
  '/home/behar/auto-ani-website/components/admin/analytics/VehicleInventoryDashboard.tsx',
  '/home/behar/auto-ani-website/components/admin/analytics/AdvancedSalesDashboard.tsx',
  '/home/behar/auto-ani-website/app/admin/login/page.tsx',
];

// Files to skip (already use logger or have legitimate console usage)
const skipFiles = [
  '/home/behar/auto-ani-website/lib/logger.ts',
  '/home/behar/auto-ani-website/components/ui/ErrorBoundary.tsx', // Uses console.error for error boundaries
  '/home/behar/auto-ani-website/lib/validateEnv.ts', // Validation output
  '/home/behar/auto-ani-website/middleware.ts', // Special handling needed
  '/home/behar/auto-ani-website/app/error.tsx', // Error boundaries
  '/home/behar/auto-ani-website/components/ui/performance-monitor.tsx', // Performance monitoring
  '/home/behar/auto-ani-website/components/ui/LazyImage.tsx', // Debug output
];

function replaceConsoleLog(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if logger is already imported
    const hasLoggerImport = content.includes("from '@/lib/logger'") ||
                           content.includes('from "@/lib/logger"');

    // Replace console.log with logger.debug
    if (content.includes('console.log')) {
      content = content.replace(/console\.log\(/g, 'logger.debug(');
      modified = true;
    }

    // Replace console.error with logger.error
    if (content.includes('console.error') && !filePath.includes('ErrorBoundary')) {
      content = content.replace(/console\.error\(/g, 'logger.error(');
      modified = true;
    }

    // Replace console.warn with logger.warn
    if (content.includes('console.warn')) {
      content = content.replace(/console\.warn\(/g, 'logger.warn(');
      modified = true;
    }

    // Replace console.info with logger.info
    if (content.includes('console.info')) {
      content = content.replace(/console\.info\(/g, 'logger.info(');
      modified = true;
    }

    // Add logger import if needed and file was modified
    if (modified && !hasLoggerImport) {
      // Find the first import statement
      const importMatch = content.match(/^import .* from/m);
      if (importMatch) {
        const firstImportIndex = content.indexOf(importMatch[0]);
        // Add logger import before the first import
        content = content.slice(0, firstImportIndex) +
                 "import { logger } from '@/lib/logger';\n" +
                 content.slice(firstImportIndex);
      } else {
        // If no imports found (unlikely), add at the beginning
        content = "import { logger } from '@/lib/logger';\n\n" + content;
      }
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

// Process all files
console.log('🔧 Fixing console.log statements...\n');
let fixedCount = 0;

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    if (replaceConsoleLog(file)) {
      fixedCount++;
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log(`\n✅ Complete! Fixed ${fixedCount} files.`);
console.log('\n📝 Note: The following files were intentionally skipped:');
skipFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  - ${path.basename(file)}`);
  }
});