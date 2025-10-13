#!/bin/bash

# Sanity Setup and Data Population Script
# This script populates your Sanity Studio with business data

echo "🚀 AUTO ANI Website - Sanity Data Setup"
echo "======================================="
echo ""
echo "📋 Project Information:"
echo "   Project ID: j2t31xge"
echo "   Dataset: production"
echo "   Organization: ozLOzEUVp"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if the population script exists
if [ ! -f "populate-sanity-data.js" ]; then
    echo "❌ Data population script not found: populate-sanity-data.js"
    echo "   Please ensure you're in the correct directory."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Run the data population script
echo "📊 Starting data population..."
echo "   This will add business data for:"
echo "   • AUTO ANI (Kosovo Dealership)"
echo "   • Kroi Auto Center (Finnish Service Center)"
echo "   • Kiilto & Loisto (Car Wash Service)"
echo ""

node populate-sanity-data.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "🔗 Next Steps:"
    echo "1. Visit Sanity Studio: https://studio.sanity.io"
    echo "2. Select project: j2t31xge"
    echo "3. Review and customize your business data"
    echo "4. Add images to team members and services"
    echo "5. Check your websites to see the real data"
    echo ""
    echo "📖 For detailed instructions, see: SANITY_STUDIO_GUIDE.md"
else
    echo ""
    echo "❌ Setup failed. Please check the error messages above."
    echo "   Ensure your SANITY_API_TOKEN is correctly set in .env.local"
    exit 1
fi