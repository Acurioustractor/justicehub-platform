# Quick Start: Add AI Storytelling to Your Current System
## Get Transcript → Story Pipeline Working in 1-2 Hours

## What This Adds to Your Current Admin

**Current flow:**
Login → `/admin/stories/new` → Type in rich text editor → Save

**New flow:**
Login → `/admin/stories/transcript` → Upload transcript → AI extracts quotes → AI drafts story → Edit in rich text editor → Save

---

## Step 1: Database Setup (15 minutes)

### Run this SQL in Supabase SQL Editor:

```bash
# Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
# Copy-paste this entire block:
```

```sql
-- Story development workspace
CREATE TABLE story_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  working_title TEXT,
  storyteller_name TEXT NOT NULL,
  storyteller_contact TEXT,
  transcript_text TEXT,
  transcript_file_url TEXT,
  audio_file_url TEXT,
  interview_date DATE,
  interviewer_id UUID REFERENCES public_profiles(id),

  -- AI extraction results
  extracted_quotes JSONB,
  case_studies JSONB,
  key_themes JSONB,

  -- Draft
  draft_content TEXT,
  draft_version INTEGER DEFAULT 1,

  -- Status
  status TEXT DEFAULT 'transcript_uploaded',
  published_article_id TEXT REFERENCES articles(slug),

  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ownership tracking
CREATE TABLE story_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT REFERENCES articles(slug) ON DELETE CASCADE,
  storyteller_name TEXT NOT NULL,
  storyteller_email TEXT,
  storyteller_phone TEXT,
  revenue_share_percent INTEGER DEFAULT 10,
  consent_date TIMESTAMP,
  consent_status TEXT DEFAULT 'pending',
  total_revenue_generated DECIMAL DEFAULT 0,
  total_revenue_paid DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Revenue events
CREATE TABLE story_revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT REFERENCES articles(slug),
  ownership_id UUID REFERENCES story_ownership(id),
  event_type TEXT NOT NULL,
  event_date DATE DEFAULT CURRENT_DATE,
  total_amount DECIMAL,
  storyteller_share DECIMAL,
  payment_status TEXT DEFAULT 'pending',
  source_organization TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS policies
ALTER TABLE story_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage workspaces"
  ON story_workspaces FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_role = 'admin'
  ));

ALTER TABLE story_ownership ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ownership"
  ON story_ownership FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_role = 'admin'
  ));

-- Indexes
CREATE INDEX idx_story_workspaces_status ON story_workspaces(status);
CREATE INDEX idx_story_ownership_story_id ON story_ownership(story_id);
```

**✅ Verify it worked:**
```sql
SELECT COUNT(*) FROM story_workspaces;
-- Should return 0 (table exists, no rows yet)
```

---

## Step 2: Install Dependencies (2 minutes)

```bash
cd /Users/benknight/Code/JusticeHub
npm install @anthropic-ai/sdk
```

---

## Step 3: Add Environment Variables (2 minutes)

Edit `.env.local`:

```bash
# Add this line:
ANTHROPIC_API_KEY=your_key_here

# Get key from: https://console.anthropic.com/settings/keys
```

---

## Step 4: Create API Route for Quote Extraction (10 minutes)

Create file: `src/app/api/stories/extract-quotes/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transcript, storytellerName } = await request.json();

    console.log('📝 Extracting quotes from transcript...');

    // Use Claude to extract quotes
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Extract powerful quotes and themes from this interview transcript.

STORYTELLER: ${storytellerName}

TRANSCRIPT:
${transcript}

Return JSON with this structure:
{
  "quotes": [
    {"text": "exact quote", "theme": "theme name", "strength": "why powerful"}
  ],
  "themes": [
    {"name": "theme", "description": "what it's about", "quote_examples": ["quote 1"]}
  ],
  "case_studies": [
    {"title": "title", "description": "what happened", "key_points": ["point 1"]}
  ]
}

Focus on:
- Community expertise
- Specific examples and stories
- Systems failures
- What's needed
Extract 15-20 quotes total.`
      }]
    });

    const content = message.content[0];
    const extractedData = JSON.parse(content.type === 'text' ? content.text : '{}');

    console.log('✅ Extracted:', extractedData);

    return NextResponse.json({
      success: true,
      data: extractedData
    });

  } catch (error: any) {
    console.error('❌ Error extracting quotes:', error);
    return NextResponse.json(
      { error: error.message || 'Extraction failed' },
      { status: 500 }
    );
  }
}
```

---

## Step 5: Create Simple Transcript Page (15 minutes)

Create file: `src/app/admin/stories/transcript/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function TranscriptToStoryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    storytellerName: '',
    storytellerContact: '',
    transcript: '',
  });
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  const handleExtract = async () => {
    setProcessing(true);

    try {
      const response = await fetch('/api/stories/extract-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: formData.transcript,
          storytellerName: formData.storytellerName
        }),
      });

      const data = await response.json();

      if (data.success) {
        setExtractedData(data.data);
      } else {
        alert('Extraction failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to extract quotes');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateStory = () => {
    // Store extracted data in localStorage
    localStorage.setItem('extracted_story_data', JSON.stringify({
      storytellerName: formData.storytellerName,
      storytellerContact: formData.storytellerContact,
      quotes: extractedData.quotes,
      themes: extractedData.themes,
      case_studies: extractedData.case_studies
    }));

    // Navigate to story editor
    router.push('/admin/stories/new?from=transcript');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="page-content pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <Link
            href="/admin/stories"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Stories
          </Link>

          <h1 className="text-4xl font-black text-black mb-2">
            Create Story from Transcript
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            AI will extract quotes, themes, and case studies from your transcript
          </p>

          {!extractedData ? (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
              <div className="space-y-6">
                {/* Storyteller Info */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Storyteller Name *
                  </label>
                  <input
                    type="text"
                    value={formData.storytellerName}
                    onChange={(e) => setFormData({ ...formData, storytellerName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black font-medium"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Contact (Email or Phone) *
                  </label>
                  <input
                    type="text"
                    value={formData.storytellerContact}
                    onChange={(e) => setFormData({ ...formData, storytellerContact: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black font-medium"
                    placeholder="email@example.com or phone number"
                  />
                </div>

                {/* Transcript */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Transcript *
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Paste the interview transcript below. AI will extract the key quotes, themes, and stories.
                  </p>
                  <textarea
                    value={formData.transcript}
                    onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                    rows={20}
                    placeholder="Paste transcript here..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.transcript.split(/\s+/).filter(Boolean).length} words
                  </p>
                </div>

                <button
                  onClick={handleExtract}
                  disabled={!formData.storytellerName || !formData.transcript || processing}
                  className="w-full px-6 py-4 bg-black text-white font-bold text-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Extracting Quotes & Themes...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Extract Quotes with AI
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Extracted Quotes */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
                <h2 className="text-2xl font-bold text-black mb-4">
                  ✨ Extracted Quotes ({extractedData.quotes?.length || 0})
                </h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {extractedData.quotes?.map((q: any, i: number) => (
                    <div key={i} className="p-4 bg-gray-50 border-l-4 border-black">
                      <p className="font-medium mb-2">"{q.text}"</p>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-black text-white font-bold">{q.theme}</span>
                        <span className="text-gray-600">{q.strength}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Themes */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
                <h2 className="text-2xl font-bold text-black mb-4">
                  🎯 Key Themes ({extractedData.themes?.length || 0})
                </h2>
                <div className="space-y-4">
                  {extractedData.themes?.map((t: any, i: number) => (
                    <div key={i} className="p-4 bg-blue-50 border-2 border-blue-300">
                      <h3 className="font-bold text-lg mb-2">{t.name}</h3>
                      <p className="text-sm text-gray-700">{t.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Case Studies */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
                <h2 className="text-2xl font-bold text-black mb-4">
                  📖 Case Studies ({extractedData.case_studies?.length || 0})
                </h2>
                <div className="space-y-4">
                  {extractedData.case_studies?.map((cs: any, i: number) => (
                    <div key={i} className="p-4 bg-green-50 border-2 border-green-300">
                      <h3 className="font-bold text-lg mb-2">{cs.title}</h3>
                      <p className="text-sm text-gray-700 mb-3">{cs.description}</p>
                      <ul className="text-sm space-y-1">
                        {cs.key_points?.map((point: string, j: number) => (
                          <li key={j} className="flex gap-2">
                            <span>•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setExtractedData(null)}
                  className="flex-1 px-6 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100"
                >
                  ← Back to Edit Transcript
                </button>
                <button
                  onClick={handleCreateStory}
                  className="flex-1 px-6 py-3 bg-black text-white font-bold hover:bg-gray-800"
                >
                  Create Story with These Quotes →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Step 6: Update Story Editor to Use Extracted Data (10 minutes)

Edit `src/app/admin/stories/new/page.tsx`:

Add this near the top of the component (around line 105):

```typescript
// Check if coming from transcript flow
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('from') === 'transcript') {
    const storedData = localStorage.getItem('extracted_story_data');
    if (storedData) {
      const data = JSON.parse(storedData);

      // Pre-fill with extracted data
      setFormData(prev => ({
        ...prev,
        title: `Story: ${data.storytellerName}`,
        content: `<h2>Story Notes</h2>
<p><strong>Storyteller:</strong> ${data.storytellerName}</p>
<p><strong>Contact:</strong> ${data.storytellerContact}</p>

<h2>Key Quotes</h2>
${data.quotes?.slice(0, 10).map(q => `<blockquote>"${q.text}"</blockquote>`).join('\n') || ''}

<h2>Themes</h2>
<ul>
${data.themes?.map(t => `<li><strong>${t.name}:</strong> ${t.description}</li>`).join('\n') || ''}
</ul>

<p><em>Use the quotes and themes above to craft your narrative. Start writing below...</em></p>
`
      }));

      // Clear stored data
      localStorage.removeItem('extracted_story_data');
    }
  }
}, []);
```

---

## Step 7: Add Link to Transcript Flow (2 minutes)

Edit `src/app/admin/stories/page.tsx`:

Update the "Create Story" button section (around line 77) to add both options:

```typescript
<div className="flex gap-4">
  <Link
    href="/admin/stories/transcript"
    className="px-6 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors border-2 border-blue-600 shadow-lg flex items-center gap-2"
  >
    <Sparkles className="w-5 h-5" />
    From Transcript (AI)
  </Link>
  <Link
    href="/admin/stories/new"
    className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black shadow-lg"
  >
    Blank Story
  </Link>
</div>
```

Don't forget to import Sparkles:
```typescript
import { Sparkles } from 'lucide-react';
```

---

## Step 8: Test It! (5 minutes)

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Login as admin:**
   Navigate to http://localhost:3000/login

3. **Go to transcript page:**
   http://localhost:3000/admin/stories/transcript

4. **Test with sample transcript:**
   ```
   Interviewer: Tell me about your work with young people in the justice system.

   Storyteller: I've been doing this for 20 years now. Twenty years. And you know what? I've had 25 young fellas come through my house. We call them MBBs - Misunderstood Black Boys. Because that's what they are. They're not bad kids. They're misunderstood.

   One boy, he sat in Cleveland Detention for four days without talking. Four days. Staff couldn't get a word out of him. I walked in, I said "What's your name, darling?" He looked up at me and said "I'm not allowed to say my name to white people."

   That's when I understood. These kids, they need someone who gets it. Someone who looks like them, who understands where they come from.

   Most of these 25 boys, they're doing good now. Most have gone back to their families. Most are independent. But you know what? I did all this unpaid. Twenty years, unpaid.

   The services, they get millions. Millions! For what? Tick-and-flick funding. They come in, they do their little assessment, they tick their boxes, they leave. Meanwhile, I'm the one answering calls at 2am.

   What do I need? I need voices behind me. Not just funding. Voices. People who will stand with me and say this work matters. Decision-making power. Not just a seat at the table - actual power to make changes.
   ```

5. **Click "Extract Quotes with AI"**

6. **Review extracted data**

7. **Click "Create Story with These Quotes"**

8. **See quotes pre-populated in editor!**

---

## What You Just Built

✅ **AI Quote Extraction** - Claude analyzes transcripts and pulls powerful quotes
✅ **Theme Identification** - Automatically finds patterns and themes
✅ **Case Study Recognition** - Identifies specific stories within transcript
✅ **Editor Integration** - Extracted data flows into your existing rich text editor
✅ **Storyteller Tracking** - Database tracks who owns which stories

---

## Next Steps

### Immediate (Optional)
- Add audio file upload (use Deepgram API for transcription)
- Add "Generate Full Draft" button (second AI call to write narrative)
- Add ownership panel to story editor

### Short-term
- Build storyteller dashboard (they can see their stories)
- Add consent workflow (send story for approval)
- Add revenue tracking UI

### Long-term
- NFT ownership integration
- Automated revenue distribution
- Community governance (DAO voting on stories)

---

## Cost Estimates

**Per story:**
- Quote extraction: ~$0.10-0.30 (Claude API)
- Draft generation: ~$0.30-0.50 (Claude API)
- Audio transcription: ~$0.05/min (Deepgram, if using audio)

**Total:** ~$0.50-1.00 per story with AI assistance

**Savings:**
- Manual quote extraction: 2-3 hours → 1 minute
- Draft writing: 3-4 hours → 30 seconds
- Total time saved: 5-7 hours per story

---

## Troubleshooting

**"Unauthorized" error:**
- Make sure you're logged in as admin
- Check users table has your user with `user_role = 'admin'`

**"API key not found":**
- Check `.env.local` has `ANTHROPIC_API_KEY=sk-ant-...`
- Restart dev server after adding env var

**Quotes not extracting:**
- Check console for errors
- Verify transcript has enough content (500+ words ideal)
- Check API key is valid at https://console.anthropic.com

**Database errors:**
- Verify SQL migration ran successfully
- Check Supabase logs at https://supabase.com/dashboard/project/YOUR_PROJECT/logs

---

## Support Files

All templates and detailed docs available:
- [BACKEND_ENHANCEMENT_PLAN.md](BACKEND_ENHANCEMENT_PLAN.md) - Full technical spec
- [STORYTELLING_WORKFLOW_TEMPLATE.md](STORYTELLING_WORKFLOW_TEMPLATE.md) - Complete workflow
- [STORY_OWNERSHIP_FRAMEWORK.md](STORY_OWNERSHIP_FRAMEWORK.md) - Ownership & revenue system

---

**You're ready!** Start with a simple transcript and watch AI extract the powerful community knowledge. 🚀
