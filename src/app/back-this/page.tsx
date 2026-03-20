'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';

interface CampaignStats {
  total_raised_cents: number;
  donor_count: number;
  goal_cents: number;
  progress_pct: number;
  recent_donations: {
    amount_cents: number;
    name: string;
    created_at: string;
  }[];
}

const AMOUNTS = [25, 50, 100, 250] as const;
const IMPACT: Record<number, string> = {
  25: '1 week of ALMA intelligence',
  50: 'Connect a program to the evidence network',
  100: '1 month of evidence hosting',
  250: 'Support a basecamp for a week',
};

export default function BackThisPage() {
  const [campaign, setCampaign] = useState<CampaignStats | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/campaign/stats')
      .then((r) => r.json())
      .then(setCampaign)
      .catch(console.error);
  }, []);

  const donationAmount = isCustom ? Number(customAmount) || 0 : selectedAmount;

  const handleDonate = async () => {
    if (donationAmount < 5 || donationAmount > 10000) return;
    setLoading(true);
    try {
      const res = await fetch('/api/campaign/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: donationAmount }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Donation error:', err);
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(cents / 100);

  const impactText = !isCustom ? IMPACT[selectedAmount] : null;

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="pt-40">
        {/* Hero */}
        <section className="py-12 border-b-2 border-[#0A0A0A]">
          <div className="container-justice">
            <div className="inline-block bg-[#0A0A0A] text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
              Fund the Movement
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-4">
              Back This
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
              Every dollar funds infrastructure that makes it impossible to ignore
              what works. Pick your level — from $25 to backing the national tour.
            </p>
          </div>
        </section>

        {/* What You&apos;re Funding */}
        <section className="py-12 bg-[#0A0A0A] text-white border-b-2 border-[#0A0A0A]">
          <div className="container-justice">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 text-white">
              What Your Money Powers
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl">
              876 verified community programs. $72B in funding tracked. 20,000+ organisations
              linked. No marketing decks. No gala dinners.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="border border-gray-700 p-5">
                <div className="text-2xl font-black font-mono text-white mb-1">CONTAINED</div>
                <p className="text-sm text-gray-400">Touring exhibition — 4 cities, 2026</p>
              </div>
              <div className="border border-gray-700 p-5">
                <div className="text-2xl font-black font-mono text-white mb-1">JusticeHub</div>
                <p className="text-sm text-gray-400">Public evidence layer — open access</p>
              </div>
              <div className="border border-gray-700 p-5">
                <div className="text-2xl font-black font-mono text-white mb-1">ALMA</div>
                <p className="text-sm text-gray-400">Evidence intelligence — 13 data tools</p>
              </div>
              <div className="border border-gray-700 p-5">
                <div className="text-2xl font-black font-mono text-white mb-1">Empathy Ledger</div>
                <p className="text-sm text-gray-400">Consent + story layer — 226 storytellers</p>
              </div>
            </div>
          </div>
        </section>

        {/* All Funding Opportunities */}
        <section className="py-12 border-b-2 border-[#0A0A0A]">
          <div className="container-justice">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">
              Choose Your Level
            </h2>

            <div className="space-y-6">
              {/* Tier: Individual */}
              <div className="border-2 border-[#0A0A0A] bg-white">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono mb-1">
                        Individual
                      </div>
                      <h3 className="text-xl font-black">Keep the Lights On</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-mono">$25–$250</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Servers, data pipelines, and the team that maintains them. Direct support
                    for community intelligence infrastructure.
                  </p>
                  <a
                    href="#donate"
                    className="inline-flex items-center gap-2 bg-[#DC2626] text-white px-5 py-2.5 text-sm font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
                  >
                    Donate Now <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Tier: CONTAINED Tour */}
              <div className="border-2 border-[#0A0A0A] bg-white">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono mb-1">
                        CONTAINED Tour
                      </div>
                      <h3 className="text-xl font-black">Fund a City</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-mono">$5K–$200K</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    One shipping container, three rooms, four cities. Fund documentation ($5K),
                    a single stop ($50K), or the full national tour ($200K).
                  </p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {[
                      { city: 'Mt Druitt', cost: '$25K', status: 'Planning' },
                      { city: 'Adelaide', cost: '$50K', status: 'Confirmed' },
                      { city: 'Perth', cost: '$50K', status: 'Exploring' },
                      { city: 'Tennant Creek', cost: '$75K', status: 'Exploring' },
                    ].map((s) => (
                      <span
                        key={s.city}
                        className={`text-xs font-bold uppercase tracking-widest px-2 py-1 ${
                          s.status === 'Confirmed'
                            ? 'bg-[#059669] text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {s.city} {s.cost}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/contained/invest"
                    className="inline-flex items-center gap-2 bg-[#0A0A0A] text-white px-5 py-2.5 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                  >
                    See Tour Investment Details <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Tier: Platform Steward */}
              <div className="border-2 border-[#0A0A0A] bg-white">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono mb-1">
                        Ongoing
                      </div>
                      <h3 className="text-xl font-black">Become a Steward</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-mono">$29/mo+</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Monthly subscription keeps the evidence infrastructure running permanently.
                    Stewards get priority data access, basecamp network membership, and input
                    on research priorities.
                  </p>
                  <Link
                    href="/stewards"
                    className="inline-flex items-center gap-2 border-2 border-[#0A0A0A] px-5 py-2.5 text-sm font-bold uppercase tracking-widest hover:bg-[#0A0A0A] hover:text-white transition-colors"
                  >
                    Steward Plans <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Tier: Foundation / Government */}
              <div className="border-2 border-[#0A0A0A] bg-white">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono mb-1">
                        Foundation / Government
                      </div>
                      <h3 className="text-xl font-black">Platform Investment</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-mono">$100K+</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Fund the development of JusticeHub as permanent national infrastructure.
                    876 verified programs, $72B funding tracked, 20K+ organisations linked.
                    The evidence base Australia needs.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/for-funders"
                      className="inline-flex items-center gap-2 border-2 border-[#0A0A0A] px-5 py-2.5 text-sm font-bold uppercase tracking-widest hover:bg-[#0A0A0A] hover:text-white transition-colors"
                    >
                      Funder Brief <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/contained/invest/one-pager"
                      className="inline-flex items-center gap-2 border-2 border-[#0A0A0A] px-5 py-2.5 text-sm font-bold uppercase tracking-widest hover:bg-[#0A0A0A] hover:text-white transition-colors"
                    >
                      Download One-Pager <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Donate Section */}
        <section id="donate" className="py-16 bg-[#0A0A0A] text-white border-b-2 border-[#0A0A0A]">
          <div className="container-justice max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-white">
              Donate Now
            </h2>
            <p className="text-gray-400 mb-8">
              Direct support for community intelligence infrastructure. Goal: $100,000.
            </p>

            {/* Progress Bar */}
            {campaign && (
              <div className="mb-8">
                <div className="w-full bg-gray-800 h-3 mb-2">
                  <div
                    className="bg-[#059669] h-3 transition-all duration-700"
                    style={{ width: `${campaign.progress_pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500 font-mono">
                  <span>{formatCurrency(campaign.total_raised_cents)} raised</span>
                  <span>{campaign.progress_pct}%</span>
                </div>
              </div>
            )}

            {/* Amount Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setSelectedAmount(amt);
                    setIsCustom(false);
                    setCustomAmount('');
                  }}
                  className={`py-3 px-4 font-bold text-lg transition-all border-2 ${
                    !isCustom && selectedAmount === amt
                      ? 'bg-white text-[#0A0A0A] border-white'
                      : 'bg-transparent text-white border-gray-700 hover:border-white'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="mb-6">
              <input
                type="number"
                placeholder="Custom amount"
                min={5}
                max={10000}
                value={customAmount}
                onFocus={() => setIsCustom(true)}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setIsCustom(true);
                }}
                className="w-full py-3 px-4 bg-transparent text-white text-center text-lg placeholder-gray-500 border-2 border-gray-700 focus:border-white focus:outline-none font-mono"
              />
            </div>

            {/* Impact Text */}
            {impactText && (
              <p className="text-gray-400 mb-6 text-sm font-mono">
                ${selectedAmount} = {impactText}
              </p>
            )}

            {/* Donate CTA */}
            <button
              onClick={handleDonate}
              disabled={loading || donationAmount < 5 || donationAmount > 10000}
              className="w-full bg-[#DC2626] text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto" size={24} />
              ) : (
                `DONATE $${donationAmount}`
              )}
            </button>

            {donationAmount > 0 && (donationAmount < 5 || donationAmount > 10000) && (
              <p className="text-[#DC2626] text-sm mt-2">
                Amount must be between $5 and $10,000
              </p>
            )}
          </div>
        </section>

        {/* Social Proof */}
        {campaign && campaign.donor_count > 0 && (
          <section className="py-12 border-b-2 border-[#0A0A0A]">
            <div className="container-justice max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">
                {campaign.donor_count}{' '}
                {campaign.donor_count === 1 ? 'person has' : 'people have'} backed this
              </h2>
              <div className="space-y-3">
                {campaign.recent_donations.map((d, i) => (
                  <div
                    key={i}
                    className="border-2 border-[#0A0A0A] bg-white px-4 py-3 flex justify-between items-center"
                  >
                    <span className="font-bold">{d.name}</span>
                    <span className="font-black font-mono">{formatCurrency(d.amount_cents)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Contact */}
        <section className="py-12">
          <div className="container-justice text-center max-w-2xl mx-auto">
            <p className="text-sm text-gray-500">
              Questions? ben@justicehub.org.au &middot; All stats sourced from Productivity
              Commission ROGS 2024-25 and verified program evaluations.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
