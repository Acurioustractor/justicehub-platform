# Quick Start: Publish Aunty Corrine's Story
## Simplified 3-Day Implementation

---

## ✅ **CHECKLIST: What You Need Before Starting**

### **Day 0: Prerequisites**
- [ ] Aunty Corrine's consent (use [CONSENT_EMAIL_TEMPLATE.md](CONSENT_EMAIL_TEMPLATE.md))
- [ ] At least 1 photo (Aunty's portrait for featured image)
- [ ] Story reviewed and approved
- [ ] Database access (Supabase)
- [ ] Code repository access

---

## 📅 **DAY 1: Setup Database & Files** (2-3 hours)

### **Step 1: Upload Featured Image** (15 min)

```bash
# Create directory
mkdir -p public/images/articles/aunty-corrine

# Copy your photo (replace with actual file)
cp /path/to/aunty-portrait.jpg public/images/articles/aunty-corrine/featured-portrait.jpg

# Optimize if needed (use ImageOptim, TinyPNG, or command line)
# Target: 1200px wide, <500KB
```

---

### **Step 2: Create Database Record** (15 min)

**Open Supabase SQL Editor and run:**

```sql
-- Insert article
INSERT INTO articles (
  id,
  title,
  slug,
  excerpt,
  category,
  author,
  author_role,
  published_date,
  featured_image,
  featured_image_alt,
  location,
  reading_time,
  is_published,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '"I Need Voices Behind Me": Aunty Corrine''s 20 Years of Unpaid Justice Work',
  'aunty-corrine-mount-isa-unpaid-expertise',
  'In Mount Isa, while services with millions compete over "tick-and-flick funding," Aunty Corrine has supported 25 young people through the justice system—unpaid, 24/7, for two decades. This is what community-led actually looks like.',
  'roots',
  'JusticeHub Team',
  'Community Documentation',
  '2025-01-15',
  '/images/articles/aunty-corrine/featured-portrait.jpg',
  'Aunty Corrine sitting in her living room in Mount Isa, Queensland, where she has supported 25 young people over 20 years',
  'Mount Isa, Queensland',
  14,
  false, -- Set to true when ready to publish
  NOW(),
  NOW()
);

-- Verify it was created
SELECT id, title, slug FROM articles WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise';
```

**Copy the `id` from the result - you'll need it for next steps.**

---

### **Step 3: Add Tags** (10 min)

```sql
-- First, ensure tags exist (safe to run multiple times)
INSERT INTO tags (name, slug) VALUES
  ('Elder-knowledge', 'elder-knowledge'),
  ('Community-led', 'community-led'),
  ('Youth-justice', 'youth-justice'),
  ('Mount-Isa', 'mount-isa'),
  ('Indigenous-leadership', 'indigenous-leadership'),
  ('Unpaid-labor', 'unpaid-labor'),
  ('Systems-critique', 'systems-critique'),
  ('Queensland', 'queensland')
ON CONFLICT (slug) DO NOTHING;

-- Link tags to article
INSERT INTO article_tags (article_id, tag_id)
SELECT
  a.id,
  t.id
FROM articles a
CROSS JOIN tags t
WHERE a.slug = 'aunty-corrine-mount-isa-unpaid-expertise'
  AND t.slug IN (
    'elder-knowledge',
    'community-led',
    'youth-justice',
    'mount-isa',
    'indigenous-leadership',
    'unpaid-labor',
    'systems-critique',
    'queensland'
  );
```

---

### **Step 4: Verify Markdown File** (5 min)

**File already created at:**
`/data/webflow-migration/articles-markdown/aunty-corrine-mount-isa-unpaid-expertise.md`

**Just check:**
- [ ] File exists in correct location
- [ ] Frontmatter matches database record (especially slug)
- [ ] No syntax errors (validate YAML frontmatter)

---

### **Step 5: Commit to Git** (10 min)

```bash
# Add files
git add public/images/articles/aunty-corrine/
git add data/webflow-migration/articles-markdown/aunty-corrine-mount-isa-unpaid-expertise.md

# Commit
git commit -m "Add Aunty Corrine story: 20 years of unpaid justice work in Mount Isa

- Full story (3,400 words) with case studies
- Featured image and metadata
- Category: roots (Elder knowledge)
- Tags: Indigenous-led, community-led, youth justice
- Database records created
- Ready for staging review"

# Push to staging branch
git push origin staging
```

---

## 📅 **DAY 2: Test on Staging** (1-2 hours)

### **Step 1: Deploy to Staging** (30 min)

```bash
# If using Vercel/Netlify, push triggers automatic deploy
# Or manually deploy:
npm run build
npm run deploy:staging
```

**Wait for deployment to complete** (usually 3-5 minutes)

---

### **Step 2: Test the Page** (30 min)

**Visit:** `https://staging.justicehub.au/stories/aunty-corrine-mount-isa-unpaid-expertise`

**Check:**
- [ ] Page loads without errors
- [ ] Title displays correctly
- [ ] Featured image appears
- [ ] Excerpt shows in header
- [ ] Story text renders (all sections visible)
- [ ] Reading time shows (14 minutes)
- [ ] Tags display
- [ ] Category badge shows ("roots")
- [ ] Author info correct
- [ ] Mobile responsive (test on phone)

**If anything broken:** Check browser console for errors, verify database slug matches file slug

---

### **Step 3: Send to Aunty for Final Approval** (15 min)

**Email her:**

```
Subject: Your story is ready to preview!

Hi Aunty Corrine,

Your story is now on our test website. You can see it here:
[staging link]

This is the final version before we publish to the live website.

Please check:
- Does everything look right?
- Any photos or words you want changed?
- Ready for us to make it public?

Just reply to this email with:
- "Looks good, publish it!" OR
- "Change this part: [tell us what]"

Thanks,
[Your name]
```

---

## 📅 **DAY 3: Publish & Promote** (2-3 hours)

### **Step 1: Publish to Production** (15 min)

**Once Aunty approves:**

```sql
-- Set published flag to true
UPDATE articles
SET is_published = true, updated_at = NOW()
WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise';
```

```bash
# Merge to main branch
git checkout main
git merge staging
git push origin main

# Deploy to production
# (usually automatic with Vercel/Netlify)
```

**Wait 3-5 minutes, then visit:**
`https://justicehub.au/stories/aunty-corrine-mount-isa-unpaid-expertise`

---

### **Step 2: Send to Aunty** (5 min)

```
Subject: Your story is LIVE! 🎉

Hi Aunty Corrine,

Your story is now published!

You can see it here: https://justicehub.au/stories/aunty-corrine-mount-isa-unpaid-expertise

Please share it with anyone you want. We'll be sharing it this week with:
- Other communities doing similar work
- Funders we're talking to
- Media (ABC, Guardian)

Thank you for trusting us with your story.

[Your name]
```

---

### **Step 3: Promote on Social Media** (1 hour)

**Use templates below** ([SOCIAL_MEDIA_TEMPLATES.md](SOCIAL_MEDIA_TEMPLATES.md))

**Schedule posts:**
- [ ] LinkedIn (professional/funder audience)
- [ ] Twitter/X (media/policy audience)
- [ ] Facebook (community audience)
- [ ] Instagram (visual/youth audience - if you have photos)

---

### **Step 4: Email Newsletter** (30 min)

**Send to JusticeHub subscribers:**

**Subject:** "I Need Voices Behind Me" - Meet Aunty Corrine

**Body:**

```
For 20 years, Aunty Corrine has supported 25 young people in Mount Isa.

Unpaid. 24/7. Picking them up at 3am. Going to court with them. Making sure they're safe.

While services with millions compete over "tick-and-flick funding," Aunty does the work that actually transforms lives.

Now she's saying: "I need voices behind me."

Read her story: [link]

And share it. Because Aunty deserves backup.

[Your name]
JusticeHub Team
```

---

### **Step 5: Media Outreach** (1 hour)

**Send pitch emails to:**

1. **ABC** (they already featured Aunty on Four Corners)
   - Contact: [ABC Indigenous / Heywire producers]
   - Angle: "Follow-up to Cleveland story"

2. **Guardian Australia**
   - Contact: Indigenous affairs reporter
   - Angle: "Community expertise unpaid while services get millions"

3. **NITV**
   - Angle: "Elder wisdom on youth justice"

4. **Queensland outlets**
   - Brisbane Times, Courier-Mail
   - Angle: "Mount Isa Aunty exposes tick-and-flick funding"

**Use pitch template below.**

---

## 🎨 **SOCIAL MEDIA TEMPLATES**

### **LinkedIn Post** (Professional/Funder Audience)

```
For 20 years, Aunty Corrine has done professional-level youth justice work in Mount Isa.

Cross-system case coordination. 24/7 crisis response. Long-term relational support. Cultural authority.

If you billed this at professional rates: $800-1,200 per day.

Her actual compensation: $0.

Meanwhile, services with multi-million budgets "tick-and-flick" through caseloads. Co-responders earn $60/hour.

Aunty has supported 25 young people through the justice system. Picked them up at 3am. Went to court with every single one.

"All they wanted was just someone to show 'em a lot of love and attention."

Now she's saying: "I need voices behind me."

This is what community-led actually looks like.

Read her full story: [link]

#YouthJustice #CommunityLed #IndigenousLeadership #ClosingTheGap #MountIsa
```

---

### **Twitter/X Thread**

```
Thread: Meet Aunty Corrine.

For 20 years, she's supported 25 young people in Mount Isa—unpaid, 24/7.

While services with millions compete over "tick-and-flick funding," she picks up kids at 3am.

This is what community-led actually looks like. 🧵

1/7

---

"Me and the old man used to get in our car, go get 'em off the street at three, four o'clock in the morning."

No intake forms. No eligibility criteria. No funding.

Just: Are you okay?

2/7

---

Steven came from Cleveland Youth Detention. 2 pages of criminal history.

Aunty took him in. Got him into school. Got him off the streets.

Now 21. Independent. Building a life.

No Youth Justice worker did this. Aunty did. For free.

3/7

---

Aunty calls it "tick-and-flick funding."

Services count kids as "served" = funding justified.
More kids in system = more money.

Meanwhile Aunty works with same 25 young people for YEARS.
She gets $0.

"It's all about dollar signs."

4/7

---

VOP (Voice of Peace) program worked beautifully.
6 boys engaged. Real relationships building.

Then: Funding cut.

Aunty: "When something starts looking really good and deadly, you get the funding taken away. They don't want things to look great in Mount Isa."

5/7

---

A counselor told Aunty: "I could learn a lot from you."

A doctor told Aunty: "I could learn a lot from you."

Professionals with degrees learn from Aunty Corrine.

But she doesn't get a paycheck.

6/7

---

Aunty: "I will support you, but I need voices behind me."

20 years. 25 young people. Countless 3am pickups.
All unpaid. All from the heart.

She has the voice. She needs backup.

Read her full story: [link]

Be a voice behind her.

7/7 END
```

---

### **Facebook Post** (Community Audience)

```
❤️ Meet Aunty Corrine from Mount Isa

For 20 years, she's been there for young people when everyone else gave up.

- Picking them up at 3am when they're in trouble
- Going to court with them
- Making sure they have food and a safe place to stay
- Just being there

She's supported 25 young people. Not "case-managed" them. SUPPORTED them. Like family.

"All they wanted was just someone to show 'em a lot of love and attention."

And she's done this for FREE. While services with millions compete over funding.

Now Aunty's saying: "I need voices behind me."

Read her incredible story and share it. Because Aunties like Corrine deserve backup.

👉 [link]

#CommunityPower #MountIsa #IndigenousWisdom #YouthJustice
```

---

## 📧 **MEDIA PITCH TEMPLATE**

**Subject: Story Pitch - Mount Isa Aunty Exposes "Tick-and-Flick" Youth Justice Funding**

```
Hi [Name],

I'm reaching out with a story about Aunty Corrine, an Aboriginal Elder in Mount Isa who's been doing unpaid youth justice work for 20 years—and calling out the system failures everyone else is too polite to name.

THE STORY:

While services with multi-million budgets work 9-5, Aunty Corrine picks up kids at 3am. She's supported 25 young people through the justice system—unpaid, 24/7, for two decades.

Her phrase for the current funding model: "Tick-and-flick funding."

Services count kids as "served" = funding justified. More kids in system = more money. Meanwhile Aunty works with the same young people for years. She gets $0.

THE EVIDENCE:

- Steven: Came from Cleveland Youth Detention with 2 pages of criminal history → Now 21, independent, no recent charges
- 25 "M Valley boys": Aunty went to court with every single one
- VOP program: Worked beautifully (6 boys engaged) → Funding cut when it started succeeding
- Economic value: If billed at professional rates, Aunty's work worth $800-1,200/day

THE QUOTE:

"I don't care if I get myself in trouble. A lot of these services got here, it's just all a big competition. Tick-and-flick funding keep rolling in for what? Because we still got a lot of bad children on the streets."

THE CONTEXT:

- Closing the Gap Target 11: 30% reduction in Aboriginal youth detention by 2031
- Queensland recidivism: 75% reoffend within 2 weeks
- NSW seeking "community-led solutions" (that already exist, unpaid)
- Co-responders earn ~$60/hour; Aunty earns $0

THE ASK:

Aunty says: "I need voices behind me."

Would you be interested in covering this story? I can provide:
- Full interview transcripts
- Video clips (if helpful)
- Context on youth justice funding in QLD/NSW
- Connections to related stories (Cleveland, Justice Reinvestment, etc.)

Happy to chat more.

[Your name]
[Contact details]

Story link: https://justicehub.au/stories/aunty-corrine-mount-isa-unpaid-expertise
```

---

## ✅ **POST-PUBLICATION CHECKLIST**

### **Week 1:**
- [ ] Monitor social media engagement
- [ ] Respond to comments
- [ ] Track media pickups
- [ ] Check analytics (page views, time on page)
- [ ] Share with specific funders (Mindaroo, NSW Government)

### **Week 2:**
- [ ] Follow up with media who haven't responded
- [ ] Send to communities (Bourke, Moree, Alice Springs)
- [ ] Add to any relevant newsletters/digests
- [ ] Update if Aunty has feedback

### **Month 1:**
- [ ] Use in NSW grant application (due Jan 19, 2026)
- [ ] Include in Mindaroo proposal
- [ ] Report stats to Aunty (views, shares, impact)

---

## 🆘 **TROUBLESHOOTING**

### **Problem: Page doesn't load**
- Check slug matches between database and markdown file
- Verify `is_published = true` in database
- Check browser console for errors
- Try clearing cache

### **Problem: Image doesn't show**
- Verify file path: `/public/images/articles/aunty-corrine/featured-portrait.jpg`
- Check file actually uploaded
- Verify file extension matches (`.jpg` not `.jpeg`)
- Check file isn't too large (>5MB)

### **Problem: Tags don't appear**
- Verify `article_tags` junction table has entries
- Check tag slugs match exactly
- Run SQL query to check relationships

### **Problem: Formatting looks wrong**
- Check markdown syntax (headings, paragraphs)
- Verify frontmatter YAML valid (no syntax errors)
- Test on different browsers
- Check mobile view separately

---

## 🎉 **YOU'RE DONE!**

**3 days from setup to live publication.**

**Now Aunty's story is:**
- ✅ On JusticeHub website
- ✅ Shareable on social media
- ✅ Usable in grant applications
- ✅ Pitchable to media
- ✅ Connected to related content
- ✅ Amplifying her voice

**Aunty said: "I need voices behind me."**

**You just gave her a megaphone.**

---

## 📞 **NEED HELP?**

**If stuck:**
1. Check [STORY_IMPLEMENTATION_GUIDE.md](STORY_IMPLEMENTATION_GUIDE.md) for detailed technical steps
2. Review [AUNTY_CORRINE_PROJECT_SUMMARY.md](AUNTY_CORRINE_PROJECT_SUMMARY.md) for full context
3. Ask in team Slack/Discord
4. Open GitHub issue with specific error message

**You got this! 💪**
