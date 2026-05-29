# Codex handoff — JusticeHub civic intelligence + Adelaide kiosk

> **For Codex / future coding agents.** This is a self-contained brief. You do not need to read prior conversations.

## What this repo is

JusticeHub: a Next.js 14 (App Router) site documenting youth-justice (YJ) data in Australia. The frontend serves three audiences from one codebase:
- **Public**: anyone reading about YJ in Australia
- **Kiosk**: a touchscreen surface for the Adelaide exhibition (`/kiosk/*`)
- **Admin**: data operators (`/admin/*`)

Backed by Supabase Postgres (`tednluwflfhxyucgwigh`) with ~30 civic-intelligence tables.

## Read these files before doing any work

1. **`CLAUDE.md`** at repo root — project rules, brand voice, database gotchas, port conventions
2. **`compendium/brand-guide.md`** — visual brand (colors, type, photography rules)
3. **`thoughts/shared/handoffs/2026-05-23-civic-intelligence-session.md`** — previous session's notes (route inventory, env vars, what's running, known gaps)

## What's running autonomously

5 Vercel crons fire daily/weekly. They are armed (env vars set on production):

| Cron | Schedule | Purpose |
|---|---|---|
| `/api/cron/civic/yj-classifier?batch=500` | 16:00 UTC daily | Classify foundation grants as YJ-relevant via Gemini |
| `/api/cron/data-sufficiency/agent?batch=5` | 17:00 UTC daily | Web-search for sources to close open gap questions |
| `/api/cron/data-sufficiency/refresh` | Mon 14:00 UTC | Recount row counts on tracked sources |
| `/api/cron/data-sufficiency/freshness` | Mon 15:00 UTC | File OPEN gap questions for stale sources |
| `/api/cron/data-sufficiency/health-probe` | 1st of month 13:00 UTC | HEAD-check every source URL |

Env vars set on Vercel production: `GEMINI_API_KEY`, `SERPER_API_KEY`, `CRON_SECRET`. Missing: `KIOSK_CONTROL_PIN` (needed only for `/admin/kiosk/control`).

## Core data model (high-impact tables)

### Civic intelligence backbone
- `civic_intelligence_claims` (88 rows) — every public claim with citation. Snapshot via `scripts/civic/snapshot-civic-claims.mjs`
- `civic_claim_evidence` — one row per evidence source per claim
- `v_claim_evidence_summary` — triangulation tier per claim (triangulated / corroborated / single_source / no_evidence)

### Data sufficiency layer (the "do we have enough" loop)
- `data_sources_inventory` (62 rows) — every dataset tracked, with status active/planned/paused/discontinued
- `data_gap_questions` (63 rows) — open questions about what's still missing, status open → investigating → sourced → closed/wontfix
- `data_agent_findings` (109 rows) — agent-proposed candidate sources awaiting review
- `civic_metric_snapshots` — weekly snapshots of key counts (16 baseline rows)

### People backbone (new — Apr 2026)
- `people` (83 rows) — canonical named individuals (commissioners, ministers, MPs, leaders, elders)
- `person_role_holdings` (125 rows) — one row per role per period; can FK to `organizations`
- `v_person_360` — view joining a person to all their roles + linked org ids

### Money / outcomes (schema only — ingestion TBD)
- `acnc_ais_line_items` — empty; ready for revenue/expense/outcome extraction from ACNC AIS

### Entity backbone
- `organizations` (104,416 rows) — universal ABN-keyed registry. 1,604 `acco_certified`, 99 confirmed Tier 1
- `v_entity_360` — view joining org to ACNC/ORIC/ATO/NDIS/funding via ABN

### Foundation grants
- `foundation_grantees` (5,918 rows) — YJ classifier at 46% coverage; advances ~500/night
- Use `yj_relevant`, `yj_category`, `yj_confidence` fields

## Conventions you MUST follow

### Brand (locked, non-negotiable)
- Colors: `#0A0A0A` (black), `#F5F0E8` (off-white), `#DC2626` (urgent red CTAs only), `#059669` (positive emerald). Plus stone/emerald/rose/purple/amber for category accents.
- Fonts: Space Grotesk (display), IBM Plex Mono (data/labels)
- **NEVER use AI-generated photorealistic images** for people, places, programs. Illustrations / posters / data-viz OK.

### Voice / copy
- No em-dashes
- No AI vocab (delve / crucial / pivotal / seamless / robust / comprehensive / nuanced / "not just X but Y")
- Names over abstractions (Kristy, Oonchiumpa, Mparntwe — not "the leadership team")

### Database
- Before writing any migration or query, run `SELECT column_name FROM information_schema.columns WHERE table_name = 'X'` to verify columns. Schema sometimes uses unexpected names (e.g. `acnc_charities` has `name` not `legal_name`).
- All ALMA queries must filter `.neq('verification_status', 'ai_generated')` — 279 rejected rows exist
- `justice_funding`: partial unique index breaks `.upsert()` — use select-then-insert
- For other `.upsert()` constraint issues, use the pre-check-then-insert pattern (see `src/app/api/cron/data-sufficiency/agent/route.ts`)

### Action tiers (workflow rules)
- Tier 1 (just do it): Read, Edit, Write, local Bash, type-check, local git commits
- Tier 2 (post a one-line "about to do X" first): `git push`, env var changes, Notion edits to outbound pages, Vercel env changes
- Tier 3 (require explicit verb in user's message): merge PR, force-push, delete branches, send messages, run DB migrations on production, deploy edge functions
- Tier 4 (refuse even with confirmation): drop tables, delete user data, force-push to main

### Dev server
- **DO NOT start a dev server unless explicitly asked**
- If asked, port 3014 (`npm run dev -p 3014`), check `lsof -i :3014` first
- **NEVER run `next build` in dev** — corrupts cache

## What's pending / what to pick up

### Priority 1 — verify production
1. Check the latest deployment at https://vercel.com/benjamin-knights-projects/justicehub succeeded. If failing, read build logs via `vercel inspect <url> --logs`.
2. Open `https://justicehub.com.au/admin/data-sufficiency/findings` and review 2 pending findings.
3. Confirm nightly crons fired by checking `data_agent_findings` for entries with `created_at > now() - interval '24 hours'`.

### Priority 2 — clean up auto-accepted noise
About 5–10 of the 52 bulk-accepted findings in `data_sources_inventory` are noisier than ideal (one ABC News article, one ResearchGate paper). Spot-check `SELECT * FROM data_sources_inventory WHERE coverage_note LIKE 'Auto-promoted%' ORDER BY created_at DESC` and reject / mark duplicate as appropriate.

### Priority 3 — ingestion scripts for the new planned sources
21 sources in `data_sources_inventory` with `status='planned'` need ingestion scripts to bring them to `status='active'`. Highest leverage:
- Paul Ramsay Foundation annual reviews → PDF parse → `foundation_grantees`
- Minderoo Foundation grants → web scrape
- State budget papers (NSW/VIC/WA/SA/TAS/ACT/NT) → PDF parse → `justice_funding` line items
- NIAA IAS grants register → cross-reference with `grant_opportunities`
- Disability Royal Commission YJ progress report → `oversight_recommendations`

Pattern to follow: `scripts/civic/ingest-auditors-general.mjs` (sitemap scrape + LLM extraction + idempotent insert). Standalone Node script + cron route.

### Priority 4 — backfill people from existing tables
83 people in `people` so far — auto-seeded from `civic_hansard.speaker_name` (≥2 mentions), `civic_ministerial_diaries.minister_name`, `civic_charter_commitments.minister_name + premier_name`, plus manual seeds for state Children's Commissioners.

Next pass: extract people from `acnc_charities.responsible_persons` (board members per registered charity). Sample:
```sql
SELECT abn, name, responsible_persons FROM acnc_charities 
WHERE abn IN (SELECT abn FROM organizations WHERE acco_certified=true LIMIT 5);
```

That gives board members for every ACCO charity — directly populates the foundation-board-graph story we're trying to tell.

### Priority 5 — ACNC AIS line items extraction
`acnc_ais_line_items` table exists, empty. ACNC publishes AIS XBRL data per charity per year. Script needed:
1. For each ABN in `organizations` that's ACNC-registered
2. Pull the latest AIS XBRL/JSON
3. Extract revenue / expense / outcome line items
4. Insert one row per (abn, report_year, line_type, category)

This is the "money → outcomes" linkage. Once populated, you can join to `foundation_grantees.grantee_abn` and answer "what did Org B do with the $X it received."

### Priority 6 — temporal snapshot cron
`civic_metric_snapshots` has 16 baseline rows (`snapshot_date = 2026-05-23`). Need a weekly cron that takes a new snapshot. Reuse the SQL from migration `20260523_people_backbone.sql` (the INSERT block). Pattern: `/api/cron/data-sufficiency/snapshot` route + Vercel cron entry.

## How to test locally

```bash
# Type-check
npx tsc --noEmit

# Run kiosk surfaces (port 3014)
npm run dev -p 3014
# then open http://localhost:3014/kiosk

# Run a script
node scripts/civic/run-data-agent.mjs --batch 5
node scripts/civic/classify-foundation-grants-yj.mjs --apply --yes-production --batch 100
node scripts/civic/run-data-digest.mjs --hours 24

# Apply a migration locally (requires supabase CLI link)
# OR via MCP: mcp__claude_ai_Supabase__apply_migration

# Run tests
npx jest src/__tests__/lib/ --no-coverage
```

## Key file paths

- Cron routes: `src/app/api/cron/civic/*` and `src/app/api/cron/data-sufficiency/*`
- Public civic surfaces: `src/app/intelligence/civic/**`
- Kiosk: `src/app/kiosk/**`
- Admin: `src/app/admin/**`
- Standalone scripts: `scripts/civic/*.mjs`
- Migrations: `supabase/migrations/`
- Shared types: `src/lib/civic-intelligence/citation-format.ts`

## When you finish work

1. Run `npx tsc --noEmit` and confirm no new errors in files you touched
2. `git commit` with a descriptive message ending with `Co-Authored-By: Codex <noreply@openai.com>` (or your own attribution)
3. `git push origin main` (Tier 2 — ask before doing this in auto-mode)
4. Write a session-end handoff to `thoughts/shared/handoffs/YYYY-MM-DD-codex-<topic>.md` summarizing what shipped and what's open

## Final reminders
- The data is real and gets shown publicly on the kiosk and at `https://justicehub.com.au`. Triangulation matters. When in doubt, mark a claim as "investigating" not "sourced."
- Aboriginal Community Controlled Organisations (ACCOs) are a strict category — the authoritative test is registration with ORIC. The `acco_certified` boolean reflects that. `is_indigenous_org` is a heuristic and weaker.
- The kiosk goes on a touchscreen in Adelaide. SA orgs surface first across all lenses.
