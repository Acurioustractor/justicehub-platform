# 🎬 ALMA Scrollytelling Studio - World-Class Visual Storytelling

**Inspired by**: The Pudding, NYT Snow Fall, Flourish, Observable D3

**Mission**: Transform ALMA's intelligence into immersive, scrollable narratives that walk decision-makers through youth justice patterns while respecting Indigenous data sovereignty.

---

## Research Insights: Best-in-Class Examples

### 🏆 **The Pudding's Approach**
[Source: Pudding.cool](https://pudding.cool/process/how-to-make-dope-shit-part-3/)

**Key Principles**:
1. **Start with Individual Data Points** - Make it human, then zoom out to patterns
2. **Deeper Truth Over Headlines** - Answer "how" and "why" with data
3. **Long Shelf Life** - Stories that matter beyond the news cycle
4. **Clear Conclusions** - Data must speak with hard underlying conclusions

**Tech Stack**:
- D3.js for custom visualizations
- Svelte for reactive components
- R/Python for data processing
- Public code & datasets

### 📜 **Scrollytelling Best Practices**
[Source: Scrollama.js](https://pudding.cool/process/introducing-scrollama/)

**Core Technique**: Scroll-driven animations using IntersectionObserver
- **Sticky positioning** for fixed graphics
- **Progressive disclosure** - reveal layers as user scrolls
- **Step-based narrative** - each scroll triggers new insight

[Source: React Scrollama](https://www.npmjs.com/package/react-scrollama)

**Implementation**:
```jsx
<Scrollama onStepEnter={onStepEnter} offset={0.5}>
  <Step data={1}>
    <div>First insight appears...</div>
  </Step>
  <Step data={2}>
    <div>Then the pattern emerges...</div>
  </Step>
  <Step data={3}>
    <div>Finally, the recommendation...</div>
  </Step>
</Scrollama>
```

### 🎨 **D3.js Gallery**
[Source: D3 Observable Gallery](https://observablehq.com/@d3/gallery)

**Best Visualizations for Our Use Case**:
- **Choropleth Maps** - Geographic patterns by state
- **Force-Directed Graphs** - Show intervention connections
- **Radial Charts** - 5-Signal framework visualization
- **Stream Graphs** - Track program types over time
- **Sankey Diagrams** - Flow from inquiry recommendations → interventions

---

## Story Frameworks for ALMA

### 📖 **Story 1: "The Pattern That Changed Everything"**

**Hook**: Start with ONE intervention that worked

**Narrative Arc**:
```
1. Individual Story (scroll)
   "In 2023, a small program in Queensland..."
   → Show single data point on map

2. The Pattern Emerges (scroll)
   "But it wasn't alone..."
   → Reveal 24 similar Community Controlled programs
   → Heat map lights up across Australia

3. The Signal (scroll)
   "What made these different?"
   → Animate 5-signal radar chart
   → Community Authority: 0.80 (30% weight - HIGHEST)

4. The Impact (scroll)
   "And the results speak for themselves..."
   → Outcome data visualization
   → Recidivism rates comparison

5. The Call to Action (scroll)
   "Here's what we learned..."
   → Policy recommendations
   → Download report button
```

**Technical Implementation**:
- Sticky map on left, text scrolls on right
- Each scroll step triggers animation
- Data loads progressively (not all at once)

---

### 📖 **Story 2: "Media vs Reality - What the Data Really Says"**

**Hook**: Media sentiment tracker reveals the truth

**Narrative Arc**:
```
1. The Headlines (scroll)
   Show real Guardian/ABC headlines
   → Timeline of negative coverage
   → Sentiment score: -0.4 (negative trend)

2. Then Government Responded (scroll)
   → Vertical line: "QLD announces cultural program"
   → Green highlight on timeline

3. The Shift (scroll)
   → Sentiment line curves upward
   → +0.6 score after program launch
   → "Media coverage turned positive within 2 weeks"

4. But Here's What Actually Happened (scroll)
   → Show ALMA intervention data
   → Cultural Connection programs increased 200%
   → Community Authority score: 0.85

5. The Pattern Repeats (scroll)
   → Show 5 more examples
   → "Every time Community Controlled programs launched..."
   → "Sentiment improved by average +0.4"

6. The Insight (scroll)
   → "Programs with Community Authority get better media coverage"
   → "Because they work better"
   → Call to action: "Fund more Community Controlled programs"
```

---

### 📖 **Story 3: "The Royal Commission's Legacy"**

**Hook**: What happened after the NT Royal Commission?

**Narrative Arc**:
```
1. The Catalyst (scroll)
   → 2017: Images from Don Dale detention
   → Public outcry
   → Royal Commission announced

2. The Recommendations (scroll)
   → Show all 227 recommendations
   → Visualize as dots on screen
   → "How many were implemented?"

3. The Reality (scroll)
   → Dots fade to reveal:
     - 89 implemented (green)
     - 102 pending (yellow)
     - 36 ignored (red)

4. Recommendation #47 (zoom in)
   → "Increase cultural programming"
   → Status: ✅ Implemented

5. The Impact (scroll)
   → ALMA intervention tracker shows:
     - 9 Cultural Connection programs launched
     - All Community Controlled
     - Average signal score: 0.82 (highest category)

6. The Evidence (scroll)
   → Link to outcome data
   → Recidivism reduced by 40%
   → Community authority drove the results

7. The Unfinished Business (scroll)
   → Show 36 ignored recommendations
   → "What if we implemented these too?"
   → Predictive model: potential impact

8. Take Action (scroll)
   → Contact your MP
   → Download full report
   → Support Community Controlled programs
```

---

## Technical Architecture

### Frontend Stack

**Core Libraries**:
```json
{
  "react-scrollama": "^2.3.3",       // Scrollytelling
  "d3": "^7.9.0",                    // Custom visualizations
  "recharts": "^2.12.0",             // Simple charts
  "framer-motion": "^11.0.0",        // Smooth animations
  "react-intersection-observer": "^9.8.0", // Trigger animations
  "gsap": "^3.12.5"                  // Advanced animations
}
```

**Component Structure**:
```
src/components/scrollytelling/
├── ScrollyStory.tsx              // Main container
├── StoryStep.tsx                 // Individual step
├── StickyChart.tsx               // Fixed chart that updates
├── ProgressBar.tsx               // Story progress indicator
└── visualizations/
    ├── GeographicHeatMap.tsx     // D3 map
    ├── SentimentTimeline.tsx     // Recharts timeline
    ├── RadarChart.tsx            // 5-Signal radar
    ├── InquiryTimeline.tsx       // D3 timeline
    └── ForceDirectedGraph.tsx    // D3 network graph
```

### Story Data Structure

```typescript
// Story configuration
interface Story {
  id: string
  title: string
  subtitle: string
  author: string
  publishDate: string
  estimatedReadTime: string // "15 minutes"

  steps: StoryStep[]

  metadata: {
    tags: string[]           // ["Community Authority", "Royal Commission"]
    interventions: string[]  // IDs of interventions featured
    dataSources: string[]    // ALMA, Royal Commission, Media
    consentLevel: string     // "Public Knowledge Commons"
  }
}

interface StoryStep {
  id: string
  type: 'text' | 'visualization' | 'split' | 'fullscreen'

  // Text content
  content?: {
    title?: string
    body: string            // Markdown supported
    caption?: string
    emphasis?: 'normal' | 'callout' | 'quote'
  }

  // Visualization
  chart?: {
    type: 'map' | 'timeline' | 'radar' | 'bar' | 'sankey'
    data: any
    config: any
    animation: 'fade' | 'slide' | 'grow' | 'draw' | 'morph'
  }

  // Layout
  layout?: 'text-left' | 'text-right' | 'text-overlay' | 'fullscreen'

  // Animation triggers
  onEnter?: (step: number) => void
  onExit?: (step: number) => void
  onProgress?: (progress: number) => void
}
```

### Example Story Implementation

```typescript
// stories/the-pattern-that-changed-everything.ts
export const patternStory: Story = {
  id: 'pattern-that-changed-everything',
  title: 'The Pattern That Changed Everything',
  subtitle: 'How 24 Community Controlled programs revealed the path forward',
  author: 'ALMA Intelligence System',
  publishDate: '2026-01-01',
  estimatedReadTime: '12 minutes',

  steps: [
    // Step 1: Hook
    {
      id: 'hook',
      type: 'fullscreen',
      content: {
        title: 'In 2023, something shifted in Queensland...',
        body: 'A small cultural healing program launched in a remote community. The results were extraordinary.',
        emphasis: 'callout',
      },
    },

    // Step 2: Show single intervention
    {
      id: 'single-intervention',
      type: 'split',
      layout: 'text-left',
      content: {
        title: 'Meet the PICC Cultural Mentoring Program',
        body: `
- **Location**: Queensland
- **Type**: Cultural Connection
- **Consent Level**: Community Controlled
- **Cultural Authority**: ✅ Yes
- **Portfolio Score**: 0.87 (Top 5%)
        `,
      },
      chart: {
        type: 'map',
        data: { interventionId: 'picc-cultural-mentoring' },
        config: { zoom: 'Queensland', highlight: true },
        animation: 'grow',
      },
    },

    // Step 3: Reveal pattern
    {
      id: 'pattern-emerges',
      type: 'split',
      layout: 'text-right',
      content: {
        title: 'But it wasn\'t alone...',
        body: 'As ALMA tracked interventions across Australia, a pattern emerged. 24 similar programs, all Community Controlled, all achieving extraordinary results.',
      },
      chart: {
        type: 'map',
        data: {
          interventions: 'community-controlled',
          filter: { consent_level: 'Community Controlled' }
        },
        config: {
          zoom: 'Australia',
          cluster: true,
          colorBy: 'community_authority'
        },
        animation: 'fade',
      },
      onEnter: (step) => {
        // Animate all 24 dots appearing on map
        animateMapDots(24, 1000)
      },
    },

    // Step 4: Show the signal
    {
      id: 'the-signal',
      type: 'split',
      layout: 'text-left',
      content: {
        title: 'What made these different?',
        body: `
ALMA's 5-Signal Framework revealed the answer:

**Community Authority**: 0.80 (30% weight - HIGHEST)

This wasn't just about programs. It was about who led them.

When communities control their own interventions, everything changes.
        `,
      },
      chart: {
        type: 'radar',
        data: {
          interventionId: 'picc-cultural-mentoring',
          compare: 'non-community-controlled'
        },
        animation: 'draw',
      },
    },

    // Step 5: Impact data
    {
      id: 'impact',
      type: 'visualization',
      chart: {
        type: 'bar',
        data: {
          metric: 'recidivism_rate',
          compare: [
            { label: 'Community Controlled', value: 0.18 },
            { label: 'Government Run', value: 0.42 }
          ]
        },
        config: {
          title: 'Recidivism Rates: Community vs Government',
          yAxis: 'Recidivism Rate (%)',
          colors: ['#22c55e', '#ef4444']
        },
        animation: 'grow',
      },
    },

    // Step 6: Call to action
    {
      id: 'call-to-action',
      type: 'fullscreen',
      content: {
        title: 'The data is clear',
        body: `
## Here's what we learned:

1. **Community Authority matters most** (30% of ALMA's scoring)
2. **Cultural Connection programs work** (0.82 average signal score)
3. **Indigenous-led interventions reduce recidivism by 57%**

## What happens next is up to us.

[Download Full Report](#) | [Contact Your MP](#) | [Support Community Programs](#)
        `,
        emphasis: 'callout',
      },
    },
  ],

  metadata: {
    tags: ['Community Authority', 'Cultural Connection', 'Queensland'],
    interventions: ['picc-cultural-mentoring'],
    dataSources: ['ALMA Intelligence', 'Queensland Youth Justice'],
    consentLevel: 'Public Knowledge Commons',
  },
}
```

---

## Visualization Components

### 1. **Animated Geographic Heat Map**

```typescript
// components/scrollytelling/visualizations/AnimatedHeatMap.tsx
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface AnimatedHeatMapProps {
  interventions: Intervention[]
  step: number
  onStepChange?: (step: number) => void
}

export function AnimatedHeatMap({ interventions, step }: AnimatedHeatMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    const width = 800
    const height = 600

    // Load Australia GeoJSON
    d3.json('/maps/australia-states.json').then(geoData => {
      const projection = d3.geoMercator()
        .fitSize([width, height], geoData)

      const path = d3.geoPath(projection)

      // Draw states
      svg.selectAll('path')
        .data(geoData.features)
        .join('path')
        .attr('d', path)
        .attr('fill', '#f0f0f0')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)

      // Animate interventions based on step
      if (step === 1) {
        // Show single intervention
        const single = interventions[0]
        const [x, y] = projection([single.longitude, single.latitude])

        svg.append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 0)
          .attr('fill', '#22c55e')
          .transition()
          .duration(1000)
          .attr('r', 20)
      }

      if (step === 2) {
        // Show all 24 Community Controlled
        const communityControlled = interventions.filter(
          i => i.consent_level === 'Community Controlled'
        )

        svg.selectAll('circle.intervention')
          .data(communityControlled)
          .join('circle')
          .attr('class', 'intervention')
          .attr('cx', d => projection([d.longitude, d.latitude])[0])
          .attr('cy', d => projection([d.longitude, d.latitude])[1])
          .attr('r', 0)
          .attr('fill', d => d.cultural_authority ? '#22c55e' : '#ef4444')
          .attr('opacity', 0)
          .transition()
          .delay((d, i) => i * 50) // Stagger animation
          .duration(500)
          .attr('r', 15)
          .attr('opacity', 0.8)
      }
    })
  }, [step, interventions])

  return (
    <svg ref={svgRef} width={800} height={600} />
  )
}
```

### 2. **Media Sentiment Timeline with Scroll Triggers**

```typescript
// components/scrollytelling/visualizations/SentimentTimeline.tsx
import { LineChart, Line, XAxis, YAxis, ReferenceLine, Area } from 'recharts'
import { motion } from 'framer-motion'

export function SentimentTimeline({ articles, programs, step }) {
  // Calculate sentiment over time
  const timelineData = articles.reduce((acc, article) => {
    const date = article.published_date.split('T')[0]
    if (!acc[date]) acc[date] = { date, positive: 0, negative: 0, neutral: 0 }
    acc[date][article.sentiment]++
    return acc
  }, {})

  const data = Object.values(timelineData).map(day => ({
    date: day.date,
    score: (day.positive - day.negative) / (day.positive + day.negative + day.neutral),
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <LineChart width={1000} height={400} data={data}>
        <XAxis dataKey="date" />
        <YAxis domain={[-1, 1]} />

        {/* Show sentiment line */}
        <Line
          type="monotone"
          dataKey="score"
          stroke="#8b5cf6"
          strokeWidth={3}
          dot={false}
        />

        {/* Animate program announcements based on step */}
        {step >= 2 && programs.map((program, i) => (
          <ReferenceLine
            key={program.id}
            x={program.announced_date}
            stroke="#22c55e"
            strokeWidth={2}
            label={{
              value: program.name,
              position: 'top',
              fill: '#22c55e',
              fontSize: 12,
            }}
            strokeDasharray="5 5"
          />
        ))}

        {/* Highlight positive zones */}
        {step >= 3 && (
          <Area
            type="monotone"
            dataKey="score"
            fill="#22c55e"
            fillOpacity={0.2}
            stroke="none"
          />
        )}
      </LineChart>

      {step >= 4 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 bg-green-50 border-l-4 border-green-500"
        >
          <p className="text-lg font-semibold text-green-900">
            Pattern detected: Sentiment improved +0.4 after Community Controlled program launches
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
```

### 3. **Scrollytelling Container**

```typescript
// components/scrollytelling/ScrollyStory.tsx
import { Scrollama, Step } from 'react-scrollama'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function ScrollyStory({ story }: { story: Story }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  const onStepEnter = ({ data }: { data: number }) => {
    setCurrentStep(data)
    story.steps[data].onEnter?.(data)
  }

  const onStepProgress = ({ progress }: { progress: number }) => {
    setProgress(progress)
  }

  return (
    <div className="scrolly-story">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
        <motion.div
          className="h-full bg-purple-600"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / story.steps.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Story header */}
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900 text-white">
        <div className="text-center px-8">
          <h1 className="text-6xl font-bold mb-4">{story.title}</h1>
          <p className="text-2xl mb-8">{story.subtitle}</p>
          <div className="flex gap-4 justify-center text-sm opacity-75">
            <span>{story.author}</span>
            <span>•</span>
            <span>{story.publishDate}</span>
            <span>•</span>
            <span>{story.estimatedReadTime} read</span>
          </div>
        </div>
      </div>

      {/* Scrollytelling steps */}
      <Scrollama onStepEnter={onStepEnter} onStepProgress={onStepProgress} offset={0.5}>
        {story.steps.map((step, index) => (
          <Step data={index} key={step.id}>
            <div className={`min-h-screen ${getStepLayout(step)}`}>
              {step.type === 'split' && (
                <>
                  {/* Sticky chart */}
                  <div className="sticky top-0 h-screen flex items-center justify-center w-1/2">
                    <AnimatePresence mode="wait">
                      {currentStep === index && step.chart && (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.6 }}
                        >
                          <ChartRenderer chart={step.chart} progress={progress} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Scrolling text */}
                  <div className="w-1/2 p-12 flex items-center">
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: currentStep === index ? 1 : 0.3, x: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {step.content?.title && (
                        <h2 className="text-4xl font-bold mb-6">{step.content.title}</h2>
                      )}
                      <div className="prose prose-lg">
                        {step.content?.body}
                      </div>
                    </motion.div>
                  </div>
                </>
              )}

              {step.type === 'fullscreen' && (
                <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: currentStep === index ? 1 : 0, y: currentStep === index ? 0 : 50 }}
                    className="text-center px-8 max-w-4xl"
                  >
                    <h2 className="text-5xl font-bold mb-6">{step.content?.title}</h2>
                    <div className="prose prose-xl prose-invert">
                      {step.content?.body}
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </Step>
        ))}
      </Scrollama>

      {/* Footer */}
      <div className="py-16 bg-gray-100 text-center">
        <h3 className="text-2xl font-bold mb-4">Explore More ALMA Stories</h3>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Download Full Report
          </button>
          <button className="px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50">
            View All Stories
          </button>
        </div>
      </div>
    </div>
  )
}

function getStepLayout(step: StoryStep): string {
  if (step.type === 'split') {
    return step.layout === 'text-left' ? 'flex' : 'flex flex-row-reverse'
  }
  return ''
}
```

---

## Story Curation System

### Database Schema for Stories

```sql
-- Stories table
CREATE TABLE alma_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  author TEXT DEFAULT 'ALMA Intelligence System',
  published_date DATE NOT NULL,
  estimated_read_time TEXT,

  -- Story configuration (JSON)
  config JSONB NOT NULL,

  -- Metadata
  tags TEXT[],
  featured_interventions UUID[],
  data_sources TEXT[],
  consent_level TEXT DEFAULT 'Public Knowledge Commons',

  -- Analytics
  view_count INTEGER DEFAULT 0,
  avg_completion_rate DECIMAL,
  avg_time_spent INTEGER, -- seconds

  -- Publishing
  status TEXT CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story views tracking
CREATE TABLE alma_story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES alma_stories(id),
  user_id UUID, -- optional, can be null for anonymous
  session_id TEXT,

  -- Engagement metrics
  steps_completed INTEGER,
  total_steps INTEGER,
  time_spent INTEGER, -- seconds
  scroll_depth DECIMAL, -- 0.0 to 1.0

  -- Context
  referrer TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1)
- [ ] Install React Scrollama, D3, Framer Motion
- [ ] Build ScrollyStory container component
- [ ] Create basic step layouts (split, fullscreen)
- [ ] Implement progress bar
- [ ] Add smooth scroll animations

### Phase 2: Visualization Components (Week 2)
- [ ] Build AnimatedHeatMap (D3)
- [ ] Create SentimentTimeline (Recharts)
- [ ] Implement RadarChart for 5-Signal
- [ ] Build InquiryTimeline
- [ ] Add ForceDirectedGraph for connections

### Phase 3: First Story (Week 3)
- [ ] Write "The Pattern That Changed Everything"
- [ ] Gather intervention data
- [ ] Create step-by-step narrative
- [ ] Build custom animations
- [ ] Test scroll performance
- [ ] Publish and iterate

### Phase 4: Media Sentiment Story (Week 4)
- [ ] Write "Media vs Reality"
- [ ] Integrate sentiment data
- [ ] Build correlation visualizations
- [ ] Add government program timeline
- [ ] Launch and promote

---

## Sacred Boundaries in Storytelling

**CRITICAL**: All stories must respect ALMA's ethics:

❌ **NEVER**:
- Tell individual youth stories without consent
- Show identifying information
- Predict individual outcomes
- Rank communities or organizations

✅ **ALWAYS**:
- Aggregate data only (system-level)
- Highlight Community Authority (30% weight)
- Respect consent levels (filter sensitive data)
- Emphasize pattern detection, not profiling
- Enable decision support, not deciding for humans
- Attribute data sources properly

**Example**:
```
❌ BAD: "Joey, 15, from Darwin, was arrested 3 times..."
✅ GOOD: "24 Community Controlled programs in remote areas showed..."

❌ BAD: "This community has the highest recidivism rate"
✅ GOOD: "Programs with Community Authority reduced recidivism by 57%"
```

---

## Analytics & Iteration

### Track Story Performance

```typescript
// Track when users reach each step
function trackStepProgress(storyId: string, stepId: string, progress: number) {
  await supabase.from('alma_story_views').upsert({
    story_id: storyId,
    session_id: getSessionId(),
    steps_completed: getCurrentStep(),
    total_steps: getTotalSteps(),
    time_spent: getTimeSpent(),
    scroll_depth: progress,
  })
}

// Metrics to track:
// - Completion rate: How many users finish the story?
// - Drop-off points: Where do users leave?
// - Time per step: Which steps are most engaging?
// - Scroll depth: Are users actually scrolling?
// - Sharing: Are users sharing specific steps?
```

### A/B Testing

```typescript
// Test different story structures
const variants = {
  A: { layout: 'text-left', animation: 'fade' },
  B: { layout: 'text-right', animation: 'slide' },
}

// Track which performs better
function trackVariant(variant: 'A' | 'B') {
  // Record completion rate, engagement, etc.
}
```

---

## Next Steps

**Ready to build?**

1. **Install dependencies**
2. **Create first story component**
3. **Build AnimatedHeatMap**
4. **Write "The Pattern That Changed Everything"**
5. **Launch and iterate**

This will be **world-class storytelling** powered by ALMA's intelligence! 🚀

---

## Sources

- [The Pudding - Storytelling Techniques](https://pudding.cool/process/how-to-make-dope-shit-part-3/)
- [Visual Storytelling Inside The Pudding](https://datajournalism.com/read/newsletters/visual-storytelling-inside-the-pudding)
- [Scrollama.js - Scrollytelling Library](https://pudding.cool/process/introducing-scrollama/)
- [React Scrollama - npm](https://www.npmjs.com/package/react-scrollama)
- [Scrollytelling Best Practices - Metadrop](https://metadrop.net/en/articles/scrollytelling-using-scrollamajs-css-and-best-practices)
- [D3.js Gallery - Observable](https://observablehq.com/@d3/gallery)
- [Scrollytelling Examples](https://www.storydoc.com/blog/scrollytelling-examples)
- [Best Data Visualization Tools 2026](https://www.holistics.io/blog/best-data-visualization-tools/)
