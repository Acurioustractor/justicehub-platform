# Replicable Community Storytelling Workflow

## Purpose

A simple, repeatable process for publishing community stories on JusticeHub while maintaining storyteller ownership, ensuring consent, and creating value flows back to the community.

**Based on:** Aunty Corrine story success
**For:** Scaling ethical community storytelling
**Key principle:** Storytellers own and control their narratives

---

## The Simple 5-Step Process

### Step 1: Record the Conversation (1-2 hours)

**Before Recording:**
- [ ] Explain ownership model (they own the story forever)
- [ ] Explain how it will be used (website, social, grants, advocacy)
- [ ] Get verbal consent to record
- [ ] Explain they can stop/change/remove anything

**Recording Setup:**
- **Tool:** Phone voice recorder or Zoom
- **Duration:** 60-90 minutes usually enough
- **Format:** Let them talk, minimal interruption
- **Backup:** Always have a backup recording method

**Questions to Ask:**
1. "Tell me about [the work you do / the young people you support / your experience]"
2. "Can you walk me through a specific example or story?"
3. "What do services/systems miss or get wrong?"
4. "What would actually help? What's needed?"
5. "What do you want people to understand?"

**What You're Looking For:**
- 3-5 concrete case studies or examples
- Specific quotes showing expertise and perspective
- Systems failures vs. community knowledge
- What's needed (resources, power, recognition)

**Immediately After:**
- [ ] Upload recording to secure storage
- [ ] Send thank you message
- [ ] Set reminder to transcribe within 3 days

---

### Step 2: Analyze & Extract (2-3 hours)

**Use Template:** [INTERVIEW_ANALYSIS_TEMPLATE.md](INTERVIEW_ANALYSIS_TEMPLATE.md)

**What to Extract:**

**A. Core Case Studies (Aim for 5-7)**
- Each case study needs:
  - Person/situation (anonymized if needed)
  - What happened
  - What it shows (expertise, system failure, etc.)
  - Direct quotes

**B. Key Themes (Usually 5-8)**
- Pattern recognition across stories
- What keeps coming up?
- What's the deeper insight?

**C. Powerful Quotes (Pull 15-20)**
- Direct, unedited community voice
- Shows expertise or perspective
- Punchy and memorable
- Organized by theme

**D. Evidence of Impact**
- Numbers (people supported, years active, outcomes)
- Specific results
- What works vs. what doesn't

**Time-Saving Tip:**
Use AI transcription (Otter.ai, Rev.com) then manually review for accuracy and pull quotes.

---

### Step 3: Draft Story (3-4 hours)

**Use Template:** [STORY_DRAFT_TEMPLATE.md](STORY_DRAFT_TEMPLATE.md)

**Story Structure:**

**Opening (300 words):**
- Start with a powerful scene or quote
- Introduce the storyteller and their work
- Set up the tension (system vs. community)

**Body (2,000-2,500 words):**
- 5-7 thematic sections
- Each section = 1 case study or theme
- 40% direct quotes, 60% narrative
- Literary journalism style (scenes, not abstracts)

**Closing (300 words):**
- "What's needed" section
- Storyteller's vision
- Call to action (implicit or explicit)

**Style Guidelines:**
- Use storyteller's actual words as much as possible
- Scene-based (show, don't tell)
- Specific examples, not generalizations
- Let contradictions and complexity exist
- No hero narratives or pity frames

**Quick Check:**
- [ ] Does storyteller sound like themselves?
- [ ] Are systems failures specific and evidenced?
- [ ] Is community expertise centered?
- [ ] Are young people/community portrayed with dignity?

---

### Step 4: Get Consent & Approval (1-2 weeks turnaround)

**Use Template:** [CONSENT_VERIFICATION_TEMPLATE.md](CONSENT_VERIFICATION_TEMPLATE.md)

**Send to Storyteller:**

**Email Subject:** "Your story draft for review - you own this and can change anything"

**Email Content:**
```
Hi [Name],

Attached is the draft story based on our conversation.

IMPORTANT: You own this story. You can:
- Change any part of it
- Remove anything you're not comfortable with
- Add anything we missed
- Decide not to publish at all

There's no pressure. This is YOUR story.

I've also attached a consent form that explains:
- How the story will be used
- Who can access it
- How you can make changes or remove it later
- How you'll be compensated/credited

Please review and let me know:
1. What changes you'd like (if any)
2. If you're comfortable publishing
3. Any concerns or questions

Take your time. No rush.

[Your name]
```

**Attachments:**
1. Story draft (Google Doc with comment access)
2. Consent form (see CONSENT_VERIFICATION_TEMPLATE.md)
3. Usage agreement (see STORY_OWNERSHIP_AGREEMENT.md)

**Follow Up:**
- Week 1: Send draft
- Week 2: Check in if no response
- Week 3: Call or visit if still no response
- Never publish without explicit approval

---

### Step 5: Publish & Register Ownership (2-3 hours)

**A. Technical Setup (30 min)**

Run the story setup script:
```bash
# Use the template generator
node scripts/generate-story-setup.js \
  --name="Storyteller Name" \
  --slug="story-slug" \
  --title="Story Title" \
  --location="Location" \
  --tags="tag1,tag2,tag3"
```

This auto-generates:
- SQL setup script
- Markdown file with frontmatter
- Profile/program links
- Verification queries

**B. Register Ownership (30 min)**

Use the ownership registry:
```bash
# Register story ownership on-chain or in registry
node scripts/register-story-ownership.js \
  --storyteller="Aunty Corrine" \
  --wallet="0x..." \
  --story-id="aunty-corrine-mount-isa-unpaid-expertise" \
  --rights="full-ownership-with-platform-license"
```

**What This Does:**
- Records storyteller as owner
- Grants them NFT representing ownership
- Sets up revenue sharing
- Enables them to revoke/modify later

**C. Deploy to Production (15 min)**

```sql
-- Set to published
UPDATE articles
SET is_published = true
WHERE slug = 'story-slug';
```

**D. Set Up Value Flows (30 min)**

Configure how value flows back to storyteller:

**Revenue Sharing Model:**
- Grant applications using story: 10% to storyteller
- Media licensing: 50% to storyteller
- Speaking opportunities generated: Storyteller decides
- Merchandise/books: 50% to storyteller

**Track in:** `story_value_tracking` table

**E. Promote (1-2 hours)**

Use social media templates (auto-generated):
```bash
node scripts/generate-social-posts.js \
  --story-id="story-slug"
```

Generates:
- Twitter threads
- LinkedIn posts
- Instagram content
- Email newsletter

---

## Tools You Need

### Essential (Free)
1. **Recording:** Phone voice recorder or Zoom
2. **Transcription:** Otter.ai (free tier) or Rev.com ($1.50/min)
3. **Writing:** Google Docs (for collaboration with storyteller)
4. **Database:** Your existing Supabase setup
5. **Templates:** All provided in this package

### Nice to Have
6. **Video:** Phone camera or GoPro
7. **Images:** Phone camera (high-res mode)
8. **Project Management:** Notion or Airtable
9. **Blockchain Registry:** Ethereum or Polygon for ownership NFTs

### For Ownership & Value Flow
10. **Smart Contracts:** See [STORY_OWNERSHIP_CONTRACTS.md](STORY_OWNERSHIP_CONTRACTS.md)
11. **Revenue Tracking:** `story_value_tracking` database table
12. **Payment Rails:** Stripe or crypto wallet

---

## Templates Provided

### Interview & Analysis
- [INTERVIEW_GUIDE_TEMPLATE.md](INTERVIEW_GUIDE_TEMPLATE.md) - Question prompts
- [INTERVIEW_ANALYSIS_TEMPLATE.md](INTERVIEW_ANALYSIS_TEMPLATE.md) - Extract case studies
- [CONSENT_RECORDING_TEMPLATE.md](CONSENT_RECORDING_TEMPLATE.md) - Recording consent

### Writing
- [STORY_DRAFT_TEMPLATE.md](STORY_DRAFT_TEMPLATE.md) - Story structure
- [BLOG_POST_TEMPLATE.md](BLOG_POST_TEMPLATE.md) - Shorter SEO version
- [STORY_METADATA_TEMPLATE.md](STORY_METADATA_TEMPLATE.md) - Frontmatter/SEO

### Consent & Ownership
- [CONSENT_VERIFICATION_TEMPLATE.md](CONSENT_VERIFICATION_TEMPLATE.md) - Full consent process
- [STORY_OWNERSHIP_AGREEMENT.md](STORY_OWNERSHIP_AGREEMENT.md) - Legal ownership
- [USAGE_RIGHTS_TRACKER.md](USAGE_RIGHTS_TRACKER.md) - Track usage and compensation

### Technical
- [SQL_SETUP_GENERATOR.js](SQL_SETUP_GENERATOR.js) - Auto-generate setup scripts
- [SOCIAL_MEDIA_GENERATOR.js](SOCIAL_MEDIA_GENERATOR.js) - Auto-generate posts
- [OWNERSHIP_REGISTRY.js](OWNERSHIP_REGISTRY.js) - Blockchain registration

---

## Value Flow Models

### Model 1: Direct Revenue Share

**When story is used for funding:**
```javascript
{
  grant_application: {
    story_cited: "aunty-corrine-mount-isa-unpaid-expertise",
    grant_amount: 50000,
    storyteller_share: 5000, // 10%
    payment_method: "direct_transfer",
    paid_date: "2025-02-15"
  }
}
```

### Model 2: Story NFT Ownership

**Storyteller gets NFT representing ownership:**
```javascript
{
  nft_id: "story-001",
  owner: "0xStorytellerWallet",
  story_id: "aunty-corrine-mount-isa-unpaid-expertise",
  rights: [
    "full_ownership",
    "can_revoke_anytime",
    "can_modify_anytime",
    "receives_all_derivative_revenue"
  ],
  revenue_split: {
    platform_usage: "0%",  // Platform takes nothing
    grant_citations: "10%", // Storyteller gets 10% of grants that cite story
    media_licensing: "50%", // Storyteller gets 50% if media licenses
    book_deals: "50%"       // Storyteller gets 50% if published in book
  }
}
```

### Model 3: Attribution Credits

**Every time story is used, credit accumulated:**
```javascript
{
  storyteller: "Aunty Corrine",
  credits_earned: [
    { type: "grant_citation", grant_id: "NSW-2025-001", value: 5000 },
    { type: "media_mention", outlet: "Guardian", value: 500 },
    { type: "policy_reference", doc: "QLD Youth Justice Review", value: 2000 },
    { type: "speaking_invite", event: "Justice Summit 2025", value: 3000 }
  ],
  total_value_generated: 10500,
  payments_made: [
    { date: "2025-02-01", amount: 5000, method: "bank_transfer" },
    { date: "2025-03-01", amount: 5500, method: "bank_transfer" }
  ]
}
```

### Model 4: Community Fund Contribution

**Some storytellers prefer supporting community infrastructure:**
```javascript
{
  storyteller: "Aunty Corrine",
  preference: "community_fund",
  revenue_generated: 10000,
  distribution: {
    to_storyteller: 3000,     // 30% direct
    to_mount_isa_fund: 7000   // 70% to Mount Isa Aunties infrastructure fund
  }
}
```

---

## Ownership Registry System

### Why It Matters

Traditional media extracts stories and gives nothing back. We flip this:

**Old Model:**
1. Journalist interviews Elder
2. Article published in newspaper
3. Newspaper owns copyright
4. Elder gets nothing
5. Story used for grants/policy/research
6. Elder gets nothing

**New Model:**
1. Community storyteller shares knowledge
2. Story published on JusticeHub
3. **Storyteller owns copyright (registered on-chain)**
4. **NFT proves ownership**
5. Story used for grants → **Storyteller gets %**
6. Story cited in policy → **Storyteller credited & compensated**
7. Media wants to license → **Storyteller negotiates & gets paid**

### How to Register Ownership

**Simple Version (Database Only):**

```sql
-- Create ownership record
INSERT INTO story_ownership (
  story_id,
  storyteller_name,
  storyteller_contact,
  ownership_type,
  revenue_share_percent,
  can_revoke,
  consent_date
) VALUES (
  'aunty-corrine-mount-isa-unpaid-expertise',
  'Aunty Corrine',
  'via.justicehub@example.com',
  'full_ownership_with_platform_license',
  10, -- 10% of any revenue
  true,
  NOW()
);
```

**Advanced Version (Blockchain + NFT):**

```javascript
// Mint story ownership NFT
const ownershipNFT = await mintStoryNFT({
  storyteller_wallet: "0x...",
  story_metadata: {
    title: "I Need Voices Behind Me",
    storyteller: "Aunty Corrine",
    location: "Mount Isa, Queensland",
    date: "2025-01-15",
    story_url: "justicehub.au/stories/aunty-corrine-mount-isa-unpaid-expertise"
  },
  rights: {
    ownership: "storyteller",
    platform_license: "non_exclusive",
    revocable: true,
    revenue_share: 10
  }
});

// Result: Storyteller gets NFT in their wallet proving ownership
// Platform gets license to publish
// Smart contract enforces revenue sharing automatically
```

---

## Scaling the Process

### For 1-5 Stories/Year (Manual Process)

**Use this workflow:**
1. Record conversations manually
2. Use templates to analyze and draft
3. Get consent via email
4. Run SQL scripts manually
5. Track revenue in spreadsheet

**Time per story:** ~20 hours
**Team needed:** 1 person

### For 10-20 Stories/Year (Semi-Automated)

**Add these tools:**
1. Airtable for project management
2. Auto-transcription (Otter.ai API)
3. Template generators (scripts provided)
4. Database triggers for notifications
5. Monthly revenue reconciliation

**Time per story:** ~12 hours
**Team needed:** 1-2 people

### For 50+ Stories/Year (Fully Automated)

**Build platform features:**
1. Storyteller self-service portal
2. Automated consent workflow
3. AI-assisted analysis (quote extraction)
4. Auto-generated SQL and social posts
5. Smart contract revenue distribution
6. Community review process

**Time per story:** ~6 hours
**Team needed:** 2-3 people + community reviewers

---

## Quality Checklist

Before publishing any story, verify:

### Consent & Ownership
- [ ] Storyteller has reviewed and approved final draft
- [ ] Signed consent form on file
- [ ] Ownership registered (database or blockchain)
- [ ] Revenue sharing agreement in place
- [ ] They know how to revoke/modify

### Content Quality
- [ ] 40%+ direct quotes (storyteller's actual words)
- [ ] 3+ specific case studies or examples
- [ ] Systems failures evidenced, not just claimed
- [ ] Community expertise centered
- [ ] No deficit framing or pity narratives

### Technical Setup
- [ ] Story slug unique and meaningful
- [ ] All tags applied
- [ ] Profile/program linked (if exists)
- [ ] Images uploaded with proper alt text
- [ ] Mobile view tested
- [ ] Links all work

### Value Tracking
- [ ] Revenue share % documented
- [ ] Payment method confirmed
- [ ] Usage tracking enabled
- [ ] First payment scheduled (if applicable)

### Privacy & Safety
- [ ] Young people's identities protected
- [ ] No identifying information without consent
- [ ] Location details appropriate
- [ ] Safe for storyteller to be publicly associated

---

## Common Patterns

### Pattern 1: Elder Knowledge Story
**Example:** Aunty Corrine
**Focus:** Unpaid expertise, systems failures, what's needed
**Tags:** Elder-knowledge, Community-led, Indigenous-leadership
**Length:** 3,000-4,000 words
**Revenue model:** Grant citation share

### Pattern 2: Program Success Story
**Example:** Bourke Maranguka
**Focus:** What works, evidence, scalability
**Tags:** Community-led, Evidence, Justice-reinvestment
**Length:** 2,500-3,500 words
**Revenue model:** Media licensing share

### Pattern 3: Young Person Journey
**Example:** Steven (from Aunty Corrine story)
**Focus:** Individual transformation, system navigation
**Tags:** Youth-justice, Personal-story, Transformation
**Length:** 2,000-2,500 words
**Revenue model:** Speaking opportunities for young person

### Pattern 4: Systems Critique
**Example:** Cleveland Detention failures
**Focus:** What doesn't work, why, alternatives
**Tags:** Systems-critique, Youth-justice, Policy
**Length:** 1,500-2,000 words
**Revenue model:** Policy consultation fees

---

## Next Steps

### Immediate (This Week)
1. **Read all templates** - Understand the workflow
2. **Identify 2-3 potential storytellers** - Who has knowledge to share?
3. **Test the process** - Do one story start to finish

### Short-term (This Month)
4. **Set up ownership registry** - Database table or blockchain
5. **Create revenue tracking system** - How will you track and pay?
6. **Build storyteller portal** - Where they can see their stories and revenue

### Medium-term (3 Months)
7. **Publish 5-10 stories** - Build the evidence base
8. **Test revenue sharing** - Actually pay storytellers from grants/usage
9. **Refine templates** - Based on what works

### Long-term (6-12 Months)
10. **Automate workflow** - Build platform features
11. **Community ownership** - Let community review and approve stories
12. **Scale nationally** - Replicate across regions

---

## Support & Resources

### Get Help
- **Templates:** All in this package
- **Scripts:** See `/scripts/storytelling/` directory
- **Examples:** Aunty Corrine story as reference
- **Community:** JusticeHub Storytellers Slack/Discord

### Further Reading
- **Ownership:** [STORY_OWNERSHIP_FRAMEWORK.md](STORY_OWNERSHIP_FRAMEWORK.md)
- **Ethics:** [ETHICAL_STORYTELLING_GUIDE.md](ETHICAL_STORYTELLING_GUIDE.md)
- **Revenue:** [REVENUE_SHARING_MODELS.md](REVENUE_SHARING_MODELS.md)
- **Blockchain:** [BLOCKCHAIN_OWNERSHIP_GUIDE.md](BLOCKCHAIN_OWNERSHIP_GUIDE.md)

---

**You now have a replicable system.** Follow this workflow for every story. Protect ownership. Share value. Center community voice.
