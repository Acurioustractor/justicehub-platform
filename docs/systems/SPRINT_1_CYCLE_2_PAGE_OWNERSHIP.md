# Sprint 1 Cycle 2: Page Ownership Register

Updated: 2026-02-15
Status: Draft for review gate

## Label Definitions

- `canonical`: page reads through approved canonical API/model for its domain.
- `compatibility`: page is intentionally using adapter or transitional path; still supported.
- `legacy surface`: page uses non-canonical/static/direct path that should be migrated.

## Priority Page Ownership (Cycle 2 Scope)

| Route | Domain Owner | Label | Current Data Path | Target Canonical Path | Action |
|---|---|---|---|---|---|
| `/services` | Service Discovery | canonical | `fetch('/api/services')` | `/api/services` -> `services_complete` | Keep |
| `/services/[id]` | Service Discovery | canonical | `fetch('/api/services/[id]')` + `/profiles` | `/api/services/[id]` + `/api/services/[id]/profiles` | Keep |
| `/community-programs` | Programs and CoE | canonical | server read `programs_catalog_v` | `programs_catalog_v` (or `/api/programs`) | Keep |
| `/community-programs/[id]` | Programs and CoE | legacy surface | direct `registered_services` client read | `/api/programs/[id]` -> `programs_catalog_v` | Migrate detail page |
| `/community-map` | Service Discovery + Programs | compatibility | `/api/services` + `/api/community-programs` | `/api/services` + `/api/programs` (retain adapter) | Add optional `/api/programs` mode |
| `/intelligence` | Intelligence | canonical | direct `alma_*` reads | ALMA canonical entities + link tables | Keep |
| `/intelligence/overview` | Intelligence + Ops | compatibility | uses admin APIs + intelligence API blend | dedicated intelligence summary API | Create `/api/intelligence/overview-summary` |
| `/intelligence/interventions` | Intelligence | canonical | direct `alma_interventions` + link tables | same | Keep |
| `/intelligence/interventions/[id]` | Intelligence | canonical | ALMA + `alma_intervention_*` join tables | same | Keep |
| `/intelligence/evidence` | Intelligence | canonical | direct `alma_evidence` | same | Keep |
| `/intelligence/evidence/[id]` | Intelligence | canonical | `alma_evidence` + `alma_intervention_evidence` | same | Keep |
| `/intelligence/programs/[id]` | Intelligence | compatibility | intervention-centric detail route using ALMA | standardize naming or alias policy | Decide route naming policy |
| `/intelligence/map` | Intelligence | canonical | `/api/intelligence/map-locations` | same | Keep |
| `/intelligence/research` | Intelligence | canonical | `/api/intelligence/research` | same | Keep |
| `/intelligence/dashboard` | Intelligence | canonical | `/api/intelligence/global-stats`, `/api/intelligence/alpha-signals` | same | Keep |
| `/intelligence/status` | Intelligence + Ops | canonical | `/api/intelligence/system-status` | same | Keep |
| `/intelligence/funding` | Intelligence Funding | canonical | direct `alma_funding_*` reads | canonical funding APIs/tables | Keep |
| `/centre-of-excellence` | CoE | compatibility | `/api/basecamps` + fallback array merge | `/api/basecamps` only + resilience fallback | Keep API, reduce fallback authority |
| `/centre-of-excellence/map` | CoE | legacy surface | static `src/content/excellence-map-locations.ts` | API-backed CoE map datasets | Add `/api/coe/map-locations` |
| `/centre-of-excellence/research` | CoE | canonical | direct `research_items` read | `research_items` | Keep |
| `/centre-of-excellence/people` | CoE | canonical | direct `coe_key_people` read | `coe_key_people` | Keep |
| `/centre-of-excellence/best-practice` | CoE | canonical | direct `australian_frameworks` read | `australian_frameworks` | Keep |
| `/centre-of-excellence/global-insights` | CoE | canonical | `/api/international-programs` | `international_programs` via API | Keep |
| `/for-community-leaders` | CoE + Partnerships | compatibility | `/api/basecamps` + fallback array | `/api/basecamps` | Keep API, fallback resilience-only |
| `/for-funders` | CoE + Partnerships | compatibility | `/api/basecamps` + fallback array | `/api/basecamps` | Keep API, fallback resilience-only |
| `/admin/data-operations` | Platform Ops | canonical | `/api/admin/data-operations/*` | same | Keep |
| `/admin/data-health` | Platform Ops | canonical | `/api/admin/data-health` | same | Keep |

## Ownership Summary

- Total priority pages: **27**
- `canonical`: **19**
- `compatibility`: **6**
- `legacy surface`: **2**

## Cycle 2 Gap Backlog (Page Ownership)

1. Migrate `/community-programs/[id]` to canonical programs detail API.
2. Introduce CoE map API model and retire static map dataset authority.
3. Add a dedicated intelligence overview summary API to reduce admin API coupling.
4. Standardize policy for `/intelligence/programs/[id]` naming vs intervention semantics.
5. Keep Basecamp fallbacks as resilience-only, and add consistency checks against `/api/basecamps`.

## Merge and Alignment Checks for Cycle 2

1. Any page label change must include reason and owner sign-off.
2. Any page marked `canonical` must identify exact canonical API/view/table path.
3. Any `compatibility` surface must include explicit deprecation or retention rationale.
4. Any `legacy surface` must have a scheduled migration target and acceptance criteria.

