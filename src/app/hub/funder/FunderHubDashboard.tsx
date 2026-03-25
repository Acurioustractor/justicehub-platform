'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign, ArrowLeft, MapPin, TrendingUp, Building2, Shield,
  BarChart3, Users, BookOpen, CheckCircle2, AlertTriangle, Loader2,
} from 'lucide-react';
import { HubMediaGallery } from '../components/HubMediaGallery';

interface FunderHubDashboardProps {
  userName: string;
  userState: string;
  totalFunding: number;
  stateFunding: Array<{ state: string; count: number; total_amount: number }>;
  topOrgs: Array<{ name: string; slug: string | null; state: string | null; indigenous: boolean; count: number }>;
  provenInterventions: Array<{
    id: string;
    name: string;
    evidence_level: string | null;
    organizations?: { name: string; slug: string | null } | null;
  }>;
  indigenousOrgCount: number;
}

export function FunderHubDashboard({
  userName,
  userState,
  totalFunding,
  stateFunding,
  topOrgs,
  provenInterventions,
  indigenousOrgCount,
}: FunderHubDashboardProps) {
  const maxCount = stateFunding.length > 0 ? Math.max(...stateFunding.map(s => s.count)) : 1;

  // Fetch funding gap analysis
  const [gaps, setGaps] = useState<{
    funding_gaps: Array<{ program_name: string; evidence_level: string; org_name: string; org_slug: string | null; state: string | null; is_indigenous: boolean; funding_records: number }>;
    summary: { total_proven_programs: number; unfunded_count: number; states_with_gaps: number };
  } | null>(null);
  const [gapsLoading, setGapsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/hub/briefings?type=funder${userState ? `&state=${userState}` : ''}`)
      .then(r => r.json())
      .then(data => setGaps(data))
      .catch(() => {})
      .finally(() => setGapsLoading(false));
  }, [userState]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8]">
      {/* Header */}
      <div className="border-b border-[#F5F0E8]/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/hub" className="text-[#F5F0E8]/40 hover:text-[#F5F0E8] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <DollarSign className="w-5 h-5 text-amber-500" />
            <span className="font-mono text-xs text-amber-500">FUNDER HUB</span>
          </div>
          <span className="font-mono text-xs text-[#F5F0E8]/40">{userName}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Funding Intelligence
          </h1>
          <p className="text-sm text-[#F5F0E8]/50 mt-1 font-mono">
            Where the money flows — and where it should
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="border border-[#F5F0E8]/10 p-4">
            <p className="font-mono text-[10px] text-[#F5F0E8]/40 uppercase">Funding Records</p>
            <p className="text-2xl font-bold mt-1">{totalFunding.toLocaleString()}</p>
            <p className="text-[10px] text-[#F5F0E8]/30 font-mono">tracked nationally</p>
          </div>
          <div className="border border-[#F5F0E8]/10 p-4">
            <p className="font-mono text-[10px] text-[#F5F0E8]/40 uppercase">States Covered</p>
            <p className="text-2xl font-bold mt-1">{stateFunding.length}</p>
            <p className="text-[10px] text-[#F5F0E8]/30 font-mono">jurisdictions</p>
          </div>
          <div className="border border-[#F5F0E8]/10 p-4">
            <p className="font-mono text-[10px] text-[#F5F0E8]/40 uppercase">Indigenous Orgs</p>
            <p className="text-2xl font-bold mt-1">{indigenousOrgCount.toLocaleString()}</p>
            <p className="text-[10px] text-[#F5F0E8]/30 font-mono">in directory</p>
          </div>
          <div className="border border-[#F5F0E8]/10 p-4">
            <p className="font-mono text-[10px] text-[#F5F0E8]/40 uppercase">Proven Programs</p>
            <p className="text-2xl font-bold mt-1">{provenInterventions.length}</p>
            <p className="text-[10px] text-[#F5F0E8]/30 font-mono">evidence-backed</p>
          </div>
        </div>

        {/* Funding Gaps — the key value-add */}
        <div className="border border-amber-500/20 bg-amber-500/5 p-6 mb-8">
          <h2 className="font-mono text-xs text-amber-500 mb-2 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Funding Gap Analysis
          </h2>
          <p className="text-sm text-[#F5F0E8]/50 mb-4">
            Evidence-backed programs with no tracked government funding — where investment could have the most impact
          </p>
          {gapsLoading ? (
            <div className="flex items-center gap-2 text-sm text-[#F5F0E8]/30">
              <Loader2 className="w-4 h-4 animate-spin" /> Analysing funding data...
            </div>
          ) : gaps?.funding_gaps ? (
            <>
              {gaps.summary && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 border border-[#F5F0E8]/10 bg-[#0A0A0A]/50">
                    <p className="text-xl font-bold text-[#DC2626]">{gaps.summary.unfunded_count}</p>
                    <p className="text-[10px] text-[#F5F0E8]/40 font-mono">unfunded programs</p>
                  </div>
                  <div className="p-3 border border-[#F5F0E8]/10 bg-[#0A0A0A]/50">
                    <p className="text-xl font-bold">{gaps.summary.total_proven_programs}</p>
                    <p className="text-[10px] text-[#F5F0E8]/40 font-mono">proven/effective total</p>
                  </div>
                  <div className="p-3 border border-[#F5F0E8]/10 bg-[#0A0A0A]/50">
                    <p className="text-xl font-bold">{gaps.summary.states_with_gaps}</p>
                    <p className="text-[10px] text-[#F5F0E8]/40 font-mono">states with gaps</p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {gaps.funding_gaps.slice(0, 8).map((gap, i) => (
                  <div key={i} className="p-3 border border-[#F5F0E8]/10 bg-[#0A0A0A]/50 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{gap.program_name}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#F5F0E8]/40">
                        <span>{gap.org_name}</span>
                        {gap.state && (
                          <>
                            <span className="text-[#F5F0E8]/20">·</span>
                            <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{gap.state}</span>
                          </>
                        )}
                        {gap.is_indigenous && (
                          <>
                            <span className="text-[#F5F0E8]/20">·</span>
                            <span className="text-[#059669]">Indigenous-led</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[9px] font-mono ${
                        gap.evidence_level === 'Proven' ? 'bg-[#059669]/20 text-[#059669]' :
                        gap.evidence_level === 'Indigenous-led' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {gap.evidence_level}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-mono bg-[#DC2626]/20 text-[#DC2626]">
                        $0 tracked
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/intelligence"
                className="block mt-4 text-xs font-mono text-[#DC2626] hover:underline"
              >
                View all programs in evidence library →
              </Link>
            </>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Funding by State */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-6">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-4 uppercase tracking-wider">Funding Landscape by State</h2>
              <div className="space-y-3">
                {stateFunding.map((s) => {
                  const isYours = s.state === userState;
                  const width = Math.max(5, (s.count / maxCount) * 100);
                  return (
                    <Link
                      key={s.state}
                      href={`/justice-funding?state=${s.state}`}
                      className="block group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold w-8">{s.state}</span>
                          {isYours && <span className="text-[10px] font-mono text-amber-500">YOUR STATE</span>}
                        </div>
                        <span className="font-mono text-xs text-[#F5F0E8]/40">{s.count.toLocaleString()} records</span>
                      </div>
                      <div className="h-2 bg-[#F5F0E8]/5">
                        <div
                          className={`h-full transition-all ${isYours ? 'bg-amber-500' : 'bg-[#F5F0E8]/20 group-hover:bg-[#F5F0E8]/30'}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
              <Link
                href="/justice-funding"
                className="block mt-4 text-xs font-mono text-[#DC2626] hover:underline"
              >
                Explore full funding data →
              </Link>
            </div>

            {/* Evidence-backed programs */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-6">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-4 uppercase tracking-wider">Evidence-Backed Programs</h2>
              <p className="text-sm text-[#F5F0E8]/50 mb-4">
                Programs with proven or effective evidence — where funding delivers measurable impact
              </p>
              <div className="space-y-2">
                {provenInterventions.map((i) => {
                  const isProven = i.evidence_level?.startsWith('Proven');
                  return (
                    <div
                      key={i.id}
                      className="p-3 border border-[#F5F0E8]/5 hover:border-[#F5F0E8]/15 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-sm">{i.name}</p>
                          {(i.organizations as any)?.name && (
                            <p className="text-[10px] font-mono text-[#F5F0E8]/40 mt-0.5">
                              {(i.organizations as any).name}
                            </p>
                          )}
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 text-[10px] font-mono ${
                          isProven ? 'bg-[#059669]/20 text-[#059669]' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {isProven ? 'PROVEN' : 'EFFECTIVE'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link
                href="/intelligence"
                className="block mt-4 text-xs font-mono text-[#DC2626] hover:underline"
              >
                Browse all interventions →
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top funded orgs */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-5">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-3 uppercase tracking-wider">Most Funded Orgs</h2>
              <div className="space-y-2">
                {topOrgs.slice(0, 8).map((org, i) => (
                  <Link
                    key={i}
                    href={org.slug ? `/organizations/${org.slug}` : '/organizations'}
                    className="flex items-center justify-between text-sm hover:text-amber-400 transition-colors"
                  >
                    <span className="truncate flex-1 mr-2">
                      {org.name}
                      {org.indigenous && <span className="ml-1 text-[9px] text-[#059669]">Indigenous</span>}
                    </span>
                    <span className="font-mono text-[10px] text-[#F5F0E8]/30 shrink-0">{org.count}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Stories & Media */}
            <HubMediaGallery accentColor="amber-500" title="Impact Stories & Media" />

            {/* Due Diligence Tools */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-5">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-3 uppercase tracking-wider">Due Diligence</h2>
              <div className="space-y-2">
                <Link href="/organizations" className="block text-sm hover:text-amber-400 transition-colors">
                  <Building2 className="w-3.5 h-3.5 inline mr-1.5 text-[#F5F0E8]/30" />
                  Organisation lookup →
                </Link>
                <Link href="/intelligence" className="block text-sm hover:text-amber-400 transition-colors">
                  <BookOpen className="w-3.5 h-3.5 inline mr-1.5 text-[#F5F0E8]/30" />
                  Evidence library →
                </Link>
                <Link href="/justice-funding" className="block text-sm hover:text-amber-400 transition-colors">
                  <BarChart3 className="w-3.5 h-3.5 inline mr-1.5 text-[#F5F0E8]/30" />
                  Funding history →
                </Link>
              </div>
            </div>

            {/* ALMA Chat */}
            <div className="border border-amber-500/20 bg-amber-500/5 p-5">
              <h2 className="font-mono text-xs text-amber-500 mb-2 uppercase tracking-wider">AI Research</h2>
              <p className="text-xs text-[#F5F0E8]/50 mb-3">
                Ask ALMA about funding gaps, impact evidence, and program effectiveness
              </p>
              <Link
                href="/intelligence?chat=true"
                className="block text-center py-2 bg-amber-500 text-[#0A0A0A] text-sm font-bold hover:bg-amber-400 transition-colors"
              >
                Open ALMA Chat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
