# Civic Scope South Australia Research Playbook

Purpose: find every defensible youth justice organisation in Adelaide and South Australia, connect those organisations to justice spending, then connect spending to politicians, promises, oversight recommendations, and public statements.

This playbook is for JusticeHub / Civic Scope operators. It assumes the live Supabase database is configured through `.env.local`.

## Outcome

Build an evidence-backed SA brief with four ledgers:

1. Frontline organisations: confirmed and candidate youth justice organisations in Adelaide and SA.
2. Money: ROGS spend, SA budget rows, grants, contracts, program allocations, and top recipients.
3. Accountability: ministers, portfolios, Hansard, charter commitments, oversight recommendations, and status.
4. Gaps: missing sources, unconfirmed organisations, missing ABNs, missing funding links, and weak evidence.

Do not present candidate organisations as confirmed Tier 1 until source-reviewed and confirmed in `/admin/civic/tier-1-curation`.

## Best Chat Prompt

Use this in ALMA chat when you want the agent to query the database through tools:

```text
Build a South Australia youth justice civic brief for Adelaide.

Use tools before answering. First find SA and Adelaide youth justice organisations and separate confirmed Tier 1 organisations from candidates. Include Aboriginal community controlled and Indigenous-led organisations, legal services, bail/diversion, family support, drug and alcohol, post-release, accommodation, advocacy, and detention-adjacent services.

Then cross-reference those organisations against justice_funding, ROGS youth justice spending, government programs, and GrantScope/entity relationships where ABNs or entity links exist.

Then identify politicians and accountability signals: SA ministers and departments, Hansard or statements mentioning youth justice/detention/diversion/bail/Aboriginal young people, oversight recommendations, budget promises, and whether money followed those commitments.

Return:
- confirmed facts
- candidate leads needing source review
- top funding recipients and programs
- politician/promise/oversight links
- missing database fields or sources to ingest next
- exact JusticeHub admin pages or scripts I should run next
```

## Database Tables

Core organisation tables:

- `organizations`: JusticeHub organisation records, including `state`, `city`, `abn`, `website`, `is_indigenous_org`, `acco_certified`, `gs_entity_id`.
- `civic_org_classifications`: Tier 1 / sector classification proposals and confirmations.
- `alma_interventions`: youth justice programs/interventions, including `geography`, `operating_organization`, `evidence_level`, `cost_per_young_person`.
- `acnc_charities` and `acnc_ais`: charity identity and financial data by ABN.

Core money tables:

- `justice_funding`: grants, contracts, funding allocations, recipient ABNs, state, source, program, amount.
- `rogs_justice_spending`: Productivity Commission ROGS youth justice spend and cohort data.
- `alma_government_programs`: announced government youth justice programs and budgets.
- `austender_contracts`: supplier contract data, matchable by ABN.
- `gs_entities` and `gs_relationships`: GrantScope entity graph where `organizations.gs_entity_id` is linked.

Core civic/accountability tables:

- `civic_hansard`
- `civic_ministerial_statements`
- `civic_charter_commitments`
- `oversight_recommendations`
- `children_commissioner_reports`
- `auditor_general_audits`
- `civic_consultancy_spending`
- `civic_rti_disclosures`

## Query Sequence

### 1. Confirm current SA coverage

Run:

```bash
node scripts/civic/report-adelaide-launch-action-queue.mjs
node scripts/civic/report-civic-data-backlog.mjs
```

Use these reports to identify launch-critical data gaps before researching new sources.

### 2. Generate SA organisation candidates

Dry-run first:

```bash
node scripts/civic/propose-sa-tier1-curation-candidates.mjs
```

If the generated candidates are defensible, apply unconfirmed proposals:

```bash
node scripts/civic/propose-sa-tier1-curation-candidates.mjs --apply --yes-production
```

Then review and confirm in `/admin/civic/tier-1-curation`.

### 3. Ask the database for confirmed SA Tier 1 organisations

Use this shape in Supabase SQL editor or translate it to a service-client query:

```sql
select
  o.id,
  o.name,
  o.slug,
  o.abn,
  o.city,
  o.state,
  o.website,
  o.is_indigenous_org,
  o.acco_certified,
  c.sector_category,
  c.confirmed_at
from organizations o
join civic_org_classifications c on c.organization_id = o.id
where o.state = 'SA'
  and o.is_active = true
  and coalesce(o.archived, false) = false
  and c.tier = 1
  and c.confirmed_at is not null
order by o.name;
```

### 4. Find SA candidates that still need review

```sql
select
  o.id,
  o.name,
  o.abn,
  o.city,
  o.website,
  o.description,
  o.is_indigenous_org,
  o.acco_certified,
  c.llm_proposed_tier,
  c.llm_confidence,
  c.sector_category,
  c.confirmed_at
from organizations o
left join civic_org_classifications c on c.organization_id = o.id
where o.state = 'SA'
  and o.is_active = true
  and coalesce(o.archived, false) = false
  and (
    c.llm_proposed_tier = 1
    or o.is_indigenous_org = true
    or o.acco_certified = true
    or o.name ilike any (array[
      '%youth%', '%young%', '%children%', '%family%',
      '%justice%', '%legal%', '%bail%', '%detention%',
      '%diversion%', '%aboriginal%', '%nunga%'
    ])
    or o.description ilike any (array[
      '%youth justice%', '%young people%', '%bail%',
      '%diversion%', '%detention%', '%court%',
      '%aboriginal%', '%first nations%'
    ])
  )
  and (c.confirmed_at is null or c.organization_id is null)
order by o.acco_certified desc, o.is_indigenous_org desc, o.name;
```

### 5. Cross-reference organisations to funding

Start broad:

```sql
select
  recipient_name,
  recipient_abn,
  source,
  financial_year,
  program_name,
  sector,
  amount_dollars,
  state,
  project_description,
  alma_organization_id
from justice_funding
where state = 'SA'
  and (
    sector ilike '%justice%'
    or program_name ilike '%youth%'
    or program_name ilike '%justice%'
    or project_description ilike '%youth%'
    or project_description ilike '%justice%'
    or project_description ilike '%detention%'
    or project_description ilike '%diversion%'
    or project_description ilike '%bail%'
  )
order by amount_dollars desc nulls last
limit 200;
```

Then run the API-level views:

```bash
curl 'http://localhost:3004/api/spending/sa'
curl 'http://localhost:3004/api/justice-funding?view=overview&state=SA'
curl 'http://localhost:3004/api/justice-funding?view=organizations&state=SA&q=youth%20justice&limit=100'
curl 'http://localhost:3004/api/justice-funding?view=org_map&state=SA&q=youth%20justice'
```

### 6. Pull ROGS South Australia spending

```sql
select
  financial_year,
  description3,
  sa,
  unit
from rogs_justice_spending
where rogs_section = 'youth_justice'
  and rogs_table = '17A.10'
  and unit = '$''000'
  and description3 in (
    'Detention-based services',
    'Community-based services',
    'Group conferencing',
    'Total expenditure'
  )
order by financial_year, description3;
```

For the current snapshot, use:

```bash
curl 'http://localhost:3004/api/spending/sa'
```

### 7. Import or review SA budget and oversight candidates

Dry-run:

```bash
node scripts/civic/propose-sa-budget-yj-candidates.mjs
node scripts/civic/propose-sa-oversight-source-candidates.mjs
node scripts/civic/propose-sa-oversight-report-rows.mjs --only priority1
node scripts/civic/propose-sa-oversight-recommendation-candidates.mjs
```

Apply only after source review:

```bash
node scripts/civic/propose-sa-budget-yj-candidates.mjs --apply --yes-production
node scripts/civic/propose-sa-oversight-report-rows.mjs --apply --yes-production
node scripts/civic/propose-sa-oversight-recommendation-candidates.mjs --apply --yes-production
```

### 8. Find politicians, statements, promises, and oversight

Use ALMA chat with `search_civic_intelligence`, `query_promise_tracker`, and `query_oversight_recommendations`.

Useful queries:

```text
Search South Australia youth justice detention bail diversion Aboriginal young people minister budget.
Search Adelaide youth justice detention training centre oversight recommendations.
Search SA government youth justice spending promises and whether funding followed.
Search politicians who mentioned youth justice detention diversion bail Aboriginal young people in South Australia.
```

SQL shape:

```sql
select
  jurisdiction,
  sitting_date,
  speaker_name,
  speaker_party,
  subject,
  source_url
from civic_hansard
where jurisdiction in ('SA', 'South Australia')
  and (
    subject ilike '%youth justice%'
    or body_text ilike '%youth justice%'
    or body_text ilike '%detention%'
    or body_text ilike '%diversion%'
    or body_text ilike '%bail%'
    or body_text ilike '%Aboriginal young%'
  )
order by sitting_date desc
limit 100;
```

If this returns little or nothing, record that as a verified data gap and add SA Hansard ingestion to the backlog.

## Source Targets

For Adelaide and SA, prioritise:

- SA Department of Human Services Youth Justice pages and annual reports.
- Kurlana Tapa Youth Justice Centre / training centre visitor reports.
- Guardian for Children and Young People / Training Centre Visitor reports.
- SA Courts youth, Nunga Court, diversion, bail, and conferencing pages.
- Legal Services Commission SA youth legal help.
- Aboriginal Legal Rights Movement and SA Aboriginal community-controlled organisations.
- Ask Izzy Adelaide/SA youth, legal, housing, family, alcohol and drug services.
- SA Budget Papers, DHS agency statements, Auditor-General reports, and parliamentary estimates.
- SA Parliament Hansard and ministerial statements.
- ACNC records for ABN, charity purposes, government revenue, and responsible persons.

## Decision Rules

- Confirmed Tier 1 requires direct youth justice/frontline evidence, not just youth, First Nations, or general social services language.
- ACCO or Indigenous-led status is a priority signal, not automatic youth justice confirmation.
- Funding records with no ABN or no `alma_organization_id` become matching tasks, not final entity claims.
- ROGS is system spend. `justice_funding` is recipient/program spend. Do not add them together unless the source hierarchy is explicit.
- Politician claims need at least one source row: Hansard, ministerial statement, charter commitment, budget document, oversight report, RTI, or consultancy record.

## Final Brief Template

```text
SA / Adelaide Youth Justice Civic Scope Brief

Verified:
- Organisations:
- Spending:
- Politicians / departments:
- Oversight:

Inferred:
- Likely funding gaps:
- Likely missing organisations:
- Likely promise-vs-money mismatches:

Unknown / next ingest:
- Missing Hansard sources:
- Missing ABNs:
- Missing funding links:
- Candidate Tier 1 rows needing review:
```
