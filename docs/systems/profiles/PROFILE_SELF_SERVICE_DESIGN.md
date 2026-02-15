# Profile Self-Service System Design

## User Story

**As a contributor (artist, advocate, program coordinator), I want to:**
1. Log in to JusticeHub
2. Create or claim my profile
3. Upload my photo
4. Edit my bio, tagline, links
5. See what projects/programs I'm linked to

**Without needing** scripts, command line, or technical knowledge!

---

## Simple Flow

### 1. Profile Pages (Public View)
```
/people/benjamin-knight  → Public view (anyone can see)
```

### 2. Edit My Profile (Logged in only)
```
/people/benjamin-knight/edit  → Edit mode (only if logged in as Benjamin)
```

### 3. My Profile Dashboard
```
/dashboard/my-profile  → Quick access to edit your own profile
```

---

## User Flows

### Flow A: First Time User (Create Profile)

1. **Visit JusticeHub** → Click "Create Profile"
2. **Sign up/Log in** → Email/password or social login
3. **Create Profile Form:**
   - Full name
   - Slug (auto-generated from name, editable)
   - Bio
   - Tagline
   - Role tags (checkboxes)
   - Upload photo
4. **Submit** → Profile created!
5. **Redirect** to `/people/[your-slug]`

### Flow B: Existing User (Edit Profile)

1. **Log in** to JusticeHub
2. **Go to** `/dashboard/my-profile` or `/people/[slug]/edit`
3. **Edit Form** (same as create, but pre-filled)
4. **Save** → Profile updated!

### Flow C: Claim Existing Profile

Someone creates your profile on your behalf (like we did for Benjamin):

1. **Admin sends** invitation email
2. **Click link** → Sign up flow
3. **Link account** to existing profile
4. **Now you can edit** your own profile!

---

## Technical Implementation

### 1. Database Changes

Link `public_profiles` to `users`:

```sql
-- Already exists in public_profiles:
user_id UUID REFERENCES users(id)

-- When user creates profile:
UPDATE public_profiles
SET user_id = 'authenticated-user-id'
WHERE slug = 'their-profile-slug';
```

### 2. Authentication

Using existing Supabase Auth:
- Email/password signup
- Google/GitHub social login (optional)
- Magic link (passwordless)

### 3. Authorization Rules

**Who can edit a profile?**
- The user who owns it (`public_profiles.user_id = auth.uid()`)
- Platform admins (`users.role = 'platform_admin'`)

**Row Level Security (RLS):**
```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON public_profiles FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public_profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins can manage all profiles"
ON public_profiles FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'platform_admin'
  )
);
```

### 4. Photo Upload (Simple!)

**Frontend:**
```tsx
<input
  type="file"
  accept="image/*"
  onChange={async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(`team/${userSlug}.jpg`, file, { upsert: true });

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(`team/${userSlug}.jpg`);

    // Update profile
    await supabase
      .from('public_profiles')
      .update({ photo_url: urlData.publicUrl })
      .eq('user_id', user.id);
  }}
/>
```

**That's it!** No scripts needed.

---

## Page Structure

### `/dashboard/my-profile` (Dashboard View)

```tsx
export default function MyProfileDashboard() {
  const { user } = useAuth();

  // Fetch user's profile
  const { data: profile } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return <CreateProfileForm />;
  }

  return (
    <div>
      <h1>My Profile</h1>
      <ProfilePreview profile={profile} />
      <Link href={`/people/${profile.slug}/edit`}>
        Edit Profile
      </Link>

      <h2>My Connected Work</h2>
      {/* Show art projects, programs, etc. */}
    </div>
  );
}
```

### `/people/[slug]/edit` (Edit Form)

```tsx
export default function EditProfilePage({ params }) {
  const { user } = useAuth();

  const { data: profile } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('slug', params.slug)
    .single();

  // Check permission
  if (profile.user_id !== user.id && user.role !== 'platform_admin') {
    return <NotAuthorized />;
  }

  return (
    <ProfileEditForm profile={profile} />
  );
}
```

### `<ProfileEditForm>` (Component)

```tsx
function ProfileEditForm({ profile }) {
  const [formData, setFormData] = useState(profile);
  const [uploading, setUploading] = useState(false);

  async function handlePhotoUpload(file: File) {
    setUploading(true);

    // 1. Upload to Supabase Storage
    const { data: uploadData } = await supabase.storage
      .from('images')
      .upload(`team/${profile.slug}.jpg`, file, { upsert: true });

    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(`team/${profile.slug}.jpg`);

    // 3. Update form
    setFormData({ ...formData, photo_url: urlData.publicUrl });

    setUploading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    await supabase
      .from('public_profiles')
      .update(formData)
      .eq('id', profile.id);

    // Redirect to public profile
    router.push(`/people/${profile.slug}`);
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Photo Upload */}
      <div>
        <label>Profile Photo</label>
        {formData.photo_url && (
          <img src={formData.photo_url} className="w-32 h-32 rounded-full" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handlePhotoUpload(e.target.files[0])}
          disabled={uploading}
        />
      </div>

      {/* Bio */}
      <div>
        <label>Bio</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={5}
        />
      </div>

      {/* Tagline */}
      <div>
        <label>Tagline</label>
        <input
          value={formData.tagline}
          onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
        />
      </div>

      {/* Role Tags */}
      <div>
        <label>Role Tags</label>
        {['advocate', 'artist', 'researcher', 'lived-experience'].map(tag => (
          <label key={tag}>
            <input
              type="checkbox"
              checked={formData.role_tags.includes(tag)}
              onChange={(e) => {
                const tags = e.target.checked
                  ? [...formData.role_tags, tag]
                  : formData.role_tags.filter(t => t !== tag);
                setFormData({ ...formData, role_tags: tags });
              }}
            />
            {tag}
          </label>
        ))}
      </div>

      {/* Website */}
      <div>
        <label>Website</label>
        <input
          type="url"
          value={formData.website_url}
          onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
        />
      </div>

      <button type="submit">Save Profile</button>
    </form>
  );
}
```

---

## Admin Features

### Invite User to Claim Profile

```tsx
// /admin/profiles/[slug]/invite

export default function InviteUserPage({ params }) {
  async function sendInvite(email: string) {
    // 1. Send magic link to email
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/claim-profile/${params.slug}`
      }
    });

    // 2. User clicks link → Redirected to claim page
    // 3. Auto-link profile.user_id to their auth.uid()
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      sendInvite(e.target.email.value);
    }}>
      <input name="email" type="email" placeholder="person@example.com" />
      <button>Send Invite</button>
    </form>
  );
}
```

### Claim Profile Page

```tsx
// /claim-profile/[slug]

export default function ClaimProfilePage({ params }) {
  const { user } = useAuth();

  async function claimProfile() {
    // Link this profile to logged-in user
    await supabase
      .from('public_profiles')
      .update({ user_id: user.id })
      .eq('slug', params.slug)
      .is('user_id', null); // Only if unclaimed

    router.push(`/people/${params.slug}/edit`);
  }

  return (
    <div>
      <h1>Claim Your Profile</h1>
      <p>You're about to claim the profile for [Name]</p>
      <button onClick={claimProfile}>Yes, this is me</button>
    </div>
  );
}
```

---

## Permissions Matrix

| Action | Public | Logged In User | Profile Owner | Admin |
|--------|--------|----------------|---------------|-------|
| View profile | ✅ | ✅ | ✅ | ✅ |
| Create profile | ❌ | ✅ | ✅ | ✅ |
| Edit own profile | ❌ | ❌ | ✅ | ✅ |
| Edit any profile | ❌ | ❌ | ❌ | ✅ |
| Upload photo | ❌ | ❌ | ✅ | ✅ |
| Delete profile | ❌ | ❌ | ❌ | ✅ |
| Invite users | ❌ | ❌ | ❌ | ✅ |

---

## Benefits of Self-Service

### For Users
✅ No technical knowledge needed
✅ Upload photos with drag-and-drop
✅ See changes instantly
✅ Edit anytime
✅ Control your own information

### For Admins
✅ No manual script running
✅ Users maintain their own data
✅ Less support burden
✅ Can still override if needed

### For the Platform
✅ More engaged users
✅ Up-to-date information
✅ Scalable (unlimited profiles)
✅ Professional appearance

---

## MVP Implementation Plan

### Phase 1: Basic Profile Editing (1-2 hours)
1. Create `/dashboard/my-profile` page
2. Create `/people/[slug]/edit` page
3. Build `<ProfileEditForm>` component
4. Add RLS policies for profile editing

### Phase 2: Photo Upload (30 min)
1. Add file input to form
2. Upload to Supabase Storage
3. Update photo_url in database

### Phase 3: Profile Claiming (1 hour)
1. Create `/claim-profile/[slug]` page
2. Add invite system for admins
3. Link user_id to profiles

### Total: ~3-4 hours for complete self-service system!

---

## Next Steps

Ready to build this? I can:

1. **Create the edit form page** - Simple form for editing profiles
2. **Add photo upload** - Drag-and-drop or file picker
3. **Set up RLS policies** - Secure who can edit what
4. **Create dashboard** - `/dashboard/my-profile` landing page

Which would you like me to start with?
