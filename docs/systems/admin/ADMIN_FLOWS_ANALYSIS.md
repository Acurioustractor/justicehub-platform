# JusticeHub Admin Flows - Current State & Enhancement Plan

## Current Admin System Overview

### Existing Admin Pages

**Main Dashboard** (`/admin`)
- Stats overview (People, Stories, Art & Innovation, Programs, Services)
- Connection health monitoring (% of services/programs with profile links)
- System status indicators
- Quick actions (Add Person, Write Story, Add Program, Import Services)

**Profile Management** (`/admin/profiles`)
- List all profiles with filtering (Public, Private, Featured, No User Account)
- Shows connection counts (art projects, programs, services)
- Actions: View, Edit, Manage LINKS
- Stats: Total, Public, Private, Featured counts

**Profile Connections** (`/admin/profiles/[id]/connections`)
- Manual linking interface
- Links profiles to:
  - Art & Innovation projects
  - Community Programs
  - Services
- Role assignment via prompts
- Add/remove connections

**Content Management**
- `/admin/blog` - Blog posts
- `/admin/stories` - Stories management
- `/admin/programs` - Community programs
- `/admin/services` - Services
- `/admin/art-innovation` - Art projects
- `/admin/media` - Media assets

## What's Missing for Empathy Ledger Integration

### 1. Organizations Section - NOT VISIBLE

**Current State:**
- Organizations exist in database
- 32 organization ↔ profile links created automatically
- 7 organizations (Oonchiumpa, Diagrama, Community Elder, etc.)
- NO admin interface to view/manage organizations

**Needed:**
```
/admin/organizations
- List all organizations
- Show team members (linked profiles)
- Edit organization details
- Manage organization ↔ profile links
- View auto-linked profiles
```

### 2. Transcripts/Stories Section - PARTIALLY EXISTS

**Current State:**
- 35 transcripts synced from Empathy Ledger as blog_posts
- Auto-linked to profiles via blog_posts_profiles
- Stories admin exists but doesn't show:
  - Which stories are synced from Empathy Ledger
  - Profile links for stories
  - Video/audio URLs from transcripts

**Needed:**
```
/admin/blog - ENHANCE
- Show "Empathy Ledger" badge for synced content
- Display linked profiles
- Show video/audio URLs
- Filter by: Synced from Empathy Ledger, Has Profiles, Published/Draft
- Quick view of transcript metadata
```

### 3. Profile Connections - MISSING NEW RELATIONSHIPS

**Current State:**
- Manual linking to: Art Projects, Programs, Services
- MISSING: Organizations, Stories/Transcripts

**Needed:**
```
/admin/profiles/[id]/connections - ENHANCE
- Add "Organizations" tab
  - Show auto-linked organizations
  - Edit roles
  - Add manual organization links
  - View relationship history

- Add "Stories/Transcripts" tab
  - Show auto-linked transcripts
  - Link profile to additional stories
  - Set role (subject, author, contributor)

- Add "Empathy Ledger" tab
  - Show sync status
  - View Empathy Ledger profile link
  - Manual sync trigger
  - Last sync timestamp
```

### 4. Auto-Linking Dashboard - DOESN'T EXIST

**Current State:**
- Auto-linking happening behind the scenes
- 67 automatic relationships created
- No visibility into what was auto-linked
- No way to review/approve/reject suggestions

**Needed:**
```
/admin/auto-linking (NEW)
- Recent Auto-Links
  - Last 50 automatic links created
  - Who, What, When, Confidence %
  - Edit/Remove option

- Pending Suggestions
  - Medium confidence suggestions (60-89%)
  - Review and approve/reject
  - Provide feedback

- System Performance
  - Success rate metrics
  - Most common link types
  - Failed matches to review

- Configuration
  - Confidence thresholds
  - Enable/disable auto-apply
  - Matching rules
```

### 5. Empathy Ledger Sync Dashboard - DOESN'T EXIST

**Current State:**
- Syncing happens via scripts
- No admin UI to trigger syncs
- No visibility into sync history
- Can't see what's available to sync

**Needed:**
```
/admin/empathy-ledger (NEW)
- Sync Status
  - Last profile sync timestamp
  - Last content sync timestamp
  - Profiles flagged in Empathy Ledger: 32
  - Profiles synced to JusticeHub: 31
  - Transcripts available: 36
  - Transcripts synced: 35

- Quick Actions
  - [Sync Profiles Now]
  - [Sync Transcripts Now]
  - [Sync Galleries Now]
  - [Full Sync Everything]

- Sync History
  - Log of all sync operations
  - What was synced
  - Errors encountered
  - Auto-links created during sync

- Profile Mapping
  - View Empathy Ledger ↔ JusticeHub profile mappings
  - Resolve conflicts (like Benjamin Knight duplicate)
  - Manual profile linking
```

## Enhanced Admin Flow Proposal

### User Journey 1: View Auto-Linked Content

```
Admin Dashboard
    ↓
"Connection Health" shows 67 auto-links (NEW METRIC)
    ↓
Click "View Auto-Links" button
    ↓
/admin/auto-linking
    ↓
See recent auto-links:
  - Kristy Bloomfield → Oonchiumpa (Chair) - 95% confidence
  - Joe Kwon transcript → Joe Kwon profile - 100% confidence
  - Kate Bjur → Diagrama (Director) - 95% confidence
    ↓
Click profile to edit/review connection
```

### User Journey 2: Manage Organization Team

```
Admin Dashboard
    ↓
New "Organizations" stat card (NEW)
    ↓
Click to /admin/organizations
    ↓
See all organizations with team counts:
  - Oonchiumpa (3 people)
  - Diagrama (4 people)
  - Independent Storytellers (14 people)
    ↓
Click "Diagrama"
    ↓
/admin/organizations/diagrama
    ↓
See team members:
  - Kate Bjur (Director) [AUTO-LINKED]
  - Chelo (Team Member) [AUTO-LINKED]
  - Young People Murcia (Team Member) [AUTO-LINKED]
    ↓
Click "Edit Role" or "Remove" or "Add Member"
```

### User Journey 3: Review Transcript Links

```
/admin/profiles
    ↓
Click profile "Kristy Bloomfield"
    ↓
Click "LINKS" button
    ↓
/admin/profiles/[id]/connections
    ↓
NEW TABS:
  [Art Projects] [Programs] [Services] [Organizations] [Stories] [Empathy Ledger]
    ↓
Click "Stories" tab
    ↓
See linked transcripts:
  - "Caterpillar Dreaming" [SUBJECT] [AUTO-LINKED]
  - "Sitdown interview #1" [SUBJECT] [AUTO-LINKED]
  - "Kristy - Full Interview Law Students" [SUBJECT] [AUTO-LINKED]
  - "Kristy Bloomfield - Interview Transcript" [SUBJECT] [AUTO-LINKED]
    ↓
Click video icon to watch transcript
```

### User Journey 4: Sync from Empathy Ledger

```
/admin/empathy-ledger (NEW)
    ↓
See sync status:
  ✅ Profiles: 31/32 synced (1 failed - Benjamin Knight duplicate)
  ✅ Transcripts: 35/36 synced
  ⏳ Galleries: 0/2 synced
    ↓
Click [Sync Galleries Now]
    ↓
See progress:
  ✨ Syncing "Oonchiumpa Founders" gallery...
  ✨ Syncing "Law Students Event 2025" gallery...
  🔗 Auto-linking to Kristy Bloomfield...
  ✅ 2 galleries synced, 2 auto-links created
    ↓
View sync history log
```

## Database Query Enhancements Needed

### 1. Dashboard - Add Auto-Linking Stats

```typescript
// Add to /admin/page.tsx
const { count: orgLinksCount } = await supabase
  .from('organizations_profiles')
  .select('*', { count: 'exact', head: true });

const { count: transcriptLinksCount } = await supabase
  .from('blog_posts_profiles')
  .select('*', { count: 'exact', head: true });

const { count: autoLinksCount } = await supabase
  .from('content_link_suggestions')
  .select('*', { count: 'exact', head: true })
  .eq('auto_applied', true);
```

### 2. Profile Connections - Show All Relationship Types

```typescript
// Add to /admin/profiles/[id]/connections/page.tsx

// Organizations
const { data: orgLinks } = await supabase
  .from('organizations_profiles')
  .select(`
    *,
    organizations (id, name, slug)
  `)
  .eq('public_profile_id', params.id);

// Transcripts/Stories
const { data: storyLinks } = await supabase
  .from('blog_posts_profiles')
  .select(`
    *,
    blog_posts (id, title, slug, video_url, synced_from_empathy_ledger)
  `)
  .eq('public_profile_id', params.id);

// Empathy Ledger status
const { data: profile } = await supabase
  .from('public_profiles')
  .select('empathy_ledger_profile_id, synced_from_empathy_ledger, last_synced_at')
  .eq('id', params.id)
  .single();
```

### 3. Organizations Page - NEW

```typescript
// New page: /admin/organizations/page.tsx

const { data: organizations } = await supabase
  .from('organizations')
  .select(`
    *,
    organizations_profiles (
      count,
      public_profiles (id, full_name, photo_url)
    )
  `)
  .order('name');
```

## UI Component Needs

### 1. Auto-Link Badge Component

```tsx
<AutoLinkBadge
  confidence={0.95}
  source="empathy_ledger"
  timestamp="2025-01-26T10:30:00Z"
/>

// Displays:
// [AUTO-LINKED] 95% • Empathy Ledger • 2 hours ago
```

### 2. Sync Status Indicator

```tsx
<SyncStatus
  lastSync="2025-01-26T10:30:00Z"
  status="success"
  itemsSynced={35}
/>

// Displays:
// ✅ Last sync: 2 hours ago • 35 items • [Sync Now]
```

### 3. Relationship Table

```tsx
<RelationshipTable
  relationships={orgLinks}
  type="organization"
  onEdit={(link) => ...}
  onRemove={(link) => ...}
  showAutoLinkBadge={true}
/>
```

### 4. Content Preview Card

```tsx
<TranscriptCard
  title="Joe Kwon - caring for those who care"
  videoUrl="https://..."
  audioUrl="https://..."
  linkedProfiles={[{name: "Joe Kwon", role: "subject"}]}
  syncedFrom="empathy_ledger"
/>
```

## Priority Implementation Order

### Phase 1: Visibility (High Priority)

1. **Dashboard Enhancement**
   - Add Organizations stat card
   - Add Auto-Linking stat card
   - Add Empathy Ledger sync status

2. **Profile Connections - Add Tabs**
   - Organizations tab
   - Stories/Transcripts tab
   - Empathy Ledger tab

3. **Auto-Link Indicators**
   - Badge component showing auto-linked items
   - Confidence scores
   - Timestamps

### Phase 2: Management (Medium Priority)

4. **Organizations Admin Page**
   - `/admin/organizations` - list page
   - `/admin/organizations/[slug]` - detail page
   - Team member management
   - Edit organization details

5. **Enhanced Blog/Stories Admin**
   - Filter by Empathy Ledger content
   - Show profile links
   - Display video/audio URLs
   - Transcript metadata

### Phase 3: Advanced Features (Lower Priority)

6. **Auto-Linking Dashboard**
   - `/admin/auto-linking`
   - Review pending suggestions
   - System performance metrics
   - Configuration settings

7. **Empathy Ledger Sync Dashboard**
   - `/admin/empathy-ledger`
   - One-click sync buttons
   - Sync history log
   - Profile mapping tools
   - Conflict resolution

## Current Gap Summary

**What Works:**
✅ Auto-linking profiles to organizations (32 links)
✅ Auto-linking transcripts to profiles (35 links)
✅ Manual linking to art/programs/services
✅ Profile visibility management
✅ Basic content management

**What's Missing:**
❌ No way to view organizations in admin
❌ No way to see auto-linked relationships
❌ No way to manage organization ↔ profile links
❌ No way to see transcript ↔ profile links
❌ No Empathy Ledger sync dashboard
❌ No auto-linking review interface
❌ Profile connections page doesn't show orgs or stories

**Impact:**
- 67 automatic relationships exist but are invisible to admins
- Can't manage organization teams
- Can't see which transcripts belong to which people
- Can't trigger syncs from UI
- Can't review/approve auto-link suggestions

## Next Steps

To make the auto-linked content visible and manageable, we need to build (in order):

1. Organizations admin page
2. Enhanced profile connections page (add Organizations and Stories tabs)
3. Dashboard stat cards for new content types
4. Auto-link badges throughout the interface
5. Empathy Ledger sync dashboard
6. Auto-linking review interface

This will transform the invisible auto-linked content into a fully manageable, visible system that admins can work with confidently.
