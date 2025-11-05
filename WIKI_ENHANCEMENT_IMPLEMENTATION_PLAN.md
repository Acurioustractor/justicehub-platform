# JusticeHub Wiki Enhancement Implementation Plan

## Executive Summary

Transform the JusticeHub wiki from static markdown rendering to an **interactive, media-rich documentation platform** similar to Notion/GitBook, with callouts, video embeds, tabs, and dynamic components to effectively communicate the Mindaroo strategic pitch and platform capabilities.

---

## 1. Current State Analysis

### Current Implementation
- **Location:** `/wiki` and `/wiki/[slug]`
- **Tech Stack:**
  - `react-markdown` with `remark-gfm`
  - Static markdown files in `public/docs/`
  - Basic styling with Tailwind prose classes
- **File Structure:**
```
src/app/wiki/
├── page.tsx              # Wiki home with categories
├── [slug]/page.tsx       # Dynamic markdown renderer
└── layout.tsx

public/docs/
├── STRATEGIC_OVERVIEW.md
├── THREE_SCENARIOS_BUDGET.md
├── MINDAROO_STRATEGIC_PITCH.md
└── ... (20+ markdown files)
```

### Problems with Current Implementation
1. ❌ **No interactive components** - Can't embed live demos, interactive charts
2. ❌ **No callouts** - Important info blends into text (warnings, tips, notes)
3. ❌ **No video embeds** - Can't showcase community stories, platform demos
4. ❌ **No tabs** - Can't organize budget scenarios side-by-side
5. ❌ **Poor visual hierarchy** - Long documents feel overwhelming
6. ❌ **No image galleries** - Can't display visualizations created in Napkin.ai
7. ❌ **Limited interactivity** - Static experience doesn't showcase platform capabilities

### What Works Well ✅
- File-based routing with slug mapping
- Sidebar navigation with categories
- Clean, readable typography
- Breadcrumb navigation
- Fast static generation

---

## 2. Proposed Solution: MDX + Interactive Components

### Why MDX?
**MDX = Markdown + JSX** - Write markdown with embedded React components

**Benefits:**
- ✅ Keep existing markdown files (backward compatible)
- ✅ Add interactive components where needed
- ✅ Embed videos, charts, live demos
- ✅ Create custom callouts, tabs, accordions
- ✅ Show/hide complex content
- ✅ Better user experience for long documents

### Architecture Decision

**Option A: Full MDX Migration** (Recommended)
- Convert `.md` → `.mdx` files
- Use `@next/mdx` with App Router
- File-based routing: `app/wiki/strategic-pitch/page.mdx`
- Custom components available in all MDX files

**Option B: Hybrid Approach**
- Keep `.md` files in `public/docs/`
- Enhance renderer with custom components
- Use `next-mdx-remote` for dynamic rendering
- More complex but preserves existing files

**✅ RECOMMENDATION: Option A** - Cleaner, better DX, full Next.js integration

---

## 3. Technical Implementation Plan

### Phase 1: Install Dependencies & Configure (30 mins)

**Install packages:**
```bash
npm install @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
npm install rehype-highlight rehype-slug rehype-autolink-headings
```

**Update `next.config.mjs`:**
```javascript
import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeHighlight,
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
    ],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  experimental: {
    mdxRs: true, // Use faster Rust-based MDX compiler
  },
}

export default withMDX(nextConfig)
```

**Create `mdx-components.tsx` in root:**
```tsx
import type { MDXComponents } from 'mdx/types'
import { Callout } from '@/components/wiki/Callout'
import { VideoEmbed } from '@/components/wiki/VideoEmbed'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/wiki/Tabs'
import { ImageGallery } from '@/components/wiki/ImageGallery'
import { StatCard } from '@/components/wiki/StatCard'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout,
    VideoEmbed,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    ImageGallery,
    StatCard,
    ...components,
  }
}
```

---

### Phase 2: Build Interactive Components (2 hours)

#### Component 1: Callout
**Purpose:** Highlight important information with visual distinction

**Usage in MDX:**
```mdx
<Callout type="info">
  JusticeHub platform currently has **521 programs** catalogued and searchable.
</Callout>

<Callout type="success" title="Evidence-Based Impact">
  Bourke Justice Reinvestment achieved **79% reduction** in youth detention over 10 years.
</Callout>

<Callout type="warning">
  Community compensation must be at **consultant rates** ($1,000/session for Elders).
</Callout>

<Callout type="error">
  Never refer to programs as "services" - this is government language, not community-led.
</Callout>
```

**Implementation:** `src/components/wiki/Callout.tsx`
```tsx
import { ReactNode } from 'react'
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

type CalloutType = 'info' | 'success' | 'warning' | 'error'

const calloutStyles = {
  info: {
    container: 'bg-blue-50 border-l-4 border-blue-500',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    Icon: Info,
  },
  success: {
    container: 'bg-green-50 border-l-4 border-green-500',
    icon: 'text-green-600',
    title: 'text-green-900',
    Icon: CheckCircle,
  },
  warning: {
    container: 'bg-yellow-50 border-l-4 border-yellow-500',
    icon: 'text-yellow-600',
    title: 'text-yellow-900',
    Icon: AlertTriangle,
  },
  error: {
    container: 'bg-red-50 border-l-4 border-red-500',
    icon: 'text-red-600',
    title: 'text-red-900',
    Icon: XCircle,
  },
}

interface CalloutProps {
  type?: CalloutType
  title?: string
  children: ReactNode
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const style = calloutStyles[type]
  const Icon = style.Icon

  return (
    <div className={`my-6 p-4 rounded-r-lg ${style.container}`}>
      <div className="flex gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.icon}`} />
        <div className="flex-1">
          {title && (
            <div className={`font-bold mb-2 ${style.title}`}>{title}</div>
          )}
          <div className="text-gray-700 text-sm leading-relaxed prose-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### Component 2: VideoEmbed
**Purpose:** Embed YouTube, Vimeo, or hosted videos

**Usage in MDX:**
```mdx
<VideoEmbed
  url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  title="JusticeHub Platform Demo"
  caption="See how community members use the platform to share stories"
/>

<VideoEmbed
  provider="vimeo"
  videoId="123456789"
  aspectRatio="16:9"
/>
```

**Implementation:** `src/components/wiki/VideoEmbed.tsx`
```tsx
interface VideoEmbedProps {
  url?: string
  provider?: 'youtube' | 'vimeo'
  videoId?: string
  title?: string
  caption?: string
  aspectRatio?: '16:9' | '4:3' | '1:1'
}

export function VideoEmbed({
  url,
  provider = 'youtube',
  videoId,
  title,
  caption,
  aspectRatio = '16:9',
}: VideoEmbedProps) {
  // Auto-detect provider and ID from URL if provided
  let finalProvider = provider
  let finalVideoId = videoId

  if (url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      finalProvider = 'youtube'
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
      finalVideoId = match?.[1]
    } else if (url.includes('vimeo.com')) {
      finalProvider = 'vimeo'
      const match = url.match(/vimeo\.com\/(\d+)/)
      finalVideoId = match?.[1]
    }
  }

  const embedUrl =
    finalProvider === 'youtube'
      ? `https://www.youtube-nocookie.com/embed/${finalVideoId}`
      : `https://player.vimeo.com/video/${finalVideoId}`

  const aspectRatioClass =
    aspectRatio === '16:9'
      ? 'aspect-video'
      : aspectRatio === '4:3'
      ? 'aspect-[4/3]'
      : 'aspect-square'

  return (
    <figure className="my-8">
      <div className={`${aspectRatioClass} w-full rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg`}>
        <iframe
          src={embedUrl}
          title={title || 'Video embed'}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {(title || caption) && (
        <figcaption className="mt-3 text-center">
          {title && <div className="font-semibold text-gray-900 mb-1">{title}</div>}
          {caption && <div className="text-sm text-gray-600">{caption}</div>}
        </figcaption>
      )}
    </figure>
  )
}
```

#### Component 3: Tabs
**Purpose:** Organize content in tabbed interface (perfect for budget scenarios)

**Usage in MDX:**
```mdx
<Tabs defaultValue="base">
  <TabsList>
    <TabsTrigger value="lean">LEAN Scenario</TabsTrigger>
    <TabsTrigger value="base">BASE Scenario</TabsTrigger>
    <TabsTrigger value="upper">UPPER Scenario</TabsTrigger>
  </TabsList>

  <TabsContent value="lean">
    **$5.9M over 3 years**

    - 3 communities
    - 9 FTE core team
    - Essential platform features only
  </TabsContent>

  <TabsContent value="base">
    **$10.5M over 3 years** ⭐ Recommended

    - 6 communities
    - 12 FTE core team
    - Full platform with Centre of Excellence
  </TabsContent>

  <TabsContent value="upper">
    **$17.6M over 3 years**

    - 12 communities
    - 17 FTE core team
    - Accelerated rollout + International expansion
  </TabsContent>
</Tabs>
```

**Implementation:** Use existing Radix UI Tabs (already installed)
```tsx
// src/components/wiki/Tabs.tsx
export { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
```

#### Component 4: ImageGallery
**Purpose:** Showcase visualizations created in Napkin.ai

**Usage in MDX:**
```mdx
<ImageGallery
  images={[
    { src: '/visuals/sovereignty-flywheel.png', alt: 'Sovereignty Flywheel', caption: 'The 6-step self-reinforcing cycle' },
    { src: '/visuals/impact-journey.png', alt: 'Impact Journey', caption: '7-10 year pathway to sustainability' },
    { src: '/visuals/budget-comparison.png', alt: 'Budget Comparison', caption: 'Three investment scenarios' },
  ]}
  layout="grid" // or "carousel"
/>
```

#### Component 5: StatCard
**Purpose:** Highlight key statistics

**Usage in MDX:**
```mdx
<div className="grid grid-cols-3 gap-6 my-8">
  <StatCard value="17x" label="Overrepresentation in detention" color="red" />
  <StatCard value="79%" label="Reduction in Bourke" color="green" trend="down" />
  <StatCard value="$10.5M" label="BASE Scenario Investment" color="blue" />
</div>
```

---

### Phase 3: Restructure Wiki File System (1 hour)

**New Structure:**
```
src/app/wiki/
├── page.tsx                              # Wiki home (keep current)
├── layout.tsx                            # Shared layout
│
├── mindaroo-pitch/                       # NEW: Mindaroo pitch hub
│   ├── page.mdx                          # Overview with links to sub-pages
│   ├── one-pager/page.mdx               # ONE_PAGE_EXECUTIVE_PITCH
│   ├── strategic-pitch/page.mdx         # COMBINED_STRATEGIC_PITCH
│   ├── sovereignty-flywheel/page.mdx    # SOVEREIGNTY_FLYWHEEL_MASTER_VISUAL
│   ├── budget-breakdown/page.mdx        # DETAILED_BUDGET_BREAKDOWN
│   └── research-paper/page.mdx          # RESEARCH_DISCUSSION_PAPER
│
├── platform/                             # Platform documentation
│   ├── overview/page.mdx
│   ├── programs/page.mdx
│   ├── stories/page.mdx
│   └── centre-of-excellence/page.mdx
│
├── budget/                               # Budget & funding
│   ├── scenarios/page.mdx
│   └── templates/page.mdx
│
└── admin/                                # Admin guides
    ├── user-guide/page.mdx
    └── quick-start/page.mdx
```

**Benefits:**
- ✅ Logical grouping (Mindaroo pitch all in one place)
- ✅ Better URLs: `/wiki/mindaroo-pitch/strategic-pitch`
- ✅ Easier navigation
- ✅ Scalable structure

---

### Phase 4: Migrate Final Documents Content (3 hours)

#### Step 1: Convert to MDX format

**Example: ONE_PAGE_EXECUTIVE_PITCH.md → mindaroo-pitch/one-pager/page.mdx**

**Before (Markdown):**
```markdown
# JusticeHub One-Page Executive Pitch

**60-Second Pitch:**
Transform Australia's youth justice crisis by funding a sector-wide digital intelligence platform...

## WHY - The Problem & Opportunity

Aboriginal & Torres Strait Islander young people are 17x more likely...
```

**After (MDX with interactive components):**
```mdx
# JusticeHub One-Page Executive Pitch

<Callout type="info" title="60-Second Pitch">
  Transform Australia's youth justice crisis by funding a **sector-wide digital intelligence platform**
  that captures, connects, and amplifies grassroots programs keeping young people out of detention.
</Callout>

## WHY - The Problem & Opportunity

<StatCard value="17x" label="Overrepresentation in detention" color="red" />

Aboriginal & Torres Strait Islander young people are 17x more likely to be in detention...

<VideoEmbed
  url="https://justicehub-platform.vercel.app/stories"
  title="Community Stories"
  caption="See how programs are making impact"
/>

## Investment Scenarios

<Tabs defaultValue="base">
  <TabsList>
    <TabsTrigger value="lean">LEAN ($5.9M)</TabsTrigger>
    <TabsTrigger value="base">BASE ($10.5M) ⭐</TabsTrigger>
    <TabsTrigger value="upper">UPPER ($17.6M)</TabsTrigger>
  </TabsList>

  <TabsContent value="base">
    ### BASE Scenario - $10.5M over 3 years

    - **6 partner communities** at $180K each annually
    - **12 FTE core team** (mix of senior and early career)
    - **Full platform features** + Centre of Excellence

    <Callout type="success">
      Recommended starting point with clear pathway to sustainability
    </Callout>
  </TabsContent>
</Tabs>
```

#### Step 2: Add visual elements

For **SOVEREIGNTY_FLYWHEEL_MASTER_VISUAL.mdx:**
```mdx
# The Sovereignty Flywheel

<Callout type="info">
  This is THE core visual explaining the entire JusticeHub model.
  [View interactive version →](/flywheel)
</Callout>

## The Visual Explained

<ImageGallery
  images={[
    { src: '/visuals/flywheel-full.png', alt: 'Complete Flywheel', caption: 'Problem → Solution → Impact' },
    { src: '/visuals/flywheel-steps.png', alt: '6 Steps', caption: 'The self-reinforcing cycle' },
  ]}
/>

## Create Your Own with Napkin.ai

<Callout type="success" title="Ready-to-Use Prompt">
  Copy the prompt below and paste into Napkin.ai to generate professional visuals.
</Callout>

```text
Create a sophisticated infographic showing the JusticeHub Sovereignty Flywheel...
```
</Callout>
```

#### Step 3: Link between pages

Add navigation at bottom of each page:
```mdx
---

## Next Steps

<div className="grid grid-cols-2 gap-4 mt-8">
  <a href="/wiki/mindaroo-pitch/strategic-pitch" className="p-6 border-2 rounded-lg hover:border-blue-500">
    <div className="font-bold">📄 Full Strategic Pitch →</div>
    <div className="text-sm text-gray-600">21,000-word comprehensive document</div>
  </a>

  <a href="/wiki/mindaroo-pitch/budget-breakdown" className="p-6 border-2 rounded-lg hover:border-green-500">
    <div className="font-bold">💰 Detailed Budget →</div>
    <div className="text-sm text-gray-600">Line-by-line transparency</div>
  </a>
</div>
```

---

### Phase 5: Update Wiki Home Navigation (30 mins)

Update `src/app/wiki/page.tsx` to feature new Mindaroo pitch section:

```tsx
{/* FEATURED: Mindaroo Pitch Package */}
<section className="mb-16">
  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-xl text-white mb-6">
    <h2 className="text-3xl font-bold mb-3">Mindaroo Foundation Pitch</h2>
    <p className="text-blue-100 text-lg mb-4">
      Complete strategic pitch package with budget scenarios, research evidence,
      and implementation roadmap.
    </p>
    <Link href="/wiki/mindaroo-pitch" className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50">
      View Full Pitch Package →
    </Link>
  </div>

  <div className="grid grid-cols-3 gap-4">
    <Link href="/wiki/mindaroo-pitch/one-pager" className="p-4 border-2 rounded-lg hover:border-blue-500">
      <div className="font-bold mb-2">📄 One-Pager</div>
      <div className="text-sm text-gray-600">5-minute executive summary</div>
    </Link>

    <Link href="/wiki/mindaroo-pitch/strategic-pitch" className="p-4 border-2 rounded-lg hover:border-blue-500">
      <div className="font-bold mb-2">📚 Strategic Pitch</div>
      <div className="text-sm text-gray-600">21,000-word comprehensive document</div>
    </Link>

    <Link href="/wiki/mindaroo-pitch/sovereignty-flywheel" className="p-4 border-2 rounded-lg hover:border-blue-500">
      <div className="font-bold mb-2">🎯 Sovereignty Flywheel</div>
      <div className="text-sm text-gray-600">Core visual + Napkin.ai prompts</div>
    </Link>

    <Link href="/wiki/mindaroo-pitch/budget-breakdown" className="p-4 border-2 rounded-lg hover:border-green-500">
      <div className="font-bold mb-2">💰 Budget Breakdown</div>
      <div className="text-sm text-gray-600">Three scenarios with line-items</div>
    </Link>

    <Link href="/wiki/mindaroo-pitch/research-paper" className="p-4 border-2 rounded-lg hover:border-green-500">
      <div className="font-bold mb-2">📊 Research Paper</div>
      <div className="text-sm text-gray-600">Evidence, case studies, data</div>
    </Link>

    <Link href="/flywheel" className="p-4 border-2 border-purple-500 rounded-lg hover:border-purple-700 bg-purple-50">
      <div className="font-bold mb-2 text-purple-700">✨ Interactive Flywheel</div>
      <div className="text-sm text-purple-600">Live, interactive version</div>
    </Link>
  </div>
</section>
```

---

## 4. Content Migration Checklist

### Files to Migrate from "final documents/" folder:

- [ ] **ONE_PAGE_EXECUTIVE_PITCH.md** → `wiki/mindaroo-pitch/one-pager/page.mdx`
  - Add StatCards for key numbers (17x, $10.5M, etc.)
  - Add Tabs for budget scenarios
  - Add Callout for 60-second pitch
  - Link to other pitch pages

- [ ] **COMBINED_STRATEGIC_PITCH.md** → `wiki/mindaroo-pitch/strategic-pitch/page.mdx`
  - Add table of contents component
  - Add Callouts for key evidence
  - Add VideoEmbed for platform demos
  - Add collapsible sections for long content
  - Keep all existing JusticeHub platform links

- [ ] **SOVEREIGNTY_FLYWHEEL_MASTER_VISUAL.md** → `wiki/mindaroo-pitch/sovereignty-flywheel/page.mdx`
  - Add ImageGallery for visual variations
  - Add Callout with Napkin.ai prompts in code blocks
  - Link to interactive /flywheel page
  - Add download buttons for exports

- [ ] **DETAILED_BUDGET_BREAKDOWN.md** → `wiki/mindaroo-pitch/budget-breakdown/page.mdx`
  - Add Tabs for LEAN/BASE/UPPER scenarios
  - Add StatCards for total amounts
  - Add Callouts for budget principles
  - Add comparison tables

- [ ] **RESEARCH_DISCUSSION_PAPER.md** → `wiki/mindaroo-pitch/research-paper/page.mdx`
  - Add Callouts for evidence highlights
  - Add collapsible sections for case studies
  - Add StatCards for ROI numbers (79%, $2.22, etc.)
  - Add citation links

### Create New Hub Page:

- [ ] **Create** `wiki/mindaroo-pitch/page.mdx`
  - Overview of pitch package
  - Quick navigation to all 5 documents
  - Download links for PDFs (future)
  - Contact information

---

## 5. Visual Enhancements for Napkin.ai Integration

### Create dedicated visuals folder:
```
public/visuals/
├── sovereignty-flywheel-full.png
├── sovereignty-flywheel-steps.png
├── impact-journey.png
├── budget-comparison.png
├── partner-map.png
└── roi-chart.png
```

### ImageGallery features:
- Lightbox zoom on click
- Download button for each image
- Captions with markdown support
- Grid or carousel layout
- Lazy loading for performance

---

## 6. Success Metrics

**After implementation, the wiki should:**

✅ **Engagement:**
- Time on page increased by 2x (interactive elements encourage exploration)
- Reduced bounce rate on long documents (tabs, collapsibles make content digestible)

✅ **Usability:**
- Mindaroo pitch accessible in < 3 clicks from homepage
- Budget scenarios comparable side-by-side (tabs)
- Key statistics highlighted visually (StatCards, Callouts)

✅ **Functionality:**
- Videos play inline (no external navigation)
- Images zoom to full screen
- Code blocks copyable with one click
- All JusticeHub platform links working

✅ **Professional Presentation:**
- Notion/GitBook-quality experience
- Consistent visual hierarchy
- Mobile-responsive (all components work on phone)
- Print-friendly (CSS print styles)

---

## 7. Implementation Timeline

| Phase | Task | Time | Status |
|-------|------|------|--------|
| **1** | Install dependencies & configure | 30 mins | ⏳ Pending |
| **2** | Build wiki components | 2 hours | ⏳ Pending |
| **3** | Restructure file system | 1 hour | ⏳ Pending |
| **4** | Migrate final documents | 3 hours | ⏳ Pending |
| **5** | Update wiki home | 30 mins | ⏳ Pending |
| **6** | Test & refine | 1 hour | ⏳ Pending |
| **TOTAL** | | **8 hours** | |

---

## 8. Future Enhancements

**After initial implementation:**

1. **PDF Export** - Generate PDFs from MDX pages for offline sharing
2. **Search** - Add full-text search across all wiki content
3. **Version History** - Track changes to strategic documents
4. **Collaborative Editing** - Allow Mindaroo to comment on specific sections
5. **Analytics** - Track which sections get most attention
6. **Dark Mode** - Toggle for reading long documents
7. **Print Optimized** - Custom CSS for professional printing

---

## 9. Next Steps

**To proceed:**

1. **Approve this plan** - Review and confirm approach
2. **Install dependencies** - Run npm install commands
3. **Build components** - Start with Callout, VideoEmbed, Tabs
4. **Migrate one document** - Test with ONE_PAGE_EXECUTIVE_PITCH first
5. **Iterate and refine** - Adjust based on visual results
6. **Complete migration** - Move all 5 final documents

---

## 10. Questions to Resolve

1. **Video content:** Do you have YouTube/Vimeo URLs for community stories to embed?
2. **Images:** Do you want to create Napkin.ai visuals before or after MDX migration?
3. **Download PDFs:** Should we generate PDF versions of pitch documents?
4. **Branding:** Any specific color scheme for callouts beyond default blue/green/yellow/red?
5. **Launch:** Is there a deadline for Mindaroo pitch presentation?

---

**Ready to transform the wiki into an interactive, professional documentation platform that does justice to the JusticeHub vision.**
