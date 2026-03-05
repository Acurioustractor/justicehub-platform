#!/usr/bin/env node
/**
 * Setup Stripe products and prices for JusticeHub tiers.
 * Run once per environment (test/live).
 *
 * Usage: node scripts/setup-stripe-products.mjs
 */

import Stripe from 'stripe'
import { config } from 'dotenv'

config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function setup() {
  console.log('🏗️  Setting up Stripe products for JusticeHub...\n')
  console.log(`Using Stripe key: ${process.env.STRIPE_SECRET_KEY?.slice(0, 12)}...`)
  console.log('')

  // Create the product
  const product = await stripe.products.create({
    name: 'JusticeHub',
    description: 'Community-led justice data platform — intervention tracking, evidence aggregation, and impact measurement',
    metadata: {
      platform: 'justicehub',
      entity: 'ACT Ventures Pty Ltd',
    },
  })
  console.log(`✅ Product created: ${product.id}`)

  // Organisation tier — NFPs, advocacy orgs, community legal centres
  const orgPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 29900, // $299.00 AUD
    currency: 'aud',
    recurring: { interval: 'month' },
    metadata: { tier: 'organisation' },
    lookup_key: 'jh_organisation_monthly',
  })
  console.log(`✅ Organisation tier: ${orgPrice.id} ($299/mo AUD)`)

  // Institution tier — universities, Legal Aid, large charities
  const instPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 249900, // $2,499.00 AUD
    currency: 'aud',
    recurring: { interval: 'month' },
    metadata: { tier: 'institution' },
    lookup_key: 'jh_institution_monthly',
  })
  console.log(`✅ Institution tier: ${instPrice.id} ($2,499/mo AUD)`)

  // Enterprise tier — government departments, consultancies
  const entPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 799900, // $7,999.00 AUD
    currency: 'aud',
    recurring: { interval: 'month' },
    metadata: { tier: 'enterprise' },
    lookup_key: 'jh_enterprise_monthly',
  })
  console.log(`✅ Enterprise tier: ${entPrice.id} ($7,999/mo AUD)`)

  console.log('\n📋 Add these to your .env.local:\n')
  console.log(`STRIPE_PRICE_ORGANISATION=${orgPrice.id}`)
  console.log(`STRIPE_PRICE_INSTITUTION=${instPrice.id}`)
  console.log(`STRIPE_PRICE_ENTERPRISE=${entPrice.id}`)

  console.log('\n✅ Done! Stripe products and prices created.')
  console.log('\nNext steps:')
  console.log('1. Add price IDs to .env.local')
  console.log('2. Set up webhook endpoint in Stripe Dashboard')
  console.log('3. Add STRIPE_WEBHOOK_SECRET to .env.local')
}

setup().catch(console.error)
