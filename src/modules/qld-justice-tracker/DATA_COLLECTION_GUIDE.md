# Queensland Youth Justice - Data Collection Strategy

## Current PDF Sources & Extraction

### 1. Children's Court Annual Reports
**URLs**: 
- 2023-24: `https://www.courts.qld.gov.au/__data/assets/pdf_file/0006/819771/cc-ar-2023-2024.pdf`
- 2022-23: `https://www.courts.qld.gov.au/__data/assets/pdf_file/0010/786466/cc-ar-2022-2023.pdf`

**Update Frequency**: Annual (July-August)

**Data We Extract**:
- Total defendants (8,457 in 2023-24)
- Indigenous percentage (61.9%)
- Age breakdown (10-17 years)
- Bail refusal rates (25.4%)
- Time to finalization (127 days average)
- Detention orders vs community orders
- Watch house statistics

**Key Finding**: 86% of 10-11 year olds in court are Indigenous

---

### 2. Youth Detention Census
**URL**: `https://www.cyjma.qld.gov.au/resources/dcsyw/youth-justice/publications/yj-census-summary.pdf`

**Update Frequency**: Quarterly

**Data We Extract**:
- Total youth in detention (338)
- Indigenous percentage (73.4%)
- Remand vs sentenced (68.3% on remand)
- Age distribution
- Capacity utilization (107%)
- Average length of stay

**Key Finding**: 16x Indigenous overrepresentation in detention

---

### 3. Queensland Police Statistical Review
**URL**: `https://www.police.qld.gov.au/sites/default/files/2024-08/QPS%20Statistical%20Review%202023-24.pdf`

**Update Frequency**: Annual (August)

**Data We Extract**:
- Youth offender numbers (15,234)
- Repeat offender rate (58%)
- Serious repeat offenders (367)
- Crime categories
- Regional distribution
- 10-year trends

**Key Finding**: Youth crime at near-decade lows despite political rhetoric

---

### 4. State Budget Papers
**URL**: `https://budget.qld.gov.au/files/Budget_2024-25_DCSSDS_Budget_Statements.pdf`

**Update Frequency**: Annual (June)

**Data We Extract**:
- Total youth justice budget ($489.1M)
- Detention operations ($443M - 90.6%)
- Community programs ($37.1M - 7.6%)
- Infrastructure spending
- Cost per detention day ($857 claimed, $1,570 actual)

**Key Finding**: 92.3% of budget goes to failed detention approach

---

### 5. Queensland Audit Office Reports
**URL**: `https://www.qao.qld.gov.au/reports-resources/managing-youth-justice-demand`

**Update Frequency**: Periodic audits

**Data We Extract**:
- Total system spending ($1.38B over 5 years)
- Hidden costs analysis
- Accountability gaps
- Performance metrics

**Key Finding**: "No single entity is accountable for youth justice system success"

---

## Automated Collection Strategy

### Phase 1: PDF Monitoring (Immediate)
```javascript
// Check for new reports monthly
const sources = [
  {
    name: 'Childrens Court Annual Report',
    checkUrl: 'https://www.courts.qld.gov.au/courts/childrens-court/annual-reports',
    pattern: /cc-ar-(\d{4}-\d{4})\.pdf/,
    frequency: 'annual',
    expectedMonth: 'July'
  },
  {
    name: 'Youth Detention Census',
    checkUrl: 'https://www.cyjma.qld.gov.au/resources/resource/youth-justice-census',
    pattern: /yj-census.*\.pdf/,
    frequency: 'quarterly'
  }
]
```

### Phase 2: Data Extraction Pipeline
1. **PDF Detection**: Monitor government sites for new PDFs
2. **Download & Archive**: Store all source documents
3. **Text Extraction**: Use pdf-parse for text content
4. **Data Parsing**: Extract specific metrics using patterns
5. **Validation**: Cross-check against previous years
6. **Storage**: Update database with new statistics

### Phase 3: Quality Assurance
- Compare new data against historical trends
- Flag anomalies for manual review
- Maintain audit trail of all changes
- Version control for data updates

---

## Additional Sources to Add

### High Priority
1. **Inspector of Detention Services Reports**
   - Detention conditions
   - Human rights violations
   - Updated quarterly

2. **Queensland Human Rights Commission**
   - Discrimination complaints
   - System reviews
   - Annual reports

3. **Office of the Public Guardian**
   - Child safety to youth justice pipeline
   - Dual-order children
   - Annual reports

### Medium Priority
1. **Sentencing Advisory Council**
   - Sentencing patterns
   - Recidivism analysis
   - Research reports

2. **Crime and Corruption Commission**
   - Police misconduct with youth
   - System corruption issues
   - Investigation reports

---

## Data Verification Process

### 1. Source Verification
- Only use .qld.gov.au domains
- Archive original PDFs
- Maintain source URLs
- Document page references

### 2. Data Validation
- Cross-reference multiple sources
- Check year-over-year consistency
- Flag significant changes
- Manual review of outliers

### 3. Update Schedule
- **Daily**: Check for new releases
- **Weekly**: Process new PDFs
- **Monthly**: Full data validation
- **Quarterly**: Comprehensive report

---

## Key Metrics We Track

### Primary Indicators
1. Indigenous overrepresentation factor
2. Total youth in detention
3. Budget allocation percentages
4. Repeat offender rates
5. Bail refusal rates
6. Watch house numbers

### Calculated Metrics
1. Cost per youth per day
2. Detention vs community spending ratio
3. Overrepresentation trends
4. System capacity utilization
5. Geographic disparities

### Performance Metrics
1. Time to finalization
2. Successful completion rates
3. Return to detention rates
4. Age at first contact
5. Escalation patterns

---

## Technical Implementation

### Current Tools
- **Firecrawl**: Web scraping for dynamic content
- **pdf-parse**: PDF text extraction
- **Supabase**: Data storage
- **Node.js**: Automation scripts

### Planned Improvements
1. **OCR Integration**: For scanned PDFs
2. **ML Classification**: Auto-categorize new documents
3. **API Development**: Real-time data access
4. **Alerting System**: Notify on new data/anomalies
5. **Dashboard**: Public visualization

---

## Sustainability Plan

### 1. Automation
- Scheduled scrapers running daily
- Automatic PDF detection
- Self-healing error recovery
- Minimal manual intervention

### 2. Documentation
- Clear data dictionary
- Source documentation
- Update procedures
- Troubleshooting guide

### 3. Community
- Open source codebase
- Contribution guidelines
- Data verification by advocates
- Transparent methodology

### 4. Funding
- Low operational costs (~$50/month)
- Grant applications for expansion
- Community sponsorship
- Pro-bono technical support

---

## Impact Measurement

Track how our data is used:
1. Media citations
2. Parliamentary questions
3. Policy changes
4. Public awareness
5. Advocacy campaigns

This system ensures continuous, reliable collection of youth justice data to drive evidence-based reform in Queensland.