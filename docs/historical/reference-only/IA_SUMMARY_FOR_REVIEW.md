# Information Architecture Summary - For Review

## TL;DR

I've designed a complete information architecture that clarifies how Organizations, Services, Programs, People, and Stories relate to each other across JusticeHub's two databases.

**Key Documents Created**:
1. [INFORMATION_ARCHITECTURE_PROPOSAL.md](./INFORMATION_ARCHITECTURE_PROPOSAL.md) - Full detailed proposal (60+ pages)
2. [INFORMATION_ARCHITECTURE_VISUAL.md](./INFORMATION_ARCHITECTURE_VISUAL.md) - Visual diagrams and user flows

---

## Core Structure

```
Organizations (verified entities)
    ├─> Services (verified & scraped service offerings)
    │     ├─> Programs (specific interventions with outcomes)
    │     │     ├─> People (via profile_appearances)
    │     │     └─> Stories (via story_program_links)
    │     └─> People (via profile_appearances)
    └─> Programs (can be standalone, not always under service)
          ├─> People (via profile_appearances)
          └─> Stories (via story_program_links)
```

---

## Key Distinctions (Answers Your Questions)

### 1. Organizations
**What**: Any entity providing services or running programs
**Where**: JusticeHub DB `organizations` table
**Examples**: BackTrack, Oonchiumpa, Congress, government agencies
**User Access**: `/organizations` - simple list/grid of all orgs

**Key Point**: Organizations in Empathy Ledger are REFERENCED by ID, not duplicated

---

### 2. Services
**What**: Individual service offerings (may or may not have rich content)
**Where**: JusticeHub DB `services` table
**Examples**: Youth counseling, after-school program, legal aid

**CRITICAL DISTINCTION**:
- **VERIFIED + RICH CONTENT = "RECOMMENDED"** - Show at top of searches
  - Has stories, outcomes, detailed info
  - Manually curated through interviews/verification

- **SCRAPED/BASIC = "LISTED"** - Show below verified
  - Basic contact info from AskIzzy, data.gov.au
  - "Know more about this service? Contact us" option

**User Access**: `/services` - Service Finder with map
- Top section: "Recommended Services" (verified, star badges)
- Bottom section: "All Available Services" (scraped)

---

### 3. Programs
**What**: Specific programs with measurable outcomes
**Where**: JusticeHub DB `community_programs` table
**Examples**: Oonchiumpa Alternative Service Response, BackTrack Welding

**KEY DIFFERENCE FROM SERVICES**: Programs have evidence-based outcomes, metrics, frameworks

**Relationship**:
- Programs BELONG TO an organization
- Programs MAY belong to a service (optional)
- Programs are WHERE outcomes happen, WHERE stories come from

**User Access**: `/community-programs` - Browse proven programs with outcomes

---

### 4. People (Profiles)
**What**: Individuals appearing in stories, leading programs, participating
**Where**: Empathy Ledger DB `profiles` table (primary source)
**Linkage**: JusticeHub DB `profile_appearances` table

**Can be linked as**:
- Program staff ("Program Manager", "Founder")
- Participants ("Graduate", "Current Participant")
- Storytellers (first-person stories)
- Art/Innovation leaders
- Centre of Excellence contributors

**User Access**: `/people` - Browse profiles, search by name
- Shows ALL their appearances across programs, services, stories
- Respects cultural permissions and privacy

---

### 5. Stories
**What**: First-person narratives with cultural protocols
**Where**: Empathy Ledger DB `stories` table
**Linkage**: JusticeHub DB `story_program_links` table

**User Access**: `/stories` - Browse with privacy filters
- Links back to programs, organizations, people
- Shows cultural protocols/warnings

---

### 6. Centre of Excellence
**What**: Research hub, frameworks, best practices
**Where**: JusticeHub DB `centre_of_excellence_resources` table (NEW)
**Examples**: Cultural Brokerage framework, evaluation methods

**Linkages**:
- Programs that USE frameworks
- Stories that DEMONSTRATE frameworks
- Research evidence

**User Access**: `/centre-of-excellence` - Browse resources
- Click framework → see programs using it
- Click program → see frameworks it uses

---

## Service Finder Strategy

### The Two-Tier Approach

```
┌──────────────────────────────────────┐
│  🗺️  SERVICE FINDER                  │
│                                      │
│  🌟 RECOMMENDED SERVICES (Top)       │
│  ──────────────────────────────────  │
│  [★] BackTrack Youth Works           │
│      ✓ Verified  📖 Stories  👥       │
│      Has programs, outcomes          │
│                                      │
│  [★] Oonchiumpa Services             │
│      ✓ Verified  📊 Outcomes  👥      │
│      Has programs, stories           │
│  ──────────────────────────────────  │
│                                      │
│  ALL AVAILABLE SERVICES (Below)      │
│  ──────────────────────────────────  │
│  [ ] Youth Support Service           │
│      Basic info  |  "Know more?"    │
│                                      │
│  [ ] Community Counseling            │
│      Basic info  |  "Know more?"    │
└──────────────────────────────────────┘
```

**Benefits**:
1. Service seekers see BEST options first
2. Don't hide scraped services - they're still useful
3. Clear visual distinction (stars, badges)
4. Encourages orgs to get verified (moves them up)

---

## Database Changes Needed

### JusticeHub DB

#### 1. Add to `community_programs`
```sql
ALTER TABLE community_programs
ADD COLUMN organization_id UUID REFERENCES organizations(id),
ADD COLUMN service_id UUID REFERENCES services(id);
```

#### 2. Add to `services`
```sql
ALTER TABLE services
ADD COLUMN verification_level TEXT CHECK (verification_level IN ('recommended', 'listed')),
ADD COLUMN has_rich_content BOOLEAN DEFAULT false;
```

#### 3. Create new tables
- `story_program_links` - Link EL stories to JH programs
- `centre_of_excellence_resources` - COE content
- `program_coe_links` - Programs to COE resources

### Empathy Ledger DB

#### 1. Add to `stories`
```sql
ALTER TABLE stories
ADD COLUMN justicehub_program_ids UUID[] DEFAULT '{}',
ADD COLUMN justicehub_organization_id UUID;
```

---

## User Journeys

### Journey 1: Finding Help
1. Visit `/services` (Service Finder)
2. See recommended services at top
3. Click service → see programs, stories, people
4. Click program → see outcomes and impact
5. Click person → see their story

### Journey 2: Reading Stories
1. Visit `/stories`
2. Read story with cultural protocols
3. See "This story is from [Program Name]"
4. Click program → see outcomes
5. See organization running it

### Journey 3: Research
1. Visit `/centre-of-excellence`
2. Click "Cultural Brokerage" framework
3. See programs using this framework
4. See stories demonstrating it
5. See academic evidence

### Journey 4: Searching People
1. Visit `/people` or use search
2. Find Kristy Bloomfield
3. See all her roles:
   - Program Manager at Alternative Service Response
   - Co-Founder of True Justice
   - Storyteller (if she has stories)
4. Click any role → go to that program/service

---

## Implementation Phases

### Phase 1: Core Structure (Weeks 1-2)
- Add organization_id to programs
- Create Organizations list page
- Update Services with two-tier display
- Migration scripts

### Phase 2: People & Stories (Weeks 3-4)
- People browse/detail pages
- Story linking system
- Profile appearances management

### Phase 3: Centre of Excellence (Weeks 5-6)
- COE resource pages
- Framework linkages to programs
- Research content

### Phase 4: Search & Polish (Weeks 7-8)
- Global search across all entities
- Advanced filtering
- Mobile optimization

---

## Frontend Structure

```
/organizations
├─ [slug]                    # Org detail
   ├─ services               # All services by this org
   ├─ programs               # All programs by this org
   └─ people                 # All people linked to this org

/services
├─ [id]                      # Service detail
   ├─ programs               # Programs under this service
   ├─ stories                # Stories linked to service
   └─ people                 # People linked to service

/community-programs
├─ [slug]                    # Program detail
   ├─ outcomes               # Metrics and impact
   ├─ stories                # Stories from participants
   ├─ people                 # Staff and participants
   └─ frameworks             # Link to COE

/people
├─ [id]                      # Person profile
   ├─ programs               # Programs they're linked to
   ├─ stories                # Stories they've told
   └─ appearances            # All contexts they appear in

/stories
├─ [slug]                    # Story detail
   └─ program                # Program this story is from

/centre-of-excellence
├─ [slug]                    # Framework/resource detail
   ├─ programs               # Programs using this
   └─ stories                # Stories demonstrating this
```

---

## Key Questions for You

1. **Services vs Programs**: Should we keep both, or convert verified services with rich content into programs?
   - My recommendation: **Keep both** - services are broader, programs are specific interventions

2. **Organization Sync**: Should we import Empathy Ledger organizations into JusticeHub DB, or just reference by ID?
   - My recommendation: **Reference by ID** - avoid duplication, keep EL as source of truth

3. **Verification Process**: What makes a service "verified"? Interview? Site visit? Referral?
   - My recommendation: Define clear criteria (e.g., phone verification + detailed info + consent)

4. **Profile Privacy**: How to handle people who want anonymity?
   - My recommendation: Use Empathy Ledger's cultural permissions system

5. **Admin Roles**: Who can verify services? Add programs? Link stories?
   - My recommendation: Define roles (site admin, org admin, editor, viewer)

---

## Next Steps

1. **Review** this architecture - does it make sense?
2. **Clarify** any questions above
3. **Prioritize** which phases to implement first
4. **Start** with Phase 1 database migrations
5. **Build** Organizations and two-tier Services pages

---

## Files to Review

1. [INFORMATION_ARCHITECTURE_PROPOSAL.md](./INFORMATION_ARCHITECTURE_PROPOSAL.md)
   - Complete detailed spec with all entity definitions
   - Database schema recommendations
   - User journeys
   - Migration plan

2. [INFORMATION_ARCHITECTURE_VISUAL.md](./INFORMATION_ARCHITECTURE_VISUAL.md)
   - Entity relationship diagrams
   - User flow diagrams
   - Search architecture
   - Admin panel structure

