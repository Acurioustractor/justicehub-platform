'use client';

import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Monitor,
  Smartphone,
  Users,
  BookOpen,
  TrendingUp,
  Shield,
  Heart,
  Target,
  Award,
  DollarSign,
  PenSquare,
  Search,
  Filter,
  Play,
  Camera,
  Mic,
  FileText,
  Globe,
  MapPin,
  Calendar,
  ChevronRight,
  Quote,
  Menu,
  X,
  Brain,
  Database,
  Sparkles,
  BarChart3,
  Compass,
  Building2
} from 'lucide-react';
import Link from 'next/link';
import { Navigation, Footer, QuickNav } from '@/components/ui/navigation';
import { basecampLocations } from '@/content/excellence-map-locations';

interface PlatformStats {
  interventions: number;
  services: number;
  organizations: number;
  stories: number;
  profiles: number;
}

export default function AboutPage() {
  const [mounted, setMounted] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState('homepage');
  const [stats, setStats] = useState<PlatformStats>({
    interventions: 1000,
    services: 500,
    organizations: 450,
    stories: 100,
    profiles: 30
  });

  useEffect(() => {
    setMounted(true);
    // Fetch real stats from API
    fetch('/api/homepage-stats')
      .then(res => res.json())
      .then(data => {
        if (data.stats) {
          setStats({
            interventions: data.stats.programs_documented || 624,
            services: data.stats.total_services || 150,
            organizations: data.stats.total_organizations || 67,
            stories: data.stats.stories || 100,
            profiles: data.stats.total_people || 34
          });
        }
      })
      .catch(() => {
        // Keep defaults on error
      });
  }, []);

  const platformFeatures = [
    {
      id: 'homepage',
      title: 'Homepage',
      description: 'First impression that confronts the reality of youth justice with data-driven impact stories',
      highlights: [
        'Real-time statistics from our database',
        'Clear truth about detention vs community program success rates',
        'Direct calls-to-action for finding help or sharing solutions'
      ]
    },
    {
      id: 'intelligence',
      title: 'Intelligence Hub',
      description: 'ALMA-powered research platform with over 1,000 interventions, evidence tracking, and portfolio analytics',
      highlights: [
        `${stats.interventions.toLocaleString()}+ interventions catalogued across Australia`,
        'Evidence-based portfolio scoring and analysis',
        'Cross-project comparison and outcome tracking'
      ]
    },
    {
      id: 'stories',
      title: 'Stories Platform',
      description: 'Where young people share their journeys and get compensated for their contributions',
      highlights: [
        'Multi-media story creation (text, video, photos, audio)',
        'Privacy controls and consent management',
        'Featured stories with powerful quotes and outcomes'
      ]
    },
    {
      id: 'services',
      title: 'Service Finder',
      description: 'AI-powered tool to connect young people with local support services and programs',
      highlights: [
        `${stats.services.toLocaleString()}+ services searchable by location`,
        'Filters by need type and program focus',
        'Direct contact information and program details'
      ]
    },
    {
      id: 'programs',
      title: 'Community Programs',
      description: 'Database of grassroots programs with success rates and contact information',
      highlights: [
        'Success rate comparisons (78% vs 15.5% detention)',
        'Program descriptions and contact details',
        'Geographic distribution across Australia'
      ]
    },
    {
      id: 'transparency',
      title: 'Money Trail',
      description: 'Tracking where youth justice funding goes and what outcomes it produces',
      highlights: [
        'Cost per participant comparisons',
        'Funding flow visualization',
        'Return on investment calculations'
      ]
    },
    {
      id: 'alma',
      title: 'Ask ALMA',
      description: 'AI assistant trained on youth justice knowledge to help navigate the system',
      highlights: [
        'Instant answers about programs and services',
        'Evidence-based recommendations',
        'Source citations for all responses'
      ]
    }
  ];

  const impactStats = [
    { icon: Database, number: `${stats.interventions.toLocaleString()}+`, label: "Interventions Catalogued", change: "Evidence-based programs" },
    { icon: Building2, number: `${stats.services.toLocaleString()}+`, label: "Services Available", comparison: "Searchable directory" },
    { icon: Target, number: `${stats.organizations.toLocaleString()}+`, label: "Organizations", period: "Active in network" },
    { icon: BookOpen, number: "78%", label: "Community Success Rate", engagement: "vs 15.5% detention" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Unified Navigation */}
      <Navigation />

      {/* Quick Navigation for About Page */}
      <QuickNav
        backLink="/"
        backLabel="Back to Home"
        title="About JusticeHub"
      />

      <main id="main-content">

        {/* Hero Section */}
        <section className="pt-8 pb-16 border-b-2 border-black">
          <div className="container-justice">
            <div className="text-center max-w-4xl mx-auto">
              <div className="mb-4 text-sm uppercase tracking-wider text-black font-bold">
                ABOUT JUSTICEHUB
              </div>
              <h1 className="headline-truth mb-6">
                Transforming Youth Justice<br />
                Through Community Power
              </h1>
              <p className="text-xl text-black mb-10 leading-relaxed font-medium">
                We don't decorate injustice. We dismantle it. JusticeHub is Australia's most comprehensive
                youth justice intelligence platform—connecting young people with community solutions
                that actually work, powered by ALMA AI.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="#how-it-works">
                  <button className="cta-primary">
                    <Monitor className="h-5 w-5 mr-2" />
                    See How It Works
                  </button>
                </Link>
                <Link href="/intelligence">
                  <button className="cta-secondary">
                    <Brain className="h-5 w-5 mr-2" />
                    Explore Intelligence Hub
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The Problem Section */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold mb-6 text-black">The Problem We're Solving</h2>
                <p className="text-lg text-black font-medium mb-6">
                  Australia's youth justice system is failing everyone—young people, families, and communities.
                  The evidence is unanimous.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-3"></div>
                    <p className="text-black"><strong>84.5% recidivism rate</strong> in detention systems</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-3"></div>
                    <p className="text-black"><strong>$1.1M per year</strong> cost per young person in detention</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-3"></div>
                    <p className="text-black"><strong>24x overrepresentation</strong> of Indigenous youth in detention</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-3"></div>
                    <p className="text-black"><strong>Disconnected programs</strong> that can't demonstrate impact</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-6 text-black">But Communities Have Solutions</h3>
                <p className="text-lg text-black font-medium mb-6">
                  Grassroots programs across Australia achieve 78% success rates at 19 times lower cost.
                  They just need better tools to scale their impact.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-3"></div>
                    <p className="text-black"><strong>{stats.interventions.toLocaleString()}+ interventions</strong> catalogued and analyzed</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-3"></div>
                    <p className="text-black"><strong>$58,000 annual cost</strong> for community alternatives</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-3"></div>
                    <p className="text-black"><strong>Real transformation</strong> through mentorship and support</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-3"></div>
                    <p className="text-black"><strong>Cultural healing</strong> that addresses root causes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Overview Section */}
        <section id="how-it-works" className="section-padding">
          <div className="container-justice">
            <div className="text-center mb-16">
              <h2 className="headline-truth mb-4">How JusticeHub Works</h2>
              <p className="text-xl text-black font-medium max-w-3xl mx-auto">
                Four integrated systems that put young people at the center while giving
                communities the tools they need to scale effective solutions.
              </p>
            </div>

            {/* Feature Navigation */}
            <div className="mb-12">
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {platformFeatures.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => setActiveScreenshot(feature.id)}
                    className={`px-4 py-2 text-sm font-bold border-2 transition-all ${
                      activeScreenshot === feature.id
                        ? 'border-blue-800 bg-blue-800 text-white'
                        : 'border-black hover:bg-black hover:text-white'
                    }`}
                  >
                    {feature.title}
                  </button>
                ))}
              </div>

              {/* Feature Display */}
              <div className="max-w-4xl mx-auto">
                {platformFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    className={`${activeScreenshot === feature.id ? 'block' : 'hidden'}`}
                  >
                    <div className="border-4 border-black p-8 bg-gray-50">
                      {/* Feature Details */}
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold mb-4 text-black">{feature.title}</h3>
                        <p className="text-lg text-black font-medium">{feature.description}</p>
                      </div>
                      <div className="max-w-xl mx-auto">
                        <h4 className="text-lg font-bold mb-3 text-black">Key Features:</h4>
                        <ul className="space-y-2">
                          {feature.highlights.map((highlight, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <ChevronRight className="h-4 w-4 mt-1 text-blue-800 flex-shrink-0" />
                              <span className="text-black">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-6 text-center">
                          <Link
                            href={
                              feature.id === 'homepage' ? '/' :
                              feature.id === 'intelligence' ? '/intelligence' :
                              feature.id === 'stories' ? '/stories' :
                              feature.id === 'services' ? '/services' :
                              feature.id === 'programs' ? '/community-programs' :
                              feature.id === 'transparency' ? '/transparency' :
                              feature.id === 'alma' ? '/intelligence' : '/'
                            }
                            className="inline-flex items-center gap-2 bg-blue-800 text-white px-6 py-3 font-bold hover:bg-blue-900 transition-colors"
                          >
                            Explore {feature.title}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Four Core Systems */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-black mb-16">
              <div className="p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black">
                <Brain className="h-10 w-10 text-purple-700 mb-4" />
                <h3 className="text-lg font-bold mb-3 uppercase tracking-wider text-black">
                  ALMA Intelligence
                </h3>
                <p className="mb-4 text-black font-medium text-sm">
                  AI-powered research assistant with {stats.interventions.toLocaleString()}+ interventions,
                  evidence tracking, and portfolio analytics.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Database className="h-3 w-3 text-purple-700" />
                    <span className="text-black">Evidence-based recommendations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-3 w-3 text-purple-700" />
                    <span className="text-black">Portfolio scoring & analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-purple-700" />
                    <span className="text-black">Natural language queries</span>
                  </div>
                </div>
                <Link href="/intelligence" className="text-purple-700 underline font-bold hover:text-purple-600 inline-block mt-4 text-sm">
                  Explore Intelligence Hub →
                </Link>
              </div>

              <div className="p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black">
                <BookOpen className="h-10 w-10 text-blue-800 mb-4" />
                <h3 className="text-lg font-bold mb-3 uppercase tracking-wider text-black">
                  Living Libraries
                </h3>
                <p className="mb-4 text-black font-medium text-sm">
                  Young people share their stories while retaining ownership and receiving
                  fair compensation. Their voices drive change.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-blue-800" />
                    <span className="text-black">Full story ownership & consent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-blue-800" />
                    <span className="text-black">Payment for story sharing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-blue-800" />
                    <span className="text-black">Community connection</span>
                  </div>
                </div>
                <Link href="/stories" className="text-blue-800 underline font-bold hover:text-blue-600 inline-block mt-4 text-sm">
                  Explore Stories →
                </Link>
              </div>

              <div className="p-6 border-b-2 md:border-b-0 lg:border-r-2 border-black">
                <TrendingUp className="h-10 w-10 text-orange-600 mb-4" />
                <h3 className="text-lg font-bold mb-3 uppercase tracking-wider text-black">
                  Empathy Ledger
                </h3>
                <p className="mb-4 text-black font-medium text-sm">
                  Transparent impact tracking that shows real outcomes and
                  follows every dollar from funding to results.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-orange-600" />
                    <span className="text-black">Real-time outcome measurement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3 text-orange-600" />
                    <span className="text-black">Cross-project comparison</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-3 w-3 text-orange-600" />
                    <span className="text-black">Cost-benefit analysis</span>
                  </div>
                </div>
                <Link href="/transparency" className="text-orange-600 underline font-bold hover:text-orange-500 inline-block mt-4 text-sm">
                  View Transparency →
                </Link>
              </div>

              <div className="p-6">
                <Heart className="h-10 w-10 text-blue-600 mb-4" />
                <h3 className="text-lg font-bold mb-3 uppercase tracking-wider text-black">
                  Community Hub
                </h3>
                <p className="mb-4 text-black font-medium text-sm">
                  AI-powered matching connects young people with mentors, opportunities,
                  and services based on their goals.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Search className="h-3 w-3 text-blue-600" />
                    <span className="text-black">{stats.services.toLocaleString()}+ services searchable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-blue-600" />
                    <span className="text-black">Mentor matching system</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-blue-600" />
                    <span className="text-black">Location-based support</span>
                  </div>
                </div>
                <Link href="/services" className="text-blue-600 underline font-bold hover:text-blue-500 inline-block mt-4 text-sm">
                  Find Services →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Centre of Excellence Section */}
        <section className="section-padding bg-gray-50 border-t-2 border-b-2 border-black">
          <div className="container-justice">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white font-bold text-sm uppercase tracking-wider mb-6">
                  <Award className="h-4 w-4" />
                  Research & Best Practice
                </div>
                <h2 className="text-3xl font-bold mb-6 text-black">Centre of Excellence</h2>
                <p className="text-lg text-black font-medium mb-6">
                  JusticeHub's Centre of Excellence is Australia's leading repository for youth justice
                  research, evidence-based practices, and policy analysis. We aggregate knowledge from
                  across the sector to drive systemic change.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Database className="h-6 w-6 text-purple-700 mt-1" />
                    <div>
                      <h4 className="font-bold text-black">Evidence Repository</h4>
                      <p className="text-black text-sm">{stats.interventions.toLocaleString()}+ interventions with outcome data and research</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BarChart3 className="h-6 w-6 text-purple-700 mt-1" />
                    <div>
                      <h4 className="font-bold text-black">Portfolio Analytics</h4>
                      <p className="text-black text-sm">Scoring system to identify high-impact programs</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="h-6 w-6 text-purple-700 mt-1" />
                    <div>
                      <h4 className="font-bold text-black">International Best Practices</h4>
                      <p className="text-black text-sm">Learning from successful models worldwide</p>
                    </div>
                  </div>
                </div>
                <Link href="/centre-of-excellence" className="inline-flex items-center gap-2 bg-purple-700 text-white px-6 py-3 font-bold mt-6 hover:bg-purple-800 transition-colors">
                  Visit Centre of Excellence
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="border-4 border-black bg-white p-8">
                <div className="text-center">
                  <div className="text-6xl font-black text-purple-700 mb-4">{stats.interventions.toLocaleString()}+</div>
                  <div className="text-xl font-bold text-black mb-2">Interventions Catalogued</div>
                  <div className="text-black mb-6">Evidence-based programs from across Australia</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="border-2 border-black p-4">
                      <div className="text-2xl font-bold text-black">{stats.organizations.toLocaleString()}+</div>
                      <div className="text-black">Organizations</div>
                    </div>
                    <div className="border-2 border-black p-4">
                      <div className="text-2xl font-bold text-black">{stats.services.toLocaleString()}+</div>
                      <div className="text-black">Services</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Founding Network Section */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-bold text-sm uppercase tracking-wider mb-4">
                <MapPin className="h-4 w-4" />
                Founding Network
              </div>
              <h2 className="text-3xl font-bold mb-4 text-black">4 Basecamps Anchoring the Movement</h2>
              <p className="text-lg text-black font-medium max-w-3xl mx-auto">
                From Alice Springs to Western Sydney, four founding organizations prove that community-led
                solutions work across diverse contexts. They're the living proof behind our evidence.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {basecampLocations.map((basecamp) => (
                <div key={basecamp.id} className="text-center p-4 border-2 border-black">
                  <div className="text-2xl font-black text-orange-600">{basecamp.name}</div>
                  <div className="text-sm text-black">{basecamp.city}, {basecamp.state}</div>
                  <div className="text-xs text-green-700 font-bold mt-1">{basecamp.keyStats[0]}</div>
                </div>
              ))}
            </div>
            <div className="text-center flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/centre-of-excellence/map?category=basecamp" className="inline-flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-3 font-bold hover:bg-orange-700 transition-colors">
                <MapPin className="h-4 w-4" />
                View Network Map
              </Link>
              <Link href="/people" className="inline-flex items-center justify-center gap-2 border-2 border-black px-6 py-3 font-bold hover:bg-black hover:text-white transition-colors">
                <Users className="h-4 w-4" />
                Meet the Movement
              </Link>
            </div>
          </div>
        </section>

        {/* Mobile Experience Section */}
        <section className="section-padding">
          <div className="container-justice">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6 text-black">Designed for Real Life</h2>
                <p className="text-lg text-black font-medium mb-6">
                  Young people don't carry laptops to court hearings. Our platform works
                  seamlessly on phones with offline capabilities and simple navigation.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-6 w-6 text-blue-800 mt-1" />
                    <div>
                      <h4 className="font-bold text-black">Mobile-First Design</h4>
                      <p className="text-black">Optimized for phones with touch-friendly interfaces</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-blue-800 mt-1" />
                    <div>
                      <h4 className="font-bold text-black">Privacy by Design</h4>
                      <p className="text-black">Granular controls over who sees your information</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Heart className="h-6 w-6 text-blue-800 mt-1" />
                    <div>
                      <h4 className="font-bold text-black">Trauma-Informed</h4>
                      <p className="text-black">Every interaction designed to be safe and supportive</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Compass className="h-6 w-6 text-blue-800 mt-1" />
                    <div>
                      <h4 className="font-bold text-black">Youth Scout</h4>
                      <p className="text-black">Personalized journey builder for young people</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  {/* Phone Frame */}
                  <div className="w-64 h-[500px] bg-black rounded-[3rem] p-2">
                    <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                      {/* Phone Screen Content */}
                      <div className="h-full flex flex-col">
                        <div className="bg-blue-800 text-white p-2 text-center">
                          <h3 className="font-bold text-xs">JUSTICEHUB MOBILE</h3>
                        </div>
                        <div className="flex-1 overflow-hidden bg-white p-3">
                          {/* Mobile Interface Mockup */}
                          <div className="space-y-3 h-full">
                            {/* Hero Section */}
                            <div className="text-center py-4 bg-black text-white">
                              <div className="text-xs font-bold">24x</div>
                              <div className="text-xs">Indigenous kids locked up</div>
                            </div>

                            {/* Navigation Cards */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-gray-50 p-2 rounded text-center">
                                <div className="w-4 h-4 bg-blue-800 rounded mx-auto mb-1"></div>
                                <div className="text-xs font-medium">Find Help</div>
                              </div>
                              <div className="bg-gray-50 p-2 rounded text-center">
                                <div className="w-4 h-4 bg-purple-700 rounded mx-auto mb-1"></div>
                                <div className="text-xs font-medium">Ask ALMA</div>
                              </div>
                            </div>

                            {/* Content Preview */}
                            <div className="space-y-2">
                              <div className="bg-gray-100 p-2 rounded">
                                <div className="text-xs font-bold mb-1">Latest Stories</div>
                                <div className="text-xs text-gray-600">Young voices changing the system...</div>
                              </div>
                              <div className="bg-gray-100 p-2 rounded">
                                <div className="text-xs font-bold mb-1">Find Services</div>
                                <div className="text-xs text-gray-600">{stats.services.toLocaleString()}+ services near you...</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="border-t bg-gray-50 p-2">
                          <div className="flex justify-around">
                            <div className="text-center">
                              <BookOpen className="h-4 w-4 mx-auto text-gray-600" />
                              <span className="text-xs text-gray-600">Stories</span>
                            </div>
                            <div className="text-center">
                              <Search className="h-4 w-4 mx-auto text-gray-600" />
                              <span className="text-xs text-gray-600">Services</span>
                            </div>
                            <div className="text-center">
                              <Brain className="h-4 w-4 mx-auto text-purple-700" />
                              <span className="text-xs text-purple-700">ALMA</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Metrics */}
        <section id="impact" className="section-padding border-t-2 border-black">
          <div className="container-justice">
            <div className="text-center mb-16">
              <h2 className="headline-truth mb-4">Platform at a Glance</h2>
              <p className="text-xl text-black font-medium max-w-3xl mx-auto">
                JusticeHub aggregates Australia's most comprehensive youth justice data,
                making it accessible to everyone working toward change.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {impactStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="data-card text-center">
                    <div className="flex justify-center mb-4">
                      <Icon className="h-8 w-8 text-black" />
                    </div>
                    <div className="font-mono text-4xl font-bold mb-2">{stat.number}</div>
                    <p className="text-lg font-bold mb-1">{stat.label}</p>
                    {stat.change && <p className="text-sm text-blue-800 font-medium">{stat.change}</p>}
                    {stat.comparison && <p className="text-sm text-gray-600">{stat.comparison}</p>}
                    {stat.period && <p className="text-sm text-gray-600">{stat.period}</p>}
                    {stat.engagement && <p className="text-sm text-blue-800 font-medium">{stat.engagement}</p>}
                  </div>
                );
              })}
            </div>

            {/* Key Comparisons */}
            <div className="border-2 border-black p-8 mb-16">
              <h3 className="text-2xl font-bold mb-6 text-black text-center">The Evidence Is Clear</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="font-mono text-4xl font-bold mb-2 text-red-600">$1.1M</div>
                  <p className="text-sm font-bold text-black mb-2">Per Year in Detention</p>
                  <p className="text-xs text-black">Cost to taxpayers for each young person locked up</p>
                </div>

                <div className="text-center border-x-2 border-black px-8">
                  <div className="font-mono text-4xl font-bold mb-2 text-blue-800">19x</div>
                  <p className="text-sm font-bold text-black mb-2">More Cost Effective</p>
                  <p className="text-xs text-black">Community programs achieve better outcomes at fraction of cost</p>
                </div>

                <div className="text-center">
                  <div className="font-mono text-4xl font-bold mb-2 text-green-600">78%</div>
                  <p className="text-sm font-bold text-black mb-2">Community Success Rate</p>
                  <p className="text-xs text-black">vs 15.5% for detention-based approaches</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* User Experience Walkthrough */}
        <section className="section-padding bg-black text-white">
          <div className="container-justice">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-white">Experience Every Part of JusticeHub</h2>
              <p className="text-xl font-medium text-white max-w-3xl mx-auto">
                See how different users interact with the platform to create real change in their communities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Young Person Journey */}
              <div className="border-2 border-white p-6">
                <Users className="h-12 w-12 text-white mb-4" />
                <h3 className="text-lg font-bold mb-4 text-white">For Young People</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Use Youth Scout for personalized support</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Find local services and mentors</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Share your story and get compensated</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Ask ALMA for instant help</span>
                  </div>
                </div>
                <Link href="/services" className="inline-block mt-4 text-white underline font-bold hover:text-gray-300">
                  Find support →
                </Link>
              </div>

              {/* Researcher Journey */}
              <div className="border-2 border-white p-6">
                <Brain className="h-12 w-12 text-white mb-4" />
                <h3 className="text-lg font-bold mb-4 text-white">For Researchers</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Access {stats.interventions.toLocaleString()}+ interventions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Compare program effectiveness</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Use portfolio analytics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Query ALMA for evidence</span>
                  </div>
                </div>
                <Link href="/intelligence" className="inline-block mt-4 text-white underline font-bold hover:text-gray-300">
                  Explore research →
                </Link>
              </div>

              {/* Community Organization Journey */}
              <div className="border-2 border-white p-6">
                <Heart className="h-12 w-12 text-white mb-4" />
                <h3 className="text-lg font-bold mb-4 text-white">For Organizations</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Showcase your program's success</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Access real-time impact data</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Connect with funders and partners</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Share best practices</span>
                  </div>
                </div>
                <Link href="/community-programs" className="inline-block mt-4 text-white underline font-bold hover:text-gray-300">
                  Join the network →
                </Link>
              </div>

              {/* Funder/Government Journey */}
              <div className="border-2 border-white p-6">
                <TrendingUp className="h-12 w-12 text-white mb-4" />
                <h3 className="text-lg font-bold mb-4 text-white">For Funders</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Track investment outcomes live</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Compare program effectiveness</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Access independent verification</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Support evidence-based policy</span>
                  </div>
                </div>
                <Link href="/transparency" className="inline-block mt-4 text-white underline font-bold hover:text-gray-300">
                  View transparency →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Innovation */}
        <section className="section-padding border-t-2 border-black">
          <div className="container-justice">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold mb-6 text-black">Innovation That Matters</h2>
                <p className="text-lg text-black font-medium mb-6">
                  JusticeHub pioneers breakthrough approaches to ethical storytelling,
                  transparent impact measurement, and AI-powered knowledge systems.
                </p>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-black flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-700" />
                      ALMA - AI Learning & Mentorship Assistant
                    </h4>
                    <p className="text-black">Our AI assistant trained on youth justice knowledge, providing
                    instant answers with source citations and evidence-based recommendations.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-black flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-800" />
                      Empathy Ledger Framework
                    </h4>
                    <p className="text-black">Revolutionary system ensuring storytellers retain ownership,
                    receive fair compensation, and control their privacy while enabling transparent impact tracking.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-black flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                      Portfolio Analytics
                    </h4>
                    <p className="text-black">First platform to aggregate and compare outcomes across
                    different programs with evidence-strength scoring and risk assessment.</p>
                  </div>
                </div>
              </div>
              <div className="border-4 border-black p-8 bg-gray-50">
                <div className="text-center">
                  <Brain className="h-16 w-16 text-purple-700 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-4 text-black">Ask ALMA Anything</h3>
                  <p className="text-black mb-6">
                    Our AI assistant can answer questions about youth justice programs,
                    find relevant services, and provide evidence-based recommendations.
                  </p>
                  <div className="bg-white border-2 border-black p-4 mb-6 text-left">
                    <p className="text-sm text-gray-600 mb-2">Example questions:</p>
                    <ul className="text-sm space-y-1 text-black">
                      <li>• "What programs work for First Nations youth?"</li>
                      <li>• "Show me mentoring services in Queensland"</li>
                      <li>• "What's the evidence on restorative justice?"</li>
                    </ul>
                  </div>
                  <Link href="/intelligence" className="inline-flex items-center gap-2 bg-purple-700 text-white px-6 py-3 font-bold hover:bg-purple-800 transition-colors">
                    Try Ask ALMA
                    <Sparkles className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="section-padding bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="text-4xl font-bold mb-8 text-white">
              Ready to Transform Youth Justice?
            </h2>
            <p className="text-xl font-medium mb-12 max-w-3xl mx-auto text-white">
              Join the movement that's proving communities have the solutions.
              Whether you're a young person, researcher, organization, or funder,
              there's a place for you in this revolution.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/stories">
                <button className="w-full bg-white text-black px-6 py-4 font-bold uppercase tracking-wider hover:bg-gray-100 transition-all">
                  <PenSquare className="h-5 w-5 mx-auto mb-2" />
                  Share Your Story
                </button>
              </Link>
              <Link href="/services">
                <button className="w-full border-2 border-white text-white px-6 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
                  <Search className="h-5 w-5 mx-auto mb-2" />
                  Find Help
                </button>
              </Link>
              <Link href="/intelligence">
                <button className="w-full border-2 border-white text-white px-6 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
                  <Brain className="h-5 w-5 mx-auto mb-2" />
                  Ask ALMA
                </button>
              </Link>
              <Link href="/centre-of-excellence">
                <button className="w-full border-2 border-white text-white px-6 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
                  <Award className="h-5 w-5 mx-auto mb-2" />
                  Centre of Excellence
                </button>
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
