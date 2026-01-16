# Empathy Ledger Integration Analysis
Generated: 2026-01-17

## Executive Summary

JusticeHub integrates with Empathy Ledger (an external Supabase database) to display culturally-sensitive storytelling content with consent-based controls. The integration supports:

- **Profiles**: Storytellers who opt-in via `justicehub_enabled` flag
- **Stories**: Public stories with explicit privacy levels
- **Organizations**: Indigenous-controlled organizations
- **Bi-directional sync**: JusticeHub caches Empathy Ledger content for performance

**Key Finding**: The integration has a known RLS recursion issue with the `profiles` table in Empathy Ledger, causing fallback to JusticeHub's cached `public_profiles` or accessing profiles via story joins.

---

## Data Flow Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      EMPATHY LEDGER                            │
│                  (External Supabase DB)                        │
│                                                                │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │ storytellers │────▶│   stories    │────▶│organizations │   │
│  │              │     │              │     │              │   │
│  │ - display_name│    │ - title      │     │ - name       │   │
│  │ - bio         │    │ - content    │     │ - slug       │   │
│  │ - avatar_url  │    │ - themes     │     │ - indigenous │   │
│  │ - justicehub_ │    │ - is_public  │     │ - traditional│   │
│  │   enabled     │    │ - privacy_   │     │   _country   │   │
│  │              │     │   level      │     │              │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
│         │                    │                     │           │
└─────────┼────────────────────┼─────────────────────┼───────────┘
          │                    │                     │
          │ READ via API       │ READ via API        │ READ via API
          ▼                    ▼                     ▼
┌────────────────────────────────────────────────────────────────┐
│                        JUSTICEHUB                              │
│                   (Primary Database)                           │
│                                                                │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │public_profiles│    │  blog_posts  │     │organizations │   │
│  │              │     │              │     │              │   │
│  │ - full_name  │     │ - title      │     │ - name       │   │
│  │ - bio        │     │ - content    │     │ - slug       │   │
│  │ - photo_url  │     │ - categories │     │ - empathy_   │   │
│  │ - empathy_   │     │ - empathy_   │     │   ledger_    │   │
│  │   ledger_    │     │   ledger_    │     │   org_id     │   │
│  │   profile_id │     │   story_id   │     │              │   │
│  │ - synced_from│     │ - synced_from│     │ - synced_from│   │
│  │   _empathy_  │     │   _empathy_  │     │   _empathy_  │   │
│  │   ledger     │     │   ledger     │     │   ledger     │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
│         │                    │                     │           │
│         └────────────────────┴─────────────────────┘           │
│                              │                                 │
│                   ┌──────────────────┐                         │
│                   │profile_appearances│                        │
│                   │                  │                         │
│                   │ - empathy_ledger_│                         │
│                   │   profile_id     │                         │
│                   │ - appears_on_type│                         │
│                   │ - appears_on_id  │                         │
│                   │ - role           │                         │
│                   │ - story_excerpt  │                         │
│                   └──────────────────┘                         │
└────────────────────────────────────────────────────────────────┘
```

---

## API Routes

### 1. GET /api/empathy-ledger/profiles

**File**: `/Users/benknight/Code/JusticeHub/src/app/api/empathy-ledger/profiles/route.ts`

**Purpose**: Fetch storyteller profiles from Empathy Ledger with consent controls

**Query Parameters**:
- `limit` (default: 20) - Number of profiles
- `featured` (boolean) - Filter for `is_justicehub_featured` profiles
- `include_stories` (boolean) - Include story counts

**Consent Controls**:
```typescript
.eq('justicehub_enabled', true)
.eq('is_active', true)
```

**Field Mapping** (Empathy Ledger → JusticeHub):
```
storytellers.id → empathy_ledger_profile_id
storytellers.display_name → display_name
storytellers.bio → bio
storytellers.avatar_url → avatar_url
storytellers.cultural_background → cultural_background
storytellers.location → location
storytellers.justicehub_enabled → (filter only)
storytellers.is_justicehub_featured → justicehub_featured
```

**Known Issue**: RLS recursion error (code `42P17`) on `profiles` table triggers fallback to:
1. Query JusticeHub's `public_profiles` where `synced_from_empathy_ledger = true`
2. Map fields back to expected Empathy Ledger format

**Response**:
```json
{
  "success": true,
  "profiles": [...],
  "count": 10,
  "source": "empathy_ledger" | "justicehub_synced",
  "consent_info": {
    "consent_level": "justicehub_enabled",
    "description": "All profiles have explicitly opted in to be displayed on JusticeHub"
  }
}
```

---

### 2. GET /api/empathy-ledger/profiles/[id]

**File**: `/Users/benknight/Code/JusticeHub/src/app/api/empathy-ledger/profiles/[id]/route.ts`

**Purpose**: Fetch single profile by ID with consent check

**Query Parameters**:
- `include_stories` (boolean) - Include public stories
- `include_organization` (boolean) - Include org details

**Consent Check**:
```typescript
.eq('justicehub_enabled', true)
```

**Returns 404** if profile doesn't exist or hasn't opted in.

**Stories Filtering** (when `include_stories=true`):
```typescript
.eq('is_public', true)
.eq('privacy_level', 'public')
```

**Response**:
```json
{
  "success": true,
  "profile": {...},
  "organization": {...},  // if requested
  "stories": [...],       // if requested
  "story_count": 3,
  "consent_info": {
    "justicehub_enabled": true,
    "description": "This profile has opted in to be displayed on JusticeHub"
  }
}
```

---

### 3. GET /api/empathy-ledger/stories

**File**: `/Users/benknight/Code/JusticeHub/src/app/api/empathy-ledger/stories/route.ts`

**Purpose**: Fetch public stories for JusticeHub display

**Query Parameters**:
- `limit` (default: 10) - Number of stories
- `featured` (boolean) - Filter for `justicehub_featured` stories
- `storyteller_id` - Filter by storyteller

**Consent Model** (THREE conditions):
```typescript
.eq('is_public', true)
.eq('privacy_level', 'public')
// Optional: .eq('justicehub_featured', true) if featured=true
```

**Field Mapping**:
```
stories.id → id
stories.title → title
stories.summary → summary
stories.content → content
stories.story_image_url → story_image_url
stories.story_type → story_type (mapped to human-readable category)
stories.themes → themes
stories.is_featured → is_featured
stories.justicehub_featured → justicehub_featured
stories.cultural_sensitivity_level → cultural_sensitivity_level
stories.storytellers.display_name → storyteller_name
stories.storytellers.avatar_url → (fallback for story_image_url)
```

**Story Type Labels**:
```typescript
{
  'personal_narrative': 'Personal Story',
  'traditional_knowledge': 'Traditional Knowledge',
  'impact_story': 'Impact Story',
  'community_story': 'Community Story',
  'healing_journey': 'Healing Journey',
  'advocacy': 'Advocacy',
  'cultural_practice': 'Cultural Practice'
}
```

**Response**:
```json
{
  "success": true,
  "stories": [
    {
      "id": "...",
      "title": "...",
      "excerpt": "...",
      "story_category": "Personal Story",
      "story_image_url": "...",
      "storyteller_name": "..."
    }
  ],
  "count": 10,
  "consent_info": {
    "is_public": true,
    "privacy_level": "public",
    "description": "All stories are public with explicit consent"
  }
}
```

---

### 4. POST /api/admin/sync-empathy-ledger

**File**: `/Users/benknight/Code/JusticeHub/src/app/api/admin/sync-empathy-ledger/route.ts`

**Purpose**: Admin-only sync that copies Empathy Ledger profiles to JusticeHub

**Authentication**: Requires `is_super_admin = true`

**Sync Process**:

1. **Fetch from Empathy Ledger**:
```typescript
.from('profiles')
.select('id, display_name, bio, avatar_url, justicehub_enabled, justicehub_role, justicehub_featured')
.eq('justicehub_enabled', true)
```

2. **Check if exists in JusticeHub**:
```typescript
.from('profiles')
.select('id, slug')
.eq('empathy_ledger_profile_id', profile.id)
```

3. **Create or Update**:
   - **If exists**: Update `public_profiles` with new data
   - **If new**: Insert into `public_profiles`

**Field Mapping** (Create/Update):
```
empathy_ledger.profiles.id → public_profiles.empathy_ledger_profile_id
empathy_ledger.profiles.display_name → public_profiles.full_name
empathy_ledger.profiles.bio → public_profiles.bio
empathy_ledger.profiles.avatar_url → public_profiles.photo_url
empathy_ledger.profiles.justicehub_role → public_profiles.role_tags (as array)
empathy_ledger.profiles.justicehub_featured → public_profiles.is_featured
(auto-generated) → public_profiles.slug (kebab-case from display_name)
true → public_profiles.synced_from_empathy_ledger
'full' → public_profiles.sync_type
NOW() → public_profiles.last_synced_at
```

**Audit Logging**:
All sync operations logged to `profile_sync_log` table:
```typescript
{
  public_profile_id: uuid,
  empathy_ledger_profile_id: uuid,
  sync_action: 'created' | 'updated' | 'deleted' | 'linked' | 'unlinked',
  sync_status: 'success' | 'failed' | 'partial',
  sync_details: jsonb,
  error_message: text,
  synced_at: timestamp
}
```

**Response**:
```json
{
  "created": 5,
  "updated": 3,
  "failed": 0,
  "total": 8,
  "message": "Sync completed! Created: 5, Updated: 3, Failed: 0"
}
```

---

### 5. GET /api/health/empathy-ledger

**File**: `/Users/benknight/Code/JusticeHub/src/app/api/health/empathy-ledger/route.ts`

**Purpose**: Health check for Empathy Ledger integration

**Checks Performed**:

1. **Empathy Ledger Connection** (stories table - avoids RLS issue)
```typescript
.from('stories').select('id').limit(1)
```

2. **Empathy Ledger Profiles** (known RLS issue - doesn't fail health check)
```typescript
.from('profiles').select('id').limit(1)
// RLS recursion treated as warning, not failure
```

3. **JusticeHub Connection**
```typescript
.from('services').select('id').limit(1)
```

4. **Profile Appearances Table**
```typescript
.from('profile_appearances').select('*', { count: 'exact', head: true })
```

5. **Public Stories Access**
```typescript
.from('stories')
.select('*', { count: 'exact', head: true })
.eq('is_public', true)
.eq('privacy_level', 'public')
```

**Response**:
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "checks": [
    {
      "name": "empathy_ledger_connection",
      "status": "pass" | "fail",
      "latency": 45,
      "message": "..."
    }
  ],
  "timestamp": "2026-01-17T..."
}
```

**Status Logic**:
- 2+ failed checks → `unhealthy` (503 status)
- 1 failed check → `degraded` (200 status)
- 0 failed checks → `healthy` (200 status)

---

## Database Schema

### JusticeHub Tables (with Empathy Ledger linking)

#### 1. `public_profiles`

**File**: `/Users/benknight/Code/JusticeHub/supabase/migrations/20250123000001_create_unified_profiles_system.sql`

**Purpose**: Central registry for public-facing people, including synced Empathy Ledger profiles

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `full_name` | text | Display name |
| `slug` | text | URL-friendly identifier (unique) |
| `bio` | text | Biography |
| `photo_url` | text | Profile image |
| `role_tags` | text[] | Roles (e.g., ['researcher', 'lived-experience']) |
| `is_public` | boolean | Publicly visible |
| `is_featured` | boolean | Featured on homepage |
| **`empathy_ledger_profile_id`** | uuid | Link to Empathy Ledger profile |
| **`synced_from_empathy_ledger`** | boolean | True if auto-synced from EL |
| **`sync_type`** | text | 'reference', 'full', 'manual' |
| **`last_synced_at`** | timestamp | Last sync timestamp |
| `user_id` | uuid | If also a JusticeHub auth user |

**Sync Types**:
- `reference`: Link only, data lives in Empathy Ledger
- `full`: Cache data locally for performance
- `manual`: No auto-sync

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_public_profiles_empathy_ledger_id
ON public_profiles(empathy_ledger_profile_id)
WHERE empathy_ledger_profile_id IS NOT NULL;

CREATE INDEX idx_public_profiles_synced_from_empathy
ON public_profiles(synced_from_empathy_ledger)
WHERE synced_from_empathy_ledger = true;
```

---

#### 2. `blog_posts`

**File**: `/Users/benknight/Code/JusticeHub/supabase/migrations/20250126000008_add_empathy_content_sync.sql`

**Purpose**: Published articles/stories, may sync from Empathy Ledger

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `title` | text | Post title |
| `content` | text | Full content (markdown) |
| `excerpt` | text | Summary |
| `author_id` | uuid | FK to public_profiles |
| `status` | text | 'draft', 'published', 'archived' |
| **`empathy_ledger_transcript_id`** | uuid | Reference to EL transcript |
| **`empathy_ledger_story_id`** | uuid | Reference to EL story |
| **`synced_from_empathy_ledger`** | boolean | True if synced from EL |
| **`video_url`** | text | Video content URL |
| **`audio_url`** | text | Audio content URL |
| **`cultural_sensitivity_flag`** | boolean | Requires cultural review |

**Note**: The sync mechanism for stories to blog_posts is not fully implemented in the codebase (no matching POST route for story sync).

---

#### 3. `organizations`

**File**: `/Users/benknight/Code/JusticeHub/supabase/migrations/20250126000004_add_empathy_ledger_linking.sql`

**Purpose**: Non-profits, service providers, may sync from Empathy Ledger

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Organization name |
| `slug` | text | URL identifier (unique) |
| `type` | text | 'nonprofit', 'government', etc. |
| **`empathy_ledger_org_id`** | uuid | Link to EL organization |
| **`synced_from_empathy_ledger`** | boolean | True if synced from EL |
| **`last_synced_at`** | timestamp | Last sync timestamp |

---

#### 4. `community_programs` (registered_services)

**File**: `/Users/benknight/Code/JusticeHub/supabase/migrations/20250126000004_add_empathy_ledger_linking.sql`

**Purpose**: Community programs, may link to Empathy Ledger projects

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Program name |
| `description` | text | Program description |
| **`empathy_ledger_project_id`** | uuid | Link to EL project |
| **`synced_from_empathy_ledger`** | boolean | True if synced from EL |
| **`last_synced_at`** | timestamp | Last sync timestamp |

**Note**: The DATA_MODEL.md calls this table `registered_services` but migrations use `community_programs`.

---

#### 5. `profile_appearances`

**File**: `/Users/benknight/Code/JusticeHub/supabase/migrations/20260111_create_profile_appearances.sql`

**Purpose**: Links Empathy Ledger profiles to JusticeHub content (programs, services, articles)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| **`empathy_ledger_profile_id`** | uuid | UUID from Empathy Ledger |
| `appears_on_type` | text | 'program', 'service', 'article' |
| `appears_on_id` | uuid | ID of program/service/article |
| `role` | text | 'participant', 'facilitator', 'family member', etc. |
| `story_excerpt` | text | Brief excerpt from their story |
| `featured` | boolean | Featured appearance |
| `public_profile_id` | uuid | FK to public_profiles (if synced) |

**Unique Constraint**:
```sql
UNIQUE(empathy_ledger_profile_id, appears_on_type, appears_on_id)
```

**Use Case**: Display storyteller testimonials on program pages without duplicating profile data.

---

#### 6. `profile_sync_log`

**File**: `/Users/benknight/Code/JusticeHub/supabase/migrations/20250126000004_add_empathy_ledger_linking.sql`

**Purpose**: Audit log for all profile sync operations

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `public_profile_id` | uuid | FK to public_profiles |
| `empathy_ledger_profile_id` | uuid | Empathy Ledger profile ID |
| `sync_action` | text | 'created', 'updated', 'deleted', 'linked', 'unlinked' |
| `sync_status` | text | 'success', 'failed', 'partial' |
| `sync_details` | jsonb | Full details of sync |
| `error_message` | text | Error if failed |
| `synced_at` | timestamp | When sync occurred |

---

#### 7. `organization_sync_log`

**File**: `/Users/benknight/Code/JusticeHub/supabase/migrations/20250126000004_add_empathy_ledger_linking.sql`

**Purpose**: Audit log for organization sync operations

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `organization_id` | uuid | FK to organizations |
| `empathy_ledger_org_id` | uuid | Empathy Ledger org ID |
| `sync_action` | text | 'created', 'updated', 'deleted', 'linked', 'unlinked' |
| `sync_status` | text | 'success', 'failed', 'partial' |
| `sync_details` | jsonb | Full details of sync |
| `error_message` | text | Error if failed |
| `synced_at` | timestamp | When sync occurred |

---

### Empathy Ledger Tables (External Database)

**Connection Details**:
```typescript
// File: /Users/benknight/Code/JusticeHub/src/lib/supabase/empathy-ledger.ts
export const empathyLedgerClient = createClient(
  process.env.EMPATHY_LEDGER_URL || 'https://yvnuayzslukamizrlhwb.supabase.co',
  process.env.EMPATHY_LEDGER_ANON_KEY || '...'
);
```

#### 1. `storytellers` (profiles)

**Purpose**: Storyteller profiles with consent controls

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `display_name` | text | Public name |
| `bio` | text | Biography |
| `avatar_url` | text | Profile image |
| `cultural_background` | text | Cultural identity |
| `location` | text | Location |
| **`justicehub_enabled`** | boolean | Opt-in for JusticeHub display |
| **`is_justicehub_featured`** | boolean | Featured on JusticeHub |
| `is_featured` | boolean | Featured in Empathy Ledger |
| `is_active` | boolean | Active profile |
| `primary_organization_id` | uuid | FK to organizations |

**Known Issue**: RLS policy has infinite recursion error. Workaround: Access via story joins or use JusticeHub's synced `public_profiles`.

---

#### 2. `stories`

**Purpose**: User stories with consent and cultural safety controls

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `title` | text | Story title |
| `content` | text | Full story content |
| `summary` | text | Brief summary |
| `story_image_url` | text | Feature image |
| `story_type` | text | 'personal_narrative', 'traditional_knowledge', etc. |
| `themes` | text[] | Story themes |
| **`is_public`** | boolean | Public visibility |
| **`privacy_level`** | text | 'private', 'community', 'public' |
| `is_featured` | boolean | Featured in Empathy Ledger |
| **`justicehub_featured`** | boolean | Featured on JusticeHub |
| `cultural_sensitivity_level` | text | Sensitivity level |
| `cultural_warnings` | text[] | Cultural warnings |
| `requires_elder_approval` | boolean | Needs elder approval |
| `elder_approved_at` | timestamp | Elder approval timestamp |
| `has_explicit_consent` | boolean | Explicit consent given |
| `consent_details` | jsonb | Consent metadata |
| `storyteller_id` | uuid | FK to storytellers |
| `organization_id` | uuid | FK to organizations |
| `service_id` | uuid | Link to JusticeHub service |
| `published_at` | timestamp | Publication date |

**Consent Model** (enforced by API routes):
```typescript
canDisplayOnJusticeHub(story) {
  return story.is_public === true 
      && story.privacy_level === 'public'
      && (!story.requires_elder_approval || story.elder_approved_at)
}
```

---

#### 3. `organizations`

**Purpose**: Indigenous-controlled organizations and service providers

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Organization name |
| `slug` | text | URL identifier (unique) |
| `description` | text | About the organization |
| `location` | text | Location |
| `website_url` | text | Website |
| `logo_url` | text | Logo image |
| `indigenous_controlled` | boolean | Indigenous-controlled |
| `traditional_country` | text | Traditional country |
| `language_groups` | text[] | Language groups |
| `empathy_ledger_enabled` | boolean | Enabled in Empathy Ledger |
| `elder_approval_required` | boolean | Requires elder approval |

---

## Field Mappings Summary

### Profile Sync (Empathy Ledger → JusticeHub)

| Empathy Ledger | JusticeHub | Transformation |
|----------------|------------|----------------|
| `storytellers.id` | `empathy_ledger_profile_id` | Direct |
| `storytellers.display_name` | `full_name` | Direct |
| `storytellers.bio` | `bio` | Direct |
| `storytellers.avatar_url` | `photo_url` | Direct |
| `storytellers.location` | `location` | Direct |
| `storytellers.justicehub_role` | `role_tags` | String → Array |
| `storytellers.justicehub_featured` | `is_featured` | Direct |
| (auto-generated from `display_name`) | `slug` | kebab-case transformation |
| (constant) | `synced_from_empathy_ledger` | `true` |
| (constant) | `sync_type` | `'full'` |
| (constant) | `is_public` | `true` |
| NOW() | `last_synced_at` | Current timestamp |

### Story Display (Empathy Ledger → API Response)

| Empathy Ledger | API Response | Transformation |
|----------------|--------------|----------------|
| `stories.id` | `id` | Direct |
| `stories.title` | `title` | Direct |
| `stories.summary` | `excerpt` | Direct or truncated from `content` |
| `stories.content` | `content` | Direct |
| `stories.story_image_url` | `story_image_url` | Fallback to storyteller avatar |
| `stories.story_type` | `story_category` | Map to human-readable label |
| `stories.themes` | `themes` | Direct |
| `stories.is_featured` | `is_featured` | Direct |
| `stories.justicehub_featured` | `justicehub_featured` | Direct |
| `storytellers.display_name` | `storyteller_name` | Join from storytellers |
| `storytellers.avatar_url` | (fallback for `story_image_url`) | Join from storytellers |

---

## Issues & Inconsistencies

### 1. RLS Recursion Error (CRITICAL)

**Problem**: Empathy Ledger's `profiles` table has infinite recursion in RLS policy (error code `42P17`)

**Impact**: 
- Cannot directly query `profiles` table
- Health check treats this as warning, not failure
- API routes have fallback logic

**Workarounds**:
1. **Fallback to JusticeHub**: When RLS error occurs, query `public_profiles` where `synced_from_empathy_ledger = true`
2. **Use Story Joins**: Access storyteller data via `stories.storytellers` relation instead of direct profile query
3. **Use `storytellers` table**: The API uses `storytellers` table which doesn't have RLS issue (line 36-62 of profiles/route.ts)

**File Evidence**:
- `/Users/benknight/Code/JusticeHub/src/app/api/empathy-ledger/profiles/route.ts` (lines 66-125)
- `/Users/benknight/Code/JusticeHub/src/app/api/health/empathy-ledger/route.ts` (lines 59-84)

---

### 2. Table Name Inconsistency

**Problem**: Documentation calls it `registered_services`, migrations use `community_programs`

**Evidence**:
- DATA_MODEL.md line 184: "Renamed from `community_programs` to `registered_services` in January 2026"
- Migrations still use `community_programs` table name
- `/Users/benknight/Code/JusticeHub/supabase/migrations/20250126000004_add_empathy_ledger_linking.sql` (line 43)

**Impact**: Confusing for developers reading docs vs schema

**Recommendation**: Either rename table in migration or update docs to match current table name

---

### 3. Incomplete Story Sync

**Problem**: Blog posts have Empathy Ledger linking columns but no sync implementation

**Evidence**:
- `blog_posts.empathy_ledger_story_id` column exists
- No POST route for `/api/admin/sync-empathy-ledger-stories`
- No sync logic in admin sync route (only syncs profiles)

**Impact**: Stories can be read via API but not automatically synced to JusticeHub blog

**Recommendation**: Implement story sync similar to profile sync if needed

---

### 4. Dual Profile Systems

**Problem**: Empathy Ledger has both `profiles` and `storytellers` tables

**Evidence**:
- API routes query `storytellers` table (profiles/route.ts line 36)
- Health check queries `profiles` table (health/route.ts line 62)
- Migration `/Users/benknight/Code/JusticeHub/supabase/migrations/20250120000003_empathy_ledger_integration.sql` creates both tables

**Impact**: Unclear which is source of truth

**Current Behavior**: API routes use `storytellers`, health checks use `profiles` (with RLS error tolerance)

**Recommendation**: Clarify relationship between these tables in documentation

---

### 5. Missing Organization Sync

**Problem**: Organizations have linking columns but no sync route

**Evidence**:
- `organizations.empathy_ledger_org_id` column exists
- `organization_sync_log` table exists
- No sync implementation in admin routes

**Impact**: Organizations must be manually linked

**Recommendation**: Implement organization sync if auto-sync is desired

---

### 6. Sync Type Not Enforced

**Problem**: `sync_type` column ('reference', 'full', 'manual') exists but isn't used by sync logic

**Evidence**:
- Migration defines constraint (20250126000004_add_empathy_ledger_linking.sql line 13)
- Sync route always sets `sync_type = 'full'` (sync-empathy-ledger/route.ts line 111)
- No code checks sync_type to determine sync behavior

**Impact**: Dead column that suggests functionality that doesn't exist

**Recommendation**: 
- Remove column if not needed
- OR implement reference-only linking (don't cache data, just store ID)

---

## Consent & Privacy Model

### Three-Tier Privacy System

Empathy Ledger enforces consent at multiple levels:

#### Level 1: Profile Consent
```typescript
storytellers.justicehub_enabled === true  // Must opt-in
storytellers.is_active === true           // Must be active
```

#### Level 2: Story Consent
```typescript
stories.is_public === true
stories.privacy_level === 'public'
```

#### Level 3: Cultural Safety
```typescript
// Optional checks
stories.requires_elder_approval === true
  → must have stories.elder_approved_at !== null

stories.cultural_warnings.length > 0
  → display warnings before content
```

### Consent Levels (from empathy-ledger.ts)

| Level | Description | JusticeHub Display |
|-------|-------------|-------------------|
| `private` | Only storyteller and org staff | Never |
| `community` | Within organization community | Never |
| `public` | Explicitly consented for public | Yes (if `is_public = true`) |

### Metadata in API Responses

All API routes return consent metadata:

```typescript
{
  consent_info: {
    consent_level: 'justicehub_enabled',
    description: 'All profiles have explicitly opted in to be displayed on JusticeHub'
  }
}
```

For stories:
```typescript
{
  consent_info: {
    is_public: true,
    privacy_level: 'public',
    description: 'All stories are public with explicit consent'
  }
}
```

---

## Recommendations

### High Priority

1. **Fix RLS Recursion**: Work with Empathy Ledger team to fix `profiles` table RLS policy
   - Current workaround is stable but adds complexity
   - Fallback logic adds latency

2. **Document Table Name**: Update DATA_MODEL.md to match actual table name (`community_programs` vs `registered_services`)

3. **Implement Story Sync**: If stories should be cached in JusticeHub blog_posts:
   - Create POST `/api/admin/sync-empathy-ledger-stories`
   - Similar pattern to profile sync
   - Map story fields to blog_post fields

4. **Clarify Profiles vs Storytellers**: Document relationship between these tables
   - Are they duplicates?
   - Is `storytellers` the new table name?
   - Update health checks to use `storytellers` if that's source of truth

### Medium Priority

5. **Implement Organization Sync**: Auto-sync organizations if needed
   - Create POST `/api/admin/sync-empathy-ledger-organizations`
   - Use `organization_sync_log` for audit

6. **Remove or Implement `sync_type`**: Either:
   - Remove column if not needed
   - OR implement reference-only mode (link without caching)

7. **Add Sync Dashboard**: Admin UI to:
   - View sync logs
   - Trigger manual syncs
   - See sync status/errors

8. **Monitor Health Endpoint**: Set up alerting for `/api/health/empathy-ledger`
   - Alert on `unhealthy` status
   - Track latency trends

### Low Priority

9. **Document Cultural Protocols**: Add examples of cultural_warnings usage
   - What warnings are shown?
   - How to display them?

10. **Add Sync Metrics**: Track:
    - Sync frequency
    - Success/failure rates
    - Data drift between systems

---

## Integration Strengths

1. **Consent-First Architecture**: Multiple layers of opt-in prevent unauthorized display
2. **Cultural Safety**: Elder approval and cultural warnings protect sensitive content
3. **Audit Trail**: Sync logs track all changes
4. **Fallback Resilience**: RLS error doesn't break functionality
5. **Flexible Linking**: Can link profiles without duplicating all data
6. **Health Monitoring**: Dedicated health check endpoint

---

## Data Flow Patterns

### Pattern 1: Read-Only Display
```
User visits /community-programs/[id]
  → GET /api/empathy-ledger/profiles?storyteller_id=...
  → Query Empathy Ledger storytellers (or fallback to public_profiles)
  → Display profile with consent badge
```

### Pattern 2: Cached Sync
```
Admin triggers sync
  → POST /api/admin/sync-empathy-ledger
  → Fetch profiles where justicehub_enabled = true
  → Upsert to public_profiles
  → Log to profile_sync_log
  → Update last_synced_at
```

### Pattern 3: Linked Appearances
```
Editor links storyteller to program
  → INSERT INTO profile_appearances
  → Set empathy_ledger_profile_id
  → Set appears_on_type = 'program'
  → Set appears_on_id = program.id
  → Display on program page without full profile sync
```

---

## Testing Checklist

- [ ] Verify RLS fallback works when Empathy Ledger profiles fails
- [ ] Test sync with new profiles (create path)
- [ ] Test sync with existing profiles (update path)
- [ ] Verify consent controls (justicehub_enabled filter)
- [ ] Test cultural warnings display
- [ ] Verify elder approval enforcement
- [ ] Check profile_appearances linking
- [ ] Monitor sync_log entries
- [ ] Test health endpoint under load
- [ ] Verify story consent filters (is_public + privacy_level)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMPATHY LEDGER DATABASE                      │
│                   (External Supabase Instance)                  │
│                                                                 │
│  ┌────────────┐    ┌─────────────┐    ┌──────────────┐         │
│  │storytellers│───▶│   stories   │───▶│organizations │         │
│  │            │    │             │    │              │         │
│  │justicehub_ │    │is_public    │    │indigenous_   │         │
│  │enabled     │    │privacy_level│    │controlled    │         │
│  └────────────┘    └─────────────┘    └──────────────┘         │
│         ▲                  ▲                   ▲                │
└─────────┼──────────────────┼───────────────────┼────────────────┘
          │                  │                   │
          │ READ API         │ READ API          │ READ API
          │ (anon key)       │ (anon key)        │ (anon key)
          ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                  JUSTICEHUB API ROUTES                          │
│                                                                 │
│  GET /api/empathy-ledger/profiles        (✓ VERIFIED)          │
│  GET /api/empathy-ledger/profiles/[id]   (✓ VERIFIED)          │
│  GET /api/empathy-ledger/stories         (✓ VERIFIED)          │
│  POST /api/admin/sync-empathy-ledger     (✓ VERIFIED)          │
│  GET /api/health/empathy-ledger          (✓ VERIFIED)          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
          │                  │                   │
          │ WRITE (admin)    │ WRITE (admin)     │ READ
          ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                   JUSTICEHUB DATABASE                           │
│                  (Primary Supabase Instance)                    │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │public_profiles│ │  blog_posts  │  │organizations │          │
│  │              │  │              │  │              │          │
│  │empathy_ledger│  │empathy_ledger│  │empathy_ledger│          │
│  │_profile_id   │  │_story_id     │  │_org_id       │          │
│  │synced_from_  │  │synced_from_  │  │synced_from_  │          │
│  │empathy_ledger│  │empathy_ledger│  │empathy_ledger│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                                    │                  │
│         └────────────┬───────────────────────┘                  │
│                      ▼                                          │
│            ┌──────────────────┐                                 │
│            │profile_appearances│                                │
│            │                  │                                 │
│            │empathy_ledger_   │                                 │
│            │profile_id        │                                 │
│            │appears_on_type   │                                 │
│            │appears_on_id     │                                 │
│            └──────────────────┘                                 │
│                                                                 │
│  ┌──────────────────┐  ┌────────────────────┐                  │
│  │profile_sync_log  │  │organization_sync_  │                  │
│  │(audit trail)     │  │log (audit trail)   │                  │
│  └──────────────────┘  └────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files Reference

### API Routes
- `/Users/benknight/Code/JusticeHub/src/app/api/empathy-ledger/profiles/route.ts`
- `/Users/benknight/Code/JusticeHub/src/app/api/empathy-ledger/profiles/[id]/route.ts`
- `/Users/benknight/Code/JusticeHub/src/app/api/empathy-ledger/stories/route.ts`
- `/Users/benknight/Code/JusticeHub/src/app/api/admin/sync-empathy-ledger/route.ts`
- `/Users/benknight/Code/JusticeHub/src/app/api/health/empathy-ledger/route.ts`

### Library
- `/Users/benknight/Code/JusticeHub/src/lib/supabase/empathy-ledger.ts`

### Migrations
- `/Users/benknight/Code/JusticeHub/supabase/migrations/001_empathy_ledger_core.sql` (Empathy Ledger schema)
- `/Users/benknight/Code/JusticeHub/supabase/migrations/20250120000003_empathy_ledger_integration.sql` (Empathy Ledger schema)
- `/Users/benknight/Code/JusticeHub/supabase/migrations/20250126000004_add_empathy_ledger_linking.sql` (JusticeHub linking)
- `/Users/benknight/Code/JusticeHub/supabase/migrations/20250126000008_add_empathy_content_sync.sql` (Blog posts linking)
- `/Users/benknight/Code/JusticeHub/supabase/migrations/20260111_create_profile_appearances.sql` (Appearances table)
- `/Users/benknight/Code/JusticeHub/supabase/migrations/20250123000001_create_unified_profiles_system.sql` (Public profiles)

### Documentation
- `/Users/benknight/Code/JusticeHub/docs/DATA_MODEL.md`

---

## Summary Statistics

**API Routes**: 5 endpoints
**Linking Tables**: 5 (public_profiles, blog_posts, organizations, community_programs, profile_appearances)
**Audit Tables**: 2 (profile_sync_log, organization_sync_log)
**Known Issues**: 6 (RLS recursion, table naming, incomplete story sync, dual profiles, missing org sync, unused sync_type)
**Consent Checks**: 3 levels (profile opt-in, story privacy, cultural safety)
**Field Mappings**: 12 profile fields, 11 story fields

**Overall Assessment**: Well-architected integration with strong consent controls and audit trails, but has operational issues (RLS recursion, incomplete syncs) that should be addressed.
