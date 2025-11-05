# Auto-Linking & Content Suggestion System

## Overview

Automatically connect content across JusticeHub and provide intelligent suggestions for related content, creating a rich interconnected knowledge graph.

## Auto-Linking Strategies

### 1. Empathy Ledger Sync Auto-Linking

When profiles sync from Empathy Ledger, automatically link them:

**By Organization Name Match:**
```typescript
Profile has: current_organization = "Oonchiumpa"
→ Auto-link to: Organization where name LIKE "%Oonchiumpa%"
→ Set role: Based on justicehub_role or default to "Team Member"
```

**By Bio Keywords:**
```typescript
Bio contains: "founded", "co-founded", "started"
→ Role = "Founder"

Bio contains: "director", "executive director", "CEO"
→ Role = "Director"

Bio contains: "board member", "board"
→ Role = "Board Member"

Bio contains: "volunteer", "volunteering"
→ Role = "Volunteer"
```

**By Location Match:**
```typescript
Profile location = "Alice Springs"
→ Link to programs/services in Alice Springs
→ Confidence: Medium
```

### 2. Text Analysis Auto-Linking

**Named Entity Recognition:**
```typescript
Bio: "Kristy Bloomfield chairs Oonchiumpa and leads the Container Project"
→ Extract entities:
   - "Oonchiumpa" (organization)
   - "Container Project" (program)
→ Auto-link with high confidence
```

**Co-occurrence Analysis:**
```typescript
If profile mentions:
- "youth justice" + "Central Australia"
→ Suggest programs tagged with both
- "cultural healing" + "Indigenous"
→ Suggest relevant services
```

### 3. Cross-Reference Auto-Linking

**Story → People:**
```typescript
Story title: "Kristy Bloomfield: Building Hope in Shipping Containers"
→ Search profiles for "Kristy Bloomfield"
→ Auto-link as "Subject"

Story content contains: "@mention[Kristy Bloomfield]"
→ Auto-link as "Mentioned"
```

**Program → Organization:**
```typescript
Program: "Oonchiumpa Container Project"
→ Parse name for organization reference
→ Auto-link to Oonchiumpa organization
```

## Database Schema for Suggestions

```sql
-- Table to track suggested links (not yet confirmed)
CREATE TABLE content_link_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- What's being linked
  source_type TEXT NOT NULL, -- 'profile', 'organization', 'program', 'service', 'story'
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,

  -- Suggestion details
  suggested_role TEXT, -- e.g., 'Founder', 'Mentioned in'
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  reasoning TEXT, -- Why this link was suggested

  -- Evidence
  evidence JSONB, -- Keywords found, text excerpts, etc.

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'auto-applied'
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,

  -- Auto-apply threshold
  auto_applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT now(),

  -- Ensure unique suggestions
  UNIQUE(source_type, source_id, target_type, target_id)
);

-- Index for querying pending suggestions
CREATE INDEX idx_suggestions_pending
ON content_link_suggestions(status, confidence DESC)
WHERE status = 'pending';

-- Index for source lookups
CREATE INDEX idx_suggestions_source
ON content_link_suggestions(source_type, source_id);
```

## Auto-Linking Rules Engine

### Rule Categories

**High Confidence (Auto-Apply):**
- Exact organization name match in `current_organization` field
- Empathy Ledger `primary_organization_id` maps to existing org
- @mention tags in content
- Explicit role keywords ("I founded", "I work at")

**Medium Confidence (Suggest for Review):**
- Partial name matches (fuzzy matching)
- Location + topic overlap
- Bio keywords suggest involvement
- Co-occurrence in multiple sources

**Low Confidence (Show as "Related"):**
- Similar topics/tags
- Geographic proximity
- Temporal overlap (active at same time)
- Keyword similarity

### Implementation

```typescript
// src/lib/auto-linking/engine.ts

interface LinkSuggestion {
  sourceType: 'profile' | 'organization' | 'program' | 'service' | 'story';
  sourceId: string;
  targetType: string;
  targetId: string;
  role?: string;
  confidence: number;
  reasoning: string;
  evidence: any;
}

export async function generateLinkSuggestions(
  sourceType: string,
  sourceId: string
): Promise<LinkSuggestion[]> {
  const suggestions: LinkSuggestion[] = [];

  // Get source entity
  const source = await getEntity(sourceType, sourceId);

  // Run all matchers
  suggestions.push(...await matchByOrganizationName(source));
  suggestions.push(...await matchByBioKeywords(source));
  suggestions.push(...await matchByLocation(source));
  suggestions.push(...await matchByNamedEntities(source));
  suggestions.push(...await matchByCooccurrence(source));

  // Sort by confidence
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

async function matchByOrganizationName(profile: Profile): Promise<LinkSuggestion[]> {
  if (!profile.current_organization) return [];

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .ilike('name', `%${profile.current_organization}%`);

  return orgs?.map(org => ({
    sourceType: 'profile',
    sourceId: profile.id,
    targetType: 'organization',
    targetId: org.id,
    role: inferRoleFromBio(profile.bio),
    confidence: calculateMatchConfidence(org.name, profile.current_organization),
    reasoning: `Profile lists organization: "${profile.current_organization}"`,
    evidence: {
      fieldMatch: 'current_organization',
      profileValue: profile.current_organization,
      orgName: org.name
    }
  })) || [];
}

async function matchByBioKeywords(profile: Profile): Promise<LinkSuggestion[]> {
  const suggestions: LinkSuggestion[] = [];
  const bio = profile.bio?.toLowerCase() || '';

  // Extract organization mentions
  const orgPatterns = [
    /founded?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /works?\s+(?:at|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /(?:chair|director|CEO)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
  ];

  for (const pattern of orgPatterns) {
    const matches = [...profile.bio.matchAll(pattern)];
    for (const match of matches) {
      const orgName = match[1];

      // Search for matching organization
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name')
        .ilike('name', `%${orgName}%`)
        .single();

      if (org) {
        suggestions.push({
          sourceType: 'profile',
          sourceId: profile.id,
          targetType: 'organization',
          targetId: org.id,
          role: inferRoleFromContext(match[0]),
          confidence: 0.85,
          reasoning: `Bio mentions: "${match[0]}"`,
          evidence: {
            bioExcerpt: match[0],
            extractedName: orgName
          }
        });
      }
    }
  }

  return suggestions;
}

function inferRoleFromBio(bio: string): string {
  const bioLower = bio.toLowerCase();

  if (bioLower.includes('founded') || bioLower.includes('co-founded')) {
    return 'Founder';
  }
  if (bioLower.includes('director') || bioLower.includes('ceo')) {
    return 'Director';
  }
  if (bioLower.includes('chair')) {
    return 'Chair';
  }
  if (bioLower.includes('board')) {
    return 'Board Member';
  }
  if (bioLower.includes('volunteer')) {
    return 'Volunteer';
  }

  return 'Team Member';
}

function calculateMatchConfidence(str1: string, str2: string): number {
  // Simple Levenshtein-based similarity
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
}
```

## Suggestion Workflow

### 1. When Content is Added/Updated

```typescript
// After profile sync from Empathy Ledger
async function onProfileSynced(profileId: string) {
  // Generate suggestions
  const suggestions = await generateLinkSuggestions('profile', profileId);

  // Auto-apply high confidence suggestions
  for (const suggestion of suggestions) {
    if (suggestion.confidence >= 0.9) {
      await applyLinkSuggestion(suggestion);
      await logSuggestion(suggestion, 'auto-applied');
    } else if (suggestion.confidence >= 0.6) {
      await saveSuggestion(suggestion, 'pending');
    } else {
      // Low confidence - show as "related" but don't store
      await addToRelatedContent(suggestion);
    }
  }
}

// After organization is created
async function onOrganizationCreated(orgId: string) {
  // Find profiles that mention this organization
  const { data: profiles } = await supabase
    .from('public_profiles')
    .select('*')
    .or(`current_organization.ilike.%${orgName}%,bio.ilike.%${orgName}%`);

  for (const profile of profiles) {
    const suggestions = await generateLinkSuggestions('profile', profile.id);
    await processSuggestions(suggestions);
  }
}
```

### 2. Admin Review Interface

```
┌────────────────────────────────────────────────────────────┐
│  Suggested Links (12 pending)                              │
│  ──────────────────────────────────────────────────────   │
│                                                            │
│  High Confidence (Auto-applied: 5)                         │
│  ✓ Kristy Bloomfield → Oonchiumpa (Founder) [95%]        │
│  ✓ Tanya Turner → Oonchiumpa (Founder) [94%]             │
│                                                            │
│  Review Needed (7)                                         │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Uncle Dale → Container Project (Cultural Advisor)    │ │
│  │ Confidence: 78%                                      │ │
│  │ Reason: Bio mentions "cultural advisor for container│ │
│  │         project in Alice Springs"                   │ │
│  │                                                      │ │
│  │ [✓ Approve] [✗ Reject] [✏️ Edit Role]               │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Low Confidence (Show as Related)                          │
│  • Kate Bjur might be related to 3 programs               │
│  • Benjamin Knight might know 12 people                    │
└────────────────────────────────────────────────────────────┘
```

## Related Content Widgets

### On Profile Pages

```typescript
// Show related content based on suggestions
<RelatedContent profileId={profile.id}>
  <RelatedPeople /> // People with similar roles/locations
  <RelatedPrograms /> // Programs they might be involved in
  <RelatedStories /> // Stories that mention similar topics
</RelatedContent>
```

### On Organization Pages

```typescript
<SuggestedPeople organizationId={org.id}>
  // People whose bios mention this organization
  // Auto-filtered by confidence threshold
</SuggestedPeople>
```

## Learning System

Track which suggestions get approved/rejected to improve future suggestions:

```sql
-- Track suggestion outcomes for machine learning
CREATE TABLE suggestion_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID REFERENCES content_link_suggestions(id),
  action TEXT, -- 'approved', 'rejected', 'edited'
  original_role TEXT,
  final_role TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Use this data to:
-- 1. Adjust confidence thresholds
-- 2. Improve keyword patterns
-- 3. Learn which bio phrases indicate which roles
```

## Implementation Phases

### Phase 1: Basic Auto-Linking ✓
- [x] Database schema for suggestions
- [ ] Organization name matching
- [ ] Auto-link on Empathy Ledger sync
- [ ] Simple keyword extraction

### Phase 2: Enhanced Matching
- [ ] Named entity recognition
- [ ] Fuzzy string matching
- [ ] Bio text analysis
- [ ] Location-based suggestions

### Phase 3: Admin Interface
- [ ] Pending suggestions view
- [ ] Bulk approve/reject
- [ ] Edit suggested roles
- [ ] Confidence threshold settings

### Phase 4: Related Content
- [ ] "People You Might Know" widget
- [ ] "Related Programs" suggestions
- [ ] "Similar Stories" recommendations
- [ ] Cross-linking suggestions

### Phase 5: Learning & Optimization
- [ ] Track suggestion accuracy
- [ ] Adjust confidence thresholds
- [ ] Improve keyword patterns
- [ ] A/B test suggestion algorithms

## Auto-Linking Rules Examples

```yaml
# Rules configuration
auto_linking_rules:

  # Organization matching
  - type: organization_name_match
    confidence: 0.95
    auto_apply: true
    conditions:
      - field: current_organization
        operator: exact_match
    action: link_to_organization
    role: Team Member

  # Founder detection
  - type: founder_keyword_match
    confidence: 0.90
    auto_apply: true
    conditions:
      - field: bio
        operator: contains
        values: ["founded", "co-founded", "co-founder"]
    action: link_to_organization
    role: Founder

  # Location + topic match
  - type: location_topic_match
    confidence: 0.65
    auto_apply: false
    conditions:
      - field: location
        operator: equals
      - field: bio
        operator: contains_keywords
        min_matches: 2
    action: link_to_program
    role: Participant
```

## Next Steps

1. Create suggestion database table
2. Update Empathy Ledger sync to run auto-linking
3. Build suggestion engine with keyword matching
4. Create admin review interface
5. Add "Related Content" widgets across site
6. Implement learning system to improve suggestions

---

**Goal**: Every piece of content automatically connects to related content, creating a self-organizing knowledge graph that gets smarter over time.
