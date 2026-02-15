# 📖 ALMA Scrollytelling - Visual Strategy

**Goal**: Draw people into the data story through powerful imagery, interactive visualizations, and emotional narrative

---

## 🎨 Visual Narrative Structure

### Story 1: "The Pattern That Changed Everything"
**Emotional Arc**: Crisis → Evidence → Hope → Action

#### Visual Sequence:

**1. Opening (Crisis)**
- **Image**: Aerial shot of detention center (austere, institutional)
  - Source: Unsplash - search "prison fence", "detention facility"
  - Treatment: Desaturated, cold blue tones
- **Data Overlay**: "17x overrepresentation" statistic
- **Animation**: Number counts up as you scroll
- **Color**: Dark greys, cold blues (JusticeHub dark panels)

**2. The Human Cost (Emotional Impact)**
- **Image**: Hands holding barbed wire (symbolic, no faces for privacy)
  - Source: Unsplash - "hands prison", "barbed wire hands"
  - Treatment: High contrast, warm hands vs cold metal
- **Data Overlay**: Sentiment timeline showing negative coverage (-0.72)
- **Animation**: Line graph draws as you scroll, highlighting crisis points
- **Color**: Orange accent (#e57a28) for data points

**3. Community Wisdom (Traditional Knowledge)**
- **Image**: Indigenous elder teaching on country (cultural authority)
  - Source: Unsplash - "Aboriginal elder", "Indigenous Australia ceremony"
  - Creative Commons - WikiMedia "Indigenous Australian culture"
  - Treatment: Warm, golden hour lighting, respectful framing
- **Data Overlay**: "60% reduction in reoffending" statistic
- **Animation**: Circular progress indicator fills to 60%
- **Color**: Green (#27ae60) representing growth/healing
- **Quote Overlay**: "These programs work because they're designed by community, for community"

**4. Evidence (The Data Speaks)**
- **Visualization**: Split-screen comparison
  - Left: Detention center ($80M budget, -0.60 sentiment, 300% increase in adult incarceration)
  - Right: Cultural camp ($3.5M budget, +0.70 sentiment, 60% reduction in reoffending)
- **Images**:
  - Left: Concrete walls, barbed wire (institutional)
  - Right: Open landscape, campfire, connection to country
- **Animation**: Metrics slide in from sides, meet in middle for comparison
- **Color**: Red for detention stats, green for community stats

**5. The Shift (Media Recognizes Truth)**
- **Visualization**: Sentiment timeline showing positive shift for community programs
- **Images**: Montage of newspaper headlines (Guardian, ABC logos)
  - Overlay actual headlines from our data
  - Treatment: Highlighted text, newspaper aesthetic
- **Animation**: Headlines fade in sequentially as you scroll
- **Color**: Gradient from cold (detention) to warm (community)

**6. Call to Action (What Now)**
- **Image**: Young Aboriginal person looking toward horizon (hope, future)
  - Source: Unsplash - "Aboriginal youth", "Indigenous Australian young"
  - Treatment: Bright, hopeful, warm tones
- **Data Overlay**: "24 Community Controlled programs tracked"
- **Animation**: Map of Australia with pin drops showing program locations
- **Color**: JusticeHub green (#27ae60) - call to action
- **Button**: "Explore the Programs" → links to ALMA Intelligence Studio

---

## 📸 Image Sourcing Strategy

### Ethical Considerations

**DO**:
- ✅ Use symbolic imagery (hands, landscapes, objects)
- ✅ Credit Indigenous photographers where possible
- ✅ Respectful cultural imagery (no sacred/ceremonial photos)
- ✅ Focus on hope and strength, not victimization
- ✅ Use landscape/country imagery (connection to land)
- ✅ Abstract data visualizations
- ✅ Newspaper/media imagery (our own data)

**DON'T**:
- ❌ Photos of young people in detention (privacy)
- ❌ Identifying images of individuals (unless consented)
- ❌ Sacred/ceremonial imagery without permission
- ❌ Trauma porn (exploitative imagery)
- ❌ Stereotypical "Aboriginal in the outback" shots
- ❌ Images that perpetuate negative stereotypes

### Image Sources

**Free/Open**:
1. **Unsplash** - High-quality, free commercial use
   - Search terms: "Aboriginal culture", "outback landscape", "cultural ceremony", "Indigenous Australia"
   - Photographers to look for: Aboriginal photographers

2. **Wikimedia Commons** - Public domain Indigenous imagery
   - Category: Indigenous Australians
   - Category: Aboriginal Australian culture
   - Filter: Public domain or CC-BY-SA

3. **Pexels** - Free stock photos
   - Similar search terms as Unsplash

4. **Our Own Data Visualizations** - Generated from ALMA data
   - Sentiment charts
   - Topic word clouds
   - Correlation heatmaps
   - Timeline graphics

**Paid/Licensed** (Future):
1. **AIATSIS** (Australian Institute of Aboriginal and Torres Strait Islander Studies)
   - Curated, ethically sourced Indigenous imagery
   - Requires licensing but supports Indigenous communities

2. **Indigenous photographers** - Commission original work
   - Support Indigenous artists
   - Ensure cultural appropriateness
   - Get explicit consent for use

### Specific Image Needs

**Opening Section**:
- [ ] Detention center exterior (austere, institutional feel)
- [ ] Barbed wire close-up
- [ ] Hands behind bars/fence (symbolic)

**Community Wisdom**:
- [ ] Elder teaching (respectful, empowering)
- [ ] Cultural camp on country
- [ ] Campfire gathering (community connection)
- [ ] Aboriginal flag (symbol of sovereignty)

**Evidence Section**:
- [ ] Open landscape (freedom, connection to country)
- [ ] Young people engaged in cultural activity
- [ ] Traditional tools/artifacts (cultural authority)

**Call to Action**:
- [ ] Horizon shot (hope, future)
- [ ] Sunrise/sunset over Australian landscape
- [ ] Young Aboriginal person (empowered, hopeful)

---

## 🎭 Interactive Visualization Designs

### 1. Sentiment Timeline (D3.js)

**Visual**:
```
     +0.8 ┤         ●  Community Programs
          │        ╱
     +0.4 ┤    ●  ╱
          │   ╱  ╱
      0.0 ┼──●──●────────────────
          │      ╲
     -0.4 ┤       ╲  ●  Detention Coverage
          │        ╲╱
     -0.8 ┤         ●
          └────────────────────────
          Dec 1   Dec 15   Jan 1
```

**Interaction**:
- Hover: Show exact sentiment score + article count
- Click: Display sample headlines from that day
- Scroll: Animate line drawing from left to right
- Color: Green for positive, red for negative, orange for neutral

**JusticeHub Styling**:
- Background: `rgba(10, 16, 24, 0.92)` (dark panel with blur)
- Lines: `#27ae60` (green) and `#e57a28` (orange)
- Grid: Subtle white lines with low opacity
- Shadow: `var(--contained-shadow-strong)`

### 2. Topic Burst Visualization (D3.js Force Simulation)

**Visual**: Bubble chart where topics are sized by mentions, color by sentiment

```
        [cultural programs]    (largest, green)

  [detention]              [community-led]
  (medium, red)            (medium, green)

    [bail reform]      [reoffending]
    (small, red)       (small, orange)
```

**Interaction**:
- Hover: Show mention count + avg sentiment
- Click: Filter articles by topic
- Scroll: Bubbles float into position from edges
- Animation: Gentle pulsing on positive topics

**JusticeHub Styling**:
- Positive topics: `#27ae60` gradient
- Negative topics: `#e57a28` to red gradient
- Neutral topics: Grey gradient
- Glow effect on hover using `box-shadow`

### 3. Program Correlation Heatmap

**Visual**: Matrix showing sentiment before/after program announcements

```
                    │ Before │ After │ Shift │
────────────────────┼────────┼───────┼───────┤
QLD Detention ($80M)│  -0.2  │ -0.1  │  +0.1 │ ▓▓▓░░░░░░░
Maranguka ($3.5M)   │  +0.1  │ +0.2  │  +0.1 │ ▓▓▓░░░░░░░
NT Cultural ($5M)   │  +0.0  │ +0.1  │  +0.1 │ ▓▓▓░░░░░░░
```

**Interaction**:
- Hover: Show exact numbers + article sample
- Click: Expand to show all related articles
- Scroll: Bars fill from left to right
- Color: Green for positive shift, red for negative

**JusticeHub Styling**:
- Community-led programs: Green row highlight
- Government programs: Orange row highlight
- Hover state: Backdrop blur + shadow
- Mobile: Vertical bars instead of horizontal

### 4. Quote Carousel

**Visual**: Rotating community voice highlights with attribution

```
┌─────────────────────────────────────────────┐
│  "These programs work because they're       │
│   designed by community, for community"     │
│                                             │
│   — Aunty Margaret Wilson, Yolngu Elder    │
└─────────────────────────────────────────────┘
         ●  ○  ○  ○  (pagination)
```

**Interaction**:
- Auto-scroll every 5 seconds
- Manual navigation via dots
- Fade transition between quotes
- Click: Link to full article

**JusticeHub Styling**:
- Background: Dark panel with blur
- Quote text: Large, white, serif font (impact)
- Attribution: Orange accent color
- Border: Subtle green left-border accent

### 5. Australia Map - Program Locations

**Visual**: SVG map of Australia with program pins

```
        NT (●)    QLD (●)

              NSW (●●)
        WA (●)
                    VIC (●)
```

**Interaction**:
- Hover: Show program name + budget
- Click: Zoom to region + show details
- Scroll: Pins drop in sequentially
- Filter: Toggle community-led vs government

**JusticeHub Styling**:
- Map: Dark grey/blue outline
- Community programs: Green pins with glow
- Government programs: Orange pins
- Hover: Pin expands + tooltip appears
- Animation: Ripple effect on pin drop

---

## 🎬 Scroll Animation Techniques

### Using React Scrollama

**Install**:
```bash
npm install react-scrollama intersection-observer
```

**Pattern**:
```jsx
import { Scrollama, Step } from 'react-scrollama';

<Scrollama onStepEnter={onStepEnter} offset={0.5}>
  <Step data={1}>
    <div className="step">Crisis imagery + stat</div>
  </Step>
  <Step data={2}>
    <div className="step">Community wisdom + quote</div>
  </Step>
  <Step data={3}>
    <div className="step">Data visualization</div>
  </Step>
</Scrollama>
```

### Animation States

**Sticky Section** (visualization stays while text scrolls):
```css
.sticky-viz {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Fade In/Out**:
```jsx
<div className={`step ${currentStep === 1 ? 'active' : ''}`}>
  {/* Content fades in when active */}
</div>
```

**Number Count-Up**:
```jsx
import { useSpring, animated } from '@react-spring/web';

const { number } = useSpring({
  from: { number: 0 },
  to: { number: 17 },
  delay: 200,
});

<animated.div>
  {number.to(n => n.toFixed(0))}x
</animated.div>
```

**Parallax Backgrounds**:
```jsx
<div style={{
  backgroundPositionY: `${scrollY * 0.5}px`
}}>
  {/* Background moves slower than scroll */}
</div>
```

---

## 🎨 JusticeHub Branding Integration

### Color Palette Usage

**Primary Colors**:
- **Green (#27ae60)**: Positive data, community programs, growth, hope
- **Orange (#e57a28)**: Neutral data, mixed sentiment, warnings, highlights
- **Dark Panel (rgba(10, 16, 24, 0.92))**: Section backgrounds
- **White**: Text, clean space

**Emotional Color Mapping**:
- **Hope/Success**: Green gradients, soft glows
- **Crisis/Concern**: Red to orange gradients
- **Evidence/Data**: Cool blues with orange accents
- **Community**: Warm earth tones with green highlights

### Typography

**Headlines** (from theme.css):
```css
.scroll-headline {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 1.2;
  color: white;
}
```

**Data Stats** (large numbers):
```css
.stat-large {
  font-family: var(--font-mono);
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 700;
  color: var(--contained-green);
  text-shadow: 0 0 20px rgba(39, 174, 96, 0.3);
}
```

**Quotes**:
```css
.quote-text {
  font-family: Georgia, serif;
  font-size: clamp(1.25rem, 3vw, 2rem);
  font-style: italic;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
}
```

### Visual Effects

**Glass Morphism** (JusticeHub panels):
```css
.glass-panel {
  background: var(--contained-panel-dark);
  backdrop-filter: blur(16px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: var(--contained-shadow-strong);
}
```

**Glow Effects** (data highlights):
```css
.data-glow {
  box-shadow:
    0 0 20px rgba(39, 174, 96, 0.3),
    0 0 40px rgba(39, 174, 96, 0.1);
}
```

**Gradient Overlays** (images):
```css
.image-overlay {
  position: relative;
}

.image-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(10, 16, 24, 0) 0%,
    rgba(10, 16, 24, 0.8) 100%
  );
}
```

---

## 📱 Responsive Design

### Mobile-First Approach

**Breakpoints**:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile Adaptations**:
1. **Vertical layouts** instead of side-by-side
2. **Simplified animations** (less parallax)
3. **Touch-friendly** interactions (larger tap targets)
4. **Reduced motion** option (respect prefers-reduced-motion)
5. **Progressive enhancement** (core content without JS)

**Example**:
```css
/* Mobile-first */
.comparison-split {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Desktop enhancement */
@media (min-width: 1024px) {
  .comparison-split {
    flex-direction: row;
    gap: 4rem;
  }
}
```

---

## 🎯 Emotional Journey Map

**Goal**: Move viewer from awareness → understanding → action

### Act 1: The Crisis (Awareness)
- **Emotion**: Shock, concern
- **Visuals**: Harsh institutional imagery
- **Data**: Negative statistics (17x overrepresentation)
- **Color**: Cold blues, greys
- **Music/Sound**: (Optional) Somber tone

### Act 2: Traditional Knowledge (Understanding)
- **Emotion**: Hope, respect
- **Visuals**: Cultural connection, elders, country
- **Data**: Success rates of community programs
- **Color**: Warm earth tones, green
- **Music/Sound**: (Optional) Cultural soundscapes

### Act 3: Evidence Speaks (Conviction)
- **Emotion**: Clarity, determination
- **Visuals**: Data comparisons, stark contrasts
- **Data**: Side-by-side program effectiveness
- **Color**: Green vs red (clear choice)
- **Music/Sound**: (Optional) Building momentum

### Act 4: Media Awakening (Validation)
- **Emotion**: Momentum, change is possible
- **Visuals**: Headlines, sentiment shifts
- **Data**: Timeline showing positive change
- **Color**: Gradient from cold to warm
- **Music/Sound**: (Optional) Uplifting

### Act 5: Call to Action (Empowerment)
- **Emotion**: Inspired, ready to act
- **Visuals**: Future-focused, hopeful
- **Data**: Programs you can support
- **Color**: Bright green, sunrise tones
- **CTA**: Clear next steps

---

## 🚀 Technical Implementation Plan

### Phase 1: Core Components
1. ScrollytellingLayout wrapper
2. StepSection component
3. StickyVisualization container
4. ImageWithOverlay component
5. DataStatistic animated component

### Phase 2: Visualizations
1. SentimentTimeline (D3.js)
2. TopicBurst (D3.js force)
3. ProgramComparison (split view)
4. QuoteCarousel (auto-scroll)
5. AustraliaMap (SVG pins)

### Phase 3: Integration
1. Fetch data from Supabase
2. Connect to ALMA analytics
3. Real-time updates
4. Share functionality
5. Analytics tracking

### Phase 4: Polish
1. Loading states
2. Error handling
3. Accessibility (ARIA labels)
4. Performance optimization
5. SEO metadata

---

**Next**: Build the React components with this visual strategy! 🎨
