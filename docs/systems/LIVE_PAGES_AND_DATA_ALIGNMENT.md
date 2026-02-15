# JusticeHub Live Pages and Data Alignment

Updated: 2026-02-15

## Sprint Alignment Artifacts
- `/Users/benknight/Code/JusticeHub/docs/systems/SPRINT_1_VISUAL_PAGE_MAP.md`
- `/Users/benknight/Code/JusticeHub/docs/systems/SPRINT_1_CYCLE_1_PURPOSE_MATRIX.md`
- `/Users/benknight/Code/JusticeHub/docs/systems/SPRINT_1_CYCLE_2_PAGE_OWNERSHIP.md`
- `/Users/benknight/Code/JusticeHub/docs/systems/SPRINT_1_CYCLE_3_API_CONTRACT_REGISTER.md`
- `/Users/benknight/Code/JusticeHub/docs/systems/SPRINT_1_CYCLE_4_DATA_MODEL_OWNERSHIP.md`
- `/Users/benknight/Code/JusticeHub/docs/systems/SPRINT_1_CYCLE_5_GAP_CLOSURE_AND_SPRINT_2_BACKLOG.md`

## Core Goal Alignment
Reference strategic intent and platform philosophy in:
- /Users/benknight/Code/JusticeHub/docs/strategic/CORE_GOAL_AND_ALIGNMENT_MAP.md

Operationally, the current architecture aligns around four user outcomes:
1. Discover frontline services (`/services`) from canonical service records.
2. Discover curated community programs (`/community-programs`) with optional ALMA evidence linkage.
3. Explore intelligence evidence/interventions (`/intelligence/**`) from ALMA tables.
4. Operate ingestion/quality from admin data routes (`/admin/data-operations`, `/admin/data-health`).

## Runtime Table Inventory (Used in `src/app` + `src/lib`)
Source method: static scan of `.from('table')` calls.

```text
  65 alma_interventions
  51 organizations
  44 profiles
  39 public_profiles
  35 stories
  33 services
  28 alma_discovered_links
  26 alma_evidence
  20 registered_services
  16 blog_posts
  15 events
  13 articles
  12 organizations_profiles
  12 justice_matrix_discovered
  12 alma_funding_opportunities
  11 justice_matrix_cases
  11 alma_intervention_evidence
  10 alma_ingestion_jobs
   9 registered_services_profiles
   9 blog_posts_profiles
   8 justice_matrix_campaigns
   8 empathy_ledger_sync_log
   7 partner_videos
   7 partner_storytellers
   7 partner_photos
   7 international_programs
   7 alma_outcomes
   6 storytellers
   6 story-images
   6 research_items
   6 profile_sync_log
   6 profile_appearances
   6 newsletter_subscriptions
   6 australian_frameworks
   6 alma_weekly_reports
   6 alma_community_contexts
   5 services_profiles
   5 historical_inquiries
   5 coe_key_people
   5 art_innovation_profiles
   5 art_innovation
   5 alma_intervention_outcomes
   5 alma_intervention_contexts
   5 alma_funding_applications
   4 justicehub_nodes
   4 alma_source_registry
   4 alma_research_sessions
   4 alma_media_articles
   4 alma_consent_ledger
   3 sync_metadata
   3 story_related_interventions
   3 services_complete
   3 scraped_services
   3 partner_impact_metrics
   3 justice_matrix_sources
   3 data_sources
   3 article_related_interventions
   3 article_related_evidence
   3 alma_usage_log
   3 alma_scrape_history
   3 alma_report_deliveries
   3 alma_intervention_profiles
   2 youth_detention_facilities
   2 users
   2 synced_stories
   2 projects
   2 partner_stories
   2 partner_goals
   2 partner_external_links
   2 partner_contacts
   2 images
   2 facility_partnerships
   2 event_registrations
   2 documents
   2 content_link_suggestions
   1 view_intervention_alpha
   1 v_latest_reports
   1 transparency_metrics
   1 transparency_budget
   1 transparency_alerts
   1 story_interactions
   1 service_locations
   1 service_contacts
   1 media_library
   1 media_item
   1 cross_project_metrics
   1 contact_submissions
   1 consent_records
   1 alma_research_tool_logs
   1 alma_research_findings
   1 alma_government_programs
   1 alma_funding_data
   1 alma_daily_sentiment
```

## Live Page Routes
Source method: filesystem inventory of `src/app/**/page.tsx`.

```text
/
/about
/about/roadmap
/admin
/admin/art-innovation
/admin/auto-linking
/admin/blog
/admin/blog/new
/admin/coe/frameworks
/admin/coe/frameworks/[slug]
/admin/coe/frameworks/new
/admin/coe/people
/admin/coe/people/[id]
/admin/coe/people/new
/admin/coe/research
/admin/coe/research/[slug]
/admin/coe/research/new
/admin/content-health
/admin/data-health
/admin/data-operations
/admin/empathy-ledger
/admin/empathy-ledger/sync
/admin/events
/admin/events/[id]
/admin/events/new
/admin/funding
/admin/justice-matrix
/admin/justice-matrix/discoveries
/admin/media
/admin/organizations
/admin/organizations/[slug]
/admin/organizations/[slug]/edit
/admin/organizations/[slug]/storytellers
/admin/people
/admin/profiles
/admin/profiles/[id]/connections
/admin/profiles/new
/admin/programs
/admin/programs/[id]
/admin/programs/[id]/people
/admin/research
/admin/services
/admin/stories
/admin/stories/[id]
/admin/stories/new
/admin/stories/transcript
/art-innovation
/art-innovation/[slug]
/blog
/blog/[slug]
/centre-of-excellence
/centre-of-excellence/best-practice
/centre-of-excellence/global-insights
/centre-of-excellence/map
/centre-of-excellence/people
/centre-of-excellence/research
/check-cookies
/claims/[id]
/community-map
/community-programs
/community-programs/[id]
/community-programs/add
/contact
/contained
/contained/about
/contained/launch
/contained/register
/contained/vip-dinner
/events
/events/[id]
/events/[id]/register
/flywheel
/for-community-leaders
/for-funders
/for-government
/for-researchers
/gallery
/gallery/[id]
/grassroots
/how-it-works
/intelligence
/intelligence/chat
/intelligence/dashboard
/intelligence/evidence
/intelligence/evidence/[id]
/intelligence/funding
/intelligence/impact-calculator
/intelligence/interventions
/intelligence/interventions/[id]
/intelligence/knowledge
/intelligence/map
/intelligence/media/[id]
/intelligence/nt-showcase
/intelligence/overview
/intelligence/portfolio
/intelligence/programs/[id]
/intelligence/reports
/intelligence/reports/portfolio
/intelligence/research
/intelligence/status
/intelligence/tools/dividend-calculator
/international-exchange
/login
/network
/network/[id]
/opportunities
/organizations
/organizations/[slug]
/people
/people/[slug]
/people/[slug]/edit
/preplanning
/preview
/preview/grassroots-activation
/preview/justice-matrix
/preview/justice-project
/privacy
/roadmap
/search
/services
/services/[id]
/signup
/stewards
/stewards/impact
/stories
/stories/[slug]
/stories/empathy-ledger/[id]
/stories/intelligence
/stories/new
/stories/the-pattern
/talent-scout
/terms
/test-auth
/test-services
/themes
/themes/disability
/transparency
/visuals
/visuals/connections
/visuals/flow
/visuals/network
/visuals/transformation
/wiki
/wiki/[slug]
/youth-justice-report
/youth-justice-report/chat
/youth-justice-report/inquiries
/youth-justice-report/international
/youth-justice-report/interventions
/youth-justice-report/recommendations
/youth-justice-report/research
/youth-scout
/youth-scout/talent-login
/youth-scout/youth-login
```

## Live API Routes
Source method: filesystem inventory of `src/app/api/**/route.ts`.

```text
/api/admin/data-health
/api/admin/data-operations/alerts
/api/admin/data-operations/feeds
/api/admin/data-operations/queue
/api/admin/data-operations/scrape
/api/admin/data-operations/sources
/api/admin/data-operations/sources/[id]
/api/admin/data-operations/stats
/api/admin/data-operations/timeline
/api/admin/funding/applications
/api/admin/funding/opportunities
/api/admin/funding/reports
/api/admin/funding/scrape
/api/admin/notifications
/api/admin/partner-content
/api/admin/research/digest
/api/admin/research/evidence
/api/admin/sync-empathy-ledger
/api/alma/interventions
/api/alma/interventions/[id]
/api/alma/portfolio
/api/australian-frameworks
/api/auth/me
/api/basecamps
/api/bot/chat
/api/chat
/api/claims/submit
/api/coe-leaders
/api/community-programs
/api/contact
/api/empathy-ledger/profiles
/api/empathy-ledger/profiles/[id]
/api/empathy-ledger/stories
/api/empathy-ledger/sync
/api/enrich/contact
/api/featured-profiles
/api/featured-stories
/api/ghl/newsletter
/api/ghl/register
/api/ghl/signup
/api/ghl/webhook
/api/health
/api/health/empathy-ledger
/api/homepage-stats
/api/intelligence/alpha-signals
/api/intelligence/global-stats
/api/intelligence/interventions
/api/intelligence/knowledge-graph
/api/intelligence/map-locations
/api/intelligence/research
/api/intelligence/research/[sessionId]
/api/intelligence/search
/api/intelligence/system-status
/api/international-programs
/api/justice-matrix/campaigns
/api/justice-matrix/campaigns/[id]
/api/justice-matrix/cases
/api/justice-matrix/cases/[id]
/api/justice-matrix/discovered
/api/justice-matrix/discovered/[id]
/api/media
/api/media/[id]/featured
/api/media/upload
/api/network-nodes
/api/organizations
/api/organizations/[id]
/api/programs
/api/programs/[id]
/api/programs/[id]/profiles
/api/related-content
/api/research-items
/api/scraped-services
/api/scraped-services/[id]
/api/search
/api/services
/api/services/[id]
/api/services/[id]/profiles
/api/services/search
/api/services/stats
/api/stories
/api/stories/extract-quotes
/api/sync/empathy-ledger
/api/transparency
/api/transparency/ecosystem
/api/upload-image
/api/users/profile
```

## Canonical User-Facing Data Flows

### 1) Services discovery and detail
- Page: `/Users/benknight/Code/JusticeHub/src/app/services/page.tsx`
- API: `/Users/benknight/Code/JusticeHub/src/app/api/services/route.ts`
- Data source: `services_complete` (canonical read view)
- Detail page: `/Users/benknight/Code/JusticeHub/src/app/services/[id]/page.tsx`
- Detail API: `/Users/benknight/Code/JusticeHub/src/app/api/services/[id]/route.ts`
- Back-compat alias: `/Users/benknight/Code/JusticeHub/src/app/api/scraped-services/[id]/route.ts`

### 2) Community programs list and detail
- List page: `/Users/benknight/Code/JusticeHub/src/app/community-programs/page.tsx`
- List data source: `programs_catalog_v`
- Canonical APIs:
  - `/Users/benknight/Code/JusticeHub/src/app/api/programs/route.ts`
  - `/Users/benknight/Code/JusticeHub/src/app/api/programs/[id]/route.ts`
- Compatibility API: `/Users/benknight/Code/JusticeHub/src/app/api/community-programs/route.ts`
- Detail page currently reads directly from `registered_services` in `/Users/benknight/Code/JusticeHub/src/app/community-programs/[id]/page.tsx`.
- Evidence drill-through link target: `/intelligence/interventions/[alma_intervention_id]` when present.

### 3) Intelligence interventions and evidence
- Interventions list page: `/Users/benknight/Code/JusticeHub/src/app/intelligence/interventions/page.tsx`
- Interventions detail page: `/Users/benknight/Code/JusticeHub/src/app/intelligence/interventions/[id]/page.tsx`
- Detail link tables now used:
  - `alma_intervention_evidence`
  - `alma_intervention_outcomes`
  - `alma_intervention_contexts`
- New aligned API route for overview consumption:
  - `/Users/benknight/Code/JusticeHub/src/app/api/intelligence/interventions/route.ts` (wrapper over ALMA interventions handler)

### 4) Intelligence program detail content graph
- Page: `/Users/benknight/Code/JusticeHub/src/app/intelligence/programs/[id]/page.tsx`
- Related content joins:
  - `article_related_interventions`
  - `story_related_interventions`
  - `alma_intervention_profiles`
  - `alma_intervention_evidence` -> `alma_evidence`

### 5) Related-content API
- Route: `/Users/benknight/Code/JusticeHub/src/app/api/related-content/route.ts`
- Evidence relationship path standardized to `alma_intervention_evidence` (no `related_interventions` phantom column usage).

## Scraper System Alignment (Frontend Relevance)

### Directory pipeline (service finder)
- Scripts:
  - `/Users/benknight/Code/JusticeHub/src/scripts/scrape-qld-services.ts`
  - `/Users/benknight/Code/JusticeHub/src/scripts/scrape-qld-services-batch.ts`
  - `/Users/benknight/Code/JusticeHub/src/scripts/scraper-daemon.ts`
- Writes:
  - `organizations`
  - `services`
- Frontend alignment:
  - Feeds `/services` and map experiences through `services_complete` and services APIs.

### ALMA ingestion pipeline
- Admin route:
  - `/Users/benknight/Code/JusticeHub/src/app/api/admin/data-operations/scrape/route.ts`
- Writes:
  - `alma_discovered_links` (queue/status)
  - `alma_interventions` (entity insertion)
  - `alma_scrape_history` (audit history)
- Frontend alignment:
  - Feeds intelligence pages (`/intelligence/**`) and admin ops dashboards.

### ALMA funding/reports jobs
- Scripts:
  - `/Users/benknight/Code/JusticeHub/scripts/alma-funding-scrape.mjs`
  - `/Users/benknight/Code/JusticeHub/scripts/alma-research-scrape.mjs`
  - `/Users/benknight/Code/JusticeHub/scripts/alma-scheduler.mjs`
  - `/Users/benknight/Code/JusticeHub/scripts/alma-weekly-report.ts`
- Writes/updates:
  - `alma_funding_opportunities`
  - `alma_ingestion_jobs`
  - `alma_weekly_reports`
  - `alma_evidence`

### Deterministic linking workflow
- Job:
  - `/Users/benknight/Code/JusticeHub/scripts/jobs/link-programs-to-alma.ts`
- Writes:
  - `registered_services.organization_id`
  - `registered_services.alma_intervention_id`
  - `registered_services.relationship_type`
  - `alma_interventions.linked_community_program_id`
- Frontend alignment:
  - Enables program-to-evidence pathway from `/community-programs` into `/intelligence/interventions/[id]`.

## Current Misalignment Hotspots
1. `/community-programs/[id]` still reads direct `registered_services` instead of canonical `programs_catalog_v`/`/api/programs/[id]`.
2. Many legacy/non-active scripts exist in `src/scripts`; active workflow should prefer `/Users/benknight/Code/JusticeHub/scripts/README_ACTIVE.md` and `/Users/benknight/Code/JusticeHub/scripts/legacy/` quarantine policy.
3. Repo-wide TypeScript and lint baselines currently fail for unrelated files, which blocks clean global verification despite targeted runtime fixes.

## Immediate Alignment Rule of Thumb
- Services UI must read from `services_complete` and `/api/services/**`.
- Community programs UI should read from `programs_catalog_v` and `/api/programs/**` (with `/api/community-programs` as compatibility layer only).
- Intelligence UI should resolve evidence/outcomes/contexts via ALMA link tables, not inferred columns on entity tables.
- Scrapers should write to their pipeline-owned tables only, then linking jobs bridge between program and ALMA domains.
