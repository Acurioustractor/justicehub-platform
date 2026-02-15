"use client";

import React from 'react';
import simulationData from '@/data/portfolio-simulation.json';
import { Navigation } from '@/components/ui/navigation';
import { FileText, Download, ArrowRight, Share2 } from 'lucide-react';

export default function PortfolioReportPage() {
    const { stats, breakdown, topPerformers } = simulationData;

    const fmtMoney = (n: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0, notation: 'compact' }).format(n);

    return (
        <div className="min-h-screen bg-white text-black font-sans">
            <Navigation />

            <main className="page-content bg-gray-50 min-h-screen">
                <div className="container-justice py-12">

                    {/* Document Header - Audit Style */}
                    <div className="bg-white border-2 border-black p-8 md:p-12 mb-8">
                        <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-black pb-8 mb-8 gap-6">
                            <div>
                                <div className="font-mono text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">
                                    REPORT ID: JSH-2026-ALPHA
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4">
                                    The State of<br />Impact Report
                                </h1>
                                <p className="text-xl max-w-2xl text-gray-700">
                                    Independent valuation of the community justice asset class.
                                </p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <div className="inline-block bg-black text-white px-4 py-2 font-mono font-bold text-sm">
                                    STATUS: VERIFIED
                                </div>
                                <div className="font-mono text-sm">
                                    {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        {/* Executive Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Total Net Present Safety (NPS)</div>
                                <div className="text-5xl md:text-6xl font-mono font-bold text-emerald-700">{fmtMoney(stats.totalNPS)}</div>
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Investment Required</div>
                                <div className="text-5xl md:text-6xl font-mono font-bold">{fmtMoney(stats.totalInvestment)}</div>
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Portfolio Yield</div>
                                <div className="text-5xl md:text-6xl font-mono font-bold text-blue-700">{stats.portfolioYield.toFixed(1)}x</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Section 1: Valuation Breakdown */}
                        <div className="border-2 border-black bg-white p-8">
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                                <FileText className="w-6 h-6" /> Valuation Breakdown
                            </h2>
                            <p className="mb-6 text-gray-700">
                                Value distribution across evidence tiers. The "Alpha" opportunity lies in formalising the "Promising" and "Effective" tiers.
                            </p>

                            <div className="space-y-6">
                                {Object.entries(breakdown).map(([key, val]: [string, any]) => (
                                    <div key={key} className="group">
                                        <div className="flex justify-between text-sm mb-1 font-mono font-bold">
                                            <span className="uppercase">{key}</span>
                                            <span>{fmtMoney(val.nps)}</span>
                                        </div>
                                        <div className="w-full h-8 border border-black bg-gray-100 relative">
                                            <div
                                                className="h-full bg-black group-hover:bg-emerald-600 transition-colors"
                                                style={{ width: `${(val.nps / stats.totalNPS) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 2: Top Assets */}
                        <div className="border-2 border-black bg-white p-8">
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                                <TrendingUp className="w-6 h-6" /> High-Yield Assets
                            </h2>
                            <p className="mb-6 text-gray-700">
                                Top performing interventions based on evidence strength, community authority, and scalability.
                            </p>

                            <div className="space-y-0 border border-black">
                                {topPerformers.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border-b border-black last:border-b-0 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="font-mono font-bold text-lg w-8 text-gray-400">0{i + 1}</div>
                                            <div>
                                                <div className="font-bold text-lg leading-none">{item.name}</div>
                                                <div className="text-xs uppercase tracking-widest text-gray-500 mt-1">{item.category}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono font-bold text-emerald-700">{item.yield.toFixed(1)}x</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center">
                        <button className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors flex items-center gap-2">
                            <Download className="w-5 h-5" /> Download Full PDF
                        </button>
                        <button className="bg-white text-black border-2 border-black px-8 py-4 font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors flex items-center gap-2">
                            <Share2 className="w-5 h-5" /> Share Report
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
}

// Icon for header
function TrendingUp({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
    )
}
