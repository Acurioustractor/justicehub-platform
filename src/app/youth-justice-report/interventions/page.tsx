'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { MapPin, Filter, ChevronDown, ExternalLink } from 'lucide-react';

interface Intervention {
  id: string;
  name: string;
  description: string;
  type: string;
  geography: string[];
  evidence_level: string;
  consent_level: string;
  operating_organization: string;
  website: string;
  metadata: {
    state?: string;
    source?: string;
  };
}

const states = [
  { code: 'QLD', name: 'Queensland' },
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'SA', name: 'South Australia' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'NT', name: 'Northern Territory' },
  { code: 'ACT', name: 'Australian Capital Territory' },
];

const interventionTypes = [
  'Prevention',
  'Early Intervention',
  'Diversion',
  'Therapeutic',
  'Wraparound Support',
  'Family Strengthening',
  'Cultural Connection',
  'Education/Employment',
  'Justice Reinvestment',
  'Community-Led',
];

export default function InterventionsByStatePage() {
  const supabase = createClient();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [stateCounts, setStateCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      let query = supabase
        .from('alma_interventions')
        .select('id, name, description, type, geography, evidence_level, consent_level, operating_organization, website, metadata')
        .eq('review_status', 'Published')
        .limit(100);

      if (selectedState) {
        query = query.contains('metadata', { state: selectedState });
      }

      if (selectedType) {
        query = query.eq('type', selectedType);
      }

      const { data, error } = await query.order('name');

      if (!error && data) {
        setInterventions(data);
      }

      // Get state counts
      const { data: allData } = await supabase
        .from('alma_interventions')
        .select('metadata')
        .eq('review_status', 'Published')
        .limit(2000);

      const counts: Record<string, number> = {};
      allData?.forEach((row: any) => {
        const state = row.metadata?.state;
        if (state) {
          counts[state] = (counts[state] || 0) + 1;
        }
      });
      setStateCounts(counts);

      setLoading(false);
    }

    fetchData();
  }, [selectedState, selectedType]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-ochre-50 via-sand-50 to-white py-12 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <div className="flex items-center gap-2 text-sm text-earth-600 mb-4">
            <Link href="/youth-justice-report" className="hover:text-ochre-600">Report</Link>
            <span>/</span>
            <span>Interventions by State</span>
          </div>

          <h1 className="text-4xl font-black mb-4">
            Interventions by State
          </h1>

          <p className="text-lg text-earth-700 max-w-2xl">
            Browse youth justice interventions across Australian states and territories.
            Filter by jurisdiction and intervention type.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b-2 border-black bg-white sticky top-32 z-10">
        <div className="container-justice max-w-5xl">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-earth-600" />
              <span className="text-sm font-medium text-earth-600">Filters:</span>
            </div>

            <div className="relative">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="appearance-none border-2 border-black px-4 py-2 pr-10 bg-white font-medium text-sm cursor-pointer hover:bg-sand-50"
              >
                <option value="">All States</option>
                {states.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name} ({stateCounts[state.code] || 0})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="appearance-none border-2 border-black px-4 py-2 pr-10 bg-white font-medium text-sm cursor-pointer hover:bg-sand-50"
              >
                <option value="">All Types</option>
                {interventionTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>

            {(selectedState || selectedType) && (
              <button
                onClick={() => {
                  setSelectedState('');
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

      {/* State Overview Cards */}
      {!selectedState && !selectedType && (
        <section className="py-8 border-b-2 border-black bg-sand-50">
          <div className="container-justice max-w-5xl">
            <h2 className="text-lg font-bold mb-4">Coverage by State</h2>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {states.map((state) => (
                <button
                  key={state.code}
                  onClick={() => setSelectedState(state.code)}
                  className="border-2 border-black p-3 bg-white hover:bg-ochre-50 transition-colors text-center"
                >
                  <div className="text-2xl font-bold text-ochre-600">
                    {stateCounts[state.code] || 0}
                  </div>
                  <div className="text-xs font-medium">{state.code}</div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Results */}
      <section className="py-8">
        <div className="container-justice max-w-5xl">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ochre-600 mx-auto mb-4"></div>
              <p className="text-earth-600">Loading interventions...</p>
            </div>
          ) : interventions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300">
              <p className="text-earth-600">No interventions found matching your filters.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">
                  {interventions.length} Intervention{interventions.length !== 1 ? 's' : ''}
                  {selectedState && ` in ${states.find(s => s.code === selectedState)?.name}`}
                </h2>
              </div>

              <div className="space-y-4">
                {interventions.map((intervention) => (
                  <div
                    key={intervention.id}
                    className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-ochre-100 border border-black">
                            {intervention.type}
                          </span>
                          {intervention.metadata?.state && (
                            <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-sand-100 border border-black flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {intervention.metadata.state}
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-bold mb-2">{intervention.name}</h3>

                        {intervention.operating_organization && (
                          <p className="text-sm text-earth-600 mb-2">
                            {intervention.operating_organization}
                          </p>
                        )}

                        <p className="text-earth-700 line-clamp-2 mb-4">
                          {intervention.description}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {intervention.evidence_level && (
                            <span className="text-xs px-2 py-1 bg-eucalyptus-100 text-eucalyptus-800">
                              {intervention.evidence_level}
                            </span>
                          )}
                          {intervention.consent_level && (
                            <span className="text-xs px-2 py-1 bg-sand-100 text-earth-700">
                              {intervention.consent_level}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/intelligence/interventions/${intervention.id}`}
                          className="text-sm font-bold text-ochre-600 hover:text-ochre-800 whitespace-nowrap"
                        >
                          View Details
                        </Link>
                        {intervention.website && (
                          <a
                            href={intervention.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-earth-600 hover:text-earth-800 flex items-center gap-1"
                          >
                            Website <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
