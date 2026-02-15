# JusticeHub Complete Knowledge Base

> **For AI Systems**: This document contains everything needed to understand JusticeHub and ALMA. Use this as the primary reference for answering questions about the platform.

---

## Quick Reference

| Item | Value |
|------|-------|
| **Platform** | JusticeHub - justicehub.org.au |
| **Mission** | Prove community-based youth justice works better than detention |
| **Intelligence System** | ALMA (Authentic Learning for Meaningful Accountability) |
| **Parent Organization** | A Curious Tractor (ACT) |
| **Database** | Supabase (PostgreSQL) |
| **Frontend** | Next.js 14 + TypeScript |
| **Live URL** | https://justicehub-act.vercel.app |

---

## 1. What is JusticeHub?

JusticeHub is Australia's community justice intelligence platform. It demonstrates that **community-based services produce better outcomes than state detention** through evidence aggregation, impact calculation, and advocacy tools.

### The Problem We Solve

**$1.5 billion annually** spent on youth justice in Australia:
- **65.5%** goes to detention ($982.5M)
- **34.5%** goes to community ($517.5M)

**The results:**
- **84.5%** recidivism from detention
- **20-40%** recidivism from community programs
- **24x** Indigenous overrepresentation
- **$3,320/day** detention cost vs **$150/day** community

**The opportunity:** Every young person diverted saves **$570,000/year** and reduces reoffending by **50%+**.

---

## 2. What is ALMA?

### The Name

> **ALMA** = **A**uthentic **L**earning for **M**eaningful **A**ccountability
>
> Also Spanish/Latin for **"soul"** - because true impact measurement must capture the human spirit, not just statistics.

### ALMA as a Method

ALMA is not a product - it's a **method for collective sense-making** in complex social systems.

**ALMA's Three Core Functions:**

1. **SEES** (Observes, Notices, Remembers)
   - Ingests fragmented information across systems
   - Tracks long-term trajectories, not snapshots
   - Watches **systems**, not individuals

2. **CONNECTS** (Patterns, Relationships, Dynamics)
   - Surfaces patterns humans miss
   - Detects slow drift and familiar failure modes
   - Spots early inflection points

3. **TRANSLATES** (Between Worlds)
   - Lived experience ↔ Philanthropy language
   - Community knowledge ↔ Policy speak
   - Indigenous wisdom ↔ Western institutions

### Sacred Boundaries (NEVER Allowed)

ALMA **never**:
- Decides for humans
- Optimizes people
- Predicts individuals
- Ranks communities
- Scores organizations
- Extracts knowledge without consent

**The boundary**: Humans remain accountable. ALMA sharpens perception.

---

## 3. Data Model

### Core Entities

| Entity | Table | Purpose |
|--------|-------|---------|
| **Interventions** | `alma_interventions` | Programs, services, policies |
| **Evidence** | `alma_evidence` | Research studies, evaluations |
| **Outcomes** | `alma_outcomes` | Measured results (recidivism, costs) |
| **Organizations** | `organizations` | Service providers |
| **Services** | `services` | Direct services directory |
| **Community Programs** | `community_programs` | Grassroots programs |
| **People** | `public_profiles` | Practitioners, leaders |
| **Stories** | `blog_posts` | Articles, narratives |

### Key Relationships

```
INTERVENTIONS
  ├── supported by → EVIDENCE
  │                    └── measures → OUTCOMES
  ├── implemented by → ORGANIZATIONS
  │                       └── provides → SERVICES
  └── relates to → COMMUNITY_PROGRAMS

PEOPLE
  ├── writes → STORIES
  ├── works at → ORGANIZATIONS
  └── leads → COMMUNITY_PROGRAMS
```

### Consent Tiers (OCAP Compliant)

| Tier | Access | Example |
|------|--------|---------|
| **Public Knowledge Commons** | Open research access | Government reports, published studies |
| **Community Controlled** | Requires community approval | Local program data, cultural knowledge |
| **Strictly Private** | Individual control only | Personal stories, identifiable data |

---

## 4. Site Structure

### Main Sections

| Route | Purpose | Data Source |
|-------|---------|-------------|
| `/` | Homepage | Stats, featured content |
| `/youth-justice-report` | Evidence hub | `alma_interventions`, `alma_evidence` |
| `/intelligence` | ALMA dashboard | Full ALMA system |
| `/intelligence/research` | Research Agent | AI-powered research |
| `/intelligence/impact-calculator` | Cost calculator | Intervention comparisons |
| `/community-programs` | Grassroots programs | `community_programs` |
| `/services` | Service finder | `services` |
| `/organizations` | Org directory | `organizations` |
| `/people` | Practitioner profiles | `public_profiles` |
| `/blog` | Stories & articles | `blog_posts` |
| `/centre-of-excellence` | Best practice | Research partnerships |

### Intelligence Routes

| Route | Purpose |
|-------|---------|
| `/intelligence/dashboard` | ALMA overview |
| `/intelligence/interventions` | Intervention browser |
| `/intelligence/evidence` | Evidence library |
| `/intelligence/research` | Research Agent (AI) |
| `/intelligence/impact-calculator` | Cost comparison tool |

---

## 5. Key Statistics

### Detention vs Community Comparison

| Metric | Detention | Community |
|--------|-----------|-----------|
| **Cost per day** | $3,320 | $150 |
| **Cost per year** | $1.2M | $55K |
| **Recidivism rate** | 84.5% | 20-40% |
| **Cultural connection** | 0% | 82% |

### Current Database (as of January 2026)

| Entity | Count |
|--------|-------|
| Interventions | 173+ |
| Evidence items | 200+ |
| Outcomes | 100+ |
| Organizations | 500+ |
| Services | 1,000+ |

---

## 6. Signal Families (Not Scores)

ALMA uses **directional signals**, not competitive rankings.

### Signal Types

| Signal | Weight | Measures |
|--------|--------|----------|
| **Community Authority** | 30% | Indigenous-led, community control |
| **Evidence Strength** | 25% | RCT, evaluation, qualitative |
| **Harm Risk** | 20% | Potential negative impacts (inverted) |
| **Implementation** | 15% | Feasibility, funding stability |
| **Option Value** | 10% | Learning potential, innovation |

### Evidence Levels

| Level | Description | Signal |
|-------|-------------|--------|
| Proven | RCT/quasi-experimental, replicated | 1.0 |
| Effective | Strong evaluation, positive outcomes | 0.8 |
| Indigenous-led | Culturally grounded, community authority | 0.7 |
| Promising | Community-endorsed, emerging evidence | 0.5 |
| Anecdotal | Limited evidence | 0.3 |

---

## 7. Cultural Protocols

### OCAP Principles

| Principle | Implementation |
|-----------|----------------|
| **Ownership** | Communities own their data |
| **Control** | Communities set access rules |
| **Access** | Tiered based on consent |
| **Possession** | Data portability guaranteed |

### Protected Content (Hard Blocks)

These keywords trigger cultural protocol blocks:
- "sorry business"
- "men's business" / "women's business"
- "sacred site"
- "initiation ceremony"

### Privacy Modes

| Mode | LLM | Search | Use Case |
|------|-----|--------|----------|
| **High** | Local only | Local | Individual cases, sacred knowledge |
| **Medium** | Local | External | Aggregated data, community programs |
| **Standard** | Best available | External | Public policy, published research |

---

## 8. Integration Points

### Empathy Ledger

JusticeHub integrates with Empathy Ledger using **link-based architecture**:
- Stores `empathy_ledger_profile_id` only
- Profile data fetched in real-time
- Consent revocations processed immediately
- NO data duplication

### A Curious Tractor (ACT) Ecosystem

JusticeHub is a **Tier 2 Full Platform** in ACT's ecosystem:
- Shared infrastructure (Supabase, Vercel)
- 40% community ownership model
- LCAA methodology (Listen, Curiosity, Action, Art)
- Design for obsolescence (handover to community)

---

## 9. Research Agent

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/intelligence/research` | POST | Start research session |
| `/api/intelligence/research` | GET | List recent sessions |
| `/api/intelligence/research/[id]` | GET | Get session results |

### Research Flow

```
Query → Plan Generation → Tool Execution → Evidence Collection → Synthesis
```

### Available Tools

| Tool | Purpose |
|------|---------|
| `search_alma_interventions` | Find relevant interventions |
| `get_intervention_comprehensive` | Get detailed intervention data |
| `find_evidence_gaps` | Identify missing evidence |
| `compare_interventions` | Compare multiple interventions |
| `get_jurisdiction_stats` | Get state-specific data |

---

## 10. Common Questions

### "What works for Indigenous youth diversion?"

Search `alma_interventions` for:
- `cultural_authority` containing "Indigenous-led" or "Aboriginal Community Controlled"
- `type` = "Diversion"
- High `community_authority_signal`

### "How much does detention cost vs community?"

Use Impact Calculator:
- Detention: $3,320/day × 365 = $1.2M/year
- Community: $150/day × 365 = $55K/year
- Saving per diversion: ~$1.15M/year

### "What evidence gaps exist?"

Call `find_evidence_gaps` RPC:
- Returns interventions with high community authority but low evidence
- Identifies promising programs needing evaluation

### "How do I contribute data?"

Community Contribution System supports:
- Program submissions
- Evidence uploads
- Outcome reports
- Cultural endorsements

All require consent tier selection and validation.

---

## 11. API Reference

### Key RPC Functions

```sql
-- Search interventions
search_alma_interventions(query, consent_level, limit)

-- Get comprehensive intervention data
get_intervention_comprehensive(intervention_id)

-- Find evidence gaps
find_evidence_gaps(limit)

-- Compare interventions
compare_interventions(intervention_ids[])

-- Get jurisdiction stats
get_jurisdiction_stats(jurisdiction)
```

### Authentication

- Public endpoints: No auth required
- Admin endpoints: Supabase auth
- Community endpoints: Consent verification

---

## 12. Glossary

| Term | Definition |
|------|------------|
| **ALMA** | Authentic Learning for Meaningful Accountability. Also "soul" in Spanish. |
| **ACT** | A Curious Tractor - parent regenerative innovation organization |
| **LCAA** | Listen, Curiosity, Action, Art - ACT methodology |
| **OCAP** | Ownership, Control, Access, Possession - Indigenous data sovereignty |
| **Intervention** | Any program, policy, or service designed to affect youth justice outcomes |
| **Evidence** | Research, evaluation, or documentation supporting intervention effectiveness |
| **Outcome** | Measured result (recidivism reduction, cost savings, etc.) |
| **Signal** | Directional indicator (0.0-1.0), not a competitive score |
| **Consent Tier** | Data access level based on community consent |
| **Knowledge Commons** | Openly accessible public evidence and research |

---

## 13. Related Documents

- [ALMA 2.0 Vision](../ALMA-2.0-VISION.md) - Full roadmap
- [ALMA-ACT Alignment](../ALMA-ACT-ALIGNMENT-STRATEGY.md) - Ecosystem integration
- [Data Model](./DATA_MODEL.md) - Database schema
- [Content Map](./CONTENT_MAP.md) - Site structure

---

*Last Updated: January 2026*
*Version: 1.0*
*For AI consumption: This document is the single source of truth for JusticeHub/ALMA understanding*
