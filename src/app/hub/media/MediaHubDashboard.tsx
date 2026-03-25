'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Newspaper, ArrowLeft, ExternalLink, TrendingUp, TrendingDown, Minus,
  FileText, Database, BookOpen, MapPin, BarChart3, Quote, Loader2, Copy, Check,
} from 'lucide-react';
import { HubMediaGallery } from '../components/HubMediaGallery';

interface MediaArticle {
  id: string;
  headline: string;
  source_name: string | null;
  published_date: string | null;
  url: string | null;
  state?: string | null;
  sentiment?: string | null;
}

interface MediaHubDashboardProps {
  userName: string;
  userState: string;
  latestMedia: MediaArticle[];
  stateMedia: MediaArticle[];
  totalMedia: number;
  totalEvidence: number;
  totalInterventions: number;
  sentimentCounts: { positive: number; negative: number; neutral: number };
}

const SENTIMENT_CONFIG = {
  positive: { icon: TrendingUp, color: 'text-[#059669]', bg: 'bg-[#059669]/10' },
  negative: { icon: TrendingDown, color: 'text-[#DC2626]', bg: 'bg-[#DC2626]/10' },
  neutral: { icon: Minus, color: 'text-[#F5F0E8]/40', bg: 'bg-[#F5F0E8]/5' },
};

export function MediaHubDashboard({
  userName,
  userState,
  latestMedia,
  stateMedia,
  totalMedia,
  totalEvidence,
  totalInterventions,
  sentimentCounts,
}: MediaHubDashboardProps) {
  const totalSentiment = sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral;

  // Fetch briefings
  const [briefings, setBriefings] = useState<{
    talking_points: Array<{ category: string; point: string; source: string; sourceUrl: string }>;
    proven_programs: Array<{ name: string; evidence_level: string; org_name: string | null; state: string | null }>;
  } | null>(null);
  const [briefingsLoading, setBriefingsLoading] = useState(true);
  const [copiedPoint, setCopiedPoint] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/hub/briefings?type=media${userState ? `&state=${userState}` : ''}`)
      .then(r => r.json())
      .then(data => setBriefings(data))
      .catch(() => {})
      .finally(() => setBriefingsLoading(false));
  }, [userState]);

  function copyPoint(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedPoint(index);
    setTimeout(() => setCopiedPoint(null), 2000);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8]">
      {/* Header */}
      <div className="border-b border-[#F5F0E8]/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/hub" className="text-[#F5F0E8]/40 hover:text-[#F5F0E8] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Newspaper className="w-5 h-5 text-blue-500" />
            <span className="font-mono text-xs text-blue-500">MEDIA HUB</span>
          </div>
          <span className="font-mono text-xs text-[#F5F0E8]/40">{userName}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Media Intelligence
          </h1>
          <p className="text-sm text-[#F5F0E8]/50 mt-1 font-mono">
            Data-driven briefings for journalists and storytellers covering youth justice
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="border border-[#F5F0E8]/10 p-4">
            <p className="font-mono text-[10px] text-[#F5F0E8]/40 uppercase">Media Tracked</p>
            <p className="text-2xl font-bold mt-1">{totalMedia.toLocaleString()}</p>
            <p className="text-[10px] text-[#F5F0E8]/30 font-mono">articles</p>
          </div>
          <div className="border border-[#F5F0E8]/10 p-4">
            <p className="font-mono text-[10px] text-[#F5F0E8]/40 uppercase">Evidence Base</p>
            <p className="text-2xl font-bold mt-1">{totalEvidence.toLocaleString()}</p>
            <p className="text-[10px] text-[#F5F0E8]/30 font-mono">studies & reports</p>
          </div>
          <div className="border border-[#F5F0E8]/10 p-4">
            <p className="font-mono text-[10px] text-[#F5F0E8]/40 uppercase">Programs</p>
            <p className="text-2xl font-bold mt-1">{totalInterventions.toLocaleString()}</p>
            <p className="text-[10px] text-[#F5F0E8]/30 font-mono">verified interventions</p>
          </div>
          <div className="border border-[#F5F0E8]/10 p-4">
            <p className="font-mono text-[10px] text-[#F5F0E8]/40 uppercase">Sentiment</p>
            <div className="flex items-center gap-2 mt-1">
              {totalSentiment > 0 ? (
                <>
                  <span className="text-[#DC2626] font-bold">{Math.round(sentimentCounts.negative / totalSentiment * 100)}%</span>
                  <span className="text-[#F5F0E8]/20">|</span>
                  <span className="text-[#059669] font-bold">{Math.round(sentimentCounts.positive / totalSentiment * 100)}%</span>
                </>
              ) : (
                <span className="text-[#F5F0E8]/30">—</span>
              )}
            </div>
            <p className="text-[10px] text-[#F5F0E8]/30 font-mono">negative vs positive</p>
          </div>
        </div>

        {/* Talking Points — the key value-add */}
        <div className="border border-blue-500/20 bg-blue-500/5 p-6 mb-8">
          <h2 className="font-mono text-xs text-blue-500 mb-4 uppercase tracking-wider flex items-center gap-2">
            <Quote className="w-4 h-4" /> Data Talking Points
          </h2>
          <p className="text-sm text-[#F5F0E8]/50 mb-4">
            Copy-ready data points for your reporting — sourced from live JusticeHub data
          </p>
          {briefingsLoading ? (
            <div className="flex items-center gap-2 text-sm text-[#F5F0E8]/30">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading briefings...
            </div>
          ) : briefings?.talking_points ? (
            <div className="space-y-3">
              {briefings.talking_points.map((tp, i) => (
                <div key={i} className="p-3 border border-[#F5F0E8]/10 bg-[#0A0A0A]/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 uppercase">
                        {tp.category}
                      </span>
                      <p className="text-sm mt-1.5 leading-relaxed">{tp.point}</p>
                      <Link href={tp.sourceUrl} className="text-[10px] font-mono text-[#F5F0E8]/30 hover:text-blue-400 mt-1 inline-block">
                        Source: {tp.source}
                      </Link>
                    </div>
                    <button
                      onClick={() => copyPoint(tp.point, i)}
                      className="shrink-0 p-1.5 text-[#F5F0E8]/20 hover:text-blue-400 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedPoint === i ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main: Latest coverage */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-6">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-4 uppercase tracking-wider">Latest Coverage</h2>
              <div className="space-y-3">
                {latestMedia.map((article) => {
                  const sentConfig = article.sentiment ? SENTIMENT_CONFIG[article.sentiment.toLowerCase() as keyof typeof SENTIMENT_CONFIG] : null;
                  const SentIcon = sentConfig?.icon || Minus;
                  return (
                    <a
                      key={article.id}
                      href={article.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 border border-[#F5F0E8]/5 hover:border-[#F5F0E8]/15 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm leading-tight">{article.headline}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-[#F5F0E8]/40">
                            {article.source_name && <span>{article.source_name}</span>}
                            {article.published_date && (
                              <>
                                <span className="text-[#F5F0E8]/20">·</span>
                                <span>{new Date(article.published_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </>
                            )}
                            {article.state && (
                              <>
                                <span className="text-[#F5F0E8]/20">·</span>
                                <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{article.state}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {sentConfig && (
                            <span className={`p-1 ${sentConfig.bg}`}>
                              <SentIcon className={`w-3 h-3 ${sentConfig.color}`} />
                            </span>
                          )}
                          <ExternalLink className="w-3 h-3 text-[#F5F0E8]/20" />
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
              <Link
                href="/intelligence?tab=media"
                className="block mt-4 text-xs font-mono text-[#DC2626] hover:underline"
              >
                Browse all {totalMedia} articles →
              </Link>
            </div>

            {/* Data Briefing Cards */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-6">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-4 uppercase tracking-wider">Data Briefings</h2>
              <p className="text-sm text-[#F5F0E8]/50 mb-4">
                Ready-to-use data points for your reporting
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/intelligence" className="p-4 border border-[#F5F0E8]/10 hover:border-blue-500/30 transition-colors">
                  <Database className="w-5 h-5 text-blue-500/60 mb-2" />
                  <p className="font-bold text-sm">ALMA Evidence</p>
                  <p className="text-[10px] text-[#F5F0E8]/40 font-mono mt-1">{totalEvidence} studies — what works in youth justice</p>
                </Link>
                <Link href="/justice-funding" className="p-4 border border-[#F5F0E8]/10 hover:border-blue-500/30 transition-colors">
                  <BarChart3 className="w-5 h-5 text-blue-500/60 mb-2" />
                  <p className="font-bold text-sm">Follow the Money</p>
                  <p className="text-[10px] text-[#F5F0E8]/40 font-mono mt-1">146K+ funding records — who funds what</p>
                </Link>
                <Link href="/organizations" className="p-4 border border-[#F5F0E8]/10 hover:border-blue-500/30 transition-colors">
                  <BookOpen className="w-5 h-5 text-blue-500/60 mb-2" />
                  <p className="font-bold text-sm">Organisation Directory</p>
                  <p className="text-[10px] text-[#F5F0E8]/40 font-mono mt-1">82K+ orgs — find sources and experts</p>
                </Link>
                <Link href="/contained" className="p-4 border border-[#F5F0E8]/10 hover:border-blue-500/30 transition-colors">
                  <FileText className="w-5 h-5 text-blue-500/60 mb-2" />
                  <p className="font-bold text-sm">CONTAINED Campaign</p>
                  <p className="text-[10px] text-[#F5F0E8]/40 font-mono mt-1">National tour — dates, partners, background</p>
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Photo & Video Gallery */}
            <HubMediaGallery accentColor="blue-500" title="Photo & Video Library" />

            {/* Regional coverage */}
            {userState && stateMedia.length > 0 && (
              <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-5">
                <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-3 uppercase tracking-wider">
                  {userState} Coverage
                </h2>
                <div className="space-y-2">
                  {stateMedia.map((article) => (
                    <a
                      key={article.id}
                      href={article.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm hover:text-blue-400 transition-colors leading-tight"
                    >
                      {article.headline}
                      <span className="text-[10px] font-mono text-[#F5F0E8]/30 block mt-0.5">
                        {article.source_name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Press Kit / Resources */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-5">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-3 uppercase tracking-wider">Press Resources</h2>
              <div className="space-y-2">
                <Link href="/contained/tour/social" className="block text-sm hover:text-blue-400 transition-colors">
                  Social media kit →
                </Link>
                <Link href="/contained" className="block text-sm hover:text-blue-400 transition-colors">
                  Campaign press page →
                </Link>
                <Link href="/stories" className="block text-sm hover:text-blue-400 transition-colors">
                  Community stories →
                </Link>
              </div>
            </div>

            {/* ALMA Chat */}
            <div className="border border-blue-500/20 bg-blue-500/5 p-5">
              <h2 className="font-mono text-xs text-blue-500 mb-2 uppercase tracking-wider">AI Research Assistant</h2>
              <p className="text-xs text-[#F5F0E8]/50 mb-3">
                Ask ALMA about youth justice data, interventions, and evidence
              </p>
              <Link
                href="/intelligence?chat=true"
                className="block text-center py-2 bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors"
              >
                Open ALMA Chat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
