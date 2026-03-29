import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import {
  ArrowRight, DollarSign, Users, MapPin, CheckCircle,
  AlertTriangle, TrendingUp, BarChart3, Shield, Target
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatDollars(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

// Funder-specific messaging and data
interface FunderConfig {
  name: string;
  shortName: string;
  askAmount: string;
  askTimeline: string;
  askDescription: string;
  hookLine: string;
  keyInsight: string;
  sources: string[];
  basecampLocations: string[];
}

const FUNDER_CONFIGS: Record<string, FunderConfig> = {
  minderoo: {
    name: 'Minderoo Foundation',
    shortName: 'Minderoo',
    askAmount: '$150–300K',
    askTimeline: '12 months',
    askDescription: 'Fund national platform infrastructure — JusticeHub as shared evidence platform for the sector',
    hookLine: 'What if every dollar of justice funding in Australia was traceable? What if every community program had a living profile?',
    keyInsight: 'Scale of the gap: 2,051 Indigenous organisations deliver 1,165 verified alternatives to detention. Most have zero digital presence connecting them to funders.',
    sources: ['philanthropic', 'niaa', 'austender-direct'],
    basecampLocations: ['Palm Island', 'Alice Springs', 'Mt Druitt'],
  },
  dusseldorp: {
    name: 'Dusseldorp Forum',
    shortName: 'Dusseldorp',
    askAmount: '$40–80K',
    askTimeline: '6 months',
    askDescription: 'Fund 2 basecamp coordinators + make your First Nations portfolio nationally visible',
    hookLine: 'You already direct 30% of your funding to First Nations organisations — 30x the sector average. Here\'s how to make that visible nationally.',
    keyInsight: 'Dusseldorp\'s 30x ACCO allocation ratio is sector-leading. Through Mannifera Collective\'s 27 member funders, this model could catalyse $5.6M+ in coordinated giving.',
    sources: ['dusseldorp-yir-2025'],
    basecampLocations: ['Alice Springs', 'Mt Druitt'],
  },
  prf: {
    name: 'Paul Ramsay Foundation',
    shortName: 'PRF',
    askAmount: '$100–200K',
    askTimeline: '12 months',
    askDescription: 'Fund Palm Island basecamp + evidence infrastructure for PLACE communities',
    hookLine: 'Your CEO acknowledged the pattern: "pushing too much funding too fast, giving funding to large organisations who aren\'t trusted by community members." The data confirms it.',
    keyInsight: 'PRF portfolio split: 61% to universities, 22% to intermediaries, 17% to ACCOs. Palm Island Community Company runs 21 verified programs with zero PRF philanthropic support.',
    sources: ['prf-portfolio', 'prf-jr-portfolio-review-2025'],
    basecampLocations: ['Palm Island'],
  },
};

async function getFunderReportData(funderKey: string) {
  const config = FUNDER_CONFIGS[funderKey];
  if (!config) return null;

  const supabase = createServiceClient();

  // Get funder's funding records with org details
  const { data: funding } = await supabase
    .from('justice_funding')
    .select('id, source, recipient_name, amount_dollars, program_name, financial_year, alma_organization_id, organizations!justice_funding_alma_organization_id_fkey(name, slug, state, is_indigenous_org, city)')
    .or(config.sources.map(s => `source.eq.${s}`).join(','))
    .not('amount_dollars', 'is', null)
    .order('amount_dollars', { ascending: false });

  // Get total interventions and evidence breakdown
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, name, evidence_level, type, operating_organization_id')
    .neq('verification_status', 'ai_generated');

  // Get Indigenous org count
  const { count: indigenousOrgCount } = await supabase
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .eq('is_indigenous_org', true)
    .eq('is_active', true);

  const records = funding || [];
  const allInterventions = interventions || [];

  // Compute funder portfolio stats
  const totalFunding = records.reduce((sum, r) => sum + (r.amount_dollars || 0), 0);
  const recipients = new Map<string, { name: string; slug: string | null; amount: number; totalAllSources: number; sourceCount: number; interventionCount: number; isIndigenous: boolean; state: string | null; orgId: string | null }>();

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
        totalAllSources: 0,
        sourceCount: 0,
        interventionCount: 0,
        isIndigenous: org.is_indigenous_org || false,
        state: org.state,
        orgId: r.alma_organization_id,
      });
    }
  }

  // Enrich with all-source funding totals and intervention counts
  const orgIds = [...new Set(records.map(r => r.alma_organization_id).filter(Boolean))] as string[];
  if (orgIds.length > 0) {
    const { data: allSourceFunding } = await supabase
      .from('justice_funding')
      .select('alma_organization_id, source, amount_dollars')
      .in('alma_organization_id', orgIds)
      .not('amount_dollars', 'is', null);

    // Aggregate all-source totals per org
    const orgTotals = new Map<string, { total: number; sources: Set<string> }>();
    for (const f of (allSourceFunding || [])) {
      const existing = orgTotals.get(f.alma_organization_id!);
      if (existing) {
        existing.total += f.amount_dollars || 0;
        existing.sources.add(f.source);
      } else {
        orgTotals.set(f.alma_organization_id!, { total: f.amount_dollars || 0, sources: new Set([f.source]) });
      }
    }

    // Count interventions per org
    const orgInterventionCounts = new Map<string, number>();
    for (const i of allInterventions) {
      if (i.operating_organization_id && orgIds.includes(i.operating_organization_id)) {
        orgInterventionCounts.set(i.operating_organization_id, (orgInterventionCounts.get(i.operating_organization_id) || 0) + 1);
      }
    }

    // Apply to recipients
    for (const r of recipients.values()) {
      if (r.orgId) {
        const totals = orgTotals.get(r.orgId);
        if (totals) {
          r.totalAllSources = totals.total;
          r.sourceCount = totals.sources.size;
        }
        r.interventionCount = orgInterventionCounts.get(r.orgId) || 0;
      }
    }
  }

  const recipientList = Array.from(recipients.values()).sort((a, b) => b.amount - a.amount);
  const accoFunding = recipientList.filter(r => r.isIndigenous).reduce((sum, r) => sum + r.amount, 0);
  const accoPercent = totalFunding > 0 ? Math.round((accoFunding / totalFunding) * 100) : 0;

  // Get orgs in funder's portfolio that have interventions
  const fundedOrgIds = new Set(records.map(r => r.alma_organization_id).filter(Boolean));
  const fundedInterventions = allInterventions.filter(i => fundedOrgIds.has(i.operating_organization_id));
  const unfundedInterventions = allInterventions.filter(i => !fundedOrgIds.has(i.operating_organization_id));

  // Separate query for topics (avoids Supabase type inference issue)
  const { data: topicRecords } = await supabase
    .from('justice_funding')
    .select('amount_dollars, topics')
    .or(config.sources.map(s => `source.eq.${s}`).join(','))
    .not('amount_dollars', 'is', null);

  const pillarBreakdown = { education: 0, climate: 0, firstNations: 0, other: 0 };
  for (const r of (topicRecords || [])) {
    const topics: string[] = (r as any).topics || [];
    const amt = (r as any).amount_dollars || 0;
    if (topics.includes('education')) pillarBreakdown.education += amt;
    else if (topics.includes('climate') || topics.includes('environment')) pillarBreakdown.climate += amt;
    else if (topics.includes('first-nations')) pillarBreakdown.firstNations += amt;
    else pillarBreakdown.other += amt;
  }

  return {
    config,
    totalFunding,
    recordCount: records.length,
    recipients: recipientList,
    accoPercent,
    accoFunding,
    pillarBreakdown,
    fundedInterventions: fundedInterventions.length,
    unfundedInterventions: unfundedInterventions.length,
    totalInterventions: allInterventions.length,
    indigenousOrgCount: indigenousOrgCount || 1724,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateMetadata({ params }: { params: { funder: string } }): Promise<Metadata> {
  const config = FUNDER_CONFIGS[params.funder];
  if (!config) return { title: 'Not Found' };
  return {
    title: `${config.name} — Evidence Report | JusticeHub`,
    description: `Custom evidence report for ${config.name}. Portfolio analysis, community evidence, and the case for investment.`,
  };
}

export default async function FunderReportPage({ params }: { params: { funder: string } }) {
  const data = await getFunderReportData(params.funder);
  if (!data) notFound();

  const { config, totalFunding, recordCount, recipients, accoPercent, accoFunding, pillarBreakdown, fundedInterventions, unfundedInterventions, totalInterventions, indigenousOrgCount, generatedAt } = data;

  return (
    <div className="min-h-screen bg-white">
      {/* Report Header — printable */}
      <div className="bg-[#0A0A0A] text-white print:bg-white print:text-black">
        <div className="max-w-4xl mx-auto px-8 py-4 flex items-center justify-between text-sm print:hidden">
          <Link href="/for-funders" className="flex items-center gap-2 text-white/70 hover:text-white">
            <ArrowRight className="w-4 h-4 rotate-180" /> Funder Hub
          </Link>
          <span className="text-white/50 font-mono text-xs">Ctrl+P to print / save as PDF</span>
        </div>

        <div className="max-w-4xl mx-auto px-8 py-16 print:py-8">
          <p className="text-sm font-mono text-white/50 print:text-gray-500 mb-4">
            JUSTICEHUB EVIDENCE REPORT — PREPARED FOR
          </p>
          <h1 className="text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {config.name}
          </h1>
          <p className="text-xl text-white/70 print:text-gray-600 leading-relaxed max-w-2xl">
            {config.hookLine}
          </p>
          <p className="text-xs font-mono text-white/30 print:text-gray-400 mt-6">
            Generated {new Date(generatedAt).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })} — live data, updates in real time
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12 space-y-16 print:space-y-8">

        {/* Key Insight */}
        <section className="bg-[#F5F0E8] rounded-xl p-8 border-l-4 border-[#0A0A0A]">
          <p className="text-lg text-[#0A0A0A] leading-relaxed">
            {config.keyInsight}
          </p>
        </section>

        {/* Your Portfolio */}
        <section>
          <h2 className="text-2xl font-bold text-[#0A0A0A] mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Your Portfolio at a Glance
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#F5F0E8] rounded-lg p-5">
              <p className="text-2xl font-bold text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {formatDollars(totalFunding)}
              </p>
              <p className="text-sm text-gray-500 font-mono">Tracked Funding</p>
            </div>
            <div className="bg-[#F5F0E8] rounded-lg p-5">
              <p className="text-2xl font-bold text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {recipients.length}
              </p>
              <p className="text-sm text-gray-500 font-mono">Recipients</p>
            </div>
            <div className="bg-[#F5F0E8] rounded-lg p-5">
              <p className={`text-2xl font-bold ${accoPercent > 1 ? 'text-[#059669]' : 'text-[#DC2626]'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {accoPercent}%
              </p>
              <p className="text-sm text-gray-500 font-mono">ACCO Allocation</p>
            </div>
            <div className="bg-[#F5F0E8] rounded-lg p-5">
              <p className="text-2xl font-bold text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {fundedInterventions}
              </p>
              <p className="text-sm text-gray-500 font-mono">Programs in Portfolio</p>
            </div>
          </div>

          {/* Top recipients */}
          {recipients.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-mono text-gray-500 uppercase">Recipient</th>
                    <th className="text-left px-5 py-3 text-xs font-mono text-gray-500 uppercase">Location</th>
                    <th className="text-right px-5 py-3 text-xs font-mono text-gray-500 uppercase">{config.shortName}</th>
                    <th className="text-right px-5 py-3 text-xs font-mono text-gray-500 uppercase">All Sources</th>
                    <th className="text-center px-5 py-3 text-xs font-mono text-gray-500 uppercase">Programs</th>
                    <th className="text-center px-5 py-3 text-xs font-mono text-gray-500 uppercase">ACCO</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-5 py-3 text-sm">
                        {r.slug ? (
                          <Link href={`/for-funders/org/${r.slug}`} className="text-[#0A0A0A] hover:underline font-medium">
                            {r.name}
                          </Link>
                        ) : (
                          <span className="text-gray-700">{r.name}</span>
                        )}
                        {r.sourceCount > 1 && (
                          <span className="ml-2 text-xs text-gray-400 font-mono">{r.sourceCount} sources</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{r.state || '—'}</td>
                      <td className="px-5 py-3 text-sm text-right font-mono">{formatDollars(r.amount)}</td>
                      <td className="px-5 py-3 text-sm text-right font-mono">
                        {r.totalAllSources > r.amount ? (
                          <span className="text-[#059669] font-medium">{formatDollars(r.totalAllSources)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {r.interventionCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#059669] font-medium">
                            <BarChart3 className="w-3 h-3" /> {r.interventionCount}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">0</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {r.isIndigenous ? (
                          <span className="inline-flex items-center gap-1 text-xs text-purple-600">
                            <Shield className="w-3 h-3" /> Yes
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Pillar Breakdown */}
        {(pillarBreakdown.education > 0 || pillarBreakdown.climate > 0 || pillarBreakdown.firstNations > 0) && (
          <section>
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Portfolio by Pillar
            </h2>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Education Grounded in Place', amount: pillarBreakdown.education, share: '33%', color: '#0A0A0A', trend: null },
                { label: 'Climate & Environment', amount: pillarBreakdown.climate, share: '37%', color: '#059669', trend: '$225K → $570K → $675K (2023–25)' },
                { label: 'First Nations Leading Change', amount: pillarBreakdown.firstNations, share: '30%', color: '#7C3AED', trend: '$432K → $472K → $524K (2023–25)' },
              ].map((p, i) => (
                <div key={i} className="border rounded-lg p-5" style={{ borderColor: `${p.color}30` }}>
                  <p className="text-xs font-mono text-gray-500 uppercase mb-2">{p.label}</p>
                  <p className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: p.color }}>
                    {formatDollars(p.amount)}
                  </p>
                  <p className="text-sm text-gray-400 font-mono">{p.share} of total giving</p>
                  {p.trend && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#059669]" />
                        <p className="text-xs text-gray-500">{p.trend}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ACCO breakdown bar */}
            <div className="bg-[#F5F0E8] rounded-lg p-6">
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-sm font-mono text-gray-600 uppercase">First Nations (ACCO) Allocation</p>
                <p className="text-lg font-bold text-[#059669]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {accoPercent}% — {formatDollars(accoFunding)}
                </p>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#059669] rounded-full" style={{ width: `${accoPercent}%` }} />
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-xs text-gray-500">Sector average: &lt;1%</p>
                <p className="text-xs text-[#059669] font-medium">{accoPercent}x sector average</p>
              </div>
            </div>
          </section>
        )}

        {/* The Gap */}
        <section>
          <h2 className="text-2xl font-bold text-[#0A0A0A] mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            The Gap
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#DC2626]/5 border border-[#DC2626]/20 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-[#DC2626]" />
                <h3 className="font-bold text-[#0A0A0A]">What detention costs</h3>
              </div>
              <p className="text-3xl font-bold text-[#DC2626] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                $1.55M
              </p>
              <p className="text-sm text-gray-600">per child, per year. 84% reoffend within 12 months.</p>
            </div>
            <div className="bg-[#059669]/5 border border-[#059669]/20 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-[#059669]" />
                <h3 className="font-bold text-[#0A0A0A]">What community programs cost</h3>
              </div>
              <p className="text-3xl font-bold text-[#059669] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                ~$50K
              </p>
              <p className="text-sm text-gray-600">per participant, per year. 85% don&apos;t reoffend.</p>
            </div>
          </div>
          <div className="mt-6 bg-[#F5F0E8] rounded-lg p-6">
            <p className="text-sm text-[#0A0A0A]">
              <strong>{indigenousOrgCount} Indigenous organisations</strong> deliver{' '}
              <strong>{totalInterventions.toLocaleString()} verified alternatives</strong> to detention.
              Your portfolio currently reaches <strong>{fundedInterventions}</strong> of these programs —
              leaving <strong className="text-[#DC2626]">{unfundedInterventions.toLocaleString()} unfunded</strong>.
            </p>
          </div>
        </section>

        {/* The Ask */}
        <section className="bg-[#0A0A0A] rounded-xl p-8 text-white print:bg-gray-100 print:text-black">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            The Ask
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-sm text-white/50 print:text-gray-500 font-mono uppercase mb-1">Amount</p>
              <p className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {config.askAmount}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/50 print:text-gray-500 font-mono uppercase mb-1">Timeline</p>
              <p className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {config.askTimeline}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/50 print:text-gray-500 font-mono uppercase mb-1">Basecamps</p>
              <p className="text-lg font-bold">
                {config.basecampLocations.join(', ')}
              </p>
            </div>
          </div>
          <p className="text-white/70 print:text-gray-600 leading-relaxed mb-6">
            {config.askDescription}
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#059669] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white/80 print:text-gray-700">
                Fractional community coordinators at each basecamp (0.5 FTE, community sector rates)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#059669] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white/80 print:text-gray-700">
                JusticeHub evidence profiles for every community org in each basecamp region
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#059669] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white/80 print:text-gray-700">
                CONTAINED campaign integration — tour stops at each basecamp location
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#059669] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white/80 print:text-gray-700">
                Quarterly impact reports with community-verified outcome data
              </p>
            </div>
          </div>
        </section>

        {/* Next steps */}
        <section className="text-center space-y-4 print:hidden">
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/for-funders/compare"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A0A0A] text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Compare Portfolios <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/for-funders/evidence-gaps"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#0A0A0A] text-[#0A0A0A] rounded-lg font-medium hover:bg-[#0A0A0A] hover:text-white transition-colors"
            >
              Evidence Gap Matrix
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 font-mono pb-8 pt-4 border-t border-gray-200">
          <p>Data: ALMA Network, AusTender, NIAA, state budgets, ACNC filings, community verification.</p>
          <p className="mt-1">
            Generated by <Link href="/" className="underline hover:text-gray-600">JusticeHub</Link> — Australia&apos;s community justice evidence platform.
          </p>
          <p className="mt-1">Contact: ben@justicehub.com.au</p>
        </footer>
      </div>
    </div>
  );
}
