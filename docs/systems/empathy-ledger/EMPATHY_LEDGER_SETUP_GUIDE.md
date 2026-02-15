# Empathy Ledger Integration - Quick Setup Guide

## Overview

This guide walks you through connecting your Empathy Ledger database to JusticeHub so that people can control their data in Empathy Ledger and have it automatically sync to JusticeHub.

## What This Integration Does

- **Consent-Controlled**: People flag themselves in Empathy Ledger (`justicehub_enabled: true`)
- **Automatic Sync**: Profiles sync automatically from Empathy Ledger → JusticeHub
- **Cultural Protocols**: Respects Indigenous data sovereignty and cultural practices
- **Audit Trail**: Every sync operation is logged for transparency

## Step 1: Add Columns to JusticeHub Database

1. Go to [JusticeHub Supabase Dashboard](https://supabase.com/dashboard/project/tednluwflfhxyucgwigh)
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste this SQL:

```sql
-- Add Empathy Ledger linking columns to public_profiles
ALTER TABLE public_profiles
ADD COLUMN IF NOT EXISTS empathy_ledger_profile_id UUID,
ADD COLUMN IF NOT EXISTS synced_from_empathy_ledger BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sync_type TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

-- Add unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_public_profiles_empathy_ledger_id
ON public_profiles(empathy_ledger_profile_id)
WHERE empathy_ledger_profile_id IS NOT NULL;

-- Add Empathy Ledger linking columns to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS empathy_ledger_org_id UUID,
ADD COLUMN IF NOT EXISTS synced_from_empathy_ledger BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

-- Add Empathy Ledger linking columns to community_programs
ALTER TABLE community_programs
ADD COLUMN IF NOT EXISTS empathy_ledger_project_id UUID,
ADD COLUMN IF NOT EXISTS synced_from_empathy_ledger BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

-- Create sync log table
CREATE TABLE IF NOT EXISTS profile_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_profile_id UUID REFERENCES public_profiles(id) ON DELETE CASCADE,
  empathy_ledger_profile_id UUID,
  sync_action TEXT NOT NULL,
  sync_status TEXT NOT NULL,
  sync_details JSONB,
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT now()
);

-- Create organization sync log table
CREATE TABLE IF NOT EXISTS organization_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  empathy_ledger_org_id UUID,
  sync_action TEXT NOT NULL,
  sync_status TEXT NOT NULL,
  sync_details JSONB,
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT now()
);
```

5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

## Step 2: Add Columns to Empathy Ledger Database

1. Go to [Empathy Ledger Supabase Dashboard](https://supabase.com/dashboard/project/yvnuayzslukamizrlhwb)
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste this SQL:

```sql
-- Add JusticeHub flagging columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS justicehub_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS justicehub_role TEXT,
ADD COLUMN IF NOT EXISTS justicehub_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS justicehub_synced_at TIMESTAMP;

-- Create index for JusticeHub-enabled profiles
CREATE INDEX IF NOT EXISTS idx_profiles_justicehub
ON profiles(justicehub_enabled)
WHERE justicehub_enabled = true;

-- Add JusticeHub flagging columns to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS justicehub_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS justicehub_synced_at TIMESTAMP;

-- Create index for JusticeHub-enabled organizations
CREATE INDEX IF NOT EXISTS idx_organizations_justicehub
ON organizations(justicehub_enabled)
WHERE justicehub_enabled = true;

-- Add JusticeHub flagging columns to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS justicehub_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS justicehub_program_type TEXT,
ADD COLUMN IF NOT EXISTS justicehub_synced_at TIMESTAMP;

-- Create index for JusticeHub-enabled projects
CREATE INDEX IF NOT EXISTS idx_projects_justicehub
ON projects(justicehub_enabled)
WHERE justicehub_enabled = true;
```

5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

## Step 3: Flag Test Profiles in Empathy Ledger

Now let's flag some profiles to appear on JusticeHub:

1. Still in Empathy Ledger SQL Editor, run this to see all profiles:

```sql
SELECT id, display_name, bio
FROM profiles
ORDER BY display_name
LIMIT 20;
```

2. Choose profiles you want to feature on JusticeHub (e.g., Oonchiumpa founders)

3. Flag them with this SQL (replace `'profile-id-here'` with actual IDs):

```sql
-- Flag specific profiles for JusticeHub
UPDATE profiles
SET
  justicehub_enabled = true,
  justicehub_role = 'founder',          -- Options: 'founder', 'leader', 'advocate', 'practitioner', 'researcher'
  justicehub_featured = true             -- Set to false if you don't want them prominently featured
WHERE id IN (
  'profile-id-1',
  'profile-id-2'
);

-- Verify the update
SELECT id, display_name, justicehub_enabled, justicehub_role, justicehub_featured
FROM profiles
WHERE justicehub_enabled = true;
```

4. You can also flag the Oonchiumpa organization:

```sql
UPDATE organizations
SET justicehub_enabled = true
WHERE slug = 'oonchiumpa';

-- Verify
SELECT id, name, slug, justicehub_enabled
FROM organizations
WHERE justicehub_enabled = true;
```

## Step 4: Run the Sync Script

Now that the database columns are ready and profiles are flagged, run the sync:

```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/sync-empathy-ledger-profiles.ts
```

You should see output like:

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

## Step 5: Verify the Sync

1. Check the sync log:

```sql
-- In JusticeHub SQL Editor
SELECT
  ps.synced_at,
  ps.sync_action,
  ps.sync_status,
  pp.full_name,
  ps.sync_details
FROM profile_sync_log ps
LEFT JOIN public_profiles pp ON ps.public_profile_id = pp.id
ORDER BY ps.synced_at DESC
LIMIT 10;
```

2. Check the synced profiles:

```sql
-- In JusticeHub SQL Editor
SELECT
  id,
  full_name,
  slug,
  role_tags,
  is_featured,
  synced_from_empathy_ledger,
  last_synced_at
FROM public_profiles
WHERE synced_from_empathy_ledger = true;
```

3. Visit the People page: http://localhost:4000/people

## Troubleshooting

### "Column does not exist" errors

- Make sure you ran both Step 1 (JusticeHub) AND Step 2 (Empathy Ledger) SQL
- Check which database you're in - the SQL Editor shows the project name at the top

### "No profiles flagged for JusticeHub"

- Run the query in Step 3 to verify profiles have `justicehub_enabled = true`
- Make sure you're updating profiles in the **Empathy Ledger** database, not JusticeHub

### Sync script errors

- Check that `.env.local` has both database credentials:
  - `NEXT_PUBLIC_SUPABASE_URL` (JusticeHub)
  - `YJSF_SUPABASE_SERVICE_KEY` (JusticeHub)
  - `EMPATHY_LEDGER_URL` (Empathy Ledger)
  - `EMPATHY_LEDGER_ANON_KEY` (Empathy Ledger)

## Next Steps

After the sync is working:

1. **Build Admin UI** - Create `/src/app/admin/profiles/page.tsx` for managing synced profiles
2. **Set up Cron Job** - Auto-sync every 6 hours via Vercel cron
3. **Add Profile Pages** - Create individual profile pages at `/people/[slug]`
4. **Sync Organizations** - Build similar sync for organizations
5. **Sync Stories** - Integrate Empathy Ledger stories with consent controls

## How the System Works

### User Workflow (Empathy Ledger)

1. Person creates profile in Empathy Ledger
2. Person enables JusticeHub display in their settings
3. Person chooses their role (founder, leader, etc.)
4. Profile automatically syncs to JusticeHub

### Admin Workflow (JusticeHub)

1. Admin can see all synced profiles in admin UI
2. Admin can manually trigger sync
3. Admin can link JusticeHub-only profiles to Empathy Ledger
4. All changes are logged for audit trail

### Data Flow

```
Empathy Ledger (Source of Truth)
       ↓
   [Flag Profile]
       ↓
   [Auto Sync]
       ↓
JusticeHub (Public Display)
```

## Key Files

- **Sync Script**: `/src/scripts/sync-empathy-ledger-profiles.ts`
- **Empathy Ledger Client**: `/src/lib/supabase/empathy-ledger.ts`
- **Integration Docs**: `/docs/EMPATHY_LEDGER_INTEGRATION.md`
- **Flagging System Docs**: `/docs/PROFILE_FLAGGING_SYSTEM.md`

## Support

If you encounter issues:

1. Check the sync log tables in JusticeHub
2. Verify database columns exist with the queries in this guide
3. Run the verification script: `npx tsx src/scripts/verify-empathy-ledger-schema.ts`
4. Check environment variables are set correctly

---

**Cultural Note**: This integration is designed to respect Indigenous data sovereignty. People control their data in Empathy Ledger and only what they consent to share appears on JusticeHub. Always seek consent and respect cultural protocols.
