# JusticeHub System Map

**Last Updated:** January 19, 2026

## Overview

JusticeHub is a youth justice transformation platform with three interconnected systems:
1. **ALMA** - Intelligence/Evidence System ("Authentic Learning for Meaningful Accountability")
2. **Centre of Excellence** - Network of community organizations and best practices
3. **Empathy Ledger** - Storytelling and consent management system

---

## 1. ALMA Intelligence System

The evidence and research platform that maps what works in youth justice.

### Routes
| Route | Purpose |
|-------|---------|
| `/intelligence` | Main ALMA landing page |
| `/intelligence/dashboard` | ALMA dashboard with metrics |
| `/intelligence/interventions` | Browse all interventions |
| `/intelligence/interventions/[id]` | Individual intervention detail |
| `/intelligence/evidence` | Evidence library |
| `/intelligence/evidence/[id]` | Individual evidence detail |
| `/intelligence/portfolio` | Portfolio/investment view |
| `/intelligence/knowledge` | Knowledge base |
| `/intelligence/status` | System status |
| `/intelligence/nt-showcase` | NT-specific showcase |
| `/intelligence/media/[id]` | Media coverage tracking |
| `/intelligence/programs/[id]` | Program details |
| `/intelligence/reports/portfolio` | Portfolio reports |
| `/intelligence/tools/dividend-calculator` | Social dividend calculator |

### Database Tables (alma_*)
| Table | Purpose |
|-------|---------|
| `alma_interventions` | Core intervention records with evidence levels |
| `alma_evidence` | Research papers, evaluations, studies |
| `alma_outcomes` | Outcome categories and measurements |
| `alma_community_contexts` | Community context factors |
| `alma_intervention_outcomes` | Links interventions to outcomes |
| `alma_intervention_evidence` | Links interventions to evidence |
| `alma_intervention_contexts` | Links interventions to contexts |
| `alma_evidence_outcomes` | Links evidence to outcomes |
| `alma_consent_ledger` | Data access consent tracking |
| `alma_usage_log` | System usage tracking |
| `alma_ingestion_jobs` | Data ingestion pipeline |
| `alma_research_sessions` | Research agent sessions |
| `alma_research_findings` | Research agent outputs |
| `alma_research_tool_logs` | Tool call logs |
| `alma_external_source_cache` | Cached external sources |
| `alma_raw_content` | Raw ingested content |
| `alma_source_documents` | Source document registry |
| `alma_entity_sources` | Entity-to-source links |
| `alma_embeddings` | Vector embeddings for search |
| `alma_tags` | Tag taxonomy |
| `alma_entity_tags` | Entity-to-tag links |
| `alma_intervention_funding` | Funding data per intervention |
| `alma_locations` | Geographic locations |
| `alma_media_articles` | Media article tracking |
| `alma_government_programs` | Government program registry |
| `alma_funding_data` | General funding data |
| `alma_extraction_history` | ML extraction history |
| `alma_learning_patterns` | ML learning patterns |
| `alma_quality_metrics` | Data quality metrics |
| `alma_human_feedback` | Human review feedback |
| `alma_extraction_strategies` | Extraction strategies |
| `alma_source_registry` | Source URL registry |
| `alma_discovered_links` | Auto-discovered links |
| `alma_scrape_history` | Web scraping history |

### Materialized Views
- `alma_daily_sentiment` - Daily media sentiment aggregation
- `alma_sentiment_program_correlation` - Sentiment-program correlation
- `alma_dashboard_interventions` - Dashboard intervention summary
- `alma_dashboard_funding` - Dashboard funding summary
- `alma_dashboard_sources` - Dashboard source summary
- `alma_dashboard_queue` - Dashboard queue status
- `alma_dashboard_tags` - Dashboard tag cloud
- `alma_portfolio_rankings` - Alpha signal rankings

### APIs
- `/api/intelligence/research` - Research agent endpoint
- `/api/intelligence/alpha-signals` - Portfolio signals
- `/api/bot/chat` - ALMA chat interface
- `/api/chat` - Alternative chat endpoint

---

## 2. Centre of Excellence Network

Network connecting community organizations, research partners, and best practices.

### Routes
| Route | Purpose |
|-------|---------|
| `/centre-of-excellence` | Main CoE landing page |
| `/centre-of-excellence/map` | Geographic map of excellence |
| `/centre-of-excellence/research` | Research partnerships |
| `/centre-of-excellence/people` | Key people directory |
| `/centre-of-excellence/best-practice` | Best practice library |
| `/centre-of-excellence/global-insights` | International models |
| `/network` | Network overview |
| `/network/[id]` | Individual network node |

### Basecamps (Founding Network Partners)

Basecamps are the place-based organizations that anchor the JusticeHub network. They:
- **Launch expeditions** - JusticeHub's work across the system starts from these places
- **Hold local knowledge** - Deep expertise in their terrain and community
- **Support the network** - Provide intelligence, stories, and ground truth
- **Get compensated** - Paid for their expertise and contributions to ALMA

| Basecamp | Territory | Specialty | ID |
|----------|-----------|-----------|-----|
| Oonchiumpa | Central Australia (NT) | Cultural healing, deep listening | `11111111-1111-1111-1111-111111111001` |
| BG Fit | North West QLD | Fitness-based engagement | `11111111-1111-1111-1111-111111111004` |
| Mounty Yarns | Western Sydney (NSW) | Youth voice, storytelling | `11111111-1111-1111-1111-111111111003` |
| PICC | North QLD | Pasifika family strength | `11111111-1111-1111-1111-111111111005` |

### Database Tables
| Table | Purpose |
|-------|---------|
| `organizations` | Organization master records |
| `justicehub_nodes` | State-based network nodes (NT, QLD, NSW, etc.) |
| `coe_key_people` | Key people profiles linked to organizations |
| `international_programs` | International best practice models |
| `program_outcomes` | Documented outcomes per program |
| `best_practices` | Best practice entries |
| `program_visits` | Site visit records |
| `international_invitations` | International collaboration requests |

### Partner Enrichment Tables
| Table | Purpose |
|-------|---------|
| `partner_videos` | Organization video embeds |
| `partner_goals` | Mission/vision/values |
| `partner_contacts` | Contact information |
| `partner_photos` | Photo gallery |
| `partner_storytellers` | Featured storytellers |
| `partner_stories` | Organization-specific stories |
| `partner_impact_metrics` | Impact statistics |
| `partner_site_locations` | Service delivery locations |

### Content Files
- `src/content/excellence-map-locations.ts` - Geographic data for CoE map
- `src/content/community-map-services.ts` - Community service locations

---

## 3. Empathy Ledger (Storytelling System)

Consent-managed storytelling platform for sharing community voices.

### Routes
| Route | Purpose |
|-------|---------|
| `/stories` | Story listing |
| `/stories/[slug]` | Individual story |
| `/stories/new` | Create new story |
| `/stories/the-pattern` | Featured story collection |
| `/stories/intelligence` | Stories with ALMA integration |
| `/stories/empathy-ledger/[id]` | Empathy Ledger story view |
| `/gallery` | Visual gallery |
| `/gallery/[id]` | Gallery item detail |

### Database Tables
| Table | Purpose |
|-------|---------|
| `stories` | Story records |
| `storytellers` | Storyteller profiles |
| `story_interactions` | Engagement metrics |
| `consent_records` | Consent management |
| `story_media_enhanced` | Rich media attachments |
| `story_tags` | Story-tag associations |
| `story_analytics` | View/engagement analytics |
| `story_drafts` | Draft stories |
| `story_similarities` | Related story links |
| `story_workspaces` | Collaborative editing |
| `story_ownership` | Story ownership tracking |
| `story_revenue_events` | Revenue sharing events |
| `synced_stories` | External story sync |

---

## 4. Services & Programs

Community services and programs directory.

### Routes
| Route | Purpose |
|-------|---------|
| `/services` | Service directory |
| `/services/[id]` | Service detail |
| `/community-programs` | Community programs listing |
| `/community-programs/[id]` | Program detail |
| `/community-programs/add` | Add new program |
| `/community-map` | Geographic service map |

### Database Tables
| Table | Purpose |
|-------|---------|
| `services` | Service records |
| `service_locations` | Service delivery locations |
| `service_contacts` | Service contact info |
| `community_programs` | Community program records |
| `grassroots_programs` | Grassroots initiatives |

---

## 5. Events & Engagement

### Routes
| Route | Purpose |
|-------|---------|
| `/events` | Event listing |
| `/events/[id]` | Event detail |
| `/events/[id]/register` | Event registration |

### Database Tables
| Table | Purpose |
|-------|---------|
| `events` | Event records |
| `event_registrations` | Registration records |
| `newsletter_subscriptions` | Newsletter signups |

---

## 6. Profiles & Users

### Routes
| Route | Purpose |
|-------|---------|
| `/people` | People directory |
| `/people/[slug]/edit` | Edit profile |
| `/organizations/[slug]` | Organization profile |
| `/login` | Login page |
| `/signup` | Signup page |

### Database Tables
| Table | Purpose |
|-------|---------|
| `public_profiles` | Public user profiles |
| `youth_profiles` | Youth-specific profiles |
| `mentor_profiles` | Mentor profiles |
| `users` | User accounts |
| `justicehub_users` | JusticeHub-specific user data |
| `organizations_profiles` | Org-profile links |

---

## 7. Content & Blog

### Routes
| Route | Purpose |
|-------|---------|
| `/blog` | Blog listing |
| `/blog/[slug]` | Blog post |
| `/wiki` | Wiki/knowledge base |
| `/wiki/[slug]` | Wiki page |
| `/art-innovation` | Art & innovation showcase |
| `/art-innovation/[slug]` | Individual artwork |

### Database Tables
| Table | Purpose |
|-------|---------|
| `blog_posts` | Blog entries |
| `blog_media` | Blog media attachments |
| `blog_comments` | Blog comments |
| `articles` | General articles |
| `authors` | Author profiles |
| `art_innovation` | Art project records |
| `media_library` | Shared media library |

---

## 8. Youth Justice Research

### Routes
| Route | Purpose |
|-------|---------|
| `/youth-justice-report` | Main research report |
| `/youth-justice-report/recommendations` | Policy recommendations |
| `/youth-justice-report/chat` | Research chat interface |
| `/youth-justice-report/inquiries` | Historical inquiries |
| `/youth-justice-report/international` | International comparisons |
| `/youth-justice-report/research` | Research findings |
| `/youth-justice-report/interventions` | Intervention evidence |

### Database Tables
| Table | Purpose |
|-------|---------|
| `historical_inquiries` | Royal commissions, inquiries |
| `youth_detention_facilities` | Facility data |
| `facility_statistics` | Facility statistics |
| `facility_partnerships` | Facility-org partnerships |
| `government_programs` | Government program data |

---

## 9. Stakeholder Landing Pages

| Route | Audience |
|-------|----------|
| `/for-funders` | Philanthropists, impact investors |
| `/for-government` | Policy makers, government agencies |
| `/for-researchers` | Academics, research institutions |
| `/for-community-leaders` | Indigenous orgs, community groups |

---

## 10. Admin & Management

### Routes
| Route | Purpose |
|-------|---------|
| `/admin/services` | Manage services |
| `/admin/organizations` | Manage organizations |
| `/admin/organizations/[slug]` | Edit organization |
| `/admin/blog` | Blog management |
| `/admin/blog/new` | Create blog post |
| `/admin/stories` | Story management |
| `/admin/stories/[id]` | Edit story |
| `/admin/stories/new` | Create story |
| `/admin/stories/transcript` | Story transcription |
| `/admin/events` | Event management |
| `/admin/events/[id]` | Edit event |
| `/admin/events/new` | Create event |
| `/admin/media` | Media library |
| `/admin/art-innovation` | Art management |
| `/admin/auto-linking` | Content linking tools |
| `/admin/empathy-ledger` | Empathy Ledger admin |

---

## 11. Special Pages

| Route | Purpose |
|-------|---------|
| `/about` | About JusticeHub |
| `/contact` | Contact form |
| `/transparency` | Financial transparency |
| `/stewards` | Stewardship program |
| `/stewards/impact` | Steward impact tracking |
| `/how-it-works` | Platform explanation |
| `/roadmap` | Development roadmap |
| `/flywheel` | Business model |
| `/preplanning` | Planning resources |
| `/claims/[id]` | Impact claims |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

---

## 12. Campaigns & Special Initiatives

| Route | Purpose |
|-------|---------|
| `/contained` | CONTAINED campaign |
| `/contained/about` | Campaign about |
| `/contained/register` | Campaign registration |
| `/contained/launch` | Launch page |
| `/contained/vip-dinner` | VIP event |
| `/grassroots` | Grassroots initiatives |
| `/talent-scout` | Talent scouting |
| `/youth-scout` | Youth scouting |
| `/youth-scout/talent-login` | Talent portal |
| `/youth-scout/youth-login` | Youth portal |

---

## 13. Visualizations

| Route | Purpose |
|-------|---------|
| `/visuals` | Visualization gallery |
| `/visuals/network` | Network visualization |
| `/visuals/transformation` | Transformation journey |
| `/visuals/flow` | Data flow visualization |
| `/visuals/connections` | Connection mapping |

---

## API Structure

### Core APIs
- `/api/organizations/[id]` - Organization CRUD
- `/api/services/[id]` - Services CRUD
- `/api/stories` - Stories CRUD
- `/api/events` - Events CRUD
- `/api/profiles` - Profile management
- `/api/auth/*` - Authentication
- `/api/empathy-ledger/*` - Empathy Ledger integration

### Intelligence APIs
- `/api/intelligence/research` - Research agent
- `/api/intelligence/alpha-signals` - Portfolio signals
- `/api/bot/chat` - ALMA chat
- `/api/chat` - General chat

### Integration APIs
- `/api/ghl/*` - GoHighLevel CRM integration
- `/api/newsletter` - Newsletter management
- `/api/contact` - Contact form processing

---

## Key Relationships

```
Organizations ─────┬──── Services
                   ├──── Community Programs
                   ├──── Partner Enrichment (goals, contacts, photos, etc.)
                   └──── JusticeHub Nodes (state hubs)

ALMA Interventions ─┬── Evidence
                    ├── Outcomes
                    ├── Contexts
                    └── Linked Services/Programs

Stories ───────────┬── Storytellers
                   ├── Media
                   ├── Consent Records
                   └── Related Interventions

Events ────────────┬── Registrations
                   └── Organizations (hosts)
```

---

## Data Sources

### Internal
- Organizations submitted by partners
- Stories from Empathy Ledger
- Events created by admins

### External (via ALMA)
- Research papers and evaluations
- Government reports
- Media coverage tracking
- International best practice models

---

## Data Synchronization Patterns

### Single Source of Truth

To prevent data drift, the following APIs serve as authoritative sources:

| Data Type | API Endpoint | Fallback Behavior |
|-----------|--------------|-------------------|
| Basecamps | `/api/basecamps` | Returns cached fallback on error |
| Homepage Stats | `/api/homepage-stats` | Returns `is_fallback: true` with cached stats |
| Organizations | `/api/organizations/[id]` | Database direct |

### Pages Using API Data

| Page | Data Source | Notes |
|------|-------------|-------|
| `/for-funders` | `/api/basecamps` | Fetches on mount with fallback |
| `/for-community-leaders` | `/api/basecamps` | Fetches on mount with fallback |
| Homepage | `/api/homepage-stats` | Shows "(cached)" indicator if fallback |

### Static Content (Intentionally Not Synced)

Some content remains static for performance:

| Content | Location | Update Frequency |
|---------|----------|------------------|
| Navigation counts | `src/config/navigation.ts` | Quarterly review |
| International models | `src/content/excellence-map-locations.ts` | Rarely changes |
| Australian frameworks | Database `australian_frameworks` table | Already synced |
| Research items | Database `research_items` table | Already synced |

### Future Sync Opportunities

1. **Navigation counts** - Could create `/api/counts` endpoint for dynamic counts
2. **Excellence map locations** - Could migrate to database for admin editing
3. **Best practices** - Already in database, ensure pages use API

### Audit Notes (January 2026)

- Fixed: Wrong basecamp (Bourke) on for-funders page → Replaced with Mounty Yarns
- Fixed: Hardcoded basecamp arrays → Now fetch from `/api/basecamps`
- Added: Fallback indicator on homepage when using cached stats
- Added: Comments in navigation.ts for periodic count review

---

## Technology Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, Geist fonts
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Maps:** Mapbox GL
- **AI/ML:** OpenAI (ALMA chat), embeddings
- **CRM:** GoHighLevel integration
- **Deployment:** Vercel
