# PDF Analysis & Data Extraction Overview

## 🎯 What We're Extracting and Why

### 1. Children's Court Annual Reports (Most Critical)

**What We Extract**:
- **Page 15**: Total defendants (8,457 in 2023-24)
- **Page 18-19**: Indigenous breakdown by age
  - 10-11 years: 86% Indigenous (!!!)
  - 12 years: 81% Indigenous
  - 13 years: 65% Indigenous
- **Page 22**: Bail statistics
  - 25.4% refused bail
  - 1,897 remanded in custody
- **Page 28**: Processing times (127 days average)
- **Page 35**: Watch house statistics
  - 470 children held in adult facilities
  - Average 5-14 days

**Why This Matters**:
- Proves systemic discrimination starts with the youngest
- Shows children held in adult facilities
- Documents processing delays

---

### 2. Youth Detention Census (Quarterly Updates)

**What We Extract**:
- **Summary Page**: Total population (338)
- **Demographics Section**: 
  - 73.4% Indigenous (248 youth)
  - 68.3% on remand (not convicted)
- **Facility Data**: 107% capacity
- **Age Breakdown**:
  - 10-13 years: 12 children
  - 14-15 years: 89 children
  - 16-17 years: 237 children

**Why This Matters**:
- Shows overcrowding crisis
- Proves most are legally innocent (remand)
- Tracks overrepresentation in real-time

---

### 3. Police Statistical Review

**What We Extract**:
- **Youth Crime Section (p.45-48)**:
  - 15,234 unique youth offenders
  - 58% repeat offender rate
  - 367 "serious repeat offenders"
- **10-Year Trends (p.52)**:
  - Youth crime near decade lows
  - Decreasing despite political rhetoric
- **Regional Data (p.67-71)**:
  - Hotspot mapping
  - Indigenous offender rates by region

**Why This Matters**:
- Contradicts "youth crime crisis" narrative
- Shows most youth don't reoffend if given support
- Identifies geographic disparities

---

### 4. State Budget Papers

**What We Extract**:
- **Service Delivery Statements (p.78-82)**:
  - Total allocation: $489.1M
  - Detention operations: $443M (90.6%)
  - Community programs: $37.1M (7.6%)
- **Capital Works (p.145-148)**:
  - Wacol expansion: $149.2M
  - Woodford expansion: $261.4M
- **Performance Measures (p.83)**:
  - Cost per day claimed: $857
  - Actual cost (hidden): $1,570

**Why This Matters**:
- Exposes massive spending on failed approach
- Shows priorities (detention over prevention)
- Reveals true costs being hidden

---

### 5. Queensland Audit Office Reports

**What We Extract**:
- **Executive Summary**: Key findings
  - "$1.38 billion spent over 5 years"
  - "No single entity accountable"
- **Financial Analysis (Chapter 3)**:
  - Hidden costs breakdown
  - True per-day costs
- **Performance Data (Chapter 4)**:
  - Failure rates
  - Comparison with other states

**Why This Matters**:
- Independent verification of waste
- Accountability gaps exposed
- Performance failures documented

---

## 📊 Data Extraction Process

### Current Method (Manual Verification)
1. Download PDF from official source
2. Extract text using pdf-parse
3. Manually verify key statistics
4. Cross-reference with previous years
5. Store in structured JSON format
6. Load into database with full attribution

### Automated Pipeline (In Development)
```javascript
// Example extraction pattern for court data
const patterns = {
  totalDefendants: {
    regex: /total.*defendants.*?(\d{1,5})/i,
    page: 15,
    verification: value => value > 5000 && value < 15000
  },
  indigenousRate: {
    regex: /indigenous.*?(\d{1,3}\.?\d*)%/i,
    page: 18,
    verification: value => value > 50 && value < 90
  }
}
```

---

## 🔍 Quality Assurance

### 1. Source Verification
- ✅ Only .qld.gov.au domains
- ✅ Archive original PDFs
- ✅ Document page numbers
- ✅ Screenshot key tables

### 2. Data Validation
- Compare year-over-year trends
- Flag anomalies (>20% change)
- Cross-reference multiple sources
- Manual review of critical stats

### 3. Audit Trail
```json
{
  "extraction": {
    "source_pdf": "cc-ar-2023-2024.pdf",
    "extracted_date": "2025-07-05",
    "extracted_by": "manual",
    "page_references": {
      "total_defendants": "p.15, Table 2.1",
      "indigenous_rate": "p.18, Figure 3.2"
    },
    "verification_notes": "Cross-checked with 2022-23 data"
  }
}
```

---

## 🚨 Critical Findings We Track

### 1. The 86% Statistic
- **Source**: Children's Court AR 2023-24, p.18
- **Finding**: 86% of 10-11 year olds in court are Indigenous
- **Context**: Indigenous = 4.6% of QLD youth population
- **Impact**: 19x overrepresentation for youngest children

### 2. The 470 Children in Watch Houses
- **Source**: Children's Court AR 2023-24, p.35
- **Finding**: 470 children held in adult police cells
- **Duration**: Average 5-14 days
- **Impact**: UN says this is torture

### 3. The $1.38 Billion Waste
- **Source**: QAO Report 2024, Executive Summary
- **Finding**: $1.38B spent 2018-2023
- **Breakdown**: 90.6% on detention, 9.4% on prevention
- **Impact**: Massive spending, worsening outcomes

### 4. The 58% Reoffending Rate
- **Source**: QPS Statistical Review 2023-24, p.47
- **Finding**: 8,829 of 15,234 youth reoffend
- **Context**: After $443M on detention
- **Impact**: Current approach failing

---

## 📅 Update Schedule

### Annual Reports (Check July-August)
- Children's Court Annual Report
- Police Statistical Review
- AIHW Youth Justice Report
- Budget Papers (June)

### Quarterly Reports
- Youth Detention Census
- Inspector of Detention Services
- Crime Statistics Updates

### Ad-hoc Reports
- Parliamentary inquiries
- Audit Office reviews
- Human Rights Commission reports

---

## 🛠️ Technical Tools

### Current Stack
- **Firecrawl**: For web pages with PDF links
- **pdf-parse**: Extract text from PDFs
- **Manual verification**: Ensure accuracy
- **Supabase**: Store structured data

### Future Enhancements
1. **Tabula**: Extract data from PDF tables
2. **OCR**: Handle scanned documents
3. **NLP**: Auto-extract key statistics
4. **Diffbot**: Monitor for new PDFs
5. **GitHub Actions**: Automated checks

---

## 📈 Impact Tracking

We measure success by:
1. **Media citations** of our statistics
2. **Parliamentary questions** using our data
3. **Policy changes** influenced by evidence
4. **Public awareness** of true statistics
5. **Advocate usage** in campaigns

Every data point we extract serves the mission of exposing Queensland's youth justice failures and driving evidence-based reform.