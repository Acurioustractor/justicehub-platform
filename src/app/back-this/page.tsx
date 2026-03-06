'use client'

import { useState, useEffect } from 'react'
import { Navigation, Footer } from '@/components/ui/navigation'
import { Loader2 } from 'lucide-react'

interface CampaignStats {
  total_raised_cents: number
  donor_count: number
  goal_cents: number
  progress_pct: number
  recent_donations: {
    amount_cents: number
    name: string
    created_at: string
  }[]
}

interface HomepageStats {
  programs_documented: number
  total_services: number
  outcomes_rate: number
}

const AMOUNTS = [25, 50, 100, 250] as const
const IMPACT: Record<number, string> = {
  25: '1 week of ALMA intelligence',
  50: 'Connect a program to the evidence network',
  100: '1 month of service directory hosting',
  250: 'Support a basecamp for a week',
}

export default function BackThisPage() {
  const [campaign, setCampaign] = useState<CampaignStats | null>(null)
  const [liveStats, setLiveStats] = useState<HomepageStats | null>(null)
  const [selectedAmount, setSelectedAmount] = useState<number>(50)
  const [customAmount, setCustomAmount] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/campaign/stats')
      .then((r) => r.json())
      .then(setCampaign)
      .catch(console.error)

    fetch('/api/homepage-stats')
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setLiveStats(data.stats)
      })
      .catch(console.error)
  }, [])

  const donationAmount = isCustom ? Number(customAmount) || 0 : selectedAmount

  const handleDonate = async () => {
    if (donationAmount < 5 || donationAmount > 10000) return
    setLoading(true)
    try {
      const res = await fetch('/api/campaign/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: donationAmount }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Donation error:', err)
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(cents / 100)
  }

  const impactText = !isCustom ? IMPACT[selectedAmount] : null

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      {/* Hero */}
      <section className="bg-black text-white min-h-[80vh] flex items-center">
        <div className="container-justice section-padding text-center">
          <p className="hero-stat">$1.1M</p>
          <p className="headline-truth max-w-3xl mx-auto mt-6">
            That&apos;s what Australia spends to lock up one child for one year.
            Community programs cost $58,000 and actually work.
          </p>
          <a
            href="#donate"
            className="cta-primary inline-block mt-10"
          >
            BACK THIS
          </a>
        </div>
      </section>

      {/* What JusticeHub Does */}
      <section className="section-padding bg-white">
        <div className="container-justice">
          <h2 className="headline-truth text-center mb-12">
            What your money powers
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="data-card">
              <p className="text-4xl font-black mb-2">
                {liveStats?.programs_documented ?? '624'}
              </p>
              <p className="text-lg font-semibold">Programs Mapped</p>
              <p className="text-gray-600 mt-2">
                Community-led interventions documented with evidence and outcomes.
              </p>
            </div>
            <div className="data-card">
              <p className="text-4xl font-black mb-2">
                {liveStats?.total_services ?? '150'}+
              </p>
              <p className="text-lg font-semibold">Services Listed</p>
              <p className="text-gray-600 mt-2">
                Support services searchable by location, type, and need.
              </p>
            </div>
            <div className="data-card">
              <p className="text-4xl font-black mb-2">
                {liveStats?.outcomes_rate ?? '67'}%
              </p>
              <p className="text-lg font-semibold">With Documented Outcomes</p>
              <p className="text-gray-600 mt-2">
                Programs with evidence of what works, not just what sounds good.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Where Your Money Goes */}
      <section className="section-padding bg-gray-50">
        <div className="container-justice">
          <h2 className="headline-truth text-center mb-12">
            Where your money goes
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Servers, data pipelines, and the team that maintains them. No marketing
            decks. No gala dinners.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: '🧠',
                title: 'ALMA Intelligence',
                desc: 'AI evidence engine that connects programs to outcomes data.',
                metric: '624 programs analysed',
              },
              {
                icon: '📍',
                title: 'Service Directory',
                desc: 'Searchable database of youth support services across Australia.',
                metric: '7 states covered',
              },
              {
                icon: '📊',
                title: 'Transparency Tracking',
                desc: 'Public accountability for where money flows in youth justice.',
                metric: 'Every dollar visible',
              },
              {
                icon: '🏕️',
                title: 'Basecamp Network',
                desc: 'Community hubs connecting practitioners with evidence and each other.',
                metric: '4 founding basecamps',
              },
            ].map((item) => (
              <div key={item.title} className="data-card flex gap-4">
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-gray-600 mt-1">{item.desc}</p>
                  <p className="text-sm font-semibold mt-2 text-black">{item.metric}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Ask — Donation Section */}
      <section id="donate" className="section-padding bg-black text-white">
        <div className="container-justice max-w-2xl mx-auto text-center">
          <h2 className="headline-truth mb-4">
            A year of community intelligence infrastructure
          </h2>
          <p className="text-gray-400 mb-8">Goal: $100,000</p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-4 mb-2">
            <div
              className="bg-white h-4 rounded-full transition-all duration-700"
              style={{ width: `${campaign?.progress_pct ?? 0}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-400 mb-10">
            <span>
              {campaign ? formatCurrency(campaign.total_raised_cents) : '$0'} raised
            </span>
            <span>{campaign?.progress_pct ?? 0}%</span>
          </div>

          {/* Amount Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  setSelectedAmount(amt)
                  setIsCustom(false)
                  setCustomAmount('')
                }}
                className={`py-3 px-4 rounded-lg font-bold text-lg transition-all ${
                  !isCustom && selectedAmount === amt
                    ? 'bg-white text-black'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
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
                setCustomAmount(e.target.value)
                setIsCustom(true)
              }}
              className="w-full py-3 px-4 rounded-lg bg-gray-800 text-white text-center text-lg placeholder-gray-500 border border-gray-700 focus:border-white focus:outline-none"
            />
          </div>

          {/* Impact Text */}
          {impactText && (
            <p className="text-gray-400 mb-6 text-sm">
              Your ${selectedAmount} = {impactText}
            </p>
          )}

          {/* Donate CTA */}
          <button
            onClick={handleDonate}
            disabled={loading || donationAmount < 5 || donationAmount > 10000}
            className="cta-primary w-full text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin mx-auto" size={24} />
            ) : (
              `DONATE $${donationAmount}`
            )}
          </button>

          {donationAmount > 0 && (donationAmount < 5 || donationAmount > 10000) && (
            <p className="text-red-400 text-sm mt-2">
              Amount must be between $5 and $10,000
            </p>
          )}
        </div>
      </section>

      {/* Social Proof */}
      {campaign && campaign.donor_count > 0 && (
        <section className="section-padding bg-white">
          <div className="container-justice max-w-2xl mx-auto text-center">
            <h2 className="headline-truth mb-8">
              {campaign.donor_count} {campaign.donor_count === 1 ? 'person has' : 'people have'} backed this infrastructure
            </h2>
            <div className="space-y-3">
              {campaign.recent_donations.map((d, i) => (
                <div
                  key={i}
                  className="data-card flex justify-between items-center"
                >
                  <span className="font-medium">{d.name}</span>
                  <span className="font-bold">{formatCurrency(d.amount_cents)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final Truth */}
      <section className="section-padding bg-black text-white">
        <div className="container-justice max-w-3xl mx-auto text-center">
          <p className="headline-truth mb-6">
            We&apos;re not a charity. We&apos;re infrastructure for revolution.
          </p>
          <p className="text-gray-400 text-lg">
            Your money doesn&apos;t go to marketing decks or gala dinners. It keeps
            the lights on for communities already doing the work.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
