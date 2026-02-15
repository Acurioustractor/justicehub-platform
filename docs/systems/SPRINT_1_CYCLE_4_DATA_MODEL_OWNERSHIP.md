# Sprint 1 Cycle 4: Data Model Ownership Matrix

Updated: 2026-02-15
Status: Draft for review gate

## Cycle 4 Objective

Lock a single ownership model for the runtime data layer so pages, APIs, and scrapers align to the same system contract:

- classify runtime objects as `canonical`, `supporting`, or `legacy`
- assign domain owner + write owner for each object
- lock ALMA relation-table rules
- sequence migrations for remaining legacy surfaces from Cycle 2 and Cycle 3

## Classification Rules

- `canonical`: source-of-truth object directly powering stable user-facing or admin-operational contracts.
- `supporting`: enrichment/link/audit object required for context, relationships, or operations, but not the primary entity contract.
- `legacy`: compatibility/staging/deprecated object that should not be primary authority for frontend behavior.

## Data Model Ownership (Priority Scope)

| Object | Kind | Class | Domain Owner | Primary Write Owner | Primary Read Paths | Notes |
|---|---|---|---|---|---|---|
| `services_complete` | view | canonical | Service Discovery | derived from `services` (+ org/location/contact tables) | `/api/services`, `/api/services/[id]` | Canonical read model for services list/detail. |
| `services` | table | canonical | Service Discovery | directory pipeline (`scrape-qld-services*`) + admin curation | `services_complete`, `/api/intelligence/map-locations`, admin ops stats | Canonical service entity table. |
| `organizations` | table | canonical | Service Discovery + CoE | directory pipeline + admin curation | `/api/basecamps`, programs enrichment, admin ops | Canonical org registry including Basecamps. |
| `programs_catalog_v` | view | canonical | Programs + CoE | derived from `registered_services` + `organizations` + `alma_interventions` | `/community-programs`, `/api/programs`, `/api/community-programs` | Canonical read model for programs. |
| `registered_services` | table | canonical | Programs + CoE | program curation + deterministic linking job | `programs_catalog_v`, `/community-programs/[id]` (legacy read path) | Canonical curated program record. |
| `alma_interventions` | table | canonical | Intelligence | ALMA pipeline (`/api/admin/data-operations/scrape` + ALMA ingest jobs) | `/api/alma/interventions`, intelligence pages, `programs_catalog_v` enrichment | Canonical intervention entity. |
| `alma_evidence` | table | canonical | Intelligence | ALMA pipeline + research ingestion | intelligence evidence surfaces, admin evidence stats | Canonical evidence corpus. |
| `alma_outcomes` | table | canonical | Intelligence | ALMA pipeline/curation | intelligence intervention detail | Canonical outcome entity. |
| `alma_community_contexts` | table | canonical | Intelligence | ALMA pipeline/curation | intelligence intervention detail + global stats | Canonical context entity. |
| `alma_discovered_links` | table | canonical | Platform Ops + Intelligence | ALMA scrape queue pipeline | `/api/admin/data-operations/*`, `/api/intelligence/system-status` | Canonical queue/status ledger. |
| `alma_ingestion_jobs` | table | canonical | Platform Ops + Intelligence | ALMA ingestion jobs | admin ops stats/alerts/data-health | Canonical ingestion job ledger. |
| `international_programs` | table | canonical | CoE | CoE curation/import | `/api/international-programs`, `/centre-of-excellence/global-insights` | Canonical global insights source. |
| `research_items` | table | canonical | CoE | CoE editorial/admin | `/centre-of-excellence/research` | Canonical CoE research source. |
| `australian_frameworks` | table | canonical | CoE | CoE editorial/admin | `/centre-of-excellence/best-practice` | Canonical AU framework source. |
| `coe_key_people` | table | canonical | CoE | CoE editorial/admin | `/centre-of-excellence/people` | Canonical CoE people source. |
| `partner_photos` | table | supporting | CoE + Partnerships | org/admin media workflows | `/api/basecamps` | Supporting media enrichment for basecamps. |
| `partner_impact_metrics` | table | supporting | CoE + Partnerships | org/admin impact workflows | `/api/basecamps` | Supporting impact enrichment for basecamps. |
| `profiles` | table | supporting | People + Platform Ops | auth/sync/admin | admin ops stats/alerts; auth checks | Supporting identity/admin object in this scope. |
| `stories` | table | supporting | Stories + Platform Ops | story/editorial workflows + sync | admin ops stats/alerts; programs page story section | Supporting narrative context in this scope. |
| `alma_source_registry` | table | supporting | Intelligence Ops | ALMA source management | `/api/intelligence/global-stats` | Supporting source health distribution. |
| `alma_scrape_history` | table | supporting | Intelligence Ops | `/api/admin/data-operations/scrape` | admin scrape history and audit | Supporting scrape audit trail. |
| `alma_research_sessions` | table | supporting | Intelligence Research | `/api/intelligence/research` | research session list/detail | Supporting agent workflow state. |
| `alma_research_findings` | table | supporting | Intelligence Research | research RPC pipeline | `/api/intelligence/research/[sessionId]` | Supporting research output details. |
| `alma_research_tool_logs` | table | supporting | Intelligence Research | research RPC pipeline | `/api/intelligence/research/[sessionId]` | Supporting tool execution telemetry. |
| `alma_intervention_evidence` | relation table | supporting | Intelligence | ALMA linkage/curation workflows | intervention detail, global stats | Links interventions <-> evidence. |
| `alma_intervention_outcomes` | relation table | supporting | Intelligence | ALMA linkage/curation workflows | intervention detail/list pages | Links interventions <-> outcomes. |
| `alma_intervention_contexts` | relation table | supporting | Intelligence | ALMA linkage/curation workflows | intervention detail/list pages | Links interventions <-> community contexts. |
| `article_related_interventions` | relation table | supporting | Intelligence + Stories | editorial linking workflows | intelligence evidence/program detail | Cross-links articles -> interventions. |
| `story_related_interventions` | relation table | supporting | Intelligence + Stories | editorial linking workflows | intelligence program detail | Cross-links stories -> interventions. |
| `alma_intervention_profiles` | relation table | supporting | Intelligence + People | profile-linking workflows | intelligence program detail | Links interventions -> people profiles. |
| `scraped_services` | table | legacy | Platform Ops (compat only) | legacy scraping/staging paths | admin ops stats/sources, legacy APIs | Keep as staging/compat; not frontend authority. |
| `data_sources` | table | legacy | Platform Ops (compat only) | legacy source registry workflows | admin ops stats/sources/feeds | Keep for compatibility; replace with pipeline-native registries over time. |

## ALMA Relation-Table Ownership Rules

These rules apply to:
- `alma_intervention_evidence`
- `alma_intervention_outcomes`
- `alma_intervention_contexts`
- `article_related_interventions`
- `story_related_interventions`
- `alma_intervention_profiles`

1. Link tables are `supporting` only; they never replace canonical entity tables.
2. Every row must reference canonical IDs (UUIDs) from its parent entities; no free-text foreign references.
3. ALMA entity link tables (`alma_intervention_*`) are owned by Intelligence ingest/curation workflows; frontend pages are read-only consumers.
4. Content relation tables (`article_related_interventions`, `story_related_interventions`) are owned by editorial/content-linking workflows.
5. Profile relation table (`alma_intervention_profiles`) is owned by profile-linking workflows.
6. Any new relation table must declare:
- owner domain
- write path (API/job)
- consumer endpoints/pages
- deletion and conflict policy

## Legacy Surface Migration Sequence (Cycle 2 + Cycle 3 Gaps)

1. **Program detail unification**
- Target: migrate `/community-programs/[id]` from direct `registered_services` reads to `GET /api/programs/[id]`.
- Acceptance: page renders all current sections with canonical `programs_catalog_v` payload only.

2. **Community map adapter reduction**
- Target: migrate `/community-map` from `GET /api/community-programs` adapter to `GET /api/programs`.
- Acceptance: map pins/card metadata unchanged; adapter retained only for external compatibility.

3. **Intelligence overview decoupling**
- Target: add `GET /api/intelligence/overview-summary` and remove admin endpoint dependencies from `/intelligence/overview`.
- Acceptance: overview page no longer calls `/api/admin/*` routes.

4. **CoE map authority migration**
- Target: replace static `src/content/excellence-map-locations.ts` authority with `GET /api/coe/map-locations` (backed by DB model).
- Acceptance: `/centre-of-excellence/map` primary dataset comes from API; static content is fallback only.

5. **Legacy ops demotion**
- Target: demote `scraped_services` and `data_sources` from primary ops metrics to compatibility indicators.
- Acceptance: admin dashboards label both as legacy/compat and do not imply canonical frontend authority.

## Sprint 1 Cycle 4 Deliverables

1. Approved canonical/supporting/legacy classification for priority runtime objects.
2. Approved owner/write-path policy per object.
3. Approved ALMA relation-table ownership rules.
4. Approved migration sequence for remaining legacy surfaces entering Sprint 2 backlog.
