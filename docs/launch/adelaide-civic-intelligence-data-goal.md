# Adelaide Civic Intelligence Data Goal

## Pasteable Goal

Adelaide civic intelligence launch readiness

## Full Working Objective

Make the Adelaide exhibition civic intelligence system launch-ready by auditing every public data surface, closing the highest-risk youth justice data gaps, and making all claims traceable to source records across organisations, money, budgets, oversight, history, people and insights.

## Why This Goal Exists

The Codex app goal setter was failing because the local Codex `goals` feature was disabled, even though the UI still exposed the `/goal` path. The local config now has `features.goals = true`, but the already-running app-server may require a full Codex restart before the UI sees it. Keep this document as the real working brief if the goal UI remains unavailable.

The launch standard is not "perfect database". The launch standard is:

- public pages and kiosk views load reliably;
- every displayed claim has a source path;
- gaps are visible, not hidden;
- Adelaide and SA are strong enough for exhibition context;
- the national picture is credible across all states and territories;
- the next data work is obvious to any operator.

## Current Verified Baseline

Verified against production Supabase project `tednluwflfhxyucgwigh` and local civic route smoke on 2026-05-24 UTC.

### Core Register

| Area | Verified Count |
|---|---:|
| Organisations total | 104,422 |
| Active organisations | 104,416 |
| Active ACCO-certified organisations | 1,603 |
| Confirmed Tier 1 youth justice organisations | 148 |
| People | 83 |
| Person role holdings | 125 |

### Claims And Evidence

| Area | Verified Count |
|---|---:|
| Civic intelligence claims | 88 |
| Public verified or snapshot claims | 88 |
| Claims with source document URLs | 88 |
| Civic claim evidence rows | 250 |
| Triangulated claims | 60 |
| Corroborated claims | 28 |

### Money, Funding And Budgets

| Area | Verified Count |
|---|---:|
| Justice funding rows | 157,115 |
| Justice funding dollars tracked | $120,514,384,715.85 |
| Grant opportunities | 24,977 |
| Foundation grantee rows | 6,001 |
| Foundation rows classified for YJ relevance | 2,805 |
| Foundation rows marked YJ-relevant | 151 |
| PRF annual review rows imported | 83 |

### Oversight, History And Programs

| Area | Verified Count |
|---|---:|
| Oversight recommendations | 108 |
| Children Commissioner reports | 8 |
| Auditor-General audits | 8 |
| AIHW youth justice stats | 13 |
| Civic Hansard rows | 525 |
| Ministerial statements | 649 |
| Ministerial diary entries | 1,728 |
| Charter commitments | 75 |
| Government programs | 77 |
| Verified YJ interventions | 723 |

## Frontend Surfaces In Scope

Public civic pages:

- `/intelligence/civic`
- `/intelligence/civic/centre-of-excellence`
- `/intelligence/civic/data-quality`
- `/intelligence/civic/detention`
- `/intelligence/civic/foundations`
- `/intelligence/civic/government-programs`
- `/intelligence/civic/locale`
- `/intelligence/civic/locale/[slug]`
- `/intelligence/civic/locale/adelaide`
- `/intelligence/civic/state/[code]`
- `/intelligence/civic/orgs/[org-slug]`
- `/intelligence/civic/people`
- `/intelligence/civic/people/[slug]`
- `/intelligence/civic/claim/[id]`
- `/intelligence/civic/whats-new`
- `/intelligence/civic/print`
- `/intelligence/civic/methodology`

Kiosk and launch admin checks:

- `/admin/kiosk/status`
- `/admin/data-sufficiency`
- `/admin/data-sufficiency/findings`
- `/admin/civic/tier-1-curation`

## Source Tables That Feed The Civic Frontend

Claims and evidence:

- `civic_intelligence_claims`
- `civic_claim_evidence`
- `v_claim_evidence_summary`

Organisations:

- `organizations`
- `civic_org_classifications`
- `v_entity_360`
- `gs_entities`
- `alma_interventions`

Money:

- `justice_funding`
- `foundation_grantees`
- `grant_opportunities`
- `civic_funding_yj_classifications`
- `civic_consultancy_spending`

Oversight and history:

- `oversight_recommendations`
- `children_commissioner_reports`
- `auditor_general_audits`
- `aihw_youth_justice_stats`
- `civic_hansard`
- `civic_ministerial_statements`
- `civic_ministerial_diaries`
- `civic_charter_commitments`

People:

- `people`
- `person_role_holdings`
- `v_person_360`

Data sufficiency:

- `data_sources_inventory`
- `data_gap_questions`
- `data_agent_findings`
- `civic_metric_snapshots`

## Launch Readiness Criteria

### 1. Page Reliability

- Every route listed above loads without throwing.
- `/intelligence/civic/print` renders for the brief/PDF route.
- `/admin/kiosk/status` shows no red blocker for claim evidence, Tier 1 count or stories.
- Authentication redirects are expected for admin routes in production.

### 2. Claim Traceability

- `civic_intelligence_claims` has 100 percent source document URL coverage for public claims.
- `v_claim_evidence_summary` has no `no_evidence` public claim.
- Every headline stat on `/intelligence/civic`, `/detention`, `/state/[code]`, `/foundations` and `/centre-of-excellence` links to a claim page or methodology section.

### 3. Organisation Coverage

- Confirmed Tier 1 list is reviewed nationally.
- SA needs a manual launch pass because only 4 confirmed Tier 1 organisations are currently present.
- SA now has 11 dry-run review candidates, including 5 ACCO-certified candidates, exported to `artifacts/civic-launch-readiness/sa-tier1-curation-candidates.md`.
- ACT and TAS need manual passes because confirmed Tier 1 counts are 2 and 1.
- ACCO status must use `acco_certified`, not looser Indigenous-led heuristics.

### 4. Money And Budget Coverage

- Existing `justice_funding` totals can launch with caveats.
- State budget paper ingestion is the biggest missing lane:
  - SA Budget 2025-26 now has a dry-run DHS Youth Justice candidate artifact for the $49.668M net cost line, but it is not inserted into production yet;
  - ACT Budget 2025-26;
  - TAS Budget 2025-26;
  - WA Budget 2025-26;
  - NSW Budget 2025-26;
  - VIC Budget 2025-26;
  - NT Budget Paper 3 2025-26;
  - QLD Budget 2025-26 SDS.
- PRF annual review import is active, but PRF YJ classifications still need explicit production apply approval.

### 5. Oversight And Inquiry Coverage

- Strongest current coverage: National, VIC, QLD, NSW.
- Weakest current coverage:
  - ACT has 0 oversight recommendation rows but 1 Children's Commissioner evidence row;
  - TAS has 0 oversight recommendation rows but 1 Children's Commissioner evidence row;
  - WA has 0 oversight recommendation rows but 2 Children's Commissioner rows and 3 Auditor-General rows;
  - NT has 2 recommendation rows and 1 Children's Commissioner row;
  - SA has 2 recommendation rows but no Children's Commissioner or Auditor-General rows yet.
- Public state pages now surface the supporting commissioner/auditor evidence rows even when recommendation extraction is incomplete. A dry-run extractor has produced 17 ACT/TAS/WA structured recommendation candidates for source review in `artifacts/civic-launch-readiness/oversight-recommendation-candidates.md`. Before launch, review/apply those candidates, then add SA commissioner/auditor context or keep the state-page caveat visible.

### 6. History And People

- Hansard, ministerial statements, diaries and charter commitments are launchable.
- People backbone is good enough for a first launch but incomplete.
- Next people pass: extract board and responsible-person names from `acnc_charities.responsible_persons` for ACCO and Tier 1 organisations.

### 7. Data Sufficiency

- Active data sources exist across foundations, grants, government, orgs and oversight.
- Planned source backlog is still real:
  - 15 planned government sources;
  - 9 planned oversight sources;
  - 6 planned foundation sources;
  - 3 planned org sources;
  - 1 planned demographic source.
- Open or investigating gap backlog remains highest in foundations, government and oversight.

## Work Plan

### Phase 1 - Stabilise The Launch Data Story

1. Run route smoke checks for all public civic pages.
2. Verify `/admin/kiosk/status` readiness counters.
3. Export the current source-table map and data counts into the methodology or data-quality page if missing.
4. Make SA-specific caveats explicit on state and Adelaide-facing views.

### Phase 2 - Close The Highest-Risk Data Gaps

1. Ingest SA Budget 2025-26 youth justice allocations.
2. Ingest ACT, TAS, WA and SA oversight sources or mark the state pages with visible caveats.
3. Apply PRF YJ classifications after explicit approval.
4. Run the foundation classifier backlog until coverage is high enough to remove stale caveats.
5. Add Minderoo and Dusseldorp grant disclosure importers if source pages are parseable.

### Phase 3 - Deepen The National System Map

1. Backfill people and role holdings from ACNC responsible-person fields.
2. Add state budget paper parser for all jurisdictions.
3. Add coroner findings and Disability Royal Commission YJ progress sources.
4. Add police stop-and-search and disability overlay sources where available.

## Immediate Operator Commands

Run the repeatable civic launch readiness audit:

```bash
node scripts/audit/civic-launch-readiness-check.mjs
```

The audit writes:

- `artifacts/civic-launch-readiness/latest.md`
- `artifacts/civic-launch-readiness/latest.json`

If direct Postgres URLs fail locally, the audit falls back to the Supabase Data API through the service role key for read-only checks.

Add route smoke when a local or deployed app is available:

```bash
node scripts/audit/civic-launch-readiness-check.mjs --base-url http://127.0.0.1:3004
```

Latest local smoke run on 2026-05-24 used `http://127.0.0.1:3005` and passed with 0 blockers. It now checks representative dynamic org, person and claim pages as well as static civic pages. It verifies required caveat text on `/intelligence/civic/state/sa`, `/intelligence/civic/state/act`, `/intelligence/civic/state/tas`, `/intelligence/civic/state/wa` and `/intelligence/civic/locale/adelaide`, and the generated report now separates oversight recommendation rows from broader oversight evidence rows. Remaining warnings: thin SA Tier 1 coverage, 11 SA Tier 1/ACCO review candidates in the report and standalone artifact, 0 SA ACCO-certified Tier 1 rows until review/apply, 46.7 percent foundation classifier coverage with 3,196 unclassified rows across 163 queues, ACT/TAS/WA recommendation extraction still missing despite supporting evidence rows, 17 structured recommendation candidates ready for source review, SA broader oversight evidence missing children/visitor or Auditor-General source rows, SA Budget 2025-26 DHS Youth Justice aggregate not imported yet, 34 planned sources and 61 non-closed data gap questions.

Refresh the foundation classifier backlog artifact:

```bash
node scripts/civic/report-foundation-classifier-backlog.mjs
```

The backlog report writes:

- `artifacts/civic-launch-readiness/foundation-classifier-backlog.md`
- `artifacts/civic-launch-readiness/foundation-classifier-backlog.json`

Refresh the civic data backlog artifact:

```bash
node scripts/civic/report-civic-data-backlog.mjs
```

The backlog report writes:

- `artifacts/civic-launch-readiness/data-backlog.md`
- `artifacts/civic-launch-readiness/data-backlog.json`

Latest read-only production run on 2026-05-24 found 95 ranked action items: 34 planned sources, 61 non-closed gap questions, 41 high-priority non-closed gaps and 0 pending agent findings. The top launch lanes are money/budgets/spend, foundations, oversight/harm, frontline orgs/ACCO coverage and demographics/cohort overlays.

Refresh the consolidated Adelaide launch action queue:

```bash
node scripts/civic/report-adelaide-launch-action-queue.mjs
```

The queue writes:

- `artifacts/civic-launch-readiness/adelaide-launch-action-queue.md`
- `artifacts/civic-launch-readiness/adelaide-launch-action-queue.json`

Latest run on 2026-05-24 found 7 operator actions: 6 guarded production-write actions and 1 review-only data-sufficiency action. The priority-1 production-write lanes are SA Tier 1/ACCO proposals, SA Budget 2025-26 Youth Justice aggregate, and SA priority-1 children/visitor oversight report rows.

Refresh the SA Budget 2025-26 Youth Justice candidate artifact:

```bash
node scripts/civic/propose-sa-budget-yj-candidates.mjs
```

The dry run writes:

- `artifacts/civic-launch-readiness/sa-budget-yj-candidates.md`
- `artifacts/civic-launch-readiness/sa-budget-yj-candidates.json`

Latest dry run on 2026-05-24 found 1 missing recommended aggregate `justice_funding` row: SA Department of Human Services `Program 3: Youth Justice`, 2025-26 net cost of services, `$49.668M`, sourced to official SA Budget Paper 4 Volume 3. It did not write to production. Apply only after explicit approval:

```bash
node scripts/civic/propose-sa-budget-yj-candidates.mjs --apply --yes-production
```

The current top queues are FRRR by volume, PRF annual-review rows by launch priority, and small targeted Dusseldorp/Minderoo-adjacent queues when present. Run generated classifier commands without `--apply` first. Production classification writes require explicit approval.

Dry-run SA Tier 1 / ACCO curation candidates:

```bash
node scripts/civic/propose-sa-tier1-curation-candidates.mjs
```

The dry run writes:

- `artifacts/civic-launch-readiness/sa-tier1-curation-candidates.md`
- `artifacts/civic-launch-readiness/sa-tier1-curation-candidates.json`

Apply SA proposal rows only after explicit approval and source review. Applying writes unconfirmed proposals to `civic_org_classifications` for review in `/admin/civic/tier-1-curation`:

```bash
node scripts/civic/propose-sa-tier1-curation-candidates.mjs --apply --yes-production
```

Dry-run ACT/TAS/WA recommendation extraction candidates:

```bash
node scripts/civic/propose-oversight-recommendation-candidates.mjs
```

The dry run writes:

- `artifacts/civic-launch-readiness/oversight-recommendation-candidates.md`
- `artifacts/civic-launch-readiness/oversight-recommendation-candidates.json`

Apply those oversight candidates only after explicit approval and source review:

```bash
node scripts/civic/propose-oversight-recommendation-candidates.mjs --apply --yes-production
```

Dry-run SA oversight source candidates:

```bash
node scripts/civic/propose-sa-oversight-source-candidates.mjs
```

The dry run writes:

- `artifacts/civic-launch-readiness/sa-oversight-source-candidates.md`
- `artifacts/civic-launch-readiness/sa-oversight-source-candidates.json`

Latest read-only production run on 2026-05-24 found 6 official SA source candidates and 0 already indexed as `children_commissioner_reports`; the 3 priority-1 rows are the 2024-25 Guardian & Visitors Annual Report, 2025 Training Centre Visitor isolation special report and 2026 Training Centre Visitor AVL special report. These are source-ingest candidates only; ingest source text first, then extract explicit recommendations after review.

Dry-run SA oversight report rows:

```bash
node scripts/civic/propose-sa-oversight-report-rows.mjs --only priority1
```

The dry run writes:

- `artifacts/civic-launch-readiness/sa-oversight-report-rows.md`
- `artifacts/civic-launch-readiness/sa-oversight-report-rows.json`

Latest dry run on 2026-05-24 downloaded and parsed the 3 priority-1 official PDFs with `pdftotext`, found 3 missing `children_commissioner_reports` candidate rows, generated deterministic key-finding snippets, and inserted 0 rows. Apply only after explicit approval:

```bash
node scripts/civic/propose-sa-oversight-report-rows.mjs --apply --yes-production
```

Dry-run SA oversight recommendation candidates:

```bash
node scripts/civic/propose-sa-oversight-recommendation-candidates.mjs
```

The dry run writes:

- `artifacts/civic-launch-readiness/sa-oversight-recommendation-candidates.md`
- `artifacts/civic-launch-readiness/sa-oversight-recommendation-candidates.json`

Latest dry run on 2026-05-24 extracted 14 explicit recommendation candidates from the 3 priority-1 PDFs: 2 from the 2024-25 annual report, 3 from the isolation special report and 9 from the AVL special report. It found 0 already indexed and inserted 0 rows. Apply only after explicit source review and approval:

```bash
node scripts/civic/propose-sa-oversight-recommendation-candidates.mjs --apply --yes-production
```

Dry-run PRF classification only:

```bash
node scripts/civic/classify-foundation-grants-yj.mjs --foundation-abn 32623132472 --extraction-method prf_annual_review_partner_list,prf_annual_review_llm --batch 83 --samples 15
```

Apply PRF classification only after explicit approval:

```bash
node scripts/civic/classify-foundation-grants-yj.mjs --foundation-abn 32623132472 --extraction-method prf_annual_review_partner_list,prf_annual_review_llm --batch 83 --apply --yes-production
```

Refresh source row counts:

```bash
node scripts/civic/run-data-digest.mjs --hours 24
```

Run focused checks after code edits:

```bash
node --check scripts/audit/civic-launch-readiness-check.mjs
node --check scripts/civic/report-adelaide-launch-action-queue.mjs
node --check scripts/civic/report-civic-data-backlog.mjs
node --check scripts/civic/report-foundation-classifier-backlog.mjs
node --check scripts/civic/propose-sa-budget-yj-candidates.mjs
node --check scripts/civic/propose-sa-oversight-source-candidates.mjs
node --check scripts/civic/propose-sa-oversight-report-rows.mjs
node --check scripts/civic/propose-sa-oversight-recommendation-candidates.mjs
node --check scripts/civic/propose-sa-tier1-curation-candidates.mjs
node --check scripts/civic/propose-oversight-recommendation-candidates.mjs
node --check scripts/civic/classify-foundation-grants-yj.mjs
npx tsc --noEmit --pretty false --skipLibCheck --moduleResolution bundler --module ESNext --target ES2022 src/lib/ai/llm-schemas.ts
```

## Known Blockers

- The Codex backend goal is active as `Adelaide civic intelligence launch readiness`. If the desktop UI still shows "Failed to set goal", do not keep retrying the setter; continue from this active thread goal and this launch brief.
- The app codebase does not contain the exact "Failed to set goal" string, so this is not a JusticeHub frontend error.
- `npm run type-check:intelligence` recently hung with no diagnostic output. Use file-scoped checks until the lane is investigated.
- Production DB writes require explicit approval. Do not classify, migrate or import more rows just because this document says they are needed.

## Definition Of Done

The launch data goal is done when:

- every civic route in scope has been smoke-tested;
- every public claim has source documents and a claim page path;
- SA/Adelaide context is strong enough for the exhibition, or caveats are visible;
- Tier 1, ACCO, funding, foundation, oversight, people and history counts are documented;
- open gaps are prioritised rather than buried;
- the next operator can pick up from this document without reading the whole conversation.
