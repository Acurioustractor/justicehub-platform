# Empathy Ledger Integration - Implementation Status

## Overview

This document tracks the implementation status of the Empathy Ledger ↔ JusticeHub integration, which allows people to control their data in Empathy Ledger and have it automatically sync to JusticeHub with consent.

## ✅ Completed

### 1. Documentation
- ✅ **[EMPATHY_LEDGER_INTEGRATION.md](./EMPATHY_LEDGER_INTEGRATION.md)** - Complete technical integration plan with architecture and phases
- ✅ **[PROFILE_FLAGGING_SYSTEM.md](./PROFILE_FLAGGING_SYSTEM.md)** - Detailed two-way flagging system specification
- ✅ **[MANUAL_DATABASE_STEPS.md](./MANUAL_DATABASE_STEPS.md)** - SQL for manual database setup
- ✅ **[EMPATHY_LEDGER_SETUP_GUIDE.md](./EMPATHY_LEDGER_SETUP_GUIDE.md)** - Step-by-step user guide
- ✅ **[YOUTH_JUSTICE_SHOWCASE_STRATEGY.md](./YOUTH_JUSTICE_SHOWCASE_STRATEGY.md)** - Overall strategy document

### 2. Database Schemas
- ✅ SQL migration created: `/supabase/migrations/20250126000004_add_empathy_ledger_linking.sql`
- ✅ Manual SQL ready for both databases in `MANUAL_DATABASE_STEPS.md`

**JusticeHub Columns** (SQL ready, needs manual execution):
```sql
public_profiles:
  - empathy_ledger_profile_id (UUID)
  - synced_from_empathy_ledger (boolean)
  - sync_type (text: 'reference', 'full', 'manual')
  - last_synced_at (timestamp)

organizations:
  - empathy_ledger_org_id (UUID)
  - synced_from_empathy_ledger (boolean)
  - last_synced_at (timestamp)

community_programs:
  - empathy_ledger_project_id (UUID)
  - synced_from_empathy_ledger (boolean)
  - last_synced_at (timestamp)

profile_sync_log (new table)
organization_sync_log (new table)
```

**Empathy Ledger Columns** (SQL ready, needs manual execution):
```sql
profiles:
  - justicehub_enabled (boolean)
  - justicehub_role (text)
  - justicehub_featured (boolean)
  - justicehub_synced_at (timestamp)

organizations:
  - justicehub_enabled (boolean)
  - justicehub_synced_at (timestamp)

projects:
  - justicehub_enabled (boolean)
  - justicehub_program_type (text)
  - justicehub_synced_at (timestamp)
```

### 3. Integration Code
- ✅ **Empathy Ledger Client**: `/src/lib/supabase/empathy-ledger.ts` (already existed)
  - Connection to Empathy Ledger Supabase
  - Helper functions for stories, organizations, profiles, projects
  - Cultural protocol utilities

- ✅ **Profile Sync Script**: `/src/scripts/sync-empathy-ledger-profiles.ts`
  - Fetches flagged profiles from Empathy Ledger
  - Creates/updates profiles in JusticeHub
  - Generates URL-friendly slugs
  - Logs all operations to audit table
  - Comprehensive error handling
  - Detailed console output

- ✅ **Schema Verification Script**: `/src/scripts/verify-empathy-ledger-schema.ts`
  - Checks if database columns exist
  - Verifies both JusticeHub and Empathy Ledger schemas
  - Lists flagged profiles

- ✅ **API Endpoint**: `/src/app/api/admin/sync-empathy-ledger/route.ts`
  - Admin-only sync endpoint
  - Returns sync statistics (created, updated, failed)
  - Comprehensive error handling
  - Audit logging

### 4. Admin UI
- ✅ **Admin Profiles Page**: `/src/app/admin/profiles/page.tsx` (already exists)
  - Shows all profiles with filters
  - Stats dashboard
  - Profile table with connections
- ⏳ **Needs Extension**: Add Empathy Ledger sync section and "Sync Now" button

## ⏳ Pending (In Order)

### 1. **Manual Database Setup** (CRITICAL - BLOCKS EVERYTHING ELSE)

You must run the SQL manually in Supabase SQL Editor:

**Step 1: JusticeHub Database**
1. Go to https://supabase.com/dashboard/project/tednluwflfhxyucgwigh
2. Click "SQL Editor" → "New Query"
3. Copy SQL from `docs/MANUAL_DATABASE_STEPS.md` Step 1
4. Run it

**Step 2: Empathy Ledger Database**
1. Go to https://supabase.com/dashboard/project/yvnuayzslukamizrlhwb
2. Click "SQL Editor" → "New Query"
3. Copy SQL from `docs/MANUAL_DATABASE_STEPS.md` Step 2
4. Run it

**Step 3: Flag Test Profiles**
1. Still in Empathy Ledger SQL Editor
2. Find profiles to flag:
   ```sql
   SELECT id, display_name, bio FROM profiles ORDER BY display_name LIMIT 20;
   ```
3. Flag them (replace IDs with actual ones):
   ```sql
   UPDATE profiles
   SET
     justicehub_enabled = true,
     justicehub_role = 'founder',  -- or 'leader', 'advocate', etc.
     justicehub_featured = true
   WHERE id IN (
     'actual-profile-id-1',
     'actual-profile-id-2'
   );
   ```

### 2. **Test the Sync**

Once database columns are added:

```bash
# Run the sync script
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/sync-empathy-ledger-profiles.ts
```

Expected output:
```
🔄 Syncing profiles from Empathy Ledger to JusticeHub...

Found 2 profiles flagged for JusticeHub

✨ Created: Kristy Howden (founder)
✨ Created: Tanya Smith (leader)

📊 Sync Summary:
   ✨ Created: 2
   ✅ Updated: 0
   ❌ Failed: 0
   📝 Total: 2

🎉 Sync completed successfully!
👉 View profiles at: http://localhost:4000/people
```

### 3. **Extend Admin UI**

Add Empathy Ledger section to `/src/app/admin/profiles/page.tsx`:

```tsx
// Add filter for Empathy Ledger profiles
<Link
  href="/admin/profiles?filter=empathy-ledger"
  className={`px-4 py-2 font-bold text-sm border-2 border-black transition-colors ${
    filter === 'empathy-ledger' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
  }`}
>
  Empathy Ledger Synced
</Link>

// Add "Sync Now" button
<button
  onClick={triggerSync}
  className="px-6 py-3 bg-yellow-600 text-white font-bold border-2 border-black hover:bg-yellow-700"
>
  <RefreshCw className="inline-block h-5 w-5 mr-2" />
  Sync from Empathy Ledger
</button>

// Add sync status column to table
<td className="px-4 py-4">
  {profile.synced_from_empathy_ledger && (
    <span className="px-2 py-1 bg-purple-100 border border-purple-600 text-xs font-bold">
      <Shield className="inline-block h-3 w-3 mr-1" />
      Empathy Ledger
    </span>
  )}
  {profile.last_synced_at && (
    <div className="text-xs text-gray-600 mt-1">
      Last synced: {formatDate(profile.last_synced_at)}
    </div>
  )}
</td>
```

### 4. **Build Profile Pages**

Create individual profile display pages:

- `/src/app/people/[slug]/page.tsx` - Public profile view
- Include Empathy Ledger badge if synced
- Link to Empathy Ledger profile (if public)
- Display cultural protocols/warnings
- Show linked stories from Empathy Ledger

### 5. **Sync Organizations**

After profiles work:

1. Create `/src/scripts/sync-empathy-ledger-organizations.ts`
2. Flag organizations in Empathy Ledger
3. Sync to JusticeHub organizations table

### 6. **Sync Projects → Programs**

After organizations work:

1. Create `/src/scripts/sync-empathy-ledger-projects.ts`
2. Map projects to community_programs
3. Link to organizations

### 7. **Stories Integration**

Display Empathy Ledger stories on JusticeHub:

1. Fix `getPublicStories()` query in `/src/lib/supabase/empathy-ledger.ts`
2. Create `/src/app/stories/page.tsx` - Stories feed
3. Create story display components with cultural protocols
4. Add consent badges and attribution

### 8. **Set Up Cron Job**

Automate the sync:

1. Create Vercel cron job config
2. Set up `/api/cron/sync-profiles` endpoint
3. Schedule to run every 6 hours
4. Add error notifications

## Environment Variables Required

Make sure these are set in `.env.local`:

```bash
# JusticeHub Database
NEXT_PUBLIC_SUPABASE_URL=https://tednluwflfhxyucgwigh.supabase.co
YJSF_SUPABASE_SERVICE_KEY=your-justicehub-service-key

# Empathy Ledger Database
EMPATHY_LEDGER_URL=https://yvnuayzslukamizrlhwb.supabase.co
EMPATHY_LEDGER_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## How to Use (Once Set Up)

### For Profile Owners (Empathy Ledger)

1. Log into Empathy Ledger
2. Go to Profile Settings
3. Check "Display on JusticeHub"
4. Select role (founder, leader, advocate, etc.)
5. Optionally check "Feature me prominently"
6. Save settings
7. Profile automatically syncs to JusticeHub within 6 hours

### For Admins (JusticeHub)

1. Go to http://localhost:4000/admin/profiles
2. Click "Sync from Empathy Ledger" button
3. View synced profiles in Empathy Ledger section
4. Monitor sync log for issues
5. Manually link JusticeHub profiles to Empathy Ledger if needed

## Architecture Summary

```
┌─────────────────────────────────────────┐
│         EMPATHY LEDGER                  │
│         (Source of Truth)               │
│                                         │
│  People control their data              │
│  Cultural protocols enforced            │
│  Consent explicitly managed             │
│                                         │
│  Flag: justicehub_enabled = true        │
└──────────────┬──────────────────────────┘
               │
               │ Automatic Sync
               │ (Every 6 hours)
               ↓
┌──────────────────────────────────────────┐
│         JUSTICEHUB                       │
│         (Public Showcase)                │
│                                          │
│  Display only consented content          │
│  Show Empathy Ledger badges              │
│  Link back to source                     │
│  Respect cultural protocols              │
└──────────────────────────────────────────┘
```

## Key Benefits

### For Community Members
- **Data Ownership**: Control data in Empathy Ledger
- **Consent Control**: Explicit opt-in required
- **Cultural Safety**: Protocols respected
- **Attribution**: Always credited

### For Organizations
- **Single Source of Truth**: Manage in Empathy Ledger
- **Multi-Platform Reach**: Displayed on JusticeHub
- **Cultural Safety**: Built-in protocols
- **Verification**: Linked source

### For JusticeHub
- **Rich Content**: From Empathy Ledger
- **Consent-Controlled**: Automatic compliance
- **Culturally Appropriate**: By design
- **No Data Duplication**: References only
- **Authenticated Source**: Via Empathy Ledger

## Next Immediate Action

**Run the SQL in Supabase SQL Editor** (both databases) as described in "Pending" section above.

After that's done, run the sync script to test everything works correctly.

## Files Reference

- **Strategy**: `docs/EMPATHY_LEDGER_INTEGRATION.md`
- **Flagging System**: `docs/PROFILE_FLAGGING_SYSTEM.md`
- **Setup Guide**: `docs/EMPATHY_LEDGER_SETUP_GUIDE.md`
- **Manual SQL**: `docs/MANUAL_DATABASE_STEPS.md`
- **Sync Script**: `src/scripts/sync-empathy-ledger-profiles.ts`
- **Verification**: `src/scripts/verify-empathy-ledger-schema.ts`
- **API Endpoint**: `src/app/api/admin/sync-empathy-ledger/route.ts`
- **Empathy Ledger Client**: `src/lib/supabase/empathy-ledger.ts`

---

**Status**: Ready for database setup. All code and documentation complete. Waiting for manual SQL execution.
