import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Tier configuration — single source of truth
export const TIERS = {
  community: {
    name: 'Community',
    description: 'For ATSILS, grassroots legal orgs, CLCs, and community organisations',
    price: 0,
    stripePriceId: null,
    features: [
      'Full Call It Out access',
      'Program discovery',
      'Basic analytics',
      'Up to 5 team members',
      'Community support',
    ],
  },
  organisation: {
    name: 'Organisation',
    description: 'For mid-size NFPs, advocacy groups, and legal services',
    price: 299,
    stripePriceId: process.env.STRIPE_PRICE_ORGANISATION,
    features: [
      'Everything in Community',
      'Funding Operating System',
      'Outcome tracking',
      'API access',
      'Up to 25 team members',
      'Priority email support (48h)',
    ],
  },
  institution: {
    name: 'Institution',
    description: 'For universities, Legal Aid commissions, and large charities',
    price: 2499,
    stripePriceId: process.env.STRIPE_PRICE_INSTITUTION,
    features: [
      'Everything in Organisation',
      'Research datasets',
      'Custom reports',
      'Unlimited team members',
      'SLA (24h response)',
      'Phone + email support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    description: 'For government departments and consultancies',
    price: null,
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE,
    features: [
      'Everything in Institution',
      'Cross-agency dashboards',
      'Policy modelling',
      'Dedicated account manager',
      'Custom SLA (4h response)',
      'White-label option',
    ],
  },
} as const

export type TierKey = keyof typeof TIERS
