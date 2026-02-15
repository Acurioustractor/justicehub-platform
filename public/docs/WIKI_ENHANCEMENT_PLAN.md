# Wiki Enhancement Plan: Links & Visual Examples

## Overview

This document identifies opportunities to enhance wiki documentation by:
1. **Adding links to live site pages** - Connect documentation to actual features
2. **Adding screenshots** - Show what features look like
3. **Adding "See it in action" callouts** - Direct readers to try features

---

## Site Page Inventory

### Public Pages
- `/` - Homepage
- `/about` - About JusticeHub
- `/stories` - Story library (public)
- `/stories/[slug]` - Individual story pages
- `/community-programs` - Programs directory (public)
- `/centre-of-excellence` - Centre of Excellence hub
- `/centre-of-excellence/global-insights` - Global insights map
- `/centre-of-excellence/best-practice` - Best practice showcase
- `/centre-of-excellence/research` - Research hub
- `/centre-of-excellence/map` - Interactive map
- `/blog` - Blog/articles
- `/organizations` - Organizations directory
- `/people` - People/profiles directory
- `/services` - Services directory
- `/how-it-works` - Platform guide
- `/contact` - Contact page

### Admin Pages (Login Required)
- `/admin` - Admin dashboard
- `/admin/stories` - Story management
- `/admin/stories/new` - Create new story
- `/admin/blog` - Blog management
- `/admin/blog/new` - Create new blog post
- `/admin/programs` - Program management
- `/admin/profiles` - Profile management
- `/admin/empathy-ledger` - Empathy Ledger sync
- `/admin/auto-linking` - Auto-linking system
- `/admin/organizations` - Organization management
- `/admin/media` - Media library

---

## EXECUTIVE_SUMMARY.md Enhancements

### Current Content → Add Links

**Line 22-28: "Platform Infrastructure"**
```markdown
**Platform Infrastructure (95% Complete)**
- 15 fully functional admin pages → **[View Admin Dashboard](/admin)**
- Sophisticated content management system → **[See Stories CMS](/admin/stories)**
- Relationship mapping → **[View Auto-Linking System](/admin/auto-linking)**
- Empathy Ledger integration → **[View Empathy Ledger](/admin/empathy-ledger)**
- Responsive design → **[Explore the Platform](/)**
```

**Line 30-36: "Content Repository"**
```markdown
**Content Repository**
- 33 profiles → **[Browse Profiles](/people)**
- 38 stories → **[Read Stories](/stories)**
- 454 organizations → **[View Organizations](/organizations)**
- 521 programs → **[Explore Programs](/community-programs)**
```

**Line 38-42: "Empathy Ledger Integration"**
```markdown
> **💡 See It In Action:** Visit the [Empathy Ledger admin page](/admin/empathy-ledger) to see how automatic syncing works.
```

**Line 44-48: "Centre of Excellence Framework"**
```markdown
**Centre of Excellence Framework**
- Interactive global map → **[Explore Global Map](/centre-of-excellence/map)**
- Program database → **[View Programs](/centre-of-excellence/best-practice)**
- Evidence framework → **[Browse Research](/centre-of-excellence/research)**
```

### Suggested Screenshots

1. **Admin Dashboard** - Show 15 admin pages overview
2. **Story Library** - Public stories page with cards
3. **Empathy Ledger Sync** - Admin sync interface
4. **Global Map** - Interactive map with programs
5. **Auto-Linking** - Relationship mapping interface

---

## MINDAROO_STRATEGIC_PITCH.md Enhancements

### Add "Platform Preview" Section

After Executive Summary, add:

```markdown
---

## 🖼️ Platform Preview

> **See the platform in action:** JusticeHub is already operational with real content and features.

**Explore Key Features:**
- **[Story Library](/stories)** - Read community stories and lived experiences
- **[Programs Directory](/community-programs)** - Browse youth justice programs
- **[Centre of Excellence](/centre-of-excellence)** - Global best practices
- **[Interactive Map](/centre-of-excellence/map)** - Programs worldwide
- **[Organizations](/organizations)** - Network of 450+ organizations
- **[People](/people)** - Practitioners and advocates

**For Administrators:**
- **[Content Management](/admin)** - See the admin dashboard
- **[Story Editor](/admin/stories/new)** - Create and publish stories
- **[Auto-Linking](/admin/auto-linking)** - Relationship mapping system

---
```

### In Part 1: Add Live Examples

When discussing features, add callouts:

```markdown
**Our Solution: Community Ownership & Economic Self-Determination**

> **💡 Platform Demo:** See how this works in practice:
> - [Browse community stories](/stories) - Real stories from communities
> - [Explore programs](/community-programs) - Community-led initiatives
> - [View the global map](/centre-of-excellence/map) - International connections
```

### Suggested Screenshots for Strategic Pitch

1. **Homepage hero** - Show professional design
2. **Story page example** - Community storytelling
3. **Program card** - How programs are showcased
4. **Admin dashboard** - Behind-the-scenes CMS
5. **Auto-linking diagram** - Relationship mapping

---

## THREE_SCENARIOS_BUDGET.md Enhancements

### Add Platform Context Section

After Table of Contents, before Executive Summary:

```markdown
---

## 🖼️ What You're Funding

> **This budget funds a working platform, not a concept.** JusticeHub is already operational.

**Explore What's Built:**
- **[Platform Homepage](/)** - See the public interface
- **[Story Library](/stories)** - 38+ published stories
- **[Programs Directory](/community-programs)** - 521 programs catalogued
- **[Centre of Excellence](/centre-of-excellence)** - Research and best practice hub
- **[Admin System](/admin)** - Content management interface

**What's Already Working:**
- ✅ Content management system for stories, programs, people, organizations
- ✅ Automatic relationship mapping between content
- ✅ Empathy Ledger integration syncing community data
- ✅ Global map showing international programs
- ✅ Responsive design working on all devices

**What This Budget Funds:**
- Scaling community engagement (4-10 communities)
- Training Indigenous developers (2-6 people)
- Expanding content library (100+ stories, 50+ programs)
- Building sustainability through revenue streams

---
```

### In Community Payment Model Section

Add live example:

```markdown
### 3️⃣ Content Creation Bounties

**Pay-per-piece for specific deliverables:**

| Content Type | LEAN | BASE | UPPER | What's Included |
|--------------|------|------|-------|-----------------|
| **Video story** | $2,000 | $2,500 | $3,000 | Filming, editing, cultural review, permissions |

> **💡 See Example:** Visit the [Stories page](/stories) to see published stories that communities would be paid to create. Each story includes video/audio, transcript, and cultural context.
```

### Suggested Screenshots for Budget Document

1. **Stories library grid** - Show what $2,500 per video produces
2. **Program profile** - Show what $1,000 per program doc produces
3. **Admin story editor** - Show creation workflow
4. **Global map with pins** - Show international dimension

---

## ADMIN_USER_GUIDE.md Enhancements

### Add Quick Links Section at Top

```markdown
## 📋 Quick Access Links

**Jump directly to admin pages:**
- [Admin Dashboard](/admin) - Overview and statistics
- [Stories Management](/admin/stories) - Create and edit stories
- [Blog Management](/admin/blog) - Publish articles
- [Programs Management](/admin/programs) - Manage program directory
- [Profiles Management](/admin/profiles) - People and organizations
- [Empathy Ledger](/admin/empathy-ledger) - Sync community data
- [Auto-Linking](/admin/auto-linking) - Relationship mapping
- [Media Library](/admin/media) - Images and videos

**Public Pages (Preview):**
- [Stories (Public)](/stories) - See published stories
- [Programs (Public)](/community-programs) - Public programs directory
- [Centre of Excellence](/centre-of-excellence) - Research hub
```

### In Each Section: Add Direct Links

```markdown
### Managing Stories

> **💡 Quick Access:** [Go to Stories Admin →](/admin/stories)

**Creating a New Story:**
1. Visit [/admin/stories/new](/admin/stories/new)
2. Fill in story details
3. Add relationships to people and organizations
4. Publish

> **See Example:** View a [published story](/stories) to see what the end result looks like.
```

### Suggested Screenshots for Admin Guide

1. **Admin dashboard** - Main navigation
2. **Story creation form** - Step-by-step
3. **Auto-linking results** - Before/after
4. **Empathy Ledger sync** - Progress indicator
5. **Published story comparison** - Admin view vs public view

---

## CENTRE_OF_EXCELLENCE_COMPLETE.md Enhancements

### Add Live Feature Links

```markdown
## Centre of Excellence: Complete Implementation

> **💡 Explore Now:** Visit the [Centre of Excellence](/centre-of-excellence) to see all features in action.

**Key Pages:**
- **[Global Insights Map](/centre-of-excellence/map)** - Interactive world map showing programs
- **[Best Practice Showcase](/centre-of-excellence/best-practice)** - Exemplary programs
- **[Research Hub](/centre-of-excellence/research)** - Evidence and synthesis

### Interactive Map

> **[View the Live Map →](/centre-of-excellence/map)**

The interactive map shows:
- International programs across 30+ countries
- Filtering by region, program type, outcomes
- Direct links to program profiles
- Visual clustering of initiatives

**Screenshot suggestion here:** Map with pins and filter interface
```

### Suggested Screenshots

1. **Global map full view** - All programs plotted
2. **Map filtered view** - Showing filter in action
3. **Program detail popup** - On-map information
4. **Best practice cards** - Program showcase grid
5. **Research hub** - Evidence library

---

## Implementation Priority

### Phase 1: Critical Links (Do First)

**EXECUTIVE_SUMMARY.md:**
- ✅ Add links to all mentioned features
- ✅ Add "See It In Action" callouts
- ✅ Screenshot: Admin dashboard

**BUDGET_SUMMARY.md & THREE_SCENARIOS_BUDGET.md:**
- ✅ Add "What You're Funding" section with links
- ✅ Add platform demo callout
- ✅ Screenshot: Stories library showing professional output

**MINDAROO_STRATEGIC_PITCH.md:**
- ✅ Add "Platform Preview" section after Executive Summary
- ✅ Add live examples throughout Part 1
- ✅ Screenshots: Homepage, Story page, Admin dashboard

### Phase 2: User Guides (Do Second)

**ADMIN_USER_GUIDE.md:**
- ✅ Add Quick Access Links section
- ✅ Add direct links in every section
- ✅ Screenshots: Each admin page

**ADMIN_QUICK_START.md:**
- ✅ Add "Try It Now" links for each feature
- ✅ Screenshots: Step-by-step workflows

### Phase 3: Technical Docs (Do Third)

**CENTRE_OF_EXCELLENCE_COMPLETE.md:**
- ✅ Add live feature links
- ✅ Screenshots: Map, programs, research

**EMPATHY_LEDGER_FULL_INTEGRATION.md:**
- ✅ Add link to /admin/empathy-ledger
- ✅ Screenshot: Sync interface

**AUTO_LINKING_COMPLETE.md:**
- ✅ Add link to /admin/auto-linking
- ✅ Screenshots: Auto-linking results

---

## Screenshot Specifications

### Required Screenshots

1. **Homepage (/)**
   - Full viewport showing hero section
   - Shows professional design and navigation
   - Use case: Strategic pitch, budget docs

2. **Stories Library (/stories)**
   - Grid view showing 6-8 story cards
   - Shows content quality and diversity
   - Use case: Budget justification, content examples

3. **Individual Story Page (/stories/[slug])**
   - Full story with video/transcript
   - Shows depth of content
   - Use case: Community payment justification

4. **Admin Dashboard (/admin)**
   - Overview showing all 15 admin sections
   - Shows sophistication of CMS
   - Use case: Platform status, admin guide

5. **Story Creation Form (/admin/stories/new)**
   - Empty form showing all fields
   - Shows creation workflow
   - Use case: Admin guide

6. **Empathy Ledger Sync (/admin/empathy-ledger)**
   - Sync interface with results
   - Shows auto-sync working
   - Use case: Technical docs

7. **Auto-Linking System (/admin/auto-linking)**
   - Relationship mapping results
   - Shows automatic connections
   - Use case: Technical docs

8. **Global Map (/centre-of-excellence/map)**
   - Full map with program pins
   - Shows international dimension
   - Use case: Centre of Excellence docs, strategic pitch

9. **Programs Directory (/community-programs)**
   - Grid showing program cards
   - Shows breadth of content
   - Use case: Platform overview

10. **Organizations Directory (/organizations)**
    - List/grid showing organizations
    - Shows network scale (450+ orgs)
    - Use case: Platform status

### Screenshot Format

- **Size:** 1920x1080 (Full HD) for detail
- **Format:** PNG for clarity
- **Location:** `/public/images/wiki/`
- **Naming:** `screenshot-[page-name].png`
- **Alt text:** Descriptive for accessibility

### Embedding Screenshots in Markdown

```markdown
![Admin Dashboard showing 15 management sections](/images/wiki/screenshot-admin-dashboard.png)

> **💡 See It Live:** Visit the [Admin Dashboard](/admin) to explore all features.
```

---

## Callout Box Format

Use consistent callout format throughout wiki:

### "See It In Action" Callout

```markdown
> **💡 See It In Action:** Visit the [Story Library](/stories) to browse published community stories. Each story includes video/audio, full transcript, and relationship mapping to people and organizations.
```

### "Quick Access" Callout

```markdown
> **🔗 Quick Access:** [Admin Dashboard](/admin) | [Stories](/admin/stories) | [Programs](/admin/programs) | [Empathy Ledger](/admin/empathy-ledger)
```

### "Platform Demo" Callout

```markdown
> **🖼️ Platform Demo:**
> - [Browse Stories](/stories) - See published community content
> - [Explore Programs](/community-programs) - View program directory
> - [Admin System](/admin) - See content management interface
```

---

## Next Steps

1. **Create screenshots** - Take high-quality screenshots of all key pages
2. **Update EXECUTIVE_SUMMARY.md** - Add links and first screenshot
3. **Update THREE_SCENARIOS_BUDGET.md** - Add "What You're Funding" section
4. **Update MINDAROO_STRATEGIC_PITCH.md** - Add "Platform Preview" section
5. **Update admin guides** - Add Quick Access Links sections
6. **Review and test all links** - Ensure all links work correctly

---

**Last updated:** October 2025
