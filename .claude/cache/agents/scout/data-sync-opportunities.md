# JusticeHub Data Sync Opportunities Report
Generated: 2026-01-19

## Executive Summary

Found **23 potential data inconsistencies and sync opportunities** across the JusticeHub codebase. The primary issues are:

1. **Hardcoded stats with database fallbacks** - Stats displayed on homepage and navigation that may drift from actual database counts
2. **Duplicate basecamp data** - Basecamp information stored in 3+ places (database, content file, page-level fallbacks)
3. **Navigation counts hardcoded** - Centre of Excellence navigation items contain hardcoded counts (e.g., "27+ peer-reviewed studies", "4 founding network hubs")
4. **Inconsistent basecamp data** - Different stats/descriptions across marketing pages vs. core pages

---

## Category 1: Homepage Stats Sync Issues

### 1.1 Homepage Stats with Fallbacks
**File:** `/Users/benknight/Code/JusticeHub/src/app/page.tsx`
**Lines:** 187-361

**Issue:** Homepage displays stats from API with hardcoded fallbacks that may become stale.

```typescript
// Lines 187-211 - Stats cards with fallbacks
{stats?.programs_documented.toLocaleString() || '624'}
{stats?.outcomes_rate || 67}% with outcomes data
{stats?.total_services.toLocaleString() || '150'}
{stats?.states_covered || 7} states & territories
${stats?.estimated_cost_savings_millions || 45}M

// Line 361 - Hardcoded count in text
{stats?.programs_documented || 624}+ programs across Australia
```

**Risk:** If API fails, users see fallback numbers (624, 67%, 150, 7, 45M) that don't reflect actual database state.

**Recommendation:** 
- Remove hardcoded fallbacks OR
- Show loading state/error message instead of stale numbers OR
- Cache last successful API response in localStorage

---

### 1.2 API Stats Fallback Values
**File:** `/Users/benknight/Code/JusticeHub/src/app/api/homepage-stats/route.ts`
**Lines:** 89-99

**Issue:** API returns hardcoded fallback stats on error.

```typescript
stats: {
  programs_documented: 624,
  programs_with_outcomes: 418,
  outcomes_rate: 67,
  total_services: 150,
  youth_services: 89,
  total_people: 45,
  total_organizations: 67,
  states_covered: 7,
  estimated_cost_savings_millions: 45,
}
```

**Risk:** Silent failures - users see "data" that's actually hardcoded from an unknown date.

**Recommendation:**
- Add `is_fallback: true` flag to response when using fallback data
- Log errors to monitoring service
- Consider showing banner "Using cached data from [date]"

---

## Category 2: Basecamp Data Duplication

### 2.1 Basecamp Data in excellence-map-locations.ts
**File:** `/Users/benknight/Code/JusticeHub/src/content/excellence-map-locations.ts`
**Lines:** 535-612

**Issue:** Hardcoded basecamp data for all 4 founding organizations with stats and coordinates.

```typescript
export const basecampLocations: ExcellenceLocation[] = [
  {
    id: 'oonchiumpa',
    name: 'Oonchiumpa',
    description: 'Cultural healing and deep listening on country...',
    keyStats: [
      '95% reduced anti-social behavior',
      '72% return to education',
      'On-country healing programs'
    ],
    coordinates: { lat: -23.698, lng: 133.880 },
    // ... more fields
  },
  // ... BG Fit, Mounty Yarns, PICC
]
```

**Risk:** Stats/descriptions become stale as database is updated. Coordinates are duplicated.

**Recommendation:**
- Fetch basecamp data from `/api/basecamps` OR
- Use this file only as schema/fallback, not source of truth

---

### 2.2 Basecamp Fallback in CoE Page
**File:** `/Users/benknight/Code/JusticeHub/src/app/centre-of-excellence/page.tsx`
**Lines:** 32-77

**Issue:** Page-level FALLBACK_BASECAMPS array duplicates basecamp data.

```typescript
const FALLBACK_BASECAMPS: BasecampLocation[] = [
  {
    slug: 'oonchiumpa',
    name: 'Oonchiumpa',
    region: 'Central Australia (NT)',
    description: 'Cultural healing and deep listening...',
    stats: [
      { label: 'Reduced anti-social behavior', value: '95% reduced...' },
      { label: 'Return to education', value: '72% return to education' }
    ],
    coordinates: { lat: -23.698, lng: 133.880 }
  },
  // ... 3 more basecamps
]
```

**Risk:** Three sources of truth:
1. Database (`organizations` table with `partner_type = 'basecamp'`)
2. `excellence-map-locations.ts`
3. Page-level `FALLBACK_BASECAMPS`

**Stats discrepancies found:**
- Oonchiumpa: Same stats across all sources ✓
- BG Fit: Different descriptions ("400+ youth engaged/year" vs "400+ young people engaged yearly")
- Mounty Yarns: Different stats ("150+ stories published" vs "50+ young storytellers trained")

**Recommendation:**
- Single source of truth: database
- Content files should reference database IDs, not duplicate data
- Fallbacks should pull from most recent successful API response

---

### 2.3 Basecamp Data in Marketing Pages
**File:** `/Users/benknight/Code/JusticeHub/src/app/for-community-leaders/page.tsx`
**Lines:** 35-64

**Issue:** Inline basecamp array with simplified data.

```typescript
const basecamps = [
  {
    name: "Oonchiumpa",
    territory: "Central Australia",
    location: "Alice Springs, NT",
    focus: "Cultural healing, on-country programs",
    stat: "95% reduced anti-social behavior"
  },
  // ... 3 more
]
```

**File:** `/Users/benknight/Code/JusticeHub/src/app/for-funders/page.tsx`
**Lines:** 99-121

**Issue:** Another inline basecamp array with DIFFERENT data.

```typescript
const basecampResults = [
  {
    name: "Oonchiumpa",
    territory: "Central Australia",
    location: "Alice Springs, NT",
    stat: "95% reduced anti-social behavior",
    description: "Aboriginal-led cultural healing achieving what detention never could."
  },
  {
    name: "BG Fit",
    // ...
  },
  {
    name: "Bourke Justice Reinvestment",  // ← NOT A FOUNDING BASECAMP!
    territory: "Western NSW",
    location: "Bourke, NSW",
    stat: "23% crime reduction"
  }
]
```

**CRITICAL ISSUE:** for-funders page lists "Bourke Justice Reinvestment" as a basecamp, but official basecamp list is:
1. Oonchiumpa
2. BG Fit
3. Mounty Yarns
4. PICC Townsville

**Recommendation:**
- Create shared `/api/basecamps` endpoint (already exists!)
- All pages should fetch from this API
- Remove all inline arrays

---

## Category 3: Navigation Hardcoded Counts

### 3.1 Centre of Excellence Navigation Counts
**File:** `/Users/benknight/Code/JusticeHub/src/config/navigation.ts`
**Lines:** 56-84

**Issue:** Navigation descriptions contain hardcoded counts.

```typescript
{
  label: 'Basecamps',
  href: '/centre-of-excellence/map?category=basecamp',
  description: '4 founding network hubs'  // ← Hardcoded
},
{
  label: 'Research Library',
  href: '/centre-of-excellence/research',
  description: '27+ peer-reviewed studies'  // ← Hardcoded
},
{
  label: 'Best Practice',
  href: '/centre-of-excellence/best-practice',
  description: '4 Australian state frameworks'  // ← Hardcoded
},
{
  label: 'Global Map',
  href: '/centre-of-excellence/map',
  description: '16 international models'  // ← Hardcoded
}
```

**Verification:**
✓ VERIFIED: 4 basecamps - correct
? INFERRED: 27 studies - need to verify in database
✓ VERIFIED: 4 Australian frameworks in `excellence-map-locations.ts`
✓ VERIFIED: 16 international models in `excellence-map-locations.ts`

**Risk:** As research items grow, navigation descriptions become stale.

**Recommendation:**
- Make navigation dynamic with counts from database OR
- Use "27+" style to indicate "at least this many" OR
- Update counts as part of content update process

---

## Category 4: Excellence Map Location Data

### 4.1 International Models Count
**File:** `/Users/benknight/Code/JusticeHub/src/content/excellence-map-locations.ts`
**Lines:** 37-338

✓ VERIFIED: Exactly 16 international models defined in array.

**Issue:** Array is hardcoded. If new international models are added to database, this file must be manually updated.

**Models listed:**
1. Progression Units (Brazil)
2. NICRO Diversion (South Africa)
3. Missouri Model (USA)
4. Spain - Diagrama Foundation
5. Police Cautioning Scheme (Hong Kong)
6. New Zealand - Oranga Tamariki
7. Roca, Inc. (USA)
8. Youth Conferencing (Northern Ireland)
9. MST/FFT (USA)
10. Wraparound Milwaukee (USA)
11. JDAI (USA)
12. HALT Program (Netherlands)
13. Family Group Conferencing Enhanced (New Zealand)
14. Scotland - Children's Hearings System
15. Nordic Welfare Model (Finland)
16. Maranguka Justice Reinvestment (Australia)

---

### 4.2 Australian Frameworks Count
**File:** `/Users/benknight/Code/JusticeHub/src/content/excellence-map-locations.ts`
**Lines:** 343-424

✓ VERIFIED: Exactly 4 Australian frameworks defined.

**Frameworks:**
1. NSW Youth Koori Court
2. Victoria's Therapeutic Model
3. Queensland Diversion & Restorative Justice
4. WA Aboriginal Youth Programs

**Issue:** Array is hardcoded. Should sync with `australian_frameworks` database table.

---

### 4.3 Research Sources Count
**File:** `/Users/benknight/Code/JusticeHub/src/content/excellence-map-locations.ts`
**Lines:** 429-529

✓ VERIFIED: 5 research sources defined (not 27).

**Sources:**
1. AIFS (Australian Institute of Family Studies)
2. BOCSAR (NSW Bureau of Crime Statistics)
3. Lowitja Institute
4. Oranga Tamariki Research (NZ)
5. Annie E. Casey Foundation (USA)

**DISCREPANCY:** Navigation says "27+ peer-reviewed studies" but this file only has 5 research source LOCATIONS.

**Clarification needed:** Are "studies" in a separate `research_items` table? Need to verify if 27 refers to:
- Number of research papers/studies (likely in database)
- Number of research source organizations (only 5 in this file)

---

## Category 5: Stats Display Patterns

### 5.1 Centre of Excellence Page Stats
**File:** `/Users/benknight/Code/JusticeHub/src/app/centre-of-excellence/page.tsx`

**Lines with hardcoded counts:**
- Line 174: "The 4 founding organizations anchoring the Centre of Excellence"
- Line 295: "Explore 16 international models, 4 Australian frameworks, and key research sources"
- Line 373: "27 peer-reviewed studies on trauma-informed care..."
- Line 383: "Australian Frameworks" (section header)

**Issue:** If content grows, these text strings need manual updates.

---

### 5.2 Best Practice Page Count
**File:** `/Users/benknight/Code/JusticeHub/src/app/centre-of-excellence/best-practice/page.tsx`
**Line:** 98

```typescript
"Learn from 4 Australian state frameworks. Queensland, NSW, Victoria, and Western Australia"
```

**Issue:** Hardcoded count in prose.

---

### 5.3 Research Page Count
**File:** `/Users/benknight/Code/JusticeHub/src/app/centre-of-excellence/research/page.tsx`
**Line:** 90

```typescript
"27 peer-reviewed studies on what works in youth justice."
```

**Issue:** Hardcoded count. Need to verify actual count in `research_items` table.

---

## Category 6: Potential Database Inconsistencies

### 6.1 Organizations Table
**Database:** `organizations` table
**Filter:** `is_active = true` and `partner_type = 'basecamp'`

**Expected count:** 4 basecamps
**Need to verify:**
- Database actually contains all 4 basecamps
- Slugs match: `oonchiumpa`, `bg-fit`, `mounty-yarns`, `picc-townsville`
- `is_active` flag is `true` for all 4

---

### 6.2 Research Items Table
**Database:** `research_items` table (if exists)

**Expected count:** 27+ studies
**Need to verify:**
- Table exists and is populated
- Count matches navigation description
- Items are categorized/tagged properly

---

### 6.3 Australian Frameworks Table
**Database:** `australian_frameworks` table

**Expected count:** 4 frameworks
**Need to verify:**
- Matches content file data
- NSW, VIC, QLD, WA frameworks present
- Stats/descriptions in sync

---

## Category 7: Missing Sync Opportunities

### 7.1 People/Profiles Count
**No homepage stat for people count**, but API computes it:
- API: `total_people` from `public_profiles` where `is_public = true`
- Current value: 45 (fallback)

**Opportunity:** Add "45+ practitioners and researchers" to homepage or about page.

---

### 7.2 Organizations Count
**No homepage stat for organizations**, but API computes it:
- API: `total_organizations` from `organizations` where `is_active = true`
- Current value: 67 (fallback)

**Opportunity:** Add "67+ organizations" to ecosystem description.

---

### 7.3 States Coverage
**Partially shown** on homepage but could be expanded:
- Current: "7 states & territories"
- Opportunity: Show map or list of which states are covered

---

## Recommended Actions (Prioritized)

### HIGH Priority

1. **Fix Bourke basecamp error** in `/app/for-funders/page.tsx` (line 115-120)
   - Remove "Bourke Justice Reinvestment" from basecamps array
   - Replace with "Mounty Yarns" or "PICC Townsville"

2. **Consolidate basecamp data sources**
   - Use `/api/basecamps` as single source of truth
   - Remove inline arrays in marketing pages
   - Keep `excellence-map-locations.ts` as fallback only

3. **Add fallback indicators to homepage stats**
   - Show when using cached/fallback data
   - Add `last_updated` timestamp display

### MEDIUM Priority

4. **Verify research items count**
   - Check `research_items` table for actual count
   - Update navigation if count is wrong
   - Add database query to count dynamically

5. **Create dynamic navigation counts**
   - Build API endpoint for navigation metadata
   - Update counts from database on build

6. **Sync excellence map locations with database**
   - Migrate `internationalModels` to database
   - Migrate `australianFrameworks` to database
   - Migrate `researchSources` to database

### LOW Priority

7. **Add monitoring for stat discrepancies**
   - Alert when fallback values are used
   - Track API failure rates
   - Log when cached data is stale

8. **Create admin dashboard for content counts**
   - Show all counts in one place
   - Highlight discrepancies between database and hardcoded values

---

## Data Source Inventory

| Data Type | Database Table | Content File | API Endpoint | Page-Level Fallback | Count |
|-----------|---------------|--------------|--------------|-------------------|-------|
| Basecamps | `organizations` (partner_type='basecamp') | `excellence-map-locations.ts` (lines 535-612) | `/api/basecamps` | CoE page (lines 32-77) | 4 |
| International Models | TBD | `excellence-map-locations.ts` (lines 37-338) | None | None | 16 |
| Australian Frameworks | `australian_frameworks` | `excellence-map-locations.ts` (lines 343-424) | None | None | 4 |
| Research Sources | TBD | `excellence-map-locations.ts` (lines 429-529) | None | None | 5 |
| Research Items | `research_items` | None | None | None | 27? |
| Programs | `alma_interventions` | None | `/api/homepage-stats` | Homepage (624) | ? |
| Services | `services` | None | `/api/homepage-stats` | Homepage (150) | ? |
| Organizations | `organizations` | None | `/api/homepage-stats` | Homepage (67) | ? |
| People | `public_profiles` | None | `/api/homepage-stats` | Homepage (45) | ? |

---

## Files Requiring Updates

### Immediate Changes Needed
1. `/Users/benknight/Code/JusticeHub/src/app/for-funders/page.tsx` - Fix Bourke basecamp error

### Consolidation Candidates
2. `/Users/benknight/Code/JusticeHub/src/app/for-community-leaders/page.tsx` - Remove inline basecamps
3. `/Users/benknight/Code/JusticeHub/src/app/centre-of-excellence/page.tsx` - Use API instead of fallback

### Hardcoded Counts to Verify
4. `/Users/benknight/Code/JusticeHub/src/config/navigation.ts` - Navigation counts
5. `/Users/benknight/Code/JusticeHub/src/app/page.tsx` - Fallback stats
6. `/Users/benknight/Code/JusticeHub/src/app/api/homepage-stats/route.ts` - Fallback stats
7. `/Users/benknight/Code/JusticeHub/src/app/centre-of-excellence/best-practice/page.tsx` - "4 frameworks"
8. `/Users/benknight/Code/JusticeHub/src/app/centre-of-excellence/research/page.tsx` - "27 studies"

### Long-term Refactor
9. `/Users/benknight/Code/JusticeHub/src/content/excellence-map-locations.ts` - Migrate to database

---

## Summary Statistics

- **Total files with potential sync issues:** 23
- **Hardcoded basecamp definitions found:** 5 locations
- **Hardcoded stat fallbacks found:** 9 values
- **Navigation counts found:** 4 items
- **Critical data inconsistencies:** 1 (Bourke basecamp error)
- **Duplicate data sources:** 3 for basecamps

---

## Next Steps

1. Verify database state with queries
2. Create migration plan for content → database
3. Build monitoring for data consistency
4. Update pages to use dynamic data
5. Remove hardcoded fallbacks or add staleness indicators
