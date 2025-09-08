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
  X
} from 'lucide-react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';

export default function AboutPage() {
  const [mounted, setMounted] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState('homepage');

  useEffect(() => {
    setMounted(true);
  }, []);

  const platformFeatures = [
    {
      id: 'homepage',
      title: 'Homepage',
      description: 'First impression that confronts the reality of youth justice with data-driven impact stories',
      screenshot: '/screenshots/homepage-hero.jpg',
      highlights: [
        'Rotating impact statistics (24x Indigenous incarceration rate)',
        'Clear truth about detention vs community program success rates',
        'Direct calls-to-action for finding help or sharing solutions'
      ]
    },
    {
      id: 'stories',
      title: 'Stories Platform',
      description: 'Where young people share their journeys and get compensated for their contributions',
      screenshot: '/screenshots/stories-platform.jpg',
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
      screenshot: '/screenshots/service-finder.jpg',
      highlights: [
        'Location-based service discovery',
        'Filters by need type and program focus',
        'Direct contact information and program details'
      ]
    },
    {
      id: 'grassroots',
      title: 'Grassroots Programs',
      description: 'Database of community programs with success rates and contact information',
      screenshot: '/screenshots/grassroots-programs.jpg',
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
      screenshot: '/screenshots/transparency-dashboard.jpg',
      highlights: [
        'Cost per participant comparisons',
        'Funding flow visualization',
        'Return on investment calculations'
      ]
    },
    {
      id: 'dashboard',
      title: 'Youth Dashboard',
      description: 'Personalized space for young people to track their journey and access resources',
      screenshot: '/screenshots/youth-dashboard.jpg',
      highlights: [
        'Goal tracking and progress visualization',
        'Mentor connections and communications',
        'Opportunity matching based on interests'
      ]
    },
    {
      id: 'empathy-ledger',
      title: 'Empathy Ledger Analytics',
      description: 'Cross-project impact tracking showing real outcomes across all programs',
      screenshot: '/screenshots/empathy-ledger.jpg',
      highlights: [
        'Real-time impact metrics',
        'Cross-project comparison analytics',
        'Story engagement and compensation tracking'
      ]
    }
  ];

  const impactStats = [
    { icon: Target, number: "2,400+", label: "Youth Connected", change: "+45% this year" },
    { icon: Award, number: "78%", label: "Average Success Rate", comparison: "vs 15.5% in detention" },
    { icon: DollarSign, number: "$45M", label: "Cost Savings Identified", period: "annually" },
    { icon: BookOpen, number: "1,200+", label: "Stories Shared", engagement: "85% impact rate" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* Unified Navigation */}
      <Navigation />

      <main id="main-content">

        {/* Hero Section */}
        <section className="header-offset pb-16 border-b-2 border-black">
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
                We don't decorate injustice. We dismantle it. See how our platform connects 
                young people with community solutions that actually work.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="#how-it-works">
                  <button className="cta-primary">
                    <Monitor className="h-5 w-5 mr-2" />
                    See How It Works
                  </button>
                </Link>
                <Link href="#impact">
                  <button className="cta-secondary">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    View Impact
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
                    <p className="text-black"><strong>70% recidivism rate</strong> in detention systems</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-3"></div>
                    <p className="text-black"><strong>$1.1M per year</strong> cost per young person in detention</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-3"></div>
                    <p className="text-black"><strong>No voice</strong> for young people in systems meant to help them</p>
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
                    <p className="text-black"><strong>150+ working programs</strong> achieving real results</p>
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
                Three integrated systems that put young people at the center while giving 
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

              {/* Screenshot Display */}
              <div className="max-w-6xl mx-auto">
                {platformFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    className={`${activeScreenshot === feature.id ? 'block' : 'hidden'}`}
                  >
                    <div className="border-4 border-black mb-6">
                      {/* Actual Screenshot */}
                      <div className="aspect-video bg-gray-100 overflow-hidden">
                        <img
                          src={`/screenshots/${feature.id === 'homepage' ? 'homepage-hero' : 
                               feature.id === 'stories' ? 'stories-platform' : 
                               feature.id === 'services' ? 'service-finder' : 
                               feature.id === 'grassroots' ? 'grassroots-programs' : 
                               feature.id === 'transparency' ? 'transparency-dashboard' : 
                               feature.id === 'dashboard' ? 'youth-dashboard' : 
                               'empathy-ledger'}-desktop.png`}
                          alt={`${feature.title} interface screenshot`}
                          className="w-full h-full object-cover object-top"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    {/* Feature Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-2xl font-bold mb-4 text-black">{feature.title}</h3>
                        <p className="text-lg text-black font-medium mb-6">{feature.description}</p>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold mb-3 text-black">Key Features:</h4>
                        <ul className="space-y-2">
                          {feature.highlights.map((highlight, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <ChevronRight className="h-4 w-4 mt-1 text-blue-800" />
                              <span className="text-black">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Three Core Systems */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-black mb-16">
              <div className="p-8 border-b-2 md:border-b-0 md:border-r-2 border-black">
                <BookOpen className="h-12 w-12 text-blue-800 mb-4" />
                <h3 className="text-xl font-bold mb-4 uppercase tracking-wider text-black">
                  Living Libraries
                </h3>
                <p className="mb-6 text-black font-medium">
                  Young people share their stories while retaining ownership and receiving 
                  fair compensation. Their voices drive change.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-800" />
                    <span className="text-black">Full story ownership & consent control</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-800" />
                    <span className="text-black">Payment for story sharing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-800" />
                    <span className="text-black">Community connection through stories</span>
                  </div>
                </div>
                <Link href="/stories" className="text-blue-800 underline font-bold hover:text-blue-600 inline-block mt-4">
                  Explore Stories →
                </Link>
              </div>

              <div className="p-8 border-b-2 md:border-b-0 md:border-r-2 border-black">
                <TrendingUp className="h-12 w-12 text-orange-600 mb-4" />
                <h3 className="text-xl font-bold mb-4 uppercase tracking-wider text-black">
                  Empathy Ledger
                </h3>
                <p className="mb-6 text-black font-medium">
                  Transparent impact tracking that shows real outcomes and 
                  follows every dollar from funding to results.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-600" />
                    <span className="text-black">Real-time outcome measurement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-orange-600" />
                    <span className="text-black">Cross-project comparison</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-orange-600" />
                    <span className="text-black">Cost-benefit analysis</span>
                  </div>
                </div>
                <Link href="/transparency" className="text-orange-600 underline font-bold hover:text-orange-500 inline-block mt-4">
                  View Transparency →
                </Link>
              </div>

              <div className="p-8">
                <Heart className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-4 uppercase tracking-wider text-black">
                  Community Hub
                </h3>
                <p className="mb-6 text-black font-medium">
                  AI-powered matching connects young people with mentors, opportunities, 
                  and services based on their goals, not risk factors.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-blue-600" />
                    <span className="text-black">Smart service discovery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-black">Mentor matching system</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-black">Location-based support</span>
                  </div>
                </div>
                <Link href="/services" className="text-blue-600 underline font-bold hover:text-blue-500 inline-block mt-4">
                  Find Services →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Experience Section */}
        <section className="section-padding bg-gray-50 border-t-2 border-b-2 border-black">
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
                        <div className="flex-1 overflow-hidden">
                          <img
                            src="/screenshots/homepage-hero-mobile.png"
                            alt="JusticeHub mobile interface"
                            className="w-full h-full object-cover object-top"
                          />
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
                              <Users className="h-4 w-4 mx-auto text-gray-600" />
                              <span className="text-xs text-gray-600">Community</span>
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
        <section id="impact" className="section-padding">
          <div className="container-justice">
            <div className="text-center mb-16">
              <h2 className="headline-truth mb-4">Real Impact, Real Results</h2>
              <p className="text-xl text-black font-medium max-w-3xl mx-auto">
                JusticeHub connects over 2,400 young people with community programs 
                that achieve 78% success rates at 19 times lower cost than detention.
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

            {/* Success Story Highlights */}
            <div className="border-2 border-black p-8 mb-16">
              <h3 className="text-2xl font-bold mb-6 text-black text-center">Success Stories That Drive Change</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="aspect-square bg-gray-200 mb-4 border-2 border-black overflow-hidden max-w-48 mx-auto">
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                      MARCUS STORY<br/>IMAGE
                    </div>
                  </div>
                  <Quote className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                  <p className="text-sm italic text-black mb-2">
                    "BackTrack didn't just teach me welding. They taught me I was worth something."
                  </p>
                  <p className="text-xs font-bold text-black">— Marcus, 19, Now a Mentor</p>
                </div>
                
                <div className="text-center">
                  <div className="aspect-square bg-gray-200 mb-4 border-2 border-black overflow-hidden max-w-48 mx-auto">
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                      GROOTE EYLANDT<br/>PROGRAM IMAGE
                    </div>
                  </div>
                  <div className="font-mono text-3xl font-bold mb-2 text-blue-800">95%</div>
                  <p className="text-sm font-bold text-black mb-2">Crime Reduction</p>
                  <p className="text-xs text-black">Groote Eylandt's elder-led program achieved 95% crime reduction in 3 years</p>
                </div>
                
                <div className="text-center">
                  <div className="aspect-square bg-gray-200 mb-4 border-2 border-black overflow-hidden max-w-48 mx-auto">
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                      PROGRAM<br/>NETWORK IMAGE
                    </div>
                  </div>
                  <div className="font-mono text-3xl font-bold mb-2 text-orange-600">150+</div>
                  <p className="text-sm font-bold text-black mb-2">Working Programs</p>
                  <p className="text-xs text-black">Grassroots programs achieving measurable results across Australia</p>
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
                    <span className="text-white">Create your story and get paid</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Find local services and mentors</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Track goals and celebrate wins</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Connect with peers who understand</span>
                  </div>
                </div>
                <Link href="/stories" className="inline-block mt-4 text-white underline font-bold hover:text-gray-300">
                  Start your journey →
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
                <Link href="/grassroots" className="inline-block mt-4 text-white underline font-bold hover:text-gray-300">
                  Join the network →
                </Link>
              </div>

              {/* Community Member Journey */}
              <div className="border-2 border-white p-6">
                <MapPin className="h-12 w-12 text-white mb-4" />
                <h3 className="text-lg font-bold mb-4 text-white">For Communities</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">See local program outcomes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Volunteer as mentor or supporter</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Track community investment impact</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                    <span className="text-white">Advocate for policy change</span>
                  </div>
                </div>
                <Link href="/community-programs" className="inline-block mt-4 text-white underline font-bold hover:text-gray-300">
                  Get involved →
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
                  JusticeHub pioneers the world's first Empathy Ledger—a breakthrough approach 
                  to ethical storytelling and transparent impact measurement.
                </p>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-black">Empathy Ledger Framework</h4>
                    <p className="text-black">Revolutionary system ensuring storytellers retain ownership, 
                    receive fair compensation, and control their privacy while enabling transparent impact tracking.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-black">AI-Powered Matching</h4>
                    <p className="text-black">Smart algorithms connect young people with mentors and 
                    opportunities based on dreams and goals, not just risk factors or problems.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-black">Cross-Project Analytics</h4>
                    <p className="text-black">First platform to aggregate and compare outcomes across 
                    different programs, creating unprecedented transparency in youth justice funding.</p>
                  </div>
                </div>
              </div>
              <div className="border-4 border-black">
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src="/screenshots/empathy-ledger-desktop.png"
                    alt="Empathy Ledger technology dashboard"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
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
              Whether you're a young person, organization, community member, or funder, 
              there's a place for you in this revolution.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/stories/new">
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
              <Link href="/grassroots">
                <button className="w-full border-2 border-white text-white px-6 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
                  <Heart className="h-5 w-5 mx-auto mb-2" />
                  Join Network
                </button>
              </Link>
              <Link href="/transparency">
                <button className="w-full border-2 border-white text-white px-6 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
                  <TrendingUp className="h-5 w-5 mx-auto mb-2" />
                  View Impact
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