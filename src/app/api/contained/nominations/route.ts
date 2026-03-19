import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';
import { sanitizeEmail, sanitizeInput } from '@/lib/security';
import { sendEmail } from '@/lib/email/send';

const SITE = 'https://justicehub.com.au';

/**
 * POST /api/contained/nominations
 *
 * Accepts nominations for THE CONTAINED experience.
 * - Saves to campaign_alignment_entities (or increments existing nominee)
 * - Syncs nominator to GHL
 * - Sends confirmation to nominator
 * - Sends invitation to nominee (if email provided)
 * - Escalates at 3+ nominations for same person
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nominee_name,
      nominee_role,
      nominee_organization,
      nominee_email,
      category,
      nominator_name,
      nominator_email,
      reason,
    } = body;

    // Validate required fields
    if (!nominee_name || !nominator_email || !nominator_name) {
      return NextResponse.json(
        { error: 'Nominee name, nominator name, and nominator email are required' },
        { status: 400 }
      );
    }

    const email = sanitizeEmail(nominator_email);
    if (!email) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const sanitizedNomineeName = sanitizeInput(String(nominee_name), { maxLength: 200, allowNewlines: false });
    const sanitizedNomineeRole = nominee_role ? sanitizeInput(String(nominee_role), { maxLength: 200, allowNewlines: false }) : null;
    const sanitizedNomineeOrg = nominee_organization ? sanitizeInput(String(nominee_organization), { maxLength: 200, allowNewlines: false }) : null;
    const sanitizedNomineeEmail = nominee_email ? sanitizeEmail(nominee_email) : null;
    const sanitizedCategory = category ? sanitizeInput(String(category), { maxLength: 100, allowNewlines: false }) : 'decision-maker';
    const sanitizedNominatorName = sanitizeInput(String(nominator_name), { maxLength: 200, allowNewlines: false });
    const sanitizedReason = reason ? sanitizeInput(String(reason), { maxLength: 2000 }) : null;

    const supabase = createServiceClient() as any;

    // Check if this person has already been nominated (match by name, case-insensitive)
    const { data: existing } = await supabase
      .from('campaign_alignment_entities')
      .select('id, alignment_signals')
      .ilike('name', sanitizedNomineeName)
      .eq('outreach_status', 'nominated')
      .limit(1)
      .single();

    let nominationId: string;
    let nominationCount = 1;

    if (existing) {
      // Increment nomination — add this nominator to the signals
      const signals = existing.alignment_signals || {};
      const nominators = signals.nominators || [];
      nominators.push({
        name: sanitizedNominatorName,
        email,
        reason: sanitizedReason,
        nominated_at: new Date().toISOString(),
      });
      nominationCount = nominators.length;

      await supabase
        .from('campaign_alignment_entities')
        .update({
          alignment_signals: {
            ...signals,
            nominators,
            nomination_count: nominationCount,
            last_nominated_at: new Date().toISOString(),
          },
        })
        .eq('id', existing.id);

      nominationId = existing.id;
    } else {
      // New nomination
      const { data: nomination, error: insertError } = await supabase
        .from('campaign_alignment_entities')
        .insert({
          name: sanitizedNomineeName,
          entity_type: 'individual',
          position: sanitizedNomineeRole,
          organization: sanitizedNomineeOrg,
          alignment_category: sanitizedCategory,
          email: sanitizedNomineeEmail,
          outreach_status: 'nominated',
          alignment_signals: {
            nominators: [{
              name: sanitizedNominatorName,
              email,
              reason: sanitizedReason,
              nominated_at: new Date().toISOString(),
            }],
            nomination_count: 1,
            nomination_type: 'contained_experience',
          },
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Nomination insert error:', insertError);
        return NextResponse.json({ error: 'Failed to save nomination' }, { status: 500 });
      }

      nominationId = nomination?.id;
    }

    // Sync nominator to GHL
    const ghl = getGHLClient();
    if (ghl.isConfigured()) {
      ghl.upsertContact({
        email,
        name: sanitizedNominatorName,
        tags: [GHL_TAGS.NOMINATED, GHL_TAGS.CONTAINED, GHL_TAGS.JUSTICEHUB],
        source: 'JusticeHub CONTAINED Nomination',
        customFields: {
          nominated_person: sanitizedNomineeName,
          nomination_category: sanitizedCategory,
        },
      }).catch(err => console.error('GHL sync error (nomination):', err));
    }

    // Send confirmation email to nominator
    sendEmail({
      to: email,
      subject: 'Your nomination has been received',
      preheader: `You nominated ${sanitizedNomineeName} for THE CONTAINED experience.`,
      body: `Thank you, ${sanitizedNominatorName}.

Your nomination has been received.

You nominated ${sanitizedNomineeName}${sanitizedNomineeOrg ? ` (${sanitizedNomineeOrg})` : ''} to experience THE CONTAINED.

${sanitizedReason ? `Your reason: "${sanitizedReason}"` : ''}

${nominationCount > 1 ? `${nominationCount} people have now nominated ${sanitizedNomineeName}. The pressure is building.` : ''}

WHAT HAPPENS NEXT
Our team reviews every nomination. When THE CONTAINED arrives in their city, we'll reach out with a personal invitation backed by your endorsement.

The more people who nominate the same leader, the harder it is to ignore.

Share the nomination link: ${SITE}/contained#nominate

— The JusticeHub Team`,
    }).catch(err => console.error('Failed to send nominator confirmation:', err));

    // Send invitation to nominee (if we have their email)
    if (sanitizedNomineeEmail) {
      sendEmail({
        to: sanitizedNomineeEmail,
        subject: 'Someone thinks you need to see this',
        preheader: `You've been nominated for THE CONTAINED experience.`,
        body: `${sanitizedNomineeName},

Someone who respects your work has nominated you to experience THE CONTAINED.

${sanitizedNominatorName} believes you should walk through a shipping container that shows what youth detention looks like in Australia — and what actually works instead.

${sanitizedReason ? `They said: "${sanitizedReason}"` : ''}

THE CONTAINED is three rooms. Thirty minutes.

Room 1: The reality of youth detention, designed by young people who know what it feels like.
Room 2: The therapeutic alternative — what happens when you actually fund what works.
Room 3: The community organisation already doing it in your region.

${nominationCount >= 3 ? `${nominationCount} people have nominated you. They believe your voice matters in this conversation.` : ''}

This is not a lecture. It is evidence you can feel.

Learn more: ${SITE}/contained

— The JusticeHub Team

You received this because someone nominated you. You will not receive further emails unless you sign up.`,
      }).catch(err => console.error('Failed to send nominee invitation:', err));
    }

    // Escalation: if 3+ nominations, log for Ben's attention
    if (nominationCount >= 3 && nominationCount % 3 === 0) {
      console.log(`[ESCALATION] ${sanitizedNomineeName} has ${nominationCount} nominations — needs personal outreach from Ben`);
    }

    return NextResponse.json({
      success: true,
      nomination_id: nominationId,
      nomination_count: nominationCount,
    });
  } catch (error: any) {
    console.error('Nomination error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
