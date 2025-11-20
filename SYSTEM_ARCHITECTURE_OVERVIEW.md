# JusticeHub Storytelling System - Complete Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN INTERFACE                      │
│              (Next.js 14 App Router)                    │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────────┐
│  Traditional  │   │   AI-Assisted     │
│     Flow      │   │      Flow         │
└───────────────┘   └───────────────────┘
        │                   │
        │                   ▼
        │       ┌──────────────────────┐
        │       │ 1. Upload Transcript │
        │       │   /admin/stories/    │
        │       │    transcript        │
        │       └──────────┬───────────┘
        │                  │
        │                  ▼
        │       ┌──────────────────────┐
        │       │ 2. AI Extraction     │
        │       │  /api/stories/       │
        │       │   extract-quotes     │
        │       │                      │
        │       │  Claude extracts:    │
        │       │  • Quotes            │
        │       │  • Themes            │
        │       │  • Case studies      │
        │       └──────────┬───────────┘
        │                  │
        │                  ▼
        │       ┌──────────────────────┐
        │       │ 3. Review & Edit     │
        │       │  Extracted data      │
        │       │  shown to editor     │
        │       └──────────┬───────────┘
        │                  │
        └──────────────────┘
                  │
                  ▼
        ┌──────────────────────┐
        │ 4. Rich Text Editor  │
        │  /admin/stories/new  │
        │                      │
        │  • Novel Editor      │
        │  • Image upload      │
        │  • Tags & categories │
        │  • SEO fields        │
        └──────────┬───────────┘
                  │
                  ▼
        ┌──────────────────────┐
        │ 5. Save to Database  │
        │                      │
        │  articles table      │
        │  + ownership table   │
        │  + revenue tracking  │
        └──────────┬───────────┘
                  │
                  ▼
        ┌──────────────────────┐
        │ 6. Published Story   │
        │  /stories/[slug]     │
        └──────────────────────┘
```

---

## Data Flow

### Current System (What You Have)

```
User Login
   ↓
Admin Check (users table: user_role = 'admin')
   ↓
/admin/stories/new
   ↓
Novel Editor (Rich text editing)
   ↓
Form Data:
  - title, slug, excerpt
  - content (HTML)
  - featured_image_url
  - tags[], categories, category
  - seo_title, seo_description
   ↓
Save to articles table
  - author_id (from public_profiles)
  - reading_time_minutes (calculated)
  - status (draft/published)
   ↓
Published at /stories/[slug]
```

### Enhanced System (What You're Adding)

```
User Login
   ↓
Admin Check
   ↓
Choose Path:
   ├─→ Blank Story (/admin/stories/new)
   │
   └─→ From Transcript (/admin/stories/transcript)
         ↓
      1. Input:
         - Storyteller name
         - Storyteller contact
         - Transcript text OR audio file
         ↓
      2. POST /api/stories/extract-quotes
         {
           transcript: string,
           storytellerName: string
         }
         ↓
      3. Claude Analysis (30-60 sec)
         → Extracts quotes by theme
         → Identifies key themes
         → Finds case studies
         → Returns JSON structure
         ↓
      4. Display Extracted Data:
         ✓ 15-20 quotes with themes
         ✓ 5-7 key themes identified
         ✓ 3-5 case studies found
         ↓
      5. Store in localStorage:
         {
           storytellerName,
           storytellerContact,
           quotes: [...],
           themes: [...],
           case_studies: [...]
         }
         ↓
      6. Navigate to /admin/stories/new?from=transcript
         ↓
      7. useEffect detects ?from=transcript
         → Loads data from localStorage
         → Pre-fills editor with:
           - Title: "Story: [Name]"
           - Content: Formatted quotes + themes
         → Clears localStorage
         ↓
      8. Editor allows manual editing
         → Add narrative around quotes
         → Reorganize sections
         → Add images
         → Refine structure
         ↓
      9. Save to articles table
         (same as traditional flow)
         ↓
     10. Optional: Create ownership record
         story_ownership table:
         - story_id (article slug)
         - storyteller_name
         - storyteller_contact
         - revenue_share_percent
         - consent_status
```

---

## Database Schema

### Existing Tables (You Have)

```sql
articles
├── id (UUID)
├── title (TEXT)
├── slug (TEXT, unique)
├── excerpt (TEXT)
├── content (TEXT) -- HTML from rich text editor
├── featured_image_url (TEXT)
├── featured_image_caption (TEXT)
├── author_id (UUID → public_profiles.id)
├── status (TEXT: draft|published)
├── published_at (TIMESTAMP)
├── reading_time_minutes (INTEGER)
├── tags (TEXT[])
├── categories (TEXT[])
├── category (TEXT)
├── seo_title (TEXT)
├── seo_description (TEXT)
├── view_count (INTEGER)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

public_profiles
├── id (UUID)
├── user_id (UUID → auth.users)
├── full_name (TEXT)
├── slug (TEXT)
└── ... (other profile fields)

users
├── id (UUID)
├── user_role (TEXT: admin|user)
└── ... (other user fields)
```

### New Tables (You're Adding)

```sql
story_workspaces -- For AI workflow
├── id (UUID)
├── working_title (TEXT)
├── storyteller_name (TEXT)
├── storyteller_contact (TEXT)
├── transcript_text (TEXT) -- Original transcript
├── audio_file_url (TEXT) -- If uploaded audio
├── interview_date (DATE)
├── interviewer_id (UUID → public_profiles.id)
├── extracted_quotes (JSONB) -- AI extraction results
│   └── [{text, theme, strength}]
├── key_themes (JSONB)
│   └── [{name, description, quote_examples}]
├── case_studies (JSONB)
│   └── [{title, description, key_points}]
├── draft_content (TEXT) -- AI-generated draft (optional)
├── status (TEXT) -- workflow status
├── published_article_id (TEXT → articles.slug)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

story_ownership -- Track storyteller ownership
├── id (UUID)
├── story_id (TEXT → articles.slug)
├── storyteller_name (TEXT)
├── storyteller_email (TEXT)
├── storyteller_phone (TEXT)
├── revenue_share_percent (INTEGER) -- e.g., 10 for 10%
├── payment_method (TEXT) -- bank_transfer, crypto, etc.
├── consent_date (TIMESTAMP)
├── consent_status (TEXT) -- pending, approved, revoked
├── total_revenue_generated (DECIMAL)
├── total_revenue_paid (DECIMAL)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

story_revenue_events -- Track when stories generate value
├── id (UUID)
├── story_id (TEXT → articles.slug)
├── ownership_id (UUID → story_ownership.id)
├── event_type (TEXT) -- grant_citation, media_license, etc.
├── event_date (DATE)
├── total_amount (DECIMAL) -- Full amount (e.g., $50,000 grant)
├── storyteller_share (DECIMAL) -- Their cut (e.g., $5,000)
├── payment_status (TEXT) -- pending, paid
├── source_organization (TEXT) -- Who paid/cited
└── created_at (TIMESTAMP)
```

---

## API Routes

### Existing (You Have)

```
GET  /api/auth/me
POST /api/upload-image
GET  /api/services/...
```

### New (You're Adding)

```
POST /api/stories/extract-quotes
├── Input:
│   {
│     transcript: string (5000-50000 chars ideal),
│     storytellerName: string
│   }
├── Process:
│   1. Auth check (admin only)
│   2. Call Claude API with prompt
│   3. Parse JSON response
│   4. Return structured data
└── Output:
    {
      success: boolean,
      data: {
        quotes: Quote[],
        themes: Theme[],
        case_studies: CaseStudy[]
      }
    }

POST /api/stories/transcript-upload (optional future)
├── Input: FormData with audio file
├── Process:
│   1. Upload to Supabase Storage
│   2. Call Deepgram for transcription
│   3. Save to story_workspaces
└── Output: { success, workspaceId, transcript }

POST /api/stories/generate-draft (optional future)
├── Input:
│   {
│     workspaceId: UUID,
│     storyAngle: string,
│     focusThemes: string[]
│   }
├── Process:
│   1. Fetch workspace with extracted data
│   2. Call Claude to write narrative draft
│   3. Update workspace.draft_content
└── Output: { success, draft: string (HTML) }
```

---

## File Structure

```
/Users/benknight/Code/JusticeHub/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── stories/
│   │   │   │   ├── page.tsx           # Stories list (YOU HAVE)
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx       # Rich text editor (YOU HAVE)
│   │   │   │   ├── transcript/        # NEW
│   │   │   │   │   └── page.tsx       # AI extraction UI
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Edit existing story (YOU HAVE)
│   │   │   └── page.tsx               # Admin dashboard (YOU HAVE)
│   │   └── api/
│   │       └── stories/               # NEW
│   │           ├── extract-quotes/
│   │           │   └── route.ts       # Claude quote extraction
│   │           ├── transcript-upload/  # Optional
│   │           │   └── route.ts
│   │           └── generate-draft/     # Optional
│   │               └── route.ts
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts              # YOU HAVE
│   │       └── server.ts              # YOU HAVE
│   └── components/
│       └── NovelEditor.tsx            # Rich text editor (YOU HAVE)
│
├── .env.local                         # EDIT: Add ANTHROPIC_API_KEY
└── supabase/
    └── migrations/
        └── 20250115_story_workspace.sql  # NEW: Run this migration
```

---

## Environment Variables

### Current

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

### Add These

```bash
# AI Services
ANTHROPIC_API_KEY=sk-ant-api03-...        # Required for quote extraction
DEEPGRAM_API_KEY=...                      # Optional: audio transcription
OPENAI_API_KEY=sk-...                     # Optional: alternative to Claude

# Webhook secrets (for future revenue tracking)
STRIPE_WEBHOOK_SECRET=whsec_...           # Optional: payment webhooks
```

---

## User Flows

### Flow 1: Traditional Story Creation (Existing)

```
1. Login → /admin/stories
2. Click "Create Story"
3. Opens /admin/stories/new
4. Type in rich text editor
5. Add images, tags, metadata
6. Click "Save Draft" or "Publish Now"
7. Story saved to articles table
8. Redirects to /admin/stories
```

### Flow 2: AI-Assisted Story Creation (New)

```
1. Login → /admin/stories
2. Click "From Transcript (AI)"
3. Opens /admin/stories/transcript

4. Fill in storyteller info:
   - Name: "Aunty Corrine"
   - Contact: "via.justicehub@example.com"

5. Paste transcript (1000-10000 words ideal)

6. Click "Extract Quotes with AI"
   → Spinner shows for 30-60 seconds
   → Claude analyzes transcript

7. Review extracted data:
   ✓ 18 quotes organized by theme
   ✓ 6 key themes identified
   ✓ 4 case studies found

8. Click "Create Story with These Quotes"
   → Data saved to localStorage
   → Redirects to /admin/stories/new?from=transcript

9. Editor opens with pre-filled content:
   - Title: "Story: Aunty Corrine"
   - Content: Formatted quotes and themes

10. Edit and refine:
    - Add narrative between quotes (60%)
    - Keep quotes intact (40%)
    - Add images
    - Reorganize sections

11. Click "Save Draft" or "Publish Now"
    → Saves to articles table
    → Optional: Create ownership record

12. Story published at /stories/[slug]
```

### Flow 3: Ownership & Revenue Tracking (New - Optional)

```
1. Story published with slug: "aunty-corrine-story"

2. Admin creates ownership record:
   INSERT INTO story_ownership (
     story_id = 'aunty-corrine-story',
     storyteller_name = 'Aunty Corrine',
     storyteller_email = 'email@example.com',
     revenue_share_percent = 10
   )

3. Grant application cites story

4. Admin logs revenue event:
   INSERT INTO story_revenue_events (
     story_id = 'aunty-corrine-story',
     event_type = 'grant_citation',
     total_amount = 50000,
     storyteller_share = 5000,
     source_organization = 'NSW Government'
   )

5. Payment processed to storyteller
   UPDATE story_revenue_events
   SET payment_status = 'paid'

6. Storyteller dashboard shows:
   - Total revenue generated: $50,000
   - Their share: $5,000
   - Payment status: Paid
```

---

## Cost Analysis

### Current System Cost

- **Time per story:** 5-8 hours (interview, transcribe, extract, write, edit)
- **Money cost:** $0 (all manual labor)

### Enhanced System Cost

**Time:**
- Interview: 1.5 hours (same)
- Transcript: 0 hours (paste into form)
- AI extraction: 1 minute (vs 2 hours manual)
- AI draft (optional): 30 seconds (vs 3 hours manual)
- Edit & refine: 2 hours (vs 3 hours)
- **Total: ~3.5 hours** (was 5-8 hours)
- **Time saved: 2-5 hours per story**

**Money:**
- Claude API (quote extraction): $0.10-0.30
- Claude API (draft generation): $0.30-0.50
- Deepgram (audio transcription): $0.05/min × 60 min = $3.00
- **Total: ~$3.50-4.00 per story**

**ROI:**
At $50/hour value of time:
- Time saved: 2-5 hours × $50 = $100-250
- Cost: $4
- **Net savings: $96-246 per story**

---

## Security & Permissions

### Row Level Security (RLS)

```sql
-- Only admins can manage story workspaces
CREATE POLICY "Admins manage workspaces"
  ON story_workspaces FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.user_role = 'admin'
  ));

-- Only admins can manage ownership records
CREATE POLICY "Admins manage ownership"
  ON story_ownership FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.user_role = 'admin'
  ));

-- Storytellers can view their own ownership (future)
CREATE POLICY "Storytellers view own"
  ON story_ownership FOR SELECT
  USING (storyteller_email = auth.jwt()->>'email');
```

### API Authentication

All API routes check:
1. User is authenticated (`supabase.auth.getUser()`)
2. User has admin role (`users.user_role = 'admin'`)
3. Request data is valid

---

## Monitoring & Analytics

### What to Track

```sql
-- Story performance
SELECT
  a.slug,
  a.title,
  a.view_count,
  a.reading_time_minutes,
  COUNT(sre.id) as revenue_events,
  SUM(sre.storyteller_share) as total_revenue_to_storyteller
FROM articles a
LEFT JOIN story_revenue_events sre ON a.slug = sre.story_id
WHERE a.status = 'published'
GROUP BY a.id
ORDER BY total_revenue_to_storyteller DESC;

-- AI usage stats
SELECT
  DATE(created_at) as date,
  COUNT(*) as extractions_run,
  AVG(ARRAY_LENGTH(extracted_quotes::jsonb, 1)) as avg_quotes_extracted
FROM story_workspaces
WHERE status != 'transcript_uploaded'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Storyteller dashboard (per storyteller)
SELECT
  so.storyteller_name,
  COUNT(DISTINCT so.story_id) as stories_published,
  SUM(so.total_revenue_generated) as total_value_generated,
  SUM(so.total_revenue_paid) as total_paid,
  (SUM(so.total_revenue_generated) - SUM(so.total_revenue_paid)) as outstanding
FROM story_ownership so
WHERE so.storyteller_email = 'email@example.com'
GROUP BY so.storyteller_name;
```

---

## Next Steps After Implementation

### Phase 1: Core AI Features (Weeks 1-2)
- [x] Database schema
- [ ] Quote extraction API
- [ ] Transcript upload UI
- [ ] Editor integration

### Phase 2: Ownership System (Weeks 2-3)
- [ ] Ownership table UI
- [ ] Revenue tracking forms
- [ ] Storyteller dashboard (read-only)

### Phase 3: Advanced Features (Month 2)
- [ ] Audio transcription integration
- [ ] Full draft generation
- [ ] Consent workflow automation
- [ ] Email notifications

### Phase 4: Scale & Automate (Month 3+)
- [ ] NFT ownership integration
- [ ] Smart contract revenue distribution
- [ ] Community governance (DAO)
- [ ] Multi-language support

---

**System is designed to be implemented incrementally. Start with quote extraction, add features as needed.**
