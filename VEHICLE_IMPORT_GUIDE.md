# 🚗 Vehicle Import Guide

## ✅ Setup Complete

- ✅ **Sanity Studio**: http://localhost:3333
- ✅ **Website**: http://localhost:3000
- ✅ **Vehicle Data**: `/vehicle-data.js` (7 vehicles ready)
- ✅ **Images**: `/home/behar/Desktop/vehicles/` (organized by folder)

## 🎯 Quick Import Process

### Step 1: Access Sanity Studio

1. **Open browser**: http://localhost:3333
2. **Login** with your Sanity account
3. **Click "Vehicles"** in the left sidebar

### Step 2: Add First Vehicle - Audi Q5 2020

**Data to Enter:**

```
Title: 2020 Audi Q5
Brand: Audi
Model: Q5
Year: 2020
Category: SUV
Featured: ✓ (checked)
Fuel Type: Gasoline
Transmission: Automatic
Description: Luxury SUV with premium features and excellent performance.
```

**Images to Upload:**
- Navigate to: `/home/behar/Desktop/vehicles/audi-q5-2020/`
- Upload: `1.jpg` (main image)
- Gallery: Upload `1.jpg, 2.jpg, 3.jpg, 4.jpg, 5.jpg, 6.jpg, 7.jpg, 8.jpg, 9.jpg, 10.jpg, 11.jpg, 12.jpg, 13.jpg, 14.jpg, 15.jpg`

### Step 3: Repeat for Remaining Vehicles

#### 2️⃣ VW Golf 7 GTD 2017
```
Title: 2017 Volkswagen Golf 7 GTD
Brand: Volkswagen
Model: Golf GTD
Year: 2017
Category: Hatchback
Featured: ☐ (unchecked)
Fuel Type: Diesel
Transmission: Manual
Description: Sporty diesel hatchback with excellent fuel economy and performance.
Images: /home/behar/Desktop/vehicles/golf-7-gtd-2017/ (14 images)
```

#### 3️⃣ Peugeot 3008 Premium 2018
```
Title: 2018 Peugeot 3008 Premium
Brand: Peugeot
Model: 3008 Premium
Year: 2018
Category: SUV
Featured: ✓ (checked)
Fuel Type: Gasoline
Transmission: Automatic
Description: Modern SUV with premium trim and advanced technology features.
Images: /home/behar/Desktop/vehicles/peugeot-3008-premium-2018/
```

#### 4️⃣ Škoda Superb 2018
```
Title: 2018 Škoda Superb
Brand: Škoda
Model: Superb
Year: 2018
Category: Sedan
Featured: ☐ (unchecked)
Fuel Type: Gasoline
Transmission: Automatic
Description: Spacious and comfortable sedan with excellent value for money.
Images: /home/behar/Desktop/vehicles/skoda-superb-2018/
```

#### 5️⃣ Škoda Superb 2020
```
Title: 2020 Škoda Superb
Brand: Škoda
Model: Superb
Year: 2020
Category: Sedan
Featured: ✓ (checked)
Fuel Type: Gasoline
Transmission: Automatic
Description: Latest generation Superb with updated design and technology.
Images: /home/behar/Desktop/vehicles/skoda-superb-2020/
```

#### 6️⃣ Škoda Superb 2020 Pro
```
Title: 2020 Škoda Superb Pro
Brand: Škoda
Model: Superb Pro
Year: 2020
Category: Sedan
Featured: ✓ (checked)
Fuel Type: Gasoline
Transmission: Automatic
Description: Premium trim Superb with additional luxury features and equipment.
Images: /home/behar/Desktop/vehicles/skoda-superb-2020-pro/
```

#### 7️⃣ VW Passat B8 2016
```
Title: 2016 Volkswagen Passat B8
Brand: Volkswagen
Model: Passat B8
Year: 2016
Category: Sedan
Featured: ☐ (unchecked)
Fuel Type: Diesel
Transmission: Automatic
Description: Reliable and comfortable sedan from Volkswagen's B8 generation.
Images: /home/behar/Desktop/vehicles/vw-passat-b8-2016/
```

## 📸 Image Upload Tips

1. **Main Image**: Use `1.jpg` from each folder as the main/featured image
2. **Gallery**: Upload all remaining images (2.jpg, 3.jpg, etc.)
3. **Order**: Sanity will maintain the upload order
4. **Format**: All images are already .jpg format (compatible)

## ✅ Verification Steps

After adding each vehicle:

1. **Save** in Sanity Studio
2. **Check website**: http://localhost:3000/vehicles
3. **Verify API**: http://localhost:3000/api/vehicles

## 🚀 Expected Result

After completing all imports:

- **7 new vehicles** in your dealership
- **4 featured vehicles** on homepage (Audi Q5, Peugeot 3008, Škoda Superb 2020, Škoda Superb 2020 Pro)
- **Full image galleries** for each vehicle
- **Automatic SEO-friendly URLs** (e.g., `/vehicles/2020-audi-q5`)

## 🔄 Auto-Sync

Changes in Sanity Studio appear instantly on your website - no rebuild needed!

## 💡 Pro Tips

- **Batch Upload**: Select multiple images at once for gallery
- **Preview**: Use Sanity's preview feature to see changes
- **Reorder**: Drag images to reorder in gallery
- **Duplicate**: Copy similar vehicles and edit details

## 🆘 Need Help?

If you encounter issues:

1. **Sanity Studio not loading**: Check http://localhost:3333
2. **Images not uploading**: Check file permissions in `/home/behar/Desktop/vehicles/`
3. **Website not updating**: Check http://localhost:3000/api/health
4. **Missing data**: Reference `/vehicle-data.js` for complete details

---

**Ready to start? Open http://localhost:3333 and begin with the Audi Q5 2020! 🚀**