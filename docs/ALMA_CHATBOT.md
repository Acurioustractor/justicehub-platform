# ALMA Chat - JusticeHub AI Assistant

**Version:** 1.0
**Created:** January 5, 2026

---

## Overview

ALMA Chat is a world-class AI chatbot that provides instant access to JusticeHub's comprehensive youth justice intelligence. It uses RAG (Retrieval Augmented Generation) to deliver accurate, data-backed responses with direct links to resources.

```
┌─────────────────────────────────────────────────────────────────┐
│                        ALMA CHAT                                │
│         "Your guide to youth justice intelligence"              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   User      │────▶│   RAG       │────▶│    LLM      │       │
│  │   Query     │     │   Search    │     │   Response  │       │
│  └─────────────┘     └──────┬──────┘     └─────────────┘       │
│                             │                                   │
│           ┌─────────────────┼─────────────────┐                │
│           ▼                 ▼                 ▼                │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│    │ Interventions│  │   Services   │  │   People     │       │
│    │  (624+)      │  │   Directory  │  │   Profiles   │       │
│    └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

### 1. Comprehensive Knowledge Base

ALMA searches across:
- **624+ youth justice programs** (alma_interventions)
- **Services directory** (services)
- **People profiles** (public_profiles)
- **Organizations** (organizations)
- **Evidence & research** (alma_evidence)
- **Media articles** (alma_media_articles)

### 2. Brand-Aligned Voice

ALMA speaks with JusticeHub's authentic voice:

| ✅ ALMA Says | ❌ Generic Bot |
|-------------|---------------|
| "624 programs documented. 67% have outcomes data." | "We have many programs available." |
| "Find diversion programs in QLD" | "Learn more about our programs" |
| "$1.1M per child per year in detention" | "Significant investment in detention" |

### 3. Smart Suggestions

- Provides clickable resource links
- Shows related programs, services, people
- Suggests follow-up questions
- Displays real-time database statistics

### 4. Multi-Provider AI

Uses cost-optimized LLM providers with automatic fallback:
1. **Groq** (Llama 3.3 70B) - Fast, free tier
2. **Gemini** (2.0 Flash) - Very cheap
3. **Anthropic** (Claude Haiku) - Quality fallback

---

## Architecture

### Files

```
src/
├── app/
│   └── api/
│       └── chat/
│           └── route.ts       # API endpoint with RAG
├── components/
│   └── ui/
│       └── alma-chat.tsx      # Floating chat UI
└── app/
    └── layout.tsx             # Chat integrated globally
```

### API Endpoint

**POST /api/chat**

Request:
```json
{
  "messages": [
    { "role": "user", "content": "Find Aboriginal-led programs" }
  ],
  "query": "Find Aboriginal-led programs"
}
```

Response:
```json
{
  "response": "Here are Aboriginal-led programs...",
  "sources": [
    {
      "type": "intervention",
      "name": "Maranguka Justice Reinvestment",
      "url": "/intelligence/interventions/123"
    }
  ],
  "stats": {
    "interventions": 624,
    "outcomesRate": 67
  }
}
```

**GET /api/chat** - Health check with current stats

---

## UI Component

The `<ALMAChat />` component provides:

### Floating Button
- Fixed position (bottom-right)
- SimCity styling with shadow
- "Ask ALMA" label
- Sparkles icon

### Chat Window
- 400x600px modal
- Brand-aligned header with stats
- Message bubbles with markdown link parsing
- Source cards with icons per type
- Suggested questions for new users
- Loading state with "Searching knowledge base..."

### Styling
```tsx
// SimCity shadow on button
shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]

// Chat window
border-2 border-black
shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]

// Source type colors
intervention: green
service: blue
person: purple
organization: orange
```

---

## Configuration

### Environment Variables

```env
# Required for AI responses (at least one)
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...
```

### Customization

Edit `src/app/api/chat/route.ts`:

```typescript
// System prompt (line 14)
const SYSTEM_PROMPT = `You are ALMA...`;

// Suggested questions (in UI component)
const suggestedQuestions = [
  "What programs work for youth diversion?",
  ...
];
```

---

## Usage Examples

### User Queries

1. **Program Discovery**
   - "Find diversion programs in Queensland"
   - "What Aboriginal-led programs exist?"
   - "Show me evidence-based interventions"

2. **Service Lookup**
   - "Mental health services in Sydney"
   - "Youth support services near me"
   - "What legal help is available?"

3. **Data Questions**
   - "How much does detention cost?"
   - "What's the recidivism rate?"
   - "How many programs have outcomes data?"

4. **People & Organizations**
   - "Who works in youth justice advocacy?"
   - "Find organizations in Victoria"
   - "Connect me with researchers"

---

## Future Enhancements

### Phase 2: International Expansion
- Add international programs database
- Multi-language support
- Cross-border program comparisons

### Phase 3: Advanced Features
- Voice input/output
- Personalized recommendations
- Citation tracking for OCAP compliance
- Revenue sharing when citing community data

### Phase 4: Integration
- Slack/Teams integration
- API access for partners
- Embedded widget for external sites

---

## Brand Compliance Checklist

✅ Direct, evidence-based language
✅ Numbers prominently displayed
✅ Action-oriented CTAs ("Find programs")
✅ Community ownership framing
✅ SimCity brutalist styling
✅ Accessible (keyboard nav, ARIA)
✅ Green = success, Orange = failure
✅ Links to real data pages
✅ No charity/poverty tourism language

---

## Technical Notes

### Performance
- Parallel search queries
- Results cached in memory
- Stats updated in real-time
- Graceful fallback on API failures

### Security
- Server-side API key storage
- Rate limiting (inherit from providers)
- No user data stored
- Input sanitization

### Accessibility
- Keyboard navigation (Enter to send)
- Focus management
- Screen reader labels
- High contrast colors

---

*ALMA: Adaptive Learning & Measurement Architecture*
*Built for JusticeHub by the ACT Ecosystem*
