# Sprint 1 Cycle 5: Gap Closure and Sprint 2 Backlog

Updated: 2026-02-15
Status: Draft for Sprint 1 sign-off

## Sprint 1 Closure Summary

Sprint 1 established the alignment baseline across:
- purpose (`Cycle 1`)
- page ownership (`Cycle 2`)
- API contract ownership (`Cycle 3`)
- data model ownership (`Cycle 4`)

Cycle 5 converts the remaining gaps into a deliverable Sprint 2 plan.

## Sprint 2 Execution Status (Live)

| Date | Item | Status | Notes |
|---|---|---|---|
| 2026-02-15 | G1 Program detail canonical migration | Complete | `/community-programs/[id]` now reads canonical `/api/programs/[id]` path. |
| 2026-02-15 | G2 Community map canonical programs source | Complete | `/community-map` now reads `/api/programs` instead of `/api/community-programs`. |
| 2026-02-15 | G3 Intelligence overview summary endpoint | Complete | `/intelligence/overview` now reads `/api/intelligence/overview-summary` and no longer fetches `/api/admin/*` endpoints. |

## Unresolved Gaps (Locked Inputs -> Implementation Required)

| Gap ID | Priority | Gap | Affected Surfaces | Owner | Source Cycle | Acceptance Target |
|---|---|---|---|---|---|---|
| G1 | P0 | Program detail page still reads direct `registered_services` | `/community-programs/[id]` | Programs domain | Cycle 2, 3, 4 | Detail page reads `GET /api/programs/[id]` only (plus profiles endpoint). |
| G2 | P0 | Community map still uses compat adapter for programs | `/community-map`, `/api/community-programs` | Programs + Service Discovery | Cycle 2, 3, 4 | `/community-map` reads `/api/programs`; compat adapter retained but not primary. |
| G3 | P0 | Intelligence overview mixes admin and intelligence APIs | `/intelligence/overview` | Intelligence + Platform Ops | Cycle 2, 3, 4 | New `/api/intelligence/overview-summary` replaces `/api/admin/*` dependencies for this page. |
| G4 | P1 | CoE map authority is static content file | `/centre-of-excellence/map` | CoE domain | Cycle 2, 3, 4 | New `/api/coe/map-locations` backed by DB; static file fallback only. |
| G5 | P1 | Legacy ops tables still appear as quasi-primary in dashboards | `/admin/data-operations` | Platform Ops | Cycle 3, 4 | `scraped_services` and `data_sources` explicitly labeled legacy/compat in API/UI. |
| G6 | P1 | Compatibility deprecation conditions not yet scheduled | `/api/community-programs`, `/api/scraped-services/[id]` | Platform Architecture | Cycle 3 | Time-bound deprecation policy approved with usage verification step. |
| G7 | P2 | ALMA relation-table write ownership not enforced in code-level guards | ALMA linking workflows | Intelligence | Cycle 4 | Write paths documented in code and constrained to declared owners. |

## Sprint 2 Backlog (Implementation Plan)

Sprint 2 window proposal: **March 2, 2026 -> March 13, 2026**

### Sprint 2 Week 1 (March 2-6, 2026)

1. **S2-1: Canonical program detail migration (G1)**
- Scope:
  - refactor `/community-programs/[id]` to call `/api/programs/[id]`
  - preserve existing UI sections and profile linking
- Acceptance:
  - no direct `registered_services` read in page runtime
  - parity snapshot for core program fields

2. **S2-2: Community map canonical programs source (G2)**
- Scope:
  - switch map program feed from `/api/community-programs` to `/api/programs`
  - preserve transform logic and dedupe semantics
- Acceptance:
  - pin count and card fields unchanged in smoke test
  - adapter remains backward compatible for external callers

3. **S2-3: Legacy adapter observability (G6 partial)**
- Scope:
  - add basic usage logging/metrics tags for `/api/community-programs` and `/api/scraped-services/[id]`
- Acceptance:
  - deprecation decision can be based on measured usage

### Sprint 2 Week 2 (March 9-13, 2026)

1. **S2-4: Intelligence overview summary endpoint (G3)**
- Scope:
  - implement `/api/intelligence/overview-summary`
  - migrate `/intelligence/overview` to this endpoint
- Acceptance:
  - page no longer fetches `/api/admin/data-operations/stats`, `/api/admin/funding/scrape`, `/api/admin/research/evidence`

2. **S2-5: CoE map API authority (G4)**
- Scope:
  - implement `/api/coe/map-locations`
  - define backing data model (table/view) and migration
  - update `/centre-of-excellence/map` to API-first loading
- Acceptance:
  - map works with API data; static file retained as resilience fallback only

3. **S2-6: Legacy ops demotion and labeling (G5)**
- Scope:
  - update admin ops sources/stats semantics
  - label `scraped_services` and `data_sources` as legacy/compat
- Acceptance:
  - admin copy + JSON contracts clearly indicate non-canonical status

4. **S2-7: Relation-table write guardrails (G7)**
- Scope:
  - add explicit ownership comments/guards in write endpoints/jobs
  - validate no unauthorized writers in active scripts
- Acceptance:
  - write-path audit passes for declared relation tables

## Compatibility Deprecation Timeline (Proposed)

| Date | Endpoint | Policy |
|---|---|---|
| March 2, 2026 | `/api/community-programs` | Begin compatibility telemetry collection. |
| March 2, 2026 | `/api/scraped-services/[id]` | Begin compatibility telemetry collection. |
| March 20, 2026 | Both endpoints | Review 2+ weeks telemetry; decide retain vs staged deprecation notice. |
| April 1, 2026 | `/api/community-programs` | If map migration complete and usage acceptable, publish deprecation notice (no removal yet). |
| April 1, 2026 | `/api/scraped-services/[id]` | If external dependency low, publish deprecation notice (no removal yet). |

## Sprint 1 Sign-off Checklist (Production-Hardening Readiness)

- Purpose, page, API, and data ownership docs approved.
- Every priority page mapped to canonical owner (or approved compat/legacy rationale).
- Every priority endpoint has stability class and breaking-change rule.
- Canonical/supporting/legacy data object matrix approved.
- Sprint 2 backlog includes owner + acceptance criteria for all unresolved P0/P1 gaps.
- Runtime schema audit and security key checks stay in per-cycle validation baseline.

## Recommended Sprint 1 Sign-off Decision

- **Sign off Sprint 1 as "Alignment Complete, Implementation Pending"** once Cycle 5 review gate is approved.
- Enter Sprint 2 with P0 execution focus on G1-G3 before additional feature expansion.
