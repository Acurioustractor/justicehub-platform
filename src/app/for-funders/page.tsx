import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  TrendingUp, Shield, Users, BarChart3, DollarSign,
  ArrowRight, CheckCircle, AlertTriangle, MapPin, ExternalLink,
  Play, Target, Scale, LogOut, ChevronRight, Layers
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatDollars(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

const EVIDENCE_COLORS: Record<string, string> = {
  'Proven (RCT/quasi-experimental, replicated)': '#059669',
  'Effective (strong evaluation, positive outcomes)': '#15803d',
  'Promising (community-endorsed, emerging evidence)': '#f59e0b',
  'Indigenous-led (culturally grounded, community authority)': '#9333ea',
  'Untested (theory/pilot stage)': '#9ca3af',
};

const EVIDENCE_SHORT: Record<string, string> = {
  'Proven (RCT/quasi-experimental, replicated)': 'Proven',
  'Effective (strong evaluation, positive outcomes)': 'Effective',
  'Promising (community-endorsed, emerging evidence)': 'Promising',
  'Indigenous-led (culturally grounded, community authority)': 'Indigenous-led',
  'Untested (theory/pilot stage)': 'Untested',
};

interface FunderProfile {
  id: string;
  funder_slug: string;
  funder_name: string;
  short_name: string;
  source_tags: string[];
  config: Record<string, unknown>;
}

interface Recipient {
  name: string;
  slug: string | null;
  amount: number;
  isIndigenous: boolean;
  state: string | null;
  interventionCount: number;
  orgId: string | null;
}

async function getFunderDashboardData(profile: FunderProfile) {
  const supabase = createServiceClient();

  // Parallel fetch: funding records + all interventions
  const sb = supabase as any;
  const [fundingRes, interventionsRes] = await Promise.all([
    sb
      .from('justice_funding')
      .select('id, source, recipient_name, amount_dollars, alma_organization_id, organizations!justice_funding_alma_organization_id_fkey(name, slug, state, is_indigenous_org)')
      .or(profile.source_tags.map((s: string) => `source.eq.${s}`).join(','))
      .not('amount_dollars', 'is', null)
      .order('amount_dollars', { ascending: false }),
    sb
      .from('alma_interventions')
      .select('id, name, evidence_level, type, operating_organization_id')
      .neq('verification_status', 'ai_generated'),
  ]);

  const records: any[] = fundingRes.data || [];
  const allInterventions: any[] = interventionsRes.data || [];

  // Build recipient map
  const recipients = new Map<string, Recipient>();
  for (const r of records) {
    const org = r.organizations as any;
    if (!org) continue;
    const existing = recipients.get(org.name);
    if (existing) {
      existing.amount += r.amount_dollars || 0;
    } else {
      recipients.set(org.name, {
        name: org.name,
        slug: org.slug,
        amount: r.amount_dollars || 0,
        isIndigenous: org.is_indigenous_org || false,
        state: org.state,
        interventionCount: 0,
        orgId: r.alma_organization_id,
      });
    }
  }

  // Count interventions per org
  const orgIds = [...new Set(records.map(r => r.alma_organization_id).filter(Boolean))] as string[];
  for (const i of allInterventions) {
    if (i.operating_organization_id && orgIds.includes(i.operating_organization_id)) {
      for (const r of recipients.values()) {
        if (r.orgId === i.operating_organization_id) {
          r.interventionCount++;
          break;
        }
      }
    }
  }

  const recipientList = Array.from(recipients.values()).sort((a, b) => b.amount - a.amount);
  const totalFunding = recipientList.reduce((sum, r) => sum + r.amount, 0);
  const accoFunding = recipientList.filter(r => r.isIndigenous).reduce((sum, r) => sum + r.amount, 0);
  const accoPercent = totalFunding > 0 ? Math.round((accoFunding / totalFunding) * 100) : 0;
  const totalPrograms = recipientList.reduce((sum, r) => sum + r.interventionCount, 0);

  // Evidence breakdown for portfolio orgs
  const fundedOrgIds = new Set(orgIds);
  const portfolioInterventions = allInterventions.filter(i => fundedOrgIds.has(i.operating_organization_id));
  const evidenceCounts: Record<string, number> = {};
  for (const i of portfolioInterventions) {
    const level = i.evidence_level || 'Untested (theory/pilot stage)';
    evidenceCounts[level] = (evidenceCounts[level] || 0) + 1;
  }

  // States covered
  const states = new Set(recipientList.map(r => r.state).filter(Boolean));

  return {
    totalFunding,
    recipients: recipientList,
    accoPercent,
    accoFunding,
    totalPrograms,
    evidenceCounts,
    statesCovered: states.size,
    totalInterventions: allInterventions.length,
  };
}

export default async function ForFundersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/for-funders');

  // Check for funder profile (use service client to bypass RLS for lookup)
  const service = createServiceClient() as any;
  const { data: funderProfile } = await service
    .from('funder_profiles')
    .select('*')
    .eq('email', user.email || '')
    .single();

  // If funder profile found, link user_id if not already set
  if (funderProfile && !funderProfile.user_id) {
    await service
      .from('funder_profiles')
      .update({ user_id: user.id, last_login_at: new Date().toISOString() })
      .eq('id', funderProfile.id);
  } else if (funderProfile) {
    await service
      .from('funder_profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', funderProfile.id);
  }

  // Admin without funder profile → show all-funders overview
  if (!funderProfile) {
    const { data: profile } = await service
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      // Not a funder, not an admin — show a "no access" page
      return (
        <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>No Funder Profile</h1>
            <p className="text-gray-600 mb-6">Your account ({user.email}) doesn&apos;t have a funder profile yet. Contact ben@justicehub.org.au to get set up.</p>
            <Link href="/" className="text-[#059669] font-bold hover:underline">Back to home</Link>
          </div>
        </div>
      );
    }

    // Admin view — show all funder profiles as cards
    const { data: allFunders } = await service
      .from('funder_profiles')
      .select('*')
      .order('funder_name');

    return <AdminOverview funders={allFunders || []} />;
  }

  // Funder dashboard
  const fp = funderProfile as FunderProfile;
  const data = await getFunderDashboardData(fp);
  const config = (fp.config || {}) as Record<string, string>;

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div className="bg-[#0A0A0A] text-white">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-white/40">JUSTICEHUB</span>
            <span className="text-white/20">/</span>
            <span className="text-sm font-bold">{fp.funder_name}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/40 font-mono">{user.email}</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-[#0A0A0A] text-white pb-16 pt-12">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4">Your Portfolio Dashboard</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {fp.funder_name}
          </h1>
          {config.hookLine && (
            <p className="text-lg text-white/60 max-w-2xl leading-relaxed">
              {config.hookLine as string}
            </p>
          )}

          {/* Key stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-10">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {formatDollars(data.totalFunding)}
              </p>
              <p className="text-xs text-white/40 font-mono mt-1">Portfolio Total</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {data.recipients.length}
              </p>
              <p className="text-xs text-white/40 font-mono mt-1">Partners</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className={`text-2xl font-bold ${data.accoPercent > 1 ? 'text-[#059669]' : 'text-[#DC2626]'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {data.accoPercent}%
              </p>
              <p className="text-xs text-white/40 font-mono mt-1">ACCO Allocation</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {data.totalPrograms}
              </p>
              <p className="text-xs text-white/40 font-mono mt-1">Programs Mapped</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {data.statesCovered}
              </p>
              <p className="text-xs text-white/40 font-mono mt-1">States</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* Evidence Profile */}
        {Object.keys(data.evidenceCounts).length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Evidence Profile
            </h2>
            <div className="flex gap-2 mb-4 h-6 rounded-full overflow-hidden">
              {Object.entries(data.evidenceCounts)
                .sort(([a], [b]) => {
                  const order = ['Proven', 'Effective', 'Promising', 'Indigenous', 'Untested'];
                  return order.findIndex(o => a.startsWith(o)) - order.findIndex(o => b.startsWith(o));
                })
                .map(([level, count]) => (
                  <div
                    key={level}
                    className="h-full"
                    style={{
                      width: `${(count / data.totalPrograms) * 100}%`,
                      backgroundColor: EVIDENCE_COLORS[level] || '#9ca3af',
                      minWidth: count > 0 ? '20px' : '0',
                    }}
                    title={`${EVIDENCE_SHORT[level] || level}: ${count}`}
                  />
                ))}
            </div>
            <div className="flex flex-wrap gap-4">
              {Object.entries(data.evidenceCounts)
                .sort(([a], [b]) => {
                  const order = ['Proven', 'Effective', 'Promising', 'Indigenous', 'Untested'];
                  return order.findIndex(o => a.startsWith(o)) - order.findIndex(o => b.startsWith(o));
                })
                .map(([level, count]) => (
                  <div key={level} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EVIDENCE_COLORS[level] || '#9ca3af' }} />
                    <span className="text-sm text-gray-600">
                      {EVIDENCE_SHORT[level] || level}: <strong>{count}</strong>
                    </span>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Your Partners */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Your Partners
              </h2>
              <span className="text-xs text-gray-400 font-mono">{data.recipients.length} organisations</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-mono text-gray-400 uppercase">Organisation</th>
                  <th className="text-left px-4 py-3 text-xs font-mono text-gray-400 uppercase">State</th>
                  <th className="text-right px-4 py-3 text-xs font-mono text-gray-400 uppercase">Funding</th>
                  <th className="text-center px-4 py-3 text-xs font-mono text-gray-400 uppercase">Programs</th>
                  <th className="text-center px-4 py-3 text-xs font-mono text-gray-400 uppercase">ACCO</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.recipients.map((r, i) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      {r.slug ? (
                        <Link href={`/for-funders/org/${r.slug}`} className="font-medium text-[#0A0A0A] hover:text-[#059669] transition-colors">
                          {r.name}
                        </Link>
                      ) : (
                        <span className="text-gray-700">{r.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{r.state || '—'}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono">{formatDollars(r.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      {r.interventionCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[#059669] font-medium">
                          <BarChart3 className="w-3 h-3" /> {r.interventionCount}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.isIndigenous ? (
                        <span className="inline-flex items-center gap-1 text-xs text-purple-600">
                          <Shield className="w-3 h-3" /> Yes
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.slug && (
                        <Link href={`/for-funders/org/${r.slug}`} className="text-gray-300 hover:text-[#059669] transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Links */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={`/for-funders/report/${fp.funder_slug}`}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#059669] hover:shadow-md transition-all group"
          >
            <BarChart3 className="w-6 h-6 text-[#059669] mb-3" />
            <h3 className="font-bold mb-1">Full Evidence Report</h3>
            <p className="text-sm text-gray-500 mb-3">Portfolio analysis, pillar breakdown, ACCO allocation, and the case for investment.</p>
            <span className="text-sm font-bold text-[#059669] flex items-center gap-1 group-hover:underline">
              View report <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/for-funders/landscape"
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#0A0A0A] hover:shadow-md transition-all group"
          >
            <Layers className="w-6 h-6 text-[#0A0A0A] mb-3" />
            <h3 className="font-bold mb-1">Funder Landscape</h3>
            <p className="text-sm text-gray-500 mb-3">See how your portfolio compares side-by-side with other funders in the space.</p>
            <span className="text-sm font-bold text-[#0A0A0A] flex items-center gap-1 group-hover:underline">
              Compare portfolios <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/for-funders/evidence-gaps"
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-600 hover:shadow-md transition-all group"
          >
            <Target className="w-6 h-6 text-purple-600 mb-3" />
            <h3 className="font-bold mb-1">Evidence Gap Matrix</h3>
            <p className="text-sm text-gray-500 mb-3">Where evidence is strong, where the gaps are, and where funding moves the needle.</p>
            <span className="text-sm font-bold text-purple-600 flex items-center gap-1 group-hover:underline">
              Explore gaps <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </section>

        {/* The Gap — detention vs community */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            The National Picture
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-50 border border-red-100 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
                <span className="font-bold text-sm">Detention</span>
              </div>
              <p className="text-3xl font-bold text-[#DC2626]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>$1.55M</p>
              <p className="text-sm text-gray-500 mt-1">per child per year. 84% reoffend.</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-[#059669]" />
                <span className="font-bold text-sm">Community Programs</span>
              </div>
              <p className="text-3xl font-bold text-[#059669]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>~$50K</p>
              <p className="text-sm text-gray-500 mt-1">per participant per year. 85% don&apos;t reoffend.</p>
            </div>
          </div>
          <div className="mt-4 bg-[#F5F0E8] rounded-lg p-4">
            <p className="text-sm text-gray-700">
              Your portfolio reaches <strong className="text-[#059669]">{data.totalPrograms} programs</strong> out of{' '}
              <strong>{data.totalInterventions.toLocaleString()}</strong> verified alternatives nationally.
              {data.totalInterventions - data.totalPrograms > 0 && (
                <> That leaves <strong className="text-[#DC2626]">{(data.totalInterventions - data.totalPrograms).toLocaleString()} unfunded</strong>.</>
              )}
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 font-mono py-6 border-t border-gray-200">
          <p>Data: ALMA Network, AusTender, NIAA, state budgets, ACNC filings, community verification.</p>
          <p className="mt-1">
            <Link href="/" className="underline hover:text-gray-600">JusticeHub</Link> — Australia&apos;s community justice evidence platform.
          </p>
        </footer>
      </div>
    </div>
  );
}

/* ─── Admin Overview (no funder profile) ─── */

function AdminOverview({ funders }: { funders: any[] }) {
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <div className="bg-[#0A0A0A] text-white">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-white/40">JUSTICEHUB</span>
            <span className="text-white/20">/</span>
            <span className="text-sm font-bold">Funder Hub — Admin</span>
          </div>
          <Link href="/admin" className="text-xs text-white/40 hover:text-white transition-colors font-mono">
            Admin Dashboard
          </Link>
        </div>
      </div>

      <div className="bg-[#0A0A0A] text-white pb-12 pt-8">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-3">Admin View</p>
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Funder Intelligence Hub
          </h1>
          <p className="text-white/50">
            {funders.length} funder profile{funders.length !== 1 ? 's' : ''} configured. Each funder sees their personalized dashboard when they log in.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Funder cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {funders.map((f) => (
            <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-lg mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {f.funder_name}
              </h3>
              <p className="text-sm text-gray-400 font-mono mb-3">{f.email}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {(f.source_tags || []).map((tag: string) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  {f.user_id ? (
                    <span className="text-[#059669]">Linked</span>
                  ) : (
                    <span className="text-amber-500">Not yet logged in</span>
                  )}
                </span>
                <Link
                  href={`/for-funders/report/${f.funder_slug}`}
                  className="text-[#059669] font-bold hover:underline flex items-center gap-1"
                >
                  View report <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Quick tools */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/for-funders/landscape" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
            <Scale className="w-5 h-5 text-[#0A0A0A] mb-2" />
            <h3 className="font-bold text-sm">Landscape Comparison</h3>
          </Link>
          <Link href="/for-funders/evidence-gaps" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
            <BarChart3 className="w-5 h-5 text-[#059669] mb-2" />
            <h3 className="font-bold text-sm">Evidence Gap Matrix</h3>
          </Link>
          <Link href="/for-funders/calculator" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
            <DollarSign className="w-5 h-5 text-[#DC2626] mb-2" />
            <h3 className="font-bold text-sm">Impact Calculator</h3>
          </Link>
          <Link href="/for-funders/report" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
            <Shield className="w-5 h-5 text-purple-600 mb-2" />
            <h3 className="font-bold text-sm">Foundation Report</h3>
          </Link>
        </div>
      </div>
    </div>
  );
}
