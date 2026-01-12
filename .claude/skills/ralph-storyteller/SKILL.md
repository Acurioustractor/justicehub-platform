# Ralph JusticeHub Storyteller

Autonomous content creation system for JusticeHub stories using the Ralph Wiggum methodology.

## Overview

This skill implements an iterative AI content pipeline that generates story ideas, drafts articles, and creates social content for JusticeHub's unified story feed. It follows the "Ralph Wiggum pattern" - autonomous loops with git-based persistence.

## Content Pipeline

```
Input Agents                    Ralph Storyteller              Output
─────────────────────          ─────────────────────          ─────────────────────
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│  TrendScout     │───────────▶│                 │───────────▶│  Story Ideas    │
│  (ACT topics)   │            │                 │            │  (briefs/)      │
└─────────────────┘            │                 │            └─────────────────┘
                               │                 │
┌─────────────────┐            │  Ralph          │            ┌─────────────────┐
│  CommunityPulse │───────────▶│  Storyteller    │───────────▶│  Draft Articles │
│  (stories DB)   │            │                 │            │  (drafts/)      │
└─────────────────┘            │                 │            └─────────────────┘
                               │                 │
┌─────────────────┐            │                 │            ┌─────────────────┐
│  ResearchAgent  │───────────▶│                 │───────────▶│  Social Content │
│  (web sources)  │            └─────────────────┘            │  (social/)      │
└─────────────────┘                                           └─────────────────┘
```

## Story Categories

JusticeHub uses a growth metaphor for content organization:

- **Seeds** 🌱 - New initiatives, early ideas, announcements
- **Growth** 🌿 - Developing programs, progress updates, expanding impact
- **Harvest** 🌾 - Results, outcomes, success stories, impact data
- **Roots** 🌳 - Foundational work, histories, cultural knowledge
- **Voices** 🗣️ - Community voices (from Empathy Ledger integration)

## Commands

### `/ralph-stories-init`
Initialize a new content project. Creates:
- `ralph/stories-prd.json` - Content production requirements
- `ralph/stories-progress.txt` - Progress log
- `ralph/stories.db` - SQLite database for content pipeline

### `/ralph-stories`
Launch the autonomous storytelling loop. Ralph will:
1. Read current PRD and identify highest priority incomplete task
2. Gather context from input agents
3. Generate content (ideas, drafts, or social snippets)
4. Self-review against JusticeHub brand guidelines
5. Commit progress to git
6. Log learnings and continue

### `/ralph-stories-status`
Check current progress, pending tasks, and content statistics.

### `/ralph-stories-review`
Human review checkpoint. Presents generated content for approval before publishing.

## Content Types

### Story Ideas (briefs/)
```json
{
  "id": "brief-001",
  "title": "Youth Voices in Justice Reform",
  "category": "seeds",
  "angle": "First-person perspectives from program participants",
  "sources": ["program_data", "community_interviews"],
  "target_length": "800-1200 words",
  "key_themes": ["youth empowerment", "systemic change", "lived experience"],
  "suggested_interviewees": ["Program participant", "Youth worker"],
  "status": "approved"
}
```

### Draft Articles (drafts/)
Full article drafts with metadata ready for human review and Supabase upload.

### Social Content (social/)
```json
{
  "story_id": "article-123",
  "platform": "linkedin",
  "content": "Quote or summary text...",
  "hashtags": ["#JusticeReform", "#ACT", "#CommunityVoices"],
  "image_suggestion": "Featured image from article",
  "scheduled_date": "2025-01-15"
}
```

## Database Schema

```sql
-- Input tables (populated by agents)
CREATE TABLE trends (
  id INTEGER PRIMARY KEY,
  topic TEXT,
  relevance_score REAL,
  source TEXT,
  captured_at DATETIME,
  notes TEXT
);

CREATE TABLE community_signals (
  id INTEGER PRIMARY KEY,
  signal_type TEXT, -- 'story_gap', 'trending_topic', 'community_request'
  description TEXT,
  category TEXT, -- seeds, growth, harvest, roots
  priority INTEGER,
  source TEXT,
  captured_at DATETIME
);

CREATE TABLE research_findings (
  id INTEGER PRIMARY KEY,
  topic TEXT,
  summary TEXT,
  sources TEXT, -- JSON array of URLs
  relevance TEXT,
  captured_at DATETIME
);

-- Output tables (generated by Ralph)
CREATE TABLE story_briefs (
  id INTEGER PRIMARY KEY,
  title TEXT,
  category TEXT,
  brief_json TEXT,
  status TEXT, -- draft, reviewed, approved, rejected
  created_at DATETIME,
  reviewed_at DATETIME
);

CREATE TABLE article_drafts (
  id INTEGER PRIMARY KEY,
  brief_id INTEGER,
  title TEXT,
  slug TEXT,
  content TEXT,
  excerpt TEXT,
  category TEXT,
  tags TEXT, -- JSON array
  status TEXT, -- draft, review, approved, published
  created_at DATETIME,
  FOREIGN KEY (brief_id) REFERENCES story_briefs(id)
);

CREATE TABLE social_content (
  id INTEGER PRIMARY KEY,
  article_id INTEGER,
  platform TEXT,
  content TEXT,
  hashtags TEXT,
  status TEXT,
  scheduled_for DATETIME,
  created_at DATETIME,
  FOREIGN KEY (article_id) REFERENCES article_drafts(id)
);

-- Learning & progress
CREATE TABLE learnings (
  id INTEGER PRIMARY KEY,
  iteration INTEGER,
  task_type TEXT,
  learning TEXT,
  created_at DATETIME
);
```

## Integration with JusticeHub

### Publishing Flow
1. Ralph generates draft → `article_drafts` table
2. Human reviews via `/ralph-stories-review`
3. Approved content exports to JusticeHub format
4. Upload script inserts into Supabase `articles` or `blog_posts` table

### Empathy Ledger Respect
- Ralph NEVER generates content that mimics Empathy Ledger voices
- Voices category content is ONLY curated from existing consented stories
- All generated content clearly attributed to JusticeHub editorial

### Brand Alignment
Ralph uses the `justicehub-brand-alignment` skill for:
- Tone and voice consistency
- Terminology guidelines
- Cultural sensitivity review
- First Nations acknowledgment protocols

## Configuration

```json
{
  "content_focus": ["justice_reform", "community_programs", "youth_empowerment"],
  "target_audience": "community_members, stakeholders, funders",
  "publishing_cadence": "2-3 articles per week",
  "social_platforms": ["linkedin", "twitter", "facebook"],
  "auto_publish": false,
  "require_human_review": true
}
```

## Example PRD

```json
{
  "project": "JusticeHub Q1 2025 Content",
  "description": "Content pipeline for first quarter storytelling",
  "features": [
    {
      "id": "seeds-youth-program",
      "priority": 1,
      "type": "article",
      "category": "seeds",
      "title": "New Youth Mentorship Program Launch",
      "brief": "Announce the new mentorship initiative partnering with local schools",
      "passes": false
    },
    {
      "id": "harvest-2024-impact",
      "priority": 2,
      "type": "article",
      "category": "harvest",
      "title": "2024 Impact Report Highlights",
      "brief": "Summarize key achievements from annual impact data",
      "passes": false
    },
    {
      "id": "social-campaign-jan",
      "priority": 3,
      "type": "social_campaign",
      "title": "January Social Media Content",
      "brief": "Create 8 social posts from recent articles",
      "passes": false
    }
  ]
}
```

## Usage

```bash
# Initialize new content project
claude /ralph-stories-init

# Start autonomous content generation
claude /ralph-stories

# Check progress
claude /ralph-stories-status

# Review generated content
claude /ralph-stories-review
```

## Safety & Governance

- **Human-in-the-loop**: All content requires human approval before publishing
- **Cultural review**: First Nations content flagged for community review
- **No impersonation**: Ralph never writes as if from community members
- **Transparent attribution**: All AI-generated content clearly marked
- **Git history**: Full audit trail of all generated content
