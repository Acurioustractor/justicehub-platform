'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * Impact calculator data model.
 * Detention cost: $1.55M/child/year (ROGS 2024-25)
 * Community program cost: ~$50K/child/year (average across programs)
 * Community success rate: ~85% (weighted average from basecamps)
 * Detention reoffending: 84%
 */
const DETENTION_COST_PER_CHILD = 1_550_000;
const COMMUNITY_COST_PER_CHILD = 50_000;
const COMMUNITY_SUCCESS_RATE = 0.85;
const DETENTION_REOFFEND_RATE = 0.84;
const ALMA_MONTHLY_COST = 8_000; // Evidence infrastructure running costs
const TOUR_STOP_COST = 50_000;
const COORDINATOR_ANNUAL_COST = 45_000; // 0.5 FTE at community sector rates
const COMMUNITY_PROFILE_COST = 2_000; // Cost to build one org profile with data

const PRESETS = [
  { label: '$25K', value: 25_000 },
  { label: '$50K', value: 50_000 },
  { label: '$100K', value: 100_000 },
  { label: '$250K', value: 250_000 },
  { label: '$500K', value: 500_000 },
  { label: '$1M', value: 1_000_000 },
];

function formatDollars(n: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ImpactCalculatorPage() {
  const [amount, setAmount] = useState(100_000);
  const [customInput, setCustomInput] = useState('');

  // Calculations
  const youngPeopleSupported = Math.floor(amount / COMMUNITY_COST_PER_CHILD);
  const successfulDiversions = Math.round(youngPeopleSupported * COMMUNITY_SUCCESS_RATE);
  const detentionEquivalent = Math.round(amount / DETENTION_COST_PER_CHILD * 10) / 10;
  const detentionAvoidedCost = youngPeopleSupported * DETENTION_COST_PER_CHILD;
  const roi = detentionAvoidedCost > 0 ? Math.round(detentionAvoidedCost / amount) : 0;
  const reoffendersAvoided = Math.round(successfulDiversions * DETENTION_REOFFEND_RATE);
  const almaMonths = Math.floor(amount / ALMA_MONTHLY_COST);
  const coordinatorMonths = Math.round((amount / COORDINATOR_ANNUAL_COST) * 12);
  const communityProfiles = Math.floor(amount * 0.3 / COMMUNITY_PROFILE_COST); // 30% to profiles
  const tourStops = Math.floor(amount / TOUR_STOP_COST);

  const handlePreset = (value: number) => {
    setAmount(value);
    setCustomInput('');
  };

  const handleCustom = (value: string) => {
    setCustomInput(value);
    const parsed = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="pt-40">
        {/* Header */}
        <section className="py-12 border-b-2 border-[#0A0A0A]">
          <div className="container-justice">
            <Link
              href="/for-funders"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-[#0A0A0A] mb-6 py-3"
            >
              <ArrowLeft className="w-5 h-5 md:w-4 md:h-4" /> Back to Funders
            </Link>

            <div className="inline-block bg-[#0A0A0A] text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
              Impact Calculator
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-4">
              What Does Your<br />Money Actually Do?
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
              Enter an amount. See exactly what it funds, how many young people it reaches,
              and the cost comparison with detention.
            </p>
          </div>
        </section>

        {/* Calculator */}
        <section className="py-12 border-b-2 border-[#0A0A0A]">
          <div className="container-justice">
            {/* Amount selector */}
            <div className="max-w-3xl mx-auto mb-12">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 font-mono mb-3">
                Your Investment
              </label>
              <div className="flex flex-wrap gap-3 mb-4">
                {PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => handlePreset(p.value)}
                    className={`px-5 py-3 text-sm font-bold border-2 transition-colors ${
                      amount === p.value && !customInput
                        ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                        : 'border-gray-300 hover:border-[#0A0A0A]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customInput}
                onChange={(e) => handleCustom(e.target.value)}
                placeholder="Or enter a custom amount..."
                className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-lg font-mono text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
              <div className="mt-2 text-right">
                <span className="text-3xl font-black font-mono">{formatDollars(amount)}</span>
              </div>
            </div>

            {/* Results */}
            <div className="max-w-3xl mx-auto">
              {/* Primary Impact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="border-2 border-[#0A0A0A] bg-white p-6">
                  <div className="text-4xl font-black font-mono text-[#059669]">
                    {youngPeopleSupported}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono mt-1">
                    Young People Supported
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Through community-led programs at ~{formatDollars(COMMUNITY_COST_PER_CHILD)}/year each.
                  </p>
                </div>

                <div className="border-2 border-[#0A0A0A] bg-white p-6">
                  <div className="text-4xl font-black font-mono text-[#059669]">
                    {successfulDiversions}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono mt-1">
                    Successful Diversions
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Based on 85% success rate across verified community programs.
                  </p>
                </div>

                <div className="border-2 border-[#0A0A0A] bg-white p-6">
                  <div className="text-4xl font-black font-mono text-[#059669]">
                    {roi}:1
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono mt-1">
                    Return on Investment
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Every $1 in community programs avoids ${roi} in detention costs.
                  </p>
                </div>
              </div>

              {/* Comparison */}
              <div className="bg-[#0A0A0A] text-white p-8 mb-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 font-mono mb-4">
                  The Comparison
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="text-sm text-gray-400 uppercase tracking-widest mb-2">
                      In Detention
                    </div>
                    <div className="text-3xl font-black font-mono text-[#DC2626]">
                      {detentionEquivalent < 1 ? '<1' : detentionEquivalent.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {detentionEquivalent < 1 ? 'children partially supported' : detentionEquivalent === 1 ? 'child for one year' : 'children for one year'}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      84% will reoffend within two years
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 uppercase tracking-widest mb-2">
                      In Community Programs
                    </div>
                    <div className="text-3xl font-black font-mono text-[#059669]">
                      {youngPeopleSupported}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      young people for one year
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      85% won&apos;t reoffend — {reoffendersAvoided} cycles of reoffending avoided
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-700 text-center">
                  <span className="text-sm text-gray-400">
                    Avoided detention costs:{' '}
                  </span>
                  <span className="text-lg font-black font-mono text-white">
                    {formatDollars(detentionAvoidedCost)}
                  </span>
                </div>
              </div>

              {/* Basecamp Pilot */}
              <div className="border-2 border-purple-600 bg-purple-50 p-6 mb-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-purple-600 font-mono mb-4">
                  Basecamp Pilot — What This Funds
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-3xl font-black font-mono text-purple-700">
                      {coordinatorMonths}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono mt-1">
                      Coordinator Months
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Fractional community coordinators (0.5 FTE) at basecamps, onboarding orgs and building profiles.
                    </p>
                  </div>
                  <div>
                    <div className="text-3xl font-black font-mono text-purple-700">
                      {communityProfiles}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono mt-1">
                      Community Org Profiles
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Full evidence profiles with verified programs, funding data, and community stories.
                    </p>
                  </div>
                  <div>
                    <div className="text-3xl font-black font-mono text-purple-700">
                      {Math.max(1, Math.floor(coordinatorMonths / 6))}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono mt-1">
                      Basecamps Activated
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Regional hubs (e.g. Palm Island, Alice Springs, Mt Druitt) with dedicated support.
                    </p>
                  </div>
                </div>
              </div>

              {/* Infrastructure Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="border-2 border-[#0A0A0A] bg-white p-6">
                  <div className="text-2xl font-black font-mono">{almaMonths}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono mt-1">
                    Months of ALMA Intelligence
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Keeping 1,081 programs verified, evidence current, and data accessible.
                  </p>
                </div>
                <div className="border-2 border-[#0A0A0A] bg-white p-6">
                  <div className="text-2xl font-black font-mono">{tourStops}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono mt-1">
                    CONTAINED Tour Stops
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Complete stops including transport, setup, facilitation, and documentation.
                  </p>
                </div>
              </div>

              {/* Sources */}
              <div className="text-xs text-gray-500 font-mono border-t-2 border-gray-200 pt-4">
                <p className="mb-1">
                  Sources: Detention cost from Productivity Commission ROGS 2024-25.
                  Community program costs averaged across verified ALMA programs.
                  Success rates from independent program evaluations (BackTrack 87%, Oonchiumpa 95%, weighted average 85%).
                </p>
                <p>
                  Note: These are illustrative projections based on aggregate data. Actual outcomes depend on
                  program selection, implementation, and community context.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-[#0A0A0A] text-white">
          <div className="container-justice text-center">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-white">
              Ready to Put This Money to Work?
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-8">
              We&apos;ll match your investment to the programs and infrastructure with the
              highest evidence of impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contained/invest"
                className="inline-flex items-center justify-center gap-2 bg-[#DC2626] text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
              >
                Fund the Tour <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/back-this"
                className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-[#0A0A0A] transition-colors"
              >
                See All Funding Options
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-6">
              ben@justicehub.org.au &middot; justicehub.com.au/contained/invest/one-pager
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
