import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service';
import { sendBatchEmail } from '@/lib/email/send';
import { launchEmail } from '@/content/newsletter-sequences';

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin';
}

/**
 * POST /api/admin/send-campaign
 *
 * Sends the CONTAINED campaign launch email to all active newsletter subscribers.
 * Admin-only. Prevents double-sends via last_campaign_sent_at.
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authClient = await createAuthClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!await isAdmin(authClient, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const dryRun = body.dry_run === true;

    const supabase = createServiceClient();
    const email = launchEmail.emails[0];

    // Get all active subscribers who haven't received this campaign
    const { data: subscribers, error: fetchError }: { data: any[] | null; error: any } = await (supabase as any)
      .from('newsletter_subscriptions')
      .select('id, email, full_name')
      .eq('is_active', true)
      .is('last_campaign_sent_at', null);

    if (fetchError) {
      console.error('Failed to fetch subscribers:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No eligible subscribers (all have received campaign or none active)',
        sent: 0,
      });
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dry_run: true,
        eligible_count: subscribers.length,
        sample_emails: subscribers.slice(0, 5).map(s => s.email),
      });
    }

    // Send batch
    const sent = await sendBatchEmail({
      emails: subscribers.map(sub => ({
        to: sub.email,
        subject: email.subject,
        body: email.body,
        preheader: email.preheader,
      })),
    });

    // Mark subscribers as sent
    if (sent > 0) {
      const now = new Date().toISOString();
      const ids = subscribers.map(s => s.id);
      await (supabase as any)
        .from('newsletter_subscriptions')
        .update({ last_campaign_sent_at: now })
        .in('id', ids);
    }

    return NextResponse.json({
      success: true,
      sent,
      total_eligible: subscribers.length,
    });
  } catch (error: any) {
    console.error('Campaign send error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
