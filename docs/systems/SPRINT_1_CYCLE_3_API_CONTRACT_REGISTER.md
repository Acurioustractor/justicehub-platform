# Sprint 1 Cycle 3: API Contract Register

Updated: 2026-02-15
Status: Draft for review gate

## Contract Levels

- `stable`: public contract for user-facing pages. Additive changes only; removals/renames require new endpoint version or compatibility alias.
- `compat`: transitional/adapter contract. Existing fields must be preserved until migration is complete.
- `internal`: app-internal/admin contract. Changes allowed if all consuming pages are updated in the same cycle.

## Endpoint Contracts (Priority Scope)

| Endpoint | Primary Consuming Pages | Stability | Required Response Contract | Canonical Source | Breaking-Change Policy |
|---|---|---|---|---|---|
| `GET /api/services` | `/services`, `/community-map` | `stable` | `{ success, data[], pagination }` | `services_complete` view | Add-only fields; keep `data` + `pagination` keys stable. |
| `GET /api/services/[id]` | `/services/[id]` | `stable` | `{ service, metadata }` where `service.id,name,description,location,contact,contactInfo` exist | `services_complete` via `getServiceDetailResult` | Preserve current payload shape; any rename requires new versioned route. |
| `GET /api/services/[id]/profiles` | `/services/[id]` | `stable` | `{ profiles[], count }` | profile-linking integration layer | Keep `profiles` array and `count` for page rendering. |
| `GET /api/scraped-services/[id]` | legacy consumers | `compat` | Same as `/api/services/[id]` | alias to canonical service detail | Keep alias response identical until explicit deprecation cycle. |
| `GET /api/programs` | canonical program clients | `stable` | `{ success, programs[], pagination }` | `programs_catalog_v` | Add-only; keep filter params and top-level keys stable. |
| `GET /api/programs/[id]` | target for `/community-programs/[id]` migration | `stable` | `{ success, program }` | `programs_catalog_v` | Preserve `program` object shape; new fields additive only. |
| `GET /api/programs/[id]/profiles` | `/community-programs/[id]` | `stable` | `{ profiles[], count }` | profile-linking integration layer | Keep payload stable for card rendering. |
| `GET /api/community-programs` | `/community-map` (compat path) | `compat` | `{ success, programs[] }` and `program.organization` alias field | adapter over `programs_catalog_v` | Preserve adapter fields until `/community-map` moves to `/api/programs`. |
| `GET /api/basecamps` | `/centre-of-excellence`, `/for-community-leaders`, `/for-funders` | `stable` | `[{ slug, name, region, description, coordinates, image, stats[] }]` | `organizations` + `partner_photos` + `partner_impact_metrics` | Preserve array item keys used by all 3 pages. |
| `GET /api/international-programs` | `/centre-of-excellence/global-insights` | `stable` | paged list with existing list fields | `international_programs` | Keep query params and list keys backward compatible. |
| `GET /api/intelligence/interventions` | `/intelligence/overview` | `stable` | `{ data[], count, limit, offset }` | wrapper delegating to `/api/alma/interventions` | Keep wrapper contract frozen for overview/dashboard usage. |
| `GET /api/alma/interventions` | intelligence API backbone | `internal` | `{ data[], count, limit, offset }` | ALMA service layer on `alma_interventions` (+ optional scores) | Can evolve internally; wrapper contract must remain stable. |
| `GET /api/intelligence/map-locations` | `/intelligence/map` | `stable` | `{ locations[], stats }` | `alma_interventions` + `services` | Keep `locations` and `stats.byCategory` keys stable. |
| `GET /api/intelligence/global-stats` | `/intelligence/dashboard` | `internal` | `{ cortex, senses, conscience, health }` | ALMA aggregate table queries | Internal evolution allowed with dashboard update in same cycle. |
| `GET /api/intelligence/alpha-signals` | `/intelligence/dashboard` | `internal` | `{ opportunities[] }` | ALMA intervention-derived scoring | Internal, but preserve `opportunities[]` list for dashboard card logic. |
| `GET /api/intelligence/system-status` | `/intelligence/status` | `internal` | `{ stats, sources[] }` | `alma_interventions` + `alma_discovered_links` | Internal change allowed with synchronized UI update. |
| `GET /api/intelligence/research` | `/intelligence/research` | `internal` | `GET: { sessions[] }`, `POST: { sessionId, status, ... }` | `alma_research_sessions` + RPCs | Internal iterative contract; maintain current polling keys. |
| `GET /api/intelligence/research/[sessionId]` | `/intelligence/research` polling | `internal` | `{ session, findings[], toolLogs[] }` | `alma_research_sessions` + findings/log tables | Preserve core polling keys for current client flow. |
| `GET /api/admin/data-operations/stats` | `/admin/data-operations`, `/intelligence/overview` | `internal` | `{ totals, byState, byOrgType, ... }` | `services`, `organizations`, `registered_services`, ALMA tables | Internal; if changed, update both consuming pages in same release. |
| `GET /api/admin/data-operations/sources` | `/admin/data-operations` | `internal` | `{ sources[], pagination, types[] }` | multi-table source classification | Internal; preserve canonical `type` taxonomy (`directory`, `programs`, `alma`, `sync`). |
| `GET /api/admin/data-operations/alerts` | `/admin/data-operations` | `internal` | `{ alerts[], summary }` | health checks across ops tables | Internal; keep severity ordering and summary keys. |
| `GET /api/admin/data-operations/timeline` | `/admin/data-operations` | `internal` | timeline list + summary (existing shape) | ops/event tables | Internal; page and endpoint must change together. |
| `GET /api/admin/data-health` | `/admin/data-health` | `internal` | `{ tables[], summary, lastScrapeJob, generatedAt }` | typed `TRACKED_TABLES` queries | Internal; keep `tables` and `summary` stable for dashboard widgets. |
| `GET /api/admin/research/evidence` | `/intelligence/overview` | `internal` | evidence list payload (existing shape) | `alma_evidence` (+ metadata) | Internal dependency; should move behind dedicated intelligence summary API in later cycle. |
| `GET /api/admin/funding/scrape` | `/intelligence/overview`, `/admin/funding` | `internal` | scrape stats payload (existing shape) | ALMA funding tables/jobs | Internal; align with dedicated intelligence summary API later. |

## Page -> API Ownership Map (Cycle 3 Priority Set)

| Page | Current Runtime Path | Canonical API Owner | Status |
|---|---|---|---|
| `/services` | `/api/services` | Services domain | aligned |
| `/services/[id]` | `/api/services/[id]` + `/api/services/[id]/profiles` | Services domain | aligned |
| `/community-programs` | direct `programs_catalog_v` read | Programs domain (`/api/programs`) | aligned with canonical model, API optional |
| `/community-programs/[id]` | direct `registered_services` + `/api/programs/[id]/profiles` | Programs domain (`/api/programs/[id]`) | drift (migration required) |
| `/community-map` | `/api/services` + `/api/community-programs` | Services + Programs | compat (adapter still in use) |
| `/intelligence/overview` | `/api/admin/data-operations/stats`, `/api/admin/funding/scrape`, `/api/intelligence/interventions`, `/api/admin/research/evidence` | Intelligence + Ops | compat (cross-domain dependency) |
| `/intelligence/map` | `/api/intelligence/map-locations` | Intelligence domain | aligned |
| `/intelligence/dashboard` | `/api/intelligence/global-stats`, `/api/intelligence/alpha-signals` | Intelligence domain | aligned |
| `/intelligence/status` | `/api/intelligence/system-status` | Intelligence domain | aligned |
| `/intelligence/research` | `/api/intelligence/research`, `/api/intelligence/research/[sessionId]` | Intelligence domain | aligned |
| `/centre-of-excellence` | `/api/basecamps` | CoE domain | aligned |
| `/for-community-leaders` | `/api/basecamps` | CoE domain | aligned |
| `/for-funders` | `/api/basecamps` | CoE domain | aligned |
| `/centre-of-excellence/global-insights` | `/api/international-programs` | CoE domain | aligned |
| `/centre-of-excellence/map` | static `src/content/excellence-map-locations.ts` | CoE domain (`/api/coe/map-locations` target) | legacy surface |
| `/admin/data-operations` | `/api/admin/data-operations/*` | Platform Ops | aligned |
| `/admin/data-health` | `/api/admin/data-health` | Platform Ops | aligned |

## Known Contract Gaps To Close

1. Migrate `/community-programs/[id]` to `GET /api/programs/[id]` so list/detail share one model.
2. Move `/community-map` from `GET /api/community-programs` adapter to `GET /api/programs` when card fields are fully compatible.
3. Introduce `GET /api/intelligence/overview-summary` so `/intelligence/overview` no longer depends on admin endpoints.
4. Add `GET /api/coe/map-locations` to replace static authority in `/centre-of-excellence/map`.

## Merge Gate Rules (Cycle 3)

1. Any endpoint marked `stable` must keep existing top-level keys and primary list/detail key names.
2. Any `compat` endpoint must include explicit migration target and removal condition.
3. Any page marked `aligned` must reference one canonical API owner (or a canonical direct model by design).
4. Any new frontend page in these route families must declare endpoint stability level before merge.
