import { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft, DollarSign, Building2, Target, BarChart3,
  ExternalLink, AlertTriangle, Sparkles,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────

interface OrgProfile {
  organization: {
    id: string | null;
    name: string;
    slug: string | null;
    type: string | null;
    state: string | null;
    city: string | null;
    description: string | null;
  };
  funding: {
    total_dollars: number;
    grant_count: number;
    years_funded: number;
    by_year: Array<{ financial_year: string; dollars: number; grants: number; programs: string[] }> | null;
    by_sector: Array<{ sector: string; dollars: number; grants: number }> | null;
  };
  interventions: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    target_cohort: string[];
    geography: string[];
    portfolio_score: number;
    evidence_level: string;
    outcomes: Array<{
      type: string;
      description: string;
      measurement: string | null;
      beneficiary: string | null;
    }> | null;
    evidence_count: number;
  }> | null;
  is_indigenous: boolean;
  acnc?: {
    name: string;
    charity_size: string | null;
    pbi: boolean;
    hpc: boolean;
    registration_date: string | null;
    website: string | null;
    number_of_responsible_persons: number | null;
    date_established: string | null;
    operating_states: string[] | null;
    purpose_law_policy: boolean;
    purpose_reconciliation: boolean;
    purpose_social_welfare: boolean;
    purpose_human_rights: boolean;
    ben_aboriginal_tsi: boolean;
    ben_youth: boolean;
    ben_children: boolean;
    ben_pre_post_release: boolean;
    ben_victims_of_crime: boolean;
    ben_people_at_risk_of_homelessness: boolean;
  };
  financials?: {
    ais_year: number;
    total_revenue: number | null;
    total_expenses: number | null;
    net_assets_liabilities: number | null;
    total_assets: number | null;
    total_liabilities: number | null;
    staff_fte: number | null;
    staff_volunteers: number | null;
    revenue_from_government: number | null;
    employee_expenses: number | null;
  };
  recipient_abn?: string;
  tender_count?: number;
}

// ── Helpers ────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null) return '$0';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function sectorLabel(s: string): string {
  return s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || s;
}

// ── Data Fetching ──────────────────────────────────────────

async function fetchProfile(abn: string): Promise<OrgProfile | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3004';
  const res = await fetch(`${baseUrl}/api/justice-funding?view=org_profile&abn=${abn}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}

// ── Metadata ───────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ abn: string }> }
): Promise<Metadata> {
  const { abn } = await params;
  const profile = await fetchProfile(abn);
  if (!profile) {
    return { title: 'Organisation Not Found | JusticeHub' };
  }
  const name = profile.organization.name;
  const total = fmt(profile.funding.total_dollars);
  return {
    title: `${name} — Justice Funding Profile | JusticeHub`,
    description: `${name} received ${total} in QLD justice funding across ${profile.funding.grant_count} grants over ${profile.funding.years_funded} years. View full transparency profile.`,
    openGraph: {
      title: `${name} — ${total} in Justice Funding`,
      description: `Transparency profile: ${profile.funding.grant_count} grants, ${profile.funding.years_funded} years funded. ${profile.interventions?.length || 0} documented interventions.`,
    },
  };
}

// ── Page Component ─────────────────────────────────────────

export default async function OrgProfilePage(
  { params }: { params: Promise<{ abn: string }> }
) {
  const { abn } = await params;
  const profile = await fetchProfile(abn);

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">Organisation Not Found</h1>
          <p className="text-gray-600 mb-8">No funding records found for ABN {abn}</p>
          <Link href="/justice-funding?tab=organizations" className="cta-primary">
            VIEW ALL ORGANISATIONS
          </Link>
        </div>
      </div>
    );
  }

  const org = profile.organization;
  const funding = profile.funding;
  const interventions = profile.interventions || [];
  const totalOutcomes = interventions.reduce((n, i) => n + (i.outcomes?.length || 0), 0);
  const totalEvidence = interventions.reduce((n, i) => n + i.evidence_count, 0);
  const maxYearDollars = Math.max(...(funding.by_year || []).map(y => y.dollars || 0), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`${profile.is_indigenous ? 'bg-amber-900' : 'bg-gray-900'} text-white`}>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link
            href="/justice-funding?tab=organizations"
            className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all organisations
          </Link>
          <h1 className="text-3xl font-black">{org.name}</h1>
          {org.description && <p className="text-white/70 mt-2">{org.description}</p>}
          <div className="flex flex-wrap gap-3 mt-3 text-sm">
            {org.city && <span className="text-white/60">{org.city}, {org.state}</span>}
            {profile.is_indigenous && (
              <span className="px-2 py-0.5 bg-amber-500/30 text-amber-200 text-xs font-bold">
                Indigenous-led
              </span>
            )}
            {profile.recipient_abn && (
              <span className="text-white/40">ABN: {profile.recipient_abn}</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* ── MONEY LEDGER ── */}
        <section className="bg-white border-2 border-black p-6">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4 text-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
            Money Ledger
            <span className="text-sm font-normal text-gray-500">— public funding received</span>
          </h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{fmt(funding.total_dollars)}</div>
              <div className="text-xs text-gray-500">Total received</div>
            </div>
            <div className="bg-gray-50 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{funding.grant_count}</div>
              <div className="text-xs text-gray-500">Grants</div>
            </div>
            <div className="bg-gray-50 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{funding.years_funded}</div>
              <div className="text-xs text-gray-500">Years funded</div>
            </div>
          </div>

          {/* Funding by year chart */}
          {funding.by_year && funding.by_year.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Funding Timeline</h3>
              {funding.by_year.map(y => (
                <div key={y.financial_year} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-14 flex-shrink-0">{y.financial_year}</span>
                  <div className="flex-1 h-5 bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full ${profile.is_indigenous ? 'bg-amber-500' : 'bg-gray-800'} transition-all`}
                      style={{ width: `${((y.dollars || 0) / maxYearDollars) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-16 text-right flex-shrink-0">
                    {y.dollars ? fmt(y.dollars) : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Sectors */}
          {funding.by_sector && (
            <div className="mt-4 flex flex-wrap gap-2">
              {funding.by_sector.map(s => (
                <span key={s.sector} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs">
                  {sectorLabel(s.sector)}: {fmt(s.dollars)}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ── GOVERNANCE (ACNC) ── */}
        {profile.acnc && (
          <section className="bg-white border-2 border-black p-6">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4 text-lg">
              <Building2 className="w-5 h-5 text-teal-600" />
              Governance
              <span className="text-sm font-normal text-gray-500">— ACNC registered charity</span>
            </h2>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {profile.acnc.charity_size && (
                  <span className={`px-2 py-1 text-xs font-bold ${
                    profile.acnc.charity_size === 'Large' ? 'bg-blue-100 text-blue-800' :
                    profile.acnc.charity_size === 'Medium' ? 'bg-sky-100 text-sky-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {profile.acnc.charity_size} Charity
                  </span>
                )}
                {profile.acnc.pbi && (
                  <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-800">PBI</span>
                )}
                {profile.acnc.hpc && (
                  <span className="px-2 py-1 text-xs font-bold bg-emerald-100 text-emerald-800">HPC</span>
                )}
                {profile.acnc.number_of_responsible_persons != null && profile.acnc.number_of_responsible_persons > 0 && (
                  <span className="px-2 py-1 text-xs font-bold bg-gray-100 text-gray-700">
                    Board: {profile.acnc.number_of_responsible_persons}
                  </span>
                )}
              </div>

              {/* Purposes */}
              <div className="flex flex-wrap gap-1.5">
                {profile.acnc.purpose_law_policy && (
                  <span className="px-2 py-0.5 text-[10px] bg-purple-50 text-purple-700">Law &amp; Policy</span>
                )}
                {profile.acnc.purpose_reconciliation && (
                  <span className="px-2 py-0.5 text-[10px] bg-amber-50 text-amber-700">Reconciliation</span>
                )}
                {profile.acnc.purpose_social_welfare && (
                  <span className="px-2 py-0.5 text-[10px] bg-blue-50 text-blue-700">Social Welfare</span>
                )}
                {profile.acnc.purpose_human_rights && (
                  <span className="px-2 py-0.5 text-[10px] bg-rose-50 text-rose-700">Human Rights</span>
                )}
              </div>

              {/* Beneficiaries */}
              <div className="flex flex-wrap gap-1.5">
                {profile.acnc.ben_aboriginal_tsi && (
                  <span className="px-2 py-0.5 text-[10px] bg-amber-100 text-amber-800">First Nations</span>
                )}
                {profile.acnc.ben_youth && (
                  <span className="px-2 py-0.5 text-[10px] bg-orange-100 text-orange-800">Youth</span>
                )}
                {profile.acnc.ben_children && (
                  <span className="px-2 py-0.5 text-[10px] bg-pink-100 text-pink-800">Children</span>
                )}
                {profile.acnc.ben_pre_post_release && (
                  <span className="px-2 py-0.5 text-[10px] bg-red-100 text-red-800">Pre/Post Release</span>
                )}
                {profile.acnc.ben_victims_of_crime && (
                  <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-800">Victims of Crime</span>
                )}
                {profile.acnc.ben_people_at_risk_of_homelessness && (
                  <span className="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-800">Homelessness Risk</span>
                )}
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                {profile.acnc.date_established && (
                  <span>Est. {new Date(profile.acnc.date_established).getFullYear()}</span>
                )}
                {profile.acnc.registration_date && (
                  <span>Registered: {new Date(profile.acnc.registration_date).getFullYear()}</span>
                )}
                {profile.acnc.website && (
                  <a href={profile.acnc.website.startsWith('http') ? profile.acnc.website : `https://${profile.acnc.website}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-teal-600 hover:text-teal-800 flex items-center gap-1">
                    Website <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Operating states */}
              {profile.acnc.operating_states && profile.acnc.operating_states.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-xs text-gray-500 mr-1">Operates in:</span>
                  {profile.acnc.operating_states.map(s => (
                    <span key={s} className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── FINANCIAL HEALTH ── */}
        {profile.financials && (
          <section className="bg-white border-2 border-black p-6">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4 text-lg">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Financial Health
              <span className="text-sm font-normal text-gray-500">— FY{profile.financials.ais_year} annual report</span>
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {profile.financials.total_revenue != null && (
                <div className="bg-green-50 p-4 text-center">
                  <div className="text-xl font-bold text-green-800">{fmt(profile.financials.total_revenue)}</div>
                  <div className="text-xs text-green-600 font-medium">Revenue</div>
                </div>
              )}
              {profile.financials.total_expenses != null && (
                <div className="bg-red-50 p-4 text-center">
                  <div className="text-xl font-bold text-red-800">{fmt(profile.financials.total_expenses)}</div>
                  <div className="text-xs text-red-600 font-medium">Expenses</div>
                </div>
              )}
              {profile.financials.net_assets_liabilities != null && (
                <div className="bg-blue-50 p-4 text-center">
                  <div className="text-xl font-bold text-blue-800">{fmt(profile.financials.net_assets_liabilities)}</div>
                  <div className="text-xs text-blue-600 font-medium">Net Assets</div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {profile.financials.revenue_from_government != null && profile.financials.total_revenue != null && profile.financials.total_revenue > 0 && (
                <div className="text-center">
                  <div className="font-bold text-gray-900">
                    {((profile.financials.revenue_from_government / profile.financials.total_revenue) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500">Govt Revenue</div>
                </div>
              )}
              {profile.financials.staff_fte != null && profile.financials.staff_fte > 0 && (
                <div className="text-center">
                  <div className="font-bold text-gray-900">{profile.financials.staff_fte.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">FTE Staff</div>
                </div>
              )}
              {profile.financials.staff_volunteers != null && profile.financials.staff_volunteers > 0 && (
                <div className="text-center">
                  <div className="font-bold text-gray-900">{profile.financials.staff_volunteers.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Volunteers</div>
                </div>
              )}
              {profile.financials.total_assets != null && (
                <div className="text-center">
                  <div className="font-bold text-gray-900">{fmt(profile.financials.total_assets)}</div>
                  <div className="text-xs text-gray-500">Total Assets</div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── IMPACT LEDGER ── */}
        {interventions.length > 0 && (
          <section className="bg-white border-2 border-black p-6">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4 text-lg">
              <Target className="w-5 h-5 text-blue-600" />
              Impact Ledger
              <span className="text-sm font-normal text-gray-500">
                — {interventions.length} intervention{interventions.length !== 1 ? 's' : ''}, {totalOutcomes} outcomes, {totalEvidence} evidence items
              </span>
            </h2>

            <div className="space-y-4">
              {interventions.map(intervention => (
                <div key={intervention.id} className="border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-gray-900">{intervention.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {intervention.type} &bull; {intervention.geography?.join(', ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {intervention.portfolio_score != null && intervention.portfolio_score > 0 && (
                          <div className="text-center">
                            <div className="text-sm font-bold text-gray-900">
                              {(intervention.portfolio_score * 100).toFixed(0)}
                            </div>
                            <div className="text-[9px] text-gray-500 uppercase">Score</div>
                          </div>
                        )}
                        {intervention.evidence_level && (
                          <span className={`px-2 py-0.5 text-[10px] font-bold ${
                            intervention.evidence_level.startsWith('Effective')
                              ? 'bg-green-100 text-green-800'
                              : intervention.evidence_level.startsWith('Promising')
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {intervention.evidence_level.split(' (')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    {intervention.description && (
                      <p className="text-sm text-gray-600 mt-2">{intervention.description}</p>
                    )}
                  </div>

                  {intervention.outcomes && intervention.outcomes.length > 0 && (
                    <div className="px-4 py-3 space-y-2">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> What changed
                      </div>
                      {intervention.outcomes.slice(0, 5).map((outcome, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                            outcome.type?.includes('Reduced') ? 'bg-green-500' :
                            outcome.type?.includes('Educational') ? 'bg-blue-500' :
                            outcome.type?.includes('Mental') ? 'bg-purple-500' :
                            outcome.type?.includes('Family') ? 'bg-pink-500' :
                            outcome.type?.includes('Employment') ? 'bg-orange-500' :
                            'bg-gray-400'
                          }`} />
                          <div>
                            <span className="text-gray-900">{outcome.description}</span>
                            {outcome.beneficiary && (
                              <span className="text-gray-400 text-xs ml-1">({outcome.beneficiary})</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {intervention.outcomes.length > 5 && (
                        <div className="text-xs text-gray-400">
                          +{intervention.outcomes.length - 5} more outcomes
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── ACCOUNTABILITY GAP ── */}
        {interventions.length === 0 && funding.grant_count > 0 && (
          <section className="bg-red-50 border-2 border-red-300 p-6">
            <h2 className="font-bold text-red-900 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" />
              Accountability Gap
            </h2>
            <p className="text-sm text-red-800">
              This organisation received {fmt(funding.total_dollars)} across {funding.years_funded} years,
              but we have <strong>no documented interventions or outcomes</strong> in our evidence base.
              What did this funding achieve? Who benefited?
            </p>
          </section>
        )}

        {interventions.length > 0 && totalOutcomes === 0 && (
          <section className="bg-amber-50 border-2 border-amber-300 p-6">
            <h2 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" />
              Outcome Gap
            </h2>
            <p className="text-sm text-amber-800">
              This organisation runs {interventions.length} documented intervention{interventions.length !== 1 ? 's' : ''} and
              received {fmt(funding.total_dollars)}, but we have <strong>no recorded outcomes</strong>.
              Are these programs being evaluated? What results are they producing?
            </p>
          </section>
        )}

        {/* ── PROVENANCE ── */}
        <section className="text-xs text-gray-400 border-t border-gray-200 pt-4">
          <div className="font-medium text-gray-500 mb-1">Provenance</div>
          <div>Funding data: Queensland Government Investment Portal (QGIP), Brisbane City Council, Ministerial Statements</div>
          <div>Intervention data: ALMA Evidence Engine (community-endorsed + AI-assisted extraction)</div>
          {profile.acnc && <div>Charity data: Australian Charities and Not-for-profits Commission (ACNC)</div>}
          {profile.financials && <div>Financial data: ACNC Annual Information Statement (AIS) FY{profile.financials.ais_year}</div>}
        </section>
      </div>
    </div>
  );
}
