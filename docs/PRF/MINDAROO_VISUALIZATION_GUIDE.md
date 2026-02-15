# Mindaroo Pitch Visualizations Guide
**Clean, Professional, On-Brand Infographics**

## Brand Guidelines

### Mindaroo Foundation Color Palette

**Primary Colors:**
- **Supernova Yellow** (Primary Accent): `#FFCD00`
- **Pumpkin Skin** (Secondary Dark): `#A4620C`
- **Roman** (Secondary Light): `#DB615C`

**Supporting Neutral Colors:**
- **Dark Gray** (Text): `#2D3748`
- **Medium Gray** (Supporting): `#718096`
- **Light Gray** (Backgrounds): `#F7FAFC`
- **White**: `#FFFFFF`

### Typography

**Headlines/Titles:**
- Public Sans (Google Font) - Bold, 24-36pt
- Alternative: Inter, Helvetica, Arial

**Body Text:**
- Public Sans Regular/Medium - 10-14pt
- Clean, highly legible sans-serif

### Design Principles

1. **High Data-Ink Ratio**: Remove all decorative elements
2. **Direct Labeling**: No separate legends - label directly on charts
3. **Minimal Gridlines**: Use subtle gray (#E2E8F0) or remove entirely
4. **White Space**: 20-30px between related items, 40-60px between sections
5. **Single Visual Focus**: One key message per graphic
6. **Accessible**: WCAG 2.1 AA contrast ratios (4.5:1 minimum)

---

## Visualization Requirements

### 1. Indigenous Youth Justice Gap Infographic

**Purpose:** Show 17x overrepresentation statistic with visual impact

**Content:**
- Main stat: 17x overrepresentation
- Comparative bars: Indigenous vs non-Indigenous detention rates
- Map of Australia with jurisdictional heatmap

**Design Specifications:**

```
Structure:
┌─────────────────────────────────────────┐
│  THE INDIGENOUS YOUTH JUSTICE GAP       │
├─────────────────────────────────────────┤
│                                         │
│  [17× LARGE YELLOW NUMBER]              │
│  overrepresentation in detention        │
│                                         │
│  ┌─────────────────┐                   │
│  │ Indigenous      │ ████████████████  │ 17%
│  │ Non-Indigenous  │ █                 │ 1%
│  └─────────────────┘                   │
│                                         │
│  [AUSTRALIA MAP - HEATMAP]              │
│  - NT/WA darkest (highest disparity)   │
│  - Other states proportional            │
│                                         │
└─────────────────────────────────────────┘
```

**Color Usage:**
- Primary statistic: Supernova Yellow (#FFCD00)
- Indigenous bar: Pumpkin Skin (#A4620C)
- Non-Indigenous bar: Light Gray (#CBD5E0)
- Map heatmap: Gradient from Light Gray → Pumpkin Skin → Roman (#DB615C)

**Dimensions:** 1200×800px (web) / A4 landscape (print)

**Data Sources:**
- AIHW Youth Justice Report 2023-24
- State/Territory-specific detention rates

---

### 2. Platform Evolution Timeline

**Purpose:** Show transformation from beta → community-owned platform

**Content:**
- Current: Beta platform ($303K built)
- Year 3: Fully scaled (100+ stories, 6 communities)
- Year 5: Community-owned ACCO

**Design Specifications:**

```
Tree Growth Metaphor:

Year 0 (Now)          Year 3              Year 5
   🌱               🌳                  🌳🌳
 [Beta]         [Scaled]        [Community Owned]

Underground "roots" show:
- Community engagement (increasing depth)
- Revenue streams (spreading)
- Indigenous leadership (strengthening)
```

**Visual Elements:**
- Simple line-drawn tree silhouettes (not literal tree images)
- Geometric representation
- Growth indicators with statistics
- Root system shown as expanding network lines

**Color Usage:**
- Year 0: Light Gray (#CBD5E0) - seedling stage
- Year 3: Pumpkin Skin (#A4620C) - growth stage
- Year 5: Supernova Yellow (#FFCD00) - mature stage
- Roots: Medium Gray (#718096) connecting lines

**Dimensions:** 1600×600px (horizontal timeline)

---

### 3. Budget Flow Diagram (Sankey)

**Purpose:** Show $10.5M budget distribution with community focus

**Content:**
- Total $10.5M splits to 6 major categories
- Highlight 26% flowing to communities
- Show year-over-year changes

**Design Specifications:**

```
Sankey Flow Diagram:

$10.5M TOTAL →  26% → Communities ($2.70M)    [YELLOW THICK]
             →  38% → Staff ($3.95M)          [GRAY]
             →   9% → Platform ($970K)         [GRAY]
             →   8% → Training ($825K)         [GRAY]
             →  11% → Operations ($1.14M)      [GRAY]
             →   9% → Overhead ($970K)         [GRAY]
```

**Color Usage:**
- Community flow: Supernova Yellow (#FFCD00) - widest/brightest
- All other flows: Medium Gray (#718096)
- Labels: Dark Gray (#2D3748)
- Background: White

**Dimensions:** 1200×800px

**Tools:** D3.js, RAWGraphs, or Figma with Sankey plugin

---

### 4. Community Compensation Breakdown

**Purpose:** Show how $180K per community is distributed

**Content:**
- 6 categories of community spending
- Visual hierarchy by amount
- Icons for each category (minimal, line-art style)

**Design Specifications:**

```
Stacked Bar or Pie Chart:

$180K PER COMMUNITY BREAKDOWN:

$50K  Infrastructure         ████████  28%
$50K  Knowledge Holders      ████████  28%
$30K  Content Creation       █████     17%
$20K  Gatherings & Events    ███       11%
$15K  Equipment              ██        8%
$15K  Cultural Protocols     ██        8%
```

**Icon Style:**
- Minimal line icons (2px stroke)
- Single color (Pumpkin Skin #A4620C)
- Examples: building, people, camera, gathering, laptop, document

**Color Usage:**
- Bars: Gradient from Supernova Yellow to Pumpkin Skin
- Icons: Pumpkin Skin (#A4620C)
- Text: Dark Gray (#2D3748)
- Background: Light Gray (#F7FAFC)

**Dimensions:** 800×800px (square)

**Alternative:** Horizontal stacked bar with icons inline

---

### 5. 3-Year Transformation Timeline

**Purpose:** Show progression from beta to community ownership

**Content:**
- Key milestones across 3 years
- Team size changes (12 FTE → 9 FTE)
- Community engagement growth
- Revenue trajectory ($0 → $60K)

**Design Specifications:**

```
Ascending Staircase/Arrow Metaphor:

                                    ╱ ACCO Transition
                          ╱        ╱  Revenue: $60K
                         ╱  Y3    ╱   Team: 9 FTE
               ╱        ╱        ╱    20 trained
              ╱  Y2    ╱        ╱
     ╱       ╱        ╱        ╱
    ╱  Y1   ╱        ╱        ╱
   ╱       ╱        ╱        ╱
  ╱       ╱        ╱        ╱
 ─────────────────────────────────> Time
 Beta    Foundation  Growth  Transform
```

**Milestones to Include:**
- **Year 1:** Platform built, 6 communities engaged, 4 trainees
- **Year 2:** Full engagement, 100+ stories, revenue begins
- **Year 3:** Community-led development, 15-20 trained, $60K revenue
- **Year 5:** ACCO transition complete, $400-600K revenue

**Color Usage:**
- Y1: Light gradient (Gray → Light Yellow)
- Y2: Medium gradient (Yellow → Orange)
- Y3: Bold gradient (Orange → Full Yellow)
- Milestones: Dark Gray dots/markers
- Metrics: Dark Gray text

**Dimensions:** 1600×900px (wide landscape)

---

## Recommended Tools & Workflow

### Option 1: Napkin AI (Recommended)

**Pros:**
- AI-powered text-to-visual conversion
- Fast iteration - paste text, get instant visuals
- No design expertise required
- Easy customization of colors, layouts, icons
- Export to SVG, PNG, PDF

**Workflow:**
1. Copy visualization prompt below
2. Paste into Napkin AI
3. Review generated visual options
4. Customize with Mindaroo brand colors
5. Remove any emojis or decorative elements
6. Export as SVG for web, PNG for presentations

**Napkin AI Text Prompts by Visualization:**

#### 1. Indigenous Youth Justice Gap Infographic

```
The Indigenous Youth Justice Gap

Indigenous young people are detained at 17 times the rate of non-Indigenous young people.

DETENTION RATES (per 10,000 youth aged 10-17):
- Indigenous young people: 34.2 per 10,000
- Non-Indigenous young people: 2.0 per 10,000
- Ratio: 17:1 overrepresentation

DETENTION POPULATION COMPOSITION:
- Indigenous young people: 54% of those in detention (but only 5.5% of general youth population)
- Non-Indigenous young people: 46% of those in detention (but 94.5% of general youth population)

Key regional disparities (rates per 10,000):
- Northern Territory: 91.8 (Indigenous) vs 3.8 (non-Indigenous) = 24x
- Western Australia: 52.7 vs 2.1 = 25x
- Queensland: 38.1 vs 1.9 = 20x
- New South Wales: 26.4 vs 1.7 = 16x
- South Australia: 22.3 vs 1.5 = 15x
- Victoria: 14.2 vs 1.2 = 12x

Data source: AIHW Youth Justice Report 2023-24

Visual style: Show two bar charts side by side - one showing detention RATES per 10,000, another showing percentage COMPOSITION of detention population. Include Australia map with regional heatmap showing overrepresentation ratios. Use yellow for emphasis on main 17x statistic.
```

**Customization Instructions:**
- Change main "17×" to Supernova Yellow (#FFCD00)
- Use Pumpkin Skin (#A4620C) for Indigenous bar
- Use Light Gray (#CBD5E0) for Non-Indigenous bar
- Map heatmap: Gradient from Light Gray → Pumpkin Skin → Roman (#DB615C)
- Remove any emoji or decorative icons
- Ensure Public Sans font if available

---

#### 2. Platform Evolution Timeline

```
Justice Hub Platform Evolution: From Beta to Community Ownership

Year 0 (Now): Beta Platform
- Platform built: $303K invested
- Foundation established
- Initial community engagement beginning

Year 3: Fully Scaled Platform
- 100+ Indigenous youth justice stories published
- 6 communities actively engaged
- Platform generating impact metrics
- Revenue model established

Year 5: Community-Owned ACCO
- Indigenous-led Aboriginal Community Controlled Organisation
- Full community governance and ownership
- Self-sustaining revenue: $400K-600K annually
- 20 trained Indigenous knowledge holders

Visual metaphor: Tree growth showing maturation from seedling to mature tree. Roots below ground represent:
- Community engagement (deepening)
- Revenue streams (spreading)
- Indigenous leadership (strengthening)

Visual style: Simple geometric tree silhouettes, not literal photos. Show progression left to right with underground "root system" network lines.
```

**Customization Instructions:**
- Year 0/Seedling: Light Gray (#CBD5E0)
- Year 3/Growth: Pumpkin Skin (#A4620C)
- Year 5/Mature: Supernova Yellow (#FFCD00)
- Root system: Medium Gray (#718096) connecting lines
- Keep design minimal and abstract, not photorealistic

---

#### 3. Budget Flow Diagram (Sankey)

```
$10.5M Three-Year Budget Distribution

Total Investment: $10.5 million over 3 years

Budget flows to:

26% → Communities: $2.70M (Direct community compensation)
38% → Staff: $3.95M (12 FTE team, Indigenous majority)
9% → Platform: $970K (Development and maintenance)
8% → Training: $825K (15-20 Indigenous trainees)
11% → Operations: $1.14M (Office, equipment, events)
9% → Overhead: $970K (Admin, insurance, contingency)

Key message: Over one quarter (26%) of total investment flows directly to communities.

Visual style: Sankey flow diagram. Emphasize the community flow with bright color, other flows in neutral gray.
```

**Customization Instructions:**
- Community flow line: Supernova Yellow (#FFCD00) - make widest/brightest
- All other flow lines: Medium Gray (#718096)
- Text labels: Dark Gray (#2D3748)
- Background: White
- Ensure community percentage is most visually prominent

---

#### 4. Community Compensation Breakdown

```
How $180K Per Community Is Invested

Each of 6 communities receives $180,000 over 3 years, distributed as:

$50K (28%) - Infrastructure & Tech: Community-owned equipment, internet connectivity, tech infrastructure
$50K (28%) - Knowledge Holders: Compensation for Elders and knowledge keepers sharing stories
$30K (17%) - Content Creation: Story collection, video production, documentation
$20K (11%) - Gatherings & Events: Community meetings, story sharing events, cultural gatherings
$15K (8%) - Equipment: Cameras, recording devices, computers for community use
$15K (8%) - Cultural Protocols: Ensuring proper cultural review and permission processes

Total per community: $180,000
Total across 6 communities: $1.08 million

Visual style: Horizontal stacked bar chart with minimal line icons for each category. Show percentages and dollar amounts clearly.
```

**Customization Instructions:**
- Bars: Gradient from Supernova Yellow (#FFCD00) to Pumpkin Skin (#A4620C)
- Icons: Simple line style in Pumpkin Skin, 2px stroke weight
- Text: Dark Gray (#2D3748)
- Background: Light Gray (#F7FAFC)
- Remove any decorative elements, keep icons minimal

---

#### 5. 3-Year Transformation Timeline

```
Justice Hub: 3-Year Transformation to Community Ownership

Year 1 - Foundation
- Platform built and launched
- 6 communities initially engaged
- 4 Indigenous trainees begin program
- Team: 12 FTE
- Revenue: $0 (investment phase)

Year 2 - Growth
- 100+ Indigenous youth justice stories published
- Full community engagement across all 6 communities
- Revenue model implemented
- 10 Indigenous trainees in program
- Team: 12 FTE
- Revenue: $20K

Year 3 - Transformation
- Community-led platform development
- 15-20 trained Indigenous knowledge holders
- Preparation for ACCO transition
- Team transitions: 9 FTE
- Revenue: $60K

Year 5 (Vision) - Community Ownership
- Full ACCO transition complete
- Indigenous-led governance
- Self-sustaining operations
- Revenue: $400K-600K annually

Visual style: Ascending staircase or upward arrow showing progression. Each year is a step up. Include key metrics at each stage.
```

**Customization Instructions:**
- Year 1: Light gradient (Gray #CBD5E0 → Light Yellow)
- Year 2: Medium gradient (Yellow → Orange #A4620C)
- Year 3: Bold gradient (Orange → Full Yellow #FFCD00)
- Milestone markers: Dark Gray (#2D3748) dots
- Use upward-trending visual metaphor (stairs, arrow, ascending line)

---

### Napkin AI Pro Tips

1. **Remove Emojis:** Napkin AI may add emojis automatically - delete them in the customization step
2. **Color Picker:** Use the exact hex codes provided (#FFCD00, #A4620C, #DB615C)
3. **Font Selection:** Choose Public Sans if available, otherwise Inter or Arial
4. **Simplify:** If the initial visual is too decorative, use "simplify" or "minimal" commands
5. **Export Settings:**
   - SVG for web use (scalable, embeddable)
   - PNG at 2x resolution for presentations
   - Transparent background option for overlays

---

### Option 2: Figma

**Pros:**
- Full control over design
- Easy iteration and client review
- Export to SVG/PNG
- Component reusability

**Workflow:**
1. Install Figma Charts plugin
2. Use Public Sans font from Google Fonts
3. Set up color styles with Mindaroo palette
4. Create components for repeated elements
5. Export as SVG for web, PNG for presentations

**Figma Plugins to Install:**
- Charts
- Content Reel (for data input)
- Stark (for accessibility checking)
- Remove BG (if needed)

### Option 2: Programmatic (D3.js/Python)

**Pros:**
- Data-driven
- Easy to update with new data
- Reproducible

**Workflow:**
1. Create data in JSON/CSV format
2. Use D3.js for web-based charts
3. Use Python (matplotlib/plotly) for publication-quality
4. Apply Mindaroo color palette
5. Export as SVG

**Python Example:**
```python
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

# Mindaroo colors
SUPERNOVA = '#FFCD00'
PUMPKIN = '#A4620C'
ROMAN = '#DB615C'
DARK_GRAY = '#2D3748'

# Set style
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['Arial', 'Helvetica']
```

### Option 3: RAWGraphs + Figma

**Pros:**
- Quick Sankey/complex diagrams
- Clean minimal output
- Easy customization in Figma

**Workflow:**
1. Prepare data in CSV
2. Upload to RAWGraphs.io
3. Choose visualization type
4. Export as SVG
5. Import to Figma for styling refinement

---

## Design Checklist

Before finalizing each visualization:

### Visual Quality
- [ ] High contrast (4.5:1 minimum) for text
- [ ] No decorative elements or "chart junk"
- [ ] Consistent spacing (20-30px between items)
- [ ] Readable at 50% scale
- [ ] Direct labels (no legends unless necessary)
- [ ] Gridlines removed or very subtle (#E2E8F0)

### Brand Alignment
- [ ] Uses Mindaroo color palette only
- [ ] Primary yellow (#FFCD00) used for key data
- [ ] Public Sans font throughout
- [ ] Clean, professional aesthetic
- [ ] No emojis or decorative icons
- [ ] Minimal, elegant design

### Content Accuracy
- [ ] All statistics verified and sourced
- [ ] Labels clear and concise
- [ ] Units specified (K, M, %, etc.)
- [ ] Data sources cited
- [ ] Year/date clearly indicated

### Technical Requirements
- [ ] SVG format for web
- [ ] PNG at 2x resolution for presentations
- [ ] PDF for print materials
- [ ] Transparent background option
- [ ] Files named consistently: `mindaroo-[name]-viz.svg`

---

## File Naming Convention

```
mindaroo-justice-gap-infographic.svg
mindaroo-platform-evolution-timeline.svg
mindaroo-budget-flow-diagram-new.svg
mindaroo-community-compensation-breakdown.svg
mindaroo-transformation-timeline.svg
```

Store in: `/public/figma-exports/mindaroo-visuals/`

---

## Next Steps

1. **Create Figma file** with Mindaroo brand kit setup
2. **Build component library** with reusable elements
3. **Develop each visualization** following specifications above
4. **Review with stakeholders** for accuracy and clarity
5. **Export in multiple formats** for different use cases
6. **Update documents** to embed final visualizations

---

## Resources

**Primary Tool:**
- [Napkin AI](https://napkin.ai) - AI-powered text-to-visual conversion (Recommended)

**Fonts:**
- [Public Sans on Google Fonts](https://fonts.google.com/specimen/Public+Sans)

**Color Tools:**
- [Coolors Palette](https://coolors.co/ffcd00-a4620c-db615c-2d3748-f7fafc)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Alternative Visualization Tools:**
- [Figma](https://figma.com)
- [RAWGraphs](https://rawgraphs.io)
- [D3.js Gallery](https://observablehq.com/@d3/gallery)
- [Plotly Python](https://plotly.com/python/)

**Inspiration:**
- [The Economist Graphics](https://www.economist.com/graphic-detail)
- [Information is Beautiful](https://www.informationisbeautiful.net/)
- [Flowing Data](https://flowingdata.com/)

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Status:** Ready for Implementation
