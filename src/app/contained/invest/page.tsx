'use client';

import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const TOUR_STOPS = [
  {
    city: 'Mount Druitt',
    state: 'NSW',
    date: 'April 2026',
    partner: 'Mounty Yarns',
    status: 'Planning',
    cost: '$25,000',
    description: 'Western Sydney launch — young people designing Room 1 for the first time.',
  },
  {
    city: 'Adelaide',
    state: 'SA',
    date: 'May 2026',
    partner: 'Reintegration Conference + Justice Reform Initiative',
    status: 'Confirmed',
    cost: '$50,000',
    description: 'National conference integration — delegates walk through between sessions.',
  },
  {
    city: 'Perth',
    state: 'WA',
    date: 'May 2026',
    partner: 'UWA School of Social Sciences',
    status: 'Exploring',
    cost: '$50,000',
    description: 'University campus deployment — academic research partnership.',
  },
  {
    city: 'Tennant Creek',
    state: 'NT',
    date: 'June 2026',
    partner: 'Community-controlled',
    status: 'Exploring',
    cost: '$75,000',
    description: 'Community-controlled from start to finish. Only happens if community wants it.',
  },
];

const WHAT_MONEY_BUYS = [
  { amount: '$5,000', gets: 'Documentation and professional photography at one tour stop' },
  { amount: '$15,000', gets: 'Full video documentation — shareable for your advocacy and ours' },
  { amount: '$25,000', gets: 'Fund the container build — custom three-room fit-out' },
  { amount: '$30,000', gets: 'Fund one complete tour stop — transport, setup, facilitation, documentation' },
  { amount: '$50,000', gets: 'Build a second CONTAINED unit — more containers, more cities, more pressure across Australia' },
  { amount: '$75,000', gets: 'Fund the Tennant Creek community-controlled stop — cultural safety, local facilitation, community authority' },
  { amount: '$200,000', gets: 'Fund the full national tour — five cities, complete documentation, partner activation' },
];

export default function ContainedInvestPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="pt-40">
        {/* Header */}
        <section className="py-12 border-b-2 border-[#0A0A0A]">
          <div className="container-justice">
            <Link
              href="/contained"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-[#0A0A0A] mb-6 py-3"
            >
              <ArrowLeft className="w-5 h-5 md:w-4 md:h-4" /> Back to CONTAINED
            </Link>

            <div className="inline-block bg-[#0A0A0A] text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
              For Funders
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-4">
              Back the Tour
            </h1>

            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
              CONTAINED is evidence-led immersive advocacy. One shipping container, three rooms,
              five cities. Every dollar funds infrastructure for community-led justice reform.
            </p>
          </div>
        </section>

        {/* The Case */}
        <section className="py-12 bg-[#0A0A0A] text-white border-b-2 border-[#0A0A0A]">
          <div className="container-justice">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 text-white">
              The Investment Case
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="border border-gray-700 p-6">
                <div className="text-3xl font-black text-[#DC2626] mb-2 font-mono">$1.55M</div>
                <div className="text-sm text-gray-400 uppercase tracking-widest mb-3">Per child/year in detention</div>
                <p className="text-gray-300 text-sm">
                  Australia spends $1.55 million per child per year in detention. 84% reoffend within two years.
                </p>
                <p className="text-xs text-gray-500 mt-2">Source: Productivity Commission ROGS 2024-25</p>
              </div>
              <div className="border border-gray-700 p-6">
                <div className="text-3xl font-black text-[#059669] mb-2 font-mono">$75/day</div>
                <div className="text-sm text-gray-400 uppercase tracking-widest mb-3">Community alternatives</div>
                <p className="text-gray-300 text-sm">
                  Community-led programs cost $75/day with 88% success rate. For the same cost as one
                  child in detention, 16 young people can be supported.
                </p>
                <p className="text-xs text-gray-500 mt-2">Source: Community Services Benchmark Study 2024</p>
              </div>
              <div className="border border-gray-700 p-6">
                <div className="text-3xl font-black text-white mb-2 font-mono">73%</div>
                <div className="text-sm text-gray-400 uppercase tracking-widest mb-3">Diagrama success rate</div>
                <p className="text-gray-300 text-sm">
                  Spain&apos;s Diagrama Foundation achieves 73% success with therapeutic care.
                  &euro;5.64 returned for every &euro;1 invested.
                </p>
                <p className="text-xs text-gray-500 mt-2">Source: Diagrama Foundation evaluation</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tour Stops */}
        <section className="py-12 border-b-2 border-[#0A0A0A]">
          <div className="container-justice">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
              Tour Stops — Fund a City
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl">
              Each tour stop is independently funded. You choose which city your investment supports.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {TOUR_STOPS.map((stop) => (
                <div key={stop.city} className="border-2 border-[#0A0A0A] bg-white">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-black">{stop.city}</h3>
                        <p className="text-sm text-gray-500">{stop.partner}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 ${
                          stop.status === 'Confirmed'
                            ? 'bg-[#059669] text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {stop.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{stop.description}</p>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <div>
                        <span className="text-2xl font-black font-mono">{stop.cost}</span>
                        <span className="text-sm text-gray-500 ml-2">{stop.date}</span>
                      </div>
                      <span className="text-xs text-gray-400">{stop.state}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 border-2 border-[#0A0A0A] bg-[#0A0A0A] text-white p-6 text-center">
              <div className="text-3xl font-black font-mono mb-2">$200,000</div>
              <div className="text-sm text-gray-400 uppercase tracking-widest mb-4">Full National Tour</div>
              <p className="text-gray-300 max-w-lg mx-auto">
                Fund all five cities including transport, documentation, community engagement,
                and partner activation. Your name on the movement.
              </p>
            </div>
          </div>
        </section>

        {/* What Your Money Buys */}
        <section className="py-12 border-b-2 border-[#0A0A0A]">
          <div className="container-justice">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">
              What Your Money Buys
            </h2>
            <div className="space-y-4">
              {WHAT_MONEY_BUYS.map((tier) => (
                <div key={tier.amount} className="flex items-start gap-4 border-l-4 border-[#0A0A0A] pl-4 py-2">
                  <span className="text-xl font-black font-mono w-28 flex-shrink-0">{tier.amount}</span>
                  <span className="text-gray-700">{tier.gets}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Platform Stack */}
        <section className="py-12 border-b-2 border-[#0A0A0A] bg-white">
          <div className="container-justice">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
              What You&apos;re Actually Funding
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl">
              CONTAINED is the front door. Behind it sits permanent infrastructure.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-[#0A0A0A] p-6">
                <h3 className="font-black text-lg mb-2">CONTAINED</h3>
                <p className="text-sm text-gray-600 mb-3">The emotional front door. Shows what youth detention feels like.</p>
                <p className="text-xs text-gray-400">Touring exhibition — 4 cities, 2026</p>
              </div>
              <div className="border-2 border-[#0A0A0A] p-6">
                <h3 className="font-black text-lg mb-2">JusticeHub</h3>
                <p className="text-sm text-gray-600 mb-3">The public evidence layer. 981 verified programs, $72B funding tracked.</p>
                <p className="text-xs text-gray-400">Permanent infrastructure — open access</p>
              </div>
              <div className="border-2 border-[#0A0A0A] p-6">
                <h3 className="font-black text-lg mb-2">ALMA</h3>
                <p className="text-sm text-gray-600 mb-3">The evidence intelligence engine. Keeps the system current, verified, actionable.</p>
                <p className="text-xs text-gray-400">13 data tools — real-time queries</p>
              </div>
              <div className="border-2 border-[#0A0A0A] p-6">
                <h3 className="font-black text-lg mb-2">Empathy Ledger</h3>
                <p className="text-sm text-gray-600 mb-3">Consent, story, and community authority layer. 226 storytellers, cultural protocols.</p>
                <p className="text-xs text-gray-400">Community-controlled — always</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-[#0A0A0A] text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 text-white">
              Ready to Talk?
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-8">
              We&apos;ll send you the full tour plan and budget. No obligations. Just a conversation
              about whether this aligns with what you care about.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contained/help"
                className="inline-flex items-center justify-center gap-2 bg-[#DC2626] text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
              >
                Get in Touch <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contained/tour"
                className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-[#0A0A0A] transition-colors"
              >
                See the Tour
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-8">
              Contact: ben@justicehub.com.au | All stats sourced from Productivity Commission ROGS 2024-25
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
