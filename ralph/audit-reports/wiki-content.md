# Wiki & Content Strategy Audit Report

**Audit Date:** 2026-01-07
**Auditor:** Claude (Playwright-based automated audit)
**Status:** COMPLETE

---

## Executive Summary

The JusticeHub Wiki section (`/wiki`) is a **strategic asset** for funder engagement, providing comprehensive pitch materials, budget documentation, and research evidence. The Mindaroo Foundation Pitch Package is particularly well-developed with 7 detailed pages totaling 70K+ words of content.

**Overall Assessment:** GOOD with some technical issues on legacy dynamic routes.

### Key Findings

| Aspect | Status | Notes |
|--------|--------|-------|
| Wiki Index Page | ✅ Working | Rich content, clear navigation |
| Mindaroo Pitch Package (7 pages) | ✅ Working | Comprehensive funder materials |
| Dynamic Slug Routes | ❌ Broken | Server error on `/wiki/[slug]` pages |
| Navigation | ✅ Working | Sidebar, breadcrumbs functional |
| Brand Consistency | ✅ Consistent | Clean brutalist design |

---

## Pages Audited

### 1. Wiki Index (`/wiki`)

**Status:** ✅ WORKING

**Content Highlights:**
- Featured Mindaroo Foundation Pitch Package with key stats ($10.5M ask, 6 partner communities, 15-20 members trained)
- 4 content categories: Strategic Planning, Budget & Funding, Platform Documentation, Technical Documentation
- "Getting Started" pathway for new visitors (One-Page Overview → Executive Summary → Full Planning Doc)
- ALMA Chat integration button

**Screenshot:** `.playwright-mcp/audit/wiki-content/wiki-index.png`

**Issues:** None

---

### 2. Mindaroo Pitch Hub (`/wiki/mindaroo-pitch`)

**Status:** ✅ WORKING

**Content Highlights:**
- Complete strategic pitch package overview
- 7 linked documents with word counts:
  - One-Page Executive Pitch (3K words)
  - Combined Strategic Pitch (21K words)
  - Sovereignty Flywheel Visual (6K words)
  - Detailed Budget Breakdown (8K words)
  - Research Discussion Paper (30K+ words)
  - Interactive Flywheel (live demo)
  - Platform Screenshots Gallery (19 images)
- At-a-Glance stats: $10.5M ask, 29 communities, 16 Indigenous staff by Year 3
- CORE/NETWORK model explanation
- Potential warm community partners listed
- "How to Use This Package" guide

**Screenshot:** `.playwright-mcp/audit/wiki-content/mindaroo-pitch.png`

**Issues:** None

---

### 3. One-Page Executive Pitch (`/wiki/mindaroo-pitch/one-pager`)

**Status:** ✅ WORKING

**Content Highlights:**
- WHY section: The Problem (17x overrepresentation) and Opportunity
- WHAT section: Platform build status ($303K value created), 521 programs, 38+ stories, 450+ orgs
- HOW section: Detailed budget tables with CORE/NETWORK model
- Embedded images from Napkin.ai visualizations
- Link to personal story "Walking Toward Justice"
- Key stats: 32% CORE community payments, 48% Indigenous workforce, 5.8x community multiplier

**Screenshot:** `.playwright-mcp/audit/wiki-content/one-pager.png`

**Issues:** None

---

### 4. Budget Breakdown (`/wiki/mindaroo-pitch/budget-breakdown`)

**Status:** ✅ WORKING

**Content Highlights:**
- CORE/NETWORK model detailed explanation
- Year-by-year budget tables ($1.88M → $3.96M → $4.66M = $10.5M total)
- Community Connector scaling (2 → 6 → 10 FTE)
- Revenue projections ($120K Y3 → $400-600K Y5 → $1.2-1.8M Y8)
- 3-year totals breakdown by category
- Transparency & accountability commitments
- Version 2.0 - CORE/NETWORK Model

**Screenshot:** `.playwright-mcp/audit/wiki-content/budget-breakdown.png`

**Issues:** None

---

### 5. Research Discussion Paper (`/wiki/mindaroo-pitch/research-paper`)

**Status:** ✅ WORKING

**Content Highlights:**
- 30,000+ word living document
- International best practices: NZ, Canada, USA, Colombia, Norway
- Australian success stories: Bourke (79% reduction), Oonchiumpa, MMEIC, Palm Island
- Evidence on grant writing burden (30-40% of time)
- Data sovereignty framework (CARE principles)
- Revenue models for sustainability
- Methodology notes and sources

**Screenshot:** `.playwright-mcp/audit/wiki-content/research-paper.png`

**Issues:** None

---

### 6. Platform Screenshots Gallery (`/wiki/mindaroo-pitch/screenshots`)

**Status:** ✅ WORKING

**Content Highlights:**
- 19 screenshots demonstrating live platform
- Organized by priority:
  - Priority 1: 7 essential platform features (Homepage, Programs, Stories, etc.)
  - Priority 2: 12 public platform pages
  - Priority 3: Admin & content management
  - Centre of Excellence pages
  - Data visualizations
- Each screenshot links to live page
- Key message: "Not vaporware - this is a pitch to scale what's already working"

**Screenshot:** `.playwright-mcp/audit/wiki-content/screenshots.png`

**Issues:** None

---

### 7. Dynamic Slug Routes (`/wiki/[slug]`)

**Status:** ❌ BROKEN - Server Error

**Affected Pages:**
- `/wiki/strategic-overview`
- `/wiki/executive-summary`
- `/wiki/admin-user-guide`
- `/wiki/admin-quick-start`
- `/wiki/admin-routes-complete`
- `/wiki/centre-of-excellence-complete`
- `/wiki/empathy-ledger-full-integration`
- `/wiki/auto-linking-complete`
- `/wiki/three-scenarios-budget`
- `/wiki/mindaroo-strategic-pitch`
- `/wiki/budget-summary`
- `/wiki/justicehub-planning`
- `/wiki/one-page-overview`

**Error Message:**
```
Error: Cannot find module './vendor-chunks/@tanstack.js'
Require stack:
- /Users/benknight/Code/JusticeHub/.next/server/webpack-runtime.js
- /Users/benknight/Code/JusticeHub/.next/server/app/wiki/[slug]/page.js
```

**Root Cause:** Next.js build cache issue with @tanstack dependency in the dynamic route webpack chunks.

**Screenshot:** `.playwright-mcp/audit/wiki-content/strategic-overview-error.png`

**Recommended Fix:**
1. Run `rm -rf .next` to clear build cache
2. Run `npm run build` to rebuild
3. If issue persists, check @tanstack package versions in package.json

---

## Content Gaps Analysis

### Well-Covered Content (Strengths)

1. **Funder Pitch Materials** - Exceptional coverage
   - Complete Mindaroo package with 70K+ words
   - Multiple formats (one-pager, full pitch, research paper)
   - Visual aids and screenshots

2. **Budget Documentation** - Comprehensive
   - Year-by-year breakdowns
   - CORE/NETWORK model explained
   - Revenue projections

3. **Research Evidence** - Strong
   - International case studies
   - Australian success stories
   - ROI data

### Content Gaps (Opportunities)

1. **Platform Documentation** (referenced but broken)
   - Admin User Guide - linked but 500 error
   - Quick Start Guide - linked but 500 error
   - Technical docs need fixing

2. **Additional Funder Packages**
   - No equivalent package for other potential funders
   - Could replicate structure for:
     - Paul Ramsay Foundation
     - Tim Fairfax Foundation
     - State government grant applications

3. **Program Implementation Guides**
   - How communities can join the network
   - CORE vs NETWORK community application process
   - Community Connector role documentation

4. **Impact Measurement**
   - Evaluation framework documentation
   - Success metrics definitions
   - Reporting templates

---

## Strategic Recommendations for Funders

### Immediate Value (Funders Will Appreciate)

1. **The Wiki demonstrates investment-readiness:**
   - 70K+ words of professionally written content
   - Clear budget accountability framework
   - Evidence-based approach with sources cited
   - Visual proof of working platform

2. **Key metrics to highlight:**
   - $10.5M ask over 3 years (BASE scenario)
   - 29 communities reached through CORE/NETWORK model
   - 48% Indigenous workforce by Year 3
   - $303K platform value already created
   - 521 programs, 38+ stories already documented

3. **Unique selling points:**
   - Not vaporware - live working platform
   - Community ownership pathway (ACCO by Year 5)
   - Network effect model (5.8x community multiplier)
   - Indigenous data sovereignty framework

### Recommended Wiki Enhancements

1. **Fix Dynamic Routes (Priority: HIGH)**
   - Clear build cache and rebuild
   - Ensure all linked pages work

2. **Add Funder Quick Links (Priority: MEDIUM)**
   - Create `/wiki/for-funders` landing page
   - Direct links to key documents
   - FAQ for common funder questions

3. **Add Case Studies Section (Priority: MEDIUM)**
   - Detailed Oonchiumpa partnership case study
   - Success metrics from pilot communities
   - Testimonials from knowledge holders

4. **Add Technical Due Diligence (Priority: LOW)**
   - Architecture overview
   - Security documentation
   - Data privacy compliance

---

## Console Errors

| Page | Error Type | Details |
|------|------------|---------|
| `/wiki/[slug]` pages | Server Error 500 | Cannot find module './vendor-chunks/@tanstack.js' |
| All wiki pages | CSS Warning | Style refused (development mode only) |
| All wiki pages | JS Warning | Script execution delayed (development mode only) |

---

## Brand Alignment

The Wiki section maintains strong brand consistency:

- **Design:** Clean, professional layout with brutalist elements
- **Colors:** Black/white primary with accent colors for CTAs
- **Typography:** Clear hierarchy with bold headings
- **Imagery:** Strategic use of icons and callout boxes
- **Navigation:** Consistent sidebar with breadcrumb trail

**Minor Issue:** No obvious brand issues in wiki section.

---

## Files Modified/Created

**Screenshots Saved:**
- `.playwright-mcp/audit/wiki-content/wiki-index.png`
- `.playwright-mcp/audit/wiki-content/mindaroo-pitch.png`
- `.playwright-mcp/audit/wiki-content/one-pager.png`
- `.playwright-mcp/audit/wiki-content/budget-breakdown.png`
- `.playwright-mcp/audit/wiki-content/research-paper.png`
- `.playwright-mcp/audit/wiki-content/screenshots.png`
- `.playwright-mcp/audit/wiki-content/strategic-overview-error.png`
- `.playwright-mcp/audit/wiki-content/executive-summary-error.png`
- `.playwright-mcp/audit/wiki-content/admin-user-guide-error.png`

---

## Summary

The JusticeHub Wiki is a **strategic asset** with exceptionally well-developed funder pitch materials. The Mindaroo Foundation Pitch Package alone represents significant investment in documentation (70K+ words across 7 pages).

**Strengths:**
- Comprehensive funder materials ready for presentation
- Clear budget accountability and transparency
- Evidence-based approach with international research
- Visual proof of working platform

**Weaknesses:**
- Dynamic route pages broken (technical issue, not content)
- Some referenced documentation inaccessible
- No packages for other potential funders yet

**Recommendation:** Fix the dynamic route build issue, then the Wiki section will be fully operational and represents one of JusticeHub's strongest assets for funder engagement.

---

*Report generated via Playwright automated audit*
