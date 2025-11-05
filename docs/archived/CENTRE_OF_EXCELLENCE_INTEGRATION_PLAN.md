# Centre of Excellence - Global Best Practices Integration Plan

**Date:** 2025-10-26
**Status:** Database Schema Created, Ready for Data Population

## Overview

The Centre of Excellence section will integrate global best practices in youth justice, enabling:
- International program database with evidence-based outcomes
- Collaboration tracking (visits, exchanges, invitations)
- Australian adaptation documentation
- Comparative analysis tools

## What's Already Built

### 1. Existing Pages
- ✅ `/centre-of-excellence` - Main landing page with sections overview
- ✅ `/centre-of-excellence/global-insights` - International models showcase
- ✅ `/centre-of-excellence/map` - Interactive global excellence map
- ✅ `/centre-of-excellence/research` - Research repository
- ✅ `/centre-of-excellence/best-practice` - Best practices documentation

### 2. Database Schema Created

Five new tables for managing international programs:

**`international_programs`** - Main table for global programs
- Program details (name, country, region, approach)
- Outcomes and evidence (recidivism rates, key metrics)
- Australian connections and adaptations
- Visit/collaboration status

**`program_outcomes`** - Detailed outcome tracking
- Specific metrics per program
- Comparison values and timeframes
- Source documentation

**`best_practices`** - Cross-cutting principles
- Evidence-based practice frameworks
- Example programs demonstrating each principle
- Australian implementation guidance

**`program_visits`** - Exchange tracking
- In-person and virtual visits
- Participants and organizations
- Outcomes and follow-up actions

**`international_invitations`** - Invitation management
- Inviting international experts to Australia
- Status tracking (sent, accepted, completed)
- Visit reports and documentation

### 3. Data Prepared

12 exemplary programs extracted from your global best practices document:

**North America:**
1. Missouri Model (USA) - <8% recidivism
2. MST/FFT Family Therapy (USA) - 31% recidivism reduction
3. Wraparound Milwaukee (USA) - 50%+ lower recidivism
4. Roca Inc. (USA) - 29% incarceration rate for high-violence youth
5. JDAI (USA) - 40% detention reduction across 300+ counties

**Europe:**
6. Youth Conferencing (Northern Ireland) - 19% reoffending for diversionary conferences
7. HALT Program (Netherlands) - Nationwide diversion with positive outcomes

**Asia-Pacific:**
8. Police Cautioning (Hong Kong) - <20% recidivism
9. Family Group Conferencing (New Zealand) - >50% reduction in youth institutions

**Australasia:**
10. Maranguka Justice Reinvestment (Australia) - 38% reduction in youth crime

**Africa:**
11. NICRO Diversion (South Africa) - 6.7% reoffending rate

**Latin America:**
12. Progression Units (Brazil) - ~4% recidivism rate

## Next Steps to Complete Integration

### Step 1: Create Database Tables ⚠️ REQUIRED

**Option A: Supabase Dashboard (Recommended)**
1. Log into Supabase dashboard
2. Go to SQL Editor
3. Copy contents of `/supabase/migrations/20250126000004_create_centre_of_excellence.sql`
4. Execute the SQL

**Option B: Simplified SQL (If migration fails)**
Use the simplified SQL from `/CENTRE_OF_EXCELLENCE_SETUP.md`

### Step 2: Populate Initial Data

Once tables exist, run:
```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/populate-global-programs.ts
```

This will add the 12 initial programs to the database.

### Step 3: Update UI to Use Database

**Current State:** The global-insights page uses static data from `/src/content/excellence-map-locations.ts`

**Needed Changes:**
1. Create API route `/src/app/api/international-programs/route.ts` to fetch from database
2. Update `/src/app/centre-of-excellence/global-insights/page.tsx` to fetch from API instead of static data
3. Add filtering by region, program type, evidence strength
4. Create individual program detail pages at `/centre-of-excellence/programs/[slug]/page.tsx`

### Step 4: Build Programs Database Page

Create `/src/app/centre-of-excellence/programs/page.tsx` with:
- Searchable/filterable list of all programs
- Region filters (North America, Europe, Asia-Pacific, etc.)
- Program type filters (Custodial Reform, Diversion, etc.)
- Evidence strength filters
- Sort by recidivism rate, year established, etc.

### Step 5: Enable Collaboration Features

Create admin pages for:
- Recording program visits
- Managing invitations
- Documenting Australian adaptations
- Uploading resources and reports

## Key Features to Implement

### 1. Program Comparison Tool
Allow side-by-side comparison of international programs with Australian initiatives:
- Recidivism rates
- Cost-benefit analysis
- Implementation requirements
- Cultural adaptations needed

### 2. Evidence Hierarchy
Visual indicators for evidence strength:
- 🔬 Rigorous RCT (Gold standard)
- 📊 Quasi-Experimental
- 📈 Longitudinal Study
- 📋 Evaluation Report
- ✨ Promising Practice
- 🌱 Emerging

### 3. Australian Context Integration
Link each international program to:
- Similar Australian programs (from existing `community_programs` table)
- Relevant stories (from `articles` table)
- Geographic locations (from services database)

### 4. Visit/Exchange Workflow
1. Program identified for study
2. Visit planned and documented
3. Learnings captured
4. Australian adaptation designed
5. Implementation tracked

## Database Schema Details

### Example Program Record

```json
{
  "name": "Missouri Model",
  "slug": "missouri-model",
  "country": "United States",
  "region": "north_america",
  "program_type": ["custodial_reform"],
  "description": "Small, therapeutic youth facilities...",
  "approach_summary": "Therapeutic group homes with rehabilitation focus",
  "recidivism_rate": 8.0,
  "recidivism_comparison": "< 8% vs national average of ~50%",
  "evidence_strength": "longitudinal_study",
  "key_outcomes": [
    {
      "metric": "Re-incarceration rate",
      "value": "< 8%",
      "timeframe": "After release"
    },
    {
      "metric": "Education engagement",
      "value": "~85%",
      "detail": "Engaged in school or work at release"
    }
  ],
  "australian_adaptations": [],
  "visit_status": null,
  "collaboration_opportunities": "Potential for study tour and training partnership"
}
```

### Integration with Existing Data

**Link to Community Programs:**
```sql
-- Example: Link Maranguka to its program record
UPDATE international_programs
SET related_program_ids = ARRAY[
  (SELECT id FROM community_programs WHERE slug = 'maranguka-bourke')
]
WHERE slug = 'maranguka-bourke';
```

**Link to Stories:**
```sql
-- Example: Link articles about family conferencing to NZ program
UPDATE international_programs
SET related_story_ids = ARRAY[
  (SELECT id FROM articles WHERE slug LIKE '%family-group%')
]
WHERE slug = 'fgc-new-zealand';
```

## User Experience Flow

### For Practitioners
1. Visit Centre of Excellence
2. Browse global programs by region or outcome type
3. Filter to programs with < 10% recidivism
4. Compare Missouri Model vs Australian Youth Justice Centres
5. See that Missouri uses 10-30 person therapeutic homes vs larger facilities
6. Read case studies of successful implementation
7. Request visit/exchange opportunity

### For Policy Makers
1. Search for "diversion programs"
2. See NICRO (South Africa) with 6.7% reoffending
3. View detailed implementation requirements
4. Compare cost-benefit ($7-21 return per $1 for YouthBuild)
5. Access research citations and evaluations
6. Download implementation guide
7. Contact Centre for technical assistance

### For Researchers
1. Filter programs by evidence strength (RCT only)
2. Access full research citations
3. Compare outcomes across different approaches
4. Identify gaps in Australian research
5. Propose new studies based on international findings

## Files Created

### Database
- `/supabase/migrations/20250126000004_create_centre_of_excellence.sql` - Full migration
- `/CENTRE_OF_EXCELLENCE_SETUP.md` - Setup instructions

### Scripts
- `/src/scripts/setup-centre-of-excellence-db.ts` - Database table creation
- `/src/scripts/populate-global-programs.ts` - Initial data load (12 programs)
- `/src/scripts/populate-global-programs-v2.ts` - Test script
- `/src/scripts/fix-rls-policies.ts` - RLS testing
- `/src/scripts/apply-centre-of-excellence-migration.ts` - Migration runner

### Documentation
- `/CENTRE_OF_EXCELLENCE_SETUP.md` - Complete setup guide
- `/CENTRE_OF_EXCELLENCE_INTEGRATION_PLAN.md` - This file

## Benefits of This Approach

### 1. Evidence-Based Decision Making
Every program includes:
- Quantified outcomes (recidivism rates, cost savings)
- Evidence strength ratings
- Research citations
- Comparison data

### 2. International Collaboration
- Track visits and exchanges
- Invite international experts
- Document learnings and adaptations
- Build ongoing partnerships

### 3. Australian Context
- Link to existing Australian programs
- Identify adaptation opportunities
- Cultural considerations documented
- Indigenous-specific approaches highlighted

### 4. Continuous Learning
- Regular updates as new evaluations published
- Emerging practices flagged
- Lessons learned captured
- Implementation challenges documented

## Example Use Cases

### Use Case 1: Reducing Youth Detention
**Question:** "What international programs have successfully reduced youth detention?"

**Answer from Database:**
- JDAI (USA): 40% reduction across 300+ counties
- Family Group Conferencing (NZ): >50% reduction in institutions
- HALT Program (Netherlands): Nationwide diversion keeping youth out of system

**Next Steps:**
- Compare approaches
- Identify cultural adaptations needed
- Plan study tour
- Design pilot program

### Use Case 2: Improving Recidivism
**Question:** "What custody programs achieve <10% recidivism?"

**Answer from Database:**
- Missouri Model: <8%
- Progression Units (Brazil): ~4%
- NICRO Diversion (South Africa): 6.7%

**Analysis:**
- All emphasize education/work
- Therapeutic vs punitive approach
- Small-scale facilities
- Strong reintegration support

### Use Case 3: Indigenous Youth Justice
**Question:** "What works for Indigenous/First Nations youth?"

**Answer from Database:**
- Maranguka (Australia): 38% crime reduction
- Family Group Conferencing (NZ): Cultural integration for Māori
- Youth Koori Court (Australia): Elder involvement

**Themes:**
- Community-led design
- Cultural connection central
- Family engagement
- Addressing root causes

## Measurement & Impact

### Track Program Metrics
- Number of programs in database
- Evidence quality distribution
- Geographic coverage
- Visit/exchange activity

### User Engagement
- Page views per program
- Downloads of resources
- Contact requests
- Study tour applications

### Implementation Outcomes
- Australian programs inspired by database
- Policy changes influenced
- Research partnerships formed
- Training programs developed

## Future Enhancements

### Phase 2: Advanced Features
- AI-powered program matching (find programs similar to yours)
- Outcome prediction models
- Cost calculator for implementation
- Success probability estimator

### Phase 3: Community Features
- Practitioner comments and experiences
- User-submitted programs
- Peer reviews
- Discussion forums

### Phase 4: Data Visualization
- Interactive outcome charts
- Geographic heat maps
- Timeline of innovation
- Trend analysis

## Conclusion

The Centre of Excellence infrastructure is ready to showcase global best practices in youth justice. The database schema supports comprehensive program documentation, collaboration tracking, and evidence-based decision making.

**Immediate Action Required:**
1. Create database tables (see Step 1 above)
2. Run data population script (Step 2)
3. Test with initial 12 programs

**Then Build UI:**
1. Programs listing page with filters
2. Individual program detail pages
3. Comparison tools
4. Admin interface for managing visits/invitations

This will position JusticeHub as Australia's authoritative source for youth justice best practices, connecting local innovation with global excellence.
