import type { SystemConfig } from '../types';

export const vicConfig: SystemConfig = {
  state: 'VIC',
  stateFull: 'Victoria',
  slug: 'vic',

  departments: [
    { name: 'Department of Justice and Community Safety', shortName: 'DJCS', contracts: 996, totalValue: 475129600, period: 'Current', category: 'youth_justice' },
    { name: 'Youth Justice (within DJCS)', shortName: 'YJ VIC', contracts: 0, totalValue: 438001000, period: 'ROGS 2024-25', category: 'youth_justice' },
  ],

  // ESTIMATES: No state procurement data available for VIC. Dollar values from annual reports + public announcements.
  // Evidence levels verified via ALMA interventions DB. Cost data verified via ROGS 2024-25.
  topSuppliers: [
    { name: 'Victorian Aboriginal Legal Service (VALS)', totalValue: 18000000, contracts: 8, departments: ['DJCS'], note: 'Indigenous-controlled legal aid — Koori Youth Justice · Promising evidence (ALMA) · estimate' },
    { name: 'Jesuit Social Services', totalValue: 32000000, contracts: 14, departments: ['DJCS'], note: 'Youth justice programs · Effective evidence (ALMA) · estimate' },
    { name: 'Berry Street', totalValue: 45000000, contracts: 18, departments: ['DJCS'], note: 'Child/family welfare, out-of-home care · 1 intervention (ALMA) · estimate' },
    { name: 'Brotherhood of St Laurence', totalValue: 28000000, contracts: 10, departments: ['DJCS'], note: 'Education & employment pathways · Effective evidence (ALMA) · estimate' },
    { name: 'Save the Children (54 Reasons)', totalValue: 15000000, contracts: 8, departments: ['DJCS'], note: 'Bail support programs · 3 interventions (ALMA) · estimate' },
    { name: 'Odyssey House Victoria', totalValue: 12000000, contracts: 5, departments: ['DJCS'], note: 'Youth AOD therapeutic services · Promising evidence (ALMA) · estimate' },
    { name: 'Rumbalara Aboriginal Co-operative', totalValue: 8000000, contracts: 4, departments: ['DJCS'], note: 'Indigenous community-led — Shepparton · 1 intervention (ALMA) · estimate' },
    { name: 'Mallee District Aboriginal Services', totalValue: 6000000, contracts: 3, departments: ['DJCS'], note: 'Indigenous community-led — Mildura · 1 intervention (ALMA) · estimate' },
    { name: 'Detention Operations (Cherry Creek)', totalValue: 343112000, contracts: 1, departments: ['YJ VIC'], note: 'Detention-based supervision — ROGS 2024-25 verified' },
  ],

  spotlight: {
    title: 'Regional Victoria Spotlight',
    totalFunding: 42000000,
    records: 180,
    orgs: 35,
    locations: [
      { name: 'Shepparton (Rumbalara)', funding: 14000000, programs: 6 },
      { name: 'Mildura (MDAS)', funding: 10000000, programs: 5 },
      { name: 'Gippsland (GEGAC)', funding: 9000000, programs: 4 },
      { name: 'Geelong (Wathaurong)', funding: 9000000, programs: 5 },
    ],
  },

  fundingBySource: [
    { source: 'ROGS YJ Expenditure', count: 63, total: 9589041000 },
    { source: 'ROGS 2026', count: 40, total: 5960542000 },
    { source: 'AusTender', count: 996, total: 475129600 },
    { source: 'VIC Budget 2024', count: 3, total: 271800000 },
    { source: 'AIHW YJ', count: 3, total: 168304347 },
  ],

  costComparison: {
    detentionCostPerDay: 7304, // ROGS 2024-25 Table 17A.20 (verified)
    communityCostPerDay: 601,  // ROGS 2024-25 Table 17A.21 (verified)
    avgKidsInDetention: 129,   // ROGS 2024-25 Table 17A.20 avg daily population (verified)
  },

  voices: [
    {
      quote: "Our kids are being locked up at the highest cost in the country — $7,300 a day — and it's not making anyone safer. Koori Courts and community-led diversion actually work, and they cost a fraction of that.",
      name: 'Nerita Waight',
      location: 'Melbourne',
      role: 'CEO, Victorian Aboriginal Legal Service (VALS)',
    },
    {
      quote: "We know that 80% of young people in Victoria's youth justice system have experienced abuse, neglect or trauma. Locking them up doesn't address any of that. What works is wraparound support in the community.",
      name: 'Julie Edwards',
      location: 'Melbourne',
      role: 'CEO, Jesuit Social Services',
    },
  ],

  alternativeModel: {
    title: 'The Koori Justice Model',
    description: 'Community-controlled Aboriginal justice led by VALS and regional ACCOs. Children\'s Koori Court (est. 2005) reduces reoffending through cultural authority, Elder involvement, and family-centred approaches. Victoria spent $1.8B building Cherry Creek detention — the same money could fund community alternatives for a generation.',
    pillars: [
      { tag: 'Koori Courts', description: 'Children\'s Koori Court — Elder-led, culturally grounded sentencing' },
      { tag: 'ACCO-led', description: 'Aboriginal Community Controlled Organisations running local programs' },
      { tag: 'Bail Support', description: '54 Reasons bail support — keeping kids out of remand' },
      { tag: 'Healing', description: 'Trauma-informed therapeutic programs (Odyssey House, Jesuit)' },
      { tag: 'Employment', description: 'Brotherhood of St Laurence education-to-employment pathways' },
      { tag: 'Culture', description: 'Cultural connection through Rumbalara, GEGAC, Wathaurong programs' },
    ],
    alternatives: [
      { name: 'ACCO-led youth justice hubs', cost: 6000000, count: 8, unit: 'hubs across VIC' },
      { name: 'Full-time youth workers', cost: 80000, count: 200, unit: 'workers for 5 years' },
      { name: 'Koori Court expansion', cost: 2000000, count: 12, unit: 'courts state-wide' },
      { name: 'Bail support programs (54 Reasons)', cost: 1500000, count: 15, unit: 'programs' },
      { name: 'Cultural healing programs', cost: 500000, count: 30, unit: 'programs state-wide' },
      { name: 'Therapeutic diversion (Jesuit model)', cost: 3000000, count: 10, unit: 'regional sites' },
    ],
  },

  scalePathway: [
    { name: 'Shepparton', highlight: true },
    { name: 'Mildura' },
    { name: 'Gippsland' },
    { name: 'Geelong' },
    { name: 'Dandenong' },
    { name: 'Northern Melbourne' },
  ],

  crossoverHeadlineStat: '80%',
  crossoverHeadlineLabel: 'of VIC youth justice kids have experienced abuse, neglect or trauma (Sentencing Advisory Council)',
};
