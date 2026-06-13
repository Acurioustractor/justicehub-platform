# Justice Matrix: Refugee & Youth Content Expansion (Proposal)

Date: 2026-06-13
Status: REVIEW-READY PROPOSAL. Nothing here writes to the database on its own.
Author surface: editorial framing over REAL records. No case, campaign, holding, or
citation is invented anywhere in this document.

## What this is

A proposal to widen the issue layer of the Justice Matrix and to point the scanner
at the feeds most likely to return the records those issues need. It has three parts:

1. New issue seed rows for `justice_matrix_issues` (proposal + a ready-to-review SQL
   `INSERT` block that MUST NOT be run without human approval).
2. Curated-answer outlines for the top questions, written so they reference only the
   record TYPES and categories that already exist in the corpus.
3. A source-discovery priority list mapping each content gap to the real feeds and
   named authorities the scanner should prioritise, so REAL records flow through the
   existing review queue at `/admin/justice-matrix/discoveries`.

## Hard rules this document follows

- No fabricated case names, campaign names, holdings, outcomes, citations, or links.
- Issues are editorial framing over REAL records. The framing copy names patterns and
  questions, never a specific holding the corpus does not carry.
- Every `category_tags` value is drawn from the LIVE category census (the state brief)
  or from tags already present on the 8 published issues. Where a tag could not be
  confirmed, it was omitted rather than guessed.
- `is_published` is `false` on every proposed row. New issues stay dark until a human
  reviews the records they gather and turns them on.
- The not-legal-advice boundary holds on every surface this feeds.

### Live category vocabulary used here (from the corpus census)

Census categories (verified counts in the state brief):
`asylum, refugee, non-refoulement, article-3, immigration, immigration-detention,
youth-justice, indigenous-rights, deaths-in-custody, justice-reinvestment,
raise-the-age, diversion, age-of-responsibility`.

Curated framing tags already present on the 8 published issues (so they are known to
exist as `category_tags` and to match real records via the `overlaps` query):
`third-country-transfers, offshore-processing, offshore-detention, dublin-transfers,
pushbacks, extraterritorial-jurisdiction, detention-conditions, judicial-oversight,
jail-use, transit-zones, asylum-access, border-restrictions, asylum-eligibility,
executive-authority, age-of-responsibility, don-dale, banksia-hill, detention-abuse,
adult-prison, community-led, death-in-custody, rciadic`.

Every proposed `category_tags` array below is built only from those two lists.

## Existing issues (do not duplicate)

Eight rows are already published. New slugs below are checked against these:

Refugee surface: `offshore-detention-third-country-transfer`, `non-refoulement-high-seas`,
`immigration-detention-oversight`, `access-to-asylum-transit-bans`.

Youth surface: `raise-the-age`, `children-in-detention-inquiries`,
`justice-reinvestment-community-led`, `deaths-in-custody-recommendations`.

The `sort_order` values below start at 9 so they sit after the published set.

---

## Part 1: New issue seed rows (proposal)

Schema (verified against `supabase/migrations/20260530000001_justice_matrix_issues.sql`
and `20260530000002_justice_matrix_issues_surface.sql`):

`justice_matrix_issues(id, slug, title, question, summary, category_tags text[],
hero_case_ids uuid[], playbook text, surface text, sort_order int,
is_published boolean, created_at, updated_at)`.

Notes for the reviewer:

- `hero_case_ids` is intentionally empty (`'{}'`) on every proposed row. Hero cases
  must be chosen by a human from real records after the issue's records are reviewed.
  An empty array degrades gracefully: the issue page just shows the strength-ranked
  list with no pinned case.
- The page joins records by `categories` overlap, then applies the surface gate
  (`refugee` issues show refugee/asylum items; `youth` issues show the rest). So an
  issue only ever displays REAL records that already carry one of its tags. If a tag
  has no matching records yet, the issue shows an empty section, which is honest, not
  fabricated. Part 3 is how those records get populated.
- `playbook` copy names PATTERNS and QUESTIONS. It does not assert a specific case
  outcome. The published issues do name cases in their playbooks because those cases
  are seeded and verified; these new playbooks deliberately stay at the pattern level
  until the records land, so nothing is claimed ahead of the corpus.

### Proposed refugee-surface issues

1. `family-unity-and-the-right-to-family-life`
   Question: When does removing or detaining a parent break the family, and what does
   the law do about it?
   Why: Article 8 and family-unity arguments run through a large share of the asylum
   and immigration-detention corpus, but no issue gathers them. Tags overlap the
   `immigration` and `detention-conditions` records already present.

2. `vulnerability-and-special-procedural-protection`
   Question: How does the law treat asylum seekers who are children, survivors of
   torture, or otherwise at heightened risk?
   Why: A recurring thread across `article-3` and `asylum` records. Frames the
   procedural-protection pattern without asserting any single holding.

3. `country-of-origin-evidence-and-real-risk`
   Question: How do courts decide whether returning someone is a real risk, and what
   evidence carries that finding?
   Why: The country-conditions record is the lever named across several published
   playbooks (M.S.S., AAA (Rwanda)). This issue gathers the `non-refoulement` and
   `article-3` records around that evidentiary pattern.

4. `asylum-access-at-the-border`
   Question: What stops a state turning people away before they can lodge a claim?
   Why: Complements the published `access-to-asylum-transit-bans` issue by gathering
   the `asylum-access` and `border-restrictions` records under a plainer entry
   question. Reviewer: confirm this does not over-overlap the existing transit-bans
   issue before publishing; if it does, merge rather than duplicate.

### Proposed youth-surface issues

5. `watch-houses-and-holding-children-in-adult-cells`
   Question: Why are children still held in police watch houses and adult cells, and
   what has been found about it?
   Why: The `adult-prison` and `detention-conditions` tags already carry records; this
   gives the watch-house pattern its own entry separate from the broader inquiries
   issue.

6. `diversion-and-keeping-children-out-of-court`
   Question: What diverts a child away from the justice system before a charge sticks,
   and where does the evidence sit?
   Why: `diversion` is a live census category with real records and a large ALMA
   evidence base under the youth scope. No issue currently fronts it.

7. `bail-remand-and-children-held-before-trial`
   Question: How many children are locked up before any finding of guilt, and what
   drives it?
   Why: Remand is one of the most evidence-rich youth-justice gaps in the ALMA set.
   Tagged conservatively to `youth-justice` and `detention-conditions` so it gathers
   real records and the evidence lane (scope-only youth surface keeps evidence in).

8. `policing-of-first-nations-young-people`
   Question: How does contact with police shape the path of First Nations children
   into the justice system?
   Why: Ties `indigenous-rights` and `youth-justice` records together. Frames the
   over-representation pattern named in Pathways to Justice without asserting a finding.

9. `cost-of-detention-and-the-case-for-reinvestment`
   Question: What does locking up a child actually cost, and what could that money do
   instead?
   Why: The cost-benefit argument (named via Maranguka/KPMG in the published
   reinvestment issue) deserves its own evidence-forward entry. Tags overlap
   `justice-reinvestment` and `youth-justice` records plus the ALMA evidence base.

10. `after-detention-what-happens-next`
    Question: What happens to a young person after release, and what reduces their
    return to custody?
    Why: Post-release and recidivism evidence is well represented in ALMA but has no
    front door. Conservative tagging keeps it to `youth-justice` and `diversion`.

### READY-TO-REVIEW SQL: DO NOT RUN WITHOUT HUMAN APPROVAL

> WARNING. This block is a PROPOSAL for human review. It MUST NOT be executed against
> the live project (`tednluwflfhxyucgwigh`) or any database without explicit human
> approval. It is written with `is_published = false` and `ON CONFLICT (slug) DO
> NOTHING` so a careless run is recoverable, but it is still a database write and is
> out of scope for any automated, AFK, or cron context. A human runs this, after
> reviewing that the gathered records are real, or it does not run at all.

```sql
-- PROPOSAL ONLY. Requires human approval before execution.
-- Adds 10 dark (is_published = false) issues. hero_case_ids left empty; a human
-- pins hero cases after reviewing the real records each issue gathers.
-- Mirrors the column shape of justice_matrix_issues exactly. Re-runnable.
INSERT INTO justice_matrix_issues
  (slug, title, question, summary, surface, category_tags, hero_case_ids, sort_order, is_published, playbook)
VALUES
-- ---- Refugee surface ----
(
 'family-unity-and-the-right-to-family-life',
 'Family unity and the right to family life',
 'When does removing or detaining a parent break the family, and what does the law do about it?',
 'How courts weigh family unity against removal and detention powers, gathered from the real cases that already carry these tags.',
 'refugee',
 ARRAY['immigration','detention-conditions','non-refoulement'],
 '{}'::uuid[],
 9,
 false,
 $pb$**The pattern.** Family-life arguments recur where removal or detention separates a parent from a child. This issue gathers the real records that already carry these tags so the pattern can be read in one place.

**Read the source before relying on it.** Each gathered record links to its own authority. This issue frames the question; it does not state the outcome of any case for you.

**What to look for.** Whether the court weighed the best interests of the child, whether less restrictive alternatives to detention were considered, and how the family-unity claim was paired with other grounds.

This is a research resource, not legal advice. Read the linked source before acting on it.$pb$
),
(
 'vulnerability-and-special-procedural-protection',
 'Vulnerability and special procedural protection',
 'How does the law treat asylum seekers who are children, survivors of torture, or otherwise at heightened risk?',
 'The procedural-protection thread that runs through the asylum and Article 3 records, gathered as one issue.',
 'refugee',
 ARRAY['asylum','article-3','non-refoulement'],
 '{}'::uuid[],
 10,
 false,
 $pb$**The pattern.** Heightened-risk applicants (children, survivors of torture, the seriously ill) attract extra procedural protection. This issue gathers the real records carrying these tags.

**What to look for.** Whether an individual vulnerability assessment was made, whether that assessment changed the procedure, and how the protection claim connected to the non-refoulement question.

This is a research resource, not legal advice. Read the linked source before acting on it.$pb$
),
(
 'country-of-origin-evidence-and-real-risk',
 'Country-of-origin evidence and real risk',
 'How do courts decide whether returning someone is a real risk, and what evidence carries that finding?',
 'The country-conditions evidence pattern behind real-risk findings, gathered from the records that already carry these tags.',
 'refugee',
 ARRAY['non-refoulement','article-3','asylum'],
 '{}'::uuid[],
 11,
 false,
 $pb$**The pattern.** Real-risk findings live in the country-conditions record. This issue gathers the real cases tagged to non-refoulement and Article 3 so the evidentiary pattern can be studied.

**What to look for.** What evidence the court accepted on conditions in the receiving state, who carried the burden, and how the risk was assessed at the time of removal.

This is a research resource, not legal advice. Read the linked source before acting on it.$pb$
),
(
 'asylum-access-at-the-border',
 'Asylum access at the border',
 'What stops a state turning people away before they can lodge a claim?',
 'Records on the right to lodge an asylum claim at the border, gathered alongside the transit-bans issue.',
 'refugee',
 ARRAY['asylum-access','border-restrictions','asylum'],
 '{}'::uuid[],
 12,
 false,
 $pb$**The pattern.** The right to *apply* for asylum can survive border measures that try to switch it off. This issue gathers the real records tagged to asylum access and border restrictions.

**Reviewer note.** Check the overlap with the published transit-bans issue before publishing. If the gathered records are largely the same, merge rather than run two doors onto one set.

This is a research resource, not legal advice. Read the linked source before acting on it.$pb$
),
-- ---- Youth surface ----
(
 'watch-houses-and-holding-children-in-adult-cells',
 'Watch houses and holding children in adult cells',
 'Why are children still held in police watch houses and adult cells, and what has been found about it?',
 'Inquiry findings and conditions records on children held in watch houses and adult facilities.',
 'youth',
 ARRAY['adult-prison','detention-conditions','youth-justice'],
 '{}'::uuid[],
 13,
 false,
 $pb$**The pattern.** Children continue to be held in police watch houses and adult cells despite repeated findings. This issue gathers the real conditions and inquiry records carrying these tags.

**What to look for.** Which facility, what the inspectorate or inquiry found, and whether a closure or enforcement demand followed.

This is a research resource, not legal advice. Read the linked source before acting on it.$pb$
),
(
 'diversion-and-keeping-children-out-of-court',
 'Diversion and keeping children out of court',
 'What diverts a child away from the justice system before a charge sticks, and where does the evidence sit?',
 'The evidence and records on pre-court diversion for children in Australia.',
 'youth',
 ARRAY['diversion','youth-justice'],
 '{}'::uuid[],
 14,
 false,
 $pb$**The pattern.** Diversion keeps a child out of court before a charge takes hold. This issue gathers the real records and the Australian evidence base tagged to diversion and youth justice.

**What to look for.** Which diversion model, who held it, and what the independent evaluation measured.

This is a research resource, not legal advice. Read the linked source before acting on it.$pb$
),
(
 'bail-remand-and-children-held-before-trial',
 'Bail, remand, and children held before trial',
 'How many children are locked up before any finding of guilt, and what drives it?',
 'Records and evidence on the remand of children before trial in Australia.',
 'youth',
 ARRAY['youth-justice','detention-conditions'],
 '{}'::uuid[],
 15,
 false,
 $pb$**The pattern.** A large share of children in detention are on remand, held before any finding of guilt. This issue gathers the real records and Australian evidence tagged to youth justice.

**What to look for.** What drives the remand numbers, which bail conditions recur, and what the evidence says reduces pre-trial detention.

This is a research resource, not legal advice. Read the linked source before acting on it.$pb$
),
(
 'policing-of-first-nations-young-people',
 'Policing of First Nations young people',
 'How does contact with police shape the path of First Nations children into the justice system?',
 'Records on policing contact and over-representation for First Nations children.',
 'youth',
 ARRAY['indigenous-rights','youth-justice'],
 '{}'::uuid[],
 16,
 false,
 $pb$**The pattern.** Early and repeated police contact shapes the path of First Nations children into the system. This issue gathers the real records tagged to Indigenous rights and youth justice.

**What to look for.** Where the contact starts, what the inquiries name as driving over-representation, and which community-led responses were tested.

This is a research resource, not legal advice. Read the linked source before acting on it.$pb$
),
(
 'cost-of-detention-and-the-case-for-reinvestment',
 'The cost of detention and the case for reinvestment',
 'What does locking up a child actually cost, and what could that money do instead?',
 'The cost evidence behind youth detention and the reinvestment alternatives.',
 'youth',
 ARRAY['justice-reinvestment','youth-justice'],
 '{}'::uuid[],
 17,
 false,
 $pb$**The pattern.** The cost of detaining a child is the lever behind the reinvestment case. This issue gathers the real records and Australian evidence tagged to justice reinvestment and youth justice.

**What to look for.** The independent cost figure, what the alternative model funded, and who governed the money.

This is a research resource, not legal advice. Read the linked source before acting on it.$pb$
),
(
 'after-detention-what-happens-next',
 'After detention, what happens next',
 'What happens to a young person after release, and what reduces their return to custody?',
 'Post-release and recidivism evidence for young people leaving detention in Australia.',
 'youth',
 ARRAY['youth-justice','diversion'],
 '{}'::uuid[],
 18,
 false,
 $pb$**The pattern.** Release is not the end of the path. This issue gathers the real records and Australian evidence on what reduces a young person's return to custody.

**What to look for.** What post-release support was tested, who delivered it, and what the evaluation measured.

This is a research resource, not legal advice. Read the linked source before acting on it.$pb$
)
ON CONFLICT (slug) DO NOTHING;
```

### After the INSERT (human steps, in order)

1. Open each new issue in preview (it is dark, so view it via the admin or a direct
   query, not the public index).
2. Confirm the gathered records are REAL and on-point. If a section is empty, the
   tag has no records yet. Run Part 3 first, review the new records through the queue,
   then return.
3. Pin one or two hero cases from the real gathered records (`hero_case_ids`).
4. Flip `is_published = true` per row, only when the records justify it.

---

## Part 2: Curated-answer outlines

These are outlines for the `/ask` curated-answer layer (the deferred content step in
the build spec). Each one names only record TYPES and categories that exist. None
states a holding. Every outline ends on the boundary line. A curated answer, when
authored, must cite REAL records pulled from the live corpus, not the placeholders
described here.

Format for each: the question, the record types the corpus can ground it with, the
shape of a safe answer, and the limit to state plainly.

### Refugee surface

**Q: Can a government send asylum seekers to a third country for processing?**
- Grounds with: CASE records tagged `third-country-transfers` / `offshore-processing`
  and the published issue `offshore-detention-third-country-transfer`.
- Answer shape: name the records the corpus carries, point to the issue page, let the
  reader read each holding at source.
- Limit to state: the corpus is a sample of strategic cases, not a complete survey of
  every jurisdiction.
- Boundary: research resource, not legal advice; read the source before acting.

**Q: Does the duty not to return people to danger apply at sea?**
- Grounds with: CASE records tagged `pushbacks` / `extraterritorial-jurisdiction` and
  the published issue `non-refoulement-high-seas`.
- Answer shape: surface the split the issue already frames, cite the real records,
  send the reader to the source for the reasoning.
- Limit: extraterritorial reach turns on the facts of control; the answer cannot
  generalise beyond the gathered records.
- Boundary line included.

**Q: How do courts decide a return is a real risk?**
- Grounds with: CASE records tagged `non-refoulement` / `article-3`; proposed issue
  `country-of-origin-evidence-and-real-risk`.
- Answer shape: describe the evidentiary pattern (country-conditions record), cite the
  real cases, do not state any single outcome as the rule.
- Limit: real-risk findings are fact-specific; the corpus shows the pattern, not a
  formula.
- Boundary line included.

**Q: What protection do child or vulnerable asylum seekers get in the process?**
- Grounds with: CASE records tagged `asylum` / `article-3`; proposed issue
  `vulnerability-and-special-procedural-protection`.
- Answer shape: name the procedural-protection thread, cite real records, defer the
  detail to source.
- Limit: protection turns on the procedure of each jurisdiction; the answer gathers
  records, it does not advise.
- Boundary line included.

### Youth surface

**Q: How young is too young to be charged in Australia?**
- Grounds with: CASE records tagged `raise-the-age` / `age-of-responsibility`,
  CAMPAIGN records, ALMA EVIDENCE under the youth scope, and the published issue
  `raise-the-age`.
- Answer shape: state the question and the jurisdictional split the issue already
  frames, cite the real records and the evidence, note movement can reverse.
- Limit: the minimum age differs by jurisdiction and has changed in both directions;
  cite the records, do not state a single national age as settled.
- Boundary line included.

**Q: What works instead of youth detention?**
- Grounds with: CASE/CAMPAIGN records tagged `justice-reinvestment` / `diversion` /
  `community-led`, the ALMA EVIDENCE base, and the published issue
  `justice-reinvestment-community-led`.
- Answer shape: name the model types the evidence covers, cite the independent
  evaluations the corpus carries, point to the issue.
- Limit: evidence is place-specific; a result in one community is not a guarantee
  elsewhere.
- Boundary line included.

**Q: What have the inquiries found about children in detention?**
- Grounds with: CASE/inquiry records tagged `detention-conditions` / `adult-prison` /
  `don-dale` / `banksia-hill` / `detention-abuse`, and the published issue
  `children-in-detention-inquiries`.
- Answer shape: gather the inquiry records by facility, cite each, send the reader to
  the source for findings.
- Limit: findings are not implementation; the corpus shows what was found, not what
  changed.
- Boundary line included.

**Q: Why do First Nations people keep dying in custody?**
- Grounds with: records tagged `deaths-in-custody` / `death-in-custody` / `rciadic`
  and the published issue `deaths-in-custody-recommendations`.
- Answer shape: name the recommendations-versus-implementation gap the issue frames,
  cite the real records, keep the count factual to source.
- Limit: the corpus gathers records on the recommendations and the gap; it is not a
  register of deaths.
- Boundary line included.

**Q: How many children are locked up before trial?**
- Grounds with: ALMA EVIDENCE and records tagged `youth-justice` /
  `detention-conditions`; proposed issue `bail-remand-and-children-held-before-trial`.
- Answer shape: cite the real evidence on remand, name the drivers the evidence
  identifies, state the figure only to source.
- Limit: numbers move and lag; cite the dated source, do not present a stale figure as
  current.
- Boundary line included.

---

## Part 3: Source-discovery priority list

Goal: point the scanner at the feeds most likely to return REAL records for each
content gap above, so they flow through the existing review queue
(`/admin/justice-matrix/discoveries` then `/admin/justice-matrix/review`). No record
is auto-published. Everything below feeds the human queue.

Feeds and adapters that actually exist (verified in `scripts/scan-justice-matrix.ts`
and the `*-adapter.ts` files):

- JSON-API adapters (structured, no LLM): CJEU (`curia.europa.eu`),
  HUDOC (`hudoc.echr.coe.int`), CourtListener (`courtlistener.com`),
  EDAL (`asylumlawdatabase.eu`), CanLII (`canlii.org`).
- HTML / Playwright sources in the feed list: AustLII, BAILII, UNHCR Refworld, and the
  advocacy-org and court-database rows seeded in
  `supabase/migrations/20260123000002_justice_matrix_sources.sql`.
- Named authorities for reader hand-off when the corpus lacks a record: HUDOC, AustLII,
  Refworld, EDAL. These are pointed at by name; never fabricate a deep link.

### Refugee gaps -> prioritise

| Content gap | Real categories | Prioritise these feeds | Why |
|---|---|---|---|
| Family unity / family life | `immigration`, `detention-conditions` | HUDOC, EDAL, BAILII | Article 8 family-life jurisprudence concentrates in the European bodies and UK courts these feeds cover. |
| Vulnerability / special protection | `asylum`, `article-3` | HUDOC, EDAL, Refworld | EDAL indexes the procedural-protection line; Refworld carries the UNHCR guidance behind it. |
| Country-of-origin evidence / real risk | `non-refoulement`, `article-3` | HUDOC, Refworld, CourtListener | Real-risk findings sit in ECtHR and US records; Refworld supplies the country-conditions context. |
| Asylum access at the border | `asylum-access`, `border-restrictions` | CourtListener, EDAL, Refworld | US administrative-law records and European access cases dominate this gap. |

### Youth gaps -> prioritise

| Content gap | Real categories | Prioritise these feeds + authorities | Why |
|---|---|---|---|
| Watch houses / adult cells | `adult-prison`, `detention-conditions` | AustLII; state inspectorate and royal-commission reports | The records are Australian inquiry and conditions material indexed via AustLII and the advocacy-org feeds. |
| Diversion | `diversion`, `youth-justice` | AustLII; Australian evidence sources feeding `alma_evidence` | Diversion evidence is Australian; the ALMA evidence pipeline is the main lane. |
| Bail / remand | `youth-justice`, `detention-conditions` | AustLII; Australian evidence sources | Remand data and evaluations are Australian, evidence-heavy. |
| Policing of First Nations young people | `indigenous-rights`, `youth-justice` | AustLII; Change the Record and related advocacy feeds | Over-representation records are Australian reports and case law. |
| Cost of detention / reinvestment | `justice-reinvestment`, `youth-justice` | Australian evidence sources; AustLII | Cost-benefit and reinvestment evaluations sit in the ALMA evidence lane. |
| After detention / recidivism | `youth-justice`, `diversion` | Australian evidence sources | Post-release evidence is Australian and evaluation-based. |

### Scanner operating notes

- Run the scanner against the prioritised sources, review every discovered item in the
  queue, and only then approve into `justice_matrix_cases` / `_campaigns` /
  `alma_evidence`. The approve path canonicalises categories
  (`canonicaliseCategories`), so newly approved records pick up the tags the proposed
  issues join on.
- The 33 NULL-embedding cases noted in the state brief should be backfilled (the
  separate dry-run backfill script) so newly relevant records are reachable by the
  `/ask` semantic retrieval that these issues feed into.
- Consent gate stays law on every `alma_evidence` record that enters the queue. A
  Community Controlled row exposes title and provenance only.
- This whole part is read-and-queue. The only writes are human approvals through the
  existing review UI, one record at a time.

---

## Provenance and boundaries

- Schema verified against `supabase/migrations/20260530000001_justice_matrix_issues.sql`,
  `20260530000002_justice_matrix_issues_surface.sql`, and the select lists in
  `src/app/justice-matrix/issues/page.tsx` and `issues/[slug]/page.tsx`.
- Category vocabulary verified against the state brief census and the tags on the 8
  published issues. No tag here is guessed.
- Feeds verified against `scripts/scan-justice-matrix.ts` and the `*-adapter.ts` files.
- No case, campaign, holding, outcome, citation, or link is invented in this document.
- Every surface this feeds keeps the boundary: this is a research resource, not legal
  advice. Read the linked source before acting on it.
