# JusticeHub Inconsistencies Report

**Generated:** January 2026
**Status:** Pre-Launch Audit

---

## Executive Summary

Reviewed all major pages and found **32 inconsistencies** across the platform:
- **8 Critical** (broken functionality, security, data accuracy)
- **12 Medium** (maintainability, UX consistency)
- **12 Low** (styling, minor improvements)

---

## CRITICAL ISSUES (Fix Before Launch)

### 1. Broken Link: `/accessibility` page doesn't exist
**Location:** `src/components/navigation/Footer.tsx:98`
**Impact:** 404 error for users
**Fix:** Create accessibility page or remove link

### 2. About Page Shows Wrong Statistics
**Location:** `src/app/about/page.tsx:40-78`
**Problem:** API returns `programs_documented` but code reads `stats.interventions`
**Impact:** Shows hardcoded defaults (1000, 500, 450) instead of real data
**Fix:** Update field names to match API response

### 3. Conflicting Recidivism Statistics
**Locations:**
- Homepage: "15.5% success rate (84.5% reoffend)"
- About page: "70% recidivism rate" AND "15.5%" in different sections
**Impact:** Undermines credibility
**Fix:** Standardize to one consistent figure with source citation

### 4. Missing API Route
**Location:** `src/app/community-programs/[id]/page.tsx:75`
**Problem:** Fetches from `/api/programs/[id]/profiles` which doesn't exist
**Impact:** Profiles section always empty
**Fix:** Create the API route or update to use Supabase directly

### 5. Wrong Supabase Import
**Location:** `src/app/community-programs/[id]/page.tsx:22`
**Problem:** Imports from `@supabase/supabase-js` instead of `@/lib/supabase/client`
**Impact:** May cause auth issues, inconsistent with rest of codebase
**Fix:** Change import to `@/lib/supabase/client`

### 6. Broken Back Link on People Detail
**Location:** `src/app/people/[slug]/page.tsx`
**Problem:** "Back" button links to `/art-innovation` instead of `/people`
**Fix:** Update link href

### 7. Security: Unprotected Intelligence Data
**Location:** `src/app/stories/intelligence/page.tsx`
**Problem:** Admin-level data visible without authentication
**Fix:** Add auth check or move to `/admin/intelligence`

### 8. Role Field Inconsistency (Database)
**Problem:** Three different field names for person's role:
- `role` (most tables)
- `role_title` (coe_key_people)
- `role_at_org` (partner_storytellers)
**Impact:** Frontend needs fallback logic, data may not display
**Fix:** Standardize to `role` everywhere (migration planned)

---

## MEDIUM PRIORITY ISSUES

### Navigation & Links

| Issue | Location | Problem |
|-------|----------|---------|
| Talent Scout confusion | Footer + Header | Different URLs and names for same feature |
| `/youth-justice-report/interventions` broken | CoE pages | Should be `/intelligence/interventions` |
| `/network` doesn't exist | Navigation config | Referenced but no page |
| Missing admin routes | Programs admin | Edit page and people management links broken |

### Data & API

| Issue | Location | Problem |
|-------|----------|---------|
| Hardcoded basecamps | `about/page.tsx:542-562` | Should use `basecampLocations` from content file |
| Hardcoded CoE stats | `centre-of-excellence/page.tsx` | Should query database |
| Placeholder videos | Community programs | Rick Roll URL `dQw4w9WgXcQ` |
| Placeholder images | Community programs | `/api/placeholder/800/600` |

### Architecture

| Issue | Location | Problem |
|-------|----------|---------|
| Multiple dashboard pages | Intelligence section | 3 pages serve as "dashboards" |
| Inconsistent data fetching | CoE pages | Mix of client-side, server-side, hardcoded |
| Knowledge graph custom nav | `/intelligence/knowledge` | Uses overlay instead of Navigation component |
| No loading states | About page, list pages | No visual feedback during fetch |

---

## LOW PRIORITY ISSUES (Polish)

### Styling Inconsistencies

| Issue | Location |
|-------|----------|
| 6 different gradient patterns | CoE section |
| Mixed card styling | `data-card` vs `border-2 border-black` |
| Different badge colors | Section identifiers |
| Mixed button classes | `cta-primary` vs explicit Tailwind |
| Mixed heading classes | `headline-truth` vs `text-4xl font-black` |

### Mobile Menu vs Desktop

| Issue | Location |
|-------|----------|
| About link styled differently | Desktop: text link, Mobile: bordered card |
| Duplicate navigation config | Items maintained in two places |

### Missing Features

| Feature | Location |
|---------|----------|
| `/admin/profiles/new` | Add Profile button leads to 404 |
| `/admin/programs/[id]` | Edit program page |
| `/admin/programs/[id]/people` | Program team management |
| Empty state handling | Bio, articles, stories sections |

---

## PAGES STATUS

| Page | Status | Critical Issues |
|------|--------|-----------------|
| Homepage (`/`) | OK | None |
| About (`/about`) | ISSUES | Wrong stats, hardcoded basecamps |
| Community Programs (`/community-programs`) | ISSUES | Placeholder media, missing API |
| Program Detail (`/community-programs/[id]`) | ISSUES | Wrong import, broken profiles |
| People (`/people`) | OK | Minor styling |
| People Detail (`/people/[slug]`) | ISSUES | Broken back link |
| Intelligence Hub (`/intelligence`) | ISSUES | Multiple entry points |
| Intelligence Chat (`/intelligence/chat`) | OK | None |
| Intelligence Map (`/intelligence/map`) | OK | None |
| Knowledge Graph (`/intelligence/knowledge`) | ISSUES | Custom nav overlay |
| CoE Main (`/centre-of-excellence`) | ISSUES | Hardcoded stats |
| CoE Best Practice | OK | None |
| CoE Global Insights | OK | None |
| CoE Research | OK | None |
| CoE People | ISSUES | Role field fallback |
| Organizations (`/organizations/[slug]`) | OK | None |
| Footer | ISSUES | Broken /accessibility link |
| Admin Dashboard | OK | None |
| Admin Programs | ISSUES | Broken edit/people links |
| Admin Profiles | ISSUES | Missing /new page |

---

## RECOMMENDED FIX ORDER

### Before Launch (Day 1)
1. Fix `/accessibility` link in footer
2. Fix About page API field names
3. Standardize recidivism statistic
4. Fix people detail back link

### This Week
5. Fix community-programs Supabase import
6. Create missing API route or update fetch
7. Replace placeholder videos/images
8. Add auth to stories/intelligence

### Next Sprint
9. Role field standardization migration
10. Create missing admin pages
11. Standardize CoE data fetching
12. Consolidate Intelligence dashboards

---

## Files Needing Changes

| Priority | File | Changes Needed |
|----------|------|----------------|
| P1 | `src/components/navigation/Footer.tsx` | Remove/fix accessibility link |
| P1 | `src/app/about/page.tsx` | Fix API field names, use basecampLocations |
| P1 | `src/app/people/[slug]/page.tsx` | Fix back link |
| P2 | `src/app/community-programs/[id]/page.tsx` | Fix import, update profiles fetch |
| P2 | `src/app/stories/intelligence/page.tsx` | Add auth check |
| P3 | `src/app/centre-of-excellence/page.tsx` | Dynamic stats |
| P3 | Multiple admin pages | Create missing routes |

---

*Report generated from automated page review. See `/Users/benknight/Code/JusticeHub/.claude/cache/agents/scout/` for detailed analysis files.*
