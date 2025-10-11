#!/bin/bash

# Compress original vehicle images to reduce size
# Requires: imagemagick (apt-get install imagemagick)

echo "🖼️ Compressing original vehicle images..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Installing..."
    sudo apt-get update && sudo apt-get install -y imagemagick
fi

BEFORE_SIZE=$(du -sh public/images/vehicles/ | cut -f1)
COMPRESSED_COUNT=0

# Find all JPG files larger than 300KB and compress them
find public/images/vehicles -name "*.jpg" -size +300k | while read file; do
    echo "Compressing: $file"
    # Compress to 85% quality, max width 1920px
    convert "$file" -quality 85 -resize '1920x1920>' "$file.tmp"

    # Check if compression was successful and resulted in smaller file
    if [ -f "$file.tmp" ]; then
        ORIG_SIZE=$(stat -c%s "$file")
        NEW_SIZE=$(stat -c%s "$file.tmp")

        if [ $NEW_SIZE -lt $ORIG_SIZE ]; then
            mv "$file.tmp" "$file"
            COMPRESSED_COUNT=$((COMPRESSED_COUNT + 1))
            echo "  ✓ Reduced from $(($ORIG_SIZE/1024))KB to $(($NEW_SIZE/1024))KB"
        else
            rm "$file.tmp"
            echo "  - Already optimized"
        fi
    fi
done

AFTER_SIZE=$(du -sh public/images/vehicles/ | cut -f1)

echo "---"
echo "✅ Compression complete!"
echo "📊 Folder size: $BEFORE_SIZE → $AFTER_SIZE"
echo "📊 Files compressed: $COMPRESSED_COUNT"