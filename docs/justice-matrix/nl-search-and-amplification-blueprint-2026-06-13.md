# Justice Matrix: Natural-Language Search and Amplification Blueprint

**Prepared:** 2026-06-13
**Status:** engineering blueprint for the Ask the Matrix upgrade. The build spec is canonical; this document carries the story, the contract, and the data-ops plan that sit around it.
**Companions:**
- `docs/justice-matrix/vision-ux-and-health.md`: the strategy, personas, and system health scorecard.
- `docs/justice-matrix/historical-alignment.md`: the verified current-state inventory (git + DB + docs).
- The unified build spec (module API, route contract, amplification shapes, 11-step build order) is the line-by-line authority for the code. This blueprint frames it; it does not restate every field.

---

## 0. The reframe

Today a person asks the Matrix a question and the Matrix forwards their raw words to the search engine, almost untouched.

`POST /api/justice-matrix/ask` cleans the question, runs it once through `/api/justice-matrix/search?mode=semantic` with a surface preset applied, takes the top ten ordered hits, and hands them to a language model with a citation-required prompt. That is the whole pipeline. There is no query understanding, no filter extraction, no query expansion, no follow-ups, no related-issue links, no gap detection, and no memory between turns.

It works, and it does not hallucinate, because the model only sees retrieved records. But it asks the reader to phrase the perfect query, accept whatever one search returns, read a wall of prose, and then work out their own next move with no help.

The reframe is this. The reader should be able to type the way they think, get the corpus read back to them as structure rather than a paragraph, and leave the answer with a real next move already drawn for them. The engine should understand the question before it searches, search more than once, ground the answer in a shape the page can render, and turn a dead end into a set of doors.

None of this invents content. Every door points at a real record, a real route, or a named authority in plain text. The boundary holds in every branch: this is a research resource, not legal advice, read the linked source before acting on it.

---

## 1. The corpus we are pointing this at

Verified counts as of 2026-06-13. Every later decision is grounded in these.

| Table | Count | Notes |
|---|---|---|
| `justice_matrix_cases` | 360 | 48 verified (13%), 25 human_confirmed (7%), 26 featured. 327 embedded, **33 missing embeddings** and therefore invisible to semantic search. |
| `justice_matrix_campaigns` | 67 | 16 featured, 65 ongoing, all 67 embedded. |
| `alma_evidence` | 631 | 595 consent-public. Australia-only youth-justice research and evaluations. The consent gate is law. |
| `justice_matrix_issues` | 8 published | 4 refugee, 4 youth. Editorial framing over real records. |
| `justice_matrix_sources` | 32 active feeds | HUDOC, CourtListener, BAILII, AustLII, CJEU, UNHCR Refworld, EDAL, and others. |

Top case categories by frequency: asylum (220), refugee (216), non-refoulement (84), article-3 (58), immigration (47), immigration-detention (36), youth-justice (18), indigenous-rights (13), deaths-in-custody (8), justice-reinvestment (5), raise-the-age (5), diversion (4), age-of-responsibility (4).

Three facts shape the whole design:

1. The corpus is small. Under 800 rows live in a single `text-embedding-3-small` space. Cosine distances are directly comparable across queries, so distance-minimum fusion is the right primitive and a rank-only scheme like RRF would throw away the magnitude the confidence signal needs.
2. The corpus is sparse on trust. 7% human-confirmed and 13% verified means a good answer has to be honest about how solid its footing is, not just fluent.
3. The evidence lane is consent-gated and category-blind. The 595 public ALMA rows carry no categories, and `/search` drops evidence whenever any category, outcome, strength, or region filter is active. The youth surface is therefore scope-only by design. Seeding a youth category would starve the evidence lane that is the entire point of that surface.

---

## 2. The new pipeline

Four stages replace the single forward-the-question step. Each one degrades to a safe floor, so a missing provider or a malformed model response never takes the page down.

### Stage 1: Understand the question

A new module, `src/lib/justice-matrix/query-understanding.ts`, turns a raw question into a `QueryPlan`: an intent, a resolved surface, a set of filters aligned one-to-one with the `/search` parameters, and one to three expanded query strings.

The module is modelled verbatim on `src/lib/justice-matrix/theme-mapper.ts`: a single `callBackgroundLLM` call, a `JSON.parse` with a `{[\s\S]*}` salvage branch, `validateLLMOutput` against a permissive Zod schema, then a Set-based sanitiser that intersects the model's categories against a frozen allow-list. On any throw, parse failure, or Zod failure it returns `planQueryHeuristic`, a pure zero-IO function that is the real safety floor and gets built and unit-tested first.

The sanitiser carries the rules that keep recall honest:
- Categories are intersected against the 13 canonical categories from the census. Nothing outside the allow-list survives.
- Country only ever resolves to `AU` or null. `country_code` is roughly 40% null on cases, so any non-AU code is a silent recall sink. The AU/global split rides on `scope` and `region` instead.
- The refugee surface seeds its default categories when none are detected. The youth surface never seeds a category, because that would trip the evidence-drop gate.
- The evidence lane gate: when the plan asks for evidence, the sanitiser forces categories, outcome, strength, region, and country empty and sets `scope=au`, so `/search` cannot drop the requested lane.

Background work does not care which provider answers, so this stage uses `callBackgroundLLM`. The synthesis stage does care, and keeps its own provider chain (see Stage 3).

### Stage 2: Search more than once

`ask/route.ts` replaces its single `retrieve()` with `retrievePlan(request, plan)`. For each expanded query, capped at `JM_QU_MAX_QUERIES` (default 3), it builds the same `/search` request plus the plan's filters and fires them with `Promise.allSettled`, so one slow or failed query does not sink the set.

Fusion is per-kind distance-minimum keyed by record id: across the expanded queries, keep the smallest distance seen for each record. For cases, an effective distance applies a small verified-only boost (`d - 0.03`, floored at zero). The human-confirmed boost is deliberately not built here, because the semantic RPC does not return `human_confirmed`; that is a flagged DB-migration follow-up, not this ship.

After fusion, each kind is sorted, the retrieval-mix quotas apply, the existing `orderedHits` interleave runs, and the top ten map to citations. A soft year post-filter drops out-of-range hits only when at least six survive, otherwise it is skipped entirely so a tight year does not starve a thin result set.

### Stage 3: Ground the answer in structure

The synthesis call keeps the route-local `chooseProvider` and `askProvider` so `retrieval.provider` stays `gemini`, `groq`, `openai`, or `retrieval-only`. The change is the shape, not the chain:
- The prose system prompt becomes a citation-forced JSON grounding prompt that interpolates the record count and the surface framing and demands a JSON object.
- The request body adds `response_format: { type: 'json_object' }`.
- `parseStructured` strips code fences, slices the first brace to the last, parses, and validates against `AskMatrixAnswerSchema`.

The model returns five keys: a direct answer, key records, what the records held, limits, and a boundary note. Two values are never trusted from the model. Confidence is computed in TypeScript by `deriveConfidence` over the real retrieval signals (citation count, best distance, verified share) and overwritten in every branch. The boundary note is overwritten in every branch to the exact line: *This is a research resource, not legal advice. Read the linked source before acting on it.*

Three degrade paths all return a valid structured answer: no provider configured, provider threw, parse or Zod failed. The salvage branch is the careful one: if the provider returned readable prose but the JSON did not validate, the prose becomes the direct answer and confidence is clamped to a maximum of `partial`. The structured answer is also flattened back into the existing `answer` string, so the response stays backwards compatible.

### Stage 4: Amplify the answer

A new helper, `src/lib/justice-matrix/amplify.ts`, turns a finished answer into next moves. It is deterministic string and URL construction over the real citations plus one new read of the published `justice_matrix_issues` rows. Zero DB writes. Every link points at a real route or names an authority as plain text.

- **Follow-ups** (3 to 5): questions the corpus can plausibly answer. Template-built first so they are always present, then optionally refined by one provider call wrapped in try/catch back to template.
- **Related issues** (0 to 3): real slugs from the issues table whose category tags intersect this answer's citations. Slugs are never invented.
- **Gaps** (0 to 3, only when the match is weak or thin): plain statements of what the Matrix does not cover, with routes that are either real internal links or name-only external authorities such as HUDOC, AustLII, or Refworld. A name-only authority carries `href: null`. No fabricated deep links.
- **Research trail** (2 to 4): pre-built `/justice-matrix/explore` URLs that broaden, narrow, jump jurisdiction, or follow a tactic. Each move only emits when its precondition holds, so there are no empty or fabricated links.
- **Actions** (up to 4): typed links for export, follow-issue, contribute, and open-map, each enabled only when its precondition is met.

---

## 3. The response contract

The contract is additive on purpose. The current client renders `response.answer` as a string. Replacing `answer` with an object would break the page, so `answer` stays a string and a new nullable `answerStructured` sits beside it. The client upgrades to render the structured shape when it is present and falls back to the string otherwise. The old client keeps working until the new one lands, which is why the client upgrade is the last build step.

`POST /api/justice-matrix/ask` returns:

- `question`, `surface`: the effective surface after the plan resolves.
- `answer: string`: preserved. Raw prose, either the flattened structured answer or the fallback packet.
- `answerStructured: StructuredAnswer | null`: null only when there is no provider and no salvageable prose.
- `citations: Citation[]`: the existing shape, now also threading `categories`, `jurisdiction`, and `country_code` from the search payload so confidence and the amplification helpers have what they need.
- `retrieval`: the existing `mode`, `total`, `provider`, plus new signals. `bestDistance`, `verifiedShare`, `intent`, `queries` (how many paraphrases fanned out), `planSource`, and `weak` (true when there are no hits or the best distance is loose, which drives the gap path).
- `followups`, `relatedIssues`, `gaps`, `researchTrail`, `actions`: the amplification block.

`StructuredAnswer` carries the direct answer with inline `[C#]` citations, key records whose labels match real citations, what the records held (empty when no holding is stated), the limits, the server-computed confidence, and the server-fixed boundary note.

The full field-by-field shapes, the `deriveConfidence` thresholds, and the amplification preconditions live in the build spec. They are the authority; this section is the map.

---

## 4. Data-ops to amplify the research

The engine can only surface what the corpus holds and reaches. Three data-ops lift the ceiling, in priority order.

### 4.1 Backfill the 33 missing embeddings (ship with this work)

33 of the 360 cases have no embedding, so they are invisible to semantic search. That is 9% of the case corpus dark to the very feature this blueprint upgrades. `scripts/justice-matrix-backfill-embeddings.mjs` reads those rows, builds the embedding text with the same `caseText`/`campaignText` logic as `embeddings.ts`, and updates the embedding column only. It never inserts. It is dry-run by default with an `--apply` gate, and it is human-run only, never queued into a cron or an AFK backlog. This is the single highest-leverage recall move in the plan and the only DB-mutating piece of the ship.

### 4.2 Raise the human-confirmed share from 7%

Confidence keys partly off verified share, and only 7% of cases are human-confirmed against 13% verified. The honest read today is that most answers will land at `partial` or `thin`, which is correct but leaves recall on the table for cases that are real and sound but unreviewed. The lift is editorial, not code: route the most-cited and most-retrieved cases through the existing pro bono review loop first, so the records the engine surfaces most often are the ones most likely to carry a confirmed flag. A small DB migration to return `human_confirmed` from the semantic RPC would then let fusion boost confirmed cases the same way it already boosts verified ones. That migration is flagged, not built here.

### 4.3 Expand and refresh the source feeds

32 active feeds already pull from HUDOC, CourtListener, BAILII, AustLII, CJEU, Refworld, and EDAL. The gaps the answers will expose are the ones to chase: thin Australian youth-justice case coverage relative to the 595 evidence rows, and the named external authorities that the gap path keeps pointing at because the Matrix does not yet hold them. The gap messages become a live worklist. Where the corpus keeps sending readers to HUDOC or Refworld for a recurring question, that is a feed to deepen or a discovery target to add.

---

## 5. Phased rollout

The build order is sequenced so each phase ships behind the additive contract and degrades to the previous floor. Nothing here pushes to the database except the human-run backfill, and nothing runs unattended.

**Phase 0, Schemas.** Add the query-plan and answer Zod schemas to `llm-schemas.ts`. No behaviour change; compiles standalone and unblocks every later step.

**Phase 1, Thread the dropped fields.** The `/search` payload already carries distance, precedent strength, verified, categories, and country code; the ask side discards them. Thread them onto the raw types and the citation. Tiny and safe, and it unblocks both confidence and amplification.

**Phase 2, Heuristic plan.** Build and unit-test `planQueryHeuristic` and the canonical category list against roughly a dozen questions before any model is wired in. This is the safety floor and it has no provider dependency and no fabrication path.

**Phase 3, Multi-query retrieval.** Replace the single retrieve with fan-out plus distance-minimum fusion, the retrieval-mix quotas, the verified-only re-rank, and the soft year post-filter. This is the real recall win on a sparse corpus and it needs no UI change.

**Phase 4, Structured answer.** Wire the citation-forced JSON prompt through the existing provider fetch, add `deriveConfidence`, the structured fallback, and the parser covering all three degrade paths. This is the anti-hallucination win.

**Phase 5, LLM plan path.** Add the model path in the query-understanding module, copying the theme-mapper template, with the sanitiser doing the surface override, evidence-lane gate, and AU-only country. It satisfies the all-LLM-output-is-Zod-validated rule and degrades cleanly to Phase 2.

**Phase 6, Amplification.** Build the nine amplify helpers and the single issues read, then wire the five amplification fields into the response. This turns a dead-end answer into real next moves.

**Phase 7, Backfill.** Run the embedding backfill on the 33 dark cases. Human-run, dry-run first. Makes the full 360-case corpus reachable.

**Phase 8, Client.** Upgrade `AskMatrixClient.tsx` to render the structured sections and the amplification block, falling back to the string answer. Last, because the additive contract keeps the old client working until it lands.

**Phase 9 (deferred, separate ship).** The content layer: 11 review-ready issue seed rows at `is_published=false`, curated editorial preambles, and discovery targets. Human-review-gated framing over real records. Not a blocker for the engine.

---

## 6. Future ideas backlog

Held for later, ordered roughly by leverage. None of these are in this ship.

- **Conversation memory.** Carry the prior turn so a follow-up like "and in the UK?" inherits the last plan instead of starting cold.
- **Confirmed-case fusion boost.** Once a DB migration returns `human_confirmed` from the semantic RPC, boost confirmed cases the way verified cases are already boosted.
- **Saved searches and issue-follow alerts.** Let a reader follow an issue and get notified when a new record lands against it, using the existing follow action as the seed.
- **Cross-jurisdiction thread cards.** The third-country-transfer thread (M70, AAA/Rwanda, N.S., Ilias and Ahmed, Innovation Law Lab) is one argument fought on four continents. A thread card would let a reader walk it as a path rather than reassemble it from search.
- **Story layer in the answer.** Empathy Ledger holds 200-plus stories. Surfacing a consented lived-experience account next to the law made about people like the teller is the asset no government portal can match. It belongs inside issue profiles first, then the answer.
- **Gap-driven discovery worklist.** Feed the recurring gap messages straight into the discovery queue so the questions readers keep hitting walls on become the next records ingested.
- **Quarterly state-of-protection briefs from live data.** The scaffold exists in `/digest` and `/insights`. A brief generated from the live corpus, with every figure sourced, is the one artifact a funder or OHCHR can read in a sitting.
- **Per-query retrieval telemetry.** Log intent, plan source, best distance, and confidence per question so the heuristic and the prompts can be tuned against real usage rather than guesses.

---

## 7. Boundaries that never move

- Never fabricate a case, campaign, outcome, holding, citation, source link, issue slug, related issue, gap deep-link, or follow-up grounded in something not retrieved. When no holding is stated, the held list stays empty. Gap authorities are name-only with a null href.
- Never auto-write any matrix row. The only permitted DB write is the backfill script updating the embedding column on existing rows, dry-run by default, human-run, never queued unattended.
- The consent gate on evidence is law. Community Controlled rows expose title and provenance only.
- Reuse the existing infrastructure. No new npm dependency, no new provider beyond Gemini, Groq, OpenAI, and OpenAI embeddings.
- Every answer keeps the boundary line in every branch: a research resource, not legal advice, read the source before acting on it.
- No em-dashes and no AI-vocabulary in any prompt, UI string, gap message, follow-up, or framing.
