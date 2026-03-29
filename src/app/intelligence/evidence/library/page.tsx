'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  FileText, Filter, Search, ExternalLink, Calendar, Building2, ChevronDown,
  TrendingDown, DollarSign, Shield, ArrowUpDown, Sparkles, Users, Home,
  Scale, BookOpen, Microscope
} from 'lucide-react';

interface Evidence {
  id: string;
  title: string;
  evidence_type: string;
  methodology: string | null;
  findings: string | null;
  author: string | null;
  organization: string | null;
  publication_date: string | null;
  source_url: string | null;
  consent_level: string | null;
}

interface Provenance {
  mode: 'authoritative' | 'computed';
  summary: string;
  generated_at: string;
}

// Evidence strength ranking (higher = stronger)
const EVIDENCE_STRENGTH: Record<string, { rank: number; label: string; color: string; description: string }> = {
  'RCT': { rank: 6, label: 'RCT', color: 'bg-green-600', description: 'Gold standard - randomized controlled trial' },
  'RCT (Randomized Control Trial)': { rank: 6, label: 'RCT', color: 'bg-green-600', description: 'Gold standard - randomized controlled trial' },
  'Quasi-experimental': { rank: 5, label: 'Quasi', color: 'bg-emerald-500', description: 'Strong comparison groups' },
  'Program evaluation': { rank: 4, label: 'Eval', color: 'bg-teal-500', description: 'Systematic program assessment' },
  'Community-led research': { rank: 4, label: 'Community', color: 'bg-purple-500', description: 'First Nations community-controlled' },
  'Policy analysis': { rank: 3, label: 'Policy', color: 'bg-blue-500', description: 'Policy review and analysis' },
  'Case study': { rank: 2, label: 'Case', color: 'bg-amber-500', description: 'In-depth single case analysis' },
};

// Topic classification based on keywords in title/findings
const TOPICS: Record<string, { keywords: string[]; icon: typeof FileText; color: string }> = {
  'Diversion': {
    keywords: ['diversion', 'divert', 'conferencing', 'caution', 'restorative', 'alternative'],
    icon: TrendingDown,
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  'Detention': {
    keywords: ['detention', 'custody', 'incarcerat', 'prison', 'remand', 'facility', 'centre'],
    icon: Home,
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  'Cultural Programs': {
    keywords: ['aboriginal', 'indigenous', 'first nations', 'cultural', 'koori', 'murri', 'on country', 'elder'],
    icon: Users,
    color: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  'Early Intervention': {
    keywords: ['early intervention', 'prevention', 'family', 'school', 'child protection'],
    icon: Shield,
    color: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  'Cost-Benefit': {
    keywords: ['cost', 'economic', 'saving', 'investment', 'reinvest', 'return', 'dollar'],
    icon: DollarSign,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  },
  'Reoffending': {
    keywords: ['reoffend', 'recidiv', 'reconvict', 'return to custody'],
    icon: TrendingDown,
    color: 'bg-orange-100 text-orange-800 border-orange-300'
  },
  'Therapeutic': {
    keywords: ['therap', 'trauma', 'mental health', 'mst', 'fft', 'cognitive'],
    icon: Sparkles,
    color: 'bg-pink-100 text-pink-800 border-pink-300'
  },
  'Legal/Rights': {
    keywords: ['rights', 'legal', 'law', 'bail', 'sentence', 'age of criminal', 'minimum age'],
    icon: Scale,
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
};

// Sort options
type SortOption = 'date' | 'strength' | 'recidivism' | 'costbenefit' | 'title';

const SORT_OPTIONS: { value: SortOption; label: string; description: string }[] = [
  { value: 'date', label: 'Publication Date', description: 'Most recent first' },
  { value: 'strength', label: 'Evidence Strength', description: 'RCT > Quasi > Case study' },
  { value: 'recidivism', label: 'Recidivism Reduction', description: 'Highest impact first' },
  { value: 'costbenefit', label: 'Cost-Benefit Ratio', description: 'Best return on investment' },
  { value: 'title', label: 'Alphabetical', description: 'A-Z by title' },
];

// Extract recidivism reduction percentage from findings text
function extractRecidivismReduction(text: string | null): number | null {
  if (!text) return null;

  // Match patterns like "15-20% less likely", "reduced by 50%", "70% reduction", etc.
  const patterns = [
    /(\d+)(?:-(\d+))?%\s*(?:less likely|reduction|reduced|decrease|lower|fewer)/i,
    /reduc(?:ed?|tion)\s*(?:by\s*)?(\d+)(?:-(\d+))?%/i,
    /(\d+)(?:-(\d+))?%\s*(?:drop|decline|fall)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const num1 = parseInt(match[1]);
      const num2 = match[2] ? parseInt(match[2]) : null;
      // Return average if range, otherwise single value
      return num2 ? (num1 + num2) / 2 : num1;
    }
  }
  return null;
}

// Extract cost-benefit ratio from findings text
function extractCostBenefit(text: string | null): number | null {
  if (!text) return null;

  // Match patterns like "$4.40 return", "$8 return per dollar", "17:1 ratio", etc.
  const patterns = [
    /\$(\d+(?:\.\d+)?)\s*(?:return|saved?|benefit)/i,
    /(\d+(?:\.\d+)?)\s*(?:times|x)\s*(?:return|benefit)/i,
    /(\d+(?:\.\d+)?):1\s*(?:ratio|return)/i,
    /(\d+(?:\.\d+)?)\s*(?:for every|per)\s*(?:\$?1|dollar)/i,
    /return(?:ed)?\s*(?:of\s*)?\$(\d+(?:\.\d+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseFloat(match[1]);
    }
  }
  return null;
}

// Classify evidence into topics based on keywords
function classifyTopics(title: string | null, findings: string | null): string[] {
  const text = `${title || ''} ${findings || ''}`.toLowerCase();
  const matched: string[] = [];

  for (const [topic, config] of Object.entries(TOPICS)) {
    if (config.keywords.some(kw => text.includes(kw.toLowerCase()))) {
      matched.push(topic);
    }
  }

  return matched;
}

// Get evidence strength info
function getStrengthInfo(evidenceType: string | null) {
  if (!evidenceType) return { rank: 0, label: '?', color: 'bg-gray-400', description: 'Unknown' };
  return EVIDENCE_STRENGTH[evidenceType] || { rank: 1, label: 'Other', color: 'bg-gray-400', description: 'Other study type' };
}

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [provenance, setProvenance] = useState<Provenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedStrength, setSelectedStrength] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<SortOption>('strength');
  const [totalCount, setTotalCount] = useState(0);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  // Get actual evidence types from data
  const actualTypes = useMemo(() => {
    if (availableTypes.length > 0) {
      return availableTypes;
    }
    const types = new Set(evidence.map(e => e.evidence_type).filter(Boolean));
    return Array.from(types).sort();
  }, [availableTypes, evidence]);

  useEffect(() => {
    let cancelled = false;

    async function fetchEvidence() {
      try {
        setLoading(true);
        const params = new URLSearchParams({ limit: '200' });
        if (searchQuery.trim()) {
          params.set('search', searchQuery.trim());
        }
        if (selectedType) {
          params.set('type', selectedType);
        }

        const response = await fetch(`/api/intelligence/evidence?${params.toString()}`, {
          cache: 'no-store',
        });
        const payload = await response.json();

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || 'Failed to fetch evidence');
        }

        if (cancelled) {
          return;
        }

        setEvidence(payload.evidence || []);
        setTotalCount(payload.totalCount || 0);
        setAvailableTypes(payload.filters?.types || []);
        setProvenance(payload.provenance || null);
      } catch (error) {
        console.error('Error fetching evidence:', error);
        if (!cancelled) {
          setEvidence([]);
          setTotalCount(0);
          setAvailableTypes([]);
          setProvenance(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchEvidence();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, selectedType]);

  // Process and sort evidence client-side
  const processedEvidence = useMemo(() => {
    let filtered = evidence.map(item => ({
      ...item,
      strengthInfo: getStrengthInfo(item.evidence_type),
      topics: classifyTopics(item.title, item.findings),
      recidivismReduction: extractRecidivismReduction(item.findings),
      costBenefit: extractCostBenefit(item.findings),
    }));

    // Filter by topic
    if (selectedTopic) {
      filtered = filtered.filter(item => item.topics.includes(selectedTopic));
    }

    // Filter by minimum strength
    if (selectedStrength !== '') {
      filtered = filtered.filter(item => item.strengthInfo.rank >= selectedStrength);
    }

    // Sort
    switch (sortBy) {
      case 'strength':
        filtered.sort((a, b) => b.strengthInfo.rank - a.strengthInfo.rank);
        break;
      case 'recidivism':
        filtered.sort((a, b) => (b.recidivismReduction ?? -1) - (a.recidivismReduction ?? -1));
        break;
      case 'costbenefit':
        filtered.sort((a, b) => (b.costBenefit ?? -1) - (a.costBenefit ?? -1));
        break;
      case 'title':
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'date':
      default:
        // Already sorted by date from query
        break;
    }

    return filtered;
  }, [evidence, selectedTopic, selectedStrength, sortBy]);

  // Count evidence by strength level for legend
  const strengthCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    evidence.forEach(item => {
      const strength = getStrengthInfo(item.evidence_type);
      counts[strength.rank] = (counts[strength.rank] || 0) + 1;
    });
    return counts;
  }, [evidence]);

  // Count evidence by topic
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    evidence.forEach(item => {
      const topics = classifyTopics(item.title, item.findings);
      topics.forEach(topic => {
        counts[topic] = (counts[topic] || 0) + 1;
      });
    });
    return counts;
  }, [evidence]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedTopic('');
    setSelectedStrength('');
    setSortBy('strength');
  };

  const hasFilters = searchQuery || selectedType || selectedTopic || selectedStrength !== '';

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-eucalyptus-50 via-sand-50 to-ochre-50 py-12 border-b-2 border-black">
          <div className="container-justice">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-eucalyptus-100 border-2 border-black">
                <Microscope className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-5xl font-black">The Evidence Is Clear</h1>
                <p className="text-earth-600">Research-backed solutions for youth justice reform</p>
              </div>
            </div>

            <p className="text-lg text-earth-700 max-w-2xl mb-6">
              Browse peer-reviewed research, program evaluations, and government inquiries
              documenting what works - and what doesn't - in youth justice across Australia.
            </p>

            {provenance && (
              <div className="mb-6 inline-flex items-center gap-2 border border-black bg-white px-3 py-1 text-xs">
                <span className={`font-bold uppercase ${provenance.mode === 'authoritative' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {provenance.mode}
                </span>
                <span className="text-gray-700">{provenance.summary}</span>
              </div>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="text-sm text-earth-600">
                <span className="font-bold text-3xl text-eucalyptus-600">{totalCount}</span>
                <span className="ml-2">studies documented</span>
              </div>
              <div className="h-8 w-px bg-earth-300" />
              <div className="text-sm text-earth-600">
                <span className="font-bold text-2xl text-green-600">{strengthCounts[6] || 0}</span>
                <span className="ml-2">RCTs</span>
              </div>
              <div className="text-sm text-earth-600">
                <span className="font-bold text-2xl text-emerald-600">{strengthCounts[5] || 0}</span>
                <span className="ml-2">Quasi-experimental</span>
              </div>
              <div className="text-sm text-earth-600">
                <span className="font-bold text-2xl text-purple-600">{strengthCounts[4] || 0}</span>
                <span className="ml-2">Evaluations</span>
              </div>
            </div>
          </div>
        </section>

        {/* Evidence Strength Legend */}
        <section className="py-4 bg-gray-50 border-b border-gray-200">
          <div className="container-justice">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-earth-600 mr-2">Evidence Strength:</span>
              {Object.entries(EVIDENCE_STRENGTH)
                .filter(([key]) => !key.includes('(')) // Avoid duplicates
                .sort((a, b) => b[1].rank - a[1].rank)
                .map(([type, info]) => (
                  <button
                    key={type}
                    onClick={() => setSelectedStrength(selectedStrength === info.rank ? '' : info.rank)}
                    className={`px-2 py-1 rounded-full flex items-center gap-1 transition-all ${
                      selectedStrength === info.rank
                        ? 'ring-2 ring-black ring-offset-1'
                        : 'hover:ring-1 hover:ring-gray-400'
                    }`}
                    title={info.description}
                  >
                    <span className={`w-2 h-2 rounded-full ${info.color}`} />
                    <span>{info.label}</span>
                  </button>
                ))}
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-4 border-b-2 border-black bg-white sticky top-32 z-10">
          <div className="container-justice">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-earth-600" />
                <span className="text-sm font-medium text-earth-600">Filters:</span>
              </div>

              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search evidence..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-black bg-white text-sm focus:outline-none focus:border-eucalyptus-500"
                />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="appearance-none border-2 border-black px-4 py-2 pr-10 bg-white font-medium text-sm cursor-pointer hover:bg-sand-50"
                >
                  <option value="">All Types</option>
                  {actualTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              </div>

              {/* Topic Filter */}
              <div className="relative">
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="appearance-none border-2 border-black px-4 py-2 pr-10 bg-white font-medium text-sm cursor-pointer hover:bg-sand-50"
                >
                  <option value="">All Topics</option>
                  {Object.entries(TOPICS).map(([topic]) => (
                    <option key={topic} value={topic}>
                      {topic} ({topicCounts[topic] || 0})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              </div>

              {/* Sort */}
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-600" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none border-2 border-black pl-10 pr-10 py-2 bg-white font-medium text-sm cursor-pointer hover:bg-sand-50"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      Sort: {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-ochre-600 hover:text-ochre-800 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Active filter summary */}
            {hasFilters && (
              <div className="mt-3 text-sm text-earth-600">
                Showing <span className="font-bold">{processedEvidence.length}</span> of {totalCount} studies
                {selectedStrength !== '' && (
                  <span className="ml-2 px-2 py-0.5 bg-eucalyptus-100 text-eucalyptus-800 text-xs font-medium">
                    Strength {selectedStrength}+
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Results */}
        <section className="py-8">
          <div className="container-justice">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eucalyptus-600"></div>
              </div>
            ) : processedEvidence.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-earth-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No evidence found</h3>
                <p className="text-earth-600">
                  {hasFilters
                    ? 'Try adjusting your search or filters'
                    : 'Evidence studies will appear here as they are added'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {processedEvidence.map((item) => (
                  <Link
                    key={item.id}
                    href={`/intelligence/evidence/${item.id}`}
                    className="block border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow bg-white"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {/* Strength indicator */}
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 text-white ${item.strengthInfo.color}`}
                            title={item.strengthInfo.description}
                          >
                            <span className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />
                            {item.evidence_type || 'Unknown'}
                          </span>

                          {/* Topic badges */}
                          {item.topics.slice(0, 2).map(topic => {
                            const TopicIcon = TOPICS[topic]?.icon || BookOpen;
                            return (
                              <span
                                key={topic}
                                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 border ${TOPICS[topic]?.color || 'bg-gray-100 text-gray-800 border-gray-300'}`}
                              >
                                <TopicIcon className="w-3 h-3" />
                                {topic}
                              </span>
                            );
                          })}
                        </div>

                        <h3 className="text-xl font-bold mb-2 line-clamp-2">
                          {item.title || 'Untitled Study'}
                        </h3>

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-earth-600 mb-3">
                          {item.author && (
                            <span>{item.author}</span>
                          )}
                          {item.organization && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {item.organization}
                            </span>
                          )}
                          {item.publication_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(item.publication_date)}
                            </span>
                          )}
                        </div>

                        {/* Key metrics if found */}
                        {(item.recidivismReduction || item.costBenefit) && (
                          <div className="flex flex-wrap items-center gap-4 mb-3">
                            {item.recidivismReduction && (
                              <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700 bg-green-50 px-2 py-1 border border-green-200">
                                <TrendingDown className="w-3 h-3" />
                                {item.recidivismReduction}% recidivism reduction
                              </span>
                            )}
                            {item.costBenefit && (
                              <span className="inline-flex items-center gap-1 text-sm font-medium text-yellow-700 bg-yellow-50 px-2 py-1 border border-yellow-200">
                                <DollarSign className="w-3 h-3" />
                                ${item.costBenefit} return per $1
                              </span>
                            )}
                          </div>
                        )}

                        {/* Findings preview */}
                        {item.findings && item.findings !== 'See source document' && (
                          <p className="text-earth-700 text-sm line-clamp-2">
                            {item.findings}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-2">
                        {item.consent_level && (
                          <span className="text-xs font-medium px-2 py-1 bg-sand-100 text-earth-600">
                            {item.consent_level}
                          </span>
                        )}
                        {item.source_url && (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 border border-black hover:bg-sand-50"
                            title="View source"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Load more hint */}
            {processedEvidence.length > 0 && processedEvidence.length < totalCount && !hasFilters && (
              <div className="text-center mt-8 text-sm text-earth-600">
                Showing {processedEvidence.length} of {totalCount} studies
              </div>
            )}
          </div>
        </section>

        {/* Key Insights Summary */}
        {!loading && processedEvidence.length > 0 && (
          <section className="py-8 border-t-2 border-black bg-eucalyptus-50">
            <div className="container-justice">
              <h2 className="text-2xl font-bold mb-6">What the Evidence Shows</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white border-2 border-black p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold">Recidivism Reduction</h3>
                  </div>
                  <p className="text-sm text-earth-600 mb-2">
                    Studies showing programs that reduce reoffending rates
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {processedEvidence.filter(e => e.recidivismReduction).length} studies
                  </p>
                  <p className="text-xs text-earth-500">
                    Average reduction: {Math.round(
                      processedEvidence
                        .filter(e => e.recidivismReduction)
                        .reduce((sum, e) => sum + (e.recidivismReduction || 0), 0) /
                      (processedEvidence.filter(e => e.recidivismReduction).length || 1)
                    )}%
                  </p>
                </div>

                <div className="bg-white border-2 border-black p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-bold">Cost-Benefit Evidence</h3>
                  </div>
                  <p className="text-sm text-earth-600 mb-2">
                    Studies documenting economic returns on investment
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {processedEvidence.filter(e => e.costBenefit).length} studies
                  </p>
                  <p className="text-xs text-earth-500">
                    Best ROI: ${Math.max(...processedEvidence.map(e => e.costBenefit || 0))} per $1
                  </p>
                </div>

                <div className="bg-white border-2 border-black p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold">Cultural Programs</h3>
                  </div>
                  <p className="text-sm text-earth-600 mb-2">
                    First Nations community-led and cultural research
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {topicCounts['Cultural Programs'] || 0} studies
                  </p>
                  <p className="text-xs text-earth-500">
                    Community-controlled research: {evidence.filter(e => e.consent_level === 'Community Controlled').length}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-12 border-t-2 border-black bg-sand-50">
          <div className="container-justice text-center">
            <h2 className="text-2xl font-bold mb-4">Have research to contribute?</h2>
            <p className="text-earth-600 mb-6 max-w-lg mx-auto">
              If you have evidence or research on youth justice programs that should be
              included in our database, we&apos;d love to hear from you.
            </p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
            >
              Submit Research
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
