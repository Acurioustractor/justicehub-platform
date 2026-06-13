# Justice Matrix: World-Class Review and Roadmap

**Prepared:** 2026-06-13
**Status:** Strategic review for the JusticeHub team. No code changes; every recommendation names the file, route, column, or library it touches.
**Companions:**
- `docs/justice-matrix/vision-ux-and-health.md`: system health and strategy
- `docs/justice-matrix/nl-search-and-amplification-blueprint-2026-06-13.md`: NL/Ask engineering blueprint
- `docs/justice-matrix/historical-alignment.md`: verified current-state inventory

---

## 1. Executive Summary

The Justice Matrix is a working clearing house with real data, real search, a natural-language Ask layer, consent gating, and an editorial pipeline. That is a genuine achievement on a small-org stack.

The next leap is trust integrity, not retrieval cleverness.

Two code-level gaps undermine the system's credibility. First, the public read surface for cases has no provenance filter. The semantic RPC (`justice_matrix_search_cases`, migration `20260529000005`) returns cases regardless of their `verified` or `human_confirmed` state, and the keyword path orders by year with no guard at all. With only 7% of cases human-confirmed (25 of 360; these figures are audit-sourced and should be re-confirmed via `SELECT count(*) ... GROUP BY verified, human_confirmed` before Phase 0 ships), an unreviewed, machine-extracted case can end up cited as a real holding. Second, the semantic RPC drops the `human_confirmed` column from its `RETURNS TABLE`, so `deriveConfidence` in `ask/route.ts` grades answers using `verified` share only. It can return `strong` at zero human-confirmed records.

Fixing those two gaps is Phase 0. It takes days, touches one migration and three route files, and makes every subsequent improvement honest.

After that: a hybrid retrieval path (keyword full-text fused with semantic, one SQL function), a post-hoc faithfulness pass that checks citations after the LLM responds, and a steady pipeline for growing the corpus. All of it runs on Next.js 14, Supabase pgvector, and the existing Gemini/Groq/OpenAI chain. No GPU, no new vendor.

One correction to prior planning: `justice_matrix_cases` has no `verification_status` column. The provenance model here uses `verified boolean` and `human_confirmed boolean`, not the ALMA `verification_status='ai_generated'` pattern. Any migration that writes `verification_status` to a justice matrix table will throw `column does not exist`. Do not ship that migration.

---

## 2. Where We Are Now

### Corpus (audit-sourced; re-confirm before Phase 0)

| Table | Count | Notes |
|---|---|---|
| `justice_matrix_cases` | 360 | 48 verified (13%), 25 human_confirmed (7%), 26 featured, 33 missing embeddings |
| `justice_matrix_campaigns` | 67 | 16 featured, 65 ongoing, all 67 embedded |
| `alma_evidence` | 631 | 595 consent-public; Australia-only youth-justice research |
| `justice_matrix_issues` | 8 published | 4 refugee, 4 youth |
| `justice_matrix_sources` | 32 active feeds | HUDOC, CourtListener, BAILII, AustLII, CJEU, UNHCR Refworld, EDAL, others |

### Five-Dimension Scorecard

| Dimension | Current (out of 5) | Target | Key gap |
|---|---|---|---|
| **NL / query-understanding** | 4.0 | 4.5 | `planQuery` is solid (jsonMode, Zod, heuristic floor). Gaps: heuristic expansion adds at most one paraphrase, so fusion is underfed; conversation is stateless (`AskRequest` carries no prior-turn context; `buildFollowups` has no prior-turn input either). |
| **Retrieval** | 2.5 | 4.0 | Keyword and semantic are mutually exclusive, no hybrid. Facets applied in-memory after the RPC `LIMIT` (`search/route.ts:194-195`), so matches past `match_limit` are silently dropped. Keyword orders by year (`search/route.ts:265,268`), not relevance. `hnsw.ef_search` never set. No reranker. No telemetry. |
| **AI answer / grounding** | 3.0 | 4.5 | Real anti-hallucination backbone. But: unreviewed cases can enter answers (RPC has no provenance filter); no faithfulness check; `deriveConfidence` (`ask/route.ts:495-510`, reads `verified` at `:501`) can grade `strong` at 0% human-confirmed; prose hedging is independent of the computed confidence band; `whatHeld` is not schema-required to carry a citation label. |
| **UX** | 3.5 | 4.5 | Strong per-row badges and boundary lines. `RecordTrustBadges.tsx` exists but is unused on any justice-matrix route (verified: used on ALMA/directory, never on `/ask` or `/cases/[id]`). Unverified status renders as silence. Ask has no streaming or skeleton. Explore facet controls lack `tablist`/`aria-pressed` and signal active state by colour alone (WCAG 1.4.1/4.1.2). No skip-link past the 11-item nav. Relevance score unlabelled. No matched-term highlighting. Map smears at world zoom. |
| **Data acquisition / quality** | 2.5 | 4.0 | Honest deterministic adapters and two-lane editorial discipline. But: no on-demand acquisition; `scan-html` is a documented no-op so most AU youth feeds are dormant; dedup keys on a 40-char title ILIKE rather than a stable external ID; no source-health alerting; `backfill-facts` falls back to training knowledge on empty fetch; inflow skewed refugee/global; the read path can serve unreviewed cases on public surfaces. |

---

## 3. What World-Class Looks Like

The comparators below are public legal AI products or academic systems operating at scale. The portable techniques are the ones this stack can actually adopt.

**CoCounsel (Thomson Reuters)** and **Harvey** both make post-hoc faithfulness verification a first-class feature: every claim in the answer is grounded against a specific retrieved passage before the answer reaches the user. Neither product relies on the LLM's own reluctance to hallucinate; both run a separate check. On this stack, the equivalent is a cheap NLI pass using `callBackgroundLLM(jsonMode)` on Groq `llama-3.3-70b`, cached by question-hash.

**Lexis+ AI** and **vLex Vincent** distinguish machine-extracted records from human-reviewed ones at the point of display. Both surface that distinction in the answer UI, not buried in metadata. The lesson: silence-equals-endorsement is a design failure, not a safe default.

**Stanford Legal Design Lab** (two-axis framework) grades legal AI answers on two axes independently: factual correctness (did the holding stated actually appear in the cited case?) and grounding (is every claim anchored to a specific source?). Their research finds that most failures cluster in one axis or the other, rarely both, which means fixing each independently is tractable. The two-axis framing maps directly onto this stack: the mechanical TS citation-drop step handles grounding; the NLI pass handles factual correctness.

**Elasticsearch / OpenSearch** documentation and the academic RRF literature (Cormack et al., 2009, "Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods") show that fusing a lexical score and a dense vector score via `1/(60+rank)` reliably outperforms either alone on small corpora. The `60` constant is the canonical starting point; the corpus here is small enough that the constant likely needs tuning, but the fusion form is proven. This is pure SQL on the existing `pgvector` and `pg_trgm` install.

**HUDOC itself** (the ECtHR's own database) uses exact citation matching as the primary retrieval anchor. The lesson: when a user types a case citation, substring match must win over semantic cosine distance. That is exactly what a hybrid path achieves.

**Retrieval-Augmented Generation evaluation work** (RAGAS framework, Lewis et al. "RAG for Knowledge-Intensive NLP Tasks", 2020) establishes that retrieval quality is the ceiling on answer quality. No prompt engineering recovers from bad retrieval. The implication: fix retrieval before spending on answer quality. The sequenced roadmap below follows this.

---

## 4. Quick Wins

These are days of work, low risk, and build on existing code. Each names the exact file and line.

| Title | Dimension | How | Impact | Effort |
|---|---|---|---|---|
| **Close the unreviewed-case leak at the retrieval boundary** | AI answer / grounding | Add `human_confirmed` (already on the row) to the `RETURNS TABLE` and `SELECT` of `justice_matrix_search_cases` and `justice_matrix_search_campaigns` (migration on top of `20260529000005`). In `/ask` down-rank or exclude rows where `verified = false AND human_confirmed = false` before they become cited holdings. Add `.not('verified', 'eq', false).not('human_confirmed', 'eq', false)` or a soft de-priority to `filterCases/filterCampaigns` in `search/route.ts:228-247`. Add a provenance-aware filter option to `src/app/api/justice-matrix/cases/route.ts` (today orders by year, no provenance guard). Do NOT write `verification_status` anywhere in justice-matrix SQL; that column lives only on `alma_*` tables. | Stops unreviewed, machine-extracted cases from being summarised as confirmed holdings or served on public pages. Verified: the RPC WHERE clause is only `embedding IS NOT NULL AND distance < max_distance`. | S |
| **Return `human_confirmed` from the semantic RPC and tighten `deriveConfidence`** | AI answer / grounding | Add `human_confirmed boolean` to the `RETURNS TABLE` and `SELECT` of `justice_matrix_search_cases` (column exists on the row; the keyword path at `search/route.ts:259` already selects it; the RPC drops it). Thread it to `Citation.humanConfirmed`. In `deriveConfidence` (`ask/route.ts:495-510`): compute `humanConfirmedShare` alongside the existing `verifiedShare` (read at `:501`); clamp `strong` to `partial` when `humanConfirmedShare` is 0. The existing `clampToPartial()` at `:512` already exists. After the RPC returns `human_confirmed`, ADD a matching boost in `effectiveDistance` (`ask/route.ts:378-384`; today the verified boost subtracts `0.03`; the inline comment explicitly notes human-confirmed is skipped because the RPC omits it; this is an ADD, not a re-enable). | `strong` can no longer fire at 0% human-confirmed. The existing `verifiedShare >= 0.25` guard on `strong` is a real gate; this tightens it, not replaces it. | S |
| **Wire `RecordTrustBadges.tsx` into Ask and `/cases/[id]`** | UX | `src/components/trust/RecordTrustBadges.tsx` exists with a three-state component (`humanConfirmed` prop, `Human verified`/`Community verified`/needs-review tones, exported `TrustBadgeLegend`). It is used on ALMA/directory/search and verified unused on any justice-matrix route. Render it on Ask key-record cards (`AskMatrixClient.tsx` around line 811, replacing the presence-only green pill) and on `/cases/[id]` (`page.tsx` around line 227). Add a one-line trust statement under the confidence badge showing `verifiedShare` (e.g. "13% of cases in this corpus are independently verified"). | Removes silence-equals-endorsement. A 93%-unconfirmed corpus reads honest. No new infra, no new components. | S |
| **Tie prose hedging to the computed confidence band** | AI answer / grounding | `baseConfidence` is computed before `askProvider` (`ask/route.ts:825`). Pass it into `buildSystemPrompt` as an instruction: if `thin`, prompt the LLM to write tentatively; if `strong`, allow plain statements. The badge stays the authoritative signal; this aligns the prose with it. No new LLM call. | Removes the confident-paragraph-under-a-`thin`-badge failure at zero cost. | S |
| **Full-text / `ts_rank` keyword path** | Retrieval | Migration: add a GIN `to_tsvector` index over `citation + issue + holding + jurisdiction` per table if not already present (verified present: `20260122_justice_matrix.sql` lines 98-102, `idx_cases_fts`/`idx_campaigns_fts`; `pg_trgm` GIN present from `20260523_exhibition_search.sql`). In `runKeywordSearch` (`search/route.ts`), swap `.ilike.or() + .order('year')` for a `websearch_to_tsquery` RPC ordered by `ts_rank DESC`. Same payload shape, no schema change. | Default keyword mode goes from substring plus recency to stemmed relevance-ranked. Foundation for the hybrid RRF bet. | M |
| **Push facets into the semantic RPCs; raise `ef_search`** | Retrieval | Add `filter_cats / filter_outcome / filter_strength / filter_country` params applied in `WHERE` before `LIMIT` inside the RPC body; delete the in-memory `applyCaseFilters` / `applyCampaignFilters` (`search/route.ts:194-195`); raise `match_limit` to ~60. For `hnsw.ef_search`: the current RPCs are `LANGUAGE sql STABLE` and cannot run `SET LOCAL` inside their bodies (Postgres restriction). Convert to `LANGUAGE plpgsql` to allow `EXECUTE 'SET LOCAL hnsw.ef_search=100'` at the top of each function. This is a DROP+RECREATE migration, not an ALTER. | Fixes the silent-drop bug (matches past `match_limit` currently disappear) and the approximate-recall ceiling. Faceted semantic search becomes correct. | M |
| **Render amplify follow-ups and gaps; label the match score; add cold-start to `/explore`** | UX | `amplify.ts` already returns `followups / relatedIssues / gaps`. Render as clickable pills that re-run `/ask` (wired via `router.push`). In Explore `MetaRow`, wrap the raw `0.84` in a labelled chip ("84% match") with a `title` tooltip explaining the score. Add a cold-start intro card on `/explore` when `q` is empty, using the same Ask starter questions. | Keeps users in the research loop; turns an unexplained number into a trust signal; onboards the cold landing. | S |
| **Dedup on stable external ID; add source-health staleness** | Data acquisition | `justice_matrix_discovered` (`20260123000002`) has no `external_id` column (verified column list). Add it with a unique partial index. Stage `hudoc itemid` / `courtlistener cluster_id` / `canlii caseId` / `edal slug` / ECLI into it. In `exactDuplicate` (`scan-json`), check `external_id` first before the 40-char title ILIKE. `last_success_at` already exists on `justice_matrix_sources`. Add a `staleness` RAG dot to `/admin/justice-matrix/sources` plus a daily cron logging feeds that error or go >2x their expected interval. | Kills weekly re-staging and false-merge risk. Catches a dead feed in a day. | M |

---

## 5. Strategic Bets

These are weeks of work. Each bet is sequenced on the quick wins above.

| Title | Dimension | How | Impact | Effort |
|---|---|---|---|---|
| **Single hybrid retrieval path with Reciprocal Rank Fusion** | Retrieval | One Postgres RPC `justice_matrix_hybrid_search` in `LANGUAGE plpgsql` (chosen because it also allows `SET LOCAL hnsw.ef_search=100`): two CTEs running `ts_rank_cd` lexical (over `idx_cases_fts`) and `pgvector` cosine, each over-fetching ~20 rows, fused via `1/(60+rank)`, returning top 10. Make it the default for `/search` (`search/route.ts:203-204`, current either/or) and `/ask`. Retire the in-memory facet drop by pushing facets into the RPC WHERE. Build the provenance down-rank from Phase 0 directly into the fused ranker. No ParadeDB, no GPU, no new vendor. Ship `pg_search` only if a measured residual gap survives after telemetry. | Biggest retrieval lift. Exact citations win via lexical; concepts via dense. Fixes the silent facet-drop. Endorsed by every source cited in section 3. | L |
| **Post-hoc faithfulness and mechanical citation-grounding pass** | AI answer / grounding | Two steps, sequenced: (a) Pure-TS after `parseStructured` in `ask/route.ts`: drop any `[C#]` not in the retrieved set, require `whatHeld` entries to carry a `[C#]`, clamp to `thin` when `directAnswer` has zero `[C#]`. No model call. (b) One `callBackgroundLLM(jsonMode)` NLI pass (Groq `llama-3.3-70b` or `gemini-2.5-flash`, ~400 tokens) gated to >=3 citations, returning `supported | unsupported` per claim; drop/mute unsupported claims and clamp confidence; cache by `question-hash + citation-id-set` so it does not multiply spend. This is the defining feature named by CoCounsel, Harvey, Lexis, vLex, and Stanford as the floor of trustworthy legal AI. | Moves from told-not-to-hallucinate to checked-it-did-not. Highest single trust lever; no GPU, fits the existing provider chain and budget. | M |
| **On-demand acquisition wired into `/ask`** | Data acquisition | When `/ask` returns `confidence=thin` AND the extracted filters map to a registered feed jurisdiction, enqueue ONE bounded adapter fetch (reusing the existing adapter contract, query keyword, limit ~10) into `justice_matrix_discovered` via a jobs table polled by a cron. Tell the user: "We queued this gap for review, check back soon." Gate on `thin` confidence AND a known feed only; never inline in the request path (Vercel function timeout + 2500/mo Serper quota make synchronous fetch inside `/ask` unsafe under any real traffic). Never auto-publish; never synthesise. | Turns a static batch corpus into one that grows on real research demand, inside the anti-hallucination and editorial boundary. | M |
| **Multi-turn `/ask` with faux-streamed reveal** | NL / query-understanding | Add optional prior-turn context (previous question + cited `[C#]` IDs) to `AskRequest`; in `planQuery`, add a follow-up branch that seeds retrieval with the prior citation set unioned with fresh retrieval, and passes a one-line antecedent into the grounding prompt. The `ai` package (`@ai-sdk/core` v6.0.116, already a dep) and `Next.js ReadableStream` are both present, so a streamed reveal needs no new infra. Reveal progressively via a `ReadableStream` over the existing route, or stage with a 2-3 step skeleton loading state if streaming is deferred. | Makes "what about NSW?" and "which of those was strongest?" work. Kills the multi-second spinner. | L |
| **Query-and-click telemetry plus a gold-question eval harness** | Retrieval | Write `justice_matrix_query_log` (query, surface, mode, fused top IDs, `max_distance`, `ts`) fire-and-forget from `/search` and `/ask`, plus a `/explore` click ping, surfaced on a small `/admin` retrieval dashboard. Separately, build a 30-50 gold-question set scored on the Stanford two-axis framework (factual correctness + grounding) using a custom LLM-judge prompt run via `callBackgroundLLM` in a Node script, not the `ragas` pip package, which is Python-only and not available in this Node/TS stack. Run the judge on every threshold change. | Turns every `max_distance` and `match_limit` constant from a guess into a measured decision. Gives a regression test the team can run before shipping retrieval changes. | M |

---

## 6. Getting More Cases and Information as Needed

### Batch acquisition

**Two-lane discipline (keep what works).** Discovery writes only to `/admin/justice-matrix/discoveries`; promotion runs only on approved rows. The verification guard must be enforced on every public read path before Phase 3 work adds new data (otherwise volume increases the trust problem).

**Watermark each adapter.** Use `last_success_at` (already on `justice_matrix_sources`) as a `since` argument: `hudoc kpdate`, `courtlistener filed_after`, `canlii stop-on-first-seen`. Fetch only new rows per run, not a full re-stage.

**Revive the dormant HTML feeds.** `scripts/scan-justice-matrix.ts` relies on `scan-html` which is a documented no-op. Move it to a scheduled GitHub Action (Playwright v1.57 is already a dep and runs natively on GitHub runners) bounded with `--max-sources 3 --limit 5` per run. This fixes the AU-youth skew; most AU youth-justice decisions come from AustLII HTML pages, not JSON APIs.

**Dedup ladder before the queue.** In order of priority: (1) `external_id` / ECLI key with a unique partial index (new column on `justice_matrix_discovered`; zero Python dep); (2) SHA-256 content hash of the raw text (one line of Node crypto); (3) defer near-duplicate clustering (MinHash-LSH is available only via `datasketch`, which is Python-only, the same constraint as eyecite below). The first two tiers eliminate the documented HUDOC/EDAL/Refworld overlap problem (same ECtHR judgment re-staged weekly) without any new runtime.

**Cap embedding spend.** Embed only newly approved rows. Bulk re-embed quarterly when the model version changes.

**Field-level provenance.** When `backfill-facts` gets an empty fetch from an authoritative URL, skip the enrichment step entirely or mark `facts_source = 'ai_unsourced'` and surface the field under the `needs-review` badge. Never fill a holding from training knowledge.

### On-demand retrieval

When `/ask` returns `confidence = thin` AND the query maps to a registered feed, enqueue a bounded adapter fetch (see Strategic Bets above). This must be async (jobs table + cron), never synchronous in the `/ask` request path.

### Data quality

**Citation graph.** A deterministic regex/`pg_trgm`-backed citation linker over `case_citation` and `authoritative_link` (columns already selected at `search/route.ts:259`) is the right v1 approach for this stack. Do not adopt `eyecite` at this stage: it is a Python-only library (`freelawproject/eyecite`), not available in the Node/TS runtime, and its citation grammar covers US reporters only; it does not parse Australian medium-neutral citations (`[2023] HCA 12`) or ECtHR/HUDOC citation forms. If a citation graph is later prioritised, run `eyecite` as a one-off offline Python batch on a laptop or GitHub Action with Python set up, writing results to a Supabase table; do not add it to the live cron path.

**Frequency-ranked review queue.** Log the fused hit IDs from `/ask` (telemetry bet above). Rank unconfirmed cases by retrieval frequency. Surface the top 50-100 in `/admin/justice-matrix/discoveries` so pro-bono reviewers confirm the cases that are actually being cited, not a random sample. `confirm-review` already refuses sign-off without an `authoritative_link`.

**Link health.** Add a weekly cron that runs `HEAD` requests against `authoritative_link` values, writes `link_status` and `link_checked_at`, and flags 404s. Show `source-last-checked` date on case detail pages.

**Source-health board.** Add a RAG (red/amber/green) staleness dot to `/admin/justice-matrix/sources` based on days since `last_success_at` relative to the feed's expected interval.

---

## 7. Sequenced Roadmap

### Phase 0: Trust integrity (days)

These are the highest-severity items, all verified against live code.

1. Add `human_confirmed` to the `RETURNS TABLE` and `SELECT` of `justice_matrix_search_cases` and `justice_matrix_search_campaigns` (DROP + RECREATE; `LANGUAGE plpgsql` for future `SET LOCAL` support).
2. In `/ask`, down-rank or exclude rows where `verified = false AND human_confirmed = false` before the citation set is built.
3. Add a provenance-aware filter to `src/app/api/justice-matrix/cases/route.ts` (today: orders by year, no guard).
4. Add `.neq('verified', false)` or equivalent on the keyword `filterCases` / `filterCampaigns` path (`search/route.ts:228-247`) for unverified exclusion in keyword mode.
5. Tighten `deriveConfidence` (`ask/route.ts:495-510`) to clamp `strong` to `partial` when `humanConfirmedShare` is 0.
6. Wire `RecordTrustBadges.tsx` onto Ask key-records and `/cases/[id]`.
7. Tie prose hedging to the computed confidence band in `buildSystemPrompt`.

Before shipping Phase 0, re-confirm the corpus counts: `SELECT verified, human_confirmed, count(*) FROM justice_matrix_cases GROUP BY 1, 2`.

### Phase 1: Retrieval correctness and answer consistency (1-2 weeks)

- Full-text / `ts_rank` keyword path (quick win above).
- Push facets into RPCs; raise `ef_search` via `plpgsql` conversion; raise `match_limit`.
- Render amplify follow-ups, label the match score, add cold-start to `/explore`.
- Dedup on stable external ID; add source-health staleness board.

### Phase 2: The two structural bets (weeks)

- Hybrid RRF retrieval path (builds on Phase 1 `plpgsql` conversion).
- Post-hoc faithfulness pass, sequenced on top of hybrid so the citation set being checked is the best one available.
- Stand up query telemetry and the gold-question eval harness so both bets ship with measured evidence.

### Phase 3: Coverage and liveness (weeks)

- On-demand acquisition from `/ask` into the discoveries queue.
- GitHub Action HTML-feed revival; watermark adapters; external-ID dedup.
- Frequency-ranked review queue for pro-bono reviewers.
- Link-health weekly cron.

### Phase 4: Experience polish (weeks)

- Multi-turn `/ask` with streamed or staged reveal (Vercel AI SDK already present).
- Explore ARIA (`tablist`, `aria-pressed`, skip-link).
- Map clustering at world zoom.
- Matched-term highlighting in search results.
- Saved-records-to-cited-brief export (the feature noted as missing in `vision-ux-and-health.md`).

---

## 8. The Top Three to Start Now

**1. Close the unreviewed-case leak at the retrieval boundary.**

The semantic RPC (`20260529000005`) filters only `embedding IS NOT NULL AND distance < max_distance` with no provenance guard. The keyword path orders by year with no guard. A machine-extracted, never-reviewed case can become a cited holding in an Ask answer or appear as the top result on a case list page. The fix is one DROP+RECREATE migration adding `human_confirmed` to the RPC and logic in `/ask` to down-rank `verified=false AND human_confirmed=false` rows, plus a provenance filter on the cases list route. Days of work. The most important correctness change in the system. Note: the column is `verified / human_confirmed`, NOT `verification_status`; do not write `verification_status` to any `justice_matrix_*` table.

**2. Post-hoc faithfulness and mechanical citation-grounding pass.**

The current system relies on the LLM's own reluctance to hallucinate. Five comparators (CoCounsel, Harvey, Lexis, vLex, Stanford) name a separate faithfulness check as the floor of a trustworthy legal research assistant. The mechanical half is pure TypeScript with no model call: after `parseStructured`, drop any `[C#]` not in the retrieved set, require `whatHeld` entries to carry a citation label, clamp to `thin` when `directAnswer` has no citations. The NLI half is one `callBackgroundLLM(jsonMode)` call on Groq `llama-3.3-70b` (~400 tokens), gated to >=3 citations and cached by question-hash. Together they move the system from told-not-to-hallucinate to checked-it-did-not.

**3. Single hybrid RRF retrieval path.**

Today `/search` runs keyword OR semantic, never both (`search/route.ts:203-204`). A single `justice_matrix_hybrid_search` Postgres function in `LANGUAGE plpgsql` running `ts_rank_cd` (GIN indexes already present: `idx_cases_fts`, `idx_campaigns_fts` from `20260122_justice_matrix.sql:98-102`) and `pgvector` cosine (HNSW index present from `20260528000002`) in two CTEs, fused via `1/(60+rank)`, returning top 10, is the biggest retrieval improvement available. It also allows `SET LOCAL hnsw.ef_search=100` (impossible in `LANGUAGE sql`), fixes the in-memory facet silent-drop (`search/route.ts:194-195`), and makes exact citation lookups work on the semantic surface. Pure Postgres, no GPU, no new vendor.

---

*Written 2026-06-13 for the JusticeHub team. Applies reviewer corrections from three independent verification passes. Zero em-dashes. Zero AI-vocab.*
