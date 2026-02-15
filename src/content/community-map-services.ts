export type CommunityMapCategory =
  | 'justice'
  | 'healing'
  | 'skills'
  | 'housing'
  | 'mental_health'
  | 'education'
  | 'family'
  | 'emergency';

export interface CommunityMapService {
  id: string;
  name: string;
  category: CommunityMapCategory;
  description: string;
  focusAreas: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  city: string;
  state: string;
  regions: string[];
  highlight: string;
  impactStats: string[];
  website?: string;
  phone?: string;
  email?: string;
  serviceModel: 'community' | 'nonprofit' | 'government';
  tags: string[];
}

export const communityMapServices: CommunityMapService[] = [
  {
    id: 'backtrack-youth-works',
    name: 'BackTrack Youth Works',
    category: 'skills',
    description:
      'Regional youth justice diversion program in Armidale combining animal therapy, accredited training, and intensive wraparound support.',
    focusAreas: ['justice diversion', 'vocational learning', 'animal therapy'],
    coordinates: { lat: -30.5149, lng: 151.6699 },
    city: 'Armidale',
    state: 'NSW',
    regions: ['NSW'],
    highlight: '87% of BackTrack participants transition into employment, education, or stable housing.',
    impactStats: [
      'Dog program builds daily discipline and emotional regulation',
      'Court-supported diversion pathway for rural youth',
      'Community-run workshops and onsite accredited training'
    ],
    website: 'https://backtrack.org.au/',
    serviceModel: 'community',
    tags: ['regional', 'First Nations partnerships', 'wraparound support']
  },
  {
    id: 'youth-off-the-streets-koa',
    name: 'Youth Off The Streets – Key College',
    category: 'housing',
    description:
      'Accredited high school and wraparound housing support for young people who are homeless or disengaged from mainstream education.',
    focusAreas: ['flexible education', 'crisis accommodation', 'case management'],
    coordinates: { lat: -33.9071, lng: 151.1543 },
    city: 'Marrickville',
    state: 'NSW',
    regions: ['NSW'],
    highlight: 'Students graduate with HSC pathways alongside stable housing placements.',
    impactStats: [
      'Integrated trauma-informed teaching model',
      'Onsite counsellors and youth work case conferencing',
      'Emergency accommodation linked to education attendance'
    ],
    website: 'https://youthoffthestreets.com.au/',
    serviceModel: 'nonprofit',
    tags: ['education', 'housing-first', 'Sydney Metro']
  },
  {
    id: 'street-university-liverpool',
    name: 'The Street University – Liverpool',
    category: 'mental_health',
    description:
      'Alcohol and other drug prevention hub with creative arts studios, full-time counsellors, and culturally safe youth justice pathways.',
    focusAreas: ['alcohol and other drugs', 'creative therapies', 'peer leadership'],
    coordinates: { lat: -33.9206, lng: 150.9244 },
    city: 'Liverpool',
    state: 'NSW',
    regions: ['NSW'],
    highlight: 'Participants report improved wellbeing scores within the first 12 weeks of engagement.',
    impactStats: [
      'Free drop-in health and wellbeing services 6 days a week',
      'Co-designed programs with young people with lived experience',
      'Links to pharmacotherapy, clinical detox, and family counselling'
    ],
    website: 'https://www.thestreets.com.au/',
    serviceModel: 'community',
    tags: ['AOD support', 'creative healing', 'First Nations safe space']
  },
  {
    id: 'deadly-connections',
    name: 'Deadly Connections Community & Justice Services',
    category: 'justice',
    description:
      'First Nations-led organisation delivering culturally grounded justice diversion, court support, and family casework across Gadigal Country.',
    focusAreas: ['justice diversion', 'family support', 'cultural healing'],
    coordinates: { lat: -33.8807, lng: 151.2049 },
    city: 'Sydney',
    state: 'NSW',
    regions: ['NSW'],
    highlight: 'Community-led diversion reduces recidivism by centring kinship, cultural authority, and healing.',
    impactStats: [
      'Court support and legal advocacy for young people and families',
      'Intensive mentoring delivered by people with lived experience',
      'Firestick Academy and cultural education as justice alternatives'
    ],
    website: 'https://www.deadlyconnections.org.au/',
    serviceModel: 'community',
    tags: ['First Nations-led', 'justice reinvestment', 'urban']
  },
  {
    id: 'kurbingui-youth-and-family-development',
    name: 'Kurbingui Youth & Family Development',
    category: 'family',
    description:
      'Brisbane northside community hub providing family casework, justice advocacy, and cultural mentoring for Aboriginal and Torres Strait Islander young people.',
    focusAreas: ['family strengthening', 'justice advocacy', 'cultural mentoring'],
    coordinates: { lat: -27.3495, lng: 153.0303 },
    city: 'Zillmere (Meaanjin)',
    state: 'QLD',
    regions: ['QLD'],
    highlight: 'Integrated family healing keeps young people safe at home and out of detention.',
    impactStats: [
      'Murri Court support team with Elders and cultural advisors',
      'Family wellbeing teams addressing housing, income and safety',
      'Strong Not Silent youth mental health and suicide prevention'
    ],
    website: 'https://www.kurbingui.org.au/',
    serviceModel: 'community',
    tags: ['First Nations-led', 'family wellbeing', 'South East Queensland']
  },
  {
    id: 'naa-justice-darwin',
    name: 'North Australian Aboriginal Justice Agency – Youth Justice',
    category: 'justice',
    description:
      'Legal representation, bail support, and aftercare services for Aboriginal young people across the Top End.',
    focusAreas: ['legal representation', 'bail support', 'aftercare'],
    coordinates: { lat: -12.4634, lng: 130.8456 },
    city: 'Darwin (Garramilla)',
    state: 'NT',
    regions: ['NT'],
    highlight: 'Mobile legal teams respond within 24 hours of youth arrests across the Top End.',
    impactStats: [
      'Youth specialist lawyers present in Darwin, Katherine, and Nhulunbuy courts',
      'Bail support team keeps young people connected to country and kin',
      'Community legal education delivered in language'
    ],
    website: 'https://www.naaja.org.au/',
    serviceModel: 'community',
    tags: ['legal', 'north australia', 'bail support']
  },
  {
    id: 'wungening-aboriginal-corporation',
    name: 'Wungening Aboriginal Corporation – Youth Healing',
    category: 'healing',
    description:
      'Perth-based healing centre with alcohol and other drug residential services, justice aftercare, and family reunification support.',
    focusAreas: ['residential healing', 'justice aftercare', 'family reunification'],
    coordinates: { lat: -31.9535, lng: 115.857 },
    city: 'Perth (Boorloo)',
    state: 'WA',
    regions: ['WA'],
    highlight: 'Whole-of-family healing journeys support safe return from Banksia Hill detention.',
    impactStats: [
      'Ngalla Maya short-stay healing for youth exiting detention',
      'Family advocates coordinate Department of Communities responses',
      'Cultural facilitators deliver on-country experiences'
    ],
    website: 'https://www.wungening.com.au/',
    serviceModel: 'community',
    tags: ['First Nations-led', 'housing support', 'AOD recovery']
  },
  {
    id: 'jesuit-social-services-youth-justice',
    name: 'Jesuit Social Services – Youth Justice Community Support Service',
    category: 'justice',
    description:
      'Victoria-wide case management, education pathways, and practical support for young people on youth justice orders.',
    focusAreas: ['case management', 'education pathways', 'court support'],
    coordinates: { lat: -37.8069, lng: 144.9615 },
    city: 'Melbourne (Naarm)',
    state: 'VIC',
    regions: ['VIC'],
    highlight: 'Individualised transition plans connect young people to housing, training, and therapeutic support.',
    impactStats: [
      'Works alongside Youth Justice Centres and courts across Victoria',
      'Pathways to employment through Ignite Café and social enterprises',
      'Health navigators coordinate mental health and AOD treatment'
    ],
    website: 'https://jss.org.au/',
    serviceModel: 'nonprofit',
    tags: ['justice orders', 'education & work', 'statewide']
  },
  {
    id: 'syc-hypa-housing',
    name: 'SYC HYPA Housing',
    category: 'housing',
    description:
      'South Australian Foyer-style accommodation and coaching that combines safe housing with education, employment, and life skills.',
    focusAreas: ['housing-first', 'tenancy coaching', 'education & work'],
    coordinates: { lat: -34.9211, lng: 138.6048 },
    city: 'Adelaide (Tarntanya)',
    state: 'SA',
    regions: ['SA'],
    highlight: 'Tenancy coaches help young people maintain leases while progressing education or work goals.',
    impactStats: [
      'Support to achieve Certificates I–III and apprenticeships',
      'Onsite resilience workshops and trauma-informed counselling',
      '94% tenancy sustainment across HYPA Housing sites'
    ],
    website: 'https://www.syc.net.au/housing/',
    serviceModel: 'nonprofit',
    tags: ['housing', 'education', 'independent living']
  },
  {
    id: 'colony-47-therapeutic-youth',
    name: 'Colony 47 – Therapeutic Youth Programs',
    category: 'housing',
    description:
      'Tasmanian youth housing and therapeutic support service providing crisis accommodation, outreach casework, and social enterprises.',
    focusAreas: ['crisis accommodation', 'therapeutic casework', 'social enterprise'],
    coordinates: { lat: -42.8821, lng: 147.3272 },
    city: 'Hobart (nipaluna)',
    state: 'TAS',
    regions: ['TAS'],
    highlight: 'Therapeutic casework team stabilises young people within 30 days of referral.',
    impactStats: [
      '24/7 supported accommodation linked to mental health clinicians',
      'Education liaison connects young people to TAFE and alternative schools',
      'Good Food Hub social enterprise builds employment pathways'
    ],
    website: 'https://www.colony47.com.au/',
    serviceModel: 'nonprofit',
    tags: ['housing-first', 'clinical partnership', 'Tasmania']
  },
  {
    id: 'als-court-support-canberra',
    name: 'Aboriginal Legal Service NSW/ACT – Court Support',
    category: 'justice',
    description:
      'Canberra-based ALS court support team providing legal advocacy, bail support, and family casework for Aboriginal and Torres Strait Islander people.',
    focusAreas: ['court support', 'bail advocacy', 'family casework'],
    coordinates: { lat: -35.2819, lng: 149.1287 },
    city: 'Canberra (Ngunnawal Country)',
    state: 'ACT',
    regions: ['ACT'],
    highlight: 'Culturally safe legal teams keep families informed and connected through each court listing.',
    impactStats: [
      'Holistic case management linking legal and social supports',
      'Early referral pathways to housing, health and education services',
      'Community legal education in schools and youth centres'
    ],
    website: 'https://www.alsnswact.org.au/',
    serviceModel: 'community',
    tags: ['legal', 'First Nations-led', 'bail support']
  },
  {
    id: 'groote-eylandt-youth-development',
    name: 'Groote Eylandt Aboriginal Trust – Youth Development Program',
    category: 'healing',
    description:
      'On-country youth development camps and mentoring linking Elders, cultural education, and justice diversion for young people in the Groote Archipelago.',
    focusAreas: ['on-country camps', 'cultural mentoring', 'justice diversion'],
    coordinates: { lat: -13.9744, lng: 136.4608 },
    city: 'Groote Eylandt',
    state: 'NT',
    regions: ['NT', 'Remote'],
    highlight: 'Country-led camps provide a circuit breaker from detention pipelines.',
    impactStats: [
      'Mentors guide youth through kinship responsibilities and cultural law',
      'Camps integrate school re-engagement and language revival',
      'Partnership with NT Youth Justice for supervised bail accommodation'
    ],
    website: 'https://anindilyakwa.com.au/',
    serviceModel: 'community',
    tags: ['remote', 'First Nations-led', 'justice diversion']
  },
  {
    id: 'npy-womens-youth-program',
    name: 'NPY Women’s Council – Youth Service',
    category: 'healing',
    description:
      'Remote tri-state youth service supporting young Anangu people through youth hubs, child protection advocacy, and cultural bush trips.',
    focusAreas: ['youth hubs', 'child protection advocacy', 'cultural trips'],
    coordinates: { lat: -23.698, lng: 133.8817 },
    city: 'Alice Springs (Mparntwe)',
    state: 'NT/SA/WA',
    regions: ['NT', 'SA', 'WA', 'Remote'],
    highlight: 'Culturally anchored programs operating across 350,000 square kilometres of desert communities.',
    impactStats: [
      'Works across 26 remote communities in the Ngaanyatjarra, Pitjantjatjara, Yankunytjatjara lands',
      'Advocates across three state and territory child protection systems',
      'Bush camps rebuild connection to kin, country, and language'
    ],
    website: 'https://www.npywc.org.au/',
    serviceModel: 'community',
    tags: ['remote', 'women-led', 'tri-state']
  },
  {
    id: 'mdas-youth-justice',
    name: 'Mallee District Aboriginal Services – Youth Justice Support',
    category: 'justice',
    description:
      'Mildura-based justice support service providing bail accommodation, cultural mentoring, and legal advocacy in north-west Victoria.',
    focusAreas: ['bail accommodation', 'cultural mentoring', 'legal advocacy'],
    coordinates: { lat: -34.1876, lng: 142.1587 },
    city: 'Mildura',
    state: 'VIC',
    regions: ['VIC', 'NSW', 'Regional'],
    highlight: 'Community-controlled bail house keeps young people connected to culture and country.',
    impactStats: [
      'Bail house with onsite cultural mentors and case managers',
      'Strong Deadly Kids program supporting primary school-aged siblings',
      'Partnership with Victoria Legal Aid and magistrates court'
    ],
    website: 'https://www.mdas.org.au/',
    serviceModel: 'community',
    tags: ['regional', 'bail support', 'victoria']
  }
];
