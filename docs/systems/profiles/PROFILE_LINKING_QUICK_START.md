# Profile Linking System - Quick Start

## What We're Building

A comprehensive system where:
- **People** link to organizations, programs, services, and stories
- **Everything** links back to show the people involved
- **Bidirectional navigation** - click on Kristy → see Oonchiumpa, click on Oonchiumpa → see Kristy

## Step 1: Run Database Migration (2 minutes)

Go to [JusticeHub Supabase Dashboard](https://supabase.com/dashboard/project/tednluwflfhxyucgwigh) → SQL Editor:

```sql
-- Copy/paste from supabase/migrations/20250126000005_add_organizations_profiles.sql
-- This creates:
-- - organizations_profiles (people ↔ organizations)
-- - blog_posts_profiles (people ↔ stories)
```

## Step 2: Test the Junction Tables

```bash
npx tsx src/scripts/test-profile-linking.ts
```

## Step 3: Auto-Link Oonchiumpa Founders

```bash
npx tsx src/scripts/link-oonchiumpa-founders.ts
```

This will:
- Link Kristy, Tanya, Patricia to Oonchiumpa organization
- Set their roles as "Founder"
- Mark them as featured

## Step 4: View the Results

- Visit http://localhost:4000/people/kristy-bloomfield
- Should see "Organizations" section with Oonchiumpa
- Visit http://localhost:4000/organizations/oonchiumpa
- Should see "Our Team" section with the founders

## What Gets Linked

### People Can Link To:
- **Organizations** (via `organizations_profiles`)
  - Role: Founder, Director, Staff, Volunteer, Board Member
  - Time period: Start/end dates
  - Featured: Yes/no

- **Programs** (via `community_programs_profiles`)
  - Role: Lead, Coordinator, Mentor, Participant
  - Featured: Yes/no

- **Services** (via `services_profiles`)
  - Role: Provider, Coordinator, Volunteer
  - Featured: Yes/no

- **Stories** (via `blog_posts_profiles`)
  - Role: Subject, Author, Contributor, Mentioned
  - Featured: Yes/no

### Example Query

```typescript
// Get Kristy's profile with all connections
const { data } = await supabase
  .from('public_profiles')
  .select(`
    *,
    organizations_profiles (
      role,
      is_current,
      organization:organizations (*)
    ),
    community_programs_profiles (
      role,
      community_program:community_programs (*)
    ),
    blog_posts_profiles (
      role,
      blog_post:blog_posts (*)
    )
  `)
  .eq('slug', 'kristy-bloomfield')
  .single();
```

## Admin Interface

Once built, you'll be able to:
1. Go to `/admin/profiles`
2. Click "Edit" on any profile
3. See all current connections
4. Add new connections via search
5. Remove connections
6. Toggle public/private visibility
7. Toggle featured status

## Visual Example

```
Kristy Bloomfield's Profile
├─ Organizations
│  └─ Oonchiumpa (Founder & Chair, 2018-Present) ⭐
│
├─ Programs
│  ├─ Container Project (Project Lead)
│  └─ Youth Leadership (Mentor)
│
├─ Stories
│  ├─ "Building Revolution in Shipping Containers" (Subject)
│  └─ "Indigenous Leadership in Action" (Subject)
│
└─ Services
   └─ Oonchiumpa Community Support (Coordinator)
```

And vice versa:

```
Oonchiumpa Organization Page
└─ Our Team
   ├─ Kristy Bloomfield (Founder & Chair) ⭐
   ├─ Tanya Turner (Founder) ⭐
   └─ Patricia Ann Miller (Founder) ⭐
```

## Next Steps

1. Run the migration ✅
2. Auto-link Oonchiumpa founders
3. Build profile page UI to display connections
4. Build admin interface for managing links
5. Add cross-references on org/program/story pages

---

**Result**: A rich, interconnected knowledge graph where everything links to everything, making it easy to discover the people behind the work and the work people are involved in.
