# Post-Alice-Springs Impact Pipeline — Scoping

**Status:** SCOPING (pre-trip reflection capture must deploy before 15 September 2026)
**Last updated:** 2026-04-25
**Owner:** Ben Knight · JusticeHub + Oonchiumpa lead (TBC)
**Parent plan:** `~/.gstack/projects/Acurioustractor-justicehub-platform/ceo-plans/2026-04-25-minderoo-phase-3-integration.md` (Cherry-pick #6)

## Purpose

On 15 September 2026, 55 judges and magistrates gather at Oonchiumpa in Mparntwe for a Judges on Country field trip. The post-trip impact pipeline is the Phase 3 conversion artefact — the shipping evidence that carries the Minderoo conversation from July's pitch into November's partnership confirmation. Without this pipeline, Phase 3 has no new proof to offer. With it, the July–November window produces one of the strongest philanthropy-backed behavioural-change artefacts in Australian youth justice.

## Ethics pathway (closed decision)

**HREC ethics clearance for judicial-officer research is OFF THE TABLE.** Formal human research ethics applications in Australia require 3–6 months. The measurement window for this pitch closed before January 2026. We cannot retroactively acquire research-grade clearance.

**The plan is voluntary reflection capture, not research.** Each judge participates under voluntary consent; data is held as reflection artefacts, not research findings; published outputs are descriptive (what judges noticed, what shifted) rather than inferential (what caused sentencing change). ANU True Justice partnership provides methodological soundness guidance without being the HREC pathway.

This is a real constraint. The pipeline operates entirely inside it.

## Pipeline stages

### Stage 1 — Pre-trip reflection capture (deploy before 15 September)

Short-form voluntary reflection questionnaire distributed to participating judges 4–6 weeks pre-trip. Focus on three dimensions:

1. **Current sentencing framework** — What does the judge already know about community-based alternatives? Where in their current practice do they encounter (or not encounter) evidence of Aboriginal community-controlled diversion programmes?
2. **Expectation-setting** — What does the judge expect to encounter on Country? What would make this a meaningful use of their time?
3. **Self-identified blind spots** — What do they know they don't know about Aboriginal youth justice outside the courtroom?

Capture method: web form with voluntary consent statement; responses stored in a single Supabase table (`judges_on_country_reflections`) with per-respondent opt-out tokens. No names required; opt-in name field for those comfortable being identified.

Deployment gate: Ben + Oonchiumpa lead review questions before distribution. Chief Magistrate coordination facilitates distribution.

### Stage 2 — Day-of capture (15 September)

Oonchiumpa-led activity runs. No data collection during the session itself — the activity is the activity, not the observation of the activity. Judges receive postcard decks (co-branded with Minderoo's "Evidence partner" mark on card 01 and QR backs — gated on Minderoo partnership confirmation).

Exit moment: voluntary, verbal check-out. Each judge offered a short recorded reflection prompt (optional, consented in-moment): "What is one thing you will take back to chambers?" Audio stored with per-respondent consent.

### Stage 3 — Post-trip reflection capture (30 days post-trip)

Same respondent pool as pre-trip. Three dimensions mirror the pre-trip questionnaire:

1. **Shifts observed** — What, if anything, changed in your understanding of community-based alternatives?
2. **Practice implications** — Where in your current practice will this make a difference? What would make it easier?
3. **System-level reflection** — What does this experience say about the gap between what sentencing officers see and what communities are actually doing?

Deployment timing: 15 October 2026 (exactly 30 days post-trip).

### Stage 4 — Human-gated release (20 October 2026)

Pre-publication review gate before ANY release. Named reviewers:

- **Ben Knight** — JusticeHub lead, operational responsibility for accurate representation.
- **Oonchiumpa lead** (Kristy Bloomfield or Tanya Turner) — cultural authority, final say on any public narrative involving Country-based content.

Review dimensions:

- Does anything in the report misrepresent what judges said? → Cut.
- Does anything in the report breach cultural protocol? → Cut.
- Does anything in the report name or identify judges who did not opt in to identification? → Cut or anonymise.
- Does the report say more than the data supports? → Rewrite with weaker claims.

Only after this gate closes does the report enter any distribution pipeline.

### Stage 5 — Phase 3 conversion artefact (November 2026)

Outputs feed three distinct audiences:

1. **Minderoo partnership conversation** — Private briefing document; most detailed version; includes numerics where consent permits. Hand-carried or sent under non-disclosure before the November conversion conversation.
2. **Judicial officer network** — Summary shared with the 55 participating judges plus Chief Magistrate offices. Peer-to-peer legitimacy; Oonchiumpa's narrative held at the centre.
3. **Public evidence surface** — Descriptive, anonymised, community-approved summary published on `/judges-on-country/alice-springs` (expand the existing page). Minderoo named as evidence partner (gated on partnership confirmation).

## Technical implementation

Route additions:

- `/judges-on-country/alice-springs/reflections` — voluntary capture form (pre-trip + post-trip)
- Supabase table: `judges_on_country_reflections` with columns `id`, `respondent_token`, `phase` (pre/post/exit), `questions_json`, `consented_identification`, `submitted_at`, `withdrawn_at`
- QR code on postcards (non-Minderoo-branded version) already links to `/judges-on-country/postcards` — can surface a "reflection" CTA once Stage 1 form is live

Build time: ~2 days CC+gstack for the form + review dashboard surface. Minimal engineering. Most of the work is content — questionnaire design, consent statements, review gate documentation, Chief Magistrate coordination.

## Critical path

- **Now → mid-May 2026:** Questionnaire design, ANU True Justice methodological review, Oonchiumpa review of content, Chief Magistrate coordination initiated
- **Mid-May → mid-July 2026:** Distribution to the 55 judges, consent collection, pre-trip responses gathered
- **15 September 2026:** Field trip on Country; day-of voluntary exit reflection
- **15 October 2026:** Post-trip survey closes
- **20 October 2026:** Human review gate (Ben + Oonchiumpa lead)
- **15 November 2026:** Phase 3 Minderoo conversation — reviewed artefact in hand

**If any milestone before 15 September slips, the entire pipeline cannot recover.** The pre-trip baseline is not retrievable once the field trip begins. Treat the pre-September dates as hard deadlines.

## What this is NOT

- NOT research in the academic sense (no HREC, no inferential claims)
- NOT a judges' survey used to pressure the judiciary
- NOT a communications asset to be extracted and published without the review gate
- NOT a mechanism for citing named judicial officers in advocacy

## What this IS

- A voluntary, consented, trauma-informed reflection capture
- The primary Phase 3 Minderoo conversion artefact
- A precedent structure: once it works for Alice Springs, the same model scales to the next Judges on Country trip in Mount Druitt or Brisbane
- A way to show Minderoo that the 15 September event produced something worth their three-year partnership

## Open items

- [ ] Draft pre-trip questionnaire (3 questions max, voluntary)
- [ ] Draft post-trip questionnaire (3 questions max, mirror structure)
- [ ] ANU True Justice partnership: methodological review by end May
- [ ] Oonchiumpa lead review: content, protocol, cultural fit by end May
- [ ] Chief Magistrate coordination: confirm distribution pathway to 55 judges
- [ ] Consent statement: voluntary, plain-language, withdrawable at any time within 14 days
- [ ] Build `/judges-on-country/alice-springs/reflections` surface (post-design sign-off)
- [ ] Design review-gate workflow (two-person named sign-off before ANY release)
