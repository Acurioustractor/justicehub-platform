# Vercel Blog System Testing Checklist

## Deployment Status

The blog system has been pushed to GitHub (commit a971412). Vercel should automatically deploy this.

**Production URL**: Check Vercel dashboard for the deployed URL (likely https://justicehub-platform.vercel.app or similar)

## Pre-Testing: Verify Environment Setup

Before testing the blog functionality on Vercel, ensure these are configured in the Vercel dashboard:

### 1. Environment Variables Required

Go to Vercel Dashboard → Project Settings → Environment Variables and verify:

- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- ✅ `YJSF_SUPABASE_SERVICE_KEY` - Supabase service role key (REQUIRED for image uploads)

**Critical**: The `YJSF_SUPABASE_SERVICE_KEY` must be set in Vercel environment variables for the upload API to work!

### 2. Supabase Storage Policies Applied

Ensure you've run this SQL in your Supabase SQL Editor (should be done already):

```sql
-- Allow authenticated users to upload (INSERT)
CREATE POLICY "Allow authenticated upload to story-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'story-images');

-- Allow everyone to read/download (SELECT)
CREATE POLICY "Allow public read from story-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'story-images');

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update in story-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'story-images')
WITH CHECK (bucket_id = 'story-images');

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete from story-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'story-images');
```

### 3. Database Migrations Applied

Ensure the blog tables exist by running the migration:

```bash
# Check if tables exist
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx -e "
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function checkTables() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('count')
    .limit(1);

  console.log('blog_posts table exists:', !error);
}

checkTables();
"
```

## Testing Checklist

### Phase 1: Public Pages (No Auth Required)

Visit the production URL and test:

- [ ] **Blog Landing Page** (`/blog`)
  - [ ] Page loads without errors
  - [ ] Headers are WHITE on black background (not black on black)
  - [ ] "Stories from the Movement" title is readable
  - [ ] Published blog posts display correctly
  - [ ] Featured images load
  - [ ] "Read More" buttons work

- [ ] **Individual Blog Post** (`/blog/[slug]`)
  - [ ] Clicking a post opens the correct story
  - [ ] Header is white and readable
  - [ ] Content displays properly
  - [ ] Images in content load correctly
  - [ ] Markdown formatting renders (headings, lists, links, etc.)

### Phase 2: Authentication Testing

- [ ] **Login Access** (`/admin/blog`)
  - [ ] Going to `/admin/blog` redirects to login if not authenticated
  - [ ] Login page loads without errors
  - [ ] Can log in with test credentials

- [ ] **Admin Access Control**
  - [ ] After login, regular users are blocked from admin area
  - [ ] Admin users can access `/admin/blog`
  - [ ] Middleware correctly enforces admin-only access

### Phase 3: Blog Management (Requires Admin Auth)

Once logged in as admin:

- [ ] **Blog List Page** (`/admin/blog`)
  - [ ] Page loads successfully
  - [ ] Shows list of existing blog posts
  - [ ] Displays status badges (draft/published)
  - [ ] "Create New Story" button visible
  - [ ] Edit buttons work for each post

- [ ] **Create New Blog Post** (`/admin/blog/new`)
  - [ ] Page loads without errors
  - [ ] All form fields are present:
    - [ ] Title input
    - [ ] Slug input (auto-generates from title)
    - [ ] Author name input
    - [ ] Featured image URL input
    - [ ] Content markdown textarea
    - [ ] Status dropdown (draft/published)
    - [ ] Excerpt textarea
  - [ ] Slash commands work in editor (`/h1`, `/h2`, `/video`, `/image`)
  - [ ] Preview toggle works
  - [ ] Save as draft works
  - [ ] Publish immediately works

### Phase 4: Image Upload Testing (CRITICAL)

This is the new functionality that requires proper environment setup:

- [ ] **Content Image Upload** (in blog editor)
  - [ ] "Upload Image" button is visible and not disabled
  - [ ] Clicking upload opens file picker
  - [ ] Can select an image file from computer
  - [ ] Upload shows progress indicator
  - [ ] Image markdown is inserted into content
  - [ ] Image URL uses Supabase storage URL format
  - [ ] Check browser console - NO 500 errors
  - [ ] Check browser console - NO RLS policy errors

- [ ] **Drag & Drop Upload**
  - [ ] Can drag image file from computer
  - [ ] Drop onto textarea triggers upload
  - [ ] Upload completes successfully
  - [ ] Image markdown inserted at cursor position

- [ ] **Featured Image Upload**
  - [ ] "Upload Featured Image" button works
  - [ ] Can select featured image
  - [ ] Image uploads to `blog/featured/` folder
  - [ ] Featured image URL populates in form
  - [ ] Preview shows uploaded image

### Phase 5: End-to-End Test

Create a complete blog post with image:

1. [ ] Go to `/admin/blog/new`
2. [ ] Enter title: "Testing Image Upload on Vercel"
3. [ ] Upload a featured image
4. [ ] Write some content in markdown
5. [ ] Upload an image via drag-and-drop into content
6. [ ] Preview the post - images should display
7. [ ] Save as published
8. [ ] Go to `/blog` - post should appear
9. [ ] Click post - all images should load from Supabase storage

## Troubleshooting

### If Upload Returns 500 Error

Check Vercel Function Logs:
1. Go to Vercel Dashboard → Deployments → Click latest deployment
2. Click "Functions" tab
3. Find `/api/upload-image` function
4. Check error logs for details

Common issues:
- Missing `YJSF_SUPABASE_SERVICE_KEY` environment variable
- Storage policies not applied in Supabase
- Storage bucket doesn't exist
- File size too large (Vercel function timeout)

### If Images Don't Display

1. Check browser Network tab - are image URLs returning 404?
2. Verify storage bucket is public in Supabase dashboard
3. Check CORS settings in Supabase storage

### If Authentication Fails

1. Verify Supabase URL and anon key match your project
2. Check if redirect URL is configured in Supabase Authentication settings
3. Add production URL to allowed redirect URLs in Supabase

### If Admin Access Denied

1. Check user's `is_admin` status in database:
   ```sql
   SELECT id, email, is_admin FROM auth.users;
   ```
2. Update if needed:
   ```sql
   UPDATE auth.users SET is_admin = true WHERE email = 'your-email@example.com';
   ```

## Success Criteria

All tests pass when:
- ✅ Blog pages load with correct styling (white text on black)
- ✅ Authentication and admin access control work
- ✅ Can create and edit blog posts
- ✅ Image uploads work without errors
- ✅ Uploaded images display correctly in published posts
- ✅ All features work on production URL

## Next Steps After Testing

If everything works:
1. Document any issues found
2. Test on mobile devices
3. Share production blog URL for feedback
4. Consider adding:
   - Image size validation/optimization
   - Multiple image upload
   - Image gallery picker for reusing images
   - Categories/tags for blog posts
