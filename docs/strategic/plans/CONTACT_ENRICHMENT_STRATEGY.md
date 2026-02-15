# Contact Information Enrichment Strategy

## Current Status

**As of 2025-10-11:**
- Total services: 403
- Services with websites: 51 (13%)
- Services with phone: 41 (10%)
- Services with email: 22 (5%)
- Services with address: 10 (2%)
- **Overall contact completeness: 7%**

## Target Goals

### 6-Month Goals
- Websites: 13% → 60% (242 services)
- Phone numbers: 10% → 50% (202 services)
- Emails: 5% → 40% (161 services)
- Addresses: 2% → 30% (121 services)
- **Overall completeness: 7% → 45%**

### 12-Month Goals
- Websites: 60% → 80% (322 services)
- Phone numbers: 50% → 70% (282 services)
- Emails: 40% → 60% (242 services)
- Addresses: 30% → 50% (202 services)
- **Overall completeness: 45% → 65%**

## Priority Matrix

### Tier 1: Government-Verified Services (High Priority)
- **Count**: ~20 services
- **Target completeness**: 90%+
- **Method**: Manual research + official sources
- **Timeline**: Week 1

### Tier 2: Major Organizations (High Priority)
- **Count**: ~50 services
- **Criteria**: Large, well-known organizations (Anglicare, Mission Australia, etc.)
- **Target completeness**: 80%+
- **Method**: Organization websites + API if available
- **Timeline**: Weeks 1-2

### Tier 3: Medium Organizations (Medium Priority)
- **Count**: ~150 services
- **Criteria**: Regional services, local organizations
- **Target completeness**: 60%+
- **Method**: Web scraping + manual verification
- **Timeline**: Weeks 3-6

### Tier 4: Small/Individual Services (Lower Priority)
- **Count**: ~183 services
- **Criteria**: Individual programs, small providers
- **Target completeness**: 40%+
- **Method**: Bulk enrichment + community contributions
- **Timeline**: Months 2-6

## Enrichment Methods

### Method 1: Manual Research (Most Accurate, Time-Intensive)

**Best for**: Tier 1 & 2 services

**Process**:
1. Google search for organization name
2. Visit official website
3. Navigate to "Contact Us" page
4. Extract and verify contact information
5. Add to database

**Time estimate**: 5-10 minutes per service
**Accuracy**: 95%+
**Cost**: Time only

**Script**:
```bash
# No automation - use web interface or direct database updates
# Create admin panel for manual entry
```

### Method 2: Organization Website Scraping (Automated, Medium Accuracy)

**Best for**: Tier 2 & 3 services

**Process**:
1. For services with known websites
2. Use Playwright to visit website
3. Use Claude to extract contact info from page
4. Store with confidence score
5. Flag for manual verification

**Time estimate**: 2-3 minutes per service (automated)
**Accuracy**: 70-80%
**Cost**: API calls (~$0.01 per service)

**Script**: Create `/src/scripts/enrich-service-contacts.ts`

### Method 3: Google Places API (Automated, Good Coverage)

**Best for**: Tier 3 & 4 services, especially location-based

**Process**:
1. Search Google Places for organization name + location
2. Extract: phone, address, website, hours
3. Match to existing services
4. Add contact information

**Time estimate**: Instant per service
**Accuracy**: 60-70%
**Cost**: $0.005 per API call
**Budget**: $2-5 per 1000 services

**Script**: Create `/src/scripts/integrations/google-places-enrichment.ts`

### Method 4: Social Media APIs (Supplementary)

**Best for**: Organizations with strong social presence

**APIs to Consider**:
- LinkedIn Company Pages
- Facebook Pages API
- Instagram Business Profiles

**Data extractable**:
- Website URLs
- Contact emails
- Physical addresses
- Phone numbers

**Limitations**: API access restrictions, rate limits

### Method 5: Perplexity Research (AI-Powered, Comprehensive)

**Best for**: Tier 1 & 2 when other methods fail

**Process**:
1. Use Perplexity AI to research organization
2. Prompt: "Find contact information for [Organization Name] in [City], Queensland"
3. Extract structured data
4. Verify with high confidence threshold

**Time estimate**: 30-60 seconds per service
**Accuracy**: 80-90%
**Cost**: $0.005-0.01 per request
**Budget**: $2-4 per 1000 services

**Script**: Create `/src/scripts/research/perplexity-contact-research.ts`

### Method 6: Community Contributions (Scalable, Ongoing)

**Best for**: All tiers, long-term sustainability

**Features to build**:
- Service provider self-registration
- Community member suggestions
- Verification workflow
- Reputation system

**Implementation**:
```typescript
// src/app/contribute/page.tsx - Public contribution form
// src/app/admin/verify/page.tsx - Admin verification queue
// src/lib/verification-queue.ts - Verification logic
```

## Implementation Roadmap

### Week 1: Foundation
- [x] Implement verification system (completed)
- [ ] Identify Tier 1 services (20 government-verified)
- [ ] Manual research for Tier 1 services
- [ ] Target: 20 services @ 90% completeness

### Week 2: Major Organizations
- [ ] Create website scraping script
- [ ] Enrich Tier 2 services (50 major orgs)
- [ ] Set up Google Places API
- [ ] Target: 50 services @ 80% completeness

### Weeks 3-4: Automation
- [ ] Implement Google Places bulk enrichment
- [ ] Create Perplexity research script
- [ ] Process Tier 3 services (150 services)
- [ ] Target: 150 services @ 60% completeness

### Months 2-3: Scale
- [ ] Bulk enrich remaining services
- [ ] Build community contribution platform
- [ ] Implement verification queue
- [ ] Target: All services @ 40%+ completeness

### Months 4-6: Refinement
- [ ] Manual verification of high-traffic services
- [ ] Re-enrich stale data
- [ ] Community engagement campaigns
- [ ] Target: 65% overall completeness

## Quality Assurance

### Data Validation Rules

```typescript
interface ContactValidation {
  phone: {
    format: /^(\+61|0)[2-9]\d{8}$/, // Australian phone
    required: false
  },
  email: {
    format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    required: false
  },
  website: {
    format: /^https?:\/\/.+/,
    checkAvailable: true, // HTTP HEAD request
    required: false
  },
  address: {
    minLength: 10,
    mustInclude: ['Queensland', 'QLD'] // State required
  }
}
```

### Confidence Scoring

```typescript
function calculateConfidenceScore(
  source: string,
  method: string,
  verification: boolean
): number {
  let score = 0;

  // Source weight
  if (source === 'official_website') score += 40;
  else if (source === 'government') score += 50;
  else if (source === 'google_places') score += 30;
  else if (source === 'ai_research') score += 25;

  // Method weight
  if (method === 'manual') score += 40;
  else if (method === 'automated_verified') score += 30;
  else if (method === 'automated') score += 20;

  // Verification weight
  if (verification) score += 20;

  return Math.min(score, 100);
}
```

### Verification Workflow

1. **Automated Enrichment** → Confidence score 0-60%
2. **Pending Verification** → Human review if high-traffic service
3. **Verified** → Confidence score 60-90%
4. **Featured** → Confidence score 90%+, manually verified

## Scripts to Create

### Priority 1: Website Scraper
```bash
/src/scripts/enrich-service-contacts.ts
```
- For services with existing website URLs
- Use Claude to extract contact page info
- Update database with confidence scores

### Priority 2: Google Places Integration
```bash
/src/scripts/integrations/google-places-enrichment.ts
```
- Search for organization names in Google Places
- Match results to existing services
- Extract and store contact information

### Priority 3: Perplexity Research
```bash
/src/scripts/research/perplexity-contact-research.ts
```
- For high-priority services without contacts
- AI-powered web research
- Structured extraction

### Priority 4: Batch Processing Manager
```bash
/src/scripts/batch-enrich-services.ts
```
- Orchestrates all enrichment methods
- Processes services by priority tier
- Rate limiting and error handling
- Progress tracking and reporting

## Budget Estimates

### API Costs (Monthly)

**Google Places API**:
- 400 services @ $0.005 = $2.00
- Ongoing updates: ~$5-10/month

**Perplexity AI**:
- 100 high-priority services @ $0.01 = $1.00
- Research queries: ~$10-20/month

**Claude API** (for extraction):
- 400 services @ $0.01 = $4.00
- Ongoing: ~$10-20/month

**Total estimated**: $25-50/month for automation

### Time Investment

**Manual research** (Tier 1 & 2):
- 70 services @ 7 minutes = ~8 hours
- Spread over 2 weeks: ~30 minutes/day

**Script development**:
- Website scraper: 3-4 hours
- Google Places integration: 2-3 hours
- Perplexity research: 2-3 hours
- Batch manager: 2-3 hours
- **Total**: 10-13 hours development time

**Ongoing maintenance**:
- Verification queue: 15 minutes/day
- Monthly updates: 2-3 hours/month

## Success Metrics

### Weekly Tracking
```bash
NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/service-data-quality.ts
```

Track:
- Contact completeness %
- Services by verification status
- New services added
- Services updated

### Monthly Goals
- Week 1: 7% → 15% completeness
- Month 1: 15% → 30% completeness
- Month 3: 30% → 45% completeness
- Month 6: 45% → 65% completeness

## Risk Mitigation

### Data Quality Risks
- **Outdated information**: Implement 6-month re-verification
- **Incorrect data**: Confidence scoring + user reporting
- **Duplicates**: Deduplication on enrichment

### Legal/Ethical Risks
- **Scraping ToS**: Only scrape public pages, respect robots.txt
- **API limits**: Implement rate limiting, caching
- **Privacy**: Only store publicly available contact info

### Technical Risks
- **API changes**: Monitor API status, have fallbacks
- **Rate limiting**: Implement exponential backoff
- **Costs**: Budget monitoring, usage caps

## Next Steps

### This Week
1. [ ] Identify 20 Tier 1 services
2. [ ] Manual research for Tier 1
3. [ ] Create website scraper script
4. [ ] Test on 10 services

### Next Week
5. [ ] Set up Google Places API key
6. [ ] Implement Google Places enrichment
7. [ ] Process Tier 2 services
8. [ ] Review and verify results

### This Month
9. [ ] Build Perplexity research script
10. [ ] Create batch processing manager
11. [ ] Process all Tier 3 services
12. [ ] Achieve 30% overall completeness

---

**Document created**: 2025-10-11
**Current completeness**: 7%
**6-month target**: 45%
**12-month target**: 65%
**Status**: Strategy defined, ready for implementation
