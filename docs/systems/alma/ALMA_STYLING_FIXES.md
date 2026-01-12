# ALMA Styling & Integration Fixes
**Date**: January 1, 2026
**Issue**: ALMA pages disconnected from JusticeHub design system

---

## Problems Identified

### 1. **Missing Navigation** ❌
- ALMA pages have no header/navigation
- No connection to main JusticeHub site
- User can't get back to main site

### 2. **Wrong Color Palette** ❌
- Using generic "ochre-600", "sand-50" that don't exist in Tailwind config
- Should use JusticeHub's black/white/accent-red system
- Or define proper ACT brand colors in Tailwind

### 3. **Text Readability Issues** ❌
- Likely caused by missing/undefined color classes
- Background colors may not be rendering

### 4. **Data Showing as 0** ❌
- Stats showing 0 interventions, 0 evidence, etc.
- Could be Supabase query issue or environment config

### 5. **Styling Inconsistency** ❌
- Not using JusticeHub utilities (`container-justice`, `section-padding`, etc.)
- Custom standalone headers instead of using Navigation component
- Gradient backgrounds that don't match JusticeHub's bold, minimal aesthetic

---

## Solutions Implemented

### ✅ 1. Added Layout with Navigation
**File**: `/src/app/intelligence/layout.tsx`
- Wraps all `/intelligence/*` pages with `<Navigation />` and `<Footer />`
- Ensures consistent header across all ALMA pages

### ✅ 2. Added Intelligence to Navigation Menu
**File**: `/src/components/ui/navigation.tsx`
- Added "Intelligence Hub" to Centre of Excellence dropdown
- Description: "ALMA intelligence & portfolio analytics"
- Links to `/intelligence`

---

## Fixes Still Needed

### 3. Update Page Styling
Need to update these pages to use JusticeHub design system:

**Files to fix**:
- `/src/app/intelligence/page.tsx` (hub)
- `/src/app/intelligence/interventions/page.tsx` (directory)
- `/src/app/intelligence/interventions/[id]/page.tsx` (detail)
- `/src/app/intelligence/portfolio/page.tsx` (analytics)

**Changes needed**:
- Remove standalone headers (now provided by layout)
- Replace `bg-sand-50` → `bg-white` or `bg-gray-50`
- Replace `bg-ochre-600` → `bg-black` or `bg-accent` (red)
- Replace `text-ochre-600` → `text-black` or `text-accent`
- Use `container-justice` instead of `max-w-7xl mx-auto px-4`
- Use `section-padding` for consistent spacing
- Use `headline-truth` for main headings
- Use `cta-primary` for primary buttons

### 4. Define ACT Brand Colors (Optional)
If we want to keep ochre/sand/eucalyptus:

**File**: `tailwind.config.js`
```javascript
colors: {
  // Add to existing colors:
  'ochre': {
    50: '#FFF9F5',
    100: '#FFF3EB',
    200: '#FFE0CC',
    300: '#FFCDAD',
    400: '#FFA76F',
    500: '#FF8231', // Primary ochre
    600: '#E6752C',
    700: '#BF611D',
    800: '#994E17',
    900: '#7A3E13',
  },
  'sand': {
    50: '#FAF9F7',
    100: '#F5F3F0',
    200: '#EBE7E0',
    300: '#E1DDD1',
    400: '#CDC8B3',
    500: '#B9B395',
    600: '#A79E7D',
    700: '#8C8368',
    800: '#706853',
    900: '#5A5343',
  },
  'eucalyptus': {
    50: '#F0F9F5',
    100: '#E1F3EB',
    200: '#C3E7D7',
    300: '#A5DBC3',
    400: '#69C39B',
    500: '#2DAB73', // Primary eucalyptus
    600: '#299A68',
    700: '#228056',
    800: '#1C6645',
    900: '#165337',
  },
}
```

### 5. Fix Data Queries
**Issue**: Stats showing 0

**Check**:
1. Verify NEXT_PUBLIC_SUPABASE_URL in `.env.local`
2. Verify NEXT_PUBLIC_SUPABASE_ANON_KEY in `.env.local`
3. Test direct Supabase query:
   ```typescript
   const { data, count } = await supabase
     .from('alma_interventions')
     .select('*', { count: 'exact' });
   console.log('Count:', count);
   ```
4. Check if migrations ran successfully
5. Check if data was actually ingested

---

## Design System Reference

### JusticeHub Utilities
```css
.container-justice  /* Max-width container with padding */
.section-padding    /* Consistent vertical spacing */
.headline-truth     /* Large, bold headings */
.body-truth         /* Body text with proper line-height */
.cta-primary        /* Black button with white text */
.cta-secondary      /* White button with black text */
```

### Color Palette
- **Primary**: Black (`#000000`)
- **Background**: White (`#FFFFFF`)
- **Accent**: Red (`#FF5722`)
- **Secondary**: Gray-50 to Gray-900
- **Text**: Black for primary, Gray-600 for secondary

### Typography
- **Font**: Inter (sans-serif)
- **Headings**: Bold, large, high contrast
- **Body**: 16px, 1.6 line-height, readable

### Tone
- **Bold**: Direct, no fluff
- **Minimal**: Clean, uncluttered
- **Truth-focused**: Data-driven, honest

---

## Next Steps

1. ✅ Layout created
2. ✅ Navigation updated
3. ⏳ Update intelligence hub page styling
4. ⏳ Update interventions directory page styling
5. ⏳ Update intervention detail page styling
6. ⏳ Update portfolio analytics page styling
7. ⏳ Test data queries and fix 0 counts
8. ⏳ Decide on ACT brand colors (keep or replace)
9. ⏳ Test on localhost:3003

---

**Status**: Partially fixed - navigation working, styling needs updates
**Priority**: High - affects user experience and brand consistency
