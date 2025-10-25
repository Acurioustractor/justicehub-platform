# JusticeHub Information Architecture - Visual Guide

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         JUSTICEHUB DATABASE                                  │
│                                                                              │
│  ┌──────────────────┐                                                        │
│  │  ORGANIZATIONS   │                                                        │
│  │  ──────────────  │                                                        │
│  │  • id            │◄───────┐                                               │
│  │  • name          │        │                                               │
│  │  • type          │        │                                               │
│  │  • verification  │        │                                               │
│  │  • EL_org_id ────┼────┐   │                                               │
│  └────────┬─────────┘    │   │                                               │
│           │              │   │                                               │
│           │ 1:Many       │   │                                               │
│           ▼              │   │                                               │
│  ┌──────────────────┐   │   │                                               │
│  │    SERVICES      │   │   │                                               │
│  │  ──────────────  │   │   │                                               │
│  │  • id            │   │   │                                               │
│  │  • org_id (FK)   │   │   │                                               │
│  │  • verification  │   │   │                                               │
│  │  • recommend? ───┼───┼───┼──► "Recommended" = verified + rich content    │
│  │  • EL_service_id─┼───┤   │                                               │
│  └────────┬─────────┘   │   │                                               │
│           │              │   │                                               │
│           │ 1:Many       │   │                                               │
│           │ (optional)   │   │                                               │
│           ▼              │   │                                               │
│  ┌──────────────────┐   │   │      ┌─────────────────────┐                 │
│  │ COMMUNITY        │   │   │      │ PROFILE_APPEARANCES │                 │
│  │ PROGRAMS         │◄──┘   │      │ ─────────────────── │                 │
│  │  ──────────────  │       │      │ • id                │                 │
│  │  • id            │       │      │ • EL_profile_id ────┼────┐            │
│  │  • org_id (FK) ──┼───────┘      │ • appears_on_type   │    │            │
│  │  • service_id    │              │ • appears_on_id     │    │            │
│  │  • outcomes      │◄─────────────┤ • role              │    │            │
│  │  • success_rate  │   Many:1     │ • is_storyteller    │    │            │
│  │  • frameworks    │◄───┐         │ • story_id          │    │            │
│  │  • EL_project_id─┼────┼───┐     └─────────────────────┘    │            │
│  └──────────────────┘    │   │                                │            │
│           ▲               │   │                                │            │
│           │               │   │                                │            │
│           │ Many:Many     │   │                                │            │
│           │               │   │                                │            │
│  ┌────────┴────────┐     │   │                                │            │
│  │ STORY_PROGRAM   │     │   │                                │            │
│  │ _LINKS          │     │   │                                │            │
│  │  ──────────────  │     │   │                                │            │
│  │  • EL_story_id  │     │   │                                │            │
│  │  • program_id   │     │   │                                │            │
│  │  • link_type    │     │   │                                │            │
│  └─────────────────┘     │   │                                │            │
│                          │   │                                │            │
│  ┌──────────────────┐    │   │                                │            │
│  │ CENTRE OF        │    │   │                                │            │
│  │ EXCELLENCE       │    │   │                                │            │
│  │  ──────────────  │    │   │                                │            │
│  │  • id            │    │   │                                │            │
│  │  • title         │    │   │                                │            │
│  │  • resource_type │    │   │                                │            │
│  │  • frameworks    │────┘   │                                │            │
│  └──────────────────┘        │                                │            │
│                               │                                │            │
└───────────────────────────────┼────────────────────────────────┼────────────┘
                                │                                │
                        Cross-Database Links                     │
                                │                                │
┌───────────────────────────────┼────────────────────────────────┼────────────┐
│                        EMPATHY LEDGER DATABASE                 │            │
│                                │                                │            │
│                                ▼                                ▼            │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐      │
│  │  ORGANIZATIONS   │    │   PROJECTS       │    │    PROFILES      │      │
│  │  ──────────────  │    │  ──────────────  │    │  ──────────────  │      │
│  │  • id            │    │  • id            │    │  • id            │◄─────┤
│  │  • name          │    │  • org_id (FK)   │    │  • display_name  │      │
│  │  • indigenous?   │    │  • name          │    │  • bio           │      │
│  │  • protocols     │    │  • description   │    │  • avatar_url    │      │
│  │  • JH_org_id ────┼────┼─ Synced to JH    │    │  • cultural_perms│      │
│  └────────┬─────────┘    └──────────────────┘    └────────┬─────────┘      │
│           │                                                │                │
│           │ 1:Many                                   1:Many│                │
│           ▼                                                ▼                │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │                         STORIES                                   │      │
│  │  ──────────────────────────────────────────────────────────────  │      │
│  │  • id                                                             │      │
│  │  • storyteller_id (FK to profiles)                                │      │
│  │  • organization_id (FK to organizations)                          │      │
│  │  • project_id (FK to projects)                                    │      │
│  │  • title, content                                                 │      │
│  │  • privacy_level                                                  │      │
│  │  • cultural_warnings                                              │      │
│  │  • JH_program_ids[] ──────────────► Linked to JH programs         │      │
│  │  • JH_organization_id ─────────────► Linked to JH org             │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## User Flow Diagrams

### Flow 1: Service Seeker Journey

```
┌────────────┐
│  Homepage  │
└─────┬──────┘
      │
      ▼
┌─────────────────┐
│ Find Services   │
│  (/services)    │
└─────┬───────────┘
      │
      ▼
┌──────────────────────────────────────────────┐
│   SERVICE FINDER WITH MAP                    │
│                                               │
│  ╔════════════════════════════════════════╗  │
│  ║  🌟 RECOMMENDED SERVICES (Top)         ║  │
│  ║  ────────────────────────────────────  ║  │
│  ║  [★] BackTrack Youth Works             ║  │
│  ║      ✓ Verified  |  📖 Stories  | 👥   ║  │
│  ║                                         ║  │
│  ║  [★] Oonchiumpa Alternative Service    ║  │
│  ║      ✓ Verified  |  📊 Outcomes | 👥   ║  │
│  ╚════════════════════════════════════════╝  │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │  All Available Services (Below)        │  │
│  │  ──────────────────────────────────    │  │
│  │  [ ] Youth Support Service             │  │
│  │      Basic info only                   │  │
│  │                                         │  │
│  │  [ ] Community Counseling              │  │
│  │      Basic info only                   │  │
│  └────────────────────────────────────────┘  │
└──────────────┬───────────────────────────────┘
               │ Click recommended service
               ▼
┌──────────────────────────────────────────────┐
│  SERVICE DETAIL - BackTrack                  │
│  (/services/backtrack-youth-works)           │
│                                               │
│  📍 Location  📞 Contact  🌐 Website         │
│  ──────────────────────────────────────────  │
│  Description...                              │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │  🎯 PROGRAMS                           │  │
│  │  • BackTrack Welding Program           │  │
│  │    85% success rate                    │  │
│  │    [View Program] ─────────────┐       │  │
│  │                                │       │  │
│  │  👥 PEOPLE INVOLVED            │       │  │
│  │  • Graham Williams (Volunteer) │       │  │
│  │    [View Profile] ──────┐      │       │  │
│  │                         │      │       │  │
│  │  📖 STORIES             │      │       │  │
│  │  • "My Journey at..."   │      │       │  │
│  │    [Read Story]         │      │       │  │
│  └─────────────────────────┼──────┼───────┘  │
└────────────────────────────┼──────┼───────────┘
                             │      │
          ┌──────────────────┘      │
          │                         │
          ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│  PROGRAM DETAIL  │    │  PERSON PROFILE  │
│  ────────────────│    │  ────────────────│
│  • Outcomes      │    │  • Bio           │
│  • Metrics       │    │  • Role          │
│  • Stories       │    │  • Their stories │
│  • People        │    │  • Programs      │
└──────────────────┘    └──────────────────┘
```

### Flow 2: Story Reader Journey

```
┌────────────┐
│  Homepage  │
│  Featured  │
│  Stories   │
└─────┬──────┘
      │
      ▼
┌──────────────────┐
│  Browse Stories  │
│   (/stories)     │
└─────┬────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│  STORY DETAIL                            │
│  (/stories/graham-williams-journey)      │
│                                          │
│  ⚠️  Cultural Protocol Notice            │
│  ──────────────────────────────────────  │
│                                          │
│  [Photo]  Graham Williams                │
│            Volunteer, BackTrack          │
│                                          │
│  Story content...                        │
│  [Full story text]                       │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  📍 This story is from:          │   │
│  │                                   │   │
│  │  🎯 BackTrack Welding Program    │   │
│  │     by BackTrack Youth Works     │   │
│  │     [View Program] ──────────┐   │   │
│  └──────────────────────────────┼───┘   │
└───────────────────────────────── ┼──────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │  PROGRAM DETAIL          │
                    │  ──────────────────────  │
                    │  • 85% success rate      │
                    │  • 120 participants      │
                    │  • See outcomes          │
                    │  • See more stories      │
                    │  • See organization      │
                    └────────┬─────────────────┘
                             │
                             ▼
                    ┌──────────────────────────┐
                    │  ORGANIZATION DETAIL     │
                    │  ──────────────────────  │
                    │  BackTrack Youth Works   │
                    │                          │
                    │  All Services:           │
                    │  • Welding Program       │
                    │  • Mechanics Training    │
                    │  • Dog Training          │
                    │                          │
                    │  All Stories: 15         │
                    │  People Involved: 32     │
                    └──────────────────────────┘
```

### Flow 3: Research & Exploration Journey

```
┌─────────────────────────┐
│  Centre of Excellence   │
│  (/centre-of-excellence)│
└──────────┬──────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│  Browse Frameworks & Research                │
│                                               │
│  🔬 Frameworks                               │
│  • Cultural Brokerage Model                  │
│  • Trauma-Informed Care                      │
│  • On-Country Learning                       │
│                                               │
│  📊 Evaluations                              │
│  • Program Evaluation Methods                │
│  • Outcome Measurement                       │
│                                               │
│  📚 Research                                 │
│  • Justice Reinvestment Studies              │
│  • Indigenous Youth Justice                  │
└──────────┬───────────────────────────────────┘
           │ Click "Cultural Brokerage Model"
           ▼
┌──────────────────────────────────────────────┐
│  FRAMEWORK DETAIL                            │
│  Cultural Brokerage Model                    │
│                                               │
│  What is it?                                 │
│  [Detailed explanation...]                   │
│                                               │
│  Evidence Base: Strong                       │
│  Citations: [Academic papers]                │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │  🎯 PROGRAMS USING THIS FRAMEWORK      │  │
│  │                                         │  │
│  │  1. Oonchiumpa Alternative Service     │  │
│  │     📊 82% success rate                │  │
│  │     [View Program] ─────────────┐      │  │
│  │                                 │      │  │
│  │  2. BackTrack Mentorship        │      │  │
│  │     📊 85% success rate         │      │  │
│  │     [View Program]              │      │  │
│  │                                 │      │  │
│  │  📖 STORIES DEMONSTRATING THIS  │      │  │
│  │  • "How cultural brokers..."    │      │  │
│  │    [Read Story]                 │      │  │
│  └─────────────────────────────────┼──────┘  │
└────────────────────────────────────┼──────────┘
                                     │
                                     ▼
                    ┌──────────────────────────┐
                    │  PROGRAM DETAIL          │
                    │  with Framework Context  │
                    │  ──────────────────────  │
                    │  "Uses Cultural Brokerage│
                    │   to connect 71 youth to │
                    │   services..."           │
                    │                          │
                    │  Outcomes:               │
                    │  • 72% education return  │
                    │  • 95% behavior improve  │
                    │                          │
                    │  See stories from        │
                    │  participants ───────────┤
                    └──────────────────────────┘
```

## Search & Filter Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    GLOBAL SEARCH BAR                          │
│  [Search across everything...]  🔍  [Filter by type ▼]       │
└───────────────┬──────────────────────────────────────────────┘
                │
    ┌───────────┴───────────┬────────────┬──────────┬──────────┐
    │                       │            │          │          │
    ▼                       ▼            ▼          ▼          ▼
┌─────────┐    ┌──────────────┐  ┌─────────┐  ┌────────┐  ┌────────┐
│  Orgs   │    │   Services   │  │Programs │  │ People │  │Stories │
└─────────┘    └──────────────┘  └─────────┘  └────────┘  └────────┘
    │                  │             │            │           │
    │   ┌──────────────┴─────────────┴────────────┴───────────┤
    │   │                                                      │
    ▼   ▼                                                      │
┌────────────────────────────────────────────────────────┐    │
│  FACETED FILTERS                                        │    │
│                                                         │    │
│  📍 Location                                            │    │
│  ├─ State [NSW ▼]                                      │    │
│  ├─ City [Sydney ▼]                                    │    │
│  └─ Distance [50km]                                    │    │
│                                                         │    │
│  🏷️  Category                                          │    │
│  ├─ ☑ Mental Health                                    │    │
│  ├─ ☑ Education                                        │    │
│  └─ ☐ Housing                                          │    │
│                                                         │    │
│  👥 Demographics                                        │    │
│  ├─ Age [12-18]                                        │    │
│  ├─ ☑ Indigenous-specific                              │    │
│  └─ Gender [Any ▼]                                     │    │
│                                                         │    │
│  ⭐ Quality                                             │    │
│  ├─ ☑ Verified only                                    │    │
│  ├─ ☑ Has outcomes data                                │    │
│  └─ ☑ Has stories                                      │    │
│                                                         │    │
│  🎯 Approach                                            │    │
│  ├─ ☑ Indigenous-led                                   │    │
│  ├─ ☐ Community-based                                  │    │
│  └─ ☐ Grassroots                                       │    │
└─────────────────────────────────────────────────────────┘    │
                                                               │
    ┌──────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────┐
│  SEARCH RESULTS (sorted by relevance + verification)     │
│                                                           │
│  🌟 Recommended Results (Verified + Rich Content)        │
│  ────────────────────────────────────────────────────   │
│  [★] BackTrack Youth Works - Service                    │
│      Armidale, NSW  |  ✓ Verified  |  📖 Stories: 5     │
│      → 3 Programs  |  👥 People: 8  |  📊 Outcomes       │
│                                                           │
│  [★] Oonchiumpa Alternative Service - Program           │
│      Alice Springs, NT  |  ✓ Verified  |  Indigenous-led│
│      → Success: 77%  |  📖 Stories: 12  |  👥 People: 4  │
│                                                           │
│  All Other Results                                       │
│  ─────────────────────────────────────────────────────  │
│  [ ] Youth Support Service - Service                    │
│      Sydney, NSW  |  Basic info only                    │
│                                                           │
│  [ ] Community Counseling - Service                     │
│      Melbourne, VIC  |  Basic info only                 │
└───────────────────────────────────────────────────────────┘
```

## Data Priority & Display Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTENT QUALITY TIERS                     │
└─────────────────────────────────────────────────────────────┘

Tier 1: GOLD STANDARD (Featured/Recommended)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Verified organization
✓ Verified service/program
✓ Has outcomes data
✓ Has linked stories
✓ Has linked people/profiles
✓ Has photos/media
✓ Has detailed contact info
✓ Recently updated (<6 months)

Display: Top of search results, featured sections, rich detail pages
Example: Oonchiumpa programs, BackTrack


Tier 2: VERIFIED (Recommended but less rich)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Verified organization
✓ Verified service/program
✓ Has some outcomes OR stories
✓ Has basic contact info
✗ May lack detailed media

Display: In search results with "Verified" badge, detail pages
Example: Recently interviewed services


Tier 3: LISTED (Scraped/imported, basic info)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Organization exists
✓ Service exists
✗ Not verified by JusticeHub team
✗ No rich content (stories, outcomes)
✓ Basic contact/location info
✓ May have confidence score from scraping

Display: Below verified in search results, basic detail pages with
         "Know more about this service? Help us improve this listing"
Example: AskIzzy imports, data.gov.au services


Tier 4: PENDING (Awaiting verification)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Added by admin/user
✗ Not yet verified
✗ Limited information

Display: Admin panel only, not public
Example: User submissions, scraped data needing review
```

## Admin Panel Structure

```
┌──────────────────────────────────────────────────────────┐
│  JUSTICEHUB ADMIN PANEL                                  │
└──────────────────────────────────────────────────────────┘

┌─────────────────┐
│  📊 DASHBOARD   │
└─────────────────┘
  • Pending verifications: 12
  • New user submissions: 3
  • Stories awaiting approval: 5
  • Recently updated: 8

┌─────────────────┐
│  🏢 ORGANIZATIONS│
└─────────────────┘
  • List all (verified, pending, inactive)
  • Add new organization
  • Verify pending organizations
  • Link to Empathy Ledger org
  • View linked services/programs

┌─────────────────┐
│  🛠️  SERVICES    │
└─────────────────┘
  • List all (recommended, verified, listed, pending)
  • Add new service
  • Verify service (upgrade to "recommended")
  • Add service locations
  • Link to organization
  • Link to programs

┌─────────────────┐
│  🎯 PROGRAMS    │
└─────────────────┘
  • List all (featured, active, inactive)
  • Add new program
  • Edit outcomes/metrics
  • Link to organization/service
  • Link stories (search Empathy Ledger)
  • Link people (create profile appearances)
  • Add frameworks used

┌─────────────────┐
│  👥 PEOPLE      │
└─────────────────┘
  • Browse Empathy Ledger profiles
  • Create profile appearances
  • Link to programs/services
  • Set roles and context
  • Manage featured profiles

┌─────────────────┐
│  📖 STORIES     │
└─────────────────┘
  • Browse Empathy Ledger stories
  • Link to programs
  • Approve for display
  • Check cultural protocols
  • Feature stories

┌─────────────────┐
│  🔬 COE         │
└─────────────────┘
  • Manage frameworks
  • Add research/evaluations
  • Link to programs
  • Publish resources

┌─────────────────┐
│  ⚙️  SETTINGS   │
└─────────────────┘
  • User roles
  • Sync settings
  • Privacy controls
  • API keys
```

