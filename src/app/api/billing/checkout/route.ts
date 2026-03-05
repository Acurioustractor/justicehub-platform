import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { stripe, TIERS, type TierKey } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    // Auth check via cookie-based session
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, tier } = body as { organizationId: string; tier: TierKey }

    if (!organizationId || !tier) {
      return NextResponse.json({ error: 'Missing organizationId or tier' }, { status: 400 })
    }

    if (tier === 'community') {
      return NextResponse.json({ error: 'Community tier is free' }, { status: 400 })
    }

    if (tier === 'enterprise') {
      return NextResponse.json({ error: 'Enterprise tier requires contacting sales' }, { status: 400 })
    }

    const tierConfig = TIERS[tier]
    if (!tierConfig.stripePriceId) {
      return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 })
    }

    const supabase = createServiceClient()

    // Verify user is admin of this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .in('role', ['admin', 'owner'])
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'You must be an org admin to manage billing' }, { status: 403 })
    }

    // Get or create Stripe customer
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, stripe_customer_id')
      .eq('id', organizationId)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    let stripeCustomerId = org.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: org.name,
        email: user.email || undefined,
        metadata: {
          organization_id: organizationId,
          platform: 'justicehub',
        },
      })
      stripeCustomerId = customer.id

      await supabase
        .from('organizations')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', organizationId)
    }

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3004'
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: tierConfig.stripePriceId, quantity: 1 }],
      success_url: `${appUrl}/portal/${organizationId}?billing=success`,
      cancel_url: `${appUrl}/portal/${organizationId}?billing=cancelled`,
      metadata: {
        organization_id: organizationId,
        tier,
        platform: 'justicehub',
      },
      subscription_data: {
        metadata: {
          organization_id: organizationId,
          tier,
          platform: 'justicehub',
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Billing checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
