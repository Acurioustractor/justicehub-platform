import { createServiceClient } from '@/lib/supabase/service-lite';
import Link from 'next/link';
import {
  STAGES,
  classifyItemsToStages,
  formatCurrency,
  type StageKey,
} from './stage-mapper';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export const metadata = {
  title: 'Journey Map — North Queensland Youth Justice | JusticeHub',
  description:
    "Follow a young person's path through the youth justice system in Mount Isa, Townsville, and Palm Island. Real voices, real data, real programs.",
};

// ── NQ location matching ──────────────────────────────────────────

const NQ_LOCATIONS = ['mount isa', 'townsville', 'palm island', 'cairns', 'thursday island'];

function isNqRelated(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return NQ_LOCATIONS.some(loc => lower.includes(loc));
}

// ── Voice quotes (hardcoded from real NQ transcripts) ─────────────

type VoiceQuote = {
  quote: string;
  name: string;
  location: string;
  role: string;
};

const STAGE_QUOTES: Record<StageKey, VoiceQuote> = {
  child_protection: {
    quote: "I got into working in the child protection space... working with young kids. It made me feel real deadly, because I was one of them kids, you know, a young person that may have had some troubles and doesn't know the right path.",
    name: 'Brodie Germaine',
    location: 'Mount Isa',
    role: 'Founder, BG Fit',
  },
  education: {
    quote: "The only way you're going to find out who these kids are is engage with them when they're young and in school. I'm saying about four or five hundred kids a week. Police have got to go into school, trying to keep those kids in school, not on the street.",
    name: 'Uncle George Leon',
    location: 'Mount Isa',
    role: 'Kalkadoon Elder',
  },
  first_contact: {
    quote: "We've got a lot of kids walking down the street right now, in the day, and there's not one person, no agency, no one, pulling up, talking to these kids and asking why they're not at school. And that's what I used to do.",
    name: 'Uncle George Leon',
    location: 'Mount Isa',
    role: 'Kalkadoon Elder',
  },
  bail_courts: {
    quote: "Growing up, a lot of my family in and out of jail, a lot of my aunties and uncles in and out of jail. I nearly did some time myself. All my uncles I idolised, they were gangsters. I wanted to be like them.",
    name: 'Brodie Germaine',
    location: 'Mount Isa',
    role: 'Founder, BG Fit',
  },
  detention: {
    quote: "I work with disengaged kids or kids who not going to school. We got kids in and outta Cleveland and we help them with community service and other programs, like getting their license when they become of that age.",
    name: 'Henry Doyle',
    location: 'Palm Island',
    role: 'Youth Services Worker',
  },
  post_detention: {
    quote: "The hardship and the struggles and the choices that I've made has made me who I am today. I sit here with a lot of regret, but I don't, because it's what's shaped me.",
    name: 'Brodie Germaine',
    location: 'Mount Isa',
    role: 'Founder, BG Fit',
  },
  employment_healing: {
    quote: "I moved back to my community because I want to give back and that's something I thrive by. From 5.30 to 7.30, I work on my business. 8.30 to 4.30, I work full-time at the AMS. Then 5.30 to 7.30, I'm back in the gym.",
    name: 'Brodie Germaine',
    location: 'Mount Isa',
    role: 'Founder, BG Fit',
  },
};

// ── Types ─────────────────────────────────────────────────────────

type Intervention = {
  id: string;
  name: string;
  evidence_level: string | null;
  cost_per_young_person: number | null;
  org_name: string | null;
  org_state: string | null;
};

type FundingRecord = {
  id: string;
  program_name: string | null;
  recipient_name: string | null;
  amount_dollars: number | null;
  financial_year: string | null;
  source: string | null;
};

type TenderRecord = {
  id: string;
  title: string;
  supplier_name: string | null;
  contract_value: number | null;
  status: string | null;
  awarded_date: string | null;
};

type Commitment = {
  id: string;
  minister_name: string;
  commitment_text: string;
  status: string;
  category: string;
};

// ── Page ──────────────────────────────────────────────────────────

export default async function JourneyMapPage() {
  const supabase = createServiceClient();

  // Fetch all data in parallel
  const [interventionsRes, fundingRes, tendersRes, commitmentsRes] = await Promise.all([
    // NQ interventions — join with organizations to get location
    supabase
      .from('alma_interventions')
      .select('id, name, evidence_level, cost_per_young_person, organizations!alma_interventions_operating_organization_id_fkey(name, state)')
      .neq('verification_status', 'ai_generated')
      .not('operating_organization_id', 'is', null)
      .limit(500),

    // QLD justice funding
    supabase
      .from('justice_funding')
      .select('id, program_name, recipient_name, amount_dollars, financial_year, source')
      .eq('state', 'QLD')
      .order('amount_dollars', { ascending: false })
      .limit(500),

    // QLD state tenders
    supabase
      .from('state_tenders')
      .select('id, title, supplier_name, contract_value, status, awarded_date')
      .eq('state', 'QLD')
      .eq('is_justice_related', true)
      .order('contract_value', { ascending: false })
      .limit(200),

    // Charter commitments
    supabase
      .from('civic_charter_commitments')
      .select('id, minister_name, commitment_text, status, category')
      .eq('youth_justice_relevant', true)
      .order('minister_name'),
  ]);

  // Process interventions — filter for NQ orgs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawInterventions = (interventionsRes.data || []) as any[];

  const nqInterventions: Intervention[] = rawInterventions
    .filter(i => {
      const org = Array.isArray(i.organizations) ? i.organizations[0] : i.organizations;
      const orgName = org?.name || '';
      const orgState = org?.state || '';
      return (orgState === 'QLD' && isNqRelated(orgName)) || isNqRelated(i.name);
    })
    .map(i => {
      const org = Array.isArray(i.organizations) ? i.organizations[0] : i.organizations;
      return {
        id: i.id,
        name: i.name,
        evidence_level: i.evidence_level,
        cost_per_young_person: i.cost_per_young_person,
        org_name: org?.name || null,
        org_state: org?.state || null,
      };
    });

  // Process funding — filter for NQ recipients
  const allFunding = (fundingRes.data || []) as FundingRecord[];
  const nqFunding = allFunding.filter(f =>
    isNqRelated(f.recipient_name) || isNqRelated(f.program_name)
  );

  // Process tenders — filter for NQ suppliers
  const allTenders = (tendersRes.data || []) as TenderRecord[];
  const nqTenders = allTenders.filter(t =>
    isNqRelated(t.supplier_name) || isNqRelated(t.title)
  );

  // Commitments (all are state-wide, classify by text)
  const commitments = (commitmentsRes.data || []) as Commitment[];

  // Classify all data into stages
  const interventionsByStage = classifyItemsToStages(nqInterventions, i => `${i.name} ${i.org_name || ''}`);
  const fundingByStage = classifyItemsToStages(nqFunding, f => `${f.program_name || ''} ${f.recipient_name || ''}`);
  const tendersByStage = classifyItemsToStages(nqTenders, t => `${t.title} ${t.supplier_name || ''}`);
  const commitmentsByStage = classifyItemsToStages(commitments, c => `${c.commitment_text} ${c.category}`);

  // Aggregate stats
  const totalNqPrograms = nqInterventions.length;
  const totalNqFunding = nqFunding.reduce((sum, f) => sum + (f.amount_dollars || 0), 0);
  const totalNqTenderValue = nqTenders.reduce((sum, t) => sum + (t.contract_value || 0), 0);
  const totalCommitments = commitments.length;

  // Collect unique NQ orgs
  const nqOrgs = new Set<string>();
  nqInterventions.forEach(i => { if (i.org_name) nqOrgs.add(i.org_name); });
  nqFunding.forEach(f => { if (f.recipient_name && isNqRelated(f.recipient_name)) nqOrgs.add(f.recipient_name); });

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Hero */}
      <section className="bg-[#0A0A0A] text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm font-mono text-[#DC2626] tracking-widest uppercase mb-4">
            North Queensland / Mount Isa &middot; Townsville &middot; Palm Island
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Youth Justice Journey Map
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl">
            Following a young person&apos;s path through the system in North Queensland.
            Real voices, real data, real programs &mdash; from child protection to healing.
          </p>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <StatCard label="NQ Programs" value={totalNqPrograms} />
            <StatCard label="Funding Tracked" value={formatCurrency(totalNqFunding + totalNqTenderValue)} />
            <StatCard label="NQ Voices" value={new Set(Object.values(STAGE_QUOTES).map(q => q.name)).size} />
            <StatCard label="Commitments" value={totalCommitments} />
          </div>

          <div className="flex gap-4 mt-6">
            <Link
              href="/civic/qld-youth-justice"
              className="text-sm font-mono text-[#DC2626] hover:text-white transition-colors"
            >
              View CivicScope dashboard &rarr;
            </Link>
            <Link
              href="/community-map"
              className="text-sm font-mono text-gray-400 hover:text-white transition-colors"
            >
              Community map &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Journey stages */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="relative">
          {/* Connecting vertical line */}
          <div
            className="absolute left-6 top-0 bottom-0 w-px bg-gray-300 hidden md:block"
            style={{ marginLeft: '1px' }}
          />

          <div className="space-y-0">
            {STAGES.map((stage, idx) => {
              const quote = STAGE_QUOTES[stage.key];
              const programs = interventionsByStage[stage.key];
              const funding = fundingByStage[stage.key];
              const tenders = tendersByStage[stage.key];
              const stageCommitments = commitmentsByStage[stage.key];

              const stageFundingTotal = funding.reduce((sum, f) => sum + (f.amount_dollars || 0), 0);
              const stageTenderTotal = tenders.reduce((sum, t) => sum + (t.contract_value || 0), 0);

              // Collect unique orgs for this stage
              const stageOrgs = new Set<string>();
              programs.forEach(p => { if (p.org_name) stageOrgs.add(p.org_name); });
              funding.forEach(f => { if (f.recipient_name) stageOrgs.add(f.recipient_name); });

              const isLast = idx === STAGES.length - 1;
              const isEven = idx % 2 === 0;

              return (
                <div key={stage.key} className="relative">
                  {/* Stage marker on the line */}
                  <div className="hidden md:flex absolute left-0 top-8 w-[52px] items-center justify-center z-10">
                    <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-lg font-bold ${
                      isEven ? 'bg-[#0A0A0A] text-white' : 'bg-[#DC2626] text-white'
                    }`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {stage.number}
                    </div>
                  </div>

                  {/* Stage content */}
                  <div className={`md:ml-20 mb-8 ${!isLast ? 'pb-8 border-b border-gray-200' : ''}`}>
                    {/* Stage header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`md:hidden w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        isEven ? 'bg-[#0A0A0A] text-white' : 'bg-[#DC2626] text-white'
                      }`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {stage.number}
                      </div>
                      <div>
                        <h2
                          className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {stage.title}
                        </h2>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-6 md:ml-0">{stage.description}</p>

                    {/* Voice quote */}
                    <div className={`rounded-lg p-5 mb-6 ${isEven ? 'bg-[#0A0A0A]' : 'bg-gray-800'}`}>
                      <blockquote className="text-base md:text-lg text-gray-200 italic leading-relaxed">
                        &ldquo;{quote.quote}&rdquo;
                      </blockquote>
                      <p className="text-sm text-gray-400 mt-3 font-mono">
                        &mdash; {quote.name}, {quote.location}
                        <br />
                        <span className="text-gray-500">{quote.role}</span>
                      </p>
                    </div>

                    {/* Data grid */}
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      {/* Programs */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">
                          Programs ({programs.length})
                        </h3>
                        {programs.length > 0 ? (
                          <ul className="space-y-2">
                            {programs.slice(0, 5).map(p => (
                              <li key={p.id} className="text-sm text-[#0A0A0A]">
                                <span className="font-medium">{p.name}</span>
                                {p.evidence_level && (
                                  <span className="block">
                                    <EvidenceBadge level={p.evidence_level} />
                                  </span>
                                )}
                              </li>
                            ))}
                            {programs.length > 5 && (
                              <li className="text-xs font-mono text-gray-400">
                                +{programs.length - 5} more
                              </li>
                            )}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No NQ-specific programs tracked yet</p>
                        )}
                      </div>

                      {/* Funding */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">
                          Funding
                        </h3>
                        {(stageFundingTotal > 0 || stageTenderTotal > 0) ? (
                          <div className="space-y-2">
                            {stageFundingTotal > 0 && (
                              <div>
                                <p className="text-xl font-bold text-[#059669]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                  {formatCurrency(stageFundingTotal)}
                                </p>
                                <p className="text-xs font-mono text-gray-400">
                                  {funding.length} grant{funding.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            )}
                            {stageTenderTotal > 0 && (
                              <div>
                                <p className="text-lg font-bold text-[#059669]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                  {formatCurrency(stageTenderTotal)}
                                </p>
                                <p className="text-xs font-mono text-gray-400">
                                  {tenders.length} contract{tenders.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No NQ-specific funding tracked</p>
                        )}
                      </div>

                      {/* Key Orgs */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">
                          Key Organisations ({stageOrgs.size})
                        </h3>
                        {stageOrgs.size > 0 ? (
                          <ul className="space-y-1">
                            {Array.from(stageOrgs).slice(0, 5).map(org => (
                              <li key={org} className="text-sm text-[#0A0A0A]">{org}</li>
                            ))}
                            {stageOrgs.size > 5 && (
                              <li className="text-xs font-mono text-gray-400">
                                +{stageOrgs.size - 5} more
                              </li>
                            )}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No NQ organisations mapped yet</p>
                        )}
                      </div>
                    </div>

                    {/* Commitments */}
                    {stageCommitments.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-2">
                          Minister Commitments
                        </h3>
                        <div className="space-y-2">
                          {stageCommitments.slice(0, 3).map(c => (
                            <div
                              key={c.id}
                              className={`flex items-start gap-3 p-3 border rounded-lg ${
                                c.status === 'delivered' ? 'bg-emerald-50 border-emerald-200'
                                : c.status === 'in_progress' ? 'bg-amber-50 border-amber-200'
                                : 'bg-white border-gray-200'
                              }`}
                            >
                              <StatusBadge status={c.status} />
                              <div className="flex-1">
                                <p className="text-sm text-[#0A0A0A]">{c.commitment_text}</p>
                                <p className="text-xs font-mono text-gray-400 mt-1">{c.minister_name}</p>
                              </div>
                            </div>
                          ))}
                          {stageCommitments.length > 3 && (
                            <p className="text-xs font-mono text-gray-400 pl-3">
                              +{stageCommitments.length - 3} more commitments
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Connector arrow (between stages) */}
                  {!isLast && (
                    <div className="hidden md:flex absolute left-0 bottom-0 w-[52px] items-center justify-center">
                      <div className="w-px h-8 bg-gray-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <section className="border-t border-gray-300 bg-[#0A0A0A] text-white py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-xl font-bold text-white mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            About this page
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            This journey map follows the path a young person in North Queensland may travel through
            the youth justice system. Voice quotes are from real community members recorded through
            the Empathy Ledger project. Data is sourced from ALMA evidence library, QLD government
            funding records, AusTender, and CivicScope ministerial tracking.
          </p>
          <p className="text-xs font-mono text-gray-600">
            NQ organisations tracked: {nqOrgs.size} &middot;
            Programs: {totalNqPrograms} &middot;
            Funding: {formatCurrency(totalNqFunding)} (grants) + {formatCurrency(totalNqTenderValue)} (contracts) &middot;
            Commitments: {totalCommitments}
          </p>
          <div className="flex gap-4 mt-4">
            <Link
              href="/civic/qld-youth-justice"
              className="text-sm font-mono text-[#DC2626] hover:text-white transition-colors"
            >
              CivicScope &rarr;
            </Link>
            <Link
              href="/community-map"
              className="text-sm font-mono text-gray-400 hover:text-white transition-colors"
            >
              Community Map &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Components ────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-4">
      <p
        className="text-2xl font-bold text-white"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {value}
      </p>
      <p className="text-sm text-gray-300">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    not_started: 'bg-gray-200 text-gray-600',
    in_progress: 'bg-amber-100 text-amber-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    broken: 'bg-red-100 text-red-700',
  };

  const labels: Record<string, string> = {
    not_started: 'Pending',
    in_progress: 'In Progress',
    delivered: 'Delivered',
    broken: 'Broken',
  };

  return (
    <span className={`text-xs font-mono px-2 py-1 rounded shrink-0 ${styles[status] || styles.not_started}`}>
      {labels[status] || 'Pending'}
    </span>
  );
}

function EvidenceBadge({ level }: { level: string }) {
  const color = level.startsWith('Proven')
    ? 'text-emerald-700 bg-emerald-100'
    : level.startsWith('Effective')
    ? 'text-blue-700 bg-blue-100'
    : level.startsWith('Promising')
    ? 'text-amber-700 bg-amber-100'
    : level.startsWith('Indigenous')
    ? 'text-purple-700 bg-purple-100'
    : 'text-gray-600 bg-gray-100';

  const short = level.split('(')[0].trim();

  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded ${color}`}>
      {short}
    </span>
  );
}
