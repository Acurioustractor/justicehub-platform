'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ArrowRight, Heart, Shield, Users, Zap, BarChart3, Scale } from 'lucide-react'

const tiers = [
  {
    key: 'community',
    name: 'Community',
    price: 'Free',
    priceSuffix: 'forever',
    description: 'For ATSILS, grassroots legal orgs, CLCs, and community organisations.',
    features: [
      'Full Call It Out access',
      'Program discovery (Youth Scout, Talent Scout)',
      'Basic analytics',
      'Up to 5 team members',
      'Community support',
    ],
    cta: 'Get Started Free',
    ctaHref: '/login',
    popular: false,
    icon: Heart,
    colour: 'emerald',
  },
  {
    key: 'organisation',
    name: 'Organisation',
    price: '$299',
    priceSuffix: '/month AUD',
    description: 'For mid-size NFPs, advocacy groups, and legal services needing outcome tracking.',
    features: [
      'Everything in Community',
      'Funding Operating System',
      'Outcome tracking & evidence',
      'API access',
      'Up to 25 team members',
      'Priority email support (48h)',
    ],
    cta: 'Start Free Trial',
    popular: true,
    icon: Users,
    colour: 'blue',
  },
  {
    key: 'institution',
    name: 'Institution',
    price: '$2,499',
    priceSuffix: '/month AUD',
    description: 'For universities, Legal Aid commissions, and large charities needing research data.',
    features: [
      'Everything in Organisation',
      'Research datasets',
      'Custom reports',
      'Unlimited team members',
      'SLA (24h response)',
      'Phone + email support',
    ],
    cta: 'Contact Sales',
    popular: false,
    icon: BarChart3,
    colour: 'purple',
  },
  {
    key: 'enterprise',
    name: 'Government',
    price: 'Custom',
    priceSuffix: '',
    description: 'For state/federal government departments needing cross-agency dashboards.',
    features: [
      'Everything in Institution',
      'Cross-agency data integration',
      'Policy modelling tools',
      'Closing the Gap dashboards',
      'Dedicated account manager',
      'Custom SLA (4h response)',
      'White-label option',
    ],
    cta: 'Talk to Us',
    popular: false,
    icon: Scale,
    colour: 'slate',
  },
]

export default function PricingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16 pb-16">
        {/* Hero */}
        <div className="max-w-5xl mx-auto px-4 text-center mb-16">
          <p className="text-primary font-medium mb-3 tracking-wide uppercase text-sm">
            Pricing
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Justice data infrastructure
            <br />
            <span className="text-primary">that pays for itself.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every child diverted from detention saves $1.55 million per year. JusticeHub tracks
            which interventions actually work — so communities get free access, and institutions
            get the evidence they need.
          </p>
        </div>

        {/* Impact stat */}
        <div className="max-w-5xl mx-auto px-4 mb-12">
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-destructive mb-2">21x</p>
            <p className="text-muted-foreground">
              First Nations youth are 21x more likely to be in detention.
              60% of all detained youth are First Nations. Closing the Gap justice targets are going <strong>backwards</strong>.
              This platform exists because the status quo is failing.
            </p>
          </div>
        </div>

        {/* Tier Cards */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => {
              const Icon = tier.icon
              return (
                <div
                  key={tier.key}
                  className={`relative rounded-2xl border p-6 flex flex-col ${
                    tier.popular
                      ? 'border-primary bg-card shadow-lg ring-2 ring-primary/20'
                      : 'border-border bg-card'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                    </div>

                    <div className="mb-3">
                      <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                      {tier.priceSuffix && (
                        <span className="text-muted-foreground text-sm"> {tier.priceSuffix}</span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tier.description}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => {
                      if (tier.key === 'community') {
                        router.push('/login')
                      } else if (tier.key === 'enterprise' || tier.key === 'institution') {
                        window.location.href = 'mailto:benjamin@act.place?subject=JusticeHub ' + tier.name + ' Tier'
                      } else {
                        router.push('/login?tier=' + tier.key)
                      }
                    }}
                    className={`w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                      tier.popular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : tier.key === 'community'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {tier.cta}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {tier.key === 'community' && (
                    <p className="text-center text-xs text-emerald-600 mt-3 font-medium">
                      No credit card required
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ROI Calculator */}
        <div className="max-w-3xl mx-auto px-4 mt-20">
          <div className="bg-muted/50 border border-border rounded-2xl p-8 text-center">
            <BarChart3 className="w-8 h-8 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-4">
              The ROI writes itself
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-6">
              <div className="bg-card rounded-xl p-5 border border-border">
                <p className="text-2xl font-bold text-destructive mb-1">$1.3M</p>
                <p className="text-sm text-muted-foreground">
                  Cost per child per year in detention
                </p>
              </div>
              <div className="bg-card rounded-xl p-5 border border-border">
                <p className="text-2xl font-bold text-emerald-600 mb-1">$100K</p>
                <p className="text-sm text-muted-foreground">
                  Cost per child per year in community supervision
                </p>
              </div>
              <div className="bg-card rounded-xl p-5 border border-border">
                <p className="text-2xl font-bold text-primary mb-1">$1.55M</p>
                <p className="text-sm text-muted-foreground">
                  Saved per child diverted. One child pays for the platform 23x over.
                </p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              JusticeHub doesn't just track data — it identifies which interventions reduce
              reoffending, so every dollar goes further. No Australian platform does this today.
            </p>
          </div>
        </div>

        {/* Cross-subsidy explainer */}
        <div className="max-w-3xl mx-auto px-4 mt-12">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 text-center">
            <Heart className="w-8 h-8 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Community access is non-negotiable
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              ATSILS, community legal centres, and grassroots organisations get full JusticeHub
              access for free — not a limited version. Institutional subscriptions and government
              contracts fund this. The communities most affected by the justice system should never
              be the ones paying for the data about it.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto px-4 mt-16">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Common questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'Who qualifies for the free Community tier?',
                a: 'Aboriginal and Torres Strait Islander Legal Services (ATSILS), Community Legal Centres, grassroots advocacy organisations, and any community organisation working in justice. If you\'re unsure, reach out — we\'ll work it out together.',
              },
              {
                q: 'How is JusticeHub different from existing case management systems?',
                a: 'Existing systems (Civica, NEC, CLASS) manage individual cases within a single agency. JusticeHub tracks intervention effectiveness across agencies — which programs actually reduce reoffending, where the gaps are, and how Closing the Gap targets are tracking. It\'s evidence infrastructure, not case management.',
              },
              {
                q: 'Is data sovereignty maintained?',
                a: 'Yes. Community data is owned by the community. OCAP principles (Ownership, Control, Access, Possession) are built into the platform architecture, not bolted on as an afterthought.',
              },
              {
                q: 'Can government departments use this for Closing the Gap reporting?',
                a: 'Yes — that\'s one of the primary use cases for the Government tier. Automated dashboards tracking justice targets 10 and 11, with real-time data on intervention outcomes.',
              },
              {
                q: 'What happens to my data if I cancel?',
                a: 'Your data belongs to you. Downgrade to Community tier with continued access. Nothing is deleted without explicit consent.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-border pb-5">
                <h3 className="font-semibold text-foreground mb-2">{q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
