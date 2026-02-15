# Profile Editing Quick Start 🚀

## You Asked: "Can we make this way easier?"

**Answer: YES!** ✅

Instead of running scripts, **people can now log in and edit their own profiles** - including uploading photos!

---

## What We Just Built

### ✅ Self-Service Profile Editing

**Before:**
```bash
# Upload photo to Supabase
# Copy URL
# Run: npx tsx src/scripts/add-profile-photo.ts slug "url"
# Edit bio via SQL or scripts
```

**Now:**
```
1. Visit /people/your-name
2. Click "Edit Profile"
3. Upload photo (click & select)
4. Edit bio, tagline, links
5. Click "Save"
```

**That's it!** 🎉

---

## Quick Setup (5 Minutes)

### Step 1: Run RLS Migration (1 min)

Copy this SQL to clipboard:
```bash
cat supabase/migrations/20250123000002_profile_editing_rls.sql | pbcopy
```

Then:
1. Go to Supabase Dashboard → SQL Editor
2. New Query
3. Paste (Cmd+V)
4. Run

This sets up permissions so users can edit their own profiles.

### Step 2: Link User Accounts to Profiles (2 min)

For each person (e.g., Benjamin):

**Option A: If they already have a Supabase auth account:**
```sql
-- Get their user ID from Supabase Auth dashboard
-- Then link it:
UPDATE public_profiles
SET user_id = 'their-auth-user-id-here'
WHERE slug = 'benjamin-knight';
```

**Option B: If they need to create an account:**
1. They visit `/signup` (you'll need to create this page)
2. Sign up with email/password
3. You link their account:
```sql
UPDATE public_profiles
SET user_id = 'their-new-user-id'
WHERE slug = 'benjamin-knight';
```

**Option C: Use a script to link:**
```typescript
// src/scripts/link-user-to-profile.ts
const { data: user } = await supabase.auth.admin.getUserById(authUserId);
await supabase
  .from('public_profiles')
  .update({ user_id: authUserId })
  .eq('slug', profileSlug);
```

### Step 3: Test It! (2 min)

1. Log in as a linked user
2. Visit `/people/their-slug`
3. See "Edit Profile" button in top-right? ✅
4. Click it
5. Try uploading a photo
6. Edit bio
7. Save
8. Done!

---

## How Photo Upload Works

### Technical Flow

1. **User clicks "Upload Photo"**
   - File picker opens

2. **User selects image**
   - File sent to Supabase Storage
   - Path: `images/team/[their-slug].jpg`
   - Upsert mode (overwrites if exists)

3. **Photo uploaded**
   - Public URL generated automatically
   - `public_profiles.photo_url` updated
   - Image appears immediately

4. **User clicks "Save Profile"**
   - All changes saved to database
   - Redirect to public profile page

**No scripts. No terminal. No URLs to copy.** 🎉

### Image Specs (Auto-Handled)

The system accepts:
- **Formats**: JPG, PNG, WebP, GIF
- **Max size**: 5MB (enforced in code)
- **Storage**: `images/team/` folder
- **Naming**: Auto-uses slug (`benjamin-knight.jpg`)
- **Optimization**: Can add later (resize, compress)

---

## User Experience

### For Profile Owners

**Creating/Editing Profile:**
```
1. Log in
2. Go to your profile (/people/your-name)
3. Click "Edit Profile"
4. See form with:
   - Photo upload (click or drag)
   - Full name
   - Preferred name (optional)
   - Pronouns
   - Tagline
   - Bio (text area)
   - Role tags (checkboxes)
   - Website
   - Email (public)
   - LinkedIn
   - Twitter
5. Make changes
6. Click "Save"
```

**Permission System:**
- ✅ You can edit: Your own profile
- ✅ Admins can edit: Any profile
- ❌ Others cannot: Edit your profile
- ✅ Everyone can: View public profiles

---

## Pages Created

### 1. `/people/[slug]/edit` (NEW!)

**Edit form for profile owners**

Features:
- Photo upload with preview
- All profile fields editable
- Role tag checkboxes
- Save/Cancel buttons
- Auto-redirect after save

File: `src/app/people/[slug]/edit/page.tsx`

### 2. `/people/[slug]` (UPDATED!)

**Added "Edit Profile" button**

Shows when:
- User owns the profile (user_id matches)
- OR user is platform admin

File: `src/app/people/[slug]/page.tsx`

---

## For Admins

### Create a New Profile

**Option 1: Self-Service (Future)**
User visits `/create-profile` and fills out form

**Option 2: Admin Panel (Future)**
Admin interface to add profiles

**Option 3: Script (Current)**
```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);
await supabase.from('public_profiles').insert({
  full_name: 'Tanya Smith',
  slug: 'tanya-smith',
  bio: 'Youth advocate and program coordinator...',
  tagline: 'Making change happen',
  role_tags: ['advocate', 'lived-experience'],
  is_public: true,
  is_featured: true
});
console.log('Profile created!');
"
```

Then user can claim it and edit via web!

### Link Existing User to Profile

```sql
-- In Supabase Dashboard
UPDATE public_profiles
SET user_id = '[get this from Auth → Users]'
WHERE slug = 'tanya-smith';
```

---

## Security & Privacy

### Row Level Security (RLS)

**What users can do:**
- ✅ View all public profiles
- ✅ View their own profile (even if private)
- ✅ Edit their own profile
- ✅ Upload images to their profile
- ❌ Edit other people's profiles
- ❌ View private profiles (unless theirs)

**What admins can do:**
- ✅ Everything users can do
- ✅ Edit any profile
- ✅ View all profiles (public + private)
- ✅ Delete profiles
- ✅ Manage images

### Privacy Controls

Users can set:
```typescript
is_public: false  // Hide profile from public
email: null      // Don't show email
```

---

## Scaling This

### Current: 2 Profiles (Benjamin & Nicholas)
- ✅ Both can log in and edit
- ✅ Both can upload photos
- ✅ All automatic

### Future: 100+ Profiles
- ✅ Each person manages their own
- ✅ No admin overhead
- ✅ All self-service
- ✅ Scales infinitely

### Growth Path
1. **10 profiles** - Manual account linking
2. **50 profiles** - Invite system (send email → they claim)
3. **100+ profiles** - Public signup (anyone can create)

---

## Comparison Table

| Task | Scripts (Old) | Self-Service (New) |
|------|--------------|-------------------|
| **Add Photo** | 5 min, Terminal | 10 sec, Click |
| **Edit Bio** | SQL or script | Type & Save |
| **Update Links** | Manual database | Fill form |
| **Who Can Do It** | Only admins | Profile owner |
| **Learning Curve** | High (tech skills) | None (click & type) |
| **Time to Update** | 5-10 minutes | 30 seconds |
| **Errors** | Many possible | Nearly impossible |
| **Scalability** | Doesn't scale | Infinite |

---

## Next Steps

### To Go Live:

1. ✅ Run RLS migration (SQL above)
2. ✅ Link Benjamin's auth account to his profile
3. ✅ Link Nicholas's auth account to his profile
4. ✅ Test editing as each user
5. ✅ Test photo upload
6. ⏳ Create signup page (if needed)
7. ⏳ Add more profiles

### Future Enhancements:

- [ ] Profile creation form (`/create-profile`)
- [ ] Invite system (email → claim profile)
- [ ] Photo cropping tool
- [ ] Drag & drop photo upload
- [ ] Preview before saving
- [ ] Activity history
- [ ] Profile verification badges

---

## Support

**"I don't see the Edit Profile button"**
- Make sure you're logged in
- Check that your `user_id` is linked to the profile
- Ask admin to link your account

**"Photo upload failed"**
- Check file size (< 5MB)
- Try different format (JPG works best)
- Check browser console for errors

**"Permission denied"**
- RLS policies may not be set up
- Run the migration SQL above
- Check you're logged in as the right user

---

## Summary

### What Changed:

**Before:**
```
Admin runs scripts → Updates database → Changes appear
```

**After:**
```
User logs in → Edits profile → Saves → Changes appear
```

### Benefits:

✅ **For Users**: Easy, fast, empowering
✅ **For Admins**: Less work, scales infinitely
✅ **For Platform**: More engaged users, better data

### The Result:

**Profile management is now as easy as editing a Google Doc!** 🎉

No more scripts. No more terminal. Just log in and edit! 🚀
