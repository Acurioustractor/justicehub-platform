# CONTAINED, Engagement Journey + Launch-Week Demand Generation

> GOAL: comms that support engagement. This file designs the WIRING that moves contacts through both live pipelines and FILLS the empty Adelaide booking funnel for launch week (Tue 23 June 2026, doors open, Kaurna Yarta / Adelaide; experience window 22-26 June).
>
> Compiled 2026-06-13. READ-ONLY planning artefact. Nothing here was sent, written, migrated, triggered, or mutated. Live GHL pipeline state verified read-only 13 June (ground-01). Live code paths traced to file:line (ground-02, ground-03, and direct reads of `src/content/newsletter-sequences.ts`, `src/app/admin/contained/flow/page.tsx`, `src/app/api/cron/contained/nurture/route.ts`, `src/app/api/projects/[slug]/nominations/route.ts`, `src/lib/email/send.ts`). Every dollar figure carries a source+year+jurisdiction or is marked [UNVERIFIED]. Every build item is Tier-labelled.
>
> This is the design deliverable the completeness critic (file 15) named as HIGH-priority-missing: the Pipeline-B demand-generation plan, the welcome/pre-event drip scheduler, the nominee-tracking surface, and the stage-progression logic. It turns file 10's per-segment next-touch list into an end-to-end wired journey.

---

## How to read this document

- **Pipeline A = CONTAINED Engagement** (`vzatUY4dwN8t63ZoFIpH`), the wide relationship front door. 78 live opps (Identified 23, Personal outreach 34, In conversation 14, Partner/committed 7; five stages empty).
- **Pipeline B = CONTAINED Adelaide 2026** (`SxzINmfZMjvqAMPmFCKa`), the scarce booking funnel. 2 live opps, both internal test records. **Zero real demand 10 days out. Filling B is the launch-week priority.**
- **Segment refs** (S-A1, S-A4, S-C2 etc.) point at the rows in `10-segment-informedness-matrix.md`. Every touch below ties to one.
- **Tier labels** follow the action-tier rules: Tier 1 = local code/docs (night-shift safe), Tier 2 = shared-state reversible (post "about to do X" first), Tier 3 = external system-of-record write / send (explicit human verb, day-shift only).
- **Canonical figures (brand-guide §7, OVERRIDES the bible).** Detention cost national avg **$1.33M/yr ($3,635/day)** and SA / Kurlana Tapa **$3,261/day ($1.19M/yr)**, both Productivity Commission ROGS 2024-25 Table 17A.20. Return to sentenced supervision **84% within 12 months** (AIHW 2023-24). Indigenous kids about **23x** more likely to be in detention (national youth detention statistics). Alternatives **$75/day** (Community Services Benchmark Study 2024). Tour stop **$30K**, new container build **$50-70K** (CONTAINED Campaign Budget). Diagrama (Spain) **13.6%** reoffending / **€5.64 per €1** social return needs partner sign-off before any public use (qualitative only until cleared). RETIRED, never reuse: `$4,250/day`, `$1.55M/yr`, `73% Diagrama`, `84% within 2 years`, `23.1x`. **Prefer linking `/contained/brief` over quoting a number.** Nothing with a number ships until source+year+jurisdiction are locked.

---

## THE THREE RUNTIME GATES THAT GOVERN EVERY AUTOMATED TOUCH BELOW

Every "fires from code" element in this design is silent unless these are true in Vercel prod. None is verified in this read-only pass. A human confirms each before relying on any automated send.

| Gate | Where | If unset/false | Owner check |
|---|---|---|---|
| `EMAIL_ENABLED=true` | `src/lib/email/send.ts:38` | EVERY `sendEmail` call returns `null` silently. Every receipt, drip, nurture, post-experience email is a no-op. The 12-June "submitted and got no reply" symptom recurs for everyone. | Vercel dashboard, read-only. Single most consequential value. |
| GHL configured (`isConfigured()`) | `send.ts:44` | Same, silent skip. | Vercel env, read-only. |
| `CRON_SECRET` | every cron `GET` guard | Cron returns 401, never runs. | Vercel env, read-only. |

If `EMAIL_ENABLED` is **false**, the entire demand-generation plan below runs on PERSONAL (one-to-one, human-sent) email only. That is actually the safer default for launch week, see §1. The scheduler (§2) and nominee surface (§3) are designed to degrade gracefully: they still queue and surface work for a human even when the kill switch is off, they just do not auto-send.

---

# PART 1, DEMAND GENERATION FOR 22-26 JUNE (fill the empty Pipeline B)

The booking funnel holds zero real demand. This part designs how it fills, with a target, a funnel, a walk-up mechanism, and a daily checkpoint.

## 1.1 Target booking capacity (STATE THE ASSUMPTION)

**Assumption (not yet confirmed by Ben, treat as the planning baseline, [UNVERIFIED] against the real Adelaide site roster):**

- The container holds **one person walking through at a time** (the experience is solo, per the event-confirm copy: "You walk through alone", `newsletter-sequences.ts:140`).
- Walk-through length: **30 minutes inside**, plus changeover. Plan **3 slots per hour** (20-min cadence: 10 in the rooms, walk-pace, brief reset).
- Operating window per day: assume a **6-hour public window** (e.g. 10:00-16:00) on the four full experience days, with launch-day Tue 23 June running a shorter ceremonial-plus-public window.

| Day | Date | Window (assumed) | Bookable slots (3/hr) | Notes |
|---|---|---|---|---|
| Launch | Tue 23 Jun | 11:00-16:00 (5h, launch + media) | ~15 | Some slots reserved for media windows + VIP/decision-maker invitees |
| Day 2 | Wed 24 Jun | 10:00-16:00 (6h) | ~18 | Reintegration Puzzle conference next door (delegate walk-ups) |
| Day 3 | Thu 25 Jun | 10:00-16:00 (6h) | ~18 | Conference day 2; media interview windows Wed/Thu am |
| Day 4 | Fri 26 Jun | 10:00-16:00 (6h) | ~18 | Final public day |
| (Mon 22 Jun) | Mon 22 Jun | build + soft preview | ~6 (preview only) | Host/greeter training; partner + builder family previews, consent-checked |

**Planning target: ~70-75 bookable public slots across 23-26 June** (plus ~6 Monday preview). Reserve roughly **a third for personal/VIP/decision-maker invites** (S-A1 funders, S-C2 nominees, S-A4 hot leads) and leave the rest for warm-public EOIs + walk-ups. So the **demand we must generate is on the order of 45-55 confirmed bookings from the open channels**, on top of the ~20-25 personally-held VIP slots.

**This is a planning frame, not a venue fact.** Ben confirms the real daily window, the real changeover time, and whether two people can be in different rooms at once (which would roughly double capacity). Every number in the table is [UNVERIFIED] until the Adelaide site roster is locked. The funnel below works at any capacity, the slot count just sets the daily fill-rate target.

## 1.2 The EOI to Booked funnel (each touch: who / what / when / channel / segment)

The conversion path runs through Pipeline B's stages, which already exist (ground-01 §1). Each stage gets a defined touch. Personal sends do not need the bulk go/no-go gate, only the site-scrub PR landed + §7 figures; bulk stream sends need the 16 June go/no-go + Ben preview.

| # | Funnel step | Pipeline B stage | Who does it | What | When | Channel | Segment (file 10) |
|---|---|---|---|---|---|---|---|
| 1 | **Generate the EOI** | (pre-pipeline) | Campaign | Drive people to `/contained/eoi`. Three demand engines, see §1.3. | Mon 15 - Sun 22 Jun, daily | LinkedIn, personal email, QR, stream | S-C7 warm public, S-A4 hot, S-A1 funders, S-C2 nominees |
| 2 | **EOI lands** | Captured (`f8d2acd7`) | Automatic | `/contained/eoi` → `/api/ghl/register` writes `event_registrations` + GHL opp at Captured with `experience:eoi` canon tags. EOI receipt email fires (`eoiReceipt`), **if EMAIL_ENABLED**. | On submit | transactional | the EOI-submitter |
| 3 | **Enrich** | Needs enrichment (`9b0d68a5`) | Ben (evening triage) | 5-min look: who are they, are they SA, decision-maker, warm-public. Add `place:sa` only if SA. | Nightly, same day | manual | all EOIs |
| 4 | **Review / eligibility** | Warm - review (`07942700`) | Ben | The human gate. Decide: offer a slot, waitlist, or decline. This IS the eligibility gate in pipeline form. | Nightly | manual | all EOIs |
| 5 | **Personal invite + slot** | Personal invite (`d98cb7a7`) | Ben / relationship owner | Personal email referencing what THEY wrote, offering 2-3 specific slot times. Template 7 body / first-contact opener 1, §7 figures, link `/contained/brief` not a number. | Within 24h of review | one-to-one email | matched to their role |
| 6 | **Booking link sent** | Booking link sent (`bc4251de`) | Ben | Slot times → a booking link pointing at `justicehub.com.au/contained/adelaide`. Watch for the booking. | Same touch as 5 | one-to-one email | - |
| 7 | **Booked** | Booked (`db5d37e7`) | Automatic on confirm | event-confirm transactional email fires (`event-confirm`, CLEAN, Adelaide-correct, `newsletter-sequences.ts:131`), **if EMAIL_ENABLED**. | On booking | transactional | the booker |
| 8 | **Pre-event nudge** | Booked | Scheduler (PART 2) | `event-story` (delayDays -3) + `event-dayof` drips, **if EMAIL_ENABLED + scheduler built**. Until then, a manual reminder. | T-3 days, day-of | drip / manual | the booker |
| 9 | **Experienced** | Experienced (`acbdf4cd`) | Automatic | post-experience cron (24h/7d/30d off `community_reflections`), **if EMAIL_ENABLED + a reflection with email left**. | Post-walk | cron | walked-through |
| 10 | **Activated** | Activated (`f9365cf1`) | Automatic + manual | Nomination receipt + share tile (live). The escalation-ladder payoff (Witness→Nominate→Back→Share→Host→Fund→Document). | After action | transactional + manual | activated |

**The conversion bottleneck is step 4-5 (Ben's nightly review + personal invite), not the form.** During launch week that human step is the scarce resource. PART 3's nominee surface and the digest (7am) are what keep it from silently failing under load.

## 1.3 The three demand engines (what actually drives EOIs into Captured)

1. **Personal replies + EOI links (highest yield, lowest risk).** Every personal reply to S-A4 inbound hot leads (14, "asked about the container, never told it is happening"), S-A1 funders (14 KEEP), and S-C2 nominees carries the `/contained/eoi` link. These people already raised a hand; an EOI link in a personal reply converts far better than any broadcast. Send by **Mon 15 June** (file 10 Part 5). No gate beyond site-scrub + §7. Segment: S-A4, S-A1, S-C2.
2. **The warm-public invite stream (the cleanest bulk channel).** The ~28-34 `newsletter-stream:contained-adelaide-invite` contacts (S-C7), all inbound + gatePass. Template 7 (NOT the superseded `output/contained-stream-emails.md` body, NOT stream emails 3/4/5 which carry retired figures). Fires **after the 16 June go/no-go + eligibility gate + Ben preview + §7 scrub**, target window Wed 17 - Thu 18 June. Bulk = Tier 3 (external send). Segment: S-C7.
3. **The LinkedIn arc (top-of-funnel, public).** Day-4 post "Maria's question + EOI opens" (Wed 17 Jun) and Day-9 scarcity "last call" (Mon 22 Jun) drive cold-to-warm traffic to `/contained/eoi`. Manual daily LinkedIn post by Ben/Nic. Day-2 numbers post is BLOCKED on stat-tile §7 regeneration. Segment: top-of-funnel → becomes S-C7.

**Do NOT** drive demand by emailing the polluted ~272 (`project:contained` tag pull returns S-C5 cold-network 169 + org-wall + tests). Audience always sourced from the KEEP CSV or a live pipeline stage, never a tag query.

## 1.4 Walk-up / QR / waitlist mechanism (for capacity overflow + on-site demand)

The conference next door (Reintegration Puzzle, 24-25 June) and the public siting mean walk-ups are the second-biggest demand source after personal invites. Design:

- **On-container QR → `/contained/eoi`** (or a dedicated `/contained/adelaide` booking view). A walk-up scans, submits an EOI, lands in Captured exactly like a remote EOI. Same canon tags, same receipt. **Tier 1** to add the QR asset (it is a poster/graphic, AI-generation allowed, brand §7). The QR must encode the live URL only, no PII.
- **A same-day walk-up slot board** at the container: a small number of slots per day held UN-booked for walk-ups (e.g. 2-3/day from the table in §1.1), filled first-come by a greeter/host with a clipboard or a tablet open to the booking view. The host writes the walk-up into the booking view → Booked. **Operational, not code.**
- **Waitlist when a day is full.** When a day's slots are gone, the EOI form still accepts submissions; they land in Captured and Ben's review (step 4) offers the next available day or the waitlist. A simple rule: **full-day EOIs default to "Future city / partner" (`7dee91e5`) or the next open day**, never a silent drop. The event-confirm copy already tells booked people their exact time comes closer to the week, so a held EOI is honest.
- **Delegate booking QR card (S-C1 conference delegates).** The delegate audience is BLOCKED on a JRI import (no automated path). The only route is JRI handing out a printed booking-QR card inside the conference. **The completeness critic (file 15, MEDIUM) flags this card may not physically exist yet.** Confirm with Hannah March by Wed 17 June; if it does not exist it is a launch-blocking print asset. Segment: S-C1.

## 1.5 Daily fill-rate checkpoint (so "priority" becomes measurable)

A 5-minute daily read, sourced from the live `/admin/contained/flow` board (it already shows Pipeline B counts by stage, live from GHL). No new dashboard needed for launch.

| Checkpoint (daily, evening, through launch week) | Source | Healthy | Action if behind |
|---|---|---|---|
| EOIs in Captured today | flow board, Adelaide column row 1 | rising daily 15-22 Jun | If flat: fire engine 1 (more personal replies) + check the EOI form is actually reachable (post-12-June-outage, forms have a 15s timeout + fail-loud fallback, commit 6dc96bb9) |
| Captured + Needs-enrichment backlog | flow board rows 1-2 | cleared nightly to <5 | If piling up: Ben's nightly review is the bottleneck, pull a second reviewer |
| Booked count vs day's slots | flow board "Booked" row vs §1.1 target | ≥70% of slots filled 24h ahead | If <50% the day before: open walk-up slots wider, push the scarcity LinkedIn post, personally re-offer to warm EOIs sitting in Warm-review |
| Walk-up slots remaining | host clipboard / booking view | some held each day | If exhausted by midday: that is success, note it for the next city |

**Fill-rate target rule of thumb:** to fill ~50 open-channel bookings across four days you need roughly **2-3x that many EOIs** (not everyone converts, some are interstate, some want a different city). So **drive toward ~120-150 EOIs in Captured across 15-22 June** to comfortably fill the funnel. That is the single number to watch on the flow board. [Conversion ratio assumed, not measured, the campaign has no prior EOI→booked baseline.]

---

# PART 2, THE WELCOME / NURTURE DRIP SCHEDULER (design, gated on EMAIL_ENABLED)

## 2.1 The problem (verified)

- `welcomeSequence` has three emails (`welcome-1` delayDays 0, `welcome-2` delayDays 3, `welcome-3` delayDays 7, `newsletter-sequences.ts:29-119`). **Only `welcome-1` fires** (from `/api/ghl/newsletter` on signup). Emails 2 and 3 have NO scheduler. They never send. (ground-02 gap #5.)
- `preEventSequence` has `event-confirm` (delayDays 0, fires on `/register`), `event-story` (delayDays **-3**, i.e. 3 days before the event), and `event-dayof` (`newsletter-sequences.ts:125-200`). **Only event-confirm fires.** `event-story` and `event-dayof` have no scheduler. (ground-02 line 64.)
- The PROVEN pattern already exists in the repo: `/api/cron/contained/nurture` (read at `nurture/route.ts:35-120`) runs daily, computes `daysSinceJoin`, checks `member_actions` for already-sent email ids, and fires the next due email via `sendEmail` (gated on EMAIL_ENABLED inside `send.ts`). **The welcome + pre-event drips should reuse this exact pattern, not invent a new one.**

**CRITICAL before wiring:** `welcome-2` and `welcome-3` bodies carry RETIRED figures ($26.4B, $1.55M/yr, "84% within 2 years", $4,250/day, "$75 vs $4,250", "84%→3%", ALMA "939/527/489", `newsletter-sequences.ts:46-117`). `welcome-1` is equally stale. **Do not schedule these until the bodies are regenerated to §7.** Building the scheduler and fixing the copy are two separate jobs; the scheduler must not go live pointing at stale copy. This is the dominant hazard.

## 2.2 The scheduler design (Tier 1 to build, Tier 3 to enable)

**Shape: one new cron, `/api/cron/contained/drip`, modelled byte-for-byte on the nurture cron.** Daily, `CRON_SECRET`-guarded, EMAIL_ENABLED-gated (the gate lives inside `sendEmail`, so it is automatic).

```
GET /api/cron/contained/drip   (daily, e.g. "0 8 * * *" UTC, before the 21:00 digest)

For the WELCOME drip:
  source = newsletter signups (newsletter_subscriptions, the durable row /api/ghl/newsletter writes)
  for each signup:
    daysSinceSignup = floor((now - created_at) / 1 day)
    sentIds = ids in member_actions (or a drip_log) where action_type='drip_email', user/email matches
    for email in [welcome-2 (delay 3), welcome-3 (delay 7)]:
      if email.id in sentIds: continue
      if daysSinceSignup < email.delayDays: break   // not due, stop (ordered)
      sendEmail(...)   // no-op if EMAIL_ENABLED!=true
      record action_type='drip_email', email_id, sent_at   // idempotency

For the PRE-EVENT drip:
  source = event_registrations where metadata.event_name includes CONTAINED and has a session/event date
  event_story uses delayDays -3 → fire when (eventDate - now) <= 3 days AND not sent
  event_dayof → fire when date(now) == date(eventDate) AND not sent
  same sentIds idempotency guard
```

**Why this shape:**
- Reuses the nurture cron's idempotency model (`member_actions` / a `drip_log` row keyed on email_id) so a daily re-run never double-sends. This is the single most important property: **idempotent, re-runnable, no double-send.**
- The EMAIL_ENABLED gate is inherited for free (it lives in `sendEmail`). With the switch off, the cron runs, logs "skipping send", records nothing, and is a safe no-op. With it on, it sends. The human flips one env var to go live.
- Negative `delayDays` (event-story `-3`) means "before the anchor date", so the pre-event branch keys off the EVENT date, not the signup date. That is why pre-event is a separate branch, the welcome branch keys off signup `created_at`.

**Build items:**
| Item | Tier | Note |
|---|---|---|
| Create `src/app/api/cron/contained/drip/route.ts` (copy nurture pattern) | Tier 1 | Code only, no send until enabled |
| Add a `drip_log` table OR reuse `member_actions` with `action_type='drip_email'` | Tier 1 (migration) | Verify columns first per CLAUDE.md schema rule; `member_actions` reuse avoids a migration |
| Register the cron in `vercel.json` | Tier 2 | Shared config, post "about to add cron" first; it is inert while EMAIL_ENABLED is false |
| Regenerate welcome-1/2/3 + verify event-story/event-dayof bodies to §7 | Tier 1 | **Blocks enabling.** No stale figure ships. |
| Flip `EMAIL_ENABLED=true` in Vercel prod | **Tier 3** | Day-shift, explicit human verb. Turns on EVERY automated email at once, confirm the figure scrub is done first. |

**Do NOT** enable the drip and the bulk launch broadcast in the same change. Enable the kill switch only after every body that can fire is §7-clean, because flipping it makes welcome-1 (stale today) send to new signups immediately.

## 2.3 Reconcile the two post-experience designs (one-line decision the critic asked for)

The live `/api/cron/contained/post-experience` cron (24h/7d/30d off `community_reflections`) is **canonical**. The drafted "stream A5 post-experience activation" in `output/contained-stream-emails.md` is **SUPERSEDED, do not wire it.** Wiring both = double-send. This drip scheduler covers welcome + pre-event ONLY; it must not touch post-experience.

---

# PART 3, THE NOMINEE-TRACKING SURFACE (in /admin/contained/flow)

## 3.1 What exists (verified by reading the page)

`/admin/contained/flow/page.tsx` already:
- Reads `campaign_nominations` (lines 99-103): `nominee_name, nominee_title, nominee_org, reason, nominator_name, created_at`, last 200, newest first.
- Renders a "Nominees (never auto-emailed, on purpose)" panel (lines 224-261) that de-dupes by `nominee_name`, counts nominations per nominee, and red-flags anyone with **3+ nominations** (the escalation threshold).

So the surface PARTLY exists. The gap the critic named (file 15, HIGH): it lists nominees but does not distinguish **un-actioned** (no personal invite sent yet) from **already-actioned**, so under event-week load a nominee can sit unseen between the 200 rows. The headline campaign mechanic can silently fail.

## 3.2 The consent rule (load-bearing, do NOT break)

The live nominations route (`/api/projects/[slug]/nominations/route.ts`) emails the **nominator and the team only**. The **nominee is never emailed** (verified: the only `sendEmail` calls go to `cleanNominatorEmail` and `TEAM_EMAIL`; the route comment at the team-alert says "The nominee is never emailed"). Inserts carry `is_public: false` (moderation gate). **The nominee surface must NEVER auto-email a nominee.** Its entire job is to surface un-actioned nominees so a HUMAN sends a personal invite, warranted by the nominator's relationship. This matches file 10 Row C2 and the by-design rule.

## 3.3 The minimal build (Tier 1, read-only surface + one nullable column)

**Design: extend the existing nominee panel into an "un-actioned nominees" worklist.** Two small pieces:

1. **One nullable column on `campaign_nominations`: `actioned_at timestamptz null` (and optionally `actioned_by text null`).** This is the ONLY schema change. It records when a human marked a nominee "personal invite sent". Default null = un-actioned. (Verify current columns first with `information_schema.columns` per CLAUDE.md, then a single additive migration, **Tier 1** to write the migration file, **Tier 3** to apply it to prod, day-shift.)

2. **A worklist view in the flow page**, derived from the data already fetched:
   - De-dupe by `nominee_name` (the page already does this).
   - **Un-actioned** = no row for that nominee has `actioned_at` set. Surface these in a dedicated "Needs a personal invite" list at the TOP, sorted by nomination count desc (3+ first, the escalation threshold), then by oldest `created_at` (longest-waiting first).
   - Each row shows: nominee_name, title/org, category, nomination count, the strongest `reason`, and the nominator(s) (so the human knows whose relationship warrants the invite). A "Mark invited" control sets `actioned_at = now()` via a small admin-only POST. **That POST writes ONLY `actioned_at`/`actioned_by`. It sends NOTHING. It never touches the nominee's email.**
   - **Actioned** nominees collapse into a secondary "Already invited" list, kept visible for audit but out of the worklist.

**What the surface explicitly does NOT do:**
- It does not auto-email the nominee (consent gate, route L48 / by-design).
- It does not write to GHL or create a nominee opportunity automatically (file 10 Row C2: a nominee becomes an Engagement record at Identified only when a human personally invites them, tagged by role + `source:nomination`, documented for the human to apply).
- It does not publish nominee message text (that stays behind the existing moderation queue, `is_public:false`).

**Build items:**
| Item | Tier | Note |
|---|---|---|
| `actioned_at` (+ `actioned_by`) nullable column migration file | Tier 1 | Additive, verify schema first |
| Apply migration to prod | **Tier 3** | Day-shift, explicit verb |
| Worklist render in `flow/page.tsx` (un-actioned first, 3+ first, oldest first) | Tier 1 | Reads data already fetched |
| "Mark invited" admin POST (writes `actioned_at` only, no send) | Tier 1 (build) | requireAdmin; writes one column; never emails |
| Personal-invite checklist text on the page (template 1 decision-maker invite, soft nomination reference) | Tier 1 | Copy only; §7 figures; link `/contained/brief` |

## 3.4 The manual invite process the surface supports (file 10 Row C2)

Nightly, through launch week: open the worklist → for each un-actioned 3+ nominee, send **template 1 (decision-maker personal invite)** softly referencing the nomination ("someone who works alongside you asked us to make sure you were invited"), with the `/contained/eoi` or a private 30-min slot offer → mark invited → (if they reply) create an Engagement record at Identified tagged `role:policy`/`role:court`/`role:political` + `source:nomination` (a human applies the tag). Continuous, nightly, never automated to the nominee. Segment: S-C2.

---

# PART 4, STAGE-PROGRESSION LOGIC (what moves a contact, each stage, both pipelines)

For every transition: the EVENT that triggers it, whether it is automatic or human, and the touch that fires. Personal touches need no gate beyond site-scrub + §7. Automated emails need EMAIL_ENABLED. Stage moves in GHL are **Tier 2** (shared-state, reversible) and are documented for a human, none is executed here.

## 4.1 Pipeline A, CONTAINED Engagement

| From → To | Trigger event | Auto or human | Touch that fires | Segment |
|---|---|---|---|---|
| (new) → **Identified** | A contact is created via signup/nomination/import, OR a nominee is personally invited | Automatic (form) / human (nominee) | Receipt email if a form (EMAIL_ENABLED); none for a logged nominee | S-A1, S-A2, S-C2 |
| Identified → **Personal outreach** | Ben decides to reach out (funder lane, supporter) | Human | Template 2 (funder) / opener 1 or 3 (supporter/researcher), personal, by Mon 15 Jun | S-A1, S-A2 |
| Personal outreach → **In conversation** | They reply, OR an org-wall org confirms (move `org-wall:invited`→`org-wall:approved`) | Human | Personal reply, audience-matched; for org-wall, wall-consent yes logged | S-A3 |
| In conversation → **Invited to experience** | Ben offers a specific slot | Human | Personal invite + `/contained/eoi` or booking link; pairs with a calendar hold | S-A4 |
| Invited to experience → **Experienced** | They walk through 22-26 Jun | Human (logged) | post-experience cron starts the 48h debrief window (EMAIL_ENABLED + reflection) | S-A4 |
| Experienced → **Follow-up / debrief** | 48h debrief window | Human (relationship) | Personal debrief, "what will you do next" (advocate conversion). Keep manual launch week | S-A4 |
| any → **Partner / committed** | Money, hosting, or partnership on the table | Human | Bespoke stewardship (Imagination Architect voice). Diagrama (S-A5) gets wording-approval, NOT a recruitment invite | S-A5, S-A6, S-A7 |
| In conversation → **Future city** | Interstate contact says "bring it here" | Human (logged) | Future-cities frame from the first-contact pack; **no capture asset exists**, log manually (named gap) | S-A4 interstate |
| any → **Parked / closed** | Declines or goes cold | Human | None; move here rather than leaving misleadingly active | - |

**Note on Partner/committed reclassification:** the 12 June triage proposed moving Diagrama x5 + Just Reinvest + JRI/Hannah out of Partner/committed. Live still shows 7. This is a human DECISION, not a drift to auto-apply (file 10 Rows A5-A7). Recommendation stands: keep Diagrama and JRI in Partner/committed (they are committed/partner), reconcile Just Reinvest against the "no movement signal" note. Documented, not moved.

## 4.2 Pipeline B, CONTAINED Adelaide 2026

| From → To | Trigger event | Auto or human | Touch that fires | Segment |
|---|---|---|---|---|
| (new) → **Captured** | `/contained/eoi` → `/api/ghl/register` (`experience:eoi`), OR a QR walk-up EOI | Automatic | EOI receipt (EMAIL_ENABLED) | S-C7, walk-ups |
| Captured → **Needs enrichment** | EOI missing detail | Human (nightly triage) | none; 5-min research | EOI-submitter |
| Needs enrichment → **Warm - review** | Enriched, ready for the eligibility decision | Human | none; this IS the eligibility gate | EOI-submitter |
| Warm - review → **Personal invite** | Ben decides to offer a slot | Human | Personal invite referencing what they wrote, 2-3 slot times, §7 | matched role |
| Personal invite → **Booking link sent** | Slot times sent | Human | Booking link → `justicehub.com.au/contained/adelaide` | - |
| Booking link sent → **Booked** | They book / confirm a slot | Automatic on confirm | event-confirm transactional (CLEAN, EMAIL_ENABLED) | the booker |
| Booked → (pre-event) | T-3 days; day-of | Scheduler (PART 2) | event-story (-3), event-dayof (EMAIL_ENABLED + drip built); manual reminder until then | the booker |
| Booked → **Experienced** | They walk through | Human (logged) | post-experience cron 24h/7d/30d (EMAIL_ENABLED + reflection with email) | walked-through |
| Experienced → **Activated** | They nominate / back / share | Automatic + human | nomination receipt + share tile (live); escalation-ladder payoff | activated |
| Activated → **Post-week nurture** | After the event | Scheduler/cron | role nurture cron (EMAIL_ENABLED) | post-event |
| any → **Future city / partner** | Wants it in their city, OR a full-day EOI overflow | Human (logged) | future-cities frame; **no capture asset** (same gap as A11) | interstate |
| any → **Closed / no contact** | No slot this time | Human | None; they stay warm in Engagement | - |

**Walk-up fast path:** a QR walk-up enters at Captured exactly like a remote EOI, then a host can move them straight to Booked on a held same-day slot (skipping the nightly review, because the host is doing the eligibility check in person). The only stage that MUST stay human-gated is the eligibility decision (Warm-review), and a trained host satisfies it on-site.

---

# PART 5, THE WIRED ESCALATION LADDER (engagement as one sequence)

The campaign's engagement spine is the ladder: **Witness → Nominate → Back → Share → Host → Fund → Document** (ground-04). Each rung needs a distinct surface + a tracked next step. Today some rungs have no capture. This maps each rung to its live wiring + the gap.

| Rung | Surface / CTA | Lands as | Next step | Gap |
|---|---|---|---|---|
| **Witness** | `/contained/eoi` (be inside) | Captured (Pipeline B) | nightly review → personal invite | none, the funnel above |
| **Nominate** | `/contained#nominate` → `campaign_nominations` | nominator = Engagement Identified; nominee = surfaced in PART 3 worklist | human personal invite to the nominee | nominee orphan, CLOSED by PART 3 |
| **Back / Fund** | `/back-this` | (donation) | funder lane stewardship | funder-lane personal touch (S-A1), by Mon 15 Jun |
| **Share** | nomination share tile (live) + share blurbs | social reach | re-share / amplify | live, working |
| **Host** | template 6 to youth-org LEADERS (never the young people) | greeter-org leaders | recruit + roster paid hosts before 22 Jun | **launch-blocking if org leaders not reached this week** (S-C4) |
| **Document** | story/consent surfaces (Empathy Ledger) | consented stories | publish with consent | consent gates not cleared for young builders, do NOT claim "consent confirmed" |

**The two rungs at risk for 23 June:** Host (paid greeters must be recruited via org leaders this week, an operational not comms gap, S-C4) and the nominee personal-invite path (Nominate rung, closed by PART 3's surface). Both are human-warranted, neither is automatable.

---

# PART 6, THE LAUNCH-WEEK RUN SHEET (so a human can act)

| When | What | Who | Tier | Gate |
|---|---|---|---|---|
| **Now, read-only** | Confirm `EMAIL_ENABLED` + `CRON_SECRET` + GHL config in Vercel | Ben | Tier 1 (read) | - |
| **Mon 15 Jun** | Personal replies to S-A4 hot (14) + S-A1 funders (14) + S-A2 supporters, each carrying the `/contained/eoi` link | Ben | Tier 3 (send) | site-scrub + §7 |
| **This week, urgent** | Template 6 to youth-org LEADERS (paid host recruitment) | Ben | Tier 3 | personal |
| **By Wed 17 Jun** | Working call with Hannah March / JRI: lock delegate booking link + confirm the delegate QR card physically exists | Ben | Tier 3 | - |
| **By Wed 17 Jun** | Template 3 media pitch (interview windows Wed/Thu) | Ben | Tier 3 | §7; consent rules |
| **Wed 17 Jun** | LinkedIn Day-4 "EOI opens" post | Ben/Nic | Tier 3 | - |
| **By Thu 18 Jun** | Template 4 + phone to S-A3 SA org wall for Room 3 wall-consent (before the build) | Ben | Tier 3 | wall-consent before build |
| **After 16 Jun go/no-go (Wed 17-Thu 18)** | Template 7 warm-public invite stream (NOT the superseded body) | Ben | Tier 3 (bulk) | go/no-go + eligibility + Ben preview + §7 |
| **Build, this week (night-shift safe)** | Drip cron (PART 2) + nominee worklist + `actioned_at` column (PART 3), code only | dev/agent | Tier 1 | do NOT enable EMAIL_ENABLED in the same change |
| **Before enabling any auto-send** | Regenerate welcome-1/2/3 + verify all drip bodies to §7 | Ben/dev | Tier 1 | blocks the EMAIL_ENABLED flip |
| **Daily, evening, 15-26 Jun** | Fill-rate checkpoint (§1.5) off the flow board; nightly EOI review; nominee worklist | Ben | Tier 1-2 | - |
| **Mon 22 Jun** | LinkedIn Day-9 scarcity "last call" → EOI | Ben/Nic | Tier 3 | - |
| **22-26 Jun** | Walk-up QR live; host fills held slots; post-experience + nomination receipt fire | host / auto | mixed | EMAIL_ENABLED for the auto pieces |

---

# NEVER TRIGGER / NEVER SEND (single consolidated guard, for the event-week operator)

1. **`campaign/social-publish` cron** (daily 21:00 UTC) posts to 7 real public social accounts + mutates Notion. Highest blast radius. NEVER trigger.
2. **`output/email-contained-launch-ghl.html` broadcast** carries retired figures, wrong dates, a removed community name. DO NOT SEND.
3. **Any email cron / drip / EMAIL_ENABLED flip** unless the §7 figure scrub is done AND a human has decided to go live. Flipping EMAIL_ENABLED turns on welcome-1 (stale today) immediately.
4. **The nominee surface NEVER emails a nominee.** It surfaces them for a human. Consent gate, route L48.
5. **Stream emails 3/4/5 + the superseded template-7 stream body** carry retired figures. Use the email-templates §7 body, §7 figures only.
6. **No audience pull from a `project:contained` tag query** (returns the polluted ~272). Source from the KEEP CSV or a live pipeline stage.

---

*End. Engagement journey + demand generation designed end-to-end. Every touch tied to a file-10 segment, every build Tier-labelled, every automated element gated on EMAIL_ENABLED. Nothing executed, sent, migrated, or triggered. All proposals documented for a human to apply.*
