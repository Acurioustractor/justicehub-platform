# 📖 Scrollytelling - Quick Start Guide

**Get the story live with images in 30 minutes!**

---

## 🎯 What You Have Now

✅ Complete scrollytelling story at `/stories/the-pattern`
✅ 7 sections with smooth animations
✅ Real ALMA data integrated
✅ JusticeHub branding applied
✅ Responsive design working

**Missing**: Images (currently using placeholders)

---

## 🖼️ Add Images in 3 Steps

### Step 1: Create Images Directory (2 min)

```bash
cd /Users/benknight/Code/JusticeHub
mkdir -p public/images/stories
```

### Step 2: Source & Download Images (15 min)

**Go to [Unsplash](https://unsplash.com)** and download these images:

**1. Crisis Section** - Search "prison fence" or "detention facility"
- Keywords: "barbed wire", "fence", "institutional"
- Look for: Austere, cold, institutional feel
- Download as: `crisis-detention.jpg`
- Treatment: We'll desaturate in code

**2. Community Wisdom** - Search "Aboriginal elder" or "Indigenous Australia ceremony"
- Keywords: "cultural camp", "Indigenous elder", "on country"
- Look for: Respectful, empowering, cultural connection
- Download as: `community-wisdom.jpg`
- **Important**: Check photographer - prioritize Indigenous photographers

**3. Call to Action** - Search "Australian landscape sunrise"
- Keywords: "outback sunrise", "horizon", "hope"
- Look for: Bright, hopeful, future-focused
- Download as: `cta-hope.jpg`

**Alternative**: Use [Pexels](https://pexels.com) or [Wikimedia Commons](https://commons.wikimedia.org)

### Step 3: Update the Code (10 min)

Open `/src/app/stories/the-pattern/page.tsx` and update the placeholder sections:

**Crisis Section** (around line 130):
```tsx
// Replace this:
<div className="relative mb-12 h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="text-center">
      <div className="text-white/20 text-9xl font-bold mb-4">⚖️</div>
      // ...
    </div>
  </div>
</div>

// With this:
<div className="relative mb-12 h-96 rounded-2xl overflow-hidden">
  <Image
    src="/images/stories/crisis-detention.jpg"
    alt="Symbolic representation of detention system"
    fill
    className="object-cover saturate-50" // Desaturated for cold feel
  />
  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16]/80 to-transparent" />
</div>
```

**Community Wisdom** (around line 280):
```tsx
// Replace placeholder with:
<div className="relative mb-12 h-96 rounded-2xl overflow-hidden">
  <Image
    src="/images/stories/community-wisdom.jpg"
    alt="Community cultural connection and wisdom"
    fill
    className="object-cover"
  />
  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16]/60 to-transparent" />
</div>
```

**Call to Action** (around line 480):
```tsx
// Add background image:
<section className="min-h-screen flex items-center justify-center py-20 px-4 relative">
  <Image
    src="/images/stories/cta-hope.jpg"
    alt="Hopeful future horizon"
    fill
    className="object-cover opacity-20"
  />
  <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f16]/90 to-[#0a0f16]/70" />

  <div className="relative z-10 max-w-4xl text-center">
    {/* existing content */}
  </div>
</section>
```

**Add Image Import** at top of file:
```tsx
import Image from 'next/image';
```

---

## 🚀 Test Locally

```bash
npm run dev
```

Visit: `http://localhost:3000/stories/the-pattern`

**Check**:
- ✅ Images load correctly
- ✅ Overlays look good
- ✅ Mobile responsive
- ✅ Animations smooth

---

## 🎨 Image Treatment Guide

### CSS Filters for Mood

**Crisis (Cold, Harsh)**:
```tsx
className="saturate-50 brightness-75 contrast-110"
```

**Community (Warm, Hopeful)**:
```tsx
className="saturate-110 brightness-105"
```

**Call to Action (Bright, Future)**:
```tsx
className="saturate-120 brightness-110"
```

### Overlay Gradients

**Dark to Light** (text on top):
```tsx
<div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] to-transparent" />
```

**Darkened Overall** (readability):
```tsx
<div className="absolute inset-0 bg-[#0a0f16]/70" />
```

**Color Tint** (brand emphasis):
```tsx
<div className="absolute inset-0 bg-gradient-to-br from-[#27ae60]/20 to-transparent" />
```

---

## 📸 Ethical Image Guidelines

### DO ✅

- Use symbolic imagery (landscapes, objects, hands)
- Credit Indigenous photographers when possible
- Focus on hope and strength
- Respectful cultural imagery
- Ask permission for identifiable people
- Use landscape/country imagery
- Abstract/artistic interpretations

### DON'T ❌

- Photos of young people in detention
- Identifying images without consent
- Sacred/ceremonial imagery without permission
- Trauma porn (exploitative)
- Stereotypical "Aboriginal in outback" shots
- Images that perpetuate negative stereotypes

---

## 🎯 Quick Wins

### Option 1: Just 3 Images (Fastest)

Only add images to:
1. Crisis section (detention)
2. Community wisdom (cultural)
3. Call to action (hope)

**Time**: 15 minutes
**Impact**: 80% of visual improvement

### Option 2: All Sections (Complete)

Add images to all 7 sections
**Time**: 30 minutes
**Impact**: 100% visual polish

### Option 3: Gradual Enhancement

Add placeholder gradients now, real images later
**Time**: 5 minutes
**Impact**: Looks professional, buy time for image sourcing

**Example Gradient Placeholder**:
```tsx
<div className="h-96 rounded-2xl bg-gradient-to-br from-[#27ae60]/10 to-[#e57a28]/10" />
```

---

## 🌐 Deploy to Production

Once images are added:

```bash
# Build
npm run build

# Test production build locally
npm run start

# Deploy (if using Vercel)
git add .
git commit -m "feat: add scrollytelling images"
git push origin main
```

Vercel will auto-deploy!

---

## 📊 Next: Add D3.js Visualizations

After images are live, add interactive charts:

1. **Sentiment Timeline** (line chart)
2. **Topic Burst** (bubble chart)
3. **Program Map** (Australia map with pins)

See: `SCROLLYTELLING_VISUAL_STRATEGY.md` for detailed specs

---

## 🎉 You're Done!

You now have:
- ✅ Data-driven scrollytelling story
- ✅ Real ALMA intelligence integrated
- ✅ Emotional narrative arc
- ✅ JusticeHub branding
- ✅ Smooth animations
- ✅ Responsive design
- ✅ (Soon) Professional imagery

**Share it**: `/stories/the-pattern`

**Next story**: "Media vs Reality" - sentiment tracking deep dive

---

**Time to complete**: 30 minutes
**Impact**: High-engagement data storytelling
**Cost**: $0 (free images) to $50 (licensed images)
**ROI**: Infinite ♾️
