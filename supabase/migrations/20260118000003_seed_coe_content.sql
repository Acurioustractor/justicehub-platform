-- Centre of Excellence: Seed Data
-- Migration: 20260118000003
-- Purpose: Seed Australian frameworks and research items from static content

-- ============================================================
-- AUSTRALIAN FRAMEWORKS (4 items)
-- ============================================================

INSERT INTO australian_frameworks (
  slug, name, state, tagline, overview, key_features, strengths, challenges, outcomes, resources, color, display_order, latitude, longitude
) VALUES
(
  'nsw-youth-koori-court',
  'NSW Youth Koori Court',
  'New South Wales',
  '40% reduction in custodial sentences for Aboriginal young people',
  'Established in 2015 at Parramatta Children''s Court, the Youth Koori Court uses Elders and respected people from Aboriginal and Torres Strait Islander communities to address underlying causes of offending. The court develops Action and Support Plans addressing risk factors like homelessness, education disengagement, and health issues while strengthening cultural connections.',
  ARRAY[
    'Elders and respected Aboriginal community members guide proceedings',
    'Action and Support Plans developed collaboratively with young person',
    'Addresses underlying risk factors: housing, education, health, substance use',
    'Strengthens cultural connections and community engagement',
    'Monitored implementation over months with regular reviews',
    'Operating in Parramatta (2015), Surry Hills (2019), Dubbo (2023)',
    'Overwhelming support from participants, families, and stakeholders'
  ],
  ARRAY[
    'Significant 40% reduction in custodial sentences',
    '84% less custody at re-conviction demonstrates lasting impact',
    'Halves average detention time (57 to 25 days)',
    'Strong cultural foundation with Elder involvement',
    'Addresses root causes, not just offending behavior',
    'Overwhelming participant and stakeholder satisfaction',
    'Successfully expanded to three locations',
    'BOCSAR independent evaluation confirms effectiveness'
  ],
  ARRAY[
    'No statistically significant reduction in reoffending rates overall',
    'Requires substantial Elder and community involvement',
    'Resource intensive model needing dedicated staff',
    'Limited to areas with strong Aboriginal community presence',
    'Takes months to complete Action Plans',
    'Need for more long-term outcome data',
    'Expansion requires careful community consultation'
  ],
  '[
    {"metric": "Custody Reduction at Sentencing", "value": "40%", "context": "less likely to receive custodial sentence at court finalisation"},
    {"metric": "Custody at Re-conviction", "value": "84%", "context": "less likely to receive custody if they reoffend"},
    {"metric": "Average Detention Time", "value": "57 → 25 days", "context": "average custody time reduced from 57 to 25 days"}
  ]'::jsonb,
  '[
    {"title": "BOCSAR Evaluation: Impact on Sentencing and Re-offending Outcomes (2022)", "type": "research", "url": "https://bocsar.nsw.gov.au/media/2022/mr-ykc-outcomes.html", "description": "Independent evaluation by NSW Bureau of Crime Statistics and Research"},
    {"title": "Full Evaluation Report PDF", "type": "report", "url": "https://childrenscourt.nsw.gov.au/documents/reports/2022-Report-Impact-NSW_Youth-Koori-Court-on-sentencing-and-reoffending-outcomes-V8.pdf", "description": "Comprehensive PDF report with detailed methodology and findings"},
    {"title": "Youth Koori Court - Children''s Court NSW", "type": "policy", "url": "https://childrenscourt.nsw.gov.au/criminal/koori-court.html", "description": "Official court information and procedures"}
  ]'::jsonb,
  'blue',
  1,
  -33.8136,
  151.0034
),
(
  'victoria-therapeutic-services',
  'Victoria''s Therapeutic Youth Justice Model',
  'Victoria',
  'Evidence-based Risk-Need-Responsivity approach with MST and FFT trials',
  'Victoria''s youth justice system uses a Risk-Need-Responsivity (RNR) framework that matches interventions to risk levels, addresses offending-related needs, and responds to individual characteristics. The state is trialling evidence-based family therapeutic interventions including Multi-Systemic Therapy (MST) and Functional Family Therapy (FFT), with strong emphasis on community-based rather than custodial responses.',
  ARRAY[
    'Risk-Need-Responsivity framework guides all interventions',
    'Multi-Systemic Therapy (MST) trials for serious offenders',
    'Functional Family Therapy (FFT) for family engagement',
    'Therapeutic Treatment Orders for community-based care',
    'SABTS program for youth with harmful sexual behaviors (since 2007)',
    'Diversion and early intervention prioritized',
    'Youth Justice Strategic Plan 2020-2030 for system transformation'
  ],
  ARRAY[
    'Strong evidence base for therapeutic interventions',
    'MST and FFT proven effective internationally',
    'Community-based approaches more cost-effective',
    'Therapeutic Treatment Orders keep youth out of custody',
    'SABTS 17-year track record demonstrates sustainability',
    'Strategic Plan provides long-term vision (2020-2030)',
    'Focus on family involvement addresses systemic issues',
    'Diversion prioritized for most young people'
  ],
  ARRAY[
    'Staff morale and retention issues impact implementation',
    'Therapeutic models require highly trained staff',
    'Resource intensive interventions (MST/FFT)',
    'Limited availability of evidence-based programs',
    'Still developing consistent statewide approach',
    'Need for more rigorous outcome evaluation',
    'Balancing therapeutic approach with community safety concerns'
  ],
  '[
    {"metric": "Community-Based Success", "value": "Similar/Lower", "context": "recidivism rates vs residential treatment at far reduced cost"},
    {"metric": "SABTS Program", "value": "17 years", "context": "of proven community-based treatment since 2007"},
    {"metric": "Evidence Base", "value": "Strongest", "context": "for community settings with defined therapeutic approaches"}
  ]'::jsonb,
  '[
    {"title": "Victorian Youth Justice Strategic Plan 2020-2030", "type": "policy", "url": "https://www.justice.vic.gov.au/justice-system/youth-justice/youth-justice-strategic-plan-2020-2030-reducing-reoffending-and", "description": "Long-term strategic framework for youth justice transformation"},
    {"title": "Youth Justice Overview - Department of Justice and Community Safety", "type": "policy", "url": "https://www.justice.vic.gov.au/justice-system/youth-justice", "description": "Current programs, services, and therapeutic approaches"},
    {"title": "Victorian Juvenile Justice Rehabilitation Review", "type": "report", "url": "https://www.aic.gov.au/sites/default/files/2020-05/victorian-juvenile-justice-rehabilitation-reveiw.pdf", "description": "Comprehensive review of rehabilitation programs and outcomes"}
  ]'::jsonb,
  'purple',
  2,
  -37.8136,
  144.9631
),
(
  'queensland-diversion-model',
  'Queensland Youth Justice Diversion & Restorative Justice',
  'Queensland',
  'First Nations-led programs with $134M investment, identifying critical improvement areas',
  'Queensland has invested significantly in youth justice diversion and restorative justice programs, particularly for First Nations young people. The state spent $134M between 2018-2023, with 32% allocated to First Nations-led organizations. However, recent audits and reviews have identified critical challenges including high reoffending rates (75% within 2 weeks, 84-96% within 12 months) and limited program effectiveness assessment.',
  ARRAY[
    'Restorative justice programs for First Nations youth',
    '$134M investment 2018-2023 in youth justice services',
    '32% ($42M) to First Nations-led organizations',
    'Youth Justice Strategy 2019-2023 framework',
    'Community-based service providers (68% NGO-delivered)',
    '72-hour post-release plans for serious offenders',
    'Focus on cultural responsiveness and community participation'
  ],
  ARRAY[
    'Significant investment in youth justice services ($134M)',
    'Strong commitment to First Nations-led programs (32% funding)',
    'Comprehensive Youth Justice Strategy developed',
    'Restorative justice programs available',
    'NGO partnerships bring community expertise',
    'Recognition of need for cultural responsiveness',
    'Programs tailored to community needs'
  ],
  ARRAY[
    'Extremely high reoffending rates (75% within 2 weeks)',
    '84-96% reoffend within 12 months - critical systemic issue',
    'Limited assessment of program effectiveness despite $134M spend',
    'Youth Justice Strategy 2019-2023 not implemented effectively',
    'Only partial action plan developed',
    'Restorative justice adopted in limited capacity',
    'Significant lack of program uptake and referrals',
    'Limited evaluation culture across programs',
    'Post-release plans not preventing rapid reoffending'
  ],
  '[
    {"metric": "Reoffending Rate (2 weeks)", "value": "75%", "context": "reoffend within 2 weeks of release - major challenge identified"},
    {"metric": "Reoffending Rate (12 months)", "value": "84-96%", "context": "reoffend within 12 months - among highest in Australia"},
    {"metric": "Program Investment", "value": "$134M", "context": "spent 2018-2023, but limited effectiveness assessment"}
  ]'::jsonb,
  '[
    {"title": "Queensland Audit Office: Reducing Serious Youth Crime (2024)", "type": "report", "url": "https://www.qao.qld.gov.au/reports-resources/reports-parliament/reducing-serious-youth-crime", "description": "Critical audit of youth justice outcomes and program effectiveness"},
    {"title": "Review of Restorative Justice Programmes for First Nations Peoples", "type": "research", "url": "https://www.tandfonline.com/doi/full/10.1080/01924036.2024.2319295", "description": "Academic review examining restorative justice capacity and uptake"},
    {"title": "Youth Justice Strategy - Department of Youth Justice", "type": "policy", "url": "https://www.youthjustice.qld.gov.au/our-department/strategies-reform/strategy", "description": "Strategic framework and reform initiatives"}
  ]'::jsonb,
  'yellow',
  3,
  -27.4698,
  153.0251
),
(
  'wa-aboriginal-youth-programs',
  'WA Aboriginal Youth Justice Programs',
  'Western Australia',
  'Addressing severe overrepresentation: 71% in detention are Aboriginal (6% of population)',
  'Western Australia faces the most severe Aboriginal youth overrepresentation in Australia, with 71% of children in detention being Aboriginal despite comprising only 6% of the youth population. First Nations young people are 27 times more likely to be under youth justice supervision and 40 times overrepresented in detention. Community-led justice reinvestment programs show promise but face critical underfunding.',
  ARRAY[
    'Community-led justice reinvestment initiatives',
    'Aboriginal-led program design and delivery',
    'Diversionary programs including cautions and conferencing',
    'Circle sentencing and Indigenous court processes',
    'Prisoner through-care arrangements',
    'Focus on keeping young people in communities and schools',
    'Partnership between Aboriginal organizations and government'
  ],
  ARRAY[
    'Community-led programs proven to keep kids out of jail',
    'Aboriginal-steered policies more effective',
    'Justice reinvestment approach addresses root causes',
    'Strong community knowledge and cultural connections',
    'Young people remain in communities and schools',
    'Aboriginal Legal Service advocacy and support',
    'Recognition of need for comprehensive reform'
  ],
  ARRAY[
    'Worst overrepresentation in Australia (71% vs 6% population)',
    '27-40 times overrepresentation demonstrates systemic crisis',
    'Aboriginal programs critically underfunded',
    'Magistrates report funding gaps force detention',
    'Declining police commitment to diversion',
    'Lack of focus on youth vs adult offender needs',
    'Limited clarity on youth justice role',
    'Decline in quality of support for at-risk families',
    'Federal action needed but lacking'
  ],
  '[
    {"metric": "Detention Overrepresentation", "value": "71%", "context": "of children in detention are Aboriginal (6% of youth population)"},
    {"metric": "Supervision Overrepresentation", "value": "27 times", "context": "more likely to be under youth justice supervision"},
    {"metric": "Detention Disparity", "value": "40 times", "context": "overrepresentation in detention vs non-Indigenous youth"}
  ]'::jsonb,
  '[
    {"title": "AIHW Youth Justice in Australia 2022-23: Western Australia", "type": "report", "url": "https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-annual-report-2022-23/contents/fact-sheets/western-australia", "description": "Official statistics on WA youth justice system and overrepresentation"},
    {"title": "Indigenous Justice Clearinghouse: Youth Justice in Western Australia", "type": "research", "url": "https://www.indigenousjustice.gov.au/resources/youth-justice-in-western-australia/", "description": "Analysis of Indigenous youth justice issues in WA"},
    {"title": "Aboriginal Legal Service WA: Youth Justice Crisis", "type": "policy", "url": "https://nit.com.au/17-10-2024/14313/alswa-calls-for-federal-action-to-address-crisis-in-was-youth-justice-system", "description": "ALSWA advocacy for federal action on youth justice crisis"}
  ]'::jsonb,
  'red',
  4,
  -31.9505,
  115.8605
);

-- ============================================================
-- RESEARCH ITEMS (27 items)
-- ============================================================

INSERT INTO research_items (
  slug, title, authors, organization, year, category, jurisdiction, type, summary, key_findings, external_url, pdf_url, video_url, tags, is_featured, display_order
) VALUES
-- Item 1: Trauma-Informed Umbrella Review
(
  'trauma-informed-umbrella-2024',
  'The Outcomes of Trauma-Informed Practice in Youth Justice: An Umbrella Review',
  ARRAY['Multiple Authors'],
  'Journal of Child & Adolescent Trauma',
  2024,
  'trauma-informed',
  'International',
  'systematic-review',
  'Comprehensive umbrella review summarizing systematic reviews and meta-analyses (2017-2023) on trauma-informed youth justice outcomes, examining whether trauma-informed approaches produce expected results.',
  ARRAY[
    'High rates of complex trauma among justice-involved young people',
    'Uncertainty remains about whether trauma-informed approaches produce expected outcomes',
    'Need for more rigorous evaluation of trauma-informed interventions',
    'Importance of trauma screening and assessment in youth justice settings'
  ],
  'https://link.springer.com/article/10.1007/s40653-024-00634-5',
  NULL,
  NULL,
  ARRAY['trauma', 'evidence-based', 'systematic-review', 'international'],
  true,
  1
),
-- Item 2: Frontiers Trauma-Informed
(
  'frontiers-trauma-informed-2023',
  'The Effectiveness of Trauma-Informed Youth Justice: A Discussion and Review',
  ARRAY['Frontiers Research Team'],
  'Frontiers in Psychology',
  2023,
  'trauma-informed',
  'International',
  'research-paper',
  'Critical discussion and review of evidence for trauma-informed practice effectiveness in youth justice, examining theoretical foundations and practical implementation challenges.',
  ARRAY[
    'Trauma-informed care shows promise but needs stronger evaluation',
    'Staff training is critical for successful implementation',
    'Environmental and organizational changes necessary',
    'Need for youth and family involvement in service design'
  ],
  'https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1157695/full',
  NULL,
  NULL,
  ARRAY['trauma', 'implementation', 'staff-training', 'evidence'],
  true,
  2
),
-- Item 3: Indigenous Diversion Cultural
(
  'indigenous-diversion-cultural-2024',
  'Resisting the Incarceration of Aboriginal and Torres Strait Islander Children: Cultural Responsiveness of Diversion Programs',
  ARRAY['Lowitja Institute Research Team'],
  'First Nations Health and Wellbeing - The Lowitja Journal',
  2024,
  'indigenous-diversion',
  'Australia',
  'systematic-review',
  'Scoping review of 31 studies examining 15 diversion program types for cultural responsiveness, finding wide variation in how programs address Indigenous cultural needs.',
  ARRAY[
    '10 programs scored high for cultural responsiveness, 16 medium, 5 low',
    'Best programs support social/emotional wellbeing through Indigenous-led, place-based approaches',
    'Only 10/31 programs addressed connection to land, culture, spirituality, family',
    'Indigenous-led programs show decline in offending behavior',
    'Holistic approaches addressing underlying factors most effective'
  ],
  'https://www.lowitjajournal.org.au/article/S2949-8406(24)00014-7/fulltext',
  NULL,
  NULL,
  ARRAY['Indigenous', 'cultural-safety', 'diversion', 'holistic', 'Australia'],
  true,
  3
),
-- Item 4: AIFS Indigenous Youth Justice
(
  'aifs-indigenous-youth-justice',
  'Indigenous Youth Justice Programs Evaluation',
  ARRAY['AIFS Research Team'],
  'Australian Institute of Family Studies',
  2023,
  'indigenous-diversion',
  'Australia',
  'report',
  'Australian Government-funded evaluation examining effectiveness of four programs designed to divert Indigenous people from the justice system.',
  ARRAY[
    'NT Police Pre-Court Juvenile Diversion shows Indigenous youth less likely to re-offend',
    'Community-led models most effective for remote communities',
    'Elders involvement critical to program success',
    'Programs must address all underlying factors driving justice contact'
  ],
  'https://aifs.gov.au/research/commissioned-reports/indigenous-youth-justice-programs-evaluation',
  'https://www.aic.gov.au/sites/default/files/2020-05/Indigenous-Youth-Justice-Programs-Evaluation.pdf',
  NULL,
  ARRAY['Indigenous', 'evaluation', 'diversion', 'community-led', 'AIFS'],
  true,
  4
),
-- Item 5: NZ Restorative Justice
(
  'nz-restorative-justice-2006',
  'Youth Justice in New Zealand: Restorative Justice in Practice',
  ARRAY['Gabrielle Maxwell'],
  'Victoria University of Wellington',
  2006,
  'restorative-justice',
  'New Zealand',
  'research-paper',
  'Landmark study examining New Zealand''s restorative justice approach through Family Group Conferences, considered an international exemplar.',
  ARRAY[
    '86% of victims satisfied with restorative justice conference',
    '84% would recommend restorative justice to others',
    'Young offenders diverted from courts and custody successfully',
    'System achieved many but not all wellbeing goals',
    'International model adopted by many countries'
  ],
  'https://spssi.onlinelibrary.wiley.com/doi/abs/10.1111/j.1540-4560.2006.00449.x',
  NULL,
  NULL,
  ARRAY['restorative-justice', 'New Zealand', 'FGC', 'victim-satisfaction', 'international-model'],
  true,
  5
),
-- Item 6: Scotland RJ Review
(
  'scotland-rj-review',
  'Rapid Evidence Review: Uses of Restorative Justice',
  ARRAY['Scottish Government'],
  'Scottish Government',
  2023,
  'restorative-justice',
  'Scotland',
  'systematic-review',
  'Comprehensive evidence review of restorative justice effectiveness in Scotland, including evaluation of Glasgow youth services.',
  ARRAY[
    '56% participation rate in restorative processes',
    'High satisfaction levels among participants',
    'RJ more effective for serious crimes than minor offenses',
    'Variable quality in Family Group Conferencing practices',
    'Need for better communication and youth empowerment'
  ],
  'https://www.gov.scot/publications/rapid-evidence-review-uses-restorative-justice/pages/2/',
  NULL,
  NULL,
  ARRAY['restorative-justice', 'Scotland', 'evidence-review', 'FGC', 'Glasgow'],
  false,
  6
),
-- Item 7: AIFS Child Protection Youth Justice
(
  'aifs-child-protection-youth-justice',
  'The Intersection Between Child Protection and Youth Justice Systems',
  ARRAY['AIFS Research Team'],
  'Australian Institute of Family Studies',
  2024,
  'family-engagement',
  'Australia',
  'policy-brief',
  'Policy paper examining the strong link between child maltreatment and youth offending, with evidence from 61 reports between 2010-2022.',
  ARRAY[
    'Strong evidence linking child maltreatment to youth offending',
    'Children with abuse/neglect history at increased risk of offending',
    'Prevention and early intervention decrease child abuse and justice involvement',
    'Investment in family support reduces burden on youth justice systems',
    'Need for integrated service responses'
  ],
  'https://aifs.gov.au/resources/policy-and-practice-papers/intersection-between-child-protection-and-youth-justice',
  NULL,
  NULL,
  ARRAY['family-engagement', 'child-protection', 'prevention', 'AIFS', 'integrated-services'],
  true,
  7
),
-- Item 8: Trauma Symptoms Australia
(
  'trauma-symptoms-australia-2024',
  'Understanding Trauma Symptoms Experienced by Young Men under Youth Justice Supervision',
  ARRAY['Australian Research Team'],
  'Journal of Forensic Psychology',
  2024,
  'trauma-informed',
  'Australia',
  'research-paper',
  'Study of 141 young men under youth justice supervision examining trauma symptomatology patterns and adverse childhood experiences.',
  ARRAY[
    'Over 90% of participants reported trauma symptoms',
    'Strong correlation between ACEs and justice involvement',
    'Need for trauma screening at intake',
    'Mental health support critical component of supervision',
    'Gender-specific considerations for young men'
  ],
  'https://www.tandfonline.com/doi/full/10.1080/14999013.2024.2323939',
  NULL,
  NULL,
  ARRAY['trauma', 'ACEs', 'mental-health', 'Australia', 'young-men'],
  false,
  8
),
-- Item 9: QLD Youth Detention Lived Experience
(
  'qld-youth-detention-lived-experience',
  'Lived Experiences of Youth Justice Detention in Australia: Reframing the Institution',
  ARRAY['NSW/NT Research Team'],
  'Australian Social Work',
  2024,
  'youth-rights',
  'Australia',
  'case-study',
  'Qualitative research exploring lived experiences in NSW and NT detention, proposing alternative relational rights-based framework.',
  ARRAY[
    'Current detention environments traumatizing for many youth',
    'Need for trauma-informed, therapeutic environments',
    'Relational rights-based framework proposed',
    'Highly resourced long-term transition pathways critical',
    'Youth voice essential in reform design'
  ],
  'https://www.tandfonline.com/doi/full/10.1080/1323238X.2024.2412386',
  NULL,
  NULL,
  ARRAY['detention', 'lived-experience', 'rights-based', 'NSW', 'NT'],
  false,
  9
),
-- Item 10: Community-Led Diversion Remote
(
  'community-led-diversion-remote',
  'Community-Led Diversion of Indigenous Young People from the Justice System',
  ARRAY['University Partnership Team'],
  'ScienceDirect Justice Research',
  2024,
  'indigenous-diversion',
  'Australia',
  'case-study',
  'Documentation of Elders-led diversion model in remote community, developed through university partnership using government administrative data.',
  ARRAY[
    'Elders-led model highly effective in remote settings',
    'Partnership model between community and university successful',
    'Administrative data critical for evaluation',
    'Place-based approaches essential',
    'Addresses all underlying factors, not just offending behavior'
  ],
  'https://www.sciencedirect.com/science/article/pii/S1756061624000028',
  NULL,
  NULL,
  ARRAY['Indigenous', 'Elders', 'remote', 'community-led', 'partnership'],
  false,
  10
),
-- Item 11: Meta-Analysis Trauma Interventions
(
  'meta-analysis-trauma-interventions',
  'Trauma-Informed Interventions for At-Risk and Justice-Involved Youth: A Meta-Analysis',
  ARRAY['Olaghere, Wilson, Kimbrell'],
  'Journal of Research in Crime and Delinquency',
  2021,
  'trauma-informed',
  'International',
  'meta-analysis',
  'Comprehensive meta-analysis examining effectiveness of trauma-informed interventions for at-risk and justice-involved youth across multiple studies.',
  ARRAY[
    'Trauma-informed interventions show moderate positive effects',
    'Effects strongest for mental health outcomes',
    'Less clear evidence for reducing recidivism',
    'Quality of implementation matters significantly',
    'Need for fidelity monitoring and evaluation'
  ],
  'https://journals.sagepub.com/doi/abs/10.1177/00938548211003117',
  NULL,
  NULL,
  ARRAY['meta-analysis', 'trauma', 'interventions', 'evidence-based', 'international'],
  false,
  11
),
-- Item 12: NZ Youth Justice Residences International Models
(
  'nz-youth-justice-residences-international-models',
  'Youth Justice Residences: Best International Practice Evidence Reviews - Models of Youth Justice Residences',
  ARRAY['Oranga Tamariki Research Team'],
  'Oranga Tamariki - Ministry for Children, New Zealand',
  2024,
  'youth-rights',
  'International',
  'systematic-review',
  'Comprehensive evidence review examining international models of youth justice residences across Anglo-American jurisdictions including Scotland, Australia, Norway and the US, identifying best practice approaches for therapeutic residential care.',
  ARRAY[
    'Missouri Model: shift from large correctional facilities to smaller therapeutic environments',
    'Washington State Model: clinical approach incorporating Risk-Need-Responsivity framework',
    'Scandinavian Multifunctional Treatment: combines residential care with family support',
    'England/Wales Secure Children''s Homes: home-like facilities with high staff ratios',
    'Physical restraint area under-researched with incomplete data',
    'Young people appreciate restraint when necessary for safety, but negative consequences common',
    'Therapeutic, smaller-scale environments show better outcomes than large institutions'
  ],
  'https://www.orangatamariki.govt.nz/about-us/research/our-research/youth-justice-residences-best-international-practice-evidence-reviews/',
  'https://www.orangatamariki.govt.nz/assets/Uploads/About-us/Research/Latest-research/YJ-residences-best-international-practice-evidence-reviews/Summary-report-models-of-YJ-residences.pdf',
  NULL,
  ARRAY['residential-care', 'international-models', 'Missouri-Model', 'therapeutic-care', 'detention-alternatives', 'New-Zealand'],
  true,
  12
),
-- Item 13: NZ Physical Restraint De-escalation
(
  'nz-physical-restraint-deescalation',
  'Physical Restraint and De-escalation: Best International Practice for Youth Justice Residences',
  ARRAY['Oranga Tamariki Research Team'],
  'Oranga Tamariki - Ministry for Children, New Zealand',
  2024,
  'youth-rights',
  'International',
  'systematic-review',
  'Evidence brief reviewing international best practice approaches to physical restraint and de-escalation in youth justice residences, examining research across multiple jurisdictions on safe practices.',
  ARRAY[
    'Physical restraint area is under-researched with incomplete data',
    'Usually negative consequences when restraint is used',
    'Young people appreciate restraint when necessary for safety',
    'Need for clear policies and staff training on restraint use',
    'De-escalation techniques should be primary approach',
    'Trauma-informed practices reduce need for restraint',
    'Documentation and oversight critical for accountability'
  ],
  'https://www.orangatamariki.govt.nz/about-us/research/our-research/youth-justice-residences-best-international-practice-evidence-reviews/',
  'https://www.orangatamariki.govt.nz/assets/Uploads/About-us/Research/Latest-research/YJ-residences-best-international-practice-evidence-reviews/Evidence-Brief-best-practice-and-models-of-YJ-residences.pdf',
  NULL,
  ARRAY['physical-restraint', 'de-escalation', 'safety', 'detention', 'staff-training', 'New-Zealand'],
  false,
  13
),
-- Item 14: Missouri Model Therapeutic Residential
(
  'missouri-model-therapeutic-residential',
  'The Missouri Model of Juvenile Rehabilitation: Therapeutic Approach to Residential Care',
  ARRAY['Annie E. Casey Foundation'],
  'Annie E. Casey Foundation',
  2023,
  'youth-rights',
  'International',
  'case-study',
  'Comprehensive evaluation of Missouri''s pioneering shift from large correctional facilities to small therapeutic residential programs emphasizing rehabilitation over punishment, with rigorous group treatment processes.',
  ARRAY[
    'Recidivism rate of 24% compared to 43% (Texas) and 52% (Arizona)',
    'All facilities small (max 50 youth, average 20)',
    '85.3% of youth actively engaged in community after exit',
    'Mechanical restraints and isolation rarely used',
    'No youth suicides since training schools closed',
    'Very few assaults on youth or staff reported',
    'Model being replicated in Washington DC, San Jose, New Mexico, Louisiana'
  ],
  'https://www.aecf.org/resources/the-missouri-model',
  NULL,
  NULL,
  ARRAY['Missouri-Model', 'therapeutic-care', 'recidivism', 'residential-care', 'small-facilities', 'rehabilitation'],
  true,
  14
),
-- Item 15: Washington State Integrated Treatment Model
(
  'washington-state-integrated-treatment-model',
  'Washington State Juvenile Rehabilitation Integrated Treatment Model: Outcomes and Implementation',
  ARRAY['Washington State DCYF Research Team'],
  'Washington State Department of Children, Youth, and Families',
  2020,
  'trauma-informed',
  'International',
  'report',
  'Legislative report examining Washington State''s evidence-based Integrated Treatment Model (ITM) combining cognitive-behavioral therapy approaches for serious juvenile offenders in residential and community settings.',
  ARRAY[
    'Employment rates increased by 34% after ITM implementation',
    'Re-arrest rates declined by 10%',
    'Evidence-based cognitive behavioral therapy (CBT) core to model',
    'Risk-Need-Responsivity framework integrated throughout',
    'Positive impact on long-term functioning documented',
    'Fidelity assessment shows strong implementation',
    'Model effective in both residential and community settings'
  ],
  'https://dcyf.wa.gov/sites/default/files/pdf/Juvenile-Rehabilitation-Integrated-Treatment-Model-2020-Legislative-Report.pdf',
  'https://dcyf.wa.gov/sites/default/files/pdf/Juvenile-Rehabilitation-Integrated-Treatment-Model-2020-Legislative-Report.pdf',
  NULL,
  ARRAY['Washington-State', 'CBT', 'evidence-based', 'employment', 'recidivism', 'integrated-treatment'],
  true,
  15
),
-- Item 16: AIFS Therapeutic Residential Care Australia
(
  'aifs-therapeutic-residential-care-australia',
  'Therapeutic Residential Care: An Update on Current Issues in Australia',
  ARRAY['AIFS Research Team'],
  'Australian Institute of Family Studies',
  2018,
  'trauma-informed',
  'Australia',
  'policy-brief',
  'AIFS policy paper examining therapeutic residential care models across Australian states and territories, addressing complexity of need for young people unable to live in home-based care arrangements.',
  ARRAY[
    'TRC involves purposefully constructed multi-dimensional living environment',
    'Intensive and time-limited care responding to trauma impacts',
    'Only 7.3% of out-of-home care population in residential care nationally',
    'Typically 3-4 children per suburban house with minimally qualified staff',
    'Criticized as "rebranding" exercise in some jurisdictions',
    'Inconsistent implementation identified as major concern',
    'Need for culturally and linguistically competent care documented'
  ],
  'https://aifs.gov.au/resources/policy-and-practice-papers/therapeutic-residential-care-update-current-issues-australia',
  NULL,
  NULL,
  ARRAY['therapeutic-care', 'Australia', 'AIFS', 'residential-care', 'trauma', 'implementation'],
  false,
  16
),
-- Item 17: Australia Young People Lived Experience TRC
(
  'australia-young-people-lived-experience-trc',
  'Young People''s Lived Experience of Relational Practices in Therapeutic Residential Care in Australia',
  ARRAY['ScienceDirect Research Team'],
  'Children and Youth Services Review',
  2025,
  'youth-rights',
  'Australia',
  'research-paper',
  'Qualitative research examining lived experiences of young people aged 12-18 in Australian therapeutic residential care, focusing on relational practices and trust-building with staff.',
  ARRAY[
    'Trust developed when staff genuinely invested time in youth wellbeing',
    'Care, respect, and feeling valued critical to positive relationships',
    'Constructive staff-youth relationships vital for therapeutic approach',
    'Relational security extends to maintaining safe environment',
    'Youth voice essential for understanding effective practices',
    'Quality relationships reduce need for restrictive interventions'
  ],
  'https://www.sciencedirect.com/science/article/pii/S019074092500012X',
  NULL,
  NULL,
  ARRAY['lived-experience', 'relational-practices', 'therapeutic-care', 'Australia', 'youth-voice', 'trust'],
  false,
  17
),
-- Item 18: NZ Youth Justice Custody Trends 2024
(
  'nz-youth-justice-custody-trends-2024',
  'Youth Justice Custody: Updated Trends and Outlook 2024 - Forecast to June 2025',
  ARRAY['Oranga Tamariki Research Team'],
  'Oranga Tamariki - Ministry for Children, New Zealand',
  2024,
  'recidivism',
  'New Zealand',
  'report',
  'Analysis of changes in youth justice custody population across New Zealand residences, community homes, and placements between July 2017 and June 2024, with forecast to June 2025.',
  ARRAY[
    'Estimated need for maximum 173 custody beds by June 2025',
    'Increased court volumes and remand cases driving custody demand',
    'Overnight police custody placements increased from 154 to 418 (2022-2024)',
    'Most youth in custody are on remand (proportion increased from 74% to 89%)',
    'Māori remain significantly overrepresented at 81% of custody population',
    'Longer custodial remands contributing to increased demand',
    'Proportion on remand vs sentenced continuing to grow'
  ],
  'https://www.orangatamariki.govt.nz/about-us/research/our-research/youth-justice-custody-updated-trends-and-outlook-2024/',
  'https://www.orangatamariki.govt.nz/assets/Uploads/About-us/Research/Latest-research/YJ-custody-updated-trends-and-outlook/Youth-justice-custody-updated-trends-and-outlook-forecast-to-30-June-2025.pdf',
  NULL,
  ARRAY['custody-trends', 'remand', 'Māori-overrepresentation', 'New-Zealand', 'detention', 'forecasting'],
  false,
  18
),
-- Item 19: Australia Relational Security Youth Detention
(
  'australia-relational-security-youth-detention',
  'Relational Security: Balancing Care and Control in Youth Justice Detention Settings in Australia',
  ARRAY['Australian Research Team'],
  'Children and Youth Services Review',
  2024,
  'trauma-informed',
  'Australia',
  'research-paper',
  'Research examining relational security approaches in Australian youth justice detention, focusing on how constructive staff-youth relationships contribute to therapeutic environments and safe settings.',
  ARRAY[
    'Relational security is vital component of therapeutic youth justice',
    'Positive relationships between staff and youth reduce incidents',
    'Balance of care and control critical for effective detention',
    'Staff training in relational approaches improves outcomes',
    'Therapeutic detention requires investment in relationship-building',
    'Safety enhanced through quality relationships, not just physical security'
  ],
  'https://www.sciencedirect.com/science/article/pii/S019074092300508X',
  NULL,
  NULL,
  ARRAY['relational-security', 'detention', 'Australia', 'therapeutic-care', 'staff-youth-relationships', 'safety'],
  false,
  19
),
-- Item 20: Diagrama Blueprint for Change NT
(
  'diagrama-blueprint-for-change-nt',
  'Blueprint for Change: Adapting Diagrama Foundation Model to Northern Territory',
  ARRAY['Danila Dilba Health Service', 'Diagrama Foundation'],
  'Danila Dilba Health Service',
  2020,
  'youth-rights',
  'Australia',
  'report',
  'Comprehensive report following 2019 Diagrama Foundation visit to Northern Territory, examining how Spain''s "Love & Boundaries" therapeutic model could be adapted to NT youth justice context with cultural safety for Indigenous youth.',
  ARRAY[
    'Diagrama achieves 13.6% recidivism vs 80-96% in traditional systems',
    '98% program completion rate with 30+ hours weekly education',
    'Zero youth suicides in Diagrama facilities demonstrates safety',
    '70%+ employment/education placement within 6 months',
    'Cultural adaptation critical for Indigenous NT youth',
    '5-stage model (Reception → Stabilisation → Development → Autonomy → Integration)',
    'Social educator model professionalizes youth work',
    'Cost-effective at €70,000 annually per youth'
  ],
  'https://ddhs.org.au/resources/blueprint-change-diagrama-foundation-report',
  'https://ddhs.org.au/sites/default/files/media-library/documents/Blueprint for Change - Diagrama Foundation Report FINAL.pdf',
  NULL,
  ARRAY['Diagrama', 'Spain', 'Northern-Territory', 'therapeutic-model', 'Indigenous', 'cultural-adaptation', 'Love-Boundaries'],
  true,
  20
),
-- Item 21: Diagrama Spain Love Boundaries Model
(
  'diagrama-spain-love-boundaries-model',
  'The Diagrama Foundation Spain: Love & Boundaries Therapeutic Model - 35 Years of Evidence',
  ARRAY['Diagrama Foundation'],
  'Diagrama Foundation Spain',
  2024,
  'youth-rights',
  'International',
  'case-study',
  'Comprehensive overview of Diagrama Foundation''s 35-year track record operating 210+ centers across Spain, serving 20,000+ people annually with therapeutic "Love & Boundaries" model combining unconditional care with clear boundaries.',
  ARRAY[
    '40,000+ young lives transformed since 1991',
    '13.6% recidivism rate (vs 80-96% traditional detention)',
    '98% program completion demonstrates engagement',
    'Zero youth suicides shows safe, supportive environment',
    'UN special consultative status - international recognition',
    'Re-education centers with qualified social educators, not guards',
    'No mechanical restraints or isolation used',
    'Successfully replicated in UK, Australia, and other countries'
  ],
  'https://www.diagramaaustralia.org/',
  NULL,
  NULL,
  ARRAY['Diagrama', 'Spain', 'therapeutic-model', 'recidivism', 'Love-Boundaries', 'international-model', 'social-educators'],
  true,
  21
),
-- Item 22: Diagrama IJJO
(
  'diagrama-international-juvenile-justice-observatory',
  'International Juvenile Justice Observatory (IJJO): Diagrama''s Global Impact',
  ARRAY['International Juvenile Justice Observatory'],
  'IJJO - Founded by Diagrama Foundation',
  2024,
  'youth-rights',
  'International',
  'policy-brief',
  'Overview of Diagrama-founded International Juvenile Justice Observatory established in Brussels (2002), promoting juvenile justice system improvements globally through research, training, technical support, and advocacy.',
  ARRAY[
    'Founded in Brussels 2002 by Diagrama Foundation',
    'Focus on rights of children in conflict with law',
    'International, interdisciplinary, rights-based perspective',
    'Activities: training, research, technical support, advocacy',
    'Open platform for knowledge sharing globally',
    'Produces reports on European juvenile justice systems',
    'Promotes restorative justice and alternatives to detention',
    'Disseminates specialized resources and new developments'
  ],
  'https://www.oijj.org/en',
  NULL,
  NULL,
  ARRAY['IJJO', 'Diagrama', 'international-collaboration', 'research', 'training', 'advocacy', 'rights-based'],
  false,
  22
),
-- Item 23: NSW Youth Koori Court Evaluation
(
  'nsw-youth-koori-court-evaluation',
  'NSW Youth Koori Court: Impact on Sentencing and Re-offending Outcomes',
  ARRAY['BOCSAR Research Team'],
  'NSW Bureau of Crime Statistics and Research',
  2022,
  'indigenous-diversion',
  'Australia',
  'research-paper',
  'Comprehensive BOCSAR evaluation of Youth Koori Court established in 2015 at Parramatta, expanded to Surry Hills (2019) and Dubbo (2023), examining custody rates and reoffending outcomes for Aboriginal young people.',
  ARRAY[
    '40% less likely to receive custodial sentence at court finalisation',
    '84% less likely to receive custody at re-conviction if reoffended',
    'Average custody time reduced from 57 days to 25 days',
    'Overwhelming support from staff, stakeholders, participants and families',
    'Uses Elders and respected people to develop Action and Support Plans',
    'Addresses risk factors: homelessness, education, health, drug/alcohol',
    'Improves cultural connections and community engagement',
    'No statistically significant reduction in reoffending (but reduced custody when reoffending occurs)'
  ],
  'https://bocsar.nsw.gov.au/media/2022/mr-ykc-outcomes.html',
  'https://childrenscourt.nsw.gov.au/documents/reports/2022-Report-Impact-NSW_Youth-Koori-Court-on-sentencing-and-reoffending-outcomes-V8.pdf',
  NULL,
  ARRAY['NSW', 'Youth-Koori-Court', 'Indigenous', 'custody-reduction', 'Elders', 'cultural-connection', 'BOCSAR'],
  true,
  23
),
-- Item 24: Victoria Therapeutic Youth Justice Model
(
  'victoria-therapeutic-youth-justice-model',
  'Victoria''s Therapeutic Youth Justice Model: Risk-Need-Responsivity Approach',
  ARRAY['Department of Justice and Community Safety Victoria'],
  'Victorian Government',
  2024,
  'trauma-informed',
  'Australia',
  'policy-brief',
  'Overview of Victoria''s evidence-based therapeutic approach using risk-need-responsivity framework, trialling family therapeutic interventions including Multi-Systemic Therapy and Functional Family Therapy for youth justice.',
  ARRAY[
    'Diversion and early intervention most effective for most young people',
    'Risk-Need-Responsivity approach matches services to risk levels',
    'Trialling Multi-Systemic Therapy (MST) and Functional Family Therapy',
    'Community-based interventions with strongest evidence base',
    'Therapeutic Treatment Order model in effect since 2007',
    'SABTS program keeps youth in community at reduced cost',
    'Similar or lower sexual recidivism rates vs residential treatment',
    'Strategic Plan 2020-2030 focuses on reducing reoffending'
  ],
  'https://www.justice.vic.gov.au/justice-system/youth-justice',
  NULL,
  NULL,
  ARRAY['Victoria', 'therapeutic-model', 'MST', 'FFT', 'risk-need-responsivity', 'diversion', 'evidence-based'],
  true,
  24
),
-- Item 25: QLD Youth Justice Restorative Justice Review
(
  'qld-youth-justice-restorative-justice-review',
  'A Review of Restorative Justice Programmes for First Nations Peoples in Queensland',
  ARRAY['Tandf Online Research Team'],
  'Taylor & Francis Online',
  2024,
  'indigenous-diversion',
  'Queensland',
  'systematic-review',
  'Comprehensive review examining restorative justice adoption for First Nations peoples in Queensland, identifying significant limitations in program capacity, uptake, and referral rates for diversionary mechanisms.',
  ARRAY[
    'Restorative justice adopted in significantly limited capacity in QLD',
    'Significant lack of program uptake for adult programs',
    'Limited referral rates hinder effective diversion',
    '$134M spent 2018-2023 on youth justice service providers',
    '68% ($92M) to NGOs, 32% ($42M) to First Nations-led organizations',
    'Limited assessment of program effectiveness despite investment',
    'Indigenous youth offending linked to systemic disadvantage, trauma, instability',
    'Programs must be tailored to each community through active participation'
  ],
  'https://www.tandfonline.com/doi/full/10.1080/01924036.2024.2319295',
  NULL,
  NULL,
  ARRAY['Queensland', 'restorative-justice', 'First-Nations', 'diversion', 'program-evaluation', 'community-led'],
  false,
  25
),
-- Item 26: WA Aboriginal Youth Justice Overrepresentation
(
  'wa-aboriginal-youth-justice-overrepresentation',
  'Western Australia Aboriginal Youth Programs: Addressing Overrepresentation in Justice System',
  ARRAY['Indigenous Justice Clearinghouse', 'AIHW'],
  'Australian Institute of Health and Welfare',
  2023,
  'indigenous-diversion',
  'Australia',
  'report',
  'Analysis of Aboriginal youth overrepresentation in WA justice system where 71% of children in detention were Aboriginal despite being 6% of youth population, examining community-led solutions and diversionary programs.',
  ARRAY[
    '71% of children in detention were Aboriginal (only 6% of youth population)',
    'First Nations youth 27 times more likely to be under supervision',
    '40 times overrepresentation in detention vs 25 times in community supervision',
    'Community-led justice reinvestment programs keep kids out of jail',
    'Local First Nations programs often insufficiently funded',
    'Magistrates report funding gaps make detention more likely option',
    'Lack of focus on youth offender needs vs adult initiatives',
    'Declining commitment to diversion principle by police'
  ],
  'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-annual-report-2022-23/contents/fact-sheets/western-australia',
  NULL,
  NULL,
  ARRAY['Western-Australia', 'Aboriginal', 'overrepresentation', 'community-led', 'justice-reinvestment', 'diversion-gaps'],
  false,
  26
),
-- Item 27: QLD Youth Justice Audit Reoffending Rates
(
  'qld-youth-justice-audit-reoffending-rates',
  'Queensland Audit Office: Reducing Serious Youth Crime - Reoffending Analysis',
  ARRAY['Queensland Audit Office'],
  'Queensland Government',
  2024,
  'recidivism',
  'Queensland',
  'report',
  'Critical audit examining Queensland''s youth justice outcomes, revealing 75% reoffend within 2 weeks of release and 84-96% within 12 months, despite $134M investment in rehabilitation programs.',
  ARRAY[
    '75% reoffended within 2 weeks of release from detention',
    '84-96% reoffended within 12 months of release',
    '$134M spent on youth justice services 2018-2023',
    'Limited assessment of program effectiveness despite investment',
    'Youth Justice Strategy 2019-2023 not implemented effectively',
    'Only partial action plan developed, not for full strategy period',
    '72-hour post-release plan not preventing rapid reoffending',
    'Need for comprehensive evaluation of rehabilitation programs'
  ],
  'https://www.qao.qld.gov.au/reports-resources/reports-parliament/reducing-serious-youth-crime',
  NULL,
  NULL,
  ARRAY['Queensland', 'recidivism', 'audit', 'reoffending', 'program-evaluation', 'post-release'],
  true,
  27
);

-- Add comment for seed data
COMMENT ON TABLE australian_frameworks IS 'Seeded with 4 Australian state/territory frameworks from best-practice page';
COMMENT ON TABLE research_items IS 'Seeded with 27 research items from research library page';
