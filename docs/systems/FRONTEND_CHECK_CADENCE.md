# Frontend Check Cadence

Updated: 2026-02-15

## Why

As we migrate pages to canonical APIs, frontend behavior can change even when visuals look similar.
This cadence gives a repeatable way to catch regressions quickly.

## Standard Loop (Every Change Batch)

1. Start local app:
- `npm run dev`

2. Run frontend smoke checks (route load + fatal error scan + screenshots):
- `npm run check:frontend-smoke`
  - Script auto-detects local app URL (`3000/3001/3005`) if `FRONTEND_SMOKE_BASE_URL` is not set.

3. Review artifacts:
- `artifacts/frontend-smoke/<timestamp>/report.md`
- `artifacts/frontend-smoke/<timestamp>/report.json`
- screenshots in same run folder

4. Run runtime and security checks:
- `npm run audit:runtime-schema`
- `npm run check:no-hardcoded-supabase-keys`

## What smoke check covers

- Core static routes (`/`, `/services`, `/community-programs`, `/community-map`, `/intelligence/*`, `/centre-of-excellence`, `/for-community-leaders`, `/for-funders`)
- Dynamic detail routes discovered from live APIs:
  - `/services/[id]` from `/api/services?limit=1`
  - `/community-programs/[id]` from `/api/programs?limit=1`
- Desktop + mobile viewports
- Fails on:
  - HTTP status >= 400
  - fatal runtime markers (`Application error`, `Internal Server Error`, etc.)
  - page runtime exceptions

## Optional environment overrides

- `FRONTEND_SMOKE_BASE_URL` (default: `http://127.0.0.1:3000`)
- `FRONTEND_SMOKE_OUTPUT_DIR` (default: `artifacts/frontend-smoke`)
- `FRONTEND_SMOKE_ROUTES` (comma-separated route override)

Example:
- `FRONTEND_SMOKE_BASE_URL=http://127.0.0.1:3005 npm run check:frontend-smoke`
- `FRONTEND_SMOKE_ROUTES=/services,/community-programs FRONTEND_SMOKE_BASE_URL=http://127.0.0.1:3000 npm run check:frontend-smoke`

## Sprint Use

For Sprint 2 implementation steps (`G1` to `G3`), run this after each merged task before starting the next one.
