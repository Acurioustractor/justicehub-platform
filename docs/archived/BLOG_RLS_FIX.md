# Blog Posts RLS Policy Fix

## Problem Identified

The blog post save was failing with a **409 Conflict** error because the Row Level Security (RLS) policies were incorrectly configured.

### Root Cause

The `blog_posts` table has `author_id UUID REFERENCES public_profiles(id)`, which means `author_id` stores the **profile ID** from the `public_profiles` table.

However, the original RLS policy was checking:
```sql
WITH CHECK (auth.uid() = author_id)
```

This compared the **auth user ID** (`auth.uid()`) with the **profile ID** (`author_id`), which are different UUIDs. This caused the RLS check to fail, resulting in a 409 Conflict error.

### The Correct Relationship

```
auth.users (id)
    ↓ (one-to-one)
public_profiles (user_id, id)
    ↓ (references public_profiles.id)
blog_posts (author_id)
```

The RLS policy needs to:
1. Find the public_profile matching auth.uid()
2. Check if that profile's ID matches the blog_post's author_id

## Solution

Created migration `/supabase/migrations/20250126000002_fix_blog_posts_rls.sql` that:

1. **Drops the incorrect policies**
2. **Recreates them with proper logic** that joins through public_profiles:

```sql
-- Example: Users can create blog posts
CREATE POLICY "Authenticated users can create blog posts"
  ON blog_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public_profiles
      WHERE public_profiles.id = author_id
      AND public_profiles.user_id = auth.uid()
    )
  );
```

This checks:
- `public_profiles.id = author_id` - The profile being set as author
- `public_profiles.user_id = auth.uid()` - That profile belongs to the authenticated user

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your JusticeHub project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the ENTIRE contents of `/supabase/migrations/20250126000002_fix_blog_posts_rls.sql`
6. Paste into the SQL editor
7. Click **RUN**

### Option 2: Using Supabase CLI

```bash
npx supabase db push
```

### Option 3: Direct SQL (if you have psql access)

```bash
psql postgresql://your-connection-string < supabase/migrations/20250126000002_fix_blog_posts_rls.sql
```

## Verification

After applying the migration, test the blog editor:

1. Go to http://localhost:3003/admin/blog/new
2. Fill in a title (e.g., "Test Post")
3. Add some content
4. Click **Save Draft**
5. Should succeed without 409 error

### Check in Supabase Dashboard

Run this query to verify the policies exist:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'blog_posts'
ORDER BY policyname;
```

You should see:
- ✅ "Authenticated users can create blog posts"
- ✅ "Users can view their own blog posts"
- ✅ "Users can update their own blog posts"
- ✅ "Published blog posts are viewable by everyone"

## Enhanced Error Logging

Also updated `/src/app/admin/blog/new/page.tsx` to provide detailed error information:

```typescript
if (error) {
  console.error('Supabase error details:', {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
  console.error('Post data being inserted:', postData);
  throw error;
}
```

This will help debug any future issues by showing:
- The specific error message
- Database hints
- Error codes
- The exact data being inserted

## Files Modified

1. ✅ `/supabase/migrations/20250126000002_fix_blog_posts_rls.sql` - Created (RLS fix)
2. ✅ `/src/app/admin/blog/new/page.tsx` - Updated (enhanced error logging)
3. ✅ `/supabase/migrations/20250126000001_add_reading_time_to_blog_posts.sql` - Created (column already exists, safe to run)

## Why This Happened

The original migration (`20250124000003_create_blog_system.sql`) had a mismatch:

- **Table schema**: `author_id UUID REFERENCES public_profiles(id)` ✅ Correct
- **RLS policy**: `WITH CHECK (auth.uid() = author_id)` ❌ Wrong - compared wrong UUIDs

This is a common issue when:
1. Using a separate profiles table from auth users
2. Forgetting to adjust RLS policies to account for the relationship
3. RLS policies using direct `auth.uid()` checks without joining through the profiles table

## Next Time

When creating tables with foreign keys to `public_profiles(id)`:

**Always remember** that RLS policies need to:
```sql
-- ❌ WRONG: Direct comparison
WHERE public_profiles.id = auth.uid()

-- ✅ CORRECT: Join through public_profiles
WHERE EXISTS (
  SELECT 1 FROM public_profiles
  WHERE public_profiles.id = [column_name]
  AND public_profiles.user_id = auth.uid()
)
```

---

**Status**: Ready to apply! After running this migration, blog posts should save successfully.
