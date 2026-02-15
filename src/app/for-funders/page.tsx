'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  TrendingUp, Shield, Users, Target, BarChart3, DollarSign,
  ArrowRight, CheckCircle, AlertTriangle, Lightbulb, Building2,
  Scale, Heart, MapPin, Globe, Loader2
} from 'lucide-react';

interface Basecamp {
  slug: string;
  name: string;
  region: string;
  description: string;
  stats: { label: string; value: string }[];
}

// Fallback data for initial render / SSR
const FALLBACK_BASECAMPS: Basecamp[] = [
  {
    slug: 'oonchiumpa',
    name: 'Oonchiumpa',
    region: 'Alice Springs, NT',
    description: 'Aboriginal-led cultural healing achieving what detention never could.',
    stats: [{ label: 'Impact', value: '95% reduced anti-social behavior' }]
  },
  {
    slug: 'bg-fit',
    name: 'BG Fit',
    region: 'Mount Isa, QLD',
    description: 'Fitness and mentoring redirecting young people from the justice system.',
    stats: [{ label: 'Engaged', value: '400+ young people yearly' }]
  },
  {
    slug: 'mounty-yarns',
    name: 'Mounty Yarns',
    region: 'Mount Druitt, NSW',
    description: 'Youth-led storytelling and media empowering young voices.',
    stats: [{ label: 'Trained', value: '50+ young storytellers' }]
  },
  {
    slug: 'picc-townsville',
    name: 'PICC Townsville',
    region: 'Townsville, QLD',
    description: 'Pasifika family support strengthening community connections.',
    stats: [{ label: 'Supported', value: '300+ families annually' }]
  }
];

export default function ForFundersPage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [basecamps, setBasecamps] = useState<Basecamp[]>(FALLBACK_BASECAMPS);
  const [basecampsLoading, setBasecampsLoading] = useState(true);

  // Fetch basecamps from API (single source of truth)
  useEffect(() => {
    fetch('/api/basecamps')
      .then(res => res.json())
      .then((data: Basecamp[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setBasecamps(data);
        }
      })
      .catch(console.error)
      .finally(() => setBasecampsLoading(false));
  }, []);

  const impactMetrics = [
    {
      stat: "$1.1M",
      context: "Cost per detained child per year",
      comparison: "vs $50K for community programs",
      icon: DollarSign
    },
    {
      stat: "95%",
      context: "Crime reduction on Groote Eylandt",
      comparison: "in just 3 years with cultural programs",
      icon: TrendingUp
    },
    {
      stat: "24x",
      context: "Indigenous overrepresentation",
      comparison: "in youth detention nationally",
      icon: AlertTriangle
    },
    {
      stat: "87%",
      context: "BackTrack success rate",
      comparison: "for high-risk young people",
      icon: CheckCircle
    }
  ];

  const investmentOpportunities = [
    {
      title: "Place-Based Transformation",
      description: "Fund community-led programs that have proven 5-10x ROI compared to incarceration.",
      examples: ["Oonchiumpa (Alice Springs)", "BG Fit (Mount Isa)", "Mounty Yarns (Western Sydney)"],
      impact: "Direct support for frontline organizations"
    },
    {
      title: "ALMA Intelligence Platform",
      description: "Invest in the evidence infrastructure that identifies what works and where.",
      examples: ["Intervention database", "Impact measurement", "Alpha signal detection"],
      impact: "System-wide improvement"
    },
    {
      title: "Centre of Excellence Network",
      description: "Scale effective programs through our state-based node network.",
      examples: ["NT Hub (Active)", "QLD Hub (Active)", "NSW Hub (Forming)"],
      impact: "National reach through local action"
    }
  ];

  const partnershipTiers = [
    {
      name: "Community Partner",
      amount: "$10K - $50K",
      benefits: [
        "Quarterly impact reports",
        "Network event invitations",
        "Recognition in annual report",
        "Direct connection to one program"
      ]
    },
    {
      name: "Strategic Partner",
      amount: "$50K - $250K",
      benefits: [
        "All Community Partner benefits",
        "Seat on advisory council",
        "Co-designed impact measurement",
        "Site visit opportunities",
        "Priority access to research findings"
      ]
    },
    {
      name: "Founding Partner",
      amount: "$250K+",
      benefits: [
        "All Strategic Partner benefits",
        "Board observer rights",
        "Named program sponsorship",
        "Joint advocacy opportunities",
        "Custom research partnerships"
      ]
    }
  ];


  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      <main className="pt-40">
        {/* Hero */}
        <section className="py-16 md:py-24">
          <div className="container-justice">
            <div className="max-w-4xl">
              <div className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
                For Funders & Philanthropists
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-8">
                INVEST IN WHAT<br />ACTUALLY WORKS
              </h1>

              <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
                Every dollar invested in community-led youth justice programs returns
                <span className="font-bold text-black"> $5-10 in avoided costs</span>.
                We connect philanthropic capital with proven, scalable solutions.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact?source=funders"
                  className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors text-center"
                >
                  Schedule a Briefing
                </Link>
                <Link
                  href="#investment-thesis"
                  className="border-2 border-black px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors text-center"
                >
                  View Investment Thesis
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The Problem / Opportunity */}
        <section className="py-16 bg-gray-50 border-y-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-12">
              The Case for Investment
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {impactMetrics.map((metric, i) => (
                <div key={i} className="bg-white p-6 border-2 border-black">
                  <metric.icon className="w-8 h-8 mb-4" />
                  <div className="text-4xl font-black mb-2">{metric.stat}</div>
                  <div className="font-bold text-sm uppercase tracking-widest mb-2">
                    {metric.context}
                  </div>
                  <div className="text-sm text-gray-600">{metric.comparison}</div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-8 bg-black text-white">
              <div className="flex items-start gap-4">
                <Lightbulb className="w-8 h-8 flex-shrink-0 text-yellow-400" />
                <div>
                  <h3 className="font-bold text-lg mb-2">The Opportunity</h3>
                  <p className="text-gray-300">
                    Australia spends <strong className="text-white">$7.7 billion annually</strong> on
                    youth justice—mostly on detention that makes outcomes worse. Community programs
                    cost a fraction and deliver lasting change. Your investment can redirect this
                    broken system toward what works.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Investment Thesis */}
        <section id="investment-thesis" className="py-16">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Investment Thesis
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              JusticeHub operates at the intersection of community wisdom and systemic change.
              We don't just fund programs—we build the infrastructure for transformation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {investmentOpportunities.map((opp, i) => (
                <div key={i} className="border-2 border-black">
                  <div className="p-6 border-b-2 border-black bg-gray-50">
                    <h3 className="font-bold text-xl mb-2">{opp.title}</h3>
                    <p className="text-gray-700">{opp.description}</p>
                  </div>
                  <div className="p-6">
                    <div className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
                      Examples
                    </div>
                    <ul className="space-y-2">
                      {opp.examples.map((ex, j) => (
                        <li key={j} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>{ex}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        <span className="font-bold">Impact:</span> {opp.impact}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Basecamp Results */}
        <section className="py-16 bg-emerald-50 border-y-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Basecamp Results
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              Our Basecamps are the place-based organizations that anchor the JusticeHub network.
              They're not pilot programs—they have years of documented outcomes, ready to scale.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {basecampsLoading ? (
                <div className="col-span-4 flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                basecamps.map((basecamp) => (
                  <div key={basecamp.slug} className="bg-white p-6 border-2 border-black">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{basecamp.region}</span>
                    </div>
                    <h3 className="font-bold text-xl mb-2">{basecamp.name}</h3>
                    {basecamp.stats?.[0] && (
                      <div className="text-2xl font-black text-emerald-700 mb-3">
                        {basecamp.stats[0].value}
                      </div>
                    )}
                    <p className="text-gray-700 text-sm line-clamp-3">{basecamp.description}</p>
                    <Link
                      href={`/organizations/${basecamp.slug}`}
                      className="inline-flex items-center gap-2 mt-4 text-sm font-bold uppercase tracking-widest hover:underline"
                    >
                      Learn More <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Partnership Tiers */}
        <section className="py-16">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Partnership Opportunities
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              Choose the level of engagement that fits your philanthropic strategy.
              All partnerships include impact reporting and direct connection to outcomes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {partnershipTiers.map((tier, i) => (
                <div
                  key={i}
                  className={`border-2 border-black cursor-pointer transition-colors ${
                    selectedTier === tier.name ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTier(tier.name === selectedTier ? null : tier.name)}
                >
                  <div className="p-6 border-b-2 border-black">
                    <h3 className="font-bold text-xl mb-1">{tier.name}</h3>
                    <div className={`text-3xl font-black ${
                      selectedTier === tier.name ? 'text-emerald-400' : 'text-emerald-700'
                    }`}>
                      {tier.amount}
                    </div>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3">
                      {tier.benefits.map((benefit, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            selectedTier === tier.name ? 'text-emerald-400' : 'text-emerald-600'
                          }`} />
                          <span className="text-sm">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Need */}
        <section className="py-16 bg-gray-50 border-y-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">
              What We Need
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 border-2 border-black">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <Building2 className="w-6 h-6" />
                  Core Operations
                </h3>
                <p className="text-gray-700 mb-4">
                  Unrestricted funding to build and maintain the infrastructure that
                  connects communities with resources.
                </p>
                <div className="text-sm text-gray-600">
                  <strong>Target:</strong> $500K annually
                </div>
              </div>

              <div className="bg-white p-8 border-2 border-black">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  ALMA Intelligence System
                </h3>
                <p className="text-gray-700 mb-4">
                  Develop the evidence platform that identifies effective interventions
                  and tracks system-wide impact.
                </p>
                <div className="text-sm text-gray-600">
                  <strong>Target:</strong> $250K for Phase 1
                </div>
              </div>

              <div className="bg-white p-8 border-2 border-black">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <Globe className="w-6 h-6" />
                  Network Expansion
                </h3>
                <p className="text-gray-700 mb-4">
                  Activate new state-based nodes to extend the Centre of Excellence
                  network nationally.
                </p>
                <div className="text-sm text-gray-600">
                  <strong>Target:</strong> $150K per new node
                </div>
              </div>

              <div className="bg-white p-8 border-2 border-black">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <Heart className="w-6 h-6" />
                  Community Program Support
                </h3>
                <p className="text-gray-700 mb-4">
                  Direct funding to frontline organizations delivering proven
                  interventions.
                </p>
                <div className="text-sm text-gray-600">
                  <strong>Target:</strong> $1M+ for distribution
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Schedule a briefing to learn how your investment can transform youth justice
              in Australia. We'll share detailed financials, impact data, and partnership options.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact?source=funders&type=briefing"
                className="bg-white text-black px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
              >
                Schedule Briefing
              </Link>
              <Link
                href="/resources/funder-prospectus.pdf"
                className="border-2 border-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
              >
                Download Prospectus
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
