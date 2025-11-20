# Backend Enhancement Plan
## Adding AI-Assisted Storytelling to Existing JusticeHub Admin

## Current System Analysis

### What You Have
✅ **Admin Interface:** `/admin/stories/new` - Rich text editor (Novel Editor)
✅ **Authentication:** Supabase auth with admin role checking
✅ **Database:** Articles table with fields for title, slug, content, tags, categories, etc.
✅ **Image Upload:** Working upload system via `/api/upload-image`
✅ **User Profiles:** `public_profiles` table linked to authors

### What's Missing for Community Storytelling
❌ **Transcript Processing:** No way to upload audio/transcripts
❌ **AI Quote Extraction:** No automated pull of powerful quotes
❌ **Ownership Tracking:** No storyteller ownership registry
❌ **Revenue Tracking:** No system for tracking value generated
❌ **Consent Management:** No formal consent workflow in database

---

## Enhancement Strategy

### Phase 1: Add Transcript → Story Pipeline (Week 1)
Add AI-powered workflow to transform transcripts into narrative drafts while maintaining storyteller ownership.

### Phase 2: Add Ownership Registry (Week 1-2)
Implement database tables and UI for tracking storyteller ownership and revenue sharing.

### Phase 3: Add AI Assistant Features (Week 2-3)
Build AI tools that help extract quotes, suggest structure, and draft sections.

---

## Detailed Implementation

### 1. Database Schema Extensions

```sql
-- Add to your Supabase migration

-- =========================================
-- STORY OWNERSHIP & CONSENT
-- =========================================

CREATE TABLE story_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT REFERENCES articles(slug) ON DELETE CASCADE,

  -- Storyteller information
  storyteller_name TEXT NOT NULL,
  storyteller_email TEXT,
  storyteller_phone TEXT,
  storyteller_wallet TEXT, -- for crypto payments

  -- Ownership details
  ownership_type TEXT DEFAULT 'full_ownership_with_platform_license',
  platform_license TEXT DEFAULT 'non_exclusive_revocable',
  can_modify BOOLEAN DEFAULT true,
  can_revoke BOOLEAN DEFAULT true,

  -- Revenue sharing
  revenue_share_percent INTEGER DEFAULT 10,
  payment_method TEXT DEFAULT 'bank_transfer', -- bank_transfer, crypto, community_fund
  payment_details JSONB,

  -- Consent tracking
  consent_form_url TEXT,
  consent_date TIMESTAMP,
  consent_expiry TIMESTAMP,
  consent_status TEXT DEFAULT 'pending', -- pending, approved, revoked

  -- Revenue tracking
  total_revenue_generated DECIMAL DEFAULT 0,
  total_revenue_paid DECIMAL DEFAULT 0,
  last_payment_date TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- STORY REVENUE EVENTS
-- =========================================

CREATE TABLE story_revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT REFERENCES articles(slug),
  ownership_id UUID REFERENCES story_ownership(id),

  -- Event details
  event_type TEXT NOT NULL, -- grant_citation, media_license, book_deal, speaking
  event_date DATE DEFAULT CURRENT_DATE,
  event_description TEXT,

  -- Revenue
  total_amount DECIMAL,
  storyteller_share DECIMAL,
  platform_share DECIMAL,

  -- Payment
  payment_status TEXT DEFAULT 'pending', -- pending, paid, declined
  payment_date TIMESTAMP,
  payment_reference TEXT,
  payment_notes TEXT,

  -- Source
  source_organization TEXT,
  source_contact TEXT,
  source_documentation_url TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- STORY USAGE LOG
-- =========================================

CREATE TABLE story_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT REFERENCES articles(slug),

  -- Usage details
  usage_type TEXT NOT NULL, -- grant_application, media_article, policy_document, presentation
  used_by TEXT,
  usage_date DATE DEFAULT CURRENT_DATE,
  usage_url TEXT,
  usage_description TEXT,

  -- Consent verification
  consent_verified BOOLEAN DEFAULT false,
  consent_verified_by UUID REFERENCES public_profiles(id),
  consent_verified_date TIMESTAMP,

  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- STORY DEVELOPMENT WORKSPACE
-- (For transcript → draft process)
-- =========================================

CREATE TABLE story_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  working_title TEXT,
  storyteller_name TEXT NOT NULL,
  storyteller_contact TEXT,

  -- Source materials
  transcript_text TEXT,
  transcript_file_url TEXT,
  audio_file_url TEXT,
  interview_date DATE,
  interviewer_id UUID REFERENCES public_profiles(id),

  -- AI Extraction Results
  extracted_quotes JSONB, -- Array of {quote, theme, line_number, speaker}
  case_studies JSONB,     -- Array of {title, description, key_points}
  key_themes JSONB,       -- Array of {theme, examples, quotes}

  -- Draft versions
  draft_content TEXT,
  draft_version INTEGER DEFAULT 1,

  -- Status tracking
  status TEXT DEFAULT 'transcript_uploaded',
  -- transcript_uploaded → quotes_extracted → draft_generated →
  -- sent_for_review → approved → published

  -- Linked to final article
  published_article_id TEXT REFERENCES articles(slug),

  -- Collaboration
  notes TEXT,
  internal_notes TEXT, -- Not shared with storyteller

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- RLS POLICIES
-- =========================================

-- Story ownership - admins can see all, storytellers can see their own
ALTER TABLE story_ownership ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all ownership records"
  ON story_ownership FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_role = 'admin'
  ));

CREATE POLICY "Storytellers can view their own ownership"
  ON story_ownership FOR SELECT
  USING (storyteller_email = auth.jwt()->>'email');

-- Story workspaces - admins only
ALTER TABLE story_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage workspaces"
  ON story_workspaces FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_role = 'admin'
  ));

-- Indexes for performance
CREATE INDEX idx_story_ownership_story_id ON story_ownership(story_id);
CREATE INDEX idx_story_ownership_storyteller_email ON story_ownership(storyteller_email);
CREATE INDEX idx_story_revenue_events_story_id ON story_revenue_events(story_id);
CREATE INDEX idx_story_workspaces_status ON story_workspaces(status);
CREATE INDEX idx_story_workspaces_storyteller_contact ON story_workspaces(storyteller_contact);
```

---

### 2. API Routes to Add

#### `/api/stories/transcript-upload`
Upload audio file or paste transcript text, optionally with AI transcription.

```typescript
// src/app/api/stories/transcript-upload/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: userData } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (userData?.user_role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audioFile') as File | null;
    const transcriptText = formData.get('transcriptText') as string | null;
    const storytellerName = formData.get('storytellerName') as string;
    const storytellerContact = formData.get('storytellerContact') as string;
    const interviewDate = formData.get('interviewDate') as string;

    let audioUrl = null;
    let transcript = transcriptText;

    // Upload audio file if provided
    if (audioFile) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('story-transcripts')
        .upload(`${Date.now()}-${audioFile.name}`, audioFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('story-transcripts')
        .getPublicUrl(uploadData.path);

      audioUrl = publicUrl;

      // If no transcript provided, use AI transcription
      if (!transcript) {
        // Call transcription service (Deepgram, AssemblyAI, etc.)
        const transcriptionResponse = await fetch('https://api.deepgram.com/v1/listen', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
            'Content-Type': 'audio/*'
          },
          body: audioFile
        });

        const transcriptionData = await transcriptionResponse.json();
        transcript = transcriptionData.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      }
    }

    // Get interviewer profile
    const { data: profile } = await supabase
      .from('public_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Create workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('story_workspaces')
      .insert({
        working_title: `${storytellerName} - ${new Date(interviewDate).toLocaleDateString()}`,
        storyteller_name: storytellerName,
        storyteller_contact: storytellerContact,
        transcript_text: transcript,
        audio_file_url: audioUrl,
        interview_date: interviewDate,
        interviewer_id: profile?.id,
        status: 'transcript_uploaded'
      })
      .select()
      .single();

    if (workspaceError) throw workspaceError;

    return NextResponse.json({
      success: true,
      workspaceId: workspace.id,
      message: 'Transcript uploaded successfully'
    });

  } catch (error: any) {
    console.error('Error uploading transcript:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
```

#### `/api/stories/extract-quotes`
AI-powered quote extraction from transcripts.

```typescript
// src/app/api/stories/extract-quotes/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = await request.json();

    // Get workspace
    const { data: workspace } = await supabase
      .from('story_workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Use Claude to extract quotes
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `You are helping extract powerful quotes from a community storyteller's interview transcript for a story about justice and community expertise.

TRANSCRIPT:
${workspace.transcript_text}

Please analyze this transcript and extract:

1. **15-20 Powerful Quotes** - Direct quotes that show:
   - Community expertise and knowledge
   - Systems failures or critiques
   - Specific examples and case studies
   - What's needed for change
   - Personal experience and wisdom

2. **5-7 Key Themes** - Main themes that emerge across the conversation

3. **3-5 Case Studies** - Specific stories or examples they share about:
   - Individual people (anonymize if needed)
   - Situations they've handled
   - Outcomes and impact

Format your response as JSON:

{
  "quotes": [
    {
      "text": "exact quote from transcript",
      "theme": "theme it relates to",
      "context": "brief context about what they're discussing",
      "strength": "why this quote is powerful"
    }
  ],
  "themes": [
    {
      "name": "theme name",
      "description": "what this theme is about",
      "quote_examples": ["quote 1", "quote 2"]
    }
  ],
  "case_studies": [
    {
      "title": "brief title",
      "description": "what happened",
      "key_points": ["point 1", "point 2"],
      "quotes": ["related quotes"]
    }
  ]
}

Focus on storyteller's actual words. Extract quotes verbatim. Identify patterns showing community expertise vs. system failures.`
      }]
    });

    const content = message.content[0];
    const extractedData = JSON.parse(content.type === 'text' ? content.text : '{}');

    // Update workspace with extracted data
    const { error: updateError } = await supabase
      .from('story_workspaces')
      .update({
        extracted_quotes: extractedData.quotes,
        key_themes: extractedData.themes,
        case_studies: extractedData.case_studies,
        status: 'quotes_extracted',
        updated_at: new Date().toISOString()
      })
      .eq('id', workspaceId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      data: extractedData
    });

  } catch (error: any) {
    console.error('Error extracting quotes:', error);
    return NextResponse.json(
      { error: error.message || 'Extraction failed' },
      { status: 500 }
    );
  }
}
```

#### `/api/stories/generate-draft`
AI-assisted draft generation from extracted quotes and themes.

```typescript
// src/app/api/stories/generate-draft/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, storyAngle, focusThemes } = await request.json();

    // Get workspace with extracted data
    const { data: workspace } = await supabase
      .from('story_workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Generate draft using Claude
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: `You are a skilled writer creating a story for JusticeHub about community expertise in the justice system.

STORYTELLER: ${workspace.storyteller_name}
STORY ANGLE: ${storyAngle || 'Community expertise vs. system failures'}

EXTRACTED QUOTES:
${JSON.stringify(workspace.extracted_quotes, null, 2)}

KEY THEMES:
${JSON.stringify(workspace.key_themes, null, 2)}

CASE STUDIES:
${JSON.stringify(workspace.case_studies, null, 2)}

FOCUS THEMES: ${focusThemes?.join(', ') || 'All themes'}

Please write a 2,500-3,000 word story following these guidelines:

**STYLE:**
- Literary journalism (scene-based, not abstract)
- 40% direct quotes (storyteller's actual words)
- 60% narrative connecting quotes
- Start with powerful scene or quote
- Use case studies as anchors for each section

**STRUCTURE:**
1. Opening (300 words) - Start with powerful moment/quote, introduce storyteller
2. Section 1 (400 words) - First major case study or theme
3. Section 2 (400 words) - Second major case study or theme
4. Section 3 (400 words) - Third major case study or theme
5. Section 4 (400 words) - Systems failures vs community knowledge
6. Section 5 (300 words) - What's needed, storyteller's vision
7. Closing (200 words) - Return to opening theme, forward-looking

**REQUIREMENTS:**
- Use storyteller's EXACT words for quotes (copy from extracted_quotes)
- No deficit framing or pity narratives
- Show community expertise, not just hardship
- Specific examples, not generalizations
- Storyteller's voice must dominate

**FORMAT:**
Return HTML formatted story ready for rich text editor:
- Use <h2> for section headings
- Use <p> for paragraphs
- Use <strong> for emphasis
- Use <blockquote> for pull quotes

Write the story now:`
      }]
    });

    const content = message.content[0];
    const draftHtml = content.type === 'text' ? content.text : '';

    // Update workspace
    const { error: updateError } = await supabase
      .from('story_workspaces')
      .update({
        draft_content: draftHtml,
        status: 'draft_generated',
        updated_at: new Date().toISOString()
      })
      .eq('id', workspaceId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      draft: draftHtml
    });

  } catch (error: any) {
    console.error('Error generating draft:', error);
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}
```

---

### 3. Enhanced Admin UI

#### New Page: `/admin/stories/transcript`
Upload transcript and start AI-assisted workflow.

```typescript
// src/app/admin/stories/transcript/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import { Upload, FileText, Mic, ArrowRight } from 'lucide-react';

export default function TranscriptUploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<'upload' | 'extracting' | 'drafting'>('upload');
  const [formData, setFormData] = useState({
    storytellerName: '',
    storytellerContact: '',
    interviewDate: '',
    transcriptText: '',
    audioFile: null as File | null,
  });
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  const handleUpload = async () => {
    const formDataObj = new FormData();
    formDataObj.append('storytellerName', formData.storytellerName);
    formDataObj.append('storytellerContact', formData.storytellerContact);
    formDataObj.append('interviewDate', formData.interviewDate);
    if (formData.transcriptText) {
      formDataObj.append('transcriptText', formData.transcriptText);
    }
    if (formData.audioFile) {
      formDataObj.append('audioFile', formData.audioFile);
    }

    const response = await fetch('/api/stories/transcript-upload', {
      method: 'POST',
      body: formDataObj,
    });

    const data = await response.json();
    if (data.success) {
      setWorkspaceId(data.workspaceId);
      handleExtractQuotes(data.workspaceId);
    }
  };

  const handleExtractQuotes = async (wsId: string) => {
    setStep('extracting');

    const response = await fetch('/api/stories/extract-quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId: wsId }),
    });

    const data = await response.json();
    if (data.success) {
      setExtractedData(data.data);
      setStep('drafting');
    }
  };

  const handleGenerateDraft = async () => {
    const response = await fetch('/api/stories/generate-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        storyAngle: 'Community expertise in action',
        focusThemes: extractedData?.themes?.map(t => t.name) || []
      }),
    });

    const data = await response.json();
    if (data.success) {
      // Redirect to workspace editor with draft
      router.push(`/admin/stories/workspace/${workspaceId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="page-content pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-black text-black mb-8">
            Create Story from Transcript
          </h1>

          {/* Progress Indicator */}
          <div className="mb-8 flex items-center justify-between">
            <div className={`flex-1 text-center ${step === 'upload' ? 'text-black font-bold' : 'text-gray-400'}`}>
              1. Upload
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className={`flex-1 text-center ${step === 'extracting' ? 'text-black font-bold' : 'text-gray-400'}`}>
              2. Extract
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className={`flex-1 text-center ${step === 'drafting' ? 'text-black font-bold' : 'text-gray-400'}`}>
              3. Draft
            </div>
          </div>

          {step === 'upload' && (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
              <h2 className="text-2xl font-bold mb-6">Storyteller Information</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Storyteller Name *</label>
                  <input
                    type="text"
                    value={formData.storytellerName}
                    onChange={(e) => setFormData({ ...formData, storytellerName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-black"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Contact (Email or Phone) *</label>
                  <input
                    type="text"
                    value={formData.storytellerContact}
                    onChange={(e) => setFormData({ ...formData, storytellerContact: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-black"
                    placeholder="email@example.com or +1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Interview Date *</label>
                  <input
                    type="date"
                    value={formData.interviewDate}
                    onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-black"
                  />
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-4">Upload Transcript</h2>
              <p className="text-sm text-gray-600 mb-6">
                Choose one: Upload audio file (we'll transcribe it) OR paste transcript text
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="border-2 border-dashed border-gray-300 p-8 text-center">
                  <Mic className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setFormData({ ...formData, audioFile: e.target.files?.[0] || null })}
                    className="hidden"
                    id="audio-upload"
                  />
                  <label htmlFor="audio-upload" className="cursor-pointer">
                    <div className="px-4 py-2 bg-black text-white font-bold inline-block">
                      Upload Audio
                    </div>
                  </label>
                  {formData.audioFile && (
                    <p className="text-sm mt-2">{formData.audioFile.name}</p>
                  )}
                </div>

                <div className="border-2 border-dashed border-gray-300 p-4">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <textarea
                    value={formData.transcriptText}
                    onChange={(e) => setFormData({ ...formData, transcriptText: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-black text-sm"
                    rows={8}
                    placeholder="Or paste transcript text here..."
                  />
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={!formData.storytellerName || !formData.storytellerContact ||
                         (!formData.audioFile && !formData.transcriptText)}
                className="w-full px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 disabled:opacity-50"
              >
                Start AI Processing →
              </button>
            </div>
          )}

          {step === 'extracting' && (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 text-center">
              <div className="animate-spin w-16 h-16 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold mb-2">Extracting Quotes & Themes</h2>
              <p className="text-gray-600">AI is analyzing the transcript... This takes about 30-60 seconds.</p>
            </div>
          )}

          {step === 'drafting' && extractedData && (
            <div className="space-y-6">
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
                <h2 className="text-2xl font-bold mb-4">Extracted Data</h2>

                <div className="mb-6">
                  <h3 className="font-bold mb-2">Quotes: {extractedData.quotes?.length || 0}</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {extractedData.quotes?.slice(0, 5).map((q, i) => (
                      <div key={i} className="p-3 bg-gray-50 border-l-4 border-black text-sm">
                        "{q.text}"
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-bold mb-2">Themes: {extractedData.themes?.length || 0}</h3>
                  <div className="flex flex-wrap gap-2">
                    {extractedData.themes?.map((t, i) => (
                      <span key={i} className="px-3 py-1 bg-black text-white text-sm font-bold">
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-bold mb-2">Case Studies: {extractedData.case_studies?.length || 0}</h3>
                  <div className="space-y-2">
                    {extractedData.case_studies?.map((cs, i) => (
                      <div key={i} className="p-3 bg-blue-50 border-2 border-blue-300">
                        <strong>{cs.title}</strong>
                        <p className="text-sm text-gray-700">{cs.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateDraft}
                  className="w-full px-6 py-3 bg-black text-white font-bold hover:bg-gray-800"
                >
                  Generate Story Draft →
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

### 4. Integration Points

#### Modify existing `/admin/stories/new/page.tsx`:

Add button to start from transcript:

```typescript
// Add to header section:
<div className="flex items-center gap-4">
  <Link
    href="/admin/stories/transcript"
    className="px-6 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700"
  >
    Start from Transcript
  </Link>
</div>
```

#### Add Ownership Tab to Story Editor:

```typescript
// New component: src/components/admin/OwnershipPanel.tsx
export function OwnershipPanel({ storySlug }: { storySlug: string }) {
  // Fetch and display ownership info
  // Allow setting revenue share %
  // Show consent status
  // Track usage and revenue
}
```

---

## Next Steps

1. **Run database migration** (copy SQL above into Supabase SQL Editor)
2. **Install dependencies**: `npm install @anthropic-ai/sdk`
3. **Add environment variables**:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   DEEPGRAM_API_KEY=... (optional, for audio transcription)
   ```
4. **Create API routes** (copy code above)
5. **Add transcript upload page** (copy UI above)
6. **Test workflow**: Upload transcript → Extract quotes → Generate draft

This gives you AI-assisted storytelling while maintaining the rich text editor you already have for final edits.
