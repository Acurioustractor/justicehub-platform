# 📱 Using Existing Supabase Instance (Multi-Frontend Setup)

## ✅ Good News: This is Totally Fine!

Using the same Supabase database from multiple frontends is:
- ✅ **Supported** - Common pattern for web + mobile apps
- ✅ **Secure** - Row Level Security (RLS) handles permissions
- ✅ **Performant** - No additional latency
- ✅ **Cost-Effective** - Single database for all frontends

## 🎯 How to Connect Your Existing Instance

### Step 1: Get Your Existing API Keys

1. **Go to your existing Supabase project:**
   - https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Navigate to:** Settings → API

3. **Copy these values:**
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGc... (safe to use in frontend)
   service_role key: eyJhbGc... (⚠️ server-only, never expose!)
   ```

### Step 2: Update `.env.local`

**Backup first:**
```bash
./scripts/backup-env.sh
```

**Replace the Supabase variables in `.env.local`:**
```env
# Existing Supabase Instance (Storyteller + JusticeHub)
NEXT_PUBLIC_SUPABASE_URL=https://your-existing-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-existing-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-existing-service-role-key...
```

**Important:** Use the SAME keys as your other frontend!

### Step 3: Understand Your Database Schema

Let's check what tables you have:

**Option A: Via Supabase Dashboard**
1. Go to Table Editor
2. Note down table names (e.g., `stories`, `profiles`, `consents`)

**Option B: Via SQL Editor**
```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Get schema for specific table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'stories';
```

**Common tables you likely have:**
- `stories` - Story content
- `profiles` - User/storyteller profiles
- `consents` - Consent records
- `media` - Media files metadata
- `transcripts` - Video/audio transcripts

### Step 4: Configure CORS (If Needed)

**Good News:** Supabase automatically handles CORS for multiple domains!

**But verify in your Supabase Dashboard:**
1. Settings → API
2. Scroll to "API Settings"
3. Check "Allowed Origins" includes:
   - `http://localhost:3000` (development)
   - `https://your-justicehub-domain.com` (production)
   - Your other frontend's domain

**If not listed, add them:**
```
http://localhost:3000, http://localhost:3003, https://justicehub.vercel.app, https://your-other-frontend.com
```

### Step 5: Review Row Level Security (RLS) Policies

**This is KEY for multi-frontend security!**

**Check existing policies:**
1. Supabase Dashboard → Authentication → Policies
2. Look at policies for `stories` table

**Example of good RLS policies:**
```sql
-- Public can read published stories (both frontends can access)
CREATE POLICY "Anyone can view published stories"
ON stories FOR SELECT
USING (is_published = true);

-- Only authenticated users can insert
CREATE POLICY "Authenticated users can create stories"
ON stories FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own stories
CREATE POLICY "Users can update own stories"
ON stories FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
```

**What you need:**
- ✅ Public read access for published stories (so JusticeHub can display them)
- ✅ Authenticated access for creation (your other frontend's admin)
- ✅ User-specific access for updates

### Step 6: Test Connection

**Restart dev server:**
```bash
npm run dev
```

**Create test page at `/app/test-db/page.tsx`:**
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function TestDBPage() {
  const supabase = await createClient()
  
  // Test 1: Check connection
  const { data: stories, error } = await supabase
    .from('stories')
    .select('*')
    .limit(5)
  
  // Test 2: Count total stories
  const { count } = await supabase
    .from('stories')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
      
      <div className="mb-4">
        <h2 className="font-bold">Total Stories: {count}</h2>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error.message}
        </div>
      )}

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Sample Stories:</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(stories, null, 2)}
        </pre>
      </div>
    </div>
  )
}
```

**Visit:** http://localhost:3000/test-db

### Step 7: Check for Schema Differences

**You may need to adapt your queries if table structures differ:**

**Example - Your existing table might be:**
```sql
-- Existing structure (from other frontend)
CREATE TABLE stories (
  id UUID PRIMARY KEY,
  storyteller_name TEXT,
  content TEXT,
  video_url TEXT,
  published BOOLEAN
);
```

**But your new code expects:**
```typescript
// What your code expects
{
  name: string,
  story_text: string,
  is_published: boolean
}
```

**Solution: Create a mapping function:**
```typescript
// src/lib/mappers/story-mapper.ts
export function mapExistingStory(dbStory: any) {
  return {
    id: dbStory.id,
    name: dbStory.storyteller_name,  // Map field name
    story_text: dbStory.content,      // Map field name
    is_published: dbStory.published,   // Map field name
    // ... other fields
  }
}
```

## 🔒 Multi-Frontend Security Best Practices

### 1. Row Level Security (RLS) is Your Friend
- ✅ **Always enable RLS** on all tables
- ✅ Use policies to control access per frontend
- ✅ Never rely on client-side checks alone

### 2. API Keys Usage
```typescript
// ✅ GOOD - Use anon key in frontend
const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY  // Safe to expose
)

// ❌ BAD - Never use service_role in frontend
const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY  // Bypasses RLS! Server-only!
)
```

### 3. Authentication Separation
If both frontends need auth:
- ✅ Each frontend can have its own auth flow
- ✅ Same user pool (users can access from either)
- ✅ Use `auth.uid()` in RLS policies

### 4. API Rate Limits
- Monitor usage in Supabase Dashboard → Reports
- Free tier: 500MB database, 2GB bandwidth, 50,000 monthly active users
- Upgrade if needed for multiple frontends

## 🚨 Potential Issues & Solutions

### Issue 1: Different Domain Cookies
**Problem:** Auth cookies don't work across domains

**Solution:** Each frontend manages its own auth session
```typescript
// JusticeHub site doesn't need to share auth with other frontend
// Each maintains separate session cookies
```

### Issue 2: Schema Conflicts
**Problem:** Other frontend updates schema, breaks your queries

**Solution:** 
1. Use database migrations (version control)
2. Create views for stable API
3. Communicate schema changes between teams

**Example - Create a stable view:**
```sql
CREATE VIEW justicehub_stories AS
SELECT 
  id,
  storyteller_name as name,
  content as story_text,
  published as is_published
FROM stories
WHERE published = true;
```

### Issue 3: Real-time Conflicts
**Problem:** Both frontends subscribe to same table, duplicate events

**Solution:** Filter by source or use separate channels
```typescript
// JusticeHub frontend
const channel = supabase
  .channel('justicehub-stories')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'stories',
      filter: 'source=eq.justicehub'  // Filter events
    },
    callback
  )
  .subscribe()
```

### Issue 4: Rate Limiting
**Problem:** Combined traffic from both frontends hits limits

**Solution:**
1. Monitor in Dashboard → Reports → API
2. Implement client-side caching
3. Upgrade plan if needed
4. Use Edge Functions for server-side operations

## 📊 Monitoring Multi-Frontend Usage

**Supabase Dashboard → Reports:**
- **API Requests** - Track total across both frontends
- **Database Size** - Monitor growth
- **Bandwidth** - Ensure within limits
- **Auth Users** - Track user growth

**Set up alerts:**
1. Dashboard → Settings → Billing
2. Set usage alerts at 80% of limits

## 🎯 Recommended Setup

```env
# .env.local (JusticeHub)
NEXT_PUBLIC_SUPABASE_URL=https://shared-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Server-only operations

# Optional: Tag requests for monitoring
NEXT_PUBLIC_APP_NAME=justicehub
```

```typescript
// lib/supabase/server.ts
export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
      global: {
        headers: {
          'X-Client-App': 'justicehub'  // Track which frontend
        }
      }
    }
  )
}
```

## ✅ Checklist for Existing Instance

- [ ] Get API keys from existing Supabase project
- [ ] Update `.env.local` with existing keys
- [ ] Verify CORS settings allow your domain
- [ ] Review RLS policies for public read access
- [ ] Document existing table schema
- [ ] Create field mapping if needed
- [ ] Test connection with sample queries
- [ ] Monitor usage in Dashboard
- [ ] Coordinate with other frontend team
- [ ] Set up usage alerts

## 🤝 Best Practices for Team Coordination

1. **Document Schema Changes** - Use migrations
2. **Shared RLS Policies** - Discuss access requirements
3. **API Versioning** - Use views for stable APIs
4. **Monitoring** - Both teams watch usage together
5. **Communication** - Slack channel for DB changes

---

**Ready to connect!** Once you update `.env.local` with your existing keys, you're good to go! 🚀
