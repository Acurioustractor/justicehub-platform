# AI-Assisted Storytelling - Complete Deploy Checklist
## Step-by-Step Guide to Get It Working

**Estimated Time:** 1-2 hours
**Difficulty:** Easy (copy-paste code)
**Cost:** ~$4 per story in API fees

---

## ✅ Pre-Flight Check

Before you start, verify you have:

- [ ] Access to Supabase dashboard (https://supabase.com/dashboard)
- [ ] Admin access to your JusticeHub project
- [ ] Code editor open (VS Code, etc.)
- [ ] Terminal access
- [ ] Anthropic API account (https://console.anthropic.com)

---

## 📝 Step 1: Database Setup (10 minutes)

### 1.1 Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copy the **entire contents** of: `supabase/migrations/20250115_story_workspaces.sql`
3. Paste into SQL editor
4. Click **"Run"**

### 1.2 Verify Success

You should see output like:
```
✅ All story workspace tables created successfully
✅ Tables created:
   • story_workspaces (AI workflow)
   • story_ownership (ownership tracking)
   ...
```

### 1.3 Confirm Tables Exist

Run this query to double-check:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'story_%';
```

Should return:
- story_workspaces
- story_ownership
- story_revenue_events
- story_usage_log

**✅ Checkpoint:** Database tables created

---

## 🔑 Step 2: Get Anthropic API Key (5 minutes)

### 2.1 Sign Up / Login

1. Go to: https://console.anthropic.com
2. Sign up or login
3. Navigate to: Settings → API Keys
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-api03-...`)

### 2.2 Add to Environment Variables

Edit `.env.local` in your project root:

```bash
# Add this line:
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
```

### 2.3 Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
# Server now has access to API key
```

**✅ Checkpoint:** API key configured

---

## 📦 Step 3: Install Dependencies (2 minutes)

```bash
cd /Users/benknight/Code/JusticeHub
npm install @anthropic-ai/sdk
```

Wait for installation to complete.

**✅ Checkpoint:** Dependencies installed

---

## 🔧 Step 4: Add API Route (5 minutes)

### 4.1 Create Directory

```bash
mkdir -p src/app/api/stories/extract-quotes
```

### 4.2 Create File

Create: `src/app/api/stories/extract-quotes/route.ts`

Copy the **entire contents** from the file I created above.

Or run:
```bash
# File already created at:
# src/app/api/stories/extract-quotes/route.ts
# Just verify it exists
ls -la src/app/api/stories/extract-quotes/route.ts
```

**✅ Checkpoint:** API route created

---

## 🎨 Step 5: Add Transcript Upload Page (5 minutes)

### 5.1 Create Directory

```bash
mkdir -p src/app/admin/stories/transcript
```

### 5.2 Create File

Create: `src/app/admin/stories/transcript/page.tsx`

Copy the **entire contents** from the file I created above.

**✅ Checkpoint:** Transcript page created

---

## 🔗 Step 6: Integrate with Existing Editor (10 minutes)

### 6.1 Open Existing Editor

Open: `src/app/admin/stories/new/page.tsx`

### 6.2 Add useEffect Hook

Follow instructions in: `INTEGRATION_PATCH.md`

**Quick version:**

Add this code after your state definitions (around line 105):

```typescript
// Check if coming from transcript flow
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('from') === 'transcript') {
    const storedData = localStorage.getItem('extracted_story_data');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        let content = `<h2>Story Background</h2>
<p><strong>Storyteller:</strong> ${data.storytellerName}</p>
<h2>Key Quotes</h2>`;

        const quotesByTheme: Record<string, any[]> = {};
        data.quotes?.forEach((quote: any) => {
          if (!quotesByTheme[quote.theme]) quotesByTheme[quote.theme] = [];
          quotesByTheme[quote.theme].push(quote);
        });

        Object.entries(quotesByTheme).forEach(([theme, quotes]) => {
          content += `<h3>${theme}</h3>\n`;
          quotes.slice(0, 5).forEach((quote: any) => {
            content += `<blockquote>"${quote.text}"</blockquote>\n`;
          });
        });

        setFormData(prev => ({
          ...prev,
          title: `${data.storytellerName}'s Story`,
          content: content,
        }));

        localStorage.removeItem('extracted_story_data');
      } catch (error) {
        console.error('Failed to load transcript data:', error);
      }
    }
  }
}, []);
```

**✅ Checkpoint:** Editor integration complete

---

## 🎯 Step 7: Add Navigation Link (5 minutes)

### 7.1 Open Stories List Page

Edit: `src/app/admin/stories/page.tsx`

### 7.2 Update "Create Story" Button

Find the current button (around line 77-82):

```typescript
<Link
  href="/admin/stories/new"
  className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black shadow-lg"
>
  Create Story
</Link>
```

Replace with:

```typescript
<div className="flex gap-4">
  <Link
    href="/admin/stories/transcript"
    className="px-6 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors border-2 border-blue-600 shadow-lg flex items-center gap-2"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
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

**✅ Checkpoint:** Navigation updated

---

## 🧪 Step 8: Test the Complete Flow (15 minutes)

### 8.1 Start Dev Server

```bash
npm run dev
```

Wait for: `✓ Ready in X seconds`

### 8.2 Login as Admin

1. Navigate to: http://localhost:3000/login
2. Login with admin credentials
3. Verify you have admin access

### 8.3 Navigate to Stories

1. Go to: http://localhost:3000/admin/stories
2. You should see two buttons:
   - "From Transcript (AI)" (blue)
   - "Blank Story" (black)

### 8.4 Test Transcript Flow

1. Click "From Transcript (AI)"
2. Fill in form:
   - **Storyteller Name:** Test Elder
   - **Contact:** test@example.com
   - **Transcript:** (paste test transcript below)

**Test Transcript:**
```
Interviewer: Tell me about your work with young people.

Storyteller: I've been doing this for 20 years now. Twenty years. And you know what? I've had 25 young fellas come through my house. We call them MBBs - Misunderstood Black Boys. Because that's what they are.

One boy, he sat in Cleveland for four days without talking. Four days. Staff couldn't get a word out of him. I walked in, I said "What's your name, darling?" He looked up at me and said "I'm not allowed to say my name to white people."

That's when I understood. These kids need someone who gets it. Most of these 25 boys, they're doing good now. Most have gone back to their families. Most are independent.

But I did all this unpaid. Twenty years, unpaid. The services get millions. Millions! For what? Tick-and-flick funding. Meanwhile, I'm answering calls at 2am.

What do I need? I need voices behind me. Not just funding. Voices. People who will stand with me and say this work matters.
```

3. Click "Extract Quotes with AI"
4. Wait 30-60 seconds
5. You should see:
   - ✅ Extracted Quotes section (should find 8-12 quotes)
   - ✅ Key Themes section (should find 4-6 themes)
   - ✅ Case Studies section (should find 2-3 case studies)

### 8.5 Test Editor Integration

1. Click "Create Story with These Quotes"
2. Should redirect to `/admin/stories/new?from=transcript`
3. Editor should pre-fill with:
   - Title: "Test Elder's Story"
   - Content: Organized quotes by theme
4. You can now edit, add narrative, save

**✅ Checkpoint:** Complete workflow tested

---

## 🚀 Step 9: Deploy to Production (Optional)

### 9.1 Run Migration on Production Database

1. Go to your production Supabase project
2. Run the same SQL migration
3. Verify tables created

### 9.2 Add Environment Variable

In your deployment platform (Vercel, etc.):
```
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
```

### 9.3 Deploy

```bash
git add .
git commit -m "feat: add AI-assisted storytelling workflow"
git push
```

**✅ Checkpoint:** Deployed to production

---

## 📊 Usage Tracking

After deployment, monitor:

```sql
-- How many transcripts processed?
SELECT COUNT(*) FROM story_workspaces;

-- Average quotes extracted?
SELECT AVG(jsonb_array_length(extracted_quotes)) as avg_quotes
FROM story_workspaces
WHERE extracted_quotes IS NOT NULL;

-- Recent extractions
SELECT
  storyteller_name,
  status,
  created_at,
  jsonb_array_length(extracted_quotes) as quote_count
FROM story_workspaces
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### "Unauthorized" Error
**Problem:** Not logged in or not admin
**Solution:**
```sql
-- Check your user role
SELECT id, email FROM auth.users WHERE email = 'your@email.com';
-- Get the id, then:
UPDATE users SET user_role = 'admin' WHERE id = 'USER_ID';
```

### "API key not configured"
**Problem:** Environment variable not set
**Solution:**
1. Check `.env.local` has `ANTHROPIC_API_KEY=...`
2. Restart dev server
3. Verify with: `echo $ANTHROPIC_API_KEY` (should show your key)

### "Failed to parse JSON"
**Problem:** Claude returned invalid JSON
**Solution:**
- Check transcript is in English
- Make sure transcript is 200+ words
- Try with a different transcript
- Check API key has credits remaining

### Quotes not showing in editor
**Problem:** useEffect not triggering
**Solution:**
1. Check URL has `?from=transcript` parameter
2. Check localStorage: `localStorage.getItem('extracted_story_data')`
3. Check browser console for errors
4. Verify useEffect was added correctly

### Table doesn't exist
**Problem:** Migration didn't run
**Solution:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'story_%';

-- If missing, re-run migration
```

---

## 💰 Cost Monitoring

Track your Anthropic API usage:
1. Visit: https://console.anthropic.com/settings/usage
2. Monitor requests and spend
3. Set budget alerts

**Expected costs:**
- Quote extraction: $0.10-0.30 per story
- ~100 stories = $10-30/month

---

## 📈 Next Steps (Optional)

### Phase 2: Add Audio Transcription
- Sign up for Deepgram API
- Add audio upload support
- Auto-transcribe before extraction

### Phase 3: Add Ownership Tracking
- Create ownership record when publishing
- Build storyteller dashboard
- Track revenue events

### Phase 4: Advanced Features
- Full draft generation (AI writes entire narrative)
- NFT ownership integration
- Automated revenue distribution

---

## ✅ Final Verification

Check all boxes:

- [ ] Database tables created (4 tables)
- [ ] Anthropic API key configured
- [ ] npm dependencies installed
- [ ] API route created (`/api/stories/extract-quotes`)
- [ ] Transcript page created (`/admin/stories/transcript`)
- [ ] Editor integration added (useEffect)
- [ ] Navigation link updated
- [ ] Test transcript extraction works
- [ ] Test editor pre-fill works
- [ ] Can create and save story from transcript

**If all checked: 🎉 You're live!**

---

## 🎓 Training Your Team

### For Content Team
1. Show them: `/admin/stories/transcript`
2. Explain: Paste transcript → AI extracts quotes → Edit in rich text editor
3. Time savings: 3-5 hours per story

### For Storytellers (Future)
1. Their ownership is tracked in database
2. They get revenue share when stories generate value
3. They can request changes/removal anytime

---

## 📚 Reference Documents

- **Quick Start:** [IMPLEMENT_AI_STORYTELLING_QUICKSTART.md](IMPLEMENT_AI_STORYTELLING_QUICKSTART.md)
- **Architecture:** [SYSTEM_ARCHITECTURE_OVERVIEW.md](SYSTEM_ARCHITECTURE_OVERVIEW.md)
- **Integration:** [INTEGRATION_PATCH.md](INTEGRATION_PATCH.md)
- **Workflows:** [STORYTELLING_WORKFLOW_TEMPLATE.md](STORYTELLING_WORKFLOW_TEMPLATE.md)
- **Ownership:** [STORY_OWNERSHIP_FRAMEWORK.md](STORY_OWNERSHIP_FRAMEWORK.md)

---

## 🆘 Support

If stuck:
1. Check browser console for errors
2. Check server logs (terminal running `npm run dev`)
3. Review troubleshooting section above
4. Check Supabase logs: https://supabase.com/dashboard/project/YOUR_PROJECT/logs

---

**Deploy checklist complete!** You now have AI-assisted storytelling integrated with your JusticeHub admin. 🚀
