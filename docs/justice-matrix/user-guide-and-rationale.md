# Justice Matrix - User Guide and Rationale

**Last updated:** 2026-05-30
**Audience:** practitioners, advocates, editors, partner organisations, and future product builders.
**Source material:** `Justice_Matrix_Background_Paper 1.docx`, `Strategic_refugee_asylum_cases___matrix.xlsx`, `Advocacy_campaigns_for_refugees_asylum_seekers___matrix.xlsx`, plus the live JusticeHub implementation.

---

## 1. Why the Justice Matrix exists

The Justice Matrix was developed to solve a practical problem in strategic litigation and advocacy: important victories, pleadings, campaign tactics, and comparative-law arguments are often trapped in national silos. Lawyers, clinics, NGOs, academics, and campaigners work on related problems across borders, but they often cannot see each other's precedents, strategies, or movement infrastructure quickly enough to coordinate.

The source background paper frames the Matrix as a **Global Strategic Litigation and Advocacy Clearing House** for refugee and asylum protection, with the OHCHR Regional Office for South-East Asia in Bangkok proposed as a regional host. The refugee and asylum use case is the beachhead, but the architecture is designed to support other civil rights and social justice areas over time.

The core reason is simple: make it easier for people defending rights to find what has already been argued, what has already worked, what is being fought now, and who else is working on the same question.

The proposal combines two streams:

- **AI-assisted monitoring:** scheduled searches and adapters for court databases, NGO sites, trusted media, and legal sources.
- **Partner contributions:** structured submissions from law firms, clinics, NGOs, academics, and advocates.

The intended output is a curated, searchable, regularly refreshed matrix of cases, campaigns, and strategy knowledge. It is not legal advice. It is a way to preserve institutional memory, reduce duplication, and support coordinated litigation and advocacy.

---

## 2. What has been built

JusticeHub now has a production Justice Matrix implementation that maps legal cases, advocacy campaigns, and Australian youth-justice evidence through one shared engine.

Live verified state on 2026-05-30:

| Area | Current state |
|---|---:|
| Cases | 354 |
| Campaigns | 67 |
| Discovered source items | 279 |
| Sources | 48 |
| Published issues | 8 |
| Verified cases | 48 |
| Featured cases | 26 |
| Featured campaigns | 16 |

The implementation includes:

- A public hub at `/justice-matrix`.
- A how-it-works and FAQ page at `/justice-matrix/how-it-works`.
- A faceted and semantic explore surface at `/justice-matrix/explore`.
- Case profiles at `/justice-matrix/cases/[id]`.
- Campaign profiles at `/justice-matrix/campaigns/[id]`.
- Issue profiles at `/justice-matrix/issues/[slug]`.
- Contribution flow at `/justice-matrix/contribute`.
- Digest and insight pages for recent additions and corpus patterns.
- Admin workflows for sources, discoveries, health checks, and legal review.
- Scheduled ingestion and enrichment jobs.
- Deterministic source adapters for HUDOC, CJEU/Curia, CourtListener, EDAL, and CanLII.

The newest work added a featured "Start here" rail, Canadian CanLII ingestion, 25 legally reviewed Canadian refugee/asylum cases, issue profiles, and a surface gate so refugee and youth justice issues do not bleed into each other through shared category tags.

---

## 3. The source matrices

The initial refugee and asylum content came from two illustrative source matrices attached to the background paper. They were not intended to be comprehensive. They were seed examples showing what the Matrix should preserve and connect.

### Strategic case seed set

The case matrix gives the legal spine for the refugee and asylum surface:

| Case | Jurisdiction | Strategic point |
|---|---|---|
| R (AAA (Syria) & ors) v SSHD | United Kingdom | Rwanda removals, third-country safety, systemic refoulement risk |
| N.S. v SSHD; M.E. and Others | CJEU / EU | Dublin transfers and systemic deficiencies |
| Hirsi Jamaa and Others v Italy | ECtHR | High-seas pushbacks and extraterritorial non-refoulement |
| M.S.S. v Belgium and Greece | ECtHR | Reception conditions, detention conditions, and effective remedy |
| Innovation Law Lab v Wolf | United States | Remain in Mexico, statutory authority, refoulement risk |
| East Bay Sanctuary Covenant v Biden | United States | Transit ban restrictions and asylum access |
| Sale v Haitian Centers Council | United States | Adverse high-seas interdiction precedent |
| Singh v Minister of Employment and Immigration | Canada | Charter protection and hearing rights for asylum seekers |
| Ruta v Minister of Home Affairs | South Africa | Right to apply for asylum despite delay |
| Lawyers for Human Rights v Minister of Home Affairs | South Africa | Detention safeguards and judicial oversight |
| Ilias and Ahmed v Hungary | ECtHR | Transit-zone confinement and return-risk assessment |
| Plaintiff M70/2011 | Australia | Offshore transfer and safe-third-country designation |

These are useful because they form comparative-law threads, not isolated records. For example, third-country transfer connects M70, AAA/Rwanda, N.S., M.S.S., and Ilias. High-seas pushbacks connect Hirsi and Sale. Detention safeguards connect Lawyers for Human Rights, M.S.S., Ilias, and the Canadian detention cases.

### Advocacy campaign seed set

The campaign matrix gives the movement spine:

| Campaign | Region | Strategic point |
|---|---|---|
| #KidsOffNauru | Australia | Children and families in offshore detention |
| #GameOver | Australia | Indefinite offshore detention and resettlement |
| Refugees Off PNG & Nauru | Australia | Relocation from offshore detention to safety |
| Together With Refugees | United Kingdom | Opposition to Rwanda removals and hostile asylum policy |
| Lift the Ban | United Kingdom | Right to work for asylum seekers |
| Families Belong Together | United States | Family separation, detention, and reunification |
| #WelcomeWithDignity | United States | Restore asylum access and humane reception |
| End Immigration Detention / #WelcomeToCanada | Canada | Ending provincial jail use for immigration detention |
| Withdraw from Safe Third Country Agreement | Canada | Ending or suspending the Canada-US STCA |
| #RefugeesWelcome / #WithRefugees | Pan-European / global | Safe routes and public solidarity |

The product logic is to show that cases and campaigns belong together. The legal win matters, but so does the coalition, the tactic, the public narrative, and the political follow-through.

---

## 4. Product model

The Matrix has three main public objects:

1. **Cases:** legal decisions, strategic litigation, inquiries, and related source-backed legal records.
2. **Campaigns:** advocacy efforts, coalitions, public mobilisation, and campaign outcomes.
3. **Issues:** curated strategic questions that weave cases and campaigns into a usable playbook.

It also has a fourth evidence lane for Australian youth justice, drawn from consent-gated ALMA evidence and related JusticeHub data.

The most important product idea is the **issue profile**. Instead of asking a user to already know every case name, the Matrix lets them start with a question:

- Can a state send asylum seekers to a third country for processing?
- When does non-refoulement apply at sea or at the border?
- How do campaigners move a government on offshore detention?
- What happened when a jurisdiction raised the age of criminal responsibility?

An issue profile then gathers:

- **The Law:** cases and holdings.
- **The Movement:** campaigns and tactics.
- **The People:** currently a placeholder for lived-experience stories on refugee issues, with stronger youth-justice evidence available.
- **The Playbook:** hand-written strategic guidance distilled from the record.

---

## 5. Public user guide

### Start at the hub

Open `/justice-matrix`.

Use the hub when you want a quick orientation. It shows corpus counts, search entry points, and featured "Start here" rails for the two current surfaces:

- **Refugee & Asylum:** global strategic litigation and advocacy protecting people seeking asylum.
- **Youth Justice:** Australian evidence, cases, and campaigns focused on keeping children out of the justice system.

Use the featured rail when you are new to the corpus. It is curated, not just newest-first.

### Search and filter in Explore

Open `/justice-matrix/explore`.

Use Explore when you already have a term, case, jurisdiction, issue area, or strategy question in mind.

Useful searches:

- `non-refoulement high seas`
- `third country transfer`
- `offshore detention`
- `Rwanda removals`
- `immigration detention`
- `raise the age`
- `detention conditions`

Use the surface selector or URL presets:

- `/justice-matrix/explore?surface=refugee`
- `/justice-matrix/explore?surface=youth`

Use result types to narrow the field:

- Cases when you need precedent.
- Campaigns when you need movement strategy.
- Evidence when you are working in the Australian youth-justice surface.

### Use issue profiles for strategy

Open `/justice-matrix/issues`.

Use Issues when you want the Matrix to organise the corpus for you. Each issue is built around a strategic question and is easier to read than a raw search result list.

Current refugee issues:

- Offshore detention and third-country transfer.
- Non-refoulement on the high seas.
- Immigration detention oversight.
- Access to asylum and transit bans.

Current youth justice issues:

- Raise the age.
- Children in detention inquiries.
- Justice reinvestment and community-led alternatives.
- Deaths in custody recommendations.

On an issue profile, read in this order:

1. The question and summary.
2. The Law column.
3. The Movement column.
4. The playbook.
5. The linked case and campaign profiles for source-level detail.

### Read a case profile

Use a case profile when you need to understand the legal record.

Check:

- Court, jurisdiction, and year.
- Strategic issue.
- Key holding.
- Outcome and precedent strength, where available.
- Authoritative source link.
- Verification status.
- Related cases, campaigns, and evidence.

The Matrix is a research and strategy tool, not a legal-advice tool. Always use the source link before relying on a case.

### Read a campaign profile

Use a campaign profile when you need movement context.

Check:

- Campaign goal or ask.
- Lead organisation or coalition.
- Tactics.
- Outcome or status.
- Link to the campaign source.
- Related issue areas.

Campaigns help answer "what moved people and institutions?", not only "what did the court say?"

### Contribute a source

Open `/justice-matrix/contribute`.

Use the contribution flow for a case, campaign, source, pleading, or related material that should be added to the Matrix. Good submissions include:

- A stable public link.
- A clear title or citation.
- Jurisdiction or country.
- One or two issue categories.
- A short explanation of why the item matters.

Partner contributions are intended to be triaged and normalised before publication.

---

## 6. Editor and admin guide

Admin area: `/admin/justice-matrix`.

### Sources

Use `/admin/justice-matrix/sources` to see configured sources. Sources feed the scanner and cron jobs. JSON API sources are scanned by the scheduled `scan-json` cron. Other sources can be scanned manually.

Key source types include:

- Court databases.
- NGO and advocacy sites.
- Legal databases.
- Media or trusted public-interest sources.

### Discoveries

Use `/admin/justice-matrix/discoveries` to triage machine-discovered items.

The normal flow is:

1. Source scan creates a `justice_matrix_discovered` row.
2. The row is reviewed for quality, duplication, and relevance.
3. Approved rows are promoted into `justice_matrix_cases` or `justice_matrix_campaigns`.
4. Promoted rows remain unverified until human legal review.

### Legal review

Use `/admin/justice-matrix/review`.

Legal review is the dual-control step from the background paper. A reviewer opens the authoritative source, confirms the citation and key facts, then signs off. Sign-off sets:

- `human_confirmed=true`
- `verified=true`
- `verified_by`
- `verified_at`

Do not bulk-verify future source rows by script. The trust signal is meaningful only if a human reviewer checks the source of record.

### Health

Use `/admin/justice-matrix/health` for corpus health and operational checks.

Pay attention to:

- Unlinked discoveries.
- Missing authoritative links.
- Missing region, outcome, or category fields.
- Low-confidence extraction.
- Source scan health.
- Items awaiting review.

### Featured rows

Featured cases and campaigns power the public "Start here" rails. Feature only records that are high-signal, understandable to a new user, and representative of the surface.

The refugee rail should prioritise canonical cases and campaigns from the source matrices. The youth rail should prioritise high-signal Australian evidence, cases, and campaigns.

---

## 7. Data and governance rules

### Verification

`verified` is a trust badge. It means a human reviewer has checked the source of record. Automated ingestion should not set it.

### Provenance

Scanned cases currently use `source='ai_scraped'` after promotion. To recover the real source, join through `justice_matrix_discovered.source_id -> justice_matrix_sources` using `approved_case_id`.

### Privacy

The background paper requires no personally identifiable information without consent unless already public. JusticeHub's youth evidence lane uses consent-gated ALMA evidence. Refugee lived-experience stories should not be added until there is a suitable source and consent model.

### Legal advice boundary

The Matrix can help users find strategy, precedent, and public advocacy material. It must not present itself as giving legal advice.

### Coverage gaps

Coverage gaps should be visible, not hidden. Current gaps include:

- Refugee lived-experience stories.
- Deeper strategic analysis on freshly ingested CanLII rows.
- More South-East Asia-specific source coverage.
- Exportable regional briefs.
- Fuller AI synthesis for "Ask the Matrix" in environments where a chat provider key is configured.

---

## 8. How the pipeline works

The machine pipeline:

```text
justice_matrix_sources
  -> scan-json / scan-html / manual scanner
  -> deterministic adapters
  -> justice_matrix_discovered
  -> auto-publish
  -> justice_matrix_cases / justice_matrix_campaigns
  -> embed-new
  -> backfill-facts
```

The human curation pipeline:

```text
source scan
  -> discovery review
  -> approve or reject
  -> promote
  -> legal review
  -> verified public trust signal
  -> featured / issue curation
```

Cron and script entry points:

```bash
npx tsx scripts/scan-justice-matrix.ts --source "CanLII" --limit 25
npx tsx scripts/scan-justice-matrix.ts --source "CanLII" --limit 25 --apply
node scripts/justice-matrix-auto-publish.mjs --apply --limit 30
```

CanLII requires `CANLII_API_KEY` as a query parameter. The current key should be reissued because it was pasted in plaintext in chat.

---

## 9. What changed in the latest work

The latest Justice Matrix work shipped:

1. **Featured "Start here" rail:** curated refugee and youth entry points on the hub.
2. **CanLII adapter:** Canadian refugee and asylum jurisprudence from the CanLII API.
3. **25 Canadian cases:** staged, promoted, tagged, and human-reviewed.
4. **Security cleanup:** removed committed service-role keys and added a secret-scan guard.
5. **Issue Profiles:** the strategy layer that weaves law, movement, people, and playbook.
6. **Surface gate:** prevents shared categories from mixing refugee and youth issue results.
7. **Review queue UX fix:** filtered empty states now say when no row matches the filter rather than implying the whole queue is empty.
8. **Ask the Matrix first pass:** `/justice-matrix/ask` retrieves cases, campaigns, and evidence for a plain-language question, returns cited records, and synthesizes when an AI provider key is available.
9. **How it works and FAQ:** `/justice-matrix/how-it-works` explains the operating model, surfaces, trust rules, and common questions before users rely on Ask or issue profiles.

---

## 10. Recommended walkthrough for a demo

Use this sequence when showing the Matrix to a partner, funder, or new team member.

1. Open `/justice-matrix`.
2. Point out the two surfaces: Refugee & Asylum and Youth Justice.
3. Open `/justice-matrix/how-it-works` and explain the source-to-review-to-strategy loop.
4. Open `/justice-matrix/ask` and ask about offshore detention and third-country transfer.
5. Point out the cited records and the legal-advice boundary.
6. Open `/justice-matrix/issues`.
7. Choose `offshore-detention-third-country-transfer`.
8. Show how the issue gathers cases and campaigns into one strategic question.
9. Open a case profile, such as Plaintiff M70 or AAA/Rwanda.
10. Show the authoritative source link and verification status.
11. Open a campaign profile, such as #KidsOffNauru or Together With Refugees.
12. Search Explore for `non-refoulement high seas`.
13. Explain the next layer: exportable State-of-Protection briefs.

The point of the demo is not "we built a database." The point is that a lawyer, campaigner, clinic, or OHCHR officer can move from a strategic question to precedent, campaigns, and a playbook in minutes.

---

## 11. Next build priorities

1. **Reissue the CanLII key.** Replace `.env.local` and Vercel env values, then run a dry CanLII scan.
2. **People column.** Add or partner for refugee lived-experience stories with a consent model, or scope the people lane to youth issues where ALMA evidence is already strong.
3. **Deepen Ask the Matrix.** Add issue-aware retrieval, persistent chat history, and stricter citation coverage tests.
4. **State-of-Protection brief and export.** Generate a regional brief with coverage, precedent movement, campaign activity, and gaps. Export to PDF, CSV, and JSON.
5. **Deepen CanLII case quality.** Enrich strategic issue, key holding, outcome, and precedent strength for the new Canadian cases.
6. **Expand source coverage.** Add more South-East Asia sources and more issue profiles.

---

## 12. Source references

Primary source files:

- `/Users/benknight/Downloads/Justice_Matrix_Background_Paper 1.docx`
- `/Users/benknight/Downloads/Strategic_refugee_asylum_cases___matrix.xlsx`
- `/Users/benknight/Downloads/Advocacy_campaigns_for_refugees_asylum_seekers___matrix.xlsx`

Implementation references:

- `docs/justice-matrix/HANDOFF.md`
- `docs/justice-matrix/vision-ux-and-health.md`
- `docs/justice-matrix/historical-alignment.md`
- `src/app/justice-matrix/page.tsx`
- `src/app/justice-matrix/explore/page.tsx`
- `src/app/justice-matrix/issues/page.tsx`
- `src/app/justice-matrix/issues/[slug]/page.tsx`
- `src/app/admin/justice-matrix/*`
- `src/lib/justice-matrix/surfaces.ts`
- `src/lib/justice-matrix/canlii-adapter.ts`
