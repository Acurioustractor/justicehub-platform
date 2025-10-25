# 📚 Articles Integration Plan - JusticeHub

## Overview
These 8 articles are the **first content** going into the new JusticeHub website. This sets the foundation for a content management system that makes it easy to add more articles in the future.

---

## 🗺️ Where Articles Will Go

### Navigation Structure
```
JusticeHub Main Menu
├── Home
├── Services          (existing - 511 services)
├── Stories           ⭐ NEW - Your 8+ articles
│   ├── All Stories
│   ├── By Category
│   │   ├── Seeds 🌱
│   │   ├── Growth 🌿
│   │   ├── Harvest 🌾
│   │   └── Roots 🌳
│   └── By Location (Justice Map)
├── Research          (existing)
├── Global Insights   (existing)
├── Best Practice     (existing)
└── About
```

### URL Structure
```
/stories                           → Articles index page
/stories/[slug]                    → Individual article
/stories/category/seeds            → Seeds articles
/stories/category/growth           → Growth articles
/stories/author/benjamin-knight    → Author page
/justice-map                       → Enhanced map (stories + services)
```

---

## 🎨 Frontend Pages to Build

### 1. Stories Index Page (`/stories`)

**Layout**:
```
┌─────────────────────────────────────────┐
│  STORIES                                │
│  "Transformation Through Storytelling"  │
├─────────────────────────────────────────┤
│  [Search] [Filter: All▾] [Category▾]  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────┐  Featured Story          │
│  │ Image   │  "Where Fire Meets..."   │
│  │         │  Mount Isa • Seeds       │
│  └─────────┘  Benjamin Knight          │
│              [Read Story →]             │
├─────────────────────────────────────────┤
│  Grid of Story Cards (3 columns)       │
│  ┌──────┐ ┌──────┐ ┌──────┐          │
│  │Story │ │Story │ │Story │          │
│  │  1   │ │  2   │ │  3   │          │
│  └──────┘ └──────┘ └──────┘          │
└─────────────────────────────────────────┘
```

**Features**:
- Category filtering (Seeds/Growth/Harvest/Roots)
- Location filtering (Mount Isa, Brisbane, etc.)
- Search by title/content
- Sort by: Newest, Popular, Category
- Reading time indicators
- Category badges with icons

---

### 2. Individual Story Page (`/stories/[slug]`)

**Layout**:
```
┌─────────────────────────────────────────┐
│  [← Back to Stories]                    │
├─────────────────────────────────────────┤
│  🌱 Seeds                               │
│                                         │
│  WHERE FIRE MEETS COUNTRY              │
│  A Journey Through Mount Isa's...      │
│                                         │
│  By Benjamin Knight • Jan 9, 2025      │
│  📍 Mount Isa • ⏱️ 5 min read         │
├─────────────────────────────────────────┤
│  [Featured Image]                       │
├─────────────────────────────────────────┤
│  Article Content                        │
│  (Full Markdown rendered)               │
│                                         │
│  ## Heading                            │
│  Paragraph text...                     │
│                                         │
│  [See on Map →]  [Share]              │
├─────────────────────────────────────────┤
│  Related Stories                        │
│  ┌──────┐ ┌──────┐ ┌──────┐          │
│  │Story │ │Story │ │Story │          │
│  └──────┘ └──────┘ └──────┘          │
├─────────────────────────────────────────┤
│  💌 Subscribe for More Stories         │
│  [Email] [Subscribe]                   │
└─────────────────────────────────────────┘
```

**Features**:
- Full article with MDX rendering (allows interactive components)
- Author byline with photo
- Category and location tags
- Reading time
- Share buttons (Twitter, LinkedIn, Email)
- "See on Map" button → opens Justice Map at article location
- Related stories based on category/location
- Newsletter signup CTA

---

### 3. Category Pages (`/stories/category/[category]`)

**Purpose**: Show all articles in a specific category

**Layout**: Similar to Stories Index but filtered

**Categories**:
- 🌱 **Seeds** - New ideas, emerging concepts
- 🌿 **Growth** - Developing programs and approaches
- 🌾 **Harvest** - Proven outcomes and results
- 🌳 **Roots** - Foundational principles and values

---

### 4. Enhanced Justice Map (`/justice-map`)

**The BIG Innovation**: Combine stories + services

```
┌─────────────────────────────────────────┐
│  JUSTICE MAP                            │
│  "Stories & Services Across Australia"  │
├─────────────────────────────────────────┤
│  Toggle: [📖 Stories] [🤝 Services]    │
│           [Both (default)]              │
├─────────────────────────────────────────┤
│                                         │
│   [Interactive Map]                     │
│                                         │
│   📖 Purple pins = Stories              │
│   🤝 Blue pins = Services               │
│                                         │
│   Click pin → Preview card              │
│                                         │
├─────────────────────────────────────────┤
│  Sidebar: List view                     │
│  - Mount Isa (1 story, 10 services)     │
│  - Brisbane (8 stories, 200 services)   │
│  - Cairns (5 services)                  │
└─────────────────────────────────────────┘
```

**User Flow Example**:
1. User reads "CAMPFIRE Journey" story
2. Clicks "See on Map"
3. Map opens, zoomed to Mount Isa
4. Shows: 📖 CAMPFIRE story pin + 10 nearby 🤝 service pins
5. User clicks service pin → gets contact info
6. User can connect with real help

---

## 🔧 How to Make Adding More Articles Easy

### Option 1: Admin Interface (Recommended for You)

**Build a simple admin page**: `/admin/articles/new`

```typescript
// /src/app/admin/articles/new/page.tsx

export default function NewArticlePage() {
  return (
    <form>
      <input name="title" placeholder="Article Title" required />

      <textarea name="excerpt" placeholder="Brief summary" />

      <textarea name="content" placeholder="Article content (Markdown)"
                rows={20} required />

      <input name="featuredImage" type="url" placeholder="Image URL" />

      <select name="category">
        <option value="seeds">🌱 Seeds</option>
        <option value="growth">🌿 Growth</option>
        <option value="harvest">🌾 Harvest</option>
        <option value="roots">🌳 Roots</option>
      </select>

      <input name="locationTags" placeholder="Mount Isa, Brisbane" />

      <input name="publishedAt" type="date" />

      <button type="submit">Publish Story</button>
    </form>
  );
}
```

**Workflow**:
1. You go to `/admin/articles/new`
2. Fill in form (paste article content)
3. Click "Publish"
4. Article instantly appears on `/stories`

---

### Option 2: Markdown Files (Git-based)

**Simplest for developers**:

```
articles/
├── where-fire-meets-country.md
├── achieving-gold-standard.md
└── new-article-2025-10-12.md   ← Just add new file!
```

Each file has frontmatter:

```markdown
---
title: "My New Article"
category: "growth"
publishedAt: "2025-10-12"
author: "Benjamin Knight"
locationTags: ["Brisbane"]
featuredImage: "/images/article.jpg"
---

# Article content here...

Your markdown content...
```

**Workflow**:
1. Create new `.md` file
2. Write article in Markdown
3. Git commit and push
4. Article automatically appears on site

---

### Option 3: Supabase Direct (Simplest)

**Use Supabase Table Editor**:

1. Open Supabase Dashboard
2. Go to `articles` table
3. Click "Insert Row"
4. Fill in fields:
   - title: "New Article Title"
   - content: "Full article content..."
   - category: "growth"
   - slug: "new-article-title"
   - author_id: (Benjamin Knight's UUID)
   - published_at: 2025-10-12
   - status: "published"
5. Save
6. Article instantly live

---

### Option 4: Headless CMS Integration

**For the future** (if you want non-technical editors):

Integrate with:
- **Sanity.io** - Clean interface, real-time preview
- **Contentful** - Enterprise-grade
- **Strapi** - Self-hosted, open source

These give you:
- Rich text editor (no Markdown knowledge needed)
- Image upload and management
- Preview before publishing
- Multiple editors/roles
- Revision history

---

## 🎯 Recommended Approach

### Phase 1: Now (Week 1)
**Import 8 articles to Supabase + Build frontend pages**

- ✅ Articles in database
- ✅ Frontend pages working
- ✅ Can add articles via Supabase Table Editor (simple!)

### Phase 2: Soon (Week 2-3)
**Build simple admin interface**

- Form at `/admin/articles/new`
- Protected by login
- Easy for you to add articles

### Phase 3: Future (Month 2+)
**Add advanced CMS features**

- Rich text editor
- Image management
- Draft/preview system
- Multiple authors
- Article series
- Comments

---

## 🏗️ Technical Implementation

### Database Schema (Already Created)
```sql
articles
  ├── id (UUID)
  ├── slug (unique)
  ├── title
  ├── excerpt
  ├── content (Markdown/MDX)
  ├── featured_image_url
  ├── author_id → authors.id
  ├── category (seeds/growth/harvest/roots)
  ├── location_tags (array)
  ├── published_at
  ├── status (draft/published/archived)
  └── reading_time_minutes (auto-calculated)
```

### Frontend Components

```typescript
// Core components to build

ArticleCard             // Preview card with image, title, excerpt
ArticleList             // Grid of cards with filtering
ArticleContent          // Full article with MDX rendering
ArticleHeader           // Title, author, date, category
CategoryBadge           // Colored badge (Seeds/Growth/etc)
LocationTag             // Clickable location tag
RelatedArticles         // Sidebar recommendations
ShareButtons            // Social sharing
NewsletterSignup        // Email capture
EnhancedJusticeMap      // Map with stories + services
```

### Key Files to Create

```
src/
├── app/
│   ├── stories/
│   │   ├── page.tsx                    → Stories index
│   │   ├── [slug]/
│   │   │   └── page.tsx                → Individual story
│   │   └── category/
│   │       └── [category]/
│   │           └── page.tsx            → Category pages
│   ├── justice-map/
│   │   └── page.tsx                    → Enhanced map
│   └── admin/
│       └── articles/
│           └── new/
│               └── page.tsx            → Add article form
├── components/
│   ├── ArticleCard.tsx
│   ├── ArticleList.tsx
│   ├── ArticleContent.tsx
│   ├── CategoryBadge.tsx
│   └── EnhancedJusticeMap.tsx
└── lib/
    └── articles.ts                     → Helper functions
```

---

## 🎨 Design Consistency

### Match Existing JusticeHub Style

**Colors** (from your current site):
- Primary: Black (#000000)
- Accent: Category-specific
  - Seeds: Light green (#86efac)
  - Growth: Medium green (#22c55e)
  - Harvest: Gold (#fbbf24)
  - Roots: Brown (#92400e)
- Background: White/Light gray

**Typography**:
- Headlines: Bold, impactful
- Body: 16-18px, readable
- Same fonts as existing site

**Components**:
- Use existing shadcn/ui components
- Match service cards style
- Consistent navigation

---

## 📱 Mobile-First Design

All story pages must work perfectly on:
- ✅ Mobile (360px+)
- ✅ Tablet (768px+)
- ✅ Desktop (1024px+)

**Mobile Story Page**:
- Full-width images
- Readable text (18px minimum)
- Easy-tap buttons
- Sticky "Back" button
- Collapsible TOC

---

## 🔍 SEO Optimization

Each article page gets:
- ✅ Meta title and description
- ✅ Open Graph tags (Facebook/LinkedIn sharing)
- ✅ Twitter Card tags
- ✅ Schema.org Article markup
- ✅ Sitemap entry
- ✅ Canonical URLs

**Example**:
```tsx
export async function generateMetadata({ params }) {
  const article = await getArticle(params.slug);

  return {
    title: article.seo_title || article.title,
    description: article.seo_description || article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [article.featured_image_url],
      type: 'article',
      publishedTime: article.published_at,
      authors: ['Benjamin Knight'],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [article.featured_image_url],
    },
  };
}
```

---

## 🚀 Performance

**Fast Loading**:
- Next.js Image optimization
- Static generation where possible
- Lazy loading for images
- Code splitting
- Font optimization

**Target**:
- ⚡ < 2 seconds to First Contentful Paint
- 📊 90+ Lighthouse score
- ✅ Core Web Vitals passed

---

## 📊 Analytics

Track:
- 📖 Article views
- ⏱️ Reading time
- 🗺️ "See on Map" clicks
- 📧 Newsletter signups
- 🔗 Share button clicks
- 🔍 Search queries

Use: Google Analytics 4

---

## 🎯 Success Criteria

### Week 1
- [ ] 8 articles live on `/stories`
- [ ] Individual article pages working
- [ ] Category filtering working
- [ ] Mobile-responsive
- [ ] Can view on Justice Map

### Week 2
- [ ] Search working
- [ ] Related articles showing
- [ ] Newsletter signup working
- [ ] SEO meta tags complete
- [ ] Share buttons working

### Week 3
- [ ] Admin interface for adding articles
- [ ] Image upload working
- [ ] Analytics tracking
- [ ] Performance optimized
- [ ] Ready for more content!

---

## 💡 Content Strategy

### How to Keep Adding Stories

**Monthly**:
- 1-2 new transformation stories
- Update existing stories with outcomes
- Add stories from different regions

**Sources**:
- Your research and visits
- Program case studies
- Guest contributors
- Community submissions

**Quality over Quantity**:
- Each story deeply researched
- Real impact documented
- Location context provided
- Connection to services shown

---

## 🌟 The Big Picture

**Before**:
- Stories on old Webflow site (isolated)
- Services in new site (no context)

**After**:
- **Stories + Services integrated**
- Read inspiration → Find help
- Justice Map shows both
- One unified platform

**User Journey**:
```
1. Read "CAMPFIRE Journey" story
2. See Mount Isa transformation
3. Click "See on Map"
4. Discover 10 similar programs nearby
5. Contact service → Real impact
```

This is powerful! 🔥

---

**Ready to build this?** Let me know and I'll start with:
1. Import articles to database
2. Build `/stories` pages
3. Integrate with Justice Map
4. Add admin interface

The foundation is ready - let's bring your stories to life! 🚀
