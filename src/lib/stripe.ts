import Stripe from 'stripe'
export { TIERS, type TierKey } from '@/lib/billing/tiers'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable')
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey)
  }

  return stripeInstance
}

// Lazy proxy. Next.js page-data collection introspects route module exports
// during build (Object.keys, Symbol.toPrimitive checks, etc.), and an eager
// `get` trap calls getStripe() — which throws when STRIPE_SECRET_KEY is not
// set in the build environment, taking the whole build down. Only forward
// real API methods; everything else (introspection / Symbol probes) returns
// undefined harmlessly.
export const stripe = new Proxy({} as Stripe, {
  get(_target, property) {
    if (typeof property !== 'string') return undefined
    if (property === 'then') return undefined // not a thenable
    return getStripe()[property as keyof Stripe]
  },
})
