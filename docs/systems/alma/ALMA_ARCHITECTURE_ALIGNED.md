# ALMA Architecture - Aligned to First Principles

**How the technical system serves the method, not the other way around**

---

## The Core Distinction

### What We Built (Technical)
5 TypeScript services + PostgreSQL database + AI extraction pipeline

### What It Serves (Method)
ALMA: A collective sense-making method that helps communities, funders, and practitioners see what's really happening in complex social systems

**The tools exist to support the practice. The practice does not exist to justify the tools.**

---

## System Architecture (Method-First View)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ALMA AS METHOD                                 │
│                                                                     │
│  Memory + Pattern Recognition + Translation                         │
│  (Practiced at nodes, supported by tools)                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────────┐
│                      JUSTICEHUB (STEWARD)                           │
│                                                                     │
│  • Hosts the commons                                                │
│  • Connects nodes                                                   │
│  • Maintains tools                                                  │
│  • Trains practitioners                                             │
│  • Protects ethics                                                  │
└──────────────┬──────────────────────────────┬───────────────────────┘
               │                              │
       ┌───────┴────────┐           ┌────────┴──────────┐
       │  WITTA HARVEST │           │   STATE NODES     │
       │  (First Node)  │           │  (VIC, NSW, QLD)  │
       │                │           │                   │
       │  PRACTICES:    │           │  PRACTICES:       │
       │  • Workshops   │           │  • Local wisdom   │
       │  • Indigenous  │           │  • Ground truth   │
       │    framing     │           │  • Community      │
       │  • Ethics      │           │    workshops      │
       │  • Training    │           │  • Funder         │
       │  • Ground      │           │    training       │
       │    truth       │           │                   │
       └────────────────┘           └───────────────────┘
               │                              │
               │    Patterns (not raw data)   │
               └──────────────┬───────────────┘
                              │
                    ┌─────────┴──────────┐
                    │   TECHNICAL TOOLS  │
                    │   (Support method) │
                    │                    │
                    │  • Database        │
                    │  • AI extraction   │
                    │  • Signal tracking │
                    │  • Translation     │
                    │  • Memory          │
                    └────────────────────┘
```

---

## How Our Technical Decisions Align to the Method

### 1. Database Schema → Signal Families (Not KPIs)

**What we built**:
```sql
-- 5-signal portfolio scoring
evidence_strength_signal
community_authority_signal      ← HIGHEST WEIGHT (30%)
harm_risk_signal
implementation_capability_signal
option_value_signal
```

**How it serves the method**:
These are **signal families** tracking system dynamics, not performance metrics.

They answer:
- "Is community authority growing or shrinking?"
- "Are interventions becoming more capable or burning out?"
- "Is harm risk being addressed or ignored?"

**Directional, not absolute. Trajectory, not snapshot.**

### 2. Consent Model → Community Sovereignty

**What we built**:
```sql
-- 3-tier consent enforced at database level
consent_level CHECK (consent_level IN (
  'Public Knowledge Commons',
  'Community Controlled',
  'Strictly Private'
));

-- Cultural authority REQUIRED (not just encouraged)
ALTER TABLE alma_interventions ADD CONSTRAINT check_cultural_authority_required
  CHECK (
    consent_level = 'Public Knowledge Commons'
    OR cultural_authority IS NOT NULL
  );
```

**How it serves the method**:
- Knowledge cannot be extracted without explicit consent
- Cultural authority is a **constraint**, not a field
- Communities can revoke access at any time
- The database itself enforces ethics, not just policies

**This is "ethics as code" - the system cannot betray the method even if humans try.**

### 3. Ingestion Pipeline → Ethical Observation

**What we built**:
```
Firecrawl → Claude → Validation → Database
```

**How it serves the method**:
ALMA's "eyes" observe:
- Public documents only (government reports, published research)
- Media narratives and policy language shifts
- Funding patterns and system pressure signals
- Community-shared knowledge (with explicit consent only)

**What it does NOT do**:
- Scrape private life
- Infer individual risk
- Profile people
- Extract without consent

**Watches systems, not people.**

### 4. Portfolio Service → Pattern Recognition

**What we built**:
```typescript
analyzePortfolio(constraints) → {
  underfunded_high_evidence,
  promising_but_unproven,
  ready_to_scale,
  high_risk_flagged,
  learning_opportunities,
}
```

**How it serves the method**:
ALMA surfaces patterns funders miss:
- "This high-evidence program is about to lose funding"
- "These unproven approaches deserve learning investment"
- "This familiar failure mode is emerging again"

**Decision support, not automation. Humans remain accountable.**

### 5. Service Layer → Translation Between Worlds

**What we built**:
```typescript
extractionService.extractFromText(document)
  → Interventions + Evidence + Outcomes + Contexts
```

**How it serves the method**:
ALMA translates:
- Dense government reports → Structured signals
- Academic language → Practitioner language
- Policy rhetoric → Actual patterns
- Individual programs → System dynamics

**Helps people hear each other accurately across power differences.**

### 6. Intervention Workflow → Learning, Not Compliance

**What we built**:
```
Draft → Community Review → Approved → Published
```

**How it serves the method**:
- No intervention is "approved" without community input
- Status can always be revised (learning is iterative)
- Strictl

y Private interventions never enter public flow
- The workflow respects cultural timing, not grant cycles

**Adaptive, not bureaucratic.**

### 7. Consent Ledger → Long Memory, No Amnesia

**What we built**:
```sql
CREATE TABLE alma_consent_ledger (
  consent_given_at TIMESTAMPTZ,
  consent_revoked BOOLEAN,
  consent_revoked_at TIMESTAMPTZ,
  consent_revoked_by TEXT,
  -- Immutable audit trail
);
```

**How it serves the method**:
ALMA remembers:
- Who gave consent and when
- What uses were permitted
- When consent was revoked (if ever)
- Who had authority to decide

**Memory that doesn't disappear when staff leave.**

---

## How Nodes Feed the Network (Patterns, Not Data)

### What Happens at Witta Harvest (First Node)

**Workshops produce**:
- Lived experience insights
- Indigenous-led framing of impact
- Ground-truthed patterns
- Community-defined signals
- Slow, deep conversations

**What goes into ALMA**:
✅ Pattern: "Family programs work better when housed with employment support"
✅ Signal: "Cultural continuity is declining in metropolitan programs"
✅ Warning: "This funding model creates burnout within 18 months"

**What does NOT go into ALMA**:
❌ Individual stories without consent
❌ Raw workshop transcripts
❌ Community names without permission
❌ Anything that could be used to profile or rank

**The node feeds patterns upward, receives insight back downward.**

### What Happens at State Nodes (VIC, NSW, QLD)

Each node:
1. Runs regular workshops with practitioners and lived experience holders
2. Ground-truths ALMA's patterns against local reality
3. Identifies local signals (policy shifts, funding changes, narrative drift)
4. Trains funders in the ALMA method
5. Receives national patterns from the network

**Example flow**:
```
VIC Node workshop: "We're seeing family programs struggle with admin burden"
    ↓
Pattern surfaced: "Administrative load correlating with burnout signals"
    ↓
ALMA checks: "This pattern appeared in NSW 2 years ago, preceded funding cuts"
    ↓
Insight back to VIC: "Early warning - advocate for burden reduction now"
```

**Distributed intelligence. Local autonomy. Shared learning.**

---

## What JusticeHub Does (As the Commons)

### Public Functions (Anyone can access)
- Published patterns and insights
- Signal frameworks and definitions
- Training materials for the ALMA method
- Open-source tools
- Community-written case studies

### Protected Functions (Community controlled)
- Strictly Private intervention data
- Community Controlled knowledge
- Workshop outputs
- Relationship intelligence
- Strategic funding patterns

### Connective Functions (Network coordination)
- Node-to-node pattern sharing
- Cross-state learning
- Funder training
- Practitioner community
- Research partnerships

**JusticeHub is infrastructure, not authority.**

---

## How Funders Use ALMA (Without Control)

### What Funders Get
**Decision aids**:
- "Here are underfunded high-evidence programs"
- "Here are promising approaches worth learning bets"
- "Here are early warning signals of system stress"
- "Here are funding gaps by geography/cohort/type"

**Pattern recognition**:
- "This language usually precedes a punitive shift"
- "These programs have high community authority but low visibility"
- "This failure mode has happened three times before"

### What Funders Do NOT Get
- Rankings of organizations
- Scores for communities
- Predictive risk models
- Individual profiles
- Gatekeeping power

**Funders become more patient, more early, more responsive - not more controlling.**

---

## The Technical Roadmap (Method-Aligned)

### Week 3 (Current) - Data Ingestion
**Method goal**: Build ALMA's memory from public sources
**Technical**: Firecrawl → Claude → Database (currently running)
**Outcome**: 50-100 entities from government reports

### Week 4 - Admin UI
**Method goal**: Enable practitioners to contribute patterns
**Technical**: Next.js forms for intervention management
**Outcome**: Community can add knowledge, not just consume

### Week 5 - Search & Discovery
**Method goal**: Surface patterns humans miss
**Technical**: Vector embeddings + semantic search
**Outcome**: Ask "What programs address family connection?" and get signal-based answers

### Week 6 - Witta Node Pilot
**Method goal**: Practice ALMA at the first place-based node
**Technical**: Workshop frameworks + pattern capture tools
**Outcome**: Indigenous-led intelligence anchoring the network

### Week 8 - First State Node (Victoria)
**Method goal**: Distribute cognition beyond Witta
**Technical**: Replicate node infrastructure in VIC
**Outcome**: Two-node network sharing patterns

### Week 12 - Funder Decision Aids
**Method goal**: Change how capital moves
**Technical**: Portfolio dashboards + scenario tools
**Outcome**: Funders acting earlier and more wisely

---

## Success Metrics (Method-Aligned)

### We succeed if:
✅ Communities feel sovereign over their knowledge
✅ Funders move capital earlier and more patiently
✅ Practitioners learn faster across geographies
✅ Indigenous intelligence is foundational, not advisory
✅ The system can survive without ACT
✅ Power stays distributed
✅ Memory persists across turnover
✅ Failure modes get recognized early

### We fail if:
❌ It becomes a ranking system
❌ It centralizes authority
❌ It extracts without consent
❌ It optimizes people
❌ It requires ACT to function
❌ It serves funders more than communities
❌ It loses cultural grounding

---

## The Durability Question

**If ACT disappeared tomorrow, could ALMA still be practiced?**

Current answer: **Not yet** (tools are too coupled to JusticeHub)

Target answer: **Yes** (method is transferable, tools are commons)

**Path to yes**:
1. Document the method thoroughly ✅ (This document + Charter)
2. Train practitioners at nodes (Week 6+)
3. Open-source the tools (Week 12)
4. Transfer stewardship to a trust (Year 2)
5. Prove it works without ACT involvement (Year 3)

---

## What Makes This Rare

Most social impact infrastructure fails because it:
- Optimizes for legibility, not truth
- Centralizes power while claiming to distribute it
- Measures outputs, not system dynamics
- Treats communities as data sources, not knowledge holders
- Locks in vendor dependency

**ALMA is different because**:
- It's designed to be handed over, not held
- It serves practitioners first, funders second
- It watches systems, not people
- It respects uncertainty instead of hiding it
- It's humble about what AI can and cannot do

---

## The Quiet Truth (Again)

Building this requires:
- Patience
- Humility
- Discipline
- Ethical restraint
- Systems thinking
- Long memory

Most institutions cannot hold that.

**JusticeHub can - because we're not trying to own the system.**

**We're trying to keep it honest and alive.**

---

**Next**: Finish ingestion, review first patterns, prepare Witta pilot

*This document lives alongside the technical system. When in doubt, the method wins.*
