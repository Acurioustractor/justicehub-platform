# JusticeHub

## Overview
Legal advocacy platform for Indigenous communities, integrated with Empathy Ledger.

## Working Style
- DO NOT enter extended planning mode unless explicitly asked. Default to implementation.
- If a plan is truly needed, keep it to <20 lines and confirm before proceeding.
- Max 2-3 features per session. Ship each one before starting the next.
- Do NOT jump ahead to executing, finalizing, or exiting plan mode without explicit user approval.
- When a fix doesn't work after 2 attempts with the same approach, STOP and reassess the root cause. State your new hypothesis before trying again.

## Brand Guide (LOCKED — Non-Negotiable)

**THE CONTAINED uses a strict brand system. Every design decision must comply.**

- **Visual brand guide (HTML):** `output/campaign-hub/index.html` — open this to see colors, assets, typography visually
- **Brand guide (markdown):** `compendium/brand-guide.md` — full rules, asset inventory, language rules
- **Brand assets:** `public/images/contained/` — logos, posters, stat tiles, bespoke graphics

### Photography Rule (ZERO EXCEPTIONS)
**REAL PHOTOS ONLY** for people, places, and programs. No AI-generated photorealistic images. Ever.

**Approved for AI generation:** Illustrations, campaign posters, graphic designs, data visualisations, stat tiles, logo assets.

**FLAGGED — DO NOT USE (AI-photorealistic):**
- `bespoke-story-container.png`
- `bespoke-two-realities.png`
- `hero-container-landscape.png`

**REMOVED — DO NOT USE:**
- `bespoke-community-connection.png`
- `bespoke-reach.png`

### Colors (use ONLY these)
| Role | Hex | Usage |
|------|-----|-------|
| Primary Black | `#0A0A0A` | Body text, headings, primary backgrounds |
| Off-White | `#F5F0E8` | Page backgrounds, card surfaces (NOT pure white) |
| Urgent Red | `#DC2626` | CTAs and critical data ONLY. Never decorative. |
| Emerald | `#059669` | Success metrics, positive outcomes |

### Typography
- **Display:** Space Grotesk Bold 700, tight tracking
- **Data/Labels:** IBM Plex Mono Regular/Medium

### Before ANY /contained UI work
1. Open `output/campaign-hub/index.html` to review the brand system
2. Cross-check every image against the approved/flagged lists above
3. Use brand colors only — no `bg-white`, no `bg-black`, no `#000000`

## Server & Port Management
- NEVER start a dev server unless explicitly asked.
- Before starting any server, check if a process is already running: `lsof -i :3004`
- NEVER run `next build` in dev environment — it corrupts the dev cache.
- Kill any server you start when done; do not leave orphan processes.

## Database Operations
- **Supabase project:** `tednluwflfhxyucgwigh` (shared with GrantScope)
- Before writing ANY migration, query, or seed script, run:
  ```sql
  SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '<table>' ORDER BY ordinal_position
  ```
- **Known column gotchas** (verified 2026-03-14):
  - `organizations.state` (NOT `location_state`)
  - `organizations.is_indigenous_org` (NOT `is_indigenous`)
  - `justice_funding.amount_dollars` (NOT `amount`)
  - `organizations` has NO `source` column
  - `acnc_charities` has NO `email` column
  - `oric_corporations` has NO `town_city` column (use `state` + `postcode`)
- **Partial unique index on justice_funding**: `idx_justice_funding_source_dedup` is `WHERE source_statement_id IS NOT NULL` — Supabase `.upsert()` FAILS on this. Use select-then-insert pattern instead.
- All inserts to constrained tables MUST use `.upsert()` or `ON CONFLICT`:
  - `alma_evidence` — unique on `source_url`
  - `alma_interventions` — unique on `lower(name) + lower(coalesce(operating_organization, ''))`
- If Supabase MCP fails after 2 attempts, fall back to `psql` directly.
- All LLM outputs MUST be validated with Zod schemas from `src/lib/ai/llm-schemas.ts` before DB writes.

## Batch & Long-Running Operations
- Test with a small sample (5-10 items) first to catch constraint errors.
- Add error handling that skips failures rather than crashing the whole batch.
- Never re-run a long process without first fixing the error that caused the previous failure.

## ALMA Data Rules
- All queries MUST filter `.neq('verification_status', 'ai_generated')` — 279 rejected records exist.
- Name+ABN matching required for org linking (ABN-only creates wrong links).
- Run tests: `npx jest src/__tests__/lib/ --no-coverage`

## Local Development
- Dev server: **port 3004** (`npm run dev`)
- Type-check: `npm run type-check` (ignore database.types.ts errors)

## Vibe Kanban (Task Orchestration)

For parallel agent execution and multi-task development:

```bash
# Launch Vibe Kanban
npx vibe-kanban
```

**Features:**
- Run multiple Claude Code agents in parallel
- Git worktree isolation per task
- Built-in code review before merge
- Real-time agent monitoring

**When to use:** Multi-step features, parallel development, large refactors
**Full docs:** [.claude/skills/global/agent-kanban/skill.md](.claude/skills/global/agent-kanban/skill.md)

## Page Review (agent-browser)

Review pages visually and test accessibility using agent-browser:

```bash
# Review a page
agent-browser open http://localhost:3004/community-map
agent-browser snapshot -i -c   # Get interactive elements
agent-browser screenshot --full review.png
agent-browser errors           # Check console errors
agent-browser close
```

**Skill**: `/review-pages` - Full page review workflow
**Agent**: `.claude/agents/page-reviewer.md` - Automated page testing

## Skills Available
- Local: 8 project-specific skills in `.claude/skills/local/`
- Global: agent-kanban (Vibe Kanban), act-brand-alignment, act-sprint-workflow
