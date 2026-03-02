# Funding Smoke Testing

This project now has a repeatable local funding regression gate.

## Main commands

- `npm run seed:funding-smoke-fixtures`
  - ensures the baseline smoke dataset exists in the linked Supabase project
- `npm run check:funding-preflight`
  - verifies required env is present and the local JusticeHub app is reachable before running the larger suite
  - use this as a setup diagnostic when the main gate fails early
- `npm run check:funding-regression`
  - runs the runtime funding smoke suite against the local app
  - writes a run report to `artifacts/funding-smoke/<timestamp>/`
- `npm run check:funding-regression:seed`
  - refreshes the smoke dataset, then runs the full regression suite
- `npm run check:funding-regression:reset`
  - removes transient smoke artifacts, refreshes the baseline smoke dataset, then runs the full regression suite
- `npm run check:funding`
  - shorthand for the full clean local gate (`check:funding-regression:reset`)
- `npm run check:funding:auto`
  - starts `npm run dev` only if no local JusticeHub app is reachable, then runs the full clean local gate
- `npm run clean:funding-smoke-artifacts`
  - removes transient public-evidence smoke artifacts created by repeated test runs

## What the regression suite covers

- seeded public funding page and API smoke
- recommendation to pipeline promotion
- public contribution submission
- public evidence moderation and escalation
- admin funding auth via the local smoke bypass
- browser render of key public/admin funding surfaces
- conversation reply flow
- admin conversation triage
- relationship pathway to downstream funding checkpoint

## Artifacts

Each `check:funding-regression` run writes:

- `report.json`
- `report.md`

under:

- `artifacts/funding-smoke/<timestamp>/`

The report includes:

- each smoke check label
- pass/fail status
- duration per check

In CI, the `CI Quality Gates` workflow uploads `artifacts/funding-smoke/**` as a retained artifact when the dedicated funding smoke step runs.

## Local admin bypass

To support local admin smoke checks without a real browser login session, the app includes a dev-only bypass:

- cookie name: `funding_smoke_admin`
- setup route: `/api/dev/funding-smoke/admin-session`

Guardrails:

- disabled in `production`
- requires the smoke secret (`FUNDING_SMOKE_SECRET` or `SUPABASE_SERVICE_ROLE_KEY`)
- only intended for local smoke and regression runs

The bypass is used by `npm run check:funding-admin-auth-smoke`.

## Browser smoke

The regression suite now includes one real headless browser pass:

- `npm run check:funding-browser-flow-smoke`

It verifies render and navigation markers on:

- `/funding/discovery`
- `/admin/funding/os`
- `/admin/funding/os/conversations?reply=relationship`

It uses the same dev-only admin bypass cookie as the admin auth smoke.

## Local app detection

The funding smoke helpers now scan local Next.js ports in the range:

- `3000` through `3012`

for both:

- `127.0.0.1`
- `localhost`

This avoids false failures when multiple local Next.js servers are already running and the app shifts to a higher port.

## Cleanup scope

`npm run clean:funding-smoke-artifacts` is intentionally conservative.

It removes transient public-evidence smoke rows such as:

- `Funding smoke validation ...`
- `Funding smoke moderation ...`

It also removes their linked moderation tasks and review workflows.

It does **not** remove the baseline seeded fixtures or the shared seeded promotion objects.

## Recommended local gate

For the cleanest repeatable local verification pass, use:

- `npm run check:funding`

If you do not want to think about whether the local app is already running, use:

- `npm run check:funding:auto`

That gives you:

1. transient smoke cleanup
2. baseline seed refresh
3. full funding regression
