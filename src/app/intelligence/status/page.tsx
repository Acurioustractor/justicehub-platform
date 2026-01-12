"use client";

import React, { useEffect, useState } from 'react';
import { Navigation } from '@/components/ui/navigation';
import { Activity, Server, Shield, Clock, ArrowRight } from 'lucide-react';

type SystemStats = {
    totalServices: number;
    activeSources: number;
    avgConfidence: number;
    pendingJobs: number;
};

type DataSource = {
    id: string;
    name: string;
    type: string;
    reliability_score: number;
    last_successful_scrape: string | null;
    active: boolean;
};

export default function StatusPage() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [sources, setSources] = useState<DataSource[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/intelligence/system-status');
                if (!res.ok) throw new Error('Failed to fetch status');
                const data = await res.json();
                setStats(data.stats);
                setSources(data.sources);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'NEVER';
        return new Date(dateStr).toLocaleString('en-AU', {
            fontFamily: 'monospace',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).toUpperCase();
    };

    return (
        <div className="min-h-screen bg-white text-black font-sans">
            <Navigation />

            <main className="page-content bg-gray-50 min-h-screen">
                <div className="container-justice py-12">
                    {/* Header */}
                    <div className="border-b-2 border-black pb-8 mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <div className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
                                SYSTEM DIAGNOSTICS
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
                                System Status
                            </h1>
                            <p className="text-xl max-w-2xl mt-4 text-gray-700">
                                Real-time telemetry of ALMA intelligence acquisition and processing pipelines.
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                                <span className={`w-3 h-3 ${loading ? 'bg-gray-400' : 'bg-emerald-600 animate-pulse'}`}></span>
                                <span className="font-mono font-bold text-sm uppercase">
                                    {loading ? 'CONNECTING...' : 'LIVE FEED'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                        <StatTile
                            label="Active Sources"
                            value={stats?.activeSources}
                            icon={<Activity className="w-5 h-5" />}
                            sublabel="Online & Polling"
                        />
                        <StatTile
                            label="Discovered Services"
                            value={stats?.totalServices}
                            icon={<Server className="w-5 h-5" />}
                            sublabel="Indexed Records"
                        />
                        <StatTile
                            label="AI Confidence"
                            value={`${stats?.avgConfidence}%`}
                            icon={<Shield className="w-5 h-5" />}
                            sublabel="Avg. Accuracy"
                        />
                        <StatTile
                            label="Queue Depth"
                            value={stats?.pendingJobs}
                            icon={<Clock className="w-5 h-5" />}
                            sublabel="Active Jobs"
                        />
                    </div>

                    {/* Sources List */}
                    <div className="border-2 border-black bg-white">
                        <div className="p-6 border-b-2 border-black bg-gray-100 flex justify-between items-center">
                            <h2 className="font-bold text-lg uppercase tracking-wider">Active Scraper Matrix</h2>
                            <div className="text-xs font-mono text-gray-500">
                                {sources.length} CONFIGURED AGENTS
                            </div>
                        </div>

                        <div className="p-0">
                            {loading ? (
                                <div className="p-12 text-center font-mono text-gray-400">LOADING MATRIX...</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1px bg-black border-collapse">
                                    {sources.map(source => (
                                        <div key={source.id} className="bg-white p-6 hover:bg-gray-50 transition-colors group">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="font-bold text-lg group-hover:text-emerald-700 transition-colors">{source.name}</h3>
                                                {source.active ? (
                                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1 py-0.5 border border-emerald-800 uppercase">Active</span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-1 py-0.5 border border-red-800 uppercase">Offline</span>
                                                )}
                                            </div>

                                            <div className="space-y-3 font-mono text-xs">
                                                <div className="flex justify-between text-gray-500">
                                                    <span>TYPE</span>
                                                    <span className="text-black">{source.type}</span>
                                                </div>
                                                <div className="flex justify-between text-gray-500">
                                                    <span>RELIABILITY</span>
                                                    <span className={`font-bold ${(source.reliability_score || 0) >= 0.8 ? 'text-emerald-700' : 'text-amber-600'
                                                        }`}>
                                                        {Math.round((source.reliability_score || 0) * 100)}%
                                                    </span>
                                                </div>
                                                <div className="pt-3 border-t border-gray-200 flex justify-between text-gray-500">
                                                    <span>LAST SCRAPE</span>
                                                    <span className="text-black">{formatDate(source.last_successful_scrape)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatTile({ label, value, icon, sublabel }: { label: string, value: any, icon: any, sublabel: string }) {
    return (
        <div className="border-2 border-black bg-white p-6 hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all">
            <div className="flex items-center gap-2 text-gray-500 mb-2 font-bold text-xs uppercase tracking-widest">
                {icon} {label}
            </div>
            <div className="text-4xl font-mono font-bold mb-1">
                {value || '-'}
            </div>
            <div className="text-xs text-gray-500 font-mono border-t border-gray-200 pt-2 mt-2">
                {sublabel}
            </div>
        </div>
    )
}
