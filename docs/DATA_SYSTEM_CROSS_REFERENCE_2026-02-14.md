# JusticeHub Data System Cross-Reference (2026-02-14)

## Scope
- Focused on runtime data surfaces used by core frontend/public/admin routes for services, programs, ALMA intelligence, and data operations.
- Live schema snapshot date: 2026-02-14.
- Public schema table count (all domains): 472.
- Runtime simplification contract relations (core): 12 tables + 2 views.

## 1) Core Runtime Tables and Views

### Tables (core runtime contract)
- services (508)
- organizations (507+ linked from services)
- registered_services (12)
- profiles
- stories
- alma_evidence
- alma_interventions (1072)
- alma_discovered_links
- alma_ingestion_jobs
- alma_scrape_history
- data_sources
- scraped_services (6)

### Views (canonical read models)
- services_complete (508)
- programs_catalog_v (12)

## 2) Canonical Read Models

### services_complete
- Source: `services` LEFT JOIN `organizations`, plus embedded arrays from `service_locations` and `service_contacts`.
- Purpose: normalized service payload for frontend list/detail.
- Columns used by runtime: id, name, description, categories, location, location_latitude, location_longitude, contact, score, active, indigenous_specific, youth_specific, last_scraped_at, updated_at, url.

### programs_catalog_v
- Source: `registered_services` LEFT JOIN `organizations` + lateral pick from `alma_interventions` (by `alma_intervention_id` or `linked_community_program_id`).
- Purpose: canonical program payload for `/community-programs` and `/api/programs`.
- Columns used by runtime: id, name, description, organization_id, organization_name, state, location, approach, impact_summary, tags, latitude, longitude, alma_intervention_id, linked_service_id, is_featured, created_at, updated_at.

## 3) Live FK Link Graph (Core Domain)

### Primary entity links
- services.organization_id -> organizations.id
- services.alma_intervention_id -> alma_interventions.id
- services.parent_service_id -> services.id
- registered_services.organization_id -> organizations.id
- registered_services.service_id -> services.id
- registered_services.linked_service_id -> services.id
- registered_services.alma_intervention_id -> alma_interventions.id
- scraped_services.organization_id -> organizations.id
- alma_interventions.operating_organization_id -> organizations.id
- alma_interventions.linked_service_id -> services.id
- alma_interventions.linked_community_program_id -> registered_services.id

### Supporting relationship links
- service_locations.service_id -> services.id
- service_contacts.service_id -> services.id
- registered_services_profiles.program_id -> registered_services.id
- services_profiles.service_id -> services.id
- article_related_interventions.intervention_id -> alma_interventions.id
- story_related_interventions.intervention_id -> alma_interventions.id
- article_related_programs.program_id -> registered_services.id
- story_related_programs.program_id -> registered_services.id
- article_related_services.service_id -> services.id
- story_related_services.service_id -> services.id
- alma_intervention_evidence.intervention_id -> alma_interventions.id
- alma_intervention_evidence.evidence_id -> alma_evidence.id
- alma_intervention_outcomes.intervention_id -> alma_interventions.id
- alma_intervention_outcomes.outcome_id -> alma_outcomes.id
- alma_intervention_contexts.intervention_id -> alma_interventions.id
- alma_intervention_contexts.context_id -> alma_community_contexts.id

## 4) Frontend Route -> API/DB -> Table/View Cross-Reference

### Services surfaces
- `/services`
  - Calls `/api/services?limit=1000`
  - API reads `services_complete`
  - Canonical DB source: `services` + `organizations` (+ optional `service_locations`, `service_contacts` in view)
- `/services/[id]`
  - Calls `/api/services/[id]` and `/api/services/[id]/profiles`
  - Detail API reads `services_complete` (via shared helper)
  - Profiles API reads `profile_appearances` (and Empathy Ledger profiles/stories)
- `/community-map`
  - Calls `/api/services?limit=600` + `/api/community-programs?limit=100`
  - Blends `services_complete` + `programs_catalog_v` into map pins

### Programs surfaces
- `/community-programs`
  - Server-side reads `programs_catalog_v` directly
- `/api/programs`
  - Reads `programs_catalog_v`
- `/api/programs/[id]`
  - Reads `programs_catalog_v`
- `/api/community-programs` (compat adapter)
  - Reads `programs_catalog_v` and returns legacy `organization` alias
- `/community-programs/[id]`
  - Reads `registered_services` directly (not canonical view)
  - Also fetches `/api/programs/[id]/profiles`

### Service compatibility surfaces
- `/api/scraped-services/[id]`
  - Alias wrapper to canonical `services_complete` detail response
- `/api/scraped-services` (list)
  - Reads `scraped_services` legacy staging table directly

### ALMA intelligence surfaces
- `/intelligence`
  - Reads `alma_interventions`, `alma_evidence`, `alma_outcomes`, `alma_community_contexts`
- `/intelligence/interventions`
  - Reads `alma_interventions` + filter lookups via `alma_intervention_outcomes`, `alma_outcomes`, `alma_intervention_contexts`, `alma_community_contexts`
- `/intelligence/interventions/[id]`
  - Reads `alma_interventions`
  - Attempts to read `alma_evidence`, `alma_outcomes`, `alma_community_contexts` by `intervention_id` (schema mismatch; see findings)
- `/intelligence/programs/[id]`
  - Reads `alma_interventions`, relationship tables, and attempts direct `alma_evidence.contains('related_interventions', [id])` (schema mismatch; see findings)
- `/intelligence/overview`
  - Calls `/api/admin/data-operations/stats`, `/api/admin/funding/scrape`, `/api/admin/research/evidence`
  - Also calls `/api/intelligence/interventions` (route missing; see findings)

### Admin data ops surfaces
- `/admin/data-operations`
  - Calls `/api/admin/data-operations/stats|sources|alerts|timeline`
  - Stats/sources/alerts read: `services`, `organizations`, `registered_services`, `profiles`, `stories`, `alma_*`, `scraped_services`, `data_sources`
- `/admin/data-health`
  - Calls `/api/admin/data-health`
  - Scans tracked tables for count/freshness and latest ingestion job

## 5) Scraper Pipelines -> Write Targets -> Frontend Consumers

### Directory pipeline (active)
- Entry points:
  - `src/scripts/scrape-qld-services.ts`
  - `src/scripts/scrape-qld-services-batch.ts`
- Writes:
  - `organizations` (create-if-missing)
  - `services` (insert)
- Does not currently write:
  - `service_locations`
  - `service_contacts`
- Frontend consumers:
  - `/api/services` -> `services_complete` -> `/services`, `/community-map`
  - `/api/services/[id]` -> `services_complete` -> `/services/[id]`

### ALMA pipeline (active)
- Entry point:
  - `/api/admin/data-operations/scrape`
- Writes:
  - `alma_discovered_links` (queue statuses)
  - `alma_interventions` (new extracted interventions)
  - `alma_scrape_history` (audit/history)
- Frontend consumers:
  - ALMA intelligence pages (`/intelligence*`) via `alma_interventions` and related tables

### Legacy staging pipeline (non-canonical)
- Endpoint:
  - `/api/scraped-services` (list)
- Reads:
  - `scraped_services`
- Note:
  - Not primary source for service detail or service finder UX

## 6) Live Alignment Snapshot
- services_total: 508
- services_complete_rows: 508
- services_with_org_id: 507
- services_with_state: 502
- services_with_coords: 501
- service_locations_total: 0
- service_contacts_total: 0
- registered_services_total: 12
- programs_catalog_rows: 12
- registered_services_with_org_id: 6
- registered_services_with_alma_link: 3
- alma_interventions_total: 1072
- alma_interventions_linked_service_id: 490
- alma_interventions_linked_program_id: 3
- scraped_services_total: 6

## 7) Review Findings (Scraper + Frontend/Data Alignment)

### [P1] Directory scraper env contract is inconsistent with runtime env standard
- Files:
  - `src/scripts/scrape-qld-services.ts`
  - `src/scripts/scrape-qld-services-batch.ts`
  - `src/lib/service-importer.ts`
- Issue:
  - Scripts require `SUPABASE_URL` while runtime standard is `NEXT_PUBLIC_SUPABASE_URL`; this can cause scraper/import failures in environments that only define canonical vars.
- Impact:
  - Directory pipeline may fail to ingest services even when app runtime works.

### [P1] Intelligence overview calls a non-existent API route
- File: `src/app/intelligence/overview/page.tsx`
- Issue:
  - Calls `/api/intelligence/interventions`, but no corresponding route exists under `src/app/api/intelligence/interventions/`.
- Impact:
  - Intervention chart block is silently empty/stale.

### [P1] Intervention detail page queries non-existent foreign-key columns on ALMA entity tables
- File: `src/app/intelligence/interventions/[id]/page.tsx`
- Issue:
  - Queries `alma_evidence`, `alma_outcomes`, `alma_community_contexts` with `.eq('intervention_id', ...)`, but these tables do not have `intervention_id` columns.
  - Correct relationship path is via link tables (`alma_intervention_evidence`, `alma_intervention_outcomes`, `alma_intervention_contexts`).
- Impact:
  - Evidence/outcomes/context sections can fail or return empty despite linked records existing.

### [P1] Program-intelligence detail page uses missing alma_evidence fields
- File: `src/app/intelligence/programs/[id]/page.tsx`
- Issue:
  - Selects `source_title` and filters `related_interventions` on `alma_evidence`, but these columns do not exist.
- Impact:
  - Related evidence queries are invalid and page data is incomplete.

### [P2] Community program detail page bypasses canonical programs model
- File: `src/app/community-programs/[id]/page.tsx`
- Issue:
  - Reads `registered_services` directly while list and APIs use `programs_catalog_v`.
- Impact:
  - Detail page can drift from canonical list/API behavior and miss ALMA/org-enriched fallback fields.

### [P2] Directory pipeline does not populate normalized location/contact child tables
- Files:
  - `src/scripts/scrape-qld-services.ts`
  - `src/scripts/scrape-qld-services-batch.ts`
- Issue:
  - Writes only `services` + `organizations`; `service_locations` and `service_contacts` remain empty.
- Impact:
  - `services_complete.locations` and `services_complete.contacts` arrays are never populated, reducing map/detail richness.

### [P3] Batch dedupe is weak and may allow duplicate service rows
- File: `src/scripts/scrape-qld-services-batch.ts`
- Issue:
  - Duplicate check uses only `ilike(name)` and ignores organization/state/source URL.
- Impact:
  - Potential duplicate growth in `services` over time.

## 8) Recommended Next Fix Order
1. Fix P1 route/schema mismatches in intelligence pages.
2. Standardize scraper/import env vars to canonical runtime vars.
3. Switch `/community-programs/[id]` to canonical `/api/programs/[id]` or direct `programs_catalog_v`.
4. Extend directory scraper writes into `service_locations` and `service_contacts`.
5. Strengthen dedupe keys in batch scraper (name + org + source URL hash).
