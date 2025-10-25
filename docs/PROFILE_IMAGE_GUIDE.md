# Profile Image Management Guide

## Quick Start: Adding Profile Images

### Current Setup (What's Working Now)

Benjamin and Nicholas already have photos stored in Supabase Storage:
```
https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/benjamin-knight.jpg
https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/nicholas-marchesi.jpg
```

These URLs are already in the `public_profiles.photo_url` column and displaying correctly!

---

## Method 1: Supabase Dashboard Upload (Easiest)

### Step 1: Upload via Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project
2. Click **Storage** in left sidebar
3. Select the **`images`** bucket (or create it if it doesn't exist)
4. Navigate to `team/` folder (or create it)
5. Click **Upload** button
6. Select image file (recommended: 800x800px, < 1MB, JPG/PNG)
7. Image uploads to: `images/team/profile-slug.jpg`

### Step 2: Get the Public URL

After upload, click the image → **Get public URL** → Copy

URL format:
```
https://[project-ref].supabase.co/storage/v1/object/public/images/team/[filename].jpg
```

### Step 3: Add to Profile

Run this script with the profile slug and image URL:

```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/add-profile-photo.ts <slug> <photo-url>
```

**Example:**
```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/add-profile-photo.ts tanya-smith "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/tanya-smith.jpg"
```

---

## Method 2: Programmatic Upload (For Automation)

### Create Upload Script

We'll create `src/scripts/upload-profile-photo.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { basename } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function uploadProfilePhoto(slug: string, filePath: string) {
  // Read file
  const file = readFileSync(filePath);
  const fileName = `${slug}.jpg`; // or extract extension from filePath

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('images')
    .upload(`team/${fileName}`, file, {
      contentType: 'image/jpeg',
      upsert: true // Overwrite if exists
    });

  if (error) {
    console.error('Upload error:', error);
    return;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('images')
    .getPublicUrl(`team/${fileName}`);

  const photoUrl = urlData.publicUrl;

  // Update profile
  const { error: updateError } = await supabase
    .from('public_profiles')
    .update({ photo_url: photoUrl })
    .eq('slug', slug);

  if (updateError) {
    console.error('Profile update error:', updateError);
    return;
  }

  console.log(`✅ Photo uploaded and profile updated!`);
  console.log(`   URL: ${photoUrl}`);
}

// Usage: npm run tsx src/scripts/upload-profile-photo.ts <slug> <file-path>
const slug = process.argv[2];
const filePath = process.argv[3];

if (!slug || !filePath) {
  console.log('Usage: upload-profile-photo <slug> <file-path>');
  process.exit(1);
}

uploadProfilePhoto(slug, filePath);
```

### Usage:
```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/upload-profile-photo.ts tanya-smith ./photos/tanya.jpg
```

---

## Method 3: Bulk Upload

For adding multiple profiles at once, create a CSV:

**`profiles-to-upload.csv`:**
```csv
slug,photo_path,full_name,bio,tagline
tanya-smith,./photos/tanya.jpg,"Tanya Smith","Bio here...","Founder"
john-doe,./photos/john.jpg,"John Doe","Another bio...","Director"
```

Then run bulk upload script (we can create this if needed).

---

## Image Specifications

### Recommended Specs
- **Dimensions**: 800x800px (square)
- **Format**: JPG (best compression) or PNG (if transparency needed)
- **File Size**: < 1MB (aim for 200-500KB)
- **Aspect Ratio**: 1:1 (square) works best for profile photos

### Image Optimization

Use tools like:
- **ImageOptim** (Mac) - https://imageoptim.com
- **TinyPNG** - https://tinypng.com
- **Squoosh** - https://squoosh.app

Or command line:
```bash
# Install imagemagick
brew install imagemagick

# Resize and optimize
magick input.jpg -resize 800x800^ -gravity center -extent 800x800 -quality 85 output.jpg
```

---

## Storage Structure

### Current Organization:
```
storage/images/
└── team/
    ├── benjamin-knight.jpg  ✅ Exists
    ├── nicholas-marchesi.jpg  ✅ Exists
    └── [future-profile-slugs].jpg
```

### Planned Expansion:
```
storage/
├── images/
│   ├── team/              # Profile photos
│   ├── art-innovation/    # Art project images
│   │   ├── contained/
│   │   │   ├── featured.jpg
│   │   │   └── gallery/
│   │   └── [project-slug]/
│   ├── programs/          # Program images
│   └── articles/          # Article images
└── videos/                # Video files (if needed)
```

---

## Supabase Storage Setup

### Creating Storage Buckets

If `images` bucket doesn't exist:

1. **Dashboard Method:**
   - Supabase Dashboard → Storage → New Bucket
   - Name: `images`
   - Public: ✅ Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg, image/png, image/webp`

2. **SQL Method:**
```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Set policies for public read
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Allow authenticated uploads
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');
```

---

## Adding Photos to Existing Profiles

### Quick Command:

```bash
# Update a profile's photo URL
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);
await supabase
  .from('public_profiles')
  .update({ photo_url: 'YOUR_URL_HERE' })
  .eq('slug', 'PROFILE_SLUG_HERE');
console.log('Updated!');
"
```

### Or create a simple script:

**`src/scripts/add-profile-photo.ts`:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function addProfilePhoto(slug: string, photoUrl: string) {
  const { data, error } = await supabase
    .from('public_profiles')
    .update({ photo_url: photoUrl })
    .eq('slug', slug)
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`✅ Updated ${slug} with photo`);
    console.log(`   URL: ${photoUrl}`);
  }
}

// Usage: add-profile-photo <slug> <url>
const [slug, photoUrl] = process.argv.slice(2);
if (!slug || !photoUrl) {
  console.log('Usage: add-profile-photo <slug> <photo-url>');
  process.exit(1);
}

addProfilePhoto(slug, photoUrl);
```

---

## Profile Photo Checklist

When adding a new profile with photo:

- [ ] Prepare image (800x800px, <1MB)
- [ ] Optimize image (TinyPNG, ImageOptim, etc.)
- [ ] Upload to Supabase Storage (`images/team/[slug].jpg`)
- [ ] Get public URL
- [ ] Update `public_profiles.photo_url` with URL
- [ ] Optional: Add `photo_credit` if attribution needed
- [ ] Test by visiting `/people/[slug]` page

---

## Troubleshooting

### Image Not Displaying

**Check:**
1. URL is publicly accessible (open in browser)
2. CORS is enabled on Supabase bucket
3. Image bucket is set to `public`
4. No typos in URL or slug

**Fix:**
```bash
# Verify profile has photo_url
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);
const { data } = await supabase
  .from('public_profiles')
  .select('slug, photo_url')
  .eq('slug', 'PROFILE_SLUG_HERE')
  .single();
console.log(data);
"
```

### Bucket Permissions

If uploads fail:

1. Dashboard → Storage → `images` bucket → Policies
2. Ensure you have:
   - **Public read** policy (SELECT for `anon`)
   - **Authenticated write** policy (INSERT for `authenticated`)

---

## Future Enhancement: Admin Upload UI

We can build a simple admin interface:

```typescript
// src/app/admin/profiles/[slug]/upload-photo/page.tsx

'use client';

export default function UploadPhotoPage() {
  const [file, setFile] = useState<File | null>(null);

  async function handleUpload() {
    // 1. Upload to Supabase Storage
    // 2. Get public URL
    // 3. Update profile
    // 4. Redirect to profile page
  }

  return (
    <form onSubmit={handleUpload}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button>Upload</button>
    </form>
  );
}
```

---

## Summary

**Easiest Method:**
1. Upload image via Supabase Dashboard
2. Get public URL
3. Run: `npm run tsx src/scripts/add-profile-photo.ts <slug> <url>`

**Current Working Examples:**
- Benjamin Knight: ✅ `/people/benjamin-knight`
- Nicholas Marchesi: ✅ `/people/nicholas-marchesi`

**For scaling:** Create bulk upload scripts or admin UI as needed!
