import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('id')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session ID' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.metadata?.type !== 'donation') {
      return NextResponse.json({ error: 'Invalid session type' }, { status: 400 })
    }

    return NextResponse.json({
      amount_cents: session.amount_total || 0,
      currency: session.currency || 'aud',
    })
  } catch (error) {
    console.error('Campaign session error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve session' },
      { status: 500 }
    )
  }
}
