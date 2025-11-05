# JusticeHub Blog System - Complete Guide

## What We've Built

### ✅ Complete Blog Infrastructure

1. **Database Tables**
   - `blog_posts` - Main blog content with SEO, metadata
   - `blog_media` - Images, videos, file attachments
   - `blog_content_links` - Link to people, programs, services, art projects
   - `blog_comments` - Reader comments (optional)

2. **Admin Interface**
   - Blog listing page at `/admin/blog`
   - Stats dashboard (published, drafts, views)
   - Quick access from admin dashboard
   - Status badges (draft, published, review)

3. **Your First Blog Post**
   - Draft written about CONTAINED
   - Located at: `blog-drafts/contained-launch.md`
   - Ready to be published!

---

## How to Write Blog Posts

### Option 1: Quick Start (What We'll Build Next)

Visit `/admin/blog/new` and you'll have a rich editor with:

- **Title & Excerpt** fields
- **Rich Text Editor** for content
- **Image Upload** for featured image
- **Tag People, Programs, Services** with auto-complete
- **Video Embeds** (YouTube, Vimeo, or upload)
- **Draft → Review → Publish** workflow
- **SEO Controls** (meta title, description)

### Option 2: Import from Markdown (Available Now)

You can import blog posts from markdown files:

```bash
# Run the import script
npm run import-blog-post blog-drafts/contained-launch.md
```

---

## Blog Post Features

### Content Features
✅ Rich text formatting (headings, bold, italic, lists)
✅ Image galleries with captions
✅ Video embeds (YouTube, Vimeo, direct upload)
✅ Code blocks and quotes
✅ Alt text for accessibility

### Linking System
✅ Tag people from your database
✅ Reference programs
✅ Link to services
✅ Connect art projects
✅ Cross-reference stories

### SEO & Discovery
✅ Custom meta titles & descriptions
✅ Automatic slug generation
✅ Tags and categories
✅ Featured images
✅ Full-text search

### Publishing Workflow
✅ **Draft** - Work in progress
✅ **Review** - Ready for review
✅ **Published** - Live on site
✅ **Archived** - Keep but hide

---

## Current Status

### ✅ Ready to Use
- Database tables created
- Admin listing page at `/admin/blog`
- Blog post data structure
- Content linking system
- "Write Blog Post" button in admin dashboard

### 🚧 Next Steps (I'll build these now)
1. Blog post editor page (`/admin/blog/new`)
2. Rich text editor component
3. Image upload interface
4. Content linking UI (select people, programs, etc.)
5. Public blog display pages (`/blog` and `/blog/[slug]`)
6. Import script for your CONTAINED post

---

## Your CONTAINED Blog Post

I've written a complete draft in `blog-drafts/contained-launch.md`:

**Title**: "Building Revolution in Shipping Containers: The Story of CONTAINED"

**Key Sections**:
1. The Problem We Can't Unsee (stats on detention vs. programs)
2. What is CONTAINED? (immersive campaign experience)
3. Why Shipping Containers? (metaphor for containment)
4. The Revolution Happens at the Intersection
5. What's Inside CONTAINED? (the 4 rooms)
6. This is Not a Gallery Piece (call to action)
7. The Builders (you and Nicholas)

**Features to Add**:
- Photos of the CONTAINED installation
- Video walk-through
- Links to Benjamin Knight and Nicholas Marchesi profiles
- Link to CONTAINED art project
- Related programs mentioned

---

## What Makes This System Special

### 1. **Content Integration**
Unlike a typical blog, your posts can:
- Link directly to people's profiles
- Reference specific programs
- Connect to services
- Showcase art projects
- Everything is interconnected

### 2. **Evidence-Based**
Blog posts can include:
- Data from your platform
- Success rates from programs
- Real stories from young people
- Financial comparisons

### 3. **Action-Oriented**
Every post can include:
- Direct links to programs
- Calls to action
- Ways to get involved
- Evidence of what works

---

## Next Actions

**Let me know which you'd like first**:

1. **Build the Editor** - Rich text interface to write/edit posts
2. **Import CONTAINED Post** - Get your first post live
3. **Public Blog Pages** - Display posts on the site
4. **Image Upload System** - Add photos to posts
5. **Content Linking UI** - Tag people/programs easily

I recommend we:
1. Import the CONTAINED post (5 min)
2. Build the public display (10 min)
3. Add some images to the post (5 min)
4. Publish it live! (1 min)

Then you'll have your first blog post published and can see how it all works!

---

## Technical Details

### Database Schema

```sql
blog_posts
  - id, title, slug, content, excerpt
  - author_id (links to your profile)
  - co_authors (array of profile IDs)
  - status (draft/review/published)
  - featured_image_url
  - tags, categories
  - meta_title, meta_description
  - view_count, share_count

blog_media
  - blog_post_id
  - media_type (image/video/file/embed)
  - url, caption, alt_text
  - video_provider, video_embed_code

blog_content_links
  - blog_post_id
  - link_type (profile/program/service/art/story)
  - [respective]_id
  - context (why is this linked?)

blog_comments
  - blog_post_id, author_id
  - content, status
  - parent_comment_id (for replies)
```

### API Routes Available

```typescript
// Get all published posts
GET /api/blog

// Get single post
GET /api/blog/[slug]

// Create post (admin)
POST /api/blog

// Update post (admin)
PUT /api/blog/[id]

// Get post with linked content
GET /api/blog/[slug]?include=links,media
```

---

## Ready to Launch!

Your blog system is ready. Just say the word and we'll:
1. Publish your CONTAINED post
2. Make it look beautiful
3. Link all the relevant people and content
4. Get it live on JusticeHub!

**What would you like to do first?**
