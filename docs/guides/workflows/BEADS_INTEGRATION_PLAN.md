# BEADS Integration Plan for JusticeHub & Empathy Ledger

## Overview

[BEADS](https://github.com/steveyegge/beads) is a task management system designed specifically for AI coding agents. Combined with [beads_viewer](https://github.com/Dicklesworthstone/beads_viewer), it provides:

- **Graph-based task tracking** with explicit dependencies
- **AI-native workflows** - agents can read/write tasks directly
- **Git-backed storage** - distributed, version-controlled
- **Dependency visualization** with PageRank, critical path analysis
- **Terminal UI** for human oversight via beads_viewer

This replaces TaskMaster AI and provides a more sophisticated dependency-aware task system.

---

## Why BEADS for JusticeHub?

| Feature | TaskMaster | BEADS |
|---------|------------|-------|
| Dependency tracking | Limited | Full DAG with 9 metrics |
| AI agent integration | Good | Native - designed for agents |
| Visualization | Markdown files | Terminal UI + Mermaid diagrams |
| Git integration | Manual | Automatic with merge driver |
| Parallel work detection | Manual | Automatic `bd ready` command |
| Critical path analysis | None | Built-in PageRank, betweenness |

---

## Installation Steps

### 1. Install BEADS CLI

```bash
# macOS/Linux (recommended)
curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash

# Or via npm
npm install -g @beads/bd

# Or via Homebrew
brew tap steveyegge/beads
brew install bd

# Verify installation
bd --version
```

### 2. Install beads_viewer (bv)

```bash
# Via Go
go install github.com/Dicklesworthstone/beads_viewer/cmd/bv@latest

# Or download binary from releases:
# https://github.com/Dicklesworthstone/beads_viewer/releases
```

### 3. Initialize BEADS in JusticeHub

```bash
cd /Users/benknight/Code/JusticeHub

# Initialize beads database
bd init

# This creates:
# - .beads/beads.jsonl (task database)
# - .beads/config.toml (configuration)
# - Git merge driver for JSONL files
```

### 4. Configure Claude Code Integration

Update `CLAUDE.md` to include BEADS instructions:

```markdown
## Task Management with BEADS

This project uses BEADS for task management. Before starting work:

1. Run `bd onboard` to see current project state
2. Run `bd ready` to find tasks with no blockers
3. When creating tasks, use `bd create "Task title" --priority 1`
4. Link dependencies with `bd dep add <task-id> <blocker-id> --type blocks`
5. Update status with `bd update <task-id> --status in_progress`
6. Close completed work with `bd close <task-id> --reason "Implemented"`

### Key Commands
- `bd ready` - Show tasks ready to work on
- `bd list` - All tasks
- `bd show <id>` - Task details
- `bd dep tree <id>` - Dependency visualization
- `bv` - Launch terminal UI (beads_viewer)
```

---

## Project Structure

### BEADS Directory
```
JusticeHub/
├── .beads/
│   ├── beads.jsonl          # Main task database (git-tracked)
│   ├── config.toml          # BEADS configuration
│   └── cache.db             # Local SQLite cache (gitignored)
├── CLAUDE.md                # Updated with BEADS instructions
└── ...
```

### Task Categories for JusticeHub

Organize tasks with labels:

```bash
# Platform Core
bd create "Fix authentication flow" --label platform --priority 1

# Empathy Ledger
bd create "Implement storyteller profiles" --label empathy-ledger --priority 2

# Content
bd create "Publish Aunty Corrine story" --label content --priority 1

# Infrastructure
bd create "Set up CI/CD pipeline" --label infra --priority 3
```

---

## Workflow Integration

### Daily Development Flow

```bash
# 1. Start of session - see what's ready
bd ready

# 2. Pick a task and start work
bd update TASK-123 --status in_progress

# 3. If you discover new work
bd create "New task discovered" --discovered-from TASK-123

# 4. When blocked by another task
bd dep add TASK-123 TASK-456 --type blocks

# 5. Complete task
bd close TASK-123 --reason "Implemented in commit abc123"

# 6. Sync changes (auto-commits to git)
bd sync
```

### Using beads_viewer (bv)

```bash
# Launch terminal UI
bv

# Keyboard shortcuts:
# j/k - Navigate up/down
# Enter - View task details
# g - Graph view (dependencies)
# i - Insights panel
# k - Kanban board
# / - Search
# q - Quit
```

### AI Agent Flags (for Claude Code)

```bash
# Get structured insights for AI processing
bv --robot-insights    # Graph metrics as JSON
bv --robot-plan        # Execution plan with parallel tracks
bv --robot-priority    # Priority recommendations
bv --robot-diff HEAD~5 # Changes since 5 commits ago
```

---

## Migration from TaskMaster

### 1. Export TaskMaster Tasks

```bash
# If using TaskMaster, export current state
task-master list --json > taskmaster-export.json
```

### 2. Import into BEADS

Create a migration script:

```bash
#!/bin/bash
# migrate-taskmaster-to-beads.sh

# Read TaskMaster export and create BEADS tasks
cat taskmaster-export.json | jq -r '.tasks[] | "\(.title)|\(.status)|\(.priority)"' | while IFS='|' read title status priority; do
  bd create "$title" --priority "$priority" --status "$status"
done
```

### 3. Map Dependencies

```bash
# For each task with dependencies in TaskMaster
bd dep add <new-task-id> <blocking-task-id> --type blocks
```

---

## Empathy Ledger Specific Tasks

### Initial Task Structure

```bash
# Core Platform
bd create "Empathy Ledger multi-tenant architecture" --label empathy-ledger --priority 0
bd create "Story ownership and consent framework" --label empathy-ledger --priority 1
bd create "Cultural protocols integration" --label empathy-ledger --priority 1

# Storyteller Features
bd create "Storyteller profile management" --label empathy-ledger --priority 2
bd create "Story submission workflow" --label empathy-ledger --priority 2
bd create "Media upload and processing" --label empathy-ledger --priority 2

# Integration
bd create "JusticeHub <-> Empathy Ledger sync" --label integration --priority 1
bd create "Public story display on JusticeHub" --label integration --priority 2
```

### Dependency Graph

```
Empathy Ledger Architecture (CRITICAL)
    └── blocks → Story Ownership Framework
        └── blocks → Storyteller Profiles
            └── blocks → Story Submission Workflow
                └── blocks → Media Upload
    └── blocks → Cultural Protocols
        └── blocks → Elder Approval System
```

---

## Configuration

### .beads/config.toml

```toml
[project]
name = "JusticeHub"
description = "Youth Justice storytelling platform"

[labels]
platform = { color = "blue", description = "Core platform features" }
empathy-ledger = { color = "purple", description = "Empathy Ledger module" }
content = { color = "green", description = "Content and stories" }
infra = { color = "orange", description = "Infrastructure and DevOps" }
prf = { color = "yellow", description = "PRF Fellowship work" }

[priorities]
# 0 = Critical, 1 = High, 2 = Medium, 3 = Low, 4 = Backlog
default = 2

[git]
auto_sync = true
commit_message_prefix = "beads:"
```

### .gitignore Addition

```gitignore
# BEADS local cache
.beads/cache.db
.beads/*.db-*
```

---

## Benefits for JusticeHub

1. **Better Planning**: Graph analysis identifies critical path and bottlenecks
2. **AI-Native**: Claude Code can directly manage tasks without parsing markdown
3. **Dependency Awareness**: Never miss blockers or parallel opportunities
4. **Visual Oversight**: beads_viewer TUI for human review
5. **Git Integration**: Tasks version-controlled with code
6. **Distributed**: Works offline, syncs via git

---

## Next Steps

1. [ ] Install `bd` CLI
2. [ ] Install `bv` (beads_viewer)
3. [ ] Run `bd init` in JusticeHub
4. [ ] Update CLAUDE.md with BEADS instructions
5. [ ] Create initial task structure for Empathy Ledger
6. [ ] Migrate any existing TaskMaster tasks
7. [ ] Configure git hooks for auto-sync

---

## Resources

- [BEADS GitHub](https://github.com/steveyegge/beads) - Main repository
- [beads_viewer GitHub](https://github.com/Dicklesworthstone/beads_viewer) - Terminal UI
- [Steve Yegge on BEADS](https://x.com/Steve_Yegge/status/1977645937225822664) - Author's intro
- [AI Tinkerers Interview](https://one-shot.aitinkerers.org/p/steve-yegge-on-agentic-coding-beads-and-the-future-of-ai-workflows) - Deep dive
