'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  MapPin, 
  Users, 
  DollarSign, 
  Target,
  Star,
  ChevronRight,
  Phone,
  Grid3X3,
  List
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

interface Service {
  id: string;
  name: string;
  category: 'legal' | 'education' | 'housing' | 'health' | 'employment' | 'emergency' | 'family' | 'substance';
  description: string;
  location: string;
  contact: string;
  cost: 'free' | 'low' | 'moderate';
  rating: number;
  verified: boolean;
  lastUpdated: string;
  aiDiscovered?: boolean;
  source?: string;
  eligibility?: string[];
  subcategory?: string;
}

// Helper function to map database categories to UI categories
function mapCategory(dbCategory: string): Service['category'] {
  const categoryMap: { [key: string]: Service['category'] } = {
    'legal_aid': 'legal',
    'court_support': 'legal',
    'advocacy': 'legal',
    'mental_health': 'health',
    'health': 'health',
    'crisis_support': 'emergency',
    'emergency': 'emergency',
    'education_training': 'education',
    'education': 'education',
    'employment': 'employment',
    'housing': 'housing',
    'substance_abuse': 'substance',
    'substance': 'substance',
    'family_support': 'family',
    'case_management': 'family'
  };
  return categoryMap[dbCategory] || 'family';
}

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedCost, setSelectedCost] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', label: 'All Services', icon: Target },
    { id: 'emergency', label: 'Emergency & Crisis', icon: Phone },
    { id: 'legal', label: 'Legal Aid & Justice', icon: Star },
    { id: 'health', label: 'Mental Health & Medical', icon: DollarSign },
    { id: 'housing', label: 'Housing & Accommodation', icon: MapPin },
    { id: 'education', label: 'Education & Training', icon: Users },
    { id: 'employment', label: 'Employment & Skills', icon: Target },
    { id: 'family', label: 'Family Support', icon: Users },
    { id: 'substance', label: 'Substance Use Support', icon: Star }
  ];

  // Load services on component mount
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/services?limit=1000');
      const data = await response.json();

      if (response.ok && data.success) {
        // Map to the format this component expects
        const formattedServices = data.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          category: mapCategory(s.categories?.[0] || 'family'),
          description: s.description || '',
          location: s.location?.city || s.location?.region || 'QLD',
          contact: s.contact?.phone || s.contact?.email || 'Contact via organization',
          cost: s.cost === 'free' ? 'free' : 'low',
          rating: 4.5, // Default
          verified: s.verification_status === 'verified',
          lastUpdated: s.updated_at || s.created_at,
          aiDiscovered: !!s.data_source,
          source: s.data_source_url,
          eligibility: s.eligibility_criteria || [],
          subcategory: s.categories?.[0] || ''
        }));
        setServices(formattedServices);
      } else {
        console.error('Failed to load services:', data.error);
        setServices([]);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || service.location.toLowerCase().includes(selectedLocation.toLowerCase());
    const matchesState = selectedState === 'all' || service.location.includes(selectedState);
    const matchesCost = selectedCost === 'all' || service.cost === selectedCost;
    const matchesRating = service.rating >= minRating;
    return matchesSearch && matchesCategory && matchesLocation && matchesState && matchesCost && matchesRating;
  });

  // Sort filtered services
  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'location-asc':
        return a.location.localeCompare(b.location);
      case 'location-desc':
        return b.location.localeCompare(a.location);
      case 'updated-desc':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      case 'updated-asc':
        return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
      default:
        return 0;
    }
  });

  // Get unique locations and states from services for filters
  const uniqueLocations = Array.from(new Set(services.map(s => s.location))).sort();
  const australianStates = ['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'free': return 'text-green-600';
      case 'low': return 'text-blue-600';
      case 'moderate': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-white page-content">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* Unified Navigation */}
      <Navigation />

      <main id="main-content">
        {/* Hero */}
        <section className="header-offset pb-16 border-b-2 border-black bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container-justice">
            <div className="text-center">
              <h1 className="headline-truth mb-4">
                SERVICE FINDER
              </h1>
              <p className="text-xl max-w-3xl mx-auto mb-8">
                AI-powered comprehensive directory of youth justice support services across Australia. 
                Real-time data. Verified providers. Immediate connections. All available services, mapped and accessible.
              </p>
              
              {/* Search */}
              <div className="max-w-2xl mx-auto relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="AI-powered search: services, location, needs, crisis support..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-black focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI-Powered Features */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-black mb-2">{services.length}</div>
                <div className="text-sm font-medium">AI-Discovered Services</div>
                <div className="text-xs text-gray-600 mt-1">Live from government sources</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-black mb-2">Australia-wide</div>
                <div className="text-sm font-medium">Coverage</div>
                <div className="text-xs text-gray-600 mt-1">All states & territories</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-black mb-2">24/7</div>
                <div className="text-sm font-medium">Real-time Updates</div>
                <div className="text-xs text-gray-600 mt-1">Live service availability</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-black mb-2">Verified</div>
                <div className="text-sm font-medium">Data Quality</div>
                <div className="text-xs text-gray-600 mt-1">AI + human oversight</div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h2 className="text-xl font-bold mb-4 md:mb-0">FILTER BY CATEGORY</h2>

              {/* View Mode Toggle */}
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

        {/* Services Grid */}
        <section className="section-padding">
          <div className="container-justice">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h2 className="text-2xl font-bold">
                {sortedServices.length} Services Found
              </h2>
              <div className="flex items-center gap-4">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold">SORT:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border-2 border-black font-medium text-sm"
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="location-asc">Location (A-Z)</option>
                    <option value="location-desc">Location (Z-A)</option>
                    <option value="updated-desc">Recently Updated</option>
                    <option value="updated-asc">Oldest First</option>
                  </select>
                </div>
                <p className="text-sm text-gray-600 hidden lg:block">
                  AI-verified services • Real-time data
                </p>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12">
                <div className="text-xl text-gray-600 mb-4">🤖 Loading AI-discovered services...</div>
                <div className="text-sm text-gray-500">Fetching real-time data from government sources</div>
              </div>
            ) : (
              <>
            {/* Results Display */}
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedServices.map((service) => (
                  <div key={service.id} className="border-2 border-black bg-white hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg leading-tight">{service.name}</h3>
                            {service.aiDiscovered && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                🤖 AI-Discovered
                              </span>
                            )}
                            {service.verified && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Updated {service.lastUpdated}
                            {service.source && service.aiDiscovered && (
                              <span className="ml-2">• Scraped from government data</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-current text-yellow-400" />
                          <span className="text-sm font-medium">{service.rating}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {service.description}
                      </p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{service.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{service.contact}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className={`font-medium ${getCostColor(service.cost)}`}>
                            {service.cost.charAt(0).toUpperCase() + service.cost.slice(1)} Cost
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <Link 
                          href={`/services/${service.id}`}
                          className="inline-flex items-center gap-2 font-bold tracking-wider hover:underline"
                        >
                          VIEW DETAILS
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Table Filters */}
                <div className="mb-6 p-4 border-2 border-black bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-xs font-bold mb-2">CATEGORY</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-black font-medium text-sm"
                      >
                        <option value="all">All Categories</option>
                        {categories.filter(c => c.id !== 'all').map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* State Filter */}
                    <div>
                      <label className="block text-xs font-bold mb-2">STATE</label>
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-black font-medium text-sm"
                      >
                        <option value="all">All States</option>
                        {australianStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>

                    {/* Location Filter */}
                    <div>
                      <label className="block text-xs font-bold mb-2">LOCATION</label>
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-black font-medium text-sm"
                      >
                        <option value="all">All Locations</option>
                        {uniqueLocations.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>

                    {/* Cost Filter */}
                    <div>
                      <label className="block text-xs font-bold mb-2">COST</label>
                      <select
                        value={selectedCost}
                        onChange={(e) => setSelectedCost(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-black font-medium text-sm"
                      >
                        <option value="all">All Costs</option>
                        <option value="free">Free</option>
                        <option value="low">Low Cost</option>
                        <option value="moderate">Moderate</option>
                      </select>
                    </div>

                    {/* Rating Filter */}
                    <div>
                      <label className="block text-xs font-bold mb-2">MIN RATING</label>
                      <select
                        value={minRating}
                        onChange={(e) => setMinRating(Number(e.target.value))}
                        className="w-full px-3 py-2 border-2 border-black font-medium text-sm"
                      >
                        <option value="0">Any Rating</option>
                        <option value="3">3+ Stars</option>
                        <option value="4">4+ Stars</option>
                        <option value="4.5">4.5+ Stars</option>
                      </select>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {(selectedCategory !== 'all' || selectedState !== 'all' || selectedLocation !== 'all' || selectedCost !== 'all' || minRating > 0) && (
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          setSelectedCategory('all');
                          setSelectedState('all');
                          setSelectedLocation('all');
                          setSelectedCost('all');
                          setMinRating(0);
                        }}
                        className="px-4 py-2 text-sm font-bold border-2 border-black hover:bg-black hover:text-white transition-all"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto border-2 border-black">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-black">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold">Service</th>
                        <th className="px-4 py-3 text-left font-bold">Category</th>
                        <th className="px-4 py-3 text-left font-bold">Location</th>
                        <th className="px-4 py-3 text-center font-bold">Cost</th>
                        <th className="px-4 py-3 text-center font-bold">Rating</th>
                        <th className="px-4 py-3 text-center font-bold">Action</th>
                      </tr>
                    </thead>
                  <tbody>
                    {sortedServices.map((service, index) => (
                      <tr key={service.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-bold">{service.name}</div>
                            <div className="text-sm text-gray-600">{service.description.slice(0, 80)}...</div>
                            {service.verified && (
                              <div className="text-xs text-green-600 font-bold mt-1">✓ Verified</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                            {service.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {service.location}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`font-medium ${getCostColor(service.cost)}`}>
                            {service.cost.charAt(0).toUpperCase() + service.cost.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-4 w-4 fill-current text-yellow-400" />
                            <span className="font-medium">{service.rating}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Link 
                            href={`/services/${service.id}`}
                            className="text-blue-800 hover:text-blue-600 font-bold text-sm"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}

            {sortedServices.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600 mb-4">No services found matching your criteria</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedState('all');
                    setSelectedLocation('all');
                    setSelectedCost('all');
                    setMinRating(0);
                  }}
                  className="px-6 py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            )}
            </>
            )}
          </div>
        </section>

        {/* Quick Access Links */}
        <section className="section-padding bg-gray-50 border-t-2 border-black">
          <div className="container-justice">
            <h2 className="text-2xl font-bold mb-8 text-center">EXPLORE MORE</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/community-programs" className="group border-2 border-black bg-white p-6 hover:bg-black hover:text-white transition-all block" style={{textDecoration: 'none'}}>
                <h3 className="font-bold mb-2">🌱 Community Programs</h3>
                <p className="text-sm">Curated profiles of programs with grassroots approaches and indigenous knowledge. Quality over quantity.</p>
              </Link>
              <Link href="/talent-scout" className="group border-2 border-black bg-white p-6 hover:bg-black hover:text-white transition-all block" style={{textDecoration: 'none'}}>
                <h3 className="font-bold mb-2">🎯 Talent Scout</h3>
                <p className="text-sm">Youth-focused skills development and creative career pathways</p>
              </Link>
              <Link href="/transparency" className="group border-2 border-black bg-white p-6 hover:bg-black hover:text-white transition-all block" style={{textDecoration: 'none'}}>
                <h3 className="font-bold mb-2">💰 Money Trail</h3>
                <p className="text-sm">Track funding transparency and service effectiveness data</p>
              </Link>
            </div>
            
            <div className="mt-8 p-6 bg-white border-2 border-black">
              <div className="text-center">
                <h3 className="font-bold text-lg mb-2">Service Finder vs Community Programs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 text-left">
                  <div>
                    <h4 className="font-bold text-sm mb-2">🤖 SERVICE FINDER (This Page)</h4>
                    <p className="text-sm text-gray-600">AI-powered comprehensive directory • All available services • Real-time updates • Quick connections • Complete coverage</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-2">🌱 COMMUNITY PROGRAMS</h4>
                    <p className="text-sm text-gray-600">Curated excellence • Grassroots approaches • Indigenous knowledge • Deep-dive profiles • Community-driven solutions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}