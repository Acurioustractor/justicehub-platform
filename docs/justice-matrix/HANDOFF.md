# Justice Matrix — Handoff

**Last updated:** 2026-06-01
**For:** the next agent/session (Codex or otherwise) continuing this work.
**Read first:** this file, then `docs/justice-matrix/vision-ux-and-health.md` (the dream + UX) and `docs/justice-matrix/historical-alignment.md` (verified state of everything built to date).

---

## TL;DR

The Justice Matrix is positioned as the **National Justice Project / OHCHR "Global Justice Matrix"** — a global strategic-litigation + advocacy clearing house — that JusticeHub's stack powers. Refugee & asylum is the beachhead; Australian youth justice is the second surface. One engine, two lenses.

This session shipped: a **featured "Start here" rail**, the **CanLII adapter** (Canadian refugee law, live + cron-validated), **25 Canadian cases**, data-hygiene fixes, the security-key purge merge, the flagship **Issue Profiles** feature (the "weave screen"), and the **issue surface gate**. All are on `main` and deployed.

Follow-on local work added a **Justice Matrix guide/cover page** (`/justice-matrix/guide`), a **How it works + FAQ page** (`/justice-matrix/how-it-works`), an **Ask the Matrix first pass** (`/justice-matrix/ask` + `/api/justice-matrix/ask`), and a **live geographic map** (`/justice-matrix/map`). The ask endpoint retrieves from the existing Matrix search API, returns cited records even without an AI provider key, and synthesizes when Gemini/Groq/OpenAI is configured.

Repo: `Acurioustractor/justicehub-platform`. Production: `https://www.justicehub.com.au` (apex 307-redirects to `www`). Supabase project: `tednluwflfhxyucgwigh` (shared, production).

---

## ⚠️ Open / in-flight — do this first

**Reissue the CanLII API key.** The existing `CANLII_API_KEY` was pasted in plaintext in chat. The current key still works, and the CanLII source rows were verified against the official API on 2026-05-30, but the key should be rotated before the next scan cycle if possible. CanLII's API documentation says API keys are requested through the CanLII feedback form.

Once a new key exists, update:
- `.env.local`
- Vercel production / preview / development `CANLII_API_KEY`

Then validate with:

```bash
npx tsx scripts/scan-justice-matrix.ts --source "CanLII" --limit 3
```

---

## What shipped this session (all merged to `main`)

| PR | What |
|----|------|
| #29 | Security: purge committed `service_role` keys + secret-scan guard |
| #30 | Featured "Start here" rail on the hub (refugee + youth surface groups) |
| #31 | CanLII adapter (Canadian refugee jurisprudence) |
| #32 | Issue Profiles — the weave screen (`/justice-matrix/issues`) |
| #33 | Issue surface gate + 5 more issues |

DB changes applied directly (via MCP, live in prod):
- Featured 12 refugee cases + 10 campaigns; removed an Ilias duplicate (cases 328→327, then 327→352 after CanLII).
- Backfilled 167 orphan `discovered.approved_case_id` links (0 orphans left).
- 25 CanLII cases staged + auto-published, then legally reviewed through `/admin/justice-matrix/review` on 2026-05-30 (`verified=true`, `human_confirmed=true`, reviewer `admin-smoke@justicehub.au`); retagged 7 that lost `refugee`/`asylum` tags.
- `justice_matrix_issues` table + 8 issues (3 then 5), `surface` column.

---

## Architecture — how it actually works

### The pipeline (machine fills the corpus)
```
sources (justice_matrix_sources, ~47, 31 active)
  → cron scan-json (Mon 04:00 UTC) / scan-html (Playwright) / manual scanner
  → adapters (deterministic, no LLM) map each source's API to discovery items
  → justice_matrix_discovered (status='pending')
  → auto-publish cron (daily 04:45 UTC) LLM-grounds + promotes
  → justice_matrix_cases / _campaigns (source='ai_scraped', verified=false)
  → embed-new cron embeds; backfill-facts cron enriches
```
Adapters live in `src/lib/justice-matrix/`: `hudoc-adapter`, `curia-adapter`, `courtlistener-adapter`, `edal-adapter`, **`canlii-adapter`** (new). Routed by URL host in BOTH `scripts/scan-justice-matrix.ts` (`pickJsonAdapter`) and `src/app/api/cron/justice-matrix/scan-json/route.ts`.

### The curation (humans + flags shape it)
- `featured` → the **hub rail** (`src/app/justice-matrix/page.tsx`, `loadFeatured` + `FeaturedGroup`). Split by surface via `isRefugee(categories)`.
- `verified` → trust badge; **never set by a script** (auto-publish enforces this — earned only via the admin review UI).
- `justice_matrix_issues` → the **Issue Profiles**.

### Surfaces (one engine, two lenses)
`src/lib/justice-matrix/surfaces.ts` defines `refugee` (cats `refugee/asylum/non-refoulement`, global) and `youth` (AU scope). There is **NO `domain` column** — the split is `categories` + scope. Refugee items carry `refugee`/`asylum` tags; youth items carry `youth-justice` etc. A case is effectively one or the other.

### Issue Profiles (the weave — the flagship)
- Pages: `src/app/justice-matrix/issues/page.tsx` (index) + `issues/[slug]/page.tsx` (profile).
- Table `justice_matrix_issues`: `slug, title, question, summary, surface, category_tags[], hero_case_ids[], playbook (md), sort_order, is_published`. Public-read RLS.
- A profile gathers cases + campaigns where `categories && category_tags`, then applies the **surface gate** (refugee issue keeps refugee/asylum items; youth issue keeps the rest). Renders 3 columns (The Law / The Movement / The People) + a timeline spine + the curated playbook.
- **The People column is an invite placeholder** — no refugee lived-experience stories exist in the corpus yet (Empathy Ledger / `alma_evidence` is Australian-youth-grounded). This is the known weak spot.
- 8 issues seeded: 4 refugee (`offshore-detention-third-country-transfer`, `non-refoulement-high-seas`, `immigration-detention-oversight`, `access-to-asylum-transit-bans`), 4 youth (`raise-the-age`, `children-in-detention-inquiries`, `justice-reinvestment-community-led`, `deaths-in-custody-recommendations`).
- Design: all `/justice-matrix/*` routes use a LOCAL "research-tool" token set (`C`, `SANS`, `MONO` defined per-file), NOT the global JusticeHub editorial system. Match it. No em dashes, no AI-vocab in copy.

### Map (the geographic atlas)
- Page: `src/app/justice-matrix/map/page.tsx`; client map: `map/JusticeMatrixMapClient.tsx`; resolver: `src/lib/justice-matrix/geo.ts`.
- Uses Leaflet with OpenStreetMap tiles. Leaflet is dynamically imported inside the client component because the package touches `window` during SSR.
- Loads Matrix cases, campaigns, and consent-gated ALMA evidence. Evidence is Australia-scoped and labelled as such.
- Uses stored `lat`/`lng` first. Missing coordinates are resolved to labelled court, state, country, regional, or global centroids. The UI exposes `precisionLabel` and `geoReason` so users do not over-read centroid accuracy.
- Current local verification on 2026-06-01: `/justice-matrix/map` returned 200; browser rendered 1,014 mapped records, 1,014 marker nodes, and 16 loaded map tiles; no horizontal overflow at 1450px or 390px.

---

## Key facts & gotchas

- **`justice_matrix_*` tables that exist:** `cases`, `campaigns`, `discovered`, `sources`, `issues`. `_resources` / `_scrape_logs` are in old migration files but NOT in the live DB. "Evidence" = cross-linked `alma_evidence` (consent-gated), not a matrix table.
- **`cases.source` is always `'ai_scraped'` for scanned cases** — the auto-publish hardcodes it. Real adapter lineage is recoverable via `discovered.source_id → sources` (join through `discovered.approved_case_id`). Do NOT use `source='courtlistener'` as a "did it scan" metric.
- **Promotion path WORKS** — an earlier analysis wrongly called it broken; see the correction in `historical-alignment.md`.
- **CanLII API key** is `CANLII_API_KEY` (query-param auth, in `.env.local` + Vercel prod/preview/dev). It was pasted in plaintext in chat → **reissue it via CanLII** (then swap `.env.local` + Vercel). CourtListener needs NO key (anonymous works; a bad token there causes 401).
- **25 CanLII cases were reviewed in the admin UI on 2026-05-30** (named refugee claimants, public on CanLII). All 25 now have `verified=true` and `human_confirmed=true`. Do not bulk-verify future source rows by script.
- **Auto-mode classifier quirk:** running the scanner with NO flag is read as a live scan and may be DENIED even though it is dry-run by default. If blocked, the user runs it via `! <cmd>`. `--apply` writes; the classifier allowed that with explicit intent.
- **DB gotchas** (project-wide): `organizations.state` not `location_state`; `organizations.is_indigenous_org`; `justice_funding.amount_dollars`; partial unique index on `justice_funding` breaks `.upsert()` (select-then-insert). Always introspect columns before writing.
- **Data-modifying CTEs**: `WITH x AS (UPDATE ... RETURNING) SELECT count(*) FROM other_table` reads the PRE-update snapshot. Re-query separately to confirm counts.
- **67 pre-existing type errors** in `src/app/admin/alma/*` + `src/app/api/cron/alma/*` — unrelated; don't be alarmed. Filter type-check to your own files.

---

## How to run

```bash
# type-check (ignore the 67 ALMA errors + database.types.ts)
npm run type-check 2>&1 | grep "error TS" | grep -v database.types.ts

# dev server — port 3014 for JusticeHub (3004 is taken by Goods on Country)
npx next dev -p 3014

# scan a source (DRY RUN by default; add --apply to write to discovered)
npx tsx scripts/scan-justice-matrix.ts --source "CanLII" --limit 25            # dry run
npx tsx scripts/scan-justice-matrix.ts --source "CanLII" --limit 25 --apply    # stage

# promote pending discoveries to live cases (LLM-grounded, verified=false)
node scripts/justice-matrix-auto-publish.mjs --apply --limit 30

# trigger the prod scan-json cron manually (validates all JSON sources)
SECRET=$(grep -m1 '^CRON_SECRET=' .env.local | cut -d= -f2-)
curl -s -H "Authorization: Bearer $SECRET" https://www.justicehub.com.au/api/cron/justice-matrix/scan-json
```

### Deploy flow (used 4x this session)
1. Branch off latest `main`, commit, `git push -u origin <branch>`.
2. `gh pr create --base main --head <branch> ...`
3. Wait for the **Vercel** check to pass (the `quality-gates` check is non-required and slow; don't block on it).
4. `gh pr merge <n> --squash --admin --delete-branch` → `main` push auto-deploys to Vercel prod.
5. Verify: `curl -sL https://www.justicehub.com.au/<path>` + open in browser. Apex redirects to `www`.

---

## Next moves (prioritized backlog)

The end-user gap is "found it, now what?" — discovery is strong, action is thin. In order of value:

1. **Reissue the CanLII key** — blocked until a new key is requested from CanLII, then swap `.env.local` + Vercel and run a dry scan.
2. **The People column** — wire refugee lived-experience stories so it's not an invite. BLOCKED on data: no refugee story source yet (Empathy Ledger is youth/AU). Either ingest a refugee-story source or scope the column to youth issues where `alma_evidence` exists. This is the known weak spot.
3. **Deepen Ask the Matrix** — first pass exists. Next: issue-aware retrieval, persistent chat history, stricter citation coverage tests, and "ask this issue" links from issue profiles.
4. **State-of-Protection brief + export** — auto-generated regional brief (coverage, movement of precedent, the access gap) as a forwardable PDF + CSV/JSON export. The `/api/analysis/*` routes (coverage, report, data-health) are a starting point. This is the OHCHR-pitch artifact.
5. **Deepen case quality** — the `backfill-facts` enricher exists; fresh CanLII cases are metadata + keywords, not analysis. Enrich `strategic_issue` / `key_holding` so profiles are worth reading.
6. **More issues** — the model scales: a row + `category_tags` + `surface` + a hand-written playbook. Both surfaces have room.

---

## Pointers

- **Vision + UX:** `docs/justice-matrix/vision-ux-and-health.md`
- **User guide + rationale:** `docs/justice-matrix/user-guide-and-rationale.md`
- **Verified state of all work:** `docs/justice-matrix/historical-alignment.md`
- **This handoff:** `docs/justice-matrix/HANDOFF.md`
- **Auto-memory (cross-session):** `~/.claude/projects/-Users-benknight-Code-JusticeHub/memory/project_justice_matrix_positioning.md`
- **Migrations:** `supabase/migrations/20260530000001_justice_matrix_issues.sql`, `20260530000002_justice_matrix_issues_surface.sql`
- **Source spreadsheets (the OHCHR seed):** `~/Downloads/Strategic_refugee_asylum_cases___matrix.xlsx`, `Advocacy_campaigns_for_refugees_asylum_seekers___matrix.xlsx`, `Justice_Matrix_Background_Paper 1.docx`
