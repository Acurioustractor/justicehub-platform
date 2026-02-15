'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Globe,
  ArrowLeft,
  ExternalLink,
  Download,
  BookOpen,
  Award,
  TrendingDown,
  Users,
  Heart,
  Shield,
  Scale,
  MapPin,
  ChevronRight,
  FileText,
  Video,
  Search,
  Filter,
  Grid,
  List,
  Target
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import ExcellenceMap from '@/components/ExcellenceMap';
import { internationalModels } from '@/content/excellence-map-locations';

// Program type from database
type Program = {
  id: string;
  name: string;
  slug: string;
  country: string;
  city_location?: string;
  region: string;
  program_type: string[];
  description: string;
  approach_summary: string;
  recidivism_rate: number | null;
  recidivism_comparison: string | null;
  evidence_strength: string;
  key_outcomes: Array<{
    metric: string;
    value: string;
    comparison?: string;
    detail?: string;
    timeframe?: string;
  }>;
  scale: string | null;
  year_established: number | null;
  website_url: string | null;
  australian_adaptations: string[] | null;
  collaboration_opportunities: string | null;
};

const REGION_LABELS: Record<string, string> = {
  north_america: 'North America',
  europe: 'Europe',
  asia_pacific: 'Asia-Pacific',
  africa: 'Africa',
  latin_america: 'Latin America',
  australasia: 'Australasia',
  middle_east: 'Middle East',
};

const EVIDENCE_LABELS: Record<string, { label: string; emoji: string }> = {
  rigorous_rct: { label: 'Rigorous RCT', emoji: '🔬' },
  quasi_experimental: { label: 'Quasi-Experimental', emoji: '📊' },
  longitudinal_study: { label: 'Longitudinal Study', emoji: '📈' },
  evaluation_report: { label: 'Evaluation Report', emoji: '📋' },
  promising_practice: { label: 'Promising Practice', emoji: '✨' },
  emerging: { label: 'Emerging', emoji: '🌱' },
};

// Coordinate mapping for programs
const LOCATION_COORDS: { [key: string]: [number, number] } = {
  // North America
  'Los Angeles': [34.0522, -118.2437],
  'Chicago': [41.8781, -87.6298],
  'New York': [40.7128, -74.0060],
  'Boston': [42.3601, -71.0589],
  'Kansas City': [39.0997, -94.5786],
  'Dallas': [32.7767, -96.7970],
  'Pittsburgh': [40.4406, -79.9959],
  'Seattle': [47.6062, -122.3321],
  'Illinois': [40.6331, -89.3985],
  'United States': [37.0902, -95.7129],
  'National': [37.0902, -95.7129],
  'Global': [20, 0],

  // Europe
  'United Kingdom': [51.5074, -0.1278],
  'London': [51.5074, -0.1278],
  'Birmingham': [52.4862, -1.8904],
  'Enfield': [51.6523, -0.0810],
  'North Yorkshire': [54.2766, -1.8258],
  'Online': [51.5074, -0.1278],
  'Iceland': [64.9631, -19.0208],
  'Scotland': [56.4907, -4.2026],
  'Finland': [61.9241, 25.7482],
  'Spain': [40.4637, -3.7492],
  'Netherlands': [52.1326, 5.2913],
  'Norway': [60.4720, 8.4689],
  'Germany': [51.1657, 10.4515],

  // Africa
  'South Africa': [-30.5595, 22.9375],
  'Kenya': [-0.0236, 37.9062],
  'Uganda': [1.3733, 32.2903],

  // Latin America
  'Brazil': [-14.2350, -51.9253],
  'Argentina': [-38.4161, -63.6167],
  'Colombia': [4.5709, -74.2973],
  'Chile': [-35.6751, -71.5430],
  'Mexico': [23.6345, -102.5528],

  // Asia Pacific
  'New Zealand': [-40.9006, 174.8860],
  'Auckland': [-36.8485, 174.7633],
  'Australia': [-25.2744, 133.7751],
  'Singapore': [1.3521, 103.8198],
  'Japan': [36.2048, 138.2529],
};

// Get coordinates for a program based on location or country
function getCoordinatesForProgram(program: Program): [number, number] {
  // Try city_location if it exists
  if (program.city_location && LOCATION_COORDS[program.city_location]) {
    return LOCATION_COORDS[program.city_location];
  }

  // Try country
  if (LOCATION_COORDS[program.country]) {
    return LOCATION_COORDS[program.country];
  }

  // Try partial matches
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (program.city_location?.includes(key) || program.country?.includes(key)) {
      return coords;
    }
  }

  // Default to center of map
  return [20, 0];
}

// Top stats data - these will be dynamically calculated from programs
const TOP_STATS = [
  {
    icon: TrendingDown,
    value: '13.6%',
    label: 'Diagrama Spain recidivism vs 80-96% traditional',
    color: 'text-green-600'
  },
  {
    icon: Heart,
    value: '86%',
    label: 'Victim satisfaction in NZ restorative justice',
    color: 'text-red-600'
  },
  {
    icon: Users,
    value: 'Only 4',
    label: 'Youth in custody across all of Finland',
    color: 'text-blue-600'
  },
  {
    icon: Shield,
    value: 'Age 12',
    label: "Scotland's criminal responsibility age (raised from 8)",
    color: 'text-purple-600'
  },
  {
    icon: Award,
    value: '8%',
    label: 'Missouri Model recidivism rate',
    color: 'text-yellow-600'
  }
];

export default function GlobalInsightsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [evidenceFilter, setEvidenceFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const params = new URLSearchParams();
        if (regionFilter) params.append('region', regionFilter);
        if (evidenceFilter) params.append('evidence', evidenceFilter);

        const response = await fetch(`/api/international-programs?${params}`);
        const data = await response.json();
        setPrograms(data.programs || []);
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPrograms();
  }, [regionFilter, evidenceFilter]);

  const toggleProgram = (programId: string) => {
    setExpandedProgram(expandedProgram === programId ? null : programId);
  };

  // Client-side search filtering
  const filteredPrograms = programs.filter((program) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      program.name.toLowerCase().includes(search) ||
      program.country.toLowerCase().includes(search) ||
      program.description.toLowerCase().includes(search) ||
      program.approach_summary.toLowerCase().includes(search)
    );
  });

  const getResourceIcon = (type: string) => {
    // Note: programs from database don't have resources yet
    // This is placeholder for future enhancement
    return <ExternalLink className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="header-offset">
        {/* Header */}
        <section className="section-padding bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 border-b-2 border-black">
          <div className="container-justice">
            <Link
              href="/centre-of-excellence"
              className="inline-flex items-center gap-2 font-bold text-gray-700 hover:text-black mb-6 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Centre of Excellence
            </Link>

            <div className="inline-block px-4 py-2 bg-purple-100 border-2 border-black mb-6">
              <span className="font-bold">GLOBAL INSIGHTS</span>
            </div>

            <h1 className="headline-truth mb-6">
              International Models
            </h1>

            <p className="text-xl text-gray-700 max-w-4xl mb-6 leading-relaxed">
              16 global programs proving what's possible. Spain (13.6% recidivism), New Zealand (86% victim satisfaction), Finland (only 4 youth in custody). See what works when you invest in community.
            </p>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              {TOP_STATS.map((stat, idx) => (
                <div key={idx} className="border-2 border-black p-6 bg-white text-center">
                  <stat.icon className={`h-10 w-10 mx-auto mb-3 ${stat.color}`} />
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Search and Filters */}
            <div className="bg-white border-2 border-black shadow-brutal p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  <h3 className="text-lg font-bold">Search & Filter Programs</h3>
                </div>

                {/* View Toggle */}
                <div className="flex gap-2 border-2 border-black p-1">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-4 py-2 font-bold flex items-center gap-2 transition-all ${
                      viewMode === 'cards'
                        ? 'bg-black text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                    Cards
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 font-bold flex items-center gap-2 transition-all ${
                      viewMode === 'table'
                        ? 'bg-black text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <List className="h-4 w-4" />
                    Table
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-bold mb-2">Search Programs</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, country..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Region Filter */}
                <div>
                  <label className="block text-sm font-bold mb-2">Region</label>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Regions</option>
                    {Object.entries(REGION_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Evidence Filter */}
                <div>
                  <label className="block text-sm font-bold mb-2">Evidence Strength</label>
                  <select
                    value={evidenceFilter}
                    onChange={(e) => setEvidenceFilter(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Evidence Types</option>
                    {Object.entries(EVIDENCE_LABELS).map(([key, { label, emoji }]) => (
                      <option key={key} value={key}>
                        {emoji} {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(regionFilter || evidenceFilter || searchTerm) && (
                <div className="mt-4 pt-4 border-t-2 border-gray-200 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-700">
                    Showing {filteredPrograms.length} of {programs.length} programs
                  </p>
                  <button
                    onClick={() => {
                      setRegionFilter('');
                      setEvidenceFilter('');
                      setSearchTerm('');
                    }}
                    className="text-sm font-bold text-blue-700 hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* International Programs Map */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Globe className="h-6 w-6" />
                International Programs Map
              </h3>
              <p className="text-gray-700 mb-6">
                Click markers to view program details. Showing {filteredPrograms.length} programs.
              </p>
              <ExcellenceMap
                locations={filteredPrograms.map(p => ({
                  id: p.id,
                  name: p.name,
                  category: 'international-model' as const,
                  type: 'global-insight' as const,
                  description: p.description,
                  coordinates: {
                    lat: getCoordinatesForProgram(p)[0],
                    lng: getCoordinatesForProgram(p)[1]
                  },
                  country: p.country,
                  city: p.city_location,
                  keyStats: [
                    p.recidivism_rate !== null ? `${p.recidivism_rate}% recidivism` : null,
                    p.evidence_strength ? EVIDENCE_LABELS[p.evidence_strength]?.label : null,
                    p.year_established ? `Est. ${p.year_established}` : null
                  ].filter((s): s is string => s !== null),
                  tags: p.program_type || [],
                  detailUrl: `#program-${p.id}`,
                  externalUrl: p.website_url || undefined
                }))}
                height="500px"
                initialZoom={1.5}
                initialCenter={[25, 30]}
              />
            </div>
          </div>
        </section>

        {/* International Programs List */}
        <section className="section-padding">
          <div className="container-justice">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-gray-600 font-bold">Loading programs...</p>
              </div>
            ) : filteredPrograms.length === 0 ? (
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
                <p className="text-xl font-bold mb-2">No programs found</p>
                <p className="text-gray-600">
                  {programs.length === 0
                    ? 'Programs are being loaded into the database'
                    : 'Try adjusting your filters or search terms'}
                </p>
              </div>
            ) : viewMode === 'table' ? (
              <>
              <div className="border-2 border-black bg-white overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-black">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Country</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Recidivism</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Evidence</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Website</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-200">
                    {filteredPrograms.map((program) => (
                      <React.Fragment key={program.id}>
                        <tr id={`program-${program.id}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{program.name}</div>
                            <div className="text-sm text-gray-600">{program.description.substring(0, 100)}...</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-900">{program.country}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700">
                              {program.program_type?.[0]?.replace(/_/g, ' ') || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {program.recidivism_rate !== null ? (
                              <div className="flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-green-600" />
                                <span className="font-bold text-green-600">{program.recidivism_rate}%</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm">
                              {EVIDENCE_LABELS[program.evidence_strength]?.emoji || ''}
                              {EVIDENCE_LABELS[program.evidence_strength]?.label?.substring(0, 20) || program.evidence_strength}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {program.website_url && (
                              <a
                                href={program.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center gap-1"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleProgram(program.id)}
                              className="px-4 py-2 border-2 border-black font-bold text-sm hover:bg-black hover:text-white transition-all"
                            >
                              {expandedProgram === program.id ? 'Hide' : 'Details'}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded row appears immediately after this row */}
                        {expandedProgram === program.id && (
                          <tr>
                            <td colSpan={7} className="px-0 py-0">
                              <div className="bg-gray-50 border-t-2 border-b-2 border-gray-300">
                                <div className="p-6">
                                  <div className="max-w-4xl mx-auto space-y-6">
                                    {/* Approach Summary */}
                                    <div>
                                      <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                        <Scale className="h-6 w-6" />
                                        Approach
                                      </h3>
                                      <p className="text-gray-700 leading-relaxed">{program.approach_summary}</p>
                                      {program.year_established && (
                                        <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-600">
                                          <Award className="h-5 w-5 text-blue-600" />
                                          <span className="font-bold">Established: {program.year_established}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Key Outcomes */}
                                    {program.key_outcomes && program.key_outcomes.length > 0 && (
                                      <div>
                                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                          <Target className="h-6 w-6" />
                                          Key Outcomes
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {program.key_outcomes.map((outcome, idx) => (
                                            <div key={idx} className="border-2 border-black p-4 bg-white">
                                              <div className="text-sm text-gray-600 mb-1">{outcome.metric}</div>
                                              <div className="text-2xl font-bold text-green-600">{outcome.value}</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Australian Context */}
                                    {program.australian_adaptations && (
                                      <div>
                                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                          <MapPin className="h-6 w-6" />
                                          Australian Adaptations
                                        </h3>
                                        <div className="bg-yellow-50 border-2 border-yellow-600 p-4">
                                          <p className="text-gray-700">{program.australian_adaptations}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            ) : (
              <div className="space-y-8">
                {filteredPrograms.map((program) => (
                  <div
                    key={program.id}
                    id={`program-${program.id}`}
                    className="border-2 border-black bg-white hover:shadow-brutal transition-all"
                  >
                    {/* Program Header */}
                    <div className="p-6 border-b-2 border-black bg-gray-50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <MapPin className="h-6 w-6" />
                            <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                              {program.country}
                            </span>
                            {program.evidence_strength === 'rigorous_rct' && (
                              <span className="px-3 py-1 bg-yellow-400 text-xs font-bold">FEATURED</span>
                            )}
                          </div>
                          <h2 className="text-3xl font-bold mb-2">{program.name}</h2>
                          <p className="text-lg text-gray-700 italic">
                            {program.recidivism_comparison || program.approach_summary}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleProgram(program.id)}
                          className="px-6 py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-all flex items-center gap-2"
                        >
                          {expandedProgram === program.id ? 'Show Less' : 'Learn More'}
                          <ChevronRight
                            className={`h-5 w-5 transition-transform ${
                              expandedProgram === program.id ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                      </div>

                      <p className="text-gray-700 leading-relaxed">{program.description}</p>
                    </div>

                    {/* Outcomes Summary */}
                    <div className="p-6 bg-white border-b-2 border-black">
                      <h3 className="text-xl font-bold mb-4">Key Outcomes</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {program.key_outcomes?.slice(0, 3).map((outcome, idx) => (
                          <div key={idx} className="border-2 border-black p-4 bg-gray-50">
                            <div className="text-2xl font-bold mb-1 text-blue-600">{outcome.value}</div>
                            <div className="font-bold text-sm mb-1">{outcome.metric}</div>
                            <div className="text-xs text-gray-600">
                              {outcome.detail || outcome.comparison || outcome.timeframe || ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedProgram === program.id && (
                      <>
                        {/* Approach Summary */}
                        <div className="p-6 bg-white border-b-2 border-black">
                          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Scale className="h-6 w-6" />
                            Approach
                          </h3>
                          <p className="text-gray-700 leading-relaxed">{program.approach_summary}</p>

                          {program.year_established && (
                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-600">
                              <Award className="h-5 w-5 text-blue-600" />
                              <span className="font-bold">Established: {program.year_established}</span>
                            </div>
                          )}
                        </div>

                        {/* Evidence & Outcomes */}
                        <div className="p-6 bg-white border-b-2 border-black">
                          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Award className="h-6 w-6" />
                            Evidence & All Outcomes
                          </h3>

                          {program.evidence_strength && (
                            <div className="mb-4">
                              <span className="px-3 py-2 bg-purple-100 text-purple-800 font-bold border-2 border-purple-800 inline-flex items-center gap-2">
                                {EVIDENCE_LABELS[program.evidence_strength]?.emoji}
                                {EVIDENCE_LABELS[program.evidence_strength]?.label || program.evidence_strength}
                              </span>
                            </div>
                          )}

                          {program.recidivism_rate !== null && (
                            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-600">
                              <div className="text-sm font-bold text-green-800 mb-1">Recidivism Rate</div>
                              <div className="text-3xl font-black text-green-900">{program.recidivism_rate}%</div>
                              {program.recidivism_comparison && (
                                <div className="text-sm text-green-700 mt-1">{program.recidivism_comparison}</div>
                              )}
                            </div>
                          )}

                          <div className="space-y-3">
                            {program.key_outcomes?.map((outcome, idx) => (
                              <div key={idx} className="border-l-4 border-blue-600 pl-4">
                                <div className="font-bold">{outcome.metric}</div>
                                <div className="text-lg text-blue-600">{outcome.value}</div>
                                {(outcome.detail || outcome.comparison) && (
                                  <div className="text-sm text-gray-600">
                                    {outcome.detail || outcome.comparison}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Australian Adaptations */}
                        {program.australian_adaptations && program.australian_adaptations.length > 0 && (
                          <div className="p-6 bg-yellow-50 border-b-2 border-black">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                              <MapPin className="h-6 w-6" />
                              Australian Adaptations
                            </h3>
                            <div className="space-y-2">
                              {program.australian_adaptations.map((adaptation, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <Heart className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-600" />
                                  <span className="text-gray-700">{adaptation}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Collaboration Opportunities */}
                        {program.collaboration_opportunities && (
                          <div className="p-6 bg-blue-50">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                              <Users className="h-6 w-6" />
                              Collaboration Opportunities
                            </h3>
                            <p className="text-gray-700">{program.collaboration_opportunities}</p>
                            {program.website_url && (
                              <a
                                href={program.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                              >
                                Visit Program Website
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Add Your Research CTA */}
        <section className="section-padding bg-gradient-to-br from-blue-400 to-purple-400 border-t-2 border-black">
          <div className="container-justice text-center">
            <Globe className="h-16 w-16 mx-auto mb-6 text-white" />
            <h2 className="headline-truth mb-6 text-white">Know of International Best Practice?</h2>
            <p className="text-xl text-white max-w-3xl mx-auto mb-8 leading-relaxed">
              Have you seen effective youth justice models in other countries? Help us build Australia's most comprehensive international evidence base by sharing research, reports, or your observations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-4 bg-white text-black font-bold hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2"
              >
                <FileText className="h-5 w-5" />
                Submit International Research
              </Link>
              <Link
                href="/centre-of-excellence/research"
                className="px-8 py-4 border-2 border-white text-white font-bold hover:bg-white hover:text-black transition-all inline-flex items-center justify-center gap-2"
              >
                <BookOpen className="h-5 w-5" />
                Browse Research Library
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Legacy static data removed - now using database via /api/international-programs
// All program data is managed in Supabase international_programs table
// To add new programs, use: /src/scripts/populate-global-programs.ts or admin interface

/* REMOVED STATIC DATA - NOW DYNAMIC FROM DATABASE

The following static arrays have been replaced with database queries:
- INTERNATIONAL_MODELS[] - Now fetched from international_programs table via API

Benefits of database approach:
1. Single source of truth for all program data
2. Can be updated via admin interface without code changes
3. Supports search, filtering, and complex queries
4. Enables linking to stories, services, and Australian programs
5. Tracks visits, invitations, and collaboration history
6. Scalable to hundreds of programs

Migration notes:
- Original static data had 6 programs with rich metadata
- Database now contains 16 programs (12 initial + 4 from migration)
- Some fields from static data (keyPrinciples, strengths, challenges, resources)
  are not yet in database schema - can be added as needed
- Current focus is on outcomes, evidence, and Australian connections
*/
