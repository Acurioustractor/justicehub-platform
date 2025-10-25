# Database Architecture - JusticeHub Platform

## Current Situation (Needs Fixing)

Currently, **everything is in ONE Supabase database**:
- **Instance**: `tednluwflfhxyucgwigh.supabase.co`
- **Used for**:
  - JusticeHub content (articles, services, programs)
  - Timothy Ledger storytelling platform data
  - All other platform features

**Problem:** This mixes two different platforms in one database.

## Correct Architecture (What We Need)

### Database 1: **JusticeHub Database** 🏛️
**Purpose:** All JusticeHub public platform data

**Should contain:**
- ✅ `community_programs` - Community programs database
- ✅ `articles` - Stories and articles
- ✅ `services` - Youth justice services directory
- ✅ `organizations` - Service provider organizations
- ✅ Platform metadata (categories, tags, etc.)

**Use cases:**
- Public-facing content on justicehub.org
- Service finder searches
- Community programs directory
- Stories and articles
- Read-heavy, public data

### Database 2: **Timothy Ledger Database** 👤
**Purpose:** Personal storytelling platform (separate product)

**Should contain:**
- 📝 `storytellers` - Individual storytellers (users)
- 📝 `projects` - Their personal projects
- 📝 `entries` - Journal/story entries
- 📝 `media` - Personal media uploads
- 📝 User authentication and profiles

**Use cases:**
- Personal storytelling journeys
- Private user data
- Individual project tracking
- Write-heavy, private data
- Separate subdomain: storyteller.justicehub.org (or similar)

## Current Database Contents

**What's currently in `tednluwflfhxyucgwigh` database:**

Looking at the code, we've been adding:
- ✅ `articles` table (JusticeHub stories)
- ✅ `community_programs` table (JusticeHub programs)
- ✅ `services` table (JusticeHub service finder)

**Likely also contains:**
- ❓ Timothy Ledger tables (mixed in)
- ❓ Other tables we need to identify

## Migration Plan

### Phase 1: Identify Current Tables ✅

**Action:** Query current database to see all tables

```sql
-- Run this in Supabase SQL Editor to see all tables:
SELECT
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Categorize each table:**
- JusticeHub tables (keep here)
- Timothy Ledger tables (need to migrate)
- Shared tables (need to decide)

### Phase 2: Create Separate Timothy Ledger Database

**Action:** Create new Supabase project for Timothy Ledger

**Steps:**
1. Go to Supabase Dashboard
2. Create New Project → "Timothy Ledger Storytelling"
3. Choose region (same as current: closest to Australia)
4. Note new project URL and keys

**Result:**
- New database: `[new-ref].supabase.co`
- Fresh database with no JusticeHub data
- Separate billing and management

### Phase 3: Define Schema Separation

**JusticeHub Database** (keep using `tednluwflfhxyucgwigh`):
```sql
-- Core content tables
- articles
- community_programs
- services
- organizations
- categories
- tags
- locations

-- Supporting tables
- article_categories
- program_tags
- service_tags

-- New migrations we've added
- programs_with_stories (view)
```

**Timothy Ledger Database** (new instance):
```sql
-- User tables
- storytellers (user profiles)
- storyteller_auth (authentication)

-- Content tables
- projects (storyteller projects)
- entries (story entries)
- media (uploaded files)

-- Relationships
- project_collaborators
- entry_tags
- entry_media
```

### Phase 4: Update Environment Variables

**Update `.env.local` to have separate configs:**

```bash
# =====================================
# JUSTICEHUB DATABASE (Main Platform)
# =====================================
NEXT_PUBLIC_SUPABASE_URL=https://tednluwflfhxyucgwigh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=<service-role-key>

# Used by:
# - Community programs
# - Articles/Stories
# - Service finder
# - All public-facing content

# =====================================
# TIMOTHY LEDGER DATABASE (Storytelling Platform)
# =====================================
TIMOTHY_LEDGER_SUPABASE_URL=https://[new-ref].supabase.co
TIMOTHY_LEDGER_SUPABASE_ANON_KEY=<new-anon-key>
TIMOTHY_LEDGER_SERVICE_KEY=<new-service-key>

# Used by:
# - Personal storyteller accounts
# - Individual projects
# - Private journals
# - User authentication for storytelling platform
```

### Phase 5: Update Code References

**Create separate Supabase clients:**

```typescript
// src/lib/supabase/justicehub.ts
import { createClient } from '@supabase/supabase-js';

export const justiceHubSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// src/lib/supabase/timothy-ledger.ts
import { createClient } from '@supabase/supabase-js';

export const timothyLedgerSupabase = createClient(
  process.env.TIMOTHY_LEDGER_SUPABASE_URL!,
  process.env.TIMOTHY_LEDGER_SUPABASE_ANON_KEY!
);
```

**Update imports throughout codebase:**

```typescript
// OLD (everywhere currently):
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(...);

// NEW (for JusticeHub features):
import { justiceHubSupabase } from '@/lib/supabase/justicehub';

// NEW (for Timothy Ledger features):
import { timothyLedgerSupabase } from '@/lib/supabase/timothy-ledger';
```

### Phase 6: Migrate Timothy Ledger Data (If Needed)

**If Timothy Ledger tables already exist in current DB:**

1. Export data from current database
2. Create schema in new database
3. Import data to new database
4. Update all Timothy Ledger code to use new client
5. Test thoroughly
6. Drop Timothy Ledger tables from old database

## Why This Matters

### 1. **Separation of Concerns**
- JusticeHub = Public platform
- Timothy Ledger = Personal storytelling tool
- Different purposes, different data models

### 2. **Security**
- JusticeHub: Mostly public data, read-heavy
- Timothy Ledger: Private user data, requires auth
- Separate RLS policies for each

### 3. **Scalability**
- Each database can scale independently
- Different read/write patterns
- Independent backups and recovery

### 4. **Development**
- Clearer codebase organization
- Easier to understand what data goes where
- Prevents accidental cross-contamination

### 5. **Billing & Management**
- Separate Supabase projects
- Track usage independently
- Different access controls

## Immediate Next Steps

### Step 1: Inventory Current Database (Do This First!)

```bash
# Run this to see what tables currently exist:
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx -e "
import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.YJSF_SUPABASE_SERVICE_KEY || ''
  );

  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Current tables in database:');
    data.forEach(t => console.log('  -', t.table_name));
  }
}

main();
"
```

**Or run directly in Supabase SQL Editor:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Step 2: Categorize Tables

For each table, decide:
- ✅ JusticeHub (keep in current DB)
- 📝 Timothy Ledger (migrate to new DB)
- ❓ Unsure (need to investigate)

### Step 3: Create Migration Plan

Based on inventory, create detailed plan for:
- Which tables to migrate
- What data to move
- Which code to update
- Testing strategy

## Recommended Approach

### Option A: Clean Separation (Recommended)

**If Timothy Ledger hasn't launched yet:**
1. Create new Timothy Ledger database now
2. Build Timothy Ledger features in new database from scratch
3. Keep JusticeHub in current database
4. Clean separation from day 1

**Pros:**
- No migration needed
- Clean architecture
- No risk of data loss

**Cons:**
- Need to set up new database config

### Option B: Migration Required

**If Timothy Ledger data already exists:**
1. Export Timothy Ledger tables
2. Create new database
3. Import to new database
4. Update code references
5. Test thoroughly
6. Switch over

**Pros:**
- Preserves existing data
- Eventually clean

**Cons:**
- Migration complexity
- Testing required
- Potential downtime

## Decision Time

**Questions to answer:**

1. **Does Timothy Ledger have data in the current database?**
   - If NO → Option A (clean separation)
   - If YES → Option B (migration needed)

2. **Is Timothy Ledger actively used?**
   - If NO → Safe to create new DB
   - If YES → Need careful migration

3. **What tables currently exist?**
   - Need to run inventory query above

## Visual Architecture

```
┌─────────────────────────────────────────┐
│       JusticeHub Platform (Web)         │
│         justicehub.org                  │
└────────┬───────────────────────┬────────┘
         │                       │
         ↓                       ↓
┌─────────────────┐   ┌──────────────────────┐
│  JusticeHub DB  │   │ Timothy Ledger DB    │
│                 │   │                      │
│  - articles     │   │  - storytellers      │
│  - programs     │   │  - projects          │
│  - services     │   │  - entries           │
│  - orgs         │   │  - media             │
│                 │   │                      │
│  Public data    │   │  Private user data   │
│  Read-heavy     │   │  Write-heavy         │
└─────────────────┘   └──────────────────────┘
```

## Next Action Items

- [ ] Run inventory query to see current tables
- [ ] Categorize tables (JusticeHub vs Timothy Ledger)
- [ ] Determine if Timothy Ledger has existing data
- [ ] Choose Option A or B
- [ ] Create migration plan if needed
- [ ] Update environment variables
- [ ] Create separate Supabase clients
- [ ] Update code references
- [ ] Test thoroughly

---

**Let's start with the inventory.** Run the SQL query above to see what tables currently exist, and we can make a plan from there.
