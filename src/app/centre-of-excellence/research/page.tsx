'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  BookOpen,
  FileText,
  Video,
  Globe,
  Calendar,
  Tag,
  TrendingUp,
  Award,
  Users,
  ArrowLeft
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

// Research item type
interface ResearchItem {
  id: string;
  title: string;
  authors: string[];
  organization: string;
  year: number;
  category: 'trauma-informed' | 'indigenous-diversion' | 'family-engagement' | 'restorative-justice' | 'youth-rights' | 'recidivism' | 'mental-health';
  jurisdiction: 'Australia' | 'Queensland' | 'New Zealand' | 'Scotland' | 'International' | 'Nordic';
  type: 'research-paper' | 'systematic-review' | 'meta-analysis' | 'policy-brief' | 'case-study' | 'video' | 'report';
  summary: string;
  keyFindings: string[];
  pdfUrl?: string;
  externalUrl?: string;
  videoUrl?: string;
  tags: string[];
  featured?: boolean;
}

// Sample research data based on our findings
const RESEARCH_DATA: ResearchItem[] = [
  {
    id: 'trauma-informed-umbrella-2024',
    title: 'The Outcomes of Trauma-Informed Practice in Youth Justice: An Umbrella Review',
    authors: ['Multiple Authors'],
    organization: 'Journal of Child & Adolescent Trauma',
    year: 2024,
    category: 'trauma-informed',
    jurisdiction: 'International',
    type: 'systematic-review',
    summary: 'Comprehensive umbrella review summarizing systematic reviews and meta-analyses (2017-2023) on trauma-informed youth justice outcomes, examining whether trauma-informed approaches produce expected results.',
    keyFindings: [
      'High rates of complex trauma among justice-involved young people',
      'Uncertainty remains about whether trauma-informed approaches produce expected outcomes',
      'Need for more rigorous evaluation of trauma-informed interventions',
      'Importance of trauma screening and assessment in youth justice settings'
    ],
    externalUrl: 'https://link.springer.com/article/10.1007/s40653-024-00634-5',
    tags: ['trauma', 'evidence-based', 'systematic-review', 'international'],
    featured: true
  },
  {
    id: 'frontiers-trauma-informed-2023',
    title: 'The Effectiveness of Trauma-Informed Youth Justice: A Discussion and Review',
    authors: ['Frontiers Research Team'],
    organization: 'Frontiers in Psychology',
    year: 2023,
    category: 'trauma-informed',
    jurisdiction: 'International',
    type: 'research-paper',
    summary: 'Critical discussion and review of evidence for trauma-informed practice effectiveness in youth justice, examining theoretical foundations and practical implementation challenges.',
    keyFindings: [
      'Trauma-informed care shows promise but needs stronger evaluation',
      'Staff training is critical for successful implementation',
      'Environmental and organizational changes necessary',
      'Need for youth and family involvement in service design'
    ],
    externalUrl: 'https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1157695/full',
    tags: ['trauma', 'implementation', 'staff-training', 'evidence'],
    featured: true
  },
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
  },
  {
    id: 'aifs-indigenous-youth-justice',
    title: 'Indigenous Youth Justice Programs Evaluation',
    authors: ['AIFS Research Team'],
    organization: 'Australian Institute of Family Studies',
    year: 2023,
    category: 'indigenous-diversion',
    jurisdiction: 'Australia',
    type: 'report',
    summary: 'Australian Government-funded evaluation examining effectiveness of four programs designed to divert Indigenous people from the justice system.',
    keyFindings: [
      'NT Police Pre-Court Juvenile Diversion shows Indigenous youth less likely to re-offend',
      'Community-led models most effective for remote communities',
      'Elders involvement critical to program success',
      'Programs must address all underlying factors driving justice contact'
    ],
    externalUrl: 'https://aifs.gov.au/research/commissioned-reports/indigenous-youth-justice-programs-evaluation',
    pdfUrl: 'https://www.aic.gov.au/sites/default/files/2020-05/Indigenous-Youth-Justice-Programs-Evaluation.pdf',
    tags: ['Indigenous', 'evaluation', 'diversion', 'community-led', 'AIFS'],
    featured: true
  },
  {
    id: 'nz-restorative-justice-2006',
    title: 'Youth Justice in New Zealand: Restorative Justice in Practice',
    authors: ['Gabrielle Maxwell'],
    organization: 'Victoria University of Wellington',
    year: 2006,
    category: 'restorative-justice',
    jurisdiction: 'New Zealand',
    type: 'research-paper',
    summary: 'Landmark study examining New Zealand\'s restorative justice approach through Family Group Conferences, considered an international exemplar.',
    keyFindings: [
      '86% of victims satisfied with restorative justice conference',
      '84% would recommend restorative justice to others',
      'Young offenders diverted from courts and custody successfully',
      'System achieved many but not all wellbeing goals',
      'International model adopted by many countries'
    ],
    externalUrl: 'https://spssi.onlinelibrary.wiley.com/doi/abs/10.1111/j.1540-4560.2006.00449.x',
    tags: ['restorative-justice', 'New Zealand', 'FGC', 'victim-satisfaction', 'international-model'],
    featured: true
  },
  {
    id: 'scotland-rj-review',
    title: 'Rapid Evidence Review: Uses of Restorative Justice',
    authors: ['Scottish Government'],
    organization: 'Scottish Government',
    year: 2023,
    category: 'restorative-justice',
    jurisdiction: 'Scotland',
    type: 'systematic-review',
    summary: 'Comprehensive evidence review of restorative justice effectiveness in Scotland, including evaluation of Glasgow youth services.',
    keyFindings: [
      '56% participation rate in restorative processes',
      'High satisfaction levels among participants',
      'RJ more effective for serious crimes than minor offenses',
      'Variable quality in Family Group Conferencing practices',
      'Need for better communication and youth empowerment'
    ],
    externalUrl: 'https://www.gov.scot/publications/rapid-evidence-review-uses-restorative-justice/pages/2/',
    tags: ['restorative-justice', 'Scotland', 'evidence-review', 'FGC', 'Glasgow'],
    featured: false
  },
  {
    id: 'aifs-child-protection-youth-justice',
    title: 'The Intersection Between Child Protection and Youth Justice Systems',
    authors: ['AIFS Research Team'],
    organization: 'Australian Institute of Family Studies',
    year: 2024,
    category: 'family-engagement',
    jurisdiction: 'Australia',
    type: 'policy-brief',
    summary: 'Policy paper examining the strong link between child maltreatment and youth offending, with evidence from 61 reports between 2010-2022.',
    keyFindings: [
      'Strong evidence linking child maltreatment to youth offending',
      'Children with abuse/neglect history at increased risk of offending',
      'Prevention and early intervention decrease child abuse and justice involvement',
      'Investment in family support reduces burden on youth justice systems',
      'Need for integrated service responses'
    ],
    externalUrl: 'https://aifs.gov.au/resources/policy-and-practice-papers/intersection-between-child-protection-and-youth-justice',
    tags: ['family-engagement', 'child-protection', 'prevention', 'AIFS', 'integrated-services'],
    featured: true
  },
  {
    id: 'trauma-symptoms-australia-2024',
    title: 'Understanding Trauma Symptoms Experienced by Young Men under Youth Justice Supervision',
    authors: ['Australian Research Team'],
    organization: 'Journal of Forensic Psychology',
    year: 2024,
    category: 'trauma-informed',
    jurisdiction: 'Australia',
    type: 'research-paper',
    summary: 'Study of 141 young men under youth justice supervision examining trauma symptomatology patterns and adverse childhood experiences.',
    keyFindings: [
      'Over 90% of participants reported trauma symptoms',
      'Strong correlation between ACEs and justice involvement',
      'Need for trauma screening at intake',
      'Mental health support critical component of supervision',
      'Gender-specific considerations for young men'
    ],
    externalUrl: 'https://www.tandfonline.com/doi/full/10.1080/14999013.2024.2323939',
    tags: ['trauma', 'ACEs', 'mental-health', 'Australia', 'young-men'],
    featured: false
  },
  {
    id: 'qld-youth-detention-lived-experience',
    title: 'Lived Experiences of Youth Justice Detention in Australia: Reframing the Institution',
    authors: ['NSW/NT Research Team'],
    organization: 'Australian Social Work',
    year: 2024,
    category: 'youth-rights',
    jurisdiction: 'Australia',
    type: 'case-study',
    summary: 'Qualitative research exploring lived experiences in NSW and NT detention, proposing alternative relational rights-based framework.',
    keyFindings: [
      'Current detention environments traumatizing for many youth',
      'Need for trauma-informed, therapeutic environments',
      'Relational rights-based framework proposed',
      'Highly resourced long-term transition pathways critical',
      'Youth voice essential in reform design'
    ],
    externalUrl: 'https://www.tandfonline.com/doi/full/10.1080/1323238X.2024.2412386',
    tags: ['detention', 'lived-experience', 'rights-based', 'NSW', 'NT'],
    featured: false
  },
  {
    id: 'community-led-diversion-remote',
    title: 'Community-Led Diversion of Indigenous Young People from the Justice System',
    authors: ['University Partnership Team'],
    organization: 'ScienceDirect Justice Research',
    year: 2024,
    category: 'indigenous-diversion',
    jurisdiction: 'Australia',
    type: 'case-study',
    summary: 'Documentation of Elders-led diversion model in remote community, developed through university partnership using government administrative data.',
    keyFindings: [
      'Elders-led model highly effective in remote settings',
      'Partnership model between community and university successful',
      'Administrative data critical for evaluation',
      'Place-based approaches essential',
      'Addresses all underlying factors, not just offending behavior'
    ],
    externalUrl: 'https://www.sciencedirect.com/science/article/pii/S1756061624000028',
    tags: ['Indigenous', 'Elders', 'remote', 'community-led', 'partnership'],
    featured: false
  },
  {
    id: 'meta-analysis-trauma-interventions',
    title: 'Trauma-Informed Interventions for At-Risk and Justice-Involved Youth: A Meta-Analysis',
    authors: ['Olaghere, Wilson, Kimbrell'],
    organization: 'Journal of Research in Crime and Delinquency',
    year: 2021,
    category: 'trauma-informed',
    jurisdiction: 'International',
    type: 'meta-analysis',
    summary: 'Comprehensive meta-analysis examining effectiveness of trauma-informed interventions for at-risk and justice-involved youth across multiple studies.',
    keyFindings: [
      'Trauma-informed interventions show moderate positive effects',
      'Effects strongest for mental health outcomes',
      'Less clear evidence for reducing recidivism',
      'Quality of implementation matters significantly',
      'Need for fidelity monitoring and evaluation'
    ],
    externalUrl: 'https://journals.sagepub.com/doi/abs/10.1177/00938548211003117',
    tags: ['meta-analysis', 'trauma', 'interventions', 'evidence-based', 'international'],
    featured: false
  },
  {
    id: 'nz-youth-justice-residences-international-models',
    title: 'Youth Justice Residences: Best International Practice Evidence Reviews - Models of Youth Justice Residences',
    authors: ['Oranga Tamariki Research Team'],
    organization: 'Oranga Tamariki - Ministry for Children, New Zealand',
    year: 2024,
    category: 'youth-rights',
    jurisdiction: 'International',
    type: 'systematic-review',
    summary: 'Comprehensive evidence review examining international models of youth justice residences across Anglo-American jurisdictions including Scotland, Australia, Norway and the US, identifying best practice approaches for therapeutic residential care.',
    keyFindings: [
      'Missouri Model: shift from large correctional facilities to smaller therapeutic environments',
      'Washington State Model: clinical approach incorporating Risk-Need-Responsivity framework',
      'Scandinavian Multifunctional Treatment: combines residential care with family support',
      'England/Wales Secure Children\'s Homes: home-like facilities with high staff ratios',
      'Physical restraint area under-researched with incomplete data',
      'Young people appreciate restraint when necessary for safety, but negative consequences common',
      'Therapeutic, smaller-scale environments show better outcomes than large institutions'
    ],
    externalUrl: 'https://www.orangatamariki.govt.nz/about-us/research/our-research/youth-justice-residences-best-international-practice-evidence-reviews/',
    pdfUrl: 'https://www.orangatamariki.govt.nz/assets/Uploads/About-us/Research/Latest-research/YJ-residences-best-international-practice-evidence-reviews/Summary-report-models-of-YJ-residences.pdf',
    tags: ['residential-care', 'international-models', 'Missouri-Model', 'therapeutic-care', 'detention-alternatives', 'New-Zealand'],
    featured: true
  },
  {
    id: 'nz-physical-restraint-deescalation',
    title: 'Physical Restraint and De-escalation: Best International Practice for Youth Justice Residences',
    authors: ['Oranga Tamariki Research Team'],
    organization: 'Oranga Tamariki - Ministry for Children, New Zealand',
    year: 2024,
    category: 'youth-rights',
    jurisdiction: 'International',
    type: 'systematic-review',
    summary: 'Evidence brief reviewing international best practice approaches to physical restraint and de-escalation in youth justice residences, examining research across multiple jurisdictions on safe practices.',
    keyFindings: [
      'Physical restraint area is under-researched with incomplete data',
      'Usually negative consequences when restraint is used',
      'Young people appreciate restraint when necessary for safety',
      'Need for clear policies and staff training on restraint use',
      'De-escalation techniques should be primary approach',
      'Trauma-informed practices reduce need for restraint',
      'Documentation and oversight critical for accountability'
    ],
    externalUrl: 'https://www.orangatamariki.govt.nz/about-us/research/our-research/youth-justice-residences-best-international-practice-evidence-reviews/',
    pdfUrl: 'https://www.orangatamariki.govt.nz/assets/Uploads/About-us/Research/Latest-research/YJ-residences-best-international-practice-evidence-reviews/Evidence-Brief-best-practice-and-models-of-YJ-residences.pdf',
    tags: ['physical-restraint', 'de-escalation', 'safety', 'detention', 'staff-training', 'New-Zealand'],
    featured: false
  },
  {
    id: 'missouri-model-therapeutic-residential',
    title: 'The Missouri Model of Juvenile Rehabilitation: Therapeutic Approach to Residential Care',
    authors: ['Annie E. Casey Foundation'],
    organization: 'Annie E. Casey Foundation',
    year: 2023,
    category: 'youth-rights',
    jurisdiction: 'International',
    type: 'case-study',
    summary: 'Comprehensive evaluation of Missouri\'s pioneering shift from large correctional facilities to small therapeutic residential programs emphasizing rehabilitation over punishment, with rigorous group treatment processes.',
    keyFindings: [
      'Recidivism rate of 24% compared to 43% (Texas) and 52% (Arizona)',
      'All facilities small (max 50 youth, average 20)',
      '85.3% of youth actively engaged in community after exit',
      'Mechanical restraints and isolation rarely used',
      'No youth suicides since training schools closed',
      'Very few assaults on youth or staff reported',
      'Model being replicated in Washington DC, San Jose, New Mexico, Louisiana'
    ],
    externalUrl: 'https://www.aecf.org/resources/the-missouri-model',
    tags: ['Missouri-Model', 'therapeutic-care', 'recidivism', 'residential-care', 'small-facilities', 'rehabilitation'],
    featured: true
  },
  {
    id: 'washington-state-integrated-treatment-model',
    title: 'Washington State Juvenile Rehabilitation Integrated Treatment Model: Outcomes and Implementation',
    authors: ['Washington State DCYF Research Team'],
    organization: 'Washington State Department of Children, Youth, and Families',
    year: 2020,
    category: 'trauma-informed',
    jurisdiction: 'International',
    type: 'report',
    summary: 'Legislative report examining Washington State\'s evidence-based Integrated Treatment Model (ITM) combining cognitive-behavioral therapy approaches for serious juvenile offenders in residential and community settings.',
    keyFindings: [
      'Employment rates increased by 34% after ITM implementation',
      'Re-arrest rates declined by 10%',
      'Evidence-based cognitive behavioral therapy (CBT) core to model',
      'Risk-Need-Responsivity framework integrated throughout',
      'Positive impact on long-term functioning documented',
      'Fidelity assessment shows strong implementation',
      'Model effective in both residential and community settings'
    ],
    externalUrl: 'https://dcyf.wa.gov/sites/default/files/pdf/Juvenile-Rehabilitation-Integrated-Treatment-Model-2020-Legislative-Report.pdf',
    pdfUrl: 'https://dcyf.wa.gov/sites/default/files/pdf/Juvenile-Rehabilitation-Integrated-Treatment-Model-2020-Legislative-Report.pdf',
    tags: ['Washington-State', 'CBT', 'evidence-based', 'employment', 'recidivism', 'integrated-treatment'],
    featured: true
  },
  {
    id: 'aifs-therapeutic-residential-care-australia',
    title: 'Therapeutic Residential Care: An Update on Current Issues in Australia',
    authors: ['AIFS Research Team'],
    organization: 'Australian Institute of Family Studies',
    year: 2018,
    category: 'trauma-informed',
    jurisdiction: 'Australia',
    type: 'policy-brief',
    summary: 'AIFS policy paper examining therapeutic residential care models across Australian states and territories, addressing complexity of need for young people unable to live in home-based care arrangements.',
    keyFindings: [
      'TRC involves purposefully constructed multi-dimensional living environment',
      'Intensive and time-limited care responding to trauma impacts',
      'Only 7.3% of out-of-home care population in residential care nationally',
      'Typically 3-4 children per suburban house with minimally qualified staff',
      'Criticized as "rebranding" exercise in some jurisdictions',
      'Inconsistent implementation identified as major concern',
      'Need for culturally and linguistically competent care documented'
    ],
    externalUrl: 'https://aifs.gov.au/resources/policy-and-practice-papers/therapeutic-residential-care-update-current-issues-australia',
    tags: ['therapeutic-care', 'Australia', 'AIFS', 'residential-care', 'trauma', 'implementation'],
    featured: false
  },
  {
    id: 'australia-young-people-lived-experience-trc',
    title: 'Young People\'s Lived Experience of Relational Practices in Therapeutic Residential Care in Australia',
    authors: ['ScienceDirect Research Team'],
    organization: 'Children and Youth Services Review',
    year: 2025,
    category: 'youth-rights',
    jurisdiction: 'Australia',
    type: 'research-paper',
    summary: 'Qualitative research examining lived experiences of young people aged 12-18 in Australian therapeutic residential care, focusing on relational practices and trust-building with staff.',
    keyFindings: [
      'Trust developed when staff genuinely invested time in youth wellbeing',
      'Care, respect, and feeling valued critical to positive relationships',
      'Constructive staff-youth relationships vital for therapeutic approach',
      'Relational security extends to maintaining safe environment',
      'Youth voice essential for understanding effective practices',
      'Quality relationships reduce need for restrictive interventions'
    ],
    externalUrl: 'https://www.sciencedirect.com/science/article/pii/S019074092500012X',
    tags: ['lived-experience', 'relational-practices', 'therapeutic-care', 'Australia', 'youth-voice', 'trust'],
    featured: false
  },
  {
    id: 'nz-youth-justice-custody-trends-2024',
    title: 'Youth Justice Custody: Updated Trends and Outlook 2024 - Forecast to June 2025',
    authors: ['Oranga Tamariki Research Team'],
    organization: 'Oranga Tamariki - Ministry for Children, New Zealand',
    year: 2024,
    category: 'recidivism',
    jurisdiction: 'New Zealand',
    type: 'report',
    summary: 'Analysis of changes in youth justice custody population across New Zealand residences, community homes, and placements between July 2017 and June 2024, with forecast to June 2025.',
    keyFindings: [
      'Estimated need for maximum 173 custody beds by June 2025',
      'Increased court volumes and remand cases driving custody demand',
      'Overnight police custody placements increased from 154 to 418 (2022-2024)',
      'Most youth in custody are on remand (proportion increased from 74% to 89%)',
      'Māori remain significantly overrepresented at 81% of custody population',
      'Longer custodial remands contributing to increased demand',
      'Proportion on remand vs sentenced continuing to grow'
    ],
    externalUrl: 'https://www.orangatamariki.govt.nz/about-us/research/our-research/youth-justice-custody-updated-trends-and-outlook-2024/',
    pdfUrl: 'https://www.orangatamariki.govt.nz/assets/Uploads/About-us/Research/Latest-research/YJ-custody-updated-trends-and-outlook/Youth-justice-custody-updated-trends-and-outlook-forecast-to-30-June-2025.pdf',
    tags: ['custody-trends', 'remand', 'Māori-overrepresentation', 'New-Zealand', 'detention', 'forecasting'],
    featured: false
  },
  {
    id: 'australia-relational-security-youth-detention',
    title: 'Relational Security: Balancing Care and Control in Youth Justice Detention Settings in Australia',
    authors: ['Australian Research Team'],
    organization: 'Children and Youth Services Review',
    year: 2024,
    category: 'trauma-informed',
    jurisdiction: 'Australia',
    type: 'research-paper',
    summary: 'Research examining relational security approaches in Australian youth justice detention, focusing on how constructive staff-youth relationships contribute to therapeutic environments and safe settings.',
    keyFindings: [
      'Relational security is vital component of therapeutic youth justice',
      'Positive relationships between staff and youth reduce incidents',
      'Balance of care and control critical for effective detention',
      'Staff training in relational approaches improves outcomes',
      'Therapeutic detention requires investment in relationship-building',
      'Safety enhanced through quality relationships, not just physical security'
    ],
    externalUrl: 'https://www.sciencedirect.com/science/article/pii/S019074092300508X',
    tags: ['relational-security', 'detention', 'Australia', 'therapeutic-care', 'staff-youth-relationships', 'safety'],
    featured: false
  },
  {
    id: 'diagrama-blueprint-for-change-nt',
    title: 'Blueprint for Change: Adapting Diagrama Foundation Model to Northern Territory',
    authors: ['Danila Dilba Health Service', 'Diagrama Foundation'],
    organization: 'Danila Dilba Health Service',
    year: 2020,
    category: 'youth-rights',
    jurisdiction: 'Australia',
    type: 'report',
    summary: 'Comprehensive report following 2019 Diagrama Foundation visit to Northern Territory, examining how Spain\'s "Love & Boundaries" therapeutic model could be adapted to NT youth justice context with cultural safety for Indigenous youth.',
    keyFindings: [
      'Diagrama achieves 13.6% recidivism vs 80-96% in traditional systems',
      '98% program completion rate with 30+ hours weekly education',
      'Zero youth suicides in Diagrama facilities demonstrates safety',
      '70%+ employment/education placement within 6 months',
      'Cultural adaptation critical for Indigenous NT youth',
      '5-stage model (Reception → Stabilisation → Development → Autonomy → Integration)',
      'Social educator model professionalizes youth work',
      'Cost-effective at €70,000 annually per youth'
    ],
    externalUrl: 'https://ddhs.org.au/resources/blueprint-change-diagrama-foundation-report',
    pdfUrl: 'https://ddhs.org.au/sites/default/files/media-library/documents/Blueprint for Change - Diagrama Foundation Report FINAL.pdf',
    tags: ['Diagrama', 'Spain', 'Northern-Territory', 'therapeutic-model', 'Indigenous', 'cultural-adaptation', 'Love-Boundaries'],
    featured: true
  },
  {
    id: 'diagrama-spain-love-boundaries-model',
    title: 'The Diagrama Foundation Spain: Love & Boundaries Therapeutic Model - 35 Years of Evidence',
    authors: ['Diagrama Foundation'],
    organization: 'Diagrama Foundation Spain',
    year: 2024,
    category: 'youth-rights',
    jurisdiction: 'International',
    type: 'case-study',
    summary: 'Comprehensive overview of Diagrama Foundation\'s 35-year track record operating 210+ centers across Spain, serving 20,000+ people annually with therapeutic "Love & Boundaries" model combining unconditional care with clear boundaries.',
    keyFindings: [
      '40,000+ young lives transformed since 1991',
      '13.6% recidivism rate (vs 80-96% traditional detention)',
      '98% program completion demonstrates engagement',
      'Zero youth suicides shows safe, supportive environment',
      'UN special consultative status - international recognition',
      'Re-education centers with qualified social educators, not guards',
      'No mechanical restraints or isolation used',
      'Successfully replicated in UK, Australia, and other countries'
    ],
    externalUrl: 'https://www.diagramaaustralia.org/',
    tags: ['Diagrama', 'Spain', 'therapeutic-model', 'recidivism', 'Love-Boundaries', 'international-model', 'social-educators'],
    featured: true
  },
  {
    id: 'diagrama-international-juvenile-justice-observatory',
    title: 'International Juvenile Justice Observatory (IJJO): Diagrama\'s Global Impact',
    authors: ['International Juvenile Justice Observatory'],
    organization: 'IJJO - Founded by Diagrama Foundation',
    year: 2024,
    category: 'youth-rights',
    jurisdiction: 'International',
    type: 'policy-brief',
    summary: 'Overview of Diagrama-founded International Juvenile Justice Observatory established in Brussels (2002), promoting juvenile justice system improvements globally through research, training, technical support, and advocacy.',
    keyFindings: [
      'Founded in Brussels 2002 by Diagrama Foundation',
      'Focus on rights of children in conflict with law',
      'International, interdisciplinary, rights-based perspective',
      'Activities: training, research, technical support, advocacy',
      'Open platform for knowledge sharing globally',
      'Produces reports on European juvenile justice systems',
      'Promotes restorative justice and alternatives to detention',
      'Disseminates specialized resources and new developments'
    ],
    externalUrl: 'https://www.oijj.org/en',
    tags: ['IJJO', 'Diagrama', 'international-collaboration', 'research', 'training', 'advocacy', 'rights-based'],
    featured: false
  },
  {
    id: 'nsw-youth-koori-court-evaluation',
    title: 'NSW Youth Koori Court: Impact on Sentencing and Re-offending Outcomes',
    authors: ['BOCSAR Research Team'],
    organization: 'NSW Bureau of Crime Statistics and Research',
    year: 2022,
    category: 'indigenous-diversion',
    jurisdiction: 'Australia',
    type: 'research-paper',
    summary: 'Comprehensive BOCSAR evaluation of Youth Koori Court established in 2015 at Parramatta, expanded to Surry Hills (2019) and Dubbo (2023), examining custody rates and reoffending outcomes for Aboriginal young people.',
    keyFindings: [
      '40% less likely to receive custodial sentence at court finalisation',
      '84% less likely to receive custody at re-conviction if reoffended',
      'Average custody time reduced from 57 days to 25 days',
      'Overwhelming support from staff, stakeholders, participants and families',
      'Uses Elders and respected people to develop Action and Support Plans',
      'Addresses risk factors: homelessness, education, health, drug/alcohol',
      'Improves cultural connections and community engagement',
      'No statistically significant reduction in reoffending (but reduced custody when reoffending occurs)'
    ],
    externalUrl: 'https://bocsar.nsw.gov.au/media/2022/mr-ykc-outcomes.html',
    pdfUrl: 'https://childrenscourt.nsw.gov.au/documents/reports/2022-Report-Impact-NSW_Youth-Koori-Court-on-sentencing-and-reoffending-outcomes-V8.pdf',
    tags: ['NSW', 'Youth-Koori-Court', 'Indigenous', 'custody-reduction', 'Elders', 'cultural-connection', 'BOCSAR'],
    featured: true
  },
  {
    id: 'victoria-therapeutic-youth-justice-model',
    title: 'Victoria\'s Therapeutic Youth Justice Model: Risk-Need-Responsivity Approach',
    authors: ['Department of Justice and Community Safety Victoria'],
    organization: 'Victorian Government',
    year: 2024,
    category: 'trauma-informed',
    jurisdiction: 'Australia',
    type: 'policy-brief',
    summary: 'Overview of Victoria\'s evidence-based therapeutic approach using risk-need-responsivity framework, trialling family therapeutic interventions including Multi-Systemic Therapy and Functional Family Therapy for youth justice.',
    keyFindings: [
      'Diversion and early intervention most effective for most young people',
      'Risk-Need-Responsivity approach matches services to risk levels',
      'Trialling Multi-Systemic Therapy (MST) and Functional Family Therapy',
      'Community-based interventions with strongest evidence base',
      'Therapeutic Treatment Order model in effect since 2007',
      'SABTS program keeps youth in community at reduced cost',
      'Similar or lower sexual recidivism rates vs residential treatment',
      'Strategic Plan 2020-2030 focuses on reducing reoffending'
    ],
    externalUrl: 'https://www.justice.vic.gov.au/justice-system/youth-justice',
    tags: ['Victoria', 'therapeutic-model', 'MST', 'FFT', 'risk-need-responsivity', 'diversion', 'evidence-based'],
    featured: true
  },
  {
    id: 'qld-youth-justice-restorative-justice-review',
    title: 'A Review of Restorative Justice Programmes for First Nations Peoples in Queensland',
    authors: ['Tandf Online Research Team'],
    organization: 'Taylor & Francis Online',
    year: 2024,
    category: 'indigenous-diversion',
    jurisdiction: 'Queensland',
    type: 'systematic-review',
    summary: 'Comprehensive review examining restorative justice adoption for First Nations peoples in Queensland, identifying significant limitations in program capacity, uptake, and referral rates for diversionary mechanisms.',
    keyFindings: [
      'Restorative justice adopted in significantly limited capacity in QLD',
      'Significant lack of program uptake for adult programs',
      'Limited referral rates hinder effective diversion',
      '$134M spent 2018-2023 on youth justice service providers',
      '68% ($92M) to NGOs, 32% ($42M) to First Nations-led organizations',
      'Limited assessment of program effectiveness despite investment',
      'Indigenous youth offending linked to systemic disadvantage, trauma, instability',
      'Programs must be tailored to each community through active participation'
    ],
    externalUrl: 'https://www.tandfonline.com/doi/full/10.1080/01924036.2024.2319295',
    tags: ['Queensland', 'restorative-justice', 'First-Nations', 'diversion', 'program-evaluation', 'community-led'],
    featured: false
  },
  {
    id: 'wa-aboriginal-youth-justice-overrepresentation',
    title: 'Western Australia Aboriginal Youth Programs: Addressing Overrepresentation in Justice System',
    authors: ['Indigenous Justice Clearinghouse', 'AIHW'],
    organization: 'Australian Institute of Health and Welfare',
    year: 2023,
    category: 'indigenous-diversion',
    jurisdiction: 'Australia',
    type: 'report',
    summary: 'Analysis of Aboriginal youth overrepresentation in WA justice system where 71% of children in detention were Aboriginal despite being 6% of youth population, examining community-led solutions and diversionary programs.',
    keyFindings: [
      '71% of children in detention were Aboriginal (only 6% of youth population)',
      'First Nations youth 27 times more likely to be under supervision',
      '40 times overrepresentation in detention vs 25 times in community supervision',
      'Community-led justice reinvestment programs keep kids out of jail',
      'Local First Nations programs often insufficiently funded',
      'Magistrates report funding gaps make detention more likely option',
      'Lack of focus on youth offender needs vs adult initiatives',
      'Declining commitment to diversion principle by police'
    ],
    externalUrl: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-annual-report-2022-23/contents/fact-sheets/western-australia',
    tags: ['Western-Australia', 'Aboriginal', 'overrepresentation', 'community-led', 'justice-reinvestment', 'diversion-gaps'],
    featured: false
  },
  {
    id: 'qld-youth-justice-audit-reoffending-rates',
    title: 'Queensland Audit Office: Reducing Serious Youth Crime - Reoffending Analysis',
    authors: ['Queensland Audit Office'],
    organization: 'Queensland Government',
    year: 2024,
    category: 'recidivism',
    jurisdiction: 'Queensland',
    type: 'report',
    summary: 'Critical audit examining Queensland\'s youth justice outcomes, revealing 75% reoffend within 2 weeks of release and 84-96% within 12 months, despite $134M investment in rehabilitation programs.',
    keyFindings: [
      '75% reoffended within 2 weeks of release from detention',
      '84-96% reoffended within 12 months of release',
      '$134M spent on youth justice services 2018-2023',
      'Limited assessment of program effectiveness despite investment',
      'Youth Justice Strategy 2019-2023 not implemented effectively',
      'Only partial action plan developed, not for full strategy period',
      '72-hour post-release plan not preventing rapid reoffending',
      'Need for comprehensive evaluation of rehabilitation programs'
    ],
    externalUrl: 'https://www.qao.qld.gov.au/reports-resources/reports-parliament/reducing-serious-youth-crime',
    tags: ['Queensland', 'recidivism', 'audit', 'reoffending', 'program-evaluation', 'post-release'],
    featured: true
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Research', count: RESEARCH_DATA.length },
  { id: 'trauma-informed', label: 'Trauma-Informed Practice', count: RESEARCH_DATA.filter(r => r.category === 'trauma-informed').length },
  { id: 'indigenous-diversion', label: 'Indigenous-Led Diversion', count: RESEARCH_DATA.filter(r => r.category === 'indigenous-diversion').length },
  { id: 'family-engagement', label: 'Family Engagement', count: RESEARCH_DATA.filter(r => r.category === 'family-engagement').length },
  { id: 'restorative-justice', label: 'Restorative Justice', count: RESEARCH_DATA.filter(r => r.category === 'restorative-justice').length },
  { id: 'youth-rights', label: 'Youth Rights & Lived Experience', count: RESEARCH_DATA.filter(r => r.category === 'youth-rights').length }
];

const JURISDICTIONS = [
  { id: 'all', label: 'All Jurisdictions' },
  { id: 'Australia', label: 'Australia' },
  { id: 'Queensland', label: 'Queensland' },
  { id: 'New Zealand', label: 'New Zealand' },
  { id: 'Scotland', label: 'Scotland' },
  { id: 'International', label: 'International' }
];

const TYPES = [
  { id: 'all', label: 'All Types' },
  { id: 'research-paper', label: 'Research Papers' },
  { id: 'systematic-review', label: 'Systematic Reviews' },
  { id: 'meta-analysis', label: 'Meta-Analyses' },
  { id: 'case-study', label: 'Case Studies' },
  { id: 'policy-brief', label: 'Policy Briefs' },
  { id: 'report', label: 'Reports' }
];

export default function ResearchLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState<'year' | 'title'>('year');

  // Filter and search logic
  const filteredResearch = useMemo(() => {
    let results = RESEARCH_DATA;

    // Category filter
    if (selectedCategory !== 'all') {
      results = results.filter(r => r.category === selectedCategory);
    }

    // Jurisdiction filter
    if (selectedJurisdiction !== 'all') {
      results = results.filter(r => r.jurisdiction === selectedJurisdiction);
    }

    // Type filter
    if (selectedType !== 'all') {
      results = results.filter(r => r.type === selectedType);
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.summary.toLowerCase().includes(query) ||
        r.organization.toLowerCase().includes(query) ||
        r.authors.some(a => a.toLowerCase().includes(query)) ||
        r.tags.some(t => t.toLowerCase().includes(query)) ||
        r.keyFindings.some(f => f.toLowerCase().includes(query))
      );
    }

    // Sort
    results.sort((a, b) => {
      if (sortBy === 'year') return b.year - a.year;
      return a.title.localeCompare(b.title);
    });

    return results;
  }, [searchQuery, selectedCategory, selectedJurisdiction, selectedType, sortBy]);

  const featuredResearch = RESEARCH_DATA.filter(r => r.featured);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'research-paper': return <FileText className="h-5 w-5" />;
      case 'systematic-review': return <BookOpen className="h-5 w-5" />;
      case 'meta-analysis': return <TrendingUp className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'case-study': return <Users className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="header-offset">
        {/* Header */}
        <section className="section-padding bg-gradient-to-br from-blue-50 via-white to-purple-50 border-b-2 border-black">
          <div className="container-justice">
            <Link
              href="/centre-of-excellence"
              className="inline-flex items-center gap-2 font-bold text-gray-700 hover:text-black mb-6 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Centre of Excellence
            </Link>

            <div className="inline-block px-4 py-2 bg-blue-100 border-2 border-black mb-6">
              <span className="font-bold">RESEARCH LIBRARY</span>
            </div>

            <h1 className="headline-truth mb-6">
              Active Research & Evidence Base
            </h1>

            <p className="text-xl text-gray-700 max-w-4xl mb-8 leading-relaxed">
              Comprehensive collection of peer-reviewed research, systematic reviews, and evidence-based frameworks driving youth justice reform across Australia and internationally.
            </p>

            {/* Map Link */}
            <div className="mb-8">
              <Link
                href="/centre-of-excellence/map"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all"
              >
                <MapPin className="h-5 w-5" />
                View Research Sources on Global Map
              </Link>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search research by title, author, keywords, findings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Featured Research */}
        {searchQuery === '' && selectedCategory === 'all' && selectedJurisdiction === 'all' && selectedType === 'all' && (
          <section className="section-padding border-b-2 border-black bg-yellow-50">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-8">
                <Award className="h-8 w-8" />
                <h2 className="text-3xl font-bold">Featured Research</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredResearch.slice(0, 4).map((item) => (
                  <div key={item.id} className="border-2 border-black p-6 bg-white hover:shadow-brutal transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        {getTypeIcon(item.type)}
                        <span className="font-bold">{getTypeLabel(item.type)}</span>
                      </div>
                      <span className="px-3 py-1 bg-yellow-400 text-xs font-bold">{item.year}</span>
                    </div>

                    <h3 className="text-xl font-bold mb-3 leading-tight">{item.title}</h3>

                    <div className="text-sm text-gray-600 mb-3">
                      <div className="font-medium">{item.authors.join(', ')}</div>
                      <div>{item.organization}</div>
                    </div>

                    <p className="text-gray-700 mb-4 text-sm leading-relaxed">{item.summary}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium">{item.jurisdiction}</span>
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      {item.externalUrl && (
                        <a
                          href={item.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold hover:underline inline-flex items-center gap-1"
                        >
                          View Research <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {item.pdfUrl && (
                        <a
                          href={item.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold hover:underline inline-flex items-center gap-1"
                        >
                          Download PDF <Download className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="flex items-center gap-3 mb-6">
              <Filter className="h-6 w-6" />
              <h2 className="text-2xl font-bold">Filter Research</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-bold mb-2">Research Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Jurisdiction Filter */}
              <div>
                <label className="block text-sm font-bold mb-2">Jurisdiction</label>
                <select
                  value={selectedJurisdiction}
                  onChange={(e) => setSelectedJurisdiction(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {JURISDICTIONS.map(jur => (
                    <option key={jur.id} value={jur.id}>{jur.label}</option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-bold mb-2">Research Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-bold mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'year' | 'title')}
                  className="w-full px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="year">Year (Newest First)</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Active Filters Summary */}
            {(selectedCategory !== 'all' || selectedJurisdiction !== 'all' || selectedType !== 'all' || searchQuery) && (
              <div className="mt-6 p-4 bg-white border-2 border-black">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">Active filters:</span>
                    {searchQuery && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium">
                        Search: "{searchQuery}"
                      </span>
                    )}
                    {selectedCategory !== 'all' && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium">
                        {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                      </span>
                    )}
                    {selectedJurisdiction !== 'all' && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium">
                        {selectedJurisdiction}
                      </span>
                    )}
                    {selectedType !== 'all' && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium">
                        {TYPES.find(t => t.id === selectedType)?.label}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedJurisdiction('all');
                      setSelectedType('all');
                    }}
                    className="px-4 py-2 border-2 border-black font-bold hover:bg-black hover:text-white transition-all"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Results */}
        <section className="section-padding">
          <div className="container-justice">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">
                {filteredResearch.length} {filteredResearch.length === 1 ? 'Result' : 'Results'}
              </h2>
            </div>

            {filteredResearch.length === 0 ? (
              <div className="text-center py-16 border-2 border-black p-12 bg-gray-50">
                <Search className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-2xl font-bold mb-2">No research found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or search query</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedJurisdiction('all');
                    setSelectedType('all');
                  }}
                  className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredResearch.map((item) => (
                  <div key={item.id} className="border-2 border-black p-6 bg-white hover:shadow-brutal transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            {getTypeIcon(item.type)}
                            <span className="font-bold">{getTypeLabel(item.type)}</span>
                          </div>
                          <span className="px-3 py-1 bg-gray-100 text-xs font-bold">{item.year}</span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold">{item.jurisdiction}</span>
                        </div>

                        <h3 className="text-2xl font-bold mb-2 leading-tight">{item.title}</h3>

                        <div className="text-sm text-gray-600 mb-4">
                          <div className="font-medium">{item.authors.join(', ')}</div>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            {item.organization}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 leading-relaxed">{item.summary}</p>

                    <div className="mb-4">
                      <h4 className="font-bold mb-2">Key Findings:</h4>
                      <ul className="space-y-1">
                        {item.keyFindings.map((finding, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium border border-gray-300">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
                      {item.externalUrl && (
                        <a
                          href={item.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-all inline-flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Full Research
                        </a>
                      )}
                      {item.pdfUrl && (
                        <a
                          href={item.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-all inline-flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </a>
                      )}
                      {item.videoUrl && (
                        <a
                          href={item.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-all inline-flex items-center gap-2"
                        >
                          <Video className="h-4 w-4" />
                          Watch Video
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding bg-gradient-to-br from-blue-400 to-purple-400 border-t-2 border-black">
          <div className="container-justice text-center">
            <h2 className="headline-truth mb-6 text-white">Contribute to Our Research Library</h2>
            <p className="text-xl text-white max-w-3xl mx-auto mb-8 leading-relaxed">
              Have research, case studies, or evidence-based frameworks to share? Help build Australia's most comprehensive youth justice evidence base.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-4 bg-white text-black font-bold hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2"
              >
                <FileText className="h-5 w-5" />
                Submit Research
              </Link>
              <Link
                href="/centre-of-excellence"
                className="px-8 py-4 border-2 border-white text-white font-bold hover:bg-white hover:text-black transition-all inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Centre
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
