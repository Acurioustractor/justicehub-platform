# 🔌 Connect to Your Existing Supabase - Action Plan

## ✅ What I Need From You

### 1. Supabase API Keys
Get these from your existing Supabase Dashboard (Settings → API):

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGc...
service_role key: eyJhbGc... (optional, for admin operations)
```

### 2. Table Names
What tables do you have? Common ones:
- [ ] `stories`
- [ ] `profiles` 
- [ ] `consents`
- [ ] `media` or `files`
- [ ] `transcripts`
- [ ] Other: _______________

### 3. Story Table Structure (Sample)
Can you share what fields your `stories` table has? For example:
```
- id
- storyteller_name (or name?)
- content (or story_text?)
- video_url
- published (or is_published?)
- consent_given
```

## 🚀 What I'll Do Once You Provide Keys

### Step 1: Update Environment Variables (30 seconds)
```bash
# Backup first
./scripts/backup-env.sh

# Add your keys to .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-existing-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Step 2: Test Connection (1 minute)
```bash
# Run test script
npx tsx scripts/test-supabase-connection.ts
```

This will show us:
- ✅ Connection works
- ✅ What tables exist
- ✅ What fields each table has
- ✅ Sample data structure

### Step 3: Create Field Mapping (5 minutes)
Based on your schema, I'll create a mapper like:
```typescript
// Maps your existing DB fields to our UI components
function mapStoryFromDB(dbStory) {
  return {
    id: dbStory.id,
    name: dbStory.storyteller_name,  // Your field → Our field
    storyText: dbStory.content,       // Your field → Our field
    isPublished: dbStory.published,   // Your field → Our field
    // ... etc
  }
}
```

### Step 4: Build Stories Page (30 minutes)
- Fetch stories from your database
- Display with proper consent checking
- Show profiles, transcripts, media
- Filter by category/status

## 📋 Multi-Frontend Checklist

### Security (Already Handled by Supabase)
- ✅ Row Level Security (RLS) protects data
- ✅ anon key is safe for frontend use
- ✅ CORS automatically configured
- ✅ Each frontend has separate auth sessions

### No Conflicts
- ✅ Both frontends can read simultaneously
- ✅ Supabase handles concurrent access
- ✅ No special configuration needed
- ✅ Independent deployments

### Monitoring
- ✅ Check usage in Supabase Dashboard
- ✅ Combined traffic from both sites
- ✅ Alert at 80% of free tier limits

## 🎯 Quick Start

**Option A: Share Keys Here**
Paste in chat (I'll add to `.env.local`):
```
URL: 
anon key: 
```

**Option B: Add Yourself**
```bash
# 1. Backup
./scripts/backup-env.sh

# 2. Edit .env.local
nano .env.local

# 3. Add keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# 4. Test
npx tsx scripts/test-supabase-connection.ts
```

## ❓ Common Questions

**Q: Will this interfere with my other frontend?**
A: No! Supabase is designed for multiple frontends. Both can access the same data simultaneously.

**Q: Do I need separate API keys?**
A: No, use the SAME keys in both frontends.

**Q: What about authentication?**
A: Each frontend manages its own auth sessions independently (separate cookies).

**Q: Can I write data from JusticeHub?**
A: Depends on your RLS policies. Reading is fine, writing needs proper permissions.

**Q: What if table structures are different?**
A: I'll create a mapping function to translate between your schema and our UI components.

## 📞 Next Steps

**Tell me:**
1. Your Supabase URL
2. Your anon key
3. Main table names (stories, profiles, etc.)
4. (Optional) Sample record from stories table

**I'll handle:**
1. Updating environment variables
2. Testing connection
3. Mapping database fields
4. Building stories page with real data

Ready when you are! 🚀
