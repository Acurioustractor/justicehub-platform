'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Share2, DollarSign, Users, TrendingDown, AlertTriangle } from 'lucide-react';
import { fmt } from '@/lib/format';

interface CalculatorClientProps {
  avgCost: number;
  medianCost: number;
  modelCount: number;
}

const STATE_DETENTION_COSTS: Record<string, { daily: number; annual: number; label: string }> = {
  national: { daily: 1500, annual: 547500, label: 'National Average' },
  nt: { daily: 4217, annual: 1539205, label: 'Northern Territory' },
  nsw: { daily: 1568, annual: 572320, label: 'New South Wales' },
  qld: { daily: 1650, annual: 602250, label: 'Queensland' },
  vic: { daily: 2100, annual: 766500, label: 'Victoria' },
  wa: { daily: 1400, annual: 511000, label: 'Western Australia' },
  sa: { daily: 1300, annual: 474500, label: 'South Australia' },
  tas: { daily: 1800, annual: 657000, label: 'Tasmania' },
  act: { daily: 2400, annual: 876000, label: 'Australian Capital Territory' },
};

function fmtFull(n: number): string {
  return `$${n.toLocaleString()}`;
}

export function CalculatorClient({ avgCost, medianCost, modelCount }: CalculatorClientProps) {
  const [youngPeople, setYoungPeople] = useState(100);
  const [state, setState] = useState('national');
  const [years, setYears] = useState(1);

  const calc = useMemo(() => {
    const det = STATE_DETENTION_COSTS[state];
    const detentionTotal = youngPeople * det.annual * years;
    const almaTotal = youngPeople * avgCost * years;
    const saving = detentionTotal - almaTotal;
    const ratio = avgCost > 0 ? Math.round(det.annual / avgCost) : 0;
    const extraYoungPeople = avgCost > 0 ? Math.floor(detentionTotal / avgCost) - youngPeople : 0;

    return {
      detentionTotal,
      almaTotal,
      saving,
      ratio,
      extraYoungPeople,
      detentionDaily: det.daily,
      detentionAnnual: det.annual,
      stateName: det.label,
    };
  }, [youngPeople, state, years, avgCost]);

  return (
    <>
      {/* Hero */}
      <section className="bg-[#0A0A0A] text-white py-16">
        <div className="max-w-6xl mx-auto px-6 sm:px-12">
          <p
            className="text-sm uppercase tracking-[0.3em] text-[#DC2626] mb-4"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Interactive Calculator
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            What If We Chose Differently?
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Drag the sliders. See what happens when you redirect detention spending to
            community alternatives backed by evidence.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 sm:px-12 py-12 space-y-12">
        {/* Controls */}
        <section className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Young people */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#0A0A0A]/40 mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Young People
              </label>
              <input
                type="range"
                min={1}
                max={1000}
                value={youngPeople}
                onChange={(e) => setYoungPeople(Number(e.target.value))}
                className="w-full h-2 bg-[#0A0A0A]/10 rounded-full appearance-none cursor-pointer accent-[#DC2626]"
              />
              <div className="flex justify-between mt-2">
                <span className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {youngPeople}
                </span>
                <div className="flex gap-1">
                  {[10, 50, 100, 500].map((v) => (
                    <button
                      key={v}
                      onClick={() => setYoungPeople(v)}
                      className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                        youngPeople === v
                          ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                          : 'border-[#0A0A0A]/20 hover:border-[#0A0A0A]/40'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* State */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#0A0A0A]/40 mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                State / Territory
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#0A0A0A]/20 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] appearance-none"
              >
                {Object.entries(STATE_DETENTION_COSTS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label} (${val.daily.toLocaleString()}/day)
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#0A0A0A]/30 mt-1">
                Detention cost per day per young person
              </p>
            </div>

            {/* Years */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#0A0A0A]/40 mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Years
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full h-2 bg-[#0A0A0A]/10 rounded-full appearance-none cursor-pointer accent-[#DC2626]"
              />
              <div className="flex justify-between mt-2">
                <span className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {years} {years === 1 ? 'year' : 'years'}
                </span>
                <div className="flex gap-1">
                  {[1, 3, 5, 10].map((v) => (
                    <button
                      key={v}
                      onClick={() => setYears(v)}
                      className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                        years === v
                          ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                          : 'border-[#0A0A0A]/20 hover:border-[#0A0A0A]/40'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Detention */}
          <div className="bg-[#DC2626]/5 rounded-xl border border-[#DC2626]/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
              <span className="text-xs uppercase tracking-wider text-[#DC2626] font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Detention
              </span>
            </div>
            <p className="text-4xl md:text-5xl font-bold text-[#DC2626]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {fmt(calc.detentionTotal)}
            </p>
            <p className="text-sm text-[#0A0A0A]/50 mt-2">
              {youngPeople} young {youngPeople === 1 ? 'person' : 'people'} × {fmtFull(calc.detentionAnnual)}/year × {years} {years === 1 ? 'year' : 'years'}
            </p>
            <p className="text-xs text-[#0A0A0A]/30 mt-1">
              {calc.stateName} — ${calc.detentionDaily.toLocaleString()}/day per young person
            </p>
          </div>

          {/* ALMA Alternative */}
          <div className="bg-[#059669]/5 rounded-xl border border-[#059669]/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-[#059669]" />
              <span className="text-xs uppercase tracking-wider text-[#059669] font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                ALMA Community Models
              </span>
            </div>
            <p className="text-4xl md:text-5xl font-bold text-[#059669]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {fmt(calc.almaTotal)}
            </p>
            <p className="text-sm text-[#0A0A0A]/50 mt-2">
              {youngPeople} young {youngPeople === 1 ? 'person' : 'people'} × {fmtFull(avgCost)}/year × {years} {years === 1 ? 'year' : 'years'}
            </p>
            <p className="text-xs text-[#0A0A0A]/30 mt-1">
              Average across {modelCount} verified community models
            </p>
          </div>
        </section>

        {/* The Difference */}
        <section className="bg-[#0A0A0A] text-white rounded-xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Money Saved
              </p>
              <p className="text-4xl md:text-5xl font-bold text-[#059669]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {fmt(calc.saving)}
              </p>
              <p className="text-sm text-white/50 mt-2">
                redirected from cages to communities
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Cost Ratio
              </p>
              <p className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {calc.ratio}x
              </p>
              <p className="text-sm text-white/50 mt-2">
                cheaper than detention
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Or Instead
              </p>
              <p className="text-4xl md:text-5xl font-bold text-[#059669]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {calc.extraYoungPeople.toLocaleString()}
              </p>
              <p className="text-sm text-white/50 mt-2">
                more young people supported for the same money
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-white/60 max-w-2xl mx-auto">
              For the cost of detaining {youngPeople} young {youngPeople === 1 ? 'person' : 'people'} in{' '}
              {calc.stateName} for {years} {years === 1 ? 'year' : 'years'}, you could support{' '}
              <strong className="text-white">{(youngPeople + calc.extraYoungPeople).toLocaleString()} young people</strong>{' '}
              through community alternatives that actually work.
            </p>
          </div>
        </section>

        {/* NT Spotlight */}
        {state === 'nt' && (
          <section className="bg-[#DC2626]/5 rounded-xl border border-[#DC2626]/20 p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
              <span className="text-sm font-bold text-[#DC2626]">Northern Territory</span>
            </div>
            <p className="text-sm text-[#0A0A0A]/70">
              The NT has the highest detention cost in Australia at <strong>${STATE_DETENTION_COSTS.nt.daily.toLocaleString()}/day</strong> per
              young person — nearly 3x the national average. The NT also has the highest rate of Indigenous
              youth incarceration. Community models like Oonchiumpa in Mparntwe (Alice Springs) achieve better
              outcomes for a fraction of the cost.
            </p>
          </section>
        )}

        {/* CTAs */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/proof"
            className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group"
          >
            <DollarSign className="w-5 h-5 text-[#059669] mb-2" />
            <h3 className="font-bold text-sm mb-1">See the Proof</h3>
            <p className="text-xs text-[#0A0A0A]/50">{modelCount} verified models with evidence and cost data.</p>
            <span className="text-xs font-semibold text-[#059669] mt-2 flex items-center gap-1 group-hover:underline">
              Wall of Proof <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
          <Link
            href="/follow-the-money"
            className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group"
          >
            <TrendingDown className="w-5 h-5 text-[#DC2626] mb-2" />
            <h3 className="font-bold text-sm mb-1">Follow the Money</h3>
            <p className="text-xs text-[#0A0A0A]/50">See where youth justice funding actually goes, state by state.</p>
            <span className="text-xs font-semibold text-[#DC2626] mt-2 flex items-center gap-1 group-hover:underline">
              Funding flows <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
          <Link
            href="/join"
            className="bg-[#0A0A0A] text-white rounded-xl p-5 hover:bg-[#0A0A0A]/90 transition-colors group"
          >
            <Users className="w-5 h-5 text-[#059669] mb-2" />
            <h3 className="font-bold text-white text-sm mb-1">Join the Network</h3>
            <p className="text-xs text-white/50">Add your model to the evidence base.</p>
            <span className="text-xs font-semibold text-[#059669] mt-2 flex items-center gap-1 group-hover:underline">
              Get started <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </section>

        {/* Data sources */}
        <section className="text-center py-4">
          <p className="text-xs text-[#0A0A0A]/30" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Detention costs from ROGS 2024 and state budget papers. ALMA costs averaged from {modelCount} verified
            community models. Calculator for illustrative purposes — actual costs vary by program and location.
          </p>
        </section>
      </div>
    </>
  );
}
