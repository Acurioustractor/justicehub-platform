'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  TrendingUp, Shield, Users, BarChart3, DollarSign,
  ArrowRight, CheckCircle, AlertTriangle, MapPin,
  Loader2, ExternalLink, Target, BookOpen, Scale,
} from 'lucide-react';

interface ReportData {
  overview: {
    totalInterventions: number;
    highImpactPrograms: number;
    indigenousLedPrograms: number;
    orgsLinked: number;
    totalEvidence: number;
    totalOutcomes: number;
    outcomeLinks: number;
  };
  typeBreakdown: { type: string; total: number; highImpact: number }[];
  outcomeBreakdown: { type: string; count: number }[];
  topPrograms: {
    name: string;
    type: string;
    score: number;
    evidenceLevel: string;
    geography: string[];
    organization: string;
  }[];
  generated_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  'Cultural Connection': 'bg-orange-600',
  'Wraparound Support': 'bg-amber-600',
  'Community-Led': 'bg-purple-600',
  'Diversion': 'bg-green-600',
  'Justice Reinvestment': 'bg-indigo-600',
  'Prevention': 'bg-teal-600',
  'Education/Employment': 'bg-cyan-600',
  'Therapeutic': 'bg-rose-600',
  'Family Strengthening': 'bg-pink-600',
  'Early Intervention': 'bg-blue-600',
};

interface RogsStats {
  rogs_youth_detention_millions: number;
  rogs_youth_community_millions: number;
  rogs_youth_total_millions: number;
  rogs_prison_billions: number;
  rogs_police_billions: number;
  rogs_indigenous_detention_ratio: number;
  rogs_total_punitive_billions: number;
  rogs_year: string;
}

export default function FoundationReportPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [rogs, setRogs] = useState<RogsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/intelligence/report').then((r) => r.json()),
      fetch('/api/homepage-stats').then((r) => r.json()),
    ])
      .then(([reportPayload, statsPayload]) => {
        if (reportPayload.success) setData(reportPayload);
        if (statsPayload.stats) setRogs(statsPayload.stats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>Failed to load report data.</p>
      </div>
    );
  }

  const { overview, typeBreakdown, outcomeBreakdown, topPrograms } = data;

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      <main className="pt-40">
        {/* Report Header */}
        <section className="py-16 md:py-24 border-b-2 border-black">
          <div className="container-justice">
            <div className="max-w-4xl">
              <div className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
                Foundation Report 2026
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6">
                THE EVIDENCE FOR<br />COMMUNITY-LED<br />YOUTH JUSTICE
              </h1>

              <p className="text-xl md:text-2xl text-gray-700 mb-6 leading-relaxed">
                Australia&apos;s most comprehensive database of youth justice interventions reveals
                what works, what doesn&apos;t, and where philanthropic investment delivers the
                greatest return. Live data from{' '}
                <strong className="text-black">{overview.totalInterventions.toLocaleString()} programs</strong>{' '}
                across every state and territory.
              </p>

              <p className="text-sm text-gray-500 font-mono">
                Report generated: {new Date(data.generated_at).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
                {' '}&middot; Data updates in real time
              </p>
            </div>
          </div>
        </section>

        {/* Key Numbers */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-5xl md:text-6xl font-black text-emerald-400">
                  {overview.totalInterventions.toLocaleString()}
                </div>
                <div className="text-sm font-bold uppercase tracking-widest mt-2 text-gray-300">
                  Programs Documented
                </div>
              </div>
              <div className="text-center">
                <div className="text-5xl md:text-6xl font-black text-emerald-400">
                  {overview.highImpactPrograms}
                </div>
                <div className="text-sm font-bold uppercase tracking-widest mt-2 text-gray-300">
                  High-Impact (Score 70+)
                </div>
              </div>
              <div className="text-center">
                <div className="text-5xl md:text-6xl font-black text-orange-400">
                  {overview.indigenousLedPrograms}
                </div>
                <div className="text-sm font-bold uppercase tracking-widest mt-2 text-gray-300">
                  Indigenous-Led
                </div>
              </div>
              <div className="text-center">
                <div className="text-5xl md:text-6xl font-black text-blue-400">
                  {overview.orgsLinked}
                </div>
                <div className="text-sm font-bold uppercase tracking-widest mt-2 text-gray-300">
                  Organisations Mapped
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Crisis */}
        <section className="py-16 border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">
              The Crisis in Numbers
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-red-50 p-8 border-2 border-red-200">
                <AlertTriangle className="w-8 h-8 text-red-600 mb-4" />
                <div className="text-4xl font-black text-red-700 mb-2">$7,304</div>
                <div className="font-bold mb-2">Maximum daily detention cost</div>
                <p className="text-sm text-gray-700">
                  Youth detention costs $2,573-$7,304 per day across jurisdictions (Productivity
                  Commission 2024-25). Community supervision costs $101-$601 — up to 72x cheaper
                  with better outcomes.
                </p>
              </div>

              <div className="bg-red-50 p-8 border-2 border-red-200">
                <Scale className="w-8 h-8 text-red-600 mb-4" />
                <div className="text-4xl font-black text-red-700 mb-2">{rogs ? `${rogs.rogs_indigenous_detention_ratio}x` : '23x'}</div>
                <div className="font-bold mb-2">Indigenous overrepresentation</div>
                <p className="text-sm text-gray-700">
                  First Nations young people are incarcerated at {rogs?.rogs_indigenous_detention_ratio || 23} times the rate of
                  non-Indigenous youth. This is the highest overrepresentation rate in the
                  developed world.
                  {rogs?.rogs_year && <span className="block mt-1 text-xs text-gray-500">Source: Productivity Commission ROGS {rogs.rogs_year}</span>}
                </p>
              </div>

              <div className="bg-emerald-50 p-8 border-2 border-emerald-200">
                <TrendingUp className="w-8 h-8 text-emerald-600 mb-4" />
                <div className="text-4xl font-black text-emerald-700 mb-2">5-10x</div>
                <div className="font-bold mb-2">ROI on community programs</div>
                <p className="text-sm text-gray-700">
                  Every dollar invested in community-led alternatives returns $5-10 in avoided
                  incarceration costs, reduced reoffending, and improved life outcomes for young
                  people and their families.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Money Trail */}
        <section className="py-16 bg-gray-50 border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Following the Money Trail
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              Australia spends tens of billions annually on justice services. Tracking where those
              dollars flow — from budget appropriation to community outcome — reveals a systemic
              misallocation away from what works.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="border-2 border-black bg-white p-8">
                <div className="text-xs font-bold uppercase tracking-widest text-red-600 mb-4">
                  Current Spending
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-bold">Police Services</span>
                      <span className="text-2xl font-black text-red-700">${rogs?.rogs_police_billions || 18.4}B</span>
                    </div>
                    <div className="w-full bg-gray-200 h-4">
                      <div className="bg-red-500 h-4" style={{ width: `${rogs ? Math.round((rogs.rogs_police_billions / rogs.rogs_total_punitive_billions) * 100) : 70}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-bold">Prisons</span>
                      <span className="text-2xl font-black text-red-700">${rogs?.rogs_prison_billions || 6.8}B</span>
                    </div>
                    <div className="w-full bg-gray-200 h-4">
                      <div className="bg-red-400 h-4" style={{ width: `${rogs ? Math.round((rogs.rogs_prison_billions / rogs.rogs_total_punitive_billions) * 100) : 26}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-bold">Youth Detention</span>
                      <span className="text-2xl font-black text-red-700">${rogs ? (rogs.rogs_youth_detention_millions / 1000).toFixed(1) : '1.1'}B</span>
                    </div>
                    <div className="w-full bg-gray-200 h-4">
                      <div className="bg-red-300 h-4" style={{ width: `${rogs ? Math.round((rogs.rogs_youth_detention_millions / 1000 / rogs.rogs_total_punitive_billions) * 100) : 4}%` }} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      734 young people — ${rogs ? Math.round(rogs.rogs_youth_detention_millions / 0.734) .toLocaleString() : '1,555,000'}/child/year
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-red-50 border border-red-200">
                  <div className="text-xs font-bold uppercase text-red-700 mb-1">Total Punitive System</div>
                  <div className="text-3xl font-black text-red-800">${rogs?.rogs_total_punitive_billions || 26.4}B/year</div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Source: Productivity Commission ROGS {rogs?.rogs_year || '2024-25'}
                </p>
              </div>

              <div className="border-2 border-black bg-white p-8">
                <div className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-4">
                  The Cost Comparison
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="flex-1">
                      <div className="font-bold text-sm text-gray-600 mb-1">Youth Detention</div>
                      <div className="text-3xl font-black text-red-700">$2,573-$7,304</div>
                      <div className="text-sm text-gray-500">per day, per young person</div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                    <div className="flex-1">
                      <div className="font-bold text-sm text-gray-600 mb-1">Community Supervision</div>
                      <div className="text-3xl font-black text-emerald-700">$101-$601</div>
                      <div className="text-sm text-gray-500">per day, per young person</div>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="text-center">
                      <div className="text-5xl font-black text-emerald-700">12-72x</div>
                      <div className="text-sm font-bold text-gray-600 mt-1">
                        cheaper to support in community than to detain
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Source: Productivity Commission, Report on Government Services 2026
                </p>
              </div>
            </div>

            <div className="border-2 border-black bg-white p-8">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Key Funding Streams We Track
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl font-black text-indigo-700 mb-1">$3.9B</div>
                  <div className="font-bold text-sm">National Access to Justice Partnership 2025-30</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Legal assistance funding over 5 years — the largest single justice investment
                  </p>
                </div>
                <div>
                  <div className="text-2xl font-black text-indigo-700 mb-1">$49.1B</div>
                  <div className="font-bold text-sm">Total Public Order &amp; Safety Spend</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Annual government expenditure across policing, courts, corrections, and related services
                  </p>
                </div>
                <div>
                  <div className="text-2xl font-black text-indigo-700 mb-1">Growing</div>
                  <div className="font-bold text-sm">National Justice Reinvestment Program</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Place-based and First Nations-led reinvestment with ongoing funding from 2026-27
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What Works — by Type */}
        <section className="py-16 bg-gray-50 border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              What Works
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              Portfolio scores are calculated from 5 signals: evidence strength, community authority,
              harm risk, implementation capability, and option value. Programs scoring 70+ are
              classified as &ldquo;High Impact&rdquo;.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {typeBreakdown.map((item) => {
                const pct = item.total > 0 ? Math.round((item.highImpact / item.total) * 100) : 0;
                return (
                  <div key={item.type} className="bg-white p-6 border-2 border-black flex items-center gap-4">
                    <div className={`w-3 h-12 ${TYPE_COLORS[item.type] || 'bg-gray-600'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold">{item.type}</h3>
                        <span className="text-sm font-mono text-gray-500">{item.total} programs</span>
                      </div>
                      <div className="w-full bg-gray-200 h-3 relative">
                        <div
                          className="bg-emerald-500 h-3 absolute left-0 top-0"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-emerald-700 font-bold">{item.highImpact} high-impact</span>
                        <span className="text-xs text-gray-500">{pct}% high-impact rate</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-6 bg-white border-2 border-black">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Key Finding
              </h3>
              <p className="text-gray-700">
                <strong>Cultural Connection programs have the highest impact rate</strong> at{' '}
                {typeBreakdown.find((t) => t.type === 'Cultural Connection')
                  ? Math.round(
                      ((typeBreakdown.find((t) => t.type === 'Cultural Connection')?.highImpact || 0) /
                        (typeBreakdown.find((t) => t.type === 'Cultural Connection')?.total || 1)) *
                        100
                    )
                  : 0}
                % of programs scoring 70+. This aligns with decades of research showing that
                connection to culture, country, and community is the strongest protective factor
                for First Nations young people.
              </p>
            </div>
          </div>
        </section>

        {/* Outcomes Tracked */}
        <section className="py-16 border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Outcomes We Track
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              {overview.totalOutcomes} distinct outcomes linked across {overview.outcomeLinks} program-outcome
              connections. These are the measurable changes that prove community alternatives work.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {outcomeBreakdown.map((outcome) => (
                <div key={outcome.type} className="bg-white p-5 border-2 border-black">
                  <div className="text-2xl font-black text-emerald-700 mb-1">{outcome.count}</div>
                  <div className="font-bold text-sm">{outcome.type}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Top 20 Programs */}
        <section className="py-16 bg-gray-50 border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Top 20 High-Impact Programs
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              These programs represent the strongest evidence base, deepest community authority,
              and greatest readiness for investment. Each one is a proven alternative to detention.
            </p>

            <div className="border-2 border-black overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider w-8">#</th>
                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Program</th>
                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Evidence</th>
                    <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topPrograms.map((program, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 font-mono text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold">{program.name}</div>
                        {program.organization && (
                          <div className="text-xs text-gray-500">{program.organization}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase text-white ${TYPE_COLORS[program.type] || 'bg-gray-600'}`}>
                          {program.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {program.geography?.slice(0, 2).join(', ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {program.evidenceLevel?.split(' (')[0] || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold font-mono text-xs border border-emerald-300">
                          {(program.score * 100).toFixed(0)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-right">
              <Link
                href="/intelligence/interventions?sort=score"
                className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:underline"
              >
                View all {overview.totalInterventions} programs <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CONTAINED Tour Connection */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto text-center">
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4">
                See the Evidence in Person
              </div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6">
                THE CONTAINED:<br />AUSTRALIAN TOUR 2026
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Three shipping containers. One powerful experience. The CONTAINED tour brings
                this evidence to life — showing what detention does to young people and what
                community alternatives achieve. Touring nationally with stops in Alice Springs,
                Mount Isa, Mount Druitt, and Townsville.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="border border-gray-700 p-6">
                  <div className="text-3xl font-black text-red-400 mb-2">Container 1</div>
                  <div className="font-bold mb-2">Designed by Young People</div>
                  <p className="text-sm text-gray-400">
                    At every stop, local young people design this room. They are the experts.
                    They know what detention feels like.
                  </p>
                </div>
                <div className="border border-gray-700 p-6">
                  <div className="text-3xl font-black text-blue-400 mb-2">Container 2</div>
                  <div className="font-bold mb-2">The Evidence Wall</div>
                  <p className="text-sm text-gray-400">
                    Live data from {overview.totalInterventions} programs. Interactive screens showing
                    what works, scored by our 5-signal portfolio system.
                  </p>
                </div>
                <div className="border border-gray-700 p-6">
                  <div className="text-3xl font-black text-emerald-400 mb-2">Container 3</div>
                  <div className="font-bold mb-2">The Orgs Doing It</div>
                  <p className="text-sm text-gray-400">
                    Each stop celebrates the local grassroots organisations — Indigenous-led and
                    community orgs that aren&apos;t being funded the way they should be.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contained"
                  className="bg-white text-black px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  Tour Details
                </Link>
                <Link
                  href="/contained/act"
                  className="border-2 border-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                >
                  Take Action
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Investment Ask */}
        <section className="py-16 border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              The Investment Case
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              Four ways philanthropic capital can drive systemic change in Australian youth justice.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border-2 border-black">
                <div className="p-6 bg-emerald-50 border-b-2 border-black">
                  <DollarSign className="w-8 h-8 text-emerald-700 mb-2" />
                  <h3 className="text-xl font-bold">Fund Programs Directly</h3>
                  <div className="text-3xl font-black text-emerald-700 mt-2">$50K-250K</div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-4">
                    Direct investment into {overview.highImpactPrograms} high-impact programs
                    identified by ALMA. Your funding goes to organisations with proven track records.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                      <span>Portfolio-scored program matching</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                      <span>Outcome tracking and impact reporting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                      <span>Community authority verification</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-2 border-black">
                <div className="p-6 bg-blue-50 border-b-2 border-black">
                  <BarChart3 className="w-8 h-8 text-blue-700 mb-2" />
                  <h3 className="text-xl font-bold">Fund the Evidence Platform</h3>
                  <div className="text-3xl font-black text-blue-700 mt-2">$100K-500K</div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-4">
                    Scale ALMA — the intelligence infrastructure that identifies what works.
                    Currently {overview.totalInterventions} programs scored with{' '}
                    {overview.totalOutcomes} tracked outcomes.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <span>Expand evidence database nationally</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <span>Community-controlled data governance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <span>Open API for researchers and policymakers</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-2 border-black">
                <div className="p-6 bg-orange-50 border-b-2 border-black">
                  <Target className="w-8 h-8 text-orange-700 mb-2" />
                  <h3 className="text-xl font-bold">Fund the CONTAINED Tour</h3>
                  <div className="text-3xl font-black text-orange-700 mt-2">$25K-100K</div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-4">
                    Sponsor the national tour that makes the evidence impossible to ignore.
                    Four cities, three containers, thousands of people experiencing the case for change.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                      <span>Named sponsorship at tour stops</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                      <span>VIP briefings with community leaders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                      <span>Media and advocacy reach amplification</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-2 border-black">
                <div className="p-6 bg-indigo-50 border-b-2 border-black">
                  <MapPin className="w-8 h-8 text-indigo-700 mb-2" />
                  <h3 className="text-xl font-bold">Fund the Money Trail</h3>
                  <div className="text-3xl font-black text-indigo-700 mt-2">$150K-500K</div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-4">
                    Build Australia&apos;s first national justice funding ledger — tracking every
                    dollar from budget appropriation to community outcome across all jurisdictions.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5" />
                      <span>GrantConnect + AusTender ingestion (Phase A)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5" />
                      <span>State budget paper parsing across 8 jurisdictions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5" />
                      <span>Community-led data governance (CARE + Maiam nayri Wingara)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6">
              The Data Is Clear.<br />The Opportunity Is Now.
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Schedule a briefing to see the full ALMA dataset, meet community leaders,
              and explore how your investment can transform youth justice in Australia.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact?source=foundation-report&type=briefing"
                className="bg-white text-black px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
              >
                Schedule a Briefing
              </Link>
              <Link
                href="/intelligence/interventions?sort=score"
                className="border-2 border-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
              >
                Explore the Data
              </Link>
            </div>

            <p className="mt-8 text-sm text-gray-500">
              This report is generated live from the ALMA database. All program scores,
              outcome counts, and organisation data update in real time.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
