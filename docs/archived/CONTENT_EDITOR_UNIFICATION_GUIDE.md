# Content Editor Unification - Implementation Guide

## Overview

This guide walks through unifying the separate Blog Posts and Stories editing systems into a single content editor.

## Current State

**Two Separate Systems:**
1. **Blog Posts** (`blog_posts` table)
   - Editor: `/admin/blog/new`
   - Count: 4 posts
   - Features: Enhanced editor (fullscreen, templates, auto-save, unique slugs)

2. **Stories** (`articles` table)
   - Editor: `/stories/new`
   - Count: 37 articles
   - Features: Basic editor

**Goal:** Single unified "Stories" editor with all enhanced features.

## Step-by-Step Implementation

### Phase 1: Database Schema Enhancement ✅

**Status:** Scripts created, SQL ready to apply

**Files Created:**
- `/supabase/migrations/20250126000003_enhance_articles_for_unification.sql`
- `/src/scripts/enhance-articles-table.ts` (diagnostic)
- `/src/scripts/migrate-blog-posts-to-articles.ts` (migration)

#### 1.1 Apply Schema Migration

**Run this SQL in Supabase Dashboard:**

```sql
-- Enhance articles table with blog_posts features
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS featured_image_caption TEXT,
  ADD COLUMN IF NOT EXISTS co_authors UUID[],
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS categories TEXT[];

-- Add helpful comments
COMMENT ON COLUMN articles.featured_image_caption IS 'Caption for the featured image';
COMMENT ON COLUMN articles.co_authors IS 'Array of profile IDs for co-authors (references public_profiles.id)';
COMMENT ON COLUMN articles.tags IS 'Content tags for categorization and filtering';
COMMENT ON COLUMN articles.categories IS 'Content categories (array) - first element becomes primary category';
COMMENT ON COLUMN articles.share_count IS 'Number of times content has been shared on social media';
```

**Steps:**
1. Go to https://supabase.com/dashboard
2. Select JusticeHub project
3. Click "SQL Editor" → "New Query"
4. Paste SQL above
5. Click "RUN"

#### 1.2 Verify Schema Change

```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/enhance-articles-table.ts
```

Should show: "✅ All required fields already exist!"

---

### Phase 2: Data Migration

**Migrate 4 blog posts to articles table**

#### 2.1 Run Migration Script

```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/migrate-blog-posts-to-articles.ts
```

**What It Does:**
- Checks for existing articles with same slug (skips duplicates)
- Maps blog_posts fields to articles fields:
  - `meta_title` → `seo_title`
  - `meta_description` → `seo_description`
  - `categories[0]` → `category` (primary)
- Preserves all data including IDs, timestamps, etc.

**Expected Output:**
```
✅ Migrated: 4
⏭️  Skipped (already exist): 0
❌ Errors: 0
```

#### 2.2 Verify Migration

Check in Supabase dashboard:
```sql
SELECT id, title, slug, status, published_at
FROM articles
WHERE slug LIKE '%building-revolution%'
   OR slug LIKE '%test%'
ORDER BY created_at DESC;
```

---

### Phase 3: Enhanced Stories Editor ⏳

**Copy all blog editor features to stories editor**

#### 3.1 Read Current Editors

Files to compare:
- Source: `/src/app/admin/blog/new/page.tsx` (enhanced)
- Target: `/src/app/stories/new/page.tsx` (basic)

#### 3.2 Features to Copy

From blog editor:
1. **Unique slug generation** (lines 105-121)
   ```typescript
   const timestamp = Date.now().toString().slice(-6);
   const uniqueSlug = baseSlug ? `${baseSlug}-${timestamp}` : `post-${timestamp}`;
   ```

2. **Fullscreen mode** (state, toggle, overlay)
   ```typescript
   const [isFullscreen, setIsFullscreen] = useState(false);
   ```

3. **Templates dropdown** (pre-filled content structures)

4. **Auto-save** (periodic save with indicator)

5. **Enhanced error handling**
   ```typescript
   if (error.code === '23505') {
     errorMsg = 'A post with this slug already exists...';
   } else if (error.code === '42501') {
     errorMsg = 'Permission denied...';
   }
   ```

6. **Keyboard shortcuts** (Cmd+S for save, etc.)

7. **Word count, character count, reading time** display

#### 3.3 Field Mappings for Stories Editor

Update form to use articles table with new fields:

```typescript
interface ArticleFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string | null;
  featured_image_caption: string | null;  // NEW
  author_id: string;
  co_authors: string[] | null;            // NEW
  status: 'draft' | 'published';
  published_at: string | null;
  tags: string[] | null;                  // NEW
  categories: string[] | null;            // NEW
  category: string | null;                // Existing
  seo_title: string | null;
  seo_description: string | null;
  is_trending: boolean;
  location_tags: string[] | null;
  metadata: Record<string, any>;
  share_count: number;                    // NEW
}
```

#### 3.4 Update Stories Editor

Create `/src/app/stories/new/page.tsx` with:
- All form fields from blog editor
- Table reference changed to `articles` (not `blog_posts`)
- All enhanced features from blog editor
- Updated field names (seo_* instead of meta_*)

---

### Phase 4: Navigation Updates ⏳

#### 4.1 Remove Blog Posts from Admin Nav

File: `/src/components/ui/navigation.tsx` (or wherever admin nav is)

**Before:**
```tsx
<AdminNav>
  <Link href="/admin/blog">Blog Posts</Link>
  <Link href="/admin/stories">Stories</Link>
</AdminNav>
```

**After:**
```tsx
<AdminNav>
  <Link href="/admin/stories">Stories</Link>
</AdminNav>
```

#### 4.2 Add Redirects

Create `/src/middleware.ts` redirects:

```typescript
// Redirect old blog routes to stories
if (pathname.startsWith('/admin/blog')) {
  return NextResponse.redirect(new URL('/admin/stories', request.url));
}
```

Or add to existing route handlers.

---

### Phase 5: Testing ⏳

#### 5.1 Test Creating New Story

1. Go to http://localhost:3003/stories/new
2. Fill in all fields:
   - Title
   - Content
   - Featured image
   - Featured image caption (NEW)
   - Tags (NEW)
   - Categories (NEW)
3. Test fullscreen mode
4. Test templates
5. Save as draft
6. Verify in database

#### 5.2 Test Editing Existing Story

1. Go to `/stories/[slug]/edit`
2. Modify content
3. Test auto-save
4. Publish
5. Verify changes

#### 5.3 Test Migrated Blog Posts

1. Find one of the 4 migrated blog posts
2. Open in stories editor
3. Verify all data present:
   - Title, content, excerpt ✓
   - Featured image + caption ✓
   - Tags, categories ✓
   - SEO fields ✓
4. Make minor edit and save
5. Verify update successful

---

### Phase 6: Cleanup & Archive ⏳

#### 6.1 Archive Blog Editor

**Option 1: Remove entirely**
```bash
rm -rf src/app/admin/blog
```

**Option 2: Keep for reference**
```bash
mkdir -p archive/admin
mv src/app/admin/blog archive/admin/blog-editor-original
```

#### 6.2 Update Documentation

Files to update:
- `README.md` - Remove blog posts section, update stories section
- `BLOG_EDITOR_COMPLETE.md` - Add note about unification
- Create `STORIES_EDITOR_GUIDE.md` - Single comprehensive guide

#### 6.3 Archive blog_posts Table

**Do NOT delete** - keep for data safety

Add comment in Supabase:
```sql
COMMENT ON TABLE blog_posts IS 'ARCHIVED: Data migrated to articles table on 2025-01-26. Keep for reference.';
```

Or create archive table:
```sql
ALTER TABLE blog_posts RENAME TO _archived_blog_posts;
```

---

## Verification Checklist

After completing all phases:

- [ ] ✅ Articles table has all new columns
- [ ] ✅ 4 blog posts migrated to articles
- [ ] ✅ Stories editor has fullscreen mode
- [ ] ✅ Stories editor has templates
- [ ] ✅ Stories editor has auto-save
- [ ] ✅ Stories editor has unique slug generation
- [ ] ✅ Stories editor has enhanced error handling
- [ ] ✅ Can create new story with all fields
- [ ] ✅ Can edit existing articles
- [ ] ✅ Can edit migrated blog posts
- [ ] ✅ `/admin/blog` redirects to `/admin/stories`
- [ ] ✅ Navigation only shows "Stories" (not "Blog Posts")
- [ ] ✅ All 41 content items accessible (37 + 4 migrated)

---

## Current Status

### ✅ Completed
1. Created schema migration SQL
2. Created data migration script
3. Created diagnostic scripts
4. Analyzed differences between editors

### ⏳ Next Steps
1. **YOU:** Apply schema migration SQL in Supabase dashboard
2. **YOU:** Run data migration script
3. **ME:** Copy enhanced blog editor to stories editor
4. **ME:** Update navigation
5. **ME:** Add redirects
6. **ME:** Test everything
7. **YOU:** Approve and deploy

---

## Rollback Plan

If issues arise:

1. **Data is safe** - blog_posts table untouched
2. **Can revert schema:**
   ```sql
   ALTER TABLE articles
     DROP COLUMN IF EXISTS featured_image_caption,
     DROP COLUMN IF EXISTS co_authors,
     DROP COLUMN IF EXISTS tags,
     DROP COLUMN IF EXISTS share_count,
     DROP COLUMN IF EXISTS categories;
   ```

3. **Can delete migrated articles:**
   ```sql
   DELETE FROM articles
   WHERE slug IN (
     SELECT slug FROM blog_posts
   );
   ```

4. **Restore blog editor** from git history

---

## Timeline Estimate

- Schema migration: **2 min** (apply SQL)
- Data migration: **2 min** (run script)
- Copy editor features: **45 min** (careful implementation)
- Navigation updates: **10 min**
- Redirects: **5 min**
- Testing: **20 min**
- Documentation: **15 min**

**Total: ~1.5 hours**

---

## Support Commands

```bash
# Check schema
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/enhance-articles-table.ts

# Run migration
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/migrate-blog-posts-to-articles.ts

# Verify articles count
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.YJSF_SUPABASE_SERVICE_KEY);
const { count } = await supabase.from('articles').select('*', { count: 'exact', head: true });
console.log('Total articles:', count);
"
```

---

**Ready to proceed!** Start with Phase 1.1: Apply the schema migration SQL in Supabase dashboard.
