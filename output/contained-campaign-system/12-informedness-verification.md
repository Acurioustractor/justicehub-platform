# CONTAINED Informedness Plan, Verification Pass

> Read-only verification of `10-segment-informedness-matrix.md` against the comms inventory (`ground-02-comms-inventory.md`) and the live GHL reality (`ground-01-ghl-reality.md`). Compiled 2026-06-13. Nothing here was sent, written, migrated, or triggered. All proposals documented for a human to apply.
>
> QUESTION ANSWERED: does every segment/stage in the matrix have (a) a concrete recommended next touch AND (b) a matching asset that actually exists as a draft or live asset, with no tag/stage correction that contradicts live GHL?
>
> HEADLINE: every segment has a recommended next touch (the matrix is complete on coverage). The failures are asset-level: the FIRST sends the plan prescribes (Templates 1 and 3, due by Mon 15 / Wed 17 June) carry RETIRED figures the plan's own §7 canon forbids, and the matrix does not flag those two specific assets. Two recommended assets do not exist as drafts. One stream tag name in the plan contradicts the live GHL tag.

---

## 0. The file the task named does not exist

The task asked me to read `output/contained-campaign-system/11-comms-system-and-drafts.md`. **That file does not exist** and was never committed (verified: `find` returns nothing, `git log --all` on the path returns nothing). The comms system the matrix actually cites is split across `ground-02-comms-inventory.md` (the asset catalogue) plus the source files in `compendium/` and `output/`. This verification cross-checks the matrix against those real files. If a `11-` file was intended as a separate "drafts" deliverable, it has not been produced; the matrix's asset claims still resolve against the inventory and source files, so the verification proceeds.

---

## 1. Coverage check, PASS: every segment has a recommended next touch

Walked all rows. Every live segment, every empty stage, every orphan, and the pollution pool carries a concrete next touch. The only "no touch" verdicts are deliberate and correct (169 cold-network = REMOVE not send; the 2 test records = exclude; the two clear mis-tag inboxes in A2). No segment is left dark on the coverage axis. Matrix Part 4 flag #6 holds.

Confirmed-solid asset existence (these recommendations point at assets that really exist):
- All 7 personal email templates exist with the cited section numbers (`email-templates.md` §1-7, verified by header grep).
- First-contact pack master note + openers 1-7 + share blurbs all exist (`first-contact-pack-2026-06-11.md`).
- All 6 GHL stream bodies + lifecycle section exist (`contained-stream-emails.md`).
- 10-day LinkedIn arc Days 1-10 exist, including Day-4 "Maria's question + EOI opens" (Wed 17 June) the matrix relies on as the EOI demand driver.
- Nomination copy kit exists (question, A5 card, P.S., social, host line) and includes the post-week nominee brief pointing at `/contained/brief` (route exists).
- Live-in-code assets the matrix leans on exist and are correctly described: event-confirm (clean/Adelaide-correct), nomination receipt + share tile, daily-digest cron, post-experience cron, nurture cron. The `/contained/eoi` route, `/contained/adelaide` booking page, and `/remand` route all exist.

So the structural plan is sound. The problems are in the *content* of three referenced assets and one tag name.

---

## 2. CRITICAL, the first prescribed sends carry retired figures and the plan does not flag them

The matrix's §7 canon and STANDING HAZARD #1 say the retired figures `$1.55M/yr` and `84% within two years` must NEVER reuse. STANDING HAZARD #1 lists the contaminated assets as "the launch HTML broadcast, welcome sequence, stream emails 3/4/5, pipeline-followup cron copy, and the stat tiles." **It omits the personal email templates.** But:

- **Template 1 (decision-maker invite)** body line 19: *"the evidence on the walls is sourced: $1.55 million per child per year, 84% reoffending within two years."* RETIRED on both figures.
- **Template 3 (media pitch)** body line 30/61: *"detention costs $1.55M per child per year (Productivity Commission), 84% reoffend within two years (AIHW), and Indigenous kids are 23.1 times more likely to be inside."* RETIRED ($1.55M, 84%-2yr).

The matrix actively recommends these exact assets as early, high-value sends, and labels them clean by omission:
- Row C2 (nominees) and Row A3-path / decision-makers → **Template 1**, "continuous, nightly" + "send-now."
- Row C6 (media) and Row A4 (Sonia) → **Template 3**, "by Wed 17 June."
- Part 5 sequenced plan lists Templates 1/3 in the "by Mon 15 Jun" and "by Wed 17 Jun" rows with the gate column reading only "site-scrub PR landed; §7 figures only" / "§7 figures; consent rules" — the §7 caveat is present as a blanket line but there is no asset-specific stale flag, so a human acting off the inventory (which marks Templates 1-4,6 as "drafted, send-now" with NO stale flag) would send the contaminated bodies.

This is the single most consequential miss in the plan: the retired-figure swamp the matrix exists to prevent leaks straight into the assets it tells a human to send FIRST. The inventory (`ground-02` rows 19-25) compounds it by tagging Templates 1,2,3,4,6 "drafted, send-now" / "send-now" with no stale marker on 1 and 3.

FIX: mark Templates 1 and 3 STALE in both the matrix STANDING HAZARD #1 list and the inventory table; require §7 regeneration ($1.33M national / $3,261/day SA ROGS 2024-25 Table 17A.20; 84% within 12 months AIHW 2023-24) before any send of Template 1 or 3; re-check the 23.1x figure against a cited source (it is not in the §7 canon list, and "23x" appears on the do-not-send launch HTML).

---

## 3. HIGH, two recommended assets do not exist as drafts

### 3a. "Media opener" (Row A4) does not exist
Row A4 routes "Sonia → media opener (opener via template 3)". The first-contact pack has openers 1-7 (supporters, youth-org, universities, services, funders, decision-makers, delegates) and **no media opener**. The parenthetical "(opener via template 3)" partly rescues it by pointing at Template 3, which exists, so this is not a true orphan, but the "media opener" label names an asset that is not in the pack. A human scanning for a "media opener" finds nothing. FIX: drop the "media opener" label; say "Template 3 media pitch" (and note Template 3 is itself stale per §2).

### 3b. "future-cities frame" personal snippet (Rows A4, A11, B11) does not exist
The matrix repeatedly prescribes a "future-cities frame" for interstate leads, e.g. Row A4: interstate ones (Lewina TAS, Rohan Sydney) → "master note + the future-cities frame ('Adelaide is stop two; here is how interstate works')," and Rows A11/B11 say "send the future-cities frame from the first-contact pack." **There is no future-cities frame in the first-contact pack** (grep for future/interstate/stop two/next city returns nothing in that file). What exists is the Future Cities STREAM email (`stream-emails.md` §6, a bulk asset, drafted/blocked) and the Day-8 interstate LinkedIn post — neither is a personal-reply snippet, and the matrix explicitly says "from the first-contact pack." So the matrix points interstate leads (a named, high-intent miss, including an inbound In-conversation contact) at an asset that is not drafted. FIX: either write a short interstate/future-cities personal snippet into the first-contact pack, or repoint the matrix to "master note + a bespoke interstate line (no template yet, write to Imagination Architect voice)."

---

## 4. MEDIUM, a stream tag in the plan contradicts the live GHL tag

The daily-recap stream is named inconsistently:
- `ground-01` (the live GHL reality map) records the live tag as `newsletter-stream:daily-adelaide-recap` (the tag actually sitting on VIP/funder rows in the book).
- `ground-02` inventory and the drafted body (`contained-stream-emails.md` §2) both use `newsletter-stream:contained-daily-recap`.
- The matrix Row C6 cites `daily-adelaide-recap`.

So the drafted asset's enroll tag (`contained-daily-recap`) does not match the tag that is actually live in GHL (`daily-adelaide-recap`). Anyone enrolling contacts off the drafted body would write a tag no contact currently carries, or fail to match the live segment. This is a tag/stage correction that contradicts live GHL. FIX: pick one canonical recap tag and reconcile the drafted body, the inventory, and the matrix to it; verify against the live tag before any recap enrolment. (Lower severity than §2 because the recap stream is event-week, gated, and not a launch-critical first send.)

---

## 5. LOW, count-label drift the matrix already half-acknowledges

Template 7 is named "the 28-contact stream" while the audit JSON `7-warm-public` is 34 (all gatePass, all inbound). The matrix Row C7 reconciles this as "~28-34" and notes both, so it is not an error, but the asset name ("the 28") and the live count (34) drift. FIX: when the stream is built, set the audience from the live `newsletter-stream:contained-adelaide-invite` membership and update the template's "28" label to the real count, rather than hard-coding 28.

---

## 6. Tag/stage corrections checked against live GHL, no other contradictions found

The matrix's documented tag/stage corrections are consistent with `ground-01`:
- Strip blanket `project:contained` / `project:contained-adelaide-2026`, keep `project:act-jh` + `source:event:contained` + `role:*` — matches the canon and the Phase-D KEEP-CSV rule. CORRECT.
- "Drive from the KEEP CSV, never from a `project:contained` tag query" — matches `ground-01` §6 and the memory note. CORRECT.
- The Partner/committed reclassification (Diagrama/JRI/Just Reinvest) flagged as proposed-not-applied, live still shows 7 — matches `ground-01` line 34. CORRECT (the matrix correctly refuses to auto-apply and routes to a human decision).
- Exclude the 2 test records (Captured) from sends — matches `ground-01` §1 Pipeline B. CORRECT.
- Stage IDs cited in the matrix (e.g. Identified `e0fdce64-...`, Personal outreach `78090229-...`, In conversation `e3aa0ddf-...`, Partner/committed `92737d7b-...`) match `ground-01` §1 exactly. CORRECT.

The ONLY tag-level contradiction with live GHL is the recap tag in §4 above.

---

## 7. Verdict

- Coverage: complete. No segment left without a recommended next touch.
- Asset existence: mostly solid, but two recommendations name assets that are not drafted (media opener as a label; future-cities personal frame), and the most-prescribed early sends (Templates 1, 3) are stale and not flagged as such.
- Tag/stage vs live GHL: one contradiction (recap stream tag), everything else matches.

Fix order for the human: (1) flag and regenerate Templates 1 + 3 to §7 BEFORE any Mon-15/Wed-17 send; (2) write or repoint the future-cities personal frame and drop the "media opener" label; (3) reconcile the daily-recap tag to the live GHL name. Items 1 is launch-critical; 2 and 3 are this-week-but-not-doors-blocking.

*End of verification. Read-only. Nothing executed.*
