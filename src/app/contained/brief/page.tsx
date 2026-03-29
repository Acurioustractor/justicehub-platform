'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ArrowLeft, ArrowRight, Printer } from 'lucide-react';

const STATE_STATS: Record<string, { detention_spend: string; community_spend: string; indigenous_ratio: string; detention_population: string }> = {
  nsw: { detention_spend: '$364M', community_spend: '$89M', indigenous_ratio: '17.5x', detention_population: '282' },
  vic: { detention_spend: '$298M', community_spend: '$76M', indigenous_ratio: '14.2x', detention_population: '178' },
  qld: { detention_spend: '$412M', community_spend: '$95M', indigenous_ratio: '28.4x', detention_population: '335' },
  wa: { detention_spend: '$178M', community_spend: '$42M', indigenous_ratio: '42.1x', detention_population: '147' },
  sa: { detention_spend: '$89M', community_spend: '$28M', indigenous_ratio: '21.3x', detention_population: '68' },
  tas: { detention_spend: '$32M', community_spend: '$11M', indigenous_ratio: '12.8x', detention_population: '18' },
  act: { detention_spend: '$28M', community_spend: '$9M', indigenous_ratio: '16.7x', detention_population: '14' },
  nt: { detention_spend: '$67M', community_spend: '$15M', indigenous_ratio: '96.2x', detention_population: '46' },
};

const STATE_NAMES: Record<string, string> = {
  nsw: 'New South Wales', vic: 'Victoria', qld: 'Queensland', wa: 'Western Australia',
  sa: 'South Australia', tas: 'Tasmania', act: 'Australian Capital Territory', nt: 'Northern Territory',
};

export default function DecisionMakerBriefPage() {
  const [state, setState] = useState('qld');
  const stats = STATE_STATS[state];

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A]">
      <Navigation />

      <main className="pt-40">
        {/* Header */}
        <section className="py-8 border-b-2 border-[#0A0A0A]">
          <div className="container-justice">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <Link
                  href="/contained"
                  className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-[#0A0A0A] mb-4 py-3"
                >
                  <ArrowLeft className="w-5 h-5 md:w-4 md:h-4" /> Back
                </Link>
                <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase">
                  Decision-Maker Brief
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  One-page evidence summary for {STATE_NAMES[state]}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="border-2 border-[#0A0A0A] bg-white px-4 py-2 text-sm font-bold uppercase"
                >
                  {Object.entries(STATE_NAMES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 border-2 border-[#0A0A0A] px-4 py-2 text-sm font-bold uppercase hover:bg-[#0A0A0A] hover:text-white transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Brief Content — designed to print well */}
        <section className="py-8 print:py-4">
          <div className="container-justice max-w-3xl">
            {/* Headline */}
            <div className="border-2 border-[#0A0A0A] p-6 mb-6 print:border print:p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-[#DC2626] mb-2">
                THE CONTAINED — Australian Tour 2026
              </div>
              <h2 className="text-xl font-black mb-2">
                Youth Justice in {STATE_NAMES[state]}: What the Evidence Shows
              </h2>
              <p className="text-sm text-gray-600">
                You have been nominated to experience THE CONTAINED — a 30-minute immersive walk
                through youth detention reality, international alternatives, and the community
                organisations already doing what works. This brief summarises the evidence for
                your jurisdiction.
              </p>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="border-2 border-[#0A0A0A] p-4 text-center">
                <div className="text-2xl font-black font-mono text-[#DC2626]">{stats.detention_spend}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Detention spend</div>
              </div>
              <div className="border-2 border-[#0A0A0A] p-4 text-center">
                <div className="text-2xl font-black font-mono text-[#059669]">{stats.community_spend}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Community spend</div>
              </div>
              <div className="border-2 border-[#0A0A0A] p-4 text-center">
                <div className="text-2xl font-black font-mono">{stats.indigenous_ratio}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Indigenous overrep.</div>
              </div>
              <div className="border-2 border-[#0A0A0A] p-4 text-center">
                <div className="text-2xl font-black font-mono">{stats.detention_population}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Avg daily detention</div>
              </div>
            </div>

            {/* The Three Rooms */}
            <div className="mb-6">
              <h3 className="text-lg font-black uppercase tracking-tighter mb-4 flex items-center gap-2">
                <span className="w-6 h-1 bg-[#DC2626] inline-block" />
                What You Will Experience
              </h3>
              <div className="space-y-4">
                <div className="border-l-4 border-[#DC2626] pl-4">
                  <h4 className="font-bold">Room 1 — Current Reality</h4>
                  <p className="text-sm text-gray-600">
                    10 minutes inside the reality of youth detention. Designed by young people who have
                    lived through the system. $4,250/day. $1.55M/year. 84% reoffend.
                  </p>
                </div>
                <div className="border-l-4 border-[#059669] pl-4">
                  <h4 className="font-bold">Room 2 — The Alternative (Diagrama, Spain)</h4>
                  <p className="text-sm text-gray-600">
                    10 minutes experiencing the therapeutic model. 1:1 staffing, weekly family engagement,
                    73% success rate, &euro;5.64 returned per &euro;1 invested. Proven at scale.
                  </p>
                </div>
                <div className="border-l-4 border-[#0A0A0A] pl-4">
                  <h4 className="font-bold">Room 3 — Community Organisations Already Doing It</h4>
                  <p className="text-sm text-gray-600">
                    10 minutes with the local organisations delivering results. $75/day. 88% restorative
                    justice success. Changes at every tour stop — local community tells local story.
                  </p>
                </div>
              </div>
            </div>

            {/* National Facts */}
            <div className="mb-6 bg-gray-50 border-2 border-gray-200 p-6 print:bg-white">
              <h3 className="text-lg font-black uppercase tracking-tighter mb-3">
                National Evidence Base
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div className="flex justify-between border-b border-gray-200 py-1">
                  <span className="text-gray-600">Cost per child/year (detention)</span>
                  <span className="font-bold">$1.55M</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 py-1">
                  <span className="text-gray-600">Cost per day (detention)</span>
                  <span className="font-bold">$4,250</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 py-1">
                  <span className="text-gray-600">Detention reoffending rate</span>
                  <span className="font-bold text-[#DC2626]">84%</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 py-1">
                  <span className="text-gray-600">Community program reoffending</span>
                  <span className="font-bold text-[#059669]">3%</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 py-1">
                  <span className="text-gray-600">Community cost per day</span>
                  <span className="font-bold text-[#059669]">$75</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 py-1">
                  <span className="text-gray-600">Indigenous overrepresentation (national)</span>
                  <span className="font-bold">23x</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 py-1">
                  <span className="text-gray-600">Verified interventions on ALMA</span>
                  <span className="font-bold">981</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 py-1">
                  <span className="text-gray-600">Restorative justice success rate</span>
                  <span className="font-bold text-[#059669]">88%</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Sources: Productivity Commission ROGS 2024-25, QLD Youth Justice Strategy 2023,
                Community Services Benchmark Study 2024, Diagrama Foundation evaluation
              </p>
            </div>

            {/* What You Can Do */}
            <div className="border-2 border-[#0A0A0A] bg-[#0A0A0A] text-white p-6">
              <h3 className="text-lg font-black uppercase tracking-tighter mb-3 text-white">
                What You Can Do
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-[#DC2626] flex-shrink-0" />
                  <span>Walk through THE CONTAINED when it comes to your city</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-[#DC2626] flex-shrink-0" />
                  <span>Nominate 5 peers who should experience it</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-[#DC2626] flex-shrink-0" />
                  <span>Review the evidence at justicehub.com.au/intelligence/dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-[#DC2626] flex-shrink-0" />
                  <span>Ask your department what community programs receive vs detention</span>
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-400">
                CONTAINED shows what youth detention feels like. JusticeHub shows what works instead.
                <br />
                justicehub.com.au/contained | ben@justicehub.com.au
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
