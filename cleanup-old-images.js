const fs = require('fs');
const path = require('path');

function cleanupDirectory(dir) {
  const files = fs.readdirSync(dir);
  let deleted = 0;
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      deleted += cleanupDirectory(fullPath);
    } else if (file.match(/\.(jpg|jpeg)$/i) && fs.existsSync(fullPath.replace(/\.(jpg|jpeg)$/i, '-optimized.webp'))) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️  Deleted: ${file}`);
      deleted++;
    }
  }
  
  return deleted;
}

const total = cleanupDirectory('./public/images/vehicles/optimized');
console.log(`\n✅ Deleted ${total} old JPG files`);
