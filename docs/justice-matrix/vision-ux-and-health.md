# Justice Matrix — System Health, the Opportunity, and the UX Dream

**Prepared:** 2026-05-30
**Source material:** National Justice Project, *Background Paper: Justice Matrix – Refugee & Asylum Strategy* (23 Oct 2025), prepared for OHCHR Regional Office for South-East Asia (Bangkok); plus two illustrative matrices (12 strategic cases, 10 advocacy campaigns).
**Status of this document:** strategy + UX vision. Not a code change. Decisions flagged at the end.
**Companion:** `docs/justice-matrix/historical-alignment.md` is the verified reconciliation of all work done to date (git + DB + docs). Read it for the authoritative current-state inventory; this doc carries the vision and corrections noted there.

---

## 0. The reframe

The Justice Matrix in this repo began life as one feature inside a domestic youth-justice platform. The three files reset the frame.

The National Justice Project is proposing a *Global Strategic Litigation and Advocacy Clearing House*. A place where a refugee lawyer in Bangkok, a campaigner in London, and a clinic in Toronto draw on the same living memory of what has been argued, what has won, and what is being fought right now. OHCHR's South-East Asia office is the proposed host. Refugee and asylum protection is the beachhead.

Here is the part that matters. The thing they are proposing to build mostly already exists in this codebase. Seven tables, semantic search, a live HUDOC enricher pulling real ECtHR judgments, a discovery-to-publish editorial pipeline, consent gating in the database, audience lenses for refugee and youth. The proposal's own timeline put "soft launch with 6 to 10 pilot partners" at Month 9. Counting from October 2025, we are at roughly Month 7. The build is ahead of the plan.

So the dream is not a green field. The dream is to recognise what we are holding and point it at a bigger room.

---

## 1. Where we are at — current system health

Read against the proposal's own operating model, here is the honest scorecard.

| Layer | Proposal calls for | What exists in the repo | State |
|---|---|---|---|
| **Data model** | Postgres structured matrices | 4 live tables: `justice_matrix_cases`, `_campaigns`, `_discovered`, `_sources`. Evidence is cross-linked from `alma_evidence` (consent-gated), not a matrix table. (`_resources` / `_scrape_logs` exist in migration files but are NOT in the DB.) | **Built** |
| **AI search stream** | Scheduled crawls of HUDOC, CJEU, BAILII, AustLII, CanLII, US courts; de-dup; auto-summaries | Playwright scanner + adapters for HUDOC (live, 114 judgments), CJEU/Curia, CourtListener, EDAL; dedup via similarity score | **Built (HUDOC live; others vary)** |
| **Editorial workflow** | Ingest → triage → normalise → legal review → publish → 90-day refresh | Discovery queue → review queue → auto-publish; pro bono legal-review loop; grounded summary enricher | **Built** |
| **Faceted search + profiles** | Public faceted search; case & campaign profiles; CSV/JSON export | `/justice-matrix/explore` semantic + keyword, reactive facets (Court, Era, Region, Outcome, Strength); case & campaign detail pages | **Built (export missing)** |
| **Semantic intelligence** | Azure AI Search index | pgvector embeddings (text-embedding-3-small), `justice_matrix_search_*` RPCs | **Built** |
| **Consent & safety** | No PII without consent; OHCHR data protection | Consent gating in SQL (Public Commons / Community Controlled / Strictly Private), RLS policies | **Built** |
| **Audience lenses** | Practitioners, NGOs, academics, advocates | `surfaces.ts`: refugee/global + youth/AU preset lenses | **Built at data layer, thin at UI** |
| **Quarterly briefs** | "State of Refugee Protection" briefs from live data | `/digest`, `/insights`, `/api/analysis/*` (coverage, report, data-health) | **Partial / scaffold** |
| **Partner contributions** | Webforms, templated submissions, versioning | `/justice-matrix/contribute` form | **Partial (no notify / no versioning)** |
| **Partner portal** | SSO, RBAC, dashboards, submissions | none | **Missing** |
| **API + alerts** | API endpoints, webhooks to Slack/Teams/email | none public | **Missing** |
| **Human stories** | (not in proposal) | Empathy Ledger v2 has 200+ stories; ALMA evidence layer | **Exists, not yet woven into matrix** |

**Maturity verdict:** late-stage prototype crossing into production. The spine (data, ingestion, search, editorial) is real and running. The surfaces (public UX, briefs, portal) are where the design work now lives. And there is one asset the proposal does not even ask for, because the people who wrote it did not know it was available: a story engine. More on that below, because it is the unfair advantage.

---

## 2. The critical opportunity

The proposal states the problem plainly: landmark victories are isolated, pleadings and playbooks are lost in national silos, frontline organisations duplicate effort and miss chances to coordinate. The Matrix de-fragments. It maps, classifies, and connects litigation, campaigns, and comparative-law intelligence across borders.

Three reasons this is the moment, and this is the team.

**First, the working MVP closes the credibility gap.** A proposal asks a funder to imagine. A working system lets them click. When OHCHR Bangkok opens `/justice-matrix/explore` and watches a real ECtHR judgment surface from a plain-English query, the conversation stops being about whether it can be built and starts being about who joins the pilot.

**Second, the refugee beachhead has a spine that runs through Australia.** Look at the cases. *Plaintiff M70* (High Court of Australia, the Malaysia Solution struck down). *Hirsi Jamaa v Italy* (the high seas are not a law-free zone). *Sale v Haitian Centers Council* (the adverse US precedent that advocacy keeps trying to distinguish). *AAA v SSHD* (the UK Rwanda judgment). These are not twelve unrelated cases. They are one argument about third-country transfer and non-refoulement, fought on four continents. Australia's offshore regime sits at the centre of that argument. A Bangkok-hosted clearing house that can show an Australian lawyer how Strasbourg reasoned about Libya, and show a London campaigner what #KidsOffNauru did to shift a parliament, is the cross-border solidarity the proposal is asking for.

**Third, the story layer.** Every other legal database gives you cases. Every campaign tracker gives you campaigns. None of them can put a child's account of Nauru next to *M70* and next to #GameOver. JusticeHub can, because Empathy Ledger is already wired in. That is the thing no competitor and no government portal will match.

---

## 3. Who this is for

The proposal names the audiences. The data already splits into two surfaces. Here are the people, the job each one is trying to get done, and the one screen where they live.

| Persona | The job to be done | Home screen |
|---|---|---|
| **The strategic litigator** | "Has anyone argued this before, where, and did it win? Can I see the pleading?" | Case profile + Explore |
| **The campaigner / organiser** | "What tactic moved a government on this issue? Who is the coalition? What is the playbook?" | Campaign profile + Issue profile |
| **The academic / clinic** | "Map the coverage. Where are the gaps? Let me export and cite." | Explore + Briefs + export |
| **The funder / policymaker / OHCHR** | "Show me the state of protection in this region, and the access gap, in one artifact." | The Brief + the Hub |
| **The editor / curator** | "Triage what the AI found, run it past a pro bono reviewer, publish." | Admin discovery + review queues (built) |
| **The person with lived experience** | "My story belongs next to the law that was made about people like me." | Story, surfaced inside Issue profiles |

Two lenses sit over all of them, already in the data: **Refugee & Asylum (global)** and **Australian Youth (domestic)**. The architecture lets the same engine serve a Bangkok pilot and a Mparntwe youth-justice campaign without forking the platform.

---

## 4. How it connects — Australia, South-East Asia, and the campaigns

The connective tissue is the whole game. Three threads run through the source material.

**The third-country-transfer thread (the law).** *M70* (Australia) → *AAA / Rwanda* (UK) → *N.S.* and *M.S.S.* (EU/Dublin) → *Ilias and Ahmed* (transit zones) → *Innovation Law Lab* (Remain in Mexico). One legal question, asked five ways. A litigator who finds one should be one click from the other four.

**The high-seas thread.** *Hirsi Jamaa* (Italy/Libya, non-refoulement applies on the high seas) sits against *Sale* (US/Haiti, the Supreme Court said it did not). Australia's boat turnbacks live in the gap between those two judgments. This is exactly the comparative-law intelligence the proposal promises, and it is sitting in the seed data already.

**The case-and-campaign weave (the movement).** Every case has a campaign shadow, and every campaign leans on a case. *M70* pairs with #KidsOffNauru and ARAN. The Rwanda judgment pairs with Together With Refugees. Family separation litigation pairs with Families Belong Together. The product's signature object should be the thing that binds them: the **Issue**.

**South-East Asia as the host region.** OHCHR Bangkok hosts. The repo already carries non-refoulement seed cases for Asia. The proposed expansion path (US, UK, Canada, Australia, then SE Asia, then regional and international) is already the region-bucketing in the data layer. An ASEAN advisory group, per the proposal's governance model, plugs into the same editorial pipeline that is already running.

---

## 5. The UX / UI dream

### 5.1 The organising idea

**Three lenses, one corpus, woven by an Issue.**

- **The Law** — cases, holdings, pleadings, precedent strength.
- **The Movement** — campaigns, coalitions, tactics, outcomes.
- **The People** — lived-experience stories from Empathy Ledger.

The Matrix's signature is not any one lens. It is the weave. The screen that does not exist anywhere else is the **Issue Profile**, where a single question ("offshore detention and third-country transfer") gathers all three.

### 5.2 Information architecture

```
/justice-matrix                  The Hub — a living state-of-play, not a brochure
  /explore                       The spine — faceted semantic search, lens switcher
  /issues/[slug]                 THE NEW OBJECT — Law + Movement + People on one question
  /cases  /cases/[id]            The law (built)
  /campaigns  /campaigns/[id]    The movement (built)
  /playbooks/[slug]              Reusable strategy distilled across cases + campaigns
  /briefs/[region]               "State of Protection" — auto-generated, exportable
  /ask                           Ask the Matrix — grounded chat, every claim cited
  /contribute                    Partner submission (built, needs portal)
  /partners                      Secure portal: submit, dashboards, alerts (new)
/admin/justice-matrix/*          Editorial back-of-house (built)
```

### 5.3 The hero screens

**A. The Hub — "State of Play"**

Not a landing page. A pulse. What is alive in the corpus right now.

```
┌──────────────────────────────────────────────────────────────┐
│  JUSTICE MATRIX           [Refugee & Asylum ▾]   [Ask ▸]       │
│  A living memory of what has been argued, won, and fought.     │
├──────────────────────────────────────────────────────────────┤
│   847 cases · 312 campaigns · 200 stories · 6 jurisdictions    │
│                                                                │
│   ┌── world map, jurisdictions lit by coverage ──────────┐     │
│   │   UK ● US ● CA ● AU ● ECtHR ● [SE Asia ◐ next]        │     │
│   └──────────────────────────────────────────────────────┘     │
│                                                                │
│   ISSUE IN FOCUS                  COVERAGE GAP                 │
│   Offshore detention &            SE Asia: 8% mapped           │
│   third-country transfer          [help us close it ▸]        │
│   5 cases · 3 campaigns · 2 stories                            │
│                                                                │
│   FRESH FROM THE PIPELINE         LATEST BRIEF                 │
│   AAA v SSHD enriched (HUDOC)     State of Protection Q2 ▸     │
│   2 new ECtHR judgments staged                                │
└──────────────────────────────────────────────────────────────┘
```

**B. Explore — the spine**

The faceted semantic search already exists. The work is to make the lens switcher real and to surface the weave on every result card.

```
┌──────────────────────────────────────────────────────────────┐
│  ⌕  non-refoulement on the high seas            [semantic ▾]   │
│  Lens:  ◉ All   ○ Law   ○ Movement   ○ People                  │
├───────────────┬──────────────────────────────────────────────┤
│ FACETS        │  Hirsi Jamaa v Italy (GC)        ECtHR · 2012  │
│ Court    ▸    │  High-seas pushbacks; non-refoulement applies  │
│ Era      ▸    │  extraterritorially.  ◆ strong precedent       │
│ Region   ▸    │  ↳ cited by 2 campaigns · linked to 1 story    │
│ Issue    ▸    │ ───────────────────────────────────────────── │
│ Outcome  ▸    │  Sale v Haitian Centers Council  USSC · 1993   │
│ Strength ▸    │  Adverse: non-refoulement did NOT constrain    │
│               │  high-seas repatriation.  ⚠ often distinguished│
│               │  ↳ contrasts with Hirsi · 1 playbook           │
└───────────────┴──────────────────────────────────────────────┘
```

The contrast pairing (Hirsi vs Sale, shown together) is the moment a litigator feels the value.

**C. The Issue Profile — the object nobody else has**

```
┌──────────────────────────────────────────────────────────────┐
│  ISSUE   Offshore detention & third-country transfer           │
│  Can a state send asylum seekers to a third country to be      │
│  processed, and when is that unlawful?                         │
├──────────────────────────────────────────────────────────────┤
│  ── timeline spine ─●─────●────────●──────●──────●──→          │
│     1993 Sale   2011 M70/MSS   2012 Hirsi   2023 Rwanda        │
│                                                                │
│  THE LAW              THE MOVEMENT           THE PEOPLE        │
│  M70 (HCA 2011)       #KidsOffNauru (AU)     "We waited six    │
│  AAA/Rwanda (UKSC)    Together w/ Refugees   years on Nauru"   │
│  Hirsi (ECtHR)        ARAN                    — story, EL      │
│  N.S. / M.S.S. (CJEU) Families Belong Tog.                    │
│  Sale (USSC, adverse)                                          │
│                                                                │
│  ▸ PLAYBOOK: what worked — strike the designation, not the     │
│    policy (M70); build the factual record on receiving-state   │
│    conditions (M.S.S.); mobilise on children first (#KidsOff). │
│                                                                │
│  [Export issue brief ▸]  [Ask the Matrix about this ▸]         │
└──────────────────────────────────────────────────────────────┘
```

**D. The Case Profile** (extend what exists)

Citation, court, year, strategic angle, key holding, authoritative link, precedent strength, attached pleadings/resources, semantically related cases, the campaigns that used it, the stories it touches. Copy-citation and export already partly built. Always with the legal disclaimer and provenance (verified by, source, extraction confidence).

**E. The Brief — "State of Protection"**

The artifact that wins funders and feeds the OHCHR quarterly cadence. Auto-generated from live data: coverage map, movement of precedent over the quarter, new campaigns, the access gap, the unanswered questions. One-click PDF/CSV/JSON export. This is the proposal's "Quarterly State of Refugee Protection brief" made real, and it writes itself from the corpus.

**F. Ask the Matrix** (grounded AI)

A chat that answers "find me precedent on high-seas pushback and the campaigns that fought it" by querying the corpus, citing every case and campaign by link, and refusing to give legal advice. The civic-intelligence chunking and RPCs already in the wider platform are the engine; this points them at the matrix corpus.

**G. The Partner Portal** (the proposal's secure stream)

SSO + RBAC. Submit a case, campaign, or pleading through a templated form. See your contributions and their review status. Dashboards. Alerts to Slack/Teams/email when something lands in your watched issue. This is the missing layer that turns a website into a clearing house.

### 5.4 Design language — a fork to settle

`DESIGN.md` locks JusticeHub to an editorial, warm-institutional system: Cormorant Garamond, cream `#f8f1e6`, deep purple `#4a2560`, gold `#8d6a44`. That voice is right for the public and story surfaces. It carries warmth and credibility for a domestic audience.

An OHCHR-hosted, multi-jurisdiction legal clearing house may want a more sober civic-international register for the practitioner and portal surfaces, closer to the Civic Bauhaus family already used by CivicGraph. The honest recommendation: keep editorial warmth for the public Hub, Issue, and Story surfaces; introduce a restrained practitioner mode for Explore, Case profiles, and the Portal. This is a deviation from `DESIGN.md` and per its own rule it needs your sign-off before any pixels move.

---

## 6. From here to the dream — the build path

Anchored to actual state, not the proposal's clean-slate timeline.

| Phase | What ships | Why it matters | Rough size |
|---|---|---|---|
| **A. The weave demo** | `Issue` object (small schema add) + Issue Profile screen + lens switcher made real + seed these 12 cases / 10 campaigns and link them into 3–4 issues | This is the 90-second demo that sells the OHCHR pitch | days, not weeks |
| **B. The artifact** | "State of Protection" auto-brief + coverage map + Ask the Matrix grounded chat + CSV/JSON export | Gives funders and OHCHR something to hold and forward | ~1–2 weeks |
| **C. The clearing house** | Partner portal: SSO, RBAC, templated submission, dashboards, alerts | Turns a site into the practitioner ecosystem the proposal describes | ~3–4 weeks |
| **D. The region** | SE Asia source expansion, ASEAN advisory wiring, multi-region briefs | Delivers on the Bangkok host and the expansion path | ongoing |

### The one demo that wins the room

An OHCHR officer in Bangkok types *"offshore detention third country transfer"*. The Matrix returns *M70*, *Rwanda*, *Hirsi*, and *Sale* shown in contrast, the three campaigns that fought offshore detention, and one Nauru child's story from Empathy Ledger. One click produces a *State of Protection* brief as a PDF they can forward to Geneva. Ninety seconds, and the proposal stops being a proposal.

---

## 7. Decisions for you

1. **Positioning.** Is this JusticeHub's Justice Matrix with a refugee surface, or is it the National Justice Project / OHCHR *Global Justice Matrix* that JusticeHub powers underneath? This decides domain, brand, governance, and whether we co-brand with OHCHR and NJP.
2. **Design register.** Editorial-warm throughout, or split (editorial for public/story, civic-international for practitioner/portal)? Needs `DESIGN.md` sign-off either way.
3. **Next concrete move.** Seed these 12 cases + 10 campaigns now and build the Issue Profile (Phase A), or build an HTML mockup of the Hub + Issue Profile first to look at before any data or schema work?

---

## 8. Verified reality check (2026-05-30)

After reading the actual page code and querying the live database (project `tednluwflfhxyucgwigh`), the picture is sharper than Section 1's inferred scorecard. Two corrections matter.

**The screens are more built than the vision assumed.** The hub, explore, case profile, campaign profile, digest, and insights pages are all fully rendered and in the editorial-warm design language. The case profile already weaves the corpus: related cases, linked campaigns, cross-linked `alma_evidence` ("what communities built instead", consent-redacted), and "in the news" media, all via semantic RPCs with category-overlap fallback. The insights page already shows "where cases and campaigns talk to each other" by shared issue area. So the weave is not missing. It exists at the profile and analytics level. What is missing is a standalone **Issue landing** that gathers a theme into one room, plus the global framing, briefs, stories, conversational AI, and visualisation.

**The real gap is data quality and refugee coverage, not code.** Live counts:

| Table | Count | Quality signal |
|---|---|---|
| Cases | **328** | Only **23 verified** (7%), 14 featured. **233 (71%) have no region**, **160 (49%) have no outcome**. 300 have an authoritative link. |
| Campaigns | **67** | 65 ongoing. Heavily **Australian** (~50 domestic) vs ~9 international (UK 2, US 3, Canada 2, Malaysia 1, Thailand 1). |
| Discovered | 253 total, **1 pending** | The AI scan-and-stage pipeline has run and been worked through. |
| Sources | 47 total, **31 active** | Ingestion infrastructure is live. |

Read against the OHCHR refugee beachhead, this is the honest state:

- The **corpus skews to Australian youth justice**, which is the older surface. The refugee cases exist (Europe 40, Americas 16, plus Asia-Pacific) from HUDOC and friends, but most carry no region or outcome tag, so they render thin.
- The **refugee campaign coverage is the weakest layer**. The OHCHR pitch needs the international campaigns (#KidsOffNauru, Together With Refugees, Families Belong Together, the Canadian STCA fight), and most of those are exactly the 10 rows in the source spreadsheet, not yet in the corpus as verified, featured records.
- The **12 cases in the source spreadsheet are the canonical refugee set** (M70, Rwanda, Hirsi, Sale, M.S.S., N.S., Ilias, Singh, Ruta...). Verifying and featuring those, with region + outcome + precedent strength filled, would light up the explore page and the demo immediately.

**Revised maturity verdict:** the platform is production-grade in plumbing and public UX, early-stage in curated refugee content and in the clearing-house surfaces (Issue landing, briefs, portal, stories, Ask). For the OHCHR demo, the highest-leverage work is, in order: (1) verify + enrich the canonical refugee cases and seed the campaigns from the source files, (2) build the Issue landing that weaves them, (3) add the global / NJP / OHCHR framing, (4) wire one or two Empathy Ledger stories into a refugee Issue, (5) the auto-brief. The schema and the screens to support most of this already exist.
