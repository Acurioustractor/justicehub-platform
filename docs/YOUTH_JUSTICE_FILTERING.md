# Youth Justice Focused Filtering Strategy

**Goal:** Only collect services highly relevant to youth justice and youth support
**Target:** Young people aged 10-25 involved with or at risk of justice system contact

---

## 🎯 Youth Justice Service Criteria

### Primary Indicators (MUST match at least 1)

Services **must** be relevant to one of these core needs:

1. **Legal & Court Support**
   - Legal representation for young offenders
   - Court support and advocacy
   - Diversion programs
   - Youth justice conferencing
   - Bail support
   - Restorative justice programs

2. **Housing & Accommodation**
   - Emergency housing for at-risk youth
   - Transitional accommodation
   - Post-detention housing
   - Homelessness prevention
   - Supported accommodation

3. **Mental Health & Counseling**
   - Trauma counseling
   - Mental health support for justice-involved youth
   - Substance abuse treatment
   - Crisis intervention
   - Therapeutic programs

4. **Family Support**
   - Family violence services
   - Family mediation
   - Parenting support
   - Child protection
   - Reunification programs

5. **Education & Employment**
   - Alternative education programs
   - School re-engagement
   - Vocational training
   - Employment pathways
   - Literacy and numeracy support

6. **Case Management**
   - Youth support coordination
   - Intensive case management
   - Transition planning (detention to community)
   - Wrap-around services

7. **Cultural Support**
   - Aboriginal and Torres Strait Islander specific programs
   - Culturally appropriate services
   - Connection to culture programs

---

## 🔍 Filtering Keywords

### INCLUDE Services Mentioning:

**Age-Specific Terms:**
- youth, young people, young person
- juvenile, adolescent, teenager
- aged 10-25, under 18, under 25
- children and young people

**Justice-Related Terms:**
- justice involved, justice system
- youth justice, juvenile justice
- court, legal aid, legal support
- diversion, conferencing
- bail, remand, detention
- offending, reoffending, recidivism
- at-risk youth, vulnerable youth
- custodial, post-custodial, post-release
- community supervision
- youth on justice orders

**Support Categories:**
- crisis accommodation
- emergency housing
- trauma counseling
- family violence, domestic violence
- substance abuse, drug and alcohol
- mental health support
- case management
- intensive support
- wraparound services
- out-of-home care
- child protection

### EXCLUDE Services That Are:

**Not Youth-Focused:**
- Exclusively for adults (18+, 21+, elderly)
- Aged care, retirement homes
- Adult prisons, adult corrections
- Adult-only rehabilitation

**Not Justice-Related:**
- General community services (unless youth-specific)
- Generic counseling (unless trauma/justice focus)
- Mainstream schools (unless alternative/re-engagement)
- Standard employment services (unless youth pathways)

**Out of Scope:**
- Disability services (unless youth justice focus)
- NDIS providers (unless youth justice specific)
- General health clinics
- Financial counseling only
- Tax help, consumer advice

---

## 📊 Relevance Scoring System

Each service gets scored 0-10 for youth justice relevance:

### High Relevance (8-10 points)
**IMPORT IMMEDIATELY**

Examples:
- "Youth legal service for young offenders aged 10-17"
- "Post-detention housing support for justice-involved youth"
- "Aboriginal youth justice conferencing program"
- "Court support for children and young people"

**Scoring:**
- Contains "youth justice" or "juvenile justice": +5
- Age range 10-25 specified: +3
- Legal/court support: +2
- Justice-specific keywords: +2

### Medium Relevance (5-7 points)
**REVIEW BEFORE IMPORT**

Examples:
- "Youth mental health counseling" (could be justice-relevant)
- "Crisis accommodation for young people"
- "Family support services for at-risk families"
- "Alternative education for disengaged youth"

**Scoring:**
- Youth-focused (age 10-25): +3
- Crisis/emergency services: +2
- Mental health/counseling: +2
- Housing/accommodation: +2

### Low Relevance (0-4 points)
**EXCLUDE**

Examples:
- "General community health clinic"
- "Adult employment services"
- "Financial counseling"
- "Aged care support"

---

## 🛠️ Implementation in Scraping

### Step 1: Extract with Youth Justice Context

Update Firecrawl extraction to include relevance context:

```typescript
const result = await firecrawl.scrapeUrl(url, {
  formats: ['extract'],
  extract: {
    prompt: `Extract ONLY services relevant to youth justice and youth support.

    Include services for:
    - Young people aged 10-25
    - Justice-involved youth
    - At-risk youth
    - Legal support for young people
    - Youth housing and crisis support
    - Youth mental health and counseling

    Exclude:
    - Adult-only services
    - Aged care
    - General community services not youth-focused
    - Disability services without youth justice focus`,

    schema: {
      type: 'object',
      properties: {
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              organization: { type: 'string' },
              description: { type: 'string' },
              targetAge: { type: 'string', description: 'Age range served (e.g., 10-25)' },
              isYouthFocused: { type: 'boolean', description: 'Is this specifically for young people?' },
              isJusticeRelated: { type: 'boolean', description: 'Is this justice or legal related?' },
              categories: { type: 'array', items: { type: 'string' } },
              phone: { type: 'string' },
              email: { type: 'string' },
              address: { type: 'string' },
              website: { type: 'string' }
            },
            required: ['name', 'description']
          }
        }
      }
    }
  }
});
```

### Step 2: Calculate Relevance Score

```typescript
function calculateYouthJusticeRelevance(service: any): number {
  let score = 0;
  const text = `${service.name} ${service.description}`.toLowerCase();

  // HIGH VALUE KEYWORDS (+5 points)
  const highValueKeywords = [
    'youth justice', 'juvenile justice', 'young offenders',
    'court support', 'legal aid for youth', 'youth diversion',
    'bail support', 'youth detention', 'post-release'
  ];

  for (const keyword of highValueKeywords) {
    if (text.includes(keyword)) {
      score += 5;
      break; // Only count once
    }
  }

  // AGE SPECIFICATION (+3 points)
  const agePatterns = [
    /\b(10-25|12-25|10-18|12-18|under 25|under 18)\b/i,
    /\byouth\b/i, /\byoung people\b/i, /\badolescent\b/i
  ];

  for (const pattern of agePatterns) {
    if (pattern.test(text)) {
      score += 3;
      break;
    }
  }

  // JUSTICE-RELATED (+2 points)
  const justiceKeywords = [
    'legal', 'court', 'justice', 'diversion', 'restorative',
    'offending', 'bail', 'advocacy', 'conferencing'
  ];

  for (const keyword of justiceKeywords) {
    if (text.includes(keyword)) {
      score += 2;
      break;
    }
  }

  // SUPPORT CATEGORIES (+2 points)
  const supportKeywords = [
    'crisis', 'emergency', 'housing', 'mental health',
    'counseling', 'trauma', 'substance abuse', 'family violence'
  ];

  for (const keyword of supportKeywords) {
    if (text.includes(keyword)) {
      score += 2;
      break;
    }
  }

  // EXPLICIT FLAGS
  if (service.isYouthFocused) score += 2;
  if (service.isJusticeRelated) score += 3;

  return Math.min(score, 10); // Cap at 10
}
```

### Step 3: Filter Before Import

```typescript
async function importServiceWithFiltering(service: any, sourceUrl: string) {
  const relevanceScore = calculateYouthJusticeRelevance(service);

  // Only import if score >= 5 (medium to high relevance)
  if (relevanceScore < 5) {
    console.log(`  ⏭️  Skipped (low relevance score: ${relevanceScore}): ${service.name}`);
    return 'filtered';
  }

  console.log(`  ✅ Importing (relevance: ${relevanceScore}/10): ${service.name}`);

  // Import to database with relevance metadata
  await supabase.from('services').insert({
    name: service.name,
    description: service.description,
    // ... other fields
    metadata: {
      youth_justice_relevance_score: relevanceScore,
      target_age: service.targetAge,
      is_youth_focused: service.isYouthFocused,
      is_justice_related: service.isJusticeRelated
    }
  });

  return 'imported';
}
```

---

## 📋 Ask Izzy Category Refinement

### Categories to Prioritize

**HIGH PRIORITY** (Most youth justice relevant):

1. **Advice and Advocacy** → Legal aid, court support
2. **Housing** → Crisis accommodation, emergency housing
3. **Support and Counselling** → Mental health, trauma
4. **Domestic and Family Violence** → Family support, crisis

**MEDIUM PRIORITY** (Youth-specific subset):

5. **Health and Wellbeing** → Substance abuse, mental health
6. **Work, Learning, Things to Do** → Alternative education, diversion

**LOW PRIORITY** (Less relevant):

7. Food → Generally not youth justice specific
8. Money Help → Financial counseling (low relevance)
9. Everyday Needs → Material aid (low relevance)

### Recommended Approach

**Option 1: Focused Scrape (Recommended)**
- Scrape only 4 high-priority categories
- Apply youth justice filtering
- Expected: 1,000-2,500 highly relevant services
- Cost: ~$0.40
- Time: 5 minutes

**Option 2: Comprehensive with Filtering**
- Scrape all 6 categories
- Apply strict relevance scoring (≥6/10)
- Expected: 1,500-3,500 relevant services
- Cost: ~$0.68
- Time: 8 minutes

---

## 🎯 Target Service Examples

### ✅ INCLUDE - High Relevance

1. **Legal Aid NSW Youth Hotline**
   - Score: 10/10
   - Why: Youth-specific legal aid, justice-related, age specified

2. **Brisbane Youth Service - Court Support Program**
   - Score: 9/10
   - Why: Youth-focused, court support, justice-involved

3. **headspace - Youth Mental Health (Justice Stream)**
   - Score: 8/10
   - Why: Youth mental health, justice context

4. **Mission Australia - Youth Housing (Post-Release)**
   - Score: 9/10
   - Why: Youth housing, post-release support

5. **Aboriginal Legal Service - Youth Justice Program**
   - Score: 10/10
   - Why: Youth justice, legal, cultural support

### ⚠️ MAYBE - Medium Relevance (Review)

1. **Lifeline - Crisis Support**
   - Score: 5/10
   - Why: Crisis support (relevant) but not youth-specific
   - Decision: Import if mentions youth services

2. **Centrelink Youth Allowance**
   - Score: 4/10
   - Why: Youth-focused but financial only
   - Decision: Skip unless part of broader support

3. **General Youth Counseling Service**
   - Score: 6/10
   - Why: Youth-focused, mental health, but not justice-specific
   - Decision: Import if they serve justice-involved youth

### ❌ EXCLUDE - Low Relevance

1. **Aged Care Facility**
   - Score: 0/10
   - Why: Not youth-focused

2. **Adult Employment Services**
   - Score: 1/10
   - Why: Adult-only

3. **General Community Health Clinic**
   - Score: 2/10
   - Why: Not youth-specific, not justice-related

4. **Tax Help Service**
   - Score: 0/10
   - Why: Not relevant to youth justice

---

## 📊 Expected Filtering Results

### Before Filtering
- Total services found: 3,000-9,000
- All ages, all service types

### After Filtering (Score ≥5)
- Highly relevant: 800-1,500 services (score 8-10)
- Medium relevant: 500-1,000 services (score 5-7)
- **Total imported: 1,300-2,500 services**
- Filtered out: 1,700-6,500 services

### Quality Improvement
- Relevance to youth justice: 95%+
- Services actually useful to target population: High
- Database signal-to-noise ratio: Excellent

---

## 🚀 Implementation Steps

### 1. Update Extraction Prompt (Done in code above)
Include youth justice context in Firecrawl extraction

### 2. Add Relevance Scoring Function
Calculate 0-10 score for each service

### 3. Filter Before Import
Only import services with score ≥5

### 4. Track Filtering Metrics
```typescript
console.log('Filtering Summary:');
console.log(`  Services found: ${totalFound}`);
console.log(`  High relevance (8-10): ${highRelevance}`);
console.log(`  Medium relevance (5-7): ${mediumRelevance}`);
console.log(`  Low relevance (0-4): ${lowRelevance} (filtered out)`);
console.log(`  Imported: ${highRelevance + mediumRelevance}`);
console.log(`  Filter rate: ${((lowRelevance / totalFound) * 100).toFixed(1)}%`);
```

### 5. Review Sample
Manually review 20-30 medium-relevance services to calibrate scoring

---

## 💡 Additional Filtering Strategies

### Geographic Targeting
Start with areas with high youth justice needs:
- Greater Brisbane
- Western Sydney
- Melbourne metro
- Regional QLD hotspots

### Organization Type Filtering
Prioritize:
- Legal Aid offices
- Aboriginal Legal Services
- Youth-specific NGOs (headspace, Mission Australia Youth)
- Government youth justice departments
- Specialist youth services

Deprioritize:
- General community health
- Aged care providers
- Adult-only services
- Generic support services

### Manual Curation List
Create allowlist of known high-value organizations:
- Legal Aid (all states)
- Youth Law Australia
- Aboriginal Legal Services
- headspace
- Mission Australia Youth Services
- Sisters Inside
- Youth Advocacy Centre
- Community Restorative Centre

**Result:** Focused, high-quality database of services actually useful for youth justice purposes! 🎯
