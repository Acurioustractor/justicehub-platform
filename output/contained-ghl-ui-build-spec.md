# CONTAINED Adelaide 2026 - GHL UI Build Spec

For the person building the pipeline, automations, and streams in the GoHighLevel UI.
Everything the code/API cannot create lives here. Built from the agreed plan
(`thoughts/shared/plans/contained-crm-machinery.md`) and the live CRM probe (2026-06-09).

Launch: 22-26 June 2026. Hard go/no-go: 16 June.

## Ground rules (read first)

1. **Tag convention is colon.** The live CRM is 100% colon/hyphen (164 colon / 44 hyphen / 0 underscore across 3,029 contacts). Every tag in this spec is colon. Do not introduce underscore tags.
2. **The register form already tags contacts.** New registrations arrive pre-tagged by the website route with: `project:contained`, `project:contained-adelaide-2026`, `cohort:<x>`, `state:<x>`, `role:<x>`, `source:form`, `engagement:warm`, and (if they opted in) `newsletter-stream:contained-adelaide-invite`. Your automations react to those tags; they do not need to re-create them.
3. **Booking is manual confirm.** There is no self-serve calendar. Ops applies `engagement:booked` when a slot is confirmed; that tag is the trigger for the Booked stage.
4. **Sends go to inbound-engaged only.** Streams may only email people who reached out (see Eligibility gate). Discovered/scraped contacts (`source:gmail-discovery`, `source:grantscope`) get personal outreach, never bulk.
5. **First send of every stream is a PREVIEW to Ben.** Build the stream, enroll a test contact, send Ben the preview, get sign-off, then enable live. No exceptions (this CRM has fired unintended sends before).
6. **Every send needs** accurate sender identity + working unsubscribe + honour DND. GHL does unsubscribe automatically if you use its email/marketing send; confirm the footer is on.

## 0. Pre-requisites (custom fields)

Most fields already exist (`accessibility_needs`, `consent_status`, `newsletter_consent`, `world_tour_stop`, `contained_feelings`, engagement-scoring fields). Create only if missing:
- `slot_confirmed` (date) - when ops confirmed the walkthrough slot.
- `cohort` (single-option: young-people, student-service, conference-delegate, vip-media, next-city, public) - mirrors the `cohort:<x>` tag for views/reporting.

## 1. Pipeline: "CONTAINED Adelaide 2026"

Opportunities → Pipelines → Create. Name exactly: **CONTAINED Adelaide 2026**. Stages in order:

| # | Stage | Meaning |
|---|-------|---------|
| 1 | Captured | Registered via form or imported; not yet triaged. |
| 2 | Needs enrichment | Missing org/ABN/role; needs a human or GrantScope match. |
| 3 | Warm - review | Inbound-engaged, ready for invite decision. |
| 4 | Personal invite | High-value (VIP/funder/delegate); human outreach, not bulk. |
| 5 | Booking link sent | Invite/slot offer sent; awaiting confirm. |
| 6 | Booked | Slot confirmed (`engagement:booked`). |
| 7 | Experienced | Walked through (`engagement:experienced`). |
| 8 | Activated | Pledged / shared / introduced (`engagement:activated`). |
| 9 | Post-week nurture | Ongoing after the event. |
| 10 | Future city / partner | Wants the next stop or to partner. |
| 11 | Closed / no contact | Done or do-not-contact. |

## 2. Automations (8)

Build under Automation → Workflows. Each: Trigger → Conditions → Actions. Tags are exact.

### A1 - Capture entry
- **Trigger:** Contact Tag Added = `project:contained-adelaide-2026`.
- **Actions:** Create Opportunity in *CONTAINED Adelaide 2026* → stage **Captured** (skip if an open one exists). Copy `cohort:<x>` to the `cohort` field. If contact has `newsletter-stream:contained-adelaide-invite` AND passes the Eligibility gate (see §3), enroll in **Adelaide Warm Invite**.

### A2 - Enrichment triage
- **Trigger:** Opportunity entered **Captured**.
- **Conditions / Actions:** If `companyName` empty OR no `role:<x>` tag → move to **Needs enrichment**, create task "enrich org/role". Else → move to **Warm - review**.

### A3 - High-value personal invite
- **Trigger:** Contact Tag Added = `cohort:vip-media` OR `cohort:conference-delegate`.
- **Actions:** Move opportunity → **Personal invite**. Create task for the relationship owner: "Personal outreach, confirm a 30-min slot." Do NOT bulk-enroll these in a stream (they get hand outreach).

### A4 - Booked (manual trigger)
- **Trigger:** Contact Tag Added = `engagement:booked` (ops applies when a slot is confirmed).
- **Actions:** Move opportunity → **Booked**. Set `slot_confirmed` = today. Send prep email (template: *Pre-event confirmation*). Enroll in **Daily CONTAINED Recap**.

### A5 - Experienced
- **Trigger:** Contact Tag Added = `engagement:experienced` (ops applies at check-in).
- **Actions:** Move → **Experienced**. Send thank-you + activation-ask email (template: *Post-experience activation*). Create follow-up task.

### A6 - Activated
- **Trigger:** Contact Tag Added = `engagement:activated` (journal / story / pledge captured).
- **Actions:** Move → **Activated**. Create owner follow-up task. Move opportunity to **Post-week nurture** after 7 days (Wait step).

### A7 - Audience routing (comms enrollment)
- **Trigger:** Contact Tag Added matches any role/cohort below. Branch (if/else) on the tag:
  - `role:media` OR `cohort:vip-media` → add `newsletter-stream:media-pack`, enroll **Media Pack**.
  - `role:funder` → add `newsletter-stream:funder-brief`, enroll **Funder / Partner Brief**.
  - `role:service` OR `role:practitioner` OR `role:policy` OR `role:researcher` → add `newsletter-stream:justicehub-youth-justice`, enroll **JusticeHub / Youth Justice**.
  - `cohort:next-city` → add `newsletter-stream:future-cities`, enroll **Future Cities**.
- **Gate:** every enrollment passes through the Eligibility gate (§3) first.

### A8 - Suppression guard (global, build this FIRST)
- **Trigger:** Contact Tag Added = `comms:do-not-bulk` OR DND turned on OR `consent_status` = "No consent" OR Email Unsubscribed.
- **Actions:** Remove from ALL streams. Add `comms:do-not-bulk`. Stop all other workflows for the contact. This is the safety backstop; verify it works before enabling any stream.

## 3. Eligibility gate (the send-safety filter)

Every stream enrollment and every send must pass this. Build it once as a reusable workflow condition / smart-list:

**INCLUDE** if the contact has any inbound signal:
`source:form` OR `source:inquiry` OR `contained-hot-lead` OR `contained-original-requester` OR `contained-personal-outreach` OR `container-request` OR `newsletter-stream:contained-adelaide-invite`.

**AND consent ok:** `newsletter_consent` ≠ "No" AND `consent_status` ≠ "No consent".

**EXCLUDE** (hard stop) if: DND = true OR `comms:do-not-bulk` OR Email Unsubscribed OR (only signal is `source:gmail-discovery` / `source:grantscope` with no inbound signal above).

From the live data this gate currently passes ~113 engaged contacts and blocks the ~2,900 untagged/discovered. That is correct.

## 4. Newsletter streams (6)

Build each as a workflow/campaign. Enrollment tag is `newsletter-stream:<x>`. **First send = preview to Ben, then enable.** All sends pass the Eligibility gate.

| Stream | Enroll tag | Audience | Cadence | CTA | Template |
|--------|-----------|----------|---------|-----|----------|
| Adelaide Warm Invite | `newsletter-stream:contained-adelaide-invite` (EXISTS, 28) | Inbound warm + Adelaide/SA | Once + 1 reminder | Book a 30-min walkthrough | *Adelaide Warm Invite* |
| Daily CONTAINED Recap | `newsletter-stream:contained-daily-recap` (new) | Booked / Experienced / opted-in | Daily, 22-26 Jun | Share, return with someone, reply to act | *Daily Recap* |
| JusticeHub / Youth Justice | `newsletter-stream:justicehub-youth-justice` (new; `comms:justicehub-newsletter` exists, 17 - reuse for legacy members) | YJ orgs, services, universities, legal, policy | Monthly | Contribute evidence / story / partner | *JusticeHub / Youth Justice* |
| Media Pack | `newsletter-stream:media-pack` (new) | Journalists, comms, storytellers | Event-driven | Cover / interview / photograph | *Media Pack* |
| Funder / Partner Brief | `newsletter-stream:funder-brief` (new) | Foundations, philanthropy, CSR | Event-driven | Fund / host / introduce | *Funder / Partner Brief* |
| Future Cities | `newsletter-stream:future-cities` (new) | Perth / Vic / national leads | Quarterly | Host or convene local partners | *Future Cities* |

Email template bodies are deliverable #4 (separate doc), drafted in JusticeHub voice.

## 5. Build order (matches the Jun 16 go/no-go)

1. **A8 suppression guard** + the Eligibility gate (safety first).
2. Pipeline + 11 stages.
3. A1 → A6 (lifecycle automations). Test each with a throwaway contact: add the trigger tag, confirm the stage move + email/task.
4. A7 audience routing.
5. Streams 1-6: build, enroll one test contact, **preview to Ben**, enable on sign-off.
6. **Jun 16 go/no-go:** if any stream is not preview-tested, leave it disabled; launch falls back to MVP (lead capture + human personal outreach) and streams finish after the event.

## 6. Test checklist (per automation)

For each of A1-A8, create a test contact, apply the trigger tag, and confirm: correct stage move, correct tag added, correct email/task fired, and that the Eligibility gate blocks a deliberately-suppressed test contact. Record pass/fail. Do not enable a live send until its test passes and Ben has seen the preview.
