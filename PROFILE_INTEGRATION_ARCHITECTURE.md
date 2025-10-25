# Profile Integration Architecture
## Best-Case Design: Empathy Ledger Profiles → JusticeHub

## Core Concept ✨

**Empathy Ledger = Source of Truth for People**
- People create profiles in Empathy Ledger
- They're linked to organizations and tell their stories
- JusticeHub **references** these profiles (doesn't duplicate)
- Justice-related stories automatically appear on JusticeHub

## The Architecture

### Data Flow

```
┌─────────────────────────────────────────────────┐
│          EMPATHY LEDGER                         │
│      (Source of Truth for People)               │
│                                                 │
│  Person creates profile                         │
│    ↓                                           │
│  Links to organization(s)                       │
│    ↓                                           │
│  Writes stories/shares experiences              │
│    ↓                                           │
│  Tags stories (including "youth-justice")       │
└────────────────┬────────────────────────────────┘
                 │
                 │ SYNC/REFERENCE LAYER
                 │
┌────────────────▼────────────────────────────────┐
│          JUSTICEHUB                             │
│    (Public Platform - References Profiles)      │
│                                                 │
│  • Profile references (not duplicates)          │
│  • Shows justice-related stories                │
│  • Links to programs/services                   │
│  • Public-facing display                        │
└─────────────────────────────────────────────────┘
```

### Profile Relationship Model

```
Empathy Ledger Profile (242 profiles)
├── id (UUID)
├── display_name
├── bio
├── avatar_url
├── organization_id → links to Indigenous org
└── stories[] → personal stories

         ↓ REFERENCED BY

JusticeHub Profile Display
├── empathy_ledger_profile_id (reference)
├── appears_on_programs[] → community programs
├── appears_on_services[] → services they've used
└── filtered_stories[] → only justice-related stories
```

## Database Schema Design

### Option 1: Reference by ID (Recommended)

**In JusticeHub database, add reference fields:**

```sql
-- Add to community_programs table
ALTER TABLE community_programs
ADD COLUMN featured_storytellers JSONB DEFAULT '[]';
-- Format: [{"empathy_ledger_profile_id": "uuid", "display_name": "Name", "role": "Participant"}]

-- Add to services table
ALTER TABLE services
ADD COLUMN testimonials JSONB DEFAULT '[]';
-- Format: [{"empathy_ledger_profile_id": "uuid", "story_id": "uuid"}]

-- Create profile_appearances table (best option)
CREATE TABLE profile_appearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empathy_ledger_profile_id UUID NOT NULL,
  appears_on_type TEXT NOT NULL, -- 'program', 'service', 'article'
  appears_on_id UUID NOT NULL,
  role TEXT, -- 'participant', 'facilitator', 'family member'
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profile_appearances_el_id ON profile_appearances(empathy_ledger_profile_id);
CREATE INDEX idx_profile_appearances_target ON profile_appearances(appears_on_type, appears_on_id);
```

### Option 2: Sync Profile Metadata (Hybrid)

**Create lightweight profile cache in JusticeHub:**

```sql
-- Cached profile data from Empathy Ledger
CREATE TABLE empathy_ledger_profiles_cache (
  empathy_ledger_id UUID PRIMARY KEY,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  organization_id UUID, -- Empathy Ledger org ID
  organization_name TEXT,
  traditional_country TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_hash TEXT -- to detect changes
);

-- Refresh cache periodically or on-demand
```

## Story Filtering Strategy

### Justice-Related Stories Detection

**Method 1: Tag-Based (Recommended)**

In Empathy Ledger, stories have `themes` field. Filter for justice-related:

```typescript
const JUSTICE_THEMES = [
  'youth-justice',
  'juvenile-justice',
  'incarceration',
  'police-interaction',
  'court-system',
  'rehabilitation',
  'reentry',
  'family-separation',
  'detention',
  'legal-system',
  'restorative-justice',
  'community-justice'
];

export async function getJusticeRelatedStories() {
  const { data } = await empathyLedgerClient
    .from('stories')
    .select(`
      *,
      profile:profiles(*),
      organization:organizations(*)
    `)
    .eq('is_public', true)
    .or(JUSTICE_THEMES.map(theme => `themes.cs.{${theme}}`).join(','));

  return data;
}
```

**Method 2: Service Link-Based**

Stories already have `service_id` - if linked to JusticeHub service, it's justice-related:

```typescript
export async function getStoriesLinkedToServices() {
  const { data } = await empathyLedgerClient
    .from('stories')
    .select(`
      *,
      profile:profiles(*),
      organization:organizations(*)
    `)
    .eq('is_public', true)
    .not('service_id', 'is', null); // Has service link

  return data;
}
```

**Method 3: Organization Type-Based**

If organization is youth-justice focused, all their stories are relevant:

```typescript
export async function getStoriesFromJusticeOrgs() {
  // First, get justice-focused orgs
  const { data: orgs } = await empathyLedgerClient
    .from('organizations')
    .select('id')
    .or('type.eq.youth-justice,type.eq.legal-services,type.eq.rehabilitation');

  const orgIds = orgs?.map(o => o.id) || [];

  // Then get their stories
  const { data } = await empathyLedgerClient
    .from('stories')
    .select('*, profile:profiles(*), organization:organizations(*)')
    .eq('is_public', true)
    .in('organization_id', orgIds);

  return data;
}
```

## Implementation Plan

### Phase 1: Profile Reference System

**1. Add profile_appearances table to JusticeHub**

```sql
-- Run in JusticeHub database
CREATE TABLE profile_appearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empathy_ledger_profile_id UUID NOT NULL,
  appears_on_type TEXT NOT NULL CHECK (appears_on_type IN ('program', 'service', 'article')),
  appears_on_id UUID NOT NULL,
  role TEXT,
  story_excerpt TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(empathy_ledger_profile_id, appears_on_type, appears_on_id)
);
```

**2. Create helper functions**

```typescript
// src/lib/integrations/profile-linking.ts
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';
import { justiceHubClient } from '@/lib/supabase/justicehub';

export async function getProfileWithStories(empathyLedgerProfileId: string) {
  // Fetch from Empathy Ledger
  const { data: profile } = await empathyLedgerClient
    .from('profiles')
    .select(`
      *,
      organization:organizations(*),
      stories:stories(*)
    `)
    .eq('id', empathyLedgerProfileId)
    .single();

  // Get JusticeHub appearances
  const { data: appearances } = await justiceHubClient
    .from('profile_appearances')
    .select('*')
    .eq('empathy_ledger_profile_id', empathyLedgerProfileId);

  return {
    profile,
    appearances,
    justiceStories: profile?.stories.filter(isJusticeRelated)
  };
}

export function isJusticeRelated(story: any): boolean {
  const justiceThemes = ['youth-justice', 'incarceration', 'court-system', 'rehabilitation'];
  return (
    story.service_id != null || // Linked to service
    story.themes?.some(t => justiceThemes.includes(t)) || // Has justice theme
    story.story_category === 'youth-justice'
  );
}
```

### Phase 2: Unified Profile Display

**Create profile display component:**

```typescript
// src/components/EmpathyLedgerProfile.tsx
'use client';

import { useEffect, useState } from 'react';
import { getProfileWithStories } from '@/lib/integrations/profile-linking';

export function EmpathyLedgerProfile({
  profileId
}: {
  profileId: string
}) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getProfileWithStories(profileId).then(setData);
  }, [profileId]);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="empathy-ledger-profile">
      {/* Profile Header */}
      <div className="flex items-start gap-4 mb-6">
        {data.profile.avatar_url && (
          <img
            src={data.profile.avatar_url}
            alt={data.profile.display_name}
            className="w-20 h-20 rounded-full"
          />
        )}
        <div>
          <h3 className="text-2xl font-bold">{data.profile.display_name}</h3>
          {data.profile.organization && (
            <p className="text-gray-600">
              {data.profile.organization.name}
              {data.profile.organization.traditional_country && (
                <span> • {data.profile.organization.traditional_country}</span>
              )}
            </p>
          )}
          {data.profile.bio && (
            <p className="mt-2 text-gray-700">{data.profile.bio}</p>
          )}
        </div>
      </div>

      {/* Justice-Related Stories */}
      {data.justiceStories.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xl font-bold mb-4">Stories</h4>
          {data.justiceStories.map(story => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}

      {/* Appears On (Programs/Services) */}
      {data.appearances.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xl font-bold mb-4">Connected To</h4>
          {data.appearances.map(appearance => (
            <AppearanceCard key={appearance.id} appearance={appearance} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Phase 3: Auto-Discovery & Sync

**Create sync script to find profiles in stories:**

```typescript
// src/scripts/sync-story-profiles.ts
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';
import { justiceHubClient } from '@/lib/supabase/justicehub';

async function syncStoryProfiles() {
  console.log('🔄 Syncing Empathy Ledger profiles to JusticeHub...\n');

  // Get all justice-related stories
  const { data: stories } = await empathyLedgerClient
    .from('stories')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('is_public', true)
    .not('service_id', 'is', null); // Has service link

  console.log(`Found ${stories?.length} stories linked to services`);

  for (const story of stories || []) {
    if (!story.profile) continue;

    // Create profile appearance
    await justiceHubClient
      .from('profile_appearances')
      .upsert({
        empathy_ledger_profile_id: story.profile.id,
        appears_on_type: 'service',
        appears_on_id: story.service_id,
        role: 'service user',
        story_excerpt: story.summary || story.content.substring(0, 200),
        featured: story.is_featured
      }, {
        onConflict: 'empathy_ledger_profile_id,appears_on_type,appears_on_id'
      });

    console.log(`✅ Linked ${story.profile.display_name} to service ${story.service_id}`);
  }

  console.log('\n✅ Sync complete!');
}

syncStoryProfiles();
```

## Use Cases

### Use Case 1: Service Page Shows Real People

**On JusticeHub service detail page:**

```typescript
// src/app/services/[id]/page.tsx
export default async function ServicePage({ params }) {
  const service = await getService(params.id);

  // Get profiles who used this service
  const { data: appearances } = await justiceHubClient
    .from('profile_appearances')
    .select('empathy_ledger_profile_id, story_excerpt, role')
    .eq('appears_on_type', 'service')
    .eq('appears_on_id', params.id);

  // Fetch full profiles from Empathy Ledger
  const profiles = await Promise.all(
    appearances.map(a => getProfileWithStories(a.empathy_ledger_profile_id))
  );

  return (
    <div>
      <h1>{service.name}</h1>

      {/* Service details */}

      {/* Real people section */}
      <section className="mt-12">
        <h2>Real Stories from People We've Helped</h2>
        {profiles.map(({ profile, justiceStories }) => (
          <div key={profile.id} className="mb-8">
            <EmpathyLedgerProfile profileId={profile.id} />
          </div>
        ))}
      </section>
    </div>
  );
}
```

### Use Case 2: Community Program Shows Participants

**On JusticeHub community program page:**

```typescript
export default async function ProgramPage({ params }) {
  const program = await getProgram(params.id);

  // Get participants from Empathy Ledger
  const { data: participants } = await justiceHubClient
    .from('profile_appearances')
    .select('*')
    .eq('appears_on_type', 'program')
    .eq('appears_on_id', params.id);

  return (
    <div>
      <h1>{program.name}</h1>

      <section className="mt-12">
        <h2>Participant Stories</h2>
        {participants.map(p => (
          <EmpathyLedgerProfile
            key={p.empathy_ledger_profile_id}
            profileId={p.empathy_ledger_profile_id}
          />
        ))}
      </section>
    </div>
  );
}
```

### Use Case 3: Person's JusticeHub Presence

**Individual profile page on JusticeHub:**

```typescript
// src/app/profiles/[empathyLedgerId]/page.tsx
export default async function ProfilePage({ params }) {
  const data = await getProfileWithStories(params.empathyLedgerId);

  return (
    <div>
      <h1>{data.profile.display_name}</h1>

      {/* Bio and org info */}

      {/* Their justice-related stories */}
      <section>
        <h2>Their Justice Journey</h2>
        {data.justiceStories.map(story => (
          <StoryCard key={story.id} story={story} />
        ))}
      </section>

      {/* Programs/services they're connected to */}
      <section>
        <h2>Community Connections</h2>
        {data.appearances.map(appearance => (
          <AppearanceCard key={appearance.id} appearance={appearance} />
        ))}
      </section>
    </div>
  );
}
```

## Benefits of This Architecture

### ✅ Single Source of Truth
- Empathy Ledger = authoritative profile data
- No duplicate profile management
- Updates in one place flow everywhere

### ✅ Cultural Sovereignty
- People control their stories in Empathy Ledger
- OCAP® principles enforced at source
- JusticeHub respects privacy settings

### ✅ Automatic Updates
- New Empathy Ledger stories appear on JusticeHub
- Profile updates sync automatically
- No manual intervention needed

### ✅ Privacy & Control
- Only public, justice-related stories shown
- Cultural sensitivity honored
- People can remove JusticeHub appearance anytime

### ✅ Rich Context
- Full cultural context from Empathy Ledger
- Organization connections preserved
- Traditional country and language info included

## Implementation Checklist

### Phase 1: Schema (30 min)
- [ ] Create `profile_appearances` table in JusticeHub
- [ ] Add indexes
- [ ] Test table structure

### Phase 2: Integration Functions (1 hour)
- [ ] Create `getProfileWithStories()` helper
- [ ] Create `isJusticeRelated()` filter
- [ ] Create `syncStoryProfiles()` script
- [ ] Test fetching profiles

### Phase 3: UI Components (2 hours)
- [ ] Create `EmpathyLedgerProfile` component
- [ ] Create `StoryCard` for justice stories
- [ ] Create `AppearanceCard` for connections
- [ ] Test display

### Phase 4: Integration (2 hours)
- [ ] Add profile sections to service pages
- [ ] Add profile sections to program pages
- [ ] Create individual profile pages
- [ ] Run sync script

### Phase 5: Testing (1 hour)
- [ ] Test profile display
- [ ] Test story filtering
- [ ] Test privacy settings
- [ ] Test sync process

## Quick Start Command

```bash
# 1. Create schema
psql -h tednluwflfhxyucgwigh.supabase.co -U postgres < profile_appearances.sql

# 2. Run sync
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/sync-story-profiles.ts

# 3. View results
# Visit any service/program page to see profiles!
```

---

## Summary

**Best-case architecture:**
- ✅ Empathy Ledger = source of truth for people
- ✅ JusticeHub = references profiles (not duplicates)
- ✅ Justice-related stories auto-appear
- ✅ People control their data
- ✅ Cultural protocols honored
- ✅ Real human faces on services/programs

**This creates authentic, culturally-sensitive storytelling that amplifies community voices while respecting data sovereignty.**

Ready to implement? 🚀
