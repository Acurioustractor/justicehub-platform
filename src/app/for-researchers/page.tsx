'use client';

import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  Brain, Database, BookOpen, Users, FileText, BarChart3,
  ArrowRight, CheckCircle, ExternalLink, Globe, Microscope,
  Layers, Shield, GitBranch
} from 'lucide-react';

export default function ForResearchersPage() {
  const almaCapabilities = [
    {
      title: "Intervention Database",
      description: "Structured data on youth justice programs across Australia with outcome tracking, cost analysis, and implementation details.",
      icon: Database,
      metrics: ["100+ interventions", "6 outcome categories", "Multi-jurisdiction coverage"]
    },
    {
      title: "Evidence Mapping",
      description: "Systematic classification of evidence quality using modified NHMRC frameworks, with explicit gap identification.",
      icon: Layers,
      metrics: ["5 evidence levels", "Gap analysis", "Systematic review integration"]
    },
    {
      title: "Alpha Signals",
      description: "Early indicators of promising interventions based on community voice, practitioner experience, and emerging data.",
      icon: GitBranch,
      metrics: ["Community-sourced", "Practitioner validated", "Cultural appropriateness"]
    },
    {
      title: "Impact Modelling",
      description: "Economic and social impact calculators for comparing intervention costs and benefits across different scenarios.",
      icon: BarChart3,
      metrics: ["Cost-benefit analysis", "Comparative modelling", "Scenario planning"]
    }
  ];

  const researchOpportunities = [
    {
      title: "Data Partnerships",
      description: "Access to ALMA datasets for academic research, with appropriate ethics protocols and community consent frameworks.",
      eligibility: "Universities, research institutions, qualified PhD candidates"
    },
    {
      title: "Collaborative Studies",
      description: "Partner with JusticeHub and community organizations on place-based research that centers community voices.",
      eligibility: "Research teams committed to participatory approaches"
    },
    {
      title: "Evidence Synthesis",
      description: "Contribute to systematic reviews and meta-analyses of youth justice interventions in Australia.",
      eligibility: "Researchers with relevant methodological expertise"
    },
    {
      title: "Knowledge Translation",
      description: "Help translate research findings into accessible formats for practitioners, policy makers, and communities.",
      eligibility: "Researchers interested in impact beyond academia"
    }
  ];

  const existingPartners = [
    {
      name: "ANU True Justice Initiative",
      focus: "Deep listening, restorative justice, Aboriginal law",
      collaboration: "Oonchiumpa partnership since 2022"
    },
    {
      name: "UNSW Social Policy Research Centre",
      focus: "Justice reinvestment evaluation",
      collaboration: "Bourke project evaluation"
    },
    {
      name: "Griffith Criminology Institute",
      focus: "Youth justice policy, diversion programs",
      collaboration: "Queensland evidence mapping"
    }
  ];

  const ethicsFramework = [
    {
      principle: "Community Consent",
      description: "All research involving community data requires appropriate consent and adheres to AIATSIS guidelines for Aboriginal research."
    },
    {
      principle: "Data Sovereignty",
      description: "First Nations data is governed by First Nations people. We follow Indigenous Data Sovereignty principles."
    },
    {
      principle: "Benefit Sharing",
      description: "Research must directly benefit the communities involved, not just advance academic careers."
    },
    {
      principle: "Transparent Methods",
      description: "All methodologies are documented and open to scrutiny. We reject extractive research practices."
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
                For Researchers & Academics
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-8">
                EVIDENCE THAT<br />SERVES COMMUNITY
              </h1>

              <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
                JusticeHub's ALMA system provides unprecedented access to youth justice
                intervention data—with <span className="font-bold text-black">community consent at the centre</span>.
                Join us in building the evidence base for transformation.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/intelligence/dashboard"
                  className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors text-center"
                >
                  Explore ALMA
                </Link>
                <Link
                  href="/contact?source=researchers"
                  className="border-2 border-black px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors text-center"
                >
                  Partnership Inquiry
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ALMA Platform */}
        <section className="py-16 bg-gray-50 border-y-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              ALMA Intelligence Platform
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              <strong>Authentic Learning for Meaningful Accountability</strong>—our evidence
              system that maps what works in youth justice while respecting community
              knowledge and consent protocols.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {almaCapabilities.map((cap, i) => (
                <div key={i} className="bg-white p-6 border-2 border-black">
                  <cap.icon className="w-10 h-10 mb-4" />
                  <h3 className="font-bold text-xl mb-3">{cap.title}</h3>
                  <p className="text-gray-700 mb-4">{cap.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {cap.metrics.map((metric, j) => (
                      <span key={j} className="px-2 py-1 bg-gray-100 text-xs font-bold uppercase tracking-widest">
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/intelligence/research"
                className="inline-flex items-center gap-2 font-bold uppercase tracking-widest text-sm hover:underline"
              >
                Try ALMA Research Agent <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Research Opportunities */}
        <section className="py-16">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Research Opportunities
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              We're building a research ecosystem that centers community knowledge alongside
              academic rigor. Here's how you can contribute.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {researchOpportunities.map((opp, i) => (
                <div key={i} className="border-2 border-black">
                  <div className="p-6 border-b-2 border-black">
                    <h3 className="font-bold text-xl mb-2">{opp.title}</h3>
                    <p className="text-gray-700">{opp.description}</p>
                  </div>
                  <div className="p-4 bg-gray-50">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Eligibility
                    </div>
                    <div className="text-sm mt-1">{opp.eligibility}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ethics Framework */}
        <section className="py-16 bg-emerald-50 border-y-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Research Ethics Framework
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              We reject extractive research. All partnerships must align with these principles.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ethicsFramework.map((item, i) => (
                <div key={i} className="bg-white p-6 border-2 border-black">
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-emerald-700 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-lg mb-2">{item.principle}</h3>
                      <p className="text-gray-700">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-black text-white">
              <div className="flex items-start gap-4">
                <BookOpen className="w-8 h-8 flex-shrink-0 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Required Reading</h3>
                  <p className="text-gray-300 mb-4">
                    All researchers must be familiar with:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      <a href="https://aiatsis.gov.au/research/ethical-research" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        AIATSIS Guidelines for Ethical Research in Australian Indigenous Studies
                      </a>
                    </li>
                    <li className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      <a href="https://www.maiamnayriwingara.org.au/" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Maiam nayri Wingara Indigenous Data Sovereignty Principles
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Existing Partners */}
        <section className="py-16">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">
              Research Partners
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {existingPartners.map((partner, i) => (
                <div key={i} className="p-6 border-2 border-black hover:bg-gray-50 transition-colors">
                  <h3 className="font-bold text-lg mb-2">{partner.name}</h3>
                  <div className="text-sm text-gray-600 mb-4">
                    <strong>Focus:</strong> {partner.focus}
                  </div>
                  <div className="text-sm text-emerald-700">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    {partner.collaboration}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Access */}
        <section className="py-16 bg-gray-50 border-y-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">
              Data Access Levels
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 border-2 border-black">
                <div className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">
                  Public
                </div>
                <h3 className="font-bold text-xl mb-3">Open Data</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Aggregated intervention summaries
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Published evidence reviews
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Geographic service mapping
                  </li>
                </ul>
                <div className="mt-4 text-sm font-bold">No registration required</div>
              </div>

              <div className="bg-white p-6 border-2 border-black">
                <div className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-2">
                  Registered
                </div>
                <h3 className="font-bold text-xl mb-3">Research Access</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    Full intervention database
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    Outcome data (de-identified)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    API access for analysis
                  </li>
                </ul>
                <div className="mt-4 text-sm font-bold">Ethics approval required</div>
              </div>

              <div className="bg-white p-6 border-2 border-black">
                <div className="text-xs font-bold uppercase tracking-widest text-purple-700 mb-2">
                  Partnership
                </div>
                <h3 className="font-bold text-xl mb-3">Deep Access</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Community-consented data
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Direct community engagement
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Joint research design
                  </li>
                </ul>
                <div className="mt-4 text-sm font-bold">Formal MOU required</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6">
              Let's Build the Evidence Together
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              If your research can serve community transformation, we want to hear from you.
              Submit a partnership inquiry to explore collaboration opportunities.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact?source=researchers&type=partnership"
                className="bg-white text-black px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
              >
                Submit Inquiry
              </Link>
              <Link
                href="/intelligence/dashboard"
                className="border-2 border-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
              >
                Explore ALMA
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
