# 🎯 Queensland Youth Justice Tracker: Evidence-Based Data Strategy

## Mission: Hold Queensland Government Accountable with Real Data

### Core Problem
Queensland has the **highest youth justice supervision rates in Australia** (175 per 10,000) and **20x Indigenous overrepresentation**, yet government accountability remains weak due to scattered, opaque data.

### Solution: Targeted Collection of Official Government Statistics

---

## 📊 Data Sources & Target Statistics

### 1. QFCC (Queensland Family & Child Commission)
**Purpose**: Independent oversight body exposing system failures

**Target Reports**:
- "Spotlight: Youth Justice in Queensland" (2023)
- Annual Child Rights Reports  
- Watch house detention reviews

**Key Statistics to Extract**:
- Children held in police watch houses (470 children, 5-14 days)
- Indigenous overrepresentation by age group
- Government admissions of system failures
- Cost disclosures and transparency gaps

**URLs**:
- https://www.qfcc.qld.gov.au/sites/default/files/2023-08/QFCC_Child_Rights_Report_1_YouthJustice_1.pdf
- https://www.qfcc.qld.gov.au/sector/monitoring-and-reviewing-systems/young-people-in-youth-justice

---

### 2. AIHW (Australian Institute of Health & Welfare)
**Purpose**: Independent federal statistics exposing Queensland's failures

**Target Reports**:
- "Youth Justice in Australia" (annual 2019-2024)
- Queensland-specific factsheets
- Indigenous health and welfare reports

**Key Statistics to Extract**:
- **Queensland supervision rate: 175 per 10,000** (highest in Australia)
- **Indigenous return rate: 74%** (highest in Australia) 
- **20x overrepresentation factor** for Indigenous youth
- Legislative changes impact (2018 age increase)

**URLs**:
- https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24/
- https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2022-23/
- https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2021-22/

---

### 3. Queensland Open Data Portal
**Purpose**: Direct access to government datasets (CSV/API)

**Target Datasets**:
- Youth Justice - Young offenders in youth detention
- Youth Justice - Young offenders on youth justice orders  
- Department of Youth Justice annual statistics
- Courts administration data

**Key Statistics to Extract**:
- Daily detention counts by demographics (2011-2016)
- Youth justice order commencements by region
- Indigenous status breakdowns
- Cost and budget allocations

**API Endpoints**:
- https://www.data.qld.gov.au/api/3/action/datastore_search
- Direct CSV downloads from portal

---

### 4. Children's Court Annual Reports
**Purpose**: Official court system admissions of failure

**Target Reports**:
- Children's Court Annual Reports (2018-2024)
- Magistrates Court youth statistics
- Sentencing data by demographics

**Key Statistics to Extract**:
- **86% of 10-11 year olds in court are Indigenous**
- **Indigenous youth 21.4x more likely in detention**
- Watch house detention patterns
- Sentencing disparities by race

**URLs**:
- https://www.courts.qld.gov.au/__data/assets/pdf_file/0010/786466/cc-ar-2022-2023.pdf
- https://www.parliament.qld.gov.au/Work-of-the-Assembly/Tabled-Papers/docs/5824t0283/5824t283.pdf

---

### 5. Parliamentary Inquiry Reports
**Purpose**: Government accountability and policy failure documentation

**Target Reports**:
- Youth Justice Reform Select Committee (2023-2024)
- Queensland Audit Office "Reducing Serious Youth Crime" (2024)
- Bob Atkinson reviews and government responses

**Key Statistics to Extract**:
- **"No one entity accountable for system success"** (QAO finding)
- Policy implementation failures
- Budget allocation vs outcomes
- Government promise vs delivery gaps

**URLs**:
- https://documents.parliament.qld.gov.au/tp/2024/5724T612-1B7E.pdf
- https://www.qao.qld.gov.au/reports-resources/reports-parliament/reducing-serious-youth-crime

---

## 🔧 Technical Implementation Plan

### Phase 1: Data Collection Infrastructure

#### PDF Extraction System
```python
# Target: Extract tables from court reports and QFCC publications
libraries: PyPDF2, pdfplumber, tabula-py
capabilities: 
  - Table extraction from annual reports
  - Statistical data parsing
  - Indigenous overrepresentation metrics
  - Cost and budget figure extraction
```

#### Open Data API Integration
```javascript
// Target: Queensland Open Data Portal structured datasets
const API_BASE = 'https://www.data.qld.gov.au/api/3/action'
endpoints:
  - datastore_search (for CSV data)
  - package_show (for dataset metadata)
  - resource_show (for resource details)
```

#### Government Report Monitoring
```javascript
// Target: Automated detection of new reports
monitoring:
  - QFCC publications RSS/updates
  - AIHW report release schedule
  - Parliamentary tabling alerts
  - Court annual report cycles
```

### Phase 2: Database Schema for Accountability

#### Indigenous Overrepresentation Tracking
```sql
CREATE TABLE indigenous_overrepresentation (
    id UUID PRIMARY KEY,
    year INTEGER,
    age_group VARCHAR(20),
    indigenous_percentage DECIMAL(5,2),
    overrepresentation_factor DECIMAL(5,2),
    source_document VARCHAR(500),
    court_region VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Government Accountability Metrics
```sql
CREATE TABLE accountability_failures (
    id UUID PRIMARY KEY,
    failure_type VARCHAR(100), -- 'policy_gap', 'cost_transparency', 'implementation'
    description TEXT,
    government_promise TEXT,
    actual_outcome TEXT,
    source_document VARCHAR(500),
    date_identified DATE,
    severity_score INTEGER, -- 1-10 impact scale
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Cost Transparency Tracking
```sql
CREATE TABLE detention_costs (
    id UUID PRIMARY KEY,
    year INTEGER,
    cost_per_day_official DECIMAL(10,2),
    cost_per_day_true DECIMAL(10,2), -- including hidden costs
    cost_source VARCHAR(200),
    transparency_gap DECIMAL(10,2),
    youth_population INTEGER,
    total_annual_cost DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Phase 3: Accountability Dashboard

#### Real-Time Government Performance Scorecards
- Indigenous overrepresentation trends (target: reduce 20x factor)
- Watch house detention abuse tracking
- Policy promise vs delivery gaps
- Cost transparency violations
- Recidivism rate accountability (74% failure rate)

#### Evidence-Based Advocacy Tools
- Parliamentary submission generators
- Media fact-check databases  
- Timeline of government failures
- Comparative analysis (QLD vs other states)

---

## 📈 Success Metrics

### Data Collection Targets
- **50+ official government statistics** extracted monthly
- **Indigenous overrepresentation data** tracked across 6+ years
- **True detention costs** calculated and monitored
- **Government accountability gaps** documented and tracked

### Advocacy Impact Targets
- **Evidence packages** ready for parliamentary submissions
- **Media resources** with verified government data
- **Public transparency** tools accessible to advocates
- **Government performance** scorecards updated monthly

### Reform Accountability Targets
- **Policy implementation** tracking and failure documentation
- **Budget allocation** vs outcome analysis
- **Government promise** vs delivery tracking
- **System performance** deterioration documentation

---

## 🎯 Expected Outcomes

### Immediate (30 days)
- Comprehensive database of Indigenous overrepresentation (20x factor)
- True detention costs revealed ($1,570/day vs $857 official claim)
- Government accountability failures mapped and documented
- Watch house abuse statistics compiled from court reports

### Medium-term (90 days)  
- Evidence-based reform advocacy tools deployed
- Parliamentary submission-ready datasets available
- Public transparency dashboard operational
- Media fact-check resources established

### Long-term (6+ months)
- Sustained government accountability pressure
- Evidence-based policy reform advocacy
- Public awareness of systemic failures
- Reform outcome tracking and accountability

---

**This strategy transforms the Queensland Youth Justice Tracker from random website scraping into a powerful government accountability tool backed by official statistics and evidence.**