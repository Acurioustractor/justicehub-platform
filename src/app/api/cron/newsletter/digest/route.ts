import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendBatchEmail } from '@/lib/email/send';
import { monthlyDigestTemplate } from '@/content/newsletter-sequences';

/**
 * GET /api/cron/newsletter/digest
 *
 * Monthly newsletter digest — queries live stats from ALMA tables,
 * fills template variables, sends to all active subscribers via Resend.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();

    // Fetch live stats in parallel
    const sb = supabase as any;
    const [evidenceRes, interventionRes, storiesRes, nominationRes] = await Promise.all([
      sb.from('alma_evidence').select('id', { count: 'exact', head: true }),
      sb.from('alma_interventions').select('id', { count: 'exact', head: true })
        .neq('verification_status', 'ai_generated'),
      sb.from('alma_stories').select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      sb.from('campaign_alignment_entities').select('id', { count: 'exact', head: true })
        .eq('alignment_category', 'decision-maker'),
    ]);

    const stats = {
      evidence_count: String(evidenceRes.count || 0),
      intervention_count: String(interventionRes.count || 0),
      new_stories_count: String(storiesRes.count || 0),
      nomination_count: String(nominationRes.count || 0),
      backer_count: '0', // Placeholder until backer tracking is added
    };

    // Fill template
    const template = monthlyDigestTemplate.emails[0];
    let body = template.body;
    for (const [key, value] of Object.entries(stats)) {
      body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    // Get all active subscribers
    const { data: subscribers, error: fetchError } = await supabase
      .from('newsletter_subscriptions')
      .select('email')
      .eq('is_active', true);

    if (fetchError || !subscribers || subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active subscribers',
        stats,
      });
    }

    // Send digest
    const sent = await sendBatchEmail({
      emails: subscribers.map(sub => ({
        to: sub.email,
        subject: template.subject,
        body,
        preheader: template.preheader,
      })),
    });

    return NextResponse.json({
      success: true,
      sent,
      total_subscribers: subscribers.length,
      stats,
    });
  } catch (error: any) {
    console.error('Newsletter digest cron error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
