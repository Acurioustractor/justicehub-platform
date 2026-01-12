# JusticeHub Complete Sitemap

**Generated:** January 5, 2026
**Total Routes:** 82 pages

---

## Visual Site Architecture

```
                                    ┌─────────────────────────────────────┐
                                    │           JUSTICEHUB                │
                                    │         / (Homepage)                │
                                    └─────────────────┬───────────────────┘
                                                      │
          ┌───────────────┬───────────────┬───────────┼───────────────┬───────────────┬───────────────┐
          │               │               │           │               │               │               │
          ▼               ▼               ▼           ▼               ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐ ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ STORIES │     │ DISCOVER│     │ CENTRE  │ │PLATFORM │     │  AUTH   │     │  ADMIN  │     │  OTHER  │
    │         │     │         │     │   OF    │ │         │     │         │     │         │     │         │
    └────┬────┘     └────┬────┘     │EXCELLENCE│ └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
         │               │          └────┬────┘      │               │               │               │
         │               │               │           │               │               │               │
```

---

## 📚 STORIES & CONTENT

```
/stories ─────────────────────────────── Stories Hub (All stories)
    │
    ├── /stories/[slug] ─────────────── Individual Story (Dynamic)
    │
    ├── /stories/new ────────────────── Submit New Story
    │
    ├── /stories/intelligence ───────── Media Intelligence Studio
    │
    └── /stories/the-pattern ────────── Scrollytelling Experience
```

---

## 🔍 DISCOVER (People, Orgs, Programs, Services)

```
/people ──────────────────────────────── People Directory
    │
    └── /people/[slug] ──────────────── Person Profile (Dynamic)
            │
            └── /people/[slug]/edit ─── Edit Profile


/organizations ───────────────────────── Organizations Directory
    │
    └── /organizations/[slug] ────────── Organization Profile (Dynamic)


/community-programs ──────────────────── Community Programs Directory
    │
    ├── /community-programs/[id] ─────── Program Detail (Dynamic)
    │
    └── /community-programs/add ──────── Add New Program


/services ────────────────────────────── Services Directory
    │
    └── /services/[id] ───────────────── Service Detail (Dynamic)


/community-map ───────────────────────── Interactive Map
```

---

## 🎓 CENTRE OF EXCELLENCE

```
/centre-of-excellence ────────────────── Overview Hub
    │
    ├── /centre-of-excellence/research ────── Research & Evidence
    │
    ├── /centre-of-excellence/best-practice ── Best Practice Guides
    │
    ├── /centre-of-excellence/global-insights ─ International Perspectives
    │
    └── /centre-of-excellence/map ──────────── Research Map
```

---

## 🧠 INTELLIGENCE (ALMA)

```
/intelligence ────────────────────────── ALMA Intelligence Hub
    │
    ├── /intelligence/interventions ──── Intervention Database
    │       │
    │       └── /intelligence/interventions/[id] ── Intervention Detail
    │
    ├── /intelligence/portfolio ──────── Portfolio Analytics
    │
    ├── /intelligence/evidence/[id] ──── Evidence Detail (Dynamic)
    │
    ├── /intelligence/media/[id] ─────── Media Article Detail (Dynamic)
    │
    ├── /intelligence/programs/[id] ──── Legacy Program Detail (Dynamic)
    │
    └── /intelligence/nt-showcase ────── NT Programs Showcase
```

---

## 🌱 STEWARDS (Community)

```
/stewards ────────────────────────────── Become a Steward
    │
    └── /stewards/impact ─────────────── Impact Dashboard
```

---

## 🎨 PLATFORM FEATURES

```
/transparency ────────────────────────── Funding Transparency
/gallery ─────────────────────────────── Program Gallery
/art-innovation ──────────────────────── Art & Innovation Hub
    │
    └── /art-innovation/[slug] ───────── Art Project Detail (Dynamic)

/roadmap ─────────────────────────────── Platform Roadmap
/flywheel ────────────────────────────── Sovereignty Flywheel
/grassroots ──────────────────────────── Grassroots Solutions
```

---

## 🚀 YOUTH SCOUT

```
/youth-scout ─────────────────────────── Youth Scout Home
    │
    ├── /youth-scout/youth-login ─────── Youth Login Portal
    │
    └── /youth-scout/talent-login ────── Talent Scout Login

/talent-scout ────────────────────────── Talent Scout (Alt entry)
```

---

## 📝 BLOG & WIKI

```
/blog ────────────────────────────────── Blog Index
    │
    └── /blog/[slug] ─────────────────── Blog Post (Dynamic)


/wiki ────────────────────────────────── Wiki Index
    │
    └── /wiki/[slug] ─────────────────── Wiki Page (Dynamic)
            │
            └── (Mindaroo Pitch subpages rendered via [slug])
```

---

## 🔐 AUTHENTICATION

```
/login ───────────────────────────────── Login Page
/signup ──────────────────────────────── Sign Up Page
/check-cookies ───────────────────────── Cookie Check (Debug)
/test-auth ───────────────────────────── Auth Testing (Dev)
```

---

## ⚙️ ADMIN DASHBOARD

```
/admin ───────────────────────────────── Admin Dashboard Home
    │
    ├── /admin/profiles ──────────────── Manage Profiles
    │       │
    │       └── /admin/profiles/[id]/connections ── Profile Connections
    │
    ├── /admin/organizations ─────────── Manage Organizations
    │       │
    │       └── /admin/organizations/[slug] ─────── Edit Organization
    │
    ├── /admin/programs ──────────────── Manage Programs
    │
    ├── /admin/services ──────────────── Manage Services
    │
    ├── /admin/stories ───────────────── Manage Stories
    │       │
    │       ├── /admin/stories/[id] ──── Edit Story
    │       ├── /admin/stories/new ───── New Story
    │       └── /admin/stories/transcript ── Transcript Tool
    │
    ├── /admin/blog ──────────────────── Manage Blog
    │       │
    │       └── /admin/blog/new ──────── New Blog Post
    │
    ├── /admin/media ─────────────────── Media Manager
    │
    ├── /admin/art-innovation ────────── Manage Art Projects
    │
    ├── /admin/empathy-ledger ────────── Empathy Ledger Admin
    │
    └── /admin/auto-linking ──────────── Auto-Linking Tool
```

---

## 📊 VISUALS

```
/visuals ─────────────────────────────── Visual Index
    │
    ├── /visuals/connections ─────────── Connections Visualization
    │
    ├── /visuals/flow ────────────────── Flow Visualization
    │
    ├── /visuals/network ─────────────── Network Visualization
    │
    └── /visuals/transformation ──────── Transformation Visual
```

---

## 📄 STATIC PAGES

```
/about ───────────────────────────────── About JusticeHub
/how-it-works ────────────────────────── How It Works
/contact ─────────────────────────────── Contact Us
/privacy ─────────────────────────────── Privacy Policy
/terms ───────────────────────────────── Terms of Service
/preplanning ─────────────────────────── Pre-Planning Page
```

---

## 🎯 CONTAINED (Alternate Version)

```
/contained ───────────────────────────── Contained Home
    │
    └── /contained/about ─────────────── Contained About
```

---

## 🧪 DEV/TEST

```
/test-auth ───────────────────────────── Auth Testing
/test-services ───────────────────────── Services Testing
/check-cookies ───────────────────────── Cookie Debug
```

---

## Route Summary by Type

| Type | Count | Examples |
|------|-------|----------|
| **Static Pages** | 45 | `/about`, `/transparency`, `/stewards` |
| **Dynamic [param]** | 15 | `/people/[slug]`, `/stories/[slug]` |
| **Admin Pages** | 18 | `/admin/*` |
| **API Routes** | ~20+ | `/api/*` (not shown) |

---

## Navigation Structure

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              TOP NAVIGATION                                 │
├────────────────────────────────────────────────────────────────────────────┤
│  STORIES  │  DISCOVER ▼  │  CENTRE OF EXCELLENCE ▼  │  PLATFORM ▼  │ ABOUT │
│           │              │                          │              │       │
│           │ • People     │ • Overview               │ • Stewards   │       │
│           │ • Orgs       │ • Intelligence Hub       │ • Transparency│      │
│           │ • Programs   │ • Research               │ • Gallery    │       │
│           │ • Services   │ • Best Practice          │ • Art        │       │
│           │ • Map        │ • Global Insights        │ • Roadmap    │       │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │         YOUTH SCOUT           │
                    │    (Prominent CTA Button)     │
                    └───────────────────────────────┘
```

---

## User Journey Flows

### 🎯 Youth Journey
```
Homepage → Youth Scout → Youth Login → Services/Programs → Stories
```

### 🔬 Researcher Journey
```
Homepage → Centre of Excellence → Intelligence Hub → Interventions → Portfolio
```

### 🌱 Steward Journey
```
Homepage → Stewards → Impact Dashboard → Intelligence → Become Steward
```

### 🏛️ Organization Journey
```
Homepage → Discover/Organizations → Add Program → Transparency
```

---

## Page Count by Section

```
SECTION                    PAGES
─────────────────────────────────
Homepage                      1
Stories                       5
Discover (People/Orgs/etc)   10
Centre of Excellence          5
Intelligence (ALMA)           8
Stewards                      2
Platform Features             6
Youth Scout                   3
Blog & Wiki                   4
Auth                          4
Admin                        18
Visuals                       5
Static Pages                  6
Contained                     2
Dev/Test                      3
─────────────────────────────────
TOTAL                       82
```

---

*This sitemap is auto-generated and may need updates as new pages are added.*
