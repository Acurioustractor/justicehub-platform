'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  LayoutGrid,
  List,
  Table2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Shield,
  ExternalLink,
  Loader2,
} from 'lucide-react';

type ViewMode = 'grid' | 'list' | 'table';

interface Intervention {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  geography: string[] | null;
  evidence_level: string | null;
  consent_level: string | null;
  created_at: string;
}

interface Provenance {
  mode: 'authoritative' | 'computed';
  summary: string;
  generated_at: string;
}

const EVIDENCE_COLORS: Record<string, string> = {
  'Effective (strong evaluation, positive outcomes)': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Promising (community-endorsed, emerging evidence)': 'bg-blue-100 text-blue-800 border-blue-300',
  'Theoretical (evidence-based design, limited evaluation)': 'bg-amber-100 text-amber-800 border-amber-300',
  'Unknown': 'bg-gray-100 text-gray-600 border-gray-300',
};

const TYPE_COLORS: Record<string, string> = {
  'Community-Led': 'bg-purple-600',
  'Cultural Connection': 'bg-orange-600',
  'Diversion': 'bg-green-600',
  'Early Intervention': 'bg-blue-600',
  'Education/Employment': 'bg-cyan-600',
  'Family Strengthening': 'bg-pink-600',
  'Justice Reinvestment': 'bg-indigo-600',
  'Prevention': 'bg-teal-600',
  'Therapeutic': 'bg-rose-600',
  'Wraparound Support': 'bg-amber-600',
};

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [provenance, setProvenance] = useState<Provenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [selectedContext, setSelectedContext] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24;

  // Filter options
  const [types, setTypes] = useState<string[]>([]);
  const [evidenceLevels, setEvidenceLevels] = useState<string[]>([]);
  const [outcomeTypes, setOutcomeTypes] = useState<string[]>([]);
  const [contextTypes, setContextTypes] = useState<string[]>([]);

  // Fetch interventions via intelligence API
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: String(currentPage),
          pageSize: String(pageSize),
        });

        if (searchQuery.trim()) {
          params.set('search', searchQuery.trim());
        }
        if (selectedType) {
          params.set('type', selectedType);
        }
        if (selectedEvidence) {
          params.set('evidence_level', selectedEvidence);
        }
        if (selectedOutcome) {
          params.set('outcome_type', selectedOutcome);
        }
        if (selectedContext) {
          params.set('context_type', selectedContext);
        }

        const response = await fetch(`/api/intelligence/interventions?${params.toString()}`, {
          cache: 'no-store',
        });
        const payload = await response.json();

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || 'Failed to fetch interventions');
        }

        if (cancelled) {
          return;
        }

        setInterventions(payload.data || []);
        setTotal(payload.count || payload.total || 0);
        setTypes(payload.filters?.types || []);
        setEvidenceLevels(payload.filters?.evidenceLevels || []);
        setOutcomeTypes(payload.filters?.outcomeTypes || []);
        setContextTypes(payload.filters?.contextTypes || []);
        setProvenance(payload.provenance || null);
      } catch (error) {
        console.error('Error fetching interventions:', error);
        if (!cancelled) {
          setInterventions([]);
          setTotal(0);
          setProvenance(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, selectedType, selectedEvidence, selectedOutcome, selectedContext, currentPage]);

  const totalPages = Math.ceil(total / pageSize);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedEvidence('');
    setSelectedOutcome('');
    setSelectedContext('');
    setCurrentPage(1);
  };

  const hasFilters = searchQuery || selectedType || selectedEvidence || selectedOutcome || selectedContext;

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Navigation />

      <main className="page-content bg-gray-50 min-h-screen">
        {/* Header */}
        <section className="border-b-2 border-black bg-white">
          <div className="container-justice py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <div className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
                  Evidence Database
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
                  Youth Justice Interventions
                </h1>
                <p className="text-lg text-gray-700 mt-2">
                  <strong className="font-mono">{total.toLocaleString()}</strong> programs documented across Australia
                </p>
                {provenance && (
                  <div className="mt-3 inline-flex items-center gap-2 border border-black bg-white px-3 py-1 text-xs">
                    <span className={`font-bold uppercase ${provenance.mode === 'authoritative' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {provenance.mode}
                    </span>
                    <span className="text-gray-700">{provenance.summary}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mr-2">View:</span>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 border-2 ${viewMode === 'grid' ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 border-2 ${viewMode === 'list' ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'}`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 border-2 ${viewMode === 'table' ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'}`}
                  title="Table View"
                >
                  <Table2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Filters Bar */}
        <section className="border-b-2 border-black bg-gray-100">
          <div className="container-justice py-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search programs..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedType}
                  onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
                  className="border-2 border-black px-3 py-2 bg-white font-mono text-sm focus:outline-none"
                >
                  <option value="">All Types</option>
                  {types.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Evidence Filter */}
              <select
                value={selectedEvidence}
                onChange={(e) => { setSelectedEvidence(e.target.value); setCurrentPage(1); }}
                className="border-2 border-black px-3 py-2 bg-white font-mono text-sm focus:outline-none"
              >
                <option value="">All Evidence Levels</option>
                {evidenceLevels.map((level) => (
                  <option key={level} value={level}>{level.split(' (')[0]}</option>
                ))}
              </select>

              {/* Outcome Type Filter */}
              {outcomeTypes.length > 0 && (
                <select
                  value={selectedOutcome}
                  onChange={(e) => { setSelectedOutcome(e.target.value); setCurrentPage(1); }}
                  className="border-2 border-black px-3 py-2 bg-white font-mono text-sm focus:outline-none"
                >
                  <option value="">All Outcomes</option>
                  {outcomeTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              )}

              {/* Community Context Filter */}
              {contextTypes.length > 0 && (
                <select
                  value={selectedContext}
                  onChange={(e) => { setSelectedContext(e.target.value); setCurrentPage(1); }}
                  className="border-2 border-black px-3 py-2 bg-white font-mono text-sm focus:outline-none"
                >
                  <option value="">All Contexts</option>
                  {contextTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              )}

              {/* Clear Filters */}
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors text-sm font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="container-justice py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500 font-mono">Loading interventions...</span>
            </div>
          ) : interventions.length === 0 ? (
            <div className="border-2 border-black p-12 text-center bg-white">
              <p className="text-xl font-bold mb-4">No programs found</p>
              <p className="text-gray-600 mb-6">Try adjusting your filters or search terms.</p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-black text-white font-bold uppercase tracking-wider hover:bg-gray-800"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-mono text-gray-600">
                  Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, total)} of {total}
                </p>
              </div>

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {interventions.map((item) => (
                    <Link
                      key={item.id}
                      href={`/intelligence/interventions/${item.id}`}
                      className="border-2 border-black bg-white p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-bold text-lg leading-tight group-hover:text-emerald-700 transition-colors">
                          {item.name}
                        </h3>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-black shrink-0" />
                      </div>

                      {item.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {item.type && (
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase text-white ${TYPE_COLORS[item.type] || 'bg-gray-600'}`}>
                            {item.type}
                          </span>
                        )}
                        {item.geography && item.geography[0] && (
                          <span className="px-2 py-1 text-[10px] font-bold uppercase bg-gray-100 border border-gray-300 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {item.geography[0]}
                          </span>
                        )}
                      </div>

                      {item.evidence_level && (
                        <div className={`mt-3 px-2 py-1 text-[10px] font-bold border ${EVIDENCE_COLORS[item.evidence_level] || EVIDENCE_COLORS['Unknown']}`}>
                          <Shield className="w-3 h-3 inline mr-1" />
                          {item.evidence_level.split(' (')[0]}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-3">
                  {interventions.map((item) => (
                    <Link
                      key={item.id}
                      href={`/intelligence/interventions/${item.id}`}
                      className="block border-2 border-black bg-white p-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-lg truncate group-hover:text-emerald-700">
                              {item.name}
                            </h3>
                            {item.type && (
                              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase text-white shrink-0 ${TYPE_COLORS[item.type] || 'bg-gray-600'}`}>
                                {item.type}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {item.geography && item.geography[0] && (
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {item.geography[0]}
                            </span>
                          )}
                          {item.evidence_level && (
                            <span className={`px-2 py-1 text-[10px] font-bold border ${EVIDENCE_COLORS[item.evidence_level] || EVIDENCE_COLORS['Unknown']}`}>
                              {item.evidence_level.split(' (')[0]}
                            </span>
                          )}
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <div className="border-2 border-black overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-black text-white">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Location</th>
                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Evidence</th>
                        <th className="px-4 py-3 text-center font-bold uppercase tracking-wider w-20">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {interventions.map((item, idx) => (
                        <tr key={item.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                          <td className="px-4 py-3 font-medium">
                            <Link href={`/intelligence/interventions/${item.id}`} className="hover:text-emerald-700 hover:underline">
                              {item.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            {item.type && (
                              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase text-white ${TYPE_COLORS[item.type] || 'bg-gray-600'}`}>
                                {item.type}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {item.geography?.join(', ') || '-'}
                          </td>
                          <td className="px-4 py-3">
                            {item.evidence_level ? (
                              <span className={`px-2 py-0.5 text-[10px] font-bold border ${EVIDENCE_COLORS[item.evidence_level] || EVIDENCE_COLORS['Unknown']}`}>
                                {item.evidence_level.split(' (')[0]}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link
                              href={`/intelligence/interventions/${item.id}`}
                              className="inline-flex items-center justify-center w-8 h-8 border border-black hover:bg-black hover:text-white transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 pt-8 border-t-2 border-black">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border-2 border-black font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 border-2 font-bold font-mono ${
                            pageNum === currentPage
                              ? 'bg-black text-white border-black'
                              : 'border-black hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border-2 border-black font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
