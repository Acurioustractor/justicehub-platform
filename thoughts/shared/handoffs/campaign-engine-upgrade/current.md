---
date: 2026-03-27T07:30:00Z
session_name: campaign-engine-upgrade
branch: main
status: active
---

# Work Stream: campaign-engine-upgrade

## Ledger
**Updated:** 2026-03-28T01:00:00Z
**Goal:** Funder self-serve dashboard + data quality audit + portfolio org seeding
**Branch:** main
**Test:** npm run type-check (ignore database.types.ts errors)

### Now
[->] **Send Teya email** — updated with correct stats (148K records, 83K orgs), ready to send. Add line about funder dashboard login.

### This Session (2026-03-28 session 10)

#### Funder Dashboard — SHIPPED
- [x] `funder_profiles` table created (Supabase migration)
- [x] 3 funders seeded: Dusseldorp (Teya), Minderoo (Lucy), PRF (Kristy)
- [x] Passcode gate replaced with Supabase magic link auth
- [x] Personalized dashboard: portfolio stats, evidence profile, partner table, quick links
- [x] Admin view: all funder cards with status
- [x] Smart routing: funders auto-land on `/for-funders` after login
- [x] Auth callback + login page updated for funder routing
- [x] Localhost dev bypass for `/for-funders` and `/admin` (redirect loop fix)

#### Feynman Deep Research Review — COMPLETE
- [x] Full 4-phase review: Research → Write → Verify → Adversarial Review
- [x] Output: `output/feynman-review-justicehub-model.md`
- [x] **MAJOR finding**: platform numbers were stale everywhere (undercounting by 50-300%)
- [x] **FATAL finding**: evidence pyramid inverted — 548 Untested, 4 Proven (now 6)
- [x] **MAJOR finding**: 98.3% of funded orgs have zero programs mapped
- [x] 6 ranked recommendations by community impact

#### Stale Numbers Fixed — 12 FILES UPDATED
- [x] Orgs: 22,233 → 82,966 (ACNC/ORIC expansion)
- [x] Indigenous orgs: 649 → 1,724
- [x] Funding records: 94,742 → 148,386 ($114.9B)
- [x] Interventions: 1,076 → 1,081 (now 1,129 after seeding)
- [x] Cost data: 824 → 305 (corrected to cost_per_young_person only)
- [x] Files: funder reports, emails, calculator, compare, tour, onboarding, newsletters, chat, viz maps

#### PRF Portfolio — LINKED + SEEDED
- [x] PRF source tags fixed: added `prf-jr-portfolio-review-2025` alongside `prf-portfolio`
- [x] 21 of 30 JR portfolio records linked to orgs (was 0)
- [x] 9 remaining: 4 government programs (unlinkable), 5 orgs not in DB

#### Tier 1 Portfolio Org Seeding — 48 PROGRAMS
- [x] **Maranguka**: 0 → 11 programs (Australia's most famous JR site, finally mapped)
- [x] **Anindilyakwa**: 0 → 8 programs (2 Proven — 88% crime reduction, 95% youth)
- [x] **The Hive Mt Druitt**: 0 → 7 programs (PRF $4.2M community networks)
- [x] **Tiraapendi Wodli**: 0 → 6 programs (SA's first Aboriginal-led JR site)
- [x] **Djirra**: 0 → 6 programs (3 Effective — independently evaluated)
- [x] **Nja-marleya**: 0 → 3 programs (Maningrida community court)
- [x] **Ngarrindjeri**: 0 → 3 programs (Ranger program + JR)
- [x] **AMHC**: 0 → 2 programs (Residential healing, Newman WA)
- [x] **Jika Kangka Gununamanda**: 0 → 2 programs (Mornington Island JR)
- [x] Proven programs: 4 → 6 (50% increase from one seeding session)

#### Data System Insights
- **Linkage gap hierarchy**: Funding→Org (45%) → Org→Intervention (98% missing) → Intervention→Evidence (88% untested)
- **549 funded Indigenous orgs** have 0 programs mapped — the core data gap
- **Top-down seeding** (start from funded orgs) is more effective than bottom-up scraping
- **Post-insert linkage step** needed: every manual funding insert should trigger name matching

### Previous Session (2026-03-27 session 9)

#### Evidence Gap Matrix — DATA CLEANED
- [x] **60 scraping artifacts rejected** (SA Health wards, Raising Children parenting tips, Microsoft Word filenames, AIHW/Guardian article titles, Office for the Arts pages)
- [x] **3 duplicate interventions caught** (pipe-suffixed versions of existing records)
- [x] **3 program names cleaned** (stripped "| Department of..." suffixes, shortened 189-char name)
- [x] **2 orgs linked** (Bori Muy LTD, Aboriginal Legal Rights Movement)
- [x] **Verified count**: 1,141 → 1,081 (60 junk removed)
- [x] **Unlinked**: 253 → 191 (51 junk + 2 linked + dupes)
- [x] **576 "no funding" programs confirmed accurate** — not a data bug, shows funder opportunity

#### Teya Email — REWRITTEN with Real Data
- [x] New subject: "Your Year in Review through our lens — 19 partners, three pillars, one platform"
- [x] References all 19 YIR partners, $2M portfolio, three pillars breakdown
- [x] 43% ACCO allocation stat (43x sector average)
- [x] Climate tripling story ($225K→$570K→$675K)
- [x] Links to landscape page + funder report
- [x] All emails updated to 1,082 verified interventions

### Previous Session (2026-03-27 session 8)

#### Dusseldorp YIR 2025 Data Ingestion — COMPLETE
- [x] **21 `dusseldorp-yir-2025` records** inserted into `justice_funding` (~$2M across 19 partners)
- [x] **11 PRF records re-tagged** from `philanthropic` → `prf-portfolio` ($89.5M)
- [x] **2 records remain as `philanthropic`** (Ritchie Foundation $150K + PLACE pool $19.3M)
- [x] **6 new orgs created**: Yoorrook Justice Commission, Just Futures Collab, Learning the Macleay, Supercharge Australia, ChangeFest, UTS Impact Studios
- [x] **All 20 orgs have slugs** — every partner has a page at `/for-funders/org/[slug]`
- [x] **8 orgs enriched with ACNC data** (website, city, charity size)

#### Interventions Seeded — 24 NEW
- [x] **8 Indigenous-led**: Nawarddeken (education), Homeland School, KKT (conservation), Yoorrook (digital platform + Walk for Truth), Woor-Dungin (decolonising wealth), IndigiGrow (nursery), Wilya Janta (housing)
- [x] **7 non-Indigenous**: Mannifera (Democracy 100), PLACE (Roadshow), Groundswell (Caring for Country), Learning the Macleay (Yuwa Nyinda), Supercharge (Innovation Challenge), Accountable Futures, Surfers for Climate
- [x] **6 additional**: PLACE (3 more: co-investment model, collaboration framework, From the Ground Up), Our Place (2: school hubs, evaluation), Centre for Public Impact (Story Circles), UTS (Hey History!), ChangeFest, Just Futures Collab
- [x] **Source URLs added** to 15+ interventions (place.org.au, yoorrook.org.au, kkt.org.au, etc.)

#### Landscape Page — REBUILT with Real Data
- [x] Dusseldorp portfolio: 8 → 19 partners (all from YIR PDF)
- [x] Three pillars: Education $550K (33%), Climate $675K (37%), First Nations $524K (30%)
- [x] Climate growth story ($225K→$570K→$675K tripled in 2 years)
- [x] Mannifera network leverage ($5.6M across 27 funders)
- [x] Updated comparison table (added Climate row, Network leverage row)
- [x] 4 shared grantees (added Our Place)

#### Dusseldorp Report — ENHANCED
- [x] Fixed source filter (`dusseldorp` → `dusseldorp-yir-2025`)
- [x] Full table showing all 21 recipients (was capped at 10)
- [x] Pillar breakdown section with growth trends
- [x] ACCO allocation bar (43% — 43x sector average)
- [x] All-source funding column (shows $38.7M for PLACE, $13.6M for Our Place, $4.3M for Mounty Yarns)
- [x] Programs column (shows intervention count per org)

#### Org Pages — ENRICHED
- [x] Intervention cards now clickable → `/intelligence/interventions/[id]`
- [x] Shows geography, years operating, cultural authority per program
- [x] External website links on each program card
- [x] Every Dusseldorp partner has at least 1 program (was 0 except Mounty Yarns)

### Previous Sessions
- Session 7 (2026-03-27): Notion requesters added, community page shipped, dark text fixed, landscape page v1, funder report fix, emails updated, Dusseldorp PDF scraped
- Session 6 (2026-03-26): 7 funder pitch builds shipped, campaign network mapped, viz hosted
- Session 5 (2026-03-26): Design doc approved, viz v3, funding clean view, 3 emails drafted

### Next
- [ ] **Send Teya email** — READY, rewritten with YIR data + landscape/report links
- [ ] **Send Lucy email** — ahead of week of Apr 6 call
- [ ] **Send UWA email** — Hayley + Michelle, Perth stop
- [ ] **Call Peter Norden** — 0409 04994 (14 unread messages)
- [ ] **Re-engage 11 Notion requesters** — emails in action checklist
- [ ] **Re-engage Julia Payne (PRF)** — Townsville/PICC angle (Mar 31)
- [ ] **Coordinator JD** — fractional 0.5 FTE role

### Key Data

| Metric | Value |
|--------|-------|
| Dusseldorp YIR partners in DB | 20 (19 + Mounty Yarns re-tagged) |
| Total `dusseldorp-yir-2025` records | 21 ($2M) |
| PRF records (re-tagged) | 11 ($89.5M) |
| Interventions seeded this session | 24 |
| Total interventions (ALMA) | 1,081 verified (60 junk cleaned this session) |
| ACCO allocation (Dusseldorp) | 43% ($865K of $2M) |
| Pillar totals | Education $550K, Climate $675K, First Nations $524K |

### Decisions
- Source tag `dusseldorp-yir-2025` for all YIR partners (not generic `dusseldorp` or `philanthropic`)
- Source tag `prf-portfolio` for PRF grants (not generic `philanthropic`)
- Per-partner amounts estimated from pillar totals (YIR gives pillar totals not per-partner)
- West Kimberley project inserted without org link (unnamed in PDF, announced for 2026)
- Tour order: Mt Druitt → Adelaide → Perth → Tennant Creek → Townsville → Brisbane

### Open Questions
- Should we scrape PLACE's 53 community partners into the DB?
- West Kimberley project — who is the partner org? (announced for 2026 in YIR)
- Tasmania: should it be a confirmed stop? (3 people asking)

### Key Files

| File | What |
|------|------|
| `src/app/for-funders/landscape/page.tsx` | Funder landscape comparison (rebuilt with YIR data) |
| `src/app/for-funders/report/[funder]/page.tsx` | Funder reports (pillar breakdown, enriched table) |
| `src/app/for-funders/org/[slug]/page.tsx` | Org pitch pages (clickable programs, links) |
| `src/app/contained/community/page.tsx` | Community demand page |
| `src/app/globals.css` | Dark text fix (h1-h6/p → color: inherit) |
| `output/funder-emails-draft.md` | 4 funder emails (Teya, Lucy, PRF, UWA) |
| `/Users/benknight/Downloads/Dusseldorp_YearInReview25.pdf` | Source PDF for Dusseldorp data |

### Workflow State
pattern: iterative
phase: 1
total_phases: 4
retries: 0
max_retries: 3
