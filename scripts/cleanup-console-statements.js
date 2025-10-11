#!/usr/bin/env node

/**
 * Cleanup Console Statements Script
 *
 * This script replaces console.log/warn/error/debug statements with proper logger usage
 * in production code (lib/, components/, app/) while keeping them in scripts/ and tests.
 *
 * Usage: node scripts/cleanup-console-statements.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to process
const PRODUCTION_DIRS = ['lib', 'components', 'app', 'hooks', 'contexts', 'store'];

// Directories/files to skip
const SKIP_PATTERNS = [
  'scripts/',
  'prisma/',
  'public/',
  'node_modules/',
  '.next/',
  '__tests__/',
  '.test.',
  '.spec.',
  'next.config.ts', // Keep console.log for memory monitoring
  'lib/logger.ts',   // Logger file itself
  'lib/validateEnv.ts', // Environment validation uses console for startup
];

// Track changes
const changes = {
  filesModified: 0,
  replacements: 0,
  details: [],
};

function shouldProcessFile(filePath) {
  // Only process TypeScript/JavaScript files
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(filePath))) {
    return false;
  }

  // Skip if matches any skip pattern
  for (const pattern of SKIP_PATTERNS) {
    if (filePath.includes(pattern)) {
      return false;
    }
  }

  // Check if in production directories
  const relativePath = path.relative(process.cwd(), filePath);
  return PRODUCTION_DIRS.some(dir => relativePath.startsWith(dir));
}

function hasLoggerImport(content) {
  return /import\s+.*\blogger\b.*from\s+['"]@\/lib\/logger['"]/.test(content) ||
         /import\s+\{[^}]*logger[^}]*\}\s+from\s+['"]@\/lib\/logger['"]/.test(content);
}

function addLoggerImport(content) {
  // Find the last import statement
  const importRegex = /import\s+.+from\s+['"][^'"]+['"];?\n/g;
  const imports = content.match(importRegex);

  if (!imports || imports.length === 0) {
    // No imports found, add at the beginning after 'use client' if present
    if (content.startsWith("'use client'")) {
      const lines = content.split('\n');
      const clientDirectiveEnd = lines.findIndex(line => line.trim() === "''use client';") || 0;
      lines.splice(clientDirectiveEnd + 1, 0, '', "import { logger } from '@/lib/logger';");
      return lines.join('\n');
    }
    return `import { logger } from '@/lib/logger';\n\n${content}`;
  }

  // Add logger import after the last import
  const lastImport = imports[imports.length - 1];
  const lastImportIndex = content.lastIndexOf(lastImport);
  const insertPosition = lastImportIndex + lastImport.length;

  return content.slice(0, insertPosition) +
         "import { logger } from '@/lib/logger';\n" +
         content.slice(insertPosition);
}

function replaceConsoleStatements(content, filePath) {
  let modified = content;
  let fileReplacements = 0;
  const fileChanges = [];

  // Pattern: console.error('message', error)
  const errorWithObjectPattern = /console\.error\((["'`][^"'`]+["'`]),\s*(\w+)\)/g;
  modified = modified.replace(errorWithObjectPattern, (match, message, errorVar) => {
    fileReplacements++;
    fileChanges.push({ from: match, to: `logger.error(${message}, {}, ${errorVar} as Error)` });
    return `logger.error(${message}, {}, ${errorVar} as Error)`;
  });

  // Pattern: console.error('message', context, error)
  const errorWithContextPattern = /console\.error\((["'`][^"'`]+["'`]),\s*({[^}]+}),\s*(\w+)\)/g;
  modified = modified.replace(errorWithContextPattern, (match, message, context, errorVar) => {
    fileReplacements++;
    fileChanges.push({ from: match, to: `logger.error(${message}, ${context}, ${errorVar} as Error)` });
    return `logger.error(${message}, ${context}, ${errorVar} as Error)`;
  });

  // Pattern: console.error('message') - simple error
  const simpleErrorPattern = /console\.error\((["'`][^"'`]+["'`])\)/g;
  modified = modified.replace(simpleErrorPattern, (match, message) => {
    fileReplacements++;
    fileChanges.push({ from: match, to: `logger.error(${message})` });
    return `logger.error(${message})`;
  });

  // Pattern: console.warn('message')
  const warnPattern = /console\.warn\((["'`][^"'`]+["'`])\)/g;
  modified = modified.replace(warnPattern, (match, message) => {
    fileReplacements++;
    fileChanges.push({ from: match, to: `logger.warn(${message})` });
    return `logger.warn(${message})`;
  });

  // Pattern: console.log('message', data) - convert to logger.debug
  const logWithDataPattern = /console\.log\((["'`][^"'`]+["'`]),\s*([^)]+)\)/g;
  modified = modified.replace(logWithDataPattern, (match, message, data) => {
    // Skip SW-prefixed logs (service worker)
    if (message.includes('[SW]')) {
      return match;
    }
    fileReplacements++;
    fileChanges.push({ from: match, to: `logger.debug(${message}, { data: ${data} })` });
    return `logger.debug(${message}, { data: ${data} })`;
  });

  // Pattern: console.log('simple message') - remove or convert to logger.debug
  const simpleLogPattern = /console\.log\((["'`][^"'`]+["'`])\)/g;
  modified = modified.replace(simpleLogPattern, (match, message) => {
    // Skip SW-prefixed logs (service worker)
    if (message.includes('[SW]')) {
      return match;
    }
    // Skip debug messages with emojis (they're informative)
    if (message.includes('🔄') || message.includes('📡') || message.includes('✅')) {
      return match;
    }
    fileReplacements++;
    fileChanges.push({ from: match, to: 'removed' });
    return ''; // Remove simple logs
  });

  // Pattern: console.debug('message')
  const debugPattern = /console\.debug\((["'`][^"'`]+["'`])\)/g;
  modified = modified.replace(debugPattern, (match, message) => {
    fileReplacements++;
    fileChanges.push({ from: match, to: `logger.debug(${message})` });
    return `logger.debug(${message})`;
  });

  if (fileReplacements > 0) {
    changes.filesModified++;
    changes.replacements += fileReplacements;
    changes.details.push({
      file: path.relative(process.cwd(), filePath),
      count: fileReplacements,
      changes: fileChanges.slice(0, 5), // Show first 5 changes
    });

    // Add logger import if needed and not already present
    if (!hasLoggerImport(modified)) {
      modified = addLoggerImport(modified);
    }
  }

  return modified;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const modified = replaceConsoleStatements(content, filePath);

    if (content !== modified) {
      fs.writeFileSync(filePath, modified, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (shouldProcessFile(filePath)) {
      processFile(filePath);
    }
  });
}

// Main execution
console.log('🧹 Starting console statement cleanup...\n');

PRODUCTION_DIRS.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    console.log(`Processing ${dir}/...`);
    walkDirectory(dirPath);
  }
});

console.log('\n✅ Cleanup complete!\n');
console.log(`📊 Summary:`);
console.log(`  - Files modified: ${changes.filesModified}`);
console.log(`  - Total replacements: ${changes.replacements}`);

if (changes.details.length > 0) {
  console.log(`\n📝 Details (showing first 10 files):\n`);
  changes.details.slice(0, 10).forEach(detail => {
    console.log(`  ${detail.file}: ${detail.count} replacement(s)`);
    detail.changes.forEach(change => {
      if (change.to === 'removed') {
        console.log(`    - Removed: ${change.from.substring(0, 60)}...`);
      } else {
        console.log(`    - ${change.from.substring(0, 40)}... → ${change.to.substring(0, 40)}...`);
      }
    });
    console.log('');
  });
}

console.log('\n💡 Notes:');
console.log('  - Console statements in scripts/ and test files were preserved');
console.log('  - Service Worker console logs were preserved (server-side)');
console.log('  - next.config.ts console.log preserved for memory monitoring');
console.log('  - Logger imports added automatically where needed');

process.exit(0);
