# Empathy Ledger Integration - Corrected Architecture

**Date**: January 2, 2026
**Status**: Redesigned to use existing `profile_appearances` pattern

---

## ✅ Correct Architecture (What We're Using Now)

### Key Principle: **Empathy Ledger is the Source of Truth**

JusticeHub does **NOT** duplicate profile data. Instead:

1. **Profile data stays in Empathy Ledger** (photos, bios, stories, consent)
2. **JusticeHub only stores links** via `profile_appearances` table
3. **Profile data is fetched in real-time** when displaying content

### Why This is Better:

✅ **Single source of truth** - Empathy Ledger owns all profile infrastructure
✅ **Respects consent** - Privacy changes in Empathy Ledger immediately apply
✅ **Cultural protocols maintained** - Elder approvals, warnings preserved
✅ **Photos hosted properly** - Empathy Ledger's image infrastructure used
✅ **No data duplication** - Avoids sync conflicts and stale data
✅ **Stories remain linked** - Rich context from Empathy Ledger stories

---

## 📊 Database Architecture

### What We DON'T Do (Wrong Approach):
```sql
-- ❌ DON'T duplicate profiles in JusticeHub
CREATE TABLE public_profiles (
  id UUID,
  empathy_ledger_profile_id UUID,  -- creates duplicate
  display_name TEXT,               -- duplicated data
  bio TEXT,                        -- duplicated data
  avatar_url TEXT,                 -- duplicated data
  ...
);
```

### What We DO (Correct Approach):
```sql
-- ✅ ONLY store the link/appearance relationship
CREATE TABLE profile_appearances (
  id UUID PRIMARY KEY,
  empathy_ledger_profile_id UUID NOT NULL,  -- Reference only, don't duplicate
  appears_on_type TEXT NOT NULL,            -- 'program' | 'service' | 'article'
  appears_on_id UUID NOT NULL,              -- ID of the program/service/article
  role TEXT,                                -- Context: 'founder', 'service_user', etc.
  story_excerpt TEXT,                       -- Short quote from their story
  featured BOOLEAN DEFAULT FALSE,           -- Is this appearance featured?
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: same profile can only appear once per content item
CREATE UNIQUE INDEX idx_profile_appearances_unique
ON profile_appearances(empathy_ledger_profile_id, appears_on_type, appears_on_id);
```

---

## 🔄 How Sync Works

### Old (Wrong) Sync Script:
```javascript
// ❌ sync-empathy-ledger.mjs (WRONG - duplicates data)
// Fetches profiles and copies them to JusticeHub public_profiles table
// Creates duplicate records, loses sync with Empathy Ledger
```

### New (Correct) Sync Script:
```javascript
// ✅ sync-empathy-ledger-profiles.mjs (CORRECT - links only)

1. Fetch public stories from Empathy Ledger (with consent)
2. Filter for justice-related stories (themes, service_id links)
3. For each story linked to a JusticeHub service:
   - Create/update profile_appearance linking:
     - empathy_ledger_profile_id (from story.author_id)
     - appears_on_type: 'service'
     - appears_on_id: story.service_id
     - role: 'service_user'
     - story_excerpt: story.summary
     - featured: story.is_featured
```

**Result**: No profile data duplicated, only relationships created

---

## 🎨 How Frontend Displays Profiles

### When Displaying Content (e.g., a Service Page):

```typescript
// 1. Get profile appearances for this service
const { data: appearances } = await supabase
  .from('profile_appearances')
  .select('*')
  .eq('appears_on_type', 'service')
  .eq('appears_on_id', serviceId);

// 2. Fetch FULL profile data from Empathy Ledger in real-time
const profiles = await Promise.all(
  appearances.map(async (appearance) => {
    const { data: profile } = await empathyLedgerClient
      .from('profiles')
      .select(`
        *,
        organization:organizations!profiles_primary_organization_id_fkey(*)
      `)
      .eq('id', appearance.empathy_ledger_profile_id)
      .single();

    // Get their justice-related stories
    const { data: stories } = await empathyLedgerClient
      .from('stories')
      .select('*')
      .or(`author_id.eq.${profile.id},storyteller_id.eq.${profile.id}`)
      .eq('is_public', true)
      .eq('privacy_level', 'public');

    return {
      profile,
      stories,
      appearanceRole: appearance.role,
      appearanceExcerpt: appearance.story_excerpt,
      isFeatured: appearance.featured
    };
  })
);

// 3. Display using ProfileCard component
<ProfileCard
  profile={profile.profile}
  role={profile.appearanceRole}
  storyExcerpt={profile.appearanceExcerpt}
  isFeatured={profile.isFeatured}
/>
```

**Result**: Always fresh data from Empathy Ledger, never stale

---

## 📋 Profile Linking Integration (Existing Library)

JusticeHub already has a complete integration library:

**File**: `src/lib/integrations/profile-linking.ts`

### Key Functions:

```typescript
// Get full profile with justice stories
getProfileWithJusticeStories(empathyLedgerProfileId)
// Returns: { profile, organization, justiceStories, appearances }

// Get profiles appearing on specific content
getProfilesFor(type: 'program' | 'service' | 'article', id: string)
// Returns: Array of profiles with full Empathy Ledger data

// Create a profile appearance (link profile to content)
createProfileAppearance({
  empathyLedgerProfileId,
  appearsOnType,
  appearsOnId,
  role,
  storyExcerpt,
  featured
})

// Auto-sync stories to create appearances
syncProfilesFromStories()
// Finds justice stories linked to services, creates appearances

// Get featured profiles for homepage
getFeaturedProfiles(limit = 6)

// Search profiles by name/org
searchProfiles(query)
```

---

## 🔐 Consent & Privacy Architecture

### Data Governance:

1. **Consent-Controlled**:
   - Only `is_public: true` stories are synced
   - Only `privacy_level: 'public'` content shown
   - Changes in Empathy Ledger immediately apply

2. **Cultural Protocols**:
   - Cultural warnings preserved from Empathy Ledger
   - Elder approval tracked
   - Attribution always given (links back to Empathy Ledger)

3. **Justice-Related Filtering**:
   ```javascript
   const JUSTICE_THEMES = [
     'youth-justice',
     'Justice',
     'Justice Reinvestment',
     'indigenous justice reform',
     'Drug and Alcohol',
     'Homelessness',
     'mental_health',
     'Family',
     'family_healing',
     // ... etc
   ];
   ```

---

## 🚀 Deployment - Corrected Secrets

### Required GitHub Secrets:

```bash
# JusticeHub Database
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY

# Empathy Ledger (READ-ONLY)
EMPATHY_LEDGER_SUPABASE_URL      # Empathy Ledger project URL
EMPATHY_LEDGER_SUPABASE_ANON_KEY # Anon key (NOT service role - read-only)

# WhatsApp Notifications (via Twilio)
TWILIO_ACCOUNT_SID               # Twilio account SID
TWILIO_AUTH_TOKEN                # Twilio auth token
TWILIO_WHATSAPP_FROM             # Format: whatsapp:+14155238886
TWILIO_WHATSAPP_TO               # Format: whatsapp:+61412345678

# AI Services
ANTHROPIC_API_KEY
FIRECRAWL_API_KEY
```

### How to Get Twilio WhatsApp Credentials:

1. **Sign up for Twilio**: https://www.twilio.com/try-twilio
2. **Get Account SID & Auth Token**: Console Dashboard
3. **Enable WhatsApp Sandbox** (for testing):
   - Go to: Console → Messaging → Try it out → Send a WhatsApp message
   - Send "join <sandbox-code>" to the Twilio WhatsApp number
4. **Get Phone Numbers**:
   - **FROM**: Twilio's WhatsApp sandbox number (e.g., `whatsapp:+14155238886`)
   - **TO**: Your WhatsApp number with country code (e.g., `whatsapp:+61412345678`)
5. **For Production**: Buy a Twilio WhatsApp Business number

### Set Secrets:

```bash
# WhatsApp via Twilio
gh secret set TWILIO_ACCOUNT_SID
gh secret set TWILIO_AUTH_TOKEN
gh secret set TWILIO_WHATSAPP_FROM   # whatsapp:+14155238886
gh secret set TWILIO_WHATSAPP_TO     # whatsapp:+61412345678

# Empathy Ledger (read-only access)
gh secret set EMPATHY_LEDGER_SUPABASE_URL
gh secret set EMPATHY_LEDGER_SUPABASE_ANON_KEY
```

---

## 📅 Automation Schedule

### Daily at 4am UTC:
**Workflow**: `sync-empathy-ledger-profiles.yml`
**Script**: `scripts/sync-empathy-ledger-profiles.mjs`
**What it does**:
1. Fetches public justice-related stories from Empathy Ledger
2. Creates `profile_appearances` for stories linked to JusticeHub services
3. Updates existing appearances (story excerpts, featured status)
4. Sends WhatsApp notification with results

### Every 6 hours:
**Workflow**: `health-monitoring.yml`
**Script**: `scripts/health-check-sources.mjs`
**What it does**:
1. Checks 15+ data sources for uptime
2. Measures response times
3. Detects content changes (MD5 hashing)
4. Sends WhatsApp alerts for down sources

---

## ✅ Benefits of This Approach

### vs. Duplicating Profile Data:

| Feature | Duplicating Data ❌ | Linking Only ✅ |
|---------|-------------------|----------------|
| **Data Freshness** | Stale (daily sync) | Real-time |
| **Photo Hosting** | Need to copy images | Uses Empathy Ledger infrastructure |
| **Consent Changes** | Delayed (next sync) | Immediate |
| **Cultural Protocols** | Could be lost | Always preserved |
| **Storage** | Duplicate everything | Only store links |
| **Sync Conflicts** | Possible | None |
| **Source of Truth** | Split (confusing) | Single (Empathy Ledger) |
| **Story Context** | Lost | Fully preserved |

---

## 🧪 Testing the Sync

### Test Locally:

```bash
cd /Users/benknight/Code/JusticeHub
node scripts/sync-empathy-ledger-profiles.mjs
```

**Expected Output**:
```
🔄 Starting Empathy Ledger profile sync...
📖 Fetching public stories from Empathy Ledger...
✅ Found 47 justice-related stories (out of 152 total)

🔗 Creating profile appearances...

═══════════════════════════════════════════════
📊 Sync Summary
═══════════════════════════════════════════════

✅ Stories processed: 47
🆕 Appearances created: 12
🔄 Appearances updated: 8
⏭️  Appearances skipped: 27 (no service link)
❌ Errors: 0

📱 WhatsApp notification sent successfully
```

### Verify in Database:

```sql
-- Check created appearances
SELECT
  pa.empathy_ledger_profile_id,
  pa.appears_on_type,
  pa.role,
  pa.story_excerpt,
  pa.featured,
  s.name as service_name
FROM profile_appearances pa
LEFT JOIN services s ON pa.appears_on_id = s.id
WHERE pa.appears_on_type = 'service'
ORDER BY pa.created_at DESC
LIMIT 10;
```

---

## 📱 WhatsApp Notification Examples

### Successful Sync:
```
✅ JusticeHub Profile Sync Complete

Stories: 47
Created: 12
Updated: 8
Errors: 0
```

### Health Check Alert:
```
🚨 JusticeHub Data Source Alert

3 source(s) are currently down (1 high priority):

🔴 Legal Aid Queensland
   services
   Error: HTTP 503

🟡 NITV News
   media
   Error: Timeout

🟡 Griffith Criminology
   research
   Error: HTTP 404

Total: 15 | Down: 3
```

---

## 🔄 Migration from Old Approach

If you have the old `sync-empathy-ledger.mjs` script:

```bash
# Remove old script
rm scripts/sync-empathy-ledger.mjs

# Remove old workflow
rm .github/workflows/sync-empathy-ledger.yml

# Use new ones
# ✅ scripts/sync-empathy-ledger-profiles.mjs
# ✅ .github/workflows/sync-empathy-ledger-profiles.yml
```

**No database migration needed** - `profile_appearances` table already exists!

---

## 📚 Related Documentation

- **Integration Library**: `/src/lib/integrations/profile-linking.ts`
- **Empathy Ledger Client**: `/src/lib/supabase/empathy-ledger.ts`
- **ProfileCard Component**: `/src/components/ProfileCard.tsx`
- **Admin Interface**: `/src/app/admin/profiles`

---

## 🎯 Summary

### What Changed:

1. ❌ **Removed**: `sync-empathy-ledger.mjs` (duplicated profiles)
2. ✅ **Created**: `sync-empathy-ledger-profiles.mjs` (links only)
3. ✅ **Updated**: WhatsApp notifications instead of Slack
4. ✅ **Leveraged**: Existing `profile_appearances` pattern

### What Stays in Empathy Ledger:

- Profile photos (infrastructure hosted there)
- Profile bios and details
- Stories and consent
- Cultural protocols
- Privacy settings
- Organization links

### What JusticeHub Stores:

- Links (`profile_appearances`) showing:
  - Which profile appears on which content
  - What role they have (founder, service_user, etc.)
  - Story excerpt (context)
  - Featured status

**Result**: Best of both worlds - rich profile data with proper governance, linked to JusticeHub content contextually.

---

*Last updated: January 2, 2026*
*Architecture: Link-based, real-time, consent-controlled*
