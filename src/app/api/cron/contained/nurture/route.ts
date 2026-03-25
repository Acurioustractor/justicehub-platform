import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email/send';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';
import {
  organizationNurture,
  mediaNurture,
  supporterNurture,
  funderNurture,
  livedExperienceNurture,
  type EmailSequence,
} from '@/content/newsletter-sequences';

// Map role_tag → nurture sequence
const ROLE_SEQUENCES: Record<string, EmailSequence> = {
  contained_organization: organizationNurture,
  contained_media: mediaNurture,
  contained_supporter: supporterNurture,
  contained_funder: funderNurture,
  contained_lived_experience: livedExperienceNurture,
};

/**
 * GET /api/cron/contained/nurture
 *
 * Runs daily at 09:00 UTC. For each CONTAINED member:
 * 1. Determines their role and when they joined
 * 2. Checks which nurture emails they've already received (tracked as member_actions)
 * 3. Sends the next email if enough days have passed
 * 4. Also handles re-engagement: tags inactive members in GHL
 *
 * No GHL workflows needed — this cron IS the automation.
 * Sent emails are tracked as member_actions with action_type = 'nurture_email'.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const ghl = getGHLClient();
  const now = new Date();

  // Get all CONTAINED members
  const { data: members, error } = await (supabase as any)
    .from('public_profiles')
    .select('user_id, role_tags, preferred_name, email, created_at');

  if (error || !members) {
    console.error('[Nurture] Failed to fetch members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }

  // Filter to CONTAINED members only
  const containedMembers = members.filter((m: any) =>
    (m.role_tags || []).some((t: string) => t.startsWith('contained_'))
  );

  let emailsSent = 0;
  let alreadySent = 0;
  let notDueYet = 0;
  let reengaged = 0;
  const errorList: string[] = [];

  for (const member of containedMembers) {
    try {
      const roleTag = (member.role_tags || []).find((t: string) =>
        t.startsWith('contained_')
      );
      if (!roleTag || !member.email) continue;

      const sequence = ROLE_SEQUENCES[roleTag];
      if (!sequence) continue;

      const joinedAt = new Date(member.created_at);
      const daysSinceJoin = Math.floor(
        (now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Get previously sent nurture emails for this user
      const { data: sentActions } = await (supabase as any)
        .from('member_actions')
        .select('metadata')
        .eq('user_id', member.user_id)
        .eq('action_type', 'nurture_email');

      const sentEmailIds = new Set(
        (sentActions || []).map((a: any) => a.metadata?.email_id).filter(Boolean)
      );

      // Find the next unsent email that's due
      let sentThisRun = false;
      for (const email of sequence.emails) {
        if (sentEmailIds.has(email.id)) {
          alreadySent++;
          continue;
        }

        if (daysSinceJoin < email.delayDays) {
          notDueYet++;
          break;
        }

        // Send it
        const result = await sendEmail({
          to: member.email,
          subject: email.subject,
          body: email.body,
          preheader: email.preheader,
          name: member.preferred_name,
          tags: [GHL_TAGS.CONTAINED, roleTag],
          source: `Nurture: ${sequence.name}`,
        });

        if (result) {
          // Track as member_action
          await (supabase as any)
            .from('member_actions')
            .insert({
              user_id: member.user_id,
              action_type: 'nurture_email',
              metadata: {
                email_id: email.id,
                sequence_id: sequence.id,
                subject: email.subject,
                sent_at: now.toISOString(),
              },
            });

          emailsSent++;
          sentThisRun = true;
        }

        // One email per member per run
        break;
      }

      // Re-engagement: all emails sent, 7+ days inactive
      if (!sentThisRun && daysSinceJoin > 14) {
        const allSent = sequence.emails.every(e => sentEmailIds.has(e.id));
        if (allSent && ghl.isConfigured()) {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const { count } = await (supabase as any)
            .from('member_actions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', member.user_id)
            .neq('action_type', 'nurture_email')
            .gte('created_at', sevenDaysAgo.toISOString());

          // Find GHL contact by email
          const contact = await ghl.findContactByEmail(member.email);
          if (contact) {
            if (count === 0) {
              await ghl.addTags(contact.id, [GHL_TAGS.INACTIVE_7D]);
              reengaged++;
            } else {
              await ghl.removeTags(contact.id, [GHL_TAGS.INACTIVE_7D]);
            }
          }
        }
      }
    } catch (err: any) {
      errorList.push(`${member.user_id}: ${err.message}`);
    }
  }

  return NextResponse.json({
    success: true,
    contained_members: containedMembers.length,
    emails_sent: emailsSent,
    already_sent: alreadySent,
    not_due_yet: notDueYet,
    reengaged,
    errors: errorList.length > 0 ? errorList : undefined,
  });
}
