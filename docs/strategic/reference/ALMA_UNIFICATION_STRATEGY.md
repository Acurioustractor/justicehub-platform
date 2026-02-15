# ALMA System Unification Strategy
## Making JusticeHub a Fully Interconnected Intelligence Ecosystem

**Date**: 2026-01-02
**Based On**: Comprehensive ALMA system analysis (Agent abd7e10)

---

## Executive Summary

ALMA infrastructure is **90% complete**. The core database architecture, governance systems, portfolio analytics, and media sentiment tracking are all in place. The final **10% is connection and display**.

**Current State**:
- ✅ 4 core ALMA entities (Interventions, Evidence, Outcomes, Contexts)
- ✅ Strong relationships between ALMA entities
- ✅ Hybrid linking to some JusticeHub content (services, community_programs)
- ✅ Media sentiment tracking with intervention mentions
- ✅ AI-powered extraction pipeline
- ❌ **Missing**: Articles, Profiles, Stories not linked to ALMA
- ❌ **Missing**: Unified "related content" display across all pages

**Strategic Goal**: Create a cohesive evidence flow where every piece of content links to related programs, profiles, research, and outcomes - guiding users through interconnected knowledge.

---

## Critical Gaps Identified

### 1. Missing Database Relationships

| Gap | Impact | Solution |
|-----|--------|----------|
| Articles ↔ ALMA Interventions | Blog posts can't reference ALMA interventions | Create `article_related_interventions` table |
| Articles ↔ ALMA Evidence | Research articles can't link to ALMA evidence | Create `article_related_evidence` table |
| Profiles ↔ ALMA Interventions | Can't show who founded/operates interventions | Create `alma_intervention_profiles` table |
| Profiles ↔ ALMA Evidence | Can't link researchers to evidence | Add `author_profile_id` to `alma_evidence` |
| Stories ↔ ALMA Interventions | Multimedia stories can't reference interventions | Create `story_related_interventions` table |
| Organizations ↔ Interventions | `operating_organization` is text, not FK | Add `operating_organization_id UUID` |

### 2. Missing Frontend Features

- **No "Related Content" sections** on any entity pages
- **No cross-linking** between ALMA and JusticeHub content in UI
- **No unified search** across all entities
- **No recommendation engine** ("You might also be interested in...")
- **No QLD-specific intelligence dashboard** (despite having 39 programs documented)
- **No evidence flow visualization** (research → intervention → outcome)

### 3. Duplicate/Overlapping Content

- **Programs**: `community_programs` (117 legacy) + `alma_interventions` (new)
  - Solution: Hybrid linking already exists, need to expose in UI
- **Article tables**: `articles` (enhanced) + `blog_posts` (deprecated)
  - Solution: Migrations show consolidation complete

---

## Implementation Roadmap

### Phase 1: Database Unification (Week 1)
**Goal**: Create missing relationship tables

#### New Tables to Create

```sql
-- Articles → ALMA Interventions
CREATE TABLE article_related_interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  intervention_id UUID NOT NULL REFERENCES alma_interventions(id) ON DELETE CASCADE,
  relevance_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, intervention_id)
);

-- Articles → ALMA Evidence
CREATE TABLE article_related_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES alma_evidence(id) ON DELETE CASCADE,
  relevance_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, evidence_id)
);

-- Stories → ALMA Interventions
CREATE TABLE story_related_interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  intervention_id UUID NOT NULL REFERENCES alma_interventions(id) ON DELETE CASCADE,
  relevance_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, intervention_id)
);

-- Profiles → ALMA Interventions (founders, staff, participants)
CREATE TABLE alma_intervention_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID NOT NULL REFERENCES alma_interventions(id) ON DELETE CASCADE,
  public_profile_id UUID NOT NULL REFERENCES public_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('founder', 'staff', 'researcher', 'participant', 'community_elder')),
  started_date DATE,
  ended_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(intervention_id, public_profile_id, role)
);

-- Organizations → Interventions (upgrade from text to FK)
ALTER TABLE alma_interventions
  ADD COLUMN operating_organization_id UUID REFERENCES organizations(id);

-- Profiles → Evidence (link researchers/authors)
ALTER TABLE alma_evidence
  ADD COLUMN author_profile_id UUID REFERENCES public_profiles(id);

-- Create indexes for performance
CREATE INDEX idx_article_related_interventions_article ON article_related_interventions(article_id);
CREATE INDEX idx_article_related_interventions_intervention ON article_related_interventions(intervention_id);
CREATE INDEX idx_article_related_evidence_article ON article_related_evidence(article_id);
CREATE INDEX idx_article_related_evidence_evidence ON article_related_evidence(evidence_id);
CREATE INDEX idx_story_related_interventions_story ON story_related_interventions(story_id);
CREATE INDEX idx_story_related_interventions_intervention ON story_related_interventions(intervention_id);
CREATE INDEX idx_alma_intervention_profiles_intervention ON alma_intervention_profiles(intervention_id);
CREATE INDEX idx_alma_intervention_profiles_profile ON alma_intervention_profiles(public_profile_id);
CREATE INDEX idx_alma_interventions_org ON alma_interventions(operating_organization_id);
CREATE INDEX idx_alma_evidence_author ON alma_evidence(author_profile_id);
```

**Migration File**: `supabase/migrations/20260102_alma_unification_links.sql`

---

### Phase 2: Data Backfill (Week 2)
**Goal**: Populate new relationship tables with existing data

#### Backfill Scripts Needed

1. **Match Organizations by Name**
   ```sql
   -- Match alma_interventions.operating_organization (text) to organizations.name
   UPDATE alma_interventions ai
   SET operating_organization_id = o.id
   FROM organizations o
   WHERE ai.operating_organization ILIKE o.name;
   ```

2. **Link Media Articles to Interventions**
   ```sql
   -- alma_media_articles.intervention_mentions[] already exists
   -- Ensure all mentions are valid intervention IDs
   ```

3. **Auto-suggest Links for Articles**
   - Use full-text search to suggest interventions/evidence related to article content
   - Store suggestions for manual review/approval
   - Script: `/scripts/suggest-article-alma-links.mjs`

4. **Link Profiles to Evidence**
   ```sql
   -- Match alma_evidence.author (text) to public_profiles by name
   UPDATE alma_evidence e
   SET author_profile_id = p.id
   FROM public_profiles p
   WHERE e.author ILIKE p.full_name;
   ```

---

### Phase 3: Frontend "Related Content" Components (Week 3-4)
**Goal**: Add "Related Content" sections to all entity pages

#### Universal Related Content Component

**File**: `/src/components/RelatedContent.tsx`

```typescript
interface RelatedContentProps {
  entityType: 'intervention' | 'evidence' | 'article' | 'profile' | 'program' | 'story';
  entityId: string;
}

export function RelatedContent({ entityType, entityId }: RelatedContentProps) {
  // Fetch related content from all entity types
  const { data } = useRelatedContent(entityType, entityId);

  return (
    <div className="border-2 border-black bg-white p-6">
      <h3 className="text-2xl font-bold mb-6">Related Content</h3>

      {data.interventions?.length > 0 && (
        <RelatedSection title="Programs & Interventions" items={data.interventions} />
      )}

      {data.evidence?.length > 0 && (
        <RelatedSection title="Research & Evidence" items={data.evidence} />
      )}

      {data.articles?.length > 0 && (
        <RelatedSection title="Articles & Stories" items={data.articles} />
      )}

      {data.profiles?.length > 0 && (
        <RelatedSection title="People & Organizations" items={data.profiles} />
      )}

      {data.media?.length > 0 && (
        <RelatedSection title="Media Coverage" items={data.media} />
      )}
    </div>
  );
}
```

#### Hook for Fetching Related Content

**File**: `/src/hooks/useRelatedContent.ts`

```typescript
export function useRelatedContent(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['related-content', entityType, entityId],
    queryFn: async () => {
      const response = await fetch(`/api/related-content?type=${entityType}&id=${entityId}`);
      return response.json();
    },
  });
}
```

#### API Route for Related Content

**File**: `/src/app/api/related-content/route.ts`

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get('type');
  const entityId = searchParams.get('id');

  const supabase = createClient();

  // Fetch direct relationships
  const related = await getDirectRelationships(supabase, entityType, entityId);

  // Fetch topic-similar content (using search_vector)
  const similar = await getTopicSimilar(supabase, entityType, entityId);

  // Fetch geographic similarity (same state/region)
  const geographic = await getGeographicSimilar(supabase, entityType, entityId);

  return NextResponse.json({
    interventions: [...related.interventions, ...similar.interventions],
    evidence: [...related.evidence, ...similar.evidence],
    articles: [...related.articles, ...similar.articles],
    profiles: [...related.profiles],
    programs: [...related.programs],
    media: [...related.media, ...geographic.media],
  });
}
```

---

### Phase 4: Page-by-Page Integration (Week 3-4)

#### 1. Intervention Detail Page (`/intelligence/interventions/[id]`)

**Add Sections**:
- ✅ Linked Evidence (already exists)
- ✅ Linked Outcomes (already exists)
- ✅ Linked Contexts (already exists)
- **ADD**: Related Articles (via `article_related_interventions`)
- **ADD**: Related Stories (via `story_related_interventions`)
- **ADD**: Founders & Staff (via `alma_intervention_profiles`)
- **ADD**: Media Mentions (via `alma_media_articles.intervention_mentions[]`)
- **ADD**: Related Community Programs (via hybrid link)
- **ADD**: Operating Organization (via `operating_organization_id`)

#### 2. Article Detail Page (`/articles/[slug]`)

**Add Sections**:
- ✅ Related Programs (already exists via `article_related_programs`)
- ✅ Related Services (already exists via `article_related_services`)
- ✅ Related Articles (already exists via `article_related_articles`)
- **ADD**: Related Interventions (via `article_related_interventions`)
- **ADD**: Related Evidence (via `article_related_evidence`)

#### 3. Profile Page (`/profiles/[id]`)

**Add Sections**:
- ✅ Related Art Projects (already exists)
- ✅ Related Programs (already exists)
- ✅ Related Services (already exists)
- **ADD**: Founded/Operated Interventions (via `alma_intervention_profiles`)
- **ADD**: Authored Evidence (via `alma_evidence.author_profile_id`)

#### 4. Story Page (`/stories/[slug]`)

**Add Sections**:
- ✅ Related Programs (already exists)
- ✅ Related Services (already exists)
- ✅ Related Art (already exists)
- **ADD**: Related Interventions (via `story_related_interventions`)

#### 5. Evidence Detail Page (`/intelligence/evidence/[id]`) - NEW PAGE

**Create**: Individual evidence detail pages

**Sections**:
- Evidence metadata (title, type, methodology, findings)
- Author profile (via `author_profile_id`)
- Related interventions (via `alma_intervention_evidence`)
- Related outcomes (via `alma_evidence_outcomes`)
- Related articles (via `article_related_evidence`)
- Citation information
- Revenue attribution (if commercial use tracked)

#### 6. Media Article Detail Page (`/intelligence/media/[id]`) - NEW PAGE

**Create**: Individual media article detail pages

**Sections**:
- Article metadata (headline, source, date, sentiment)
- Full summary and key quotes
- Source link (prominent CTA)
- Mentioned interventions (via `intervention_mentions[]`)
- Mentioned government programs (via `government_mentions`)
- Related articles (topic similarity)

---

### Phase 5: Intelligence Dashboards (Week 5-6)

#### 1. QLD Intelligence Dashboard (`/intelligence/qld`)

**Purpose**: Highlight QLD's 39 documented programs vs. detention policy tension

**Sections**:
1. **Overview Stats**:
   - 39 programs documented
   - Evidence strength distribution
   - Community control percentage
   - Total youth engaged annually

2. **Policy Tension Analysis**:
   - Recent legislation emphasizing detention
   - Evidence showing community programs work better
   - Cost comparison (detention vs. community)
   - Media sentiment on QLD youth justice

3. **Top Programs**:
   - Highest evidence scores
   - Best outcomes
   - Most cost-effective
   - Ready to scale

4. **Evidence Gap Analysis**:
   - What's working but underfunded
   - What needs more research
   - Learning opportunities

#### 2. Cross-State Comparison (`/intelligence/compare`)

**Interactive Tool**: Compare states on key metrics

**Metrics**:
- Number of interventions documented
- Evidence strength distribution
- Community control percentage (Community Controlled vs. government-led)
- Average reoffending reduction
- Cost per participant
- Media sentiment

**Visualization**: Side-by-side comparison cards with charts

#### 3. Evidence Flow Map (`/intelligence/evidence-flow`)

**Interactive Visualization**: Show research → interventions → outcomes flow

**Features**:
- Node graph showing connections
- Filter by evidence type, intervention type, outcome type
- Click nodes to see detail
- Identify evidence gaps
- Show community vs. academic sources

---

### Phase 6: Search & Discovery (Week 7-8)

#### 1. Unified Search Across All Entities

**Route**: `/search?q=...`

**Search Across**:
- ALMA Interventions
- ALMA Evidence
- ALMA Media Articles
- Articles (blog posts)
- Stories
- Community Programs
- Services
- Profiles
- Organizations

**Features**:
- Faceted search (filter by entity type)
- Sort by relevance, date, evidence strength
- Preview cards for each result
- "Related to your search" suggestions

#### 2. Recommendation Engine

**"You Might Also Be Interested In"**:
- Based on what user is viewing
- Based on topic similarity (using `search_vector`)
- Based on geographic proximity
- Based on evidence chain (evidence → intervention → outcome)

**Implementation**:
```typescript
async function getRecommendations(userId: string, currentEntityType: string, currentEntityId: string) {
  // 1. Get user's recent views
  const recentViews = await getUserRecentViews(userId);

  // 2. Find topic-similar content
  const topicSimilar = await getTopicSimilar(currentEntityType, currentEntityId);

  // 3. Find content in same evidence chain
  const evidenceChain = await getEvidenceChain(currentEntityType, currentEntityId);

  // 4. Find geographic similar (same state/region)
  const geoSimilar = await getGeoSimilar(currentEntityType, currentEntityId);

  // 5. Combine and rank
  return rankRecommendations([...topicSimilar, ...evidenceChain, ...geoSimilar]);
}
```

#### 3. Email Digests (Future)

**"New Content Related to Interventions You Follow"**:
- User follows specific interventions/topics
- Weekly/monthly email with new articles, evidence, media coverage
- Personalized recommendations

---

## Success Metrics

### Data Connectivity Metrics

- **Link Density**: Average number of related entities per intervention/article/profile
  - **Target**: 5+ related items per entity

- **Coverage**: Percentage of entities with at least one related link
  - **Target**: 90%+ interventions have related content

- **Evidence Chain Completeness**: Percentage of interventions with linked evidence and outcomes
  - **Target**: 80%+

### User Engagement Metrics

- **Click-Through Rate**: % of users who click "Related Content" links
  - **Target**: 40%+

- **Session Depth**: Average number of pages viewed per session (should increase)
  - **Baseline**: Establish current average
  - **Target**: 30% increase

- **Time on Site**: Average session duration (should increase with interconnected content)
  - **Baseline**: Establish current average
  - **Target**: 25% increase

### Content Discovery Metrics

- **Search Usage**: % of sessions that use search
  - **Target**: 20%+

- **Cross-Entity Navigation**: % of sessions that view multiple entity types
  - **Target**: 50%+

- **Evidence Flow Completion**: % of users who follow research → intervention → outcome chain
  - **Target**: 15%+

---

## Migration Timeline

### Week 1: Database
- Create relationship tables
- Create indexes
- Deploy migration

### Week 2: Backfill
- Run backfill scripts
- Validate data integrity
- Manual review of auto-matched links

### Week 3-4: Frontend Components
- Build `RelatedContent` component
- Build related content API
- Integrate into all entity pages

### Week 5-6: Dashboards
- Build QLD dashboard
- Build cross-state comparison
- Build evidence flow visualization

### Week 7-8: Search
- Build unified search
- Build recommendation engine
- Add "you might also like" sections

---

## Next Immediate Actions

1. **Create migration file** with all relationship tables
2. **Deploy to staging** and test with sample data
3. **Build RelatedContent component** as reusable foundation
4. **Start with highest-value pages**: Intervention detail, Article detail
5. **Measure baseline metrics** before rollout
6. **Iterate based on user feedback**

---

## Long-Term Vision: Cohesive Evidence Flow

**User Journey Example**:

1. User reads **article** about BackTrack Youth Works program
2. Sees **related intervention** link → clicks to ALMA intervention page
3. Sees **linked evidence** → clicks to research study showing 60% reoffending reduction
4. Sees **linked outcome** → understands what "reoffending reduction" means
5. Sees **linked context** → understands community context where program operates
6. Sees **media mentions** → reads positive news coverage
7. Sees **founder profile** → learns about person who started program
8. Sees **related programs** in same state → discovers similar interventions
9. Sees **"Ready to Scale"** flag in portfolio analytics → understands investment opportunity

**Result**: User has followed a complete evidence chain from article → program → research → outcomes → context → people → related programs. This is the **cohesive intelligence ecosystem** ALMA was designed to create.

---

## Conclusion

ALMA's technical foundation is excellent. The final step is **making connections visible and discoverable**. By creating 4-5 relationship tables and building a comprehensive "related content" frontend, JusticeHub becomes a fully interconnected knowledge graph where every piece of evidence naturally flows to related programs, profiles, research, and outcomes.

**The infrastructure is 90% complete. The final 10% is connection and display.**

Let's build it.
