# JusticeHub Process Runbook (Routes, Data, Operations)

## Purpose
This runbook explains how route-level experience, API contracts, and data operations connect in daily platform operation.

## Core Processes

### Process A: Publish discoverable support information
1. Data enters via admin ingestion/scraping routes (`/admin/data-operations`, `/api/admin/data-operations/*`).
2. Content/data quality checks run in admin health surfaces (`/admin/data-health`, `/admin/content-health`).
3. Curated entities appear on public discovery routes:
   - `/services`
   - `/community-programs`
   - `/organizations`
   - `/people`
4. Community users discover and act (contact, referrals, registrations).

### Process B: Convert data into intelligence for decisions
1. Evidence and intervention records are maintained through intelligence/admin APIs.
2. Intelligence routes consume shaped API responses:
   - `/intelligence/dashboard`
   - `/intelligence/interventions`
   - `/intelligence/evidence`
   - `/intelligence/research`
3. Outputs support funding and policy decisions through transparency and reporting routes.

### Process C: Narrative and empathy feedback
1. Story content flows through `/stories` + admin story management.
2. Empathy Ledger sync routes connect profile/story context (`/api/empathy-ledger/*`, `/api/admin/sync-empathy-ledger`).
3. Narrative context feeds back into public trust and intelligence interpretation.

## High-Value Route Groups
| Group | Routes | Operational Owner |
|---|---|---|
| Public trust and discovery | `/`, `/about`, `/how-it-works`, `/services`, `/community-programs`, `/community-map` | Product + Content |
| Intelligence | `/intelligence/*`, `/youth-justice-report/*` | ALMA/Data team |
| Ecosystem | `/organizations`, `/people`, `/centre-of-excellence/*` | Partnerships |
| Admin operations | `/admin/*` | Platform operations |
| Experiments/prototypes | `/preview/*`, `/visuals/*`, `/contained/*` | Innovation lab |

## Security Controls In Route Flow
From middleware and route behavior:
- Global security headers and CSP are enforced.
- API requests are rate-limited per client fingerprint/path.
- Suspicious path and agent signatures are blocked.
- `/admin/*` requires admin context, enforced before page logic.

## Reliability Watchpoints
1. Service-role dependency: server-side pages or APIs that require service role will hard-fail if `SUPABASE_SERVICE_ROLE_KEY` is missing.
2. Link drift: static `href` values in page/content files can become stale when route names change.
3. Parallel route ecosystems: `/stories`, `/blog`, `/wiki`, `/preview` can drift without ownership boundaries.

## Suggested Operating Cadence
- Daily:
  - review admin data-operation alerts and queue
  - check signal events and scrape health
- Weekly:
  - run link audit and smoke screenshots on core routes
  - review top broken route references and patch
- Release gate:
  - confirm environment variables for service-role routes
  - verify key route set in desktop and mobile smoke checks

## Reference Artifacts
- `docs/systems/route-review/ROUTE_INVENTORY_2026-02-25.md`
- `docs/systems/route-review/API_ROUTE_CATALOG_2026-02-25.md`
- `docs/systems/route-review/LINK_AUDIT_2026-02-25.md`
- `docs/systems/route-review/PAGE_API_DEPENDENCIES_2026-02-25.md`
- `docs/systems/route-review/USER_JOURNEY_IMPLEMENTATION_SPEC_2026-02-25.md`
- `artifacts/frontend-smoke/2026-02-25T19-21-04-526Z/report.md`
