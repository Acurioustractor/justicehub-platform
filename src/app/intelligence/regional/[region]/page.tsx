import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import {
  ArrowRight, MapPin, DollarSign, Users, Building2,
  Shield, BarChart3, AlertTriangle, CheckCircle,
  ExternalLink, Target, TrendingUp, HelpCircle,
  Landmark, Globe, ChevronRight, Scale
} from 'lucide-react';
import {
  computeFundingByControlType,
  computeDetentionComparison,
  computeGovernmentSources,
  computeIntermediaryPresence,
  computeFundingFlows,
  DETENTION_COST_PER_CHILD,
  SOURCE_LABELS,
} from '@/lib/intelligence/regional-computations';

export const dynamic = 'force-dynamic';

/* ── Region config ────────────────────────────────────────────── */

interface RegionConfig {
  name: string;
  fullName: string;
  state: string;
  cities: string[];
  namePatterns: string[];
  coordinates: { lat: number; lng: number };
  description: string;
  tourStop: number;
}

const REGIONS: Record<string, RegionConfig> = {
  'mt-druitt': {
    name: 'Mt Druitt',
    fullName: 'Mt Druitt & Western Sydney',
    state: 'NSW',
    cities: [
      'Mount Druitt', 'Blacktown', 'Rooty Hill', 'Penrith', 'St Marys',
      'Emerton', 'Tregear', 'Bidwill', 'Whalan', 'Hebersham',
      'Plumpton', 'Oakhurst', 'Shalvey', 'Willmot', 'Dharruk',
      'Lethbridge Park',
    ],
    namePatterns: ['mt druitt', 'mount druitt', 'blacktown', 'western sydney'],
    coordinates: { lat: -33.7449, lng: 150.8218 },
    description:
      'Home to The Hive \u2014 Australia\'s largest urban justice reinvestment site. A community driving its own solutions across 16 suburbs.',
    tourStop: 1,
  },
  'adelaide': {
    name: 'Adelaide',
    fullName: 'Adelaide & South Australia',
    state: 'SA',
    cities: ['Adelaide', 'Port Adelaide', 'Elizabeth', 'Salisbury', 'Davoren Park', 'Smithfield', 'Hackham', 'Noarlunga', 'Christies Beach', 'Murray Bridge', 'Port Augusta', 'Port Lincoln', 'Ceduna', 'APY Lands'],
    namePatterns: ['adelaide', 'south australia', 'port augusta', 'tiraapendi wodli'],
    coordinates: { lat: -34.9285, lng: 138.6007 },
    description: 'Home to Tiraapendi Wodli — South Australia\'s first Aboriginal-led justice reinvestment site. A state grappling with over-representation while communities build their own models.',
    tourStop: 2,
  },
  'perth': {
    name: 'Perth',
    fullName: 'Perth & Western Australia',
    state: 'WA',
    cities: ['Perth', 'Midland', 'Armadale', 'Kwinana', 'Rockingham', 'Mandurah', 'Geraldton', 'Broome', 'Kununurra', 'Derby', 'Fitzroy Crossing', 'Halls Creek', 'Newman', 'Roebourne'],
    namePatterns: ['perth', 'western australia', 'kimberley', 'pilbara'],
    coordinates: { lat: -31.9505, lng: 115.8605 },
    description: 'WA has 70% community control among Indigenous orgs — the second highest in Australia. From the Kimberley to the metro, communities are leading.',
    tourStop: 3,
  },
  'tennant-creek': {
    name: 'Tennant Creek',
    fullName: 'Tennant Creek & Central Australia',
    state: 'NT',
    cities: ['Tennant Creek', 'Alice Springs', 'Ti Tree', 'Yuendumu', 'Lajamanu', 'Papunya', 'Hermannsburg', 'Santa Teresa', 'Docker River'],
    namePatterns: ['tennant creek', 'central australia', 'alice springs', 'barkly'],
    coordinates: { lat: -19.6497, lng: 134.1912 },
    description: 'The Territory has 85% community control — the highest in Australia. Tennant Creek and Central Australia are where First Nations justice models were born.',
    tourStop: 4,
  },
  'townsville': {
    name: 'Townsville',
    fullName: 'Townsville & North Queensland',
    state: 'QLD',
    cities: ['Townsville', 'Cairns', 'Mount Isa', 'Palm Island', 'Thursday Island', 'Doomadgee', 'Mornington Island', 'Normanton', 'Aurukun', 'Weipa', 'Bamaga'],
    namePatterns: ['townsville', 'north queensland', 'palm island', 'cape york', 'torres strait'],
    coordinates: { lat: -19.2590, lng: 146.8169 },
    description: 'North Queensland — where the youth crime moral panic meets the reality of community-led solutions. Palm Island, Cape York, Torres Strait — stories the media won\'t tell.',
    tourStop: 5,
  },
  'brisbane': {
    name: 'Brisbane',
    fullName: 'Brisbane & South East Queensland',
    state: 'QLD',
    cities: ['Brisbane', 'Logan', 'Ipswich', 'Caboolture', 'Inala', 'Woodridge', 'Beenleigh', 'Gold Coast', 'Toowoomba', 'Sunshine Coast'],
    namePatterns: ['brisbane', 'south east queensland', 'logan', 'ipswich', 'inala'],
    coordinates: { lat: -27.4698, lng: 153.0251 },
    description: 'SEQ is where 93% of Queensland\'s justice funding records are concentrated. Logan, Ipswich, Inala — the frontline communities driving change.',
    tourStop: 6,
  },
};

/* ── Helpers ──────────────────────────────────────────────────── */

function formatDollars(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function pct(n: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((n / total) * 100)}%`;
}

const EVIDENCE_COLORS: Record<string, string> = {
  'Proven (RCT/quasi-experimental, replicated)': 'bg-emerald-600',
  'Effective (strong evaluation, positive outcomes)': 'bg-green-600',
  'Promising (community-endorsed, emerging evidence)': 'bg-amber-500',
  'Indigenous-led (culturally grounded, community authority)': 'bg-purple-600',
  'Untested (theory/pilot stage)': 'bg-gray-400',
};

const EVIDENCE_SHORT: Record<string, string> = {
  'Proven (RCT/quasi-experimental, replicated)': 'Proven',
  'Effective (strong evaluation, positive outcomes)': 'Effective',
  'Promising (community-endorsed, emerging evidence)': 'Promising',
  'Indigenous-led (culturally grounded, community authority)': 'Indigenous-led',
  'Untested (theory/pilot stage)': 'Untested',
};

const EVIDENCE_ORDER = [
  'Proven (RCT/quasi-experimental, replicated)',
  'Effective (strong evaluation, positive outcomes)',
  'Promising (community-endorsed, emerging evidence)',
  'Indigenous-led (culturally grounded, community authority)',
  'Untested (theory/pilot stage)',
];

/* ── Data fetching ────────────────────────────────────────────── */

async function getRegionData(config: RegionConfig) {
  const supabase = createServiceClient();
  const sb = supabase as any; // bypass typed client for ALMA tables

  // 1. Organizations in region — match by city or name patterns
  const cityFilters = config.cities.map(c => `city.ilike.${c}`).join(',');
  const nameFilters = config.namePatterns.map(p => `name.ilike.%${p}%`).join(',');

  const { data: orgs } = await sb
    .from('organizations')
    .select('id, name, slug, type, description, city, state, website, is_indigenous_org, abn, control_type, acnc_data')
    .eq('is_active', true)
    .or(`${cityFilters},${nameFilters}`)
    .order('name');

  const organizations: any[] = orgs || [];
  const orgIds = organizations.map((o: any) => o.id);

  // Parallel fetches for interventions, funding, evidence, unlinked funding
  const [interventionsRes, fundingRes, unlinkedFundingRes, evidenceRes] = await Promise.all([
    // 2. Programs / Interventions
    orgIds.length > 0
      ? sb
          .from('alma_interventions')
          .select('id, name, description, type, evidence_level, cost_per_young_person, estimated_annual_capacity, verification_status, website, geography, years_operating, cultural_authority, operating_organization_id')
          .in('operating_organization_id', orgIds)
          .neq('verification_status', 'ai_generated')
          .order('evidence_level')
      : Promise.resolve({ data: [] }),

    // 3. Funding records for orgs in region
    orgIds.length > 0
      ? sb
          .from('justice_funding')
          .select('id, source, program_name, amount_dollars, financial_year, recipient_name, alma_organization_id')
          .in('alma_organization_id', orgIds)
          .order('amount_dollars', { ascending: false })
      : Promise.resolve({ data: [] }),

    // 4. Unlinked funding by recipient name match
    sb
      .from('justice_funding')
      .select('id, source, program_name, amount_dollars, financial_year, recipient_name')
      .is('alma_organization_id', null)
      .or(config.namePatterns.map(p => `recipient_name.ilike.%${p}%`).join(','))
      .order('amount_dollars', { ascending: false }),

    // 5. Evidence for programs in region
    orgIds.length > 0
      ? sb
          .from('alma_evidence')
          .select('id, source_url, evidence_type, summary, intervention_id')
          .in('intervention_id', orgIds) // we'll re-query properly below
      : Promise.resolve({ data: [] }),
  ]);

  const interventions = interventionsRes.data || [];
  const funding = fundingRes.data || [];
  const unlinkedFunding = unlinkedFundingRes.data || [];

  // Re-fetch evidence properly using intervention IDs
  const interventionIds = interventions.map((i: any) => i.id);
  let evidence: any[] = [];
  if (interventionIds.length > 0) {
    const { data: evidenceData } = await sb
      .from('alma_evidence')
      .select('id, source_url, evidence_type, summary, intervention_id')
      .in('intervention_id', interventionIds);
    evidence = evidenceData || [];
  }

  return { organizations, interventions, funding, unlinkedFunding, evidence };
}

/* ── Metadata ─────────────────────────────────────────────────── */

export async function generateMetadata({ params }: { params: { region: string } }): Promise<Metadata> {
  const config = REGIONS[params.region];
  if (!config) return { title: 'Region Not Found' };
  return {
    title: `${config.fullName} \u2014 Regional Intelligence | JusticeHub`,
    description: `Community justice landscape for ${config.fullName}. Organizations, programs, funding flows, and evidence \u2014 all in one place.`,
    openGraph: {
      title: `${config.fullName} \u2014 Regional Intelligence`,
      description: config.description,
    },
  };
}

/* ── Page ─────────────────────────────────────────────────────── */

export default async function RegionalReportPage({ params }: { params: { region: string } }) {
  const config = REGIONS[params.region];
  if (!config) notFound();

  const { organizations, interventions, funding, unlinkedFunding, evidence } = await getRegionData(config);

  // ── Computed stats ──
  const totalFunding = funding.reduce((sum: number, f: any) => sum + (f.amount_dollars || 0), 0);
  const totalUnlinkedFunding = unlinkedFunding.reduce((sum: number, f: any) => sum + (f.amount_dollars || 0), 0);
  const indigenousOrgs = organizations.filter(o => o.is_indigenous_org);
  const communityControlled = organizations.filter(o => o.control_type === 'community_controlled');

  // Org funding map
  const orgFundingMap = new Map<string, number>();
  const orgProgramMap = new Map<string, number>();
  for (const f of funding) {
    if (f.alma_organization_id) {
      orgFundingMap.set(f.alma_organization_id, (orgFundingMap.get(f.alma_organization_id) || 0) + (f.amount_dollars || 0));
    }
  }
  for (const i of interventions) {
    if (i.operating_organization_id) {
      orgProgramMap.set(i.operating_organization_id, (orgProgramMap.get(i.operating_organization_id) || 0) + 1);
    }
  }

  // Evidence distribution
  const evidenceCounts: Record<string, number> = {};
  for (const i of interventions) {
    const level = i.evidence_level || 'Untested (theory/pilot stage)';
    evidenceCounts[level] = (evidenceCounts[level] || 0) + 1;
  }

  // Group programs by evidence level
  const programsByEvidence: Record<string, any[]> = {};
  for (const level of EVIDENCE_ORDER) {
    const progs = interventions.filter((i: any) => (i.evidence_level || 'Untested (theory/pilot stage)') === level);
    if (progs.length > 0) programsByEvidence[level] = progs;
  }

  // Funding by source
  const fundingBySource = new Map<string, { total: number; count: number }>();
  for (const f of funding) {
    const source = f.source || 'Unknown';
    const existing = fundingBySource.get(source) || { total: 0, count: 0 };
    existing.total += f.amount_dollars || 0;
    existing.count += 1;
    fundingBySource.set(source, existing);
  }
  const sortedSources = [...fundingBySource.entries()].sort((a, b) => b[1].total - a[1].total);

  // Data gaps
  const orgsWithFundingNoPrograms = organizations.filter(o =>
    orgFundingMap.has(o.id) && !orgProgramMap.has(o.id)
  );
  const orgsNoClassification = organizations.filter(o => !o.control_type);
  const programsNoEvidence = interventions.filter((i: any) => {
    const hasEvidence = evidence.some((e: any) => e.intervention_id === i.id);
    return !hasEvidence;
  });

  // Sort orgs: community controlled first, then by funding
  const sortedOrgs = [...organizations].sort((a, b) => {
    if (a.control_type === 'community_controlled' && b.control_type !== 'community_controlled') return -1;
    if (a.control_type !== 'community_controlled' && b.control_type === 'community_controlled') return 1;
    const aFunding = orgFundingMap.get(a.id) || 0;
    const bFunding = orgFundingMap.get(b.id) || 0;
    return bFunding - aFunding;
  });

  // Org name lookup for programs
  const orgNameMap = new Map<string, { name: string; slug: string | null }>();
  for (const o of organizations) {
    orgNameMap.set(o.id, { name: o.name, slug: o.slug });
  }

  // ── New: Funding flow computations ──
  const fundingByControlType = computeFundingByControlType(funding, organizations);
  const totalClassifiedFunding =
    fundingByControlType.community_controlled +
    fundingByControlType.community_adjacent +
    fundingByControlType.intermediary +
    fundingByControlType.government +
    fundingByControlType.other;

  const detentionComparison = computeDetentionComparison(interventions, totalFunding);
  const govSources = computeGovernmentSources(funding, organizations);
  const intermediaryPresence = computeIntermediaryPresence(organizations, interventions, funding);
  const fundingFlows = computeFundingFlows(govSources, intermediaryPresence, funding, organizations);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      {/* ── Navigation bar ── */}
      <div className="bg-[#0A0A0A] text-white py-3 px-6 flex items-center justify-between text-sm print:hidden">
        <Link href="/intelligence" className="flex items-center gap-2 text-white/70 hover:text-white">
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span>Intelligence Hub</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-white/50">REGIONAL INTELLIGENCE REPORT</span>
          <span className="font-mono text-xs text-white/30">Ctrl+P to save as PDF</span>
        </div>
      </div>

      {/* ── HERO ── */}
      <div className="bg-[#0A0A0A] text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 print:py-10">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#DC2626]/20 text-[#DC2626] font-mono">
                  CONTAINED TOUR STOP {config.tourStop}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60 font-mono">
                  {config.state}
                </span>
              </div>
              <h1
                className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-white"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {config.fullName}
              </h1>
              <p className="text-lg text-white/70 leading-relaxed max-w-2xl">
                {config.description}
              </p>
            </div>
            <div className="hidden lg:flex flex-col items-end gap-2">
              <MapPin className="w-8 h-8 text-white/20" />
              <span className="text-xs font-mono text-white/30">
                {config.coordinates.lat.toFixed(4)}, {config.coordinates.lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Key Stats Strip ── */}
      <div className="bg-[#0A0A0A] border-t border-white/10 print:border-gray-300">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-5 gap-6">
          <div>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {organizations.length}
            </p>
            <p className="text-sm text-white/50 font-mono">Organisations</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {interventions.length}
            </p>
            <p className="text-sm text-white/50 font-mono">Programs</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatDollars(totalFunding)}
            </p>
            <p className="text-sm text-white/50 font-mono">Funding Tracked</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#059669]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {communityControlled.length}
            </p>
            <p className="text-sm text-white/50 font-mono">Community Controlled</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {indigenousOrgs.length}
            </p>
            <p className="text-sm text-white/50 font-mono">Indigenous Orgs</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 print:space-y-10">

        {/* ── SECTION 2: Community Control Distribution ── */}
        {organizations.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Community Control Landscape
            </h2>
            <div className="bg-white/80 rounded-xl p-6 border border-gray-200">
              {(() => {
                const total = organizations.length;
                const typeCounts: Record<string, number> = {};
                for (const o of organizations) {
                  const t = o.control_type || 'unclassified';
                  typeCounts[t] = (typeCounts[t] || 0) + 1;
                }

                const CONTROL_COLORS: Record<string, { bg: string; text: string }> = {
                  community_controlled: { bg: 'bg-[#059669]', text: 'text-[#059669]' },
                  community_adjacent: { bg: 'bg-teal-400', text: 'text-teal-600' },
                  intermediary: { bg: 'bg-amber-400', text: 'text-amber-600' },
                  government: { bg: 'bg-slate-400', text: 'text-slate-600' },
                  university: { bg: 'bg-blue-400', text: 'text-blue-600' },
                  peak_body: { bg: 'bg-indigo-400', text: 'text-indigo-600' },
                  unclassified: { bg: 'bg-gray-300', text: 'text-gray-500' },
                };
                const CONTROL_LABELS: Record<string, string> = {
                  community_controlled: 'Community Controlled',
                  community_adjacent: 'Community Adjacent',
                  intermediary: 'Intermediary',
                  government: 'Government',
                  university: 'University',
                  peak_body: 'Peak Body',
                  unclassified: 'Unclassified',
                };

                const segments = Object.entries(typeCounts)
                  .map(([type, count]) => ({
                    label: CONTROL_LABELS[type] || type,
                    count,
                    color: CONTROL_COLORS[type]?.bg || 'bg-gray-300',
                    textColor: CONTROL_COLORS[type]?.text || 'text-gray-500',
                  }))
                  .sort((a, b) => b.count - a.count)
                  .filter(s => s.count > 0);

                return (
                  <>
                    {/* Stacked bar */}
                    <div className="flex gap-1 h-10 rounded-lg overflow-hidden mb-4">
                      {segments.map(s => (
                        <div
                          key={s.label}
                          className={`${s.color} relative group flex items-center justify-center`}
                          style={{ flex: s.count }}
                          title={`${s.label}: ${s.count} (${pct(s.count, total)})`}
                        >
                          <span className="text-white text-xs font-bold font-mono">
                            {s.count}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-6">
                      {segments.map(s => (
                        <div key={s.label} className="flex items-center gap-2 text-sm">
                          <span className={`w-3 h-3 rounded-full ${s.color}`} />
                          <span className="text-gray-600">
                            {s.label}: <strong className={s.textColor}>{s.count}</strong>{' '}
                            <span className="font-mono text-gray-400">({pct(s.count, total)})</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </section>
        )}

        {/* ── SECTION 3: Key Organizations ── */}
        {sortedOrgs.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Organisations
            </h2>
            <p className="text-sm text-gray-500 mb-6 font-mono">
              {organizations.length} organisations across {config.cities.length} suburbs
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {sortedOrgs.map(org => {
                const orgFunding = orgFundingMap.get(org.id) || 0;
                const orgPrograms = orgProgramMap.get(org.id) || 0;
                const isCC = org.control_type === 'community_controlled';
                const isIndigenous = org.is_indigenous_org;

                return (
                  <div
                    key={org.id}
                    className={`bg-white/80 rounded-lg p-5 border border-gray-200 hover:border-gray-300 transition-colors ${
                      isIndigenous ? 'border-l-4 border-l-[#059669]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {org.slug ? (
                          <Link
                            href={`/for-funders/org/${org.slug}`}
                            className="text-[#0A0A0A] hover:underline font-semibold text-base"
                          >
                            {org.name}
                          </Link>
                        ) : (
                          <h3 className="font-semibold text-[#0A0A0A] text-base">{org.name}</h3>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {isCC && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#059669]/10 text-[#059669]">
                              <CheckCircle className="w-3 h-3" /> Community Controlled
                            </span>
                          )}
                          {isIndigenous && !isCC && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-600">
                              <Shield className="w-3 h-3" /> Indigenous Org
                            </span>
                          )}
                          {org.city && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                              <MapPin className="w-3 h-3" /> {org.city}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs font-mono text-gray-500">
                        <span className="text-[#0A0A0A] font-medium">{orgPrograms}</span> programs
                      </span>
                      <span className="text-xs font-mono text-gray-500">
                        <span className="text-[#0A0A0A] font-medium">{orgFunding > 0 ? formatDollars(orgFunding) : '$0'}</span> funding
                      </span>
                      {org.control_type && (
                        <span className="text-xs font-mono text-gray-400">{org.control_type.replace('_', ' ')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── SECTION: Detention Cost Comparison ── */}
        {interventions.length > 0 && (
          <section>
            <div className="bg-[#0A0A0A] rounded-xl p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <Scale className="w-6 h-6 text-[#DC2626]" />
                <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  The Detention Cost Equation
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-lg p-5">
                  <p className="text-xs font-mono text-[#DC2626]/70 uppercase tracking-wider mb-1">Detention Cost / Child / Year</p>
                  <p className="text-3xl font-bold text-[#DC2626]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {formatDollars(DETENTION_COST_PER_CHILD)}
                  </p>
                  <p className="text-xs text-white/40 font-mono mt-1">ROGS 2026</p>
                </div>

                {detentionComparison.avgCommunityProgramCost != null && (
                  <div className="bg-[#059669]/10 border border-[#059669]/30 rounded-lg p-5">
                    <p className="text-xs font-mono text-[#059669]/70 uppercase tracking-wider mb-1">Avg Community Program / Year</p>
                    <p className="text-3xl font-bold text-[#059669]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {formatDollars(detentionComparison.avgCommunityProgramCost)}
                    </p>
                    <p className="text-xs text-white/40 font-mono mt-1">
                      Based on {detentionComparison.programsWithCostData} programs in {config.name}
                    </p>
                  </div>
                )}

                {detentionComparison.costMultiplier != null && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                    <p className="text-xs font-mono text-white/40 uppercase tracking-wider mb-1">Cost Multiplier</p>
                    <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {detentionComparison.costMultiplier}x
                    </p>
                    <p className="text-xs text-white/40 font-mono mt-1">
                      Detention costs {detentionComparison.costMultiplier}x more than community programs
                    </p>
                  </div>
                )}
              </div>

              {/* Equivalence callout */}
              <div className="border-t border-white/10 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {detentionComparison.equivalentDetentionBeds > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#DC2626]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-[#DC2626]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {detentionComparison.equivalentDetentionBeds}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Equivalent detention beds</p>
                        <p className="text-xs text-white/50 mt-0.5">
                          This region&apos;s {formatDollars(totalFunding)} in community funding equals the cost of {detentionComparison.equivalentDetentionBeds} children in detention for a year
                        </p>
                      </div>
                    </div>
                  )}
                  {detentionComparison.communityProgramsPerBed != null && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#059669]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-[#059669]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {detentionComparison.communityProgramsPerBed}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Young people in community programs</p>
                        <p className="text-xs text-white/50 mt-0.5">
                          For every child locked up at {formatDollars(DETENTION_COST_PER_CHILD)}/yr, {detentionComparison.communityProgramsPerBed} could be supported through community programs
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── SECTION: Community vs Intermediary Funding Split ── */}
        {totalClassifiedFunding > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Where Does the Money Go?
            </h2>
            <p className="text-sm text-gray-500 mb-6 font-mono">
              Funding split by organisation control type &mdash; how much reaches community-controlled organisations?
            </p>

            <div className="bg-white/80 rounded-xl p-6 border border-gray-200">
              {/* Stacked horizontal bar */}
              <div className="flex gap-0.5 h-12 rounded-lg overflow-hidden mb-6">
                {[
                  { key: 'community_controlled', label: 'Community Controlled', amount: fundingByControlType.community_controlled, color: 'bg-[#059669]' },
                  { key: 'community_adjacent', label: 'Community Adjacent', amount: fundingByControlType.community_adjacent, color: 'bg-teal-400' },
                  { key: 'intermediary', label: 'Intermediary', amount: fundingByControlType.intermediary, color: 'bg-amber-400' },
                  { key: 'government', label: 'Government', amount: fundingByControlType.government, color: 'bg-slate-400' },
                  { key: 'other', label: 'Other', amount: fundingByControlType.other, color: 'bg-blue-400' },
                ].filter(s => s.amount > 0).map(s => (
                  <div
                    key={s.key}
                    className={`${s.color} relative group flex items-center justify-center transition-all hover:opacity-90`}
                    style={{ flex: s.amount }}
                    title={`${s.label}: ${formatDollars(s.amount)} (${pct(s.amount, totalClassifiedFunding)})`}
                  >
                    <span className="text-white text-xs font-bold font-mono whitespace-nowrap px-1">
                      {pct(s.amount, totalClassifiedFunding)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Legend with dollar amounts */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'community_controlled', label: 'Community Controlled', amount: fundingByControlType.community_controlled, color: 'bg-[#059669]', textColor: 'text-[#059669]' },
                  { key: 'community_adjacent', label: 'Community Adjacent', amount: fundingByControlType.community_adjacent, color: 'bg-teal-400', textColor: 'text-teal-600' },
                  { key: 'intermediary', label: 'Intermediary', amount: fundingByControlType.intermediary, color: 'bg-amber-400', textColor: 'text-amber-600' },
                  { key: 'government', label: 'Government', amount: fundingByControlType.government, color: 'bg-slate-400', textColor: 'text-slate-600' },
                  { key: 'other', label: 'Other', amount: fundingByControlType.other, color: 'bg-blue-400', textColor: 'text-blue-600' },
                ].filter(s => s.amount > 0).map(s => (
                  <div key={s.key} className="flex items-start gap-2">
                    <span className={`w-3 h-3 rounded-full ${s.color} mt-0.5 flex-shrink-0`} />
                    <div>
                      <p className={`text-sm font-medium ${s.textColor}`}>{s.label}</p>
                      <p className="text-lg font-bold text-[#0A0A0A] font-mono" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {formatDollars(s.amount)}
                      </p>
                      <p className="text-xs font-mono text-gray-400">{pct(s.amount, totalClassifiedFunding)} of classified</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Unclassified note */}
              {fundingByControlType.unclassified > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                  <AlertTriangle className="w-4 h-4 text-gray-400" />
                  <span className="font-mono">
                    {formatDollars(fundingByControlType.unclassified)} unclassified
                  </span>
                  <span>&mdash; funding not linked to a classified organisation</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── SECTION: Intermediary Presence ── */}
        {intermediaryPresence.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Intermediary Presence
            </h2>
            <p className="text-sm text-gray-500 mb-6 font-mono">
              Large organisations operating local programs in {config.name}
            </p>

            <div className="space-y-4">
              {intermediaryPresence.map(intermed => (
                <div
                  key={intermed.orgId}
                  className="bg-white/80 rounded-xl border border-amber-200 p-6 hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-500" />
                        {intermed.orgSlug ? (
                          <Link
                            href={`/for-funders/org/${intermed.orgSlug}`}
                            className="text-lg font-semibold text-[#0A0A0A] hover:underline"
                          >
                            {intermed.orgName}
                          </Link>
                        ) : (
                          <h3 className="text-lg font-semibold text-[#0A0A0A]">{intermed.orgName}</h3>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 font-mono">
                          Intermediary
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#0A0A0A] font-mono" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {intermed.totalFunding > 0 ? formatDollars(intermed.totalFunding) : '\u2014'}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">funding tracked</p>
                    </div>
                  </div>

                  {/* Programs operated by this intermediary */}
                  {intermed.programs.length > 0 && (
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-2">
                        {intermed.programCount} local program{intermed.programCount !== 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {intermed.programs.map(prog => (
                          <span
                            key={prog.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gray-50 border border-gray-200 text-gray-700"
                          >
                            {prog.name}
                            {prog.evidenceLevel && (
                              <span className={`w-2 h-2 rounded-full ${
                                prog.evidenceLevel.startsWith('Proven') ? 'bg-emerald-600' :
                                prog.evidenceLevel.startsWith('Effective') ? 'bg-green-600' :
                                prog.evidenceLevel.startsWith('Promising') ? 'bg-amber-500' :
                                prog.evidenceLevel.startsWith('Indigenous') ? 'bg-purple-600' :
                                'bg-gray-400'
                              }`} title={prog.evidenceLevel} />
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION: Government Funding Flow ── */}
        {fundingFlows.length > 0 && (
          <section className="print:break-before-page">
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Government Funding Flow
            </h2>
            <p className="text-sm text-gray-500 mb-6 font-mono">
              How public money flows from government to organisations and programs in {config.name}
            </p>

            <div className="space-y-3">
              {fundingFlows.map((flow, idx) => (
                <div
                  key={`flow-${idx}`}
                  className="flex items-stretch gap-0 overflow-hidden rounded-xl border border-gray-200 bg-white/80"
                >
                  {/* Source */}
                  <div className="flex-shrink-0 w-[30%] bg-slate-50 border-r border-gray-200 p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <Landmark className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <p className="text-xs font-mono text-slate-500 uppercase tracking-wider leading-tight">
                        {flow.sourceLabel}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-[#0A0A0A] font-mono" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {formatDollars(flow.amount)}
                    </p>
                  </div>

                  {/* Arrow connector */}
                  <div className="flex items-center px-0 bg-white/80 flex-shrink-0">
                    <div className="w-8 h-px bg-gray-300 relative">
                      <ChevronRight className="w-4 h-4 text-gray-400 absolute -right-2 -top-2" />
                    </div>
                  </div>

                  {/* Recipient org */}
                  <div className={`flex-1 p-4 flex flex-col justify-center ${flow.program ? 'border-r border-gray-200' : ''}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      {flow.intermediary?.slug ? (
                        <Link
                          href={`/for-funders/org/${flow.intermediary.slug}`}
                          className="text-sm font-medium text-[#0A0A0A] hover:underline truncate"
                        >
                          {flow.intermediary.name}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-[#0A0A0A] truncate">
                          {flow.intermediary?.name || 'Unknown'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Arrow to program (if exists) */}
                  {flow.program && (
                    <>
                      <div className="flex items-center px-0 bg-white/80 flex-shrink-0">
                        <div className="w-8 h-px bg-gray-300 relative">
                          <ChevronRight className="w-4 h-4 text-gray-400 absolute -right-2 -top-2" />
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-[25%] bg-[#059669]/5 p-4 flex flex-col justify-center">
                        <p className="text-sm font-medium text-[#059669] truncate">{flow.program.name}</p>
                        {flow.program.type && (
                          <p className="text-xs text-gray-400 font-mono">{flow.program.type}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Government source summary table */}
            {govSources.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-3">Government Sources Summary</h3>
                <div className="bg-white/80 rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs font-mono text-gray-500 uppercase">Source</th>
                        <th className="text-right px-5 py-3 text-xs font-mono text-gray-500 uppercase">Total</th>
                        <th className="text-right px-5 py-3 text-xs font-mono text-gray-500 uppercase">Recipients</th>
                        <th className="text-right px-5 py-3 text-xs font-mono text-gray-500 uppercase">Records</th>
                      </tr>
                    </thead>
                    <tbody>
                      {govSources.slice(0, 8).map(src => (
                        <tr key={src.source} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-5 py-3 text-sm text-gray-700">{src.sourceLabel}</td>
                          <td className="px-5 py-3 text-sm text-right font-mono text-[#0A0A0A] font-medium">{formatDollars(src.total)}</td>
                          <td className="px-5 py-3 text-sm text-right font-mono text-gray-500">{src.orgNames.length}</td>
                          <td className="px-5 py-3 text-sm text-right font-mono text-gray-400">{src.records.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── SECTION 4: Programs & Evidence ── */}
        {interventions.length > 0 && (
          <section className="print:break-before-page">
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Programs & Evidence
            </h2>
            <p className="text-sm text-gray-500 mb-6 font-mono">
              {interventions.length} verified programs | {evidence.length} evidence items
            </p>

            {/* Evidence distribution bar */}
            <div className="bg-white/80 rounded-xl p-6 border border-gray-200 mb-6">
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">Evidence Distribution</p>
              <div className="flex gap-1 h-8 rounded-lg overflow-hidden mb-4">
                {EVIDENCE_ORDER.map(level => {
                  const count = evidenceCounts[level] || 0;
                  if (count === 0) return null;
                  return (
                    <div
                      key={level}
                      className={`${EVIDENCE_COLORS[level] || 'bg-gray-400'} relative group flex items-center justify-center`}
                      style={{ flex: count }}
                      title={`${EVIDENCE_SHORT[level]}: ${count}`}
                    >
                      <span className="text-white text-xs font-bold">{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-4">
                {EVIDENCE_ORDER.map(level => {
                  const count = evidenceCounts[level] || 0;
                  if (count === 0) return null;
                  return (
                    <div key={level} className="flex items-center gap-2 text-sm">
                      <span className={`w-3 h-3 rounded-full ${EVIDENCE_COLORS[level]}`} />
                      <span className="text-gray-600 font-mono text-xs">
                        {EVIDENCE_SHORT[level]} ({count})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Programs grouped by evidence level */}
            <div className="space-y-8">
              {EVIDENCE_ORDER.map(level => {
                const progs = programsByEvidence[level];
                if (!progs) return null;
                return (
                  <div key={level}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`w-3 h-3 rounded-full ${EVIDENCE_COLORS[level]}`} />
                      <h3 className="font-semibold text-[#0A0A0A]">
                        {EVIDENCE_SHORT[level]}
                      </h3>
                      <span className="text-xs font-mono text-gray-400">{progs.length} program{progs.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="space-y-2">
                      {progs.map((prog: any) => {
                        const orgInfo = orgNameMap.get(prog.operating_organization_id);
                        return (
                          <div
                            key={prog.id}
                            className="bg-white/80 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-[#0A0A0A]">{prog.name}</h4>
                                {orgInfo && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {orgInfo.slug ? (
                                      <Link href={`/for-funders/org/${orgInfo.slug}`} className="hover:underline">
                                        {orgInfo.name}
                                      </Link>
                                    ) : (
                                      orgInfo.name
                                    )}
                                  </p>
                                )}
                                {prog.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{prog.description}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                  {prog.geography?.length > 0 && (
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-400 font-mono">
                                      <MapPin className="w-3 h-3" /> {prog.geography.join(', ')}
                                    </span>
                                  )}
                                  {prog.years_operating && (
                                    <span className="text-xs font-mono text-gray-400">{prog.years_operating}+ years</span>
                                  )}
                                  {prog.cost_per_young_person && (
                                    <span className="text-xs font-mono text-gray-400">
                                      {formatDollars(prog.cost_per_young_person)}/yr
                                    </span>
                                  )}
                                  {prog.estimated_annual_capacity && (
                                    <span className="text-xs font-mono text-gray-400">
                                      {prog.estimated_annual_capacity} participants/yr
                                    </span>
                                  )}
                                  {prog.cultural_authority && (
                                    <span className="inline-flex items-center gap-1 text-xs text-purple-500">
                                      <Shield className="w-3 h-3" /> {prog.cultural_authority}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap ${EVIDENCE_COLORS[prog.evidence_level || ''] || 'bg-gray-400'}`}>
                                {EVIDENCE_SHORT[prog.evidence_level || ''] || 'Untested'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── SECTION 5: Funding Flow ── */}
        {(funding.length > 0 || unlinkedFunding.length > 0) && (
          <section className="print:break-before-page">
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Funding Flow
            </h2>
            <p className="text-sm text-gray-500 mb-6 font-mono">
              {formatDollars(totalFunding)} linked | {formatDollars(totalUnlinkedFunding)} unlinked | {funding.length + unlinkedFunding.length} records
            </p>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/80 rounded-lg p-5 border border-gray-200">
                <p className="text-2xl font-bold text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {formatDollars(totalFunding + totalUnlinkedFunding)}
                </p>
                <p className="text-xs text-gray-500 font-mono">Total in Region</p>
              </div>
              <div className="bg-white/80 rounded-lg p-5 border border-gray-200">
                <p className="text-2xl font-bold text-[#059669]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {formatDollars(totalFunding)}
                </p>
                <p className="text-xs text-gray-500 font-mono">Linked to Orgs</p>
              </div>
              <div className="bg-white/80 rounded-lg p-5 border border-gray-200">
                <p className="text-2xl font-bold text-[#DC2626]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {formatDollars(totalUnlinkedFunding)}
                </p>
                <p className="text-xs text-gray-500 font-mono">Unlinked</p>
              </div>
              <div className="bg-white/80 rounded-lg p-5 border border-gray-200">
                <p className="text-2xl font-bold text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {sortedSources.length}
                </p>
                <p className="text-xs text-gray-500 font-mono">Funding Sources</p>
              </div>
            </div>

            {/* Top funding sources */}
            {sortedSources.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-3">By Source</h3>
                <div className="bg-white/80 rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs font-mono text-gray-500 uppercase">Source</th>
                        <th className="text-right px-5 py-3 text-xs font-mono text-gray-500 uppercase">Records</th>
                        <th className="text-right px-5 py-3 text-xs font-mono text-gray-500 uppercase">Total</th>
                        <th className="text-right px-5 py-3 text-xs font-mono text-gray-500 uppercase">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSources.slice(0, 10).map(([source, data]) => (
                        <tr key={source} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-5 py-3 text-sm text-gray-700">{source}</td>
                          <td className="px-5 py-3 text-sm text-right font-mono text-gray-500">{data.count}</td>
                          <td className="px-5 py-3 text-sm text-right font-mono text-[#0A0A0A] font-medium">{formatDollars(data.total)}</td>
                          <td className="px-5 py-3 text-sm text-right font-mono text-gray-400">{pct(data.total, totalFunding)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sortedSources.length > 10 && (
                    <div className="px-5 py-3 text-xs text-gray-400 text-center border-t border-gray-100 font-mono">
                      + {sortedSources.length - 10} more sources
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Per-org funding table */}
            {organizations.length > 0 && (
              <div>
                <h3 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-3">By Organisation</h3>
                <div className="bg-white/80 rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs font-mono text-gray-500 uppercase">Organisation</th>
                        <th className="text-center px-5 py-3 text-xs font-mono text-gray-500 uppercase">Programs</th>
                        <th className="text-right px-5 py-3 text-xs font-mono text-gray-500 uppercase">Funding</th>
                        <th className="text-center px-5 py-3 text-xs font-mono text-gray-500 uppercase">Indigenous</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedOrgs
                        .filter(o => orgFundingMap.has(o.id) || orgProgramMap.has(o.id))
                        .map(org => (
                          <tr key={org.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="px-5 py-3 text-sm">
                              {org.slug ? (
                                <Link href={`/for-funders/org/${org.slug}`} className="text-[#0A0A0A] hover:underline font-medium">
                                  {org.name}
                                </Link>
                              ) : (
                                <span className="text-gray-700">{org.name}</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-center">
                              {(orgProgramMap.get(org.id) || 0) > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs text-[#059669] font-medium font-mono">
                                  <BarChart3 className="w-3 h-3" /> {orgProgramMap.get(org.id)}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-300 font-mono">0</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-right font-mono text-sm">
                              {(orgFundingMap.get(org.id) || 0) > 0
                                ? formatDollars(orgFundingMap.get(org.id)!)
                                : <span className="text-gray-300">\u2014</span>
                              }
                            </td>
                            <td className="px-5 py-3 text-center">
                              {org.is_indigenous_org ? (
                                <span className="inline-flex items-center gap-1 text-xs text-purple-600">
                                  <Shield className="w-3 h-3" /> Yes
                                </span>
                              ) : (
                                <span className="text-xs text-gray-300">\u2014</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Unlinked funding */}
            {unlinkedFunding.length > 0 && (
              <div className="mt-6 bg-[#DC2626]/5 border border-[#DC2626]/20 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                  <h3 className="font-semibold text-[#0A0A0A] text-sm">Unlinked Funding Records</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {unlinkedFunding.length} funding records ({formatDollars(totalUnlinkedFunding)}) mention this region but are not linked to any organisation in our database.
                </p>
                <div className="space-y-1">
                  {unlinkedFunding.slice(0, 5).map((f: any) => (
                    <div key={f.id} className="flex items-center justify-between text-xs font-mono text-gray-500">
                      <span className="truncate max-w-[60%]">{f.recipient_name || f.source}</span>
                      <span>{f.amount_dollars ? formatDollars(f.amount_dollars) : '\u2014'}</span>
                    </div>
                  ))}
                  {unlinkedFunding.length > 5 && (
                    <p className="text-xs text-gray-400 font-mono">+ {unlinkedFunding.length - 5} more</p>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── SECTION 6: Data Gaps & Opportunities ── */}
        {(orgsWithFundingNoPrograms.length > 0 || orgsNoClassification.length > 0 || unlinkedFunding.length > 0 || programsNoEvidence.length > 0) && (
          <section>
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Data Gaps & Opportunities
            </h2>
            <p className="text-sm text-gray-500 mb-6 font-mono">
              Where the evidence is thin \u2014 and where community intelligence can fill it
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {orgsWithFundingNoPrograms.length > 0 && (
                <div className="bg-white/80 rounded-lg p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-amber-500" />
                    <h3 className="font-semibold text-[#0A0A0A] text-sm">Funded but No Programs Mapped</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 font-mono">{orgsWithFundingNoPrograms.length} organisations</p>
                  <div className="space-y-1.5">
                    {orgsWithFundingNoPrograms.slice(0, 5).map(org => (
                      <div key={org.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 truncate max-w-[70%]">{org.name}</span>
                        <span className="text-xs font-mono text-gray-400">{formatDollars(orgFundingMap.get(org.id) || 0)}</span>
                      </div>
                    ))}
                    {orgsWithFundingNoPrograms.length > 5 && (
                      <p className="text-xs text-gray-400 font-mono">+ {orgsWithFundingNoPrograms.length - 5} more</p>
                    )}
                  </div>
                </div>
              )}

              {programsNoEvidence.length > 0 && (
                <div className="bg-white/80 rounded-lg p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <HelpCircle className="w-4 h-4 text-amber-500" />
                    <h3 className="font-semibold text-[#0A0A0A] text-sm">Programs with No Evidence</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 font-mono">{programsNoEvidence.length} of {interventions.length} programs</p>
                  <div className="space-y-1.5">
                    {programsNoEvidence.slice(0, 5).map((prog: any) => (
                      <div key={prog.id} className="text-sm text-gray-700 truncate">
                        {prog.name}
                      </div>
                    ))}
                    {programsNoEvidence.length > 5 && (
                      <p className="text-xs text-gray-400 font-mono">+ {programsNoEvidence.length - 5} more</p>
                    )}
                  </div>
                </div>
              )}

              {orgsNoClassification.length > 0 && (
                <div className="bg-white/80 rounded-lg p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <h3 className="font-semibold text-[#0A0A0A] text-sm">No Community Control Classification</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 font-mono">{orgsNoClassification.length} organisations</p>
                  <div className="space-y-1.5">
                    {orgsNoClassification.slice(0, 5).map(org => (
                      <div key={org.id} className="text-sm text-gray-700 truncate">
                        {org.name}
                      </div>
                    ))}
                    {orgsNoClassification.length > 5 && (
                      <p className="text-xs text-gray-400 font-mono">+ {orgsNoClassification.length - 5} more</p>
                    )}
                  </div>
                </div>
              )}

              {unlinkedFunding.length > 0 && (
                <div className="bg-white/80 rounded-lg p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                    <h3 className="font-semibold text-[#0A0A0A] text-sm">Unlinked Funding</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 font-mono">
                    {unlinkedFunding.length} records | {formatDollars(totalUnlinkedFunding)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Funding records that mention this region but aren&apos;t connected to any organisation. Community input can help link these.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Sparse data message ── */}
        {organizations.length === 0 && interventions.length === 0 && (
          <section className="text-center py-16">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Building the Evidence Base
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              We&apos;re still mapping this region. If you know organisations or programs operating in {config.fullName},
              help us build the picture.
            </p>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="bg-[#0A0A0A] rounded-xl p-8 text-white text-center print:bg-gray-100 print:text-[#0A0A0A]">
          <h2 className="text-2xl font-bold mb-3 text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            This is {config.name}&apos;s community justice landscape
          </h2>
          <p className="text-white/60 mb-6 max-w-lg mx-auto print:text-gray-500">
            Every organisation, program, and dollar tracked here is part of a living evidence base
            \u2014 built by and for the community.
          </p>
          <div className="flex items-center justify-center gap-4 print:hidden">
            <Link
              href="/intelligence"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0A0A0A] rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Intelligence Hub <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/for-funders"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              <DollarSign className="w-4 h-4" /> Funder Hub
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="text-center text-xs text-gray-400 font-mono pb-8">
          <p>Data sourced from ALMA Network, AusTender, NIAA, ACNC, ORIC, state budgets, and community-verified records.</p>
          <p className="mt-1">
            Generated by <Link href="/" className="underline hover:text-gray-600">JusticeHub</Link> \u2014 Australia&apos;s community justice evidence platform.
          </p>
          <p className="mt-1 text-gray-300">
            Report generated {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </footer>
      </div>
    </div>
  );
}
