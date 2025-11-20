# Complete Setup Guide - Aunty Corrine Story Package

## Overview

This guide walks through setting up the complete interconnected content for Aunty Corrine's story on JusticeHub. The setup creates:

1. **Profile page** - Aunty Corrine's bio and expertise (`/people/aunty-corrine`)
2. **Program page** - Mount Isa Aunties Network (`/programs/mount-isa-aunties-network`)
3. **Story article** - Main long-form piece (`/stories/aunty-corrine-mount-isa-unpaid-expertise`)

These pages auto-link to each other, creating a rich knowledge web.

---

## Files Created

### Analysis & Research
- `MOUNT_ISA_AUNTIES_ANALYSIS.md` - Initial analysis of Aunties conversation
- `AUNTY_CORRINE_INTERVIEW_ANALYSIS.md` - Deep analysis with case studies
- `NSW_GRANT_STRATEGIC_ANALYSIS.md` - Strategic framework for grants
- `NSW_GRANT_APPLICATION_TOOLKIT.md` - Ready-to-use grant language
- `MOUNT_ISA_PLATFORM_STRATEGY.md` - Multi-layer content approach

### Publication Content
- `STORY_AUNTY_CORRINE_JUSTICEHUB_DRAFT.md` - Story manuscript
- `/data/webflow-migration/articles-markdown/aunty-corrine-mount-isa-unpaid-expertise.md` - Deployed markdown file

### Implementation Files
- `setup-aunty-corrine-profile.sql` - Creates profile page
- `setup-mount-isa-program.sql` - Creates program page
- `setup-aunty-corrine-story.sql` - Creates story article
- `verify-related-content.sql` - Checks what exists

### Workflow Guides
- `STORY_IMPLEMENTATION_GUIDE.md` - Complete technical guide
- `QUICK_START_PUBLISH_AUNTY_STORY.md` - 3-day workflow
- `CONSENT_EMAIL_TEMPLATE.md` - Ethical consent process
- `COMPLETE_SETUP_GUIDE.md` - This file

---

## Setup Order (Recommended)

### Step 1: Verify What Exists

Run this first to see what's already in the database:

```bash
# Copy verify-related-content.sql
# Paste into Supabase SQL Editor
# Run query
```

**What it checks:**
- Aunty Corrine profile
- Mount Isa programs
- Related articles (NSW Youth Koori Court, etc.)
- Required tags

**Output:** Summary showing what exists and what needs to be created.

---

### Step 2: Create Foundation Content (Optional)

Only run these if the verification script shows they're missing.

#### 2a. Create Aunty Corrine Profile

```bash
# Copy setup-aunty-corrine-profile.sql
# Paste into Supabase SQL Editor
# Run query
```

**What it creates:**
- Profile at `/people/aunty-corrine`
- Role: "Community Elder & Youth Justice Advocate"
- Bio with 20 years of experience
- Expertise areas (6 listed)
- Links to tags

**Media needed:**
- `/public/images/profiles/aunty-corrine/profile.jpg`

---

#### 2b. Create Mount Isa Aunties Program

```bash
# Copy setup-mount-isa-program.sql
# Paste into Supabase SQL Editor
# Run query
```

**What it creates:**
- Program page at `/programs/mount-isa-aunties-network`
- Status: "active" but "unfunded"
- Description of informal network
- Impact outcomes (25 young people, 20 years)
- Links to tags and Aunty Corrine profile

**Media needed:**
- `/public/images/programs/mount-isa-aunties/network.jpg`

---

### Step 3: Create Main Story Article

This is the centerpiece. Run this after creating profile and program (or they'll be skipped).

```bash
# Copy setup-aunty-corrine-story.sql
# Paste into Supabase SQL Editor
# Run query
```

**What it creates:**
- Article at `/stories/aunty-corrine-mount-isa-unpaid-expertise`
- Category: "roots" (Elder knowledge)
- 8 tags
- Links to Aunty Corrine profile (if exists)
- Links to Mount Isa program (if exists)
- Links to related articles (if they exist)
- Initially **unpublished** (`is_published: false`)

**Media needed:**
- `/public/images/articles/aunty-corrine/featured-portrait.jpg`
- Additional inline images (optional)

**Content file:**
- `/data/webflow-migration/articles-markdown/aunty-corrine-mount-isa-unpaid-expertise.md` (already created)

---

## How Content Interconnects

```
┌─────────────────────────────────────────────────────────┐
│                    PROFILE PAGE                         │
│         /people/aunty-corrine                           │
│                                                         │
│  - Bio and expertise                                    │
│  - Shows all articles featuring her ────────┐          │
│  - Shows all programs she's part of ───┐    │          │
└───────────────┬─────────────────────────┼────┼──────────┘
                │                         │    │
                │                         ▼    ▼
                │              ┌──────────────────────────┐
                │              │    PROGRAM PAGE          │
                └──────────────│  /programs/mount-isa-    │
                               │   aunties-network        │
                               │                          │
                               │  - Description           │
                               │  - Shows all people ◄────┤
                               │  - Shows all articles ───┼───┐
                               └────────┬─────────────────┘   │
                                        │                     │
                                        ▼                     ▼
                              ┌──────────────────────────────────┐
                              │         STORY ARTICLE            │
                              │  /stories/aunty-corrine-mount-   │
                              │   isa-unpaid-expertise           │
                              │                                  │
                              │  - 3,400 word story              │
                              │  - Links to profile ─────────────┤
                              │  - Links to program ─────────────┤
                              │  - Links to related articles     │
                              │  - Tagged with 8 themes          │
                              └──────────────────────────────────┘
```

**Navigation paths created:**

1. **From Profile** → Shows all articles → Story appears
2. **From Program** → Shows all articles → Story appears
3. **From Story** → "Related People" → Profile appears
4. **From Story** → "Related Programs" → Program appears
5. **From Tags** → All content with that tag → Everything appears
6. **From Story** → "Related Articles" → Other justice stories

---

## Database Tables Populated

### Tables Updated

```sql
-- Core content
articles                 -- Main story record
public_profiles         -- Aunty Corrine profile
community_programs      -- Mount Isa Aunties program
tags                    -- 8 thematic tags

-- Relationships (auto-linking)
article_tags            -- Story ↔ Tags
article_people          -- Story ↔ Profile
article_programs        -- Story ↔ Program
article_relations       -- Story ↔ Related articles
program_tags            -- Program ↔ Tags
program_people          -- Program ↔ Profile
profile_tags            -- Profile ↔ Tags
```

---

## Verification Queries

After running all setup scripts, verify everything worked:

```sql
-- Check main story
SELECT
  a.title,
  a.slug,
  a.category,
  a.is_published,
  (SELECT COUNT(*) FROM article_tags WHERE article_id = a.id) as tags,
  (SELECT COUNT(*) FROM article_people WHERE article_id = a.id) as people,
  (SELECT COUNT(*) FROM article_programs WHERE article_id = a.id) as programs
FROM articles a
WHERE a.slug = 'aunty-corrine-mount-isa-unpaid-expertise';

-- Expected output:
-- tags: 8
-- people: 1 (if profile exists)
-- programs: 1 (if program exists)
```

---

## Media Checklist

### Required Images

- [ ] `/public/images/articles/aunty-corrine/featured-portrait.jpg`
  - Aunty Corrine portrait for story featured image
  - Dimensions: 1200x800px recommended
  - Alt text: "Aunty Corrine sitting in her living room in Mount Isa, Queensland"

### Optional Images (Profile)

- [ ] `/public/images/profiles/aunty-corrine/profile.jpg`
  - Profile page featured image
  - Dimensions: 800x800px recommended

### Optional Images (Program)

- [ ] `/public/images/programs/mount-isa-aunties/network.jpg`
  - Program page featured image
  - Dimensions: 1200x800px recommended

### Optional Inline Images (Story)

- [ ] `/public/images/articles/aunty-corrine/mount-isa-landscape.jpg`
- [ ] `/public/images/articles/aunty-corrine/cleveland-detention.jpg`
- [ ] `/public/images/articles/aunty-corrine/community-gathering.jpg`

### Video Clips (Optional)

- [ ] Upload to YouTube/Vimeo
- [ ] Add embed codes to markdown file
- [ ] Interview clips showing Aunty speaking directly

---

## Publication Workflow

### Before Publishing

1. **Get Consent**
   - Use `CONSENT_EMAIL_TEMPLATE.md`
   - Send story to Aunty Corrine for approval
   - Get written consent for photos/quotes

2. **Upload Media**
   - Add all images to `/public/images/` directories
   - Verify paths match SQL scripts

3. **Test on Staging**
   - Deploy to staging.justicehub.au
   - Visit: `/stories/aunty-corrine-mount-isa-unpaid-expertise`
   - Check all links work
   - Verify images display
   - Test mobile/tablet views

### Publishing

```sql
-- When ready, set to published
UPDATE articles
SET is_published = true, updated_at = NOW()
WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise';

-- Optional: Publish profile and program too
UPDATE public_profiles
SET is_public = true
WHERE slug = 'aunty-corrine';

UPDATE community_programs
SET is_published = true
WHERE slug = 'mount-isa-aunties-network';
```

### After Publishing

4. **Promote**
   - Social media posts (templates in QUICK_START guide)
   - Newsletter feature
   - Media outreach (template in QUICK_START guide)
   - Share with NSW grant contacts

---

## Rollback (If Needed)

If something goes wrong, each SQL script has a rollback section at the bottom:

```sql
-- Delete story
DELETE FROM article_relations WHERE article_id IN (
  SELECT id FROM articles WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise'
);
DELETE FROM article_programs WHERE article_id IN (
  SELECT id FROM articles WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise'
);
DELETE FROM article_people WHERE article_id IN (
  SELECT id FROM articles WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise'
);
DELETE FROM article_tags WHERE article_id IN (
  SELECT id FROM articles WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise'
);
DELETE FROM articles WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise';

-- Delete profile
DELETE FROM profile_tags WHERE profile_id IN (
  SELECT id FROM public_profiles WHERE slug = 'aunty-corrine'
);
DELETE FROM public_profiles WHERE slug = 'aunty-corrine';

-- Delete program
DELETE FROM program_tags WHERE program_id IN (
  SELECT id FROM community_programs WHERE slug = 'mount-isa-aunties-network'
);
DELETE FROM program_people WHERE program_id IN (
  SELECT id FROM community_programs WHERE slug = 'mount-isa-aunties-network'
);
DELETE FROM community_programs WHERE slug = 'mount-isa-aunties-network';
```

---

## Troubleshooting

### "Profile not found"

**Problem:** Story setup script can't find Aunty Corrine profile
**Solution:** Run `setup-aunty-corrine-profile.sql` first

### "Program not found"

**Problem:** Story setup script can't find Mount Isa program
**Solution:** Run `setup-mount-isa-program.sql` first

### "Tags missing"

**Problem:** Some tags don't exist
**Solution:** Story setup script creates them automatically - no action needed

### "Images not displaying"

**Problem:** Broken image links on website
**Solution:** Verify image files uploaded to exact paths in SQL scripts

### "Story appears empty"

**Problem:** Markdown file not loading
**Solution:** Verify markdown file exists at:
`/data/webflow-migration/articles-markdown/aunty-corrine-mount-isa-unpaid-expertise.md`

---

## Timeline Estimate

### Quick Setup (Minimum)
- **Run SQL scripts:** 15 minutes
- **Upload 1 featured image:** 10 minutes
- **Test on staging:** 15 minutes
- **Total:** 40 minutes

### Complete Setup (Recommended)
- **Day 1:** Run all SQL scripts, upload basic images (2 hours)
- **Day 2:** Add inline images, test thoroughly (2 hours)
- **Day 3:** Get consent, final review, publish (2 hours)
- **Total:** 6 hours over 3 days

### Full Package (Ideal)
- **Week 1:** Get consent, gather media, setup database
- **Week 2:** Create video clips, test extensively
- **Week 3:** Publish, promote, media outreach
- **Total:** ~20 hours over 3 weeks

---

## Next Steps

### Immediate (Today)
1. Run `verify-related-content.sql` to see what exists
2. Run any missing foundation scripts (profile, program)
3. Run `setup-aunty-corrine-story.sql` to create main article

### This Week
4. Send consent email using template
5. Upload featured image
6. Test on staging

### Before Launch
7. Get Aunty's approval
8. Final review of all content
9. Set `is_published = true`
10. Promote across channels

---

## Support Files

All these documents support different aspects of the workflow:

- **For consent:** `CONSENT_EMAIL_TEMPLATE.md`
- **For quick launch:** `QUICK_START_PUBLISH_AUNTY_STORY.md`
- **For technical details:** `STORY_IMPLEMENTATION_GUIDE.md`
- **For grant applications:** `NSW_GRANT_APPLICATION_TOOLKIT.md`
- **For understanding content:** `AUNTY_CORRINE_INTERVIEW_ANALYSIS.md`

---

## Success Criteria

You'll know the setup worked when:

- [ ] Story appears at `/stories/aunty-corrine-mount-isa-unpaid-expertise`
- [ ] Profile appears at `/people/aunty-corrine`
- [ ] Program appears at `/programs/mount-isa-aunties-network`
- [ ] Story shows "Related People: Aunty Corrine"
- [ ] Story shows "Related Programs: Mount Isa Aunties Network"
- [ ] Story has 8 tags
- [ ] Profile shows story in "Articles featuring this person"
- [ ] Program shows story in "Articles about this program"
- [ ] All images display correctly
- [ ] Mobile view works properly

---

## Questions?

If anything isn't clear:
1. Check `STORY_IMPLEMENTATION_GUIDE.md` for technical details
2. Check `QUICK_START_PUBLISH_AUNTY_STORY.md` for workflow
3. Run verification script to diagnose issues
4. Check SQL script comments for explanations

---

**You're ready to go!** Start with `verify-related-content.sql` and work through the steps above.
