# NSW Funding Analysis — Verified from JusticeHub DB

**Date:** 2026-03-29
**Source:** Supabase queries against live database

---

## NSW Total Spending (ROGS 2024-25)

| Metric | NSW | QLD | Source |
|--------|-----|-----|--------|
| Total recurrent expenditure | **$327M** | $536M | ROGS 17A.10 |
| Detention expenditure | $217M | $298M | ROGS 17A.11 |
| Community supervision | $109M | $228M | ROGS 17A.11 |
| Group conferencing | $1.1M | $10.4M | ROGS 17A.11 |
| Per young person (10-17 pop) | $393/yr | $922/yr | ROGS 17A.10 |
| Detention cost/day | **$2,573** | ~$2,800 | ROGS 17A.20 |
| Indigenous overrepresentation (detention) | **22.1x** | 26.3x | ROGS 17A.7 |
| Indigenous supervision rate | 63.9/10K | 115/10K | ROGS 17A.8 |
| Community order completion | **92.1%** | — | ROGS |
| Group conferences concluded | 1,246 | — | ROGS |

## 10-Year Spending Trend (ROGS, $K)

| Financial Year | NSW | QLD |
|---------------|-----|-----|
| 2015-16 | $251M | $215M |
| 2016-17 | $249M | $233M |
| 2017-18 | $249M | $262M |
| 2018-19 | $239M | $310M |
| 2019-20 | $263M | $335M |
| 2020-21 | $259M | $347M |
| 2021-22 | $328M | $393M |
| 2022-23 | $329M | $390M |
| 2023-24 | $352M | $455M |
| 2024-25 | $327M | $536M |

**NSW: +30% over 10 years. QLD: +149% over same period.**

## Funding Sources in DB

| Source | Records | Total Value |
|--------|---------|-------------|
| ROGS aggregate | — | $8.8B (state-level) |
| nsw-facs-ngo-grants | 5,790 | $3.59B |
| nsw-dcj-ngo-grants | 2,088 | $1.82B |
| austender-direct | 1,885 | $1.44B |
| niaa-senate-order-16 | 72 | $45.4M (NIAA JR) |
| prf-jr-portfolio-review-2025 | 6 | $27.5M |
| dusseldorp-yir-2025 | 5 | $450K |

## Top NSW Recipients

| Rank | Organisation | Indigenous | Total |
|------|-------------|-----------|-------|
| 1 | Life Without Barriers | No | $304M |
| 2 | Uniting | No | $217M |
| 3 | Wesley | No | $207M |
| 25 | Burrun Dalai Aboriginal Corp | **Yes** | $59M |

**Approximate intermediary-to-ACCO ratio: 19:1**

## Unlinked Funding (Opportunity)

2,930 unlinked records worth **$909M** — actionable for linkage sprint.

## NSW Programs — Evidence Base

| Evidence Level | Count | % |
|---------------|-------|---|
| Proven (RCT) | 4 | 3% |
| Effective | 16 | 10% |
| Promising | 72 | 47% |
| Indigenous-led | 13 | 8% |
| Untested | 49 | 32% |

**NSW has 4 Proven programs vs QLD's zero.** Detention costs 550x more than cheapest effective program.

## Key Indigenous Orgs

- Maranguka Limited — 11 programs
- Just Reinvest NSW — 11 programs
- Burrun Dalai Aboriginal Corp — $59M funding, 0 programs linked (needs work)

## Government Data (Oracle agent)

### BOCSAR
- 234 youth in custody (Jun 2025), up 34% in 2 years
- 70%+ unsentenced/on remand
- Aboriginal youth: 60% of detention (8% of population)
- 81% reconvicted within 10 years
- 10-13yo: 82% had child protection reports

### Inspector of Custodial Services
- 6 youth justice centres, 51 recommendations (2022)
- Frank Baxter, Acmena, Orana holding rooms substandard

### NSW Ombudsman
- Strip searches at Frank Baxter "oppressive"
- Recommended legislative prohibition

### DCJ Budget
- $23M regional youth crime prevention
- $13.4M Aboriginal-led therapeutic pathways

### NSW Select Committee on Youth Justice
- Est. Nov 2025, reports Dec 2026

### Crossover Pipeline
- 82% of 10-13yo in court had child protection reports
- 65%+ of YJ supervised had prior CP contact
