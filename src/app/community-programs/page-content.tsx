'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Grid3X3,
  List,
  ChevronRight
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import FeaturedVideo from '@/components/FeaturedVideo';
import ImageGallery from '@/components/ImageGallery';

interface CommunityProgram {
  id: string;
  name: string;
  organization: string;
  location: string;
  state: string;
  approach: 'Indigenous-led' | 'Community-based' | 'Grassroots' | 'Culturally-responsive';
  description: string;
  impact_summary: string;
  success_rate: number;
  participants_served: number;
  years_operating: number;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  is_featured: boolean;
  indigenous_knowledge: boolean;
  community_connection_score: number;
  tags: string[];
  founded_year: number;
}

// Sample stories related to community programs
const communityStories = [
  {
    id: 1,
    title: "From Prison to Purpose: Marcus's Welding Journey",
    author: "Marcus Thompson",
    program: "BackTrack Youth Works",
    summary: "How working with rescue dogs and learning welding transformed a young man's life trajectory.",
    image: "/placeholder-marcus.jpg"
  },
  {
    id: 2,
    title: "Culture Saved My Life: Jayden's Healing Journey",
    author: "Jayden Williams",
    program: "Healing Circles Program",
    summary: "Traditional Aboriginal healing practices help a young person overcome trauma and find identity.",
    image: "/placeholder-jayden.jpg"
  },
  {
    id: 3,
    title: "Finding My Voice: Aisha's Social Work Path",
    author: "Aisha Patel",
    program: "Logan Youth Collective",
    summary: "From 'problem student' to social work advocate through youth-led community organizing.",
    image: "/placeholder-aisha.jpg"
  }
];

interface CommunityProgramsContentProps {
  initialPrograms: CommunityProgram[];
}

export function CommunityProgramsContent({ initialPrograms }: CommunityProgramsContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApproach, setSelectedApproach] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const approaches = [
    { id: 'all', label: 'All Approaches' },
    { id: 'Indigenous-led', label: 'Indigenous-led' },
    { id: 'Community-based', label: 'Community-based' },
    { id: 'Grassroots', label: 'Grassroots' },
    { id: 'Culturally-responsive', label: 'Culturally-responsive' }
  ];

  const states = [
    { id: 'all', label: 'All States' },
    { id: 'NSW', label: 'New South Wales' },
    { id: 'VIC', label: 'Victoria' },
    { id: 'QLD', label: 'Queensland' },
    { id: 'SA', label: 'South Australia' },
    { id: 'WA', label: 'Western Australia' },
    { id: 'TAS', label: 'Tasmania' },
    { id: 'NT', label: 'Northern Territory' },
    { id: 'ACT', label: 'Australian Capital Territory' }
  ];

  const featuredPrograms = useMemo(() =>
    initialPrograms.filter(program => program.is_featured),
    [initialPrograms]
  );

  const filteredPrograms = useMemo(() => {
    return initialPrograms.filter(program => {
      const matchesSearch = program.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           program.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           program.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesApproach = selectedApproach === 'all' || program.approach === selectedApproach;
      const matchesState = selectedState === 'all' || program.state === selectedState;
      return matchesSearch && matchesApproach && matchesState;
    });
  }, [initialPrograms, searchQuery, selectedApproach, selectedState]);

  const getApproachColor = (approach: string) => {
    switch (approach) {
      case 'Indigenous-led': return 'bg-orange-600 text-white';
      case 'Community-based': return 'bg-blue-800 text-white';
      case 'Grassroots': return 'bg-blue-600 text-white';
      case 'Culturally-responsive': return 'bg-orange-700 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  // Calculate stats from actual data
  const totalParticipants = initialPrograms.reduce((sum, p) => sum + (p.participants_served || 0), 0);
  const avgSuccessRate = initialPrograms.length > 0
    ? Math.round(initialPrograms.reduce((sum, p) => sum + (p.success_rate || 0), 0) / initialPrograms.length)
    : 0;

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
              <p className="text-xl max-w-4xl mx-auto mb-8 leading-relaxed">
                Curated profiles of programs that work. Indigenous knowledge. Community connection.
                Grassroots approaches that transform lives through cultural strength and local wisdom.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="font-mono text-4xl font-bold text-blue-800 mb-2">{initialPrograms.length}</div>
                  <p className="font-medium">Curated Programs</p>
                  <p className="text-sm text-gray-600">Quality over quantity</p>
                </div>
                <div className="text-center">
                  <div className="font-mono text-4xl font-bold text-orange-600 mb-2">{avgSuccessRate}%</div>
                  <p className="font-medium">Average Success Rate</p>
                  <p className="text-sm text-gray-600">Community-driven results</p>
                </div>
                <div className="text-center">
                  <div className="font-mono text-4xl font-bold text-blue-600 mb-2">{totalParticipants.toLocaleString()}+</div>
                  <p className="font-medium">Lives Transformed</p>
                  <p className="text-sm text-gray-600">Real community impact</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Programs */}
        {featuredPrograms.length > 0 && (
          <section className="py-16 border-b-2 border-black">
            <div className="container-justice">
              <h2 className="text-3xl font-bold mb-2 text-center">FEATURED PROGRAMS</h2>
              <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
                Exceptional programs showcasing the power of community-driven approaches,
                indigenous knowledge, and grassroots innovation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featuredPrograms.map((program) => (
                <div key={program.id} className="data-card">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 text-sm font-bold uppercase tracking-wider ${getApproachColor(program.approach)}`}>
                      {program.approach}
                    </span>
                    {program.indigenous_knowledge && (
                      <span className="text-orange-600 font-bold text-sm">
                        Indigenous Knowledge
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold mb-2">{program.name}</h3>
                  <p className="text-gray-600 mb-1">{program.organization}</p>
                  <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {program.location}, {program.state}
                  </p>

                  <p className="text-gray-700 mb-4 leading-relaxed">{program.impact_summary}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <div className="font-mono text-2xl font-bold text-blue-800">{program.success_rate}%</div>
                      <p className="text-xs text-gray-600">Success Rate</p>
                    </div>
                    <div className="text-center">
                      <div className="font-mono text-2xl font-bold text-orange-600">{program.participants_served}+</div>
                      <p className="text-xs text-gray-600">Lives Changed</p>
                    </div>
                    <div className="text-center">
                      <div className="font-mono text-2xl font-bold text-blue-600">{program.years_operating}</div>
                      <p className="text-xs text-gray-600">Years Impact</p>
                    </div>
                  </div>

                  <Link
                    href={`/community-programs/${program.id}`}
                    className="block w-full text-center cta-primary"
                  >
                    EXPLORE PROGRAM
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* Search and Database */}
        <section className="py-16">
          <div className="container-justice">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4">DISCOVER ALL PROGRAMS</h2>

              {/* Search */}
              <div className="mb-6">
                <div className="relative max-w-2xl">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search programs, organizations, approaches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-2">APPROACH</label>
                  <select
                    value={selectedApproach}
                    onChange={(e) => setSelectedApproach(e.target.value)}
                    className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-blue-800"
                  >
                    {approaches.map(approach => (
                      <option key={approach.id} value={approach.id}>{approach.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-bold mb-2">STATE</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-blue-800"
                  >
                    {states.map(state => (
                      <option key={state.id} value={state.id}>{state.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <div className="flex border-2 border-black">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`p-3 font-bold transition-all ${
                        viewMode === 'cards'
                          ? 'bg-black text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Grid3X3 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-3 font-bold transition-all border-l-2 border-black ${
                        viewMode === 'table'
                          ? 'bg-black text-white'
                          : 'hover:bg-gray-100'
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
              <p className="text-sm text-gray-600">
                Curated for community impact and cultural connection
              </p>
            </div>

            {/* Results Display */}
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrograms.map((program) => (
                  <div key={program.id} className="data-card">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider ${getApproachColor(program.approach)}`}>
                        {program.approach}
                      </span>
                      {program.indigenous_knowledge && (
                        <span className="text-orange-600 text-xs font-bold">Indigenous</span>
                      )}
                    </div>

                    <h3 className="font-bold text-lg mb-1">{program.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{program.organization}</p>
                    <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {program.location}, {program.state}
                    </p>

                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">{program.description}</p>

                    <div className="flex justify-between items-center mb-4 text-xs">
                      <div className="text-center">
                        <div className="font-mono font-bold text-blue-800">{program.success_rate}%</div>
                        <div className="text-gray-600">Success</div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono font-bold text-orange-600">{program.participants_served}+</div>
                        <div className="text-gray-600">Served</div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono font-bold text-blue-600">{program.years_operating}y</div>
                        <div className="text-gray-600">Operating</div>
                      </div>
                    </div>

                    <Link
                      href={`/community-programs/${program.id}`}
                      className="text-sm font-bold underline text-blue-800 hover:text-blue-600"
                    >
                      Learn more
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto border-2 border-black">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-black">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold">Program</th>
                      <th className="px-4 py-3 text-left font-bold">Approach</th>
                      <th className="px-4 py-3 text-left font-bold">Location</th>
                      <th className="px-4 py-3 text-center font-bold">Success Rate</th>
                      <th className="px-4 py-3 text-center font-bold">Participants</th>
                      <th className="px-4 py-3 text-center font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrograms.map((program, index) => (
                      <tr key={program.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-bold">{program.name}</div>
                            <div className="text-sm text-gray-600">{program.organization}</div>
                            {program.indigenous_knowledge && (
                              <div className="text-xs text-orange-600 font-bold mt-1">Indigenous Knowledge</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider ${getApproachColor(program.approach)}`}>
                            {program.approach}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {program.location}, {program.state}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-mono font-bold text-blue-800">{program.success_rate}%</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-mono font-bold text-orange-600">{program.participants_served}+</span>
                        </td>
                        <td className="px-4 py-4 text-center">
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
                    setSelectedApproach('all');
                    setSelectedState('all');
                  }}
                  className="cta-secondary"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Video Showcase Section */}
        <section className="py-16 border-t-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-4 text-center">PROGRAMS IN ACTION</h2>
            <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
              See community-driven programs transforming lives through cultural connection,
              hands-on skills training, and Indigenous leadership.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <FeaturedVideo
                videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                title="BackTrack Youth Works: Building Futures"
                description="Young people learning trade skills through work with rescue dogs and welding. Community-led mentorship creating real career pathways."
              />

              <FeaturedVideo
                videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                title="Cultural Healing Circles Transform Lives"
                description="Elder-led traditional practices help young Aboriginal people reconnect with culture, Country, and identity."
              />
            </div>

            <ImageGallery
              images={[
                {
                  src: '/api/placeholder/800/600',
                  alt: 'Community program participants',
                  caption: 'Maranguka Justice Reinvestment - Bourke',
                  credit: 'JusticeHub'
                },
                {
                  src: '/api/placeholder/800/600',
                  alt: 'Youth cultural camp',
                  caption: 'Cultural Connection on Country',
                  credit: 'Community Programs'
                },
                {
                  src: '/api/placeholder/800/600',
                  alt: 'Skills training workshop',
                  caption: 'Youth-Led Skills Workshop',
                  credit: 'Logan Youth Collective'
                },
                {
                  src: '/api/placeholder/800/600',
                  alt: 'Elder and youth together',
                  caption: 'Intergenerational Knowledge Sharing',
                  credit: 'Healing Circles Program'
                }
              ]}
              columns={4}
            />
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {communityStories.map((story) => (
                <div key={story.id} className="data-card bg-white">
                  <div className="aspect-video bg-gray-200 mb-4 border-2 border-black overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono text-sm">
                      STORY IMAGE: {story.author}
                    </div>
                  </div>

                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{story.title}</h3>
                  <p className="text-sm text-blue-800 font-medium mb-2">{story.program}</p>
                  <p className="text-gray-700 mb-4 line-clamp-3">{story.summary}</p>

                  <Link
                    href={`/stories/${story.id}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-blue-800 hover:text-blue-600"
                  >
                    Read story
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>

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
              Know of a program that's making real impact through community connection?
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
