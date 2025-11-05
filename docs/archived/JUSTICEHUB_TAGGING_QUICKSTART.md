# 🏷️ JusticeHub Content Tagging - Quick Start

## 🎯 Goal
Show only specific stories/profiles on JusticeHub from your shared Supabase database.

## ✅ Recommended Approach: Use `project_id`

Your database already has `project_id` field in stories table! We'll use it to filter JusticeHub content.

## 🚀 5-Minute Setup

### Step 1: Create JusticeHub Project in Supabase

1. **Go to:** https://supabase.com/dashboard/project/yvnuayzslukamizrlhwb
2. **Click:** SQL Editor
3. **Run this SQL:**

```sql
-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public projects" 
  ON public.projects FOR SELECT 
  USING (is_public = true);

-- Insert JusticeHub project
INSERT INTO public.projects (name, slug, description, is_public)
VALUES ('JusticeHub', 'justicehub', 'JusticeHub platform stories', true)
ON CONFLICT (slug) DO NOTHING
RETURNING id;
```

4. **Copy the UUID** from the result (looks like: `123e4567-e89b-12d3-a456-426614174000`)

### Step 2: Add Project ID to Environment

Add to `.env.local`:
```bash
# Backup first
./scripts/backup-env.sh

# Add this line
NEXT_PUBLIC_JUSTICEHUB_PROJECT_ID=paste-your-uuid-here
```

### Step 3: Tag Some Stories for JusticeHub

**Option A: Tag Featured Stories (Quickest)**
```sql
-- Tag 10 featured stories
UPDATE stories
SET project_id = 'YOUR_JUSTICEHUB_PROJECT_ID'
WHERE is_featured = true
  AND has_explicit_consent = true
  AND is_public = true
  AND status = 'published'
LIMIT 10;
```

**Option B: Tag Specific Stories**
```sql
-- Tag by story IDs
UPDATE stories
SET project_id = 'YOUR_JUSTICEHUB_PROJECT_ID'
WHERE id IN (
  'story-id-1',
  'story-id-2',
  'story-id-3'
);
```

**Option C: Tag by Category/Theme**
```sql
-- Tag stories with specific theme
UPDATE stories
SET project_id = 'YOUR_JUSTICEHUB_PROJECT_ID'
WHERE 'youth' = ANY(themes)
  AND has_explicit_consent = true
  AND is_public = true;
```

### Step 4: Verify Tagged Stories

```sql
-- Count JusticeHub stories
SELECT count(*) 
FROM stories 
WHERE project_id = 'YOUR_JUSTICEHUB_PROJECT_ID';

-- View first 5
SELECT id, title, published_at
FROM stories
WHERE project_id = 'YOUR_JUSTICEHUB_PROJECT_ID'
LIMIT 5;
```

## 📝 Using in Your Code

```typescript
// src/lib/queries/justicehub-stories.ts
import { createClient } from '@/lib/supabase/server'

const JUSTICEHUB_PROJECT_ID = process.env.NEXT_PUBLIC_JUSTICEHUB_PROJECT_ID!

export async function getJusticeHubStories() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      author:profiles!author_id(*)
    `)
    .eq('project_id', JUSTICEHUB_PROJECT_ID)  // 🎯 Filter for JusticeHub
    .eq('has_explicit_consent', true)
    .eq('is_public', true)
    .order('published_at', { ascending: false })
  
  return { data, error }
}
```

## 🎨 Managing Content (Two Ways)

### Method 1: Via SQL (Quick & Direct)
```sql
-- Add story to JusticeHub
UPDATE stories 
SET project_id = 'YOUR_PROJECT_ID'
WHERE id = 'story-id';

-- Remove from JusticeHub  
UPDATE stories
SET project_id = NULL
WHERE id = 'story-id';
```

### Method 2: Via Your Other Platform (Future)
Add a checkbox in your story editor:
```tsx
<label>
  <input 
    type="checkbox"
    checked={story.project_id === JUSTICEHUB_PROJECT_ID}
    onChange={(e) => {
      updateStory({
        project_id: e.target.checked ? JUSTICEHUB_PROJECT_ID : null
      })
    }}
  />
  Show on JusticeHub
</label>
```

## 🔍 Alternative: Use Tags Array

If you prefer tags (stories can be on multiple platforms):

```sql
-- Add 'justicehub' tag
UPDATE stories
SET tags = array_append(tags, 'justicehub')
WHERE id = 'story-id'
  AND NOT ('justicehub' = ANY(tags));

-- Remove tag
UPDATE stories
SET tags = array_remove(tags, 'justicehub')
WHERE id = 'story-id';

-- Query tagged stories
SELECT * FROM stories
WHERE 'justicehub' = ANY(tags)
  AND has_explicit_consent = true;
```

## ✅ Benefits of This Approach

1. **Simple** - Single field to manage
2. **Fast** - Indexed for performance
3. **Flexible** - Can change anytime via SQL
4. **No Schema Changes** - Uses existing `project_id` field
5. **Cross-Platform** - Easy to manage from either frontend
6. **Secure** - Respects all existing consent/privacy flags

## 📊 Comparison

| Method | Best For | Complexity |
|--------|----------|------------|
| `project_id` | Exclusive platform | ⭐ Simple |
| `tags` array | Multiple platforms | ⭐⭐ Medium |
| Junction table | Complex relationships | ⭐⭐⭐ Advanced |

**Recommendation:** Start with `project_id`, migrate to `tags` later if needed.

## 🚦 Next Steps

1. ✅ Run SQL to create JusticeHub project
2. ✅ Copy project UUID
3. ✅ Add to `.env.local`
4. ✅ Tag 5-10 stories for testing
5. ✅ Build stories page with filtered queries
6. 🎯 Add "Publish to JusticeHub" UI in other platform (optional)

**Ready to implement?** I can help you:
- Build the stories page with JusticeHub filtering
- Create the tagging UI in your other platform
- Set up bulk tagging queries

Just let me know! 🚀
