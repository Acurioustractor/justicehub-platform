# CONTAINED, Master Campaign Comms & Systems Plan

> The one document that ties the full CONTAINED communication and systems review together. It folds the grounding (ground-01 to ground-05), the segment matrix (file 10), the four design deliverables (files 20 to 23), and the verification passes (files 11, 12, 15) into a single plan a human or a night-shift agent can act from.
>
> Compiled 2026-06-13. READ-ONLY across every external system. Nothing here was sent, written, migrated, or triggered. Every proposal is documented for a human to apply. Launch is **Tuesday 23 June 2026**, the Adelaide experience on Kaurna Yarta.
>
> Figures throughout are brand-guide §7 canon with source, year, and jurisdiction. Retired numbers appear only inside do-not-use guardrails. Campaign name is **CONTAINED** (never "The Contained").

---

## Executive summary

CONTAINED has a working machine and a leaking funnel. The story, the brand, the platform stack, and the live GoHighLevel pipelines are real and sound. What is not sound, ten days before doors open, is the part that turns a person's interest into a record, a reply, and a booking. The campaign lost its only real inbound on 12 June because the register-interest route saves nothing durable before it calls GoHighLevel and sends no receipt at all. The booking funnel for the 23 June experience is empty. And a master kill switch on email may be off in production, which would make every receipt and every scheduled send a silent no-op.

State of play across the four goals:

- **Goal 1, every GoHighLevel contact well-informed.** Diagnosed and mapped. The segment matrix (file 10) walks all 78 live Engagement opportunities, both Adelaide test records, and every orphan, and gives each a next touch. Verification (file 12) found the matrix complete on coverage but caught that the first sends it prescribes carry retired figures. Corrected drafts now exist (file 22).
- **Goal 2, comms that support engagement.** Designed. The engagement journey and the demand-generation plan to fill the empty Adelaide funnel are in file 21. Every net-new and corrected asset is drafted in file 22. The blocker is human sign-off and a figure scrub, not missing copy.
- **Goal 3, systems and routes work.** Designed but not applied. Seven named code defects plus the no-receipt root cause have a full remediation design in file 20, each with file:line, the change, the action tier, and a test. None has been applied.
- **Goal 4, campaign ideas.** Built. A 28-idea bank with a dated TOP-10 for the next ten days is in file 23.

**23 June readiness:** the campaign can launch, but only if the loss-proofing and the email switch are confirmed first. The creative and the segments are ready. The plumbing is not.

**The single biggest risk (UPDATE 13 June, now RESOLVED):** this plan flagged `EMAIL_ENABLED` being off as the biggest risk. It has since been verified ON in production, see `01-verification-results-2026-06-13.md`. Proof: the 11 June EOI test registration received a real outbound email receipt via GHL. So `/register` and `/eoi` confirm to registrants, and the no-reply is narrow, it is the `/api/ghl/signup` register-interest path (no receipt by design) plus the 12 June outage loss, not a platform-wide email outage. The remaining real risks are: the register-interest no-receipt fix (file 20 Defect B), durable-first capture (file 20 Defect A), the unwired automated-workflow layer (all `GHL_*_WORKFLOW_ID` env vars are unset, so nurture/welcome/pre-event drips are inert until Ben either builds the GHL workflows or ships the cron drips in file 21), and unknown Adelaide booking capacity (no system source, needs Ben).

A note on the completeness critic (file 15): it was written before files 20 to 23 existed and found "four of five deliverables absent." That finding is now resolved. The systems-fix design (20), the engagement journey and demand-gen (21), the corrected comms (22), and the idea bank (23) are the four deliverables it called for. The matrix it praised (10) still holds.

---

## "Someone submitted and got no reply": the verified root cause

A real person filled in `/contained/register-interest` on 12 June and heard nothing. Two faults conspired, sitting under one global switch.

1. **The route sends no receipt by design.** `src/app/api/ghl/signup/route.ts` has zero `sendEmail` calls (verified: `grep -c sendEmail` = 0). Even a perfectly healthy submission gets silence.
2. **The route saves nothing durable before it calls GoHighLevel.** For an anonymous interest submission with newsletter off, the only intended record is the GoHighLevel contact, and `upsertContact` swallows every failure to `null` (`src/lib/ghl/client.ts:139-142`). During the 12 June crawl-saturation 504, the request never reached GoHighLevel, so the lead vanished with no trace and a success response.
3. **The kill switch on top of both.** `sendEmail()` returns null and sends nothing unless `EMAIL_ENABLED === 'true'` (`src/lib/email/send.ts:38-47`). `EMAIL_ENABLED` is not in `.env.example` and its production value is [UNVERIFIED]. If it is unset, every receipt and every cron email is a silent no-op.

**The exact fix path is file 20.** In order: confirm `EMAIL_ENABLED` and the `GHL_*` values in Vercel prod (Ben, Tier 2 read); apply the `contained_capture_log` migration so a durable Supabase row is written before any GoHighLevel call (Defect A, Tier 3 to apply); add a receipt to `/api/ghl/signup` using a new `signupReceipt` builder that links `/contained/brief` and carries no raw figures (Defect B, Tier 1). The receipt draft itself is asset A1 in file 22. Defect A inverts the ordering so the Supabase row, not the swallowed GoHighLevel upsert, becomes the fail-loud system of record. After this, a GoHighLevel hiccup leaves a replayable un-synced row instead of losing the lead.

---

## Goal 1: every GoHighLevel contact well-informed

The deliverable is the segment matrix, **file 10**. It is complete on coverage: every live segment, every empty stage, every orphan, and the polluted pool carries a concrete next touch. The verification pass, **file 12**, confirmed that and caught the asset-level corrections to fold in.

### What the matrix concludes

The book splits into two live pipelines plus the orphans. The under-informed, high-value segments cluster at the top of the relationship pipeline and the orphan list:

- **Most under-informed high-intent segment:** the 14 inbound contacts at **In conversation** (Row A4) who actively asked about the container and have not been told it is happening in 10 days. Personal replies by Mon 15 June.
- **Highest-value under-informed segment:** the ~14 KEEP funders at **Identified** (Row A1), all "outreach pending," zero personal CONTAINED touch. Personal invite by Mon 15 June.
- **The binding consent dependency:** the 34 SA service orgs at **Personal outreach** (Row A3). Room 3 IS this wall, and "outbound underway" is not "consent confirmed." Wall consent before the build, by Thu 18 June.
- **The split-three-ways Partner segment:** Diagrama x5 needs wording-approval stewardship not a recruitment invite (Row A5); Just Reinvest has a stage-reality mismatch to reconcile (Row A6); JRI/Hannah March is the single unblock for the entire conference-delegate audience (Row A7).
- **The campaign-level gap:** Pipeline B, the Adelaide booking funnel, holds **zero real demand** ten days out (only two internal test records). Filling it is the launch-week priority, addressed in Goal 2.
- **The structural orphans with no automated path:** conference delegates (blocked on JRI import), nominees (the headline mechanic, yet the nominated person never becomes a record), universities/researchers (opener-only), and young people for paid host roles (reached only through org leaders).
- **The inverse risk:** the polluted ~272. A naive "email everyone tagged `project:contained`" pull returns this set, not the honest ~85. The single biggest send-hazard in the book.

### Corrections to apply (from file 12, Tier-labelled)

| # | Correction | Tier | Pre-23-June blocking? |
|---|---|---|---|
| 1 | Regenerate **Template 1** (decision-maker invite) and **Template 3** (media pitch) to §7 before any send. Both carry retired `$1.55M/yr` + `84% within two years` (file 12 §2). The matrix prescribes them as early sends and labels them clean by omission. Corrected bodies now exist in file 22. | Tier 1 (edit copy) then Tier 3 (send) | YES, blocks Mon-15 / Wed-17 sends |
| 2 | Re-check the `23.1x` figure against a cited source; the §7 canon says "about 23x more likely" (national youth detention statistics). `23.1x` is on the do-not-send launch HTML. | Tier 1 | Yes if used in any send |
| 3 | Drop the "media opener" label (no such asset exists); say "Template 3 media pitch" instead (file 12 §3a). | Tier 1 | No |
| 4 | The "future-cities frame" personal snippet did not exist in the first-contact pack; it is now drafted as asset F in file 22 (file 12 §3b). | Tier 1 (done in file 22) | No |
| 5 | Reconcile the daily-recap stream tag. Live GoHighLevel carries `newsletter-stream:daily-adelaide-recap`; the drafted body and inventory use `contained-daily-recap` (file 12 §4). Pick one canonical tag before any recap enrolment. | Tier 2 (GHL read to confirm) | No, recap is event-week |
| 6 | Set the warm-public stream audience from live `newsletter-stream:contained-adelaide-invite` membership, not a hard-coded "28" (file 12 §5). | Tier 2 (GHL read) | No |

The matrix's tag/stage corrections were all checked against live GoHighLevel and match, with the single exception of the recap tag above. Every audience instruction correctly says: source from the KEEP CSV or a live pipeline stage, never from a `project:contained` tag query.

---

## Goal 2: comms that support engagement

### The engagement journey and demand generation at a glance (file 21)

File 21 turns the per-segment next-touch list into an end-to-end wired journey across both pipelines, and designs how the empty Adelaide booking funnel fills for launch week.

- **Demand generation for Pipeline B.** A stated booking-capacity assumption (~70-75 public slots across 23-26 June, solo walk-through, 3 slots/hr, all marked [UNVERIFIED] against the real site roster), an EOI-to-Booked funnel with each touch keyed to a real Pipeline-B stage ID, three demand engines (personal-reply EOI links, the warm-public stream, LinkedIn), a QR/walk-up/waitlist mechanism, and a daily fill-rate checkpoint read off the existing `/admin/contained/flow` board. Target ~120-150 EOIs to fill ~50 open-channel bookings.
- **The drip scheduler.** Welcome 2/3 and the pre-event drip modelled on the proven nurture cron, idempotent, gated on `EMAIL_ENABLED` inside `sendEmail` so it is a safe no-op while off. Hard block attached: do not enable until welcome bodies are regenerated to §7.
- **The nominee worklist.** Extends the existing flow-page panel with one nullable `actioned_at` column, un-actioned-first sort, and a mark-invited POST that writes one column and NEVER emails the nominee. Closes the campaign's worst orphan without breaking the consent rule.
- **Full stage-progression logic** for both pipelines, plus a walk-up fast-path where a trained host satisfies the eligibility gate on-site.

### Drafted assets index (file 22)

Every asset below is written in Imagination Architect voice, with §7 figures or a `/contained/brief` link, zero em-dashes, zero AI-tell vocab, zero retired figures (grep-verified in the file).

| ID | Asset | Fills | Ready vs needs sign-off |
|---|---|---|---|
| A1 | Register-interest receipt | The 12 June no-reply | Ready to wire (needs Defect B code + EMAIL_ENABLED) |
| A2 | EOI / booking confirmation | Seeds empty Pipeline B at Captured | Ready to wire |
| B1 | Funder nurture / personal invite | Row A1, the 14 KEEP funders | Ready, personal send (Ben) |
| B2 | SA org / partner nurture | Row A3, wall consent the explicit ask | Ready, personal send (Ben) |
| B3 | Supporter / lived-experience nurture | Refresh against §7, no figures | Ready, personal send |
| C | Launch-day (23 June) broadcast | Replaces the do-not-send launch HTML | Needs go/no-go + Ben preview before bulk |
| D | Post-experience 24h follow-up | Canonical cron copy, retires stream A5 | Ready, cron-driven (EMAIL_ENABLED) |
| E | Re-engagement note (cold/parked) | Defect 3 body, when reengagement is scheduled | Needs cron in vercel.json first |
| F | Interstate / future-cities reply snippet | The missing personal frame (file 12 §3b) | Ready, personal paste |

### The stale-figure correction (call it out loud)

**Templates 1 and 3 must be regenerated to §7 canon before any Mon-15 or Wed-17 send.** They are the FIRST sends the plan prescribes, and the original bodies carry the retired `$1.55M/yr` and `84% within two years`. The corrected drafts are in file 22, but a human acting off the older `email-templates.md` (which marks them "send-now" with no stale flag) would send the contaminated bodies. This is the single most consequential miss the verification caught. Part G of file 22 also flags two LIVE stale assets a human must fix: `welcome-1` (retired figures in code) and the pipeline-followup cron (wrong table + stale figure).

---

## Goal 3: systems and routes work

The consolidated fix list, ranked by severity. Full remediation design with the exact code change, blast radius, and test per defect is **file 20**. None has been applied.

| Rank | Defect | File:line | Fix (summary) | Tier | Pre-23-June blocking? |
|---|---|---|---|---|---|
| P0 | `EMAIL_ENABLED` + `GHL_*` prod state unverified | Vercel | Read the 11 values in Vercel prod; decide the `EMAIL_ENABLED` flip on a watched day | Tier 2 read (Ben) | YES, gates every send |
| P0 | No durable-first capture (12 June loss root cause) | `signup/route.ts:128-147`, `connect/route.ts:97-119`, `host/route.ts:60-85` | New `contained_capture_log` table written BEFORE any GoHighLevel call; the capture row is the fail-loud 500 path | Tier 1 code; migration apply Tier 3 | YES |
| P0 | `/api/ghl/signup` sends no receipt (the no-reply) | `signup/route.ts` (whole file) | New `signupReceipt` builder + fire-and-forget `sendEmail`, links `/contained/brief`, no raw figures | Tier 1 | YES |
| 6 | `upsertContact` swallows failures to null | `client.ts:139-142` | Closes automatically via Defect A (durable-first inverts ordering). Do NOT change the `null` return; ~a dozen callers depend on it | Tier 1 (folded into A) | Closed by A |
| 4 | Webhook checks literal `'Newsletter'` | `webhook/route.ts:130` | Check canonical `comms:justicehub-newsletter` (tolerate legacy) to stop false subscriber deactivation | Tier 1 | No |
| 5 | ghl-sync emits legacy flat tags | `ghl-sync/route.ts:43` | Swap flat `GHL_TAGS` for colon canon; DROP the unconsented newsletter tag (it re-creates the swamp the cleanup is draining) | Tier 1 (pause decision = Ben) | No |
| 7 | Welcome drip 2/3 + pre-event drip have no scheduler | `vercel.json` + GHL workflows | Path 1 (preferred): GHL owns the drip, set `GHL_WELCOME_WORKFLOW_ID` / `GHL_PRE_EVENT_WORKFLOW_ID`. Path 2: a Next cron like file 21's drip design | Tier 1 code; GHL workflow Tier 2 | No (but blocks automated welcome/pre-event) |
| 2 | pipeline-followup reads `campaign_alignment_entities` | `pipeline-followup/route.ts:91-100` | NOT a mechanical rename. The route's own comment says the table read is deliberate. Real risk = the polluted audience. Scope to KEEP cohort OR leave as-is. Do NOT blind-swap (column shapes differ, would throw) | Tier 1 code; audience = Ben decision | No, but highest audience-blast if EMAIL_ENABLED on |
| 3 | reengagement cron absent from `vercel.json` | `vercel.json` (missing entry) | Decide: schedule at `0 10 * * *` OR document as superseded by nurture. Verify no `inactive_7d` double-write first | Tier 1 + decision | No |

**Apply order (loss-proof first, audience-touching last):** ENV verification → migration apply → routes A + receipt B → `.env.example` + webhook fix 4 → ghl-sync 5 → reengagement 3 → pipeline-followup 2 → drips 7 → optional reconcile sweep. Steps that close the data loss (the durable capture and the receipt) come before anything starts emailing. The `EMAIL_ENABLED=true` flip is the single Tier-2 action that turns the system on and must be a watched day-shift event, never an overnight backlog item.

---

## Goal 4: campaign ideas (the TOP-10 do-now)

Full bank of 28 ideas with scoring is **file 23**. The TOP-10 are the do-these-first list for the next ten days, sorted by whether they move the two launch-deciding numbers: a full Pipeline B and informed warm contacts.

| # | Idea | Rung | By when |
|---|---|---|---|
| 1 | Personal reply sprint to the 14 inbound who asked | Witness | Mon 15 Jun |
| 2 | EOI link in every surface, every reply, every post | Witness | Today |
| 3 | The funder fourteen, personal invite with the SA cost frame | Fund | Mon 15 Jun |
| 4 | The nominee bridge, a nightly hand-built path to the named decision-maker | Nominate | Tonight, nightly |
| 5 | The SA org wall, consent calls before the build | Stand with it | Thu 18 Jun |
| 6 | The youth-org leader calls, paid hosts before the van is packed | Host | This week, urgent |
| 7 | Unblock the conference delegates through Hannah March | Witness | Wed 17 Jun |
| 8 | The Day-4 "EOI opens" public booking trigger | Witness | Wed 17 Jun |
| 9 | The warm-public 28, the one clean bulk send | Witness/Share | Wed-Thu 17-18 Jun (after go/no-go) |
| 10 | The media pitch with the builder visual, booked before the windows | Witness/Document | Wed 17 Jun |

Idea 4 closes the campaign's biggest structural gap: the nominated decision-maker who never becomes a record and never gets reached. Ideas 2 and 8 directly attack the empty Pipeline B.

---

## Unified prioritized action list (everything before 23 June)

One ordered table. Tier 1 = local/code, an AFK night-shift agent may do it. Tier 2 = confirm-first, post "about to do X, proceed?" even in auto-mode. Tier 3 = explicit human verb required (GHL writes, sends, env changes, migration apply, deploys). **An AFK agent may do every Tier 1 row. Only Ben does Tier 2 and Tier 3, day-shift.**

| Order | Action | Owner | Tier | Night-shift safe? |
|---|---|---|---|---|
| 1 | Read `EMAIL_ENABLED` + all `GHL_*` in Vercel prod; fill the actuals | Ben | Tier 2 read | No, day-shift |
| 2 | Add the missing keys to `.env.example` (EMAIL_ENABLED, GHL_*, the 5 workflow IDs) | Agent | Tier 1 | Yes |
| 3 | Write the `contained_capture_log` migration file | Agent | Tier 1 | Yes |
| 4 | Apply the `contained_capture_log` migration | Ben | Tier 3 | No, day-shift, BEFORE route changes deploy |
| 5 | Write durable-first capture on signup/connect/host + add `signupReceipt` builder + wire receipt + host team-notification | Agent | Tier 1 | Yes |
| 6 | Regenerate Template 1 + Template 3 copy to §7 (corrected drafts already in file 22) | Agent | Tier 1 | Yes |
| 7 | Fix the welcome-1 live copy and pipeline-followup stale figure (file 22 Part G) | Agent | Tier 1 | Yes |
| 8 | Fix webhook canonical-tag check (Defect 4) | Agent | Tier 1 | Yes |
| 9 | Fix ghl-sync to emit colon canon + drop newsletter tag (Defect 5) | Agent | Tier 1 | Yes (pause decision is Ben's) |
| 10 | Build the nominee worklist column + flow-page panel + mark-invited POST (no nominee email) | Agent | Tier 1 code; migration apply Tier 3 | Code yes; apply day-shift |
| 11 | Build the drip scheduler cron (inert while EMAIL_ENABLED off) | Agent | Tier 1 | Yes |
| 12 | Deploy the route + cron changes | Ben | Tier 3 | No, day-shift |
| 13 | Register the new drip cron in `vercel.json` | Ben | Tier 2 | Post "about to add cron" first |
| 14 | Decide reengagement: schedule vs document-as-superseded; verify no double-write | Ben | Tier 2 decision | No |
| 15 | Decide pipeline-followup audience: scope to KEEP vs leave as-is (never blind-swap) | Ben | Tier 2 decision | No |
| 16 | Personal sends: B1 funder invite, A4 inbound replies, B2 SA org wall, Diagrama stewardship, JRI working call | Ben | Tier 3 (sends) | No, day-shift |
| 17 | Nightly nominee triage + personal decision-maker invite | Ben | Tier 3 (sends) | No |
| 18 | 16 June go/no-go + eligibility gate + Ben preview | Ben | Tier 2 gate | No |
| 19 | After go/no-go: warm-public 28 bulk send (Template 7, corrected body) | Ben | Tier 3 (bulk send) | No |
| 20 | Flip `EMAIL_ENABLED=true` on a watched day, AFTER receipt + capture ship and the figure scrub is done, NOT in the same change as the bulk broadcast | Ben | Tier 3 | No, watched day-shift event |
| 21 | Launch-day broadcast (asset C), replacing the do-not-send HTML | Ben | Tier 3 (bulk send) | No |

**NEVER trigger, in any planning, test, or AFK pass:** `campaign/social-publish` (posts to 7 real public social accounts + mutates Notion, highest blast radius in the system); the `output/email-contained-launch-ghl.html` broadcast (retired figures, wrong dates, removed community name); any email cron while `EMAIL_ENABLED=true` unless the figure scrub is done; the nominee auto-email path (consent + by-design rule); any audience pull from a `project:contained` tag query (returns the polluted ~272).

---

## Open questions and human-verification block

These are the unconfirmed values and unresolved decisions that gate the plan. None can be resolved by an agent. All are day-shift, Ben-only.

### Production env values to read (Vercel, Tier 2 reads)

| Value | Why it matters | If unset |
|---|---|---|
| `EMAIL_ENABLED` | Master kill switch on all email (`send.ts:38`) | Every receipt + every cron email is a silent no-op. Most likely single cause of the no-reply. |
| `GHL_PRE_EVENT_WORKFLOW_ID` | Pre-event drip trigger (`register/route.ts:305`) | Pre-event drip never fires (Defect 7) |
| `GHL_WELCOME_WORKFLOW_ID` | Welcome drip trigger (newsletter route) | Welcome drip 2/3 never fires (Defect 7) |
| `GHL_WORKFLOW_FUNDER` | Funder role nurture (`client.ts:711-717`) | That role's nurture silently skipped |
| `GHL_WORKFLOW_MEDIA` | Media role nurture | Silently skipped |
| `GHL_WORKFLOW_ORGANIZATION` | Org role nurture | Silently skipped |
| `GHL_WORKFLOW_SUPPORTER` | Supporter role nurture | Silently skipped |
| `GHL_WORKFLOW_LIVED_EXPERIENCE` | Lived-experience role nurture | Silently skipped |

Also confirm `GHL_API_KEY`, `GHL_LOCATION_ID` (should be `agzsSZWgovjwgpcoASWG`), `GHL_WEBHOOK_SECRET` (unset returns 500 on every inbound webhook), and `CRON_SECRET` (missing = every cron 401s).

### Partner sign-offs and decisions

- **Diagrama figures.** The `13.6%` reoffending and `€5.64 per €1` social-return figures need partner sign-off from the five Diagrama contacts before any public use (idea 13, Row A5). Until cleared, Adelaide leads qualitative ("education, therapy, connection instead of concrete") and holds the percentage. Schedule this BEFORE the Day-2 numbers post.
- **Mount Druitt proof claim** lacks source provenance; do not state it as fact until sourced [UNVERIFIED].
- **Young-builder consent is not cleared.** Hold any young person's name, image, or story. Do not claim "consent confirmed" (ideas 6, 22).
- **Adelaide booking capacity is [UNVERIFIED].** Confirm the daily window, the changeover time, and whether two people can be in different rooms at once (would roughly double the ~70-75 slot assumption). This sets the EOI target in file 21.
- **The delegate booking-QR card** may be a missing launch-blocking print asset. Confirm it physically exists by Wed 17 June or treat it as a blocker (file 15 medium; idea 7).

### Unapplied 12 June GoHighLevel cleanup decisions

- **The Phase D KEEP/REMOVE cleanup is documented, not applied.** A tag-based audience pull today returns the polluted ~272, not the honest ~85. Drive every send audience from the KEEP CSV or a live pipeline stage. Apply the REMOVE verdict (strip blanket `project:contained` tags, delete the auto Engagement opp) from the Ben-annotated dry-run, never from a tag query.
- **The Partner/committed reclassification** (Diagrama x5, Just Reinvest, JRI) proposed on 12 June is unapplied; live still shows 7. Decide explicitly rather than letting it drift (Row A5, A6, A7).
- **The two test records and the clear mis-tag inboxes** (QLD environment ministerial, Melbourne Fringe marketing) should be excluded or REMOVE-verdicted, documented for a human.

### Lived-experience OCAP gate

Decide whether the lived-experience (community) lane should receive ANY automated receipt email, or whether the signup receipt is gated on `!communityLane`. A receipt acknowledging a submission is not auto-enrolment into comms, so it can respect OCAP, but the call is Ben's (file 20 Defect B).

---

*End of master plan. Every proposal documented for a human to apply. Nothing executed.*
