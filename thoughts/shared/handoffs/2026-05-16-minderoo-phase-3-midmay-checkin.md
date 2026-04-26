# Minderoo Phase 3 — Mid-May Check-in

Fired: 2026-05-16 (scheduled 2026-04-25)
Agent: remote one-shot

## Status per cherry-pick

| # | Item | Status | Evidence | Notes |
|---|------|--------|----------|-------|
| 1 | Partnership reframe shipped | FAIL | `public/pitch/minderoo/index.html` deleted in `a2324db` (Apr 21) | Pitch was built pre-Phase-3 and deleted same day as collateral of Mounty Yarns takedown. No `src/app/pitch/minderoo/page.tsx` exists. All 6 sub-elements absent (see below). |
| 2 | Lucy Stronach conversation | NOT YET | No commits since 2026-04-25; `output/funder-emails-draft.md` Email 2 has no follow-up notes | Email 2 is addressed to "Lucy Quarterman" — wrong contact name. No evidence of a May 15 conversation. |
| 3 | Postcard co-brand | UNKNOWN | `designs/judges-postcards-minderoo-cobrand-brief.md` does not exist; `designs/judges-postcards.pen` last touched in `5b4f2bd` (pre-Apr-25) | No co-brand brief written. Pen file unmodified since April. At mid-May, design-not-started is expected per timeline, but the brief is needed before design can start. |
| 4 | Minderoo Cohort consent | NOT INITIATED | `compendium/minderoo-cohort-scoping.md` does not exist; no commits since Apr 25 mentioning cohort, consent, or storyteller | No scoping doc, no git evidence of community conversations started. |
| 5 | Post-Alice-Springs pipeline | NOT STARTED | `src/app/judges-on-country/alice-springs/reflections/` does not exist; `src/app/api/judges-on-country/` has no reflection route (routes: org-media, photo-overrides, postcards, voices) | No scaffolding at all. Pre-trip capture must deploy before Sep 15 — 122 days remain. |

### Cherry-pick #1 element detail (FAIL)

The pre-Phase-3 pitch (`public/pitch/minderoo/index.html`, recoverable from git `e9b700c`) contained:
- Hero kicker: "For Minderoo Foundation · Envelope ships 1 May 2026" — **not** "For Lucy Stronach · Named evidence partner envelope" (FAIL)
- Metadata: no "named evidence partnership" or "six-year arc" language (FAIL)
- `$7,775/day` Victorian stat: present in HTML (`e9b700c` line ~middle) — attribution to COLI24 p.22 (PASS in old pitch, but the pitch is deleted)
- `coliStats` with +74%/+81%/+110%: `74%` appears as a CSS column height, not as a labelled stat array (FAIL)
- The Front Project attribution: present as a source citation — "Source: The Front Project / Minderoo Foundation · Cost of Late Intervention 2024" (PARTIAL in old pitch)
- "First tranche of a six-year arc" / "named evidence partner": absent (FAIL)
- Section 6B with M&E, governance, platform-risk columns: absent (FAIL)
- Section 4B / theory of change → Three Circles: absent (FAIL)

## Blockers

1. **Pitch deleted** — `public/pitch/minderoo/index.html` was removed in `a2324db` as part of the Mounty Yarns takedown (Apr 21), four days before Phase 3 was accepted. The entire Phase 3 reframe must be rebuilt from scratch without Mounty Yarns references. Owner: Ben. Resolution: rebuild pitch (or restore from `e9b700c` and apply Phase 3 edits) before May 15 retrospective.

2. **Wrong contact name in outreach doc** — `output/funder-emails-draft.md` Email 2 is addressed to "Lucy Quarterman" (line 40), but the correct contact is Lucy Stronach (lstronach@minderoo.org). Any outreach drafted from this file will reach the wrong person. Owner: Ben. Resolution: correct Email 2 header before next send.

3. **No co-brand brief** — `designs/judges-postcards-minderoo-cobrand-brief.md` does not exist. Without it, the designer has no brief to start from. Target is design-finalised end-July, print-order mid-August. Owner: Ben. Resolution: write brief by end of May to keep July deadline reachable.

4. **Minderoo Cohort scoping doc absent** — `compendium/minderoo-cohort-scoping.md` has not been created. Community consent conversations at Oonchiumpa, PICC, BG Fit, MMEIC cannot be tracked or reported. Owner: Ben + community liaison. Resolution: create scoping doc and initiate cultural-authority conversations before any storyteller identification.

5. **Reflection pipeline unscaffolded** — No routes, no directory, no schema for pre-trip reflection capture. 122 days to Sep 15 is workable but needs to start now given cultural review requirements. Owner: engineering. Resolution: scaffold `src/app/judges-on-country/alice-springs/reflections/` and `src/app/api/judges-on-country/reflections/route.ts` as a priority.

## Next actions (for Ben to consider)

- **Rebuild pitch page** targeting Lucy Stronach, applying all Phase 3 reframe elements (named evidence partner framing, six-year arc, Section 4B/6B structure, correct CoLI stats). Exclude all Mounty Yarns references.
- **Correct Email 2 contact name** from "Lucy Quarterman" to "Lucy Stronach" in `output/funder-emails-draft.md` before any resend.
- **Write postcard co-brand brief** at `designs/judges-postcards-minderoo-cobrand-brief.md` to unblock design in June.
- **Create cohort scoping doc** and initiate cultural-authority conversations with Oonchiumpa, PICC, BG Fit, MMEIC — consent is the long-lead item and gates the storyteller playlist.
- **Scaffold reflection pipeline** routes and directory structure to ensure pre-trip capture can be tested before August.

## Calendar check

- **May 15 gate**: No evidence in the repo that the Lucy Stronach conversation happened. No follow-up notes in `output/funder-emails-draft.md`. Status: missed or unrecorded.
- **Sep 15 field trip**: 122 days remaining from 2026-05-16. Pre-trip window is reachable if reflection pipeline scaffolding starts within 2-3 weeks. Cultural review of the reflection form will add lead time.
- **Nov 2026 conversion**: No preparation surfaced in the repo. Pitch rebuild (blocker #1) is the prerequisite — conversion conversation cannot proceed without a Phase 3 pitch in place.

## Agent notes

- The Mounty Yarns takedown (`a2324db`, Apr 21) removed the Minderoo pitch as an explicit line item: "Public routes now return 404: /pitch/minderoo/ (index + gallery + consent JSON removed)." This was before Phase 3 was accepted (Apr 25). The plan's cherry-pick #1 therefore describes work that needs to be done, not work that existed and was later deleted in the reframe.
- The funder email doc (`output/funder-emails-draft.md`) was written before the Phase 3 plan and uses the $7,304/day detention figure (line 51). The pitch HTML used $7,775/day from COLI24. These figures should be reconciled in the rebuilt pitch.
- No scoping docs or brief files for cherry-picks #3–#6 exist anywhere in the repo. All five Phase 3 items beyond the pitch are greenfield as of this check-in.
