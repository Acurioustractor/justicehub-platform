# Ralph Stories Status

Display current progress of the JusticeHub content pipeline.

## Your Task

1. Read `ralph/stories-prd.json` and calculate:
   - Total tasks
   - Completed tasks (passes: true)
   - Pending tasks (passes: false)
   - Tasks by type (article, brief, social_campaign)
   - Tasks by category (seeds, growth, harvest, roots)

2. Read `ralph/stories-progress.txt` and extract:
   - Last activity timestamp
   - Recent completions (last 5)
   - Key learnings

3. Check `ralph/` directories:
   - Count files in briefs/
   - Count files in drafts/
   - Count files in social/

4. Query `ralph/stories.db` for:
   - Trends count
   - Community signals count
   - Research findings count

## Output Format

```
# Ralph Stories Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Progress
[████████░░░░░░░░] 45% complete (9/20 tasks)

## By Type
- Articles:        5/12 ✓
- Briefs:          3/4  ✓
- Social Campaigns: 1/4  ✓

## By Category
- Seeds 🌱:   2/5
- Growth 🌿:  3/6
- Harvest 🌾: 3/5
- Roots 🌳:   1/4

## Content Generated
- Story Briefs:  8 files
- Draft Articles: 5 files
- Social Posts:   12 files

## Input Data
- Trends:           15 entries
- Community Signals: 8 entries
- Research:         12 entries

## Recent Activity
- 2025-01-07: Completed "Youth Program Launch" article
- 2025-01-06: Completed "Q4 Impact Summary" brief
- 2025-01-05: Generated January social campaign

## Next Up
Priority 1: [task-id] - [title] (type: article, category: growth)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Run `/ralph-stories` to continue content generation
```

If ralph/ directory doesn't exist, prompt user to run `/ralph-stories-init` first.
