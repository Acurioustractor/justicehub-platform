# Profile Flagging System for JusticeHub

## Goal
Create a systematic way to flag which Empathy Ledger profiles should appear on JusticeHub, with full consent control and bi-directional linking.

## The Challenge

**Two Databases:**
- Empathy Ledger: Source of truth for people, stories, consent
- JusticeHub: Public showcase of youth justice work

**Need:**
- Easy way to flag "Show this person on JusticeHub"
- Respect consent and cultural protocols
- Support both directions: flag in Empathy Ledger OR JusticeHub
- Automatic sync when flagged

## Solution: Multi-Flag System

### Option 1: Flag in Empathy Ledger (Recommended)

**Add to Empathy Ledger `profiles` table:**
```sql
ALTER TABLE profiles
ADD COLUMN display_on_platforms JSONB DEFAULT '[]'::jsonb,
ADD COLUMN justicehub_enabled BOOLEAN DEFAULT false,
ADD COLUMN justicehub_role TEXT, -- 'founder', 'leader', 'advocate', 'practitioner'
ADD COLUMN justicehub_featured BOOLEAN DEFAULT false;

-- Example data:
{
  "display_on_platforms": ["justicehub", "empathy-ledger"],
  "justicehub_enabled": true,
  "justicehub_role": "founder",
  "justicehub_featured": true
}
```

**Benefits:**
- People control it in Empathy Ledger (their data platform)
- Consent is explicit and documented
- Can be changed anytime by profile owner
- Automatically syncs to JusticeHub

### Option 2: Flag in JusticeHub

**Add to JusticeHub `public_profiles` table:**
```sql
ALTER TABLE public_profiles
ADD COLUMN empathy_ledger_profile_id UUID,
ADD COLUMN sync_enabled BOOLEAN DEFAULT false,
ADD COLUMN sync_type TEXT CHECK (sync_type IN ('reference', 'full', 'manual')),
ADD COLUMN last_synced_at TIMESTAMP;

-- Sync types:
-- 'reference': Just link to EL profile, pull data on display
-- 'full': Cache all data locally, sync regularly
-- 'manual': No automatic sync, manually managed
```

**Benefits:**
- JusticeHub admins can flag profiles
- Useful for initial setup
- Can request consent retroactively
- Fallback for manual profiles

## Recommended Hybrid Approach

Use BOTH flags with clear hierarchy:

```
Priority 1: Empathy Ledger flags (user-controlled)
Priority 2: JusticeHub flags (admin-controlled, requires consent verification)
```

### Implementation

#### 1. Empathy Ledger Profile Settings UI

In Empathy Ledger, profiles get a "Platform Display" section:

```typescript
// Empathy Ledger UI
function PlatformDisplaySettings() {
  return (
    <div className="border p-4">
      <h3>Display on Other Platforms</h3>

      <label>
        <input type="checkbox" checked={justicehubEnabled} />
        Display my profile on JusticeHub
      </label>

      {justicehubEnabled && (
        <>
          <select value={justicehubRole}>
            <option>Founder</option>
            <option>Leader</option>
            <option>Advocate</option>
            <option>Practitioner</option>
            <option>Researcher</option>
          </select>

          <label>
            <input type="checkbox" checked={justicehubFeatured} />
            Feature me prominently on JusticeHub
          </label>

          <div className="consent-notice">
            By enabling this, you consent to your public profile
            and public stories appearing on JusticeHub with full attribution.
          </div>
        </>
      )}
    </div>
  );
}
```

#### 2. JusticeHub Sync Script

```typescript
// src/scripts/sync-empathy-ledger-profiles.ts
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';
import { supabase } from '@/lib/supabase/client';

async function syncProfilesFromEmpathyLedger() {
  // Get all profiles flagged for JusticeHub
  const { data: empathyProfiles, error } = await empathyLedgerClient
    .from('profiles')
    .select('*')
    .eq('justicehub_enabled', true)
    .eq('is_public', true); // Double-check privacy

  console.log(`Found ${empathyProfiles?.length || 0} profiles flagged for JusticeHub`);

  for (const profile of empathyProfiles || []) {
    // Check if already exists in JusticeHub
    const { data: existing } = await supabase
      .from('public_profiles')
      .select('id')
      .eq('empathy_ledger_profile_id', profile.id)
      .single();

    if (existing) {
      // Update existing
      await supabase
        .from('public_profiles')
        .update({
          full_name: profile.display_name,
          bio: profile.bio,
          photo_url: profile.avatar_url,
          role_tags: [profile.justicehub_role].filter(Boolean),
          is_featured: profile.justicehub_featured,
          synced_from_empathy_ledger: true,
          last_synced_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      console.log(`Updated: ${profile.display_name}`);
    } else {
      // Create new
      const { data: newProfile, error: insertError } = await supabase
        .from('public_profiles')
        .insert({
          empathy_ledger_profile_id: profile.id,
          full_name: profile.display_name,
          slug: generateSlug(profile.display_name),
          bio: profile.bio,
          photo_url: profile.avatar_url,
          role_tags: [profile.justicehub_role].filter(Boolean),
          is_featured: profile.justicehub_featured,
          is_public: true,
          synced_from_empathy_ledger: true,
          last_synced_at: new Date().toISOString()
        })
        .select()
        .single();

      console.log(`Created: ${profile.display_name} (${newProfile?.id})`);
    }
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

syncProfilesFromEmpathyLedger();
```

#### 3. JusticeHub Admin UI (for flagging from JusticeHub side)

```typescript
// src/app/admin/profiles/page.tsx
function AdminProfilesPage() {
  return (
    <div>
      <h1>Manage Profiles</h1>

      {/* Section 1: Empathy Ledger Profiles */}
      <section>
        <h2>Empathy Ledger Profiles (Auto-synced)</h2>
        <p>These profiles are managed in Empathy Ledger and sync automatically.</p>

        <button onClick={syncFromEmpathyLedger}>
          Sync Now from Empathy Ledger
        </button>

        <ProfileList
          profiles={empathyLedgerProfiles}
          showSyncStatus={true}
        />
      </section>

      {/* Section 2: Manual JusticeHub Profiles */}
      <section>
        <h2>JusticeHub-Only Profiles</h2>
        <p>These profiles are managed directly in JusticeHub.</p>

        <button onClick={createNewProfile}>
          Add New Profile
        </button>

        <ProfileList
          profiles={manualProfiles}
          showEmpathyLedgerLink={true}
        />
      </section>

      {/* Section 3: Link Existing Profile to Empathy Ledger */}
      <section>
        <h2>Link to Empathy Ledger</h2>

        <form onSubmit={linkProfile}>
          <select name="justicehub_profile_id">
            {manualProfiles.map(p => (
              <option value={p.id}>{p.full_name}</option>
            ))}
          </select>

          <input
            type="text"
            name="empathy_ledger_profile_id"
            placeholder="Empathy Ledger Profile ID"
          />

          <button type="submit">Link Profile</button>
        </form>
      </section>
    </div>
  );
}
```

## Flagging Workflows

### Workflow A: Profile Owner Flags Themselves (Empathy Ledger)

1. Person logs into Empathy Ledger
2. Goes to Profile Settings
3. Checks "Display on JusticeHub"
4. Selects role (founder, leader, etc.)
5. Optionally checks "Feature me"
6. Saves settings
7. **Automatic sync**: Next sync run picks them up
8. Profile appears on JusticeHub with "Managed via Empathy Ledger" badge

### Workflow B: JusticeHub Admin Flags Profile (JusticeHub)

1. Admin logs into JusticeHub admin panel
2. Goes to Profiles section
3. Clicks "Add New Profile"
4. Either:
   - **Option A**: Manually creates profile
   - **Option B**: Links to existing Empathy Ledger profile ID
5. If linked, automatic sync pulls latest data
6. If manual, admin manages it directly

### Workflow C: Request Someone Be Added (Hybrid)

1. Someone suggests "We should feature [Person] on JusticeHub"
2. JusticeHub admin creates a "pending" profile entry
3. Admin reaches out to person via Empathy Ledger
4. Person enables JusticeHub in their Empathy Ledger settings
5. Next sync links the profiles
6. Status changes from "pending" to "active"

## Database Schema

### Empathy Ledger Updates

```sql
-- Add JusticeHub flags to profiles table
ALTER TABLE profiles
ADD COLUMN justicehub_enabled BOOLEAN DEFAULT false,
ADD COLUMN justicehub_role TEXT,
ADD COLUMN justicehub_featured BOOLEAN DEFAULT false,
ADD COLUMN justicehub_synced_at TIMESTAMP;

CREATE INDEX idx_profiles_justicehub ON profiles(justicehub_enabled)
WHERE justicehub_enabled = true;

-- Add trigger to update justicehub_synced_at
CREATE OR REPLACE FUNCTION update_justicehub_sync_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.justicehub_synced_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_justicehub_sync
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.justicehub_enabled IS DISTINCT FROM NEW.justicehub_enabled)
  EXECUTE FUNCTION update_justicehub_sync_timestamp();
```

### JusticeHub Updates

```sql
-- Add Empathy Ledger linking to public_profiles
ALTER TABLE public_profiles
ADD COLUMN empathy_ledger_profile_id UUID UNIQUE,
ADD COLUMN synced_from_empathy_ledger BOOLEAN DEFAULT false,
ADD COLUMN sync_type TEXT DEFAULT 'manual' CHECK (sync_type IN ('reference', 'full', 'manual')),
ADD COLUMN last_synced_at TIMESTAMP;

CREATE INDEX idx_profiles_empathy_ledger ON public_profiles(empathy_ledger_profile_id);

-- Create sync log table
CREATE TABLE profile_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_profile_id UUID REFERENCES public_profiles(id),
  empathy_ledger_profile_id UUID,
  sync_action TEXT, -- 'created', 'updated', 'deleted'
  sync_status TEXT, -- 'success', 'failed'
  sync_details JSONB,
  synced_at TIMESTAMP DEFAULT now()
);
```

## Helper Functions

### Get JusticeHub-Enabled Profiles from Empathy Ledger

```typescript
// src/lib/supabase/empathy-ledger.ts

export async function getJusticeHubProfiles() {
  const { data, error } = await empathyLedgerClient
    .from('profiles')
    .select(`
      *,
      organizations:profile_organizations(
        organization:organizations(name, slug, indigenous_controlled)
      ),
      projects:project_members(
        project:projects(name, description)
      )
    `)
    .eq('justicehub_enabled', true)
    .eq('is_public', true)
    .order('display_name');

  if (error) {
    console.error('Error fetching JusticeHub profiles:', error);
    return [];
  }

  return data || [];
}

export async function getProfileStories(profileId: string) {
  const { data, error } = await empathyLedgerClient
    .from('stories')
    .select('*')
    .eq('storyteller_id', profileId)
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .order('published_at', { ascending: false });

  return data || [];
}
```

### Sync Status Check

```typescript
// src/lib/supabase/client.ts

export async function getProfileSyncStatus(profileId: string) {
  const { data } = await supabase
    .from('public_profiles')
    .select('empathy_ledger_profile_id, synced_from_empathy_ledger, last_synced_at')
    .eq('id', profileId)
    .single();

  if (!data?.empathy_ledger_profile_id) {
    return { type: 'manual', synced: false };
  }

  if (!data.synced_from_empathy_ledger) {
    return { type: 'linked', synced: false };
  }

  const hoursSinceSync = data.last_synced_at
    ? (Date.now() - new Date(data.last_synced_at).getTime()) / 1000 / 60 / 60
    : null;

  return {
    type: 'empathy-ledger',
    synced: true,
    stale: hoursSinceSync && hoursSinceSync > 24,
    lastSyncedAt: data.last_synced_at
  };
}
```

## UI Components

### Profile Badge

```typescript
// src/components/ProfileBadge.tsx
export function ProfileBadge({ profile }: { profile: PublicProfile }) {
  if (!profile.synced_from_empathy_ledger) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-600 text-sm">
      <Shield className="h-4 w-4 text-purple-600" />
      <span>Managed via Empathy Ledger</span>
      {profile.is_featured && (
        <Star className="h-4 w-4 text-yellow-600" fill="currentColor" />
      )}
    </div>
  );
}
```

### Sync Status Indicator

```typescript
// src/components/admin/SyncStatusIndicator.tsx
export function SyncStatusIndicator({ profileId }: { profileId: string }) {
  const status = getProfileSyncStatus(profileId);

  if (status.type === 'manual') {
    return <span className="text-gray-500">Manual</span>;
  }

  if (!status.synced) {
    return <span className="text-orange-600">Needs Sync</span>;
  }

  if (status.stale) {
    return <span className="text-yellow-600">Stale (sync recommended)</span>;
  }

  return (
    <span className="text-green-600">
      Synced {formatDistanceToNow(status.lastSyncedAt)} ago
    </span>
  );
}
```

## Cron Job for Auto-Sync

```typescript
// src/app/api/cron/sync-profiles/route.ts
import { NextResponse } from 'next/server';
import { syncProfilesFromEmpathyLedger } from '@/lib/sync/profiles';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncProfilesFromEmpathyLedger();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
```

**Add to Vercel Cron:**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-profiles",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## Summary

### Recommended Approach

1. **Primary Flag**: `justicehub_enabled` in Empathy Ledger profiles (user-controlled)
2. **Secondary Link**: `empathy_ledger_profile_id` in JusticeHub (admin-controlled)
3. **Automatic Sync**: Cron job every 6 hours pulls flagged profiles
4. **Manual Override**: Admins can create JusticeHub-only profiles
5. **Clear Attribution**: Badges show source and sync status

### Benefits

✅ **User Control**: People flag themselves in Empathy Ledger
✅ **Consent-Based**: Explicit opt-in required
✅ **Automatic Sync**: Set it and forget it
✅ **Flexible**: Supports both Empathy Ledger and manual profiles
✅ **Transparent**: Clear badges show source
✅ **Auditable**: Sync log tracks all changes

### Next Steps

1. Add `justicehub_enabled` column to Empathy Ledger profiles
2. Add `empathy_ledger_profile_id` column to JusticeHub public_profiles
3. Create sync script
4. Build admin UI for profile management
5. Set up cron job
6. Test with Oonchiumpa founders (Kristy, Tanya)
