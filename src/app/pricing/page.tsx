'use client'

import { useRouter } from 'next/navigation'
import { Check, ArrowRight } from 'lucide-react'
import { Navigation } from '@/components/ui/navigation'
import { TIERS as BILLING_TIERS, type TierKey } from '@/lib/billing/tiers'

const TIER_ORDER: TierKey[] = ['community', 'organisation', 'institution', 'enterprise']

function formatTierPrice(price: number | null) {
  if (price === null) return 'Custom'
  if (price === 0) return 'Free'
  return `$${price.toLocaleString('en-AU')}`
}

const TIERS = TIER_ORDER.map((key) => {
  const tier = BILLING_TIERS[key]
  return {
    key,
    name: tier.name,
    price: formatTierPrice(tier.price),
    priceSuffix: tier.price === 0 ? 'forever' : tier.price === null ? '' : '/mo',
    description: tier.description,
    features: [...tier.features],
    cta: key === 'community' ? 'Current Plan' : key === 'enterprise' ? 'Contact Us' : 'Get Started',
    disabled: key === 'community',
    popular: key === 'organisation',
    contact: key === 'enterprise',
  }
})

export default function PricingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      <Navigation />

      <main className="pt-24 pb-20 px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A0A0A' }}
          >
            Simple, transparent pricing
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#0A0A0A', opacity: 0.7 }}>
            Community organisations get full access for free.
            Institutional subscriptions fund the platform for everyone.
          </p>
        </div>

        {/* Tier grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.key}
              className="relative rounded-2xl p-6 flex flex-col"
              style={{
                backgroundColor: '#FFFFFF',
                border: tier.popular ? '2px solid #DC2626' : '1px solid #D1CCC4',
                boxShadow: tier.popular ? '0 8px 30px rgba(220, 38, 38, 0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: '#DC2626' }}
                  >
                    Most Popular
                  </span>
                </div>
              )}

              {/* Tier name */}
              <h3
                className="text-lg font-semibold mb-3"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A0A0A' }}
              >
                {tier.name}
              </h3>

              {/* Price */}
              <div className="mb-3">
                <span
                  className="text-3xl font-bold"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A0A0A' }}
                >
                  {tier.price}
                </span>
                {tier.priceSuffix && (
                  <span className="text-sm ml-1" style={{ color: '#0A0A0A', opacity: 0.5 }}>
                    {tier.priceSuffix}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm mb-6" style={{ color: '#0A0A0A', opacity: 0.6 }}>
                {tier.description}
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#059669' }} />
                    <span className="text-sm" style={{ color: '#0A0A0A' }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                disabled={tier.disabled}
                onClick={() => {
                  if (tier.disabled) return
                  if (tier.contact) {
                    window.location.href = 'mailto:benjamin@act.place?subject=JusticeHub Enterprise'
                  } else {
                    router.push('/login?tier=' + tier.key)
                  }
                }}
                className="w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                style={{
                  backgroundColor: tier.disabled
                    ? '#D1CCC4'
                    : tier.popular
                    ? '#DC2626'
                    : '#0A0A0A',
                  color: '#FFFFFF',
                  cursor: tier.disabled ? 'not-allowed' : 'pointer',
                  opacity: tier.disabled ? 0.6 : 1,
                }}
              >
                {tier.cta}
                {!tier.disabled && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
