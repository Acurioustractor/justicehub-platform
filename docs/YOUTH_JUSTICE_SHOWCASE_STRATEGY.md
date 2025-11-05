# Youth Justice Organizations & People Showcase Strategy

## Current Assets Analysis

### 1. Organizations (452 total)
**Rich Data:**
- Oonchiumpa Consultancy & Services (complete profile, 4 programs)
  - Founders: Kristy Bloomfield & Tanya Turner
  - Location: Alice Springs, NT
  - Programs: Alternative Service Response, True Justice, Atnarpa Homestead, Cultural Brokerage

**Skeletal Data:**
- 450+ orgs with basic descriptions but missing:
  - Website URLs
  - Contact info
  - Locations
  - Slugs
  - Tags

### 2. People (2 public_profiles)
- Benjamin Knight (A Curious Tractor co-founder)
- Nicholas Marchesi (A Curious Tractor co-founder)
- Missing: Kristy Bloomfield, Tanya Turner profiles

### 3. Programs
**Community Programs (10):**
- 4 Oonchiumpa programs (well-documented)
- BackTrack Youth Works
- Healing Circles Program
- 4 others with basic data

**International Programs (52):**
- Well-documented with outcomes, evidence, recidivism data
- Missouri Model, Family Group Conferencing, Maranguka, etc.

### 4. Stories (0)
- Need to create stories linking people → programs → outcomes

## Immediate Opportunities

### Phase 1: Feature What We Know Well

#### A. Oonchiumpa Deep Dive
1. Create founder profiles:
   - Kristy Bloomfield (co-founder, Traditional Owner)
   - Tanya Turner (co-founder, Traditional Owner)

2. Enrich program data:
   - Alternative Service Response
   - True Justice: Deep Listening on Country
   - Atnarpa Homestead On-Country Experiences
   - Cultural Brokerage & Service Navigation

3. Create stories:
   - "Building Justice on Country: The Oonchiumpa Story"
   - "From Vision to Reality: Alice Springs Youth Justice Transformation"
   - Individual program impact stories

#### B. Showcase International Excellence
We already have rich data on 52 international programs. Create:
- "Best Practice" collection page
- Program comparison tool
- Evidence-based recommendations for Australian context

#### C. Build Missing Connections
1. Link programs to organizations
2. Link people to programs (founders, leaders, participants)
3. Create story content connecting all three

### Phase 2: Enrich Organization Data

#### Priority Organizations for Enrichment:
Based on the skeletal data, prioritize orgs that appear most impactful:
- BackTrack Youth Works (Armidale)
- PCYC (national youth program)
- Diagrama (appears in multiple contexts)
- Australian Youth Mentoring Network (peak body)

#### Enrichment Process:
1. Web scraping for missing data
2. API integrations (ACNC charity data)
3. Manual research for key organizations
4. Contact outreach for verification

### Phase 3: Story-Driven Features

#### Story Types:
1. **Founder Stories**
   - "Why We Started [Organization]"
   - Personal journeys into youth justice

2. **Program Impact Stories**
   - "How [Program] Changed Lives"
   - Participant testimonials
   - Measurable outcomes

3. **System Change Stories**
   - "From Incarceration to Investment"
   - Policy change narratives
   - Community transformation

## Feature Pages to Build

### 1. Organizations Directory
- **URL:** `/organizations`
- **Filters:** Type, location, focus area, verification status
- **View modes:** Cards, list, map
- **Features:**
  - Search by name, location, tags
  - "Featured" organizations with rich profiles
  - "Verified" badge for complete data
  - Link to related programs

### 2. People in Youth Justice
- **URL:** `/people`
- **Sections:**
  - Founders & Leaders
  - Practitioners & Advocates
  - Researchers & Experts
- **Features:**
  - Profile cards with photos
  - Organization affiliations
  - Programs they've built/led
  - Stories they're featured in

### 3. Program Showcase
- **URL:** `/programs`
- **Tabs:**
  - Australian Programs (community_programs)
  - International Models (international_programs)
  - All Programs (combined view)
- **Filters:** Type, location, evidence strength, approach
- **Features:**
  - Evidence-based filtering
  - Outcome comparison
  - "Adapted in Australia" badge
  - Link to implementing organizations

### 4. Stories Hub
- **URL:** `/stories`
- **Categories:**
  - People
  - Programs
  - Organizations
  - System Change
- **Features:**
  - Rich media (photos, videos, quotes)
  - Related content sidebar
  - Author attribution
  - Share functionality

## Implementation Priority

### Week 1: Foundation
- [ ] Create Kristy Bloomfield profile
- [ ] Create Tanya Turner profile
- [ ] Write 1 Oonchiumpa story
- [ ] Link Oonchiumpa programs to organization

### Week 2: Feature Pages
- [ ] Build Organizations directory (`/organizations`)
- [ ] Build People directory (`/people`)
- [ ] Enhance Program showcase (extend existing pages)

### Week 3: Content Creation
- [ ] Write 3 more stories (1 person, 1 program, 1 org)
- [ ] Create "Featured Organizations" collection
- [ ] Add profile appearances (who appears in which stories)

### Week 4: Data Enrichment
- [ ] Enrich top 20 organizations with web data
- [ ] Add locations/coordinates for mapping
- [ ] Verify and tag priority organizations
- [ ] Create organization-program relationships

## Data Model Relationships

```
organizations (1) ──< (many) community_programs
organizations (1) ──< (many) public_profiles (affiliation)
community_programs (many) ──< (many) public_profiles (involvement)
stories (1) ──> (1) featured_profile
stories (many) ──< (many) profile_appearances
stories (many) ──< (many) programs (stories_programs junction)
```

## Success Metrics

### Content Richness
- Organizations with complete profiles: 20+
- People profiles: 10+
- Published stories: 10+
- Programs linked to orgs: 50+

### User Engagement
- Time on organization pages
- Stories read per visit
- Program comparisons made
- Featured content clicks

### Data Quality
- Organizations with verification: 50+
- Programs with outcomes data: 30+
- People with photos: 10+
- Stories with rich media: 8+

## Next Steps

1. **Review this strategy** - Does it align with JusticeHub vision?
2. **Prioritize** - Which phase/feature matters most right now?
3. **Resource** - What data do we already have access to?
4. **Execute** - Start with high-impact, low-effort wins (Oonchiumpa founders)
