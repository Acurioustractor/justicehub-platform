# Aunty Corrine Story Project - README

## What This Is

A complete package for publishing Aunty Corrine's story on JusticeHub: **"I Need Voices Behind Me": Aunty Corrine's 20 Years of Unpaid Justice Work**

**The Story in Brief:**
In Mount Isa, Queensland, Aunty Corrine has supported 25 young people through the justice system over 20 years—unpaid, 24/7, using knowledge no qualification can teach. While services with millions in funding deliver "tick-and-flick" approaches, she's the one answering calls at 2am, sitting in Cleveland Detention for hours, doing the actual work of keeping communities safe.

This project transforms her story into publication-ready content for JusticeHub, complete with database setup, social media promotion, and strategic advocacy tools.

---

## What's Included

**17 documents** organized into:
- **Analysis** - Interview analysis and case studies
- **Strategy** - Grant applications and advocacy frameworks
- **Content** - Publication-ready story and blog post
- **Implementation** - SQL scripts and setup guides
- **Promotion** - Social media templates and launch plans

**Total project work:** Analysis → Strategy → Content → Implementation → Promotion

---

## Start Here

### New to the Project?
**Read:** [PROJECT_MASTER_INDEX.md](PROJECT_MASTER_INDEX.md)
- Complete file directory
- "I Need To..." quick navigation
- Recommended workflows
- File relationships map

### Ready to Publish?
**Use:** [QUICK_START_PUBLISH_AUNTY_STORY.md](QUICK_START_PUBLISH_AUNTY_STORY.md)
- 3-day workflow
- 6-8 hours total
- Day-by-day checklist
- Fastest path to publication

### Want Complete Understanding?
**Read:** [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md)
- Comprehensive technical guide
- 10-part implementation
- Troubleshooting section
- Full timeline (3 weeks)

### On Launch Day?
**Print:** [LAUNCH_DAY_CHECKLIST.md](LAUNCH_DAY_CHECKLIST.md)
- Hour-by-hour checklist
- Pre-launch verification
- Social media schedule
- Emergency contacts

---

## Quick Start (5 Steps)

### 1. Get Consent (ESSENTIAL - Do This First)
**File:** [CONSENT_EMAIL_TEMPLATE.md](CONSENT_EMAIL_TEMPLATE.md)
- Email template ready to send
- Consent form included
- Follow-up templates
- Ethical principles explained

**Why:** Aunty owns this story. Nothing publishes without her approval.

### 2. Set Up Database (15 Minutes)
**File:** [deploy-all-aunty-corrine.sql](deploy-all-aunty-corrine.sql)
- Copy entire file
- Paste into Supabase SQL Editor
- Click "Run"
- Verification report displays

**What it creates:**
- Story article
- Aunty Corrine profile
- Mount Isa Aunties Network program
- 8 tags
- All relationships between content

### 3. Upload Image (5 Minutes)
**Required:**
- Upload featured image to: `/public/images/articles/aunty-corrine/featured-portrait.jpg`
- Dimensions: 1200x800px minimum
- Alt text: "Aunty Corrine sitting in her living room in Mount Isa, Queensland"

**Optional:**
- Profile image: `/public/images/profiles/aunty-corrine/profile.jpg`
- Program image: `/public/images/programs/mount-isa-aunties/network.jpg`

### 4. Test on Staging (15 Minutes)
**URL:** `staging.justicehub.au/stories/aunty-corrine-mount-isa-unpaid-expertise`

**Check:**
- ✓ Story loads
- ✓ Images display
- ✓ Links work (profile, program, tags, related articles)
- ✓ Mobile view works
- ✓ Reading time shows (14 minutes)

### 5. Publish & Promote (2 Hours)

**Publish:**
```sql
UPDATE articles
SET is_published = true
WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise';
```

**Promote:**
Use [SOCIAL_MEDIA_TEMPLATES.md](SOCIAL_MEDIA_TEMPLATES.md)
- Twitter thread (copy-paste ready)
- LinkedIn post (copy-paste ready)
- Instagram carousel (5-7 slides specified)
- Facebook post (copy-paste ready)

**Done!** Story is live at: `justicehub.au/stories/aunty-corrine-mount-isa-unpaid-expertise`

---

## Documents by Purpose

### Need Evidence & Quotes?
→ [AUNTY_CORRINE_INTERVIEW_ANALYSIS.md](AUNTY_CORRINE_INTERVIEW_ANALYSIS.md)
- 10 detailed case studies
- 10 documented systems failures
- Community-led model evidence
- All organized by theme with line-level quotes

### Writing a Grant Application?
→ [NSW_GRANT_APPLICATION_TOOLKIT.md](NSW_GRANT_APPLICATION_TOOLKIT.md)
- Copy-paste responses for every section
- Budget model included
- Evidence citations ready
- Strategic positioning framework

### Need to Understand Platform Strategy?
→ [MOUNT_ISA_PLATFORM_STRATEGY.md](MOUNT_ISA_PLATFORM_STRATEGY.md)
- Multi-layered content approach
- How profile + program + story + blog interconnect
- Phase-by-phase implementation
- SEO and discoverability strategy

### Want a Shorter Blog Post?
→ [BLOG_DRAFT_SEO_GATEWAY.md](BLOG_DRAFT_SEO_GATEWAY.md)
- 800-1000 words (vs. 3,400-word main story)
- SEO optimized
- Economics angle
- Links to main story

### Need Technical Details?
→ [STORY_IMPLEMENTATION_GUIDE.md](STORY_IMPLEMENTATION_GUIDE.md)
- Database schema explained
- File structure detailed
- Media integration guide
- CSS styling notes

---

## Key Files (Star = Most Important)

| File | Purpose | Time Required |
|------|---------|---------------|
| ⭐ PROJECT_MASTER_INDEX.md | Navigate all files | 10 min read |
| ⭐ QUICK_START_PUBLISH_AUNTY_STORY.md | Fast track to publish | 6-8 hours |
| ⭐ deploy-all-aunty-corrine.sql | One-file database setup | 15 minutes |
| ⭐ CONSENT_EMAIL_TEMPLATE.md | Get Aunty's approval | 30 min + wait |
| ⭐ SOCIAL_MEDIA_TEMPLATES.md | Promote the story | 2 hours |
| ⭐ LAUNCH_DAY_CHECKLIST.md | Launch day reference | Print & use |
| COMPLETE_SETUP_GUIDE.md | Comprehensive guide | 2 hours read |
| AUNTY_CORRINE_INTERVIEW_ANALYSIS.md | Evidence & quotes | Reference |
| NSW_GRANT_APPLICATION_TOOLKIT.md | Grant writing | 8-10 hours |
| STORY_IMPLEMENTATION_GUIDE.md | Technical details | Reference |

---

## Timeline Options

### Option 1: Quick Publish (3 Days)
**Day 1:** Get consent, run SQL script, upload image (3 hours)
**Day 2:** Test on staging, get final approval (2 hours)
**Day 3:** Publish, post on social media (2 hours)

**Total:** 6-8 hours over 3 days

**Use:** [QUICK_START_PUBLISH_AUNTY_STORY.md](QUICK_START_PUBLISH_AUNTY_STORY.md)

### Option 2: Comprehensive Setup (3 Weeks)
**Week 1:** Get consent, gather media, setup database
**Week 2:** Create additional content, test extensively
**Week 3:** Publish, promote, media outreach

**Total:** ~20 hours over 3 weeks

**Use:** [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md)

### Option 3: Grant Application Focus (2 Days)
**Day 1:** Review evidence, extract case studies (4 hours)
**Day 2:** Write application using toolkit (4-6 hours)

**Total:** 8-10 hours

**Use:** [NSW_GRANT_APPLICATION_TOOLKIT.md](NSW_GRANT_APPLICATION_TOOLKIT.md)

---

## The Story

### Title
"I Need Voices Behind Me": Aunty Corrine's 20 Years of Unpaid Justice Work

### Stats
- **Word count:** 3,400
- **Reading time:** 14 minutes
- **Category:** Roots (Elder knowledge)
- **Location:** Mount Isa, Queensland
- **People supported:** 25 young people over 20 years
- **Funding received:** $0

### Key Quotes

> "I've had 25 MBBs go through my house. Most have gone back to their families. Most are doing pretty good."
>
> MBBs = "Misunderstood Black Boys"

> "Tick-and-flick funding keep rolling in for what? Because we still got a lot of bad children on the streets."

> "I need voices behind me. Not just funding. Voices."

### Case Studies Included
1. Steven - Cleveland to independence
2. The 25 MBBs - 20 years of support
3. Boy who sat silently - "I'm not allowed to say my name to white people"
4. Night drives to Cleveland - 2am crisis calls
5. Housing young people - when families struggle
6. Systems that don't talk - navigating fragmented services

### Evidence Presented
- Most young people now independent and stable
- Strong family and community connections maintained
- Youth diverted from long-term detention
- 24/7 crisis intervention provided
- Success from relationships, not programs

---

## URLs Created

After setup, these pages will exist:

**Main Story:**
`justicehub.au/stories/aunty-corrine-mount-isa-unpaid-expertise`

**Profile Page:**
`justicehub.au/people/aunty-corrine`

**Program Page:**
`justicehub.au/programs/mount-isa-aunties-network`

**Staging URLs:**
Same as above but `staging.justicehub.au`

---

## How Content Interconnects

```
PROFILE (Aunty Corrine)
    ↓ Featured in
STORY (Main article)
    ↓ About
PROGRAM (Mount Isa Aunties Network)
    ↓ Connected to
TAGS (8 themes)
    ↓ Links to
RELATED ARTICLES (NSW Youth Koori Court, Bourke Maranguka, QLD Crisis)
```

**Result:** Rich knowledge web where everything links to everything else

---

## Tags Applied

1. **Elder-knowledge** - Stories from Elders
2. **Community-led** - Community-controlled initiatives
3. **Youth-justice** - Youth justice system
4. **Mount-Isa** - Mount Isa stories
5. **Indigenous-leadership** - Indigenous leadership
6. **Unpaid-labor** - Undervalued community work
7. **Systems-critique** - Critical analysis of systems
8. **Queensland** - Queensland-based content

---

## Success Metrics

### Immediate (Day 1)
- [ ] Story published and live
- [ ] Aunty Corrine notified and happy
- [ ] Social media posted
- [ ] 500+ page views

### Short-term (Week 1)
- [ ] 2,000+ page views
- [ ] 2+ media mentions
- [ ] 20+ social shares
- [ ] Policy professionals engaged

### Medium-term (Month 1)
- [ ] 5,000+ page views
- [ ] Used in 3+ grant applications
- [ ] Cited in policy discussions
- [ ] Positive community feedback

### Long-term Impact
- [ ] Referenced in research
- [ ] Used in education/training
- [ ] Influences policy change
- [ ] Strengthens community voice

---

## Important Principles

### 1. Aunty Owns This Story
- She can request changes anytime
- She can request removal anytime
- Get consent before any use
- Respect her authority

### 2. Young People Protected
- No identifying information
- Privacy prioritized
- Stories told with dignity
- Consent required for any photos

### 3. Community Voice First
- Aunty's words, not interpretation
- 40% quotes, 60% narrative
- Community expertise centered
- Systems critique grounded in evidence

### 4. Strategic Purpose
- Not just storytelling - advocacy
- Build case for structural change
- Provide evidence for community-led
- Support grant applications

---

## Troubleshooting

### "I don't know where to start"
→ Read [QUICK_START_PUBLISH_AUNTY_STORY.md](QUICK_START_PUBLISH_AUNTY_STORY.md)

### "Database setup is failing"
→ Check [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md) troubleshooting section

### "Need specific quotes"
→ Search [AUNTY_CORRINE_INTERVIEW_ANALYSIS.md](AUNTY_CORRINE_INTERVIEW_ANALYSIS.md)

### "Don't have time to read everything"
→ Use [PROJECT_MASTER_INDEX.md](PROJECT_MASTER_INDEX.md) "I Need To..." section

### "Forgot to get consent"
→ STOP. Use [CONSENT_EMAIL_TEMPLATE.md](CONSENT_EMAIL_TEMPLATE.md) NOW

### "Images not showing"
→ Verify exact file paths match SQL script

### "Story appears empty"
→ Check markdown file exists at: `/data/webflow-migration/articles-markdown/aunty-corrine-mount-isa-unpaid-expertise.md`

---

## Project Credits

**Primary Source:**
Extended interview with Aunty Corrine (DJI video file)

**Analysis:**
Deep case study analysis identifying 10 case studies and systems failures

**Content Development:**
Literary journalism style following JusticeHub guidelines

**Technical Implementation:**
Complete database setup and file structure

**Promotion Strategy:**
Multi-platform social media and media outreach

---

## Next Steps

### Right Now
1. Read [PROJECT_MASTER_INDEX.md](PROJECT_MASTER_INDEX.md)
2. Decide on timeline (Quick/Comprehensive/Grant-focused)
3. Start with [CONSENT_EMAIL_TEMPLATE.md](CONSENT_EMAIL_TEMPLATE.md)

### This Week
4. Run [deploy-all-aunty-corrine.sql](deploy-all-aunty-corrine.sql)
5. Upload featured image
6. Test on staging

### Before Launch
7. Get Aunty's final approval
8. Prepare social content from [SOCIAL_MEDIA_TEMPLATES.md](SOCIAL_MEDIA_TEMPLATES.md)
9. Print [LAUNCH_DAY_CHECKLIST.md](LAUNCH_DAY_CHECKLIST.md)

### On Launch Day
10. Follow checklist
11. Publish & promote
12. Monitor & engage

---

## Questions?

**About the story:** Read [AUNTY_CORRINE_INTERVIEW_ANALYSIS.md](AUNTY_CORRINE_INTERVIEW_ANALYSIS.md)

**About implementation:** Read [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md)

**About promotion:** Read [SOCIAL_MEDIA_TEMPLATES.md](SOCIAL_MEDIA_TEMPLATES.md)

**About grants:** Read [NSW_GRANT_APPLICATION_TOOLKIT.md](NSW_GRANT_APPLICATION_TOOLKIT.md)

**About anything:** Check [PROJECT_MASTER_INDEX.md](PROJECT_MASTER_INDEX.md) first

---

## License & Usage

**Story ownership:** Aunty Corrine
**Implementation:** JusticeHub
**Usage:** With consent and attribution
**Changes:** Require Aunty's approval

---

**Everything you need is here.** Follow the guides, respect the principles, center community voice, and publish something powerful.

Good luck! 🎉
