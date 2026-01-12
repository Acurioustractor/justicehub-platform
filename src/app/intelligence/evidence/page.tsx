'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { FileText, Filter, Search, ExternalLink, Calendar, Building2, ChevronDown } from 'lucide-react';

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

const evidenceTypes = [
  'Program evaluation',
  'Randomized controlled trial',
  'Quasi-experimental',
  'Systematic review',
  'Meta-analysis',
  'Qualitative study',
  'Case study',
  'Policy analysis',
];

export default function EvidencePage() {
  const supabase = createClient();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function fetchEvidence() {
      setLoading(true);

      let query = supabase
        .from('alma_evidence')
        .select('id, title, evidence_type, methodology, findings, author, organization, publication_date, source_url, consent_level', { count: 'exact' })
        .order('publication_date', { ascending: false, nullsFirst: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,findings.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`);
      }

      if (selectedType) {
        query = query.eq('evidence_type', selectedType);
      }

      const { data, error, count } = await query.limit(50);

      if (!error && data) {
        setEvidence(data);
        // Use count from query if available, otherwise use actual data length
        setTotalCount(count ?? data.length);
      }

      setLoading(false);
    }

    fetchEvidence();
  }, [searchQuery, selectedType]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-eucalyptus-50 via-sand-50 to-ochre-50 py-12 border-b-2 border-black">
          <div className="container-justice">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-eucalyptus-100 border-2 border-black">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-5xl font-black">Research & Evidence</h1>
                <p className="text-earth-600">Peer-reviewed research on youth justice</p>
              </div>
            </div>

            <p className="text-lg text-earth-700 max-w-2xl">
              Browse research papers, program evaluations, and evidence studies
              documenting what works in youth justice across Australia and internationally.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <div className="text-sm text-earth-600">
                <span className="font-bold text-2xl text-eucalyptus-600">{totalCount}</span> studies documented
              </div>
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
              <div className="relative flex-1 max-w-md">
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
                  {evidenceTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              </div>

              {(searchQuery || selectedType) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('');
                  }}
                  className="text-sm text-ochre-600 hover:text-ochre-800 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="py-8">
          <div className="container-justice">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eucalyptus-600"></div>
              </div>
            ) : evidence.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-earth-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No evidence found</h3>
                <p className="text-earth-600">
                  {searchQuery || selectedType
                    ? 'Try adjusting your search or filters'
                    : 'Evidence studies will appear here as they are added'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {evidence.map((item) => (
                  <Link
                    key={item.id}
                    href={`/intelligence/evidence/${item.id}`}
                    className="block border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow bg-white"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Type badge */}
                        {item.evidence_type && (
                          <span className="inline-block text-xs font-bold uppercase tracking-wider px-2 py-1 bg-eucalyptus-100 text-eucalyptus-800 border border-eucalyptus-300 mb-3">
                            {item.evidence_type}
                          </span>
                        )}

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

                        {/* Findings preview */}
                        {item.findings && item.findings !== 'See source document' && (
                          <p className="text-earth-700 text-sm line-clamp-2">
                            {item.findings}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
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
            {evidence.length > 0 && evidence.length < totalCount && (
              <div className="text-center mt-8 text-sm text-earth-600">
                Showing {evidence.length} of {totalCount} studies
              </div>
            )}
          </div>
        </section>

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
