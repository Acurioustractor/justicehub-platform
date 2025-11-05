# Content Editor Unification - Progress Report

## ✅ Completed Steps

### 1. Database Schema Enhancement
**Status:** ✅ COMPLETE

- Applied SQL migration to articles table
- Added 5 new columns:
  - `featured_image_caption` (TEXT)
  - `co_authors` (UUID[])
  - `tags` (TEXT[])
  - `share_count` (INTEGER DEFAULT 0)
  - `categories` (TEXT[])

**Verification:**
```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/enhance-articles-table.ts
```
Output: "✅ All required fields already exist!"

### 2. Data Migration
**Status:** ✅ COMPLETE

- Migrated 1 real blog post to articles table
- Skipped 3 test/empty posts
- Fixed author_id (used Benjamin Knight's valid author ID)
- Mapped categories correctly (`Campaign` → `growth`)

**Migrated Content:**
- Title: "Building Revolution in Shipping Containers: The Story of CONTAINED"
- Slug: `building-revolution-in-shipping-containers`
- Tags: YouthJustice, CONTAINED, SystemsChange, ImmersiveExperience, ACuriousTractor, etc.
- Categories: Campaign, Art & Innovation, Systems Change
- Primary category: `growth`

**Files Created:**
- `/supabase/migrations/20250126000003_enhance_articles_for_unification.sql`
- `/src/scripts/enhance-articles-table.ts`
- `/src/scripts/migrate-blog-posts-to-articles.ts`
- `/src/scripts/check-migration-constraints.ts`

## 🔄 In Progress

### 3. Unified Stories Editor
**Status:** 🔄 IN PROGRESS

**Current Situation:**
- Enhanced blog editor exists at `/src/app/admin/blog/new/page.tsx` (692 lines)
- Admin stories page exists at `/src/app/admin/stories/page.tsx`
- Admin stories page currently links to blog editor (`/admin/blog/new`)

**What Needs to Be Done:**
1. Copy blog editor to `/src/app/admin/stories/new/page.tsx`
2. Modify to use `articles` table instead of `blog_posts`
3. Add new fields from unification (featured_image_caption, categories, etc.)
4. Update form field mappings (meta_title → seo_title, etc.)

**Key Changes Needed:**

#### A. Table Reference
```typescript
// OLD (blog editor)
const { data, error } = await supabase
  .from('blog_posts')
  .insert([postData])

// NEW (stories editor)
const { data, error } = await supabase
  .from('articles')
  .insert([postData])
```

#### B. Form Data Structure
```typescript
// Add to form state:
const [formData, setFormData] = useState({
  // ... existing fields
  featured_image_caption: '',  // NEW
  categories: [] as string[],  // NEW
  category: '',                // Existing in articles
  seo_title: '',              // Renamed from meta_title
  seo_description: '',        // Renamed from meta_description
  co_authors: [] as string[], // NEW
  share_count: 0,            // NEW
});
```

#### C. Author Reference
```typescript
// Blog editor gets profile.id
// Stories editor needs to get from authors table

// OLD
const { data: profile } = await supabase
  .from('public_profiles')
  .select('id')
  .eq('user_id', user.id)
  .single();

// NEW
const { data: author } = await supabase
  .from('authors')
  .select('id')
  .eq('email', user.email) // Or however authors are linked
  .single();
```

#### D. Add UI for New Fields

1. **Featured Image Caption** (after featured image)
```tsx
<div className="mt-3">
  <label className="block text-sm font-bold text-black mb-2">
    Image Caption
  </label>
  <input
    type="text"
    value={formData.featured_image_caption}
    onChange={(e) => setFormData({ ...formData, featured_image_caption: e.target.value })}
    className="w-full px-3 py-2 border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
    placeholder="Caption for the featured image..."
  />
</div>
```

2. **Categories** (similar to tags)
```tsx
<div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
  <label className="block text-sm font-bold text-black mb-2">
    Categories
  </label>
  {/* Similar UI to Tags section */}
</div>
```

3. **SEO Fields** (new sidebar section)
```tsx
<div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
  <label className="block text-sm font-bold text-black mb-2">
    SEO Title
  </label>
  <input
    type="text"
    value={formData.seo_title}
    onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
    placeholder="Custom title for search engines..."
  />

  <label className="block text-sm font-bold text-black mb-2 mt-4">
    SEO Description
  </label>
  <textarea
    value={formData.seo_description}
    onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
    placeholder="Custom description for search results..."
    rows={3}
  />
</div>
```

## ⏸️ Pending Steps

### 4. Update Navigation
**Status:** ⏸️ PENDING

**File:** `/src/app/admin/stories/page.tsx`

**Changes Needed:**
```typescript
// Lines 44, 91 - Change from:
href="/admin/blog/new"

// To:
href="/admin/stories/new"
```

### 5. Add Redirects
**Status:** ⏸️ PENDING

**File:** `/src/middleware.ts` or Next.js rewrites

**Add:**
```typescript
// Redirect old blog routes to stories
if (request.nextUrl.pathname.startsWith('/admin/blog')) {
  return NextResponse.redirect(new URL('/admin/stories', request.url));
}
```

### 6. Testing
**Status:** ⏸️ PENDING

**Test Checklist:**
- [ ] Create new story with all fields
- [ ] Save as draft
- [ ] Publish story
- [ ] Edit existing article
- [ ] Edit migrated blog post
- [ ] Verify all fields save correctly
- [ ] Test fullscreen mode
- [ ] Test auto-save
- [ ] Test templates
- [ ] Test image upload

## 📊 Overall Progress

```
Phase 1: Schema Enhancement  ████████████ 100%
Phase 2: Data Migration      ████████████ 100%
Phase 3: Unified Editor      ████░░░░░░░░  40%
Phase 4: Navigation          ░░░░░░░░░░░░   0%
Phase 5: Redirects           ░░░░░░░░░░░░   0%
Phase 6: Testing             ░░░░░░░░░░░░   0%

TOTAL PROGRESS               ███████░░░░░  60%
```

## 🎯 Next Immediate Action

**Create the unified stories editor at `/src/app/admin/stories/new/page.tsx`**

This is a 692-line file that needs to be carefully copied and modified. The changes are:

1. Replace all `blog_posts` → `articles`
2. Update navigation paths (`/admin/blog` → `/admin/stories`)
3. Add new form fields
4. Update field mappings (meta_* → seo_*)
5. Fix author lookup
6. Add UI for new fields

**Estimated Time:** 30-45 minutes

---

## 📝 Files Created So Far

1. `/supabase/migrations/20250126000003_enhance_articles_for_unification.sql`
2. `/src/scripts/enhance-articles-table.ts`
3. `/src/scripts/migrate-blog-posts-to-articles.ts`
4. `/src/scripts/check-migration-constraints.ts`
5. `/Users/benknight/Code/JusticeHub/CONTENT_EDITOR_UNIFICATION_GUIDE.md`
6. `/Users/benknight/Code/JusticeHub/UNIFICATION_PROGRESS.md` (this file)

## 🔍 Verification Commands

```bash
# Check schema
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/enhance-articles-table.ts

# Check migrated data
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx -e "import { createClient } from '@supabase/supabase-js'; const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.YJSF_SUPABASE_SERVICE_KEY); supabase.from('articles').select('id, title, slug, category, categories, tags').eq('slug', 'building-revolution-in-shipping-containers').single().then(({ data }) => console.log(JSON.stringify(data, null, 2)));"

# Count articles
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx -e "import { createClient } from '@supabase/supabase-js'; const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.YJSF_SUPABASE_SERVICE_KEY); supabase.from('articles').select('*', { count: 'exact', head: true }).then(({ count }) => console.log('Total articles:', count));"
```

---

**Last Updated:** 2025-01-26
**Status:** 60% Complete - Schema ✅, Migration ✅, Editor 🔄
