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

## Page Review (agent-browser)

Review pages visually and test accessibility using agent-browser:

```bash
# Review a page
agent-browser open http://localhost:3000/community-map
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
