import type { SystemConfig } from '../types';

export const ntConfig: SystemConfig = {
  state: 'NT',
  stateFull: 'Northern Territory',
  slug: 'nt',

  departments: [
    { name: 'Territory Families, Housing and Communities', shortName: 'TFHC', contracts: 61, totalValue: 12702031, period: 'Current', category: 'youth_justice' },
    { name: 'Youth Justice (within TFHC)', shortName: 'YJ NT', contracts: 0, totalValue: 102441000, period: 'ROGS 2024-25', category: 'youth_justice' },
  ],

  // ESTIMATES: No state procurement data available for NT. Values based on annual reports + public announcements.
  // To verify: scrape NT Budget papers, GrantConnect, NAAJA/CAALAS annual reports.
  topSuppliers: [
    { name: 'North Australian Aboriginal Justice Agency (NAAJA)', totalValue: 12000000, contracts: 6, departments: ['TFHC'], note: 'Indigenous-controlled legal aid — Top End & Central (estimate)' },
    { name: 'Kalano Community Association', totalValue: 8000000, contracts: 5, departments: ['TFHC'], note: 'Indigenous community org — Katherine region' },
    { name: 'CatholicCare NT', totalValue: 6000000, contracts: 7, departments: ['TFHC'], note: 'Family hubs, early intervention, parenting programs' },
    { name: 'Kurdiji Aboriginal Corporation', totalValue: 3000000, contracts: 2, departments: ['TFHC'], note: 'Lajamanu Justice Reinvestment — Indigenous-led' },
    { name: 'Central Australian Aboriginal Legal Aid Service (CAALAS)', totalValue: 5000000, contracts: 4, departments: ['TFHC'], note: 'Indigenous-controlled legal aid — Central Australia' },
    { name: 'Danila Dilba Health Service', totalValue: 4000000, contracts: 3, departments: ['TFHC'], note: 'Indigenous ACCHO — Darwin/Palmerston' },
    { name: 'Mission Australia', totalValue: 3500000, contracts: 3, departments: ['TFHC'] },
    { name: 'Don Dale Youth Detention (Operations)', totalValue: 58657000, contracts: 1, departments: ['YJ NT'], note: 'Detention operations (ROGS) — subject of 2017 Royal Commission' },
  ],

  spotlight: {
    title: 'Remote Communities Spotlight',
    totalFunding: 18000000,
    records: 45,
    orgs: 12,
    locations: [
      { name: 'Katherine (Kalano)', funding: 8000000, programs: 5 },
      { name: 'Lajamanu (Kurdiji)', funding: 3000000, programs: 2 },
      { name: 'Alice Springs', funding: 4000000, programs: 4 },
      { name: 'Tennant Creek', funding: 3000000, programs: 3 },
    ],
  },

  fundingBySource: [
    { source: 'ROGS YJ Expenditure', count: 63, total: 3026779000 },
    { source: 'ROGS 2026', count: 40, total: 1944912000 },
    { source: 'NT Budget 2024', count: 3, total: 68200000 },
    { source: 'AIHW YJ', count: 3, total: 65703834 },
    { source: 'AusTender', count: 61, total: 12702031 },
  ],

  costComparison: {
    detentionCostPerDay: 3452,
    communityCostPerDay: 280,
    avgKidsInDetention: 47,
  },

  voices: [
    {
      quote: "In Lajamanu, the old people — the kurdiji, the law bosses — they keep the young people strong through ceremony. When government listens to our Law, kids don't go to Darwin and get locked up. They stay on country.",
      name: 'Kurdiji Elders',
      location: 'Lajamanu',
      role: 'Kurdiji Aboriginal Corporation',
    },
    {
      quote: "The Royal Commission showed the world what was happening to our kids in Don Dale. But nothing changes unless the money follows the community. NAAJA sees the same kids cycling through — arrest, remand, release, repeat. Community-led programs break that cycle.",
      name: 'Priscilla Atkinson',
      location: 'Darwin',
      role: 'CEO, North Australian Aboriginal Justice Agency (NAAJA)',
    },
  ],

  alternativeModel: {
    title: 'Lajamanu Justice Reinvestment — Kurdiji Model',
    description: 'Community-controlled justice reinvestment in Lajamanu, led by Kurdiji Aboriginal Corporation and Warlpiri Elders. Grounded in Aboriginal Law and ceremony. The 2017 Royal Commission into Don Dale exposed systemic abuse — yet the NT still spends $59M/year on detention for just 47 kids. The same money could fund every remote community alternative in the Territory.',
    pillars: [
      { tag: 'Aboriginal Law', description: 'Kurdiji (Law bosses) lead justice processes through ceremony and cultural authority' },
      { tag: 'Night Patrols', description: 'Community night patrols (Kalano model) keeping young people safe' },
      { tag: 'On Country', description: 'Bush programs and on-country healing for young people' },
      { tag: 'Family', description: 'Family strengthening — CatholicCare parenting, family hubs' },
      { tag: 'Legal', description: 'NAAJA + CAALAS — culturally safe legal representation' },
      { tag: 'Health', description: 'Danila Dilba trauma-informed health services' },
    ],
    alternatives: [
      { name: 'Community justice reinvestment sites', cost: 3000000, count: 8, unit: 'remote community sites' },
      { name: 'Night patrol expansion', cost: 500000, count: 15, unit: 'communities across NT' },
      { name: 'On-country healing programs', cost: 800000, count: 12, unit: 'programs' },
      { name: 'Youth workers in remote communities', cost: 80000, count: 60, unit: 'workers for 5 years' },
      { name: 'Family strengthening hubs', cost: 2000000, count: 6, unit: 'regional hubs' },
      { name: 'Cultural authority programs (Kurdiji model)', cost: 1500000, count: 10, unit: 'communities' },
    ],
  },

  scalePathway: [
    { name: 'Lajamanu', highlight: true },
    { name: 'Katherine' },
    { name: 'Tennant Creek' },
    { name: 'Alice Springs' },
    { name: 'Nhulunbuy' },
    { name: 'Darwin' },
  ],

  crossoverHeadlineStat: '97%',
  crossoverHeadlineLabel: 'of NT youth detainees are Aboriginal — the highest rate in Australia (AIHW 2024)',
};
