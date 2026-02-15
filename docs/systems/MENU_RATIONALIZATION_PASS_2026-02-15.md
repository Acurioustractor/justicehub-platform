# Menu Rationalization Pass (2026-02-15)

## Scope
Rationalize JusticeHub navigation against the locked Sprint 1 purpose model:
- community proof -> usable discovery -> intelligence -> national scaling (CoE) -> action.

Inputs used:
- `src/config/navigation.ts`
- `docs/systems/SPRINT_1_CYCLE_1_PURPOSE_MATRIX.md`
- `docs/systems/SPRINT_1_CYCLE_5_GAP_CLOSURE_AND_SPRINT_2_BACKLOG.md`

## Current Menu Health
- All current primary nav routes return `200` locally.
- Current nav tree is live and usable.
- No forced URL removals are required for Sprint 2.

## Implemented In This Pass
1. Added `For Partners` dropdown to primary navigation.
2. Moved `Roadmap` out of `Platform` and into `About`.
3. Added full-screen `All Pages` mega menu modal in header navigation.
4. Removed `Youth Scout` header/mobile CTA button.
5. Kept `Youth Scout` available in footer (`For Youth`) for later re-promotion.

## Rationalization Principles
1. Keep public nav stable while canonical data migrations finish.
2. Keep "Discover -> Intelligence -> CoE" as the core user path.
3. Reduce duplicate concepts across top nav and footer.
4. Promote audience pathways that are live but currently hidden from primary nav.
5. Move secondary/platform ops content out of top-level attention where possible.

## Main Navigation Decisions

| Current Item | Route | Decision | Status | Change Window |
|---|---|---|---|---|
| Stories | `/stories` | Keep as top-level narrative entry point | Active | Now |
| Discover | dropdown | Keep | Active | Now |
| People | `/people` | Keep | Active | Now |
| Organizations | `/organizations` | Keep | Active | Now |
| Programs | `/community-programs` | Keep (canonical programs model) | Active + recently stabilized | Now |
| Services | `/services` | Keep | Active | Now |
| Service Map | `/community-map` | Keep, consider label alignment to "Community Map" | Active + recently stabilized | Sprint 2 copy pass |
| Thematic Areas | `/themes` | Keep | Active | Now |
| Opportunities | `/opportunities` | Keep, but demote in prominence if low usage | Active | Post-telemetry |
| Intelligence | dropdown | Keep | Active | Now |
| ALMA Dashboard | `/intelligence/dashboard` | Keep | Active | Now |
| Ask ALMA | `/intelligence/chat` | Keep | Active | Now |
| System Map | `/intelligence/map` | Keep | Active | Now |
| Interventions | `/intelligence/interventions` | Keep | Active | Now |
| Research Agent | `/intelligence/research` | Keep | Active | Now |
| Impact Calculator | `/intelligence/impact-calculator` | Keep | Active | Now |
| Evidence Library | `/intelligence/evidence` | Keep | Active | Now |
| Funding | `/intelligence/funding` | Keep | Active | Now |
| Reports | `/intelligence/reports` | Keep | Active | Now |
| Youth Justice Report | `/youth-justice-report` | Keep | Active | Now |
| Centre of Excellence | dropdown | Keep | Active | Now |
| CoE Overview | `/centre-of-excellence` | Keep | Active | Now |
| Basecamps | `/centre-of-excellence/map?category=basecamp` | Keep | Active | Now |
| Key People | `/centre-of-excellence/people` | Keep | Active | Now |
| Research Library | `/centre-of-excellence/research` | Keep | Active | Now |
| Best Practice | `/centre-of-excellence/best-practice` | Keep | Active | Now |
| Global Map | `/centre-of-excellence/map` | Keep (data authority changing) | Active + planned backend shift | Sprint 2 (`G4`) |
| Global Insights | `/centre-of-excellence/global-insights` | Keep | Active | Now |
| International Exchange | `/international-exchange` | Keep | Active | Now |
| Platform | dropdown | Keep, but tighten to operational/publishing surfaces | Active | Sprint 2/3 |
| Blog | `/blog` | Keep | Active | Now |
| Events | `/events` | Keep | Active | Now |
| Stewards | `/stewards` | Keep | Active | Now |
| Transparency | `/transparency` | Keep | Active | Now |
| Gallery | `/gallery` | Keep | Active | Now |
| Art & Innovation | `/art-innovation` | Keep | Active | Now |
| Roadmap | `/about/roadmap` | Move under About in primary nav IA | Active | Sprint 3 IA tidy |
| About | `/about` | Keep as standalone primary link | Active | Now |
| Youth Scout CTA | `/youth-scout` | Keep as distinct CTA | Active | Now |

## Live Pages Missing From Primary Navigation (Recommended Additions)

| Page | Route | Recommendation | Why |
|---|---|---|---|
| For Community Leaders | `/for-community-leaders` | Add under new "For Partners" dropdown | Core audience landing page already live |
| For Funders | `/for-funders` | Add under new "For Partners" dropdown | Funding pathway should be first-class |
| For Government | `/for-government` | Add under new "For Partners" dropdown | Government pathway currently hidden |
| For Researchers | `/for-researchers` | Add under Intelligence or "For Partners" | Research audience path exists but is hidden |

## Immediate IA Recommendation (Low Risk)
1. Keep existing top-level menu structure and URLs unchanged through Sprint 2.
2. Add one new dropdown: `For Partners` with `/for-community-leaders`, `/for-funders`, `/for-government`, `/for-researchers`.
3. Move `Roadmap` from Platform dropdown to About grouping.
4. Keep footer as the extended sitemap for secondary links.

## Routes Currently In Transition
1. `/stories`
- Local-first list mode is active until Empathy Ledger env is configured.
2. `/community-programs` and `/community-map`
- Canonical programs migration is complete and should remain stable.
3. `/centre-of-excellence/map`
- Planned shift from static authority to API-backed authority (`G4`).

## Defer / Do Not Change Yet
1. Do not remove compatibility-backed surfaces from menus until telemetry-backed deprecation decisions are approved.
2. Do not rename primary routes during Sprint 2.
3. Do not collapse Intelligence or CoE submenus until usage telemetry and partner review are complete.

## Suggested Cadence
1. Sprint 2: add `For Partners`, keep route stability.
2. Sprint 3: menu cleanup pass (Roadmap relocation, Opportunities prominence decision).
3. Sprint 4: telemetry-based submenu simplification.
