# Mount Isa Aunties Material - Content Structure Analysis

## Executive Summary

After exploring the JusticeHub platform, I've identified **multiple strategic placements** for Aunty Corrine's Mount Isa material. The platform has a sophisticated, interconnected content architecture that supports stories, blog posts, research, community programs, and profiles - all with robust auto-linking capabilities.

## Platform Content Architecture

### 1. Stories System (38+ stories currently)

**Location:** `/stories` and `/stories/[slug]`
**Database:** `stories` and `articles` tables (being unified)

**Structure:**
- Rich multimedia support (text, images, video, audio)
- Multiple content types: blog, interview, video, photo, multimedia
- Tagging and categorization system
- Auto-linking to people, programs, services, organizations
- Engagement metrics (views, likes, comments, shares)
- Full-text search

**Story Categories Include:**
- Transformation
- Advocacy
- Healing
- Education
- Second Chances
- Foster Care
- Family Support
- Legal Journey
- Community Impact
- Mentorship
- Artistic Expression
- Career Success

**Key Features:**
- `story_related_programs` - Links stories to community programs
- `story_related_services` - Links stories to services
- `story_related_art` - Links stories to art/innovation projects
- Auto-linking engine connects related content

### 2. Blog System

**Location:** `/blog` and `/blog/[slug]`
**Database:** `blog_posts` table

**Structure:**
- Professional publishing platform
- Featured images and media galleries
- Co-author support (multiple authors per post)
- SEO optimization (meta titles, descriptions)
- Tags and categories
- Content linking to profiles, programs, services
- Rich text editor with auto-save
- Version control via `story_drafts`

**Content Links:**
- `blog_content_links` - Links blog posts to profiles, programs, services, art, other stories
- `blog_media` - Embedded images, videos, files
- `blog_comments` - Community engagement

### 3. Centre of Excellence (Research/Best Practice)

**Location:** `/centre-of-excellence/`
**Subsections:**
- `/research` - Research library (40+ studies)
- `/best-practice` - Australian state frameworks
- `/global-insights` - International models (16 programs)
- `/map` - Geographic visualization

**Structure:**
- Curated research with filtering by:
  - Category (trauma-informed, Indigenous-led, family engagement, etc.)
  - Jurisdiction (Australia, Queensland, NSW, International, etc.)
  - Type (research paper, systematic review, case study, etc.)
- Each item has:
  - Key findings
  - Outcomes data
  - External/PDF links
  - Geographic location mapping

**Research Categories:**
- Trauma-Informed Practice
- Indigenous-Led Diversion
- Family Engagement
- Restorative Justice
- Youth Rights & Lived Experience
- Recidivism
- Mental Health

### 4. Community Programs

**Location:** `/community-programs` and `/community-programs/[id]`
**Database:** `community_programs` table

**Structure:**
- Program name, description, location
- Organization links
- Geographic coordinates for mapping
- Service area and eligibility
- Contact information
- Media and documents
- Links to related stories, people, services

**Relationship Tables:**
- `community_programs_profiles` - Links to people/practitioners
- `story_related_programs` - Links from stories
- `article_related_programs` - Links from articles

### 5. Public Profiles System

**Location:** `/people` and `/people/[slug]`
**Database:** `public_profiles` table

**Structure:**
- Unified profile registry for all people
- Bio, tagline, role tags
- Photo and media
- Social links and contact (privacy-aware)
- Links to user accounts
- Empathy Ledger integration

**Profile Connections:**
- `art_innovation_profiles` - Links to creative projects
- `community_programs_profiles` - Links to programs
- `services_profiles` - Links to services
- `authors` - Links to authored content

**Role Tags:** 
- "artist", "advocate", "researcher", "lived-experience", "Elder", "community-leader", etc.

### 6. Organizations

**Location:** `/organizations` and `/organizations/[slug]`
**Database:** `organizations` table

**Structure:**
- Organization details
- Website and contact info
- Location and service area
- Links to programs and services
- Empathy Ledger sync capability

### 7. Auto-Linking System

**Key Feature:** Sophisticated relationship mapping

**Tables:**
- `article_related_art`
- `article_related_programs`
- `article_related_services`
- `article_related_articles`
- `story_related_art`
- `story_related_programs`
- `story_related_services`

**Functionality:**
- Automatically suggests connections between content
- "Related Reading" sections
- "Featured in these stories" sections
- Cross-references across content types

## Geographic/Community Representation

### Current Community Examples:
- Mount Isa - Referenced in material
- Bourke - Referenced in navigation/content
- Alice Springs - Referenced in content
- Remote communities - Specific focus area

### Location Fields:
- Programs have: `location`, `latitude`, `longitude`, `service_area`
- Services have: `service_locations` table with coordinates
- Articles have: `article_locations` table
- Stories can tag locations

### Geographic Features:
- Interactive maps using MapLibre
- `/community-map` - Service finder map
- `/centre-of-excellence/map` - Global programs map
- Location-based filtering and search

## Content Taxonomy

### Story Types:
- Practice Stories (lived experience narratives)
- Research (evidence-based studies)
- Commentary (expert perspectives)
- Case Studies (program outcomes)
- Interviews (conversations with practitioners/youth)
- Video Stories
- Photo Stories
- Multimedia Stories

### Tags System:
- `tags` table with categories
- `story_tags` with confidence scores
- AI-suggested tags
- User-created tags
- Featured tags

## Data Model Highlights

### Core Content Tables:
```sql
stories - Platform stories with rich content
articles - Long-form articles/blog posts
blog_posts - Professional blog system
public_profiles - People registry
community_programs - Programs and initiatives
organizations - Organization directory
services - Service providers
art_innovation - Creative projects
```

### Relationship/Linking Tables:
```sql
story_related_programs
story_related_services
article_related_programs
article_related_articles
community_programs_profiles
art_innovation_profiles
services_profiles
```

### Analytics/Engagement:
```sql
story_analytics - Event tracking
story_metrics - Aggregated performance
search_queries - Search behavior
story_similarities - Content recommendations
```

## Recommendations for Mount Isa Aunties Material

### Primary Placement: Community Program

**Create:** Mount Isa Aunties Program Entry

**Rationale:**
- Aunty Corrine's work is fundamentally a community-led program
- Fits perfectly into Indigenous-led diversion category
- Can be linked to Mount Isa location
- Can connect to multiple stories and profiles

**Program Entry Would Include:**
- Program name: "Mount Isa Aunties" or proper name
- Location: Mount Isa, Queensland (with coordinates)
- Description: Elder-led support program details
- Organization: Could link to existing org or create new
- Service area: Mount Isa and surrounding communities
- Contact information (if consented)
- Media: Photos, videos of the work
- Links to related stories

### Secondary Placement: Profile for Aunty Corrine

**Create:** Public Profile Entry

**Rationale:**
- Aunty Corrine is a key practitioner/Elder
- Deserves recognition as community leader
- Profile can link to program, stories, research

**Profile Would Include:**
- Full name
- Role tags: ["Elder", "community-leader", "lived-experience", "Indigenous"]
- Bio: Her story and impact
- Tagline: One-line description of her role
- Photo: If consented
- Links to: Mount Isa Aunties program, related stories

### Tertiary Placement: Story/Stories

**Create:** One or More Story Entries

**Options:**

**Option A: Interview Story**
- Type: Interview
- Format: Audio, video, or text
- Interviewee: Aunty Corrine
- Questions & Answers about her work
- Themes: Indigenous diversion, Elder leadership, community healing
- Links to: Mount Isa Aunties program, Aunty Corrine profile

**Option B: Program Case Study**
- Type: Case study
- Focus: Mount Isa Aunties outcomes and approach
- Evidence of impact
- Links to: Program, profiles, related research

**Option C: Photo Story**
- Type: Photo story
- Layout: Carousel or grid
- Photos: The Aunties at work (with consent)
- Captions: Context and impact
- Links to: Program and profiles

**Option D: Multimedia Story**
- Type: Multimedia
- Sections: Mix of text, images, video, quotes
- Comprehensive telling of the story
- Table of contents
- Links to: All related content

### Quaternary Placement: Centre of Excellence

**Create:** Best Practice Framework Entry

**Rationale:**
- If outcomes data available, could be Australian best practice
- Fits into Queensland Indigenous-led programs category
- Could be featured alongside NSW Youth Koori Court, etc.

**Would Include:**
- Program outcomes (if available)
- Key features of the approach
- Strengths and challenges
- Resources and research links
- Geographic location on map

### Additional Placements:

**Blog Post:**
- Professional writeup about the program
- Could be authored by team member
- Links to program, profiles, stories
- SEO-optimized for discoverability

**Research Links:**
- Connect to relevant research in Centre of Excellence
- Link to Lowitja Institute Indigenous diversion research
- Link to Queensland programs research
- Link to Elder-led models research

**Art & Innovation:**
- If there's creative/innovative aspect to the work
- Could highlight unique approaches
- Photo/video documentation

## Cross-Linking Strategy

Once content is created, the auto-linking system would connect:

1. **Program → Stories**: All stories about the program
2. **Program → Profiles**: Aunty Corrine and other Aunties
3. **Program → Research**: Related Indigenous-led diversion research
4. **Profile → Program**: Aunty Corrine's profile links to program
5. **Profile → Stories**: Stories featuring Aunty Corrine
6. **Stories → Program**: Each story links back to program
7. **Stories → Profiles**: Stories link to people featured
8. **Blog → All**: Blog posts link to program, profiles, stories
9. **Centre of Excellence → Program**: Best practice links to program
10. **Research → Program**: Relevant studies cite the program

## Geographic Integration

**Mount Isa Location:**
- Would appear on `/community-map` as a service/program location
- Would appear on Centre of Excellence map if added as best practice
- Could be filtered by "Queensland" or "Remote Communities"
- Coordinates: -20.7256° S, 139.4927° E

**Community Context:**
- Tag as "remote community"
- Tag as "Mount Isa"
- Tag as "Queensland"
- Tag as "Indigenous-led"
- Tag as "Elder-led"

## Content Governance

**Consent and Privacy:**
- Platform has privacy controls (`is_public` flags)
- Profiles can be hidden if needed
- Content can be `draft`, `review`, `published`, or `archived`
- Empathy Ledger integration for consent management

**Attribution:**
- Co-authorship supported
- Photo credits
- Media credits
- Source attribution

**Moderation:**
- Admin approval workflow
- Content status tracking
- Version control with drafts

## Technical Implementation Path

### Phase 1: Create Core Entities
1. Create Mount Isa Aunties program entry
2. Create Aunty Corrine profile
3. Link profile to program

### Phase 2: Add Stories
4. Create primary story (interview, case study, or multimedia)
5. Add any additional stories
6. Link stories to program and profile

### Phase 3: Enrich Connections
7. Link to relevant Centre of Excellence research
8. Add location tagging
9. Create blog post if appropriate
10. Set up auto-linking relationships

### Phase 4: Optimize Discovery
11. Add SEO metadata
12. Add tags for filtering
13. Feature on relevant pages if appropriate
14. Add to maps

## Platform Navigation

### How Users Would Find Content:

**Via Stories Page:**
- Browse all stories
- Filter by category (would need to add "Elder-led programs" or similar)
- Filter by location (Mount Isa)
- Filter by tag (Indigenous, diversion, Queensland)
- Search for "Mount Isa" or "Aunties"

**Via Community Programs:**
- Browse programs
- Filter by location
- Search for program name
- View on map

**Via People:**
- Browse profiles
- Filter by role (Elder, community-leader)
- Search for Aunty Corrine

**Via Centre of Excellence:**
- Browse best practice
- Filter by Queensland
- Filter by Indigenous-led
- View on map

**Via Search:**
- Global search across all content
- Full-text search in stories and blog
- Tag-based search

**Via Auto-Linking:**
- "Related stories" sections
- "Featured in" sections
- "Related programs" sections
- Cross-references

## Content Style Examples

### Existing Queensland Content:
- Queensland Diversion Model in Centre of Excellence
- Queensland Audit Office research
- Restorative Justice programmes review

### Existing Indigenous Content:
- NSW Youth Koori Court (best practice)
- Lowitja Institute research
- AIFS Indigenous youth justice evaluation
- Community-led diversion research

### Existing Remote Community Content:
- References to remote community programs
- Geographic filtering
- Place-based approaches emphasis

## Summary

The JusticeHub platform has a **robust, interconnected content architecture** perfectly suited for showcasing the Mount Isa Aunties material. The recommended approach is:

1. **Primary:** Create Community Program entry
2. **Secondary:** Create Public Profile for Aunty Corrine (and other Aunties if consented)
3. **Tertiary:** Create one or more Stories (interview, case study, photo story, or multimedia)
4. **Optional:** Add to Centre of Excellence if outcomes data supports it
5. **Optional:** Create blog post for professional writeup

All of these would be **automatically cross-linked** through the platform's sophisticated relationship mapping system, making the content discoverable through:
- Direct navigation
- Geographic maps
- Category filtering
- Tag-based search
- Full-text search
- "Related content" recommendations
- Cross-references from research and other programs

The material would naturally integrate with existing Queensland and Indigenous content while maintaining its unique identity as a Mount Isa-based, Elder-led initiative.

---

**Generated:** January 2025
**Platform:** JusticeHub
**Analysis Scope:** Complete codebase exploration
