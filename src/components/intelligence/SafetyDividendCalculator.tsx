"use client";

import React, { useState, useEffect } from 'react';

// Standard Government Figures (Configurable)
const COST_OF_FAILURE_PER_YEAR = 160000; // Cost of incarceration/detention per year
const DEFAULT_DISCOUNT_RATE = 0.05; // 5% discount rate

type CalculatorProps = {
    initialCost?: number;
    initialParticipants?: number;
    initialEvidenceLevel?: string;
    programName?: string;
};

export function SafetyDividendCalculator({
    initialCost = 150000,
    initialParticipants = 50,
    initialEvidenceLevel = 'Promising',
    programName = "Your Program"
}: CalculatorProps) {

    // Inputs
    const [cost, setCost] = useState(initialCost);
    const [participants, setParticipants] = useState(initialParticipants);
    const [evidenceLevel, setEvidenceLevel] = useState(initialEvidenceLevel);

    // Derived Values
    const [successRate, setSuccessRate] = useState(0.2); // Default 20%
    const [avoidedCost, setAvoidedCost] = useState(0);
    const [netPresentSafety, setNetPresentSafety] = useState(0);
    const [yieldRatio, setYieldRatio] = useState(0);

    // Update success rate based on Evidence Level
    useEffect(() => {
        let rate = 0.1; // Baseline/Untested
        if (evidenceLevel.includes('Proven')) rate = 0.45;
        else if (evidenceLevel.includes('Effective') || evidenceLevel.includes('Indigenous-led')) rate = 0.35;
        else if (evidenceLevel.includes('Promising')) rate = 0.20;
        setSuccessRate(rate);
    }, [evidenceLevel]);

    // Calculate Core Metrics
    useEffect(() => {
        // Value Created = Participants * Success Rate * Cost of Failure (Avoided) of 1 year
        // Note: This is a conservative 1-year estimate. A full DCF would project 5-10 years.
        const value = participants * successRate * COST_OF_FAILURE_PER_YEAR;
        setAvoidedCost(value);

        const nps = value - cost;
        setNetPresentSafety(nps);

        const ratio = cost > 0 ? (value / cost) : 0;
        setYieldRatio(ratio);
    }, [cost, participants, successRate]);

    // Formatting
    const fmtMoney = (n: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n);
    const fmtRatio = (n: number) => `${n.toFixed(1)}x`;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto font-sans">

            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 p-8 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-emerald-500/30 text-emerald-100 text-xs font-bold px-2 py-1 rounded uppercase tracking-widest border border-emerald-400/30">
                                Quantitative Justice
                            </span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight">The Safety Dividend</h2>
                        <p className="text-emerald-100 mt-2 max-w-xl text-lg opacity-90">
                            Measuring the <strong className="text-white">avoided cost</strong> of harm is the only way to see the true value of community investment.
                        </p>
                    </div>
                    {/* The Big Yield Badge */}
                    <div className="hidden md:flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <span className="text-emerald-200 text-xs uppercase tracking-widest font-bold mb-1">Dividend Yield</span>
                        <div className="text-5xl font-black text-white tracking-tighter">{fmtRatio(yieldRatio)}</div>
                        <div className="text-xs text-emerald-100 font-medium bg-emerald-500/50 px-2 py-0.5 rounded-full mt-1">Social ROI</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12">

                {/* Visualizer (Left) */}
                <div className="md:col-span-8 p-8 space-y-8 bg-gray-50/50">

                    {/* The Balance Sheet */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Community Balance Sheet</h3>

                        <div className="relative pt-6">
                            {/* Bar Chart Container */}
                            <div className="flex items-end h-16 gap-1 mb-2">
                                {/* Cost Bar */}
                                <div className="h-full w-full flex flex-col justify-end">
                                    <div className="w-full bg-gray-300 rounded-t-sm relative group" style={{ height: '20%' }}>
                                        <div className="absolute -top-6 left-0 right-0 text-center text-xs font-bold text-gray-500">{fmtMoney(cost)}</div>
                                    </div>
                                    <div className="text-center text-xs text-gray-400 font-bold mt-2 uppercase">Cost</div>
                                </div>
                                <div className="text-gray-300 pb-8 text-xl font-light">vs</div>

                                {/* Value Bar (Animated) */}
                                <div className="h-full w-full flex flex-col justify-end">
                                    <div className="w-full bg-emerald-500 rounded-t-sm relative group shadow-[0_0_20px_rgba(16,185,129,0.3)]" style={{ height: '100%' }}>
                                        <div className="absolute -top-8 left-0 right-0 text-center text-lg font-bold text-emerald-600">{fmtMoney(avoidedCost)}</div>
                                    </div>
                                    <div className="text-center text-xs text-emerald-600 font-bold mt-2 uppercase">Value Created</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Net Present Safety (NPS)</div>
                                    <div className="text-gray-500 text-sm">Total Avoided Cost to Taxpayer</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-gray-900">{fmtMoney(netPresentSafety)}</div>
                                    <div className="text-emerald-600 text-xs font-bold flex justify-end items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                        Positive Asset
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-sm text-gray-500">
                        <p>
                            Based on a standard incarceration cost of <strong>{fmtMoney(COST_OF_FAILURE_PER_YEAR)}/year</strong>, extracting just {(participants * successRate).toFixed(1)} young people ({(successRate * 100).toFixed(0)}% success rate) from the justice system generates massive fiscal space.
                        </p>
                    </div>

                </div>

                {/* Controls (Right) */}
                <div className="md:col-span-4 bg-white border-l border-gray-200 p-8 space-y-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Input Variables</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Program Cost (Annual)</label>
                            <input
                                type="number"
                                value={cost}
                                onChange={(e) => setCost(Number(e.target.value))}
                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded font-mono text-sm focus:border-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Participants</label>
                            <input
                                type="number"
                                value={participants}
                                onChange={(e) => setParticipants(Number(e.target.value))}
                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded font-mono text-sm focus:border-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Evidence Strength</label>
                            <select
                                value={evidenceLevel}
                                onChange={(e) => setEvidenceLevel(e.target.value)}
                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:border-emerald-500 outline-none"
                            >
                                <option value="Untested">Untested (10% proj. success)</option>
                                <option value="Promising">Promising (20% proj. success)</option>
                                <option value="Effective">Effective (35% proj. success)</option>
                                <option value="Indigenous-led">Indigenous-led (35% proj. success)</option>
                                <option value="Proven">Proven (45% proj. success)</option>
                            </select>
                            <div className="text-[10px] text-gray-400 mt-1 text-right">Proj. Success Impact: {(successRate * 100).toFixed(0)}%</div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase">Yield Multiplier</span>
                            <span className="text-xl font-bold text-emerald-600">{fmtRatio(yieldRatio)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(yieldRatio * 5, 100)}%` }}></div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
