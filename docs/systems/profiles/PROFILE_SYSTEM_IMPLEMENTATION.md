# Profile System Implementation Plan

## Overview

Create a comprehensive profile system where people connect to everything across JusticeHub - organizations, programs, services, stories - and everything links back to people.

## Database Schema

### Existing Junction Tables
- ✅ `community_programs_profiles` - People → Programs
- ✅ `services_profiles` - People → Services
- ✅ `art_innovation_profiles` - People → Art Projects

### New Junction Tables (Migration 20250126000005)
- 🆕 `organizations_profiles` - People → Organizations
- 🆕 `blog_posts_profiles` - People → Stories/Blog Posts

### Core Profile Fields
```sql
public_profiles:
  - id (UUID)
  - full_name (text)
  - slug (text, unique)
  - bio (text)
  - photo_url (text)
  - role_tags (text[]) -- e.g., ['founder', 'advocate']
  - is_public (boolean) -- Show on public site
  - is_featured (boolean) -- Feature prominently
  - empathy_ledger_profile_id (UUID) -- Link to Empathy Ledger
  - synced_from_empathy_ledger (boolean)
  - sync_type (text) -- 'reference', 'full', 'manual'
  - last_synced_at (timestamp)
```

## 1. Profile Card Design

### Public Profile Card (on /people page)
```
┌─────────────────────────────────────────────────────┐
│ [Photo]                                             │
│                                                     │
│ Kristy Bloomfield                                   │
│ Founder · Leader                                    │
│                                                     │
│ Chair of Oonchiumpa, creating generational...      │
│                                                     │
│ 🏢 Oonchiumpa                                       │
│ 📝 3 stories                                        │
│ 🛡️ Empathy Ledger                                   │
│                                                     │
│ [View Profile →]                                    │
└─────────────────────────────────────────────────────┘
```

**What to show:**
- Photo
- Name
- Role tags (founder, advocate, etc.)
- Bio snippet (first 100 chars)
- Primary organization
- Story count
- Empathy Ledger badge (if synced)
- Link to full profile

### Featured Profile Card (homepage/featured sections)
```
┌─────────────────────────────────────────────────────┐
│           [Larger Photo - 200x200]                  │
│                                                     │
│           Kristy Bloomfield                         │
│           Founder · Leader                          │
│                                                     │
│  "Creating generational wealth and economic         │
│   opportunities on Country"                         │
│                                                     │
│  Chair, Oonchiumpa                                  │
│  📍 Central Australia                               │
│                                                     │
│  [Read Stories →]    [View Profile →]              │
└─────────────────────────────────────────────────────┘
```

## 2. Individual Profile Page

### `/people/[slug]`

```
┌──────────────────────────────────────────────────────────────┐
│  [Header with photo, name, roles]                            │
│                                                              │
│  Kristy Bloomfield                                           │
│  Founder · Leader · Advocate                                 │
│                                                              │
│  🛡️ Profile managed in Empathy Ledger                        │
│  Last updated: 2 hours ago                                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  About                                                        │
│  ────────────────────────────────────────────────────        │
│  [Full bio from Empathy Ledger or JusticeHub]               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Organizations (2)                                            │
│  ────────────────────────────────────────────────────        │
│  ┌────────────────────────┐  ┌────────────────────────┐     │
│  │ [Logo]                 │  │ [Logo]                 │     │
│  │ Oonchiumpa             │  │ A Curious Tractor      │     │
│  │ Founder & Chair        │  │ Board Member           │     │
│  │ 2018 - Present         │  │ 2020 - Present         │     │
│  └────────────────────────┘  └────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Programs (3)                                                 │
│  ────────────────────────────────────────────────────        │
│  • Container Project - Project Lead                          │
│  • Youth Leadership Program - Mentor                         │
│  • Cultural Healing Initiative - Co-founder                  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Stories (5)                                                  │
│  ────────────────────────────────────────────────────        │
│  [Story cards with thumbnails, titles, dates]               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Services (1)                                                 │
│  ────────────────────────────────────────────────────        │
│  • Oonchiumpa Community Support - Coordinator                │
└──────────────────────────────────────────────────────────────┘
```

## 3. Admin Interface

### `/admin/profiles` - Enhanced

**Current features:**
- ✅ List all profiles
- ✅ Filter by public/private/featured
- ✅ View profile details

**Add:**
- Edit profile inline or modal
- Toggle public/private visibility
- Toggle featured status
- Assign role tags
- Link to organizations (search + select)
- Link to programs (search + select)
- Link to services (search + select)
- Link to stories (search + select)
- View Empathy Ledger sync status
- Manual sync trigger

### Admin Profile Editor Modal/Page

```
┌──────────────────────────────────────────────────────────────┐
│  Edit Profile: Kristy Bloomfield                             │
│  ────────────────────────────────────────────────────        │
│                                                              │
│  Basic Info                                                  │
│  Name:     [Kristy Bloomfield          ]                     │
│  Slug:     [kristy-bloomfield          ] (auto-generated)    │
│  Photo:    [Upload / URL               ]                     │
│  Bio:      [Full bio text...                              ] │
│                                                              │
│  Visibility                                                  │
│  ☑ Public (show on website)                                  │
│  ☑ Featured (show prominently)                               │
│                                                              │
│  Role Tags                                                   │
│  [x] Founder   [x] Leader   [ ] Advocate   [ ] Practitioner │
│                                                              │
│  Empathy Ledger                                              │
│  🛡️ Synced from Empathy Ledger                               │
│  Last synced: 2 hours ago                                    │
│  [Trigger Sync Now]                                          │
│                                                              │
│  ────────────────────────────────────────────────────        │
│                                                              │
│  Organizations                                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Oonchiumpa                                             │ │
│  │ Role: [Founder & Chair ]                               │ │
│  │ Start: [2018          ]  End: [          ] (current)   │ │
│  │ ☑ Featured on org page                           [Remove] │ │
│  └────────────────────────────────────────────────────────┘ │
│  [+ Add Organization]                                        │
│                                                              │
│  Programs                                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Container Project                                      │ │
│  │ Role: [Project Lead ]                            [Remove] │ │
│  └────────────────────────────────────────────────────────┘ │
│  [+ Add Program]                                             │
│                                                              │
│  Stories                                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Building Revolution in Shipping Containers             │ │
│  │ Role: [Subject ]                                 [Remove] │ │
│  └────────────────────────────────────────────────────────┘ │
│  [+ Add Story]                                               │
│                                                              │
│  [Cancel]                              [Save Changes]        │
└──────────────────────────────────────────────────────────────┘
```

## 4. Cross-Linking Display

### On Organization Pages (`/organizations/[slug]`)

Add "People" section:
```
┌──────────────────────────────────────────────────────────────┐
│  Our Team                                                     │
│  ────────────────────────────────────────────────────        │
│                                                              │
│  Leadership                                                  │
│  ┌─────────┬─────────┬─────────┐                            │
│  │ [Photo] │ [Photo] │ [Photo] │                            │
│  │ Kristy  │ Tanya   │Patricia │                            │
│  │ Founder │ Founder │ Founder │                            │
│  └─────────┴─────────┴─────────┘                            │
│                                                              │
│  Staff & Volunteers (12)                                     │
│  [View all →]                                                │
└──────────────────────────────────────────────────────────────┘
```

### On Program Pages (`/community-programs/[id]`)

Add "People Involved" section:
```
┌──────────────────────────────────────────────────────────────┐
│  People Involved                                              │
│  ────────────────────────────────────────────────────        │
│  • Kristy Bloomfield - Project Lead                          │
│  • Uncle Dale - Cultural Advisor                             │
│  • Kate Bjur - Program Coordinator                           │
│  [View all 8 people →]                                       │
└──────────────────────────────────────────────────────────────┘
```

### On Story Pages (`/stories/[slug]`)

Add "Featured People" section:
```
┌──────────────────────────────────────────────────────────────┐
│  Featured in this story                                       │
│  ────────────────────────────────────────────────────        │
│  ┌─────────────────────┬─────────────────────┐              │
│  │ [Photo] Kristy      │ [Photo] Tanya       │              │
│  │ Founder, Oonchiumpa │ Co-founder          │              │
│  └─────────────────────┴─────────────────────┘              │
└──────────────────────────────────────────────────────────────┘
```

## 5. Implementation Steps

### Phase 1: Database Setup ✅
1. Run migration to create junction tables
2. Set up RLS policies
3. Test junction table queries

### Phase 2: Profile Cards
1. Create `ProfileCard` component
2. Create `FeaturedProfileCard` component
3. Update `/people` page to use new cards
4. Add Empathy Ledger badges

### Phase 3: Individual Profile Pages
1. Create `/people/[slug]/page.tsx`
2. Query all linked entities (orgs, programs, services, stories)
3. Display connections in sections
4. Add breadcrumbs and navigation

### Phase 4: Admin Editor
1. Extend `/admin/profiles` with edit capability
2. Create profile editor modal/page
3. Add search/select for linking entities
4. Add junction table CRUD operations
5. Add public/private toggle
6. Add featured toggle

### Phase 5: Cross-Linking Display
1. Update organization pages to show people
2. Update program pages to show people
3. Update service pages to show people
4. Update story pages to show people
5. Ensure bidirectional navigation works

### Phase 6: Auto-Linking (Smart)
1. Auto-link synced profiles to organizations based on Empathy Ledger data
2. Suggest links based on bio text analysis
3. Batch linking operations

## 6. SQL for Manual Setup (Run in Supabase)

```sql
-- See supabase/migrations/20250126000005_add_organizations_profiles.sql

-- After running migration, create some test links:

-- Link Kristy to Oonchiumpa
INSERT INTO organizations_profiles (organization_id, public_profile_id, role, is_current, is_featured)
SELECT o.id, p.id, 'Founder & Chair', true, true
FROM organizations o, public_profiles p
WHERE o.slug = 'oonchiumpa' AND p.slug = 'kristy-bloomfield';

-- Link multiple founders at once
INSERT INTO organizations_profiles (organization_id, public_profile_id, role, is_current, is_featured)
SELECT o.id, p.id, 'Founder', true, true
FROM organizations o
CROSS JOIN (
  SELECT id FROM public_profiles WHERE slug IN ('tanya-turner', 'patricia-ann-miller')
) p
WHERE o.slug = 'oonchiumpa';
```

## 7. Component Structure

```
components/
  profiles/
    ProfileCard.tsx          - Standard profile card
    FeaturedProfileCard.tsx  - Larger featured card
    ProfileHeader.tsx        - Profile page header
    ProfileConnections.tsx   - Shows all connections
    ProfileOrganizations.tsx - Organization list
    ProfilePrograms.tsx      - Program list
    ProfileStories.tsx       - Story list
    ProfileServices.tsx      - Service list

  admin/
    ProfileEditor.tsx        - Main editor component
    ProfileLinker.tsx        - Link to entities
    EntitySelector.tsx       - Search/select component

  shared/
    EmpathyLedgerBadge.tsx  - Shows sync status
```

## 8. Key Features

### Bi-directional Linking
- People → Organizations (and vice versa)
- People → Programs (and vice versa)
- People → Stories (and vice versa)
- People → Services (and vice versa)

### Rich Metadata
- Roles (founder, director, volunteer, etc.)
- Time ranges (start/end dates)
- Featured flags (highlight important people)
- Display order (control ordering)

### Sync Integration
- Empathy Ledger profiles show badge
- Last sync timestamp
- Manual sync trigger
- Conflict resolution (EL vs manual)

### Admin Control
- Toggle public/private per profile
- Toggle featured status
- Manage all connections in one place
- Bulk operations

## 9. Data Flow

```
EMPATHY LEDGER
      ↓ (sync)
┌──────────────────┐
│ public_profiles  │
└────────┬─────────┘
         │
         ├─→ organizations_profiles → organizations
         ├─→ community_programs_profiles → community_programs
         ├─→ services_profiles → services
         ├─→ art_innovation_profiles → art_innovation
         └─→ blog_posts_profiles → blog_posts
```

## Next Actions

1. ✅ Create migration SQL
2. Run migration in Supabase
3. Build ProfileCard component
4. Build individual profile pages
5. Extend admin interface
6. Add cross-linking displays
7. Test with real data

---

**Goal**: Every person connects to everything they're involved with, and every entity shows the people behind it. This creates a rich, interconnected knowledge graph of the youth justice ecosystem.
