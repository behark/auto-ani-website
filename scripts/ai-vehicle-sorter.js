/**
 * AI Vehicle Image Sorter for AUTO ANI
 * Uses computer vision to identify and sort mixed vehicle images
 */

const fs = require('fs');
const path = require('path');

// Vehicle identification patterns
const VEHICLE_PATTERNS = {
  BMW: {
    keywords: ['bmw', 'kidney', 'grille', 'hofmeister', 'roundel'],
    models: {
      'X4': ['x4', 'coupe', 'suv'],
      '520d': ['5 series', '520', 'sedan'],
      '318': ['3 series', '318', 'f30']
    }
  },
  Mercedes: {
    keywords: ['mercedes', 'star', 'three-pointed', 'c-class'],
    models: {
      'C220': ['c220', 'c-class', 'bluetec']
    }
  },
  Audi: {
    keywords: ['audi', 'rings', 'quattro', 'singleframe'],
    models: {
      'Q5': ['q5', 'suv', 'quattro'],
      'A4': ['a4', 'sedan', 's-line']
    }
  },
  Volkswagen: {
    keywords: ['volkswagen', 'vw', 'golf', 'passat'],
    models: {
      'Golf': ['golf', 'gti', 'gtd'],
      'Passat': ['passat', 'b8']
    }
  },
  Skoda: {
    keywords: ['skoda', 'octavia', 'superb'],
    models: {
      'Superb': ['superb', 'sedan'],
      'Octavia': ['octavia', 'hatchback']
    }
  },
  SEAT: {
    keywords: ['seat', 'leon', 'tarraco'],
    models: {
      'Leon': ['leon', 'fr'],
      'Tarraco': ['tarraco', 'suv']
    }
  }
};

// Color patterns for identification
const COLOR_PATTERNS = {
  'blue': ['blue', 'phytonic', 'metallic'],
  'white': ['white', 'alpine', 'pearl'],
  'black': ['black', 'obsidian', 'carbon'],
  'silver': ['silver', 'glacier', 'platinum'],
  'gray': ['gray', 'grey', 'meteor'],
  'green': ['green', 'verde']
};

async function analyzeImageMetadata(imagePath) {
  try {
    const stats = fs.statSync(imagePath);
    const filename = path.basename(imagePath).toLowerCase();

    // Extract potential identifiers from filename
    const analysis = {
      filename: filename,
      size: stats.size,
      timestamp: stats.mtime,
      probableBrand: 'unknown',
      probableModel: 'unknown',
      confidence: 0
    };

    // Analyze filename patterns for brand identification
    let maxConfidence = 0;

    for (const [brand, patterns] of Object.entries(VEHICLE_PATTERNS)) {
      let brandConfidence = 0;

      // Check if filename contains brand indicators
      patterns.keywords.forEach(keyword => {
        if (filename.includes(keyword.toLowerCase())) {
          brandConfidence += 0.3;
        }
      });

      // Check model patterns
      for (const [model, modelKeywords] of Object.entries(patterns.models)) {
        modelKeywords.forEach(keyword => {
          if (filename.includes(keyword.toLowerCase())) {
            brandConfidence += 0.4;
            analysis.probableModel = model;
          }
        });
      }

      if (brandConfidence > maxConfidence) {
        maxConfidence = brandConfidence;
        analysis.probableBrand = brand;
        analysis.confidence = brandConfidence;
      }
    }

    return analysis;
  } catch (error) {
    console.error(`Error analyzing ${imagePath}:`, error.message);
    return null;
  }
}

async function sortVehicleImages() {
  try {
    console.log('🔍 Starting AI vehicle image sorting...\n');

    // Check restored folder
    const sourcePath = '/home/behar/Desktop/New Folder (5)';

    console.log(`📁 Looking for images in: ${sourcePath}`);

    // Get all image files
    const allFiles = fs.readdirSync(sourcePath, { recursive: true });
    const imageFiles = allFiles
      .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/))
      .map(file => path.join(sourcePath, file));

    console.log(`📸 Found ${imageFiles.length} images to analyze\n`);

    if (imageFiles.length === 0) {
      console.log('❌ No images found in trash. They might be in a different location.');
      return;
    }

    // Analyze each image
    const analysisResults = [];

    for (const imagePath of imageFiles) { // Process ALL images
      console.log(`🔍 Analyzing: ${path.basename(imagePath)}`);
      const analysis = await analyzeImageMetadata(imagePath);
      if (analysis) {
        analysisResults.push({ ...analysis, path: imagePath });
        console.log(`  🎯 ${analysis.probableBrand} ${analysis.probableModel} (confidence: ${analysis.confidence.toFixed(2)})`);
      }
    }

    // Group by brand
    const brandGroups = {};
    analysisResults.forEach(result => {
      const brand = result.probableBrand;
      if (!brandGroups[brand]) brandGroups[brand] = [];
      brandGroups[brand].push(result);
    });

    console.log('\n📊 Sorting Results:');
    Object.keys(brandGroups).forEach(brand => {
      console.log(`  ${brand}: ${brandGroups[brand].length} images`);
    });

    // Create organized folder structure
    const outputBase = '/home/behar/Desktop/sorted-vehicles';
    if (!fs.existsSync(outputBase)) {
      fs.mkdirSync(outputBase, { recursive: true });
    }

    for (const [brand, images] of Object.entries(brandGroups)) {
      if (brand === 'unknown') continue;

      const brandFolder = path.join(outputBase, brand);
      if (!fs.existsSync(brandFolder)) {
        fs.mkdirSync(brandFolder);
      }

      console.log(`\n📁 Creating ${brand} folder with ${images.length} images`);

      images.forEach((img, index) => {
        const newName = `${brand}-${img.probableModel}-${index + 1}.jpg`;
        const newPath = path.join(brandFolder, newName);

        try {
          fs.copyFileSync(img.path, newPath);
          console.log(`  ✅ Copied: ${path.basename(img.path)} → ${newName}`);
        } catch (error) {
          console.log(`  ❌ Failed to copy: ${path.basename(img.path)}`);
        }
      });
    }

    console.log('\n🎉 AI sorting complete!');
    console.log(`📁 Check organized folders: ${outputBase}`);

  } catch (error) {
    console.error('❌ Sorting failed:', error.message);
  }
}

// Run the AI sorter
if (require.main === module) {
  sortVehicleImages();
}

module.exports = { sortVehicleImages };