# Community Storytelling System - README
## Replicable Process for Ethical, Ownership-Centered Storytelling

**Based on:** Aunty Corrine story success
**Purpose:** Scale community storytelling while maintaining ownership and value flows
**Status:** Production-ready templates and tools

---

## What This Is

A complete system for publishing community stories on JusticeHub that ensures:

1. **Storytellers own their narratives** (copyright + optional NFT)
2. **Value flows back to community** (revenue sharing when stories generate funding)
3. **Process is replicable** (templates make it easy to do again and again)
4. **Quality stays high** (literary journalism style, 40%+ direct quotes)
5. **Consent is real** (can modify or remove anytime)

**Problem it solves:** Traditional media extracts stories, gives nothing back. This flips that.

---

## Quick Start (Choose Your Path)

### Path 1: "Just Tell Me What To Do" → [SIMPLEST_WORKFLOW_GUIDE.md](SIMPLEST_WORKFLOW_GUIDE.md)
- **Time:** 10-15 hours per story
- **Complexity:** Low (copy-paste templates)
- **Good for:** Getting started, 1-5 stories
- **Output:** Published story with basic ownership tracking

### Path 2: "I Want to Understand the System" → [STORYTELLING_WORKFLOW_TEMPLATE.md](STORYTELLING_WORKFLOW_TEMPLATE.md)
- **Time:** 20 hours per story (more thorough)
- **Complexity:** Medium (templates + custom setup)
- **Good for:** Building sustainable process, 10+ stories
- **Output:** Published story + ownership registry + revenue tracking

### Path 3: "I Want Full Ownership Infrastructure" → [STORY_OWNERSHIP_FRAMEWORK.md](STORY_OWNERSHIP_FRAMEWORK.md)
- **Time:** 2-3 months upfront setup, then 6-12 hours per story
- **Complexity:** High (blockchain, smart contracts, DAO)
- **Good for:** 50+ stories, community-governed platform
- **Output:** Full Web3 ownership + auto revenue distribution

---

## Documents in This Package

### Core Workflow
1. **[STORYTELLING_WORKFLOW_TEMPLATE.md](STORYTELLING_WORKFLOW_TEMPLATE.md)** ⭐ START HERE
   - The complete 5-step process
   - Tools needed for each step
   - Templates and examples
   - Scaling strategies (1 story → 50 stories)

2. **[SIMPLEST_WORKFLOW_GUIDE.md](SIMPLEST_WORKFLOW_GUIDE.md)** ⭐ FOR BEGINNERS
   - Fastest path to publishing
   - Minimum viable process
   - Common mistakes to avoid
   - "What if" Q&A

### Ownership & Value
3. **[STORY_OWNERSHIP_FRAMEWORK.md](STORY_OWNERSHIP_FRAMEWORK.md)** ⭐ CRITICAL
   - Why ownership matters
   - 3 implementation levels (database → NFT → DAO)
   - Revenue sharing models
   - Smart contract code
   - Legal agreement template

### Interview Process
4. **[INTERVIEW_GUIDE_TEMPLATE.md](INTERVIEW_GUIDE_TEMPLATE.md)**
   - Pre-interview checklist
   - Opening script (consent)
   - Question prompts by section
   - Note-taking template
   - Post-interview checklist

### Reference (Aunty Corrine Example)
5. **[PROJECT_MASTER_INDEX.md](PROJECT_MASTER_INDEX.md)**
   - All 18 files from Aunty Corrine project
   - What each file does
   - How they interconnect
   - Example of complete workflow output

6. **[COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md)**
   - Technical implementation details
   - Database setup walkthrough
   - Media integration
   - Troubleshooting

### Quick Reference
7. **[STORYTELLING_SYSTEM_README.md](STORYTELLING_SYSTEM_README.md)** (this file)
   - System overview
   - How everything fits together
   - What to use when

---

## The Simple Version

### What You Need
- Phone with voice recorder (for interviews)
- Otter.ai account (free tier, for transcription)
- Google Doc (for writing and storyteller review)
- Supabase access (database you already have)
- Phone camera (for photos)

**Cost:** $0-30 per story (if you pay for transcription)

### What You Do

**Week 1:**
1. Record 60-90 min conversation with storyteller
2. Get it transcribed
3. Extract quotes and case studies
4. Write 2,500-3,000 word draft

**Week 2:**
5. Send draft to storyteller for approval
6. Make any changes they request
7. Get written consent

**Week 3:**
8. Upload photo and markdown file
9. Run SQL script to set up database
10. Register ownership
11. Publish and share

**Output:** Story on JusticeHub that storyteller owns

### What You Track

```sql
-- Minimum ownership tracking (in database)
story_ownership table:
- Who owns it
- How to contact them
- Revenue share %
- Consent date

story_revenue_events table:
- When story generates value
- How much storyteller gets
- Payment status

story_usage_log table:
- Who's using the story
- For what purpose
- Consent verified
```

---

## The Advanced Version

### What You Add
- NFT ownership (provable on blockchain)
- Smart contracts (auto revenue distribution)
- Storyteller portal (they can login and see their stories)
- Community governance (DAO votes on which stories to publish)

### Why Bother?
- **Trust:** Ownership is provable, platform can't revoke it
- **Automation:** Revenue splits happen automatically
- **Portability:** Storyteller owns NFT, can take it elsewhere
- **Governance:** Community controls the platform

### What It Looks Like

```javascript
// Mint story ownership NFT
const nft = await mintStory({
  storyteller: "0xAuntyCorrine",
  storyId: "aunty-corrine-mount-isa-unpaid-expertise",
  title: "I Need Voices Behind Me",
  revenueShare: 10 // 10%
});

// NFT appears in storyteller's wallet
// They prove they own it
// Platform checks blockchain before displaying story

// When grant comes in
await distributeRevenue(
  nftId,
  0.5, // 0.5 ETH (e.g., $1000)
  "NSW Community Safety Grant citation"
);

// Revenue automatically sent to storyteller's wallet
// No manual processing needed
```

---

## How It All Fits Together

```
┌─────────────────────────────────────────────────────┐
│              INTERVIEW & RECORDING                  │
│                                                     │
│  Use: INTERVIEW_GUIDE_TEMPLATE.md                   │
│  Tool: Phone recorder + Otter.ai                    │
│  Output: Audio file + transcription                 │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│           ANALYSIS & EXTRACTION                     │
│                                                     │
│  Extract: 5-7 case studies, 15-20 quotes            │
│  Tool: Manual review of transcription               │
│  Output: Organized quotes by theme                  │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│               STORY DRAFTING                        │
│                                                     │
│  Use: Literary journalism style                     │
│  Format: 40% quotes, 60% narrative                  │
│  Output: 2,500-3,000 word draft                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│          CONSENT & APPROVAL                         │
│                                                     │
│  Send draft to storyteller                          │
│  They review, request changes                       │
│  Get written "yes" to publish                       │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│      OWNERSHIP REGISTRATION                         │
│                                                     │
│  Level 1: Database record                           │
│  Level 2: Mint NFT                                  │
│  Level 3: Smart contract + DAO                      │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│        TECHNICAL PUBLICATION                        │
│                                                     │
│  Create markdown file                               │
│  Upload photo                                       │
│  Run SQL setup script                               │
│  Set is_published = true                            │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│         PROMOTION & SHARING                         │
│                                                     │
│  Social media (templates provided)                  │
│  Newsletter feature                                 │
│  Media outreach                                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│       VALUE TRACKING & PAYMENT                      │
│                                                     │
│  Track when story generates revenue                 │
│  Calculate storyteller share                        │
│  Pay within 30 days                                 │
│  Update storyteller on impact                       │
└─────────────────────────────────────────────────────┘
```

---

## Revenue Sharing Examples

### Example 1: Grant Citation

**Scenario:** NSW applies for $50,000 community safety grant and cites Aunty Corrine's story as evidence.

**Flow:**
1. Grant approved: $50,000
2. Story cited as key evidence
3. Storyteller gets 10%: $5,000
4. Logged in `story_revenue_events` table
5. Payment processed within 30 days
6. Aunty Corrine notified

**Database entry:**
```sql
INSERT INTO story_revenue_events (
  story_id,
  event_type,
  total_amount,
  storyteller_share,
  source_organization
) VALUES (
  'aunty-corrine-mount-isa-unpaid-expertise',
  'grant_citation',
  50000,
  5000,
  'NSW Department of Communities and Justice'
);
```

### Example 2: Media Licensing

**Scenario:** Guardian Australia wants to republish story

**Flow:**
1. Guardian contacts JusticeHub
2. JusticeHub checks with storyteller
3. Storyteller negotiates (or platform does on their behalf)
4. License fee: $1,000
5. Storyteller gets 50%: $500
6. Payment immediate

### Example 3: Book Deal

**Scenario:** Publisher wants to include story in anthology

**Flow:**
1. Publisher approaches platform
2. Platform connects publisher to storyteller
3. **Storyteller negotiates directly** (they own copyright)
4. If storyteller agrees: 50% of book advance
5. Storyteller also gets royalties on book sales

### Example 4: Speaking Opportunity

**Scenario:** Justice summit invites storyteller to speak because of story impact

**Flow:**
1. Summit organizers find story on JusticeHub
2. Contact storyteller via platform
3. **Storyteller sets their own fee**
4. Example: $3,000 keynote
5. Platform takes $0 (this is storyteller's opportunity)
6. Logged as value generated, but no platform cut

---

## Quality Standards

Every story should have:

### Content Quality
- [ ] 40%+ direct quotes (storyteller's actual words)
- [ ] 3+ specific case studies (not abstract)
- [ ] Systems failures evidenced
- [ ] Community expertise centered
- [ ] Young people portrayed with dignity
- [ ] No deficit framing or pity narratives

### Consent Quality
- [ ] Storyteller reviewed full draft
- [ ] Got written approval
- [ ] Knows how to request changes
- [ ] Knows how to revoke
- [ ] Understands revenue sharing

### Ownership Quality
- [ ] Registered in database (minimum)
- [ ] Revenue share % documented
- [ ] Contact for payments confirmed
- [ ] Legal agreement signed
- [ ] NFT minted (optional but recommended)

### Technical Quality
- [ ] Unique, meaningful slug
- [ ] 5-8 relevant tags
- [ ] Featured image (1200x800px min)
- [ ] Mobile-tested
- [ ] All links work
- [ ] Reading time accurate

---

## Scaling Strategy

### 1-5 Stories: Manual Process

**What to use:**
- SIMPLEST_WORKFLOW_GUIDE.md
- Interview guide template
- Database ownership tracking
- Manual revenue reconciliation

**Time per story:** 10-15 hours
**Team:** 1 person

### 10-20 Stories: Semi-Automated

**What to add:**
- Airtable for project management
- Automated transcription (Otter.ai API)
- Template generators (provided scripts)
- Monthly payment batch processing

**Time per story:** 8-12 hours
**Team:** 1-2 people

### 50+ Stories: Platform Features

**What to build:**
- Storyteller self-service portal (login, view stories, see revenue)
- Community review process (DAO votes on publication)
- Automated consent workflow
- Smart contract revenue distribution
- NFT minting on publication

**Time per story:** 6-8 hours
**Team:** 2-3 people + community reviewers

---

## Success Metrics

### Storyteller Metrics
- **Ownership clarity:** Do 90%+ feel they own their story?
- **Trust:** Would 80%+ recommend process to others?
- **Value:** Have 50%+ received payment or credits?
- **Control:** 0 complaints about unauthorized use

### Story Quality Metrics
- **Quote density:** 40%+ direct quotes
- **Specificity:** 3+ concrete case studies
- **Community voice:** 0 deficit framing complaints
- **Accuracy:** 0 factual errors after approval

### Platform Metrics
- **Revenue generated:** $____ total from all stories
- **Revenue paid:** $____ to storytellers (should be 10-50% of above)
- **Payment speed:** < 30 days average
- **Revocations:** < 5% (low is good, some is healthy)

### Impact Metrics
- **Grant success:** How many grants cite stories?
- **Policy influence:** Stories cited in ___ policy documents
- **Media pickup:** Stories republished ___ times
- **Academic use:** Cited in ___ research papers

---

## Common Questions

### About Ownership

**Q: What if storyteller doesn't want NFT/crypto stuff?**
A: Level 1 (database) is fine. They still own it, just recorded differently.

**Q: Can storyteller change their mind after publishing?**
A: Yes. Always. They can request changes or complete removal.

**Q: What if storyteller wants to publish elsewhere too?**
A: They own it. They can. Our license is non-exclusive.

### About Process

**Q: Do I need to be a good writer?**
A: No. Use more quotes (60-70%), less narrative. Their words are powerful.

**Q: How long should stories be?**
A: 2,500-3,500 words ideal. Can be shorter (1,500) or longer (4,000).

**Q: Can I use AI to help write?**
A: For transcription, yes. For drafting, be careful - storyteller's voice must dominate.

### About Revenue

**Q: What counts as "revenue generated by story"?**
A: Grants citing it, media licensing it, books including it. Not ads on the page.

**Q: Who decides the revenue share %?**
A: Storyteller and platform negotiate. Default is 10% grants, 50% licensing.

**Q: What if there's no revenue?**
A: Track value anyway (influence, citations, opportunities). Not all value is monetary.

### About Technical

**Q: Do I need a developer?**
A: Not for Level 1 (database). Yes for Level 3 (smart contracts).

**Q: Can I use this on WordPress/other CMS?**
A: Yes. Templates work anywhere. Ownership framework is platform-agnostic.

**Q: How do I handle photos/video?**
A: Get explicit consent for each. Preference: storyteller provides or approves all media.

---

## Next Steps

### Today
1. Read [SIMPLEST_WORKFLOW_GUIDE.md](SIMPLEST_WORKFLOW_GUIDE.md)
2. Identify one potential storyteller
3. Set up meeting to record conversation

### This Week
4. Do the interview (use [INTERVIEW_GUIDE_TEMPLATE.md](INTERVIEW_GUIDE_TEMPLATE.md))
5. Get transcription
6. Extract quotes and case studies

### Next Week
7. Draft story
8. Send to storyteller for approval
9. Register ownership in database

### Within Month
10. Publish first story
11. Track what worked / didn't
12. Plan second story

### Long Term
- Build library of 10+ community stories
- Develop revenue sharing relationships with funders
- Create community governance structure
- Scale nationally

---

## Support & Resources

### Templates Provided
- Interview guide
- Consent forms
- SQL setup scripts
- Social media templates
- Legal agreements

### Code Provided
- Database schema (SQL)
- Smart contracts (Solidity)
- Revenue tracking
- Ownership registry

### Examples
- Aunty Corrine full project (18 files)
- Complete workflow demonstrated
- Every template in action

### Get Help
- Review Aunty Corrine example
- Check FAQ sections in each doc
- Adapt templates to your context

---

## Philosophy

**This is not journalism. This is not research. This is not content marketing.**

This is **documentation of community expertise** with:
- Community ownership (they control narrative)
- Fair compensation (value flows back)
- Real consent (revocable anytime)
- Sustainable process (replicable, scalable)

**Traditional media extracts stories.** Journalist shows up, records conversation, publishes article, owns copyright, community gets nothing.

**We flip that.** Community member shares knowledge, platform publishes on their terms, they own copyright, value flows back when story generates revenue.

**Simple as that.**

---

## Final Checklist

Before you start, make sure you have:

- [ ] Read SIMPLEST_WORKFLOW_GUIDE.md
- [ ] Access to Supabase (database)
- [ ] Phone with voice recorder
- [ ] Otter.ai account (for transcription)
- [ ] Google Drive (for file storage)
- [ ] At least one storyteller who's willing

**You're ready.**

Go record a conversation. Extract the quotes. Write the draft. Get approval. Register ownership. Publish.

Then do it again.

And again.

This is how we build a library of community knowledge that communities actually own.

---

## Project Status

**Current:** Production-ready templates and tools
**Tested:** Aunty Corrine story (complete workflow)
**Next:** Scale to 10 stories in 6 months

**Maintained by:** JusticeHub
**License:** Open source (adapt for your context)
**Community:** Storytellers own their narratives, always

---

**Now go publish some stories.**
