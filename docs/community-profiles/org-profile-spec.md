# Community-controlled organisation profiles: build spec

**Date:** 2026-06-10
**Status:** spec for co-design — nothing here ships until an anchor community has shaped it
**Companion:** `output/proposals/community-justice-strategy-2026-06.md` (the why), `docs/justice-matrix/intake-thematics-ux-review-2026-06-10.md` (the pipeline lessons this inherits)

## Purpose

The atomic unit of the domestic strategy is the site-level profile: one community-controlled organisation, what it runs, what it achieves, what it costs against detention, and its stories, all under the organisation's own control. This is the unit the justice reinvestment map is made of, the unit case studies render from, and the unit that makes the law reform argument site by site.

## Governance model (decided before fields)

1. **The organisation is the editor of record.** A profile has an owning organisation contact. Nothing publishes to their profile without their approval. JusticeHub staff can stage, never publish.
2. **Three visibility levels per section**, mirroring the Empathy Ledger consent vocabulary already enforced in SQL: Public Knowledge Commons (anyone), Community Controlled (shown summarised or by permission), Strictly Private (never rendered, exists for the org's own use).
3. **Verification ladder**, displayed honestly like the matrix badge: `unclaimed` (we created a stub from public records) → `org-confirmed` (the organisation reviewed and approved it) → `community-verified` (outcomes confirmed with the community's own evidence). The ladder is a public trust signal and a curation queue.
4. **OCAP/CARE alignment in mechanism, not policy**: lived-experience stories never auto-enrol into anything (the lane:community guardrail already in the GHL contract), exports respect section visibility, and deletion requests are honoured at the row level.
5. **Protocol reference**: Mukurtu's cultural-protocol model is the design reference for section-level access; we adopt the pattern (who may see what, decided by the community), not necessarily the software.

## Profile anatomy

| Section | Sources (existing tables) | Default visibility |
|---|---|---|
| Identity: name, Country/place, governance type, community-controlled status | `organizations` (note: `state`, `is_indigenous_org` columns) | Public |
| Programs and models run | `alma_interventions` (guarded reads only) | Public |
| Outcomes and evidence | `alma_evidence` (consent-gated), org-supplied documents | Org chooses per item |
| Cost picture: program cost vs detention benchmark | `justice_funding`, ROGS detention table | Public once org-confirmed |
| Funding history | `justice_funding` (`alma_organization_id` FK, `amount_dollars`) | Org chooses |
| Stories | Empathy Ledger v2 API only (never direct EL queries) | Per-story EL consent |
| Network: basecamp/spoke relationships, related orgs | `organizations` + curated links | Public |

## Page + routes

- `/communities/[slug]` public profile (working name; could live under `/directory`)
- `/communities/[slug]/claim` the claim-and-confirm flow for the org contact
- Admin staging queue mirroring the matrix discoveries pattern: stub creation from public records is staged, org approval is the publish gate (the same provenance-gate lesson as the contribute form: nothing org-owned auto-publishes)

## Build order

1. **Co-design round with Oonchiumpa (Mparntwe)** before any code: walk the anatomy table with them, let them strike and add sections, decide default visibilities. The spec is wrong until a community has edited it.
2. Stub profiles for the four anchor communities from existing data, staged not published.
3. Claim flow + org-confirmed badge.
4. Cost-picture block (program cost beside the ROGS detention benchmark) — this is the law reform unit.
5. Justice reinvestment map view: profiles with `justice-reinvestment` tagging plotted, the view the network co-directors see in the late-June conversation.
6. Spoke circuit tooling for the Australia trip: a capture flow that works in the room with an org (offline-tolerant form staging to the same queue).

## Inherited rules (hard)

- All `alma_interventions` reads filter `.neq('verification_status','ai_generated')` (leak audit in progress 2026-06-10).
- Real photos only, from Empathy Ledger with consent. No AI-photorealistic imagery anywhere on a profile.
- Every dollar figure renders with its source (provenance sidecar pattern).
- Brand: profiles are public-facing JusticeHub surfaces — DESIGN.md editorial system, no em dashes, no AI vocabulary in copy.
