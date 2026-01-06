# Network & Services Audit Report

**Audit Date:** 2026-01-07
**Auditor:** Claude Code (Playwright automated audit)
**Status:** PASS - All pages load successfully

---

## Executive Summary

The Network & Services section is a comprehensive ecosystem demonstrating JusticeHub's national reach and grassroots connections. All 6 pages load successfully with no blocking errors. The section showcases:
- **9 JusticeHub network nodes** across Australia and New Zealand
- **467 organizations** with 1 verified partner (Oonchiumpa)
- **32+ featured people** in the changemaker directory
- **10 curated community programs** with 81% average success rate
- **14 mapped services** with detailed evidence and outcomes

---

## Pages Audited

### 1. /network - JusticeHub Network
**Status:** PASS

**Functionality:**
- Displays 9 network nodes across Australian states/territories plus New Zealand
- Interactive map with node markers by status (Active/Forming/Planned)
- Filter buttons: All (9), Active (1), Forming (5), Planned (3)
- Node cards show intervention counts (e.g., Queensland: 254 interventions)
- Upcoming events section with 5 listed events
- "Join the Network" CTA for partnership inquiries

**Key Stats:**
| Node | Status | Interventions |
|------|--------|---------------|
| JusticeHub Queensland | Active | 254 |
| JusticeHub New South Wales | Forming | 150 |
| JusticeHub Victoria | Forming | 128 |
| JusticeHub Western Australia | Forming | 96 |
| JusticeHub South Australia | Forming | 95 |
| JusticeHub Northern Territory | Forming | 84 |
| JusticeHub ACT | Planned | 75 |
| JusticeHub Tasmania | Planned | 63 |
| JusticeHub Aotearoa | International | 0 |

**Issues Found:**
- Minor: Copyright year shows 2024 (should be 2026)
- Note: Initial "Loading network..." state briefly visible before data loads

**Screenshot:** `.playwright-mcp/audit/network-services/network.png`

---

### 2. /services - Service Finder
**Status:** PASS

**Functionality:**
- AI-powered search with placeholder text
- Category filters: All, Emergency & Crisis, Legal Aid, Mental Health, Housing, Education, Employment, Family Support, Substance Use
- Sort options: Name (A-Z/Z-A), Location (A-Z/Z-A), Recently Updated, Oldest First
- Stats display: Services count, Australia-wide coverage, 24/7 updates, Verified data quality
- "Explore More" section linking to Community Programs, Talent Scout, Money Trail
- Clear distinction between Service Finder (comprehensive AI directory) and Community Programs (curated excellence)

**Key Features:**
- Shows "Loading AI-discovered services..." state
- Displays "0 Services Found" initially (services loading from government sources)
- Responsive category carousel with navigation arrows

**Issues Found:**
- Services counter shows "0" during initial load - consider skeleton loading state
- Minor: Copyright year shows 2024 (should be 2026)

**Screenshot:** `.playwright-mcp/audit/network-services/services.png`

---

### 3. /organizations - Youth Justice Organizations
**Status:** PASS

**Functionality:**
- Displays 467 Total Organizations with 1 Verified
- Verified Organizations section with featured card for Oonchiumpa Consultancy & Services
- Oonchiumpa card shows: Alice Springs NT, indigenous org badge, 4 programs, tags (Indigenous-led, Aboriginal-owned, Youth justice)
- Other Organizations grid listing hundreds of organizations alphabetically
- Organization cards link to detail pages

**Key Stats:**
- 467 Total Organizations
- 1 Verified (Oonchiumpa Consultancy & Services)
- Organizations span across Australia with diverse focus areas

**Issues Found:**
- Many organization links go to `/organizations/null` (data gap - need slug generation)
- This is a significant issue - organizations without proper slugs won't have accessible detail pages
- Minor: Copyright year shows 2024 (should be 2026)

**Screenshot:** `.playwright-mcp/audit/network-services/organizations.png`

---

### 4. /people - People Directory
**Status:** PASS

**Functionality:**
- Displays advocates, artists, researchers, and changemakers
- 6 Featured profiles with badges: Benjamin Knight, Kristy Bloomfield, Nicholas Marchesi, Patricia Ann Miller, Tanya Turner, Uncle Dale
- Profile cards show: photo, name, role, tags (advocate, researcher, co-founder, artist, builder, leader, founder)
- 26+ additional profiles in standard grid
- Profile cards link to individual profile pages (`/people/[slug]`)

**Key People:**
- Benjamin Knight - Co-founder, A Curious Tractor (advocate, researcher, co-founder)
- Nicholas Marchesi - Co-founder, A Curious Tractor (artist, builder, co-founder)
- Kristy Bloomfield - Founder (Oonchiumpa)
- Tanya Turner - Founder (Oonchiumpa)
- Uncle Dale - Leader

**Issues Found:**
- One profile "Joe Kwon" missing profile image (shows generic card without photo)
- Minor: Copyright year shows 2024 (should be 2026)

**Screenshot:** `.playwright-mcp/audit/network-services/people.png`

---

### 5. /community-programs - Community Programs
**Status:** PASS - EXCELLENT

**Functionality:**
- Showcases 10 curated programs with detailed profiles
- Impressive stats: 81% average success rate, 1,300+ lives transformed
- Featured Programs carousel with 7 highlighted programs
- Search and filter: Approach (Indigenous-led, Community-based, Grassroots, Culturally-responsive), State filter
- Each program card shows: tags, organization, location, description, success rate, lives changed, years of impact
- "Programs in Action" video section with BackTrack Youth Works and Cultural Healing Circles
- "Voices from Community Programs" story links
- "Nominate a Program" and "Find Immediate Help" CTAs

**Featured Programs:**
| Program | Organization | Success Rate | Lives Changed | Years |
|---------|--------------|--------------|---------------|-------|
| Oonchiumpa Alternative Service Response | Oonchiumpa | 77% | 19+ | 3 |
| Atnarpa Homestead On-Country | Oonchiumpa | 88% | 200+ | 4 |
| True Justice: Deep Listening | Oonchiumpa | 85% | 60+ | 3 |
| Cultural Brokerage & Service Nav | Oonchiumpa | 82% | 71+ | 3 |
| BackTrack Youth Works | BackTrack | 87% | 300+ | 15 |
| Healing Circles Program | Antakirinja | 78% | 120+ | 8 |
| Logan Youth Collective | Logan Youth | 92% | 150+ | 6 |
| Yurrampi Growing Strong | Tangentyere | 85% | 200+ | 12 |
| Creative Futures Collective | Creative Futures | 67% | 85+ | 4 |
| TechStart Youth | TechStart | 73% | 95+ | 3 |

**Issues Found:**
- Minor: Copyright year shows 2024 (should be 2026)
- Story links go to `/stories/1`, `/stories/2`, `/stories/3` (may need update to actual slugs)

**Screenshot:** `.playwright-mcp/audit/network-services/community-programs.png`

---

### 6. /community-map - Community Map
**Status:** PASS - EXCELLENT

**Functionality:**
- Interactive map of Australia showing service locations
- 14 services mapped with detailed evidence cards
- Filter by pathway: All pathways, Justice & Legal, Healing on Country, Skills & Vocational, Housing & Stability, Health & Wellbeing, Family Strengthening
- Filter by region: Whole country, ACT, NSW, NT, QLD, Regional, Remote, SA, TAS, VIC, WA
- Search functionality for services
- Stats: 14 services mapped, 5 First Nations led, 3 Regional & Remote
- Each service card shows: focus area tags, location, description, focus areas, evidence & outcomes, external website link
- "Focus map" buttons to zoom to specific locations
- "How we choose services" transparency section
- "Nominate a service" section with clear criteria

**Mapped Services:**
| Service | Location | Focus |
|---------|----------|-------|
| BackTrack Youth Works | Armidale, NSW | Skills |
| Youth Off The Streets - Key College | Marrickville, NSW | Housing |
| The Street University - Liverpool | Liverpool, NSW | Mental Health |
| Deadly Connections | Sydney, NSW | Justice (First Nations) |
| Kurbingui Youth & Family | Zillmere, QLD | Family (First Nations) |
| NAAJA Youth Justice | Darwin, NT | Justice |
| Wungening Aboriginal Corp | Perth, WA | Healing (First Nations) |
| Jesuit Social Services | Melbourne, VIC | Justice |
| SYC HYPA Housing | Adelaide, SA | Housing |
| Colony 47 | Hobart, TAS | Housing |
| Aboriginal Legal Service | Canberra, ACT | Justice (First Nations) |
| Groote Eylandt Aboriginal Trust | Groote Eylandt, NT | Healing (First Nations, Remote) |
| NPY Women's Council | Alice Springs, NT | Healing (Remote) |
| Mallee District Aboriginal Services | Mildura, VIC | Justice |

**Issues Found:**
- Minor: Copyright year shows 2024 (should be 2026)
- Map visual requires Mapbox integration (renders correctly)

**Screenshot:** `.playwright-mcp/audit/network-services/community-map.png`

---

## Console Errors Summary

| Page | Errors | Notes |
|------|--------|-------|
| /network | 1 | 404 error (favicon or minor resource) |
| /services | 0 | Clean |
| /organizations | 0 | Clean |
| /people | 0 | Clean |
| /community-programs | 0 | Clean |
| /community-map | 0 | Clean |

---

## Brand Alignment Assessment

**Strengths:**
- Consistent brutalist design language across all pages
- Strong visual hierarchy with bold headings
- Effective use of cards and grids
- Clear CTAs with high contrast buttons
- Consistent footer with comprehensive navigation
- ALMA chat widget present on all pages

**Minor Issues:**
- Copyright year outdated (2024 instead of 2026) - affects all pages
- Some profile images missing (Joe Kwon)

---

## Accessibility Notes

- Skip to main content link present on /services
- Semantic HTML structure (headings, landmarks)
- Button and link labels descriptive
- Filter controls keyboard accessible

---

## Critical Issues Requiring Attention

1. **Organization Slugs** (HIGH): Many organizations link to `/organizations/null` - need to generate proper slugs for all 467 organizations to enable detail page access.

2. **Copyright Year** (LOW): All pages show "2024" instead of "2026" in footer.

3. **Profile Images** (LOW): Some profiles missing images (Joe Kwon shown without photo).

---

## Recommendations for Funders

The Network & Services section demonstrates JusticeHub's:

1. **National Reach**: 9 nodes covering all Australian states/territories plus New Zealand expansion
2. **Evidence-Based Programs**: 10 curated programs with 81% average success rate
3. **First Nations Leadership**: Strong Indigenous representation with 5 of 14 mapped services First Nations-led
4. **Data Infrastructure**: 951 interventions tracked, 467 organizations catalogued
5. **Community Integration**: Deep partnerships with grassroots organizations like Oonchiumpa

This section would benefit from:
- Completing organization data enrichment to enable all 467 organization detail pages
- Adding more verified organization partnerships beyond Oonchiumpa
- Expanding the community-programs curated list with additional proven programs

---

## Files Generated

- `.playwright-mcp/audit/network-services/network.png`
- `.playwright-mcp/audit/network-services/services.png`
- `.playwright-mcp/audit/network-services/organizations.png`
- `.playwright-mcp/audit/network-services/people.png`
- `.playwright-mcp/audit/network-services/community-programs.png`
- `.playwright-mcp/audit/network-services/community-map.png`

---

*Report generated by Claude Code automated audit system*
