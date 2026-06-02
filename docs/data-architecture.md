# JusticeHub ↔ Grantscope data architecture

**Status:** v1, 2026-05-05
**Owners:** Ben Knight + Nic Marchesi
**Applies to:** all org / intervention / funding / map work across JusticeHub, Grantscope (CivicGraph), and shared surfaces.

## The single source of truth

JusticeHub and Grantscope share **one Supabase project** (`tednluwflfhxyucgwigh`) and one set of canonical tables. Going forward, all code on either side reads from this canonical chain. No app-specific entity registries.

## The canonical chain for orgs and programs

```
alma_interventions          ← youth-justice programs (1,697 verified)
        │
        │ .operating_organization_id
        ▼
organizations               ← JusticeHub-side wrapper, 98K total
        │                     (basecamps, Empathy Ledger sync, partner_tier,
        │                      slug, logo, JH-specific metadata)
        │
        │ .gs_entity_id          ← The bridge to Grantscope canonical
        ▼
gs_entities                 ← Grantscope canonical entity registry
                              (abn, acn, canonical_name, state, postcode,
                               lga_name, sa2_code, remoteness, sector,
                               is_community_controlled, community_controlled_tier,
                               is_supply_nation_certified, latest_revenue,
                               seifa_irsd_decile, embedding for semantic search)
        │
        │ .postcode JOIN postcode_geo.postcode
        ▼
postcode_geo                ← Geocoding lookup (postcode + locality → lat/lng,
                               sa2/sa3/sa4 codes, ABS remoteness 2021)
```

## Rules

### 1. `gs_entities` is the canonical registry. Don't duplicate.

When code needs an org's ABN, postcode, state, LGA, remoteness, community-controlled flag, sector, or supply-nation status — **read from `gs_entities`**, not from `organizations` or `alma_interventions`.

`organizations` carries JusticeHub-specific metadata only (basecamp slugs, partner photos, EL sync state, logo URL, partner_tier).

### 2. Orgs that don't link to `gs_entities` are second-class for analytical work.

If `organizations.gs_entity_id IS NULL`, the org won't appear on civic intelligence maps, the funding-flow analysis, the community-controlled filter, or the demographic overlays. To make an org first-class:

- Find or create a `gs_entities` row (canonical_name, abn if known, entity_type)
- Set `organizations.gs_entity_id`

There is no shortcut — JH-side address fields exist (`street_address`, `state`, `postcode`) but are NOT to be used for analytical surfaces. They drift.

### 3. Geocoding only happens via `postcode_geo`.

`alma_interventions.latitude/longitude` is **deprecated** for new work. The historical values are mostly geocoder fallbacks (state centroids, GPO defaults) and cannot be trusted.

For new map plots:

```sql
SELECT pg.latitude, pg.longitude
FROM organizations o
JOIN gs_entities e ON e.id = o.gs_entity_id
JOIN postcode_geo pg ON pg.postcode = e.postcode
WHERE o.id = $1 AND pg.latitude IS NOT NULL;
```

If `postcode_geo` doesn't have a row for a given postcode, **don't invent coordinates**. The org is reported as `unmappable` so the data team can fix the upstream gap.

### 4. Funding flows: `justice_funding`

`justice_funding.alma_organization_id` → `organizations.id` (and via that → `gs_entities`).
`justice_funding.alma_intervention_id` → `alma_interventions.id`.

To answer "how much funding did community-controlled orgs get this year" — join through `gs_entities.is_community_controlled`. Same canonical chain.

### 5. The civic intelligence layer is shared too

`civic_intelligence_chunks` (7,022 rows: Hansard, ministerial, media, oversight, charter commitments, consultancy spending, RTI disclosures) sits at the same level as `gs_entities` and is queryable from both apps via pgvector semantic search.

## Coverage as of 2026-05-05

| Layer | Coverage |
|---|---|
| `alma_interventions` (verified, non-AI) | 1,697 |
| Linked to a delivery org | 1,568 (92%) |
| Distinct delivery orgs | 822 |
| Of those, linked to `gs_entities` | 521 (63%) |
| Of those, with postcode in `gs_entities` | 498 (61%) |
| Of those, with geocoded postcode | 205 (25%) before backfill |

After the May 2026 backfill (`scripts/backfill-yj-org-data.mjs`):
- Step 1: name-match unlinked → linked **+7 orgs**
- Step 2: ACNC postcode backfill → **+1 postcode**
- Step 3: Nominatim geocode missing postcodes → **+~300 plottable orgs**

## Data quality follow-ups

The 235 YJ orgs without `gs_entity_id` after fuzzy-name matching are mostly:

1. **Government departments** (Qld DoYJ, NSW Youth Justice, etc.) — these aren't entities in the gs_entities sense (no ABN to register against). They should either: (a) get a `government_body` entity type record in gs_entities, or (b) be excluded from org-level analytical maps and surfaced as state-level instead.
2. **Placeholder records** (Australian Government, VIC Government) — should be merged or removed.
3. **Aboriginal corporations not yet in gs_entities** — these need OR-flagged entries created.

The 23 orgs linked to gs_entities but without postcode need ABN → ACNC lookup OR manual address input.

## Where to make changes

- **Schema migrations**: `supabase/migrations/` (this is the shared project — both apps' migrations land here)
- **JH map endpoints**: `src/app/api/intelligence/orgs/geo/route.ts`, `src/app/api/intelligence/summary/route.ts` (uses RPCs `get_yj_orgs_for_map`, `get_contained_intel_summary`)
- **Backfill scripts**: `scripts/backfill-yj-org-data.mjs`
- **Grantscope canonical entity ingestion**: `/Users/benknight/Code/grantscope/packages/grant-engine/src/sources/`

## API contract for cross-app linkage

JusticeHub-side endpoints are the **read interface** for both apps:

| Endpoint | Returns |
|---|---|
| `GET /api/intelligence/summary` | 5 decision-grade YJ stats from `get_contained_intel_summary` RPC |
| `GET /api/intelligence/orgs/geo` | 822 YJ orgs, plottable + unmappable, from `get_yj_orgs_for_map` RPC |
| `GET /api/contained/tour-intelligence` | Per-stop civic intelligence for the Contained tour |

Grantscope-side endpoints (CivicGraph) consume the same canonical tables but layer on grant-flow analysis, foundation watchlists, and the QLD youth justice deep-dive at `/share/qld-youth-justice`.

When a new map / dashboard surface is needed: **read through the canonical chain or extend `get_yj_orgs_for_map` RPC**. Don't add a new entity registry. Don't denormalise onto `organizations`. Don't re-geocode from app-side address fields.
