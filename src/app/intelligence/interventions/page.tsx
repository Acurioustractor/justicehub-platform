'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Navigation, Footer } from '@/components/ui/navigation';
import { InterventionsStatStrip } from '@/components/intelligence/InterventionsStatStrip';
import { InterventionsCrossLinks } from '@/components/intelligence/InterventionsCrossLinks';
import { OrgsAndProgramsExplorer } from '@/components/intelligence/OrgsAndProgramsExplorer';

// Leaflet has no SSR
const InterventionsMap = dynamic(
  () => import('@/components/intelligence/InterventionsMap'),
  {
    ssr: false,
    loading: () => (
      <section className="border-b-2 border-black bg-black" style={{ height: 600 }} />
    ),
  },
);
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
  ArrowUpDown,
  TrendingUp,
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
  portfolio_score: number | null;
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
  const [sortBy, setSortBy] = useState('name');
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
        if (sortBy !== 'name') {
          params.set('sort', sortBy);
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
  }, [searchQuery, selectedType, selectedEvidence, selectedOutcome, selectedContext, sortBy, currentPage]);

  const totalPages = Math.ceil(total / pageSize);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedEvidence('');
    setSelectedOutcome('');
    setSelectedContext('');
    setSortBy('name');
    setCurrentPage(1);
  };

  const hasFilters = searchQuery || selectedType || selectedEvidence || selectedOutcome || selectedContext || sortBy !== 'name';

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
            </div>
          </div>
        </section>

        {/* Decision-grade stats strip */}
        <InterventionsStatStrip />

        {/* Geographic spread — Leaflet heatmap */}
        <InterventionsMap />

        {/* Unified Orgs + Programs explorer — shared filters, two tabs, sortable list, side panel */}
        <OrgsAndProgramsExplorer />


        {/* Cross-links — go deeper into related reports + maps */}
        <InterventionsCrossLinks />
      </main>

      <Footer />
    </div>
  );
}
