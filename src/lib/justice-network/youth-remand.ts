import { createServiceClient } from '@/lib/supabase/service-lite';
import { unstable_cache } from 'next/cache';

export type JusticeNetworkKind =
  | 'case'
  | 'campaign'
  | 'evidence'
  | 'organization'
  | 'funding'
  | 'detention'
  | 'tour'
  | 'story'
  | 'country';

export interface JusticeNetworkRecord {
  id: string;
  kind: JusticeNetworkKind;
  title: string;
  eyebrow: string;
  summary: string;
  href: string | null;
  sourceUrl: string | null;
  sourceLabel: string | null;
  location: string | null;
  year: number | null;
  amount: number | null;
  tags: string[];
  trust: string[];
  score: number;
}

export interface CountryReadiness {
  country: string;
  region: string;
  status: 'anchor' | 'tour-node' | 'scoping';
  checks: {
    seeded: boolean;
    mapped: boolean;
    legal: boolean;
    campaigns: boolean;
    stories: boolean;
    partners: boolean;
  };
}

export interface YouthRemandNetworkPayload {
  query: string;
  generatedAt: string;
  records: JusticeNetworkRecord[];
  counts: Record<JusticeNetworkKind, number>;
  totals: {
    records: number;
    openRecords: number;
    partnerGatedRecords: number;
    humanConfirmed: number;
    consentCards: number;
  };
  readiness: CountryReadiness[];
}

const YOUTH_TAGS = [
  'youth-justice',
  'children',
  'child-rights',
  'raise-the-age',
  'justice-reinvestment',
  'detention-conditions',
  'deaths-in-custody',
  'age-of-responsibility',
];

const BASE_TERMS = [
  'remand',
  'bail',
  'detention',
  'custody',
  'children',
  'child',
  'youth',
  'young',
  'raise',
  'age',
  'diversion',
  'community',
  'justice',
];

export const countryReadiness: CountryReadiness[] = [
  {
    country: 'Australia',
    region: 'Anchor',
    status: 'anchor',
    checks: { seeded: true, mapped: true, legal: true, campaigns: true, stories: true, partners: true },
  },
  {
    country: 'South Africa',
    region: 'Africa',
    status: 'tour-node',
    checks: { seeded: true, mapped: true, legal: true, campaigns: false, stories: false, partners: true },
  },
  {
    country: 'Botswana',
    region: 'Africa',
    status: 'tour-node',
    checks: { seeded: true, mapped: true, legal: false, campaigns: false, stories: false, partners: false },
  },
  {
    country: 'Lesotho',
    region: 'Africa',
    status: 'tour-node',
    checks: { seeded: true, mapped: true, legal: false, campaigns: false, stories: false, partners: false },
  },
  {
    country: 'Tanzania',
    region: 'Africa',
    status: 'tour-node',
    checks: { seeded: true, mapped: true, legal: false, campaigns: false, stories: false, partners: true },
  },
  {
    country: 'Kenya',
    region: 'Africa',
    status: 'tour-node',
    checks: { seeded: true, mapped: true, legal: false, campaigns: true, stories: false, partners: true },
  },
  {
    country: 'Uganda',
    region: 'Africa',
    status: 'tour-node',
    checks: { seeded: true, mapped: true, legal: false, campaigns: false, stories: false, partners: true },
  },
  {
    country: 'Sweden',
    region: 'Europe',
    status: 'tour-node',
    checks: { seeded: true, mapped: true, legal: true, campaigns: false, stories: false, partners: true },
  },
  {
    country: 'Netherlands',
    region: 'Europe',
    status: 'tour-node',
    checks: { seeded: true, mapped: true, legal: true, campaigns: false, stories: false, partners: true },
  },
  {
    country: 'Spain',
    region: 'Europe',
    status: 'tour-node',
    checks: { seeded: true, mapped: true, legal: true, campaigns: true, stories: false, partners: true },
  },
  {
    country: 'Scotland / UK',
    region: 'Europe',
    status: 'tour-node',
    checks: { seeded: true, mapped: true, legal: true, campaigns: true, stories: false, partners: true },
  },
];

const tourRecords: JusticeNetworkRecord[] = [
  {
    id: 'tour-australia-youth-remand',
    kind: 'tour',
    title: 'Australia anchor: youth remand and detention alternatives',
    eyebrow: 'World Tour learning loop',
    summary:
      'Australia stays the proof point: connect remand pressure, youth detention sites, community alternatives, funding flows, and consented stories.',
    href: '/justice-matrix/map?surface=youth',
    sourceUrl: null,
    sourceLabel: 'JusticeHub Network',
    location: 'Australia',
    year: 2026,
    amount: null,
    tags: ['world-tour', 'youth-remand', 'australia'],
    trust: ['Open core', 'Research, not legal advice'],
    score: 3,
  },
  {
    id: 'tour-africa-europe-learning',
    kind: 'tour',
    title: 'Africa and Europe visits: alternatives, field learning, partner notes',
    eyebrow: 'Empathy Ledger route',
    summary:
      'Tour countries become deliberate learning nodes: what is working elsewhere, who is building it, and what Australia can learn without extracting stories.',
    href: null,
    sourceUrl: null,
    sourceLabel: 'Empathy Ledger planning layer',
    location: 'Africa and Europe',
    year: 2026,
    amount: null,
    tags: ['world-tour', 'field-notes', 'consent'],
    trust: ['Partner-gated', 'Consent-approved story cards only'],
    score: 2,
  },
];

function clean(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function truncate(value: unknown, max = 260): string {
  const text = clean(value);
  if (!text) return '';
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}...`;
}

function yearFromDate(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const year = new Date(value).getUTCFullYear();
  return Number.isFinite(year) ? year : null;
}

function money(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function searchTerms(query: string): string[] {
  const raw = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((term) => term.length >= 3);

  const expanded = new Set(raw.length ? raw : BASE_TERMS);
  if (expanded.has('remand')) {
    expanded.add('bail');
    expanded.add('custody');
    expanded.add('detention');
  }
  if (expanded.has('children') || expanded.has('child')) {
    expanded.add('youth');
    expanded.add('young');
  }
  if (expanded.has('detention')) {
    expanded.add('custody');
    expanded.add('remand');
  }
  return [...expanded];
}

function scoreRecord(record: JusticeNetworkRecord, terms: string[]): number {
  const haystack = `${record.title} ${record.summary} ${record.location ?? ''} ${record.tags.join(' ')} ${record.eyebrow}`.toLowerCase();
  let score = record.score;
  for (const term of terms) {
    if (haystack.includes(term)) score += term.length > 5 ? 2 : 1;
  }
  if (record.trust.includes('Human confirmed')) score += 2;
  if (record.kind === 'detention' || record.kind === 'organization') score += 1;
  return score;
}

function countByKind(records: JusticeNetworkRecord[]): Record<JusticeNetworkKind, number> {
  const counts: Record<JusticeNetworkKind, number> = {
    case: 0,
    campaign: 0,
    evidence: 0,
    organization: 0,
    funding: 0,
    detention: 0,
    tour: 0,
    story: 0,
    country: 0,
  };
  for (const record of records) counts[record.kind] += 1;
  return counts;
}

async function loadCases(supabase: ReturnType<typeof createServiceClient>): Promise<JusticeNetworkRecord[]> {
  const { data, error } = await supabase
    .from('justice_matrix_cases')
    .select(
      'id,case_citation,jurisdiction,year,court,strategic_issue,key_holding,categories,verified,human_confirmed,authoritative_link,case_type,region,country_code',
    )
    .overlaps('categories', YOUTH_TAGS)
    .order('year', { ascending: false, nullsFirst: false })
    .limit(80);

  if (error) {
    console.error('[justice-network] cases query failed', error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const confirmed = row.human_confirmed === true;
    const verified = row.verified === true;
    return {
      id: `case-${row.id}`,
      kind: 'case' as const,
      title: clean(row.case_citation, 'Untitled case'),
      eyebrow: clean(row.case_type, 'Case'),
      summary: truncate(row.strategic_issue || row.key_holding, 280) || 'Legal record connected to the youth justice surface.',
      href: `/justice-matrix/cases/${row.id}`,
      sourceUrl: clean(row.authoritative_link) || null,
      sourceLabel: clean(row.court, 'Source record'),
      location: clean(row.jurisdiction || row.region || row.country_code) || null,
      year: typeof row.year === 'number' ? row.year : null,
      amount: null,
      tags: Array.isArray(row.categories) ? row.categories.filter((tag): tag is string => typeof tag === 'string') : [],
      trust: [confirmed ? 'Human confirmed' : verified ? 'Verified case' : 'AI extracted', 'Research, not legal advice'],
      score: 2,
    };
  });
}

async function loadCampaigns(supabase: ReturnType<typeof createServiceClient>): Promise<JusticeNetworkRecord[]> {
  const { data, error } = await supabase
    .from('justice_matrix_campaigns')
    .select('id,campaign_name,country_region,start_year,goals,notable_tactics,categories,lead_organizations,campaign_link,is_ongoing')
    .overlaps('categories', YOUTH_TAGS)
    .order('start_year', { ascending: false, nullsFirst: false })
    .limit(80);

  if (error) {
    console.error('[justice-network] campaigns query failed', error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: `campaign-${row.id}`,
    kind: 'campaign' as const,
    title: clean(row.campaign_name, 'Untitled campaign'),
    eyebrow: row.is_ongoing === true ? 'Active campaign' : 'Campaign',
    summary: truncate(row.goals || row.notable_tactics, 280) || 'Movement record connected to reform strategy.',
    href: `/justice-matrix/campaigns/${row.id}`,
    sourceUrl: clean(row.campaign_link) || null,
    sourceLabel: clean(row.lead_organizations, 'Campaign source'),
    location: clean(row.country_region) || null,
    year: typeof row.start_year === 'number' ? row.start_year : null,
    amount: null,
    tags: Array.isArray(row.categories) ? row.categories.filter((tag): tag is string => typeof tag === 'string') : [],
    trust: ['Movement source', 'Research, not legal advice'],
    score: 2,
  }));
}

async function loadEvidence(supabase: ReturnType<typeof createServiceClient>): Promise<JusticeNetworkRecord[]> {
  const { data, error } = await supabase
    .from('alma_evidence')
    .select('id,title,evidence_type,findings,methodology,organization,author,publication_date,consent_level,cultural_safety,source_url')
    .in('consent_level', ['Public Knowledge Commons', 'Community Controlled'])
    .order('publication_date', { ascending: false, nullsFirst: false })
    .limit(100);

  if (error) {
    console.error('[justice-network] evidence query failed', error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const communityControlled = row.consent_level === 'Community Controlled';
    return {
      id: `evidence-${row.id}`,
      kind: 'evidence' as const,
      title: clean(row.title, 'Untitled evidence'),
      eyebrow: clean(row.evidence_type, 'Evidence'),
      summary: communityControlled
        ? 'Community-controlled evidence is visible as title and provenance only. Details stay governed by the consent gate.'
        : truncate(row.findings || row.methodology, 280) || 'Evidence record connected to youth justice alternatives.',
      href: `/justice-matrix/evidence/${row.id}`,
      sourceUrl: communityControlled ? null : clean(row.source_url) || null,
      sourceLabel: clean(row.organization || row.author, 'ALMA evidence'),
      location: 'Australia',
      year: yearFromDate(row.publication_date),
      amount: null,
      tags: ['youth-justice', 'evidence', communityControlled ? 'community-controlled' : 'public-knowledge'],
      trust: ['Consent-approved evidence', communityControlled ? 'Community Controlled' : 'Public Knowledge Commons'],
      score: 2,
    };
  });
}

async function loadOrganizations(supabase: ReturnType<typeof createServiceClient>): Promise<JusticeNetworkRecord[]> {
  const { data, error } = await supabase.rpc('get_yj_orgs_for_browser');

  if (error) {
    console.error('[justice-network] yj orgs RPC failed', error.message);
    return loadInterventionAlternatives(supabase);
  }

  if (!data || data.length === 0) return loadInterventionAlternatives(supabase);

  return (data ?? []).slice(0, 80).map((row: Record<string, unknown>) => {
    const abn = clean(row.abn);
    return {
      id: `org-${row.org_id}`,
      kind: 'organization' as const,
      title: clean(row.name, 'Untitled organisation'),
      eyebrow: row.community_controlled === true ? 'Community-controlled alternative' : clean(row.tier, 'Youth justice organisation'),
      summary: `${Number(row.program_count ?? 0).toLocaleString()} linked program${Number(row.program_count ?? 0) === 1 ? '' : 's'}; ${Number(
        row.strong_evidence_count ?? 0,
      ).toLocaleString()} strong evidence signal${Number(row.strong_evidence_count ?? 0) === 1 ? '' : 's'}.`,
      href: row.slug ? `/organizations/${row.slug}` : null,
      sourceUrl: abn ? `https://civicgraph.com.au/embed/entity/${encodeURIComponent(abn)}` : null,
      sourceLabel: abn ? 'CivicGraph entity card' : 'JusticeHub organisation',
      location: [row.locality, row.state].map((value) => clean(value)).filter(Boolean).join(', ') || clean(row.lga_name) || null,
      year: null,
      amount: money(row.funding_yj),
      tags: ['alternative', 'organization', row.community_controlled === true ? 'community-controlled' : 'sector'],
      trust: [abn ? 'CivicGraph-linked' : 'Needs entity link', row.community_controlled === true ? 'Community-led signal' : 'Open record'],
      score: 3,
    };
  });
}

async function loadInterventionAlternatives(supabase: ReturnType<typeof createServiceClient>): Promise<JusticeNetworkRecord[]> {
  const { data, error } = await supabase
    .from('alma_interventions')
    .select('id,name,description,type,geography,evidence_level,operating_organization,verification_status')
    .or(
      'name.ilike.%justice%,name.ilike.%detention%,name.ilike.%bail%,name.ilike.%diversion%,description.ilike.%justice%,description.ilike.%detention%,description.ilike.%bail%,description.ilike.%diversion%,type.ilike.%justice%',
    )
    .neq('verification_status', 'ai_generated')
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) {
    console.error('[justice-network] intervention fallback query failed', error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const geography = Array.isArray(row.geography)
      ? row.geography.filter((item): item is string => typeof item === 'string')
      : [];
    return {
      id: `alternative-${row.id}`,
      kind: 'organization' as const,
      title: clean(row.name, 'Community alternative'),
      eyebrow: clean(row.type, 'Community alternative'),
      summary: truncate(row.description, 260) || 'Alternative program record connected to the youth justice evidence base.',
      href: `/intelligence/interventions/${row.id}`,
      sourceUrl: null,
      sourceLabel: clean(row.operating_organization, 'ALMA intervention'),
      location: geography.join(', ') || 'Australia',
      year: null,
      amount: null,
      tags: ['alternative', 'organization', clean(row.evidence_level, 'evidence').toLowerCase()],
      trust: ['Open record', 'Needs CivicGraph link'],
      score: 2,
    };
  });
}

async function loadFunding(supabase: ReturnType<typeof createServiceClient>): Promise<JusticeNetworkRecord[]> {
  const { data, error } = await supabase
    .from('justice_funding')
    .select('id,recipient_name,recipient_abn,amount_dollars,state,financial_year,program_name,source,source_url,sector,topics')
    .or('sector.ilike.%youth%,program_name.ilike.%youth%,program_name.ilike.%bail%,program_name.ilike.%detention%,program_name.ilike.%justice%')
    .order('amount_dollars', { ascending: false, nullsFirst: false })
    .limit(80);

  if (error) {
    console.error('[justice-network] funding query failed', error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: `funding-${row.id}`,
    kind: 'funding' as const,
    title: clean(row.program_name || row.recipient_name, 'Untitled funding record'),
    eyebrow: 'Funding pathway',
    summary: clean(row.recipient_name)
      ? `Recipient: ${clean(row.recipient_name)}. Use this to connect alternatives to funder pathways and gaps.`
      : 'Funding record connected to the justice sector.',
    href: null,
    sourceUrl: clean(row.source_url) || null,
    sourceLabel: clean(row.source, 'Funding source'),
    location: clean(row.state) || null,
    year: typeof row.financial_year === 'string' ? Number.parseInt(row.financial_year.slice(0, 4), 10) || null : null,
    amount: money(row.amount_dollars),
    tags: Array.isArray(row.topics) ? row.topics.filter((tag): tag is string => typeof tag === 'string') : ['funding'],
    trust: ['Open funding record', row.recipient_abn ? 'ABN bridge ready' : 'Needs entity link'],
    score: 1,
  }));
}

async function loadDetentionFacilities(supabase: ReturnType<typeof createServiceClient>): Promise<JusticeNetworkRecord[]> {
  const { data, error } = await supabase
    .from('youth_detention_facilities')
    .select('id,name,facility_type,city,state,capacity_beds,current_population,has_remand_section,website,data_source_url,operational_status')
    .order('state', { ascending: true })
    .limit(40);

  if (error) {
    console.error('[justice-network] detention facilities query failed', error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: `detention-${row.id}`,
    kind: 'detention' as const,
    title: clean(row.name, 'Youth detention facility'),
    eyebrow: row.has_remand_section === true ? 'Remand pressure point' : clean(row.facility_type, 'Detention facility'),
    summary: [
      row.capacity_beds ? `${Number(row.capacity_beds).toLocaleString()} beds` : null,
      row.current_population ? `${Number(row.current_population).toLocaleString()} current population` : null,
      clean(row.operational_status),
    ]
      .filter(Boolean)
      .join(' · ') || 'Detention site for mapping pressure points against community alternatives.',
    href: null,
    sourceUrl: clean(row.data_source_url || row.website) || null,
    sourceLabel: 'Facility source',
    location: [row.city, row.state].map((value) => clean(value)).filter(Boolean).join(', ') || null,
    year: null,
    amount: null,
    tags: ['detention', row.has_remand_section === true ? 'remand' : 'custody'],
    trust: ['Centroid/location record', 'Research, not legal advice'],
    score: 3,
  }));
}

async function loadEmpathyLedgerStories(): Promise<JusticeNetworkRecord[]> {
  const baseUrl = process.env.EMPATHY_LEDGER_API_URL || process.env.NEXT_PUBLIC_EMPATHY_LEDGER_URL || '';
  if (!baseUrl) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const url = new URL('/api/v1/content-hub/stories', baseUrl);
    url.searchParams.set('destination', 'justicehub');
    url.searchParams.set('limit', '6');
    const response = await fetch(url.toString(), {
      cache: 'no-store',
      signal: controller.signal,
      headers: process.env.EMPATHY_LEDGER_API_KEY ? { 'X-API-Key': process.env.EMPATHY_LEDGER_API_KEY } : undefined,
    });

    if (!response.ok) return [];
    const payload = await response.json();
    const stories = Array.isArray(payload.stories) ? payload.stories : [];
    return stories.map((story: Record<string, unknown>) => ({
      id: `story-${story.id}`,
      kind: 'story' as const,
      title: clean(story.title, 'Consented story card'),
      eyebrow: 'Consent-approved story',
      summary: truncate(story.summary, 240) || 'Story card approved through Empathy Ledger syndication.',
      href: null,
      sourceUrl: null,
      sourceLabel: clean(story.authorName, 'Empathy Ledger'),
      location: null,
      year: yearFromDate(story.publishedAt),
      amount: null,
      tags: ['story', 'consent-card', 'empathy-ledger'],
      trust: ['Consent-approved story', 'Revocation-safe source packet'],
      score: 3,
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackStoryCard(): JusticeNetworkRecord {
  return {
    id: 'story-consent-card-placeholder',
    kind: 'story',
    title: 'Empathy Ledger story cards are the consent boundary',
    eyebrow: 'Story pipeline',
    summary:
      'Raw tour notes and private media stay in Empathy Ledger. JusticeHub should only receive approved cards or source packets after storyteller and cultural review.',
    href: null,
    sourceUrl: null,
    sourceLabel: 'Empathy Ledger consent model',
    location: null,
    year: 2026,
    amount: null,
    tags: ['consent-card', 'partner-gated', 'world-tour'],
    trust: ['Partner-gated', 'Consent-approved story cards only'],
    score: 2,
  };
}

function countryRecords(): JusticeNetworkRecord[] {
  return countryReadiness.map((country) => ({
    id: `country-${country.country.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    kind: 'country',
    title: country.country,
    eyebrow: country.status === 'anchor' ? 'Anchor country' : 'Route country',
    summary: `${Object.values(country.checks).filter(Boolean).length} of 6 readiness checks started across legal, campaign, story, partner, and mapping layers.`,
    href: `/justice-network/countries/${country.country.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    sourceUrl: null,
    sourceLabel: 'Country readiness',
    location: country.region,
    year: 2026,
    amount: null,
    tags: ['country-readiness', country.region.toLowerCase(), country.status],
    trust: ['Open core roadmap'],
    score: country.status === 'anchor' ? 3 : 1,
  }));
}

async function loadYouthRemandNetworkData(query = 'children on remand'): Promise<YouthRemandNetworkPayload> {
  const safeQuery = query.trim().slice(0, 120) || 'children on remand';
  const supabase = createServiceClient();

  const [caseRecords, campaignRecords, evidenceRecords, orgRecords, fundingRecords, detentionRecords, storyRecords] =
    await Promise.all([
      loadCases(supabase),
      loadCampaigns(supabase),
      loadEvidence(supabase),
      loadOrganizations(supabase),
      loadFunding(supabase),
      loadDetentionFacilities(supabase),
      loadEmpathyLedgerStories(),
    ]);

  const allRecords = [
    ...caseRecords,
    ...campaignRecords,
    ...evidenceRecords,
    ...orgRecords,
    ...fundingRecords,
    ...detentionRecords,
    ...tourRecords,
    ...(storyRecords.length > 0 ? storyRecords : [fallbackStoryCard()]),
    ...countryRecords(),
  ];

  const terms = searchTerms(safeQuery);
  const scoredAll = allRecords
    .map((record) => ({ ...record, score: scoreRecord(record, terms) }))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  const primary = scoredAll.filter(
    (record) => record.score > record.trust.length || record.kind === 'tour' || record.kind === 'story',
  );

  // The partner demo needs to prove cross-system range even when a narrow query
  // mostly hits detention/case language, so keep a small representative slice
  // from the adjacent layers.
  const representatives = ['organization', 'funding', 'country', 'story'].flatMap((kind) =>
    scoredAll.filter((record) => record.kind === kind).slice(0, kind === 'country' ? 2 : 3),
  );

  const seen = new Set<string>();
  const scored = [...primary.slice(0, 30), ...representatives, ...primary.slice(30)]
    .filter((record) => {
      if (seen.has(record.id)) return false;
      seen.add(record.id);
      return true;
    })
    .slice(0, 42);

  return {
    query: safeQuery,
    generatedAt: new Date().toISOString(),
    records: scored,
    counts: countByKind(scored),
    totals: {
      records: scored.length,
      openRecords: scored.filter((record) => !record.trust.includes('Partner-gated')).length,
      partnerGatedRecords: scored.filter((record) => record.trust.includes('Partner-gated')).length,
      humanConfirmed: scored.filter((record) => record.trust.includes('Human confirmed')).length,
      consentCards: scored.filter((record) => record.trust.includes('Consent-approved story')).length,
    },
    readiness: countryReadiness,
  };
}

export const getYouthRemandNetworkData = unstable_cache(
  loadYouthRemandNetworkData,
  ['justice-network-youth-remand-v2'],
  {
    revalidate: 300,
    tags: ['justice-network', 'youth-remand'],
  },
);
