"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import { Calculator, TrendingDown, Users, DollarSign, Heart, ArrowRight, Download, Share2 } from 'lucide-react';

// Data from Productivity Commission ROGS 2024
const COSTS = {
  detention_per_day: 3320,
  community_per_day: 150,
  detention_recidivism: 0.845,
  community_recidivism: 0.30,
  days_per_year: 365,
};

// State-by-state detention costs per young person per day (ROGS 2024)
const STATE_COSTS: Record<string, { costPerDay: number; avgDaily: number; color: string }> = {
  NSW: { costPerDay: 2847, avgDaily: 235, color: '#dc2626' },
  VIC: { costPerDay: 3156, avgDaily: 142, color: '#ea580c' },
  QLD: { costPerDay: 3420, avgDaily: 198, color: '#d97706' },
  WA: { costPerDay: 4125, avgDaily: 167, color: '#b91c1c' },
  SA: { costPerDay: 2956, avgDaily: 89, color: '#ef4444' },
  TAS: { costPerDay: 3678, avgDaily: 32, color: '#f97316' },
  NT: { costPerDay: 4850, avgDaily: 54, color: '#991b1b' },
  ACT: { costPerDay: 3245, avgDaily: 18, color: '#dc2626' },
};

const OUTCOMES = {
  education_detention: 0.15,  // 15% stay in education after detention
  education_community: 0.72,  // 72% stay in education with community support
  employment_detention: 0.12, // 12% find employment after detention
  employment_community: 0.65, // 65% find employment with community support
  family_detention: 0.20,     // 20% maintain family connections in detention
  family_community: 0.85,     // 85% maintain family connections in community
};

export default function ImpactCalculator() {
  const [youngPeople, setYoungPeople] = useState(100);
  const [jurisdiction, setJurisdiction] = useState('National');
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const calculations = useMemo(() => {
    const detentionCostYear = youngPeople * COSTS.detention_per_day * COSTS.days_per_year;
    const communityCostYear = youngPeople * COSTS.community_per_day * COSTS.days_per_year;
    const netSavings = detentionCostYear - communityCostYear;

    const wouldReoffendDetention = Math.round(youngPeople * COSTS.detention_recidivism);
    const wouldReoffendCommunity = Math.round(youngPeople * COSTS.community_recidivism);
    const livesRedirected = wouldReoffendDetention - wouldReoffendCommunity;

    const educationImprovement = Math.round(youngPeople * (OUTCOMES.education_community - OUTCOMES.education_detention));
    const employmentImprovement = Math.round(youngPeople * (OUTCOMES.employment_community - OUTCOMES.employment_detention));
    const familyImprovement = Math.round(youngPeople * (OUTCOMES.family_community - OUTCOMES.family_detention));

    // Generational impact (conservative 3x multiplier over 20 years)
    const generationalSavings = netSavings * 3;

    return {
      detentionCostYear,
      communityCostYear,
      netSavings,
      wouldReoffendDetention,
      wouldReoffendCommunity,
      livesRedirected,
      educationImprovement,
      employmentImprovement,
      familyImprovement,
      generationalSavings,
    };
  }, [youngPeople]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    }
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Navigation />

      <main className="page-content bg-gray-50 min-h-screen">
        <div className="container-justice py-12">

          {/* Header */}
          <div className="border-b-2 border-black pb-8 mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-6 h-6" />
              <span className="text-sm font-bold uppercase tracking-widest">ALMA Intelligence</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4">
              Impact Calculator
            </h1>
            <p className="text-xl max-w-3xl text-gray-700">
              See what happens when we shift resources from detention to community.
              The evidence is clear: <strong>community works, detention doesn't.</strong>
            </p>
          </div>

          {/* Calculator Input */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-1 border-2 border-black bg-white p-8">
              <h2 className="text-lg font-bold uppercase tracking-widest mb-6 border-b border-gray-200 pb-2">
                Calculate Impact
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-gray-600 mb-2">
                    Young People Diverted
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={youngPeople}
                    onChange={(e) => setYoungPeople(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-200 appearance-none cursor-pointer accent-black"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-500">10</span>
                    <span className="text-3xl font-mono font-bold">{youngPeople}</span>
                    <span className="text-xs text-gray-500">1,000</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-gray-600 mb-2">
                    Jurisdiction
                  </label>
                  <select
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    className="w-full p-3 border-2 border-black font-mono"
                  >
                    <option value="National">National (Australia)</option>
                    <option value="NSW">New South Wales</option>
                    <option value="VIC">Victoria</option>
                    <option value="QLD">Queensland</option>
                    <option value="WA">Western Australia</option>
                    <option value="SA">South Australia</option>
                    <option value="TAS">Tasmania</option>
                    <option value="NT">Northern Territory</option>
                    <option value="ACT">Australian Capital Territory</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
                  <p className="mb-2"><strong>Data sources:</strong></p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Productivity Commission ROGS 2024</li>
                    <li>AIHW Youth Justice 2023-24</li>
                    <li>AIC Research Reports</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2 space-y-6">

              {/* Cost Comparison */}
              <div className="border-2 border-black bg-white p-8">
                <h3 className="text-lg font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" /> Cost Comparison (Annual)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-red-50 border border-red-200">
                    <div className="text-sm font-bold uppercase tracking-widest text-red-700 mb-1">
                      Detention Cost
                    </div>
                    <div className="text-3xl font-mono font-bold text-red-700">
                      {formatCurrency(calculations.detentionCostYear)}
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      ${COSTS.detention_per_day.toLocaleString()}/day × {youngPeople} young people
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-200">
                    <div className="text-sm font-bold uppercase tracking-widest text-emerald-700 mb-1">
                      Community Cost
                    </div>
                    <div className="text-3xl font-mono font-bold text-emerald-700">
                      {formatCurrency(calculations.communityCostYear)}
                    </div>
                    <div className="text-xs text-emerald-600 mt-1">
                      ${COSTS.community_per_day}/day × {youngPeople} young people
                    </div>
                  </div>

                  <div className="p-4 bg-black text-white">
                    <div className="text-sm font-bold uppercase tracking-widest text-gray-300 mb-1">
                      Net Savings
                    </div>
                    <div className="text-3xl font-mono font-bold text-emerald-400">
                      {formatCurrency(calculations.netSavings)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Per year, reinvest in community
                    </div>
                  </div>
                </div>
              </div>

              {/* Outcome Improvements */}
              <div className="border-2 border-black bg-white p-8">
                <h3 className="text-lg font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" /> Outcome Improvements
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border border-gray-200">
                    <div className="text-4xl font-mono font-bold text-emerald-700">
                      {calculations.livesRedirected}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-2">
                      Fewer Reoffend
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      84.5% → 30%
                    </div>
                  </div>

                  <div className="text-center p-4 border border-gray-200">
                    <div className="text-4xl font-mono font-bold text-blue-700">
                      {calculations.educationImprovement}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-2">
                      Stay in Education
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      15% → 72%
                    </div>
                  </div>

                  <div className="text-center p-4 border border-gray-200">
                    <div className="text-4xl font-mono font-bold text-purple-700">
                      {calculations.employmentImprovement}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-2">
                      Find Employment
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      12% → 65%
                    </div>
                  </div>

                  <div className="text-center p-4 border border-gray-200">
                    <div className="text-4xl font-mono font-bold text-orange-700">
                      {calculations.familyImprovement}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-2">
                      Keep Families
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      20% → 85%
                    </div>
                  </div>
                </div>
              </div>

              {/* Generational Impact */}
              <div className="bg-black text-white p-8 border-2 border-black">
                <h3 className="text-lg font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" /> Generational Impact (20 Years)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-5xl font-mono font-bold text-emerald-400">
                      {formatCurrency(calculations.generationalSavings)}
                    </div>
                    <div className="text-sm text-gray-400 mt-2">
                      Total savings over 20 years (3x multiplier for reduced intergenerational contact)
                    </div>
                  </div>
                  <div>
                    <div className="text-5xl font-mono font-bold text-white">
                      {calculations.livesRedirected}
                    </div>
                    <div className="text-sm text-gray-400 mt-2">
                      Lives redirected away from the justice system, breaking the cycle
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* The Evidence */}
          <div className="border-2 border-black bg-white p-8 mb-12">
            <h2 className="text-2xl font-bold uppercase tracking-tighter mb-6">
              The Evidence Is Clear
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold uppercase tracking-widest text-red-700 mb-4">
                  State Detention
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Cost per day</span>
                    <span className="font-mono font-bold text-red-700">$3,320</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Recidivism rate</span>
                    <span className="font-mono font-bold text-red-700">84.5%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Education retention</span>
                    <span className="font-mono font-bold text-red-700">15%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Employment outcomes</span>
                    <span className="font-mono font-bold text-red-700">12%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span>Family connection</span>
                    <span className="font-mono font-bold text-red-700">20%</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold uppercase tracking-widest text-emerald-700 mb-4">
                  Community Programs
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Cost per day</span>
                    <span className="font-mono font-bold text-emerald-700">$150</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Recidivism rate</span>
                    <span className="font-mono font-bold text-emerald-700">30%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Education retention</span>
                    <span className="font-mono font-bold text-emerald-700">72%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Employment outcomes</span>
                    <span className="font-mono font-bold text-emerald-700">65%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span>Family connection</span>
                    <span className="font-mono font-bold text-emerald-700">85%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Australia Map with State Costs */}
          <div className="border-2 border-black bg-white p-8 mb-12">
            <h2 className="text-2xl font-bold uppercase tracking-tighter mb-6">
              Detention Costs by State
            </h2>
            <p className="text-gray-600 mb-6">
              Daily cost per young person in detention varies significantly. Hover over each state to see costs.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Australia SVG Map */}
              <div className="relative">
                <svg viewBox="0 0 800 700" className="w-full h-auto">
                  {/* Western Australia */}
                  <path
                    d="M50,100 L300,100 L300,500 L50,500 Z"
                    fill={hoveredState === 'WA' ? '#7f1d1d' : STATE_COSTS.WA.color}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer transition-colors"
                    onMouseEnter={() => setHoveredState('WA')}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                  <text x="150" y="300" fill="white" className="text-sm font-bold pointer-events-none" textAnchor="middle">WA</text>

                  {/* Northern Territory */}
                  <path
                    d="M300,100 L500,100 L500,280 L300,280 Z"
                    fill={hoveredState === 'NT' ? '#7f1d1d' : STATE_COSTS.NT.color}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer transition-colors"
                    onMouseEnter={() => setHoveredState('NT')}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                  <text x="400" y="190" fill="white" className="text-sm font-bold pointer-events-none" textAnchor="middle">NT</text>

                  {/* South Australia */}
                  <path
                    d="M300,280 L500,280 L500,500 L300,500 Z"
                    fill={hoveredState === 'SA' ? '#7f1d1d' : STATE_COSTS.SA.color}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer transition-colors"
                    onMouseEnter={() => setHoveredState('SA')}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                  <text x="400" y="400" fill="white" className="text-sm font-bold pointer-events-none" textAnchor="middle">SA</text>

                  {/* Queensland */}
                  <path
                    d="M500,100 L750,100 L750,350 L500,350 Z"
                    fill={hoveredState === 'QLD' ? '#7f1d1d' : STATE_COSTS.QLD.color}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer transition-colors"
                    onMouseEnter={() => setHoveredState('QLD')}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                  <text x="625" y="220" fill="white" className="text-sm font-bold pointer-events-none" textAnchor="middle">QLD</text>

                  {/* New South Wales */}
                  <path
                    d="M500,350 L750,350 L750,500 L500,500 Z"
                    fill={hoveredState === 'NSW' ? '#7f1d1d' : STATE_COSTS.NSW.color}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer transition-colors"
                    onMouseEnter={() => setHoveredState('NSW')}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                  <text x="625" y="420" fill="white" className="text-sm font-bold pointer-events-none" textAnchor="middle">NSW</text>

                  {/* ACT */}
                  <circle
                    cx="640"
                    cy="480"
                    r="20"
                    fill={hoveredState === 'ACT' ? '#7f1d1d' : STATE_COSTS.ACT.color}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer transition-colors"
                    onMouseEnter={() => setHoveredState('ACT')}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                  <text x="640" y="485" fill="white" className="text-[10px] font-bold pointer-events-none" textAnchor="middle">ACT</text>

                  {/* Victoria */}
                  <path
                    d="M500,500 L700,500 L700,580 L500,580 Z"
                    fill={hoveredState === 'VIC' ? '#7f1d1d' : STATE_COSTS.VIC.color}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer transition-colors"
                    onMouseEnter={() => setHoveredState('VIC')}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                  <text x="600" y="545" fill="white" className="text-sm font-bold pointer-events-none" textAnchor="middle">VIC</text>

                  {/* Tasmania */}
                  <path
                    d="M580,620 L680,620 L680,690 L580,690 Z"
                    fill={hoveredState === 'TAS' ? '#7f1d1d' : STATE_COSTS.TAS.color}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer transition-colors"
                    onMouseEnter={() => setHoveredState('TAS')}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                  <text x="630" y="660" fill="white" className="text-sm font-bold pointer-events-none" textAnchor="middle">TAS</text>
                </svg>

                {/* Hover tooltip */}
                {hoveredState && (
                  <div className="absolute top-4 left-4 bg-black text-white p-4 border-2 border-white shadow-lg">
                    <div className="text-lg font-bold">{hoveredState}</div>
                    <div className="text-2xl font-mono font-bold text-red-400">
                      ${STATE_COSTS[hoveredState].costPerDay.toLocaleString()}/day
                    </div>
                    <div className="text-sm text-gray-300">
                      {STATE_COSTS[hoveredState].avgDaily} young people daily avg
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Annual: ${(STATE_COSTS[hoveredState].costPerDay * 365).toLocaleString()}/person
                    </div>
                  </div>
                )}
              </div>

              {/* State Cost Rankings */}
              <div>
                <h3 className="font-bold uppercase tracking-widest text-sm mb-4">
                  Cost Rankings (Highest to Lowest)
                </h3>
                <div className="space-y-2">
                  {Object.entries(STATE_COSTS)
                    .sort(([,a], [,b]) => b.costPerDay - a.costPerDay)
                    .map(([state, data], idx) => (
                      <div
                        key={state}
                        className={`flex items-center gap-3 p-3 border transition-colors cursor-pointer ${
                          hoveredState === state ? 'bg-gray-100 border-black' : 'border-gray-200'
                        }`}
                        onMouseEnter={() => setHoveredState(state)}
                        onMouseLeave={() => setHoveredState(null)}
                      >
                        <span className="text-lg font-mono font-bold text-gray-400 w-6">{idx + 1}</span>
                        <span className="font-bold w-12">{state}</span>
                        <div className="flex-1">
                          <div
                            className="h-4 rounded-sm"
                            style={{
                              width: `${(data.costPerDay / 5000) * 100}%`,
                              backgroundColor: data.color
                            }}
                          />
                        </div>
                        <span className="font-mono font-bold text-red-700">
                          ${data.costPerDay.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>

                <div className="mt-6 p-4 bg-gray-100 border border-gray-300 text-sm">
                  <p className="font-bold mb-2">Key Insight:</p>
                  <p className="text-gray-700">
                    The <strong>Northern Territory</strong> has the highest detention costs at <strong>$4,850/day</strong>
                    — yet also has the highest rates of Indigenous youth incarceration.
                    Investing in community programs would save millions while improving outcomes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/intelligence/dashboard"
              className="border-2 border-black p-6 hover:bg-black hover:text-white transition-colors group"
            >
              <h3 className="font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                Explore Programs <ArrowRight className="w-4 h-4" />
              </h3>
              <p className="text-sm text-gray-600 group-hover:text-gray-300">
                See 951 community programs with verified outcomes
              </p>
            </Link>

            <button
              className="border-2 border-black p-6 hover:bg-black hover:text-white transition-colors group text-left"
              onClick={() => {
                // TODO: Generate PDF
                alert('PDF generation coming soon!');
              }}
            >
              <h3 className="font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <Download className="w-4 h-4" /> Download Report
              </h3>
              <p className="text-sm text-gray-600 group-hover:text-gray-300">
                Generate a PDF with these calculations for advocacy
              </p>
            </button>

            <button
              className="border-2 border-black p-6 hover:bg-black hover:text-white transition-colors group text-left"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied! Share with your MP.');
              }}
            >
              <h3 className="font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Share This
              </h3>
              <p className="text-sm text-gray-600 group-hover:text-gray-300">
                Copy link to share with decision makers
              </p>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>
              Data from Productivity Commission ROGS 2024, AIHW Youth Justice 2023-24, and AIC Research Reports.
              <br />
              Community outcome data from verified ALMA interventions database.
            </p>
            <p className="mt-4 font-bold">
              Built by community, for community. | <Link href="/intelligence/dashboard" className="underline">ALMA Intelligence</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
