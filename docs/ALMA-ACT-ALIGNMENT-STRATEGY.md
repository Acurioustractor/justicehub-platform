# ALMA-ACT Alignment Strategy

## Executive Summary

This document defines how ALMA (Australian Justice Intelligence) operates within the A Curious Tractor (ACT) ecosystem and JusticeHub platform. It establishes governance, development principles, and reporting frameworks that honor both ACT's regenerative methodology and JusticeHub's mission to transform youth justice through evidence.

---

## 1. Defining ALMA Across the Ecosystem

### 1.1 What ALMA Means

**Within JusticeHub:**
ALMA is the intelligence layer - a community-powered evidence platform that:
- Aggregates intervention data from government, academic, and community sources
- Calculates comparative impact (community vs detention outcomes)
- Provides research tools for advocates, policymakers, and communities
- Respects Indigenous data sovereignty through consent-tiered access

**Within ACT Ecosystem:**
ALMA represents ACT's commitment to evidence-informed regenerative practice:
- A demonstration of LCAA (Listen, Curiosity, Action, Art) methodology in justice reform
- A model for community-controlled knowledge commons
- Infrastructure that can be forked and adapted by other seeds
- A case study in design for obsolescence - building toward community ownership

### 1.2 ALMA's Position in ACT Architecture

```
A Curious Tractor (Forest Floor)
├── Shared Infrastructure (Mycorrhizal Network)
│   ├── Dev Orchestrator
│   ├── Admin Wiki
│   └── Knowledge Systems ← ALMA patterns inform this
│
├── Tier 2: Full Platforms (Trees)
│   ├── JusticeHub ← ALMA lives here
│   │   └── ALMA (Intelligence Layer)
│   │       ├── Evidence Engine
│   │       ├── Impact Calculator
│   │       ├── Research Agent
│   │       └── Knowledge Commons
│   │
│   └── [Other Seeds]
│
└── Community Ownership (40% Model)
    └── ALMA data → Community controlled
```

---

## 2. Development Principles

### 2.1 LCAA Methodology Applied to ALMA

| Phase | ALMA Implementation |
|-------|---------------------|
| **Listen** | Community intake forms, cultural validation, story collection from those with lived experience |
| **Curiosity** | Research Agent queries, evidence gap identification, comparative analysis tools |
| **Action** | Advocacy toolkit generation, policy recommendations, intervention matching |
| **Art** | Data visualization, impact narratives, community storytelling integration |

### 2.2 OCAP Principles in ALMA Data Governance

ALMA must embody Indigenous data sovereignty through OCAP:

| Principle | ALMA Implementation |
|-----------|---------------------|
| **Ownership** | Communities own their contributed data. Cultural knowledge remains with knowledge keepers. |
| **Control** | Consent tiers (Public/Community/Private) controlled by data subjects. Communities set access rules. |
| **Access** | Tiered API access. Community members get privileged access to their own data. |
| **Possession** | Data stored with appropriate custodianship. Export tools for community data portability. |

**Consent Tiers:**
```
┌─────────────────────────────────────┐
│  Strictly Private                   │ ← Individual control only
│  (Personal stories, identifiable)   │
├─────────────────────────────────────┤
│  Community Controlled               │ ← Community elder/org approval
│  (Cultural knowledge, local data)   │
├─────────────────────────────────────┤
│  Public Knowledge Commons           │ ← Open research access
│  (Aggregate statistics, published)  │
└─────────────────────────────────────┘
```

### 2.3 Design for Obsolescence

ALMA is built to be handed over, not held onto:

**Phase 1 (Current):** ACT/JusticeHub builds and operates ALMA
**Phase 2 (Years 2-3):** Community organizations trained as co-maintainers
**Phase 3 (Years 4-5):** Governance transferred to Indigenous-led consortium
**Phase 4 (Ongoing):** ACT provides technical support only when requested

**Sunset Triggers:**
- Community consortium ready to govern
- Funding sustainability achieved through community partnerships
- Technical capacity transferred through training programs
- ACT role reduces to emergency technical support

---

## 3. Technical Alignment

### 3.1 Shared Infrastructure Integration

ALMA leverages ACT shared infrastructure:

| ACT Resource | ALMA Usage |
|--------------|------------|
| Supabase (Postgres) | Primary database for interventions, evidence, outcomes |
| Vercel | Hosting and edge functions |
| Dev Orchestrator | CI/CD, deployment automation |
| Knowledge Systems | Pattern sharing with other seeds |

### 3.2 Forkability Requirements

ALMA must be forkable for other jurisdictions/contexts:

```typescript
// Core ALMA modules designed for reuse
alma-core/
├── evidence-engine/      // Intervention-evidence linking
├── impact-calculator/    // Comparative cost analysis
├── research-agent/       // Multi-agent research system
├── consent-manager/      // OCAP-compliant data access
└── knowledge-commons/    // Community contribution system
```

**Fork Targets:**
- Other Australian states (NSW, VIC, WA variations)
- International adaptations (NZ, Canada with similar Indigenous contexts)
- Domain adaptations (health, education, housing using same evidence patterns)

### 3.3 API Design for Community Control

```
/api/alma/v1/
├── /interventions      # Public: Aggregate intervention data
├── /evidence           # Tiered: Research access with consent checking
├── /impact             # Public: Calculator and comparisons
├── /community/         # Community-controlled endpoints
│   ├── /contributions  # Submit with consent level
│   ├── /my-data        # OCAP: Access own data
│   └── /export         # OCAP: Data portability
└── /research/          # Research agent sessions
```

---

## 4. Governance Model

### 4.1 ALMA Advisory Structure

```
┌─────────────────────────────────────────────┐
│         ALMA Community Advisory Council      │
│  (Indigenous elders, lived experience,       │
│   community orgs, academic partners)         │
└──────────────────┬──────────────────────────┘
                   │ Guides
                   ▼
┌─────────────────────────────────────────────┐
│         JusticeHub Technical Team            │
│  (ACT developers, UX, data stewards)         │
└──────────────────┬──────────────────────────┘
                   │ Implements
                   ▼
┌─────────────────────────────────────────────┐
│              ALMA Platform                   │
│  (Evidence Engine, Calculator, Research)     │
└─────────────────────────────────────────────┘
```

### 4.2 Decision Rights Matrix

| Decision Type | Who Decides | ACT Role |
|---------------|-------------|----------|
| What data to collect | Community Advisory | Technical advisor |
| Consent tier definitions | Community Advisory | Implementer |
| Feature priorities | Community Advisory + Users | Builder |
| Technical architecture | JusticeHub Team | Lead |
| Cultural protocols | Indigenous partners | Learner/Supporter |
| Research partnerships | Community Advisory | Facilitator |

### 4.3 40% Community Ownership Applied

Per ACT's community ownership model:
- 40% of any ALMA-derived revenue flows to community partners
- Revenue sources: Consulting, training, custom deployments
- Distribution decided by Community Advisory Council
- Transparent reporting in ACT quarterly updates

---

## 5. Reporting Framework

### 5.1 ALMA Metrics for ACT Compendium

**Impact Metrics (Quarterly):**
| Metric | Target | Measurement |
|--------|--------|-------------|
| Recidivism reduction evidence | 58% drop demonstrated | Programs tracked showing reduction |
| Community interventions catalogued | 100+ | Count in ALMA database |
| Evidence gaps identified | All critical gaps mapped | Gap analysis tool results |
| Policy recommendations generated | 20+ per quarter | Advocacy toolkit usage |
| Community contributions | 50+ per quarter | Submission count by type |

**LCAA Alignment Metrics:**
| Phase | Metric |
|-------|--------|
| Listen | Community stories collected, cultural validations received |
| Curiosity | Research sessions run, evidence gaps explored |
| Action | Advocacy toolkits downloaded, policy briefs generated |
| Art | Impact visualizations created, narratives published |

**OCAP Compliance Metrics:**
| Principle | Metric |
|-----------|--------|
| Ownership | % of data with clear community ownership |
| Control | Consent tier coverage (all data has tier) |
| Access | Community member access requests fulfilled |
| Possession | Data export requests completed |

### 5.2 Reporting Schedule

| Report | Frequency | Audience | Content |
|--------|-----------|----------|---------|
| ALMA Health Check | Weekly | JusticeHub team | Technical metrics, uptime, errors |
| Community Impact | Monthly | Advisory Council | Usage, contributions, gaps |
| ACT Compendium Update | Quarterly | ACT ecosystem | Full metrics, LCAA alignment |
| Annual Review | Yearly | Public | Impact narrative, financials, roadmap |

### 5.3 Integration with ACT Compendium Template

Per `ACT_Compendium_2026_ALMA_Reporting_Template.md`, ALMA reports include:

```markdown
## ALMA Quarterly Report - [Quarter] [Year]

### Executive Summary
[2-3 sentence impact highlight]

### LCAA Alignment
- Listen: [Community engagement metrics]
- Curiosity: [Research/exploration metrics]
- Action: [Advocacy/policy metrics]
- Art: [Storytelling/visualization metrics]

### OCAP Compliance
- Ownership: [Status]
- Control: [Status]
- Access: [Status]
- Possession: [Status]

### Key Metrics
[Table from 5.1]

### Community Advisory Notes
[Summary of council guidance]

### Next Quarter Priorities
[Roadmap items]
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Current - Q1 2026)
- [x] ALMA 2.0 database schema
- [x] Research Agent infrastructure
- [x] Impact Calculator
- [x] Evidence linking system
- [ ] Community Advisory Council formation
- [ ] OCAP compliance audit

### Phase 2: Community Integration (Q2-Q3 2026)
- [ ] Community contribution system live
- [ ] Cultural validation workflows
- [ ] Data export/portability tools
- [ ] Training materials for community partners
- [ ] First quarterly ACT Compendium report

### Phase 3: Expansion (Q4 2026 - 2027)
- [ ] Fork framework documented
- [ ] First jurisdiction adaptation (NSW or VIC)
- [ ] Academic partnership API
- [ ] Government data integration pilots

### Phase 4: Handover Preparation (2027-2028)
- [ ] Community consortium governance model
- [ ] Technical training program for community maintainers
- [ ] Sustainability funding model
- [ ] ACT role reduction plan

---

## 7. Risk Mitigation

### 7.1 Data Sovereignty Risks

| Risk | Mitigation |
|------|------------|
| Government data requests | Clear consent tiers, legal review, community notification |
| Academic extraction | Partnership agreements require community benefit |
| Commercial misuse | License restrictions, API monitoring |
| Cultural appropriation | Elder review process, cultural validation requirements |

### 7.2 Technical Risks

| Risk | Mitigation |
|------|------------|
| Single point of failure | ACT shared infrastructure, documented recovery |
| Knowledge loss | Comprehensive documentation, training programs |
| Fork divergence | Core module versioning, compatibility testing |

### 7.3 Governance Risks

| Risk | Mitigation |
|------|------------|
| Advisory fatigue | Compensated participation, async options |
| Mission drift | Charter document, annual review |
| ACT dependency | Explicit handover timeline, capability building |

---

## 8. Success Criteria

ALMA-ACT alignment is successful when:

1. **Community Ownership:** Advisory Council makes substantive decisions, not just rubber-stamps
2. **OCAP Compliance:** All data has clear consent tiers, export works, communities control access
3. **LCAA Integration:** Each ALMA feature maps to LCAA methodology
4. **Forkability:** At least one successful fork/adaptation exists
5. **Handover Ready:** Community consortium could operate ALMA without ACT involvement
6. **Impact Demonstrated:** Clear evidence that ALMA contributes to detention reduction

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| ALMA | Australian Justice Intelligence - JusticeHub's evidence platform |
| ACT | A Curious Tractor - parent regenerative innovation organization |
| LCAA | Listen, Curiosity, Action, Art - ACT methodology |
| OCAP | Ownership, Control, Access, Possession - Indigenous data sovereignty principles |
| Seed | Project within ACT ecosystem (JusticeHub is a Tier 2 seed) |
| Knowledge Commons | Openly accessible evidence and intervention data |
| Consent Tier | Data access level (Public/Community/Private) |

## Appendix B: Related Documents

- [ALMA 2.0 Vision](./ALMA-2.0-VISION.md)
- [ALMA Data Collection Infrastructure](./ALMA-DATA-COLLECTION-INFRASTRUCTURE.md)
- [ALMA Community Contribution System](./ALMA-COMMUNITY-CONTRIBUTION-SYSTEM.md)
- [ACT Ecosystem Architecture](../../act-regenerative-studio/docs/architecture/act-ecosystem.md)
- [ACT Knowledge Base](../../act-regenerative-studio/.claude/skills/act-knowledge-base/)

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Owner: JusticeHub Team / ACT Ecosystem*
*Review Cycle: Quarterly with ACT Compendium*
