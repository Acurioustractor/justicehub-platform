# Queensland Youth Justice Tracker - Professional Rebuild Plan

## Executive Summary
Complete rebuild of the data collection system to ensure 100% verifiable, professional-grade data from official government sources only.

## Current State Assessment
- **Real Data**: 2 surface-level web scrapes
- **Mock Data**: 11 fictitious records
- **Reliability**: Not production ready
- **Verifiability**: Cannot prove data accuracy

## Target State
A professional data collection system that:
- ✅ Only uses verified government sources
- ✅ Provides complete audit trail for every data point
- ✅ Validates all data against source documents
- ✅ Maintains data quality scores
- ✅ Can withstand professional scrutiny

## Phase 1: Foundation (Day 1)

### 1.1 Database Cleanup
- Remove ALL mock data
- Create proper schema with validation
- Implement source verification tables

### 1.2 Data Source Registry
Create verified registry of government sources:
- Queensland Courts Annual Reports (PDFs)
- Queensland Police Service Statistics
- Youth Justice Department Reports
- Treasury Budget Papers
- Parliament Hansard Records
- RTI Disclosure Logs

### 1.3 Validation Framework
- Source URL verification
- Data type validation
- Cross-reference checking
- Quality scoring system

## Phase 2: Core Implementation (Day 2)

### 2.1 PDF Extraction System
- Children's Court Annual Reports
- Youth Justice Statistics Reports
- Budget Papers
- QAO Audit Reports

### 2.2 API Integration
- Queensland Open Data Portal
- Crime Statistics API
- Court Data Services

### 2.3 Web Scraping Enhancement
- Deep data extraction (not just mentions)
- Structured data parsing
- Historical data collection

## Phase 3: Quality Assurance (Day 3)

### 3.1 Verification Pipeline
- Automated source checking
- Data consistency validation
- Historical trend analysis
- Anomaly detection

### 3.2 Audit Trail System
- Complete provenance for every data point
- Change tracking
- Source document archival
- Version control

### 3.3 Professional Documentation
- Data dictionary
- Source documentation
- Methodology paper
- API documentation

## Data Sources Priority

### Tier 1 - Critical Sources
1. **Children's Court Annual Reports**
   - URL: https://www.courts.qld.gov.au/courts/childrens-court/annual-reports
   - Data: Youth offender statistics, demographics, sentencing
   - Format: PDF
   - Reliability: Official court data

2. **Queensland Police Crime Statistics**
   - URL: https://www.police.qld.gov.au/maps-and-statistics
   - Data: Youth crime rates, offense types, locations
   - Format: CSV/API
   - Reliability: Official police data

3. **Youth Justice Census**
   - URL: https://www.cyjma.qld.gov.au/resources/resource/youth-justice-census
   - Data: Detention numbers, demographics, trends
   - Format: PDF/Excel
   - Reliability: Department data

### Tier 2 - Supporting Sources
4. **Treasury Budget Papers**
   - URL: https://budget.qld.gov.au
   - Data: Youth justice funding, allocations
   - Format: PDF
   - Reliability: Official budget

5. **Parliament Hansard**
   - URL: https://www.parliament.qld.gov.au/work-of-assembly/hansard
   - Data: Government statements, policy discussions
   - Format: XML/PDF
   - Reliability: Official record

6. **RTI Disclosures**
   - URL: https://www.youthjustice.qld.gov.au/right-to-information
   - Data: Hidden reports, internal data
   - Format: Various
   - Reliability: FOI verified

## Technical Architecture

### Data Flow
```
Government Source → Extractor → Validator → Database → API → Dashboard
                        ↓           ↓          ↓
                   Audit Log   Quality Score  Cache
```

### Validation Rules
1. Source must be .qld.gov.au domain
2. Data must have timestamp
3. Must link to source document
4. Cross-reference when possible
5. Flag anomalies for review

### Quality Scoring
- A: Direct from official report/API
- B: Extracted from verified PDF
- C: Scraped from official website
- D: Derived/calculated data
- F: Unverifiable

## Success Metrics
- 100% data traceability
- Zero mock/fictional data
- All sources documented
- Professional audit trail
- Public reproducibility

## Timeline
- **Day 1**: Foundation and cleanup
- **Day 2**: Core extractors
- **Day 3**: Quality and documentation

This rebuild will create a bulletproof system that can withstand scrutiny from government, media, and advocacy groups.