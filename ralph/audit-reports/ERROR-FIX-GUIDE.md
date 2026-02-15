# JusticeHub Error Fix Guide

**Compiled:** 2026-01-07
**Source:** 11 audit reports across 48+ pages
**Status:** Comprehensive prioritized fix guide

---

## Executive Summary

This document compiles all errors, broken links, console errors, and issues identified during the JusticeHub full site audit. Issues are categorized by severity and include specific file locations and recommended fixes.

### Issue Count Summary

| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 0 | No blocking production issues |
| HIGH | 7 | Broken functionality, data loading failures |
| MEDIUM | 12 | UX issues, data inconsistencies, SEO gaps |
| LOW | 18 | Cosmetic issues, minor improvements |
| **TOTAL** | **37** | Issues across 48+ pages |

---

## HIGH PRIORITY Issues (Fix Immediately)

### H1. Interventions by State Data Not Loading
**Severity:** HIGH
**Page:** `/youth-justice-report/interventions`
**Report Source:** youth-justice-report.md

**Issue:** Page shows "Loading interventions..." indefinitely. All state counts display as 0.

**Symptoms:**
- "Loading interventions..." message persists
- Coverage by State section shows all 0s
- Hub page shows 1,003 interventions but this page shows 0

**Root Cause:** API/data fetch failing silently

**File Location:** `src/app/youth-justice-report/interventions/page.tsx`

**Recommended Fix:**
1. Check Supabase RLS policies for interventions table
2. Verify API endpoint response
3. Add error handling and user-friendly error message
4. Implement retry logic or fallback state

---

### H2. Organization Slugs Return Null
**Severity:** HIGH
**Page:** `/organizations`
**Report Source:** network-services.md

**Issue:** Many organization links navigate to `/organizations/null` instead of valid detail pages.

**Symptoms:**
- Clicking on organization cards navigates to `/organizations/null`
- Affects potentially 466 of 467 organizations (only Oonchiumpa verified)

**Root Cause:** Missing slug generation for organizations

**File Location:**
- `src/app/organizations/page.tsx` (listing)
- `src/app/organizations/[slug]/page.tsx` (detail)
- Database: organizations table missing slug column or values

**Recommended Fix:**
1. Add slug column to organizations table if missing
2. Generate slugs from organization names (e.g., slugify function)
3. Run migration to populate slugs for all 467 organizations
4. Update organization card links to use slug instead of null

---

### H3. Gallery Detail Pages Return 404
**Severity:** HIGH
**Page:** `/gallery/[id]`
**Report Source:** blog-gallery.md

**Issue:** Gallery listing links to detail pages that don't exist, returning 404.

**Symptoms:**
- Clicking "View" on gallery items navigates to `/gallery/1`, `/gallery/2`, etc.
- These routes return 404: "This page could not be found"

**Root Cause:** Dynamic route not implemented

**File Location:** `src/app/gallery/[id]/page.tsx` (does not exist)

**Recommended Fix:**
1. Create `src/app/gallery/[id]/page.tsx` dynamic route
2. Implement detail page component with media player/viewer
3. Fetch media item by ID from data source
4. Add back navigation to gallery listing

---

### H4. Wiki Dynamic Routes Return 500 Error
**Severity:** HIGH
**Pages:** `/wiki/[slug]` routes
**Report Source:** wiki-content.md

**Issue:** Dynamic wiki routes return server error 500.

**Affected URLs:**
- `/wiki/strategic-overview`
- `/wiki/executive-summary`
- `/wiki/admin-user-guide`
- `/wiki/admin-quick-start`
- `/wiki/admin-routes-complete`
- `/wiki/centre-of-excellence-complete`
- `/wiki/empathy-ledger-full-integration`
- `/wiki/auto-linking-complete`
- `/wiki/three-scenarios-budget`
- `/wiki/mindaroo-strategic-pitch`
- `/wiki/budget-summary`
- `/wiki/justicehub-planning`
- `/wiki/one-page-overview`

**Error Message:**
```
Error: Cannot find module './vendor-chunks/@tanstack.js'
Require stack:
- /Users/benknight/Code/JusticeHub/.next/server/webpack-runtime.js
- /Users/benknight/Code/JusticeHub/.next/server/app/wiki/[slug]/page.js
```

**Root Cause:** Next.js build cache issue with @tanstack dependency

**File Location:**
- `.next/server/app/wiki/[slug]/page.js`
- `src/app/wiki/[slug]/page.tsx`

**Recommended Fix:**
1. Clear build cache: `rm -rf .next`
2. Rebuild: `npm run build`
3. If persists, check @tanstack package versions in package.json
4. May need to upgrade or reinstall @tanstack dependencies

---

### H5. Global Insights Programs Not Loading
**Severity:** HIGH
**Page:** `/centre-of-excellence/global-insights`
**Report Source:** centre-excellence.md

**Issue:** Programs not loading - shows "Loading programs..." and "Showing 0 programs"

**Symptoms:**
- Filter interface renders correctly
- Map placeholder displays
- "Loading programs..." persists
- "Showing 0 programs" displayed

**Root Cause:** Data fetch or API endpoint issue

**File Location:** `src/app/centre-of-excellence/global-insights/page.tsx`

**Recommended Fix:**
1. Check API endpoint for global programs
2. Verify data exists in database
3. Check RLS policies
4. Add error handling and fallback content

---

### H6. Copyright Year Outdated (Site-wide)
**Severity:** HIGH (affects all 48+ pages)
**Pages:** All pages with footer
**Report Source:** All audit reports

**Issue:** Footer displays "© 2024 JusticeHub" instead of "© 2026 JusticeHub"

**File Location:** `src/components/Footer.tsx` (or equivalent footer component)

**Recommended Fix:**
```tsx
// Change from:
© 2024 JusticeHub
// To:
© {new Date().getFullYear()} JusticeHub
// Or simply:
© 2026 JusticeHub
```

---

### H7. Sidebar Chat Link Broken
**Severity:** HIGH
**Page:** Youth Justice Report sidebar
**Report Source:** youth-justice-report.md

**Issue:** "Ask ALMA About This Report" links to `/chat` (404) instead of `/youth-justice-report/chat`

**File Location:** Youth Justice Report sidebar component

**Recommended Fix:**
```tsx
// Change from:
href="/chat"
// To:
href="/youth-justice-report/chat"
```

---

## MEDIUM PRIORITY Issues (Fix This Sprint)

### M1. Evidence Counter Display Inconsistency
**Severity:** MEDIUM
**Page:** `/intelligence/evidence`
**Report Source:** intelligence.md

**Issue:** Header shows "0 studies documented" but 5 evidence items are displayed.

**File Location:** `src/app/intelligence/evidence/page.tsx`

**Recommended Fix:**
- Fix count query to return correct number
- Or update display logic to use actual array length

---

### M2. Hub Historical Inquiries Count Mismatch
**Severity:** MEDIUM
**Page:** `/youth-justice-report`
**Report Source:** youth-justice-report.md

**Issue:** Hub shows "0 Historical Inquiries" but Inquiries page shows 4 inquiries.

**File Location:** `src/app/youth-justice-report/page.tsx`

**Recommended Fix:**
- Fix stats calculation to correctly count inquiries
- Verify data query returns correct results

---

### M3. Video Loading Errors on CONTAINED
**Severity:** MEDIUM
**Pages:** `/contained`, `/contained/about`
**Report Source:** special-pages.md

**Issue:** Multiple videos fail to load from Supabase storage with placeholder URLs.

**Symptoms:**
- Video elements show loading errors
- URLs contain `your-project.supabase.co` placeholder

**File Location:**
- `src/app/contained/page.tsx`
- `src/app/contained/about/page.tsx`

**Recommended Fix:**
1. Upload actual videos to Supabase storage
2. Update video URLs to real storage paths
3. Or remove video placeholders until content ready

---

### M4. Missing Autocomplete Attributes
**Severity:** MEDIUM
**Page:** `/signup`
**Report Source:** events-stewards.md

**Issue:** Password fields missing `autocomplete="new-password"` attribute (browser DOM warning)

**File Location:** Signup form component

**Recommended Fix:**
```tsx
<input
  type="password"
  autocomplete="new-password"
  // ... other props
/>
```

---

### M5. Gallery Page Title Generic
**Severity:** MEDIUM
**Page:** `/gallery`
**Report Source:** blog-gallery.md

**Issue:** Page title is generic "JusticeHub - Empowering..." instead of "Gallery - JusticeHub"

**File Location:** `src/app/gallery/page.tsx`

**Recommended Fix:**
```tsx
export const metadata = {
  title: 'Gallery - JusticeHub',
  description: 'Visual stories of transformation...',
};
```

---

### M6. Missing og:image Tags
**Severity:** MEDIUM
**Pages:** `/blog`, `/gallery`, various special pages
**Report Source:** blog-gallery.md, brand-alignment.md

**Issue:** Social sharing images not defined.

**Recommended Fix:**
1. Create default og:image for each section
2. Add to page metadata:
```tsx
export const metadata = {
  openGraph: {
    images: ['/images/og/gallery.png'],
  },
};
```

---

### M7. Missing Canonical URLs
**Severity:** MEDIUM
**Pages:** `/blog`, `/gallery`
**Report Source:** blog-gallery.md

**Issue:** No canonical URL defined for SEO.

**Recommended Fix:**
```tsx
export const metadata = {
  alternates: {
    canonical: 'https://justicehub.org.au/gallery',
  },
};
```

---

### M8. Loading States Inconsistency
**Severity:** MEDIUM
**Pages:** Multiple pages
**Report Source:** brand-alignment.md

**Issue:** Different loading state presentations across pages.

**Examples:**
- "Loading leadership team..." (Home)
- "Loading AI-discovered services..." (Services)
- "Loading interventions..." (Youth Justice Report)
- "Loading programs..." (Global Insights)

**Recommended Fix:**
1. Create standardized loading component
2. Implement skeleton loaders
3. Apply consistently across all async content

---

### M9. Services Counter Shows 0 During Load
**Severity:** MEDIUM
**Page:** `/services`
**Report Source:** network-services.md

**Issue:** Services counter shows "0" during initial load.

**Recommended Fix:**
- Show skeleton/placeholder instead of "0"
- Or hide count until data loaded

---

### M10. Talent Scout Purple Accent Off-Palette
**Severity:** MEDIUM
**Page:** `/talent-scout`
**Report Source:** brand-alignment.md

**Issue:** Uses purple/magenta gradient not in standard color palette.

**File Location:** `src/app/talent-scout/page.tsx`

**Recommended Fix:**
- Either add purple to approved palette
- Or replace with existing ochre (#FF8231) accent

---

### M11. Evidence Items "Untitled"
**Severity:** MEDIUM
**Page:** `/intelligence/evidence`
**Report Source:** intelligence.md

**Issue:** Evidence database shows items as "Untitled evidence".

**Recommended Fix:**
- Run data enrichment script to populate evidence titles
- Or add title field requirement in data entry

---

### M12. 951 Evidence-Backed = Total Programs
**Severity:** MEDIUM
**Page:** `/intelligence/portfolio`
**Report Source:** intelligence.md

**Issue:** "Evidence-Backed: 951" shows same number as Total Programs (951), which seems incorrect.

**File Location:** `src/app/intelligence/portfolio/page.tsx`

**Recommended Fix:**
- Verify evidence-backed calculation logic
- Should be subset of total programs with actual evidence

---

## LOW PRIORITY Issues (Backlog)

### L1. Minor 404 Resource Errors
**Severity:** LOW
**Pages:** Home, Stories, Network
**Report Source:** core-pages.md, stories.md, network-services.md

**Issue:** Minor 404 errors for non-critical resources (favicon, etc.)

**Recommended Fix:**
- Add favicon.ico to public folder
- Check for other missing assets

---

### L2. CSP Violation for Descript
**Severity:** LOW
**Page:** `/contained`
**Report Source:** special-pages.md

**Issue:** Content Security Policy blocks Descript iframe embedding.

**Recommended Fix:**
- Add Descript to CSP allowed sources in next.config.js
- Or use alternative video embedding solution

---

### L3. Missing Profile Images
**Severity:** LOW
**Page:** `/people`
**Report Source:** network-services.md

**Issue:** Some profiles (e.g., Joe Kwon) display without images.

**Recommended Fix:**
- Add placeholder/default profile image
- Upload missing profile photos

---

### L4. Privacy Policy Date Outdated
**Severity:** LOW
**Page:** `/privacy`
**Report Source:** brand-alignment.md

**Issue:** Shows "Effective Date: January 1, 2024" instead of 2026.

**File Location:** `src/app/privacy/page.tsx`

**Recommended Fix:**
- Update effective date to January 1, 2026

---

### L5. Terms of Service Date Outdated
**Severity:** LOW
**Page:** `/terms`
**Report Source:** brand-alignment.md

**Issue:** Shows "Effective/Last Updated: January 1, 2024".

**File Location:** `src/app/terms/page.tsx`

**Recommended Fix:**
- Update date to January 1, 2026

---

### L6. Roadmap Dates Show 2024/2025
**Severity:** LOW
**Page:** `/roadmap`
**Report Source:** special-pages.md

**Issue:** Feature timelines show 2024/2025 instead of 2026.

**File Location:** `src/app/roadmap/page.tsx` or data source

**Recommended Fix:**
- Update feature timelines to 2026/2027

---

### L7. Talent Scout Program Dates Outdated
**Severity:** LOW
**Page:** `/talent-scout`
**Report Source:** special-pages.md

**Issue:** Program intake dates show 2024.

**Recommended Fix:**
- Update intake dates to 2026

---

### L8. Story Links Use Numeric IDs
**Severity:** LOW
**Page:** `/community-programs`
**Report Source:** network-services.md

**Issue:** Story links go to `/stories/1`, `/stories/2` instead of slugs.

**Recommended Fix:**
- Update to use story slugs for SEO-friendly URLs

---

### L9. 0% Outcomes Data Display
**Severity:** LOW
**Pages:** `/stewards`, `/stewards/impact`
**Report Source:** events-stewards.md

**Issue:** Prominently displays "0% With Outcomes Data" which may undermine confidence.

**Recommended Fix:**
- Either hide until data exists
- Or reframe messaging: "Building outcomes tracking"
- Or run enrichment to populate data

---

### L10. Blog Has No Content
**Severity:** LOW
**Page:** `/blog`
**Report Source:** blog-gallery.md

**Issue:** Empty blog with "No blog posts yet" message.

**Recommended Fix:**
- Seed initial blog content
- Or hide blog from navigation until ready

---

### L11. Empty "Ready to Scale" Section
**Severity:** LOW
**Page:** `/intelligence/portfolio`
**Report Source:** intelligence.md

**Issue:** Shows "No ready-to-scale programs identified yet".

**Recommended Fix:**
- Populate with qualifying program data
- Or provide criteria for programs to qualify

---

### L12. Empty "Underfunded Programs" Section
**Severity:** LOW
**Page:** `/intelligence/portfolio`
**Report Source:** intelligence.md

**Issue:** Shows "No underfunded programs identified yet".

**Recommended Fix:**
- Populate with program data
- Define underfunded criteria

---

### L13. Generic Page Titles
**Severity:** LOW
**Pages:** Various special pages
**Report Source:** brand-alignment.md

**Issue:** Many pages share generic title instead of page-specific.

**Recommended Fix:**
- Add unique metadata to each page

---

### L14. Dev Server CSS/JS Errors
**Severity:** LOW
**Pages:** All pages (dev only)
**Report Source:** Multiple reports

**Issue:** CSS/JS MIME type errors in development mode.

**Assessment:** Development server only, not production concern.

**Recommended Fix:**
- No action needed for production
- Verify production build works correctly

---

### L15. Fast Refresh Warnings
**Severity:** LOW
**Pages:** Various
**Report Source:** core-pages.md

**Issue:** Fast Refresh warnings in development console.

**Assessment:** Development mode only.

**Recommended Fix:**
- No action needed

---

### L16. React DevTools Messages
**Severity:** LOW
**Pages:** All pages (dev only)
**Report Source:** core-pages.md

**Issue:** React DevTools info messages in console.

**Assessment:** Expected in development mode.

**Recommended Fix:**
- No action needed

---

### L17. Network Page Initial Loading State
**Severity:** LOW
**Page:** `/network`
**Report Source:** network-services.md

**Issue:** "Loading network..." visible briefly before data loads.

**Recommended Fix:**
- Implement skeleton loader
- Or optimize initial data fetch

---

### L18. CONTAINED About Background Image 404
**Severity:** LOW
**Page:** `/contained/about`
**Report Source:** special-pages.md

**Issue:** 404 errors for background image resources.

**Recommended Fix:**
- Upload missing background images
- Or update paths to correct locations

---

## Fix Priority Matrix

### Recommended Fix Order

1. **Quick Wins (< 1 hour each)**
   - H6: Copyright year update
   - H7: Sidebar chat link fix
   - L4-L7: Date updates
   - M4: Autocomplete attributes

2. **Data Fixes (1-2 hours each)**
   - H1: Interventions data loading
   - H5: Global Insights data loading
   - M1-M2: Counter inconsistencies
   - M11: Evidence titles enrichment

3. **New Feature Development (2-4 hours each)**
   - H3: Gallery detail pages
   - H2: Organization slug generation

4. **Build/Infrastructure (Variable)**
   - H4: Wiki dynamic routes build fix

5. **Content Updates (Ongoing)**
   - M3: Video uploads
   - L10: Blog content
   - L3: Profile images

---

## Testing Checklist

After implementing fixes, verify:

- [ ] All pages load without console errors
- [ ] All links navigate to correct destinations
- [ ] Data loads correctly on all pages
- [ ] Copyright shows 2026
- [ ] Dates show 2026 where applicable
- [ ] Gallery detail pages work
- [ ] Organization detail pages work
- [ ] Wiki dynamic routes work
- [ ] Loading states display consistently
- [ ] Meta tags are page-specific
- [ ] Social sharing previews correct

---

## Files Most Frequently Mentioned

| File | Issue Count | Priority |
|------|-------------|----------|
| Footer component | 1 (all pages) | HIGH |
| `src/app/youth-justice-report/interventions/page.tsx` | 1 | HIGH |
| `src/app/gallery/[id]/page.tsx` | 1 (needs creation) | HIGH |
| `src/app/wiki/[slug]/page.tsx` | 1 | HIGH |
| `src/app/organizations/page.tsx` | 1 | HIGH |
| `src/app/centre-of-excellence/global-insights/page.tsx` | 1 | HIGH |
| Various metadata exports | Multiple | MEDIUM |
| Various date strings | Multiple | LOW |

---

*Error Fix Guide compiled from 11 audit reports by Ralph Wiggum Methodology*
*Generated: 2026-01-07*
