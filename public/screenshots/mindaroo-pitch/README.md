# Mindaroo Pitch Screenshots

Screenshots of **existing JusticeHub platform pages** for Mindaroo Foundation pitch materials.

---

## 📁 Structure

```
/public/screenshots/mindaroo-pitch/
└── platform/
    ├── CAPTURE_CHECKLIST.md          ← Start here! Complete capture guide
    ├── EXISTING_PAGES_SCREENSHOTS.md  ← Full list with URLs
    ├── README.md (old)
    └── [screenshots go here]
```

---

## 🚀 Quick Start

### Option 1: Capture the Essential 7 (15 minutes)

These 7 screenshots provide all core evidence for the pitch:

```bash
# 1. Start dev server
PORT=4000 npm run dev

# 2. Visit and screenshot these URLs:
http://localhost:4000/                                    # Homepage
http://localhost:4000/community-programs                  # 521 programs
http://localhost:4000/stories                            # 38+ stories
http://localhost:4000/centre-of-excellence/map           # Global map
http://localhost:4000/admin                              # Admin dashboard
http://localhost:4000/admin/stories/new                  # Story editor
http://localhost:4000/wiki/mindaroo-pitch/one-pager      # One-pager (with 5 visualizations)
```

### Option 2: Complete Platform Documentation (2-3 hours)

Capture all 51 screenshots following the checklist:

```bash
open /Users/benknight/Code/JusticeHub/public/screenshots/mindaroo-pitch/platform/CAPTURE_CHECKLIST.md
```

---

## 📸 Screenshot Specs

- **Resolution**: 1920×1080px (standard desktop)
- **Format**: PNG
- **File size**: < 500KB each (optimize with TinyPNG)
- **Browser**: Chrome/Firefox incognito mode
- **State**: Clean, professional, no test data

---

## 📋 What's Included

### Public Pages (33 screenshots)
- Homepage, Programs, Stories, Blog, Services
- Organizations, People, Centre of Excellence
- Art & Innovation, Community Map, Gallery
- About, Transparency, Roadmap, Contact
- Visuals section (5 pages)

### Admin Pages (14 screenshots)
- Dashboard, Blog, Stories, Programs, Services
- Organizations, Profiles, Media Library
- Auto-linking, Empathy Ledger, Art & Innovation

### Wiki/Documentation (6 screenshots)
- Mindaroo pitch hub and all 5 pitch documents
- General wiki homepage

---

## 🎯 Priority Order

**Essential (7)**: Homepage, Programs, Stories, Excellence Map, Admin, Editor, One-pager
**Supporting (12)**: Other content directories and detail pages
**Admin (10)**: All admin/CMS capabilities
**Documentation (6)**: Wiki and pitch materials
**Complete (16)**: All other existing pages

---

## 💡 Using Screenshots in Pitch

### One-Pager
```jsx
<Image
  src="/screenshots/mindaroo-pitch/platform/platform-programs-list.png"
  alt="JusticeHub platform showing 521 catalogued programs"
  width={1920}
  height={1080}
  className="rounded-lg shadow-lg border-2 border-gray-200"
/>
```

### Strategic Pitch
Add screenshots to "WHAT - The Solution" and "Platform Features" sections

### Budget Breakdown
Use admin screenshots to show platform development value

---

## 📚 Documentation

- **EXISTING_PAGES_SCREENSHOTS.md**: Complete list of all 51 screenshots with URLs and descriptions
- **CAPTURE_CHECKLIST.md**: Interactive checklist for capturing all screenshots
- **docs/MINDAROO_SCREENSHOTS_GUIDE.md**: Original guide (kept for reference)

---

## ✅ Next Steps

1. **Open the checklist**: [platform/CAPTURE_CHECKLIST.md](platform/CAPTURE_CHECKLIST.md)
2. **Start dev server**: `PORT=4000 npm run dev`
3. **Capture Priority 1**: The essential 7 screenshots
4. **Save to folder**: `/public/screenshots/mindaroo-pitch/platform/`
5. **Optimize images**: Use TinyPNG or similar
6. **Add to pitch docs**: Update MDX files with image references

---

**Total Screenshots**: 51 (only existing pages)
**Essential Screenshots**: 7 (can complete in 15-20 minutes)
**Focus**: Real, working features - no mockups or future concepts

**Created**: January 2025
**Updated**: Revised to show only actual existing pages
