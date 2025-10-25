# 📝 JusticeHub Content Migration Strategy
**From**: https://www.justicehub.com.au (Webflow CMS)
**To**: New JusticeHub Platform (Next.js + Supabase)

---

## 📊 Current Site Analysis

### Site Structure (justicehub.com.au)

**Main Sections**:
1. **Home** - Landing page with mission and featured content
2. **Articles/Stories** - Blog-style content with categorization
3. **About** - Mission, team, values
4. **Justice Map** - Interactive map of stories and programs
5. **People** - Profiles (404 - may not be public)
6. **Inquiries** - Tracking (404 - may not be public)
7. **Contact** - Contact form and information

### Content Inventory

#### 1. Articles/Stories (9+ identified)

**Published Articles** (All by Benjamin Knight, March 2025):
1. "Where Fire Meets Country: A Journey Through Mount Isa's NAIDOC week"
2. "Achieving Gold-Standard Youth Crime Prevention: Designing Programs That Transform Lives"
3. "Beyond Shadows: Plato's Cave and the Reimagining of Youth Justice in Australia"
4. "Creating Spaces for Growth: The Physical and Emotional Environment of Transformation"
5. "From Control to Care: Reimagining Staff Roles in Youth Justice"
6. "The Courage to Connect: How Authentic Relationships Transform Youth in Detention"
7. "Beyond Walls: What Spanish Youth Detention Centers Taught Me About Seeing Humanity First"
8. "From Trouble to Transformation: The CAMPFIRE Journey"
9. "Rethinking Youth Justice Funding in Queensland: Prioritising Grassroots Solutions Over Bureaucracy"

**Article Categorization System**:
- **Seeds** 🌱 (2 articles) - New ideas, emerging concepts
- **Growth** 🌿 (5 articles) - Developing programs and approaches
- **Harvest** 🌾 - Proven outcomes and results
- **Roots** 🌳 (1 article) - Foundational principles and values
- **Trend** 📈 - Timely/trending topics (cross-category tag)

#### 2. About/Mission Content

**Key Messaging**:
- "We empower communities to share, learn, and scale proven solutions"
- "Justice is a collaborative effort"
- Reimagine youth justice in Australia
- Center Indigenous wisdom and cultural healing
- Shift from punishment to healing

**What JusticeHub Does**:
- Foster ecosystem centered on lived experience
- Collaborate with Indigenous communities
- Amplify youth voices
- Support community-based justice solutions
- Connect local and global experts
- Use storytelling for transformation

**Team**:
- Benjamin Knight (key contributor/founder)
- Described as "curious minds" passionate about innovation

#### 3. Justice Map Feature

**Current Implementation**:
- Interactive map showing stories by location
- Geographic coverage: Australia-wide (QLD focus)
- Location-based filtering
- Article previews with images
- Topics: Seeds, Growth, Roots, Harvest

**Locations Covered**:
- Queensland (multiple stories)
- Mount Isa
- Alice Springs/Mparntwe
- International comparisons (Spain)

#### 4. Additional Content

**Product/Store** (mentioned in analysis):
- Digital resources
- May include research, templates, guides

**Newsletter**:
- Subscription feature
- Email collection

**Social Media Integration**:
- LinkedIn
- Other platforms

---

## 🎯 Migration Strategy

### Phase 1: Content Audit & Export (Week 1)

#### 1.1 Webflow CMS Export
**Action**: Export all content from Webflow CMS

**Webflow Export Steps**:
```bash
# In Webflow Dashboard:
1. Go to CMS Collections
2. Export each collection to CSV:
   - Articles/Stories collection
   - Authors collection (if exists)
   - Categories/Tags collection
   - People/Profiles collection (if exists)
   - Inquiries collection (if exists)

3. Download all media assets:
   - Featured images
   - Article inline images
   - Author photos
   - Other media files
```

**Expected Exports**:
- `articles.csv` - All blog posts with metadata
- `authors.csv` - Author profiles
- `categories.csv` - Category definitions
- `images/` - All media assets folder

#### 1.2 Manual Content Review
- Read through all 9+ articles
- Document any embedded media, links, references
- Note special formatting or custom elements
- Identify any interactive components

### Phase 2: Database Schema Design (Week 1-2)

#### 2.1 New Supabase Tables

**Articles Table**:
```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL, -- Rich text/Markdown
  featured_image_url TEXT,
  author_id UUID REFERENCES authors(id),
  category TEXT, -- seeds, growth, harvest, roots
  is_trending BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB, -- For flexible additional data
  location_tags TEXT[], -- For justice map
  seo_title TEXT,
  seo_description TEXT
);

CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_articles_trending ON articles(is_trending) WHERE is_trending = true;
```

**Authors Table**:
```sql
CREATE TABLE authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  role TEXT, -- e.g., "Founder", "Contributor"
  email TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Article Locations Table** (for Justice Map):
```sql
CREATE TABLE article_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL, -- e.g., "Mount Isa", "Brisbane"
  location_city TEXT,
  location_state TEXT,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Pages Table** (for static pages like About):
```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.2 Content Type Definitions

**Article Content Format**: MDX (Markdown + React Components)
- Allows rich formatting
- Enables embedded interactive components
- Easy to write and maintain
- Supports code blocks, images, videos

**Example MDX Structure**:
```mdx
---
title: "Article Title"
excerpt: "Brief description"
category: "growth"
trending: true
published: "2025-03-26"
author: "benjamin-knight"
featuredImage: "/images/article-featured.jpg"
locations: ["mount-isa", "brisbane"]
---

# Article Heading

Content goes here with **rich formatting**.

<CalloutBox type="info">
Special highlighted content
</CalloutBox>

## Section Heading

More content...

<ImageGallery images={[...]} />
```

### Phase 3: Content Migration Implementation (Week 2-3)

#### 3.1 Migration Scripts

**Create**: `/src/scripts/migrate-webflow-content.ts`

```typescript
/**
 * Migrate content from Webflow CSV exports to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { marked } from 'marked'; // Convert HTML to Markdown

// Parse Webflow exports
const articlesCSV = readFileSync('data/webflow-exports/articles.csv', 'utf-8');
const articles = parse(articlesCSV, { columns: true });

// Migrate each article
for (const article of articles) {
  // Convert Webflow rich text HTML to Markdown/MDX
  const content = convertHTMLtoMDX(article.content);

  // Download and re-upload images to Supabase Storage
  const featuredImage = await migrateImage(article.featured_image_url);

  // Insert into Supabase
  await supabase.from('articles').insert({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    content: content,
    featured_image_url: featuredImage,
    category: mapCategory(article.category),
    is_trending: article.trending === 'true',
    published_at: article.published_date,
    metadata: {
      webflow_id: article.id,
      original_url: article.url
    }
  });
}
```

#### 3.2 Image Migration

**Supabase Storage Setup**:
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true);

-- Allow public access to images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'article-images' );
```

**Image Migration Script**:
```typescript
async function migrateImage(webflowImageUrl: string): Promise<string> {
  // Download image from Webflow
  const response = await fetch(webflowImageUrl);
  const buffer = await response.arrayBuffer();

  // Upload to Supabase Storage
  const filename = `articles/${Date.now()}-${path.basename(webflowImageUrl)}`;
  const { data, error } = await supabase.storage
    .from('article-images')
    .upload(filename, buffer, {
      contentType: response.headers.get('content-type')
    });

  if (error) throw error;

  // Return public URL
  const { data: { publicUrl } } = supabase.storage
    .from('article-images')
    .getPublicUrl(filename);

  return publicUrl;
}
```

### Phase 4: Frontend Implementation (Week 3-4)

#### 4.1 Blog/Articles Section

**Page Structure**:
```
/articles                    # Articles index page
/articles/[slug]            # Individual article page
/articles/category/[cat]    # Category filter page
/author/[slug]              # Author profile + articles
```

**Articles Index Component**:
```typescript
// /src/app/articles/page.tsx
export default async function ArticlesPage() {
  const { data: articles } = await supabase
    .from('articles')
    .select('*, authors(*)')
    .order('published_at', { ascending: false });

  return (
    <div>
      <h1>Stories of Transformation</h1>

      {/* Category filters */}
      <CategoryFilter categories={['seeds', 'growth', 'harvest', 'roots']} />

      {/* Articles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
```

**Individual Article Page**:
```typescript
// /src/app/articles/[slug]/page.tsx
import { MDXRemote } from 'next-mdx-remote/rsc';

export default async function ArticlePage({ params }) {
  const { data: article } = await supabase
    .from('articles')
    .select('*, authors(*)')
    .eq('slug', params.slug)
    .single();

  return (
    <article>
      {/* Hero image */}
      <img src={article.featured_image_url} alt={article.title} />

      {/* Title, author, date */}
      <header>
        <h1>{article.title}</h1>
        <AuthorByline author={article.authors} date={article.published_at} />
        <CategoryBadge category={article.category} />
      </header>

      {/* Article content (MDX) */}
      <div className="prose max-w-none">
        <MDXRemote source={article.content} components={customComponents} />
      </div>

      {/* Related articles */}
      <RelatedArticles category={article.category} currentId={article.id} />

      {/* Newsletter CTA */}
      <NewsletterSignup />
    </article>
  );
}
```

#### 4.2 Justice Map 2.0 (Enhanced)

**Integrate with Services Map**:
```typescript
// /src/app/justice-map/page.tsx
import { ServicesMap } from '@/components/ServicesMap';

export default async function JusticeMapPage() {
  // Get articles with location data
  const { data: articles } = await supabase
    .from('articles')
    .select('*, article_locations(*)')
    .not('article_locations', 'is', null);

  // Get services with coordinates
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .not('location_latitude', 'is', null);

  // Combine for map display
  const mapData = [
    ...articles.map(a => ({ type: 'story', ...a })),
    ...services.map(s => ({ type: 'service', ...s }))
  ];

  return (
    <div>
      <h1>Justice Map: Stories & Services</h1>

      {/* Combined map showing both stories and services */}
      <div className="h-[800px]">
        <EnhancedJusticeMap data={mapData} />
      </div>

      {/* Toggle filters: Stories / Services / Both */}
      <MapFilters />

      {/* List view sidebar */}
      <MapSidebar items={mapData} />
    </div>
  );
}
```

**Map Marker Types**:
- **Stories**: Purple markers (📖)
- **Services**: Blue markers (🤝)
- **Programs**: Green markers (🌱)
- **Inquiries**: Orange markers (⚖️)

#### 4.3 About Page Migration

```typescript
// /src/app/about/page.tsx
export default async function AboutPage() {
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', 'about')
    .single();

  return (
    <div>
      <HeroSection
        title="Reimagining Youth Justice"
        subtitle="Justice is a collaborative effort"
      />

      <MDXRemote source={page.content} />

      {/* Team section */}
      <TeamSection />

      {/* Values */}
      <ValuesSection />

      {/* CTA */}
      <CTASection />
    </div>
  );
}
```

### Phase 5: URL Redirects & SEO (Week 4)

#### 5.1 URL Mapping

**Old URLs** → **New URLs**:
```
justicehub.com.au/articles
→ new-site.com/articles

justicehub.com.au/articles/article-slug
→ new-site.com/articles/article-slug

justicehub.com.au/justice-map
→ new-site.com/justice-map

justicehub.com.au/about
→ new-site.com/about
```

**Redirect Configuration** (`next.config.js`):
```javascript
async redirects() {
  return [
    {
      source: '/old-path/:slug',
      destination: '/new-path/:slug',
      permanent: true,
    },
  ];
}
```

#### 5.2 SEO Migration

**Preserve**:
- Meta titles and descriptions
- Open Graph tags
- Twitter Card tags
- Canonical URLs
- Sitemap
- robots.txt

**Implement**:
```typescript
// /src/app/articles/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', params.slug)
    .single();

  return {
    title: article.seo_title || article.title,
    description: article.seo_description || article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [article.featured_image_url],
      type: 'article',
      publishedTime: article.published_at,
      authors: [article.author.name],
    },
  };
}
```

### Phase 6: Enhanced Features (Week 5+)

#### 6.1 New Features to Add

**1. Article Search**:
```typescript
// Full-text search across articles
const { data } = await supabase
  .from('articles')
  .select('*')
  .textSearch('content', query, { config: 'english' });
```

**2. Related Articles Algorithm**:
```typescript
// Find articles in same category or with similar tags
function getRelatedArticles(currentArticle) {
  return articles.filter(a =>
    a.id !== currentArticle.id &&
    (a.category === currentArticle.category ||
     a.location_tags?.some(tag =>
       currentArticle.location_tags?.includes(tag)
     ))
  ).slice(0, 3);
}
```

**3. Reading Time Calculation**:
```typescript
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}
```

**4. Article Series/Collections**:
- Group related articles into series
- "Part 1 of 3" indicators
- Series navigation

**5. Comments/Engagement** (Optional):
- Integration with comment system (e.g., Disqus, custom)
- Social sharing buttons
- "Save for later" feature

**6. Newsletter Integration**:
- Mailchimp/ConvertKit integration
- Embed signup forms in articles
- Email digest of new articles

#### 6.2 Analytics & Tracking

**Implement**:
- Google Analytics 4
- Track popular articles
- Reading completion rates
- Category performance
- Geographic readership

**Dashboard Metrics**:
```sql
-- Most viewed articles
SELECT title, view_count
FROM articles
ORDER BY view_count DESC
LIMIT 10;

-- Category popularity
SELECT category, COUNT(*) as article_count, SUM(view_count) as total_views
FROM articles
GROUP BY category;

-- Average reading time by category
SELECT category, AVG(reading_time_minutes) as avg_reading_time
FROM articles
GROUP BY category;
```

---

## 🎨 Design Considerations

### Content Presentation

**Current Webflow Site**:
- Clean, minimalist design
- Image-driven storytelling
- Icon-based navigation
- Responsive layout

**New Site Design Goals**:
1. **Maintain visual identity** while modernizing
2. **Mobile-first** responsive design
3. **Fast loading** with Next.js optimization
4. **Accessibility** (WCAG 2.1 AA)
5. **Rich media support** (images, videos, embeds)

### Component Library

**Article Components**:
```typescript
// Custom MDX components for rich content
const components = {
  CalloutBox: ({ type, children }) => {...},
  ImageGallery: ({ images }) => {...},
  VideoEmbed: ({ url }) => {...},
  PullQuote: ({ quote, author }) => {...},
  Timeline: ({ events }) => {...},
  DataVisualization: ({ data }) => {...},
  CaseStudy: ({ title, content }) => {...},
};
```

### Typography & Styling

**Typography Scale**:
- Headlines: Bold, impactful (similar to current "headline-truth" style)
- Body: Readable, accessible (16-18px base)
- Captions: Smaller, subdued

**Color Palette** (from current site):
- Primary: Black (#000000)
- Accent: As per category (Seeds, Growth, Harvest, Roots)
- Background: White, light grays
- Links: Blue with underline

---

## 📋 Migration Checklist

### Pre-Migration
- [ ] Export all Webflow CMS collections to CSV
- [ ] Download all images and media assets
- [ ] Document current URL structure
- [ ] Take screenshots of all pages (for reference)
- [ ] Export Webflow site settings and SEO data
- [ ] Backup current site completely

### Database Setup
- [ ] Create Supabase tables (articles, authors, pages, article_locations)
- [ ] Set up storage bucket for images
- [ ] Configure RLS policies
- [ ] Create database indexes

### Content Migration
- [ ] Run migration script for articles
- [ ] Migrate images to Supabase Storage
- [ ] Convert Webflow rich text to MDX
- [ ] Migrate author profiles
- [ ] Migrate static pages (About, Contact)
- [ ] Migrate Justice Map locations
- [ ] Test all migrated content

### Frontend Implementation
- [ ] Build articles index page
- [ ] Build individual article page
- [ ] Build category filter pages
- [ ] Build author profile pages
- [ ] Build enhanced Justice Map
- [ ] Build About page
- [ ] Implement search functionality
- [ ] Add newsletter signup forms

### SEO & Performance
- [ ] Set up URL redirects
- [ ] Implement meta tags and Open Graph
- [ ] Generate sitemap
- [ ] Configure robots.txt
- [ ] Test page load speeds
- [ ] Optimize images (Next.js Image component)

### Testing
- [ ] Test all article links
- [ ] Test image loading
- [ ] Test responsive design (mobile/tablet/desktop)
- [ ] Test Justice Map interactions
- [ ] Cross-browser testing
- [ ] Accessibility audit
- [ ] Performance audit (Lighthouse)

### Launch
- [ ] Set up analytics (Google Analytics)
- [ ] Configure DNS/domain
- [ ] Deploy to production
- [ ] Monitor for broken links
- [ ] Announce migration to audience
- [ ] Keep old site as backup for 30 days

---

## 🚀 Timeline Estimate

**Week 1**: Content audit, export from Webflow, database design
**Week 2**: Migration scripts, content transformation
**Week 3**: Frontend implementation (articles, pages)
**Week 4**: Justice Map 2.0, SEO, redirects
**Week 5**: Testing, refinement, enhanced features
**Week 6**: Launch! 🎉

**Total**: 6 weeks for complete migration

---

## 💡 Recommendations

### Priority 1: Content Preservation
- **All 9+ articles** must be migrated with full formatting
- **Images** must be preserved with proper attribution
- **Categories** (Seeds, Growth, Harvest, Roots) must be maintained
- **Author attribution** (Benjamin Knight) must be preserved

### Priority 2: Enhanced Justice Map
- **Combine** stories + services on one map
- **Different markers** for different content types
- **Interactive filters** to show/hide layers
- **Location-based** article discovery

### Priority 3: Future-Proofing
- **MDX format** allows rich, interactive content
- **Supabase** enables easy content management
- **API-first** design allows mobile app in future
- **Modular components** enable rapid feature additions

### Priority 4: SEO Continuity
- **Preserve URLs** where possible
- **301 redirects** for changed URLs
- **Meta data** migration is critical
- **Submit new sitemap** to Google

---

## 📊 Content Integration with New Site

### Synergies with Current Platform

**Your New Site Has**:
- 511 services mapped with coordinates
- Interactive service discovery map
- 14 specialized categories
- Real-time data from Supabase

**Old Site Has**:
- 9+ stories/articles about youth justice transformation
- Justice Map showing story locations
- Category system (Seeds, Growth, Harvest, Roots)
- Rich storytelling content

**Combined Power** 🔥:
1. **Unified Justice Map**: Show both **stories** AND **services** on same map
2. **Story-Service Links**: Link articles to related services
3. **Program Showcases**: Highlight services mentioned in stories
4. **Evidence-Based**: Stories provide context for why services matter
5. **Discovery Flow**: Read story → Find related services → Connect to support

### Example Integration

**Article**: "The CAMPFIRE Journey" (about transformative program)
↓
**Map View**: Shows CAMPFIRE location + nearby support services
↓
**Service Cards**: Lists similar programs in other regions
↓
**Action**: Users can contact services or share with others

---

## 🎯 Next Steps

1. **Export Webflow content** (you can do this)
2. **Review exported CSVs** (send me a sample)
3. **Confirm database schema** (I'll create Supabase tables)
4. **Run migration script** (I'll build this)
5. **Review migrated content** (you verify accuracy)
6. **Launch integrated site** (stories + services together!)

---

**Status**: Ready to begin migration
**Estimated Effort**: 6 weeks for complete transition
**Risk Level**: Low (content is in CMS, can be exported easily)
**Impact**: HIGH - Unified platform with stories + services

Let me know when you're ready to start the export from Webflow! 🚀
