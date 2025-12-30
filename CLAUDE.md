# JusticeHub - Claude Code Integration Guide

JusticeHub is a Youth Justice storytelling platform integrating with Empathy Ledger for story syndication.

---

## Task Management with BEADS

This project uses [BEADS](https://github.com/steveyegge/beads) for AI-native task management with dependency tracking.

### Essential Commands

```bash
# Daily Workflow
bd ready                              # Show tasks with no blockers (start here!)
bd list                               # All tasks with status
bd show <id>                          # Task details (e.g., bd show JusticeHub-c7m)

# Working on Tasks
bd update <id> --status in_progress   # Start working
bd comment <id> "notes..."            # Add implementation notes
bd close <id> --reason "done"         # Complete task

# Creating Tasks
bd create "Task title" --priority 1   # Create new task (P0=critical, P1=high, P2=medium)
bd create "Task" --label empathy-ledger --priority 1

# Dependencies
bd dep add <id> <blocker> --type blocks   # Link dependency
bd dep tree <id>                          # Visualize dependencies
bd blocked                                # Show blocked tasks

# Terminal UI
~/go/bin/bv                           # Launch beads_viewer TUI
```

### Task Database

- `.beads/issues.jsonl` - Task database (git-tracked)
- `.beads/metadata.json` - Project metadata
- Tasks are automatically synced with git

### Current Empathy Ledger Tasks

```
bd ready    # See what's available to work on
bd blocked  # See dependency chain
```

---

## Empathy Ledger Integration

JusticeHub integrates with Empathy Ledger as a **story consumer**. Stories are managed and approved in Empathy Ledger, then syndicated to JusticeHub via Supabase.

### Architecture

- **Source of Truth**: Empathy Ledger (stories, consent, approvals)
- **Access Method**: Shared Supabase database with RLS policies
- **Consent Model**: Storytellers approve sharing per-app in Empathy Ledger

### Environment Variables

```env
# Empathy Ledger Integration (set in .env.local)
EMPATHY_LEDGER_URL=https://yvnuayzslukamizrlhwb.supabase.co
EMPATHY_LEDGER_ANON_KEY=your_anon_key
EMPATHY_LEDGER_SERVICE_KEY=your_service_key  # For admin operations
```

### Database Access

JusticeHub accesses stories through the `syndicated_stories` view:

```typescript
// src/lib/supabase/empathy-ledger.ts
import { empathyLedgerClient } from '@/lib/supabase'

// Fetch stories syndicated to JusticeHub
const { data: stories } = await empathyLedgerClient
  .from('syndicated_stories')
  .select('*')
  .eq('story_type', 'testimony')
  .limit(10)
```

### Story Types Available

- `testimony` - Personal testimonies for legal advocacy
- `case_study` - Case studies and legal precedents
- `advocacy` - Advocacy stories and campaigns

### Required Attribution

All stories from Empathy Ledger must include:

1. **Source attribution**: "Story shared via Empathy Ledger"
2. **Consent notice**: "Shared with storyteller consent"
3. **Cultural protocols**: Display any cultural restrictions
4. **Link back**: Optional link to full story in Empathy Ledger

### Consent Flow

1. Storyteller creates story in **Empathy Ledger**
2. Storyteller goes to **Sharing Settings** in Empathy Ledger
3. Storyteller enables **JusticeHub** and sets preferences
4. Story appears in JusticeHub's `syndicated_stories` view
5. JusticeHub displays story with proper attribution
6. All access is logged for storyteller to review

---

## Project Structure

```
JusticeHub/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   └── lib/
│       ├── supabase/           # Supabase clients
│       │   ├── client.ts       # Browser client
│       │   ├── server.ts       # Server client
│       │   ├── empathy-ledger.ts  # Empathy Ledger client
│       │   └── index.ts        # Unified exports
│       └── env.ts              # Zod environment validation
├── .beads/                     # BEADS task database
├── docs/                       # Documentation
│   ├── architecture/           # System design docs
│   ├── guides/                 # How-to guides
│   └── specs/                  # Feature specifications
├── .env                        # Safe defaults (committed)
├── .env.local                  # Real credentials (gitignored)
└── CLAUDE.md                   # This file
```

---

## Supabase Configuration

### Two Supabase Projects

1. **JusticeHub Main** (`tednluwflfhxyucgwigh`)
   - User accounts, platform data
   - Variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

2. **Empathy Ledger** (`yvnuayzslukamizrlhwb`)
   - Stories, consent, syndication
   - Variables: `EMPATHY_LEDGER_URL`, `EMPATHY_LEDGER_ANON_KEY`

### Client Usage

```typescript
// Browser components ('use client')
import { createBrowserClient } from '@/lib/supabase'

// Server components/API routes
import { createServerClient, createAdminClient } from '@/lib/supabase'

// Empathy Ledger (always server-side)
import { empathyLedgerClient } from '@/lib/supabase'
```

---

## Development Commands

```bash
# Start development server
npm run dev                    # Runs on PORT from .env (default 3003)

# Build & lint
npm run build
npm run lint

# Task management
bd ready                       # What to work on
bd list                        # All tasks
```

## Git Workflow

```bash
# Reference tasks in commits
git commit -m "feat: implement story syndication (JusticeHub-kib)"

# Create PR for completed task
gh pr create --title "feat: Story ownership framework" --body "Implements consent flow as specified in JusticeHub-kib"
```

---

## Claude Code Best Practices

### Context Management

- Use `/clear` between different tasks to maintain focus
- This CLAUDE.md file is automatically loaded for context
- Use `bd show <id>` to pull specific task context when needed

### Iterative Implementation

1. `bd ready` - Find available task
2. `bd show <id>` - Understand requirements
3. `bd update <id> --status in_progress` - Start work
4. `bd comment <id> "implementation plan..."` - Log plan
5. Implement code
6. `bd comment <id> "completed: what worked"` - Log progress
7. `bd close <id> --reason "done"` - Complete task

---

_JusticeHub - Youth Justice storytelling platform with Empathy Ledger integration._
