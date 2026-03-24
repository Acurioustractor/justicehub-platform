import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendBatchEmail } from '@/lib/email/send';

/**
 * GET /api/cron/newsletter/digest
 *
 * Weekly newsletter digest — pulls the latest pulse_reports briefing
 * and sends to subscribers who weren't reached by the pulse cron.
 *
 * Runs 1 hour after the pulse cron (Sun 23:00 UTC / Mon 9am AEST)
 * as a catch-up for any subscribers in newsletter_subscriptions
 * not covered by vw_newsletter_segments.
 *
 * Previously: monthly digest with hardcoded template.
 * Now: weekly, powered by AI-generated pulse briefings.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient() as any;

    // Get latest weekly pulse report
    const { data: report, error: reportError } = await supabase
      .from('pulse_reports')
      .select('*')
      .eq('report_type', 'weekly')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (reportError || !report) {
      return NextResponse.json({
        success: false,
        message: 'No pulse report found — pulse cron may not have run yet',
      });
    }

    // Check if report is recent (within last 2 hours)
    const reportAge = Date.now() - new Date(report.created_at).getTime();
    const twoHours = 2 * 60 * 60 * 1000;

    if (reportAge > twoHours) {
      return NextResponse.json({
        success: true,
        message: 'Latest pulse report is stale — skipping digest send',
        report_age_hours: Math.round(reportAge / (60 * 60 * 1000)),
      });
    }

    // Get subscribers from the segment view
    const { data: subscribers } = await supabase
      .from('vw_newsletter_segments')
      .select('email, full_name')
      .not('email', 'is', null);

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscribers to send to',
      });
    }

    // Format week label
    const periodStart = new Date(report.period_start);
    const periodEnd = new Date(report.period_end);
    const weekLabel = `${periodStart.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – ${periodEnd.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    const stats = report.stats as Record<string, number>;
    const totalFunding = stats.funding_total_dollars || 0;

    const sent = await sendBatchEmail({
      emails: subscribers.map((sub: { email: string; full_name: string | null }) => ({
        to: sub.email,
        name: sub.full_name || undefined,
        subject: `JusticeHub Weekly Pulse — ${weekLabel}`,
        body: report.briefing,
        preheader: `${stats.new_interventions || 0} programs, ${stats.media_articles || 0} articles, $${(totalFunding / 1_000_000).toFixed(1)}M tracked`,
      })),
      tags: ['pulse-weekly-digest'],
      source: 'newsletter_digest_cron',
    });

    return NextResponse.json({
      success: true,
      sent,
      total_subscribers: subscribers.length,
      report_id: report.id,
    });
  } catch (error: unknown) {
    console.error('Newsletter digest cron error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
