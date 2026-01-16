"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import {
  Search, Brain, AlertCircle, CheckCircle, Loader2, ArrowRight,
  Lightbulb, Database, ExternalLink, Clock, ChevronRight
} from 'lucide-react';

type ResearchSession = {
  id: string;
  query: string;
  status: string;
  depth: string;
  createdAt: string;
  completedAt?: string;
};

type ResearchResult = {
  query: string;
  interventions: {
    id: string;
    name: string;
    type: string;
    geography: string;
    evidenceLevel: string;
    evidenceCount: number;
    outcomeCount: number;
  }[];
  summary: string;
  evidenceGaps: {
    intervention_id: string;
    intervention_name: string;
    gap_severity: string;
    gap_description: string;
  }[];
  recommendations: string[];
  executionTimeMs: number;
};

export default function ResearchPage() {
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<'quick' | 'thorough' | 'comprehensive'>('quick');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<ResearchSession[]>([]);

  // Load recent sessions on mount
  useEffect(() => {
    fetchRecentSessions();
  }, []);

  const fetchRecentSessions = async () => {
    try {
      const res = await fetch('/api/intelligence/research?limit=5');
      if (res.ok) {
        const data = await res.json();
        setRecentSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to fetch recent sessions:', err);
    }
  };

  const handleResearch = async () => {
    if (!query.trim() || query.trim().length < 3) {
      setError('Please enter a research question (at least 3 characters)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/intelligence/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), depth }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Research failed');
      }

      const data = await res.json();

      if (data.status === 'complete') {
        setResult(data.results);
        fetchRecentSessions(); // Refresh list
      } else {
        // For thorough/comprehensive, would need to poll
        setError('Research in progress. Check back later for results.');
      }

    } catch (err: any) {
      console.error('Research error:', err);
      setError(err.message || 'Failed to execute research');
    } finally {
      setIsLoading(false);
    }
  };

  const exampleQueries = [
    "What programs reduce youth recidivism in NT?",
    "Indigenous-led interventions with evidence",
    "Diversion programs in Queensland",
    "Cultural healing effectiveness",
    "Justice reinvestment outcomes",
  ];

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Navigation />

      <main className="page-content bg-gray-50 min-h-screen">
        <div className="container-justice py-12">

          {/* Header */}
          <div className="border-b-2 border-black pb-8 mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-8 h-8" />
              <div className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                Research Agent
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
              ALMA Research
            </h1>
            <p className="text-xl max-w-3xl mt-4 text-gray-700">
              Ask questions about youth justice interventions. ALMA searches the knowledge base,
              analyzes evidence, identifies gaps, and synthesizes findings.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Research Panel */}
            <div className="lg:col-span-2 space-y-6">

              {/* Search Box */}
              <div className="border-2 border-black bg-white p-6">
                <label className="block font-bold uppercase tracking-widest text-sm mb-4">
                  Research Question
                </label>

                <div className="relative">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., What programs effectively reduce youth incarceration in the Northern Territory?"
                    className="w-full border-2 border-black p-4 pr-12 text-lg font-mono resize-none h-32 focus:outline-none focus:ring-2 focus:ring-black"
                    disabled={isLoading}
                  />
                  <Search className="absolute right-4 top-4 w-6 h-6 text-gray-400" />
                </div>

                {/* Depth Selection */}
                <div className="flex gap-4 mt-4">
                  <label className="text-sm font-bold uppercase tracking-widest text-gray-500">Depth:</label>
                  <div className="flex gap-2">
                    {(['quick', 'thorough', 'comprehensive'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDepth(d)}
                        className={`px-3 py-1 text-xs font-bold uppercase border-2 transition-colors ${
                          depth === d
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-black border-gray-300 hover:border-black'
                        }`}
                        disabled={isLoading}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Research Button */}
                <button
                  onClick={handleResearch}
                  disabled={isLoading || !query.trim()}
                  className="mt-6 w-full bg-black text-white py-4 font-bold uppercase tracking-widest text-lg hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      Run Research
                    </>
                  )}
                </button>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}
              </div>

              {/* Example Queries */}
              <div className="border-2 border-gray-200 bg-white p-6">
                <h3 className="font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Example Questions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {exampleQueries.map((eq) => (
                    <button
                      key={eq}
                      onClick={() => setQuery(eq)}
                      className="px-3 py-2 text-sm border border-gray-300 hover:border-black hover:bg-gray-50 transition-colors"
                    >
                      {eq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              {result && (
                <div className="border-2 border-black bg-white">
                  <div className="p-6 border-b-2 border-black bg-emerald-50 flex items-center justify-between">
                    <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2 text-emerald-800">
                      <CheckCircle className="w-5 h-5" /> Research Complete
                    </h3>
                    <span className="text-xs font-mono text-emerald-700">
                      {result.executionTimeMs}ms
                    </span>
                  </div>

                  <div className="p-6">
                    {/* Summary */}
                    <div className="prose prose-sm max-w-none mb-8">
                      <div dangerouslySetInnerHTML={{
                        __html: result.summary
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/## (.*?)\n/g, '<h3 class="text-lg font-bold uppercase tracking-widest mt-6 mb-3">$1</h3>')
                          .replace(/### (.*?)\n/g, '<h4 class="text-md font-bold uppercase tracking-widest mt-4 mb-2">$1</h4>')
                          .replace(/- (.*?)\n/g, '<li class="ml-4">$1</li>')
                          .replace(/\n\n/g, '<br/><br/>')
                      }} />
                    </div>

                    {/* Interventions Found */}
                    {result.interventions.length > 0 && (
                      <div className="mb-8">
                        <h4 className="font-bold uppercase tracking-widest text-sm mb-4 border-b border-gray-200 pb-2">
                          Interventions Found ({result.interventions.length})
                        </h4>
                        <div className="space-y-3">
                          {result.interventions.map((intervention) => (
                            <Link
                              key={intervention.id}
                              href={`/intelligence/interventions/${intervention.id}`}
                              className="block p-4 border border-gray-200 hover:border-black hover:bg-gray-50 transition-colors group"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-bold group-hover:underline">{intervention.name}</div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    {intervention.type} • {intervention.geography}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-mono">
                                    {intervention.evidenceCount} evidence • {intervention.outcomeCount} outcomes
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {intervention.evidenceLevel || 'Unknown level'}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evidence Gaps */}
                    {result.evidenceGaps.length > 0 && (
                      <div className="mb-8">
                        <h4 className="font-bold uppercase tracking-widest text-sm mb-4 border-b border-gray-200 pb-2 text-orange-700">
                          Evidence Gaps Identified ({result.evidenceGaps.length})
                        </h4>
                        <div className="space-y-2">
                          {result.evidenceGaps.slice(0, 5).map((gap) => (
                            <div
                              key={gap.intervention_id}
                              className="p-3 bg-orange-50 border border-orange-200 text-sm"
                            >
                              <div className="font-bold">{gap.intervention_name}</div>
                              <div className="text-orange-700">{gap.gap_description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {result.recommendations.length > 0 && (
                      <div className="p-4 bg-blue-50 border border-blue-200">
                        <h4 className="font-bold uppercase tracking-widest text-xs mb-3 text-blue-800">
                          Recommendations
                        </h4>
                        <ul className="space-y-2">
                          {result.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-blue-900">
                              <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">

              {/* Recent Sessions */}
              <div className="border-2 border-black bg-white p-6">
                <h3 className="font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Recent Research
                </h3>

                {recentSessions.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent research sessions</p>
                ) : (
                  <div className="space-y-3">
                    {recentSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-3 border border-gray-200 hover:border-black cursor-pointer transition-colors"
                        onClick={() => setQuery(session.query)}
                      >
                        <div className="text-sm font-medium line-clamp-2">{session.query}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 ${
                            session.status === 'complete'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {session.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* About Research Agent */}
              <div className="border-2 border-gray-200 bg-white p-6">
                <h3 className="font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4" /> How It Works
                </h3>
                <div className="space-y-4 text-sm text-gray-700">
                  <div>
                    <strong className="text-black">1. Plan</strong>
                    <p>Breaks your question into research tasks</p>
                  </div>
                  <div>
                    <strong className="text-black">2. Search</strong>
                    <p>Queries ALMA knowledge base for relevant data</p>
                  </div>
                  <div>
                    <strong className="text-black">3. Validate</strong>
                    <p>Checks evidence quality and identifies gaps</p>
                  </div>
                  <div>
                    <strong className="text-black">4. Synthesize</strong>
                    <p>Generates summary with recommendations</p>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="border-2 border-black bg-black text-white p-6">
                <h3 className="font-bold uppercase tracking-widest text-sm mb-4">
                  Related Tools
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/intelligence/dashboard"
                    className="flex items-center justify-between py-2 hover:text-emerald-300 transition-colors"
                  >
                    <span>ALMA Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/intelligence/impact-calculator"
                    className="flex items-center justify-between py-2 hover:text-emerald-300 transition-colors"
                  >
                    <span>Impact Calculator</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/intelligence/interventions"
                    className="flex items-center justify-between py-2 hover:text-emerald-300 transition-colors"
                  >
                    <span>Browse Interventions</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
