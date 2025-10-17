/**
 * Time-Based Vehicle Image Sorter for AUTO ANI
 * Groups images by download time windows (1-2 minute gaps)
 */

const fs = require('fs');
const path = require('path');

async function sortImagesByTime() {
  try {
    console.log('⏰ Starting time-based vehicle image sorting...\n');

    const sourcePath = '/home/behar/Desktop/New Folder (5)';

    // Get all image files with timestamps
    const files = fs.readdirSync(sourcePath);
    const imageFiles = files
      .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/))
      .map(file => {
        const fullPath = path.join(sourcePath, file);
        const stats = fs.statSync(fullPath);
        return {
          name: file,
          path: fullPath,
          mtime: stats.mtime,
          size: stats.size
        };
      })
      .sort((a, b) => a.mtime - b.mtime); // Sort by oldest first

    console.log(`📸 Found ${imageFiles.length} images to analyze\n`);

    // Group images by time windows (gap of 2+ minutes = new vehicle)
    const vehicleGroups = [];
    let currentGroup = [];
    let groupIndex = 1;

    for (let i = 0; i < imageFiles.length; i++) {
      const currentFile = imageFiles[i];

      if (currentGroup.length === 0) {
        // Start new group
        currentGroup = [currentFile];
      } else {
        const lastFile = currentGroup[currentGroup.length - 1];
        const timeDiff = (currentFile.mtime - lastFile.mtime) / (1000 * 60); // Minutes

        if (timeDiff > 2) {
          // Gap > 2 minutes = new vehicle, finish current group
          vehicleGroups.push({
            index: groupIndex++,
            images: [...currentGroup],
            startTime: currentGroup[0].mtime,
            endTime: currentGroup[currentGroup.length - 1].mtime,
            duration: (currentGroup[currentGroup.length - 1].mtime - currentGroup[0].mtime) / (1000 * 60) // minutes
          });

          console.log(`📊 Vehicle Group ${vehicleGroups.length}: ${currentGroup.length} images (${vehicleGroups[vehicleGroups.length - 1].duration.toFixed(1)} min span)`);

          // Start new group
          currentGroup = [currentFile];
        } else {
          // Same vehicle, add to current group
          currentGroup.push(currentFile);
        }
      }
    }

    // Don't forget the last group
    if (currentGroup.length > 0) {
      vehicleGroups.push({
        index: groupIndex,
        images: [...currentGroup],
        startTime: currentGroup[0].mtime,
        endTime: currentGroup[currentGroup.length - 1].mtime,
        duration: (currentGroup[currentGroup.length - 1].mtime - currentGroup[0].mtime) / (1000 * 60)
      });
      console.log(`📊 Vehicle Group ${vehicleGroups.length}: ${currentGroup.length} images (${vehicleGroups[vehicleGroups.length - 1].duration.toFixed(1)} min span)`);
    }

    console.log(`\n🎯 Identified ${vehicleGroups.length} vehicle groups based on time gaps!\n`);

    // Create organized folders
    const outputBase = '/home/behar/Desktop/sorted-vehicles-by-time';
    if (!fs.existsSync(outputBase)) {
      fs.mkdirSync(outputBase, { recursive: true });
    }

    // Suggested vehicle names based on our known uploads
    const suggestedNames = [
      'BMW-X4-30d-2022',
      'BMW-318-F30-2017',
      'VW-Passat-B8-2015',
      'Mercedes-C220-2015',
      'SEAT-Leon-FR-2018',
      'VW-Golf-GTD-2017',
      'Skoda-Superb-Matrix-2020',
      'SEAT-Tarraco-2019',
      'Audi-Q5-Finnish-2020',
      'Skoda-Octavia-2022',
      'SEAT-Tarraco-Green-2019',
      'BMW-520d-xDrive-2019',
      'Audi-A4-S-Line-2015',
      'Skoda-Superb-Business-2018'
    ];

    vehicleGroups.forEach((group, index) => {
      const folderName = suggestedNames[index] || `Vehicle-${group.index}`;
      const groupFolder = path.join(outputBase, folderName);

      if (!fs.existsSync(groupFolder)) {
        fs.mkdirSync(groupFolder);
      }

      console.log(`📁 Creating folder: ${folderName} (${group.images.length} images)`);
      console.log(`  ⏰ Time span: ${new Date(group.startTime).toLocaleTimeString()} - ${new Date(group.endTime).toLocaleTimeString()}`);

      group.images.forEach((img, imgIndex) => {
        const newName = `${folderName}-${imgIndex + 1}.jpg`;
        const newPath = path.join(groupFolder, newName);

        try {
          fs.copyFileSync(img.path, newPath);
          console.log(`    ✅ ${imgIndex + 1}. ${path.basename(img.path)} (${new Date(img.mtime).toLocaleTimeString()})`);
        } catch (error) {
          console.log(`    ❌ Failed: ${path.basename(img.path)}`);
        }
      });

      console.log('');
    });

    console.log('🎉 Time-based sorting complete!');
    console.log(`📁 Check organized folders: ${outputBase}`);
    console.log('\n✨ Now you can review each folder and rename as needed!');
    console.log('💡 Then you can re-upload each vehicle individually with correct images!');

  } catch (error) {
    console.error('❌ Time sorting failed:', error.message);
  }
}

// Run the time sorter
if (require.main === module) {
  sortImagesByTime();
}

module.exports = { sortImagesByTime };