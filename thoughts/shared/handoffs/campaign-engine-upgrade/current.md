---
date: 2026-03-27T00:30:00Z
session_name: campaign-engine-upgrade
branch: main
status: active
---

# Work Stream: campaign-engine-upgrade

## Ledger
**Updated:** 2026-03-27T00:30:00Z
**Goal:** Funder Pitch & Basecamp Pilot — 7 builds shipped, campaign network mapped, Teya follow-up TODAY.
**Branch:** main
**Test:** npm run type-check (ignore database.types.ts errors)

### Now
[->] **Add 29 original Notion container requesters to campaign doc + locations view.** Then finalize Teya email.

### This Session (2026-03-26 session 6)

#### 7 Funder Pitch Builds — ALL SHIPPED
- [x] **Community org pitch pages** `/for-funders/org/[slug]` — PICC shows 21 programs/$44M, Mounty Yarns 7/$30M
- [x] **Funder comparison view** `/for-funders/compare` — portfolio overlap, ACCO allocation ratios
- [x] **"$1M buys" calculator** enhanced with basecamp section (coordinators, profiles, basecamps)
- [x] **Evidence gap matrix** `/for-funders/evidence-gaps` — 3ie-style grid with hover tooltips
- [x] **Per-funder reports** `/for-funders/report/[dusseldorp|prf|minderoo]` — custom asks + portfolio analysis
- [x] **Basecamp dashboard** enhanced — evidence profile, completeness score, funder view link
- [x] **CivicScope in viz** — live feed panel in explore mode with ministerial statements

#### Funder Landing Page Rewrite
- [x] `/for-funders` rewired as front door to all 7 builds — hero, due diligence tools, per-funder reports, basecamp pilot proposal, proof points, viz link

#### Column Name Fixes
- [x] Fixed: `intervention_type→type`, `funder_name→recipient_name`, `annual_cost_aud→cost_per_young_person`, `participants_annually→estimated_annual_capacity`, `community_verified→verification_status`

#### Storytelling Viz Hosted
- [x] `public/viz/ecosystem-map.html` — served at `/viz/ecosystem-map.html` on production

#### Campaign Network Map — Complete
- [x] **6 tour stops in DB** — Brisbane (NEW) + Townsville (NEW) added, Tennant Creek partner fixed to Oonchiumpa
- [x] **Per-location admin view** built at `/admin/contained/locations` — accordion cards with people, orgs, stats
- [x] **Location API** `/api/admin/contained/locations` — auto-maps people to stops via city-level keyword matching
- [x] **Melbourne + Canberra** added as demand-signal locations (5 + 3 people asking)
- [x] **Campaign bible** at `output/campaign-location-overview.md` — 478 lines, all people/orgs/politics/funding

#### Key Discovery: 29 Original Container Requesters (Notion)
- [x] **Found Notion DB** — `collection://66d47678-3c91-4430-8414-5b5b168ed117`
- [x] **29 people** from Oct-Nov 2025 who filled out website form / LinkedIn / email — ALL still "New" or "Contacted"
- [ ] **NOT YET ADDED** to campaign doc or locations view — this is next

#### Outreach DB Additions
- [x] Added to `campaign_outreach`: Rachel Atkinson (PICC), Kristy Bloomfield, Tanya Turner, Kimberley Wilde, Megan Argent, Robert Tickner, Dr Katrina Raynor, Peter Norden AO, Jonas Kubitscheck, William Frazer, Scarlett Steven, Margot Beach, Anne Gripper, Joe Kwon, Christine Thomas

### Previous Session (2026-03-26 session 5)
- [x] Design doc APPROVED (8.5/10), CEO plan with 7 expansions
- [x] Viz v3 (7 stories, dark tiles, explore mode)
- [x] `justice_funding_clean` view
- [x] 3 funder emails drafted (Teya HOLD, Lucy, Kristy)
- [x] Oonchiumpa location corrected, Story 2 rewritten

### Next
- [ ] **Add 29 Notion requesters** to campaign doc + outreach DB, mapped to locations
- [ ] **Finalize Teya email** — add Dusseldorp YIR refs, new page links, unhold
- [ ] **Call Peter Norden** — 0409 04994 (14 unread messages)
- [ ] **Respond to donation offers** — Dr Romina, John Katahanas
- [ ] **Write op-ed** for Peter Rowe (First Nations News)
- [ ] **Post 3** (cost data) — link to calculator + evidence gaps
- [ ] **Coordinator JD** — fractional 0.5 FTE role (needed before Mar 31)
- [ ] **Re-engage Julia Payne (PRF)** — Townsville/PICC angle (Mar 31)
- [ ] **Prepare Lucy Stronach (Minderoo) call** — week of Apr 6

### Key Data

| Metric | Value |
|--------|-------|
| Tour stops | 6 (+ Melbourne + Canberra demand signals) |
| People mapped | 68 in locations view |
| Original requesters (Notion) | 29 (not yet added) |
| LinkedIn general engagers | 159 |
| Total campaign contacts | 205+ |
| Commits this session | 9 |

### Decisions
- ALP National Conference (Jul 23-25 Adelaide) = dual activation: community Jun 15 + political Jul 23-25
- Brisbane venue: YAC wants to HOST (Shannon Cant, Katherine Hayes)
- Townsville = PICC as anchor (21 programs, $0 philanthropy)
- Melbourne should be a stop (Peter Norden + 4 others asking, Cherry Creek $7,304/day)
- Tasmania has 3 original requesters (Loic Fery coalition, DarkLab/MONA, govt DECYP)

### Open Questions
- Tasmania: should it be a stop? 3 requesters, Ruth Forrest MLC, Ashley YDC closure saga
- Armidale: Penny Lamaro wants it there — Bernie's town. Regional NSW stop?
- Broome: Michael Haji-Ali (MIM Foundation). Remote WA angle?
- Cairns: Irene Portelli (Lady Tradies). FNQ connection?

### Key Files

| File | What |
|------|------|
| `output/campaign-location-overview.md` | **Campaign bible** — 478 lines, all people/orgs/politics/funding |
| `src/app/for-funders/page.tsx` | Funder hub landing page (rewired) |
| `src/app/for-funders/org/[slug]/page.tsx` | Community org pitch pages |
| `src/app/for-funders/compare/page.tsx` | Funder comparison view |
| `src/app/for-funders/evidence-gaps/page.tsx` | Evidence gap matrix |
| `src/app/for-funders/report/[funder]/page.tsx` | Per-funder auto reports |
| `src/app/admin/contained/locations/page.tsx` | Per-location campaign view |
| `src/app/api/admin/contained/locations/route.ts` | Location mapping API |
| `public/viz/ecosystem-map.html` | Storytelling viz (hosted) |
| `output/funder-emails-draft.md` | 3 funder emails (Teya HOLD, Lucy, Kristy) |

### Notion Reference
- **Container Requests DB:** `collection://66d47678-3c91-4430-8414-5b5b168ed117`
- **29 requesters from Oct-Nov 2025** — see memory file `reference_notion_container_requests.md`
- Key: Katherine Hayes (YAC Brisbane), Hannah March (JRI Adelaide), Loic Fery (Tasmania coalition), Michael Haji-Ali (Broome), Penny Lamaro (Armidale), Sonia Randhawa (3CR radio), Ludmila Andrade (Amsterdam), Samantha Burns (London)

### Workflow State
pattern: iterative
phase: 12
total_phases: 12
retries: 0
max_retries: 3
