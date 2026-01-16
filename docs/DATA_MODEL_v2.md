# JusticeHub Data Model v2

## Vision

**Goal:** Comprehensive, real-time understanding of Australia's youth justice landscape - every service, every intervention, every outcome - tracked over time.

---

## Core Entities

### 1. SERVICES (Discovery Layer)

**Definition:** Every youth justice-related service in Australia, discovered through automated scraping and AI enrichment.

**Source:**
- Web scraping (government sites, NGO directories)
- AI discovery (news, reports, announcements)
- Government databases (AIHW, state agencies)
- Manual additions

**Update Frequency:** Continuous (scraping pipeline)

**Purpose:** Complete catalog of what exists. The "phone book" of youth justice.

**Required Fields:**
| Field | Description |
|-------|-------------|
| `name` | Service name |
| `organization_id` | FK to organizations |
| `service_category` | Primary category (see taxonomy) |
| `infrastructure_type` | detention_centre, youth_justice_centre, court, regional_office, community_service |
| `location_*` | Address, city, state, coordinates |
| `contact_*` | Phone, email, website |
| `is_active` | Currently operating |
| `last_verified_at` | When we last confirmed this exists |

**Categories Taxonomy:**
```
├── JUSTICE SYSTEM (infrastructure)
│   ├── detention_centre
│   ├── youth_justice_centre
│   ├── children_court
│   ├── regional_office
│   └── remand_facility
├── LEGAL SUPPORT
│   ├── legal_aid
│   ├── court_support
│   └── advocacy
├── DIVERSION & PREVENTION
│   ├── diversion_program
│   ├── early_intervention
│   └── prevention
├── THERAPEUTIC
│   ├── mental_health
│   ├── substance_abuse
│   ├── trauma_informed
│   └── counselling
├── LIFE PATHWAYS
│   ├── education_training
│   ├── employment
│   ├── housing
│   └── life_skills
├── CULTURAL & COMMUNITY
│   ├── cultural_connection
│   ├── on_country
│   ├── family_support
│   └── mentoring
└── WRAPAROUND
    ├── case_management
    └── integrated_support
```

---

### 2. ALMA INTERVENTIONS (Evidence Layer)

**Definition:** Services with documented evidence of effectiveness - outcomes data, evaluations, or research.

**Source:**
- Annual reports from services
- Academic research & evaluations
- Media coverage of outcomes
- Direct conversations with practitioners
- Government impact reports (ROGS, etc.)

**Update Frequency:** When new evidence emerges

**Purpose:** Track WHAT WORKS. Evidence-based decision support.

**Required Fields:**
| Field | Description |
|-------|-------------|
| `name` | Intervention name |
| `linked_service_id` | FK to services (if operational) |
| `type` | Intervention type (from taxonomy) |
| `evidence_level` | See evidence taxonomy |
| `consent_level` | Community controlled, informed, institutional |
| `outcomes` | Documented outcomes |
| `effect_size` | Statistical effect if available |
| `source_documents` | Links to evidence sources |

**Evidence Level Taxonomy:**
```
├── PROVEN
│   ├── RCT (Randomized Controlled Trial)
│   ├── Quasi-experimental (replicated)
│   └── Systematic review
├── PROMISING
│   ├── Single quasi-experimental
│   ├── Strong observational data
│   └── Multiple case studies
├── EMERGING
│   ├── Pilot evaluation
│   ├── Practice-based evidence
│   └── Community endorsed
├── INDIGENOUS-LED
│   ├── Culturally grounded
│   ├── Community authority
│   └── Self-determined evaluation
└── LIMITED
    ├── Anecdotal only
    └── No formal evaluation
```

**Relationship to Services:**
- ALMA record CAN exist without a Service (research-only intervention)
- Service SHOULD link to ALMA when evidence exists
- `services.alma_intervention_id` → enriches service with evidence

---

### 3. REGISTERED SERVICES (Relationship Layer)

**Definition:** Services we have direct relationships with - interviewed, partnered, verified through personal contact.

**Source:**
- Practitioner interviews
- Partnership agreements
- Site visits
- Ongoing communication

**Update Frequency:** Through direct engagement

**Purpose:** Our verified network. Deep, trusted relationships.

**Table:** `registered_services` (rename from `community_programs`)

**Required Fields:**
| Field | Description |
|-------|-------------|
| `name` | Service name |
| `linked_service_id` | FK to services |
| `organization_id` | FK to organizations |
| `relationship_type` | partner, interviewed, site_visited, advisory |
| `primary_contact_id` | FK to profiles (practitioner) |
| `interview_date` | When we last spoke |
| `impact_story` | Qualitative narrative |
| `verified_outcomes` | Outcomes we've confirmed |
| `cultural_authority` | Indigenous governance status |

**Relationship to Services:**
- MUST link to a Service record
- Represents a SUBSET of services we know deeply
- Goal: Grow this through outreach

---

## Infrastructure Coverage

**Goal:** Complete map of Australia's youth justice infrastructure.

### Detention Centres (Must Track All)

| State | Facility | Status |
|-------|----------|--------|
| **ACT** | Bimberi Youth Justice Centre | ✅ In DB |
| **NSW** | Acmena YJC, Cobham YJC, Frank Baxter YJC, Orana YJC, Reiby YJC, Riverina YJC | ✅ In DB |
| **NT** | Don Dale YDC, Alice Springs YDC | ✅ In DB |
| **QLD** | Brisbane YDC, Cleveland YDC, West Moreton YDC | ✅ In DB (has dupes) |
| **SA** | Kurlana Tapa YJC | ✅ In DB (has dupes) |
| **TAS** | Ashley YDC | ✅ In DB |
| **VIC** | Parkville YJC, Cherry Creek YJC | ✅ In DB |
| **WA** | Banksia Hill DC | ✅ In DB (has dupes) |

### Youth Justice Regional Offices

Each state has regional youth justice offices - need to map these.

### Children's Courts

| State | Courts |
|-------|--------|
| **QLD** | Children's Court (Magistrates), Children's Court (District) | ✅ In DB |
| **VIC** | Koori Youth Court | ✅ In DB |
| **Other states** | Need to add |

---

## Data Quality Metrics

### Current State (January 2026)

| Metric | Count | % | Target |
|--------|-------|---|--------|
| **Services** | 511 | - | 1000+ |
| ├── With categories | 28 | 5% | 100% |
| ├── With coordinates | 505 | 99% | 100% |
| ├── With organization | 511 | 100% | 100% |
| ├── Duplicates identified | 4 | - | 0 |
| **ALMA Interventions** | 1,003 | - | - |
| ├── Linked to service | 499 | 50% | 80%+ |
| ├── With evidence level | ~600 | 60% | 100% |
| **Registered Services** | 12 | - | 100+ |
| **Organizations** | 471 | - | - |

### Priority Actions

1. **Deduplicate** detention centres (4 have duplicates)
2. **Categorize** 483 services missing categories
3. **Add infrastructure_type** to identify system components
4. **Rename** `community_programs` → `registered_services`
5. **Link more** ALMA interventions to services
6. **Grow** registered services through outreach

---

## Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   WEB SCRAPING  │────▶│    SERVICES     │◀────│  ALMA EVIDENCE  │
│   AI DISCOVERY  │     │  (All known)    │     │  (What works)   │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   REGISTERED    │
                        │    SERVICES     │
                        │  (Our network)  │
                        └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   COMMUNITY MAP │
                        │   INTELLIGENCE  │
                        │    REPORTING    │
                        └─────────────────┘
```

---

## Queries

### Find all detention centres
```sql
SELECT name, location_state, latitude, longitude
FROM services
WHERE infrastructure_type = 'detention_centre'
ORDER BY location_state;
```

### Services with evidence
```sql
SELECT s.name, s.location_state, ai.evidence_level, ai.type
FROM services s
JOIN alma_interventions ai ON s.alma_intervention_id = ai.id
WHERE ai.evidence_level IS NOT NULL;
```

### Our network (registered services)
```sql
SELECT rs.name, rs.relationship_type, rs.interview_date, s.location_state
FROM registered_services rs
JOIN services s ON rs.linked_service_id = s.id
ORDER BY rs.interview_date DESC;
```

---

## Migration Plan

1. Add `infrastructure_type` column to services
2. Populate infrastructure_type for detention centres, courts
3. Rename `community_programs` → `registered_services`
4. Add `linked_service_id` FK to registered_services
5. Deduplicate services
6. Backfill categories using AI classification
