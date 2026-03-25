---
planStatus:
  planId: plan-admin-comms-hub
  title: "/admin/comms — Single Campaign Command Centre"
  status: ready-for-development
  planType: feature
  priority: critical
  owner: benknight
  tags:
    - contained
    - campaign
    - comms
    - consolidation
  created: "2026-03-23"
  updated: "2026-03-23T08:35:00.000Z"
  progress: 0
---

# /admin/comms — Single Campaign Command Centre

## Problem
Campaign management is scattered across 5+ pages, an HTML file, Notion, and GHL. Nobody can actually use this day-to-day. Need ONE React page at `/admin/comms` that consolidates everything.

## Goals
- One URL to run CONTAINED comms daily
- See pipeline, write content, manage people, track money
- Brand rules visible while writing (not a separate tab)
- LinkedIn-only distribution (no IG/FB/Bluesky)
- Works on desktop, functional on mobile

## Architecture

**Single page, tabbed sections.** Each section is a client component loaded on demand.

```
src/app/admin/comms/
├── page.tsx              (~100 lines — layout + tab nav)
├── pipeline.tsx          (~200 lines — Notion posts table)
├── calendar.tsx          (~150 lines — week view)
├── people.tsx            (~200 lines — from campaign-engine)
├── budget.tsx            (~150 lines — tour costs + funding)
├── compose.tsx           (~250 lines — write + photo picker + schedule)
└── brand-sidebar.tsx     (~100 lines — always-visible brand rules)
```

## Data Sources (all existing — no new APIs needed)

| Section | Source | API |
|---------|--------|-----|
| Pipeline | Notion ACT Comms Dashboard | `/api/notion/query` proxy (new, thin) |
| Calendar | Same Notion DB, filtered by date | Same proxy |
| People | `campaign_alignment_entities` table | `/api/admin/campaign-alignment/*` (exists) |
| Budget | `justice_funding` + hardcoded tour budget | `/api/campaign/stats` (exists) |
| Compose | Notion create page + EL v2 photos | Notion API + `/api/empathy-ledger/media` (exists) |
| Brand | Static data (colors, fonts, stats, rules) | None — hardcoded like HTML hub |

## Section Details

### 1. Pipeline (default tab)
- Table of all Notion posts: title, status badge, target accounts, sent date, image thumb
- Filter: status (Draft/Scheduled/Published/Idea), has-image
- Click row → expand inline to edit key message, change status
- Status change → PATCH Notion directly (same pattern as dashboard tab)
- Summary bar: Draft count, Scheduled count, Published count, Missing Image count

### 2. Calendar
- 2-week rolling view (Mon–Sun grid)
- Posts placed by Sent Date
- Drag to reschedule (updates Notion date) — stretch goal, not MVP
- Today highlighted, overdue posts flagged red

### 3. People
- Pull from campaign-engine: allies, funders, decision-makers, warm intros
- Show: name, org, score, outreach status, last contact
- Quick actions: advance status, add note, copy email
- Counts by category at top
- Reuse existing `/api/admin/campaign-alignment/lists` endpoint

### 4. Budget
- Tour stop costs (hardcoded for now): venue, transport, materials, accommodation
- Total campaign budget vs spent
- Funding received (from `justice_funding` where relevant)
- Simple table, not a dashboard — just the numbers

### 5. Compose
- Write LinkedIn post (long-form textarea)
- Pick photo from EL library (grid picker, same as HTML hub photo library)
- Pick stat from stats library (same STATS array)
- Set target: LinkedIn (Personal) — locked, no other options
- Set sent date
- Preview card (LinkedIn-style)
- "Save to Notion" button → creates page in ACT Comms Dashboard

### 6. Brand Sidebar (always visible)
- Collapsible right panel, 280px wide
- Colors (4 swatches, click to copy hex)
- Typography rules (3 lines)
- Language do/don't (condensed)
- Key stats (top 6, click to insert into compose)
- Photography rule (red warning: REAL PHOTOS ONLY)

## New API Route Needed

One thin proxy for Notion (avoids CORS from client-side):

```
src/app/api/admin/comms/notion/route.ts
```

- GET: query Notion DB, return posts
- PATCH: update page status/date/image
- POST: create new page
- Uses `JUSTICEHUB_NOTION_TOKEN`
- DB ID: `7005d0d1-41d3-436c-9f86-526d275c2f10`

## What NOT to Build
- No GHL integration on this page (cron handles publishing)
- No AI rewriting (use the HTML hub AI Studio for that)
- No email automation controls (GHL handles that)
- No Bluesky/Twitter/Instagram/Facebook — LinkedIn only

## Acceptance Criteria
- [ ] Single page at `/admin/comms` loads with all 5 tabs + brand sidebar
- [ ] Pipeline shows all Notion posts with correct status/image/targets
- [ ] Can change post status from the page (updates Notion)
- [ ] Calendar shows 2-week view with posts on correct dates
- [ ] People tab shows campaign entities with scores and outreach status
- [ ] Compose creates a new Notion page with content + image + date
- [ ] Brand sidebar shows colors, typography, stats, photography rule
- [ ] Page uses CONTAINED brand: Space Grotesk, IBM Plex Mono, #0A0A0A/#F5F0E8/#DC2626/#059669
- [ ] No references to Instagram, Facebook, Bluesky, or Twitter anywhere
