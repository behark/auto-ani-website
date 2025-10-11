#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * PWA Icon Generation Script for AUTO ANI
 *
 * Generates all required PWA icons and splash screens from a base logo
 */

// Configuration
const CONFIG = {
  // Base logo file (should be high resolution, preferably 1024x1024 or larger)
  baseLogo: 'public/images/logo.png', // You'll need to provide this

  // Output directory
  outputDir: 'public/images/pwa',

  // PWA icon sizes required
  iconSizes: [72, 96, 128, 144, 152, 192, 384, 512],

  // Apple splash screen dimensions (width x height)
  splashScreens: [
    { width: 2048, height: 2732, name: 'apple-splash-2048-2732.png' }, // iPad Pro 12.9"
    { width: 1668, height: 2388, name: 'apple-splash-1668-2388.png' }, // iPad Pro 11"
    { width: 1536, height: 2048, name: 'apple-splash-1536-2048.png' }, // iPad Pro 10.5"
    { width: 1290, height: 2796, name: 'apple-splash-1290-2796.png' }, // iPhone 14 Pro Max
    { width: 1179, height: 2556, name: 'apple-splash-1179-2556.png' }, // iPhone 14 Pro
    { width: 1125, height: 2436, name: 'apple-splash-1125-2436.png' }, // iPhone X/XS
    { width: 1242, height: 2688, name: 'apple-splash-1242-2688.png' }, // iPhone XS Max
    { width: 828, height: 1792, name: 'apple-splash-828-1792.png' },   // iPhone XR
    { width: 1170, height: 2532, name: 'apple-splash-1170-2532.png' }, // iPhone 12/13
    { width: 1284, height: 2778, name: 'apple-splash-1284-2778.png' }  // iPhone 12/13 Pro Max
  ],

  // Brand colors
  backgroundColor: '#000000',
  textColor: '#FFFFFF'
};

class PWAIconGenerator {
  constructor() {
    this.logoExists = false;
  }

  async generate() {
    console.log('🚀 Starting PWA Icon Generation for AUTO ANI...\n');

    // Create output directory
    await this.ensureDirectory(CONFIG.outputDir);

    // Check if base logo exists
    if (fs.existsSync(CONFIG.baseLogo)) {
      this.logoExists = true;
      console.log(`✅ Found base logo: ${CONFIG.baseLogo}`);
    } else {
      console.log(`⚠️  Base logo not found: ${CONFIG.baseLogo}`);
      console.log('📝 Creating placeholder logos instead...');
    }

    // Generate PWA icons
    await this.generateIcons();

    // Generate Apple splash screens
    await this.generateSplashScreens();

    // Generate shortcut icons
    await this.generateShortcutIcons();

    // Generate screenshots
    await this.generateScreenshots();

    console.log('\n✅ PWA icon generation completed!');
    console.log(`📁 All files saved to: ${CONFIG.outputDir}`);
  }

  async generateIcons() {
    console.log('\n🎨 Generating PWA icons...');

    for (const size of CONFIG.iconSizes) {
      const filename = `icon-${size}x${size}.png`;
      const outputPath = path.join(CONFIG.outputDir, filename);

      if (this.logoExists) {
        // Use actual logo
        await sharp(CONFIG.baseLogo)
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toFile(outputPath);
      } else {
        // Create placeholder with AUTO ANI text
        await this.createPlaceholderIcon(size, outputPath);
      }

      console.log(`   ✅ Generated ${filename} (${size}x${size})`);
    }
  }

  async generateSplashScreens() {
    console.log('\n📱 Generating Apple splash screens...');

    for (const screen of CONFIG.splashScreens) {
      const outputPath = path.join(CONFIG.outputDir, screen.name);
      await this.createSplashScreen(screen.width, screen.height, outputPath);
      console.log(`   ✅ Generated ${screen.name} (${screen.width}x${screen.height})`);
    }
  }

  async generateShortcutIcons() {
    console.log('\n🔗 Generating shortcut icons...');

    const shortcuts = [
      { name: 'shortcut-vehicles.png', text: '🚗', bg: '#1a1a1a' },
      { name: 'shortcut-contact.png', text: '📞', bg: '#2563eb' },
      { name: 'shortcut-financing.png', text: '💰', bg: '#059669' }
    ];

    for (const shortcut of shortcuts) {
      const outputPath = path.join(CONFIG.outputDir, shortcut.name);
      await this.createShortcutIcon(192, shortcut.text, shortcut.bg, outputPath);
      console.log(`   ✅ Generated ${shortcut.name}`);
    }
  }

  async generateScreenshots() {
    console.log('\n📸 Generating PWA screenshots...');

    // Mobile screenshot (390x844)
    await this.createMockupScreenshot(390, 844, 'screenshot-mobile.png');
    console.log(`   ✅ Generated screenshot-mobile.png (390x844)`);

    // Desktop screenshot (1920x1080)
    await this.createMockupScreenshot(1920, 1080, 'screenshot-desktop.png');
    console.log(`   ✅ Generated screenshot-desktop.png (1920x1080)`);
  }

  async createPlaceholderIcon(size, outputPath) {
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#000000;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#333333;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" fill="url(#grad)" />
        <text x="50%" y="30%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size/6}" font-weight="bold" fill="#FFFFFF">AUTO</text>
        <text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size/6}" font-weight="bold" fill="#FFFFFF">ANI</text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);
  }

  async createSplashScreen(width, height, outputPath) {
    const logoSize = Math.min(width, height) * 0.3;
    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="${CONFIG.backgroundColor}" />
        <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="${logoSize/3}" font-weight="bold" fill="${CONFIG.textColor}">AUTO ANI</text>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="${logoSize/8}" fill="${CONFIG.textColor}">Premium Auto Salon</text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);
  }

  async createShortcutIcon(size, emoji, backgroundColor, outputPath) {
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" rx="${size/8}" fill="${backgroundColor}" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="${size*0.6}">${emoji}</text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);
  }

  async createMockupScreenshot(width, height, filename) {
    const isMobile = width < 500;
    const headerHeight = isMobile ? 60 : 80;
    const fontSize = isMobile ? width/20 : width/40;

    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="#ffffff" />

        <!-- Header -->
        <rect width="${width}" height="${headerHeight}" fill="#000000" />
        <text x="20" y="${headerHeight/2}" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#FFFFFF">AUTO ANI</text>

        <!-- Content area -->
        <rect x="20" y="${headerHeight + 20}" width="${width - 40}" height="${height - headerHeight - 40}" fill="#f5f5f5" stroke="#e5e5e5" stroke-width="1" />

        <!-- Vehicle cards mockup -->
        ${this.generateVehicleCardsMockup(width, height, headerHeight, isMobile)}

        <!-- Footer text -->
        <text x="50%" y="${height - 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize*0.7}" fill="#666666">Premium Auto Salon Kosovo</text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(CONFIG.outputDir, filename));
  }

  generateVehicleCardsMockup(width, height, headerHeight, isMobile) {
    const cardWidth = isMobile ? width - 60 : (width - 80) / 3 - 20;
    const cardHeight = isMobile ? 200 : 250;
    const startY = headerHeight + 40;
    const cards = isMobile ? 2 : 3;

    let mockup = '';

    for (let i = 0; i < cards; i++) {
      const x = isMobile ? 30 : 30 + i * (cardWidth + 20);
      const y = isMobile ? startY + i * (cardHeight + 20) : startY;

      mockup += `
        <!-- Vehicle card ${i + 1} -->
        <rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" fill="#ffffff" stroke="#e5e5e5" stroke-width="1" />
        <rect x="${x + 10}" y="${y + 10}" width="${cardWidth - 20}" height="${cardHeight * 0.6}" fill="#f0f0f0" />
        <text x="${x + 10}" y="${y + cardHeight * 0.7}" font-family="Arial, sans-serif" font-size="${isMobile ? 14 : 16}" font-weight="bold" fill="#333333">BMW X5 2020</text>
        <text x="${x + 10}" y="${y + cardHeight * 0.8}" font-family="Arial, sans-serif" font-size="${isMobile ? 12 : 14}" fill="#666666">€45,000</text>
      `;
    }

    return mockup;
  }

  async ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

// Main execution
async function main() {
  try {
    const generator = new PWAIconGenerator();
    await generator.generate();
  } catch (error) {
    console.error('💥 Error generating PWA icons:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = PWAIconGenerator;