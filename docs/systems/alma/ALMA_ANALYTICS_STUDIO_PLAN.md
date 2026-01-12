# 🎯 ALMA Analytics & Visualization Studio

**Vision**: Transform ALMA's intelligence into actionable insights through world-class analytics and real-time media sentiment tracking.

---

## Phase 1: Analytics Dashboard (Week 1)

### Core Features

#### 1. **Pattern Detection Dashboard**
**What**: Real-time visualization of ALMA's pattern detection

**Components**:
- **Geographic Heat Map**: Where interventions are happening
  - Color-coded by Community Authority score (30% weight)
  - Cluster by state/jurisdiction
  - Filter by consent level (Community Controlled vs Public Knowledge Commons)

- **Intervention Type Breakdown**:
  - Pie chart: Prevention (32), Diversion (18), Therapeutic (12), etc.
  - Trend line: How types are changing over time
  - Highlight Cultural Connection programs (9 currently)

- **5-Signal Framework Radar Chart**:
  - Evidence Strength (25%)
  - Community Authority (30%) ← Highest priority
  - Harm Risk Inverted (20%)
  - Implementation Capability (15%)
  - Option Value (10%)
  - Compare multiple interventions side-by-side

#### 2. **Community Authority Tracker**
**What**: Monitor Indigenous-led programs and cultural authority

**Components**:
- **Community Controlled Programs**: Count (currently 24/121)
- **Cultural Authority %**: Currently 100% of Community Controlled have flag
- **Time Series**: Growth of Community Controlled interventions
- **Sacred Boundaries Monitor**:
  - ✅ Ethics checks passed
  - ❌ Requests blocked (individual profiling, org ranking)
  - Consent ledger audit trail

#### 3. **Evidence Quality Matrix**
**What**: Track research quality and evidence levels

**Components**:
- **Evidence Level Distribution**:
  - Strong Evidence
  - Promising Practice
  - Emerging Practice
  - Experimental
- **Publication Timeline**: When evidence was published
- **Research Institutions**: Who's doing the research
- **Cross-Reference**: Link interventions to evidence records

---

## Phase 2: Media Sentiment Tracker (Week 2)

### Real-Time Media Monitoring

#### 1. **Sentiment Analysis Pipeline**
**What**: Track media coverage sentiment vs government program rollouts

**Architecture**:
```
Daily Media Ingestion (Guardian, ABC)
    ↓
Claude Sentiment Extraction (positive/negative/neutral)
    ↓
Time-Series Database (track over time)
    ↓
Correlation Engine (match to government announcements)
    ↓
Live Dashboard (see trends)
```

#### 2. **Sentiment Dashboard Components**

**A. Media Sentiment Timeline**
- Line chart showing sentiment over time
- Color-coded: Green (positive), Red (negative), Gray (neutral)
- Overlay government program announcements
- Highlight Royal Commission reports

**B. Topic Detection**
- What topics are being discussed?
  - Youth detention conditions
  - Bail reform
  - Recidivism rates
  - Cultural programs
  - Community-led alternatives
- Track topic frequency over time

**C. Government Program Correlation**
- **X-axis**: Government program rollout dates
- **Y-axis**: Media sentiment score
- **Pattern**: Does sentiment improve after program launch?
- **Lag Analysis**: How long until sentiment shifts?

**D. Alert System**
- 🚨 Sentiment drops below threshold
- 📈 Unusual spike in coverage (good or bad)
- 🔔 New Royal Commission announcement
- ⚡ Breaking news detected

#### 3. **Sentiment Scoring Algorithm**

```javascript
// Extract from Claude
{
  headline: "QLD launches new cultural healing program",
  sentiment: "positive",
  confidence: 0.85,
  topics: ["cultural programs", "diversion"],
  mentions: {
    government: ["QLD Youth Justice"],
    programs: ["Cultural Healing Initiative"],
    community: ["Indigenous Elders Council"]
  }
}

// Calculate aggregate sentiment score
sentimentScore = (positive - negative) / total
// Range: -1.0 (all negative) to +1.0 (all positive)
```

---

## Phase 3: Inquiry & Report Tracker (Week 3)

### Government Inquiry Intelligence

#### 1. **Inquiry Timeline**
**What**: Visual timeline of all inquiries, royal commissions, and reports

**Components**:
- **Timeline View**: Horizontal timeline showing all inquiries
- **Status Tracking**:
  - 🔵 Active inquiry
  - 🟢 Report released
  - 🟡 Recommendations pending
  - 🔴 No government response
- **Recommendation Tracker**:
  - How many recommendations?
  - How many implemented?
  - How many ignored?

#### 2. **Recommendation Impact Tracker**
**What**: Did recommendations lead to real interventions?

**Example**:
```
Royal Commission (NT) Recommendation #47:
"Increase cultural programming in detention"

↓ Implementation Status:
✅ QLD: Cultural Healing Program launched (2024)
⏸️  NSW: Pilot program announced (pending)
❌ VIC: No action taken

↓ Media Sentiment:
📈 Positive coverage: +0.6 score
🎯 Evidence: 3 new Cultural Connection programs added to JusticeHub
```

---

## Phase 4: Predictive Intelligence (Week 4)

### ALMA-Powered Insights

#### 1. **Pattern Prediction**
**What**: Use ALMA to predict emerging trends

**Capabilities**:
- "Knowledge Extraction Attempt" pattern detected → Alert
- Rising community authority programs → Highlight
- Evidence gaps identified → Recommend research
- Policy contradictions detected → Flag for review

#### 2. **Intervention Recommendation Engine**
**What**: "Programs like this one have shown success in similar contexts"

**Example**:
```
User views: "QLD Diversion Program"

ALMA suggests:
- NSW Children's Court Diversion (similar model, 0.76 signal score)
- VIC Family Group Conferencing (Community Controlled, 0.82 score)
- SA Aboriginal Justice Programs (highest cultural authority)

Reasoning:
"These interventions have similar Evidence Strength (0.65)
and higher Community Authority (0.80 vs 0.60)"
```

---

## Technical Architecture

### Frontend Stack

**Framework**: Next.js 14 (already using)
**Charting**: Recharts or D3.js for advanced visualizations
**Real-time**: Socket.io or Server-Sent Events for live updates
**State Management**: React Query for data fetching
**Styling**: Tailwind CSS (already configured)

### Backend Services

**Analytics API**:
```typescript
// New API routes
/api/analytics/patterns          // Pattern detection data
/api/analytics/sentiment          // Media sentiment time-series
/api/analytics/inquiries          // Inquiry tracker
/api/analytics/signals            // 5-Signal framework data
/api/analytics/recommendations    // ALMA recommendations
```

**Database Views**:
```sql
-- Create materialized views for fast analytics
CREATE MATERIALIZED VIEW intervention_analytics AS
SELECT
  i.jurisdiction,
  i.type,
  i.consent_level,
  i.cultural_authority,
  COUNT(*) as total,
  AVG(ps.evidence_strength) as avg_evidence,
  AVG(ps.community_authority) as avg_community_authority,
  AVG(ps.portfolio_score) as avg_portfolio_score
FROM alma_interventions i
LEFT JOIN alma_portfolio_signals ps ON i.id = ps.intervention_id
GROUP BY i.jurisdiction, i.type, i.consent_level, i.cultural_authority;

-- Media sentiment view
CREATE MATERIALIZED VIEW media_sentiment_tracker AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  source_url,
  AVG(sentiment_score) as avg_sentiment,
  COUNT(*) as article_count,
  ARRAY_AGG(DISTINCT topic) as topics
FROM alma_media_articles
GROUP BY DATE_TRUNC('day', created_at), source_url;

-- Refresh every hour
REFRESH MATERIALIZED VIEW CONCURRENTLY intervention_analytics;
```

---

## Media Sentiment Implementation

### Step 1: Enhance Ingestion Script

**Update**: `scripts/alma-continuous-ingestion.mjs`

```javascript
// New: Extract sentiment from media articles
async function extractMediaSentiment(markdown, source) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Analyze sentiment in these youth justice news articles.

Source: ${source.name}
Content:
${markdown.slice(0, 30000)}

For EACH article, extract:
1. Headline
2. Date published
3. Overall sentiment: positive/negative/neutral
4. Sentiment confidence: 0.0-1.0
5. Topics mentioned (youth detention, bail reform, cultural programs, etc.)
6. Government programs mentioned
7. Community organizations mentioned
8. Key quotes

Return JSON array of articles with sentiment analysis.`
      }]
    })
  });

  const data = await response.json();
  return JSON.parse(data.content[0].text);
}

// Store in new table
async function storeMediaSentiment(articles, jobId) {
  for (const article of articles) {
    await supabase.from('alma_media_articles').insert({
      job_id: jobId,
      headline: article.headline,
      published_date: article.date,
      sentiment: article.sentiment,
      sentiment_score: calculateSentimentScore(article.sentiment),
      confidence: article.confidence,
      topics: article.topics,
      government_mentions: article.government_programs,
      community_mentions: article.community_orgs,
      key_quotes: article.quotes,
      source_url: article.url,
    });
  }
}
```

### Step 2: Create Sentiment Database Schema

```sql
-- Media articles with sentiment
CREATE TABLE alma_media_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES alma_ingestion_jobs(id),
  headline TEXT NOT NULL,
  published_date TIMESTAMPTZ,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  sentiment_score DECIMAL CHECK (sentiment_score >= -1.0 AND sentiment_score <= 1.0),
  confidence DECIMAL CHECK (confidence >= 0.0 AND confidence <= 1.0),
  topics TEXT[],
  government_mentions JSONB,
  community_mentions JSONB,
  key_quotes TEXT[],
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Government program announcements (manual tracking)
CREATE TABLE alma_government_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  jurisdiction TEXT,
  announced_date DATE,
  implementation_date DATE,
  program_type TEXT,
  budget_amount DECIMAL,
  description TEXT,
  official_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link programs to interventions
CREATE TABLE alma_program_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES alma_government_programs(id),
  intervention_id UUID REFERENCES alma_interventions(id),
  relationship TEXT, -- 'implements', 'inspired_by', 'contradicts'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 3: Create Analytics Dashboard Pages

**File**: `src/app/analytics/page.tsx`

```typescript
import { Suspense } from 'react'
import PatternDetectionDashboard from '@/components/analytics/PatternDetectionDashboard'
import CommunityAuthorityTracker from '@/components/analytics/CommunityAuthorityTracker'
import MediaSentimentTracker from '@/components/analytics/MediaSentimentTracker'
import InquiryTimeline from '@/components/analytics/InquiryTimeline'

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">ALMA Intelligence Studio</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pattern Detection */}
        <Suspense fallback={<LoadingCard />}>
          <PatternDetectionDashboard />
        </Suspense>

        {/* Community Authority */}
        <Suspense fallback={<LoadingCard />}>
          <CommunityAuthorityTracker />
        </Suspense>

        {/* Media Sentiment */}
        <div className="col-span-full">
          <Suspense fallback={<LoadingCard />}>
            <MediaSentimentTracker />
          </Suspense>
        </div>

        {/* Inquiry Timeline */}
        <div className="col-span-full">
          <Suspense fallback={<LoadingCard />}>
            <InquiryTimeline />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
```

---

## Visualization Components

### 1. **Geographic Heat Map**

```typescript
// components/analytics/GeographicHeatMap.tsx
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

export function GeographicHeatMap({ interventions }) {
  // Group by state
  const byState = interventions.reduce((acc, i) => {
    const state = i.jurisdiction || 'Unknown'
    acc[state] = (acc[state] || 0) + 1
    return acc
  }, {})

  // Calculate color intensity based on count and community authority
  const getColor = (state) => {
    const count = byState[state] || 0
    const communityControlled = interventions
      .filter(i => i.jurisdiction === state && i.consent_level === 'Community Controlled')
      .length

    // Higher community authority = greener
    const intensity = communityControlled / count
    return `rgba(34, 197, 94, ${intensity})` // Green with variable opacity
  }

  return (
    <ComposableMap projection="geoMercator">
      <Geographies geography="/australia-states.json">
        {({ geographies }) =>
          geographies.map(geo => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill={getColor(geo.properties.name)}
              stroke="#FFF"
            />
          ))
        }
      </Geographies>
    </ComposableMap>
  )
}
```

### 2. **5-Signal Radar Chart**

```typescript
// components/analytics/SignalRadarChart.tsx
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'

export function SignalRadarChart({ intervention }) {
  const data = [
    { signal: 'Evidence Strength', value: intervention.evidence_strength, fullMark: 1, weight: '25%' },
    { signal: 'Community Authority', value: intervention.community_authority, fullMark: 1, weight: '30%' },
    { signal: 'Harm Risk (Inverted)', value: intervention.harm_risk_inverted, fullMark: 1, weight: '20%' },
    { signal: 'Implementation', value: intervention.implementation_capability, fullMark: 1, weight: '15%' },
    { signal: 'Option Value', value: intervention.option_value, fullMark: 1, weight: '10%' },
  ]

  return (
    <RadarChart width={500} height={500} data={data}>
      <PolarGrid />
      <PolarAngleAxis dataKey="signal" />
      <PolarRadiusAxis angle={90} domain={[0, 1]} />
      <Radar name="Signals" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
    </RadarChart>
  )
}
```

### 3. **Media Sentiment Timeline**

```typescript
// components/analytics/MediaSentimentTimeline.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'

export function MediaSentimentTimeline({ articles, programs }) {
  // Group by date
  const dailySentiment = articles.reduce((acc, article) => {
    const date = article.published_date.split('T')[0]
    if (!acc[date]) {
      acc[date] = { date, positive: 0, negative: 0, neutral: 0, total: 0 }
    }
    acc[date][article.sentiment]++
    acc[date].total++
    return acc
  }, {})

  // Calculate sentiment score: (positive - negative) / total
  const data = Object.values(dailySentiment).map(day => ({
    date: day.date,
    score: (day.positive - day.negative) / day.total,
    articles: day.total,
  }))

  return (
    <div>
      <LineChart width={1200} height={400} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[-1, 1]} />
        <Tooltip />
        <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} />

        {/* Add vertical lines for program announcements */}
        {programs.map(program => (
          <ReferenceLine
            key={program.id}
            x={program.announced_date}
            stroke="green"
            label={program.name}
          />
        ))}
      </LineChart>

      {/* Color legend */}
      <div className="mt-4">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500" />
            <span>Positive sentiment (>0.3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500" />
            <span>Negative sentiment (<-0.3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-green-600" />
            <span>Government program announcement</span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## Implementation Roadmap

### Week 1: Core Analytics Dashboard
- [ ] Create analytics page structure
- [ ] Build pattern detection visualizations
- [ ] Implement 5-signal radar charts
- [ ] Add geographic heat map
- [ ] Create community authority tracker

### Week 2: Media Sentiment Tracker
- [ ] Update ingestion script to extract sentiment
- [ ] Create `alma_media_articles` database table
- [ ] Build sentiment timeline component
- [ ] Implement topic detection
- [ ] Add sentiment alerts

### Week 3: Inquiry Intelligence
- [ ] Create inquiry timeline visualization
- [ ] Build recommendation tracker
- [ ] Add government program database
- [ ] Implement program-intervention linking
- [ ] Create impact correlation views

### Week 4: Predictive Intelligence
- [ ] Build ALMA recommendation engine
- [ ] Implement pattern prediction alerts
- [ ] Create intervention similarity matcher
- [ ] Add evidence gap detection
- [ ] Build policy contradiction finder

---

## Success Metrics

### Analytics Dashboard
- ✅ Load time < 2 seconds
- ✅ Real-time updates (refresh every 5 minutes)
- ✅ Mobile responsive
- ✅ Export to PDF/CSV
- ✅ Share dashboard snapshots

### Media Sentiment Tracker
- ✅ Track 100+ articles/week
- ✅ Sentiment accuracy > 80%
- ✅ Detect sentiment shifts within 24h
- ✅ Correlate with government programs
- ✅ Alert on major sentiment changes

### User Engagement
- ✅ Policy makers use for decision support
- ✅ Researchers cite ALMA insights
- ✅ Media references JusticeHub analytics
- ✅ Community organizations access dashboards

---

## Sacred Boundaries in Analytics

**CRITICAL**: All analytics must respect ALMA's sacred boundaries:

❌ **NEVER**:
- Show individual youth data
- Rank organizations/communities
- Enable extraction without consent
- Predict individual outcomes

✅ **ALWAYS**:
- System-level aggregates only
- Respect consent levels (filter by Community Controlled vs Public Knowledge Commons)
- Highlight community authority (30% weight)
- Show pattern detection, not profiling
- Enable decision support, not deciding for humans

---

## Next Steps

Ready to start building? Let me know which phase you want to tackle first:

1. **Analytics Dashboard** - Core visualizations and pattern detection
2. **Media Sentiment Tracker** - Real-time media monitoring
3. **Both in parallel** - Maximum impact, faster delivery

Once you choose, I'll:
1. Create the database migrations
2. Build the sentiment extraction logic
3. Create the React components
4. Set up the API routes
5. Deploy the analytics studio

**This will be world-class** - ALMA's intelligence visualized in a way that empowers decision makers while respecting Indigenous data sovereignty! 🚀
