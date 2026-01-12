# ALMA Quick Reference

**For practitioners, developers, and stewards**

---

## What is ALMA?

**ALMA is a method for collective sense-making in complex social systems.**

**ALMA = Memory + Pattern Recognition + Translation**

**Not**: An organization, product, platform, or consultancy.

**Is**: A way of seeing, learning, and deciding under uncertainty while respecting community sovereignty.

---

## Core Documents (Read These First)

1. **[ALMA_METHOD_CHARTER.md](./ALMA_METHOD_CHARTER.md)** - Definitive charter (what ALMA is)
2. **[ALMA_ARCHITECTURE_ALIGNED.md](./ALMA_ARCHITECTURE_ALIGNED.md)** - How technical system serves the method
3. **[ALMA_ROADMAP.md](./ALMA_ROADMAP.md)** - Implementation path ahead

---

## Quick Commands

### Test Database Connection
```bash
export PGPASSWORD='vixwek-Hafsaz-0ganxa'
psql -h aws-0-ap-southeast-2.pooler.supabase.com \
     -p 6543 \
     -U postgres.tednluwflfhxyucgwigh \
     -d postgres
```

### Test Services
```bash
cd /Users/benknight/Code/JusticeHub
node scripts/test-alma-services.mjs
```

### Test Ingestion Pipeline
```bash
# Test Firecrawl
node scripts/test-firecrawl.mjs

# Test full pipeline (Firecrawl → Claude → Database)
node scripts/test-full-ingestion.mjs
```

### Ingest Data
```bash
# Ingest all curated sources (government + states)
node scripts/ingest-all-sources.mjs
```

### Check Current Data
```sql
-- Count entities
SELECT
  'Interventions' as type, COUNT(*) FROM alma_interventions
UNION ALL
SELECT 'Evidence', COUNT(*) FROM alma_evidence
UNION ALL
SELECT 'Outcomes', COUNT(*) FROM alma_outcomes
UNION ALL
SELECT 'Contexts', COUNT(*) FROM alma_community_contexts;

-- View recent interventions
SELECT
  name,
  type,
  consent_level,
  review_status,
  created_at::date
FROM alma_interventions
ORDER BY created_at DESC
LIMIT 10;
```

---

## Architecture Overview

```
JusticeHub (Steward)
    ↓
Hosts ALMA as commons
    ↓
┌───────────────┬───────────────────────────────────┐
│               │                                   │
Witta Harvest   State Nodes (VIC, NSW, QLD)
(First Node)
│               │
Indigenous      Local wisdom
framing         Ground truth
Ethics          Patterns ↑
Training        Insights ↓
│               │
└───────────────┴───────────────────────────────────┘
                ↓
        Technical Tools (Support method)
        • Database (PostgreSQL + RLS)
        • AI extraction (Claude)
        • Signal tracking (5-signal portfolio)
        • Translation (web → structured)
        • Memory (consent ledger)
```

---

## Signal Families (Not KPIs)

### 1. Evidence Strength Signal
**What it measures**: Quality and rigor of research backing this intervention
**Range**: 0.0 (no evidence) → 1.0 (gold-standard RCTs)

### 2. Community Authority Signal ⭐ (Highest Weight: 30%)
**What it measures**: Degree of community control and cultural authority
**Range**: 0.0 (extractive) → 1.0 (community-led)

### 3. Harm Risk Signal
**What it measures**: Potential for unintended harm or adverse outcomes
**Range**: 0.0 (safe) → 1.0 (high risk)

### 4. Implementation Capability Signal
**What it measures**: Organizational capacity and sustainability
**Range**: 0.0 (burning out) → 1.0 (thriving)

### 5. Option Value Signal
**What it measures**: Learning potential and adaptability
**Range**: 0.0 (rigid) → 1.0 (highly adaptive)

**Portfolio Score** = Weighted average:
```
(evidence_strength × 0.25) +
(community_authority × 0.30) +  ← HIGHEST
((1 - harm_risk) × 0.20) +
(implementation_capability × 0.15) +
(option_value × 0.10)
```

---

## Consent Levels (3-Tier Model)

### 1. Public Knowledge Commons
**Definition**: Public government documents, published research
**Who can access**: Anyone
**Example**: AIHW reports, state government program pages

### 2. Community Controlled
**Definition**: Knowledge shared with explicit permission for specific uses
**Who can access**: Only those with community-granted permission
**Example**: Workshop outputs, community-shared patterns

### 3. Strictly Private
**Definition**: Knowledge held in trust, never shared
**Who can access**: Only the community who contributed it
**Example**: Individual stories, sensitive cultural knowledge

---

## Review Status Workflow

```
Draft
  ↓
  Submit for Review
  ↓
Under Review
  ↓
  Approve (or Reject back to Draft)
  ↓
Approved
  ↓
  Publish
  ↓
Published
```

**Rules**:
- Only **Published** interventions appear in public queries
- **Community Controlled** interventions require permission even if Published
- **Strictly Private** never flow to public, regardless of status

---

## Sacred Boundaries (What ALMA Never Does)

❌ Decides for humans
❌ Optimizes people
❌ Allocates capital directly
❌ Predicts individuals
❌ Replaces lived experience
❌ Ranks communities
❌ Scores organizations
❌ Extracts knowledge without consent
❌ Centralizes authority

**Default stance**: "Here is what we are seeing. Humans must decide."

---

## Key Files & Locations

### Database Migrations
```
/Users/benknight/Code/JusticeHub/supabase/migrations/
├── 20250131000001_alma_core_entities.sql (10 tables)
├── 20250131000002_alma_rls_policies.sql (30+ policies)
├── 20250131000003_alma_hybrid_linking.sql (links to existing data)
├── 20250131000004_fix_portfolio_signals_function.sql (bug fix)
└── 20250131000005_alma_ingestion_jobs.sql (tracking)
```

### Services
```
/Users/benknight/Code/JusticeHub/src/lib/alma/
├── intervention-service.ts (450 lines) - CRUD + governance
├── consent-service.ts (440 lines) - Permission middleware
├── portfolio-service.ts (450 lines) - Intelligence analytics
├── extraction-service.ts (620 lines) - AI extraction
└── ingestion-service.ts (620 lines) - Web scraping orchestration
```

### Scripts
```
/Users/benknight/Code/JusticeHub/scripts/
├── test-alma-services.mjs (11/11 tests)
├── test-firecrawl.mjs (Firecrawl validation)
├── test-full-ingestion.mjs (pipeline test)
└── ingest-all-sources.mjs (batch ingestion)
```

### Documentation
```
/Users/benknight/Code/JusticeHub/
├── ALMA_METHOD_CHARTER.md (definitive charter)
├── ALMA_ARCHITECTURE_ALIGNED.md (technical alignment)
├── ALMA_ROADMAP.md (implementation path)
├── ALMA_STATUS.md (current state)
├── ALMA_WEEK_3_COMPLETE.md (Week 3 summary)
└── ALMA_QUICK_REFERENCE.md (this file)
```

---

## Current State (2025-12-31)

**Database**: 10 tables deployed, 30+ RLS policies active
**Services**: 5 TypeScript services, 2,580 lines, 100% tested
**Intelligence**: 15 interventions, 4 patterns detected
**Cost**: $0.23 total (Week 3 ingestion)
**Status**: Week 3 Complete ✅

---

## What's Working

✅ **Ethical observation** (public sources only)
✅ **Pattern recognition** (4 signals emerging)
✅ **Translation** (web → structured knowledge)
✅ **Community sovereignty** (consent enforced at database level)
✅ **No individual profiling** (systems watched, not people)
✅ **Transparency** (all sources attributed)
✅ **Distributed cognition** (nodes can operate autonomously)

---

## Patterns Detected (So Far)

### 1. Victorian Leadership
Victoria has 87% of documented programs (13 of 15).
**Signal**: System transparency, program diversity.

### 2. Diversion Emphasis
Multiple diversion programs (Group Conferencing, Youth Diversion, Children's Court).
**Signal**: System moving away from detention, toward prevention.

### 3. Indigenous Program Visibility
Koori Youth Justice Programs appear as distinct intervention.
**Signal**: Cultural authority recognized, not just policy rhetoric.

### 4. Documentation Gaps
NSW and QLD have minimal public program detail.
**Signal**: Either opacity under stress, or genuine capability gaps.

---

## Next Steps

**Week 4**: Admin UI (intervention management interface)
**Week 5**: Search & Discovery (semantic search, pattern surfacing)
**Week 6**: Witta Harvest Pilot (method practice, Indigenous-led)
**Week 8**: First State Node (Victoria - distributed cognition)
**Week 12**: Funder Decision Aids (portfolio dashboards)

---

## Key People & Roles

**JusticeHub**: Steward of ALMA (hosts commons, connects nodes)
**Witta Harvest**: First anchor node (sets culture, ethics, legitimacy)
**State Nodes (VIC/NSW/QLD)**: Distributed intelligence holders
**A Curious Tractor (ACT)**: Initial builder, protector, trainer (not owner)

**Future**: Transfer stewardship to community-governed trust (Year 2).

---

## Success Metrics

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

## The Durability Test

**Question**: If ACT disappeared tomorrow, could ALMA still be practiced?

**Current answer**: Not yet (tools still coupled to JusticeHub).

**Target answer**: Yes (method is transferable, tools are commons).

**Path to yes**:
1. ✅ Document the method thoroughly
2. 📝 Train practitioners at nodes (Week 6+)
3. 📝 Open-source the tools (Week 16)
4. 📝 Transfer stewardship to trust (Year 2)
5. 📝 Prove it works without ACT (Year 3)

---

## Contact & Governance

**Steward**: JusticeHub (hosted by A Curious Tractor)
**First Node**: Witta Harvest, Victoria
**Ethics Review**: Community-governed board (to be established)

**Questions**: Contact JusticeHub at justicehub.org

---

## The Quiet Truth

What ALMA requires:
- Patience
- Humility
- Discipline
- Ethical restraint
- Systems thinking
- Long memory

Most institutions cannot hold this.

**JusticeHub can—because we are not trying to own the system.**

**We are trying to keep it honest and alive.**

---

**ALMA is a method. The tools serve the method. The method serves justice. Justice serves communities.**

---

*This reference guide is a living document. Update as ALMA evolves.*

**Version**: 1.0 (2025-12-31)
