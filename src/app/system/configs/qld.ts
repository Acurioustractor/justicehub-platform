import type { SystemConfig } from '../types';

export const qldConfig: SystemConfig = {
  state: 'QLD',
  stateFull: 'Queensland',
  slug: 'qld',

  departments: [
    { name: 'Department of Education', shortName: 'DoE', contracts: 94628, totalValue: 28171078462, period: 'Current', category: 'education' },
    { name: 'Dept of Children, Youth Justice & Multicultural Affairs', shortName: 'DCYJMA', contracts: 45665, totalValue: 3290766034, period: 'Dec 2020 - May 2023', category: 'youth_justice' },
    { name: 'Dept of Child Safety, Seniors & Disability Services', shortName: 'DCSSDS', contracts: 37494, totalValue: 2480539363, period: 'Current', category: 'child_safety' },
    { name: 'Queensland Corrective Services', shortName: 'QCS', contracts: 3503, totalValue: 2074016588, period: 'Current', category: 'corrections' },
    { name: 'Dept of Employment, Small Business & Training', shortName: 'DESBT', contracts: 1628, totalValue: 269392919, period: 'Current', category: 'education' },
    { name: 'Dept of Child Safety, Youth & Women', shortName: 'DCSYW', contracts: 15466, totalValue: 1274306632, period: 'Pre-Dec 2020', category: 'child_safety' },
    { name: 'Dept of Youth Justice & Victim Services', shortName: 'DYJVS', contracts: 599, totalValue: 201599638, period: 'May 2025+', category: 'youth_justice' },
    { name: 'Dept of Youth Justice', shortName: 'DYJ', contracts: 688, totalValue: 51202438, period: 'Apr 2024 - Apr 2025', category: 'youth_justice' },
  ],

  // VERIFIED: YJ-filtered funding from QGIP + QLD Historical + DYJVS contracts (2026-03-22)
  topSuppliers: [
    { name: 'Life Without Barriers', totalValue: 239306553, contracts: 227, departments: ['DCYJMA', 'DCSYW', 'DCSSDS'] },
    { name: 'Fraser Coast Youth Support Service', totalValue: 236515273, contracts: 355, departments: ['DCYJMA', 'DCSYW'] },
    { name: 'Anglicare Southern Queensland', totalValue: 191966098, contracts: 205, departments: ['DCYJMA', 'DCSYW', 'DYJVS'] },
    { name: 'UnitingCare Community', totalValue: 170094919, contracts: 196, departments: ['DCYJMA', 'DCSYW'] },
    { name: 'Mercy Community', totalValue: 170053412, contracts: 234, departments: ['DCYJMA', 'DCSYW', 'DCSSDS'] },
    { name: 'IFYS Limited', totalValue: 147240317, contracts: 140, departments: ['DCYJMA', 'DCSSDS'] },
    { name: 'Act for Kids', totalValue: 55591250, contracts: 97, departments: ['DCYJMA', 'DCSSDS'] },
    { name: 'Banana Shire Youth Service', totalValue: 55270955, contracts: 110, departments: ['DCYJMA'] },
    { name: 'Kummara Limited', totalValue: 48037402, contracts: 88, departments: ['DCSSDS'], note: 'Indigenous-controlled' },
    { name: 'Safe Places Community Services', totalValue: 33051313, contracts: 42, departments: ['DCYJMA', 'DCSYW'] },
    { name: 'TAIHS Youth Support Services', totalValue: 14410204, contracts: 28, departments: ['DCYJMA'], note: 'Indigenous-controlled — Townsville' },
    { name: 'Central QLD Indigenous Development', totalValue: 13304462, contracts: 26, departments: ['DCYJMA'], note: 'Indigenous-controlled' },
    { name: 'Palm Island Community Company', totalValue: 12339633, contracts: 10, departments: ['DCYJMA'], note: 'Indigenous-controlled — Palm Island' },
  ],

  spotlight: {
    title: 'North Queensland Spotlight',
    totalFunding: 350204557,
    records: 1900,
    orgs: 691,
    locations: [
      { name: 'Townsville', funding: 182500000, programs: 47 },
      { name: 'Mount Isa', funding: 89400000, programs: 23 },
      { name: 'Cairns', funding: 61304557, programs: 31 },
      { name: 'Palm Island', funding: 17000000, programs: 8 },
    ],
  },

  fundingBySource: [
    { source: 'QLD Historical Grants', count: 12141, total: 16131548884 },
    { source: 'ROGS YJ Expenditure', count: 63, total: 10811723000 },
    { source: 'QGIP', count: 51209, total: 8731682550 },
    { source: 'ROGS 2026', count: 40, total: 6952482000 },
    { source: 'QLD Budget (SDS)', count: 18, total: 1264133333 },
    { source: 'AusTender', count: 654, total: 449041904 },
    { source: 'NIAA Senate Order', count: 416, total: 405217914 },
    { source: 'AIHW YJ', count: 3, total: 243102690 },
    { source: 'DYJVS Contracts', count: 555, total: 181246833 },
    { source: 'Brisbane Council', count: 507, total: 3408711 },
  ],

  costComparison: {
    detentionCostPerDay: 3320,
    communityCostPerDay: 200,
    avgKidsInDetention: 40,
  },

  voices: [
    {
      quote: "I got into working in the child protection space... working with young kids. It made me feel real deadly, because I was one of them kids.",
      name: 'Brodie Germaine',
      location: 'Mount Isa',
      role: 'Founder, BG Fit',
    },
    {
      quote: "The only way you're going to find out who these kids are is engage with them when they're young and in school. About four or five hundred kids a week. Police have got to go into school, trying to keep those kids in school, not on the street.",
      name: 'Uncle George Leon',
      location: 'Mount Isa',
      role: 'Kalkadoon Elder',
    },
    {
      quote: "I work with disengaged kids or kids who not going to school. We got kids in and outta Cleveland and we help them with community service and other programs.",
      name: 'Henry Doyle',
      location: 'Palm Island',
      role: 'Youth Services Worker',
    },
  ],

  alternativeModel: {
    title: 'The Townsville Model',
    description: 'A community-controlled hub on the centre block. Built by the community, for the community. Not another government program — a genuine transfer of power and resources.',
    pillars: [
      { tag: 'Housing', description: 'Safe housing for young people exiting the system' },
      { tag: 'Employment', description: 'Employment pathways (BG Fit model, real jobs)' },
      { tag: 'Elders', description: 'Elder connection (Uncle George, Kalkadoon knowledge)' },
      { tag: 'Education', description: 'Flexible education and training support' },
      { tag: 'Culture', description: 'Cultural healing and identity programs' },
      { tag: 'Health', description: 'Trauma-informed health and wellbeing' },
    ],
    alternatives: [
      { name: 'Community-controlled youth hubs', cost: 8000000, count: 6, unit: 'hubs across NQ' },
      { name: 'Full-time youth workers', cost: 80000, count: 120, unit: 'workers for 5 years' },
      { name: 'Housing packages for young people', cost: 150000, count: 80, unit: 'supported homes' },
      { name: 'Cultural healing programs', cost: 500000, count: 20, unit: 'programs state-wide' },
      { name: 'Employment pathways (BG Fit model)', cost: 200000, count: 48, unit: 'programs' },
      { name: 'Elder-led mentoring programs', cost: 300000, count: 32, unit: 'programs' },
    ],
  },

  scalePathway: [
    { name: 'Mount Isa' },
    { name: 'Townsville' },
    { name: 'Cairns' },
    { name: 'Palm Island', highlight: true },
  ],

  crossoverHeadlineStat: '72.9%',
  crossoverHeadlineLabel: 'of QLD youth justice kids had child protection contact in the prior 10 years',
};
