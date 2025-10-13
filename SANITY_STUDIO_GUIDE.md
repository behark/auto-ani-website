# Sanity Studio Management Guide

## 🎯 Overview

This guide provides step-by-step instructions for accessing, managing, and updating your Sanity Studio data for all three automotive businesses:

- **AUTO ANI** - Kosovo Dealership
- **Kroi Auto Center** - Finnish Service Center
- **Kiilto & Loisto** - Car Wash Service

## 📋 Project Information

| Setting | Value |
|---------|-------|
| **Project ID** | `j2t31xge` |
| **Dataset** | `production` |
| **Organization ID** | `ozLOzEUVp` |
| **Studio URL** | https://studio.sanity.io |

## 🚀 Getting Started

### Step 1: Access Sanity Studio

1. **Open your browser** and navigate to: https://studio.sanity.io
2. **Sign in** with your Sanity account credentials
3. **Select your project**: Look for `j2t31xge` (auto-ani-website)
4. **Choose dataset**: Ensure you're working with `production`

### Step 2: Run the Data Population Script

Before managing data in the studio, populate it with the business information:

```bash
# Navigate to your project directory
cd /home/behar/auto-ani-website

# Run the population script
node populate-sanity-data.js
```

**Expected Output:**
```
🚀 Starting Sanity Data Population...
✅ Connected to Sanity successfully!
🏢 Populating Business Information...
👥 Populating Team Members...
🔧 Populating Services...
⭐ Populating Testimonials...
🎉 Data population completed successfully!
```

## 📊 Data Structure Overview

### Document Types

Your Sanity Studio now contains these document types:

| Document Type | Count | Description |
|---------------|-------|-------------|
| `businessInfo` | 3 | Core business information for each company |
| `teamMember` | 8 | Staff profiles across all businesses |
| `service` | 18 | Service offerings with pricing |
| `testimonial` | 12 | Customer reviews and feedback |

### Business Information Documents

#### AUTO ANI (Kosovo Dealership)
- **ID**: `business-auto-ani`
- **Services**: Vehicle Sales, Financing, Trade-In, Import, Insurance, After-Sales
- **Team**: 4 members (Behar Gashi, Arben Hasani, Fitim Berisha, Valdete Krasniqi)

#### Kroi Auto Center (Finnish Service Center)
- **ID**: `business-kroi-auto`
- **Services**: Diagnostics, Brake Service, Oil Change, Tire Service, Electrical, A/C
- **Team**: 3 members (Mikko Virtanen, Anna Korhonen, Jari Lehto)

#### Kiilto & Loisto (Car Wash Service)
- **ID**: `business-kiilto-loisto`
- **Services**: Basic Wash, Premium Wash, Full Detail, Interior, Wax, Tire Care
- **Team**: 2 members (Petteri Salo, Laura Mäki)

## 🛠️ Managing Content in Sanity Studio

### Editing Business Information

1. **Navigate to** `Business Info` in the studio sidebar
2. **Select** the business you want to edit
3. **Update fields** such as:
   - Contact information
   - Business hours
   - Social media links
   - Certifications
   - Address details

### Managing Team Members

1. **Go to** `Team Members` section
2. **Add new members** or edit existing ones
3. **Important fields**:
   - Name, Role, Email, Phone
   - Languages and Specialties
   - Bio and Experience
   - Business Association (which company they work for)

### Updating Services

1. **Access** `Services` section
2. **Edit pricing** and descriptions
3. **Key fields**:
   - Service name and description
   - Price (€) and duration (minutes)
   - Features list
   - Business type association
   - Booking requirements

### Managing Testimonials

1. **Navigate to** `Testimonials`
2. **Add new reviews** or moderate existing ones
3. **Essential fields**:
   - Customer name and rating (1-5 stars)
   - Review text
   - Service type and vehicle (if applicable)
   - Associated business

## 🖼️ Adding Images

### For Team Members
1. **Open a team member document**
2. **Click the image field**
3. **Upload** professional photos (recommended: 400x400px, square format)
4. **Add alt text** for accessibility

### For Services
1. **Edit a service document**
2. **Upload relevant images** (recommended: 800x600px)
3. **Use high-quality photos** showing the service in action

## 🔄 Data Synchronization

### Verifying Changes on Websites

After making changes in Sanity Studio:

1. **Wait 2-3 minutes** for CDN cache to update
2. **Refresh your websites** to see changes
3. **Check all three business sites**:
   - AUTO ANI website
   - Kroi Auto Center site
   - Kiilto & Loisto car wash site

### Cache Management

If changes don't appear immediately:
- **Clear browser cache** (Ctrl+F5 or Cmd+Shift+R)
- **Wait for CDN propagation** (up to 5 minutes)
- **Check console** for any API errors

## 🔧 Troubleshooting

### Common Issues

#### 1. Data Not Appearing on Website
**Problem**: Updated data in Sanity Studio but website shows old content

**Solutions**:
- Verify you're editing the `production` dataset
- Check API token permissions
- Clear website cache
- Ensure correct project ID in website configuration

#### 2. Images Not Loading
**Problem**: Images uploaded to Sanity but not displaying on website

**Solutions**:
- Verify image URL format in code
- Check image optimization settings
- Ensure proper image field configuration
- Test image URLs directly

#### 3. Service Data Missing
**Problem**: Services not showing for specific business

**Solutions**:
- Check `businessTypes` array in service documents
- Verify `businessId` references are correct
- Ensure services are published (not draft)

### API Connection Test

To test your Sanity connection:

```bash
# Test API connectivity
curl "https://j2t31xge.api.sanity.io/v2024-01-01/data/query/production?query=*[_type == 'businessInfo']"
```

## 📝 Content Guidelines

### Writing Style
- **Professional tone** for business information
- **Clear, concise descriptions** for services
- **Authentic testimonials** that sound natural
- **Consistent terminology** across all businesses

### Pricing Guidelines
- **Use Euro (€) currency** for all pricing
- **Include VAT** if applicable
- **Round to reasonable amounts** (avoid odd cents)
- **Keep competitive** with local market rates

### Image Standards
- **High resolution**: Minimum 800x600px for service images
- **Professional quality**: Well-lit, clear photos
- **Consistent style**: Similar lighting and composition
- **Relevant content**: Images should match the service/person

## 🔗 Integration with Websites

### Website Configuration

Your websites use these Sanity configurations:

```typescript
// lib/sanity.ts
export const client = createClient({
  projectId: 'j2t31xge',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
})
```

### Query Structure

Data is fetched using these GROQ queries:
- **Business Info**: `*[_type == "businessInfo"][0]`
- **Team Members**: `*[_type == "teamMember"] | order(order asc)`
- **Services**: `*[_type == "service"] | order(order asc)`
- **Testimonials**: `*[_type == "testimonial"] | order(_createdAt desc)`

## 📞 Support

### Need Help?

If you encounter issues:

1. **Check this documentation** first
2. **Review Sanity's official docs**: https://sanity.io/docs
3. **Contact support** if problems persist
4. **Keep backups** of important data changes

### Useful Resources

- **Sanity Documentation**: https://sanity.io/docs
- **GROQ Query Language**: https://sanity.io/docs/groq
- **Image Optimization**: https://sanity.io/docs/image-urls
- **Content Management Best Practices**: https://sanity.io/guides

---

## 🎉 Congratulations!

You now have a fully populated Sanity Studio with comprehensive business data for all three automotive companies. Your websites should now display real business information instead of fallback data.

Remember to regularly update your content to keep it fresh and accurate!