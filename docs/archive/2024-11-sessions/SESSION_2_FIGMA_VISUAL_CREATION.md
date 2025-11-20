# Session 2: Figma Visual Creation Plan

**Date:** January 2025
**Focus:** Creating professional Figma designs for all JusticeHub visualizations
**Status:** READY TO START

---

## 🎯 Session Overview

We'll create **6 core visualizations** in Figma, one by one, starting with the flagship **Sovereignty Flywheel**. Each visual will be:
- Professional and presentation-ready
- Exported in multiple formats (PNG, SVG, PDF, PowerPoint-ready)
- Aligned with strategic documents
- Documented for future use

---

## 📊 Visualization Inventory (Prioritized)

### **Priority 1: Sovereignty Flywheel** ⭐⭐⭐ (SESSION 2 - TODAY)
**Why first:** Flagship concept, most important for Mindaroo pitch
**Current state:** [SovereigntyFlywheel.tsx](src/components/SovereigntyFlywheel.tsx) - Interactive React component
**Complexity:** HIGH (6 steps, multiple sections, rich content)

**6 Steps to visualize:**
1. 🧠 **Community Intelligence** - Communities paid for their knowledge
2. 📈 **Platform Value Grows** - Best practice library expands
3. 🌐 **Network Effect** - More communities want in
4. 💰 **Financial Sustainability** - Value creates revenue
5. ⚡ **Systemic Change** - Youth justice transforms
6. 👑 **Community Ownership** - Communities govern the platform

**Key elements:**
- Circular flywheel layout with 6 steps
- Central goal: "COMMUNITY SOVEREIGNTY" 🎯
- "The Why" banner: Break Dependency • Indigenous Sovereignty • Fair Compensation
- "How It Works" 3-step flow
- "What's On The Platform" content grid
- "Why This Matters" impact boxes

---

### **Priority 2: Budget Scenarios Comparison** 💰 (SESSION 3)
**Why second:** Clear financial ask for Mindaroo
**Current state:** Data in THREE_SCENARIOS_BUDGET.md (not yet visualized)
**Complexity:** MEDIUM (table/chart design)

**What to show:**
- LEAN ($5.9M) vs BASE ($10.5M) ⭐ vs UPPER ($17.6M)
- Communities: 4 vs 6 vs 10
- Indigenous developers: 2 vs 4 vs 6
- Year-by-year breakdown
- What each scenario delivers

---

### **Priority 3: Network Map** 🌐 (SESSION 4)
**Why third:** Shows transformation visually
**Current state:** [NetworkMap.tsx](src/components/visuals/NetworkMap.tsx) - SVG-based before/after
**Complexity:** MEDIUM (SVG network diagram)

**What to show:**
- BEFORE: Isolated red circles (disconnected communities)
- AFTER: Connected green circles (linked to central JusticeHub hub)
- Transformation from fragmentation to collaboration

---

### **Priority 4: System Transformation** ⚖️ (SESSION 5)
**Why fourth:** Shows impact on youth justice system
**Current state:** [SystemTransformation.tsx](src/components/visuals/SystemTransformation.tsx) - SVG flowchart
**Complexity:** MEDIUM (before/after flow diagram)

**What to show:**
- OLD SYSTEM (red): Punitive, detention-focused, harmful
- NEW SYSTEM (green): Healing, community-centered, culturally grounded
- JusticeHub as the catalyst in the middle

---

### **Priority 5: Local to Scale** 📈 (SESSION 6)
**Why fifth:** Shows knowledge flow mechanism
**Current state:** [LocalToScale.tsx](src/components/visuals/LocalToScale.tsx) - 3-column flow
**Complexity:** MEDIUM (sequential flow with arrows)

**What to show:**
- STEP 1 (yellow): Elder in Alice Springs shares healing practice
- STEP 2 (blue): Knowledge captured on JusticeHub platform
- STEP 3 (green): Practitioner in Sydney implements same practice
- Multiplier effect section

---

### **Priority 6: Connection Web** 🕸️ (SESSION 7)
**Why sixth:** Shows stakeholder value proposition
**Current state:** [ConnectionWeb.tsx](src/components/visuals/ConnectionWeb.tsx) - Radial network
**Complexity:** MEDIUM (radial stakeholder diagram)

**What to show:**
- Central JusticeHub hub (blue circle)
- 6 stakeholder nodes: Young People, Families, Communities, Practitioners, Researchers, Policy Makers
- Colored connection lines
- "How JusticeHub Connects Everyone"

---

## 🛠️ Figma Creation Methods

### **Method 1: Figma Make** (AI-Powered) ⭐ RECOMMENDED FOR SESSION 2

**Pros:**
- Fastest for complex designs
- Uses Claude 3.7 Sonnet (same LLM as Claude Code!)
- Creates editable Figma layers directly
- Great for iterating on design

**Cons:**
- Requires Figma paid plan ($16/month+)
- Results may need refinement

**Best for:** Sovereignty Flywheel (complex, multi-section design)

---

### **Method 2: html.to.design MCP** (Code → Figma)

**Pros:**
- Direct integration with Claude Code
- Converts existing React/HTML components
- Free (just needs Figma plugin)
- Preserves code structure as layers

**Cons:**
- Complex interactive elements may not translate perfectly
- Need to have MCP configured (✅ already done!)

**Best for:** Network Map, System Transformation, Local to Scale, Connection Web (SVG-based components)

---

### **Method 3: html.to.design Plugin** (Manual)

**Pros:**
- No MCP needed
- Works with any HTML/CSS
- Free

**Cons:**
- Manual copy/paste workflow
- Less integrated

**Best for:** Backup method if MCP has issues

---

## 🎨 SESSION 2 FOCUS: Sovereignty Flywheel

### **Visual Specifications**

**Canvas size:** 1920 × 1080px (PowerPoint/presentation standard)
**Alternative:** 1200 × 1200px (square for social media)

**Color Palette:**
- Primary Blue: `#2563EB` (trustworthy, professional)
- Primary Purple: `#7C3AED` (creative, transformative)
- Goal/Success: `#14B8A6` (teal - achievement)
- Community: `#DC2626` (red - passion, energy)
- Revenue: `#D97706` (orange - growth)
- Steps gradient: Blue → Purple

**Typography:**
- Headings: Bold, sans-serif (Inter, Roboto, or Figma default)
- Body: Regular, sans-serif
- Numbers: Monospace for step numbers

---

### **Figma Make Prompt for Sovereignty Flywheel**

When we create this in Figma Make, we'll use this prompt:

```
Create a professional circular flywheel diagram titled "The Sovereignty Flywheel" showing how community intelligence drives systemic change in youth justice.

LAYOUT:
- Circular arrangement with 6 steps radiating around a central goal
- Central circle (large, teal gradient): "COMMUNITY SOVEREIGNTY" with 🎯 icon
- Top banner (blue-purple gradient): "Break Dependency • Indigenous Sovereignty • Fair Compensation"

6 STEPS (clockwise from top):
1. 🧠 Community Intelligence - "Communities paid for their knowledge" - Blue circle
2. 📈 Platform Value Grows - "Best practice library expands" - Blue-green circle
3. 🌐 Network Effect - "More communities want in" - Green circle
4. 💰 Financial Sustainability - "Value creates revenue" - Yellow-orange circle
5. ⚡ Systemic Change - "Youth justice transforms" - Orange-red circle
6. 👑 Community Ownership - "Communities govern the platform" - Purple circle

Each step should have:
- Large emoji icon
- Bold title
- Subtitle in smaller text
- Step number badge (1-6)
- Curved arrows connecting to next step (showing flow)

BOTTOM SECTION - "How It Works" (3 columns):
Column 1 (green): 🗣️ Communities Share - "Communities document what works, compensated fairly"
Column 2 (blue): 🔗 Platform Connects - "Stories, programs, evidence tagged and connected"
Column 3 (purple): 🌟 Young People Benefit - "Practitioners implement proven approaches"

DESIGN STYLE:
- Clean, modern, professional
- Gradient backgrounds for depth
- Plenty of white space
- Rounded corners (border-radius: 16px)
- Subtle shadows for elevation
- Icons as large emoji (48px+)

COLOR SCHEME:
- Blue: #2563EB
- Purple: #7C3AED
- Teal (goal): #14B8A6
- Orange: #D97706
- White backgrounds with colored accents

Make it visually striking and suitable for a foundation pitch presentation.
```

---

### **Alternative: Simplified Flywheel (If Figma Make is too complex)**

**Simplified version focuses on:**
- 6-step circle only (no additional sections)
- Central goal
- Clear step progression
- Minimalist, clean design

This can be created in 10-15 minutes with Figma Make, then enhanced manually.

---

## 📋 Session 2 Workflow

### **Pre-Work (5 minutes)**
1. ✅ Review SovereigntyFlywheel.tsx component
2. ✅ Extract 6 step titles, subtitles, descriptions
3. ✅ Verify alignment with strategic documents
4. ✅ Prepare Figma Make prompt

### **Creation Phase (20-30 minutes)**

**Option A: Using Figma Make**
1. Open Figma Desktop
2. Create new file: "JusticeHub Visualizations"
3. Launch Figma Make
4. Input the Sovereignty Flywheel prompt
5. Wait for generation (~2-5 minutes)
6. Review and refine design
7. Adjust colors, spacing, typography as needed

**Option B: Using html.to.design MCP**
1. Ask Claude Code to generate static HTML version of flywheel
2. Use MCP to send to Figma
3. Refine in Figma

### **Refinement Phase (15-20 minutes)**
1. Adjust typography (ensure readability)
2. Verify color alignment with brand guidelines
3. Check spacing and visual hierarchy
4. Add any missing elements
5. Test at different zoom levels

### **Export Phase (10 minutes)**
1. **PNG Export** (for presentations, web)
   - @2x resolution (3840 × 2160px for 1920×1080 canvas)
   - Background: White or transparent

2. **SVG Export** (for print, infinite scaling)
   - Outline strokes
   - Convert text to outlines (for font compatibility)

3. **PDF Export** (for pitch documents)
   - Single page
   - High quality settings

4. **PowerPoint-ready PNG**
   - 1920 × 1080px exactly
   - White background
   - Save as `sovereignty-flywheel-powerpoint.png`

### **Documentation Phase (10 minutes)**
1. Create `SOVEREIGNTY_FLYWHEEL_VISUAL.md` documentation
2. Include:
   - Figma file link
   - Export file locations
   - Design specifications (colors, fonts, sizes)
   - Usage guidelines
   - Version history

---

## 📁 File Naming Convention

All exports saved to: `/public/figma-exports/`

**Naming pattern:**
- `{visual-name}-{version}-{format}.{ext}`
- Example: `sovereignty-flywheel-v1-presentation.png`
- Example: `sovereignty-flywheel-v1-print.pdf`
- Example: `sovereignty-flywheel-v1-vector.svg`

**Versions:**
- v1: Initial creation
- v2: After Mindaroo feedback
- final: Approved version

---

## 🎯 Success Criteria for Session 2

By the end of Session 2, we should have:

### **Deliverables:**
- [ ] Sovereignty Flywheel designed in Figma
- [ ] Exported in 4 formats (PNG @2x, PNG presentation, SVG, PDF)
- [ ] Saved to `/public/figma-exports/`
- [ ] Documentation created
- [ ] Figma file link recorded

### **Quality Checks:**
- [ ] All 6 steps clearly visible
- [ ] Central goal prominent
- [ ] Color scheme aligned with brand guidelines
- [ ] Typography readable at presentation size
- [ ] Professional appearance (suitable for Mindaroo pitch)
- [ ] Exports tested (opened in PowerPoint, PDF viewer, web browser)

---

## 📅 Sessions 3-7 Preview

### **Session 3: Budget Scenarios**
- Create table/chart comparing LEAN/BASE/UPPER
- Export for pitch deck

### **Session 4: Network Map**
- Use html.to.design MCP to import SVG
- Refine in Figma
- Export before/after versions

### **Session 5: System Transformation**
- Use html.to.design MCP for flowchart
- Create OLD → JUSTICEHUB → NEW flow
- Export

### **Session 6: Local to Scale**
- Create 3-step flow diagram
- Show knowledge multiplication
- Export

### **Session 7: Connection Web**
- Create radial stakeholder network
- Show JusticeHub connecting all parties
- Export

---

## 🔗 Resources

**Documentation:**
- [VISUALIZATIONS-TO-FIGMA-GUIDE.md](public/figma-designs/VISUALIZATIONS-TO-FIGMA-GUIDE.md) - Complete workflow guide
- [CLAUDE-TO-FIGMA-WORKFLOW.md](public/figma-designs/CLAUDE-TO-FIGMA-WORKFLOW.md) - MCP integration guide

**Code Components:**
- [SovereigntyFlywheel.tsx](src/components/SovereigntyFlywheel.tsx) - Flagship visualization
- [src/components/visuals/](src/components/visuals/) - All other visualizations

**Strategic Documents:**
- [MINDAROO_ONE_PAGER.md](public/docs/strategic/MINDAROO_ONE_PAGER.md) - Updated with $9.5-13.0M budget
- [MINDAROO_STRATEGIC_PITCH.md](public/docs/strategic/MINDAROO_STRATEGIC_PITCH.md) - Full pitch document
- [THREE_SCENARIOS_BUDGET.md](public/docs/THREE_SCENARIOS_BUDGET.md) - Detailed budget breakdown

---

## 💡 Tips for Success

### **When using Figma Make:**
1. **Be specific in prompts** - Include colors, sizes, exact text
2. **Iterate quickly** - Generate, review, regenerate with refinements
3. **Save variations** - Keep different versions to compare
4. **Manual refinement is OK** - AI creates 80%, you perfect the 20%

### **When using html.to.design MCP:**
1. **Simplify complex components** - Remove interactive elements first
2. **Use static SVG** - Works better than dynamic elements
3. **Test in browser first** - Make sure HTML renders correctly
4. **Clean up in Figma** - Imported layers may need organization

### **General design principles:**
1. **Hierarchy matters** - Most important = biggest, boldest
2. **White space is your friend** - Don't cram everything
3. **Consistency** - Same colors, fonts, sizes across all visuals
4. **Test at presentation size** - View at actual pitch screen resolution

---

## ✅ Ready to Begin Session 2?

**Prerequisites check:**
- [x] Strategic documents aligned (budget figures updated)
- [x] Session 1 complete (alignment analysis done)
- [x] Visualizations reviewed (know what we're creating)
- [x] Figma methods understood (Figma Make vs MCP)
- [ ] Figma Desktop app open
- [ ] User ready to create!

**Let's create the Sovereignty Flywheel!** 🎯

---

**Created:** January 2025
**Status:** READY TO START
**Next:** Open Figma Desktop and begin Session 2
