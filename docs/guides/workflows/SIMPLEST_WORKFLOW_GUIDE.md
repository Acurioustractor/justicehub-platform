# Simplest Possible Workflow
## For Busy People Who Just Want to Publish Community Stories

**Time:** 10-15 hours total per story
**Cost:** $0 (using free tools)
**Technical skill needed:** Basic (copy-paste SQL, upload files)

---

## The 5-Step Minimum

### 1. Record (2 hours)

**What you need:**
- Phone with voice recorder
- Quiet place to talk
- Pen and paper

**What you do:**
1. Meet with storyteller
2. Say: "You own this story, you can change or remove anything, you'll get paid if it generates revenue. Can I record?"
3. Press record
4. Ask: "Tell me about [their work/experience]"
5. Let them talk for 60-90 minutes
6. Write down 5 best quotes while they talk
7. Say thank you, upload recording to Google Drive

**Output:** Audio file with community knowledge

---

### 2. Extract (3 hours)

**What you need:**
- Transcription (use Otter.ai free tier or pay Rev.com $1.50/min)
- Text editor or Google Doc

**What you do:**
1. Get recording transcribed
2. Read through, highlight best parts:
   - 5-7 specific case studies or examples
   - 15-20 powerful quotes
   - 3-5 key themes
   - What's needed/vision for change
3. Copy these into a doc organized by theme

**Output:** Organized quotes and case studies

---

### 3. Write (4 hours)

**What you need:**
- Google Doc
- Your extracted quotes
- Aunty Corrine story as reference

**What you do:**
1. Copy this structure:
   ```
   Opening: Start with powerful quote or scene (300 words)

   Section 1: First case study (400 words)
   - Scene-setting narrative (200 words)
   - Direct quotes (200 words)

   Section 2: Second case study (400 words)
   Section 3: Third case study (400 words)
   Section 4: What systems miss (400 words)
   Section 5: What's needed (400 words)

   Closing: Storyteller's vision (300 words)
   ```

2. Paste in their actual quotes (40% of word count)
3. Write narrative connecting quotes (60% of word count)
4. Use their words, not your interpretation
5. Keep it scene-based (show what happened, don't tell)

**Output:** 2,500-3,000 word draft

---

### 4. Get Approval (1 week waiting time, 30 min your time)

**What you need:**
- Email or phone

**What you do:**
1. Send storyteller the draft
2. Email template:
   ```
   Subject: Your story draft - you own this

   Hi [Name],

   Here's the draft based on our conversation.

   You own this story. You can:
   - Change anything
   - Remove anything
   - Decide not to publish

   Please let me know:
   1. What changes you want (if any)
   2. If you're comfortable publishing

   Take your time. No rush.

   [Your name]
   ```
3. Make any changes they request
4. Get written "yes, you can publish this"

**Output:** Approved story + consent

---

### 5. Publish (2 hours)

**What you need:**
- Supabase access
- One photo (phone camera is fine)
- Copy-paste skills

**What you do:**

**A. Prepare Files (30 min)**

1. Create markdown file:
   - Copy `/data/webflow-migration/articles-markdown/aunty-corrine-mount-isa-unpaid-expertise.md`
   - Replace content with your story
   - Update frontmatter (title, slug, excerpt, tags)

2. Upload photo:
   - Take/get one good portrait of storyteller
   - Resize to 1200x800px (use Squoosh.app)
   - Upload to `/public/images/articles/[story-name]/featured.jpg`

**B. Run Database Setup (30 min)**

1. Copy [deploy-all-aunty-corrine.sql](deploy-all-aunty-corrine.sql)
2. Find-and-replace:
   - "aunty-corrine" → your slug
   - "Aunty Corrine" → storyteller name
   - Title, excerpt, location, tags
3. Paste into Supabase SQL Editor
4. Run script
5. Check for "SUCCESS" message

**C. Register Ownership (15 min)**

```sql
-- Add this to track ownership
INSERT INTO story_ownership (
  story_id,
  storyteller_name,
  storyteller_contact,
  consent_date,
  revenue_share_percent
) VALUES (
  'your-story-slug',
  'Storyteller Name',
  'their@email.com',
  NOW(),
  10
);
```

**D. Publish (15 min)**

```sql
-- Make it live
UPDATE articles
SET is_published = true
WHERE slug = 'your-story-slug';
```

**E. Share (30 min)**

Copy social media templates from [SOCIAL_MEDIA_TEMPLATES.md](SOCIAL_MEDIA_TEMPLATES.md):
- Post on Twitter
- Post on LinkedIn
- Email newsletter

**Output:** Live story on website

---

## Tools You Actually Need

### Recording & Transcription
- **Free:** Phone voice recorder + Otter.ai (free tier = 300 min/month)
- **Paid:** Zoom recording + Rev.com ($1.50/min, very accurate)

### Writing
- **Free:** Google Docs (easy to share with storyteller for review)
- **Alternative:** Notion, Word, any text editor

### Database
- **What you have:** Supabase (already set up)
- **What you need:** Access to SQL Editor

### Images
- **Free:** Phone camera + Squoosh.app (resize images)
- **Better:** DSLR or good phone camera in portrait mode

### Ownership Tracking
- **Minimum:** Spreadsheet tracking who owns what
- **Better:** Database table (provided in ownership framework)
- **Best:** NFTs (for later when you have 20+ stories)

---

## Time Breakdown

| Step | Time Required | Can Be Shortened By |
|------|---------------|---------------------|
| 1. Record | 2 hours | Better questions = more focused conversation |
| 2. Extract | 3 hours | AI transcription, skip perfect accuracy |
| 3. Write | 4 hours | Use more direct quotes, less narrative |
| 4. Approval | 1 week wait | Build trust = faster approvals |
| 5. Publish | 2 hours | Templates make this copy-paste |

**Total active time:** 10-11 hours
**Total elapsed time:** 1-2 weeks (waiting for approval)

---

## Absolute Minimum Version (If You're Really Rushed)

### 1. Record (1.5 hours)
- 60 min conversation
- 30 min upload and basic notes

### 2. Quick Extract (1.5 hours)
- Pay for transcription ($20-30)
- Pull 10 best quotes
- Identify 3 case studies

### 3. Fast Draft (2 hours)
- 1,500 words instead of 3,000
- Mostly quotes (60%), light narrative (40%)
- Focus on one theme

### 4. Quick Approval (3 days)
- Send draft same day
- Follow up in 2 days
- Get yes/no

### 5. Minimal Publish (1 hour)
- One photo
- Run SQL script
- Post on Twitter only

**Total:** 6 hours active time, 3-5 days elapsed

**Trade-off:** Shorter, less polished, less promotion - but it's published and storyteller owns it.

---

## Common Mistakes to Avoid

### ❌ "I'll clean up their quotes to sound better"
**Why bad:** That's not their voice anymore
**Do instead:** Use their exact words, dialect and all

### ❌ "I'll publish first, get consent later"
**Why bad:** Breaks trust, extractive, potentially harmful
**Do instead:** Always get explicit approval before publishing

### ❌ "I need perfect video setup with lights and mics"
**Why bad:** Delays story, creates barriers, intimidates storyteller
**Do instead:** Phone audio in quiet room is fine

### ❌ "I should write this like a journalist"
**Why bad:** Makes it about you, not them
**Do instead:** Let their voice dominate (40%+ direct quotes)

### ❌ "I'll track ownership later when we have time"
**Why bad:** You'll forget, storyteller won't trust you
**Do instead:** Register ownership when you publish (takes 5 min)

---

## Success Checklist

Before you click "publish," verify:

### Content
- [ ] 40%+ direct quotes (storyteller's actual words)
- [ ] 3+ specific case studies (not abstract concepts)
- [ ] Storyteller sounds like themselves
- [ ] Young people protected (anonymized if needed)
- [ ] Deficit language avoided

### Consent
- [ ] Storyteller reviewed draft
- [ ] Got written "yes" to publish
- [ ] They know they can request changes later
- [ ] They know how to contact you

### Ownership
- [ ] Ownership registered in database
- [ ] Revenue share % documented
- [ ] Contact details for payment recorded
- [ ] They understand they own it

### Technical
- [ ] Story has unique slug
- [ ] Tags applied (5-8 tags)
- [ ] Featured image uploaded
- [ ] SQL script ran successfully
- [ ] Story appears on staging

### Promotion
- [ ] Posted on at least one social platform
- [ ] Storyteller knows it's live
- [ ] URL shared with storyteller
- [ ] Tracking analytics

---

## What If...?

**Q: Storyteller doesn't have email?**
A: Print draft, deliver in person, record verbal consent

**Q: I'm not a good writer?**
A: Use more quotes (60-70%), less narrative. Their words are powerful.

**Q: Can't afford transcription?**
A: Use Otter.ai free tier or transcribe manually while listening

**Q: Storyteller wants changes after publishing?**
A: Make changes within 7 days, update story, notify them

**Q: Story generates grant revenue?**
A: Calculate their % ($50k grant × 10% = $5k), pay within 30 days

**Q: Don't have their bank details?**
A: Ask before first payment due, or they can nominate community fund

**Q: Storyteller wants story removed?**
A: Remove within 7 days, no questions asked, they own it

---

## The Most Important Thing

**Perfect is the enemy of published.**

Better to have an imperfect story that centers community voice and maintains ownership than no story at all.

The storyteller owns it. They can request changes. It's not final - it's a living document.

**Just start.** Record the conversation. Extract the quotes. Write the draft. Get approval. Publish.

You'll get better with each one. The process will get faster. But the first one just needs to get done.

---

## Next Story Template

Once you've done one, use this for the next:

```markdown
# Story [Number]: [Storyteller Name]

**Recorded:** [Date]
**Topic:** [What it's about]
**Slug:** [story-slug]

## Quick Stats
- Recording duration: ____ min
- Transcription cost: $____
- Draft word count: ____
- Time to approval: ____ days
- Total time: ____ hours

## Files
- Recording: [link]
- Transcription: [link]
- Draft: [link]
- Approved version: [link]
- Markdown: [path]

## Ownership
- Storyteller: [name]
- Contact: [email/phone]
- Revenue share: [%]
- Registered: [date]

## Published
- URL: justicehub.au/stories/[slug]
- Date: [date]
- Views (30 days): ____
- Revenue generated: $____
- Paid to storyteller: $____

## Notes
[What worked, what didn't, lessons for next time]
```

---

**You can do this.** The tools are simple. The process is clear. The storyteller owns their knowledge.

Now go record a conversation.
