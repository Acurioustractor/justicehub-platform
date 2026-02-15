# Sprint 1 Workboard (Short-Cycle Cadence)

Updated: 2026-02-15

Sprint window: **Monday, February 16, 2026 -> Friday, February 27, 2026**

Cadence: **2-day cycles** with review gate at end of each cycle.

Cycle review packet:
- `/Users/benknight/Code/JusticeHub/docs/systems/SPRINT_1_CYCLE_1_PURPOSE_MATRIX.md`
- `/Users/benknight/Code/JusticeHub/docs/systems/SPRINT_1_VISUAL_PAGE_MAP.md`
- `/Users/benknight/Code/JusticeHub/docs/systems/LIVE_PAGES_AND_DATA_ALIGNMENT.md`
- `/Users/benknight/Code/JusticeHub/docs/systems/SPRINT_1_CYCLE_2_PAGE_OWNERSHIP.md`
- `/Users/benknight/Code/JusticeHub/docs/systems/SPRINT_1_CYCLE_2_REVIEW_GATE.md`
- `/Users/benknight/Code/JusticeHub/docs/systems/SPRINT_1_CYCLE_3_API_CONTRACT_REGISTER.md`
- `/Users/benknight/Code/JusticeHub/docs/systems/SPRINT_1_CYCLE_3_REVIEW_GATE.md`
- `/Users/benknight/Code/JusticeHub/docs/systems/SPRINT_1_CYCLE_4_DATA_MODEL_OWNERSHIP.md`
- `/Users/benknight/Code/JusticeHub/docs/systems/SPRINT_1_CYCLE_4_REVIEW_GATE.md`
- `/Users/benknight/Code/JusticeHub/docs/systems/SPRINT_1_CYCLE_5_GAP_CLOSURE_AND_SPRINT_2_BACKLOG.md`
- `/Users/benknight/Code/JusticeHub/docs/systems/SPRINT_1_CYCLE_5_REVIEW_GATE.md`

## Cycle Plan

1. **Cycle 1 (Feb 16-17): Purpose Alignment**
- Lock route-family purpose statements.
- Confirm primary user outcomes by area (`services`, `community-programs`, `intelligence`, `stories`, `admin`).
- Review gate output: approved purpose matrix.

2. **Cycle 2 (Feb 18-19): Page Ownership**
- Confirm each live page owner domain (`service`, `program`, `intelligence`, `content`, `admin`).
- Mark pages as `canonical`, `compatibility`, or `legacy surface`.
- Review gate output: approved page ownership map.

3. **Cycle 3 (Feb 20-23): API and Contract Ownership**
- Map each priority page to canonical API endpoint.
- Flag non-canonical data paths and compatibility adapters.
- Review gate output: approved page -> API contract map.

4. **Cycle 4 (Feb 24-25): Data Model Ownership**
- Classify tables/views: `canonical`, `supporting`, `legacy`.
- Confirm join-table rules for ALMA linkages.
- Review gate output: approved table classification matrix.

5. **Cycle 5 (Feb 26-27): Gap Closure + Sprint 2 Backlog**
- Finalize Sprint 1 gap list and acceptance checks.
- Write Sprint 2 implementation backlog from approved gaps.
- Review gate output: Sprint 1 sign-off and Sprint 2 ready list.

## Review Format (Every Cycle)

1. What changed since last gate.
2. What is still ambiguous.
3. Decisions to lock now.
4. Explicit next cycle scope.

## Decision Log

| Date | Decision | Scope | Status |
|---|---|---|---|
| 2026-02-15 | Use visual route map as Sprint 1 alignment baseline | Pages and APIs | Locked |
| 2026-02-15 | Use 2-day review cadence | Sprint operating model | Locked |
| 2026-02-15 | Lock `/api/basecamps` as canonical Basecamp feed (fallbacks are resilience only) | CoE + Basecamp alignment | Locked |
| 2026-02-15 | Lock CoE purpose as national scaling infrastructure grounded in community-led Basecamp proof | Product purpose | Locked |
| 2026-02-15 | Publish Cycle 3 API contract register and review gate for endpoint stability lock | API ownership | Locked |
| 2026-02-15 | Publish Cycle 4 data model ownership matrix and review gate for table/view ownership lock | Data model ownership | Locked |
| 2026-02-15 | Publish Cycle 5 gap closure + Sprint 2 backlog + sign-off gate | Sprint transition | In Review |

## Sprint 1 Exit Criteria

- Every priority page has a locked purpose.
- Every priority page has a canonical API path.
- Every canonical API has a locked primary table/view source.
- Every known gap is converted into Sprint 2 backlog items with acceptance checks.

## Per-Cycle Validation Commands

Run with environment configured (DB + service role keys where required):

1. `npm run audit:runtime-schema`
2. `npm run check:no-hardcoded-supabase-keys`
3. `npm run check:frontend-smoke`
4. Smoke APIs:
   - `/api/services`
   - `/api/programs`
   - `/api/community-programs`
   - `/api/intelligence/interventions`
   - `/api/basecamps`
