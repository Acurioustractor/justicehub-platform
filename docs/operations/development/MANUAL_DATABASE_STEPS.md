# Manual Database Steps for Empathy Ledger Integration

## Step 1: Add Columns to JusticeHub Database

Go to Supabase SQL Editor for JusticeHub and run this SQL:

```sql
-- Add Empathy Ledger linking columns to public_profiles
ALTER TABLE public_profiles ADD COLUMN IF NOT EXISTS empathy_ledger_profile_id uuid;
ALTER TABLE public_profiles ADD COLUMN IF NOT EXISTS synced_from_empathy_ledger boolean DEFAULT false;
ALTER TABLE public_profiles ADD COLUMN IF NOT EXISTS sync_type text DEFAULT 'manual';
ALTER TABLE public_profiles ADD COLUMN IF NOT EXISTS last_synced_at timestamp;

-- Add Empathy Ledger linking columns to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS empathy_ledger_org_id uuid;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS synced_from_empathy_ledger boolean DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS last_synced_at timestamp;

-- Add Empathy Ledger linking columns to community_programs
ALTER TABLE community_programs ADD COLUMN IF NOT EXISTS empathy_ledger_project_id uuid;
ALTER TABLE community_programs ADD COLUMN IF NOT EXISTS synced_from_empathy_ledger boolean DEFAULT false;
ALTER TABLE community_programs ADD COLUMN IF NOT EXISTS last_synced_at timestamp;

-- Create sync log tables
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

## Step 2: Add Columns to Empathy Ledger Database

Go to Supabase SQL Editor for Empathy Ledger and run this SQL:

```sql
-- Add JusticeHub flagging columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS justicehub_enabled boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS justicehub_role text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS justicehub_featured boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS justicehub_synced_at timestamp;

-- Create index for JusticeHub-enabled profiles
CREATE INDEX IF NOT EXISTS idx_profiles_justicehub
ON profiles(justicehub_enabled)
WHERE justicehub_enabled = true;

-- Add JusticeHub flagging columns to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS justicehub_enabled boolean DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS justicehub_synced_at timestamp;

-- Create index for JusticeHub-enabled organizations
CREATE INDEX IF NOT EXISTS idx_organizations_justicehub
ON organizations(justicehub_enabled)
WHERE justicehub_enabled = true;

-- Add JusticeHub flagging columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS justicehub_enabled boolean DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS justicehub_program_type text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS justicehub_synced_at timestamp;

-- Create index for JusticeHub-enabled projects
CREATE INDEX IF NOT EXISTS idx_projects_justicehub
ON projects(justicehub_enabled)
WHERE justicehub_enabled = true;
```

## Step 3: Flag Test Data in Empathy Ledger

After adding columns, flag some profiles for testing:

```sql
-- Flag Oonchiumpa organization for JusticeHub
UPDATE organizations
SET justicehub_enabled = true
WHERE slug = 'oonchiumpa';

-- If you want to flag specific profiles (replace with actual profile IDs)
-- First, find the profiles:
SELECT id, display_name FROM profiles LIMIT 10;

-- Then flag them:
UPDATE profiles
SET
  justicehub_enabled = true,
  justicehub_role = 'founder',
  justicehub_featured = true
WHERE id IN (
  'profile-id-1',
  'profile-id-2'
);
```

## After Database Changes

Once you've run the SQL in both databases:

1. Run the sync script: `npm run sync:empathy-ledger`
2. Check the admin UI: http://localhost:4000/admin/profiles
3. Verify profiles synced correctly

## Verification

Check that columns were added:

**JusticeHub:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'public_profiles'
AND column_name LIKE '%empathy%';
```

**Empathy Ledger:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name LIKE '%justicehub%';
```
