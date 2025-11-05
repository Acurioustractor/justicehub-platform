# Guide: Adding Research to JusticeHub Centre of Excellence

This guide shows you exactly how to add research papers, international best practice models, videos, and PDFs to the Centre of Excellence research library.

## Quick Links

- **Research Library**: `/src/app/centre-of-excellence/research/page.tsx`
- **Global Insights**: `/src/app/centre-of-excellence/global-insights/page.tsx`

---

## 1. Adding Research to the Research Library

### File to Edit
`/src/app/centre-of-excellence/research/page.tsx`

### Step 1: Find the Research Data Array

Look for this section around line 24:

```typescript
const RESEARCH_DATA: ResearchItem[] = [
  // Existing research items here...
];
```

### Step 2: Add Your Research Entry

Copy this template and add it to the array (add a comma after the previous entry):

```typescript
{
  id: 'your-unique-id-here',  // Use lowercase with hyphens, e.g., 'nsw-diversion-2024'
  title: 'Your Research Title Here',
  authors: ['Author Name 1', 'Author Name 2'],
  organization: 'University/Institute Name',
  year: 2024,  // Publication year
  category: 'trauma-informed',  // Options below
  jurisdiction: 'Australia',  // Options below
  type: 'research-paper',  // Options below
  summary: 'One paragraph summary of the research, its purpose, and methodology.',
  keyFindings: [
    'First major finding from the research',
    'Second important outcome or result',
    'Third key insight or recommendation',
    'Fourth finding (add as many as needed)'
  ],
  externalUrl: 'https://link-to-full-research.com',  // Optional
  pdfUrl: 'https://direct-link-to-pdf.pdf',  // Optional
  videoUrl: 'https://youtube.com/watch?v=...',  // Optional
  tags: ['keyword1', 'keyword2', 'evidence-based', 'pilot-study'],
  featured: true  // Set to true to appear in Featured section
}
```

### Category Options
- `'trauma-informed'` - Trauma-Informed Practice
- `'indigenous-diversion'` - Indigenous-Led Diversion
- `'family-engagement'` - Family Engagement
- `'restorative-justice'` - Restorative Justice
- `'youth-rights'` - Youth Rights & Lived Experience
- `'recidivism'` - Recidivism & Outcomes
- `'mental-health'` - Mental Health

### Jurisdiction Options
- `'Australia'`
- `'Queensland'`
- `'New Zealand'`
- `'Scotland'`
- `'International'`
- `'Nordic'`

### Type Options
- `'research-paper'` - Academic research papers
- `'systematic-review'` - Systematic reviews
- `'meta-analysis'` - Meta-analyses
- `'policy-brief'` - Policy documents
- `'case-study'` - Case studies
- `'report'` - Government/organization reports
- `'video'` - Videos or webinars

### Real Example

Here's an actual entry I added:

```typescript
{
  id: 'indigenous-diversion-cultural-2024',
  title: 'Resisting the Incarceration of Aboriginal and Torres Strait Islander Children: Cultural Responsiveness of Diversion Programs',
  authors: ['Lowitja Institute Research Team'],
  organization: 'First Nations Health and Wellbeing - The Lowitja Journal',
  year: 2024,
  category: 'indigenous-diversion',
  jurisdiction: 'Australia',
  type: 'systematic-review',
  summary: 'Scoping review of 31 studies examining 15 diversion program types for cultural responsiveness, finding wide variation in how programs address Indigenous cultural needs.',
  keyFindings: [
    '10 programs scored high for cultural responsiveness, 16 medium, 5 low',
    'Best programs support social/emotional wellbeing through Indigenous-led, place-based approaches',
    'Only 10/31 programs addressed connection to land, culture, spirituality, family',
    'Indigenous-led programs show decline in offending behavior',
    'Holistic approaches addressing underlying factors most effective'
  ],
  externalUrl: 'https://www.lowitjajournal.org.au/article/S2949-8406(24)00014-7/fulltext',
  tags: ['Indigenous', 'cultural-safety', 'diversion', 'holistic', 'Australia'],
  featured: true
}
```

---

## 2. Adding International Best Practice Models

### File to Edit
`/src/app/centre-of-excellence/global-insights/page.tsx`

### Step 1: Find the International Models Array

Look for this section around line 47:

```typescript
const INTERNATIONAL_MODELS: InternationalModel[] = [
  // Existing models here...
];
```

### Step 2: Add Your Model Entry

Copy this template:

```typescript
{
  id: 'country-model-name',  // e.g., 'germany-youth-courts'
  country: 'Country Name',
  modelName: 'Official Name of the Model/System',
  tagline: 'One compelling sentence about what makes this special',
  overview: 'Detailed paragraph explaining the model, its history, core approach, and how it operates. Include context about when it was established and what problems it aimed to solve.',
  keyPrinciples: [
    'First guiding principle of the system',
    'Second core value or approach',
    'Third fundamental element',
    'Fourth key principle (add 5-8 total)'
  ],
  outcomes: [
    {
      metric: 'What is being measured',
      value: '85%',  // The statistic
      context: 'explanation of what this means'
    },
    {
      metric: 'Another measure',
      value: 'Significant reduction',
      context: 'in youth custody rates over 10 years'
    }
    // Add 2-4 outcomes
  ],
  strengths: [
    'What works well about this model',
    'Another advantage or proven benefit',
    'Evidence of effectiveness',
    'Why others have adopted it'
    // Add 5-8 strengths
  ],
  challenges: [
    'Known limitations or criticisms',
    'Implementation difficulties',
    'Areas needing improvement',
    'Challenges in replication'
    // Add 5-8 challenges
  ],
  applicableToAustralia: [
    'How this could work in Australian context',
    'What would need to be adapted',
    'Which elements are most transferable',
    'Pilot opportunities in specific states'
    // Add 5-8 applications
  ],
  resources: [
    {
      title: 'Name of Research Paper or Report',
      type: 'research',  // or 'video', 'report', 'policy'
      url: 'https://link-to-resource.com',
      description: 'Brief description of what this resource covers'
    }
    // Add 3-6 resources
  ],
  featured: true  // Appears at top of page
}
```

### Real Example - Germany's Youth Court System

Here's what an entry for Germany might look like:

```typescript
{
  id: 'germany-youth-courts',
  country: 'Germany',
  modelName: 'Jugendgerichtsgesetz (Youth Courts Act)',
  tagline: 'Educational measures over punishment - 100+ years of welfare-oriented youth justice',
  overview: 'Germany\'s Youth Courts Act (Jugendgerichtsgesetz), first introduced in 1923 and reformed in 1953, prioritizes educational measures and social integration over punitive responses. The system is built on the principle that young people have developmental needs requiring pedagogical rather than punitive interventions. Specialized youth courts, prosecutors, and judges work within a welfare-oriented framework emphasizing rehabilitation.',
  keyPrinciples: [
    'Education and development as primary goals',
    'Specialized youth courts with trained judges',
    'Welfare-oriented rather than punishment-focused',
    'Diversion preferred for minor and first-time offences',
    'Community-based measures emphasized',
    'Coordination with youth welfare services',
    'Extended jurisdiction up to age 21 in some cases'
  ],
  outcomes: [
    {
      metric: 'Youth Incarceration Rate',
      value: 'Very low',
      context: 'compared to other European nations, with emphasis on alternatives'
    },
    {
      metric: 'Educational Measures',
      value: '70%+',
      context: 'of youth receive educational or restorative measures rather than custody'
    },
    {
      metric: 'System Longevity',
      value: '100+ years',
      context: 'of continuous operation and refinement'
    }
  ],
  strengths: [
    'Century of experience and refinement',
    'Strong integration between justice and welfare systems',
    'Specialized training for all youth justice professionals',
    'Emphasis on diversion keeps youth out of formal system',
    'Educational measures proven effective',
    'Community-based alternatives well-developed',
    'Extended jurisdiction recognizes developmental differences up to 21'
  ],
  challenges: [
    'Regional variation in implementation quality',
    'Resource constraints in some jurisdictions',
    'Debate about age limits and extended jurisdiction',
    'Integration challenges between states',
    'Some criticism of net-widening effects',
    'Need for more rigorous outcome evaluation'
  ],
  applicableToAustralia: [
    'Specialized youth court model highly transferable',
    'Educational measures framework could strengthen Australian responses',
    'Integration with welfare services needed in Australia',
    'Professional training standards could be adopted',
    'Extended jurisdiction to 21 worth exploring',
    'Diversion emphasis aligns with Australian goals'
  ],
  resources: [
    {
      title: 'German Youth Courts: 100 Years of Development',
      type: 'research',
      url: 'https://example.com/german-youth-courts-study',
      description: 'Historical analysis of German youth justice system evolution'
    },
    {
      title: 'Youth Courts Act (English Translation)',
      type: 'policy',
      url: 'https://example.com/jugendgerichtsgesetz-english',
      description: 'Official translation of German youth justice legislation'
    },
    {
      title: 'Educational Measures in Practice',
      type: 'report',
      url: 'https://example.com/educational-measures-report',
      description: 'Evaluation of educational alternatives to custody'
    }
  ],
  featured: true
}
```

---

## 3. Quick Tips

### Finding Good Research

**Australian Sources:**
- Australian Institute of Family Studies (AIFS): https://aifs.gov.au
- Australian Institute of Criminology: https://www.aic.gov.au
- Lowitja Institute (Indigenous health): https://www.lowitja.org.au
- State government youth justice departments
- University research centres (e.g., Griffith, Melbourne, Sydney)

**International Sources:**
- New Zealand: Ministry of Justice, Oranga Tamariki
- Scotland: Centre for Youth & Criminal Justice
- Canada: Department of Justice Canada
- Nordic countries: Nordic Welfare Centre
- Academic databases: Google Scholar, ResearchGate

### Writing Good Summaries

**Do:**
- ✅ Keep summaries to 2-3 sentences
- ✅ Include key numbers and statistics
- ✅ Mention methodology (e.g., "systematic review of 31 studies")
- ✅ State what makes it unique or important

**Don't:**
- ❌ Copy-paste entire abstracts
- ❌ Use academic jargon without explanation
- ❌ Make claims without evidence
- ❌ Exceed 4-5 sentences

### Choosing Tags

Good tags are:
- Specific: `'trauma-screening'` not just `'trauma'`
- Searchable: Use terms people would search for
- Consistent: Check existing tags first
- Relevant: 4-6 tags maximum per item

Examples:
- `['Indigenous', 'diversion', 'cultural-safety', 'community-led', 'NSW']`
- `['trauma', 'ACEs', 'screening', 'mental-health', 'evidence-based']`
- `['restorative-justice', 'FGC', 'victim-satisfaction', 'New-Zealand']`

---

## 4. Adding Your Own Work

### If You Have a Research Paper

```typescript
{
  id: 'your-name-topic-year',
  title: 'Your Paper Title',
  authors: ['Your Name', 'Co-author Names'],
  organization: 'Your Institution',
  year: 2024,
  category: 'family-engagement',  // Choose appropriate category
  jurisdiction: 'Queensland',
  type: 'research-paper',
  summary: 'Brief description of your research question, methods, and main contribution.',
  keyFindings: [
    'What you discovered',
    'Key recommendations',
    'Important implications for practice'
  ],
  pdfUrl: 'https://link-to-your-pdf.com',  // Or upload to site later
  externalUrl: 'https://your-university/research-page',
  tags: ['your-keywords', 'research-methods', 'topic-areas'],
  featured: true  // Highlight your work!
}
```

### If You Have a Video/Webinar

```typescript
{
  id: 'webinar-title-2024',
  title: 'Webinar: Your Presentation Title',
  authors: ['Presenter Names'],
  organization: 'Hosting Organization',
  year: 2024,
  category: 'trauma-informed',
  jurisdiction: 'Australia',
  type: 'video',
  summary: 'What the video covers, who it\'s for, and key takeaways.',
  keyFindings: [
    'Main points from the presentation',
    'Practical recommendations shared',
    'Case examples discussed'
  ],
  videoUrl: 'https://youtube.com/watch?v=...',
  tags: ['webinar', 'professional-development', 'practice-tools'],
  featured: false
}
```

### If You've Seen Great International Practice

```typescript
{
  id: 'belgium-restorative-justice',
  country: 'Belgium',
  modelName: 'Name of Program/System',
  tagline: 'What impressed you most about it',
  overview: 'Describe what you observed, how it works, and why it stood out to you.',
  // ... fill in the rest based on your observations and any research you can find
}
```

---

## 5. Testing Your Changes

After adding research:

1. **Save the file**
2. **Run the dev server**: `npm run dev`
3. **Visit the page**:
   - Research Library: http://localhost:3000/centre-of-excellence/research
   - Global Insights: http://localhost:3000/centre-of-excellence/global-insights
4. **Test search**: Make sure your entry appears when searching for keywords
5. **Test filters**: Verify category, jurisdiction, and type filters work
6. **Click links**: Ensure all URLs work

---

## 6. Need Help?

**Common Issues:**

**Missing comma:** If you see an error, you likely forgot a comma after the previous entry
```typescript
// ❌ WRONG
  }
  {  // Missing comma before this brace

// ✅ RIGHT
  },
  {
```

**Wrong quotes:** Use single quotes `'...'` for strings, not double quotes
```typescript
category: 'trauma-informed'  // ✅ Correct
category: "trauma-informed"  // ❌ Will work but inconsistent
```

**URL formatting:** Always include `https://` at the start
```typescript
externalUrl: 'https://example.com/research'  // ✅ Correct
externalUrl: 'example.com/research'  // ❌ May not work as link
```

---

## 7. Example: Adding Research You Found

**You found this research:**
- Title: "Therapeutic Jurisprudence in Youth Justice: Melbourne Pilot"
- By: Dr. Smith & Dr. Jones, Melbourne Law School
- Published: 2023
- Link: https://law.unimelb.edu.au/therapeutic-jurisprudence-pilot

**Add it like this:**

```typescript
{
  id: 'melbourne-therapeutic-jurisprudence-2023',
  title: 'Therapeutic Jurisprudence in Youth Justice: Melbourne Pilot Study',
  authors: ['Dr. Sarah Smith', 'Dr. Michael Jones'],
  organization: 'Melbourne Law School',
  year: 2023,
  category: 'trauma-informed',
  jurisdiction: 'Australia',
  type: 'case-study',
  summary: 'Pilot study examining therapeutic jurisprudence approaches in Melbourne Youth Court, assessing impact on youth wellbeing and recidivism over 12-month period.',
  keyFindings: [
    '23% reduction in recidivism compared to control group',
    'Improved mental health outcomes for participants',
    'High satisfaction from judicial officers and youth workers',
    'Requires significant judicial training investment',
    'Promising model for wider rollout across Victoria'
  ],
  externalUrl: 'https://law.unimelb.edu.au/therapeutic-jurisprudence-pilot',
  tags: ['therapeutic-jurisprudence', 'court-innovation', 'Victoria', 'pilot-study', 'wellbeing'],
  featured: true
}
```

---

## Quick Checklist Before Adding

- [ ] Have unique ID (lowercase, hyphens, descriptive)
- [ ] Title is complete and accurate
- [ ] Authors listed correctly
- [ ] Year is publication/release year
- [ ] Category fits one of the existing options
- [ ] Summary is 2-4 sentences max
- [ ] Key findings are bullet-point style (not full sentences)
- [ ] At least one URL provided (external, PDF, or video)
- [ ] Tags are relevant and consistent with existing tags
- [ ] Tested locally before committing

---

**That's it!** You're ready to add research to the Centre of Excellence. Start with one entry to get comfortable, then add more as you discover them.
