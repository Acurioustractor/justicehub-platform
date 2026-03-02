# API Route Catalog

Date: 2026-02-25

- Total API routes: 105
- Routes with AI usage markers: 8

## API Domain Breakdown

| Domain | Count |
|---|---:|
| `/api/admin` | 18 |
| `/api/intelligence` | 13 |
| `/api/org-hub` | 7 |
| `/api/justice-matrix` | 6 |
| `/api/services` | 5 |
| `/api/empathy-ledger` | 4 |
| `/api/ghl` | 4 |
| `/api/signal-engine` | 4 |
| `/api/alma` | 3 |
| `/api/media` | 3 |
| `/api/programs` | 3 |
| `/api/health` | 2 |
| `/api/organizations` | 2 |
| `/api/reports` | 2 |
| `/api/scraped-services` | 2 |
| `/api/stories` | 2 |
| `/api/transparency` | 2 |
| `/api/australian-frameworks` | 1 |
| `/api/auth` | 1 |
| `/api/basecamps` | 1 |
| `/api/bot` | 1 |
| `/api/chat` | 1 |
| `/api/claims` | 1 |
| `/api/coe-leaders` | 1 |
| `/api/coe` | 1 |
| `/api/community-programs` | 1 |
| `/api/contact` | 1 |
| `/api/enrich` | 1 |
| `/api/featured-profiles` | 1 |
| `/api/featured-stories` | 1 |
| `/api/homepage-stats` | 1 |
| `/api/international-programs` | 1 |
| `/api/network-nodes` | 1 |
| `/api/related-content` | 1 |
| `/api/research-items` | 1 |
| `/api/search` | 1 |
| `/api/sync` | 1 |
| `/api/upload-image` | 1 |
| `/api/users` | 1 |
| `auth` | 1 |

## HTTP Method Coverage

| Method | Route Count |
|---|---:|
| `GET` | 85 |
| `POST` | 40 |
| `DELETE` | 10 |
| `PUT` | 8 |
| `PATCH` | 5 |

## All API Routes

| Route | Methods | Tables Referenced | AI Marker | Source |
|---|---|---|---|---|
| `/api/admin/data-health` | GET | `alma_ingestion_jobs` | no | `src/app/api/admin/data-health/route.ts` |
| `/api/admin/data-operations/alerts` | GET | `profiles`, `public_profiles`, `articles`, `alma_discovered_links`, `alma_ingestion_jobs`, `services`, `organizations`, `registered_services` | no | `src/app/api/admin/data-operations/alerts/route.ts` |
| `/api/admin/data-operations/feeds` | GET | `profiles`, `scraped_services`, `blog_posts`, `services`, `organizations`, `registered_services`, `events`, `articles`, `alma_discovered_links`, `alma_interventions`, `data_sources`, `partner_photos`, `partner_videos`, `australian_frameworks`, `research_items`, `international_programs` | yes | `src/app/api/admin/data-operations/feeds/route.ts` |
| `/api/admin/data-operations/queue` | GET, POST, PATCH | `profiles`, `alma_discovered_links` | no | `src/app/api/admin/data-operations/queue/route.ts` |
| `/api/admin/data-operations/scrape` | POST, GET | `profiles`, `alma_discovered_links`, `alma_interventions`, `alma_scrape_history` | no | `src/app/api/admin/data-operations/scrape/route.ts` |
| `/api/admin/data-operations/sources` | GET | `profiles`, `services`, `organizations`, `registered_services`, `alma_evidence`, `alma_interventions`, `public_profiles`, `articles`, `alma_discovered_links`, `alma_ingestion_jobs`, `data_sources`, `scraped_services` | no | `src/app/api/admin/data-operations/sources/route.ts` |
| `/api/admin/data-operations/sources/[id]` | GET, PATCH, DELETE | `profiles`, `alma_source_registry`, `alma_scrape_history` | no | `src/app/api/admin/data-operations/sources/[id]/route.ts` |
| `/api/admin/data-operations/stats` | GET | `profiles`, `services`, `organizations`, `registered_services`, `public_profiles`, `articles`, `alma_evidence`, `alma_interventions`, `alma_discovered_links`, `alma_ingestion_jobs`, `scraped_services`, `data_sources` | no | `src/app/api/admin/data-operations/stats/route.ts` |
| `/api/admin/data-operations/timeline` | GET | `profiles`, `services`, `organizations`, `alma_evidence`, `alma_interventions`, `alma_discovered_links` | no | `src/app/api/admin/data-operations/timeline/route.ts` |
| `/api/admin/funding/applications` | GET, POST, PUT, DELETE | `alma_funding_applications` | no | `src/app/api/admin/funding/applications/route.ts` |
| `/api/admin/funding/opportunities` | GET, POST, PUT, DELETE | `alma_funding_opportunities` | no | `src/app/api/admin/funding/opportunities/route.ts` |
| `/api/admin/funding/reports` | GET, POST, PUT | `alma_weekly_reports`, `v_latest_reports` | no | `src/app/api/admin/funding/reports/route.ts` |
| `/api/admin/funding/scrape` | POST, GET | `alma_ingestion_jobs`, `alma_funding_opportunities` | no | `src/app/api/admin/funding/scrape/route.ts` |
| `/api/admin/notifications` | POST, GET | `organizations`, `alma_report_deliveries`, `alma_funding_opportunities`, `alma_evidence`, `alma_weekly_reports` | no | `src/app/api/admin/notifications/route.ts` |
| `/api/admin/partner-content` | POST, DELETE, PATCH | `profiles` | no | `src/app/api/admin/partner-content/route.ts` |
| `/api/admin/research/digest` | POST, GET | `alma_evidence` | no | `src/app/api/admin/research/digest/route.ts` |
| `/api/admin/research/evidence` | GET, POST, PUT, DELETE | `alma_evidence` | no | `src/app/api/admin/research/evidence/route.ts` |
| `/api/admin/sync-empathy-ledger` | POST | `profiles`, `profile_sync_log`, `public_profiles` | no | `src/app/api/admin/sync-empathy-ledger/route.ts` |
| `/api/alma/interventions` | GET, POST | `profiles` | no | `src/app/api/alma/interventions/route.ts` |
| `/api/alma/interventions/[id]` | GET, PUT, DELETE | n/a | no | `src/app/api/alma/interventions/[id]/route.ts` |
| `/api/alma/portfolio` | GET | n/a | no | `src/app/api/alma/portfolio/route.ts` |
| `/api/australian-frameworks` | GET | `australian_frameworks` | no | `src/app/api/australian-frameworks/route.ts` |
| `/api/auth/me` | GET | n/a | no | `src/app/api/auth/me/route.ts` |
| `/api/basecamps` | GET | `organizations` | no | `src/app/api/basecamps/route.ts` |
| `/api/bot/chat` | POST, GET | `alma_interventions`, `alma_evidence`, `alma_outcomes` | yes | `src/app/api/bot/chat/route.ts` |
| `/api/chat` | POST, GET | `alma_interventions`, `services`, `public_profiles`, `organizations`, `alma_evidence`, `historical_inquiries`, `international_programs` | yes | `src/app/api/chat/route.ts` |
| `/api/claims/submit` | POST | `public_profiles`, `registered_services_profiles` | no | `src/app/api/claims/submit/route.ts` |
| `/api/coe-leaders` | GET | `coe_key_people` | no | `src/app/api/coe-leaders/route.ts` |
| `/api/coe/map-locations` | GET | `organizations`, `australian_frameworks`, `international_programs`, `research_items`, `partner_impact_metrics` | no | `src/app/api/coe/map-locations/route.ts` |
| `/api/community-programs` | GET | `programs_catalog_v` | no | `src/app/api/community-programs/route.ts` |
| `/api/contact` | POST | `contact_submissions` | no | `src/app/api/contact/route.ts` |
| `/api/empathy-ledger/profiles` | GET | `storytellers`, `public_profiles`, `stories` | no | `src/app/api/empathy-ledger/profiles/route.ts` |
| `/api/empathy-ledger/profiles/[id]` | GET | `profiles`, `organizations`, `stories` | no | `src/app/api/empathy-ledger/profiles/[id]/route.ts` |
| `/api/empathy-ledger/stories` | GET | `stories` | no | `src/app/api/empathy-ledger/stories/route.ts` |
| `/api/empathy-ledger/sync` | POST, GET | `profiles`, `sync_metadata`, `stories`, `synced_stories` | no | `src/app/api/empathy-ledger/sync/route.ts` |
| `/api/enrich/contact` | POST | n/a | no | `src/app/api/enrich/contact/route.ts` |
| `/api/featured-profiles` | GET | n/a | no | `src/app/api/featured-profiles/route.ts` |
| `/api/featured-stories` | GET | n/a | no | `src/app/api/featured-stories/route.ts` |
| `/api/ghl/newsletter` | POST, DELETE | `newsletter_subscriptions` | no | `src/app/api/ghl/newsletter/route.ts` |
| `/api/ghl/register` | POST | `event_registrations`, `newsletter_subscriptions` | no | `src/app/api/ghl/register/route.ts` |
| `/api/ghl/signup` | POST | `public_profiles`, `newsletter_subscriptions` | no | `src/app/api/ghl/signup/route.ts` |
| `/api/ghl/webhook` | POST, GET | `event_registrations`, `newsletter_subscriptions` | no | `src/app/api/ghl/webhook/route.ts` |
| `/api/health` | GET | `services`, `alma_interventions`, `public_profiles`, `events`, `justicehub_nodes` | no | `src/app/api/health/route.ts` |
| `/api/health/empathy-ledger` | GET | `stories`, `profiles`, `services`, `profile_appearances` | no | `src/app/api/health/empathy-ledger/route.ts` |
| `/api/homepage-stats` | GET | `alma_interventions`, `services`, `public_profiles`, `organizations` | no | `src/app/api/homepage-stats/route.ts` |
| `/api/intelligence/alpha-signals` | GET | `view_intervention_alpha`, `alma_interventions` | no | `src/app/api/intelligence/alpha-signals/route.ts` |
| `/api/intelligence/evidence` | GET | `alma_evidence` | no | `src/app/api/intelligence/evidence/route.ts` |
| `/api/intelligence/evidence/[id]` | GET | `alma_evidence`, `article_related_evidence`, `alma_intervention_evidence` | no | `src/app/api/intelligence/evidence/[id]/route.ts` |
| `/api/intelligence/global-stats` | GET | `alma_interventions`, `alma_evidence`, `alma_outcomes`, `alma_community_contexts`, `alma_source_registry`, `alma_discovered_links`, `alma_intervention_evidence` | no | `src/app/api/intelligence/global-stats/route.ts` |
| `/api/intelligence/interventions` | GET | `alma_intervention_outcomes`, `alma_intervention_contexts`, `alma_interventions`, `alma_outcomes`, `alma_community_contexts` | no | `src/app/api/intelligence/interventions/route.ts` |
| `/api/intelligence/interventions/[id]` | GET | `alma_interventions`, `alma_intervention_evidence`, `alma_intervention_outcomes`, `alma_intervention_contexts`, `alma_evidence`, `alma_outcomes`, `alma_community_contexts` | no | `src/app/api/intelligence/interventions/[id]/route.ts` |
| `/api/intelligence/knowledge-graph` | GET | `alma_interventions`, `alma_evidence`, `alma_outcomes`, `alma_community_contexts`, `alma_intervention_evidence`, `alma_intervention_outcomes`, `alma_intervention_contexts` | no | `src/app/api/intelligence/knowledge-graph/route.ts` |
| `/api/intelligence/map-locations` | GET | `alma_interventions`, `services` | no | `src/app/api/intelligence/map-locations/route.ts` |
| `/api/intelligence/overview-summary` | GET | `services`, `alma_interventions`, `alma_evidence`, `organizations`, `alma_funding_opportunities` | no | `src/app/api/intelligence/overview-summary/route.ts` |
| `/api/intelligence/research` | POST, GET | `alma_research_sessions` | no | `src/app/api/intelligence/research/route.ts` |
| `/api/intelligence/research/[sessionId]` | GET, POST | `alma_research_sessions`, `alma_research_findings`, `alma_research_tool_logs` | no | `src/app/api/intelligence/research/[sessionId]/route.ts` |
| `/api/intelligence/search` | GET, POST | n/a | no | `src/app/api/intelligence/search/route.ts` |
| `/api/intelligence/system-status` | GET | `alma_interventions`, `alma_discovered_links` | no | `src/app/api/intelligence/system-status/route.ts` |
| `/api/international-programs` | GET | `international_programs` | no | `src/app/api/international-programs/route.ts` |
| `/api/justice-matrix/campaigns` | GET, POST | `justice_matrix_campaigns` | no | `src/app/api/justice-matrix/campaigns/route.ts` |
| `/api/justice-matrix/campaigns/[id]` | GET, PUT, DELETE | `justice_matrix_campaigns` | no | `src/app/api/justice-matrix/campaigns/[id]/route.ts` |
| `/api/justice-matrix/cases` | GET, POST | `justice_matrix_cases` | no | `src/app/api/justice-matrix/cases/route.ts` |
| `/api/justice-matrix/cases/[id]` | GET, PUT, DELETE | `justice_matrix_cases` | no | `src/app/api/justice-matrix/cases/[id]/route.ts` |
| `/api/justice-matrix/discovered` | GET, POST | `justice_matrix_discovered` | no | `src/app/api/justice-matrix/discovered/route.ts` |
| `/api/justice-matrix/discovered/[id]` | GET, PUT, DELETE | `justice_matrix_discovered`, `justice_matrix_cases`, `justice_matrix_campaigns` | no | `src/app/api/justice-matrix/discovered/[id]/route.ts` |
| `/api/media` | GET | `partner_photos`, `partner_videos` | no | `src/app/api/media/route.ts` |
| `/api/media/[id]/featured` | PATCH | n/a | no | `src/app/api/media/[id]/featured/route.ts` |
| `/api/media/upload` | POST | `story-images`, `media_library` | no | `src/app/api/media/upload/route.ts` |
| `/api/network-nodes` | GET | `justicehub_nodes`, `organizations` | no | `src/app/api/network-nodes/route.ts` |
| `/api/org-hub/[orgId]` | GET, POST | n/a | no | `src/app/api/org-hub/[orgId]/route.ts` |
| `/api/org-hub/[orgId]/compliance-check` | POST | `org_compliance_docs`, `org_action_items` | no | `src/app/api/org-hub/[orgId]/compliance-check/route.ts` |
| `/api/org-hub/[orgId]/grant-match` | POST | `organizations`, `alma_funding_opportunities`, `alma_funding_applications`, `org_action_items` | no | `src/app/api/org-hub/[orgId]/grant-match/route.ts` |
| `/api/org-hub/[orgId]/overview` | GET | `org_grants`, `org_compliance_docs`, `org_sessions`, `org_action_items`, `org_grant_budget_lines`, `org_grant_transactions` | no | `src/app/api/org-hub/[orgId]/overview/route.ts` |
| `/api/org-hub/[orgId]/pulse` | POST | `org_compliance_docs`, `org_grants`, `org_sessions`, `org_grant_budget_lines`, `org_action_items` | no | `src/app/api/org-hub/[orgId]/pulse/route.ts` |
| `/api/org-hub/[orgId]/report-draft` | POST | `org_grants`, `organizations`, `org_sessions`, `org_milestones`, `org_grant_budget_lines`, `org_grant_transactions` | yes | `src/app/api/org-hub/[orgId]/report-draft/route.ts` |
| `/api/org-hub/[orgId]/social-draft` | POST | `organizations`, `org_sessions`, `org_milestones`, `articles` | yes | `src/app/api/org-hub/[orgId]/social-draft/route.ts` |
| `/api/organizations` | GET | `organizations`, `registered_services` | no | `src/app/api/organizations/route.ts` |
| `/api/organizations/[id]` | GET | `organizations`, `partner_goals`, `partner_contacts`, `partner_videos`, `partner_photos`, `partner_stories`, `partner_storytellers`, `partner_impact_metrics` | no | `src/app/api/organizations/[id]/route.ts` |
| `/api/programs` | GET | `programs_catalog_v` | no | `src/app/api/programs/route.ts` |
| `/api/programs/[id]` | GET | `programs_catalog_v` | no | `src/app/api/programs/[id]/route.ts` |
| `/api/programs/[id]/profiles` | GET | `profile_appearances`, `public_profiles` | no | `src/app/api/programs/[id]/profiles/route.ts` |
| `/api/related-content` | GET | `article_related_interventions`, `story_related_interventions`, `alma_intervention_profiles`, `alma_intervention_evidence`, `alma_media_articles`, `article_related_evidence`, `alma_evidence` | no | `src/app/api/related-content/route.ts` |
| `/api/reports` | POST | `discrimination_reports`, `discrimination_sa3_totals_v` | no | `src/app/api/reports/route.ts` |
| `/api/reports/aggregation` | GET | `discrimination_aggregations_v`, `discrimination_sa3_totals_v` | no | `src/app/api/reports/aggregation/route.ts` |
| `/api/research-items` | GET | `research_items` | no | `src/app/api/research-items/route.ts` |
| `/api/scraped-services` | GET | `scraped_services` | yes | `src/app/api/scraped-services/route.ts` |
| `/api/scraped-services/[id]` | GET | n/a | no | `src/app/api/scraped-services/[id]/route.ts` |
| `/api/search` | GET | `alma_interventions`, `services`, `public_profiles`, `organizations` | no | `src/app/api/search/route.ts` |
| `/api/services` | GET | `services_complete` | no | `src/app/api/services/route.ts` |
| `/api/services/[id]` | GET | n/a | no | `src/app/api/services/[id]/route.ts` |
| `/api/services/[id]/profiles` | GET | `profile_appearances`, `public_profiles` | no | `src/app/api/services/[id]/profiles/route.ts` |
| `/api/services/search` | GET | `services_complete` | no | `src/app/api/services/search/route.ts` |
| `/api/services/stats` | GET | `services`, `organizations`, `service_locations`, `service_contacts` | no | `src/app/api/services/stats/route.ts` |
| `/api/signal-engine/compose` | POST | `signal_events`, `signal_content` | yes | `src/app/api/signal-engine/compose/route.ts` |
| `/api/signal-engine/events` | GET, PATCH | `signal_events`, `signal_content` | no | `src/app/api/signal-engine/events/route.ts` |
| `/api/signal-engine/scan` | POST | `discrimination_sa3_totals_v`, `discrimination_aggregations_v`, `services_complete`, `signal_events` | no | `src/app/api/signal-engine/scan/route.ts` |
| `/api/signal-engine/widget` | GET | `discrimination_sa3_totals_v`, `discrimination_aggregations_v`, `signal_widget_alerts`, `services_complete` | no | `src/app/api/signal-engine/widget/route.ts` |
| `/api/stories` | GET | `articles`, `blog_posts` | no | `src/app/api/stories/route.ts` |
| `/api/stories/extract-quotes` | POST | `profiles` | yes | `src/app/api/stories/extract-quotes/route.ts` |
| `/api/sync/empathy-ledger` | GET | n/a | no | `src/app/api/sync/empathy-ledger/route.ts` |
| `/api/transparency` | GET | n/a | no | `src/app/api/transparency/route.ts` |
| `/api/transparency/ecosystem` | GET | `youth_detention_facilities`, `facility_partnerships`, `registered_services`, `services`, `organizations` | no | `src/app/api/transparency/ecosystem/route.ts` |
| `/api/upload-image` | POST | `story-images` | no | `src/app/api/upload-image/route.ts` |
| `/api/users/profile` | GET | `profiles` | no | `src/app/api/users/profile/route.ts` |
| `/auth/callback` | GET | n/a | no | `src/app/auth/callback/route.ts` |