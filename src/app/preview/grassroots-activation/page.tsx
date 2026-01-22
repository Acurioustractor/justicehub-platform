'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Lock,
  MapPin,
  Users,
  Building2,
  Calendar,
  DollarSign,
  Heart,
  Scale,
  Shield,
  Server,
  AlertTriangle,
  Briefcase,
  GraduationCap,
  Film,
  X,
  ExternalLink,
  Play,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Target,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Quote,
  Filter,
  Layers,
  Globe,
  Megaphone,
  Calculator,
  FileCheck,
  UserCheck,
  UserPlus,
  PenTool,
  BarChart3,
  ClipboardList,
  Headphones,
  BookOpen
} from 'lucide-react';

import seedData from '@/data/grassroots-activation-seed.json';

type Basecamp = typeof seedData.basecamps[0];
type Storyteller = Basecamp['storytellers'][0];
type TimelinePhase = typeof seedData.timelinePhases[0];
type RevenueStream = typeof seedData.revenueStreams[0];

const GrassrootsMapClient = dynamic(
  () => import('@/components/preview/GrassrootsActivationMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }
);

const iconMap: Record<string, React.ElementType> = {
  Scale,
  AlertTriangle,
  Shield,
  Heart,
  Server,
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  Film,
  Megaphone,
  Calculator,
  FileCheck,
  UserCheck,
  UserPlus,
  PenTool,
  BarChart3,
  ClipboardList,
  Headphones,
  BookOpen,
};

const categoryStyles: Record<string, { text: string; bg: string; dot: string; iconBg: string; iconText: string }> = {
  Communications: { text: 'text-purple-700', bg: 'bg-purple-100', dot: 'bg-purple-500', iconBg: 'bg-purple-100', iconText: 'text-purple-600' },
  Finance: { text: 'text-green-700', bg: 'bg-green-100', dot: 'bg-green-500', iconBg: 'bg-green-100', iconText: 'text-green-600' },
  People: { text: 'text-blue-700', bg: 'bg-blue-100', dot: 'bg-blue-500', iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
  Development: { text: 'text-pink-700', bg: 'bg-pink-100', dot: 'bg-pink-500', iconBg: 'bg-pink-100', iconText: 'text-pink-600' },
  Operations: { text: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-500', iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
  Technology: { text: 'text-teal-700', bg: 'bg-teal-100', dot: 'bg-teal-500', iconBg: 'bg-teal-100', iconText: 'text-teal-600' },
  Support: { text: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
};

export default function GrassrootsActivationPreviewPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'basecamps' | 'services' | 'funders' | 'timeline' | 'revenue'>('overview');
  const [selectedBasecamp, setSelectedBasecamp] = useState<Basecamp | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(1);
  const [calculatorAmount, setCalculatorAmount] = useState(100000);

  useEffect(() => {
    const auth = sessionStorage.getItem('grassroots-activation-preview-auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'justice2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('grassroots-activation-preview-auth', 'true');
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  const calculatedBenefits = useMemo(() => {
    const stateGovShare = calculatorAmount * 0.3;
    const corporateShare = calculatorAmount * 0.6;
    const researchShare = calculatorAmount * 0.5;
    return {
      stateGov: stateGovShare,
      corporate: corporateShare,
      research: researchShare,
      average: (stateGovShare + corporateShare + researchShare) / 3
    };
  }, [calculatorAmount]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
            <h1 className="text-3xl font-bold mb-2 text-white">Grassroots Activation</h1>
            <p className="text-emerald-200">Community-led justice infrastructure</p>
            <p className="text-emerald-300/60 text-sm mt-2">Password protected preview</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-emerald-200">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border-2 border-emerald-500/30 focus:border-emerald-400 focus:outline-none text-white rounded-lg"
                placeholder="Enter password"
              />
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-3 px-4 font-bold hover:bg-emerald-700 transition-colors rounded-lg"
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
      <header className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/preview" className="text-emerald-300 hover:text-white text-sm">
              ← Back to Previews
            </Link>
            <span className="text-emerald-500">|</span>
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-emerald-400" />
              <span className="text-xl font-bold">Grassroots Activation</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-300">
            <span className="px-2 py-1 bg-emerald-600/30 text-emerald-200 rounded">PREVIEW</span>
            <span>{seedData.keyMetrics.basecamps} Basecamps</span>
            <span>•</span>
            <span>{seedData.keyMetrics.corePartners} CORE + {seedData.keyMetrics.networkPartners} NETWORK</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Globe },
              { id: 'basecamps', label: 'Basecamps', icon: MapPin },
              { id: 'services', label: 'Shared Services', icon: Layers },
              { id: 'funders', label: 'Funder Discovery', icon: Heart },
              { id: 'timeline', label: '10-Year Plan', icon: Calendar },
              { id: 'revenue', label: 'Revenue Flow', icon: DollarSign },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-2 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            {/* Hero with Dual Value Proposition */}
            <section className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white rounded-2xl p-12">
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Heart className="w-10 h-10 text-emerald-400" />
                    <span className="text-emerald-300 font-bold uppercase tracking-wider">For Communities</span>
                  </div>
                  <h1 className="text-4xl font-black mb-6 text-white">
                    Infrastructure for <span className="text-emerald-400">Grassroots Power</span>
                  </h1>
                  <p className="text-xl text-emerald-100 mb-6">
                    Get the platform, connections, and resources to do what you already do best—but without the constant fundraising grind.
                  </p>
                  <ul className="space-y-3 text-white">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Free website and profile (worth $40-50K)</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Evidence library for grant applications</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Story licensing revenue share (you own copyright)</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white/10 rounded-xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <DollarSign className="w-10 h-10 text-yellow-400" />
                    <span className="text-yellow-300 font-bold uppercase tracking-wider">For Funders</span>
                  </div>
                  <h2 className="text-3xl font-black mb-6 text-white">
                    Verified Impact, <span className="text-yellow-400">Not Guesswork</span>
                  </h2>
                  <p className="text-lg text-emerald-100 mb-6">
                    Invest in vetted community programs with evidence-tracked outcomes. 30-60% of every dollar reaches communities directly.
                  </p>
                  <ul className="space-y-3 text-white">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                      <span>Portfolio of 29+ community organizations</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                      <span>Quarterly outcome tracking via ALMA</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                      <span>Indigenous governance oversight</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Key Metrics */}
            <section className="grid md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm text-center">
                <MapPin className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                <p className="text-3xl font-bold">{seedData.keyMetrics.basecamps}</p>
                <p className="text-gray-600">Founding Basecamps</p>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm text-center">
                <Users className="w-8 h-8 text-teal-600 mx-auto mb-3" />
                <p className="text-3xl font-bold">{seedData.keyMetrics.corePartners} CORE + {seedData.keyMetrics.networkPartners} NETWORK</p>
                <p className="text-gray-600">Community Partners</p>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm text-center">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <p className="text-3xl font-bold">{seedData.keyMetrics.communityBenefitPercent}</p>
                <p className="text-gray-600">To Communities</p>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm text-center">
                <DollarSign className="w-8 h-8 text-amber-600 mx-auto mb-3" />
                <p className="text-3xl font-bold">{seedData.keyMetrics.year3CommunityBenefit}</p>
                <p className="text-gray-600">Community Benefit (Year 3)</p>
              </div>
            </section>

            {/* Basecamp Teasers */}
            <section className="bg-white rounded-xl border p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Founding Basecamps</h2>
                  <p className="text-gray-600">Community-led programs proving what works</p>
                </div>
                <button
                  onClick={() => setActiveTab('basecamps')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  View All Basecamps
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {seedData.basecamps.map(basecamp => (
                  <div
                    key={basecamp.id}
                    onClick={() => {
                      setSelectedBasecamp(basecamp);
                      setActiveTab('basecamps');
                    }}
                    className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                        {basecamp.state}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{basecamp.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{basecamp.location}</p>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-emerald-700">{basecamp.metrics.primaryStat}</p>
                      <p className="text-xs text-emerald-600">{basecamp.metrics.primaryLabel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* How It Works */}
            <section className="bg-gray-900 rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6 text-white">The Regenerative Model</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-red-400">Traditional Model (Extractive)</h3>
                  <div className="bg-white/10 rounded-lg p-4 space-y-2 text-sm">
                    <p className="text-white">Government/Philanthropy → University Research → Academic Papers (paywalled)</p>
                    <p className="text-white">↓</p>
                    <p className="text-red-300">Communities get cited, Communities get $0</p>
                    <p className="text-red-300">Knowledge extracted, not valued</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-emerald-400">JusticeHub Model (Regenerative)</h3>
                  <div className="bg-white/10 rounded-lg p-4 space-y-2 text-sm">
                    <p className="text-white">Government/Philanthropy → JusticeHub Platform → Intelligence Commons (open)</p>
                    <p className="text-white">↓</p>
                    <p className="text-emerald-300">Communities own intelligence</p>
                    <p className="text-emerald-300">Communities get 30-60% revenue share</p>
                    <p className="text-emerald-300">Knowledge valued, compensated</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Basecamps Tab */}
        {activeTab === 'basecamps' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold">Founding Basecamps</h2>
                <p className="text-gray-600">
                  Interactive map showing our 4 founding community basecamps and future CORE/NETWORK partners.
                </p>
              </div>
              <div className="h-[500px]">
                <GrassrootsMapClient
                  basecamps={seedData.basecamps as unknown as React.ComponentProps<typeof GrassrootsMapClient>['basecamps']}
                  futureCommunities={seedData.futureCommunities as unknown as React.ComponentProps<typeof GrassrootsMapClient>['futureCommunities']}
                  onBasecampSelect={(b: unknown) => setSelectedBasecamp(b as Basecamp)}
                />
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-bold mb-4">Map Legend</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500" />
                  <span className="text-sm">Founding Basecamps (4)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-amber-500" />
                  <span className="text-sm">CORE Partners</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-purple-500" />
                  <span className="text-sm">NETWORK Partners</span>
                </div>
              </div>
            </div>

            {/* Basecamp Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {seedData.basecamps.map(basecamp => (
                <div
                  key={basecamp.id}
                  className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedBasecamp(basecamp)}
                >
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-1 bg-white/20 text-white text-xs font-medium rounded mb-2 inline-block">
                          FOUNDING BASECAMP
                        </span>
                        <h3 className="text-2xl font-bold">{basecamp.name}</h3>
                        <p className="text-emerald-100">{basecamp.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">{basecamp.metrics.primaryStat}</p>
                        <p className="text-sm text-emerald-100">{basecamp.metrics.primaryLabel}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 mb-4 line-clamp-2">{basecamp.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {basecamp.programs.slice(0, 3).map((program, i) => (
                        <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded">
                          {program}
                        </span>
                      ))}
                    </div>
                    {basecamp.storytellers.filter(s => s.featured).slice(0, 1).map((storyteller, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-4">
                        <Quote className="w-5 h-5 text-emerald-400 mb-2" />
                        <p className="text-sm italic text-gray-700 mb-2">"{storyteller.quote}"</p>
                        <p className="text-xs text-gray-500">— {storyteller.name}, {storyteller.role}</p>
                      </div>
                    ))}
                    <button className="mt-4 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium">
                      View Full Profile <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-8">
            <section className="bg-gradient-to-br from-emerald-900 to-teal-900 rounded-2xl p-12">
              <h1 className="text-4xl font-black mb-4 text-white">Sponsor Shared Services Infrastructure</h1>
              <p className="text-xl text-emerald-100 max-w-3xl mb-4">
                A scalable philanthropic investment that removes admin burden from 29+ grassroots organisations—so every dollar they receive goes further.
              </p>
              <p className="text-lg text-emerald-200 max-w-3xl">
                Instead of each community paying for accountants, web developers, and grant writers, funders sponsor a shared backbone that serves everyone.
              </p>
            </section>

            {/* Three-Tier Delivery Model */}
            <section className="bg-white rounded-xl border overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold">How It Works: 3-Tier Delivery Model</h2>
                <p className="text-gray-600">Scalable support powered by technology, validated by experts, governed by community</p>
              </div>
              <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                {/* Tier 1: AI & Technology */}
                <div className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <Server className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">TIER 1</span>
                    <span className="text-sm text-gray-500">80% of requests</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">AI & Technology Platform</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Automated systems handle the bulk of support—instant, 24/7, scalable to any number of organisations.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>AI-assisted grant writing & templates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Automated bookkeeping & reconciliation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Self-service website & content tools</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Compliance checklists & reminders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Evidence library & data dashboards</span>
                    </li>
                  </ul>
                </div>

                {/* Tier 2: Validators & Experts */}
                <div className="p-6 bg-amber-50/50">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                    <UserCheck className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">TIER 2</span>
                    <span className="text-sm text-gray-500">15% of requests</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Expert Validators</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Qualified professionals review, validate, and enhance AI outputs. Human expertise where it matters.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>Accountants review financials & BAS</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>Grant writers polish applications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>Legal experts review contracts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>HR specialists handle complex issues</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>Community connectors provide context</span>
                    </li>
                  </ul>
                </div>

                {/* Tier 3: Advisory Board */}
                <div className="p-6 bg-emerald-50/50">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">TIER 3</span>
                    <span className="text-sm text-gray-500">5% of requests</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Advisory Board</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Strategic oversight, complex decisions, and governance from diverse expertise. The final layer of support.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Business & management experts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Senior accountants & auditors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Philanthropic sector leaders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Government policy advisors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Community Elders & cultural advisors</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Why This Model Works */}
            <section className="bg-gray-900 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Why This Model Works for Funders</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/10 rounded-lg p-6">
                  <p className="text-3xl font-bold text-emerald-400 mb-2">80%</p>
                  <p className="text-white font-medium mb-2">Handled by Technology</p>
                  <p className="text-sm text-gray-300">AI and automation handle routine tasks at near-zero marginal cost. One platform serves unlimited organisations.</p>
                </div>
                <div className="bg-white/10 rounded-lg p-6">
                  <p className="text-3xl font-bold text-amber-400 mb-2">$50K</p>
                  <p className="text-white font-medium mb-2">Saves Per Organisation</p>
                  <p className="text-sm text-gray-300">Each community would pay $40-50K/year for these services individually. Shared infrastructure multiplies impact.</p>
                </div>
                <div className="bg-white/10 rounded-lg p-6">
                  <p className="text-3xl font-bold text-blue-400 mb-2">29+</p>
                  <p className="text-white font-medium mb-2">Organisations Supported</p>
                  <p className="text-sm text-gray-300">One investment supports the entire network. As we grow, unit economics improve—your dollar goes further.</p>
                </div>
              </div>
            </section>

            {/* Network Reach Map */}
            <section className="bg-white rounded-xl border overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold">Network Reach: Where Your Investment Goes</h2>
                <p className="text-gray-600">29+ grassroots organisations across Australia supported by shared infrastructure</p>
              </div>
              <div className="h-[450px]">
                <GrassrootsMapClient
                  basecamps={seedData.basecamps as unknown as React.ComponentProps<typeof GrassrootsMapClient>['basecamps']}
                  futureCommunities={seedData.futureCommunities as unknown as React.ComponentProps<typeof GrassrootsMapClient>['futureCommunities']}
                  onBasecampSelect={(b: unknown) => setSelectedBasecamp(b as Basecamp)}
                />
              </div>
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex flex-wrap justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-500" />
                    <span>Founding Basecamps (4)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-amber-500" />
                    <span>CORE Partners (9)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-purple-500" />
                    <span>NETWORK Partners (20+)</span>
                  </div>
                </div>
              </div>
            </section>

            {/* What Communities Get */}
            <section className="bg-white rounded-xl border p-8">
              <h2 className="text-2xl font-bold mb-2">What Communities Get</h2>
              <p className="text-gray-600 mb-6">More time for engagement, storytelling, and the work that changes lives</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 rounded-xl p-6">
                  <h3 className="font-bold text-emerald-800 mb-4">Admin Burden Removed</h3>
                  <ul className="space-y-2 text-sm text-emerald-700">
                    <li>• Bookkeeping & financial reporting done for them</li>
                    <li>• Grant acquittals prepared and submitted</li>
                    <li>• Compliance reminders and documentation</li>
                    <li>• Website and content management handled</li>
                    <li>• Payroll and HR administration covered</li>
                  </ul>
                </div>
                <div className="bg-amber-50 rounded-xl p-6">
                  <h3 className="font-bold text-amber-800 mb-4">Training Pathways Available</h3>
                  <ul className="space-y-2 text-sm text-amber-700">
                    <li>• Learn skills in-house if preferred</li>
                    <li>• Youth employment & training opportunities</li>
                    <li>• Certification programs for local staff</li>
                    <li>• Gradual capability building over time</li>
                    <li>• Transition support when ready</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Service Grid - Grouped by Category */}
            {['Communications', 'Finance', 'People', 'Development', 'Operations', 'Technology', 'Support'].map(category => {
              const categoryServices = seedData.sharedServices.filter(s => 'category' in s && s.category === category);
              if (categoryServices.length === 0) return null;
              const styles = categoryStyles[category] || categoryStyles.Support;
              return (
                <section key={category} className="space-y-4">
                  <h3 className={`text-lg font-bold ${styles.text} flex items-center gap-2`}>
                    <span className={`w-3 h-3 rounded-full ${styles.dot}`} />
                    {category === 'Communications' ? 'Communications & Storytelling' :
                     category === 'Finance' ? 'Finance & Accounting' :
                     category === 'People' ? 'People & HR' :
                     category === 'Development' ? 'Fundraising & Development' :
                     category === 'Operations' ? 'Operations & Compliance' :
                     category === 'Technology' ? 'Technology & Data' :
                     'Dedicated Support'}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryServices.map(service => {
                      const IconComponent = iconMap[service.icon] || Heart;
                      return (
                        <div key={service.id} className="bg-white rounded-xl border p-5 hover:shadow-lg transition-shadow">
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`w-10 h-10 ${styles.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <IconComponent className={`w-5 h-5 ${styles.iconText}`} />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm">{service.name}</h4>
                              <p className="text-xs text-gray-500 line-clamp-2">{service.description}</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="bg-emerald-50 rounded p-2">
                              <span className="font-bold text-emerald-700">CORE: </span>
                              <span className="text-emerald-600">{service.coreBenefit}</span>
                            </div>
                            <div className="bg-purple-50 rounded p-2">
                              <span className="font-bold text-purple-700">NETWORK: </span>
                              <span className="text-purple-600">{service.networkBenefit}</span>
                            </div>
                            {'trainingOption' in service && service.trainingOption && service.trainingOption !== 'N/A - always provided by JusticeHub' && (
                              <div className="bg-amber-50 rounded p-2">
                                <span className="font-bold text-amber-700">
                                  <BookOpen className="w-3 h-3 inline mr-1" />
                                  Training:
                                </span>
                                <span className="text-amber-600"> {service.trainingOption}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {/* Tier Comparison */}
            <section className="bg-white rounded-xl border overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold">CORE vs NETWORK Tiers</h2>
                <p className="text-gray-600">What communities get at each partnership level</p>
              </div>
              <div className="grid md:grid-cols-2">
                <div className="p-6 bg-emerald-50">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg">CORE</span>
                    <span className="text-gray-600">{seedData.tierComparison.core.count} partners</span>
                    <span className="text-emerald-600 font-bold">{seedData.tierComparison.core.annualValue}/year value</span>
                  </div>
                  <ul className="space-y-3">
                    {seedData.tierComparison.core.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-purple-600 text-white font-bold rounded-lg">NETWORK</span>
                    <span className="text-gray-600">{seedData.tierComparison.network.count} partners</span>
                    <span className="text-purple-600 font-bold">{seedData.tierComparison.network.annualValue} value (FREE)</span>
                  </div>
                  <ul className="space-y-3">
                    {seedData.tierComparison.network.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Funder Discovery Tab */}
        {activeTab === 'funders' && (
          <div className="space-y-8">
            <section className="bg-gradient-to-br from-amber-600 to-orange-600 text-white rounded-2xl p-12">
              <h1 className="text-4xl font-black mb-4">Reverse the Grant Model</h1>
              <p className="text-xl text-amber-100 max-w-3xl mb-6">
                Instead of communities begging for funding, we bring verified impact opportunities to philanthropists who want their money to actually work.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/10 rounded-lg p-6">
                  <p className="text-3xl font-bold text-white">30-60%</p>
                  <p className="text-amber-100">Flows directly to communities</p>
                </div>
                <div className="bg-white/10 rounded-lg p-6">
                  <p className="text-3xl font-bold text-white">Quarterly</p>
                  <p className="text-amber-100">Outcome tracking via ALMA</p>
                </div>
                <div className="bg-white/10 rounded-lg p-6">
                  <p className="text-3xl font-bold text-white">Indigenous</p>
                  <p className="text-amber-100">Governance oversight on all deals</p>
                </div>
              </div>
            </section>

            {/* Investment Pathways */}
            <section className="bg-white rounded-xl border p-8">
              <h2 className="text-2xl font-bold mb-6">Investment Pathways</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {seedData.revenueStreams.map(stream => {
                  const IconComponent = iconMap[stream.icon] || DollarSign;
                  return (
                    <div key={stream.id} className="border rounded-lg p-6">
                      <IconComponent className="w-8 h-8 text-emerald-600 mb-4" />
                      <h3 className="font-bold mb-2">{stream.name}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{stream.description}</p>
                      <div className="bg-emerald-50 rounded-lg p-3 mb-3">
                        <p className="text-2xl font-bold text-emerald-700">{stream.communityShare}</p>
                        <p className="text-xs text-emerald-600">To communities</p>
                      </div>
                      <p className="text-sm text-gray-500">Year 3: {stream.year3Amount}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Portfolio Builder Mock */}
            <section className="bg-white rounded-xl border p-8">
              <h2 className="text-2xl font-bold mb-2">Portfolio Builder</h2>
              <p className="text-gray-600 mb-6">Filter community programs by intervention type, state, and evidence level</p>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>
                  <select className="px-3 py-2 border rounded-lg text-sm">
                    <option>All Intervention Types</option>
                    <option>Cultural Connection</option>
                    <option>Diversion Programs</option>
                    <option>Education/Employment</option>
                  </select>
                  <select className="px-3 py-2 border rounded-lg text-sm">
                    <option>All States</option>
                    <option>NSW</option>
                    <option>QLD</option>
                    <option>NT</option>
                    <option>VIC</option>
                  </select>
                  <select className="px-3 py-2 border rounded-lg text-sm">
                    <option>All Evidence Levels</option>
                    <option>Strong Evidence</option>
                    <option>Emerging Evidence</option>
                    <option>Community Validated</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {seedData.basecamps.slice(0, 3).map(basecamp => (
                  <div key={basecamp.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded">{basecamp.state}</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Strong Evidence</span>
                    </div>
                    <h4 className="font-bold">{basecamp.name}</h4>
                    <p className="text-sm text-gray-500 mb-2">{basecamp.location}</p>
                    <p className="text-lg font-bold text-emerald-600">{basecamp.metrics.primaryStat}</p>
                    <p className="text-xs text-gray-500">{basecamp.metrics.primaryLabel}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Case Studies */}
            <section className="bg-gray-900 text-white rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Funding Case Studies</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {seedData.fundingCases.map((c, i) => (
                  <div key={i} className="bg-white/10 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-2 py-1 bg-amber-500/30 text-amber-300 text-xs rounded">{c.status}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{c.name}</h3>
                    <p className="text-3xl font-bold text-amber-400 mb-4">{c.amount}</p>
                    <p className="text-sm text-gray-200">{c.impact}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* 10-Year Plan Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-8">
            <section className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white rounded-2xl p-12">
              <h1 className="text-4xl font-black mb-4">10-Year Vision: 2026-2036</h1>
              <p className="text-xl text-indigo-100 max-w-3xl">
                From foundation to full community ownership—a decade of building permanent infrastructure for justice.
              </p>
            </section>

            {/* Timeline */}
            <section className="bg-white rounded-xl border p-8">
              <div className="space-y-6">
                {seedData.timelinePhases.map((phase, index) => (
                  <div key={phase.year} className="relative">
                    {/* Timeline Line */}
                    {index < seedData.timelinePhases.length - 1 && (
                      <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-indigo-200" />
                    )}

                    <div
                      className={`flex gap-6 cursor-pointer ${expandedPhase === phase.year ? '' : 'opacity-80 hover:opacity-100'}`}
                      onClick={() => setExpandedPhase(expandedPhase === phase.year ? null : phase.year)}
                    >
                      {/* Year Circle */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        expandedPhase === phase.year ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        <span className="font-bold text-sm">Y{phase.year}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-xl font-bold">{phase.phase}</h3>
                          <span className="text-sm text-gray-500">{phase.dateRange}</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            {phase.funding}
                          </span>
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedPhase === phase.year ? 'rotate-180' : ''}`} />
                        </div>

                        {expandedPhase === phase.year && (
                          <div className="mt-4 grid md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-bold text-sm text-gray-500 mb-3">KEY MILESTONES</h4>
                              <ul className="space-y-2">
                                {phase.milestones.map((milestone, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">{milestone}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-indigo-50 rounded-lg p-4">
                              <h4 className="font-bold text-sm text-indigo-700 mb-3">METRICS</h4>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-2xl font-bold text-indigo-700">{phase.metrics.communities}</p>
                                  <p className="text-xs text-indigo-600">Community Partners</p>
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-indigo-700">{phase.metrics.revenue}</p>
                                  <p className="text-xs text-indigo-600">Annual Revenue</p>
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-green-600">{phase.metrics.communityBenefit}</p>
                                  <p className="text-xs text-green-600">To Communities</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Success Statement */}
            <section className="bg-indigo-900 text-white rounded-xl p-8">
              <Lightbulb className="w-10 h-10 text-yellow-400 mb-4" />
              <h3 className="text-xl font-bold mb-4 text-white">Success Statement: 2036</h3>
              <p className="text-lg text-indigo-50 italic">
                "In 2036, the Australian youth justice system operates on the principle that communities—not detention—are the solution.
                Most youth never see a courtroom. Indigenous communities control how justice is delivered in their regions.
                JusticeHub is permanent infrastructure owned by those communities."
              </p>
            </section>
          </div>
        )}

        {/* Revenue Flow Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-8">
            <section className="bg-gradient-to-br from-green-900 to-emerald-900 text-white rounded-2xl p-12">
              <h1 className="text-4xl font-black mb-4">How Money Flows to Communities</h1>
              <p className="text-xl text-green-100 max-w-3xl">
                30-60% of every dollar reaches communities directly. No extraction. No middlemen taking most of the pie.
              </p>
            </section>

            {/* Revenue Streams Detail */}
            <section className="space-y-6">
              {seedData.revenueStreams.map(stream => {
                const IconComponent = iconMap[stream.icon] || DollarSign;
                return (
                  <div key={stream.id} className="bg-white rounded-xl border overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                      <div className="flex items-center gap-4">
                        <IconComponent className="w-8 h-8" />
                        <div className="flex-1">
                          <h3 className="text-xl font-bold">{stream.name}</h3>
                          <p className="text-emerald-100">{stream.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold">{stream.year3Amount}</p>
                          <p className="text-sm text-emerald-100">Year 3 Revenue</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Flow Diagram */}
                        <div>
                          <h4 className="font-bold text-sm text-gray-500 mb-4">HOW IT FLOWS</h4>
                          <div className="space-y-3">
                            {stream.flow.map((f, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <div
                                  className="h-8 bg-emerald-100 rounded flex items-center justify-center px-3"
                                  style={{ width: `${f.percent}%`, minWidth: '80px' }}
                                >
                                  <span className="text-sm font-bold text-emerald-700">{f.percent}%</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{f.to}</p>
                                  <p className="text-xs text-gray-500">{f.amount} (per $100K)</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Examples */}
                        <div>
                          <h4 className="font-bold text-sm text-gray-500 mb-4">EXAMPLES</h4>
                          <div className="space-y-2">
                            {stream.examples.map((ex, i) => (
                              <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                                <div>
                                  <p className="font-medium text-sm">{ex.name}</p>
                                  {'focus' in ex && <p className="text-xs text-gray-500">{ex.focus}</p>}
                                  {'tier' in ex && <p className="text-xs text-gray-500">{ex.tier}</p>}
                                  {'share' in ex && <p className="text-xs text-emerald-600">{ex.share}</p>}
                                </div>
                                <p className="font-bold text-emerald-600">{ex.amount}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Calculator */}
            <section className="bg-white rounded-xl border p-8">
              <h2 className="text-2xl font-bold mb-2">Community Benefit Calculator</h2>
              <p className="text-gray-600 mb-6">See how your investment flows to communities</p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Amount: ${calculatorAmount.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="10000"
                  max="500000"
                  step="10000"
                  value={calculatorAmount}
                  onChange={(e) => setCalculatorAmount(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$10K</span>
                  <span>$500K</span>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">${Math.round(calculatedBenefits.stateGov).toLocaleString()}</p>
                  <p className="text-sm text-emerald-600">State Gov License (30%)</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-amber-700">${Math.round(calculatedBenefits.corporate).toLocaleString()}</p>
                  <p className="text-sm text-amber-600">Corporate Sponsor (60%)</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-indigo-700">${Math.round(calculatedBenefits.research).toLocaleString()}</p>
                  <p className="text-sm text-indigo-600">Research Partner (50%)</p>
                </div>
                <div className="bg-green-100 rounded-lg p-4 text-center border-2 border-green-500">
                  <p className="text-2xl font-bold text-green-700">${Math.round(calculatedBenefits.average).toLocaleString()}</p>
                  <p className="text-sm text-green-600">Average to Communities</p>
                </div>
              </div>
            </section>

            {/* Year 3 Summary */}
            <section className="bg-gray-900 text-white rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Year 3 Revenue Summary</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-emerald-400 mb-4">REVENUE SOURCES</h3>
                  <div className="space-y-3 text-gray-100">
                    <div className="flex justify-between">
                      <span>State Government Licenses</span>
                      <span className="font-bold text-white">$400K</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Corporate Sponsorships</span>
                      <span className="font-bold text-white">$500K</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Research Partnerships</span>
                      <span className="font-bold text-white">$200K</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Story Licensing</span>
                      <span className="font-bold text-white">$100K</span>
                    </div>
                    <div className="flex justify-between border-t border-white/20 pt-3">
                      <span className="font-bold text-white">TOTAL REVENUE</span>
                      <span className="font-bold text-xl text-white">$1.2M</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-emerald-400 mb-4">COMMUNITY BENEFIT</h3>
                  <div className="space-y-3 text-gray-100">
                    <div className="flex justify-between">
                      <span>State License Shares (30%)</span>
                      <span className="font-bold text-white">$120K</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Corporate Grants (60%)</span>
                      <span className="font-bold text-white">$300K</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Research Co-Authors (50%)</span>
                      <span className="font-bold text-white">$100K</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Story Revenue (50%)</span>
                      <span className="font-bold text-white">$50K</span>
                    </div>
                    <div className="flex justify-between border-t border-white/20 pt-3">
                      <span className="font-bold text-white">TOTAL TO COMMUNITIES</span>
                      <span className="font-bold text-xl text-emerald-400">$570K+ (47%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Basecamp Detail Modal */}
      {selectedBasecamp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBasecamp(null)}>
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2 py-1 bg-white/20 text-white text-xs font-medium rounded mb-2 inline-block">
                    FOUNDING BASECAMP • {selectedBasecamp.state}
                  </span>
                  <h2 className="text-2xl font-bold">{selectedBasecamp.name}</h2>
                  <p className="text-emerald-100">{selectedBasecamp.location}</p>
                </div>
                <button
                  onClick={() => setSelectedBasecamp(null)}
                  className="p-2 hover:bg-white/20 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-emerald-700">{selectedBasecamp.metrics.primaryStat}</p>
                  <p className="text-sm text-emerald-600">{selectedBasecamp.metrics.primaryLabel}</p>
                </div>
                <div className="bg-teal-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-teal-700">{selectedBasecamp.metrics.secondaryStat}</p>
                  <p className="text-sm text-teal-600">{selectedBasecamp.metrics.secondaryLabel}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2">About</h3>
                <p className="text-gray-600">{selectedBasecamp.description}</p>
              </div>

              {/* Programs */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Programs</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedBasecamp.programs.map((program, i) => (
                    <span key={i} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                      {program}
                    </span>
                  ))}
                </div>
              </div>

              {/* Storytellers */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Key People</h3>
                <div className="space-y-4">
                  {selectedBasecamp.storytellers.filter(s => s.featured).map((storyteller, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="w-6 h-6 text-emerald-700" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold">{storyteller.name}</h4>
                          <p className="text-sm text-emerald-600 mb-2">{storyteller.role}</p>
                          <p className="text-sm text-gray-600 mb-3">{storyteller.bio}</p>
                          {storyteller.quote && (
                            <div className="bg-white rounded p-3 border-l-4 border-emerald-500">
                              <Quote className="w-4 h-4 text-emerald-400 mb-1" />
                              <p className="text-sm italic text-gray-700">"{storyteller.quote}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Videos */}
              {selectedBasecamp.videos.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-4">Videos</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedBasecamp.videos.map((video, i) => (
                      <a
                        key={i}
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Play className="w-8 h-8 text-red-500" />
                          <div>
                            <h4 className="font-bold text-sm">{video.title}</h4>
                            <p className="text-xs text-gray-500">{Math.floor(video.duration / 60)} min • {video.type}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{video.description}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Youth Stories (Mounty Yarns) */}
              {'stories' in selectedBasecamp && selectedBasecamp.stories && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-4">Youth Stories</h3>
                  <div className="space-y-3">
                    {(selectedBasecamp.stories as Array<{title: string; quote: string; summary: string; tags: string[]}>).slice(0, 4).map((story, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {story.tags.map((tag, j) => (
                            <span key={j} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h4 className="font-bold text-sm mb-1">{story.title}</h4>
                        <p className="text-sm text-gray-600 italic mb-2">"{story.quote}"</p>
                        <p className="text-xs text-gray-500">{story.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Links */}
              {selectedBasecamp.externalLinks.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-4">Resources</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedBasecamp.externalLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        {link.title}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-bold text-white">Grassroots Activation Preview</p>
            <p className="text-gray-300 text-sm">
              JusticeHub • Community-led justice infrastructure
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-emerald-600/30 text-emerald-200 rounded text-sm">
              PREVIEW
            </span>
            <Link
              href="/preview"
              className="text-gray-300 hover:text-white transition-colors text-sm"
            >
              Back to Previews →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
