# Database Architecture - JusticeHub + Empathy Ledger

## Correct Understanding ✅

You have **TWO separate platforms** that need **TWO separate Supabase databases**:

### Platform 1: **JusticeHub** 🏛️
**Purpose:** Public youth justice platform

**What it does:**
- Public community programs directory
- Youth justice service finder
- Stories and articles
- Research and advocacy
- Public-facing content

**Current Status:** ✅ Using `tednluwflfhxyucgwigh.supabase.co`

### Platform 2: **Empathy Ledger** 📖
**Purpose:** Multi-tenant cultural heritage storytelling platform

**What it does:**
- **Indigenous-led** storytelling platform
- **Cultural data sovereignty** (OCAP® principles)
- **Multi-tenant architecture** - Each organization gets isolated space
- Personal storytelling accounts (storytellers)
- Projects and story entries
- **Cultural protocols** and consent management
- **Private, sensitive cultural data**

**Current Status:** ⚠️ Tables mixed into JusticeHub database (needs separation)

## Why This Matters

### 1. **Completely Different Purposes**
- **JusticeHub:** Public platform for youth justice advocacy
- **Empathy Ledger:** Private platform for Indigenous cultural heritage

### 2. **Different Data Sensitivity**
- **JusticeHub:** Mostly public data (programs, services, articles)
- **Empathy Ledger:** **Highly sensitive cultural data** requiring OCAP® compliance

### 3. **Different Architecture**
- **JusticeHub:** Simple read-heavy public content
- **Empathy Ledger:** Complex multi-tenant with RLS, cultural protocols, consent tracking

### 4. **Different Security Requirements**
- **JusticeHub:** Standard web security
- **Empathy Ledger:** **Cultural data sovereignty**, Indigenous governance, OCAP® principles

## Current Database Status

**What's currently in `tednluwflfhxyucgwigh` (JusticeHub database):**

```
JusticeHub Tables (Correct - Should stay):
  ✅ articles (37 rows) - JusticeHub stories
  ✅ community_programs (6 rows) - Community programs
  ✅ services (511 rows) - Service directory
  ✅ organizations (451 rows) - Service providers

Empathy Ledger Tables (WRONG - Should be separate):
  ⚠️ storytellers (226 rows) - Empathy Ledger users
  ⚠️ projects (11 rows) - Empathy Ledger projects
  ⚠️ entries (0 rows) - Empathy Ledger story entries
```

**Problem:** Empathy Ledger data is mixed with JusticeHub data!

## The Correct Architecture

### JusticeHub Database (Current: `tednluwflfhxyucgwigh`)
**Keep using for:**
```sql
-- Public content tables
- articles
- community_programs
- services
- organizations
- categories
- tags
- locations
```

**Environment variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://tednluwflfhxyucgwigh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[current-key]
```

### Empathy Ledger Database (Need to create NEW)
**Use for:**
```sql
-- Multi-tenant tables
- organizations (tenant definitions)
- storytellers (user accounts per tenant)
- projects (projects per storyteller)
- entries (story entries)
- cultural_metadata (cultural protocols)
- consent_records (OCAP® compliance)
- access_policies (RLS policies)
```

**Environment variables:**
```bash
EMPATHY_LEDGER_SUPABASE_URL=https://[new-ref].supabase.co
EMPATHY_LEDGER_SUPABASE_ANON_KEY=[new-key]
EMPATHY_LEDGER_SERVICE_KEY=[new-service-key]
```

## Critical Differences: Empathy Ledger Architecture

### Multi-Tenant with RLS (Row Level Security)

Empathy Ledger requires **complex RLS policies** for:
- **Tenant isolation** (each organization's data is completely separate)
- **Cultural protocols** (elder approval, consent tracking)
- **OCAP® principles** (Ownership, Control, Access, Possession)
- **Role-based access** (platform admin, org admin, elder, community member, storyteller)

Example RLS policy:
```sql
-- Only storytellers can see their own organization's data
CREATE POLICY "storytellers_own_org" ON storytellers
FOR SELECT USING (
  auth.uid() = user_id
  AND organization_id = (
    SELECT organization_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Cultural elders can approve stories
CREATE POLICY "elders_cultural_review" ON entries
FOR UPDATE USING (
  user_has_role(auth.uid(), 'cultural_elder')
  AND organization_id = user_organization(auth.uid())
);
```

### Shared vs Separate

**Why NOT shared database:**
1. **Security:** Cultural data should not mix with public data
2. **Compliance:** OCAP® requires isolated data governance
3. **Performance:** Different access patterns (public vs multi-tenant)
4. **Billing:** Separate projects = separate billing/management
5. **RLS Complexity:** Empathy Ledger needs complex policies JusticeHub doesn't

## Migration Plan

### Phase 1: Create Empathy Ledger Database ⏱️ 15 minutes

**Action:** Create new Supabase project for Empathy Ledger

1. **Go to Supabase Dashboard**
2. **Create New Project**
   - Name: "Empathy Ledger"
   - Region: Sydney (or closest to your cultural communities)
   - Password: (strong password)
3. **Copy credentials:**
   - Project URL: `https://[new-ref].supabase.co`
   - Anon key
   - Service role key

### Phase 2: Set Up Empathy Ledger Schema ⏱️ 30 minutes

**Action:** Create proper multi-tenant schema with RLS

Based on Empathy Ledger architecture docs, create:
```sql
-- Organizations (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cultural_protocols JSONB,
  ocap_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storytellers (users per organization)
CREATE TABLE storytellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  display_name TEXT NOT NULL,
  cultural_role TEXT,
  consent_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects (per storyteller)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storyteller_id UUID REFERENCES storytellers(id),
  organization_id UUID REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  cultural_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES storytellers(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entries (story entries)
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  storyteller_id UUID REFERENCES storytellers(id),
  organization_id UUID REFERENCES organizations(id),
  content TEXT,
  media_urls TEXT[],
  cultural_sensitivity TEXT,
  requires_elder_approval BOOLEAN DEFAULT TRUE,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (enforce OCAP®)
ALTER TABLE storytellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Example RLS policy
CREATE POLICY "storytellers_own_org_only" ON storytellers
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);
```

### Phase 3: Migrate Existing Data ⏱️ 30 minutes

**If you want to preserve the 226 storytellers:**

1. **Export from JusticeHub DB:**
```sql
-- In current database
COPY (SELECT * FROM storytellers) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM projects) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM entries) TO STDOUT WITH CSV HEADER;
```

2. **Import to Empathy Ledger DB:**
- Copy CSV files
- Import into new database
- Verify row counts match

3. **Create organization records** for existing storytellers

**If starting fresh:**
- Skip migration
- 226 storytellers likely test data
- Start with clean Empathy Ledger instance

### Phase 4: Update Code References ⏱️ 1 hour

**Create separate Supabase clients:**

```typescript
// src/lib/supabase/justicehub.ts
import { createClient } from '@supabase/supabase-js';

export const justiceHubSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// src/lib/supabase/empathy-ledger.ts
import { createClient } from '@supabase/supabase-js';

export const empathyLedgerSupabase = createClient(
  process.env.EMPATHY_LEDGER_SUPABASE_URL!,
  process.env.EMPATHY_LEDGER_SUPABASE_ANON_KEY!
);
```

**Update imports:**
- JusticeHub features → use `justiceHubSupabase`
- Empathy Ledger features → use `empathyLedgerSupabase`

### Phase 5: Drop Old Tables from JusticeHub DB

**After migration verified:**
```sql
-- In JusticeHub database (tednluwflfhxyucgwigh)
DROP TABLE IF EXISTS entries;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS storytellers;
```

## What We Just Built (Community Programs)

**Good news:** Everything we built today uses **JusticeHub tables**, which stay in the current database.

**No changes needed for:**
- ✅ Community programs system
- ✅ Web form at `/community-programs/add`
- ✅ Program pages
- ✅ Story-program connections
- ✅ All documentation

**The programs system is 100% complete and working!**

## Key Insights About Empathy Ledger

### 1. **Cultural Sovereignty Focus**
- Designed for **Indigenous communities**
- **OCAP® principles** built into database
- Cultural protocols and consent tracking
- Elder approval workflows

### 2. **Multi-Tenant Architecture**
- Each organization is a "tenant"
- Complete data isolation via RLS
- Subdomain-based routing (`org1.empathyledger.com`)
- Per-org cultural protocols

### 3. **Completely Different from JusticeHub**
- JusticeHub = Public advocacy platform
- Empathy Ledger = Private cultural platform
- Different users, different purposes, different architecture

### 4. **Requires Separate Database**
- Complex RLS policies
- Cultural data governance
- OCAP® compliance
- Multi-tenant isolation

## Recommended Action Plan

### Option A: Clean Separation (Recommended) ⏱️ 1-2 hours

1. **Create new Empathy Ledger database** (15 min)
2. **Set up proper multi-tenant schema with RLS** (30 min)
3. **Don't migrate test data** - start fresh (0 min)
4. **Update environment variables** (5 min)
5. **Create separate Supabase clients** (15 min)
6. **Update Empathy Ledger code** to use new client (30 min)
7. **Drop old tables** from JusticeHub DB (5 min)
8. **Test both platforms** (15 min)

**Result:** Clean architecture, proper separation, OCAP® compliant

### Option B: Migration Required (If data is real) ⏱️ 2-3 hours

Same as Option A, but add:
- Export data from old database
- Import to new database
- Verify data integrity
- Create organization records for storytellers

## Environment Variables Setup

**Update `.env.local`:**

```bash
# =====================================
# JUSTICEHUB DATABASE (Public Platform)
# =====================================
NEXT_PUBLIC_SUPABASE_URL=https://tednluwflfhxyucgwigh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JUSTICEHUB_SERVICE_KEY=eyJ...

# Used by:
# - Community programs
# - Service finder
# - Articles/stories
# - Public content

# =====================================
# EMPATHY LEDGER DATABASE (Cultural Platform)
# =====================================
EMPATHY_LEDGER_SUPABASE_URL=https://[new-ref].supabase.co
EMPATHY_LEDGER_SUPABASE_ANON_KEY=[new-anon-key]
EMPATHY_LEDGER_SERVICE_KEY=[new-service-key]

# Used by:
# - Multi-tenant storytelling
# - Cultural heritage preservation
# - OCAP® compliance
# - Indigenous data sovereignty
```

## Visual Architecture

```
┌─────────────────────────────────────────────┐
│         JusticeHub Platform                 │
│       (Public Youth Justice)                │
└───────────────┬─────────────────────────────┘
                │
                ↓
┌───────────────────────────────────────────┐
│    JusticeHub Database                    │
│    (tednluwflfhxyucgwigh.supabase.co)   │
│                                           │
│  - articles (stories)                     │
│  - community_programs                     │
│  - services                               │
│  - organizations                          │
│                                           │
│  Public data, read-heavy                  │
└───────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│        Empathy Ledger Platform              │
│  (Cultural Heritage Storytelling)           │
└───────────────┬─────────────────────────────┘
                │
                ↓
┌───────────────────────────────────────────┐
│    Empathy Ledger Database                │
│    ([new-ref].supabase.co)               │
│                                           │
│  - organizations (tenants)                │
│  - storytellers (users per org)           │
│  - projects (per storyteller)             │
│  - entries (story entries)                │
│  - cultural_metadata                      │
│  - consent_records                        │
│                                           │
│  Multi-tenant, RLS enforced, OCAP®        │
│  Private cultural data, write-heavy       │
└───────────────────────────────────────────┘
```

## Next Steps

### Immediate Actions:

1. **Confirm:** Are the 226 storytellers real users or test data?
2. **Decide:** Option A (clean start) or Option B (migration)?
3. **Create:** New Empathy Ledger Supabase project
4. **Set up:** Proper multi-tenant schema with RLS
5. **Update:** Environment variables
6. **Create:** Separate Supabase clients
7. **Test:** Both platforms work independently

### Questions to Answer:

1. Is Empathy Ledger actively being used by Indigenous communities?
2. Are those 226 storytellers real users or test accounts?
3. Do you have an Empathy Ledger frontend deployment?
4. Should Empathy Ledger have its own repository/codebase?

---

## Summary

- ✅ **JusticeHub** = Public youth justice platform (current DB is fine)
- ✅ **Empathy Ledger** = Cultural storytelling platform (needs own DB)
- ⚠️ Currently mixed in one database (wrong)
- 🎯 Need to separate for proper architecture
- 📖 Empathy Ledger requires complex multi-tenant RLS setup
- 🔒 Cultural data sovereignty requires isolation
- ✅ Community programs system we built is fine (JusticeHub)

**What do you want to do next?** 🚀
