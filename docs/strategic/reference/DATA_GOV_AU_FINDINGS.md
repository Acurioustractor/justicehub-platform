# data.gov.au Exploration Findings

**Date**: 2025-10-11
**Script**: [explore-datagovau.ts](../src/scripts/discovery/explore-datagovau.ts)
**Report**: [datagovau-exploration-report.json](../data/datagovau-exploration-report.json)

## Summary

Explored **536 unique datasets** from data.gov.au using 11 search terms related to youth services, community services, and Queensland service providers.

## Key Findings

### ✅ Good News
- **536 datasets found** across search terms
- **400 datasets** have some relevance (score > 0)
- **225 datasets** may contain service provider listings
- **147 datasets** may contain contact information

### ⚠️ Challenges
- Most relevant datasets are **statistical/reporting** data, not service directories
- Many datasets focus on **government programs** not community organizations
- **Broken links**: Several top datasets return 404 errors
- Data is often **aggregated/summary** rather than detailed service listings
- Most promising datasets are from **Victoria/NSW**, not Queensland

## Top Datasets by Relevance

### 1. Department of Families, Fairness and Housing (VIC) - Score: 34
- **Contains**: Annual report data, grants, service outcomes
- **Format**: XLSX
- **Usefulness**: May have grants recipients (service provider names)
- **Issue**: Victoria-focused, not Queensland

### 2. Transitioning from Out-of-Home Care (VIC) - Score: 33
- **Contains**: Support services for Aboriginal young people
- **Format**: XLS
- **Usefulness**: May list service providers
- **Issue**: Victoria-focused, link broken (404)

### 3. Australian Government Cashless Debit Card - Score: 31
- **Contains**: Program information
- **Format**: PDF
- **Usefulness**: Limited - program info, not service directory

### 4. NSW Human Services Data Hub - NGO Providers - Score: 30
- **Contains**: NGO provider information
- **Format**: CSV, XLS, KML
- **Usefulness**: HIGH - appears to be actual NGO directory!
- **Issue**: Link broken (404), may be outdated (2014-15)

### 5. Youth Justice Detention Data (AIHW) - Score: 23
- **Contains**: Detention statistics
- **Format**: CSV
- **Usefulness**: LOW - statistics only, no service providers

## Data Types Found

### 📊 Statistical/Reporting (Most Common)
- Youth justice detention numbers
- Child protection statistics
- Service utilization rates
- Program outcomes

**Not useful for service directory**

### 💰 Grants & Funding (Potentially Useful)
- Grant recipients lists
- Funding allocations
- Contract data

**May contain organization names** but limited contact info

### 🏛️ Government Programs (Limited Use)
- Program descriptions
- Facility locations
- Policy documents

**Not service providers**

### 📋 Service Directories (RARE - What We Need!)
- NSW Human Services Data Hub (broken link)
- Some Victoria datasets (wrong state)

**Very few actual directories found**

## Geographic Distribution

Most relevant datasets are **NOT Queensland-specific**:
- Victoria: 40% of top results
- NSW: 25% of top results
- National: 20% of top results
- Queensland: 15% of top results

## Conclusion

### ❌ data.gov.au is NOT a viable source for Queensland service provider data

**Reasons**:
1. Focus on statistics, not directories
2. Geographic mismatch (mostly VIC/NSW)
3. Broken/outdated links
4. Government programs, not community services
5. No comprehensive service directory found

### ✅ What data.gov.au IS good for:
- Understanding service landscape (statistics)
- Identifying funded organizations (grants data)
- Research and policy context
- Government facility locations

## Better Alternatives

Based on this exploration, prioritize these instead:

### 1. **Infoxchange Service Seeker API** ⭐⭐⭐⭐⭐
- 400,000+ services Australia-wide
- Regularly updated
- Proper directory structure
- **Action**: Use [INFOXCHANGE_CONTACT_TEMPLATE.md](INFOXCHANGE_CONTACT_TEMPLATE.md)

### 2. **State Government Grants Databases** ⭐⭐⭐⭐
- Queensland Government grants portal
- Lists funding recipients
- Organization names and sometimes contact details
- **Action**: Scrape grants.qld.gov.au

### 3. **Peak Body Member Directories** ⭐⭐⭐⭐
- QATSICPP, PeakCare, QCOSS, YANQ
- Current members with websites
- Curated, verified listings
- **Action**: Build peak body scraper

### 4. **Google Places API** ⭐⭐⭐
- Comprehensive coverage
- Contact information included
- Location-based search
- **Action**: Implement Places API integration

### 5. **Local Government Portals** ⭐⭐⭐
- Brisbane, Gold Coast, etc.
- May have community service directories
- Regional coverage
- **Action**: Check each LGA's website

### 6. **My Community Directory** ⭐⭐⭐⭐
- Aggregates 200+ QLD datasets
- Community-maintained
- Good coverage
- **Action**: Research their API/data sources

## Datasets Worth Manual Review

Despite broken links, these may be worth contacting publishers:

1. **NSW Human Services Data Hub NGO providers** (2014-15)
   - Contact: NSW Department of Customer Service
   - Ask: Updated version? Queensland equivalent?

2. **Department of Families grants data** (VIC)
   - May provide template for QLD equivalent
   - Grants recipients = service providers

3. **AIHW Youth Justice data**
   - Good for context/statistics
   - May reference service providers in reports

## Script Usage

```bash
# Re-run exploration with updated search terms
NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/discovery/explore-datagovau.ts

# Results saved to:
data/datagovau-exploration-report.json
```

## Recommendations

### Immediate (Don't Pursue)
- ❌ Don't spend more time on data.gov.au
- ❌ Don't try to extract service providers from statistics datasets
- ❌ Don't rely on broken/outdated dataset links

### Short Term (Do This Instead)
- ✅ Contact Infoxchange (highest priority)
- ✅ Scrape QLD government grants recipients
- ✅ Build peak body member scrapers
- ✅ Get Google Places API key

### Medium Term
- ✅ Contact dataset publishers directly for updated data
- ✅ Check for Queensland equivalents of NSW/VIC datasets
- ✅ Build relationships with government agencies

## Key Takeaway

**data.gov.au is valuable for research and context, but not a source of comprehensive service provider listings.**

The platform's strength is in **statistical data and government transparency**, not community service directories. Our best path forward is:
1. Infoxchange API (commercial partnership)
2. Grants databases (publicly available)
3. Peak bodies (member directories)
4. Google Places (comprehensive coverage)

---

**Exploration complete**: 536 datasets searched, 0 viable service directories found for Queensland.

**Status**: ❌ data.gov.au ruled out as primary source
**Next focus**: Infoxchange partnership + grants data scraping
