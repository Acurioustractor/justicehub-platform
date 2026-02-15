"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, Globe, Shield, AlertTriangle, ArrowRight, TrendingUp, Calculator, Brain, MessageCircle, MapPin } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';

type DashboardData = {
    cortex: {
        interventions: number;
        evidence: number;
        outcomes: number;
        contexts: number;
        evidenceDistribution: Record<string, number>;
    };
    senses: {
        activeSources: number;
        scrapedServices: number;
    };
    conscience: {
        consentDistribution: Record<string, number>;
    };
    health: {
        coverageRatio: number;
    };
};

type Provenance = {
    mode: 'authoritative' | 'computed';
    summary: string;
    generated_at: string;
};

export default function MasterDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [alpha, setAlpha] = useState<any[]>([]); // New Alpha State
    const [statsProvenance, setStatsProvenance] = useState<Provenance | null>(null);
    const [alphaProvenance, setAlphaProvenance] = useState<Provenance | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Global Stats
                const resStats = await fetch('/api/intelligence/global-stats');
                if (resStats.ok) {
                    const jsonStats = await resStats.json();
                    setData(jsonStats);
                    setStatsProvenance(jsonStats.provenance || null);
                }

                // Fetch Alpha Signals
                const resAlpha = await fetch('/api/intelligence/alpha-signals');
                if (resAlpha.ok) {
                    const jsonAlpha = await resAlpha.json();
                    setAlpha(jsonAlpha.opportunities || []);
                    setAlphaProvenance(jsonAlpha.provenance || null);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000); // 1 min poll
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                    <div className="font-mono font-bold uppercase tracking-widest text-sm">Loading Intelligence...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-black font-sans">
            <Navigation />

            <main className="page-content bg-gray-50 min-h-screen">
                <div className="container-justice py-12">

                    {/* Header - Stark & Industrial */}
                    <div className="border-b-2 border-black pb-8 mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <div className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
                                SYSTEM STATUS: ONLINE
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">
                                ALMA Overwatch
                            </h1>
                            <p className="text-xl max-w-2xl mt-4 text-gray-700">
                                Real-time monitoring of intelligence acquisition, evidentiary strength, and market opportunities.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                {statsProvenance && (
                                    <div className="inline-flex items-center gap-2 border border-black bg-white px-3 py-1">
                                        <span className="font-bold uppercase text-amber-700">stats: {statsProvenance.mode}</span>
                                        <span className="text-gray-700">{statsProvenance.summary}</span>
                                    </div>
                                )}
                                {alphaProvenance && (
                                    <div className="inline-flex items-center gap-2 border border-black bg-white px-3 py-1">
                                        <span className="font-bold uppercase text-amber-700">alpha: {alphaProvenance.mode}</span>
                                        <span className="text-gray-700">{alphaProvenance.summary}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <Link href="/centre-of-excellence" className="font-bold underline text-sm uppercase tracking-widest hover:bg-black hover:text-white px-2 py-1 transition-colors">
                                ← Back to Archive
                            </Link>
                        </div>
                    </div>

                    {/* Dashboard Grid - Brutalist Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* COLUMN 1: KNOWLEDGE CORE */}
                        <div className="md:col-span-2 space-y-8">
                            <SectionHeader title="The Cortex (Knowledge)" icon={<Activity className="w-5 h-5" />} />

                            {/* Key Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatBox label="Interventions" value={data?.cortex.interventions} />
                                <StatBox label="Evidence Items" value={data?.cortex.evidence} />
                                <StatBox label="Outcomes" value={data?.cortex.outcomes} />
                                <StatBox label="Contexts" value={data?.cortex.contexts} />
                            </div>

                            {/* Evidence Maturity Profile */}
                            <div className="border-2 border-black bg-white p-6">
                                <h3 className="font-bold uppercase tracking-widest text-sm mb-6 border-b border-gray-200 pb-2">
                                    Evidence Maturity Profile
                                </h3>
                                <div className="space-y-4">
                                    <BarRow
                                        label="Proven / Effective"
                                        count={(data?.cortex.evidenceDistribution['Proven (RCT/quasi-experimental, replicated)'] || 0) + (data?.cortex.evidenceDistribution['Effective (strong evaluation, positive outcomes)'] || 0)}
                                        total={data?.cortex.interventions || 1}
                                        barColor="bg-black"
                                    />
                                    <BarRow
                                        label="Indigenous-Led"
                                        count={data?.cortex.evidenceDistribution['Indigenous-led (culturally grounded, community authority)'] || 0}
                                        total={data?.cortex.interventions || 1}
                                        barColor="bg-emerald-600"
                                    />
                                    <BarRow
                                        label="Promising / Emerging"
                                        count={data?.cortex.evidenceDistribution['Promising (community-endorsed, emerging evidence)'] || 0}
                                        total={data?.cortex.interventions || 1}
                                        barColor="bg-blue-600"
                                    />
                                    <BarRow
                                        label="Untested / Pilot"
                                        count={data?.cortex.evidenceDistribution['Untested (theory/pilot stage)'] || 0}
                                        total={data?.cortex.interventions || 1}
                                        barColor="bg-gray-300"
                                    />
                                </div>
                            </div>

                            {/* Alpha Signals Feed */}
                            <div className="border-2 border-black bg-white">
                                <div className="p-6 border-b-2 border-black flex justify-between items-center bg-gray-50">
                                    <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" /> Alpha Opportunities
                                    </h3>
                                    <span className="text-xs font-mono bg-black text-white px-2 py-1">top 20 signals</span>
                                </div>

                                <div className="max-h-[400px] overflow-y-auto">
                                    {alpha.length === 0 ? (
                                        <div className="p-12 text-center text-gray-500 font-mono text-sm">
                                            Scanning for opportunities...
                                        </div>
                                    ) : (
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-100 font-mono text-xs uppercase border-b border-black">
                                                <tr>
                                                    <th className="p-3 font-bold">Program</th>
                                                    <th className="p-3 font-bold">Status</th>
                                                    <th className="p-3 font-bold text-right">Alpha (α)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {alpha.map((item) => (
                                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                                        <td className="p-3">
                                                            <Link href={`/intelligence/interventions/${item.id}`} className="block">
                                                                <div className="font-bold group-hover:underline">{item.name}</div>
                                                                <div className="text-xs text-gray-500">{item.type}</div>
                                                            </Link>
                                                        </td>
                                                        <td className="p-3">
                                                            <Link href={`/intelligence/interventions/${item.id}`}>
                                                                <Badge status={item.market_status} />
                                                            </Link>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <Link href={`/intelligence/interventions/${item.id}`} className="font-mono font-bold text-emerald-700 hover:text-emerald-900">
                                                                {item.alpha_score}
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* COLUMN 2: SENSES & GOVERNANCE */}
                        <div className="space-y-8">

                            {/* Ingestion Monitor */}
                            <div className="border-2 border-black bg-white p-6">
                                <SectionHeader title="The Senses (Ingestion)" icon={<Globe className="w-5 h-5" />} />

                                <div className="space-y-6 mt-6">
                                    <div>
                                        <div className="text-sm uppercase tracking-widest text-gray-500 mb-1">Active Data Streams</div>
                                        <div className="text-5xl font-mono font-bold">{data?.senses.activeSources}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm uppercase tracking-widest text-gray-500 mb-1">Services Discovered</div>
                                        <div className="text-5xl font-mono font-bold text-emerald-600">{data?.senses.scrapedServices.toLocaleString()}</div>
                                    </div>
                                    <div className="pt-4 border-t border-gray-200">
                                        <Link href="/intelligence/status" className="text-sm font-bold underline flex items-center gap-1 hover:text-emerald-700">
                                            View Source Detail <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Governance Monitor */}
                            <div className="border-2 border-black bg-white p-6">
                                <SectionHeader title="The Conscience (Governance)" icon={<Shield className="w-5 h-5" />} />

                                <div className="grid grid-cols-1 gap-4 mt-6">
                                    <div className="p-4 bg-gray-50 border border-black">
                                        <div className="text-3xl font-mono font-bold">{data?.conscience.consentDistribution['Public Knowledge Commons'] || 0}</div>
                                        <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">Public Commons</div>
                                    </div>
                                    <div className="p-4 bg-orange-50 border border-orange-200">
                                        <div className="text-3xl font-mono font-bold text-orange-700">{data?.conscience.consentDistribution['Community Controlled'] || 0}</div>
                                        <div className="text-xs font-bold uppercase tracking-widest text-orange-700/60 mt-1">Community Controlled</div>
                                    </div>
                                    <div className="p-4 bg-red-50 border border-red-200">
                                        <div className="text-3xl font-mono font-bold text-red-700">{data?.conscience.consentDistribution['Strictly Private'] || 0}</div>
                                        <div className="text-xs font-bold uppercase tracking-widest text-red-700/60 mt-1">Strictly Private</div>
                                    </div>
                                </div>
                            </div>

                            {/* Impact Calculator CTA */}
                            <Link href="/intelligence/impact-calculator" className="block border-2 border-emerald-600 bg-emerald-50 p-6 hover:bg-emerald-100 transition-colors group">
                                <h3 className="font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2 text-emerald-800">
                                    <Calculator className="w-4 h-4" /> Impact Calculator
                                </h3>
                                <p className="text-sm text-emerald-700 mb-3">
                                    Compare the true cost of detention vs community-based services.
                                </p>
                                <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 group-hover:underline">
                                    Calculate Impact <ArrowRight className="w-4 h-4" />
                                </div>
                            </Link>

                            {/* System Map CTA */}
                            <Link href="/intelligence/map" className="block border-2 border-red-600 bg-red-50 p-6 hover:bg-red-100 transition-colors group">
                                <h3 className="font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2 text-red-800">
                                    <MapPin className="w-4 h-4" /> System Map
                                </h3>
                                <p className="text-sm text-red-700 mb-3">
                                    Geographic view of detention centres and programs.
                                </p>
                                <div className="flex items-center gap-2 text-sm font-bold text-red-800 group-hover:underline">
                                    View Map <ArrowRight className="w-4 h-4" />
                                </div>
                            </Link>

                            {/* Research Agent CTA */}
                            <Link href="/intelligence/research" className="block border-2 border-blue-600 bg-blue-50 p-6 hover:bg-blue-100 transition-colors group">
                                <h3 className="font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2 text-blue-800">
                                    <Brain className="w-4 h-4" /> Research Agent
                                </h3>
                                <p className="text-sm text-blue-700 mb-3">
                                    Ask questions and get evidence-based answers from ALMA.
                                </p>
                                <div className="flex items-center gap-2 text-sm font-bold text-blue-800 group-hover:underline">
                                    Start Research <ArrowRight className="w-4 h-4" />
                                </div>
                            </Link>

                            {/* Chat with ALMA CTA */}
                            <Link href="/intelligence/chat" className="block border-2 border-purple-600 bg-purple-50 p-6 hover:bg-purple-100 transition-colors group">
                                <h3 className="font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2 text-purple-800">
                                    <MessageCircle className="w-4 h-4" /> Ask ALMA
                                </h3>
                                <p className="text-sm text-purple-700 mb-3">
                                    Chat conversationally about youth justice evidence.
                                </p>
                                <div className="flex items-center gap-2 text-sm font-bold text-purple-800 group-hover:underline">
                                    Start Chat <ArrowRight className="w-4 h-4" />
                                </div>
                            </Link>

                            {/* Attention Required */}
                            <div className="bg-black text-white p-6 border-2 border-black">
                                <h3 className="font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2 text-red-400">
                                    <AlertTriangle className="w-4 h-4" /> Attention Required
                                </h3>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold">Evidence Gaps Identified</span>
                                    <span className="font-mono text-2xl font-bold text-red-400">
                                        {data?.cortex.interventions ? (data.cortex.interventions - (data.health.coverageRatio || 0) / 100 * data.cortex.interventions).toFixed(0) : 0}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">Programs missing critical outcome data.</p>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Sub-components for Brutalist theme
function SectionHeader({ title, icon }: { title: string, icon: React.ReactNode }) {
    return (
        <h2 className="text-lg font-bold uppercase tracking-widest flex items-center gap-2 border-b-2 border-black pb-2 mb-0">
            {icon} {title}
        </h2>
    );
}

function StatBox({ label, value }: { label: string, value: number | undefined }) {
    return (
        <div className="border-2 border-black bg-white p-4 hover:bg-black hover:text-white transition-colors group">
            <div className="text-3xl font-mono font-bold mb-1 group-hover:text-white">{value || 0}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-400">{label}</div>
        </div>
    );
}

function BarRow({ label, count, total, barColor }: { label: string, count: number, total: number, barColor: string }) {
    const pct = Math.round((count / total) * 100) || 0;
    return (
        <div>
            <div className="flex justify-between text-xs mb-1 font-mono font-bold uppercase">
                <span>{label}</span>
                <span>{count} ({pct}%)</span>
            </div>
            <div className="w-full bg-gray-100 h-4 border border-black">
                <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }}></div>
            </div>
        </div>
    );
}

function Badge({ status }: { status: string }) {
    if (status === 'Undervalued') {
        return <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold uppercase border border-emerald-800">Undervalued</span>;
    }
    if (status === 'Distressed') {
        return <span className="inline-block px-2 py-0.5 bg-red-100 text-red-800 text-xs font-bold uppercase border border-red-800">Distressed</span>;
    }
    return <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-bold uppercase border border-gray-800">{status}</span>;
}
