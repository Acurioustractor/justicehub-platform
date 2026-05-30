# Justice Matrix — Historical Alignment Brief

> Generated 2026-05-30 by a 5-agent discovery workflow (git history, docs/handoffs, code inventory, migrations vs live DB) and synthesized against `docs/justice-matrix/vision-ux-and-health.md`. Companion to that vision doc; this one is the verified reconciliation of what has actually been built.

Grounded in: the four discovery sweeps, the prior draft at `docs/justice-matrix/vision-ux-and-health.md`, and direct checks against the code tree and the live database (`tednluwflfhxyucgwigh`). Where a figure was verified directly it says (verified); where it rests only on the sweeps or docs it says (sweep) or (doc).

---

## 1. Reconciled timeline

Newest first. Git commits carry their hash; doc and DB events carry their source.

| When | What | Source / author |
|---|---|---|
| 2026-05-30 | Vision/UX/health doc finalized: reframes the matrix as the NJP/OHCHR Global Strategic Litigation & Advocacy Clearing House; Section 8 "verified reality check" corrects the inferred scorecard. | `docs/justice-matrix/vision-ux-and-health.md` (doc) |
| 2026-05-30 | HUDOC enricher wired to official ECtHR APIs (search-by-appno + doc-body). Commit `aeeec65`, merged in `545e217`. CLI scanner moved to MiniMax-M2.7 routing, tighter prompt, resilient writes. Commits `2798819`, `f64abb3`. | git |
| 2026-05-30 | Backfill scripts default to free/cheap LLM providers (Groq, Gemini, MiniMax-M2.7, SambaNova, Cerebras), Anthropic last-resort. Commit `680cb21`. | git |
| 2026-05-30 | Security cleanup: removed hardcoded `service_role` keys from `scripts/` and `docs/`, added a secret-scan guard. Commits `c96c40a`, `a11810d`. Current branch `chore/remove-leaked-key-scripts`. | git |
| 2026-05-29 | Live-verified HUDOC + CourtListener scrapers wired into `scan-json`. Commit `2b7b07c`. | git |
| 2026-05-29 | EDAL adapter added (sitemap + og:title parsing, ~1,829 summaries). Commit `fc77a5c`. | git |
| 2026-05-29 | CrossRef DOI backfill + deterministic ingest enrichment (`f28c9eb`); governance v1, CC-BY-NC + dual-control sign-off (`6ee2b52`); two-surface lens, refugee + youth, over one engine (`c35e0ac`). | git |
| 2026-05-29 | Evidence quantitative-spine backfill; grounded case-summary enricher; pro bono legal-review loop. Commits `838eb7c`, `e1db935`. | git |
| 2026-05-29 | Evidence consent-gate + related-for-evidence RPCs deployed; case-search RPC returns `verified` for provenance. | migrations `20260529000002/3/4` (DB) |
| 2026-05-28 | NJP-OHCHR status brief + UI gap list written. Confirms 22 source-spreadsheet cases/campaigns present; flags CJEU Curia and UN Treaty Bodies as JS-rendered and unreachable by plain fetch, "the next build step." | `UN stuff/NJP-OHCHR-matrix-status-brief.md`, `...-ui-plan.md` (doc) |
| 2026-05-28 | Core infrastructure: source scanner (`fb60ed5`), case/campaign profiles, reviewer queue v2, health dashboard, editorial landing; pgvector embeddings + semantic dedup (`5f6e725`, migration `20260528000002`). | git + DB |
| 2026-05-28 | CJEU JSON-API adapter via InfoCuria elastic-connector, no auth. Commit `a515475`. | git |
| 2026-01-23 | Schema-fix migration adds lat/lng, country_code, categories[], outcome, precedent_strength, featured. `justice_matrix_sources`, `_discovered`, `_scrape_logs` defined + 8 seed sources. | migrations `20260123000001/2` (DB) |
| 2026-01-22 | Initial pipeline + live API connection; core tables created. Commits `63ebd25`, `4fab767`; migration `20260122_justice_matrix.sql`. | git + DB |

Note on a doc claim that could not be confirmed: the status brief and the prior draft both describe "refugee domain tagging" of 13 cases / 11 campaigns done on 28 May. There is no `domain` column on `justice_matrix_cases` or `_campaigns` (verified). The refugee/youth split is implemented as `categories[]` + scope presets in `src/lib/justice-matrix/surfaces.ts`, not a tag column. So "domain tagging" as a discrete data event is unverified; treat the surfaces file as the actual mechanism.

---

## 2. Current state inventory

Reconciled across code tree, live DB, and `vercel.json`. BUILT = present and operational. PARTIAL = present but incomplete. STUB = scaffold or migration-only, not live.

| Component | State | Evidence |
|---|---|---|
| `justice_matrix_cases` | BUILT | 328 rows (verified). 23 verified, 233 no region, 160 no outcome. |
| `justice_matrix_campaigns` | BUILT | 67 rows (verified). Heavily Australian (doc: ~50 AU vs ~9 intl). |
| `justice_matrix_sources` | BUILT | 47 rows, 31 active (verified). |
| `justice_matrix_discovered` | BUILT | 253 rows, 245 approved, 1 pending (verified). Queue worked through. |
| `justice_matrix_resources` | STUB | In migration `20260122`, not in live DB (sweep). No FK depends on it. |
| `justice_matrix_scrape_logs` | STUB | In migration `20260123000002`, not in live DB (sweep). Observability gap: run history/errors not logged. |
| Curia (CJEU) adapter | BUILT | `src/lib/justice-matrix/curia-adapter.ts`, InfoCuria elastic-connector POST, no auth. Wired in `pickJsonAdapter` (verified, scanner line 188). |
| HUDOC (ECtHR) adapter | BUILT | `hudoc-adapter.ts` + enricher `aeeec65`. Public APIs, no auth. ~114 judgments (doc). |
| CourtListener adapter | BUILT (running anonymous) | `courtlistener-adapter.ts`. Token-aware (lines 116-118, verified) but no token set, so anonymous rate limit. |
| EDAL adapter | BUILT | `edal-adapter.ts`, sitemap + og:title parsing, no auth. |
| Scanner (`scan-justice-matrix.ts`) | BUILT | Imports all 4 adapters (verified lines 38-41), `pickJsonAdapter` routes by URL (verified lines 188-191). OpenAI embeddings for dedup, optional/try-catch. |
| Link resolution (Serper) | BUILT | `justice-matrix-resolve-links-serper.ts`, `SERPER_API_KEY` set in `.env.local` (verified). HEAD-verifies every URL. |
| Cron wiring | BUILT | 5 route files under `src/app/api/cron/justice-matrix/`: `scan-json`, `scan-html`, `auto-publish`, `embed-new`, `backfill-facts` (verified). 4 registered in `vercel.json` (verified). |
| Public pages | BUILT | 9 pages: hub, explore, cases, campaigns, insights, digest, contribute, refugee (redirect), youth (redirect). Detail routes: `cases/[id]`, `campaigns/[id]`, `evidence/[id]` (verified). |
| Admin pages | BUILT | 5 pages: index, discoveries, health, review, sources (verified). |
| Semantic RPCs | BUILT | 12 `justice_matrix_*` functions deployed (sweep, migrations `20260528-29`). |
| Embeddings (pgvector) | BUILT | `vector(1536)` + HNSW on cases and campaigns, text-embedding-3-small (sweep, migration `20260528000002`). |
| Consent gating | BUILT | `justice_matrix_search_evidence` consent-filters `alma_evidence` (sweep, migration `20260529000003`). RLS public-read on matrix tables. |
| Audience surfaces (refugee + youth) | PARTIAL | `surfaces.ts` defines two presets; `refugee/` and `youth/` pages redirect into `explore?surface=` (verified). Data-layer real, UI lens-switcher thin per prior draft. |
| Issue object + Issue Profile | STUB / not started | No `/issues/[slug]` route, no issue table. The signature object of the dream does not exist. |
| Quarterly "State of Protection" briefs | PARTIAL | `/digest`, `/insights`, `/api/analysis/*` exist; no `/briefs/[region]` auto-brief, no export. |
| Partner portal (SSO/RBAC/dashboards) | not started | No `/partners`. `/contribute` form exists, no notify/versioning. |
| Public API + alerts | not started | None public (doc). |
| Ask the Matrix (grounded chat) | not started | No `/ask` route (doc). |
| Empathy Ledger stories woven in | PARTIAL | EL v2 wired platform-wide and `alma_evidence` cross-links on case profiles; stories not surfaced inside a matrix Issue. |

### Corrections to the vision doc

- **Cron exists.** The vision doc does not mention it and one sweep wrongly asserted "manual CLI only". `vercel.json` registers `/api/cron/justice-matrix/{scan-json, auto-publish, embed-new, backfill-facts}`, plus a `scan-html/route.ts` on disk (verified). The pipeline is scheduled.
- **The "refugee domain tagging" event is not a column.** There is no `domain` field (verified). The refugee/youth split lives in `surfaces.ts` as `categories[]` + scope presets. A query `WHERE domain='refugee'` would fail.
- **The hub-screen counts in the mockup are aspirational.** Section 5.3 shows "847 cases · 312 campaigns · 200 stories". Live is 328 cases, 67 campaigns (verified). Section 8 already carries the real numbers.
- **CourtListener contributes zero cases despite a live adapter.** 0 rows in `justice_matrix_cases` have `source='courtlistener'` (verified). The bottleneck is the discovered→cases promotion step, not adapter connectivity.

---

## 3. The awaited API

**The key received via Keeper is the CourtListener API token (`COURTLISTENER_API_TOKEN`).** Only candidate backed by a live, external, key-shaped artifact. Evidence:

- The adapter reads `process.env.COURTLISTENER_API_TOKEN` and, when present, sets `Authorization: Token <key>` (verified, `courtlistener-adapter.ts` lines 116-118). Inline comment: "anonymous works; `Authorization: Token <key>` raises the rate limit to 5,000 queries/day."
- The token is **absent** from `.env.local` and not declared in `.env.example` (verified). `OPENAI_API_KEY` and `SERPER_API_KEY` are present; the CourtListener token is the missing piece.
- Wiring already in place: adapter written and live-verified (2026-05-29, commit `2b7b07c`), imported and routed by the scanner (`pickJsonAdapter`, verified line 190), and the `scan-json` cron is registered in `vercel.json` (verified). A `courtlistener.com` source row exists in `justice_matrix_sources` (sweep).

**What adding the key unblocks:** raises CourtListener from the anonymous limit (~100/day) to ~5,000/day. That lets the scanner run the three refugee passes ("immigration detention", asylum, "unaccompanied minor") with cursor pagination at volume instead of throttling, the US-immigration / youth-immigrant wedge for the OHCHR beachhead. Drop it into `.env.local` (and Vercel env for the cron) as `COURTLISTENER_API_TOKEN`. No code change needed; the adapter branches on its presence.

**Honest caveat on what the key does NOT fix.** A higher rate limit raises *discovery* throughput. It does not by itself put cases on the public surface. 0 of 328 cases carry `source='courtlistener'` despite the adapter running (verified). The blocker is the **discovered → cases promotion / approval step**, not the API. The key is necessary for refugee corpus depth, but adding it without working the promotion path still leaves explore thin.

**Candidate ranking, by evidence:**

1. **CourtListener token (high confidence).** Only candidate that is external, key-shaped, referenced in code, and absent from env. Matches "received an external API key via Keeper".
2. **CJEU Curia / UN Treaty Bodies (low, mostly stale).** The 28 May status brief flagged these as the "next build step" because they are JS-rendered. But the CJEU Curia adapter was since built against the InfoCuria JSON API with no auth (commit `a515475`, verified). A *key* would not unblock CJEU. UN Treaty Bodies remains unintegrated (Blazor/SignalR, no public API) but is not key-gated either.
3. **LLM provider keys (very low).** Multi-provider free/cheap fallbacks. Cost-driven, not key-gated.

The two earlier sweeps disagreed (one named CJEU/UN, another named CourtListener). It resolves cleanly: CJEU was awaiting *engineering* on 28 May and got it by 29 May; CourtListener is awaiting a *key*. The Keeper share is the CourtListener token.

---

## 4. What's actually left

The gap to the OHCHR refugee demo, split into data-quality work and new-surface work, priority order within each.

**Data quality (the real gap, per Section 8 and the DB sweep):**

1. **Promote court-database discoveries into `cases`.** AustLII, BAILII, Curia, CourtListener, HUDOC, EDAL together show ~221 items in source metadata but 0 promoted to `cases` for those sources (sweep; CourtListener 0 verified). The discovered→cases approval path is the throttle. Without this, more scanning just deepens the queue.
2. **Verify + enrich the canonical 12 refugee cases** (M70, Rwanda/AAA, Hirsi, Sale, M.S.S., N.S., Ilias, Singh, Ruta, …) with region + outcome + precedent strength. Only 23/328 verified, 233 no region, 160 no outcome (verified). These 12 light up explore and the demo.
3. **Seed the 10 refugee campaigns** from the OHCHR source spreadsheet (#KidsOffNauru, Together With Refugees, Families Belong Together, Canadian STCA) as verified/featured rows. Campaign layer is weakest (67 total, ~9 international).
4. **Add `justice_matrix_scrape_logs`** so the promotion bottleneck becomes visible instead of guessed (STUB, sweep).

**New surfaces (the dream beyond the demo):**

1. **Issue object + `/issues/[slug]` Issue Profile** — the weave screen (Law + Movement + People on one question). The 90-second demo object. Does not exist.
2. **Lens switcher made real on explore** — surfaces exist in data; UI is thin.
3. **`/briefs/[region]` "State of Protection" auto-brief + CSV/JSON export** — partial scaffold in `/digest` and `/insights`.
4. **`/ask` grounded chat** — reuse the platform's existing RPC/chunking engine.
5. **Partner portal (`/partners`, SSO/RBAC), public API, alerts** — the multi-week clearing-house layer.

---

## 5. Recommended next 3 moves

1. **Add `COURTLISTENER_API_TOKEN` to `.env.local` and Vercel env, then run one scan pass and inspect the discovered queue.** One-line change the adapter already supports, and it is the key you were waiting on. Size: minutes for the env change; one scan run to confirm volume. (Vercel env change is Tier 2 — confirm before writing the Vercel side.)
2. **Fix the discovered → cases promotion path and add `scrape_logs`.** The actual blocker (0 court-DB cases promoted); scrape_logs makes the failure observable. Size: 1-2 days. Do this before more scanning, or the queue just grows.
3. **Verify and enrich the 12 canonical refugee cases + seed the 10 campaigns, region/outcome/strength filled.** Turns a thin Australian-skewed corpus into a demo-ready refugee set, and is the prerequisite for any Issue Profile. Size: 1-3 days of curation against the OHCHR source files. The Issue Profile screen comes immediately after, not before.

---

## 6. Correction (verified 2026-05-30, post-brief)

Section 3's caveat and Section 4's item 1 (above) said the discovered→cases promotion path was the blocker, citing "0 cases with `source='courtlistener'`". Direct lineage tracing refutes this. The promotion path works; the metric was an artifact.

- `scripts/justice-matrix-auto-publish.mjs` hardcodes `source: 'ai_scraped'` on every promoted row (lines 270, 296). No promoted case can ever carry `source='courtlistener'`, so that count proves nothing. Live `cases_by_source`: ai_scraped 231, partner_contribution 53, seed_data 23, plus one-off named report sources (verified).
- Per-source lineage (via `justice_matrix_discovered.source_id` join, verified): every court-DB source has cases on the board — HUDOC 8, CourtListener 11, CJEU Curia 19, BAILII 9, AustLII 3, EDAL 4, Oxford 2. Inter-American Court is the only one with 0 (all 4 rejected).
- 245/253 discovered are `approved`. 167 are approved with no `approved_case_id`, but all 167 match an existing case by `case_citation` (126 also by `authoritative_link`), verified. So those are promoted cases missing only their back-link. Nothing is missing from the public board.

**Revised "what's left" for the promotion area (replaces Section 4 item 1):**

1. **One-shot backfill** to set `approved_case_id` on the 167 orphan discovered rows (match by URL then title), so the admin discovery queue and provenance read honestly. Minutes, low risk.
2. **Optional source-lineage backfill** so `cases.source` carries the real adapter name (HUDOC / CourtListener / Curia) instead of the flat `ai_scraped`. Improves the provenance card on case profiles.
3. **Apply `justice_matrix_scrape_logs`** (genuinely missing from live DB) for run-history observability. This part of the brief stands.
4. **Growth is a scan, not a repair.** The queue is drained (1 pending). The CourtListener key unblocks scan volume; new pending items then flow through the working auto-publish path. The "1-2 day promotion repair" was a non-bug.
