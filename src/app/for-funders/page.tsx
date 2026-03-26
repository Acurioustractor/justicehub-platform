'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  TrendingUp, Shield, Users, BarChart3, DollarSign,
  ArrowRight, CheckCircle, AlertTriangle, MapPin, ExternalLink,
  Play, Target, Scale, Loader2
} from 'lucide-react';

interface Basecamp {
  slug: string;
  name: string;
  region: string;
  description: string;
  stats: { label: string; value: string }[];
}

const FALLBACK_BASECAMPS: Basecamp[] = [
  { slug: 'palm-island-community-company', name: 'Palm Island Community Company', region: 'Palm Island, QLD', description: '21 verified programs. $44M funding tracked. Zero philanthropic support. The biggest opportunity in Australian youth justice.', stats: [{ label: 'Programs', value: '21' }] },
  { slug: 'mounty-yarns', name: 'Mounty Yarns', region: 'Mount Druitt, NSW', description: 'Youth-led storytelling. 100K+ documentary views. 1→20 staff. Funded by both Dusseldorp and PRF — proof that dual-funder support works.', stats: [{ label: 'Programs', value: '7' }] },
  { slug: 'oonchiumpa', name: 'Oonchiumpa', region: 'Alice Springs, NT', description: '4 programs keeping young people on Country — right next to the detention centre spending $3,452/day per child.', stats: [{ label: 'Programs', value: '4' }] },
];

export default function ForFundersPage() {
  const [basecamps, setBasecamps] = useState<Basecamp[]>(FALLBACK_BASECAMPS);
  const [basecampsLoading, setBasecampsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/basecamps')
      .then(res => res.json())
      .then((data: Basecamp[]) => {
        if (Array.isArray(data) && data.length > 0) setBasecamps(data);
      })
      .catch(console.error)
      .finally(() => setBasecampsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="pt-40">
        {/* Hero */}
        <section className="py-16 md:py-24">
          <div className="container-justice">
            <div className="max-w-4xl">
              <div className="inline-block bg-[#0A0A0A] text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
                For Funders
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6">
                THE EVIDENCE<br />EXISTS. THE GAP<br />IS VISIBLE.
              </h1>

              <p className="text-xl md:text-2xl text-gray-700 mb-4 leading-relaxed max-w-2xl">
                649 Indigenous organisations deliver 1,076 verified alternatives to detention.
                Most have <span className="font-bold text-[#0A0A0A]">zero philanthropic support</span>.
                JusticeHub makes the case — with data, not pitch decks.
              </p>

              <p className="text-gray-500 mb-8 max-w-2xl">
                $111.7B in funding tracked. 22,236 organisations mapped. Community-verified evidence
                that shows what works, what doesn&apos;t, and where your money has the most impact.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/viz/ecosystem-map.html"
                  target="_blank"
                  className="bg-[#0A0A0A] text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors text-center flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" /> See the Story
                </Link>
                <Link
                  href="#funder-reports"
                  className="border-2 border-[#0A0A0A] px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors text-center"
                >
                  Your Custom Report
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The Numbers */}
        <section className="py-12 bg-[#0A0A0A] text-white">
          <div className="container-justice">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-[#DC2626]">$1.55M</div>
                <div className="text-sm text-gray-400 mt-1">Cost per child in detention / year</div>
                <div className="text-xs text-gray-500 mt-0.5">84% reoffend</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-[#059669]">~$50K</div>
                <div className="text-sm text-gray-400 mt-1">Community program / participant / year</div>
                <div className="text-xs text-gray-500 mt-0.5">85% don&apos;t reoffend</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-white">&lt;1%</div>
                <div className="text-sm text-gray-400 mt-1">Philanthropic funding reaching ACCOs</div>
                <div className="text-xs text-gray-500 mt-0.5">Sector average</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-[#059669]">1,076</div>
                <div className="text-sm text-gray-400 mt-1">Verified community alternatives</div>
                <div className="text-xs text-gray-500 mt-0.5">Mapped by ALMA Network</div>
              </div>
            </div>
          </div>
        </section>

        {/* Due Diligence Tools */}
        <section className="py-16 border-b-2 border-[#0A0A0A]">
          <div className="container-justice">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#059669] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Due Diligence
            </p>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Verify Every Claim
            </h2>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl">
              No pitch decks. No gatekeeping. Open evidence tools your board can interrogate directly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/for-funders/evidence-gaps" className="bg-white border-2 border-[#0A0A0A] p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group">
                <BarChart3 className="w-7 h-7 text-[#059669] mb-3" />
                <h3 className="font-bold text-lg mb-1">Evidence Gap Matrix</h3>
                <p className="text-sm text-gray-600 mb-3">3ie-style grid — where evidence is strong, where the gaps are, where funding moves the needle.</p>
                <span className="text-sm font-bold text-[#059669] flex items-center gap-1 group-hover:underline">
                  Explore gaps <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              <Link href="/for-funders/compare" className="bg-white border-2 border-[#0A0A0A] p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group">
                <Scale className="w-7 h-7 text-[#0A0A0A] mb-3" />
                <h3 className="font-bold text-lg mb-1">Funder Comparison</h3>
                <p className="text-sm text-gray-600 mb-3">Side-by-side portfolios. ACCO allocation ratios. Where funders overlap, where gaps exist.</p>
                <span className="text-sm font-bold text-[#0A0A0A] flex items-center gap-1 group-hover:underline">
                  Compare portfolios <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              <Link href="/for-funders/calculator" className="bg-white border-2 border-[#0A0A0A] p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group">
                <DollarSign className="w-7 h-7 text-[#DC2626] mb-3" />
                <h3 className="font-bold text-lg mb-1">&ldquo;$1M Buys&rdquo; Calculator</h3>
                <p className="text-sm text-gray-600 mb-3">Enter any amount. See young people supported, diversions, basecamps activated, ROI.</p>
                <span className="text-sm font-bold text-[#DC2626] flex items-center gap-1 group-hover:underline">
                  Calculate impact <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              <Link href="/for-funders/report" className="bg-white border-2 border-[#0A0A0A] p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group">
                <Shield className="w-7 h-7 text-purple-600 mb-3" />
                <h3 className="font-bold text-lg mb-1">Foundation Report</h3>
                <p className="text-sm text-gray-600 mb-3">Full evidence report with crisis data, top programs, funding flows, and investment thesis.</p>
                <span className="text-sm font-bold text-purple-600 flex items-center gap-1 group-hover:underline">
                  Read report <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Funder-Specific Reports */}
        <section id="funder-reports" className="py-16 bg-[#0A0A0A] text-white">
          <div className="container-justice">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#059669] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Custom Intelligence
            </p>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-white">
              Your Portfolio, Your Report
            </h2>
            <p className="text-white/60 mb-10 max-w-2xl">
              Each report shows your current portfolio, ACCO allocation ratio, the gap between
              what you fund and what the evidence says works, and a specific ask tailored to your strategy.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/for-funders/report/dusseldorp" className="bg-white/5 border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-colors group">
                <h3 className="text-xl font-bold text-white mb-2">Dusseldorp Forum</h3>
                <div className="text-3xl font-black text-[#059669] mb-3">30x</div>
                <p className="text-sm text-white/50 mb-1">ACCO allocation vs sector average</p>
                <p className="text-sm text-white/40 mb-4">You already lead. Here&apos;s how to make it visible nationally.</p>
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Ask</span>
                    <span className="text-white font-bold">$40–80K / 6 months</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Focus</span>
                    <span className="text-white">2 basecamp coordinators</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#059669] flex items-center gap-1 mt-4 group-hover:underline">
                  View your report <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              <Link href="/for-funders/report/prf" className="bg-white/5 border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-colors group">
                <h3 className="text-xl font-bold text-white mb-2">Paul Ramsay Foundation</h3>
                <div className="text-3xl font-black text-amber-400 mb-3">61/22/17</div>
                <p className="text-sm text-white/50 mb-1">Universities / intermediaries / ACCOs</p>
                <p className="text-sm text-white/40 mb-4">The split your CEO acknowledged. The data that shows the path forward.</p>
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Ask</span>
                    <span className="text-white font-bold">$100–200K / 12 months</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Focus</span>
                    <span className="text-white">Palm Island basecamp</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-amber-400 flex items-center gap-1 mt-4 group-hover:underline">
                  View your report <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              <Link href="/for-funders/report/minderoo" className="bg-white/5 border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-colors group">
                <h3 className="text-xl font-bold text-white mb-2">Minderoo Foundation</h3>
                <div className="text-3xl font-black text-blue-400 mb-3">649</div>
                <p className="text-sm text-white/50 mb-1">Indigenous orgs with zero shared infrastructure</p>
                <p className="text-sm text-white/40 mb-4">National platform infrastructure. What the ABS is to demographics, JusticeHub is to justice.</p>
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Ask</span>
                    <span className="text-white font-bold">$150–300K / 12 months</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Focus</span>
                    <span className="text-white">National evidence platform</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-blue-400 flex items-center gap-1 mt-4 group-hover:underline">
                  View your report <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* The Basecamp Pilot */}
        <section className="py-16 border-b-2 border-[#0A0A0A]">
          <div className="container-justice">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600 mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              The Proposal
            </p>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Basecamp Pilot
            </h2>
            <p className="text-lg text-gray-600 mb-4 max-w-2xl">
              Community orgs won&apos;t self-serve. Each basecamp needs a human connector — a fractional
              coordinator who builds profiles, verifies evidence, and connects community programs to
              funder intelligence.
            </p>
            <p className="text-sm text-gray-500 mb-10 max-w-2xl">
              3 basecamps. 3 coordinators (0.5 FTE, community sector rates). 6–12 months.
              The tech is built. The data is here. The missing piece is people.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {(basecampsLoading ? FALLBACK_BASECAMPS : basecamps.slice(0, 3)).map((bc) => (
                <Link
                  key={bc.slug}
                  href={`/for-funders/org/${bc.slug}`}
                  className="bg-white border-2 border-[#0A0A0A] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{bc.region}</span>
                    </div>
                    <h3 className="font-bold text-xl mb-2">{bc.name}</h3>
                    {bc.stats?.[0] && (
                      <div className="text-2xl font-black text-[#059669] mb-3">
                        {bc.stats[0].value} {bc.stats[0].label.toLowerCase()}
                      </div>
                    )}
                    <p className="text-gray-600 text-sm line-clamp-3">{bc.description}</p>
                    <span className="inline-flex items-center gap-1 mt-4 text-sm font-bold text-[#059669] group-hover:underline">
                      Funder profile <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 p-8">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                What a Basecamp Coordinator Does
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Builds JusticeHub evidence profiles for every community org in the region',
                  'Connects programs to Empathy Ledger storytelling (real photos, real voices)',
                  'Verifies outcomes with elders and community leaders',
                  'Links community programs to CONTAINED campaign stops',
                  'Produces quarterly funder impact reports with verified data',
                  'Creates the connective tissue between community and funders',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-purple-200 text-sm text-gray-500">
                <strong>Cost:</strong> ~$45K/year per coordinator (0.5 FTE, community sector rates) &middot;
                <strong> Overhead:</strong> 30% (our policy — never lowball)
              </div>
            </div>
          </div>
        </section>

        {/* The Storytelling Viz */}
        <section className="py-16 bg-[#0A0A0A] text-white">
          <div className="container-justice">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#059669] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Interactive Experience
                </p>
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-white">
                  The Real Picture
                </h2>
                <p className="text-white/60 mb-6">
                  7 guided stories on a dark map of Australia. Detention centres glowing red.
                  Community programs in green. The funding flows that connect — and disconnect — them.
                  CivicScope ministerial statements showing what government says vs what they fund.
                </p>
                <Link
                  href="/viz/ecosystem-map.html"
                  target="_blank"
                  className="inline-flex items-center gap-2 bg-white text-[#0A0A0A] px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  <Play className="w-4 h-4" /> Launch the Map
                </Link>
              </div>
              <div className="w-full md:w-80 h-48 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🗺️</div>
                  <p className="text-sm text-white/40">7 stories &middot; Leaflet &middot; Dark tiles</p>
                  <p className="text-xs text-white/20 mt-1">Explore mode + CivicScope feed</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Proof Points */}
        <section className="py-16 border-b-2 border-[#0A0A0A]">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-10">
              Proof It Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 border-2 border-[#0A0A0A]">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Groote Eylandt, NT</span>
                </div>
                <h3 className="font-bold text-xl mb-1">Anindilyakwa Justice Program</h3>
                <div className="text-3xl font-black text-[#059669] mb-3">95% crime reduction</div>
                <p className="text-gray-700 text-sm">
                  Community-controlled justice on Groote Eylandt. Not through policing —
                  through cultural authority, elder-led night patrols, and community-designed diversions.
                </p>
              </div>

              <div className="bg-white p-8 border-2 border-[#0A0A0A]">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Armidale, NSW</span>
                </div>
                <h3 className="font-bold text-xl mb-1">BackTrack</h3>
                <div className="text-3xl font-black text-[#059669] mb-3">87% success rate</div>
                <p className="text-gray-700 text-sm">
                  Highest-risk young people. Skills, mentoring, dog training.
                  87% don&apos;t reoffend. ~$50K/year per participant vs $1.55M in detention.
                </p>
              </div>

              <div className="bg-white p-8 border-2 border-[#0A0A0A]">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Palm Island, QLD</span>
                </div>
                <h3 className="font-bold text-xl mb-1">PICC</h3>
                <div className="text-3xl font-black text-[#059669] mb-3">21 verified programs</div>
                <p className="text-gray-700 text-sm">
                  Strongest evidence base of any community in Australia. $44M funding ecosystem.
                  200 staff. Zero philanthropic support from major foundations.
                </p>
              </div>

              <div className="bg-white p-8 border-2 border-[#0A0A0A]">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Mount Druitt, NSW</span>
                </div>
                <h3 className="font-bold text-xl mb-1">Mounty Yarns</h3>
                <div className="text-3xl font-black text-[#059669] mb-3">100K+ documentary reach</div>
                <p className="text-gray-700 text-sm">
                  Youth-led. 1 person to 20. Funded by both Dusseldorp and PRF.
                  The proof that dual-funder support transforms community orgs.
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/for-funders/evidence-gaps" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:underline">
                See all 1,076 programs in the evidence gap matrix <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-[#0A0A0A] text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6 text-white">
              The Data Is Clear.<br />The Gap Is Visible.
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Three basecamps. One platform. Community coordinators connecting
              evidence to funding. The infrastructure is built — we need partners
              to put people on the ground.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/viz/ecosystem-map.html"
                target="_blank"
                className="bg-white text-[#0A0A0A] px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" /> See the Story
              </Link>
              <Link
                href="/for-funders/calculator"
                className="border-2 border-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-white hover:text-[#0A0A0A] transition-colors"
              >
                Impact Calculator
              </Link>
            </div>

            <p className="text-sm text-gray-500">
              ben@justicehub.org.au &middot; All data open for due diligence
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
