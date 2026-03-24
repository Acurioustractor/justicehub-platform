'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { fmt } from '@/lib/format';
import { STATE_NAMES } from '@/lib/constants';

interface FundingContext {
  state: string;
  stateTotal: number;
  orgTotal: number;
  topRecipients: Array<{
    id: string;
    name: string;
    total: number;
    isIndigenous: boolean;
  }>;
  indigenousFunding: number;
  nonIndigenousFunding: number;
  almaInterventionCount: number;
  indigenousOrgCount: number;
}

export default function FundingTransparency({
  orgId,
  orgName,
  state,
}: {
  orgId: string;
  orgName: string;
  state: string;
}) {
  const [data, setData] = useState<FundingContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/basecamps/funding-context?state=${state}&org_id=${orgId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [state, orgId]);

  if (loading || !data) return null;
  if (data.stateTotal === 0) return null;

  const totalLinked = data.indigenousFunding + data.nonIndigenousFunding;
  const indigenousPercent = totalLinked > 0
    ? ((data.indigenousFunding / totalLinked) * 100).toFixed(1)
    : '0';
  const topProviderTotal = data.topRecipients.slice(0, 5).reduce((s, r) => s + r.total, 0);

  return (
    <section className="bg-[#0A0A0A] text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
          <p
            className="text-xs uppercase tracking-[0.3em] text-white/50"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Follow the Money — {STATE_NAMES[state] || state}
          </p>
        </div>
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-8"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Where does the funding actually go?
        </h2>

        {/* The contrast */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Big providers */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <p
              className="text-xs uppercase tracking-wider text-white/40 mb-3"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Top 5 providers in {state}
            </p>
            <p
              className="text-3xl font-bold text-[#DC2626] mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {fmt(topProviderTotal)}
            </p>
            <div className="space-y-2">
              {data.topRecipients.slice(0, 5).map((r, i) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span className="text-white/60 truncate max-w-[60%]">
                    {i + 1}. {r.name}
                  </span>
                  <span
                    className="text-white/80 font-medium shrink-0"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {fmt(r.total)}
                    {!r.isIndigenous && (
                      <span className="text-white/30 ml-1 text-xs">non-Indigenous</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* This org */}
          <div className="bg-[#059669]/10 rounded-xl p-6 border border-[#059669]/30">
            <p
              className="text-xs uppercase tracking-wider text-[#059669]/70 mb-3"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {orgName}
            </p>
            <p
              className="text-3xl font-bold text-[#059669] mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {data.orgTotal > 0 ? fmt(data.orgTotal) : 'Under-funded'}
            </p>
            <p className="text-sm text-white/60 leading-relaxed">
              {data.orgTotal > 0 ? (
                <>
                  Community-controlled. Indigenous-led. Achieving outcomes that
                  the largest providers in {STATE_NAMES[state] || state} cannot match —
                  at a fraction of the cost.
                </>
              ) : (
                <>
                  Doing the work with minimal government funding. Building
                  alternatives that keep young people safe, connected, and out of
                  detention — on their own terms.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-lg p-4">
            <p
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {indigenousPercent}%
            </p>
            <p
              className="text-xs text-white/40 mt-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              To Indigenous orgs
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {data.indigenousOrgCount}
            </p>
            <p
              className="text-xs text-white/40 mt-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Indigenous orgs in {state}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {data.almaInterventionCount}
            </p>
            <p
              className="text-xs text-white/40 mt-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              ALMA models in {state}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {fmt(data.stateTotal)}
            </p>
            <p
              className="text-xs text-white/40 mt-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Total {state} tracked
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/basecamps"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#0A0A0A] font-semibold rounded-lg text-sm hover:bg-white/90 transition-colors"
          >
            <TrendingUp className="w-4 h-4" /> See the full ALMA Network
          </Link>
          <Link
            href="/intelligence/funding"
            className="inline-flex items-center gap-2 px-4 py-2 border border-white/20 text-white font-semibold rounded-lg text-sm hover:bg-white/10 transition-colors"
          >
            Explore all funding data <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p
          className="text-xs text-white/20 mt-8"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Source: JusticeHub funding database — QGIP, AusTender, NIAA, state budgets, QLD historical grants.
          Data is compiled from public sources and may not represent all funding.
        </p>
      </div>
    </section>
  );
}
