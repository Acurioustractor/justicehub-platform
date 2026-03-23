import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email/send';

const SITE = 'https://justicehub.com.au';

// Follow-up rules: stage → days before auto follow-up
const FOLLOW_UP_RULES: Record<string, { days: number; subject: string; bodyFn: (name: string) => string }> = {
  contacted: {
    days: 7,
    subject: 'Following up — THE CONTAINED',
    bodyFn: (name: string) => `Hey ${name},

Just a quick follow-up on THE CONTAINED. I know you expressed interest and wanted to make sure you had everything you needed.

Quick recap: THE CONTAINED is a shipping container experience that shows what youth detention looks like in Australia — and what 981 verified community programs can do instead. Three rooms. Thirty minutes. Evidence you can feel.

We're currently booking tour stops and looking for hosting partners, funders, and community connectors.

Would be great to grab 15 minutes to chat about what that could look like with you involved.

No pressure. Just a conversation.

— Ben
JusticeHub`,
  },
  proposal_sent: {
    days: 14,
    subject: 'Checking in — CONTAINED partnership',
    bodyFn: (name: string) => `Hey ${name},

Wanted to check in on our conversation about THE CONTAINED. I know these things take time on your end, so no rush.

Just wanted to flag that we're finalising the tour schedule and would love to have you part of it.

Happy to jump on a call whenever suits, or answer any questions via email.

— Ben
JusticeHub`,
  },
  in_discussion: {
    days: 14,
    subject: 'Checking in — CONTAINED partnership',
    bodyFn: (name: string) => `Hey ${name},

Wanted to check in on our conversation about THE CONTAINED. I know these things take time on your end, so no rush.

Just wanted to flag that we're finalising the tour schedule and would love to have you part of it.

Happy to jump on a call whenever suits, or answer any questions via email.

— Ben
JusticeHub`,
  },
};

// Stale detection: these statuses go stale after 30 days
const STALE_STATUSES = ['contacted', 'in_discussion', 'proposal_sent'];

/**
 * GET /api/cron/campaign/pipeline-followup
 *
 * Weekly cron that:
 * 1. Checks partner pipeline for overdue follow-ups
 * 2. Auto-sends follow-up emails (with Ben as reply-to)
 * 3. Marks stale contacts (30+ days inactive)
 * 4. Logs escalations for Ben's attention
 *
 * Runs weekly on Wednesdays.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient() as any;
    const now = new Date();
    const results = {
      follow_ups_sent: 0,
      marked_stale: 0,
      escalations: 0,
      errors: 0,
    };

    // Get all pipeline entities that are in active stages
    const { data: entities, error } = await supabase
      .from('campaign_alignment_entities')
      .select('id, name, email, outreach_status, alignment_signals, updated_at')
      .in('outreach_status', [...STALE_STATUSES, 'nominated'])
      .not('email', 'is', null);

    if (error) {
      console.error('[Pipeline followup] Query error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!entities || entities.length === 0) {
      return NextResponse.json({ success: true, message: 'No pipeline entities to process', ...results });
    }

    for (const entity of entities) {
      const daysSinceUpdate = Math.floor(
        (now.getTime() - new Date(entity.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const signals = entity.alignment_signals || {};
      const followUps = signals.follow_ups || [];

      // Check if we already sent a follow-up this week
      const lastFollowUp = followUps.length > 0
        ? new Date(followUps[followUps.length - 1].sent_at)
        : null;
      const daysSinceLastFollowUp = lastFollowUp
        ? Math.floor((now.getTime() - lastFollowUp.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;

      // Don't send more than one follow-up per week
      if (daysSinceLastFollowUp < 7) continue;

      // Mark as stale if 30+ days inactive
      if (STALE_STATUSES.includes(entity.outreach_status) && daysSinceUpdate >= 30) {
        // Send stale re-engagement email
        if (entity.email && followUps.length < 3) {
          const result = await sendEmail({
            to: entity.email,
            subject: 'Still thinking about THE CONTAINED?',
            replyTo: 'ben@justicehub.com.au',
            body: `Hey ${entity.name || 'there'},

It's been a while since we chatted about THE CONTAINED. I know timing is everything.

Just wanted to let you know the tour is still happening, the evidence is still growing, and we'd still love to have you involved — in whatever capacity makes sense.

No pressure at all. If the timing isn't right, I totally understand. But if you're still interested, I'm here.

→ See what's new: ${SITE}/contained

— Ben
JusticeHub`,
          });

          if (result) {
            followUps.push({
              sent_at: now.toISOString(),
              template: 'stale_reengagement',
              auto: true,
            });
            results.follow_ups_sent++;
          }
        }

        // Update status to stale
        await supabase
          .from('campaign_alignment_entities')
          .update({
            outreach_status: 'stale',
            alignment_signals: { ...signals, follow_ups: followUps, marked_stale_at: now.toISOString() },
          })
          .eq('id', entity.id);

        results.marked_stale++;
        continue;
      }

      // Check if follow-up is due based on stage rules
      const rule = FOLLOW_UP_RULES[entity.outreach_status];
      if (rule && daysSinceUpdate >= rule.days && entity.email) {
        // Max 3 auto follow-ups total
        const autoFollowUps = followUps.filter((f: any) => f.auto);
        if (autoFollowUps.length >= 3) {
          // Escalate to Ben instead
          console.log(`[ESCALATION] ${entity.name} has had 3 auto follow-ups with no response — needs personal touch from Ben`);
          results.escalations++;
          continue;
        }

        const result = await sendEmail({
          to: entity.email,
          subject: rule.subject,
          replyTo: 'ben@justicehub.com.au',
          body: rule.bodyFn(entity.name || 'there'),
        });

        if (result) {
          followUps.push({
            sent_at: now.toISOString(),
            template: rule.subject,
            auto: true,
          });

          await supabase
            .from('campaign_alignment_entities')
            .update({
              alignment_signals: { ...signals, follow_ups: followUps },
              updated_at: now.toISOString(),
            })
            .eq('id', entity.id);

          results.follow_ups_sent++;
        } else {
          results.errors++;
        }
      }
    }

    // Log summary
    console.log(`[Pipeline followup] Sent: ${results.follow_ups_sent}, Stale: ${results.marked_stale}, Escalations: ${results.escalations}`);

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error('[Pipeline followup] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
