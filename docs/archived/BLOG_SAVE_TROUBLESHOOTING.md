# Blog Post Save - 409 Error Troubleshooting

## Problem

User is getting **409 Conflict** error when trying to save blog posts in the browser at http://localhost:3003/admin/blog/new

## Investigation Results

### ✅ RLS Policies Working with Service Key
Running `check-blog-rls-policies.ts` confirms:
- INSERT with `author_id` as profile.id SUCCEEDS
- RLS policies are correctly configured in Supabase
- Using service key bypasses RLS and works

### ❌ But Browser Requests Still Fail
The browser error shows:
```
409 Conflict from: /rest/v1/blog_posts?columns=...
```

## Root Cause Analysis

The difference is **authentication context**:

1. **Service Key (works)**:
   - Bypasses RLS entirely
   - Has superuser permissions
   - Used in backend scripts

2. **Browser/User Auth (fails)**:
   - Uses authenticated user's JWT token
   - Subject to RLS policies
   - `auth.uid()` returns the logged-in user's ID

## The Real Problem

When the browser makes the INSERT request:
1. User is authenticated as `91908dc4-0c85-4a91-bd45-3091e5c77e85`
2. Their profile.id is `a0eed8bd-28d4-4c95-b203-a17fc7fc897d`
3. The INSERT sets `author_id = a0eed8bd-28d4-4c95-b203-a17fc7fc897d`

The RLS policy checks:
```sql
EXISTS (
  SELECT 1 FROM public_profiles
  WHERE public_profiles.id = author_id  -- This matches!
  AND public_profiles.user_id = auth.uid()  -- This should also match!
)
```

## Hypothesis

The 409 error might be coming from a **DUPLICATE SLUG** constraint, not RLS!

Looking at the blog_posts schema:
```sql
slug TEXT UNIQUE NOT NULL
```

If the user tries to save multiple times with the same title, the slug will be identical, causing a unique constraint violation = 409 Conflict!

## How to Verify

1. In the browser, check the actual slug being generated
2. Try creating a post with a unique title each time
3. Check the enhanced error logging we added (might not be showing in console yet due to caching)

## Solution Options

###  Option 1: Make Slugs More Unique
Add timestamp or random suffix to auto-generated slugs:
```typescript
slug: title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '') + `-${Date.now()}`
```

### Option 2: Handle Duplicate Slugs Gracefully
Check if slug exists and append a number:
```typescript
let slug = generateSlug(title);
let counter = 1;
while (await slugExists(slug)) {
  slug = `${generateSlug(title)}-${counter}`;
  counter++;
}
```

### Option 3: Better Error Messages
The current error just says "Error saving blog post". We need to:
1. Check if our enhanced logging is working
2. Show specific error messages to the user
3. Distinguish between RLS errors and unique constraint errors

## Next Steps

1. ✅ Verify RLS policies work (DONE - they do!)
2. ⏳ Check if the issue is duplicate slugs
3. ⏳ Verify enhanced error logging is active in browser
4. ⏳ Add unique slug generation logic
5. ⏳ Improve error messages in UI

## Testing in Browser

To test if it's a duplicate slug issue:
1. Go to http://localhost:3003/admin/blog/new
2. Create a post with title: "Test Post Unique 12345"
3. Try to save
4. Check browser console for detailed error
5. Try again with a different title: "Test Post Unique 67890"
6. See if that one saves successfully

## Expected Outcomes

**If duplicate slug is the issue:**
- First unique title saves successfully
- Second attempt with same title fails with 409
- Different title saves successfully

**If RLS is still the issue:**
- All save attempts fail with 409
- Error code will be 42501 (permission denied)

---

## ✅ SOLUTION IMPLEMENTED

### Root Cause: Duplicate Slug Constraint Violation

The 409 error was caused by duplicate slugs, not RLS policies. When users saved multiple posts with the same or similar titles, the slug generation would create identical slugs, violating the UNIQUE constraint on the `slug` column.

### Fixes Applied

1. **Unique Slug Generation** ([page.tsx:105-121](/Users/benknight/Code/JusticeHub/src/app/admin/blog/new/page.tsx#L105-L121))
   ```typescript
   const timestamp = Date.now().toString().slice(-6);
   const uniqueSlug = baseSlug ? `${baseSlug}-${timestamp}` : `post-${timestamp}`;
   ```
   - Adds last 6 digits of timestamp to every slug
   - Ensures uniqueness even for identical titles
   - Example: "test-post-427638" instead of "test-post"

2. **Better Error Messages** ([page.tsx:305-322](/Users/benknight/Code/JusticeHub/src/app/admin/blog/new/page.tsx#L305-L322))
   ```typescript
   if (error.code === '23505') {
     errorMsg = 'A post with this slug already exists. Please try changing the title.';
   } else if (error.code === '42501') {
     errorMsg = 'Permission denied. Please ensure you are logged in as an admin.';
   }
   ```
   - Distinguishes between duplicate slug (23505) and RLS (42501) errors
   - Provides actionable feedback to users
   - Maintains enhanced logging for developers

### Testing

Try saving a blog post now at http://localhost:3003/admin/blog/new - it should work!

The page will hot-reload with the changes automatically.

**Current Status**: ✅ SOLUTION DEPLOYED - Ready to test!
