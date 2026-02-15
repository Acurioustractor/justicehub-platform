# Screenshot Capture Guide

Automated system for capturing screenshots of all JusticeHub platform pages for Mindaroo pitch.

---

## Quick Start

### Option 1: Automated Script (Recommended)
```bash
# 1. Start dev server
PORT=4000 npm run dev

# 2. Run screenshot capture script
./scripts/capture-screenshots.sh
```

The script will:
- Open each page in your browser automatically
- Prompt you to take each screenshot
- Tell you the exact filename to use
- Wait for you to confirm before moving to the next page

### Option 2: Manual Capture
```bash
# 1. Visit the gallery page
open http://localhost:4000/wiki/mindaroo-pitch/screenshots

# 2. Click each "View Live →" link
# 3. Take screenshot of each page
# 4. Save with filename shown below the placeholder
```

---

## Screenshot Specifications

- **Resolution**: 1920×1080px (standard desktop)
- **Format**: PNG
- **Browser**: Chrome/Firefox in incognito mode
- **File size**: Optimize to < 500KB each

### macOS Screenshot Commands
```bash
# Full screen
Cmd + Shift + 3

# Selection/Window
Cmd + Shift + 4, then Space, then click window
```

### Windows Screenshot Commands
```bash
# Snip & Sketch
Win + Shift + S
```

### Linux Screenshot Commands
```bash
# Gnome Screenshot
PrtScn

# or use command
gnome-screenshot --window
```

---

## Where to Save

All screenshots save to:
```
/public/screenshots/mindaroo-pitch/platform/
```

The exact filename for each screenshot is shown in:
1. The automated script
2. Below each placeholder in the gallery
3. The capture checklist

---

## Gallery Page

View and track progress:
```
http://localhost:4000/wiki/mindaroo-pitch/screenshots
```

Features:
- ✅ 6-column grid layout (easy to scan)
- ✅ Clickable "View Live →" links for each page
- ✅ Automatic display when screenshots are added
- ✅ Organized by category (Public, Admin, Wiki, etc.)

---

## Priority Order

### Essential 7 (Start Here - 15 min)
1. Homepage
2. Programs Directory (521 programs)
3. Stories Page (38+ stories)
4. Excellence Map
5. Admin Dashboard
6. Story Editor
7. Mindaroo One-Pager

### Supporting Pages (1 hour)
8-19. All other public content directories

### Admin Pages (30 min)
20-29. All admin/CMS features

### Complete Documentation (30 min)
30-51. All remaining pages

---

## After Capturing

### Optimize Images
```bash
# Use TinyPNG or similar to compress
# Target: < 500KB per file
```

### Verify in Gallery
```bash
# Open gallery
open http://localhost:4000/wiki/mindaroo-pitch/screenshots

# Refresh to see all screenshots appear
```

### Add to Pitch Documents
Screenshots can be embedded in pitch documents using:
```jsx
<Image
  src="/screenshots/mindaroo-pitch/platform/platform-programs-list.png"
  alt="JusticeHub platform showing 521 catalogued programs"
  width={1920}
  height={1080}
  className="rounded-lg shadow-lg border-2 border-gray-200"
/>
```

---

## Troubleshooting

### Script won't run
```bash
# Make it executable
chmod +x ./scripts/capture-screenshots.sh

# Run again
./scripts/capture-screenshots.sh
```

### Server not running
```bash
# Start server on port 4000
PORT=4000 npm run dev

# Wait for "Ready" message, then run script
```

### Images not appearing in gallery
1. Check filenames match exactly (case-sensitive)
2. Ensure files are in `/public/screenshots/mindaroo-pitch/platform/`
3. Refresh the browser page
4. Check browser console for errors

---

## Files Created

### Gallery System
- `/src/app/wiki/mindaroo-pitch/screenshots/page.mdx` - Gallery page (51 screenshots in 6-col grid)
- `/public/screenshots/mindaroo-pitch/platform/` - Screenshot storage folder

### Documentation
- `/public/screenshots/mindaroo-pitch/README.md` - Main guide
- `/public/screenshots/mindaroo-pitch/EXISTING_PAGES_SCREENSHOTS.md` - Complete list with URLs
- `/public/screenshots/mindaroo-pitch/platform/CAPTURE_CHECKLIST.md` - Interactive checklist

### Scripts
- `/scripts/capture-screenshots.sh` - Automated capture script
- `/scripts/README-SCREENSHOTS.md` - This file

---

## Next Steps

1. **Capture Priority 1 screenshots** (7 files, 15 minutes)
2. **Add to gallery folder**
3. **View in gallery** at http://localhost:4000/wiki/mindaroo-pitch/screenshots
4. **Continue with remaining pages** as needed
5. **Optimize all images** with TinyPNG
6. **Embed in pitch documents** where helpful

---

**Total Screenshots**: 51 (all existing pages)
**Essential Screenshots**: 7 (can complete in 15-20 minutes)
**Gallery Layout**: 6 columns × responsive rows
**Status**: Ready to capture!
