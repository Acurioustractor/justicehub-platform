'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  MapPin, 
  Users, 
  DollarSign, 
  Target,
  Star,
  ChevronRight,
  Award,
  GraduationCap,
  Music,
  Mic,
  Building,
  Clock
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

interface Program {
  id: string;
  name: string;
  category: 'music' | 'media' | 'tech' | 'trades' | 'business';
  description: string;
  provider: string;
  location: string;
  duration: string;
  cost: 'free' | 'low' | 'moderate';
  outcomes: string;
  nextIntake: string;
}

export default function TalentScoutPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const samplePrograms: Program[] = [
    {
      id: '1',
      name: 'Music Production Bootcamp',
      category: 'music',
      description: 'Learn digital music production, recording, and audio engineering skills',
      provider: 'Sound Academy Brisbane',
      location: 'West End, Brisbane',
      duration: '12 weeks',
      cost: 'free',
      outcomes: '80% job placement in music industry',
      nextIntake: 'March 2024'
    },
    {
      id: '2',
      name: 'Digital Media Creation',
      category: 'media',
      description: 'Video production, social media content creation, and digital storytelling',
      provider: 'CreativeSpace Logan',
      location: 'Logan Central',
      duration: '8 weeks',
      cost: 'free',
      outcomes: '90% complete program, 70% start freelance work',
      nextIntake: 'February 2024'
    },
    {
      id: '3',
      name: 'Web Development Fundamentals',
      category: 'tech',
      description: 'HTML, CSS, JavaScript and basic programming concepts for beginners',
      provider: 'TechStart Ipswich',
      location: 'Ipswich CBD',
      duration: '16 weeks',
      cost: 'low',
      outcomes: '85% complete certification, 60% gain employment',
      nextIntake: 'January 2024'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Programs', icon: Target },
    { id: 'music', label: 'Music & Audio', icon: Music },
    { id: 'media', label: 'Digital Media', icon: Mic },
    { id: 'tech', label: 'Technology', icon: Building },
    { id: 'trades', label: 'Skilled Trades', icon: Award },
    { id: 'business', label: 'Business Skills', icon: DollarSign }
  ];

  const filteredPrograms = samplePrograms.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         program.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || program.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'free': return 'text-green-600';
      case 'low': return 'text-blue-600';
      case 'moderate': return 'text-orange-600';
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
        <section className="header-offset pb-16 border-b-2 border-black bg-gradient-to-br from-purple-100 to-pink-100">
          <div className="container-justice">
            <div className="text-center">
              <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-sm font-bold tracking-wider mb-4">
                YOUTH-FOCUSED APP EXPERIENCE
              </div>
              <h1 className="headline-truth mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                TALENT SCOUT
              </h1>
              <p className="text-xl max-w-3xl mx-auto mb-8">
                Your personalized creative journey starts here. Discover your talents. Build your skills. Connect with opportunities. Create your future.
              </p>
              
              {/* Search */}
              <div className="max-w-2xl mx-auto relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Discover your creative path: music, tech, media, design..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-black focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Youth-Focused Stats */}
        <section className="section-padding border-b-2 border-black bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="container-justice">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">67</div>
                <div className="text-sm font-medium">Creative Programs</div>
                <div className="text-xs text-gray-600 mt-1">Music, Tech, Media & More</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">2,400+</div>
                <div className="text-sm font-medium">Young Creators</div>
                <div className="text-xs text-gray-600 mt-1">Building their future</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">85%</div>
                <div className="text-sm font-medium">Follow Their Passion</div>
                <div className="text-xs text-gray-600 mt-1">Into careers they love</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">$52K</div>
                <div className="text-sm font-medium">Creative Industry Avg</div>
                <div className="text-xs text-gray-600 mt-1">Starting salary</div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-xl font-bold mb-6">EXPLORE YOUR CREATIVE PATH</h2>
            <div className="flex flex-wrap gap-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-6 py-3 font-bold tracking-wider transition-all flex items-center gap-2 border-2 border-black
                      ${selectedCategory === category.id
                        ? 'bg-purple-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white hover:bg-purple-600 hover:text-white'
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
                {filteredPrograms.length} Creative Programs
              </h2>
              <p className="text-sm text-gray-600">
                Youth-focused • Creative careers • Personalized pathways
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPrograms.map((program) => (
                <div key={program.id} className="border-2 border-black bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-lg leading-tight">{program.name}</h3>
                      <div className="text-right">
                        <div className="text-sm font-medium">{program.duration}</div>
                        <div className="text-xs text-gray-500">duration</div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{program.provider}</p>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {program.description}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{program.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>Next intake: {program.nextIntake}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className={`font-medium ${getCostColor(program.cost)}`}>
                          {program.cost.charAt(0).toUpperCase() + program.cost.slice(1)} Cost
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-purple-50 border-l-4 border-purple-600">
                      <div className="text-xs font-medium text-purple-800 mb-1">SUCCESS OUTCOMES</div>
                      <div className="text-sm text-purple-700">{program.outcomes}</div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-purple-200 flex justify-between items-center">
                      <Link 
                        href={`/talent-scout/${program.id}`}
                        className="inline-flex items-center gap-2 font-bold tracking-wider text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        START JOURNEY
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                      <Link 
                        href={`/dashboard/youth`}
                        className="text-sm font-medium text-pink-600 hover:text-pink-800 transition-colors"
                      >
                        My Progress →
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

        {/* Success Stories Preview */}
        <section className="section-padding bg-gradient-to-r from-purple-50 to-pink-50 border-t-2 border-black">
          <div className="container-justice">
            <h2 className="text-2xl font-bold mb-8 text-center">CREATOR SUCCESS STORIES</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="text-4xl mb-4">🎵</div>
                <h3 className="font-bold mb-2">From Beats to Business</h3>
                <p className="text-sm mb-4 text-gray-700">Jamie learned music production and now runs their own studio, mentoring other young producers.</p>
                <Link href="/stories" className="text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors">Read Journey →</Link>
              </div>
              <div className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="font-bold mb-2">Coding Changed Everything</h3>
                <p className="text-sm mb-4 text-gray-700">Alex went from no tech experience to landing a developer role at a startup in just 6 months.</p>
                <Link href="/stories" className="text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors">Read Journey →</Link>
              </div>
              <div className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="text-4xl mb-4">🎬</div>
                <h3 className="font-bold mb-2">Telling My Truth</h3>
                <p className="text-sm mb-4 text-gray-700">Maya discovered filmmaking and now creates documentaries about youth justice reform.</p>
                <Link href="/stories" className="text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors">Read Journey →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* App-Style Quick Links */}
        <section className="section-padding bg-gradient-to-r from-purple-50 to-pink-50 border-t-2 border-black">
          <div className="container-justice">
            <h2 className="text-2xl font-bold mb-8 text-center">YOUR CREATIVE ECOSYSTEM</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/services" className="group border-2 border-black bg-white p-6 hover:bg-purple-600 hover:text-white transition-all">
                <h3 className="font-bold mb-2">🤖 Service Finder</h3>
                <p className="text-sm">AI-powered discovery of support services when you need them most</p>
              </Link>
              <Link href="/grassroots" className="group border-2 border-black bg-white p-6 hover:bg-purple-600 hover:text-white transition-all">
                <h3 className="font-bold mb-2">🌱 Grassroots Programs</h3>
                <p className="text-sm">Deep-dive into programs that create real transformation for young creators</p>
              </Link>
              <Link href="/gallery" className="group border-2 border-black bg-white p-6 hover:bg-purple-600 hover:text-white transition-all">
                <h3 className="font-bold mb-2">📸 Creative Gallery</h3>
                <p className="text-sm">Showcase your work and get inspired by other young creators</p>
              </Link>
            </div>
            
            <div className="mt-8 p-6 bg-white border-2 border-black">
              <div className="text-center">
                <h3 className="font-bold text-lg mb-2 text-purple-800">Talent Scout vs Other Platforms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 text-left">
                  <div>
                    <h4 className="font-bold text-sm mb-2 text-purple-600">🎯 TALENT SCOUT (This App)</h4>
                    <p className="text-sm text-gray-600">Youth-focused • Creative careers • Personalized journey • Skills tracking • Peer community • App experience</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-2 text-gray-600">🔧 OTHER PLATFORMS</h4>
                    <p className="text-sm text-gray-600">Service Finder (immediate help) • Grassroots (program deep-dives) • Gallery (showcase work)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="section-padding bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl font-bold mb-4">Your Creative Journey Starts Now</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of young creators building careers they love. Discover your talents, build your skills, and create your future.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard/youth" className="px-8 py-4 bg-white text-purple-600 font-bold tracking-wider hover:bg-gray-100 transition-colors border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
                START YOUR JOURNEY
              </Link>
              <Link href="/dashboard/dreamtrack" className="px-8 py-4 border-2 border-white text-white font-bold tracking-wider hover:bg-white hover:text-purple-600 transition-colors">
                DREAMTRACK STUDIO
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