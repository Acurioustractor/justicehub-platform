# Existing Supabase Schema Audit

## Summary: Profile & Content Systems

After auditing the existing Supabase schema, I found we have **THREE different profile/people systems**:

1. **`users` table** - Platform users (youth, mentors, admins) with authentication
2. **`authors` table** - Content creators for articles/stories
3. **`profile_appearances` table** - Links Empathy Ledger profiles to content

We need to **unify and extend** these systems, not replace them!

---

## Current Profile Systems

### 1. Users Table (Platform Users)
**Location**: `supabase/migrations/20250120000001_initial_schema.sql` (lines 40-53)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('youth', 'mentor', 'org_admin', 'platform_admin')),
  is_active BOOLEAN DEFAULT true,
  profile_completed BOOLEAN DEFAULT false
);
```

**Extended by**:
- `youth_profiles` - Youth-specific data (DOB, interests, skills, goals)
- `mentor_profiles` - Mentor-specific data (expertise, availability, ratings)

**Purpose**: Authenticated platform users who can log in and use the system

---

### 2. Authors Table (Content Creators)
**Location**: `supabase/migrations/create-content-tables-clean.sql` (lines 17-30)

```sql
CREATE TABLE authors (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  role TEXT,
  email TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT
);
```

**Purpose**: People who write articles/stories - NOT necessarily platform users

**Current Data**: Benjamin Knight (already in database!)

---

### 3. Profile Appearances (Empathy Ledger Integration)
**Location**: `supabase/migrations/create-profile-appearances.sql` (lines 5-26)

```sql
CREATE TABLE profile_appearances (
  id UUID PRIMARY KEY,
  empathy_ledger_profile_id UUID NOT NULL,
  appears_on_type TEXT CHECK (appears_on_type IN ('program', 'service', 'article')),
  appears_on_id UUID NOT NULL,
  role TEXT, -- 'participant', 'facilitator', 'family member'
  story_excerpt TEXT,
  featured BOOLEAN DEFAULT FALSE
);
```

**Purpose**: Links external Empathy Ledger profiles to JusticeHub content

---

## Current Content Tables

### Articles/Stories System

**Two separate systems exist**:

1. **`stories` table** - Platform stories from youth/users
   - Lines 113-139 in initial_schema.sql
   - Linked to `users` table
   - For personal journey stories

2. **`articles` table** - Published content/blog posts
   - Lines 37-57 in create-content-tables-clean.sql
   - Linked to `authors` table
   - For editorial content

### Community Programs
**Location**: `create-community-programs-table.sql`

```sql
CREATE TABLE community_programs (
  id UUID,
  name TEXT,
  organization TEXT,
  location TEXT,
  state TEXT,
  approach TEXT,
  description TEXT,
  impact_summary TEXT,
  tags TEXT[],
  is_featured BOOLEAN
);
```

### Services
**Location**: Initial schema (lines 201-232)

```sql
CREATE TABLE services (
  id UUID,
  name TEXT,
  organization_id UUID REFERENCES organizations(id),
  description TEXT,
  program_type TEXT,
  service_category TEXT[],
  location_address TEXT,
  is_featured BOOLEAN
);
```

### Art & Innovation (New!)
**Location**: `20250122000002_create_art_innovation_table.sql`

```sql
CREATE TABLE art_innovation (
  id UUID,
  title TEXT,
  slug TEXT,
  type TEXT,
  description TEXT,
  creators JSONB, -- Embedded creator data!
  tags TEXT[],
  is_featured BOOLEAN
);
```

---

## The Problem: Fragmented Profile Data

### Currently:
- **CONTAINED creators** stored as JSONB in `art_innovation.creators`
- **Benjamin Knight** exists in `authors` table
- **Nicholas Marchesi** doesn't exist anywhere yet!
- No way to link the same person across different content types

### Example:
```json
// CONTAINED creators (embedded JSON)
{
  "creators": [
    {
      "name": "Benjamin Knight",
      "role": "Co-founder",
      "bio": "...",
      "photo_url": "..."
    }
  ]
}

// Meanwhile, in authors table:
{
  "id": "uuid-123",
  "name": "Benjamin Knight",
  "bio": "Founder and lead contributor...",
  "photo_url": null  // Different data!
}
```

---

## Proposed Unified System

### 1. Create `public_profiles` Table
**Purpose**: Central registry for ALL public-facing people (not auth users)

```sql
CREATE TABLE public_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  full_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  preferred_name TEXT,

  -- Profile
  bio TEXT,
  tagline TEXT,
  role_tags TEXT[], -- ["artist", "advocate", "researcher"]

  -- Media
  photo_url TEXT,
  photo_credit TEXT,

  -- Links
  website_url TEXT,
  social_links JSONB DEFAULT '{}',

  -- Optional connections to other systems
  user_id UUID REFERENCES users(id), -- If they're also a platform user
  empathy_ledger_profile_id UUID, -- If from Empathy Ledger

  -- Metadata
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Migrate Existing Authors
```sql
-- Benjamin Knight is already in authors table
-- Create public_profile for him, linking to author record
INSERT INTO public_profiles (full_name, slug, bio, photo_url)
SELECT name, slug, bio, photo_url
FROM authors
WHERE slug = 'benjamin-knight';

-- Update authors table to reference public_profiles
ALTER TABLE authors ADD COLUMN public_profile_id UUID REFERENCES public_profiles(id);

UPDATE authors
SET public_profile_id = (SELECT id FROM public_profiles WHERE slug = authors.slug);
```

### 3. Create Relationship Tables

#### Link Profiles to Art/Innovation Projects
```sql
CREATE TABLE art_innovation_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  art_innovation_id UUID REFERENCES art_innovation(id) ON DELETE CASCADE,
  public_profile_id UUID REFERENCES public_profiles(id) ON DELETE CASCADE,
  role TEXT, -- "creator", "contributor"
  role_description TEXT, -- "Co-founder - The Insomniac Calculator"
  display_order INTEGER DEFAULT 0,
  UNIQUE(art_innovation_id, public_profile_id)
);
```

#### Link Profiles to Community Programs
```sql
CREATE TABLE community_programs_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES community_programs(id) ON DELETE CASCADE,
  public_profile_id UUID REFERENCES public_profiles(id) ON DELETE CASCADE,
  role TEXT, -- "founder", "coordinator", "participant-voice"
  role_description TEXT,
  display_order INTEGER DEFAULT 0,
  UNIQUE(program_id, public_profile_id)
);
```

#### Link Profiles to Services
```sql
CREATE TABLE services_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  public_profile_id UUID REFERENCES public_profiles(id) ON DELETE CASCADE,
  role TEXT, -- "staff", "board-member", "testimonial"
  role_description TEXT,
  display_order INTEGER DEFAULT 0,
  UNIQUE(service_id, public_profile_id)
);
```

#### Link Stories/Articles to Related Content
```sql
-- Articles can be ABOUT art projects
CREATE TABLE article_related_art (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  art_innovation_id UUID REFERENCES art_innovation(id) ON DELETE CASCADE,
  relevance_note TEXT,
  PRIMARY KEY (article_id, art_innovation_id)
);

-- Articles can be ABOUT programs
CREATE TABLE article_related_programs (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES community_programs(id) ON DELETE CASCADE,
  relevance_note TEXT,
  PRIMARY KEY (article_id, program_id)
);

-- Articles can be ABOUT services
CREATE TABLE article_related_services (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  relevance_note TEXT,
  PRIMARY KEY (article_id, service_id)
);

-- Related reading (article to article)
CREATE TABLE article_related_articles (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  related_article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  relationship_type TEXT, -- "series", "related-topic", "follow-up"
  PRIMARY KEY (article_id, related_article_id),
  CHECK (article_id != related_article_id)
);
```

---

## Migration Strategy: Build On, Don't Replace

### Phase 1: Create New Infrastructure ✅
1. ✅ Create `public_profiles` table
2. ✅ Create all `*_profiles` relationship tables
3. ✅ Create all `article_related_*` tables

### Phase 2: Migrate Existing Data
1. Migrate `authors` → `public_profiles`
   - Create profiles for Benjamin Knight
   - Link author records to profiles

2. Extract CONTAINED creators from JSON
   - Create public_profiles for Benjamin & Nicholas
   - Create art_innovation_profiles links
   - Remove embedded JSON, use relationships

3. Link Empathy Ledger profiles
   - Add `public_profile_id` to `profile_appearances`
   - Merge duplicates where possible

### Phase 3: Update Code
1. Update queries to use relationships
2. Create profile pages (`/people/[slug]`)
3. Add "Related Content" sections
4. Create admin tools for linking

---

## Image Storage Strategy

### Current State
- Images scattered across different URLs
- Some in Supabase Storage, some external
- No consistent naming/organization

### Proposed Structure
```
storage/
├── profiles/
│   ├── benjamin-knight.jpg
│   ├── nicholas-marchesi.jpg
│   └── [slug].jpg
│
├── art-innovation/
│   ├── contained/
│   │   ├── featured.jpg
│   │   ├── gallery/
│   │   │   ├── 1.jpg
│   │   │   └── 2.jpg
│   └── [project-slug]/
│
├── programs/
│   └── [program-slug]/
│
└── articles/
    └── [article-slug]/
```

### Migration Plan
1. Create storage buckets with proper structure
2. Download existing images
3. Re-upload to structured locations
4. Update database URLs
5. Delete old unorganized files

---

## Key Decisions

### ✅ Keep Separate: `users` vs `public_profiles`
- `users` = Authenticated platform users (login required)
- `public_profiles` = Public-facing people (no login needed)
- They can be linked if someone is both

### ✅ Migrate: `authors` → Reference `public_profiles`
- Don't delete `authors` table (content references it)
- Add `public_profile_id` foreign key
- `authors` becomes a "role" within public_profiles system

### ✅ Extend: `profile_appearances`
- Add `public_profile_id` column
- Keep `empathy_ledger_profile_id` for external tracking
- Bridge to unified system

### ✅ Replace: JSONB creators in `art_innovation`
- Remove embedded `creators` JSONB field
- Use `art_innovation_profiles` relationship table
- Enables reuse and cross-linking

---

## Example: CONTAINED After Migration

### Database State
```sql
-- 1. Public Profiles
public_profiles:
  - Benjamin Knight (id: uuid-ben, slug: "benjamin-knight")
  - Nicholas Marchesi (id: uuid-nick, slug: "nicholas-marchesi")

-- 2. Link to CONTAINED
art_innovation_profiles:
  - (art_id: contained-uuid, profile_id: uuid-ben, role: "co-founder", order: 1)
  - (art_id: contained-uuid, profile_id: uuid-nick, role: "co-founder", order: 2)

-- 3. Link to Articles
article_related_art:
  - (article_id: contained-story-uuid, art_id: contained-uuid)

-- 4. Benjamin also writes articles
authors:
  - (id: author-uuid, public_profile_id: uuid-ben, slug: "benjamin-knight")
```

### Result: One Person, Many Connections
Benjamin Knight's profile page (`/people/benjamin-knight`) shows:
- **Role as**: Article Author, Art Project Co-founder
- **Featured In**: CONTAINED campaign
- **Written**: 5 articles
- **Connected Programs**: Justice Reinvestment programs (via articles)
- **Connected Services**: Youth justice services (via programs)

---

## Next Steps

1. **Create Migration File** - All new tables in one migration
2. **Create Profile Records** - Benjamin & Nicholas first
3. **Link CONTAINED** - Use relationships instead of JSONB
4. **Build UI** - Profile pages and related content sections
5. **Create Admin Tools** - For managing links and relationships

This approach:
✅ Builds on existing systems
✅ Doesn't break current functionality
✅ Enables full interconnection
✅ Scalable for future content
✅ Respects auth separation (users vs public profiles)
