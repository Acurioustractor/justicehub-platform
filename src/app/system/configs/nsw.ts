import type { SystemConfig } from '../types';

export const nswConfig: SystemConfig = {
  state: 'NSW',
  stateFull: 'New South Wales',
  slug: 'nsw',

  departments: [
    { name: 'Department of Communities and Justice', shortName: 'DCJ', contracts: 1885, totalValue: 1440669520, period: 'Current', category: 'youth_justice' },
    { name: 'Youth Justice NSW (within DCJ)', shortName: 'YJ NSW', contracts: 0, totalValue: 327107000, period: 'ROGS 2024-25', category: 'youth_justice' },
  ],

  // Evidence levels verified via ALMA interventions DB. Cost data verified via ROGS 2024-25.
  // Dollar values are estimates unless marked as ROGS/AusTender verified.
  topSuppliers: [
    { name: 'Just Reinvest NSW', totalValue: 15000000, contracts: 6, departments: ['DCJ'], note: 'Justice reinvestment — Bourke, Moree, Mt Druitt · Effective evidence, 9 interventions (ALMA) · estimate' },
    { name: 'Life Without Barriers', totalValue: 45000000, contracts: 12, departments: ['DCJ'], note: '2 interventions (ALMA) · estimate' },
    { name: 'Ted Noffs Foundation', totalValue: 22000000, contracts: 8, departments: ['DCJ'], note: 'PALM + Street University · Promising evidence, 14 interventions (ALMA) · estimate' },
    { name: 'BackTrack Youth Works', totalValue: 8500000, contracts: 3, departments: ['DCJ'], note: 'Armidale · Indigenous-led evidence (ALMA) · estimate' },
    { name: 'Mission Australia', totalValue: 35000000, contracts: 15, departments: ['DCJ'], note: 'Promising evidence, 3 interventions (ALMA) · estimate' },
    { name: 'Salvation Army', totalValue: 28000000, contracts: 10, departments: ['DCJ'], note: 'estimate' },
    { name: 'Aboriginal Legal Service NSW/ACT', totalValue: 12000000, contracts: 5, departments: ['DCJ'], note: 'Indigenous-controlled legal aid · Promising evidence (ALMA) · $586K AusTender verified' },
    { name: 'Youth Off The Streets', totalValue: 9000000, contracts: 4, departments: ['DCJ'], note: '2 interventions (ALMA) · estimate' },
    { name: 'Juvenile Justice', totalValue: 217414000, contracts: 1, departments: ['YJ NSW'], note: 'Detention-based supervision — ROGS 2024-25 verified' },
  ],

  spotlight: {
    title: 'Western NSW Spotlight',
    totalFunding: 35000000,
    records: 200,
    orgs: 45,
    locations: [
      { name: 'Bourke', funding: 15000000, programs: 8 },
      { name: 'Moree', funding: 8000000, programs: 5 },
      { name: 'Mount Druitt', funding: 7000000, programs: 6 },
      { name: 'Armidale', funding: 5000000, programs: 4 },
    ],
  },

  fundingBySource: [
    { source: 'ROGS YJ Expenditure', count: 63, total: 8800071000 },
    { source: 'ROGS 2026', count: 40, total: 5692801000 },
    { source: 'AusTender', count: 1885, total: 1440669520 },
    { source: 'AIHW YJ', count: 3, total: 239703435 },
    { source: 'NSW Budget 2024', count: 3, total: 141200000 },
  ],

  costComparison: {
    detentionCostPerDay: 2573, // ROGS 2024-25 Table 17A.20 (verified)
    communityCostPerDay: 368,  // ROGS 2024-25 Table 17A.21 (verified)
    avgKidsInDetention: 231,   // ROGS 2024-25 Table 17A.20 avg daily population (verified)
  },

  voices: [
    {
      quote: "When we started in Bourke, people said justice reinvestment wouldn't work in Australia. Now the data shows a 23% reduction in youth offending and 42% fewer days in custody.",
      name: 'Sarah Hopkins',
      location: 'Bourke / Sydney',
      role: 'CEO, Just Reinvest NSW',
    },
    {
      quote: "BackTrack is about giving kids a reason to get out of bed. A dog to train, a welder to learn, a truck to drive. Real skills, real purpose.",
      name: 'Bernie Shakeshaft',
      location: 'Armidale',
      role: 'Founder, BackTrack Youth Works',
    },
  ],

  alternativeModel: {
    title: 'Justice Reinvestment — The Bourke Model',
    description: 'Community-driven justice reinvestment pioneered in Bourke by Maranguka. Proven 23% reduction in youth offending, 42% fewer custody days. Now expanding to Moree, Mount Druitt, Cowra, and Nowra.',
    pillars: [
      { tag: 'Data', description: 'Community-owned data dashboard tracking outcomes' },
      { tag: 'Diversion', description: 'Circle sentencing and restorative justice' },
      { tag: 'Employment', description: 'Local employment and training pathways' },
      { tag: 'Culture', description: 'Cultural programs and elder-led healing' },
      { tag: 'Housing', description: 'Safe accommodation for at-risk young people' },
      { tag: 'Education', description: 'Flexible education and re-engagement programs' },
    ],
    alternatives: [
      { name: 'Justice reinvestment sites', cost: 5000000, count: 10, unit: 'sites across NSW' },
      { name: 'Full-time youth workers', cost: 80000, count: 150, unit: 'workers for 5 years' },
      { name: 'BackTrack-style programs', cost: 2000000, count: 8, unit: 'regional centres' },
      { name: 'Cultural healing programs', cost: 500000, count: 25, unit: 'programs state-wide' },
      { name: 'Circle sentencing courts', cost: 300000, count: 15, unit: 'courts in regional NSW' },
    ],
  },

  scalePathway: [
    { name: 'Bourke', highlight: true },
    { name: 'Moree' },
    { name: 'Mount Druitt' },
    { name: 'Armidale' },
    { name: 'Cowra' },
    { name: 'Nowra' },
  ],

  crossoverHeadlineStat: '65%',
  crossoverHeadlineLabel: 'of NSW youth justice kids had prior child protection involvement (AIHW 2024)',
};
