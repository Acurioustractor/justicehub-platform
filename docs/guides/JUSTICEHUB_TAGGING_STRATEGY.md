# 🏷️ JusticeHub Content Tagging Strategy

## 🎯 Goal
Filter stories and profiles from shared Supabase so only JusticeHub-relevant content appears on JusticeHub site, while keeping all content available on the main storyteller platform.

## 📊 Current Database Structure

Your database already has these multi-tenancy fields:
- `tenant_id` - Organization/tenant identifier
- `project_id` - Project identifier
- `organization_id` - Organization reference
- `cross_tenant_visibility` - Cross-organization sharing

## ✅ Recommended Approach: Use Existing `project_id` Field

### Why This Works Best:
1. **Already exists** - No schema changes needed
2. **Standard pattern** - Projects are common grouping mechanism
3. **Future-proof** - Can have multiple projects (JusticeHub, other initiatives)
4. **Simple filtering** - Single field to check
5. **Cross-platform** - Easy to set in your other frontend or Supabase directly

## 🏗️ Implementation Strategy

### Option 1: Use Existing `project_id` (Recommended)

**Step 1: Create JusticeHub Project in Supabase**

Run this SQL in your Supabase Dashboard → SQL Editor:

```sql
-- Create projects table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Public can read public projects
CREATE POLICY "Public projects are viewable"
  ON public.projects FOR SELECT
  USING (is_public = true);

-- Insert JusticeHub project
INSERT INTO public.projects (name, slug, description, is_public)
VALUES (
  'JusticeHub',
  'justicehub',
  'Stories featured on the JusticeHub platform',
  true
)
ON CONFLICT (slug) DO NOTHING
RETURNING id;

-- Save this ID! You'll use it for filtering
```

**Step 2: Tag Stories for JusticeHub**

Two ways to tag content:

**Method A: Via Your Other Frontend (Admin Interface)**
```typescript
// In your other platform's admin interface
async function tagForJusticeHub(storyId: string, justiceHubProjectId: string) {
  await supabase
    .from('stories')
    .update({ 
      project_id: justiceHubProjectId,
      cross_tenant_visibility: 'public' // Optional: allow cross-platform
    })
    .eq('id', storyId)
}
```

**Method B: Directly in Supabase Dashboard**
```sql
-- Tag specific story
UPDATE stories 
SET project_id = 'YOUR_JUSTICEHUB_PROJECT_ID_HERE'
WHERE id = 'story-id-to-tag';

-- Tag multiple stories at once
UPDATE stories
SET project_id = 'YOUR_JUSTICEHUB_PROJECT_ID_HERE'
WHERE title ILIKE '%justice%' -- or any criteria
  AND has_explicit_consent = true
  AND is_public = true;
```

**Step 3: Query JusticeHub Stories**

```typescript
// src/lib/supabase/queries/stories.ts
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
    .eq('project_id', JUSTICEHUB_PROJECT_ID)  // Only JusticeHub stories
    .eq('has_explicit_consent', true)
    .eq('is_public', true)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  
  return { data, error }
}
```

**Step 4: Add to Environment**

```env
# .env.local
NEXT_PUBLIC_JUSTICEHUB_PROJECT_ID=your-project-uuid-from-step-1
```

### Option 2: Use Tags Array (More Flexible)

If you want more flexibility (stories can be in multiple projects):

**Step 1: Check if stories table has tags field**
```sql
-- Check existing tags column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stories' AND column_name = 'tags';
```

You already have a `tags` array field! Just add 'justicehub' to it:

**Step 2: Tag Stories**
```sql
-- Add 'justicehub' tag to existing tags
UPDATE stories
SET tags = array_append(tags, 'justicehub')
WHERE id = 'story-id'
  AND NOT ('justicehub' = ANY(tags)); -- Don't duplicate

-- Or set tags array
UPDATE stories
SET tags = ARRAY['justicehub', 'featured']
WHERE id = 'story-id';
```

**Step 3: Query Tagged Stories**
```typescript
export async function getJusticeHubStories() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('stories')
    .select('*, author:profiles!author_id(*)')
    .contains('tags', ['justicehub'])  // Has 'justicehub' tag
    .eq('has_explicit_consent', true)
    .eq('is_public', true)
    .order('published_at', { ascending: false })
  
  return { data, error }
}
```

## 🎨 UI for Content Managers

### Admin Interface in Your Other Platform

Add a "Publish to JusticeHub" checkbox:

```tsx
// In your story edit form
<label>
  <input 
    type="checkbox"
    checked={publishToJusticeHub}
    onChange={(e) => {
      if (e.target.checked) {
        // Add JusticeHub project
        updateStory({ project_id: JUSTICEHUB_PROJECT_ID })
      } else {
        // Remove JusticeHub project
        updateStory({ project_id: null })
      }
    }}
  />
  Publish to JusticeHub
</label>
```

### Bulk Tagging Interface

```tsx
// Admin: Bulk tag for JusticeHub
function BulkTagForJusticeHub() {
  const [selectedStories, setSelectedStories] = useState<string[]>([])
  
  async function publishToJusticeHub() {
    await supabase
      .from('stories')
      .update({ project_id: JUSTICEHUB_PROJECT_ID })
      .in('id', selectedStories)
    
    toast.success(`${selectedStories.length} stories published to JusticeHub!`)
  }
  
  return (
    <div>
      <StorySelection onSelect={setSelectedStories} />
      <button onClick={publishToJusticeHub}>
        Publish {selectedStories.length} to JusticeHub
      </button>
    </div>
  )
}
```

## 🔍 Filtering Best Practices

### Full Query with All Safeguards

```typescript
export async function getJusticeHubStories(options?: {
  limit?: number
  category?: string
  featured?: boolean
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('stories')
    .select(`
      id,
      title,
      content,
      summary,
      media_url,
      story_image_url,
      published_at,
      is_featured,
      story_category,
      themes,
      author:profiles!author_id(
        id,
        full_name,
        display_name,
        profile_image_url,
        bio,
        cultural_background
      )
    `)
    // JusticeHub filter
    .eq('project_id', JUSTICEHUB_PROJECT_ID)
    
    // Consent & privacy
    .eq('has_explicit_consent', true)
    .eq('is_public', true)
    .eq('status', 'published')
    
    // Profile consent
    .eq('author.consent_given', true)
    
    // Elder approval (if required)
    .or('requires_elder_approval.is.false,elder_approved_by.not.is.null')
  
  // Optional filters
  if (options?.category) {
    query = query.eq('story_category', options.category)
  }
  
  if (options?.featured) {
    query = query.eq('is_featured', true)
  }
  
  // Ordering
  query = query.order('published_at', { ascending: false, nullsFirst: false })
  
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  
  const { data, error } = await query
  
  return { data, error }
}
```

## 📝 Workflow for Content Managers

### Adding Story to JusticeHub

1. **Create/Edit Story** in main storyteller platform
2. **Verify Consent**:
   - Story has `has_explicit_consent = true`
   - Storyteller has `consent_given = true`
   - Check cultural sensitivity requirements
3. **Tag for JusticeHub**:
   - Check "Publish to JusticeHub" box, OR
   - Set `project_id` to JusticeHub project, OR
   - Add 'justicehub' to tags array
4. **Story appears on JusticeHub** within seconds (real-time)

### Removing Story from JusticeHub

```sql
-- Remove from JusticeHub
UPDATE stories
SET project_id = NULL
WHERE id = 'story-id';

-- Or remove tag
UPDATE stories
SET tags = array_remove(tags, 'justicehub')
WHERE id = 'story-id';
```

## 🎯 Comparison of Approaches

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **project_id** | Simple, single field, clean queries | Story in one project only | Exclusive platforms |
| **tags array** | Flexible, multiple platforms, existing field | Slightly more complex queries | Multiple platforms |
| **New junction table** | Most flexible, metadata per platform | Requires new table, complex | Advanced use cases |

## ✅ Recommended Implementation

**Use `project_id` for now** because:
1. Simple and clean
2. Easy to implement in both platforms
3. Can migrate to tags later if needed
4. Standard multi-tenancy pattern

**Steps:**
1. Create JusticeHub project in database (5 minutes)
2. Add project ID to environment variables
3. Update queries to filter by project_id
4. Add "Publish to JusticeHub" UI in other platform (optional)
5. Manually tag initial stories via SQL

## 🚀 Quick Start Commands

```sql
-- 1. Create JusticeHub project
INSERT INTO projects (name, slug, description, is_public)
VALUES ('JusticeHub', 'justicehub', 'JusticeHub platform stories', true)
RETURNING id;  -- Copy this ID!

-- 2. Tag some stories
UPDATE stories
SET project_id = 'YOUR_PROJECT_ID_HERE'
WHERE has_explicit_consent = true
  AND is_public = true
  AND is_featured = true  -- Start with featured stories
LIMIT 10;

-- 3. Verify
SELECT count(*) FROM stories WHERE project_id = 'YOUR_PROJECT_ID_HERE';
```

Then add to `.env.local`:
```env
NEXT_PUBLIC_JUSTICEHUB_PROJECT_ID=your-project-id-here
```

Ready to implement! 🎉
