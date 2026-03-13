import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-lite'

export const dynamic = 'force-dynamic'
export const revalidate = 60

const GOAL_CENTS = 10000000 // $100,000

export async function GET() {
  const supabase = createServiceClient()

  try {
    const { data: donations, error } = await supabase
      .from('campaign_donations')
      .select('amount_cents, donor_name, is_anonymous, created_at')
      .eq('campaign_id', 'launch-2026')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (error) throw error

    const totalRaisedCents = (donations || []).reduce((sum, d) => sum + d.amount_cents, 0)
    const donorCount = donations?.length || 0

    const recentDonations = (donations || []).slice(0, 10).map((d) => ({
      amount_cents: d.amount_cents,
      name: d.is_anonymous ? 'Anonymous' : (d.donor_name || 'A supporter'),
      created_at: d.created_at,
    }))

    return NextResponse.json({
      total_raised_cents: totalRaisedCents,
      donor_count: donorCount,
      goal_cents: GOAL_CENTS,
      progress_pct: Math.min(100, Math.round((totalRaisedCents / GOAL_CENTS) * 100)),
      recent_donations: recentDonations,
    })
  } catch (error) {
    console.error('Campaign stats error:', error)
    return NextResponse.json({
      total_raised_cents: 0,
      donor_count: 0,
      goal_cents: GOAL_CENTS,
      progress_pct: 0,
      recent_donations: [],
    })
  }
}
