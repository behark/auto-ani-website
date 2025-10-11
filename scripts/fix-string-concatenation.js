#!/usr/bin/env node

const fs = require('fs');

// Files with string concatenation issues (from ESLint output)
const filesToFix = [
  'lib/social.ts',
  'lib/utils.ts'
];

function fixStringConcatenation(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix string concatenation patterns
    // Pattern: "string" + variable + "string"
    content = content.replace(
      /(['"`])([^'"`]*)\1\s*\+\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\+\s*(['"`])([^'"`]*)\4/g,
      '`$2${$3}$5`'
    );

    // Pattern: variable + "string"
    content = content.replace(
      /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\+\s*(['"`])([^'"`]*)\2/g,
      '`${$1}$3`'
    );

    // Pattern: "string" + variable
    content = content.replace(
      /(['"`])([^'"`]*)\1\s*\+\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      '`$2${$3}`'
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed string concatenation in ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Fixing string concatenation issues...\n');

let fixedCount = 0;

filesToFix.forEach(file => {
  if (fixStringConcatenation(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed string concatenation in ${fixedCount} files!`);