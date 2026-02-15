# Ralph JusticeHub Storyteller

Autonomous content creation system for JusticeHub using the Ralph Wiggum methodology.

## Quick Start

```bash
# 1. Initialize a new content project
cd /Users/benknight/Code/JusticeHub
claude /ralph-stories-init

# 2. Run the autonomous content loop
claude /ralph-stories

# 3. Check progress anytime
claude /ralph-stories-status

# 4. Review generated content
claude /ralph-stories-review
```

## How It Works

Ralph operates as an iterative AI loop that:

1. **Reads** the current PRD (Product Requirements Document)
2. **Selects** the highest priority incomplete task
3. **Executes** the task (generate brief, write article, create social posts)
4. **Reviews** the output against brand guidelines
5. **Commits** progress to git
6. **Logs** learnings for future iterations
7. **Repeats** until all tasks complete

### The Ralph Wiggum Pattern

> "Memory persists only through git history and text files. Each iteration is a fresh context window."

This means:
- All state lives in files (PRD, progress log, database)
- Each iteration starts fresh, reading current state
- Progress is committed to git after each task
- Learnings accumulate in text files

## Content Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                     INPUT AGENTS                            │
├─────────────────┬─────────────────┬─────────────────────────┤
│   TrendScout    │  CommunityPulse │    ResearchAgent        │
│   (topics)      │  (signals)      │    (context)            │
└────────┬────────┴────────┬────────┴────────────┬────────────┘
         │                 │                      │
         ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   SQLite Database                           │
│   trends | community_signals | research_findings            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   RALPH STORYTELLER                         │
│                                                             │
│   PRD → Select Task → Execute → Review → Commit → Log       │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Briefs    │   │   Drafts    │   │   Social    │
│ ralph/briefs│   │ralph/drafts │   │ralph/social │
└─────────────┘   └─────────────┘   └─────────────┘
```

## Directory Structure

After initialization:

```
ralph/
├── stories-prd.json       # Content requirements & task list
├── stories-progress.txt   # Progress log & learnings
├── stories.db             # SQLite database
├── briefs/                # Story idea briefs (JSON)
│   ├── seeds-program-launch.json
│   └── harvest-q4-impact.json
├── drafts/                # Article drafts (Markdown + frontmatter)
│   ├── youth-program-launch.md
│   └── 2024-impact-highlights.md
└── social/                # Social media content (JSON)
    └── january-campaign.json
```

## Content Categories

JusticeHub uses a growth metaphor:

| Category | Emoji | Description | Content Focus |
|----------|-------|-------------|---------------|
| Seeds    | 🌱    | New initiatives | Announcements, vision, potential |
| Growth   | 🌿    | Developing programs | Progress, journey, expanding impact |
| Harvest  | 🌾    | Results & outcomes | Impact data, success stories |
| Roots    | 🌳    | Foundational work | History, culture, knowledge |
| Voices   | 🗣️    | Community voices | Empathy Ledger stories (curated only) |

## PRD Format

```json
{
  "project": "JusticeHub Q1 2025 Content",
  "description": "Content pipeline for first quarter",
  "created": "2025-01-07",
  "config": {
    "require_human_review": true,
    "auto_publish": false
  },
  "features": [
    {
      "id": "seeds-mentorship-launch",
      "priority": 1,
      "type": "article",
      "category": "seeds",
      "title": "Youth Mentorship Program Launch",
      "brief": "Announce new mentorship initiative",
      "acceptance_criteria": [
        "800-1200 words",
        "Include program details",
        "Call to action for mentors"
      ],
      "passes": false
    }
  ]
}
```

## Commands Reference

### `/ralph-stories-init`
Initializes a new content project:
- Creates `ralph/` directory structure
- Sets up SQLite database
- Generates starter PRD
- Runs initial trend analysis

### `/ralph-stories`
Runs the autonomous content loop:
- Processes one task per iteration
- Outputs `<promise>ITERATION_DONE</promise>` to continue
- Outputs `<promise>COMPLETE</promise>` when done

### `/ralph-stories-status`
Shows current progress:
- Task completion stats
- Content counts by type
- Recent activity
- Next priority task

### `/ralph-stories-review`
Human review checkpoint:
- Presents pending content
- Allows approve/edit/reject decisions
- Exports approved content for publishing

## Autonomous Operation

For fully autonomous operation without prompts, ensure your `.claude/settings.json` includes:

```json
{
  "allowedTools": [
    "Bash(git add:*)",
    "Bash(git commit:*)",
    "Bash(sqlite3 ralph/*)",
    "Bash(mkdir -p ralph/*)",
    "Write(ralph/*)",
    "Edit(ralph/*)",
    "Read(ralph/*)"
  ]
}
```

## Safety & Governance

### Human Review Required
All content requires human approval before publishing to JusticeHub.

### Cultural Sensitivity
- First Nations content flagged for community review
- Appropriate acknowledgments included
- No appropriation of lived experience

### No Impersonation
- Ralph never writes as community members
- Voices category only curates consented stories
- Clear attribution on all generated content

### Audit Trail
- All content commits to git
- Progress log tracks every iteration
- Database stores full content history

## Integration with JusticeHub

### Publishing Approved Content

After review, export to JusticeHub format:

```javascript
// Approved article → Supabase insert
const article = {
  title: "...",
  slug: "...",
  content: "...",
  excerpt: "...",
  category: "seeds",
  tags: ["youth", "mentorship"],
  status: "draft", // or "published"
  author_id: null, // assign human author
  metadata: {
    generated_by: "ralph-storyteller",
    reviewed_at: "2025-01-07T..."
  }
};

await supabase.from('articles').insert(article);
```

### Brand Alignment
Ralph uses the `justicehub-brand-alignment` skill for:
- Voice and tone consistency
- Terminology guidelines
- Cultural protocol compliance

## Troubleshooting

### Ralph is stuck
Check `ralph/stories-progress.txt` for the last activity. Ralph may be blocked on:
- Missing input data (run input agents)
- Failed quality check (review and adjust brief)
- Permission issue (check settings.json)

### Content quality issues
1. Review learnings in progress log
2. Adjust PRD acceptance criteria
3. Add more specific brief details
4. Run brand alignment check manually

### Database issues
```bash
# Check database exists
ls -la ralph/stories.db

# Query directly
sqlite3 ralph/stories.db "SELECT * FROM content_stats;"

# Reset database (careful!)
rm ralph/stories.db
sqlite3 ralph/stories.db < .claude/skills/ralph-storyteller/scripts/setup-db.sql
```

## Contributing

To extend Ralph Storyteller:

1. **Add new content types**: Update PRD schema and command handlers
2. **Add input agents**: Create new agent templates in `templates/`
3. **Customize brand rules**: Extend `justicehub-brand-alignment` skill
4. **Add platforms**: Extend social content generation for new platforms

---

Built with the Ralph Wiggum methodology. "I'm helping!" 🌱
