# JusticeHub Visualizations → Figma Complete Guide

**Three powerful ways to create professional Figma designs from your JusticeHub visualizations**

---

## 🎯 Overview: Your Three Figma Options

### **Option 1: Figma Make** (AI-Powered, Built into Figma)
**What it is:** Figma's built-in AI tool using Claude 3.7 Sonnet to generate functional prototypes

**Best for:** Creating entirely new designs from prompts, rapid prototyping
**Availability:** Requires Figma paid plan ($16/month+)
**Workflow:** Prompt → Figma Make generates design → Appears directly in Figma

### **Option 2: html.to.design MCP** (Direct Claude Code Integration)
**What it is:** MCP server that sends HTML/CSS from Claude Code directly to Figma

**Best for:** Converting existing code into editable Figma layers
**Availability:** Free with Figma plugin + Claude Code/Desktop
**Workflow:** Claude generates HTML → MCP sends to Figma → Editable layers

### **Option 3: html.to.design Plugin** (Manual Import)
**What it is:** Figma plugin that imports HTML/CSS code or URLs

**Best for:** Quick imports when MCP isn't available
**Availability:** Free Figma plugin
**Workflow:** Generate code → Copy → Paste into plugin → Import to Figma

---

## 📊 Your Current Visualizations

### 1. **Sovereignty Flywheel** ⭐ FLAGSHIP
[SovereigntyFlywheel.tsx](../../../src/components/SovereigntyFlywheel.tsx)

**What it shows:**
- 6-step circular flywheel showing how community intelligence creates systemic change
- Interactive: Click segments to see details
- Central "Community Sovereignty" goal
- "How It Works" flow diagram
- "What's On The Platform" content grid
- Impact statistics and outcomes

**Visual complexity:** HIGH (interactive, multi-section layout)
**Best generation method:** Figma Make or MCP (to preserve interactivity concepts)

---

### 2. **International Programs Map** 🗺️
[InternationalProgramsMap.tsx](../../../src/components/InternationalProgramsMap.tsx)

**What it shows:**
- Interactive world map using Leaflet
- Markers for youth justice programs globally
- Geocoded locations across North America, Europe, Africa, Latin America, Asia Pacific
- Click to view program details

**Visual complexity:** MEDIUM (requires map library)
**Best generation method:** Plugin import of static mockup or use Figma Make to create map visual concept
**Note:** Interactive maps don't translate directly; create static visual representation

---

### 3. **Network Map** (Before/After) 🌐
[NetworkMap.tsx](../../../src/components/visuals/NetworkMap.tsx)

**What it shows:**
- BEFORE: Isolated communities (red circles, disconnected)
- AFTER: Connected network (green circles linked to central blue JusticeHub hub)
- Shows transformation from isolation to connection
- Impact boxes at bottom

**Visual complexity:** MEDIUM (SVG-based)
**Best generation method:** html.to.design MCP or Figma Make

---

### 4. **System Transformation** (Before/After) ⚖️
[SystemTransformation.tsx](../../../src/components/visuals/SystemTransformation.tsx)

**What it shows:**
- OLD SYSTEM (left): Red flow showing punitive, detention-focused approach
- NEW SYSTEM (right): Green flow showing healing, community-centered approach
- Central JusticeHub catalyst with platform stats
- Bottom impact statement

**Visual complexity:** MEDIUM (SVG flowchart)
**Best generation method:** html.to.design MCP or Figma Make

---

### 5. **Local to Scale** (Knowledge Flow) 📈
[LocalToScale.tsx](../../../src/components/visuals/LocalToScale.tsx)

**What it shows:**
- STEP 1 (yellow): Elder in Alice Springs shares healing practice
- STEP 2 (blue): Knowledge captured on JusticeHub platform
- STEP 3 (green): Practitioner in Sydney implements same practice
- "Multiplier Effect" bottom section

**Visual complexity:** MEDIUM (3-column flow with arrows)
**Best generation method:** html.to.design MCP or Figma Make

---

### 6. **Connection Web** (Stakeholder Network) 🕸️
[ConnectionWeb.tsx](../../../src/components/visuals/ConnectionWeb.tsx)

**What it shows:**
- Central JusticeHub hub (blue circle)
- 6 stakeholder nodes in circle: Young People, Families, Communities, Practitioners, Researchers, Policy Makers
- Colored connections showing relationships
- Impact boxes at bottom

**Visual complexity:** MEDIUM (radial network diagram)
**Best generation method:** html.to.design MCP or Figma Make

---

### 7. **Data Visualization Components** 📊
[data-visualization.tsx](../../../src/components/ui/data-visualization.tsx)

**Reusable components:**
- `ImpactMetric` - Single stat with icon, trend
- `SuccessRateDisplay` - Circular progress chart
- `CostComparison` - Side-by-side comparison bars
- `GeographicImpact` - State-by-state breakdown
- `OutcomeTimeline` - Bar chart over time
- `ImpactDashboard` - Complete dashboard layout

**Visual complexity:** LOW-MEDIUM (component library)
**Best generation method:** Create in Figma Make as design system components

---

## 🚀 Complete Workflows

### **Workflow A: Using Figma Make** (Fastest for New Designs)

#### Requirements:
- Figma Desktop app
- Figma paid plan ($16/month+ for full seat)

#### Steps:

**1. Open Figma Desktop**
   - Launch Figma Desktop (not web)
   - Create new file or open existing

**2. Open Figma Make**
   - Click Figma Make in left toolbar
   - Or use keyboard shortcut

**3. Describe Your Visual**
   ```
   Example prompt for Sovereignty Flywheel:

   "Create a circular flywheel diagram with 6 steps arranged around a central
   goal. Each step should be a circle with an icon and title. The center circle
   should say 'COMMUNITY SOVEREIGNTY'. Use blue and purple gradient colors.

   The 6 steps are:
   1. Community Intelligence - 🧠 - Communities paid for their knowledge
   2. Platform Value Grows - 📈 - Best practice library expands
   3. Network Effect - 🌐 - More communities want in
   4. Financial Sustainability - 💰 - Value creates revenue
   5. Systemic Change - ⚡ - Youth justice transforms
   6. Community Ownership - 👑 - Communities govern the platform

   Add a 'How It Works' section below with 3 cards showing the process flow.
   Use Tailwind CSS for styling. Make it professional and polished."
   ```

**4. Iterate with Figma Make**
   - Review generated design
   - Ask for changes: "Make the circles larger", "Change to green color scheme"
   - Use edit tool to point at specific elements

**5. Refine in Figma**
   - Design appears as editable layers
   - Adjust colors, spacing, typography
   - Create components

**6. Export**
   - Export as PNG, SVG, or PDF
   - Or use directly in presentations

---

### **Workflow B: Using html.to.design MCP** (Best for Code → Design)

#### Requirements:
- html.to.design MCP configured in `.mcp.json` ✅ (Already done!)
- Claude Code/Desktop
- Figma Desktop app
- html.to.design plugin installed in Figma

#### Steps:

**1. Generate Visual in Claude Code**
   ```
   Example prompt:

   "Create the Network Map visualization showing BEFORE (isolated communities)
   and AFTER (connected network through JusticeHub).

   Use SVG or HTML/Tailwind to create:
   - Left side: 6 red circles (isolated communities) with labels
   - Center: Large arrow with 'JusticeHub Transforms' text
   - Right side: 6 green circles connected to central blue hub
   - Bottom: 4 impact boxes

   Import to Figma when ready."
   ```

**2. Claude Auto-Imports**
   - Claude generates the HTML/CSS/SVG
   - Automatically calls `import-html` MCP tool
   - Design appears in Figma

**3. View in Figma Desktop**
   - Open Figma Desktop
   - See imported design as editable layers
   - All elements are properly named and organized

**4. Refine**
   - Adjust design in Figma
   - Create components
   - Add variants and interactions

---

### **Workflow C: Using Plugin (Manual Import)**

#### Requirements:
- html.to.design plugin installed
- Generated HTML file or URL

#### Steps:

**1. Generate HTML File**
   ```bash
   # In Claude Code:
   "Create an HTML file for the System Transformation visual at
   public/figma-designs/system-transformation.html"
   ```

**2. Preview in Browser**
   ```bash
   open public/figma-designs/system-transformation.html
   # Or serve locally:
   npx serve public/figma-designs
   ```

**3. Import to Figma**
   - Open Figma Desktop
   - Run html.to.design plugin
   - Choose "Import from URL" or "Import from HTML"
   - Paste localhost URL or HTML code
   - Click Import

**4. Edit in Figma**
   - Design appears as editable layers
   - Refine and create components

---

## 📋 Detailed Generation Guide: Each Visualization

### **1. Sovereignty Flywheel**

#### Figma Make Prompt:
```
Create an interactive sovereignty flywheel visualization:

LAYOUT:
- Top banner: "The Why" - "Break Dependency • Indigenous Sovereignty • Fair Compensation"
- Center: Large teal circle (264px) with 🎯 icon and "COMMUNITY SOVEREIGNTY" text
- Around center: 6 step circles arranged in circular pattern (clockwise from top)

STEPS (each is a circle 128px, numbered badge, icon, title):
1. 🧠 Community Intelligence | Communities paid for their knowledge
2. 📈 Platform Value Grows | Best practice library expands
3. 🌐 Network Effect | More communities want in
4. 💰 Financial Sustainability | Value creates revenue
5. ⚡ Systemic Change | Youth justice transforms
6. 👑 Community Ownership | Communities govern the platform

BELOW FLYWHEEL:
- Active step detail card (blue gradient background)
- "How It Works" section with 3 gradient cards (green→blue→purple)
- "What's On The Platform" purple section with 4 cards
- "Why This Matters" section with 6 impact cards
- Bottom info cards explaining flywheel concept

COLORS:
- Primary: Blue (#2563EB) and Purple (#7C3AED) gradients
- Steps: When active - blue/purple gradient; inactive - white with gray border
- Accent: Teal (#14B8A6) for center goal
- Impact: Green (#059669) highlights

Make it professional, use rounded corners, shadows, and modern design.
```

#### Claude Code → MCP Approach:
```bash
# In Claude Code:
"Read the SovereigntyFlywheel.tsx component and create an enhanced HTML version
with Tailwind CSS that captures all the interactive elements and visual design.
Import to Figma when ready."
```

---

### **2. International Programs Map**

#### Figma Make Prompt:
```
Create a world map visualization showing global youth justice programs:

LAYOUT:
- Clean, minimal world map (continents outline in light gray)
- Blue pin markers on cities: Los Angeles, Chicago, New York, London, Birmingham,
  South Africa, Kenya, Brazil, Argentina, Auckland
- Legend showing:
  • Program locations (blue pins)
  • Number of programs: 521
  • Countries represented: 15+

STYLE:
- Map: Light gray continents on white background
- Pins: Blue circles (#2563EB) with white border
- Modern, clean design
- Title: "Global Youth Justice Programs"

Add statistics panel on right:
- Total Programs: 521
- Total Organizations: 450+
- Countries: 15+
- Continents: 6

Use professional cartography-inspired design.
```

**Note:** For actual interactive maps, keep the Leaflet implementation in code. Use Figma for static visual mockups.

---

### **3. Network Map (Before/After)**

#### Figma Make Prompt:
```
Create a before/after comparison showing network transformation:

LEFT SIDE - "BEFORE: Isolated Communities"
- Title in red (#DC2626)
- 6 red circles (#DC2626, 30% opacity) scattered randomly
- Labels: Alice Springs, Bourke, Moree, Darwin, Sydney, Brisbane
- Subtitle: "Knowledge stays local, invisible to others"

CENTER - Large arrow pointing right
- Text: "JusticeHub Transforms"
- Blue arrow (#2563EB)

RIGHT SIDE - "AFTER: Connected Network"
- Title in green (#059669)
- Central blue hub (#2563EB) labeled "JusticeHub"
- 6 green circles (#059669, 80% opacity) connected to hub with green lines
- Same community labels
- Subtitle: "Community intelligence scales nationwide"

BOTTOM - 4 impact boxes:
- "Alice Springs learns from Bourke"
- "Darwin finds what works in Moree"
- "Knowledge valued and compensated"
- "Young people supported everywhere"

Size: 1200x600px
Use professional SVG-style graphics
```

---

### **4. System Transformation (Before/After)**

#### Figma Make Prompt:
```
Create a system transformation flowchart showing OLD vs NEW approaches:

LEFT COLUMN - "OLD SYSTEM" (Red theme #DC2626)
Top to bottom flow with arrows:
1. Young Person Struggles
2. Punitive Intervention
3. Detention & Isolation
4. Family & Community Cut Off
5. Recidivism - 75% Return Rate

Each step: Red box (300x80px), rounded corners, with arrow to next

CENTER - JusticeHub catalyst
- Blue circle (#2563EB)
- Text: "JusticeHub Transforms"
- Stats below: "38+ Stories • 521 Programs • 450+ Organisations"
- Large arrow pointing right

RIGHT COLUMN - "NEW SYSTEM" (Green theme #059669)
Top to bottom flow with arrows:
1. Young Person Identified Early
2. Community Healing Response
3. Cultural Connection
4. Family & Community Engaged
5. Healing - Better Outcomes

Each step: Green box (400x80px), rounded corners, with arrow to next

BOTTOM - Impact statement box:
"Community intelligence replaces punishment with healing, isolation with connection"

Size: 1200x700px
Professional flowchart design
```

---

### **5. Local to Scale (Knowledge Flow)**

#### Figma Make Prompt:
```
Create a 3-step knowledge scaling flow:

STEP 1 (Yellow/Orange theme #F59E0B) - "LOCAL"
Box 280x320px:
- Title: "STEP 1: LOCAL"
- Content: "Elder in Alice Springs shares healing practice"
- Details:
  • Cultural connection
  • Talking circles
  • Family involvement
- Results: "12 young people supported, 0 returned to detention"

ARROW 1: Blue arrow right
- Text above: "Shared on"

STEP 2 (Blue theme #2563EB) - "PLATFORM"
Box 320x320px:
- Title: "STEP 2: PLATFORM"
- JusticeHub logo circle
- Content: "Knowledge Captured"
  ✓ Story documented
  ✓ Program tagged
  ✓ Evidence recorded
- "Connections Made"
  → Similar communities
  → Interested practitioners
  → Researchers & funders

ARROW 2: Green arrow right
- Text above: "Implemented by"

STEP 3 (Green theme #059669) - "SCALE"
Box 280x320px:
- Title: "STEP 3: SCALE"
- Content: "Practitioner in Sydney implements same practice"
- Adaptation:
  • Same cultural core
  • Local community input
  • Evidence-based approach
- "National Impact: Healing spreads, Young people benefit"

BOTTOM: "The Multiplier Effect"
- "One Elder in Alice Springs → Platform connection → Practitioners nationwide"
- "Local knowledge valued, communities compensated, young people everywhere benefit"

Size: 1200x600px
Clean, modern 3-column layout
```

---

### **6. Connection Web (Stakeholder Network)**

#### Figma Make Prompt:
```
Create a radial stakeholder connection diagram:

CENTER HUB:
- Large blue circle (#2563EB) 80px radius
- Text: "JusticeHub Platform"

SURROUNDING STAKEHOLDERS (6 nodes in circle, 220px from center):
Arranged clockwise from top:

1. Young People (Red #DC2626, 0°)
   - "Find hope, see possibilities"

2. Families (Orange #EA580C, 60°)
   - "Stay connected, understand options"

3. Communities (Amber #D97706, 120°)
   - "Share knowledge, get compensated"

4. Practitioners (Green #059669, 180°)
   - "Learn best practice, improve outcomes"

5. Researchers (Blue #2563EB, 240°)
   - "Access evidence, validate programs"

6. Policy Makers (Purple #7C3AED, 300°)
   - "Use data, make informed decisions"

Each stakeholder node:
- Outer circle (60px radius, 20% opacity) in their color
- Inner circle (45px radius, 80% opacity) in their color
- White text labels
- Connection description below in italic

CONNECTIONS:
- Solid lines from hub to each stakeholder (40% opacity in stakeholder color)
- Dotted lines between some stakeholders showing cross-connections

BOTTOM: 4 impact boxes:
- "Breaking Down Silos - Everyone sees the same knowledge"
- "Building Trust - Transparency creates understanding"
- "Scaling Support - Young people benefit everywhere"
- "Systemic Change - Whole system improves together"

Title: "How JusticeHub Connects Everyone"
Subtitle: "Breaking down silos, building understanding"

Size: 1200x700px
Modern network diagram design
```

---

### **7. Data Visualization Components**

#### Figma Make Prompt (Design System):
```
Create a design system for data visualization components:

COMPONENT 1: Impact Metric Card
- White card with border
- Large number at top (4xl, bold, monospace)
- Label below
- Optional icon above number
- Optional trend indicator (up/down arrow with percentage)
- Size: 250x200px

COMPONENT 2: Success Rate Circle
- Circular progress indicator
- Background circle (light gray)
- Progress arc (black, animated feel)
- Center: Large percentage number
- Label below
- Size: 192x192px

COMPONENT 3: Cost Comparison Bars
- Two side-by-side cards (green vs red)
- Card titles: "COMMUNITY PROGRAMS" vs "DETENTION SYSTEM"
- Large number (currency format)
- Horizontal bar showing relative value
- Savings calculation below

COMPONENT 4: Geographic Impact Grid
- Grid of state/region boxes
- Each box: State abbreviation, program count, youth served count
- 4 columns layout

COMPONENT 5: Outcome Timeline Bar Chart
- Vertical bar chart
- Y-axis labels (percentage)
- X-axis labels (dates/quarters)
- Black bars showing values
- Grid lines

Create all as reusable components with variants.
Colors: Black primary, gray neutrals, green success, red comparison
Typography: Monospace for numbers, sans-serif for labels
```

---

## 🎨 Design System Guidelines

### Color Palette

**Brand Colors:**
```
Blue Primary: #2563EB
Purple Accent: #7C3AED
Teal Goal: #14B8A6
```

**System Colors:**
```
Red (Old/Problem): #DC2626
Green (New/Solution): #059669
Orange (Warning): #F59E0B
```

**Stakeholder Colors:**
```
Young People: #DC2626
Families: #EA580C
Communities: #D97706
Practitioners: #059669
Researchers: #2563EB
Policy Makers: #7C3AED
```

**Neutrals:**
```
Gray 50: #F9FAFB
Gray 200: #E5E7EB
Gray 600: #4B5563
Gray 900: #111827
```

### Typography

**Headings:**
- H1: 48px (3xl), bold, gray-900
- H2: 36px (2xl), bold, gray-900
- H3: 28px (xl), bold, gray-900
- H4: 20px (lg), bold, gray-900

**Body:**
- Large: 18px (lg), gray-700
- Regular: 16px (base), gray-700
- Small: 14px (sm), gray-600
- Tiny: 12px (xs), gray-500

**Special:**
- Stats/Numbers: Monospace, 64px, bold
- Labels: 14px, semibold, uppercase, tracking-wide

### Spacing

**Scale (px):**
- 4, 8, 12, 16, 24, 32, 48, 64, 96, 128

**Common Uses:**
- Card padding: 24px (p-6) or 32px (p-8)
- Section spacing: 48px (mb-12) or 64px (mb-16)
- Element gaps: 16px (gap-4) or 24px (gap-6)

### Components

**Cards:**
- Background: white
- Border: 2px solid gray-200
- Border radius: 12px (rounded-xl)
- Shadow: lg
- Hover: border-blue-400, shadow-xl

**Buttons:**
- Primary: bg-blue-600, hover:bg-blue-700
- Secondary: border-2 border-gray-300, hover:bg-gray-50
- Padding: px-6 py-3
- Border radius: 8px (rounded-lg)

**Arrows/Connectors:**
- Thickness: 3-4px
- Style: Solid for main flows, dashed for cross-connections
- Arrowheads: 10px marker

---

## 💡 Pro Tips

### For Best Results in Figma Make:

1. **Be Specific About Layout**
   - Give exact pixel sizes when you can
   - Describe positioning: "arranged in circle", "3-column grid"
   - Mention spacing: "48px gap between sections"

2. **Include All Content**
   - Provide actual text, not "Lorem ipsum"
   - Include icons (emoji or icon names)
   - Specify all data points

3. **Describe Visual Style**
   - Colors with hex codes
   - Typography details
   - Shadows, borders, rounded corners

4. **Request Iterations**
   - "Make the circles larger"
   - "Change to purple color scheme"
   - "Add more spacing between elements"

5. **Use References**
   - "Like the Sovereignty Flywheel but with 8 steps"
   - "Similar to Network Map but showing different data"

### For html.to.design MCP:

1. **Use Tailwind Classes**
   - Better layer naming in Figma
   - Easier to edit properties

2. **Semantic HTML**
   - Proper heading hierarchy
   - Meaningful class names
   - Section tags for organization

3. **Flexbox/Grid**
   - Converts to Figma auto-layout
   - Maintains responsive behavior

4. **SVG for Icons**
   - Becomes editable vector layers
   - Maintains quality

### Common Pitfalls to Avoid:

❌ **Don't:**
- Use complex JavaScript animations (won't import)
- Rely on external libraries (may not work)
- Use absolute positioning everywhere (breaks auto-layout)
- Create overly nested structures (hard to edit in Figma)

✅ **Do:**
- Keep layouts simple and clear
- Use standard web patterns
- Include all visual details in prompt
- Test import with simple version first

---

## 🎯 Quick Reference: Which Method When?

| Scenario | Best Method | Why |
|----------|-------------|-----|
| **Brand new visualization idea** | Figma Make | Fastest, AI generates from scratch |
| **Adapting existing code** | html.to.design MCP | Preserves structure, automatic |
| **Quick mockup needed** | Figma Make | Rapid iteration |
| **Converting React component** | html.to.design MCP | Handles complex layouts |
| **Need exact code match** | Plugin import | Manual control |
| **Building design system** | Figma Make | Component creation |
| **No MCP access** | Plugin | Fallback option |
| **Iterating on design** | Figma Make | Easy refinement |

---

## 📚 Example Prompts Library

### Save these for quick access:

**Generate Network Visual:**
```bash
"Create the Network Map visualization showing isolated communities
transforming into a connected network through JusticeHub. Use the
before/after layout with red (before) and green (after) color schemes.
Import to Figma."
```

**Generate Flywheel:**
```bash
"Create the Sovereignty Flywheel with 6 steps in a circle around
a central 'Community Sovereignty' goal. Use blue/purple gradients.
Import to Figma when ready."
```

**Generate Flow Diagram:**
```bash
"Create a 3-step flow showing how local knowledge scales:
LOCAL (yellow) → PLATFORM (blue) → SCALE (green).
Include arrows and impact statement. Import to Figma."
```

**Create Data Viz Component:**
```bash
"Create a reusable Impact Metric component card showing a large
statistic with icon, trend indicator, and description. Make it
a Figma component with variants."
```

---

## 🚀 Next Steps

### Immediate Actions:

1. **Choose your method:**
   - Have Figma paid plan? → Use Figma Make
   - Using Claude Code? → Use html.to.design MCP
   - Just need quick import? → Use plugin

2. **Start with one visualization:**
   - Suggest: Network Map (simplest)
   - Or: Sovereignty Flywheel (most impactful)

3. **Test the workflow:**
   - Generate → Import → Refine → Export
   - Learn what works best for you

4. **Build your library:**
   - Create all 6 visualizations
   - Save as Figma components
   - Build design system

### Advanced Workflows:

1. **Create variation system:**
   - Use Figma Make to generate base designs
   - Create variants for different data
   - Build templates for presentations

2. **Automate exports:**
   - Set up Figma → PNG/SVG export
   - Create slide deck templates
   - Build pitch materials

3. **Integrate with docs:**
   - Export visualizations
   - Include in markdown docs
   - Update strategic materials

---

## ✅ Success Checklist

Before generating:
- [ ] Chosen which method to use
- [ ] Figma Desktop app installed (if using MCP/plugin)
- [ ] MCP configured (if using MCP method)
- [ ] Plugin installed (if using plugin method)
- [ ] Figma paid plan active (if using Figma Make)

After generating:
- [ ] Design appears correctly in Figma
- [ ] All layers are editable
- [ ] Colors match brand guidelines
- [ ] Typography is readable
- [ ] Layout is well-organized
- [ ] Created components for reuse

Ready for production:
- [ ] Design refined and polished
- [ ] Components created
- [ ] Variants added (if needed)
- [ ] Exported as PNG/SVG
- [ ] Documented in design system
- [ ] Shared with team

---

## 🎉 Summary

You now have **three powerful methods** to create professional Figma designs:

1. **Figma Make:** AI generates designs from prompts (fastest for new ideas)
2. **html.to.design MCP:** Code → Figma automatically (best for existing code)
3. **html.to.design Plugin:** Manual import (fallback option)

**All 6 JusticeHub visualizations** can be generated using any method:
- Sovereignty Flywheel ⭐
- International Programs Map 🗺️
- Network Map 🌐
- System Transformation ⚖️
- Local to Scale 📈
- Connection Web 🕸️

**Complete prompts provided** for each visualization with detailed specs.

**Next:** Choose a visualization, pick a method, and start creating!

---

_Created: January 2025 | JusticeHub Design System_
_Tools: Figma Make, html.to.design MCP, Claude Code_
