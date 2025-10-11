#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need 'use client' fixed
const filesToFix = [
  'app/about/page.tsx',
  'app/admin/login/page.tsx',
  'app/admin/page.tsx'
];

function fixUseClient(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if 'use client' is not at the top
    if (content.includes("'use client';") && !content.startsWith("'use client';")) {
      // Remove 'use client' from wherever it is
      content = content.replace(/\n?'use client';\n?/g, '');

      // Add 'use client' at the top
      content = "'use client';\n\n" + content;

      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed 'use client' directive in ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

console.log("🔧 Fixing 'use client' directives...\n");

let fixedCount = 0;

filesToFix.forEach(file => {
  if (fixUseClient(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed 'use client' in ${fixedCount} files!`);