# Empathy Ledger ↔ JusticeHub Integration Strategy

## Vision

**Empathy Ledger** = Source of truth for people's stories, consent, cultural protocols
**JusticeHub** = Public showcase of youth justice work with consent-controlled content

People and organizations own their data in Empathy Ledger. JusticeHub displays what they consent to share publicly.

## Current State

### Empathy Ledger Database (yvnuayzslukamizrlhwb.supabase.co)

**Organizations**: 10+ Indigenous-controlled orgs
- Oonchiumpa
- A Curious Tractor
- Snow Foundation
- Palm Island Community Company (Manbarra Country)
- TOMNET
- Beyond Shadows
- Deadly Hearts
- Confit Pathways

**Profiles**: 5 people
- Javier Aparicio Grau
- Matthew Neill
- Mary Running Bear
- Others

**Projects**: 10 active projects
- Law Student Workshops (Oonchiumpa)
- Others across organizations

**Stories**: TBD (need to fix query relationship)

### JusticeHub Database (tednluwflfhxyucgwigh.supabase.co)

**Organizations**: 452 (mostly skeletal)
**public_profiles**: 2 (Benjamin Knight, Nicholas Marchesi)
**community_programs**: 10
**international_programs**: 52
**stories**: 0

## Integration Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    EMPATHY LEDGER                            │
│                  (Source of Truth)                           │
│                                                              │
│  Organizations → Profiles → Projects → Stories              │
│       ↓              ↓          ↓          ↓                │
│  Cultural      Consent    Context    Published             │
│  Protocols     Controls   Model     Content                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Consent-Controlled Sync
                  │
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                      JUSTICEHUB                              │
│                  (Public Showcase)                           │
│                                                              │
│  Organizations → People → Programs → Stories                │
│       ↓              ↓          ↓          ↓                │
│  Display         Cards     Showcase   Content              │
│  Only Public     +Links    +Outcomes  +Media               │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Consent First**: Only show content marked `is_public: true` and `privacy_level: 'public'`
2. **Cultural Protocols**: Respect cultural warnings, elder approval requirements
3. **Data Ownership**: People control their data in Empathy Ledger
4. **Attribution**: Always link back to source, credit storytellers
5. **No Duplication**: JusticeHub references Empathy Ledger data, doesn't duplicate it

## Implementation Phases

### Phase 1: Link Existing Data ✓ (Already Set Up!)

The integration client exists: `src/lib/supabase/empathy-ledger.ts`

**Functions available:**
- `getPublicStories()` - Get consent-approved stories
- `getIndigenousOrganizations()` - Get Indigenous-controlled orgs
- `getStoriesForOrganization()` - Get org-specific stories
- `getPublicProjects()` - Get active projects
- `shouldShowCulturalWarning()` - Check cultural sensitivity

**What to do:**
- [x] Empathy Ledger client exists
- [ ] Fix `getPublicStories()` query (relationship ambiguity)
- [ ] Add `empathy_ledger_profile_id` foreign key to JusticeHub `public_profiles`
- [ ] Create sync script to link matching organizations
- [ ] Create sync script to import public profiles

### Phase 2: Sync Organizations

**Goal**: Link JusticeHub orgs to Empathy Ledger orgs

**Approach**:
1. Match by slug: `oonchiumpa`, `a-curious-tractor`, etc.
2. Add `empathy_ledger_org_id` column to JusticeHub `organizations` table
3. Sync organization data from Empathy Ledger for matched orgs:
   - Name, description, location
   - Cultural protocols, traditional country
   - Indigenous controlled status

**Sync Direction**: Empathy Ledger → JusticeHub (read-only)

### Phase 3: Sync People/Profiles

**Goal**: Display Empathy Ledger profiles on JusticeHub

**Approach**:
1. JusticeHub `public_profiles` gets `empathy_ledger_profile_id` field
2. When displaying a profile, check if linked to Empathy Ledger
3. If linked, pull additional data:
   - Bio, avatar, display name
   - Organization affiliations
   - Project involvement

**Display Rules**:
- Only show profiles with `is_public: true` in Empathy Ledger
- Respect consent settings
- Show "Managed via Empathy Ledger" badge
- Link to Empathy Ledger profile if public

### Phase 4: Sync Projects → Programs

**Goal**: Display Empathy Ledger projects as JusticeHub programs

**Mapping**:
```
Empathy Ledger Project → JusticeHub Community Program
- name → name
- description → description
- location → location
- organization_id → organization_id (via link)
- status → status
```

**Sync Script**:
```typescript
// src/scripts/sync-empathy-ledger-projects.ts
import { getPublicProjects } from '@/lib/supabase/empathy-ledger';
import { supabase } from '@/lib/supabase/client';

async function syncProjects() {
  const projects = await getPublicProjects();

  for (const project of projects) {
    // Find matching JusticeHub org
    const { data: jhOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('empathy_ledger_org_id', project.organization_id)
      .single();

    if (!jhOrg) continue;

    // Upsert program
    await supabase
      .from('community_programs')
      .upsert({
        empathy_ledger_project_id: project.id,
        organization_id: jhOrg.id,
        name: project.name,
        description: project.description,
        location: project.location,
        status: project.status,
        synced_at: new Date().toISOString()
      });
  }
}
```

### Phase 5: Stories Integration

**Goal**: Display Empathy Ledger stories on JusticeHub

**First, fix the query**:
```typescript
// In src/lib/supabase/empathy-ledger.ts
export async function getPublicStories(limit = 10) {
  const { data, error } = await empathyLedgerClient
    .from('stories')
    .select(`
      *,
      organization:organizations!stories_organization_id_fkey(name, slug, traditional_country, indigenous_controlled),
      storyteller:profiles!stories_storyteller_id_fkey(display_name, avatar_url),
      author:profiles!stories_author_id_fkey(display_name)
    `)
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .order('published_at', { ascending: false })
    .limit(limit);

  return data || [];
}
```

**Display Components**:

1. **Story Card** (`src/components/empathy-ledger/StoryCard.tsx`)
```typescript
interface StoryCardProps {
  story: EmpathyLedgerStory;
  showCulturalWarning?: boolean;
}

export function StoryCard({ story, showCulturalWarning = true }: StoryCardProps) {
  // Display story with:
  // - Cultural warning if needed
  // - Attribution to storyteller
  // - Link to organization
  // - Consent badge
  // - "Read on Empathy Ledger" link
}
```

2. **Stories Feed** (`src/app/stories/page.tsx`)
```typescript
export default async function StoriesPage() {
  const stories = await getPublicStories(20);

  return (
    <div>
      <h1>Community Stories</h1>
      <p>Stories shared with consent from Empathy Ledger</p>

      {stories.map(story => (
        <StoryCard key={story.id} story={story} />
      ))}
    </div>
  );
}
```

3. **Organization Stories** (`src/app/organizations/[slug]/stories.tsx`)
```typescript
// Show stories for a specific organization
const orgStories = await getStoriesForOrganization(orgId);
```

### Phase 6: Cultural Protocols UI

**Goal**: Respect and display cultural protocols

**Components needed**:

1. **Cultural Warning Banner**
```typescript
function CulturalWarning({ warnings }: { warnings: string[] }) {
  return (
    <div className="border-2 border-yellow-600 bg-yellow-50 p-4">
      <h3>Cultural Sensitivity Notice</h3>
      <ul>
        {warnings.map((w, i) => <li key={i}>{w}</li>)}
      </ul>
    </div>
  );
}
```

2. **Elder Approval Badge**
```typescript
function ElderApprovedBadge({ approvedBy, approvedAt }: Props) {
  return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-600 px-3 py-1">
      <Check className="h-4 w-4" />
      <span>Elder Approved</span>
    </div>
  );
}
```

3. **Consent Indicator**
```typescript
function ConsentBadge() {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Shield className="h-4 w-4" />
      <span>Shared with consent via Empathy Ledger</span>
    </div>
  );
}
```

## Database Schema Changes

### JusticeHub Tables

#### organizations
```sql
ALTER TABLE organizations
ADD COLUMN empathy_ledger_org_id UUID REFERENCES empathy_ledger.organizations(id),
ADD COLUMN synced_from_empathy_ledger BOOLEAN DEFAULT false,
ADD COLUMN last_synced_at TIMESTAMP;

CREATE INDEX idx_orgs_empathy_ledger ON organizations(empathy_ledger_org_id);
```

#### public_profiles
```sql
ALTER TABLE public_profiles
ADD COLUMN empathy_ledger_profile_id UUID,
ADD COLUMN synced_from_empathy_ledger BOOLEAN DEFAULT false,
ADD COLUMN last_synced_at TIMESTAMP;

CREATE INDEX idx_profiles_empathy_ledger ON public_profiles(empathy_ledger_profile_id);
```

#### community_programs
```sql
ALTER TABLE community_programs
ADD COLUMN empathy_ledger_project_id UUID,
ADD COLUMN synced_from_empathy_ledger BOOLEAN DEFAULT false,
ADD COLUMN last_synced_at TIMESTAMP;

CREATE INDEX idx_programs_empathy_ledger ON community_programs(empathy_ledger_project_id);
```

#### stories (new table)
```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empathy_ledger_story_id UUID UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  featured_profile_id UUID REFERENCES public_profiles(id),
  organization_id UUID REFERENCES organizations(id),
  is_public BOOLEAN DEFAULT true,
  published_at TIMESTAMP,
  synced_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Note: Actual story content stays in Empathy Ledger
-- JusticeHub only stores reference + metadata
```

## Sync Scripts

### 1. Link Organizations
```bash
npx tsx src/scripts/sync-empathy-ledger-organizations.ts
```

### 2. Import Profiles
```bash
npx tsx src/scripts/sync-empathy-ledger-profiles.ts
```

### 3. Import Projects
```bash
npx tsx src/scripts/sync-empathy-ledger-projects.ts
```

### 4. Import Stories (metadata only)
```bash
npx tsx src/scripts/sync-empathy-ledger-stories.ts
```

## User Experience

### For Organizations

**In Empathy Ledger:**
1. Create organization profile
2. Set cultural protocols
3. Mark as Indigenous-controlled
4. Enable Empathy Ledger features
5. Set `empathy_ledger_enabled: true`

**In JusticeHub:**
1. Organization appears automatically (if consented)
2. Shows "Empathy Ledger Verified" badge
3. Cultural protocols displayed
4. Links back to Empathy Ledger

### For People

**In Empathy Ledger:**
1. Create profile with bio, photo
2. Link to organizations
3. Link to projects/stories
4. Set privacy: `is_public: true`

**In JusticeHub:**
1. Profile appears on People page
2. Shows organization affiliations
3. Shows projects they're involved in
4. Links to their stories
5. "Managed via Empathy Ledger" badge

### For Stories

**In Empathy Ledger:**
1. Author creates story
2. Storyteller gives consent
3. Elder approves (if required)
4. Set `is_public: true`, `privacy_level: 'public'`

**In JusticeHub:**
1. Story appears on Stories page
2. Cultural warnings displayed
3. Elder approval badge shown
4. Attribution to storyteller
5. "Read full story on Empathy Ledger" link

## Benefits

### For Community Members
- **Own their data** in Empathy Ledger
- **Control consent** at granular level
- **Cultural protocols** respected
- **Elder approval** process honored
- **Attribution** always given

### For Organizations
- **Single source of truth** (Empathy Ledger)
- **Multi-platform reach** (also displayed on JusticeHub)
- **Cultural safety** built-in
- **Verification** through Empathy Ledger link

### For JusticeHub
- **Rich content** from Empathy Ledger
- **Consent-controlled** automatically
- **Culturally appropriate** by design
- **No data duplication** (references only)
- **Authenticated source** via Empathy Ledger

## Next Steps

1. **Fix `getPublicStories()` query** - resolve relationship ambiguity
2. **Add foreign key columns** to JusticeHub tables
3. **Build sync scripts** for orgs, profiles, projects
4. **Create display components** for stories with cultural protocols
5. **Build `/stories` page** pulling from Empathy Ledger
6. **Add "Empathy Ledger Verified" badges** to org/people cards
7. **Test with Oonchiumpa** as pilot organization

## Questions to Consider

1. Should JusticeHub have its own stories OR only display Empathy Ledger stories?
2. How often should we sync? (Real-time webhook vs daily batch?)
3. Should JusticeHub profiles be createable OR only sync from Empathy Ledger?
4. How do we handle org/profile conflicts? (Empathy Ledger wins?)
5. Do we need offline fallback if Empathy Ledger is unavailable?
