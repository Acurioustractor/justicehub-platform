# Aunty Corrine Story - Complete Implementation Guide
## How to Add This Story to JusticeHub Website with Photos & Video

---

## OVERVIEW: What You're Building

You're creating a **rich multimedia story** with:
- ✅ Main story text (3,400 words, literary journalism style)
- ✅ Featured image (portrait of Aunty Corrine)
- ✅ Inline photos (3-5 images throughout story)
- ✅ Video embeds (interview clips)
- ✅ Audio option (full interview as podcast)
- ✅ Related content links (people, programs, other stories)
- ✅ Social sharing optimization

**Route:** `https://justicehub.au/stories/aunty-corrine-mount-isa-unpaid-expertise`

---

## PART 1: FILE & FOLDER STRUCTURE

### **Step 1: Create the Story Markdown File**

**Location:** `/data/webflow-migration/articles-markdown/aunty-corrine-mount-isa-unpaid-expertise.md`

```bash
# Navigate to articles directory
cd /Users/benknight/Code/JusticeHub/data/webflow-migration/articles-markdown

# Create the file
touch aunty-corrine-mount-isa-unpaid-expertise.md
```

**Content:** Copy the full story from `STORY_AUNTY_CORRINE_JUSTICEHUB_DRAFT.md` into this file.

---

### **Step 2: Prepare Media Assets**

#### **A. Featured Image**

**File:** `aunty-corrine-mount-isa-portrait.jpg`

**Specs:**
- Dimensions: 1200x800px (3:2 ratio)
- File size: <500KB
- Format: JPG (or WebP for better compression)
- Alt text: "Aunty Corrine sitting in her living room in Mount Isa, Queensland, where she has supported 25 young people over 20 years"

**Storage location:** `/public/images/articles/aunty-corrine/`

**Upload to Supabase:**
```bash
# Upload via Supabase dashboard or CLI
# Bucket: article-images
# Path: aunty-corrine/featured-portrait.jpg
```

---

#### **B. Inline Images (5 recommended)**

**Image 1: Riley Street House**
- File: `riley-street-house.jpg`
- Caption: "Aunty Corrine's house on Riley Street, where 25 young people have found safety over 20 years"
- Placement: After Section 1 ("The 25")

**Image 2: Aunty with Young Person**
- File: `aunty-with-steven.jpg` (if consented)
- Caption: "Steven, now 21, who came to Aunty's house from Cleveland Youth Detention Centre and is now living independently"
- Placement: After Steven's story

**Image 3: Mount Isa Landscape**
- File: `mount-isa-landscape.jpg`
- Caption: "Mount Isa, North West Queensland, where Aunty Corrine has advocated for young people for two decades"
- Placement: After Section 2 (services critique)

**Image 4: Empty Park**
- File: `mount-isa-dog-park.jpg`
- Caption: "One of Mount Isa's dog parks—the town has more infrastructure for dogs than for young people, Aunty notes"
- Placement: After "dog parks" quote

**Image 5: Aunty at Meeting or Court**
- File: `aunty-corrine-advocacy.jpg`
- Caption: "Aunty Corrine has attended court with every young person she's supported, advocating for them in systems that often fail"
- Placement: Near closing section

**Storage:**
```
/public/images/articles/aunty-corrine/
├── featured-portrait.jpg
├── riley-street-house.jpg
├── aunty-with-steven.jpg
├── mount-isa-landscape.jpg
├── mount-isa-dog-park.jpg
└── aunty-corrine-advocacy.jpg
```

---

#### **C. Video Integration**

**Video 1: Full Interview**
- **Platform:** YouTube (upload as unlisted or public)
- **Length:** 30-40 minutes (full interview)
- **Title:** "Aunty Corrine: 20 Years of Unpaid Justice Work in Mount Isa"
- **Embed:** After introduction, before Section 1

**Video 2: Key Clips (5-10 minutes each)**

Clip 1: "Tick-and-Flick Funding" (2-3 min)
- Aunty explaining services economy
- Embed: Section 2 (What Services Don't See)

Clip 2: "Steven's Story" (3-4 min)
- Cleveland → Mount Isa → Independent
- Embed: After Steven's written story

Clip 3: "Dog Parks Quote" (1-2 min)
- Infrastructure critique
- Embed: Section 4 (What Aunty Needs)

Clip 4: "I Need Voices Behind Me" (2-3 min)
- Closing reflection
- Embed: Section 7 or final section

**YouTube Upload Steps:**
1. Edit video clips (use DaVinci Resolve, iMovie, or Descript)
2. Upload to JusticeHub YouTube channel
3. Copy embed codes
4. Add to markdown using iframe or YouTube component

---

#### **D. Audio Option**

**Full Interview as Podcast:**
- **Platform:** Anchor/Spotify, Apple Podcasts, or host on Supabase
- **Length:** 40-60 minutes
- **Title:** "Aunty Corrine: Community-Led Justice in Mount Isa"
- **Embed:** Top of story as optional listening

**Audio player HTML:**
```html
<div class="audio-player">
  <p><strong>Listen to the full interview (40 minutes):</strong></p>
  <audio controls>
    <source src="https://[supabase-url]/storage/v1/object/public/audio/aunty-corrine-interview.mp3" type="audio/mpeg">
    Your browser does not support the audio element.
  </audio>
</div>
```

---

## PART 2: DATABASE SETUP

### **Step 1: Create Article Record**

**Table:** `articles`

```sql
INSERT INTO articles (
  id,
  title,
  slug,
  excerpt,
  content,
  category,
  author,
  author_role,
  published_date,
  featured_image,
  featured_image_alt,
  location,
  reading_time,
  is_published,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '"I Need Voices Behind Me": Aunty Corrine''s 20 Years of Unpaid Justice Work',
  'aunty-corrine-mount-isa-unpaid-expertise',
  'In Mount Isa, while services with millions compete over "tick-and-flick funding," Aunty Corrine has supported 25 young people through the justice system—unpaid, 24/7, for two decades. This is what community-led actually looks like.',
  '', -- Will be loaded from markdown file
  'roots',
  'JusticeHub Team',
  'Community Documentation',
  '2025-01-15',
  '/images/articles/aunty-corrine/featured-portrait.jpg',
  'Aunty Corrine sitting in her living room in Mount Isa, Queensland, where she has supported 25 young people over 20 years',
  'Mount Isa, Queensland',
  14,
  true,
  NOW(),
  NOW()
);
```

---

### **Step 2: Add Tags**

**Table:** `article_tags`

```sql
-- First, ensure tags exist
INSERT INTO tags (name, slug) VALUES
  ('Elder-knowledge', 'elder-knowledge'),
  ('Community-led', 'community-led'),
  ('Youth-justice', 'youth-justice'),
  ('Mount-Isa', 'mount-isa'),
  ('Indigenous-leadership', 'indigenous-leadership'),
  ('Unpaid-labor', 'unpaid-labor'),
  ('Systems-critique', 'systems-critique'),
  ('Queensland', 'queensland')
ON CONFLICT (slug) DO NOTHING;

-- Then link to article
INSERT INTO article_tags (article_id, tag_id)
SELECT
  a.id,
  t.id
FROM articles a
CROSS JOIN tags t
WHERE a.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND t.slug IN (
    'elder-knowledge',
    'community-led',
    'youth-justice',
    'mount-isa',
    'indigenous-leadership',
    'unpaid-labor',
    'systems-critique',
    'queensland'
  );
```

---

### **Step 3: Link Related Content**

#### **A. Link to Aunty Corrine's Profile**

**Table:** `article_people`

```sql
-- Assuming Aunty Corrine's profile exists
INSERT INTO article_people (article_id, person_id)
SELECT
  a.id,
  p.id
FROM articles a
CROSS JOIN public_profiles p
WHERE a.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND p.slug = 'aunty-corrine';
```

#### **B. Link to Mount Isa Aunties Network Program**

**Table:** `article_programs`

```sql
INSERT INTO article_programs (article_id, program_id)
SELECT
  a.id,
  p.id
FROM articles a
CROSS JOIN community_programs p
WHERE a.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND p.slug = 'mount-isa-aunties-network';
```

#### **C. Link to Related Articles**

**Table:** `article_relations`

```sql
-- Link to NSW Youth Koori Court article
INSERT INTO article_relations (article_id, related_article_id, relation_type)
SELECT
  a1.id,
  a2.id,
  'evidence'
FROM articles a1
CROSS JOIN articles a2
WHERE a1.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND a2.slug = 'nsw-youth-koori-court-evidence';

-- Link to Bourke Maranguka article
INSERT INTO article_relations (article_id, related_article_id, relation_type)
SELECT
  a1.id,
  a2.id,
  'context'
FROM articles a1
CROSS JOIN articles a2
WHERE a1.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND a2.slug = 'bourke-maranguka-justice-reinvestment';
```

---

## PART 3: MARKDOWN FORMATTING WITH MEDIA

### **Frontmatter (Top of Markdown File)**

```yaml
---
title: "I Need Voices Behind Me": Aunty Corrine's 20 Years of Unpaid Justice Work
slug: aunty-corrine-mount-isa-unpaid-expertise
excerpt: In Mount Isa, while services with millions compete over "tick-and-flick funding," Aunty Corrine has supported 25 young people through the justice system—unpaid, 24/7, for two decades. This is what community-led actually looks like.
category: roots
tags:
  - Elder-knowledge
  - Community-led
  - Youth-justice
  - Mount-Isa
  - Indigenous-leadership
  - Unpaid-labor
  - Systems-critique
  - Queensland
location: Mount Isa, Queensland
author: JusticeHub Team
author_role: Community Documentation
published_date: 2025-01-15
featured_image: /images/articles/aunty-corrine/featured-portrait.jpg
featured_image_alt: Aunty Corrine sitting in her living room in Mount Isa, Queensland, where she has supported 25 young people over 20 years
reading_time: 14
related_people:
  - aunty-corrine
related_programs:
  - mount-isa-aunties-network
related_articles:
  - nsw-youth-koori-court-evidence
  - bourke-maranguka-justice-reinvestment
  - queensland-youth-justice-crisis
---
```

---

### **Body: Inline Image Syntax**

```markdown
## SECTION 1: The 25

Over two decades, Aunty Corrine has "taken on" 25 young people...

![Aunty Corrine's house on Riley Street, Mount Isa](/images/articles/aunty-corrine/riley-street-house.jpg)
*Aunty Corrine's house on Riley Street, where 25 young people have found safety over 20 years*

Some came because they had nowhere else to go...
```

---

### **Body: Video Embed Syntax**

**Option 1: YouTube Embed (Preferred)**

```markdown
## Watch: Aunty Corrine Explains "Tick-and-Flick Funding"

<div class="video-embed">
  <iframe
    width="560"
    height="315"
    src="https://www.youtube.com/embed/[VIDEO_ID]"
    title="Aunty Corrine: Tick-and-Flick Funding"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen>
  </iframe>
</div>

*In this 3-minute clip, Aunty explains the economics of the youth justice industrial complex*
```

**Option 2: Vimeo Embed**

```markdown
<div class="video-embed">
  <iframe
    src="https://player.vimeo.com/video/[VIDEO_ID]"
    width="640"
    height="360"
    frameborder="0"
    allow="autoplay; fullscreen; picture-in-picture"
    allowfullscreen>
  </iframe>
</div>
```

**Option 3: Native HTML5 Video (if self-hosted)**

```markdown
<div class="video-embed">
  <video controls width="100%">
    <source src="https://[supabase-url]/storage/v1/object/public/videos/aunty-corrine-tick-flick.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
  <p class="caption">Aunty Corrine explains tick-and-flick funding (3 minutes)</p>
</div>
```

---

### **Body: Pull Quote / Callout Boxes**

```markdown
> **"Tick-and-flick funding keep rolling in for what? Because we still got a lot of bad children on the streets."**
>
> — Aunty Corrine

Or with styled div:

<div class="pullquote">
  <p>"I will support you, but I need voices behind me to make things work in this community."</p>
  <cite>— Aunty Corrine</cite>
</div>
```

---

### **Body: Audio Player**

```markdown
## Listen to the Full Interview

<div class="audio-player">
  <p><strong>Full interview with Aunty Corrine (40 minutes):</strong></p>
  <audio controls style="width: 100%;">
    <source src="https://[supabase-url]/storage/v1/object/public/audio/aunty-corrine-full-interview.mp3" type="audio/mpeg">
    Your browser does not support the audio element.
  </audio>
  <p class="caption">Recorded in Mount Isa, November 2024</p>
</div>
```

---

## PART 4: CREATING THE ROUTE/PAGE

### **Option A: Dynamic Route (Existing System)**

JusticeHub already has `/stories/[slug]` route that pulls from database.

**File:** `app/routes/stories.$slug.tsx` (already exists)

**What it does:**
1. Reads slug from URL
2. Queries `articles` table for matching slug
3. Loads markdown content
4. Renders with layout, related content, tags

**You just need to:**
- ✅ Insert database record (done above)
- ✅ Create markdown file in correct location
- ✅ Upload media assets
- ✅ Deploy

**That's it!** Route already handles everything.

---

### **Option B: Custom Route (If You Want Special Features)**

If you want custom layout/features for this specific story:

**File:** `app/routes/stories.aunty-corrine-mount-isa-unpaid-expertise.tsx`

```tsx
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { marked } from 'marked';
import fs from 'fs/promises';
import path from 'path';

export async function loader({ params }: LoaderFunctionArgs) {
  // Load markdown file
  const markdownPath = path.join(
    process.cwd(),
    'data/webflow-migration/articles-markdown',
    'aunty-corrine-mount-isa-unpaid-expertise.md'
  );

  const markdownContent = await fs.readFile(markdownPath, 'utf-8');

  // Parse frontmatter and content
  const { frontmatter, content } = parseFrontmatter(markdownContent);

  // Convert markdown to HTML
  const html = marked(content);

  // Fetch related content from database
  const relatedPeople = await db.query(/*...*/);
  const relatedPrograms = await db.query(/*...*/);
  const relatedArticles = await db.query(/*...*/);

  return json({
    frontmatter,
    html,
    relatedPeople,
    relatedPrograms,
    relatedArticles,
  });
}

export default function AuntyCorineStory() {
  const { frontmatter, html, relatedPeople, relatedPrograms, relatedArticles } = useLoaderData<typeof loader>();

  return (
    <div className="story-container">
      {/* Header */}
      <header className="story-header">
        <h1>{frontmatter.title}</h1>
        <p className="excerpt">{frontmatter.excerpt}</p>
        <div className="meta">
          <span>{frontmatter.author}</span>
          <span>{frontmatter.published_date}</span>
          <span>{frontmatter.reading_time} min read</span>
        </div>
      </header>

      {/* Featured Image */}
      <img
        src={frontmatter.featured_image}
        alt={frontmatter.featured_image_alt}
        className="featured-image"
      />

      {/* Story Content */}
      <article
        className="story-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Related Content */}
      <aside className="related-content">
        <h2>Related</h2>

        {relatedPeople.length > 0 && (
          <section>
            <h3>People</h3>
            {relatedPeople.map(person => (
              <a key={person.id} href={`/people/${person.slug}`}>
                {person.name}
              </a>
            ))}
          </section>
        )}

        {relatedPrograms.length > 0 && (
          <section>
            <h3>Programs</h3>
            {relatedPrograms.map(program => (
              <a key={program.id} href={`/community-programs/${program.slug}`}>
                {program.name}
              </a>
            ))}
          </section>
        )}

        {relatedArticles.length > 0 && (
          <section>
            <h3>More Stories</h3>
            {relatedArticles.map(article => (
              <a key={article.id} href={`/stories/${article.slug}`}>
                {article.title}
              </a>
            ))}
          </section>
        )}
      </aside>
    </div>
  );
}
```

---

## PART 5: STYLING & DESIGN

### **CSS for Story Page**

**File:** `app/styles/story.css`

```css
/* Story Container */
.story-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header */
.story-header {
  margin-bottom: 2rem;
  border-bottom: 4px solid black; /* Brutalist border */
}

.story-header h1 {
  font-size: 2.5rem;
  font-weight: 900;
  line-height: 1.2;
  margin-bottom: 1rem;
}

.story-header .excerpt {
  font-size: 1.25rem;
  line-height: 1.6;
  color: #333;
  margin-bottom: 1rem;
}

.story-header .meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #666;
  padding-bottom: 1rem;
}

/* Featured Image */
.featured-image {
  width: 100%;
  height: auto;
  margin-bottom: 2rem;
  border: 4px solid black;
}

/* Story Content */
.story-content {
  font-size: 1.125rem;
  line-height: 1.8;
}

.story-content h2 {
  font-size: 2rem;
  font-weight: 800;
  margin: 3rem 0 1rem;
  border-left: 8px solid black;
  padding-left: 1rem;
}

.story-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 2rem 0 1rem;
}

.story-content p {
  margin-bottom: 1.5rem;
}

.story-content strong {
  font-weight: 800;
  background: #ffeb3b; /* Highlight for emphasis */
  padding: 0 0.25rem;
}

.story-content blockquote {
  border-left: 8px solid black;
  padding-left: 2rem;
  margin: 2rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  font-style: italic;
}

/* Inline Images */
.story-content img {
  width: 100%;
  height: auto;
  margin: 2rem 0;
  border: 4px solid black;
}

.story-content img + em {
  display: block;
  text-align: center;
  font-size: 0.875rem;
  color: #666;
  margin-top: -1.5rem;
  margin-bottom: 2rem;
}

/* Video Embeds */
.video-embed {
  margin: 2rem 0;
  border: 4px solid black;
  padding: 1rem;
  background: #f5f5f5;
}

.video-embed iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: none;
}

.video-embed .caption {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #666;
  text-align: center;
}

/* Audio Player */
.audio-player {
  margin: 2rem 0;
  border: 4px solid black;
  padding: 1rem;
  background: #f5f5f5;
}

.audio-player audio {
  width: 100%;
}

/* Pull Quotes */
.pullquote {
  border: 4px solid black;
  padding: 2rem;
  margin: 3rem 0;
  background: #fff;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.1);
}

.pullquote p {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.4;
  margin: 0;
}

.pullquote cite {
  display: block;
  margin-top: 1rem;
  font-size: 1rem;
  font-weight: 400;
  font-style: normal;
  text-align: right;
}

/* Related Content Sidebar */
.related-content {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 4px solid black;
}

.related-content h2 {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.related-content section {
  margin-bottom: 2rem;
}

.related-content h3 {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.related-content a {
  display: block;
  padding: 0.5rem;
  border: 2px solid black;
  margin-bottom: 0.5rem;
  text-decoration: none;
  color: black;
  font-weight: 600;
  transition: all 0.2s;
}

.related-content a:hover {
  background: #ffeb3b;
  transform: translateX(4px);
}

/* Responsive */
@media (max-width: 768px) {
  .story-container {
    padding: 1rem;
  }

  .story-header h1 {
    font-size: 2rem;
  }

  .story-header .excerpt {
    font-size: 1.125rem;
  }

  .story-content {
    font-size: 1rem;
  }

  .pullquote p {
    font-size: 1.25rem;
  }
}
```

---

## PART 6: COMPLETE WORKFLOW (Step-by-Step)

### **Phase 1: Prepare Content (Week 1)**

**Day 1: Get Consent**
- [ ] Send story draft to Aunty Corrine
- [ ] Get explicit approval for:
  - [ ] Story content
  - [ ] Photos (if using)
  - [ ] Video clips
  - [ ] Public sharing

**Day 2-3: Media Preparation**
- [ ] Edit video clips (5 clips, 2-5 min each)
- [ ] Export in web-friendly format (H.264, 1080p)
- [ ] Upload to YouTube (unlisted during review)
- [ ] Optimize photos (resize to 1200px wide, compress)
- [ ] Prepare audio file (MP3, 128kbps)

**Day 4: File Organization**
- [ ] Create folder: `/public/images/articles/aunty-corrine/`
- [ ] Upload all photos
- [ ] Upload to Supabase storage (if using)
- [ ] Test all media URLs

**Day 5: Markdown Creation**
- [ ] Copy story text into markdown file
- [ ] Add frontmatter
- [ ] Insert image markdown syntax
- [ ] Insert video embeds
- [ ] Add pull quotes
- [ ] Proofread

---

### **Phase 2: Database Setup (Week 1, Day 6)**

- [ ] Run SQL to create article record
- [ ] Run SQL to add tags
- [ ] Run SQL to link related people (Aunty Corrine profile)
- [ ] Run SQL to link related programs (Mount Isa Aunties Network)
- [ ] Run SQL to link related articles
- [ ] Test database queries to confirm relationships

---

### **Phase 3: Deploy & Test (Week 1, Day 7)**

- [ ] Commit markdown file to repo
- [ ] Commit media files
- [ ] Push to staging environment
- [ ] Test story page: `https://staging.justicehub.au/stories/aunty-corrine-mount-isa-unpaid-expertise`
- [ ] Check:
  - [ ] Images load correctly
  - [ ] Videos embed and play
  - [ ] Related content links work
  - [ ] Mobile responsive
  - [ ] Reading time correct
  - [ ] Tags display
  - [ ] Social sharing meta tags

---

### **Phase 4: Review & Iterate (Week 2)**

- [ ] Send staging link to Aunty Corrine for final approval
- [ ] Make any requested edits
- [ ] Internal team review (Benjamin, other JusticeHub contributors)
- [ ] Accessibility check (alt text, captions, screen reader)
- [ ] SEO optimization (meta description, title tags)

---

### **Phase 5: Publish & Promote (Week 3)**

- [ ] Set `is_published: true` in database
- [ ] Deploy to production
- [ ] Test live URL
- [ ] Share on social media:
  - [ ] LinkedIn
  - [ ] Twitter/X
  - [ ] Facebook
- [ ] Email newsletter (JusticeHub subscribers)
- [ ] Media outreach:
  - [ ] ABC (already have relationship)
  - [ ] Guardian Australia
  - [ ] NITV
  - [ ] Queensland-focused outlets
- [ ] Direct sharing:
  - [ ] Bourke, Moree, Alice Springs communities
  - [ ] Mindaroo Foundation
  - [ ] Include in NSW grant application

---

## PART 7: TECHNICAL CHECKLIST

### **Before Launch:**

**Content:**
- [ ] Story text proofread and approved
- [ ] All quotes accurate (check against transcripts)
- [ ] Aunty Corrine has approved for publication
- [ ] Author's note and consent statement included

**Media:**
- [ ] Featured image uploaded and optimized
- [ ] All inline images uploaded
- [ ] Image alt text written for accessibility
- [ ] Videos uploaded to YouTube/Vimeo
- [ ] Video captions/subtitles added
- [ ] Audio file uploaded (if using)

**Database:**
- [ ] Article record created in `articles` table
- [ ] Tags added via `article_tags` table
- [ ] Related people linked via `article_people`
- [ ] Related programs linked via `article_programs`
- [ ] Related articles linked via `article_relations`

**Technical:**
- [ ] Markdown file in correct location
- [ ] Frontmatter complete and valid
- [ ] All media URLs correct
- [ ] Route accessible at `/stories/[slug]`
- [ ] Page renders correctly on desktop
- [ ] Page renders correctly on mobile
- [ ] Images lazy-load
- [ ] Videos don't autoplay
- [ ] Social sharing meta tags correct

**SEO & Accessibility:**
- [ ] Meta title (60 chars max)
- [ ] Meta description (155 chars max)
- [ ] Open Graph image
- [ ] Twitter Card metadata
- [ ] Alt text for all images
- [ ] Captions for videos
- [ ] Heading hierarchy (H1 → H2 → H3)
- [ ] Link text descriptive (no "click here")

---

## PART 8: OPTIONAL ENHANCEMENTS

### **A. Interactive Timeline**

If you want to show Aunty's 20-year journey visually:

```tsx
// Component: Timeline.tsx
export function AuntyTimeline() {
  const events = [
    { year: 2004, event: "Started taking in young people" },
    { year: 2007, event: "VOP program - 6 boys engaged" },
    { year: 2010, event: "Took 5 police to court - won all cases" },
    { year: 2015, event: "Norton joined Army" },
    { year: 2022, event: "ABC Four Corners feature on Cleveland" },
    { year: 2024, event: "25 young people supported over 20 years" },
  ];

  return (
    <div className="timeline">
      {events.map((event, i) => (
        <div key={i} className="timeline-event">
          <span className="year">{event.year}</span>
          <p>{event.event}</p>
        </div>
      ))}
    </div>
  );
}
```

---

### **B. Map Integration**

Show Mount Isa on interactive map:

```tsx
// Using Mapbox or Leaflet
<div className="story-map">
  <MapContainer center={[-20.7256, 139.4927]} zoom={13}>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Marker position={[-20.7256, 139.4927]}>
      <Popup>
        Riley Street, Mount Isa<br/>
        Aunty Corrine's house
      </Popup>
    </Marker>
  </MapContainer>
</div>
```

---

### **C. Social Sharing Buttons**

```tsx
// Component: ShareButtons.tsx
export function ShareButtons({ title, url }: { title: string; url: string }) {
  return (
    <div className="share-buttons">
      <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}>
        Share on Twitter
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>
        Share on Facebook
      </a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}>
        Share on LinkedIn
      </a>
    </div>
  );
}
```

---

### **D. Comments/Reflections Section**

If you want community to respond:

```tsx
// Simple comment form
<section className="reflections">
  <h2>Your Reflections</h2>
  <p>If you've done similar work in your community, or if this story resonates with you, we'd love to hear from you.</p>
  <form action="/api/reflections" method="POST">
    <input type="hidden" name="article_id" value={articleId} />
    <textarea name="reflection" placeholder="Share your thoughts..." />
    <button type="submit">Share Reflection</button>
  </form>
</section>
```

---

## PART 9: PROMOTION STRATEGY

### **Week 1: Soft Launch**

**Audience:** Internal review, close community members
**Channels:** Direct email, private link
**Goal:** Final feedback, catch any errors

---

### **Week 2: Community Launch**

**Audience:** JusticeHub community, Mount Isa networks
**Channels:**
- JusticeHub newsletter
- Social media (LinkedIn, Twitter, Facebook)
- Direct shares to Bourke, Moree, Alice Springs communities
**Assets:**
- Pull quote graphics (Canva templates)
- Video clips (2-3 min for social)
- Infographic (25 young people, 20 years, $0 compensation)

---

### **Week 3: Media Push**

**Targets:**
- ABC (pitch to Four Corners team, Heywire, Indigenous programs)
- Guardian Australia (Indigenous affairs reporter)
- NITV
- Queensland-specific outlets (Brisbane Times, Courier-Mail)
- Mount Isa community radio/news

**Pitch Angle:**
> "While NSW asks for community-led solutions to youth justice crisis, Mount Isa Aunty has been doing this work—unpaid—for 20 years. Here's what she says about 'tick-and-flick funding' and why services with millions compete while she gets nothing."

---

### **Week 4: Policy/Funder Outreach**

**Targets:**
- NSW Government (Department of Communities and Justice)
- Mindaroo Foundation
- Closing the Gap implementation team
- Youth Justice advocacy organizations

**Use Case:**
- Evidence for NSW grant application (due Jan 19, 2026)
- Case study for Mindaroo proposal
- Proof of concept for community-led infrastructure funding

---

## PART 10: MAINTENANCE & UPDATES

### **6 Months Post-Publication:**

- [ ] Check analytics (page views, time on page, shares)
- [ ] Review comments/reflections
- [ ] Update if new developments (e.g., Aunty receives funding, VOP program reinstated)
- [ ] Add to any new related content (tag in future stories)

### **Annual Update:**

- [ ] Check in with Aunty Corrine
- [ ] Update numbers if applicable (e.g., 26 young people, 21 years)
- [ ] Add new case studies if available
- [ ] Refresh media (new photos, updated videos)

---

## FINAL CHECKLIST: READY TO PUBLISH?

**Legal/Ethical:**
- [ ] Aunty Corrine has given explicit written consent
- [ ] All young people mentioned consented or anonymized
- [ ] No identifying information that could harm young people
- [ ] Cultural safety reviewed (by Aunty or cultural advisor)
- [ ] Empathy Ledger principles followed (community owns story)

**Technical:**
- [ ] All files in correct locations
- [ ] Database records created
- [ ] Page renders correctly
- [ ] Media loads without errors
- [ ] Links all working
- [ ] Mobile responsive
- [ ] Accessible (WCAG 2.1 AA)

**Content:**
- [ ] Story accurate and approved
- [ ] Quotes verbatim from transcripts
- [ ] Tone respectful and strengths-based
- [ ] Honors Aunty's expertise
- [ ] Connects to broader advocacy goals
- [ ] Call to action clear

**Promotion:**
- [ ] Social media assets ready
- [ ] Newsletter draft written
- [ ] Media pitch prepared
- [ ] Key stakeholders identified
- [ ] Sharing plan documented

---

## SUPPORT & TROUBLESHOOTING

**If images don't load:**
- Check file paths are correct (`/images/articles/aunty-corrine/...`)
- Verify files uploaded to public folder or Supabase
- Check browser console for 404 errors

**If videos don't embed:**
- Confirm YouTube/Vimeo embed code correct
- Check privacy settings (video must be public or unlisted)
- Test iframe code in standalone HTML first

**If related content doesn't show:**
- Check database relationships exist
- Verify slugs match between article and related items
- Check loader function queries correct

**If page doesn't render:**
- Check frontmatter syntax (valid YAML)
- Verify markdown file in correct location
- Check database record exists with matching slug

---

## YOU'RE READY!

You now have everything you need to publish Aunty Corrine's story as a rich multimedia piece on JusticeHub.

**Next steps:**
1. Get Aunty's consent (send draft)
2. Prepare media (photos, videos)
3. Create markdown file
4. Set up database
5. Test on staging
6. Launch & promote

**The story is powerful. The evidence is clear. The call to action is urgent.**

Now make it live so Aunty gets the voices behind her that she deserves.

---

*Questions? Issues? Need help? Document problems as you go and we'll troubleshoot together.*
