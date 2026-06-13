# CONTAINED Campaign System, Completeness Critic Pass

> Read-only critic pass over the design deliverable set. Nothing executed. Compiled 2026-06-13.
> Scope read: `output/contained-campaign-system/10-segment-informedness-matrix.md` + the four `ground-0{1,2,3,4}` files + `compendium/brand-guide.md` §7 (figure cross-check). Weekday checks via `date`.

## Headline finding

The brief's index names FIVE design deliverables (files 10 through 14). Only **file 10** exists. Files 11, 12, 13, 14 were never written (confirmed: `ls output/contained-campaign-system/ | grep ^1[1-4]` returns nothing). The four `ground-0{1..4}` files are the INPUTS, explicitly self-labelled "for downstream creative + comms agents" (ground-02 line 1, ground-04 line 2), not the design deliverables. So 80% of the promised design set is missing, and the one delivered file (the segment matrix) serves exactly ONE of the user's four goals: "every GHL contact well-informed." The other three goals (campaign ideas, comms that support engagement, systems+routes work) have ground-truth research but NO design deliverable that turns that research into a plan.

The matrix itself is strong and honest within its scope. The gap is the missing four-fifths of the set.

---

## Issues (by severity)

### CRITICAL, four of five deliverables absent

The user's four goals map to the five planned files. With only file 10 present:

- **Goal "campaign ideas / creative":** NO deliverable. Ground-04 distils brand/voice/escalation-ladder (Witness→Nominate→Back→Share→Host→Fund→Document) and three action pillars, but nothing converts that into named campaign concepts, surface-by-surface CTA mapping, or the "distinct rung per surface" the ladder demands (ground-04 line 107). The raw material is there; the design move was never made.
- **Goal "comms that support engagement":** PARTIAL. File 10 prescribes a next-touch per segment, which is comms-adjacent, but there is no end-to-end engagement journey design (the escalation ladder as a wired sequence), no reconciliation of the two competing post-experience designs (ground-02 gap #4: stream-A5 vs the live cron), and no spec for the half-built welcome drip (emails 2/3 have no scheduler, ground-02 gap #5). These are named as gaps but no deliverable resolves them.
- **Goal "systems + routes work":** NO design deliverable. Ground-03 is an excellent as-built trace, but it stops at "here is the residual gap" (durable-first capture missing on signup/connect/host; pipeline-followup reads the wrong table; reengagement cron unscheduled; webhook checks the legacy 'Newsletter' tag). No file proposes the fix design for any of these. The user asked for "systems and routes work"; the set diagnoses, it does not design the remedy.

**Fix:** Either (a) write the four missing deliverables (11 = campaign-ideas/creative-surface map, 12 = engagement-journey + escalation-ladder wiring, 13 = systems/routes fix-design, 14 = launch-week run-of-show or consolidated action plan), or (b) if scope was deliberately cut to file 10 only, the index/summary must stop claiming "10..14" and say plainly that only the informedness matrix was produced. Right now the index over-promises against what shipped.

### CRITICAL, no consolidated systems-fix design despite seven named code defects

Across ground-02 and ground-03, seven concrete system defects are documented but NONE has a remediation design:
1. Durable-first capture missing on `/api/ghl/signup`, `/api/contained/connect`, `/api/contained/host` (the unfixed root cause of the 12 June loss, ground-03 lines 40, 58, 67, 125).
2. `pipeline-followup` cron reads `campaign_alignment_entities` not `campaign_nominations` (ground-03 line 8, ground-02 gap #9).
3. `contained/reengagement` route built but absent from `vercel.json` (ground-03 line 99).
4. Webhook `ContactTagUpdate` checks literal `'Newsletter'` not `comms:justicehub-newsletter` (ground-03 line 87).
5. `campaign/ghl-sync` emits LEGACY flat tags (CONTAINED/Newsletter/JusticeHub) not canon (ground-03 line 100).
6. GHL `upsertContact` runs BEFORE the DB insert on `/register` and swallows errors to null (ground-03 line 25).
7. Welcome drip 2/3 + pre-event drip have no scheduler (ground-02 lines 62, 64).

**Fix:** A file-13 systems-fix design that, for each defect, states the change, the blast radius (all Tier 1-2, code-only), the test, and the order. This is night-shift-safe work the user explicitly asked for ("make sure the systems and routes work") and it has no home in the current set.

### HIGH, EMAIL_ENABLED prod state gates the entire informedness plan and is never resolved

File 10's whole launch-week automated layer (event-confirm, post-experience, nurture, digest) and Part-5 row "Launch week 22-26 Jun" depend on `EMAIL_ENABLED=true`, marked [UNVERIFIED] in standing hazard 2. This is correctly flagged but it is a one-line human check (Vercel dashboard) that blocks the single most consequential runtime behaviour. No deliverable assigns it as a pre-launch gate item with an owner and a deadline.

**Fix:** Add a "Day-1 human verification block" (to whichever file becomes the action plan) listing the ~6 unverified prod values as named checklist items with an owner: `EMAIL_ENABLED`, `GHL_PRE_EVENT_WORKFLOW_ID`, `GHL_WELCOME_WORKFLOW_ID`, `GHL_WORKFLOW_{FUNDER,MEDIA,ORGANIZATION,SUPPORTER,LIVED_EXPERIENCE}`, `GHL_FUNDER_PIPELINE_ID`, `GHL_PARTNER_PIPELINE_ID`. Each can be confirmed read-only via Vercel dashboard. Until confirmed, the plan must state which touches silently no-op.

### HIGH, the engagement-driving demand-generation plan for Pipeline B is asserted, not designed

Standing hazard 4 and Row B1 correctly say Pipeline B holds zero real demand and "fill Pipeline B is the launch-week priority." But the deliverable names the demand generators (warm-invite stream + EOI links + Day-4 LinkedIn) without designing the conversion path: what the EOI landing experience says, how a walk-up at the container becomes a booking, what the waitlist mechanism is, or how many EOIs are needed to fill the 22-26 June windows. "Drive EOIs" is a goal, not a plan. This is the heart of the user's "comms that support engagement" goal and it is one sentence.

**Fix:** A demand-generation design: target booking capacity (slots x days), the EOI-to-booked funnel with each touch, the walk-up/QR/waitlist mechanism, and a daily fill-rate checkpoint during launch week. Without target capacity numbers the "priority" cannot be measured.

### HIGH, nominee orphan is named four times but never gets a build proposal

The nominee (the campaign's headline mechanic, ground-04 escalation ladder rung 2) is documented as a structural orphan in file 10 Row C2, ground-02 gap #3, and ground-03 line 48: the nominee never becomes a record and is never reached except by manual nightly triage that "can silently fail under event-week load." Every doc agrees it is the worst orphan. None proposes the lightweight fix (a nominee-tracking row + a manual-send checklist surfaced in `/admin/contained/flow`).

**Fix:** A minimal nominee-tracking design (read `campaign_nominations`, surface un-actioned nominees in the existing flow admin, a personal-invite checklist). This is Tier 1-2 code, night-shift-safe, and closes the campaign's signature gap. Note: this design must NOT auto-email nominees (consent + the by-design rule in nominations route line 48).

### MEDIUM, contradiction: file 10 says funder lane has had "zero personal touch," ground-04 says funder invites were a 13 June ops task

File 10 Row A1 and the brief summary both state the funder lane has had "zero personal CONTAINED touch." Ground-04 line 191 (the runway, sourced from the 12 June alignment doc) lists "decision-maker + funder invites" as a Fri 13 Jun ops task. These cannot both be current. Either the invites went out 13 June (so "zero touch" is stale by a day) or the 13 June task slipped (so the runway is aspirational). The deliverable does not reconcile its own input.

**Fix:** State the reconciliation explicitly: the runway is a PLAN (what was meant to happen 13 June), the "zero touch" is the OBSERVED GHL state ("outreach pending" in the CSV). If the 13 June funder-invite task is incomplete, that is itself the finding, and it should be the single most urgent line in the action plan, not buried as a contradiction between two files.

### MEDIUM, no deliverable addresses the conference-delegate physical-comms path it says is the only option

File 10 Row C1 and ground-04 segment 5 both conclude the only route to delegates until JRI provides an import is "physical/at-conference: printed nomination cards + a delegate booking QR JRI hands out." That printed-card + QR asset is named as the fallback but it is not in the comms inventory (ground-02 lists a nomination card A5 print as "drafted, on artifact tracker," but no delegate-specific booking QR card). The audience with the best proximity has a fallback that may not physically exist.

**Fix:** Confirm whether the delegate booking-QR card exists as an artifact; if not, it is a launch-blocking print asset (must be at the Adelaide printer by Wed 17 Jun per the runway). Add it to the artifact tracker or flag it as missing.

### MEDIUM, claims of "live / done" that depend on unverified runtime state

File 10 marks several touches "Ready" or "live" (event-confirm "live, clean"; nomination receipt "live"; post-experience cron "live"). These are live-in-CODE (verified by ground-03 file:line) but their actual SENDING is gated on `EMAIL_ENABLED` (unverified). "Live" conflates "code is deployed" with "email actually goes out." A reader could take "Ready" at face value and assume a registrant gets a receipt today.

**Fix:** Replace "Ready / live" with "live-in-code, sends only if EMAIL_ENABLED=true [unverified]" wherever a touch depends on the email kill switch. The distinction is load-bearing: with the switch off, every "Ready" row is silent.

### LOW, the two-competing-post-experience-designs contradiction is named but not decided

Ground-02 gap #4 flags two post-experience designs (drafted stream A5 vs the live cron) and says "reconcile which is canonical." File 10 Row A9 / B-Experienced relies on the live cron and ignores stream A5, which is an implicit decision (cron wins) but it is never stated as a decision. If a later agent wires stream A5, double-sends result.

**Fix:** State explicitly: the live `contained/post-experience` cron is canonical; the drafted stream A5 is superseded and must NOT be wired. One sentence prevents a double-send.

### LOW, social-publish guard is present but the action plan has no "do-not-trigger" gate list

Standing hazard 6 correctly flags `campaign/social-publish` as never-trigger. But the deliverable has no single consolidated "Tier-3 do-not-trigger in any planning/test pass" list (social-publish, any sendEmail cron while EMAIL_ENABLED=true, the GHL broadcast of the stale launch HTML). These are scattered across hazards 1, 2, 6. For an event-week operator under load, one list beats three scattered warnings.

**Fix:** A single boxed "NEVER trigger / NEVER send" list at the top of the action plan: (1) `campaign/social-publish`, (2) `output/email-contained-launch-ghl.html` broadcast, (3) any email cron unless EMAIL_ENABLED state is confirmed AND the figure scrub is done.

---

## Confirmed solid (checked, holds up)

- **Figure canon is correct.** File 10's §7 table (lines 21-27) matches `compendium/brand-guide.md` lines 165-167 exactly: $1.33M/$3,635 national, $3,261/day SA ROGS Table 17A.20, 84% within 12 months AIHW. The retired-list ($4,250, $1.55M, 73% Diagrama, 84%-within-2yr) is correctly quarantined. The dominant stale-figure risk is surfaced in standing hazard 1 and per-asset throughout.
- **Calendar labels are correct, NOT slipped.** Verified via `date`: 15 Jun = Monday, 16 Jun = Tuesday, 17 Jun = Wednesday, 18 Jun = Thursday, 23 Jun = Tuesday. File 10's "Mon 15", "Wed 17", "Thu 18" all check out, and "16 June go/no-go" + "doors open Tuesday 23 June" are right. The known 11-20 June off-by-one slip does NOT manifest in this deliverable.
- **GHL pipeline counts and stage IDs are live-verified** (ground-01, 13 June read-only): Engagement 78 (Identified 23 / Personal outreach 34 / In conversation 14 / Partner-committed 7), Adelaide 2 test records. File 10's segment rows reconcile to these counts.
- **Pollution-source discipline is correct throughout.** Every audience instruction says "source from KEEP CSV or live stage, never from `project:contained`," matching the memory note and the three-competing-conventions reality.
- **Read-only and name discipline held.** No write/send/trigger proposed as executed; "CONTAINED" never written as "The Contained"; the `#TheContained` tag conflict is resolved (raw tag only). Zero em-dashes in file 10. No AI-tell vocab spotted in the prose.
- **The "no segment left without a next touch" claim is true** for the segments file 10 covers, and the deliberate no-touch verdicts (169 cold pollution, 2 test records, 2 mis-tag inboxes) are correctly justified.

---

*End critic pass. The matrix is sound. The set is one-fifth built.*
