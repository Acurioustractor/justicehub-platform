# AI-Agent Friendly Wiki Design for JusticeHub

**Date**: January 2, 2026
**Purpose**: Structure documentation so AI agents can navigate, understand, and execute tasks autonomously
**Philosophy**: Documentation as **executable knowledge**, not just reference material

---

## The Insight: Documentation for Agents, Not Just Humans

### Traditional Wiki (Human-Centric)
```markdown
# How to Deploy JusticeHub

First, you need to set up your environment...
(500 words of prose)
```

**Problem for AI Agents**:
- Buried context (agents need to read 500 words to find the command)
- No structured metadata (what's the prerequisite? what's the expected outcome?)
- No validation criteria (how does the agent know it succeeded?)

### Actionable Wiki (Agent-Friendly)
```markdown
# Deploy JusticeHub

## Metadata
- **Prerequisites**: Node.js 20+, Supabase CLI, Bitwarden CLI
- **Duration**: 10-15 minutes
- **Success Criteria**: `npm run dev` starts on port 3000

## Quick Command
\`\`\`bash
npm install && npm run dev
\`\`\`

## Validation
\`\`\`bash
curl http://localhost:3000 | grep "JusticeHub"
\`\`\`

## Troubleshooting
[Common errors with fixes]
```

**Why This Works for Agents**:
- Metadata at top (prerequisites, duration, success criteria)
- Quick command (copy-paste ready)
- Validation (agent can self-check)
- Troubleshooting (agent can recover from errors)

---

## Design Principles for Agent-Friendly Docs

### 1. Metadata-First Structure

Every doc starts with machine-readable frontmatter:

```markdown
---
system: alma
type: guide
difficulty: intermediate
prerequisites:
  - Supabase configured
  - ALMA tables exist
  - API keys in .env
duration: 5-10 minutes
success_criteria:
  - ALMA signals visible in dashboard
  - No errors in console
related_systems:
  - empathy-ledger
  - scraper
last_updated: 2026-01-02
---
```

**Why**: Agents can:
- Check prerequisites before starting
- Estimate task duration
- Validate success automatically
- Navigate to related systems

### 2. Action Blocks (Copy-Paste Ready)

Bad ❌:
```markdown
You'll want to run the deployment script, making sure to set your environment variables first.
```

Good ✅:
```markdown
## Deploy

\`\`\`bash
# Set environment
export SUPABASE_URL="your-url"
export SUPABASE_KEY="your-key"

# Deploy
npm run deploy
\`\`\`
```

**Why**: Agents can extract and execute directly.

### 3. Validation Criteria

Every action has a "how to know it worked" section:

```markdown
## Validate Deployment

Expected output:
\`\`\`
✅ Database migrations applied
✅ Edge functions deployed
✅ RLS policies configured
\`\`\`

Check manually:
\`\`\`bash
curl https://your-project.supabase.co/rest/v1/alma_signals
\`\`\`

Expected: HTTP 200, JSON array
```

**Why**: Agents can self-verify without human confirmation.

### 4. Troubleshooting Decision Trees

Bad ❌:
```markdown
If you get an error, check your configuration.
```

Good ✅:
```markdown
## Troubleshooting

### Error: "Database connection failed"

**Check 1**: Is SUPABASE_URL set?
\`\`\`bash
echo $SUPABASE_URL
\`\`\`
Expected: https://[project].supabase.co

**Check 2**: Is the service role key valid?
\`\`\`bash
curl -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" $SUPABASE_URL/rest/v1/
\`\`\`
Expected: HTTP 200

**Fix**: Update .env.local with correct credentials
\`\`\`bash
cp .env.example .env.local
# Edit .env.local with correct values
\`\`\`
```

**Why**: Agents can follow decision trees to self-recover.

---

## File Structure for Agent Navigation

### Before (Human-Centric)
```
/docs/
  ALMA_GUIDE.md (5000 words of prose)
```

### After (Agent-Centric)
```
/docs/systems/alma/
  ├── index.md                # System overview + navigation
  ├── QUICK_START.md          # 5-minute setup
  ├── ARCHITECTURE.md         # How it works
  ├── tasks/
  │   ├── ingest-media.md    # Specific task
  │   ├── query-signals.md   # Specific task
  │   └── dashboard-setup.md # Specific task
  └── reference/
      ├── signals-schema.json # Machine-readable
      ├── api-endpoints.md    # API reference
      └── database-schema.sql # Schema reference
```

**Why**:
- `index.md` = Navigation hub (agent starts here)
- `tasks/` = Discrete, actionable tasks
- `reference/` = Machine-readable schemas and APIs

---

## Task-Based Documentation Pattern

### Template for Agent Tasks

```markdown
# Task: [Action Verb + Object]

## Metadata
---
task_id: alma-ingest-media
system: alma
difficulty: intermediate
estimated_duration: 10 minutes
prerequisites:
  - ALMA tables exist
  - Firecrawl API key configured
  - Media sources configured
success_criteria:
  - Articles ingested
  - Sentiment calculated
  - Signals updated
---

## Quick Start

\`\`\`bash
node scripts/alma-ingest-media.mjs --source guardian
\`\`\`

## Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `--source` | Yes | Media source | `guardian`, `abc`, `nitv` |
| `--days` | No | Days to look back | `7` (default) |
| `--dry-run` | No | Preview only | `true`, `false` (default) |

## Expected Output

\`\`\`json
{
  "articles_found": 15,
  "articles_ingested": 12,
  "sentiment_calculated": 12,
  "signals_updated": 5
}
\`\`\`

## Validation

\`\`\`bash
# Check database
psql -c "SELECT COUNT(*) FROM alma_media_articles WHERE created_at > NOW() - INTERVAL '1 day';"
# Expected: > 0

# Check sentiment
psql -c "SELECT AVG(sentiment_score) FROM alma_media_articles WHERE created_at > NOW() - INTERVAL '1 day';"
# Expected: -1.0 to 1.0
\`\`\`

## Troubleshooting

### No articles found
**Cause**: Media source might have changed URL structure
**Fix**: Check `scripts/lib/media-sources.mjs` for correct selectors

### Sentiment calculation failed
**Cause**: Anthropic API key missing or invalid
**Fix**:
\`\`\`bash
echo $ANTHROPIC_API_KEY
# Should output: sk-ant-...
\`\`\`

## Related Tasks
- [Query ALMA Signals](query-signals.md)
- [Dashboard Setup](dashboard-setup.md)
```

---

## Machine-Readable Schemas

Agents need structured data, not just prose.

### Example: ALMA Signals Schema

**File**: `docs/systems/alma/reference/signals-schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ALMA Signal",
  "type": "object",
  "required": ["signal_type", "value", "timestamp", "source"],
  "properties": {
    "signal_type": {
      "type": "string",
      "enum": [
        "system_pressure",
        "community_capability",
        "intervention_health",
        "trajectory"
      ],
      "description": "ALMA signal family"
    },
    "value": {
      "type": "number",
      "minimum": 0,
      "maximum": 1,
      "description": "Signal strength (0.0-1.0)"
    },
    "direction": {
      "type": "string",
      "enum": ["increasing", "decreasing", "stable"],
      "description": "Trend direction"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "source": {
      "type": "string",
      "description": "Data source (media, research, policy)"
    },
    "metadata": {
      "type": "object",
      "description": "Additional context"
    }
  }
}
```

**Why**: Agents can:
- Validate signal data
- Generate test data
- Build API calls
- Understand data structure without reading prose

---

## Navigation for Agents

### START_HERE.md (Agent Entry Point)

```markdown
# JusticeHub Documentation (AI Agent Edition)

**For AI Agents**: This wiki is structured for autonomous navigation and task execution.

## Agent Navigation Protocol

1. **Identify your goal** → Find relevant system
2. **Read system index.md** → Understand architecture
3. **Choose a task** → Navigate to tasks/
4. **Execute task** → Follow action blocks
5. **Validate** → Run validation commands
6. **Troubleshoot if needed** → Follow decision trees

## Systems Map

| System | Purpose | Entry Point | Common Tasks |
|--------|---------|-------------|--------------|
| [ALMA](systems/alma/index.md) | Ethical intelligence | systems/alma/ | Ingest media, query signals, dashboard |
| [Profiles](systems/profiles/index.md) | Profile management | systems/profiles/ | Link profile, edit profile, flag content |
| [Empathy Ledger](systems/empathy-ledger/index.md) | Story integration | systems/empathy-ledger/ | Sync profiles, fetch stories |
| [Scraper](systems/scraper/index.md) | Data ingestion | systems/scraper/ | Scrape source, automate ingestion |
| [Admin](systems/admin/index.md) | Admin workflows | systems/admin/ | User management, moderation |

## Task Index (Alphabetical)

- [Dashboard Setup](systems/alma/tasks/dashboard-setup.md)
- [Deploy JusticeHub](operations/deployment/deploy.md)
- [Edit Profile](systems/profiles/tasks/edit-profile.md)
- [Ingest Media](systems/alma/tasks/ingest-media.md)
- [Link Profile](systems/profiles/tasks/link-profile.md)
- [Query ALMA Signals](systems/alma/tasks/query-signals.md)
- [Scrape Data Source](systems/scraper/tasks/scrape-source.md)
- [Sync Empathy Ledger Profiles](systems/empathy-ledger/tasks/sync-profiles.md)

## Operations

- [Deployment](operations/deployment/) - Setup, secrets, troubleshooting
- [Automation](operations/automation/) - GitHub Actions, monitoring
- [Development](operations/development/) - Local setup, database

## Strategic

- [Architecture](strategic/reference/ARCHITECTURE_OVERVIEW.md) - System design
- [Roadmap](strategic/ROADMAP.md) - Future plans
- [Plans](strategic/plans/) - Integration plans, expansions
```

---

## Agent Task Execution Pattern

When an AI agent needs to perform a task:

```python
# Pseudocode for agent task execution

1. Navigate to START_HERE.md
2. Identify system (e.g., "ALMA")
3. Read systems/alma/index.md (architecture overview)
4. Choose task: systems/alma/tasks/ingest-media.md
5. Extract metadata:
   - Check prerequisites ✅
   - Estimate duration: 10 minutes ✅
6. Execute action block:
   ```bash
   node scripts/alma-ingest-media.mjs --source guardian
   ```
7. Validate success:
   ```bash
   psql -c "SELECT COUNT(*) FROM alma_media_articles..."
   # Expected: > 0 ✅
   ```
8. If validation fails → Navigate to troubleshooting section
9. Report success or escalate to human
```

---

## Benefits for Agentic Work

### For ACT Farmhand Agents

**SyncAgent** can:
1. Navigate to `systems/empathy-ledger/tasks/sync-profiles.md`
2. Check prerequisites (Supabase configured ✅)
3. Execute sync command
4. Validate sync (check database)
5. Report status

**ALMAAgent** can:
1. Navigate to `systems/alma/tasks/ingest-media.md`
2. Extract parameters (--source, --days)
3. Run ingestion
4. Validate signals updated
5. Calculate portfolio signals

**GrantAgent** can:
1. Navigate to `strategic/plans/`
2. Read machine-readable grant criteria (JSON schema)
3. Match JusticeHub capabilities
4. Generate application draft
5. Validate alignment

### For Claude Code (This Session)

When you ask: "Set up ALMA dashboard"

**Agent workflow**:
1. Read `docs/START_HERE.md`
2. Navigate to `systems/alma/tasks/dashboard-setup.md`
3. Extract action blocks
4. Execute setup commands
5. Validate with provided tests
6. Report completion

**Without agent-friendly docs**: Agent would need to read 5000-word guide, extract relevant commands manually, guess validation criteria.

---

## Implementation Plan

### Phase 1: Convert Existing Docs (This Week)

1. **Add metadata frontmatter** to all system docs
2. **Extract action blocks** into discrete tasks
3. **Add validation criteria** to each task
4. **Create index.md** for each system

### Phase 2: Task Decomposition (Next Week)

1. **Break down large guides** into task-based docs
2. **Create tasks/** folders** for each system
3. **Add troubleshooting decision trees**
4. **Create machine-readable schemas** (JSON)

### Phase 3: Agent Integration (Week 3)

1. **Test with ACT Farmhand agents**
2. **Add agent execution logs** (what worked, what didn't)
3. **Iterate on task clarity**
4. **Create agent SDK** for JusticeHub tasks

---

## Example: ALMA System (Agent-Friendly)

```
systems/alma/
├── index.md                      # System overview + agent navigation
├── ARCHITECTURE.md               # How ALMA works (for understanding)
├── tasks/
│   ├── ingest-media.md          # Task: Ingest media articles
│   ├── calculate-signals.md     # Task: Calculate ALMA signals
│   ├── query-signals.md         # Task: Query signal data
│   ├── dashboard-setup.md       # Task: Set up ALMA dashboard
│   └── export-report.md         # Task: Export ALMA report
├── reference/
│   ├── signals-schema.json      # Machine-readable signal schema
│   ├── api-endpoints.md         # API reference
│   ├── database-schema.sql      # Database schema
│   └── media-sources.json       # Configured media sources
└── troubleshooting/
    ├── no-articles-found.md     # Common error: No articles
    ├── sentiment-failed.md      # Common error: Sentiment calc
    └── signals-not-updating.md  # Common error: Signals stale
```

**Agent Navigation**:
1. Start: `systems/alma/index.md`
2. Task: `tasks/ingest-media.md`
3. Validate: `reference/signals-schema.json`
4. Troubleshoot: `troubleshooting/no-articles-found.md`

---

## Success Metrics

**For Agents**:
- Can navigate from START_HERE.md to specific task in <5 steps
- Can execute task without human intervention
- Can self-validate success (automated checks)
- Can recover from errors (troubleshooting trees)

**For Humans**:
- Quick command reference (copy-paste ready)
- Clear prerequisites and success criteria
- Troubleshooting decision trees
- Metadata-first structure (skim-friendly)

---

## Next Steps

1. ✅ Radical simplification complete (360 → 80 files)
2. **Add metadata frontmatter** to all docs
3. **Create task-based structure** for each system
4. **Extract action blocks** and validation criteria
5. **Build agent SDK** for JusticeHub operations
6. **Test with ACT Farmhand agents**

---

*"Documentation is not just reference material. It's executable knowledge for both humans and AI agents."*

*Philosophy: Metadata-first, action-focused, validation-ready, agent-navigable*
