# G3 Data Path Alignment Matrix (Pages -> API -> DB -> Scraper Owner)

Updated: 2026-02-15
Scope: live menu pages + high-traffic detail pages + canonical/compat APIs

## Why this exists
JusticeHub's core goal is to make community-led youth justice solutions discoverable, evidence-linked, and operationally trustworthy. This matrix shows where each live surface gets its data, who writes that data, and where alignment still breaks.

## Snapshot
- Menu routes in navigation config: `46`
- Existing menu routes with page files: `46/46`
- Total app pages (`src/app/**/page.tsx`): `154`
- Total API routes (`src/app/api/**/route.ts`): `87`
- Runtime relations referenced in `src/app` + `src/lib` (`.from(...)` scan): `93`

## Pipeline owners (write authority)
- `directory`: `src/scripts/scrape-qld-services.ts`, `src/scripts/scrape-qld-services-batch.ts` -> `services`, `organizations`
- `programs`: curated program workflows + `scripts/jobs/link-programs-to-alma.ts` -> `registered_services`, `registered_services.organization_id`, `registered_services.alma_intervention_id`
- `alma`: `src/app/api/admin/data-operations/scrape/route.ts` + ALMA jobs -> `alma_*` entities and `alma_scrape_history`
- `sync`: Empathy/profile/story sync scripts -> `public_profiles`, `profiles`, `stories`, `empathy_ledger_*`, `profile_sync_log`
- `editorial/manual`: admin content and direct curation (stories, articles, blog, events, transparency tables)

## Route Alignment Matrix (core user journeys)
Legend: `aligned` = canonical path in use, `partial` = mixed/compat/fallback, `drift` = non-canonical authority

| Route | Page Read Path | API Path(s) | DB/View Authority | Write Owner | Status |
|---|---|---|---|---|---|
| `/` | client fetches homepage + map + stories feeds | `/api/homepage-stats`, `/api/network-nodes`, `/api/empathy-ledger/stories`, `/api/featured-stories` | `services`, `alma_interventions`, `public_profiles`, `organizations`, `justicehub_nodes`, external Empathy Ledger | directory + alma + sync + editorial | partial |
| `/services` | client fetch list | `/api/services` | `services_complete` view | directory | aligned |
| `/services/[id]` | client fetch detail + profiles | `/api/services/[id]`, `/api/services/[id]/profiles` | `services_complete` (+ profile linking tables) | directory + sync/editorial linking | aligned |
| `/community-programs` | server read | none (server-side direct) | `programs_catalog_v` | programs (+ alma enrichment) | aligned |
| `/community-programs/[id]` | client fetch detail + related + profiles | `/api/programs/[id]`, `/api/programs`, `/api/programs/[id]/profiles` | `programs_catalog_v` + supplemental `registered_services` in detail API | programs | partial |
| `/community-map` | client fetch merged datasets + static fallback | `/api/services`, `/api/programs` | `services_complete` + `programs_catalog_v` (+ `src/content/community-map-services` fallback) | directory + programs | partial |
| `/intelligence/overview` | client fetch summary payload | `/api/intelligence/overview-summary` | `services`, `alma_interventions`, `alma_evidence`, `organizations`, `alma_funding_opportunities` | alma + directory | aligned |
| `/intelligence/dashboard` | client fetch stats/signals | `/api/intelligence/global-stats`, `/api/intelligence/alpha-signals` | `alma_interventions`, `alma_evidence`, `alma_outcomes`, `alma_community_contexts`, `alma_source_registry`, `alma_discovered_links` | alma | partial |
| `/intelligence/map` | client fetch map locations | `/api/intelligence/map-locations` | `alma_interventions`, `services` | alma + directory | aligned |
| `/intelligence/status` | client fetch status | `/api/intelligence/system-status` | `alma_discovered_links`, `alma_interventions` | alma | aligned |
| `/intelligence/research` | client start/poll sessions | `/api/intelligence/research`, `/api/intelligence/research/[sessionId]` | `alma_research_sessions`, `alma_research_findings`, `alma_research_tool_logs` (+ RPCs) | alma | aligned |
| `/intelligence/interventions` | direct browser Supabase reads | none (page reads DB directly) | `alma_interventions`, `alma_outcomes`, `alma_community_contexts`, `alma_intervention_*` link tables | alma | drift |
| `/intelligence/interventions/[id]` | server direct DB reads | none (page reads DB directly) | `alma_interventions`, `alma_evidence`, `alma_outcomes`, `alma_community_contexts`, `alma_intervention_*` | alma | drift |
| `/intelligence/evidence` | direct browser Supabase reads | none (page reads DB directly) | `alma_evidence` | alma | drift |
| `/intelligence/evidence/[id]` | server direct DB reads | none (page reads DB directly) | `alma_evidence`, `article_related_evidence`, `alma_intervention_evidence` | alma + editorial linking | drift |
| `/intelligence/funding` | direct browser Supabase reads | none | `alma_funding_opportunities`, related alma funding tables | alma | partial |
| `/centre-of-excellence` | client fetch with fallback merge | `/api/basecamps` | `organizations` + `partner_photos` + `partner_impact_metrics` (+ local fallback array) | directory + editorial | partial |
| `/centre-of-excellence/map` | static content map | none | `src/content/excellence-map-locations.ts` static dataset | manual content | drift |
| `/for-community-leaders` | client fetch with fallback | `/api/basecamps` | `organizations` (+ fallback basecamp constants) | directory + editorial | partial |
| `/for-funders` | client fetch with fallback | `/api/basecamps` | `organizations` (+ fallback basecamp constants) | directory + editorial | partial |
| `/stories` | server direct DB read | none | `articles` (+ author from `public_profiles`) | editorial + sync | partial |
| `/people` | server direct DB read | none | `public_profiles` | sync + editorial | aligned |
| `/organizations` | server direct DB read | none | `organizations`, `registered_services`, `services`, `organizations_profiles`, `youth_detention_facilities`, `facility_partnerships` | directory + programs + editorial | aligned |
| `/opportunities` | browser direct DB read | none | `alma_funding_opportunities` | alma | aligned |
| `/transparency` | client fetch transparency endpoint | `/api/transparency` | `transparency_budget`, `transparency_alerts`, `transparency_metrics` (+ hard fallback payload) | editorial/manual | partial |

## Canonical API alignment (current)

| API Route | Authority | Classification |
|---|---|---|
| `GET /api/services` | `services_complete` | canonical |
| `GET /api/services/[id]` | `services_complete` via `getServiceDetailResult` | canonical |
| `GET /api/programs` | `programs_catalog_v` | canonical |
| `GET /api/programs/[id]` | `programs_catalog_v` + supplemental `registered_services` | canonical+supplement |
| `GET /api/community-programs` | adapter over `programs_catalog_v` | compatibility |
| `GET /api/scraped-services/[id]` | alias wrapper to canonical service detail | compatibility |
| `GET /api/scraped-services` | direct `scraped_services` list | legacy/compat |
| `GET /api/basecamps` | `organizations` + partner enrichments | canonical |
| `GET /api/intelligence/overview-summary` | aggregate over services + ALMA + orgs + funding | canonical for overview |

## Menu surface summary (all 46 routes)
- Data-heavy and already in canonical API paths: `/services`, `/services/[id]`, `/community-programs`, `/community-programs/[id]`, `/community-map`, `/intelligence/overview`, `/intelligence/map`, `/intelligence/status`, `/intelligence/research`.
- Data-heavy but still mixed/drift: `/intelligence/interventions`, `/intelligence/interventions/[id]`, `/intelligence/evidence`, `/intelligence/evidence/[id]`, `/centre-of-excellence/map`, `/stories`, `/transparency`.
- Mostly static/marketing or content-first routes (no major schema risk): `/about`, `/about/roadmap`, `/how-it-works`, `/contact`, `/for-government`, `/for-researchers`, `/blog`, `/events`, `/stewards`, `/gallery`, `/art-innovation`, `/themes`, `/youth-justice-report`, `/youth-scout/*`.

## Immediate decision frame
To keep the platform coherent around one compendium model, the strongest near-term leverage is:
1. move intelligence list/detail pages to API authority (not direct page-level DB reads)
2. replace CoE map static authority with DB/API authority
3. keep `/api/scraped-services` list route explicitly marked legacy-only and out of frontend primary paths
