---
date: 2026-06-09T00:00:00Z
session_name: contained-ghl-phase-b
branch: main
status: active
---

# Work Stream: contained-ghl-phase-b

## Ledger
<!-- This section is extracted by SessionStart hook for quick resume -->
**Updated:** 2026-06-09
**Goal:** Migrate CONTAINED CTAs to the canonical GHL contract + build 4 capture-gap forms + wire the GHL native-calendar CTA. Done when JusticeHub code emits canonical tags for every CONTAINED CTA, type-check passes, and the 4 gaps capture into GHL. JusticeHub repo. Tier 1 code only.
**Branch:** main (create a feature branch first, e.g. `feat/contained-canonical-ghl`)
**Test:** `npm run type-check` (ignore database.types.ts errors)

### Now
[->] Phase B not started. First task: migrate `/api/ghl/register` CONTAINED branch to canonical (the one big migration).

### This Session (alignment — DONE)
- [x] GHL prereq probe (custom fields, pipeline, eligibility) — read-only, verified
- [x] Eligibility verification (113 eligible / 2916 blocked) — JH PR #43 merged
- [x] Reconciled the CONTAINED tag conflict → ruling **R4 canonical wins** (Ben)
- [x] Built act-global alignment: handoff + `config/campaigns/contained-adelaide-2026.json` + dry-run validator → act-global **PR #149** (open, rulings-locked)
- [x] **RC1-RC4 locked** (see Decisions)
- [x] Merged JH PRs #39-43; cleaned branches; main synced

### Next (Phase B build — JusticeHub, Tier 1 code)
- [ ] **Migrate `/api/ghl/register` CONTAINED branch** (`src/app/api/ghl/register/route.ts:113-154`): `project:contained`→`project:act-jh`; `source:form`→`source:event:contained-adelaide`; drop `project:contained-adelaide-2026`; `state:<x>`→`place:<x>` (use `STATE_TO_PLACE`); add `interest:justice-reform`; `newsletter-stream:contained-adelaide-invite`→`comms:justicehub-newsletter` (only if `newsletter_consent`); align role via canonical map; lived-experience→`lane:community`+`role:storyteller`+suppress comms/workflow; `cohort:<x>`→drop tag, set `cohort` custom field. **Keep the non-CONTAINED branch (other events) unchanged.**
- [ ] Migrate legacy routes to canonical: `/api/contained/reaction` (route uses GHL_TAGS `Reacted`/`CONTAINED`/etc), tour-stories (`/api/projects/the-contained/tour-stories` + `/api/contained/tour-stories`)
- [ ] **GAP build #16** — render a Nominate-a-Leader form on `/contained#nominate` (currently empty `<section id="nominate"/>` at `tour-content.tsx:861`) → POST `/api/projects/[slug]/nominations`; canonical tags + `nominated_person` field
- [ ] **GAP build #18/#21** — host/backer form (Host the Container / Back the Tour) → canonical `role:partner`(host)/`role:supporter`(backer); host offer → GHL opportunity
- [ ] **GAP build #20** — replace funder/partner/media `mailto:` with a routed form → `role:funder|partner|media` + opportunity; reply-to `benjamin@act.place`
- [ ] **GAP build #8/#9/#12** — in-experience reflection/story widgets: upsert a canonical contact only when name/email attached (`role:storyteller`, `lane:community` if lived-exp, NO `comms:`)
- [ ] Wire the GHL native-calendar CTA on the booking step (env var / placeholder URL until the calendar is created in Phase D)
- [ ] `npm run type-check`; branch + PR

### Decisions (locked)
- **R4 (2026-06-09):** CONTAINED conforms to the canonical one-account contract. NOT `project:contained`/`cohort:`/`newsletter-stream:`.
- **RC1:** Professional→partner. `service_org`/`practitioner`/`policymaker`→`role:partner`; `advocate`/`artist`/`student`→`role:supporter` (artist also `interest:storytelling`); researcher/media/funder/community 1:1; lived-experience→`lane:community`+`role:storyteller`.
- **RC2:** keep `engagement:`/`campaign-stage:` as the lifecycle layer (no migration).
- **RC3:** strip `project:contained-adelaide-2026` after adding canonical (additive-then-strip) — that's a Tier-3 GHL migration, NOT Phase B code.
- **RC4:** GHL native Calendar (not embedded form).

### Open Questions
- UNCONFIRMED: `GHL_CANONICAL` in `src/lib/ghl/client.ts` may have `SOURCE_EVENT_CONTAINED = source:event:contained` (no city). R4 wants `source:event:contained-adelaide` (city-suffixed) — add the city-suffixed constant.
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
