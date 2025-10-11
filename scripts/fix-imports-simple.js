#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with the most import order issues (from ESLint output)
const filesToFix = [
  'app/about/page.tsx',
  'app/admin/login/page.tsx',
  'app/admin/page.tsx',
  'app/alerts/page.tsx',
  'components/ui/AnimatedCard.tsx',
  'components/ui/AnimatedButton.tsx',
  'lib/utils.ts',
  'lib/social.ts'
];

function fixImportsInFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Extract imports and other content
    const lines = content.split('\n');
    const imports = [];
    const rest = [];
    let importsEnded = false;

    for (const line of lines) {
      if (line.trim().startsWith('import ') && !importsEnded) {
        imports.push(line);
      } else if (line.trim() === '' && !importsEnded && imports.length > 0) {
        // Skip empty lines in imports section for now
        continue;
      } else {
        if (imports.length > 0) importsEnded = true;
        rest.push(line);
      }
    }

    if (imports.length === 0) {
      return false;
    }

    // Sort imports by category
    const reactImports = imports.filter(imp =>
      imp.includes('from "react"') || imp.includes("from 'react'")
    );

    const nextImports = imports.filter(imp =>
      imp.includes('from "next') || imp.includes("from 'next")
    );

    const externalImports = imports.filter(imp =>
      !imp.includes('from "@/') && !imp.includes("from '@/") &&
      !imp.includes('from "react"') && !imp.includes("from 'react'") &&
      !imp.includes('from "next') && !imp.includes("from 'next")
    );

    const internalImports = imports.filter(imp =>
      imp.includes('from "@/') || imp.includes("from '@/")
    );

    // Rebuild with proper spacing
    const sortedImports = [
      ...reactImports,
      ...(reactImports.length > 0 ? [''] : []),
      ...nextImports,
      ...(nextImports.length > 0 ? [''] : []),
      ...externalImports.sort(),
      ...(externalImports.length > 0 ? [''] : []),
      ...internalImports.sort()
    ];

    const newContent = [...sortedImports, '', ...rest].join('\n');

    if (newContent !== originalContent) {
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Fixed imports in ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Fixing import ordering in key files...\n');

let fixedCount = 0;

filesToFix.forEach(file => {
  if (fixImportsInFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed imports in ${fixedCount} files!`);