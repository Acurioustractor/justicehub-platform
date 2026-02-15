'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Grid3X3,
  List,
  ChevronRight,
  Microscope,
  Mountain,
  BookOpen,
  Shield,
  Filter,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Navigation, Footer } from '@/components/ui/navigation';

interface ProgramCatalogRecord {
  id: string;
  name: string;
  description: string | null;
  organization_id: string | null;
  organization_name: string | null;
  state: string | null;
  location: string | null;
  approach: string | null;
  impact_summary: string | null;
  tags: string[] | null;
  latitude: number | null;
  longitude: number | null;
  alma_intervention_id: string | null;
  linked_service_id: string | null;
  is_featured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface Story {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  featured_image_url: string | null;
  participant_name: string;
  tags: string[] | null;
}

const TYPE_COLORS: Record<string, string> = {
  'Indigenous-led': 'bg-orange-700 text-white',
  'Community-based': 'bg-blue-700 text-white',
  Grassroots: 'bg-green-700 text-white',
  'Culturally-responsive': 'bg-purple-700 text-white',
  'Community-Led': 'bg-purple-600 text-white',
  'Diversion': 'bg-green-600 text-white',
  'Early Intervention': 'bg-blue-600 text-white',
  'Family Strengthening': 'bg-pink-600 text-white',
  'Prevention': 'bg-teal-600 text-white',
  'Wraparound Support': 'bg-amber-600 text-white',
};

interface CommunityProgramsContentProps {
  initialPrograms: ProgramCatalogRecord[];
}

export function CommunityProgramsContent({ initialPrograms }: CommunityProgramsContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedEvidence, setSelectedEvidence] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);

  useEffect(() => {
    async function fetchStories() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('stories')
        .select('id, title, slug, excerpt, featured_image_url, participant_name, tags')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(6);

      if (!error && data) {
        setStories(data);
      }
      setStoriesLoading(false);
    }
    fetchStories();
  }, []);

  const types = useMemo(() => {
    const typeSet = new Set<string>();
    initialPrograms.forEach((p) => {
      if (p.approach) typeSet.add(p.approach);
    });
    return Array.from(typeSet).sort();
  }, [initialPrograms]);

  const states = useMemo(() => {
    const stateSet = new Set<string>();
    initialPrograms.forEach((p) => {
      if (p.state) stateSet.add(p.state);
    });
    return Array.from(stateSet).sort();
  }, [initialPrograms]);

  const evidenceLevels = ['Linked Evidence', 'No Evidence Link'];

  const filteredPrograms = useMemo(() => {
    return initialPrograms.filter(program => {
      const matchesSearch = !searchQuery ||
        program.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || program.approach === selectedType;
      const matchesState = selectedState === 'all' || program.state === selectedState;
      const matchesEvidence =
        selectedEvidence === 'all' ||
        (selectedEvidence === 'Linked Evidence' && !!program.alma_intervention_id) ||
        (selectedEvidence === 'No Evidence Link' && !program.alma_intervention_id);
      return matchesSearch && matchesType && matchesState && matchesEvidence;
    });
  }, [initialPrograms, searchQuery, selectedType, selectedState, selectedEvidence]);

  const hasFilters = searchQuery || selectedType !== 'all' || selectedState !== 'all' || selectedEvidence !== 'all';

  const linkedEvidenceCount = initialPrograms.filter((p) => !!p.alma_intervention_id).length;

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      <main>
        {/* Hero Section */}
        <section className="header-offset pb-16 border-b-2 border-black">
          <div className="container-justice">
            <div className="text-center">
              <h1 className="headline-truth mb-6">
                Community Programs
              </h1>
              <p className="text-xl max-w-4xl mx-auto mb-6 leading-relaxed">
                Evidence-based community programs across Australia. Indigenous-led, diversion, mentoring,
                and cultural programs that transform lives through community strength and local wisdom.
              </p>

              <p className="text-sm max-w-2xl mx-auto mb-8 text-gray-600 border-l-4 border-ochre-400 pl-4 text-left">
                <strong>Community Programs</strong> are sourced from the canonical programs catalog.
                Where evidence exists, programs link to ALMA intervention records for drill-through context.
                Looking for all interventions? Visit our{' '}
                <a href="/intelligence/interventions" className="text-ochre-600 hover:underline font-medium">
                  Interventions Database
                </a>.
              </p>

              {/* Quick Links */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Link
                  href="/intelligence/evidence"
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white hover:bg-eucalyptus-50 font-bold text-sm transition-colors"
                >
                  <Microscope className="w-4 h-4" />
                  Research & Evidence (100+ studies)
                </Link>
                <Link
                  href="/centre-of-excellence"
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white hover:bg-ochre-50 font-bold text-sm transition-colors"
                >
                  <Mountain className="w-4 h-4" />
                  Centre of Excellence
                </Link>
                <Link
                  href="/intelligence/interventions"
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white hover:bg-purple-50 font-bold text-sm transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Linked Interventions ({linkedEvidenceCount})
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="font-mono text-4xl font-bold text-blue-800 mb-2">{initialPrograms.length}</div>
                  <p className="font-medium">Community Programs</p>
                  <p className="text-sm text-gray-600">Canonical catalog records</p>
                </div>
                <div className="text-center">
                  <div className="font-mono text-4xl font-bold text-orange-600 mb-2">{types.length}</div>
                  <p className="font-medium">Program Types</p>
                  <p className="text-sm text-gray-600">Diverse approaches</p>
                </div>
                <div className="text-center">
                  <div className="font-mono text-4xl font-bold text-emerald-600 mb-2">{linkedEvidenceCount}</div>
                  <p className="font-medium">Evidence Linked</p>
                  <p className="text-sm text-gray-600">ALMA intervention references</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Database */}
        <section className="py-16">
          <div className="container-justice">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4">DISCOVER PROGRAMS</h2>

              {/* Search */}
              <div className="mb-6">
                <div className="relative max-w-2xl">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search programs by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-2">TYPE</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-blue-800"
                  >
                    <option value="all">All Types</option>
                    {types.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-bold mb-2">STATE / TERRITORY</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-blue-800"
                  >
                    <option value="all">All States</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-bold mb-2">EVIDENCE LEVEL</label>
                  <select
                    value={selectedEvidence}
                    onChange={(e) => setSelectedEvidence(e.target.value)}
                    className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-blue-800"
                  >
                    <option value="all">All Evidence Levels</option>
                    {evidenceLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex border-2 border-black">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`p-3 font-bold transition-all ${
                        viewMode === 'cards' ? 'bg-black text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Grid3X3 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-3 font-bold transition-all border-l-2 border-black ${
                        viewMode === 'table' ? 'bg-black text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-lg font-medium">
                {filteredPrograms.length} programs found
              </p>
              {hasFilters && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('all');
                    setSelectedState('all');
                    setSelectedEvidence('all');
                  }}
                  className="px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors text-sm font-bold"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Results Display */}
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrograms.map((program) => (
                  <div
                    key={program.id}
                    className="border-2 border-black bg-white p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <Link
                        href={`/community-programs/${program.id}`}
                        className="font-bold text-lg leading-tight group-hover:text-emerald-700 transition-colors"
                      >
                        {program.name}
                      </Link>
                    </div>

                    {program.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {program.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      {program.approach && (
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase ${TYPE_COLORS[program.approach] || 'bg-gray-600 text-white'}`}>
                          {program.approach}
                        </span>
                      )}
                      {program.state && (
                        <span className="px-2 py-1 text-[10px] font-bold uppercase bg-gray-100 border border-gray-300 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {program.state}
                        </span>
                      )}
                    </div>

                    {program.organization_name && (
                      <div className="text-xs text-ochre-700 font-medium mb-2">
                        Organization: {program.organization_name}
                      </div>
                    )}

                    {program.alma_intervention_id ? (
                      <Link
                        href={`/intelligence/interventions/${program.alma_intervention_id}`}
                        className="inline-flex items-center px-2 py-1 text-[10px] font-bold border bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                      >
                        <Shield className="w-3 h-3 inline mr-1" />
                        Evidence Linked
                      </Link>
                    ) : (
                      <div className="inline-flex items-center px-2 py-1 text-[10px] font-bold border bg-gray-100 text-gray-600 border-gray-300">
                        <Shield className="w-3 h-3 inline mr-1" />
                        No Evidence Link
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto border-2 border-black">
                <table className="w-full text-sm">
                  <thead className="bg-black text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Program</th>
                      <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Location</th>
                      <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Evidence</th>
                      <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Organization</th>
                      <th className="px-4 py-3 text-center font-bold uppercase tracking-wider w-20">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPrograms.map((program, idx) => (
                      <tr key={program.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                        <td className="px-4 py-3 font-medium">
                          <Link href={`/community-programs/${program.id}`} className="hover:text-emerald-700 hover:underline">
                            {program.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {program.approach && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_COLORS[program.approach] || 'bg-gray-600 text-white'}`}>
                              {program.approach}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {program.state || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {program.alma_intervention_id ? (
                            <Link
                              href={`/intelligence/interventions/${program.alma_intervention_id}`}
                              className="px-2 py-0.5 text-[10px] font-bold border bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                            >
                              Linked
                            </Link>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold border bg-gray-100 text-gray-600 border-gray-300">
                              None
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {program.organization_name || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            href={`/community-programs/${program.id}`}
                            className="text-blue-800 hover:text-blue-600 font-bold text-sm"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredPrograms.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600 mb-4">No programs found matching your criteria</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('all');
                    setSelectedState('all');
                    setSelectedEvidence('all');
                  }}
                  className="cta-secondary"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Stories Section */}
        <section className="py-16 bg-gray-50 border-t-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-2 text-center">VOICES FROM COMMUNITY PROGRAMS</h2>
            <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
              Real stories from young people whose lives have been transformed through
              community-driven programs and indigenous wisdom.
            </p>

            {storiesLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
              </div>
            ) : stories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {stories.slice(0, 3).map((story) => (
                  <div key={story.id} className="data-card bg-white">
                    <div className="aspect-video bg-gray-200 mb-4 border-2 border-black overflow-hidden">
                      {story.featured_image_url ? (
                        <img
                          src={story.featured_image_url}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono text-sm bg-gradient-to-br from-blue-100 to-ochre-100">
                          <span className="text-4xl font-black text-blue-800/30">{story.title.charAt(0)}</span>
                        </div>
                      )}
                    </div>

                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{story.title}</h3>
                    {story.participant_name && (
                      <p className="text-sm text-blue-800 font-medium mb-2">By {story.participant_name}</p>
                    )}
                    {story.excerpt && (
                      <p className="text-gray-700 mb-4 line-clamp-3">{story.excerpt}</p>
                    )}

                    <Link
                      href={`/stories/${story.slug || story.id}`}
                      className="inline-flex items-center gap-2 text-sm font-bold text-blue-800 hover:text-blue-600"
                    >
                      Read story
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 bg-white">
                <p className="text-gray-600 mb-4">Stories coming soon...</p>
                <Link href="/stories/submit" className="text-blue-800 font-bold hover:underline">
                  Share your story
                </Link>
              </div>
            )}

            <div className="text-center mt-8">
              <Link href="/stories" className="cta-primary">
                READ MORE STORIES
              </Link>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl font-bold mb-6" style={{color: 'white'}}>
              Your Community. Your Solutions.
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto" style={{color: 'white'}}>
              Know of a program that&apos;s making real impact through community connection?
              Help us share their story and amplify their work.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/community-programs/nominate" className="bg-white text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-gray-100 transition-all">
                NOMINATE A PROGRAM
              </Link>
              <Link href="/services" className="border-2 border-white text-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
                FIND IMMEDIATE HELP
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
