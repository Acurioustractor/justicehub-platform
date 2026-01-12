# JusticeHub

## Overview
Legal advocacy platform for Indigenous communities, integrated with Empathy Ledger.

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

## Skills Available
- Local: 7 project-specific skills in `.claude/skills/local/`
- Global: agent-kanban (Vibe Kanban), act-brand-alignment, act-sprint-workflow
