'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, ExternalLink, TrendingUp, TrendingDown, Minus, AlertTriangle, Newspaper, Scale, Lightbulb, DollarSign, Users, BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';

interface PulseData {
  period_days: number;
  generated_at: string;
  stats: {
    government_statements: number;
    media_articles: number;
    new_evidence: number;
    civic_alerts: number;
    media_sentiment: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
  government: {
    statements: Array<{
      id: string;
      headline: string;
      minister_name: string;
      portfolio: string;
      published_at: string;
      summary: string;
      source_url: string;
      topics: string[];
      jurisdiction: string;
      mentioned_amounts: Record<string, unknown> | null;
      mentioned_orgs: Record<string, unknown> | null;
    }>;
    hansard: Array<{
      id: string;
      title: string;
      speaker: string;
      party: string;
      chamber: string;
      spoken_at: string;
      summary: string;
      source_url: string;
      topics: string[];
    }>;
  };
  media: Array<{
    id: string;
    headline: string;
    source_name: string;
    published_date: string | null;
    sentiment: string;
    topics: string[];
    summary: string;
    url: string;
  }>;
  evidence: {
    new_sources: Array<{
      id: string;
      title: string;
      source_url: string;
      evidence_type: string;
      created_at: string;
    }>;
    findings: Array<{
      id: string;
      finding_type: string;
      confidence: string;
      content: Record<string, unknown>;
      sources: string[];
      created_at: string;
    }>;
  };
  alerts: Array<{
    id: string;
    title: string;
    alert_type: string;
    severity: string;
    summary: string;
    source_url: string;
    created_at: string;
  }>;
  opportunities: Array<{
    id: string;
    name: string;
    funder_name: string;
    source_type: string;
    category: string;
    min_grant_amount: number | null;
    max_grant_amount: number | null;
    deadline: string;
    status: string;
    jurisdictions: string[];
    source_url: string;
    application_url: string;
  }>;
  interventions: Array<{
    id: string;
    name: string;
    evidence_level: string;
    operating_organization: string;
    cost_per_young_person: number | null;
    created_at: string;
  }>;
  stories: Array<{
    id: string;
    title: string;
    excerpt: string;
    image_url: string;
    published_at: string;
    slug: string;
  }>;
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  if (sentiment === 'positive') return <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 bg-[#059669]/10 text-[#059669]"><TrendingUp className="w-3 h-3" /> Positive</span>;
  if (sentiment === 'negative') return <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 bg-[#DC2626]/10 text-[#DC2626]"><TrendingDown className="w-3 h-3" /> Negative</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 bg-[#0A0A0A]/5 text-[#0A0A0A]/50"><Minus className="w-3 h-3" /> Neutral</span>;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Closed';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `${diff} days`;
}

export default function PulsePage() {
  const [data, setData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState<'government' | 'media' | 'evidence' | 'opportunities'>('government');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/pulse?days=${period}`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const tabs = [
    { key: 'government' as const, label: 'Government', icon: Scale, count: data?.stats.government_statements || 0 },
    { key: 'media' as const, label: 'Media', icon: Newspaper, count: data?.stats.media_articles || 0 },
    { key: 'evidence' as const, label: 'Evidence', icon: BookOpen, count: data?.stats.new_evidence || 0 },
    { key: 'opportunities' as const, label: 'Opportunities', icon: Lightbulb, count: data?.opportunities?.length || 0 },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navigation />

      <main id="main-content">
        {/* Hero */}
        <section className="header-offset pt-16 pb-12 border-b-2 border-[#0A0A0A]/10">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#059669] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#059669]"></span>
                </span>
                <span className="text-xs font-mono font-medium uppercase tracking-[0.2em] text-[#0A0A0A]/60">
                  Live Intelligence
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
                The Pulse
              </h1>

              <p className="text-lg text-[#0A0A0A]/70 max-w-2xl mb-8">
                What government is doing. What media is saying. What evidence is emerging.
                What opportunities exist. The living heartbeat of youth justice in Australia.
              </p>

              {/* Period selector */}
              <div className="flex gap-2">
                {[7, 14, 30, 90].map(d => (
                  <button
                    key={d}
                    onClick={() => setPeriod(d)}
                    className={`px-4 py-2 text-sm font-mono transition-colors ${
                      period === d
                        ? 'bg-[#0A0A0A] text-[#F5F0E8]'
                        : 'border border-[#0A0A0A]/20 hover:border-[#0A0A0A]'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A0A0A]/30" />
          </div>
        ) : data ? (
          <>
            {/* Stats bar */}
            <section className="py-6 border-b border-[#0A0A0A]/10 bg-[#0A0A0A]/[0.03]">
              <div className="container-justice">
                <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div>
                    <div className="text-2xl font-bold font-mono">{data.stats.government_statements}</div>
                    <div className="text-xs text-[#0A0A0A]/50 font-mono">Govt statements</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono">{data.stats.media_articles}</div>
                    <div className="text-xs text-[#0A0A0A]/50 font-mono">Media articles</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono">{data.stats.new_evidence}</div>
                    <div className="text-xs text-[#0A0A0A]/50 font-mono">New evidence</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono">{data.stats.civic_alerts}</div>
                    <div className="text-xs text-[#0A0A0A]/50 font-mono">Civic alerts</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-[#059669]">+{data.stats.media_sentiment.positive}</span>
                      <span className="text-sm font-mono text-[#0A0A0A]/30">/</span>
                      <span className="text-sm font-mono text-[#DC2626]">-{data.stats.media_sentiment.negative}</span>
                    </div>
                    <div className="text-xs text-[#0A0A0A]/50 font-mono">Media sentiment</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Alerts banner */}
            {data.alerts.length > 0 && (
              <section className="py-4 bg-[#DC2626]/5 border-b border-[#DC2626]/20">
                <div className="container-justice">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#DC2626]">Alerts</span>
                    </div>
                    <div className="space-y-2">
                      {data.alerts.slice(0, 3).map(alert => (
                        <div key={alert.id} className="flex items-start gap-3">
                          <span className="text-xs font-mono text-[#0A0A0A]/40 shrink-0 mt-0.5">{formatDate(alert.created_at)}</span>
                          <div>
                            <span className="text-sm font-medium">{alert.title}</span>
                            {alert.summary && <span className="text-sm text-[#0A0A0A]/60"> — {alert.summary.slice(0, 120)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Tab navigation */}
            <section className="section-padding">
              <div className="container-justice">
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-1 mb-8 overflow-x-auto">
                    {tabs.map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                          activeTab === tab.key
                            ? 'bg-[#0A0A0A] text-[#F5F0E8]'
                            : 'border border-[#0A0A0A]/10 hover:border-[#0A0A0A]/30'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        <span className={`text-xs font-mono px-1.5 py-0.5 ${
                          activeTab === tab.key ? 'bg-[#F5F0E8]/20' : 'bg-[#0A0A0A]/5'
                        }`}>{tab.count}</span>
                      </button>
                    ))}
                  </div>

                  {/* Government tab */}
                  {activeTab === 'government' && (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          Ministerial Statements
                        </h2>
                        {data.government.statements.length === 0 ? (
                          <p className="text-[#0A0A0A]/50 text-sm font-mono">No youth justice statements in the last {period} days.</p>
                        ) : (
                          <div className="space-y-3">
                            {data.government.statements.map(stmt => (
                              <a
                                key={stmt.id}
                                href={stmt.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block border border-[#0A0A0A]/10 p-4 hover:border-[#0A0A0A] transition-colors group"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h3 className="font-medium group-hover:underline">{stmt.headline}</h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      <span className="text-xs font-mono text-[#0A0A0A]/50">{stmt.minister_name}</span>
                                      {stmt.jurisdiction && <span className="text-xs font-mono px-1.5 py-0.5 bg-[#0A0A0A]/5">{stmt.jurisdiction}</span>}
                                      {stmt.topics?.slice(0, 3).map((t, i) => (
                                        <span key={i} className="text-xs font-mono px-1.5 py-0.5 bg-[#0A0A0A]/5">{t}</span>
                                      ))}
                                    </div>
                                    {stmt.summary && (
                                      <p className="text-sm text-[#0A0A0A]/60 mt-2 line-clamp-2">{stmt.summary}</p>
                                    )}
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <span className="text-xs font-mono text-[#0A0A0A]/40">{formatDate(stmt.published_at)}</span>
                                    <ExternalLink className="w-3 h-3 mt-1 ml-auto text-[#0A0A0A]/20 group-hover:text-[#0A0A0A]" />
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {data.government.hansard.length > 0 && (
                        <div>
                          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            Parliament (Hansard)
                          </h2>
                          <div className="space-y-3">
                            {data.government.hansard.map(h => (
                              <a
                                key={h.id}
                                href={h.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block border border-[#0A0A0A]/10 p-4 hover:border-[#0A0A0A] transition-colors group"
                              >
                                <h3 className="font-medium group-hover:underline">{h.title}</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <span className="text-xs font-mono text-[#0A0A0A]/50">{h.speaker}</span>
                                  {h.party && <span className="text-xs font-mono px-1.5 py-0.5 bg-[#0A0A0A]/5">{h.party}</span>}
                                  <span className="text-xs font-mono text-[#0A0A0A]/40">{formatDate(h.spoken_at)}</span>
                                </div>
                                {h.summary && <p className="text-sm text-[#0A0A0A]/60 mt-2 line-clamp-2">{h.summary}</p>}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Media tab */}
                  {activeTab === 'media' && (
                    <div>
                      <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        Media Coverage
                      </h2>
                      <div className="space-y-3">
                        {data.media.map(article => (
                          <a
                            key={article.id}
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border border-[#0A0A0A]/10 p-4 hover:border-[#0A0A0A] transition-colors group"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-medium group-hover:underline">{article.headline}</h3>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <span className="text-xs font-mono text-[#0A0A0A]/50">{article.source_name}</span>
                                  <SentimentBadge sentiment={article.sentiment} />
                                  {article.topics?.slice(0, 3).map((t, i) => (
                                    <span key={i} className="text-xs font-mono px-1.5 py-0.5 bg-[#0A0A0A]/5">{t}</span>
                                  ))}
                                </div>
                                {article.summary && (
                                  <p className="text-sm text-[#0A0A0A]/60 mt-2 line-clamp-2">{article.summary}</p>
                                )}
                              </div>
                              <div className="shrink-0">
                                <ExternalLink className="w-3 h-3 text-[#0A0A0A]/20 group-hover:text-[#0A0A0A]" />
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evidence tab */}
                  {activeTab === 'evidence' && (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          New Evidence Sources
                        </h2>
                        {data.evidence.new_sources.length === 0 ? (
                          <p className="text-[#0A0A0A]/50 text-sm font-mono">No new evidence sources in the last {period} days.</p>
                        ) : (
                          <div className="space-y-3">
                            {data.evidence.new_sources.map(ev => (
                              <a
                                key={ev.id}
                                href={ev.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block border border-[#0A0A0A]/10 p-4 hover:border-[#0A0A0A] transition-colors group"
                              >
                                <h3 className="font-medium group-hover:underline">{ev.title}</h3>
                                <div className="flex gap-2 mt-2">
                                  {ev.evidence_type && <span className="text-xs font-mono px-1.5 py-0.5 bg-[#059669]/10 text-[#059669]">{ev.evidence_type}</span>}
                                  <span className="text-xs font-mono text-[#0A0A0A]/40">{formatDate(ev.created_at)}</span>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {data.interventions.length > 0 && (
                        <div>
                          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            New Interventions Documented
                          </h2>
                          <div className="space-y-3">
                            {data.interventions.map(intv => (
                              <Link
                                key={intv.id}
                                href={`/intelligence/interventions`}
                                className="block border border-[#0A0A0A]/10 p-4 hover:border-[#0A0A0A] transition-colors group"
                              >
                                <h3 className="font-medium group-hover:underline">{intv.name}</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {intv.operating_organization && <span className="text-xs font-mono text-[#0A0A0A]/50">{intv.operating_organization}</span>}
                                  {intv.evidence_level && <span className="text-xs font-mono px-1.5 py-0.5 bg-[#059669]/10 text-[#059669]">{intv.evidence_level.split(' ')[0]}</span>}
                                  {intv.cost_per_young_person && <span className="text-xs font-mono px-1.5 py-0.5 bg-[#0A0A0A]/5">${intv.cost_per_young_person.toLocaleString()}/person</span>}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Opportunities tab */}
                  {activeTab === 'opportunities' && (
                    <div>
                      <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        Open Opportunities
                      </h2>
                      {data.opportunities.length === 0 ? (
                        <div className="border border-[#0A0A0A]/10 p-8 text-center">
                          <DollarSign className="w-8 h-8 mx-auto mb-3 text-[#0A0A0A]/20" />
                          <p className="text-[#0A0A0A]/50 text-sm">No open opportunities right now. Check back soon or <Link href="/opportunities" className="underline">browse all opportunities</Link>.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {data.opportunities.map(opp => (
                            <a
                              key={opp.id}
                              href={opp.application_url || opp.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block border border-[#0A0A0A]/10 p-4 hover:border-[#0A0A0A] transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="font-medium group-hover:underline">{opp.name}</h3>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="text-xs font-mono text-[#0A0A0A]/50">{opp.funder_name}</span>
                                    {opp.max_grant_amount && (
                                      <span className="text-xs font-mono px-1.5 py-0.5 bg-[#059669]/10 text-[#059669]">
                                        Up to ${opp.max_grant_amount.toLocaleString()}
                                      </span>
                                    )}
                                    {opp.jurisdictions?.map((j, i) => (
                                      <span key={i} className="text-xs font-mono px-1.5 py-0.5 bg-[#0A0A0A]/5">{j}</span>
                                    ))}
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  {opp.deadline && (
                                    <span className={`text-xs font-mono font-bold ${
                                      parseInt(daysUntil(opp.deadline)) <= 7 ? 'text-[#DC2626]' : 'text-[#0A0A0A]/50'
                                    }`}>
                                      {daysUntil(opp.deadline)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="mt-6">
                        <Link href="/opportunities" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider hover:underline">
                          View all opportunities <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Stories sidebar */}
            {data.stories.length > 0 && (
              <section className="section-padding border-t-2 border-[#0A0A0A]/10">
                <div className="container-justice">
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      Community Voices
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {data.stories.map(story => (
                        <Link
                          key={story.id}
                          href={`/blog/${story.slug}`}
                          className="border border-[#0A0A0A]/10 hover:border-[#0A0A0A] transition-colors group overflow-hidden"
                        >
                          {story.image_url && (
                            <div className="aspect-video bg-[#0A0A0A]/5 overflow-hidden">
                              <img src={story.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-medium text-sm group-hover:underline line-clamp-2">{story.title}</h3>
                            {story.excerpt && <p className="text-xs text-[#0A0A0A]/50 mt-1 line-clamp-2">{story.excerpt}</p>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* CTA */}
            <section className="section-padding bg-[#0A0A0A] text-[#F5F0E8]">
              <div className="container-justice">
                <div className="max-w-4xl mx-auto text-center">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Stay connected
                  </h2>
                  <p className="text-[#F5F0E8]/70 mb-8 max-w-xl mx-auto">
                    Get the weekly pulse delivered to your inbox. Government moves, new evidence,
                    opportunities, and community stories — every Monday.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                    <Link href="/vision" className="inline-flex items-center gap-2 border border-[#F5F0E8]/30 px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-[#F5F0E8] hover:text-[#0A0A0A] transition-colors">
                      Our vision <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href="/contained" className="inline-flex items-center gap-2 border border-[#F5F0E8]/30 px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-[#F5F0E8] hover:text-[#0A0A0A] transition-colors">
                      The CONTAINED tour <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="flex items-center justify-center py-32">
            <p className="text-[#0A0A0A]/50 font-mono text-sm">Failed to load pulse data. Try refreshing.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
