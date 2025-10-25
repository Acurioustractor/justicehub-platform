# Queensland Open Data Portal Exploration

**Date:** 2025-10-11
**Purpose:** Identify datasets containing Queensland youth justice service providers

## Summary

The Queensland Open Data Portal (data.qld.gov.au) has **limited service provider data** available for direct import.

## Key Findings

### 1. Children, Youth Justice and Multicultural Affairs Organization

**URL:** https://www.data.qld.gov.au/organization/children-youth-justice-and-multicultural-affairs

**Available Datasets:**
- Youth Justice - referrals to youth justice conferencing (CSV)
  - Contains referral statistics, not service provider information
  - Not useful for service directory

### 2. Social Services Group

**URL:** https://www.data.qld.gov.au/group/social-services

- Limited datasets available
- No comprehensive service provider directory found

### 3. Youth Justice Centre Locations

**URL:** https://www.data.qld.gov.au/dataset/youth-justice-centre-locations

- Contains government-run youth justice detention centres only
- Not community service providers
- Already have this information

### 4. Funding Datasets

- Get Started program funding (sports vouchers)
- Artist in residence funding
- None related to youth justice service providers

## Conclusion

**Queensland Open Data Portal is NOT a viable source for bulk service provider data.**

The portal focuses on:
- Government statistics and reports
- Facility locations (detention centres)
- Program outcomes and referrals
- Administrative data

It does NOT contain:
- Community service provider directories
- NGO/non-profit contact information
- Comprehensive service listings

## Alternative Recommendation

Based on this exploration, the priority data sources should be:

### ✅ **Completed:**
1. Government provider list (43 providers - DONE)
2. Airtable CSV import (325 organizations - DONE)
3. Justice reinvestment sites (11 services - DONE)

### 🎯 **High Priority Next Steps:**

1. **Infoxchange Service Seeker API** (Highest ROI)
   - Estimated +2,000-5,000 services
   - Professional directory with verified data
   - Contact: partnerships@infoxchange.org

2. **Peak Body Member Directories**
   - QCOSS (Queensland Council of Social Service)
   - Youth Affairs Network Queensland (YANQ)
   - Estimated +100-300 services

3. **Google Places API Integration**
   - Search for organizations by category and location
   - Estimated +300-800 services

4. **AI-Powered Discovery**
   - Use Claude/Perplexity to research specific service categories
   - Estimated +500-1,500 services

## Data Quality Status (As of Import)

**Current Database:**
- **403 total services** (started with 32)
- 13% have websites
- 10% have phone numbers
- 66% have multiple categories
- 35 services added from government list

**Growth Path:**
- Current: 403 services
- 3-month target: 2,000+ services
- 6-month target: 5,000+ services

---

*See [SCRAPER_SCALING_STRATEGY.md](/docs/SCRAPER_SCALING_STRATEGY.md) for detailed implementation plans for each data source.*
