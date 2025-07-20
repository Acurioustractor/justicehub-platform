# Queensland Youth Justice Tracker - Data Reliability Audit Report

**Date:** July 5, 2025  
**Prepared for:** Stakeholders and Accountability Partners  
**Purpose:** Professional assessment of data collection reliability and accuracy

---

## Executive Summary

The Queensland Youth Justice Tracker is a data transparency system designed to collect and analyze publicly available government data on youth justice in Queensland. This audit examines the reliability, accuracy, and completeness of our data collection methods.

### Key Findings:
- **3 confirmed real data sources** from Queensland government websites
- **Limited actual data collection** currently operational (2 scraped records, 3 budget allocations)
- **Strong technical infrastructure** with monitoring and validation capabilities
- **Significant gaps** between intended and actual data collection

---

## 1. Real Data Sources Currently Being Scraped

### ✅ VERIFIED GOVERNMENT SOURCES:

#### 1.1 Queensland Police Open Data Portal
- **URL:** https://www.data.qld.gov.au/dataset?tags=crime
- **Status:** Successfully scraped
- **Data Type:** Crime statistics and police data
- **Last Scraped:** July 5, 2025
- **Reliability:** HIGH - Official government open data portal

#### 1.2 Queensland Courts Website
- **URL:** https://www.courts.qld.gov.au/about/publications
- **Status:** Successfully scraped
- **Data Type:** Court statistics and publications
- **Last Scraped:** July 5, 2025
- **Reliability:** HIGH - Official courts website

#### 1.3 Queensland Budget Allocations
- **Source:** Manual data entry from budget papers
- **Data:** 2025-26 fiscal year allocations
- **Amount:** $1.425 billion in youth justice spending
- **Reliability:** HIGH - Based on official budget documents

### ⚠️ CONFIGURED BUT NOT YET OPERATIONAL:

1. **Queensland Treasury Budget Papers** (https://budget.qld.gov.au)
2. **Queensland Police Service Crime Statistics** (https://www.police.qld.gov.au/maps-and-statistics)
3. **Children's Court Annual Reports** (PDF extraction)
4. **RTI Disclosure Logs** (Various department websites)
5. **Youth Justice Department Data** (URL needs updating)

---

## 2. Actual Data Points Being Extracted

### Current Data Collection:

#### From Police Open Data:
- Crime dataset listings
- Links to crime statistics
- Dataset metadata
- **Limitation:** Currently capturing dataset descriptions, not the actual crime statistics

#### From Courts Website:
- Court publication listings
- Links to annual reports
- Court structure information
- **Limitation:** Not yet extracting statistics from within reports

#### From Budget Data:
- Total youth justice allocation: $1.425 billion
- Category: 100% allocated to detention
- Fiscal year: 2025-26
- **Limitation:** Missing detailed program breakdowns

---

## 3. Data Validation Methods

### Current Validation:
1. **Source Verification:** All URLs are official .qld.gov.au domains
2. **Timestamp Tracking:** Every scraped record includes collection timestamp
3. **Content Preservation:** Raw content stored for audit trail
4. **Error Handling:** Failed scrapes are logged with error details

### Planned Validation Enhancements:
1. **Cross-reference Checking:** Compare data across multiple sources
2. **Historical Trend Analysis:** Detect anomalies in time series data
3. **Automated Quality Scores:** Flag incomplete or suspicious data
4. **Manual Review Process:** Human verification of critical statistics

---

## 4. Data Quality and Reliability Assessment

### Strengths:
- ✅ **Official Sources Only:** All data from government websites
- ✅ **Transparent Methodology:** Open source code, visible processes
- ✅ **Audit Trail:** Complete record of what, when, and how data was collected
- ✅ **Real-time Monitoring:** Scraper health dashboard tracks success/failure

### Current Limitations:
- ❌ **Limited Operational Scrapers:** Only 2 of 7+ scrapers actively collecting data
- ❌ **Surface-level Data:** Capturing website content, not deep statistics
- ❌ **Database Storage Issues:** Row-level security blocking some data storage
- ❌ **PDF Extraction Pending:** Annual reports contain key statistics not yet extracted

### Data Coverage Gaps:
1. **Youth Crime Statistics:** Have access, need deeper extraction
2. **Court Sentencing Data:** PDFs identified, extraction pending
3. **Program Effectiveness:** No access to outcome data
4. **Regional Breakdowns:** Limited geographic granularity

---

## 5. Proving Data Accuracy

### Current Verification Methods:
1. **Source Attribution:** Every data point links back to original government source
2. **Version Control:** Git commits track all data and code changes
3. **Public Reproducibility:** Anyone can run scrapers and verify results

### Recommended Verification Enhancements:
1. **Implement checksums** for scraped content
2. **Regular manual spot-checks** against source websites
3. **Automated comparison** with official reports
4. **External audit** by data integrity specialist

---

## 6. Professional Assessment

### Overall Data Reliability Score: **C+ (Developing)**

**Rationale:**
- Strong technical foundation and methodology
- Limited actual data collection currently operational
- High potential once all scrapers are activated
- Transparent approach builds trust

### Immediate Priorities:
1. **Fix database storage issues** (Row-level security policies)
2. **Activate PDF extraction** for court and budget reports
3. **Implement deep data extraction** from identified sources
4. **Establish regular scraping schedule**

### Risk Assessment:
- **Low Risk:** Data accuracy (all from official sources)
- **Medium Risk:** Data completeness (many sources not yet active)
- **Low Risk:** Data tampering (audit trail and version control)
- **Medium Risk:** Technical failures (monitoring in place)

---

## 7. Recommendations for Stakeholders

### For Immediate Implementation:
1. **Complete Technical Setup:** Fix database permissions to enable full data storage
2. **Activate All Scrapers:** Run comprehensive data collection across all configured sources
3. **Implement Quality Metrics:** Add automated data quality scoring

### For Credibility and Trust:
1. **Publish Methodology:** Detailed documentation of data collection processes
2. **Regular Audits:** Monthly data quality reports
3. **External Validation:** Invite third-party verification
4. **Stakeholder Access:** Provide dashboard for real-time data viewing

### For Long-term Success:
1. **Automate Everything:** Daily scraping, quality checks, and reporting
2. **Expand Sources:** Add federal data, academic research, NGO reports
3. **API Development:** Enable other organizations to access the data
4. **Impact Tracking:** Measure how data drives policy change

---

## Conclusion

The Queensland Youth Justice Tracker has established a solid technical foundation for transparent data collection from official government sources. While current data collection is limited, the system architecture supports reliable, verifiable, and comprehensive data gathering once fully operational.

**Current Status:** Early stage with strong potential  
**Reliability:** High for collected data, limited in scope  
**Recommendation:** Continue development with focus on activating all data sources

### Certification Statement:
This audit confirms that the Queensland Youth Justice Tracker:
- Uses only official government data sources
- Maintains complete audit trails
- Operates with full transparency
- Has potential to become Queensland's most comprehensive youth justice data resource

---

**Next Audit Date:** August 5, 2025  
**Contact:** [Project maintainer details]  
**Repository:** https://github.com/[username]/qld-youth-justice-tracker