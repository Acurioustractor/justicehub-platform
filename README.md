# JusticeHub Platform

A Next.js platform for Australian youth justice — connecting system-impacted young people with support services, surfacing evidence-based interventions, and powering community-led advocacy campaigns.

## Core Systems

### ALMA (Authentic Learning for Meaningful Accountability)
The evidence intelligence engine. 1,112 youth justice interventions from 507+ organisations across Australia, each scored on 5 signals:
- **Evidence Strength** (25%) — from Untested to Proven (RCT-validated)
- **Community Authority** (30%) — highest weight, prioritises Indigenous-led programs
- **Harm Risk** (20%) — inverse score, flags programs needing cultural review
- **Implementation Capability** (15%) — replication readiness assessment
- **Option Value** (10%) — learning potential for emerging programs

**Key routes:**
- `/intelligence/interventions` — Explorer with search, filters, sort-by-score
- `/intelligence/interventions/[id]` — Detail page with portfolio score card, evidence, outcomes
- `/intelligence/portfolio` — Funder analytics dashboard
- `/api/intelligence/interventions` — REST API (supports `?sort=score&type=X&evidence_level=X`)

**Database tables:** `alma_interventions`, `alma_evidence`, `alma_outcomes`, `alma_organizations`, `alma_discovered_links`, plus junction tables (`alma_intervention_evidence`, `alma_intervention_outcomes`, `alma_intervention_contexts`)

**Data pipeline scripts** (in `scripts/`):
- `alma-link-organizations.mjs` — 4-tier fuzzy org matching
- `alma-cleanup-cohorts.mjs` — Geography term removal from target_cohort
- `alma-link-evidence-v2.mjs` — Scoring-based evidence-intervention linking
- `alma-extract-outcomes.mjs` — LLM-powered outcome extraction
- `alma-process-queue-v2.mjs` — Discovered link processing (scrape + extract)
- `alma-calculate-scores.mjs` — Portfolio score calculation via RPC
- `alma-enrich-signals.mjs` — LLM enrichment of evidence_level, harm_risk, replication_readiness

### Signal Engine
Automated local news intelligence pipeline:
- **SENTINEL** — scans for youth justice events by postcode/SA3 region
- **COMPOSER** — AI-generated contextual content
- **REVIEW** — admin approval workflow
- **PUBLISH** — widget embedding for community sites
- Routes: `/api/signal-engine/{scan,compose,events,widget}`, `/admin/signal-engine`

### CONTAINED Tour
National youth justice awareness campaign with shipping container exhibition:
- `/contained` — Tour hub with event listings, basecamp stories, nominations, reactions
- `/contained/act` — Campaign action hub (SMS, email, social share templates)
- Nomination system, backer tracking, reaction collection
- GHL (GoHighLevel) CRM integration for campaign contacts

### Empathy Ledger Integration
Bi-directional sync with Empathy Ledger storytelling platform:
- Push-sync: JusticeHub → EL (storyteller profiles, org membership)
- Pull-sync: EL → JusticeHub (stories, partner data)
- Script: `scripts/run-push-sync.mjs`

### AI Infrastructure
Multi-provider LLM rotation for cost-effective AI operations:
- `src/lib/ai/model-router.ts` — `callLLM()` with automatic rotation: Groq (free) → Gemini (free) → MiniMax → DeepSeek → OpenAI → Anthropic
- `src/lib/ai/parse-json.ts` — 7-stage robust JSON parser for LLM responses
- `src/lib/scraping/jina-reader.ts` — Free web scraping via Jina Reader

## Quick Start

```bash
npm install
cp .env.local.example .env.local  # Edit with Supabase credentials
npm run dev                        # Starts on port 3004
```

## Project Structure

```
src/
├── app/
│   ├── intelligence/     # ALMA evidence hub pages
│   ├── contained/        # CONTAINED tour campaign
│   ├── admin/            # Admin dashboards
│   ├── api/              # API routes
│   │   ├── intelligence/ # ALMA REST API
│   │   ├── signal-engine/# Signal Engine pipeline
│   │   ├── ghl/          # GoHighLevel CRM integration
│   │   └── org-hub/      # Organization hub API
│   └── ...
├── components/
│   ├── alma/             # PortfolioScoreCard, SignalGauge, ConsentIndicator
│   ├── contained/        # Tour components (SupportersWall, TourMap)
│   └── ui/               # Shared UI components
├── lib/
│   ├── ai/               # LLM rotation, JSON parsing
│   ├── alma/             # ALMA services (extraction, portfolio, scraping)
│   ├── scraping/         # Web scraping (Jina, Firecrawl)
│   └── supabase/         # Database clients
scripts/                  # Data pipeline and sync scripts
supabase/migrations/      # Database schema migrations
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL) with RLS
- **Auth**: Supabase Auth (email/password + GitHub OAuth)
- **Deployment**: Vercel (auto-deploys on push to main)
- **CRM**: GoHighLevel (GHL) for campaign contacts
- **AI**: Multi-provider rotation (Groq, Gemini, MiniMax, DeepSeek, OpenAI, Anthropic)
- **UI**: Radix UI, Lucide Icons

## 🔑 Environment Variables

Required environment variables (see `.env.local.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=your_long_random_secret
# Optional dedicated secret for System 0 scheduler endpoint
SYSTEM0_CRON_SECRET=your_long_random_secret
```

## 🚢 Deployment

The project auto-deploys to Vercel on push to `main`:

```bash
git push origin main
```

Manual deployment:
```bash
npm run build
npm start
```

## 🤖 System 0 Autopilot

System 0 funding orchestration now uses a shared policy store for scheduler + worker + admin controls.

- Apply migrations:
  - `supabase/migrations/20260227000001_funding_system0_policy.sql`
  - `supabase/migrations/20260227000002_funding_system0_events.sql`
  - `supabase/migrations/20260227000003_funding_system0_filter_presets.sql`
  - `supabase/migrations/20260227000004_funding_system0_filter_presets_visibility.sql`
  - `supabase/migrations/20260227000005_funding_system0_filter_presets_rls.sql`
- Admin policy API: `GET/POST /api/admin/funding/system-0/policy`
- Admin scheduler tick: `POST /api/admin/funding/system-0/scheduler`
- Admin audit feed: `GET /api/admin/funding/system-0/events`
- Admin shared presets API: `GET/POST/DELETE /api/admin/funding/system-0/presets`
  - Presets can now be saved as team-shared or private-to-owner.
  - RLS enforces admin access with private-presets owner scope.
- Cron scheduler: `GET/POST /api/cron/funding/system-0` (requires `SYSTEM0_CRON_SECRET` or `CRON_SECRET`)

## Key Data Metrics (as of March 2026)

| Metric | Count |
|--------|-------|
| Interventions | 1,112 |
| Portfolio Scores | 1,112 (100%) |
| Organizations | 507 (527 linked) |
| Evidence Items | 113 |
| Evidence Links | 242 |
| Outcomes | 841 |
| Outcome Links | 1,189 |
| Interventions with Outcomes | 731 (66%) |

## Scripts

```bash
npm run dev          # Start dev server (port 3004)
npm run build        # Build for production
npx tsc --noEmit     # Type check
```

## Environment Variables

See `.env.local.example`. Key variables:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `GHL_API_KEY`, `GHL_LOCATION_ID` — GoHighLevel CRM
- `GROQ_API_KEY`, `GEMINI_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY` — AI providers
- `FIRECRAWL_API_KEY` — Web scraping (Jina Reader is free fallback)

## Links

- [Production](https://justicehub-act.vercel.app)
- [GitHub](https://github.com/Acurioustractor/justicehub-platform)

---

Built for justice-impacted youth across Australia
