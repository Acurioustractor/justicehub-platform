# Complete Admin Flows - Visual Guide

## 🎯 Overview

JusticeHub has **15 admin pages** providing complete content and relationship management:

```
/admin (Dashboard)
├── /admin/profiles (People management)
├── /admin/stories (Stories management)
├── /admin/blog (Blog management)
├── /admin/art-innovation (Art projects)
├── /admin/programs (Programs)
├── /admin/services (Services)
├── /admin/organizations (Organizations)
├── /admin/auto-linking (Auto-link dashboard)
├── /admin/empathy-ledger (Sync dashboard)
└── /admin/media (Media library)
```

---

## 🏠 Dashboard Overview

### The Main Hub
**URL:** `http://localhost:4000/admin`

```
┌──────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                          │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐│
│  │  PEOPLE     │ │  STORIES    │ │  ART & INN  │ │PROGRAMS││
│  │     33      │ │     38      │ │      1      │ │   10   ││
│  │  33 public  │ │ 38 profile  │ │  2 profile  │ │  0%    ││
│  │             │ │    links    │ │    links    │ │connected│
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘│
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐│
│  │  SERVICES   │ │ORGANIZATIONS│ │ AUTO-LINKED │ │EMPATHY ││
│  │    511      │ │     454     │ │     67      │ │LEDGER  ││
│  │     0%      │ │ 32 team     │ │  32 orgs +  │ │   31   ││
│  │  connected  │ │   members   │ │  35 stories │ │35 trans││
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘│
└──────────────────────────────────────────────────────────────┘
```

**Each card is clickable and leads to its management page!**

---

## 📊 Flow 1: Managing People & Connections

### Starting Point: Dashboard → People Card

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Dashboard                                           │
│ Click "People" card (33)                                    │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: /admin/profiles                                     │
│                                                             │
│ Filters: [All] [Public] [Featured] [Synced]                │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ [Photo] Kristy Bloomfield          [SYNCED] [FEATURED]│   │
│ │         Chair at Oonchiumpa                           │   │
│ │         Bio excerpt...                                │   │
│ │         [VIEW] [EDIT] [LINKS]                         │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                         ↓
              ┌──────────┼──────────┐
              ↓          ↓          ↓
        [VIEW]      [EDIT]      [LINKS]
```

### Option A: Click EDIT

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 3A: /people/[slug]/edit                                │
│                                                             │
│ Full Name: [Kristy Bloomfield          ]                    │
│ Bio:       [Rich text editor...        ]                    │
│ Photo URL: [https://...               ]                    │
│                                                             │
│ Visibility:                                                 │
│ ☑ Public (visible to everyone)                             │
│ ☑ Featured (show on homepage)                              │
│                                                             │
│ Role Tags: [Youth Advocate] [+Add]                          │
│                                                             │
│ Current Organization: [Oonchiumpa     ]                     │
│                                                             │
│ [SAVE CHANGES]                                              │
└─────────────────────────────────────────────────────────────┘
```

### Option B: Click LINKS

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 3B: /admin/profiles/[id]/connections                  │
│                                                             │
│ 🎨 Art & Innovation Projects                                │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ Building Revolution [Co-founder]          [Remove] │     │
│ └─────────────────────────────────────────────────────┘     │
│ [Select a project... ▼]                                     │
│                                                             │
│ 🏘️  Community Programs                                      │
│ [Select a program... ▼]                                     │
│                                                             │
│ 🛠️  Services                                                 │
│ [Select a service... ▼]                                     │
│                                                             │
│ 🏢 Organizations                                            │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ Oonchiumpa [Chair] [AUTO-LINKED] [CURRENT]        │     │
│ │                              [🔗 View] [🗑️ Remove] │     │
│ └─────────────────────────────────────────────────────┘     │
│ [Select an organization... ▼]                               │
│                                                             │
│ 📖 Stories & Transcripts                                    │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ Interview [Subject] [AUTO-LINKED]                  │     │
│ │ [📹 Watch Video] [🎧 Listen]  [🔗 View] [🗑️ Remove]│     │
│ └─────────────────────────────────────────────────────┘     │
│ [Select a story... ▼]                                       │
│                                                             │
│ 💾 Empathy Ledger Sync                                      │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ ✅ Synced from Empathy Ledger                       │     │
│ │ Profile ID: 550e8400-e29b-41d4-a716-446655440000   │     │
│ │ Last Synced: January 26, 2025 at 3:45 PM          │     │
│ │                                                    │     │
│ │ Auto-linked connections:                           │     │
│ │ • 2 organization(s)                                │     │
│ │ • 4 transcript(s)                                  │     │
│ └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

**Actions Available:**
- ✅ Link to new organizations
- ✅ Link to new stories
- ✅ Link to programs, services, art
- ✅ Remove any connection
- ✅ View connected items
- ✅ See auto-link status

---

## 🏢 Flow 2: Managing Organizations & Teams

### Starting Point: Dashboard → Organizations Card

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Dashboard                                           │
│ Click "Organizations" card (454)                            │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: /admin/organizations                                │
│                                                             │
│ Grid View of All Organizations                              │
│                                                             │
│ ┌──────────────────┐ ┌──────────────────┐                  │
│ │ Oonchiumpa [AUTO]│ │ Diagrama   [AUTO]│                  │
│ │ Non-profit       │ │ Non-profit       │                  │
│ │ Building...      │ │ Youth justice... │                  │
│ │                  │ │                  │                  │
│ │ 👤👤👤 3 team     │ │ 👤👤👤👤 4 team  │                  │
│ │                  │ │                  │                  │
│ │ Adelaide, SA     │ │ Murcia, Spain    │                  │
│ │ [View Team →]    │ │ [View Team →]    │                  │
│ └──────────────────┘ └──────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                         ↓
                  Click "View Team"
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: /admin/organizations/[slug]                         │
│                                                             │
│ DIAGRAMA                                                    │
│ Non-profit • Murcia, Spain                                  │
│ Youth justice through creative programs                     │
│ 🌐 www.fundaciondiagrama.es                                 │
│                                                             │
│ Stats: 4 Total • 4 Current • 4 Auto-Linked • 0 Past        │
│                                                             │
│ 👥 CURRENT TEAM                                             │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ [Photo] Kate Bjur                                  │     │
│ │         Director              [AUTO-LINKED]        │     │
│ │         Leading youth programs in Spain...         │     │
│ │         [VIEW] [EDIT]                              │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ [Photo] Young People Murcia   [AUTO-LINKED]        │     │
│ │         Participants                               │     │
│ │         [VIEW] [EDIT]                              │     │
│ └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                         ↓
                  Click "EDIT" on team member
                         ↓
             Goes to /admin/profiles/[id]/connections
             (See Flow 1 - Managing Connections)
```

**Navigation Loop:**
```
Organizations → Team Member → Connections →
See Organizations Section → Click View Org → Back to Team
```

---

## ✨ Flow 3: Exploring Auto-Linked Relationships

### Starting Point: Dashboard → Auto-Linked Card

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Dashboard                                           │
│ Click "Auto-Linked" card (67)                               │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: /admin/auto-linking                                 │
│                                                             │
│ ✨ Auto-Linked Relationships                                │
│                                                             │
│ Stats Overview:                                             │
│ ┌────────┐ ┌────────┐ ┌────────┐                           │
│ │   67   │ │   32   │ │   35   │                           │
│ │ Total  │ │  Org   │ │ Story  │                           │
│ │ Auto-  │ │ Links  │ │ Links  │                           │
│ │ Links  │ │        │ │        │                           │
│ └────────┘ └────────┘ └────────┘                           │
│                                                             │
│ 🏢 Organization Links (32)                                  │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ [Photo] Kristy Bloomfield    [AUTO-LINKED] [CURRENT]│     │
│ │         Chair at Oonchiumpa                        │     │
│ │         Linked on Jan 26, 2025                     │     │
│ │         [View Profile] [View Org]                  │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ [Photo] Kate Bjur            [AUTO-LINKED] [CURRENT]│     │
│ │         Director at Diagrama                       │     │
│ │         Linked on Jan 26, 2025                     │     │
│ │         [View Profile] [View Org]                  │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                             │
│ 📖 Story & Transcript Links (35)                            │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ [Photo] Kristy Bloomfield    [AUTO-LINKED]         │     │
│ │         Subject in Interview Transcript            │     │
│ │         Linked on Jan 26, 2025                     │     │
│ │         [View Profile] [View Story]                │     │
│ └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                         ↓
              ┌──────────┴──────────┐
              ↓                     ↓
      [View Profile]          [View Org/Story]
              ↓                     ↓
    Profile Connections    Organization Detail
       (See Flow 1)            (See Flow 2)
```

**Use Cases:**
1. **Verify Auto-Links:** Check that automatic relationships are correct
2. **Quick Navigation:** Jump directly to profiles or organizations
3. **Audit Trail:** See when links were created
4. **Status Check:** See CURRENT/FEATURED badges

---

## 💾 Flow 4: Monitoring Empathy Ledger Sync

### Starting Point: Dashboard → Empathy Ledger Card

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Dashboard                                           │
│ Click "Empathy Ledger" card (31 • 35)                       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: /admin/empathy-ledger                               │
│                                                             │
│ 💾 Empathy Ledger Sync Dashboard                            │
│                                                             │
│ Stats Overview:                                             │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐           │
│ │   31   │ │   35   │ │   67   │ │  Jan 26    │           │
│ │ Synced │ │ Trans- │ │ Auto-  │ │    2025    │           │
│ │ Profiles│ │ cripts │ │ Links  │ │ Last Sync  │           │
│ └────────┘ └────────┘ └────────┘ └────────────┘           │
│                                                             │
│ 📖 How Syncing Works                                        │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ Automatic Sync:                                    │     │
│ │ • Profiles marked justicehub_enabled = true        │     │
│ │ • Organization memberships → creates links         │     │
│ │ • Interview transcripts → creates blog posts       │     │
│ │                                                    │     │
│ │ Manual Sync Command:                               │     │
│ │ npx tsx src/scripts/sync-profiles...               │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                             │
│ 👥 Synced Profiles (31)                                     │
│                                                             │
│ ┌──────────────────┐ ┌──────────────────┐                  │
│ │ [Photo]          │ │ [Photo]          │                  │
│ │ Kristy Bloomfield│ │ Kate Bjur        │                  │
│ │ 550e8400-e29b... │ │ 661f9511-f3ac... │                  │
│ │ Last: Jan 26     │ │ Last: Jan 26     │                  │
│ │ [View Connections]│ │ [View Connections]│                  │
│ └──────────────────┘ └──────────────────┘                  │
│                                                             │
│ 📖 Synced Transcripts (35)                                  │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ Kristy Bloomfield - Interview Transcript           │     │
│ │ 772g0622-g4bd-51e5-b827-557766551111              │     │
│ │ 📹 Video Available  🎧 Audio Available              │     │
│ │ Synced: Jan 26, 2025                               │     │
│ │ [View Story]                                       │     │
│ └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                         ↓
              ┌──────────┴──────────┐
              ↓                     ↓
      [View Connections]       [View Story]
              ↓                     ↓
    Profile Connections    Story Public Page
       (See Flow 1)         with Video/Audio
```

**Use Cases:**
1. **Monitor Sync Status:** See when last sync occurred
2. **Verify Sync:** Check all synced profiles and transcripts
3. **Access Media:** Find transcripts with video/audio
4. **Manual Sync:** Follow instructions to re-sync

---

## 📝 Flow 5: Managing Stories & Content

### Starting Point: Dashboard → Stories Card

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Dashboard                                           │
│ Click "Stories" card (38)                                   │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: /admin/stories                                      │
│                                                             │
│ 📖 Stories Management                                       │
│                                                             │
│ [+ New Story]                                               │
│                                                             │
│ Filters: [All] [Published] [Draft] [Synced from EL]        │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ Interview with Kristy         [SYNCED] [PUBLISHED] │     │
│ │ By Admin • Jan 26, 2025                            │     │
│ │ 38 profile links • 📹 Video • 🎧 Audio              │     │
│ │ [EDIT] [VIEW] [DELETE]                             │     │
│ └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                         ↓
                  Click "EDIT" or "+ New Story"
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: /admin/stories/new or /admin/blog/edit/[id]        │
│                                                             │
│ Title:     [Interview with...                ]              │
│ Slug:      [interview-with-kristy-bloomfield ]              │
│ Excerpt:   [Brief summary...                 ]              │
│                                                             │
│ Content:   [Rich text editor...              ]              │
│                                                             │
│ Media URLs:                                                 │
│ Video URL: [https://youtube.com/...         ]              │
│ Audio URL: [https://soundcloud.com/...      ]              │
│                                                             │
│ Status:    ⦿ Published  ○ Draft                            │
│                                                             │
│ Featured:  ☐ Show on homepage                              │
│                                                             │
│ Profile Connections:                                        │
│ [Kristy Bloomfield - Subject] [Remove]                     │
│ [+ Add profile...]                                          │
│                                                             │
│ [SAVE] [PREVIEW]                                            │
└─────────────────────────────────────────────────────────────┘
```

**Actions Available:**
- ✅ Create new stories
- ✅ Edit existing stories
- ✅ Add video/audio URLs
- ✅ Link to profiles
- ✅ Publish or draft
- ✅ Feature on homepage

---

## 🔄 Complete Cross-Navigation Examples

### Example 1: From Dashboard to Deep Details

```
Dashboard
    ↓ Click "Organizations"
Organizations List
    ↓ Click "Diagrama"
Diagrama Team Page
    ↓ Click "EDIT" on Kate Bjur
Kate Bjur Connections
    ↓ Scroll to Stories section
See "Interview Transcript" [AUTO-LINKED]
    ↓ Click "Watch Video"
YouTube opens with interview
```

### Example 2: Verifying Auto-Links

```
Dashboard
    ↓ Click "Auto-Linked"
Auto-Linking Dashboard
    ↓ See "Kate Bjur → Diagrama"
    ↓ Click "View Profile"
Kate Bjur Connections
    ↓ Scroll to Organizations
Verify Diagrama is linked with [AUTO-LINKED] badge
    ↓ Click "View Org"
Back to Diagrama Team Page
See Kate Bjur with [AUTO-LINKED] badge ✅
```

### Example 3: Finding Synced Content

```
Dashboard
    ↓ Click "Empathy Ledger"
Empathy Ledger Dashboard
    ↓ See "31 Synced Profiles"
    ↓ Click "View Connections" on Kristy
Kristy's Connections Page
    ↓ Scroll to Empathy Ledger section
See sync status: ✅ Synced
See Profile ID: 550e8400...
See Last Synced: Jan 26, 2025
See Auto-links: 2 orgs, 4 transcripts
```

### Example 4: Adding New Connections

```
Dashboard
    ↓ Click "People"
Profiles List
    ↓ Click "LINKS" on anyone
Connections Page
    ↓ Scroll to Organizations
    ↓ Use dropdown "Select organization..."
    ↓ Choose "Oonchiumpa"
    ↓ Enter role: "Volunteer"
Link created! ✅
    ↓ Page reloads
See new organization link (no AUTO badge - manual)
```

---

## 🎯 Admin Capabilities Matrix

| Feature | Dashboard | Profiles | Organizations | Auto-Links | Empathy | Stories |
|---------|-----------|----------|---------------|------------|---------|---------|
| **View** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Create** | - | ✅ | - | - | - | ✅ |
| **Edit** | - | ✅ | - | - | - | ✅ |
| **Delete** | - | ✅ | - | - | - | ✅ |
| **Link** | - | ✅ | ✅ | - | - | ✅ |
| **Unlink** | - | ✅ | ✅ | - | - | ✅ |
| **Feature** | - | ✅ | - | - | - | ✅ |
| **Sync** | - | - | - | - | ✅ | - |
| **Monitor** | ✅ | - | ✅ | ✅ | ✅ | - |

---

## 🚀 Quick Action Guide

### I Want To...

**...See all auto-linked relationships**
```
/admin → Auto-Linked → View all 67
```

**...Check if profile is synced from Empathy Ledger**
```
/admin → People → [Person] → LINKS → Scroll to Empathy Ledger section
```

**...Link someone to an organization**
```
/admin → People → [Person] → LINKS → Organizations → Select org → Enter role
```

**...See an organization's team**
```
/admin → Organizations → [Org] → View full team
```

**...Add video to a story**
```
/admin → Stories → [Story] → EDIT → Add Video URL → Save
```

**...Feature a profile on homepage**
```
/admin → People → [Person] → EDIT → Check "Featured" → Save
```

**...Monitor sync status**
```
/admin → Empathy Ledger → See stats and last sync
```

**...Find all transcripts with video**
```
/admin → Empathy Ledger → Scroll to Transcripts → Look for 📹
```

---

## 📱 Mobile Responsiveness

All admin pages work on mobile:
- Dashboard cards stack vertically
- Organization grids become single column
- Profile lists scroll smoothly
- Edit forms adapt to screen
- Action buttons remain accessible

---

## ✨ Visual Indicators Guide

### Badges

| Badge | Meaning | Where |
|-------|---------|-------|
| **SYNCED** | From Empathy Ledger | Profiles list |
| **FEATURED** | Shown on homepage | Profiles, Stories |
| **AUTO-LINKED** | Auto-created relationship | Connections, Orgs, Auto-Links |
| **CURRENT** | Currently at organization | Org connections |
| **PUBLIC** | Visible to everyone | Profile settings |
| **DRAFT** | Not published | Stories |
| **PUBLISHED** | Live on site | Stories |

### Icons

| Icon | Meaning |
|------|---------|
| 👤 | Profile/Person |
| 🏢 | Organization |
| 📖 | Story/Article |
| 📹 | Video available |
| 🎧 | Audio available |
| ✨ | Auto-linked |
| 💾 | Empathy Ledger |
| 🔗 | External link |
| ✅ | Synced/Active |
| ℹ️ | Information |

---

## 🎉 Complete System Overview

```
                    ┌──────────────┐
                    │  DASHBOARD   │
                    │   8 Cards    │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌───▼────┐      ┌─────▼─────┐      ┌────▼────┐
    │PROFILES│      │   ORGS    │      │ STORIES │
    │   33   │      │   454     │      │   38    │
    └───┬────┘      └─────┬─────┘      └────┬────┘
        │                 │                  │
        │        ┌────────┴────────┐         │
        │        │                 │         │
    ┌───▼────┐  ┌▼──────────┐  ┌──▼─────┐   │
    │CONNECT │  │ ORG DETAIL│  │ EDIT   │   │
    │ IONS   │  │   TEAM    │  │ STORY  │   │
    └───┬────┘  └─────┬─────┘  └────────┘   │
        │             │                      │
        │   ┌─────────┴───────────┐          │
        │   │                     │          │
    ┌───▼───▼───┐          ┌─────▼──────┐   │
    │AUTO-LINKING│          │  EMPATHY   │   │
    │ DASHBOARD  │          │  LEDGER    │   │
    │    67      │          │    31      │   │
    └────────────┘          └────────────┘   │
                                             │
                            All paths lead   │
                            to connections! ◄┘
```

**Every card, every page, every button - all connected in a seamless admin experience!** 🎯

---

## 📚 Documentation Index

1. **[ADMIN_USER_GUIDE.md](ADMIN_USER_GUIDE.md)** - Complete feature reference
2. **[ADMIN_QUICK_START.md](ADMIN_QUICK_START.md)** - 5-minute quick start
3. **[ADMIN_ROUTES_COMPLETE.md](ADMIN_ROUTES_COMPLETE.md)** - All routes mapped
4. **[ADMIN_COMPLETE_FLOWS.md](ADMIN_COMPLETE_FLOWS.md)** - This visual guide
5. **[PHASE1_FINAL_ACHIEVEMENT.md](PHASE1_FINAL_ACHIEVEMENT.md)** - What was built
6. **[EMPATHY_LEDGER_FULL_INTEGRATION.md](EMPATHY_LEDGER_FULL_INTEGRATION.md)** - Sync details

**The admin system is 100% complete and fully documented!** 🚀
