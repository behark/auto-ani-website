#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Get all TypeScript and TSX files
function getAllFiles() {
  const patterns = [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}'
  ];

  let files = [];
  patterns.forEach(pattern => {
    files = files.concat(glob.sync(pattern));
  });
  return files;
}

// Sort imports according to common conventions
function sortImports(content) {
  const lines = content.split('\n');
  const imports = [];
  const nonImports = [];
  let inImportSection = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('import ') || line.trim().startsWith('export ')) {
      if (inImportSection) {
        imports.push(line);
      } else {
        nonImports.push(line);
      }
    } else if (line.trim() === '' && inImportSection) {
      // Keep empty lines in import section
      imports.push(line);
    } else {
      inImportSection = false;
      nonImports.push(line);
    }
  }

  // Sort imports by type
  const reactImports = [];
  const nextImports = [];
  const externalImports = [];
  const internalImports = [];
  const emptyLines = [];

  imports.forEach(line => {
    if (line.trim() === '') {
      emptyLines.push(line);
    } else if (line.includes('from "react"') || line.includes('from \'react\'')) {
      reactImports.push(line);
    } else if (line.includes('from "next') || line.includes('from \'next')) {
      nextImports.push(line);
    } else if (line.includes('from "@/') || line.includes('from \'@/')) {
      internalImports.push(line);
    } else {
      externalImports.push(line);
    }
  });

  // Reconstruct with proper ordering and spacing
  const sortedImports = [
    ...reactImports,
    ...(reactImports.length > 0 ? [''] : []),
    ...nextImports,
    ...(nextImports.length > 0 ? [''] : []),
    ...externalImports.sort(),
    ...(externalImports.length > 0 ? [''] : []),
    ...internalImports.sort(),
    ...(internalImports.length > 0 ? [''] : [])
  ];

  return [...sortedImports, ...nonImports].join('\n');
}

// Fix a single file
function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = sortImports(content);

    if (content !== fixed) {
      fs.writeFileSync(filePath, fixed);
      console.log(`✅ Fixed imports in ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🔧 Fixing import ordering issues...\n');

const files = getAllFiles();
let fixedCount = 0;

files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Import fixes complete!`);
console.log(`📊 Fixed ${fixedCount} out of ${files.length} files`);

// Install required packages if not present
if (!fs.existsSync('node_modules/glob')) {
  console.log('\n📦 Installing required dependencies...');
  require('child_process').execSync('npm install glob', { stdio: 'inherit' });
}