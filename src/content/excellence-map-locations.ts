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
 */
export const internationalModels: ExcellenceLocation[] = [
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
    detailUrl: '/centre-of-excellence/global-insights#spain-diagrama-foundation',
    externalUrl: 'https://www.diagramaaustralia.org/',
    featured: true
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
    detailUrl: '/centre-of-excellence/global-insights#scotland-childrens-hearings',
    externalUrl: 'https://www.chscotland.gov.uk/',
    featured: true
  },
  {
    id: 'finland-nordic',
    name: 'Nordic Countries - Welfare Model',
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
    detailUrl: '/centre-of-excellence/global-insights#nordic-welfare-model',
    featured: true
  },
  {
    id: 'canada-ycja',
    name: 'Canada - Youth Criminal Justice Act',
    category: 'international-model',
    type: 'global-insight',
    description: 'YCJA framework with 20+ years evidence. Restorative conferencing and community-based alternatives.',
    coordinates: { lat: 45.4215, lng: -75.6972 }, // Ottawa
    country: 'Canada',
    city: 'Ottawa',
    keyStats: [
      '20+ years evidence base',
      'Restorative conferencing',
      'Community alternatives focus'
    ],
    tags: ['restorative', 'community-based', 'long-term-evidence'],
    detailUrl: '/centre-of-excellence/global-insights#canada-ycja',
    externalUrl: 'https://www.justice.gc.ca/eng/cj-jp/yj-jj/',
    featured: true
  },
  {
    id: 'missouri-model',
    name: 'USA - Missouri Model',
    category: 'international-model',
    type: 'global-insight',
    description: 'Small therapeutic units with 24% recidivism vs 43-52% other US states. Zero youth suicides.',
    coordinates: { lat: 38.5767, lng: -92.1735 }, // Jefferson City, MO
    country: 'United States',
    city: 'Jefferson City',
    state: 'Missouri',
    keyStats: [
      '24% recidivism vs 43-52% other states',
      'Zero youth suicides',
      '85.3% community engagement'
    ],
    tags: ['therapeutic', 'low-recidivism', 'small-units'],
    detailUrl: '/centre-of-excellence/global-insights#missouri-model',
    externalUrl: 'https://www.aecf.org/',
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
