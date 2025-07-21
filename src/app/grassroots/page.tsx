'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  MapPin, 
  Users, 
  DollarSign, 
  Target,
  Filter,
  Phone,
  Mail,
  Globe,
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
  category: 'youth-development' | 'education' | 'health' | 'justice' | 'community';
  description: string;
  methodology: string;
  location: string;
  participants: number;
  outcomes: string;
  impactData: string;
  fundingModel: 'community' | 'grants' | 'social-enterprise' | 'hybrid';
  fundingAmount: string;
  successStories: number;
  featuredDate: string;
  curatedBy: string;
}

export default function GrassrootsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const samplePrograms: Program[] = [
    {
      id: '1',
      name: 'Logan Youth Collective',
      organization: 'Logan Community Foundation',
      category: 'youth-development',
      description: 'Peer-led mentorship program connecting young people with similar experiences through structured circles and creative expression',
      methodology: 'Trauma-informed peer mentorship using circle processes, creative arts therapy, and community engagement activities',
      location: 'Logan, QLD',
      participants: 150,
      outcomes: '85% reduction in reoffending, 70% return to education/employment',
      impactData: '24-month follow-up study shows sustained positive outcomes with 78% maintaining stable housing',
      fundingModel: 'community',
      fundingAmount: '$180,000/year',
      successStories: 12,
      featuredDate: '2024-01-15',
      curatedBy: 'Editorial Team'
    },
    {
      id: '2', 
      name: 'Caboolture Skills Exchange',
      organization: 'Caboolture Neighbourhood Centre',
      category: 'education',
      description: 'Community-taught trade skills program combining traditional apprenticeships with peer learning and industry mentorship',
      methodology: 'Competency-based learning with master craftspeople, peer tutoring circles, and real-world project placements',
      location: 'Caboolture, QLD',
      participants: 200,
      outcomes: '90% job placement rate, 15 local businesses partnered',
      impactData: 'Average wage increase of 40% within 6 months, with 85% participants reporting increased confidence',
      fundingModel: 'hybrid',
      fundingAmount: '$320,000/year',
      successStories: 18,
      featuredDate: '2024-02-20',
      curatedBy: 'Skills Development Specialist'
    },
    {
      id: '3',
      name: 'Ipswich Healing Circles',
      organization: 'Indigenous Families United',
      category: 'justice',
      description: 'Cultural healing and restorative justice program for Aboriginal and Torres Strait Islander youth and families',
      methodology: 'Traditional healing practices, elder mentorship, family group conferencing, and country-based learning',
      location: 'Ipswich, QLD',
      participants: 80,
      outcomes: '95% family engagement, 60% diversion from court system',
      impactData: 'Cultural connection scores increased by 65%, with 80% of families reporting stronger relationships',
      fundingModel: 'grants',
      fundingAmount: '$150,000/year',
      successStories: 8,
      featuredDate: '2024-03-10',
      curatedBy: 'Indigenous Affairs Specialist'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Programs', icon: Target },
    { id: 'youth-development', label: 'Youth Development', icon: Users },
    { id: 'education', label: 'Education & Skills', icon: Award },
    { id: 'health', label: 'Health & Wellbeing', icon: Heart },
    { id: 'justice', label: 'Justice & Support', icon: Star },
    { id: 'community', label: 'Community Building', icon: Building }
  ];

  const filteredPrograms = samplePrograms.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         program.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || program.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getFundingColor = (model: string) => {
    switch (model) {
      case 'community': return 'text-green-600';
      case 'grants': return 'text-blue-600';
      case 'social-enterprise': return 'text-purple-600';
      case 'hybrid': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

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
                <div className="text-3xl font-bold text-black mb-2">43</div>
                <div className="text-sm font-medium">Curated Programs</div>
                <div className="text-xs text-gray-600 mt-1">Handpicked for excellence</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-black mb-2">15,000+</div>
                <div className="text-sm font-medium">Lives Transformed</div>
                <div className="text-xs text-gray-600 mt-1">Documented outcomes</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-black mb-2">92%</div>
                <div className="text-sm font-medium">Success Rate</div>
                <div className="text-xs text-gray-600 mt-1">Verified impact data</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-black mb-2">$2.8M</div>
                <div className="text-sm font-medium">Funding Transparency</div>
                <div className="text-xs text-gray-600 mt-1">Full money trail tracking</div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-xl font-bold mb-6">FILTER BY FOCUS AREA</h2>
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
                Editorially selected • Deep-dive profiles • Verified impact data
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
                          <span>Curated by {program.curatedBy}</span>
                          <span>•</span>
                          <span>Featured {program.featuredDate}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{program.participants}</div>
                        <div className="text-xs text-gray-500">participants</div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{program.organization}</p>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {program.description}
                    </p>
                    
                    <div className="mb-4 p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                      <div className="text-xs font-medium text-blue-800 mb-1">METHODOLOGY</div>
                      <div className="text-sm text-blue-700">{program.methodology}</div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{program.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className={`font-medium ${getFundingColor(program.fundingModel)}`}>
                          {program.fundingAmount} • {program.fundingModel.charAt(0).toUpperCase() + program.fundingModel.slice(1).replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{program.successStories} documented success stories</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-green-50 rounded border-l-4 border-green-500">
                      <div className="text-xs font-medium text-green-800 mb-1">VERIFIED OUTCOMES</div>
                      <div className="text-sm text-green-700 mb-2">{program.outcomes}</div>
                      <div className="text-xs text-green-600">{program.impactData}</div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                      <Link 
                        href={`/grassroots/${program.id}`}
                        className="inline-flex items-center gap-2 font-bold tracking-wider hover:underline"
                      >
                        DEEP DIVE
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                      <Link 
                        href={`/stories?program=${program.id}`}
                        className="text-sm font-medium text-gray-600 hover:text-black"
                      >
                        View Stories →
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
                <h3 className="font-bold mb-2">🤖 Service Finder</h3>
                <p className="text-sm">AI-powered comprehensive directory of all available support services across Australia</p>
              </Link>
              <Link href="/talent-scout" className="group border-2 border-black bg-white p-6 hover:bg-black hover:text-white transition-all">
                <h3 className="font-bold mb-2">🎯 Talent Scout</h3>
                <p className="text-sm">Youth-focused skills development and creative career pathways app experience</p>
              </Link>
              <Link href="/transparency" className="group border-2 border-black bg-white p-6 hover:bg-black hover:text-white transition-all">
                <h3 className="font-bold mb-2">💰 Money Trail</h3>
                <p className="text-sm">Follow funding transparency and effectiveness data for all featured programs</p>
              </Link>
            </div>
            
            <div className="mt-8 p-6 bg-white border-2 border-black">
              <div className="text-center">
                <h3 className="font-bold text-lg mb-2">Grassroots vs Service Finder</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 text-left">
                  <div>
                    <h4 className="font-bold text-sm mb-2">🌱 GRASSROOTS PROGRAMS (This Page)</h4>
                    <p className="text-sm text-gray-600">Curated excellence • Deep-dive profiles • Methodology insights • Behind-the-scenes content • Editorial review • Money trail tracking</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-2">🤖 SERVICE FINDER</h4>
                    <p className="text-sm text-gray-600">AI-powered directory • Comprehensive coverage • Real-time updates • Quick connections • All available services</p>
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