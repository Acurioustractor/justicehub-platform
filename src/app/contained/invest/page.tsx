'use client';

import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const TOUR_STOPS = [
  {
    city: 'Mount Druitt',
    state: 'NSW',
    date: 'May-Jun 2026',
    partner: 'Mounty Yarns + Just Reinvest',
    status: 'Small gathering',
    cost: '$20,000',
    description: 'Flexible Western Sydney pre-launch gathering. Young people, Mounty Yarns, and Just Reinvest relationships shape what travels next.',
  },
  {
    city: 'Adelaide',
    state: 'SA',
    date: 'End Jun 2026',
    partner: 'Justice Reform Initiative + Tandanya',
    status: 'Public launch',
    cost: '$50,000',
    description: 'Australian tour launch at Tandanya. Brisbane young people carry Room 1, David from Diagrama anchors Room 2, Adelaide organisations build Room 3.',
  },
  {
    city: 'Perth + surrounds',
    state: 'WA',
    date: 'Jul-Aug 2026',
    partner: 'UWA + Reconciliation WA',
    status: 'Planning',
    cost: '$50,000',
    description: 'University campus deployment, civic partnerships, and a regional drop-in to Broome or Kalgoorlie.',
  },
  {
    city: 'Brisbane',
    state: 'QLD',
    date: 'Sep 2026',
    partner: 'YAC + EPIC Pathways',
    status: 'Planning',
    cost: '$40,000',
    description: 'Queensland sector stop with young facilitators, universities, MPs, and local program evidence in the room.',
  },
  {
    city: 'Northern Rivers',
    state: 'NSW',
    date: 'Oct 2026',
    partner: 'The Buttery',
    status: 'Tentative',
    cost: '$35,000',
    description: 'Therapeutic-community lineage and regional public access outside the metro circuit.',
  },
  {
    city: 'Alice Springs · Central Australia',
    state: 'NT',
    date: 'Nov 2026',
    partner: 'Oonchiumpa',
    status: 'Confirmed',
    cost: '$50,000',
    description: 'Community-controlled Central Australian stop. Cultural safety, local facilitation, community authority.',
  },
  {
    city: 'Sydney + Canberra',
    state: 'NSW/ACT',
    date: 'Dec 2026-Jan 2027',
    partner: 'Uniting + USyd + ACT civic partners',
    status: 'Tentative',
    cost: '$60,000',
    description: 'Sydney advocacy and research spine, then Parliament-facing Canberra days for federal and territory decision-makers.',
  },
  {
    city: 'Victoria',
    state: 'VIC',
    date: 'Feb-Mar 2027',
    partner: 'St Martins YAC + RMIT',
    status: 'Tentative',
    cost: '$40,000',
    description: 'Youth arts collaboration, academic spine, and a Room 3 built with local program partners.',
  },
  {
    city: 'Tasmania',
    state: 'TAS',
    date: 'Apr 2027',
    partner: 'DarkLab + Prevention Not Detention',
    status: 'Tentative',
    cost: '$35,000',
    description: 'Tour close with cultural institution backing, coalition organising, and the year-end public record.',
  },
];

const WHAT_MONEY_BUYS = [
  { amount: '$20K', gets: 'Mount Druitt small gathering. Young people paid, Western Sydney build proof captured, first local relationships documented before the public launch.' },
  { amount: '$50K', gets: 'Adelaide public launch at Tandanya. Conference delegates, Brisbane build story, David from Diagrama, and local Room 3 program evidence.' },
  { amount: '$30K-$60K', gets: 'One flexible tour stop. Young facilitators paid, move and setup covered, local Room 1 and Room 3 built, documentation and reflection journals captured.' },
  { amount: '$120K', gets: 'Tour-wide backbone. Travelling facilitator core, editorial, documentation, national coordination, insurance, admin, and the year-end bound record.' },
  { amount: '$500K', gets: 'Full Australian tour. Nine-stop national arc, one year of JusticeHub civic intelligence, Australian Living Map and Empathy Ledger evidence published around the container.' },
  { amount: 'Bespoke', gets: 'Pop-up Contained, co-designed with you. Custom build for your audience, place, or moment. We co-design rooms, story, and outputs. Priced to scope.' },
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
              a Mount Druitt small gathering, an Adelaide launch, and a flexible Australian tour. Every dollar funds infrastructure for community-led justice reform.
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
                <div className="text-3xl font-black text-[#DC2626] mb-2 font-mono">$1.33M</div>
                <div className="text-sm text-gray-400 uppercase tracking-widest mb-3">Per child/year in detention</div>
                <p className="text-gray-300 text-sm">
                  Australia spends $1.33 million per child per year in detention. 84% reoffend within two years.
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
                <div className="text-3xl font-black text-white mb-2 font-mono">95%</div>
                <div className="text-sm text-gray-400 uppercase tracking-widest mb-3">Oonchiumpa outcome</div>
                <p className="text-gray-300 text-sm">
                  95% reduction in anti-social behaviour among young people on Country with
                  Oonchiumpa, Alice Springs / Central Australia. Aboriginal-led cultural healing,
                  decades of practice.
                </p>
                <p className="text-xs text-gray-500 mt-2">Source: Oonchiumpa program evaluation</p>
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
                          stop.status === 'Confirmed' || stop.status === 'Public launch' || stop.status === 'Small gathering'
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
              <div className="text-3xl font-black font-mono mb-2">$500,000</div>
              <div className="text-sm text-gray-400 uppercase tracking-widest mb-4">Full National Tour</div>
              <p className="text-gray-300 max-w-lg mx-auto">
                Fund the Mount Druitt gathering, Adelaide launch, every tour stop, transport, documentation, community engagement,
                partner activation, and the JusticeHub evidence layer that remains after the container moves on.
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
                <p className="text-sm text-gray-600">The touring exhibition that puts decision-makers inside the choice.</p>
              </div>
              <div className="border-2 border-[#0A0A0A] p-6">
                <h3 className="font-black text-lg mb-2">JusticeHub</h3>
                <p className="text-sm text-gray-600">The public evidence layer for youth justice in Australia.</p>
              </div>
              <div className="border-2 border-[#0A0A0A] p-6">
                <h3 className="font-black text-lg mb-2">Australian Living Map of Alternatives</h3>
                <p className="text-sm text-gray-600">The civic intelligence engine that makes the system legible.</p>
              </div>
              <div className="border-2 border-[#0A0A0A] p-6">
                <h3 className="font-black text-lg mb-2">Empathy Ledger</h3>
                <p className="text-sm text-gray-600">The consent layer for community storytelling.</p>
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
