import { Metadata } from 'next';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import {
  ArrowRight, DollarSign, Users, MapPin, Building2,
  CheckCircle, AlertTriangle, TrendingUp, BarChart3
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Funder Portfolio Comparison | JusticeHub',
  description: 'Compare philanthropic portfolios side-by-side. See where funders overlap, where gaps exist, and where community needs are unmet.',
};

function formatDollars(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

interface FunderProfile {
  name: string;
  slug: string;
  totalFunding: number;
  recordCount: number;
  recipients: { name: string; slug: string | null; amount: number; isIndigenous: boolean }[];
  states: Record<string, number>;
  accoPercent: number;
  topTypes: { type: string; count: number }[];
}

async function getFunderProfiles(): Promise<FunderProfile[]> {
  const supabase = createServiceClient();

  // Get all philanthropic funding with org details
  const { data: records } = await supabase
    .from('justice_funding')
    .select('id, source, recipient_name, amount_dollars, program_name, alma_organization_id, organizations!justice_funding_alma_organization_id_fkey(name, slug, state, is_indigenous_org)')
    .in('source', ['philanthropic', 'dusseldorp', 'prf'])
    .not('amount_dollars', 'is', null)
    .order('amount_dollars', { ascending: false });

  if (!records || records.length === 0) return [];

  // Group by funder
  const funderMap = new Map<string, FunderProfile>();

  for (const r of records) {
    const funderName = r.recipient_name || r.source || 'Unknown';
    // Normalize funder names
    let normalizedName = funderName;
    if (funderName.toLowerCase().includes('paul ramsay') || funderName.toLowerCase().includes('prf') || r.source === 'prf') {
      normalizedName = 'Paul Ramsay Foundation';
    } else if (funderName.toLowerCase().includes('dusseldorp') || r.source === 'dusseldorp') {
      normalizedName = 'Dusseldorp Forum';
    } else if (funderName.toLowerCase().includes('minderoo')) {
      normalizedName = 'Minderoo Foundation';
    }

    if (!funderMap.has(normalizedName)) {
      funderMap.set(normalizedName, {
        name: normalizedName,
        slug: normalizedName.toLowerCase().replace(/\s+/g, '-'),
        totalFunding: 0,
        recordCount: 0,
        recipients: [],
        states: {},
        accoPercent: 0,
        topTypes: [],
      });
    }

    const profile = funderMap.get(normalizedName)!;
    profile.totalFunding += r.amount_dollars || 0;
    profile.recordCount++;

    const org = r.organizations as any;
    if (org) {
      const existing = profile.recipients.find(rec => rec.name === org.name);
      if (existing) {
        existing.amount += r.amount_dollars || 0;
      } else {
        profile.recipients.push({
          name: org.name,
          slug: org.slug,
          amount: r.amount_dollars || 0,
          isIndigenous: org.is_indigenous_org || false,
        });
      }

      if (org.state) {
        profile.states[org.state] = (profile.states[org.state] || 0) + (r.amount_dollars || 0);
      }
    }
  }

  // Compute ACCO percent for each funder
  for (const profile of funderMap.values()) {
    profile.recipients.sort((a, b) => b.amount - a.amount);
    const accoFunding = profile.recipients.filter(r => r.isIndigenous).reduce((sum, r) => sum + r.amount, 0);
    profile.accoPercent = profile.totalFunding > 0 ? Math.round((accoFunding / profile.totalFunding) * 100) : 0;
  }

  return Array.from(funderMap.values())
    .filter(f => f.totalFunding > 0)
    .sort((a, b) => b.totalFunding - a.totalFunding);
}

export default async function FunderComparePage() {
  const funders = await getFunderProfiles();

  // Find overlap — orgs funded by multiple funders
  const orgFunderMap = new Map<string, string[]>();
  for (const f of funders) {
    for (const r of f.recipients) {
      if (!orgFunderMap.has(r.name)) orgFunderMap.set(r.name, []);
      orgFunderMap.get(r.name)!.push(f.name);
    }
  }
  const overlaps = Array.from(orgFunderMap.entries())
    .filter(([, funderList]) => funderList.length > 1)
    .map(([name, funderList]) => ({ name, funders: funderList }));

  // Sector average ACCO allocation: <1%
  const SECTOR_AVG_ACCO = 1;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Header */}
      <div className="bg-[#0A0A0A] text-white">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between text-sm">
          <Link href="/for-funders" className="flex items-center gap-2 text-white/70 hover:text-white">
            <ArrowRight className="w-4 h-4 rotate-180" /> Funder Hub
          </Link>
          <span className="font-mono text-xs text-white/50">PORTFOLIO COMPARISON</span>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold tracking-tight mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Funder Portfolio Comparison
          </h1>
          <p className="text-white/60 max-w-2xl">
            Where do philanthropic funders overlap? Where are the gaps? Side-by-side portfolio intelligence
            from {formatDollars(funders.reduce((s, f) => s + f.totalFunding, 0))} in tracked philanthropic funding.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">

        {/* Comparison Grid */}
        {funders.length > 0 && (
          <section>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {funders.slice(0, 6).map(funder => (
                <div key={funder.slug} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-[#0A0A0A] p-5">
                    <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {funder.name}
                    </h3>
                    <p className="text-2xl font-bold text-white mt-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {formatDollars(funder.totalFunding)}
                    </p>
                    <p className="text-xs text-white/50 font-mono">{funder.recordCount} funding records</p>
                  </div>

                  {/* ACCO allocation */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">ACCO Allocation</span>
                      <span className={`text-lg font-bold ${funder.accoPercent > SECTOR_AVG_ACCO ? 'text-[#059669]' : 'text-[#DC2626]'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {funder.accoPercent}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${funder.accoPercent > SECTOR_AVG_ACCO ? 'bg-[#059669]' : 'bg-[#DC2626]'}`}
                        style={{ width: `${Math.min(funder.accoPercent, 100)}%` }}
                      />
                    </div>
                    {funder.accoPercent > SECTOR_AVG_ACCO && (
                      <p className="text-xs text-[#059669] mt-1">
                        {Math.round(funder.accoPercent / SECTOR_AVG_ACCO)}x sector average
                      </p>
                    )}
                  </div>

                  {/* Top recipients */}
                  <div className="p-5">
                    <p className="text-xs font-mono text-gray-400 uppercase mb-3">Top Recipients</p>
                    <div className="space-y-2">
                      {funder.recipients.slice(0, 5).map((r, i) => (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {r.isIndigenous && <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" title="Indigenous-led" />}
                            {r.slug ? (
                              <Link href={`/for-funders/org/${r.slug}`} className="text-sm text-gray-700 hover:text-[#0A0A0A] truncate">
                                {r.name}
                              </Link>
                            ) : (
                              <span className="text-sm text-gray-700 truncate">{r.name}</span>
                            )}
                          </div>
                          <span className="text-sm font-mono text-gray-400 flex-shrink-0">{formatDollars(r.amount)}</span>
                        </div>
                      ))}
                    </div>
                    {funder.recipients.length > 5 && (
                      <p className="text-xs text-gray-400 mt-2">+ {funder.recipients.length - 5} more</p>
                    )}
                  </div>

                  {/* Geographic spread */}
                  {Object.keys(funder.states).length > 0 && (
                    <div className="p-5 border-t border-gray-100">
                      <p className="text-xs font-mono text-gray-400 uppercase mb-2">Geographic Spread</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(funder.states)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 6)
                          .map(([state, amount]) => (
                            <span key={state} className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {state}
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

        {/* Overlap Analysis */}
        {overlaps.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Portfolio Overlap
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-4">
                Organisations receiving funding from multiple philanthropic sources:
              </p>
              <div className="space-y-3">
                {overlaps.map((o, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-[#0A0A0A]">{o.name}</span>
                    <div className="flex gap-2">
                      {o.funders.map(f => (
                        <span key={f} className="text-xs bg-[#0A0A0A] text-white px-2 py-1 rounded">
                          {f.replace(' Foundation', '').replace(' Forum', '')}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gap Analysis */}
        <section>
          <h2 className="text-2xl font-bold text-[#0A0A0A] mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Where the Gaps Are
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-[#DC2626]/5 rounded-lg border border-[#DC2626]/10">
              <AlertTriangle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#0A0A0A]">Sector average: {"<"}1% of philanthropic funding reaches Aboriginal Community Controlled Organisations</p>
                <p className="text-xs text-gray-500 mt-1">Source: ACOSS, Philanthropy Australia sector data</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <BarChart3 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#0A0A0A]">
                  1,724 Indigenous organisations deliver 1,081 verified alternatives to detention — most have zero philanthropic support
                </p>
                <p className="text-xs text-gray-500 mt-1">Source: JusticeHub ALMA Network data</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-[#059669]/5 rounded-lg border border-[#059669]/10">
              <TrendingUp className="w-5 h-5 text-[#059669] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#0A0A0A]">
                  Community programs cost ~$50K/participant/year vs $1.55M/child in detention — a 31x cost advantage with better outcomes
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#0A0A0A] rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            See what your investment could unlock
          </h2>
          <p className="text-white/60 mb-6">
            Use the impact calculator to model funding scenarios, or explore community org profiles.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/for-funders/calculator"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0A0A0A] rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              <DollarSign className="w-4 h-4" /> Impact Calculator
            </Link>
            <Link
              href="/for-funders/evidence-gaps"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              Evidence Gap Matrix <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <footer className="text-center text-xs text-gray-400 font-mono pb-8">
          <p>Portfolio data from ALMA Network, AusTender, NIAA, state budgets, and ACNC filings.</p>
          <p className="mt-1">
            <Link href="/" className="underline hover:text-gray-600">JusticeHub</Link> — community justice evidence platform
          </p>
        </footer>
      </div>
    </div>
  );
}
