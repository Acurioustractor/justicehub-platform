# JusticeHub Core Goal and Alignment Map

Date: 2026-02-14
Status: Canonical working reference for product, data, frontend, and scraper decisions.

## Canonical Core Goal

JusticeHub exists to help shift Australian youth justice investment and practice from detention to community-led alternatives by making trusted evidence, lived experience, and service pathways visible, usable, and actionable, while preserving community authority and cultural/data sovereignty.

## Non-Negotiables

1. Community authority comes first.
2. Evidence is for learning and advocacy, never surveillance.
3. No youth profiling, no individual risk scoring, no ranking communities.
4. Consent scope and cultural protocol boundaries are enforced at runtime.
5. Infrastructure is designed for community ownership and handover.

## Product Pillars

1. Evidence Proof: Demonstrate, with credible evidence, that community-based youth justice outperforms detention.
2. Pathways to Support: Help people find and access programs and services quickly and safely.
3. Advocacy Infrastructure: Turn evidence into usable materials for policy, funding, and public action.
4. Sovereignty and Trust: Preserve consent, attribution, and community control over knowledge.
5. Operational Integrity: Keep data contracts stable, observable, and maintainable.

## Canonical Data Contract Intent

1. Services Contract
- Canonical read model: `services_complete` (source: `services` + `organizations`; optional `service_locations` and `service_contacts` arrays).
- Primary UX: `/services`, `/services/[id]`, `/community-map`.
- Compatibility: `/api/scraped-services/[id]` aliases canonical service detail.

2. Programs Contract
- Canonical read model: `programs_catalog_v` (source: `registered_services` + optional `organizations` and `alma_interventions` enrichment).
- Primary UX: `/community-programs`, `/community-programs/[id]`.
- Compatibility: `/api/community-programs` is an adapter over canonical programs.

3. Intelligence Contract
- Canonical entities: `alma_interventions`, `alma_evidence`, `alma_outcomes`, `alma_community_contexts`, plus join tables (`alma_intervention_*`).
- Primary UX: `/intelligence/*` and `/youth-justice-report/*`.

4. Story and Profile Contract
- Identity and narrative context: `public_profiles`, `stories`, `profile_appearances`, plus Empathy Ledger linked IDs and consent.

5. Admin and Ops Contract
- Data operations, health, queue, and feed visibility over core tables; no references to phantom columns/tables.

## Major Route Alignment Map

| Route | Primary Purpose | Pillar | Data Contract | Alignment |
|---|---|---|---|---|
| `/` | Entry narrative + directional CTAs | 2,3 | Aggregated stats/content APIs | Partial |
| `/services` | Discover support services | 2 | `services_complete` | Aligned |
| `/services/[id]` | Service detail + profile context | 2,4 | `services_complete` + `profile_appearances` | Aligned |
| `/community-programs` | Curated program discovery | 1,2 | `programs_catalog_v` | Aligned |
| `/community-programs/[id]` | Program detail + evidence context | 1,2,4 | Should be `programs_catalog_v` | Partial (still direct `registered_services`) |
| `/community-map` | Spatial access to supports/programs | 2 | `/api/services` + `/api/community-programs` | Aligned |
| `/intelligence` | ALMA landing and evidence framing | 1,3 | `alma_*` aggregates | Aligned |
| `/intelligence/interventions` | Intervention browse/filter | 1 | `alma_interventions` + join tables | Aligned |
| `/intelligence/interventions/[id]` | Intervention detail deep dive | 1,3 | `alma_interventions` + join tables | Misaligned (query path issues) |
| `/intelligence/evidence` | Evidence browsing | 1 | `alma_evidence` | Aligned |
| `/intelligence/evidence/[id]` | Evidence detail | 1 | `alma_evidence` + links | Partial |
| `/intelligence/portfolio` | Portfolio comparison | 1,3 | `alma_interventions` + portfolio logic | Aligned |
| `/intelligence/overview` | Decision dashboard | 1,3,5 | Admin/data + intelligence APIs | Misaligned (missing API dependency) |
| `/youth-justice-report` | Public policy/evidence narrative | 1,3 | ALMA + curated report content | Aligned |
| `/stories` | Lived experience and narrative | 1,4 | `stories`/content tables | Aligned |
| `/organizations` | Organization discovery and trust | 2,4 | `organizations` | Aligned |
| `/people` | Leadership/practitioner visibility | 4 | `public_profiles` + links | Aligned |
| `/admin/data-operations` | Pipeline and data source observability | 5 | `services`, `registered_services`, `alma_*`, `data_sources` | Aligned |
| `/admin/data-health` | Runtime freshness and risk checks | 5 | tracked table checks | Aligned |
| `/admin/research` | Research evidence curation | 1,5 | `alma_evidence` | Aligned |
| `/admin/funding` | Funding opportunities and ops | 3,5 | `alma_funding_*` | Aligned |

## Major API Alignment Map

| API Route | Purpose | Pillar | Canonical Source | Alignment |
|---|---|---|---|---|
| `/api/services` | Service list for frontend | 2 | `services_complete` | Aligned |
| `/api/services/[id]` | Canonical service detail | 2 | `services_complete` | Aligned |
| `/api/services/[id]/profiles` | People connected to service | 4 | `profile_appearances` + EL links | Aligned |
| `/api/services/search` | Service search | 2 | `services_complete` | Aligned |
| `/api/programs` | Canonical programs list | 1,2 | `programs_catalog_v` | Aligned |
| `/api/programs/[id]` | Canonical program detail | 1,2 | `programs_catalog_v` | Aligned |
| `/api/programs/[id]/profiles` | People connected to program | 4 | `profile_appearances` + EL links | Aligned |
| `/api/community-programs` | Backward compatible program list | 2,5 | `programs_catalog_v` adapter | Aligned |
| `/api/scraped-services/[id]` | Backward compatible service detail alias | 2,5 | Delegates to canonical service detail | Aligned |
| `/api/scraped-services` | Legacy scraped staging list | 5 | `scraped_services` | Legacy (non-canonical) |
| `/api/alma/interventions` | Intervention index | 1 | `alma_interventions` | Aligned |
| `/api/alma/interventions/[id]` | Intervention detail | 1 | `alma_interventions` | Aligned |
| `/api/alma/portfolio` | Portfolio analytics | 1,3 | `alma_interventions` + scoring logic | Aligned |
| `/api/admin/data-operations/stats` | Core operational counts | 5 | core runtime tables | Aligned |
| `/api/admin/data-operations/alerts` | Data quality and queue alerts | 5 | core runtime tables | Aligned |
| `/api/admin/data-operations/sources` | Source inventory | 5 | core runtime tables | Aligned |
| `/api/admin/data-operations/feeds` | Feed-level operational lens | 5 | core runtime + legacy feeds | Aligned |
| `/api/admin/data-operations/queue` | ALMA queue management | 5 | `alma_discovered_links` | Aligned |
| `/api/admin/data-operations/scrape` | ALMA scrape ingest | 1,5 | `alma_discovered_links`, `alma_interventions`, `alma_scrape_history` | Aligned |
| `/api/admin/data-health` | Health score by tracked table | 5 | typed tracked tables | Aligned |
| `/api/admin/research/evidence` | Evidence curation CRUD | 1,5 | `alma_evidence` | Aligned |
| `/api/intelligence/*` | Intelligence support APIs | 1,3,5 | `alma_*` and derived signals | Partial (missing interventions endpoint) |

## Scraper Alignment to Core Goal

### Directory Pipeline

- Current write path: `organizations` + `services`.
- Strength: directly powers support discovery surfaces.
- Gap: does not populate `service_locations`/`service_contacts`, reducing detail richness and map fidelity.
- Goal alignment: strong to Pillar 2, moderate to Pillar 5.

### ALMA Pipeline

- Current write path: `alma_discovered_links` -> `alma_interventions` + `alma_scrape_history`.
- Strength: adds evidence/intelligence content for Pillar 1 and 3.
- Gap: some downstream pages still query ALMA relations via outdated column assumptions.
- Goal alignment: strong to Pillar 1, moderate to Pillar 5 until query-path fixes are complete.

### Legacy Scraped Services Path

- `scraped_services` remains staging/legacy.
- Should not drive primary public service detail UX.
- Keep only for compatibility and operational backfills.

## Misalignment Backlog (to reach full goal alignment)

1. Fix intelligence detail query paths to use ALMA join tables where required.
2. Add missing `/api/intelligence/interventions` (or update frontend to existing endpoint).
3. Move `/community-programs/[id]` reads to canonical programs model.
4. Standardize scraper/import env vars to runtime canonical env names.
5. Populate `service_locations` and `service_contacts` in directory scraper flow.
6. Upgrade scraper dedupe strategy beyond name-only matching.
7. Update legacy docs still referencing `community_programs` as active canonical source.

## Decision Rule for Future Changes

A change is approved only if it:

1. Strengthens community-led diversion evidence, or
2. Improves practical path-to-support access, or
3. Improves advocacy-grade translation of evidence, and
4. Preserves consent/cultural authority safeguards, and
5. Reduces runtime/schema ambiguity.

If any change fails 4 or 5, it is out-of-policy and should not ship.
