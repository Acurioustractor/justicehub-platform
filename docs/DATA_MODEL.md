# JusticeHub Data Model

## Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              JUSTICEHUB DATA MODEL                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │   PEOPLE    │────▶│ORGANIZATIONS│────▶│  PROGRAMS   │                   │
│  │  (profiles) │     │             │     │ (community) │                   │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘                   │
│         │                   │                   │                           │
│         │                   │                   ▼                           │
│         │                   │           ┌─────────────┐                     │
│         │                   └──────────▶│  SERVICES   │                     │
│         │                               └──────┬──────┘                     │
│         │                                      │                            │
│         ▼                                      ▼                            │
│  ┌─────────────┐                       ┌─────────────┐                     │
│  │   STORIES   │◀─────────────────────▶│    ALMA     │                     │
│  │   (blog)    │                       │INTERVENTIONS│                     │
│  └──────┬──────┘                       └──────┬──────┘                     │
│         │                                     │                            │
│         ▼                                     ▼                            │
│  ┌─────────────┐                       ┌─────────────┐                     │
│  │   MEDIA     │                       │  EVIDENCE   │                     │
│  │  (gallery)  │                       │ (research)  │                     │
│  └─────────────┘                       └─────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. CORE ENTITIES

### People (`public_profiles`)

**Purpose**: Practitioners, researchers, leaders, and community members in the youth justice space.

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Auth user reference |
| `full_name` | string | Display name |
| `slug` | string | URL-friendly identifier |
| `preferred_name` | string | Nickname/preferred |
| `pronouns` | string | Pronouns |
| `bio` | text | Biography |
| `tagline` | string | Short description |
| `photo_url` | string | Profile image |
| `role_tags` | string[] | ['researcher', 'practitioner', 'lived-experience'] |
| `current_organization` | string | Current org name |
| `is_public` | boolean | Publicly visible |
| `is_featured` | boolean | Featured on homepage |
| `empathy_ledger_profile_id` | uuid | Sync from Empathy Ledger |

**Routes**:
- `/people` - Directory listing
- `/people/[slug]` - Profile detail
- `/people/[slug]/edit` - Edit profile

**Relationships**:
- → Organizations (via `current_organization` or `organization_profile` junction)
- → Stories/Blog Posts (as author)
- → Programs (as team member)

---

### Organizations (`organizations`)

**Purpose**: Non-profits, government agencies, service providers, community organizations.

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `name` | string | Organization name |
| `slug` | string | URL identifier |
| `type` | string | 'nonprofit', 'government', 'social_enterprise' |
| `description` | text | About the organization |
| `city` | string | City location |
| `state` | string | State/territory |
| `website` | string | Website URL |
| `logo_url` | string | Logo image |
| `tags` | string[] | Classification tags |
| `verification_status` | string | 'pending', 'verified', 'rejected' |
| `empathy_ledger_org_id` | uuid | Sync from Empathy Ledger |

**Routes**:
- `/organizations` - Directory listing
- `/organizations/[slug]` - Organization detail

**Relationships**:
- → Programs (organization runs programs)
- → Services (organization provides services)
- → People (organization employs/affiliates)
- → Media (organization creates content)

---

### Community Programs (`community_programs`)

**Purpose**: Grassroots, community-led youth justice programs emphasizing Indigenous knowledge.

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `name` | string | Program name |
| `description` | text | Program description |
| `organization` | string | Operating organization name |
| `organization_id` | uuid | FK to organizations |
| `location` | string | Service location |
| `approach` | text | Program approach/methodology |
| `impact_summary` | text | Impact description |
| `indigenous_knowledge` | boolean | Uses Indigenous knowledge |
| `is_featured` | boolean | Featured listing |
| `alma_intervention_id` | uuid | Link to ALMA intervention |
| `empathy_ledger_project_id` | uuid | Sync from Empathy Ledger |

**Routes**:
- `/community-programs` - Program listing
- `/community-programs/[id]` - Program detail
- `/community-programs/add` - Submit new program

**Relationships**:
- → Organizations (run by)
- → ALMA Interventions (linked evidence)
- → Stories (program stories)
- → Services (related services)

---

### Services (`services`)

**Purpose**: Direct support services (legal aid, mental health, housing, education, employment).

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `name` | string | Service name |
| `description` | text | Service description |
| `categories` | string[] | ['legal', 'health', 'housing', 'education', 'employment'] |
| `location` | jsonb | {city, state, region} |
| `delivery_method` | string[] | ['in-person', 'online', 'phone'] |
| `contact` | jsonb | {phone, email, website} |
| `cost` | string | 'free', 'low', 'moderate' |
| `eligibility_criteria` | string[] | Who can access |
| `youth_specific` | boolean | Youth-focused service |
| `indigenous_specific` | boolean | Indigenous-specific |
| `verification_status` | string | Data verification state |
| `alma_intervention_id` | uuid | Link to ALMA intervention |

**Routes**:
- `/services` - Service finder
- `/services/[id]` - Service detail

**Relationships**:
- → Organizations (provided by)
- → ALMA Interventions (evidence backing)
- → Stories (user experiences)

---

## 2. ALMA FRAMEWORK (Evidence System)

### ALMA Interventions (`alma_interventions`)

**Purpose**: Documented youth justice interventions with evidence ratings and portfolio scoring.

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `name` | string | Intervention name |
| `description` | text | Full description |
| `type` | string | 'Prevention', 'Diversion', 'Therapeutic', etc. |
| `evidence_level` | string | 'Strong', 'Moderate', 'Emerging', 'Limited' |
| `consent_level` | string | 'Community Controlled', 'Community Informed', 'Institutional' |
| `geography` | string[] | Geographic coverage |
| `metadata` | jsonb | {state, source, tags} |
| `portfolio_score` | integer | Ranking score |
| `operating_organization` | string | Who runs it |
| `website` | string | More info URL |
| `linked_service_id` | uuid | FK to services |
| `linked_community_program_id` | uuid | FK to community_programs |

**Routes**:
- `/youth-justice-report/interventions` - Interventions by state
- `/intelligence/interventions` - Full ALMA browser
- `/intelligence/interventions/[id]` - Intervention detail
- `/intelligence/portfolio` - Portfolio analysis

**Relationships**:
- → Evidence (research backing)
- → Outcomes (targeted outcomes)
- → Services (implementation)
- → Programs (community implementation)

---

### ALMA Evidence (`alma_evidence`)

**Purpose**: Research publications, evaluations, and documented evidence.

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `title` | string | Study/paper title |
| `evidence_type` | string | 'RCT', 'Quasi-experimental', 'Qualitative', 'Case Study' |
| `findings` | text | Key findings |
| `author` | string | Author(s) |
| `organization` | string | Publishing organization |
| `methodology` | text | Research methodology |
| `effect_size` | string | Statistical effect |
| `sample_size` | integer | Study sample |
| `publication_date` | date | When published |
| `source_url` | string | Link to source |
| `consent_level` | string | Data consent level |
| `cultural_safety` | boolean | Culturally safe research |

**Routes**:
- `/intelligence/evidence` - Evidence browser
- `/intelligence/evidence/[id]` - Evidence detail
- `/youth-justice-report/research` - Research hub

**Relationships**:
- → Interventions (supports which interventions)
- → Outcomes (measures which outcomes)

---

### ALMA Outcomes (`alma_outcomes`)

**Purpose**: Measurable outcomes that interventions target.

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `name` | string | Outcome name |
| `outcome_type` | string | 'Recidivism', 'Education', 'Employment', 'Wellbeing' |
| `description` | text | Outcome description |
| `beneficiary` | string | Who benefits |
| `measurement_method` | text | How measured |
| `indicators` | string[] | Measurement indicators |
| `time_horizon` | string | Short/medium/long term |

**Relationships**:
- → Interventions (targeted by)
- → Evidence (measured by)

---

## 3. CONTENT ENTITIES

### Blog Posts (`blog_posts`)

**Purpose**: Published articles, stories, updates from the JusticeHub editorial team.

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `title` | string | Post title |
| `slug` | string | URL identifier |
| `content` | text | Full content (markdown) |
| `excerpt` | text | Summary |
| `author_id` | uuid | FK to public_profiles |
| `status` | string | 'draft', 'published', 'archived' |
| `published_at` | timestamp | Publication date |
| `featured_image_url` | string | Hero image |
| `categories` | string[] | Content categories |
| `tags` | string[] | Topic tags |
| `empathy_ledger_story_id` | uuid | Synced from Empathy Ledger |

**Routes**:
- `/blog` - Blog listing
- `/blog/[slug]` - Blog post detail
- `/stories` - Combined stories view

**Relationships**:
- → Authors (written by)
- → Related services/programs (content links)

---

### Media Items (`media_item`)

**Purpose**: Photos, videos, artwork for the gallery.

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `title` | string | Media title |
| `description` | text | Description |
| `media_type` | string | 'photo', 'video', 'artwork', 'story' |
| `media_url` | string | Full media URL |
| `thumbnail_url` | string | Thumbnail URL |
| `creator_name` | string | Creator attribution |
| `organization_name` | string | Organization attribution |
| `views` | integer | View count |
| `duration` | string | Video duration |
| `tags` | string[] | Content tags |
| `featured` | boolean | Featured in gallery |

**Routes**:
- `/gallery` - Gallery grid
- `/gallery/[id]` - Media detail

**Relationships**:
- → Organizations (created by)
- → People (creator)

---

### International Programs (`international_programs`)

**Purpose**: Evidence-based programs from other countries for adaptation.

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `name` | string | Program name |
| `country` | string | Country of origin |
| `region` | string | Geographic region |
| `description` | text | Program description |
| `approach_summary` | text | Methodology |
| `evidence_strength` | string | Evidence rating |
| `key_outcomes` | jsonb | Outcome data |
| `recidivism_rate` | decimal | Recidivism reduction % |
| `population_served` | string | Target population |
| `australian_adaptations` | text[] | Adaptation suggestions |
| `status` | string | 'published', 'draft' |

**Routes**:
- `/youth-justice-report/international` - International programs
- `/centre-of-excellence/global-insights` - Global insights

---

### Historical Inquiries (`historical_inquiries`)

**Purpose**: Royal commissions, parliamentary inquiries, government reviews.

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `title` | string | Inquiry title |
| `inquiry_type` | string | 'royal_commission', 'parliamentary', 'government_review' |
| `jurisdiction` | string | State/territory |
| `year_published` | integer | Publication year |
| `summary` | text | Inquiry summary |
| `recommendations_count` | integer | Number of recommendations |
| `implementation_status` | string | 'pending', 'partial', 'implemented' |
| `source_url` | string | Link to source |

**Routes**:
- `/youth-justice-report/inquiries` - Inquiries listing

---

## 4. RELATIONSHIP TABLES (Junction Tables)

| Table | Links | Purpose |
|-------|-------|---------|
| `alma_intervention_evidence` | interventions ↔ evidence | Research backing |
| `alma_intervention_outcome` | interventions ↔ outcomes | Target outcomes |
| `alma_evidence_outcomes` | evidence ↔ outcomes | Measured outcomes |
| `organization_profile` | organizations ↔ profiles | Team members |
| `article_related_service` | articles ↔ services | Content links |
| `article_related_program` | articles ↔ programs | Content links |
| `story_related_service` | stories ↔ services | User experiences |
| `story_related_program` | stories ↔ programs | Participant stories |

---

## 5. DATA SOURCES

### Primary (Supabase)
All tables above stored in Supabase PostgreSQL.

### Synced (Empathy Ledger)
- Profiles → `public_profiles.empathy_ledger_profile_id`
- Organizations → `organizations.empathy_ledger_org_id`
- Projects → `community_programs.empathy_ledger_project_id`
- Stories → `blog_posts.empathy_ledger_story_id`

### External Ingestion
- Government databases (scraped)
- Research APIs
- Web scraping for service discovery

---

## 6. CONTENT CATEGORIES

The site uses a **Seeds → Growth → Harvest → Roots** metaphor:

| Category | Description | Content Types |
|----------|-------------|---------------|
| **Seeds** | Foundational programs, early intervention | Programs, services |
| **Growth** | Development-focused, skill building | Training, education |
| **Harvest** | Outcomes, success stories, impact | Evidence, stories |
| **Roots** | Cultural foundation, Indigenous knowledge | Community context |

---

## 7. STATUS & VISIBILITY

| Field | Values | Used By |
|-------|--------|---------|
| `status` | draft, published, archived | blog_posts, articles |
| `is_published` | true/false | stories |
| `is_public` | true/false | public_profiles |
| `is_featured` | true/false | profiles, programs |
| `is_active` | true/false | organizations, services |
| `verification_status` | pending, verified, rejected | organizations, services |

---

## 8. GEOGRAPHIC COVERAGE

**States/Territories tracked**:
- QLD (Queensland)
- NSW (New South Wales)
- VIC (Victoria)
- SA (South Australia)
- WA (Western Australia)
- TAS (Tasmania)
- NT (Northern Territory)
- ACT (Australian Capital Territory)

**Location fields**:
- `alma_interventions.metadata.state`
- `organizations.state`
- `services.location.state`
- `community_programs.location`

---

## 9. CONTENT NEEDED

### High Priority (Empty/Sparse)
- [ ] `alma_evidence` - Research papers need titles populated
- [ ] `historical_inquiries` - Using sample data fallback
- [ ] `media_item` - Gallery using placeholder images
- [ ] `blog_posts` - Need published content

### Medium Priority
- [ ] `international_programs` - Need more program adaptations
- [ ] `public_profiles` - Need more featured profiles
- [ ] Organization team members

### Low Priority (Sample Data Working)
- [ ] Art innovation items
- [ ] Additional service categories
