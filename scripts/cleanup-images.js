#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration: Keep only these sizes for better performance
const SIZES_TO_KEEP = ['640w', '1280w', 'original'];
const FORMATS_TO_KEEP = ['.webp']; // Keep only WebP for maximum compression

const optimizedDir = path.join(process.cwd(), 'public', 'images', 'optimized');

let deletedCount = 0;
let keptCount = 0;
let savedBytes = 0;

function shouldKeepFile(filename) {
  // Check if it's a format we want to keep
  const hasValidFormat = FORMATS_TO_KEEP.some(format => filename.endsWith(format));
  if (!hasValidFormat) return false;

  // Check if it's a size we want to keep
  const hasValidSize = SIZES_TO_KEEP.some(size => filename.includes(`-${size}`));

  // Keep JSON reports
  if (filename.endsWith('.json')) return true;

  return hasValidSize;
}

function cleanDirectory(dir) {
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      cleanDirectory(fullPath);
    } else if (stat.isFile()) {
      if (!shouldKeepFile(item)) {
        savedBytes += stat.size;
        fs.unlinkSync(fullPath);
        deletedCount++;
        console.log(`Deleted: ${path.relative(optimizedDir, fullPath)}`);
      } else {
        keptCount++;
      }
    }
  });
}

console.log('🧹 Cleaning up optimized images directory...');
console.log('Keeping only:', SIZES_TO_KEEP.join(', '));
console.log('Keeping formats:', FORMATS_TO_KEEP.join(', '));
console.log('---');

cleanDirectory(optimizedDir);

console.log('---');
console.log(`✅ Cleanup complete!`);
console.log(`📊 Deleted: ${deletedCount} files`);
console.log(`📊 Kept: ${keptCount} files`);
console.log(`💾 Saved: ${(savedBytes / 1024 / 1024).toFixed(2)} MB`);

// Check new size
const { execSync } = require('child_process');
const newSize = execSync('du -sh public/images/optimized/').toString().trim();
console.log(`📁 New folder size: ${newSize}`);