'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import {
  BookOpen,
  FileText,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Award,
  Globe,
  Tag,
  Calendar,
} from 'lucide-react';

interface Evidence {
  id: string;
  title: string;
  evidence_type: string;
  findings: string;
  effect_size?: string;
  cultural_safety?: string;
  author?: string;
  organization?: string;
  publication_date?: string;
  source_url?: string;
  consent_level: string;
  metadata?: {
    jurisdictions?: string[];
    topics?: string[];
    evidence_quality?: string;
    scrape_source?: string;
  };
  created_at: string;
}

interface DigestData {
  period: { start: string; end: string };
  summary: string;
  total_new_items: number;
  topic_coverage: Record<string, number>;
  jurisdiction_coverage: Record<string, number>;
  recommendations: string[];
}

const EVIDENCE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'RCT (Randomized Control Trial)': { bg: 'bg-green-100', text: 'text-green-800' },
  'Quasi-experimental': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Program evaluation': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'Longitudinal study': { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  'Policy analysis': { bg: 'bg-orange-100', text: 'text-orange-800' },
  'Community-led research': { bg: 'bg-pink-100', text: 'text-pink-800' },
  'Case study': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'Lived experience': { bg: 'bg-red-100', text: 'text-red-800' },
  'Cultural knowledge': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
};

const QUALITY_COLORS: Record<string, { bg: string; text: string }> = {
  High: { bg: 'bg-green-100', text: 'text-green-800' },
  Medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  Low: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

// Keyword-based topic extraction (when metadata is empty)
const TOPIC_KEYWORDS: Record<string, string[]> = {
  youth_justice: ['youth justice', 'juvenile justice', 'young offender', 'youth detention', 'youth crime'],
  detention: ['detention', 'incarceration', 'custody', 'prison', 'remand', 'locked up'],
  diversion: ['diversion', 'divert', 'alternative', 'restorative', 'community-based'],
  indigenous: ['indigenous', 'aboriginal', 'torres strait', 'first nations', 'koori', 'murri'],
  recidivism: ['recidivism', 'reoffend', 're-offend', 'reincarceration', 'return to custody'],
  mental_health: ['mental health', 'psychological', 'psychiatric', 'trauma', 'anxiety', 'depression', 'wellbeing'],
  family: ['family', 'parent', 'carer', 'kinship', 'household', 'sibling'],
  education: ['education', 'school', 'learning', 'literacy', 'training', 'vocational'],
  employment: ['employment', 'job', 'work', 'career', 'workforce'],
  child_protection: ['child protection', 'out-of-home care', 'foster', 'welfare', 'child safety'],
};

const JURISDICTION_KEYWORDS: Record<string, string[]> = {
  National: ['australia', 'australian', 'national', 'federal', 'commonwealth'],
  NSW: ['new south wales', 'nsw', 'sydney'],
  VIC: ['victoria', 'vic', 'melbourne'],
  QLD: ['queensland', 'qld', 'brisbane'],
  WA: ['western australia', 'wa', 'perth'],
  SA: ['south australia', 'sa', 'adelaide'],
  TAS: ['tasmania', 'tas', 'hobart'],
  NT: ['northern territory', 'nt', 'darwin', 'alice springs'],
  ACT: ['australian capital territory', 'act', 'canberra'],
};

function extractTopics(text: string): string[] {
  const lowerText = text.toLowerCase();
  const topics: string[] = [];
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      topics.push(topic);
    }
  }
  return topics;
}

function extractJurisdictions(text: string): string[] {
  const lowerText = text.toLowerCase();
  const jurisdictions: string[] = [];
  for (const [jurisdiction, keywords] of Object.entries(JURISDICTION_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      jurisdictions.push(jurisdiction);
    }
  }
  if (jurisdictions.length === 0 && (lowerText.includes('australia') || lowerText.includes('australian'))) {
    jurisdictions.push('National');
  }
  return jurisdictions;
}

export default function ResearchDashboard() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [evidenceType, setEvidenceType] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [topic, setTopic] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (evidenceType) params.set('evidence_type', evidenceType);
      if (jurisdiction) params.set('jurisdiction', jurisdiction);
      if (topic) params.set('topic', topic);
      if (searchQuery) params.set('search', searchQuery);
      params.set('limit', '50');

      const [evidenceRes, digestRes] = await Promise.all([
        fetch(`/api/admin/research/evidence?${params}`),
        fetch('/api/admin/research/digest?days=30'),
      ]);

      if (!evidenceRes.ok) throw new Error('Failed to fetch evidence');

      const evidenceData = await evidenceRes.json();
      setEvidence(evidenceData.data || []);

      if (digestRes.ok) {
        const digestData = await digestRes.json();
        setDigest(digestData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [evidenceType, jurisdiction, topic]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Calculate stats with content extraction fallback
  const totalEvidence = evidence.length;
  const byType: Record<string, number> = {};
  const byJurisdiction: Record<string, number> = {};
  const byTopic: Record<string, number> = {};

  for (const item of evidence) {
    byType[item.evidence_type] = (byType[item.evidence_type] || 0) + 1;

    // Extract from content if metadata is empty
    const content = `${item.title} ${item.findings || ''}`;
    const jurisdictions = item.metadata?.jurisdictions?.length
      ? item.metadata.jurisdictions
      : extractJurisdictions(content);
    const topics = item.metadata?.topics?.length
      ? item.metadata.topics
      : extractTopics(content);

    for (const j of jurisdictions) {
      byJurisdiction[j] = (byJurisdiction[j] || 0) + 1;
    }
    for (const t of topics) {
      byTopic[t] = (byTopic[t] || 0) + 1;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-8 h-8 text-purple-600" />
                <h1 className="text-4xl font-black text-black">Evidence Library</h1>
              </div>
              <p className="text-lg text-gray-600">
                Research, evaluations, and evidence for youth justice interventions
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                href="/admin/research/scrape"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white border-2 border-black font-bold hover:bg-purple-700 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <RefreshCw className="w-4 h-4" />
                Run Scraper
              </Link>
            </div>
          </div>

          {/* Digest Summary */}
          {digest && (
            <div className="bg-purple-50 border-2 border-purple-600 p-6 mb-8">
              <div className="flex items-start gap-4">
                <BarChart3 className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-purple-800 mb-2">
                    Research Digest (Last 30 Days)
                  </h3>
                  <p className="text-purple-700 mb-4">{digest.summary}</p>

                  {digest.recommendations.length > 0 && (
                    <div className="space-y-1">
                      {digest.recommendations.slice(0, 3).map((rec, i) => (
                        <div
                          key={i}
                          className="text-sm text-purple-600 flex items-start gap-2"
                        >
                          <span className="text-purple-400">→</span>
                          {rec}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-600">Total Evidence</span>
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-4xl font-black text-black">{totalEvidence}</div>
              <div className="text-xs text-gray-500 mt-1">research items indexed</div>
            </div>

            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-600">Evidence Types</span>
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-4xl font-black text-purple-600">
                {Object.keys(byType).length}
              </div>
              <div className="text-xs text-gray-500 mt-1">different methodologies</div>
            </div>

            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-600">Jurisdictions</span>
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-4xl font-black text-blue-600">
                {Object.keys(byJurisdiction).length}
              </div>
              <div className="text-xs text-gray-500 mt-1">regions covered</div>
            </div>

            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-600">Topics</span>
                <Tag className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-4xl font-black text-green-600">
                {Object.keys(byTopic).length}
              </div>
              <div className="text-xs text-gray-500 mt-1">research areas</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 mb-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="font-bold text-sm">Filters:</span>
              </div>

              {/* Evidence Type Filter */}
              <div className="relative">
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  className="appearance-none bg-gray-100 border-2 border-gray-300 px-3 py-1.5 pr-8 font-medium text-sm focus:border-black focus:outline-none"
                >
                  <option value="">All Types</option>
                  <option value="RCT (Randomized Control Trial)">RCT</option>
                  <option value="Quasi-experimental">Quasi-experimental</option>
                  <option value="Program evaluation">Program Evaluation</option>
                  <option value="Longitudinal study">Longitudinal Study</option>
                  <option value="Policy analysis">Policy Analysis</option>
                  <option value="Community-led research">Community-led</option>
                  <option value="Case study">Case Study</option>
                  <option value="Lived experience">Lived Experience</option>
                  <option value="Cultural knowledge">Cultural Knowledge</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>

              {/* Jurisdiction Filter */}
              <div className="relative">
                <select
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  className="appearance-none bg-gray-100 border-2 border-gray-300 px-3 py-1.5 pr-8 font-medium text-sm focus:border-black focus:outline-none"
                >
                  <option value="">All Jurisdictions</option>
                  <option value="National">National</option>
                  <option value="NSW">NSW</option>
                  <option value="VIC">VIC</option>
                  <option value="QLD">QLD</option>
                  <option value="WA">WA</option>
                  <option value="SA">SA</option>
                  <option value="TAS">TAS</option>
                  <option value="NT">NT</option>
                  <option value="ACT">ACT</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>

              {/* Topic Filter */}
              <div className="relative">
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="appearance-none bg-gray-100 border-2 border-gray-300 px-3 py-1.5 pr-8 font-medium text-sm focus:border-black focus:outline-none"
                >
                  <option value="">All Topics</option>
                  <option value="youth_justice">Youth Justice</option>
                  <option value="detention">Detention</option>
                  <option value="diversion">Diversion</option>
                  <option value="indigenous">Indigenous</option>
                  <option value="recidivism">Recidivism</option>
                  <option value="mental_health">Mental Health</option>
                  <option value="family">Family</option>
                  <option value="education">Education</option>
                  <option value="employment">Employment</option>
                  <option value="child_protection">Child Protection</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search evidence..."
                    className="w-full pl-10 pr-4 py-1.5 bg-gray-100 border-2 border-gray-300 font-medium text-sm focus:border-black focus:outline-none"
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-2 border-red-600 p-4 mb-8">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Loading evidence library...</p>
            </div>
          ) : evidence.length === 0 ? (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                No evidence found
              </h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your filters or run the research scraper
              </p>
              <Link
                href="/admin/research/scrape"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white border-2 border-black font-bold hover:bg-purple-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Run Scraper
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {evidence.map((item) => {
                const typeColors =
                  EVIDENCE_TYPE_COLORS[item.evidence_type] || {
                    bg: 'bg-gray-100',
                    text: 'text-gray-800',
                  };
                const qualityColors =
                  QUALITY_COLORS[item.metadata?.evidence_quality || 'Low'];

                return (
                  <div
                    key={item.id}
                    className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200"
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 text-xs font-bold ${typeColors.bg} ${typeColors.text}`}
                            >
                              {item.evidence_type}
                            </span>
                            {item.metadata?.evidence_quality && (
                              <span
                                className={`px-2 py-0.5 text-xs font-bold ${qualityColors.bg} ${qualityColors.text}`}
                              >
                                {item.metadata.evidence_quality} Quality
                              </span>
                            )}
                            {item.effect_size && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700">
                                {item.effect_size}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-black">
                            {item.title}
                          </h3>
                        </div>
                      </div>

                      {/* Author/Organization */}
                      {(item.author || item.organization) && (
                        <p className="text-sm text-gray-600 mb-3">
                          {item.author && <span>{item.author}</span>}
                          {item.author && item.organization && <span> • </span>}
                          {item.organization && <span>{item.organization}</span>}
                          {item.publication_date && (
                            <span className="flex items-center gap-1 inline-flex ml-2">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.publication_date).toLocaleDateString(
                                'en-AU',
                                { year: 'numeric', month: 'short' }
                              )}
                            </span>
                          )}
                        </p>
                      )}

                      {/* Findings */}
                      <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                        {item.findings}
                      </p>

                      {/* Tags - extract from content if metadata empty */}
                      {(() => {
                        const content = `${item.title} ${item.findings || ''}`;
                        const jurisdictions = item.metadata?.jurisdictions?.length
                          ? item.metadata.jurisdictions
                          : extractJurisdictions(content);
                        const topics = item.metadata?.topics?.length
                          ? item.metadata.topics
                          : extractTopics(content);

                        return (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {jurisdictions.map((j) => (
                              <span
                                key={j}
                                className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium"
                              >
                                {j}
                              </span>
                            ))}
                            {topics.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium"
                              >
                                {t.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <Link
                          href={`/intelligence/evidence/${item.id}`}
                          className="text-sm font-bold text-purple-600 hover:underline"
                        >
                          View Details →
                        </Link>

                        {item.source_url && (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline"
                          >
                            Source
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Topic Distribution */}
          {Object.keys(byTopic).length > 0 && (
            <div className="mt-12 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
              <h2 className="text-2xl font-black text-black mb-6">
                Topic Distribution
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.entries(byTopic)
                  .sort((a, b) => b[1] - a[1])
                  .map(([topicName, count]) => (
                    <div
                      key={topicName}
                      className="p-4 bg-gray-50 border border-gray-200"
                    >
                      <div className="text-2xl font-black text-gray-800">
                        {count}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        {topicName.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
