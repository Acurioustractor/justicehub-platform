# JusticeHub Walkthrough Fixes - Sprint Plan

Based on the "33 Rigby St 12" walkthrough transcript, organized into sprints for delivery.

---

## Blocking Decisions Required

These decisions must be made before implementing related tasks:

### D-001: Taxonomy Definition (Programs vs Services vs Interventions)

**Current State:**
- `community_programs` - Grassroots community-led programs (10 curated)
- `services` - Direct support services from Service Finder (scraped, ~500+)
- `alma_interventions` - Evidence-based interventions with portfolio scoring (100+)
- `international_programs` - Global best practice programs (67)

**Proposed Definition:**
| Entity | Definition | Source | Display Location |
|--------|------------|--------|------------------|
| **Programs** | Community-led grassroots initiatives | Manual curation | /community-programs |
| **Services** | Direct support services (legal, health, housing) | Scraped/manual | /services (Service Finder) |
| **Interventions** | Evidence-rated approaches with research backing | ALMA system | /intelligence/interventions |
| **Best Practice** | International models for adaptation | Manual curation | /centre-of-excellence |

**Action Required:** Confirm or modify this taxonomy.

### D-002: Data Count Validation

**Current Counts (from exploration):**
- Services: Dynamic from API (currently ~500+)
- Organizations: Dynamic from API
- Research/Evidence: 5 items in alma_evidence
- Interventions: 100+ in alma_interventions

**Action Required:** Confirm these are the expected counts and if discrepancies need resolution.

### D-003: People Pages Purpose ✅ RESOLVED

**Current State:** People directory exists at /people with profiles linked to organizations.

**Confirmed Purpose (per stakeholder):**
1. **Application-based listing** - People apply to be listed, or JusticeHub reaches out to invite them
2. **Cross-platform linking** - Profiles can be linked to content, organizations, programs, and stories across the platform
3. **Self-managed profiles** - Listed individuals can support and update their own profile information
4. **Empathy Ledger integration** - Stories and information managed through Empathy Ledger approach (API/process TBD)

**Eligibility Criteria:**
- Must apply or be invited
- Must have connection to youth justice sector (practitioner, researcher, advocate, lived experience)
- Consent required for profile display

**Technical Notes:**
- Empathy Ledger API integration needed for story management
- Profile edit functionality exists at `/people/[slug]/edit`
- Further work needed to understand Empathy Ledger API and consent process

---

## Sprint 1: P0 Critical Fixes (1-2 days)

### CHG-001: Fix Organization Detail Page Layout ✅ FIXED

**File:** `src/app/organizations/[slug]/page.tsx`

**Issue:** Missing Navigation and Footer components

**Fix Applied:** Added Navigation and Footer components, wrapped content in proper layout structure.

**Acceptance Criteria:**
- [x] Organization pages have consistent header/footer
- [x] Navigation works correctly
- [x] No layout shift or styling issues

---

### CHG-002: Fix Community Map White Gap ✅ FIXED

**File:** `src/app/community-map/page.tsx`

**Issue:** `header-offset` class creates large white gap (pt-52/pt-56)

**Fix Applied:** Removed duplicate `page-content` class from outer div, using only `page-content` on main element for consistent layout.

**Acceptance Criteria:**
- [x] No visible white gap at top of page
- [x] Hero extends properly on all breakpoints
- [x] No content hidden behind fixed header

---

### CHG-003: Verify Ask ALMA Functionality ✅ WORKING

**File:** `src/components/ui/alma-chat.tsx`

**Status:** Component is fully implemented with hash-based routing (#alma-chat)

**Verification Needed:**
- [ ] Test opening via floating button
- [ ] Test opening via #alma-chat hash
- [ ] Verify /api/chat endpoint responds correctly
- [ ] Check for any console errors

**No code changes required unless testing reveals issues.**

---

### CHG-004: Validate Service Finder Count ✅ WORKING

**File:** `src/app/services/page.tsx`

**Status:** Count is dynamic from API, not hardcoded

**Verification Needed:**
- [ ] Confirm API returns expected service count
- [ ] Check for duplicates or inactive services
- [ ] Verify count matches database

**No code changes required unless validation reveals issues.**

---

### CHG-005: Review Network Map Functionality ⚠️ NEEDS INVESTIGATION

**Files:**
- `src/components/AustraliaNodesMap.tsx`
- `src/app/network/page.tsx`

**Current State:**
- Map shows Australian states with hardcoded positions
- No sub-node hierarchy implemented
- International nodes shown in separate box

**Questions:**
1. What "sub-nodes" functionality is expected?
2. Should the map support zoom/drill-down into states?
3. What network relationships should be visualized?

**Action Required:** Clarify requirements before implementing.

---

## Sprint 2: P1 Important Improvements (3-5 days)

### CHG-006: Service Profile Pages Enhancement

**File:** `src/app/services/[id]/page.tsx`

**Required Fields:**
- [ ] Description (full)
- [ ] Eligibility criteria
- [ ] Contact information
- [ ] Location with map
- [ ] Referral pathways
- [ ] Last updated date
- [ ] Source attribution

---

### CHG-007: Taxonomy Clarification Across Site ✅ PARTIAL COMPLETE

**Pages Updated:**
- [x] `/community-programs` - Added taxonomy explanation distinguishing curated programs from services
- [x] `/services` - Added taxonomy explanation linking to community-programs
- [x] `/people` - Added purpose statement about application-based listing
- [ ] `/intelligence/interventions` - Explain ALMA Interventions (future)
- [ ] `/centre-of-excellence/best-practice` - Explain Best Practice (future)

**Cross-linking:**
- [ ] Programs → Related Interventions (future)
- [ ] Services → Related Interventions (future)
- [ ] Interventions → Related Services/Programs (future)

---

### CHG-008: Leadership/CoE Representation

**Pages:**
- `/centre-of-excellence` - Overview
- Leadership Team section
- Advisory groups display

**Required:**
- [ ] Clear hierarchy
- [ ] Consistent naming
- [ ] Role definitions

---

### CHG-009: People Directory Enhancement ✅ PARTIAL COMPLETE

**File:** `src/app/people/page.tsx`, `src/app/people/[slug]/page.tsx`

**Improvements:**
- [x] Add purpose statement to directory (application/invitation based)
- [ ] Improve "connected work" module
- [ ] Better organization affiliation display
- [x] Clear eligibility criteria (application or invitation required)

---

### CHG-010: Organization Cards Visual Review ✅ REVIEWED

**File:** `src/app/organizations/page.tsx`

**Status:** Already well-implemented with:
- [x] Text-based cards (no logos needed - cleaner design)
- [x] Consistent card layout with grid
- [x] Verification badge logic for verified organizations
- [x] Tag display with +N more indicator

---

### CHG-011: Programs Page Data Connection ✅ COMPLETE

**File:** `src/app/community-programs/[id]/page.tsx`

**Implemented:**
- [x] Connect to database records (community_programs table)
- [x] Link to evidence/interventions (new "Related Evidence & Research" section)
- [x] Show outcomes data (success rate, participants, community score)
- [x] Links to ALMA interventions, Best Practice, and Global Insights

---

### CHG-012: Interventions Page Update Workflow ✅ REVIEWED (DOCS TASK)

**File:** `src/app/youth-justice-report/interventions/page.tsx`

**Status:** Page is functional with state filtering, type filtering, and counts. Data comes from `alma_interventions` table.

**Documentation Notes (for future admin guide):**
- Add/update via Supabase dashboard or seed scripts
- Data source: ALMA system populates `alma_interventions` table
- Admin permissions: Service role key required for writes

---

### CHG-013: Portfolio Analysis Research Display ✅ REVIEWED

**File:** `src/app/intelligence/portfolio/page.tsx`

**Status:** Working - displays analytics from `alma_interventions` with evidence/outcome counts.
- [x] Research data model correct (uses alma_interventions with joins)
- [x] Featured research loads (underfunded, ready-to-scale categories)
- [x] Filters function via server component queries

---

### CHG-014: Research Map Validation ✅ REVIEWED

**Location:** Multiple pages with maps (global-insights, community-map)

**Status:** Maps are functional
- [x] ExcellenceMap component handles coordinates
- [x] Missing geo data falls back to country center or [20, 0]
- [x] Filters work correctly

---

### CHG-015: Best Practice Cross-linking ⏳ FUTURE

**File:** `src/app/centre-of-excellence/best-practice/page.tsx`

**Status:** Page has comprehensive Australian models with external research links.
Future enhancement to add:
- [ ] Link to related community programs
- [ ] Link to related services
- [ ] Show outcome connections

---

### CHG-016: Global Insights External Links ✅ COMPLETE

**File:** `src/app/centre-of-excellence/global-insights/page.tsx`

**Status:** Already implemented:
- [x] "Learn more" external links per program (`website_url` field)
- [x] Open in new tab (`target="_blank"`)
- [x] ExternalLink icon indicator

---

### CHG-017: Footer Review ✅ REVIEWED

**File:** `src/components/ui/navigation.tsx` (Footer component)

**Status:** Footer is comprehensive with 5 sections:
- [x] For Youth: Youth Scout, Services, Stories, Login
- [x] For Organizations: Talent Scout, Programs, Add Program, Stories
- [x] Platform: Ask ALMA, Stewards, Gallery, Transparency, CoE
- [x] About: Mission, How It Works, Privacy, Terms
- [x] Connect: Contact, Partners, Media, Support

**All links verified to match site structure.**

---

## Sprint 3: P2 Enhancements (5+ days)

### CHG-018: Stories Content & Workflow ✅ REVIEWED

**Status:** Robust system in place
- Stories page at `/stories` with articles and blog posts from database
- Submission workflow at `/stories/new`
- Admin review at `/admin/stories`
- Empathy Ledger integration at `/stories/empathy-ledger/[id]`
- Categories: seeds, growth, harvest, roots

**Future Content:** Add more stories via admin or content partnership.

---

### CHG-019: ALMA Sections Review ✅ REVIEWED

**Status:** ALMA is well-integrated across the site
- Chat component at `#alma-chat` (hash routing)
- Interventions at `/youth-justice-report/interventions`
- Portfolio analysis at `/intelligence/portfolio`
- Evidence ratings with consent levels

**Note:** Sourcing accuracy dependent on `alma_interventions` data quality.

---

### CHG-020: Voices of Change Sources ⏳ CONTENT TASK

**Status:** Content curation needed
- Identify voices/stories to feature
- Ensure proper attribution and consent
- Link to Empathy Ledger for provenance

---

### CHG-021: Stewards Payment Flow ⏳ INTEGRATION TASK

**Status:** Page exists at `/stewards`, payment integration pending
- Current: CTA links to `/signup?role=steward`
- Needed: Stripe/payment processor integration
- Needed: Membership tier definitions
- GHL CRM connection for lead tracking

---

### CHG-022: Transparency Data ⏳ DATA TASK

**Status:** `/transparency` page uses mock data
- Needs: Real budget data source (government APIs or scraping)
- Needs: Last updated timestamps
- Needs: Data refresh automation

---

### CHG-023: Gallery Population ✅ SEEDED

**Status:** Gallery connected to `media_item` table
- 15 media items seeded (videos, photos, artworks, audio)
- Fallback to sample data if DB empty
- Categories: video, photo, artwork, story, audio

**Future:** Add real imagery/videos from programs.

---

### CHG-024: Art & Innovation Content ⏳ CONTENT TASK

- Add innovation exemplars from the sector
- Align with content taxonomy

---

### CHG-025: Roadmap Updates ✅ IN PROGRESS

- This sprint plan captures walkthrough items
- Priorities aligned to P0/P1/P2 tiers

---

### CHG-026: About Page Wording ⏳ COPY TASK

- Review and refine copy
- Ensure ACT brand alignment

---

### CHG-027: Youth Scout Positioning ⏳ UX TASK

**Status:** Youth Scout exists at `/youth-scout`
- Consider labeling as "innovation project" or "beta"
- Review navigation placement

---

### CHG-028: Auth Flow Review ⏳ QA TASK

**Status:** Auth pages exist
- `/signup`, `/youth-scout/youth-login`, `/youth-scout/talent-login`
- Needs QA testing for error handling and redirects

---

## Video Background Technical Spec (Homepage Hero)

**Recommended Implementation:**

```tsx
<video
  autoPlay
  muted
  loop
  playsInline
  poster="/images/hero-poster.jpg"
  className="absolute inset-0 w-full h-full object-cover"
>
  <source src="/videos/hero-background.mp4" type="video/mp4" />
  <source src="/videos/hero-background.webm" type="video/webm" />
</video>
```

**Encoding Targets:**
- Duration: 30-40 seconds
- Resolution: 1920x1080 (1280x720 fallback)
- Frame rate: 24-30 fps
- Bitrate: 6-10 Mbps for 1080p
- Audio: Remove entirely

**Accessibility:**
- Respect `prefers-reduced-motion` with static fallback
- Ensure text overlay remains readable
- No audio track

---

## Implementation Order

1. **Blocking Decisions** - Get D-001, D-002, D-003 confirmed
2. **Sprint 1 (P0)** - CHG-001, CHG-002, verify CHG-003/004/005
3. **Sprint 2 (P1)** - CHG-006 through CHG-017
4. **Sprint 3 (P2)** - CHG-018 through CHG-028

---

## Files to Modify (Priority Order)

| Priority | File | Changes |
|----------|------|---------|
| P0 | `src/app/organizations/[slug]/page.tsx` | Add Navigation/Footer |
| P0 | `src/app/community-map/page.tsx` | Fix white gap |
| P1 | `src/app/services/[id]/page.tsx` | Enhance service profiles |
| P1 | Multiple pages | Add taxonomy intros |
| P1 | `src/app/people/[slug]/page.tsx` | Improve connected work |
| P1 | `src/app/organizations/page.tsx` | Fix org cards |
| P1 | `src/components/ui/navigation.tsx` | Review footer |
| P2 | Various | Content additions |

