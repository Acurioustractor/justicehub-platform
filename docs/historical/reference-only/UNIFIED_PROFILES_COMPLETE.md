# Unified Profiles System - Complete! 🎉

## What We Just Built

A fully connected profile system where people, art projects, programs, services, and articles are all interconnected through a central `public_profiles` table.

---

## ✅ Completed

### 1. Database Infrastructure
- ✅ Created `public_profiles` table (central registry)
- ✅ Created `art_innovation_profiles` (links people to art projects)
- ✅ Created `community_programs_profiles` (links people to programs)
- ✅ Created `services_profiles` (links people to services)
- ✅ Created `article_related_*` tables (links articles to everything)
- ✅ Extended `authors` table with `public_profile_id` reference
- ✅ Extended `profile_appearances` with `public_profile_id` reference

### 2. Profile Data
- ✅ Created Benjamin Knight profile with photo
- ✅ Created Nicholas Marchesi profile with photo
- ✅ Linked both to CONTAINED as co-founders
- ✅ Linked Benjamin to his author record

### 3. Frontend Pages
- ✅ Updated CONTAINED detail page ([/art-innovation/contained](http://localhost:3003/art-innovation/contained))
  - Now fetches linked profiles from database
  - Displays creators with clickable profile links
  - Shows role descriptions

- ✅ Created profile pages ([/people/[slug]](http://localhost:3003/people/benjamin-knight))
  - Shows full bio and tagline
  - Displays all connected art projects
  - Shows connected programs and services
  - Clickable links to related content

### 4. Documentation
- ✅ [EXISTING_SCHEMA_AUDIT.md](docs/EXISTING_SCHEMA_AUDIT.md) - Full analysis of current schema
- ✅ [CONNECTED_CONTENT_ARCHITECTURE.md](docs/CONNECTED_CONTENT_ARCHITECTURE.md) - System design
- ✅ [PROFILE_IMAGE_GUIDE.md](docs/PROFILE_IMAGE_GUIDE.md) - How to add profile photos

### 5. Scripts Created
- ✅ `migrate-to-unified-profiles.ts` - Creates profiles and links
- ✅ `add-profile-photo.ts` - Helper to add photos to profiles

---

## 🎯 What This Enables

### Before (Embedded JSON):
```typescript
// CONTAINED had creators as embedded JSON
{
  "creators": [
    { "name": "Benjamin Knight", "bio": "..." }
  ]
}
// ❌ Can't reuse across content
// ❌ Can't link to other pages
// ❌ No profile pages
```

### After (Connected System):
```sql
-- Benjamin exists once in public_profiles
public_profiles: { id: "abc", full_name: "Benjamin Knight", ... }

-- Linked to CONTAINED via relationship table
art_innovation_profiles: {
  art_innovation_id: "contained-id",
  public_profile_id: "abc",
  role: "co-founder"
}

-- ✅ Reusable across all content
-- ✅ Profile page at /people/benjamin-knight
-- ✅ Shows all his connected work
```

---

## 📸 Profile Images - How They Work

### Current Setup
Benjamin and Nicholas photos are stored in Supabase Storage:

```
https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/benjamin-knight.jpg
https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/nicholas-marchesi.jpg
```

These URLs are in `public_profiles.photo_url` and displaying perfectly!

### Adding New Profile Photos

**Method 1: Supabase Dashboard** (Easiest)
1. Upload image to Supabase Storage → `images/team/` folder
2. Get public URL
3. Run script:
```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/add-profile-photo.ts <slug> <photo-url>
```

**Method 2: Direct Update**
```bash
# Update photo URL in database
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/add-profile-photo.ts tanya-smith "https://your-image-url.jpg"
```

**Image Specs:**
- Size: 800x800px (square)
- Format: JPG or PNG
- File size: < 1MB (aim for 200-500KB)

See [PROFILE_IMAGE_GUIDE.md](docs/PROFILE_IMAGE_GUIDE.md) for complete details!

---

## 🔗 How Content Links Together

### Example: Benjamin Knight

**Profile** (`/people/benjamin-knight`)
Shows:
- Full bio and tagline
- Photo with border
- Role tags (advocate, researcher, etc.)
- Connected art projects → CONTAINED
- Connected programs (if any)
- Connected services (if any)

**CONTAINED** (`/art-innovation/contained`)
Shows:
- Benjamin as co-founder
- Clickable link to his profile
- Custom role description
- His photo

**Articles** (future)
When Benjamin writes an article:
- Article shows him as author (via `authors.public_profile_id`)
- His profile shows all his articles
- Bidirectional linking!

---

## 🚀 Scaling This System

### Adding More Profiles

```bash
# 1. Create profile
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);
await supabase.from('public_profiles').insert({
  full_name: 'Tanya Smith',
  slug: 'tanya-smith',
  bio: '...',
  tagline: 'Youth Advocate',
  role_tags: ['advocate', 'lived-experience'],
  is_featured: true
});
"

# 2. Add photo
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/add-profile-photo.ts tanya-smith "https://..."

# 3. Link to content (e.g., a program)
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);
await supabase.from('community_programs_profiles').insert({
  program_id: 'program-uuid',
  public_profile_id: 'tanya-uuid',
  role: 'participant',
  role_description: 'Youth participant and advocate',
  display_order: 1
});
"
```

### Linking Articles to Projects

```sql
-- When you write an article about CONTAINED
INSERT INTO article_related_art (article_id, art_innovation_id, relevance_note)
VALUES (
  'article-uuid',
  'contained-uuid',
  'Deep dive into CONTAINED campaign impact'
);
```

Then the article page will show:
- "Related: CONTAINED - A Curious Tractor"

And CONTAINED page will show:
- "Featured In: [Article Title]"

---

## 🎨 Current Live Pages

Visit these to see the system in action:

1. **Art & Innovation List**
   - http://localhost:3003/art-innovation
   - Shows CONTAINED with creator count

2. **CONTAINED Detail**
   - http://localhost:3003/art-innovation/contained
   - Shows linked creators with photos
   - Click creators to view profiles

3. **Benjamin's Profile**
   - http://localhost:3003/people/benjamin-knight
   - Full bio, photo, role tags
   - Shows CONTAINED project
   - Clickable back to project

4. **Nicholas's Profile**
   - http://localhost:3003/people/nicholas-marchesi
   - Same features as Benjamin's

---

## 📊 Database Stats

```
✅ 2 public profiles created
✅ 2 art project links
✅ 1 author link
✅ 11 new tables created
✅ Full bidirectional navigation
```

---

## 🔮 Next Steps (Future Enhancements)

### Short Term
1. Add more profiles (Tanya, other team members)
2. Link existing articles to profiles
3. Create "Related Reading" sections on profiles
4. Add profile search/directory page (`/people`)

### Medium Term
1. Build admin UI for profile management
2. Create bulk upload tools
3. Add profile edit functionality
4. Implement profile privacy controls

### Long Term
1. User-submitted profiles (with moderation)
2. Profile verification system
3. Activity feed (show latest from profile)
4. Profile analytics (views, engagement)

---

## 🎉 Success!

You now have a **fully connected content ecosystem** where:

✅ People exist once, link everywhere
✅ Content connects bidirectionally
✅ Scalable for unlimited growth
✅ Images managed in structured storage
✅ Profile pages auto-generate from database
✅ No more embedded JSON duplicates

**Test it:** Visit http://localhost:3003/art-innovation/contained and click on the creators! 🚀
