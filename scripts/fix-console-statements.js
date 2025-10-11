#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with console statement errors (from ESLint output)
const filesToFix = [
  'lib/sms.ts',
  'lib/stripe.ts',
  'lib/validateEnv.ts'
];

function fixConsoleStatements(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Replace console.log with console.info
    if (content.includes('console.log')) {
      content = content.replace(/console\.log\(/g, 'console.info(');
      changed = true;
    }

    // Only write if changes were made
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed console statements in ${filePath}`);
    } else {
      console.log(`ℹ️  No console.log statements found in ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

console.log('🔧 Fixing console statements...\n');

filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    fixConsoleStatements(fullPath);
  } else {
    console.log(`⚠️  File not found: ${fullPath}`);
  }
});

console.log('\n✅ Console statement fixes complete!');