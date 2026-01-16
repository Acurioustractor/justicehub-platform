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

## THREE-TIER DATA ARCHITECTURE

JusticeHub uses a three-layer approach to service data:

### Layer 1: Services (Discovery)
**Table**: `services`
- **Source**: Discovered via web scraping, government databases, research
- **Update frequency**: Continuously enriched by AI/scraping system
- **Evidence level**: Unverified discovery data
- **Count**: 507 services

### Layer 2: ALMA Interventions (Evidence)
**Table**: `alma_interventions`
- **Source**: Services with documented evidence (annual reports, media, impact reporting)
- **Update frequency**: Curated additions
- **Evidence level**: Has supporting evidence
- **Count**: ~500+ interventions

### Layer 3: Registered Services (Relationship)
**Table**: `registered_services`
- **Source**: Services with direct partnerships, interviews, verified relationships
- **Update frequency**: Manual verification
- **Evidence level**: Active collaboration with JusticeHub
- **Count**: 12 registered services

### Service Categories (19 total)

| Category | Services | Description |
|----------|----------|-------------|
| case_management | 211 | Wrap-around support coordination |
| support_group | 177 | Peer support and group programs |
| mentoring | 168 | One-on-one guidance |
| advocacy | 97 | Rights and representation |
| life_skills | 66 | Practical skills development |
| leadership | 61 | Youth leadership programs |
| education_training | 37 | Formal learning support |
| diversion | 36 | Alternative to justice system |
| employment | 32 | Job readiness and placement |
| counselling | 31 | Therapeutic support |
| family_support | 29 | Family strengthening |
| mental_health | 25 | Mental health services |
| court_support | 12 | Court navigation assistance |
| legal_aid | 11 | Legal representation |
| crisis_support | 3 | Emergency intervention |
| substance_abuse | 3 | Addiction support |
| health | 2 | General health services |
| housing | 2 | Accommodation support |
| recreation | 1 | Sports and activities |

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

### Registered Services (`registered_services`)

**Purpose**: Services with direct partnerships, verified relationships, and active collaboration with JusticeHub.

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

> **Note**: Renamed from `community_programs` to `registered_services` in January 2026 to better reflect the three-tier data architecture.

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

## 5. DATA LINKING & RECONCILIATION

### Services ↔ ALMA Interventions (January 2026)

The `services` and `alma_interventions` tables contained significant overlap - **492 of 511 services** are duplicates of ALMA interventions (matched by name). These are now linked:

**Linking Fields:**
- `services.alma_intervention_id` → FK to `alma_interventions.id` (502 services linked)
- `alma_interventions.linked_service_id` → FK to `services.id` (499 interventions linked)
- `services.service_type` → Populated from `alma_interventions.type` (501 services)

**Service Type Distribution:**
| Type | Count |
|------|-------|
| Wraparound Support | 194 |
| Cultural Connection | 61 |
| Community-Led | 56 |
| Prevention | 47 |
| Education/Employment | 34 |
| Diversion | 34 |
| Therapeutic | 25 |
| Justice Reinvestment | 23 |
| Early Intervention | 18 |
| Family Strengthening | 10 |

### Unified Services View

A unified view (`services_unified`) merges all service-related tables:

```sql
-- Query unified services
SELECT * FROM services_unified;

-- Get statistics
SELECT * FROM get_unified_services_stats();
```

The view:
- Deduplicates by name matching across `services`, `community_programs`, and `alma_interventions`
- Prefers `services` as source of truth (geocoded, verified)
- Includes evidence level, portfolio scores from ALMA
- Tracks source table for each record

**Current Stats (January 2026):**
| Metric | Count |
|--------|-------|
| Total unified records | 1,026 |
| With coordinates | 515 |
| From services | 511 |
| From ALMA (unlinked) | 503 |
| From community_programs | 12 |

**Migration file:** `supabase/migrations/20260113100001_create_unified_services_view.sql`
**Applied:** Yes (via psql pooler connection)

### Geocoding

All services and community programs have been geocoded for map visualization:
- **Services:** 505 with coordinates (latitude/longitude)
- **Community Programs:** 12 with coordinates
- **Scripts:** `src/scripts/geocode-services.ts`, `src/scripts/geocode-community-programs.mjs`

---

## 6. DATA SOURCES

### Primary (Supabase)
All tables above stored in Supabase PostgreSQL.

**Direct Database Access:**
```bash
source .env.local
PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co||')
DB_URL="postgresql://postgres.${PROJECT_ID}:${SUPABASE_DB_PASSWORD}@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres"
psql "$DB_URL" -c "SELECT * FROM table;"
```

Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_DB_PASSWORD`

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

## 7. CONTENT CATEGORIES

The site uses a **Seeds → Growth → Harvest → Roots** metaphor:

| Category | Description | Content Types |
|----------|-------------|---------------|
| **Seeds** | Foundational programs, early intervention | Programs, services |
| **Growth** | Development-focused, skill building | Training, education |
| **Harvest** | Outcomes, success stories, impact | Evidence, stories |
| **Roots** | Cultural foundation, Indigenous knowledge | Community context |

---

## 8. STATUS & VISIBILITY

| Field | Values | Used By |
|-------|--------|---------|
| `status` | draft, published, archived | blog_posts, articles |
| `is_published` | true/false | stories |
| `is_public` | true/false | public_profiles |
| `is_featured` | true/false | profiles, programs |
| `is_active` | true/false | organizations, services |
| `verification_status` | pending, verified, rejected | organizations, services |

---

## 9. GEOGRAPHIC COVERAGE

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

## 10. YOUTH JUSTICE INFRASTRUCTURE

Australian youth detention facilities and justice centres documented in the database:

### Detention Centres (7)

| State | Name | City |
|-------|------|------|
| NT | Alice Springs Youth Detention Centre | Alice Springs |
| NT | Don Dale Youth Detention Centre | Darwin |
| QLD | Brisbane Youth Detention Centre | Wacol |
| QLD | Cleveland Youth Detention Centre | Townsville |
| QLD | Wacol Youth Remand Centre | Wacol |
| QLD | West Moreton Youth Detention Centre | West Moreton |
| TAS | Ashley Youth Detention Centre | Hobart |
| WA | Banksia Hill Detention Centre | Perth |

### Youth Justice Centres (10)

| State | Name | City |
|-------|------|------|
| ACT | Bimberi Youth Justice Centre | Canberra |
| NSW | Acmena Youth Justice Centre | South Grafton |
| NSW | Cobham Youth Justice Centre | Werrington |
| NSW | Frank Baxter Youth Justice Centre | Kariong |
| NSW | Orana Youth Justice Centre | Dubbo |
| NSW | Reiby Youth Justice Centre | Airds |
| NSW | Riverina Youth Justice Centre | Wagga Wagga |
| SA | Kurlana Tapa Youth Justice Centre | Adelaide |
| VIC | Cherry Creek Youth Justice Centre | Melbourne |
| VIC | Parkville Youth Justice Centre | Melbourne |

### Infrastructure Types

| Type | Count | Description |
|------|-------|-------------|
| `community_service` | 482 | Community-based services and programs |
| `youth_justice_centre` | 10 | State-operated youth justice facilities |
| `court` | 8 | Youth courts and court support services |
| `detention_centre` | 8 | Youth detention/remand facilities |

### Key Statistics (January 2026)
- 884 young people in detention on average night (June quarter 2025)
- 91% male, 56% First Nations young people
- First Nations overrepresentation: 27x non-Indigenous rate

---

## 11. CONTENT NEEDED

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
