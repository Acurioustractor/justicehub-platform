# CONTAINED — Campaign Bible

> **LOCKED DOCUMENT** — This is the single canonical source for all CONTAINED campaign strategy, messaging, rollout planning, and agent architecture. All other strategy docs feed into this one.

**Last updated:** 2026-03-18
**Source docs merged:** launch-runbook, rollout-and-agent-strategy, research-brief, launch-week-posts

---

## 1. Core Story

**One container. Three rooms. The cure already exists.**

The reality of youth detention, the evidence for change, and the community-led alternatives already doing the work.

Secondary line: *CONTAINED shows what youth detention feels like. JusticeHub shows what works instead.*

Legacy line (still valid for print): *One shipping container. Three rooms. Thirty minutes.*

### Platform Stack (use this language everywhere)

| Layer | Public framing |
|-------|---------------|
| **CONTAINED** | The emotional front door. Shows what youth detention feels like. |
| **JusticeHub** | The public evidence and coordination layer. Shows what works instead. |
| **Empathy Ledger** | Consent, story, and community authority layer. |
| **ALMA** | The evidence intelligence engine that keeps the system current. |

**Short line:** `CONTAINED shows what youth detention feels like. JusticeHub shows what works instead.`

**Expanded line:** `CONTAINED moves people emotionally. JusticeHub turns that attention into public evidence, community visibility, funding pathways, and political pressure.`

---

## 2. The Three Rooms

### Room 1 — Current Reality
- Designed by young people at each tour stop — they are the experts
- $4,250/day. $1.55M/year. 84% reoffend. 18% complete education
- 10 minutes locked inside
- Tone: critical

### Room 2 — Therapeutic Alternative (Diagrama, Spain)
- Embodied empathy, 1:1 staffing, weekly family engagement
- 73% success rate. €5.64 returned per €1 invested
- 10 minutes of possibility
- Tone: transitional

### Room 3 — The Organisations Already Doing It
- **Changes every tour stop** — local host org fills this space with their story
- Community-led, culture-centred, evidence-based programs
- $75/day. 3% reoffending. 88% restorative justice success
- 527+ orgs on ALMA
- 10 minutes to see what works
- Tone: hopeful

---

## 3. Key Statistics (all sourced)

| Stat | Value | Source |
|------|-------|--------|
| Cost per detained youth/year | **$1.55M** | Productivity Commission ROGS 2024-25 |
| Daily cost of detention | **$4,250** | Productivity Commission ROGS 2024-25 |
| Detention reoffending rate | **84%** | Queensland Youth Justice Strategy 2023 |
| Community program reoffending | **3%** | Community Accountability Pilot 2024 |
| Daily cost of alternatives | **$75/day** | Community Services Benchmark Study 2024 |
| Restorative justice success | **88%** | Queensland Department of Justice 2024 |
| Youth helped for same cost | **16x** | Queensland Productivity Commission 2024 |
| Indigenous overrepresentation | **23x** | National youth detention statistics |
| Youth detained in Finland | **4** | Finnish Ministry of Justice 2024 |
| Diagrama (Spain) success | **73%** | Diagrama Foundation evaluation |
| Diagrama social return | **€5.64 per €1** | Diagrama Foundation impact study |

**Rule:** Every number cited must have a named source. Statistics are maintained in `src/content/campaign.ts`.

---

## 4. Tour Stops

| City | Venue | Partner | Date | Status |
|------|-------|---------|------|--------|
| **Mount Druitt** | Mounty Yarns | Mounty Yarns | April 2026 | Planning |
| **Adelaide** | Adelaide Convention Centre | Reintegration Conference + Justice Reform Initiative | May 2026 | Confirmed |
| **Perth** | University of Western Australia | UWA School of Social Sciences | May 2026 | Exploring |
| **Tennant Creek** | Community Space | Indigenous community engagement | June 2026 | Exploring |

---

## 5. Messaging Guardrails

### Lead with
- Dignity, community authority, and the possibility of change
- Evidence — the debate is settled, the question is political will
- The affirmative case for community-led alternatives

### Never
- Use "offenders" or "juvenile delinquents" — say **system-impacted young people**
- Use "at-risk" without qualifying who defined the risk
- Use "tough on crime" framing, even to critique it
- Front-load stark statistics without narrative context
- Start and end inside detention — always arrive at the alternative
- Imply JusticeHub ranks or profiles young people
- Say "AGI for youth justice" or "distributed search engine"

### Always
- Centre community authority — lived-experience advisors shape direction
- Centre agency, not trauma — lead with what works
- Keep ALMA framed as "evidence intelligence," not surveillance
- Keep Empathy Ledger framed as "consent, story, and community authority"
- Keep Indigenous leadership explicit wherever possible

### Recommended framing (FrameWorks Institute)
- Open with values (dignity, community), not raw conflict
- Use the numbers after the audience understands the system and the alternative
- Avoid "yes, but" language that accidentally repeats punishment logic

---

## 6. CTAs — Three Buckets

Every public page ties to one of these:

1. **Experience it** — Book your 30 minutes → `/contained/tour`
2. **Nominate a decision-maker** — Create public pressure → `/contained#nominate`
3. **Back the tour / Host the tour** — Fund the movement → `/back-this`

### Escalation Ladder (Beautiful Trouble)
- Witness → Nominate → Back → Share → Host → Fund → Document
- Every page needs a distinct role in this ladder
- Many entry points so more people can join at different commitment levels

---

## 7. Rollout Sequence

### Surfaces to push
1. `/contained` — campaign front door
2. `/contained/act` — action page (email, SMS, social forwarding)
3. `/contained/stories` — proof-of-voice surface
4. `/contained/nominations` — public pressure surface
5. `/contained/tour/social` — share kit for partners and media
6. `/justice-funding?state=NSW` — follow-through link when people ask where money goes

### Launch sequence
1. Publish main page, verify Mount Druitt countdown
2. Confirm nominations, backers, reactions, and media APIs returning public data
3. Send partner outreach using `/contained/act` templates
4. Give all partners the `/contained/tour/social` link with the core line
5. Send media directly to `/contained`, not the generic homepage

### Success criteria
- The first page people land on is coherent
- The first line people repeat is coherent
- The first action they take is obvious
- The evidence path behind the campaign is visible

---

## 8. Agent Strategy

### Agent types

| Agent | Purpose | Success metric |
|-------|---------|---------------|
| **Discovery** | Find programs, evaluations, inquiries, budget papers, policy updates | Human-accepted discoveries per week |
| **Evidence Linking** | Connect orgs, interventions, claims, outcomes, sources into evidence graph | Precision of accepted links |
| **Ranking** | Surface trustworthy, fresh, community-accountable results | Weighted ranking score (not CTR) |
| **Story-Evidence Bridge** | Suggest where consented stories connect to system patterns | Human-approved story/evidence pairings |
| **Campaign Ops** | Turn live campaign signals into rollout actions | Time from signal to action |

### Ranking score components
- `trust_score` · `freshness_score` · `community_relevance_score` · `human_acceptance_rate` · `actionability_score`
- **Do not** optimise for clicks, dwell time, or engagement alone

### Agent guardrails
- No automated profiling of vulnerable people
- No story ingestion without explicit consent boundaries
- Indigenous and community-led authority outranks institutional prestige
- Human review stays in the loop for anything public-facing
- Never infer risk about an individual young person
- Never rank "impact" in a way that profiles communities
- Never collapse Indigenous-led and mainstream programs into one ranking

### 30-day build order

**Phase 1:** Stabilise campaign messaging and surfaces. Expose ALMA as Room 3 evidence engine. Instrument search, nominations, registrations.

**Phase 2:** Launch discovery agents. Build human review queues. Start provenance-first evidence graph.

**Phase 3:** Add ranking experiments measured against human editorial judgment. Add campaign ops agents generating weekly rollout briefs.

**Phase 4:** Use approved interaction data to improve ranking. Publish "why this result surfaced" explanations. Build partner-facing evidence packs.

---

## 9. Product Opportunities

- **Room 3 live feed:** Latest orgs, evidence, and story excerpts connected to the city hosting the tour stop
- **Decision-maker brief:** One-page packet for every nominated leader, grounded in local evidence
- **Host pack:** City-specific toolkit with proof points, local orgs, media copy, follow-up asks
- **Funder pack:** Evidence-backed investment case showing how JH + EL + ALMA compound together
- **Campaign command layer:** Weekly agent-generated brief for what needs attention before the next stop

---

## 10. Launch Week Social Posts

Full 7-day sequence with Instagram + Twitter/X copy and photo assignments: see `compendium/launch-week-posts.md`

### Photo assignment summary

| Day | Theme | Asset |
|-----|-------|-------|
| Mon | Launch | `poster-tour.png` |
| Tue | Cost of detention | `social-stat-cost.png` |
| Wed | Spain / Diagrama | `diagrama-youth-justice-spain.jpg` (real photo) |
| Thu | Community orgs | `connecting-communities-...jpeg` + `confit-pathways.jpg` (real photos) |
| Fri | Young people's voices | `spotlight-on-changemaker-brodie-germaine.jpg` + `bespoke-chalk-question.png` |
| Sat | Tour experience | `container-factory.jpg` + `poster-brand.png` |
| Sun | Call to action | `the-courage-to-connect-...jpg` (real photo) |

All real photos from Empathy Ledger. No AI-generated photorealistic images.

---

## 11. Fundraising

| Milestone | Amount | Description |
|-----------|--------|-------------|
| Container Build | $25,000 | Custom-build the one shipping container, three rooms |
| Adelaide + Perth | $50,000 | Transport, logistics, partner activation |
| Tennant Creek | $75,000 | Community-controlled engagement, cultural safety |
| Full Tour + Documentation | $100,000 | Complete Australian tour with professional documentation |

---

## 12. Research Basis

### Sources reviewed
- Karpathy autoresearch — tight metric loops, narrow scope, reversible outputs
- Hyperspace compound learning — distributed learning, visible audit trails, shared state
- FrameWorks Institute — values-led framing, dignity before statistics
- Beautiful Trouble — strategic escalation, multiple entry points, audience-tailored action

### Key takeaway
> If a feature does not make the public story clearer, the evidence chain stronger, or the action path easier, it is noise.

---

## 13. File Map

| Purpose | Canonical file |
|---------|---------------|
| Brand guide (colors, type, voice, photos, assets) | `compendium/brand-guide.md` |
| Campaign bible (this file — strategy, messaging, rollout) | `compendium/contained-campaign-bible.md` |
| Visual brand viewer | `output/campaign-hub/index.html` |
| Programmatic brand constants | `src/lib/contained-brand.ts` |
| Campaign data (tour stops, stats, social kits) | `src/content/campaign.ts` |
| Launch week posts (full copy) | `compendium/launch-week-posts.md` |
| Campaign assets | `public/images/contained/` |
| Real photos (168) | Empathy Ledger: `gallery-photos/justicehub/{category}/` |
| Superdesign brand draft | Document ID: `0ffde5b0-5316-4d31-ad6b-6c622da38e7d` |
| Superdesign launch email | Document ID: `eaecfef1-89ba-4b49-a2ae-9ad2db7a93fa` |
| Superdesign asset gallery | Document ID: `e050cec4-810a-49c0-82c9-48dda1c5056b` |
