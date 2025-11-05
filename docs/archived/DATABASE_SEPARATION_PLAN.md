# Database Separation Plan - Action Required

## Current Situation ✅ CONFIRMED

You have **ONE database** with **BOTH platforms mixed together**:

**Database:** `tednluwflfhxyucgwigh.supabase.co`

**Current Tables:**
```
✅ articles (37 rows)           → JusticeHub stories/articles
✅ community_programs (6 rows)  → JusticeHub programs
✅ services (511 rows)          → JusticeHub service finder
✅ organizations (451 rows)     → JusticeHub organizations
✅ storytellers (226 rows)      → Timothy Ledger users ⚠️
✅ projects (11 rows)           → Timothy Ledger projects ⚠️
✅ entries (0 rows)             → Timothy Ledger entries ⚠️
✅ users (2 rows)               → Shared/Auth users ❓
```

**Problem:** Timothy Ledger tables (storytellers, projects, entries) are mixed with JusticeHub tables!

## What You Need: Two Separate Databases

### Database 1: JusticeHub (Keep Current)
**Instance:** `tednluwflfhxyucgwigh.supabase.co` (keep using this)

**Tables to KEEP:**
- ✅ `articles` (37 rows) - JusticeHub stories
- ✅ `community_programs` (6 rows) - Community programs
- ✅ `services` (511 rows) - Service directory
- ✅ `organizations` (451 rows) - Service providers

**What it's for:**
- Public JusticeHub platform (justicehub.org)
- Community programs directory
- Service finder
- Stories and articles

### Database 2: Timothy Ledger (Need to Create)
**Instance:** NEW Supabase project (need to create)

**Tables to MIGRATE:**
- 📝 `storytellers` (226 rows) - Move here
- 📝 `projects` (11 rows) - Move here
- 📝 `entries` (0 rows) - Move here

**What it's for:**
- Personal storytelling platform
- Individual user accounts
- Personal projects and entries
- Separate subdomain (storyteller.justicehub.org)

## The Plan: 3 Simple Steps

### Step 1: Create New Timothy Ledger Database ⏱️ 10 minutes

**Action:** Create a new Supabase project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Name:** Timothy Ledger
   - **Database Password:** (generate strong password)
   - **Region:** Sydney (or closest to you)
4. Wait for setup to complete (~2 minutes)
5. Copy the new credentials:
   - **Project URL:** `https://[new-ref].supabase.co`
   - **Anon Key:** `eyJ...` (from Settings → API)
   - **Service Role Key:** `eyJ...` (from Settings → API)

### Step 2: Migrate Timothy Ledger Schema & Data ⏱️ 30 minutes

**Action:** Export and import Timothy Ledger tables

**2a. Export Schema from Current Database**

In current database SQL Editor, run:
```sql
-- Get CREATE TABLE statements for Timothy Ledger tables
SELECT
  'CREATE TABLE ' || table_name || ' (...);' as create_statement
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('storytellers', 'projects', 'entries');
```

Or use Supabase Dashboard:
- Go to Table Editor
- Click each table (storytellers, projects, entries)
- Note the structure
- Recreate in new database

**2b. Export Data**

```sql
-- Export storytellers
COPY (SELECT * FROM storytellers) TO STDOUT WITH CSV HEADER;

-- Export projects
COPY (SELECT * FROM projects) TO STDOUT WITH CSV HEADER;

-- Export entries
COPY (SELECT * FROM entries) TO STDOUT WITH CSV HEADER;
```

**2c. Import to New Database**

In the NEW Timothy Ledger database:
1. Create the tables (same structure)
2. Import the CSV data
3. Verify row counts match

### Step 3: Update Environment Variables ⏱️ 5 minutes

**Action:** Add Timothy Ledger config to `.env.local`

Add these lines to your `.env.local` file:

```bash
# =====================================
# TIMOTHY LEDGER DATABASE (Storytelling Platform)
# =====================================
TIMOTHY_LEDGER_SUPABASE_URL=https://[new-ref].supabase.co
TIMOTHY_LEDGER_SUPABASE_ANON_KEY=[paste-anon-key]
TIMOTHY_LEDGER_SERVICE_KEY=[paste-service-role-key]
```

Keep the existing JusticeHub variables as they are:
```bash
# =====================================
# JUSTICEHUB DATABASE (Main Platform)
# =====================================
NEXT_PUBLIC_SUPABASE_URL=https://tednluwflfhxyucgwigh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## After Migration: Code Updates

### Create Separate Supabase Clients

**Create:** `src/lib/supabase/justicehub.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

export const justiceHubSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**Create:** `src/lib/supabase/timothy-ledger.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

export const timothyLedgerSupabase = createClient(
  process.env.TIMOTHY_LEDGER_SUPABASE_URL!,
  process.env.TIMOTHY_LEDGER_SUPABASE_ANON_KEY!
);
```

### Update Imports Throughout Code

**For JusticeHub features** (programs, articles, services):
```typescript
// OLD
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(...);

// NEW
import { justiceHubSupabase } from '@/lib/supabase/justicehub';
// Use justiceHubSupabase instead of supabase
```

**For Timothy Ledger features** (storytellers, projects):
```typescript
// NEW
import { timothyLedgerSupabase } from '@/lib/supabase/timothy-ledger';
// Use timothyLedgerSupabase for storytelling platform
```

### Files That Need Updating

**JusticeHub (no change needed, already using correct DB):**
- ✅ `src/app/community-programs/page.tsx`
- ✅ `src/app/community-programs/[id]/page.tsx`
- ✅ `src/app/community-programs/add/page.tsx`
- ✅ `src/app/services/page.tsx`
- ✅ `src/app/stories/page.tsx`

**Timothy Ledger (need to update to use new client):**
- 📝 Any files accessing `storytellers` table
- 📝 Any files accessing `projects` table
- 📝 Any files accessing `entries` table

## Quick Decision Matrix

### Option A: Do Migration Now (Recommended if Timothy Ledger is actively used)
**Timeline:** ~45 minutes
**Benefit:** Clean separation, proper architecture
**Risk:** Need to test thoroughly after migration

### Option B: Fresh Start (Recommended if Timothy Ledger is not launched yet)
**Timeline:** ~15 minutes
**Benefit:** No migration needed, clean slate
**Risk:** Lose existing 226 storytellers + 11 projects

### Option C: Leave As-Is (Not Recommended)
**Timeline:** 0 minutes
**Benefit:** No work required
**Risk:** Architecture issues, scalability problems, confused codebase

## My Recommendation

Based on what I see:
- 226 storytellers
- 11 projects
- 0 entries

**If Timothy Ledger is not actively used yet:**
→ **Option B** (Fresh start, new database, no migration)

**If those 226 storytellers are real users:**
→ **Option A** (Do proper migration to preserve data)

## What About the Programs We Just Added?

**Good news!** The community programs system we just built uses the **JusticeHub tables**, which are staying in the current database. Nothing changes for:
- ✅ Community programs
- ✅ Stories/articles
- ✅ Service finder
- ✅ The web form we just created

**Only Timothy Ledger** (storytelling platform) needs to move to separate database.

## Next Actions

### Immediate (You decide):
1. **Decide:** Do you need to preserve the 226 storytellers data?
   - YES → Follow Step 1-3 (Migration)
   - NO → Just create new database for future Timothy Ledger use

2. **Tell me your decision** and I'll help with next steps

### After Decision:
- If migrating: I'll help create migration scripts
- If fresh start: I'll help set up new database
- Either way: Update environment variables together

## Quick Start (Fresh Start Approach)

If you want to just create a new Timothy Ledger database now:

```bash
# 1. Create new Supabase project (manual, via dashboard)
# 2. Add to .env.local:

TIMOTHY_LEDGER_SUPABASE_URL=https://[new-ref].supabase.co
TIMOTHY_LEDGER_SUPABASE_ANON_KEY=[key]
TIMOTHY_LEDGER_SERVICE_KEY=[key]

# 3. Create client files:
# - src/lib/supabase/justicehub.ts
# - src/lib/supabase/timothy-ledger.ts

# 4. Done! Both platforms now have separate databases
```

## Summary

**Current:**
```
One Database (tednluwflfhxyucgwigh)
├── JusticeHub tables (articles, programs, services, orgs)
└── Timothy Ledger tables (storytellers, projects, entries)
```

**After Separation:**
```
JusticeHub Database (tednluwflfhxyucgwigh)
├── articles
├── community_programs
├── services
└── organizations

Timothy Ledger Database (new instance)
├── storytellers
├── projects
└── entries
```

**Impact on Recent Work:**
- ✅ Community programs: No change (stays in JusticeHub DB)
- ✅ Web form: No change (uses JusticeHub DB)
- ✅ Stories/articles: No change (stays in JusticeHub DB)

---

**Ready to proceed?** Tell me:
1. Do you need to preserve the storytellers data?
2. Is Timothy Ledger actively being used?
3. Should we do fresh start or migration?

Then I'll help you execute the plan! 🚀
