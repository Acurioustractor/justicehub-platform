/**
 * Geographic data for Centre of Excellence resources
 * Maps research, international models, and Australian frameworks to locations
 */

export type ExcellenceCategory =
  | 'international-model'
  | 'australian-framework'
  | 'research-source'
  | 'training-hub';

export interface ExcellenceLocation {
  id: string;
  name: string;
  category: ExcellenceCategory;
  type: 'global-insight' | 'best-practice' | 'research' | 'training';
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  country: string;
  city?: string;
  state?: string;
  keyStats: string[];
  tags: string[];
  detailUrl: string; // Links to specific section on CoE pages
  externalUrl?: string;
  featured?: boolean;
}

/**
 * International Best Practice Models
 * ALL 16 programs from the database mapped to geographic locations
 */
export const internationalModels: ExcellenceLocation[] = [
  {
    id: 'progression-units-brazil',
    name: 'Progression Units',
    category: 'international-model',
    type: 'global-insight',
    description: 'São Paulo progressive model with 4% recidivism. Small living units with therapeutic approach.',
    coordinates: { lat: -23.5505, lng: -46.6333 }, // São Paulo
    country: 'Brazil',
    city: 'São Paulo',
    keyStats: [
      '4% recidivism rate',
      'Progressive intervention model',
      'Small therapeutic units'
    ],
    tags: ['therapeutic', 'low-recidivism', 'progressive'],
    detailUrl: '/centre-of-excellence/global-insights',
    featured: true
  },
  {
    id: 'nicro-south-africa',
    name: 'NICRO Diversion Programs',
    category: 'international-model',
    type: 'global-insight',
    description: 'South Africa\'s diversion programs achieving 6.7% recidivism through community-based interventions.',
    coordinates: { lat: -33.9249, lng: 18.4241 }, // Cape Town
    country: 'South Africa',
    city: 'Cape Town',
    keyStats: [
      '6.7% recidivism rate',
      'Community-based diversion',
      'Restorative justice focus'
    ],
    tags: ['diversion', 'low-recidivism', 'community-based'],
    detailUrl: '/centre-of-excellence/global-insights',
    featured: true
  },
  {
    id: 'missouri-model',
    name: 'Missouri Model',
    category: 'international-model',
    type: 'global-insight',
    description: 'Small therapeutic units with 8% recidivism vs 43-52% other US states. Zero youth suicides.',
    coordinates: { lat: 38.5767, lng: -92.1735 }, // Jefferson City, MO
    country: 'United States',
    city: 'Jefferson City',
    state: 'Missouri',
    keyStats: [
      '8% recidivism rate',
      'Zero youth suicides',
      '85.3% community engagement'
    ],
    tags: ['therapeutic', 'low-recidivism', 'small-units'],
    detailUrl: '/centre-of-excellence/global-insights',
    externalUrl: 'https://www.aecf.org/',
    featured: true
  },
  {
    id: 'spain-diagrama',
    name: 'Spain - Diagrama Foundation',
    category: 'international-model',
    type: 'global-insight',
    description: 'Love & Boundaries model achieving 13.6% recidivism vs 80-96% traditional systems. 40,000+ youth transformed.',
    coordinates: { lat: 40.4168, lng: -3.7038 }, // Madrid
    country: 'Spain',
    city: 'Madrid',
    keyStats: [
      '13.6% recidivism rate',
      '98% program completion',
      '40,000+ lives transformed since 1991'
    ],
    tags: ['therapeutic', 'evidence-based', 'low-recidivism'],
    detailUrl: '/centre-of-excellence/global-insights',
    externalUrl: 'https://www.diagramaaustralia.org/',
    featured: true
  },
  {
    id: 'police-cautioning-hk',
    name: 'Police Cautioning Scheme',
    category: 'international-model',
    type: 'global-insight',
    description: 'Hong Kong\'s diversionary model with 20% recidivism through police-led interventions.',
    coordinates: { lat: 22.3193, lng: 114.1694 }, // Hong Kong
    country: 'Hong Kong',
    city: 'Hong Kong',
    keyStats: [
      '20% recidivism rate',
      'Police-led diversion',
      'Community partnerships'
    ],
    tags: ['diversion', 'police-led', 'community-based'],
    detailUrl: '/centre-of-excellence/global-insights',
    featured: false
  },
  {
    id: 'nz-oranga-tamariki',
    name: 'New Zealand - Oranga Tamariki',
    category: 'international-model',
    type: 'global-insight',
    description: 'Family Group Conferences with 86% victim satisfaction. Youth-led restorative justice approach.',
    coordinates: { lat: -41.2865, lng: 174.7762 }, // Wellington
    country: 'New Zealand',
    city: 'Wellington',
    keyStats: [
      '86% victim satisfaction',
      'Family-led decision making',
      'Reduced youth custody rates'
    ],
    tags: ['restorative', 'family-centered', 'victim-focus'],
    detailUrl: '/centre-of-excellence/global-insights#new-zealand-oranga-tamariki',
    externalUrl: 'https://www.orangatamariki.govt.nz/',
    featured: true
  },
  {
    id: 'roca-inc',
    name: 'Roca, Inc.',
    category: 'international-model',
    type: 'global-insight',
    description: 'Massachusetts intervention program with transformative approach to high-risk youth.',
    coordinates: { lat: 42.3601, lng: -71.0589 }, // Boston, MA
    country: 'United States',
    city: 'Boston',
    state: 'Massachusetts',
    keyStats: [
      '29% recidivism rate',
      'High-risk youth focus',
      'Intensive intervention model'
    ],
    tags: ['intervention', 'high-risk', 'transformative'],
    detailUrl: '/centre-of-excellence/global-insights',
    externalUrl: 'https://rocainc.org/',
    featured: false
  },
  {
    id: 'youth-conferencing-ni',
    name: 'Youth Conferencing',
    category: 'international-model',
    type: 'global-insight',
    description: 'Northern Ireland\'s restorative justice conferencing model.',
    coordinates: { lat: 54.5973, lng: -5.9301 }, // Belfast
    country: 'Northern Ireland',
    city: 'Belfast',
    keyStats: [
      '54% recidivism rate',
      'Restorative conferencing',
      'Family inclusion model'
    ],
    tags: ['restorative', 'conferencing', 'family-based'],
    detailUrl: '/centre-of-excellence/global-insights',
    featured: false
  },
  {
    id: 'mst-fft',
    name: 'Multisystemic & Functional Family Therapy',
    category: 'international-model',
    type: 'global-insight',
    description: 'Evidence-based therapeutic interventions used across United States.',
    coordinates: { lat: 38.9072, lng: -77.0369 }, // Washington DC
    country: 'United States',
    city: 'Washington',
    state: 'DC',
    keyStats: [
      'Evidence-based therapy',
      'Family systems approach',
      'Widely replicated model'
    ],
    tags: ['therapeutic', 'family-therapy', 'evidence-based'],
    detailUrl: '/centre-of-excellence/global-insights',
    featured: false
  },
  {
    id: 'wraparound-milwaukee',
    name: 'Wraparound Milwaukee',
    category: 'international-model',
    type: 'global-insight',
    description: 'Comprehensive wraparound services for youth with complex needs in Milwaukee.',
    coordinates: { lat: 43.0389, lng: -87.9065 }, // Milwaukee, WI
    country: 'United States',
    city: 'Milwaukee',
    state: 'Wisconsin',
    keyStats: [
      'Comprehensive services',
      'Multi-system coordination',
      'Community-based care'
    ],
    tags: ['wraparound', 'comprehensive', 'community-care'],
    detailUrl: '/centre-of-excellence/global-insights',
    featured: false
  },
  {
    id: 'jdai',
    name: 'Juvenile Detention Alternatives Initiative',
    category: 'international-model',
    type: 'global-insight',
    description: 'National initiative reducing unnecessary youth detention across United States.',
    coordinates: { lat: 39.2904, lng: -76.6122 }, // Baltimore (Annie E. Casey Foundation HQ)
    country: 'United States',
    city: 'Baltimore',
    state: 'Maryland',
    keyStats: [
      'Detention reduction focus',
      'Multi-site implementation',
      'Systems reform approach'
    ],
    tags: ['detention-reduction', 'systems-reform', 'national-initiative'],
    detailUrl: '/centre-of-excellence/global-insights',
    externalUrl: 'https://www.aecf.org/work/juvenile-justice/jdai',
    featured: false
  },
  {
    id: 'halt-netherlands',
    name: 'HALT Program',
    category: 'international-model',
    type: 'global-insight',
    description: 'Dutch early intervention program preventing escalation of youth offending.',
    coordinates: { lat: 52.3676, lng: 4.9041 }, // Amsterdam
    country: 'Netherlands',
    city: 'Amsterdam',
    keyStats: [
      'Early intervention focus',
      'Prevention of escalation',
      'Alternative to prosecution'
    ],
    tags: ['early-intervention', 'prevention', 'diversion'],
    detailUrl: '/centre-of-excellence/global-insights',
    featured: false
  },
  {
    id: 'fgc-nz-enhanced',
    name: 'Family Group Conferencing (Enhanced)',
    category: 'international-model',
    type: 'global-insight',
    description: 'Enhanced FGC model with improved cultural responsiveness and family empowerment.',
    coordinates: { lat: -36.8485, lng: 174.7633 }, // Auckland
    country: 'New Zealand',
    city: 'Auckland',
    keyStats: [
      '86% victim satisfaction',
      'Enhanced cultural practices',
      'Family-led planning'
    ],
    tags: ['restorative', 'family-led', 'cultural'],
    detailUrl: '/centre-of-excellence/global-insights',
    featured: false
  },
  {
    id: 'scotland-hearings',
    name: 'Scotland - Children\'s Hearings System',
    category: 'international-model',
    type: 'global-insight',
    description: 'Welfare-based system treating all youth issues through community panels. Age of criminal responsibility: 12.',
    coordinates: { lat: 55.9533, lng: -3.1883 }, // Edinburgh
    country: 'Scotland',
    city: 'Edinburgh',
    keyStats: [
      'Community panel approach',
      'Age 12 criminal responsibility',
      '50+ years evidence base'
    ],
    tags: ['welfare-model', 'community-led', 'non-punitive'],
    detailUrl: '/centre-of-excellence/global-insights',
    externalUrl: 'https://www.chscotland.gov.uk/',
    featured: true
  },
  {
    id: 'finland-nordic',
    name: 'Nordic Welfare Model',
    category: 'international-model',
    type: 'global-insight',
    description: 'Finland: Only 4 youth in custody. Education and therapeutic support over detention.',
    coordinates: { lat: 60.1695, lng: 24.9354 }, // Helsinki
    country: 'Finland',
    city: 'Helsinki',
    keyStats: [
      'Only 4 youth in custody',
      'Education-first approach',
      'Therapeutic over punitive'
    ],
    tags: ['welfare', 'education-focused', 'minimal-custody'],
    detailUrl: '/centre-of-excellence/global-insights',
    featured: true
  },
  {
    id: 'maranguka-australia',
    name: 'Maranguka Justice Reinvestment',
    category: 'international-model',
    type: 'global-insight',
    description: 'Bourke, NSW community-led justice reinvestment with remarkable outcomes.',
    coordinates: { lat: -30.0908, lng: 145.9375 }, // Bourke, NSW
    country: 'Australia',
    city: 'Bourke',
    state: 'NSW',
    keyStats: [
      'Community-led approach',
      'Justice reinvestment model',
      'Aboriginal leadership'
    ],
    tags: ['justice-reinvestment', 'community-led', 'Aboriginal'],
    detailUrl: '/centre-of-excellence/global-insights',
    featured: true
  }
];

/**
 * Australian Best Practice Frameworks
 */
export const australianFrameworks: ExcellenceLocation[] = [
  {
    id: 'nsw-youth-koori-court',
    name: 'NSW Youth Koori Court',
    category: 'australian-framework',
    type: 'best-practice',
    description: '40% reduction in custodial sentences for Aboriginal young people. Culturally informed justice.',
    coordinates: { lat: -33.8688, lng: 151.2093 }, // Sydney
    country: 'Australia',
    city: 'Sydney',
    state: 'NSW',
    keyStats: [
      '40% less custodial sentences',
      '84% less custody at re-conviction',
      'Average custody: 57→25 days'
    ],
    tags: ['Aboriginal-led', 'culturally-safe', 'evidence-based'],
    detailUrl: '/centre-of-excellence/best-practice#nsw-youth-koori-court',
    externalUrl: 'https://childrenscourt.nsw.gov.au/',
    featured: true
  },
  {
    id: 'vic-therapeutic-model',
    name: 'Victoria\'s Therapeutic Model',
    category: 'australian-framework',
    type: 'best-practice',
    description: 'Multi-Systemic Therapy and Functional Family Therapy trials. Evidence-based therapeutic interventions.',
    coordinates: { lat: -37.8136, lng: 144.9631 }, // Melbourne
    country: 'Australia',
    city: 'Melbourne',
    state: 'VIC',
    keyStats: [
      'MST/FFT clinical trials',
      'Risk-Need-Responsivity model',
      'Reduced reoffending rates'
    ],
    tags: ['therapeutic', 'clinical-trials', 'evidence-based'],
    detailUrl: '/centre-of-excellence/best-practice#victoria-therapeutic-model',
    externalUrl: 'https://www.justice.vic.gov.au/',
    featured: true
  },
  {
    id: 'qld-diversion-model',
    name: 'Queensland Diversion & Restorative Justice',
    category: 'australian-framework',
    type: 'best-practice',
    description: '$134M investment in restorative justice. Challenges with 75% reoffending within 2 weeks.',
    coordinates: { lat: -27.4698, lng: 153.0251 }, // Brisbane
    country: 'Australia',
    city: 'Brisbane',
    state: 'QLD',
    keyStats: [
      '$134M restorative justice investment',
      '75% reoffend within 2 weeks',
      'Limited program effectiveness data'
    ],
    tags: ['restorative-justice', 'diversion', 'high-reoffending'],
    detailUrl: '/centre-of-excellence/best-practice#queensland-diversion-model',
    externalUrl: 'https://www.qld.gov.au/youth',
    featured: true
  },
  {
    id: 'wa-aboriginal-programs',
    name: 'WA Aboriginal Youth Programs',
    category: 'australian-framework',
    type: 'best-practice',
    description: 'Addressing 71% Aboriginal overrepresentation in detention. Cultural programs and community partnerships.',
    coordinates: { lat: -31.9505, lng: 115.8605 }, // Perth
    country: 'Australia',
    city: 'Perth',
    state: 'WA',
    keyStats: [
      '71% of youth in detention are Aboriginal',
      '27x more likely under supervision',
      'Cultural diversion programs'
    ],
    tags: ['Aboriginal-focus', 'overrepresentation-crisis', 'cultural-programs'],
    detailUrl: '/centre-of-excellence/best-practice#wa-aboriginal-youth-programs',
    externalUrl: 'https://www.wa.gov.au/',
    featured: true
  }
];

/**
 * Major Research Source Locations
 */
export const researchSources: ExcellenceLocation[] = [
  {
    id: 'aifs-australia',
    name: 'Australian Institute of Family Studies (AIFS)',
    category: 'research-source',
    type: 'research',
    description: 'Leading Australian research on child protection, youth justice, and Indigenous programs.',
    coordinates: { lat: -37.8136, lng: 144.9631 }, // Melbourne
    country: 'Australia',
    city: 'Melbourne',
    state: 'VIC',
    keyStats: [
      'National research authority',
      'Indigenous youth justice focus',
      'Evidence repository'
    ],
    tags: ['government-research', 'evidence-base', 'national'],
    detailUrl: '/centre-of-excellence/research?jurisdiction=Australia',
    externalUrl: 'https://aifs.gov.au/',
    featured: true
  },
  {
    id: 'bocsar-nsw',
    name: 'NSW Bureau of Crime Statistics (BOCSAR)',
    category: 'research-source',
    type: 'research',
    description: 'Evidence on Youth Koori Court outcomes and NSW justice programs.',
    coordinates: { lat: -33.8688, lng: 151.2093 }, // Sydney
    country: 'Australia',
    city: 'Sydney',
    state: 'NSW',
    keyStats: [
      'Koori Court evaluation',
      'Sentencing outcome data',
      'NSW justice statistics'
    ],
    tags: ['state-research', 'evaluation', 'Aboriginal-justice'],
    detailUrl: '/centre-of-excellence/research?jurisdiction=Australia',
    externalUrl: 'https://www.bocsar.nsw.gov.au/',
    featured: true
  },
  {
    id: 'lowitja-institute',
    name: 'Lowitja Institute',
    category: 'research-source',
    type: 'research',
    description: 'Aboriginal and Torres Strait Islander health and justice research. Cultural responsiveness studies.',
    coordinates: { lat: -37.8136, lng: 144.9631 }, // Melbourne
    country: 'Australia',
    city: 'Melbourne',
    state: 'VIC',
    keyStats: [
      'Indigenous-led research',
      'Cultural responsiveness',
      'Diversion programs'
    ],
    tags: ['Indigenous-led', 'cultural-research', 'justice-health'],
    detailUrl: '/centre-of-excellence/research?category=indigenous-diversion',
    externalUrl: 'https://www.lowitja.org.au/',
    featured: true
  },
  {
    id: 'oranga-tamariki-research',
    name: 'Oranga Tamariki Research',
    category: 'research-source',
    type: 'research',
    description: 'NZ youth justice residences research and international best practice evidence reviews.',
    coordinates: { lat: -41.2865, lng: 174.7762 }, // Wellington
    country: 'New Zealand',
    city: 'Wellington',
    keyStats: [
      'International evidence reviews',
      'Youth justice residences models',
      'Restorative justice data'
    ],
    tags: ['international', 'evidence-reviews', 'restorative'],
    detailUrl: '/centre-of-excellence/research?jurisdiction=New+Zealand',
    externalUrl: 'https://www.orangatamariki.govt.nz/',
    featured: true
  },
  {
    id: 'annie-casey-foundation',
    name: 'Annie E. Casey Foundation',
    category: 'research-source',
    type: 'research',
    description: 'Missouri Model research and US juvenile justice reform evidence.',
    coordinates: { lat: 39.2904, lng: -76.6122 }, // Baltimore
    country: 'United States',
    city: 'Baltimore',
    state: 'Maryland',
    keyStats: [
      'Missouri Model evidence',
      'US juvenile justice reform',
      'Therapeutic alternatives'
    ],
    tags: ['US-research', 'therapeutic-models', 'reform-evidence'],
    detailUrl: '/centre-of-excellence/research?jurisdiction=International',
    externalUrl: 'https://www.aecf.org/',
    featured: true
  }
];

/**
 * All Centre of Excellence locations combined
 */
export const allExcellenceLocations: ExcellenceLocation[] = [
  ...internationalModels,
  ...australianFrameworks,
  ...researchSources
];

/**
 * Color scheme for map markers by category
 */
export const excellenceCategoryColors: Record<ExcellenceCategory, string> = {
  'international-model': '#2563eb', // Blue
  'australian-framework': '#dc2626', // Red
  'research-source': '#059669', // Green
  'training-hub': '#7c3aed' // Purple
};
