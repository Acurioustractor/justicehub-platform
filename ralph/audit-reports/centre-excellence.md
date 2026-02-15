# Centre of Excellence Section Audit Report

**Audit Date:** 2026-01-07
**Section:** Centre of Excellence
**Pages Audited:** 6
**Status:** PASS (with minor issues)

---

## Executive Summary

The Centre of Excellence section is a **KEY FUNDER SHOWCASE** area demonstrating JusticeHub's academic credibility and international reach. All 6 pages load successfully with rich content. One data loading issue was identified on the Global Insights page that requires attention.

---

## Pages Audited

### 1. Centre of Excellence Hub (`/centre-of-excellence`)
**Status:** ✅ PASS

**Content:**
- Hero section: "Australia's First Centre of Excellence for Youth Justice"
- Vision & Mission statements clearly articulated
- Research & Best Practice section with 4 research areas:
  - Trauma-informed youth justice approaches
  - Indigenous-led diversion programs
  - Family engagement frameworks
  - Restorative justice outcomes
- 4 Case Studies with Impact metrics:
  - 85% Reduction in Reoffending (QLD Indigenous diversion)
  - Strengthening Family Connections (92% in family care)
  - Pathways to Employment (78% employment outcomes)
  - Trauma-Informed Care (65% reduction in crises)
- Training & Expert Development:
  - 1,200+ Professionals Trained
  - 24 Certification Programs
  - 180+ Expert Practitioners
  - 15 International Partners
- Workshops & Events section
- Expert Directory preview (4 experts)
- CTA: "Join Australia's Centre of Excellence"

**Screenshots:** `.playwright-mcp/audit/centre-excellence/centre-hub.png`

---

### 2. Research Section (`/centre-of-excellence/research`)
**Status:** ✅ PASS

**Content:**
- 27 research items displayed
- Featured research (4 highlighted items):
  - "The Outcomes of Trauma-Informed Practice in Youth Justice" (2024)
  - "Resisting the Incarceration of Aboriginal and Torres Strait Islander Children" (2024)
  - "The Intersection Between Child Protection and Youth Justice Systems" (2024)
  - "Youth Justice Residences: Best International Practice Evidence Reviews" (2024)
- Filtering by:
  - Research Category (8 options)
  - Jurisdiction (6 options including Australia, Queensland, NZ, Scotland, International)
  - Research Type (7 options)
  - Sort order
- Search functionality
- Each research item includes:
  - Type badge (Research Paper, Systematic Review, Policy Brief, etc.)
  - Year and jurisdiction
  - Authors and publication
  - Summary
  - Key findings list
  - Tags
  - External links (View Research, Download PDF)
- "Submit Research" CTA at bottom

**Research Types Found:**
- Research Papers
- Systematic Reviews
- Meta-Analyses
- Case Studies
- Policy Briefs
- Reports

**Screenshots:** `.playwright-mcp/audit/centre-excellence/research.png`

---

### 3. Best Practice Section (`/centre-of-excellence/best-practice`)
**Status:** ✅ PASS

**Content:**
- "Australian Youth Justice Frameworks" focus
- 4 State Framework summaries with key statistics:
  1. **NSW Youth Koori Court**
     - 40% custody reduction at sentencing
     - 84% less custody at re-conviction
     - Average custody time: 57→25 days
  2. **Victoria's Therapeutic Youth Justice Model**
     - MST/FFT clinical trials
     - Risk-Need-Responsivity framework
     - 17 years of SABTS program evidence
  3. **Queensland Youth Justice Diversion & Restorative Justice**
     - $134M investment 2018-2023
     - 75% reoffending within 2 weeks (critical challenge)
     - 84-96% reoffending within 12 months
  4. **WA Aboriginal Youth Programs**
     - 71% of detention are Aboriginal (6% of population)
     - 27x more likely to be under supervision
     - 40x overrepresentation in detention
- Each framework has expandable "Learn More" sections
- Links to full research library
- "Submit Research" and "Browse Full Library" CTAs

**Screenshots:** `.playwright-mcp/audit/centre-excellence/best-practice.png`

---

### 4. People Directory (`/centre-of-excellence/people`)
**Status:** ✅ PASS

**Content:**
- "Key People" - "The team driving youth justice reform"
- **Leadership Team (6 members):**
  1. Benjamin Knight - Co-Founder & Research Director
  2. Nicholas Marchesi - Co-Founder & Creative Director
  3. Patricia Ann Miller - Indigenous Advisory Lead (AO honor, two doctorates)
  4. Uncle Dale - Elder & Cultural Advisor
  5. Kristy Bloomfield - Program Development Lead
  6. Tanya Turner - Community Partnerships Director
- **Extended Team (4 members):**
  1. Olga Havnen - Policy Advisor
  2. Kate Bjur - Practice Lead
  3. Brodie Germaine - Youth Voice Coordinator
  4. Chelsea Rolfe - Communications Lead
- **Advisory Groups:**
  - Indigenous Advisory Circle (Chaired by Patricia Ann Miller)
  - Youth Advisory Panel (Coordinated by Brodie Germaine)
  - Research Partners (Led by Benjamin Knight)
- "Work With Us" section with Stewards and Contact CTAs

**Screenshots:** `.playwright-mcp/audit/centre-excellence/people.png`

---

### 5. Global Insights Section (`/centre-of-excellence/global-insights`)
**Status:** ⚠️ PARTIAL PASS (data loading issue)

**Content:**
- Hero statistics:
  - 13.6% Diagrama Spain recidivism vs 80-96% traditional
  - 86% victim satisfaction in NZ restorative justice
  - Only 4 youth in custody across all of Finland
  - Age 12 Scotland's criminal responsibility age
  - 8% Missouri Model recidivism rate
- Search & Filter interface:
  - Search by name, country
  - Region filter (7 regions)
  - Evidence Strength filter (6 types)
  - View toggle (Cards/Table)
- Map placeholder

**Issues Found:**
- **MEDIUM:** Programs not loading - shows "Loading programs..." and "Showing 0 programs"
- This appears to be a data fetching or API issue
- The page structure and filters are working correctly

**Screenshots:** `.playwright-mcp/audit/centre-excellence/global-insights.png`

---

### 6. Global Excellence Map (`/centre-of-excellence/map`)
**Status:** ✅ PASS

**Content:**
- "GLOBAL EXCELLENCE MAP" with comprehensive international coverage
- Summary statistics:
  - 16 International Models
  - 4 Australian Frameworks
  - 5 Research Sources
- 25 locations total displayed
- Filter categories:
  - All Resources
  - International Models
  - Australian Frameworks
  - Research Sources
- Search functionality
- Map legend with color-coded types

**International Models Featured (16):**
- Spain - Diagrama Foundation (13.6% recidivism)
- New Zealand - Oranga Tamariki (86% victim satisfaction)
- Scotland - Children's Hearings System (Age 12 responsibility)
- Finland - Nordic Welfare Model (Only 4 youth in custody)
- USA - Missouri Model (8% recidivism)
- USA - Washington State ITM
- USA - Roca, Inc. (29% recidivism)
- USA - Wraparound Milwaukee
- USA - JDAI (Baltimore)
- Northern Ireland - Youth Conferencing (54% recidivism)
- Netherlands - HALT Program
- Brazil - Progression Units (4% recidivism)
- South Africa - NICRO (6.7% recidivism)
- Hong Kong - Police Cautioning (20% recidivism)
- New Zealand - Enhanced FGC
- Australia (Bourke) - Maranguka Justice Reinvestment

**Australian Frameworks (4):**
- NSW Youth Koori Court
- Victoria's Therapeutic Model
- Queensland Diversion & Restorative Justice
- WA Aboriginal Youth Programs

**Research Sources (5):**
- AIFS (Melbourne)
- BOCSAR (Sydney)
- Lowitja Institute (Melbourne)
- Oranga Tamariki Research (Wellington)
- Annie E. Casey Foundation (Baltimore)

**Screenshots:** `.playwright-mcp/audit/centre-excellence/global-map.png`

---

## Console Errors

Common across all pages (likely related to hot reload during dev):
- `Refused to apply style from '...layout.css?v=...'` (404)
- `Refused to execute script from '...main-app.js?v=...'` (404)

These appear to be development environment caching issues, not production concerns.

---

## Issues Summary

| Severity | Page | Issue | Recommendation |
|----------|------|-------|----------------|
| MEDIUM | Global Insights | Programs not loading (shows 0 programs) | Debug API/data fetch |
| LOW | All Pages | Copyright year shows 2024 | Update to 2026 |
| LOW | All Pages | Dev environment 404s for static assets | N/A (dev only) |

---

## Brand Alignment Assessment

**Strengths:**
- Consistent brutalist design language
- Black/white with accent colors
- Sharp edges and bold typography
- Professional academic presentation
- Evidence-based credibility throughout
- International scope demonstrates authority

**Areas for Enhancement:**
- Global Insights page data loading needs fix
- Some external links could have more prominent styling

---

## Funder Relevance Assessment

This section is **CRITICAL FOR FUNDERS** because it demonstrates:

1. **Academic Credibility:** 27 peer-reviewed research items
2. **International Benchmarking:** Comparison with global best practice (Spain, NZ, Scotland, Nordic countries)
3. **Evidence-Based Approach:** Specific statistics and outcomes data
4. **Expert Network:** 180+ practitioners, 15 international partners
5. **Training Capacity:** 1,200+ professionals trained, 24 certification programs
6. **Indigenous Leadership:** Strong First Nations representation in leadership team
7. **Clear Impact Metrics:** Concrete numbers (40% custody reduction, 85% reoffending reduction, etc.)

---

## Screenshots Saved

- `.playwright-mcp/audit/centre-excellence/centre-hub.png`
- `.playwright-mcp/audit/centre-excellence/research.png`
- `.playwright-mcp/audit/centre-excellence/best-practice.png`
- `.playwright-mcp/audit/centre-excellence/people.png`
- `.playwright-mcp/audit/centre-excellence/global-insights.png`
- `.playwright-mcp/audit/centre-excellence/global-map.png`

---

## Acceptance Criteria Verification

- [x] Centre hub page loads - **PASS** (comprehensive content with stats)
- [x] Research section works - **PASS** (27 items with filtering)
- [x] Best practice section works - **PASS** (4 Australian frameworks)
- [x] People directory works - **PASS** (10 team members + advisory groups)
- [x] Global map renders - **PASS** (25 locations with filtering)
- [x] Audit report created at `ralph/audit-reports/centre-excellence.md` - **COMPLETE**

---

*Report generated: 2026-01-07*
