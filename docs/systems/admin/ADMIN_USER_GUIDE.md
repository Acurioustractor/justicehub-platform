# JusticeHub Admin User Guide

## Complete Admin Interface Walkthrough

### 🏠 Admin Dashboard (`/admin`)

**URL:** `http://localhost:4000/admin`

#### What You See
8 stat cards showing your entire system at a glance:

| Card | What It Shows | Click To |
|------|---------------|----------|
| **Profiles** | Total people in system | `/admin/profiles` |
| **Services** | Total services available | `/admin/services` |
| **Programs** | Community programs | `/admin/programs` |
| **Blog Posts** | Stories & articles | `/admin/blog` |
| **Organizations** 🆕 | Organizations with teams | `/admin/organizations` |
| **Auto-Linked** 🆕 | Auto relationships (org+story) | View all auto-links |
| **Empathy Ledger** 🆕 | Synced profiles + transcripts | View sync status |
| **Featured** | Featured content count | Manage featured items |

---

## 👥 Managing Profiles

### Profile List (`/admin/profiles`)

**URL:** `http://localhost:4000/admin/profiles`

#### Features
- **Search** - Find profiles by name
- **Filter** - Featured only, Synced only, etc.
- **Sort** - By name, date, etc.

#### Each Profile Card Shows
- Photo
- Name
- Bio snippet
- **Badges:**
  - `FEATURED` - Shown on homepage
  - `SYNCED` - From Empathy Ledger
- **Actions:**
  - `VIEW` - Public profile page
  - `EDIT` - Edit profile details
  - `LINKS` - Manage connections

### Editing a Profile (`/admin/profiles/[id]/edit`)

**How to Get There:**
1. `/admin/profiles` → Click profile → Click `EDIT`

**What You Can Edit:**

#### Basic Info
- Full Name
- Bio (rich text)
- Photo URL
- Contact info

#### Visibility & Features
- `is_featured` - Show on homepage?
- `is_public` - Visible to public?
- `role_tags` - Categories (e.g., "Youth Advocate", "Legal Expert")

#### Organization Info
- `current_organization` - Text field (if not linked to org entity)

#### Empathy Ledger Info (Read-only)
- `synced_from_empathy_ledger` - Auto-set
- `empathy_ledger_profile_id` - UUID
- `last_synced_at` - Timestamp

**Save Changes:** Database updates immediately

---

## 🔗 Managing Profile Connections (`/admin/profiles/[id]/connections`)

**How to Get There:**
1. `/admin/profiles` → Click profile → Click `LINKS`

This is where you **connect profiles to organizations, programs, services, stories, etc.**

### Section 1: Art & Innovation Projects

**What It Shows:**
- All art projects this profile is connected to
- Role in each project (e.g., "Co-founder", "Artist")

**Actions:**
- **Remove** - Click trash icon
- **Add Connection** - Select from dropdown, enter role

**Example:**
```
Linked Projects:
┌─────────────────────────────────────────┐
│ Building Revolution in Shipping Container│
│ Role: Co-founder                         │
│                                    [🗑️]  │
└─────────────────────────────────────────┘

Add Connection:
[Select a project...        ▼]
```

### Section 2: Community Programs

**What It Shows:**
- All programs this profile is connected to
- Role (e.g., "Coordinator", "Participant")

**Actions:**
- Same as Art Projects

### Section 3: Services

**What It Shows:**
- All services this profile provides/coordinates
- Role (e.g., "Provider", "Coordinator")

**Actions:**
- Same as above

### Section 4: Organizations 🆕

**What It Shows:**
- All organizations this profile belongs to
- Role (e.g., "Director", "Team Member")
- **AUTO-LINKED badge** - If auto-synced from Empathy Ledger
- **CURRENT badge** - If currently with organization

**Actions:**
- **View Org** - Click 🔗 icon → Navigate to organization page
- **Remove** - Click trash icon
- **Add Connection** - Select org, enter role

**Example:**
```
Linked Organizations:
┌─────────────────────────────────────────────────┐
│ Oonchiumpa                    [AUTO-LINKED]     │
│ Role: Chair                   [CURRENT]         │
│                                   [🔗] [🗑️]      │
└─────────────────────────────────────────────────┘

Add Connection:
[Select an organization...  ▼]
```

### Section 5: Stories & Transcripts 🆕

**What It Shows:**
- All blog posts/transcripts featuring this profile
- **AUTO-LINKED badge** - If auto-synced from Empathy Ledger
- **Media Links** - Video/Audio URLs if available

**Actions:**
- **View Story** - Click 🔗 icon
- **Watch Video** - If video_url exists
- **Listen** - If audio_url exists
- **Remove** - Click trash icon
- **Add Connection** - Select story, enter role

**Example:**
```
Linked Content:
┌─────────────────────────────────────────────────┐
│ Kristy Bloomfield Interview  [AUTO-LINKED]     │
│ Role: Subject                                   │
│ [📹 Watch Video] [🎧 Listen]    [🔗] [🗑️]       │
└─────────────────────────────────────────────────┘
```

### Section 6: Empathy Ledger Sync 🆕

**What It Shows (for synced profiles):**
```
┌─────────────────────────────────────────────────┐
│ ✅ Synced from Empathy Ledger                   │
│ This profile was automatically synced           │
├─────────────────────────────────────────────────┤
│ Empathy Ledger Profile ID:                      │
│ 550e8400-e29b-41d4-a716-446655440000           │
├─────────────────────────────────────────────────┤
│ Last Synced:                                    │
│ January 26, 2025 at 3:45 PM                    │
├─────────────────────────────────────────────────┤
│ Auto-linked connections:                        │
│ • 2 organization(s)                             │
│ • 4 transcript(s)                               │
└─────────────────────────────────────────────────┘
```

**What It Shows (for manual profiles):**
```
┌─────────────────────────────────────────────────┐
│ ℹ️  Not synced from Empathy Ledger              │
│ This profile was created manually in JusticeHub │
└─────────────────────────────────────────────────┘
```

---

## 🏢 Managing Organizations

### Organizations List (`/admin/organizations`)

**URL:** `http://localhost:4000/admin/organizations`

**What You See:**
- Grid of all organizations
- Each card shows:
  - Organization name
  - Type (e.g., "Non-profit", "Community Group")
  - Description
  - **AUTO badge** - If has auto-linked team members
  - Team count + photo stack
  - Location
  - **View Team →** button

**Example Card:**
```
┌─────────────────────────────────────┐
│ Oonchiumpa               [AUTO]     │
│ Non-profit                          │
│ Building community through art...   │
│                                     │
│ 👤👤👤 3 team members               │
│                                     │
│ 📍 Adelaide, SA                     │
│                                     │
│          [View Team →]              │
└─────────────────────────────────────┘
```

### Organization Detail (`/admin/organizations/[slug]`)

**How to Get There:**
1. `/admin/organizations` → Click any organization

**What You See:**

#### Header
- Organization name, type, description
- Website link
- Location

#### Stats
- Total Team Members
- Current Members
- Auto-Linked Members
- Past Members

#### Team Members Section

**Current Members:**
```
┌─────────────────────────────────────────────┐
│ [Photo] Kristy Bloomfield                   │
│         Chair                 [AUTO-LINKED] │
│         Bio excerpt...                      │
│         [VIEW] [EDIT]                       │
└─────────────────────────────────────────────┘
```

**Past Members:**
- Same format but marked as "Past"

**Actions:**
- **VIEW** - View public profile
- **EDIT** - Go to profile connections page to edit role/status

---

## 📝 Managing Blog Posts/Stories (`/admin/blog`)

**URL:** `http://localhost:4000/admin/blog`

### What You Can Do

#### View All Posts
- Filter by status (published/draft)
- Search by title
- See which are synced from Empathy Ledger

#### Each Post Shows
- Title
- Status (Published/Draft)
- Author
- **SYNCED badge** - If from Empathy Ledger
- Edit/Delete actions

#### Editing a Post
- Title
- Content (rich text)
- Excerpt
- Status (draft/published)
- **Video URL** - For transcripts
- **Audio URL** - For transcripts
- **Profile Connections** - Who appears in this story

---

## 🎯 Managing Visibility (Making Things Featured)

### What Does "Featured" Mean?

**Featured Profiles** → Shown on homepage
**Featured Programs** → Highlighted in programs list
**Featured Services** → Top of services page

### How to Feature a Profile

**Method 1: Profile Edit Page**
1. `/admin/profiles` → Select profile → `EDIT`
2. Toggle `is_featured` to ON
3. Save

**Method 2: Direct Database**
```sql
UPDATE public_profiles
SET is_featured = true
WHERE slug = 'kristy-bloomfield';
```

### How to Feature a Program

1. `/admin/programs` → Select program → `EDIT`
2. Toggle `is_featured`
3. Save

### How to Feature a Service

1. `/admin/services` → Select service → `EDIT`
2. Toggle `is_featured`
3. Save

---

## 🔍 Understanding Auto-Linked Content

### What Gets Auto-Linked?

When profiles are synced from Empathy Ledger:

1. **Organizations** → If profile's `current_organization` matches an org name
2. **Transcripts** → All transcripts where profile is `storyteller_id`
3. **Stories** → Stories where profile is mentioned
4. **Galleries** → Photo galleries featuring the profile

### How to Identify Auto-Linked Content

Look for the **AUTO-LINKED** badge:
```
[Sparkles Icon] AUTO-LINKED
```

This appears on:
- Organization team member cards
- Story/transcript connection cards
- Profile connection pages

### How to Edit Auto-Linked Connections

**You can:**
- ✅ Remove auto-linked connections
- ✅ Edit roles
- ✅ Change current/past status
- ✅ Add additional manual connections

**Example:**
1. Go to `/admin/profiles/[id]/connections`
2. Find the Organizations section
3. See "Oonchiumpa" with AUTO-LINKED badge
4. Click trash icon to remove
5. OR use dropdown to add more organizations

---

## 🔄 Sync Workflows

### When New Profile Syncs from Empathy Ledger

**What Happens Automatically:**
1. Profile created in `public_profiles`
2. `synced_from_empathy_ledger` = true
3. `empathy_ledger_profile_id` = UUID from source
4. Organization link created (if org exists)
5. Transcripts synced as blog posts
6. Transcript ↔ Profile links created
7. `last_synced_at` timestamp set

**What You Need to Do:**
1. Visit `/admin/profiles/[id]/edit`
2. Review bio, photo
3. Set `is_featured` if appropriate
4. Add any missing connections manually

### Re-Syncing a Profile

**Via Script:**
```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' \
  npx tsx src/scripts/sync-profiles-from-empathy-ledger.ts
```

This will:
- Update existing profiles
- Add new profiles
- Preserve manual edits
- Update `last_synced_at`

---

## 📊 Common Admin Tasks

### Task 1: Add a New Featured Profile

**Steps:**
1. Go to `/admin/profiles`
2. Click `+ NEW PROFILE` (if exists) OR use script
3. Fill in details:
   - Full name
   - Bio
   - Photo URL
   - Role tags
4. Toggle `is_featured` ON
5. Save
6. Go to connections page (`LINKS`)
7. Link to organizations, programs, services

### Task 2: Link Profile to Organization

**Steps:**
1. `/admin/profiles` → Select profile → `LINKS`
2. Scroll to Organizations section
3. Click dropdown: "Select an organization..."
4. Choose organization
5. Enter role (e.g., "Director", "Team Member")
6. Connection created!

### Task 3: Feature a Story/Transcript

**Steps:**
1. `/admin/blog` → Find story
2. Click `EDIT`
3. Set status to "Published"
4. Toggle `is_featured`
5. Link to profiles via connections interface
6. Save

### Task 4: View All Auto-Linked Relationships

**Steps:**
1. Go to `/admin` dashboard
2. Look at **Auto-Linked** stat card
3. Shows total count (e.g., "67")
4. Click to see breakdown:
   - Organization links
   - Story/transcript links

**OR manually check:**
1. Visit each profile's connections page
2. Look for AUTO-LINKED badges

### Task 5: Remove an Organization Link

**Steps:**
1. `/admin/profiles/[id]/connections`
2. Scroll to Organizations section
3. Find the organization to remove
4. Click trash icon 🗑️
5. Confirm removal
6. Link deleted!

### Task 6: Add Video to Transcript

**Steps:**
1. `/admin/blog` → Find transcript
2. Click `EDIT`
3. Add URL to `video_url` field
4. Save
5. Now appears on profile connections page with "Watch Video" button

---

## 🎨 Customizing What's Visible on Homepage

### Featured Profiles Carousel
**Controlled by:** `is_featured` flag in `public_profiles`

**To Add:**
```sql
UPDATE public_profiles
SET is_featured = true
WHERE id = 'profile-id-here';
```

**To Remove:**
```sql
UPDATE public_profiles
SET is_featured = false
WHERE id = 'profile-id-here';
```

### Featured Stories
**Controlled by:** `is_featured` flag in `blog_posts`

**To Add:**
1. `/admin/blog` → Edit post
2. Toggle `is_featured`
3. Set status to "Published"

### Featured Programs
**Controlled by:** `is_featured` flag in `community_programs`

---

## 🔐 Permissions & Access

### Who Can Access Admin?
**Current:** Anyone with `user_role = 'admin'` in `users` table

**To Check Your Role:**
```bash
curl http://localhost:4000/api/auth/me
```

**To Grant Admin Access:**
```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{user_role}',
  '"admin"'
)
WHERE email = 'user@example.com';
```

---

## 📱 Mobile Admin Access

All admin pages are responsive and work on mobile:
- Dashboard cards stack vertically
- Profile lists become scrollable
- Edit forms adapt to screen size

---

## 🐛 Troubleshooting

### Profile Not Showing in List
**Check:**
1. Is `is_public` set to true?
2. Is profile actually in database?
3. Try clearing filters

### Auto-Link Not Showing
**Check:**
1. Is profile synced from Empathy Ledger?
2. Does organization exist in `organizations` table?
3. Check `organizations_profiles` junction table

### Can't Edit Connection
**Check:**
1. Are you logged in as admin?
2. Does the junction table entry exist?
3. Try refreshing the page

### Changes Not Saving
**Check:**
1. Browser console for errors
2. Database permissions
3. Supabase connection

---

## 🎯 Quick Reference

### Key URLs
- Dashboard: `/admin`
- Profiles: `/admin/profiles`
- Organizations: `/admin/organizations`
- Blog: `/admin/blog`
- Programs: `/admin/programs`
- Services: `/admin/services`

### Key Database Tables
- `public_profiles` - All people
- `organizations` - All organizations
- `organizations_profiles` - Who works where
- `blog_posts` - Stories & transcripts
- `blog_posts_profiles` - Who appears in what
- `community_programs` - Programs
- `services` - Services

### Key Flags
- `is_featured` - Show prominently
- `is_public` - Visible to public
- `is_current` - Currently active (org membership)
- `synced_from_empathy_ledger` - Auto-synced

---

## 💡 Pro Tips

1. **Use AUTO-LINKED badges** to distinguish auto vs manual connections
2. **Check Empathy Ledger section** before manually linking
3. **Feature sparingly** - Only highlight the best content
4. **Use organizations** as a way to group related profiles
5. **Link transcripts to profiles** so people can find related videos
6. **Keep roles descriptive** - "Director" better than "Member"
7. **Use current/past flags** to maintain history
8. **Review auto-links** periodically to ensure accuracy

---

## 📚 Related Documentation

- [PHASE1_FINAL_ACHIEVEMENT.md](PHASE1_FINAL_ACHIEVEMENT.md) - What was built
- [EMPATHY_LEDGER_FULL_INTEGRATION.md](EMPATHY_LEDGER_FULL_INTEGRATION.md) - Sync details
- [ADMIN_FLOWS_ANALYSIS.md](ADMIN_FLOWS_ANALYSIS.md) - Original requirements

---

**Need Help?** Check the browser console for errors or review the database schema in Supabase.
