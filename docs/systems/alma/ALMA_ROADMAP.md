# ALMA Implementation Roadmap

**Aligned to ALMA Method Charter**

**Current Status**: Week 3 Complete (Data Ingestion ✅)

---

## The Journey So Far

### ✅ Weeks 1-2: Foundation (Complete)
**What we built**: Database + Service Layer

**Method alignment**:
- ✅ Ethics enforced at database level (not just policies)
- ✅ 3-tier consent model (sovereignty constraints)
- ✅ Signal families (not KPIs)
- ✅ Community authority as requirement (not option)
- ✅ No individual profiling (systems watched)

**Outcome**: 10 tables, 5 services, 30+ RLS policies, 100% test coverage

### ✅ Week 3: First Intelligence (Complete)
**What we built**: Ingestion Pipeline (Firecrawl → Claude → Database)

**Method alignment**:
- ✅ Ethical observation (public sources only)
- ✅ Pattern recognition (4 signals detected)
- ✅ Translation (web pages → structured knowledge)

**Outcome**: 15 interventions, 4 patterns emerging, $0.23 cost

---

## The Path Ahead

### Week 4: Admin UI (Practitioner Tools)
**Method goal**: Enable practitioners to contribute patterns, not just consume.

**What we'll build**:
- Intervention management interface
- Review workflow (Draft → Review → Approved → Published)
- Consent visualization (show who has authority)
- Community control dashboard

**Why it matters**:
> "ALMA serves practitioners and communities first, funders second." - ALMA Charter

The UI must empower practitioners to shape the intelligence, not just report to it.

**Files to create**:
```
app/alma/interventions/
  ├── page.tsx (list view with filters)
  ├── [id]/page.tsx (detail view)
  ├── [id]/edit/page.tsx (edit form)
  └── new/page.tsx (create form)

components/alma/
  ├── intervention-card.tsx
  ├── consent-badge.tsx
  ├── review-status-badge.tsx
  ├── signal-chart.tsx (5-signal portfolio view)
  └── governance-check.tsx (permission warnings)
```

**Estimated**: 8-10 hours

**Success metric**: A practitioner can add a new intervention, link it to evidence, and submit it for community review—all without technical knowledge.

---

### Week 5: Search & Discovery (Pattern Surfacing)
**Method goal**: Surface patterns humans miss.

**What we'll build**:
- Semantic search (vector embeddings)
- Signal-based ranking (community authority weighted highest)
- Cross-intervention pattern detection
- Geographic gap analysis

**Why it matters**:
> "ALMA detects slow drift, familiar failure modes, early inflection points." - ALMA Charter

The search must reveal **what's missing** (gaps) as much as **what's present** (programs).

**Capabilities**:
```typescript
// Natural language queries
"Programs addressing family connection in Victoria"
→ Returns interventions ranked by community_authority_signal

"What are we missing for Indigenous youth in NSW?"
→ Returns gap analysis: high need, low program coverage

"Has this failure mode happened before?"
→ Returns similar patterns from past interventions
```

**Estimated**: 6-8 hours

**Success metric**: A funder can ask "What programs have high community authority but low funding?" and get actionable answers.

---

### Week 6: Witta Harvest Pilot (Method Practice)
**Method goal**: Practice ALMA at the first place-based node.

**What we'll do**:
1. Run deep workshops with lived experience holders
2. Ground-truth ALMA's patterns against local reality
3. Capture first **Community Controlled** knowledge (not Public Commons)
4. Train first practitioners in ALMA method (not just tools)
5. Establish Indigenous-led framing of impact

**Why it matters**:
> "Witta is the place-based anchor that sets the culture, the pace, the ethics, the legitimacy." - ALMA Charter

**This is where ALMA becomes real.** Everything before Week 6 is preparation.

**Workshops**:
- **Workshop 1**: What is ALMA? (Method introduction)
- **Workshop 2**: Ground-truthing extracted interventions (Do these match reality?)
- **Workshop 3**: Pattern contribution (What do we see that ALMA doesn't?)
- **Workshop 4**: Consent & sovereignty (How do we protect knowledge?)

**Outcome**:
- First **Community Controlled** interventions added to ALMA
- First patterns flowing **upward** from node to network
- First Indigenous intelligence anchoring the system
- Proof that ALMA respects sovereignty (not just claims to)

**Estimated**: 2-3 days on-site

**Success metric**: Community members feel sovereign over their knowledge, not surveilled.

---

### Week 8: First State Node (Victoria)
**Method goal**: Distribute cognition beyond Witta.

**What we'll do**:
1. Replicate node infrastructure in Victoria
2. Connect VIC practitioners to ALMA
3. Share patterns between Witta ↔ VIC
4. Test "patterns up, insights back" flow

**Why it matters**:
> "This is distributed cognition, not central command." - ALMA Charter

With two nodes, we prove ALMA can:
- Operate without ACT involvement (durability)
- Share learning across geographies (network effects)
- Respect local autonomy (no central authority)

**Outcome**:
- Two-node network operational
- First cross-node pattern sharing
- Proof that JusticeHub is steward, not controller

**Estimated**: 1 week (setup + training)

---

### Week 10: Incremental Ingestion (Living Memory)
**Method goal**: ALMA's memory stays current, doesn't fossilize.

**What we'll build**:
- Scheduled scraping (weekly updates from government sources)
- Change detection (what shifted in policy language?)
- Pattern drift alerts (Is diversion emphasis declining?)
- Funding signal tracking (Are grants shifting toward punitive?)

**Why it matters**:
> "ALMA remembers. Memory that doesn't disappear when staff leave." - ALMA Charter

**Capabilities**:
```typescript
// Weekly updates
scheduleIngestion('weekly', ['government', 'states'])

// Change detection
detectChanges(before: snapshot_2024, after: snapshot_2025)
→ "Victoria removed 'restorative justice' language from 3 program descriptions"

// Pattern alerts
trackSignal('diversion_emphasis')
→ Alert: "Diversion programs dropped from 13 to 9 in Queensland (30% decline)"
```

**Estimated**: 4-6 hours

---

### Week 12: Funder Decision Aids (Capital Movement)
**Method goal**: Change how capital moves.

**What we'll build**:
- Portfolio dashboards (5-signal weighted scoring)
- Scenario tools ("What if we fund this cluster?")
- Early warning signals (system pressure indicators)
- Gap analysis (geographic, cohort, intervention type)

**Why it matters**:
> "Funders become more patient, more early, more responsive—not more controlling." - ALMA Charter

**Dashboards**:
```
┌─────────────────────────────────────────────────────┐
│  PORTFOLIO INTELLIGENCE (Victoria)                  │
├─────────────────────────────────────────────────────┤
│  Underfunded High-Evidence Programs (3)             │
│  • Koori Youth Justice (community_authority: 0.85)  │
│  • Group Conferencing (evidence_strength: 0.78)     │
│                                                     │
│  Promising But Unproven (2)                         │
│  • Youth Engagement Grants (option_value: 0.72)     │
│                                                     │
│  Ready to Scale (1)                                 │
│  • Youth Diversion (portfolio_score: 0.81)          │
│                                                     │
│  ⚠️  High Risk Flagged (1)                          │
│  • [Intervention X] (harm_risk: 0.62, declining)    │
└─────────────────────────────────────────────────────┘
```

**Estimated**: 8-10 hours

**Success metric**: A funder can see "This high-community-authority program is about to lose funding" and act 6 months earlier.

---

### Week 16: Open Source Release (Durability)
**Method goal**: Prove ALMA can survive without ACT.

**What we'll release**:
- Full codebase (MIT/GPL license)
- Documentation for practitioners
- Training materials (workshops, videos)
- Node setup guides

**Why it matters**:
> "If ACT disappeared tomorrow, could ALMA still be practiced? Answer must be: Yes." - ALMA Charter

**This is the ultimate test**: Can the method transfer to others?

**Outcome**:
- ALMA code is public commons
- Any organization can host a node
- JusticeHub is one steward among many (not sole authority)

**Estimated**: 1 week (documentation + release prep)

---

### Year 2: Governance Transfer
**Method goal**: Transfer stewardship from ACT to a trust.

**What we'll do**:
1. Establish community-governed trust
2. Transfer JusticeHub stewardship to trust
3. Seat Indigenous governance board
4. Create ALMA ethics review process

**Why it matters**:
> "Over time, stewardship should transfer to a broader trust or foundation." - ALMA Charter

**Outcome**: ACT is no longer needed for ALMA to function.

---

## Decision Points (User Input Needed)

### Decision 1: Week 4 Timing
**Options**:
1. **Start Week 4 now** (Admin UI + expanded ingestion)
2. **Pause and prep Witta pilot** (if Week 6 timing is urgent)
3. **Hybrid**: Build minimal UI, then shift to Witta prep

**Recommendation**: Option 3 (minimal UI for Witta practitioners to use)

### Decision 2: State Node Priority
**Options**:
1. **Victoria first** (most documented programs, Koori focus)
2. **NSW first** (largest youth justice population)
3. **Queensland first** (recent policy shifts, high need)

**Recommendation**: Option 1 (Victoria - strongest foundation)

### Decision 3: Witta Pilot Scope
**Options**:
1. **Full method training** (4 workshops, 2-3 days on-site)
2. **Lightweight validation** (1 workshop, validate existing patterns)
3. **Co-design approach** (build Witta's ALMA variant with them)

**Recommendation**: Option 3 (co-design - respects Indigenous sovereignty)

---

## Success Metrics (Entire Roadmap)

### ✅ We succeed if:
- Communities feel sovereign over their knowledge
- Funders move capital earlier and more patiently
- Practitioners learn faster across geographies
- Indigenous intelligence is foundational, not advisory
- The system can survive without ACT
- Power stays distributed
- Memory persists across turnover
- Failure modes get recognized early

### ❌ We fail if:
- It becomes a ranking system
- It centralizes authority
- It extracts without consent
- It optimizes people
- It requires ACT to function
- It serves funders more than communities
- It loses cultural grounding

---

## Current State (2025-12-31)

**What's working**:
- ✅ Database enforcing ethics
- ✅ Services respecting consent
- ✅ Ingestion observing ethically
- ✅ Patterns emerging (4 signals)
- ✅ Costs sustainable ($0.23 Week 3)

**What's next**: Week 4 (Admin UI)

**What's critical**: Week 6 (Witta pilot - proof of method)

**What's urgent**: None (we can work at the pace of trust-building)

---

## The Quiet Truth (Again)

Building ALMA requires:
- **Patience** (trust takes time)
- **Humility** (we serve, we don't control)
- **Discipline** (ethics over convenience)
- **Ethical restraint** (say no to invasive features)
- **Systems thinking** (watch trajectories, not snapshots)
- **Long memory** (don't forget past failures)

**Most institutions cannot hold this.**

**JusticeHub can—because we're not trying to own the system.**

**We're trying to keep it honest and alive.**

---

## Next Session: Week 4 Kickoff

When ready, we'll:
1. Build intervention management UI
2. Add PDF ingestion support
3. Expand to Indigenous sources (NATSILS, SNAICC)

**OR** (if timing requires):
- Pause technical work
- Prepare Witta pilot materials
- Design co-creation workshops

---

**The method is working. The tools serve the method. Justice serves communities.**

**ALMA is alive.**

---

*This roadmap is a living document. It changes as we learn, as communities teach us, as patterns emerge.*

**Next**: User decides Week 4 scope and Witta pilot timing.
