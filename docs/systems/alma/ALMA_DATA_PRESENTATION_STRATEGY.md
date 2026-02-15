# ALMA Data Presentation Strategy

## Current State: Data is Hidden

### What We Have in ALMA Database:
1. **37 Media Articles** with:
   - Sentiment scores
   - Topics/tags
   - Source metadata
   - Key quotes
   - Publication dates
   - Article URLs

2. **24 Community Programs** with:
   - Program names
   - Locations/states
   - Intervention types
   - Outcome data (reoffending rates, completion rates)
   - Budget/cost data
   - Community control indicators

3. **Daily Sentiment Tracking** with:
   - 30 days of sentiment data
   - Positive/negative/neutral counts
   - Source-by-source breakdowns

4. **Topic Analysis** with:
   - Trending topics
   - Sentiment by topic
   - Topic clustering

### Current Problem:
- Data exists but is locked away in `/stories/intelligence` page
- High-level summary stats on `/intelligence` page but no drill-down
- No way to explore individual articles
- No way to browse programs by state/type
- Source links not easily accessible
- Can't see the connections between articles, programs, and outcomes

---

## Strategy: Make Data Explorable & Connected

### 1. Media Intelligence Studio Enhancements

**Current**: List of articles with sentiment scores
**Needs**: Interactive exploration with source access

#### Article Cards Should Include:
- **Direct link to source article** (opens in new tab)
- **Visual sentiment indicator** (green positive, red negative, gray neutral)
- **Clickable topics** that filter to show related articles
- **Date timeline** showing when coverage happened
- **Quote highlights** that are visually distinct

#### New Interactive Elements:
```
┌─────────────────────────────────────┐
│ Article Card                        │
│ ─────────────────────────────────   │
│ 📰 The Guardian • Mar 15, 2024      │
│ ──────────────────────────────────  │
│ "Community programs reduce          │
│  reoffending by 60%"               │
│                                     │
│ 😊 Positive (0.72)    🔗 Read Full │
│                                     │
│ [Cultural programs] [Community-led] │
│ [Reoffending] [Indigenous justice]  │
│                                     │
│ 💬 "When young people connect      │
│    with culture, healing happens"  │
│    - Aunty Margaret Wilson         │
│                                     │
│ → Related Programs: BackTrack      │
│ → Related Articles: 3 similar      │
└─────────────────────────────────────┘
```

#### Add Filter Bar:
- Filter by sentiment (positive/negative/neutral)
- Filter by date range
- Filter by source (The Guardian, ABC, etc.)
- Filter by topic
- Search box for keyword search

---

### 2. Intervention Database Enhancements

**Current**: Exists but minimal/hidden
**Needs**: Rich, filterable program browser

#### Program Card Template:
```
┌────────────────────────────────────────┐
│ BackTrack Youth Works                  │
│ ────────────────────────────────────── │
│ 📍 Armidale, NSW                       │
│ 🌱 Indigenous-led • Cultural immersion │
│                                        │
│ OUTCOMES:                              │
│ ✅ 60% reduction in reoffending       │
│ ✅ 95% program completion              │
│ ✅ 40 youth engaged annually           │
│                                        │
│ 💰 Cost: $12K per participant          │
│    (Detention: $350K per year)         │
│                                        │
│ EVIDENCE:                              │
│ → 5 research studies                   │
│ → 8 media articles                     │
│ → Community validation                 │
│                                        │
│ [View Full Profile] [See Evidence]    │
└────────────────────────────────────────┘
```

#### Interactive Map View:
- Australia map with program locations
- Click state to filter programs
- Cluster markers showing program density
- Popup showing quick stats

#### Filters Needed:
- By state (dropdown or map)
- By intervention type (cultural, sports, mentorship, etc.)
- By community control level (Indigenous-led, community-based, etc.)
- By outcome type (reoffending, education, employment)
- Sort by effectiveness, cost, participants

---

### 3. Portfolio Analytics Page

**Current**: Basic stats
**Needs**: Visual comparison tool

#### Comparison Views:

**Cost vs. Effectiveness Chart:**
```
High Effectiveness │         🌱 Cultural Camps
                  │      🌱 BackTrack
                  │   🌱 Community Justice
                  │
Low Effectiveness  │                      🏛️ Detention
                   ─────────────────────────────
                   Low Cost          High Cost
```

**By State Dashboard:**
```
┌─────────────────────────────────────────┐
│ Queensland: 39 Programs                 │
│ ───────────────────────────────────     │
│ Community-led: 28 (72%)                 │
│ Avg Reoffending Reduction: 55%          │
│ Total Youth Engaged: 1,200/year         │
│                                         │
│ Top Programs:                           │
│ 1. Logan Youth Collective (68% success) │
│ 2. Murri Watch (62% success)            │
│ 3. Cultural Healing Circles (60%)       │
└─────────────────────────────────────────┘
```

**Outcome Types:**
- Reoffending rates (scatter plot)
- Program completion rates (bar chart)
- Cost per participant (bubble chart sized by participants)
- Community control correlation (shows Indigenous-led programs perform better)

---

### 4. The Pattern Story Enhancements

**Current**: Minimal text placeholders
**Needs**: Rich data-driven content

#### Section 4: Data Comparison
Should show:
- **Side-by-side cards**: Detention vs. Community Programs
- **Real numbers**: $350K/year detention vs $12K/year cultural programs
- **Outcome comparison**: 84.5% reoffend (detention) vs 15% reoffend (community)
- **Visual bar charts** showing the gap

#### Section 5: Media Sentiment
Should show:
- **3-4 example headlines** with sentiment scores
- **Mini timeline** showing sentiment improving over time
- **Quote carousel** with positive coverage examples
- **Source logos** (The Guardian, ABC, etc.)

#### Section 6: Pattern Reveal
Should show:
- **Key stat grid**:
  ```
  ┌─────────┬─────────┬─────────┐
  │ 24      │ 60%     │ 72%     │
  │ Programs│ Reduction│ Community│
  │         │ Reoffend │ Led     │
  └─────────┴─────────┴─────────┘
  ```
- **Connection visual**: "When communities lead, outcomes improve"
- **Evidence counter**: "Based on 37 articles, 24 programs, 30 days tracking"

---

### 5. New Page: Evidence Explorer

**URL**: `/intelligence/evidence`

**Purpose**: Let users explore all evidence in one place

#### Layout:
```
┌────────────────────────────────────────┐
│ EVIDENCE EXPLORER                      │
│ ──────────────────────────────────     │
│ Search: [_________________] 🔍         │
│                                        │
│ Filter by: [All Types ▼] [All States] │
│           [2024 ▼]                     │
│                                        │
│ Results (142):                         │
│ ──────────────────────────────────     │
│ 📄 Research Study                      │
│ "Cultural immersion reduces            │
│  reoffending by 40-60%"                │
│ University of Sydney • 2023            │
│ → Cited by 12 articles                 │
│                                        │
│ 📰 Media Article                       │
│ "BackTrack program saves $340K         │
│  per youth"                            │
│ The Guardian • March 2024              │
│ → Links to 2 programs                  │
│                                        │
│ 🌱 Program Profile                     │
│ Logan Youth Collective                 │
│ → 68% reduction in reoffending         │
│ → Supported by 5 studies               │
└────────────────────────────────────────┘
```

#### Show Connections:
- Articles that cite research
- Research that validates programs
- Programs mentioned in articles
- Cross-references between everything

---

### 6. Individual Article Pages

**URL Pattern**: `/intelligence/articles/[article-id]`

**Content**:
- Full article metadata
- Sentiment analysis breakdown
- All topics/tags
- Full text of key quotes
- **Direct link to source** (prominent CTA)
- Related articles
- Related programs mentioned
- Share buttons

---

### 7. Individual Program Pages

**URL Pattern**: `/intelligence/programs/[program-id]`

**Content**:
- Full program details
- Outcome data with sources
- Cost/budget transparency
- Community control indicators
- **Evidence section**:
  - Research studies about this program
  - Media coverage of this program
  - Community testimonials
- Contact/website info
- How to support

---

## Implementation Priority

### Phase 1: Make Existing Data Accessible (Week 1)
1. ✅ Remove pricing section from Intelligence Hub
2. Add source links to all articles in Media Intelligence Studio
3. Make topics clickable filters
4. Add "Read Full Article" CTA to each article card
5. Add basic filtering (sentiment, date, source)

### Phase 2: Individual Pages (Week 2)
1. Create article detail pages (`/intelligence/articles/[id]`)
2. Create program detail pages (`/intelligence/programs/[id]`)
3. Add "Related" sections showing connections

### Phase 3: Enhanced Browsing (Week 3)
1. Build filterable intervention database page
2. Add map view for programs
3. Create comparison tools on portfolio analytics
4. Add search functionality

### Phase 4: Evidence Explorer (Week 4)
1. Create unified evidence search page
2. Build connection graph showing relationships
3. Add citation tracking
4. Add source validation indicators

---

## Data Access Patterns

### Current Flow (Bad):
```
User → Intelligence Hub → See stats → Dead end
```

### New Flow (Good):
```
User → Intelligence Hub → See stats →
  ↓
  Choose exploration path:
  ├─→ Media Studio → Article → Source + Related Programs
  ├─→ Intervention DB → Program → Evidence + Outcomes
  ├─→ Portfolio Analytics → Comparison → Individual Programs
  └─→ Pattern Story → Data Journey → Evidence Links
```

### Every Data Point Should Link:
- Article → Source URL (external)
- Article → Related Programs (internal)
- Article → Related Articles (internal)
- Program → Evidence Articles (internal)
- Program → Research Studies (internal/external)
- Topic → All Articles with Topic (internal)
- State → All Programs in State (internal)

---

## Visual Design Principles

### Make Data Tangible:
- Use **big numbers** in brutalist cards
- Show **comparisons** side-by-side
- Use **green** for positive outcomes, **red** for negative
- Make **CTAs clear**: "Read Full Article", "See Evidence", "Browse Programs"

### Make Sources Accessible:
- **Every article** should have visible source link
- **Every statistic** should have citation
- **Every claim** should link to evidence
- Use external link icon (🔗) consistently

### Make Navigation Obvious:
- Breadcrumbs on all pages
- "Back to..." links
- "Related..." sections
- Clear next steps at page bottom

---

## Success Metrics

### User Can Answer:
- ✅ What articles support community-led programs?
- ✅ Which programs have the best outcomes?
- ✅ What's the cost comparison between detention and community programs?
- ✅ Where can I read the source article?
- ✅ Which programs operate in my state?
- ✅ What evidence exists for this intervention type?

### Technical Metrics:
- Average clicks to reach source: < 2
- % of pages with external links visible: 100%
- % of data points with citations: 100%
- Time to find specific program: < 30 seconds

---

## Content Additions Needed

### For Pattern Story Sections:
1. **Section 4 (Data Comparison)**: Need actual comparison data
2. **Section 5 (Media Sentiment)**: Need 3-4 example headlines
3. **Section 6 (Pattern Reveal)**: Need key stat grid
4. **Section 7 (CTA)**: Already good, maybe add preview stats

### For Media Intelligence Studio:
1. Ensure all articles have `article_url` field
2. Add "Read Full Article" button to each card
3. Make topics clickable
4. Add filtering UI

### For Intervention Database:
1. Create program detail pages
2. Add outcome data to each program
3. Link to supporting evidence
4. Add map view

---

## Next Steps

**Immediate (This Session)**:
1. ✅ Remove pricing section
2. Add prominent source links to Media Intelligence Studio
3. Make article topics clickable
4. Update Pattern Story with actual data in sections 4-6

**This Week**:
1. Create individual article pages
2. Create individual program pages
3. Add filtering to Media Intelligence Studio
4. Build intervention database browser

**This Month**:
1. Create Evidence Explorer page
2. Add map view for programs
3. Build comparison tools
4. Add search functionality

The goal: **Every data point is explorable, every claim is sourced, every connection is visible.**
