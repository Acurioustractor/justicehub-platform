import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email/send';
import { welcomeSequence } from '@/content/newsletter-sequences';
// Only send welcome drip to subscribers who signed up AFTER this date.
// Prevents blasting existing subscribers when EMAIL_ENABLED is first turned on.
const WELCOME_DRIP_CUTOFF = '2026-03-23T00:00:00Z';

/**
 * GET /api/cron/newsletter/welcome-drip
 *
 * Sends welcome emails #2 (day 3) and #3 (day 7) to NEW subscribers
 * based on their signup date. Runs daily.
 *
 * Safeguards:
 * - Only targets subscribers who signed up after WELCOME_DRIP_CUTOFF
 * - Skips anyone already in GHL with an engagement tier (already in funnel)
 * - Tracks sent emails in metadata to prevent duplicates
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient() as any;
    const now = new Date();
    const results = { email2_sent: 0, email3_sent: 0, skipped_existing: 0, errors: 0 };

    // Only get subscribers who signed up after the cutoff (new subscribers only)
    const { data: subscribers } = await supabase
      .from('newsletter_subscriptions')
      .select('id, email, full_name, subscribed_at, metadata')
      .eq('is_active', true)
      .gte('subscribed_at', WELCOME_DRIP_CUTOFF);

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscribers', ...results });
    }

    // Build a set of emails already synced to GHL (they're past the welcome stage)
    const { data: ghlContacts } = await supabase
      .from('campaign_alignment_entities')
      .select('email')
      .not('ghl_contact_id', 'is', null)
      .not('email', 'is', null);
    const existingGHLEmails = new Set(
      (ghlContacts || []).map((c: { email: string }) => c.email.toLowerCase())
    );

    for (const sub of subscribers) {
      const subscribedAt = new Date(sub.subscribed_at);
      const daysSinceSignup = Math.floor((now.getTime() - subscribedAt.getTime()) / (1000 * 60 * 60 * 24));

      // Track which emails have been sent via metadata
      const sent = sub.metadata?.welcome_emails_sent || [];

      // Skip if already marked as welcome-complete (e.g. imported contact)
      if (sub.metadata?.welcome_drip_complete) {
        results.skipped_existing++;
        continue;
      }

      // Skip if already synced to GHL as a campaign entity — they're past the welcome stage
      if (existingGHLEmails.has(sub.email.toLowerCase())) {
        await supabase
          .from('newsletter_subscriptions')
          .update({ metadata: { ...sub.metadata, welcome_drip_complete: true } })
          .eq('id', sub.id);
        results.skipped_existing++;
        continue;
      }

      // Email #2: day 3
      if (daysSinceSignup >= 3 && daysSinceSignup < 10 && !sent.includes('welcome-2')) {
        const email = welcomeSequence.emails[1];
        const result = await sendEmail({
          to: sub.email,
          subject: email.subject,
          body: email.body,
          preheader: email.preheader,
        });

        if (result) {
          await supabase
            .from('newsletter_subscriptions')
            .update({ metadata: { ...sub.metadata, welcome_emails_sent: [...sent, 'welcome-2'] } })
            .eq('id', sub.id);
          results.email2_sent++;
        } else {
          results.errors++;
        }
      }

      // Email #3: day 7
      if (daysSinceSignup >= 7 && daysSinceSignup < 14 && !sent.includes('welcome-3')) {
        const email = welcomeSequence.emails[2];
        const result = await sendEmail({
          to: sub.email,
          subject: email.subject,
          body: email.body,
          preheader: email.preheader,
        });

        if (result) {
          await supabase
            .from('newsletter_subscriptions')
            .update({ metadata: { ...sub.metadata, welcome_emails_sent: [...sent, 'welcome-2', 'welcome-3'] } })
            .eq('id', sub.id);
          results.email3_sent++;
        } else {
          results.errors++;
        }
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error('Welcome drip cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
