# CONTAINED comms inventory (ground-02)

Date: 13 June 2026. Read-only audit. Nothing in this file was executed against GHL, Supabase, Vercel, or any send/cron endpoint. All proposals are for a human to apply.

Purpose: catalogue every CONTAINED communication asset that already exists, the automation that would deliver it, and where audience-stage gaps sit. So we stop rebuilding what is drafted, and we can see the holes.

Scope of read: `compendium/contained-*`, `output/contained-*`, `output/email-contained-launch-ghl.html`, `src/app/api/ghl/*`, `src/app/api/cron/{contained,campaign}/*`, `src/content/newsletter-sequences.ts`, `src/lib/ghl/client.ts`, `vercel.json`.

---

## 1. Asset x audience x channel x trigger x status

Status key: **drafted** (text exists in a file, never wired) · **live-in-code** (fires from a route/cron in production) · **stale** (exists but carries retired figures or dead facts, must not send as-is) · **blocked** (drafted, gated behind a precondition).

### A. Personal email templates (one-to-one, manual send)

| # | Asset | Audience / segment | Channel | Trigger | Status | Source file |
|---|-------|--------------------|---------|---------|--------|-------------|
| 1 | Decision-maker personal invite | judges, MPs, policy (role:political/court/legal, Priority A) | personal email | manual, relationship owner | drafted, send-now once site scrub lands | `compendium/contained-adelaide-email-templates.md` §1 |
| 2 | Funder / philanthropy personal invite | role:funder | personal email | manual | drafted, send-now | email-templates §2 |
| 3 | Media pitch | priority journalists (role:media) | personal pitch | manual | drafted, send-now | email-templates §3 |
| 4 | Services and practitioners | youth-justice services | personal email | manual | drafted, send-now | email-templates §4 |
| 5 | Conference delegates | Reintegration Puzzle attendees | targeted booking link | manual | **blocked** (no JRI/Puzzle delegate import; JRI carries it inside the conference) | email-templates §5 |
| 6 | Youth org greeter/consent opener | youth org leaders (never the young people directly) | personal email/phone | manual | drafted, send-now to org leaders only | email-templates §6 |
| 7 | Warm invite (28-contact stream) | warm public who asked for the container | GHL stream `newsletter-stream:contained-adelaide-invite` | bulk, after 16 Jun go/no-go + Ben preview | **blocked** (go/no-go + eligibility gate) | email-templates §7 |

### B. First-contact pack (forwardable short form, one master note + 7 openers)

| Asset | Audience | Channel | Trigger | Status | Source |
|-------|----------|---------|---------|--------|--------|
| Master note + take-part block | all audiences | personal email / forward | manual | drafted, send-now once site scrub lands | `contained-adelaide-first-contact-pack-2026-06-11.md` |
| Opener 1 Supporters / warm public | supporters | personal; then `contained-adelaide-invite` stream | manual then bulk | drafted | first-contact-pack |
| Opener 2 Youth organisations | youth org leaders | personal only | manual | drafted | first-contact-pack |
| Opener 3 Universities / researchers | academia | personal | manual | drafted (no fuller template exists; this opener IS it) | first-contact-pack |
| Opener 4 Services / practitioners | services | personal; then `youth-justice-brief` stream | manual then bulk | drafted | first-contact-pack |
| Opener 5 Funders / philanthropy | funders | personal only | manual | drafted | first-contact-pack |
| Opener 6 Decision-makers | courts/MPs/policy | personal only | manual | drafted | first-contact-pack |
| Opener 7 Conference delegates | Puzzle delegates | blocked for direct send | manual via JRI | **blocked** (no delegate list) | first-contact-pack |
| Share blurbs (universal / SMS / booking / decision-maker / nomination / funder / SA orgs) | mixed | email, WhatsApp, SMS, captions | manual paste | drafted, paste-ready | first-contact-pack |

### C. GHL stream email bodies (bulk, gated)

All in `output/contained-stream-emails.md`. **Every one is gated**: dollar figures NOT cleared (conflict 3), no bulk send before 16 Jun go/no-go.

| # | Asset | Audience / enroll tag | Channel | Trigger | Status |
|---|-------|----------------------|---------|---------|--------|
| 1 | Adelaide Warm Invite | `newsletter-stream:contained-adelaide-invite` | GHL email | bulk after go/no-go | **SUPERSEDED** by email-templates §7 (conflict 8); do not use this body |
| 2 | Daily CONTAINED Recap | `newsletter-stream:contained-daily-recap` | GHL email | daily during event, eligibility-gated | drafted, blocked |
| 3 | JusticeHub / Youth Justice | `newsletter-stream:justicehub-youth-justice` | GHL email | bulk | **stale** (uses $1.55M/yr unsourced-here, conflict 3) |
| 4 | Media Pack | `newsletter-stream:media-pack` | GHL email | bulk after go/no-go | **stale** ($4,250/day retired figure) |
| 5 | Funder / Partner Brief | `newsletter-stream:funder-brief` | GHL email | bulk | **stale** ($1.55M/yr conflict 3) |
| 6 | Future Cities | `newsletter-stream:future-cities` | GHL email | bulk | drafted, blocked |
| 7 | Post-experience activation (A5) | walked-through visitors | GHL email | post-experience | **drafted but unbuilt** ("not yet written" per file; suggested body provided) |

### D. Lifecycle emails that FIRE FROM CODE (live in production)

These are the only CONTAINED emails that actually send today, from routes/crons, not manual.

| Asset | Audience | Channel | Trigger | Status | Source |
|-------|----------|---------|---------|--------|--------|
| Welcome email (`welcome-1`) | newsletter signups | transactional email via `sendEmail` | POST `/api/ghl/newsletter` (delayDays:0) | **live-in-code, STALE** — body carries RETIRED figures: $26.4B, $1.55M/yr + 84% within 2yr, $4,250/day, ALMA "939 alternatives / 527 orgs / 489 evidence" | `src/content/newsletter-sequences.ts:29` |
| Welcome `welcome-2`, `welcome-3` | newsletter signups | drip (delayDays 3, 7) | needs a scheduler/workflow — NO live cron drives the welcome drip after email 1 | **drafted/stale** ($75 vs $4,250, 84%→3% retired) | newsletter-sequences.ts:60 |
| Event confirmation (`event-confirm`) | event registrants | transactional email | POST `/api/ghl/register` (delayDays:0) | **live-in-code, CLEAN** — updated to Adelaide / three-rooms / `/remand` / `/contained/reaction`, no retired stats | newsletter-sequences.ts:125 |
| Pre-event `event-story` + later drip | registrants | drip | needs scheduler/workflow | drafted | newsletter-sequences.ts:160 |
| Nomination receipt email | nominators (left email) | transactional | nomination submit → `campaign_nominations` | **live** (per launch-alignment: "receipt email live") | `src/app/api/contained/nominations` |
| Daily team digest | internal (benjamin@act.place) | email | cron `/api/cron/contained/daily-digest` daily 21:00 UTC | **live-in-code** (reads `event_registrations` + `campaign_nominations`) | cron/contained/daily-digest |
| Post-experience 24h / 7d / 30d | walked-through (reflections w/ email) | email | cron `/api/cron/contained/post-experience` daily 12:00 UTC | **live-in-code** (reads `community_reflections`) | cron/contained/post-experience |
| Role nurture sequences (org/media/supporter/funder/lived-experience) | role-tagged members | email | cron `/api/cron/contained/nurture` daily 09:00 UTC ("this cron IS the automation, no GHL workflow needed") | **live-in-code** | cron/contained/nurture + newsletter-sequences.ts:319-857 |
| Pipeline follow-up (contacted +7d, proposal_sent +14d) | `campaign_alignment_entities` by stage | email | cron `/api/cron/campaign/pipeline-followup` Wed 06:00 UTC | **live-in-code, STALE** ("981 verified community programs" figure; reads `campaign_alignment_entities` not `campaign_nominations` — nomination-campaign fix #2) | cron/campaign/pipeline-followup |

### E. Standalone HTML / broadcast email

| Asset | Audience | Channel | Trigger | Status | Source |
|-------|----------|---------|---------|--------|--------|
| Launch broadcast email (HTML) | full list (the "mass CONTAINED email") | GHL broadcast | manual broadcast | **STALE — do not send** — $4,250/day, 84% QLD 2yr, 23x, 88% restorative, "Mounty Yarns", Mount Druitt April / Adelaide May (wrong: launch is Tue 23 Jun), "24 slots daily / pay what you can $0-50" (contradicts scarcity/no-ticket frame) | `output/email-contained-launch-ghl.html` |

### F. LinkedIn / social (the 10-day arc)

All in `compendium/contained-adelaide-10-day-linkedin-campaign.md`. Channel = LinkedIn organic (Ben personal, Nic reposts Days 1/5/8). Trigger = manual daily post. Hero CTA = Nominate.

| Day | Date | Post | Status |
|-----|------|------|--------|
| 1 | Sun 14 Jun | The return post | drafted; ships if Crisafulli tile + "Kaurna Yarta" language hold |
| 2 | Mon 15 Jun | The numbers post | **blocked** on stat-tile regeneration (old tiles carry retired $4,250/QLD) |
| 3 | Tue 16 Jun | Isaiah's room | **blocked** on consent (Isaiah/Jackquann, Kate Bjur) |
| 4 | Wed 17 Jun | Maria's question + EOI opens | drafted |
| 5 | Thu 18 Jun | Who needs to walk through (SA list) | drafted |
| 6 | Fri 19 Jun | The builders | **blocked** on build-photo consent |
| 7 | Sat 20 Jun | Room 3 / stand with it | drafted |
| 8 | Sun 21 Jun | The interstate post | drafted |
| 9 | Mon 22 Jun | Scarcity post (last call) | drafted |
| 10 | Tue 23 Jun | Doors open = LAUNCH | drafted (day-of photo, consent-checked) |

### G. Nomination copy kit (Room 3 engine)

`compendium/contained-adelaide-nomination-campaign-2026-06-11.md` §4. Channel = print + email P.S. + social + spoken host line + after-walkthrough email.

| Asset | Channel | Status |
|-------|---------|--------|
| The question (verbatim, everywhere) | all | live wording |
| Nomination card (A5 print, QR to `/contained#nominate`) | print | drafted (on artifact tracker) |
| Email postscript ("name the person…") | email P.S. append | drafted, paste-ready |
| Social post | LinkedIn/social | drafted |
| Host line at the exit (spoken) | in-room | drafted |
| After-walkthrough email (A5 automation) | email | **drafted, NOT automated** (no route fires this) |

### H. Stat tiles / visual comms (AI-graphic territory, allowed)

| Asset | Channel | Status |
|-------|---------|--------|
| `stat-comparison.png`, `social-stat-cost.png`, `social-stat-ratio.png`, `stat-155m.png` | social image | **STALE — carry retired numbers**, regenerate from brand-guide §7 ($3,261/day SA ROGS Table 17A.20 vs $75; 84% within 12mo AIHW 2023-24 vs Diagrama 13.6%) |
| Nomination share tile (post-nomination) | social image | **live** (shipped, commit 1f80d44f / 8810bce7 stat-tile generator) |
| `output/contained-nomination-tile-prompts.md` | tile gen prompts | drafted |
| Launch image comp / pullback video (`output/contained-launch-video/`) | social/launch | drafted asset (real container photo source) |

---

## 2. Automation map (GHL workflow + sequence env vars)

### Wiring found in code

| Env var | Wired into | Behaviour if unset | Code |
|---------|-----------|--------------------|------|
| `GHL_WELCOME_WORKFLOW_ID` | `/api/ghl/newsletter` | `if (welcomeWorkflowId)` guard → silently no-ops, the in-house welcome email still sends | newsletter/route.ts:139 |
| `GHL_PRE_EVENT_WORKFLOW_ID` | `/api/ghl/register` | `if (preEventWorkflowId)` guard → silently no-ops, the in-house event-confirm email still sends | register/route.ts:305 (comment: "legacy/supplementary") |
| `GHL_NURTURE_WORKFLOWS` map → `GHL_WORKFLOW_ORGANIZATION` / `_MEDIA` / `_SUPPORTER` / `_FUNDER` / `_LIVED_EXPERIENCE` | `/api/ghl/signup` (role-keyed `addToWorkflow`); NEVER for community lane (OCAP) | each defaults to `''`; `if (workflowId)` guard → no-op. The `/api/cron/contained/nurture` cron is the real automation and does NOT need these | client.ts:711-717, signup/route.ts:118 |
| (generic) `trigger-sequence` | POST `/api/ghl/trigger-sequence` takes an explicit `workflow_id` in the body; validates `sequence_id` against `allSequences` | returns `{triggered:false}` if GHL unconfigured | trigger-sequence/route.ts |

**Determination on the key open question (whether the GHL_WORKFLOW_* env vars are set in Vercel prod): UNCONFIRMED.** Not in local `.env*`. The Vercel MCP does not expose env-var listing (only project metadata), and this is a read-only task. What IS verified from code: every workflow trigger is behind an `if (id)` guard, so unset vars fail silent (no error, no send) and the in-house email + nurture cron still run. So the GHL-native workflow layer is best treated as **dormant/optional** — the live email automation is the Next.js crons, not GHL workflows. A human should confirm via Vercel dashboard before assuming any GHL workflow fires.

### Cron schedule (verified in `vercel.json`)

| Cron | Schedule (UTC) | What it sends | Status |
|------|----------------|---------------|--------|
| `contained/daily-digest` | `0 21 * * *` daily | internal team digest | live |
| `contained/post-experience` | `0 12 * * *` daily | 24h/7d/30d visitor follow-ups | live |
| `contained/nurture` | `0 9 * * *` daily | role nurture sequences | live |
| `contained/reengagement` | — | tags inactive_7d in GHL | **route EXISTS but NOT in vercel.json — never runs on schedule** |
| `campaign/ghl-sync` | `0 8 * * *` daily | syncs high-score allies to GHL | live |
| `campaign/pipeline-followup` | `0 6 * * 3` Wed | stage-based follow-up emails | live (stale copy + wrong table) |
| `campaign/engagement-scoring` | `0 6 * * 1` Mon | tier tags | live |
| `campaign/social-publish` | `0 21 * * *` daily | Notion→GHL Social Planner publish | live |
| `campaign/linkedin-monitor` | `0 10 * * 1` Mon | re-scrape tracked posts | live (logs intent only) |

---

## 3. Gaps (audience x stage with no asset, or asset present but broken)

1. **Universities / researchers** have an opener but NO fuller template — only the short first-contact opener exists for a real partnership conversation.
2. **Conference delegates (Puzzle)** — two drafts exist (template 5, opener 7) but BOTH are blocked: no delegate import, send relies on JRI carrying it by hand. No automated path.
3. **Nominees** (the person nominated) — no asset and no automation reaches them. The nomination campaign says the nominee never becomes a record; the personal invite is fully manual (15-min evening triage). The "after-walkthrough email" and nominee post-week brief are drafted but unautomated.
4. **Post-experience activation (stream A5)** — drafted as a suggestion, never built; the live `post-experience` cron sends its own 24h/7d/30d emails instead, so there are TWO competing post-experience designs (stream A5 vs the cron). Reconcile which is canonical.
5. **Welcome drip emails 2 and 3** — drafted with delayDays 3/7 but NO live cron drives them after welcome-1. Only email 1 fires.
6. **`reengagement` cron** — route built, never scheduled. Inactive-7d tagging does not happen.
7. **Future-city / interstate nominators** — Day 8 post and Future Cities stream exist, but no asset turns a "bring it to Perth" comment into a tracked next-city lead beyond manual entry.
8. **Stale-figure contamination (the biggest live risk):** the launch HTML broadcast, welcome sequence, stream emails 3/4/5, pipeline-followup cron copy, and the 4 stat tiles all carry RETIRED numbers ($4,250/day, 84%-within-2yr QLD, $1.55M, $26.4B, "981/939 programs", Mount Druitt April / Adelaide May, "Mounty Yarns"). Brand-guide §7 canon is now $3,261/day SA (ROGS 2024-25 Table 17A.20) vs $75, and 84% within 12 months (AIHW 2023-24) vs Diagrama 13.6%. None of these assets are safe to send/post until regenerated against §7.
9. **Pipeline-followup reads the wrong table** (`campaign_alignment_entities`, ~empty for nominations) instead of `campaign_nominations` — nomination-campaign P0 fix #2. Live cron quotes stale counts.

---

## 4. What is genuinely DONE and live (do not rebuild)

- Event-confirm transactional email (clean, Adelaide-correct)
- Nomination receipt email + public wall + share tile (live)
- Daily team digest, post-experience cron, nurture cron (live)
- All 7 personal email templates + first-contact pack + share blurbs (drafted, paste-ready, send-now once site scrub lands)
- 10-day LinkedIn arc (drafted day-by-day)
- Nomination copy kit (question, card, P.S., social, host line — wording locked)
