'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, ArrowDown, Target, Award, DollarSign, TrendingUp, Users, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import CoELeaders from '@/components/CoELeaders';
import HomepageNetworkMap from '@/components/HomepageNetworkMap';
import EmpathyLedgerStories from '@/components/EmpathyLedgerStories';

interface HomepageStats {
  programs_documented: number;
  programs_with_outcomes: number;
  outcomes_rate: number;
  total_services: number;
  youth_services: number;
  total_people: number;
  total_organizations: number;
  states_covered: number;
  estimated_cost_savings_millions: number;
}

export default function HomePage() {
  const [currentStatIndex, setCurrentStatIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<HomepageStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch live stats from database
  useEffect(() => {
    fetch('/api/homepage-stats')
      .then(res => res.json())
      .then(data => {
        if (data.stats) {
          setStats(data.stats);
        }
      })
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, []);

  // Only start rotation after mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Rotate through impact stats
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      setCurrentStatIndex((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, [mounted]);

  const impactStats = [
    { number: "24x", context: "Indigenous kids locked up vs non-Indigenous" },
    { number: "95%", context: "Crime drop on Groote Eylandt in 3 years" },
    { number: "$1.1M", context: "Per child, per year. To make things worse." }
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* Unified Navigation */}
      <Navigation />

      {/* Hero - One powerful truth */}
      <main id="main-content">
        <section className="min-h-screen flex items-center justify-center header-offset">
          <div className="container-justice text-center">
          <div className="max-w-5xl mx-auto">
            {/* Rotating impact stat */}
            <div className="mb-12 impact-number">
              <div className="hero-stat">{impactStats[currentStatIndex].number}</div>
              <p className="text-xl md:text-2xl mt-4 font-medium">
                {impactStats[currentStatIndex].context}
              </p>
            </div>

            <h1 className="headline-truth mb-8">
              Australia locks up children.<br />
              Communities have the cure.<br />
              We connect them.
            </h1>

            <p className="body-truth mx-auto mb-12">
              No inspirational quotes. No poverty tourism. Just proven solutions 
              from communities already doing the work. This is infrastructure for revolution.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/services" className="cta-primary">
                FIND HELP NOW
              </Link>
              <Link href="#truth" className="cta-secondary">
                SEE THE DATA
              </Link>
            </div>
          </div>

          <div className="mt-20">
            <ArrowDown className="w-8 h-8 mx-auto animate-bounce" />
          </div>
        </div>
      </section>

      {/* The Truth Section */}
      <section id="truth" className="section-padding border-t-2 border-black">
        <div className="container-justice">
          <h2 className="headline-truth mb-16 text-center">
            The truth about youth justice
          </h2>

          {/* Primary Success Rate Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div className="data-card bg-orange-50 border-l-8 border-orange-600 text-center">
              <div className="font-mono text-6xl font-bold text-orange-600 mb-4">15.5%</div>
              <h3 className="text-xl font-bold mb-2">DETENTION SUCCESS RATE</h3>
              <p className="text-gray-700">84.5% reoffend within 12 months</p>
              <div className="mt-4 bg-orange-600 text-white py-2 px-4 font-bold">
                SYSTEM FAILURE
              </div>
            </div>
            <div className="data-card bg-blue-50 border-l-8 border-blue-800 text-center">
              <div className="font-mono text-6xl font-bold text-blue-800 mb-4">78%</div>
              <h3 className="text-xl font-bold mb-2">COMMUNITY PROGRAMS</h3>
              <p className="text-gray-700">22% reoffend - and that's the average</p>
              <div className="mt-4 bg-blue-800 text-white py-2 px-4 font-bold">
                PROVEN SOLUTION
              </div>
            </div>
          </div>

          {/* Cost Comparison */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8 text-center">COST REALITY</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="data-card bg-blue-50 border-l-8 border-blue-800 text-center">
                <h4 className="font-bold text-lg mb-4">COMMUNITY PROGRAMS</h4>
                <div className="font-mono text-5xl font-bold text-blue-800 mb-2">$58,000</div>
                <p className="text-sm text-gray-600 mb-4">per young person annually</p>
                <div className="bg-blue-800 h-4 rounded mb-2" style={{width: '5.3%'}}></div>
                <div className="bg-blue-800 text-white py-2 px-4 font-bold text-sm">
                  INVESTMENT IN SOLUTION
                </div>
              </div>
              
              <div className="data-card bg-orange-50 border-l-8 border-orange-600 text-center">
                <h4 className="font-bold text-lg mb-4">DETENTION</h4>
                <div className="font-mono text-5xl font-bold text-orange-600 mb-2">$1.1M</div>
                <p className="text-sm text-gray-600 mb-4">per young person annually</p>
                <div className="bg-orange-600 h-4 rounded mb-2" style={{width: '100%'}}></div>
                <div className="bg-orange-600 text-white py-2 px-4 font-bold text-sm">
                  WASTE OF RESOURCES
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8 p-6 bg-black">
              <p className="text-2xl font-bold text-white">
                SAVINGS: $1,042,000 per young person per year
              </p>
              <p className="text-lg mt-2 text-white">19 times more cost-effective. And it actually works.</p>
            </div>
          </div>

          {/* Platform Impact Metrics - Live from Database */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8 text-center">JUSTICEHUB IMPACT</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="data-card text-center">
                <div className="flex justify-center mb-4">
                  <Target className="h-8 w-8 text-black" />
                </div>
                {statsLoading ? (
                  <div className="font-mono text-4xl font-bold mb-2 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="font-mono text-4xl font-bold mb-2">
                    {stats?.programs_documented.toLocaleString() || '624'}
                  </div>
                )}
                <p className="text-lg font-bold mb-1">Programs Documented</p>
                <p className="text-sm text-blue-800 font-medium">
                  {stats?.outcomes_rate || 67}% with outcomes data
                </p>
              </div>

              <div className="data-card text-center">
                <div className="flex justify-center mb-4">
                  <Users className="h-8 w-8 text-black" />
                </div>
                {statsLoading ? (
                  <div className="font-mono text-4xl font-bold mb-2 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="font-mono text-4xl font-bold mb-2">
                    {stats?.total_services.toLocaleString() || '150'}
                  </div>
                )}
                <p className="text-lg font-bold mb-1">Active Services</p>
                <p className="text-sm text-blue-800 font-medium">
                  {stats?.states_covered || 7} states & territories
                </p>
              </div>

              <div className="data-card text-center">
                <div className="flex justify-center mb-4">
                  <Award className="h-8 w-8 text-black" />
                </div>
                <div className="font-mono text-4xl font-bold mb-2">78%</div>
                <p className="text-lg font-bold mb-1">Average Success Rate</p>
                <p className="text-sm text-gray-600">vs 15.5% in detention</p>
              </div>

              <div className="data-card text-center">
                <div className="flex justify-center mb-4">
                  <DollarSign className="h-8 w-8 text-black" />
                </div>
                {statsLoading ? (
                  <div className="font-mono text-4xl font-bold mb-2 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="font-mono text-4xl font-bold mb-2">
                    ${stats?.estimated_cost_savings_millions || 45}M
                  </div>
                )}
                <p className="text-lg font-bold mb-1">Cost Savings</p>
                <p className="text-sm text-gray-600">Identified annually</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold mb-4">
              Every dollar spent on detention is a dollar stolen from solutions that work.
            </p>
            <Link href="/transparency" className="cta-primary inline-block">
              FOLLOW THE MONEY
            </Link>
          </div>
        </div>
      </section>

      {/* Centre of Excellence Leadership */}
      <CoELeaders />

      {/* National Network Map */}
      <HomepageNetworkMap />

      {/* What We Build */}
      <section className="section-padding bg-black">
        <div className="container-justice">
          <h2 className="headline-truth mb-4 text-white">
            We don't decorate injustice.
          </h2>
          <p className="text-2xl mb-16 text-white">We dismantle it.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-white">
            <div className="p-8 border-b-2 md:border-b-0 md:border-r-2 border-white">
              <h3 className="text-xl font-bold mb-4 uppercase tracking-wider text-white">
                For Young People
              </h3>
              <p className="mb-6 text-white">
                No lectures. No judgment. Just tools that work. 
                Built by people who've been where you are.
              </p>
              <Link href="/services" className="text-white underline font-bold hover:text-gray-300">
                Start here →
              </Link>
            </div>

            <div className="p-8 border-b-2 md:border-b-0 md:border-r-2 border-white">
              <h3 className="text-xl font-bold mb-4 uppercase tracking-wider text-white">
                For Communities
              </h3>
              <p className="mb-6 text-white">
                You already have the answers. Your programs work. 
                We're here to amplify them.
              </p>
              <Link href="/grassroots" className="text-white underline font-bold hover:text-gray-300">
                Share your solution →
              </Link>
            </div>

            <div className="p-8">
              <h3 className="text-xl font-bold mb-4 uppercase tracking-wider text-white">
                For Decision Makers
              </h3>
              <p className="mb-6 text-white">
                The evidence is unanimous. The community is ready. 
                Your move.
              </p>
              <Link href="/transparency" className="text-white underline font-bold hover:text-gray-300">
                See the evidence →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Programs That Work - Grid Layout */}
      <section className="section-padding">
        <div className="container-justice">
          <h2 className="headline-truth mb-16">
            Communities already solving this
          </h2>

          <div className="justice-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Groote Eylandt */}
            <div className="p-8">
              <div className="font-mono text-5xl font-bold mb-4">95%</div>
              <h3 className="text-xl font-bold mb-2">Groote Eylandt</h3>
              <p className="mb-4">
                Elders + culture + young people = 95% less crime in 3 years. 
                No new theory. Ancient wisdom.
              </p>
              <Link href="/stories" className="font-bold underline">
                Full story →
              </Link>
            </div>

            {/* BackTrack */}
            <div className="p-8">
              <div className="font-mono text-5xl font-bold mb-4">87%</div>
              <h3 className="text-xl font-bold mb-2">BackTrack Youth Works</h3>
              <p className="mb-4">
                Dogs, welding, and mentorship. Turns "problem kids" into 
                qualified workers. 87% never reoffend.
              </p>
              <Link href="/grassroots" className="font-bold underline">
                Learn more →
              </Link>
            </div>

            {/* Transition 2 Success */}
            <div className="p-8">
              <div className="font-mono text-5xl font-bold mb-4">67%</div>
              <h3 className="text-xl font-bold mb-2">Transition 2 Success</h3>
              <p className="mb-4">
                Costs 95% less than detention. Three times better outcomes. 
                Operating in Queensland right now.
              </p>
              <Link href="/services" className="font-bold underline">
                Find services →
              </Link>
            </div>

            {/* More programs */}
            <div className="p-8 bg-black md:col-span-2 lg:col-span-3">
              <p className="text-2xl font-bold mb-4 text-white">
                {stats?.programs_documented || 624}+ programs across Australia. Working. Right now.
              </p>
              <p className="text-xl mb-6 text-white">
                The solutions exist. They're just invisible, underfunded, and 
                disconnected. That's what we're here to fix.
              </p>
              <Link href="/grassroots" className="inline-block bg-white text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-gray-100">
                EXPLORE ALL PROGRAMS
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Platform */}
      <section className="section-padding border-t-2 border-black">
        <div className="container-justice">
          <h2 className="headline-truth mb-16">
            JusticeHub: Infrastructure for revolution
          </h2>

          {/* ALMA Chat Feature - Full Width */}
          <div className="mb-12 border-2 border-black bg-gradient-to-r from-green-50 to-blue-50 p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-black rounded-lg flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-green-400" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-black mb-2">ASK ALMA</h3>
                <p className="text-lg mb-4">
                  AI-powered guide to 624+ youth justice programs across Australia.
                  Find services, explore evidence, connect with communities.
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1 bg-green-100 border border-green-600 text-green-800 text-sm font-bold">624 Programs</span>
                  <span className="px-3 py-1 bg-blue-100 border border-blue-600 text-blue-800 text-sm font-bold">7 States</span>
                  <span className="px-3 py-1 bg-purple-100 border border-purple-600 text-purple-800 text-sm font-bold">Real-time Data</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Link
                  href="#alma-chat"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-bold border-2 border-black hover:bg-green-700 transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  ASK NOW
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="data-card">
              <h3 className="text-xl font-bold mb-4">GRASSROOTS DATABASE</h3>
              <p className="mb-4">
                Every community program. Searchable. Shareable.
                No more reinventing wheels.
              </p>
              <Link href="/intelligence/interventions" className="font-bold underline">
                Search programs →
              </Link>
            </div>

            <div className="data-card">
              <h3 className="text-xl font-bold mb-4">TALENT SCOUT</h3>
              <p className="mb-4">
                Match young people with mentors based on dreams,
                not risk factors. Human connection that works.
              </p>
              <Link href="/talent-scout" className="font-bold underline">
                Find mentors →
              </Link>
            </div>

            <div className="data-card">
              <h3 className="text-xl font-bold mb-4">MONEY TRAIL</h3>
              <p className="mb-4">
                Every dollar. Every decision. Every outcome.
                Transparency as a weapon for change.
              </p>
              <Link href="/transparency" className="font-bold underline">
                Follow money →
              </Link>
            </div>

            <div className="data-card">
              <h3 className="text-xl font-bold mb-4">STEWARDS</h3>
              <p className="mb-4">
                Protect what works. Join the community nurturing
                evidence-based youth justice reform.
              </p>
              <Link href="/stewards" className="font-bold underline">
                Become a steward →
              </Link>
            </div>
          </div>
          
          {/* Empathy Ledger Stories - Real stories from the community */}
          <EmpathyLedgerStories />
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-black">
        <div className="container-justice text-center">
          <h2 className="headline-truth mb-8 text-white">
            The evidence is clear.<br />
            The solutions exist.<br />
            The time is now.
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/services" className="inline-block bg-white text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-gray-100">
              I NEED HELP
            </Link>
            <Link href="/grassroots" className="inline-block border-2 border-white text-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
              I HAVE SOLUTIONS
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