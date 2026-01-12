# JusticeHub Story Structure & Implementation Analysis

**Generated:** 2025-01-15  
**Purpose:** Document story format, styling, and technical implementation patterns for Aunty Corrine's story

---

## Executive Summary

JusticeHub uses a **dual-system approach** for stories:
1. **Articles System** - Long-form editorial content (what you'll use for Aunty Corrine)
2. **Stories Platform** - User-generated personal narratives

This analysis focuses on the Articles system, which is the appropriate home for Aunty Corrine's interview story.

---

## 1. Story Format & Structure

### Database Schema (Articles Table)
```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,                          -- Short summary (1-2 sentences)
  content TEXT NOT NULL,                 -- HTML content
  featured_image_url TEXT,
  featured_image_caption TEXT,
  author_id UUID REFERENCES public_profiles(id),
  category TEXT CHECK (category IN ('seeds', 'growth', 'harvest', 'roots')),
  is_trending BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft',
  seo_title TEXT,
  seo_description TEXT,
  location_tags TEXT[],                  -- ['Mount Isa', 'Queensland']
  tags TEXT[],                           -- Topical tags
  reading_time_minutes INTEGER,          -- Auto-calculated
  metadata JSONB DEFAULT '{}'::jsonb,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Markdown Frontmatter Format
```yaml
---
title: "Story Title"
slug: "url-friendly-slug"
excerpt: "One to two sentence summary that appears in feeds and SEO"
category: "seeds" | "growth" | "harvest" | "roots"
publishedAt: "2025-01-15"
author: "Benjamin Knight"
featuredImage: "url-to-image"
locationTags: ["Mount Isa", "Queensland"]
isTrending: false
seoTitle: "SEO optimized title"
seoDescription: "SEO description"
---
```

### Content Structure Pattern

Based on analysis of existing stories, the typical structure is:

1. **Opening Hook** (1-2 paragraphs)
   - Evocative scene-setting
   - Introduces the person/place/theme
   - Establishes emotional tone

2. **Background/Context** (2-4 paragraphs)
   - Historical context
   - Personal background
   - Community context
   - Why this story matters

3. **Main Narrative** (Multiple sections with H2 headings)
   - Organized thematically, not chronologically
   - Uses section breaks (##) to structure long content
   - Weaves quotes with narrative
   - Balances description, dialogue, and analysis

4. **Resolution/Reflection** (Final section)
   - Broader implications
   - Connection to systemic issues
   - Call to action or contemplation
   - Full circle back to opening theme

---

## 2. Writing Style & Tone Analysis

### Dominant Characteristics

**Literary Journalism**
- Long-form narrative style (1500-4000 words typical)
- Scene-based storytelling with vivid descriptions
- Extensive use of direct quotes
- First-person occasionally for personal reflections
- Rich metaphorical language

**Example Opening Style:**
```
The red dust of Mount Isa carries stories. In every particle that rises 
with the morning wind, there are memories of connection, rupture, and the 
profound work of mending.
```

**Tonal Qualities:**
- Respectful and honoring of Indigenous knowledge
- Contemplative and philosophical
- Humanizing without sentimentalizing
- Trauma-informed (acknowledges pain without exploitation)
- Strengths-based (focuses on resilience and agency)

### Quote Integration Patterns

Stories extensively use direct quotes in three ways:

1. **Inline quotes** (short, woven into narrative):
   ```markdown
   "This fellow here, I'm very proud of it," Uncle Warren says, his words 
   carrying the weight of cultural approval.
   ```

2. **Standalone quote paragraphs** (medium length):
   ```markdown
   "I think we just got to keep going, be resilient and not to give up. Even 
   though at times where we think we can't do enough for these kids, we just 
   gotta keep trying so they know that they've got someone there to listen 
   out and look out for."
   ```

3. **Extended testimonial sections** (for interviews)
   - Multiple paragraphs from same speaker
   - Introduced with context setting
   - Minimal interruption

### Section Heading Style

- Use `##` for major sections (not H1)
- Headings are evocative, not just descriptive
  - Good: "## The Continuum"
  - Good: "## Beyond Punishment: Reimagining Youth Justice"
  - Avoid: "## Background" or "## Interview Questions"

---

## 3. Media Integration

### Image Handling

**Storage Options:**
1. **Supabase Storage** (preferred for new content)
   - Upload via `/api/upload` endpoint
   - Auto-generates optimized versions
   - Stored in `media_library` table
   
2. **Public directory** (legacy approach)
   - Files in `/public/images/articles/`
   - Direct URL references

**In Markdown Content:**
```markdown
![Alt text](https://image-url.jpg)

Or with caption:
![Alt text](https://image-url.jpg)
*Photo caption in italics below*
```

**Featured Image:**
- Specified in frontmatter
- Displayed prominently at top of article
- Border styling: `border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`

### Video Integration

Currently no native video player in article template. Options:

1. **Embed YouTube/Vimeo**
   ```html
   <iframe src="..." frameborder="0" allowfullscreen></iframe>
   ```

2. **Supabase Storage** (if implementing native player)
   - Upload to `media_library`
   - Would need custom video component

3. **Photo Story Format** (alternative)
   - Use `PhotoStory` type from stories.ts
   - Better suited for multimedia content

**Recommendation for Aunty Corrine:**
If video interview exists, consider:
- YouTube embed in article body
- OR separate video story entry linking to article
- OR use blog post format which has `blog_media` support

### Audio Integration

No native audio player currently implemented. Options:

1. **External hosting** (SoundCloud, etc.) + embed
2. **Supabase storage** + custom audio player component
3. **Transcript-only** approach (recommended for accessibility)

**For Aunty Corrine:**
- Prioritize written transcript
- Link to audio if hosted externally
- Consider future audio player implementation

---

## 4. Category System

### Four Categories (Seasons Metaphor)

**🌱 Seeds** - `'seeds'`
- Early initiatives
- Emerging voices
- New programs
- Planting ideas
- Color: `bg-green-100 text-green-800`

**🌿 Growth** - `'growth'`
- Programs expanding
- Personal transformation stories
- Development and learning
- Color: `bg-emerald-100 text-emerald-800`

**🌾 Harvest** - `'harvest'`
- Success stories
- Impact evidence
- Achievements and outcomes
- Celebrations
- Color: `bg-amber-100 text-amber-800`

**🌳 Roots** - `'roots'`
- Foundational knowledge
- Elder wisdom
- Cultural authority
- Deep history and connection
- Color: `bg-amber-100 text-amber-900`

**Recommendation for Aunty Corrine:** 
`'roots'` - She represents foundational knowledge, Elder wisdom, and cultural authority in Mount Isa.

---

## 5. Related Content Linking System

### Database Relationships

Articles can link to:

1. **People** (via `article_appearances` or `public_profiles`)
2. **Programs** (via `article_related_programs`)
3. **Services** (via `article_related_services`)
4. **Art/Innovation** (via `article_related_art`)
5. **Other Articles** (via `article_related_articles`)

### Implementation Pattern

```sql
-- Link article to person
INSERT INTO article_appearances (article_id, person_name, role, profile_id)
VALUES (...);

-- Link article to program
INSERT INTO article_related_programs (article_id, program_id, relevance_note)
VALUES (...);

-- Link related articles
INSERT INTO article_related_articles (
  article_id, 
  related_article_id, 
  relationship_type,
  relevance_note
) VALUES (...);
```

**For Aunty Corrine's Story:**
- Link to Oonchiumpa programs (if they exist in DB)
- Link to other Mount Isa stories
- Link to Brodie Germaine profile/stories (related community member)
- Create/link her public_profile entry

---

## 6. Technical Implementation Guide

### File Location for New Stories

```
/data/webflow-migration/articles-markdown/aunty-corrine-interview.md
```

### Markdown to Database Import

Existing scripts import markdown files to database:
- Parse frontmatter → article metadata
- Convert markdown body → HTML content
- Calculate reading time automatically
- Generate slug from title

### Story Page Route

Articles are rendered at:
```
/stories/[slug]
```

Via:
```typescript
/src/app/stories/[slug]/page.tsx
```

### Page Rendering Components

Key rendering logic in `/src/app/stories/[slug]/page.tsx`:

**Styling classes applied:**
```javascript
prose prose-lg max-w-none
prose-headings:font-black prose-headings:text-black
prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-10
prose-p:text-gray-800 prose-p:leading-relaxed
prose-blockquote:border-l-4 prose-blockquote:border-red-600
prose-blockquote:pl-6 prose-blockquote:italic
prose-img:border-2 prose-img:border-black 
prose-img:shadow-[4px_8px_0px_0px_rgba(0,0,0,1)]
```

**Brutalist design system:**
- Bold black borders (`border-2 border-black`)
- Box shadows with offset (`shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`)
- High contrast colors
- Strong typography (`font-black`)
- Red accent color for emphasis

---

## 7. SEO & Discovery Optimization

### Essential Metadata

```yaml
# In frontmatter
seoTitle: "Optimized title with keywords (55-60 chars)"
seoDescription: "Compelling description (150-160 chars)"
excerpt: "Feed preview text (1-2 sentences)"
locationTags: ["Mount Isa", "Queensland", "Northwest Queensland"]
tags: ["Indigenous", "Elders", "Cultural Authority", "Youth Justice"]
```

### Full-Text Search

Articles are indexed for search via:
```sql
CREATE INDEX idx_articles_search ON articles 
  USING gin(to_tsvector('english', 
    title || ' ' || COALESCE(excerpt, '') || ' ' || content
  ));
```

### Reading Time Calculation

Automatically calculated on insert/update:
```sql
-- 200 words per minute reading speed
word_count := array_length(regexp_split_to_array(content_text, '\s+'), 1);
RETURN GREATEST(1, CEIL(word_count::DECIMAL / 200));
```

---

## 8. Content Guidelines for Aunty Corrine's Story

### Based on Platform Patterns

**Length Target:** 2500-4000 words
- Similar to "Where Fire Meets Country" (2800 words)
- Similar to "CAMPFIRE Journey" (4000 words)

**Structural Approach:**
1. Opening: Scene-setting in Mount Isa context
2. Introduce Aunty Corrine and her significance
3. Weave interview content with narrative context
4. Section breaks for different themes
5. Close with broader significance

**Quote-to-Narrative Ratio:**
- Approximately 40% direct quotes
- 60% narrative, context, and analysis
- Use quotes to center her voice and authority
- Use narrative to provide context readers need

**Cultural Protocols to Honor:**
- Proper name usage (check preferred spelling/titles)
- Acknowledge Country (Kalkadoon Country)
- Respect for Elder status
- Trauma-informed approach
- Community context (not individual-focused)

**Tone Alignment:**
- Respectful but not distant
- Warm and human
- Acknowledges hardship without dwelling
- Centers Indigenous knowledge and authority
- Connects personal to systemic

---

## 9. Workflow for Publishing Aunty Corrine's Story

### Step 1: Draft Content
```markdown
Create: /data/webflow-migration/articles-markdown/aunty-corrine-mount-isa-wisdom.md

Include:
- Complete frontmatter
- Full story content in markdown
- Image URLs (if available)
- Proper formatting (##, quotes, etc.)
```

### Step 2: Prepare Media
```bash
# If new photos:
1. Upload to Supabase storage via /api/upload
2. Or place in /public/images/articles/
3. Get URLs for markdown content
```

### Step 3: Import to Database
```bash
# Use existing import script or manual insert
# Script would parse markdown → insert into articles table
# Automatically generates:
#   - reading_time_minutes
#   - search vectors
#   - timestamps
```

### Step 4: Create Related Links
```sql
-- Create public_profile for Aunty Corrine (if doesn't exist)
INSERT INTO public_profiles (full_name, slug, bio, role_tags, photo_url)
VALUES (...);

-- Link article to her profile
INSERT INTO article_appearances (...);

-- Link to related programs/services
INSERT INTO article_related_programs (...);

-- Link to related articles (Brodie's story, Mount Isa content)
INSERT INTO article_related_articles (...);
```

### Step 5: Review & Publish
```sql
-- Set status to published
UPDATE articles 
SET status = 'published', published_at = NOW()
WHERE slug = 'aunty-corrine-mount-isa-wisdom';
```

### Step 6: Verify Rendering
```
Visit: https://justicehub.au/stories/aunty-corrine-mount-isa-wisdom
Check:
- Formatting renders correctly
- Images display properly
- Related content links work
- Mobile responsive
- Reading time accurate
```

---

## 10. Example Stories for Reference

### Most Similar to Aunty Corrine's Story Type

**"Where Fire Meets Country: A Journey Through Mount Isa's NAIDOC Week"**
- Location: `/data/webflow-migration/articles-markdown/where-fire-meets-country-a-journey-through-mount-isas-naidoc-week.md`
- Length: ~2800 words
- Category: `seeds`
- Features: Multiple community voices, Elder quotes, NAIDOC context
- Style: Scene-based narrative with extensive quotes
- Good model for: Quote integration, community context, Elder respect

**"From Trouble to Transformation: The CAMPFIRE Journey"**
- Location: `/data/webflow-migration/articles-markdown/from-trouble-to-transformation-the-campfire-journey.md`
- Length: ~4000 words
- Category: `roots`
- Features: Profile story, program description, transformation narrative
- Style: Literary journalism, thematic sections
- Good model for: Long-form structure, section organization

---

## 11. Technical Files Reference

### Key Files for Story System

**Frontend:**
- `/src/app/stories/[slug]/page.tsx` - Article page renderer
- `/src/app/stories/page.tsx` - Stories feed/index
- `/src/components/stories/` - Story components (editor, filters, etc.)

**Database:**
- `/supabase/migrations/create-content-tables-clean.sql` - Articles schema
- `/supabase/migrations/20250123000001_create_unified_profiles_system.sql` - Relationships
- `/supabase/migrations/20250126000000_create_media_library.sql` - Media handling

**Types:**
- `/src/types/story.ts` - Story/article type definitions
- `/src/types/stories.ts` - Enhanced multimedia story types

**API:**
- `/src/app/api/upload/route.ts` - Media upload endpoint

---

## 12. Design System Notes

### Visual Language (Brutalist Design)

**Typography:**
- Headings: `font-black` (900 weight)
- Body: `text-gray-800`, `leading-relaxed`
- Quotes: `italic`, `text-gray-700`

**Colors:**
- Primary text: Black
- Accent: Red (`red-600`, `red-800`)
- Backgrounds: Neutrals (gray-50, white)
- Borders: Pure black (`border-black`)

**Layout:**
- Max width: `max-w-4xl` for readability
- Generous spacing: `mb-6`, `mt-12`
- Clear visual hierarchy

**Interactive Elements:**
- Links: `text-blue-600`, `hover:underline`
- Buttons: High contrast, bold borders
- Cards: Black borders + box shadows

---

## Recommendations for Aunty Corrine's Story

### Primary Recommendations

1. **Category:** `'roots'` - Represents foundational Elder wisdom
2. **Length:** 2500-3500 words (medium-long form)
3. **Structure:** Thematic sections, not Q&A format
4. **Media:** Featured image + 2-4 inline photos
5. **Related Content:** Link to Oonchiumpa programs, Mount Isa community stories

### Content Approach

**Opening:**
Set scene in Mount Isa, introduce Aunty Corrine's significance in community

**Main Sections:**
- Her connection to Kalkadoon Country
- Oonchiumpa programs philosophy and approach
- Working with "problem" kids vs. relationship-based approach
- Challenges and hopes for youth justice
- Wisdom for future generations

**Closing:**
Connect her work to broader themes of Indigenous-led justice reform

### Technical Implementation

**Frontmatter:**
```yaml
---
title: "Aunty Corrine's Wisdom: Transforming Justice Through Connection in Mount Isa"
slug: "aunty-corrine-mount-isa-transforming-justice"
excerpt: "Aunty Corrine shares decades of wisdom about truly supporting young people on Kalkadoon Country, where real change happens through relationship, not programs."
category: "roots"
publishedAt: "2025-01-15"
author: "Benjamin Knight"
featuredImage: "/images/articles/aunty-corrine-mount-isa.jpg"
locationTags: ["Mount Isa", "Queensland", "Kalkadoon Country"]
tags: ["Elders", "Indigenous Leadership", "Youth Justice", "Oonchiumpa", "Relationship-Based Practice"]
isTrending: false
seoTitle: "Aunty Corrine: Elder Wisdom on Youth Justice in Mount Isa"
seoDescription: "Aunty Corrine shares transformative insights from decades of youth work on Kalkadoon Country, where connection and relationship are the foundation of change."
---
```

---

## Appendix: Database Quick Reference

### Query to Get Article by Slug
```sql
SELECT 
  a.*,
  p.full_name as author_name,
  p.slug as author_slug,
  p.photo_url as author_photo,
  p.bio as author_bio
FROM articles a
LEFT JOIN public_profiles p ON a.author_id = p.id
WHERE a.slug = 'aunty-corrine-mount-isa-wisdom'
  AND a.status = 'published';
```

### Query for Related Content
```sql
-- Get related programs
SELECT cp.* 
FROM article_related_programs arp
JOIN community_programs cp ON arp.program_id = cp.id
WHERE arp.article_id = (SELECT id FROM articles WHERE slug = '...');

-- Get related articles
SELECT ra.* 
FROM article_related_articles ara
JOIN articles ra ON ara.related_article_id = ra.id
WHERE ara.article_id = (SELECT id FROM articles WHERE slug = '...');
```

---

**Document Prepared For:** Drafting Aunty Corrine interview story  
**Based On:** Analysis of 38 existing JusticeHub articles and platform code  
**Next Steps:** Use this as reference to draft story content and prepare for publication
