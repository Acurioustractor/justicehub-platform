# Figma Designs & Visualizations

This directory contains resources for creating professional Figma designs from JusticeHub code.

---

## 📂 What's in This Directory

| File | Purpose |
|------|---------|
| **enhanced-wiki-article.html** | Example enhanced wiki article layout ready to import to Figma |
| **CLAUDE-TO-FIGMA-WORKFLOW.md** | Complete guide for Claude Code → Figma workflow using MCP |
| **VISUALIZATIONS-TO-FIGMA-GUIDE.md** | Comprehensive guide for all JusticeHub visualizations → Figma |

---

## 🚀 Quick Start

### Want to import the wiki design to Figma?

1. **Open the example:**
   ```bash
   open enhanced-wiki-article.html
   ```

2. **Import to Figma:**
   - Open Figma Desktop
   - Run the html.to.design plugin
   - Paste the file path or URL
   - Click Import

### Want to create visualizations in Figma?

**Read**: [VISUALIZATIONS-TO-FIGMA-GUIDE.md](VISUALIZATIONS-TO-FIGMA-GUIDE.md)

Three methods available:
- **Figma Make** (AI-powered, built into Figma)
- **html.to.design MCP** (automatic from Claude Code)
- **html.to.design Plugin** (manual import)

---

## 📊 Available Visualizations

All of these can be generated in Figma:

1. **Sovereignty Flywheel** ⭐ - 6-step circular flywheel
2. **International Programs Map** 🗺️ - World map with program locations
3. **Network Map** 🌐 - Before/after: isolated → connected
4. **System Transformation** ⚖️ - Old vs new youth justice system
5. **Local to Scale** 📈 - Knowledge flow from local to national
6. **Connection Web** 🕸️ - Stakeholder network diagram

---

## 🎯 Most Common Workflows

### **Workflow 1: New Design from Scratch**
**Use:** Figma Make

1. Open Figma Desktop
2. Launch Figma Make
3. Describe your visual (see guide for prompts)
4. Design appears in Figma
5. Refine and export

### **Workflow 2: Convert Existing Code**
**Use:** html.to.design MCP

1. In Claude Code: "Create [visualization] and import to Figma"
2. Claude generates HTML/CSS
3. MCP automatically sends to Figma
4. Design appears as editable layers
5. Refine in Figma

### **Workflow 3: Manual Import**
**Use:** html.to.design Plugin

1. Generate HTML file in Claude Code
2. Open html.to.design plugin in Figma
3. Import the HTML or URL
4. Design appears in Figma
5. Refine and export

---

## 📚 Documentation

- **[CLAUDE-TO-FIGMA-WORKFLOW.md](CLAUDE-TO-FIGMA-WORKFLOW.md)** - Complete MCP workflow guide
- **[VISUALIZATIONS-TO-FIGMA-GUIDE.md](VISUALIZATIONS-TO-FIGMA-GUIDE.md)** - All visualizations with generation prompts

---

## ✅ Setup Checklist

Before you start:

**For Figma Make:**
- [ ] Figma Desktop app installed
- [ ] Figma paid plan ($16/month+)
- [ ] Familiarity with Figma interface

**For html.to.design MCP:**
- [ ] Claude Code or Claude Desktop installed
- [ ] MCP configured in `.mcp.json` ✅ (Already done!)
- [ ] Figma Desktop app installed
- [ ] html.to.design plugin installed in Figma

**For html.to.design Plugin:**
- [ ] Figma Desktop app installed
- [ ] html.to.design plugin installed
- [ ] Ability to generate HTML/CSS

---

## 🎨 Design System

### Colors
- **Primary:** Blue (#2563EB), Purple (#7C3AED)
- **Goal:** Teal (#14B8A6)
- **Problem:** Red (#DC2626)
- **Solution:** Green (#059669)

### Typography
- **Headings:** Bold, sans-serif
- **Numbers:** Monospace, bold
- **Body:** Regular, sans-serif

### Components
- **Cards:** White, 2px gray border, rounded-xl, shadow-lg
- **Buttons:** Blue primary, hover states
- **Visualizations:** SVG-based, clean lines

---

## 💡 Tips for Success

1. **Start simple:** Try importing the wiki design first
2. **Use prompts:** Copy prompts from the guides
3. **Iterate:** Make changes in Figma or re-generate
4. **Create components:** Turn designs into reusable components
5. **Export:** Save as PNG/SVG for presentations

---

## 🔗 Related Resources

- **Current Visualizations:** `/src/components/visuals/`
- **Wiki Pages:** `/src/app/wiki/`
- **MCP Configuration:** `/.mcp.json`

---

## 🎉 Get Started

1. **Choose a method** (Figma Make, MCP, or Plugin)
2. **Pick a visualization** to generate
3. **Follow the guide** for that method
4. **Create in Figma** and refine
5. **Export** for use in presentations

**Need help?** Check the comprehensive guides in this directory.

---

_Created: January 2025 | JusticeHub Project_
