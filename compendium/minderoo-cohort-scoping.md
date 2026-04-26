# Minderoo Cohort Storyteller Playlist — Scoping

**Status:** SCOPING (consent conversations not yet initiated)
**Last updated:** 2026-04-25
**Owner:** Ben Knight · JusticeHub
**Parent plan:** `~/.gstack/projects/Acurioustractor-justicehub-platform/ceo-plans/2026-04-25-minderoo-phase-3-integration.md` (Cherry-pick #5)

## Purpose

The Minderoo Cohort is a curated playlist of 6–10 Empathy Ledger storytellers whose experiences map across the five CoLI 2024 issue categories most relevant to the Minderoo partnership. Minderoo "adopts" the cohort for 3-year accompaniment — quarterly story updates, named credit in external comms, the right to cite these voices in their own impact reporting.

**The cohort is a commitment device, not a communications asset.** Minderoo is not buying stories; Minderoo is paying for the right to walk alongside named storytellers for three years with their consent.

## Non-negotiables

1. **Per-storyteller consent precedes everything.** No storyteller enters the cohort without their own explicit, recorded, withdrawable consent. Not just the community's consent — the individual's. Full stop.
2. **Community cultural authority precedes individual consent.** Each anchor organisation's governance structure (Oonchiumpa leadership, PICC board, BG Fit direction, MMEIC Elders-in-Council) signs off on the cohort framing BEFORE any individual conversation is initiated. This is how cultural protocol works. Not optional.
3. **Withdrawal at any time, for any reason, within 14 days across every surface.** No exceptions for "we already printed it" or "Minderoo already cited it." Withdrawn means withdrawn.
4. **No timeline pressure.** Consent runs on community time, not pitch time. If the Minderoo Phase 3 conversation happens before the cohort is ready, the cohort is not ready. Do not force it.
5. **The 6–10 number is a ceiling, not a floor.** Two storytellers is fine if that is what community consent yields. Ten is the maximum.

## CoLI 2024 issue mapping (intended spread)

Each storyteller voice maps to one CoLI 2024 issue category. The cohort shows Minderoo that the research their investment supported is being answered across every area of late intervention — not just youth justice.

| CoLI category | 2024 spend | Cohort voice target | Candidate anchor |
|---|---|---|---|
| Child protection (43%) | $10.2B | A voice on child-protection to youth-justice bridge | Oonchiumpa or PICC |
| Youth justice (14%) | $3.4B + $1.5B | Young person's account of detention/community supervision | Oonchiumpa or BG Fit |
| Youth homelessness (8%) | $1.8B | Housing precariousness as intersecting issue | Oonchiumpa or MMEIC |
| Mental health (7%) | $1.6B | Cultural healing as mental health infrastructure | Oonchiumpa or PICC |
| Family violence (+110% real) | $0.6B | Trauma-informed, survivor-led, co-consented | PICC or BG Fit (only with trauma protocol) |

The +110% real-terms growth in family violence makes it the fastest-rising CoLI category. A storyteller whose consent is held trauma-informed (with the survivor's complete control over framing, re-approval at every re-use, access to a support person during any update cycle) is the most impactful single voice we can add.

## Consent workflow (per storyteller)

1. **Community sign-off first.** Each anchor's cultural governance body confirms the cohort framing is acceptable. Written decision recorded in Empathy Ledger governance layer.
2. **Storyteller invitation held by community.** The anchor organisation (not JusticeHub) initiates the conversation with candidate storytellers. JusticeHub provides briefing material on the Minderoo partnership and the commitment it entails.
3. **Recorded verbal consent + written consent form.** Both, not either-or. Recorded via Voice Memo per the Brave Ones Guided Access workflow; written form signed by storyteller (and guardian for minors) held in Empathy Ledger.
4. **Per-asset consent granularity.** Photo yes / audio yes / written transcript no. Photo yes for community use only / not for Minderoo cohort. And so on. The cohort page respects each storyteller's asset-level consent tags.
5. **Quarterly re-approval.** Minderoo receives a quarterly cohort update; each storyteller re-approves any new asset or significant re-use before it is sent. Silence is not consent.
6. **Withdrawal pathway explicit.** Each storyteller has a named contact at their anchor who can execute a withdrawal request; the request propagates across Empathy Ledger, JusticeHub, /partners/minderoo, and any Minderoo-held copies within 14 days.

## Technical implementation (gated on consent completion)

Route: `/partners/minderoo/cohort` (inside the `/partners/[slug]` template).

Data source: Empathy Ledger v2 API with a `cohort = "minderoo-2026"` tag on included stories. Tag is per-asset, not per-storyteller — granular consent respected.

Render: each storyteller appears as a card with name (or chosen handle), anchor community, CoLI category addressed, a content surface (photo/audio/transcript depending on their consent), and a last-updated date. Minderoo logo footer on the cohort page only — not on individual story cards (where the storyteller is the primary).

Build time: ~2 days of CC+gstack work. This is the smallest part. The preceding consent work is the critical path.

## What this is NOT

- NOT a way for Minderoo to use Aboriginal stories in their marketing
- NOT a "case studies" page in the corporate-philanthropy sense
- NOT something we ship to meet a pitch deadline
- NOT something we rush to make "ready" for the 15 September Alice Springs event
- NOT something where JusticeHub decides who's in the cohort

## What this IS

- A public, consented, storyteller-owned commitment device that visibly links Minderoo's investment to specific humans for three years
- A mechanism that turns an abstract partnership into a concrete set of relationships
- A way for Minderoo to cite real voices in their advocacy, with permission, for a bounded period
- A precedent structure: once the Minderoo Cohort works, the same model scales to Paul Ramsay / Ian Potter / Myer Foundation with no additional platform work

## Open items

- [ ] Initiate cultural-authority conversations at Oonchiumpa (Kristy Bloomfield + Tanya Turner), PICC (Rachel Atkinson), BG Fit (Brodie Germaine), MMEIC (Elders-in-Council).
- [ ] Draft trauma-informed consent protocol for any family-violence storyteller — review with ANU True Justice partnership before use.
- [ ] Build Empathy Ledger tag schema for `cohort = "minderoo-2026"` with per-asset consent granularity.
- [ ] Design quarterly re-approval workflow (lightweight — not a research burden).
- [ ] Minderoo partnership-observer briefing on cohort protocols (so Lucy Stronach understands what she is and is not signing up to).
