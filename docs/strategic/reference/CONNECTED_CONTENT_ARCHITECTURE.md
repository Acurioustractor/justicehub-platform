# Connected Content Architecture

## Vision
A fully interconnected content system where profiles, stories, programs, services, and art/innovation projects are seamlessly linked, allowing users to explore the youth justice ecosystem from any entry point.

## Core Principles

1. **Single Source of Truth for People** - One profile record per person, linked across all content types
2. **Bidirectional Relationships** - All links work both ways (e.g., stories link to profiles AND profiles show their stories)
3. **Scalable Asset Management** - Images, videos, and documents stored efficiently and reused across entities
4. **Contextual Recommendations** - "Related content" shown based on shared profiles, tags, organizations, locations

---

## 1. Unified Profile System

### Current State
- Stories have embedded profile data (`profile_appearances` table)
- Art projects have embedded creator data (JSON array in `art_innovation.creators`)
- No central profile registry

### Proposed Architecture

#### New `profiles` Table (Central Registry)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  full_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- e.g., "benjamin-knight"
  preferred_name TEXT,
  pronouns TEXT,

  -- Profile Details
  bio TEXT,
  tagline TEXT, -- One-line description
  role_tags TEXT[], -- ["advocate", "artist", "researcher", "lived-experience"]

  -- Media
  photo_url TEXT,
  photo_credit TEXT,

  -- Contact (optional, privacy-aware)
  website_url TEXT,
  social_links JSONB DEFAULT '{}',
  email TEXT, -- Only shown if they opt-in

  -- Metadata
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true, -- Can be set to false for privacy
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Fast lookups
CREATE INDEX idx_profiles_slug ON profiles(slug);
CREATE INDEX idx_profiles_featured ON profiles(is_featured) WHERE is_featured = true;
CREATE INDEX idx_profiles_public ON profiles(is_public) WHERE is_public = true;
```

#### Profile Relationships (Link Tables)

```sql
-- Link profiles to art/innovation projects
CREATE TABLE art_innovation_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  art_innovation_id UUID REFERENCES art_innovation(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT, -- "creator", "contributor", "collaborator"
  role_description TEXT, -- Custom description like "Co-founder - The Insomniac Calculator"
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  UNIQUE(art_innovation_id, profile_id)
);

-- Link profiles to programs
CREATE TABLE community_programs_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES community_programs(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT, -- "founder", "coordinator", "participant-voice"
  role_description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  UNIQUE(program_id, profile_id)
);

-- Link profiles to services
CREATE TABLE services_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT, -- "staff", "board-member", "testimonial"
  role_description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  UNIQUE(service_id, profile_id)
);

-- Stories already have profile_appearances - keep that, but add profile_id reference
ALTER TABLE profile_appearances ADD COLUMN profile_id UUID REFERENCES profiles(id);
CREATE INDEX idx_profile_appearances_profile_id ON profile_appearances(profile_id);
```

---

## 2. Image & Asset Management

### Current State
- Images hardcoded as URLs in data
- No consistent upload/storage strategy
- Images scattered across different storage locations

### Proposed System

#### Asset Storage Structure (Supabase Storage)

```
storage/
├── profiles/
│   ├── benjamin-knight.jpg
│   ├── nicholas-marchesi.jpg
│   └── tanya-smith.jpg
│
├── art-innovation/
│   ├── contained/
│   │   ├── featured.jpg
│   │   ├── gallery-1.jpg
│   │   └── gallery-2.jpg
│   └── another-project/
│       └── ...
│
├── programs/
│   └── oonchiumpa/
│       └── ...
│
└── stories/
    └── article-slug/
        └── ...
```

#### Image Upload API Routes

```typescript
// src/app/api/upload/[type]/route.ts
// Handles uploads for: profiles, art-innovation, programs, stories

export async function POST(
  request: Request,
  { params }: { params: { type: string } }
) {
  // 1. Validate file type, size
  // 2. Generate optimized versions (thumbnail, medium, large)
  // 3. Upload to Supabase Storage
  // 4. Return URLs for database storage
}
```

#### Image Component (Automatic Optimization)

```typescript
// src/components/OptimizedImage.tsx
export function OptimizedImage({
  src,
  alt,
  variant = 'medium' // thumbnail | medium | large | original
}) {
  // Automatically serves right size based on variant
  // Handles lazy loading, blur placeholders
}
```

---

## 3. Story Linking System

### Database Structure for Story Links

```sql
-- Stories already exist in content_stories table
-- Add relationship tables for linkages

CREATE TABLE story_related_art (
  story_id UUID REFERENCES content_stories(id) ON DELETE CASCADE,
  art_innovation_id UUID REFERENCES art_innovation(id) ON DELETE CASCADE,
  relevance_note TEXT, -- Why they're linked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  PRIMARY KEY (story_id, art_innovation_id)
);

CREATE TABLE story_related_programs (
  story_id UUID REFERENCES content_stories(id) ON DELETE CASCADE,
  program_id UUID REFERENCES community_programs(id) ON DELETE CASCADE,
  relevance_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  PRIMARY KEY (story_id, program_id)
);

CREATE TABLE story_related_services (
  story_id UUID REFERENCES content_stories(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  relevance_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  PRIMARY KEY (story_id, service_id)
);

-- For story-to-story relationships (related reading)
CREATE TABLE story_related_stories (
  story_id UUID REFERENCES content_stories(id) ON DELETE CASCADE,
  related_story_id UUID REFERENCES content_stories(id) ON DELETE CASCADE,
  relationship_type TEXT, -- "series", "related-topic", "follow-up"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  PRIMARY KEY (story_id, related_story_id),
  CHECK (story_id != related_story_id)
);
```

### Auto-Linking Algorithm

```typescript
// src/lib/content-linking.ts

export async function suggestRelatedContent(storyId: string) {
  // 1. Extract profiles mentioned in story
  // 2. Find all content linked to those profiles
  // 3. Extract tags/topics from story
  // 4. Find content with matching tags
  // 5. Return scored recommendations

  return {
    profiles: [...],
    stories: [...],
    programs: [...],
    services: [...],
    artProjects: [...]
  };
}
```

---

## 4. Related Content Display

### Component Structure

```typescript
// src/components/RelatedContent.tsx

export function RelatedContent({
  entityId,
  entityType // 'story' | 'art-project' | 'program' | 'service'
}) {
  // Fetch all related content for this entity
  // Display in organized sections:
  // - People (profiles)
  // - Stories
  // - Programs
  // - Services
  // - Art & Innovation
}
```

### Page Integration Example

```typescript
// src/app/art-innovation/[slug]/page.tsx

export default function ArtProjectPage({ params }) {
  return (
    <div>
      {/* Main content */}
      <ArtProjectDetails />

      {/* Creators (linked profiles) */}
      <section>
        <h2>Creators</h2>
        <ProfileGrid profileIds={project.creator_profile_ids} />
      </section>

      {/* Related content */}
      <RelatedContent
        entityId={project.id}
        entityType="art-project"
      />
    </div>
  );
}
```

---

## 5. Migration Strategy

### Phase 1: Create Infrastructure ✅
1. Create `profiles` table
2. Create all relationship tables
3. Set up image storage buckets
4. Create upload API routes

### Phase 2: Migrate Existing Data
1. Extract unique profiles from:
   - `profile_appearances` (stories)
   - `art_innovation.creators` (CONTAINED founders)
   - Any hardcoded profile data
2. Create profile records with photos
3. Link profiles to existing content

### Phase 3: Update UI
1. Create profile page (`/people/[slug]`)
2. Update art/innovation detail page to show linked profiles
3. Add "Related Content" sections to all entity pages
4. Create profile cards/grid components

### Phase 4: Admin Tools
1. Profile management interface
2. Bulk image upload tool
3. Relationship linking UI
4. Auto-suggestion tools for linking

---

## 6. Example: CONTAINED Complete System

### Profile Records

```sql
-- Benjamin Knight
INSERT INTO profiles (full_name, slug, bio, role_tags, photo_url, tagline, is_featured)
VALUES (
  'Benjamin Knight',
  'benjamin-knight',
  'Following paper trails that lead to kids in cages, transforming data into moral urgency. The one who stood in Madrid''s sunset-colored rooms and felt the weight of Australia''s failure in his bones.',
  ARRAY['advocate', 'researcher', 'co-founder'],
  '/storage/profiles/benjamin-knight.jpg',
  'Co-founder, A Curious Tractor - The Insomniac Calculator',
  true
);

-- Nicholas Marchesi
INSERT INTO profiles (full_name, slug, bio, role_tags, photo_url, tagline, is_featured)
VALUES (
  'Nicholas Marchesi',
  'nicholas-marchesi',
  'Strategic architect who transformed shipping containers into transformation chambers - personally constructing the majority of the rooms, wiring the electronics that make fluorescent despair tangible.',
  ARRAY['artist', 'builder', 'co-founder'],
  '/storage/profiles/nicholas-marchesi.jpg',
  'Co-founder, A Curious Tractor - The Hands That Built Revolution',
  true
);
```

### Link to CONTAINED

```sql
INSERT INTO art_innovation_profiles (art_innovation_id, profile_id, role, display_order)
SELECT
  ai.id,
  p.id,
  'co-founder',
  1
FROM art_innovation ai, profiles p
WHERE ai.slug = 'contained' AND p.slug = 'benjamin-knight';

INSERT INTO art_innovation_profiles (art_innovation_id, profile_id, role, display_order)
SELECT
  ai.id,
  p.id,
  'co-founder',
  2
FROM art_innovation ai, profiles p
WHERE ai.slug = 'contained' AND p.slug = 'nicholas-marchesi';
```

### Link Stories About CONTAINED

```sql
-- When we write a story about CONTAINED:
INSERT INTO story_related_art (story_id, art_innovation_id, relevance_note)
VALUES (
  'story-uuid',
  'contained-uuid',
  'Deep dive into the CONTAINED campaign''s impact on youth justice reform'
);
```

### Result on `/art-innovation/contained`

```
+----------------------------------+
| CONTAINED - A Curious Tractor     |
+----------------------------------+

[Campaign details...]

CREATORS
+------------------+  +------------------+
| Benjamin Knight  |  | Nicholas Marchesi|
| [Photo]          |  | [Photo]          |
| Co-founder       |  | Co-founder       |
| → View Profile   |  | → View Profile   |
+------------------+  +------------------+

RELATED STORIES
- "Inside CONTAINED: Building Transformation Chambers"
- "Data to Action: The Calculator's Journey"

CONNECTED PROGRAMS
- Oonchiumpa Youth Justice Program (shared profiles)

SERVICES & SUPPORT
- Services tagged with "justice reinvestment"
```

---

## Implementation Priority

1. **Create profiles table + relationship tables** (30 min)
2. **Create Benjamin & Nicholas profiles** (15 min)
3. **Link profiles to CONTAINED** (10 min)
4. **Update CONTAINED detail page to show linked profiles** (1 hour)
5. **Create basic RelatedContent component** (1 hour)
6. **Set up image storage structure** (30 min)
7. **Create image upload utility** (1 hour)

---

## Next Steps

Would you like me to:
1. **Start with database migrations** - Create profiles table and relationships?
2. **Create profile pages** - Build `/people/[slug]` to show individual profiles?
3. **Build the linking system** - Set up CONTAINED with proper profile links?
4. **Set up image infrastructure** - Create upload tools and storage?

This system will scale to handle all future content while maintaining connections!
