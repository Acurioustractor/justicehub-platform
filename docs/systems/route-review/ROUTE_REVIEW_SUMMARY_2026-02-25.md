# JusticeHub Route Review Summary (2026-02-25)

## Scope
This review covers the current Next.js App Router codebase under `src/app`, including:
- page routes (`page.tsx`, `page.mdx`)
- API route handlers (`route.ts`)
- layouts (`layout.tsx`)
- route integrity signals from internal `href` usage
- runtime route health from local smoke screenshots

## Why This Website Exists
JusticeHub is positioned as infrastructure for youth justice system change: it makes community-led solutions visible, navigable, and evidence-backed so people can move from harm response to prevention and reform.

From the implemented route/content system, the platform intent is fourfold:
- Direct support: route people to services and community programs quickly.
- Evidence translation: convert fragmented data/research into actionable intelligence dashboards.
- Story and narrative power: surface lived experience and empathy-led storytelling.
- Coordination and accountability: provide operations/admin tooling for content quality, data health, and funding transparency.

ACT alignment note: JusticeHub functions as one of ACT's public outputs, translating justice work into shared civic infrastructure rather than a single campaign site.

## Route Architecture At A Glance
Current route totals (from `src/app` scan):
- 174 page routes
- 105 API routes
- 6 layout scopes
- 32 dynamic page routes
- 7 MDX page routes

Largest route domains:
- `/admin` (45 pages): internal operations surface
- `/intelligence` (21 pages): ALMA evidence/intelligence surface
- `/wiki` (9 pages): internal publishing/knowledge pages
- `/preview` (10 pages): concept/prototype previews
- `/youth-justice-report` (7 pages): report microsite flow

See full inventories:
- `docs/systems/route-review/ROUTE_INVENTORY_2026-02-25.md`
- `docs/systems/route-review/API_ROUTE_CATALOG_2026-02-25.md`
- `docs/systems/route-review/PAGE_API_DEPENDENCIES_2026-02-25.md`
- `docs/systems/route-review/USER_JOURNEY_IMPLEMENTATION_SPEC_2026-02-25.md`

## Route Domains And Purpose
| Domain | Why It Exists | Representative Routes | Primary API/Data Surface |
|---|---|---|---|
| Public trust + activation | Frame the problem and move users toward action | `/`, `/about`, `/how-it-works`, `/contact` | `/api/homepage-stats`, `/api/contact` |
| Service and program discovery | Help users find immediate support and proven alternatives | `/services`, `/services/[id]`, `/community-programs`, `/community-map` | `/api/services`, `/api/programs`, `/api/reports/aggregation` |
| Intelligence (ALMA) | Aggregate evidence, interventions, and system signals | `/intelligence/*`, `/youth-justice-report/*` | `/api/intelligence/*`, `/api/alma/*`, `/api/reports/*` |
| Ecosystem and partnerships | Show organizations, people, programs, and basecamps | `/organizations`, `/people`, `/centre-of-excellence/*` | `/api/organizations`, `/api/coe/*`, `/api/basecamps` |
| Narrative and media | Publish stories, blogs, and profile storytelling | `/stories/*`, `/blog/*`, `/gallery/*`, `/art-innovation/*` | `/api/stories`, `/api/media`, `/api/empathy-ledger/*` |
| Admin operations | Keep data pipelines, content quality, and reporting running | `/admin/*` | `/api/admin/*`, `/api/signal-engine/*`, `/api/justice-matrix/*` |
| Prototype/pitch surfaces | Incubate concepts and campaign experiments | `/preview/*`, `/visuals/*`, `/flywheel`, `/contained/*` | Mixed static + selective API calls |

## Process Model: How It Works End-To-End
### 1) Support Journey (public user)
1. User enters via `/` or campaign page.
2. User goes to `/services` or `/community-programs` based on urgency and need.
3. Detail pages (`/services/[id]`, `/community-programs/[id]`) load specific supports and related profiles.
4. User submits contact/interest via `/contact` or event registration endpoints.

### 2) Intelligence Journey (practitioner/funder/researcher)
1. User opens `/intelligence` and drills into `dashboard`, `map`, `interventions`, `evidence`, and `research`.
2. Pages call focused `/api/intelligence/*` endpoints.
3. Endpoints compose Supabase-backed intervention/evidence/outcome tables into decision-ready views.
4. Outputs feed transparency narratives and funding/portfolio decision making.

### 3) Story + Empathy Ledger Journey
1. Contributors and editors use `/stories/*` and admin story routes.
2. Story/profile data and sync state flow through `/api/empathy-ledger/*` and `/api/admin/sync-empathy-ledger`.
3. Published narrative surfaces connect with programs, organizations, and intelligence context.

### 4) Admin Ops Journey
1. Operators use `/admin/data-operations`, `/admin/content-health`, `/admin/funding`, `/admin/research`, `/admin/signal-engine`.
2. Admin APIs orchestrate ingestion queues, source registry maintenance, funding workflows, and report generation.
3. Outputs roll back into public trust surfaces (updated listings, evidence, transparency views).

## Security And Access Model
From `src/middleware.ts`:
- Security headers and CSP applied globally.
- In-memory API rate limiting by client fingerprint and path.
- Suspicious user-agent/path pattern blocking with `403`.
- `/admin/*` blocked for non-admin users at middleware level.
- Public route exemptions exist for selected high-traffic pages.

## Findings
### Route integrity findings
- Internal link audit found `68` broken static references across `47` unique paths.
- Concentrated issues:
  - admin links to non-existent create/import paths (example: `/admin/programs/new`, `/admin/services/import`)
  - stale wiki slugs
  - literal template placeholders in quoted href strings (example: `/network/${node.id}`, `/organizations/${basecamp.slug}`)
  - public links to missing routes (example: `/support`, `/partners`, `/stories/share`)
- Full list: `docs/systems/route-review/LINK_AUDIT_2026-02-25.md`

### Runtime route health findings (local smoke)
Corrected screenshot run (pinned to JusticeHub dev server `http://127.0.0.1:3022`):
- `artifacts/frontend-smoke/2026-02-25T19-21-04-526Z/report.md`
- 26/26 checks passed

Note:
- A prior run had auto-discovered another local server and produced invalid screenshots for this project.

## Visual Assets Produced
- Route smoke screenshots (desktop + mobile) for core sections:
  - `artifacts/frontend-smoke/2026-02-25T19-21-04-526Z/`
- Process and architecture diagrams:
  - `docs/systems/route-review/ROUTE_PROCESS_DIAGRAMS_2026-02-25.md`

## Recommended Next Actions
1. Fix high-traffic broken links first (`/support`, `/partners`, `/stories/share`, admin shortcuts).
2. Replace literal template href strings with actual interpolated links in affected components/pages.
3. Add environment fallback behavior for service-role-dependent pages so they degrade gracefully instead of 500 in preview/dev.
4. Add CI route checks: link integrity + selected smoke routes as a required status check.
