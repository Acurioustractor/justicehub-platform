# Unified Content Editor - Migration Plan

## Current State Analysis

### The Problem
**Two separate content systems with duplicate functionality:**

1. **Blog Posts** (`blog_posts` table)
   - Editor: `/admin/blog/new`
   - Count: 4 posts
   - Features: Enhanced editor with fullscreen, templates, auto-save
   - Status: Recently improved (Oct 26)

2. **Stories** (`articles` table)
   - Editor: `/stories/new`
   - Count: 37 articles
   - Features: Basic editor
   - Status: Contains all migrated Webflow content

### Schema Comparison

**Common Fields** (Both tables have):
- id, created_at, updated_at, published_at
- title, slug, excerpt, content
- featured_image_url, author_id, status
- view_count, reading_time_minutes

**blog_posts ONLY**:
- featured_image_caption
- co_authors (array)
- tags (array)
- categories (array)
- meta_title, meta_description
- share_count

**articles ONLY**:
- category (single)
- is_trending (boolean)
- seo_title, seo_description
- location_tags
- metadata (JSONB)

## Recommended Solution

### ✅ Unify into `articles` table

**Why `articles` instead of `blog_posts`:**
1. **Has the content** - 37 articles vs 4 blog posts
2. **Better naming** - "Stories" is more inclusive than "Blog"
3. **Established** - Already integrated with profiles, programs
4. **Extensible** - metadata JSONB allows flexibility

### Migration Strategy

**Phase 1: Enhance `articles` schema** ✅
Add missing features from `blog_posts`:
```sql
ALTER TABLE articles ADD COLUMN IF NOT EXISTS featured_image_caption TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS co_authors UUID[];
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE articles ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;
```

**Phase 2: Migrate blog_posts → articles** ✅
- Move 4 blog posts to articles table
- Map fields appropriately
- Preserve all data

**Phase 3: Replace blog editor with stories editor** ✅
- Move enhanced editor features to `/stories/new`
- Update `/admin/blog/*` to redirect to `/admin/stories/*`
- Update navigation

**Phase 4: Archive blog_posts table** ✅
- Keep for historical reference
- Remove from active use
- Update documentation

## Detailed Implementation Plan

### Step 1: Enhance articles table schema

```sql
-- Add missing columns from blog_posts
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS featured_image_caption TEXT,
  ADD COLUMN IF NOT EXISTS co_authors UUID[],
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

-- Unify SEO fields (rename for consistency)
-- articles has: seo_title, seo_description
-- blog_posts has: meta_title, meta_description
-- Keep articles naming (seo_*) as it's more descriptive

-- Unify category vs categories
-- articles has: category (single string)
-- blog_posts has: categories (array)
-- Solution: Add categories array, keep category for primary
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS categories TEXT[];

-- Update category to be generated from categories[0] if needed
```

### Step 2: Migrate existing blog_posts

**Script: `src/scripts/migrate-blog-posts-to-articles.ts`**

```typescript
// For each blog_post:
// 1. Check if already exists in articles (by slug)
// 2. If not, insert with field mapping:
//    - meta_title → seo_title
//    - meta_description → seo_description
//    - categories → categories (array)
//    - categories[0] → category (primary)
//    - All other common fields direct copy
// 3. Preserve IDs if possible, or create mapping
```

### Step 3: Upgrade stories editor

**Copy enhanced features from blog editor:**

1. **Fullscreen mode** ✅ (already implemented in blog)
2. **Templates** ✅ (already implemented in blog)
3. **Auto-save** ✅ (already implemented in blog)
4. **Enhanced error handling** ✅ (already implemented in blog)
5. **Unique slug generation** ✅ (already implemented in blog)
6. **Image upload** ✅ (already implemented in blog)

**Action:** Copy `/admin/blog/new/page.tsx` → `/stories/new/page.tsx`
- Update to use `articles` table instead of `blog_posts`
- Keep all enhanced features
- Update field mappings

### Step 4: Update admin navigation

**Current:**
```
Admin Panel
├── Blog Posts → /admin/blog
├── Stories → /admin/stories
└── ...
```

**Unified:**
```
Admin Panel
├── Stories → /admin/stories (enhanced editor)
└── ...
```

**Redirect old blog routes:**
- `/admin/blog` → `/admin/stories`
- `/admin/blog/new` → `/stories/new`
- `/blog/[slug]` → `/stories/[slug]` (or keep both working)

### Step 5: Clean up codebase

**Remove/Archive:**
- `/src/app/admin/blog/` (redirect to stories)
- Blog-specific migrations (document in archive)
- Blog-specific documentation (consolidate)

**Update:**
- Navigation components
- API routes (if any blog-specific ones)
- Documentation
- README

## Benefits

### User Experience
- ✅ Single, consistent editor for all content
- ✅ No confusion about which editor to use
- ✅ Best features from both systems combined

### Developer Experience
- ✅ Single codebase to maintain
- ✅ Clearer data model
- ✅ Easier to extend
- ✅ Less duplication

### Content Management
- ✅ All content in one place
- ✅ Consistent taxonomy
- ✅ Better search/filtering
- ✅ Unified analytics

## Migration Checklist

### Pre-Migration
- [x] Analyze both tables
- [x] Identify field differences
- [ ] Create schema migration
- [ ] Test migration script locally

### Migration
- [ ] Backup database
- [ ] Run schema enhancement on articles
- [ ] Migrate blog_posts data to articles
- [ ] Verify all data migrated correctly
- [ ] Test articles table with new fields

### Code Updates
- [ ] Copy enhanced editor to /stories/new
- [ ] Update articles table references
- [ ] Add redirects from /blog to /stories
- [ ] Update navigation
- [ ] Update API routes

### Testing
- [ ] Test creating new story with enhanced editor
- [ ] Test editing existing articles
- [ ] Test all enhanced features (fullscreen, templates, etc.)
- [ ] Test image uploads
- [ ] Test slug uniqueness
- [ ] Verify RLS policies work

### Cleanup
- [ ] Archive blog_posts table
- [ ] Remove /admin/blog routes
- [ ] Update documentation
- [ ] Update README
- [ ] Clear browser cache

### Post-Migration
- [ ] Monitor for issues
- [ ] Update any external links
- [ ] Update user documentation
- [ ] Create single "How to Create Stories" guide

## Field Mapping Reference

| blog_posts | articles | Notes |
|------------|----------|-------|
| id | id | Direct |
| title | title | Direct |
| slug | slug | Direct |
| content | content | Direct |
| excerpt | excerpt | Direct |
| featured_image_url | featured_image_url | Direct |
| featured_image_caption | featured_image_caption | **NEW FIELD** |
| author_id | author_id | Direct |
| co_authors | co_authors | **NEW FIELD** |
| status | status | Direct |
| published_at | published_at | Direct |
| tags | tags | **NEW FIELD** |
| categories | categories | **NEW FIELD** |
| categories[0] | category | Derive primary |
| meta_title | seo_title | Rename |
| meta_description | seo_description | Rename |
| view_count | view_count | Direct |
| share_count | share_count | **NEW FIELD** |
| reading_time_minutes | reading_time_minutes | Direct |
| created_at | created_at | Direct |
| updated_at | updated_at | Direct |
| N/A | is_trending | Keep existing |
| N/A | location_tags | Keep existing |
| N/A | metadata | Keep existing |

## Timeline Estimate

- **Schema Migration**: 15 min
- **Data Migration Script**: 30 min
- **Editor Enhancement**: 1 hour
- **Navigation Updates**: 15 min
- **Testing**: 30 min
- **Documentation**: 30 min

**Total**: ~3 hours

## Risks & Mitigation

### Risk 1: Data Loss
**Mitigation**: Full database backup before migration

### Risk 2: URL Breaking
**Mitigation**: Keep redirects from /blog → /stories

### Risk 3: RLS Policy Issues
**Mitigation**: Test with authenticated user before deploying

### Risk 4: Missing Features
**Mitigation**: Feature parity checklist

## Success Criteria

- ✅ All blog posts migrated to articles
- ✅ Enhanced editor working on /stories/new
- ✅ All features from blog editor available
- ✅ No duplicate content
- ✅ Clean navigation (no "Blog Posts" separate from "Stories")
- ✅ Documentation updated
- ✅ Old URLs redirect properly

---

## Next Steps

1. **Review this plan** - Confirm approach
2. **Create migration** - Build schema & data migration
3. **Enhance editor** - Copy blog features to stories
4. **Test thoroughly** - Verify everything works
5. **Deploy** - Execute migration
6. **Document** - Update guides

**Status**: Ready to implement
**Estimated Effort**: 3 hours
**Priority**: High (reduces confusion, improves UX)
