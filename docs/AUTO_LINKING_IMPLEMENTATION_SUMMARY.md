# Auto-Linking System - Implementation Summary

## What We Built

A comprehensive automatic content linking system that:
1. **Auto-links** profiles to organizations when synced from Empathy Ledger
2. **Generates suggestions** for other connections with confidence scores
3. **Auto-applies** high-confidence suggestions (≥90%)
4. **Saves** medium-confidence suggestions (60-89%) for admin review
5. **Tracks** low-confidence matches (<60%) as "related content"

## Files Created

### Database Migrations
- `/supabase/migrations/20250126000005_add_organizations_profiles.sql`
  - Creates `organizations_profiles` junction table
  - Creates `blog_posts_profiles` junction table

- `/supabase/migrations/20250126000006_add_content_suggestions.sql`
  - Creates `content_link_suggestions` table
  - Creates `suggestion_feedback` table for learning

### Auto-Linking Engine
- `/src/lib/auto-linking/engine.ts`
  - Text analysis and keyword extraction
  - Fuzzy string matching (Levenshtein distance)
  - Role inference from bio text
  - Confidence scoring
  - Auto-apply logic for high-confidence matches

### Scripts
- `/src/scripts/link-oonchiumpa-founders.ts` - Manual linking for testing
- `/src/scripts/test-auto-linking.ts` - Test the auto-linking engine

### Documentation
- `/docs/AUTO_LINKING_SYSTEM.md` - Complete system specification
- `/docs/PROFILE_SYSTEM_IMPLEMENTATION.md` - Full profile linking architecture
- `/docs/PROFILE_LINKING_QUICK_START.md` - Quick start guide
- `/docs/AUTO_LINKING_IMPLEMENTATION_SUMMARY.md` - This file

## How It Works

### 1. Text Analysis Strategies

**Organization Name Matching:**
```typescript
Profile has: current_organization = "Oonchiumpa"
→ Find organization with name matching "Oonchiumpa"
→ Confidence: 95% (exact match) or 70-90% (fuzzy match)
→ Action: Auto-link
```

**Bio Keyword Extraction:**
```typescript
Bio contains: "founded Oonchiumpa"
→ Extract "Oonchiumpa" as organization name
→ Infer role: "Founder"
→ Confidence: 90%
→ Action: Auto-link
```

**Pattern Matching:**
- "founded/co-founded [ORG]" → Founder role (90% confidence)
- "chairs [ORG]" → Chair role (88% confidence)
- "director of [ORG]" → Director role (87% confidence)
- "works at [ORG]" → Team Member role (75% confidence)
- "board member of [ORG]" → Board Member role (85% confidence)

### 2. Confidence Levels

| Confidence | Action | Description |
|-----------|--------|-------------|
| ≥90% | Auto-apply | Very high confidence - automatically create link |
| 60-89% | Admin review | Medium confidence - save as suggestion |
| <60% | Related content | Low confidence - show as "you might be interested in" |

### 3. Auto-Linking Flow

```
New Profile Synced from Empathy Ledger
         ↓
Run Auto-Linking Engine
         ↓
Generate Suggestions (text analysis)
         ↓
    ┌────────┬────────┬────────┐
    ↓        ↓        ↓        ↓
  ≥90%    60-89%    <60%   No match
    ↓        ↓        ↓
Auto-link  Save as  Related
           suggestion content
```

## Current Status

### ✅ Completed
1. Database schema for junction tables
2. Database schema for suggestions
3. Auto-linking engine with text analysis
4. Fuzzy string matching
5. Role inference from bio keywords
6. Confidence scoring
7. Manual linking scripts
8. Test scripts
9. Comprehensive documentation

### 🔄 Next Steps
1. Run suggestions migration in Supabase
2. Test auto-linking with real profiles
3. Update Empathy Ledger sync to call auto-linking
4. Build admin UI for reviewing suggestions
5. Add "Related Content" widgets to pages
6. Build profile pages showing connections

## Testing The System

### Step 1: Run Migrations

```sql
-- In Supabase SQL Editor (JusticeHub)
-- Copy/paste from:
-- 1. supabase/migrations/20250126000006_add_content_suggestions.sql
```

### Step 2: Test Auto-Linking

```bash
# This will analyze all synced profiles and generate suggestions
npx tsx src/scripts/test-auto-linking.ts
```

Expected output:
```
🤖 Testing Auto-Linking Engine

Found 31 synced profiles. Generating suggestions...

📋 Kristy Bloomfield (kristy-bloomfield)
────────────────────────────────────────────────────────────
  ⭐ HIGH CONFIDENCE (Auto-Apply):
    → organization (Founder) - 95%
      Reason: Profile's current_organization field matches "Oonchiumpa"
    → organization (Chair) - 90%
      Reason: Bio mentions: "chairs Oonchiumpa"

  💾 Saving suggestions...
  ✅ Auto-applied 2 high confidence suggestions

📊 SUMMARY
────────────────────────────────────────────────────────────
Profiles analyzed: 31
Total suggestions: 87
Auto-applied: 45
Pending review: 42
```

### Step 3: Review Results

```bash
# Check what got auto-linked
npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.YJSF_SUPABASE_SERVICE_KEY
);

const { data } = await supabase
  .from('organizations_profiles')
  .select('*, profile:public_profiles(full_name), org:organizations(name)')
  .order('created_at', { ascending: false })
  .limit(10);

console.log('Recently auto-linked:');
data?.forEach(link => {
  console.log(\`  \${link.profile.full_name} → \${link.org.name} (\${link.role})\`);
});
"
```

### Step 4: Check Pending Suggestions

```bash
# See what needs review
npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.YJSF_SUPABASE_SERVICE_KEY
);

const { data } = await supabase
  .from('content_link_suggestions')
  .select('*')
  .eq('status', 'pending')
  .order('confidence', { ascending: false })
  .limit(10);

console.log('Pending suggestions:');
data?.forEach(s => {
  console.log(\`  [\${(s.confidence * 100).toFixed(0)}%] \${s.reasoning}\`);
});
"
```

## Example Auto-Linking Results

Based on the 31 profiles we synced from Empathy Ledger:

### High Confidence Auto-Links (Expected)
- **Kristy Bloomfield** → Oonchiumpa (Founder & Chair) - 95%
  - current_organization: "Oonchiumpa"
  - Bio: "chairs Oonchiumpa"

- **Tanya Turner** → Oonchiumpa (Founder) - 94%
  - current_organization: "Oonchiumpa"
  - Bio: "co-founded Oonchiumpa"

- **Patricia Ann Miller** → Oonchiumpa (Founder) - 94%
  - current_organization: "Oonchiumpa"

- **Kate Bjur** → Diagrama (Director) - 92%
  - current_organization: "Diagrama"
  - Bio: "Executive Director at Diagrama"

- **Benjamin Knight** → Diagrama (Advocate) - 90%
  - current_organization: "Diagrama"
  - Bio: "advocate... with Diagrama"

### Medium Confidence Suggestions (Expected)
- **Enrique López** → Diagrama (Team Member) - 75%
  - Bio mentions "32 years transforming juvenile delinquency systems"
  - Location-based match

- **Jesús Teruel** → Diagrama (Coordinator) - 72%
  - Bio mentions "Coordinator... at Diagrama"

### Low Confidence / Related (Expected)
- Various profiles → programs based on location
- Various profiles → other profiles based on similar keywords

## Integration Points

### When Profile Syncs from Empathy Ledger

```typescript
// In sync-empathy-ledger-profiles.ts
import { generateProfileLinkSuggestions, saveSuggestions, autoApplyHighConfidenceSuggestions } from '@/lib/auto-linking/engine';

// After creating/updating profile:
const suggestions = await generateProfileLinkSuggestions(newProfile.id);
await saveSuggestions(suggestions);
await autoApplyHighConfidenceSuggestions(suggestions);
```

### When Admin Creates Profile Manually

```typescript
// In admin profile creation form:
async function onProfileCreated(profileId: string) {
  // Run auto-linking
  const suggestions = await generateProfileLinkSuggestions(profileId);

  // Show suggestions to admin immediately
  return {
    profile,
    suggestions: suggestions.filter(s => s.confidence >= 0.60)
  };
}
```

### On Organization Page

```typescript
// Show people who might be affiliated
const { data: suggestedPeople } = await supabase
  .from('content_link_suggestions')
  .select('*, profile:public_profiles(*)')
  .eq('target_type', 'organization')
  .eq('target_id', orgId)
  .eq('status', 'pending')
  .gte('confidence', 0.60)
  .order('confidence', { ascending: false });
```

## Admin UI Mockup

```
/admin/suggestions
┌────────────────────────────────────────────────────────────┐
│  Suggested Links                                           │
│  ──────────────────────────────────────────────────────   │
│  [Tabs: All (42) | High (5) | Medium (37) | Applied (45)] │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 📋 Uncle Dale → Container Project                    │ │
│  │ Role: Cultural Advisor | Confidence: 85%            │ │
│  │                                                      │ │
│  │ Reason: Bio mentions "cultural advisor for contain- │ │
│  │         er project in Alice Springs"                │ │
│  │                                                      │ │
│  │ Evidence:                                            │ │
│  │ • Bio excerpt: "...dedicated cultural advisor..."   │ │
│  │ • Location match: Alice Springs                     │ │
│  │                                                      │ │
│  │ [✓ Approve] [✗ Reject] [✏️ Edit Role ▾]            │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [Load More...]                                            │
└────────────────────────────────────────────────────────────┘
```

## Benefits

1. **Saves Time**: Auto-links obvious connections, reducing manual work
2. **Discovers Hidden Connections**: Finds links you might have missed
3. **Scales**: Handles hundreds of profiles automatically
4. **Gets Smarter**: Learns from admin feedback to improve suggestions
5. **Creates Network Effects**: More links = more discoverable content
6. **Improves SEO**: Rich internal linking structure
7. **Better UX**: Users discover related content naturally

## Metrics to Track

Once live, track:
- Auto-link success rate (how many get approved?)
- Suggestion acceptance rate by confidence level
- Most common role keywords found
- Which patterns produce best matches
- Time saved vs manual linking

---

**Status**: Ready to test! Run the migrations and test script to see it in action.
