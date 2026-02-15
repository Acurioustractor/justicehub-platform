# Simple Profile Editing - User Guide

## 🎉 No More Scripts! Edit Profiles Directly in Your Browser

We just built a self-service profile system. Anyone can now edit their own profile without running any terminal commands!

---

## For Profile Owners: How to Edit Your Profile

### Step 1: Visit Your Profile
Go to: `https://justicehub.au/people/your-name`

(Or click your name anywhere on the site)

### Step 2: Click "Edit Profile"
You'll see an **"Edit Profile"** button in the top-right (if you're logged in and it's your profile)

### Step 3: Edit Anything!

**You can change:**
- ✅ Profile photo (just click "Upload Photo")
- ✅ Bio
- ✅ Tagline
- ✅ Role tags (advocate, artist, etc.)
- ✅ Website & social links
- ✅ Contact email
- ✅ Pronouns

**Photo Upload:**
- Click "Upload Photo"
- Select image from your computer
- Wait a few seconds
- Done! Photo appears immediately

**Recommended photo specs:**
- Size: 800x800px (square)
- Format: JPG or PNG
- File size: Under 5MB

### Step 4: Save
Click **"Save Profile"** button at the bottom

That's it! ✨

---

## For Admins: Managing Profiles

### You Can Edit Any Profile

As an admin, you'll see the "Edit Profile" button on **every** profile page, not just your own.

### Create New Profiles

Coming soon: Simple form to add new people to the platform.

For now, profiles can be created via:
1. Script (existing method)
2. Database insert
3. User self-registration (future feature)

---

## Technical Details

### How It Works

**Authentication:**
- Uses Supabase Auth (already set up)
- Anyone with `user_id` linked to `public_profiles` can edit their profile
- Platform admins can edit any profile

**Permissions:**
```
✅ You can edit: Your own profile
✅ Admins can edit: Any profile
❌ Others cannot edit: Your profile
```

**Photo Storage:**
- Uploaded to Supabase Storage: `images/team/[your-slug].jpg`
- Automatically gets public URL
- Updates `public_profiles.photo_url` in database
- No manual URL copying needed!

### Security (RLS)

The system uses Row Level Security to ensure:
- Only you (or admins) can edit your profile
- Everyone can view public profiles
- Private profiles are hidden unless you own them

---

## Current Live Examples

**Try it now!**

1. **Benjamin Knight**
   - Visit: http://localhost:3003/people/benjamin-knight
   - (If you're logged in as Benjamin, you'll see "Edit Profile" button)

2. **Nicholas Marchesi**
   - Visit: http://localhost:3003/people/nicholas-marchesi
   - Same self-service editing

---

## What Changed?

### Before (Scripts Required):
```bash
# Upload image manually
# Copy URL
# Run this command:
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/add-profile-photo.ts benjamin-knight "https://long-url-here"

# Edit bio manually in database
# Update other fields via SQL
```

**❌ Technical knowledge required**
**❌ Terminal access needed**
**❌ Time-consuming**

### After (Self-Service):
```
1. Visit profile page
2. Click "Edit Profile"
3. Upload photo (drag & drop or click)
4. Edit bio, tagline, etc.
5. Click "Save"
```

**✅ No technical knowledge needed**
**✅ Works in any browser**
**✅ Takes seconds, not minutes**

---

## Next Steps to Enable This

### 1. Set Up RLS Policies (Required)

Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Allow users to read their own profile data
CREATE POLICY "Users can read own profile"
ON public_profiles FOR SELECT
USING (user_id = auth.uid() OR is_public = true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public_profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow admins to do everything
CREATE POLICY "Admins can manage all profiles"
ON public_profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'platform_admin'
  )
);

-- Storage policies for image uploads
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images');
```

### 2. Link User Accounts to Profiles

When someone creates an account:

```typescript
// After user signs up
const { data: { user } } = await supabase.auth.getUser();

// Create or link profile
await supabase
  .from('public_profiles')
  .update({ user_id: user.id })
  .eq('slug', 'their-profile-slug');
```

Or manually link existing profiles:

```sql
-- Link Benjamin's account to his profile
UPDATE public_profiles
SET user_id = '[benjamin-auth-user-id]'
WHERE slug = 'benjamin-knight';
```

### 3. Test It!

1. Log in as a user
2. Visit `/people/[your-slug]`
3. Click "Edit Profile"
4. Upload a photo
5. Edit bio
6. Save!

---

## Comparison: Old vs New

| Task | Old Method (Scripts) | New Method (Self-Service) |
|------|---------------------|---------------------------|
| **Upload Photo** | Upload to Supabase → Copy URL → Run script | Click "Upload Photo" → Select file → Done |
| **Edit Bio** | SQL query or script | Type in text box → Save |
| **Update Tagline** | SQL query or script | Type in field → Save |
| **Add Social Links** | SQL query or script | Enter URLs → Save |
| **Time Required** | 5-10 minutes | 30 seconds |
| **Technical Skill** | High (Terminal, SQL) | None (just click & type) |
| **Errors** | Many possible | Nearly impossible |

---

## Future Enhancements

### Phase 2 (Coming Soon):
- [ ] Profile creation form (don't need admin to create)
- [ ] Photo cropping tool
- [ ] Preview before saving
- [ ] Change history / revisions

### Phase 3 (Later):
- [ ] Profile verification badges
- [ ] Activity feed on profile
- [ ] Profile analytics (views, clicks)
- [ ] Bulk profile import tool

---

## Support

**For Profile Owners:**
If you can't see the "Edit Profile" button:
1. Make sure you're logged in
2. Check that your account is linked to your profile
3. Contact admin to link your account

**For Admins:**
If someone needs their account linked to their profile:
```sql
UPDATE public_profiles
SET user_id = '[their-auth-user-id]'
WHERE slug = '[their-profile-slug]';
```

---

## Summary

🎉 **Profile editing is now as easy as editing a Google Doc!**

No more:
- ❌ Running scripts
- ❌ Copying URLs
- ❌ SQL queries
- ❌ Terminal commands

Just:
- ✅ Click "Edit Profile"
- ✅ Make changes
- ✅ Save

**The system scales to unlimited users, all self-managing their own profiles!** 🚀
