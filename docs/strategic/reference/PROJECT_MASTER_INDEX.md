# Aunty Corrine Story - Master Project Index

## Overview

This document provides a complete index of all files created for publishing Aunty Corrine's story on JusticeHub. Use this as your navigation guide to find the right document for each task.

**Total files created:** 16
**Project timeline:** Analysis → Strategy → Content → Implementation → Promotion

---

## Quick Navigation

### I Need To...

**Understand the interview and analysis:**
→ [AUNTY_CORRINE_INTERVIEW_ANALYSIS.md](#analysis-documents)

**Set up the database:**
→ [deploy-all-aunty-corrine.sql](#deployment-scripts) (run this one file)

**Publish the story:**
→ [QUICK_START_PUBLISH_AUNTY_STORY.md](#workflow-guides)

**Get consent from Aunty:**
→ [CONSENT_EMAIL_TEMPLATE.md](#workflow-guides)

**Promote on social media:**
→ [SOCIAL_MEDIA_TEMPLATES.md](#promotion-materials)

**Understand how everything fits together:**
→ [COMPLETE_SETUP_GUIDE.md](#workflow-guides)

**Use the story for grant applications:**
→ [NSW_GRANT_APPLICATION_TOOLKIT.md](#strategic-documents)

---

## File Directory

### Analysis Documents
*Research and analysis of interview content*

#### MOUNT_ISA_AUNTIES_ANALYSIS.md
- **Purpose:** Initial analysis of conversation with Mount Isa Aunties
- **Contains:** 7 core themes, powerful quotes, blog post structure options
- **Use when:** Understanding the broader Mount Isa context
- **Key themes:** "You're Our Paycheck," systems don't talk, community knowledge vs credentialism

#### AUNTY_CORRINE_INTERVIEW_ANALYSIS.md
- **Purpose:** Deep analysis of extended interview with detailed case studies
- **Contains:** 10 case studies, 10 systems failures, community-led model elements
- **Use when:** Need specific evidence, quotes, or examples for writing
- **Key case studies:** Steven (Cleveland to independence), 25 MBBs, boy who sat silently 4 days
- **Best quote:** "Tick-and-flick funding keep rolling in for what? Because we still got a lot of bad children on the streets."

#### MOUNT_ISA_CONTENT_ANALYSIS.md
- **Purpose:** [If exists - analysis of Mount Isa as a case study]
- **Status:** Check if created

---

### Strategic Documents
*Using the story for advocacy and funding*

#### NSW_GRANT_STRATEGIC_ANALYSIS.md
- **Purpose:** Strategic framework for using NSW Community Safety Grant
- **Contains:** Questions grant fails to address, 6 strategic opportunities
- **Use when:** Writing grant applications or critiquing government approaches
- **Key insight:** Grant is inadequate but can build infrastructure for community power

#### NSW_GRANT_APPLICATION_TOOLKIT.md
- **Purpose:** Ready-to-use language for grant applications
- **Contains:** Copy-paste responses for every section, budget model, evidence citations
- **Use when:** Actually writing a grant application
- **Key recommendation:** "Less services, more facilities and infrastructure"

#### NSW_GRANT_QUICK_START.md
- **Purpose:** Quick reference guide for NSW grant
- **Contains:** [If exists - summary of grant opportunities]
- **Status:** Check if created

---

### Platform Strategy Documents
*How content fits on JusticeHub*

#### MOUNT_ISA_PLATFORM_STRATEGY.md
- **Purpose:** Multi-layered content approach for JusticeHub
- **Contains:** Phase-by-phase implementation, how content interconnects
- **Use when:** Planning additional Mount Isa content or understanding content architecture
- **Key structure:** Program page + Profile + Story + Research + Blog (5 interconnected pieces)

---

### Publication Content
*The actual story and blog content*

#### STORY_AUNTY_CORRINE_JUSTICEHUB_DRAFT.md
- **Purpose:** Original manuscript and drafts
- **Contains:** 3,400-word story, editing notes, version history
- **Use when:** Reviewing drafts or understanding story development
- **Status:** This was the working document

#### /data/webflow-migration/articles-markdown/aunty-corrine-mount-isa-unpaid-expertise.md
- **Purpose:** ACTUAL PUBLISHED STORY FILE
- **Contains:** Complete markdown with frontmatter, ready to deploy
- **Use when:** This is the file that gets deployed to production
- **Location:** Correct path in JusticeHub file structure
- **Status:** ✅ Ready for deployment after consent

#### BLOG_DRAFT_SEO_GATEWAY.md
- **Purpose:** Shorter blog post (800-1000 words) for SEO and discoverability
- **Contains:** Economics angle, evidence summary, links to main story
- **Use when:** Want a more shareable/digestible entry point to the main story
- **SEO keywords:** community-led youth justice, Mount Isa, unpaid community work

---

### Deployment Scripts
*Database setup files*

#### deploy-all-aunty-corrine.sql ⭐ RECOMMENDED
- **Purpose:** ONE-FILE DEPLOYMENT - Creates everything at once
- **Contains:** Profile + Program + Story + Tags + All relationships
- **Use when:** First-time setup or clean deployment
- **Runs:** All setup in correct order with verification
- **Output:** Complete verification report

#### setup-aunty-corrine-story.sql
- **Purpose:** Creates just the main story article
- **Contains:** Article record, tag links, relationship links
- **Use when:** Story setup only (assumes profile/program exist or will be skipped)
- **Note:** Included in deploy-all script

#### setup-aunty-corrine-profile.sql
- **Purpose:** Creates Aunty Corrine's profile page
- **Contains:** Profile bio, expertise areas, tag links
- **Use when:** Creating profile separately
- **Note:** Included in deploy-all script

#### setup-mount-isa-program.sql
- **Purpose:** Creates Mount Isa Aunties Network program page
- **Contains:** Program description, outcomes, tag links, people links
- **Use when:** Creating program page separately
- **Note:** Included in deploy-all script

#### verify-related-content.sql
- **Purpose:** Checks what content already exists in database
- **Contains:** Verification queries, summary report
- **Use when:** Before running any setup to see what's already there
- **Output:** Report showing what exists and what needs to be created

---

### Workflow Guides
*Step-by-step implementation instructions*

#### COMPLETE_SETUP_GUIDE.md ⭐ COMPREHENSIVE
- **Purpose:** Master guide covering entire implementation process
- **Contains:** Setup order, verification steps, troubleshooting, timeline estimates
- **Use when:** First-time setup or need complete understanding
- **Sections:** 10 parts covering database, media, verification, rollback
- **Best for:** Technical implementation

#### QUICK_START_PUBLISH_AUNTY_STORY.md ⭐ FASTEST
- **Purpose:** Simplified 3-day workflow for publishing
- **Contains:** Day-by-day checklist, social media templates, media pitch
- **Use when:** Ready to publish and want streamlined process
- **Timeline:** 6-8 hours over 3 days
- **Best for:** Quick deployment

#### STORY_IMPLEMENTATION_GUIDE.md
- **Purpose:** Complete technical guide with detailed explanations
- **Contains:** File structure, database schema, media integration, CSS styling
- **Use when:** Need to understand technical architecture
- **Sections:** 10 parts covering all technical aspects
- **Best for:** Developers or detailed understanding

#### CONSENT_EMAIL_TEMPLATE.md ⭐ ESSENTIAL
- **Purpose:** Ethical consent process with Aunty Corrine
- **Contains:** Email template, consent form, follow-up templates
- **Use when:** Before publishing - ALWAYS run this first
- **Key principles:** Aunty owns story, can change/remove anytime, young people protected
- **Best for:** Ensuring ethical practice

---

### Promotion Materials
*Marketing and social media content*

#### SOCIAL_MEDIA_TEMPLATES.md ⭐ READY-TO-USE
- **Purpose:** Complete social media promotion package
- **Contains:** Twitter threads, LinkedIn posts, Instagram carousels, Facebook posts
- **Use when:** Promoting the story after publication
- **Platforms:** Twitter/X, LinkedIn, Instagram, Facebook
- **Features:** Multiple options per platform, image specs, hashtag strategy, posting schedule

---

### Summary Documents
*High-level overviews*

#### AUNTY_CORRINE_PROJECT_SUMMARY.md
- **Purpose:** Overview of all documents and how they connect
- **Contains:** Document relationships, next steps checklist
- **Use when:** First understanding the project scope
- **Status:** Earlier summary document

#### PROJECT_MASTER_INDEX.md
- **Purpose:** This document - complete file index and navigation
- **Contains:** All files organized by type with clear use cases
- **Use when:** Finding the right document for your current task

---

## Recommended Workflows

### Workflow 1: First-Time Setup (Comprehensive)

1. **Understand context**
   - Read: `AUNTY_CORRINE_INTERVIEW_ANALYSIS.md`
   - Understand: `MOUNT_ISA_PLATFORM_STRATEGY.md`

2. **Get consent**
   - Use: `CONSENT_EMAIL_TEMPLATE.md`
   - Send to Aunty Corrine for approval

3. **Set up database**
   - Check: `verify-related-content.sql`
   - Run: `deploy-all-aunty-corrine.sql`
   - Follow: `COMPLETE_SETUP_GUIDE.md`

4. **Verify files**
   - Confirm markdown exists: `/data/webflow-migration/articles-markdown/aunty-corrine-mount-isa-unpaid-expertise.md`
   - Upload images per guide

5. **Test and publish**
   - Test on staging
   - Get final approval from Aunty
   - Set `is_published = true`

6. **Promote**
   - Use: `SOCIAL_MEDIA_TEMPLATES.md`
   - Follow posting schedule

**Time estimate:** 3 weeks, ~20 hours total

---

### Workflow 2: Quick Publish (Minimum Viable)

1. **Get consent**
   - `CONSENT_EMAIL_TEMPLATE.md`

2. **Deploy**
   - `deploy-all-aunty-corrine.sql` (one file, 15 minutes)

3. **Upload minimum images**
   - Featured image only

4. **Test**
   - Quick staging review

5. **Publish**
   - Set `is_published = true`

6. **Promote**
   - Pick 2-3 templates from `SOCIAL_MEDIA_TEMPLATES.md`

**Time estimate:** 3 days, 6-8 hours total

---

### Workflow 3: Grant Application Focus

1. **Review evidence**
   - Read: `AUNTY_CORRINE_INTERVIEW_ANALYSIS.md`
   - Extract case studies and quotes

2. **Use toolkit**
   - Apply: `NSW_GRANT_APPLICATION_TOOLKIT.md`
   - Copy-paste relevant sections

3. **Add story as evidence**
   - Reference published story URL
   - Use specific case studies (Steven, 25 MBBs, etc.)

4. **Strategic positioning**
   - Review: `NSW_GRANT_STRATEGIC_ANALYSIS.md`
   - Position community infrastructure vs services

**Time estimate:** 2 days, 8-10 hours for strong application

---

## File Relationships Map

```
ANALYSIS
│
├── MOUNT_ISA_AUNTIES_ANALYSIS.md
│   └── Initial themes and quotes
│
└── AUNTY_CORRINE_INTERVIEW_ANALYSIS.md ⭐ PRIMARY SOURCE
    ├── Case studies
    ├── Systems failures
    └── Evidence
        │
        ├──→ STRATEGY
        │    ├── NSW_GRANT_STRATEGIC_ANALYSIS.md
        │    └── NSW_GRANT_APPLICATION_TOOLKIT.md
        │
        ├──→ PLATFORM STRATEGY
        │    └── MOUNT_ISA_PLATFORM_STRATEGY.md
        │
        └──→ CONTENT
             ├── STORY_AUNTY_CORRINE_JUSTICEHUB_DRAFT.md
             │   └──→ /data/.../aunty-corrine-mount-isa-unpaid-expertise.md ⭐ PUBLISHED FILE
             │
             └── BLOG_DRAFT_SEO_GATEWAY.md
                 └──→ SEO entry point to main story
│
IMPLEMENTATION
│
├── verify-related-content.sql (Run first)
│   └──→ Shows what exists
│        │
│        ├──→ deploy-all-aunty-corrine.sql ⭐ ONE-FILE DEPLOYMENT
│        │    ├── Creates profile
│        │    ├── Creates program
│        │    ├── Creates story
│        │    └── Links everything
│        │
│        └──→ Individual scripts (if needed)
│             ├── setup-aunty-corrine-profile.sql
│             ├── setup-mount-isa-program.sql
│             └── setup-aunty-corrine-story.sql
│
GUIDES
│
├── CONSENT_EMAIL_TEMPLATE.md ⭐ RUN FIRST
├── QUICK_START_PUBLISH_AUNTY_STORY.md ⭐ FAST TRACK
├── COMPLETE_SETUP_GUIDE.md ⭐ COMPREHENSIVE
└── STORY_IMPLEMENTATION_GUIDE.md (Technical details)
│
PROMOTION
│
└── SOCIAL_MEDIA_TEMPLATES.md ⭐ READY-TO-USE
    ├── Twitter threads
    ├── LinkedIn posts
    ├── Instagram content
    └── Facebook posts
```

---

## Key Files by Role

### For Project Managers
1. `PROJECT_MASTER_INDEX.md` (this file)
2. `QUICK_START_PUBLISH_AUNTY_STORY.md`
3. `CONSENT_EMAIL_TEMPLATE.md`

### For Developers
1. `deploy-all-aunty-corrine.sql`
2. `COMPLETE_SETUP_GUIDE.md`
3. `STORY_IMPLEMENTATION_GUIDE.md`

### For Content/Comms Team
1. `SOCIAL_MEDIA_TEMPLATES.md`
2. `BLOG_DRAFT_SEO_GATEWAY.md`
3. `/data/.../aunty-corrine-mount-isa-unpaid-expertise.md`

### For Grant Writers
1. `NSW_GRANT_APPLICATION_TOOLKIT.md`
2. `AUNTY_CORRINE_INTERVIEW_ANALYSIS.md`
3. `NSW_GRANT_STRATEGIC_ANALYSIS.md`

### For Researchers
1. `AUNTY_CORRINE_INTERVIEW_ANALYSIS.md`
2. `MOUNT_ISA_AUNTIES_ANALYSIS.md`
3. Published story as case study

---

## Success Metrics

### Database Setup Success
- [ ] Profile exists at `/people/aunty-corrine`
- [ ] Program exists at `/programs/mount-isa-aunties-network`
- [ ] Story exists at `/stories/aunty-corrine-mount-isa-unpaid-expertise`
- [ ] All 8 tags linked
- [ ] All relationships connected

### Content Success
- [ ] Markdown file deployed correctly
- [ ] Featured image displays
- [ ] All links work
- [ ] Mobile view works
- [ ] Reading time accurate

### Promotion Success
- [ ] Shared on all platforms
- [ ] 500+ story URL clicks
- [ ] 50+ shares/retweets
- [ ] Meaningful engagement from policy professionals
- [ ] Media pickup

### Strategic Success
- [ ] Used in grant application
- [ ] Referenced in policy discussions
- [ ] Shared by community organizations
- [ ] Cited as evidence for community-led approaches

---

## Troubleshooting Index

**Problem:** Can't find the right file
**Solution:** Use "I Need To..." section above or search this index

**Problem:** Don't know where to start
**Solution:** Start with `QUICK_START_PUBLISH_AUNTY_STORY.md`

**Problem:** Database setup failing
**Solution:** Run `verify-related-content.sql` first, then check `COMPLETE_SETUP_GUIDE.md` troubleshooting section

**Problem:** Need specific quotes or evidence
**Solution:** Search `AUNTY_CORRINE_INTERVIEW_ANALYSIS.md` for case studies

**Problem:** Don't understand technical setup
**Solution:** Read `STORY_IMPLEMENTATION_GUIDE.md` for detailed explanations

**Problem:** Need to promote but don't have time
**Solution:** Use `SOCIAL_MEDIA_TEMPLATES.md` - just copy-paste

**Problem:** Forgot to get consent
**Solution:** STOP. Use `CONSENT_EMAIL_TEMPLATE.md` before publishing anything

---

## Next Steps Checklist

### Immediate (Today)
- [ ] Review this master index
- [ ] Identify which workflow you're following
- [ ] Read relevant guide (Quick Start or Complete Setup)

### This Week
- [ ] Send consent email to Aunty Corrine
- [ ] Run `verify-related-content.sql`
- [ ] Run `deploy-all-aunty-corrine.sql`
- [ ] Upload featured image

### Before Launch
- [ ] Get Aunty's approval
- [ ] Test on staging
- [ ] Prepare social media content
- [ ] Set `is_published = true`

### After Launch
- [ ] Post on all social platforms
- [ ] Monitor engagement
- [ ] Respond to comments
- [ ] Track metrics

---

## Document Status

| File | Status | Last Updated | Next Review |
|------|--------|--------------|-------------|
| Analysis documents | ✅ Complete | 2025-01 | N/A |
| Strategy documents | ✅ Complete | 2025-01 | N/A |
| Published markdown | ✅ Ready | 2025-01 | After consent |
| SQL scripts | ✅ Ready | 2025-01 | N/A |
| Workflow guides | ✅ Complete | 2025-01 | N/A |
| Social templates | ✅ Ready | 2025-01 | After publish |
| Blog draft | ✅ Ready | 2025-01 | Optional |

---

## Questions?

**Can't find a document?**
→ Use Ctrl/Cmd+F to search this index

**Don't know which workflow to use?**
→ Use Quick Start for fast publish, Complete Setup for thorough understanding

**Need help with implementation?**
→ Start with `COMPLETE_SETUP_GUIDE.md` troubleshooting section

**Want to understand the story context?**
→ Read `AUNTY_CORRINE_INTERVIEW_ANALYSIS.md`

**Ready to publish?**
→ Follow `QUICK_START_PUBLISH_AUNTY_STORY.md`

---

**You have everything you need.** Use this index to navigate to the right document for each task, and follow the recommended workflows to get Aunty Corrine's story published successfully.
