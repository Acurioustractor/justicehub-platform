# JusticeHub / CONTAINED Rollout + Agent Strategy

Date: 2026-03-12

## Core Public Story

Use one stack everywhere:

- `CONTAINED` is the emotional front door.
- `JusticeHub` is the public evidence and coordination layer.
- `Empathy Ledger` is the consent and lived-experience layer.
- `ALMA` is the evidence engine that keeps the system current.

Short public line:

`CONTAINED shows what youth detention feels like. JusticeHub shows what works instead.`

Expanded line:

`CONTAINED moves people emotionally. JusticeHub turns that attention into public evidence, community visibility, funding pathways, and political pressure.`

## What To Roll Out Today

Today is about clarity, not new complexity.

1. Anchor the campaign on the first confirmed public stop: Mount Druitt, April 25, 2026.
2. Keep the core object consistent: `one shipping container, three rooms, thirty minutes`.
3. Keep every public page tied back to the same arc:
   - Room 1: what the current system does.
   - Room 2: what proven alternatives look like.
   - Room 3: the organisations already doing the work.
4. Put every CTA into one of three buckets:
   - `Experience it`
   - `Nominate a decision-maker`
   - `Back the tour / host the tour`
5. Make the platform stack visible enough to be credible, but not so technical that it breaks momentum.

## Messaging Guardrails

- Lead with community authority, not AI novelty.
- Lead with youth justice transformation, not product architecture.
- Keep ALMA framed as `evidence intelligence`, not surveillance.
- Keep Empathy Ledger framed as `consent, story, and community authority`, not content capture.
- Avoid implying that JusticeHub ranks or profiles young people.
- Keep Indigenous leadership and community-controlled alternatives explicit wherever possible.

## The Agent Opportunity

The autoresearch pattern is useful for JusticeHub, but it should sit behind the public story.

Reference pattern:

- Karpathy `autoresearch`: metric-driven autonomous experimentation with a tight keep/revert loop.
- Hyperspace `agi`: distributed agents sharing discoveries through gossip, CRDT state, and durable archives.

For JusticeHub, the right move is not `build a distributed search engine` as a public headline.
The right move is `build a trustworthy community-evidence intelligence layer` that happens to use agentic search and ranking underneath.

## Agent Types JusticeHub Should Build

### 1. Discovery Agents

Purpose:

- Find new programs, evaluations, inquiries, budget papers, coronial findings, media investigations, and policy updates.

Outputs:

- Candidate organisations
- Candidate evidence items
- Candidate policy changes
- Candidate data quality alerts

Primary success metric:

- Human-accepted discoveries per week

### 2. Evidence Linking Agents

Purpose:

- Link organisations, interventions, claims, outcomes, jurisdictions, and sources into a usable evidence graph.

Outputs:

- Evidence links with provenance
- Claim-to-source mappings
- Duplicate detection suggestions

Primary success metric:

- Precision of accepted links

### 3. Ranking Agents

Purpose:

- Improve how JusticeHub surfaces useful evidence, not just popular content.

Outputs:

- Better search ordering
- Better intervention recommendations
- Better “what works near this problem” suggestions

Primary success metric:

- Weighted ranking score, not pure CTR

Recommended weighted score:

- `trust_score`
- `freshness_score`
- `community_relevance_score`
- `human_acceptance_rate`
- `actionability_score`

Do not optimise only for:

- clicks
- dwell time
- engagement

### 4. Story-to-Evidence Bridge Agents

Purpose:

- Suggest where consented lived-experience stories connect to system patterns, interventions, and evidence.

Outputs:

- Suggested thematic links
- Suggested evidence companions for stories
- Suggested campaign excerpts for approved public use

Primary success metric:

- Human-approved story/evidence pairings

### 5. Campaign Ops Agents

Purpose:

- Turn live campaign signals into rollout actions.

Outputs:

- Which city needs new outreach
- Which partner pages are stale
- Which story gaps weaken Room 3
- Which media hooks are timely
- Which decision-maker nominations should trigger follow-up

Primary success metric:

- Time from signal to action

## Metric Design

This is where JusticeHub either becomes incredible or dangerous.

Every agent loop should include:

- `source_quality`
- `community_authority`
- `consent_safety`
- `human_review_pass_rate`
- `freshness`
- `actionability`

Hard constraints:

- Never infer risk about an individual young person.
- Never rank “impact” in a way that profiles communities.
- Never publish story/evidence pairings without consent-compatible rules.
- Never collapse Indigenous-led and mainstream programs into one undifferentiated ranking regime.

## 30-Day Build Order

### Phase 1

- Stabilise campaign messaging and rollout surfaces.
- Expose ALMA more clearly as the evidence engine behind Room 3.
- Instrument search, story clicks, nominations, registrations, and funder interest.

### Phase 2

- Launch discovery agents for public evidence and organisation updates.
- Build human review queues for evidence acceptance and linking.
- Start a provenance-first evidence graph for interventions, claims, and outcomes.

### Phase 3

- Add ranking experiments for intervention search and evidence retrieval.
- Measure against human editorial judgments before any broad rollout.
- Add campaign ops agents that generate weekly rollout briefs.

### Phase 4

- Use approved interaction data to improve ranking.
- Publish transparent “why this result surfaced” explanations.
- Build partner-facing evidence packs for hosts, funders, and journalists.

## Immediate Product Opportunities

- `Room 3 live feed`: latest organisations, evidence, and story excerpts connected to the city hosting the tour stop.
- `Decision-maker brief`: one-page generated packet for every nominated leader, grounded in local evidence and host stories.
- `Host pack`: city-specific toolkit with proof points, local organisations, media copy, and follow-up asks.
- `Funder pack`: evidence-backed investment case showing how JusticeHub, Empathy Ledger, and ALMA compound together.
- `Campaign command layer`: a weekly agent-generated brief for what needs attention before the next stop.

## Research Basis

Primary sources reviewed:

- Karpathy autoresearch repo: https://github.com/karpathy/autoresearch
- Hyperspace AGI repo: https://github.com/hyperspaceai/agi

Key takeaways from those sources:

- Tight metric loops matter more than grand agent architectures.
- Shared state reduces cold-start and compounds useful discoveries.
- Archive + leaderboard + live gossip is a strong pattern.
- Raw optimisation without careful metrics and guardrails will drift fast.

## Recommended Internal Position

Do not say:

- `JusticeHub is building AGI for youth justice`
- `distributed search engine for justice`

Do say:

- `JusticeHub is building community-governed evidence infrastructure for youth justice reform.`
- `ALMA helps us continuously find, connect, and surface what works.`
- `CONTAINED turns public attention into evidence, action, and accountability.`
