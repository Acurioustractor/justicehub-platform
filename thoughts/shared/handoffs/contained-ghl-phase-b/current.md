---
date: 2026-06-09T00:00:00Z
session_name: contained-ghl-phase-b
branch: main
status: complete-merged
---

# Work Stream: contained-ghl-phase-b

## Ledger
<!-- This section is extracted by SessionStart hook for quick resume -->
**Updated:** 2026-06-09
**Goal:** Migrate CONTAINED CTAs to the canonical GHL contract + build 4 capture-gap forms + wire the GHL native-calendar CTA. Done when JusticeHub code emits canonical tags for every CONTAINED CTA, type-check passes, and the 4 gaps capture into GHL. JusticeHub repo. Tier 1 code only.
**Branch:** main (create a feature branch first, e.g. `feat/contained-canonical-ghl`)
**Test:** `npm run type-check` (ignore database.types.ts errors)

### Now
[x] **Feature 1 (7-route migration) DONE + committed `f16db31e`.** All CONTAINED CTA capture routes emit canonical tags.
[x] **GAP #16 (nominate form) DONE + committed `6f6eec06`.** GAP #8/#9/#12 verified done (no code needed).
[x] **GAP #18/#21 (host/back form) DONE + committed `fcc0d4f5`.** Branded back/host toggle at `/contained#back-this-tour`; back→canonical backers route (role:supporter), host→new `/api/contained/host` (role:partner + gated PARTNER-pipeline opportunity). "Host the Container" card → `#host-the-container`. Added `GHL_PIPELINES.PARTNER`.
[x] **GAP #20 (funder/partner/media connect form) DONE + committed `bb0e37c9`.** Branded role toggle at `/contained/act#connect`; new `/api/contained/connect` (role:funder|partner|media + gated FUNDER/PARTNER opportunity + routing emails to benjamin@act.place via threaded `emailFrom`). Added `GHL_PIPELINES.FUNDER`.
[x] **Calendar CTA DONE + committed `cb973197`.** "Book your walk-through time" CTA on register step 3, gated on `NEXT_PUBLIC_GHL_CONTAINED_CALENDAR_URL` (RC4 native Calendar). Phase D env vars documented in `.env.example`.
[x] **Phase B SHIPPED + MERGED.** Branch `feat/contained-canonical-ghl` pushed; **PR #44 MERGED into main 2026-06-09T05:45Z** (merge commit `e8f6e675`). type-check clean throughout (0 new errors; 52 pre-existing ALMA-cron errors unrelated). All session files lint clean. NO live GHL writes shipped: opportunities no-op until Phase D pipeline env vars set; emails no-op unless EMAIL_ENABLED=true; calendar CTA hidden until its env var set.
[->] **NEXT = Phase D only (NOT now).** Live GHL: the ~260-contact canonical-tag migration (RC3 additive-then-strip), GHL native-calendar + pipeline + custom-field creation, smart-list segments, automations, any send. Tier 3, day-shift, human-in-loop, gated to the **16 Jun go/no-go**. Do NOT start autonomously. The wrong-direction colon→underscore `tag-normalize` artifact in `output/ghl-contained-adelaide-audit/` must NOT be applied.
[x] **Phase D PREP DONE (Tier 1, no live writes) 2026-06-09.** Two push-button artifacts authored + lint-clean + self-test green, NOTHING executed:
  - `scripts/contained-ghl-phase-d-migrate.mjs` — RC3 additive-then-strip migration. **Dry-run is the default + read-only**; writes require `CONTAINED_PHASE_D_APPLY=yes-write-live-ghl` + confirm flag; two separate passes (`--apply` additive, then `--strip` after UI verify) ARE the additive-then-strip guarantee; `--self-test` validates the planner offline (3/3 pass). Per-contact plan mirrors the shipped register CONTAINED branch: ADD `project:act-jh`+`source:event:contained`+`interest:justice-reform`+`place:sa`(+`engagement:warm` only if no `engagement:*`, RC2); STRIP `project:contained`+`project:contained-adelaide-2026`; PRESERVE all role/comms/engagement/source/interest + flat `contained-*`; `role:*` never invented (→ `needsRoleReview` list). Asserts colon-namespace only (cannot emit the underscore wrong-turn).
  - `thoughts/shared/handoffs/contained-ghl-phase-b/phase-d-runbook.md` — full day-shift checklist: 9 custom fields to create (else writes silently drop), Partner/Funder/Steward pipelines + `*_STAGE_NEW` env vars, native calendar, consolidated Phase D env, migration command sequence, post-migration verification, do-NOT-apply tag-normalize banner.
  - Live inventory grounded (read-only): 260 contacts on `project:contained`+`project:contained-adelaide-2026`; CRM already on colon namespace; **no** `cohort:`/`newsletter-stream:`/`source:form` tags and **no** `place:*` tags exist yet → migration is narrow + clean.

### This Session (alignment — DONE)
- [x] GHL prereq probe (custom fields, pipeline, eligibility) — read-only, verified
- [x] Eligibility verification (113 eligible / 2916 blocked) — JH PR #43 merged
- [x] Reconciled the CONTAINED tag conflict → ruling **R4 canonical wins** (Ben)
- [x] Built act-global alignment: handoff + `config/campaigns/contained-adelaide-2026.json` + dry-run validator → act-global **PR #149** (open, rulings-locked)
- [x] **RC1-RC4 locked** (see Decisions)
- [x] Merged JH PRs #39-43; cleaned branches; main synced

### Next (Phase B build — JusticeHub, Tier 1 code)
- [x] **Migrated `/api/ghl/register` CONTAINED branch**: now `project:act-jh` + `source:event:contained` (NO city, R5) + `interest:justice-reform` + `place:<x>` (STATE_TO_PLACE) + canonical role (RC1 map) + `engagement:warm`; lived-experience→`lane:community`+`role:storyteller`+comms/workflow suppressed; artist→`+interest:storytelling`; newsletter→`comms:justicehub-newsletter` only if opt-in AND not community lane; `cohort:`→`cohort` custom field + `newsletter_consent` field. Dropped `project:contained`/`project:contained-adelaide-2026`/`source:form`/legacy GHL_TAGS. Non-CONTAINED branch UNCHANGED.
- [x] **Migrated 6 legacy routes** (scope was bigger than ledger — the `projects/[slug]/*` routes also emitted legacy GHL_TAGS, and 2 are GAP-form targets): `contained/reaction`, `contained/mp-letter`, `projects/[slug]/{nominations,backers,reactions,tour-stories}`. All → base3 + role (storyteller for reflection/story; supporter for nominate/back/write-MP). backers PARTNER→supporter (RC1 fix). nominations `nominated`→`nominated_person` field. `contained/tour-stories` has NO GHL emit — no change. NOT in scope (left as-is): crons (RC2 lifecycle layer), `admin/partner-pipeline`, `hub/actions`.
- [x] **GAP build #16 DONE** — `NominateForm` component (`src/app/contained/tour/nominate-form.tsx`) rendered in place of the empty `<section id="nominate"/>`. Brand-compliant (locked palette + IBM Plex Mono, matches reaction-form pattern). POSTs to `/api/projects/the-contained/nominations` (canonical: role:supporter + nominated_person). Honeypot guard, inline success → nominations wall. Committed `6f6eec06`.
- [x] **GAP #8/#9/#12 DONE (verify, no new code)** — only the email-capturing in-experience widget (`share/story-form.tsx` → `/api/projects/the-contained/tour-stories`) creates a GHL contact, and Feature 1 already made it canonical (role:storyteller, no comms). `/api/contained/reflections` (name only, no email) and `/api/contained/stories/submit` (private EL draft, device-enrolled) correctly create NO GHL contact — OCAP-safe by design. Nothing to build.
- [ ] **GAP build #18/#21 (NOT started)** — host/backer form (Host the Container / Back the Tour). Backer half: `projects/[slug]/backers` already canonical (role:supporter) — just needs a brand form. Host half: needs `role:partner` + GHL **opportunity** creation (new route or extend backers; opportunity gated on Phase D pipeline/stage env vars, guard like signup's `GHL_PIPELINES.STEWARD`). Existing surfaces: `/contained/help`, `/contained/invest`, action cards at `tour-content.tsx:866-901` (currently Links).
- [ ] **GAP build #20 (NOT started)** — funder/partner/media routed form. `mailto:` lives at `act-content.tsx:197` (+ help/invest). Needs a NEW API route: `role:funder|partner|media` + opportunity + email reply-to `benjamin@act.place`. Heaviest item (new route + opportunity + email routing + brand form).
- [ ] Wire the GHL native-calendar CTA on the booking step (env var / placeholder URL until the calendar is created in Phase D)
- [ ] `npm run type-check`; branch + PR

> **Session checkpoint (2026-06-09):** Feature 1 (7-route migration) committed `f16db31e`; GAP #16 committed `6f6eec06`; GAP #8/#9/#12 verified done. Branch `feat/contained-canonical-ghl` NOT pushed. Remaining #18/#21 + #20 + calendar are fresh-context work (new routes + GHL opportunities + brand forms) — recommend `/clear` before continuing.

> **Session checkpoint (2026-06-10):** Phase D prep (Tier 1, no live writes) committed **locally** as `74cc447d` on `main` — **NOT pushed** (`main` is ahead of origin/main by 1). Two artifacts: `scripts/contained-ghl-phase-d-migrate.mjs` (dry-run-default, gated additive-then-strip, `--self-test` 3/3, lint clean) + `thoughts/shared/handoffs/contained-ghl-phase-b/phase-d-runbook.md` (day-shift checklist). NOTHING executed against live GHL. **Resume note:** Phase D execution stays gated to the 16-Jun go/no-go (Tier 3, day-shift, human-in-loop) — do NOT start autonomously. Pushing `74cc447d` is Tier 3 (push to main) and needs an explicit go from Ben; offer a branch+PR instead. Working tree clean; safe to `/clear`.

### Decisions (locked)
- **R4 (2026-06-09):** CONTAINED conforms to the canonical one-account contract. NOT `project:contained`/`cohort:`/`newsletter-stream:`.
- **RC1:** Professional→partner. `service_org`/`practitioner`/`policymaker`→`role:partner`; `advocate`/`artist`/`student`→`role:supporter` (artist also `interest:storytelling`); researcher/media/funder/community 1:1; lived-experience→`lane:community`+`role:storyteller`.
- **RC2:** keep `engagement:`/`campaign-stage:` as the lifecycle layer (no migration).
- **RC3:** strip `project:contained-adelaide-2026` after adding canonical (additive-then-strip) — that's a Tier-3 GHL migration, NOT Phase B code.
- **RC4:** GHL native Calendar (not embedded form).
- **R5 (2026-06-09, Ben):** CONTAINED source tag is **no-city** `source:event:contained` (NOT city-suffixed). Matches the 3 already-shipped canonical routes (signup/contact/contained-nominations). Adelaide is encoded by `place:sa`. Future CONTAINED cities share one campaign source, distinguished by `place:`. → resolves the source-constant open question; no constant change, no edits to the 3 shipped routes.

### Open Questions
- RESOLVED (R5): source constant stays `source:event:contained` (no city). No change to `GHL_CANONICAL.SOURCE_EVENT_CONTAINED`.
- UNCONFIRMED: the GHL native-calendar URL does not exist yet (Phase D, gated to 16 Jun). Phase B wires the CTA to an env var / placeholder.
- Phase B does NOT touch live GHL. The ~260-contact tag migration, calendar/pipeline/custom-field creation, automations, sends = Phase D (Tier 3, day-shift, gated to 16 Jun go/no-go).

### Workflow State
pattern: build-and-iterate
phase: 1
total_phases: 2
retries: 0
max_retries: 3

#### Resolved
- goal: "Migrate CONTAINED CTAs to canonical GHL + build 4 capture-gap forms + wire calendar CTA"
- resource_allocation: balanced

#### Unknowns
- source_event_constant_city_suffix: UNKNOWN (verify GHL_CANONICAL)
- calendar_url: UNKNOWN (Phase D, gated)

#### Last Failure
(none)

---

## Context

### The canonical CONTAINED contract (do not re-derive)
Every CONTAINED contact, regardless of CTA: `project:act-jh` + `source:event:contained-adelaide` + `interest:justice-reform` + `role:<canonical>` + `place:<state>`. Lived-experience → `lane:community` + `role:storyteller` (never auto-enrolled into `comms:*`; automation suppressed even on a newsletter tick — OCAP R3). Newsletter = `comms:justicehub-newsletter`, granted ONLY with `newsletter_consent=Yes` (Spam Act). The build spec's "6 streams" are smart-list SEGMENTS keyed on canonical tags, NOT 6 new `comms:` tags.

5-layer model: DESCRIBE (identity, never sends) · SEGMENT (smart-lists) · ENROL (`comms:`, consent only) · ACT (workflows) · GATE (consent + community-line). Golden rule: identity tags never trigger a send; only `comms:` does, granted by a consent-capturing form.

### Why R4 (the conflict it resolved)
The codex-merged `/register` route emits `project:contained`/`source:form`/`newsletter-stream:contained-adelaide-invite` (non-canonical). signup/newsletter/contact/help already emit `project:act-jh` (PR #38). So `project:` was split and "all CONTAINED contacts" segmentation was broken. R4 fixes it: campaign identified by `source:event:contained-adelaide` over a `project:act-jh` base. `GHL_CANONICAL` already exists in `src/lib/ghl/client.ts` (~655-700), so most routes are already canonical; only `/register` CONTAINED branch + legacy `reaction`/`tour-stories` need migrating.

### Key references
- **CTA inventory (full 24, file:line cited):** `thoughts/shared/handoffs/contained-cta-ghl-inventory.md` (this repo) — the source of the task list above.
- **Alignment handoff + canonical config (act-global, PR #149):** `/Users/benknight/Code/act-global-infrastructure/thoughts/shared/handoffs/general/2026-06-09_contained-cta-ghl-alignment.md` and `/Users/benknight/Code/act-global-infrastructure/config/campaigns/contained-adelaide-2026.json`.
- **GHL UI build spec (to re-base onto canonical, Phase D):** `output/contained-ghl-ui-build-spec.md`.
- **Eligibility verification (113/2916):** `output/ghl-contained-adelaide-audit/eligibility-verification-2026-06-09.md`.
- **Canonical constants:** `src/lib/ghl/client.ts` — `GHL_CANONICAL`, `STATE_TO_PLACE`, `MEMBER_TYPE_TO_ROLE`. Legacy (do not extend): `GHL_TAGS`, `STATE_TO_TAG`.

### Tier discipline (hard)
Phase B = Tier 1 code in JusticeHub → branch push Tier 2 → PR/merge/deploy Tier 3. **NO live GHL writes in Phase B.** All live GHL (tag migration on the 260, custom-field/calendar/pipeline creation, automations, any send) = Phase D, Tier 3, day-shift, human-in-loop, gated to the 16 Jun go/no-go. There is a wrong-direction colon→underscore `tag-normalize` artifact in `output/ghl-contained-adelaide-audit/` — DO NOT apply it.

### Cross-repo state
- JusticeHub: `main` synced; PRs #39-43 merged; this handoff + the CTA inventory are uncommitted working files.
- act-global-infrastructure: PR #149 open (`codex/contained-cta-ghl-alignment`), config `rulings-locked`; in-flight `wip/contained-crm-p0-2026-06-08` has the campaign-CRM plan (P0-P4) this aligns with.
