# 🚀 Supabase Setup Guide (2025 Best Practices)

## Step-by-Step: Adding a New Supabase Instance

### Step 1: Create New Supabase Project

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Click "New Project"

2. **Project Configuration**
   ```
   Project Name: JusticeHub Stories (or your preferred name)
   Database Password: [Generate strong password - SAVE THIS!]
   Region: Choose closest to your users (e.g., us-east-1)
   Pricing Plan: Free tier or Pro (depending on needs)
   ```

3. **Wait for Project Setup** (takes ~2 minutes)

### Step 2: Get Your API Keys

1. **In Supabase Dashboard**, go to:
   - Settings → API

2. **Copy these values:**
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGc...
   service_role key: eyJhbGc... (⚠️ Keep secret!)
   ```

### Step 3: Update Environment Variables

#### A. Backup Current Environment
```bash
./scripts/backup-env.sh
```

#### B. Add New Supabase Credentials to `.env.local`

**Option 1: Replace existing Supabase (if migrating)**
```env
# New Supabase Instance (Stories Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key...
```

**Option 2: Keep both (dual instances)**
```env
# Primary Supabase (Old)
NEXT_PUBLIC_SUPABASE_URL=https://tednluwflfhxyucgwigh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...old-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...old-service-key...

# Stories Supabase (New)
NEXT_PUBLIC_STORIES_SUPABASE_URL=https://your-new-project.supabase.co
NEXT_PUBLIC_STORIES_SUPABASE_ANON_KEY=eyJhbGc...new-key...
STORIES_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...new-service-key...
```

#### C. Verify Environment Variables
```bash
# Check variables are set (without revealing values)
node -e "console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')"
```

### Step 4: Modern Supabase Client Setup (2025)

You already have the required packages:
- ✅ `@supabase/ssr` (v0.7.0)
- ✅ `@supabase/supabase-js` (v2.57.4)

#### A. Create Server-Side Client (Recommended)

Create `/src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

#### B. Create Client-Side Client (For Client Components)

Create `/src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### C. Create Middleware (For Auth Token Refresh)

Create or update `/src/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes logic here (if needed)
  // if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Step 5: Usage Examples

#### Server Component (Recommended for Data Fetching)

```typescript
// app/stories/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function StoriesPage() {
  const supabase = await createClient()
  
  const { data: stories, error } = await supabase
    .from('stories')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error)
    return <div>Error loading stories</div>
  }

  return (
    <div>
      {stories?.map(story => (
        <div key={story.id}>{story.title}</div>
      ))}
    </div>
  )
}
```

#### Client Component (For Interactive Features)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function StoriesClient() {
  const [stories, setStories] = useState([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchStories() {
      const { data } = await supabase
        .from('stories')
        .select('*')
        .eq('is_published', true)
      
      setStories(data || [])
    }

    fetchStories()
  }, [])

  return <div>{/* Render stories */}</div>
}
```

#### Route Handler (API Routes)

```typescript
// app/api/stories/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('is_published', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

### Step 6: Deploy to Vercel

#### Add Environment Variables to Vercel

```bash
# Via Vercel CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Or via Vercel Dashboard:
# Project → Settings → Environment Variables
```

**Important:** Use the same values for all environments (Production, Preview, Development)

### Step 7: Database Schema Setup

#### Create Stories Table

In Supabase Dashboard → SQL Editor:

```sql
-- Enable Row Level Security
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
  video_source TEXT,
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

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Public read access for published stories
CREATE POLICY "Published stories are viewable by everyone" 
  ON public.stories FOR SELECT 
  USING (is_published = true);

-- Create index for performance
CREATE INDEX idx_stories_published ON public.stories(is_published, display_order);
CREATE INDEX idx_stories_category ON public.stories(category) WHERE is_published = true;
```

#### Create Profiles Table (Optional)

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT CHECK (role IN ('storyteller', 'admin', 'moderator')),
  
  -- Privacy settings
  is_public BOOLEAN DEFAULT false,
  allow_contact BOOLEAN DEFAULT false
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);
```

### Step 8: Test Connection

Create a test route at `/app/api/test-supabase/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test query
    const { data, error } = await supabase
      .from('stories')
      .select('count')
      .limit(1)

    if (error) throw error

    return NextResponse.json({ 
      status: 'success', 
      message: 'Supabase connected successfully!',
      data 
    })
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 })
  }
}
```

Visit: `http://localhost:3000/api/test-supabase`

### Step 9: Migration Strategy (If Moving Data)

#### Export from Old Supabase
```bash
# In Supabase Dashboard → Database → Backups
# Or via SQL Editor:
COPY (SELECT * FROM stories) TO '/tmp/stories_export.csv' WITH CSV HEADER;
```

#### Import to New Supabase
```bash
# Use Supabase Dashboard → Table Editor → Import data
# Or via SQL:
COPY stories FROM '/path/to/stories_export.csv' WITH CSV HEADER;
```

## 🔒 Security Best Practices

1. **Never commit service_role key** - It bypasses RLS!
2. **Always use RLS policies** for public tables
3. **Use anon key** for client-side operations
4. **Use service_role key** only in server-side code (API routes)
5. **Validate user input** before database operations
6. **Use prepared statements** (Supabase does this automatically)

## 📊 Monitoring & Debugging

### View Logs
- Supabase Dashboard → Logs → Postgres Logs
- Check API requests in Network tab

### Common Issues

**Issue:** "Failed to fetch"
**Fix:** Check CORS settings and environment variables

**Issue:** "Row Level Security policy violation"
**Fix:** Review RLS policies in Supabase Dashboard → Authentication → Policies

**Issue:** "relation does not exist"
**Fix:** Verify table name spelling and that table exists

## 🎯 Next Steps

1. ✅ Create Supabase project
2. ✅ Get API keys
3. ✅ Update .env.local
4. ✅ Create client utilities
5. ✅ Set up middleware
6. ✅ Create database schema
7. ✅ Test connection
8. ✅ Deploy to Vercel
9. 🚀 Start building features!

---

**Questions?** Check official docs: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
