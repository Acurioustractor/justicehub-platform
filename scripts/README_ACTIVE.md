# Active Scripts

This list defines scripts supported for the current JusticeHub runtime/data workflow.
Deprecated scripts have been moved to `scripts/legacy/`.

## Directory pipeline (service ingestion)
- `npm run scrape` -> `src/scripts/scrape-qld-services.ts`
- `npm run scrape:batch` -> `src/scripts/scrape-qld-services-batch.ts`
- `npm run scrape:daemon` -> `src/scripts/scraper-daemon.ts`

## ALMA pipeline
- `scripts/alma-scheduler.mjs`
- `scripts/alma-research-scrape.mjs`
- `scripts/alma-funding-scrape.mjs`
- `scripts/alma-weekly-report.ts`

## Sync pipeline
- `scripts/sync-empathy-ledger.mjs`
- `scripts/sync-empathy-ledger-profiles.mjs`
- `scripts/sync-empathy-ledger-stories.mjs`

## Canonical linking and audits
- `scripts/jobs/link-programs-to-alma.ts`
- `scripts/audit/validate-runtime-schema.ts`
- `scripts/audit/frontend-smoke-check.mjs`

## Notes
- Use `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for runtime/admin scripts.
- Use `EMPATHY_LEDGER_URL` and `EMPATHY_LEDGER_API_KEY` for Empathy Ledger integrations.
