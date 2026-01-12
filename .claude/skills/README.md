# JusticeHub Claude Skills

## Available Skills

| Skill | Purpose |
|-------|---------|
| `act-code-reviewer` | Review code against ACT values and cultural protocols |
| `alma-scraper` | Intelligent scraper for Australian youth justice sources |
| `apply-migration` | Apply SQL migrations to Supabase database |
| `justicehub-brand-alignment` | Brand alignment and design system |
| `justicehub-context` | Project context and codebase awareness |
| `justicehub-reviewer` | Platform audit for pages, API routes, Supabase |

## Skill Structure

Each skill follows the claudekit pattern:
- `SKILL.md` - Map file (<100 lines)
- `references/` - Detailed documentation loaded on-demand

## Usage

Skills invoke automatically based on context, or manually:
```
/act-code-reviewer <spec>
/alma-scraper quick
/apply-migration <file.sql>
/justicehub-reviewer pages
```

## Project Context

- **Project**: JusticeHub Platform
- **Location**: `/Users/benknight/Code/JusticeHub`
- **Stack**: Next.js 14, React, TypeScript, Supabase, D3.js
- **Design System**: Brutalist, high-contrast, accessibility-first
