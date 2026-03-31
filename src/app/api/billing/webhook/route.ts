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

        if (session.metadata?.type === 'donation') {
          await supabase.from('campaign_donations').insert({
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            amount_cents: session.amount_total || 0,
            currency: session.currency || 'aud',
            donor_email: session.customer_details?.email || null,
            donor_name: session.customer_details?.name || null,
            campaign_id: session.metadata.campaign_id || 'launch-2026',
          })
          console.log(`JusticeHub donation received: $${((session.amount_total || 0) / 100).toFixed(2)}`)
        } else if (organizationId && tier) {
          await supabase
            .from('organizations')
            .update({
              plan: tier,
              billing_status: 'active',
              stripe_customer_id: session.customer as string,
              trial_ends_at: null, // Clear trial on successful subscription
            })
            .eq('id', organizationId)

          console.log(`JusticeHub subscription activated: org=${organizationId} tier=${tier}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const organizationId = subscription.metadata?.organization_id

        if (organizationId) {
          // Map Stripe subscription status to billing_status
          const statusMap: Record<string, string> = {
            active: 'active',
            trialing: 'trialing',
            past_due: 'past_due',
            canceled: 'canceled',
            unpaid: 'past_due',
            incomplete: 'none',
            incomplete_expired: 'expired',
            paused: 'canceled',
          }

          const billingStatus = statusMap[subscription.status] || 'none'

          await supabase
            .from('organizations')
            .update({
              plan: subscription.metadata?.tier || undefined,
              billing_status: billingStatus,
            })
            .eq('id', organizationId)

          console.log(`JusticeHub subscription updated: org=${organizationId} status=${subscription.status} billing=${billingStatus}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const organizationId = subscription.metadata?.organization_id

        if (organizationId) {
          await supabase
            .from('organizations')
            .update({
              plan: 'community',
              billing_status: 'canceled',
            })
            .eq('id', organizationId)

          console.log(`JusticeHub subscription cancelled: org=${organizationId} -> community`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id

        if (subscriptionId) {
          // Look up the subscription to get the org ID
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const organizationId = subscription.metadata?.organization_id

          if (organizationId) {
            await supabase
              .from('organizations')
              .update({ billing_status: 'past_due' })
              .eq('id', organizationId)

            console.log(`JusticeHub payment failed: org=${organizationId}`)
          }
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const organizationId = subscription.metadata?.organization_id

          if (organizationId) {
            await supabase
              .from('organizations')
              .update({ billing_status: 'active' })
              .eq('id', organizationId)

            console.log(`JusticeHub invoice paid: org=${organizationId}`)
          }
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`JusticeHub checkout expired: session=${session.id} org=${session.metadata?.organization_id || 'unknown'}`)
        break
      }

      case 'customer.subscription.trial_will_end': {
        // Stripe sends this 3 days before trial ends — log for now
        const subscription = event.data.object as Stripe.Subscription
        const organizationId = subscription.metadata?.organization_id
        console.log(`JusticeHub trial ending soon: org=${organizationId} ends=${subscription.trial_end}`)
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
