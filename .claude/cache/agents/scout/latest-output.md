# Justice Matrix Data Structure & Database Patterns Report
Generated: 2026-01-22

## Summary

The Justice Matrix is a global strategic litigation and advocacy clearing house designed for partnership with The Justice Project and OHCHR. The system uses:
- **JSON seed data** for preview/development
- **PostgreSQL/Supabase tables** for production storage
- **Client-side rendering** with static JSON imports (no API yet)
- **Leaflet maps** for geographic visualization
- **Established API patterns** from existing JusticeHub features

## Project Structure

```
/Users/benknight/Code/JusticeHub/
├── src/
│   ├── data/
│   │   └── justice-matrix-seed.json          # Seed data with 12 cases, 10 campaigns
│   ├── app/
│   │   └── preview/
│   │       └── justice-matrix/
│   │           └── page.tsx                  # Main preview page (client-side)
│   ├── components/
│   │   └── preview/
│   │       └── JusticeMatrixMap.tsx          # Leaflet map component
│   └── lib/
│       ├── supabase.ts                       # Client factory (proxy pattern)
│       └── supabase/
│           └── service.ts                    # Service role client
└── supabase/
    └── migrations/
        └── 20260122_justice_matrix.sql       # Database schema
```

## Data Schemas

### 1. Cases (Strategic Litigation)

**✓ VERIFIED** - Located at: `/Users/benknight/Code/JusticeHub/src/data/justice-matrix-seed.json` (lines 2-207)

**Structure:**
```typescript
interface Case {
  id: string;                    // e.g., "uk-rwanda-2023"
  jurisdiction: string;          // e.g., "United Kingdom"
  case_citation: string;         // Full legal citation
  year: number;                  // Decision year
  court: string;                 // e.g., "UK Supreme Court"
  strategic_issue: string;       // Legal issue summary
  key_holding: string;           // Decision impact
  authoritative_link: string;    // Official court URL
  
  // Geographic
  region: string;                // "Europe", "Americas", "Asia-Pacific", "Africa"
  country_code: string;          // ISO code
  lat: number;                   // For mapping
  lng: number;                   // For mapping
  
  // Classification
  categories: string[];          // e.g., ["non-refoulement", "third-country-transfers"]
  outcome: string;               // "favorable" | "adverse" | "pending"
  precedent_strength: string;    // "high" | "medium" | "low"
}
```

**Sample Data:**
- 12 strategic cases across 4 regions
- Includes landmark cases: UK Rwanda (2023), Hirsi Jamaa v Italy (2012), Singh v Canada (1985)
- 75% favorable outcomes
- 10 high-precedent cases

### 2. Campaigns (Advocacy Efforts)

**✓ VERIFIED** - Located at: `/Users/benknight/Code/JusticeHub/src/data/justice-matrix-seed.json` (lines 208-370)

**Structure:**
```typescript
interface Campaign {
  id: string;                    // e.g., "au-kidsoffnauru"
  country_region: string;        // Geographic focus
  campaign_name: string;         // Public-facing name
  lead_organizations: string;    // Lead NGOs/coalitions
  goals: string;                 // Campaign objectives
  notable_tactics: string;       // Key strategies used
  outcome_status: string;        // Current status/results
  campaign_link: string;         // Campaign website
  
  // Timeline
  is_ongoing: boolean;
  start_year: number;
  end_year?: number;             // null if ongoing
  
  // Geographic
  country_code: string;          // ISO code
  lat: number;                   // For mapping
  lng: number;                   // For mapping
  
  // Classification
  categories: string[];          // e.g., ["offshore-detention", "children"]
}
```

**Sample Data:**
- 10 campaigns across 6 jurisdictions
- Mix of completed (#KidsOffNauru, ended 2018) and ongoing (#GameOver, #WelcomeWithDignity)
- Focus areas: offshore detention, third-country transfers, asylum access

### 3. Category System

**✓ VERIFIED** - Located at: `/Users/benknight/Code/JusticeHub/src/data/justice-matrix-seed.json` (lines 371-414)

**Categories with metadata:**
```typescript
interface CategoryInfo {
  label: string;           // Display name
  description: string;     // Explanation
  color: string;          // Hex color for visualization
}

categories = {
  "non-refoulement": { label: "Non-refoulement", color: "#ef4444" },
  "third-country-transfers": { label: "Third Country Transfers", color: "#f97316" },
  "detention-conditions": { label: "Detention Conditions", color: "#eab308" },
  "pushbacks": { label: "Pushbacks & Interception", color: "#22c55e" },
  "dublin-transfers": { label: "Dublin Transfers", color: "#3b82f6" },
  "due-process": { label: "Due Process & Hearings", color: "#8b5cf6" },
  "offshore-detention": { label: "Offshore Detention", color: "#ec4899" },
  "asylum-access": { label: "Asylum Access", color: "#06b6d4" }
}
```

## Database Schema

**✓ VERIFIED** - Located at: `/Users/benknight/Code/JusticeHub/supabase/migrations/20260122_justice_matrix.sql`

### Tables Created

#### 1. `justice_matrix_cases`
```sql
CREATE TABLE justice_matrix_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core legal data
    jurisdiction TEXT NOT NULL,
    case_citation TEXT NOT NULL,
    year INTEGER,
    court TEXT,
    strategic_issue TEXT,
    key_holding TEXT,
    authoritative_link TEXT,
    
    -- Metadata
    region TEXT,
    case_type TEXT,
    status TEXT DEFAULT 'active',
    
    -- Source tracking
    source TEXT DEFAULT 'partner_contribution',
    contributor_org TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_by TEXT,
    verified_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_cases_jurisdiction` - Jurisdiction lookup
- `idx_cases_year` - Temporal filtering
- `idx_cases_region` - Regional filtering
- `idx_cases_fts` - Full-text search on citation, issue, holding

#### 2. `justice_matrix_campaigns`
```sql
CREATE TABLE justice_matrix_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core campaign data
    country_region TEXT NOT NULL,
    campaign_name TEXT NOT NULL,
    lead_organizations TEXT,
    goals TEXT,
    notable_tactics TEXT,
    outcome_status TEXT,
    campaign_link TEXT,
    
    -- Metadata
    start_year INTEGER,
    end_year INTEGER,
    is_ongoing BOOLEAN DEFAULT TRUE,
    campaign_type TEXT,
    
    -- Source tracking (same as cases)
    source TEXT DEFAULT 'partner_contribution',
    contributor_org TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_by TEXT,
    verified_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_campaigns_country` - Country filtering
- `idx_campaigns_ongoing` - Active campaign lookup
- `idx_campaigns_fts` - Full-text search on name, goals, tactics

#### 3. `justice_matrix_resources`
```sql
CREATE TABLE justice_matrix_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Resource metadata
    title TEXT NOT NULL,
    resource_type TEXT NOT NULL,  -- 'pleading', 'brief', 'judgment', etc.
    description TEXT,
    jurisdiction TEXT,
    
    -- Relationships
    case_id UUID REFERENCES justice_matrix_cases(id),
    campaign_id UUID REFERENCES justice_matrix_campaigns(id),
    
    -- File/Link info
    file_url TEXT,
    external_link TEXT,
    
    -- Publishing info
    author TEXT,
    organization TEXT,
    publish_date DATE,
    language TEXT DEFAULT 'en',
    
    -- Access control
    is_public BOOLEAN DEFAULT TRUE,
    requires_registration BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row-Level Security (RLS)

**✓ VERIFIED** - All tables have RLS enabled with public read access:

```sql
-- Public read for all three tables
CREATE POLICY "Public read access for cases" 
    ON justice_matrix_cases FOR SELECT USING (true);

CREATE POLICY "Public read access for campaigns" 
    ON justice_matrix_campaigns FOR SELECT USING (true);

CREATE POLICY "Public read access for resources" 
    ON justice_matrix_resources FOR SELECT USING (is_public = true);
```

**Note:** No write policies yet. Partner contribution system needs implementation.

## Database Patterns

### Pattern 1: Supabase Client Factory

**✓ VERIFIED** - Located at: `/Users/benknight/Code/JusticeHub/src/lib/supabase.ts`

**Singleton proxy pattern:**
```typescript
// Lazy-initialized singleton with proxy
export const supabase = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseClient();
    return client[prop];
  }
});

// Usage in API routes
import { supabase } from '@/lib/supabase';
const { data, error } = await supabase.from('table').select('*');
```

### Pattern 2: Service Role Client

**✓ VERIFIED** - Pattern found in: `/Users/benknight/Code/JusticeHub/src/app/api/services/route.ts`

**Server-side only:**
```typescript
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: Request) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('table')
    .select('*');
}
```

### Pattern 3: Standard API Route Structure

**✓ VERIFIED** - Pattern from: `/Users/benknight/Code/JusticeHub/src/app/api/services/route.ts`

**Established conventions:**
```typescript
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    
    // Parse query params
    const limit = parseInt(searchParams.get('limit') || '12');
    const page = parseInt(searchParams.get('page') || '1');
    
    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Build query
    let query = supabase
      .from('table')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });
    
    // Apply filters conditionally
    if (filter) query = query.eq('field', filter);
    
    const { data, error, count } = await query;
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

## Current Implementation

### Preview Page Architecture

**✓ VERIFIED** - Located at: `/Users/benknight/Code/JusticeHub/src/app/preview/justice-matrix/page.tsx`

**Current approach:**
- Client-side only (`'use client'`)
- Imports JSON directly: `import seedData from '@/data/justice-matrix-seed.json'`
- No API calls - all data processing in component
- Password-protected (password: `justice2026`)
- Session storage for auth state

**Features implemented:**
1. **Search & Filter** (lines 85-106)
   - Text search across citation, jurisdiction, strategic_issue
   - Region filter dropdown
   - Real-time client-side filtering

2. **Interactive Map** (lines 350-358)
   - Dynamic import of Leaflet (SSR workaround)
   - Click handlers for case/campaign selection
   - Layer toggles for cases vs campaigns

3. **Analytics Dashboard** (lines 114-151)
   - Cases by region, outcome, year
   - Category frequency analysis
   - High precedent filtering
   - All computed client-side using `useMemo`

4. **Modals** (lines 979-1142)
   - Case detail modal
   - Campaign detail modal
   - Full metadata display

### Map Component

**✓ VERIFIED** - Located at: `/Users/benknight/Code/JusticeHub/src/components/preview/JusticeMatrixMap.tsx`

**Implementation:**
- React-Leaflet with CircleMarkers
- Color-coded by outcome (green=favorable, red=adverse, yellow=pending)
- Size based on precedent strength / ongoing status
- CARTO light basemap
- Layer toggles for cases/campaigns
- Click events trigger parent callbacks

## API Patterns (To Be Implemented)

### Recommended API Routes

Based on existing patterns, the Justice Matrix should have:

#### 1. `/api/justice-matrix/cases` (GET)
```typescript
// Query params:
// - limit, page (pagination)
// - region (filter)
// - outcome (filter)
// - year_min, year_max (range)
// - precedent_strength (filter)
// - search (full-text)

// Response:
{
  success: true,
  data: Case[],
  pagination: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

#### 2. `/api/justice-matrix/campaigns` (GET)
Similar structure to cases endpoint

#### 3. `/api/justice-matrix/resources` (GET)
Filter by case_id, campaign_id, resource_type

#### 4. `/api/justice-matrix/analytics` (GET)
Pre-computed analytics (cases by region, outcome distribution, etc.)

## Data Flow

### Current (Preview)
```
User → Preview Page → JSON Import → Client-side Filter → Render
```

### Proposed (Production)
```
User → Preview Page → API Route → Supabase Query → JSON Response → Render
```

### Seeding Flow (Not Yet Implemented)
```
JSON Seed Data → Migration Script → Supabase Insert → Production DB
```

## Integration Points

### 1. JusticeHub Platform Integration

**✓ VERIFIED** - From preview page description (lines 437-461):

The Justice Matrix integrates with existing JusticeHub infrastructure:
- **Shared hosting** - Same Next.js app
- **Shared auth** - Partner portal authentication
- **ALMA integration** - AI assistant can query Justice Matrix
- **Cross-linking** - Link cases to services/organizations

### 2. Partner Contribution System

**Schema supports but not implemented:**
- `source` field: `'partner_contribution'` | `'ai_scraped'` | `'manual'`
- `contributor_org` field for attribution
- `verified` flag and audit trail (`verified_by`, `verified_at`)
- No API routes for submissions yet

### 3. AI Content Streams

**Planned but not implemented:**
- Scheduled court database crawls
- Auto-summarization
- De-duplication
- Human spot-checks

## Conventions Discovered

### Naming
- **Files:** kebab-case (`justice-matrix-seed.json`, `route.ts`)
- **Components:** PascalCase (`JusticeMatrixMap.tsx`)
- **Functions:** camelCase (`getCaseRadius`, `getOutcomeColor`)
- **Database:** snake_case (`justice_matrix_cases`, `is_ongoing`)

### Patterns
| Pattern | Usage | Example |
|---------|-------|---------|
| API Routes | Server-side data | `/api/services/route.ts` |
| Preview Pages | Password-protected demos | `/app/preview/justice-matrix/page.tsx` |
| Dynamic Imports | SSR-incompatible libs | Leaflet map loading |
| Service Client | Server API routes | `createServiceClient()` |
| Proxy Pattern | Lazy singletons | Supabase client factory |
| Full-text Search | PostgreSQL GIN indexes | `idx_cases_fts` |
| RLS Policies | Row-level security | Public read access |

### Testing
- **Location:** Not found for Justice Matrix
- **Naming:** Not applicable yet
- **Framework:** Jest (from package.json inference)

## Architecture Map

```
┌─────────────────────────────────────────────────────┐
│         Preview Page (Client-Side)                  │
│  /preview/justice-matrix/page.tsx                   │
│  - Password auth (session storage)                  │
│  - Direct JSON import                               │
│  - Client-side filtering                            │
│  - Leaflet map rendering                            │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│         JSON Seed Data (Static)                     │
│  src/data/justice-matrix-seed.json                  │
│  - 12 cases, 10 campaigns                           │
│  - Category definitions                             │
│  - Geographic coordinates                           │
└─────────────────────────────────────────────────────┘

[NOT YET CONNECTED]

┌─────────────────────────────────────────────────────┐
│         API Layer (To Be Built)                     │
│  /api/justice-matrix/*                              │
│  - GET /cases                                       │
│  - GET /campaigns                                   │
│  - GET /resources                                   │
│  - GET /analytics                                   │
│  - POST /cases (partner submission)                 │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│         Supabase Client Layer                       │
│  src/lib/supabase/service.ts                        │
│  - createServiceClient()                            │
│  - Row-level security                               │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│         PostgreSQL Database                         │
│  Supabase: tednluwflfhxyucgwigh                     │
│  - justice_matrix_cases                             │
│  - justice_matrix_campaigns                         │
│  - justice_matrix_resources                         │
│  - Full-text search indexes                         │
│  - RLS policies (public read)                       │
└─────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose | Entry Points | Status |
|------|---------|--------------|--------|
| `src/data/justice-matrix-seed.json` | Seed data with 12 cases, 10 campaigns | Direct import | ✓ Complete |
| `src/app/preview/justice-matrix/page.tsx` | Main preview interface | Default export | ✓ Complete |
| `src/components/preview/JusticeMatrixMap.tsx` | Leaflet map component | Default export | ✓ Complete |
| `supabase/migrations/20260122_justice_matrix.sql` | Database schema | Migration | ✓ Complete |
| `src/lib/supabase.ts` | Client factory | `supabase` export | ✓ Established |
| `/api/justice-matrix/*` | API routes | None | ✗ Not built |
| Seeding script | Load JSON → DB | None | ✗ Not built |

## Missing Pieces

### 1. Data Seeding
- **Status:** ✗ Not implemented
- **Need:** Script to load `justice-matrix-seed.json` into Supabase tables
- **Pattern:** Use existing migration patterns from JusticeHub

### 2. API Routes
- **Status:** ✗ Not implemented
- **Need:** REST endpoints following established patterns
- **Files:** `/api/justice-matrix/cases/route.ts`, etc.

### 3. Schema Mismatch
- **Issue:** JSON has `categories[]`, `lat`, `lng` but DB doesn't have these columns
- **Need:** Migration to add:
  - `categories JSONB` or separate junction table
  - `lat NUMERIC`, `lng NUMERIC`
  - `country_code TEXT`

### 4. Partner Contribution UI
- **Status:** ✗ Not implemented
- **Need:** Web forms for partner submissions
- **Schema:** Already has fields (`source`, `contributor_org`, `verified`)

### 5. Testing
- **Status:** ✗ Not found
- **Need:** Unit tests for API routes, component tests for map/filters

## Open Questions

1. **Category Storage:** Use JSONB array or create `justice_matrix_case_categories` junction table?
   - JSONB: Simpler queries, harder to enforce referential integrity
   - Junction: Normalized, better for faceted search, more complex queries

2. **Geographic Data:** Add PostGIS extension for advanced geo queries?
   - Current: Simple lat/lng in separate columns
   - With PostGIS: GEOGRAPHY type, distance queries, spatial indexes

3. **Resources Table:** Should it link to both cases AND campaigns?
   - Current schema allows it (nullable FKs)
   - Consider: Multi-table relationships, versioning

4. **Search Strategy:** 
   - Client-side (current) vs server-side filtering
   - PostgreSQL FTS vs external search (Algolia/Meilisearch)
   - Real-time updates or cached analytics

5. **Seeding Strategy:**
   - One-time seed vs ongoing sync
   - Manual JSON updates vs partner API submissions
   - Data validation pipeline

## Recommended Next Steps

### Phase 1: Database Completion
1. Add missing columns to match JSON schema:
   ```sql
   ALTER TABLE justice_matrix_cases ADD COLUMN categories JSONB;
   ALTER TABLE justice_matrix_cases ADD COLUMN lat NUMERIC;
   ALTER TABLE justice_matrix_cases ADD COLUMN lng NUMERIC;
   ALTER TABLE justice_matrix_cases ADD COLUMN country_code TEXT;
   ALTER TABLE justice_matrix_cases ADD COLUMN outcome TEXT;
   ALTER TABLE justice_matrix_cases ADD COLUMN precedent_strength TEXT;
   
   ALTER TABLE justice_matrix_campaigns ADD COLUMN categories JSONB;
   ALTER TABLE justice_matrix_campaigns ADD COLUMN lat NUMERIC;
   ALTER TABLE justice_matrix_campaigns ADD COLUMN lng NUMERIC;
   ALTER TABLE justice_matrix_campaigns ADD COLUMN country_code TEXT;
   ```

2. Create seeding script:
   ```typescript
   // scripts/seed-justice-matrix.ts
   import seedData from '../src/data/justice-matrix-seed.json';
   import { createServiceClient } from '../src/lib/supabase/service';
   
   async function seed() {
     const supabase = createServiceClient();
     
     // Insert cases
     const { error: casesError } = await supabase
       .from('justice_matrix_cases')
       .insert(seedData.cases);
     
     // Insert campaigns
     const { error: campaignsError } = await supabase
       .from('justice_matrix_campaigns')
       .insert(seedData.campaigns);
   }
   ```

### Phase 2: API Implementation
1. Create `/api/justice-matrix/cases/route.ts` following service pattern
2. Create `/api/justice-matrix/campaigns/route.ts`
3. Update preview page to use API instead of JSON import

### Phase 3: Partner Features
1. Build submission forms
2. Add write RLS policies with role checks
3. Implement verification workflow

## Database Architecture Context

**Important Note:** The JusticeHub platform currently uses a single Supabase instance (`tednluwflfhxyucgwigh`) for all data. According to the DATABASE_ARCHITECTURE.md document, there's a known issue where JusticeHub and Timothy Ledger (separate products) are mixed in one database.

**Justice Matrix fits into JusticeHub database** because:
- Public-facing content (like articles, services, programs)
- Read-heavy access pattern
- Shared authentication and infrastructure
- Cross-linking with existing JusticeHub features

The Justice Matrix tables should remain in the main JusticeHub database alongside:
- `articles` - Stories and articles
- `services` - Service directory
- `community_programs` - Programs database
- `organizations` - Service providers

---

**Report Complete**
Data schemas, database patterns, and API conventions thoroughly documented.
Ready for implementation of missing API layer and data seeding pipeline.
