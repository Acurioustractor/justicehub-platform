'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Users,
  DollarSign,
  Target,
  ChevronRight,
  Star,
  Heart,
  Building,
  Award
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

interface Program {
  id: string;
  name: string;
  organization: string;
  description: string;
  impact_summary: string;
  location: string;
  state: string;
  approach: string;
  participants_served: number;
  success_rate: number;
  years_operating: number;
  indigenous_knowledge: boolean;
  is_featured: boolean;
  tags: string[];
}

interface GrassrootsContentProps {
  initialPrograms: Program[];
}

export function GrassrootsContent({ initialPrograms }: GrassrootsContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Programs', icon: Target },
    { id: 'Indigenous-led', label: 'Indigenous-led', icon: Star },
    { id: 'Community-based', label: 'Community-based', icon: Building },
    { id: 'Grassroots', label: 'Grassroots', icon: Heart },
    { id: 'Culturally-responsive', label: 'Culturally-responsive', icon: Award }
  ];

  const filteredPrograms = useMemo(() => {
    return initialPrograms.filter(program => {
      const matchesSearch = program.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           program.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           program.organization?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || program.approach === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [initialPrograms, searchQuery, selectedCategory]);

  // Calculate stats from actual data
  const totalParticipants = initialPrograms.reduce((sum, p) => sum + (p.participants_served || 0), 0);
  const avgSuccessRate = initialPrograms.length > 0
    ? Math.round(initialPrograms.reduce((sum, p) => sum + (p.success_rate || 0), 0) / initialPrograms.length)
    : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Unified Navigation */}
      <Navigation />

      <main id="main-content">
        {/* Hero */}
        <section className="header-offset pb-16 border-b-2 border-black bg-gradient-to-br from-green-50 to-blue-50">
          <div className="container-justice">
            <div className="text-center">
              <h1 className="headline-truth mb-4">
                GRASSROOTS PROGRAMS
              </h1>
              <p className="text-xl max-w-3xl mx-auto mb-8">
                Curated deep-dive profiles of programs that demonstrably work. Quality over quantity. Behind-the-scenes insights into community-led solutions that transform lives.
              </p>

              {/* Search */}
              <div className="max-w-2xl mx-auto relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Explore methodologies, success stories, impact data..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-black focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Curation Features */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-black mb-2">{initialPrograms.length}</div>
                <div className="text-sm font-medium">Curated Programs</div>
                <div className="text-xs text-gray-600 mt-1">Handpicked for excellence</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-black mb-2">{totalParticipants.toLocaleString()}+</div>
                <div className="text-sm font-medium">Lives Transformed</div>
                <div className="text-xs text-gray-600 mt-1">Documented outcomes</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-black mb-2">{avgSuccessRate}%</div>
                <div className="text-sm font-medium">Success Rate</div>
                <div className="text-xs text-gray-600 mt-1">Verified impact data</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-black mb-2">
                  {initialPrograms.filter(p => p.indigenous_knowledge).length}
                </div>
                <div className="text-sm font-medium">Indigenous-led</div>
                <div className="text-xs text-gray-600 mt-1">Cultural wisdom</div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-xl font-bold mb-6">FILTER BY APPROACH</h2>
            <div className="flex flex-wrap gap-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-6 py-3 font-bold tracking-wider transition-all flex items-center gap-2
                      ${selectedCategory === category.id
                        ? 'bg-black text-white'
                        : 'border-2 border-black hover:bg-black hover:text-white'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Programs Grid */}
        <section className="section-padding">
          <div className="container-justice">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">
                {filteredPrograms.length} Curated Programs
              </h2>
              <p className="text-sm text-gray-600">
                Editorially selected - Deep-dive profiles - Verified impact data
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPrograms.map((program) => (
                <div key={program.id} className="border-2 border-black bg-white hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg leading-tight mb-2">{program.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="px-2 py-1 bg-gray-100 font-medium">{program.approach}</span>
                          {program.indigenous_knowledge && (
                            <span className="text-orange-600 font-bold">Indigenous</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{program.participants_served || 0}</div>
                        <div className="text-xs text-gray-500">participants</div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{program.organization}</p>
                    <p className="text-gray-700 mb-4 leading-relaxed line-clamp-3">
                      {program.description}
                    </p>

                    {program.impact_summary && (
                      <div className="mb-4 p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                        <div className="text-xs font-medium text-blue-800 mb-1">IMPACT</div>
                        <div className="text-sm text-blue-700 line-clamp-2">{program.impact_summary}</div>
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{program.location}, {program.state}</span>
                      </div>
                      {program.success_rate > 0 && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-green-600">
                            {program.success_rate}% success rate
                          </span>
                        </div>
                      )}
                      {program.years_operating > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{program.years_operating} years operating</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                      <Link
                        href={`/community-programs/${program.id}`}
                        className="inline-flex items-center gap-2 font-bold tracking-wider hover:underline"
                      >
                        DEEP DIVE
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/stories?program=${program.id}`}
                        className="text-sm font-medium text-gray-600 hover:text-black"
                      >
                        View Stories
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredPrograms.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600 mb-4">No programs found matching your criteria</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="cta-secondary"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Program Comparison Guide */}
        <section className="section-padding bg-gray-50 border-t-2 border-black">
          <div className="container-justice">
            <h2 className="text-2xl font-bold mb-8 text-center">EXPLORE MORE</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/services" className="group border-2 border-black bg-white p-6 hover:bg-black hover:text-white transition-all">
                <h3 className="font-bold mb-2">Service Finder</h3>
                <p className="text-sm">AI-powered comprehensive directory of all available support services across Australia</p>
              </Link>
              <Link href="/community-programs" className="group border-2 border-black bg-white p-6 hover:bg-black hover:text-white transition-all">
                <h3 className="font-bold mb-2">Community Programs</h3>
                <p className="text-sm">Browse all community programs with filters for approach, state, and Indigenous-led options</p>
              </Link>
              <Link href="/intelligence/interventions" className="group border-2 border-black bg-white p-6 hover:bg-black hover:text-white transition-all">
                <h3 className="font-bold mb-2">Interventions Database</h3>
                <p className="text-sm">Research-backed interventions and evidence-based programs across Australia</p>
              </Link>
            </div>

            <div className="mt-8 p-6 bg-white border-2 border-black">
              <div className="text-center">
                <h3 className="font-bold text-lg mb-2">Grassroots vs Service Finder</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 text-left">
                  <div>
                    <h4 className="font-bold text-sm mb-2">GRASSROOTS PROGRAMS (This Page)</h4>
                    <p className="text-sm text-gray-600">Curated excellence - Deep-dive profiles - Methodology insights - Behind-the-scenes content - Editorial review</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-2">SERVICE FINDER</h4>
                    <p className="text-sm text-gray-600">AI-powered directory - Comprehensive coverage - Real-time updates - Quick connections - All available services</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="section-padding bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl font-bold mb-4">Submit Your Program for Curation</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Running a program with proven outcomes? Apply for editorial review and join our curated collection of community-led solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/grassroots/apply" className="cta-primary bg-white text-black hover:bg-gray-100">
                APPLY FOR CURATION
              </Link>
              <Link href="/stories/new" className="cta-secondary border-white text-white hover:bg-white hover:text-black">
                SHARE SUCCESS STORY
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}
