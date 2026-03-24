'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';

interface LiveStats {
  programs_documented: number;
  total_organizations: number;
  total_funding_grants: number;
  total_evidence: number;
}

const FALLBACK_STATS: LiveStats = {
  programs_documented: 981,
  total_organizations: 18304,
  total_funding_grants: 70963,
  total_evidence: 570,
};

const basecamps = [
  {
    name: 'Oonchiumpa',
    location: 'Mparntwe (Alice Springs)',
    stat: '$91/day vs $3,852/day detention',
    detail: '30+ young people, 90% retention, cultural brokerage with 7 language groups across 150km. Run by Traditional Owners of Mparntwe.',
    href: '/community-programs',
  },
  {
    name: 'MMEIC',
    location: 'Minjerribah (Stradbroke Island)',
    stat: '31 years of Indigenous self-determination',
    detail: 'Quandamooka Elders-in-Council. Justice reinvestment program launched 2024. All profits reinvested. 12 permanent + 20 casual roles.',
    href: '/community-programs',
  },
  {
    name: 'Adapt Mentorship',
    location: 'Toowoomba',
    stat: 'Citizens of the Year 2025',
    detail: 'Street Footy, Kickstarter Youth Mentoring, Following the Songlines. Gubbi Gubbi-led. Funded by QLD Dept of Youth Justice.',
    href: '/community-programs',
  },
  {
    name: 'Mounty Yarns',
    location: 'Mount Druitt (Western Sydney)',
    stat: 'Community-led backyard activation',
    detail: 'Daniel Daylight and the Just Reinvest crew. Where CONTAINED launches its first tour stop. Dusseldorp Forum supported.',
    href: '/contained/tour',
  },
];

const tools = [
  {
    name: 'JusticeHub',
    description: 'Open evidence engine. Every intervention verified. Every funding dollar tracked. Every community organisation mapped.',
    href: '/',
  },
  {
    name: 'CONTAINED',
    description: 'A shipping container touring Australia. Three rooms. Thirty minutes. The visceral front door that reports never provide.',
    href: '/contained',
  },
  {
    name: 'Empathy Ledger',
    description: 'Real voices. Real stories. Real reflections. Not KPIs. Not compliance reports. The human record of what actually happens.',
    href: '/stories',
  },
  {
    name: 'CivicScope',
    description: 'Political intelligence for communities. Ministerial statements, Hansard, budget moves — so community orgs are never blindsided.',
    href: '/civicscope',
  },
];

const pathways = [
  {
    label: 'I run a program',
    action: 'Get listed. Share your story. Connect with peers.',
    href: '/for-community-leaders',
  },
  {
    label: 'I fund or shape policy',
    action: 'See what works. Fund what\'s proven. Track your impact.',
    href: '/for-funders',
  },
  {
    label: 'I\'m a young person',
    action: 'Your voice matters. Here\'s how to be part of this.',
    href: '/contained/share',
  },
  {
    label: 'I want to connect',
    action: 'Join the network of people changing the system.',
    href: '/network',
  },
];

export default function VisionPage() {
  const [stats, setStats] = useState<LiveStats>(FALLBACK_STATS);

  useEffect(() => {
    fetch('/api/homepage-stats')
      .then(res => res.json())
      .then(data => {
        if (data.stats) {
          setStats({
            programs_documented: data.stats.programs_documented || FALLBACK_STATS.programs_documented,
            total_organizations: data.stats.total_organizations || FALLBACK_STATS.total_organizations,
            total_funding_grants: data.stats.total_funding_grants || FALLBACK_STATS.total_funding_grants,
            total_evidence: data.stats.total_evidence || FALLBACK_STATS.total_evidence,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Navigation />

      <main id="main-content">
        {/* Hero — The Problem */}
        <section className="min-h-[80vh] flex items-center justify-center header-offset">
          <div className="container-justice text-center">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm font-mono font-medium uppercase tracking-[0.2em] mb-8 text-[#0A0A0A]/60">
                The future of youth justice in Australia
              </p>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-8" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
                The system is a secret society.<br />
                We&apos;re opening the gates.
              </h1>

              <p className="text-lg md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed text-[#0A0A0A]/80">
                Youth justice in Australia runs on siloed casework, closed-door board meetings,
                and millions moved through handshakes. Small programs that actually work stay invisible.
                Young people stay voiceless. We&apos;re changing that.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="#whats-here" className="inline-flex items-center gap-2 bg-[#0A0A0A] text-[#F5F0E8] px-8 py-4 font-bold text-sm uppercase tracking-wider hover:bg-[#0A0A0A]/80 transition-colors">
                  See what we&apos;ve built <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="#join" className="inline-flex items-center gap-2 border-2 border-[#0A0A0A] px-8 py-4 font-bold text-sm uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-[#F5F0E8] transition-colors">
                  Get involved
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The Shift */}
        <section className="section-padding border-t-2 border-[#0A0A0A]/10">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-12" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                What we believe
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-xs font-mono font-medium uppercase tracking-[0.15em] mb-4 text-[#0A0A0A]/50">The system now</h3>
                  <ul className="space-y-4 text-lg">
                    <li className="flex gap-3">
                      <span className="text-[#0A0A0A]/30 font-bold shrink-0">&times;</span>
                      <span>Innovation siloed inside large organisations</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#0A0A0A]/30 font-bold shrink-0">&times;</span>
                      <span>Millions allocated through closed processes</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#0A0A0A]/30 font-bold shrink-0">&times;</span>
                      <span>Programs that work can&apos;t find each other</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#0A0A0A]/30 font-bold shrink-0">&times;</span>
                      <span>Young people talked about, never heard</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-mono font-medium uppercase tracking-[0.15em] mb-4 text-[#059669]">What we&apos;re building</h3>
                  <ul className="space-y-4 text-lg">
                    <li className="flex gap-3">
                      <span className="text-[#059669] font-bold shrink-0">&#10003;</span>
                      <span>Every intervention open, verified, and searchable</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#059669] font-bold shrink-0">&#10003;</span>
                      <span>Every funding dollar tracked and transparent</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#059669] font-bold shrink-0">&#10003;</span>
                      <span>Community orgs learning from each other directly</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#059669] font-bold shrink-0">&#10003;</span>
                      <span>Young people as participants, not subjects</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What's Already Here — Live Data */}
        <section id="whats-here" className="section-padding bg-[#0A0A0A] text-[#F5F0E8]">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                What&apos;s already here
              </h2>
              <p className="text-lg mb-12 text-[#F5F0E8]/70">
                Live data from the JusticeHub platform. Updated daily.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                <Link href="/interventions" className="group">
                  <div className="text-3xl md:text-4xl font-bold font-mono text-white group-hover:text-[#059669] transition-colors">
                    {stats.programs_documented.toLocaleString()}
                  </div>
                  <div className="text-sm mt-2 text-[#F5F0E8]/60 group-hover:text-[#F5F0E8] transition-colors">
                    Verified interventions
                  </div>
                </Link>

                <Link href="/community-map" className="group">
                  <div className="text-3xl md:text-4xl font-bold font-mono text-white group-hover:text-[#059669] transition-colors">
                    {stats.total_organizations.toLocaleString()}
                  </div>
                  <div className="text-sm mt-2 text-[#F5F0E8]/60 group-hover:text-[#F5F0E8] transition-colors">
                    Organisations mapped
                  </div>
                </Link>

                <Link href="/funding" className="group">
                  <div className="text-3xl md:text-4xl font-bold font-mono text-white group-hover:text-[#059669] transition-colors">
                    {stats.total_funding_grants.toLocaleString()}
                  </div>
                  <div className="text-sm mt-2 text-[#F5F0E8]/60 group-hover:text-[#F5F0E8] transition-colors">
                    Funding records tracked
                  </div>
                </Link>

                <Link href="/evidence" className="group">
                  <div className="text-3xl md:text-4xl font-bold font-mono text-white group-hover:text-[#059669] transition-colors">
                    {stats.total_evidence.toLocaleString()}
                  </div>
                  <div className="text-sm mt-2 text-[#F5F0E8]/60 group-hover:text-[#F5F0E8] transition-colors">
                    Evidence sources
                  </div>
                </Link>
              </div>

              <p className="text-sm text-[#F5F0E8]/40 font-mono">
                Every claim has a named source. Every program has been verified. This is open infrastructure.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works In Practice */}
        <section className="section-padding">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                This is what it looks like
              </h2>
              <p className="text-lg mb-12 text-[#0A0A0A]/70">
                Not abstractions. Real programs. Real people. Real numbers.
              </p>

              <div className="space-y-6">
                {basecamps.map((camp) => (
                  <Link
                    key={camp.name}
                    href={camp.href}
                    className="block border-2 border-[#0A0A0A]/10 p-6 md:p-8 hover:border-[#0A0A0A] transition-colors group"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3 mb-2">
                          <h3 className="text-xl md:text-2xl font-bold group-hover:underline">
                            {camp.name}
                          </h3>
                          <span className="text-sm text-[#0A0A0A]/50 font-mono">
                            {camp.location}
                          </span>
                        </div>
                        <p className="text-[#0A0A0A]/70 mb-2">
                          {camp.detail}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-mono font-bold text-[#059669] bg-[#059669]/10 px-3 py-1 inline-block">
                          {camp.stat}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-8 p-6 bg-[#0A0A0A]/5 border-l-4 border-[#0A0A0A]">
                <p className="text-lg font-medium mb-2">
                  The Oonchiumpa Trip — June 2026
                </p>
                <p className="text-[#0A0A0A]/70">
                  8 Aboriginal workers from Alice Springs crossing Country to learn from peer programs
                  in South East Queensland. Stradbroke Island. Toowoomba. Brisbane. Witta. Six days.
                  $25,000 total. That&apos;s the cost of locking up one young person for six days.
                </p>
                <p className="text-sm font-mono mt-3 text-[#0A0A0A]/50">
                  This is what connection looks like. Not a conference. Not a report. People visiting people.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Tools */}
        <section className="section-padding border-t-2 border-[#0A0A0A]/10 bg-[#0A0A0A]/[0.03]">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                The tools that make it real
              </h2>
              <p className="text-lg mb-12 text-[#0A0A0A]/70">
                Open infrastructure built to serve community organisations, not gatekeep them.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tools.map((tool) => (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    className="border-2 border-[#0A0A0A] p-6 hover:bg-[#0A0A0A] hover:text-[#F5F0E8] transition-all group"
                  >
                    <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {tool.name}
                    </h3>
                    <p className="text-sm leading-relaxed opacity-70 group-hover:opacity-90">
                      {tool.description}
                    </p>
                    <span className="inline-flex items-center gap-2 mt-4 text-xs font-bold uppercase tracking-wider">
                      Explore <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* The Cost Comparison */}
        <section className="section-padding bg-[#0A0A0A] text-[#F5F0E8]">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto text-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="text-xs font-mono uppercase tracking-[0.15em] mb-4 text-[#DC2626]">
                    What we spend now
                  </div>
                  <div className="text-5xl md:text-6xl font-bold font-mono text-white mb-2">
                    $1.1M
                  </div>
                  <div className="text-[#F5F0E8]/60">
                    Per child, per year, in detention.<br />
                    84% come back.
                  </div>
                </div>

                <div>
                  <div className="text-xs font-mono uppercase tracking-[0.15em] mb-4 text-[#059669]">
                    What community programs cost
                  </div>
                  <div className="text-5xl md:text-6xl font-bold font-mono text-white mb-2">
                    $33K
                  </div>
                  <div className="text-[#F5F0E8]/60">
                    Per young person, per year, in community.<br />
                    3–15% reoffend.
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-[#F5F0E8]/10">
                <p className="text-lg text-[#F5F0E8]/80 max-w-2xl mx-auto">
                  The evidence is not in question. The solutions exist. The organisations are already doing the work.
                  What&apos;s missing is the infrastructure to connect them, fund them, and make them impossible to ignore.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What You Can Do */}
        <section id="join" className="section-padding">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                What you can do
              </h2>
              <p className="text-lg mb-12 text-[#0A0A0A]/70">
                This isn&apos;t a donation page. It&apos;s a participation page.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pathways.map((pathway) => (
                  <Link
                    key={pathway.label}
                    href={pathway.href}
                    className="border-2 border-[#0A0A0A]/10 p-6 hover:border-[#0A0A0A] transition-colors group"
                  >
                    <h3 className="text-lg font-bold mb-2 group-hover:underline">
                      {pathway.label}
                    </h3>
                    <p className="text-sm text-[#0A0A0A]/60">
                      {pathway.action}
                    </p>
                    <span className="inline-flex items-center gap-2 mt-3 text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/40 group-hover:text-[#0A0A0A]">
                      Start here <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* The Future */}
        <section className="section-padding border-t-2 border-[#0A0A0A]/10">
          <div className="container-justice">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                The future
              </h2>

              <p className="text-lg md:text-xl leading-relaxed text-[#0A0A0A]/80 mb-8">
                Community organisations learning from each other. Young people in the process — not as subjects,
                as participants. A national focus built from the ground up. No more silos. No more secret handshakes.
                These are the small programs, the meetups, the open ways to learn from each other.
                This is JusticeHub. This is the future.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
                <Link href="/contained" className="inline-flex items-center gap-2 bg-[#0A0A0A] text-[#F5F0E8] px-8 py-4 font-bold text-sm uppercase tracking-wider hover:bg-[#0A0A0A]/80 transition-colors">
                  See the CONTAINED tour <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/for-funders" className="inline-flex items-center gap-2 border-2 border-[#0A0A0A] px-8 py-4 font-bold text-sm uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-[#F5F0E8] transition-colors">
                  Investment pathways <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
