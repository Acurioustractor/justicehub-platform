# TypeScript Lanes And Recovery Plan

## Why this exists

JusticeHub currently has two different TypeScript realities:

- bounded areas that can be typechecked quickly and trusted
- a repo-wide diagnostic pass that is still too slow and noisy to use as a delivery gate

The practical fix is to recover type safety by lane, not by attempting one immediate full-repo cleanup.

## Current commands

- `npm run type-check`
  Alias for the current trusted lane gate.
- `npm run type-check:diagnostic`
  Runs the slow monolithic compile via `tsconfig.typecheck.json`. Use this sparingly.
- `npm run type-check:all`
  Explicit alias for the slow monolithic compile via `tsconfig.typecheck.json`.
- `npm run type-check:green-lanes`
  Runs the lanes that are currently expected to stay green and are safe to gate in CI.
- `npm run type-check:sprint1`
  Existing narrow lane for the initial service/program route slice.
- `npm run type-check:governed-proof`
  Governed-proof control plane, admin UI, API route, and supporting Supabase helpers.
- `npm run type-check:funding`
  Funding pages, APIs, cron routes, and supporting funding library code.
- `npm run type-check:alma`
  ALMA admin routes, cron routes, components, and library code.
- `npm run type-check:org-hub`
  Organization hub APIs, admin hub surfaces, and supporting library code.
- `npm run type-check:admin-core`
  Admin dashboard, data-health, data-operations, and their core supporting components.
- `npm run type-check:residual-app-shell`
  Leftover admin shell, auth/check-cookies/hub/widget pages, and residual shell components/libs not yet promoted.
- `npm run type-check:residual-api-services`
  Leftover API and service surfaces not yet promoted into the main green set.
- `npm run type-check:admin-shell`
  Narrowed admin-focused residual lane for remaining admin pages and admin components.
- `npm run type-check:misc-shell-components`
  Narrowed shell lane for non-admin auth/hub/widget surfaces and residual shell components.
- `npm run type-check:residual-api-core`
  Narrowed residual API lane for core CRUD, reporting, and service routes.
- `npm run type-check:residual-api-content`
  Narrowed residual API lane for content/discovery/matrix-style routes.
- `npm run type-check:regenerate-residual-lanes`
  Rebuilds the four residual lane configs from actual import graphs instead of hand-maintained folder globs.
- `npm run type-check:regenerate-hub-lanes`
  Rebuilds focused hub lanes from direct imports into the current hot paths.
- `npm run type-check:admin-navigation-hub`
  Focused admin lane for pages that directly import [navigation.tsx](/Users/benknight/Code/JusticeHub/src/components/ui/navigation.tsx).
- `npm run type-check:api-content-supabase-hub`
  Focused content API lane for routes that directly import the shared Supabase service/server/empathy-ledger clients.
- `npm run type-check:api-core-supabase-hub`
  Focused core API lane for admin and CRUD routes that directly import the shared Supabase admin/server/service/empathy-ledger clients.

## Lane status

### Green lanes

These are suitable for routine development gating and CI.

- `sprint1`
- `governed-proof`
- `alma`
- `funding`
- `org-hub`
- `admin-core`
- `intelligence`
- `search-and-chat`
- `public-site`
- `content-and-media`
- `integrations-and-sync`
- `api-content-supabase-hub`
- `api-core-supabase-hub`
- `admin-navigation-hub`
- `admin-shell`
- `misc-shell-components`
- `residual-api-core`
- `residual-api-content`

### Diagnostic lanes

The named lane set is green. Keep the slow monolithic compile as diagnostic-only until it becomes comparably trustworthy.

- `residual-app-shell`
- `residual-api-services`

## Current findings

The first bounded recovery pass is complete.

### Resolved in this pass

- `alma`
  Fixed stale `alma_interventions` types, discovery schema validation, and the incorrect portfolio RPC call.
- `funding`
  Fixed Supabase JSON payload typing and overload issues in [funding-operating-system.ts](/Users/benknight/Code/JusticeHub/src/lib/funding/funding-operating-system.ts).
- `org-hub`
  Passed once the funding contamination was removed.
- `admin-core`
  Passed once the funding contamination was removed.
- `intelligence`
  Passed on the first bounded run, which confirms the current public intelligence page/API/search boundary is coherent.
- `search-and-chat`
  Passed on the first bounded run, which confirms the search routes, chat routes, and shared bot/search component boundary is coherent.
- `public-site`
  Passed after fixing a narrow Leaflet CSS declaration gap and a `d3-sankey` node identity typing mismatch in the power visualization.
- `content-and-media`
  Passed on the first bounded run and covers stories, blog, events, gallery, sites, wiki, and the content-hub bridge.
- `integrations-and-sync`
  Passed after patching stale generated Supabase table types for `campaign_donations` and `state_tenders`, then tightening the tender extraction route typing.
- `api-content-supabase-hub`
  Passed once the residual content routes that were dragging the shared Supabase type graph were moved onto narrow lightweight wrappers in [service-lite.ts](/Users/benknight/Code/JusticeHub/src/lib/supabase/service-lite.ts), [server-lite.ts](/Users/benknight/Code/JusticeHub/src/lib/supabase/server-lite.ts), and [empathy-ledger-lite.ts](/Users/benknight/Code/JusticeHub/src/lib/supabase/empathy-ledger-lite.ts), then cleaned up with a small implicit-`any` fix in [route.ts](/Users/benknight/Code/JusticeHub/src/app/api/coe/map-locations/route.ts) and a real parsed response shape in [route.ts](/Users/benknight/Code/JusticeHub/src/app/api/stories/extract-quotes/route.ts).
- `api-core-supabase-hub`
  Passed once the residual core API routes were moved off the heavyweight Supabase wrappers and onto the lightweight path, which turned the lane into a fast-failing audit. The final concrete fix in this pass was relation normalization in [route.ts](/Users/benknight/Code/JusticeHub/src/app/api/media/route.ts).
- `admin-navigation-hub`
  Passed once the admin/navigation surfaces were moved off the heavyweight typed wrappers and onto [client-lite.ts](/Users/benknight/Code/JusticeHub/src/lib/supabase/client-lite.ts), [server-lite.ts](/Users/benknight/Code/JusticeHub/src/lib/supabase/server-lite.ts), [service-lite.ts](/Users/benknight/Code/JusticeHub/src/lib/supabase/service-lite.ts), and [admin-lite.ts](/Users/benknight/Code/JusticeHub/src/lib/supabase/admin-lite.ts), then cleaned up with a small normalization fix in [page.tsx](/Users/benknight/Code/JusticeHub/src/app/admin/organizations/page.tsx), explicit row typing in [page.tsx](/Users/benknight/Code/JusticeHub/src/app/admin/people/page.tsx), and typed auth change handling in [useNavigationAuth.ts](/Users/benknight/Code/JusticeHub/src/hooks/useNavigationAuth.ts).
- `admin-shell`
  Passed after the admin/navigation Supabase hotspot was reduced and a remaining relation-shape mismatch was normalized in [page.tsx](/Users/benknight/Code/JusticeHub/src/app/admin/auto-linking/page.tsx).
- `misc-shell-components`
  Passed after the public-shell and hub surfaces were moved off the heavyweight shared Supabase wrappers and onto the lightweight variants, including [layout.tsx](/Users/benknight/Code/JusticeHub/src/app/hub/[org-slug]/layout.tsx), the hub dashboard/compliance/grants pages, [page.tsx](/Users/benknight/Code/JusticeHub/src/app/test-auth/page.tsx), and [queries.ts](/Users/benknight/Code/JusticeHub/src/lib/bgfit/queries.ts).
- `residual-api-core`
  Passed after the remaining core API routes were moved onto the lightweight Supabase wrapper path and the API-side Supabase hotspot was isolated through [tsconfig.api-core-supabase-hub.json](/Users/benknight/Code/JusticeHub/tsconfig.api-core-supabase-hub.json).
- `residual-api-content`
  Passed after the justice-funding routes were tightened in [route.ts](/Users/benknight/Code/JusticeHub/src/app/api/justice-funding/route.ts) and [route.ts](/Users/benknight/Code/JusticeHub/src/app/api/justice-funding/narrative/route.ts).

### Still true

- the named lane model now covers the repo’s practical TypeScript gate
- the old monolithic `npm run type-check:all` pass is still too slow to use routinely
- import-graph generation is now in place via [generate-import-lane.mjs](/Users/benknight/Code/JusticeHub/scripts/typecheck/generate-import-lane.mjs) and [regenerate-residual-lanes.mjs](/Users/benknight/Code/JusticeHub/scripts/typecheck/regenerate-residual-lanes.mjs)
- direct-import hub generation is now in place via [regenerate-hub-lanes.mjs](/Users/benknight/Code/JusticeHub/scripts/typecheck/regenerate-hub-lanes.mjs)
- the current import-hub hotspots are clearer now:
  `admin-shell`: [navigation.tsx](/Users/benknight/Code/JusticeHub/src/components/ui/navigation.tsx), [client.ts](/Users/benknight/Code/JusticeHub/src/lib/supabase/client.ts), [admin.ts](/Users/benknight/Code/JusticeHub/src/lib/supabase/admin.ts), [service.ts](/Users/benknight/Code/JusticeHub/src/lib/supabase/service.ts)
  `residual-api-content`: [service.ts](/Users/benknight/Code/JusticeHub/src/lib/supabase/service.ts), [server.ts](/Users/benknight/Code/JusticeHub/src/lib/supabase/server.ts), [empathy-ledger.ts](/Users/benknight/Code/JusticeHub/src/lib/supabase/empathy-ledger.ts)
- the first hub-focused generated lanes currently measure as:
  `admin-navigation-hub`: 30 entry files, 71 included files
  `api-content-supabase-hub`: 18 entry files, 26 included files
- the API-side Supabase hub generation now also covers:
  `api-core-supabase-hub`: 48 entry files, 80 included files
- the `api-content-supabase-hub` lane is now fast enough to use as a real gate after moving a narrow set of residual content routes off the heavyweight shared Supabase wrappers and onto route-local lightweight clients
- the `api-core-supabase-hub` lane is now fast enough to use as a real gate after moving the remaining core API routes onto the lightweight Supabase wrapper path
- the `admin-navigation-hub` lane is now also fast enough to use as a real gate after moving the admin/navigation surfaces off the heavyweight shared Supabase wrappers and onto narrow lightweight clients
- Supabase generated types remain a likely recurring source of drift, so regeneration needs to be part of schema-change discipline

## CI policy

The main CI gate should run `npm run type-check:green-lanes`.

That keeps the merge path honest without blocking unrelated work on legacy debt outside the bounded slices.

## Recovery workflow

1. Pick one diagnostic lane.
2. Run the lane and capture the first concrete error classes.
3. Fix only that lane until it is green.
4. Add it to `type-check:green-lanes`.
5. Repeat.

Do not widen a lane and fix unrelated domains in the same pass. The point is to build a stable perimeter.

## Error classes to track

Every failing lane should have errors grouped into one of these buckets:

- module or path-resolution problems
- server/client boundary mistakes
- nullability or optional-shape mismatches
- stale Supabase generated types
- legacy `any` surfaces that leak into new code
- route params and request typing drift

## Weekly operating rhythm

- Run `npm run type-check:green-lanes` on every PR and push.
- Run one diagnostic lane only when a new hotspot emerges.
- Run the full `npm run type-check:all` only as a periodic debt audit until it becomes fast and trustworthy enough to gate.

## Promotion rule

A diagnostic lane can become green only when:

- it completes in a reasonable time
- it produces zero TypeScript errors
- it does not rely on new broad exclusions to get there
- the lane boundary is documented here

## Immediate next targets

The current named green lane set is complete. The next useful work is:

1. keep `npm run type-check` and CI pointed at the lane gate, not the monolithic compile
2. keep using `npm run type-check:regenerate-residual-lanes` and `npm run type-check:regenerate-hub-lanes` whenever a new hotspot appears, so future narrowing stays evidence-based
3. use `npm run type-check:all` only as a periodic debt audit and compare its failures against the lane model before acting
4. if future work reintroduces compile-heavy hotspots, fix the dependency graph again rather than letting the gate silently degrade

Why this changed:

- the current bounded admin, operations, intelligence, search/chat, public-site, content/media, and integration/sync lanes are already green
- the lane gate is now broad enough to support product work without losing compile signal
- the next useful work is protecting that perimeter while focusing product work back on governed proof, funding intelligence, and community voice
