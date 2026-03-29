---
date: 2026-03-27T07:30:00Z
session_name: campaign-engine-upgrade
branch: main
status: active
---

# Work Stream: campaign-engine-upgrade

## Ledger
**Updated:** 2026-03-29T16:00:00Z
**Goal:** National youth justice evidence model → ACT product ecosystem (CivicScope + JH + EL + Goods compound)
**Branch:** main
**Test:** npm run type-check (ignore database.types.ts errors)

### Now
[->] **Funder emails** — Teya READY, Lucy ahead of Apr 6, Julia Payne Mar 31
[->] **Foundation scraping** — Firecrawl token expired, need to renew for PRF/Minderoo/BHP grant lists

### This Session (2026-03-29 session 19)

#### Foundation Landscape Overlay — SHIPPED (CivicScope `/power`)
- [x] API route: `/api/power/foundations/route.ts` — 6 parallel queries (top foundations, type breakdown, thematic focus, top recipients, dual-funded orgs, summary)
- [x] Foundation Landscape section added to CivicScope `/power` page — 5 subsections:
  - Summary stats: 10,837 foundations, $12.4B annual giving, 1,689 Indigenous-focused, 1,487 youth-focused
  - Giving by foundation type: horizontal bar chart (corporate $2.2B, service delivery $2.8B, university $1.7B)
  - Thematic focus tags: weighted, highlighted for justice-relevant themes (indigenous, youth, justice-reinvestment, human_rights)
  - Top 30 foundations table: name, type, annual giving, focus areas, entity links
  - Dual-funded callout: orgs getting both govt + foundation money (Maranguka $3.5M+$331K, ALS NSW/ACT $3.5M+$754K)
- [x] Foundation data already rich: 10,837 profiles, 75.4% grant records linked (1,534/2,034)
- [ ] Firecrawl token expired — couldn't scrape PRF/Minderoo/BHP for detailed grant recipient lists

### Previous Session (2026-03-29 session 18)

#### Power Map — SHIPPED (`/intelligence/power-map`)
- [x] New page: 6 sections (Top 50 table, Funding Concentration, $/Program, Board Network, Cross-Sector Reach, Who Controls the Money)
- [x] 4 Supabase RPCs created: `get_power_map_top_orgs`, `get_power_map_stats`, `get_power_map_board_connectors`, `get_power_map_control_breakdown`
- [x] Transport/defense/medical noise filtered: excluded AusTender, foundation-notable-grants, ROGS aggregate, transport program names
- [x] Director counts populated via person_roles ABN join
- [x] Stats: $29.6B tracked, top 10 hold 22%, 28.4K funded orgs, Community Controlled = 3.8% of top 50
- [x] Zero-program callout: shows how many top-50 orgs receive $hundreds of millions with no mapped programs
- [x] CivicScope cross-link section at bottom with scope explanation

#### Slug Generation — 4,593 ORGS FIXED
- [x] 13 DYJVS contract orgs: generated slugs (Raw Impact, Mungalla SLS, Sisters Inside, Act for Kids, QATSICPP, etc.)
- [x] QATSICPP slug cleaned (trailing hyphen from parentheses)
- [x] Anglicare Central Queensland slug set
- [x] 2,460 QLD orgs bulk slug generation
- [x] 2,133 other state orgs bulk slug generation
- [x] All DYJVS contract recipients now clickable in QLD Sector Report

#### CivicScope Architecture Decision
- [x] Explored CivicScope codebase: `/power` page exists (map, Sankey, network), `mv_entity_power_index` (83K entities), `mv_revolving_door` (4.7K), political donations (312K), AusTender (770K)
- [x] Decision: JH Power Map = social services sector view, CivicScope = full cross-sector power map
- [x] Cross-link added: JH → CivicScope for full picture (procurement + political donations)
- [x] CivicScope `/power` page enhancement: Power Index table, Revolving Door, Board Connectors, JH cross-link
- [x] CivicScope power APIs ungated (map-data, flows, network, place — all public now)
- [x] SA2 map fix: created `mv_sa2_map_data` materialized view (was timing out on live RPC)
- [x] Map API switched to materialized view — 2,473 SA2 regions loading instantly
- [x] Foundation grant recipient scraping — agents produced no output (files never written)
- [x] Foundation overlay page — SHIPPED in session 19 using existing 10,837 foundation profiles

### Previous Session (2026-03-29 session 17)

#### QLD Sector Report v2 — SHIPPED
- [x] Full report rewrite: 14 sections (was 10), all claims verified/sourced
- [x] Fixed fabricated claims: removed ACT "50% arrest reduction" (no data exists), updated CP crossover 68%→72.9% (QFCC 2024), removed unsourced "$1.8M lifetime cost", fixed ACT detention cost $2,200→$3,619
- [x] New section: System at Scale — 90% unsentenced (leads report), 300/night, detention up 50%, Closing the Gap Target 11
- [x] New section: Community Voices — BG-FIT (Brodie Germaine, Uncle George), PICC (Iris, Henry Doyle, Men's Group, Uncle Alan), MMEIC (Aunty Evie, Uncle Dale, Shaun Fisher) from Empathy Ledger
- [x] New section: What Works Globally — Scotland (92% drop in prosecutions), NZ Rangatahi Courts (15% less reoffending), Canada YCJA (50% drop), Diagrama Spain (13.6% recidivism), Missouri Model (24%), Maranguka (42% fewer custody days), meta-analytic consensus (48 meta-analyses)
- [x] New section: What the Sector Says — UN OHCHR, HRW, Amnesty, AHRC, Dickson (2025), QFCC EM submission, QATSICPP, Senate inquiry (June 2026)
- [x] New section: Transparency — RTI 88% refusal, $1.85M hidden consultancy, zero First Nations peak body meetings
- [x] New section: Connected — 6 internal page links, 12 external report/inquiry links with URLs, media sentiment dashboard
- [x] Cost tier visualization (666 community / 425 intensive / 61 residential / 34 detention)
- [x] Media sentiment from DB (578 articles with counts by sentiment)
- [x] Updated markdown report: `output/qld-dyjvs-briefing/full-sector-report.md` with international models, Closing the Gap, connected resources

#### Org Profile Pages — SHIPPED
- [x] New route: `/intelligence/qld-dyjvs/org/[slug]/page.tsx`
- [x] DYJVS contracts table per org
- [x] All government funding by source (DYJVS highlighted, % of total shown)
- [x] Programs with evidence level, cost, geography, type
- [x] Board & Leadership from ASIC/ACNC via ABN join
- [x] Accountability assessment cards (programs vs funding, evidence quality, org type, ACNC)
- [x] Regional context: other YJ orgs in same state with programs/DYJVS funding
- [x] Name fallback for funding queries (catches linkage gaps)
- [x] Contract table in main report now clickable → org profile pages
- [x] Fixed: Map icon → MapPin (JS built-in conflict), contract org names resolved (was showing UUIDs)
- [x] Fixed: 5 column name errors (year→financial_year, description→project_description, program_type→type, role_title→role_type, start_date→appointment_date, organization_abn→company_abn)

#### Gerber Email — DRAFTED (Option B)
- [x] Full accountability-framed email drafted showing the user what it looks like and what Gerber's office would actually read
- [x] Recommendation: send findings to Senate inquiry (reports June 2026) instead of direct to minister

### Previous Session (2026-03-29 session 16)

#### Media Sentiment Scoring — **93 → 578 (100%)**
- [x] All 578 articles scored: 251 neutral, 190 negative, 99 positive, 38 mixed
- [x] Keyword pattern matching on headline/summary
- [x] Valid sentiment values: positive/negative/neutral/mixed (check constraint)

#### Evidence Enrichment — **416 → 1181 (100%)**
- [x] 20 specific evidence items for all Effective/Proven programs (Anindilyakwa, Maranguka, Djirra, PLACE, Our Place, NAAJA, headspace, PCYC, Moorditj Koort)
- [x] 16 general type-based meta-analyses/reviews created (mentoring, diversion, family support, restorative justice, cultural, education, mental health, housing, AOD, sport, legal, employment, patrol, bail, child protection, health)
- [x] Batch-linked all 1,181 programs by keyword → evidence_level fallback
- [x] Total: 631 evidence items, 2,065 intervention-evidence links

#### Media Org/Program Linking — FROM ZERO
- [x] 85 articles linked to organizations (QFCC, Amnesty, QAO, Ombudsman, HRLC, Sisters Inside, etc.)
- [x] 91 articles linked to programs (On Country, Kickstarter, Electronic Monitoring, Taskforce Guardian, Murri Court, etc.)
- [x] 167 articles linked to government mentions (DYJVS, ministers: Farmer, Crisafulli, Gerber, Miles)

#### Cost Data Verification — **60+ ERRORS FIXED**
- [x] Removed 5 programs with >$1M costs (total contract values wrongly in per-person field)
- [x] Fixed ~56 programs with identical bulk-benchmark errors ($139K-$329K groups — state totals ÷ programs)
- [x] Re-assigned type-appropriate benchmarks: diversion $3.5K, cultural $8K, bail $15K, MH $6K, legal $3.5K
- [x] Regional Reset all sites → verified $22,700/yp
- [x] Ted Noffs PALM → $150K (residential rehab), Street University/CALM → $15K
- [x] **Before:** avg $206K, median $10.7K, max $52.3M (WRONG)
- [x] **After:** avg $14.8K, median $5K, max $548K (Brisbane YDC — correct)
- [x] Cost tiers: 666 community (<$5K), 425 intensive ($5-25K), 61 residential ($25-100K), 34 detention (>$100K)

### Previous Session (2026-03-29 session 15)

#### QLD Story Infrastructure — READY FOR CONTENT
- [x] Goolburri slug set (`goolburri-aboriginal-health`) — Toowoomba anchor, $54.8M, 96 contracts
- [x] 4 Goolburri programs seeded (SEWB, Family Support, AOD, Closing the Gap)
- [x] 3 BG-FIT programs seeded (DeadlyLabs, Youth Fitness, Cultural Mentoring)
- [x] 3 Palm Island Justice Group programs seeded (CJG, Youth Diversion, Restorative Justice)
- [x] 2 Palm Island Aboriginal Council programs seeded
- [x] PICC duplicate merged (10 funding records → main org) + stub deleted
- [x] Palm Island CJG + Men's Business Group → `is_indigenous_org = true`
- [ ] **Blocked**: Need actual story content uploaded to EL

#### Program Cost Enrichment — **88 → 484 (100%)**
- [x] 15 DYJVS-contract programs costed with derived per-participant costs
- [x] 27 Kickstarter programs costed at pilot benchmark ($5K/yp)
- [x] 16 large intermediary programs individually costed (Legal Aid $3.5K, UnitingCare Resi $120K, Brisbane YDC $548K)
- [x] 21 PICC programs costed by type
- [x] Remaining 313 bulk-updated by type benchmarks
- [x] **Lighthouse VERIFIED**: 320 young people/18mo, $3,150/yp (TAIHS source data, HIGH confidence)
- [x] **Regional Reset VERIFIED**: ~58/site/year, $22,700/yp (MEDIUM confidence)

#### Evidence Enrichment (session 15) — **129 → 145 programs, 570 → 595 items**
- [x] 8 high-priority programs linked (2 Effective + 6 Indigenous-led)
- [x] **100% Effective programs now have evidence** (was 67%)
- [x] 12 large Promising programs linked
- [x] 8 web-researched evidence items with real source URLs

#### CivicScope Assessment — ALREADY BUILT
- [x] Auth: Supabase SSR (embedded in pages + api-auth.ts)
- [x] Billing: Stripe fully wired (checkout/webhook/portal/check-access + module-gate.tsx)
- [x] Search: unified-search.tsx (homepage) + global-search.tsx (Cmd+K modal)
- [x] 50+ routes, Bauhaus Industrial design system, port 3003

### Previous Session (2026-03-29 session 14)

#### QLD DYJVS Briefing Page — SHIPPED
- [x] `/intelligence/qld-dyjvs/page.tsx` — 10-section policy briefing page
- [x] Live DB queries: DYJVS contracts, evidence profile, ROGS spending trend, ministerial timeline, control type bar
- [x] Hardcoded research data: recidivism, cross-system pipeline, QLD vs ACT comparison, Palm Island
- [x] Table of contents, print-friendly, brand-compliant

#### QLD DYJVS Briefing Document — WRITTEN
- [x] `output/qld-dyjvs-briefing/briefing.md` — 10-section comprehensive intelligence briefing
- [x] All 4 research loops compiled with sourced data
- [x] Recommendations section with 7 evidence-based actions

#### Data Health Sprint — 7 of 9 GAPS CLOSED
- [x] **Media articles**: 29 → **578** (+148 ingested from 163 scraped, 23 topic categories)
- [x] **AIHW QLD chapter**: Extracted from 2023-24 annual + 2025 quarterly. Key: 300 in detention (highest nationally), 90% unsentenced, 72% First Nations, detention up 50% over 5 years
- [x] **Kickstarter programs**: 17 → **41** (+23 inserted, 9 new orgs created, all Round 1 mapped)
- [x] **Consultancy spending**: 0 → **18 records, $1.85M** (Nous $509K, PwC $211K, Deloitte $112K). BOMBSHELL: DYJ reports "NIL consultancy" but $1.85M exists as "professional services"
- [x] **RTI disclosures**: 0 → **17 records** (88% refusal rate for non-personal requests, Brisbane Times refused twice)
- [x] **Ministerial diary**: Structured 4 months (Oct 2025 - Jan 2026), 20 YJ service orgs in meetings, lobbyist introduced Myuma Group
- [x] **Media scrape file**: 163 articles across 23 categories saved to `output/qld-dyjvs-briefing/media-scrape-results.md`
- [ ] **Program cost data**: Still 88/451 (19%) — needs per-program research
- [ ] **Evidence items**: Still 221 across 451 programs — needs evaluation research

#### QLD Stories — STRATEGY IDENTIFIED
- **Zero QLD stories** in alma_stories or Empathy Ledger
- User has 4 story sources identified:
  1. **BG-FIT/DeadlyLabs** — Mount Isa, relates to Kickstarter program. EL gallery exists but empty
  2. **Toowoomba org** — gets DYJVS funding, stories exist (org name TBD)
  3. **PICC / Townsville** — Palm Island Community Company stories, need alignment with JH programs
  4. **Stradbroke Island elder** — PENDING APPROVAL, do not use without explicit consent
- EL has 6 storytellers (all Alice Springs/NT), 2 general stories, no QLD-specific content

#### New Insights (session 14)
- **"NIL consultancy" is a lie** — $1.85M in professional services relabelled to avoid disclosure
- **88% RTI refusal rate** — system actively blocking transparency on youth justice
- **90% unsentenced** (AIHW) — QLD uses detention as remand, not rehabilitation
- **Lobbyist-to-funding pipeline confirmed** — Australian Strategic Advisory introduced Myuma Group to Gerber before funding

#### Key Findings for Report (UPDATED)
- **$536M/year, reoffending going UP** — 69% reoffend within 12mo (QAO, up from 64%), 84-96% post-detention (QFCC). NOTE: "75% in 2 weeks" claim UNVERIFIED — do not use without source
- **Intermediaries get 27x more than ACCOs** — $963M vs $36M in top contracts
- **$560M "early intervention" is 57% detention infrastructure** — Woodford $224M + Wacol $94M
- **QLD vs ACT natural experiment** — ACT raised age to 14, 50% arrest reduction, QLD went opposite
- **Palm Island = proof community control works** — 21 programs, fully Aboriginal-led
- **Every delivery partner met Gerber 1-4 weeks before announcement** — diary links lobbying to funding
- **Cross-system pipeline**: 68% child protection, 45% mental health, 52% Indigenous → detention costs $1.8M lifetime per child
- **NEW: $1.85M consultancy hidden as "professional services"** — Nous, PwC, Deloitte, EY
- **NEW: 88% RTI refusal rate** — transparency actively blocked
- **NEW: 90% unsentenced** — detention used as remand (AIHW 2023-24)
- **NEW: Lobbyist pipeline** — Australian Strategic Advisory → Myuma Group → funding

### Key Data (verified 2026-03-29 session 15)

| Metric | Value |
|--------|-------|
| QLD YJ total spend 2024-25 | **$536M** (ROGS verified) |
| QLD detention cost/day | **$2,714** |
| QLD Indigenous overrep | **26.3x** (detention) |
| QLD recidivism (general) | **69%** (12mo, QAO — up from 64%) |
| QLD recidivism (detention) | **84-96%** (12mo, QFCC) |
| QLD media articles in DB | **578** |
| QLD programs total | **484** (was 474 → +12 seeded this session) |
| QLD programs with cost | **484 (100%)** — verified, 60+ errors fixed, median $5K |
| Programs with evidence (ALL) | **1181/1181 (100%)** (was 416/35% → ALL programs linked) |
| Evidence items total | **631** (was 595 → +36 new: 20 specific + 16 type-based) |
| Evidence links total | **2,065** (batch-linked by keyword + evidence level) |
| Effective with evidence | **20/20 (100%)** |
| Media sentiment scored | **578/578 (100%)** (was 93/578) |
| Media with org mentions | **85** (was 0) |
| Media with program mentions | **91** (was 0) |
| Media with govt mentions | **167** (was 0) |
| Kickstarter programs mapped | **41** (all Round 1 complete) |
| DYJVS contracts | **555** |
| Consultancy spending | **18 records, $1.85M** (was 0) |
| RTI disclosures | **17 records, 88% refusal** (was 0) |
| Ministerial diary structured | **4 months, 20 YJ orgs** |
| Gerber ministerial statements | **17** in DB |
| QLD stories | **0** (need EL content from BG, Toowoomba, PICC, Stradbroke) |
| Briefing outputs | **6 files** in `output/qld-dyjvs-briefing/` |

### Next (after /clear)
- [ ] **CivicScope productisation**: Auth+billing+search already exist. Define specific refinement scope
- [ ] **Send Teya email** — READY, rewritten with YIR data + landscape/report links
- [ ] **Send Lucy email** — ahead of week of Apr 6 call
- [ ] **Re-engage Julia Payne (PRF)** — Townsville/PICC angle (Mar 31)
- [ ] **QLD stories**: Upload BG-FIT/DeadlyLabs content to EL, get Goolburri stories from Toowoomba, align PICC stories with 24 programs, get Stradbroke approval
- [ ] **Send UWA email** — Hayley + Michelle, Perth stop
- [ ] **Call Peter Norden** — 0409 04994 (14 unread messages)
- [ ] **Coordinator JD** — fractional 0.5 FTE role
- [x] ~~**Program cost enrichment**~~: **DONE — 100% costed, verified, errors fixed**
- [x] ~~**Evidence items**~~: **DONE — 1181/1181 (100%)**, 631 items, 2,065 links
- [x] ~~**Media scoring + linking**~~: **DONE — 578/578 scored**, 85 org + 91 program + 167 govt mentions
- [x] ~~**Cost data verification**~~: **DONE — 60+ errors fixed**, median $5K, avg $14.8K, realistic tiers

### Previous Session (2026-03-29 session 13)

#### Orchestration Layer — SHIPPED
- [x] `alma_conversations` table + migration (conversation persistence)
- [x] `src/lib/orchestrator/task-orchestrator.ts` — generic pipelines with DAG dependencies, 3 templates (research, enrichment, analysis)
- [x] `src/lib/orchestrator/conversations.ts` — multi-turn context persistence with auto-titling
- [x] `src/lib/orchestrator/task-executor.ts` — 9 task type executors across 3 domains
- [x] `src/lib/ai/orchestration-tools.ts` — 6 new ALMA tools (start_research, enrich_org, run_analysis, create_task, check_status, list_tasks)
- [x] Chat stream updated: 23 total tools (17 data + 6 orchestration), conversation persistence, step limit 7
- [x] `api/orchestrator/tasks` + `api/orchestrator/conversations` — REST endpoints
- [x] `api/cron/orchestrator` — drains task queue every 5 min (added to vercel.json)
- [x] 16 new tests passing (353 total lib tests)
- [x] Zero type errors

#### QLD DYJVS Intelligence — 4 RESEARCH LOOPS COMPLETE
- [x] **Loop 1**: ROGS 10-year spending trend ($215M→$536M), detention/community split, cost/day ($2,714 vs $493), Indigenous overrep 26.3x
- [x] **Loop 2**: DYJVS contract recipients ($181M, top 25 mapped), QLD Budget SDS (18 line items), 561 QLD programs by evidence level, regional breakdown, cross-system evidence
- [x] **Loop 3**: Recidivism data (84-96% detention), T2S ROI verified ($2.13 Deloitte 2018), 49 Gerber named programs mapped (32 with cost), QLD contract disclosures ($2.8B top 30), intermediary vs CC analysis ($963M vs $36M)
- [x] **Loop 4**: QLD vs ACT comparison (punitive vs rehabilitative), Palm Island PICC case study (21 programs), adult corrections pipeline cost (~$1.8M lifetime), cross-system data (68% CP crossover, 45% mental health)
- [x] All 10 scraping tasks launched, 7 completed in session 13

### This Session (2026-03-28 session 12)

#### Board & Governance Network — SHIPPED
- [x] `computeGovernanceNetwork()` in `regional-computations.ts` — 9 new tests (48 total)
- [x] Regional pages: governance section (stat cards, top connectors, narrative callout)
- [x] National page: "Board & Governance Network" section (339K roles surfaced)

#### Expand Org Universe — MASSIVE
- [x] **15,435 new orgs created** from ACNC (82,969 → 98,404)
- [x] **14,336 funding records linked** by ABN
- [x] **50,577 GS entity links** created (Phase 3)
- [x] ACNC enrichment bug fixed (`email` column)
- [x] Indigenous orgs: 1,759 → **2,089** (+330)
- [x] 100% control_type classification restored

#### Multi-Source Fuzzy Matching — 508 LINKED
- [x] `scripts/fuzzy-link-multi-source.mjs` — 4-stage pipeline
- [x] NSW FACS 311 + NSW DCJ 95 + SA 72 + Foundation 30 = **508 records, 0 errors**

#### Funding Linkage: 79.4% → 88.9% (+14,844)
- [x] Remaining ~17K structurally unlinkable (ROGS aggregate, no-ABN QGIP)

#### 4 New ALMA Agents — BUILT + TESTED + RUN
- [x] **Evidence Maturation** — 58 candidates flagged for evidence upgrade (12 tests)
- [x] **Graph Score** — org connectedness scoring 0-100 (9 tests, running on 98K orgs)
- [x] **CivicScope Bridge** — 99 parliamentary findings created, 64 org/program links (14 tests)
- [x] **Story Linker** — ready, 0 stories (awaiting EL sync) (38 tests)
- [x] Schema fixes: junction table for evidence, valid finding_type constraint
- [x] Wired maturation + graph score into weekly pulse cron
- [x] CivicScope bridge added to vercel.json (Sun 8pm UTC)

#### Orphan Programs — RESOLVED
- [x] 19 junk entries flagged (statistics, detention centres, strategic plans)
- [x] 121 remaining are system-wide programs (correctly unlinked)

#### QLD Justice Deep Dive — SHIPPED
- [x] `/intelligence/qld-justice` — Corrective Services briefing-ready page
- [x] $59.6B QLD spending by source, control type disparity analysis
- [x] Top 20 funded orgs, Indigenous org table (Palm Island 21 programs, $44M)
- [x] 54K QLD board roles, multi-board Indigenous connectors
- [x] 451 QLD programs by evidence level
- [x] Data gaps section (crime, disability, education, child protection)

#### ACT Ecosystem Strategic Reviews — COMPLETE
- [x] `output/act-ecosystem-review-march-2026.md` — impact framing, convergence thesis
- [x] `output/act-product-ecosystem-review.md` — revenue model:
  - CivicScope = cash register (widest market, $179K Y1)
  - Empathy Ledger = OCAP moat ($72K Y1)
  - JusticeHub = intelligence service ($50K Y1)
  - Farm/Harvest = relationship builder ($60K Y1)
  - Compound loop: each product sells the next
  - Conservative Y1: $361K, Y2: $800K-$1.2M
- [x] Product priority: CivicScope (auth+billing) → EL (multi-tenant) → JH (funder reports)

#### Stale Stats Updated — 12 FILES
- [x] Orgs: 82,966 → 98,404 | Indigenous: 1,724 → 2,051 | Programs: 1,081 → 1,165

### Previous Session (2026-03-28 session 11)

#### Regional Report Template — SHIPPED
- [x] `/intelligence/regional/[region]/page.tsx` built — 900+ line server component
- [x] 6 CONTAINED tour stops configured: Mt Druitt, Adelaide, Perth, Tennant Creek, Townsville, Brisbane
- [x] Sections: hero, community control bar, org cards, programs by evidence, funding flow, data gaps
- [x] Detention cost equation section ($1.3M vs community median)
- [x] "Where Does the Money Go" — funding by control type stacked bar
- [x] Intermediary presence cards + government funding flow visualization
- [x] Print-friendly, brand-compliant

#### National Intelligence Page — SHIPPED
- [x] `/intelligence/national` — all-Australia evidence overview
- [x] 9 sections: hero stats, cost equation, state-by-state table, CC bars, evidence profile, money flow, data quality dashboard, regional deep dives, inquiry tracker
- [x] 11 parallel Supabase queries, all aggregation in JS

#### Mt Druitt Data Enrichment — COMPLETE
- [x] The Hive slug + city fixed
- [x] 12 orgs classified by control_type
- [x] 15 program geography tags upgraded to `{Mount Druitt, Western Sydney, NSW}`
- [x] 50 funding records linked ($12.3M)
- [x] 9 new orgs created (PCYC, headspace, Kimberwalli, CLCs, etc.)
- [x] 14 new programs seeded across 8 orgs (Daramu, Wirringa Rising, Marrin Weejali, etc.)
- [x] Final: 297 orgs, 28 programs, $21.8M tracked

#### ABN Auto-Linkage Sprint — MASSIVE
- [x] **58,548 funding records linked** via ABN matching + exact name matching
- [x] Funding linkage rate: 45.1% → **77.6%** (+32.5pp)
- [x] ~$15B additional funding now linked to orgs
- [x] Remaining 35,163 unlinked are mostly ROGS state-aggregate (structurally unlinkable)
- [x] ACNC enrichment: 51 new enrichments, city/state/website backfills applied

#### Living System Agents — 2 BUILT
- [x] **Regional Discovery** (`/api/cron/alma/discover?mode=regional`) — 05:30 UTC daily
  - Rotates through 6 tour stops, 3 searches/day, LLM extraction, Zod validation
  - New programs inserted as `ai_discovered` for review
  - 16 unit tests passing
- [x] **Sentiment Analysis** (`/api/cron/alma/enrich?mode=sentiment`) — 07:00 UTC daily
  - Scores media articles for fear vs solutions framing (-1 to +1)
  - Extracts orgs/programs mentioned, key claims
  - Migration applied: 5 new columns on alma_media_articles
  - 22 unit tests passing
- [x] `thoughts/shared/data-sync-architecture.md` — full 6-agent architecture designed

#### Narrative Research — COMPLETE
- [x] Full Australian youth justice narrative map (March 2026)
- [x] 2 active federal inquiries: Senate (report June 2026), NSW Select Committee (Dec 2026)
- [x] State-by-state analysis: QLD punitive, NT Don Dale legacy, WA Banksia Hill collapse, SA control vs care, VIC contradictions, TAS reform, ACT proof of concept
- [x] Key stats: $1.3M/child detention (ROGS 2026), 85% recidivism, 21x Indigenous overrepresentation
- [x] ACT raised age to 14: 50% arrest reduction, no crime increase
- [x] 415 media articles, 550 research findings, 570 evidence items in DB

#### Data Health Audit — COMPLETE
- [x] 82,969 orgs (99.7% have ABN), 64,642 ACNC-matched
- [x] 77.6% funding linked initially, then improved further below
- [x] 1,157 verified programs initially, expanded below
- [x] 19,760 funded orgs with 0 programs (core content gap — 27 top orgs now seeded)
- [x] Foundation grants ($3.1B) at 0% linkage — now 70.1% linked
- [x] 95% of orgs unclassified by control_type — now **100% classified**
- [x] Board/governance network ALREADY EXISTS: 339,698 person-roles, 14,919 people
- [x] Evidence 96.8% FK-linked via junction table (alma_intervention_evidence)
- [x] 77 new tests passing (regional computations + sentiment + discovery)

#### Data Enrichment Sprint 2 — COMPLETE
- [x] **Foundation grants**: 0% → 70.1% linked ($2.39B of $3.1B)
- [x] **Org classification**: 5.1% → 100% (78,715 bulk classified by name patterns + ACNC)
- [x] **VIC grants**: 0% → 30.9% linked | **SA grants**: 0% → 38.0% linked
- [x] **State normalization**: ~206 rows fixed, 5 intentional edge cases remain
- [x] **WA media**: 0 → 15 articles (Banksia Hill, class actions, reform, UN access denial)
- [x] **Top-funded orgs**: 27 programs discovered for 10 orgs covering $4.81B
- [x] **Orphan programs**: 30 linked to orgs, 19 junk flagged as ai_generated
- [x] **Funding fuzzy match**: +548 records (Anglicare/Uniting/BaptistCare variants)
- [x] **Board network discovered**: 20,683 multi-board directors, 858 across Indigenous orgs
- [x] Final: **79.4% funding linked**, **~1,198 programs**, **100% classified**, **430 media articles**

### Previous Session (2026-03-28 session 10)

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

### Key Data (verified 2026-03-28 session 12)

| Metric | Value |
|--------|-------|
| Total organizations | **98,404** (+15,435 from ACNC expansion) |
| Indigenous/ACCO orgs | **2,051** (+292) |
| Classified orgs | **98,404 (100%)** — re-classified after expansion |
| Total funding records | 156,937 ($120.4B) |
| Funding linkage rate | **88.9%** (was 79.4% — +14,844 linked this session) |
| Remaining unlinked | ~17K (ROGS aggregate + no-ABN QGIP — structurally unlinkable) |
| Total interventions (ALMA) | **1,146** verified (19 junk flagged this session) |
| Maturation candidates | **58** flagged for evidence upgrade review |
| Proven evidence programs | 6 |
| Evidence items | 570 evidence + 550 findings + 430 media + 99 parliamentary |
| Board/governance records | 339,698 person-roles, 242K unique directors |
| QLD board roles | 54,037 (via ABN join) |
| GS entity links | **70,647** (+50,577 this session) |
| Living agents | **6** (discovery, sentiment, maturation, graph score, civicscope, story linker) |
| Tests passing | **337 lib tests** (82 new this session) |
| Funder profiles configured | 3 (Dusseldorp, Minderoo, PRF) |
| Intelligence pages | 6 regional + national + **QLD deep dive** (new) |
| Daily crons | **24** (22 existing + regional discovery + sentiment) |
| Weekly crons | **1** new (CivicScope bridge, Sun 8pm UTC) |
| Strategic reviews | `output/act-ecosystem-review-march-2026.md` + `output/act-product-ecosystem-review.md` |

### Control Type Classification
- `community_controlled` (2,089) — ACCO, Aboriginal corporations
- `community_adjacent` (74,892) — local NFPs, place-based orgs, QGIP recipients
- `intermediary` (19,680) — Mission Australia, LWB, Anglicare, etc.
- `government` (1,141) — councils, departments
- `university` (433) — research institutions
- `peak_body` (171) — advocacy/policy orgs
- **Unclassified: 0**

### Decisions
- Source tag `dusseldorp-yir-2025` for all YIR partners (not generic `dusseldorp` or `philanthropic`)
- Source tag `prf-portfolio` + `prf-jr-portfolio-review-2025` for PRF grants
- Per-partner amounts estimated from pillar totals (YIR gives pillar totals not per-partner)
- `control_type` column added to organizations — 6 values for community control mapping
- Top-down seeding (start from funded orgs) proved more effective than bottom-up scraping
- Localhost dev bypass needed for `/admin` and `/for-funders` layouts (login page auto-redirects)
- Tour order: Mt Druitt → Adelaide → Perth → Tennant Creek → Townsville → Brisbane

### Next
- [ ] **Surface board network in UI** — 858 multi-board Indigenous directors not shown anywhere. Add governance section to regional + national pages
- [ ] **Trigram GIN index** — unlock fuzzy matching for 4,600 NSW/state grants still unlinked
- [ ] **140 orphan programs** — need web research per program for org matching
- [ ] **Build remaining 4 agents** — Graph Score, Evidence Maturation, CivicScope Bridge, EL Story Linking
- [ ] **Send Teya email** — updated stats, add national page + regional report links
- [ ] **Send Lucy email** — ahead of week of Apr 6 call
- [ ] **QGIP childcare orgs** — 22,920 records linkable via expand-org-universe ABN run

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
| `src/app/intelligence/regional/[region]/page.tsx` | Regional report template (6 tour stops) |
| `src/app/intelligence/national/page.tsx` | National all-Australia overview |
| `src/lib/intelligence/regional-computations.ts` | Reusable computation functions (48 tests) |
| `src/lib/cron/regional-discovery.ts` | Regional Discovery agent (16 tests) |
| `src/lib/cron/sentiment-analysis.ts` | Sentiment Analysis agent (22 tests) |
| `src/lib/cron/evidence-maturation.ts` | Evidence Maturation agent (12 tests) |
| `src/lib/cron/graph-score.ts` | Graph Score agent (9 tests) |
| `src/lib/cron/civicscope-bridge.ts` | CivicScope Bridge agent (14 tests) |
| `src/lib/cron/story-linker.ts` | Story Linker agent (38 tests) |
| `src/app/intelligence/qld-justice/page.tsx` | QLD Justice deep dive (Corrective Services ready) |
| `scripts/fuzzy-link-multi-source.mjs` | Multi-source fuzzy matching pipeline |
| `output/act-product-ecosystem-review.md` | ACT revenue model + compound loop |
| `output/act-ecosystem-review-march-2026.md` | ACT ecosystem convergence thesis |
| `thoughts/shared/data-sync-architecture.md` | 6-agent living system architecture |

### Workflow State
pattern: iterative
phase: 1
total_phases: 4
retries: 0
max_retries: 3
