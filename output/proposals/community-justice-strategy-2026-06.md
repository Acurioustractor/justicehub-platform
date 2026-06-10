# JusticeHub: the community justice infrastructure

**Prepared:** 10 June 2026
**For:** the George Newhouse conversation (Friday 12 June), then the justice reinvestment network co-directors (late June)
**Purpose:** explain the architecture clearly enough that both conversations end with aligned resource, not polite interest.

---

## The one-page version

Australia spends about $1.33 million per year to hold one young person in detention, and most of them come back. Communities that run their own alternatives get a fraction of that money and better results, but their evidence lives in annual reports nobody reads, their programs are invisible to each other, and every inquiry starts the data collection from zero.

JusticeHub is the infrastructure that ends that cycle. One system, three layers:

**The Map.** Every community-led justice program in Australia, profiled and findable. Not scraped and dumped: each organisation controls its own profile, what is shown, and what stays private. The Australian Living Map of Alternatives already holds the national corpus of interventions and organisations; the work now is converting it from a database into a network that can see itself.

**The Evidence.** What each model achieves, against what detention costs. Outcomes, funding history, and lived-experience stories held under Indigenous data governance, with consent enforced in the database itself, not in a policy document. The cost comparison writes the law reform argument on its own: community control against $1.33 million a year per child.

**The Movement.** The connective layer that turns evidence into pressure. Issue pages that gather every case, campaign, and study under one live question. Timelines that show doctrine and policy moving. A follow loop that turns visitors into a roster. Campaign machinery aimed at the inquiry and reform windows of the next three to four years, with the goal of converting detention dollars into community-controlled funding.

The reason to believe this is not a pitch: **the third layer already runs.** The Justice Matrix went live this week at justicehub.com.au/justice-matrix, built for the National Justice Project and OHCHR conversation. It watches court databases weekly, publishes honestly badged records, gathers them under live issues, and grew itself while we slept. The domestic build is the same machinery pointed at Australian community justice.

---

## What is live today (verified)

- **Justice Matrix**: 360+ strategic cases, nearly 70 campaigns, 8 issue pages, weekly self-updating scanners across HUDOC, CJEU, CourtListener, CanLII, and the European asylum law database. Follow-an-issue, export, contribute, and pro bono verification loops all working. (Counts queried from production 10 June 2026.)
- **The Australian corpus**: the Australian Living Map of Alternatives intervention and organisation tables, the national justice funding dataset, and detention cost benchmarks (ROGS 2024-25).
- **Consent infrastructure**: Empathy Ledger story consent levels enforced at the SQL layer; OCAP guardrails wired into the CRM so lived-experience contacts are never auto-enrolled into any automation.
- **In progress this week**: a verification sprint on the Australian models corpus, closing the read paths where unreviewed AI-extracted records could reach public pages. Credibility before partnership.

## The governance moat

Every data platform that has approached Aboriginal community-controlled organisations has asked them to give their data up. JusticeHub's position is the opposite, and it is the reason organisations will put data in rather than have data taken: communities own their data and control their profiles. The model draws on the protocols of Mukurtu and the OCAP and CARE principles, and it is already implemented in code, not promised in a values statement. A profile shows what the organisation chooses to show. Verification means the community confirmed it, not that an admin clicked approve.

## Oonchiumpa as basecamp, spokes from there

Oonchiumpa in Mparntwe (Alice Springs) becomes the first basecamp: the place where the community-controlled profile is co-designed with a community rather than assumed on their behalf. The Australia trip already planned becomes the spoke-building circuit: each justice community organisation visited gets profiled with them, in the room, on their terms. Events grow from the same pattern, gatherings where the network meets itself on the map for the first time.

## The two conversations

**Friday, George Newhouse.** The matrix he asked about is live and growing weekly; fifteen minutes inside it makes the point. The ask: NJP alignment on the strategic litigation layer (pro bono verification panel, issue curation, the OHCHR Pacific pilot roster) and an introduction effect: NJP's name beside the matrix makes the domestic layer credible to every legal partner that follows.

**Late June, the justice reinvestment co-directors.** The offer: the national justice reinvestment map as shared infrastructure under the network's governance, not ours. Every site profiled with its community. Outcomes beside detention costs. The network seeing itself, supporting itself, and accumulating the evidence base that the next inquiry cannot ignore. The ask: co-design the pilot, name the first sites, and dedicate one person on each side to it.

## The three-to-four year line

Data the communities control, becomes case studies the sector trusts, becomes campaigns the public follows, becomes the inquiry and reform window, becomes detention dollars converted into community-controlled funding. Each step is a build we have either shipped or specced. None of it requires anyone's permission to begin, because the first step is already running.

---

### Provenance

- Matrix counts (360 cases, 67 campaigns, 8 issues): queried from Supabase production tables `justice_matrix_cases`, `justice_matrix_campaigns`, `justice_matrix_issues`, 10 June 2026.
- Detention cost $1.33M/year national average: Report on Government Services 2024-25 benchmark, recorded in project memory with state-by-state table.
- Anchor communities (Oonchiumpa, PICC, BG Fit, MMEIC): project record, 2026.
- Consent enforcement: `justice_matrix_evidence_consent_gate` migration and OCAP lane:community CRM guardrail, verified in code 10 June 2026.
- AI-generated record counts in the Australian corpus: repo records (279+ rejected records; leak audit running 10 June 2026); re-verify against the database before quoting externally.
