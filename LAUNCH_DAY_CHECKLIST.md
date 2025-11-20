# Launch Day Checklist - Aunty Corrine Story

## Print This & Check Off As You Go ✓

---

## PRE-LAUNCH (Before Today)

### Content Ready
- [ ] ✅ Consent received from Aunty Corrine (email + written form)
- [ ] ✅ Final story approved by Aunty
- [ ] ✅ All quotes verified accurate
- [ ] ✅ Names/details checked for privacy protection
- [ ] ✅ Young people's identities protected

### Database Setup
- [ ] ✅ Ran `verify-related-content.sql` in Supabase
- [ ] ✅ Ran `deploy-all-aunty-corrine.sql` in Supabase
- [ ] ✅ Verified all relationships created (8 tags, profile, program)
- [ ] ✅ Story exists but `is_published = false`

### Media Ready
- [ ] ✅ Featured image uploaded: `/public/images/articles/aunty-corrine/featured-portrait.jpg`
- [ ] ✅ Image dimensions correct (1200x800px minimum)
- [ ] ✅ Image quality good (not blurry/pixelated)
- [ ] ✅ Alt text appropriate and descriptive

### Staging Tested
- [ ] ✅ Story loads at staging URL: `staging.justicehub.au/stories/aunty-corrine-mount-isa-unpaid-expertise`
- [ ] ✅ Images display correctly
- [ ] ✅ Links work (profile, program, related articles)
- [ ] ✅ Tags display
- [ ] ✅ Mobile view works
- [ ] ✅ Desktop view works
- [ ] ✅ Reading time accurate (14 min)

### Social Media Prepared
- [ ] ✅ Twitter thread drafted (from SOCIAL_MEDIA_TEMPLATES.md)
- [ ] ✅ LinkedIn post drafted
- [ ] ✅ Instagram content created
- [ ] ✅ Facebook post drafted
- [ ] ✅ Images for social ready (1200x675px Twitter, 1080x1080px Instagram)
- [ ] ✅ Hashtags prepared
- [ ] ✅ Post schedule planned

---

## LAUNCH MORNING (9am - 12pm)

### Final Verification
- [ ] Check staging one last time
- [ ] Verify production environment ready
- [ ] Confirm deployment process clear
- [ ] Team briefed on launch

### Deploy to Production
```sql
-- Run this in Supabase SQL Editor
UPDATE articles
SET is_published = true, updated_at = NOW()
WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise';
```

### Verify Live
- [ ] Visit: `justicehub.au/stories/aunty-corrine-mount-isa-unpaid-expertise`
- [ ] Story loads ✓
- [ ] Images display ✓
- [ ] Links work ✓
- [ ] Tags work ✓
- [ ] Mobile works ✓

### Notify Aunty
- [ ] Email Aunty with live URL
- [ ] Thank her for trust
- [ ] Confirm she can request changes/removal anytime
- [ ] Ask her to share if she's comfortable

---

## LAUNCH AFTERNOON (12pm - 5pm)

### Social Media - Wave 1 (Immediate)

#### 12:00pm - Twitter
- [ ] Post Thread Option 1 (The Numbers)
- [ ] Pin to profile
- [ ] Screenshot for records

#### 12:30pm - LinkedIn
- [ ] Post Option 1 (Professional/Policy)
- [ ] Tag relevant organizations
- [ ] Screenshot for records

#### 1:00pm - Instagram
- [ ] Post carousel (5-7 slides)
- [ ] Add to story
- [ ] Screenshot for records

#### 2:00pm - Facebook
- [ ] Post story format
- [ ] Share to relevant groups (if appropriate)
- [ ] Screenshot for records

### Monitor & Engage (1pm - 5pm)
- [ ] Check comments every 30 minutes
- [ ] Respond thoughtfully
- [ ] Share positive engagement
- [ ] Screenshot notable reactions

---

## EVENING (5pm - 9pm)

### Newsletter Feature
- [ ] Draft newsletter feature
- [ ] Include story link
- [ ] Use excerpt for preview
- [ ] Schedule for next send

### Media Outreach
- [ ] Email to Guardian Australia (Calla Wahlquist, Amy Remeikis)
- [ ] Email to NITV (Aneeta Bhole)
- [ ] Email to ABC (Allan Clarke)
- [ ] Pitch: "20 years, 25 young people, $0 funding - what community-led actually looks like"

### Analytics Check
- [ ] Story page views: ___________
- [ ] Time on page: ___________
- [ ] Twitter impressions: ___________
- [ ] LinkedIn views: ___________
- [ ] Instagram reach: ___________
- [ ] Facebook reach: ___________

---

## DAY 2 - Amplify

### Morning (9am)
- [ ] Check overnight engagement
- [ ] Respond to new comments
- [ ] Share any media pickup
- [ ] Screenshot analytics

### Social Media - Wave 2
- [ ] Repost with different angle
- [ ] Quote key sections
- [ ] Share any comments from policy professionals
- [ ] Tag organizations doing similar work

### Engagement Targets
- [ ] Tag @ChangeTheRecord
- [ ] Tag @SNAICC
- [ ] Tag @AboriginalLegal
- [ ] Tag relevant Queensland organizations

### Monitor Media
- [ ] Check for coverage
- [ ] Respond to journalist inquiries
- [ ] Share any articles/mentions
- [ ] Update media log

---

## DAY 3 - Sustain

### Social Media - Wave 3
- [ ] Twitter: Different thread angle
- [ ] LinkedIn: Storytelling focus
- [ ] Instagram: Single post with long caption
- [ ] Share user-generated content (if any)

### Community Sharing
- [ ] Share with NSW grant contacts
- [ ] Share with Queensland policy network
- [ ] Share with justice reinvestment orgs
- [ ] Share with relevant academic contacts

### Update Aunty
- [ ] Send Aunty summary of response
- [ ] Share positive comments
- [ ] Provide analytics snapshot
- [ ] Thank her again

---

## WEEK 2 - Maintain Momentum

### Content Repurposing
- [ ] Pull quotes for graphics
- [ ] Create short video clips (if available)
- [ ] Write quote tweets
- [ ] Design Instagram quote posts

### SEO Blog Post (Optional)
- [ ] Publish BLOG_DRAFT_SEO_GATEWAY.md
- [ ] Link to main story
- [ ] Submit to Google News
- [ ] Share separately

### Engagement
- [ ] Continue responding to comments
- [ ] Join relevant conversations
- [ ] Share when others discuss Mount Isa/community-led
- [ ] Build relationships with engaged readers

---

## ONGOING - Long-Term Impact

### Monthly Check-ins
- [ ] Review analytics monthly
- [ ] Update Aunty on impact
- [ ] Note any policy changes/responses
- [ ] Track citations/references

### Grant Applications
- [ ] Use story in NSW grant application
- [ ] Reference in other funding bids
- [ ] Cite as evidence for community-led approaches
- [ ] Share URL in grant attachments

### Media & Policy
- [ ] Respond to journalist requests
- [ ] Share with policymakers
- [ ] Use in presentations
- [ ] Include in annual reports

---

## Emergency Contacts

### If Technical Issues:
- **Database problems:** Check COMPLETE_SETUP_GUIDE.md troubleshooting
- **Image not loading:** Verify path matches SQL script exactly
- **Story appears empty:** Check markdown file exists and path correct

### If Content Issues:
- **Aunty requests changes:** Immediately unpublish, make edits, re-verify with her
- **Privacy concerns raised:** Unpublish immediately, review with Aunty
- **Factual errors found:** Correct immediately, notify Aunty

### Unpublish Command (Emergency)
```sql
-- Only use if Aunty requests or serious issue found
UPDATE articles
SET is_published = false, updated_at = NOW()
WHERE slug = 'aunty-corrine-mount-isa-unpaid-expertise';
```

---

## Success Metrics (Track These)

### Day 1 Targets
- [ ] Story views: 500+
- [ ] Social reach: 5,000+
- [ ] Engagements: 100+
- [ ] Shares: 20+

### Week 1 Targets
- [ ] Story views: 2,000+
- [ ] Social reach: 20,000+
- [ ] Media mentions: 2+
- [ ] Policy contacts engaged: 5+

### Month 1 Targets
- [ ] Story views: 5,000+
- [ ] Cited in grant applications: 3+
- [ ] Used in policy discussions: Yes
- [ ] Community feedback: Positive

---

## Notes Section

### Launch Day Notes:
_Use this space to capture observations, unexpected issues, great responses, etc._

```
[blank space for notes]
```

---

### Media Inquiries:
_Track journalist contacts, interview requests, etc._

| Time | Contact | Outlet | Response |
|------|---------|--------|----------|
|      |         |        |          |
|      |         |        |          |
|      |         |        |          |

---

### Notable Engagement:
_Capture meaningful comments, shares from influential accounts, etc._

```
[blank space for notes]
```

---

## Post-Launch Debrief

### What Worked Well:
-
-
-

### What Could Improve:
-
-
-

### Lessons for Next Time:
-
-
-

### Unexpected Outcomes:
-
-
-

---

## Final Checklist Items

Before closing out launch:

- [ ] All social posts published
- [ ] Media outreach sent
- [ ] Aunty notified and thanked
- [ ] Analytics baseline captured
- [ ] Emergency unpublish command saved
- [ ] Team debriefed
- [ ] Success metrics tracked
- [ ] Next steps planned

---

**Remember:**
- Aunty owns this story
- Community voices first
- Engagement over metrics
- Relationships over reach
- Impact over impressions

**You've got this!** 🎉

---

## Quick Reference URLs

**Story:** `justicehub.au/stories/aunty-corrine-mount-isa-unpaid-expertise`
**Profile:** `justicehub.au/people/aunty-corrine`
**Program:** `justicehub.au/programs/mount-isa-aunties-network`
**Staging:** `staging.justicehub.au/stories/aunty-corrine-mount-isa-unpaid-expertise`

**Social Templates:** `SOCIAL_MEDIA_TEMPLATES.md`
**Troubleshooting:** `COMPLETE_SETUP_GUIDE.md`
**Master Index:** `PROJECT_MASTER_INDEX.md`
