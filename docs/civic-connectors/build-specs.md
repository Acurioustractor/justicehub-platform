# Civic data connectors — build specs

Produced by 7 parallel research agents on 2026-05-23. Each connector is a separate ingestion pipeline that the user can choose to build out (or delegate to another agent batch). Specs include verified source URLs, recommended Supabase table schemas, ingestion approaches, refresh cadence, and known gotchas.

This file is a planning artefact, not implementation. The scripts described do not yet exist. Treat each section below as a self-contained brief that a future session can pick up.

---

## 1. AIHW Youth Justice in Australia (annual)

**Latest report:** *Youth justice in Australia 2024-25* — released early 2026. Annual cadence, ~Mar/Apr.

**Verified sources:**
- Report landing: `https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2024-25/`
- Supplementary tables linked from `/data` subpath as `Supplementary tables.xlsx` (sheets S1-S100+)
- Closing the Gap CTG-11 dataset (machine-readable fallback): `https://www.pc.gov.au/closing-the-gap-data/annual-data-report/data-downloads/ctg-202407-ctg11-youth-justice-dataset.csv`

**Format:** PDF + XLSX. No REST API. AIHW does NOT expose `statsdata.aihw.gov.au` for YJ (that subdomain serves hospital data only).

**Recommended schema:**
```sql
CREATE TABLE aihw_youth_justice_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_year text NOT NULL,              -- '2024-25'
  state text NOT NULL,                    -- 'NSW','VIC','QLD','SA','WA','TAS','ACT','NT','NAT'
  metric_key text NOT NULL,               -- 'avg_daily_supervision', 'detention_indigenous_rate_per_10k', 'remand_pct'
  metric_value numeric,
  unit text,                              -- 'count','rate_per_10k','percent','ratio'
  indigenous_status text,                 -- 'indigenous','non_indigenous','all','unknown'
  age_group text,                         -- '10-13','14-17','10-17','18+','all'
  legal_status text,                      -- 'remand','sentenced','community','all'
  source_table text,                      -- 'S18','S37' AIHW table id
  source_url text NOT NULL,
  published_at date,
  ingested_at timestamptz DEFAULT now(),
  UNIQUE (report_year, state, metric_key, indigenous_status, age_group, legal_status)
);
```

**Ingestion approach:** download XLSX → parse with `xlsx` (SheetJS) → iterate whitelisted sheets (S18 remand, S37 Indigenous, S54 age splits) → emit tidy rows → upsert.

**Volume:** ~3K-5K rows per report year. 25 years of NMDS history → ~75K-125K if backfilled.

**Cron:** annual, late-March, check landing hash monthly.

---

## 2. BOCSAR (NSW Bureau of Crime Statistics)

**Verified sources:**
- Open datasets index: `https://bocsar.nsw.gov.au/statistics-dashboards/open-datasets.html`
- Offender data (monthly CSV): `https://bocsar.nsw.gov.au/statistics-dashboards/open-datasets/offender-data.html`
- Youth-specific page: `https://bocsar.nsw.gov.au/topic-areas/young-people.html`
- Custody dashboard (quarterly): `https://bocsar.nsw.gov.au/statistics-dashboards/custody.html`
- LGA crime tables (Excel): `https://bocsar.nsw.gov.au/statistics-dashboards/crime-and-policing/lga-excel-crime-tables.html`

**Cadence:** Quarterly. Releases Mar / Jun / Sep / Dec covering data 3-4 months prior.

**Recommended schema:**
```sql
CREATE TABLE bocsar_youth_offending (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL DEFAULT 'NSW',
  period_start date NOT NULL,
  period_end date NOT NULL,
  period_type text NOT NULL,           -- 'month' | 'quarter' | 'year'
  geography_level text NOT NULL,       -- 'state' | 'lga' | 'region'
  geography_name text,
  age_group text NOT NULL,
  indigenous_status text,
  sex text,
  offence_anzsoc text,
  offence_subcategory text,
  legal_proceeding text,               -- 'court' | 'caution' | 'yjc' | 'infringement'
  metric text NOT NULL,                -- 'offenders' | 'incidents' | 'custody_population'
  count integer,                       -- NULL when suppressed
  suppressed boolean DEFAULT false,
  source_file text NOT NULL,
  source_url text NOT NULL,
  release_date date,
  ingested_at timestamptz DEFAULT now(),
  UNIQUE (period_start, geography_level, geography_name, age_group, indigenous_status, sex, offence_anzsoc, legal_proceeding, metric)
);
```

**Pipeline:** discover → download (only when hash changes) → parse CSV with `papaparse` / Excel with `xlsx` → batch upsert.

**Critical gotchas:**
- Small-cell suppression: count < ~5 redacted. Treat as NULL with `suppressed=true`, never zero. Never sum suppressed cells.
- BOCSAR's 20%-of-police-contacts Indigenous rule undercounts vs ABS self-identification. Document in metadata, never blend with ABS figures.
- BOCSAR revises prior quarters. Always re-ingest last 8 quarters.
- LGA boundaries are NSW LGA, not ABS SA2 — need crosswalk for any ABS joins.

**Skip:** Reoffending Database (ROD) — unit-record, requires written application + ethics approval.

---

## 3. Children's Commissioner annual reports (9 jurisdictions)

**Verified PDF URLs (6 of 9 direct):**

| Jurisdiction | Body | Format |
|---|---|---|
| NSW | Advocate for Children & Young People | PDF — `acyp.nsw.gov.au/acyp-reports/annual-reports` |
| VIC | Commission for Children & Young People | PDF — `ccyp.vic.gov.au/about-us/annual-reports/` |
| QLD | Family & Child Commission | PDF (2 docs — annual + child protection performance) |
| WA | Commissioner for Children & Young People | **HTML** — `ccyp.wa.gov.au/about-us/corporate-information/annual-report-2024-2025/` |
| SA | CCYP (general + Aboriginal CYP) | Two PDFs — both should ingest |
| TAS | Commissioner for Children & Young People | PDF |
| NT | Office of Children's Commissioner | PDF (URL needs site-scrape at runtime) |
| ACT | inside ACT HRC consolidated report | PDF — extract CYP chapter only |
| Federal | National Children's Commissioner (AHRC) | PDF + standalone *Help Way Earlier!* (Aug 2024) |

**Recommended schema:**
```sql
CREATE TABLE children_commissioner_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction text NOT NULL,
  body_name text NOT NULL,
  report_year text NOT NULL,
  report_url text NOT NULL,
  report_title text,
  page_count int,
  published_date date,
  raw_text text,
  key_findings jsonb,
  recommendations jsonb,
  yj_relevant boolean DEFAULT false,
  raise_age_mentioned boolean DEFAULT false,
  detention_mentioned boolean DEFAULT false,
  indigenous_overrep_mentioned boolean DEFAULT false,
  extracted_at timestamptz DEFAULT now(),
  llm_model text,
  UNIQUE (jurisdiction, report_year)
);
```

**Pipeline:** fetch → resolve latest PDF → pdf-parse → chunk (8K tokens, 200-token overlap) → LLM extract (Sonnet, schema-validated) → merge across chunks → upsert.

**Per-chunk LLM prompt (sketch):**
> Extract `{findings: [{theme, finding, page_ref}], recommendations: [{number, text, target_body, yj_relevant, raise_age_relevant, indigenous_overrep}]}`. Only return recommendations that are explicit ("the Commission recommends..."). Verbatim language. No fabricated page numbers.

**Volume:** 9 jurisdictions × ~3 historical years = 27 docs for backfill. Annual refresh.

**Per-jurisdiction gotchas:**
- WA = HTML, not PDF — needs separate path
- SA has 2 commissioners — link via `parent_report_id`
- ACT lives inside HRC consolidated — extract CYP chapter only
- QLD publishes 2 docs — ingest both

---

## 4. Sentencing Advisory Councils per state

| Jurisdiction | Body | Status | Youth-specific reports? |
|---|---|---|---|
| NSW | NSW Sentencing Council + NSW LRC | Active | Limited |
| VIC | Sentencing Advisory Council Victoria | Active | **YES — strong** (2025 Younger Children's Offending, Crossover Kids, etc.) |
| WA | No SAC — use Law Reform Commission WA | n/a | Limited |
| SA | No SAC — use SA Law Reform Institute | Active | Occasional |
| TAS | Sentencing Advisory Council Tasmania | Active | **YES** (Sentencing Young Offenders, 2021) |
| NT | NT Law Reform Committee | Active | Partial |
| ACT | ACT JACS — no SAC, council dormant | Active | Reform via JACS |

**Reuse existing `oversight_recommendations` schema.** Map: `oversight_body`, `report_title`, `recommendation_text`, `status`, `severity`, `jurisdiction`, `domain='youth_justice'`, `report_date`.

**Skip list:** adult-only reviews; statistical-only updates; submissions TO inquiries; conference papers.

**Priority order:** VIC (highest yield, multiple youth reports) → TAS → NT → NSW → WA/SA/ACT (one-off).

---

## 5. JR Network evaluations + Mission Australia Youth Survey

### A. Justice Reinvestment Network

**Source:** `justicereinvestment.net.au/research-papers-and-reports/` (note `.net.au`, not `.org.au`)

**Sites covered:** Maranguka (Bourke NSW, KPMG 2018: $3.1M NSW savings, 5× operating cost), Moree NSW, Halls Creek WA, Glen Innes, Cooktown.

**Recommended schema:**
```sql
CREATE TABLE jr_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_name text,                 -- 'Maranguka', 'Olabud Doogethu'
  site_location text,
  alma_organization_id uuid REFERENCES organizations(id),
  evaluator text,                    -- 'KPMG', 'ANU JR Hub'
  publication_year int,
  evaluation_type text,              -- 'impact_assessment'|'community_led'|'academic'
  program_cost_dollars bigint,
  claimed_savings_dollars bigint,
  outcomes_json jsonb,
  source_url text UNIQUE,
  pdf_storage_path text,
  verification_status text
);
```

**Volume:** 15-25 PDFs. One-shot batch.

### B. Mission Australia Youth Survey

**Source:** `missionaustralia.com.au/what-we-do/evidence-impact-and-advocacy/research/youth-survey/`

**Latest:** 2025 report, 17K+ respondents aged 14-19 (sample shrinking from 20-25K peak).

**Format:** National PDF + 7 state/territory PDFs. **Raw data NOT public.** Researcher access gated.

**Recommended schema:**
```sql
CREATE TABLE youth_survey_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_year int,
  geography_level text,            -- 'national'|'state'|'territory'
  state text,
  cohort_filter jsonb,             -- {indigenous: true, age_range: '14-15', gender: 'female'}
  metric_key text,                 -- 'top_concern_cost_of_living', 'police_contact_pct'
  metric_value numeric,
  metric_unit text,
  sample_size int,
  source_pdf_url text,
  source_page int
);
```

**Pipeline:** annual run, target ~30 high-value metrics (justice contact, MH, Indigenous-stratified outcomes). Don't try to extract everything from 150pp PDFs.

**Priority:** JR Network has higher signal density (dollar figures, named communities → directly enriches ALMA). Mission Australia is breadth (contextual layer).

---

## 6. ABS Indigenous detail tables + ABR bulk refresh

### A. ABR (Australian Business Register) — CRITICAL PATH

**Dataset:** `5bd7fcab-e315-42cb-8daf-50b7efc2027e` on data.gov.au.

**Cadence:** Weekly XML refresh. Confirmed: 20 May 2026 publish.

**Format:** Full bulk extract as ~20 zipped XML splits (`public_split_01_10.zip`, `public_split_11_20.zip`, schema `bulkextract.xsd`). **No public diff file** — only full re-publish.

**Detection pattern:**
```bash
curl https://data.gov.au/data/api/3/action/package_show?id=abn-bulk-extract
# Check resources[].last_modified
```

**Incremental refresh** (no native diff):
```sql
ALTER TABLE abr_registry
  ADD COLUMN record_hash text,
  ADD COLUMN last_seen_in_extract date,
  ADD COLUMN cancelled_inferred_at date;
```
Then: stream-parse XML weekly with `sax`/`node-expat` (do NOT load into memory — 20M records). Hash each `<ABR>`. New → insert. Hash changed → update. Absent → mark cancelled. Confirm with 2 consecutive misses before flagging cancelled.

**Eligible-agency access (non-public fields like email, postal address):** ABR Data Transfer Facility / ABR Explorer — requires government agency credentials. JusticeHub eligibility unverified.

### B. ABS Indigenous data

**Endpoint:** `https://api.data.abs.gov.au/data/{dataflow}/{key}?startPeriod=2021&format=jsondata`

**List dataflows:** `GET https://api.data.abs.gov.au/dataflow/ABS`

**Relevant dataflows (inferred, verify via /dataflow/ABS):**
- `ABORIGINAL_POP_PROJ` — Indigenous projections by state/IREG/remoteness 2016-2031
- `C21_G07_LGA` — Indigenous status by LGA (2021 Census)
- `C21_G09_LGA` — Age × sex × Indigenous status by LGA

**Recommended schema:**
```sql
CREATE TABLE abs_indigenous_population_by_lga (
  id bigserial PRIMARY KEY,
  lga_code text NOT NULL,
  lga_name text,
  state text,
  reference_year int NOT NULL,
  source text NOT NULL,                -- 'census_2021' | 'erp_projection'
  age_group text,
  sex text,
  indigenous_status text NOT NULL,
  count_persons int,
  dataflow_id text,
  ingested_at timestamptz DEFAULT now(),
  UNIQUE (lga_code, reference_year, source, age_group, sex, indigenous_status)
);
```

**Pipeline:** raw SDMX-JSON to `abs_raw_responses` first, transform second.

**NOT in ABS DataAPI:** child protection orders by Indigenous status (use AIHW Child Protection annual instead, already in `aihw_child_protection`).

---

## 7. State Auditors-General + SCAG communiques

### A. State Audit Office YJ performance audits

**Verified index URLs (6 of 8):**

| Jurisdiction | Index URL |
|---|---|
| QLD | `qao.qld.gov.au/reports-resources/reports-parliament` ✅ |
| NSW | `audit.nsw.gov.au/publications/performance-audit-reports` ✅ |
| VIC | `audit.vic.gov.au/reports` ✅ |
| WA | `audit.wa.gov.au/reports-and-publications/reports/` ✅ |
| SA | `audit.sa.gov.au/reports` ✅ |
| TAS | `audit.tas.gov.au/publication-category/performance-audit/` ✅ |
| NT | `audit.nt.gov.au/publications` (verify on first scrape) |
| ACT | `audit.act.gov.au/publications-and-resources` (verify) |

**Flagship YJ audits to use as fixtures:**
- QLD: *Reducing serious youth crime* (Report 15, 28 Jun 2024)
- NSW: *Reintegrating young offenders into the community after detention* (Oct 2024)
- VIC: *Managing Rehabilitation Services in Youth Detention*

**Schema:** `auditor_general_audits(jurisdiction, title, report_number, url, publication_date, tabled_date, key_findings, key_recommendations, status)`. Add `report_number` and `tabled_date` to base schema.

**Detection:** No RSS on most state audit sites. Weekly poll + hash-diff on index pages.

### B. SCAG (Standing Council of Attorneys-General) communiques

**Single source:** `https://www.ag.gov.au/about-us/publications/standing-council-attorneys-general-communiques`

**Recent meetings:** August 2025, 21 Feb 2025, 22 Nov 2024, 1 Dec 2023.

**Raise-the-age status (Dec 2023):** SCAG released Age of Criminal Responsibility Working Group report (recommended MACR=14 no exceptions) but **no national decision**. State-by-state: NT raised to 12 (end 2022), ACT raised to 12 (Nov 2023) → committed to 14 by 1 Jul 2025, VIC committed to 12.

**Schema:** `scag_communiques(meeting_date, host_jurisdiction, communique_url, yj_decisions_jsonb, raise_age_position, member_states, agenda_items_jsonb)`.

**Detection:** No RSS. Weekly poll, hash-diff. Augment with `ministers.ag.gov.au/media-centre` (same-day) and HRLC alerts (24-48hr).

**Implementation order:** SCAG first (one URL, fast win), then state auditors-general (QLD/NSW/VIC priority).

---

## Suggested build order

1. **ABR weekly refresh + record_hash backbone** (Section 6.A) — unblocks entity-resolution at scale. Already 20M ABNs in DB; need refresh discipline.
2. **AIHW Youth Justice annual ingestion** (Section 1) — biggest narrative leverage. 3-5K rows per year of authoritative national stats.
3. **BOCSAR quarterly** (Section 2) — NSW-only but rich offence-level granularity.
4. **Children's Commissioner reports** (Section 3) — 9 jurisdictions × 3 years backfill = 27 PDFs with LLM extraction. Powers new oversight claims.
5. **SCAG communiques** (Section 7.B) — single URL, fastest of all.
6. **JR Network evaluations** (Section 5.A) — 15-25 PDFs, directly enriches Tier 1 org pages.
7. **Sentencing Advisory Councils** (Section 4) — VIC + TAS priority.
8. **State Auditors-General** (Section 7.A) — 6-8 sources, weekly poll.
9. **ABS Indigenous detail** (Section 6.B) — context layer for /intelligence/civic/locale.
10. **Mission Australia Youth Survey** (Section 5.B) — annual, lowest priority of this set.

## Out of scope (explicit)

- Coroners Court / NCIS deaths-in-custody — sensitive, cultural-handling required, separate session
- Royal Commission archives (NT YJ RC) — substantial scope, separate project
- University research repos — rights/licensing complex
- State police annual reports — funnel-start data, useful but high effort per state

These deserve their own focused planning sessions, not parallel agent-spawned ingestion.
