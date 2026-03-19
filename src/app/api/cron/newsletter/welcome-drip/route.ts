import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email/send';
import { welcomeSequence } from '@/content/newsletter-sequences';

/**
 * GET /api/cron/newsletter/welcome-drip
 *
 * Sends welcome emails #2 (day 3) and #3 (day 7) to subscribers
 * based on their signup date. Runs daily.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient() as any;
    const now = new Date();
    const results = { email2_sent: 0, email3_sent: 0, errors: 0 };

    // Get all active subscribers
    const { data: subscribers } = await supabase
      .from('newsletter_subscriptions')
      .select('id, email, full_name, subscribed_at, metadata')
      .eq('is_active', true);

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscribers', ...results });
    }

    for (const sub of subscribers) {
      const subscribedAt = new Date(sub.subscribed_at);
      const daysSinceSignup = Math.floor((now.getTime() - subscribedAt.getTime()) / (1000 * 60 * 60 * 24));

      // Track which emails have been sent via metadata
      const sent = sub.metadata?.welcome_emails_sent || [];

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
