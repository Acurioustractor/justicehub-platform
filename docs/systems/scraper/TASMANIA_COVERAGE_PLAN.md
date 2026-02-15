# Tasmania Youth Justice Coverage Plan

**Date**: January 2, 2026
**Status**: Action Required
**Priority**: HIGH - Only state missing from ALMA national coverage

---

## Current Gap

### ALMA State Coverage

| State/Territory | Status | Interventions | Sources |
|-----------------|--------|---------------|---------|
| Victoria (VIC) | ✅ Complete | 13+ | Government, Koori programs |
| Queensland (QLD) | ✅ Complete | 39+ | Government, QATSICPP |
| New South Wales (NSW) | ✅ Complete | 10+ | Government, ALS |
| Northern Territory (NT) | ✅ Complete | 5+ | Government, diversion |
| South Australia (SA) | ✅ Complete | 8+ | Government, Youth Court |
| Western Australia (WA) | ✅ Complete | 6+ | Government |
| ACT | ✅ Complete | 4+ | Government, restorative |
| **Tasmania (TAS)** | ❌ **MISSING** | 0 | None |

**Tasmania is the only state without ALMA coverage.**

---

## Why Tasmania Matters

### Unique Context

1. **Smallest youth detention population** - Different dynamics than mainland
2. **Island isolation** - Unique community dynamics
3. **Ashley Youth Detention Centre controversy** - History of abuse allegations
4. **Recent reforms** - Raising age of criminal responsibility discussions
5. **Indigenous population** - Palawa/Aboriginal Tasmanian community

### Intelligence Value

1. **Comparison data** - How does smallest state compare to largest?
2. **Reform patterns** - Is TAS leading or following on age reforms?
3. **Community programs** - What works in isolated communities?
4. **Indigenous-led initiatives** - Palawa-specific programs

---

## Tasmania Youth Justice Landscape

### Government Structure

**Department**: Department of Health (Youth Justice sits under Health, not Justice)

**Key Programs**:
- Ashley Youth Detention Centre (only detention facility)
- Community Youth Justice (diversion programs)
- Youth Justice Services (case management)

### Known Issues

1. **Ashley Youth Detention Centre**
   - Long history of abuse allegations
   - Commission of Inquiry 2021-2022
   - Closure discussions ongoing

2. **Raising the Age Campaign**
   - Active advocacy for raising minimum age from 10 to 14
   - Bipartisan interest (unlike some mainland states)

3. **Small Numbers, High Impact**
   - ~20-30 youth in detention at any time
   - Small numbers mean individual cases have outsized impact

### Indigenous Context

**Palawa/Aboriginal Tasmanian community**:
- Tasmanian Aboriginal Centre (TAC)
- Aboriginal Health Service Tasmania
- Specific cultural considerations (different history than mainland)

---

## Data Sources to Ingest

### Priority 1: Government Sources

| Source | URL | Expected Entities |
|--------|-----|-------------------|
| TAS Youth Justice Services | https://www.health.tas.gov.au/health-topics/youth-justice | 3-5 programs |
| Ashley Youth Detention | https://www.health.tas.gov.au/health-topics/youth-justice/ashley-youth-detention-centre | 1-2 entities |
| Community Youth Justice | https://www.health.tas.gov.au/health-topics/youth-justice/community-youth-justice | 2-4 programs |

### Priority 2: Commission of Inquiry

| Source | URL | Expected Entities |
|--------|-----|-------------------|
| Commission of Inquiry Final Report | https://www.commissionofinquiry.tas.gov.au/ | 5-10 evidence records, reform recommendations |

### Priority 3: Indigenous Sources

| Source | URL | Expected Entities |
|--------|-----|-------------------|
| Tasmanian Aboriginal Centre | https://tacinc.com.au/ | 2-3 Indigenous-led programs |
| Aboriginal Health Service | https://www.ahmrc.org.au/tasmanian-aboriginal-health-service/ | 1-2 health intersection programs |

### Priority 4: Advocacy/Research

| Source | URL | Expected Entities |
|--------|-----|-------------------|
| Raise the Age Tasmania | https://raisetheage.org.au/tasmania | Policy intelligence |
| TAS Law Reform Institute | https://www.utas.edu.au/law/law-reform | Evidence records |

---

## Ingestion Plan

### Phase 1: Government Sources (Day 1)

```bash
# Run Tasmania government ingestion
node scripts/alma-comprehensive-ingestion.mjs --sources "TAS Youth Justice,Ashley YDC,Community Youth Justice"
```

**Expected output**: 5-10 interventions

### Phase 2: Commission of Inquiry (Day 1-2)

**Manual extraction recommended** - Commission reports are complex PDFs

**Key documents**:
1. Final Report (Volume 1-3)
2. Recommendations summary
3. Evidence summaries

**Expected output**: 5-10 evidence records, 10-20 reform recommendations

### Phase 3: Indigenous Sources (Day 2)

**Approach**: Contact TAC directly before scraping

**Why**: Indigenous data sovereignty - should not scrape Indigenous sources without consent

**Expected output**: 2-5 Community Controlled programs (with consent)

### Phase 4: Advocacy/Research (Day 2-3)

```bash
# Run research source ingestion
node scripts/alma-comprehensive-ingestion.mjs --sources "Raise the Age TAS,TAS Law Reform"
```

**Expected output**: 3-5 policy/evidence entities

---

## Data Quality Considerations

### Tasmania-Specific Metadata

When ingesting Tasmania data, ensure:

1. **Region**: Tag as "TAS" or "Tasmania"
2. **Context**: Note small population dynamics
3. **Ashley context**: Flag historical issues
4. **Indigenous**: Mark Palawa-specific programs
5. **Reform status**: Track raising age progress

### Consent Levels

| Source Type | Consent Level |
|-------------|---------------|
| Government websites | Public Knowledge Commons |
| Commission of Inquiry (public) | Public Knowledge Commons |
| Indigenous organizations | Community Controlled (require consent) |
| Advocacy organizations | Public Knowledge Commons |

---

## Contacts to Establish

### Government

| Organization | Contact Type | Purpose |
|--------------|--------------|---------|
| TAS Dept of Health - Youth Justice | Data request | Comprehensive program list |
| Ashley YDC Management | Information | Current programs, reform status |
| TAS Children's Commissioner | Partnership | Data sharing, oversight |

### Indigenous

| Organization | Contact Type | Purpose |
|--------------|--------------|---------|
| Tasmanian Aboriginal Centre | Partnership | Indigenous-led programs, consent |
| Aboriginal Health Service TAS | Partnership | Health intersection programs |
| Palawa Elders | Consultation | Cultural protocols |

### Advocacy

| Organization | Contact Type | Purpose |
|--------------|--------------|---------|
| Raise the Age Tasmania | Information | Reform status, evidence base |
| TAS Law Reform Institute | Research | Evidence records, evaluations |

---

## Timeline

### Week 1 (January 2-8)

- [ ] **Day 1**: Ingest government sources
- [ ] **Day 2**: Extract Commission of Inquiry findings
- [ ] **Day 3**: Contact TAC for Indigenous source consent
- [ ] **Day 4**: Ingest advocacy/research sources
- [ ] **Day 5**: Validate data quality

### Week 2 (January 9-15)

- [ ] Receive TAC consent decision
- [ ] Ingest Indigenous sources (if consent granted)
- [ ] Run portfolio analysis including TAS
- [ ] Generate state comparison with TAS included

### Week 3 (January 16-22)

- [ ] Publish national coverage report
- [ ] TAS included in ALMA dashboard
- [ ] All 8 states/territories complete

---

## Success Criteria

### We succeed when:

1. ✅ Tasmania interventions in ALMA database (5+ programs)
2. ✅ Commission of Inquiry evidence extracted (5+ evidence records)
3. ✅ Indigenous sources included with consent
4. ✅ State comparison includes Tasmania
5. ✅ Portfolio scoring functional for TAS programs
6. ✅ Ashley YDC context documented

### We fail if:

1. ❌ Tasmania still missing after Week 2
2. ❌ Indigenous sources scraped without consent
3. ❌ Commission findings not captured
4. ❌ Ashley context ignored (historical harm)

---

## Tasmania-Specific ALMA Signals

When Tasmania data is ingested, track these unique signals:

### System Pressure Signals (TAS-specific)

| Signal | Description | Source |
|--------|-------------|--------|
| Ashley population | Daily count at Ashley YDC | Government data |
| Ashley incidents | Reported incidents | Commission data |
| Reform progress | Raising age legislative status | Policy tracking |

### Community Capability Signals (TAS-specific)

| Signal | Description | Source |
|--------|-------------|--------|
| Palawa involvement | Indigenous-led program count | Community data |
| Island isolation factor | Access to services | Geography analysis |
| Small state dynamics | Per-capita investment | Budget data |

---

## Ashley Youth Detention Centre: Special Handling

### Historical Context

Ashley YDC has a documented history of:
- Physical abuse allegations
- Sexual abuse allegations
- Inadequate education
- Isolation and restraint concerns
- Multiple investigations and inquiries

### Data Handling Requirements

1. **Do not minimize**: Include Commission findings fully
2. **Survivor voice**: Link to Survivor advocacy if available
3. **Reform tracking**: Track closure/reform progress
4. **Current programs**: Document what programs exist now
5. **Historical accountability**: Note past failures

### ALMA Signal: Ashley Reform Progress

Track as dedicated signal:
- Status: Open/Reforming/Closing
- Recommendations implemented: X/Y
- Survivor compensation: Status
- Alternative model development: Status

---

## Immediate Actions

### Today (January 2)

1. [ ] Create scraper configuration for TAS government sources
2. [ ] Test TAS Youth Justice website structure
3. [ ] Draft email to TAC requesting partnership discussion

### This Week

1. [ ] Run government source ingestion
2. [ ] Begin Commission of Inquiry extraction
3. [ ] Schedule TAC meeting
4. [ ] Validate initial data

### This Month

1. [ ] Complete all TAS coverage
2. [ ] 8/8 states in ALMA
3. [ ] National comparison report published

---

## Script Configuration

### Add to scraper config

```javascript
// scripts/lib/sources/tasmania.mjs

export const tasmaniaSources = [
  {
    name: 'TAS Youth Justice Services',
    url: 'https://www.health.tas.gov.au/health-topics/youth-justice',
    type: 'government',
    consentLevel: 'Public Knowledge Commons',
    state: 'TAS',
    expectedEntities: ['intervention', 'program']
  },
  {
    name: 'Ashley Youth Detention Centre',
    url: 'https://www.health.tas.gov.au/health-topics/youth-justice/ashley-youth-detention-centre',
    type: 'government',
    consentLevel: 'Public Knowledge Commons',
    state: 'TAS',
    context: 'Historical abuse issues - handle with care',
    expectedEntities: ['intervention', 'context']
  },
  {
    name: 'Community Youth Justice TAS',
    url: 'https://www.health.tas.gov.au/health-topics/youth-justice/community-youth-justice',
    type: 'government',
    consentLevel: 'Public Knowledge Commons',
    state: 'TAS',
    expectedEntities: ['intervention', 'program']
  },
  {
    name: 'TAS Commission of Inquiry',
    url: 'https://www.commissionofinquiry.tas.gov.au/',
    type: 'research',
    consentLevel: 'Public Knowledge Commons',
    state: 'TAS',
    context: 'Ashley Youth Detention Centre abuse inquiry',
    expectedEntities: ['evidence', 'outcome', 'context']
  }
];
```

---

## Closing the Gap

**Current**: 7/8 Australian jurisdictions covered
**Target**: 8/8 jurisdictions covered
**Timeline**: 2 weeks

**Tasmania is the last piece. Once complete, ALMA has full national coverage.**

---

*Status: Action Required*
*Priority: HIGH*
*Owner: [Assign]*
*Due: January 15, 2026*
