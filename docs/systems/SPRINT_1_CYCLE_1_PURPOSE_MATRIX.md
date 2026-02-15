# Sprint 1 Cycle 1: Purpose Matrix and Basecamp Alignment

Updated: 2026-02-15
Status: Draft for review gate

## Cycle 1 Objective

Lock purpose for each route family and confirm canonical data paths that support the Centre of Excellence endgame:

- Community-led proof from Basecamps
- Evidence-linked programs and services
- National scaling support through shared infrastructure

## Purpose Matrix (Route Family -> Outcome -> Canonical Data)

| Route Family | Primary User Outcome | Canonical API Path | Canonical Data Source | Status |
|---|---|---|---|---|
| `/services` | Find practical support pathways quickly and safely | `/api/services`, `/api/services/[id]` | `services_complete` | Locked |
| `/community-programs` | Discover curated community-led programs and evidence context | `/api/programs`, `/api/programs/[id]` (+ `/api/community-programs` compat) | `programs_catalog_v` | Partial (detail page still direct table read) |
| `/community-map` | Visual access to local supports + programs | `/api/services`, `/api/community-programs` | `services_complete`, `programs_catalog_v` | Locked |
| `/intelligence/*` | Understand what works and why across interventions/evidence | `/api/intelligence/*`, `/api/alma/*` | `alma_interventions`, `alma_evidence`, ALMA link tables | Locked (with targeted fixes in progress) |
| `/stories`, `/people`, `/organizations` | Preserve lived experience context and community trust | route-specific APIs + direct server reads | `stories`, `public_profiles`, `organizations` | Locked |
| `/centre-of-excellence/*` | Convert local proof into national learning and replication infrastructure | `/api/basecamps`, `/api/international-programs`, direct reads for CoE pages | `organizations`(+partner media/metrics), `international_programs`, `research_items`, `australian_frameworks`, `coe_key_people` | Partial (mixed static/dynamic data paths) |
| `/admin/data-operations`, `/admin/data-health` | Operational integrity and drift detection | `/api/admin/data-operations/*`, `/api/admin/data-health` | core runtime tables + ALMA ops tables | Locked |

## Basecamp -> Centre of Excellence Alignment Chain

This chain must stay true for community-led national scaling:

1. **Basecamp records**
- Source of truth: `organizations` where `type=basecamp` or known basecamp slugs.
- Enrichment: `partner_photos`, `partner_impact_metrics`.
- API: `/Users/benknight/Code/JusticeHub/src/app/api/basecamps/route.ts`.

2. **Basecamp public surfaces**
- `/Users/benknight/Code/JusticeHub/src/app/centre-of-excellence/page.tsx`
- `/Users/benknight/Code/JusticeHub/src/app/for-community-leaders/page.tsx`
- `/Users/benknight/Code/JusticeHub/src/app/for-funders/page.tsx`
- Current pattern: fallback arrays + API merge (safe, but creates drift risk).

3. **Evidence and support linkage**
- Programs and interventions must link deterministically (`registered_services.alma_intervention_id` and ALMA link tables).
- This enables proof paths from community work to evidence and policy narrative.

4. **National scaling surfaces**
- CoE map and insights pages present cross-region learning:
  - `/centre-of-excellence/map`
  - `/centre-of-excellence/global-insights`
  - `/centre-of-excellence/research`
- These must remain connected to live operational data where possible.

5. **Endgame**
- Community-led organizations remain the anchor.
- Platform provides shared infrastructure, not centralized control.
- National replication is built from place-based proof and governed evidence.

## Cycle 1 Decisions to Lock

1. **Basecamp source-of-truth rule**
- Lock `/api/basecamps` as canonical basecamp feed for all basecamp-related pages.
- Keep local fallback values for resilience only, never as authoritative content.

2. **CoE purpose rule**
- CoE route family purpose is: *translate place-based proof into national capability and support*.

3. **Programs-to-evidence rule**
- Any program claiming evidence context must resolve via canonical link fields/tables, not inferred columns.

4. **Merge rule (anti-drift)**
- Every cycle closes with a route->API->table diff review and explicit approval before next cycle.

## 48-Hour Merge Gates (Run Each Cycle)

1. **Purpose Gate**
- Any changed page must still map to an approved route-family purpose.

2. **Contract Gate**
- Any changed query or endpoint must map to canonical source table/view (or declared compatibility adapter).

3. **Drift Gate**
- No new references to deprecated/phantom schema.
- No hardcoded runtime keys/URLs in app runtime paths.

4. **Basecamp Integrity Gate**
- `/api/basecamps` output still drives CoE, funder, and community leader surfaces.
- Basecamp counts/names/slugs consistent across those pages.

5. **Review Gate**
- Publish cycle review note with:
  - What changed
  - What was locked
  - What remains ambiguous
  - Next cycle scope

## Sprint 1 Cycle 1 Deliverables

1. Approved purpose matrix for route families above.
2. Approved Basecamp->CoE alignment chain.
3. Approved 48-hour merge gate checklist.
4. Prioritized Cycle 2 tasks (page ownership + canonical/compatibility labels per page).

