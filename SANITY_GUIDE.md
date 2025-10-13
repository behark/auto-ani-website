# 📚 Sanity CMS Guide for AUTO ANI

## ✅ Current Configuration Status

**🎉 Everything is CORRECTLY configured!**

### Configuration Details

- ✅ **Project ID**: `j2t31xge`
- ✅ **Dataset**: `production`
- ✅ **API Version**: `2024-01-01`
- ✅ **API Token**: Configured (⚠️ **NEEDS TO BE REVOKED** - see SECURITY_NOTICE.md)
- ✅ **Schemas**: 5 content types defined
- ✅ **Studio**: Configured at project root

---

## 🔧 How Sanity Works

### 1. **Content Structure**

Your Sanity CMS has 5 content types:

```
📦 Sanity Studio (Content Management)
├── 🚗 Vehicles        - Your car inventory
├── 👥 Team Members    - Staff profiles
├── 🛠️  Services        - Services offered
├── 💬 Testimonials    - Customer reviews
└── 🏢 Business Info   - Company details
```

### 2. **Data Flow**

```
┌──────────────────────────────────────────────────────────┐
│  1. Content Editor (You)                                 │
│     └─> Opens Sanity Studio                              │
│         └─> Adds/edits vehicles, team members, etc.      │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│  2. Sanity Cloud (Database)                              │
│     └─> Stores all content                               │
│         └─> Optimizes images                             │
│             └─> Provides API                             │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│  3. Your Website (Next.js)                               │
│     └─> Fetches data via API                             │
│         └─> Displays on website                          │
│             └─> Updates automatically                    │
└──────────────────────────────────────────────────────────┘
```

### 3. **Key Files**

| File | Purpose |
|------|---------|
| `lib/sanity.ts` | Sanity client configuration |
| `sanity.config.ts` | Studio configuration |
| `schemas/*.ts` | Content type definitions |
| `.env.local` | Environment variables |

---

## 🚀 How to Use Sanity Studio

### **Option 1: Local Studio (Recommended for Development)**

1. **Start the studio:**

   ```bash
   npm run sanity
   ```

2. **Open in browser:**

   ```
   http://localhost:3333
   ```

3. **Login** with your Sanity account

4. **Add content:**
   - Click "Vehicles" → "+" → Fill in details
   - Upload car photos
   - Set featured vehicles
   - Add prices, mileage, etc.

### **Option 2: Hosted Studio (Production)**

1. **Deploy studio:**

   ```bash
   npx sanity deploy
   ```

2. **Access online:**

   ```
   https://your-project.sanity.studio
   ```

---

## 📝 Content Types Explained

### **1. Vehicles** (`schemas/vehicle.ts`)

**Fields:**

- `title` - Vehicle name (e.g., "2023 Toyota Camry")
- `slug` - URL-friendly name (e.g., "2023-toyota-camry")
- `brand` - Manufacturer (e.g., "Toyota")
- `model` - Model name (e.g., "Camry")
- `year` - Manufacturing year
- `price` - Selling price
- `mileage` - Kilometers driven
- `category` - Type (SUV, Sedan, etc.)
- `featured` - Show on homepage (checkbox)
- `description` - Full description
- `specifications` - Technical details (array)
- `images` - Photo gallery

**Usage in Website:**

```typescript
// Fetches vehicles from Sanity
const vehicles = await client.fetch('*[_type == "vehicle"]')
```

### **2. Team Members** (`schemas/teamMember.ts`)

**Fields:**

- `name` - Employee name
- `role` - Job title
- `email` - Contact email
- `phone` - Contact phone
- `experience` - Years of experience
- `languages` - Languages spoken
- `specialties` - Areas of expertise
- `image` - Profile photo
- `bio` - Biography

### **3. Services** (`schemas/service.ts`)

**Fields:**

- `title` - Service name
- `description` - What the service includes
- `category` - Service type
- `price` - Cost (optional)
- `duration` - Time required
- `icon` - Display icon
- `featured` - Highlight on homepage

### **4. Testimonials** (`schemas/testimonial.ts`)

**Fields:**

- `author` - Customer name
- `rating` - Stars (1-5)
- `text` - Review content
- `date` - When posted
- `vehicle` - Car they bought (reference)

### **5. Business Info** (`schemas/businessInfo.ts`)

**Fields:**

- `name` - Company name
- `description` - About the business
- `yearEstablished` - Founded year
- `address` - Physical location
- `phone` - Contact number
- `email` - Contact email
- `hours` - Opening hours
- `certifications` - Licenses/certifications
- `languages` - Languages supported
- `social` - Social media links

---

## 🔐 Security & Environment Variables

### **Current Setup:**

```bash
# .env.local
NEXT_PUBLIC_SANITY_PROJECT_ID=j2t31xge      # ✅ Public (safe)
NEXT_PUBLIC_SANITY_DATASET=production        # ✅ Public (safe)
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01    # ✅ Public (safe)
SANITY_API_TOKEN=skJ1mO2e...                 # ⚠️ MUST REVOKE!
```

### **⚠️ IMPORTANT SECURITY NOTICE:**

Your API token was exposed in Git history. **You must:**

1. **Go to Sanity Dashboard:**

   ```
   https://www.sanity.io/manage/personal/project/j2t31xge
   ```

2. **Revoke the old token:**
   - Click "API" → "Tokens"
   - Find token starting with `skJ1mO2e...`
   - Click "Revoke"

3. **Create a new token:**
   - Click "Add API Token"
   - Name: "Production Website"
   - Permissions: "Editor" (or "Viewer" for read-only)
   - Copy the new token

4. **Update .env.local:**

   ```bash
   SANITY_API_TOKEN=<new_token_here>
   ```

5. **Update production environment:**
   - Add the new token to your hosting platform (Vercel/Netlify/etc.)

---

## 🌐 API Endpoints Using Sanity

Your website has these API routes that fetch from Sanity:

### **1. `/api/vehicles`**

```typescript
// Fetches vehicles with filters
GET /api/vehicles?limit=12&featured=true&category=SUV
```

**Parameters:**

- `limit` - Number of results (1-100)
- `category` - Vehicle type
- `featured` - Only featured vehicles
- `brand` - Filter by manufacturer
- `minPrice` / `maxPrice` - Price range

### **2. `/api/health`**

```typescript
// Checks if Sanity connection works
GET /api/health
```

**Response:**

```json
{
  "status": "healthy",
  "services": {
    "sanity": {
      "status": "connected",
      "latency": "45ms"
    }
  }
}
```

---

## 📸 Image Handling

Sanity automatically:

- ✅ Optimizes images
- ✅ Generates responsive sizes
- ✅ Serves via CDN (fast worldwide)
- ✅ Converts to WebP/AVIF

**Usage in Code:**

```typescript
import { urlFor } from '@/lib/sanity'

// Generate image URL with transformations
const imageUrl = urlFor(vehicle.image)
  .width(800)
  .height(600)
  .format('webp')
  .quality(90)
  .url()
```

**CDN URLs:**

```
https://cdn.sanity.io/images/j2t31xge/production/...
```

---

## 🔄 Real-time Updates

Sanity supports **webhooks** for real-time updates:

### Setup Webhook

1. **In Sanity Dashboard:**
   - Go to API → Webhooks
   - Click "Create webhook"

2. **Configure:**

   ```
   Name: Next.js Revalidation
   URL: https://your-website.com/api/revalidate
   Trigger: On create, update, delete
   Dataset: production
   ```

3. **Create revalidate endpoint:**

   ```typescript
   // app/api/revalidate/route.ts
   export async function POST(request: Request) {
     revalidatePath('/vehicles')
     return Response.json({ revalidated: true })
   }
   ```

---

## 🧪 Testing Sanity Connection

### **Test in Development:**

```bash
# Start website
npm run dev

# Test health endpoint
curl http://localhost:3000/api/health

# Test vehicles endpoint
curl http://localhost:3000/api/vehicles?limit=5
```

### **Expected Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-10-13T...",
  "services": {
    "sanity": {
      "status": "connected",
      "latency": "52ms",
      "projectId": "j2t31xge",
      "dataset": "production"
    }
  }
}
```

---

## 🚀 Deployment Checklist

Before deploying:

- [ ] **Revoke exposed API token**
- [ ] **Create new API token**
- [ ] **Update environment variables in hosting platform**
- [ ] **Test Sanity connection in production**
- [ ] **Add content in Sanity Studio**
- [ ] **Deploy Sanity Studio (optional)**

---

## 📚 GROQ Query Examples

GROQ is Sanity's query language (like SQL for Sanity):

### **Get all vehicles:**

```groq
*[_type == "vehicle"]
```

### **Get featured vehicles:**

```groq
*[_type == "vehicle" && featured == true]
```

### **Get vehicles by category:**

```groq
*[_type == "vehicle" && category == "SUV"]
```

### **Get vehicle with images:**

```groq
*[_type == "vehicle"]{
  _id,
  title,
  price,
  images[]{
    asset->{url}
  }
}
```

### **Search vehicles:**

```groq
*[_type == "vehicle" && title match "Toyota*"]
```

---

## 🆘 Troubleshooting

### **Problem: "Cannot connect to Sanity"**

**Solution:**

1. Check `.env.local` has correct project ID
2. Verify API token is valid
3. Test with: `npm run dev` → visit `/api/health`

### **Problem: "No vehicles showing"**

**Solution:**

1. Open Sanity Studio: `npm run sanity`
2. Add at least one vehicle
3. Refresh website

### **Problem: "Images not loading"**

**Solution:**

1. Check image URLs in Sanity Studio
2. Verify images are uploaded to Sanity
3. Check browser console for CORS errors

### **Problem: "Slow API responses"**

**Solution:**

1. Enable CDN in client config: `useCdn: true`
2. Add caching to API routes
3. Use image transformations to reduce size

---

## 📞 Support & Resources

**Sanity Documentation:**

- Main Docs: <https://www.sanity.io/docs>
- GROQ Syntax: <https://www.sanity.io/docs/groq>
- Image URLs: <https://www.sanity.io/docs/image-url>

**Your Project:**

- Dashboard: <https://www.sanity.io/manage/personal/project/j2t31xge>
- Studio: <http://localhost:3333> (local)

**Need Help?**

- Sanity Slack: <https://slack.sanity.io>
- GitHub Issues: Check project issues

---

## ✅ Summary: Is Everything Configured?

**YES! ✅ Your Sanity setup is complete:**

✅ Client configured (`lib/sanity.ts`)  
✅ 5 schemas defined (`schemas/*.ts`)  
✅ Studio configured (`sanity.config.ts`)  
✅ Environment variables set (`.env.local`)  
✅ API routes working (`/api/vehicles`, `/api/health`)  
✅ Image optimization configured  
✅ Dynamic imports for build compatibility  

**⚠️ Only Action Needed:**

- Revoke and replace the exposed API token (see SECURITY_NOTICE.md)

**Ready to Deploy! 🚀**
