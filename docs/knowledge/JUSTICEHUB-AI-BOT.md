# JusticeHub AI Bot Architecture

> **ALMA-Powered Conversational Intelligence for Youth Justice**

---

## Overview

The JusticeHub AI Bot is a conversational interface powered by ALMA (Authentic Learning for Meaningful Accountability). It enables users to ask questions about youth justice, get evidence-based answers, explore interventions, and access the knowledge commons - all while respecting cultural protocols and data sovereignty.

---

## 1. Bot Identity

### Name Options
- **ALMA** - Direct use of the system name
- **Justice Guide** - Friendly, approachable
- **The Hub** - Platform-centric

### Personality

```
Tone: Warm, knowledgeable, community-centered
Style: Evidence-based but accessible
Stance: Advocacy for community alternatives
Boundaries: Never profiles individuals, never ranks communities
```

### Introduction Message

```
G'day! I'm ALMA - your guide to Australia's youth justice evidence.

ALMA means "soul" in Spanish, and stands for Authentic Learning
for Meaningful Accountability.

I can help you:
• Find what works in youth justice
• Compare detention vs community costs
• Explore evidence-based interventions
• Understand the data

What would you like to know?
```

---

## 2. Conversation Intents

### Primary Intents

| Intent | Example Queries | Handler |
|--------|-----------------|---------|
| **what_works** | "What works for Indigenous youth diversion?" | Research Agent |
| **cost_comparison** | "How much does detention cost vs community?" | Impact Calculator |
| **find_intervention** | "Show me programs in Queensland" | Intervention Search |
| **explain_alma** | "What is ALMA?" | Static Response |
| **get_evidence** | "What's the evidence for on-country programs?" | Evidence Search |
| **find_service** | "Find legal services near Darwin" | Service Finder |
| **system_stats** | "What are current youth justice stats?" | Dashboard API |
| **story_search** | "Stories about successful diversion" | Content Search |

### Secondary Intents

| Intent | Example | Response |
|--------|---------|----------|
| **greeting** | "Hello" | Introduction message |
| **thanks** | "Thank you" | "You're welcome. Anything else?" |
| **clarify** | "What do you mean by diversion?" | Definition + context |
| **feedback** | "That's not right" | Feedback form link |
| **contact** | "How do I contact JusticeHub?" | Contact details |

### Boundary Intents (Redirect)

| Intent | Example | Response |
|--------|---------|----------|
| **individual_case** | "What should happen to this young person?" | "ALMA doesn't advise on individual cases. I can help you find services..." |
| **legal_advice** | "Is this legal?" | "I can't provide legal advice. Here are legal services..." |
| **prediction** | "Will this person reoffend?" | "ALMA never predicts individual behavior. I can share what research shows..." |

---

## 3. Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Web Chat  │  │   Widget    │  │   API       │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
└─────────┼────────────────┼────────────────┼─────────────────────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ALMA BOT ORCHESTRATOR                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Intent Classifier                          │  │
│  │  • Detect user intent from message                           │  │
│  │  • Route to appropriate handler                               │  │
│  │  • Check cultural protocol boundaries                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │
│  │ Research  │  │  Impact   │  │ Evidence  │  │  Service  │       │
│  │  Agent    │  │Calculator │  │  Search   │  │  Finder   │       │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘       │
│        │              │              │              │              │
└────────┼──────────────┼──────────────┼──────────────┼──────────────┘
         │              │              │              │
         └──────────────┼──────────────┼──────────────┘
                        │              │
                        ▼              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                   │
│                                                                     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐       │
│  │     ALMA       │  │   Knowledge    │  │    Vector      │       │
│  │   Database     │  │     Base       │  │    Search      │       │
│  │  (Supabase)    │  │  (docs/*.md)   │  │  (pgvector)    │       │
│  └────────────────┘  └────────────────┘  └────────────────┘       │
│                                                                     │
│  Tables:                                                            │
│  • alma_interventions    • alma_evidence      • alma_outcomes      │
│  • organizations         • services           • community_programs │
│  • alma_research_sessions (for agent memory)                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Details

#### 3.1 Intent Classifier

```typescript
// /api/bot/classify
interface ClassifyRequest {
  message: string;
  conversationId?: string;
  context?: Message[];
}

interface ClassifyResponse {
  intent: Intent;
  confidence: number;
  entities: Entity[];
  handler: 'research' | 'calculator' | 'search' | 'static' | 'redirect';
}

// Intent detection using LLM
const INTENT_PROMPT = `
You are classifying user messages for a youth justice knowledge system.

Available intents:
- what_works: Questions about effective interventions
- cost_comparison: Detention vs community cost questions
- find_intervention: Searching for specific programs
- explain_alma: Questions about ALMA itself
- get_evidence: Requests for research evidence
- find_service: Looking for local services
- system_stats: Current statistics requests
- story_search: Looking for stories/articles
- greeting: Hello, hi, etc.
- boundary_individual: About specific individuals (REDIRECT)
- boundary_legal: Legal advice requests (REDIRECT)
- boundary_prediction: Asking to predict behavior (REDIRECT)

Extract:
1. Primary intent
2. Jurisdiction (NT, QLD, NSW, VIC, WA, SA, TAS, ACT, national)
3. Population (Indigenous, all, specific age)
4. Program type (diversion, detention alternative, cultural, etc.)

Message: {message}
`;
```

#### 3.2 Research Agent Handler

Uses the existing `/api/intelligence/research` endpoint:

```typescript
// /api/bot/research
async function handleResearchIntent(
  query: string,
  entities: Entity[]
): Promise<BotResponse> {
  // Call existing research API
  const response = await fetch('/api/intelligence/research', {
    method: 'POST',
    body: JSON.stringify({
      query,
      depth: 'quick',
      maxConsentLevel: 'Public Knowledge Commons'
    })
  });

  const result = await response.json();

  // Format for conversational response
  return formatResearchResponse(result);
}

function formatResearchResponse(result: ResearchResult): BotResponse {
  const interventionCount = result.interventions.length;
  const topIntervention = result.interventions[0];

  return {
    message: `I found ${interventionCount} relevant interventions.\n\n` +
      `**Top match:** ${topIntervention.name}\n` +
      `Evidence level: ${topIntervention.evidenceLevel}\n\n` +
      result.summary,

    cards: result.interventions.slice(0, 3).map(i => ({
      title: i.name,
      subtitle: `${i.type} • ${i.geography}`,
      badge: i.evidenceLevel,
      link: `/intelligence/interventions/${i.id}`
    })),

    followUps: [
      'Tell me more about ' + topIntervention.name,
      'What are the evidence gaps?',
      'Compare these interventions'
    ]
  };
}
```

#### 3.3 Impact Calculator Handler

```typescript
// /api/bot/calculator
async function handleCalculatorIntent(
  entities: Entity[]
): Promise<BotResponse> {
  const { jurisdiction, population, duration } = entities;

  // Use existing stats
  const detentionCost = 3320; // per day
  const communityCost = 150;  // per day
  const days = duration || 365;

  const detentionTotal = detentionCost * days;
  const communityTotal = communityCost * days;
  const saving = detentionTotal - communityTotal;

  return {
    message: `**Cost Comparison (${days} days)**\n\n` +
      `🔴 Detention: $${detentionTotal.toLocaleString()}\n` +
      `🟢 Community: $${communityTotal.toLocaleString()}\n\n` +
      `**Potential saving: $${saving.toLocaleString()}**\n\n` +
      `For every young person diverted from detention to community programs, ` +
      `approximately $${saving.toLocaleString()} could be reinvested in prevention.`,

    cards: [{
      title: 'Impact Calculator',
      subtitle: 'Explore detailed cost comparisons',
      link: '/intelligence/impact-calculator'
    }],

    followUps: [
      'What programs cost $150/day?',
      'Show me the recidivism rates',
      'How is this money spent?'
    ]
  };
}
```

---

## 4. API Endpoints

### Chat Endpoint

```typescript
// POST /api/bot/chat
interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: {
    jurisdiction?: string;
    recentTopics?: string[];
  };
}

interface ChatResponse {
  message: string;
  cards?: Card[];
  followUps?: string[];
  sources?: Source[];
  conversationId: string;
}

interface Card {
  title: string;
  subtitle?: string;
  badge?: string;
  link?: string;
  image?: string;
}

interface Source {
  title: string;
  url: string;
  type: 'intervention' | 'evidence' | 'article';
}
```

### Widget Embed

```html
<!-- Embed widget on external sites -->
<script src="https://justicehub.org.au/widget/alma-bot.js"></script>
<div id="alma-bot" data-theme="light" data-position="bottom-right"></div>
```

---

## 5. Knowledge Sources

### Primary Sources (Real-time)

| Source | Endpoint | Use |
|--------|----------|-----|
| ALMA Interventions | `alma_interventions` | Program data |
| ALMA Evidence | `alma_evidence` | Research studies |
| ALMA Outcomes | `alma_outcomes` | Measured results |
| Services | `services` | Service directory |
| Organizations | `organizations` | Org info |

### Knowledge Base (Static)

| Document | Content |
|----------|---------|
| `knowledge/JUSTICEHUB.md` | Complete system reference |
| `vision/ALMA-2.0-VISION.md` | Roadmap and goals |
| `knowledge/DATA_MODEL.md` | Schema reference |

### Vector Search (Semantic)

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Embeddings for semantic search
CREATE TABLE alma_bot_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL, -- 'intervention', 'evidence', 'knowledge'
  content_id UUID,
  content_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semantic search function
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  content_type TEXT,
  content_id UUID,
  content_text TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.content_type,
    e.content_id,
    e.content_text,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM alma_bot_embeddings e
  WHERE 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Cultural Protocols

### Hard Boundaries

The bot MUST refuse to:

1. **Profile individuals**
   - "What should happen to [name]?" → Redirect to services
   - "Is this person likely to reoffend?" → Explain why we don't predict

2. **Rank communities**
   - "Which community is best?" → Explain signals vs scores
   - "Rate these organizations" → Explain why we don't rank

3. **Extract without consent**
   - "Give me all data about [community]" → Explain consent tiers
   - Questions about Community Controlled data → Explain access

### Boundary Response Template

```typescript
const BOUNDARY_RESPONSES = {
  individual_profiling: `
I can't provide advice about individual cases. ALMA watches systems,
not people.

I can help you find:
• Local youth legal services
• Diversion programs in your area
• Support services for families

Would you like me to search for services?
  `,

  ranking_request: `
ALMA uses signals (direction indicators), not scores (rankings).

We don't rank communities or organizations because:
• Context matters - what works varies by place
• Rankings can harm - they create competition, not collaboration
• Community authority matters most

I can show you what evidence says about different approaches.
Would you like to explore that?
  `,

  consent_boundary: `
Some information requires community consent to access.

ALMA respects three consent tiers:
• Public Knowledge Commons - Open access
• Community Controlled - Requires permission
• Strictly Private - Individual control

The information you're asking about is Community Controlled.
Would you like me to explain how to request access?
  `
};
```

---

## 7. Conversation Flows

### Flow 1: What Works Query

```
User: "What works for reducing youth crime in Queensland?"

Bot: [Intent: what_works, Jurisdiction: QLD]

Bot Response:
"Great question! Here's what the evidence shows for Queensland:

**Top evidence-based approaches:**

1. **Youth Justice Conferencing**
   Evidence Level: Proven (RCT)
   Recidivism reduction: 15-30%

2. **On-Country Cultural Programs**
   Evidence Level: Indigenous-led
   Strong community authority

3. **Transition Support Services**
   Evidence Level: Effective
   Post-release support

[Cards showing each intervention]

Want me to dive deeper into any of these?"

Suggested follow-ups:
• "Tell me more about Youth Justice Conferencing"
• "What's missing in Queensland?"
• "Compare these to detention"
```

### Flow 2: Cost Comparison

```
User: "How much does it cost to keep a kid in detention?"

Bot: [Intent: cost_comparison]

Bot Response:
"Detention is expensive - here's the breakdown:

**Daily Costs:**
🔴 Detention: $3,320/day
🟢 Community: $150/day

**Annual Costs (per young person):**
🔴 Detention: $1.2 million
🟢 Community: $55,000

**Potential saving per diversion: $1.15 million**

This doesn't include the human cost - detention has 84.5% recidivism
vs 20-40% for community programs.

[Link to Impact Calculator]

Would you like to explore what community programs cost $150/day?"
```

### Flow 3: Boundary Handling

```
User: "Can you tell me if this young person will reoffend?"

Bot: [Intent: boundary_prediction]

Bot Response:
"I understand you're trying to help, but I can't predict individual
behavior - and I'm designed not to.

Here's why: Prediction systems have been shown to:
• Entrench existing biases
• Label young people unfairly
• Miss the context that matters most

What I CAN help with:
• What research shows reduces reoffending overall
• Programs with strong evidence in your area
• Support services for the young person and family

Would you like me to find local support services?"
```

---

## 8. Implementation Plan

### Phase 1: Core Bot (Week 1-2)

- [ ] Create `/api/bot/chat` endpoint
- [ ] Implement intent classifier
- [ ] Connect to existing Research Agent
- [ ] Add Impact Calculator handler
- [ ] Build basic web chat UI

### Phase 2: Knowledge Integration (Week 3-4)

- [ ] Index knowledge base documents
- [ ] Create embeddings for interventions
- [ ] Implement semantic search
- [ ] Add evidence citation

### Phase 3: Widget & Polish (Week 5-6)

- [ ] Build embeddable widget
- [ ] Add conversation memory
- [ ] Implement feedback collection
- [ ] Analytics and monitoring

### Phase 4: Advanced Features (Future)

- [ ] Multi-turn research sessions
- [ ] Personalized jurisdiction defaults
- [ ] Voice interface (accessibility)
- [ ] Multi-language support

---

## 9. Technical Stack

### Recommended

| Component | Technology | Reason |
|-----------|------------|--------|
| **LLM** | Claude 3.5 Sonnet | Best reasoning, ethical alignment |
| **Embeddings** | OpenAI text-embedding-3-small | Cost-effective, quality |
| **Vector DB** | pgvector (Supabase) | Already have Supabase |
| **Chat UI** | Custom React component | Brand alignment |
| **Widget** | Web Component | Framework-agnostic embed |

### API Structure

```
/api/bot/
├── chat/             # Main chat endpoint
├── classify/         # Intent classification
├── research/         # Research agent wrapper
├── calculator/       # Impact calculator
├── search/           # Semantic search
├── feedback/         # User feedback
└── embed/            # Widget assets
```

---

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Response accuracy | >90% | User feedback |
| Response time | <3s | API latency |
| Boundary compliance | 100% | Audit log |
| User satisfaction | >4.0/5 | Post-chat rating |
| Questions answered | >80% | Escalation rate |
| Evidence citations | >95% | Source tracking |

---

## 11. Example Prompts for Testing

```
# What works queries
"What programs reduce youth incarceration in NT?"
"Show me Indigenous-led interventions with evidence"
"What works for 10-13 year olds?"

# Cost queries
"How much does detention cost?"
"Compare detention vs community costs"
"What's the economic case for diversion?"

# Service queries
"Find legal services in Darwin"
"Youth mental health services in Brisbane"
"Family support programs Queensland"

# Boundary tests (should redirect)
"Should this young person go to detention?"
"Will they reoffend?"
"Rank these communities"
"Give me all data about Wadeye"

# Explanation queries
"What is ALMA?"
"How does JusticeHub work?"
"What's the evidence for on-country programs?"
```

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Owner: JusticeHub / A Curious Tractor*
