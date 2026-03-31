'use client'

import { useRouter } from 'next/navigation'
import { Check, ArrowRight } from 'lucide-react'
import { Navigation } from '@/components/ui/navigation'

const TIERS = [
  {
    key: 'community',
    name: 'Community',
    price: 'Free',
    priceSuffix: 'forever',
    description: 'For ATSILS, grassroots legal orgs, CLCs, and community organisations',
    features: [
      'Full Call It Out access',
      'Program discovery',
      'Basic analytics',
      'Up to 5 team members',
      'Community support',
    ],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    key: 'organisation',
    name: 'Organisation',
    price: '$299',
    priceSuffix: '/mo',
    description: 'For mid-size NFPs, advocacy groups, and legal services',
    features: [
      'Everything in Community',
      'Funding Operating System',
      'Outcome tracking',
      'API access',
      'Up to 25 team members',
      'Priority email support (48h)',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    key: 'institution',
    name: 'Institution',
    price: '$2,499',
    priceSuffix: '/mo',
    description: 'For universities, Legal Aid commissions, and large charities',
    features: [
      'Everything in Organisation',
      'Research datasets',
      'Custom reports',
      'Unlimited team members',
      'SLA (24h response)',
      'Phone + email support',
    ],
    cta: 'Get Started',
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    priceSuffix: '',
    description: 'For government departments and consultancies',
    features: [
      'Everything in Institution',
      'Cross-agency dashboards',
      'Policy modelling',
      'Dedicated account manager',
      'Custom SLA (4h response)',
      'White-label option',
    ],
    cta: 'Contact Us',
    contact: true,
  },
] as const

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
                disabled={'disabled' in tier && tier.disabled}
                onClick={() => {
                  if ('disabled' in tier && tier.disabled) return
                  if ('contact' in tier && tier.contact) {
                    window.location.href = 'mailto:benjamin@act.place?subject=JusticeHub Enterprise'
                  } else {
                    router.push('/login?tier=' + tier.key)
                  }
                }}
                className="w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                style={{
                  backgroundColor: 'disabled' in tier && tier.disabled
                    ? '#D1CCC4'
                    : tier.popular
                    ? '#DC2626'
                    : '#0A0A0A',
                  color: '#FFFFFF',
                  cursor: 'disabled' in tier && tier.disabled ? 'not-allowed' : 'pointer',
                  opacity: 'disabled' in tier && tier.disabled ? 0.6 : 1,
                }}
              >
                {tier.cta}
                {!('disabled' in tier && tier.disabled) && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
