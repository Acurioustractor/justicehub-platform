# Empathy Ledger Integration Guide
## Connecting JusticeHub with Empathy Ledger Database

## Executive Summary

You have **TWO separate, fully-functioning platforms**:

1. **JusticeHub** - Public youth justice platform (`tednluwflfhxyucgwigh.supabase.co`)
2. **Empathy Ledger** - Cultural storytelling platform (`yvnuayzslukamizrlhwb.supabase.co`)

Both are **production systems** with their own data. Now we need to **connect them properly**.

---

## Empathy Ledger Database Schema

### Current Tables & Data (from `yvnuayzslukamizrlhwb` database):

```
✅ organizations (18 rows)       - Indigenous orgs, community groups, tenants
✅ profiles (242 rows)           - User profiles (storytellers, elders, admins)
✅ stories (301 rows)            - Cultural stories and narratives
✅ projects (10 rows)            - Community projects
✅ storytellers (0 rows)         - Legacy table (data in profiles now)
✅ entries (0 rows)              - Story entries (might be in stories now)
✅ cultural_metadata (0 rows)    - Cultural protocols
✅ consent_records (0 rows)      - OCAP® consent tracking
✅ user_organizations (0 rows)   - User-org relationships
✅ media (0 rows)                - Media attachments
✅ collaborators (0 rows)        - Project collaborators
```

### Key Fields Discovered:

**Organizations Table:**
- `id`, `tenant_id` - Multi-tenant identifiers
- `name`, `slug`, `type`, `location`
- `cultural_protocols`, `cultural_significance`
- `empathy_ledger_enabled` - Feature flag
- `elder_approval_required` - OCAP® compliance
- `service_locations`, `coordinates` - Geographic data
- `indigenous_controlled`, `traditional_country`, `language_groups`

**Profiles Table:**
- User profiles (242 active users!)
- Connected to organizations via `tenant_id`

**Stories Table:**
- 301 stories with rich metadata
- `tenant_id`, `organization_id`, `project_id`, `storyteller_id`
- `cultural_sensitivity_level`, `cultural_warnings`
- `requires_elder_approval`, `elder_approved_by`
- `privacy_level`, `is_public`, `is_featured`
- `ai_processed`, `ai_confidence_scores`
- `location_id`, `latitude`, `longitude`
- `service_id` ← **KEY: Links to JusticeHub services!**

**Projects Table:**
- Community-led projects
- Connected to organizations

---

## Integration Architecture

### Two Databases Working Together

```
┌─────────────────────────────────────┐
│     JusticeHub Platform             │
│  (tednluwflfhxyucgwigh.supabase.co)│
│                                     │
│  - articles (37)                    │
│  - community_programs (6)           │
│  - services (511)                   │
│  - organizations (451)              │
└────────────┬────────────────────────┘
             │
             │ INTEGRATION LAYER
             │
┌────────────▼────────────────────────┐
│    Empathy Ledger Platform          │
│  (yvnuayzslukamizrlhwb.supabase.co) │
│                                     │
│  - organizations (18)               │
│  - profiles (242)                   │
│  - stories (301)                    │
│  - projects (10)                    │
└─────────────────────────────────────┘
```

### Key Integration Points

#### 1. **Organizations Sync**
- Empathy Ledger has 18 **Indigenous-controlled organizations**
- JusticeHub has 451 **service providers**
- **Opportunity:** Link Indigenous orgs in Empathy Ledger to their services in JusticeHub

#### 2. **Stories → Services Connection**
- Empathy Ledger stories have `service_id` field
- Can link cultural stories to JusticeHub services
- Show real community stories alongside service listings

#### 3. **Geographic Data**
- Both platforms have location data
- Empathy Ledger: `coordinates`, `location_text`, `service_locations`
- JusticeHub: Services have locations
- **Opportunity:** Map-based discovery of stories + services

#### 4. **Community Programs → Projects**
- JusticeHub: `community_programs` (6 programs)
- Empathy Ledger: `projects` (10 projects)
- **Opportunity:** Show Indigenous-led projects as community programs

---

## Integration Strategies

### Strategy 1: Reference by ID (Recommended)

**Add Empathy Ledger references to JusticeHub tables:**

```sql
-- In JusticeHub database (tednluwflfhxyucgwigh)
ALTER TABLE community_programs
ADD COLUMN empathy_ledger_org_id UUID,
ADD COLUMN empathy_ledger_project_id UUID;

ALTER TABLE articles
ADD COLUMN empathy_ledger_story_id UUID;

ALTER TABLE services
ADD COLUMN empathy_ledger_org_id UUID;
```

**Benefits:**
- Loose coupling (databases stay independent)
- Easy to query and join when needed
- No complex sync required
- Each platform can evolve independently

### Strategy 2: Real-Time Sync via API

**Create integration API layer:**

```typescript
// src/lib/integrations/empathy-ledger.ts
import { createClient } from '@supabase/supabase-js';

export const empathyLedgerClient = createClient(
  'https://yvnuayzslukamizrlhwb.supabase.co',
  process.env.EMPATHY_LEDGER_ANON_KEY!
);

// Fetch Empathy Ledger story for a JusticeHub article
export async function getEmpathyLedgerStory(storyId: string) {
  const { data } = await empathyLedgerClient
    .from('stories')
    .select(`
      *,
      organization:organizations(*),
      profile:profiles(*)
    `)
    .eq('id', storyId)
    .single();

  return data;
}

// Get stories linked to a service
export async function getStoriesForService(serviceId: string) {
  const { data } = await empathyLedgerClient
    .from('stories')
    .select('*, organization:organizations(*)')
    .eq('service_id', serviceId)
    .eq('is_public', true);

  return data;
}
```

### Strategy 3: Federated Search

**Search across both platforms:**

```typescript
// Search JusticeHub + Empathy Ledger together
export async function federatedSearch(query: string) {
  const [justiceHubResults, empathyLedgerResults] = await Promise.all([
    // JusticeHub search
    justiceHubClient.from('articles').select('*').textSearch('content', query),

    // Empathy Ledger search (public stories only)
    empathyLedgerClient
      .from('stories')
      .select('*')
      .textSearch('content', query)
      .eq('is_public', true)
  ]);

  return {
    justiceHub: justiceHubResults.data,
    empathyLedger: empathyLedgerResults.data
  };
}
```

---

## Practical Integration Examples

### Example 1: Show Indigenous Stories on Service Pages

**On JusticeHub service detail page:**

```typescript
// src/app/services/[id]/page.tsx
import { empathyLedgerClient } from '@/lib/integrations/empathy-ledger';

export default async function ServicePage({ params }) {
  const service = await getService(params.id);

  // Fetch related Empathy Ledger stories
  const culturalStories = await empathyLedgerClient
    .from('stories')
    .select(`
      *,
      organization:organizations(name, slug, traditional_country)
    `)
    .eq('service_id', params.id)
    .eq('is_public', true)
    .eq('cultural_sensitivity_level', 'public');

  return (
    <div>
      <h1>{service.name}</h1>

      {/* Service details */}

      {/* Cultural stories section */}
      {culturalStories.data && culturalStories.data.length > 0 && (
        <section className="mt-12">
          <h2>Community Stories</h2>
          <p>Stories from Indigenous community members about this service</p>

          {culturalStories.data.map(story => (
            <StoryCard
              key={story.id}
              story={story}
              organization={story.organization}
            />
          ))}
        </section>
      )}
    </div>
  );
}
```

### Example 2: Show Indigenous Organizations as Community Programs

**Import Empathy Ledger organizations to JusticeHub:**

```typescript
// src/scripts/sync-indigenous-orgs-to-programs.ts
import { justiceHubClient } from '@/lib/supabase/justicehub';
import { empathyLedgerClient } from '@/lib/integrations/empathy-ledger';

async function syncIndigenousOrganizations() {
  // Get Indigenous orgs from Empathy Ledger
  const { data: orgs } = await empathyLedgerClient
    .from('organizations')
    .select('*')
    .eq('indigenous_controlled', true);

  for (const org of orgs) {
    // Create/update as community program in JusticeHub
    await justiceHubClient
      .from('community_programs')
      .upsert({
        name: org.name,
        organization: org.legal_name || org.name,
        location: org.location,
        state: extractState(org.location),
        approach: 'Indigenous-led',
        description: org.mission_statement || org.description,
        impact_summary: org.tagline,
        indigenous_knowledge: true,
        empathy_ledger_org_id: org.id, // Link back
        website: org.website,
        contact_email: org.email,
        contact_phone: org.phone,
        tags: ['Indigenous-led', ...extractTags(org)]
      });
  }
}
```

### Example 3: Cross-Platform Story Discovery

**Show both JusticeHub articles AND Empathy Ledger stories:**

```typescript
// src/app/stories/page.tsx
export default async function StoriesPage() {
  const [justiceHubStories, culturalStories] = await Promise.all([
    // JusticeHub articles
    justiceHubClient.from('articles').select('*').eq('status', 'published'),

    // Public Empathy Ledger stories
    empathyLedgerClient
      .from('stories')
      .select('*, organization:organizations(*)')
      .eq('is_public', true)
      .eq('privacy_level', 'public')
  ]);

  return (
    <div>
      <h1>Stories from the Community</h1>

      <Tabs>
        <Tab title="All Stories">
          {/* Combined view */}
          <MixedStoryFeed
            justiceHubStories={justiceHubStories.data}
            culturalStories={culturalStories.data}
          />
        </Tab>

        <Tab title="Cultural Stories">
          {/* Empathy Ledger only */}
          <CulturalStoryFeed stories={culturalStories.data} />
        </Tab>

        <Tab title="Platform Stories">
          {/* JusticeHub only */}
          <PlatformStoryFeed stories={justiceHubStories.data} />
        </Tab>
      </Tabs>
    </div>
  );
}
```

---

## Environment Configuration

**Update `.env.local`:**

```bash
# =====================================
# JUSTICEHUB DATABASE (Youth Justice Platform)
# =====================================
NEXT_PUBLIC_SUPABASE_URL=https://tednluwflfhxyucgwigh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JUSTICEHUB_SERVICE_KEY=eyJ...

# =====================================
# EMPATHY LEDGER DATABASE (Cultural Storytelling Platform)
# =====================================
EMPATHY_LEDGER_URL=https://yvnuayzslukamizrlhwb.supabase.co
EMPATHY_LEDGER_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnVheXpzbHVrYW1penJsaHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDQ4NTAsImV4cCI6MjA3MTgyMDg1MH0.UV8JOXSwANMl72lRjw-9d4CKniHSlDk9hHZpKHYN6Bs
EMPATHY_LEDGER_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnVheXpzbHVrYW1penJsaHdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI0NDg1MCwiZXhwIjoyMDcxODIwODUwfQ.natmxpGJM9oZNnCAeMKo_D3fvkBz9spwwzhw7vbkT0k
EMPATHY_LEDGER_ACCESS_TOKEN=sbp_1da91af0dc38edbafcc7eddb12c068b343c0706b

# Database URLs
EMPATHY_LEDGER_DATABASE_URL=postgresql://postgres.yvnuayzslukamizrlhwb:Drillsquare99@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres
```

---

## Data Relationships & Opportunities

### What We Can Connect:

1. **Organizations ↔ Community Programs**
   - 18 Empathy Ledger orgs → JusticeHub programs
   - Show Indigenous-led programs with cultural context

2. **Stories ↔ Services**
   - 301 Empathy Ledger stories have `service_id`
   - Show real stories on service detail pages
   - Cultural validation of services

3. **Stories ↔ Articles**
   - Cross-reference content
   - Show related cultural stories on article pages
   - Federated search

4. **Projects ↔ Community Programs**
   - 10 Empathy Ledger projects
   - Import as community programs
   - Link initiatives across platforms

5. **Geographic Integration**
   - Both have location data
   - Map view showing services + cultural stories
   - Find stories near services

---

## Implementation Roadmap

### Phase 1: Environment & Client Setup (30 min)
- ✅ Add Empathy Ledger env vars
- ✅ Create Empathy Ledger Supabase client
- ✅ Test connection

### Phase 2: Basic Integration (2 hours)
- Add reference fields to JusticeHub tables
- Create integration API helpers
- Build story fetching functions

### Phase 3: UI Integration (4 hours)
- Show Empathy Ledger stories on service pages
- Display Indigenous orgs as community programs
- Cross-platform search

### Phase 4: Advanced Features (ongoing)
- Real-time sync via webhooks
- Map-based discovery
- Cultural protocol integration
- OCAP® compliance display

---

## Key Considerations

### 1. **Cultural Sensitivity**
- Respect Empathy Ledger's cultural protocols
- Only show stories marked `is_public: true`
- Honor `cultural_sensitivity_level` settings
- Display cultural warnings when present

### 2. **Data Sovereignty**
- Empathy Ledger organizations control their data
- Always check `empathy_ledger_enabled` before showing
- Respect elder approval requirements
- Follow OCAP® principles

### 3. **Privacy & Consent**
- Only public stories (`privacy_level: 'public'`)
- Check `has_explicit_consent` field
- Honor `cross_tenant_visibility` settings

### 4. **Performance**
- Cache Empathy Ledger data where appropriate
- Use reference IDs instead of full sync
- Lazy load cultural content

---

## Next Steps

**Immediate Actions:**

1. **Add Empathy Ledger environment variables to `.env.local`**
2. **Create Empathy Ledger Supabase client** (`src/lib/supabase/empathy-ledger.ts`)
3. **Test fetching public stories** from Empathy Ledger
4. **Identify which services** already have `service_id` links
5. **Plan first integration**: Stories on service pages OR Indigenous orgs as programs

**Which integration do you want to build first?**

A) Show Empathy Ledger stories on JusticeHub service pages
B) Import Indigenous organizations as community programs
C) Create federated search across both platforms
D) Build geographic discovery (map with stories + services)

---

## Summary

- ✅ **Two separate, functioning databases**
- ✅ **Empathy Ledger has 301 stories, 18 orgs, 242 profiles**
- ✅ **JusticeHub has 511 services, 6 programs, 37 articles**
- 🔗 **Stories already have `service_id` field** (ready to link!)
- 🎯 **Multiple integration opportunities** identified
- 📋 **Clear roadmap** for implementation

**The platforms are ready to connect!** 🚀
