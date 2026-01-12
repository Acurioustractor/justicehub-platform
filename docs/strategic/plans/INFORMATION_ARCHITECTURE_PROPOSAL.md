# JusticeHub Information Architecture - Comprehensive Proposal

## Executive Summary

This document proposes a unified information architecture that clarifies the relationships between Organizations, Services, Community Programs, People (Profiles), and Stories across JusticeHub's two Supabase databases (JusticeHub DB and Empathy Ledger DB).

**Core Principle**: Organizations → Services → Programs → People & Stories

**Key User Needs**:
1. **Service Seekers**: Find verified services by location, category, and need
2. **Story Readers**: Discover authentic stories linked to programs and people
3. **Researchers**: Explore outcomes, impact, and program effectiveness
4. **Administrators**: Add and verify organizations, services, programs, and linkages

---

## Current State Analysis

### Database 1: JusticeHub DB (Primary)
**Tables**:
- `organizations` - Service providers, NGOs, government agencies
- `services` - Individual service offerings (verification status, locations, contact info)
- `community_programs` - Curated programs with outcomes and impact metrics
- `profile_appearances` - Links Empathy Ledger profiles to JusticeHub content
- `service_locations` - Multiple locations for services
- `service_contacts` - Multiple contact points for services

### Database 2: Empathy Ledger DB (External Multi-tenant)
**Tables**:
- `organizations` - Cultural organizations with Indigenous protocols
- `profiles` - People who tell stories or appear in programs
- `stories` - First-person narratives with cultural sensitivity
- `projects` - Initiatives and programs run by organizations

### Current Issues
1. **Confusion between Services and Programs**: Are they the same? Different?
2. **Organization Duplication**: Organizations exist in both databases
3. **Profile Linkages**: Limited system for connecting people to multiple contexts
4. **Verification Levels**: No clear distinction between verified vs. scraped services
5. **Search Fragmentation**: People, programs, services, stories all separate

---

## Proposed Information Architecture

### Entity Definitions

#### 1. ORGANIZATIONS
**What**: Any entity that provides services or runs programs
**Examples**: BackTrack, Oonchiumpa, Congress, government agencies, NGOs

**Where**:
- **Primary Source**: JusticeHub DB `organizations` table
- **Secondary Source**: Empathy Ledger DB `organizations` (for Indigenous orgs with storytelling)
- **Sync Strategy**: Empathy Ledger organizations are REFERENCED in JusticeHub, not duplicated

**Key Attributes**:
```typescript
{
  id: UUID
  name: string
  slug: string
  type: 'ngo' | 'government' | 'community-org' | 'indigenous-org' | 'private'
  verification_status: 'verified' | 'pending' | 'unverified'
  is_indigenous_controlled: boolean

  // Location
  locations: ServiceLocation[]
  service_area: string[]  // LGAs, regions covered

  // Contact
  contact_phone: string
  contact_email: string
  website: string

  // Integration
  empathy_ledger_org_id?: UUID  // If exists in Empathy Ledger

  // Admin
  verified_at?: timestamp
  verified_by?: string
  data_source: 'manual' | 'scrape' | 'import' | 'empathy-ledger'
}
```

**User Access**:
- `/organizations` - Browse all organizations (simple list/grid)
- `/organizations/[slug]` - Org profile with services, programs, stories

---

#### 2. SERVICES
**What**: Individual service offerings by organizations (may or may not have detailed outcomes)
**Examples**:
- Youth counseling service
- After-school program
- Legal aid clinic
- Employment support service

**Where**: JusticeHub DB `services` table

**Key Distinction**:
- **VERIFIED SERVICES**: Detailed, interviewed, manually curated - show at top of searches
- **SCRAPED SERVICES**: Basic info from AskIzzy, data.gov.au, etc - show below verified
- **VERIFIED = Recommended = Rich Content** (stories, outcomes, linkages)

**Key Attributes**:
```typescript
{
  id: UUID
  organization_id: UUID  // FK to organizations
  name: string
  slug: string
  description: string

  // Classification
  service_category: string[]  // 'mental-health', 'education', 'housing'
  target_demographics: {
    age_min?: number
    age_max?: number
    gender?: string[]
    indigenous_specific: boolean
  }

  // Verification Status - CRITICAL
  verification_status: 'verified' | 'pending' | 'unverified' | 'scraped'
  verification_level: 'recommended' | 'listed'  // Recommended = verified + rich content

  // Location & Contact
  locations: ServiceLocation[]  // Can have multiple locations
  contact_info: ServiceContact[]

  // Capacity
  is_accepting_referrals: boolean
  capacity_status: 'available' | 'limited' | 'waitlist' | 'full'
  waitlist_time_weeks?: number

  // Integration
  empathy_ledger_service_id?: UUID  // If linked to EL

  // Data Quality
  data_source: string
  last_verified_at?: timestamp
  scrape_confidence_score?: number
}
```

**User Access**:
- `/services` - Service Finder (map + filters)
  - **Top Section**: "Recommended Services" (verified, rich content)
  - **Bottom Section**: "All Available Services" (includes scraped)
- `/services/[id]` - Service detail page
  - Verified services show: stories, programs, outcomes, linkages
  - Scraped services show: basic contact info, "claim this service" button

---

#### 3. COMMUNITY PROGRAMS
**What**: Specific programs with measurable outcomes, run by organizations/services
**Examples**:
- Oonchiumpa Alternative Service Response
- BackTrack Welding Program
- True Justice: Deep Listening on Country

**Where**: JusticeHub DB `community_programs` table

**Key Distinction**: Programs are WHERE outcomes happen, WHERE stories come from, WHERE impact is measured

**Relationship to Services**:
- A service CAN have programs (1:many)
- A program BELONGS TO an organization
- Programs are the "evidence-based interventions" within broader services

**Key Attributes**:
```typescript
{
  id: UUID
  organization_id: UUID  // FK to organizations
  service_id?: UUID  // Optional FK - program might be standalone

  name: string
  slug: string
  description: string
  impact_summary: string

  // Outcomes & Metrics - KEY DIFFERENCE FROM SERVICES
  success_rate: number
  participants_served: number
  outcomes: {
    metric: string  // '72% education re-engagement'
    value: number
    description: string
  }[]

  // Evidence Base
  evaluation_methodology?: string
  evidence_strength: 'strong' | 'moderate' | 'emerging' | 'anecdotal'

  // Program Details
  approach: 'Indigenous-led' | 'Community-based' | 'Grassroots'
  frameworks: string[]  // 'Cultural Brokerage', 'Trauma-Informed'
  delivery_model: string

  // Display
  is_featured: boolean
  tags: string[]

  // Integration
  empathy_ledger_project_id?: UUID  // If linked to EL project
}
```

**User Access**:
- `/community-programs` - Browse proven programs
- `/community-programs/[slug]` - Program detail with:
  - Outcomes and impact metrics
  - Linked stories from participants
  - Linked profiles (staff, participants, family)
  - Links to parent organization/service

---

#### 4. PEOPLE (PROFILES)
**What**: Individuals who appear in stories, lead programs, participate, or provide testimonials
**Examples**:
- Kristy Bloomfield (program manager)
- Tanya Turner (co-founder)
- Program participants
- Family members
- Community elders

**Where**: Empathy Ledger DB `profiles` table (primary)

**Linkage**: JusticeHub DB `profile_appearances` table

**Key Attributes**:
```typescript
// In Empathy Ledger DB
Profile {
  id: UUID
  display_name: string
  bio?: string
  avatar_url?: string
  user_id?: UUID  // If they have login
  tenant_id: UUID  // Organization they belong to

  // Cultural Protocols
  cultural_permissions?: {
    allow_photo: boolean
    allow_name: boolean
    allow_story_sharing: boolean
  }
}

// In JusticeHub DB (linkage table)
ProfileAppearance {
  id: UUID
  empathy_ledger_profile_id: UUID  // FK to EL profile

  // What they appear on
  appears_on_type: 'program' | 'service' | 'organization' | 'article' | 'centre-of-excellence'
  appears_on_id: UUID

  // Context
  role: string  // 'Program Manager', 'Participant', 'Graduate', 'Family Member', 'Founder'
  relationship_description: string
  story_excerpt?: string  // Preview of their story
  quote?: string  // Featured quote

  // Display
  featured: boolean  // Feature this person prominently
  display_order?: number

  // Storyteller flag
  is_storyteller: boolean  // True if this is a first-person story from profiles table
  story_id?: UUID  // Link to their story in EL
}
```

**User Access**:
- `/people` - Browse profiles (with privacy controls)
- `/people/[id]` - Person's profile showing:
  - All programs they're linked to
  - All stories they've told (if storyteller)
  - Role descriptions in each context
  - Organizations they're affiliated with

---

#### 5. STORIES
**What**: First-person narratives, testimonials, case studies, articles
**Examples**:
- Participant journey stories
- Program impact stories
- Cultural stories
- News articles about programs

**Where**:
- **Primary**: Empathy Ledger DB `stories` table (first-person, culturally sensitive)
- **Secondary**: JusticeHub DB `articles` table (news, blog posts, documentation)

**Key Attributes**:
```typescript
// Empathy Ledger Story
{
  id: UUID
  storyteller_id?: UUID  // Profile who tells the story
  organization_id?: UUID
  project_id?: UUID  // Link to EL project

  title: string
  content: string
  story_image_url?: string

  // Cultural Protocols
  privacy_level: 'public' | 'community' | 'private'
  cultural_sensitivity_level: string
  cultural_warnings?: string[]
  elder_approved: boolean

  // JusticeHub Integration
  service_id?: UUID  // Link to JusticeHub service
  justicehub_program_ids?: UUID[]  // Links to JH programs
}
```

**User Access**:
- `/stories` - Browse all stories (filtered by privacy)
- `/stories/[slug]` - Story detail showing:
  - Storyteller profile (if public)
  - Linked programs
  - Linked organizations
  - Cultural protocols/warnings

---

#### 6. CENTRE OF EXCELLENCE
**What**: Research hub, best practices, frameworks, evaluations
**Examples**:
- Evaluation methodologies
- Framework descriptions (Cultural Brokerage, Trauma-Informed Care)
- Research summaries
- Policy briefs

**Where**: JusticeHub DB `centre_of_excellence_resources` table (NEW)

**Key Attributes**:
```typescript
{
  id: UUID
  title: string
  slug: string
  content: markdown
  resource_type: 'framework' | 'evaluation' | 'research' | 'policy' | 'case-study'

  // Linkages
  linked_programs: UUID[]  // Programs that use this framework
  linked_organizations: UUID[]  // Orgs that implement this
  linked_stories: UUID[]  // Stories that demonstrate this

  // Academic
  evidence_level: string
  citations?: string[]
  published_date?: timestamp
}
```

**User Access**:
- `/centre-of-excellence` - Browse resources
- `/centre-of-excellence/[slug]` - Resource detail with:
  - Explanation of framework/methodology
  - Programs that use it (with links)
  - Stories that demonstrate it
  - Research evidence

---

## Relationship Mapping

### Primary Relationships

```
Organization (1) ──────> (Many) Services
Organization (1) ──────> (Many) Programs
Service (1) ────────────> (Many) Programs (optional)

Program (1) ─────────────> (Many) ProfileAppearances
Service (1) ─────────────> (Many) ProfileAppearances
Organization (1) ────────> (Many) ProfileAppearances

ProfileAppearance (Many) ────> (1) Profile [Empathy Ledger]

Program (Many) ───────────> (Many) Stories [via junction]
Service (Many) ───────────> (Many) Stories [via service_id in EL]
Profile (1) ──────────────> (Many) Stories [as storyteller]

Program (Many) ───────────> (Many) COE Resources [via junction]
Framework (1) ────────────> (Many) Programs [that use it]
```

### Search & Discovery Paths

**By Location** → Find Organizations → See their Services → Drill into Programs → Read Stories
**By Person** → Find Profile → See their Appearances → View Programs/Services they're linked to
**By Program** → Find Program → See Organization → See Stories → See People
**By Story** → Read Story → See Program → See Organization → See Service
**By Framework** → View COE Resource → See Programs using it → See Stories demonstrating it

---

## Database Schema Recommendations

### JusticeHub DB - Schema Changes

#### 1. Add `organization_id` to `community_programs`
```sql
ALTER TABLE community_programs
ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- Populate from existing 'organization' text field (migration script needed)
```

#### 2. Add `service_id` to `community_programs` (optional link)
```sql
ALTER TABLE community_programs
ADD COLUMN service_id UUID REFERENCES services(id);
```

#### 3. Enhance `organizations` table
```sql
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS empathy_ledger_org_id UUID,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS is_indigenous_controlled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by TEXT;
```

#### 4. Enhance `services` table - Verification Levels
```sql
ALTER TABLE services
ADD COLUMN IF NOT EXISTS verification_level TEXT CHECK (verification_level IN ('recommended', 'listed')),
ADD COLUMN IF NOT EXISTS has_rich_content BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS empathy_ledger_service_id UUID;

-- Index for service finder sorting (verified first)
CREATE INDEX idx_services_verification_priority
ON services(verification_level DESC NULLS LAST, verification_status, name);
```

#### 5. Create `story_program_links` junction table
```sql
CREATE TABLE story_program_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empathy_ledger_story_id UUID NOT NULL,
  community_program_id UUID NOT NULL REFERENCES community_programs(id),
  link_type TEXT DEFAULT 'featured',  -- 'featured', 'outcome', 'testimonial'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empathy_ledger_story_id, community_program_id)
);
```

#### 6. Create `centre_of_excellence_resources` table
```sql
CREATE TABLE centre_of_excellence_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  resource_type TEXT CHECK (resource_type IN ('framework', 'evaluation', 'research', 'policy', 'case-study')),
  evidence_level TEXT,
  citations JSONB DEFAULT '[]',
  published_date TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction: Programs using COE resources
CREATE TABLE program_coe_links (
  program_id UUID REFERENCES community_programs(id),
  coe_resource_id UUID REFERENCES centre_of_excellence_resources(id),
  PRIMARY KEY (program_id, coe_resource_id)
);
```

#### 7. Enhance `profile_appearances` - Add more context types
```sql
ALTER TABLE profile_appearances
ADD COLUMN IF NOT EXISTS is_storyteller BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS story_id UUID,  -- Link to EL story
ADD COLUMN IF NOT EXISTS quote TEXT,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update CHECK constraint for appears_on_type
ALTER TABLE profile_appearances DROP CONSTRAINT IF EXISTS profile_appearances_appears_on_type_check;
ALTER TABLE profile_appearances
ADD CONSTRAINT profile_appearances_appears_on_type_check
CHECK (appears_on_type IN ('program', 'service', 'organization', 'article', 'centre-of-excellence'));
```

### Empathy Ledger DB - Schema Changes

#### 1. Add JusticeHub linkage fields to `stories`
```sql
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS justicehub_program_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS justicehub_organization_id UUID;

CREATE INDEX IF NOT EXISTS idx_stories_justicehub_programs
ON stories USING GIN(justicehub_program_ids);
```

#### 2. Add JusticeHub linkage to `organizations`
```sql
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS justicehub_org_id UUID;
```

---

## User Journey Flows

### Flow 1: Service Seeker Finding Help

```
1. Land on homepage
2. Click "Find Services" → /services
3. See map + filters
4. Top section: "Recommended Services" (verified, rich content)
   - Shows services with stories, outcomes, detailed info
   - Star/badge icon indicates "Verified & Recommended"
5. Bottom section: "All Available Services"
   - Includes scraped services
   - Shows basic contact info only
6. Click service → /services/[id]
   - If verified: See programs, stories, outcomes, people
   - If scraped: See basic info + "Know more about this service? Contact us"
7. Click linked program → /community-programs/[slug]
   - See outcomes, stories, people involved
8. Click profile → /people/[id]
   - See person's story and other programs they're linked to
```

### Flow 2: Story Reader Discovering Content

```
1. Land on homepage or /stories
2. Browse stories (filtered by privacy settings)
3. Click story → /stories/[slug]
4. Read story with cultural protocols displayed
5. See "This story is from [Program Name]" link
6. Click program → /community-programs/[slug]
7. See program outcomes and other stories
8. See "Run by [Organization Name]" link
9. Click organization → /organizations/[slug]
10. See all services and programs by this org
```

### Flow 3: Researcher Exploring Outcomes

```
1. Visit /community-programs
2. Filter by approach, outcomes, location
3. Click program → /community-programs/[slug]
4. See detailed metrics (72% success rate, etc.)
5. See "Uses [Framework Name]" link
6. Click framework → /centre-of-excellence/[slug]
7. See academic description of framework
8. See all programs using this framework
9. See stories demonstrating the framework in action
```

### Flow 4: Administrator Adding Content

```
# Adding an Organization
1. Admin panel → Organizations → Add New
2. Fill in basic details (name, contact, location)
3. Set verification_status = 'verified'
4. Link to Empathy Ledger org if exists
5. Save

# Adding a Service
1. Admin panel → Services → Add New
2. Select parent organization
3. Fill in service details
4. Set verification_level = 'recommended' (if verified + rich content)
5. Add service locations
6. Save

# Adding a Program
1. Admin panel → Programs → Add New
2. Select parent organization
3. Optionally link to parent service
4. Fill in outcomes and metrics
5. Add frameworks/approaches used
6. Save
7. Link stories (search EL stories, create links)
8. Link people (search EL profiles, create profile_appearances)

# Linking a Person to a Program
1. Search Empathy Ledger for profile
2. Create profile_appearance record:
   - appears_on_type = 'program'
   - appears_on_id = program UUID
   - role = 'Program Manager'
   - featured = true
3. Optionally link their story
```

---

## Frontend Implementation Strategy

### Phase 1: Core Structure (Week 1-2)

**Tasks**:
1. Create Organizations list page (`/organizations`)
2. Create Organization detail page (`/organizations/[slug]`)
3. Update Services page to show "Recommended" vs "All" sections
4. Update Service detail page to show linked programs
5. Update Programs page filters
6. Update Program detail page to show parent org/service

**Database Work**:
- Add `organization_id` to `community_programs`
- Add `verification_level` to `services`
- Migration scripts to populate relationships

### Phase 2: People & Stories (Week 3-4)

**Tasks**:
1. Create People browse page (`/people`)
2. Create Person detail page (`/people/[id]`)
3. Update Story detail pages to show linked programs
4. Create story linking UI in admin
5. Create profile appearance management UI

**Database Work**:
- Enhance `profile_appearances` with storyteller flag
- Create `story_program_links` table
- Build sync scripts for EL profile data

### Phase 3: Centre of Excellence (Week 5-6)

**Tasks**:
1. Create COE homepage (`/centre-of-excellence`)
2. Create Resource detail pages (`/centre-of-excellence/[slug]`)
3. Show program linkages on resource pages
4. Show framework usage on program pages
5. Admin UI for creating COE resources

**Database Work**:
- Create `centre_of_excellence_resources` table
- Create `program_coe_links` junction table

### Phase 4: Search & Discovery (Week 7-8)

**Tasks**:
1. Global search across all entity types
2. Faceted filtering on all browse pages
3. "Related content" recommendations
4. Breadcrumb navigation showing relationships
5. Mobile-optimized views

**Database Work**:
- Full-text search indexes across all tables
- Materialized views for performance
- Caching strategy

---

## API Structure

### Recommended API Routes

```typescript
// Organizations
GET  /api/organizations
GET  /api/organizations/[slug]
GET  /api/organizations/[slug]/services
GET  /api/organizations/[slug]/programs
GET  /api/organizations/[slug]/people

// Services
GET  /api/services
GET  /api/services/[id]
GET  /api/services/[id]/programs
GET  /api/services/[id]/stories
GET  /api/services/recommended  // Verified services only

// Programs
GET  /api/programs
GET  /api/programs/[slug]
GET  /api/programs/[slug]/people
GET  /api/programs/[slug]/stories
GET  /api/programs/[slug]/outcomes

// People (Profiles)
GET  /api/people
GET  /api/people/[id]
GET  /api/people/[id]/appearances
GET  /api/people/[id]/stories

// Stories
GET  /api/stories
GET  /api/stories/[slug]
GET  /api/stories/[slug]/program
GET  /api/stories/[slug]/organization

// Centre of Excellence
GET  /api/centre-of-excellence
GET  /api/centre-of-excellence/[slug]
GET  /api/centre-of-excellence/[slug]/programs

// Featured Content
GET  /api/featured-profiles
GET  /api/featured-programs
GET  /api/featured-stories

// Search
GET  /api/search?q=term&type=all|organization|service|program|person|story
```

---

## Migration Path

### Immediate Actions (This Week)

1. ✅ Add `organization_id` to `community_programs`
2. ✅ Create Organizations list data
3. ✅ Add verification_level to services
4. ✅ Document all relationships in code comments

### Short Term (Next 2 Weeks)

1. Build Organizations browse and detail pages
2. Update Services page with "Recommended" section
3. Create admin UI for linking programs to orgs
4. Create admin UI for linking profiles to programs

### Medium Term (Next Month)

1. People browse and detail pages
2. Story-program linkage system
3. Centre of Excellence initial content
4. Enhanced search and filtering

### Long Term (Next Quarter)

1. Full COE with frameworks and research
2. Admin dashboard for content management
3. Analytics and reporting
4. Mobile app integration

---

## Questions for Clarification

1. **Services vs Programs**: Should services with rich content (stories, outcomes) be automatically converted to "programs"? Or keep both?

2. **Organization Duplication**: Should we sync organizations from Empathy Ledger into JusticeHub DB, or just reference them by ID?

3. **Verification Workflow**: Who verifies services? What's the process? (Manual review, interview, site visit?)

4. **Profile Privacy**: How do we handle profiles that want anonymity but still appear in programs?

5. **Story Permissions**: What's the approval flow for linking stories to programs?

6. **Admin Access**: Will there be multiple admin roles? (org admin, site admin, editor?)

---

## Summary

This architecture provides:
- ✅ Clear entity definitions with no overlap
- ✅ Logical user journeys for all personas
- ✅ Scalable database structure across both Supabase instances
- ✅ Verified vs. scraped service distinction
- ✅ Rich linkages between organizations, services, programs, people, and stories
- ✅ Centre of Excellence integration for frameworks and research
- ✅ Practical migration path with phased implementation

**Next Steps**:
1. Review and approve this architecture
2. Prioritize which phases to implement first
3. Create detailed tickets for Phase 1 work
4. Begin database migrations

