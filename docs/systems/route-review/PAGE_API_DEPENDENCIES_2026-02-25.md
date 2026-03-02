# Page to API Dependency Map

Date: 2026-02-25

- Pages with explicit API fetch/use calls: 46

| Page Route | API Calls | Source |
|---|---|---|
| `/` | `/api/homepage-stats` | `src/app/page.tsx` |
| `/about` | `/api/homepage-stats` | `src/app/about/page.tsx` |
| `/admin/blog/new` | `/api/upload-image` | `src/app/admin/blog/new/page.tsx` |
| `/admin/data-health` | `/api/admin/data-health` | `src/app/admin/data-health/page.tsx` |
| `/admin/data-operations` | `/api/admin/data-operations/alerts`<br/>`/api/admin/data-operations/sources`<br/>`/api/admin/data-operations/stats`<br/>`/api/admin/data-operations/timeline?days=30` | `src/app/admin/data-operations/page.tsx` |
| `/admin/empathy-ledger/sync` | `/api/admin/sync-empathy-ledger`<br/>`/api/empathy-ledger/profiles?justicehub_enabled=true` | `src/app/admin/empathy-ledger/sync/page.tsx` |
| `/admin/funding` | `/api/admin/funding/opportunities?${params}`<br/>`/api/admin/funding/scrape` | `src/app/admin/funding/page.tsx` |
| `/admin/justice-matrix` | `/api/justice-matrix/campaigns`<br/>`/api/justice-matrix/cases` | `src/app/admin/justice-matrix/page.tsx` |
| `/admin/justice-matrix/discoveries` | `/api/justice-matrix/discovered/${id}`<br/>`/api/justice-matrix/discovered?${params}` | `src/app/admin/justice-matrix/discoveries/page.tsx` |
| `/admin/media` | `/api/media/${item.id}/featured`<br/>`/api/media?${params}` | `src/app/admin/media/page.tsx` |
| `/admin/organizations/[slug]/edit` | `/api/admin/partner-content`<br/>`/api/upload-image` | `src/app/admin/organizations/[slug]/edit/page.tsx` |
| `/admin/research` | `/api/admin/research/digest?days=30`<br/>`/api/admin/research/evidence?${params}` | `src/app/admin/research/page.tsx` |
| `/admin/signal-engine` | `/api/signal-engine/compose`<br/>`/api/signal-engine/events`<br/>`/api/signal-engine/events${params}`<br/>`/api/signal-engine/scan`<br/>`/api/signal-engine/widget?postcode=${pc}` | `src/app/admin/signal-engine/page.tsx` |
| `/admin/stories/[id]` | `/api/upload-image` | `src/app/admin/stories/[id]/page.tsx` |
| `/admin/stories/new` | `/api/upload-image` | `src/app/admin/stories/new/page.tsx` |
| `/admin/stories/transcript` | `/api/stories/extract-quotes` | `src/app/admin/stories/transcript/page.tsx` |
| `/centre-of-excellence` | `/api/basecamps` | `src/app/centre-of-excellence/page.tsx` |
| `/centre-of-excellence/global-insights` | `/api/international-programs?${params}` | `src/app/centre-of-excellence/global-insights/page.tsx` |
| `/centre-of-excellence/map` | `/api/coe/map-locations` | `src/app/centre-of-excellence/map/page.tsx` |
| `/claims/[id]` | `/api/claims/submit` | `src/app/claims/[id]/page.tsx` |
| `/community-map` | `/api/programs?limit=100`<br/>`/api/reports/aggregation`<br/>`/api/reports/aggregation?system_type=education,health,policing,housing,employment,anti-discrimination,other`<br/>`/api/services?limit=600` | `src/app/community-map/page.tsx` |
| `/community-programs/[id]` | `/api/programs/${encodeURIComponent(programId)}`<br/>`/api/programs/${encodeURIComponent(programId)}/profiles`<br/>`/api/programs?limit=200` | `src/app/community-programs/[id]/page.tsx` |
| `/contact` | `/api/contact` | `src/app/contact/page.tsx` |
| `/contained/register` | `/api/ghl/register` | `src/app/contained/register/page.tsx` |
| `/events/[id]/register` | `/api/ghl/register` | `src/app/events/[id]/register/page.tsx` |
| `/for-community-leaders` | `/api/basecamps` | `src/app/for-community-leaders/page.tsx` |
| `/for-funders` | `/api/basecamps` | `src/app/for-funders/page.tsx` |
| `/gallery` | `/api/placeholder/400/300`<br/>`/api/placeholder/800/600`<br/>`/api/placeholder/video` | `src/app/gallery/page.tsx` |
| `/gallery/[id]` | `/api/placeholder/800/600`<br/>`/api/placeholder/video` | `src/app/gallery/[id]/page.tsx` |
| `/intelligence/dashboard` | `/api/intelligence/alpha-signals`<br/>`/api/intelligence/global-stats` | `src/app/intelligence/dashboard/page.tsx` |
| `/intelligence/evidence` | `/api/intelligence/evidence?${params.toString()}` | `src/app/intelligence/evidence/page.tsx` |
| `/intelligence/interventions` | `/api/intelligence/interventions?${params.toString()}` | `src/app/intelligence/interventions/page.tsx` |
| `/intelligence/map` | `/api/intelligence/map-locations` | `src/app/intelligence/map/page.tsx` |
| `/intelligence/overview` | `/api/intelligence/overview-summary` | `src/app/intelligence/overview/page.tsx` |
| `/intelligence/research` | `/api/intelligence/research`<br/>`/api/intelligence/research?limit=5` | `src/app/intelligence/research/page.tsx` |
| `/intelligence/status` | `/api/intelligence/system-status` | `src/app/intelligence/status/page.tsx` |
| `/preview/justice-matrix` | `/api/justice-matrix/campaigns?limit=100`<br/>`/api/justice-matrix/cases?limit=100` | `src/app/preview/justice-matrix/page.tsx` |
| `/preview/racism-heatmap` | `/api/reports/aggregation`<br/>`/api/reports/aggregation?system_type=education,health,policing,housing,employment,anti-discrimination,other` | `src/app/preview/racism-heatmap/page.tsx` |
| `/services` | `/api/services?limit=1000` | `src/app/services/page.tsx` |
| `/services/[id]` | `/api/services/${encodeURIComponent(serviceId)}`<br/>`/api/services/${encodeURIComponent(serviceId)}/profiles` | `src/app/services/[id]/page.tsx` |
| `/signup` | `/api/ghl/signup` | `src/app/signup/page.tsx` |
| `/stories/new` | `/api/stories` | `src/app/stories/new/page.tsx` |
| `/test-services` | `/api/services?limit=10` | `src/app/test-services/page.tsx` |
| `/transparency` | `/api/transparency?year=${selectedTimeframe}` | `src/app/transparency/page.tsx` |
| `/widget/embed` | `/api/signal-engine/widget?postcode=${pc}` | `src/app/widget/embed/page.tsx` |
| `/youth-justice-report/chat` | `/api/chat` | `src/app/youth-justice-report/chat/page.tsx` |