'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Lock,
  Scale,
  Globe,
  Users,
  FileText,
  ExternalLink,
  Search,
  Filter,
  Database,
  Zap,
  Shield,
  BookOpen,
  Calendar,
  MapPin,
  Building2,
  ArrowRight,
  CheckCircle2,
  Clock,
  Target,
  X,
  TrendingUp,
  BarChart3,
  PieChart,
  Map as MapIcon,
  Lightbulb,
  AlertTriangle,
  Award,
  ChevronRight
} from 'lucide-react';

// Import seed data
import seedData from '@/data/justice-matrix-seed.json';

type Case = typeof seedData.cases[0];
type Campaign = typeof seedData.campaigns[0];

// Dynamically import the map component to avoid SSR issues with Leaflet
const JusticeMapClient = dynamic(
  () => import('@/components/preview/JusticeMatrixMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }
);

export default function JusticeMatrixPreviewPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'cases' | 'campaigns' | 'insights'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    const auth = sessionStorage.getItem('justice-matrix-preview-auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'justice2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('justice-matrix-preview-auth', 'true');
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  // Filter cases
  const filteredCases = useMemo(() => {
    return seedData.cases.filter(c => {
      const matchesSearch = searchQuery === '' ||
        c.case_citation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.strategic_issue.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = selectedRegion === 'all' || c.region === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [searchQuery, selectedRegion]);

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    return seedData.campaigns.filter(c => {
      const matchesSearch = searchQuery === '' ||
        c.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.country_region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.goals.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery]);

  // Get unique regions
  const regions = useMemo(() => {
    const r = new Set(seedData.cases.map(c => c.region));
    return ['all', ...Array.from(r)];
  }, []);

  // Analytics computed values
  const analytics = useMemo(() => {
    const casesByRegion = seedData.cases.reduce((acc, c) => {
      acc[c.region] = (acc[c.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const casesByOutcome = seedData.cases.reduce((acc, c) => {
      acc[c.outcome] = (acc[c.outcome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const casesByYear = seedData.cases.reduce((acc, c) => {
      acc[c.year] = (acc[c.year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Flatten all categories
    const allCategories = seedData.cases.flatMap(c => c.categories);
    const categoryCount = allCategories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // High precedent cases
    const highPrecedentCases = seedData.cases.filter(c => c.precedent_strength === 'high');

    return {
      casesByRegion,
      casesByOutcome,
      casesByYear,
      categoryCount,
      highPrecedentCases,
      totalCases: seedData.cases.length,
      totalCampaigns: seedData.campaigns.length,
      favorableRate: Math.round((casesByOutcome['favorable'] || 0) / seedData.cases.length * 100)
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h1 className="text-3xl font-bold mb-2 text-white">Justice Matrix</h1>
            <p className="text-blue-200">Global Strategic Litigation Clearing House</p>
            <p className="text-blue-300/60 text-sm mt-2">Password protected preview</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-blue-200">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border-2 border-blue-500/30 focus:border-blue-400 focus:outline-none text-white rounded-lg"
                placeholder="Enter password"
              />
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 font-bold hover:bg-blue-700 transition-colors rounded-lg"
            >
              Access Preview
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/preview/justice-project" className="text-blue-300 hover:text-white text-sm">
              ← Back to Partnership
            </Link>
            <span className="text-blue-500">|</span>
            <div className="flex items-center gap-2">
              <Globe className="w-6 h-6 text-blue-400" />
              <span className="text-xl font-bold">Justice Matrix</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-300">
            <span className="px-2 py-1 bg-blue-600/30 text-blue-200 rounded">PREVIEW</span>
            <span>{seedData.cases.length} cases</span>
            <span>•</span>
            <span>{seedData.campaigns.length} campaigns</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'map'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              Global Map
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'cases'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Scale className="w-4 h-4" />
              Cases ({seedData.cases.length})
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'campaigns'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Campaigns ({seedData.campaigns.length})
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'insights'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              Insights
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-12">
            {/* Hero */}
            <section className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-2xl p-12">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="w-10 h-10 text-blue-400" />
                  <span className="text-blue-300 font-bold uppercase tracking-wider">OHCHR Partnership</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-6 text-white">
                  Global Justice Matrix
                </h1>
                <p className="text-xl text-blue-100 mb-8">
                  A strategic litigation and advocacy clearing house enabling lawyers, NGOs,
                  and movements to share knowledge and coordinate across jurisdictions.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
                    <MapPin className="w-5 h-5" />
                    <span>US, UK, Canada, Australia, SE Asia, Pacific</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
                    <Database className="w-5 h-5" />
                    <span>AI-assisted + Partner contributions</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="grid md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm text-center">
                <Scale className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <p className="text-3xl font-bold">{seedData.cases.length}</p>
                <p className="text-gray-600">Strategic Cases</p>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm text-center">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <p className="text-3xl font-bold">{seedData.campaigns.length}</p>
                <p className="text-gray-600">Advocacy Campaigns</p>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm text-center">
                <Globe className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <p className="text-3xl font-bold">{regions.length - 1}</p>
                <p className="text-gray-600">Regions Covered</p>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm text-center">
                <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                <p className="text-3xl font-bold">{analytics.favorableRate}%</p>
                <p className="text-gray-600">Favorable Outcomes</p>
              </div>
            </section>

            {/* Quick Map Preview */}
            <section className="bg-white rounded-xl border overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Global Case Distribution</h2>
                  <p className="text-gray-600">Click markers to see case details</p>
                </div>
                <button
                  onClick={() => setActiveTab('map')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MapIcon className="w-4 h-4" />
                  Full Map View
                </button>
              </div>
              <div className="h-[400px]">
                <JusticeMapClient
                  cases={seedData.cases}
                  campaigns={seedData.campaigns}
                  onCaseSelect={setSelectedCase}
                  onCampaignSelect={setSelectedCampaign}
                />
              </div>
            </section>

            {/* What It Does */}
            <section className="bg-white rounded-xl border p-8">
              <h2 className="text-2xl font-bold mb-6">What the Justice Matrix Enables</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Search className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Analyse & Compare</h3>
                    <p className="text-gray-600 text-sm">Rights litigation across nations and courts, finding precedents that apply to your case.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Reusable Playbooks</h3>
                    <p className="text-gray-600 text-sm">Build a collection of legal and advocacy strategies that can be adapted across contexts.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Coordinate Campaigns</h3>
                    <p className="text-gray-600 text-sm">Connect advocacy efforts around shared goals across borders.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Track Impact</h3>
                    <p className="text-gray-600 text-sm">Monitor legal and social impact in real-time across the network.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Technical Architecture */}
            <section className="bg-gray-900 text-white rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Technical Architecture</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-lg p-6">
                  <Zap className="w-8 h-8 text-yellow-400 mb-4" />
                  <h3 className="font-bold mb-2 text-white">AI Content Streams</h3>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Scheduled crawls of court databases</li>
                    <li>• Auto-summaries & de-duplication</li>
                    <li>• Human spot-checks</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-6">
                  <Users className="w-8 h-8 text-green-400 mb-4" />
                  <h3 className="font-bold mb-2 text-white">Partner Contributions</h3>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Web forms for submissions</li>
                    <li>• Pro bono legal review</li>
                    <li>• Versioned updates</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-6">
                  <Database className="w-8 h-8 text-blue-400 mb-4" />
                  <h3 className="font-bold mb-2 text-white">Data Platform</h3>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• PostgreSQL + full-text search</li>
                    <li>• API endpoints for partners</li>
                    <li>• Export to CSV/JSON</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Integration with JusticeHub */}
            <section className="bg-blue-50 rounded-xl border border-blue-200 p-8">
              <h2 className="text-2xl font-bold mb-6 text-blue-900">JusticeHub Integration</h2>
              <p className="text-blue-800 mb-6">
                The Justice Matrix will be hosted within the JusticeHub platform, providing:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-white rounded-lg p-4 border border-blue-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Existing infrastructure & hosting</span>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg p-4 border border-blue-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Integration with ALMA AI assistant</span>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg p-4 border border-blue-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Shared authentication & partner portal</span>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg p-4 border border-blue-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Cross-linking with services & organizations</span>
                </div>
              </div>
            </section>

            {/* Timeline */}
            <section className="bg-white rounded-xl border p-8">
              <h2 className="text-2xl font-bold mb-6">Proposed Timeline</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-24 text-sm font-medium text-gray-500">Month 0-4</div>
                  <div className="flex-1 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <p className="font-medium">Discovery & Setup</p>
                    <p className="text-sm text-gray-600">Governance, fundraising, tech design</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-24 text-sm font-medium text-gray-500">Month 4-8</div>
                  <div className="flex-1 bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                    <p className="font-medium">Build MVP</p>
                    <p className="text-sm text-gray-600">Stand up ingestion, recruit pro bono roster, content seeding</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-24 text-sm font-medium text-gray-500">Month 9</div>
                  <div className="flex-1 bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                    <p className="font-medium">Soft Launch</p>
                    <p className="text-sm text-gray-600">6-10 pilot partners, security review</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-24 text-sm font-medium text-gray-500">Month 10+</div>
                  <div className="flex-1 bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="font-medium">Public Launch</p>
                    <p className="text-sm text-gray-600">Begin quarterly briefs, expand sources</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold">Global Justice Matrix Map</h2>
                <p className="text-gray-600">
                  Interactive visualization of strategic cases and advocacy campaigns worldwide.
                  Click markers to view details.
                </p>
              </div>
              <div className="h-[600px]">
                <JusticeMapClient
                  cases={seedData.cases}
                  campaigns={seedData.campaigns}
                  onCaseSelect={setSelectedCase}
                  onCampaignSelect={setSelectedCampaign}
                />
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-bold mb-4">Map Legend</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Case Outcomes</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500" />
                      <span className="text-sm">Favorable</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500" />
                      <span className="text-sm">Adverse</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500" />
                      <span className="text-sm">Pending</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Marker Types</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Strategic Case</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Advocacy Campaign</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Marker Size</h4>
                  <p className="text-sm text-gray-600">
                    Larger markers indicate higher precedent strength or greater campaign impact.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cases' && (
          <div className="space-y-6">
            {/* Search & Filter */}
            <div className="bg-white rounded-xl border p-4 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cases by citation, jurisdiction, or issue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {regions.map(r => (
                  <option key={r} value={r}>
                    {r === 'all' ? 'All Regions' : r}
                  </option>
                ))}
              </select>
            </div>

            {/* Results count */}
            <p className="text-sm text-gray-600">
              Showing {filteredCases.length} of {seedData.cases.length} cases
            </p>

            {/* Cases Grid */}
            <div className="grid gap-6">
              {filteredCases.map((c, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedCase(c)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {c.jurisdiction}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {c.year}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                          {c.region}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          c.outcome === 'favorable' ? 'bg-green-100 text-green-700' :
                          c.outcome === 'adverse' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {c.outcome}
                        </span>
                        {c.precedent_strength === 'high' && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded flex items-center gap-1">
                            <Award className="w-3 h-3" /> High Precedent
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg mb-2">{c.case_citation}</h3>
                      <p className="text-sm text-gray-500 mb-3">{c.court}</p>
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">Strategic Issue:</p>
                        <p className="text-sm text-gray-600">{c.strategic_issue}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {c.categories.map((cat, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {cat.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <a
                        href={c.authoritative_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm whitespace-nowrap"
                      >
                        View Source <ExternalLink className="w-4 h-4" />
                      </a>
                      <button className="text-gray-400 hover:text-gray-600">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white rounded-xl border p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search campaigns by name, country, or goals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Results count */}
            <p className="text-sm text-gray-600">
              Showing {filteredCampaigns.length} of {seedData.campaigns.length} campaigns
            </p>

            {/* Campaigns Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {filteredCampaigns.map((c, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedCampaign(c)}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      {c.country_region}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      c.is_ongoing
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {c.is_ongoing ? 'Ongoing' : 'Completed'}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{c.campaign_name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{c.lead_organizations}</p>

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Goals:</p>
                      <p className="text-gray-600">{c.goals}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {c.categories.map((cat, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {cat.replace(/-/g, ' ')}
                        </span>
                      ))}
                    </div>
                    <a
                      href={c.campaign_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Learn More <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <section className="grid md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border">
                <div className="flex items-center gap-3 mb-2">
                  <Scale className="w-6 h-6 text-blue-600" />
                  <span className="text-gray-600">Total Cases</span>
                </div>
                <p className="text-3xl font-bold">{analytics.totalCases}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <span className="text-gray-600">Favorable Rate</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{analytics.favorableRate}%</p>
              </div>
              <div className="bg-white p-6 rounded-xl border">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-6 h-6 text-orange-600" />
                  <span className="text-gray-600">High Precedent</span>
                </div>
                <p className="text-3xl font-bold">{analytics.highPrecedentCases.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-6 h-6 text-purple-600" />
                  <span className="text-gray-600">Active Campaigns</span>
                </div>
                <p className="text-3xl font-bold">
                  {seedData.campaigns.filter(c => c.is_ongoing).length}
                </p>
              </div>
            </section>

            {/* Regional Distribution */}
            <section className="bg-white rounded-xl border p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Cases by Region
              </h3>
              <div className="space-y-4">
                {Object.entries(analytics.casesByRegion).map(([region, count]) => (
                  <div key={region}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{region}</span>
                      <span className="text-gray-600">{count} cases</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${(count / analytics.totalCases) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Outcomes Analysis */}
            <section className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-green-600" />
                  Case Outcomes
                </h3>
                <div className="flex items-center justify-center gap-8">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {/* Favorable segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#22c55e"
                        strokeWidth="20"
                        strokeDasharray={`${(analytics.casesByOutcome['favorable'] || 0) / analytics.totalCases * 251} 251`}
                      />
                      {/* Adverse segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#ef4444"
                        strokeWidth="20"
                        strokeDasharray={`${(analytics.casesByOutcome['adverse'] || 0) / analytics.totalCases * 251} 251`}
                        strokeDashoffset={`-${(analytics.casesByOutcome['favorable'] || 0) / analytics.totalCases * 251}`}
                      />
                      {/* Pending segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#eab308"
                        strokeWidth="20"
                        strokeDasharray={`${(analytics.casesByOutcome['pending'] || 0) / analytics.totalCases * 251} 251`}
                        strokeDashoffset={`-${((analytics.casesByOutcome['favorable'] || 0) + (analytics.casesByOutcome['adverse'] || 0)) / analytics.totalCases * 251}`}
                      />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded" />
                      <span>Favorable: {analytics.casesByOutcome['favorable'] || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded" />
                      <span>Adverse: {analytics.casesByOutcome['adverse'] || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded" />
                      <span>Pending: {analytics.casesByOutcome['pending'] || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Timeline
                </h3>
                <div className="space-y-3">
                  {Object.entries(analytics.casesByYear)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([year, count]) => (
                      <div key={year} className="flex items-center gap-4">
                        <span className="w-12 font-mono text-gray-600">{year}</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded flex items-center justify-end pr-2"
                            style={{ width: `${Math.max((count / Math.max(...Object.values(analytics.casesByYear))) * 100, 20)}%` }}
                          >
                            <span className="text-white text-xs font-bold">{count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </section>

            {/* Category Analysis */}
            <section className="bg-white rounded-xl border p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Key Legal Categories
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(analytics.categoryCount)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 9)
                  .map(([category, count]) => {
                    const catInfo = (seedData.insights?.categories as Record<string, { label: string; color: string; description: string }>)?.[category];
                    return (
                      <div
                        key={category}
                        className="p-4 rounded-lg border-2"
                        style={{ borderColor: catInfo?.color || '#e5e7eb' }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="font-bold capitalize"
                            style={{ color: catInfo?.color || '#374151' }}
                          >
                            {catInfo?.label || category.replace(/-/g, ' ')}
                          </span>
                          <span className="text-2xl font-bold">{count}</span>
                        </div>
                        {catInfo?.description && (
                          <p className="text-sm text-gray-600">{catInfo.description}</p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </section>

            {/* Key Insights */}
            <section className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-xl p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Cross-Case Insights
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/10 rounded-lg p-6">
                  <h4 className="font-bold mb-3 text-blue-200">Non-Refoulement Precedents</h4>
                  <p className="text-blue-100 text-sm mb-4">
                    Strong favorable precedent across Europe (ECtHR) and in domestic courts.
                    The Hirsi Jamaa case extends protection to high-seas operations.
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>{seedData.cases.filter(c => c.categories.includes('non-refoulement') && c.outcome === 'favorable').length} favorable cases</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-6">
                  <h4 className="font-bold mb-3 text-blue-200">Third Country Transfers</h4>
                  <p className="text-blue-100 text-sm mb-4">
                    UK Rwanda case and Australia Malaysia Solution provide precedent
                    for challenging offshore processing arrangements.
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span>Key battleground area - legislative pushback ongoing</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-6">
                  <h4 className="font-bold mb-3 text-blue-200">Campaign Coordination</h4>
                  <p className="text-blue-100 text-sm mb-4">
                    Australian offshore detention campaigns (#KidsOffNauru, #GameOver)
                    achieved concrete wins through coordinated pressure.
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span>Model for cross-border advocacy coordination</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-6">
                  <h4 className="font-bold mb-3 text-blue-200">Due Process Rights</h4>
                  <p className="text-blue-100 text-sm mb-4">
                    Singh v Canada established Charter protections for all asylum seekers.
                    Similar constitutional arguments available in other jurisdictions.
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <Award className="w-4 h-4 text-orange-400" />
                    <span>High precedent value for procedural challenges</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Case Detail Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCase(null)}>
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {selectedCase.jurisdiction}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {selectedCase.year}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    selectedCase.outcome === 'favorable' ? 'bg-green-100 text-green-700' :
                    selectedCase.outcome === 'adverse' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedCase.outcome}
                  </span>
                </div>
                <h2 className="text-xl font-bold">{selectedCase.case_citation}</h2>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Court</h3>
                <p className="text-gray-600">{selectedCase.court}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Strategic Issue</h3>
                <p className="text-gray-600">{selectedCase.strategic_issue}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Key Holding / Impact</h3>
                <p className="text-gray-600">{selectedCase.key_holding}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCase.categories.map((cat, idx) => {
                    const catInfo = (seedData.insights?.categories as Record<string, { label: string; color: string }>)?.[cat];
                    return (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: catInfo?.color ? `${catInfo.color}20` : '#f3f4f6',
                          color: catInfo?.color || '#374151'
                        }}
                      >
                        {catInfo?.label || cat.replace(/-/g, ' ')}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t">
                {selectedCase.precedent_strength === 'high' && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg">
                    <Award className="w-4 h-4" />
                    <span className="font-medium">High Precedent Value</span>
                  </div>
                )}
                <a
                  href={selectedCase.authoritative_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Full Case <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCampaign(null)}>
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    {selectedCampaign.country_region}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    selectedCampaign.is_ongoing
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedCampaign.is_ongoing ? 'Ongoing' : 'Completed'}
                  </span>
                </div>
                <h2 className="text-xl font-bold">{selectedCampaign.campaign_name}</h2>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Lead Organizations</h3>
                <p className="text-gray-600">{selectedCampaign.lead_organizations}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Goals</h3>
                <p className="text-gray-600">{selectedCampaign.goals}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Notable Tactics</h3>
                <p className="text-gray-600">{selectedCampaign.notable_tactics}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Outcome Status</h3>
                <p className="text-gray-600">{selectedCampaign.outcome_status}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Timeline</h3>
                <p className="text-gray-600">
                  {selectedCampaign.start_year} - {selectedCampaign.end_year || 'Present'}
                </p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCampaign.categories.map((cat, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {cat.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t">
                <a
                  href={selectedCampaign.campaign_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex"
                >
                  Visit Campaign <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-bold">Justice Matrix Preview</p>
            <p className="text-gray-400 text-sm">
              Partnership between JusticeHub, The Justice Project & OHCHR
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-blue-600/30 text-blue-200 rounded text-sm">
              DATABASE PREVIEW
            </span>
            <Link
              href="/preview/justice-project"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Back to Partnership Overview →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
