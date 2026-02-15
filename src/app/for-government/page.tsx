'use client';

import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  TrendingDown, DollarSign, Scale, Users, Building, Shield,
  ArrowRight, CheckCircle, AlertTriangle, FileText, BarChart3,
  MapPin, Lightbulb, Target, Brain
} from 'lucide-react';

export default function ForGovernmentPage() {
  const keyStats = [
    {
      stat: "$7.7B",
      context: "Annual youth justice spending",
      detail: "Mostly on detention that increases reoffending",
      icon: DollarSign
    },
    {
      stat: "24x",
      context: "Indigenous overrepresentation",
      detail: "First Nations kids are 24 times more likely to be detained",
      icon: AlertTriangle
    },
    {
      stat: "$1.1M",
      context: "Per child, per year",
      detail: "Cost of detention compared to $50K for community programs",
      icon: TrendingDown
    },
    {
      stat: "78%",
      context: "Reoffending rate",
      detail: "Detention makes outcomes worse, not better",
      icon: Scale
    }
  ];

  const evidenceHighlights = [
    {
      program: "Groote Eylandt Cultural Healing",
      location: "NT",
      result: "95% crime reduction in 3 years",
      approach: "Community-controlled cultural programs"
    },
    {
      program: "Bourke Justice Reinvestment",
      location: "NSW",
      result: "23% reduction in custody",
      approach: "Redirecting justice spending to community"
    },
    {
      program: "BackTrack Youth Works",
      location: "NSW",
      result: "87% success rate",
      approach: "Education and employment pathways"
    },
    {
      program: "Oonchiumpa",
      location: "NT",
      result: "95% reduced anti-social behavior",
      approach: "On-country programs, cultural mentoring"
    }
  ];

  const offerings = [
    {
      title: "ALMA Evidence System",
      description: "Access our intelligence platform mapping effective interventions across Australia with cost-benefit analysis and outcome data.",
      icon: Brain,
      cta: "Explore ALMA",
      link: "/intelligence/dashboard"
    },
    {
      title: "Policy Briefs",
      description: "Research-backed policy recommendations for youth justice reform, tailored to your jurisdiction's context and challenges.",
      icon: FileText,
      cta: "View Research",
      link: "/resources"
    },
    {
      title: "Community Connections",
      description: "Direct introductions to community organizations delivering proven outcomes, ready for partnership or commissioning.",
      icon: Users,
      cta: "Meet Partners",
      link: "/centre-of-excellence"
    },
    {
      title: "Impact Measurement",
      description: "Frameworks and tools for measuring what matters—outcomes, not outputs—in youth justice programs.",
      icon: BarChart3,
      cta: "Learn More",
      link: "/intelligence/impact-calculator"
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
                For Government & Policy Makers
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-8">
                EVIDENCE FOR<br />BETTER POLICY
              </h1>

              <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
                Australia's youth justice system costs billions and makes outcomes worse.
                We provide the <span className="font-bold text-black">evidence, connections, and tools</span> to
                shift investment toward what actually works.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/intelligence/dashboard"
                  className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors text-center"
                >
                  Access ALMA Dashboard
                </Link>
                <Link
                  href="/contact?source=government"
                  className="border-2 border-black px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors text-center"
                >
                  Request Briefing
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The Problem */}
        <section className="py-16 bg-red-50 border-y-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              The Current State of Youth Justice
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              The numbers tell a story of systemic failure. Detention doesn't reduce crime—
              it manufactures adult criminals at enormous cost to taxpayers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {keyStats.map((stat, i) => (
                <div key={i} className="bg-white p-6 border-2 border-black">
                  <stat.icon className="w-8 h-8 mb-4 text-red-700" />
                  <div className="text-4xl font-black mb-2">{stat.stat}</div>
                  <div className="font-bold text-sm uppercase tracking-widest mb-2">
                    {stat.context}
                  </div>
                  <div className="text-sm text-gray-600">{stat.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What Works */}
        <section className="py-16">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              What Actually Works
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              Community-led programs consistently outperform detention. These aren't pilot
              projects—they're established programs with years of outcome data.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {evidenceHighlights.map((evidence, i) => (
                <div key={i} className="border-2 border-black bg-white hover:bg-gray-50 transition-colors">
                  <div className="p-6 border-b-2 border-black bg-emerald-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-xl mb-1">{evidence.program}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          {evidence.location}
                        </div>
                      </div>
                      <div className="text-2xl font-black text-emerald-700">
                        {evidence.result}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-sm text-gray-600">
                      <span className="font-bold">Approach:</span> {evidence.approach}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/intelligence/interventions"
                className="inline-flex items-center gap-2 font-bold uppercase tracking-widest text-sm hover:underline"
              >
                Browse All Evidence <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* How We Help */}
        <section className="py-16 bg-gray-50 border-y-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              How JusticeHub Supports Government
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              We bridge the gap between community expertise and government capacity,
              providing the evidence base for transformational policy.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {offerings.map((offering, i) => (
                <div key={i} className="bg-white p-8 border-2 border-black">
                  <offering.icon className="w-10 h-10 mb-4" />
                  <h3 className="font-bold text-xl mb-3">{offering.title}</h3>
                  <p className="text-gray-700 mb-6">{offering.description}</p>
                  <Link
                    href={offering.link}
                    className="inline-flex items-center gap-2 font-bold uppercase tracking-widest text-sm hover:underline"
                  >
                    {offering.cta} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Justice Reinvestment */}
        <section className="py-16">
          <div className="container-justice">
            <div className="max-w-4xl">
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">
                The Case for Justice Reinvestment
              </h2>

              <div className="prose prose-lg max-w-none">
                <p className="text-xl text-gray-700 mb-6">
                  <strong>Justice Reinvestment</strong> redirects funding from incarceration to
                  community-based interventions that address the drivers of crime. It's not soft
                  on crime—it's smart on crime.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
                  <div className="text-center p-6 border-2 border-black">
                    <div className="text-4xl font-black mb-2">$1.1M</div>
                    <div className="text-sm uppercase tracking-widest">Per child detained</div>
                  </div>
                  <div className="text-center p-6 border-2 border-black bg-gray-100">
                    <ArrowRight className="w-8 h-8 mx-auto mb-2" />
                    <div className="text-sm uppercase tracking-widest">Redirect to</div>
                  </div>
                  <div className="text-center p-6 border-2 border-black bg-emerald-50">
                    <div className="text-4xl font-black mb-2 text-emerald-700">22 kids</div>
                    <div className="text-sm uppercase tracking-widest">In community programs</div>
                  </div>
                </div>

                <div className="bg-black text-white p-8 my-8">
                  <div className="flex items-start gap-4">
                    <Lightbulb className="w-8 h-8 flex-shrink-0 text-yellow-400" />
                    <div>
                      <h3 className="font-bold text-lg mb-2">The Bourke Model</h3>
                      <p className="text-gray-300">
                        In Bourke, NSW, justice reinvestment achieved a 23% reduction in custody
                        while creating 50+ local jobs and saving the state millions. The model is
                        now being replicated across Australia—with JusticeHub helping to connect
                        and scale effective approaches.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* State Resources */}
        <section className="py-16 bg-gray-50 border-y-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">
              Resources by Jurisdiction
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['NT', 'QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'ACT'].map((state) => (
                <Link
                  key={state}
                  href={`/networks/${state.toLowerCase()}`}
                  className="p-6 bg-white border-2 border-black hover:bg-black hover:text-white transition-colors text-center group"
                >
                  <div className="text-2xl font-black mb-2">{state}</div>
                  <div className="text-xs uppercase tracking-widest text-gray-500 group-hover:text-gray-300">
                    View Hub
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6">
              Ready to Transform Youth Justice?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Schedule a briefing with our team. We'll share jurisdiction-specific data,
              connect you with community partners, and help develop evidence-based policy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact?source=government&type=briefing"
                className="bg-white text-black px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
              >
                Request Government Briefing
              </Link>
              <Link
                href="/intelligence/dashboard"
                className="border-2 border-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
              >
                Explore ALMA Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
