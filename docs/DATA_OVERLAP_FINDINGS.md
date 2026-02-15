# Data Overlap Analysis Findings
## Critical Issues & Recommended Actions

**Date:** 2026-02-13  
**Analysis Tool:** `alma-data-overlap-checker.mjs`

---

## 🚨 Critical Findings

### 1. URL Duplication (HIGH PRIORITY)

**Finding:** 127 URLs appear multiple times across the database

**Impact:** 
- Same source documents linked to multiple interventions
- Inflated discovery metrics
- Potential confusion about unique programs

**Examples:**
```
https://www.justice.vic.gov.au/youth-justice
├── Used by 15+ interventions:
│   - Youth Diversion
│   - Youth Justice Community Support Service
│   - Youth Justice Group Conferencing
│   - Youth Justice Court Advice Service (YJCAS)
│   - Youth Engagement Grants
│   - Youth Crime Prevention Grants
│   - Koori Youth Justice Programs
│   - And 8 more...
```

**Root Cause:** 
- Multiple programs on same government portal page
- Each program extracted separately but source URL identical
- No sub-page URL differentiation

**Recommendation:**
```javascript
// Add URL specificity scoring
// Mark interventions with shared URLs
// Create parent-child relationships for program clusters
```

---

### 2. Evidence Unlinked (CRITICAL)

**Finding:** 94 out of 100 evidence records (94%) are NOT linked to interventions

**Impact:**
- Cannot assess intervention effectiveness
- Missing research backing for programs
- Portfolio signals cannot calculate properly

**Status:**
```
Evidence Records: 100
├── Linked to interventions: 6 (6%)
└── Unlinked: 94 (94%)

Interventions: 1,115
├── With evidence links: 184 (16%)
└── Without evidence: 931 (84%)
```

**Root Cause:**
- Evidence and interventions scraped separately
- No automated linking process
- Manual linking not performed

**Recommendation:**
```bash
# URGENT: Run evidence linking script
node scripts/alma-evidence-linker.mjs --batch all

# Match criteria:
# - Keyword overlap (intervention name ↔ evidence title)
# - Organization match
# - Geographic match
# - Manual review queue
```

---

### 3. Duplicate Intervention Names

**Finding:** 7 intervention names appear multiple times

**Examples:**
```
"Aboriginal parents: supervision and kids | Raising Children Network" (2x)
"Disposable nappies: Aboriginal parents | Raising Children Network" (2x)
"Babies growing well: Aboriginal parents | Raising Children Network" (2x)
"Kids' teeth care: Aboriginal families | Raising Children Network" (2x)
"Activities for Aboriginal parents & kids: play & learning" (2x)
```

**Impact:**
- Search result duplication
- Confusion for users
- Inflated program counts

**Root Cause:**
- Raising Children Network pages scraped multiple times
- Deduplication script not catching these
- URL variations not normalized

**Recommendation:**
```bash
# Run deduplication with name similarity
node scripts/alma-deduplicate-enhanced.mjs --mode merge --confirm

# Review Raising Children Network imports
# Normalize URLs before insertion
```

---

### 4. Shared Source URLs

**Finding:** Many interventions share the same source URL

**Top Shared URLs:**
| URL | Interventions | Issue |
|-----|--------------|-------|
| justice.vic.gov.au/youth-justice | 15+ | Portal page, not specific |
| royalcommission.gov.au/child-detention | 3 | NT specific |
| raisingchildren.net.au/... | 5+ | Multiple articles |
| pc.gov.au/ongoing/report-on-government | 2 | ROGS report |

**Impact:**
- Cannot trace to specific program details
- Broken link affects multiple records
- Hard to verify individual programs

**Recommendation:**
```yaml
# Add URL specificity field
interventions:
  - source_specificity: portal | program_page | document | homepage
  
# For portal pages, extract sub-page URLs
# Add link to parent/portal record
# Create URL hierarchy tracking
```

---

## 📊 Data Quality Metrics

### Field Completeness (GOOD)
| Field | Completeness | Status |
|-------|--------------|--------|
| Name | 100% | ✅ |
| Type | 100% | ✅ |
| Description | 96.3% | ✅ |
| Consent Level | 100% | ✅ |
| Cultural Authority | 100% | ✅ |

### Relationship Health (POOR)
| Relationship | Coverage | Status |
|--------------|----------|--------|
| Intervention ↔ Evidence | 6% | 🔴 |
| Intervention ↔ Context | <1% | 🔴 |
| Intervention ↔ Outcome | <5% | 🔴 |
| Intervention ↔ Service Link | 5% | 🟡 |

### Uniqueness (MEDIUM)
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Duplicate URLs | 127 | <50 | 🔴 |
| Duplicate Names | 7 | <5 | 🟡 |
| Unique Interventions | 99.3% | >95% | ✅ |

---

## 🎯 Priority Actions

### Immediate (This Week)

1. **Evidence Linking Campaign** 🔴
   ```bash
   # Run automated linking
   node scripts/alma-evidence-linker.mjs --all
   
   # Manual review queue
   # Target: 500+ new evidence links
   ```

2. **URL Deduplication** 🔴
   ```bash
   # Merge interventions with identical source URLs
   # Create parent-child relationships
   # Add URL specificity metadata
   ```

3. **Raising Children Network Cleanup** 🟡
   ```bash
   # Remove duplicate Raising Children Network entries
   # Normalize article URLs
   # Consolidate parenting resources
   ```

### Short-term (This Month)

4. **Source URL Enrichment** 🟡
   ```bash
   # For portal URLs, discover sub-page links
   # Extract specific program URLs
   # Update interventions with specific URLs
   ```

5. **Relationship Building** 🟡
   ```bash
   # Link interventions to contexts (geographic)
   # Link interventions to outcomes
   # Create outcome measurement relationships
   ```

### Medium-term (Next Quarter)

6. **Data Lineage Tracking** 🟢
   ```sql
   -- Add source extraction metadata
   ALTER TABLE alma_interventions ADD COLUMN extraction_metadata JSONB;
   -- Track: extraction date, method, confidence
   ```

7. **Automated Quality Checks** 🟢
   ```bash
   # Weekly overlap reports
   # Automated deduplication suggestions
   # Quality score dashboard
   ```

---

## 🔧 Technical Recommendations

### 1. URL Normalization
```javascript
// Before insertion, normalize URLs
function normalizeUrl(url) {
  return url
    .split('?')[0]  // Remove query params
    .replace(/\/$/, '')  // Remove trailing slash
    .replace(/^https?:\/\//, '')  // Remove protocol
    .toLowerCase();
}

// Check for duplicates before insert
```

### 2. Source Specificity Scoring
```javascript
// Score URL specificity
function getUrlSpecificity(url) {
  if (url.match(/\/(programs?|services?)\/[^\/]+$/)) return 10;  // Program page
  if (url.match(/\/[^\/]+\.pdf$/)) return 9;  // Document
  if (url.match(/\/about|contact|home/)) return 3;  // Generic
  if (url.split('/').length <= 3) return 2;  // Root/section
  return 5;  // Default
}
```

### 3. Evidence Linking Algorithm
```javascript
// Link evidence to interventions
async function linkEvidenceToInterventions() {
  const evidence = await getAllEvidence();
  const interventions = await getAllInterventions();
  
  for (const e of evidence) {
    const matches = interventions.filter(i => {
      // Name similarity
      const nameSim = similarity(i.name, e.title);
      // Organization match
      const orgMatch = i.operating_organization === e.organization;
      // Keyword overlap
      const keywords = extractKeywords(i.description);
      const evidenceKeywords = extractKeywords(e.findings);
      const keywordOverlap = intersection(keywords, evidenceKeywords);
      
      return nameSim > 0.6 || orgMatch || keywordOverlap.length > 3;
    });
    
    // Create links
    for (const match of matches) {
      await createInterventionEvidenceLink(match.id, e.id);
    }
  }
}
```

---

## 📈 Success Metrics

Track these metrics weekly:

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Evidence linked | 6% | 50% | 1 month |
| Duplicate URLs | 127 | <50 | 2 weeks |
| Duplicate names | 7 | <3 | 2 weeks |
| Interventions with evidence | 16% | 40% | 1 month |
| URL specificity score avg | N/A | >7 | 1 month |

---

## 🎓 Lessons Learned

1. **Portal Pages Problem:** Government portals list multiple programs but interventions are extracted with same URL
2. **Evidence Separation:** Evidence and interventions scraped separately without linking
3. **Deduplication Gaps:** Fuzzy matching needs tuning for parenting resources
4. **URL Normalization:** Query parameters and trailing slashes create false uniqueness
5. **Relationship Importance:** 84% of interventions lack evidence links (critical gap)

---

**Next Steps:**
1. Execute evidence linking campaign
2. Run deduplication on Raising Children Network entries
3. Implement URL specificity scoring
4. Create parent-child relationships for portal pages

---

*This analysis is part of the Data Governance Master Plan.*
