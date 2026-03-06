import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, campaignId } = body as { amount: number; campaignId?: string }

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
    }

    if (amount < 5 || amount > 10000) {
      return NextResponse.json({ error: 'Amount must be between $5 and $10,000' }, { status: 400 })
    }

    const amountCents = Math.round(amount * 100)
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3004'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      submit_type: 'donate',
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: 'JusticeHub Campaign Donation',
              description: 'Supporting community intelligence infrastructure',
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/back-this/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/back-this`,
      metadata: {
        type: 'donation',
        campaign_id: campaignId || 'launch-2026',
        platform: 'justicehub',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Campaign donate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
