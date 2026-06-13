# CONTAINED, Comms Fact-Check & Voice-Check Report

> Read-only QA pass. Nothing executed against GHL / Supabase / Vercel. No email sent, no tag written, no cron triggered.
> Compiled 2026-06-13.

## Scope note (read first)

The task named `output/contained-campaign-system/11-comms-system-and-drafts.md` (and copy "in 10/14") as the target. Those files **do not exist** in the repo as of 13 June:

- `11-comms-system-and-drafts.md` — not present anywhere in the repo (`find` returned nothing).
- `14-*.md` under contained — not present.
- `10-segment-informedness-matrix.md` — **exists**. It is a planning matrix, not a drafts file, but it embeds a few copy fragments (door-openers, a nominee softened line) and a canonical-figures block.

The matrix file 10 references the **actual drafted, sendable communications**, which live in two external files:

- `compendium/contained-adelaide-email-templates.md` — templates 1 to 7 (the real emails).
- `compendium/contained-adelaide-first-contact-pack-2026-06-11.md` — master note, 7 audience openers, 7 share blurbs.

Those two files are the real "drafted communications," so they are the substance of this fact-check. The four `ground-*` files and file 10 are analysis docs (they NAME retired figures and AI-tell words in order to ban them); their mentions are descriptive, not draftable copy, and are NOT counted as violations.

Authority for figures: `compendium/brand-guide.md` §7 (verified by direct read, lines 165 to 178). It OVERRIDES the campaign bible and the audience map where they conflict.

---

## PART 1 — CRITICAL: retired figures stated as fact in live email drafts

These are the show-stoppers. The drafts are written to be cut, pasted, and sent. Three carry figures the brand guide explicitly RETIRED on 2026-06-11, and they are stated as sourced fact (with a named authority next to them), which makes the error worse, not better. A human who trusts "Cut and paste, fill the [brackets], send" (the file's own opening instruction) sends wrong numbers to judges, MPs, funders, and journalists.

### C1. Template 1 (Decision-maker invite) — RETIRED $1.55M + "84% within two years"
- **File:** `compendium/contained-adelaide-email-templates.md:19`
- **Offending text:** "the evidence on the walls is sourced: $1.55 million per child per year, 84% reoffending within two years."
- **Why wrong:** `$1.55M/yr` is RETIRED (brand-guide §7 line, superseded by `$1.33M` national / `$3,261/day` SA). "84% within two years" is the RETIRED framing; the live AIHW figure is "84% within 12 months" (brand-guide §7 line 167). The sentence even claims the figure is "sourced," which it is not, against current canon.
- **Fix:** Lead SA-specific for an Adelaide audience: "the evidence on the walls is sourced: it costs $3,261 a day to hold one child in detention in South Australia (Productivity Commission, Report on Government Services 2024-25), and 84% of young people are back under sentenced supervision within twelve months of release (AIHW, 2023-24)." Or follow the first-contact-pack rule and quote no number in the email body, linking `justicehub.com.au/contained/brief` instead.

### C2. Template 2 (Funder invite) — no retired figure, but verify the build/stop costs
- **File:** `compendium/contained-adelaide-email-templates.md:41`
- **Text:** "A tour stop runs $30K. A new container costs $50 to 70K."
- **Status:** SOURCED and correct ($30K stop, $50–70K build, brand-guide §7 lines 175 to 176, source "CONTAINED Campaign Budget"). No change needed. Flagged only so it is not swept up in the fix to the others.

### C3. Template 3 (Media pitch) — RETIRED $1.55M, "84% within two years," AND fabricated precision "23.1 times"
- **File:** `compendium/contained-adelaide-email-templates.md:61`
- **Offending text:** "detention costs $1.55M per child per year (Productivity Commission), 84% reoffend within two years (AIHW), and Indigenous kids are 23.1 times more likely to be inside."
- **Why wrong:** (a) `$1.55M/yr` RETIRED, attributed to "Productivity Commission" — the current PC ROGS figure is `$1.33M` national / `$3,261/day` SA. (b) "84% within two years" RETIRED; AIHW canon is "within 12 months." (c) **"23.1 times" is fabricated precision** — brand-guide §7 (line 172) gives "**23x**", source "National youth detention statistics." There is no `23.1` in any canon source. A journalist will check this, and a wrong decimal attributed to a named agency is a credibility hit.
- **Fix:** "detention costs $1.33 million per child per year nationally, $3,261 a day in South Australia (Productivity Commission, Report on Government Services 2024-25), 84% of young people return to sentenced supervision within twelve months (AIHW, 2023-24), and Indigenous kids are about 23 times more likely to be inside." Drop the decimal; say "about 23 times" or "23x."

### C4. The two templates contradict the first-contact pack's own no-numbers rule
- **Files:** templates 1 and 3 quote dollar/percent figures in the body; `contained-adelaide-first-contact-pack-2026-06-11.md:15` says "**No dollar stats in this pack, on purpose** ... nothing prints or sends with numbers until source, year, and jurisdiction are locked. The decision-maker brief ... carries the sourced evidence; link to it instead of quoting numbers."
- **Problem:** The two artifacts disagree on whether to quote figures at all. The pack's rule is the safer one and is consistent with the "no stat without source/year/jurisdiction" launch gate (ground-04 §9).
- **Fix:** Decide one rule. Recommended: templates 1 and 3 drop inline figures and link `/contained/brief`, matching the pack. If figures stay, they MUST be the §7 canon numbers with year and jurisdiction, as in the C1/C3 fixes.

---

## PART 2 — HIGH: sourcing gaps that are not outright wrong but are unverified-as-sent

### H1. Template 2 / opener 5 / funder share blurb — "Mount Druitt was the proof"
- **Files:** `email-templates.md:39`, `first-contact-pack:88`, `first-contact-pack:124`, and the same claim recurs in file 10 (Rows A1, B1) and ground-04 §5.
- **Claim stated as fact:** Mount Druitt already happened / "was the first stop."
- **Status:** [UNVERIFIED] in the fact-check set. Mount Druitt being stop one is treated as settled across every doc, but there is no source line attached to it the way figures carry ROGS/AIHW. It is a factual claim about the campaign's own history; it is almost certainly true, but it carries no provenance in any file read.
- **Fix:** Confirm Mount Druitt actually ran (date, what was staged) and attach a one-line provenance to the campaign bible so "the proof" is anchored. Note: `output/email-contained-launch-ghl.html` reportedly dates Mount Druitt to "April" and Adelaide to "May" (per ground-02:75 and file 10), which are WRONG (launch is Tue 23 June). Do not let the date from that do-not-send file leak into a corrected draft.

### H2. Template 1 — "what Spain does instead" and Room 2 / Diagrama wording
- **File:** `email-templates.md:17` ("The second is what Spain does instead") and the pack master note (`first-contact-pack:33`, "a desk, pencils, a daily schedule that looks like a life").
- **Status:** SAFE as written. These are qualitative and respect the Diagrama wording gate (ground-04 §4: "lead with the qualitative ... and hold the percentage"). No Diagrama percentage (13.6%, €5.64) appears in any template or opener. Confirmed clean by grep.
- **Action:** None. Confirmed solid. Flagged only to record the gate was honoured.

### H3. Template 3 — "consent confirmed" for the young builders
- **File:** `email-templates.md:63` ("the young people who built it (consent confirmed)").
- **Problem:** ground-04 §9 holds "any young person's name/image/story" until consent is confirmed, and the first-contact pack (`:14`, `:17`) says "All consent pathways are still being confirmed." A media pitch that asserts "consent confirmed" before the gate clears states a consent status as fact that the campaign's own docs say is still in progress.
- **Fix:** Either confirm builder consent is actually closed before this pitch goes out (Wed 17 June per file 10 Row C6), or soften to "with consent pathways handled through their organisations." Do not assert "consent confirmed" until it is.

---

## PART 3 — Voice tests (Imagination Architect + Ben outreach voice)

Run against the two sendable-draft files (`email-templates.md`, `first-contact-pack-2026-06-11.md`).

| Test | Result | Evidence |
|---|---|---|
| **Em-dash (zero `—`)** | PASS | grep for U+2014 across both files returned NONE. |
| **AI-tell vocab blocklist** | PASS | grep for delve/crucial/pivotal/seamless/robust/comprehensive/nuanced/multifaceted/holistic/tapestry/navigate/synergy/scalable/"not just X but Y" returned NONE. |
| **"THE CONTAINED" / "The Contained"** | PASS | grep returned NONE; every instance is bare "CONTAINED". |
| **Real names, not abstractions** | PASS | Ben Knight signs; "young people" are named as the builders/hosts; Spain/Diagrama referenced concretely. Templates use `[Name]` placeholders by design (mail-merge), which is correct for a personal-send template. |
| **Ben outreach voice (warm, first-name, soft ask, human close)** | MOSTLY PASS | Greetings are "Hi [Name]" / "Hey"-adjacent; closes are "Warmly, Ben" and "See you inside." Soft asks present. One nit below. |
| **Curly vs straight quotes** | MINOR | Body copy uses straight apostrophes (e.g. "I'd", "It's"). The voice spec (ground-04 §8) calls for curly quotes in body copy. Low severity, cosmetic. |

### Voice nits (LOW severity)

- **V1. "Dear [Name]," opens Template 1** (`email-templates.md:15`). The Ben outreach voice (ground-04 §8, brand-guide §4) is "first-name casual greeting" and explicitly warm; "Dear" is the most formal greeting in the set. Defensible for judges/MPs, but inconsistent with the locked voice. Consider "Hi [Name]," to match the rest, unless formality is a deliberate choice for the judiciary.
- **V2. Sensory anchors** are present and good (phone and shoes at the door; "a desk, pencils, a daily schedule that looks like a life"). No deficiency. Recorded as solid.
- **V3. Straight quotes** throughout body copy (see table). Convert to curly for body copy on final pass, per spec. Cosmetic.

No em-dash, AI-vocab, or naming violations in any draft. The voice work is clean; the figures are the problem.

---

## PART 4 — File 10 (the matrix) and ground files: copy fragments checked

File 10 is analysis, not sendable copy, but it embeds a few quotable fragments. Checked:

- **Door-opener** "Who needs to walk through this before they make the next decision?" (file 10 Rows A1, C2; first-contact pack `:33`, `:44`, `:121`) — consistent everywhere, no figure, voice-clean. SOLID.
- **Nominee softened line** "someone who works alongside you asked us to make sure you were invited" (file 10 Row C2) — voice-clean, no claim of fact. SOLID.
- **File 10's own canonical-figures block** (lines 19 to 27) — matches brand-guide §7 exactly ($1.33M/$3,635, $3,261 SA, 84%/12mo, $75, 13.6%/€5.64, $30K, $50-70K) and correctly lists the retired set. VERIFIED correct against §7.
- **Em-dash / AI-vocab / "THE CONTAINED" in the ground files and file 10** — every grep hit is descriptive (the docs quote retired figures and AI-tell words in order to ban them; em-dashes appear in markdown table rules and analysis prose, not in Imagination-Architect narrative copy meant to ship). NOT counted as draft violations.

---

## PART 5 — The fix list, in send order

A human applies these; nothing here is executed.

1. **Before Template 1 or 3 goes to anyone:** replace `$1.55M` → `$1.33M` national / `$3,261/day` SA (ROGS 2024-25), "within two years" → "within 12 months" (AIHW 2023-24), "23.1 times" → "about 23 times / 23x." Or strip inline figures and link `/contained/brief` to match the first-contact pack rule.
2. **Resolve the figures-in-body contradiction** between the templates and the pack. Pick one rule, apply to both files.
3. **Soften "consent confirmed"** in Template 3 until builder consent is actually closed (H3).
4. **Attach provenance to "Mount Druitt was the proof"** (H1) so the campaign-history claim is sourced like the figures are. Do not import the wrong "April/May" dates from the do-not-send launch HTML.
5. **Optional voice polish:** "Dear" → "Hi" in Template 1 (V1); straight → curly quotes in body copy (V3). Low priority.

Every figure in the §7 canon (the $30K/$50-70K build costs in Template 2) is correctly sourced and needs no change. The voice is clean. The single critical class of error is retired figures stated as sourced fact in three sendable drafts.

---

*End of report. Read-only. All corrections documented for a human to apply; nothing sent, written, or triggered.*
