# JusticeHub Content Map

## Site Structure & Content Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                            JUSTICEHUB.ORG.AU                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  HOMEPAGE (/)                                                              │
│  ├── Hero stats (programs, services, people, orgs)                         │
│  ├── Featured programs carousel                                            │
│  ├── Featured stories                                                      │
│  └── Call to actions                                                       │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  YOUTH JUSTICE REPORT (/youth-justice-report)                              │
│  ├── /interventions      → alma_interventions (by state)                   │
│  ├── /inquiries          → historical_inquiries (royal commissions)        │
│  ├── /international      → international_programs (global models)          │
│  ├── /research           → alma_evidence (research papers)                 │
│  ├── /chat               → ALMA AI chat interface                          │
│  └── /recommendations    → Policy recommendations                          │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  CENTRE OF EXCELLENCE (/centre-of-excellence)                              │
│  ├── /best-practice      → Best practice guides                            │
│  ├── /global-insights    → international_programs (detailed)               │
│  ├── /map                → Geographic visualization                        │
│  ├── /people             → public_profiles (CoE leaders)                   │
│  └── /research           → Research partnerships                           │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  INTELLIGENCE (/intelligence)                                              │
│  ├── /interventions      → alma_interventions (full browser)               │
│  ├── /evidence           → alma_evidence (research library)                │
│  ├── /portfolio          → Portfolio analysis & scoring                    │
│  └── /[id] details       → Individual entity details                       │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  COMMUNITY (/community-programs, /services, /organizations)                │
│  ├── /community-programs → community_programs (grassroots)                 │
│  ├── /services           → services (service finder)                       │
│  ├── /organizations      → organizations (directory)                       │
│  └── /people             → public_profiles (practitioners)                 │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  CONTENT (/blog, /stories, /gallery)                                       │
│  ├── /blog               → blog_posts (articles)                           │
│  ├── /stories            → articles + blog_posts (combined)                │
│  ├── /gallery            → media_item (photos/videos)                      │
│  └── /art-innovation     → art_innovation (creative works)                 │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  SPECIAL PAGES                                                             │
│  ├── /contained          → CONTAINED campaign                              │
│  ├── /talent-scout       → Youth skills programs                           │
│  ├── /transparency       → Money trail / funding                           │
│  ├── /network            → Network visualization                           │
│  ├── /community-map      → Geographic map                                  │
│  └── /wiki               → Documentation                                   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Entity Display Locations

### Where Each Entity Type Appears

| Entity | Primary Route | Also Appears On |
|--------|---------------|-----------------|
| **People** | `/people`, `/people/[slug]` | Homepage, org pages, author bylines, CoE |
| **Organizations** | `/organizations`, `/organizations/[slug]` | Program pages, service pages, people profiles |
| **Community Programs** | `/community-programs`, `/community-programs/[id]` | Homepage, org pages, related content |
| **Services** | `/services`, `/services/[id]` | Homepage stats, related to programs |
| **ALMA Interventions** | `/youth-justice-report/interventions`, `/intelligence/interventions` | Portfolio, program details |
| **ALMA Evidence** | `/intelligence/evidence`, `/youth-justice-report/research` | Intervention details |
| **Blog Posts** | `/blog`, `/blog/[slug]` | Stories page, homepage |
| **Media Items** | `/gallery`, `/gallery/[id]` | Throughout site as images |
| **International Programs** | `/youth-justice-report/international`, `/centre-of-excellence/global-insights` | Research pages |
| **Historical Inquiries** | `/youth-justice-report/inquiries` | Research context |

---

## Content Relationships

```
PEOPLE
  │
  ├──writes──▶ BLOG POSTS / STORIES
  │
  ├──works at──▶ ORGANIZATIONS
  │                    │
  │                    ├──runs──▶ COMMUNITY PROGRAMS
  │                    │                │
  │                    │                └──implements──▶ ALMA INTERVENTIONS
  │                    │                                       │
  │                    └──provides──▶ SERVICES                 │
  │                                       │                    │
  │                                       └──linked to─────────┘
  │
  └──creates──▶ MEDIA ITEMS


ALMA INTERVENTIONS
  │
  ├──supported by──▶ ALMA EVIDENCE
  │                       │
  │                       └──measures──▶ ALMA OUTCOMES
  │
  ├──informed by──▶ INTERNATIONAL PROGRAMS
  │
  └──context from──▶ HISTORICAL INQUIRIES
```

---

## Content Status Tracking

### Publication States

```
DRAFT ───────▶ REVIEW ───────▶ PUBLISHED ───────▶ ARCHIVED
  │                                │
  │                                │
  └────────────────────────────────┴──────▶ FEATURED
```

### Verification States (Organizations/Services)

```
SUBMITTED ───────▶ PENDING ───────▶ VERIFIED
                      │
                      └───────────▶ REJECTED
```

---

## Data Sources by Entity

| Entity | Source | Sync Method |
|--------|--------|-------------|
| People | Empathy Ledger + Manual | API sync + Admin entry |
| Organizations | Empathy Ledger + Manual | API sync + Admin entry |
| Community Programs | Empathy Ledger + Submissions | API sync + Form submissions |
| Services | Web scraping + Manual | Automated scraper + Admin |
| ALMA Interventions | Research documentation | Manual entry from research |
| ALMA Evidence | Research databases | Manual + API imports |
| Blog Posts | Editorial team | CMS workflow |
| Media | User uploads | Direct upload |
| International Programs | Research team | Manual documentation |
| Historical Inquiries | Government sources | Manual documentation |

---

## Content Gaps & Priorities

### Critical (Blocking Features)

| Entity | Issue | Impact |
|--------|-------|--------|
| `alma_evidence` | Many items show "Untitled" | Evidence browser looks incomplete |
| `historical_inquiries` | Using fallback sample data | Inquiries page shows demo data |
| `media_item` | Placeholder images | Gallery not functional |

### High Priority

| Entity | Issue | Impact |
|--------|-------|--------|
| `blog_posts` | Few published posts | Blog looks empty |
| `public_profiles` | Limited featured profiles | People section sparse |
| `international_programs` | Missing adaptation details | Global insights incomplete |

### Medium Priority

| Entity | Issue | Impact |
|--------|-------|--------|
| `community_programs` | Missing org linkages | Can't show org → program relationships |
| `services` | Missing ALMA linkages | Can't show evidence backing |
| `organizations` | Missing team members | Org pages lack depth |

---

## API Endpoints Reference

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/api/alma/interventions` | GET | Interventions list with filters |
| `/api/alma/interventions/[id]` | GET | Single intervention |
| `/api/alma/portfolio` | GET | Portfolio analysis |
| `/api/services` | GET | Services with filters |
| `/api/services/search` | GET | Full-text search |
| `/api/organizations` | GET | Organizations with program counts |
| `/api/community-programs` | GET | Featured programs |
| `/api/international-programs` | GET | International programs |
| `/api/stories` | GET | Combined blog + articles |
| `/api/featured-profiles` | GET | Featured people |
| `/api/homepage-stats` | GET | Dashboard statistics |
| `/api/search` | GET | Global search |

---

## Admin Routes

| Route | Purpose | Entity |
|-------|---------|--------|
| `/admin` | Dashboard | Overview |
| `/admin/profiles` | Manage profiles | public_profiles |
| `/admin/organizations` | Manage orgs | organizations |
| `/admin/programs` | Manage programs | community_programs |
| `/admin/services` | Manage services | services |
| `/admin/stories` | Manage stories | blog_posts |
| `/admin/blog` | Blog management | blog_posts |
| `/admin/media` | Media library | media_item |
| `/admin/empathy-ledger` | EL sync | Sync status |

---

## Next Steps for Data Completeness

1. **Populate ALMA Evidence titles** - Run enrichment script
2. **Seed historical inquiries** - Import from government sources
3. **Upload gallery media** - Replace placeholders with real images
4. **Create blog content** - Write initial posts
5. **Link entities** - Connect programs → interventions → evidence
6. **Verify organizations** - Review and verify submitted orgs
7. **Feature profiles** - Select and feature key practitioners
