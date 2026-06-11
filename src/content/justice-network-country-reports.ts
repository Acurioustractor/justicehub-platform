export type CountryReportStatus =
  | 'scoping'
  | 'legally sourced'
  | 'model sourced'
  | 'field visited'
  | 'story consent ready'
  | 'partner ready';

export interface CountryReport {
  slug: string;
  country: string;
  region: 'Anchor' | 'Africa' | 'Europe';
  status: CountryReportStatus[];
  headline: string;
  question: string;
  appearsDifferent: string;
  relevantModels: string[];
  australiaLearning: string[];
  nextFieldwork: string[];
  publicBoundary: string;
}

export const countryStatusLabels: Record<CountryReportStatus, { label: string; tone: string }> = {
  scoping: { label: 'Scoping', tone: '#756d63' },
  'legally sourced': { label: 'Legally sourced', tone: '#4a2560' },
  'model sourced': { label: 'Model sourced', tone: '#1f6f78' },
  'field visited': { label: 'Field visited', tone: '#a8552c' },
  'story consent ready': { label: 'Story consent ready', tone: '#285d45' },
  'partner ready': { label: 'Partner ready', tone: '#171717' },
};

export const countryReports: CountryReport[] = [
  {
    slug: 'australia',
    country: 'Australia',
    region: 'Anchor',
    status: ['legally sourced', 'model sourced', 'field visited', 'story consent ready', 'partner ready'],
    headline: 'The anchor comparison: youth remand pressure, community alternatives, and the physical JusticeHub model.',
    question: 'What would Australia fund if it treated children on remand as a support failure rather than a detention problem?',
    appearsDifferent:
      'Australia is the baseline for the public artifact: court and campaign pressure, high remand use, First Nations overrepresentation, and a growing map of community-led alternatives.',
    relevantModels: ['Oonchiumpa', 'Palm Island Community Company', 'BG Fit', 'Minjerribah Moorgumpin Elders-in-Council', 'BackTrack Youth Works', 'Deadly Connections'],
    australiaLearning: [
      'Make local alternatives visible before a young person reaches custody.',
      'Link legal strategy, funding, family support, and cultural authority into one pathway.',
      'Use CONTAINED as the public doorway and ALMA as the practical alternatives map.',
    ],
    nextFieldwork: ['Adelaide CONTAINED activation on Kaurna Yarta from 22-26 June 2026', 'Room 3 South Australian model capture', 'Basecamp exchange and Centre of Excellence pathway'],
    publicBoundary:
      'Australia can show more detail because JusticeHub already holds public cases, campaigns, ALMA models, and consent-governed local story material.',
  },
  {
    slug: 'south-africa',
    country: 'South Africa',
    region: 'Africa',
    status: ['scoping', 'partner ready'],
    headline: 'A high-priority Africa comparison for restorative justice, diversion, and community accountability.',
    question: 'How do restorative and community justice pathways reduce custody pressure for young people before sentence?',
    appearsDifferent:
      'South Africa is held as a priority scoping report until partner review and source checks are completed.',
    relevantModels: ['Restorative justice networks', 'Diversion providers to be sourced', 'Community accountability practice to be mapped'],
    australiaLearning: [
      'What a post-apartheid child justice frame can teach Australia about rights, diversion, and community repair.',
      'How legal reform and community practice can be shown together without simplifying either.',
    ],
    nextFieldwork: ['Identify lead partners', 'Source child justice and diversion law', 'Document one consent-safe model comparison'],
    publicBoundary: 'No private field notes or individual stories should appear until Empathy Ledger consent and partner review are complete.',
  },
  {
    slug: 'botswana',
    country: 'Botswana',
    region: 'Africa',
    status: ['scoping'],
    headline: 'A scoping country for court diversion, youth support, and regional comparison.',
    question: 'What formal and informal supports keep young people out of pre-trial detention?',
    appearsDifferent:
      'Botswana is not yet legally or model sourced inside JusticeHub. The report is a placeholder for structured field intelligence.',
    relevantModels: ['Youth support model to source', 'Community justice model to source', 'Legal aid or diversion pathway to source'],
    australiaLearning: ['How smaller jurisdictions organise youth support across distance.', 'What Australia can learn from regional and community-held response patterns.'],
    nextFieldwork: ['Source legal framework', 'Identify youth justice contacts', 'Add first model card'],
    publicBoundary: 'This page should remain clearly marked as scoping until source links and partners are attached.',
  },
  {
    slug: 'lesotho',
    country: 'Lesotho',
    region: 'Africa',
    status: ['scoping'],
    headline: 'A scoping country for mountain-region services, family support, and child protection overlap.',
    question: 'How do small-country systems hold young people when justice, family, school, and protection needs overlap?',
    appearsDifferent:
      'Lesotho is currently a route-country placeholder. It should become useful after legal sourcing and field conversations.',
    relevantModels: ['Community child support model to source', 'Education or reintegration model to source'],
    australiaLearning: ['How geography changes support design.', 'How family and child protection systems intersect with youth justice in smaller jurisdictions.'],
    nextFieldwork: ['Map youth justice source material', 'Identify partner organisations', 'Compare rural/remoteness lessons with Australia'],
    publicBoundary: 'Do not imply field verification before a visit, source check, or partner review.',
  },
  {
    slug: 'tanzania',
    country: 'Tanzania',
    region: 'Africa',
    status: ['scoping', 'partner ready'],
    headline: 'A partner-scoping country for community supports, education pathways, and justice diversion.',
    question: 'What role do local partners, schools, and community supports play before custody becomes the default response?',
    appearsDifferent:
      'Tanzania has partner-readiness signals but needs sourced legal and model cards before stronger public claims.',
    relevantModels: ['Education-linked support model to source', 'Community organisation partner pathway to map'],
    australiaLearning: ['How support, school, and family systems can be presented as detention prevention.', 'How world-tour learning can become practical model cards.'],
    nextFieldwork: ['Confirm partners', 'Source child justice framework', 'Add first model comparison'],
    publicBoundary: 'Use partner-gated notes until consent-safe cards and source links are ready.',
  },
  {
    slug: 'kenya',
    country: 'Kenya',
    region: 'Africa',
    status: ['scoping', 'partner ready'],
    headline: 'A high-signal Africa route country for rights, diversion, and youth-led civic practice.',
    question: 'How do legal empowerment, diversion, and youth civic practice change what happens before detention?',
    appearsDifferent:
      'Kenya is a strong candidate for early field learning, but the public report should stay scoped until source links are attached.',
    relevantModels: ['Legal empowerment model to source', 'Youth civic practice model to source', 'Diversion pathway to source'],
    australiaLearning: ['How young people and civil society can shape justice practice.', 'How field stories can remain consent-safe while still informing policy learning.'],
    nextFieldwork: ['Confirm route partners', 'Source legal and campaign context', 'Create first consent-safe field note template'],
    publicBoundary: 'Public content should be limited to sourced model summaries and approved partner language.',
  },
  {
    slug: 'uganda',
    country: 'Uganda',
    region: 'Africa',
    status: ['scoping', 'partner ready'],
    headline: 'A route-country scoping report for community support, family systems, and youth justice learning.',
    question: 'What community supports are available before young people are pushed deeper into formal justice systems?',
    appearsDifferent:
      'Uganda is currently a partner-readiness node, not a legally sourced country report.',
    relevantModels: ['Community support model to source', 'Family strengthening model to source'],
    australiaLearning: ['How family and community supports can become visible as justice infrastructure.', 'How to compare systems without flattening country context.'],
    nextFieldwork: ['Confirm partner path', 'Attach legal sources', 'Identify one youth support model'],
    publicBoundary: 'Treat this as scoping until fieldwork, public sources, and consent review are complete.',
  },
  {
    slug: 'sweden',
    country: 'Sweden',
    region: 'Europe',
    status: ['scoping', 'legally sourced', 'partner ready'],
    headline: 'A Europe comparison for welfare-state youth justice, custody thresholds, and support architecture.',
    question: 'What changes when youth justice is treated more explicitly as a welfare, care, and support question?',
    appearsDifferent:
      'Sweden is useful as a systems-design comparison, but JusticeHub should still attach current sources before strong claims.',
    relevantModels: ['Welfare-linked youth support model to source', 'Custody threshold comparison to source'],
    australiaLearning: ['What a support-first state architecture can teach Australian remand practice.', 'How to compare custody thresholds without ignoring local context.'],
    nextFieldwork: ['Source current youth justice framework', 'Identify model partners', 'Add legal comparison notes'],
    publicBoundary: 'No claim should be framed as settled without current source links.',
  },
  {
    slug: 'netherlands',
    country: 'Netherlands',
    region: 'Europe',
    status: ['scoping', 'legally sourced', 'partner ready'],
    headline: 'A Europe comparison for small-scale custody, youth care, and reintegration pathways.',
    question: 'What can Australia learn from smaller-scale, care-linked responses to young people in conflict with the law?',
    appearsDifferent:
      'The Netherlands is a priority comparison for system design, but public material needs source-backed model cards.',
    relevantModels: ['Small-scale custody model to source', 'Youth care and reintegration model to source'],
    australiaLearning: ['How design of place affects care, family contact, and reintegration.', 'How detention alternatives can be described as infrastructure, not sentiment.'],
    nextFieldwork: ['Source model references', 'Map relevant partners', 'Compare with Australian detention and bail support'],
    publicBoundary: 'Keep early notes as research scaffolding until sourced and reviewed.',
  },
  {
    slug: 'spain',
    country: 'Spain',
    region: 'Europe',
    status: ['legally sourced', 'model sourced', 'field visited', 'partner ready'],
    headline: 'The Diagrama comparison: therapeutic practice, family contact, education, and lower-custody imagination.',
    question: 'How does a therapeutic youth justice model change what a detention-like setting is designed to do?',
    appearsDifferent:
      'Spain is the strongest early global comparison because the Diagrama practice lens already informs Room 2 of CONTAINED.',
    relevantModels: ['Diagrama therapeutic youth justice practice', 'Family contact and education pathways', 'Practice exchange for Room 2'],
    australiaLearning: [
      'Make the alternative visible in the same room as the harm.',
      'Show practice, staffing, family contact, and environment as design choices.',
      'Turn a global model into a local question: what would this require in Australia?',
    ],
    nextFieldwork: ['Attach source packet', 'Create Diagrama comparison card', 'Connect to Adelaide Room 2 explainer'],
    publicBoundary: 'Use only approved trip material, public sources, or partner-reviewed summaries.',
  },
  {
    slug: 'scotland-uk',
    country: 'Scotland / UK',
    region: 'Europe',
    status: ['scoping', 'legally sourced', 'model sourced', 'partner ready'],
    headline: "A comparison for children's hearings, welfare framing, custody pressure, and public accountability.",
    question: 'What happens when the justice question is linked more directly to welfare, rights, and local accountability?',
    appearsDifferent:
      'Scotland/UK is a strong legal and policy comparison, but the report should separate Scotland-specific practice from broader UK material.',
    relevantModels: ["Children's hearings / welfare pathway to source", 'Youth justice service model to source', 'Community accountability model to source'],
    australiaLearning: ['How hearings, welfare, and rights frameworks alter the remand conversation.', 'How to build public legitimacy for alternatives before crisis moments.'],
    nextFieldwork: ['Split Scotland and UK source packets if needed', 'Identify lead legal/policy partners', 'Add model comparison cards'],
    publicBoundary: 'Keep jurisdiction labels precise and do not collapse Scotland and the UK into one legal system.',
  },
];

export function getCountryReport(slug: string) {
  return countryReports.find((report) => report.slug === slug);
}

export const countryReportRegions = ['Anchor', 'Africa', 'Europe'] as const;
