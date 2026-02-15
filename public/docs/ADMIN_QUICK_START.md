# Admin Quick Start Guide

## 🚀 5-Minute Admin Overview

### Your Admin Dashboard at a Glance

Visit: **`http://localhost:4000/admin`**

You'll see 8 cards:

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  PROFILES   │  SERVICES   │  PROGRAMS   │  BLOG POSTS │
│     31      │     12      │      8      │     45      │
└─────────────┴─────────────┴─────────────┴─────────────┘
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ ORGANIZA... │ AUTO-LINKED │ EMPATHY...  │  FEATURED   │
│   7 • 32    │     67      │  31 • 35    │      8      │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

**Click any card** to manage that content type.

---

## 📋 Most Common Tasks

### 1️⃣ Link a Profile to an Organization

**Time:** 30 seconds

**Steps:**
1. Click **PROFILES** card
2. Find person → Click **LINKS** button
3. Scroll to **Organizations** section
4. Use dropdown → Select organization
5. Enter role (e.g., "Director")
6. Done! ✅

**Visual Flow:**
```
Dashboard → Profiles → [Person] → LINKS → Organizations Section
                                             ↓
                                    [Select organization ▼]
                                             ↓
                                    Enter role: "Director"
                                             ↓
                                          LINKED! ✅
```

---

### 2️⃣ Make a Profile Featured (Show on Homepage)

**Time:** 20 seconds

**Method A: Via Edit Page**
```
Dashboard → Profiles → [Person] → EDIT → Toggle "is_featured" ON → Save
```

**Method B: Via Database**
```sql
UPDATE public_profiles SET is_featured = true WHERE slug = 'person-name';
```

---

### 3️⃣ View Organization's Team

**Time:** 10 seconds

**Steps:**
1. Click **ORGANIZATIONS** card
2. Click any organization
3. See full team with photos

**What You'll See:**
- Current members (with AUTO-LINKED badges for synced)
- Past members
- Roles for each person
- Quick links to edit

---

### 4️⃣ Add Video to a Story/Transcript

**Time:** 1 minute

**Steps:**
1. Click **BLOG POSTS** card
2. Find story → Click **EDIT**
3. Scroll to **Video URL** field
4. Paste URL (e.g., YouTube, Vimeo)
5. Save

**Now:**
- Video link appears on profile connections page
- "Watch Video" button shows up
- Profile pages can link to video

---

### 5️⃣ Remove an Auto-Linked Connection

**Time:** 15 seconds

**Steps:**
1. Go to profile connections page
2. Find connection with **AUTO-LINKED** badge
3. Click trash icon 🗑️
4. Confirm
5. Removed!

**Why Remove?**
- Auto-link was incorrect
- Organization changed
- Person left organization

---

## 🎯 Understanding the Interface

### Profile Connections Page (`/admin/profiles/[id]/connections`)

**This is your MOST POWERFUL page.** Here you manage all relationships.

```
┌─────────────────────────────────────────────────────┐
│  MANAGE CONNECTIONS - Kristy Bloomfield             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📱 Art & Innovation Projects                       │
│  ├─ Building Revolution [Co-founder]      [Remove] │
│  └─ [Add new...]                                    │
│                                                     │
│  🏘️  Community Programs                             │
│  ├─ Youth Mentorship [Coordinator]        [Remove] │
│  └─ [Add new...]                                    │
│                                                     │
│  🛠️  Services                                        │
│  ├─ Legal Aid [Provider]                  [Remove] │
│  └─ [Add new...]                                    │
│                                                     │
│  🏢 Organizations                        🆕         │
│  ├─ Oonchiumpa [Chair] [AUTO] [CURRENT]  [Remove] │
│  └─ [Add new...]                                    │
│                                                     │
│  📖 Stories & Transcripts                🆕         │
│  ├─ Interview [Subject] [AUTO]           [Remove] │
│  │   [📹 Watch Video] [🎧 Listen]                   │
│  └─ [Add new...]                                    │
│                                                     │
│  💾 Empathy Ledger Sync                  🆕         │
│  ├─ ✅ Synced from Empathy Ledger                   │
│  ├─ Profile ID: 550e8400-e29b...                   │
│  ├─ Last Synced: Jan 26, 2025 3:45 PM             │
│  └─ Auto-linked: 2 orgs, 4 transcripts             │
└─────────────────────────────────────────────────────┘
```

---

## 🏢 Organization View

### Organization Detail Page (`/admin/organizations/[slug]`)

**Example: Diagrama**

```
┌─────────────────────────────────────────────────────┐
│  DIAGRAMA                                [AUTO]     │
│  Non-profit • Murcia, Spain                        │
│  Youth justice through creative programs            │
│                                                     │
│  🌐 www.fundaciondiagrama.es                        │
├─────────────────────────────────────────────────────┤
│  📊 STATS                                           │
│  • 4 Total Team Members                            │
│  • 4 Current Members                               │
│  • 4 Auto-Linked                                   │
│  • 0 Past Members                                  │
├─────────────────────────────────────────────────────┤
│  👥 CURRENT TEAM                                    │
│                                                     │
│  [Photo] Kate Bjur                                 │
│          Director              [AUTO-LINKED]       │
│          Leading youth programs in Spain...        │
│          [VIEW] [EDIT]                             │
│                                                     │
│  [Photo] Young People Murcia   [AUTO-LINKED]       │
│          Participants                              │
│          [VIEW] [EDIT]                             │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 Finding Things Fast

### Search Profiles
```
/admin/profiles → Search box → Type name → Results filter instantly
```

### Find Auto-Linked Content
```
/admin → Look at "Auto-Linked" stat card → Shows total count

OR

/admin/profiles → Click profile → LINKS → Look for [AUTO-LINKED] badges
```

### Check Empathy Ledger Sync
```
/admin/profiles → Filter by "Synced Only"

OR

/admin/profiles → Click profile → LINKS → Empathy Ledger section
```

---

## 🎨 Controlling Visibility

### What's "Featured"?

**Featured = Shown prominently on public site**

| Type | Where Featured Items Appear |
|------|----------------------------|
| Profiles | Homepage carousel, People page top |
| Programs | Programs page highlighted section |
| Services | Services page top listings |
| Stories | Homepage stories section |

### How to Feature/Unfeature

**Profiles:**
```
/admin/profiles → [Person] → EDIT → Toggle "is_featured" → Save
```

**Programs:**
```
/admin/programs → [Program] → EDIT → Toggle "is_featured" → Save
```

**Services:**
```
/admin/services → [Service] → EDIT → Toggle "is_featured" → Save
```

**Stories:**
```
/admin/blog → [Story] → EDIT → Toggle "is_featured" → Save
```

---

## 🔄 Auto-Link System Explained

### What Gets Auto-Linked?

When profiles sync from **Empathy Ledger**:

| From Empathy Ledger | Creates in JusticeHub | Badge |
|---------------------|----------------------|-------|
| Profile with `current_organization` | Organization ↔ Profile link | ✅ AUTO-LINKED |
| Transcript where profile is storyteller | Blog Post ↔ Profile link | ✅ AUTO-LINKED |
| Story mentioning profile | Story ↔ Profile link | ✅ AUTO-LINKED |

### Can You Edit Auto-Linked Connections?

**YES!** You can:
- ✅ Remove auto-links
- ✅ Change roles
- ✅ Update current/past status
- ✅ Add additional manual connections

**Auto-links are suggestions, not locked.**

---

## ⚡ Power User Tips

### 1. Bulk Operations via Database

**Feature multiple profiles at once:**
```sql
UPDATE public_profiles
SET is_featured = true
WHERE slug IN ('person-1', 'person-2', 'person-3');
```

### 2. Check Connection Counts

**See how many connections each profile has:**
```sql
SELECT
  p.full_name,
  COUNT(op.id) as org_count,
  COUNT(bp.id) as story_count
FROM public_profiles p
LEFT JOIN organizations_profiles op ON p.id = op.public_profile_id
LEFT JOIN blog_posts_profiles bp ON p.id = bp.public_profile_id
GROUP BY p.full_name
ORDER BY org_count DESC;
```

### 3. Find Profiles Without Connections

**Who needs linking?**
```sql
SELECT full_name, slug
FROM public_profiles
WHERE id NOT IN (
  SELECT DISTINCT public_profile_id FROM organizations_profiles
)
AND id NOT IN (
  SELECT DISTINCT public_profile_id FROM blog_posts_profiles
);
```

### 4. Quick Role Updates

**Change someone's role in an organization:**
```sql
UPDATE organizations_profiles
SET role = 'Senior Director'
WHERE public_profile_id = 'profile-id'
AND organization_id = 'org-id';
```

---

## 🚨 Common Mistakes

### ❌ Linking to Non-Existent Organizations
**Problem:** Dropdown doesn't show organization
**Solution:** Create organization first in `/admin/organizations` OR via database

### ❌ Auto-Link Disappeared
**Problem:** Auto-linked connection vanished
**Solution:** Check if you accidentally deleted it. Re-run sync script:
```bash
npx tsx src/scripts/sync-profiles-from-empathy-ledger.ts
```

### ❌ Changes Not Saving
**Problem:** Click save but nothing happens
**Solution:**
1. Check browser console for errors
2. Verify you're logged in as admin
3. Check Supabase connection

### ❌ Profile Not Featured on Homepage
**Problem:** Toggled `is_featured` but not showing
**Solution:**
1. Verify `is_public` is also true
2. Clear browser cache
3. Check homepage component queries

---

## 📊 Dashboard Stats Explained

| Stat | What It Counts |
|------|---------------|
| **Profiles** | Total people in `public_profiles` |
| **Services** | Total in `services` table |
| **Programs** | Total in `community_programs` |
| **Blog Posts** | Total in `blog_posts` |
| **Organizations** | Total orgs • Total team members |
| **Auto-Linked** | Org links + Story links (AUTO-LINKED badge) |
| **Empathy Ledger** | Synced profiles • Synced transcripts |
| **Featured** | Items with `is_featured = true` |

---

## 🎯 Your First 10 Minutes as Admin

**Here's what to do:**

### ✅ Minute 1-2: Explore Dashboard
```
http://localhost:4000/admin
```
- Click each stat card
- Get familiar with what you have

### ✅ Minute 3-4: Check Profiles
```
/admin/profiles
```
- Search for someone you know
- Click their profile
- See their public page

### ✅ Minute 5-6: View Connections
```
/admin/profiles → [Person] → LINKS
```
- See what they're linked to
- Notice AUTO-LINKED badges
- Check Empathy Ledger section

### ✅ Minute 7-8: Explore Organizations
```
/admin/organizations
```
- Click an organization
- See team members
- Notice AUTO badges

### ✅ Minute 9-10: Feature Something
```
/admin/profiles → [Person] → EDIT → Toggle "is_featured"
```
- Make someone featured
- Visit homepage to see them appear

**Congratulations!** You're now an admin power user. 🎉

---

## 📚 Related Guides

- **Full Guide:** [ADMIN_USER_GUIDE.md](ADMIN_USER_GUIDE.md)
- **What Was Built:** [PHASE1_FINAL_ACHIEVEMENT.md](PHASE1_FINAL_ACHIEVEMENT.md)
- **Sync Details:** [EMPATHY_LEDGER_FULL_INTEGRATION.md](EMPATHY_LEDGER_FULL_INTEGRATION.md)

---

**Questions?** Check the full [ADMIN_USER_GUIDE.md](ADMIN_USER_GUIDE.md) for detailed instructions.
