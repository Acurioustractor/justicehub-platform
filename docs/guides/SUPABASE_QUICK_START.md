# 🚀 Supabase Quick Start - Setup Checklist

## ✅ Step-by-Step Setup

### 1. Create New Supabase Project
- [ ] Go to https://supabase.com/dashboard
- [ ] Click "New Project"
- [ ] Choose name, password, and region
- [ ] Wait ~2 minutes for setup

### 2. Get Your API Keys
- [ ] Go to Project Settings → API
- [ ] Copy **Project URL**
- [ ] Copy **anon public** key
- [ ] Copy **service_role** key (keep secret!)

### 3. Update Environment Variables

**Backup first:**
```bash
./scripts/backup-env.sh
```

**Add to `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
```

### 4. Files Already Created ✅
- ✅ `src/lib/supabase/server.ts` - Server-side client
- ✅ `src/lib/supabase/client.ts` - Client-side client
- ✅ `docs/guides/SUPABASE_SETUP_2025.md` - Full guide

### 5. Create Database Tables

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Stories Table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Storyteller Info
  name TEXT NOT NULL,
  role TEXT,
  age INTEGER,
  location TEXT,
  
  -- Story Content
  title TEXT NOT NULL,
  story_text TEXT,
  quote TEXT,
  bio TEXT,
  
  -- Media
  media_type TEXT CHECK (media_type IN ('video', 'audio', 'text')),
  video_url TEXT,
  video_source TEXT CHECK (video_source IN ('youtube', 'vimeo', 'supabase')),
  video_thumbnail_url TEXT,
  profile_photo_url TEXT,
  transcript_url TEXT,
  
  -- Categorization
  category TEXT CHECK (category IN ('youth', 'expert', 'leader', 'community')),
  age_group TEXT,
  tags TEXT[],
  
  -- Display
  highlight_stat_label TEXT,
  highlight_stat_value TEXT,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published stories
CREATE POLICY "Published stories are viewable by everyone" 
  ON public.stories FOR SELECT 
  USING (is_published = true);

-- Create indexes for performance
CREATE INDEX idx_stories_published ON public.stories(is_published, display_order);
CREATE INDEX idx_stories_category ON public.stories(category) WHERE is_published = true;
CREATE INDEX idx_stories_featured ON public.stories(is_featured) WHERE is_published = true;
```

### 6. Test Connection

**Option A: Via API Route**
```bash
# Visit in browser:
http://localhost:3000/api/test-supabase
```

**Option B: Via Code**
```typescript
// Test in any Server Component
import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('stories').select('count')
  return <pre>{JSON.stringify({ data, error }, null, 2)}</pre>
}
```

### 7. Deploy to Vercel

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

Or use Vercel Dashboard:
- Project → Settings → Environment Variables
- Add all three variables for Production, Preview, Development

### 8. Insert Test Data (Optional)

```sql
INSERT INTO public.stories (
  name, title, story_text, category, 
  is_published, display_order
) VALUES (
  'Test User',
  'My Story',
  'This is a test story to verify the setup works.',
  'youth',
  true,
  1
);
```

## 🎯 Usage Examples

### Server Component (Fetch Data)
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function StoriesPage() {
  const supabase = await createClient()
  const { data: stories } = await supabase
    .from('stories')
    .select('*')
    .eq('is_published', true)
    .order('display_order')

  return <div>{/* Render stories */}</div>
}
```

### Client Component (Interactive)
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function StoriesList() {
  const [stories, setStories] = useState([])
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('stories')
      .select('*')
      .eq('is_published', true)
      .then(({ data }) => setStories(data || []))
  }, [])

  return <div>{/* Render stories */}</div>
}
```

## 📚 Full Documentation

- **Complete Setup Guide:** `docs/guides/SUPABASE_SETUP_2025.md`
- **Official Docs:** https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

## 🆘 Troubleshooting

**Error: "Missing environment variables"**
- Check `.env.local` has all three variables
- Restart dev server: `npm run dev`

**Error: "Failed to fetch"**
- Verify Supabase project is active
- Check API keys are correct
- Ensure table exists in database

**Error: "Row Level Security policy violation"**
- Check RLS policies in Supabase Dashboard
- Verify `is_published = true` for public access

---

**Ready to build!** Your Supabase instance is configured with modern best practices.
