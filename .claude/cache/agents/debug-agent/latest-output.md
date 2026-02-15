# Debug Report: Community Map Shows Only 14 Services

**Generated:** 2026-01-13

## Symptom

The community map at `/community-map` displays only 14 services when it should show approximately 1000 (actually 511 in DB, 505 with coordinates).

## Investigation Steps

1. Read the community map page component
2. Identified data source (static file, not database)
3. Queried database for service counts
4. Analyzed coordinate column structure
5. Identified the ServicesMap component exists but is unused

## Evidence

### Finding 1: Static Data Source (ROOT CAUSE)

- **Location:** `/Users/benknight/Code/JusticeHub/src/app/community-map/page.tsx:26`
- **Observation:** The page imports services from a static TypeScript file, NOT the database:
  ```typescript
  import { communityMapServices } from '@/content/community-map-services';
  ```
- **Relevance:** This static file only contains 14 hand-curated services

### Finding 2: Static File Has Only 14 Services

- **Location:** `/Users/benknight/Code/JusticeHub/src/content/community-map-services.ts`
- **Observation:** The `communityMapServices` array contains exactly 14 manually entered services with hardcoded coordinates
- **Relevance:** This explains the exact count of 14 services shown

### Finding 3: Database Has 511 Services

- **Query:** `SELECT COUNT(*) FROM services`
- **Result:** 511 total services, all active (`is_active = true`)
- **Relevance:** Database has 36x more services than displayed

### Finding 4: Coordinate Columns Are Mismatched

- **Query:** Checked coordinate population across columns
- **Result:**
  | Column | Services with Data |
  |--------|-------------------|
  | `latitude` | 0 |
  | `longitude` | 0 |
  | `location_latitude` | 505 |
  | `location_longitude` | 505 |

- **Relevance:** 505 services have geocoded coordinates, but they're in `location_latitude`/`location_longitude` columns, not `latitude`/`longitude`

### Finding 5: Unused ServicesMap Component Exists

- **Location:** `/Users/benknight/Code/JusticeHub/src/components/ServicesMap.tsx`
- **Observation:** A database-connected map component exists that expects `service.location.latitude/longitude`
- **Relevance:** This component could be used if wired to database data

### Finding 6: API Endpoint Exists But Not Used

- **Location:** `/Users/benknight/Code/JusticeHub/src/app/api/services/route.ts`
- **Observation:** API queries `services_complete` view with filtering, but the community-map page never calls this API
- **Relevance:** Infrastructure exists to fetch from DB, just not wired up

## Root Cause Analysis

The community map page uses a **hardcoded static array** of 14 services instead of fetching from the database. This appears to be intentional early implementation (curated showcase) that was never upgraded to use the full database.

**Confidence:** HIGH (verified by reading source code and database)

**Secondary Issue:** Even if database were used, the `services_complete` view may not expose `location_latitude`/`location_longitude` correctly. The view shows `location` as JSONB but query showed it lacks lat/lng fields.

## Recommended Fix

### Option A: Quick Fix - Switch to Database (Recommended)

**Files to modify:**

1. `/Users/benknight/Code/JusticeHub/src/app/community-map/page.tsx`
   - Replace static import with API fetch
   - Map database fields to existing interface

**Steps:**

1. Add state for services: `const [services, setServices] = useState<Service[]>([])`
2. Add useEffect to fetch from `/api/services?limit=1000`
3. Transform API response to match `CommunityMapService` interface
4. Handle the coordinate field mapping (`location_latitude` -> `coordinates.lat`)

### Option B: Fix Database + Update View

**Files to modify:**

1. Update `services_complete` view to include lat/lng:
   ```sql
   ALTER VIEW services_complete AS SELECT
     ...,
     location_latitude as latitude,
     location_longitude as longitude
   FROM services;
   ```

2. Or copy coordinates to the canonical columns:
   ```sql
   UPDATE services
   SET latitude = location_latitude,
       longitude = location_longitude
   WHERE location_latitude IS NOT NULL;
   ```

### Option C: Hybrid Approach

Keep the static services for featured/curated display, but add a "Show All Services" toggle that fetches from DB.

## Data Summary

| Metric | Value |
|--------|-------|
| Services shown in UI | 14 |
| Total services in DB | 511 |
| Services with coordinates | 505 |
| Gap | 491 services hidden |

## Prevention

1. Add a data source indicator to the UI (e.g., "Showing 14 of 511 services")
2. Consider automated sync between DB and static file for curated lists
3. Document the intended data flow for the community map feature
