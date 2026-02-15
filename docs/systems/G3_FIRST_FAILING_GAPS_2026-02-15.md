# G3 First Failing Gaps (Priority Register)

Updated: 2026-02-15
Scope: runtime alignment gaps that block a clean page->API->DB->pipeline model

## Priority rubric
- `P0`: causes model fragmentation or reliability risk on core user journeys
- `P1`: causes ongoing drift/ambiguity but with lower immediate break risk
- `P2`: technical debt to schedule after P0/P1 closure

## P0 gaps (fix first)

| Gap ID | Problem | Evidence | Impact | Required fix | Acceptance check |
|---|---|---|---|---|---|
| `G3-P0-1` | Intelligence list/detail pages bypass APIs and read DB directly in page runtime. | `src/app/intelligence/interventions/page.tsx`, `src/app/intelligence/interventions/[id]/page.tsx`, `src/app/intelligence/evidence/page.tsx`, `src/app/intelligence/evidence/[id]/page.tsx` | No single contract surface; harder schema control; frontend can break on DB drift. | Introduce/extend intelligence read APIs (`/api/intelligence/interventions`, `/api/intelligence/evidence`, detail endpoints) and migrate pages to fetch APIs only. | No direct `.from('alma_*')` calls remain in those page files; pages render using API responses only. |
| `G3-P0-2` | CoE map uses static content authority instead of DB/API model. | `src/app/centre-of-excellence/map/page.tsx` imports `src/content/excellence-map-locations`. | CoE data governance disconnected from live DB workflows. | Create API authority (e.g. `/api/coe/map-locations`) backed by DB tables/views; keep static as emergency fallback only. | Primary map load path is API data; fallback is only used on API failure. |
| `G3-P0-3` | Legacy `scraped_services` list endpoint still presents as active service feed. | `src/app/api/scraped-services/route.ts` reads `scraped_services` directly. | Competes with canonical service model and can reintroduce semantic confusion. | Keep endpoint for compatibility but mark/return explicit legacy metadata and remove from primary frontend usage. | No primary frontend route consumes `/api/scraped-services` list; endpoint response includes legacy flag. |
| `G3-P0-4` | Program detail is still dual-source at API level. | `src/app/api/programs/[id]/route.ts` reads `programs_catalog_v` then supplements from `registered_services`. | Detail contract is not yet single-source canonical. | Move supplemental fields into canonical read model (view or companion view) so detail endpoint can read one model. | `/api/programs/[id]` resolves detail fields from one canonical object path. |

## P1 gaps (next)

| Gap ID | Problem | Evidence | Impact | Required fix | Acceptance check |
|---|---|---|---|---|---|
| `G3-P1-1` | Homepage and stories experience still mixes multiple authorities and fallback behavior. | `src/app/page.tsx`, `src/components/EmpathyLedgerStories.tsx`, `src/app/stories/page.tsx` | Inconsistent compendium narrative (articles-only stories page vs empathy-ledger cards on home). | Define one stories authority policy (articles-first, empathy-first, or blended API) and enforce through one story feed contract. | Home + `/stories` align on declared story model and metadata. |
| `G3-P1-2` | Intelligence metric APIs include heuristic/demo logic that is not clearly marked as provisional. | `src/app/api/intelligence/global-stats/route.ts`, `src/app/api/intelligence/alpha-signals/route.ts` | Signals risk being interpreted as production-grade when partly inferred. | Add explicit contract metadata (`mode: computed|authoritative`) and tighten source definitions or move heuristics behind feature flag. | Dashboard shows provenance metadata; no ambiguous “simulated” calculations in production mode. |
| `G3-P1-3` | Admin feeds/sources still rely heavily on legacy source constructs. | `src/app/api/admin/data-operations/feeds/route.ts`, `src/app/api/admin/data-operations/sources/route.ts` | Ops observability is harder to interpret against canonical pipelines. | Continue taxonomy cleanup (`directory`, `programs`, `alma`, `sync`) and demote `data_sources`/`scraped_services` semantics in UI labels + contracts. | Dashboard and API payloads clearly label legacy vs canonical data feeds. |

## P2 gaps (cleanup / hardening)

| Gap ID | Problem | Evidence | Impact | Required fix | Acceptance check |
|---|---|---|---|---|---|
| `G3-P2-1` | Script-layer env conventions remain inconsistent (`SUPABASE_URL`/fallback keys, custom key names). | `src/scripts/scrape-qld-services.ts`, `src/scripts/scrape-qld-services-batch.ts`, `src/scripts/sync-empathy-ledger-profiles.ts` | Operational confusion and avoidable config errors. | Standardize script env names to platform defaults and document in active scripts README. | All active scripts use documented env keys only. |
| `G3-P2-2` | Some scripts still contain hardcoded fallback URLs. | `scripts/sync-empathy-ledger-stories.mjs` has fallback Empathy Ledger URL. | Violates strict config boundary expectations. | Remove hardcoded URL fallback and require env-only config for active scripts. | No literal service URL fallbacks in active scripts. |

## Recommended implementation order (short cycles)
1. `Cycle A (P0)`
- API-first migration for intelligence interventions/evidence pages (`G3-P0-1`)
- CoE map API authority (`G3-P0-2`)
2. `Cycle B (P0)`
- Program detail single-source canonicalization (`G3-P0-4`)
- Legacy scraped-services list demotion (`G3-P0-3`)
3. `Cycle C (P1/P2)`
- Stories authority unification (`G3-P1-1`)
- Intelligence provenance/heuristic labeling (`G3-P1-2`)
- Script env hardening (`G3-P2-*`)

## Verification checklist after each cycle
- `npm run check:frontend-smoke` against active dev URL
- API smoke checks: `/api/programs`, `/api/programs/[id]`, `/api/services/[id]`, `/api/intelligence/*` touched in cycle
- Runtime schema audit: `scripts/audit/validate-runtime-schema.ts` with DB env
- No new direct page-level DB reads added for migrated domains
