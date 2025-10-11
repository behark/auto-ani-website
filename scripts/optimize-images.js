#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Image Optimization Script for AUTO ANI Website
 *
 * This script:
 * 1. Finds all unoptimized images in the project
 * 2. Converts them to WebP format with multiple responsive sizes
 * 3. Maintains original images as fallbacks
 * 4. Creates an optimization report
 */

// Configuration
const CONFIG = {
  // Responsive breakpoints for image sizes
  sizes: [320, 640, 768, 1024, 1280, 1920],

  // Quality settings
  webpQuality: 85,
  jpegQuality: 90,
  pngQuality: 90,

  // Input directories to scan
  inputDirs: [
    'public/images/vehicles',
    'public/images/showroom',
    'public/images/team',
    'public/images/gallery'
  ],

  // Output directory for optimized images
  outputDir: 'public/images/optimized',

  // Supported file extensions
  supportedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],

  // Skip already optimized images
  skipOptimized: true
};

class ImageOptimizer {
  constructor() {
    this.stats = {
      processed: 0,
      skipped: 0,
      errors: 0,
      originalSize: 0,
      optimizedSize: 0,
      files: []
    };
  }

  /**
   * Main optimization function
   */
  async optimize() {
    console.log('🚀 Starting AUTO ANI Image Optimization...\n');

    // Create output directory if it doesn't exist
    await this.ensureDirectory(CONFIG.outputDir);

    // Find all images to optimize
    const imagePaths = await this.findImages();
    console.log(`📁 Found ${imagePaths.length} images to process\n`);

    // Process each image
    for (const imagePath of imagePaths) {
      await this.processImage(imagePath);
    }

    // Generate report
    await this.generateReport();

    console.log('\n✅ Image optimization completed!');
    this.printStats();
  }

  /**
   * Find all images in input directories
   */
  async findImages() {
    const images = [];

    for (const dir of CONFIG.inputDirs) {
      const fullPath = path.join(process.cwd(), dir);

      if (fs.existsSync(fullPath)) {
        const dirImages = await this.scanDirectory(fullPath);
        images.push(...dirImages);
      } else {
        console.log(`⚠️  Directory not found: ${dir}`);
      }
    }

    return images;
  }

  /**
   * Recursively scan directory for images
   */
  async scanDirectory(dirPath) {
    const images = [];
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        // Skip already optimized directory
        if (item.name === 'optimized') continue;

        const subImages = await this.scanDirectory(fullPath);
        images.push(...subImages);
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();

        if (CONFIG.supportedExtensions.includes(ext)) {
          images.push(fullPath);
        }
      }
    }

    return images;
  }

  /**
   * Process a single image
   */
  async processImage(imagePath) {
    try {
      const relativePath = path.relative(process.cwd(), imagePath);
      const fileName = path.basename(imagePath, path.extname(imagePath));
      const originalStats = fs.statSync(imagePath);

      console.log(`🔄 Processing: ${relativePath}`);

      // Check if already optimized
      if (CONFIG.skipOptimized && await this.isAlreadyOptimized(imagePath)) {
        console.log(`   ⏭️  Already optimized, skipping`);
        this.stats.skipped++;
        return;
      }

      // Create output directory for this image
      const outputSubDir = path.join(CONFIG.outputDir, path.dirname(relativePath).replace('public/images/', ''));
      await this.ensureDirectory(outputSubDir);

      // Load original image
      const image = sharp(imagePath);
      const metadata = await image.metadata();

      console.log(`   📏 Original: ${metadata.width}x${metadata.height} (${this.formatFileSize(originalStats.size)})`);

      let totalOptimizedSize = 0;
      const generatedFiles = [];

      // Generate responsive sizes
      for (const size of CONFIG.sizes) {
        // Skip if image is smaller than target size
        if (metadata.width < size) continue;

        // Generate WebP version
        const webpPath = path.join(outputSubDir, `${fileName}-${size}w.webp`);
        await image
          .resize(size, null, { withoutEnlargement: true })
          .webp({ quality: CONFIG.webpQuality })
          .toFile(webpPath);

        const webpStats = fs.statSync(webpPath);
        totalOptimizedSize += webpStats.size;
        generatedFiles.push({ path: webpPath, size: webpStats.size, format: 'webp', width: size });

        // Generate JPEG fallback for original format compatibility
        if (path.extname(imagePath).toLowerCase() !== '.webp') {
          const jpegPath = path.join(outputSubDir, `${fileName}-${size}w.jpg`);
          await image
            .resize(size, null, { withoutEnlargement: true })
            .jpeg({ quality: CONFIG.jpegQuality })
            .toFile(jpegPath);

          const jpegStats = fs.statSync(jpegPath);
          totalOptimizedSize += jpegStats.size;
          generatedFiles.push({ path: jpegPath, size: jpegStats.size, format: 'jpeg', width: size });
        }
      }

      // Generate original size WebP
      const originalWebpPath = path.join(outputSubDir, `${fileName}-original.webp`);
      await image
        .webp({ quality: CONFIG.webpQuality })
        .toFile(originalWebpPath);

      const originalWebpStats = fs.statSync(originalWebpPath);
      totalOptimizedSize += originalWebpStats.size;
      generatedFiles.push({ path: originalWebpPath, size: originalWebpStats.size, format: 'webp', width: metadata.width });

      // Update statistics
      this.stats.processed++;
      this.stats.originalSize += originalStats.size;
      this.stats.optimizedSize += totalOptimizedSize;

      const compressionRatio = ((originalStats.size - totalOptimizedSize) / originalStats.size * 100).toFixed(1);
      console.log(`   ✅ Generated ${generatedFiles.length} optimized files (${compressionRatio}% compression)`);

      this.stats.files.push({
        original: relativePath,
        originalSize: originalStats.size,
        optimizedSize: totalOptimizedSize,
        compressionRatio: parseFloat(compressionRatio),
        generatedFiles: generatedFiles.length
      });

    } catch (error) {
      console.error(`   ❌ Error processing ${imagePath}: ${error.message}`);
      this.stats.errors++;
    }
  }

  /**
   * Check if image is already optimized
   */
  async isAlreadyOptimized(imagePath) {
    const relativePath = path.relative(process.cwd(), imagePath);
    const fileName = path.basename(imagePath, path.extname(imagePath));
    const outputSubDir = path.join(CONFIG.outputDir, path.dirname(relativePath).replace('public/images/', ''));

    // Check if WebP version exists
    const webpPath = path.join(outputSubDir, `${fileName}-original.webp`);
    return fs.existsSync(webpPath);
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Generate optimization report
   */
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      configuration: CONFIG,
      statistics: this.stats,
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(CONFIG.outputDir, 'optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📊 Report saved to: ${reportPath}`);
  }

  /**
   * Generate recommendations based on optimization results
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.stats.processed > 0) {
      const avgCompression = this.stats.files.reduce((sum, file) => sum + file.compressionRatio, 0) / this.stats.files.length;

      if (avgCompression > 50) {
        recommendations.push('Excellent compression ratio achieved. Consider updating image components to use WebP format.');
      } else if (avgCompression > 30) {
        recommendations.push('Good compression ratio. Consider implementing lazy loading for better performance.');
      } else {
        recommendations.push('Moderate compression achieved. Consider adjusting quality settings for better compression.');
      }
    }

    if (this.stats.errors > 0) {
      recommendations.push(`${this.stats.errors} images failed to optimize. Review error logs for details.`);
    }

    if (this.stats.skipped > 0) {
      recommendations.push(`${this.stats.skipped} images were skipped (already optimized). Use --force flag to re-optimize.`);
    }

    return recommendations;
  }

  /**
   * Print optimization statistics
   */
  printStats() {
    console.log('\n📈 Optimization Statistics:');
    console.log(`   Processed: ${this.stats.processed} images`);
    console.log(`   Skipped: ${this.stats.skipped} images`);
    console.log(`   Errors: ${this.stats.errors} images`);
    console.log(`   Original Size: ${this.formatFileSize(this.stats.originalSize)}`);
    console.log(`   Optimized Size: ${this.formatFileSize(this.stats.optimizedSize)}`);

    if (this.stats.originalSize > 0) {
      const totalSavings = this.stats.originalSize - this.stats.optimizedSize;
      const savingsPercentage = (totalSavings / this.stats.originalSize * 100).toFixed(1);
      console.log(`   Space Saved: ${this.formatFileSize(totalSavings)} (${savingsPercentage}%)`);
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Main execution
async function main() {
  try {
    const optimizer = new ImageOptimizer();
    await optimizer.optimize();
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ImageOptimizer;