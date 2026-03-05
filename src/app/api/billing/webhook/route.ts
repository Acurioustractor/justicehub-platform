import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const organizationId = session.metadata?.organization_id
        const tier = session.metadata?.tier

        if (organizationId && tier) {
          await supabase
            .from('organizations')
            .update({
              plan: tier,
              stripe_customer_id: session.customer as string,
            })
            .eq('id', organizationId)

          console.log(`✅ JusticeHub subscription activated: org=${organizationId} tier=${tier}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const organizationId = subscription.metadata?.organization_id

        if (organizationId) {
          await supabase
            .from('organizations')
            .update({
              plan: subscription.metadata?.tier || undefined,
            })
            .eq('id', organizationId)

          console.log(`🔄 JusticeHub subscription updated: org=${organizationId} status=${subscription.status}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const organizationId = subscription.metadata?.organization_id

        if (organizationId) {
          await supabase
            .from('organizations')
            .update({ plan: 'community' })
            .eq('id', organizationId)

          console.log(`❌ JusticeHub subscription cancelled: org=${organizationId} → community`)
        }
        break
      }

      default:
        console.log(`Unhandled JusticeHub webhook event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('JusticeHub webhook handler error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
