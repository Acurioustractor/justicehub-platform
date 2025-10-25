# Unified Content System - Blog & Stories Merged

## Summary

Successfully merged the blog system with the stories page to create a unified content experience. Users now access all content (youth stories, editorials, updates, research) from a single `/stories` page with filtering capabilities.

## What Was Done

### 1. Fixed Blog System Issues
- ✅ Added missing foreign key constraints to blog tables
- ✅ Fixed `!text-white` on blog hero heading
- ✅ Blog post page now loads correctly: http://localhost:3003/blog/building-revolution-in-shipping-containers

### 2. Unified Stories Page
- ✅ Updated `/stories` to fetch both `articles` and `blog_posts` tables
- ✅ Merged content sorted by publication date
- ✅ Added content type filtering (Youth Story, Editorial, Update, Research)
- ✅ Kept existing category filters (Seeds, Growth, Harvest, Roots)
- ✅ Added content type badges to distinguish articles vs blog posts
- ✅ Fixed Next.js 14 Suspense boundary requirement for `useSearchParams()`

### 3. Navigation Updates
- ✅ Removed separate "Blog" link from navigation
- ✅ Updated "Stories" description to "Voices and insights from the movement"
- ✅ Single unified navigation entry

### 4. Admin Dashboard Updates
- ✅ Merged "Write Blog Post" and "Create Story" buttons
- ✅ Now shows single "Write Story" button linking to `/admin/blog/new`
- ✅ Changed grid from 5 to 4 columns

## Current System Architecture

### Content Sources
1. **Articles Table** - Youth stories migrated from Webflow
   - Has: category, location_tags, reading_time_minutes
   - Links to: authors table

2. **Blog Posts Table** - New editorial content
   - Has: tags (array), co_authors, featured_image_caption
   - Links to: public_profiles table
   - Can link to: people, programs, services, art (via blog_content_links)

### Unified Display
- **URL**: http://localhost:3003/stories
- **Filters**:
  - Content Type: All Content, Youth Story, Editorial, Update, Research
  - Category (articles only): Seeds, Growth, Harvest, Roots
- **Display**: Cards with content type badges, featured content hero, grid layout

### Routing
- Articles: `/stories/[slug]` (existing route)
- Blog posts: `/blog/[slug]` (new route with full markdown, content linking)
- Both appear on unified `/stories` page

## Files Modified

### Created
- `/src/app/stories/page-content.tsx` - Client component with useSearchParams
- `/src/app/stories/page.tsx` - Server component with Suspense boundary
- `/src/scripts/fix-blog-foreign-keys.ts` - Added database foreign keys

### Updated
- `/src/components/ui/navigation.tsx` - Removed Blog link, updated Stories description
- `/src/app/admin/page.tsx` - Merged story creation buttons
- `/src/app/blog/page.tsx` - Fixed heading color with `!text-white`

## How to Use

### Writing New Content

1. Go to admin dashboard: http://localhost:3003/admin
2. Click "Write Story" in Quick Actions
3. Fill in the form:
   - **Title** - Auto-generates slug
   - **Excerpt** - Summary for cards
   - **Content** - Full markdown
   - **Featured Image** - URL input with preview
   - **Tags** - Add content type tags:
     - "Youth Story" for personal stories
     - "Editorial" for opinion pieces
     - "Update" for platform updates
     - "Research" for evidence-based content
   - **Categories** - Optional grouping
4. Choose publishing status:
   - Save Draft
   - Submit for Review
   - Publish Now

### Content Linking

Blog posts can link to:
- Profiles (people in the system)
- Programs (community programs)
- Services (support services)
- Art Projects (like CONTAINED)

Links appear in "Related Content" section on blog post pages.

## Testing Checklist

✅ Stories page loads: http://localhost:3003/stories
✅ Blog post page loads: http://localhost:3003/blog/building-revolution-in-shipping-containers
✅ CONTAINED appears in stories feed
✅ Content type filters work
✅ Category filters work
✅ No "Blog" link in navigation
✅ Admin shows "Write Story" button
✅ Admin button links to blog editor

## Benefits

1. **Single Content Hub** - Users find all content in one place
2. **Better Discovery** - Filter by type and category
3. **Unified Experience** - Consistent design and interaction
4. **Flexible System** - Can add articles OR blog posts, both appear together
5. **Rich Features** - Blog posts support markdown, media, content linking

## Next Steps (If Needed)

- Migrate existing articles to blog_posts table for richer features
- Add image upload to editor (currently uses URLs)
- Create content linking UI in editor
- Add reading time calculation for blog posts
- Consider unifying the two tables long-term

## Technical Notes

- Next.js 14 requires `useSearchParams()` wrapped in Suspense boundary
- Blog foreign keys were missing, added via script
- Global CSS `h1` styles override Tailwind - use `!` important prefix
- Client components split from server components for proper hydration

The unified content system is ready for production use!
