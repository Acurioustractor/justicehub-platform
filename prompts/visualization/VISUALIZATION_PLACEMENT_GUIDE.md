# Visualization Placement Guide for One-Pager

Quick reference for where to place each SVG visualization in the Mindaroo one-pager.

## File Naming Convention

Save your exported SVGs as:
1. `mindaroo-justice-gap-infographic.svg`
2. `mindaroo-platform-evolution-timeline.svg`
3. `mindaroo-budget-flow-diagram-new.svg`
4. `mindaroo-community-compensation-breakdown.svg`
5. `mindaroo-transformation-timeline.svg`

**Save Location:** `/public/figma-exports/mindaroo-visuals/`

---

## Placement in One-Pager

### Visualization 1: Indigenous Youth Justice Gap
**File:** [src/app/wiki/mindaroo-pitch/one-pager/page.mdx](src/app/wiki/mindaroo-pitch/one-pager/page.mdx)

**Find this text (around line 55):**
```
💡 VISUALIZATION PROMPT
Create infographic: "The Indigenous Youth Justice Gap" showing 17x overrepresentation statistic with visual comparison of detention rates.
```

**Replace with:**
```jsx
<div className="my-8">
  <Image
    src="/figma-exports/mindaroo-visuals/mindaroo-justice-gap-infographic.svg"
    alt="Indigenous Youth Justice Gap - 17x overrepresentation in detention"
    width={1200}
    height={800}
    className="rounded-lg shadow-lg border-2 border-gray-200"
  />
</div>
```

---

### Visualization 2: Platform Evolution Timeline
**File:** [src/app/wiki/mindaroo-pitch/one-pager/page.mdx](src/app/wiki/mindaroo-pitch/one-pager/page.mdx)

**Find this text (around line 144):**
```
💡 VISUALIZATION PROMPT
Create timeline: "From Beta to Community Ownership" showing progression from current platform → Year 3 scaled → Year 5 community-owned ACCO. Use tree growth metaphor.
```

**Replace with:**
```jsx
<div className="my-8">
  <Image
    src="/figma-exports/mindaroo-visuals/mindaroo-platform-evolution-timeline.svg"
    alt="Platform Evolution Timeline - Beta to Community Ownership"
    width={1600}
    height={600}
    className="rounded-lg shadow-lg border-2 border-gray-200"
  />
</div>
```

---

### Visualization 3: Budget Flow Diagram
**File:** [src/app/wiki/mindaroo-pitch/one-pager/page.mdx](src/app/wiki/mindaroo-pitch/one-pager/page.mdx)

**Find this text (around line 273):**
```
💡 VISUALIZATION PROMPT
Create Sankey diagram: "$10.5M Budget Flow" showing how total investment splits across 6 major categories, with 26% to communities highlighted in bold color.
```

**Replace with:**
```jsx
<div className="my-8">
  <Image
    src="/figma-exports/mindaroo-visuals/mindaroo-budget-flow-diagram-new.svg"
    alt="Budget Flow Diagram - $10.5M distribution with 26% to communities"
    width={1200}
    height={800}
    className="rounded-lg shadow-lg border-2 border-gray-200"
  />
</div>
```

---

### Visualization 4: Community Compensation Breakdown
**File:** [src/app/wiki/mindaroo-pitch/one-pager/page.mdx](src/app/wiki/mindaroo-pitch/one-pager/page.mdx)

**Find this text (around line 325):**
```
💡 VISUALIZATION PROMPT
Create breakdown chart: "$180K Per Community" showing how annual community compensation splits across infrastructure, knowledge holders, content, events, equipment, protocols.
```

**Replace with:**
```jsx
<div className="my-8">
  <Image
    src="/figma-exports/mindaroo-visuals/mindaroo-community-compensation-breakdown.svg"
    alt="Community Compensation Breakdown - How $180K is distributed"
    width={800}
    height={800}
    className="rounded-lg shadow-lg border-2 border-gray-200"
  />
</div>
```

---

### Visualization 5: 3-Year Transformation Timeline
**File:** [src/app/wiki/mindaroo-pitch/one-pager/page.mdx](src/app/wiki/mindaroo-pitch/one-pager/page.mdx)

**Find this text (around line 366):**
```
💡 VISUALIZATION PROMPT
Create transformation roadmap: "3-Year Journey to Sovereignty" showing progression through Foundation → Growth → Transformation phases with key milestones and metrics.
```

**Replace with:**
```jsx
<div className="my-8">
  <Image
    src="/figma-exports/mindaroo-visuals/mindaroo-transformation-timeline.svg"
    alt="3-Year Transformation Timeline - Foundation to Community Sovereignty"
    width={1600}
    height={900}
    className="rounded-lg shadow-lg border-2 border-gray-200"
  />
</div>
```

---

## Import Statement

Make sure the one-pager file has this import at the top:

```jsx
import Image from 'next/image'
```

If it's already there, you're good to go!

---

## Quick Workflow

1. Export SVG from Napkin AI
2. Save to `/public/figma-exports/mindaroo-visuals/[filename].svg`
3. Find the "💡 VISUALIZATION PROMPT" text in one-pager
4. Replace entire prompt block with the `<div className="my-8">...</div>` code above
5. Test locally at http://localhost:4000/wiki/mindaroo-pitch/one-pager

---

## Notes

- The `width` and `height` are suggestions - adjust based on your actual SVG dimensions
- The `shadow-lg` and `border-2` give professional styling
- All images use `rounded-lg` for consistent rounded corners
- Alt text is descriptive for accessibility

---

**Created:** January 2025
**For:** Mindaroo Foundation Pitch Materials
