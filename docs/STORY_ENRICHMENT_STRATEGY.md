# JusticeHub Story Enrichment Strategy

**Goal:** Increase from 1 to 50+ published stories from real people with lived experience  
**Timeline:** 30 days to MVP, 90 days to full enrichment  
**Method:** Empathy Ledger API + Direct Onboarding + Partner Organizations

---

## 📊 Current State

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Published Stories | 1 | 50+ | 49 |
| Public Profiles | 34 | 100+ | 66 |
| Storytellers with JusticeHub consent | Unknown | 50+ | ? |
| Organizations contributing | 3 | 20+ | 17 |
| Geographic coverage | Limited | National | Expand |

---

## 🎯 STRATEGY OVERVIEW

### Three-Pronged Approach

```
                    STORY ENRICHMENT
                           │
           ┌───────────────┼───────────────┐
           │               │               │
      ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
      │   API   │    │ DIRECT  │    │ PARTNER │
      │  SYNC   │    │ONBOARD  │    │   ORGS  │
      └────┬────┘    └────┬────┘    └────┬────┘
           │               │               │
    ┌──────▼──────┐  ┌────▼────┐  ┌──────▼──────┐
    │• Auto-sync  │  │• Forms  │  │• Bulk upload │
    │  existing   │  │• Inter- │  │• Training   │
    │  stories    │  │  views   │  │• Support    │
    │• Scheduled  │  │• Events  │  │             │
    └─────────────┘  └─────────┘  └─────────────┘
```

---

## 📡 PRONG 1: EMPATHY LEDGER API SYNC

### What It Does
Automatically pulls stories from Empathy Ledger that have:
- `is_public = true`
- `privacy_level = 'public'`
- `justicehub_enabled = true` (for profiles)

### Current Status
✅ **Already implemented** in:
- `/api/empathy-ledger/profiles`
- `/api/empathy-ledger/stories`
- `lib/supabase/empathy-ledger.ts`

### Action Items

#### 1.1 Run Immediate Sync
```bash
# Sync existing profiles
node scripts/sync-empathy-ledger.mjs

# Expected result: 34 profiles → JusticeHub public_profiles
```

#### 1.2 Schedule Automated Sync
```bash
# Add to crontab (runs daily at 3am)
0 3 * * * cd /Users/benknight/Code/JusticeHub && node scripts/sync-empathy-ledger.mjs >> logs/sync.log 2>&1
```

#### 1.3 Increase Consent Rate
**Problem:** Only some storytellers have `justicehub_enabled = true`

**Solution:** Email campaign to existing storytellers
```
Subject: Share Your Story on JusticeHub - Youth Justice Platform

Hi [Name],

Your story on Empathy Ledger is powerful. Would you like it featured on 
JusticeHub - a platform connecting communities with youth justice solutions?

JusticeHub reaches:
• Policymakers
• Researchers  
• Other young people
• Community organizations

[Enable JusticeHub Sharing] ← Link sets justicehub_enabled=true
```

---

## 👥 PRONG 2: DIRECT STORYTELLER ONBOARDING

### What It Does
Directly onboard new storytellers who aren't in Empathy Ledger yet.

### Target Audiences

| Audience | Why They Matter | How to Reach |
|----------|----------------|--------------|
| **Youth with lived experience** | Authentic voices | Youth orgs, events |
| **Parents/families** | Family perspective | Support groups |
| **Youth workers** | Frontline insights | Professional networks |
| **Elders** | Cultural wisdom | Community orgs |
| **Legal advocates** | System perspective | Legal services |

### Onboarding Workflow

```
┌─────────────────────────────────────────────────────────────┐
│              STORYTELLER ONBOARDING FLOW                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. DISCOVERY                                               │
│     ├── Partner organizations identify candidates           │
│     ├── JusticeHub team does outreach at events            │
│     └── Online form: "Share Your Story"                    │
│                                                             │
│  2. CONSENT & CULTURAL SAFETY                               │
│     ├── Explain consent levels (Private/Community/Public)  │
│     ├── Cultural protocol check (if Indigenous)            │
│     └── Elder approval (if required)                       │
│                                                             │
│  3. STORY CAPTURE                                           │
│     ├── Interview (recorded)                               │
│     ├── Written submission                                 │
│     └── Video/audio (if comfortable)                       │
│                                                             │
│  4. CURATION                                                │
│     ├── Transcribe & edit with storyteller                 │
│     ├── Fact-check (with consent)                          │
│     └── Add themes, location, tags                         │
│                                                             │
│  5. PUBLICATION                                             │
│     ├── Publish to Empathy Ledger                          │
│     ├── Mark justicehub_enabled=true                       │
│     └── Sync to JusticeHub                                 │
│                                                             │
│  6. FOLLOW-UP                                               │
│     ├── Thank you & share link                             │
│     ├── Ongoing consent check                              │
│     └── Community connection                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tools Needed

#### A. Storyteller Onboarding Form
Create at: `/share-your-story` route

**Fields:**
- Name (or anonymous option)
- Email
- Phone
- Cultural background
- Location
- Story type (youth, parent, worker, advocate, other)
- Brief story summary
- Consent preferences
- Contact permission

#### B. Interview Guide
Create: `docs/STORYTELLER_INTERVIEW_GUIDE.md`

**Key Questions:**
1. Tell us about yourself (background, community)
2. What brought you into contact with youth justice?
3. What was your experience like?
4. What worked? What didn't?
5. What would you change about the system?
6. What gives you hope?
7. What do you want others to know?

#### C. Consent Form Template
Create: `docs/STORYTELLER_CONSENT_FORM.md`

**Consent Levels:**
- **Private:** Only for research, never published
- **Community:** Published but attribution controlled
- **Public:** Full publication with name/photo

---

## 🤝 PRONG 3: PARTNER ORGANIZATIONS

### Target Partners

| Organization Type | Examples | Story Potential |
|-------------------|----------|-----------------|
| **Aboriginal Legal Services** | NATSILS, VALS, ALS | High - client stories |
| **Youth Services** | Oochiumpa, Youth Off The Streets | High - youth voices |
| **Community Orgs** | SNAICC, QATSICPP | High - community stories |
| **Legal Aid** | State legal aid commissions | Medium - case stories |
| **Research Orgs** | AIC, universities | Medium - participant stories |
| **Advocacy Orgs** | Amnesty, Human Rights Law Centre | Medium - advocate stories |

### Partner Package

Create: `docs/PARTNER_STORY_PACKAGE.md`

**Includes:**
1. **Training materials**
   - How to conduct ethical storytelling interviews
   - Cultural safety protocols
   - Consent management

2. **Technology setup**
   - Empathy Ledger account
   - Recording equipment (if needed)
   - Upload training

3. **Ongoing support**
   - Monthly check-ins
   - Story review & feedback
   - Publication coordination

4. **Recognition**
   - Partner badge on JusticeHub
   - Co-branding on stories
   - Annual partner report

### Bulk Upload Process

For partners with multiple stories:

```bash
# Partner provides CSV with story metadata
# Script uploads to Empathy Ledger in bulk

node scripts/bulk-upload-stories.mjs --partner="NATSILS" --file="natsils-stories.csv"
```

---

## 🔄 AUTOMATED WORKFLOWS

### Daily Sync Job
```bash
#!/bin/bash
# /etc/cron.d/justicehub-story-sync

# 3am - Sync Empathy Ledger profiles
0 3 * * * cd /Users/benknight/Code/JusticeHub && node scripts/sync-empathy-ledger.mjs >> logs/sync.log 2>&1

# 4am - Sync stories
0 4 * * * cd /Users/benknight/Code/JusticeHub && node scripts/sync-empathy-ledger-stories.mjs >> logs/sync.log 2>&1

# 5am - Update narrative scores
0 5 * * * cd /Users/benknight/Code/JusticeHub && node scripts/update-narrative-scores.mjs >> logs/sync.log 2>&1
```

### Story Quality Pipeline
```
New Story Submitted
        │
        ▼
┌───────────────┐
│ Auto-check    │───► Flag issues (missing consent, etc.)
│ Basic quality │
└───────────────┘
        │
        ▼
┌───────────────┐
│ Human review  │───► Curator edits with storyteller
│ & curation    │
└───────────────┘
        │
        ▼
┌───────────────┐
│ Publish to    │
│ Empathy Ledger│
└───────────────┘
        │
        ▼
┌───────────────┐
│ Auto-sync to  │
│ JusticeHub    │
└───────────────┘
        │
        ▼
┌───────────────┐
│ Update        │
│ narrative     │
│ scores        │
└───────────────┘
```

---

## 📈 TARGETS & MILESTONES

### 30-Day MVP (February 2026)

| Week | Target | Actions |
|------|--------|---------|
| **Week 1** | 10 stories | • Sync existing Empathy Ledger stories<br>• Email existing storytellers for consent<br>• Set up onboarding form |
| **Week 2** | 20 stories | • Partner with 3 organizations<br>• Conduct 5 interviews<br>• Set up partner training |
| **Week 3** | 35 stories | • Partner with 5 more orgs<br>• Host storytelling event<br>• Bulk upload partner stories |
| **Week 4** | 50 stories | • Review & curate all stories<br>• Publish 50th story celebration<br>• Plan phase 2 |

### 90-Day Full Enrichment (May 2026)

| Month | Target | Focus |
|-------|--------|-------|
| **Month 1** | 50 stories | MVP completion |
| **Month 2** | 100 stories | Scale partner network |
| **Month 3** | 150 stories | National coverage + international |

---

## 🛠️ TECHNICAL IMPLEMENTATION

### Scripts to Create

1. **`scripts/sync-empathy-ledger-stories.mjs`**
   - Sync stories (not just profiles)
   - Handle media attachments
   - Update narrative scores

2. **`scripts/bulk-upload-stories.mjs`**
   - CSV import for partners
   - Validation & error handling
   - Progress reporting

3. **`scripts/story-quality-check.mjs`**
   - Check for raw transcripts
   - Validate consent flags
   - Score story quality

4. **`scripts/update-narrative-scores.mjs`**
   - Calculate narrative scores from story counts
   - Update ALMA alpha signals
   - Generate report

### Database Changes

```sql
-- Add story count to interventions for narrative scoring
ALTER TABLE alma_interventions 
ADD COLUMN story_count INTEGER DEFAULT 0;

-- Create story-intervention link table
CREATE TABLE story_intervention_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT NOT NULL, -- Empathy Ledger story ID
  intervention_id UUID REFERENCES alma_interventions(id),
  link_type TEXT CHECK (link_type IN ('features', 'mentions', 'operates', 'experienced')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for quick lookups
CREATE INDEX idx_story_intervention_links_intervention 
ON story_intervention_links(intervention_id);
```

---

## 📝 CONTENT GUIDELINES

### Story Quality Standards

**Minimum Requirements:**
- ✅ 500+ words (or 5+ min audio/video)
- ✅ Clear narrative arc
- ✅ Specific details (not generic)
- ✅ Proper consent documented
- ✅ Fact-checked (if claims made)

**Preferred Elements:**
- 🌟 Personal transformation
- 🌟 Specific program/organization mentions
- 🌟 Cultural context
- 🌟 Lessons learned
- 🌟 Call to action

**Avoid:**
- ❌ Raw transcripts without curation
- ❌ Third-person stories (unless authorized)
- ❌ Unsubstantiated claims about programs
- ❌ Content without proper consent

### Thematic Tags

**Standard Tags:**
- Youth experience
- Parent/family perspective
- Worker/advocate perspective
- Cultural connection
- System navigation
- Diversion program
- Detention experience
- Rehabilitation
- Education/employment
- Mental health
- Housing
- Drug & alcohol

---

## 📊 SUCCESS METRICS

### Quantitative

| Metric | Baseline | 30 Days | 90 Days |
|--------|----------|---------|---------|
| Published stories | 1 | 50 | 150 |
| Active storytellers | 34 | 75 | 200 |
| Partner organizations | 3 | 10 | 25 |
| Geographic coverage | 3 states | 6 states | All 8 |
| Story views | Unknown | 1,000 | 10,000 |

### Qualitative

- **Diversity:** Range of voices (youth, parents, workers, Elders)
- **Authenticity:** First-person narratives preferred
- **Impact:** Stories cited in policy/research
- **Community:** Storytellers feel heard and valued

---

## 🚀 IMMEDIATE NEXT STEPS

### Today (February 9)

1. ✅ **Run sync:** `node scripts/sync-empathy-ledger.mjs`
2. ✅ **Check result:** How many profiles synced?
3. ✅ **Check stories:** How many stories available?

### This Week

1. Create onboarding form (`/share-your-story`)
2. Email existing storytellers for consent
3. Contact 3 target partner organizations
4. Set up daily sync cron job

### This Month

1. Reach 50 stories
2. Onboard 10 partner organizations
3. Host 1 storytelling event
4. Create story curation guidelines

---

## 📞 SUPPORT & RESOURCES

### Internal
- **Empathy Ledger docs:** See `lib/supabase/empathy-ledger.ts`
- **Sync scripts:** `scripts/sync-empathy-ledger*.mjs`
- **API routes:** `/api/empathy-ledger/*`

### External
- **Empathy Ledger platform:** https://empathy-ledger.org
- **Training materials:** (create `docs/STORYTELLER_TRAINING/`)
- **Partner resources:** (create `docs/PARTNER_RESOURCES/`)

---

**Ready to start? Run:**
```bash
node scripts/sync-empathy-ledger.mjs
```

**Questions?** Check the logs at `logs/sync.log`
